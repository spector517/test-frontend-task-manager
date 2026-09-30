# CLAUDE.md

Этот файл содержит указания для Claude Code (claude.ai/code) по работе с кодом в этом репозитории.

## Обзор

Frontend-прототип канбан-менеджера задач: Vue 3 + TypeScript + Pinia + Vite + Element Plus, архитектура — Feature-Sliced Design (FSD). Бекенда нет: API — мок в памяти с искусственными задержками. Функциональность и принятые решения подробно описаны в `README.md`, исходный план реализации — в `PLAN.md`. Тексты интерфейса, комментарии в коде и документация на русском — новые тоже пиши на русском.

## Команды

Нужен Node 22 (`.nvmrc`; `engines: >=22.12.0 <23`). Steiger требует Node `>=22.18`.

```bash
npm run dev          # dev-сервер Vite на http://localhost:5173 (конфигурация "dev" в .claude/launch.json)
npm run build        # проверка типов приложения (vue-tsc) + production-сборка в dist/
npm test             # Vitest, однократный прогон
npm run test:watch
npx vitest run src/entities/task/model/task-store.spec.ts   # один файл тестов
npx vitest run -t "clone"                                    # тесты по подстроке в названии
npm run typecheck    # vue-tsc по приложению, конфигам и тестам (три tsconfig)
npm run lint         # ESLint
npm run lint:fsd     # Steiger: правила импортов FSD и public API
npm run format       # Prettier (без точек с запятой, одинарные кавычки, ширина 100, trailing commas)
```

Чтобы доля запросов к мок-API завершалась ошибкой (проверка error-state и «Повторить»), задай `VITE_MOCK_FAIL_RATE=0.3` в `.env.local`.

## Архитектура

Слои FSD в `src/`: `app → pages → widgets → features → entities → shared`. Импорты идут только сверху вниз, без кросс-импортов между слайсами одного слоя и всегда через `index.ts` слайса (public API) — например, `@/entities/task`, а не `@/entities/task/model/task-store`. Это проверяет Steiger; правило `fsd/insignificant-slice` отключено намеренно (каждое пользовательское действие — отдельная фича, даже с одним потребителем). Алиас `@/` → `src/`.

Сущность одна — `task`; остальное — фичи (по одной на действие: create, edit, delete, clone, filter, change-status, comment-manage), виджеты (kanban-board, task-details, comment-thread) и две страницы (`/tasks`, `/tasks/:id`, hash history).

**Поток данных (DTO и доменная модель):**
- `shared/api/task-api.ts` — мок-бекенд в формате DTO (`created_at`; комментарии либо в старом формате `string[]`, либо `{ text, created_at }`). «БД» — переменная модуля `db`; `resetMockDb()` сбрасывает её в тестах. Ответы отдаются через `structuredClone`. Чтение, создание, клонирование и удаление ждут `API_DELAY` (2 с); редактирование, смена статуса и комментарии — `API_UPDATE_DELAY` (300 мс). Ошибки — `ApiError` с HTTP-подобным статусом (404 для несуществующей задачи).
- `entities/task/api/task-mapper.ts` приводит DTO к доменной модели (`createdAt`; у каждого комментария есть `id` и дата). Строковые комментарии старого формата получают дату создания задачи и детерминированный id `<taskId>:legacy:<index>` (`legacyCommentId`); мок при первом изменении переводит их в объектный формат с теми же id.
- `entities/task/api/task-repository.ts` — единственное, что вызывает store; наружу отдаёт только доменные типы.

**Состояние (`useTaskStore`):** хранит `tasks` (превью без комментариев, для канбана) и `current` (полная задача для детальной страницы). Каждая мутация обязана обновлять оба представления через `applyTask`. Действия `fetch*` пишут `listStatus/listError` / `currentStatus/currentError` для loading/error UI; мутации пробрасывают ошибку, чтобы вызывающий код показал toast через `notify` (`shared/lib/notify.ts`). Выполняющиеся операции над задачами отслеживаются в `pending` (`isPending(id, op)`).

**Фильтрация на клиенте:** список загружается один раз, фильтр — `computed` над `store.tasks` через `filterTasks`; `taskApi.getAll(filters)` реализует и серверную фильтрацию, но UI от неё не зависит.

**Валидация:** Yup-схемы — в `entities/task/model/schema.ts`. `shared/lib/validation/yup-to-el-rules.ts` превращает схему в правила `el-form` (`validateAt` по каждому полю), поэтому ошибки показываются под полями. Схема и модель передаются геттерами, потому что схема реактивна: дубликат названия проверяется по `store.tasks` (`hasTitle`), без учёта редактируемой задачи. Клон намеренно сохраняет то же название.

**Смена статуса:** перетаскивание карточки в другую колонку (vue-draggable-plus) открывает `ChangeStatusDialog` с обязательным комментарием; статус меняется только после подтверждения, комментарий добавляется в начало списка, при отмене карточка возвращается на место. Кнопка «Статус» на карточке даёт тот же сценарий для телефона и клавиатуры.

## Соглашения

- TypeScript в режиме strict с `noUncheckedIndexedAccess` и `verbatimModuleSyntax`; ESLint запрещает `any` и требует `import type` для типов. Неиспользуемые переменные — с префиксом `_`.
- Тесты (`*.spec.ts`) лежат рядом с кодом и выполняются в jsdom. Тесты store мокают `../api/task-repository` через `vi.mock` и используют `setActivePinia(createPinia())`; тесты API — `vi.useFakeTimers()` и `resetMockDb(seed)`.
- Element Plus подключён целиком (локаль `ru`) и вынесен в отдельный чанк в `vite.config.ts`.
- Цвета текста подобраны с контрастом не ниже 4.5:1 (WCAG AA); дизайн-токены — в `app/styles/tokens.css`.
