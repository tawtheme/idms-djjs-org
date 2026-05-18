import { Directive, computed, input } from '@angular/core';
import type { ClassValue } from 'clsx';
import { hlm } from '@spartan-ng/ui-core';

@Directive({
    selector: '[hlmLabel]',
    standalone: true,
    host: {
        '[class]': '_computedClass()',
    },
})
export class HlmLabelDirective {
    public readonly userClass = input<ClassValue>('', { alias: 'class' });
    protected readonly _computedClass = computed(() =>
        hlm(
            'block text-sm font-medium leading-none text-foreground',
            'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            this.userClass(),
        ),
    );
}
