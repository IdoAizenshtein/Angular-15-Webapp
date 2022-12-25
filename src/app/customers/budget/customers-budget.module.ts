import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersBudgetComponent } from './customers-budget.component';
import { TodayRelativeHumanizePipe } from '@app/shared/pipes/todayRelativeHumanize.pipe';

import { CustomersBudgetRoutingModule } from './customers-budget-routing.module';
import { SharedModule } from '@app/shared/shared.module';
import { CurrencySymbolPipe } from '@app/shared/pipes/currencySymbol.pipe';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SortPipe } from '@app/shared/pipes/sort.pipe';

@NgModule({
  imports: [
    CommonModule,
    CustomersBudgetRoutingModule,
    SharedModule,
    NgbModule
  ],
  declarations: [CustomersBudgetComponent],
  providers: [TodayRelativeHumanizePipe, CurrencySymbolPipe, SortPipe]
})
export class CustomersBudgetModule {}
