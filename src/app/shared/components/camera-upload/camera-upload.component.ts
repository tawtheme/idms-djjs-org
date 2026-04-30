import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCropperComponent, ImageCroppedEvent, LoadedImage, ImageTransform } from 'ngx-image-cropper';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-camera-upload',
  standalone: true,
  imports: [CommonModule, IconComponent, ImageCropperComponent],
  templateUrl: './camera-upload.component.html',
  styleUrls: ['./camera-upload.component.scss']
})
export class CameraUploadComponent implements OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  @Input() disabled = false;
  /** Aspect ratio for the crop step. Default 1:1 (square). */
  @Input() aspectRatio = 1;
  @Output() imageCaptured = new EventEmitter<File>();
  @Output() removed = new EventEmitter<void>();

  isStreaming = false;
  hasError = false;
  errorMessage = '';

  // Crop step state
  isCropping = false;
  rawImageBase64 = '';
  croppedBlob: Blob | null = null;
  croppedPreview: string | null = null;
  imageTransform: ImageTransform = {};

  capturedImageFile: File | null = null;
  capturedImagePreview: string | null = null;
  private stream: MediaStream | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    if (this.disabled) return;

    try {
      this.hasError = false;
      this.errorMessage = '';

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          aspectRatio: this.aspectRatio,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        }
      });

      this.isStreaming = true;
      this.cdr.detectChanges();

      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.stream;

          video.addEventListener('loadedmetadata', () => {
            video.play().catch((error) => {
              this.hasError = true;
              this.errorMessage = 'Failed to start video stream';
              this.isStreaming = false;
              console.error('Error playing video:', error);
            });
          }, { once: true });
        } else {
          this.hasError = true;
          this.errorMessage = 'Failed to initialize video element';
          this.isStreaming = false;
        }
      }, 100);
    } catch (error: any) {
      this.hasError = true;
      this.errorMessage = error?.message || 'Failed to access camera. Please check permissions.';
      console.error('Camera access error:', error);
    }
  }

  /** Capture frame from video, then enter crop mode (don't emit yet). */
  captureImage(): void {
    if (!this.isStreaming || !this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      const handler = () => {
        video.removeEventListener('loadedmetadata', handler);
        setTimeout(() => this.performCapture(), 100);
      };
      video.addEventListener('loadedmetadata', handler);
      return;
    }
    this.performCapture();
  }

  private performCapture(): void {
    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    if (!context) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;

    canvas.width = w;
    canvas.height = h;

    // Mirror to match the preview the user saw
    context.translate(w, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, w, h);
    context.setTransform(1, 0, 0, 1, 0, 0);

    this.rawImageBase64 = canvas.toDataURL('image/jpeg', 0.92);
    this.stopCamera();
    this.isCropping = true;
    this.croppedBlob = null;
    this.croppedPreview = null;
    this.imageTransform = {};
  }

  onCropped(event: ImageCroppedEvent): void {
    this.croppedBlob = event.blob ?? null;
    this.croppedPreview = (event as any).objectUrl ?? event.base64 ?? null;
  }

  onCropperLoaded(_e?: LoadedImage): void {}

  onCropperFailed(): void {
    this.hasError = true;
    this.errorMessage = 'Failed to load image for cropping.';
    this.isCropping = false;
  }

  rotateLeft(): void {
    this.imageTransform = { ...this.imageTransform, rotate: ((this.imageTransform.rotate ?? 0) - 90) % 360 };
  }

  rotateRight(): void {
    this.imageTransform = { ...this.imageTransform, rotate: ((this.imageTransform.rotate ?? 0) + 90) % 360 };
  }

  retake(): void {
    this.isCropping = false;
    this.rawImageBase64 = '';
    this.croppedBlob = null;
    this.croppedPreview = null;
    this.startCamera();
  }

  confirmCrop(): void {
    if (!this.croppedBlob) return;
    const file = new File([this.croppedBlob], 'captured-image.jpg', { type: this.croppedBlob.type || 'image/jpeg' });
    this.capturedImageFile = file;
    this.capturedImagePreview = this.croppedPreview;
    this.isCropping = false;
    this.imageCaptured.emit(file);
  }

  removeFile(): void {
    this.capturedImageFile = null;
    this.capturedImagePreview = null;
    this.removed.emit();
  }

  cancelCapture(): void {
    this.stopCamera();
    this.hasError = false;
    this.errorMessage = '';
  }

  retryCamera(): void {
    this.startCamera();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.isStreaming = false;
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
  }
}
