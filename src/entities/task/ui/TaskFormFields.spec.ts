import { describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createTaskFormSchema } from '../model/schema'
import { createEmptyTaskFormModel } from '../model/form-model'
import type { TaskFormModel } from '../model/types'
import TaskFormFields from './TaskFormFields.vue'

function mountForm(model: TaskFormModel, withStatus = false) {
  return mount(TaskFormFields, {
    props: {
      modelValue: model,
      schema: createTaskFormSchema({
        withStatus,
        isTitleTaken: (title) => title === 'Настроить CI/CD',
      }),
      withStatus,
    },
    global: {
      plugins: [ElementPlus],
      // Сообщение об ошибке рендерится внутри TransitionGroup — заглушка его скрывает
      stubs: { transition: false, 'transition-group': false },
    },
  })
}

/** el-form-item показывает сообщение с небольшим debounce */
async function settle(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  await flushPromises()
}

function errors(wrapper: ReturnType<typeof mountForm>): string[] {
  return wrapper.findAll('.el-form-item__error').map((node) => node.text())
}

describe('TaskFormFields', () => {
  it('показывает ошибки под полями и не отдаёт значения невалидной формы', async () => {
    const wrapper = mountForm({ ...createEmptyTaskFormModel(), title: 'ab', assignee: 'bad' })

    const result = await wrapper.vm.validate()
    await settle()

    expect(result).toBeNull()
    expect(errors(wrapper)).toEqual([
      'Минимум 3 символа',
      'Выберите приоритет',
      'Введите корректный email',
    ])
  })

  it('показывает ошибку дубликата названия', async () => {
    const wrapper = mountForm({
      ...createEmptyTaskFormModel(),
      title: 'Настроить CI/CD',
      assignee: 'a@b.ru',
      priority: 'low',
    })

    expect(await wrapper.vm.validate()).toBeNull()
    await settle()
    expect(errors(wrapper)).toEqual(['Задача с таким названием уже существует'])
  })

  it('возвращает приведённые значения валидной формы', async () => {
    const wrapper = mountForm(
      {
        title: '  Новая задача  ',
        description: '',
        assignee: ' dev@smile.ru ',
        priority: 'high',
        status: 'in_progress',
      },
      true,
    )

    await expect(wrapper.vm.validate()).resolves.toEqual({
      title: 'Новая задача',
      description: '',
      assignee: 'dev@smile.ru',
      priority: 'high',
      status: 'in_progress',
    })
  })

  it('поле статуса выводится только в режиме редактирования', () => {
    expect(mountForm(createEmptyTaskFormModel()).text()).not.toContain('Статус')
    expect(mountForm(createEmptyTaskFormModel(), true).text()).toContain('Статус')
  })
})
