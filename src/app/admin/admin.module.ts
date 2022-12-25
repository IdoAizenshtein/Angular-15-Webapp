import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {AdminRoutingModule} from './admin-routing.module';
import {SearchkeyCatalogComponent} from './searchkey-catalog/searchkey-catalog.component';
import {SharedModule} from '@app/shared/shared.module';
import {AdminComponent} from './admin.component';

@NgModule({
    imports: [SharedModule, CommonModule, AdminRoutingModule],
    declarations: [AdminComponent, SearchkeyCatalogComponent]
})
export class AdminModule {
}
