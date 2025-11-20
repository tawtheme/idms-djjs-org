import { Component, Input, Output, EventEmitter, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() isCollapsed: boolean = false;
  @Input() title: string = 'idms-djjs.org';
  @Output() toggleCollapse = new EventEmitter<void>();
  
  @ViewChild('headerElement', { static: false }) headerElement!: ElementRef<HTMLElement>;

  constructor(private elementRef: ElementRef) {}

  onToggleCollapse() {
    this.toggleCollapse.emit();
  }

  getHeight(): number {
    const headerEl = this.headerElement?.nativeElement || this.elementRef.nativeElement.querySelector('.header');
    if (headerEl) {
      const computedStyle = window.getComputedStyle(headerEl);
      return parseInt(computedStyle.height) || 0;
    }
    return 0;
  }
}
