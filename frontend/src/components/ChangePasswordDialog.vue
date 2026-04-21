<template>
  <el-dialog v-model="visible" title="修改密码" width="420px" @close="reset">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
      <el-form-item label="原密码" prop="oldPassword">
        <el-input v-model="form.oldPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="form.newPassword" type="password" show-password />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirm">
        <el-input v-model="form.confirm" type="password" show-password />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import request from '@/utils/request'
import { useUserStore } from '@/stores/user'

const visible = defineModel<boolean>({ default: false })
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const saving = ref(false)

const form = reactive({ oldPassword: '', newPassword: '', confirm: '' })

const rules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码 6-30 位', trigger: 'blur' },
  ],
  confirm: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (_r: any, v: string, cb: any) => {
        if (v !== form.newPassword) return cb(new Error('两次输入的密码不一致'))
        cb()
      },
      trigger: 'blur',
    },
  ],
}

function reset() {
  form.oldPassword = ''
  form.newPassword = ''
  form.confirm = ''
}

async function handleSubmit() {
  const ok = await formRef.value?.validate().catch(() => false)
  if (!ok) return
  saving.value = true
  try {
    await request.post('/user/change-password', { oldPassword: form.oldPassword, newPassword: form.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    visible.value = false
    userStore.logout()
    window.location.href = '/login'
  } finally {
    saving.value = false
  }
}
</script>
