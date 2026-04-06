<template>
  <div class="page-container">
    <div class="page-card">
      <h3 style="margin-bottom: 20px">AI拓词</h3>
      <el-form :inline="true">
        <el-form-item label="种子关键词">
          <el-input v-model="seedKeyword" placeholder="请输入种子关键词" style="width: 300px" />
        </el-form-item>
        <el-form-item label="拓展数量">
          <el-input-number v-model="expandCount" :min="5" :max="100" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleExpand">AI拓展</el-button>
        </el-form-item>
      </el-form>

      <el-divider v-if="expandedWords.length" />

      <div v-if="expandedWords.length">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
          <span>共拓展 <strong>{{ expandedWords.length }}</strong> 个关键词</span>
          <el-button size="small" @click="handleCopyAll">一键复制</el-button>
        </div>
        <el-tag v-for="word in expandedWords" :key="word" style="margin: 4px" size="large">{{ word }}</el-tag>
      </div>
      <el-empty v-else description="输入关键词开始AI拓展" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const seedKeyword = ref('')
const expandCount = ref(20)
const loading = ref(false)
const expandedWords = ref<string[]>([])

async function handleExpand() {
  if (!seedKeyword.value) { ElMessage.warning('请输入种子关键词'); return }
  loading.value = true
  try {
    const data = await request.post('/tools/ai-expand', { seedKeyword: seedKeyword.value, expandCount: expandCount.value })
    expandedWords.value = data.words
  } finally {
    loading.value = false
  }
}

function handleCopyAll() {
  navigator.clipboard.writeText(expandedWords.value.join('\n'))
  ElMessage.success('已复制到剪贴板')
}
</script>
