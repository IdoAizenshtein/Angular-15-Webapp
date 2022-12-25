import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

import { CustomersFinancialManagementRoutingModule } from './customers-financialManagement-routing.module';
import { SortPipe } from '@app/shared/pipes/sort.pipe';
import { CurrencySymbolPipe } from '@app/shared/pipes/currencySymbol.pipe';
import {
  FilterPipe,
  FilterPipeBiggerSmaller
} from '@app/shared/pipes/filter.pipe';
import { TodayRelativeHumanizePipe } from '@app/shared/pipes/todayRelativeHumanize.pipe';
import { SumPipe } from '@app/shared/pipes/sum.pipe';
import { BankAccountByIdPipe } from '@app/shared/pipes/bankAccountById.pipe';

@NgModule({
  imports: [CommonModule, CustomersFinancialManagementRoutingModule],
  declarations: [],
  providers: [
    SumPipe,
    DatePipe,
    CurrencyPipe,
    CurrencySymbolPipe,
    FilterPipe,
    FilterPipeBiggerSmaller,
    SortPipe,
    TodayRelativeHumanizePipe,
    BankAccountByIdPipe
  ]
})
export class CustomersFinancialManagementModule {}
