import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {JournalTransComponent} from './journal-trans.component';
import {SuppliersAndCustomersComponent} from './suppliersAndCustomers/suppliers-and-customers.component';
import {AuthGuard} from '@app/login/auth-guard.service';

const journalTransRoutes: Routes = [
    {
        path: '',
        component: JournalTransComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'suppliersAndCustomers',
                loadChildren: () => import('@app/accountants/companies/journalTrans/suppliersAndCustomers/suppliers-and-customers.module').then(m => m.SuppliersAndCustomersModule)
            },
            {
                path: 'bankAndCredit',
                loadChildren: () => import('@app/accountants/companies/journalTrans/bankAndCredit/bank-and-credit.module').then(m => m.BankAndCreditModule)
            },
            {path: '', redirectTo: 'suppliersAndCustomers', pathMatch: 'full'}
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(journalTransRoutes)],
    exports: [RouterModule]
})
export class JournalTransRoutingModule {
}
