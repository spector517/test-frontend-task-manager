import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_DELAY, resetMockDb, taskApi } from './task-api'
import { legacyCommentId, type TaskFullDto } from './task-dto'

const seed: TaskFullDto[] = [
  {
    id: 'a',
    title: 'Подготовить дизайн-систему',
    status: 'done',
    assignee: 'ivanov@smile.ru',
    priority: 'high',
    created_at: '2024-03-15T10:30:00Z',
    comments: ['Первый', 'Второй'],
  },
  {
    id: 'b',
    title: 'Настроить CI/CD',
    status: 'in_progress',
    assignee: 'petrova@smile.ru',
    priority: 'medium',
    created_at: '2024-03-20T14:00:00Z',
  },
]

/** Запускает запрос и прокручивает фейковые таймеры задержки */
async function run<T>(request: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(API_DELAY)
  return request
}

describe('taskApi (мок)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetMockDb(seed)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('отвечает с задержкой 2 секунды', async () => {
    const onDone = vi.fn()
    void taskApi.getAll().then(onDone)

    await vi.advanceTimersByTimeAsync(API_DELAY - 1)
    expect(onDone).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    expect(onDone).toHaveBeenCalledOnce()
  })

  it('getAll отдаёт превью без комментариев и фильтрует по всем полям', async () => {
    const all = await run(taskApi.getAll())
    expect(all.every((task) => !('comments' in task))).toBe(true)

    expect((await run(taskApi.getAll({ title: 'ci/cd' }))).map((t) => t.id)).toEqual(['b'])
    expect((await run(taskApi.getAll({ status: ['done'] }))).map((t) => t.id)).toEqual(['a'])
    expect(
      (await run(taskApi.getAll({ priority: ['high', 'medium'], status: ['in_progress'] }))).map(
        (t) => t.id,
      ),
    ).toEqual(['b'])
  })

  it('возвращает копии: мутация ответа не меняет «БД»', async () => {
    const task = await run(taskApi.getById('a'))
    if (task) task.title = 'Изменено снаружи'
    expect((await run(taskApi.getById('a')))?.title).toBe('Подготовить дизайн-систему')
  })

  it('clone копирует всё, включая комментарии, кроме id', async () => {
    const copy = await run(taskApi.clone('a'))
    const source = await run(taskApi.getById('a'))

    expect(copy.id).not.toBe('a')
    expect({ ...copy, id: 'a' }).toEqual(source)
  })

  it('changeStatus добавляет комментарий в начало и мигрирует старые комментарии без смены id', async () => {
    const updated = await run(taskApi.changeStatus('a', 'todo', 'Вернули в работу'))

    expect(updated.status).toBe('todo')
    expect(updated.comments?.[0]).toMatchObject({ text: 'Вернули в работу' })
    expect(updated.comments?.slice(1)).toEqual([
      { id: legacyCommentId('a', 0), text: 'Первый', created_at: seed[0]?.created_at },
      { id: legacyCommentId('a', 1), text: 'Второй', created_at: seed[0]?.created_at },
    ])
  })

  it('комментарий старого формата можно редактировать и удалять по вычисленному id', async () => {
    const edited = await run(taskApi.updateComment('a', legacyCommentId('a', 1), 'Второй (правка)'))
    expect(edited).toMatchObject({ id: legacyCommentId('a', 1), text: 'Второй (правка)' })

    await run(taskApi.removeComment('a', legacyCommentId('a', 0)))
    const task = await run(taskApi.getById('a'))
    expect(task?.comments).toHaveLength(1)
  })

  it('ошибки 404 для несуществующей задачи', async () => {
    const request = taskApi.update('missing', { title: 'x' })
    const assertion = expect(request).rejects.toMatchObject({ status: 404 })
    await vi.advanceTimersByTimeAsync(API_DELAY)
    await assertion
    expect(await run(taskApi.getById('missing'))).toBeNull()
  })
})
