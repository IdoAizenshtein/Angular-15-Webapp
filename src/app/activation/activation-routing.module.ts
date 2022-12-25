import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ActivationComponent } from './activation.component';
import { ActivationWoutSignupComponent } from './activation-wout-signup.component';
import { AgreementPageComponent } from './agreement-page.component';
// comment
const activationRoutes: Routes = [
  { path: 'activation', component: ActivationComponent },
  { path: 'activate-mail', component: ActivationComponent },
  { path: 'newUserMail', component: ActivationWoutSignupComponent },
  { path: 'agreement-page', component: AgreementPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(activationRoutes)],
  exports: [RouterModule]
})
export class ActivationRoutingModule {}
