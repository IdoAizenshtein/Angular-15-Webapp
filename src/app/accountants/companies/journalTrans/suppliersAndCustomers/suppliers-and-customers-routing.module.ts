import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SuppliersAndCustomersComponent} from './suppliers-and-customers.component';
import {AuthGuard} from '@app/login/auth-guard.service';

const screensRoutes: Routes = [
    {
        path: '',
        component: SuppliersAndCustomersComponent,
        canActivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(screensRoutes)],
    exports: [RouterModule]
})
export class SuppliersAndCustomersRoutingModule {
}
