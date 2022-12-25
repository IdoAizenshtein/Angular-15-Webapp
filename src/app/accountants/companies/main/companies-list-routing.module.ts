import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {AuthGuard} from '@app/login/auth-guard.service';
import {CompaniesListComponent} from '@app/accountants/companies/main/companies-list.component';
import {CompanyProductsComponent} from '@app/accountants/companies/main/companyProducts/company-products.component';
import {AddProductsComponent} from '@app/accountants/companies/main/companyProducts/addProducts/add-products.component';

const screensRouting: Routes = [
    {
        path: '',
        canActivate: [AuthGuard],
        component: CompaniesListComponent
    },
    {
        path: 'companyProducts',
        canActivate: [AuthGuard],
        component: CompanyProductsComponent,
        children: [
            {
                path: 'addProducts',
                component: AddProductsComponent,
                canActivate: [AuthGuard]
            }
        ]
    },
];

@NgModule({
    imports: [RouterModule.forChild(screensRouting)],
    exports: [RouterModule]
})
export class CompaniesListRouting {
}
