import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthGuard } from '@app/login/auth-guard.service';
import { CustomersMessagesComponent } from './customers-messages.component';

const customersMessagesRoutes: Routes = [
  {
    path: '',
    component: CustomersMessagesComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersMessagesRoutes)],
  exports: [RouterModule]
})
export class CustomersMessagesRoutingModule {}
