import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersFinancialManagementChecksComponent } from './customers-financialManagement-checks.component';

import { FinancialManagementChecksDetailsComponent } from './details/financialManagement-checks-details.component';

import { CustomersFinancialManagementBankAccountRoutingModule } from './customers-financialManagement-checks-routing.module';
import { ChecksAdditionComponent } from './addition/checks-addition.component';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    CustomersFinancialManagementBankAccountRoutingModule
  ],
  declarations: [
    CustomersFinancialManagementChecksComponent,
    FinancialManagementChecksDetailsComponent,
    ChecksAdditionComponent
  ]
})
export class CustomersFinancialManagementChecksModule {}
