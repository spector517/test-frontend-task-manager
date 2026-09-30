import { describe, expect, it } from 'vitest'
import { ValidationError } from 'yup'
import type { Task } from './types'
import {
  DUPLICATE_TITLE_MESSAGE,
  commentSchema,
  createTaskFormSchema,
  taskFilterSchema,
} from './schema'

const valid = {
  title: 'Нормальное название',
  description: '',
  assignee: 'user@smile.ru',
  priority: 'medium',
  status: undefined,
}

async function errorsOf(promise: Promise<unknown>): Promise<string[]> {
  try {
    await promise
    return []
  } catch (error) {
    if (error instanceof ValidationError) return error.errors
    throw error
  }
}

describe('createTaskFormSchema', () => {
  const schema = createTaskFormSchema()

  it('принимает валидные данные и обрезает пробелы', async () => {
    const result = await schema.validate({ ...valid, title: '  Трим  ' })
    expect(result.title).toBe('Трим')
  })

  it.each([
    ['', 'Введите название'],
    ['ab', 'Минимум 3 символа'],
    ['   ab   ', 'Минимум 3 символа'],
    ['a'.repeat(201), 'Максимум 200 символов'],
  ])('отклоняет название %j', async (title, message) => {
    expect(await errorsOf(schema.validateAt('title', { ...valid, title }))).toEqual([message])
  })

  it.each(['abc', 'a'.repeat(200)])('принимает название на границе (%#)', async (title) => {
    await expect(schema.validateAt('title', { ...valid, title })).resolves.toBe(title)
  })

  it('ограничивает описание 2000 символами', async () => {
    await expect(
      schema.validateAt('description', { ...valid, description: 'x'.repeat(2000) }),
    ).resolves.toBeDefined()
    expect(
      await errorsOf(schema.validateAt('description', { ...valid, description: 'x'.repeat(2001) })),
    ).toEqual(['Максимум 2000 символов'])
  })

  it('требует приоритет из списка', async () => {
    expect(
      await errorsOf(schema.validateAt('priority', { ...valid, priority: undefined })),
    ).toEqual(['Выберите приоритет'])
    expect(await errorsOf(schema.validateAt('priority', { ...valid, priority: 'urgent' }))).toEqual(
      ['Выберите приоритет из списка'],
    )
  })

  it('проверяет email исполнителя', async () => {
    expect(await errorsOf(schema.validateAt('assignee', { ...valid, assignee: '' }))).toEqual([
      'Укажите исполнителя',
    ])
    expect(
      await errorsOf(schema.validateAt('assignee', { ...valid, assignee: 'not-email' })),
    ).toEqual(['Введите корректный email'])
  })

  it('статус обязателен только в форме редактирования', async () => {
    await expect(schema.validateAt('status', valid)).resolves.toBeUndefined()

    const editSchema = createTaskFormSchema({ withStatus: true })
    expect(await errorsOf(editSchema.validateAt('status', valid))).toEqual(['Выберите статус'])
    await expect(editSchema.validateAt('status', { ...valid, status: 'done' })).resolves.toBe(
      'done',
    )
  })

  describe('проверка дубликатов', () => {
    const tasks: Pick<Task, 'id' | 'title'>[] = [
      { id: '1', title: 'Настроить CI/CD' },
      { id: '2', title: 'Написать документацию API' },
    ]
    // Та же проверка, что в store: store.tasks.some(t => t.title === title && t.id !== exceptId)
    const isTitleTaken = (exceptId?: string) => (title: string) =>
      tasks.some((t) => t.title === title && t.id !== exceptId)

    it('отклоняет существующее название (в том числе с пробелами по краям)', async () => {
      const createSchema = createTaskFormSchema({ isTitleTaken: isTitleTaken() })
      expect(
        await errorsOf(createSchema.validateAt('title', { ...valid, title: ' Настроить CI/CD ' })),
      ).toEqual([DUPLICATE_TITLE_MESSAGE])
    })

    it('при редактировании не считает дубликатом собственное название', async () => {
      const editSchema = createTaskFormSchema({ withStatus: true, isTitleTaken: isTitleTaken('1') })
      await expect(
        editSchema.validateAt('title', { ...valid, title: 'Настроить CI/CD' }),
      ).resolves.toBe('Настроить CI/CD')
      expect(
        await errorsOf(
          editSchema.validateAt('title', { ...valid, title: 'Написать документацию API' }),
        ),
      ).toEqual([DUPLICATE_TITLE_MESSAGE])
    })
  })
})

describe('taskFilterSchema', () => {
  it('пустое название — фильтр не задан', async () => {
    await expect(taskFilterSchema.validate({ title: '   ' })).resolves.toEqual({ title: undefined })
  })

  it('название фильтра: минимум 3, максимум 200 символов', async () => {
    expect(await errorsOf(taskFilterSchema.validate({ title: 'ab' }))).toEqual([
      'Минимум 3 символа',
    ])
    expect(await errorsOf(taskFilterSchema.validate({ title: 'a'.repeat(201) }))).toEqual([
      'Максимум 200 символов',
    ])
    await expect(taskFilterSchema.validate({ title: 'CI/' })).resolves.toEqual({ title: 'CI/' })
  })
})

describe('commentSchema', () => {
  it('не пропускает пустой комментарий и слишком длинный текст', async () => {
    expect(await errorsOf(commentSchema.validate({ text: '   ' }))).toEqual([
      'Комментарий не может быть пустым',
    ])
    expect(await errorsOf(commentSchema.validate({ text: 'x'.repeat(1001) }))).toEqual([
      'Максимум 1000 символов',
    ])
  })
})
