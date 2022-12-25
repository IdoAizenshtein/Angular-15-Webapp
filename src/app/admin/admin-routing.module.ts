import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {AdminComponent} from './admin.component';
import {SearchkeyCatalogComponent} from './searchkey-catalog/searchkey-catalog.component';
import {AuthGuard} from '../login/auth-guard.service';
import {AdminGuard} from './admin-guard.service';

const adminRoutes: Routes = [
    {
        path: '',
        component: AdminComponent,
        canActivate: [AuthGuard, AdminGuard],
        children: [
            {
                path: '',
                canActivateChild: [AuthGuard, AdminGuard],
                children: [
                    {
                        path: '',
                        redirectTo: 'searchkey-catalog',
                        pathMatch: 'prefix'
                    },
                    {
                        path: 'searchkey-catalog',
                        component: SearchkeyCatalogComponent,
                        canActivate: [AuthGuard, AdminGuard]
                    }
                ]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(adminRoutes)],
    exports: [RouterModule]
})
export class AdminRoutingModule {
}
