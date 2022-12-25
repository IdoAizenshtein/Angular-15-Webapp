import { Injectable, NgModule } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChild,
  Router,
  RouterModule,
  RouterStateSnapshot,
  Routes
} from '@angular/router';
import { SignupComponent } from './signup/signup.component';
import { SignupMobileComponent } from './signup-mobile/signup-mobile.component';
import { MobileGuard } from './mobile.guard';
import { DesktopGuard } from './desktop.guard';
import { SignupPersonalDataComponent } from './signup/personal-data/signup-personal-data.component';
import { SignupAccountDataComponent } from './signup/account-data/signup-account-data.component';
import { SignupBusinessDataComponent } from './signup/business-data/signup-business-data.component';
import { SignupTokenTrackComponent } from './signup/token-track/signup-token-track.component';
import { SignupService } from './signup.service';
import { SignupMobilePersonalDataComponent } from './signup-mobile/personal-data/signup-mobile-personal-data.component';
import { SignupMobileBusinessDataComponent } from './signup-mobile/business-data/signup-mobile-business-data.component';
import { SignupMobileAccountDataComponent } from './signup-mobile/account-data/signup-mobile-account-data.component';
import { SignupMobileTokenTrackComponent } from './signup-mobile/token-track/signup-mobile-token-track.component';

@Injectable({
  providedIn: 'root'
})
export class StepConsistencyGuard implements CanActivateChild {
  constructor(private signupService: SignupService, private router: Router) {}

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const parentConf = route.parent.routeConfig;
    // debugger;
    const childToActivateIdx = parentConf.children.findIndex(
      (ch) => ch.path === route.routeConfig.path
    );
    let result: boolean;
    let redirectStepUrl: string;
    if (!this.signupService.lastFinishedStepIdx) {
      result = childToActivateIdx === 1;
      redirectStepUrl = 'personal-data';
    } else {
      result = childToActivateIdx - this.signupService.lastFinishedStepIdx <= 1;
      redirectStepUrl =
        parentConf.children[
          Math.max(
            parentConf.children.length - 1,
            this.signupService.lastFinishedStepIdx + 1
          )
        ].path;
    }

    if (!result) {
      this.router.navigate([parentConf.path, redirectStepUrl], {
        queryParamsHandling: 'preserve'
      });
    }
    return result;
  }
}

const signupRoutes: Routes = [
  {
    path: 'signup',
    component: SignupComponent,
    canActivate: [DesktopGuard],
    canActivateChild: [StepConsistencyGuard],
    children: [
      {
        path: '',
        redirectTo: 'personal-data',
        pathMatch: 'full'
      },
      {
        path: 'personal-data',
        component: SignupPersonalDataComponent
      },
      {
        path: 'business-data',
        component: SignupBusinessDataComponent
      },
      {
        path: 'account-data',
        component: SignupAccountDataComponent
      },
      {
        path: 'token-track',
        component: SignupTokenTrackComponent
      }
    ]
  },
  // {path: 'signup/:aggreementId', component: SignupComponent, canActivate: [DesktopGuard]},
  {
    path: 'm/signup',
    component: SignupMobileComponent,
    canActivate: [MobileGuard],
    canActivateChild: [StepConsistencyGuard],
    children: [
      {
        path: '',
        redirectTo: 'personal-data',
        pathMatch: 'full'
      },
      {
        path: 'personal-data',
        component: SignupMobilePersonalDataComponent
      },
      {
        path: 'business-data',
        component: SignupMobileBusinessDataComponent
      },
      {
        path: 'account-data',
        component: SignupMobileAccountDataComponent
      },
      {
        path: 'token-track',
        component: SignupMobileTokenTrackComponent
      }
    ]
  }
  // {path: 'm/signup/:aggreementId', component: SignupMobileComponent, canActivate: [MobileGuard]},
];

@NgModule({
  imports: [RouterModule.forChild(signupRoutes)],
  exports: [RouterModule]
})
export class SignupRoutingModule {}
