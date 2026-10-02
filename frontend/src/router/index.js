import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

import LoginView from "../views/LoginView.vue";
import SummaryView from "../views/SummaryView.vue";
import AdaListView from "../views/AdaListView.vue";
import AdaDetailsView from "../views/AdaDetailsView.vue";
import DefaultsView from "../views/DefaultsView.vue";
import AccountsView from "../views/AccountsView.vue";

const routes = [
  { path: "/login", name: "Login", component: LoginView, meta: { requiresGuest: true } },
  { path: "/", name: "Home", redirect: "/summary" },
  { path: "/summary", name: "Summary", component: SummaryView, meta: { requiresAuth: true } },
  { path: "/ada", name: "AdaList", component: AdaListView, meta: { requiresAuth: true } },
  { path: "/ada/:ada_no", name: "AdaDetails", component: AdaDetailsView, meta: { requiresAuth: true } },
  { path: "/defaults", name: "Defaults", component: DefaultsView, meta: { requiresAuth: true } },
  { path: "/accounts", name: "Accounts", component: AccountsView, meta: { requiresAuth: true } },
  { path: "/:pathMatch(.*)*", redirect: "/summary" }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: "Login" });
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: "Summary" });
  } else {
    next();
  }
});

export default router;

