<template>
  <div class="page-container">
    <div class="page-card">
      <h3 style="margin-bottom: 20px">查询关键词在 AI 平台的收录情况</h3>
      <el-form :inline="true">
        <el-form-item label="关键词">
          <el-input v-model="keyword" placeholder="请输入关键词" style="width: 300px" @keyup.enter="handleQuery" />
        </el-form-item>
        <el-form-item label="查询模式">
          <el-radio-group v-model="mode">
            <el-radio-button value="single">单平台</el-radio-button>
            <el-radio-button value="all">全部平台</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="mode === 'single'" label="平台">
          <el-select v-model="platform" style="width: 180px">
            <el-option v-for="p in platforms" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <!-- 单平台结果 -->
      <div v-if="mode === 'single' && singleResult" style="margin-top: 20px">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="关键词">{{ singleResult.keyword }}</el-descriptions-item>
          <el-descriptions-item label="平台">{{ singleResult.platform }}</el-descriptions-item>
          <el-descriptions-item label="收录状态">
            <el-tag :type="singleResult.indexed ? 'success' : 'danger'">{{ singleResult.indexed ? '已收录' : '未收录' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="查询时间">{{ singleResult.queryTime }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 全平台结果 -->
      <div v-else-if="mode === 'all' && allResults.length" style="margin-top: 20px">
        <div class="summary-bar">
          <span>查询关键词：<strong>{{ allKeyword }}</strong></span>
          <span>收录平台数：<el-tag type="success">{{ indexedCount }} / {{ allResults.length }}</el-tag></span>
        </div>
        <el-table :data="allResults" stripe border style="margin-top: 12px">
          <el-table-column prop="platform" label="平台" width="140" align="center" />
          <el-table-column label="收录状态" width="140" align="center">
            <template #default="{ row }">
              <el-tag :type="row.indexed ? 'success' : 'danger'" size="small">{{ row.indexed ? '已收录' : '未收录' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="source" label="数据来源" />
        </el-table>
      </div>

      <el-empty v-else description="输入关键词开始查询" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const keyword = ref('')
const platform = ref('deepseek')
const mode = ref<'single' | 'all'>('single')
const loading = ref(false)
const platforms = ['deepseek', '豆包', '元宝', '千问', '文心', '纳米', 'kimi', '智谱']

const singleResult = ref<any>(null)
const allResults = ref<any[]>([])
const allKeyword = ref('')

const indexedCount = computed(() => allResults.value.filter((r) => r.indexed).length)

async function handleQuery() {
  if (!keyword.value.trim()) {
    ElMessage.warning('请输入关键词')
    return
  }
  loading.value = true
  try {
    if (mode.value === 'single') {
      singleResult.value = await request.post('/data/query', { keyword: keyword.value.trim(), platform: platform.value })
      allResults.value = []
    } else {
      const data = await request.post('/data/query-all', { keyword: keyword.value.trim() })
      allResults.value = data.results || []
      allKeyword.value = data.keyword
      singleResult.value = null
      ElMessage.success(`已查询 ${data.results?.length || 0} 个平台`)
    }
  } finally {
    loading.value = false
  }
}

function handleReset() {
  keyword.value = ''
  singleResult.value = null
  allResults.value = []
  allKeyword.value = ''
}
</script>

<style scoped lang="scss">
.summary-bar {
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
</style>
