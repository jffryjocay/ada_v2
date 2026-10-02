<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Summary & RADAI Management</h2>
    </div>

    <!-- RADAI Generator Form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <h3 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        <FileSpreadsheet class="w-5 h-5 text-blue-600" /> Generate RADAI Report
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Date Range Filter</label>
          <select v-model="dateRange" class="form-select">
            <option value="daily">Daily</option>
            <option value="as_of">As of</option>
            <option value="periodic">Periodic</option>
          </select>
        </div>

        <div v-if="dateRange === 'daily'">
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Date</label>
          <input type="date" v-model="todaysDate" class="form-date" />
        </div>

        <div v-if="dateRange === 'as_of'" class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Fixed (Jan 1)</label>
            <input type="date" v-model="fixDate" disabled class="form-date" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">To Date</label>
            <input type="date" v-model="todaysDate" class="form-date" />
          </div>
        </div>

        <div v-if="dateRange === 'periodic'" class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Beginning Date</label>
            <input type="date" v-model="begDate" class="form-date" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">End Date</label>
            <input type="date" v-model="endDate" class="form-date" />
          </div>
        </div>

        <div class="flex items-end">
          <button
            @click="generateRadai"
            class="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md shadow-blue-500/20 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileCheck class="w-4 h-4" /> Generate Report
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Report No.</label>
          <div class="flex gap-2">
            <input
              type="text"
              v-model="reportNo"
              :disabled="!isReportNoEditable"
              class="form-input font-mono font-semibold"
            />
            <button
              v-if="authStore.isAdmin"
              @click="isReportNoEditable = !isReportNoEditable"
              class="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
            >
              <Lock v-if="!isReportNoEditable" class="w-3.5 h-3.5" />
              <Unlock v-else class="w-3.5 h-3.5" />
              {{ isReportNoEditable ? "Lock" : "Overwrite" }}
            </button>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Fund</label>
          <select v-model="selectedFund" class="form-select">
            <option value="General Fund">General Fund</option>
            <option value="School Fund">School Fund</option>
            <option value="Trust Fund">Trust Fund</option>
            <option value="Calamity Fund">Calamity Fund</option>
            <option value="others">Others</option>
          </select>
        </div>

        <div v-if="selectedFund === 'others'">
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Specify Fund</label>
          <input type="text" v-model="customFund" placeholder="Custom Fund Name" class="form-input" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Account No.</label>
          <select v-model="selectedAcct" class="form-select">
            <option value="2012-1001-78">2012-1001-78</option>
            <option value="2012-1002-75">2012-1002-75</option>
            <option value="2012-1001-86">2012-1001-86</option>
            <option value="2012-1001-94">2012-1001-94</option>
            <option value="others">Others</option>
          </select>
        </div>

        <div v-if="selectedAcct === 'others'">
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Specify Account No.</label>
          <input type="text" v-model="customAcct" placeholder="Custom Account No." class="form-input" />
        </div>
      </div>
    </div>

    <!-- Transaction History -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History class="w-5 h-5 text-slate-600" /> Transaction History
        </h3>
        <button @click="fetchRadaiList" class="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
          <RefreshCw class="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <DataTable
        :data="radaiList"
        :columns="columns"
        rowKey="radai_id"
        :loading="loading"
        searchPlaceholder="Search RADAI reports by Report No, Fund, Account..."
        emptyMessage="No RADAI report transactions recorded yet."
      >
        <template #report_no="{ value }">
          <span class="font-mono font-bold text-slate-800">{{ value }}</span>
        </template>
        <template #date_range="{ value }">
          <span class="px-2.5 py-1 rounded-md text-xs font-semibold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
            {{ value }}
          </span>
        </template>
        <template #one_date="{ value }">
          <span class="text-slate-600">{{ formatDate(value) }}</span>
        </template>
        <template #two_date="{ value }">
          <span class="text-slate-600">{{ formatDate(value) }}</span>
        </template>
        <template #fund="{ value }">
          <span class="text-slate-700 font-medium">{{ value }}</span>
        </template>
        <template #account_no="{ value }">
          <span class="text-slate-700 font-mono">{{ value }}</span>
        </template>
        <template #actions="{ item }">
          <div class="flex items-center justify-center gap-2">
            <button
              @click="openPrintReport(item.report_no)"
              class="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Printer class="w-3.5 h-3.5" /> View / Print
            </button>
            <button
              @click="deleteRadai(item.radai_id)"
              class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1"
              title="Delete Record"
            >
              <Trash2 class="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { useAuthStore } from "../stores/auth";
import { FileSpreadsheet, FileCheck, RefreshCw, Printer, Trash2, Lock, Unlock, History, Loader2 } from "lucide-vue-next";
import DataTable from "../components/DataTable.vue";

const authStore = useAuthStore();

const columns = [
  { key: "report_no", label: "Report No.", sortable: true },
  { key: "date_range", label: "Range Filter", sortable: true },
  { key: "one_date", label: "Date One", sortable: true },
  { key: "two_date", label: "Date Two", sortable: true },
  { key: "fund", label: "Fund", sortable: true },
  { key: "account_no", label: "Account No.", sortable: true },
  { key: "actions", label: "Actions", align: "center", sortable: false }
];

const dateRange = ref("daily");
const todaysDate = ref(new Date().toISOString().split("T")[0]);
const fixDate = ref(`${new Date().getFullYear()}-01-01`);
const begDate = ref("");
const endDate = ref("");

const reportNo = ref("");
const countId = ref("0001");
const isReportNoEditable = ref(false);

const selectedFund = ref("General Fund");
const customFund = ref("");
const selectedAcct = ref("2012-1001-78");
const customAcct = ref("");

const radaiList = ref([]);
const loading = ref(true);

const fetchNextReportNo = async () => {
  try {
    const res = await axios.get("/api/radai/next-no");
    if (res.data.success) {
      reportNo.value = res.data.report_no;
      countId.value = res.data.count;
    }
  } catch (err) {
    console.error(err);
  }
};

const fetchRadaiList = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/radai");
    if (res.data.success) {
      radaiList.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const generateRadai = async () => {
  const fund = selectedFund.value === "others" ? customFund.value : selectedFund.value;
  const acctno = selectedAcct.value === "others" ? customAcct.value : selectedAcct.value;

  if (!reportNo.value || !fund || !acctno) {
    alert("Please complete all required report fields.");
    return;
  }

  try {
    const payload = {
      report_no: reportNo.value,
      date_range: dateRange.value,
      todays_date: todaysDate.value,
      fix_date: fixDate.value,
      beg_date: begDate.value,
      end_date: endDate.value,
      fund,
      acctno
    };

    const res = await axios.post("/api/radai", payload);
    if (res.data.success) {
      fetchRadaiList();
      fetchNextReportNo();
      window.open(`/api/reports/pdf/radai/${encodeURIComponent(res.data.report_no)}`, "_blank");
    }
  } catch (err) {
    alert(err.response?.data?.message || "Error generating RADAI report");
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

const openPrintReport = (rNo) => {
  window.open(`/api/reports/pdf/radai/${encodeURIComponent(rNo)}`, "_blank");
};

const deleteRadai = async (id) => {
  if (confirm("Are you sure you want to delete this RADAI record?")) {
    try {
      await axios.delete(`/api/radai/${id}`);
      fetchRadaiList();
      fetchNextReportNo();
    } catch (err) {
      alert("Failed to delete record");
    }
  }
};

onMounted(() => {
  fetchNextReportNo();
  fetchRadaiList();
});
</script>
