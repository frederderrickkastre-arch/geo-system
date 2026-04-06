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
      <el-table-column prop="name" label="图库分类" min-width="200" />
      <el-table-column prop="image_count" label="图片数量" width="120" align="center" />
      <el-table-column label="图库" width="120" align="center">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showImages(row)">图片列表</el-button>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="180" sortable />
    </CrudTable>

    <el-dialog v-model="dialogVisible" :title="editingItem ? '编辑图库分类' : '添加图库分类'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入图库分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="imageDialogVisible" :title="currentCategory?.name + ' - 图片列表'" width="800px">
      <el-upload
        :action="uploadAction"
        :headers="uploadHeaders"
        :data="{ categoryId: currentCategory?.id }"
        list-type="picture-card"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        multiple
        name="file"
      >
        <el-icon><Plus /></el-icon>
      </el-upload>
      <p style="color: #909399; font-size: 12px; margin-top: 8px">支持 JPG、PNG、GIF、WebP 格式，单张不超过 10MB</p>
      <div v-if="imageList.length" style="margin-top: 16px">
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <div v-for="img in imageList" :key="img.id" style="position: relative">
            <el-image :src="getImageUrl(img.url)" style="width: 120px; height: 120px" fit="cover" />
            <el-button type="danger" circle size="small" style="position: absolute; top: 2px; right: 2px" @click="deleteImage(img)">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      <el-empty v-else-if="!imageLoading" description="暂无图片" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type UploadRawFile } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import request from '@/utils/request'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const dialogVisible = ref(false)
const imageDialogVisible = ref(false)
const editingItem = ref<any>(null)
const formRef = ref<FormInstance>()
const form = reactive({ name: '' })
const rules = { name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }] }

const currentCategory = ref<any>(null)
const imageList = ref<any[]>([])
const imageLoading = ref(false)

const uploadAction = computed(() => `${API_BASE}/api/upload/image`)
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
})

function getImageUrl(url: string) {
  if (url.startsWith('http')) return url
  return `${API_BASE}${url}`
}

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/galleries/categories', { params: { page: page.value, pageSize: pageSize.value, search: searchText.value } })
    tableData.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

async function loadImages(categoryId: number) {
  imageLoading.value = true
  try {
    const data = await request.get(`/galleries/categories/${categoryId}/images`, { params: { page: 1, pageSize: 100 } })
    imageList.value = data.list || data || []
  } finally {
    imageLoading.value = false
  }
}

function handleSearch(t: string) { searchText.value = t; page.value = 1; loadData() }
function showDialog(item?: any) { editingItem.value = item || null; form.name = item?.name || ''; dialogVisible.value = true }

function showImages(row: any) {
  currentCategory.value = row
  imageList.value = []
  imageDialogVisible.value = true
  loadImages(row.id)
}

function beforeUpload(file: UploadRawFile) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp']
  if (!allowed.includes(file.type)) {
    ElMessage.error('不支持的图片格式')
    return false
  }
  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 10MB')
    return false
  }
  return true
}

function handleUploadSuccess() {
  ElMessage.success('上传成功')
  if (currentCategory.value) {
    loadImages(currentCategory.value.id)
    loadData()
  }
}

function handleUploadError() {
  ElMessage.error('上传失败')
}

async function deleteImage(img: any) {
  try {
    await ElMessageBox.confirm('确定删除该图片？', '提示', { type: 'warning' })
    await request.delete(`/galleries/images/${img.id}`)
    ElMessage.success('删除成功')
    if (currentCategory.value) {
      loadImages(currentCategory.value.id)
      loadData()
    }
  } catch {}
}

async function handleSave() {
  const v = await formRef.value?.validate().catch(() => false)
  if (!v) return
  try {
    if (editingItem.value) {
      await request.put(`/galleries/categories/${editingItem.value.id}`, form)
      ElMessage.success('修改成功')
    } else {
      await request.post('/galleries/categories', form)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadData()
  } catch {}
}

function handleDelete(row: any) {
  ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' }).then(async () => {
    await request.delete(`/galleries/categories/${row.id}`)
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

function handleBatchDelete(rows: any[]) {
  ElMessageBox.confirm(`确定删除 ${rows.length} 条？`, '提示', { type: 'warning' }).then(async () => {
    await request.delete('/galleries/categories/batch', { data: { ids: rows.map(r => r.id) } })
    loadData()
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(loadData)
</script>
