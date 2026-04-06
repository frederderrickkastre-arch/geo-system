<template>
  <div class="page-container">
    <div class="page-card">
      <h3 style="margin-bottom: 20px">手动拓词工具</h3>
      <el-form label-width="100px">
        <el-form-item label="主关键词">
          <el-input v-model="mainKeyword" placeholder="请输入主关键词" style="width: 300px" />
        </el-form-item>
        <el-form-item label="拓展词">
          <el-input v-model="expandWords" type="textarea" :rows="8" placeholder="请输入拓展词，每行一个" style="width: 500px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSave">保存</el-button>
          <el-button @click="handleClear">清空</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const mainKeyword = ref('')
const expandWords = ref('')

async function handleSave() {
  if (!mainKeyword.value) { ElMessage.warning('请输入主关键词'); return }
  try {
    const lines = expandWords.value.split('\n').filter(l => l.trim())
    await request.post('/tools/manual-expand', { mainKeyword: mainKeyword.value, lines })
    ElMessage.success('拓展词保存成功')
  } catch {}
}

function handleClear() {
  mainKeyword.value = ''
  expandWords.value = ''
}
</script>
