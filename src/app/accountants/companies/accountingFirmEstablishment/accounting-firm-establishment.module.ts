import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    AccountingFirmEstablishmentRoutingModule
} from '@app/accountants/companies/accountingFirmEstablishment/accounting-firm-establishment-routing.module';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';
import {
    AccountingFirmEstablishmentComponent
} from '@app/accountants/companies/accountingFirmEstablishment/accounting-firm-establishment.component';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        AccountingFirmEstablishmentRoutingModule
    ],
    declarations: [
        AccountingFirmEstablishmentComponent
    ],
    providers: []
})
export class AccountingFirmEstablishmentModule {
}
