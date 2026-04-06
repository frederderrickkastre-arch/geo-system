<template>
  <div class="page-container">
    <CrudTable :data="tableData" :loading="loading" :total="total" @add="showDialog()" @edit="showDialog($event)" @delete="handleDelete($event)" @batch-delete="handleBatchDelete" @refresh="loadData" @search="handleSearch">
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="site_type" label="网站类型" width="140" />
      <el-table-column prop="domain" label="域名" min-width="250" />
      <el-table-column prop="published_count" label="已发布数量" width="120" align="center" />
      <el-table-column prop="notes" label="备注" min-width="200" show-overflow-tooltip />
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑站点' : '添加站点'" width="600px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="网站类型" prop="siteType">
          <el-select v-model="form.siteType" style="width: 100%">
            <el-option label="WordPress" value="WordPress" />
            <el-option label="织梦CMS" value="织梦CMS" />
            <el-option label="帝国CMS" value="帝国CMS" />
            <el-option label="自定义" value="自定义" />
          </el-select>
        </el-form-item>
        <el-form-item label="域名" prop="domain"><el-input v-model="form.domain" placeholder="https://example.com" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.notes" type="textarea" :rows="3" /></el-form-item>
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

const loading = ref(false); const tableData = ref<any[]>([]); const total = ref(0); const searchText = ref('')
const dialogVisible = ref(false); const editingItem = ref<any>(null); const formRef = ref<FormInstance>()
const form = reactive({ siteType: '', domain: '', notes: '' })
const rules = { siteType: [{ required: true, message: '请选择类型', trigger: 'change' }], domain: [{ required: true, message: '请输入域名', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/media/seo/sites', { params: { search: searchText.value } })
    tableData.value = data.list; total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) { searchText.value = t; loadData() }
function showDialog(item?: any) { editingItem.value = item || null; form.siteType = item?.site_type || ''; form.domain = item?.domain || ''; form.notes = item?.notes || ''; dialogVisible.value = true }

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false); if (!v) return
  try {
    if (editingItem.value) { await request.put(`/media/seo/sites/${editingItem.value.id}`, form); ElMessage.success('修改成功') }
    else { await request.post('/media/seo/sites', form); ElMessage.success('添加成功') }
    dialogVisible.value = false; loadData()
  } catch {}
}

function handleDelete(row: any) { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/media/seo/sites/${row.id}`); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
function handleBatchDelete(rows: any[]) { ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => { await request.delete('/media/seo/sites/batch', { data: { ids: rows.map(r => r.id) } }); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
onMounted(loadData)
</script>
