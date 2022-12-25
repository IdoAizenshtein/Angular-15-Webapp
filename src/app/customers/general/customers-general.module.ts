import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersGeneralComponent } from './customers-general.component';
import { TodayRelativeHumanizePipe } from '@app/shared/pipes/todayRelativeHumanize.pipe';

import { CustomersGeneralRoutingModule } from './customers-general-routing.module';
import { SharedModule } from '@app/shared/shared.module';
import { CurrencySymbolPipe } from '@app/shared/pipes/currencySymbol.pipe';

@NgModule({
  imports: [CommonModule, CustomersGeneralRoutingModule, SharedModule],
  declarations: [CustomersGeneralComponent],
  providers: [TodayRelativeHumanizePipe, CurrencySymbolPipe]
})
export class CustomersGeneralModule {}
