<script setup lang="ts">
import { cn } from '@/utils/cn';
import { FileIcon } from 'lucide-vue-next';
import type { HTMLAttributes } from 'vue';
import { appButtonVariants, type AppButtonVariants } from './AppButtonVariants';

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class'];
    variant?: AppButtonVariants['variant'];
    size?: AppButtonVariants['size'];
    accept?: string;
  }>(),
  {},
);
</script>

<template>
  <label
    :class="
      cn(
        appButtonVariants({ variant: props.variant, size: props.size }),
        'overflow-hidden relative cursor-pointer',
        props.class,
      )
    "
  >
    <FileIcon />
    <input type="file" class="absolute inset-0 hidden" :accept="props.accept" />
  </label>
</template>
