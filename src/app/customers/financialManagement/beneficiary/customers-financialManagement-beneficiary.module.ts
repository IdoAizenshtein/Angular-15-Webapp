import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { CustomersFinancialManagementBeneficiaryComponent } from './customers-financialManagement-beneficiary.component';
import { CustomersFinancialManagementBeneficiaryRoutingModule } from './customers-financialManagement-beneficiary-routing.module';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    CustomersFinancialManagementBeneficiaryRoutingModule
  ],
  declarations: [CustomersFinancialManagementBeneficiaryComponent]
})
export class CustomersFinancialManagementBeneficiaryModule {}
