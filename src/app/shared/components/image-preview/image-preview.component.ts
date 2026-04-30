import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ModalComponent } from '../modal/modal.component';
import { ImagePreviewService, ImagePreviewState } from '../../services/image-preview.service';

interface ViewModel extends ImagePreviewState {
  safeUrl: SafeResourceUrl | null;
}

@Component({
  selector: 'app-image-preview',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './image-preview.component.html',
  styleUrls: ['./image-preview.component.scss']
})
export class ImagePreviewComponent {
  private readonly service = inject(ImagePreviewService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly vm$: Observable<ViewModel> = this.service.state$.pipe(
    map((s) => ({
      ...s,
      safeUrl: s.url && s.isPdf ? this.sanitizer.bypassSecurityTrustResourceUrl(s.url) : null
    }))
  );

  close(): void {
    this.service.close();
  }
}
