import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomersSettingsComponent } from './customers-settings.component';

import { CustomersSettingsRoutingModule } from './customers-settings-routing.module';
import { SettingsMyaccountComponent } from './myaccount/settings-myaccount.component';
import { SettingsBusinessDetailsComponent } from './businessDetails/settings-businessDetails.component';
import { SettingsOfficeDetailsComponent } from './officeDetails/settings-officeDetails.component';

import { SettingsBankAccountsComponent } from './bankAccounts/settings-bankAccounts.component';
import { SettingsCreditCardComponent } from './creditCard/settings-creditCard.component';
import { SettingsSlikaAccountsComponent } from './slikaAccounts/settings-slikaAccounts.component';
import { SettingsAlertsComponent } from './alerts/settings-alerts.component';
import { SettingsBookKeepingAccountsComponent } from './bookKeepingAccounts/settings-bookKeepingAccounts.component';
import { SettingsOfficeUsersComponent } from './officeUsers/settings-officeUsers.component';

import { SharedModule } from '@app/shared/shared.module';
import { SettingsUsersComponent } from './users/settings-users.component';
import { SettingsUserListComponent } from './users/user-list/settings-user-list.component';
import { SettingsUserDetailsComponent } from './users/user-details/settings-user-details.component';
// import {AutoCompleteModule} from 'primeng/autocomplete';
import { AutocompleteEmptyOptionedComponent } from '@app/shared/component/autocomplete-empty-optioned/autocomplete-empty-optioned.component';
import {ProductSettingsComponent} from '@app/customers/settings/productSettings/product-settings.component';

@NgModule({
  imports: [
    SharedModule,
    CommonModule,
    CustomersSettingsRoutingModule
    // AutoCompleteModule
  ],
  declarations: [
    CustomersSettingsComponent,
    SettingsMyaccountComponent,
    SettingsBusinessDetailsComponent,
    SettingsOfficeDetailsComponent,
    SettingsBankAccountsComponent,
    SettingsCreditCardComponent,
    SettingsSlikaAccountsComponent,
    SettingsAlertsComponent,
    SettingsBookKeepingAccountsComponent,
    SettingsUsersComponent,
    SettingsUserListComponent,
    SettingsUserDetailsComponent,
    SettingsOfficeUsersComponent,
    AutocompleteEmptyOptionedComponent,
    ProductSettingsComponent
  ]
})
export class CustomersSettingsModule {}
