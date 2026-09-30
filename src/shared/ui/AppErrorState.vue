<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    message: string
    retryLabel?: string
    loading?: boolean
  }>(),
  {
    title: 'Не удалось загрузить данные',
    retryLabel: 'Повторить',
    loading: false,
  },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <el-result icon="error" :title="title" :sub-title="message" class="app-error-state" role="alert">
    <template #extra>
      <el-button type="primary" :loading="loading" @click="emit('retry')">
        {{ retryLabel }}
      </el-button>
      <slot name="extra" />
    </template>
  </el-result>
</template>

<style scoped>
.app-error-state {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}
</style>
