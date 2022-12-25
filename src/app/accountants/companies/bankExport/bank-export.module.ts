import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedModule} from '@app/shared/shared.module';
import {BankExportRouting} from '@app/accountants/companies/bankExport/bank-export-routing.module';
import {BankExportComponent} from '@app/accountants/companies/bankExport/bank-export.component';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        BankExportRouting
    ],
    declarations: [
        BankExportComponent
    ],
    providers: []
})
export class BankExportModule {
}
