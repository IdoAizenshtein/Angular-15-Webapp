import {NgModule} from '@angular/core';
import {Router, RouterModule, Routes} from '@angular/router';

import {AuthGuard} from '@app/login/auth-guard.service';
import {CustomersTazrimBankmatchComponent} from './customers-tazrim-bankmatch.component';

import {TazrimBankmatchBankComponent} from './movementsMatching/bank/tazrim-bankmatch-bank.component';
import {TazrimBankmatchCasflowComponent} from './movementsMatching/casflow/tazrim-bankmatch-casflow.component';
import {
    TazrimBankmatchMatchedMovementsComponent
} from './matchedMovements/tazrim-bankmatch-matched-movements.component';
import {HttpServices} from '@app/shared/services/http.services';
import {UserDefaultsResolver} from '../user-defaults-resolver.service';
import {StorageService} from "@app/shared/services/storage.service";

const customersTazrimBankmatchRoutingModule: Routes = [
    {
        path: '',
        canActivateChild: [AuthGuard],
        component: CustomersTazrimBankmatchComponent,
        children: [
            {
                path: '',
                pathMatch: 'full',
                // canActivate: [UserDefaultsResolver] // ,
                redirectTo: 'bank'
            },
            {
                path: 'bank',
                canActivateChild: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: TazrimBankmatchBankComponent,
                        canActivate: [AuthGuard],
                        pathMatch: 'full'
                    },
                    {
                        path: 'matched',
                        component: TazrimBankmatchMatchedMovementsComponent,
                        canActivate: [AuthGuard]
                    }
                ]
            },
            {
                path: 'casflow',
                canActivate: [AuthGuard],
                children: [
                    {
                        path: '',
                        component: TazrimBankmatchCasflowComponent,
                        canActivate: [AuthGuard],
                        pathMatch: 'full'
                    },
                    {
                        path: 'matched',
                        component: TazrimBankmatchMatchedMovementsComponent,
                        canActivate: [AuthGuard]
                    }
                ]
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(customersTazrimBankmatchRoutingModule)],
    exports: [RouterModule],
    providers: [
        {
            provide: UserDefaultsResolver,
            useFactory: (httpServices: HttpServices, router: Router, storageService: StorageService) => {
                return new UserDefaultsResolver(
                    httpServices,
                    router,
                    'bankmatch',
                    storageService,
                    'bank'
                );
            },
            deps: [HttpServices, Router, StorageService]
        }
    ]
})
export class CustomersTazrimBankmatchRoutingModule {
}
