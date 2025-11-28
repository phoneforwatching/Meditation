<script>
    import { onMount } from "svelte";
    import { supabase } from "$lib/supabaseClient";
    import { goto } from "$app/navigation";

    let status = "Authenticating...";

    onMount(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === "SIGNED_IN" && session) {
                status = "Syncing session...";

                try {
                    const res = await fetch("/api/auth/sync-session", {
                        method: "POST",
                        body: JSON.stringify({
                            accessToken: session.access_token,
                        }),
                        headers: { "Content-Type": "application/json" },
                    });

                    if (res.ok) {
                        window.location.href = "/";
                    } else {
                        status = "Failed to sync session.";
                        setTimeout(
                            () => goto("/login?error=Sync failed"),
                            2000,
                        );
                    }
                } catch (e) {
                    console.error(e);
                    status = "Error syncing session.";
                }
            } else if (event === "SIGNED_OUT") {
                status = "Signed out.";
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    });
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="text-center space-y-4">
        <div class="text-4xl animate-bounce">🌳</div>
        <h1 class="text-xl font-semibold text-slate-700">{status}</h1>
        <p class="text-slate-500 text-sm">Please wait while we log you in.</p>
    </div>
</div>
