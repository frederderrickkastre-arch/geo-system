<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">GEO优化排名系统</h1>
      <p class="login-subtitle">登录</p>

      <el-form ref="formRef" :model="form" :rules="rules" @keyup.enter="handleLogin">
        <el-form-item prop="username" label="账号">
          <el-input v-model="form.username" placeholder="请输入您的账号" size="large" />
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入您的密码" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">
            登录
          </el-button>
        </el-form-item>
        <div class="agreement">
          <el-checkbox v-model="form.agree" />
          <span>
            登录视为您已阅读并同意
            <a href="#" class="link" @click.prevent>《用户使用协议》</a>
          </span>
        </div>
      </el-form>
    </div>

    <div class="login-footer">
      <strong>Copyright &copy; 2026 <a href="/">GEO优化排名系统</a>.</strong>
      All rights reserved.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  remember: false,
  agree: true,
})

const rules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!form.agree) {
    ElMessage.warning('请先阅读并同意用户使用协议')
    return
  }
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    await userStore.login(form.username, form.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B73E8 100%);
  position: relative;
}

.login-card {
  width: 420px;
  background: #fff;
  border-radius: 16px;
  padding: 48px 40px 32px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 4px;
}

.login-subtitle {
  text-align: center;
  font-size: 14px;
  color: #909399;
  margin-bottom: 32px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;

  &:hover {
    opacity: 0.9;
  }
}

.agreement {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #909399;

  .link {
    color: #667eea;
    text-decoration: none;
  }
}

.login-footer {
  position: absolute;
  bottom: 24px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);

  a {
    color: rgba(255, 255, 255, 0.9);
    text-decoration: none;
  }
}
</style>
