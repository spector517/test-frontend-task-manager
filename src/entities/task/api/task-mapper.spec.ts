import { describe, expect, it } from 'vitest'
import { legacyCommentId, type TaskFullDto } from '@/shared/api'
import { toCreateDto, toFiltersDto, toTask, toTaskFull, toUpdateDto } from './task-mapper'

const baseDto: TaskFullDto = {
  id: 't1',
  title: 'Задача',
  description: 'Описание',
  status: 'todo',
  assignee: 'a@b.ru',
  priority: 'high',
  created_at: '2024-03-15T10:30:00Z',
}

describe('task-mapper', () => {
  it('переименовывает created_at → createdAt и не тащит комментарии в превью', () => {
    const withComments: TaskFullDto = { ...baseDto, comments: ['x'] }
    const task = toTask(withComments)

    expect(task).toEqual({
      id: 't1',
      title: 'Задача',
      description: 'Описание',
      status: 'todo',
      assignee: 'a@b.ru',
      priority: 'high',
      createdAt: '2024-03-15T10:30:00Z',
    })
    expect(task).not.toHaveProperty('comments')
    expect(task).not.toHaveProperty('created_at')
  })

  it('не создаёт поле description, если его нет', () => {
    const { description: _description, ...withoutDescription } = baseDto
    expect(toTask(withoutDescription)).not.toHaveProperty('description')
  })

  it('отсутствие comments превращает в пустой массив', () => {
    expect(toTaskFull(baseDto).comments).toEqual([])
  })

  it('нормализует комментарии старого формата (string[])', () => {
    const full = toTaskFull({ ...baseDto, comments: ['Первый', 'Второй'] })

    expect(full.comments).toEqual([
      { id: legacyCommentId('t1', 0), text: 'Первый', createdAt: baseDto.created_at },
      { id: legacyCommentId('t1', 1), text: 'Второй', createdAt: baseDto.created_at },
    ])
  })

  it('поддерживает смешанный формат и сохраняет updatedAt', () => {
    const full = toTaskFull({
      ...baseDto,
      comments: [
        {
          id: 'c1',
          text: 'Новый',
          created_at: '2024-05-01T00:00:00Z',
          updated_at: '2024-05-02T00:00:00Z',
        },
        { text: 'Без id', created_at: '2024-05-03T00:00:00Z' },
        'Строка',
      ],
    })

    expect(full.comments).toEqual([
      {
        id: 'c1',
        text: 'Новый',
        createdAt: '2024-05-01T00:00:00Z',
        updatedAt: '2024-05-02T00:00:00Z',
      },
      { id: legacyCommentId('t1', 1), text: 'Без id', createdAt: '2024-05-03T00:00:00Z' },
      { id: legacyCommentId('t1', 2), text: 'Строка', createdAt: baseDto.created_at },
    ])
  })

  it('toCreateDto ставит статус todo по умолчанию и убирает пустое описание', () => {
    expect(
      toCreateDto({ title: 'Новая', description: '', assignee: 'a@b.ru', priority: 'low' }),
    ).toEqual({
      title: 'Новая',
      description: undefined,
      assignee: 'a@b.ru',
      priority: 'low',
      status: 'todo',
    })
  })

  it('toUpdateDto передаёт статус из формы редактирования', () => {
    expect(
      toUpdateDto({ title: 'T', assignee: 'a@b.ru', priority: 'medium', status: 'done' }),
    ).toMatchObject({ status: 'done', priority: 'medium' })
  })

  it('toFiltersDto отбрасывает пустые фильтры', () => {
    expect(toFiltersDto({ title: '', status: [], priority: ['high'] })).toEqual({
      priority: ['high'],
    })
  })
})
