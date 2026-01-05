<script setup lang="ts">
import { Canvas, FabricObject } from 'fabric';
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = defineProps<{
  canvas: Canvas;
}>();

const selectedObject = ref<FabricObject | null>(null);
const selectedObjectClone = ref<FabricObject | null>(null);

const left = computed({
  get: () => selectedObjectClone.value?.left ?? 0,
  set: (val: number) => {
    if (selectedObject.value) {
      selectedObject.value.left = val;
      selectedObject.value.setCoords();
      props.canvas.requestRenderAll();
    }
  },
});

const top = computed({
  get: () => selectedObjectClone.value?.top ?? 0,
  set: (val: number) => {
    if (selectedObject.value) {
      selectedObject.value.top = val;
      selectedObject.value.setCoords();
      props.canvas.requestRenderAll();
    }
  },
});

async function handleSelection(target?: FabricObject) {
  const selectedObjects = target ? [target] : props.canvas.getActiveObjects();
  selectedObjectClone.value = (await selectedObjects[0]?.clone()) ?? null;
  selectedObject.value = selectedObjects[0] ?? null;
  if (!selectedObject.value) {
    console.log('No object selected');
    return;
  }
  console.log('Selected object details:', {
    type: selectedObject.value.type,
    left: selectedObject.value.left,
    top: selectedObject.value.top,
    width: selectedObject.value.width,
    height: selectedObject.value.height,
    scaleX: selectedObject.value.scaleX,
    scaleY: selectedObject.value.scaleY,
    angle: selectedObject.value.angle,
  });
}

onMounted(() => {
  props.canvas.on('selection:updated', () => handleSelection());
  props.canvas.on('selection:created', () => handleSelection());
  props.canvas.on('selection:cleared', () => handleSelection());
  props.canvas.on('object:moving', (event) => handleSelection(event.target));
  props.canvas.on('object:modified', (event) => handleSelection(event.target));
  props.canvas.on('object:scaling', (event) => handleSelection(event.target));
});

onUnmounted(() => {
  //   props.canvas.off('selection:created', handleSelection);
  //   props.canvas.off('selection:updated', handleSelection);
  //   props.canvas.off('selection:cleared', handleSelection);
  //   props.canvas.off('object:modified', handleSelection);
  //   props.canvas.off('object:scaling', handleSelection);
});
</script>

<template>
  <div>
    <input type="text" v-model="left" />
    <input type="text" v-model="top" />
  </div>
</template>
