<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import LabelDesigner from '@/components/label-designer/LabelDesigner.vue';
import LabelDrawing from '@/components/LabelDrawing.vue';
import PrinterStatusCard from '@/components/PrinterStatusCard.vue';
import { useWebSerial } from '@/composables/useWebSerial';
import { parsePrinterStatus, type PrinterStatus } from '@/core/PrinterStatus';
import { BluetoothIcon, OctagonAlertIcon } from 'lucide-vue-next';
import { onUnmounted, ref, useTemplateRef } from 'vue';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();
const waitingForPrinterInfoResponse = ref(false);

const printerStatus = ref<PrinterStatus | null>(null);

const editorRef = useTemplateRef('editorRef');
const drawAreaRef = useTemplateRef('drawAreaRef');

const { open, connected, write, close, isSupported } = useWebSerial((data) => {
  console.log('IN', data);
  const msg = textDecoder.decode(data);

  if (msg.startsWith('CONFIG')) {
    console.log('DPI Resolution:', data[8]);
    console.log('Hardware Version', `${data[9]}.${data[10]}.${data[11]}`);
    console.log('Firmware Version', `${data[12]}.${data[13]}.${data[14]}`);
    console.log('Timeout', data[15]);
    console.log('Beep Setting', data[16]);
  }
  if (waitingForPrinterInfoResponse.value) {
    waitingForPrinterInfoResponse.value = false;
    printerStatus.value = parsePrinterStatus(data) ?? null;
    console.log('Printer Info Response:', msg, printerStatus.value);
  }
});

function handleConnect() {
  open();
}

async function handleTest() {
  if (connected.value) {
    await write(textEncoder.encode('CONFIG?\r\n'));
  }
}

async function getPrinterInfo() {
  if (connected.value) {
    waitingForPrinterInfoResponse.value = true;
    await write(textEncoder.encode('\x1b!o\r\n'));
  }
}

async function print() {
  const width = 96;
  const height = 284;
  const context = drawAreaRef.value?.canvas?.getContext('2d', { willReadFrequently: true });

  //  const editorContext = editorRef.value?.canvas?.getContext('2d', { willReadFrequently: true });
  const editorContext = editorRef.value?.fabricCanvas?.toCanvasElement().getContext('2d');

  if (!context || !editorContext) {
    throw new Error('No context data available');
  }

  const imageData = editorContext.getImageData(0, 0, height, width).data;
  const buffer = new Uint8Array((width * height) / 8);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x;
      const red = imageData[(x * height + height - y) * 4 + 0] ?? 0;
      const alpha = imageData[(x * height + height - y) * 4 + 3] ?? 0;
      const pixelOn = alpha > 0 && red < 200;
      context.putImageData(
        new ImageData(
          new Uint8ClampedArray([pixelOn ? 0 : 255, pixelOn ? 0 : 255, pixelOn ? 0 : 255, 255]),
          1,
          1,
        ),
        height - y,
        x,
      );
      const byteIndex = Math.floor(index / 8);
      const bitIndex = 7 - (index % 8);
      if (!pixelOn) {
        if (!buffer[byteIndex]) {
          buffer[byteIndex] = 0;
        }
        buffer[byteIndex] |= 1 << bitIndex;
      }
    }
  }
  console.log('PRINT BUFFER', buffer);
  const outBuffer = new Uint8Array([
    ...textEncoder.encode('\x1b!o\r\n'),
    ...textEncoder.encode('SIZE 14.0 mm,40.0 mm\r\n'),
    ...textEncoder.encode('GAP 5.0mm, 0 mm\r\n'),
    ...textEncoder.encode('DIRECTION 1,1\r\n'),
    ...textEncoder.encode('DENSITY 15\r\n'),
    ...textEncoder.encode('CLS\r\n'),
    ...textEncoder.encode('BITMAP 0,0,12,284,1,'),
    ...buffer,
    ...textEncoder.encode('\r\n'),
    ...textEncoder.encode('PRINT 1\r\n'),
  ]);
  await write(outBuffer);
}

function handleImageDataUpdate(data: ImageDataArray | undefined) {
  console.log('Received image data update:', data);
  const context = drawAreaRef.value?.canvas?.getContext('2d');
  if (!context || !data) return;
  for (let pixelIndex = 0; pixelIndex < data.length; pixelIndex += 4) {
    const red = data[pixelIndex + 0] ?? 0;
    const alpha = data[pixelIndex + 3] ?? 0;
    const pixelOn = alpha > 0 && red < 200;
    data[pixelIndex + 0] = pixelOn ? 0 : 255;
    data[pixelIndex + 1] = pixelOn ? 0 : 255;
    data[pixelIndex + 2] = pixelOn ? 0 : 255;
    data[pixelIndex + 3] = 255;
  }
  context?.putImageData(new ImageData(data, 284, 96), 0, 0);
}

function handleDisconnect() {
  close();
}

onUnmounted(() => {
  close();
});
</script>

<template>
  <main class="p-6 flex gap-5 justify-center">
    <div class="flex gap-3 flex-col">
      <div>
        <AppButton class="text-lg" type="button" @click="handleConnect" :disabled="!isSupported">
          Connect
          <div class="rounded-full bg-white text-brand ml-2 p-2 -mr-1">
            <BluetoothIcon :size="18" />
          </div>
        </AppButton>
      </div>
      <div v-if="connected">
        <AppButton type="button" @click="handleDisconnect">DISCONNECT</AppButton>
        <AppButton type="button" @click="handleTest">Get Device Info</AppButton>
        <AppButton type="button" @click="getPrinterInfo">Get Printer Info</AppButton>
        <AppButton type="button" @click="print">PRINT</AppButton>
        <PrinterStatusCard v-if="printerStatus" :printer-status="printerStatus" class="mt-4" />
      </div>
      <div v-if="!isSupported" class="max-w-35 border-red-500 bg-red-200 border rounded-lg p-4">
        <OctagonAlertIcon :size="24" class="text-red-600 mb-2" />
        Web Serial API is not supported in this browser.
      </div>
    </div>
    <div class="w-px bg-gray-300 shrink-0"></div>
    <div>
      <div class="mt-6"><LabelDrawing ref="drawAreaRef" /></div>
      <div class="mt-6">
        <LabelDesigner ref="editorRef" @update:imageData="handleImageDataUpdate" />
      </div>
    </div>
  </main>
</template>
