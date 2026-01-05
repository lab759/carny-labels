<script setup lang="ts">
import { Canvas, Textbox } from 'fabric';
import { markRaw, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';
import Toolbar from './Toolbar.vue';
import ToolPanel from './ToolPanel.vue';

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvasRef');
const fabricCanvas = ref<Canvas | null>(null);

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

const emit = defineEmits<{
  (e: 'update:imageData', data: ImageDataArray | undefined): void;
}>();

function emitCurrentImageData() {
  if (!fabricCanvas.value) return;
  const editorContext = fabricCanvas.value.toCanvasElement().getContext('2d');
  const imageData = editorContext?.getImageData(0, 0, props.width, props.height).data;
  emit('update:imageData', imageData);
}

onMounted(() => {
  const canvasElement = canvasRef.value;
  if (canvasElement) {
    /** https://github.com/fabricjs/fabric.js/issues/6680#issuecomment-2109881660 */
    fabricCanvas.value = markRaw(
      new Canvas(canvasElement, {
        width: props.width,
        height: props.height,
      }),
    );

    fabricCanvas.value.on('object:modified', () => {
      emitCurrentImageData();
    });
    fabricCanvas.value.on('object:added', () => {
      emitCurrentImageData();
    });

    const helloWorld = new Textbox('Hello world!', {
      left: fabricCanvas.value.getWidth() / 2,
      top: fabricCanvas.value.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      width: 230,
      textAlign: 'center',

      // evented: false,
      // selectable: false,

      // hasControls: false,
      // hasBorders: false,
      // lockMovementX: true,
      // lockMovementY: true,
      // hoverCursor: 'default',
    });
    fabricCanvas.value.add(helloWorld);
    fabricCanvas.value.renderAll();
    const test = fabricCanvas.value.getContext();
  }
});

onUnmounted(() => {
  fabricCanvas.value?.dispose();
  fabricCanvas.value = null;
});

defineExpose({
  canvas: canvasRef,
  fabricCanvas,
});
</script>

<template>
  <div>
    <div
      class="border-0 outline-0"
      tabindex="0"
      @keydown.delete="
        () => {
          const activeObject = fabricCanvas?.getActiveObject();
          if (activeObject) {
            fabricCanvas?.remove(activeObject);
            fabricCanvas?.renderAll();
            emitCurrentImageData();
          }
        }
      "
    >
      <canvas ref="canvasRef" class="border border-dotted w-150"></canvas>
    </div>
    <Toolbar v-if="fabricCanvas" class="mt-2" :canvas="fabricCanvas as Canvas" />
    <ToolPanel v-if="fabricCanvas" class="mt-2" :canvas="fabricCanvas as Canvas" />
  </div>
</template>

<style>
/* .canvas-container {
  transform: scale(2);
  transform-origin: top left;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
} */
</style>
