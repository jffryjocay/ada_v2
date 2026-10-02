import { defineStore } from "pinia";
import axios from "axios";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: JSON.parse(localStorage.getItem("ada_user") || "null"),
    token: localStorage.getItem("ada_token") || null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    role: (state) => (state.user ? state.user.role : null),
    isAdmin: (state) => (state.user ? state.user.role === "Admin" : false)
  },
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post("/api/auth/login", { username, password });
        if (response.data.success) {
          this.token = response.data.token;
          this.user = response.data.user;

          localStorage.setItem("ada_token", this.token);
          localStorage.setItem("ada_user", JSON.stringify(this.user));

          // Set default axios header
          axios.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
          return { success: true };
        }
        return { success: false, message: response.data.message };
      } catch (error) {
        const msg = error.response?.data?.message || "Login failed";
        return { success: false, message: msg };
      }
    },
    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem("ada_token");
      localStorage.removeItem("ada_user");
      delete axios.defaults.headers.common["Authorization"];
    },
    initAuth() {
      if (this.token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${this.token}`;
      }
    }
  }
});

