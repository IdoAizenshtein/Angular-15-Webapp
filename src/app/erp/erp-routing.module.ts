import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ErpComponent} from './erp.component';
import {MainAccountManagementComponent} from './accountManagement/main-accountManagement.component';
import {RemoveFromListComponent} from './removeFromList/remove-from-list.component';
import {CustomersHelpCenterComponent} from './help-center/customers-help-center.component';

const activationRoutes: Routes = [
    {
        path: 'api-account-management',
        component: ErpComponent,
        children: [
            {
                path: 'accountManagement',
                component: MainAccountManagementComponent
            },
            {
                path: 'help-center',
                component: CustomersHelpCenterComponent
            }
        ]
    },
    {
        path: 'removeFromList',
        component: ErpComponent,
        children: [
            {
                path: '',
                component: RemoveFromListComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(activationRoutes)],
    exports: [RouterModule]
})
export class ErpRoutingModule {
}

// http://localhost:4200/api-account-management?station_id=CA75CF8D-7CA3-762D-E053-0B6519AC6F88
