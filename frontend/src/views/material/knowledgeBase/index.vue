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
      <el-table-column prop="name" label="名称" min-width="200" />
      <el-table-column prop="company" label="公司名" min-width="250" />
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑知识库' : '添加知识库'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入知识库名称" />
        </el-form-item>
        <el-form-item label="公司名" prop="company">
          <el-input v-model="form.company" placeholder="请输入公司名称" />
        </el-form-item>
        <el-form-item label="企业介绍">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入企业详细介绍，AI将根据此信息生成更精准的内容" />
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
const form = reactive({ name: '', company: '', content: '' })
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }], company: [{ required: true, message: '请输入公司名', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/knowledge-bases', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }

function showDialog(item?: any) {
  editingItem.value = item || null
  form.name = item?.name || ''
  form.company = item?.company || ''
  form.content = item?.content || ''
  dialogVisible.value = true
}

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  try {
    if (editingItem.value) {
      await request.put(`/knowledge-bases/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/knowledge-bases', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

function handleDelete(row: any) {
  ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => {
    await request.delete(`/knowledge-bases/${row.id}`)
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleBatchDelete(rows: any[]) {
  ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => {
    await request.delete('/knowledge-bases/batch', { data: { ids: rows.map(r => r.id) } })
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(loadData)
</script>
