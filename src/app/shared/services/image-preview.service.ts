import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ImagePreviewState {
  isOpen: boolean;
  url: string | null;
  title: string;
  isPdf: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImagePreviewService {
  private readonly initialState: ImagePreviewState = {
    isOpen: false,
    url: null,
    title: '',
    isPdf: false
  };

  private readonly state$$ = new BehaviorSubject<ImagePreviewState>(this.initialState);
  readonly state$: Observable<ImagePreviewState> = this.state$$.asObservable();

  open(url: string | null | undefined, title: string = 'Preview'): void {
    if (!url) return;
    this.state$$.next({
      isOpen: true,
      url,
      title: title || 'Preview',
      isPdf: this.isPdf(url)
    });
  }

  close(): void {
    this.state$$.next({ ...this.initialState });
  }

  isPdf(value?: string | null): boolean {
    if (!value) return false;
    const v = value.toLowerCase();
    return v.startsWith('data:application/pdf') || v.endsWith('.pdf') || v.includes('.pdf?');
  }
}
