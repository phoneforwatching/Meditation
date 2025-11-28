<script lang="ts">
    import { enhance } from "$app/forms";
    import { fade } from "svelte/transition";

    export let data;

    let loading = false;
    let message = "";
    let messageType: "success" | "error" = "success";
    let previewUrl: string | null = data.profile.avatarUrl;

    function handleFileChange(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];
            previewUrl = URL.createObjectURL(file);
        }
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        loading = true;
        message = "";

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        try {
            const res = await fetch("/api/settings/profile", {
                method: "POST",
                body: formData,
            });
            const result = await res.json();

            if (res.ok) {
                message = "Profile updated successfully!";
                messageType = "success";
                if (result.avatarUrl) {
                    previewUrl = result.avatarUrl;
                }
            } else {
                message = result.error || "Failed to update profile";
                messageType = "error";
            }
        } catch (err) {
            message = "An error occurred";
            messageType = "error";
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
    <div
        class="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
    >
        <div class="px-6 py-8">
            <div class="flex items-center justify-between mb-8">
                <h1 class="text-2xl font-bold text-slate-800">
                    Profile Settings
                </h1>
                <a
                    href="/community"
                    class="text-sm text-sage hover:text-sage-dark"
                    >Back to Community</a
                >
            </div>

            {#if message}
                <div
                    transition:fade
                    class="mb-6 p-4 rounded-lg text-sm {messageType ===
                    'success'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'}"
                >
                    {message}
                </div>
            {/if}

            <form on:submit={handleSubmit} class="space-y-6">
                <!-- Avatar Upload -->
                <div class="flex flex-col items-center space-y-4">
                    <div
                        class="relative w-32 h-32 rounded-full overflow-hidden bg-slate-100 ring-4 ring-white shadow-md group"
                    >
                        {#if previewUrl}
                            <img
                                src={previewUrl}
                                alt="Profile"
                                class="w-full h-full object-cover"
                            />
                        {:else}
                            <div
                                class="w-full h-full flex items-center justify-center text-4xl"
                            >
                                👤
                            </div>
                        {/if}

                        <label
                            class="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            <span class="text-white text-sm font-medium"
                                >Change</span
                            >
                            <input
                                type="file"
                                name="avatar"
                                accept="image/*"
                                class="hidden"
                                on:change={handleFileChange}
                            />
                        </label>
                    </div>
                    <p class="text-xs text-slate-500">
                        Click image to upload new photo
                    </p>
                </div>

                <!-- Display Name -->
                <div>
                    <label
                        for="displayName"
                        class="block text-sm font-medium text-slate-700 mb-1"
                        >Display Name</label
                    >
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={data.profile.displayName || ""}
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition-all"
                        placeholder="Your name"
                    />
                </div>

                <!-- Bio -->
                <div>
                    <label
                        for="bio"
                        class="block text-sm font-medium text-slate-700 mb-1"
                        >Bio</label
                    >
                    <textarea
                        id="bio"
                        name="bio"
                        rows="4"
                        class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-sage focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Tell us about yourself..."
                        >{data.profile.bio || ""}</textarea
                    >
                </div>

                <!-- Submit Button -->
                <button
                    type="submit"
                    disabled={loading}
                    class="w-full py-3 px-4 bg-sage text-white rounded-xl font-medium shadow-lg shadow-sage/20 hover:bg-sage-dark active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </form>
        </div>
    </div>
</div>
