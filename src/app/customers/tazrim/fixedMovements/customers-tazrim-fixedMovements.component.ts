import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import { StorageService } from '@app/shared/services/storage.service';

@Component({
  templateUrl: './customers-tazrim-fixedMovements.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersTazrimFixedMovementsComponent
  implements  OnDestroy
{
  constructor(private storageService: StorageService) {}



  ngOnDestroy(): void {
    this.storageService.sessionStorageClear('fixedMovements/details-filter');
  }
}
