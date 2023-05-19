import {NgModule} from '@angular/core';
import {CommonModule, NgOptimizedImage, TitleCasePipe} from '@angular/common';
import {TrimPipe} from './pipes/trim.pipe';
import {NoCommaPipe} from './pipes/noComma.pipe';
import {SortPipe} from './pipes/sort.pipe';
import {AccountSelectComponent} from './component/account-select/account-select.component';
import {AccountSelectByCurrencyComponent} from '@app/shared/component/account-select-by-currency/account-select-by-currency.component';
import {StatusesComponent} from '@app/shared/component/statuses/statuses.component';
import {CardsSelectComponent} from './component/cards-select/cards-select.component';
import {CardsSelectByCurrencyComponent} from './component/cards-select-by-currency/cards-select-by-currency.component';
import {SolekSelectComponent} from './component/solek-select/solek-select.component';
import {AccountDatesComponent} from './component/account-dates/account-dates.component';
import {TooltipCategoryComponent} from './component/tooltip-category/tooltip-category.component';
import {TooltipListComponent} from './component/tooltip-list/tooltip-list.component';
import {ChartsComponent} from './component/charts/charts.component';
import {ClickDocumentDirective} from './component/tooltip-list/click-document.directive';
import {SumViewComponent} from './component/sum-view/sum-view.component';
import {ScrollHeightDirective} from './directives/scrollHeight.directive';
import {SortableDirective} from './directives/sortable.directive';
import {VsForDirective} from './directives/vsFor.directive';
import {CdkTableModule} from '@angular/cdk/table';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {BidiModule} from '@angular/cdk/bidi';
import {FilterPipe, FilterPipeBiggerSmaller} from './pipes/filter.pipe';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {OverlayModule} from 'primeng/overlay';
import {SkeletonModule} from 'primeng/skeleton';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {ScrollPanelModule} from 'primeng/scrollpanel';


//Angular Material Components
import {MatLegacyCheckboxModule as MatCheckboxModule} from '@angular/material/legacy-checkbox';
import {MatNativeDateModule} from '@angular/material/core';
import {MatLegacyButtonModule as MatButtonModule} from '@angular/material/legacy-button';
import {MatLegacyInputModule as MatInputModule} from '@angular/material/legacy-input';
import {MatLegacyAutocompleteModule as MatAutocompleteModule} from '@angular/material/legacy-autocomplete';
import {MatLegacySelectModule as MatSelectModule} from '@angular/material/legacy-select';
import {MatLegacyMenuModule as MatMenuModule} from '@angular/material/legacy-menu';
import {MatLegacyListModule as MatListModule} from '@angular/material/legacy-list';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatExpansionModule} from '@angular/material/expansion';
import {MatIconModule} from '@angular/material/icon';
import {MatLegacyProgressSpinnerModule as MatProgressSpinnerModule} from '@angular/material/legacy-progress-spinner';
import {MatLegacyProgressBarModule as MatProgressBarModule} from '@angular/material/legacy-progress-bar';
import {MatLegacyDialogModule as MatDialogModule} from '@angular/material/legacy-dialog';
import {MatLegacyTooltipModule as MatTooltipModule} from '@angular/material/legacy-tooltip';
import {MatLegacySnackBarModule as MatSnackBarModule} from '@angular/material/legacy-snack-bar';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MatMomentDateModule} from '@angular/material-moment-adapter';
import {StorageService} from './services/storage.service';
import {RestCommonService} from './services/restCommon.service';
import {Angulartics2Module} from 'angulartics2';
import {HttpClient} from '@angular/common/http';
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {IsTodayPipe} from './pipes/isToday.pipe';
import {CategorySelectComponent} from './component/category-select/category-select.component';
import {ObjectUtils} from 'primeng/utils';
import {ConfirmationService} from 'primeng/api';
import {DomHandler} from 'primeng/dom';
import {TooltipModule} from 'primeng/tooltip';
import {TableModule} from 'primeng/table';
import {DialogModule} from 'primeng/dialog';
import {SidebarModule} from 'primeng/sidebar';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {ListboxModule} from 'primeng/listbox';
import {RadioButtonModule} from 'primeng/radiobutton';
import {PanelModule} from 'primeng/panel';
import {CalendarModule} from 'primeng/calendar';
import {AccordionModule} from 'primeng/accordion';
import {TabViewModule} from 'primeng/tabview';
import {FocusTrapModule} from 'primeng/focustrap';
import {CheckboxModule} from 'primeng/checkbox';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {SplitButtonModule} from 'primeng/splitbutton';
import {InputMaskModule} from 'primeng/inputmask';
import {PaginatorModule} from 'primeng/paginator';
import {InputSwitchModule} from 'primeng/inputswitch';
import {ToastModule} from 'primeng/toast';
import {VirtualScrollerModule} from 'primeng/virtualscroller';
import {ScrollerModule} from 'primeng/scroller';
import {AutoCompleteModule} from 'primeng/autocomplete';
import {DialogComponent} from './component/dialog/dialog.component';
import {SortTextPipe} from './pipes/sortText.pipe';
import {SumPipe} from './pipes/sum.pipe';
import {MonthYearPipe} from './pipes/monthYear.pipe';
import {ChartModule, HIGHCHARTS_MODULES} from 'angular-highcharts';
import * as highstock from 'highcharts/modules/stock.src';
import * as boostCanvas from 'highcharts/modules/boost-canvas';
import * as boost from 'highcharts/modules/boost.src';
import * as noDataToDisplay from 'highcharts/modules/no-data-to-display.src';
import {TodayRelativeHumanizePipe} from './pipes/todayRelativeHumanize.pipe';
import {CurrencySymbolPipe} from './pipes/currencySymbol.pipe';
import {HighlightPipe} from './pipes/highlight.pipe';
import {BankViewComponent} from './component/bank-view/bank-view.component';
import {CardViewComponent} from './component/card-view/card-view.component';
import {TooltipEditorComponent} from './component/tooltip-editor/tooltip-editor.component';
import {SolekViewComponent} from './component/solek-view/solek-view.component';
import {PaginatorComponent} from './component/paginator/paginator.component';
import {NumbersOnlyDirective} from './directives/numbersOnly.directive';
import {ScrollbarDirective} from './directives/scrollbar.directive';
import {NG_SCROLLBAR_OPTIONS, NgScrollbarModule} from 'ngx-scrollbar';
import {ToIconSrcPipe} from './pipes/toIconSrc.pipe';
import {BankForeignCredentialsService} from './component/foreign-credentials/foreign-credentials.service';
import {BankCredentialsComponent} from './component/foreign-credentials/bank-credentials/bank-credentials.component';
import {TokenCredentialsUpdateComponent} from './component/foreign-credentials/token-credentials-update/token-credentials-update.component';
import {TokenUpdateDialogComponent} from './component/foreign-credentials/token-update-dialog/token-update-dialog.component';
import {ReportMailSchedulerComponent} from './component/delivery-scheduler/report-mail-scheduler/report-mail-scheduler.component';
import {BankAccountByIdPipe} from './pipes/bankAccountById.pipe';
import {TransactionFrequencyHumanizePipe} from './pipes/transFrequencyHumanize.pipe';
import {MovementEditorComponent} from './component/movement-editor/movement-editor.component';
import {CcardEditorComponent} from './component/movement-editor/ccard-editor/ccard-editor.component';
import {CyclicEditorComponent} from './component/movement-editor/cyclic-editor/cyclic-editor.component';
import {DirectdEditorComponent} from './component/movement-editor/directd-editor/directd-editor.component';
import {LoanEditorComponent} from './component/movement-editor/loan-editor/loan-editor.component';
import {SlikaEditorComponent} from './component/movement-editor/slika-editor/slika-editor.component';
import {CashEditorComponent} from './component/movement-editor/cash-editor/cash-editor.component';
import {OtherEditorComponent} from './component/movement-editor/wire-cheque-other-editor/wire-cheque-other-editor.component';
import {BankChequeEditorComponent} from './component/movement-editor/bank-cheque-editor/bank-cheque-editor.component';
import {ERPChequeEditorComponent} from './component/movement-editor/erp-cheque-editor/erp-cheque-editor.component';
import {IsPeriodicTypePipe} from './pipes/isPeriodicTargetType.pipe';
import {DoneXhrService} from './services/done.xhr.service';
import {TokenStatusViewComponent} from './component/foreign-credentials/token-status-view/token-status-view.component';
import {TokenStatusAsIconSrcPipe} from './pipes/tokenStatusAsIconSrc.pipe';
import {TokenCreateDialogComponent} from './component/foreign-credentials/token-create-dialog/token-create-dialog.component';
import {CardCredentialsComponent} from './component/foreign-credentials/card-credentials/card-credentials.component';
// tslint:disable-next-line:max-line-length
import {
    ClearingAgencyCredentialsComponent
} from './component/foreign-credentials/clearingAgency-credentials/clearingAgency-credentials.component';
import {TokenTypeByTargetIdPipe} from './pipes/tokenTypeByTargetId.pipe';
import {ToTokenStatusEnumValuePipe} from './pipes/toTokenStatusEnumValue.pipe';
// tslint:disable-next-line:max-line-length
import {
    TokenCredentialsUpdateButtonComponent
} from './component/foreign-credentials/token-credentials-update-button/token-credentials-update-button.component';
// tslint:disable-next-line:max-line-length
import {
    TokenCredentialsUpdateButtonLiteComponent
} from './component/foreign-credentials/token-credentials-update-button-lite/token-credentials-update-button-lite.component';
import {TokenTrackerComponent} from './component/foreign-credentials/token-tracker/token-tracker-component';
import {OtpUpdateDialogComponent} from './component/foreign-credentials/otp-update-dialog/otp-update-dialog.component';
import {MaxInputLengthDirective} from './directives/maxInputLength.directive';
// tslint:disable-next-line:max-line-length
import {
    RecommendationCalendarPromptComponent
} from './component/recommendation-calendar/recommendation-calendar-prompt/recommendation-calendar-prompt-component.component';
import {ChecksViewComponent} from './component/transaction-additionals-view/checks-view/checks-view.component';
import {AccountOutdatedViewComponent} from './component/outdated-view/account-outdated-view/account-outdated-view.component';
import {CardOutdatedViewComponent} from './component/outdated-view/card-outdated-view/card-outdated-view.component';
import {SolekOutdatedViewComponent} from './component/outdated-view/solek-outdated-view/solek-outdated-view.component';
import {TransferViewComponent} from './component/transaction-additionals-view/transfer-view/transfer-view.component';
import {TransactionAdditionalTriggerDirective} from './component/transaction-additionals-view/transactionAdditionalTrigger.directive';
// tslint:disable-next-line:max-line-length
import {
    RecommendationCalendarInlineComponent
} from './component/recommendation-calendar/recommendation-calendar-inline/recommendation-calendar-inline.component';
// tslint:disable-next-line:max-line-length
import {
    RecommendationCalendarInputComponent
} from './component/recommendation-calendar/recommendation-calendar-input/recommendation-calendar-input.component';
import {CompanyEditorComponent} from './component/company-editor/company-editor.component';
import {RangeCalendarComponent} from './component/range-calendar/range-calendar.component';
import {AccountsDateRangeSelectorComponent} from './component/date-range-selectors/accounts-date-range-selector.component';
import {ArchivesDateRangeSelectorComponent} from './component/date-range-selectors/archives-date-range-selector.component';
import {CcardsDateRangeSelectorComponent} from './component/date-range-selectors/ccards-date-range-selector.component';
import {ClearingAgenciesDateRangeSelectorComponent} from './component/date-range-selectors/clearingAgencies-date-range-selector.component';
import {ChecksDateRangeSelectorComponent} from './component/date-range-selectors/checks-date-range-selector.component';
import {CashflowDateRangeSelectorComponent} from './component/date-range-selectors/cashflow-date-range-selector.component';
import {BankMatchDateRangeSelectorComponent} from './component/date-range-selectors/bankMatch-date-range-selector.component';
import {OverviewDateRangeSelectorComponent} from './component/date-range-selectors/overview-date-range-selector.component';
import {UserToAdminSelectorComponent} from './component/user-to-admin-selector/user-to-admin-selector.component';
import {MessagesListComponent} from './component/messages/messages-list.component';
import {MessageTypeAsIconSrcPipe} from './pipes/messageTypeAsIconSrcPipe';
import {CalendarWrapComponent} from './component/calendar-wrap/calendar-wrap.component';
import {DropdownItem, DropdownWrapComponent} from './component/dropdown-wrap/dropdown-wrap.component';

import {TopNotificationAreaComponent} from './component/top-notification-area/top-notification-area.component';
// import {HelpCenterService} from './component/knowledge-base/help-center.service';
import {UserMailEditComponent} from './component/user-mail-edit/user-mail-edit.component';
import {CyclicTransactionHistoryComponent} from './component/cyclic-transaction-history/cyclic-transaction-history.component';
import {DaysBetweenPipe} from './pipes/daysBetween.pipe';
import {TokenTrackerOnDemandComponent} from './component/foreign-credentials/token-tracker-on-demand/token-tracker-on-demand.component';
import {CategoryChangePromptComponent} from './component/category-change-prompt/category-change-prompt.component';
import {PrivilegeTypeHumanizePipe} from './pipes/privilegeTypeHumanize.pipe';
import {AccessTypeHumanizePipe} from './pipes/accessTypeHumanize.pipe';
import {PrivilegeTypeMaxPipe} from './pipes/privilegeTypeMax.pipe';
import {MobileInvitePromptComponent} from './component/mobile-invite-prompt/mobile-invite-prompt.component';
import {NoNationalCharactersDirective} from './directives/noNationalCharacters.directive';
import {CtrlKeyDirective} from './directives/ctrlKey.directive';
import {AlertStatusHumanizePipe} from './pipes/alertStatusHumanize.pipe';
import {BeneficiarySelectComponent} from './component/beneficiary/beneficiary-select/beneficiary-select.component';
import {TaryaPromptComponent} from './component/tarya-prompt/tarya-prompt.component';
import {BeneficiaryCreatePromptComponent} from './component/beneficiary/beneficiary-editor/beneficiary-create-prompt.component';
// tslint:disable-next-line:max-line-length
import {
    BeneficiaryCategoryChangePromptComponent
} from './component/beneficiary/beneficiary-category-change-prompt/beneficiary-category-change-prompt.component';
import {UnionViewComponent} from './component/transaction-additionals-view/union-view/union-view.component';
import {BeneficiaryMultiSelectComponent} from './component/beneficiary/beneficiary-multi-select/beneficiary-multi-select.component';
import {TooitipIfEllipsisDirective} from './directives/tooitipIfEllipsis.directive';
import {LoanDetailsPromptComponent} from './component/loan-details/loan-details-prompt.component';
import {DisableControlDirective} from './directives/disableControl.directive';
import {ServiceCallDialogComponent} from './component/service-call-dialog/service-call-dialog.component';
import {SharedComponent} from './component/shared.component';
import {SortIconPipe} from '../accountants/companies/shared/sort-icon.pipe';
import {ProgressComponent} from '../accountants/companies/shared/progress/progress.component';
import {ToEtlUrlPipe} from './pipes/to-etl-url.pipe';
import {
    CcardsDateRangeSelectorAccountantsComponent
} from './component/date-range-selectors/ccards-date-range-selector-accountants.component';

// import {ReloadServices} from './services/reload.services';
import {ResizableDraggableComponent} from './component/resizable-draggable/resizable-draggable.component';
import {CropMultipleComponent} from './component/crop-multiple/crop-multiple.component';

import {PlayVideoDialogComponent} from '@app/customers/help-center/customer-help-video/play-video-dialog/play-video-dialog.component';
import {HashOtpUpdateDialogComponent} from './component/foreign-credentials/hash-otp-update-dialog/hash-otp-update-dialog.component';
import {MatchDateRangeSelectorAccountantsComponent} from './component/date-range-selectors/match-date-range-selector-accountants.component';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {RippleModule} from 'primeng/ripple';
import {AddCompanyDialogComponent} from '@app/shared/component/add-company-dialog/add-company-dialog-component';
import {FormLoginOtpModalComponent} from '@app/shared/component/form-login-otp-modal/form-login-otp-modal.component';
import {OrElsePipe} from './pipes/or-else.pipe';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(
        http,
        '../assets/i18n/',
        '.json?cb=' + new Date().getTime()
    );
}

@NgModule({
    imports: [
        InfiniteScrollModule,
        NgOptimizedImage,
        ScrollingModule,
        NgScrollbarModule,
        ChartModule,
        OverlayModule,
        ScrollPanelModule,
        SkeletonModule,
        OverlayPanelModule,
        VirtualScrollerModule,
        ScrollerModule,
        InputSwitchModule,
        AutoCompleteModule,
        ToastModule,
        ListboxModule,
        CalendarModule,
        RadioButtonModule,
        PaginatorModule,
        DropdownModule,
        SplitButtonModule,
        InputMaskModule,
        DialogModule,
        TooltipModule,
        CheckboxModule,
        SidebarModule,
        TableModule,
        ConfirmDialogModule,
        ButtonModule,
        PanelModule,
        AccordionModule,
        TabViewModule,
        FocusTrapModule,
        CommonModule,
        MatAutocompleteModule,
        MatButtonModule,
        DragDropModule,
        MatCheckboxModule,
        MatDialogModule,
        MatExpansionModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatMomentDateModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
        Angulartics2Module,
        ReactiveFormsModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        }),
        RippleModule
    ],
    providers: [
        DoneXhrService,
        // HttpServices,
        StorageService,
        RestCommonService,
        DomHandler,
        ObjectUtils,
        ConfirmationService,
        BankForeignCredentialsService,
        TitleCasePipe,
        {
            provide: HIGHCHARTS_MODULES,
            useFactory: () => [highstock, boostCanvas, boost, noDataToDisplay]
        },
        {provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: {useUtc: true}},
        TransactionFrequencyHumanizePipe,
        // HelpCenterService,
        ToIconSrcPipe,
        DaysBetweenPipe,
        FilterPipe,
        PrivilegeTypeHumanizePipe,
        AccessTypeHumanizePipe,
        PrivilegeTypeMaxPipe,
        IsTodayPipe,
        AlertStatusHumanizePipe,
        SortIconPipe,
        {
            provide: NG_SCROLLBAR_OPTIONS,
            useValue: {
                scrollAuditTime: 20
            }
        }
    ],
    declarations: [
        SharedComponent,
        CardsSelectComponent,
        CardsSelectByCurrencyComponent,
        SolekSelectComponent,
        NoCommaPipe,
        ChartsComponent,
        ResizableDraggableComponent,
        CropMultipleComponent,
        TrimPipe,
        SortPipe,
        ScrollHeightDirective,
        SortableDirective,
        SortTextPipe,
        FilterPipe,
        FilterPipeBiggerSmaller,
        IsTodayPipe,
        SumPipe,
        MonthYearPipe,
        TodayRelativeHumanizePipe,
        DaysBetweenPipe,
        CurrencySymbolPipe,
        HighlightPipe,
        ToIconSrcPipe,
        BankAccountByIdPipe,
        TransactionFrequencyHumanizePipe,
        IsPeriodicTypePipe,
        TokenStatusAsIconSrcPipe,
        TokenTypeByTargetIdPipe,
        ToTokenStatusEnumValuePipe,
        MessageTypeAsIconSrcPipe,
        VsForDirective,
        NumbersOnlyDirective,
        ScrollbarDirective,
        MaxInputLengthDirective,
        AccountSelectComponent,
        AccountSelectByCurrencyComponent,
        StatusesComponent,
        AccountDatesComponent,
        FormLoginOtpModalComponent,
        TooltipCategoryComponent,
        TooltipListComponent,
        SumViewComponent,
        CategorySelectComponent,
        DialogComponent,
        PaginatorComponent,
        BankViewComponent,
        CardViewComponent,
        SolekViewComponent,
        TooltipEditorComponent,
        ClickDocumentDirective,
        BankCredentialsComponent,
        TokenCredentialsUpdateComponent,
        TokenUpdateDialogComponent,
        CardCredentialsComponent,
        ClearingAgencyCredentialsComponent,
        TokenCredentialsUpdateButtonComponent,
        TokenCredentialsUpdateButtonLiteComponent,
        ReportMailSchedulerComponent,
        MovementEditorComponent,
        CcardEditorComponent,
        CyclicEditorComponent,
        DirectdEditorComponent,
        LoanEditorComponent,
        SlikaEditorComponent,
        CashEditorComponent,
        OtherEditorComponent,
        BankChequeEditorComponent,
        ERPChequeEditorComponent,
        TokenStatusViewComponent,
        TokenCreateDialogComponent,
        TokenTrackerComponent,
        OtpUpdateDialogComponent,
        RecommendationCalendarPromptComponent,
        RecommendationCalendarInlineComponent,
        CalendarWrapComponent,
        RecommendationCalendarInputComponent,
        ChecksViewComponent,
        TransferViewComponent,
        UnionViewComponent,
        TransactionAdditionalTriggerDirective,
        AccountOutdatedViewComponent,
        CardOutdatedViewComponent,
        SolekOutdatedViewComponent,
        CompanyEditorComponent,
        RangeCalendarComponent,
        ArchivesDateRangeSelectorComponent,
        AccountsDateRangeSelectorComponent,
        CcardsDateRangeSelectorComponent,
        ClearingAgenciesDateRangeSelectorComponent,
        CcardsDateRangeSelectorAccountantsComponent,
        MatchDateRangeSelectorAccountantsComponent,
        ChecksDateRangeSelectorComponent,
        CashflowDateRangeSelectorComponent,
        BankMatchDateRangeSelectorComponent,
        OverviewDateRangeSelectorComponent,
        UserToAdminSelectorComponent,
        MessagesListComponent,
        DropdownWrapComponent,
        DropdownItem,
        // KnowledgeBaseComponent,
        ServiceCallDialogComponent,
        TopNotificationAreaComponent,
        UserMailEditComponent,
        CyclicTransactionHistoryComponent,
        TokenTrackerOnDemandComponent,
        CategoryChangePromptComponent,
        PrivilegeTypeHumanizePipe,
        AccessTypeHumanizePipe,
        PrivilegeTypeMaxPipe,
        MobileInvitePromptComponent,
        NoNationalCharactersDirective,
        CtrlKeyDirective,
        AlertStatusHumanizePipe,
        TaryaPromptComponent,
        BeneficiarySelectComponent,
        BeneficiaryCreatePromptComponent,
        BeneficiaryCategoryChangePromptComponent,
        BeneficiaryMultiSelectComponent,
        TooitipIfEllipsisDirective,
        LoanDetailsPromptComponent,
        DisableControlDirective,
        SortIconPipe,
        ProgressComponent,
        ToEtlUrlPipe,
        PlayVideoDialogComponent,
        HashOtpUpdateDialogComponent,
        AddCompanyDialogComponent,
        OrElsePipe
    ],
    exports: [
        SharedComponent,
        InfiniteScrollModule,
        NgOptimizedImage,
        ScrollingModule,
        NgScrollbarModule,
        CardsSelectComponent,
        CardsSelectByCurrencyComponent,
        SolekSelectComponent,
        ChartsComponent,
        ResizableDraggableComponent,
        CropMultipleComponent,
        OverlayModule,
        ScrollPanelModule,
        SkeletonModule,
        OverlayPanelModule,
        VirtualScrollerModule,
        ScrollerModule,
        InputSwitchModule,
        AutoCompleteModule,
        ToastModule,
        ListboxModule,
        CalendarModule,
        RadioButtonModule,
        PaginatorModule,
        DropdownModule,
        DialogModule,
        SplitButtonModule,
        InputMaskModule,
        TooltipModule,
        CheckboxModule,
        SidebarModule,
        TableModule,
        ConfirmDialogModule,
        ButtonModule,
        PanelModule,
        AccordionModule,
        TabViewModule,
        FocusTrapModule,
        SortTextPipe,
        TrimPipe,
        NoCommaPipe,
        SortPipe,
        FilterPipe,
        FilterPipeBiggerSmaller,
        IsTodayPipe,
        SumPipe,
        MonthYearPipe,
        TodayRelativeHumanizePipe,
        DaysBetweenPipe,
        CurrencySymbolPipe,
        HighlightPipe,
        ToIconSrcPipe,
        BankAccountByIdPipe,
        TransactionFrequencyHumanizePipe,
        IsPeriodicTypePipe,
        TokenStatusAsIconSrcPipe,
        TokenTypeByTargetIdPipe,
        ToTokenStatusEnumValuePipe,
        MessageTypeAsIconSrcPipe,
        PrivilegeTypeHumanizePipe,
        AccessTypeHumanizePipe,
        PrivilegeTypeMaxPipe,
        AccountSelectComponent,
        AccountSelectByCurrencyComponent,
        StatusesComponent,
        AccountDatesComponent,
        FormLoginOtpModalComponent,
        TooltipCategoryComponent,
        SumViewComponent,
        CategorySelectComponent,
        TooltipListComponent,
        DialogComponent,
        PaginatorComponent,
        BankViewComponent,
        CardViewComponent,
        SolekViewComponent,
        TooltipEditorComponent,
        ScrollHeightDirective,
        SortableDirective,
        VsForDirective,
        NumbersOnlyDirective,
        ScrollbarDirective,
        MaxInputLengthDirective,
        CommonModule,
        FormsModule,
        CdkTableModule,
        MatAutocompleteModule,
        MatButtonModule,
        DragDropModule,
        MatCheckboxModule,
        MatDialogModule,
        MatExpansionModule,
        MatGridListModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        MatMenuModule,
        MatNativeDateModule,
        MatMomentDateModule,
        MatProgressBarModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatSnackBarModule,
        MatTooltipModule,
        Angulartics2Module,
        ReactiveFormsModule,
        BidiModule,
        TranslateModule,
        ClickDocumentDirective,
        BankCredentialsComponent,
        TokenCredentialsUpdateComponent,
        TokenUpdateDialogComponent,
        CardCredentialsComponent,
        ClearingAgencyCredentialsComponent,
        TokenCredentialsUpdateButtonComponent,
        TokenCredentialsUpdateButtonLiteComponent,
        ReportMailSchedulerComponent,
        MovementEditorComponent,
        CcardEditorComponent,
        CyclicEditorComponent,
        DirectdEditorComponent,
        LoanEditorComponent,
        SlikaEditorComponent,
        CashEditorComponent,
        OtherEditorComponent,
        BankChequeEditorComponent,
        ERPChequeEditorComponent,
        TokenStatusViewComponent,
        TokenCreateDialogComponent,
        TokenTrackerComponent,
        OtpUpdateDialogComponent,
        RecommendationCalendarPromptComponent,
        RecommendationCalendarInlineComponent,
        RecommendationCalendarInputComponent,
        CalendarWrapComponent,
        ChecksViewComponent,
        TransferViewComponent,
        UnionViewComponent,
        TransactionAdditionalTriggerDirective,
        AccountOutdatedViewComponent,
        CardOutdatedViewComponent,
        SolekOutdatedViewComponent,
        CompanyEditorComponent,
        RangeCalendarComponent,
        ArchivesDateRangeSelectorComponent,
        AccountsDateRangeSelectorComponent,
        CcardsDateRangeSelectorComponent,
        ClearingAgenciesDateRangeSelectorComponent,
        CcardsDateRangeSelectorAccountantsComponent,
        MatchDateRangeSelectorAccountantsComponent,
        ChecksDateRangeSelectorComponent,
        CashflowDateRangeSelectorComponent,
        BankMatchDateRangeSelectorComponent,
        OverviewDateRangeSelectorComponent,
        UserToAdminSelectorComponent,
        MessagesListComponent,
        DropdownWrapComponent,
        DropdownItem,
        // KnowledgeBaseComponent,
        ServiceCallDialogComponent,
        TopNotificationAreaComponent,
        UserMailEditComponent,
        CyclicTransactionHistoryComponent,
        TokenTrackerOnDemandComponent,
        CategoryChangePromptComponent,
        MobileInvitePromptComponent,
        NoNationalCharactersDirective,
        CtrlKeyDirective,
        AlertStatusHumanizePipe,
        TaryaPromptComponent,
        BeneficiarySelectComponent,
        BeneficiaryCreatePromptComponent,
        BeneficiaryCategoryChangePromptComponent,
        BeneficiaryMultiSelectComponent,
        TooitipIfEllipsisDirective,
        LoanDetailsPromptComponent,
        DisableControlDirective,
        SortIconPipe,
        ProgressComponent,
        ToEtlUrlPipe,
        PlayVideoDialogComponent
    ]
})
export class SharedModule {
    constructor() {

    }
}
