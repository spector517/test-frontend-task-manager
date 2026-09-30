import { delay, uid } from '@/shared/lib'
import { createSeedTasks } from './mock-data'
import {
  legacyCommentId,
  type SavedCommentDto,
  type TaskCreateDto,
  type TaskDto,
  type TaskFiltersDto,
  type TaskFullDto,
  type TaskStatusDto,
  type TaskUpdateDto,
} from './task-dto'

/** Задержка «сети» из ТЗ */
export const API_DELAY = 2000
/** Для PUT в ТЗ задана короткая задержка — используем её для всех точечных изменений */
export const API_UPDATE_DELAY = 300

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

let db: TaskFullDto[] = createSeedTasks()

/** Сброс «БД» к начальному состоянию (для тестов) */
export function resetMockDb(tasks: TaskFullDto[] = createSeedTasks()): void {
  db = structuredClone(tasks)
}

function failRate(): number {
  const raw = Number(import.meta.env.VITE_MOCK_FAIL_RATE ?? 0)
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 1) : 0
}

async function respond<T>(ms: number, handler: () => T): Promise<T> {
  await delay(ms)
  if (Math.random() < failRate()) {
    throw new ApiError('Сервер временно недоступен (имитация сбоя). Повторите попытку.', 503)
  }
  // Отдаём копию, чтобы клиент не мог мутировать «БД» по ссылке
  return structuredClone(handler())
}

function findTask(id: string): TaskFullDto {
  const task = db.find((t) => t.id === id)
  if (!task) throw new ApiError('Задача не найдена', 404)
  return task
}

function toPreview({ comments: _comments, ...preview }: TaskFullDto): TaskDto {
  return preview
}

function matchesFilters(task: TaskDto, filters: TaskFiltersDto): boolean {
  const title = filters.title?.trim().toLowerCase()
  if (title && !task.title.toLowerCase().includes(title)) return false
  if (filters.status?.length && !filters.status.includes(task.status)) return false
  if (filters.priority?.length && !filters.priority.includes(task.priority)) return false
  return true
}

/**
 * Приводит комментарии старого формата (строки) к объектам с id.
 * id вычисляется так же, как на клиенте, поэтому ранее полученные клиентом id остаются валидными.
 */
function migrateComments(task: TaskFullDto): SavedCommentDto[] {
  const comments = (task.comments ?? []).map((comment, index): SavedCommentDto =>
    typeof comment === 'string'
      ? { id: legacyCommentId(task.id, index), text: comment, created_at: task.created_at }
      : { ...comment, id: comment.id ?? legacyCommentId(task.id, index) },
  )
  task.comments = comments
  return comments
}

function findComment(task: TaskFullDto, commentId: string): SavedCommentDto {
  const comment = migrateComments(task).find((c) => c.id === commentId)
  if (!comment) throw new ApiError('Комментарий не найден', 404)
  return comment
}

function newComment(text: string): SavedCommentDto {
  return { id: uid(), text, created_at: new Date().toISOString() }
}

export const taskApi = {
  // GET /tasks?title=...&status=...&priority=...
  getAll(filters: TaskFiltersDto = {}): Promise<TaskDto[]> {
    return respond(API_DELAY, () =>
      db.map(toPreview).filter((task) => matchesFilters(task, filters)),
    )
  },

  // GET /tasks/:id
  getById(id: string): Promise<TaskFullDto | null> {
    return respond(API_DELAY, () => db.find((t) => t.id === id) ?? null)
  },

  // POST /tasks
  create(data: TaskCreateDto): Promise<TaskFullDto> {
    return respond(API_DELAY, () => {
      const task: TaskFullDto = {
        ...data,
        id: uid(),
        created_at: new Date().toISOString(),
        comments: [],
      }
      db.push(task)
      return task
    })
  },

  // PUT /tasks/:id
  update(id: string, data: TaskUpdateDto): Promise<TaskFullDto> {
    return respond(API_UPDATE_DELAY, () => {
      const task = findTask(id)
      Object.assign(task, data)
      return task
    })
  },

  // DELETE /tasks/:id
  remove(id: string): Promise<void> {
    return respond(API_DELAY, () => {
      findTask(id)
      db = db.filter((t) => t.id !== id)
    })
  },

  // POST /tasks/:id/clone — полная копия (включая комментарии и дату создания), меняется только id
  clone(id: string): Promise<TaskFullDto> {
    return respond(API_DELAY, () => {
      const source = findTask(id)
      const copy: TaskFullDto = { ...structuredClone(source), id: uid() }
      db.splice(db.indexOf(source) + 1, 0, copy)
      return copy
    })
  },

  // PATCH /tasks/:id/status — смена статуса атомарно с обязательным комментарием (в начало списка)
  changeStatus(id: string, status: TaskStatusDto, commentText: string): Promise<TaskFullDto> {
    return respond(API_UPDATE_DELAY, () => {
      const task = findTask(id)
      task.status = status
      task.comments = [newComment(commentText), ...migrateComments(task)]
      return task
    })
  },

  // POST /tasks/:id/comments
  addComment(taskId: string, text: string): Promise<SavedCommentDto> {
    return respond(API_UPDATE_DELAY, () => {
      const task = findTask(taskId)
      const comment = newComment(text)
      task.comments = [...migrateComments(task), comment]
      return comment
    })
  },

  // PUT /tasks/:id/comments/:commentId
  updateComment(taskId: string, commentId: string, text: string): Promise<SavedCommentDto> {
    return respond(API_UPDATE_DELAY, () => {
      const comment = findComment(findTask(taskId), commentId)
      comment.text = text
      comment.updated_at = new Date().toISOString()
      return comment
    })
  },

  // DELETE /tasks/:id/comments/:commentId
  removeComment(taskId: string, commentId: string): Promise<void> {
    return respond(API_UPDATE_DELAY, () => {
      const task = findTask(taskId)
      findComment(task, commentId)
      task.comments = migrateComments(task).filter((c) => c.id !== commentId)
    })
  },
}

export type TaskApi = typeof taskApi
