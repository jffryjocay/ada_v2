<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="text-center mb-6">
      <h2 class="text-2xl font-bold text-slate-800">Default Settings & Signatories</h2>
      <p class="text-slate-500 text-sm mt-1">Configure agency default values and authorized signatories</p>
    </div>

    <!-- Agency Default Information -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Building2 class="w-5 h-5 text-blue-600" /> Agency Default Information
        </h3>
        <div class="h-6 flex items-center">
          <span v-if="cardStatus.agency === 'saving'" class="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-1.5">
            <Loader2 class="w-3.5 h-3.5 animate-spin text-slate-400" /> saving...
          </span>
          <span v-else-if="cardStatus.agency === 'saved'" class="text-xs font-semibold text-emerald-600 flex items-center gap-1 transition-all duration-300">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" /> Saved
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Addressee</label>
          <input
            type="text"
            v-model="defaults.addressee"
            @input="triggerAutoSave('agency')"
            class="form-input"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Bank</label>
          <input
            type="text"
            v-model="defaults.bank"
            @input="triggerAutoSave('agency')"
            class="form-input"
          />
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Account No.</label>
          <input
            type="text"
            v-model="defaults.account_no"
            @input="triggerAutoSave('agency')"
            class="form-input font-mono"
          />
        </div>
      </div>
    </div>

    <!-- ADA Authorized Signatories -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
      <div class="mb-4 pb-2 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <PenTool class="w-5 h-5 text-indigo-600" /> ADA Authorized Signatories (Appendix 36)
        </h3>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Left Signatory</h4>
            <div class="h-4 flex items-center">
              <span v-if="cardStatus.left === 'saving'" class="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-1">
                <Loader2 class="w-3 h-3 animate-spin text-slate-400" /> saving...
              </span>
              <span v-else-if="cardStatus.left === 'saved'" class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3 text-emerald-500" /> Saved
              </span>
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name</label>
              <input type="text" v-model="defaults.left_name" @input="triggerAutoSave('left')" class="form-input" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Position / Title</label>
              <input type="text" v-model="defaults.left_title" @input="triggerAutoSave('left')" class="form-input" />
            </div>
          </div>
        </div>

        <div class="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <div class="flex justify-between items-center mb-4">
            <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Right Signatory</h4>
            <div class="h-4 flex items-center">
              <span v-if="cardStatus.right === 'saving'" class="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-1">
                <Loader2 class="w-3 h-3 animate-spin text-slate-400" /> saving...
              </span>
              <span v-else-if="cardStatus.right === 'saved'" class="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3 text-emerald-500" /> Saved
              </span>
            </div>
          </div>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name</label>
              <input type="text" v-model="defaults.right_name" @input="triggerAutoSave('right')" class="form-input" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Position / Title</label>
              <input type="text" v-model="defaults.right_title" @input="triggerAutoSave('right')" class="form-input" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- RADAI Authorized Signatory -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 max-w-xl mx-auto">
      <div class="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
        <h3 class="text-lg font-bold text-slate-800 flex items-center gap-2">
          <PenTool class="w-5 h-5 text-indigo-600" /> RADAI Authorized Signatory (Appendix 37)
        </h3>
        <div class="h-6 flex items-center">
          <span v-if="cardStatus.radai === 'saving'" class="text-xs font-semibold text-slate-400 animate-pulse flex items-center gap-1.5">
            <Loader2 class="w-3.5 h-3.5 animate-spin text-slate-400" /> saving...
          </span>
          <span v-else-if="cardStatus.radai === 'saved'" class="text-xs font-semibold text-emerald-600 flex items-center gap-1 transition-all duration-300">
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" /> Saved
          </span>
        </div>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Name</label>
          <input type="text" v-model="defaults.radai_name" @input="triggerAutoSave('radai')" class="form-input" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Position / Title</label>
          <input type="text" v-model="defaults.radai_position" @input="triggerAutoSave('radai')" class="form-input" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";
import { Building2, CheckCircle2, PenTool, Loader2 } from "lucide-vue-next";

const defaults = ref({
  addressee: "",
  bank: "",
  account_no: "",
  left_name: "",
  left_title: "",
  right_name: "",
  right_title: "",
  radai_name: "",
  radai_position: "",
  year_beg: ""
});

const cardStatus = ref({
  agency: "idle",
  left: "idle",
  right: "idle",
  radai: "idle"
});

const timers = {};

const fetchDefaults = async () => {
  try {
    const res = await axios.get("/api/defaults");
    if (res.data.success && res.data.data) {
      defaults.value = res.data.data;
    }
  } catch (err) {
    console.error(err);
  }
};

const triggerAutoSave = (cardKey) => {
  cardStatus.value[cardKey] = "saving";

  if (timers[cardKey]) clearTimeout(timers[cardKey]);
  if (timers[cardKey + "_reset"]) clearTimeout(timers[cardKey + "_reset"]);

  timers[cardKey] = setTimeout(async () => {
    try {
      const res = await axios.put("/api/defaults", defaults.value);
      if (res.data.success) {
        cardStatus.value[cardKey] = "saved";
        timers[cardKey + "_reset"] = setTimeout(() => {
          if (cardStatus.value[cardKey] === "saved") {
            cardStatus.value[cardKey] = "idle";
          }
        }, 2000);
      }
    } catch (err) {
      cardStatus.value[cardKey] = "idle";
    }
  }, 400);
};

onMounted(() => {
  fetchDefaults();
});
</script>
