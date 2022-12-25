import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BankAndCreditComponent} from './bank-and-credit.component';
import {AuthGuard} from '@app/login/auth-guard.service';

const screensRoutes: Routes = [
    {
        path: '',
        component: BankAndCreditComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(screensRoutes)],
    exports: [RouterModule]
})
export class BankAndCreditRoutingModule {
}
