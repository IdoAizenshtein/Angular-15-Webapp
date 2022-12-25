import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CustomersAccountancyTrialBalanceComponent } from './trialBalance/customers-accountancy-trial-balance.component';
import { CustomersAccountancyExampleComponent } from './example/customers-accountancy-example.component';
import { CustomersAccountancyProfitAndLossComponent } from './profitAndLoss/customers-accountancy-profit-and-loss.component';
import { CustomersAccountancyBookKeepingAnalyzeComponent } from './bookKeepingAnalyze/customers-accountancy-book-keeping-analyze.component';

import { AuthGuard } from '@app/login/auth-guard.service';

const customersAccountancyRoutes: Routes = [
  {
    path: '',
    component: CustomersAccountancyExampleComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'bookKeepingAnalyze',
    component: CustomersAccountancyBookKeepingAnalyzeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'profitAndLoss',
    component: CustomersAccountancyProfitAndLossComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'trialBalance',
    component: CustomersAccountancyTrialBalanceComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersAccountancyRoutes)],
  exports: [RouterModule]
})
export class CustomersAccountancyRoutingModule {}
