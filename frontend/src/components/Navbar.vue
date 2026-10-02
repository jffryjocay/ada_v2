<template>
  <nav class="no-print bg-gradient-to-r from-[#1a1747] via-[#2736d1] to-[#0284c7] text-white px-6 py-3.5 shadow-lg sticky top-0 z-50 flex flex-wrap justify-between items-center">
    <div class="flex items-center gap-3 font-bold text-xl tracking-wider">
      <img src="/img/cityhall_logo.png" alt="Cotabato City Logo" class="h-9 w-auto filter drop-shadow" />
      <span class="bg-clip-text text-transparent bg-gradient-to-r from-white to-sky-200">ADA SYSTEM</span>
    </div>

    <ul class="flex items-center gap-1 list-none my-2 sm:my-0">
      <li>
        <router-link
          to="/summary"
          class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
          :class="$route.name === 'Summary' ? 'bg-white/20 text-white shadow-inner font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white'"
        >
          <FileText class="w-4 h-4" /> Summary
        </router-link>
      </li>
      <li>
        <router-link
          to="/ada"
          class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
          :class="($route.name === 'AdaList' || $route.name === 'AdaDetails') ? 'bg-white/20 text-white shadow-inner font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white'"
        >
          <FolderKanban class="w-4 h-4" /> ADA Management
        </router-link>
      </li>
      <li>
        <router-link
          to="/defaults"
          class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
          :class="$route.name === 'Defaults' ? 'bg-white/20 text-white shadow-inner font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white'"
        >
          <Settings class="w-4 h-4" /> Defaults
        </router-link>
      </li>
      <li v-if="authStore.isAdmin">
        <router-link
          to="/accounts"
          class="px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5"
          :class="$route.name === 'Accounts' ? 'bg-white/20 text-white shadow-inner font-semibold' : 'text-white/80 hover:bg-white/10 hover:text-white'"
        >
          <Users class="w-4 h-4" /> Accounts
        </router-link>
      </li>
    </ul>

    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs font-medium" v-if="authStore.user">
        <User class="w-3.5 h-3.5 text-sky-200" />
        <span class="text-white">{{ authStore.user.employee || authStore.user.username }}</span>
        <span
          class="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider"
          :class="{
            'bg-blue-100 text-blue-800': authStore.user.role === 'Admin',
            'bg-emerald-100 text-emerald-800': authStore.user.role === 'Encoder',
            'bg-amber-100 text-amber-800': authStore.user.role === 'Reviewer'
          }"
        >
          {{ authStore.user.role }}
        </span>
      </div>

      <button
        @click="handleLogout"
        class="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold shadow-md shadow-red-900/30 border border-red-500 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5"
      >
        <LogOut class="w-3.5 h-3.5" /> Logout
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from "../stores/auth";
import { useRouter } from "vue-router";
import { FileText, FolderKanban, Settings, Users, User, LogOut } from "lucide-vue-next";

const authStore = useAuthStore();
const router = useRouter();

const handleLogout = () => {
  authStore.logout();
  router.push({ name: "Login" });
};
</script>
