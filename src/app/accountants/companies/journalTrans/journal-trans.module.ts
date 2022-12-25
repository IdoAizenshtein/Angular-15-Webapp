import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SharedModule} from '@app/shared/shared.module';
import {JournalTransRoutingModule} from '@app/accountants/companies/journalTrans/journal-trans-routing.module';
import {JournalTransComponent} from './journal-trans.component';
import {SharedAccountantsModule} from '@app/accountants/companies/shared/shared-accountants.module';

@NgModule({
    imports: [
        CommonModule,
        SharedAccountantsModule,
        JournalTransRoutingModule
    ],
    declarations: [JournalTransComponent],
    providers: []
})
export class JournalTransModule {
}
