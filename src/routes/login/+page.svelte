<script>
  import { supabase } from "$lib/supabaseClient";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  let email = "";
  let password = "";
  let error = "";

  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get("error");
    if (urlError) {
      error = urlError;
    }
  });

  async function handleSubmit() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = "/";
    } else {
      error = data.error;
    }
  }
</script>

<div class="max-w-md mx-auto py-12">
  <div class="text-center mb-8">
    <div class="text-6xl mb-4">🌳</div>
    <h1 class="text-3xl font-bold text-sage">Welcome Back</h1>
    <p class="text-slate/60">Continue your growth journey</p>
  </div>

  <form
    on:submit|preventDefault={handleSubmit}
    class="bg-white p-8 rounded-2xl shadow-sm border border-earth/10 space-y-6"
  >
    {#if error}
      <div class="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
        {error}
      </div>
    {/if}

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate">
        Email
        <input
          type="email"
          bind:value={email}
          required
          class="w-full mt-1 rounded-lg border-slate/20 focus:border-sage focus:ring-sage"
        />
      </label>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate">
        Password
        <input
          type="password"
          bind:value={password}
          required
          class="w-full mt-1 rounded-lg border-slate/20 focus:border-sage focus:ring-sage"
        />
      </label>
    </div>

    <button
      type="submit"
      class="w-full bg-sage hover:bg-sage/90 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95"
    >
      Log In
    </button>

    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-slate/20"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 bg-white text-slate/50">Or continue with</span>
      </div>
    </div>

    <button
      type="button"
      on:click={async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) alert(error.message);
      }}
      class="w-full bg-white hover:bg-slate-50 text-slate font-bold py-3 rounded-xl shadow-sm border border-slate/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  </form>

  <p class="text-center mt-6 text-slate/60">
    Don't have an account? <a
      href="/signup"
      class="text-sage font-semibold hover:underline">Sign up</a
    >
  </p>
</div>
