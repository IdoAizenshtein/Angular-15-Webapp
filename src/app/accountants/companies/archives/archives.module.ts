import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ArchivesRoutingModule} from '@app/accountants/companies/archives/archives-routing.module';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        ArchivesRoutingModule
    ],
    declarations: [],
    providers: []
})
export class ArchivesModule {
}
