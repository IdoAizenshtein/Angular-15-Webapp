import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GeneralRoutingModule} from '@app/accountants/companies/general/general-routing.module';

import {GeneralComponent} from '@app/accountants/companies/general/general.component';
import {DetailsComponent} from '@app/accountants/companies/general/details/details.component';
import {GeneralCompanyComponent} from '@app/accountants/companies/general/generalCompany/general-company.component';
import {AccountComponent} from '@app/accountants/companies/general/account/account.component';
import {CreditCardComponent} from '@app/accountants/companies/general/creditCard/credit-card.component';
import {ExportComponent} from '@app/accountants/companies/general/export/export.component';
import {ManagementComponent} from '@app/accountants/companies/general/management/management.component';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        GeneralRoutingModule
    ],
    declarations: [
        GeneralComponent,
        DetailsComponent,
        GeneralCompanyComponent,
        AccountComponent,
        CreditCardComponent,
        ExportComponent,
        ManagementComponent
    ],
    providers: []
})
export class GeneralModule {
}
