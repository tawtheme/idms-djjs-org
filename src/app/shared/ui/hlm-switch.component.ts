import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import type { ClassValue } from 'clsx';
import { hlm } from '@spartan-ng/ui-core';
import { BrnSwitchComponent, BrnSwitchThumbComponent } from '@spartan-ng/ui-switch-brain';

@Component({
    selector: 'hlm-switch',
    standalone: true,
    imports: [BrnSwitchComponent, BrnSwitchThumbComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <brn-switch
            [class]="_computedClass()"
            [checked]="checked()"
            [disabled]="disabled()"
            [id]="id()"
            [name]="name()"
            (checkedChange)="checkedChange.emit($event)"
        >
            <brn-switch-thumb [class]="_thumbClass" />
        </brn-switch>
    `,
})
export class HlmSwitchComponent {
    public readonly userClass = input<ClassValue>('', { alias: 'class' });
    public readonly checked = input<boolean>(false);
    public readonly disabled = input<boolean>(false);
    public readonly id = input<string | null>(null);
    public readonly name = input<string | null>(null);
    public readonly checkedChange = output<boolean>();

    protected readonly _computedClass = computed(() =>
        hlm(
            'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
            this.userClass(),
        ),
    );

    protected readonly _thumbClass =
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0';
}
