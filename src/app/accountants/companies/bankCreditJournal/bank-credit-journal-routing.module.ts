import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {BankCreditJournalComponent} from '@app/accountants/companies/bankCreditJournal/bank-credit-journal.component';

const screensRouting: Routes = [
    {
        path: '',
        component: BankCreditJournalComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(screensRouting)],
    exports: [RouterModule]
})
export class BankCreditJournalRouting {
}
