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
      <template #toolbar-extra>
        <el-button type="primary" plain @click="$router.push('/material/keyword')">
          <el-icon><Back /></el-icon>返回上一级
        </el-button>
      </template>
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="keyword" label="主词" width="180" />
      <el-table-column prop="question" label="问题" min-width="300" />
      <el-table-column prop="index_status" label="收录状态" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="row.index_status === 'indexed' ? 'success' : 'info'" size="small">
            {{ row.index_status === 'indexed' ? '已收录' : '未收录' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑标题' : '添加标题'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="主词" prop="keyword">
          <el-input v-model="form.keyword" placeholder="请输入关联的主关键词" />
        </el-form-item>
        <el-form-item label="问题" prop="question">
          <el-input v-model="form.question" type="textarea" :rows="3" placeholder="请输入写作标题/问题" />
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
const form = reactive({ keyword: '', question: '' })
const rules = {
  keyword: [{ required: true, message: '请输入主词', trigger: 'blur' }],
  question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/questions', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(text: string) { searchText.value = text; page.value = 1; loadData() }

function showDialog(item?: any) {
  editingItem.value = item || null
  form.keyword = item?.keyword || ''
  form.question = item?.question || ''
  dialogVisible.value = true
}

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  try {
    if (editingItem.value) {
      await request.put(`/questions/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/questions', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

function handleDelete(row: any) {
  ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => {
    await request.delete(`/questions/${row.id}`)
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleBatchDelete(rows: any[]) {
  ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => {
    await request.delete('/questions/batch', { data: { ids: rows.map(r => r.id) } })
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(loadData)
</script>
