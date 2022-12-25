import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StorageService } from '@app/shared/services/storage.service';

@Component({
  templateUrl: './customers-financialManagement-bankAccount.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersFinancialManagementBankAccountComponent
  implements  OnDestroy
{
  constructor(
    public activated: ActivatedRoute,
    private storageService: StorageService
  ) {}



  ngOnDestroy(): void {
    [
      'details-filterTypesVal',
      'details-filterQuery',
      'details-filterPaymentTypesCategory',
      'details-filterTypesCategory'
    ].forEach((key) => this.storageService.sessionStorageClear(key));
  }
}
