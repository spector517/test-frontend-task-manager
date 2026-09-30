import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export const MOBILE_QUERY = '(max-width: 767px)'

/** Реактивный флаг «узкий экран» — например, чтобы открывать диалоги на весь экран */
export function useIsMobile(): Readonly<Ref<boolean>> {
  const isMobile = ref(false)
  let media: MediaQueryList | null = null

  const update = (): void => {
    isMobile.value = media?.matches ?? false
  }

  onMounted(() => {
    if (typeof window.matchMedia !== 'function') return
    media = window.matchMedia(MOBILE_QUERY)
    update()
    media.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    media?.removeEventListener('change', update)
  })

  return isMobile
}
