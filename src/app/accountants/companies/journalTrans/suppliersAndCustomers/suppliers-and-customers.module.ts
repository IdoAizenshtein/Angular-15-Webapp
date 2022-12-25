import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SuppliersAndCustomersComponent} from './suppliers-and-customers.component';
import {
    SuppliersAndCustomersRoutingModule
} from '@app/accountants/companies/journalTrans/suppliersAndCustomers/suppliers-and-customers-routing.module';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        SuppliersAndCustomersRoutingModule
    ],
    declarations: [SuppliersAndCustomersComponent],
    providers: []
})
export class SuppliersAndCustomersModule {
}
