import {
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SliderModule } from 'primeng/slider';
import { postReq, apiUrl } from '../../../utils/httpUtils';
import { ImageCropperService } from '../../../services/image-cropper.service';

const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CONTAINER_SIZE = 200;
const OUTPUT_SIZE = 300;

@Component({
  selector: 'profile-picture-dialog',
  imports: [
    CommonModule,
    ButtonModule,
    MessageModule,
    SliderModule,
    FormsModule
  ],
  templateUrl: './profile-picture-dialog.component.html',
  styleUrl: './profile-picture-dialog.component.scss'
})
export class ProfilePictureDialogComponent {
  private _dialogRef = inject(DynamicDialogRef);
  private _imageCropper = inject(ImageCropperService);

  public cropImageRef = viewChild<ElementRef<HTMLImageElement>>('cropImage');

  private _dragStartX = signal(0);
  private _dragStartY = signal(0);
  private _initialPosX = signal(0);
  private _initialPosY = signal(0);

  public selectedFile = signal<File | null>(null);
  public previewUrl = signal<string | null>(null);
  public isDraggingFile = signal(false);
  public isUploading = signal(false);
  public error = signal<string | null>(null);
  public imageLoaded = signal(false);
  public zoom = signal(1);
  public positionX = signal(0);
  public positionY = signal(0);
  public isDraggingImage = signal(false);
  public naturalWidth = signal(0);
  public naturalHeight = signal(0);

  public baseDisplaySize = computed(() =>
    this._imageCropper.getBaseDisplaySize(
      this.naturalWidth(),
      this.naturalHeight(),
      CONTAINER_SIZE
    )
  );

  public imageStyle = computed(() => {
    const { width, height } = this.baseDisplaySize();

    if (!width || !height) return {};

    return { width: `${width}px`, height: `${height}px` };
  });

  public imageTransform = computed(() => {
    const { width, height } = this.baseDisplaySize();

    const centerX = -width / 2 + this.positionX();
    const centerY = -height / 2 + this.positionY();

    return `translate(${centerX}px, ${centerY}px) scale(${this.zoom()})`;
  });

  public onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  public onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDraggingFile.set(true);
  }

  public onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDraggingFile.set(false);
  }

  public onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDraggingFile.set(false);

    const files = event.dataTransfer?.files;

    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  public onImageLoad(event: Event): void {
    const img = event.target as HTMLImageElement;

    this.naturalWidth.set(img.naturalWidth);
    this.naturalHeight.set(img.naturalHeight);
    this.imageLoaded.set(true);
    this.positionX.set(0);
    this.positionY.set(0);
  }

  public onImageDragStart(event: MouseEvent | TouchEvent): void {
    event.preventDefault();

    this.isDraggingImage.set(true);

    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this._dragStartX.set(clientX);
    this._dragStartY.set(clientY);
    this._initialPosX.set(this.positionX());
    this._initialPosY.set(this.positionY());
  }

  public onImageDrag(event: MouseEvent | TouchEvent): void {
    if (!this.isDraggingImage()) return;

    const clientX =
      event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const clientY =
      event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;

    this.positionX.set(this._initialPosX() + (clientX - this._dragStartX()));
    this.positionY.set(this._initialPosY() + (clientY - this._dragStartY()));
  }

  public onImageDragEnd(): void {
    this.isDraggingImage.set(false);
  }

  public zoomIn(): void {
    this.zoom.set(Math.min(this.zoom() + 0.1, 3));
  }

  public zoomOut(): void {
    this.zoom.set(Math.max(this.zoom() - 0.1, 0.5));
  }

  public clearSelection(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.error.set(null);

    this.resetCropState();
  }

  public async upload(): Promise<void> {
    const file = this.selectedFile();

    if (!file || !this.previewUrl()) return;

    this.isUploading.set(true);
    this.error.set(null);

    try {
      const croppedBlob = await this.generateCroppedImage();

      if (!croppedBlob) throw new Error('Failed to crop image');

      const croppedFile = new File([croppedBlob], file.name, {
        type: 'image/png'
      });

      const formData = new FormData();
      formData.append('file', croppedFile);

      postReq<{ picture: string }>(
        apiUrl('users/profile-picture'),
        formData
      ).subscribe({
        next: (response) => {
          this.isUploading.set(false);
          this._dialogRef.close(response.picture);
        },
        error: (err) => {
          console.error('Error uploading profile picture:', err);

          this.isUploading.set(false);
          this.error.set('Failed to upload profile picture. Please try again.');
        }
      });
    } catch {
      this.isUploading.set(false);
      this.error.set('Failed to process image. Please try again.');
    }
  }

  public cancel(): void {
    this._dialogRef.close(null);
  }

  private handleFile(file: File): void {
    this.error.set(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      return this.error.set(
        'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return this.error.set('File size must be less than 5MB');
    }

    this.selectedFile.set(file);
    this.resetCropState();

    const reader = new FileReader();

    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  private resetCropState(): void {
    this.zoom.set(1);
    this.positionX.set(0);
    this.positionY.set(0);
    this.imageLoaded.set(false);
  }

  private generateCroppedImage(): Promise<Blob | null> {
    const img = this.cropImageRef()?.nativeElement;

    if (!img) return Promise.resolve(null);

    return this._imageCropper.generateCroppedImage(img, {
      naturalWidth: this.naturalWidth(),
      naturalHeight: this.naturalHeight(),
      containerSize: CONTAINER_SIZE,
      zoom: this.zoom(),
      offsetX: this.positionX(),
      offsetY: this.positionY(),
      outputSize: OUTPUT_SIZE
    });
  }
}
