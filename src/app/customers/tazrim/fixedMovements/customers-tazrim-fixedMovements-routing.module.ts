import {NgModule} from '@angular/core';
import {Router, RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '@app/login/auth-guard.service';
import {UserDefaultsResolver} from '../user-defaults-resolver.service';
import {HttpServices} from '@app/shared/services/http.services';
import {CustomersTazrimFixedMovementsComponent} from './customers-tazrim-fixedMovements.component';
import {TazrimFixedMovementsDetailsComponent} from './details/tazrim-fixedMovements-details.component';
import {EmptyComponent} from "@app/empty.component";
import {StorageService} from "@app/shared/services/storage.service";

const customersTazrimFixedMovementsRoutingModule: Routes = [
    {
        path: '',
        canActivateChild: [AuthGuard],
        component: CustomersTazrimFixedMovementsComponent,
        children: [
            {
                path: '',
                component: EmptyComponent,
                canActivate: [UserDefaultsResolver]
            },
            {
                path: 'details',
                component: TazrimFixedMovementsDetailsComponent,
                canActivate: [AuthGuard]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(customersTazrimFixedMovementsRoutingModule)],
    exports: [RouterModule],
    providers: [
        {
            provide: UserDefaultsResolver,
            useFactory: (httpServices: HttpServices, router: Router, storageService: StorageService) => {
                return new UserDefaultsResolver(
                    httpServices,
                    router,
                    'fixedMovements',
                    storageService,
                    'details'
                );
            },
            deps: [HttpServices, Router, StorageService]
        }
    ]
})
export class CustomersTazrimFixedMovementsRoutingModule {
}
