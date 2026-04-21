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
      @delete="handleDelete"
      @batch-delete="handleBatchDelete"
      @refresh="loadData"
      @search="handleSearch"
      @page-change="page = $event; loadData()"
      @size-change="pageSize = $event; loadData()"
    >
      <el-table-column prop="id" label="序号" width="80" sortable align="center" />
      <el-table-column prop="name" label="任务名称" min-width="200" />
      <el-table-column prop="target" label="目标站点" min-width="220" show-overflow-tooltip />
      <el-table-column prop="article_count" label="文章数" width="100" align="center" />
      <el-table-column prop="published_count" label="已发布" width="140" align="center">
        <template #default="{ row }">
          <el-progress
            :percentage="row.article_count > 0 ? Math.round((row.published_count / row.article_count) * 100) : 0"
            :stroke-width="6"
            :text-inside="false"
          />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
      <template #actions="{ row }">
        <el-button v-if="row.status === 'pending'" type="success" link size="small" @click="handleStart(row)">启动</el-button>
        <el-button type="primary" link size="small" @click="showDialog(row)">编辑</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑 SEO 任务' : '创建 SEO 发布任务'" width="560px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：品牌词 4 月冲榜" />
        </el-form-item>
        <el-form-item label="目标站点" prop="targetId">
          <el-select v-model="form.targetId" placeholder="选择已添加的站点" style="width: 100%" @change="onSiteChange">
            <el-option v-for="s in sites" :key="s.id" :label="`${s.site_type || '站点'} — ${s.domain}`" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文章数" prop="articleCount">
          <el-input-number v-model="form.articleCount" :min="1" :max="2000" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
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
const saving = ref(false)

const sites = ref<any[]>([])
const form = reactive({ name: '', target: '', targetId: null as number | null, articleCount: 20 })
const rules = {
  name: [{ required: true, message: '请输入任务名称', trigger: 'blur' }],
  targetId: [{ required: true, message: '请选择目标站点', trigger: 'change' }],
  articleCount: [{ required: true, message: '请输入文章数', trigger: 'blur' }],
}

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/user/publish-tasks', {
      params: { page: page.value, pageSize: pageSize.value, search: searchText.value, mediaType: 'seo' },
    })
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadSites() {
  try {
    const data = await request.get('/media/seo/sites', { params: { page: 1, pageSize: 200 } })
    sites.value = data.list || []
  } catch {}
}

function handleSearch(t: string) {
  searchText.value = t
  page.value = 1
  loadData()
}

function showDialog(item?: any) {
  editingItem.value = item || null
  form.name = item?.name || ''
  form.target = item?.target || ''
  form.targetId = item?.target_id || null
  form.articleCount = item?.article_count || 20
  dialogVisible.value = true
}

function onSiteChange(id: number) {
  const s = sites.value.find((x) => x.id === id)
  if (s) form.target = s.domain
}

async function handleSave() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    if (editingItem.value) {
      await request.put(`/user/publish-tasks/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/user/publish-tasks', { ...form, mediaType: 'seo' })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

async function handleStart(row: any) {
  await request.post(`/user/publish-tasks/${row.id}/start`)
  ElMessage.success('任务已启动')
  loadData()
}

function handleDelete(row: any) {
  ElMessageBox.confirm(`确定删除「${row.name}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await request.delete(`/user/publish-tasks/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    })
    .catch(() => {})
}

function handleBatchDelete(rows: any[]) {
  ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' })
    .then(async () => {
      await request.delete('/user/publish-tasks/batch', { data: { ids: rows.map((r) => r.id) } })
      ElMessage.success('删除成功')
      loadData()
    })
    .catch(() => {})
}

function statusType(s: string) {
  return { pending: 'info', running: 'warning', completed: 'success', failed: 'danger' }[s] || 'info'
}
function statusText(s: string) {
  return { pending: '待发布', running: '发布中', completed: '已完成', failed: '失败' }[s] || s
}

onMounted(() => {
  loadSites()
  loadData()
})
</script>
