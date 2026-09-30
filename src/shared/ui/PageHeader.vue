<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <header class="page-header">
    <div class="page-header__start">
      <slot name="before" />
      <h1 class="page-header__title">{{ title }}</h1>
    </div>
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.page-header__start {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.page-header__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.page-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 767px) {
  .page-header__title {
    font-size: 20px;
  }
}
</style>
