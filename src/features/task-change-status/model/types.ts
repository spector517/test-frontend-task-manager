import type { Task, TaskStatus } from '@/entities/task'

/** Запрос на смену статуса: откуда (задача с текущим статусом) и куда */
export interface StatusChangeRequest {
  task: Task
  to: TaskStatus
}
