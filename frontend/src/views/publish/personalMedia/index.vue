<template>
  <div class="page-container">
    <div class="page-card" style="margin-bottom: 16px">
      <el-alert title="请下载助手应用并使用设备授权码绑定您的自媒体账号" type="info" :closable="false" show-icon />
      <div style="margin-top: 12px; display: flex; align-items: center; gap: 16px">
        <span>设备授权码：<strong style="font-size: 18px; color: #7c3aed">14387</strong></span>
        <el-button type="primary"><el-icon><Download /></el-icon>下载助手</el-button>
      </div>
    </div>
    <CrudTable :data="tableData" :loading="loading" :total="total" @refresh="loadData" @search="handleSearch" @delete="handleDelete($event)" @batch-delete="handleBatchDelete">
      <template #toolbar-left>
        <el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button>
        <el-button type="danger"><el-icon><Delete /></el-icon>删除</el-button>
      </template>
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="name" label="账号名称" width="160" />
      <el-table-column label="头像" width="80" align="center">
        <template #default><el-avatar :size="32" :style="{ background: '#e6e8eb' }">U</el-avatar></template>
      </el-table-column>
      <el-table-column prop="platform" label="自媒体" width="120" />
      <el-table-column prop="publish_status" label="发布状态" width="100" align="center">
        <template #default="{ row }"><el-tag :type="row.publish_status === 'active' ? 'success' : 'info'" size="small">{{ row.publish_status === 'active' ? '正常' : '暂停' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="proxy_ip" label="代理IP" width="140" />
      <el-table-column prop="today_count" label="今日发布" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }"><el-tag :type="row.status === 'online' ? 'success' : 'danger'" size="small">{{ row.status === 'online' ? '在线' : '离线' }}</el-tag></template>
      </el-table-column>
      <el-table-column prop="auth_at" label="授权时间" width="180" sortable />
    </CrudTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const loading = ref(false); const tableData = ref<any[]>([]); const total = ref(0)

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/media/personal/accounts', { params: { page: 1, pageSize: 10 } })
    tableData.value = data.list; total.value = data.total
  } finally { loading.value = false }
}

function handleSearch() { loadData() }

function handleDelete(row: any) {
  ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => {
    await request.delete(`/media/personal/accounts/${row.id}`)
    loadData(); ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleBatchDelete(rows: any[]) {
  ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => {
    await request.delete('/media/personal/accounts/batch', { data: { ids: rows.map(r => r.id) } })
    loadData(); ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(loadData)
</script>
