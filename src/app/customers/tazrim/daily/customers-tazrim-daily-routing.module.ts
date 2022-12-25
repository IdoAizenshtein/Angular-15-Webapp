import { NgModule } from '@angular/core';
import { Router, RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@app/login/auth-guard.service';
import { CustomersTazrimDailyComponent } from './customers-tazrim-daily.component';

import { TazrimDailyAggregateComponent } from './aggregate/tazrim-daily-aggregate.component';
import { TazrimDailyDetailsComponent } from './details/tazrim-daily-details.component';
import { TazrimDailyGraphComponent } from './graph/tazrim-daily-graph.component';
import { UserDefaultsResolver } from '../user-defaults-resolver.service';
import { HttpServices } from '@app/shared/services/http.services';
import {EmptyComponent} from "@app/empty.component";
import {StorageService} from "@app/shared/services/storage.service";

const customersTazrimDailyRoutingModule: Routes = [
  {
    path: '',
    canActivateChild: [AuthGuard],
    component: CustomersTazrimDailyComponent,
    children: [
      {
        path: '',
        component: EmptyComponent,
        canActivate: [UserDefaultsResolver]
      },
      {
        path: 'aggregate',
        component: TazrimDailyAggregateComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'details',
        component: TazrimDailyDetailsComponent,
        canActivate: [AuthGuard]
      },
      {
        path: 'graph',
        component: TazrimDailyGraphComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersTazrimDailyRoutingModule)],
  exports: [RouterModule],
  providers: [
    {
      provide: UserDefaultsResolver,
      useFactory: (httpServices: HttpServices, router: Router, storageService: StorageService) => {
        return new UserDefaultsResolver(httpServices, router, 'daily', storageService);
      },
      deps: [HttpServices, Router, StorageService]
    }
  ]
})
export class CustomersTazrimDailyRoutingModule {}
