import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface NotificationsData {
  emailNotifications: boolean;
  orderNotifications: boolean;
  jobNotifications: boolean;
  shipmentNotifications: boolean;
  invoiceNotifications: boolean;
}

@Component({
  standalone: true,
  selector: 'app-notifications',
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnChanges {
  @Input() notificationsData: NotificationsData = {
    emailNotifications: true,
    orderNotifications: true,
    jobNotifications: true,
    shipmentNotifications: true,
    invoiceNotifications: true
  };

  @Input() submitting: boolean = false;
  @Input() f: any;

  @Output() dataChange = new EventEmitter<NotificationsData>();
  @Output() cancel = new EventEmitter<void>();

  isEditing: boolean = false;
  editedData: NotificationsData = { ...this.notificationsData };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notificationsData'] && !this.isEditing) {
      this.editedData = { ...this.notificationsData };
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  startEdit(): void {
    this.isEditing = true;
    this.editedData = { ...this.notificationsData };
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.editedData = { ...this.notificationsData };
  }

  saveEdit(): void {
    this.notificationsData = { ...this.editedData };
    this.isEditing = false;
    this.dataChange.emit({ ...this.notificationsData });
  }

  onCheckboxChange(field: keyof NotificationsData, value: boolean): void {
    this.editedData[field] = value;
  }

  onToggleChange(field: keyof NotificationsData, value: boolean): void {
    this.notificationsData[field] = value;
    this.dataChange.emit({ ...this.notificationsData });
  }
}

