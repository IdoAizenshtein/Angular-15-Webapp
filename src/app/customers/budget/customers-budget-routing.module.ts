import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersBudgetComponent } from './customers-budget.component';
import { AuthGuard } from '@app/login/auth-guard.service';

const customersBudgetRoutes: Routes = [
  {
    path: '',
    component: CustomersBudgetComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersBudgetRoutes)],
  exports: [RouterModule]
})
export class CustomersBudgetRoutingModule {}
