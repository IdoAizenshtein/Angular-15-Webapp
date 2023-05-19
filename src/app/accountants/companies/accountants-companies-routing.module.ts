import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {AdminGuard} from '@app/admin/admin-guard.service';

const accountantsCompaniesRoutes: Routes = [
    {
        path: '',
        loadChildren: () => import('@app/accountants/companies/main/companies-list.module').then(m => m.CompaniesListModule)
    },
    {
        path: 'journalTrans',
        loadChildren: () => import('@app/accountants/companies/journalTrans/journal-trans.module').then(m => m.JournalTransModule)
    },
    {
        path: 'archives',
        loadChildren: () => import('@app/accountants/companies/archives/archives.module').then(m => m.ArchivesModule)
    },
    {
        path: 'general',
        loadChildren: () => import('@app/accountants/companies/general/general.module').then(m => m.GeneralModule)
    },
    {
        path: 'accountingFirmEstablishment',
        loadChildren: () => import('@app/accountants/companies/accountingFirmEstablishment/accounting-firm-establishment.module').then(m => m.AccountingFirmEstablishmentModule)
    },
    {
        path: 'supplierCustomersJournal',
        loadChildren: () => import('@app/accountants/companies/supplierCustomersJournal/supplier-customers-journal.module').then(m => m.SupplierCustomersJournalModule)
    },
    {
        path: 'bankCreditJournal',
        loadChildren: () => import('@app/accountants/companies/bankCreditJournal/bank-credit-journal.module').then(m => m.BankCreditJournalModule)
    },
    {
        path: 'bankExport',
        loadChildren: () => import('@app/accountants/companies/bankExport/bank-export.module').then(m => m.BankExportModule)
    },
    {
        path: 'bankmatch',
        canActivateChild: [AuthGuard],
        loadChildren: () => import('@app/customers/tazrim/bankmatch/customers-tazrim-bankmatch.module').then(m => m.CustomersTazrimBankmatchModule)
    },
    {
        path: 'generalScreen',
        loadChildren: () => import('@app/customers/general/customers-general.module').then(m => m.CustomersGeneralModule)
    },
    {
        path: 'financialManagement',
        loadChildren: () => import('@app/customers/financialManagement/customers-financialManagement.module').then(m => m.CustomersFinancialManagementModule)
    },
    {
        path: 'cash-flow',
        loadChildren: () => import('@app/customers/tazrim/customers-tazrim.module').then(m => m.CustomersTazrimModule)
    },
    {
        path: 'accountancy',
        loadChildren: () => import('@app/customers/accountancy/customers-accountancy.module').then(m => m.CustomersAccountancyModule)
    },
    {
        path: 'settings',
        loadChildren: () => import('@app/customers/settings/customers-settings.module').then(m => m.CustomersSettingsModule)
    },
    {
        path: 'messages',
        loadChildren: () => import('@app/customers/messages/customers-messages.module').then(m => m.CustomersMessagesModule)
    },
    {
        path: 'billing',
        loadChildren: () => import('@app/customers/billing/customers-billing.module').then(m => m.CustomersBillingModule)
    },
    {
        path: 'packages',
        loadChildren: () => import('@app/customers/packages/customers-packages.module').then(m => m.CustomersPackagesModule)
    },
    {
        path: 'budget',
        loadChildren: () => import('@app/customers/budget/customers-budget.module').then(m => m.CustomersBudgetModule)
    },
    {
        path: 'help-center',
        loadChildren: () => import('@app/customers/help-center/help-center.module').then(m => m.HelpCenterModule)
    }
];

@NgModule({
    imports: [RouterModule.forChild(accountantsCompaniesRoutes)],
    exports: [RouterModule]
})
export class AccountantsCompaniesRoutingModule {
}
