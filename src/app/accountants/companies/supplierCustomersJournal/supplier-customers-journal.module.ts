import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    SupplierCustomersJournalRouting
} from '@app/accountants/companies/supplierCustomersJournal/supplier-customers-journal-routing.module';
import {SupplierCustomersJournalComponent} from '@app/accountants/companies/supplierCustomersJournal/supplier-customers-journal.component';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        SupplierCustomersJournalRouting
    ],
    declarations: [
        SupplierCustomersJournalComponent
    ],
    providers: []
})
export class SupplierCustomersJournalModule {
}
