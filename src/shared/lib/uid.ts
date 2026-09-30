/**
 * `crypto.randomUUID` доступен только в secure context (https / localhost).
 * При открытии dev-сервера с телефона по IP в локальной сети его нет — нужен фолбэк.
 */
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
