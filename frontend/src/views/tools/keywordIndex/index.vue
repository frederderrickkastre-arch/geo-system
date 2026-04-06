<template>
  <div class="page-container">
    <div class="page-card" style="max-width: 600px; margin: 40px auto; text-align: center">
      <h2 style="margin-bottom: 24px; color: #303133">关键词指数查询</h2>
      <el-input v-model="keyword" placeholder="请输入关键词" size="large" style="margin-bottom: 16px" @keyup.enter="handleQuery" />
      <el-button type="primary" size="large" :loading="loading" @click="handleQuery" style="width: 100%">
        查询（10点数）
      </el-button>
      <div v-if="result" style="margin-top: 24px; text-align: left">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="关键词">{{ result.keyword }}</el-descriptions-item>
          <el-descriptions-item label="百度指数">{{ result.baiduIndex }}</el-descriptions-item>
          <el-descriptions-item label="360指数">{{ result.soIndex }}</el-descriptions-item>
          <el-descriptions-item label="搜狗指数">{{ result.sogouIndex }}</el-descriptions-item>
          <el-descriptions-item label="竞争度">
            <el-tag :type="result.competition === '高' ? 'danger' : result.competition === '中' ? 'warning' : 'success'">{{ result.competition }}</el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <p v-else style="margin-top: 24px; color: #909399">输入关键词开始查询</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const keyword = ref('')
const loading = ref(false)
const result = ref<any>(null)

async function handleQuery() {
  if (!keyword.value) { ElMessage.warning('请输入关键词'); return }
  loading.value = true
  try {
    result.value = await request.post('/tools/keyword-index', { keyword: keyword.value })
  } finally {
    loading.value = false
  }
}
</script>
