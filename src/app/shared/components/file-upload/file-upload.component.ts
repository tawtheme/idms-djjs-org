import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface FileUploadConfig {
  multiple?: boolean;
  accept?: string;
  maxSizeMb?: number; // per-file cap
  maxFiles?: number;  // total files cap for multi
  dropText?: string;
  buttonText?: string;
  showFileListHeader?: boolean; // Show/hide the file list header
  fileListHeaderText?: string;  // Custom header text (supports {{count}} placeholder)
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent {
  @Input() allowBrowse: boolean = true;
  @Input() config: FileUploadConfig = {
    multiple: true,
    accept: '',
    maxSizeMb: 10,
    maxFiles: 10,
    dropText: 'Drag & drop files here or',
    buttonText: 'Browse',
    showFileListHeader: true,
    fileListHeaderText: '{{count}} file{{plural}} selected'
  };

  @Input() disabled = false;

  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() fileRejected = new EventEmitter<{ file: File; reason: string }>();
  @Output() removed = new EventEmitter<File>();
  @Output() browseRequested = new EventEmitter<void>();

  isDragging = false;
  selectedFiles: File[] = [];
  imagePreviews: Map<File, string> = new Map();

  onBrowseClick(event: MouseEvent): void {
    // Always stop propagation so the bubbled click doesn't also trigger
    // drop-zone-inner's openFileDialog (which would re-open the picker).
    event.stopPropagation();
    if (!this.allowBrowse) {
      event.preventDefault();
      this.browseRequested.emit();
    }
  }

  openFileDialog(input: HTMLInputElement, event: MouseEvent): void {
    if (this.disabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (this.allowBrowse) {
      input.click();
    } else {
      this.onBrowseClick(event);
    }
  }

  onBrowseInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled) return;
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.disabled) return;
    this.isDragging = false;
    if (!event.dataTransfer) return;
    const files = Array.from(event.dataTransfer.files);
    this.addFiles(files);
  }

  removeFile(file: File): void {
    this.selectedFiles = this.selectedFiles.filter(f => f !== file);
    this.imagePreviews.delete(file);
    this.removed.emit(file);
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  getImagePreview(file: File): string | null {
    return this.imagePreviews.get(file) || null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getFileListHeaderText(): string {
    const headerText = this.config.fileListHeaderText || '{{count}} file{{plural}} selected';
    const count = this.selectedFiles.length;
    const plural = count > 1 ? 's' : '';
    
    return headerText
      .replace('{{count}}', count.toString())
      .replace('{{plural}}', plural);
  }

  private addFiles(files: File[]): void {
    const accepted = this.filterByAccept(files);
    for (const file of accepted) {
      if (this.config.maxSizeMb && file.size > this.config.maxSizeMb * 1024 * 1024) {
        this.fileRejected.emit({ file, reason: `File exceeds ${this.config.maxSizeMb}MB` });
        continue;
      }
      if (this.config.multiple !== true && this.selectedFiles.length >= 1) {
        this.fileRejected.emit({ file, reason: 'Multiple files not allowed' });
        continue;
      }
      if (this.config.multiple && this.config.maxFiles && this.selectedFiles.length >= this.config.maxFiles) {
        this.fileRejected.emit({ file, reason: `Max ${this.config.maxFiles} files` });
        continue;
      }
      this.selectedFiles.push(file);
      
      // Create preview for image files
      if (this.isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.set(file, e.target.result);
        };
        reader.readAsDataURL(file);
      }
    }
    if (accepted.length) {
      this.filesSelected.emit(this.selectedFiles.slice());
    }
  }

  private filterByAccept(files: File[]): File[] {
    if (!this.config.accept) return files;
    const acceptList = this.config.accept.split(',').map(s => s.trim().toLowerCase());
    return files.filter(file => {
      const type = file.type.toLowerCase();
      const name = file.name.toLowerCase();
      return acceptList.some(rule => {
        if (rule.endsWith('/*')) {
          // e.g., image/*
          const prefix = rule.replace('/*', '');
          return type.startsWith(prefix);
        }
        if (rule.startsWith('.')) {
          return name.endsWith(rule);
        }
        return type === rule;
      });
    });
  }
}


