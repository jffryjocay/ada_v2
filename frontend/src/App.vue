<template>
  <div id="app-wrapper">
    <Navbar v-if="$route.name !== 'Login'" />
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import Navbar from "./components/Navbar.vue";
import { useAuthStore } from "./stores/auth";

const authStore = useAuthStore();

onMounted(() => {
  authStore.initAuth();
});
</script>

<style>
#app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
main {
  flex: 1;
}
</style>
