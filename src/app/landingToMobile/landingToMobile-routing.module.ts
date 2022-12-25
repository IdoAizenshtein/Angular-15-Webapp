import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LandingToMobileComponent } from './landingToMobile.component';

const landingToMobileRoutes: Routes = [
  { path: 'landingToMobile', component: LandingToMobileComponent }
];

@NgModule({
  imports: [RouterModule.forChild(landingToMobileRoutes)],
  exports: [RouterModule]
})
export class LandingToMobileRoutingModule {}
