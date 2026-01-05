// Adapted from https://github.com/ticky/canvas-dither

export function convertToGreyscaleByLuminance(data: ImageDataArray) {
  for (var i = 0; i <= data.length; i += 4) {
    data[i] =
      data[i + 1] =
      data[i + 2] =
        Math.round((data[i] ?? 0) * 0.21 + (data[i + 1] ?? 0) * 0.71 + (data[i + 2] ?? 0) * 0.07);
  }
  return data;
}

export function ditherWithAtkinson(
  data: ImageDataArray,
  imageWidth: number,
  drawColour: boolean,
): ImageDataArray {
  let skipPixels = 4;

  if (!drawColour) drawColour = false;

  if (drawColour == true) skipPixels = 1;

  let imageLength = data.length;

  for (let currentPixel = 0; currentPixel <= imageLength; currentPixel += skipPixels) {
    let newPixelColour = 0;
    if ((data[currentPixel] ?? 0) <= 128) {
      newPixelColour = 0;
    } else {
      newPixelColour = 255;
    }

    let err = Math.round(((data[currentPixel] ?? 0) - newPixelColour) / 8);
    data[currentPixel] = newPixelColour;

    data[currentPixel + 4] = (data[currentPixel + 4] ?? 0) + err;
    data[currentPixel + 8] = (data[currentPixel + 8] ?? 0) + err;
    data[currentPixel + 4 * imageWidth - 4] = (data[currentPixel + 4 * imageWidth - 4] ?? 0) + err;
    data[currentPixel + 4 * imageWidth] = (data[currentPixel + 4 * imageWidth] ?? 0) + err;
    data[currentPixel + 4 * imageWidth + 4] = (data[currentPixel + 4 * imageWidth + 4] ?? 0) + err;
    data[currentPixel + 8 * imageWidth] = (data[currentPixel + 8 * imageWidth] ?? 0) + err;

    if (drawColour == false) {
      data[currentPixel + 1] = data[currentPixel + 2] = data[currentPixel] ?? 0;
    }
  }

  return data;
}
