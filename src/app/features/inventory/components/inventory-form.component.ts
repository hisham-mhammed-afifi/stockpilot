import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { Product } from '../../../shared/models/product.model';

// CONCEPT: Architecture - Dialog data defines the contract between the opener and the dialog.
// The "product" field determines the mode: null = add, Product = edit.
// Categories are passed in so the dialog does not need to inject the store.
export interface InventoryFormData {
  product: Product | null;
  categories: { slug: string; name: string }[];
}

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatOption,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>{{ data.product ? 'Edit Product' : 'Add Product' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="form-grid">
        <mat-form-field appearance="outline">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title" placeholder="Product title" />
          @if (form.controls.title.hasError('required')) {
            <mat-error>Title is required</mat-error>
          }
          @if (form.controls.title.hasError('minlength')) {
            <mat-error>Title must be at least 3 characters</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Brand</mat-label>
          <input matInput formControlName="brand" placeholder="Brand name" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3" placeholder="Product description"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Price</mat-label>
          <input matInput type="number" formControlName="price" placeholder="0.00" />
          @if (form.controls.price.hasError('required')) {
            <mat-error>Price is required</mat-error>
          }
          @if (form.controls.price.hasError('min')) {
            <mat-error>Price must be 0 or greater</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Stock</mat-label>
          <input matInput type="number" formControlName="stock" placeholder="0" />
          @if (form.controls.stock.hasError('required')) {
            <mat-error>Stock is required</mat-error>
          }
          @if (form.controls.stock.hasError('min')) {
            <mat-error>Stock must be 0 or greater</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select formControlName="category">
            @for (cat of data.categories; track cat.slug) {
              <mat-option [value]="cat.slug">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid"
        (click)="onSave()"
      >
        {{ data.product ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0 16px;
      min-width: 400px;
    }

    .full-width {
      grid-column: 1 / -1;
    }
  `,
})
export class InventoryFormComponent {
  protected readonly data = inject<InventoryFormData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<InventoryFormComponent>);
  private readonly fb = inject(FormBuilder);

  // CONCEPT: Architecture - Reactive forms provide built-in validation.
  // The form is pre-filled when editing (data.product exists) and empty when adding.
  protected readonly form = this.fb.nonNullable.group({
    title: [this.data.product?.title ?? '', [Validators.required, Validators.minLength(3)]],
    description: [this.data.product?.description ?? ''],
    price: [this.data.product?.price ?? 0, [Validators.required, Validators.min(0)]],
    stock: [this.data.product?.stock ?? 0, [Validators.required, Validators.min(0)]],
    category: [this.data.product?.category ?? ''],
    brand: [this.data.product?.brand ?? ''],
  });

  onCancel() {
    this.dialogRef.close(null);
  }

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.getRawValue());
    }
  }
}
