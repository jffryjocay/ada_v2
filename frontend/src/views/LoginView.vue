<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1a1747] via-[#2736d1] to-[#1a17e3] p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 border border-white/20">
      <div class="text-center mb-8">
        <img
          src="/img/cityhall_logo.png"
          alt="City Hall Logo"
          class="w-24 h-24 mx-auto rounded-full shadow-lg mb-4 ring-4 ring-blue-50"
        />
        <h2 class="text-2xl font-bold text-[#1a1747] tracking-tight">ADA SYSTEM</h2>
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Authority to Debit Account</p>
      </div>

      <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 text-center font-medium">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="username" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Username</label>
          <input
            type="text"
            id="username"
            v-model="username"
            class="form-input"
            placeholder="Enter username"
            required
            autocomplete="username"
          />
        </div>

        <div>
          <label for="password" class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
          <input
            type="password"
            id="password"
            v-model="password"
            class="form-input"
            placeholder="Enter password"
            required
            autocomplete="current-password"
          />
        </div>

        <button
          type="submit"
          class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200 text-sm mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          :disabled="loading"
        >
          <span v-if="loading">Signing in...</span>
          <span v-else class="flex items-center gap-2">LOGIN <LogIn class="w-4 h-4" /></span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import { LogIn } from "lucide-vue-next";

const username = ref("");
const password = ref("");
const errorMessage = ref("");
const loading = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const handleLogin = async () => {
  if (!username.value || !password.value) {
    errorMessage.value = "Please fill in all fields.";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  const result = await authStore.login(username.value, password.value);
  loading.value = false;

  if (result.success) {
    router.push({ name: "Summary" });
  } else {
    errorMessage.value = result.message || "Invalid credentials.";
  }
};
</script>
