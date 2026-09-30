import { ElMessage } from 'element-plus'
import { getErrorMessage } from './error-message'

const DURATION = 3000

export const notify = {
  success(message: string): void {
    ElMessage({ type: 'success', message, duration: DURATION, showClose: true })
  },
  warning(message: string): void {
    ElMessage({ type: 'warning', message, duration: DURATION, showClose: true })
  },
  error(error: unknown): void {
    ElMessage({
      type: 'error',
      message: getErrorMessage(error),
      duration: DURATION * 2,
      showClose: true,
    })
  },
}
