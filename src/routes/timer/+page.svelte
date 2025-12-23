<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fade, fly } from "svelte/transition";
  import { vibrate, HAPTIC_PATTERNS } from "$lib/haptics";
  import { t } from "$lib/i18n";

  // Music options
  const musicOptions = [
    { id: "none", name: "เงียบ", icon: "🔇", file: null },
    {
      id: "relaxing",
      name: "ผ่อนคลาย",
      icon: "🎵",
      file: "/music/relaxing.mp3",
    },
    { id: "forest", name: "ป่า", icon: "🌳", file: "/music/forest.mp3" },
    { id: "rain", name: "ฝน", icon: "🌧️", file: "/music/rain.mp3" },
    { id: "ocean", name: "คลื่น", icon: "🌊", file: "/music/ocean.mp3" },
  ];

  let selectedMusic = "relaxing";
  let durationMinutes = 10;
  let timeLeft = durationMinutes * 60;
  let isRunning = false;
  let isPaused = false;
  let interval: any;
  let completed = false;

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  let audio: HTMLAudioElement;
  let bgMusic: HTMLAudioElement | null = null;
  let previewAudio: HTMLAudioElement | null = null;
  let isPreviewPlaying = false;

  function selectMusic(musicId: string) {
    // Stop preview if playing
    stopPreview();
    selectedMusic = musicId;
    localStorage.setItem("meditationMusic", musicId);
  }

  function togglePreview() {
    const musicOption = musicOptions.find((m) => m.id === selectedMusic);

    if (isPreviewPlaying && previewAudio) {
      stopPreview();
    } else if (musicOption && musicOption.file) {
      previewAudio = new Audio(musicOption.file);
      previewAudio.volume = 0.5;
      previewAudio.play().catch((e) => console.log("Preview failed", e));
      isPreviewPlaying = true;

      // Auto stop after 10 seconds
      setTimeout(() => {
        stopPreview();
      }, 10000);
    }
  }

  function stopPreview() {
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      previewAudio = null;
    }
    isPreviewPlaying = false;
  }

  onMount(() => {
    // Load saved music preference
    const savedMusic = localStorage.getItem("meditationMusic");
    if (savedMusic && musicOptions.find((m) => m.id === savedMusic)) {
      selectedMusic = savedMusic;
    }

    // Load bell sound
    audio = new Audio("/bell.mp3");
    audio.load();
  });

  let endTime: number;

  function startTimer() {
    // Stop preview if playing
    stopPreview();

    vibrate(HAPTIC_PATTERNS.TAP);

    // iOS Unlock: Play and pause immediately on user interaction
    if (audio) {
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = 1;
        })
        .catch((e) => console.log("Audio unlock failed", e));
    }

    // Load and play background music if selected
    const musicOption = musicOptions.find((m) => m.id === selectedMusic);
    if (musicOption && musicOption.file) {
      bgMusic = new Audio(musicOption.file);
      bgMusic.loop = true;
      bgMusic
        .play()
        .catch((e) => console.log("Background music play failed", e));
    }

    if (!isRunning) {
      // Start new timer
      timeLeft = durationMinutes * 60;
      endTime = Date.now() + timeLeft * 1000;
    } else {
      // Resume
      endTime = Date.now() + timeLeft * 1000;
    }

    isRunning = true;
    isPaused = false;
    completed = false;

    interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((endTime - now) / 1000);

      if (remaining > 0) {
        timeLeft = remaining;
      } else {
        timeLeft = 0;
        finishTimer();
      }
    }, 100); // Check more frequently for smoothness
  }

  function pauseTimer() {
    vibrate(HAPTIC_PATTERNS.TAP);
    isPaused = true;
    clearInterval(interval);
    if (bgMusic) {
      bgMusic.pause();
    }
  }

  function resumeTimer() {
    startTimer(); // Reuse startTimer logic which handles resume
  }

  function stopTimer() {
    vibrate(HAPTIC_PATTERNS.WARNING);
    clearInterval(interval);
    isRunning = false;
    isPaused = false;
    timeLeft = durationMinutes * 60;
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
  }

  let isShaking = false;

  function triggerShake() {
    isShaking = true;
    setTimeout(() => (isShaking = false), 500);
  }

  function finishTimer() {
    clearInterval(interval);
    completed = true;
    isRunning = false;
    vibrate(HAPTIC_PATTERNS.TIMER_COMPLETE);
    triggerShake();
    playSound();
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
  }

  function playSound() {
    if (audio) {
      audio.volume = 1;
      audio.play().catch((e) => console.log("Audio play failed", e));
    }
  }

  onDestroy(() => {
    if (interval) clearInterval(interval);
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });

  function handleLogClick() {
    // Stop all audio before navigating
    if (bgMusic) {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    }
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  $: progress =
    isRunning || isPaused
      ? ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100
      : 0;
</script>

<div
  class="max-w-lg mx-auto py-12 text-center space-y-8 {isShaking
    ? 'animate-shake'
    : ''}"
>
  {#if !isRunning && !completed}
    <div class="space-y-6" in:fade>
      <h1 class="text-3xl font-bold text-sage">{$t("timer.ready")}</h1>

      <!-- Preset Timer Buttons -->
      <fieldset class="space-y-2">
        <legend class="block text-sm font-medium text-slate">
          {$t("timer.quickStart")}
        </legend>
        <div class="flex flex-wrap gap-2 justify-center">
          {#each [5, 10, 15, 20, 30] as preset}
            <button
              on:click={() => (durationMinutes = preset)}
              class="px-4 py-2 rounded-full border-2 transition-all {durationMinutes ===
              preset
                ? 'border-sage bg-sage text-white'
                : 'border-sage/30 text-sage hover:border-sage/60 hover:bg-sage/5'}"
            >
              {preset}
              {$t("timer.minutes")}
            </button>
          {/each}
        </div>
      </fieldset>

      <!-- Music Picker -->
      <fieldset class="space-y-2">
        <legend class="block text-sm font-medium text-slate">
          🎵 เพลงประกอบ
        </legend>
        <div class="flex flex-wrap gap-2 justify-center">
          {#each musicOptions as music}
            <button
              on:click={() => selectMusic(music.id)}
              class="flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all min-w-[60px]
                {selectedMusic === music.id
                ? 'border-sage bg-sage/10 shadow-sm'
                : 'border-earth/20 hover:border-sage/50 hover:bg-sage/5'}"
            >
              <span class="text-xl">{music.icon}</span>
              <span class="text-xs text-slate/70 mt-1">{music.name}</span>
            </button>
          {/each}
        </div>

        <!-- Preview Button -->
        {#if selectedMusic !== "none"}
          <button
            on:click={togglePreview}
            class="mt-3 flex items-center justify-center gap-2 px-4 py-2 rounded-full text-sm transition-all mx-auto
              {isPreviewPlaying
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'bg-sage/10 text-sage hover:bg-sage/20'}"
          >
            {#if isPreviewPlaying}
              <span>⏹️</span>
              <span>หยุดฟัง</span>
            {:else}
              <span>▶️</span>
              <span>ฟังตัวอย่าง</span>
            {/if}
          </button>
        {/if}
      </fieldset>

      <div class="space-y-2">
        <label
          class="block text-sm font-medium text-slate"
          for="durationMinutes"
        >
          {$t("timer.duration")}
        </label>
        <div class="flex items-center justify-center gap-4">
          <button
            class="p-2 rounded-full hover:bg-earth/10 text-2xl w-10 h-10 flex items-center justify-center text-sage"
            on:click={() =>
              (durationMinutes = Math.max(1, durationMinutes - 1))}>-</button
          >
          <input
            id="durationMinutes"
            type="number"
            bind:value={durationMinutes}
            min="1"
            max="999"
            class="text-4xl font-mono font-bold text-sage w-24 text-center bg-transparent border-b-2 border-sage/20 focus:border-sage focus:outline-none"
          />
          <button
            class="p-2 rounded-full hover:bg-earth/10 text-2xl w-10 h-10 flex items-center justify-center text-sage"
            on:click={() =>
              (durationMinutes = Math.min(999, durationMinutes + 1))}>+</button
          >
        </div>
      </div>

      <button
        on:click={startTimer}
        class="bg-sage hover:bg-sage/90 text-white text-xl font-semibold py-4 px-12 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95"
      >
        {$t("timer.start")}
      </button>
    </div>
  {:else if completed}
    <div class="space-y-6" in:fade>
      <div class="text-6xl mb-4">✨</div>
      <h1 class="text-3xl font-bold text-sage">{$t("timer.complete")}</h1>
      <p class="text-slate/60">{$t("timer.notice")}</p>

      <div class="flex flex-col gap-3 max-w-xs mx-auto">
        <a
          href="/log?duration={durationMinutes}&type=Breath"
          on:click={handleLogClick}
          class="bg-sage hover:bg-sage/90 text-white font-bold py-3 px-6 rounded-xl shadow-md"
        >
          {$t("timer.log")}
        </a>
        <button
          on:click={() => {
            completed = false;
            stopTimer();
          }}
          class="text-slate/60 hover:text-sage"
        >
          {$t("timer.back")}
        </button>
      </div>
    </div>
  {:else}
    <div class="space-y-8 relative" in:fade>
      <!-- Timer Circle -->
      <div class="relative w-64 h-64 mx-auto flex items-center justify-center">
        <svg class="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            class="text-earth/20"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            stroke-dasharray={2 * Math.PI * 120}
            stroke-dashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
            class="text-sage transition-all duration-1000 ease-linear"
          />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center flex-col">
          <div class="text-5xl font-mono font-bold text-slate">
            {formatTime(timeLeft)}
          </div>
          <div class="text-sm text-slate/50 mt-2">
            {isPaused ? $t("timer.paused") : $t("timer.breathing")}
          </div>
        </div>
      </div>

      <!-- Controls -->
      <div class="flex justify-center gap-4">
        {#if isPaused}
          <button
            on:click={resumeTimer}
            class="bg-sage text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg hover:scale-105 transition"
          >
            ▶
          </button>
        {:else}
          <button
            on:click={pauseTimer}
            class="bg-earth/20 text-slate w-16 h-16 rounded-full flex items-center justify-center text-2xl hover:bg-earth/30 transition"
          >
            ⏸
          </button>
        {/if}

        <button
          on:click={stopTimer}
          class="border-2 border-slate/20 text-slate/60 w-16 h-16 rounded-full flex items-center justify-center text-xl hover:border-red-400 hover:text-red-400 transition"
        >
          ✕
        </button>
      </div>

      <div class="text-center">
        <a
          href="/log?duration={Math.ceil(
            (durationMinutes * 60 - timeLeft) / 60,
          )}&type=Breath"
          on:click={handleLogClick}
          class="text-sm text-slate/40 hover:text-sage"
        >
          {$t("timer.finishEarly")}
        </a>
      </div>
    </div>
  {/if}
</div>
