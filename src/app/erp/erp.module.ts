import {NgModule} from '@angular/core';
import {SharedModule} from '@app/shared/shared.module';

import {ErpRoutingModule} from './erp-routing.module';
import {ErpComponent} from './erp.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {ErpService} from './erp.service';
import {MainAccountManagementComponent} from './accountManagement/main-accountManagement.component';
import {RemoveFromListComponent} from './removeFromList/remove-from-list.component';
import {CustomersHelpCenterComponent} from './help-center/customers-help-center.component';
import {FilterSearchablesPipe} from './help-center/filter-searchables.pipe';

@NgModule({
    imports: [SharedModule, ErpRoutingModule],
    declarations: [
        ErpComponent,
        MainAccountManagementComponent,
        RemoveFromListComponent,
        CustomersHelpCenterComponent,
        FilterSearchablesPipe
    ],
    providers: [BrowserService, ErpService, FilterSearchablesPipe]
})
export class ErpModule {
}
