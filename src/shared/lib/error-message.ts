const FALLBACK = 'Что-то пошло не так. Попробуйте ещё раз.'

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error) return error
  return FALLBACK
}
