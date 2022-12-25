import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {GeneralComponent} from '@app/accountants/companies/general/general.component';
import {DetailsComponent} from '@app/accountants/companies/general/details/details.component';
import {GeneralCompanyComponent} from '@app/accountants/companies/general/generalCompany/general-company.component';
import {AccountComponent} from '@app/accountants/companies/general/account/account.component';
import {CreditCardComponent} from '@app/accountants/companies/general/creditCard/credit-card.component';
import {ExportComponent} from '@app/accountants/companies/general/export/export.component';
import {AccountingCardsComponent} from '@app/accountants/companies/general/accountingCards/accounting-cards.component';
import {TransTypeComponent} from '@app/accountants/companies/general/transType/transType.component';
import {
    JournalVendorAndCustomerComponent
} from '@app/accountants/companies/general/journalVendorAndCustomer/journal-vendor-and-customer.component';
import {JournalBankAndCreditComponent} from '@app/accountants/companies/general/journalBankAndCredit/journal-bank-and-credit.component';
import {ContactsComponent} from '@app/accountants/companies/general/contacts/contacts.component';
import {ManagementComponent} from '@app/accountants/companies/general/management/management.component';

const generalRoutes: Routes = [
    {
        path: '',
        component: GeneralComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: 'details',
                component: DetailsComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'general',
                component: GeneralCompanyComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'account',
                component: AccountComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'creditCard',
                component: CreditCardComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'export',
                component: ExportComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'accountingCards',
                component: AccountingCardsComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'transType',
                component: TransTypeComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'journalVendorAndCustomer',
                component: JournalVendorAndCustomerComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'journalBankAndCredit',
                component: JournalBankAndCreditComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'contacts',
                component: ContactsComponent,
                canActivate: [AuthGuard]
            },
            {
                path: 'management',
                component: ManagementComponent,
                canActivate: [AuthGuard]
            },
            {path: '', redirectTo: 'details', pathMatch: 'full'},
            {path: '**', component: DetailsComponent}
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(generalRoutes)],
    exports: [RouterModule]
})
export class GeneralRoutingModule {
}
