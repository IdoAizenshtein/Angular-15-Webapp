import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@app/login/auth-guard.service';
import { CustomersPackagesComponent } from './customers-packages.component';

const customersPackagesRoutes: Routes = [
  {
    path: '',
    component: CustomersPackagesComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersPackagesRoutes)],
  exports: [RouterModule]
})
export class CustomersPackagesRoutingModule {}
