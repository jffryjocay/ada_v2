<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Account Management</h2>
      <p class="text-slate-500 text-sm mt-1">Manage system user accounts, employee info, and access roles</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <!-- Add User Form Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-1">
        <h3 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
          <UserPlus class="w-5 h-5 text-blue-600" /> Add System User
        </h3>

        <form @submit.prevent="saveUser" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">User Role</label>
            <select v-model="form.role" class="form-select" required>
              <option value="Admin">Admin</option>
              <option value="Encoder">Encoder</option>
              <option value="Reviewer">Reviewer</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Employee Name</label>
            <input type="text" v-model="form.employee" placeholder="Full Employee Name" class="form-input" required />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Position</label>
            <input type="text" v-model="form.position" placeholder="Job Position / Title" class="form-input" required />
          </div>

          <hr class="border-slate-100 my-2" />

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Username</label>
            <input type="text" v-model="form.username" placeholder="Username" class="form-input font-mono" required />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Password</label>
            <input type="password" v-model="form.password" placeholder="Password" class="form-input" required />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-blue-500/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            <UserPlus class="w-4 h-4" /> Add User Account
          </button>
        </form>
      </div>

      <!-- Users List Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
        <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
          <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users class="w-5 h-5 text-slate-600" /> Registered System Users
          </h3>
          <button @click="fetchUsers" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
            <RefreshCw class="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <DataTable
          :data="users"
          :columns="columns"
          rowKey="user_id"
          :loading="tableLoading"
          searchPlaceholder="Search users by name, position, username, role..."
          emptyMessage="No user accounts registered."
        >
          <template #index="{ index }">
            <span class="text-slate-400 font-mono text-xs">{{ index + 1 }}</span>
          </template>
          <template #employee="{ value }">
            <span class="font-bold text-slate-800">{{ value }}</span>
          </template>
          <template #position="{ value }">
            <span class="text-slate-600">{{ value }}</span>
          </template>
          <template #username="{ value }">
            <span class="font-mono text-blue-700 font-semibold">{{ value }}</span>
          </template>
          <template #role="{ value }">
            <span
              class="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider"
              :class="{
                'bg-blue-100 text-blue-800 border border-blue-200': value === 'Admin',
                'bg-emerald-100 text-emerald-800 border border-emerald-200': value === 'Encoder',
                'bg-amber-100 text-amber-800 border border-amber-200': value === 'Reviewer'
              }"
            >
              {{ value }}
            </span>
          </template>
          <template #action="{ item }">
            <button
              @click="deleteUser(item.user_id)"
              :disabled="item.username === 'admin'"
              class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete User"
            >
              <Trash2 class="w-3.5 h-3.5" /> Delete
            </button>
          </template>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { UserPlus, Users, RefreshCw, Trash2, Loader2 } from "lucide-vue-next";
import DataTable from "../components/DataTable.vue";

const columns = [
  { key: "index", label: "#", sortable: false, width: "60px" },
  { key: "employee", label: "Employee Name", sortable: true },
  { key: "position", label: "Position", sortable: true },
  { key: "username", label: "Username", sortable: true },
  { key: "role", label: "Role", sortable: true },
  { key: "action", label: "Action", align: "center", sortable: false }
];

const form = ref({
  role: "Encoder",
  employee: "",
  position: "",
  username: "",
  password: ""
});

const users = ref([]);
const loading = ref(false);
const tableLoading = ref(true);

const fetchUsers = async () => {
  tableLoading.value = true;
  try {
    const res = await axios.get("/api/users");
    if (res.data.success) {
      users.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    tableLoading.value = false;
  }
};

const saveUser = async () => {
  if (!form.value.employee || !form.value.position || !form.value.username || !form.value.password) {
    alert("Please fill in all user account fields");
    return;
  }

  loading.value = true;
  try {
    const res = await axios.post("/api/users", form.value);
    if (res.data.success) {
      alert("User added successfully!");
      form.value = { role: "Encoder", employee: "", position: "", username: "", password: "" };
      fetchUsers();
    }
  } catch (err) {
    alert(err.response?.data?.message || "Failed to add user");
  } finally {
    loading.value = false;
  }
};

const deleteUser = async (user_id) => {
  if (confirm("Are you sure you want to delete this user?")) {
    try {
      await axios.delete(`/api/users/${user_id}`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user");
    }
  }
};

onMounted(() => {
  fetchUsers();
});
</script>
