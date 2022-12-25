import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@app/login/auth-guard.service';

const customersTazrimRoutingRoutes: Routes = [
  {
    path: '',
    redirectTo: 'daily',
    pathMatch: 'full'
  },
  {
    path: 'daily',
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./daily/customers-tazrim-daily.module').then(m => m.CustomersTazrimDailyModule)
  },
  {
    path: 'bankmatch',
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./bankmatch/customers-tazrim-bankmatch.module').then(m => m.CustomersTazrimBankmatchModule)
  },
  {
    path: 'fixedMovements',
    canActivateChild: [AuthGuard],
    loadChildren: () => import('./fixedMovements/customers-tazrim-fixedMovements.module').then(m => m.CustomersTazrimFixedMovementsModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersTazrimRoutingRoutes)],
  exports: [RouterModule]
})
export class CustomersTazrimRoutingModule {}
