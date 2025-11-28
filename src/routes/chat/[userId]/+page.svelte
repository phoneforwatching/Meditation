<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { page } from "$app/stores";
    import { afterUpdate } from "svelte";

    export let data;

    let messages = data.initialMessages;
    let newMessage = "";
    let chatContainer: HTMLElement;
    let pollInterval: any;

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

        // Poll for new messages every 3 seconds
        pollInterval = setInterval(async () => {
            const res = await fetch(
                `/api/messages?userId=${data.otherUser.id}`,
            );
            if (res.ok) {
                const latestMessages = await res.json();
                // Check if we have new messages OR if read status changed
                // Simple comparison of length or last message status
                const hasNew = latestMessages.length !== messages.length;
                const lastMsgChanged =
                    latestMessages.length > 0 &&
                    messages.length > 0 &&
                    latestMessages[latestMessages.length - 1].isRead !==
                        messages[messages.length - 1].isRead;

                if (hasNew || lastMsgChanged) {
                    messages = latestMessages.map((m: any) => ({
                        ...m,
                        createdAt: m.createdAt ? new Date(m.createdAt) : null,
                    }));

                    if (hasNew) {
                        // Only mark as read if we actually got new messages from them
                        const lastMsg =
                            latestMessages[latestMessages.length - 1];
                        if (
                            lastMsg.senderId === data.otherUser.id &&
                            !lastMsg.isRead
                        ) {
                            markAsRead();
                        }
                    }
                }
            }
        }, 3000);
    });

    onDestroy(() => {
        if (pollInterval) clearInterval(pollInterval);
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
            alert("Failed to send message");
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
    class="flex flex-col h-[calc(100vh-6rem)] max-w-2xl mx-auto bg-white/50 backdrop-blur-sm shadow-sm border border-white/20 rounded-2xl overflow-hidden my-4"
>
    <!-- Header -->
    <div
        class="bg-white/80 p-4 border-b border-slate/10 flex items-center gap-3"
    >
        <a href="/chat" class="text-slate/60 hover:text-sage transition-colors">
            ← Back
        </a>
        <div class="font-bold text-slate text-lg">
            {data.otherUser.displayName || "User"}
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
                                title={msg.isRead ? "Read" : "Sent"}
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
                Start the conversation with {data.otherUser.displayName}!
            </div>
        {/if}
    </div>

    <!-- Input -->
    <div class="p-4 bg-white/80 border-t border-slate/10">
        <div class="flex gap-2">
            <input
                type="text"
                bind:value={newMessage}
                on:keydown={handleKeydown}
                placeholder="Type a message..."
                class="flex-1 bg-slate-50 border-transparent focus:border-sage focus:ring-sage rounded-xl px-4 py-2 transition-all"
            />
            <button
                on:click={sendMessage}
                disabled={!newMessage.trim()}
                class="bg-sage text-white px-4 py-2 rounded-xl font-bold hover:bg-sage/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Send
            </button>
        </div>
    </div>
</div>
