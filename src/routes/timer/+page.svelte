<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fade, scale } from "svelte/transition";
  import { vibrate, HAPTIC_PATTERNS } from "$lib/haptics";
  import { t } from "$lib/i18n";

  // shadcn components
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Progress } from "$lib/components/ui/progress";
  import { Badge } from "$lib/components/ui/badge";

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

  // Duration presets
  const durationPresets = [
    { value: 5, label: "5", emoji: "🌱" },
    { value: 10, label: "10", emoji: "🌿" },
    { value: 15, label: "15", emoji: "🌲" },
    { value: 20, label: "20", emoji: "🌳" },
    { value: 30, label: "30", emoji: "🏔️" },
  ];

  let selectedMusic = "relaxing";
  let durationMinutes = 10;
  let isUnlimited = false;
  let timeLeft = durationMinutes * 60;
  let elapsedSeconds = 0;
  let isRunning = false;
  let isPaused = false;
  let interval: any;
  let completed = false;
  let startTime: number;

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
      setTimeout(() => stopPreview(), 10000);
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
    const savedMusic = localStorage.getItem("meditationMusic");
    if (savedMusic && musicOptions.find((m) => m.id === savedMusic)) {
      selectedMusic = savedMusic;
    }
    audio = new Audio("/bell.mp3");
    audio.load();
  });

  let endTime: number;

  function startTimer() {
    stopPreview();
    vibrate(HAPTIC_PATTERNS.TAP);

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

    const musicOption = musicOptions.find((m) => m.id === selectedMusic);
    if (musicOption && musicOption.file) {
      bgMusic = new Audio(musicOption.file);
      bgMusic.loop = true;
      bgMusic
        .play()
        .catch((e) => console.log("Background music play failed", e));
    }

    if (!isRunning) {
      if (isUnlimited) {
        elapsedSeconds = 0;
        startTime = Date.now();
      } else {
        timeLeft = durationMinutes * 60;
        endTime = Date.now() + timeLeft * 1000;
      }
    } else {
      if (isUnlimited) {
        startTime = Date.now() - elapsedSeconds * 1000;
      } else {
        endTime = Date.now() + timeLeft * 1000;
      }
    }

    isRunning = true;
    isPaused = false;
    completed = false;

    interval = setInterval(() => {
      const now = Date.now();
      if (isUnlimited) {
        elapsedSeconds = Math.floor((now - startTime) / 1000);
      } else {
        const remaining = Math.ceil((endTime - now) / 1000);
        if (remaining > 0) {
          timeLeft = remaining;
        } else {
          timeLeft = 0;
          finishTimer();
        }
      }
    }, 100);
  }

  function pauseTimer() {
    vibrate(HAPTIC_PATTERNS.TAP);
    isPaused = true;
    clearInterval(interval);
    if (bgMusic) bgMusic.pause();
  }

  function resumeTimer() {
    startTimer();
  }

  function stopTimer() {
    vibrate(HAPTIC_PATTERNS.WARNING);
    clearInterval(interval);
    isRunning = false;
    isPaused = false;
    if (isUnlimited) {
      elapsedSeconds = 0;
    } else {
      timeLeft = durationMinutes * 60;
    }
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
    if (isUnlimited) {
      // คำนวณนาที อย่างน้อย 1 นาที
      durationMinutes = Math.max(1, Math.ceil(elapsedSeconds / 60));
    }
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
      ? isUnlimited
        ? 100
        : ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100
      : 0;
</script>

<div
  class="max-w-lg mx-auto py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center space-y-6 {isShaking
    ? 'animate-shake'
    : ''}"
>
  {#if !isRunning && !completed}
    <!-- Setup Screen -->
    <div class="space-y-8" in:fade={{ duration: 300 }}>
      <!-- Header -->
      <div class="space-y-2">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-2"
        >
          <span class="text-3xl">🧘</span>
        </div>
        <h1 class="text-3xl font-bold text-primary">{$t("timer.ready")}</h1>
        <p class="text-muted-foreground">เลือกระยะเวลาและเริ่มนั่งสมาธิ</p>
      </div>

      <!-- Duration Card -->
      <Card.Root class="glass shadow-soft border-border/50">
        <Card.Header class="pb-3">
          <Card.Title class="text-lg flex items-center gap-2">
            <span>⏱️</span>
            {$t("timer.quickStart")}
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <!-- Preset Buttons -->
          <div class="flex flex-wrap gap-2 justify-center">
            {#each durationPresets as preset}
              <Button
                variant={!isUnlimited && durationMinutes === preset.value
                  ? "default"
                  : "outline"}
                class="rounded-full min-w-[70px] transition-all {!isUnlimited &&
                durationMinutes === preset.value
                  ? 'scale-105 shadow-md'
                  : ''}"
                onclick={() => {
                  durationMinutes = preset.value;
                  isUnlimited = false;
                }}
              >
                <span class="mr-1">{preset.emoji}</span>
                {preset.label}m
              </Button>
            {/each}
            <Button
              variant={isUnlimited ? "default" : "outline"}
              class="rounded-full min-w-[70px] transition-all {isUnlimited
                ? 'scale-105 shadow-md'
                : ''}"
              onclick={() => (isUnlimited = true)}
            >
              <span class="mr-1">♾️</span>
              {$t("timer.unlimited")}
            </Button>
          </div>

          <!-- Custom Duration -->
          <div
            class="flex items-center justify-center gap-4 pt-2 transition-opacity {isUnlimited
              ? 'opacity-30 pointer-events-none'
              : ''}"
          >
            <Button
              variant="ghost"
              size="icon"
              class="rounded-full h-10 w-10 text-xl"
              onclick={() =>
                (durationMinutes = Math.max(1, durationMinutes - 1))}
            >
              −
            </Button>
            <div class="text-center">
              <input
                type="number"
                bind:value={durationMinutes}
                min="1"
                max="999"
                class="text-4xl font-mono font-bold text-primary w-20 text-center bg-transparent border-b-2 border-primary/20 focus:border-primary focus:outline-none transition-colors"
              />
              <div class="text-xs text-muted-foreground mt-1">นาที</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="rounded-full h-10 w-10 text-xl"
              onclick={() =>
                (durationMinutes = Math.min(999, durationMinutes + 1))}
            >
              +
            </Button>
          </div>
        </Card.Content>
      </Card.Root>

      <!-- Music Card -->
      <Card.Root class="glass shadow-soft border-border/50">
        <Card.Header class="pb-3">
          <Card.Title class="text-lg flex items-center gap-2">
            <span>🎵</span>
            เพลงประกอบ
          </Card.Title>
        </Card.Header>
        <Card.Content class="space-y-4">
          <div class="flex flex-wrap gap-2 justify-center">
            {#each musicOptions as music}
              <button
                onclick={() => selectMusic(music.id)}
                class="flex flex-col items-center px-4 py-3 rounded-2xl border-2 transition-all min-w-[72px]
                  {selectedMusic === music.id
                  ? 'border-primary bg-primary/10 shadow-sm scale-105'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'}"
              >
                <span class="text-2xl mb-1">{music.icon}</span>
                <span class="text-xs text-muted-foreground">{music.name}</span>
              </button>
            {/each}
          </div>

          {#if selectedMusic !== "none"}
            <Button
              variant="ghost"
              class="mt-2 text-sm {isPreviewPlaying
                ? 'text-destructive'
                : 'text-primary'}"
              onclick={togglePreview}
            >
              {#if isPreviewPlaying}
                <span class="mr-1">⏹️</span> หยุดฟัง
              {:else}
                <span class="mr-1">▶️</span> ฟังตัวอย่าง
              {/if}
            </Button>
          {/if}
        </Card.Content>
      </Card.Root>

      <!-- Start Button -->
      <Button
        size="lg"
        class="w-full max-w-xs h-14 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        onclick={startTimer}
      >
        <span class="mr-2">🧘</span>
        {$t("timer.start")}
      </Button>
    </div>
  {:else if completed}
    <!-- Completion Screen -->
    <div class="space-y-6" in:scale={{ duration: 400, start: 0.9 }}>
      <div class="relative">
        <div class="text-8xl mb-4 animate-pulse-soft">✨</div>
        <div
          class="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10"
        ></div>
      </div>

      <div class="space-y-2">
        <h1 class="text-3xl font-bold text-primary">{$t("timer.complete")}</h1>
        <p class="text-muted-foreground">{$t("timer.notice")}</p>
      </div>

      <Card.Root class="glass shadow-soft">
        <Card.Content class="pt-6">
          <div class="flex justify-center gap-4 mb-4">
              <div class="text-center">
                <div class="text-3xl font-bold text-primary">
                  {durationMinutes}
                </div>
                <div class="text-xs text-muted-foreground">{$t("timer.minutes")}</div>
              </div>
            </div>

            <div class="flex flex-col gap-3">
              <a
                href="/log?duration={durationMinutes}&type=Breath"
                onclick={handleLogClick}
                class="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <span class="mr-2">📝</span>
                {$t("timer.log")}
              </a>
            <Button
              variant="ghost"
              onclick={() => {
                completed = false;
                stopTimer();
              }}
            >
              {$t("timer.back")}
            </Button>
          </div>
        </Card.Content>
      </Card.Root>
    </div>
  {:else}
    <!-- Timer Running Screen -->
    <div class="space-y-8" in:fade={{ duration: 300 }}>
      <!-- Timer Circle -->
      <div class="relative w-72 h-72 mx-auto flex items-center justify-center">
        <!-- Outer glow -->
        <div
          class="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-breathe"
        ></div>

        <!-- SVG Circle -->
        <svg class="w-full h-full transform -rotate-90 relative z-10">
          <circle
            cx="144"
            cy="144"
            r="130"
            stroke="currentColor"
            stroke-width="6"
            fill="transparent"
            class="text-border"
          />
          <circle
            cx="144"
            cy="144"
            r="130"
            stroke="currentColor"
            stroke-width="8"
            fill="transparent"
            stroke-dasharray={2 * Math.PI * 130}
            stroke-dashoffset={2 * Math.PI * 130 * (1 - progress / 100)}
            stroke-linecap="round"
            class="text-primary transition-all duration-500 ease-linear"
          />
        </svg>

        <!-- Timer Display -->
        <div
          class="absolute inset-0 flex items-center justify-center flex-col z-20"
        >
          <div
            class="text-5xl font-mono font-bold text-foreground tracking-tight"
          >
            {isUnlimited ? formatTime(elapsedSeconds) : formatTime(timeLeft)}
          </div>
          <Badge variant="secondary" class="mt-3">
            {isPaused
              ? "⏸️ " + $t("timer.paused")
              : "🧘 " + $t("timer.breathing")}
          </Badge>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="px-4">
        {#if isUnlimited}
          <div class="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary animate-pulse"
              style="width: 100%"
            ></div>
          </div>
        {:else}
          <Progress value={progress} class="h-2" />
        {/if}
        <div class="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0:00</span>
          {#if isUnlimited}
            <span>∞</span>
          {:else}
            <span>{formatTime(durationMinutes * 60)}</span>
          {/if}
        </div>
      </div>

      <!-- Controls -->
      <div class="flex justify-center gap-4">
        {#if isPaused}
          <Button
            size="lg"
            class="w-16 h-16 rounded-full text-2xl shadow-lg"
            onclick={resumeTimer}
          >
            ▶
          </Button>
        {:else}
          <Button
            variant="secondary"
            size="lg"
            class="w-16 h-16 rounded-full text-2xl"
            onclick={pauseTimer}
          >
            ⏸
          </Button>
        {/if}

        <Button
          variant="outline"
          size="lg"
          class="w-16 h-16 rounded-full text-xl border-2 hover:border-destructive hover:text-destructive"
          onclick={stopTimer}
        >
          ✕
        </Button>
      </div>

      <!-- Finish Early Link -->
      {#if !isUnlimited}
        <a
          href="/log?duration={Math.ceil(
            (durationMinutes * 60 - timeLeft) / 60,
          )}&type=Breath"
          onclick={handleLogClick}
          class="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {$t("timer.finishEarly")}
        </a>
      {:else}
        <button
          onclick={finishTimer}
          class="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
        >
          {$t("timer.finishAndLog")}
        </button>
      {/if}
    </div>
  {/if}
</div>

<style>
  @keyframes shake {
    0%,
    100% {
      transform: translateX(0);
    }
    25% {
      transform: translateX(-5px);
    }
    75% {
      transform: translateX(5px);
    }
  }
  .animate-shake {
    animation: shake 0.5s ease-in-out;
  }
</style>
