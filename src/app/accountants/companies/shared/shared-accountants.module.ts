import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {
    AccountantsCompanySelectorComponent
} from '@app/accountants/companies/shared/accountants-company-selector/accountants-company-selector.component';
import {AccountantsDocComponent} from '@app/accountants/companies/shared/accountants-doc/accountants-doc.component';
import {
    ArchivesAdvancedSearchComponent
} from '@app/accountants/companies/shared/archives-advanced-search/archives-advanced-search.component';
import {ComingSoonComponent} from '@app/accountants/companies/shared/coming-soon/coming-soon.component';
import {CustSelectorComponent} from '@app/accountants/companies/shared/cust-selector/cust-selector.component';
import {DropdownEmptyOptionedComponent} from '@app/accountants/companies/shared/dropdown-empty-optioned/dropdown-empty-optioned.component';
import {FoldedCornerComponent} from '@app/accountants/companies/shared/folded-corner/folded-corner.component';
import {FoldersSelectorComponent} from '@app/accountants/companies/shared/folders-selector/folders-selector.component';
import {
    JournalTransAdvancedSearchComponent
} from '@app/accountants/companies/shared/journal-trans-advanced-search/journal-trans-advanced-search.component';
import {
    NewDocsAvailablePromptComponent
} from '@app/accountants/companies/shared/new-docs-available-prompt/new-docs-available-prompt.component';
import {DiffInUnitsBetweenDatesPipe} from '@app/accountants/companies/shared/diff-in-units-between-dates.pipe';
import {DndDirective} from '@app/accountants/companies/shared/dnd.directive';
import {FindInArrayByPipe} from '@app/accountants/companies/shared/find-in-array-by.pipe';
import {GeometryHelperService} from '@app/accountants/companies/shared/geometry-helper.service';
import {IfNotInPipe} from '@app/accountants/companies/shared/if-not-in.pipe';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {OcrFieldErrorTranslatePipe} from '@app/accountants/companies/shared/ocr-field-error-translate.pipe';
import {OcrStatusIconPipe} from '@app/accountants/companies/shared/ocr-status-icon.pipe';
import {StatusCounterValueFetchPipe} from '@app/accountants/companies/shared/status-counter-value-fetch.pipe';
import {VerticesArrayToPolygonPointsPipe} from '@app/accountants/companies/shared/vertices-array-to-polygon-points.pipe';
import {ContactsComponent} from '@app/accountants/companies/general/contacts/contacts.component';
import {ArchivesComponent} from '@app/accountants/companies/archives/archives.component';
import {AccountingCardsComponent} from '@app/accountants/companies/general/accountingCards/accounting-cards.component';
import {JournalBankAndCreditComponent} from '@app/accountants/companies/general/journalBankAndCredit/journal-bank-and-credit.component';
import {
    JournalVendorAndCustomerComponent
} from '@app/accountants/companies/general/journalVendorAndCustomer/journal-vendor-and-customer.component';
import {TransTypeComponent} from '@app/accountants/companies/general/transType/transType.component';
import {SharedModule} from '@app/shared/shared.module';

@NgModule({
    imports: [
        CommonModule,
        SharedModule
    ],
    providers: [
        DiffInUnitsBetweenDatesPipe,
        FindInArrayByPipe,
        GeometryHelperService,
        IfNotInPipe,
        OcrService,
        OcrFieldErrorTranslatePipe,
        OcrStatusIconPipe,
        StatusCounterValueFetchPipe,
        VerticesArrayToPolygonPointsPipe
    ],
    declarations: [
        AccountantsCompanySelectorComponent,
        AccountantsDocComponent,
        ArchivesAdvancedSearchComponent,
        ComingSoonComponent,
        CustSelectorComponent,
        DropdownEmptyOptionedComponent,
        FoldedCornerComponent,
        FoldersSelectorComponent,
        JournalTransAdvancedSearchComponent,
        NewDocsAvailablePromptComponent,
        DiffInUnitsBetweenDatesPipe,
        DndDirective,
        FindInArrayByPipe,
        IfNotInPipe,
        OcrFieldErrorTranslatePipe,
        OcrStatusIconPipe,
        StatusCounterValueFetchPipe,
        VerticesArrayToPolygonPointsPipe,
        ContactsComponent,
        ArchivesComponent,
        AccountingCardsComponent,
        JournalBankAndCreditComponent,
        JournalVendorAndCustomerComponent,
        TransTypeComponent
    ],
    exports: [
        AccountantsCompanySelectorComponent,
        AccountantsDocComponent,
        ArchivesAdvancedSearchComponent,
        ComingSoonComponent,
        CustSelectorComponent,
        DropdownEmptyOptionedComponent,
        FoldedCornerComponent,
        FoldersSelectorComponent,
        JournalTransAdvancedSearchComponent,
        NewDocsAvailablePromptComponent,
        DiffInUnitsBetweenDatesPipe,
        DndDirective,
        FindInArrayByPipe,
        IfNotInPipe,
        OcrFieldErrorTranslatePipe,
        OcrStatusIconPipe,
        StatusCounterValueFetchPipe,
        VerticesArrayToPolygonPointsPipe,
        ContactsComponent,
        ArchivesComponent,
        AccountingCardsComponent,
        JournalBankAndCreditComponent,
        JournalVendorAndCustomerComponent,
        TransTypeComponent,
        CommonModule,
        SharedModule
    ]
})
export class SharedAccountantsModule {
    constructor() {

    }
}
