<template>
  <div class="page-container">
    <CrudTable
      :data="tableData"
      :loading="loading"
      :total="total"
      @add="showDialog()"
      @edit="showDialog($event)"
      @delete="handleDelete($event)"
      @batch-delete="handleBatchDelete"
      @refresh="loadData"
      @search="handleSearch"
    >
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="name" label="分类名称" min-width="200" />
      <el-table-column prop="article_count" label="文章数量" width="120" align="center" />
      <el-table-column prop="sort" label="排序" width="100" align="center" />
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑分类' : '添加分类'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入文章分类名称" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
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
const dialogVisible = ref(false)
const editingItem = ref<any>(null)
const formRef = ref<FormInstance>()
const form = reactive({ name: '', sort: 0 })
const rules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/articles/categories', { params: { pageSize: 100 } })
    tableData.value = data.list
    total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) {
  if (t) {
    tableData.value = tableData.value.filter((i: any) => i.name.includes(t))
    total.value = tableData.value.length
  } else loadData()
}

function showDialog(item?: any) { editingItem.value = item || null; form.name = item?.name || ''; form.sort = item?.sort || 0; dialogVisible.value = true }

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  try {
    if (editingItem.value) {
      await request.put(`/articles/categories/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/articles/categories', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

function handleDelete(row: any) { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/articles/categories/${row.id}`); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
function handleBatchDelete(rows: any[]) { ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => { await request.delete('/articles/categories/batch', { data: { ids: rows.map(r => r.id) } }); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
onMounted(loadData)
</script>
