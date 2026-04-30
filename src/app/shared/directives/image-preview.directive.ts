import { Directive, HostBinding, HostListener, Input, inject } from '@angular/core';
import { ImagePreviewService } from '../services/image-preview.service';

@Directive({
  selector: '[appImagePreview]',
  standalone: true
})
export class ImagePreviewDirective {
  private readonly service = inject(ImagePreviewService);

  @Input('appImagePreview') appImagePreview: string | null | undefined = null;
  @Input() previewTitle: string = 'Preview';

  @HostBinding('style.cursor')
  get cursor(): string {
    return this.appImagePreview ? 'pointer' : '';
  }

  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    if (!this.appImagePreview) return;
    event.stopPropagation();
    this.service.open(this.appImagePreview, this.previewTitle);
  }
}
