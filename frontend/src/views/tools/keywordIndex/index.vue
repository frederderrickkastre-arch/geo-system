<template>
  <div class="page-container">
    <div class="page-card query-card">
      <h3 style="margin-bottom: 20px">关键词指数查询</h3>
      <el-form :inline="true">
        <el-form-item>
          <el-input v-model="keyword" placeholder="请输入关键词" style="width: 360px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleQuery">查询（-10 点数）</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      <el-descriptions v-if="result" :column="5" border style="margin-top: 12px">
        <el-descriptions-item label="关键词">{{ result.keyword }}</el-descriptions-item>
        <el-descriptions-item label="百度指数">{{ result.baiduIndex }}</el-descriptions-item>
        <el-descriptions-item label="360 指数">{{ result.soIndex }}</el-descriptions-item>
        <el-descriptions-item label="搜狗指数">{{ result.sogouIndex }}</el-descriptions-item>
        <el-descriptions-item label="竞争度">
          <el-tag :type="compTag(result.competition)" size="small">{{ result.competition }}</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="page-card" style="margin-top: 16px">
      <h4 style="margin: 0 0 12px">查询历史</h4>
      <CrudTable
        :data="tableData"
        :loading="historyLoading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        :show-actions="false"
        @refresh="loadHistory"
        @search="handleSearch"
        @page-change="page = $event; loadHistory()"
        @size-change="pageSize = $event; loadHistory()"
      >
        <template #toolbar-left>
          <el-button @click="loadHistory"><el-icon><Refresh /></el-icon></el-button>
        </template>
        <el-table-column prop="keyword" label="关键词" min-width="180" />
        <el-table-column prop="baidu_index" label="百度指数" width="110" align="center" />
        <el-table-column prop="so_index" label="360 指数" width="110" align="center" />
        <el-table-column prop="sogou_index" label="搜狗指数" width="110" align="center" />
        <el-table-column prop="competition" label="竞争度" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="compTag(row.competition)" size="small">{{ row.competition }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="查询时间" width="180" sortable />
      </CrudTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const keyword = ref('')
const loading = ref(false)
const result = ref<any>(null)

const historyLoading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')

async function handleQuery() {
  if (!keyword.value) {
    ElMessage.warning('请输入关键词')
    return
  }
  loading.value = true
  try {
    result.value = await request.post('/tools/keyword-index', { keyword: keyword.value })
    loadHistory()
  } finally {
    loading.value = false
  }
}

function handleReset() {
  keyword.value = ''
  result.value = null
}

async function loadHistory() {
  historyLoading.value = true
  try {
    const data = await request.get('/tools/keyword-index/history', {
      params: { page: page.value, pageSize: pageSize.value, search: searchText.value },
    })
    tableData.value = data.list
    total.value = data.total
  } finally {
    historyLoading.value = false
  }
}

function handleSearch(t: string) {
  searchText.value = t
  page.value = 1
  loadHistory()
}

function compTag(c: string) {
  return c === '高' ? 'danger' : c === '中' ? 'warning' : 'success'
}

onMounted(loadHistory)
</script>

<style scoped lang="scss">
.query-card {
  padding: 24px;
}
</style>
