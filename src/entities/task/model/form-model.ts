import type { Task, TaskFormModel } from './types'

export function createEmptyTaskFormModel(): TaskFormModel {
  return { title: '', description: '', assignee: '', priority: undefined, status: undefined }
}

export function taskToFormModel(task: Task): TaskFormModel {
  return {
    title: task.title,
    description: task.description ?? '',
    assignee: task.assignee,
    priority: task.priority,
    status: task.status,
  }
}
