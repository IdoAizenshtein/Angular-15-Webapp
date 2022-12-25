import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedModule} from '@app/shared/shared.module';
import {BankCreditJournalRouting} from '@app/accountants/companies/bankCreditJournal/bank-credit-journal-routing.module';
import {BankCreditJournalComponent} from '@app/accountants/companies/bankCreditJournal/bank-credit-journal.component';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        BankCreditJournalRouting
    ],
    declarations: [
        BankCreditJournalComponent
    ],
    providers: []
})
export class BankCreditJournalModule {
}
