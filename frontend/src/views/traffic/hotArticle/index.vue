<template>
  <div class="page-container">
    <CrudTable :data="tableData" :loading="loading" :total="total" :page="page" :page-size="pageSize"
      @add="showDialog()" @edit="showDialog($event)" @delete="handleDelete($event)" @batch-delete="handleBatchDelete"
      @refresh="loadData" @search="handleSearch" @page-change="page = $event; loadData()" @size-change="pageSize = $event; loadData()">
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="category" label="文章分类" width="140" />
      <el-table-column prop="url" label="链接" min-width="250" show-overflow-tooltip>
        <template #default="{ row }"><a :href="row.url" target="_blank" style="color: #409eff">{{ row.url }}</a></template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="rewrite_at" label="改写时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑' : '添加爆文复刻'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="文章分类" prop="category"><el-input v-model="form.category" placeholder="分类" /></el-form-item>
        <el-form-item label="原文链接" prop="url"><el-input v-model="form.url" placeholder="请输入原文URL" /></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="标题（可自动获取）" /></el-form-item>
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
const form = reactive({ category: '', url: '', title: '' })
const rules = { url: [{ required: true, message: '请输入链接', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/traffic/hot-articles', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list; total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }
function showDialog(item?: any) { editingItem.value = item || null; form.category = item?.category || ''; form.url = item?.url || ''; form.title = item?.title || ''; dialogVisible.value = true }

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false); if (!v) return
  try {
    if (editingItem.value) { await request.put(`/traffic/hot-articles/${editingItem.value.id}`, form); ElMessage.success('修改成功') }
    else { await request.post('/traffic/hot-articles', form); ElMessage.success('添加成功') }
    dialogVisible.value = false; loadData()
  } catch {}
}

function handleDelete(row: any) { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/traffic/hot-articles/${row.id}`); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
function handleBatchDelete(rows: any[]) { ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => { await request.delete('/traffic/hot-articles/batch', { data: { ids: rows.map(r => r.id) } }); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
onMounted(loadData)
</script>
