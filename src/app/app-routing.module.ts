import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {PageNotFoundComponent} from './not-found.component';
import {NavigatePageComponent} from './navigate-page.component';

import {CanDeactivateGuard} from './login/can-deactivate-guard.service';
import {AuthGuard} from './login/auth-guard.service';
import {NetworkAwarePreloadingStrategyService} from './network-aware-preloading-strategy-service';

const appRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: NavigatePageComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'cfl',
        loadChildren: () => import('./customers/customers.module').then(m => m.CustomersModule),
        canLoad: [AuthGuard]
    },
    {
        path: 'accountants',
        loadChildren: () => import('./accountants/accountants.module').then(m => m.AccountantsModule),
        canLoad: [AuthGuard]
    },
    {path: '**', component: PageNotFoundComponent}
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes, {
            enableTracing: false,
            useHash: false,
            preloadingStrategy: NetworkAwarePreloadingStrategyService
        })
    ],
    exports: [RouterModule],
    providers: [
        CanDeactivateGuard,
        NetworkAwarePreloadingStrategyService
    ]
})
export class AppRoutingModule {
}
