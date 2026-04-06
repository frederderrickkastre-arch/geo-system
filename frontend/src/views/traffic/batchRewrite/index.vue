<template>
  <div class="page-container">
    <CrudTable :data="tableData" :loading="loading" :total="total" :page="page" :page-size="pageSize"
      @add="showDialog()" @edit="showDialog($event)" @delete="handleDelete($event)" @batch-delete="handleBatchDelete"
      @refresh="loadData" @search="handleSearch" @page-change="page = $event; loadData()" @size-change="pageSize = $event; loadData()">
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="name" label="任务名" min-width="180" />
      <el-table-column prop="keyword" label="关键词" width="150" />
      <el-table-column prop="max_rewrite" label="最大改写量" width="120" align="center" />
      <el-table-column prop="current_count" label="当前数量" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'running' ? 'warning' : 'info'" size="small">
            {{ row.status === 'completed' ? '已完成' : row.status === 'running' ? '执行中' : '待执行' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="添加时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑任务' : '添加批量复刻任务'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="任务名称" prop="name"><el-input v-model="form.name" placeholder="请输入任务名称" /></el-form-item>
        <el-form-item label="关键词" prop="keyword"><el-input v-model="form.keyword" placeholder="请输入关键词" /></el-form-item>
        <el-form-item label="最大改写量"><el-input-number v-model="form.maxRewrite" :min="1" :max="500" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const loading = ref(false); const tableData = ref<any[]>([]); const total = ref(0); const page = ref(1); const pageSize = ref(10); const searchText = ref('')
const dialogVisible = ref(false); const editingItem = ref<any>(null); const formRef = ref<FormInstance>()
const form = reactive({ name: '', keyword: '', maxRewrite: 50 })
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }], keyword: [{ required: true, message: '请输入关键词', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/traffic/batch-rewrite', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list; total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }
function showDialog(item?: any) { editingItem.value = item || null; form.name = item?.name || ''; form.keyword = item?.keyword || ''; form.maxRewrite = item?.max_rewrite || 50; dialogVisible.value = true }

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false); if (!v) return
  try {
    if (editingItem.value) { await request.put(`/traffic/batch-rewrite/${editingItem.value.id}`, form); ElMessage.success('修改成功') }
    else { await request.post('/traffic/batch-rewrite', form); ElMessage.success('任务创建成功') }
    dialogVisible.value = false; loadData()
  } catch {}
}

function handleDelete(row: any) { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/traffic/batch-rewrite/${row.id}`); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
function handleBatchDelete(rows: any[]) { ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => { await request.delete('/traffic/batch-rewrite/batch', { data: { ids: rows.map(r => r.id) } }); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
onMounted(loadData)
</script>
