import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getErrorMessage } from '@/shared/lib'
import { taskRepository } from '../api/task-repository'
import type {
  LoadStatus,
  PendingOperation,
  Task,
  TaskComment,
  TaskFormValues,
  TaskFull,
  TaskStatus,
} from './types'

function toPreview({ comments: _comments, ...task }: TaskFull): Task {
  return task
}

/**
 * Хранит превью задач (канбан) и полную карточку открытой задачи.
 *
 * Загрузки (`fetch*`) пишут статус и текст ошибки в состояние — UI показывает их как
 * loading/error. Мутации пробрасывают ошибку вызывающему коду (для toast), а при успехе
 * синхронизируют оба представления: `tasks` и `current`.
 */
export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const listStatus = ref<LoadStatus>('idle')
  const listError = ref<string | null>(null)

  const current = ref<TaskFull | null>(null)
  const currentStatus = ref<LoadStatus>('idle')
  const currentError = ref<string | null>(null)

  /** Задачи, над которыми сейчас выполняется операция: id → вид операции */
  const pending = ref(new Map<string, PendingOperation>())

  let listRequest: Promise<void> | null = null
  let currentRequestId = 0

  const assignees = computed(() =>
    [...new Set(tasks.value.map((task) => task.assignee))].sort((a, b) => a.localeCompare(b)),
  )

  function hasTitle(title: string, exceptId?: string): boolean {
    const normalized = title.trim()
    return tasks.value.some((task) => task.title === normalized && task.id !== exceptId)
  }

  /** Без `operation` — выполняется ли над задачей хоть какая-то операция */
  function isPending(id: string, operation?: PendingOperation): boolean {
    const current = pending.value.get(id)
    return operation ? current === operation : current !== undefined
  }

  async function withPending<T>(
    id: string,
    operation: PendingOperation,
    action: () => Promise<T>,
  ): Promise<T> {
    pending.value.set(id, operation)
    try {
      return await action()
    } finally {
      pending.value.delete(id)
    }
  }

  /** Обновить превью в списке и открытую карточку по свежим данным с сервера */
  function applyTask(task: TaskFull): void {
    const index = tasks.value.findIndex((t) => t.id === task.id)
    if (index !== -1) tasks.value[index] = toPreview(task)
    if (current.value?.id === task.id) current.value = task
  }

  function updateCurrentComments(
    taskId: string,
    update: (comments: TaskComment[]) => TaskComment[],
  ): void {
    if (current.value?.id === taskId) {
      current.value = { ...current.value, comments: update(current.value.comments) }
    }
  }

  function fetchTasks(): Promise<void> {
    listStatus.value = 'loading'
    listError.value = null

    const request = taskRepository
      .getAll()
      .then((result) => {
        tasks.value = result
        listStatus.value = 'success'
      })
      .catch((error: unknown) => {
        listError.value = getErrorMessage(error)
        listStatus.value = 'error'
      })
      .finally(() => {
        if (listRequest === request) listRequest = null
      })

    listRequest = request
    return request
  }

  /** Загрузить список, если он ещё не загружен (нужен, например, для проверки дубликатов) */
  function ensureTasksLoaded(): Promise<void> {
    if (listStatus.value === 'success') return Promise.resolve()
    return listRequest ?? fetchTasks()
  }

  /**
   * Загружает полную карточку. Возвращает `null`, если задача не найдена;
   * при ошибке сети пишет её в `currentError` и пробрасывает дальше.
   * Если уже открыта та же задача, она остаётся на экране, пока идёт обновление.
   */
  async function fetchTaskById(id: string): Promise<TaskFull | null> {
    const requestId = ++currentRequestId
    if (current.value?.id !== id) current.value = null
    currentStatus.value = 'loading'
    currentError.value = null

    try {
      const task = await taskRepository.getById(id)
      if (requestId === currentRequestId) {
        current.value = task
        currentStatus.value = 'success'
      }
      return task
    } catch (error) {
      if (requestId === currentRequestId) {
        currentError.value = getErrorMessage(error)
        currentStatus.value = 'error'
      }
      throw error
    }
  }

  async function createTask(values: TaskFormValues): Promise<TaskFull> {
    const task = await taskRepository.create(values)
    tasks.value = [...tasks.value, toPreview(task)]
    current.value = task
    return task
  }

  function updateTask(id: string, values: TaskFormValues): Promise<TaskFull> {
    return withPending(id, 'update', async () => {
      const task = await taskRepository.update(id, values)
      applyTask(task)
      return task
    })
  }

  function deleteTask(id: string): Promise<void> {
    return withPending(id, 'delete', async () => {
      await taskRepository.remove(id)
      tasks.value = tasks.value.filter((task) => task.id !== id)
      if (current.value?.id === id) current.value = null
    })
  }

  function cloneTask(id: string): Promise<TaskFull> {
    return withPending(id, 'clone', async () => {
      const copy = await taskRepository.clone(id)
      const index = tasks.value.findIndex((task) => task.id === id)
      const next = [...tasks.value]
      next.splice(index === -1 ? next.length : index + 1, 0, toPreview(copy))
      tasks.value = next
      return copy
    })
  }

  /** Смена статуса с обязательным комментарием; комментарий добавляется в начало списка */
  function changeStatus(id: string, status: TaskStatus, comment: string): Promise<TaskFull> {
    return withPending(id, 'status', async () => {
      const task = await taskRepository.changeStatus(id, status, comment)
      applyTask(task)
      return task
    })
  }

  async function addComment(taskId: string, text: string): Promise<TaskComment> {
    const comment = await taskRepository.addComment(taskId, text)
    updateCurrentComments(taskId, (comments) => [...comments, comment])
    return comment
  }

  async function updateComment(
    taskId: string,
    commentId: string,
    text: string,
  ): Promise<TaskComment> {
    const comment = await taskRepository.updateComment(taskId, commentId, text)
    updateCurrentComments(taskId, (comments) =>
      comments.map((c) => (c.id === commentId ? comment : c)),
    )
    return comment
  }

  async function removeComment(taskId: string, commentId: string): Promise<void> {
    await taskRepository.removeComment(taskId, commentId)
    updateCurrentComments(taskId, (comments) => comments.filter((c) => c.id !== commentId))
  }

  return {
    tasks,
    listStatus,
    listError,
    current,
    currentStatus,
    currentError,
    pending,
    assignees,
    hasTitle,
    isPending,
    fetchTasks,
    ensureTasksLoaded,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    cloneTask,
    changeStatus,
    addComment,
    updateComment,
    removeComment,
  }
})
