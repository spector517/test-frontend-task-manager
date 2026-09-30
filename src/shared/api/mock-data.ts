import type { TaskFullDto } from './task-dto'

/**
 * Начальные данные «БД». Первые три задачи — из ТЗ: у них комментарии в старом
 * строковом формате, чтобы mapper нормализовал оба формата.
 */
export function createSeedTasks(): TaskFullDto[] {
  return [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Подготовить дизайн-систему',
      description: 'Определить типографику, цвета и базовые компоненты',
      status: 'done',
      assignee: 'ivanov@smile.ru',
      priority: 'high',
      created_at: '2024-03-15T10:30:00Z',
      comments: [
        'При разработке дизайна использовать Pixso',
        'Дизайн-система должна быть готова к запуску',
      ],
    },
    {
      id: '6ba7b810-9dad-11d1-84b6-00c04fd21f14',
      title: 'Настроить CI/CD',
      status: 'in_progress',
      assignee: 'petrova@smile.ru',
      priority: 'high',
      created_at: '2024-03-20T14:00:00Z',
      comments: [],
    },
    {
      id: '6ba7b811-9dad-11d1-84b6-00c04fd21f15',
      title: 'Написать документацию API',
      status: 'todo',
      assignee: 'sidorov@smile.ru',
      priority: 'medium',
      created_at: '2024-04-01T09:15:00Z',
    },
    {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      title: 'Покрыть store unit-тестами',
      description: 'Проверить синхронизацию превью и детальной карточки',
      status: 'todo',
      assignee: 'petrova@smile.ru',
      priority: 'low',
      created_at: '2024-04-03T08:00:00Z',
      comments: [
        {
          id: 'c1a2b3c4-0000-4000-8000-000000000001',
          text: 'Начать с actions смены статуса',
          created_at: '2024-04-03T09:20:00Z',
        },
        {
          id: 'c1a2b3c4-0000-4000-8000-000000000002',
          text: 'Не забыть про клонирование',
          created_at: '2024-04-04T16:45:00Z',
        },
      ],
    },
    {
      id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
      title: 'Адаптивная вёрстка канбана',
      description: 'На экранах уже 768px колонки выстраиваются друг под другом',
      status: 'in_progress',
      assignee: 'ivanov@smile.ru',
      priority: 'medium',
      created_at: '2024-04-05T12:10:00Z',
      comments: [
        {
          id: 'c1a2b3c4-0000-4000-8000-000000000003',
          text: 'Проверить на iPhone SE',
          created_at: '2024-04-06T10:00:00Z',
        },
      ],
    },
  ]
}
