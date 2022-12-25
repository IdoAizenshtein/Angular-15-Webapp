import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@app/login/auth-guard.service';
import { CustomersFinancialManagementChecksComponent } from './customers-financialManagement-checks.component';
import { FinancialManagementChecksDetailsComponent } from './details/financialManagement-checks-details.component';

import { UserDefaultsResolver } from '../user-defaults-resolver.service';
import { HttpServices } from '@app/shared/services/http.services';
import {EmptyComponent} from "@app/empty.component";
import {StorageService} from "@app/shared/services/storage.service";

const customersFinancialManagementChecksRoutingModule: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuard],
    component: CustomersFinancialManagementChecksComponent,
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [UserDefaultsResolver]
      },
      {
        path: 'in-checks',
        component: FinancialManagementChecksDetailsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'out-checks',
        component: FinancialManagementChecksDetailsComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(customersFinancialManagementChecksRoutingModule)
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: UserDefaultsResolver,
      useFactory: (httpServices: HttpServices, router: Router, storageService: StorageService) => {
        return new UserDefaultsResolver(httpServices, router, 'checks', storageService);
      },
      deps: [HttpServices, Router, StorageService]
    }
  ]
})
export class CustomersFinancialManagementBankAccountRoutingModule {}
