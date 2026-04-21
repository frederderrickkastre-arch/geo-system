<template>
  <div class="page-container">
    <div class="page-card">
      <h3 style="margin-bottom: 20px">{{ editingId ? '编辑拓词组' : '手动拓词工具' }}</h3>
      <el-form label-width="100px">
        <el-form-item label="主关键词">
          <el-input v-model="mainKeyword" placeholder="请输入主关键词" style="width: 360px" />
        </el-form-item>
        <el-form-item label="拓展词">
          <el-input
            v-model="expandWords"
            type="textarea"
            :rows="8"
            placeholder="请输入拓展词，每行一个"
            style="width: 560px"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 4px">当前：{{ lineCount }} 行</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ editingId ? '更新' : '保存' }}
          </el-button>
          <el-button @click="handleClear">{{ editingId ? '取消编辑' : '清空' }}</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card" style="margin-top: 16px">
      <h4 style="margin: 0 0 12px">已保存的拓词组</h4>
      <CrudTable
        :data="tableData"
        :loading="loading"
        :total="total"
        :page="page"
        :page-size="pageSize"
        @refresh="loadData"
        @search="handleSearch"
        @edit="handleEdit"
        @delete="handleDelete"
        @page-change="page = $event; loadData()"
        @size-change="pageSize = $event; loadData()"
      >
        <el-table-column prop="main_keyword" label="主关键词" min-width="200" />
        <el-table-column prop="word_count" label="词数" width="100" align="center" />
        <el-table-column label="部分拓展词" min-width="320">
          <template #default="{ row }">
            <el-tag v-for="w in (row.words || []).slice(0, 5)" :key="w" size="small" style="margin: 2px">{{ w }}</el-tag>
            <span v-if="(row.words || []).length > 5" style="color: #909399; margin-left: 4px">+{{ row.words.length - 5 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="updated_at" label="更新时间" width="180" sortable />
      </CrudTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const mainKeyword = ref('')
const expandWords = ref('')
const saving = ref(false)
const editingId = ref<number | null>(null)

const lineCount = computed(() => expandWords.value.split('\n').filter((l) => l.trim()).length)

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')

async function handleSave() {
  if (!mainKeyword.value.trim()) {
    ElMessage.warning('请输入主关键词')
    return
  }
  const lines = expandWords.value.split('\n').map((l) => l.trim()).filter(Boolean)
  saving.value = true
  try {
    await request.post('/tools/manual-expand', { mainKeyword: mainKeyword.value.trim(), lines })
    ElMessage.success(editingId.value ? '更新成功' : '保存成功')
    handleClear()
    loadData()
  } finally {
    saving.value = false
  }
}

function handleClear() {
  mainKeyword.value = ''
  expandWords.value = ''
  editingId.value = null
}

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/tools/manual-expand', {
      params: { page: page.value, pageSize: pageSize.value, search: searchText.value },
    })
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

function handleSearch(t: string) {
  searchText.value = t
  page.value = 1
  loadData()
}

function handleEdit(row: any) {
  editingId.value = row.id
  mainKeyword.value = row.main_keyword
  expandWords.value = (row.words || []).join('\n')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleDelete(row: any) {
  ElMessageBox.confirm(`确定删除「${row.main_keyword}」？`, '提示', { type: 'warning' })
    .then(async () => {
      await request.delete(`/tools/manual-expand/${row.id}`)
      ElMessage.success('删除成功')
      if (editingId.value === row.id) handleClear()
      loadData()
    })
    .catch(() => {})
}

onMounted(loadData)
</script>
