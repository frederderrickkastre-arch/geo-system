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
      <template #alert>
        <el-alert title="注意：文章成功发布后会在一段时间后自动删除" type="warning" :closable="false" show-icon style="margin-bottom: 12px" />
      </template>
      <el-table-column prop="name" label="任务名" min-width="150" />
      <el-table-column prop="distill_word" label="蒸馏词" width="140" />
      <el-table-column prop="max_count" label="创作上限" width="100" align="center" />
      <el-table-column prop="created_count" label="已创作" width="90" align="center" />
      <el-table-column prop="error_msg" label="错误消息" width="140" show-overflow-tooltip />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusMap[row.status]?.tag" size="small">{{ statusMap[row.status]?.label }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="last_write_at" label="最新写作" width="170" sortable />
      <el-table-column prop="created_at" label="创建时间" width="170" sortable />
      <template #actions="{ row }">
        <el-button type="success" link size="small" :disabled="row.status === 'running'" @click="runTask(row)">执行</el-button>
        <el-button type="primary" link size="small" @click="showDialog(row)">编辑</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
      </template>
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑任务' : '创建写作任务'" width="700px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="蒸馏词" prop="distillWord">
          <el-input v-model="form.distillWord" placeholder="目标关键词" />
        </el-form-item>
        <el-form-item label="创作上限" prop="maxCount">
          <el-input-number v-model="form.maxCount" :min="1" :max="1000" />
        </el-form-item>
        <el-form-item label="知识库">
          <el-select v-model="form.knowledgeBaseId" placeholder="选择知识库" clearable style="width: 100%">
            <el-option v-for="kb in knowledgeBases" :key="kb.id" :label="kb.name" :value="kb.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="写作指令">
          <el-select v-model="form.promptId" placeholder="选择写作指令" clearable style="width: 100%">
            <el-option v-for="p in prompts" :key="p.id" :label="p.name" :value="p.id" />
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

const statusMap: Record<string, { label: string; tag: any }> = {
  pending: { label: '待执行', tag: 'info' },
  running: { label: '执行中', tag: 'warning' },
  completed: { label: '已完成', tag: 'success' },
  failed: { label: '失败', tag: 'danger' },
}

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const dialogVisible = ref(false)
const editingItem = ref<any>(null)
const formRef = ref<FormInstance>()
const knowledgeBases = ref<any[]>([])
const prompts = ref<any[]>([])

const form = reactive({ name: '', distillWord: '', maxCount: 10, knowledgeBaseId: null as number | null, promptId: null as number | null })
const rules = { name: [{ required: true, message: '请输入任务名', trigger: 'blur' }], distillWord: [{ required: true, message: '请输入蒸馏词', trigger: 'blur' }] }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/articles/tasks', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list
    total.value = data.total
  } finally { loading.value = false }
}

async function loadOptions() {
  try {
    const [kbs, pts] = await Promise.all([
      request.get('/knowledge-bases/all'),
      request.get('/articles/prompts/all'),
    ])
    knowledgeBases.value = kbs
    prompts.value = pts
  } catch {}
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }

function showDialog(item?: any) {
  editingItem.value = item || null
  form.name = item?.name || ''
  form.distillWord = item?.distill_word || ''
  form.maxCount = item?.max_count || 10
  form.knowledgeBaseId = item?.knowledge_base_id || null
  form.promptId = item?.prompt_id || null
  dialogVisible.value = true
}

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  try {
    if (editingItem.value) {
      await request.put(`/articles/tasks/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/articles/tasks', form)
      ElMessage.success('任务创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

async function runTask(row: any) {
  try {
    await request.post(`/articles/tasks/${row.id}/run`)
    ElMessage.success('任务已启动，AI正在创作文章...')
    setTimeout(loadData, 3000)
  } catch {}
}

function handleDelete(row: any) { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/articles/tasks/${row.id}`); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
function handleBatchDelete(rows: any[]) { ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => { await request.delete('/articles/tasks/batch', { data: { ids: rows.map(r => r.id) } }); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }

onMounted(() => { loadData(); loadOptions() })
</script>
