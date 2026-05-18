import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    inject,
} from '@angular/core';
import { IconComponent } from '../components/icon/icon.component';

export interface MenuOption {
    id: string;
    label: string;
    value: any;
    icon?: string;
    disabled?: boolean;
    danger?: boolean;
    success?: boolean;
}

@Component({
    selector: 'hlm-menu',
    standalone: true,
    imports: [CommonModule, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="relative inline-block">
            <button
                type="button"
                (click)="toggle($event)"
                [disabled]="disabled"
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50">
                <app-icon [name]="triggerText" />
            </button>
            @if (isOpen) {
                <div
                    class="absolute right-0 z-50 mt-1 min-w-[180px] overflow-hidden rounded-md border border-border bg-popover py-1 shadow-lg"
                    (click)="$event.stopPropagation()">
                    @for (option of options; track option.id) {
                        <button
                            type="button"
                            (click)="select(option)"
                            [disabled]="!!option.disabled"
                            [class]="itemClass(option)">
                            @if (option.icon) {
                                <app-icon [name]="option.icon" />
                            }
                            <span>{{ option.label }}</span>
                        </button>
                    }
                </div>
            }
        </div>
    `,
})
export class HlmMenuComponent {
    @Input() options: MenuOption[] = [];
    @Input() disabled: boolean = false;
    @Input() triggerText: string = 'more_vert';

    @Output() selectionChange = new EventEmitter<any>();

    isOpen = false;
    private host = inject(ElementRef<HTMLElement>);

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: Event): void {
        if (!this.isOpen) return;
        if (!this.host.nativeElement.contains(event.target as Node)) {
            this.isOpen = false;
        }
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Escape') this.isOpen = false;
    }

    toggle(event: Event): void {
        event.stopPropagation();
        if (this.disabled) return;
        this.isOpen = !this.isOpen;
    }

    select(option: MenuOption): void {
        if (option.disabled) return;
        this.selectionChange.emit(option.value);
        this.isOpen = false;
    }

    itemClass(option: MenuOption): string {
        const base = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:opacity-50 disabled:hover:bg-transparent';
        if (option.danger) return `${base} text-destructive`;
        if (option.success) return `${base} text-emerald-600`;
        return `${base} text-foreground`;
    }
}
