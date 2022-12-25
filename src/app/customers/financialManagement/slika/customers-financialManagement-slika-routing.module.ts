import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '../../../login/auth-guard.service';

import { CustomersFinancialManagementSlikaComponent } from './customers-financialManagement-slika.component';
import { FinancialManagementSlikaAggregateComponent } from './aggregate/financialManagement-slika-aggregate.component';
import { FinancialManagementSlikaDetailsComponent } from './details/financialManagement-slika-details.component';
import { FinancialManagementSlikaGraphComponent } from './graph/financialManagement-slika-graph.component';
import { HttpServices } from '@app/shared/services/http.services';
import { UserDefaultsResolver } from '../user-defaults-resolver.service';
import {EmptyComponent} from "@app/empty.component";
import {StorageService} from "@app/shared/services/storage.service";

const customersFinancialManagementSlikaRoutingModule: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuard],
    component: CustomersFinancialManagementSlikaComponent,
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [UserDefaultsResolver]
      },
      {
        path: 'aggregate',
        component: FinancialManagementSlikaAggregateComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'details',
        component: FinancialManagementSlikaDetailsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'graph',
        component: FinancialManagementSlikaGraphComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(customersFinancialManagementSlikaRoutingModule)
  ],
  exports: [RouterModule],
  providers: [
    {
      provide: UserDefaultsResolver,
      useFactory: (httpServices: HttpServices, router: Router, storageService: StorageService) => {
        return new UserDefaultsResolver(httpServices, router, 'slika', storageService);
      },
      deps: [HttpServices, Router, StorageService]
    }
  ]
})
export class CustomersFinancialManagementSlikaRoutingModule {}
