<script setup lang="ts">
import { STATUS_LABELS } from '../config/labels'
import type { TaskStatus } from '../model/types'

defineProps<{ status: TaskStatus }>()
</script>

<template>
  <el-tag :class="['task-tag', `task-tag--status-${status}`]" disable-transitions>
    {{ STATUS_LABELS[status] }}
  </el-tag>
</template>
