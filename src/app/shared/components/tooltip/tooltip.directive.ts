import { Directive, Input, HostListener, ElementRef, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true
})
export class TooltipDirective {
  @Input('appTooltip') text: string = '';
  @Input() tooltipPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() tooltipDelay: number = 200;

  private tooltipEl: HTMLElement | null = null;
  private arrowEl: HTMLElement | null = null;
  private containerEl: HTMLElement | null = null;
  private timeoutId?: number;

  constructor(private el: ElementRef<HTMLElement>, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (!this.text) return;
    this.timeoutId = window.setTimeout(() => this.show(), this.tooltipDelay);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.hide();
  }

  private ensureContainer(): void {
    if (!this.containerEl) {
      const c = this.renderer.createElement('div') as HTMLElement;
      this.renderer.setStyle(c, 'position', 'fixed');
      this.renderer.setStyle(c, 'top', '0');
      this.renderer.setStyle(c, 'left', '0');
      this.renderer.setStyle(c, 'z-index', '10000');
      this.renderer.setStyle(c, 'pointer-events', 'none');
      document.body.appendChild(c);
      this.containerEl = c;
    }
  }

  private show(): void {
    this.ensureContainer();
    if (!this.containerEl) return;

    this.tooltipEl = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltipEl, 'tooltip');
    this.renderer.addClass(this.tooltipEl, this.tooltipPosition);
    this.renderer.addClass(this.tooltipEl, 'show');
    this.renderer.setStyle(this.tooltipEl, 'position', 'fixed');
    this.renderer.setStyle(this.tooltipEl, 'padding', '6px 10px');
    this.renderer.setStyle(this.tooltipEl, 'background', '#111827'); // gray-900
    this.renderer.setStyle(this.tooltipEl, 'color', '#fff');
    this.renderer.setStyle(this.tooltipEl, 'font-size', '12px');
    this.renderer.setStyle(this.tooltipEl, 'font-weight', '600');
    this.renderer.setStyle(this.tooltipEl, 'border-radius', '10px');
    this.renderer.setStyle(this.tooltipEl, 'white-space', 'nowrap');
    this.renderer.setStyle(this.tooltipEl, 'box-shadow', '0 4px 12px rgba(0,0,0,0.15)');
    this.renderer.setStyle(this.tooltipEl, 'max-width', '240px');
    this.renderer.setStyle(this.tooltipEl, 'text-align', 'center');
    this.renderer.setProperty(this.tooltipEl, 'textContent', this.text);
    // Arrow element
    this.arrowEl = this.renderer.createElement('div');
    this.renderer.setStyle(this.arrowEl, 'position', 'absolute');
    this.renderer.setStyle(this.arrowEl, 'width', '0');
    this.renderer.setStyle(this.arrowEl, 'height', '0');
    this.renderer.setStyle(this.arrowEl, 'border-style', 'solid');
    // Append arrow safely
    this.tooltipEl!.appendChild(this.arrowEl!);
    // Non-null assertions since both are created just above
    this.containerEl!.appendChild(this.tooltipEl!);
    requestAnimationFrame(() => this.positionTooltip());
  }

  private hide(): void {
    if (this.tooltipEl && this.containerEl) {
      this.containerEl.removeChild(this.tooltipEl);
    }
    this.tooltipEl = null;
    this.arrowEl = null;
  }

  private positionTooltip(): void {
    if (!this.tooltipEl) return;
    const triggerRect = this.el.nativeElement.getBoundingClientRect();
    const tipRect = this.tooltipEl.getBoundingClientRect();

    let top = 0;
    let left = 0;
    switch (this.tooltipPosition) {
      case 'top':
        top = triggerRect.top - tipRect.height - 10;
        left = triggerRect.left + (triggerRect.width - tipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 10;
        left = triggerRect.left + (triggerRect.width - tipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tipRect.height) / 2;
        left = triggerRect.left - tipRect.width - 10;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tipRect.height) / 2;
        left = triggerRect.right + 10;
        break;
    }

    // clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (left < 8) left = 8;
    if (left + tipRect.width > vw - 8) left = vw - tipRect.width - 8;
    if (top < 8) top = 8;
    if (top + tipRect.height > vh - 8) top = vh - tipRect.height - 8;

    this.renderer.setStyle(this.tooltipEl, 'left', `${left}px`);
    this.renderer.setStyle(this.tooltipEl, 'top', `${top}px`);
    this.positionArrow();
  }

  private positionArrow(): void {
    if (!this.tooltipEl || !this.arrowEl) return;
    // Reset common styles
    this.renderer.removeStyle(this.arrowEl, 'top');
    this.renderer.removeStyle(this.arrowEl, 'bottom');
    this.renderer.removeStyle(this.arrowEl, 'left');
    this.renderer.removeStyle(this.arrowEl, 'right');
    switch (this.tooltipPosition) {
      case 'top':
        this.renderer.setStyle(this.arrowEl, 'bottom', '-6px');
        this.renderer.setStyle(this.arrowEl, 'left', '50%');
        this.renderer.setStyle(this.arrowEl, 'transform', 'translateX(-50%)');
        this.renderer.setStyle(this.arrowEl, 'border-width', '6px 6px 0 6px');
        this.renderer.setStyle(this.arrowEl, 'border-color', '#111827 transparent transparent transparent');
        break;
      case 'bottom':
        this.renderer.setStyle(this.arrowEl, 'top', '-6px');
        this.renderer.setStyle(this.arrowEl, 'left', '50%');
        this.renderer.setStyle(this.arrowEl, 'transform', 'translateX(-50%)');
        this.renderer.setStyle(this.arrowEl, 'border-width', '0 6px 6px 6px');
        this.renderer.setStyle(this.arrowEl, 'border-color', 'transparent transparent #111827 transparent');
        break;
      case 'left':
        this.renderer.setStyle(this.arrowEl, 'right', '-6px');
        this.renderer.setStyle(this.arrowEl, 'top', '50%');
        this.renderer.setStyle(this.arrowEl, 'transform', 'translateY(-50%)');
        this.renderer.setStyle(this.arrowEl, 'border-width', '6px 0 6px 6px');
        this.renderer.setStyle(this.arrowEl, 'border-color', 'transparent transparent transparent #111827');
        break;
      case 'right':
        this.renderer.setStyle(this.arrowEl, 'left', '-6px');
        this.renderer.setStyle(this.arrowEl, 'top', '50%');
        this.renderer.setStyle(this.arrowEl, 'transform', 'translateY(-50%)');
        this.renderer.setStyle(this.arrowEl, 'border-width', '6px 6px 6px 0');
        this.renderer.setStyle(this.arrowEl, 'border-color', 'transparent #111827 transparent transparent');
        break;
    }
  }
}


