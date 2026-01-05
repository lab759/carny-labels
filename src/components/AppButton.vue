<script setup lang="ts">
import { cn } from '@/utils/cn';
import type { HTMLAttributes } from 'vue';
import { appButtonVariants, type AppButtonVariants } from './AppButtonVariants';

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    variant?: AppButtonVariants['variant'];
    size?: AppButtonVariants['size'];
    type?: HTMLButtonElement['type'];
  }>(),
  {
    type: 'button',
  },
);
</script>

<template>
  <button
    :class="cn(appButtonVariants({ variant: props.variant, size: props.size }), props.class)"
    :type="props.type"
  >
    <slot></slot>
  </button>
</template>
