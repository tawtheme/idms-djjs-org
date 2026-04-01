import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../icon/icon.component';

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent {
  @Input() items: BreadcrumbItem[] = [];
  @Input() separator: string = '/';
  @Input() showHome: boolean = true;
  @Input() homeRoute: string = '/orders';
  @Input() homeIcon: string = 'home';
  @Input() maxItems: number = 5;
  @Input() showEllipsis: boolean = true;

  get displayItems(): BreadcrumbItem[] {
    if (this.items.length <= this.maxItems) {
      return this.items;
    }

    if (this.showEllipsis) {
      const firstItem = this.items[0];
      const lastItems = this.items.slice(-2);
      return [firstItem, { label: '...', disabled: true }, ...lastItems];
    }

    return this.items.slice(-this.maxItems);
  }

  get hasItems(): boolean {
    return this.items && this.items.length > 0;
  }

  get allItems(): BreadcrumbItem[] {
    const homeItem: BreadcrumbItem = {
      label: 'Home',
      route: this.homeRoute,
      icon: this.homeIcon
    };

    if (this.showHome) {
      return this.hasItems ? [homeItem, ...this.displayItems] : [homeItem];
    }

    return this.displayItems;
  }
}
