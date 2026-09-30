import { mixed, object, string, type ObjectSchema } from 'yup'
import { TASK_PRIORITIES, TASK_STATUSES } from '../config/labels'
import type { TaskFilters, TaskFormValues, TaskPriority, TaskStatus } from './types'

export const TITLE_MIN = 3
export const TITLE_MAX = 200
export const DESCRIPTION_MAX = 2000
export const ASSIGNEE_MAX = 254
export const COMMENT_MAX = 1000

export const DUPLICATE_TITLE_MESSAGE = 'Задача с таким названием уже существует'

export const titleSchema = string()
  .trim()
  .required('Введите название')
  .min(TITLE_MIN, `Минимум ${TITLE_MIN} символа`)
  .max(TITLE_MAX, `Максимум ${TITLE_MAX} символов`)

export const descriptionSchema = string()
  .trim()
  .max(DESCRIPTION_MAX, `Максимум ${DESCRIPTION_MAX} символов`)
  .optional()

export const assigneeSchema = string()
  .trim()
  .required('Укажите исполнителя')
  .email('Введите корректный email')
  .max(ASSIGNEE_MAX, `Максимум ${ASSIGNEE_MAX} символа`)

export const prioritySchema = mixed<TaskPriority>()
  .oneOf(TASK_PRIORITIES, 'Выберите приоритет из списка')
  .required('Выберите приоритет')

export const statusSchema = mixed<TaskStatus>().oneOf(TASK_STATUSES, 'Выберите статус из списка')

export interface TaskFormSchemaOptions {
  /** Проверка дубликата: `true`, если задача с таким названием уже есть */
  isTitleTaken?: (title: string) => boolean
  /** Поле статуса есть только в форме редактирования */
  withStatus?: boolean
}

export function createTaskFormSchema(
  options: TaskFormSchemaOptions = {},
): ObjectSchema<TaskFormValues> {
  const { isTitleTaken, withStatus = false } = options

  return object({
    title: titleSchema.test(
      'unique-title',
      DUPLICATE_TITLE_MESSAGE,
      (title) => !title || !isTitleTaken?.(title),
    ),
    description: descriptionSchema,
    assignee: assigneeSchema,
    priority: prioritySchema,
    status: statusSchema.test(
      'required',
      'Выберите статус',
      (status) => !withStatus || status !== undefined,
    ),
  })
}

/** Пустая строка в фильтре — «фильтр не задан», а не ошибка валидации */
export const taskFilterSchema: ObjectSchema<Pick<TaskFilters, 'title'>> = object({
  title: string()
    .trim()
    .transform((value: string) => (value === '' ? undefined : value))
    .min(TITLE_MIN, `Минимум ${TITLE_MIN} символа`)
    .max(TITLE_MAX, `Максимум ${TITLE_MAX} символов`)
    .optional(),
})

export interface CommentFormValues {
  text: string
}

export const commentSchema: ObjectSchema<CommentFormValues> = object({
  text: string()
    .trim()
    .required('Комментарий не может быть пустым')
    .max(COMMENT_MAX, `Максимум ${COMMENT_MAX} символов`),
})
