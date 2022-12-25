import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@app/login/auth-guard.service';
import { CustomersBillingComponent } from './customers-billing.component';
import { BillingAccountsListComponent } from './billing-accounts-list/billing-accounts-list.component';
import { BillingAccountDetailComponent } from './billing-account-detail/billing-account-detail.component';
import { NgModule } from '@angular/core';

const customersAccountancyRoutes: Routes = [
  {
    path: '',
    component: CustomersBillingComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: BillingAccountsListComponent,
        canActivateChild: [AuthGuard],
        children: [
          {
            path: ':billingAccountId',
            component: BillingAccountDetailComponent
          } // ,
          // {
          //     path: '',
          //     component: SettingsMyaccountComponent,
          //     canActivate: [AuthGuard]
          // }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersAccountancyRoutes)],
  exports: [RouterModule]
})
export class CustomersBillingRoutingModule {}
