import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Reusable confirmation dialog component
 * Displays a modal with customizable title, message, and Yes/No buttons
 */
@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrls: ['./confirmation-dialog.component.scss']
})
export class ConfirmationDialogComponent implements OnInit, OnDestroy, OnChanges {
  /** Whether the dialog is open */
  @Input() isOpen: boolean = false;

  /** Dialog title (default: "Confirm") */
  @Input() title: string = 'Confirm';

  /** Dialog message/question */
  @Input() message: string = 'Are you sure you want to proceed?';

  /** Label for the Yes/Confirm button (default: "Yes") */
  @Input() confirmLabel: string = 'Yes';

  /** Label for the No/Cancel button (default: "No") */
  @Input() cancelLabel: string = 'No';

  /** Button type for confirm button (default: "primary") */
  @Input() confirmType: 'primary' | 'secondary' | 'danger' = 'primary';

  /** Button type for cancel button (default: "secondary") */
  @Input() cancelType: 'primary' | 'secondary' | 'danger' = 'secondary';

  /** Whether to close dialog on backdrop click (default: true) */
  @Input() closable: boolean = true;

  /** Event emitted when user clicks Yes/Confirm */
  @Output() confirm = new EventEmitter<void>();

  /** Event emitted when user clicks No/Cancel or closes the dialog */
  @Output() cancel = new EventEmitter<void>();

  ngOnInit(): void {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnChanges(): void {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }

  ngOnDestroy(): void {
    document.body.style.overflow = 'auto';
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget && this.closable) {
      this.onCancel();
    }
  }

  /**
   * Handle close button click
   */
  onCloseClick(): void {
    if (this.closable) {
      this.onCancel();
    }
  }

  /**
   * Handle Escape key press
   */
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closable) {
      this.onCancel();
    }
  }

  /**
   * Handle Yes/Confirm button click
   */
  onConfirm(): void {
    this.confirm.emit();
  }

  /**
   * Handle No/Cancel button click
   */
  onCancel(): void {
    this.cancel.emit();
  }

  /**
   * Get CSS classes for the dialog
   */
  get dialogClasses(): string {
    return 'confirmation-dialog__dialog modal-small';
  }
}

