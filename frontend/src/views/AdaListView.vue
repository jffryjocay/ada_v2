<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Authority to Debit Account (ADA)</h2>
    </div>

    <!-- Create ADA Form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <h3 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        <FilePlus class="w-5 h-5 text-blue-600" /> Create New ADA Record
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">ADA No.</label>
          <div class="flex gap-2">
            <input
              type="text"
              v-model="adaNo"
              :disabled="!isAdaNoEditable"
              class="form-input font-mono font-semibold"
            />
            <button
              v-if="authStore.isAdmin"
              @click="isAdaNoEditable = !isAdaNoEditable"
              class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <Lock v-if="!isAdaNoEditable" class="w-3.5 h-3.5" />
              <Unlock v-else class="w-3.5 h-3.5" />
              {{ isAdaNoEditable ? "Lock" : "Overwrite" }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Date</label>
          <input
            type="date"
            v-model="adaDate"
            class="form-date"
          />
        </div>

        <div>
          <button
            @click="saveAda"
            class="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save class="w-4 h-4" /> Save ADA Record
          </button>
        </div>
      </div>
    </div>

    <!-- ADA List Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <ListFilter class="w-5 h-5 text-slate-600" /> ADA Records List
        </h3>
        <button @click="fetchAdaList" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
          <RefreshCw class="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <DataTable
        :data="adaList"
        :columns="columns"
        rowKey="ada_id"
        :loading="loading"
        searchPlaceholder="Search ADA records by No., Bank, Account, Addressee..."
        emptyMessage="No ADA records saved yet."
      >
        <template #ada_no="{ value }">
          <span class="font-mono font-bold text-blue-900">{{ value }}</span>
        </template>
        <template #ada_date="{ value }">
          <span class="text-slate-600">{{ formatDate(value) }}</span>
        </template>
        <template #addressee="{ value }">
          <span class="text-slate-700 font-medium">{{ value }}</span>
        </template>
        <template #bank="{ value }">
          <span class="text-slate-600">{{ value }}</span>
        </template>
        <template #account_no="{ value }">
          <span class="text-slate-600 font-mono">{{ value }}</span>
        </template>
        <template #total_amount="{ value }">
          <span class="font-semibold text-slate-900">₱ {{ formatCurrency(value) }}</span>
        </template>
        <template #actions="{ item }">
          <div class="flex items-center justify-center gap-1.5 whitespace-nowrap">
            <router-link
              :to="'/ada/' + encodeURIComponent(item.ada_no)"
              class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg text-xs transition-colors flex items-center gap-1"
            >
              <List class="w-3.5 h-3.5" /> Items ({{ item.office_count }})
            </router-link>
            <button
              @click="openPrintAda(item.ada_no)"
              class="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Printer class="w-3.5 h-3.5" /> Print
            </button>
            <button
              @click="promptEditDate(item)"
              class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <Calendar class="w-3.5 h-3.5" /> Date
            </button>
            <button
              @click="deleteAda(item.ada_no)"
              class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
              title="Delete ADA Record"
            >
              <Trash2 class="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Edit Date Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100">
        <h3 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
          Update Date for ADA No. <span class="font-mono text-blue-600">{{ editingAdaNo }}</span>
        </h3>
        <div class="mb-6">
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">New ADA Date</label>
          <input
            type="date"
            v-model="modalAdaDate"
            class="form-date"
          />
        </div>
        <div class="flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer">
            Cancel
          </button>
          <button @click="updateAdaDate" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition-colors cursor-pointer">
            Update Date
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { FilePlus, Save, RefreshCw, Printer, Calendar, Trash2, List, Lock, Unlock, ListFilter, Loader2 } from "lucide-vue-next";
import DataTable from "../components/DataTable.vue";

const authStore = useAuthStore();

const columns = [
  { key: "ada_no", label: "ADA No.", sortable: true },
  { key: "ada_date", label: "Date", sortable: true },
  { key: "addressee", label: "Addressee", sortable: true },
  { key: "bank", label: "Bank", sortable: true },
  { key: "account_no", label: "Account No.", sortable: true },
  { key: "total_amount", label: "Total Amount", align: "right", sortable: true },
  { key: "actions", label: "Actions", align: "center", sortable: false }
];

const adaNo = ref("");
const countId = ref("0001");
const adaDate = ref(new Date().toISOString().split("T")[0]);
const isAdaNoEditable = ref(false);
const adaList = ref([]);
const loading = ref(true);

const showModal = ref(false);
const editingAdaNo = ref("");
const modalAdaDate = ref("");

const fetchNextAdaNo = async () => {
  try {
    const res = await axios.get("/api/ada/next-no");
    if (res.data.success) {
      adaNo.value = res.data.ada_no;
      countId.value = res.data.count;
    }
  } catch (err) {
    console.error(err);
  }
};

const fetchAdaList = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/ada");
    if (res.data.success) {
      adaList.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const saveAda = async () => {
  if (!adaNo.value || !adaDate.value) {
    alert("ADA No. and Date are required");
    return;
  }

  try {
    const res = await axios.post("/api/ada", {
      ada_no: adaNo.value,
      count: countId.value,
      ada_date: adaDate.value
    });

    if (res.data.success) {
      fetchAdaList();
      fetchNextAdaNo();
    }
  } catch (err) {
    alert(err.response?.data?.message || "Failed to save ADA record");
  }
};

const promptEditDate = (item) => {
  editingAdaNo.value = item.ada_no;
  modalAdaDate.value = item.ada_date;
  showModal.value = true;
};

const updateAdaDate = async () => {
  try {
    const res = await axios.put(`/api/ada/${encodeURIComponent(editingAdaNo.value)}`, {
      ada_date: modalAdaDate.value
    });
    if (res.data.success) {
      showModal.value = false;
      fetchAdaList();
    }
  } catch (err) {
    alert("Failed to update ADA date");
  }
};

const openPrintAda = (ada_no) => {
  window.open(`/api/reports/pdf/ada/${encodeURIComponent(ada_no)}`, "_blank");
};

const deleteAda = async (ada_no) => {
  if (confirm(`Are you sure you want to delete ADA No. ${ada_no}?`)) {
    try {
      await axios.delete(`/api/ada/${encodeURIComponent(ada_no)}`);
      fetchAdaList();
      fetchNextAdaNo();
    } catch (err) {
      alert("Failed to delete record");
    }
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const clean = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const parts = clean.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    }
  }
  return clean;
};

const formatCurrency = (val) => {
  return parseFloat(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(() => {
  fetchNextAdaNo();
  fetchAdaList();
});
</script>
