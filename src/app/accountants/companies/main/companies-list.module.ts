import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CompaniesListRouting} from '@app/accountants/companies/main/companies-list-routing.module';

import {CompaniesListComponent} from '@app/accountants/companies/main/companies-list.component';
import {CompanyProductsComponent} from '@app/accountants/companies/main/companyProducts/company-products.component';
import {AddProductsComponent} from '@app/accountants/companies/main/companyProducts/addProducts/add-products.component';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {GeneralComponent} from '@app/accountants/companies/general/general.component';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        CompaniesListRouting,
        MatSlideToggleModule
    ],
    declarations: [
        CompaniesListComponent,
        CompanyProductsComponent,
        AddProductsComponent
    ],
    exports: [],
    providers: [GeneralComponent]
})
export class CompaniesListModule {
}
