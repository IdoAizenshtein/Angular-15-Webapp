import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersBillingRoutingModule } from './customers-billing-routing.module';
import { BillingAccountsListComponent } from './billing-accounts-list/billing-accounts-list.component';
import { BillingAccountDetailComponent } from './billing-account-detail/billing-account-detail.component';
import { CustomersBillingComponent } from './customers-billing.component';

@NgModule({
  imports: [CommonModule, CustomersBillingRoutingModule, SharedModule],
  declarations: [
    BillingAccountsListComponent,
    BillingAccountDetailComponent,
    CustomersBillingComponent
  ]
})
export class CustomersBillingModule {}
