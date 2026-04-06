<template>
  <div class="page-container">
    <CrudTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      @add="showDialog()"
      @edit="showDialog($event)"
      @delete="handleDelete($event)"
      @batch-delete="handleBatchDelete"
      @refresh="loadData"
      @search="handleSearch"
      @page-change="page = $event; loadData()"
      @size-change="pageSize = $event; loadData()"
    >
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="keyword" label="主词" min-width="200" />
      <el-table-column prop="question_count" label="问题数量" width="120" align="center" />
      <el-table-column prop="status" label="优化状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
            {{ row.status === 'active' ? '已优化' : '未优化' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑关键词' : '添加关键词'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="主词" prop="keyword">
          <el-input v-model="form.keyword" placeholder="请输入主关键词" />
        </el-form-item>
        <el-form-item label="优化状态">
          <el-select v-model="form.status">
            <el-option label="未优化" value="inactive" />
            <el-option label="已优化" value="active" />
          </el-select>
        </el-form-item>
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

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const dialogVisible = ref(false)
const editingItem = ref<any>(null)
const formRef = ref<FormInstance>()

const form = reactive({ keyword: '', status: 'inactive' })
const rules = { keyword: [{ required: true, message: '请输入主关键词', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/keywords', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(text: string) {
  searchText.value = text
  page.value = 1
  loadData()
}

function showDialog(item?: any) {
  editingItem.value = item || null
  form.keyword = item?.keyword || ''
  form.status = item?.status || 'inactive'
  dialogVisible.value = true
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (editingItem.value) {
      await request.put(`/keywords/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/keywords', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

function handleDelete(row: any) {
  ElMessageBox.confirm('确定删除该关键词？', '提示', { type: 'warning' }).then(async () => {
    await request.delete(`/keywords/${row.id}`)
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleBatchDelete(rows: any[]) {
  ElMessageBox.confirm(`确定删除选中的 ${rows.length} 条记录？`, '提示', { type: 'warning' }).then(async () => {
    await request.delete('/keywords/batch', { data: { ids: rows.map(r => r.id) } })
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(loadData)
</script>
