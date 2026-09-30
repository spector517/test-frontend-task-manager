<script setup lang="ts">
import { PRIORITY_LABELS } from '../config/labels'
import type { TaskPriority } from '../model/types'

defineProps<{ priority: TaskPriority }>()
</script>

<template>
  <el-tag :class="['task-tag', `task-tag--priority-${priority}`]" disable-transitions>
    {{ PRIORITY_LABELS[priority] }}
  </el-tag>
</template>
