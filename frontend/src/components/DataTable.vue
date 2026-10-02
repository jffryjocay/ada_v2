<template>
  <div class="w-full">
    <!-- Controls Header: Search & Per Page selector -->
    <div v-if="searchable || showPerPage" class="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 mb-4">
      <div v-if="showPerPage" class="flex items-center gap-2 text-xs font-medium text-slate-600">
        <span>Show</span>
        <select
          v-model.number="perPage"
          @change="currentPage = 1"
          class="px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer shadow-sm"
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
        <span>entries per page</span>
      </div>

      <div v-if="searchable" class="relative flex-1 sm:max-w-xs ml-auto">
        <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          v-model="searchQuery"
          @input="currentPage = 1"
          :placeholder="searchPlaceholder"
          class="w-full pl-9 pr-8 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none shadow-sm"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''; currentPage = 1"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold px-1"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Table Container -->
    <div class="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
      <table class="w-full text-left border-collapse text-sm">
        <thead>
          <tr class="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            <th
              v-for="col in columns"
              :key="col.key"
              :class="[
                'py-3 px-4 select-none',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                col.sortable !== false ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''
              ]"
              :style="col.width ? { width: col.width } : {}"
              @click="col.sortable !== false && sortBy(col.key)"
            >
              <div
                class="inline-flex items-center gap-1.5"
                :class="{
                  'flex-row-reverse': col.align === 'right',
                  'justify-center w-full': col.align === 'center'
                }"
              >
                <span>{{ col.label }}</span>
                <span v-if="col.sortable !== false" class="text-slate-400">
                  <ChevronUp v-if="sortKey === col.key && sortOrder === 'asc'" class="w-3.5 h-3.5 text-blue-600" />
                  <ChevronDown v-else-if="sortKey === col.key && sortOrder === 'desc'" class="w-3.5 h-3.5 text-blue-600" />
                  <ChevronsUpDown v-else class="w-3.5 h-3.5 opacity-40 hover:opacity-100" />
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-if="loading">
            <td :colspan="columns.length" class="py-12 text-center text-slate-500 text-sm font-medium">
              <div class="flex flex-col items-center justify-center gap-2">
                <Loader2 class="w-6 h-6 animate-spin text-blue-600" />
                <span>Loading records...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="paginatedData.length === 0">
            <td :colspan="columns.length" class="py-12 text-center text-slate-400 text-sm">
              <div class="flex flex-col items-center justify-center gap-1">
                <span>{{ searchQuery ? 'No records match your search filter.' : emptyMessage }}</span>
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="(item, index) in paginatedData"
            :key="item[rowKey] || index"
            class="hover:bg-slate-50/80 transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'py-3 px-4',
                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
              ]"
            >
              <slot :name="col.key" :item="item" :index="(currentPage - 1) * perPage + index" :value="item[col.key]">
                {{ item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-' }}
              </slot>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="$slots.footer">
          <slot name="footer"></slot>
        </tfoot>
      </table>
    </div>

    <!-- Table Footer: Counter & Pagination -->
    <div v-if="!loading && filteredData.length > 0" class="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 text-xs text-slate-500">
      <div>
        Showing <span class="font-bold text-slate-700">{{ startItem }}</span> to <span class="font-bold text-slate-700">{{ endItem }}</span> of <span class="font-bold text-slate-700">{{ filteredData.length }}</span> entries
        <span v-if="searchQuery" class="text-slate-400">(filtered from {{ data.length }} total entries)</span>
      </div>

      <div v-if="totalPages > 1" class="flex items-center gap-1">
        <button
          @click="currentPage = Math.max(1, currentPage - 1)"
          :disabled="currentPage === 1"
          class="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Previous Page"
        >
          <ChevronLeft class="w-4 h-4" />
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="p in visiblePages"
            :key="p"
            @click="p !== '...' && (currentPage = p)"
            :disabled="p === '...'"
            :class="[
              'px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
              p === currentPage
                ? 'bg-blue-600 text-white shadow-sm'
                : p === '...'
                ? 'cursor-default text-slate-400'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer'
            ]"
          >
            {{ p }}
          </button>
        </div>

        <button
          @click="currentPage = Math.min(totalPages, currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="p-1.5 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          title="Next Page"
        >
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-vue-next";

const props = defineProps({
  data: { type: Array, required: true },
  columns: { type: Array, required: true },
  rowKey: { type: String, default: "id" },
  loading: { type: Boolean, default: false },
  searchable: { type: Boolean, default: true },
  showPerPage: { type: Boolean, default: true },
  defaultPerPage: { type: Number, default: 5 },
  emptyMessage: { type: String, default: "No records saved yet." },
  searchPlaceholder: { type: String, default: "Search records..." }
});

const searchQuery = ref("");
const perPage = ref(props.defaultPerPage);
const currentPage = ref(1);
const sortKey = ref("");
const sortOrder = ref("asc"); // 'asc' or 'desc'

const sortBy = (key) => {
  if (sortKey.value === key) {
    if (sortOrder.value === "asc") {
      sortOrder.value = "desc";
    } else {
      sortKey.value = "";
      sortOrder.value = "asc";
    }
  } else {
    sortKey.value = key;
    sortOrder.value = "asc";
  }
};

const filteredData = computed(() => {
  let result = [...props.data];

  // Search filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    result = result.filter((item) => {
      return Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }

  // Sort
  if (sortKey.value) {
    result.sort((a, b) => {
      let valA = a[sortKey.value];
      let valB = b[sortKey.value];

      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";

      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder.value === "asc" ? valA - valB : valB - valA;
      }

      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortOrder.value === "asc" ? -1 : 1;
      if (strA > strB) return sortOrder.value === "asc" ? 1 : -1;
      return 0;
    });
  }

  return result;
});

const totalPages = computed(() => {
  return Math.ceil(filteredData.value.length / perPage.value) || 1;
});

const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * perPage.value;
  return filteredData.value.slice(start, start + perPage.value);
});

const startItem = computed(() => {
  if (filteredData.value.length === 0) return 0;
  return (currentPage.value - 1) * perPage.value + 1;
});

const endItem = computed(() => {
  return Math.min(currentPage.value * perPage.value, filteredData.value.length);
});

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const pages = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 2) pages.push("...");
    pages.push(total);
  }

  return pages;
});
</script>
