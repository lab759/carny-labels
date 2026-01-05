<script setup lang="ts">
import AppButton from '@/components/AppButton.vue';
import LabelDesigner from '@/components/label-designer/LabelDesigner.vue';
import LabelDrawing from '@/components/LabelDrawing.vue';
import PrinterStatusCard from '@/components/PrinterStatusCard.vue';
import { useWebSerial } from '@/composables/useWebSerial';
import { parsePrinterStatus, type PrinterStatus } from '@/core/PrinterStatus';
import { convertToGreyscaleByLuminance, ditherWithAtkinson } from '@/utils/image';
import { BluetoothIcon, OctagonAlertIcon } from 'lucide-vue-next';
import { onUnmounted, ref, useTemplateRef } from 'vue';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();
const waitingForPrinterInfoResponse = ref(false);

const printerStatus = ref<PrinterStatus | null>(null);

const editorRef = useTemplateRef('editorRef');
const drawAreaRef = useTemplateRef('drawAreaRef');

const width = ref(240);
const height = ref(320);

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
  const printerOrientationWidth = height.value;
  const printerOrientationWidthInBytes = Math.ceil(height.value / 8);
  const printerOrientationHeight = width.value;
  const density = 10;
  /**
   * Spec:
   * - 0: Override,
   * - 1: OR,
   * - 2: XOR,
   * - 3: not in spec but used by PM220
   *
   * P21: 1
   * PM220: 3 (but 1 seems to work just fine)
   */
  const bitmapMode = 1;
  /**
   * P21: 1
   * PM220: 0
   */
  const mirror = 0; // 0 or 1
  /**
   * P21: 1
   * PM220: 0 (1 works too, does not really matter)
   */
  const direction = 1;
  /**
   *
   */
  // const labelWidth = '14.0 mm';
  // const labelHeight = '40.0 mm';
  const labelWidth = '40.0 mm';
  const labelHeight = '30.0 mm';

  // const gapWidth = '5.0 mm';
  const gapWidth = '6.0 mm';

  const context = drawAreaRef.value?.canvas?.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('No context data available');
  }

  const imageData = context.getImageData(
    0,
    0,
    printerOrientationHeight,
    printerOrientationWidth,
  ).data;
  const buffer = new Uint8Array((printerOrientationWidth * printerOrientationHeight) / 8);

  for (let y = 0; y < printerOrientationHeight; y++) {
    for (let x = 0; x < printerOrientationWidth; x++) {
      const index = y * printerOrientationWidth + x;
      const red =
        imageData[(x * printerOrientationHeight + printerOrientationHeight - y) * 4 + 0] ?? 0;
      const alpha =
        imageData[(x * printerOrientationHeight + printerOrientationHeight - y) * 4 + 3] ?? 0;
      const pixelOn = alpha > 0 && red < 200;
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

  /**
    PM220:
    SIZE 40.0 mm,30.0 mm
    GAP 6.0 mm,0 mm
     DIRECTION 0,0
     DENSITY 10
     CLS
     BITMAP 0,0,40,240,3,
   */
  console.log('PRINT BUFFER', buffer);
  const outBuffer = new Uint8Array([
    ...textEncoder.encode('\x1b!o\r\n'),
    ...textEncoder.encode(`SIZE ${labelWidth},${labelHeight}\r\n`),
    ...textEncoder.encode(`GAP ${gapWidth}, 0 mm\r\n`),
    ...textEncoder.encode(`DIRECTION ${direction},${mirror}\r\n`),
    ...textEncoder.encode(`DENSITY ${density}\r\n`),
    ...textEncoder.encode('CLS\r\n'),
    ...textEncoder.encode(
      `BITMAP 0,0,${printerOrientationWidthInBytes},${printerOrientationHeight},${bitmapMode},`,
    ),
    ...buffer,
    ...textEncoder.encode('\r\n'),
    ...textEncoder.encode('PRINT 1\r\n'),
  ]);
  await write(outBuffer);
}

function handleImageDataUpdate(data: ImageDataArray | undefined) {
  const context = drawAreaRef.value?.canvas?.getContext('2d');
  if (!context || !data) return;
  convertToGreyscaleByLuminance(data);
  const ditheredData = ditherWithAtkinson(data, width.value, false);
  context?.putImageData(new ImageData(ditheredData, width.value, height.value), 0, 0);
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
        <AppButton
          class="rounded-full h-11 pr-3 text-lg"
          variant="brand"
          type="button"
          @click="handleConnect"
          :disabled="!isSupported"
        >
          Connect
          <div class="rounded-full bg-white text-brand ml-2 p-2 -mr-1">
            <BluetoothIcon :size="18" />
          </div>
        </AppButton>
      </div>
      <div v-if="connected" class="flex flex-col gap-3">
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
      <div class="mt-6"><LabelDrawing :width="width" :height="height" ref="drawAreaRef" /></div>
      <div class="mt-6">
        <LabelDesigner
          :width="width"
          :height="height"
          ref="editorRef"
          @update:imageData="handleImageDataUpdate"
        />
      </div>
    </div>
  </main>
</template>
