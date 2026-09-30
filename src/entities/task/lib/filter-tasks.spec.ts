import { describe, expect, it } from 'vitest'
import type { Task } from '../model/types'
import { filterTasks, hasActiveFilters } from './filter-tasks'

const task = (id: string, overrides: Partial<Task>): Task => ({
  id,
  title: `Задача ${id}`,
  status: 'todo',
  assignee: 'a@b.ru',
  priority: 'low',
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
})

const tasks: Task[] = [
  task('1', { title: 'Настроить CI/CD', status: 'in_progress', priority: 'high' }),
  task('2', { title: 'Написать документацию API', status: 'todo', priority: 'medium' }),
  task('3', { title: 'Подготовить дизайн-систему', status: 'done', priority: 'high' }),
  task('4', { title: 'Настроить линтер', status: 'todo', priority: 'low' }),
]

const ids = (list: Task[]) => list.map((t) => t.id)

describe('filterTasks', () => {
  it('без фильтров возвращает всё', () => {
    expect(ids(filterTasks(tasks, {}))).toEqual(['1', '2', '3', '4'])
    expect(ids(filterTasks(tasks, { title: '', status: [], priority: [] }))).toHaveLength(4)
  })

  it('по названию — подстрока без учёта регистра', () => {
    expect(ids(filterTasks(tasks, { title: 'НАСТРОИТЬ' }))).toEqual(['1', '4'])
  })

  it('по нескольким статусам', () => {
    expect(ids(filterTasks(tasks, { status: ['todo', 'done'] }))).toEqual(['2', '3', '4'])
  })

  it('по нескольким приоритетам', () => {
    expect(ids(filterTasks(tasks, { priority: ['high'] }))).toEqual(['1', '3'])
  })

  it('комбинирует фильтры по «И»', () => {
    expect(
      ids(filterTasks(tasks, { title: 'настроить', status: ['todo'], priority: ['low', 'high'] })),
    ).toEqual(['4'])
    expect(filterTasks(tasks, { title: 'дизайн', status: ['todo'] })).toEqual([])
  })
})

describe('hasActiveFilters', () => {
  it('учитывает только непустые значения', () => {
    expect(hasActiveFilters({})).toBe(false)
    expect(hasActiveFilters({ title: '  ', status: [], priority: [] })).toBe(false)
    expect(hasActiveFilters({ status: ['done'] })).toBe(true)
  })
})
