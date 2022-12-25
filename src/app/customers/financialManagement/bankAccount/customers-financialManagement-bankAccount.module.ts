import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersFinancialManagementBankAccountComponent } from './customers-financialManagement-bankAccount.component';

import { FinancialManagementBankAccountAggregateComponent } from './aggregate/financialManagement-bankAccount-aggregate.component';
import { FinancialManagementBankAccountDetailsComponent } from './details/financialManagement-bankAccount-details.component';
import { FinancialManagementBankAccountGraphComponent } from './graph/financialManagement-bankAccount-graph.component';

import { CustomersFinancialManagementBankAccountRoutingModule } from './customers-financialManagement-bankAccount-routing.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    CustomersFinancialManagementBankAccountRoutingModule
  ],
  declarations: [
    CustomersFinancialManagementBankAccountComponent,
    FinancialManagementBankAccountAggregateComponent,
    FinancialManagementBankAccountDetailsComponent,
    FinancialManagementBankAccountGraphComponent
  ]
})
export class CustomersFinancialManagementBankAccountModule {}
