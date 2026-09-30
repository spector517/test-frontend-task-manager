# План: frontend-прототип «Менеджер задач»

## Контекст

Нужно спланировать SPA по тестовому заданию (`~/Downloads/test.md`): канбан-менеджер задач на **Vue 3 + TypeScript + Pinia + Vite + Element Plus** по **Feature-Sliced Design**, бекенд — моки с задержкой. Цель — прозрачная архитектура, строгая типизация (ноль `any`), Yup-валидация, видимые loading/error-состояния. Проект с нуля.

Принятые решения (согласовано):
- Реализуем **все дополнительные требования**: toast, unit-тесты, DTO-mapper, комментарии со временем + сортировка, drag&drop с обязательным комментарием, мобильная адаптивность.
- **Фильтрация на клиенте**: store загружает все превью один раз, фильтр — `computed` над `store.tasks`. `taskApi.getAll(filters)` всё равно доописывается и типизируется по ТЗ.
- **Исполнитель** — `el-select` с вариантами из существующих исполнителей + `allow-create`; Yup: `required().email()`.

---

## 1. Стек и инструменты

| Назначение | Выбор |
|---|---|
| Сборка | Vite (актуальная, совместимая с Node 22), `@vitejs/plugin-vue` |
| Язык | TypeScript `strict`, `noUncheckedIndexedAccess`, `vue-tsc --noEmit` |
| Состояние | Pinia (setup-stores) |
| Роутинг | vue-router, `createWebHashHistory` |
| UI | Element Plus + `@element-plus/icons-vue`, локаль `ru` |
| Валидация | Yup + адаптер к правилам `el-form` |
| Drag&drop | `vue-draggable-plus` (SortableJS, поддерживает touch) |
| Тесты | Vitest + `@vue/test-utils` + jsdom |
| Линт | ESLint (flat config) + `typescript-eslint` (`no-explicit-any: error`), Prettier, **Steiger** (официальный FSD-линтер) |
| Node | `package.json → engines.node: ">=22 <23"`, `.nvmrc` = `22` |

Скрипты: `dev`, `build` (`vue-tsc && vite build`), `preview`, `test`, `lint`, `lint:fsd`, `typecheck`.
Алиас `@/` → `src/`.

---

## 2. Структура FSD

Поток импортов строго сверху вниз: `app → pages → widgets → features → entities → shared`. Каждый слайс экспортирует наружу только через `index.ts` (public API). Кросс-импортов между слайсами одного слоя нет.

```
src/
├── app/
│   ├── main.ts                 # createApp, Pinia, router, ElementPlus (ru)
│   ├── App.vue                 # layout: header + <RouterView/>
│   ├── router/index.ts         # из ТЗ + guard/redirect
│   └── styles/                 # tokens.css (контраст), base.css, overrides Element Plus
├── pages/
│   ├── task-list/index.vue     # заголовок, TaskFilter, кнопка «Создать задачу», TaskBoard
│   └── task-card/index.vue     # props: id; «Назад», TaskDetails, TaskComments
├── widgets/
│   ├── task-board/             # канбан: колонки по статусам, DnD, лоадер/ошибка/пусто
│   ├── task-details/           # режим чтения + кнопка «Редактировать»
│   └── task-comments/          # список, сортировка asc/desc, CRUD
├── features/
│   ├── task-create/            # кнопка + диалог + форма создания
│   ├── task-edit/              # диалог + форма редактирования
│   ├── task-delete/            # кнопка + ElMessageBox.confirm
│   ├── task-clone/             # кнопка клонирования
│   ├── task-filter/            # форма фильтра + filter-store
│   ├── task-change-status/     # диалог «комментарий к смене статуса» (для DnD)
│   └── comment-manage/         # форма добавления/редактирования, удаление комментария
├── entities/
│   └── task/
│       ├── model/
│       │   ├── types.ts        # Task, TaskFull, TaskComment, TaskStatus, TaskPriority, TaskFilters
│       │   ├── task-store.ts   # Pinia store (см. §4)
│       │   └── schema.ts       # базовые Yup-схемы полей + фабрика схемы формы
│       ├── api/
│       │   ├── task-mapper.ts  # DTO ⇄ domain
│       │   └── task-repository.ts  # вызывает shared/api + mapper
│       ├── lib/
│       │   ├── filter-tasks.ts # чистая функция фильтрации
│       │   ├── sort-comments.ts
│       │   └── group-by-status.ts
│       ├── config/labels.ts    # STATUS_LABELS, PRIORITY_LABELS, порядок колонок
│       ├── ui/                 # TaskCard.vue, TaskStatusTag.vue, TaskPriorityTag.vue, CommentItem.vue
│       └── index.ts
└── shared/
    ├── api/
    │   ├── task-api.ts         # мок-бекенд из ТЗ, дописанный (см. §3)
    │   ├── task-dto.ts         # TaskDto, TaskFullDto, CommentDto, TaskFiltersDto
    │   └── mock-data.ts
    ├── lib/
    │   ├── delay.ts
    │   ├── validation/yup-to-el-rules.ts   # адаптер Yup → FormItemRule
    │   ├── format-date.ts      # Intl.DateTimeFormat('ru-RU')
    │   ├── notify.ts           # обёртка над ElMessage (success/error/warning)
    │   └── error-message.ts    # unknown → string
    └── ui/                     # AppErrorState.vue (el-result + «Повторить»), PageHeader.vue
```

Комментарии держим внутри сущности `task` (они не живут без задачи) — это избавляет от кросс-импортов entities через `@x`.

---

## 3. Слой данных: мок-API, DTO и mapper

**`shared/api/task-dto.ts`** — формат «бекенда» (намеренно отличается от домена, чтобы mapper имел смысл):
- `TaskDto`: `id, title, description?, status, assignee, priority, created_at`
- `CommentDto = string | { text: string; created_at: string }` — поддержка старого формата `string[]` из моков ТЗ
- `TaskFullDto = TaskDto & { comments?: CommentDto[] }`
- `TaskFiltersDto`: `title?: string; status?: TaskStatus[]; priority?: TaskPriority[]`

**`shared/api/task-api.ts`** — мок из ТЗ, доработанный:
- общая `delay(ms)`; `API_DELAY = 2000` (для `update` — 300 мс, как в ТЗ);
- `getAll(filters)` — реализует все три фильтра (includes по title без учёта регистра, `status`/`priority` по массивам) и отдаёт превью **без comments** (приведение TaskFull → Task);
- `getById(id)` → `TaskFullDto | null`;
- `create(data)`, `update(id, data)` — сигнатуры из ТЗ;
- **добавить**: `remove(id)`, `clone(id)` (глубокая копия, меняется только `id`), `addComment(taskId, text, { prepend })`, `updateComment(taskId, commentId, text)`, `removeComment(taskId, commentId)`, `changeStatus(taskId, status, commentText)` (атомарно: статус + комментарий в начало списка);
- ответы — `structuredClone`, чтобы UI не мутировал «БД» по ссылке;
- опционально `VITE_MOCK_FAIL_RATE` (0 по умолчанию) — случайные ошибки для демонстрации error-state.

**`entities/task/api/task-mapper.ts`**:
- `toTask(dto)`, `toTaskFull(dto)`: `created_at → createdAt`, нормализация комментариев: строка → `{ id, text, createdAt: task.createdAt }`, объект → `{ id, text, createdAt }`;
- `toCreateDto(formValues)`, `toUpdateDto(formValues)`.

**Доменные типы (`entities/task/model/types.ts`)**:
```ts
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'
export interface Task { id; title; description?; status; assignee; priority; createdAt }
export interface TaskComment { id: string; text: string; createdAt: string }
export interface TaskFull extends Task { comments: TaskComment[] }
export interface TaskFilters { title?: string; status?: TaskStatus[]; priority?: TaskPriority[] }
export type TaskFormValues = Pick<Task, 'title' | 'description' | 'assignee' | 'priority'> & { status?: TaskStatus }
```
`id` у комментария нужен для edit/delete (индекс ломается при сортировке); в DTO он опционален, mapper генерирует при отсутствии.

---

## 4. Pinia store (`entities/task/model/task-store.ts`)

Состояние:
- `tasks: Task[]` — превью для канбана;
- `current: TaskFull | null` — детальная карточка;
- `listStatus / currentStatus: 'idle' | 'loading' | 'success' | 'error'` + `listError / currentError: string | null`;
- `pending: Set<string>` — id задач с идущей операцией (блокировка кнопок/карточки).

Getters: `tasksByStatus` (через `group-by-status`), `assignees` (уникальные email для select), `hasTitle(title, exceptId?)`.

Actions (все через `task-repository`, с try/catch → статус/ошибка, пробрасывают ошибку наверх для toast):
`fetchTasks`, `ensureTasksLoaded`, `fetchTaskById`, `createTask`, `updateTask`, `deleteTask`, `cloneTask`, `changeStatus(id, status, comment)`, `addComment`, `updateComment`, `removeComment`.

После каждой мутации синхронизируются **оба** представления: превью в `tasks` и `current` (если открыта та же задача).

Фильтры — отдельный `useTaskFilterStore` в `features/task-filter/model` (`applied: TaskFilters`, `reset()`); виджет доски берёт `filterTasks(store.tasks, filterStore.applied)`.

---

## 5. Валидация (Yup)

`entities/task/model/schema.ts`:
- `title`: `string().trim().required().min(3).max(200)`
- `description`: `string().max(2000).optional()`
- `priority`: `mixed<TaskPriority>().oneOf(['low','medium','high']).required()` (в UI — «Низкий/Средний/Высокий»)
- `assignee`: `string().required().email()`
- `status` (только в редактировании): `oneOf(['todo','in_progress','done']).required()`
- фабрика `createTaskFormSchema({ isTitleTaken: (title) => boolean, withStatus })` — добавляет `.test('unique-title', 'Задача с таким названием уже существует', …)`.

Фича передаёт предикат из стора: `(t) => store.tasks.some(x => x.title === t && x.id !== editingId)` (как в ТЗ; при редактировании исключаем текущую задачу).
При прямом заходе на `/tasks/:id` перед открытием формы редактирования вызывается `ensureTasksLoaded()`, иначе проверка дубликатов шла бы по пустому списку.

`shared/lib/validation/yup-to-el-rules.ts` — строит `FormRules` из схемы: для каждого поля `validator` вызывает `schema.validateAt(field, model)`; ошибки показываются под полями `el-form-item`. Перед submit — `schema.validate(model, { abortEarly: false })`.

Схема фильтра: `title`: `string().min(3).max(200)` (пустая строка допустима → `transform` в `undefined`). Невалидное значение не применяется, ошибка видна под полем.

Схема комментария: `text`: `string().trim().required().max(1000)`.

---

## 6. Страницы и функциональность

### `/tasks` — список (канбан)
- Колонки: «К выполнению» (`todo`), «В работе» (`in_progress`), «Готово» (`done`); счётчик в заголовке колонки.
- `TaskCard`: название (ссылка на `/tasks/:id`), `TaskStatusTag` (человеко-читаемый статус), `TaskPriorityTag`, исполнитель, дата создания; действия: «Клонировать», «Удалить».
- **Создать задачу** → `el-dialog` с формой (title, description, assignee, priority; статус не выводится, по умолчанию `todo`). Во время запроса кнопка в `loading`. Успех → toast + `router.push({ name: 'task-card', params: { id } })`. «Отмена» — закрывает диалог и сбрасывает форму.
- **Клонирование** → `cloneTask`, toast, новая карточка появляется в колонке (копируется всё, включая комментарии и `createdAt`, меняется только `id` — строго по ТЗ).
- **Удаление** → `ElMessageBox.confirm` («Удалить» / «Отмена») → `deleteTask`, toast.
- **Фильтр**: поле названия (debounce 300 мс), multi-select статусов, multi-select приоритетов, кнопка «Сбросить фильтры». Фильтры комбинируются (AND). При пустом результате — `el-empty`.
- **Drag&drop**: `VueDraggable` с общей `group` на колонках. На `@add` перемещение не применяется к стору сразу: DOM-перенос откатывается, открывается диалог `task-change-status` («Смена статуса: X → Y», обязательный комментарий). «Подтвердить» → `changeStatus` (статус + комментарий в **начало** списка) → карточка переезжает реактивно. «Отмена» → карточка остаётся в исходной колонке. Внутри одной колонки сортировка отключена.
- Для мобильных/доступности дублируем действие пунктом «Сменить статус» на карточке (тот же диалог).
- Loading: `v-loading` на доске при первой загрузке (2 с). Error: `AppErrorState` с текстом ошибки и кнопкой «Повторить».

### `/tasks/:id` — детальная карточка
- `props: true` → `id`. При монтировании и при смене `id` — `fetchTaskById`. Пока грузится — `el-skeleton`.
- Не найдено (`null`) → toast «Задача не найдена» + `router.replace({ name: 'task-list' })`. Ошибка сети → `AppErrorState` с «Повторить».
- Режим чтения: `el-descriptions` со всеми полями, кроме `id` (название, описание, статус, приоритет, исполнитель, дата создания).
- «Редактировать» → `el-dialog` с формой (title, description, status, assignee, priority). «Сохранить» → `updateTask`, закрыть диалог, toast; ошибки валидации — под полями, ошибка API — toast, диалог остаётся открытым.
- «Назад» → `router.push({ name: 'task-list' })` (не `history.back()`, чтобы работало при прямом заходе).
- **Комментарии**: список с датой/временем, переключатель сортировки «Сначала новые / Сначала старые» (`sort-comments`), добавление (textarea + кнопка), редактирование inline, удаление с подтверждением. Пустой список — `el-empty`.

---

## 7. Стили, контраст, адаптивность

- `app/styles/tokens.css`: переопределяем CSS-переменные Element Plus так, чтобы текст имел контраст **≥ 4.5:1 (WCAG AA)**: в частности `--el-text-color-secondary` и `--el-text-color-placeholder` (дефолтный `#909399` на белом ≈ 3:1 — затемняем до ~`#5c6068`), фон колонок светло-серый, карточки белые с явной рамкой, теги — в `effect="dark"` или с проверенными парами цветов.
- Адаптивность: CSS grid колонок `repeat(3, minmax(0, 1fr))` → на `< 768px` колонки в один столбец (или горизонтальный скролл-снап), форма фильтра — в столбик, диалоги `width="min(560px, 95vw)"`, `fullscreen` на мобильных.
- Никаких сложных стилей — минимальный scoped CSS.

---

## 8. Toast и ошибки

`shared/lib/notify.ts` (`ElMessage`): success при создании/сохранении/клонировании/удалении/смене статуса/CRUD комментариев; error — текст из `error-message.ts`. Ошибки валидации — под полями формы. Глобальный `app.config.errorHandler` → toast для непойманных ошибок.

---

## 9. Unit-тесты (Vitest)

- `task-mapper.spec.ts` — `created_at → createdAt`, нормализация `string[]` комментариев, отсутствие comments → `[]`.
- `schema.spec.ts` — границы title (2/3/200/201), description 2000/2001, приоритет вне enum, невалидный email, дубликат названия (и исключение текущей задачи при редактировании).
- `filter-tasks.spec.ts` — каждый фильтр отдельно и комбинация.
- `sort-comments.spec.ts` — asc/desc.
- `task-store.spec.ts` — с замоканным repository: `changeStatus` меняет статус и кладёт комментарий в начало; `cloneTask` копирует всё, кроме `id`; синхронизация `tasks` и `current`.
- (бонус) компонентный тест формы создания: сабмит невалидной формы показывает ошибки.

---

## 10. Этапы реализации

1. **Каркас**: Vite + TS strict, зависимости, ESLint/Prettier/Steiger, Vitest, алиасы, `.nvmrc`, `engines`, пустые FSD-слои, router из ТЗ, подключение Element Plus.
2. **Данные**: DTO, мок-API (все эндпоинты), mapper, repository, доменные типы, labels + тесты mapper'а.
3. **Store** + lib-функции (`filter-tasks`, `group-by-status`, `sort-comments`) + тесты.
4. **Валидация**: схемы, адаптер Yup → el-form + тесты схем.
5. **Страница списка**: TaskCard, TaskBoard (loading/error/empty), фичи create/delete/clone/filter.
6. **Детальная страница**: загрузка, редирект, чтение, редактирование, «Назад».
7. **Комментарии**: CRUD + сортировка.
8. **Drag&drop** со сменой статуса через комментарий + фолбэк-действие на карточке.
9. **Стили**: контраст, мобильная вёрстка.
10. **README.md**: требования (Node 22), `npm ci`, `npm run dev|build|preview|test|lint|lint:fsd`, краткое описание архитектуры и принятых решений (клиентская фильтрация, формат комментариев, клон с тем же названием).

---

## 11. Проверка

- `npm run typecheck` — без ошибок; `grep -rn "any" src --include=*.ts --include=*.vue` + ESLint `no-explicit-any` — ноль `any`.
- `npm run lint:fsd` (Steiger) — нет нарушений потока импортов и public API.
- `npm test` — все тесты зелёные.
- `npm run build` на Node 22 — успешная сборка.
- Ручной прогон в браузере (`npm run dev`, мобильный viewport 375px и десктоп):
  - лоадер 2 с на списке и детальной; создание → переход на `/tasks/:id`; «Отмена» закрывает диалог;
  - ошибки валидации (короткое название, дубликат, невалидный email, >2000 символов описания);
  - клонирование (комментарии скопированы), удаление с подтверждением/отменой;
  - фильтры по отдельности и вместе, «Сбросить фильтры», ошибка «минимум 3 символа» в фильтре;
  - `/tasks/несуществующий-id` → редирект на `/tasks`;
  - редактирование и сохранение, CRUD комментариев, сортировка asc/desc;
  - DnD: отмена возвращает карточку, подтверждение меняет статус и добавляет комментарий первым;
  - контраст текста проверить через DevTools (Accessibility → Contrast).
