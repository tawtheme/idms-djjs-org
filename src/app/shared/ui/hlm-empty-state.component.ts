import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../components/icon/icon.component';

@Component({
    selector: 'hlm-empty-state',
    standalone: true,
    imports: [CommonModule, IconComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div [ngClass]="containerClass()">
            <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <app-icon [name]="icon" />
            </div>
            <div class="m-0 mb-1 text-base font-semibold text-foreground">{{ title }}</div>
            <p class="m-0 max-w-md text-sm text-muted-foreground">{{ description }}</p>
            @if (showButton && buttonText) {
                <button
                    type="button"
                    (click)="onButtonClick()"
                    class="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                    @if (buttonIcon) {
                        <app-icon [name]="buttonIcon" />
                    }
                    {{ buttonText }}
                </button>
            }
        </div>
    `,
})
export class HlmEmptyStateComponent {
    @Input() title: string = 'No data found';
    @Input() description: string = 'There are no items to display at the moment.';
    @Input() icon: string = 'search_off';
    @Input() buttonText?: string;
    @Input() buttonIcon?: string;
    @Input() showButton: boolean = false;
    @Input() size: 'small' | 'medium' | 'large' = 'medium';
    @Input() variant: 'default' | 'minimal' | 'illustrated' = 'default';

    @Output() buttonClick = new EventEmitter<void>();

    onButtonClick(): void {
        this.buttonClick.emit();
    }

    containerClass(): string {
        const sizeMap = {
            small: 'py-6',
            medium: 'py-10',
            large: 'py-16',
        };
        return `flex flex-col items-center justify-center text-center ${sizeMap[this.size] ?? sizeMap["medium"]}`;
    }
}
