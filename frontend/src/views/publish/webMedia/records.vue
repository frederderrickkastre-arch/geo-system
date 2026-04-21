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
        <el-select v-model="statusFilter" placeholder="全部状态" clearable size="default" style="width: 130px" @change="onFilterChange">
          <el-option label="已发布" value="published" />
          <el-option label="待审核" value="pending" />
          <el-option label="已拒绝" value="rejected" />
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
      <el-table-column prop="media_name" label="媒体名称" width="180" />
      <el-table-column prop="title" label="文章标题" min-width="250" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="100" align="center">
        <template #default="{ row }"><span style="color: #f56c6c; font-weight: 600">¥{{ row.price }}</span></template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column prop="publish_url" label="发布链接" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <a v-if="row.publish_url" :href="row.publish_url" target="_blank" style="color: #409eff">{{ row.publish_url }}</a>
          <span v-else style="color: #c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="提交时间" width="180" sortable />
    </CrudTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import CrudTable from '@/components/CrudTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import request from '@/utils/request'
import { exportCsv } from '@/utils/export'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const statusFilter = ref('')
const dateRange = ref<[string, string] | null>(null)

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/media/web/records', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        search: searchText.value,
        status: statusFilter.value,
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
  const data = await request.get('/media/web/records', {
    params: { page: 1, pageSize: 10000, search: searchText.value, status: statusFilter.value, startDate: dateRange.value?.[0], endDate: dateRange.value?.[1] },
  })
  exportCsv('网站媒体投稿记录', [
    { label: '序号', prop: 'id' },
    { label: '媒体名称', prop: 'media_name' },
    { label: '文章标题', prop: 'title' },
    { label: '价格', prop: 'price' },
    { label: '状态', prop: 'status' },
    { label: '发布链接', prop: 'publish_url' },
    { label: '提交时间', prop: 'created_at' },
  ], data.list || [])
}

onMounted(loadData)
</script>
