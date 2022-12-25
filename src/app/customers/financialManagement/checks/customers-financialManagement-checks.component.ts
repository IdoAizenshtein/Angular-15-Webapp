import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { StorageService } from '@app/shared/services/storage.service';

@Component({
  templateUrl: './customers-financialManagement-checks.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersFinancialManagementChecksComponent
  implements  OnDestroy
{
  constructor(private storageService: StorageService) {}



  ngOnDestroy(): void {
    ['in-checks', 'out-checks'].forEach((routeConf) => {
      ['filterQueryStatus', 'filterProgramName', 'filterTypesCategory'].forEach(
        (key) => this.storageService.sessionStorageClear(routeConf + '-' + key)
      );
    });
  }
}
