import { Component, Input, Output, EventEmitter, HostListener, ElementRef, ViewChild, ViewEncapsulation, ChangeDetectorRef, Renderer2, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MenuOption {
  id: string;
  label: string;
  value: any;
  icon?: string;
  disabled?: boolean;
  danger?: boolean;
}

@Component({
  selector: 'app-menu-dropdown',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-dropdown.component.html',
  styleUrls: ['./menu-dropdown.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MenuDropdownComponent implements OnDestroy {
  private static currentlyOpen: MenuDropdownComponent | null = null;
  @ViewChild('menuList', { read: ElementRef }) menuListRef!: ElementRef<HTMLElement>;

  @Input() options: MenuOption[] = [];
  @Input() disabled: boolean = false;
  @Input() triggerText: string = 'more_vert';

  @Output() selectionChange = new EventEmitter<any>();

  isOpen: boolean = false;
  
  private dropdownElement: HTMLElement | null = null;
  private isOpening: boolean = false;
  private scrollListener?: () => void;
  private resizeListener?: () => void;
  
  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnDestroy(): void {
    this.closeDropdown();
    this.removeListeners();
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.handleOutsideClick(event);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: Event): void {
    // Use mousedown as backup for better detection
    this.handleOutsideClick(event);
  }

  private handleOutsideClick(event: Event): void {
    // Don't close if we're in the process of opening
    if (this.isOpening || !this.isOpen) {
      return;
    }
    
    const targetNode = event.target as Node;
    if (!targetNode) {
      return;
    }
    
    const clickedInsideTrigger = this.elementRef.nativeElement.contains(targetNode);
    const clickedInsideDropdown = this.dropdownElement?.contains(targetNode) ?? false;
    
    if (!clickedInsideTrigger && !clickedInsideDropdown) {
      this.closeDropdown();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.isOpen) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        this.openDropdown();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        this.closeDropdown();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusNextOption();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusPreviousOption();
        break;
      case 'Enter':
        event.preventDefault();
        this.selectFocusedOption();
        break;
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;

    this.isOpen ? this.closeDropdown() : this.openDropdown();
  }

  private openDropdown(): void {
    if (this.disabled || this.dropdownElement) return;
    
    // Set flag to prevent document click from closing during opening
    this.isOpening = true;
    
    // Ensure only one dropdown is open at a time
    if (MenuDropdownComponent.currentlyOpen && MenuDropdownComponent.currentlyOpen !== this) {
      MenuDropdownComponent.currentlyOpen.closeDropdown();
    }

    const trigger = this.elementRef.nativeElement.querySelector('.menu-trigger') as HTMLElement;
    if (!trigger) {
      this.isOpening = false;
      return;
    }
    
    // Wait for next tick to ensure menu list is rendered
    this.cdr.detectChanges();
    
    requestAnimationFrame(() => {
      const menuList = this.menuListRef?.nativeElement;
      if (!menuList) {
        this.isOpening = false;
        return;
      }
      
      // Clone the menu list and append to body
      const clonedMenu = menuList.cloneNode(true) as HTMLElement;
      clonedMenu.classList.add('menu-dropdown-overlay');
      
      // Remove inline display:none style if present
      clonedMenu.style.removeProperty('display');
      
      this.renderer.appendChild(document.body, clonedMenu);
      this.dropdownElement = clonedMenu;
      
      // Force display to block to ensure it's visible
      this.renderer.setStyle(clonedMenu, 'display', 'block');
      
      // Wait for the next frame to ensure dimensions are calculated
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Position the dropdown after it has fully rendered with dimensions
          this.updatePosition(trigger, clonedMenu);
        });
      });
      
      // Add scroll and resize listeners
      this.addListeners(trigger, clonedMenu);
      
      // Attach click handlers to cloned menu items
      const menuItems = clonedMenu.querySelectorAll('.menu-item');
      menuItems.forEach((item, index) => {
        this.renderer.listen(item, 'click', (event: Event) => {
          event.stopPropagation();
          if (this.options[index] && !this.options[index].disabled) {
            this.selectOption(this.options[index]);
          }
        });
      });
      
      this.isOpen = true;
      MenuDropdownComponent.currentlyOpen = this;
      
      setTimeout(() => {
        this.isOpening = false;
      }, 100);
    });
  }
  
  private updatePosition(trigger: HTMLElement, dropdown: HTMLElement): void {
    requestAnimationFrame(() => {
      const triggerRect = trigger.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate optimal position
      let left = triggerRect.right - dropdownRect.width;
      let top = triggerRect.bottom + 6;
      
      // Check horizontal boundaries
      if (left < 10) {
        left = Math.max(10, triggerRect.left);
      } else if (left + dropdownRect.width > viewportWidth - 10) {
        left = Math.min(viewportWidth - dropdownRect.width - 10, triggerRect.left);
      }
      
      // Check vertical boundaries
      if (top + dropdownRect.height > viewportHeight - 10) {
        top = triggerRect.top - dropdownRect.height - 6;
        if (top < 10) {
          top = 10;
        }
      } else if (top < 10) {
        top = triggerRect.bottom + 6;
      }
      
      // Apply positioning
      this.renderer.setStyle(dropdown, 'position', 'fixed');
      this.renderer.setStyle(dropdown, 'left', `${left}px`);
      this.renderer.setStyle(dropdown, 'top', `${top}px`);
      this.renderer.setStyle(dropdown, 'z-index', '2000');
      this.renderer.setStyle(dropdown, 'visibility', 'visible');
      this.renderer.setStyle(dropdown, 'opacity', '1');
    });
  }
  
  private addListeners(trigger: HTMLElement, dropdown: HTMLElement): void {
    // Handle scroll events (use native listener for capture mode)
    const scrollHandler = () => {
      this.updatePosition(trigger, dropdown);
    };
    window.addEventListener('scroll', scrollHandler, true);
    this.scrollListener = () => {
      window.removeEventListener('scroll', scrollHandler, true);
    };
    
    // Handle resize events
    this.resizeListener = this.renderer.listen('window', 'resize', () => {
      this.updatePosition(trigger, dropdown);
    });
  }

  private closeDropdown(): void {
    if (this.dropdownElement) {
      this.renderer.removeChild(document.body, this.dropdownElement);
      this.dropdownElement = null;
    }
    this.removeListeners();
    this.isOpen = false;
    this.isOpening = false;
    if (MenuDropdownComponent.currentlyOpen === this) {
      MenuDropdownComponent.currentlyOpen = null;
    }
  }

  selectOption(option: MenuOption): void {
    if (option.disabled) return;

    this.selectionChange.emit(option.value);
    this.closeDropdown();
  }

  trackById(index: number, option: MenuOption): string {
    return option.id;
  }

  private focusNextOption(): void {
    // Implementation for keyboard navigation
  }

  private focusPreviousOption(): void {
    // Implementation for keyboard navigation
  }

  private selectFocusedOption(): void {
    // Implementation for keyboard navigation
  }
}
