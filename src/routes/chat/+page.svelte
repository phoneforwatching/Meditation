<script lang="ts">
    import { t } from "$lib/i18n";
    export let data;
</script>

<div class="min-h-[80vh] flex flex-col max-w-2xl mx-auto w-full px-4">
    <div class="text-center space-y-2 mb-8 mt-8">
        <h1 class="text-4xl font-bold text-sage">Messages</h1>
        <p class="text-slate/60">Your recent conversations</p>
    </div>

    <div
        class="bg-white/50 backdrop-blur-sm rounded-2xl shadow-sm border border-white/20 overflow-hidden"
    >
        {#if data.conversations.length === 0}
            <div class="p-8 text-center text-slate/60">
                <p>No messages yet.</p>
                <a
                    href="/community"
                    class="text-sage font-bold hover:underline mt-2 inline-block"
                >
                    Find someone to chat with
                </a>
            </div>
        {:else}
            <div class="divide-y divide-slate/10">
                {#each data.conversations as conv}
                    <a
                        href="/chat/{conv.otherUserId}"
                        class="block p-4 hover:bg-white/60 transition-colors {conv.isUnread
                            ? 'bg-blue-50/50'
                            : ''}"
                    >
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <div
                                    class="font-bold text-slate {conv.isUnread
                                        ? 'text-blue-900'
                                        : ''}"
                                >
                                    {conv.otherUserName || "Unknown User"}
                                </div>
                                {#if conv.isUnread}
                                    <div
                                        class="w-2 h-2 rounded-full bg-blue-500"
                                    ></div>
                                {/if}
                            </div>
                            <div class="text-xs text-slate/40">
                                {conv.createdAt
                                    ? new Date(
                                          conv.createdAt,
                                      ).toLocaleDateString()
                                    : ""}
                            </div>
                        </div>
                        <div
                            class="text-sm text-slate/60 truncate mt-1 {conv.isUnread
                                ? 'font-semibold text-slate/80'
                                : ''}"
                        >
                            {#if conv.senderId === data.user.id}
                                <span class="text-slate/40 font-normal"
                                    >You:</span
                                >
                            {/if}
                            {conv.content}
                        </div>
                    </a>
                {/each}
            </div>
        {/if}
    </div>

    <div class="mt-8 text-center">
        <a
            href="/community"
            class="bg-sage text-white px-6 py-3 rounded-xl font-bold hover:bg-sage/90 transition-colors shadow-lg shadow-sage/20"
        >
            Start New Chat
        </a>
    </div>
</div>
