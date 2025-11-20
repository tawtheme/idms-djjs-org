import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef, OverlayModule } from '@angular/cdk/overlay';
import { TemplatePortal, PortalModule } from '@angular/cdk/portal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface SidePanelConfig {
  title?: string;
  width?: string | number;
  position?: 'left' | 'right';
  closable?: boolean;
  showBackdrop?: boolean;
  backdropClass?: string;
  panelClass?: string;
}

@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [CommonModule, OverlayModule, PortalModule],
  templateUrl: './side-panel.component.html',
  styleUrls: ['./side-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SidePanelComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() width: string | number = '500px';
  @Input() position: 'left' | 'right' = 'right';
  @Input() closable: boolean = true;
  @Input() showBackdrop: boolean = true;
  @Input() backdropClass: string = 'side-panel-backdrop';
  @Input() panelClass: string = '';

  @Output() close = new EventEmitter<void>();

  @ViewChild('panelTemplate', { static: false }) panelTemplate!: TemplateRef<any>;

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  overlayRef: OverlayRef | null = null;

  ngAfterViewInit(): void {
    if (this.isOpen && !this.overlayRef) {
      setTimeout(() => this.openPanel(), 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.cdr.detectChanges();
      
      if (this.isOpen && !this.overlayRef) {
        Promise.resolve().then(() => {
          if (this.panelTemplate && !this.overlayRef) {
            this.openPanel();
          } else if (!this.panelTemplate) {
            setTimeout(() => {
              if (this.panelTemplate && !this.overlayRef && this.isOpen) {
                this.openPanel();
              }
            }, 50);
          }
        });
      } else if (!this.isOpen && this.overlayRef) {
        this.closePanel();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closePanel();
  }

  openPanel(): void {
    if (this.overlayRef) {
      return;
    }

    if (!this.panelTemplate) {
      setTimeout(() => {
        if (this.panelTemplate && !this.overlayRef) {
          this.openPanel();
        }
      }, 100);
      return;
    }

    const positionStrategy = this.overlay.position()
      .global()
      .right(this.position === 'right' ? '0' : undefined)
      .left(this.position === 'left' ? '0' : undefined)
      .top('0')
      .bottom('0');

    const scrollStrategy = this.overlay.scrollStrategies.noop();

    const width = typeof this.width === 'number' ? `${this.width}px` : this.width;

    const panelClasses = [
      'side-panel-overlay',
      this.position === 'left' ? 'side-panel-left' : 'side-panel-right'
    ];
    
    if (this.panelClass) {
      panelClasses.push(this.panelClass);
    }

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy,
      hasBackdrop: this.showBackdrop,
      backdropClass: this.backdropClass,
      panelClass: panelClasses,
      disposeOnNavigation: true
    });

    // Create and attach portal
    const portal = new TemplatePortal(this.panelTemplate, this.viewContainerRef);
    this.overlayRef.attach(portal);

    // Apply width and styling to overlay pane after creation
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.overlayRef) {
          const pane = this.overlayRef.overlayElement;
          const container = this.overlayRef.hostElement;
          
          // Style the overlay pane
          pane.style.width = width;
          pane.style.maxWidth = '90vw';
          pane.style.height = '100vh';
          pane.style.position = 'fixed';
          pane.style.display = 'block';
          pane.style.visibility = 'visible';
          pane.style.opacity = '1';
          pane.style.zIndex = '10000';
          pane.style.top = '0';
          pane.style.bottom = '0';
          pane.style.right = this.position === 'right' ? '0' : 'auto';
          pane.style.left = this.position === 'left' ? '0' : 'auto';
          pane.style.margin = '0';
          pane.style.padding = '0';
          
          // Ensure overlay container is visible
          if (container) {
            container.style.zIndex = '10000';
            container.style.pointerEvents = 'auto';
          }
        }
      });
    });

    // Handle backdrop clicks and ensure backdrop is visible
    if (this.showBackdrop) {
      requestAnimationFrame(() => {
        if (this.overlayRef) {
          const backdrop = this.overlayRef.backdropElement;
          if (backdrop) {
            backdrop.style.zIndex = '9999';
            backdrop.style.position = 'fixed';
            backdrop.style.top = '0';
            backdrop.style.left = '0';
            backdrop.style.right = '0';
            backdrop.style.bottom = '0';
            backdrop.style.opacity = '1';
            backdrop.style.visibility = 'visible';
          }
        }
      });

      if (this.closable) {
        this.overlayRef.backdropClick()
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            this.closePanel();
          });
      }
    }

    // Handle escape key
    this.overlayRef.keydownEvents()
      .pipe(takeUntil(this.destroy$))
      .subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape' && this.closable) {
          this.closePanel();
        }
      });

    // Prevent body scroll when panel is open
    document.body.style.overflow = 'hidden';
  }

  closePanel(): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      this.overlayRef.dispose();
      this.overlayRef = null;
      document.body.style.overflow = '';
      this.close.emit();
    }
  }

  onCloseClick(): void {
    if (this.closable) {
      this.closePanel();
    }
  }
}

