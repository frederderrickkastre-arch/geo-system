<template>
  <div class="page-container">
    <CrudTable :data="tableData" :loading="loading" :total="total" @add="ElMessage.info('创建发布任务')" @refresh="loadData" @search="handleSearch" @delete="handleDelete">
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="name" label="任务名称" min-width="200" />
      <el-table-column prop="account" label="发布账号" width="150" />
      <el-table-column prop="articleCount" label="文章数" width="100" align="center" />
      <el-table-column prop="publishedCount" label="已发布" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'running' ? 'warning' : 'info'" size="small">
            {{ row.status === 'completed' ? '已完成' : row.status === 'running' ? '发布中' : '待发布' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="180" sortable />
    </CrudTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'

const loading = ref(false); const tableData = ref<any[]>([]); const total = ref(0)
function loadData() { loading.value = true; setTimeout(() => { tableData.value = []; total.value = 0; loading.value = false }, 200) }
function handleSearch() { loadData() }
function handleDelete() { ElMessage.info('暂无数据') }
onMounted(loadData)
</script>
