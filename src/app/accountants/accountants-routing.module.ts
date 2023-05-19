import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

import {SharedComponent} from '@app/shared/component/shared.component';
import {AuthGuard} from '../login/auth-guard.service';
import {EmptyComponent} from '@app/accountants/companies/empty.component';
import {AdminGuard} from '@app/admin/admin-guard.service';

const accountantsRoutes: Routes = [
    {
        path: '',
        component: SharedComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                canActivateChild: [AuthGuard],
                children: [
                    {
                        path: '',
                        redirectTo: 'companies',
                        pathMatch: 'full'
                    },
                    {
                        path: 'companies',
                        loadChildren: () => import('./companies/accountants-companies.module').then(m => m.AccountantsCompaniesModule)
                    },
                    {
                        path: 'admin',
                        loadChildren: () => import('@app/admin/admin.module').then(m => m.AdminModule),
                        canLoad: [AdminGuard]
                    },
                    {
                        path: 'main',
                        component: EmptyComponent
                    },
                    {
                        path: 'reports',
                        component: EmptyComponent
                    }
                ]
            }
        ]
    }
];

@NgModule({
    imports: [
        RouterModule.forChild(
            accountantsRoutes
        )
    ],
    exports: [
        RouterModule
    ]
})
export class AccountantsRoutingModule {
}
