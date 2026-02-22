<script lang="ts">
  import { t } from "$lib/i18n";
  export let data;
</script>

<div class="min-h-[80vh] w-full max-w-2xl mx-auto px-4 pt-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
  <div class="mb-6 space-y-2 text-center">
    <h1 class="text-3xl sm:text-4xl font-bold text-sage">{$t("chat.title")}</h1>
    <p class="text-slate/70">{$t("chat.subtitle")}</p>
  </div>

  <div
    class="overflow-hidden rounded-2xl border border-white/20 bg-white/55 shadow-sm backdrop-blur-sm"
  >
    {#if data.conversations.length === 0}
      <div class="p-8 text-center text-slate/70">
        <p>{$t("chat.empty")}</p>
        <a
          href="/community"
          class="mt-3 inline-flex min-h-11 items-center rounded-lg bg-sage/10 px-4 py-2 font-semibold text-sage transition-colors hover:bg-sage/15"
        >
          {$t("chat.findPeople")}
        </a>
      </div>
    {:else}
      <div class="divide-y divide-slate/10">
        {#each data.conversations as conv}
          <a
            href="/chat/{conv.otherUserId}"
            class="block min-h-11 p-4 transition-colors hover:bg-white/60 {conv.isUnread
              ? 'bg-blue-50/50'
              : ''}"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div
                  class="font-bold text-slate {conv.isUnread
                    ? 'text-blue-900'
                    : ''}"
                >
                  {conv.otherUserName || $t("chat.unknownUser")}
                </div>
                {#if conv.isUnread}
                  <div class="h-2 w-2 rounded-full bg-blue-500"></div>
                {/if}
              </div>
              <div class="text-xs text-slate/50">
                {conv.createdAt
                  ? new Date(conv.createdAt).toLocaleDateString()
                  : ""}
              </div>
            </div>
            <div
              class="mt-1 truncate text-sm text-slate/70 {conv.isUnread
                ? 'font-semibold text-slate/90'
                : ''}"
            >
              {#if conv.senderId === data.user.id}
                <span class="font-normal text-slate/50">{$t("chat.you")}:</span>
              {/if}
              {conv.content}
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <div class="mt-6 text-center">
    <a
      href="/community"
      class="inline-flex min-h-11 items-center rounded-xl bg-sage px-6 py-3 font-bold text-white shadow-lg shadow-sage/20 transition-colors hover:bg-sage/90"
    >
      {$t("chat.startNew")}
    </a>
  </div>
</div>
