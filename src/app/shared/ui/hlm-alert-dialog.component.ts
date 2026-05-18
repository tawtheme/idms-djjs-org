import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IconComponent } from '../components/icon/icon.component';

@Component({
    selector: 'hlm-alert-dialog',
    standalone: true,
    imports: [CommonModule, IconComponent, HlmButtonDirective],
    template: `
        @if (isOpen) {
            <div
                class="fixed inset-0 z-[10050] bg-black/50"
                (click)="onBackdropClick($event)"
                (keydown)="onEscapeKey($event)"
                tabindex="0"></div>
            <div class="pointer-events-none fixed inset-0 z-[10051] flex items-center justify-center p-4">
                <div class="pointer-events-auto flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
                    <div class="flex items-start gap-3 px-5 pt-5">
                        <div
                            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
                            [ngClass]="confirmType === 'danger' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'">
                            <app-icon [name]="displayIcon" />
                        </div>
                        <div class="flex-1">
                            <div class="m-0 text-base font-semibold text-foreground">{{ title }}</div>
                            <p class="m-0 mt-1 text-sm text-muted-foreground">
                                @if (highlightText) {
                                    <ng-container>{{ messagePrefix() }}<strong class="font-semibold text-foreground">{{ highlightText }}</strong>{{ messageSuffix() }}</ng-container>
                                } @else {
                                    {{ message }}
                                }
                            </p>
                        </div>
                    </div>
                    <div class="mt-5 flex items-center justify-end gap-2 border-t border-border px-5 py-3">
                        <button hlmBtn variant="secondary" type="button" (click)="onCancel()">{{ cancelLabel }}</button>
                        <button
                            hlmBtn
                            [variant]="confirmType === 'danger' ? 'destructive' : 'default'"
                            type="button"
                            (click)="onConfirm()">
                            {{ confirmLabel }}
                        </button>
                    </div>
                </div>
            </div>
        }
    `,
})
export class HlmAlertDialogComponent implements OnChanges, OnDestroy {
    @Input() isOpen: boolean = false;
    @Input() title: string = 'Confirm';
    @Input() message: string = 'Are you sure you want to proceed?';
    @Input() highlightText: string = '';
    @Input() confirmLabel: string = 'Yes';
    @Input() cancelLabel: string = 'No';
    @Input() confirmType: 'primary' | 'secondary' | 'danger' = 'primary';
    @Input() cancelType: 'primary' | 'secondary' | 'danger' = 'secondary';
    @Input() closable: boolean = true;
    @Input() icon: string = '';

    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();

    get displayIcon(): string {
        if (this.icon) return this.icon;
        if (this.confirmType === 'danger') return 'delete';
        return 'help_outline';
    }

    ngOnChanges(): void {
        document.body.style.overflow = this.isOpen ? 'hidden' : 'auto';
    }

    ngOnDestroy(): void {
        document.body.style.overflow = 'auto';
    }

    messagePrefix(): string {
        if (!this.highlightText) return this.message;
        const idx = this.message.indexOf(this.highlightText);
        return idx >= 0 ? this.message.slice(0, idx) : this.message;
    }

    messageSuffix(): string {
        if (!this.highlightText) return '';
        const idx = this.message.indexOf(this.highlightText);
        return idx >= 0 ? this.message.slice(idx + this.highlightText.length) : '';
    }

    onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget && this.closable) this.cancel.emit();
    }

    onEscapeKey(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.closable) this.cancel.emit();
    }

    onConfirm(): void { this.confirm.emit(); }
    onCancel(): void { this.cancel.emit(); }
}
