<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import { commentSchema } from '@/entities/task'
import { yupToElRules } from '@/shared/lib'

const props = withDefaults(
  defineProps<{
    initialText?: string
    submitLabel: string
    placeholder?: string
    loading?: boolean
    cancellable?: boolean
  }>(),
  { initialText: '', placeholder: 'Текст комментария', loading: false, cancellable: false },
)

const emit = defineEmits<{ submit: [text: string]; cancel: [] }>()

const form = reactive({ text: props.initialText })
const formRef = ref<FormInstance>()
const rules = yupToElRules(
  () => commentSchema,
  () => form,
  ['blur'],
)

async function submit(): Promise<void> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  const { text } = await commentSchema.validate(form)
  emit('submit', text)
}

function reset(): void {
  form.text = ''
  formRef.value?.clearValidate()
}

defineExpose({ reset })
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    :disabled="loading"
    class="comment-form"
    @submit.prevent="submit"
  >
    <el-form-item prop="text" class="comment-form__field">
      <el-input
        v-model="form.text"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 8 }"
        :placeholder="placeholder"
        :aria-label="placeholder"
        @keydown.ctrl.enter="submit"
        @keydown.meta.enter="submit"
      />
    </el-form-item>
    <div class="comment-form__actions">
      <el-button v-if="cancellable" :disabled="loading" @click="emit('cancel')">Отмена</el-button>
      <el-button type="primary" :loading="loading" @click="submit">{{ submitLabel }}</el-button>
    </div>
  </el-form>
</template>

<style scoped>
.comment-form__field {
  margin-bottom: 20px;
}

.comment-form__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
