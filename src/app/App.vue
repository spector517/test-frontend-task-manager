<script setup lang="ts">
import { Tickets } from '@element-plus/icons-vue'
</script>

<template>
  <div class="app-layout">
    <header class="app-header">
      <RouterLink :to="{ name: 'task-list' }" class="app-header__brand">
        <el-icon :size="22" aria-hidden="true"><Tickets /></el-icon>
        <span>Менеджер задач</span>
      </RouterLink>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 24px;
  background: var(--app-header-bg);
  color: var(--app-header-text);
}

.app-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: inherit;
  text-decoration: none;
}

.app-header__brand:focus-visible {
  outline: 2px solid var(--app-header-text);
  outline-offset: 4px;
}

.app-main {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px;
}

@media (max-width: 767px) {
  .app-header {
    padding: 0 16px;
  }

  .app-main {
    padding: 16px 12px;
  }
}
</style>
