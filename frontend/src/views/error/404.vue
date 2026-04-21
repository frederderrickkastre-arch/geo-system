<template>
  <div class="err-page">
    <div class="err-code">404</div>
    <div class="err-msg">抱歉，您访问的页面不存在</div>
    <el-button type="primary" size="large" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<style scoped lang="scss">
.err-page {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.err-code {
  font-size: 96px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}
.err-msg {
  font-size: 16px;
  color: #909399;
  margin-bottom: 8px;
}
</style>
