import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { IconSvgObject } from '@hugeicons/angular';

// Icon imports - organized by category
import {
  // Navigation & Arrows
  Menu01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpDownIcon,

  // Actions
  Search01Icon,
  SearchRemoveIcon,
  Cancel01Icon,
  Delete01Icon,
  Edit02Icon,
  Copy01Icon,
  Download01Icon,
  Upload01Icon,
  CloudUploadIcon,
  PrinterIcon,
  RefreshIcon,
  FilterHorizontalIcon,
  FilterIcon,

  // User & People
  UserIcon,
  UserAdd01Icon,
  UserMinus01Icon,
  UserGroupIcon,
  UserMultipleIcon,

  // Communication
  Mail01Icon,
  TelephoneIcon,

  // Status & Feedback
  CheckmarkCircle01Icon,
  Tick01Icon,
  AlertCircleIcon,
  InformationCircleIcon,
  ViewIcon,
  ViewOffIcon,

  // Security
  LockIcon,
  Logout01Icon,

  // Content & Files
  File01Icon,
  InboxIcon,
  CheckListIcon,

  // Layout & UI
  DashboardSquare01Icon,
  Home01Icon,
  Settings01Icon,
  MoreVerticalIcon,
  Calendar01Icon,
  ListViewIcon,

  // Business & Data
  Building01Icon,
  WorkIcon,
  BadgeIcon,
  MapsIcon,
  Table01Icon,
  ChartIncreaseIcon,
  Flowchart01Icon,

  // Media
  Camera01Icon,

  // Location
  Location01Icon,
  MapPinIcon,

  // Zoom
  ZoomInAreaIcon,
  ZoomOutAreaIcon,

  // Misc
  HeartCheckIcon,
  FavouriteIcon,
  ArrowReloadHorizontalIcon,
  Exchange01Icon,
  CirclePasswordIcon,
} from '@hugeicons/core-free-icons';

// Map Material Icons names to Hugeicons
const ICON_MAP: Record<string, IconSvgObject> = {
  // Navigation
  'menu': Menu01Icon,
  'keyboard_arrow_down': ArrowDown01Icon,
  'keyboard_arrow_up': ArrowUp01Icon,
  'keyboard_arrow_left': ArrowLeft01Icon,
  'keyboard_arrow_right': ArrowRight01Icon,
  'chevron_left': ArrowLeft01Icon,
  'chevron_right': ArrowRight01Icon,
  'arrow_back': ArrowLeft01Icon,
  'arrow_forward': ArrowRight01Icon,
  'arrow_upward': ArrowUp01Icon,
  'arrow_downward': ArrowDown01Icon,
  'unfold_more': ArrowUpDownIcon,

  // Actions
  'search': Search01Icon,
  'search_off': SearchRemoveIcon,
  'close': Cancel01Icon,
  'delete': Delete01Icon,
  'edit': Edit02Icon,
  'content_copy': Copy01Icon,
  'download': Download01Icon,
  'file_download': Download01Icon,
  'cloud_upload': CloudUploadIcon,
  'upload': Upload01Icon,
  'print': PrinterIcon,
  'refresh': RefreshIcon,
  'tune': FilterHorizontalIcon,
  'filter_list': FilterIcon,

  // Users
  'person': UserIcon,
  'person_add': UserAdd01Icon,
  'person_remove': UserMinus01Icon,
  'people': UserMultipleIcon,
  'groups': UserGroupIcon,

  // Communication
  'mail': Mail01Icon,
  'email': Mail01Icon,
  'phone': TelephoneIcon,

  // Status
  'check': Tick01Icon,
  'check_circle': CheckmarkCircle01Icon,
  'cancel': Cancel01Icon,
  'error': AlertCircleIcon,
  'error_outline': AlertCircleIcon,
  'warning': AlertCircleIcon,
  'info': InformationCircleIcon,
  'help_outline': InformationCircleIcon,
  'help': InformationCircleIcon,
  'visibility': ViewIcon,
  'visibility_off': ViewOffIcon,

  // Security
  'lock': LockIcon,
  'logout': Logout01Icon,

  // Files
  'insert_drive_file': File01Icon,
  'inbox': InboxIcon,
  'assignment': CheckListIcon,
  'checklist': CheckListIcon,

  // Layout
  'dashboard': DashboardSquare01Icon,
  'home': Home01Icon,
  'settings': Settings01Icon,
  'admin_panel_settings': Settings01Icon,
  'more_vert': MoreVerticalIcon,
  'event': Calendar01Icon,
  'today': Calendar01Icon,
  'list': ListViewIcon,

  // Business
  'business': Building01Icon,
  'work': WorkIcon,
  'badge': BadgeIcon,
  'map': MapsIcon,
  'table_chart': Table01Icon,
  'trending_up': ChartIncreaseIcon,
  'insights': ChartIncreaseIcon,
  'account_tree': Flowchart01Icon,
  'inventory': Table01Icon,

  // Media
  'camera_alt': Camera01Icon,

  // Location
  'location_on': Location01Icon,
  'place': MapPinIcon,

  // Zoom
  'zoom_in_map': ZoomInAreaIcon,
  'zoom_out_map': ZoomOutAreaIcon,

  // Misc
  'volunteer_activism': HeartCheckIcon,
  'swap_horiz': Exchange01Icon,
  'bolt': CirclePasswordIcon,
  'favorite': FavouriteIcon,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  template: `
    <hugeicons-icon
      *ngIf="iconData"
      [icon]="iconData"
      [size]="size"
      [color]="color"
      [strokeWidth]="strokeWidth">
    </hugeicons-icon>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class IconComponent implements OnChanges {
  @Input() name: string = '';
  @Input() size: string | number = 20;
  @Input() color: string = 'currentColor';
  @Input() strokeWidth: number = 1.5;

  iconData: IconSvgObject | null = null;

  ngOnChanges(): void {
    this.iconData = ICON_MAP[this.name] || null;
  }
}
