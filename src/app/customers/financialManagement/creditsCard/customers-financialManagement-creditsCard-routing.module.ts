import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@app/login/auth-guard.service';

import { CustomersFinancialManagementCreditsCardComponent } from './customers-financialManagement-creditsCard.component';
import { FinancialManagementCreditsCardAggregateComponent } from './aggregate/financialManagement-creditsCard-aggregate.component';
import { FinancialManagementCreditsCardDetailsComponent } from './details/financialManagement-creditsCard-details.component';
import { FinancialManagementCreditsCardGraphComponent } from './graph/financialManagement-creditsCard-graph.component';
import { UserDefaultsResolver } from '../user-defaults-resolver.service';
import { HttpServices } from '@app/shared/services/http.services';
import {EmptyComponent} from "@app/empty.component";
import {StorageService} from "@app/shared/services/storage.service";

const customersFinancialManagementCreditsCardRoutingModule: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuard],
    component: CustomersFinancialManagementCreditsCardComponent,
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [UserDefaultsResolver]
      },
      {
        path: 'aggregate',
        component: FinancialManagementCreditsCardAggregateComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'details',
        component: FinancialManagementCreditsCardDetailsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'graph',
        component: FinancialManagementCreditsCardGraphComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(customersFinancialManagementCreditsCardRoutingModule)
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: UserDefaultsResolver,
      useFactory: (httpServices: HttpServices, router: Router, storageService: StorageService) => {
        return new UserDefaultsResolver(httpServices, router, 'creditsCard', storageService);
      },
      deps: [HttpServices, Router, StorageService]
    }
  ]
})
export class CustomersFinancialManagementCreditsCardRoutingModule {}
