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
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 130px" @change="onFilterChange">
          <el-option label="发布成功" value="published" />
          <el-option label="发布失败" value="rejected" />
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
      <el-table-column prop="media_name" label="发布账号" width="150" />
      <el-table-column prop="title" label="文章标题" min-width="250" show-overflow-tooltip />
      <el-table-column prop="publish_url" label="发布链接" min-width="220" show-overflow-tooltip>
        <template #default="{ row }">
          <a v-if="row.publish_url" :href="row.publish_url" target="_blank" style="color: #409eff">{{ row.publish_url }}</a>
          <span v-else style="color: #c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'danger'" size="small">
            {{ row.status === 'published' ? '成功' : '失败' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="发布时间" width="180" sortable />
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
const statusFilter = ref('')
const dateRange = ref<[string, string] | null>(null)

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/media/personal/records', {
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
  const data = await request.get('/media/personal/records', {
    params: { page: 1, pageSize: 10000, search: searchText.value, status: statusFilter.value, startDate: dateRange.value?.[0], endDate: dateRange.value?.[1] },
  })
  exportCsv('个人自媒体发布记录', [
    { label: '序号', prop: 'id' },
    { label: '发布账号', prop: 'media_name' },
    { label: '文章标题', prop: 'title' },
    { label: '发布链接', prop: 'publish_url' },
    { label: '状态', prop: 'status' },
    { label: '发布时间', prop: 'created_at' },
  ], data.list || [])
}

onMounted(loadData)
</script>
