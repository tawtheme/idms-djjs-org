import { Component, Input, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tooltip-wrapper">
      <ng-content></ng-content>
      <div 
        #tooltipElement
        class="tooltip"
        [class.show]="isVisible"
        [class.top]="position === 'top'"
        [class.bottom]="position === 'bottom'"
        [class.left]="position === 'left'"
        [class.right]="position === 'right'"
        *ngIf="text">
        {{ text }}
      </div>
    </div>
  `,
  styleUrls: ['./tooltip.component.scss']
})
export class TooltipComponent implements AfterViewInit, OnDestroy {
  @Input() text: string = '';
  @Input() position: 'top' | 'bottom' | 'left' | 'right' = 'top';
  @Input() delay: number = 200;
  
  @ViewChild('tooltipElement', { read: ElementRef }) tooltipElement!: ElementRef<HTMLElement>;
  
  isVisible: boolean = false;
  private timeoutId?: number;
  private scrollListener?: () => void;
  private resizeListener?: () => void;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  ngAfterViewInit(): void {
    this.addListeners();
  }

  ngOnDestroy(): void {
    this.hideTooltip();
    this.removeListeners();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.text) {
      this.timeoutId = window.setTimeout(() => {
        this.showTooltip();
      }, this.delay);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hideTooltip();
  }

  private showTooltip(): void {
    if (!this.text || !this.tooltipElement) return;
    
    this.isVisible = true;
    this.updateTooltipPosition();
    this.addListeners();
  }

  private hideTooltip(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.isVisible = false;
  }

  private updateTooltipPosition(): void {
    if (!this.tooltipElement || !this.isVisible) return;

    const wrapper = this.elementRef.nativeElement.querySelector('.tooltip-wrapper');
    const tooltip = this.tooltipElement.nativeElement;
    const trigger = wrapper?.querySelector(':not(.tooltip)') as HTMLElement;

    if (!trigger || !tooltip) return;

    requestAnimationFrame(() => {
      const triggerRect = trigger.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      let top = 0;
      let left = 0;

      switch (this.position) {
        case 'top':
          top = triggerRect.top + scrollY - tooltipRect.height - 8;
          left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'bottom':
          top = triggerRect.bottom + scrollY + 8;
          left = triggerRect.left + scrollX + (triggerRect.width / 2) - (tooltipRect.width / 2);
          break;
        case 'left':
          top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.left + scrollX - tooltipRect.width - 8;
          break;
        case 'right':
          top = triggerRect.top + scrollY + (triggerRect.height / 2) - (tooltipRect.height / 2);
          left = triggerRect.right + scrollX + 8;
          break;
      }

      // Keep tooltip within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (left < 8) left = 8;
      if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8;
      }
      if (top < scrollY + 8) top = scrollY + 8;
      if (top + tooltipRect.height > scrollY + viewportHeight - 8) {
        top = scrollY + viewportHeight - tooltipRect.height - 8;
      }

      this.renderer.setStyle(tooltip, 'position', 'absolute');
      this.renderer.setStyle(tooltip, 'top', `${top}px`);
      this.renderer.setStyle(tooltip, 'left', `${left}px`);
    });
  }

  private addListeners(): void {
    if (!this.scrollListener) {
      this.scrollListener = this.renderer.listen('window', 'scroll', () => {
        if (this.isVisible) {
          this.updateTooltipPosition();
        }
      });
    }

    if (!this.resizeListener) {
      this.resizeListener = this.renderer.listen('window', 'resize', () => {
        if (this.isVisible) {
          this.updateTooltipPosition();
        }
      });
    }
  }

  private removeListeners(): void {
    if (this.scrollListener) {
      this.scrollListener();
      this.scrollListener = undefined;
    }
    if (this.resizeListener) {
      this.resizeListener();
      this.resizeListener = undefined;
    }
  }
}

