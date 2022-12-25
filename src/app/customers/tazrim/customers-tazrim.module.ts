import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';

import { CustomersTazrimRoutingModule } from './customers-tazrim-routing.module';
import { SortPipe } from '@app/shared/pipes/sort.pipe';
import { CurrencySymbolPipe } from '@app/shared/pipes/currencySymbol.pipe';
import {
  FilterPipe,
  FilterPipeBiggerSmaller
} from '@app/shared/pipes/filter.pipe';
import { TodayRelativeHumanizePipe } from '@app/shared/pipes/todayRelativeHumanize.pipe';
import { SumPipe } from '@app/shared/pipes/sum.pipe';

@NgModule({
  imports: [CommonModule, CustomersTazrimRoutingModule],
  declarations: [],
  providers: [
    SumPipe,
    DatePipe,
    CurrencyPipe,
    CurrencySymbolPipe,
    FilterPipe,
    FilterPipeBiggerSmaller,
    SortPipe,
    TodayRelativeHumanizePipe
  ]
})
export class CustomersTazrimModule {}
