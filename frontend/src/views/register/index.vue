<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">GEO 优化排名系统</h1>
      <p class="login-subtitle">注册新账号</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="handleSubmit">
        <el-form-item prop="username" label="账号">
          <el-input v-model="form.username" placeholder="4-20 位字母数字" size="large" maxlength="20" />
        </el-form-item>
        <el-form-item prop="nickname" label="昵称">
          <el-input v-model="form.nickname" placeholder="展示昵称" size="large" maxlength="30" />
        </el-form-item>
        <el-form-item prop="password" label="密码">
          <el-input v-model="form.password" type="password" placeholder="6-30 位" size="large" show-password />
        </el-form-item>
        <el-form-item prop="confirm" label="确认密码">
          <el-input v-model="form.confirm" type="password" placeholder="再次输入密码" size="large" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleSubmit">
            注册并登录
          </el-button>
        </el-form-item>
        <div class="agreement">
          <router-link to="/login" class="link">已有账号？去登录</router-link>
        </div>
      </el-form>
    </div>

    <div class="login-footer">
      <strong>Copyright &copy; 2026 <a href="/">GEO 优化排名系统</a>.</strong>
      All rights reserved.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, type FormInstance } from 'element-plus'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({ username: '', nickname: '', password: '', confirm: '' })

const rules = {
  username: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_-]{4,20}$/, message: '4-20 位字母/数字/下划线', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码 6-30 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, cb: any) => {
        if (value !== form.password) return cb(new Error('两次输入的密码不一致'))
        cb()
      },
      trigger: 'blur',
    },
  ],
}

async function handleSubmit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  loading.value = true
  try {
    await request.post('/auth/register', { username: form.username, password: form.password, nickname: form.nickname })
    await userStore.login(form.username, form.password)
    ElMessage.success('注册成功')
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.message || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B73E8 100%); }
.login-card { width: 440px; background: #fff; border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,.15); }
.login-title { text-align: center; font-size: 26px; font-weight: 700; background: linear-gradient(135deg,#667eea,#764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 4px; }
.login-subtitle { text-align: center; font-size: 14px; color: #909399; margin-bottom: 24px; }
.login-btn { width: 100%; height: 48px; font-size: 16px; background: linear-gradient(135deg,#667eea,#764ba2); border: none; border-radius: 8px; }
.agreement { text-align: center; font-size: 13px; color: #909399; }
.agreement .link { color: #667eea; text-decoration: none; }
.login-footer { position: absolute; bottom: 24px; font-size: 13px; color: rgba(255,255,255,.7); a { color: rgba(255,255,255,.9); text-decoration: none; } }
</style>
