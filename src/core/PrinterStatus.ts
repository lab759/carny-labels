export enum PrinterReadyStatus {
  READY = 'ready',
  LID_OPEN = 'lid_open',
  NO_PAPER = 'no_paper',
  BUSY = 'busy',
  UNKNOWN = 'unknown',
}

export enum LabelColor {
  TRANSPARENT = 'transparent',
  WHITE = 'white',
  PINK = 'pink',
  BLUE = 'blue',
  YELLOW = 'yellow',
  UNKNOWN = 'unknown',
}

export enum PaperType {
  CONTINUOUS = 'continuous',
  GAPPED = 'gapped',
  BLACK_MARK = 'black_mark',
  UNKNOWN = 'unknown',
}

export type PrinterStatus = {
  printerStatus: PrinterReadyStatus;
  dataLength: number;
  dataUnknown: number; // PM220: 1   (all 40x30 labels)
  dataUnknown2: number; // PM220: 34
  labelColor: LabelColor;
  /** Maybe Padding */
  borderRadius: number;
  dataUnknown3: number; // PM220: 3
  paperType: PaperType;
  dataUnknown4: number; // PM220: 6 /** Maybe GAP? */
  dataUnknown5: number; // PM220: 18
  dataUnknown6: number; // PM220: 21
  labelLength: number;
  maximunLabelWidth: number;
  labelWidth: number;
  dataUnknown7: number; // PM220: 45
};

function getPrinterStatusFromByte(byte: number): PrinterReadyStatus {
  switch (byte) {
    case 0:
      return PrinterReadyStatus.READY;
    case 1:
      return PrinterReadyStatus.LID_OPEN;
    case 4:
      return PrinterReadyStatus.NO_PAPER;
    case 32:
      return PrinterReadyStatus.BUSY;
    default:
      return PrinterReadyStatus.UNKNOWN;
  }
}

function getLabelColorFromByte(byte: number): LabelColor {
  switch (byte) {
    case 2:
      return LabelColor.TRANSPARENT;
    case 3:
      return LabelColor.WHITE;
    case 4:
      return LabelColor.PINK;
    case 5:
      return LabelColor.BLUE;
    case 6:
      return LabelColor.YELLOW;
    default:
      return LabelColor.UNKNOWN;
  }
}

function getPaperTypeFromByte(byte: number): PaperType {
  switch (byte) {
    case 0:
      return PaperType.CONTINUOUS;
    case 1:
      return PaperType.GAPPED;
    case 2:
      return PaperType.BLACK_MARK;
    default:
      return PaperType.UNKNOWN;
  }
}

export function parsePrinterStatus(data: Uint8Array): PrinterStatus | null {
  if (data.length < 15) {
    return null;
  }

  return {
    printerStatus: getPrinterStatusFromByte(data[0] ?? 0),
    dataLength: data[1] ?? 0,
    dataUnknown: data[2] ?? 0,
    dataUnknown2: data[3] ?? 0,
    labelColor: getLabelColorFromByte(data[4] ?? 0),
    borderRadius: data[5] ?? 0,
    dataUnknown3: data[6] ?? 0,
    paperType: getPaperTypeFromByte(data[7] ?? 0),
    dataUnknown4: data[8] ?? 0,
    dataUnknown5: data[9] ?? 0,
    dataUnknown6: data[10] ?? 0,
    labelLength: data[11] ?? 0,
    maximunLabelWidth: data[12] ?? 0,
    labelWidth: data[13] ?? 0,
    dataUnknown7: data[14] ?? 0,
  };
}
