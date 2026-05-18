import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
    selector: 'hlm-spinner',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (overlay()) {
            <div class="fixed inset-0 z-[10100] flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <div class="flex flex-col items-center gap-2">
                    <div [class]="ringClass()" role="status" aria-label="Loading"></div>
                    @if (message()) {
                        <p class="m-0 text-sm text-muted-foreground">{{ message() }}</p>
                    }
                </div>
            </div>
        } @else {
            <div class="inline-flex flex-col items-center gap-2">
                <div [class]="ringClass()" role="status" aria-label="Loading"></div>
                @if (message()) {
                    <p class="m-0 text-sm text-muted-foreground">{{ message() }}</p>
                }
            </div>
        }
    `,
})
export class HlmSpinnerComponent {
    public readonly size = input<'small' | 'medium' | 'large'>('medium');
    public readonly message = input<string>('');
    public readonly overlay = input<boolean>(false);

    protected readonly ringClass = computed(() => {
        const sizeMap: Record<'small' | 'medium' | 'large', string> = {
            small: 'h-4 w-4 border-2',
            medium: 'h-8 w-8 border-[3px]',
            large: 'h-12 w-12 border-4',
        };
        return `${sizeMap[this.size()]} animate-spin rounded-full border-muted border-t-primary`;
    });
}
