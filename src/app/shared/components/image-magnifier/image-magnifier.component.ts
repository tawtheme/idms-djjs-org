import { Component, Input, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-image-magnifier',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './image-magnifier.component.html',
  styleUrls: ['./image-magnifier.component.scss']
})
export class ImageMagnifierComponent {
  @Input() src: string | null = null;
  @Input() zoom: number = 2; // magnification factor
  @Input() lensRadius: number = 120; // px
  @Input() enabled: boolean = false;
  @Input() showControls: boolean = true; // show internal controls

  // lens state
  showLens: boolean = false;
  lensStyle: Record<string, string> = {};

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  private imageEl: HTMLImageElement | null = null;

  private hideLens(): void {
    this.showLens = false;
  }

  @HostListener('mouseleave')
  onLeave(): void {
    this.hideLens();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const root = this.el.nativeElement;
    const target = event.target as Node | null;
    if (!target || !root.contains(target)) this.hideLens();
  }

  @HostListener('click', ['$event'])
  onComponentClick(event: MouseEvent): void {
    const img = this.getImageElement();
    const target = event.target as HTMLElement | null;
    if (!img) return this.hideLens();
    if (!target || target !== img) this.hideLens();
  }

  onImageMove(event: MouseEvent): void {
    if (!this.enabled) {
      return this.hideLens();
    }
    const img = this.getImageElement();
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Constrain to image bounds
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      return this.hideLens();
    }

    this.showLens = true;

    const bgWidth = rect.width * this.zoom;
    const bgHeight = rect.height * this.zoom;
    const bgPosX = -(x * this.zoom - this.lensRadius);
    const bgPosY = -(y * this.zoom - this.lensRadius);

    this.lensStyle = {
      width: `${this.lensRadius * 2}px`,
      height: `${this.lensRadius * 2}px`,
      left: `${x - this.lensRadius}px`,
      top: `${y - this.lensRadius}px`,
      borderRadius: '50%',
      backgroundImage: `url('${img.src}')`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: `${bgWidth}px ${bgHeight}px`,
      backgroundPosition: `${bgPosX}px ${bgPosY}px`
    };
  }

  // UI Controls
  toggleEnabled(): void {
    this.enabled = !this.enabled;
    if (!this.enabled) this.hideLens();
  }

  private getImageElement(): HTMLImageElement | null {
    if (this.imageEl && document.body.contains(this.imageEl)) return this.imageEl;
    this.imageEl = this.el.nativeElement.querySelector('img.magnifier-image') as HTMLImageElement | null;
    return this.imageEl;
  }
}


