<template>
  <div class="page-container">
    <CrudTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :show-actions="false"
      @refresh="loadData"
      @search="handleSearch"
      @export="handleExport"
      @page-change="page = $event; loadData()"
      @size-change="pageSize = $event; loadData()"
    >
      <template #toolbar-left>
        <el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button>
        <el-select v-model="platformFilter" placeholder="全部平台" clearable style="width: 140px" @change="onFilterChange">
          <el-option v-for="p in platforms" :key="p" :label="p" :value="p" />
        </el-select>
        <el-select v-model="indexedFilter" placeholder="收录状态" clearable style="width: 130px" @change="onFilterChange">
          <el-option label="已收录" value="1" />
          <el-option label="未收录" value="0" />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始"
          end-placeholder="结束"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="onFilterChange"
        />
      </template>
      <el-table-column prop="id" label="序号" width="80" align="center" />
      <el-table-column prop="keyword" label="关键词" min-width="200" />
      <el-table-column prop="platform" label="平台" width="120" />
      <el-table-column prop="indexed" label="收录状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.indexed ? 'success' : 'danger'" size="small">{{ row.indexed ? '已收录' : '未收录' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="source" label="数据来源" width="140" />
      <el-table-column prop="query_time" label="查询时间" width="180" sortable />
    </CrudTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'
import { exportCsv } from '@/utils/export'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const platformFilter = ref('')
const indexedFilter = ref('')
const dateRange = ref<[string, string] | null>(null)

const platforms = ['deepseek', '豆包', '元宝', '千问', '文心', '纳米', 'kimi', '智谱']

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/data/query-records', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        search: searchText.value,
        platform: platformFilter.value,
        indexed: indexedFilter.value,
        startDate: dateRange.value?.[0],
        endDate: dateRange.value?.[1],
      },
    })
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(t: string) {
  searchText.value = t
  page.value = 1
  loadData()
}

function onFilterChange() {
  page.value = 1
  loadData()
}

async function handleExport() {
  const data = await request.get('/data/query-records', {
    params: {
      page: 1,
      pageSize: 10000,
      search: searchText.value,
      platform: platformFilter.value,
      indexed: indexedFilter.value,
      startDate: dateRange.value?.[0],
      endDate: dateRange.value?.[1],
    },
  })
  exportCsv('AI平台查询记录', [
    { label: '序号', prop: 'id' },
    { label: '关键词', prop: 'keyword' },
    { label: '平台', prop: 'platform' },
    { label: '收录状态', prop: 'indexed', formatter: (r) => (r.indexed ? '已收录' : '未收录') },
    { label: '数据来源', prop: 'source' },
    { label: '查询时间', prop: 'query_time' },
  ], data.list || [])
}

onMounted(loadData)
</script>
