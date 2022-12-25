import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedComponent } from '@app/shared/component/shared.component';

import { AuthGuard } from '../login/auth-guard.service';
import { AdminGuard } from '../admin/admin-guard.service';
import { TazrimExampleComponent } from './tazrimExample/tazrim-example.component';
import { landingPageMetzalemComponent } from './landingPageMetzalem/landing-page-metzalem.component';

const customersRoutes: Routes = [
  {
    path: '',
    component: SharedComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        canActivateChild: [AuthGuard],
        children: [
          {
            path: '',
            redirectTo: 'general', // 'financialManagement',
            pathMatch: 'prefix'
          },
          {
            path: 'general',
            loadChildren: () => import('./general/customers-general.module').then(m => m.CustomersGeneralModule)
          },
          {
            path: 'documentManagement',
            loadChildren: () => import('@app/accountants/companies/accountants-companies.module').then(m => m.AccountantsCompaniesModule)
          },
          {
            path: 'tazrimExample',
            component: TazrimExampleComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'landingPage',
            component: landingPageMetzalemComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'financialManagement',
            loadChildren: () => import('./financialManagement/customers-financialManagement.module').then(m => m.CustomersFinancialManagementModule)
          },
          {
            path: 'cash-flow',
            loadChildren: () => import('./tazrim/customers-tazrim.module').then(m => m.CustomersTazrimModule)
          },
          {
            path: 'accountancy',
            loadChildren: () => import('./accountancy/customers-accountancy.module').then(m => m.CustomersAccountancyModule)
          },
          {
            path: 'settings',
            loadChildren: () => import('./settings/customers-settings.module').then(m => m.CustomersSettingsModule)
          },
          {
            path: 'admin',
            loadChildren: () => import('../admin/admin.module').then(m => m.AdminModule),
            canLoad: [AdminGuard]
          },
          {
            path: 'messages',
            loadChildren: () => import('./messages/customers-messages.module').then(m => m.CustomersMessagesModule)
          },
          {
            path: 'billing',
            loadChildren: () => import('./billing/customers-billing.module').then(m => m.CustomersBillingModule)
          },
          {
            path: 'packages',
            loadChildren: () => import('./packages/customers-packages.module').then(m => m.CustomersPackagesModule)
          },
          {
            path: 'budget',
            loadChildren: () => import('./budget/customers-budget.module').then(m => m.CustomersBudgetModule)
          },
          {
            path: 'help-center',
            loadChildren: () => import('./help-center/help-center.module').then(m => m.HelpCenterModule)
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersRoutes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule {}
