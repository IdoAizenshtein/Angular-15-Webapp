import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    Renderer2,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {SharedComponent} from '@app/shared/component/shared.component';
import {UserService} from '@app/core/user.service';
import {SharedService} from '@app/shared/services/shared.service';
import {HttpErrorResponse} from '@angular/common/http';
import {combineLatest, defer, Observable, of, Subject, Subscription, timer, zip} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {SortPipe} from '@app/shared/pipes/sort.pipe';

import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

import {ActivatedRoute, Router} from '@angular/router';

import {DatePipe, getCurrencySymbol} from '@angular/common';
import {StorageService} from '@app/shared/services/storage.service';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {Calendar} from 'primeng/calendar';
import {Dropdown} from 'primeng/dropdown';
import {OverlayPanel} from 'primeng/overlaypanel';
import {Paginator} from 'primeng/paginator';

import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {DomSanitizer} from '@angular/platform-browser';
import {CategorySelectComponent} from '@app/shared/component/category-select/category-select.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {UserDefaultsResolver} from '../../user-defaults-resolver.service';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import * as XLSX from 'xlsx';
import {ReportService} from '@app/core/report.service';
import {Message, MessageService} from 'primeng/api';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {EditingType, MovementEditorComponent} from '@app/shared/component/movement-editor/movement-editor.component';
import {IsPeriodicTypePipe} from '@app/shared/pipes/isPeriodicTargetType.pipe';
import {CashflowDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/cashflow-date-range-selector.component';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {DaysBetweenPipe} from '@app/shared/pipes/daysBetween.pipe';
import {TransTypesService} from '@app/core/transTypes.service';
import {ActionService} from '@app/core/action.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';
import {Dialog} from 'primeng/dialog';

type AOA = any[][];

@Component({
    templateUrl: './tazrim-daily-details.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    providers: [MessageService, IsPeriodicTypePipe]
})
export class TazrimDailyDetailsComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    public filterTypesVal: any = null;
    public filterTypesCategory: any = null;
    public filterNote: any = null;
    public filterPaymentTypesCategory: any = null;
    public accountBalance: number;
    public creditLimit: number;
    public searchInDates = false;
    public selectedValue: any;
    public selectedValuePayment: any;
    msgs: Message[] = [];
    public disabledAfterCreate: boolean = false;

    get creditLimitAbs(): number {
        return Math.abs(this.creditLimit);
    }

    private navParams: any;

    public balanceUse: number;
    public accountSelectExchange: any = false;
    public accountSelectInDeviation: any = false;
    public accountSelectOneNotUpdate: boolean | number = false;
    public dataTable: any = [];
    public dataTableAll: any = [];
    public searchableListTypes = ['paymentDesc', 'transTypeId'];
    public searchableList = [
        'paymentDescTranslate',
        'transName',
        'transTypeName',
        'asmachta',
        'total',
        'uniItra',
        'mutavNames'
    ];
    // , 'accountNickname'];
    public queryString = '';
    public currentPage = 0;
    public entryLimit = 50;
    // @Input() counter: any = 10;
    public filterInput = new FormControl();
    @ViewChild('accountSelector', {read: AccountSelectComponent})
    accountSelector: AccountSelectComponent;

    // // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;
    // @ViewChild(TazrimDatesComponent) childDates: TazrimDatesComponent;
    @ViewChild(CashflowDateRangeSelectorComponent)
    childDates: CashflowDateRangeSelectorComponent;

    @ViewChild('scrollContainer') scrollContainer: ElementRef;
    @ViewChild('uploadBtn') uploadBtn: ElementRef;

    private paymentTypesMap: { [key: string]: any };
    public paymentTypesArr: any[];
    private transTypesMap: { [key: string]: any };
    public transTypesArr: any[];
    public editArr: any[];
    public sortPipeDir: any = 'bigger';
    public loader = false;
    // public selectedItem: any;
    public companyTransTypes: any[] = [];
    private defaultTransType: any | null;
    public scrollContainerHasScroll = false;
    public dataTableToday: any[] = [];
    public questionableExpanded = false;
    public tablePristine = true;
    public updatePermitted: boolean;
    private readonly updatePermittedObs: Observable<number>;
    public companySelectSub: Subscription;
    private updatePermittedSub: Subscription;
    public subscription: Subscription;
    // public showAdditionalItem: any;
    // private transactionAdditionalDetailId$ = new Subject<any>();
    // transactionAdditionalDetails$: Observable<any>;
    // transactionAdditionalDetailsSum: number;

    // @ViewChild('additionalsContainer', {read: ElementRef}) additionalsContainer: ElementRef;
    @ViewChild('paginator') paginator: Paginator;
    // @ViewChild('additionalBodyContainer') additionalBodyContainer: ElementRef;
    // additionalBodyHasScroll = false;
    // additionalCheckSelected: any = null;
    // private showAdditionalTarget: any;
    private transTypeChangeEventSub: Subscription;
    private readonly dtPipe: DatePipe;

    @ViewChildren('checksChain', {read: ElementRef})
    checksChainItemsRef: QueryList<ElementRef>;

    private _selectedTransaction: any;
    get selectedTransaction(): any {
        return this._selectedTransaction;
    }

    public langCalendar: any;

    set selectedTransaction(val: any) {
        this._selectedTransaction = val;
        if (this.editingTransaction !== null && this.editingTransaction !== val) {
            this.submitChangesInner();
            // this.submitChanges(null);
        }
    }

    public data: AOA = [
        [1, 2],
        [3, 4]
    ];
    public dataArrExcel: any = [];

    public editingTransactionOld: any;
    private _editingTransaction: any;
    get editingTransaction(): any {
        return this._editingTransaction;
    }

    set editingTransaction(val: any) {
        if (this._editingTransaction != null && this._editingTransaction !== val) {
            this.submitChangesInner();
            // this.submitChanges(null);
        }
        if (this._editingTransaction !== val) {
            // this.editingTransactionOld = val ? JSON.parse(JSON.stringify(val)) : null;
            this.editingTransactionOld = val
                ? Object.assign(Object.create(null), val)
                : null;
        }
        this._editingTransaction = val;
        if (val) {
            this.selectedTransaction = val;
        }
        this.showCategoryDropDown = false;
    }

    public showCategoryDropDown: boolean;
    @ViewChild('categorySelector') categorySelector: CategorySelectComponent;
    private globalListenerWhenInEdit: () => void | boolean;

    // private lastAddionalsLoaded: any[];

    get yearRange(): string {
        return `${this.today.getFullYear()}:${this.calendarMax.getFullYear()}`;
    }

    public popUpExcelImportShow: any = false;
    public popUpExcelImportDuplicateShow: any = false;
    public today: Date = new Date();
    public calendarMax: Date = new Date(
        new Date().setFullYear(new Date().getFullYear() + 5)
    );
    public form: any;

    // public typePayments: any[];
    @ViewChild('scrollContainerInside') scrollContainerInside: ElementRef;
    public scrollContainerInsideHasScroll = false;
    public typePaymentsDD: any[] = [];

    public deleteConfirmationPrompt: {
        item: any;
        type: string | null;
        title: string;
        transName: string;
        options:
            | {
            label: string;
            value: number;
        }[]
            | null;
        optionSelected: number | null;
        processing: boolean;
    };

    get deleteTransactionToggled(): boolean {
        return this.deleteConfirmationPrompt != null;
    }

    set deleteTransactionToggled(val: boolean) {
        if (!val) {
            this.deleteConfirmationPrompt = null;
        }
    }

    @ViewChild('checkNumberGuideOvP', {read: OverlayPanel})
    checkNumberGuideOvP: OverlayPanel;
    readonly checkNumberGuides: { stopIt: boolean };
    @ViewChildren('totalFields', {read: ElementRef})
    paymentCreateTotalsRef: QueryList<ElementRef>;
    private allTransactionsSub: Subscription;
    private selectedRangeSub: Subscription;

    public layoutPlan: {
        pages: {
            past: { groupIdxFrom: number; groupIdxTill: number } | null;
            nigreret: { groupIdxFrom: number; groupIdxTill: number } | null;
            future: { groupIdxFrom: number; groupIdxTill: number } | null;
        }[];
        rowsnum: number;
    };

    private savedState: {
        past?: {
            opened: boolean;
        };
        nigreret?: {
            opened: boolean;
        };
        future?: {
            opened: boolean;
        };
    } | null;

    @ViewChildren('pastRows', {read: ElementRef})
    pastRowsList: QueryList<ElementRef>;
    @ViewChildren('nigreretRows', {read: ElementRef})
    nigreretRowsList: QueryList<ElementRef>;
    @ViewChildren('futureRows', {read: ElementRef})
    futureRowsList: QueryList<ElementRef>;

    readonly editorMultimodeForbiddenTypes = [
        'WIRE_TRANSFER',
        'CHEQUE',
        'OTHER',
        'BANK_CHEQUE',
        'ERP_CHEQUE'
    ];
    editMovementData: {
        visible: boolean;
        mode: any;
        title: string;
        form: any;
        loading: boolean | null;
        source: any;
        seriesSource: any;
    };
    @ViewChild('editEditor', {read: MovementEditorComponent}) editEditor: MovementEditorComponent;

    @ViewChild('editMovementDataDlg') editMovementDataDlg: Dialog;

    public dualMeaningFieldEditPrompt: {
        item: any;
        title: string;
        optionSelected: number | null;
        visible: boolean;
    };

    reportMailSubmitterToggle = false;

    @ViewChildren(Dropdown) dropdowns: QueryList<Dropdown>;
    @ViewChildren(Calendar) calendars: QueryList<Calendar>;

    tomorrowBalanceToShow: number | null = null;

    readonly itemUnionPrompt: {
        unitedItem: any;
        visible: boolean;
        unionData$: any;
    };

    private readonly DEFAULT_TRANSTYPE_ID =
        'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
    private readonly destroyed$ = new Subject<void>();
    public showFloatNav: any = false;
    public filesFromFolderSave: any = false;

    beneficiaryTransTypeChangePrompt: {
        data: {
            transTypeName: string;
            transName: string;
            transTypeId: string;
            companyId: string;
            transId: string;
            biziboxMutavId: string;
        };
        apply: () => void;
    };
    public openNoteData: any;
    readonly docNote: {
        visible: boolean;
        note: any;
        noteFC: any;
        fd: any;
        approve: () => void;
        show(fd?: any, showFloatNav?: any): void;
    } = {
        note: null,
        visible: false,
        noteFC: new FormGroup({
            note: new FormControl(null)
        }),
        fd: null,
        show(fd?: any, showFloatNav?: any): void {
        },
        approve: () => {
        }
    };

    beneficiaryFilter = new FormControl();
    beneficiaryFilterOptions: Array<{
        val: string;
        id: string;
        checked: boolean;
    }> = [];

    @ViewChildren(OverlayPanel) overlayPanels: QueryList<OverlayPanel>;
    public actionNavigateToScreenSub: Subscription;

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        private actionService: ActionService,
        public sharedService: SharedService,
        private reportService: ReportService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private router: Router,
        private route: ActivatedRoute,
        private storageService: StorageService,
        // private domHandler: DomHandler,
        private _element: ElementRef,
        private renderer: Renderer2,
        private dtHumanizePipe: TodayRelativeHumanizePipe,
        private _sanitizer: DomSanitizer,
        private defaultsResolver: UserDefaultsResolver,
        private messageService: MessageService,
        private sumPipe: SumPipe,
        public fb: FormBuilder,
        public snackBar: MatSnackBar,
        private isPeriodicType: IsPeriodicTypePipe,
        private currencySymbol: CurrencySymbolPipe,
        private daysBetweenPipe: DaysBetweenPipe,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);

        // this.typePayments = [
        //     {label: this.translate.translations[this.translate.currentLang].ddPays.check, value: 'check'},
        //     {label: this.translate.translations[this.translate.currentLang].ddPays.transfer, value: 'wire'},
        //     {label: this.translate.translations[this.translate.currentLang].ddPays.other, value: 'other_payment'}
        // ];

        // const paymentTypes = this.translate.translations[this.translate.currentLang].paymentTypes;
        // if (paymentTypes) {
        //     for (const o in paymentTypes) {
        //         if (paymentTypes.hasOwnProperty(o)) {
        //             this.typePaymentsDD.push({label: paymentTypes[o], value: o});
        //         }
        //     }
        // }
        this.docNote = {
            visible: false,
            noteFC: new FormGroup({
                note: new FormControl(null)
            }),
            note: null,
            fd: null,
            show(fd?: any, showFloatNav?: any): void {
                if (fd) {
                    this.fd = fd;
                    this.noteFC.reset({
                        note: fd.note
                    });
                    this.note = fd.note;
                }
                this.visible = true;
            },
            approve: () => {
                this.docNote.visible = false;

                if (
                    !(this.showFloatNav && this.docNote.fd === null) &&
                    (this.docNote.noteFC.value.note || '').trim() ===
                    (this.docNote.fd.note || '').trim()
                ) {
                    this.docNote.visible = false;
                    return;
                }
                this.sharedService
                    .accountSetNote({
                        targetType: this.docNote.fd.targetType,
                        transId: this.docNote.fd.transId,
                        note: this.docNote.noteFC.value.note
                    })
                    .subscribe(
                        (response: any) => {
                            // const idsFiles = (this.showFloatNav && this.docNote.fd === null)
                            //     ? this.showFloatNav.selcetedFiles.map(file => file.fileId)
                            //     : [this.docNote.fd.fileId];
                            const note = this.docNote.noteFC.value.note;

                            // if (this.showFloatNav && this.docNote.fd === null) {
                            //     // this.showFloatNav.selcetedFiles.forEach((file) => {
                            //     //     file.note = this.docNote.noteFC.value.note;
                            //     // });
                            // } else {
                            //     this.docNote.fd.note = this.docNote.noteFC.value.note;
                            //     if (this.docNote.fd.fileId) {
                            //         this.filesFromFolderSave.forEach(fd => {
                            //             if (fd.fileId === this.docNote.fd.fileId) {
                            //                 fd.note = this.docNote.fd.note;
                            //             }
                            //         });
                            //     }
                            // }

                            this.docNote.fd.note = this.docNote.noteFC.value.note;
                            if (
                                this.docNote.fd.transId &&
                                this.dataTableAll &&
                                this.dataTableAll.cashFlowDetails
                            ) {
                                this.dataTableAll.cashFlowDetails.forEach((fd) => {
                                    if (fd.transId === this.docNote.fd.transId) {
                                        fd.note = this.docNote.fd.note;
                                    }
                                });
                            }
                            this.docNote.visible = false;
                            this.filtersAll();
                        },
                        (err: HttpErrorResponse) => {
                            this.docNote.visible = false;

                            if (err.error) {
                                console.log('An error occurred:', err.error.message);
                            } else {
                                console.log(
                                    `Backend returned code ${err.status}, body was: ${err.error}`
                                );
                            }
                        }
                    );
            }
        };
        this.typePaymentsDD = ['Checks', 'BankTransfer', 'Other'].map((val) => {
            return {
                label: this.translate.instant('paymentTypes.' + val),
                value: val
            };
        });

        this.dtPipe = new DatePipe('en-IL');

        this.filterInput.valueChanges
            .pipe(
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged(),
                tap((term) => {
                    this.storageService.sessionStorageSetter(
                        'daily/details-filterQuery',
                        term
                    );
                })
            )
            .subscribe((term) => {
                this.sharedComponent.mixPanelEvent('search',{value: term});
                this.queryString = term;
                this.filtersAll();
            });

        this.updatePermittedObs = timer(100, 10 * 1000).pipe(
            map((x) => {
                console.log('Emitted %o -> %o', x, this.updatePermitted);
                return x;
            }),
            publishRef
        );

        this.subscription = this.transTypesService.selectedCompanyTransTypes
            .pipe(takeUntil(this.destroyed$))
            .subscribe((rslt) => this.onCompanyTransTypesArrive(rslt));

        this.checkNumberGuides = {
            stopIt:
                this.storageService.localStorageGetterItem(
                    'checkNumberGuides.display'
                ) === 'false'
        };

        this.editMovementData = {
            visible: false,
            title: '',
            mode: null,
            form: new FormGroup({}),
            source: null,
            seriesSource: null,
            loading: null
        };

        this.itemUnionPrompt = {
            unitedItem: null,
            unionData$: defer(() =>
                this.sharedService
                    .getUnionDet({
                        transDate: this.itemUnionPrompt.unitedItem.transDate,
                        companyAccountId: this.itemUnionPrompt.unitedItem.companyAccountId,
                        unionId: this.itemUnionPrompt.unitedItem.unionId
                    })
                    .pipe(
                        tap({
                            next: (response: any) => {
                                if (!response || response.error) {
                                    requestAnimationFrame(
                                        () => (this.itemUnionPrompt.visible = false)
                                    );
                                }
                            },
                            error: (err) =>
                                requestAnimationFrame(
                                    () => (this.itemUnionPrompt.visible = false)
                                )
                        }),
                        map((response: any) =>
                            response && !response.error ? response.body : []
                        ),
                        tap((response: any) => {
                            if (Array.isArray(response)) {
                                response.forEach(
                                    (item) =>
                                        (item.paymentDescTranslate =
                                            this.itemUnionPrompt.unitedItem.paymentDescTranslate)
                                );
                            }
                        }),
                        map((response: any) => {
                            return {
                                items: response,
                                total: !Array.isArray(response)
                                    ? null
                                    : response.reduce((total, item) => total + item.total, 0)
                            };
                        }),
                        take(1)
                    )
            ),
            visible: false
        };

        this.navParams = null;
        this.actionNavigateToScreenSub =
            this.actionService.navigateToCashFlow$.subscribe((navParams) => {
                if (navParams) {
                    this.navParams = navParams;
                    if (this.navParams) {
                        if (this.navParams.preset === 'showCashflowChecks') {
                            const acc = [this.navParams.companyAccountId];
                            this.storageService.sessionStorageSetter(
                                'daily/*-filterAcc',
                                JSON.stringify(acc)
                            );
                            this.storageService.sessionStorageSetter(
                                'details-filterTypesVal',
                                'null'
                            );
                            this.storageService.sessionStorageSetter(
                                'daily/details-filterPaymentTypesCategory',
                                '["Checks"]'
                            );
                            this.storageService.sessionStorageSetter(
                                'daily/details-filterTypesCategory',
                                'null'
                            );
                            this.storageService.sessionStorageSetter(
                                'daily/*-filterDates',
                                JSON.stringify({
                                    name: 'customDates',
                                    from: {
                                        day: this.userService.appData.moment().date(),
                                        month: this.userService.appData.moment().month(),
                                        year: this.userService.appData.moment().year()
                                    },
                                    till: {
                                        day: this.userService.appData.moment().date(),
                                        month: this.userService.appData.moment().month(),
                                        year: this.userService.appData.moment().year()
                                    }
                                })
                            );
                        }
                    }
                }
            });
    }

    public openNote(note, $event, file) {
        const rect = $event.target.getBoundingClientRect();
        const scrollTop = document.documentElement.scrollTop;
        file.isBottom = window.innerHeight - (rect.top + scrollTop) < 140;
        // console.log('isBottom', file.isBottom);
        this.openNoteData = file;
        note.show($event);
    }

    focusNote(textarea: any): void {
        setTimeout(() => {
            textarea.focus();
        }, 500);
    }

    private onCompanyTransTypesArrive(rslt: any[]) {
        this.companyTransTypes = rslt;
        this.defaultTransType = this.companyTransTypes
            ? this.companyTransTypes.find((tt) => {
                return tt.transTypeId === this.DEFAULT_TRANSTYPE_ID;
            })
            : null;
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngOnInit(): void {
        this.defaultsResolver.userDefaultsSubject.subscribe((userDefaults) => {
            console.log('resolved data ===> %o, userDefaults: %o', userDefaults);
            this.entryLimit =
                userDefaults && userDefaults.numberOfRowsPerTable
                    ? +userDefaults.numberOfRowsPerTable
                    : 50;
        });

        const detailsFilterQuery = this.storageService.sessionStorageGetterItem(
            'daily/details-filterQuery'
        );
        if (detailsFilterQuery) {
            this.queryString = detailsFilterQuery;
            this.filterInput.setValue(detailsFilterQuery, {
                emitEvent: false
            });
        }
        const detailsFilterTypesVal = this.storageService.sessionStorageGetterItem(
            'details-filterTypesVal'
        );
        if (detailsFilterTypesVal !== null) {
            this.filterTypesVal =
                detailsFilterTypesVal === 'null' ? null : detailsFilterTypesVal;
        }
        const detailsFilterPaymentTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'daily/details-filterPaymentTypesCategory'
            );
        if (detailsFilterPaymentTypesCategory !== null) {
            this.filterPaymentTypesCategory =
                detailsFilterPaymentTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterPaymentTypesCategory);
        }
        const detailsFilterTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'daily/details-filterTypesCategory'
            );
        if (detailsFilterTypesCategory !== null) {
            this.filterTypesCategory =
                detailsFilterTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterTypesCategory);
        }
        const detailsFilterNote = this.storageService.sessionStorageGetterItem(
            'daily/details-filterNote'
        );
        if (detailsFilterNote !== null) {
            this.filterNote =
                detailsFilterNote === 'null' ? null : JSON.parse(detailsFilterNote);
        }

        const detailsRowsPerPage = Number.parseInt(
            this.storageService.sessionStorageGetterItem('daily-details-rowsPerPage')
        );
        if (Number.isFinite(detailsRowsPerPage)) {
            this.entryLimit = detailsRowsPerPage;
        }

        this.transTypeChangeEventSub =
            this.sharedService.transTypeChangeEvent.subscribe((evt) => {
                console.log('transTypeChangeEvent occured: %o', evt);

                if (this.dataTableAll) {
                    switch (evt.type) {
                        case 'change':
                            this.dataTableAll['cashFlowDetails']
                                .filter((trans) => trans.transTypeId === evt.value.transTypeId)
                                .forEach(
                                    (trans) => (trans.transTypeName = evt.value.transTypeName)
                                );
                            break;
                        case 'delete':
                            this.dataTableAll['cashFlowDetails']
                                .filter((trans) => trans.transTypeId === evt.value.transTypeId)
                                .forEach((trans) => {
                                    trans.transTypeName = this.translate.instant(
                                        'expressions.noTransType'
                                    );
                                    trans.transTypeId = null;
                                });
                            break;
                    }
                }
            });

        if (this.translate.currentLang !== 'ENG') {
            this.langCalendar =
                this.translate.translations[this.translate.currentLang].langCalendar;
        }
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.companySelectSub) {
            this.companySelectSub.unsubscribe();
        }
        if (this.updatePermittedSub) {
            this.updatePermittedSub.unsubscribe();
        }
        if (this.transTypeChangeEventSub) {
            this.transTypeChangeEventSub.unsubscribe();
        }
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
        }
        if (this.actionNavigateToScreenSub) {
            this.actionNavigateToScreenSub.unsubscribe();
        }
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        this.destroy();
    }

    ngAfterViewInit() {
        // this.storageService.sessionStorageSetter('daily-defaultViewName', 'details');
        // this.defaultsResolver.setDisplayModeTo(this.route.snapshot.url[0].toString());
        this.selectedRangeSub = this.childDates.selectedRange
            .pipe(
                filter(
                    () =>
                        Array.isArray(this.userService.appData.userData.accountSelect) &&
                        this.userService.appData.userData.accountSelect.length
                )
            )
            .subscribe(() =>
                this.filterDates(this.childDates.recalculateSelectedRangeIfNecessary())
            );
        this.sharedComponent.recommendationPresetPublisher$
            .pipe(filter((recommendationPreset) => recommendationPreset !== null))
            .subscribe((recommendationPreset: any) => {
                console.log('recommendationPreset ---> %o', recommendationPreset);

                this.selectedValue = this.userService.appData.userData.accounts.find(
                    (acc: any) =>
                        acc.companyAccountId ===
                        recommendationPreset.account.companyAccountId
                );
                // recommendationPreset.account;
                this.selectedValuePayment = recommendationPreset.targetType;
                // debugger;
                const defCategory = this.companyTransTypes.filter(
                    (id) => id.transTypeId === this.DEFAULT_TRANSTYPE_ID
                );

                const obj = {
                    dueDate: recommendationPreset.selectedDate,
                    asmachta: '',
                    transTypeId: defCategory,
                    total: recommendationPreset.sum,
                    paymentDesc: ''
                };
                this.userService.appData.popUpShow = {
                    type: 44,
                    styleClass: 'payment-create',
                    header: true,
                    body: true,
                    footer: true,
                    height: 540,
                    width: 800,
                    data: this.fb.group({
                        name: 'formGr',
                        arr: this.fb.array([this.fb.group(obj)]),
                        ddAccountSelect: this.selectedValue, // recommendationPreset.account, // '',
                        ddTypePayments: recommendationPreset.targetType,
                        ddMutav: ''
                    })
                };
                this.userService.appData.popUpShow.data
                    .get('ddMutav')
                    .valueChanges.pipe(filter((val) => !!val))
                    .subscribe((val) => {
                        this.userService.appData.popUpShow.data
                            .get('arr')
                            .controls.forEach((fc) => {
                            fc.patchValue({
                                paymentDesc: [
                                    'העברה ',
                                    this.userService.appData.popUpShow.type === 44
                                        ? 'ל-'
                                        : 'מ-',
                                    val.accountMutavName
                                ].join(''),
                                transTypeId: this.companyTransTypes.find(
                                    (ctt) => ctt.transTypeId === val.transTypeId
                                )
                            });
                        });
                    });

                this.sharedComponent.recommendationPresetPublisher$.next(null);
            });
    }

    getCurrencySymbol(currencyCode?: string): string {
        if (!currencyCode) {
            return null;
        }
        return getCurrencySymbol(currencyCode, 'narrow');
    }

    filterTypes(type: any) {
        if (type !== null) {
            if (type === 'false') {
                this.sharedComponent.mixPanelEvent('filter zhut');
            }
            if (type === 'true') {
                this.sharedComponent.mixPanelEvent('filter hova');
            }
        } else {
            this.sharedComponent.mixPanelEvent('filter all');
        }

        this.filterTypesVal = type;
        this.filtersAll();
    }

    filterCategory(type: any) {
        if (type.type === 'payment') {
            this.filterPaymentTypesCategory = type.checked;
            this.filtersAll('filterPaymentTypesCategory');
        } else if (type.type === 'transType') {
            this.filterTypesCategory = type.checked;
            this.filtersAll('filterTypesCategory');
        } else if (type.type === 'note') {
            this.filterNote = type.checked;
            this.filtersAll('filterNote');
        } else if (type.type === 'biziboxMutavId') {
            this.beneficiaryFilter.setValue(type.checked);
            this.filtersAll('biziboxMutavId');
        }
    }
    sendEvent(isOpened: any) {
        if (isOpened && this.childDates) {
            this.childDates.selectedRange
                .pipe(take(1))
                .subscribe((paramDate) => {
                    this.sharedComponent.mixPanelEvent('days drop', {
                        value: paramDate.fromDate + '-' + paramDate.toDate
                    });
                });
        }
    }
    changeAcc(event): void {
        if (event) {
            this.filterTypesVal = null;
            this.filterTypesCategory = null;
            this.filterNote = null;
            this.filterPaymentTypesCategory = null;
        }
        this.loader = true;
        [this.accountBalance, this.creditLimit, this.balanceUse] =
            this.userService.appData.userData.accountSelect.reduce(
                function (a, b) {
                    return [
                        a[0] + +b.accountBalance,
                        a[1] + +b.creditLimit,
                        a[2] + +b.balanceUse
                    ];
                },
                [0, 0, 0]
            );
        console.log('%o', [this.accountBalance, this.creditLimit, this.balanceUse]);
        if (this.userService.appData.userData.accountSelect.length > 1) {
            this.accountSelectInDeviation =
                this.userService.appData.userData.accountSelect.filter((account) => {
                    return account.balanceUse < 0;
                });
        } else {
            this.accountSelectInDeviation = [];
        }
        // if (this.userService.appData.userData.accountSelect.filter((account) => {
        //     return account.currency !== 'ILS';
        // }).length) {
        //     this.sharedComponent.mixPanelEvent('accounts drop');
        // }
        const accountSelectExchange = this.userService.appData.userData.accountSelect.filter((account) => {
            return account.currency !== 'ILS';
        })
        this.sharedComponent.mixPanelEvent('accounts drop', {
            accounts:(this.userService.appData.userData.accountSelect.length === accountSelectExchange.length) ? 'כל החשבונות מט"ח' :
                (((this.userService.appData.userData.accounts.length-accountSelectExchange.length) === this.userService.appData.userData.accountSelect.length)? 'כל החשבונות' :
                    (
                        this.userService.appData.userData.accountSelect.map(
                            (account) => {
                                return account.companyAccountId;
                            }
                        )
                    ))
        });
        console.log(
            'this.accountSelectInDeviation => %o',
            this.accountSelectInDeviation
        );
        if (this.userService.appData.userData.accountSelect.length) {
            this.accountSelectExchange =
                this.userService.appData.userData.accountSelect.filter((account) => {
                    return account.currency !== 'ILS';
                });
        } else {
            this.accountSelectExchange = [];
        }
        this.accountSelectOneNotUpdate = false;
        if (
            this.userService.appData.userData.accountSelect.length === 1 &&
            !this.userService.appData.userData.accountSelect[0].isUpToDate
        ) {
            this.accountSelectOneNotUpdate = this.userService.appData
                .moment()
                .diff(
                    this.userService.appData.moment(
                        this.userService.appData.userData.accountSelect[0]
                            .balanceLastUpdatedDate
                    ),
                    'days'
                );
        }
        if (this.childDates) {
            this.filterDates(this.childDates.recalculateSelectedRangeIfNecessary());
        }
        // this.childDates.selectedRange
        //     .pipe(
        //         take(1)
        //     )
        //     .subscribe(() => this.filterDates(this.childDates.recalculateSelectedRangeIfNecessary()));
        // this.childDates.filter('DaysTazrim');
        // this.filterDates(this.childDates.selectedPeriod);
    }

    filterDates(paramDate: any, keepPageSelection = false): void {
        const currPageTmp =
            keepPageSelection && this.paginator ? this.paginator.getPage() : null;
        if (this.allTransactionsSub) {
            this.allTransactionsSub.unsubscribe();
        }
        this.loader = true;
        if (this.userService.appData.userData.accountSelect.length) {
            const parameters: any = {
                companyAccountIds: this.userService.appData.userData.accountSelect.map(
                    (account) => {
                        return account.companyAccountId;
                    }
                ),
                companyId: this.userService.appData.userData.companySelect.companyId,
                dateFrom: paramDate.fromDate,
                dateTill: paramDate.toDate,
                expence: -1 // ,
                // 'nigreret': (this.userService.appData.userData.nigreret === undefined)
                // ? true : this.userService.appData.userData.nigreret
            };
            combineLatest(
                [
                    this.sharedService.cashFlowDetails(parameters),
                    this.sharedService.paymentTypesTranslate$
                ]
            ).subscribe(
                ([response, paymentTypesTranslate]: any) => {
                    if (
                        this.userService.appData.userData.nigreret !== undefined &&
                        response['body'] &&
                        Array.isArray(response['body'].cashFlowDetails)
                    ) {
                        response['body'].cashFlowDetails = response[
                            'body'
                            ].cashFlowDetails.filter(
                            (dtl) =>
                                dtl.nigreret === this.userService.appData.userData.nigreret
                        );
                    }

                    if (this.userService.appData.userData.nigreret !== undefined) {
                        this.userService.appData.userData.nigreret = undefined;
                    }
                    response['body'].harigaArray = response['body'].harigaArray
                        ? response['body'].harigaArray
                            .filter((trns) => trns.harigaDate !== null)
                            .map((item) => {
                                const trnsAcc =
                                    this.userService.appData.userData.accounts.find(
                                        (acc: any) => acc.companyAccountId === item.companyAccountId
                                    );
                                return Object.assign(item, trnsAcc);
                            })
                        : response['body'].harigaArray;
                    response['body'].cashFlowDetails = response['body'].cashFlowDetails
                        ? response['body'].cashFlowDetails.map((trns, idx) => {
                            trns.rowNum = idx;
                            return this.setupTransItemView(trns, paymentTypesTranslate);
                        })
                        : response['body'].cashFlowDetails;
                    this.dataTableAll = response['body'];

                    // this.rebuildBeneficiaryFilterOptions(this.dataTableAll.cashFlowDetails);

                    this.tomorrowBalanceToShow =
                        this.userService.appData.userData.accountSelect &&
                        this.userService.appData.userData.accountSelect.length &&
                        this.dataTableAll
                            ? this.userService.appData.userData.accountSelect[0].isUpToDate
                                ? this.dataTableAll.tomorrowItra
                                : this.userService.appData.userData.accountSelect[0].isShowItrot
                                    ? this.dataTableAll.tomorrowItraNoUpdate
                                    : null
                            : null;

                    this.loader = false;
                    this.filtersAll();

                    if (currPageTmp) {
                        requestAnimationFrame(() => {
                            if (
                                this.paginator &&
                                this.paginator.getPageCount() > currPageTmp
                            ) {
                                this.currentPage = currPageTmp;
                                this.paginator.changePage(currPageTmp);
                            }
                        });
                    }
                }
            );
        } else {
            this.dataTableAll = [];
            this.loader = false;
            this.rebuildBeneficiaryFilterOptions([]);
            this.filtersAll();
        }
    }

    private preserveState() {
        // debugger;
        if (this.dataTable) {
            this.savedState = {
                past: {
                    opened:
                        this.dataTable && this.dataTable.past
                            ? this.dataTable.past.parent.opened
                            : false // true
                },
                nigreret: {
                    opened:
                        this.dataTable && this.dataTable.nigreret
                            ? this.dataTable.nigreret.parent.opened
                            : true
                },
                future: {
                    opened:
                        this.dataTable && this.dataTable.future
                            ? this.dataTable.future.parent.opened
                            : true
                }
            };
        }

        if (this.navParams) {
            this.savedState.future.opened = false;
            this.navParams = null;
        }
    }

    filtersAll(priority?: string): void {
        this.preserveState();

        if (
            this.dataTableAll &&
            !(Array.isArray(this.dataTableAll) && !this.dataTableAll.length)
        ) {
            this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
                this.queryString
            );
            if (this.queryString) {
                const nigrarotRows = Array.isArray(this.dataTableAll['cashFlowDetails'])
                    ? this.dataTableAll['cashFlowDetails'].filter(
                        (rows) => rows.bank === false && rows.nigreret === true
                    )
                    : [];
                const notNigrarotRows = Array.isArray(
                    this.dataTableAll['cashFlowDetails']
                )
                    ? this.dataTableAll['cashFlowDetails'].filter(
                        (rows) => !(rows.bank === false && rows.nigreret === true)
                    )
                    : [];

                const searchableFields = this.searchInDates
                    ? [...this.searchableList, 'transDateStr']
                    : this.searchableList;
                this.dataTable = [
                    ...this.filterPipe.transform(
                        nigrarotRows,
                        this.queryString,
                        searchableFields.filter((fldName) => fldName !== 'uniItra')
                    ),
                    ...this.filterPipe.transform(
                        notNigrarotRows,
                        this.queryString,
                        searchableFields
                    )
                ];
            } else {
                this.dataTable = this.dataTableAll['cashFlowDetails']
                    ? [].concat(this.dataTableAll['cashFlowDetails'])
                    : [];
            }

            this.dataTable = this.filterPipe.transform(
                this.dataTable,
                this.filterTypesVal,
                ['expence']
            );

            // if (priority !== 'filterTypesCategory') {
            //     this.rebuildTransTypesMap(this.filterPipe.transform(this.dataTable, this.filterPaymentTypesCategory,
            //         this.searchableListTypes));
            // }
            // if (priority !== 'filterPaymentTypesCategory') {
            //     this.rebuildPaymentTypesMap(this.filterPipe.transform(this.dataTable, this.filterTypesCategory,
            //         this.searchableListTypes));
            // }
            if (priority !== 'filterNote') {
                const buildMapFrom = this.withBeneficiaryFilterApplied(
                    this.filterPipe.transform(
                        this.dataTable,
                        this.filterTypesCategory,
                        this.searchableListTypes
                    )
                );

                this.rebuildEditMap(buildMapFrom);
            } else {
                if (this.filterNote && this.filterNote.length) {
                    this.dataTable = this.dataTable.filter((item) => {
                        return this.filterNote.some((it) => {
                            if (
                                it === 'note' &&
                                item.note !== null &&
                                item.note !== undefined
                            ) {
                                return item;
                            }
                            if (it === 'withoutMark' && item.note === null) {
                                return item;
                            }
                        });
                    });
                } else if (this.filterNote && !this.filterNote.length) {
                    this.dataTable = [];
                }
            }
            if (priority !== 'filterTypesCategory') {
                const buildMapFrom = this.withBeneficiaryFilterApplied(
                    this.filterPipe.transform(
                        this.dataTable,
                        this.filterPaymentTypesCategory,
                        this.searchableListTypes
                    )
                );
                this.rebuildTransTypesMap(buildMapFrom);
                // this.rebuildTransTypesMap(this.filterPipe.transform(this.dataTable, this.filterPaymentTypesCategory,
                //     this.searchableListTypes));
            }

            if (priority !== 'filterPaymentTypesCategory') {
                const buildMapFrom = this.withBeneficiaryFilterApplied(
                    this.filterPipe.transform(
                        this.dataTable,
                        this.filterTypesCategory,
                        this.searchableListTypes
                    )
                );
                this.rebuildPaymentTypesMap(buildMapFrom);
                // this.rebuildPaymentTypesMap(this.filterPipe.transform(this.dataTable, this.filterTypesCategory,
                //     this.searchableListTypes));
            }
            if (priority !== 'biziboxMutavId') {
                const buildMapFrom = this.filterPipe.transform(
                    this.filterPipe.transform(
                        this.dataTable,
                        this.filterTypesCategory,
                        this.searchableListTypes
                    ),
                    this.filterPaymentTypesCategory,
                    this.searchableListTypes
                );
                this.rebuildBeneficiaryFilterOptions(buildMapFrom);
            }

            this.dataTable = this.withBeneficiaryFilterApplied(this.dataTable);
            this.dataTable = this.filterPipe.transform(
                this.dataTable,
                this.filterTypesCategory,
                this.searchableListTypes
            );
            this.dataTable = this.filterPipe.transform(
                this.dataTable,
                this.filterPaymentTypesCategory,
                this.searchableListTypes
            );

            // if (this.beneficiaryFilter.value) {
            //     this.dataTable = this.dataTable
            //         .filter(item => Array.isArray(item.mutavNames) && item.mutavNames.length > 0
            //             && this.beneficiaryFilter.value.some(bnfName => item.mutavNames.includes(bnfName)));
            //     // this.dataTable = this.filterPipe.transform(this.dataTable, this.beneficiaryFilter.value,
            //     //     ['biziboxMutavId']);
            // }

            this.storageService.sessionStorageSetter(
                'details-filterTypesVal',
                this.filterTypesVal
            );
            this.storageService.sessionStorageSetter(
                'daily/details-filterPaymentTypesCategory',
                JSON.stringify(this.filterPaymentTypesCategory)
            );
            this.storageService.sessionStorageSetter(
                'daily/details-filterTypesCategory',
                JSON.stringify(this.filterTypesCategory)
            );
            this.storageService.sessionStorageSetter(
                'daily/details-filterNote',
                JSON.stringify(this.filterNote)
            );

            if (this.sortPipeDir === 'smaller') {
                this.dataTable.sort((a, b) => b.rowNum - a.rowNum);
            } else {
                this.dataTable.sort((a, b) => a.rowNum - b.rowNum);
            }
            // this.dataTable = this.sortPipe.transform(this.dataTable, 'transDate', this.sortPipeDir);

            const selectedAccIds =
                this.userService.appData.userData.accountSelect.map(
                    (acc: any) => acc.companyAccountId
                );
            this.dataTable = this.dataTable.filter((trns) =>
                selectedAccIds.includes(trns.companyAccountId)
            );
        } else {
            this.dataTable = [];
        }

        this.tablePristine =
            !this.queryString &&
            this.filterTypesCategory === null &&
            this.filterNote === null &&
            this.filterPaymentTypesCategory === null;
        // this.tablePristine = (this.sortPipeDir === null || this.sortPipeDir === 'bigger')
        //     && !this.queryString
        //     && this.filterTypesCategory === null
        //     && this.filterPaymentTypesCategory === null;

        this.calcRowGroup();

        this.loader = false;

        this.validateScrollPresence();
    }

    reduceSumsFilter(): void {
        [].concat(this.dataTable.future.children).reduce((a, b, idx, arr) => {
                try {
                    let totalHova = 0,
                        total = 0,
                        rowSum = 0;
                    if (b.expence) {
                        totalHova = +b.total;
                    } else {
                        total = +b.total;
                    }
                    const thisDate = new Date(b.transDate).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit'
                    });
                    if (idx !== 0) {
                        const nextRowDate = new Date(arr[idx - 1].transDate).toLocaleString(
                            'en-GB',
                            {
                                year: 'numeric',
                                month: '2-digit'
                            }
                        );
                        if (thisDate !== nextRowDate) {
                            rowSum = 1;
                            this.dataTable.future.children.splice(idx + a[3], 0, {
                                rowSum: true,
                                uniItra: a[0],
                                total: a[1],
                                totalHova: a[2],
                                date: arr[idx - 1].transDate
                            });
                            a[0] = 0;
                            a[1] = 0;
                            a[2] = 0;
                        }
                        if (arr.length === idx + 1) {
                            this.dataTable.future.children.splice(idx + a[3] + 2, 0, {
                                rowSum: true,
                                uniItra: a[0] + +b.uniItra,
                                total: a[1] + total,
                                totalHova: a[2] + totalHova,
                                date: arr[idx].transDate
                            });
                            a[0] = 0;
                            a[1] = 0;
                            a[2] = 0;
                        }
                    }
                    return [
                        a[0] + +b.uniItra,
                        a[1] + total,
                        a[2] + totalHova,
                        a[3] + rowSum
                    ];
                } catch (e) {
                    return [0, 0, 0, 0];
                }
            },
            [0, 0, 0, 0]
        );
    }

    sortPipeFilter(): void {
        this.sortPipeDir = this.sortPipeDir === 'smaller' ? 'bigger' : 'smaller';
        this.filtersAll();
    }

    trackById(index: number, val: any): number {
        return val.rowNum;
    }

    paginate(event) {
        console.log('paginate ===> %o', event);

        if (this.entryLimit !== +event.rows) {
            this.entryLimit = +event.rows;
            // this.storageService.sessionStorageSetter('daily-details-rowsPerPage', event.rows);
            this.defaultsResolver.setNumberOfRowsAt(this.entryLimit);
            this.rebuildLayoutPlan();
        }

        if (this.currentPage !== +event.page) {
            this.scrollContainer.nativeElement.scrollTop = 0;
            this.currentPage = event.page;
            // this.hideAdditional();
        }
    }

    private calcRowGroup(): void {
        const past = this.dataTable.filter((rows) => rows.bank === true);
        const nigreret = this.dataTable.filter(
            (rows) => rows.bank === false && rows.nigreret === true
        );
        const future = this.dataTable.filter(
            (rows) => rows.bank === false && rows.nigreret === false
        );
        nigreret.forEach((row) => {
            row.nigreretDays = this.daysBetweenPipe.transform(row.originalDate);
        });
        nigreret.sort((r1, r2) => {
            return this.sortPipeDir === 'smaller'
                ? r1.nigreretDays - r2.nigreretDays
                : r2.nigreretDays - r1.nigreretDays;
        });
        this.dataTable = {
            past: {
                parent: {
                    opened:
                        this.savedState && this.savedState.past
                            ? this.savedState.past.opened ||
                            (nigreret.length === 0 && future.length === 0)
                            : nigreret.length === 0 && future.length === 0,
                    zhut: past
                        .filter((rows) => !rows.expence)
                        .reduce(function (a, b) {
                            return a + +b.total;
                        }, 0),
                    hova: past
                        .filter((rows) => rows.expence)
                        .reduce(function (a, b) {
                            return a + +b.total;
                        }, 0)
                },
                children: past
            },
            nigreret: {
                parent: {
                    opened:
                        this.savedState && this.savedState.nigreret
                            ? this.savedState.nigreret.opened
                            : true,
                    zhut: nigreret
                        .filter((rows) => !rows.expence)
                        .reduce(function (a, b) {
                            return a + +b.total;
                        }, 0),
                    hova: nigreret
                        .filter((rows) => rows.expence)
                        .reduce(function (a, b) {
                            return a + +b.total;
                        }, 0)
                },
                children: nigreret
            },
            future: {
                parent: {
                    opened:
                        this.savedState && this.savedState.future
                            ? this.savedState.future.opened
                            : true,
                    zhut: future
                        .filter((rows) => !rows.expence)
                        .reduce(function (a, b) {
                            return a + +b.total;
                        }, 0),
                    hova: future
                        .filter((rows) => rows.expence)
                        .reduce(function (a, b) {
                            return a + +b.total;
                        }, 0)
                },
                children: future
            }
            // lengthMax: Math.max.apply(null, [past.length, nigreret.length, future.length])
        };

        if (!this.tablePristine) {
            if (!this.navParams) {
                ['past', 'nigreret', 'future']
                    .map((grName) => this.dataTable[grName])
                    .filter(
                        (gr) => gr.children && gr.children.length && !gr.parent.opened
                    )
                    .forEach((gr) => (gr.parent.opened = true));
            } else {
                ['past', 'nigreret']
                    .map((grName) => this.dataTable[grName])
                    .filter(
                        (gr) => gr.children && gr.children.length && !gr.parent.opened
                    )
                    .forEach((gr) => (gr.parent.opened = true));
                ['future']
                    .map((grName) => this.dataTable[grName])
                    .filter(
                        (gr) => gr.children && gr.children.length && !gr.parent.opened
                    )
                    .forEach((gr) => (gr.parent.opened = false));
                this.navParams = null;
            }
        }
        this.reduceSumsFilter();
        this.rebuildLayoutPlan();
    }

    public rebuildLayoutPlan(): void {
        let transactionNavigateData: {
            pageNum: number | null;
            indexOnPage: number | null;
            groupInnerIndex: number;
            group: string;
        } | null = null;

        if (this.userService.appData.userData.transactionLocateId) {
            ['past', 'nigreret', 'future'].some((fldName) => {
                let foundAt;
                if (
                    this.dataTable[fldName].children &&
                    (foundAt = this.dataTable[fldName].children.findIndex(
                        (tr) =>
                            tr.transId ===
                            this.userService.appData.userData.transactionLocateId
                    )) >= 0
                ) {
                    transactionNavigateData = {
                        group: fldName,
                        groupInnerIndex: foundAt,
                        pageNum: null,
                        indexOnPage: null
                    };
                    this.dataTable[fldName].parent.opened = true;
                    this.selectedTransaction =
                        this.dataTable[fldName].children[
                            transactionNavigateData.groupInnerIndex
                            ];
                    return true;
                }
                return false;
            });
            this.userService.appData.userData.transactionLocateId = null;
        }

        this.layoutPlan = {
            pages: [],
            rowsnum:
                (this.dataTable.past.parent.opened
                    ? this.dataTable.past.children.length
                    : 0) +
                (this.dataTable.nigreret.parent.opened
                    ? this.dataTable.nigreret.children.length
                    : 0) +
                (this.dataTable.future.parent.opened
                    ? this.dataTable.future.children.length
                    : 0)
        };

        if (
            this.layoutPlan.rowsnum === 0 &&
            (this.dataTable.past.children.length ||
                this.dataTable.nigreret.children.length ||
                this.dataTable.future.children.length)
        ) {
            this.layoutPlan.rowsnum = 1;
        }

        const pagesnum = Math.ceil(this.layoutPlan.rowsnum / this.entryLimit);

        let pastConsumed = 0,
            nigConsumed = 0,
            futConsumed = 0;
        for (
            let pgIdx = 0, capacity = this.entryLimit;
            pgIdx < pagesnum;
            pgIdx++, capacity = this.entryLimit
        ) {
            const pagegroups = {
                past: null,
                nigreret: null,
                future: null
            };
            this.layoutPlan.pages.push(pagegroups);

            if (
                this.dataTable.past.parent.opened &&
                this.dataTable.past.children.length &&
                pastConsumed < this.dataTable.past.children.length
            ) {
                pagegroups.past = {
                    groupIdxFrom: pastConsumed,
                    groupIdxTill: Math.min(
                        pastConsumed + capacity,
                        this.dataTable.past.children.length
                    )
                };
                pastConsumed = pagegroups.past.groupIdxTill;
                capacity -= pagegroups.past.groupIdxTill - pagegroups.past.groupIdxFrom;
            } else if (
                this.dataTable.past.children.length &&
                !this.dataTable.past.parent.opened
            ) {
                pagegroups.past = {
                    groupIdxTill: 0
                };
            }

            if (
                this.dataTable.nigreret.parent.opened &&
                this.dataTable.nigreret.children.length &&
                nigConsumed < this.dataTable.nigreret.children.length &&
                capacity > 0
            ) {
                pagegroups.nigreret = {
                    groupIdxFrom: nigConsumed,
                    groupIdxTill: Math.min(
                        nigConsumed + capacity,
                        this.dataTable.nigreret.children.length
                    )
                };
                nigConsumed = pagegroups.nigreret.groupIdxTill;
                capacity -=
                    pagegroups.nigreret.groupIdxTill - pagegroups.nigreret.groupIdxFrom;
            } else if (
                this.dataTable.nigreret.children.length &&
                !this.dataTable.nigreret.parent.opened
            ) {
                pagegroups.nigreret = {
                    groupIdxTill: 0
                };
            }

            if (
                this.dataTable.future.parent.opened &&
                this.dataTable.future.children.length &&
                futConsumed < this.dataTable.future.children.length &&
                capacity > 0
            ) {
                pagegroups.future = {
                    groupIdxFrom: futConsumed,
                    groupIdxTill: Math.min(
                        futConsumed + capacity,
                        this.dataTable.future.children.length
                    )
                };
                futConsumed = pagegroups.future.groupIdxTill;
                capacity -=
                    pagegroups.future.groupIdxTill - pagegroups.future.groupIdxFrom;
            } else if (
                this.dataTable.future.children.length &&
                !this.dataTable.future.parent.opened
            ) {
                pagegroups.future = {
                    groupIdxTill: 0
                };
            }

            if (
                transactionNavigateData !== null &&
                transactionNavigateData.pageNum === null &&
                pagegroups[transactionNavigateData.group].groupIdxFrom <=
                transactionNavigateData.groupInnerIndex &&
                transactionNavigateData.groupInnerIndex <
                pagegroups[transactionNavigateData.group].groupIdxTill
            ) {
                transactionNavigateData.pageNum = pgIdx;
                transactionNavigateData.indexOnPage =
                    transactionNavigateData.groupInnerIndex -
                    pagegroups[transactionNavigateData.group].groupIdxFrom;
            }
        }

        if (transactionNavigateData !== null) {
            this.currentPage = transactionNavigateData.pageNum;
        } else {
            this.currentPage = Math.max(0, Math.min(this.currentPage, pagesnum - 1));
        }

        if (transactionNavigateData !== null) {
            requestAnimationFrame(() => {
                let elementRefList: QueryList<ElementRef>;
                if (transactionNavigateData.group === 'past') {
                    elementRefList = this.pastRowsList;
                } else if (transactionNavigateData.group === 'nigreret') {
                    elementRefList = this.nigreretRowsList;
                } else if (transactionNavigateData.group === 'future') {
                    elementRefList = this.futureRowsList;
                }

                elementRefList
                    .toArray()
                    [transactionNavigateData.indexOnPage].nativeElement.focus();
                this.paginator.changePage(this.currentPage);
            });
        } else {
            this.paginator.changePage(this.currentPage);
        }
        // debugger;
    }

    private rebuildPaymentTypesMap(withOtherFiltersApplied: any[]): void {
        this.paymentTypesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (dtRow.paymentDesc && !acmltr[dtRow.paymentDesc]) {
                    acmltr[dtRow.paymentDesc] = {
                        val: dtRow.paymentDesc,
                        id: dtRow.paymentDesc,
                        checked:
                            !Array.isArray(this.filterPaymentTypesCategory) ||
                            this.filterPaymentTypesCategory.includes(dtRow.paymentDesc)
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.paymentDesc].checked) {
                        acmltr['all'].checked = false;
                    }
                }
                return acmltr;
            },
            {
                all: {
                    val: this.translate.translations[this.translate.currentLang].filters
                        .all,
                    id: 'all',
                    checked: true
                }
            }
        );
        this.paymentTypesArr = Object.values(this.paymentTypesMap);
        // console.log('this.paymentTypesArr => %o', this.paymentTypesArr);
    }

    private rebuildEditMap(withOtherFiltersApplied: any[]): void {
        const base = [
            {
                checked: true,
                id: 'all',
                val: 'הכל'
            }
        ];
        if (
            withOtherFiltersApplied.filter(
                (it) => it.note !== undefined && it.note !== null
            ).length
        ) {
            base.push({
                checked: true,
                id: 'note',
                val: 'פיתקית'
            });
        }
        if (withOtherFiltersApplied.filter((it) => it.note === null).length) {
            base.push({
                checked: true,
                id: 'withoutMark',
                val: 'ללא פיתקית'
            });
        }

        this.editArr = base;
        console.log('this.editArr => %o', this.editArr);
    }

    private rebuildTransTypesMap(withOtherFiltersApplied: any[]): void {
        this.transTypesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (dtRow.transTypeId && !acmltr[dtRow.transTypeId]) {
                    acmltr[dtRow.transTypeId] = {
                        val: dtRow.transTypeName,
                        id: dtRow.transTypeId,
                        checked:
                            !Array.isArray(this.filterTypesCategory) ||
                            !Array.isArray(this.filterNote) ||
                            this.filterTypesCategory.includes(dtRow.transTypeId)
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.transTypeId].checked) {
                        acmltr['all'].checked = false;
                    }
                }
                return acmltr;
            },
            {
                all: {
                    val: this.translate.translations[this.translate.currentLang].filters
                        .all,
                    id: 'all',
                    checked: true
                }
            }
        );
        this.transTypesArr = Object.values(this.transTypesMap);
        // console.log('this.transTypesArr => %o', this.transTypesArr);
    }

    get companyId(): string {
        return this.userService.appData.userData.companySelect !== null
            ? this.userService.appData.userData.companySelect.companyId
            : null;
    }

    private validateScrollPresence(): void {
        setTimeout(() => {
            const scrollContainerHasScrollNow =
                this.scrollContainer !== null &&
                this.scrollContainer.nativeElement.scrollHeight >
                this.scrollContainer.nativeElement.clientHeight;
            if (this.scrollContainerHasScroll !== scrollContainerHasScrollNow) {
                // console.log('validateScrollPresence: scrollContainerHasScroll > %o', scrollContainerHasScrollNow);
                this.scrollContainerHasScroll = scrollContainerHasScrollNow;
            }
        });
    }

    private mayUpdateQuestionableTransactions(): boolean {
        // console.log('here --------> this = %o', this);
        this.updatePermitted =
            Date.now() - this.dataTableToday[0].balanceLastUpdatedDate >=
            60 * 60 * 1000;
        if (this.updatePermitted && this.updatePermittedSub) {
            this.updatePermittedSub.unsubscribe();
        }
        return this.updatePermitted;
    }

    updateQuestionable(): void {
        this.dataTableToday[0].balanceLastUpdatedDate = Date.now();
        this.updatePermitted = false;
        this.updatePermittedSub = this.updatePermittedObs.subscribe(() =>
            this.mayUpdateQuestionableTransactions()
        );
    }

    selectAccountInDeviation(
        accountSelector: AccountSelectComponent,
        account: any
    ): void {
        console.log('%o, %o', accountSelector, account);
        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === account.companyAccountId
        );
        this.userService.appData.userData.accountSelect = [].concat(trnsAcc);
        accountSelector.applyValuesFromModel();
        this.changeAcc(null);
        // accountSelector.selectAccount(account);
    }

    clearFilter(): void {
        this.queryString = null;
        this.filterTypesVal = null;
        this.filterTypesCategory = null;
        this.filterNote = null;
        this.filterPaymentTypesCategory = null;
        this.filtersAll();
    }

    private setupTransItemView(
        trns: any,
        paymentTypesTranslate: { [k: string]: string }
    ): any {
        // console.log('trns -> %o', trns);

        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === trns.companyAccountId
        );

        const companyTransType =
            this.companyTransTypes.find((tt) => {
                return tt.transTypeId === trns.transTypeId;
            }) || this.defaultTransType;

        this.isEdit(trns, false);

        if ((trns.asmachta && trns.asmachta === 'null') || trns.asmachta === '0') {
            trns.asmachta = null;
        }
        // if (trns.paymentDesc === 'Checks' && trns.pictureLink !== null && trns.pictureLink !== '00000000-0000-0000-0000-000000000000') {
        //     trns.transTypeName = 'קטגוריות שונות';
        // } else {
        // }
        return Object.assign(trns, {
            account: trnsAcc,
            transDateFull: new Date(trns.transDate),
            accountNickname: trnsAcc ? trnsAcc.accountNickname : null,
            // bankIconSrc: trnsAcc ? '/assets/images/bank' + trnsAcc.bankId + '.png' : null,
            paymentDescTranslate: paymentTypesTranslate[trns['paymentDesc']],
            transTypeName: companyTransType
                ? companyTransType.transTypeName
                : this.translate.instant('expressions.noTransType'),
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.transDate,
                'dd/MM/yy'
            ),
            transDateStr: this.dtPipe.transform(trns.transDate, 'dd/MM/yy'),
            selectedTransType: companyTransType,
            originalDateFull: Number.isFinite(trns.originalDate)
                ? new Date(trns.originalDate)
                : null,
            transTypeEditable:
                !(
                    trns.linkId && trns.linkId !== '00000000-0000-0000-0000-000000000000'
                ) &&
                (trns.targetType === 'CHEQUE' ||
                    trns.targetType === 'BANK_CHEQUE' ||
                    trns.targetType === 'ERP_CHEQUE' ||
                    trns.targetType === 'OTHER' ||
                    trns.targetType === 'WIRE_TRANSFER' ||
                    trns.targetType === 'BANK_TRANS' ||
                    trns.targetType === 'SOLEK_TAZRIM' ||
                    trns.targetType === 'CCARD_TAZRIM' ||
                    trns.targetType === 'LOAN_TAZRIM') &&
                !(
                    trns.paymentDesc === 'Checks' &&
                    trns.pictureLink !== null &&
                    trns.pictureLink !== '00000000-0000-0000-0000-000000000000'
                )
        });
    }

    // public appearsInBankTooltip(trns: any): string | null {
    //     if (!trns.transDesc) {
    //         return null;
    //     }
    //     if (!trns._appearsInBankTooltip) {
    //         trns._appearsInBankTooltip = this._sanitizer.sanitize(SecurityContext.HTML,
    //             `${this.translate.translations[this.translate.currentLang].expressions.appearsInBankAs}<b>${trns.transDesc}</b></span>`
    //         );
    //     }
    //     return trns._appearsInBankTooltip;
    // }

    public descriptionTooltip(transDesc: HTMLElement): string | null {
        // console.log('descriptionTooltip: %o', transDesc);
        return transDesc.clientWidth < transDesc.scrollWidth
            ? transDesc.innerText || transDesc.textContent
            : null;
    }

    public startDescriptionEditAt(
        trns: any,
        input: HTMLInputElement | Dropdown | Calendar
    ): void {
        this.editingTransaction = trns;
        this.showCategoryDropDown = false;
        if (input instanceof HTMLInputElement) {
            requestAnimationFrame(() => {
                //   // this.descInputRef.nativeElement.select();
                input.selectionStart = input.selectionEnd = 1000;
                // console.log('this.descInputRef.nativeElement -> %o, %o', this.descInputRef.nativeElement.scrollLeft,
                //   this.descInputRef.nativeElement.scrollWidth);
                input.scrollLeft =
                    getComputedStyle(input).direction === 'rtl' ? 0 : input.scrollWidth;
            });
        } else if (trns.nigreret === true && input instanceof Calendar) {
            const transDateSelector = input as Calendar;
            const startOfMinMonth = new Date(
                transDateSelector.minDate.getFullYear(),
                transDateSelector.minDate.getMonth(),
                1
            );
            while (
                new Date(
                    transDateSelector.currentYear,
                    transDateSelector.currentMonth,
                    1
                ) < startOfMinMonth
                ) {
                transDateSelector.navForward(document.createEvent('Event'));
            }
        }
    }

    public startCategoryEditAt(trns: any, event: any) {
        event.stopPropagation();
        this.editingTransaction = trns;
        this.showCategoryDropDown = true;
        setTimeout(() => {
            this.categorySelector.show();
        });
        if (!this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit = this.renderer.listen(
                'document',
                'click',
                ($event) => {
                    if (!this.editingTransaction && this.globalListenerWhenInEdit) {
                        this.globalListenerWhenInEdit();
                        this.globalListenerWhenInEdit = null;
                        return;
                    }
                    //   console.log('details row listener called');
                    const eventPath = BrowserService.pathFrom($event);
                    // console.log('Checking if should terminate edit: %o', eventPath);
                    const shouldTerminateEdit =
                        !eventPath[0].classList.contains('p-dialog-mask') &&
                        !eventPath.some(
                            (node) =>
                                (this.scrollContainer && (node === this.scrollContainer.nativeElement)) ||
                                (node.classList && node.classList.contains('p-dialog'))
                        );
                    if (shouldTerminateEdit) {
                        console.log('Terminating edit (clicked on : %o)', eventPath);
                        this.cancelChanges();
                    }
                }
            );
        }
    }

    public statesRows(state: string, item: any, group?: any): void {
        // console.log('----> statesRows :  %o, %o', state, this.selectedTransaction);
        if (state === 'focus') {
            group.forEach((trns) => {
                if (trns.transId === item.transId) {
                    this.selectedTransaction = item;
                    this.isEdit(item, true);
                } else {
                    trns.dateInput = false;
                    this.isEdit(trns, false);
                }
            });
        }
        if (state === 'hover') {
            group.forEach((trns) => {
                if (trns.transId === item.transId) {
                    this.isEdit(trns, true);
                } else {
                    if (
                        !this.selectedTransaction ||
                        this.selectedTransaction.transId !== trns.transId
                    ) {
                        this.isEdit(trns, false);
                        trns.dateInput = false;
                    }
                }
            });
        }
        if (state === 'leave') {
            group.forEach((trns) => {
                if (
                    !this.selectedTransaction ||
                    this.selectedTransaction.transId !== trns.transId
                ) {
                    trns.dateInput = false;
                    this.isEdit(trns, false);
                }
            });
        }
    }

    public cancelChanges(): void {
        if (this.hasChanges()) {
            Object.assign(this.editingTransaction, this.editingTransactionOld);
        }
        this.editingTransaction = null;
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
            this.globalListenerWhenInEdit = null;
        }
    }

    public submitChanges($event: any, fieldName?: string): void {
        const value = fieldName && fieldName === 'selectedTransType' ? $event.value :
            fieldName && fieldName === 'transDateFull' ? $event
                :
                $event.target.value;
        if (fieldName && fieldName === 'selectedTransType') {
            this.editingTransaction = Object.assign(this.editingTransaction, value);
        }

        if (
            this.editingTransaction !== null &&
            this.editingTransactionOld[fieldName] !==
            this.editingTransaction[fieldName] &&
            ((this.editingTransaction.targetType === 'CYCLIC_TRANS' &&
                    ['paymentDesc', 'total'].includes(fieldName)) ||
                ([
                        'SOLEK_TAZRIM',
                        'CCARD_TAZRIM',
                        'LOAN_TAZRIM',
                        'DIRECTD',
                        'CASH'
                    ].includes(this.editingTransaction.targetType) &&
                    fieldName === 'total'))
        ) {
            if ($event.originalEvent) {
                $event.originalEvent.preventDefault();
                $event.originalEvent.stopImmediatePropagation();
            } else {
                $event.preventDefault();
                $event.stopImmediatePropagation();
            }
            // debugger;

            if (
                this.editingTransaction.targetType === 'CCARD_TAZRIM' &&
                fieldName === 'total'
            ) {
                this.dualMeaningFieldEditPrompt = {
                    title: 'עריכת שדה',
                    item: this.editingTransaction,
                    optionSelected: 1,
                    visible: false
                };
                this.onDualMeaningFieldEditPromptDecision();
                return;
            } else {
                this.dualMeaningFieldEditPrompt = {
                    title: 'עריכת שדה',
                    item:
                        fieldName === 'paymentDesc'
                            ? Object.assign(
                                JSON.parse(JSON.stringify(this.editingTransaction)),
                                {
                                    paymentDesc: value
                                }
                            )
                            : this.editingTransaction,
                    optionSelected: 0,
                    visible: true
                };
                return;
            }
        }

        this.submitChangesInner(fieldName && fieldName === 'selectedTransType');
        // if ((($event instanceof KeyboardEvent) && ($event as KeyboardEvent).key === 'Enter')
        //         || (['SOLEK_TAZRIM', 'CCARD_TAZRIM', 'LOAN_TAZRIM'].includes(this.editingTransaction.targetType)
        //                 && ['transName', 'selectedTransType'].includes(fieldName))) {
        //     this.submitChangesInner();
        // }
    }

    private submitChangesInner(changed?: boolean): void {
        // console.log('submit changes called %o', $event);
        if (!this.hasChanges() && !changed) {
            return;
        }
        this.isEdit(this.editingTransaction, false);
        console.log('Submitting changes...');
        const oldValue = Object.assign({}, this.editingTransactionOld);
        const oldRef = this.editingTransaction;
        // if (!this.editingTransaction.transDesc) {
        //     this.editingTransaction.transDesc = oldValue.transName;
        // }
        // this.editingTransaction.companyAccountId = this.editingTransaction.account.companyAccountId;

        this.editingTransactionOld = Object.assign({}, this.editingTransaction);

        const request: any = {
            params: {
                asmachta: this.editingTransaction.asmachta,
                bank: this.editingTransaction.bank,
                companyAccountId: this.editingTransaction.account.companyAccountId,
                companyId: this.editingTransaction.companyId,
                expence: this.editingTransaction.expence,
                kvuaDateFrom: this.editingTransaction.kvuaDateFrom,
                kvuaDateTill: this.editingTransaction.kvuaDateTill,
                nigreret: this.editingTransaction.nigreret,
                originalDate: this.editingTransaction.originalDate,
                paymentDesc: this.editingTransaction.paymentDesc,
                pictureLink: this.editingTransaction.pictureLink,
                sourceProgramName: this.editingTransaction.sourceProgramName,
                targetType: this.editingTransaction.targetType,
                targetTypeId: this.editingTransaction.targetTypeId,
                total: this.editingTransaction.total,
                transDate:
                    this.editingTransaction.nigreret === true
                        ? this.editingTransaction.originalDateFull
                        : this.editingTransaction.transDateFull,
                transDesc: this.editingTransaction.transDesc,
                transId: this.editingTransaction.transId,
                transName: this.editingTransaction.transName,
                transTypeId: this.editingTransaction.transTypeId,
                uniItra: this.editingTransaction.uniItra,
                uniItraColor: this.editingTransaction.uniItraColor,
                biziboxMutavId: this.editingTransaction.biziboxMutavId,
                mutavArray: this.editingTransaction.mutavArray
            },
            operationType: this.editingTransaction.targetType
        };

        let updateObs;
        if (
            ['LOAN_TAZRIM'].includes(request.operationType) ||
            (['SOLEK_TAZRIM', 'CCARD_TAZRIM'].includes(request.operationType) &&
                (request.params.transName !== oldValue.transName ||
                    request.params.transTypeId !== oldValue.transTypeId))
        ) {
            // request.editType = EditingType.Series;

            updateObs = this.sharedService
                .getCyclicTransactionSingle(request.params)
                .pipe(
                    map((response: any) => {
                        if (
                            !response.error &&
                            response.body &&
                            Array.isArray(response.body.transes) &&
                            response.body.transes.length > 0
                        ) {
                            return response.body.transes[0];
                        }
                        return null;
                    }),
                    switchMap((resp: any) => {
                        if (resp !== null) {
                            const fieldsToUpsert = ['transName', 'transTypeId'];
                            fieldsToUpsert.forEach(
                                (fld) => (resp[fld] = request.params[fld])
                            );

                            return this.sharedService.updateCyclicTransaction(
                                EditingType.Series,
                                request.operationType,
                                resp
                            );
                            // return this.sharedService.updateOperation({
                            //     params: resp,
                            //     operationType: request.operationType,
                            //     editType: EditingType.Series
                            // });
                        }

                        return of(null);
                    })
                );
        } else {
            updateObs = this.sharedService.updateCyclicTransaction(
                EditingType.Single,
                request.operationType,
                request.params
            );
            // updateObs = this.sharedService.updateOperation(request);
        }

        updateObs.subscribe(
            (response: any) => {
                // if (this.editingTransaction && this.editingTransactionOld
                //     && this.editingTransaction.transId === this.editingTransactionOld.transId) {
                //     this.editingTransactionOld = Object.assign({}, this.editingTransaction);
                // }
                this.clearActiveTableRow();
                this.filterDates(
                    this.childDates.recalculateSelectedRangeIfNecessary(),
                    true
                );
                // this.filterDates(this.childDates.selectedPeriod);
                // this.filtersAll();
            },
            (err: HttpErrorResponse) => {
                Object.assign(oldRef, oldValue);
                if (
                    this.editingTransactionOld &&
                    this.editingTransactionOld.transId === oldRef.transId
                ) {
                    this.editingTransactionOld = Object.assign({}, oldRef);
                }

                if (err.error) {
                    console.log('An error occurred: %o', err.error.message);
                } else {
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    public isEdit(item: any, isEdit: boolean): void {
        if (isEdit) {
            if (item.unionId && item.targetType === 'CYCLIC_TRANS') {
                item.transDateFullEdit =
                    item.accountEdit =
                        item.transNameEdit =
                            item.paymentDescEdit =
                                item.selectedTransTypeEdit =
                                    item.asmachtaEdit =
                                        item.totalEdit =
                                            false;
                return;
            }

            item.transDateFullEdit =
                item.canChangeZefi &&
                (item.targetType === 'CHEQUE' ||
                    item.targetType === 'BANK_CHEQUE' ||
                    item.targetType === 'ERP_CHEQUE' ||
                    item.targetType === 'OTHER' ||
                    item.targetType === 'WIRE_TRANSFER' ||
                    item.targetType === 'CYCLIC_TRANS' ||
                    item.targetType === 'DIRECTD');

            item.accountEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'ERP_CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER';

            item.transNameEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'BANK_CHEQUE' ||
                item.targetType === 'ERP_CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER' ||
                item.targetType === 'BANK_TRANS' ||
                // || item.targetType === 'SOLEK_TAZRIM'
                item.targetType === 'CCARD_TAZRIM' ||
                item.targetType === 'LOAN_TAZRIM';

            item.paymentDescEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER' ||
                item.targetType === 'CYCLIC_TRANS';

            item.selectedTransTypeEdit =
                (item.targetType === 'CHEQUE' ||
                    item.targetType === 'BANK_CHEQUE' ||
                    item.targetType === 'ERP_CHEQUE' ||
                    item.targetType === 'OTHER' ||
                    item.targetType === 'WIRE_TRANSFER' ||
                    item.targetType === 'BANK_TRANS' ||
                    item.targetType === 'SOLEK_TAZRIM' ||
                    item.targetType === 'CCARD_TAZRIM' ||
                    item.targetType === 'LOAN_TAZRIM') &&
                !(
                    item.linkId && item.linkId !== '00000000-0000-0000-0000-000000000000'
                ) &&
                !(
                    item.pictureLink &&
                    item.pictureLink !== '00000000-0000-0000-0000-000000000000'
                );
            // && (!!item.biziboxMutavId
            //     ? !item.linkId || item.linkId !== '00000000-0000-0000-0000-000000000000'
            //     : true);
            item.asmachtaEdit =
                item.targetType === 'CHEQUE' ||
                item.targetType === 'OTHER' ||
                item.targetType === 'WIRE_TRANSFER' ||
                item.targetType === 'CYCLIC_TRANS';

            item.totalEdit =
                item.canChangeZefi &&
                (item.targetType === 'CHEQUE' ||
                    item.targetType === 'OTHER' ||
                    item.targetType === 'WIRE_TRANSFER' ||
                    (item.targetType === 'SOLEK_TAZRIM' && !item.unionId) ||
                    item.targetType === 'CCARD_TAZRIM' ||
                    item.targetType === 'CYCLIC_TRANS' ||
                    item.targetType === 'DIRECTD' ||
                    item.targetType === 'CASH');
        } else {
            item.transDateFullEdit = isEdit;
            item.accountEdit = isEdit;
            item.transNameEdit = isEdit;
            item.paymentDescEdit = isEdit;
            item.selectedTransTypeEdit = isEdit;
            item.asmachtaEdit = isEdit;
            item.totalEdit = isEdit;
        }
    }

    private hasChanges(): boolean {
        // console.log('Checking if changed...');

        if (
            !this.editingTransactionOld ||
            !this.editingTransaction ||
            this.editingTransaction.transId !== this.editingTransactionOld.transId
        ) {
            return false;
        }
        let isChange = false;
        // console.log('Checking if changed... 1');
        if (!this.editingTransaction.transDateFull) {
            this.editingTransaction.transDateFull =
                this.editingTransactionOld.transDateFull;
        } else if (!this.editingTransaction.originalDateFull) {
            this.editingTransaction.originalDateFull =
                this.editingTransactionOld.originalDateFull;
        }

        if (!this.editingTransaction.account) {
            this.editingTransaction.account = this.editingTransactionOld.account;
        }

        if (!this.editingTransaction.transName) {
            this.editingTransaction.transName = this.editingTransactionOld.transName;
        }

        if (!this.editingTransaction.paymentDesc) {
            this.editingTransaction.paymentDesc =
                this.editingTransactionOld.paymentDesc;
        }

        if (!this.editingTransaction.asmachta) {
            this.editingTransaction.asmachta = this.editingTransactionOld.asmachta;
        }

        if (!this.editingTransaction.total) {
            this.editingTransaction.total = this.editingTransactionOld.total;
        }

        if (!this.editingTransaction.uniItra) {
            this.editingTransaction.uniItra = this.editingTransactionOld.uniItra;
        }

        if (
            this.editingTransaction.selectedTransType &&
            this.editingTransaction.selectedTransType.transTypeId !==
            this.editingTransactionOld.transTypeId
        ) {
            this.editingTransaction.transTypeId =
                this.editingTransaction.selectedTransType.transTypeId;
            this.editingTransaction.transTypeName =
                this.editingTransaction.selectedTransType.transTypeName;
            return true;
        }
        // if (this.editingTransaction.selectedTransType !== this.editingTransactionOld.selectedTransType) {
        //     if (this.editingTransaction && this.editingTransactionOld
        //         && this.editingTransaction.transTypeId === this.editingTransactionOld.transTypeId) {
        //
        //         this.editingTransaction.transTypeId = this.editingTransaction.selectedTransType.transTypeId;
        //         this.editingTransaction.transTypeName = this.editingTransaction.selectedTransType.transTypeName;
        //         return true;
        //     }
        // }

        if (
            this.editingTransaction.transDateFull !==
            this.editingTransactionOld.transDateFull ||
            this.editingTransaction.account.companyAccountId !==
            this.editingTransactionOld.account.companyAccountId ||
            this.editingTransaction.transName !==
            this.editingTransactionOld.transName ||
            this.editingTransaction.paymentDesc !==
            this.editingTransactionOld.paymentDesc ||
            this.editingTransaction.asmachta !==
            this.editingTransactionOld.asmachta ||
            this.editingTransaction.total !== this.editingTransactionOld.total ||
            this.editingTransaction.uniItra !== this.editingTransactionOld.uniItra ||
            this.editingTransaction.originalDateFull !==
            this.editingTransactionOld.originalDateFull
        ) {
            isChange = true;
        }
        return isChange;
    }

    // exportAdditionalDetails(resultFileType: string): void {
    //     if (this.showAdditionalItem && this.lastAddionalsLoaded && this.lastAddionalsLoaded.length) {
    //
    //         if (this.showAdditionalItem.linkId) {
    //             this.reportService.getReport(this.lastAddionalsLoaded.length === 1
    //                 ? 'SINGLE_BANK_TRANS' : 'MULTIPLE_BANK_TRANS',
    //                 {
    //                     additionalProperties: {
    //                         'accountNum': this.showAdditionalItem.accountNickname,
    //                         'transDate': new Date(this.showAdditionalItem.transDate).toISOString(),
    //                         'expence': this.showAdditionalItem.hova
    //                     },
    //                     data: {
    //                         report: this.lastAddionalsLoaded.length === 1 ? this.lastAddionalsLoaded[0]
    //                             : this.lastAddionalsLoaded
    //                     }
    //                 },
    //                 resultFileType,
    //                 this.getAdditionalItemFilename())
    //                 .subscribe(() => {
    //                 });
    //         } else if (this.showAdditionalItem.pictureLink) {
    //             let report;
    //             if (this.lastAddionalsLoaded.length === 1) {
    //                 report = JSON.parse(JSON.stringify(this.lastAddionalsLoaded[0]));
    //                 if (report.image) {
    //                     report.image = [
    //                         [this.showAdditionalItem.account.bankId, this.showAdditionalItem.account.bankSnifId,
    //                             this.showAdditionalItem.account.bankAccountId].join(''),
    //                         report.imageNameKey].join('/');
    //                 }
    //                 delete report.imageNameKey;
    //
    //                 report.chequeBankNumber = report.chequeBankNumber;
    //                 report.chequeBank = this.translate.instant('banks.' + report.chequeBankNumber);
    //             } else {
    //                 report =  this.lastAddionalsLoaded;
    //             }
    //
    //             this.reportService.getReport(this.lastAddionalsLoaded.length === 1
    //                 ? 'CHECK_DETAILS' : 'MULTIPLE_CHECK_DETAILS',
    //                 {
    //                     additionalProperties: {
    //                         'reportDays': [
    //                             this.showAdditionalItem.accountNickname,
    //                             'לתאריך',
    //                             new Date(this.showAdditionalItem.transDate).toLocaleDateString('en-GB', {
    //                                 'day': 'numeric',
    //                                 'year': '2-digit',
    //                                 'month': '2-digit'
    //                             })].join(' ')
    //                     },
    //                     data: {
    //                         report: report
    //                     }
    //                 }, resultFileType,
    //                 this.getAdditionalItemFilename())
    //                 .subscribe((rslt) => {
    //                 });
    //         }
    //     }
    // }

    exportTransactions(resultFileType: string): void {
        // debugger;
        this.reportService
            .getReport(
                'TAZRIM_DETAILED',
                this.reportParamsFromCurrentView(resultFileType),
                resultFileType,
                this.reportService.prepareFilename(...this.getFilename())
            )
            .pipe(take(1))
            .subscribe(() => {
            });
    }

    rebuildForm() {
        this.userService.appData.popUpShow.data.reset({
            name: 'formGr'
        });
    }

    get arr(): FormArray {
        return this.userService.appData.popUpShow.data.get('arr') as FormArray;
    }

    paymentCreate(type: number) {
        // debugger;
        if (this.userService.appData.userData.accountSelect.length === 1) {
            this.selectedValue = this.userService.appData.userData.accountSelect[0];
            // } else {
            //     this.selectedValue = null;
        }
        this.selectedValuePayment = null;
        // const defCategory = this.companyTransTypes.filter((id) => id.transTypeId === this.DEFAULT_TRANSTYPE_ID);
        const obj = {
            dueDate: '',
            asmachta: '',
            transTypeId: this.defaultTransType,
            total: '',
            paymentDesc: ''
        };
        this.userService.appData.popUpShow = {
            type: type,
            styleClass: 'payment-create',
            header: true,
            body: true,
            footer: true,
            height: 540,
            width: 800,
            data: this.fb.group({
                name: 'formGr',
                arr: this.fb.array([this.fb.group(obj)]),
                ddAccountSelect: this.selectedValue, // '',
                ddTypePayments: '',
                ddMutav: ''
            })
        };

        this.userService.appData.popUpShow.data
            .get('ddMutav')
            .valueChanges.pipe(filter((val) => !!val))
            .subscribe((val) => {
                this.userService.appData.popUpShow.data
                    .get('arr')
                    .controls.forEach((fc) => {
                    fc.patchValue({
                        paymentDesc: [
                            'העברה ',
                            this.userService.appData.popUpShow.type === 44 ? 'ל-' : 'מ-',
                            val.accountMutavName
                        ].join(''),
                        transTypeId: this.companyTransTypes.find(
                            (ctt) => ctt.transTypeId === val.transTypeId
                        )
                    });
                });
                this.arr.value.forEach((item, idx) => {
                    this.searchAsmachta(item.asmachta, idx);
                });
            });

        this.userService.appData.popUpShow.data
            .get('ddAccountSelect')
            .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((term) => {
                this.arr.value.forEach((item, idx) => {
                    this.searchAsmachta(item.asmachta, idx);
                });
            });
    }

    addPayments(transferFocus?: boolean) {
        let dateNext: any = '';
        if (this.arr.value[this.arr.value.length - 1].dueDate !== '') {
            const dateLast = new Date(
                this.arr.value[this.arr.value.length - 1].dueDate
            );
            if (
                dateLast.getDate() ===
                new Date(dateLast.getFullYear(), dateLast.getMonth() + 1, 0).getDate()
            ) {
                dateNext = this.userService.appData
                    .moment(dateLast)
                    .add(1, 'months')
                    .endOf('month')
                    .toDate();
            } else {
                dateNext = this.userService.appData
                    .moment(dateLast)
                    .add(1, 'months')
                    .toDate();
            }
        }
        let asmachta: any = '';
        if (
            this.selectedValuePayment === 'Checks' &&
            this.arr.value[this.arr.value.length - 1].asmachta !== ''
        ) {
            asmachta = Number(this.arr.value[this.arr.value.length - 1].asmachta) + 1;
        }
        let paymentDesc: any = '';
        if (this.arr.value[this.arr.value.length - 1].paymentDesc !== '') {
            paymentDesc = this.arr.value[this.arr.value.length - 1].paymentDesc;
        }
        // let transTypeId: any = this.companyTransTypes.filter((id) => id.transTypeId === this.DEFAULT_TRANSTYPE_ID);
        let transTypeId = this.defaultTransType;
        if (this.arr.value[this.arr.value.length - 1].transTypeId !== '') {
            transTypeId = this.arr.value[this.arr.value.length - 1].transTypeId;
        }
        const obj = {
            dueDate: dateNext,
            asmachta: asmachta,
            transTypeId: transTypeId,
            total: this.arr.value[this.arr.value.length - 1].total,
            paymentDesc: paymentDesc
        };
        this.arr.push(this.fb.group(obj));
        this.validateScrollPresenceInside();

        if (transferFocus === true) {
            setTimeout(() => {
                this.paymentCreateTotalsRef.last.nativeElement.focus();
            });
        }

        requestAnimationFrame(() => {
            this.paymentCreateTotalsRef.last.nativeElement.scrollIntoView();
        });
    }

    removeItem(index: number) {
        this.arr.removeAt(index);
        this.arr.updateValueAndValidity();
        this.validateScrollPresenceInside();
    }

    paymentCreateWs(typeToClose: boolean): void {
        this.disabledAfterCreate = true;
        if (!this.userService.appData.popUpShow.data.valid) {
            BrowserService.flattenControls(
                this.userService.appData.popUpShow.data
            ).forEach((ac) => ac.markAsDirty());
            this.disabledAfterCreate = false;
            return;
        }

        const parameters: any = {
            companyAccountId: this.selectedValue.companyAccountId,
            companyId: this.userService.appData.userData.companySelect.companyId,
            receiptTypeId: this.userService.appData.popUpShow.type,
            sourceProgramId: null,
            targetType: this.selectedValuePayment, // .toUpperCase(),
            deleteOldExcel: false,
            biziboxMutavId: this.userService.appData.popUpShow.data.get('ddMutav')
                .value
                ? this.userService.appData.popUpShow.data.get('ddMutav').value
                    .biziboxMutavId
                : null,
            transes: this.arr.value.map((item) => {
                return {
                    asmachta: item.asmachta,
                    dueDate: item.dueDate,
                    paymentDesc: item.paymentDesc,
                    total: item.total,
                    transTypeId: item.transTypeId ? item.transTypeId.transTypeId : ''
                };
            })
        };

        const transLocateDataIfSuccess = {
            companyAccountId: this.selectedValue.companyAccountId,
            date: new Date(
                Math.min(...this.arr.value.map((item) => item.dueDate.getTime()))
            )
        };
        const numTrans = this.arr.value.length;
        this.sharedService.paymentCreate(parameters).subscribe(
            (response: any) => {
                this.disabledAfterCreate = false;
                const type = this.userService.appData.popUpShow.type;
                this.userService.appData.popUpShow = false;
                if (!typeToClose) {
                    this.paymentCreate(type);
                }
                this.childDates.selectedRange
                    .pipe(take(1))
                    .subscribe(() =>
                        this.filterDates(
                            this.childDates.recalculateSelectedRangeIfNecessary()
                        )
                    );
                // this.filterDates(this.childDates.selectedPeriod);

                if (typeToClose) {
                    this.togglePaymentCreateSuccessSnack(
                        Object.assign(transLocateDataIfSuccess, {
                            transId: response.body as string
                        }),
                        numTrans
                    );
                }
            },
            (err: HttpErrorResponse) => {
                this.disabledAfterCreate = false;
                if (err.error) {
                    console.log('An error occurred:', err.error.message);
                } else {
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    private validateScrollPresenceInside(): void {
        setTimeout(() => {
            const scrollContainerHasScrollNow =
                this.scrollContainerInside !== null &&
                this.scrollContainerInside.nativeElement.scrollHeight >
                this.scrollContainerInside.nativeElement.clientHeight;
            if (this.scrollContainerInsideHasScroll !== scrollContainerHasScrollNow) {
                // console.log('validateScrollPresence: scrollContainerHasScroll > %o', scrollContainerHasScrollNow);
                this.scrollContainerInsideHasScroll = scrollContainerHasScrollNow;
            }
        });
    }

    deleteOperation(item: any, confirmed?: boolean): any {
        console.log('delete prompt called for %o', item);

        if (confirmed === true) {
            this.deleteConfirmationPrompt.processing = true;
            // debugger;
            const editType =
                String(this.deleteConfirmationPrompt.optionSelected) === '1'
                    ? EditingType.Series
                    : EditingType.Single;
            const actionObsrv$ =
                editType === EditingType.Series
                    ? this.sharedService
                        .getCyclicTransactionSingle(JSON.parse(JSON.stringify(item)))
                        .pipe(
                            map((resp: any) =>
                                !resp ||
                                resp.error ||
                                !Array.isArray(resp.body.transes) ||
                                !resp.body.transes.length
                                    ? null
                                    : resp.body.transes[0].transId
                            ),
                            switchMap((result: any) => {
                                return result
                                    ? this.sharedService.deleteOperation({
                                        params: {
                                            companyAccountId: item.companyAccountId,
                                            transId: result,
                                            dateFrom: item.kvuaDateFrom
                                        },
                                        editType: editType,
                                        operationType: item.targetType
                                    })
                                    : new Error('Failed to get transId');
                            })
                        )
                    : this.sharedService.deleteOperation({
                        params: {
                            companyAccountId: item.companyAccountId,
                            transId: item.transId,
                            dateFrom: item.kvuaDateFrom
                        },
                        editType: editType,
                        operationType: item.targetType
                    });

            actionObsrv$.pipe(take(1)).subscribe(
                () => {
                    if (
                        this.deleteConfirmationPrompt &&
                        this.deleteConfirmationPrompt.item === item
                    ) {
                        this.deleteConfirmationPrompt = null;
                    }
                    // const indexRow = this.dataTableAll['cashFlowDetails'].findIndex((element) => element.transId === item.transId);
                    // this.dataTableAll['cashFlowDetails'].splice(indexRow, 1);
                    // this.filtersAll();
                    // this.filterDates(this.childDates.selectedPeriod);
                    this.childDates.selectedRange
                        .pipe(take(1))
                        .subscribe(() =>
                            this.filterDates(
                                this.childDates.recalculateSelectedRangeIfNecessary()
                            )
                        );
                },
                (err: HttpErrorResponse) => {
                    if (
                        this.deleteConfirmationPrompt &&
                        this.deleteConfirmationPrompt.item === item
                    ) {
                        this.deleteConfirmationPrompt.processing = false;
                    }
                    if (err.error) {
                        console.log('An error occurred: %o', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
        } else {
            const itemType =
                ([
                    'CHEQUE',
                    'WIRE_TRANSFER',
                    'OTHER',
                    'BANK_CHEQUE',
                    'ERP_CHEQUE'
                ].includes(item.targetType)
                    ? 'EXPECTED'
                    : false) ||
                ([
                    'SOLEK_TAZRIM',
                    'CCARD_TAZRIM',
                    'LOAN_TAZRIM',
                    'CYCLIC_TRANS',
                    'DIRECTD'
                ].includes(item.targetType)
                    ? 'FIXED'
                    : null);

            const options = this.translate.instant(
                `actions.deleteMovement.body.${itemType}.options`
            );

            this.deleteConfirmationPrompt = {
                item: item,
                transName: item.transName,
                type: itemType,
                title: this.translate.instant('actions.deleteMovement.titlePtrn', {
                    itemType: this.translate.instant(
                        `actions.deleteMovement.body.${itemType}.title`
                    )
                }),
                options: Array.isArray(options)
                    ? options.map((opt, idx) => {
                        return {
                            label: opt,
                            value: idx
                        };
                    })
                    : null,
                optionSelected: 0,
                processing: false
            };
        }
    }

    isValid(date: any) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            if (!isNaN(date.getTime())) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    getJsDateFromExcel(excelDate): Date {
        return new Date((parseFloat(excelDate) - (25568 + 1)) * 86400 * 1000);
    }

    getTimezoneOffsetMS(date) {
        var fullYear = date.getFullYear();
        var month = date.getMonth();
        var day = date.getDate();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var ms = date.getMilliseconds();

        var time = date.getTime();
        var utcTime = Date.UTC(fullYear, month, day, hours, minutes, seconds, ms);
        var result = time - utcTime;
        return result;
    };

    onFileChange(evt: any) {
        // debugger;
        const target: DataTransfer = <DataTransfer>evt.target;
        // if (target.files.length !== 1) throw new Error('Cannot use multiple files');
        // const reader: FileReader = new FileReader();
        // reader.readAsBinaryString(target.files[0]);
        this.popUpExcelImportShow.form
            .get('filename')
            .setValue(target.files[0].name);

        this.popUpExcelImportShow.alertErrorUploadExcel = false;
        this.popUpExcelImportShow.valid = false;
        this.popUpExcelImportShow.numberRowsExcel = 0;
        this.dataArrExcel = [];
        if (target.files[0].size > 300000) {
            this.popUpExcelImportShow.alertErrorUploadExcel = this.translate.instant(
                'alertErrorUploadExcel.unacceptable'
            );
            // 'לא ניתן לייבא קובץ ' + target.files[0].name + ' [' + (target.files[0].size / 1000) + 'K]';
            return;
        }

        const readObs: Observable<string> = new Observable((observable: any) => {
            const reader: FileReader = new FileReader();

            reader.onload = () => {
                observable.next(reader.result);
                observable.complete();
            };

            reader.readAsBinaryString(target.files[0]);
        });

        this.popUpExcelImportShow.processing = true;
        readObs.subscribe(
            {
                next: (bstr) => {
                    const wb: XLSX.WorkBook = XLSX.read(bstr, {
                        type: 'binary',
                        cellDates: true,
                        cellText: false
                    });
                    const wsname: string = wb.SheetNames[0];
                    const ws: XLSX.WorkSheet = wb.Sheets[wsname];
                    this.data = <AOA>(
                        XLSX.utils.sheet_to_json(ws, {header: 1, dateNF: 'DD/MM/YYYY'})
                    );
                    if (this.data.length) {
                        if (!this.data.some((o) => o.indexOf('סכום') >= 0)) {
                            this.popUpExcelImportShow.alertErrorUploadExcel =
                                this.translate.instant('alertErrorUploadExcel.unacceptable');
                            // 'לא ניתן לייבא קובץ ' + target.files[0].name;
                            return;
                        }

                        let typePeulaIndex: number,
                            typePaymentIndex: number,
                            dateIndex: number,
                            asmachtaIndex: number,
                            sumIndex: number,
                            descIndex: number,
                            transTypeIndex: number,
                            idxRow = 0;
                        const arrRows = [];
                        for (const o of this.data) {
                            idxRow += 1;
                            let total: any = null,
                                typePeulaNum: any,
                                asmachta: any = null,
                                paymentDesc: any = '',
                                dueDate: any = null,
                                payment: 'Checks' | 'BankTransfer' | 'Other';
                            // console.log(o);
                            if (o.indexOf('סוג_פעולה') !== -1) {
                                typePeulaIndex = o.indexOf('סוג_פעולה');
                                typePaymentIndex = o.indexOf('סוג_תשלום');
                                dateIndex = o.indexOf('תאריך');
                                asmachtaIndex = o.indexOf('אסמכתא');
                                sumIndex = o.indexOf('סכום');
                                descIndex = o.indexOf('תיאור');
                                transTypeIndex = o.indexOf('קטגוריה');
                            } else if (
                                o.length &&
                                o.some((cellval) => cellval && cellval.toString().trim())
                            ) {
                                switch (o[typePaymentIndex]) {
                                    case 'שיק':
                                    case 'צ\'ק':
                                        payment = 'Checks';
                                        break;
                                    case 'העברה בנקאית':
                                        payment = 'BankTransfer';
                                        break;
                                    default:
                                        payment = 'Other';
                                }
                                // const typePayment = o[typePaymentIndex];
                                // if (typePayment === undefined) {
                                //     this.popUpExcelImportShow.alertErrorUploadExcel =
                                //         this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
                                //             rowNum: idxRow,
                                //             errorMessage: this.translate.instant('alertErrorUploadExcel.payment')
                                //         });
                                //         // this.translate.instant('alertErrorUploadExcel.row')
                                //         // + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.payment');
                                //     return;
                                // } else {
                                //     const paymentNum = typePayment.trim();
                                //     if (paymentNum.includes('שיק')) {
                                //         payment = 'Checks'; // 'check'.toUpperCase();
                                //     } else if (paymentNum.includes('העברה בנקאית')) {
                                //         payment = 'BankTransfer'; // 'wire'.toUpperCase();
                                //     } else if (paymentNum.includes('אחר')) {
                                //         payment = 'Other'; // 'other_payment'.toUpperCase();
                                //     } else {
                                //         this.popUpExcelImportShow.alertErrorUploadExcel =
                                //             this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
                                //                 rowNum: idxRow,
                                //                 errorMessage: this.translate.instant('alertErrorUploadExcel.paymentFormat')
                                //             });
                                //         // this.translate.instant('alertErrorUploadExcel.row')
                                //         //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.paymentFormat');
                                //         return;
                                //     }
                                // }

                                const sum = o[sumIndex];
                                if (sum === undefined || isNaN(parseFloat(sum))) {
                                    this.popUpExcelImportShow.alertErrorUploadExcel =
                                        this.translate.instant(
                                            'alertErrorUploadExcel.errorMessagePtrn',
                                            {
                                                rowNum: idxRow,
                                                errorMessage: this.translate.instant(
                                                    'alertErrorUploadExcel.sum'
                                                )
                                            }
                                        );
                                    // this.translate.instant('alertErrorUploadExcel.row')
                                    //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.sum');
                                    return;
                                }
                                const typePeula = o[typePeulaIndex];
                                if (typePeula && typePeula.includes('הכנסה')) {
                                    total = Math.abs(parseFloat(sum));
                                    typePeulaNum = 400;
                                } else if (typePeula && typePeula.includes('הוצאה')) {
                                    total = Math.abs(parseFloat(sum));
                                    typePeulaNum = 44;
                                } else {
                                    this.popUpExcelImportShow.alertErrorUploadExcel =
                                        this.translate.instant(
                                            'alertErrorUploadExcel.errorMessagePtrn',
                                            {
                                                rowNum: idxRow,
                                                errorMessage: this.translate.instant(
                                                    'alertErrorUploadExcel.typePay'
                                                )
                                            }
                                        );
                                    // this.translate.instant('alertErrorUploadExcel.row')
                                    //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.typePay');
                                    return;
                                }

                                asmachta = o[asmachtaIndex];
                                if (asmachta) {
                                    if (isNaN(asmachta) === false) {
                                        asmachta = parseFloat(asmachta);
                                    } else if (asmachta.replace(/\D/g, '') === '') {
                                        asmachta = null; // 0;
                                    } else {
                                        asmachta = parseFloat(asmachta.replace(/\D/g, ''));
                                    }
                                } else {
                                    asmachta = null; // 0;
                                }

                                const desc = o[descIndex];
                                if (desc) {
                                    paymentDesc = desc;
                                } else {
                                    this.popUpExcelImportShow.alertErrorUploadExcel =
                                        this.translate.instant(
                                            'alertErrorUploadExcel.errorMessagePtrn',
                                            {
                                                rowNum: idxRow,
                                                errorMessage: this.translate.instant(
                                                    'alertErrorUploadExcel.desc'
                                                )
                                            }
                                        );
                                    // this.translate.instant('alertErrorUploadExcel.row')
                                    //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.desc');
                                    return;
                                }

                                const dateVal: any = o[dateIndex];
                                if (dateVal) {
                                    console.log(dateVal);
                                    const isValidDate = this.isValid(dateVal);
                                    const formatDate = dateVal.toString();
                                    if (isValidDate) {
                                        dueDate = this.userService.appData
                                            .moment(dateVal);
                                        // dueDate = new Date(dateVal).toISOString();
                                    } else if (
                                        formatDate.indexOf('/') === -1 &&
                                        formatDate.indexOf('.') === -1 &&
                                        formatDate.indexOf('-') === -1
                                    ) {
                                        const dates: any = this.getJsDateFromExcel(dateVal);
                                        dueDate = this.userService.appData
                                            .moment(dates);
                                        // console.log(dueDate)
                                    } else {
                                        try {
                                            if (formatDate.indexOf('/') !== -1) {
                                                const dates = dateVal.toString().replace(/\s/g, '');
                                                const years = dates.split('/')[2];
                                                let yearSend;
                                                if (years.length === 4) {
                                                    yearSend = years;
                                                }
                                                if (years.length === 2) {
                                                    yearSend = '20' + years;
                                                }
                                                dueDate = this.userService.appData
                                                    .moment(new Date(
                                                        Number(yearSend),
                                                        Number(dates.split('/')[1]) - 1,
                                                        Number(dates.split('/')[0])
                                                    ));

                                            }
                                            if (formatDate.indexOf('.') !== -1) {
                                                const dates = dateVal.toString().replace(/\s/g, '');
                                                const years = dates.split('.')[2];
                                                let yearSend;
                                                if (years.length === 4) {
                                                    yearSend = years;
                                                }
                                                if (years.length === 2) {
                                                    yearSend = '20' + years;
                                                }
                                                dueDate = this.userService.appData
                                                    .moment(new Date(
                                                        Number(yearSend),
                                                        Number(dates.split('.')[1]) - 1,
                                                        Number(dates.split('.')[0])
                                                    ));

                                            }
                                            if (formatDate.indexOf('-') !== -1) {
                                                const dates = dateVal.toString().replace(/\s/g, '');
                                                const years = dates.split('-')[2];
                                                let yearSend;
                                                if (years.length === 4) {
                                                    yearSend = years;
                                                }
                                                if (years.length === 2) {
                                                    yearSend = '20' + years;
                                                }
                                                dueDate = this.userService.appData
                                                    .moment(new Date(
                                                        Number(yearSend),
                                                        Number(dates.split('-')[1]) - 1,
                                                        Number(dates.split('-')[0])
                                                    ));

                                            }
                                        } catch (e) {
                                            this.popUpExcelImportShow.alertErrorUploadExcel =
                                                this.translate.instant(
                                                    'alertErrorUploadExcel.errorMessagePtrn',
                                                    {
                                                        rowNum: idxRow,
                                                        errorMessage: this.translate.instant(
                                                            'alertErrorUploadExcel.dateFormat'
                                                        )
                                                    }
                                                );
                                            // this.translate.instant('alertErrorUploadExcel.row')
                                            // + idxRow + ' '
                                            // + this.translate.instant('alertErrorUploadExcel.dateFormat');
                                            return;
                                        }
                                        if (
                                            formatDate.indexOf('/') === -1 &&
                                            formatDate.indexOf('.') === -1 &&
                                            formatDate.indexOf('-') === -1
                                        ) {
                                            this.popUpExcelImportShow.alertErrorUploadExcel =
                                                this.translate.instant(
                                                    'alertErrorUploadExcel.errorMessagePtrn',
                                                    {
                                                        rowNum: idxRow,
                                                        errorMessage: this.translate.instant(
                                                            'alertErrorUploadExcel.dateFormat'
                                                        )
                                                    }
                                                );
                                            // this.translate.instant('alertErrorUploadExcel.row')
                                            // + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.dateFormat');
                                            return;
                                        }
                                    }
                                } else {
                                    this.popUpExcelImportShow.alertErrorUploadExcel =
                                        this.translate.instant(
                                            'alertErrorUploadExcel.errorMessagePtrn',
                                            {
                                                rowNum: idxRow,
                                                errorMessage: this.translate.instant(
                                                    'alertErrorUploadExcel.date'
                                                )
                                            }
                                        );
                                    // this.translate.instant('alertErrorUploadExcel.row')
                                    //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.date');
                                    return;
                                }

                                let transTypeId = this.DEFAULT_TRANSTYPE_ID,
                                    transType,
                                    transTypeFound;
                                if (
                                    Array.isArray(this.companyTransTypes) &&
                                    o[transTypeIndex] &&
                                    (transType = String(o[transTypeIndex]).trim()) &&
                                    (transTypeFound = this.companyTransTypes.find(
                                        (tt) => tt.transTypeName === transType
                                    ))
                                ) {
                                    transTypeId = transTypeFound.transTypeId;
                                }

                                this.popUpExcelImportShow.numberRowsExcel += 1;

                                console.log('dueDate: ', dueDate.format('LL'), dueDate.add(1, 'hours').format('LL'), dueDate.add(1, 'hours').valueOf());
                                dueDate = dueDate.add(1, 'hours').valueOf();
                                if (!arrRows[typePeulaNum]) {
                                    arrRows[typePeulaNum] = [];
                                    arrRows[typePeulaNum][payment] = [
                                        {
                                            asmachta: asmachta,
                                            dueDate: dueDate,
                                            paymentDesc: paymentDesc,
                                            total: total,
                                            transTypeId: transTypeId
                                        }
                                    ];
                                } else if (!arrRows[typePeulaNum][payment]) {
                                    arrRows[typePeulaNum][payment] = [
                                        {
                                            asmachta: asmachta,
                                            dueDate: dueDate,
                                            paymentDesc: paymentDesc,
                                            total: total,
                                            transTypeId: transTypeId
                                        }
                                    ];
                                } else {
                                    arrRows[typePeulaNum][payment].push({
                                        asmachta: asmachta,
                                        dueDate: dueDate,
                                        paymentDesc: paymentDesc,
                                        total: total,
                                        transTypeId: transTypeId
                                    });
                                }
                            }
                        }
                        if (arrRows.length) {
                            this.popUpExcelImportShow.valid = true;
                            this.dataArrExcel = arrRows;
                            this.uploadBtn.nativeElement.value = '';
                        }
                    }
                },
                error: () => {
                },
                complete: () => (this.popUpExcelImportShow.processing = false)
            }
        );

        // reader.onload = (e: any) => {
        //     this.popUpExcelImportShow.alertErrorUploadExcel = false;
        //     this.popUpExcelImportShow.valid = false;
        //     this.popUpExcelImportShow.numberRowsExcel = 0;
        //     this.dataArrExcel = [];
        //
        //     const bstr: string = e.target.result;
        //     // this.popUpExcelImportShow.valTextFile = target.files[0].name;
        //     this.popUpExcelImportShow.form.get('filename').setValue(target.files[0].name);
        //     const wb: XLSX.WorkBook = XLSX.read(bstr, {type: 'binary', cellDates: true, cellText: false});
        //     const wsname: string = wb.SheetNames[0];
        //     const ws: XLSX.WorkSheet = wb.Sheets[wsname];
        //
        //     this.data = <AOA>(XLSX.utils.sheet_to_json(ws, {header: 1, dateNF: 'DD/MM/YYYY'}));
        //     // debugger;
        //     if (this.data.length) {
        //         let typePeulaIndex: number,
        //             typePaymentIndex: number,
        //             dateIndex: number,
        //             asmachtaIndex: number,
        //             sumIndex: number,
        //             descIndex: number,
        //             transTypeIndex: number,
        //             idxRow = 0;
        //         const arrRows = [];
        //         for (const o of this.data) {
        //             idxRow += 1;
        //             let total: any = null,
        //                 typePeulaNum: any,
        //                 asmachta: any = null,
        //                 paymentDesc: any = '',
        //                 dueDate: any = null,
        //                 payment: 'Checks' | 'BankTransfer' | 'Other';
        //
        //             if (o.indexOf('סוג_פעולה') !== -1) {
        //                 typePeulaIndex = o.indexOf('סוג_פעולה');
        //                 typePaymentIndex = o.indexOf('סוג_תשלום');
        //                 dateIndex = o.indexOf('תאריך');
        //                 asmachtaIndex = o.indexOf('אסמכתא');
        //                 sumIndex = o.indexOf('סכום');
        //                 descIndex = o.indexOf('תיאור');
        //                 transTypeIndex = o.indexOf('קטגוריה');
        //             } else if (o.length && o.some(cellval => cellval && cellval.toString().trim())) {
        //                 switch (o[typePaymentIndex]) {
        //                     case 'שיק':
        //                     case 'צ\'ק':
        //                         payment = 'Checks';
        //                         break;
        //                     case 'העברה בנקאית':
        //                         payment = 'BankTransfer';
        //                         break;
        //                     default:
        //                         payment = 'Other';
        //                 }
        //                 // const typePayment = o[typePaymentIndex];
        //                 // if (typePayment === undefined) {
        //                 //     this.popUpExcelImportShow.alertErrorUploadExcel =
        //                 //         this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                 //             rowNum: idxRow,
        //                 //             errorMessage: this.translate.instant('alertErrorUploadExcel.payment')
        //                 //         });
        //                 //         // this.translate.instant('alertErrorUploadExcel.row')
        //                 //         // + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.payment');
        //                 //     return;
        //                 // } else {
        //                 //     const paymentNum = typePayment.trim();
        //                 //     if (paymentNum.includes('שיק')) {
        //                 //         payment = 'Checks'; // 'check'.toUpperCase();
        //                 //     } else if (paymentNum.includes('העברה בנקאית')) {
        //                 //         payment = 'BankTransfer'; // 'wire'.toUpperCase();
        //                 //     } else if (paymentNum.includes('אחר')) {
        //                 //         payment = 'Other'; // 'other_payment'.toUpperCase();
        //                 //     } else {
        //                 //         this.popUpExcelImportShow.alertErrorUploadExcel =
        //                 //             this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                 //                 rowNum: idxRow,
        //                 //                 errorMessage: this.translate.instant('alertErrorUploadExcel.paymentFormat')
        //                 //             });
        //                 //         // this.translate.instant('alertErrorUploadExcel.row')
        //                 //         //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.paymentFormat');
        //                 //         return;
        //                 //     }
        //                 // }
        //
        //                 const sum = o[sumIndex];
        //                 if (sum === undefined || isNaN(parseFloat(sum))) {
        //                     this.popUpExcelImportShow.alertErrorUploadExcel =
        //                         this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                             rowNum: idxRow,
        //                             errorMessage: this.translate.instant('alertErrorUploadExcel.sum')
        //                         });
        //                     // this.translate.instant('alertErrorUploadExcel.row')
        //                     //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.sum');
        //                     return;
        //                 }
        //                 const typePeula = o[typePeulaIndex];
        //                 if (typePeula && typePeula.includes('הכנסה')) {
        //                     total = Math.abs(parseFloat(sum));
        //                     typePeulaNum = 400;
        //                 } else if (typePeula && typePeula.includes('הוצאה')) {
        //                     total = Math.abs(parseFloat(sum));
        //                     typePeulaNum = 44;
        //                 } else {
        //                     this.popUpExcelImportShow.alertErrorUploadExcel =
        //                         this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                             rowNum: idxRow,
        //                             errorMessage: this.translate.instant('alertErrorUploadExcel.typePay')
        //                         });
        //                     // this.translate.instant('alertErrorUploadExcel.row')
        //                     //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.typePay');
        //                     return;
        //                 }
        //
        //                 asmachta = o[asmachtaIndex];
        //                 if (asmachta) {
        //                     if (isNaN(asmachta) === false) {
        //                         asmachta = parseFloat(asmachta);
        //                     } else if (asmachta.replace(/\D/g, '') === '') {
        //                         asmachta = 0;
        //                     } else {
        //                         asmachta = parseFloat(asmachta.replace(/\D/g, ''));
        //                     }
        //                 } else {
        //                     asmachta = 0;
        //                 }
        //
        //                 const desc = o[descIndex];
        //                 if (desc) {
        //                     paymentDesc = desc;
        //                 } else {
        //                     this.popUpExcelImportShow.alertErrorUploadExcel =
        //                         this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                             rowNum: idxRow,
        //                             errorMessage: this.translate.instant('alertErrorUploadExcel.desc')
        //                         });
        //                     // this.translate.instant('alertErrorUploadExcel.row')
        //                     //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.desc');
        //                     return;
        //                 }
        //
        //                 const dateVal = o[dateIndex];
        //                 if (dateVal) {
        //                     const formatDate = dateVal.toString();
        //                     if (formatDate.indexOf('/') === -1 && formatDate.indexOf('.') === -1 && formatDate.indexOf('-') === -1) {
        //                         const dates: any = this.getJsDateFromExcel(dateVal);
        //                         dueDate = dates.toISOString();
        //                     } else {
        //                         try {
        //                             if (formatDate.indexOf('/') !== -1) {
        //                                 const dates = dateVal.toString().replace(/\s/g, '');
        //                                 const years = dates.split('/')[2];
        //                                 let yearSend;
        //                                 if (years.length === 4) {
        //                                     yearSend = years;
        //                                 }
        //                                 if (years.length === 2) {
        //                                     yearSend = '20' + years;
        //                                 }
        //                                 dueDate = new Date(Number(yearSend),
        //                                     Number(dates.split('/')[1]) - 1,
        //                                     Number(dates.split('/')[0])
        //                                 ).toISOString();
        //                             }
        //                             if (formatDate.indexOf('.') !== -1) {
        //                                 const dates = dateVal.toString().replace(/\s/g, '');
        //                                 const years = dates.split('.')[2];
        //                                 let yearSend;
        //                                 if (years.length === 4) {
        //                                     yearSend = years;
        //                                 }
        //                                 if (years.length === 2) {
        //                                     yearSend = '20' + years;
        //                                 }
        //                                 dueDate = new Date(Number(yearSend),
        //                                     Number(dates.split('.')[1]) - 1,
        //                                     Number(dates.split('.')[0])
        //                                 ).toISOString();
        //                             }
        //                             if (formatDate.indexOf('-') !== -1) {
        //                                 const dates = dateVal.toString().replace(/\s/g, '');
        //                                 const years = dates.split('-')[2];
        //                                 let yearSend;
        //                                 if (years.length === 4) {
        //                                     yearSend = years;
        //                                 }
        //                                 if (years.length === 2) {
        //                                     yearSend = '20' + years;
        //                                 }
        //                                 dueDate = new Date(Number(yearSend),
        //                                     Number(dates.split('-')[1]) - 1,
        //                                     Number(dates.split('-')[0])
        //                                 ).toISOString();
        //                             }
        //                         } catch (e) {
        //                             this.popUpExcelImportShow.alertErrorUploadExcel =
        //                                 this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                                     rowNum: idxRow,
        //                                     errorMessage: this.translate.instant('alertErrorUploadExcel.dateFormat')
        //                                 });
        //                             // this.translate.instant('alertErrorUploadExcel.row')
        //                             // + idxRow + ' '
        //                             // + this.translate.instant('alertErrorUploadExcel.dateFormat');
        //                             return;
        //                         }
        //                         if ((formatDate.indexOf('/') === -1) && (formatDate.indexOf('.') === -1)
        //                             && (formatDate.indexOf('-') === -1)) {
        //                             this.popUpExcelImportShow.alertErrorUploadExcel =
        //                                 this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                                     rowNum: idxRow,
        //                                     errorMessage: this.translate.instant('alertErrorUploadExcel.dateFormat')
        //                                 });
        //                             // this.translate.instant('alertErrorUploadExcel.row')
        //                             // + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.dateFormat');
        //                             return;
        //                         }
        //                     }
        //                 } else {
        //                     this.popUpExcelImportShow.alertErrorUploadExcel =
        //                         this.translate.instant('alertErrorUploadExcel.errorMessagePtrn', {
        //                             rowNum: idxRow,
        //                             errorMessage: this.translate.instant('alertErrorUploadExcel.date')
        //                         });
        //                     // this.translate.instant('alertErrorUploadExcel.row')
        //                     //     + idxRow + ' ' + this.translate.instant('alertErrorUploadExcel.date');
        //                     return;
        //                 }
        //
        //                 let transTypeId = this.DEFAULT_TRANSTYPE_ID, transType, transTypeFound;
        //                 if (Array.isArray(this.companyTransTypes)
        //                     && o[transTypeIndex]
        //                     && (transType = String(o[transTypeIndex]).trim())
        //                     && (transTypeFound = this.companyTransTypes.find(tt => tt.transTypeName === transType))) {
        //                     transTypeId = transTypeFound.transTypeId;
        //                 }
        //
        //                 this.popUpExcelImportShow.numberRowsExcel += 1;
        //
        //                 if (!arrRows[typePeulaNum]) {
        //                     arrRows[typePeulaNum] = [];
        //                     arrRows[typePeulaNum][payment] = [
        //                         {
        //                             'asmachta': asmachta,
        //                             'dueDate': dueDate,
        //                             'paymentDesc': paymentDesc,
        //                             'total': total,
        //                             'transTypeId': transTypeId
        //                         }
        //                     ];
        //                 } else if (!arrRows[typePeulaNum][payment]) {
        //                     arrRows[typePeulaNum][payment] = [
        //                         {
        //                             'asmachta': asmachta,
        //                             'dueDate': dueDate,
        //                             'paymentDesc': paymentDesc,
        //                             'total': total,
        //                             'transTypeId': transTypeId
        //                         }
        //                     ];
        //                 } else {
        //                     arrRows[typePeulaNum][payment].push({
        //                         'asmachta': asmachta,
        //                         'dueDate': dueDate,
        //                         'paymentDesc': paymentDesc,
        //                         'total': total,
        //                         'transTypeId': transTypeId
        //                     });
        //                 }
        //             }
        //         }
        //
        //         if (arrRows.length) {
        //             this.popUpExcelImportShow.valid = true;
        //             this.dataArrExcel = arrRows;
        //             this.uploadBtn.nativeElement.value = '';
        //         }
        //     }
        // };
    }

    openImportExcel() {
        // if (this.userService.appData.userData.accountSelect.length === 1) {
        //     this.selectedValue = this.userService.appData.userData.accountSelect[0];
        // } else {
        //     this.selectedValue = null;
        // }

        this.popUpExcelImportShow = {
            numberRowsExcel: 0,
            deleteOldExcel: new FormControl(false),
            // valTextFile: '',
            alertErrorUploadExcel: false,
            styleClass: 'importExcel',
            height: 380,
            width: 350,
            valid: false,
            form: new FormGroup({
                account: new FormControl(
                    this.userService.appData.userData.accountSelect.length === 1
                        ? this.userService.appData.userData.accountSelect[0]
                        : null
                ),
                filename: new FormControl('', [Validators.required])
            })
        };
    }

    sendDataFromExcel() {
        // debugger;
        if (!this.popUpExcelImportShow) {
            return;
        }
        if (
            !this.popUpExcelImportShow.valid ||
            !this.popUpExcelImportShow.form.valid
        ) {
            BrowserService.flattenControls(this.popUpExcelImportShow.form).forEach(
                (ac) => ac.markAsDirty()
            );
            return;
        }

        let firstCall = true;
        const obsrvbls: Observable<any>[] = [];
        // const dateArray: any[] = [];

        for (const obj in this.dataArrExcel) {
            if (this.dataArrExcel.hasOwnProperty(obj)) {
                for (const obj1 in this.dataArrExcel[obj]) {
                    if (this.dataArrExcel[obj].hasOwnProperty(obj1)) {
                        const parameters: any = {
                            companyAccountId:
                            this.popUpExcelImportShow.form.get('account').value
                                .companyAccountId,
                            // this.selectedValue.companyAccountId,
                            companyId:
                            this.userService.appData.userData.companySelect.companyId,
                            receiptTypeId: Number(obj),
                            sourceProgramId: 150,
                            targetType: obj1,
                            deleteOldExcel: firstCall
                                ? this.popUpExcelImportShow.deleteOldExcel.value
                                : false,
                            transes: this.dataArrExcel[obj][obj1]
                        };
                        obsrvbls.push(this.sharedService.paymentCreate(parameters));
                        // dateArray.push(parameters.transes[0].dueDate);
                        firstCall = false;
                        // this.paymentCreateWsExcel(parameters);
                    }
                }
            }
        }

        if (obsrvbls.length > 0) {
            // const transLocateDataIfSuccess = {
            //     companyAccountId: this.popUpExcelImportShow.form.get('account').value.companyAccountId,
            //     date: new Date(Math.min(...dateArray))
            // };
            let responseArr = [];
            this.popUpExcelImportShow.pending = true;
            const __this = this;
            let req = {
                companyAccountId:
                this.popUpExcelImportShow.form.get('account').value.companyAccountId,
                excelIds: []
            };
            // let transId: any = '';

            combineLatest(
                obsrvbls.length > 1 ? [
                    obsrvbls[0],
                    zip(...obsrvbls.slice(1))
                ] : [
                    obsrvbls[0]
                ]
            )
                .pipe(take(2))
                .subscribe((res) => {
                    if (Array.isArray(res)) {
                        responseArr = responseArr.concat(res);
                    } else {
                        responseArr.push(res);
                    }

                    __this.popUpExcelImportShow.pending = false;
                    __this.popUpExcelImportShow = false;
                    __this.childDates.selectedRange
                        .pipe(take(1))
                        .subscribe(() =>
                            __this.filterDates(
                                __this.childDates.recalculateSelectedRangeIfNecessary()
                            )
                        );
                    let numOfSentRows = 0;
                    let numOfInsertRows = 0;
                    responseArr.forEach((res) => {
                        const body = res ? res['body'] : res;
                        if (body) {
                            if (body.excelId) {
                                req.excelIds.push(body.excelId);
                            }
                            numOfSentRows += body.numOfSentRows;
                            numOfInsertRows += body.numOfInsertRows;
                        }
                    });
                    if (numOfSentRows === numOfInsertRows) {
                        req = null;
                    }
                    if (req) {
                        __this.sharedService
                            .excelDuplicateImport(req)
                            .subscribe((response: any) => {
                                const responseList = response ? response['body'] : response;
                                __this.popUpExcelImportDuplicateShow = {
                                    companyAccountId: req.companyAccountId,
                                    styleClass: 'popUpExcelImportDuplicateShow',
                                    height: 550,
                                    width: 775,
                                    valid: false,
                                    pending: false,
                                    list: Array.isArray(responseList)
                                        ? responseList.map((item) => {
                                            item.message = __this.formatMessage(item.message);
                                            return item;
                                        })
                                        : responseList,
                                    numOfSentRows: numOfSentRows,
                                    numOfInsertRows: numOfInsertRows,
                                    listToSend: []
                                };
                            });
                    } else {
                        if (numOfInsertRows === 1) {
                            __this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                                {
                                    duration: 3,
                                    multiple: obsrvbls.length > 1
                                }
                            );
                        } else {
                            __this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                                {
                                    duration: 3,
                                    multiple: obsrvbls.length > 1,
                                    text: numOfInsertRows + ' תנועות יובאו בהצלחה לתזרים'
                                }
                            );
                        }
                    }
                    // __this.togglePaymentCreateSuccessSnack(Object.assign(transLocateDataIfSuccess, {
                    //     transId: transId as string
                    // }));
                });


        } else {
            this.popUpExcelImportShow = false;
        }
    }

    // showSuccess() {
    //     this.msgs = [];
    //     this.msgs.push({severity: 'success', summary: 'Success Message', detail: 'Order submitted'});
    //     setTimeout(() => {
    //         this.messageService.clear();
    //         this.msgs = [];
    //     }, 3000);
    //
    // }

    updatePopListCreate(): void {
        this.popUpExcelImportDuplicateShow.listToSend =
            this.popUpExcelImportDuplicateShow.list.filter((item) => item.checked);
    }

    formatMessage(paragraph: string): string {
        if (!paragraph || paragraph === '' || typeof paragraph !== 'string') {
            return '';
        }
        const regex = /^-?\d+\.?\d*$/gm;
        const regexReverseMinus = /^\d+\.?\d?-*$/gm;

        let afterSum = false;
        const allWords = paragraph.split(' ').map((word) => {
            if (word.includes('סכום')) {
                afterSum = true;
            }
            if (afterSum) {
                if (regex.test(word)) {
                    let add = '';
                    if (word.includes('-')) {
                        word = word.split('-')[1];
                        add = '-';
                    }
                    const parts = word.toString().split('.');
                    const fract =
                        parts.length > 1 ? '.' + (parts[1] + '0').slice(0, 2) : '';
                    word = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + fract;
                    return word + add;
                }
                if (regexReverseMinus.test(word)) {
                    word = word.split('-')[0];
                    const parts = word.toString().split('.');
                    const fract =
                        parts.length > 1 ? '.' + (parts[1] + '0').slice(0, 2) : '';
                    word = parts[0].replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + fract;
                    return word + '-';
                }
            }

            return word;
        });
        return allWords.join(' ');
    }

    createFromDuplicate(): void {
        const arrRows = [];
        this.popUpExcelImportDuplicateShow.listToSend.forEach((item) => {
            let typePeulaNum: any;

            if (!item.hova) {
                typePeulaNum = 400;
            } else {
                typePeulaNum = 44;
            }

            if (!arrRows[typePeulaNum]) {
                arrRows[typePeulaNum] = [];
                arrRows[typePeulaNum][item.paymentDesc] = [
                    {
                        asmachta: item.asmachta,
                        dueDate: item.transDate,
                        paymentDesc: item.transName,
                        total: item.total,
                        transTypeId: item.transTypeId
                    }
                ];
            } else if (!arrRows[typePeulaNum][item.paymentDesc]) {
                arrRows[typePeulaNum][item.paymentDesc] = [
                    {
                        asmachta: item.asmachta,
                        dueDate: item.transDate,
                        paymentDesc: item.transName,
                        total: item.total,
                        transTypeId: item.transTypeId
                    }
                ];
            } else {
                arrRows[typePeulaNum][item.paymentDesc].push({
                    asmachta: item.asmachta,
                    dueDate: item.transDate,
                    paymentDesc: item.transName,
                    total: item.total,
                    transTypeId: item.transTypeId
                });
            }
        });

        if (arrRows.length) {
            const obsrvbls: Observable<any>[] = [];
            for (const obj in arrRows) {
                if (arrRows.hasOwnProperty(obj)) {
                    for (const obj1 in arrRows[obj]) {
                        if (arrRows[obj].hasOwnProperty(obj1)) {
                            const parameters: any = {
                                biziboxMutavId: null,
                                companyAccountId:
                                this.popUpExcelImportDuplicateShow.companyAccountId,
                                companyId:
                                this.userService.appData.userData.companySelect.companyId,
                                receiptTypeId: Number(obj),
                                sourceProgramId: null,
                                targetType: obj1,
                                deleteOldExcel: false,
                                transes: arrRows[obj][obj1]
                            };
                            obsrvbls.push(this.sharedService.paymentCreate(parameters));
                        }
                    }
                }
            }

            if (obsrvbls.length > 0) {
                this.popUpExcelImportDuplicateShow.pending = true;
                const len = this.popUpExcelImportDuplicateShow.listToSend.length;
                const __this = this;
                combineLatest(
                    obsrvbls.length > 1 ? [
                        obsrvbls[0],
                        zip(...obsrvbls.slice(1))
                    ] : [
                        obsrvbls[0]
                    ]
                )
                    .pipe(take(2))
                    .subscribe((res: any) => {
                        __this.popUpExcelImportDuplicateShow.pending = false;
                        __this.popUpExcelImportDuplicateShow = false;
                        __this.childDates.selectedRange
                            .pipe(take(1))
                            .subscribe(() =>
                                __this.filterDates(
                                    __this.childDates.recalculateSelectedRangeIfNecessary()
                                )
                            );

                        __this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                            {
                                duration: 3,
                                multiple: obsrvbls.length > 1,
                                text: len + ' תנועות יובאו בהצלחה לתזרים'
                            }
                        );
                    });
            } else {
                this.popUpExcelImportDuplicateShow = false;
            }
        }
    }

    clickMsgs() {
        this.messageService.clear();
        this.msgs = [];
    }

    showMatch(): boolean {
        if (
            this.userService &&
            this.userService.appData &&
            this.userService.appData.userData &&
            this.userService.appData.userData.accountSelect &&
            this.userService.appData.userData.accountSelect.length
        ) {
            const today = new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate() - 7
            );
            today.setHours(0, 0, 0, 0);
            if (
                this.userService.appData.userData.accountSelect[0]
                    .balanceLastUpdatedDate >= today.getTime()
            ) {
                return true;
            }
        }
        return false;
    }

    searchAsmachta(val: any, index?: number) {
        const lastRow =
            this.userService.appData.popUpShow.data.value.arr[
                index !== undefined
                    ? index
                    : this.userService.appData.popUpShow.data.value.arr.length - 1
                ];
        const indexs =
            index !== undefined
                ? index
                : this.userService.appData.popUpShow.data.value.arr.length - 1;
        if (
            this.selectedValue !== null &&
            ((val && val.length) ||
                (this.userService.appData.popUpShow.data.get('ddMutav').value &&
                    this.userService.appData.popUpShow.data.get('ddMutav').value !== '' &&
                    this.userService.appData.popUpShow.data.get('ddMutav').value
                        .biziboxMutavId) ||
                (Number(lastRow.total) !== 0 && lastRow.dueDate)) &&
            this.userService.appData.popUpShow.data.get('ddAccountSelect').value &&
            this.userService.appData.popUpShow.data.get('ddTypePayments').value ===
            'Checks'
        ) {
            const parameters: any = {
                companyAccountId:
                this.userService.appData.popUpShow.data.get('ddAccountSelect').value
                    .companyAccountId,
                chequeNo: val && val.toString().length >= 4 ? Number(val) : null,
                companyId: this.userService.appData.userData.companySelect.companyId,
                total: lastRow.total ? Number(lastRow.total) : null,
                biziboxMutavId:
                    this.userService.appData.popUpShow.data.get('ddMutav').value &&
                    this.userService.appData.popUpShow.data.get('ddMutav').value !== '' &&
                    this.userService.appData.popUpShow.data.get('ddMutav').value
                        .biziboxMutavId
                        ? this.userService.appData.popUpShow.data.get('ddMutav').value
                            .biziboxMutavId
                        : null,
                accountMutavName:
                    this.userService.appData.popUpShow.data.get('ddMutav').value &&
                    this.userService.appData.popUpShow.data.get('ddMutav').value !== '' &&
                    this.userService.appData.popUpShow.data.get('ddMutav').value
                        .accountMutavName
                        ? this.userService.appData.popUpShow.data.get('ddMutav').value
                            .accountMutavName
                        : null,
                expense: this.userService.appData.popUpShow.type === 44,
                dueDate: lastRow.dueDate ? lastRow.dueDate.toISOString() : null
            };
            this.sharedService.existingCheck(parameters).subscribe(
                (response: any) => {
                    const isCheckExist = response ? response['body'] : response;
                    if (isCheckExist && isCheckExist.length) {
                        this.arr.value[indexs].isCheckExist = isCheckExist[0];
                        // this.arr.value.forEach((item, idx) => {
                        //     if (item.asmachta === val) {
                        //         this.arr.value[idx].isCheckExist = isCheckExist[0];
                        //     }
                        // });
                    } else {
                        this.arr.value[indexs].isCheckExist = undefined;
                    }
                },
                (err: HttpErrorResponse) => {
                    if (err.error) {
                        console.log('An error occurred:', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
        }
    }

    onCheckNumberGuideHide(): void {
        if (this.checkNumberGuides.stopIt) {
            this.storageService.localStorageSetter(
                'checkNumberGuides.display',
                'false'
            );
        }
    }

    togglePaymentCreateSuccessSnack(transactionLocateData: {
        companyAccountId: string;
        date: Date;
        transId: string;
    }, numTrans: any): void {
        // const snackRef: MatSnackBarRef<PaymentCreateSuccessComponent> = this.snackBar.openFromComponent(PaymentCreateSuccessComponent,
        //     {
        //     panelClass: 'snack-success',
        //     duration: 0, // 3000,
        //     verticalPosition: 'top',
        //     data: {
        //         onPaymentNavigationSelected: (function () {
        //             snackRef.dismiss();
        //
        //             this.userService.appData.userData.transactionLocateId = transactionLocateData.transId;
        //
        //             this.clearFilter();
        //
        //             this.childDates.apply({
        //                 selectedValue: '2',
        //                 calendarFrom: transactionLocateData.date,
        //                 calendarUntil: new Date(transactionLocateData.date.getFullYear(),
        //                     transactionLocateData.date.getMonth() + 1, transactionLocateData.date.getDate())
        //             });
        //
        //             const trnsAcc = this.userService.appData.userData.accounts
        //                 .find(acc => acc.companyAccountId === transactionLocateData.companyAccountId);
        //             this.userService.appData.userData.accountSelect = [trnsAcc];
        //             this.accountSelector.applyValuesFromModel();
        //
        //             this.changeAcc(null);
        //
        //         }).bind(this)
        //     }
        // });
        this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess({
            duration: 3,
            multiple: numTrans > 1,
            onPaymentNavigationSelected: () => {
                // snackRef.dismiss();

                this.userService.appData.userData.transactionLocateId =
                    transactionLocateData.transId;

                this.clearFilter();

                this.childDates.apply(transactionLocateData.date, true);

                const trnsAcc = this.userService.appData.userData.accounts.find(
                    (acc: any) =>
                        acc.companyAccountId === transactionLocateData.companyAccountId
                );
                this.userService.appData.userData.accountSelect = [trnsAcc];
                this.accountSelector.applyValuesFromModel();

                this.changeAcc(null);
            }
        });
    }

    editOperation(item: any, editType: EditingType = EditingType.Single): void {
        // debugger
        this.editMovementData.title =
            this.translate.instant('formFixedMovement.editTitle', {
                movementType: this.isPeriodicType.transform(item.targetType)
                    ? item.expence === true
                        ? this.translate.instant('actions.addFixedExpense')
                        : this.translate.instant('actions.addFixedIncome')
                    : item.expence === true
                        ? this.translate.instant('titles.expectedExpense')
                        : this.translate.instant('titles.expectedIncome')
            }) +
            ' - ' +
            item.paymentDescTranslate; // + this.translate.instant('paymentTypes.' + item.paymentDesc);
        this.editMovementData.form = new FormGroup({});
        this.editMovementData.source = JSON.parse(JSON.stringify(item));
        // if (item.transDate) {
        //     this.editMovementData.source.transDate = new Date(item.transDate);
        // }
        delete this.editMovementData.source.account;

        this.editMovementData.seriesSource = null;
        this.editMovementData.mode = editType;
        this.editMovementData.visible = true;
        this.editMovementData.loading = false;
        // setTimeout(()=>{
        //     this.editEditor.mode = editType;
        // }, 200)

        if (
            this.isPeriodicType.transform(this.editMovementData.source.targetType)
        ) {
            // if (['SOLEK_TAZRIM', 'CCARD_TAZRIM', 'LOAN_TAZRIM', 'CYCLIC_TRANS'].includes(this.editMovementData.source.targetType)) {
            this.editMovementData.loading = true;

            combineLatest([
                    this.sharedService.getCyclicTransactionSingle(
                        JSON.parse(JSON.stringify(item))
                    ),
                    this.editMovementData.source.targetType === 'CYCLIC_TRANS' &&
                    this.editMovementData.source.unionId &&
                    !Array.isArray(this.editMovementData.source.mutavArray)
                        ? this.sharedService.getUnionBankdetail({
                            companyId:
                            this.userService.appData.userData.companySelect.companyId,
                            dateFrom:
                                this.editMovementData.source.kvuaDateFrom ||
                                this.editMovementData.source.transDate,
                            transId: this.editMovementData.source.transId
                        })
                        : of(null)
                ]
            ).subscribe(([rslt, unionDataRslt]: any) => {
                this.editMovementData.loading = false;
                if (
                    !rslt.error &&
                    rslt.body &&
                    Array.isArray(rslt.body.transes) &&
                    rslt.body.transes.length > 0
                ) {
                    this.editMovementData.seriesSource = // rslt.body.transes[0];
                        Object.assign(rslt.body.transes[0], {
                            paymentDesc: item.paymentDesc
                        });
                }
                if (
                    unionDataRslt &&
                    !unionDataRslt.error &&
                    Array.isArray(unionDataRslt.body)
                ) {
                    this.editMovementData.source = Object.assign(
                        JSON.parse(JSON.stringify(item)),
                        {
                            mutavArray: unionDataRslt.body
                        }
                    );
                }
            });
        }

        setTimeout(() => this.editMovementDataDlg.center());
    }

    onSubmitEditOperation(): void {
        // console.log(this.editMovementData.form, Object.values(this.editMovementData.form.controls));
        // Object.values(this.editMovementData.form.controls).forEach((ac:any) => {
        //     console.log(ac.invalid, ac.value);
        // });
        if (!this.editMovementData.form.valid) {
            BrowserService.flattenControls(this.editMovementData.form).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        // const dataToSubmit = Object.assign(this.editEditor.result,
        //     {
        //         mutavArray: this.beneficiaryService.rebuildBeneficiariaryArrayForUpdate(
        //             this.editEditor.actualSource,
        //             this.editEditor.result)
        //     });
        const dataToSubmit = this.editEditor.result;
        // // Object.assign(
        // //     this.editMovementData.source,
        // //     this.editEditor.result);
        // debugger;
        this.editMovementData.loading = true;
        this.sharedService
            .updateCyclicTransaction(
                this.editEditor.mode,
                this.editMovementData.source.targetType,
                dataToSubmit
            )
            .subscribe((rslt) => {
                console.log('submit finished! got %o', rslt);
                this.editMovementData.loading = false;
                if (!rslt.error) {
                    this.editMovementData.visible = false;
                    this.editEditor.reset();

                    this.clearActiveTableRow();
                    // this.changeAcc(null);
                    this.filterDates(
                        this.childDates.recalculateSelectedRangeIfNecessary()
                    );
                }
            });

        // console.log('submit called! got %o', dataToSubmit);
    }

    onDualMeaningFieldEditPromptDecision() {
        this.dualMeaningFieldEditPrompt.visible = false;

        if (this.dualMeaningFieldEditPrompt.optionSelected === 0) {
            this.dualMeaningFieldEditPrompt.visible = false;
            this.submitChangesInner();
        } else {
            // const startEditOn = this.editingTransaction;
            this.cancelChanges();
            // debugger;
            this.editOperation(
                this.dualMeaningFieldEditPrompt.item, // startEditOn,
                this.dualMeaningFieldEditPrompt.optionSelected === 0
                    ? EditingType.Single
                    : EditingType.Series
            );
        }
    }

    setTwoNumberDecimal(event) {
        event.value = parseFloat(event.value).toFixed(2);
    }

    navigateToMovementMatchingAt(accountId?: string) {
        if (!accountId) {
            const dataToSort = this.userService.appData.userData.accountSelect.map(
                (acc: any) => {
                    return {
                        accId: acc.companyAccountId,
                        primaryAccount: acc.primaryAccount,
                        dateCreated: acc.dateCreated,
                        nigrarotCount: this.dataTable.nigreret.children
                            ? this.dataTable.nigreret.children.filter(
                                (trns) => trns.companyAccountId === acc.companyAccountId
                            ).length
                            : 0
                    };
                }
            );
            dataToSort.sort((a, b) => {
                if (a.nigrarotCount !== b.nigrarotCount) {
                    return b.nigrarotCount - a.nigrarotCount;
                }
                if (a.primaryAccount !== b.primaryAccount) {
                    return a.primaryAccount ? -1 : 1;
                }
                return b.dateCreated - a.dateCreated;
            });

            accountId = dataToSort[0].accId;
        }

        this.userService.appData.userData.bankMatchAccountIdNavigateTo = accountId;
        this.router.navigate(['../../bankmatch/bank'], {
            relativeTo: this.route,
            queryParamsHandling: 'preserve'
        });
    }

    private getFilename() {
        return [
            this.translate.instant('menu.customers.tazrim.daily'),
            'תצוגה מפורטת',
            this.childDates.asText(),
            this.userService.appData.userData.companySelect.companyName
        ];
    }

    private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
        const headerEl = document.getElementsByClassName('sums')[0] as HTMLElement;

        const showNigSums =
            this.userService.appData.userData.accountSelect &&
            this.userService.appData.userData.accountSelect.length &&
            this.showMatch();

        let msg =
            headerEl && headerEl.classList.contains('sums-deviation')
                ? (headerEl.children[0] as HTMLElement).innerText
                : null;
        let msgMatch;
        if (
            msg &&
            (msgMatch = /מצב התזרים לחודש הקרוב\s*(צפויה.+)/gm.exec(msg)) !== null
        ) {
            msg = msgMatch[1];
        }
        // debugger;
        const dataForExport = Object.values(this.dataTable)
            .filter(
                (group: any) =>
                    Array.isArray(group.children) && group.children.length > 0
            )
            .reduce(
                (acmltr: any[], group: any) => [...acmltr, ...group.children],
                []
            );

        return {
            additionalProperties: {
                todayBalance:
                    this.userService.appData.userData.accountSelect.length &&
                    !this.accountSelectOneNotUpdate
                        ? this.accountBalance
                        : null,
                // usedBalance: this.sumPipe.transform(this.balanceUse, true),
                reportDays: this.childDates.asText(),
                creditLimit: this.creditLimitAbs,
                tomorrowBalance:
                    this.userService.appData.userData.accountSelect.length &&
                    this.userService.appData.userData.accountSelect[0].isUpToDate
                        ? this.dataTableAll.tomorrowItra
                        : null,
                zhutNigreret:
                    showNigSums && this.dataTableAll.zhutNigreret !== 0
                        ? this.dataTableAll.zhutNigreret
                        : null,
                hovaNigreret:
                    showNigSums && this.dataTableAll.hovaNigreret !== 0
                        ? this.dataTableAll.hovaNigreret * -1
                        : null,
                message: msg,
                currency: this.currencySymbol.transform(
                    this.userService.appData.userData.accountSelect[0].currency
                )
            },
            data: {
                report: JSON.parse(JSON.stringify(dataForExport)).filter(
                    (it) => !it.rowSum
                )
            }
        };
    }

    sendTransactions(mailAddress: string): void {
        const request = this.reportParamsFromCurrentView();
        Object.assign(request.additionalProperties, {
            mailTo: mailAddress,
            screenName: this.getFilename().join(' ')
        });
        this.reportService
            .emailReport('TAZRIM_DETAILED', request)
            .pipe(take(1))
            .subscribe((rslt) => {
                this.reportMailSubmitterToggle = false;
            });
    }

    printTransactions(): void {
        this.reportService
            .printReport(
                'TAZRIM_DETAILED',
                this.reportParamsFromCurrentView(),
                'PDF',
                this.getFilename().join(' ')
            )
            .pipe(take(1))
            .subscribe((rslt) => {
            });
    }

    hideDropdowns() {
        this.dropdowns.forEach((dd) => dd.hide());
        this.calendars.forEach((clndr) => {
            clndr.overlayVisible = false;
            if (clndr.inputfieldViewChild) {
                clndr.inputfieldViewChild.nativeElement.blur();
            }
        });

        if (this.overlayPanels) {
            this.overlayPanels.forEach((ovp) => ovp.hide());
        }
    }

    onUnionIdClickAt(item: any) {
        console.log('---> onUnionIdClickAt: %o', item);

        this.itemUnionPrompt.unitedItem = item;
        this.itemUnionPrompt.visible = true;
    }
    mixPanelEventEvent(paymentDesc: unknown) {
        if (paymentDesc === 'BankTransfer') {
            this.sharedComponent.mixPanelEvent('perut bank transfer');
        }
        if (paymentDesc === 'Checks') {
            this.sharedComponent.mixPanelEvent('perut check');
        }
        if (paymentDesc === 'Loans') {
            this.sharedComponent.mixPanelEvent('perut loan');
        }
    }
    private clearActiveTableRow() {
        this._editingTransaction = null;
        this.editingTransaction = null;
        this.selectedTransaction = null;
    }

    promptForBeneficiaryTransTypeChangeApply(
        item: any,
        event: any
    ) {
        console.log(
            'promptForBeneficiaryTransTypeChangeApply ->> item: %o, event: %o',
            item,
            event
        );
        this.beneficiaryTransTypeChangePrompt = {
            data: {
                transName: item.transDesc,
                transTypeName: event.value.transTypeName,
                transTypeId: event.value.transTypeId,
                companyId: this.userService.appData.userData.companySelect.companyId,
                transId: item.bankTransId,
                biziboxMutavId: item.biziboxMutavId
            },
            apply: () => {
                this.editingTransaction = item;
                this.editingTransaction.selectedTransType = event.value;
                this.submitChanges(event.originalEvent);
            }
        };
    }

    private rebuildBeneficiaryFilterOptions(
        withOtherFiltersApplied: any[]
    ): void {
        if (
            !Array.isArray(withOtherFiltersApplied) ||
            !withOtherFiltersApplied.length
        ) {
            this.beneficiaryFilterOptions = [];
            this.beneficiaryFilter.setValue(null);
            return;
        }

        const availableOptions = Array.from(
            withOtherFiltersApplied.reduce((acmltr, trns) => {
                return Array.isArray(trns.mutavNames) && trns.mutavNames.length
                    ? trns.mutavNames.reduce((acmltr0, mn) => acmltr0.add(mn), acmltr)
                    : acmltr;
            }, new Set())
        ).map((beneficiaryName: any) => {
            return {
                val: beneficiaryName,
                id: beneficiaryName,
                checked:
                    !Array.isArray(this.beneficiaryFilter.value) ||
                    this.beneficiaryFilter.value.includes(beneficiaryName)
            };
        });
        // const availableOptions = Array.from(withOtherFiltersApplied.reduce((acmltr, trns) => {
        //         return trns.beneficiary ? acmltr.add(trns.beneficiary) : acmltr;
        //     }, new Set())
        // ).map((beneficiary: any) => {
        //     return {
        //         val: beneficiary.accountMutavName,
        //         id: beneficiary.biziboxMutavId,
        //         checked: !Array.isArray(this.beneficiaryFilter.value)
        //             || this.beneficiaryFilter.value.includes(beneficiary.biziboxMutavId)
        //     };
        // });

        // if (!availableOptions.length) {
        //     this.beneficiaryFilterOptions = [];
        //     this.beneficiaryFilter.setValue(null);
        //     return;
        // }
        if (
            withOtherFiltersApplied.some(
                (trns) => !Array.isArray(trns.mutavNames) || !trns.mutavNames.length
            )
        ) {
            availableOptions.push({
                val: 'ללא מוטב',
                id: 'n/a',
                checked:
                    !Array.isArray(this.beneficiaryFilter.value) ||
                    this.beneficiaryFilter.value.includes('n/a')
            });
        }

        if (
            Array.isArray(this.beneficiaryFilter.value) &&
            availableOptions.length
        ) {
            const valueStillAvailable = this.beneficiaryFilter.value.filter((fval) =>
                availableOptions.some((opt) => opt.id === fval)
            );
            if (valueStillAvailable.length !== this.beneficiaryFilter.value.length) {
                this.beneficiaryFilter.setValue(
                    valueStillAvailable.length === 0 ? null : valueStillAvailable
                );
            }
        }

        this.beneficiaryFilterOptions = [
            {
                val: this.translate.instant('filters.all'),
                id: 'all',
                checked: availableOptions.every((opt) => !!opt.checked)
            },
            ...availableOptions
        ];
        // console.log('this.beneficiaryFilterOptions => %o', this.beneficiaryFilterOptions);
    }

    private withBeneficiaryFilterApplied(withOtherFiltersApplied: any[]): any[] {
        if (
            !Array.isArray(this.beneficiaryFilter.value) ||
            !Array.isArray(withOtherFiltersApplied) ||
            !withOtherFiltersApplied.length
        ) {
            return withOtherFiltersApplied;
        }

        if (this.beneficiaryFilter.value.includes('n/a')) {
            const nonEmptyFilterVals = this.beneficiaryFilter.value.filter(
                (v) => v !== 'n/a'
            );
            return withOtherFiltersApplied.filter(
                (item) =>
                    !Array.isArray(item.mutavNames) ||
                    !item.mutavNames.length ||
                    (nonEmptyFilterVals.length &&
                        Array.isArray(item.mutavNames) &&
                        item.mutavNames.length > 0 &&
                        nonEmptyFilterVals.some((bnfName) =>
                            item.mutavNames.includes(bnfName)
                        ))
            );
        }
        return this.filterPipe.transform(
            withOtherFiltersApplied,
            this.beneficiaryFilter.value,
            ['mutavNames']
        );
    }
}
