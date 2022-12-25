import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CustomersSettingsComponent } from './customers-settings.component';
import { AuthGuard } from '@app/login/auth-guard.service';
import { SettingsMyaccountComponent } from './myaccount/settings-myaccount.component';
import { SettingsBusinessDetailsComponent } from './businessDetails/settings-businessDetails.component';
import { SettingsOfficeDetailsComponent } from './officeDetails/settings-officeDetails.component';
import { SettingsBankAccountsComponent } from './bankAccounts/settings-bankAccounts.component';
import { SettingsCreditCardComponent } from './creditCard/settings-creditCard.component';
import { SettingsSlikaAccountsComponent } from './slikaAccounts/settings-slikaAccounts.component';
import { SettingsAlertsComponent } from './alerts/settings-alerts.component';
import { SettingsBookKeepingAccountsComponent } from './bookKeepingAccounts/settings-bookKeepingAccounts.component';
import { SettingsUsersComponent } from './users/settings-users.component';
import { SettingsUserDetailsComponent } from './users/user-details/settings-user-details.component';
import { SettingsUserListComponent } from './users/user-list/settings-user-list.component';
import { SettingsOfficeUsersComponent } from './officeUsers/settings-officeUsers.component';

const customersAccountancyRoutes: Routes = [
  {
    path: '',
    component: CustomersSettingsComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        canActivateChild: [AuthGuard],
        children: [
          {
            path: '',
            redirectTo: 'myaccount', // 'myaccount',
            pathMatch: 'prefix'
          },
          {
            path: 'myaccount',
            component: SettingsMyaccountComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'businessDetails',
            component: SettingsBusinessDetailsComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'officeDetails',
            component: SettingsOfficeDetailsComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'officeUsers',
            component: SettingsOfficeUsersComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'bankAccounts',
            component: SettingsBankAccountsComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'creditCard',
            component: SettingsCreditCardComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'slikaAccounts',
            component: SettingsSlikaAccountsComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'alerts',
            component: SettingsAlertsComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'bookKeepingAccounts',
            component: SettingsBookKeepingAccountsComponent,
            canActivate: [AuthGuard]
          },
          {
            path: 'users',
            component: SettingsUsersComponent,
            canActivate: [AuthGuard],
            children: [
              {
                path: '',
                component: SettingsUserListComponent,
                canActivateChild: [AuthGuard] // ,
                // children: [
                //     {
                //         path: ':userId',
                //         component: SettingsUserDetailsComponent
                //     }
                // ]
              },
              {
                path: ':userId',
                component: SettingsUserDetailsComponent,
                canActivateChild: [AuthGuard]
              }
            ]
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(customersAccountancyRoutes)],
  exports: [RouterModule]
})
export class CustomersSettingsRoutingModule {}
