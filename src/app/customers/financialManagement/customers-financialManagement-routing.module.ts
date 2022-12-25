import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@app/login/auth-guard.service';

const customersFinancialManagementRoutingRoutes: Routes = [
  {
    path: '',
    redirectTo: 'bankAccount',
    pathMatch: 'full'
  },
  {
    path: 'bankAccount',
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./bankAccount/customers-financialManagement-bankAccount.module').then(m => m.CustomersFinancialManagementBankAccountModule)
  },
  {
    path: 'checks',
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./checks/customers-financialManagement-checks.module').then(m => m.CustomersFinancialManagementChecksModule)
  },
  {
    path: 'creditsCard',
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./creditsCard/customers-financialManagement-creditsCard.module').then(m => m.CustomersFinancialManagementCreditsCardModule)
  },
  {
    path: 'slika',
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./slika/customers-financialManagement-slika.module').then(m => m.CustomersFinancialManagementSlikaModule)
  },
  {
    path: 'beneficiary',
    canActivate: [AuthGuard],
    loadChildren: () => import('./beneficiary/customers-financialManagement-beneficiary.module').then(m => m.CustomersFinancialManagementBeneficiaryModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersFinancialManagementRoutingRoutes)],
  exports: [RouterModule]
})
export class CustomersFinancialManagementRoutingModule {}
