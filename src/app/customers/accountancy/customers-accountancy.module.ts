import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersAccountancyTrialBalanceComponent } from './trialBalance/customers-accountancy-trial-balance.component';
import { CustomersAccountancyRoutingModule } from './customers-accountancy-routing.module';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersAccountancyExampleComponent } from './example/customers-accountancy-example.component';
import { CustomersAccountancyProfitAndLossComponent } from './profitAndLoss/customers-accountancy-profit-and-loss.component';
import { CustomersAccountancyBookKeepingAnalyzeComponent } from './bookKeepingAnalyze/customers-accountancy-book-keeping-analyze.component';
import { SumPipe } from '@app/shared/pipes/sum.pipe';

@NgModule({
  imports: [SharedModule, CommonModule, CustomersAccountancyRoutingModule],
  declarations: [
    CustomersAccountancyBookKeepingAnalyzeComponent,
    CustomersAccountancyTrialBalanceComponent,
    CustomersAccountancyExampleComponent,
    CustomersAccountancyProfitAndLossComponent
  ],
  providers: [SumPipe]
})
export class CustomersAccountancyModule {}
