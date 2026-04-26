import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { Result } from '@zxing/library';
import { ModalComponent } from '../modal/modal.component';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-barcode-scanner-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, IconComponent],
  templateUrl: './barcode-scanner-modal.component.html',
  styleUrls: ['./barcode-scanner-modal.component.scss']
})
export class BarcodeScannerModalComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Output() scanned = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  @ViewChild('videoEl') videoEl?: ElementRef<HTMLVideoElement>;

  private reader: BrowserMultiFormatReader | null = null;
  private controls: IScannerControls | null = null;
  private hasEmitted = false;

  devices: MediaDeviceInfo[] = [];
  currentDeviceId: string | null = null;
  errorMessage: string | null = null;
  isStarting = false;

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.start();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        setTimeout(() => this.start(), 0);
      } else {
        this.stop();
      }
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  async start(): Promise<void> {
    if (!this.videoEl) return;
    if (this.isStarting) return;

    this.errorMessage = null;
    this.hasEmitted = false;

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      this.errorMessage = 'Camera requires HTTPS. Please open this page over a secure connection.';
      return;
    }

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.errorMessage = 'Camera is not supported on this browser.';
      return;
    }

    this.isStarting = true;
    try {
      this.reader = new BrowserMultiFormatReader();

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      this.devices = devices;

      if (devices.length === 0) {
        this.errorMessage = 'No camera found on this device.';
        return;
      }

      const rear = devices.find(d => /back|rear|environment/i.test(d.label));
      this.currentDeviceId = (rear || devices[devices.length - 1]).deviceId;

      await this.startDecoding(this.currentDeviceId);
    } catch (err: any) {
      console.error('Barcode scanner error:', err);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        this.errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (err?.name === 'NotFoundError') {
        this.errorMessage = 'No camera found on this device.';
      } else {
        this.errorMessage = 'Unable to start the camera. Please try again.';
      }
    } finally {
      this.isStarting = false;
    }
  }

  private async startDecoding(deviceId: string): Promise<void> {
    if (!this.reader || !this.videoEl) return;
    this.controls?.stop();
    this.controls = await this.reader.decodeFromVideoDevice(
      deviceId,
      this.videoEl.nativeElement,
      (result: Result | undefined) => {
        if (!result || this.hasEmitted) return;
        this.hasEmitted = true;
        const text = result.getText();
        this.stop();
        this.scanned.emit(text);
      }
    );
  }

  async switchCamera(): Promise<void> {
    if (this.devices.length < 2 || !this.currentDeviceId) return;
    const idx = this.devices.findIndex(d => d.deviceId === this.currentDeviceId);
    const next = this.devices[(idx + 1) % this.devices.length];
    this.currentDeviceId = next.deviceId;
    try {
      await this.startDecoding(next.deviceId);
    } catch (err) {
      console.error('Switch camera failed:', err);
    }
  }

  retry(): void {
    this.stop();
    setTimeout(() => this.start(), 0);
  }

  stop(): void {
    try {
      this.controls?.stop();
    } catch {}
    this.controls = null;

    const video = this.videoEl?.nativeElement;
    const stream = video?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      video!.srcObject = null;
    }

    this.reader = null;
  }

  onClose(): void {
    this.stop();
    this.close.emit();
  }
}
