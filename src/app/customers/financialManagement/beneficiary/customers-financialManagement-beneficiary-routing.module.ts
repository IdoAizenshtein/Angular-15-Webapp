import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CustomersFinancialManagementBeneficiaryComponent } from './customers-financialManagement-beneficiary.component';
import { AuthGuard } from '@app/login/auth-guard.service';

const beneficiaryRoutes: Routes = [
  {
    path: '',
    component: CustomersFinancialManagementBeneficiaryComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(beneficiaryRoutes)],
  exports: [RouterModule]
})
export class CustomersFinancialManagementBeneficiaryRoutingModule {}
