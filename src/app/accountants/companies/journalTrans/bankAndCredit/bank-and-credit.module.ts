import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedModule} from '@app/shared/shared.module';
import {BankAndCreditComponent} from './bank-and-credit.component';
import {BankAndCreditRoutingModule} from '@app/accountants/companies/journalTrans/bankAndCredit/bank-and-credit-routing.module';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        BankAndCreditRoutingModule
    ],
    declarations: [BankAndCreditComponent],
    providers: []
})
export class BankAndCreditModule {
}
