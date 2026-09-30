<script setup lang="ts">
import { computed, ref } from 'vue'
import { Edit } from '@element-plus/icons-vue'
import {
  TaskFormFields,
  createEmptyTaskFormModel,
  createTaskFormSchema,
  taskToFormModel,
  useTaskStore,
  type Task,
  type TaskFormModel,
} from '@/entities/task'
import { notify, useIsMobile } from '@/shared/lib'

const props = defineProps<{ task: Task }>()

const store = useTaskStore()
const isMobile = useIsMobile()

const visible = ref(false)
const submitting = ref(false)
const model = ref<TaskFormModel>(createEmptyTaskFormModel())
const formRef = ref<InstanceType<typeof TaskFormFields>>()

// При прямом заходе на /tasks/:id список ещё не загружен — без него дубликаты не проверить
const listLoading = computed(() => store.listStatus === 'loading')

// Текущую задачу из проверки на дубликат исключаем
const schema = computed(() =>
  createTaskFormSchema({
    withStatus: true,
    isTitleTaken: (title) => store.hasTitle(title, props.task.id),
  }),
)

function open(): void {
  model.value = taskToFormModel(props.task)
  visible.value = true
  void store.ensureTasksLoaded()
}

function close(): void {
  if (!submitting.value) visible.value = false
}

function onClosed(): void {
  formRef.value?.clearValidate()
}

async function submit(): Promise<void> {
  if (submitting.value) return
  submitting.value = true
  try {
    await store.ensureTasksLoaded()
    const values = await formRef.value?.validate()
    if (!values) return
    await store.updateTask(props.task.id, values)
    notify.success('Изменения сохранены')
    visible.value = false
  } catch (error) {
    notify.error(error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <el-button type="primary" :icon="Edit" @click="open">Редактировать</el-button>

  <el-dialog
    v-model="visible"
    title="Редактирование задачи"
    width="560px"
    :fullscreen="isMobile"
    :close-on-click-modal="false"
    :before-close="close"
    append-to-body
    @closed="onClosed"
  >
    <div v-loading="listLoading" element-loading-text="Загружаем список задач…">
      <TaskFormFields
        ref="formRef"
        v-model="model"
        :schema="schema"
        :assignee-options="store.assignees"
        :disabled="submitting"
        with-status
        @submit="submit"
      />
    </div>

    <template #footer>
      <el-button :disabled="submitting" @click="close">Отмена</el-button>
      <el-button type="primary" :loading="submitting" :disabled="listLoading" @click="submit">
        Сохранить
      </el-button>
    </template>
  </el-dialog>
</template>
