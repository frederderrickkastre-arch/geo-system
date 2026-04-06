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
      <el-table-column prop="title" label="文章标题" min-width="300" show-overflow-tooltip />
      <el-table-column prop="category" label="分类" width="120" />
      <el-table-column prop="word_count" label="字数" width="100" align="center" />
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : row.status === 'draft' ? 'info' : 'warning'" size="small">
            {{ row.status === 'published' ? '已发布' : row.status === 'draft' ? '草稿' : '待发布' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
      <template #actions="{ row }">
        <el-button type="primary" link size="small" @click="previewArticle(row)">预览</el-button>
        <el-button type="primary" link size="small" @click="showDialog(row)"><el-icon><Edit /></el-icon></el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)"><el-icon><Delete /></el-icon></el-button>
      </template>
    </CrudTable>

    <el-dialog v-model="previewVisible" title="文章预览" width="800px">
      <h2 style="margin-bottom: 16px">{{ previewItem?.title }}</h2>
      <p style="color: #909399; font-size: 13px">{{ previewItem?.created_at }} | {{ previewItem?.word_count }}字</p>
      <el-divider />
      <div style="line-height: 1.8; color: #606266">{{ previewItem?.content || '暂无内容' }}</div>
    </el-dialog>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑文章' : '添加文章'" width="800px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="请输入标题" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="分类" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="form.content" type="textarea" :rows="10" placeholder="文章内容" /></el-form-item>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const dialogVisible = ref(false)
const previewVisible = ref(false)
const editingItem = ref<any>(null)
const previewItem = ref<any>(null)
const form = reactive({ title: '', category: '', content: '' })

function previewArticle(row: any) { previewItem.value = row; previewVisible.value = true }

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/articles', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list
    total.value = data.total
  } finally { loading.value = false }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }
function showDialog(item?: any) { editingItem.value = item || null; form.title = item?.title || ''; form.category = item?.category || ''; form.content = item?.content || ''; dialogVisible.value = true }

async function handleSave() {
  try {
    if (editingItem.value) {
      await request.put(`/articles/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/articles', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

function handleDelete(row: any) { ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => { await request.delete(`/articles/${row.id}`); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
function handleBatchDelete(rows: any[]) { ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => { await request.delete('/articles/batch', { data: { ids: rows.map(r => r.id) } }); loadData(); ElMessage.success('删除成功') }).catch(() => {}) }
onMounted(loadData)
</script>
