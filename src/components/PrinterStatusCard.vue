<script setup lang="ts">
import type { PrinterStatus } from '@/core/PrinterStatus';

defineProps<{
  printerStatus: PrinterStatus;
}>();
</script>

<template>
  <ul>
    <li>Color: {{ printerStatus.labelColor }}</li>
    <li>Label Length: {{ printerStatus.labelLength }} mm</li>
    <li>Label Width: {{ printerStatus.labelWidth }} mm</li>
    <li>Paper Type: {{ printerStatus.paperType }}</li>
  </ul>
</template>
