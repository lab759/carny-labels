<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');

const props = withDefaults(
  defineProps<{
    width?: number;
    height?: number;
  }>(),
  {
    width: 284,
    height: 96,
  },
);

onMounted(() => {
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.imageSmoothingEnabled = false;
      // Draw a simple label design
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#000000';
      ctx.font = '26px Arial';
      ctx.fillText('Product Name', 14, 36);
      ctx.font = '16px Arial';
      ctx.fillText('Price: $9.99', 14, 60);

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;

      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      ctx.fillStyle = '#000000';
      ctx.fillRect(200, 10, 30, canvas.height - 20);
    }
  }
});

defineExpose({
  canvas: canvasRef,
});
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="props.width"
    :height="props.height"
    class="border border-dotted"
  ></canvas>
</template>

<style scoped>
canvas {
  image-rendering: pixelated;
}
</style>
