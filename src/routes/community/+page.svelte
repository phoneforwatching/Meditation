<script lang="ts">
  import { getTreeStage } from "$lib/tree";
  import { fade, fly } from "svelte/transition";
  import { locale, t } from "$lib/i18n";
  import { onMount } from "svelte";
  export let data;

  // Podium constants removed as per redesign

  let nudgedUsers = new Set<number>();
  let particles: Array<{x: number, y: number, size: number, speed: number, opacity: number}> = [];
  let timeOfDay = "day";
  let forestAmbience = "calm";
  let showSoundControls = false;
  let forestSoundPlaying = false;
  let soundVolume = 0.5;
  type SoundPresetId = "forest" | "rain" | "ocean" | "relaxing";
  const SOUND_PRESETS: Record<SoundPresetId, { src: string; icon: string }> = {
    forest: { src: "/music/forest.mp3", icon: "🌲" },
    rain: { src: "/music/rain.mp3", icon: "🌧️" },
    ocean: { src: "/music/ocean.mp3", icon: "🌊" },
    relaxing: { src: "/music/relaxing.mp3", icon: "🎼" },
  };
  let selectedSoundPreset: SoundPresetId = "forest";
  let ambientAudio: HTMLAudioElement | null = null;
  let soundStatusMessage = "";

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

  function getTimeOfDayLabel(value: string) {
    if (value === "morning") return $t("community.timeMorning");
    if (value === "afternoon") return $t("community.timeAfternoon");
    if (value === "evening") return $t("community.timeEvening");
    if (value === "night") return $t("community.timeNight");
    return value;
  }

  function getAmbienceLabel(value: string) {
    if (value === "calm") return $t("community.ambienceCalm");
    if (value === "serene") return $t("community.ambienceSerene");
    if (value === "energetic") return $t("community.ambienceEnergetic");
    if (value === "peaceful") return $t("community.ambiencePeaceful");
    return value;
  }

  function getDisplayName(user: { displayName?: string | null }) {
    return user.displayName || $t("community.anonymous");
  }

  function clearCheckinPreview() {
    if (checkinPhotoPreview) {
      URL.revokeObjectURL(checkinPhotoPreview);
      checkinPhotoPreview = null;
    }
  }

  function ensureAmbientAudio() {
    if (ambientAudio) return ambientAudio;
    ambientAudio = new Audio(SOUND_PRESETS[selectedSoundPreset].src);
    ambientAudio.loop = true;
    ambientAudio.preload = "auto";
    ambientAudio.volume = soundVolume;
    return ambientAudio;
  }

  async function setAmbientPlayback(shouldPlay: boolean) {
    const audio = ensureAmbientAudio();
    audio.volume = soundVolume;
    forestSoundPlaying = shouldPlay;

    if (!shouldPlay) {
      audio.pause();
      soundStatusMessage = "";
      return;
    }

    try {
      await audio.play();
      soundStatusMessage = "";
    } catch (error) {
      forestSoundPlaying = false;
      soundStatusMessage = $t("community.audioBlocked");
      console.error("Ambient sound play failed:", error);
    }
  }

  function toggleAmbientSound() {
    void setAmbientPlayback(!forestSoundPlaying);
  }

  function applySoundPreset(preset: SoundPresetId, volume: number) {
    selectedSoundPreset = preset;
    soundVolume = volume;

    const audio = ensureAmbientAudio();
    audio.pause();
    audio.src = SOUND_PRESETS[preset].src;
    audio.load();
    void setAmbientPlayback(true);
  }

  $: if (ambientAudio) {
    ambientAudio.volume = soundVolume;
  }

  // Initialize particles for forest ambiance
  onMount(() => {
    // Create floating particles
    for (let i = 0; i < 30; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.3 + 0.1
      });
    }

    // Change time of day based on actual time
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
      timeOfDay = "night";
      forestAmbience = "serene";
    } else if (hour >= 6 && hour < 12) {
      timeOfDay = "morning";
      forestAmbience = "energetic";
    } else if (hour >= 12 && hour < 15) {
      timeOfDay = "afternoon";
      forestAmbience = "peaceful";
    } else {
      timeOfDay = "evening";
      forestAmbience = "calm";
    }

    // Animate particles
    let animationFrameId = 0;
    const animateParticles = () => {
      particles = particles.map(p => ({
        ...p,
        y: (p.y + p.speed) % 100,
        x: (p.x + Math.sin(Date.now() * 0.001 + p.x) * 0.1) % 100
      }));
      animationFrameId = requestAnimationFrame(animateParticles);
    };
    animationFrameId = requestAnimationFrame(animateParticles);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearCheckinPreview();
      if (ambientAudio) {
        ambientAudio.pause();
        ambientAudio.src = "";
        ambientAudio = null;
      }
    };
  });

  function resetCheckinForm() {
    checkinPhoto = null;
    clearCheckinPreview();
    checkinMood = 3;
    checkinCaption = "";
    isSubmitting = false;
    console.log("Check-in form reset");
  }

  function closeCheckinModal() {
    showCheckinModal = false;
    resetCheckinForm();
  }

  async function compressImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const sourceUrl = URL.createObjectURL(file);
      img.src = sourceUrl;
      img.onload = () => {
        URL.revokeObjectURL(sourceUrl);
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
              // Use .jpg extension for JPEG files
              const fileName = file.name.replace(/\.[^/.]+$/, ".jpg");
              const newFile = new File([blob], fileName, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              console.log(
                "Compressed image:",
                newFile.name,
                newFile.size,
                "bytes",
              );
              resolve(newFile);
            } else {
              reject(new Error("Canvas to Blob failed"));
            }
          },
          "image/jpeg",
          0.8,
        ); // 0.8 quality
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(sourceUrl);
        reject(e);
      };
    });
  }

  async function handlePhotoSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      try {
        const originalFile = input.files[0];
        console.log(
          "Original file selected:",
          originalFile.name,
          originalFile.size,
          "bytes",
        );
        // Show preview immediately with original
        clearCheckinPreview();
        checkinPhotoPreview = URL.createObjectURL(originalFile);

        // Compress in background
        checkinPhoto = await compressImage(originalFile);
        console.log("Compression successful");
      } catch (err) {
        console.error("Compression failed", err);
        // Fallback to original if compression fails
        checkinPhoto = input.files[0];
        console.log("Using original file as fallback");
      }
    }
  }

  async function submitCheckin() {
    if (!checkinPhoto && !checkinCaption) return;
    isSubmitting = true;

    console.log("Submitting check-in...", {
      hasPhoto: !!checkinPhoto,
      photoName: checkinPhoto?.name,
      photoSize: checkinPhoto?.size,
      mood: checkinMood,
      caption: checkinCaption,
    });

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
        console.log("Check-in posted successfully!");
        closeCheckinModal();
        window.location.reload(); // Refresh to see new check-in
      } else {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Server error:", errorData);
        alert(`${$t("community.postFailed")}: ${errorData.error || "Unknown error"}`);
      }
    } catch (e) {
      console.error("Network error:", e);
      alert(
        `${$t("community.postError")}: ${e instanceof Error ? e.message : "Unknown error"}`,
      );
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="min-h-[80vh] flex flex-col pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
  <!-- Header with Time of Day Indicator -->
  <div class="text-center space-y-2 mb-8 relative">
    <div class="mb-3 flex flex-wrap items-center justify-center gap-2 md:absolute md:top-0 md:right-4 md:mb-0">
      <button
        class="min-h-11 min-w-11 text-slate/60 hover:text-sage transition-colors p-2 rounded-full hover:bg-sage/10"
        on:click={() => showSoundControls = !showSoundControls}
        title={$t("community.forestSounds")}
        aria-label={$t("community.forestSounds")}
      >
        {forestSoundPlaying ? '🔊' : '🔇'}
      </button>
      <div class="text-xs bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-slate/10">
        <span class="text-sage font-medium">{getTimeOfDayLabel(timeOfDay)}</span>
        <span class="text-slate/40 mx-1">•</span>
        <span class="text-slate/60">{getAmbienceLabel(forestAmbience)}</span>
      </div>
    </div>
    
    <h1 class="text-4xl font-bold text-sage">{$t("community.title")}</h1>
    <p class="text-slate/60">{$t("community.subtitle")}</p>
    
  </div>

  <!-- Forest Scene Container -->
  <div class="flex-1 relative pb-12 min-h-[60vh] overflow-hidden">
    <!-- Floating Particles -->
    {#each particles as particle, i}
      <div
        class="absolute pointer-events-none -z-5"
        style="
          left: {particle.x}%;
          top: {particle.y}%;
          width: {particle.size}px;
          height: {particle.size}px;
          opacity: {particle.opacity};
          background: {timeOfDay === 'night' ? 'rgba(255,255,255,0.3)' : 'rgba(74, 124, 89, 0.2)'};
          border-radius: 50%;
          filter: blur(1px);
        "
      ></div>
    {/each}

    <!-- Sky/Background with Time of Day -->
    <div
      class="absolute inset-0 pointer-events-none -z-10 transition-all duration-1000 bg-gradient-to-b {timeOfDay === 'night' ? 'from-indigo-900/20' : timeOfDay === 'evening' ? 'from-orange-50/60' : 'from-blue-50/50'} to-transparent"
    ></div>

    <!-- Sun/Moon -->
    <div
      class="absolute top-8 right-8 w-12 h-12 rounded-full pointer-events-none -z-5 transition-all duration-1000 shadow-lg {timeOfDay === 'night' ? 'bg-gray-300/60' : timeOfDay === 'evening' ? 'bg-orange-400/70' : 'bg-yellow-300/80'}"
      style="filter: blur(2px);"
    ></div>

    <!-- Ground Gradient (Subtle) -->
    <div
      class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-earth/10 to-transparent pointer-events-none"
    ></div>

    <!-- Interactive Forest Elements -->
    <div class="absolute bottom-32 left-8 text-3xl opacity-20 animate-pulse cursor-pointer hover:opacity-40 transition-opacity">
      🍄
    </div>
    <div class="absolute bottom-40 right-12 text-2xl opacity-30 animate-bounce-slow cursor-pointer hover:opacity-60 transition-opacity">
      🦋
    </div>

    <!-- Trees Container -->
    <div
      class="flex flex-wrap justify-center items-end gap-x-8 gap-y-12 px-4 md:px-12 py-12 max-w-7xl mx-auto"
    >
      {#each data.leaderboard as user, i}
        {@const stage = getTreeStage(user.totalMinutes || 0)}
        {@const isMe = user.id === data.currentUserId}

        <div
          class="flex flex-col items-center relative group transition-all duration-500 hover:-translate-y-2 cursor-pointer"
          in:fly={{ y: 50, duration: 500, delay: Math.min(i * 30, 1500) }}
          role="button"
          tabindex="0"
          on:click={() => !isMe && (selectedUserForAction = user)}
          on:keydown={(e) =>
            (e.key === "Enter" || e.key === " ") &&
            !isMe &&
            (e.preventDefault(), (selectedUserForAction = user))}
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
                      alt={$t("community.checkinImageAlt")}
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
                  alt={getDisplayName(user)}
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
                >{getDisplayName(user)}</span
              >
              {#if isMe}
                <span class="w-1.5 h-1.5 rounded-full bg-sage animate-pulse"
                ></span>
              {/if}
            </div>

            <!-- Actions (Only visible on hover/focus to keep forest clean) -->
            <div
              class="flex justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-200"
            >
              {#if !isMe && !nudgedUsers.has(user.id)}
                <button
                  class="min-h-11 min-w-11 text-lg hover:scale-125 active:scale-95 transition-transform rounded-full"
                  title={`${$t("community.nudge")} ${getDisplayName(user)}`}
                  aria-label={`${$t("community.nudge")} ${getDisplayName(user)}`}
                  on:click={async (e) => {
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
                  class="min-h-11 min-w-11 inline-flex items-center justify-center text-lg hover:scale-125 active:scale-95 transition-transform rounded-full"
                  title={`${$t("community.message")} ${getDisplayName(user)}`}
                  aria-label={`${$t("community.message")} ${getDisplayName(user)}`}
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
    class="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 sm:right-6 bg-sage text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform z-40 inline-flex min-h-11 items-center gap-2"
    on:click={() => (showCheckinModal = true)}
    aria-label={$t("community.checkin")}
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
      <div class="bg-white rounded-2xl p-6 w-full max-w-md space-y-6 relative" role="dialog" aria-modal="true" tabindex="-1">
        <button
          class="absolute top-4 right-4 text-slate/40 hover:text-slate"
          on:click={closeCheckinModal}
          aria-label={$t("community.close")}
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
                  alt={$t("community.previewAlt")}
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
                  type="button"
                  class="text-3xl transition-transform hover:scale-125 {checkinMood ===
                  m
                    ? 'scale-125 grayscale-0'
                    : 'grayscale opacity-50'}"
                  on:click={() => (checkinMood = m)}
                  aria-label={`mood ${m}`}
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
            type="button"
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
        aria-label={$t("community.close")}
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
            alt={$t("community.storyAlt")}
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
        tabindex="-1"
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
              {getDisplayName(selectedUserForAction)}
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
          {$t("log.cancel")}
        </button>
      </div>
    </div>
  {/if}

  <!-- Sound Controls Panel -->
  {#if showSoundControls}
    <div
      class="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4"
      transition:fade={{ duration: 200 }}
      role="button"
      tabindex="0"
      on:click|self={() => (showSoundControls = false)}
      on:keydown={(e) => e.key === "Escape" && (showSoundControls = false)}
    >
      <div
        class="bg-white rounded-2xl p-6 w-full max-w-md animate-in slide-in-from-bottom-10 fade-in duration-300"
        role="dialog"
        aria-modal="true"
        tabindex="-1"
      >
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-sage">{$t("community.forestSounds")} 🎵</h2>
          <button
            class="text-slate/40 hover:text-slate text-2xl"
            on:click={() => (showSoundControls = false)}
            aria-label={$t("community.close")}
          >
            ✕
          </button>
        </div>

        <div class="space-y-6">
          <!-- Sound Toggle -->
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold text-slate">{$t("community.ambientSounds")}</div>
              <div class="text-sm text-slate/60">{$t("community.ambientDescription")}</div>
            </div>
            <button
              class="w-14 h-8 rounded-full bg-sage/20 relative transition-colors {forestSoundPlaying
                ? 'bg-sage'
                : 'bg-slate/20'}"
              on:click={toggleAmbientSound}
              aria-label={$t("community.toggleSound")}
              aria-pressed={forestSoundPlaying}
            >
              <div
                class="absolute top-1 w-6 h-6 rounded-full bg-white transition-transform {forestSoundPlaying
                  ? 'left-7'
                  : 'left-1'}"
              ></div>
            </button>
          </div>

          <!-- Volume Control -->
          <div class="space-y-2">
            <div class="flex justify-between">
              <div class="font-bold text-slate">{$t("community.volume")}</div>
              <div class="text-sm text-sage font-medium">
                {Math.round(soundVolume * 100)}%
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              bind:value={soundVolume}
              class="w-full h-2 bg-slate/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-sage"
            />
          </div>

          <!-- Sound Presets -->
          <div class="space-y-3">
            <div class="font-bold text-slate">{$t("community.soundPresets")}</div>
            <div class="grid grid-cols-2 gap-3">
              <button
                class="p-4 rounded-xl border border-sage/30 bg-sage/5 hover:bg-sage/10 transition-colors text-center"
                on:click={() => applySoundPreset("rain", 0.3)}
              >
                <div class="text-2xl mb-2">{SOUND_PRESETS.rain.icon}</div>
                <div class="font-medium text-sage">{$t("community.presetRain")}</div>
              </button>
              <button
                class="p-4 rounded-xl border border-sage/30 bg-sage/5 hover:bg-sage/10 transition-colors text-center"
                on:click={() => applySoundPreset("ocean", 0.5)}
              >
                <div class="text-2xl mb-2">{SOUND_PRESETS.ocean.icon}</div>
                <div class="font-medium text-sage">{$t("community.presetOcean")}</div>
              </button>
              <button
                class="p-4 rounded-xl border border-sage/30 bg-sage/5 hover:bg-sage/10 transition-colors text-center"
                on:click={() => applySoundPreset("relaxing", 0.4)}
              >
                <div class="text-2xl mb-2">{SOUND_PRESETS.relaxing.icon}</div>
                <div class="font-medium text-sage">{$t("community.presetRelaxing")}</div>
              </button>
              <button
                class="p-4 rounded-xl border border-sage/30 bg-sage/5 hover:bg-sage/10 transition-colors text-center"
                on:click={() => applySoundPreset("forest", 0.2)}
              >
                <div class="text-2xl mb-2">{SOUND_PRESETS.forest.icon}</div>
                <div class="font-medium text-sage">{$t("community.presetForest")}</div>
              </button>
            </div>
            {#if soundStatusMessage}
              <p class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {soundStatusMessage}
              </p>
            {/if}
          </div>
        </div>
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

  @keyframes bounce-slow {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-bounce-slow {
    animation: bounce-slow 3s ease-in-out infinite;
  }

  @keyframes progress {
    0% {
      width: 0%;
    }
    100% {
      width: 100%;
    }
  }
</style>
