import { Component, Inject } from '@angular/core';
import { MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA, MatLegacyDialogRef as MatDialogRef } from '@angular/material/legacy-dialog';

@Component({
  selector: 'app-bank-options-dialog',
  templateUrl: './bank-options-dialog.component.html'
})
export class BankOptionsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<BankOptionsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BankOptionsData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}

export interface BankOptionsData {
  options: { label: string; value: string }[];
  selection: { label: string; value: string };
}
