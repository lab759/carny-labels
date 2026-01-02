<script setup lang="ts">
import { Line, Polyline, Rect, Textbox, type Canvas } from 'fabric';
import AppButton from '../AppButton.vue';

const props = defineProps<{
  canvas: Canvas;
}>();
</script>

<template>
  <div class="flex gap-2">
    <AppButton
      @click="
        () => {
          const textBox = new Textbox('New Text', {
            left: 50,
            top: 50,
          });
          props.canvas?.add(textBox);
          props.canvas?.renderAll();
        }
      "
      >Add Text</AppButton
    >
    <AppButton
      @click="
        () => {
          const rect = new Rect({
            left: 70,
            top: 70,
            width: 50,
            height: 50,
            fill: 'black',
          });
          props.canvas?.add(rect);
          props.canvas?.renderAll();
        }
      "
      >Add Rectangle</AppButton
    >
    <AppButton
      @click="
        () => {
          const line = new Polyline(
            [
              { x: 10, y: 10 },
              { x: 50, y: 10 },
            ],
            {
              stroke: 'black',
              strokeWidth: 2,
            },
          );
          props.canvas?.add(line);
          props.canvas?.renderAll();
        }
      "
      >Add Line</AppButton
    >
  </div>
</template>
