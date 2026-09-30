import type { CommentSortOrder, TaskComment } from '../model/types'

/** Стабильная сортировка по времени создания; исходный массив не мутируется */
export function sortComments(
  comments: readonly TaskComment[],
  order: CommentSortOrder,
): TaskComment[] {
  const direction = order === 'asc' ? 1 : -1
  return comments
    .map((comment, index) => ({ comment, index, time: Date.parse(comment.createdAt) || 0 }))
    .sort((a, b) => (a.time - b.time) * direction || a.index - b.index)
    .map(({ comment }) => comment)
}
