<template>
  <div class="page-container">
    <CrudTable :data="tableData" :loading="loading" :total="total" :page="page" :page-size="pageSize"
      :show-actions="false" @refresh="loadData" @search="handleSearch"
      @page-change="page = $event; loadData()" @size-change="pageSize = $event; loadData()">
      <template #toolbar-left>
        <el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button>
      </template>
      <el-table-column prop="id" label="序号" width="80" align="center" />
      <el-table-column prop="media_name" label="媒体名称" width="180" />
      <el-table-column prop="title" label="文章标题" min-width="250" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="100" align="center">
        <template #default="{ row }"><span style="color: #f56c6c; font-weight: 600">¥{{ row.price }}</span></template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'" size="small">
            {{ row.status === 'published' ? '已发布' : row.status === 'rejected' ? '已拒绝' : '待审核' }}
          </el-tag>
        </template>
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
import request from '@/utils/request'

const loading = ref(false); const tableData = ref<any[]>([]); const total = ref(0); const page = ref(1); const pageSize = ref(10); const searchText = ref('')

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/media/web/records', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list; total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }
onMounted(loadData)
</script>
