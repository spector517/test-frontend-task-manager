import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { Task, TaskFull } from './types'
import { useTaskStore } from './task-store'

const repository = vi.hoisted(() => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  clone: vi.fn(),
  changeStatus: vi.fn(),
  addComment: vi.fn(),
  updateComment: vi.fn(),
  removeComment: vi.fn(),
}))

vi.mock('../api/task-repository', () => ({ taskRepository: repository }))

const full: TaskFull = {
  id: 't1',
  title: 'Настроить CI/CD',
  description: 'Пайплайн',
  status: 'todo',
  assignee: 'petrova@smile.ru',
  priority: 'high',
  createdAt: '2024-03-20T14:00:00Z',
  comments: [{ id: 'c1', text: 'Старый', createdAt: '2024-03-21T00:00:00Z' }],
}

const { comments: _comments, ...preview } = full
const other: Task = { ...preview, id: 't2', title: 'Другая задача' }

async function setupLoadedStore() {
  const store = useTaskStore()
  repository.getAll.mockResolvedValueOnce([preview, other])
  repository.getById.mockResolvedValueOnce(structuredClone(full))
  await store.fetchTasks()
  await store.fetchTaskById('t1')
  return store
}

describe('useTaskStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchTasks выставляет статусы загрузки и сохраняет ошибку', async () => {
    const store = useTaskStore()
    repository.getAll.mockRejectedValueOnce(new Error('Сеть недоступна'))

    const request = store.fetchTasks()
    expect(store.listStatus).toBe('loading')
    await request

    expect(store.listStatus).toBe('error')
    expect(store.listError).toBe('Сеть недоступна')
  })

  it('ensureTasksLoaded не делает повторный запрос', async () => {
    const store = useTaskStore()
    repository.getAll.mockResolvedValue([preview])

    await Promise.all([store.ensureTasksLoaded(), store.ensureTasksLoaded()])
    await store.ensureTasksLoaded()

    expect(repository.getAll).toHaveBeenCalledTimes(1)
    expect(store.tasks).toEqual([preview])
  })

  it('fetchTaskById возвращает null для несуществующей задачи', async () => {
    const store = useTaskStore()
    repository.getById.mockResolvedValueOnce(null)

    await expect(store.fetchTaskById('missing')).resolves.toBeNull()
    expect(store.current).toBeNull()
    expect(store.currentStatus).toBe('success')
  })

  it('hasTitle проверяет дубликаты и умеет исключать текущую задачу', async () => {
    const store = await setupLoadedStore()

    expect(store.hasTitle('Настроить CI/CD')).toBe(true)
    expect(store.hasTitle('  Настроить CI/CD ')).toBe(true)
    expect(store.hasTitle('Настроить CI/CD', 't1')).toBe(false)
    expect(store.hasTitle('Новая')).toBe(false)
  })

  it('changeStatus меняет статус и кладёт комментарий в начало — в обоих представлениях', async () => {
    const store = await setupLoadedStore()
    const updated: TaskFull = {
      ...full,
      status: 'in_progress',
      comments: [
        { id: 'c2', text: 'Взял в работу', createdAt: '2024-03-22T00:00:00Z' },
        ...full.comments,
      ],
    }
    repository.changeStatus.mockResolvedValueOnce(updated)

    const request = store.changeStatus('t1', 'in_progress', 'Взял в работу')
    expect(store.isPending('t1', 'status')).toBe(true)
    await request

    expect(repository.changeStatus).toHaveBeenCalledWith('t1', 'in_progress', 'Взял в работу')
    expect(store.isPending('t1')).toBe(false)
    expect(store.tasks.find((t) => t.id === 't1')?.status).toBe('in_progress')
    expect(store.tasks.find((t) => t.id === 't1')).not.toHaveProperty('comments')
    expect(store.current?.status).toBe('in_progress')
    expect(store.current?.comments[0]?.text).toBe('Взял в работу')
  })

  it('cloneTask вставляет копию сразу после оригинала', async () => {
    const store = await setupLoadedStore()
    const copy: TaskFull = { ...structuredClone(full), id: 't1-copy' }
    repository.clone.mockResolvedValueOnce(copy)

    const result = await store.cloneTask('t1')

    expect(store.tasks.map((t) => t.id)).toEqual(['t1', 't1-copy', 't2'])
    const { id: _id, ...copyRest } = result
    const { id: _origId, ...origRest } = full
    expect(copyRest).toEqual(origRest)
    expect(store.current?.id).toBe('t1')
  })

  it('updateTask синхронизирует превью и открытую карточку', async () => {
    const store = await setupLoadedStore()
    repository.update.mockResolvedValueOnce({ ...full, title: 'Новое название', priority: 'low' })

    await store.updateTask('t1', {
      title: 'Новое название',
      assignee: full.assignee,
      priority: 'low',
      status: 'todo',
    })

    expect(store.tasks[0]).toMatchObject({ title: 'Новое название', priority: 'low' })
    expect(store.current).toMatchObject({ title: 'Новое название', priority: 'low' })
    expect(store.current?.comments).toEqual(full.comments)
  })

  it('deleteTask убирает задачу из списка и закрывает карточку', async () => {
    const store = await setupLoadedStore()
    repository.remove.mockResolvedValueOnce(undefined)

    await store.deleteTask('t1')

    expect(store.tasks.map((t) => t.id)).toEqual(['t2'])
    expect(store.current).toBeNull()
  })

  it('ошибка мутации пробрасывается и не меняет состояние', async () => {
    const store = await setupLoadedStore()
    repository.remove.mockRejectedValueOnce(new Error('Задача не найдена'))

    await expect(store.deleteTask('t1')).rejects.toThrow('Задача не найдена')
    expect(store.tasks).toHaveLength(2)
    expect(store.isPending('t1')).toBe(false)
  })

  it('CRUD комментариев обновляет текущую карточку', async () => {
    const store = await setupLoadedStore()

    repository.addComment.mockResolvedValueOnce({
      id: 'c9',
      text: 'Новый',
      createdAt: '2024-04-01T00:00:00Z',
    })
    await store.addComment('t1', 'Новый')
    expect(store.current?.comments.map((c) => c.id)).toEqual(['c1', 'c9'])

    repository.updateComment.mockResolvedValueOnce({
      id: 'c1',
      text: 'Исправлен',
      createdAt: full.comments[0]?.createdAt,
      updatedAt: '2024-04-02T00:00:00Z',
    })
    await store.updateComment('t1', 'c1', 'Исправлен')
    expect(store.current?.comments[0]).toMatchObject({
      text: 'Исправлен',
      updatedAt: '2024-04-02T00:00:00Z',
    })

    repository.removeComment.mockResolvedValueOnce(undefined)
    await store.removeComment('t1', 'c9')
    expect(store.current?.comments.map((c) => c.id)).toEqual(['c1'])
  })
})
