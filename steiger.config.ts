import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // Тесты лежат рядом с кодом и не являются частью public API
    ignores: ['**/*.spec.ts'],
  },
  {
    rules: {
      // Каждое пользовательское действие (создать, клонировать, сменить статус…) вынесено
      // в отдельную фичу намеренно: в прототипе у большинства из них пока один потребитель,
      // но слияние фич с виджетами смешало бы бизнес-сценарии с композицией экрана.
      'fsd/insignificant-slice': 'off',
    },
  },
])
