import { describe, expect, it } from 'vitest'
import type { TaskComment } from '../model/types'
import { sortComments } from './sort-comments'

const comments: TaskComment[] = [
  { id: 'b', text: 'Второй', createdAt: '2024-05-02T10:00:00Z' },
  { id: 'a', text: 'Первый', createdAt: '2024-05-01T10:00:00Z' },
  { id: 'c', text: 'Третий', createdAt: '2024-05-03T10:00:00Z' },
]

describe('sortComments', () => {
  it('asc — сначала старые', () => {
    expect(sortComments(comments, 'asc').map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })

  it('desc — сначала новые', () => {
    expect(sortComments(comments, 'desc').map((c) => c.id)).toEqual(['c', 'b', 'a'])
  })

  it('не мутирует исходный массив и сохраняет порядок при равном времени', () => {
    const same: TaskComment[] = [
      { id: 'x', text: '1', createdAt: '2024-01-01T00:00:00Z' },
      { id: 'y', text: '2', createdAt: '2024-01-01T00:00:00Z' },
    ]
    expect(sortComments(same, 'desc').map((c) => c.id)).toEqual(['x', 'y'])
    sortComments(comments, 'asc')
    expect(comments.map((c) => c.id)).toEqual(['b', 'a', 'c'])
  })
})
