# Менеджер задач — frontend-прототип

SPA-канбан для команды: **Vue 3 + TypeScript + Pinia + Vite + Element Plus**, архитектура — **Feature-Sliced Design**. Бекенда нет: API имитируется моками с задержкой.

## Требования

- **Node.js 22** (`>=22.12.0`; нужная версия указана в `.nvmrc` и `package.json → engines`)
- npm 10+

> Линтер FSD (Steiger) требует Node `>=22.18` — на более старых 22.x он не запустится, но на сборку и запуск приложения это не влияет.

## Запуск

```bash
nvm use            # переключиться на Node 22 (если используется nvm)
npm ci             # установить зависимости
npm run dev        # dev-сервер: http://localhost:5173
```

## Скрипты

| Команда             | Что делает                                                 |
| ------------------- | ---------------------------------------------------------- |
| `npm run dev`       | dev-сервер Vite с HMR                                      |
| `npm run build`     | проверка типов (`vue-tsc`) и production-сборка в `dist/`   |
| `npm run preview`   | локальный просмотр production-сборки                       |
| `npm test`          | unit-тесты (Vitest)                                        |
| `npm run typecheck` | проверка типов приложения, конфигов и тестов               |
| `npm run lint`      | ESLint (`no-explicit-any: error`)                          |
| `npm run lint:fsd`  | Steiger — проверка правил FSD (поток импортов, public API) |
| `npm run format`    | Prettier                                                   |

### Имитация ошибок сервера

Чтобы увидеть error-state (сообщение об ошибке и кнопку «Повторить»), создайте `.env.local`:

```
VITE_MOCK_FAIL_RATE=0.3
```

Значение — доля запросов (0..1), которые завершатся ошибкой. По умолчанию `0`.
