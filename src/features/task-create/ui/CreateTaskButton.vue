<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import {
  TaskFormFields,
  createEmptyTaskFormModel,
  createTaskFormSchema,
  useTaskStore,
  type TaskFormModel,
  type TaskFull,
} from '@/entities/task'
import { notify, useIsMobile } from '@/shared/lib'

const emit = defineEmits<{ created: [task: TaskFull] }>()

const store = useTaskStore()
const isMobile = useIsMobile()

const visible = ref(false)
const submitting = ref(false)
const model = ref<TaskFormModel>(createEmptyTaskFormModel())
const formRef = ref<InstanceType<typeof TaskFormFields>>()

// Дубликат проверяется по списку задач из Pinia store
const schema = createTaskFormSchema({ isTitleTaken: (title) => store.hasTitle(title) })

function open(): void {
  model.value = createEmptyTaskFormModel()
  visible.value = true
  // Для проверки дубликатов нужен загруженный список
  void store.ensureTasksLoaded()
}

function close(): void {
  if (!submitting.value) visible.value = false
}

function onClosed(): void {
  formRef.value?.clearValidate()
  model.value = createEmptyTaskFormModel()
}

async function submit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    await store.ensureTasksLoaded()
    const values = await formRef.value?.validate()
    if (!values) return
    const task = await store.createTask(values)
    notify.success('Задача создана')
    visible.value = false
    emit('created', task)
  } catch (error) {
    notify.error(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-button type="primary" :icon="Plus" @click="open">Создать задачу</el-button>

  <el-dialog
    v-model="visible"
    title="Новая задача"
    width="560px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    :before-close="close"
    append-to-body
    @closed="onClosed"
  >
    <TaskFormFields
      ref="formRef"
      v-model="model"
      :schema="schema"
      :assignee-options="store.assignees"
      :disabled="submitting"
      @submit="submit"
    />

    <template #footer>
      <el-button :disabled="submitting" @click="close">Отмена</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">Создать</el-button>
    </template>
  </el-dialog>
</template>
