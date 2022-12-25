import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {SupplierCustomersJournalComponent} from '@app/accountants/companies/supplierCustomersJournal/supplier-customers-journal.component';

const supplierCustomersJournalRouting: Routes = [
    {
        path: '',
        component: SupplierCustomersJournalComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(supplierCustomersJournalRouting)],
    exports: [RouterModule]
})
export class SupplierCustomersJournalRouting {
}
