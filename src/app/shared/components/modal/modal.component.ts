import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html'
})
export class ModalComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: 'small' | 'medium' | 'large' | 'extraLarge' | 'full' = 'medium';
  @Input() closable: boolean = true;
  @Input() showHeader: boolean = true;
  @Input() showFooter: boolean = false;
  @Input() footerAlign: 'left' | 'center' | 'right' = 'right';
  @Input() footerButtons: Array<{
    text: string;
    type: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    action?: string;
  }> = [];
  @Output() close = new EventEmitter<void>();
  @Output() footerAction = new EventEmitter<string>();

  @ViewChild('modalBody', { static: false }) modalBody!: ElementRef;

  ngOnInit(): void {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.calculateModalHeight();
    }
    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
      // Recalculate height when modal opens
      setTimeout(() => this.calculateModalHeight(), 0);
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'auto';
    window.removeEventListener('resize', this.onWindowResize.bind(this));
  }

  private onWindowResize(): void {
    this.calculateModalHeight();
  }

  private calculateModalHeight(): void {
    // Flexbox layout handles height automatically, but we ensure modal doesn't exceed viewport
    if (this.modalBody) {
      const viewportHeight = window.innerHeight;
      const modalContainer = this.modalBody.nativeElement.parentElement;
      
      if (modalContainer) {
        // Only set max-height on modal container if it exceeds viewport
        const currentHeight = modalContainer.offsetHeight;
        if (currentHeight > viewportHeight * 0.9) {
          modalContainer.style.maxHeight = `${viewportHeight * 0.9}px`;
        }
      }
    }
  }

  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget && this.closable) {
      this.closeModal();
    }
  }

  onCloseClick(): void {
    if (this.closable) {
      this.closeModal();
    }
  }

  onFooterButtonClick(button: any): void {
    if (button.action) {
      this.footerAction.emit(button.action);
    }
  }

  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closable) {
      this.closeModal();
    }
  }

  private closeModal(): void {
    this.close.emit();
  }

  get modalClasses(): string {
    return [
      'modal__dialog',
      `modal-${this.size}`
    ].join(' ');
  }
}
