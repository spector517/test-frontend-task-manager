<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FormInstance } from 'element-plus'
import type { ObjectSchema } from 'yup'
import { yupToElRules } from '@/shared/lib'
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../config/labels'
import type { TaskFormModel, TaskFormValues } from '../model/types'

const model = defineModel<TaskFormModel>({ required: true })

const props = withDefaults(
  defineProps<{
    schema: ObjectSchema<TaskFormValues>
    withStatus?: boolean
    /** Подсказки для поля «Исполнитель» — уже известные email */
    assigneeOptions?: readonly string[]
    disabled?: boolean
  }>(),
  { withStatus: false, assigneeOptions: () => [], disabled: false },
)

const emit = defineEmits<{ submit: [] }>()

const formRef = ref<FormInstance>()

const rules = computed(() =>
  yupToElRules(
    () => props.schema,
    () => model.value,
  ),
)

interface AssigneeSuggestion {
  value: string
}

function suggestAssignees(query: string, callback: (items: AssigneeSuggestion[]) => void): void {
  const normalized = query.trim().toLowerCase()
  callback(
    props.assigneeOptions
      .filter((email) => email.toLowerCase().includes(normalized))
      .map((value) => ({ value })),
  )
}

/**
 * Показывает ошибки под полями и возвращает приведённые схемой значения
 * (с обрезанными пробелами) либо `null`, если форма невалидна.
 */
async function validate(): Promise<TaskFormValues | null> {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return null
  return props.schema.validate(model.value, { abortEarly: false, stripUnknown: true })
}

function clearValidate(): void {
  formRef.value?.clearValidate()
}

defineExpose({ validate, clearValidate })
</script>

<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="rules"
    :disabled="disabled"
    label-position="top"
    class="task-form"
    @submit.prevent="emit('submit')"
  >
    <el-form-item label="Название" prop="title">
      <el-input v-model="model.title" placeholder="Например, «Настроить CI/CD»" />
    </el-form-item>

    <el-form-item label="Описание" prop="description">
      <el-input
        v-model="model.description"
        type="textarea"
        :autosize="{ minRows: 3, maxRows: 8 }"
        placeholder="Необязательно"
      />
    </el-form-item>

    <el-form-item v-if="withStatus" label="Статус" prop="status">
      <el-select v-model="model.status" placeholder="Выберите статус">
        <el-option
          v-for="option in STATUS_OPTIONS"
          :key="option.value"
          :value="option.value"
          :label="option.label"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="Приоритет" prop="priority">
      <el-radio-group v-model="model.priority">
        <el-radio-button
          v-for="option in PRIORITY_OPTIONS"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </el-radio-button>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="Исполнитель (email)" prop="assignee">
      <el-autocomplete
        v-model="model.assignee"
        :fetch-suggestions="suggestAssignees"
        placeholder="Выберите из списка или введите email"
        clearable
        class="task-form__assignee"
      />
    </el-form-item>

    <!-- Позволяет отправлять форму по Enter -->
    <button type="submit" hidden aria-hidden="true" tabindex="-1" />
  </el-form>
</template>

<style scoped>
.task-form__assignee,
.task-form :deep(.el-select) {
  width: 100%;
}
</style>
