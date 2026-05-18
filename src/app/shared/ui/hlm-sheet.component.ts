import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { HlmButtonDirective } from '@spartan-ng/ui-button-helm';
import { IconComponent } from '../components/icon/icon.component';

type FooterButton = {
    text: string;
    type: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    action?: string;
};

@Component({
    selector: 'hlm-sheet',
    standalone: true,
    imports: [CommonModule, IconComponent, HlmButtonDirective],
    template: `
        @if (isOpen) {
            @if (showBackdrop) {
                <div
                    class="fixed inset-0 z-[10100] bg-black/40"
                    (click)="onBackdropClick()"
                    (keydown)="onEscapeKey($event)"
                    tabindex="0"></div>
            }
            <aside
                [class]="panelClasses()"
                [style.width]="widthCss()"
                [class.right-0]="position === 'right'"
                [class.left-0]="position === 'left'"
                role="dialog">
                <header class="flex items-center justify-between border-b border-border px-5 py-4">
                    <div class="text-base font-semibold text-foreground">{{ title }}</div>
                    @if (closable) {
                        <button
                            type="button"
                            (click)="onCloseClick()"
                            aria-label="Close"
                            class="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
                            <app-icon name="close" />
                        </button>
                    }
                </header>
                <div class="flex-1 overflow-y-auto p-5">
                    <ng-content></ng-content>
                </div>
                @if (showFooter || footerButtons.length > 0) {
                    <footer [class]="footerClasses()">
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
                    </footer>
                }
            </aside>
        }
    `,
})
export class HlmSheetComponent implements OnChanges, OnDestroy {
    @Input() isOpen: boolean = false;
    @Input() title: string = '';
    @Input() width: string | number = '500px';
    @Input() position: 'left' | 'right' = 'right';
    @Input() closable: boolean = true;
    @Input() showBackdrop: boolean = true;
    @Input() closeOnBackdropClick: boolean = true;
    @Input() backdropClass: string = '';
    @Input() panelClass: string = '';
    @Input() showFooter: boolean = false;
    @Input() footerAlign: 'left' | 'center' | 'right' = 'right';
    @Input() footerButtons: FooterButton[] = [];

    @Output() close = new EventEmitter<void>();
    @Output() footerAction = new EventEmitter<string>();

    ngOnChanges(): void {
        document.body.style.overflow = this.isOpen ? 'hidden' : 'auto';
    }

    ngOnDestroy(): void {
        document.body.style.overflow = 'auto';
    }

    widthCss(): string {
        if (typeof this.width === 'number') return `${this.width}px`;
        return this.width;
    }

    panelClasses(): string {
        const base = 'fixed top-0 z-[10101] flex h-full max-w-full flex-col bg-card shadow-2xl';
        return `${base} ${this.panelClass}`.trim();
    }

    footerClasses(): string {
        const alignMap: Record<string, string> = {
            left: 'justify-start',
            center: 'justify-center',
            right: 'justify-end',
        };
        return `flex items-center gap-2 border-t border-border px-5 py-3 ${alignMap[this.footerAlign] ?? alignMap["right"]}`;
    }

    onBackdropClick(): void {
        if (this.closeOnBackdropClick && this.closable) this.close.emit();
    }

    onCloseClick(): void {
        if (this.closable) this.close.emit();
    }

    onEscapeKey(event: KeyboardEvent): void {
        if (event.key === 'Escape' && this.closable) this.close.emit();
    }

    onFooterButtonClick(button: FooterButton): void {
        if (button.action) this.footerAction.emit(button.action);
    }

    mapVariant(type: 'primary' | 'secondary' | 'danger'): 'default' | 'secondary' | 'destructive' {
        if (type === 'danger') return 'destructive';
        if (type === 'secondary') return 'secondary';
        return 'default';
    }
}
