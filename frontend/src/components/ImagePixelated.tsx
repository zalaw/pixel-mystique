import { useRef, useEffect } from "react";

export type ImagePixelatedProps = {
  src: string;
  width?: number;
  height?: number;
  pixelSize?: number;
  centered?: boolean;
  gray?: boolean;
};

export const ImagePixelated = ({ src, width, height, pixelSize = 5, centered, gray = false }: ImagePixelatedProps) => {
  const canvasRef = useRef<any>();

  useEffect(() => {
    pixelate({
      src,
      width,
      height,
      pixelSize,
      centered,
      gray,
    });
  }, [src, width, height, pixelSize, centered, gray]);

  const pixelate = ({ src, width, height, pixelSize, centered, gray }: ImagePixelatedProps) => {
    let img: HTMLImageElement | undefined = new Image();

    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      const canvas: HTMLCanvasElement | undefined = canvasRef?.current;

      if (!canvas) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;

      img!.width = width ? width : img!.width;
      img!.height = height ? height : img!.height;
      canvas.width = img!.width;
      canvas.height = img!.height;

      ctx.drawImage(img!, 0, 0, img!.width, img!.height);
      paintPixels(ctx, img!, pixelSize, centered, gray);

      img = undefined;
    };
  };

  const paintPixels = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    pixelSize?: number,
    centered?: boolean,
    gray?: boolean
  ) => {
    if (pixelSize && !isNaN(pixelSize) && pixelSize > 0) {
      for (let x = 0; x < img.width + pixelSize; x += pixelSize) {
        for (let y = 0; y < img.height + pixelSize; y += pixelSize) {
          let xColorPick = x;
          let yColorPick = y;

          if (x >= img.width) {
            xColorPick = x - (pixelSize - (img.width % pixelSize) / 2) + 1;
          }
          if (y >= img.height) {
            yColorPick = y - (pixelSize - (img.height % pixelSize) / 2) + 1;
          }

          const rgba = ctx.getImageData(xColorPick, yColorPick, 1, 1).data;

          if (gray) {
            const avg = (rgba[0] + rgba[1] + rgba[2]) / 3;
            ctx.fillStyle = `rgba(${avg},${avg},${avg},${rgba[3]})`;
          } else {
            ctx.fillStyle = `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${rgba[3]})`;
          }

          if (centered) {
            ctx.fillRect(
              Math.floor(x - (pixelSize - (img.width % pixelSize) / 2)),
              Math.floor(y - (pixelSize - (img.height % pixelSize) / 2)),
              pixelSize,
              pixelSize
            );
          } else {
            ctx.fillRect(x, y, pixelSize, pixelSize);
          }
        }
      }
    }
  };

  return <canvas ref={canvasRef} />;
};
