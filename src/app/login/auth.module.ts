import {NgModule} from '@angular/core';
import {SharedModule} from '@app/shared/shared.module';

import {AuthGuard} from './auth-guard.service';
import {LoginRoutingModule} from './login-routing.module';
import {LoginComponent} from './login/login.component';
import {ResetPasswordComponent} from './resetPassword/resetPassword.component';
import {BrowserService} from '@app/shared/services/browser.service';

@NgModule({
    imports: [SharedModule, LoginRoutingModule],
    declarations: [LoginComponent, ResetPasswordComponent],
    providers: [AuthGuard, BrowserService]
})
export class AuthModule {
}
