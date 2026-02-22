<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { afterUpdate } from "svelte";
    import { t } from "$lib/i18n";

    export let data;

    let messages = data.initialMessages;
    let newMessage = "";
    let chatContainer: HTMLElement;
    import { supabase } from "$lib/supabaseClient";

    let subscription: any;

    function scrollToBottom() {
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    afterUpdate(() => {
        scrollToBottom();
    });

    async function markAsRead() {
        await fetch("/api/messages/read", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId: data.otherUser.id }),
        });
    }

    onMount(() => {
        scrollToBottom();
        markAsRead();

        // Subscribe to Supabase Realtime
        subscription = supabase
            .channel(`chat:${data.currentUserId}:${data.otherUser.id}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    if (payload.eventType === "INSERT") {
                        const newMsg = payload.new;
                        // Check if message belongs to this conversation
                        if (
                            (newMsg.sender_id === data.otherUser.id &&
                                newMsg.receiver_id === data.currentUserId) ||
                            (newMsg.sender_id === data.currentUserId &&
                                newMsg.receiver_id === data.otherUser.id)
                        ) {
                            const msg = {
                                id: newMsg.id,
                                senderId: newMsg.sender_id,
                                receiverId: newMsg.receiver_id,
                                content: newMsg.content,
                                createdAt: new Date(newMsg.created_at),
                                isRead: newMsg.is_read,
                            };
                            messages = [...messages, msg];
                            scrollToBottom();

                            if (msg.senderId === data.otherUser.id) {
                                markAsRead();
                            }
                        }
                    } else if (payload.eventType === "UPDATE") {
                        const updatedMsg = payload.new;
                        messages = messages.map((m) =>
                            m.id === updatedMsg.id
                                ? {
                                      ...m,
                                      isRead: updatedMsg.is_read,
                                      createdAt: new Date(
                                          updatedMsg.created_at,
                                      ),
                                  }
                                : m,
                        );
                    }
                },
            )
            .subscribe();
    });

    onDestroy(() => {
        if (subscription) supabase.removeChannel(subscription);
    });

    async function sendMessage() {
        if (!newMessage.trim()) return;

        const content = newMessage;
        newMessage = ""; // Clear input immediately

        // Optimistic update
        const optimisticMsg = {
            id: -1, // Temp ID
            senderId: data.currentUserId,
            receiverId: data.otherUser.id,
            content: content,
            createdAt: new Date(), // Use Date object to match initial data
            isRead: false,
        };
        // @ts-ignore - mixed types of Date and string from API
        messages = [...messages, optimisticMsg];

        const res = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                receiverId: data.otherUser.id,
                content: content,
            }),
        });

        if (!res.ok) {
            // Handle error (remove optimistic message, show alert, etc.)
            alert($t("chat.sendFailed"));
            messages = messages.filter((m) => m !== optimisticMsg);
            newMessage = content; // Restore input
        } else {
            // Refresh messages to get the real ID and timestamp
            const refreshRes = await fetch(
                `/api/messages?userId=${data.otherUser.id}`,
            );
            if (refreshRes.ok) {
                const newMsgs = await refreshRes.json();
                // Convert strings to Dates to match type
                messages = newMsgs.map((m: any) => ({
                    ...m,
                    createdAt: m.createdAt ? new Date(m.createdAt) : null,
                }));
            }
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
</script>

<div
    class="my-4 flex max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white/50 shadow-sm backdrop-blur-sm"
    style="height: calc(100dvh - 7rem);"
>
    <!-- Header -->
    <div
        class="bg-white/80 p-4 border-b border-slate/10 flex items-center gap-3"
    >
        <a href="/chat" class="inline-flex min-h-11 items-center text-slate/70 hover:text-sage transition-colors">
            ← {$t("chat.back")}
        </a>
        <div class="font-bold text-slate text-lg">
            {data.otherUser.displayName || $t("chat.unknownUser")}
        </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={chatContainer}>
        {#each messages as msg}
            <div
                class="flex {msg.senderId === data.currentUserId
                    ? 'justify-end'
                    : 'justify-start'}"
            >
                <div
                    class="max-w-[70%] rounded-2xl px-4 py-2 {msg.senderId ===
                    data.currentUserId
                        ? 'bg-sage text-white rounded-br-none'
                        : 'bg-white text-slate rounded-bl-none shadow-sm'}"
                >
                    <div class="break-words">{msg.content}</div>
                    <div class="flex items-center justify-end gap-1 mt-1">
                        <div class="text-[10px] opacity-60">
                            {msg.createdAt
                                ? new Date(msg.createdAt).toLocaleTimeString(
                                      [],
                                      { hour: "2-digit", minute: "2-digit" },
                                  )
                                : ""}
                        </div>
                        {#if msg.senderId === data.currentUserId}
                            <div
                                class="text-[10px] opacity-60"
                                title={msg.isRead ? $t("chat.read") : $t("chat.sent")}
                            >
                                {msg.isRead ? "✓✓" : "✓"}
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}

        {#if messages.length === 0}
            <div class="text-center text-slate/40 mt-10">
                {$t("chat.startConversation")} {data.otherUser.displayName || $t("chat.unknownUser")}!
            </div>
        {/if}
    </div>

    <!-- Input -->
    <div class="border-t border-slate/10 bg-white/80 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div class="flex gap-2">
            <input
                type="text"
                bind:value={newMessage}
                on:keydown={handleKeydown}
                placeholder={$t("chat.typePlaceholder")}
                class="min-h-11 flex-1 rounded-xl border border-transparent bg-slate-50 px-4 py-2 transition-all focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
            />
            <button
                on:click={sendMessage}
                disabled={!newMessage.trim()}
                class="min-h-11 rounded-xl bg-sage px-4 py-2 font-bold text-white transition-colors hover:bg-sage/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {$t("chat.send")}
            </button>
        </div>
    </div>
</div>
