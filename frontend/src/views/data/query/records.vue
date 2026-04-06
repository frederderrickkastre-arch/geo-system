<template>
  <div class="page-container">
    <CrudTable :data="tableData" :loading="loading" :total="total" :page="page" :page-size="pageSize"
      :show-actions="false" @refresh="loadData" @search="handleSearch"
      @page-change="page = $event; loadData()" @size-change="pageSize = $event; loadData()">
      <template #toolbar-left><el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button></template>
      <el-table-column prop="id" label="序号" width="80" align="center" />
      <el-table-column prop="keyword" label="关键词" min-width="200" />
      <el-table-column prop="platform" label="平台" width="120" />
      <el-table-column prop="indexed" label="收录状态" width="120" align="center">
        <template #default="{ row }"><el-tag :type="row.indexed ? 'success' : 'danger'" size="small">{{ row.indexed ? '已收录' : '未收录' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="query_time" label="查询时间" width="180" sortable />
    </CrudTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const loading = ref(false); const tableData = ref<any[]>([]); const total = ref(0); const page = ref(1); const pageSize = ref(10); const searchText = ref('')

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/data/query-records', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list; total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }
onMounted(loadData)
</script>
