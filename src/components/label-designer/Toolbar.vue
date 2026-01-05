<script setup lang="ts">
import { Circle, loadSVGFromString, Polyline, Rect, Textbox, util, type Canvas } from 'fabric';
import { CircleIcon, MinusIcon, RectangleHorizontalIcon, TypeIcon } from 'lucide-vue-next';
import AppButton from '../AppButton.vue';
import SelectFileButton from '../SelectFileButton.vue';

const props = defineProps<{
  canvas: Canvas;
}>();

async function loadSvgData(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input?.files?.[0];
  if (!file) return;
  const svgString = await file.text();
  let loadedSVG = await loadSVGFromString(svgString);
  const svgObjects = loadedSVG.objects.filter((o) => o != null);
  let svgObjectGroup = util.groupSVGElements(svgObjects, loadedSVG.options);

  svgObjectGroup.set({
    originX: 'center',
    originY: 'center',
    visible: true,
    selectable: true,
  });
  if (svgObjectGroup.getScaledWidth() > props.canvas.getWidth()) {
    svgObjectGroup.scaleToWidth(props.canvas.getWidth());
  }
  if (svgObjectGroup.getScaledHeight() > props.canvas.getHeight()) {
    svgObjectGroup.scaleToHeight(props.canvas.getHeight());
  }

  props.canvas?.add(svgObjectGroup);

  props.canvas?.centerObject(svgObjectGroup);
  props.canvas?.renderAll();

  input.value = '';
}
</script>

<template>
  <div class="flex gap-2">
    <AppButton
      size="icon"
      variant="secondary"
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
      ><TypeIcon
    /></AppButton>
    <AppButton
      size="icon"
      variant="secondary"
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
    >
      <RectangleHorizontalIcon />
    </AppButton>
    <AppButton
      size="icon"
      variant="secondary"
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
      ><MinusIcon
    /></AppButton>
    <AppButton
      size="icon"
      variant="secondary"
      @click="
        () => {
          const line = new Circle({
            stroke: 'black',
            strokeWidth: 2,
            radius: 20,
            left: 20,
            top: 20,
          });
          props.canvas?.add(line);
          props.canvas?.renderAll();
        }
      "
      ><CircleIcon
    /></AppButton>
    <SelectFileButton size="icon" variant="secondary" @input="loadSvgData" accept=".svg" />
  </div>
</template>
