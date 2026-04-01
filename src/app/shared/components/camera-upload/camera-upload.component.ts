import { Component, EventEmitter, Input, Output, ViewChild, ElementRef, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-camera-upload',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './camera-upload.component.html',
  styleUrls: ['./camera-upload.component.scss']
})
export class CameraUploadComponent implements OnDestroy, AfterViewInit {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  @Input() disabled = false;
  @Output() imageCaptured = new EventEmitter<File>();
  @Output() removed = new EventEmitter<void>();

  isStreaming = false;
  hasError = false;
  errorMessage = '';
  capturedImageFile: File | null = null;
  capturedImagePreview: string | null = null;
  private stream: MediaStream | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngAfterViewInit(): void {
    // ViewChild elements are now available
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    if (this.disabled) return;

    try {
      this.hasError = false;
      this.errorMessage = '';

      // Request camera access with 1:1 aspect ratio
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          aspectRatio: 1.0,
          width: { ideal: 1080 },
          height: { ideal: 1080 }
        }
      });

      // Set isStreaming to true first so the video element is rendered
      this.isStreaming = true;
      this.cdr.detectChanges();

      // Wait for the view to update and video element to be available
      setTimeout(() => {
        if (this.videoElement?.nativeElement) {
          const video = this.videoElement.nativeElement;
          video.srcObject = this.stream;
          
          console.log('Video element found, setting srcObject');
          
          // Wait for video metadata to load
          video.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded, dimensions:', video.videoWidth, 'x', video.videoHeight);
            video.play().then(() => {
              console.log('Video playing successfully');
            }).catch((error) => {
              console.error('Error playing video:', error);
              this.hasError = true;
              this.errorMessage = 'Failed to start video stream';
              this.isStreaming = false;
            });
          }, { once: true });
        } else {
          console.error('Video element still not found after view update');
          this.hasError = true;
          this.errorMessage = 'Failed to initialize video element';
          this.isStreaming = false;
        }
      }, 100);
    } catch (error: any) {
      this.hasError = true;
      this.errorMessage = error.message || 'Failed to access camera. Please check permissions.';
      console.error('Camera access error:', error);
    }
  }

  captureImage(): void {
    console.log('Capture button clicked');
    console.log('isStreaming:', this.isStreaming);
    console.log('videoElement:', this.videoElement);
    console.log('canvasElement:', this.canvasElement);

    if (!this.isStreaming) {
      console.error('Camera is not streaming');
      alert('Camera is not streaming. Please wait for the camera to start.');
      return;
    }

    if (!this.videoElement?.nativeElement) {
      console.error('Video element not found');
      alert('Video element not found');
      return;
    }

    if (!this.canvasElement?.nativeElement) {
      console.error('Canvas element not found');
      alert('Canvas element not found');
      return;
    }

    const video = this.videoElement.nativeElement;
    console.log('Video readyState:', video.readyState);
    console.log('Video dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    // Wait for video to be ready
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready, waiting for metadata. readyState:', video.readyState, 'dimensions:', video.videoWidth, video.videoHeight);
      const handleLoadedMetadata = () => {
        console.log('Metadata loaded, performing capture');
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        setTimeout(() => this.performCapture(), 100); // Small delay to ensure video is ready
      };
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      return;
    }

    console.log('Performing capture immediately');
    this.performCapture();
  }

  private performCapture(): void {
    console.log('performCapture called');
    
    if (!this.videoElement?.nativeElement || !this.canvasElement?.nativeElement) {
      console.error('Elements not available in performCapture');
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Could not get canvas context');
      return;
    }

    // Get video dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    console.log('Video dimensions for capture:', videoWidth, 'x', videoHeight);

    if (videoWidth === 0 || videoHeight === 0) {
      console.error('Video dimensions are zero:', videoWidth, videoHeight);
      alert('Video dimensions are zero. Please try again.');
      return;
    }

    // Calculate 1:1 crop dimensions
    const size = Math.min(videoWidth, videoHeight);
    const offsetX = (videoWidth - size) / 2;
    const offsetY = (videoHeight - size) / 2;

    // Set canvas to 1:1 ratio
    canvas.width = size;
    canvas.height = size;

    // Flip the canvas horizontally to match the mirrored preview
    context.translate(size, 0);
    context.scale(-1, 1);

    // Draw video frame to canvas with 1:1 crop
    context.drawImage(
      video,
      offsetX, offsetY, size, size,
      0, 0, size, size
    );

    // Reset the transformation
    context.setTransform(1, 0, 0, 1, 0, 0);

    // Convert canvas to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    
    // Convert base64 to File object
    const byteString = atob(imageData.split(',')[1]);
    const mimeString = imageData.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    this.capturedImageFile = new File([blob], 'captured-image.jpg', { type: mimeString });
    
    // Store preview for display
    this.capturedImagePreview = imageData;
    
    console.log('Image captured successfully, file size:', this.capturedImageFile.size);
    
    // Stop camera after capture
    this.stopCamera();

    // Emit the captured image
    console.log('Emitting imageCaptured event');
    this.imageCaptured.emit(this.capturedImageFile);
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

