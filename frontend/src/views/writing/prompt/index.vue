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
      <el-table-column prop="name" label="指令名称" min-width="250" />
      <el-table-column prop="type" label="创作类型" width="150" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type]" size="small">{{ typeNameMap[row.type] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑指令' : '添加指令'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="指令名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入指令名称" />
        </el-form-item>
        <el-form-item label="创作类型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="文章创作" value="article" />
            <el-option label="标题创作" value="title" />
            <el-option label="流量复刻指令" value="traffic" />
          </el-select>
        </el-form-item>
        <el-form-item label="提示词内容" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="8" placeholder="请输入AI写作提示词内容" />
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

const typeNameMap: Record<string, string> = { article: '文章创作', title: '标题创作', traffic: '流量复刻指令' }
const typeTagMap: Record<string, any> = { article: 'primary', title: 'success', traffic: 'warning' }

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const dialogVisible = ref(false)
const editingItem = ref<any>(null)
const formRef = ref<FormInstance>()
const form = reactive({ name: '', type: 'article', content: '' })
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }], type: [{ required: true, message: '请选择类型', trigger: 'change' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/articles/prompts', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list
    total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }
function showDialog(item?: any) { editingItem.value = item || null; form.name = item?.name || ''; form.type = item?.type || 'article'; form.content = item?.content || ''; dialogVisible.value = true }

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  try {
    if (editingItem.value) {
      await request.put(`/articles/prompts/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/articles/prompts', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

function handleDelete(row: any) { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/articles/prompts/${row.id}`); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
function handleBatchDelete(rows: any[]) { ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => { await request.delete('/articles/prompts/batch', { data: { ids: rows.map(r => r.id) } }); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
onMounted(loadData)
</script>
