import type { FormItemRule } from 'element-plus'
import { ValidationError, type AnyObject, type ObjectSchema } from 'yup'

export type ElRules = Partial<Record<string, FormItemRule[]>>

const DEFAULT_TRIGGER = ['blur', 'change']

export function getValidationMessage(error: unknown): string {
  if (error instanceof ValidationError) return error.errors[0] ?? error.message
  if (error instanceof Error) return error.message
  return 'Некорректное значение'
}

function isRequiredField<T extends AnyObject>(schema: ObjectSchema<T>, field: string): boolean {
  const description = schema.describe().fields[field]
  if (!description || !('optional' in description)) return false
  return !description.optional || description.tests.some((test) => test.name === 'required')
}

/**
 * Адаптер Yup → правила `el-form`: каждое поле валидируется через `schema.validateAt`,
 * а сообщение об ошибке показывается под соответствующим `el-form-item`.
 *
 * Схема и модель передаются геттерами — схема может зависеть от реактивного
 * состояния (например, проверка дубликатов по актуальному списку задач).
 */
export function yupToElRules<T extends AnyObject>(
  getSchema: () => ObjectSchema<T>,
  getModel: () => object,
  trigger: string[] = DEFAULT_TRIGGER,
): ElRules {
  const schema = getSchema()
  const rules: ElRules = {}

  for (const field of Object.keys(schema.fields)) {
    rules[field] = [
      {
        trigger,
        required: isRequiredField(schema, field),
        validator: (_rule, _value, callback) => {
          getSchema()
            .validateAt(field, getModel())
            .then(
              () => callback(),
              (error: unknown) => callback(new Error(getValidationMessage(error))),
            )
        },
      },
    ]
  }

  return rules
}
