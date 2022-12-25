import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@app/login/auth-guard.service';
import { CustomersFinancialManagementBankAccountComponent } from './customers-financialManagement-bankAccount.component';

import { FinancialManagementBankAccountAggregateComponent } from './aggregate/financialManagement-bankAccount-aggregate.component';
import { FinancialManagementBankAccountDetailsComponent } from './details/financialManagement-bankAccount-details.component';
import { FinancialManagementBankAccountGraphComponent } from './graph/financialManagement-bankAccount-graph.component';
import { HttpServices } from '@app/shared/services/http.services';
import { UserDefaultsResolver} from '../user-defaults-resolver.service';
import {EmptyComponent} from "@app/empty.component";
import {StorageService} from "@app/shared/services/storage.service";

const customersFinancialManagementBankAccountRoutingModule: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuard],
    component: CustomersFinancialManagementBankAccountComponent,
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [UserDefaultsResolver]
      },
      {
        path: 'aggregate',
        component: FinancialManagementBankAccountAggregateComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'details',
        component: FinancialManagementBankAccountDetailsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'graph',
        component: FinancialManagementBankAccountGraphComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(customersFinancialManagementBankAccountRoutingModule)
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: UserDefaultsResolver,
      useFactory: (httpServices: HttpServices, router: Router, storageService: StorageService) => {
        return new UserDefaultsResolver(httpServices, router, 'bankAccount', storageService);
      },
      deps: [HttpServices, Router, StorageService]
    }
  ]
})
export class CustomersFinancialManagementBankAccountRoutingModule {}









