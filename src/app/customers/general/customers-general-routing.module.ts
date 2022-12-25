import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CustomersGeneralComponent } from './customers-general.component';

import { AuthGuard } from '@app/login/auth-guard.service';

const customersGeneralRoutes: Routes = [
  {
    path: '',
    component: CustomersGeneralComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersGeneralRoutes)],
  exports: [RouterModule]
})
export class CustomersGeneralRoutingModule {}
