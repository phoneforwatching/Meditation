<script lang="ts">
  import { getTreeStage } from "$lib/tree";
  import { fade, fly } from "svelte/transition";
  import { t } from "$lib/i18n";
  export let data;

  // Podium constants removed as per redesign

  let nudgedUsers = new Set<number>();

  // Check-in State
  let showCheckinModal = false;
  let checkinPhoto: File | null = null;
  let checkinPhotoPreview: string | null = null;
  let checkinMood = 3;
  let checkinCaption = "";
  let isSubmitting = false;
  let viewingStory: any = null;
  let selectedUserForAction: any = null;

  const MOODS: Record<number, string> = {
    1: "😫",
    2: "😕",
    3: "😐",
    4: "🙂",
    5: "😊",
  };

  const MOOD_COLORS: Record<number, string> = {
    1: "border-red-400",
    2: "border-orange-400",
    3: "border-slate-400",
    4: "border-blue-400",
    5: "border-green-400",
  };

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No 2d context"));
          return;
        }

        // Max dimensions
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error("Canvas to Blob failed"));
            }
          },
          "image/jpeg",
          0.8,
        ); // 0.8 quality
      };
      img.onerror = (e) => reject(e);
    });
  }

  async function handlePhotoSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const originalFile = input.files[0];
        // Show preview immediately with original
        checkinPhotoPreview = URL.createObjectURL(originalFile);

        // Compress in background
        checkinPhoto = await compressImage(originalFile);
      } catch (err) {
        console.error("Compression failed", err);
        // Fallback to original if compression fails
        checkinPhoto = input.files[0];
      }
    }
  }

  async function submitCheckin() {
    if (!checkinPhoto && !checkinCaption) return;
    isSubmitting = true;

    const formData = new FormData();
    if (checkinPhoto) {
      formData.append("photo", checkinPhoto);
    }
    formData.append("mood", checkinMood.toString());
    formData.append("caption", checkinCaption);

    try {
      const res = await fetch("/api/community/checkin", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        showCheckinModal = false;
        window.location.reload(); // Refresh to see new check-in
      } else {
        alert("Failed to post check-in");
      }
    } catch (e) {
      console.error(e);
      alert("Error posting check-in");
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-[80vh] flex flex-col">
  <div class="text-center space-y-2 mb-8">
    <h1 class="text-4xl font-bold text-sage">{$t("community.title")}</h1>
    <p class="text-slate/60">{$t("community.subtitle")}</p>
  </div>

  <!-- Forest Scene Container -->
  <div class="flex-1 relative pb-12 min-h-[60vh]">
    <!-- Sky/Background -->
    <div
      class="absolute inset-0 pointer-events-none bg-gradient-to-b from-blue-50/50 to-transparent -z-10"
    ></div>

    <!-- Ground Gradient (Subtle) -->
    <div
      class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-earth/10 to-transparent pointer-events-none"
    ></div>

    <!-- Trees Container -->
    <div
      class="flex flex-wrap justify-center items-end gap-x-8 gap-y-12 px-4 md:px-12 py-12 max-w-7xl mx-auto"
    >
      {#each data.leaderboard as user, i}
        {@const stage = getTreeStage(user.totalMinutes || 0)}
        {@const isMe = user.id === data.currentUserId}

        <div
          class="flex flex-col items-center relative group transition-all duration-500 hover:-translate-y-2 cursor-pointer"
          in:fly={{ y: 50, duration: 500, delay: i * 30 }}
          role="button"
          tabindex="0"
          on:click={() => !isMe && (selectedUserForAction = user)}
          on:keydown={(e) =>
            e.key === "Enter" && !isMe && (selectedUserForAction = user)}
        >
          <!-- Tree -->
          <div
            class="relative z-10 text-center transform transition-transform group-hover:scale-110"
          >
            <!-- Daily Check-in Bubble -->
            {#if user.checkinPhoto || user.checkinCaption}
              <div
                class="absolute -top-24 left-1/2 -translate-x-1/2 z-20 animate-bounce-short flex flex-col items-center"
              >
                <!-- Note Bubble (IG Style) -->
                {#if user.checkinCaption}
                  <div
                    class="mb-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl shadow-sm border border-slate/10 text-xs font-medium text-slate-700 max-w-[120px] truncate relative group/note cursor-pointer hover:scale-105 transition-transform"
                    title={user.checkinCaption}
                    role="button"
                    tabindex="0"
                    on:click|stopPropagation={() => (viewingStory = user)}
                    on:keydown={(e) =>
                      e.key === "Enter" && (viewingStory = user)}
                  >
                    {user.checkinCaption}
                    <!-- Little triangle pointing down -->
                    <div
                      class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white/90 rotate-45 border-b border-r border-slate/10"
                    ></div>
                  </div>
                {/if}

                {#if user.checkinPhoto}
                  <div
                    class="relative group/bubble cursor-pointer transition-transform hover:scale-105 active:scale-95"
                    on:click|stopPropagation={() => (viewingStory = user)}
                    role="button"
                    tabindex="0"
                    on:keydown={(e) =>
                      e.key === "Enter" && (viewingStory = user)}
                  >
                    <img
                      src={user.checkinPhoto}
                      alt="Check-in"
                      class="w-20 h-20 rounded-full object-cover border-4 {user.checkinMood
                        ? MOOD_COLORS[user.checkinMood]
                        : 'border-white'} shadow-lg bg-white"
                    />
                    {#if user.checkinMood}
                      <div
                        class="absolute -bottom-1 -right-1 text-sm bg-white rounded-full w-5 h-5 flex items-center justify-center shadow-sm"
                      >
                        {MOODS[user.checkinMood]}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
            {/if}

            <div
              class="text-6xl filter drop-shadow-lg transition-all duration-500"
              style="font-size: {Math.max(
                3,
                Math.min(8, 3 + (user.totalMinutes || 0) / 100),
              )}rem"
            >
              {stage.symbol}
            </div>

            <!-- Hover Stats Tooltip -->
            <div
              class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white text-slate text-xs px-3 py-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-earth/10"
            >
              <div class="font-bold text-sage">
                {user.totalMinutes}
                {$t("stats.minutes")}
              </div>
              <div class="text-slate/60">{$t(`tree.${stage.id}.name`)}</div>
            </div>
          </div>

          <!-- User Info -->
          <div class="mt-2 text-center space-y-1">
            <div
              class="font-semibold text-slate text-xs flex items-center justify-center gap-1.5 bg-white/40 px-2 py-0.5 rounded-full backdrop-blur-sm transition-colors group-hover:bg-white/80"
            >
              {#if user.avatarUrl}
                <img
                  src={user.avatarUrl}
                  alt={user.displayName}
                  class="w-5 h-5 rounded-full object-cover border border-white/50"
                />
              {:else}
                <div
                  class="w-5 h-5 rounded-full bg-sage/20 flex items-center justify-center text-[10px] border border-white/50"
                >
                  {(user.displayName || "A")[0].toUpperCase()}
                </div>
              {/if}
              <span class="max-w-[80px] truncate"
                >{user.displayName || "Anonymous"}</span
              >
              {#if isMe}
                <span class="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"
                ></span>
              {/if}
            </div>

            <!-- Actions (Only visible on hover/focus to keep forest clean) -->
            <div
              class="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              {#if !isMe && !nudgedUsers.has(user.id)}
                <button
                  class="text-lg hover:scale-125 active:scale-95 transition-transform"
                  title="{$t('community.nudge')} {user.displayName}"
                  on:click={async (e) => {
                    const btn = e.currentTarget;
                    // Optimistic update
                    nudgedUsers.add(user.id);
                    nudgedUsers = nudgedUsers; // Trigger reactivity

                    import("$lib/haptics").then(
                      ({ vibrate, HAPTIC_PATTERNS }) =>
                        vibrate(HAPTIC_PATTERNS.TAP),
                    );

                    const res = await fetch("/api/nudge", {
                      method: "POST",
                      body: JSON.stringify({ receiverId: user.id }),
                      headers: { "Content-Type": "application/json" },
                    });

                    if (res.ok) {
                      import("$lib/haptics").then(
                        ({ vibrate, HAPTIC_PATTERNS }) =>
                          vibrate(HAPTIC_PATTERNS.SUCCESS),
                      );
                    } else {
                      // Revert on failure
                      nudgedUsers.delete(user.id);
                      nudgedUsers = nudgedUsers;

                      import("$lib/haptics").then(
                        ({ vibrate, HAPTIC_PATTERNS }) =>
                          vibrate(HAPTIC_PATTERNS.WARNING),
                      );
                      const d = await res.json();
                      alert(d.error);
                    }
                  }}
                >
                  👋
                </button>
              {/if}

              {#if !isMe}
                <a
                  href="/chat/{user.id}"
                  class="text-lg hover:scale-125 active:scale-95 transition-transform"
                  title="Message {user.displayName}"
                >
                  💬
                </a>
              {/if}
            </div>
          </div>
        </div>
      {/each}

      {#if data.leaderboard.length === 0}
        <div class="w-full text-center text-slate/40 text-lg py-20">
          {$t("community.empty")}
        </div>
      {/if}
    </div>
  </div>

  <!-- Check-in Button -->
  <button
    class="fixed bottom-24 right-6 bg-sage text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform z-40 flex items-center gap-2"
    on:click={() => (showCheckinModal = true)}
  >
    <span class="text-2xl">📸</span>
    <span class="font-bold hidden md:inline">{$t("community.checkin")}</span>
  </button>

  <!-- Check-in Modal -->
  {#if showCheckinModal}
    <div
      class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      transition:fade
    >
      <div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-6 relative">
        <button
          class="absolute top-4 right-4 text-slate/40 hover:text-slate"
          on:click={() => (showCheckinModal = false)}
        >
          ✕
        </button>

        <h2 class="text-2xl font-bold text-sage text-center">
          {$t("community.checkin")}
        </h2>

        <div class="space-y-4">
          <!-- Photo Upload -->
          <div class="flex justify-center">
            <label
              class="w-48 h-48 rounded-full border-2 border-dashed border-slate/20 flex flex-col items-center justify-center cursor-pointer hover:bg-slate/5 transition relative overflow-hidden bg-slate-50"
            >
              {#if checkinPhotoPreview}
                <img
                  src={checkinPhotoPreview}
                  alt="Preview"
                  class="absolute inset-0 w-full h-full object-cover"
                />
              {:else}
                <span class="text-4xl mb-2">📷</span>
                <span class="text-sm text-slate/60"
                  >{$t("community.photo")}</span
                >
              {/if}
              <input
                type="file"
                accept="image/*"
                capture="user"
                class="hidden"
                on:change={handlePhotoSelect}
              />
            </label>
          </div>

          <!-- Mood Selector -->
          <div class="space-y-2">
            <div class="block text-sm font-medium text-slate text-center">
              {$t("community.mood")}
            </div>
            <div class="flex justify-between px-2">
              {#each [1, 2, 3, 4, 5] as m}
                <button
                  class="text-3xl transition-transform hover:scale-125 {checkinMood ===
                  m
                    ? 'scale-125 grayscale-0'
                    : 'grayscale opacity-50'}"
                  on:click={() => (checkinMood = m)}
                >
                  {MOODS[m]}
                </button>
              {/each}
            </div>
          </div>

          <!-- Caption -->
          <input
            type="text"
            placeholder={$t("community.placeholder")}
            bind:value={checkinCaption}
            class="w-full rounded-lg border-slate/20 focus:border-sage focus:ring-sage"
          />

          <button
            class="w-full bg-sage text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-50"
            disabled={(!checkinPhoto && !checkinCaption) || isSubmitting}
            on:click={submitCheckin}
          >
            {isSubmitting ? $t("community.posting") : $t("community.post")}
          </button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Story Viewer Modal -->
  {#if viewingStory}
    <div
      class="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4"
      transition:fade={{ duration: 200 }}
      role="button"
      tabindex="0"
      on:click|self={() => (viewingStory = null)}
      on:keydown={(e) => e.key === "Escape" && (viewingStory = null)}
    >
      <button
        class="absolute top-4 right-4 text-white/60 hover:text-white text-4xl z-50"
        on:click={() => (viewingStory = null)}
      >
        ✕
      </button>

      <div
        class="relative w-full max-w-lg aspect-[9/16] max-h-[90vh] flex flex-col"
      >
        <!-- Story Content -->
        <div
          class="relative flex-1 rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10"
        >
          <!-- Progress Bar (Static for now) -->
          <div
            class="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20 m-2 rounded-full overflow-hidden"
          >
            <div
              class="h-full bg-white w-full animate-[progress_5s_linear]"
            ></div>
          </div>

          <!-- Header -->
          <div
            class="absolute top-4 left-0 right-0 p-4 flex items-center gap-3 z-20 bg-gradient-to-b from-black/50 to-transparent"
          >
            {#if viewingStory.avatarUrl}
              <img
                src={viewingStory.avatarUrl}
                alt={viewingStory.displayName}
                class="w-10 h-10 rounded-full border border-white/50"
              />
            {:else}
              <div
                class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold border border-white/50"
              >
                {(viewingStory.displayName || "A")[0].toUpperCase()}
              </div>
            {/if}
            <div class="text-white">
              <div class="font-bold text-sm shadow-black drop-shadow-md">
                {viewingStory.displayName}
              </div>
              <div class="text-xs opacity-80 flex items-center gap-1">
                <span>{MOODS[viewingStory.checkinMood]}</span>
                <span>•</span>
                <span>{$t("community.justNow")}</span>
              </div>
            </div>
          </div>

          <!-- Main Image -->
          <img
            src={viewingStory.checkinPhoto}
            alt="Story"
            class="absolute inset-0 w-full h-full object-cover"
          />

          <!-- Caption Overlay -->
          {#if viewingStory.checkinCaption}
            <div
              class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20"
            >
              <p
                class="text-white text-lg text-center font-medium drop-shadow-md"
              >
                {viewingStory.checkinCaption}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  <!-- User Action Modal -->
  {#if selectedUserForAction}
    <div
      class="fixed inset-0 z-[70] bg-black/50 flex items-end sm:items-center justify-center p-4"
      transition:fade={{ duration: 200 }}
      role="button"
      tabindex="0"
      on:click|self={() => (selectedUserForAction = null)}
      on:keydown={(e) => e.key === "Escape" && (selectedUserForAction = null)}
    >
      <div
        class="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-300"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="text-center space-y-2">
          {#if selectedUserForAction.avatarUrl}
            <img
              src={selectedUserForAction.avatarUrl}
              alt={selectedUserForAction.displayName}
              class="w-20 h-20 rounded-full mx-auto object-cover border-4 border-sage/20"
            />
          {:else}
            <div
              class="w-20 h-20 rounded-full bg-sage/20 flex items-center justify-center text-3xl font-bold text-sage mx-auto border-4 border-sage/10"
            >
              {(selectedUserForAction.displayName || "A")[0].toUpperCase()}
            </div>
          {/if}
          <div>
            <h3 class="text-xl font-bold text-slate-800">
              {selectedUserForAction.displayName || "Anonymous"}
            </h3>
            <p class="text-slate-500 text-sm">
              {selectedUserForAction.totalMinutes || 0}
              {$t("stats.minutes")} • {$t(
                `tree.${getTreeStage(selectedUserForAction.totalMinutes || 0).id}.name`,
              )}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-2 gap-4">
          {#if !nudgedUsers.has(selectedUserForAction.id)}
            <button
              class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
              on:click={async () => {
                const user = selectedUserForAction;
                if (!user) return;

                // Optimistic update
                nudgedUsers.add(user.id);
                nudgedUsers = nudgedUsers;
                selectedUserForAction = null; // Close modal

                import("$lib/haptics").then(({ vibrate, HAPTIC_PATTERNS }) =>
                  vibrate(HAPTIC_PATTERNS.TAP),
                );

                const res = await fetch("/api/nudge", {
                  method: "POST",
                  body: JSON.stringify({ receiverId: user.id }),
                  headers: { "Content-Type": "application/json" },
                });

                if (res.ok) {
                  import("$lib/haptics").then(({ vibrate, HAPTIC_PATTERNS }) =>
                    vibrate(HAPTIC_PATTERNS.SUCCESS),
                  );
                } else {
                  nudgedUsers.delete(user.id);
                  nudgedUsers = nudgedUsers;
                  const d = await res.json();
                  alert(d.error);
                }
              }}
            >
              <span class="text-3xl">👋</span>
              <span class="font-bold">{$t("community.nudge")}</span>
            </button>
          {:else}
            <div
              class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 text-slate-400 cursor-not-allowed"
            >
              <span class="text-3xl">👋</span>
              <span class="font-bold">{$t("community.nudged")}</span>
            </div>
          {/if}

          <a
            href="/chat/{selectedUserForAction.id}"
            class="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            on:click={() => (selectedUserForAction = null)}
          >
            <span class="text-3xl">💬</span>
            <span class="font-bold">{$t("community.message")}</span>
          </a>
        </div>

        <!-- Close -->
        <button
          class="w-full py-3 text-slate-400 font-medium hover:text-slate-600 transition-colors"
          on:click={() => (selectedUserForAction = null)}
        >
          {$t("common.cancel")}
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
</style>
