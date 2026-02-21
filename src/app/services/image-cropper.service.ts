import { Injectable } from '@angular/core';

export type CropShape = 'circle' | 'square';

export interface CropConfig {
  naturalWidth: number;
  naturalHeight: number;
  containerSize: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  outputSize: number;
  shape?: CropShape;
}

export interface DisplayDimensions {
  width: number;
  height: number;
}

@Injectable({ providedIn: 'root' })
export class ImageCropperService {
  /**
   * Calculate base display dimensions to fill container (object-fit: cover behavior)
   */
  getBaseDisplaySize(
    naturalWidth: number,
    naturalHeight: number,
    containerSize: number
  ): DisplayDimensions {
    if (!naturalWidth || !naturalHeight) {
      return { width: 0, height: 0 };
    }

    const aspectRatio = naturalWidth / naturalHeight;

    if (aspectRatio >= 1) {
      return {
        width: containerSize * aspectRatio,
        height: containerSize
      };
    } else {
      return {
        width: containerSize,
        height: containerSize / aspectRatio
      };
    }
  }

  /**
   * Generate a cropped image from the source with configurable shape
   */
  generateCroppedImage(
    sourceImage: HTMLImageElement,
    config: CropConfig
  ): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!sourceImage) {
        resolve(null);

        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(null);

        return;
      }

      canvas.width = config.outputSize;
      canvas.height = config.outputSize;

      const { width: baseWidth, height: baseHeight } = this.getBaseDisplaySize(
        config.naturalWidth,
        config.naturalHeight,
        config.containerSize
      );

      const displayWidth = baseWidth * config.zoom;
      const displayHeight = baseHeight * config.zoom;
      const sourceScaleX = config.naturalWidth / displayWidth;
      const sourceScaleY = config.naturalHeight / displayHeight;

      const sourceWidth = config.containerSize * sourceScaleX;
      const sourceHeight = config.containerSize * sourceScaleY;

      const sourceCenterX =
        config.naturalWidth / 2 - config.offsetX * sourceScaleX;
      const sourceCenterY =
        config.naturalHeight / 2 - config.offsetY * sourceScaleY;

      const sourceX = sourceCenterX - sourceWidth / 2;
      const sourceY = sourceCenterY - sourceHeight / 2;

      const shape = config.shape ?? 'circle';

      if (shape === 'circle') {
        ctx.beginPath();
        ctx.arc(
          config.outputSize / 2,
          config.outputSize / 2,
          config.outputSize / 2,
          0,
          Math.PI * 2
        );
        ctx.closePath();
        ctx.clip();
      }

      ctx.drawImage(
        sourceImage,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        config.outputSize,
        config.outputSize
      );

      canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
    });
  }
}
