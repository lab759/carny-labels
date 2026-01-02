import { ref } from 'vue';

export type WebSerialConfig = {
  port: SerialPort;
};

export function useWebSerial(callback: (data: Uint8Array<ArrayBufferLike>) => void) {
  let port: SerialPort | null = null;
  let outputStream: WritableStream<Uint8Array> | null = null;
  let rawReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

  const encoder = new TextEncoder();

  const connected = ref(false);
  const isSupported = ref(false);

  if ('serial' in navigator) {
    isSupported.value = true;
    navigator.serial.addEventListener('disconnect', (e) => {
      if (e.target === port) {
        connected.value = false;
        void close();
      }
    });
  }

  return { open, close, getPorts, writeToStream, write, connected, isSupported };

  async function open(config?: WebSerialConfig): Promise<boolean> {
    const autoConnectPort = config?.port;
    if (!isSupported.value) return false;
    if (connected.value) return true;
    try {
      port = autoConnectPort ?? (await navigator.serial.requestPort());
    } catch (e) {
      console.error('Web Serial port request error:', e);
      throw e;
    }

    await port.open({
      baudRate: 115200,
    });

    if (!port.writable) return false;
    outputStream = port.writable;

    if (!port.readable) return false;
    rawReader = port.readable.getReader();
    connected.value = true;
    void readLoop();
    return true;
  }

  async function close() {
    await rawReader?.cancel();
    rawReader = null;

    await outputStream?.getWriter().close();
    outputStream = null;

    await port?.close();
    port = null;

    connected.value = false;
  }

  async function writeToStream(...lines: Array<string>) {
    const writer = outputStream?.getWriter();
    if (!writer) return;
    for (const line of lines) {
      await writer.write(encoder.encode(line));
    }
    writer.releaseLock();
  }

  async function write(data: Uint8Array<ArrayBufferLike>) {
    const writer = outputStream?.getWriter();
    if (!writer) return;
    await writer.write(data);
    writer.releaseLock();
  }

  async function readLoop() {
    try {
      while (rawReader) {
        const { value, done } = await rawReader.read();
        if (value) {
          callback(value);
        }
        if (done) {
          break;
        }
      }
    } catch (error) {
      console.error('Read loop error:', error);
    } finally {
      rawReader?.releaseLock();
    }
  }

  async function getPorts(): Promise<SerialPort[]> {
    if (!isSupported.value) return [];
    return await navigator.serial.getPorts();
  }
}
