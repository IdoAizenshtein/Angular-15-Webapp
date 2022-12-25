import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {BankExportComponent} from '@app/accountants/companies/bankExport/bank-export.component';

const screensRouting: Routes = [
    {
        path: '',
        component: BankExportComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(screensRouting)],
    exports: [RouterModule]
})
export class BankExportRouting {
}
