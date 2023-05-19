import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {
    AccountingFirmEstablishmentComponent
} from '@app/accountants/companies/accountingFirmEstablishment/accounting-firm-establishment.component';

const routing: Routes = [
    {
        path: '',
        component: AccountingFirmEstablishmentComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routing)],
    exports: [RouterModule]
})
export class AccountingFirmEstablishmentRoutingModule {
}
