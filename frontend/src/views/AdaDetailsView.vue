<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h2 class="text-2xl font-bold text-slate-800">ADA Itemized References & Payees</h2>
        <p class="text-slate-500 text-sm mt-1">ADA No.: <span class="font-mono font-bold text-blue-700">{{ adaNo }}</span></p>
      </div>
      <div class="flex gap-3">
        <router-link to="/ada" class="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 text-sm transition-colors shadow-sm flex items-center gap-1.5">
          <ArrowLeft class="w-4 h-4" /> Back to ADA List
        </router-link>
        <button @click="openPrint" class="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl text-sm transition-colors shadow-md flex items-center gap-2 cursor-pointer">
          <Printer class="w-4 h-4" /> Print Slip (Appendix 36)
        </button>
      </div>
    </div>

    <!-- Add Item Form -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <h3 class="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        <FilePlus class="w-5 h-5 text-blue-600" /> Add Reference & Amount Entry
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Office / Department / Payee</label>
          <select v-model="officeSelect" class="form-select">
            <option value="Land Bank of the Philippines">Land Bank of the Philippines</option>
            <option value="Development Bank of the Philippines">Development Bank of the Philippines</option>
            <option value="others">Other (Specify below)</option>
          </select>
        </div>

        <div v-if="officeSelect === 'others'">
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Specify Payee Name</label>
          <input type="text" v-model="officeCustom" placeholder="Enter Office / Payee Name" class="form-input" />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Reference No.</label>
          <input type="text" ref="refInput" v-model="reference" placeholder="Reference No." class="form-input" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Nature of Payment</label>
          <input type="text" v-model="nop" placeholder="Nature of payment" class="form-input" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">CAFOA</label>
          <input type="text" v-model="cafoa" placeholder="CAFOA No." class="form-input" />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Amount (₱)</label>
          <input
            type="number"
            step="0.01"
            v-model="amount"
            placeholder="0.00"
            @keyup.enter="saveOfficeItem"
            class="form-input font-mono font-semibold"
          />
        </div>
      </div>

      <div class="flex justify-end mt-6">
        <button
          @click="saveOfficeItem"
          class="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-600/20 text-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus class="w-4 h-4" /> Save Item
        </button>
      </div>
    </div>

    <!-- Itemized List Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-800">Payees & References</h3>
        <div class="text-lg font-bold text-slate-800">
          Total Amount: <span class="text-blue-600 font-mono">₱ {{ formatCurrency(totalAmount) }}</span>
        </div>
      </div>

      <DataTable
        :data="items"
        :columns="columns"
        rowKey="office_id"
        :loading="loading"
        searchPlaceholder="Search payees, references, nature of payment, CAFOA..."
        emptyMessage="No payee items added yet for this ADA record."
      >
        <template #office="{ value }">
          <span class="font-medium text-slate-800">{{ value }}</span>
        </template>
        <template #reference="{ value }">
          <span class="text-slate-600 font-mono">{{ value }}</span>
        </template>
        <template #nop="{ value }">
          <span class="text-slate-600">{{ value }}</span>
        </template>
        <template #cafoa="{ value }">
          <span class="text-slate-600 font-mono">{{ value || '-' }}</span>
        </template>
        <template #amount="{ value }">
          <span class="font-bold text-slate-900 font-mono">₱ {{ formatCurrency(value) }}</span>
        </template>
        <template #action="{ item }">
          <button
            @click="deleteOfficeItem(item.office_id)"
            class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 mx-auto"
          >
            <Trash2 class="w-3.5 h-3.5" /> Delete
          </button>
        </template>
        <template #footer v-if="items.length > 0">
          <tr class="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-800">
            <td colspan="4" class="py-3.5 px-4 text-right uppercase text-xs tracking-wider">Total Amount:</td>
            <td class="py-3.5 px-4 text-right text-blue-700 font-mono text-base">₱ {{ formatCurrency(totalAmount) }}</td>
            <td></td>
          </tr>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import { ArrowLeft, Printer, FilePlus, Plus, Trash2, Loader2 } from "lucide-vue-next";
import DataTable from "../components/DataTable.vue";

const route = useRoute();
const adaNo = computed(() => route.params.ada_no);

const columns = [
  { key: "office", label: "Office / Department / Payee", sortable: true },
  { key: "reference", label: "Reference", sortable: true },
  { key: "nop", label: "Nature of Payment", sortable: true },
  { key: "cafoa", label: "CAFOA", sortable: true },
  { key: "amount", label: "Amount (₱)", align: "right", sortable: true },
  { key: "action", label: "Action", align: "center", sortable: false }
];

const officeSelect = ref("Land Bank of the Philippines");
const officeCustom = ref("");
const reference = ref("");
const nop = ref("");
const cafoa = ref("");
const amount = ref("");
const items = ref([]);
const loading = ref(true);

const refInput = ref(null);

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
});

const fetchItems = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`/api/offices/${encodeURIComponent(adaNo.value)}`);
    if (res.data.success) {
      items.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const saveOfficeItem = async () => {
  const officeName = officeSelect.value === "others" ? officeCustom.value : officeSelect.value;

  if (!officeName || !reference.value || !nop.value || amount.value === "") {
    alert("Please fill in Office, Reference, Nature of Payment, and Amount.");
    return;
  }

  try {
    const res = await axios.post(`/api/offices/${encodeURIComponent(adaNo.value)}`, {
      office: officeName,
      reference: reference.value,
      nop: nop.value,
      cafoa: cafoa.value,
      amount: parseFloat(amount.value)
    });

    if (res.data.success) {
      reference.value = "";
      nop.value = "";
      cafoa.value = "";
      amount.value = "";
      if (refInput.value) refInput.value.focus();
      fetchItems();
    }
  } catch (err) {
    alert(err.response?.data?.message || "Failed to save item");
  }
};

const deleteOfficeItem = async (office_id) => {
  if (confirm("Are you sure you want to delete this item?")) {
    try {
      await axios.delete(`/api/offices/item/${office_id}`);
      fetchItems();
    } catch (err) {
      alert("Failed to delete item");
    }
  }
};

const openPrint = () => {
  window.open(`/api/reports/pdf/ada/${encodeURIComponent(adaNo.value)}`, "_blank");
};

const formatCurrency = (val) => {
  return parseFloat(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(() => {
  fetchItems();
});
</script>
