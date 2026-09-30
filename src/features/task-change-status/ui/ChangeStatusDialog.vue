<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { Right } from '@element-plus/icons-vue'
import { TaskStatusTag, commentSchema, useTaskStore } from '@/entities/task'
import { notify, useIsMobile, yupToElRules } from '@/shared/lib'
import type { StatusChangeRequest } from '../model/types'

const props = defineProps<{
  /** Открытый запрос на смену статуса; `null` — диалог закрыт */
  request: StatusChangeRequest | null
}>()

const emit = defineEmits<{ close: [] }>()

const store = useTaskStore()
const isMobile = useIsMobile()

const form = reactive({ text: '' })
const formRef = ref<FormInstance>()
const submitting = ref(false)
const rules = yupToElRules(
  () => commentSchema,
  () => form,
)

const visible = computed({
  get: () => props.request !== null,
  set: (value) => {
    if (!value) close()
  },
})

watch(
  () => props.request,
  (request) => {
    if (request) form.text = ''
  },
)

function close(): void {
  if (!submitting.value) emit('close')
}

async function submit(): Promise<void> {
  const request = props.request
  if (!request || submitting.value) return

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const { text } = await commentSchema.validate(form)
    await store.changeStatus(request.task.id, request.to, text)
    notify.success('Статус изменён, комментарий добавлен')
    submitting.value = false
    close()
  } catch (error) {
    notify.error(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-dialog
    v-model="visible"
    title="Смена статуса"
    width="520px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    append-to-body
    @closed="formRef?.clearValidate()"
  >
    <template v-if="request">
      <p class="change-status__task">«{{ request.task.title }}»</p>
      <div class="change-status__transition" aria-label="Переход статуса">
        <TaskStatusTag :status="request.task.status" />
        <el-icon aria-hidden="true"><Right /></el-icon>
        <TaskStatusTag :status="request.to" />
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        :disabled="submitting"
        label-position="top"
        @submit.prevent="submit"
      >
        <el-form-item label="Комментарий к смене статуса" prop="text">
          <el-input
            v-model="form.text"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            placeholder="Например: «Код-ревью пройдено»"
          />
        </el-form-item>
      </el-form>
    </template>

    <template #footer>
      <el-button :disabled="submitting" @click="close">Отмена</el-button>
      <el-button type="primary" :loading="submitting" @click="submit"> Сменить статус </el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.change-status__task {
  margin: 0 0 8px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.change-status__transition {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  color: var(--el-text-color-secondary);
}
</style>
