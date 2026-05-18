import { Directive, computed, input } from '@angular/core';
import type { ClassValue } from 'clsx';
import { hlm } from '@spartan-ng/ui-core';

@Directive({
    selector: '[hlmInput]',
    standalone: true,
    host: {
        '[class]': '_computedClass()',
    },
})
export class HlmInputDirective {
    public readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly _computedClass = computed(() =>
        hlm(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
            'placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'file:border-0 file:bg-transparent file:text-sm file:font-medium',
            this.userClass(),
        ),
    );
}
