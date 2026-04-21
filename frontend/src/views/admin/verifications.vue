<template>
  <div class="page-container">
    <div class="stat-row">
      <div class="stat-card" v-for="s in statCards" :key="s.label">
        <div class="stat-label">{{ s.label }}</div>
        <div class="stat-value">{{ s.value }}</div>
      </div>
    </div>

    <div class="page-card ai-test-card">
      <div class="ai-test-header">
        <div>
          <strong>AI 服务连通性</strong>
          <span class="desc">验证当前 .env 配置的 AI 服务商 / 中转站是否可用</span>
        </div>
        <el-button type="primary" :loading="aiTesting" @click="handleAiTest">立即自检</el-button>
      </div>
      <el-alert
        v-if="aiResult"
        :type="aiResult.ok ? 'success' : 'error'"
        :closable="false"
        show-icon
        style="margin-top: 12px"
      >
        <template #title>
          {{ aiResult.ok ? '✅ 连通正常' : '❌ 连通失败' }} · {{ aiResult.provider }} · {{ aiResult.model }}
        </template>
        <div class="ai-result-body">
          <div><span class="k">请求地址：</span><code>{{ aiResult.url }}</code></div>
          <div v-if="aiResult.sample"><span class="k">模型回复：</span>{{ aiResult.sample }}</div>
          <div v-if="aiResult.error" class="err"><span class="k">错误信息：</span>{{ aiResult.error }}</div>
        </div>
      </el-alert>
    </div>

    <CrudTable
      :data="tableData"
      :loading="loading"
      :total="total"
      :page="page"
      :page-size="pageSize"
      :show-actions="false"
      @refresh="loadData"
      @search="handleSearch"
      @page-change="page = $event; loadData()"
      @size-change="pageSize = $event; loadData()"
    >
      <template #toolbar-left>
        <el-button @click="loadData"><el-icon><Refresh /></el-icon></el-button>
        <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 130px" @change="onFilterChange">
          <el-option label="待审核" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
      </template>
      <el-table-column prop="id" label="序号" width="80" align="center" />
      <el-table-column prop="user_id" label="用户 ID" width="100" align="center" />
      <el-table-column prop="real_name" label="真实姓名" width="140" />
      <el-table-column label="身份证号" min-width="200">
        <template #default="{ row }">{{ maskIdCard(row.id_card) }}</template>
      </el-table-column>
      <el-table-column label="证件照片" min-width="180">
        <template #default="{ row }">
          <el-image v-if="row.id_front" :src="row.id_front" style="width: 60px; height: 42px; border-radius: 4px; margin-right: 4px" fit="cover" :preview-src-list="[row.id_front, row.id_back].filter(Boolean)" />
          <el-image v-if="row.id_back" :src="row.id_back" style="width: 60px; height: 42px; border-radius: 4px" fit="cover" :preview-src-list="[row.id_front, row.id_back].filter(Boolean)" />
          <span v-if="!row.id_front && !row.id_back" style="color: #c0c4cc">未上传</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }"><StatusTag :status="row.status" /></template>
      </el-table-column>
      <el-table-column prop="reject_reason" label="驳回原因" min-width="160" show-overflow-tooltip />
      <el-table-column prop="submitted_at" label="提交时间" width="180" sortable />
      <el-table-column label="操作" width="160" align="center" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button type="success" link size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" link size="small" @click="handleReject(row)">驳回</el-button>
          </template>
          <span v-else style="color: #c0c4cc">-</span>
        </template>
      </el-table-column>
    </CrudTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import CrudTable from '@/components/CrudTable.vue'
import StatusTag from '@/components/StatusTag.vue'
import request from '@/utils/request'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const statusFilter = ref('pending')
const searchText = ref('')

const statCards = ref<{ label: string; value: number | string }[]>([])

const aiTesting = ref(false)
const aiResult = ref<any>(null)

async function handleAiTest() {
  aiTesting.value = true
  try {
    aiResult.value = await request.post('/admin/ai/test')
  } catch (e: any) {
    aiResult.value = { ok: false, provider: '-', url: '-', model: '-', error: e?.message || '请求失败' }
  } finally {
    aiTesting.value = false
  }
}

async function loadStats() {
  try {
    const data = await request.get('/admin/stats')
    statCards.value = [
      { label: '总用户', value: data.users },
      { label: '已认证', value: data.verifiedUsers },
      { label: '待审核', value: data.pendingVerifications },
      { label: '总文章数', value: data.articles },
      { label: '投稿记录', value: data.submissions },
      { label: '发布任务', value: data.publishTasks },
    ]
  } catch {}
}

async function loadData() {
  loading.value = true
  try {
    const data = await request.get('/admin/verifications', { params: { page: page.value, pageSize: pageSize.value, status: statusFilter.value } })
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

function onFilterChange() {
  page.value = 1
  loadData()
}

async function handleApprove(row: any) {
  await ElMessageBox.confirm(`确定通过 ${row.real_name} 的实名认证？`, '提示', { type: 'success' }).catch(() => null)
  try {
    await request.post(`/admin/verifications/${row.id}/approve`)
    ElMessage.success('已通过')
    loadData()
    loadStats()
  } catch {}
}

async function handleReject(row: any) {
  const { value } = await ElMessageBox.prompt('请输入驳回原因', '驳回认证', {
    confirmButtonText: '驳回',
    cancelButtonText: '取消',
    inputValidator: (v) => !!v || '请输入驳回原因',
  }).catch(() => ({ value: '' }))
  if (!value) return
  await request.post(`/admin/verifications/${row.id}/reject`, { reason: value })
  ElMessage.success('已驳回')
  loadData()
}

function maskIdCard(c: string) {
  if (!c || c.length < 10) return '-'
  return c.slice(0, 4) + '**********' + c.slice(-4)
}

onMounted(() => {
  loadStats()
  loadData()
})
</script>

<style scoped lang="scss">
.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}
.stat-card {
  background: #fff;
  border-radius: 10px;
  padding: 14px 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,.04);
  .stat-label { font-size: 12px; color: #909399; }
  .stat-value { font-size: 22px; font-weight: 700; margin-top: 4px; color: #303133; }
}
.ai-test-card { margin-bottom: 16px; padding: 16px; }
.ai-test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .desc { margin-left: 8px; color: #909399; font-size: 12px; }
}
.ai-result-body {
  font-size: 13px;
  line-height: 1.8;
  .k { color: #606266; margin-right: 4px; }
  code { background: rgba(0,0,0,.04); padding: 2px 6px; border-radius: 4px; word-break: break-all; }
  .err { color: #f56c6c; }
}
</style>
