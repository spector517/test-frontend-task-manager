import { taskApi } from '@/shared/api'
import type {
  Task,
  TaskComment,
  TaskFilters,
  TaskFormValues,
  TaskFull,
  TaskStatus,
} from '../model/types'
import {
  toCreateDto,
  toFiltersDto,
  toSavedComment,
  toTask,
  toTaskFull,
  toUpdateDto,
} from './task-mapper'

/** Доступ к API в терминах доменной модели: DTO наружу не выходят */
export const taskRepository = {
  async getAll(filters: TaskFilters = {}): Promise<Task[]> {
    const dtos = await taskApi.getAll(toFiltersDto(filters))
    return dtos.map(toTask)
  },

  async getById(id: string): Promise<TaskFull | null> {
    const dto = await taskApi.getById(id)
    return dto ? toTaskFull(dto) : null
  },

  async create(values: TaskFormValues): Promise<TaskFull> {
    return toTaskFull(await taskApi.create(toCreateDto(values)))
  },

  async update(id: string, values: TaskFormValues): Promise<TaskFull> {
    return toTaskFull(await taskApi.update(id, toUpdateDto(values)))
  },

  remove(id: string): Promise<void> {
    return taskApi.remove(id)
  },

  async clone(id: string): Promise<TaskFull> {
    return toTaskFull(await taskApi.clone(id))
  },

  async changeStatus(id: string, status: TaskStatus, comment: string): Promise<TaskFull> {
    return toTaskFull(await taskApi.changeStatus(id, status, comment))
  },

  async addComment(taskId: string, text: string): Promise<TaskComment> {
    return toSavedComment(await taskApi.addComment(taskId, text))
  },

  async updateComment(taskId: string, commentId: string, text: string): Promise<TaskComment> {
    return toSavedComment(await taskApi.updateComment(taskId, commentId, text))
  },

  removeComment(taskId: string, commentId: string): Promise<void> {
    return taskApi.removeComment(taskId, commentId)
  },
}

export type TaskRepository = typeof taskRepository
