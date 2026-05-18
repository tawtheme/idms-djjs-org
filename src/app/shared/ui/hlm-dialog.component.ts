import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IconComponent } from '../components/icon/icon.component';

type FooterButton = {
    text: string;
    type: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    action?: string;
};

@Component({
    selector: 'hlm-dialog',
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
                <div [class]="dialogClasses" #modalBody>
                    @if (showHeader) {
                        <div class="flex items-center justify-between border-b border-border px-5 py-4">
                            <div class="text-base font-semibold text-foreground">{{ title }}</div>
                            @if (closable) {
                                <button
                                    type="button"
                                    (click)="onCloseClick()"
                                    aria-label="Close modal"
                                    class="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                                    <app-icon name="close" />
                                </button>
                            }
                        </div>
                    }

                    <div class="flex-1 overflow-y-auto px-5 py-4">
                        <ng-content></ng-content>
                    </div>

                    @if (showFooter || footerButtons.length > 0) {
                        <ng-content select="[slot=footer]">
                            <div [class]="footerWrapClasses">
                                @for (button of footerButtons; track button.text) {
                                    <button
                                        hlmBtn
                                        [variant]="mapVariant(button.type)"
                                        type="button"
                                        (click)="onFooterButtonClick(button)"
                                        [disabled]="!!button.disabled">
                                        {{ button.text }}
                                    </button>
                                }
                            </div>
                        </ng-content>
                    }
                </div>
            </div>
        }
    `,
})
export class HlmDialogComponent implements OnChanges, OnDestroy {
    @Input() isOpen: boolean = false;
    @Input() title: string = '';
    @Input() size: 'small' | 'medium' | 'large' | 'extraLarge' | 'full' = 'medium';
    @Input() closable: boolean = true;
    @Input() showHeader: boolean = true;
    @Input() showFooter: boolean = false;
    @Input() footerAlign: 'left' | 'center' | 'right' = 'right';
    @Input() footerButtons: FooterButton[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() footerAction = new EventEmitter<string>();

    @ViewChild('modalBody', { static: false }) modalBody!: ElementRef;

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

    get dialogClasses(): string {
        const sizeMap: Record<string, string> = {
            small: 'w-full max-w-md',
            medium: 'w-full max-w-2xl',
            large: 'w-full max-w-4xl',
            extraLarge: 'w-full max-w-6xl',
            full: 'w-full max-w-[95vw]',
        };
        return `pointer-events-auto flex max-h-[90vh] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl ${sizeMap[this.size] ?? sizeMap["medium"]}`;
    }

    get footerWrapClasses(): string {
        const alignMap: Record<string, string> = {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end',
        };
        return `flex items-center gap-2 border-t border-border px-5 py-3 ${alignMap[this.footerAlign] ?? alignMap["right"]}`;
    }

    onBackdropClick(event: Event): void {
        if (event.target === event.currentTarget && this.closable) {
            this.close.emit();
        }
    }

    onCloseClick(): void {
        if (this.closable) this.close.emit();
    }

    onFooterButtonClick(button: FooterButton): void {
        if (button.action) this.footerAction.emit(button.action);
    }

    onEscapeKey(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.closable) this.close.emit();
    }

    mapVariant(type: 'primary' | 'secondary' | 'danger'): 'default' | 'secondary' | 'destructive' {
        if (type === 'danger') return 'destructive';
        if (type === 'secondary') return 'secondary';
        return 'default';
    }
}
