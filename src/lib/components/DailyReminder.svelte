<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { t } from "$lib/i18n";

  let permission = "default";
  let reminderTime = "";
  let isEnabled = false;
  let pendingTimer: ReturnType<typeof setTimeout> | undefined;

  onMount(() => {
    if ("Notification" in window) {
      permission = Notification.permission;
    }
    const savedTime = localStorage.getItem("dailyReminderTime");
    if (savedTime) {
      reminderTime = savedTime;
      isEnabled = true;
      armToday(savedTime);
    }
  });

  onDestroy(() => {
    if (pendingTimer) clearTimeout(pendingTimer);
  });

  async function requestPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }
    const result = await Notification.requestPermission();
    permission = result;
  }

  function fire() {
    if (permission !== "granted") return;
    new Notification($t("reminder.title"), {
      body: $t("reminder.fireBody"),
      icon: "/icon-192.png",
    });
  }

  // Arm a notification for today's reminder time if it is still ahead. Reliable
  // only while the app stays open — a true background reminder needs server push
  // (not yet set up), so we keep expectations honest in the UI copy below.
  function armToday(time: string) {
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = undefined;
    if (permission !== "granted") return;

    const [h, m] = time.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return;

    const target = new Date();
    target.setHours(h, m, 0, 0);
    const delay = target.getTime() - Date.now();
    if (delay > 0) {
      pendingTimer = setTimeout(fire, delay);
    }
  }

  function scheduleNotification() {
    if (!reminderTime) return;
    localStorage.setItem("dailyReminderTime", reminderTime);
    isEnabled = true;
    armToday(reminderTime);

    // Confirm to the user that the reminder is set.
    if (permission === "granted") {
      new Notification($t("reminder.testTitle"), {
        body: `${$t("reminder.testBody")} ${reminderTime}`,
        icon: "/icon-192.png",
      });
    }
  }

  function clearReminder() {
    localStorage.removeItem("dailyReminderTime");
    reminderTime = "";
    isEnabled = false;
    if (pendingTimer) clearTimeout(pendingTimer);
    pendingTimer = undefined;
  }
</script>

<div
  class="bg-white p-4 rounded-2xl shadow-sm border border-earth/10 max-w-md mx-auto mt-4"
>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <span class="text-2xl">🔔</span>
      <span class="font-bold text-sage">{$t("reminder.title")}</span>
    </div>
    {#if permission === "granted" && isEnabled}
      <button
        on:click={clearReminder}
        class="text-sm text-red-400 hover:text-red-600"
        >{$t("reminder.turnOff")}</button
      >
    {/if}
  </div>

  {#if permission === "default"}
    <button
      on:click={requestPermission}
      class="mt-3 w-full bg-sage/10 text-sage font-semibold py-2 rounded-lg hover:bg-sage/20 transition"
    >
      {$t("reminder.enable")}
    </button>
  {:else if permission === "granted"}
    <div class="mt-3 flex gap-2">
      <input
        type="time"
        bind:value={reminderTime}
        class="flex-1 border border-earth/20 rounded-lg px-3 py-2 text-slate focus:outline-none focus:border-sage"
      />
      <button
        on:click={scheduleNotification}
        class="bg-sage text-white px-4 py-2 rounded-lg font-semibold hover:bg-sage/90 transition"
      >
        {$t("reminder.save")}
      </button>
    </div>
    {#if isEnabled}
      <p class="text-xs text-slate/50 mt-2">
        {$t("reminder.setFor")}
        {reminderTime}.
        <br />{$t("reminder.note")}
      </p>
    {/if}
  {:else}
    <p class="text-sm text-red-400 mt-2">{$t("reminder.blocked")}</p>
  {/if}
</div>
