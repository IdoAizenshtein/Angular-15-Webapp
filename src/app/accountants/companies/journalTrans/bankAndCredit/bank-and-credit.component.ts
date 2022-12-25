import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    QueryList,
    Renderer2,
    SecurityContext,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {combineLatest, EMPTY, Observable, of, Subject, Subscription, timer, zip} from 'rxjs';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {StorageService} from '@app/shared/services/storage.service';
import {JournalTransComponent} from '../journal-trans.component';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {DatePipe} from '@angular/common';
import {debounceTime, distinctUntilChanged, filter, finalize, first, map, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {AccountsDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/accounts-date-range-selector.component';
import {OverlayPanel} from 'primeng/overlaypanel';
import {Paginator} from 'primeng/paginator';
import {
    CcardsDateRangeSelectorAccountantsComponent
} from '@app/shared/component/date-range-selectors/ccards-date-range-selector-accountants.component';
import {CreditCardSelectionSummary2} from './creditCardSelectionSummary';
import {CardsSelectComponent} from '@app/shared/component/cards-select/cards-select.component';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {roundAndAddComma, toFixedNumber, toNumber} from '@app/shared/functions/addCommaToNumbers';
import {BrowserService} from '@app/shared/services/browser.service';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {TransTypesService} from '@app/core/transTypes.service';
import {takeWhileInclusive} from '@app/shared/functions/takeWhileInclusive';
import {ReportService} from '@app/core/report.service';
import {Dropdown} from 'primeng/dropdown';
import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {slideInOut} from '@app/shared/animations/slideInOut';
import {
    MatchDateRangeSelectorAccountantsComponent
} from '@app/shared/component/date-range-selectors/match-date-range-selector-accountants.component';
import {getPageHeight} from '@app/shared/functions/getPageHeight';

declare var $: any;

@Component({
    templateUrl: './bank-and-credit.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class BankAndCreditComponent
    extends ReloadServices
    implements OnDestroy, OnInit, AfterViewInit {
    public isBankAndCreditComponent = true;
    public documentsDataSave: any = false;
    public showFloatNav: any = false;
    public tooltipEditFile: any;
    public postponed: {
        action: Observable<any>;
        message: SafeHtml;
        fired?: boolean;
    };
    public setForLogicAfterUpload = false;
    public fileStatus: any;
    public tabMatched: any = 1;
    public loader = false;
    public banktransForMatchAll: any;
    public showModalAfterSelected: any = false;
    public matchedTransSaved: any;

    public cashflowMatchAll: any;
    public isFutureTransesOpened = false;
    public isMadeInBiziboxOpened = false;


    public isHashTransesOpened = false;
    public isBiziboxMatchedOpened = false;


    public sumsTotal: any = false;
    public loaderBooks = false;
    public loaderCash = false;
    public loaderMatchedTrans = false;
    public hasRowOfDeleted: any = false;
    public cashflowMatchReco: any = null;
    public currentTab = 1;

    public queryString = '';
    public filterInput: FormControl = new FormControl();
    public searchableList = [
        'batchNumber',
        'oppositeCustId',
        'transTypeCode',
        'asmachta',
        'details',
        'total',
        'transDateStr',
        'transDateStr_date'
    ];
    public allTransData = [];
    public sortPipeDirCash: any = null;
    public sortPipeDir: any = null;
    public sortPipeDirDate: any = null;
    public sortPipeDirCashDate: any = null;
    public filterInputBooks = new FormControl();
    public filterInputUnadjusted = new FormControl();
    public cashflowMatch: any;
    public hasRowOfChecked: any = false;
    public advancedSearchParams1: any;
    public advancedSearchParams1Bank: any;
    @ViewChild(AccountsDateRangeSelectorComponent)
    childDates: AccountsDateRangeSelectorComponent;
    public responseRestPath: any = false;
    cardsListArrivedSub: Subscription;
    @ViewChild(CcardsDateRangeSelectorAccountantsComponent)
    childCardsDates: CcardsDateRangeSelectorAccountantsComponent;
    @ViewChild(MatchDateRangeSelectorAccountantsComponent)
    childMatchDates: MatchDateRangeSelectorAccountantsComponent;
    @ViewChild(CardsSelectComponent) cardsSelector: CardsSelectComponent;
    // @ViewChild(TransactionAdditionalTriggerDirective) childTransactionAdditionalTrigger: TransactionAdditionalTriggerDirective;
    public updateTransParam: any = null;
    public activeDD: any = false;
    public activeDDOpen: any = false;
    public enabledDownloadLink_docfile: boolean = true;
    public enabledDownloadLink_paramsfile: boolean = true;
    showPanelDD1 = false;
    showPanelDD1Bank = false;
    transTypeCodeArrValues = [
        {
            label: 'הכנסות פטורות',
            value: 'BIZ_NONE_INCOME'
        },
        {
            label: 'ניכוי במקור ספקים',
            value: 'SUPPLIER_DEDUCTION'
        },
        {
            label: 'ניכוי במקור לקוחות',
            value: 'CUSTOMER_DEDUCTION'
        },
        {
            label: 'הכנסות',
            value: 'BIZ_FULL_INCOME'
        },
        {
            label: 'מע”מ מלא',
            value: 'BIZ_FULL_EXPENSE'
        },
        {
            label: 'ללא מע”מ',
            value: 'BIZ_NONE_EXPENSE'
        },
        {
            label: 'מע”מ 2/3',
            value: 'BIZ_TWO_THIRD'
        },
        {
            label: 'מע”מ 1/4',
            value: 'BIZ_QUARTER'
        },
        {
            label: 'מע”מ מלא רכוש קבוע',
            value: 'BIZ_FULL_PROPERTY'
        },
        {
            label: 'מע”מ מלא יבוא',
            value: 'BIZ_FULL_IMPORT'
        },
        {
            label: 'מע”מ פתוח',
            value: 'BIZ_OPEN'
        }
    ];
    public advancedSearchParams: any;
    @ViewChildren('tooltipEdit') tooltipEditRef: OverlayPanel;
    @ViewChildren('note') noteRef: OverlayPanel;
    @ViewChildren('formDropdowns') formDropdownsRef: Dropdown;
    @ViewChildren('formDropdownsCustomerCustList') formDropdownsCustRef: any;
    public bankDetails: any = false;
    public bankDetailsSlice: any = [];
    public bankDetailsSave: any = false;
    public filterLink = 'all';
    public typeOfFlow = 'all';
    public companyFilesSortControl: FormControl = new FormControl({
        orderBy: 'transDate',
        order: 'DESC'
    });
    public booksSortControl: FormControl = new FormControl({
        orderBy: null,
        order: 'DESC'
    });
    public bankSortControl: FormControl = new FormControl({
        orderBy: null,
        order: 'DESC'
    });
    public checkAllBooks: any = false;
    public checkAllRows: any = false;
    public statusArr: any[];
    public filterTypesStatus: any = null;
    public paymentDescArr: any[];
    public filterTypesPaymentDesc: any = null;
    public transTypeCodeArr: any[];
    public filterTransTypeCode: any = null;
    public hovaArr: any[];
    public filterNote: any = null;
    public editArr: any[];
    public filterTypesHova: any = null;
    public selcetAllFiles = false;
    public currentPage = 0;
    public entryLimit = 50;
    @ViewChild('paginator') paginator: Paginator;
    @ViewChild('scrollContainer') scrollContainer: ElementRef;
    @ViewChild('scrollContainerCashflowMatch')
    scrollContainerCashflowMatch: ElementRef;
    public setHoverOffset: any = false;
    receipt: any;
    rowToSplit: any = false;
    public companyCustomerDetailsData: any = [];
    public saverValuesReceipt = {
        total: 0,
        paymentNikui: 0,
        paymentTotal: 0
    };
    public showDocumentListStorageDataFired: any = false;
    public showDocumentListStorageDataFiredRece: any = false;
    public innerHeight: any = window.innerHeight;
    public window: any = window;
    public imageScaleNewInvoice = 1;
    public degRotateImg = 0;
    public sidebarImgs: any = false;
    public sidebarImgsDescList: any = false;
    public finishedLoadedImgView = false;
    public fileData: any = false;
    printWorker: boolean = false;
    public toggleLoanDetails: boolean;
    public modalLoan: boolean = true;
    public selectedCompanyAccountIds: Array<string>;
    public loanId: any = null;
    public report856: any = false;
    public accountsBarData: any = false;
    public checkBoxesNear: any = true;
    public accountsBarDataError: any = false;
    public logicTypeShow: any = false;
    public hasTopBar: any = false;
    public accountSelected: any = null;
    scrollRobot: any;
    public nav = {
        prev: false,
        next: false
    };
    public showArchiveModal: any = false;
    public connectFilesFromModalArr: any = [];
    public showArchiveModal_TransId: any = false;
    public cardDetails: any[] | any = false;
    public cardDetailsSave: any[] | any = false;
    public showScreen: any = null;
    public selectionSummary: CreditCardSelectionSummary2;
    public debounce: any;
    public companyCustomerDetails: any = false;
    public custModal: any = false;
    public rowForMatchCust: any = false;
    public custIdForMatch: any = false;
    public paramsForUpdateCust: any = false;
    public modalEditCardsBeforeSend: any = false;
    public customerCustList = [];
    public shoeModalSelectType: any = false;
    public rowIdSave: any;
    @ViewChildren('formDropdownsCustomerCustList')
    formDropdownsCustomerCustLists: QueryList<Dropdown>;
    public loaderGetCompanyCustomerDetails = false;
    public subscriptionTime: any;
    public subscriptionTime2: any;
    @ViewChildren('rowForScroll', {read: ElementRef})
    _rowForScroll: QueryList<ElementRef>;
    orders: any;
    public getJournalHistory: any = null;
    public getJournalHistoryData: any = false;
    editOrderModalShow = false;
    isMatah = false;
    currencySign: any = false;
    public saverValuesOrder = {
        totalWithoutMaam: 0,
        totalIncludedMaam: 0,
        matahAmount: 0
    };
    public maamPercentage = 17;
    public rate = 0;
    public rateEdit = false;
    public numberOfDecimals = 4;
    public revaluationCurrCode: any = null;
    public revaluationCurrCodeSign: any = null;
    scrHeight: any;
    editReceiptModalShow = false;
    public cupaAllTheOptions = false;
    public cupaAllTheOptions_paymentCustId = true;
    public cupaAllTheOptions_custId = false;
    public showTaxDeduction = false;
    public additionalDetails: any;
    containerWidth: number;
    containerHeight: number;
    transactionAdditionalDetailsSum: number;
    public journalTransData: any = false;
    public journalTransDataSave: any = false;
    public fileIdToToActive: any = false;
    public fileIdToScroll: any = false;
    public tooltipEditParentFile: any;
    public deleteCommandModal: any = false;
    public deleteCommandRowModal: any = false;
    public exportFileCancelPrompt: {
        approveSubscription?: Subscription;
        visible: boolean;
        pending: boolean;
        approve: () => void;
        decline: () => void;
        prompt: string;
    };
    public docsfile: any = null;
    public exportFileFolderCreatePrompt: {
        approveSubscription?: Subscription;
        visible: boolean;
        pending: boolean;
        prompt: string;
        onAnchorClick: () => void;
        onHide: () => void;
        cancelFile: () => void;
        manualDownloadLink: () => void;
    };
    public enabledDownloadLink: boolean = true;
    @ViewChild('navBanks') navBanks: ElementRef;
    public banktransForMatch: any = [];
    public paymentTypesTranslate: any = [];
    public matchedTrans: any = [];
    public tooltipElem: any = null;
    public readonly FOLDER_REPAIR_URL =
        'https://deployment.bizibox.biz/test/WizSetup.msi';
    public fileToRemove: any = false;
    public countStatusData: any = false;
    public bankProcessTransType: any = false;
    public printData: any = false;
    @ViewChild('elemToPrint') elemToPrint: HTMLElement;
    public showZoomInside = false;
    public openNoteData: any;
    public transTypeDefinedZhut: any = [];
    public transTypeDefinedHova: any = [];
    public parentManualCustIdsArray: any = false;
    public showModalCheckFolderFile: any = false;
    public ocrExportFileId: any;
    scrollSubscription = Subscription.EMPTY;
    scrollSubscription2 = Subscription.EMPTY;
    scrollSubscription1 = Subscription.EMPTY;


    virtualScrollSaved: any = null;
    virtualScrollSaved2: any = null;
    virtualScrollSaved1: any = null;

    private searchInDates = false;
    private readonly searchableListUnadjusted = [
        'asmachta',
        'total',
        'totalParent',
        'mainDesc',
        'transDateStr'
    ];
    private readonly destroyed$ = new Subject<void>();
    private readonly dtPipe: DatePipe;
    private selectedRangeSub: Subscription;
    private selectedCardRangeSub: Subscription;
    private globalListenerWhenInEdit: () => void | boolean;

    constructor(
        public userService: UserService,
        public reportService: ReportService,
        private dtHumanizePipe: TodayRelativeHumanizePipe,
        private sanitizer: DomSanitizer,
        private restCommonService: RestCommonService,
        public transTypesService: TransTypesService,
        private ocrService: OcrService,
        public browserDetect: BrowserService,
        private fb: FormBuilder,
        public override sharedComponent: SharedComponent,
        private sharedService: SharedService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private http: HttpClient,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public translate: TranslateService,
        private storageService: StorageService,
        public journalTransComponent: JournalTransComponent,
        private sumPipe: SumPipe,
        private renderer: Renderer2,
        public snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        public router: Router
    ) {
        super(sharedComponent);
        this.filterInputBooks.valueChanges
            .pipe(
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged(),
                takeUntil(this.destroyed$)
            )
            .subscribe((term) => {
                // this.queryString = term;
                if (this.tabMatched === 1) {
                    this.filtersAllBooks();
                } else {
                    this.filtersMatchedTrans();
                }
            });
        this.filterInputUnadjusted.valueChanges
            .pipe(
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged(),
                takeUntil(this.destroyed$)
            )
            .subscribe((term) => {
                if (this.tabMatched === 1) {
                    this.filtersAllCash();
                } else {
                    this.filtersMatchedTrans();
                }
            });

        const bankAndCreditScreenTab = this.storageService.sessionStorageGetterItem(
            'bankAndCreditScreenTab'
        );
        if (bankAndCreditScreenTab !== null) {
            this.fileStatus = bankAndCreditScreenTab;
        } else {
            // this.fileStatus = 'BANK';
        }
        // this.storageService.sessionStorageSetter(
        //     'bankAndCreditScreenTab',
        //     this.fileStatus
        // );
        // console.log('this.fileStatus', this.fileStatus);
        this.scrHeight = window.innerHeight;
        this.dtPipe = new DatePipe('en-IL');

        this.filterInput.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((term) => {
                this.queryString = term;
                if (this.fileStatus === 'BANK' || this.fileStatus === 'CREDIT') {
                    this.filtersAll();
                }
                if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
                    this.filtersAllJournalTransData();
                }

                if (this.scrollContainer && this.scrollContainer.nativeElement) {
                    requestAnimationFrame(() => {
                        this.scrollContainer.nativeElement.scrollTop = 0;
                    });
                }
            });

        this.advancedSearchParams = new FormGroup({
            description: new FormControl(null),
            asmachta: new FormControl(null),
            totalFrom: new FormControl(null),
            totalTill: new FormControl(null),
            custFrom: new FormControl(null),
            custTill: new FormControl(null),
            doseNumber: new FormControl(null, [
                Validators.compose([Validators.pattern('\\d+')])
            ]),
            orderNumber: new FormControl(null, [
                Validators.compose([Validators.pattern('\\d+')])
            ]),

            info: new FormControl(null),
            matah: new FormControl(false),
            totalIncludeMaamFrom: new FormControl(null),
            totalIncludeMaamTill: new FormControl(null),
            sendDateFrom: new FormControl(null),
            sendDateTill: new FormControl(null)
        });

        this.advancedSearchParams1 = new FormGroup({
            // fileName: new FormControl(null),
            // supplierHp: new FormControl(null, [
            //     Validators.compose([
            //         Validators.minLength(9),
            //         Validators.maxLength(9),
            //         Validators.pattern('\\d+'),
            //         ValidatorsFactory.idValidatorIL
            //     ])
            // ]),
            // batchNumber: new FormControl(null, [
            //     Validators.compose([
            //         Validators.pattern('\\d+')
            //     ])
            // ]),
            asmachta: new FormControl(null),
            totalBeforeMaamFrom: new FormControl(null),
            totalbeforeMaamTill: new FormControl(null),
            totalIncludeMaamFrom: new FormControl(null),
            totalIncludeMaamTill: new FormControl(null),
            custFrom: new FormControl(null),
            custTill: new FormControl(null),
            mamtinLeklita: new FormControl(false),
            niklat: new FormControl(false),
            invoiceDateFrom: new FormControl(null),
            invoiceDateTill: new FormControl(null),
            invoiceDateFrom1: new FormControl(null),
            invoiceDateTill1: new FormControl(null),
            sendDateFrom: new FormControl(null),
            sendDateTill: new FormControl(null)
        });
        this.advancedSearchParams1Bank = new FormGroup({
            // fileName: new FormControl(null),
            // supplierHp: new FormControl(null, [
            //     Validators.compose([
            //         Validators.minLength(9),
            //         Validators.maxLength(9),
            //         Validators.pattern('\\d+'),
            //         ValidatorsFactory.idValidatorIL
            //     ])
            // ]),
            // batchNumber: new FormControl(null, [
            //     Validators.compose([
            //         Validators.pattern('\\d+')
            //     ])
            // ]),
            asmachta: new FormControl(null),
            totalBeforeMaamFrom: new FormControl(null),
            totalbeforeMaamTill: new FormControl(null),
            totalIncludeMaamFrom: new FormControl(null),
            totalIncludeMaamTill: new FormControl(null),
            custFrom: new FormControl(null),
            custTill: new FormControl(null),
            mamtinLeklita: new FormControl(false),
            niklat: new FormControl(false),
            invoiceDateFrom: new FormControl(null),
            invoiceDateTill: new FormControl(null),
            invoiceDateFrom1: new FormControl(null),
            invoiceDateTill1: new FormControl(null),
            sendDateFrom: new FormControl(null),
            sendDateTill: new FormControl(null)
        });

        this.selectionSummary = new CreditCardSelectionSummary2(this.userService);

        this.sharedComponent.getDataEvent
            .pipe(
                startWith(true),
                map(() =>
                    this.userService.appData &&
                    this.userService.appData.userData &&
                    this.userService.appData.userData.companySelect
                        ? this.userService.appData.userData.companySelect.companyId
                        : null
                ),
                filter((companyId) => !!companyId),
                takeUntil(this.destroyed$)
            )
            .subscribe(() => {
                this.showScreen = null;
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                this.sharedService
                    .bankJournal({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .subscribe((response: any) => {
                        const responseRest = response ? response['body'] : response;
                        this.bankProcessTransType = responseRest.bankProcessTransType;
                        this.report856 = responseRest.report856;
                    });
                this.accountsBar();
            });

        this.sharedComponent.getDataEventGotAcc
            .pipe(
                startWith(true),
                map(() =>
                    this.userService.appData &&
                    this.userService.appData.userData &&
                    this.userService.appData.userData.companySelect
                        ? this.userService.appData.userData.companySelect.companyId
                        : null
                ),
                // filter(companyId => !!companyId),
                tap(() => (this.userService.appData.userData.creditCards = null)),
                switchMap((companyId) =>
                    companyId
                        ? this.sharedService.getCreditCardsAccountant(companyId)
                        : of(null)
                ),
                /*
                                map(() => this.userService.appData.userData.accounts),
                                switchMap((val) => {
                                    if (Array.isArray(val)) {
                                        return this.sharedService.getCreditCardDetails(
                                            val.map((id) => {
                                                return {'uuid': id.companyAccountId};
                                            })
                                        );
                                    }
                                    return of(null);
                                }),
                */
                map((response: any) => (response && !response.error ? response.body : null)),
                tap((response: any) =>
                    this.userService.rebuildSelectedCompanyCreditCards(response)
                ),
                takeUntil(this.destroyed$)
            )
            .subscribe(() => {
                // const arraySource = from([this.userService.appData.userData.accounts]);
                // arraySource
                //     .pipe(
                //         tap(() => this.userService.appData.userData.creditCards = null),
                //         switchMap((val) => {
                //             if (Array.isArray(val)) {
                //                 return this.sharedService.getCreditCardDetails(
                //                     val.map((id) => {
                //                         return {'uuid': id.companyAccountId};
                //                     })
                //                 );
                //             }
                //             return of(null);
                //         }),
                //         map(response => response && !response.error ? response.body : null),
                //         tap((response:any) => this.userService.rebuildSelectedCompanyCreditCards(response))
                //     ).subscribe(val => {
                //     console.log(val);
                // });

                if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
                    this.getExportFiles(true);
                }
            });
    }

    private _selectedTransaction: any;

    get selectedTransaction(): any {
        return this._selectedTransaction;
    }

    set selectedTransaction(val: any) {
        this._selectedTransaction = val;
    }

    get arrReceipt(): FormArray {
        return this.receipt.get('arr') as FormArray;
    }

    @HostListener('window:resize', ['$event'])
    getScreenSize(event?: any) {
        this.scrHeight = window.innerHeight;
    }

    ngOnInit(): void {
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.selectedCardRangeSub) {
            this.selectedCardRangeSub.unsubscribe();
        }

        const bankAndCreditScreenTab = this.storageService.sessionStorageGetterItem(
            'bankAndCreditScreenTab'
        );
        if (bankAndCreditScreenTab !== null) {
            this.fileStatus = bankAndCreditScreenTab;
        } else {
            // this.fileStatus = 'BANK';
        }
        // this.storageService.sessionStorageSetter(
        //     'bankAndCreditScreenTab',
        //     this.fileStatus
        // );
    }

    onScroll(scrollbarRef: any, virtualScroll?: any) {
        if (virtualScroll) {
            this.virtualScrollSaved = virtualScroll;
        } else {
            this.virtualScrollSaved = null;
        }
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        this.scrollSubscription = scrollbarRef.scrolled.subscribe(() => {
            this.onScrollCubes();
        });
    }

    onScroll1(scrollbarRef: any, virtualScroll?: any) {
        if (virtualScroll) {
            this.virtualScrollSaved1 = virtualScroll;
        } else {
            this.virtualScrollSaved1 = null;
        }
        if (this.scrollSubscription1) {
            this.scrollSubscription1.unsubscribe();
        }
        this.scrollSubscription1 = scrollbarRef.scrolled.subscribe((e: any) => {
            const idSelectRowMatched = this.banktransForMatchAll.filter(it => it.deleteRow && it.idSelectRow !== false);
            const idSelectRowMatched2 = this.cashflowMatchAll.filter(it => it.checkRow && it.idSelectRow !== false);
            if (idSelectRowMatched.length && idSelectRowMatched2.length) {
                this.virtualScrollSaved2.scrollTo({top: e.target.scrollTop});
            }
            this.onScrollCubes();
        });
    }

    onScroll2(scrollbarRef: any, virtualScroll?: any) {
        if (virtualScroll) {
            this.virtualScrollSaved2 = virtualScroll;
        } else {
            this.virtualScrollSaved2 = null;
        }
        if (this.scrollSubscription2) {
            this.scrollSubscription2.unsubscribe();
        }
        this.scrollSubscription2 = scrollbarRef.scrolled.subscribe((e: any) => {
            const idSelectRowMatched = this.banktransForMatchAll.filter(it => it.deleteRow && it.idSelectRow !== false);
            const idSelectRowMatched2 = this.cashflowMatchAll.filter(it => it.checkRow && it.idSelectRow !== false);
            if (idSelectRowMatched.length && idSelectRowMatched2.length) {
                this.virtualScrollSaved1.scrollTo({top: e.target.scrollTop});
            }
            this.onScrollCubes();
        });
    }

    getPageHeightFunc(value: any) {
        return getPageHeight(value);
    }

    toggleAccChild(acc: any) {
        acc.show = !acc.show;
        this.accountsBarData.accountsBarDto.forEach(it => {
            if (it.bankId === acc.bankId) {
                it.show = acc.show;
            }
        });
    }

    accountsBar(saveDefAcc?: boolean) {
        const bankAndCreditScreenTab = this.storageService.sessionStorageGetterItem(
            'bankAndCreditScreenTab'
        );
        this.sharedService
            .accountsBar({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe(
                (response: any) => {
                    const responseRest = response ? response['body'] : response;
                    if (response.status === 200) {
                        this.accountsBarDataError = false;
                        if (
                            responseRest &&
                            responseRest.logicType &&
                            responseRest.logicType === 'POPUP'
                        ) {
                            this.fileStatus = 'BANK_MATCH';
                            this.storageService.sessionStorageSetter(
                                'bankAndCreditScreenTab',
                                this.fileStatus
                            );
                        }
                        if (
                            responseRest &&
                            responseRest.accountsBarDto &&
                            responseRest.accountsBarDto.length
                        ) {
                            responseRest.accountsBarDto.forEach((v) => {
                                v.startWorkDate = v.startWorkDate
                                    ? new Date(v.startWorkDate)
                                    : new Date();
                                v.oldestWorkDate = v.oldestWorkDate
                                    ? new Date(v.oldestWorkDate)
                                    : new Date();
                            });

                            const groupByCategory = responseRest.accountsBarDto.reduce((group, product) => {
                                const {bankId} = product;
                                group[bankId] = group[bankId] ?? [];
                                group[bankId].push(product);
                                return group;
                            }, {});
                            const arrayAcc = [];
                            for (const [key, value] of Object.entries(groupByCategory)) {
                                let values: any = value;
                                const istransCountZero = values.filter(it => it.transCount === 0);
                                const istransCountNoneZero = values.filter(it => it.transCount !== 0);

                                if (istransCountZero.length) {
                                    const istransCountZeroClean = JSON.parse(JSON.stringify(istransCountZero));
                                    istransCountZeroClean.forEach(it => {
                                        it.show = false;
                                        it.title = false;
                                        it.startWorkDate = new Date(it.startWorkDate);
                                        it.oldestWorkDate = new Date(it.oldestWorkDate);
                                    });
                                    values = [
                                        Object.assign(istransCountZero[0], {
                                            show: false,
                                            title: true,
                                            accountId: false
                                        }),
                                        ...istransCountZeroClean,
                                        ...istransCountNoneZero
                                    ];
                                }
                                arrayAcc.push(...values);
                                // console.log(`${key}: ${value}`);
                            }
                            responseRest.accountsBarDto = arrayAcc;
                        }
                        this.accountsBarData = responseRest;
                        if (this.accountsBarData.accountsBarDto && this.accountsBarData.accountsBarDto.length) {
                            const existAcc = this.accountSelected
                                ? this.accountsBarData.accountsBarDto.find(
                                    (it) => it.accountId === this.accountSelected.accountId
                                )
                                : false;
                            if (!saveDefAcc || !existAcc) {
                                const defAccount = this.accountsBarData.accountsBarDto.find(it => it.transCount > 0);
                                this.accountSelected = defAccount ? defAccount :
                                    this.accountsBarData.accountsBarDto[0].title ? this.accountsBarData.accountsBarDto[1] : this.accountsBarData.accountsBarDto[0];
                                // this.accountSelected = this.accountsBarData.accountsBarDto[0];
                            }
                            const openClosedTab = this.accountsBarData.accountsBarDto.find(
                                (it) => it.accountId === this.accountSelected.accountId
                            );
                            if (openClosedTab && openClosedTab.show === false) {
                                this.toggleAccChild(this.accountsBarData.accountsBarDto.find(
                                    (it) => it.bankId === this.accountSelected.bankId
                                ));
                            }
                            this.ocrService.getCurrencyList().subscribe((currencies) => {
                                const currencyList = currencies;
                                this.accountsBarData.accountsBarDto.forEach((v) => {
                                    const code = currencyList.find(
                                        (ite) => ite.id === v.currencyId
                                    );
                                    v.currencySign = code.sign;
                                });
                            });
                            this.getDataTables();
                        } else {
                            this.showScreen = true;
                            this.loaderBooks = false;
                            this.loaderCash = false;
                            this.loaderMatchedTrans = false;
                            this.fileStatus = 'BANK_MATCH';
                        }
                    } else {
                        this.accountsBarDataError = true;
                        if (bankAndCreditScreenTab === null) {
                            this.setStatus('BANK');
                        }
                    }

                    // if (!this.accountsBarData.logicType) {
                    //     // this.logicTypeShow = false;
                    // } else {
                    //     if ((<any>$('.example-company-token-tracker')).length ||
                    //         (<any>$('.top-toast-container')).length ||
                    //         (<any>$('#top-notification-container')).length
                    //     ) {
                    //         this.hasTopBar = true;
                    //     }
                    //     this.logicTypeShow = this.accountsBarData.logicType === 'POPUP';
                    //
                    //     if (this.accountsBarData.logicType === 'POPUP') {
                    //         this.getDataTables();
                    //     }
                    //     // if (this.accountsBarData.logicType === 'GREEN') {
                    //     //     this.reportService.cancelToastMatch = {
                    //     //         class: 'yellow',
                    //     //         message: this.domSanitizer.bypassSecurityTrustHtml('<p style="cursor: pointer;">בוצעו התאמות לכל פקודות הספרים, ניתן לשנות תאריך וליצור התאמות חדשות</p>'),
                    //     //         onClose: () => {
                    //     //             this.reportService.cancelToastMatch = null;
                    //     //         },
                    //     //         onClick: () => {
                    //     //             this.reportService.cancelToastMatch = null;
                    //     //             this.open_logicType_again();
                    //     //         }
                    //     //     };
                    //     // }
                    // }
                    // logicType
                },
                (err: HttpErrorResponse) => {
                    this.accountsBarDataError = true;
                    this.setStatus('BANK');
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

    changeAllBooks() {
        if (this.banktransForMatchAll.filter(it => it.deleteRow && it.idSelectRow !== false).length) {
            for (const company of this.banktransForMatch) {
                if (company['idSelectRow'] !== false) {
                    company.deleteRow = this.checkAllBooks;
                }
            }
        } else {
            for (const company of this.banktransForMatch) {
                company.deleteRow = this.checkAllBooks;
            }
        }

        this.hasRowOfDeleted = this.banktransForMatch
            .filter((item) => item.deleteRow)
            .reduce((acmltr, item) => {
                if (acmltr === null) {
                    acmltr = {
                        size: 0,
                        sum: 0,
                        sumShow: 0
                    };
                }
                acmltr.size++;
                acmltr.sumShow += Number(item.total);
                acmltr.sum += item.hova ? Number(item.total) * -1 : Number(item.total); //(item.hova ? -Number(item.total) : Math.abs(Number(item.total)));
                return acmltr;
            }, null);
        this.getBanksRecommendation();

        const idSelectRowMatched = this.banktransForMatchAll.filter(it => !it.deleteRow && it.idSelectRow !== false);
        // console.log(idSelectRowMatched)
        if (idSelectRowMatched.length) {
            idSelectRowMatched.forEach(item => {
                const isMatchSelectedId = this.cashflowMatchAll.filter(it => it.checkRow && it.idSelectRow === item.idSelectRow);
                if (isMatchSelectedId.length) {
                    isMatchSelectedId.forEach(ite => {
                        ite.checkRow = false;
                    });
                }
            });
            this.filtersAllCash();
        }
    }

    getBanksRecommendation() {
        const hasRowOfDeleted = this.banktransForMatch.filter(
            (item) => item.deleteRow
        );
        let checkRows = [];
        if (this.cashflowMatchReco && this.cashflowMatchReco.length) {
            checkRows = this.cashflowMatchReco.filter((item) => item.checkRow);
        }
        if (hasRowOfDeleted.length) {
            this.sharedService
                .getBanksRecommendation({
                    accountId: this.accountSelected.accountId,
                    accountType: this.accountSelected.accountType,
                    journals: hasRowOfDeleted.map((it) => {
                        return {
                            asmachta: it.asmachta,
                            batchNumber: it.batchNumber,
                            date: it.date,
                            dateValue: it.dateValue,
                            details: it.details,
                            fileId: it.fileId,
                            hova: it.hova,
                            journalBankId: it.journalBankId,
                            journalTransId: it.journalTransId,
                            oppositeCustId: it.oppositeCustId,
                            total: it.total,
                            transTypeCode: it.transTypeCode
                        };
                    })
                })
                .subscribe((response: any) => {
                    const responseRest = response
                        ? response['body'][
                            this.accountSelected.accountType === 'BANK'
                                ? 'banksData'
                                : 'cardsData'
                            ]
                        : response;
                    this.cashflowMatchReco = responseRest;
                    const dataArr = [];
                    this.cashflowMatchReco.forEach((v) => {
                        if (v.splitArray && v.splitArray.length) {
                            v.splitArray.forEach(vCh => {
                                vCh.totalParent = v.total;
                                vCh.childenLen = v.splitArray.length;
                            });
                            dataArr.push(...v.splitArray);
                        } else {
                            dataArr.push(v);
                        }
                    });
                    this.cashflowMatchReco = dataArr.map((trns) =>
                        this.setupItemCashView(trns, checkRows)
                    );
                    if (this.cashflowMatchReco.length === 0 && this.currentTab === 0) {
                        this.currentTab = 1;
                    }
                    if (this.cashflowMatchReco.length && this.currentTab === 1) {
                        this.currentTab = 0;
                    }
                    if (this.currentTab === 0) {
                        this.bankSortControl = new FormControl({
                            orderBy: 'targetOriginalDateTime',
                            order: 'DESC'
                        });
                        this.filterInputUnadjusted.setValue('', {
                            emitEvent: false,
                            emitModelToViewChange: true,
                            emitViewToModelChange: false
                        });
                    }

                    // hasRowOfDeleted.length
                    const notNumber = hasRowOfDeleted.filter(
                        (fd) => typeof fd['transDateTime'] !== 'number'
                    );
                    const hasRowOfDeletedOrder = hasRowOfDeleted
                        .filter((fd) => typeof fd['transDateTime'] === 'number')
                        .sort((a, b) => {
                            const lblA = a['transDateTime'],
                                lblB = b['transDateTime'];
                            return lblA || lblB
                                ? !lblA
                                    ? 1
                                    : !lblB
                                        ? -1
                                        : 'ASC' === 'ASC'
                                            ? lblA - lblB
                                            : lblB - lblA
                                : 0;
                        })
                        .concat(notNumber);
                    this.filtersAllCash(hasRowOfDeletedOrder[0]);
                });
        } else {
            this.cashflowMatchReco = [];
            this.currentTab = 1;
            this.filtersAllCash();
        }
    }

    changeAllBank() {
        // this.checkAllRows = !this.checkAllRows;
        // console.log(this.checkAllRows)
        let cashflowMatchTmp;
        if (
            this.cashflowMatchReco &&
            this.cashflowMatchReco.length &&
            this.currentTab === 0
        ) {
            cashflowMatchTmp = this.cashflowMatchReco;
        } else {
            cashflowMatchTmp = this.cashflowMatchAll;
        }
        if (cashflowMatchTmp.filter(it => it.checkRow && it.idSelectRow !== false).length) {
            for (const company of cashflowMatchTmp) {
                if (company['idSelectRow'] !== false) {
                    company.checkRow = this.checkAllRows;
                }
            }
        } else {
            for (const company of cashflowMatchTmp) {
                company.checkRow = this.checkAllRows;
            }
        }
        // this.hasRowOfChecked = cashflowMatchTmp
        //     .filter((item) => item.checkRow)
        //     .reduce((acmltr, item) => {
        //         if (acmltr === null) {
        //             acmltr = {
        //                 size: 0,
        //                 sum: 0
        //             };
        //         }
        //         acmltr.size++;
        //         acmltr.sum += Number(item.total); //(item.hova ? -Number(item.total) : Math.abs(Number(item.total)));
        //         return acmltr;
        //     }, null);
        this.filtersAllCash();

        if (this.currentTab === 1) {
            const idSelectRowMatched = this.cashflowMatchAll.filter(it => !it.checkRow && it.idSelectRow !== false);
            // console.log(idSelectRowMatched)
            if (idSelectRowMatched.length) {
                idSelectRowMatched.forEach(item => {
                    const isMatchSelectedId = this.banktransForMatchAll.filter(it => it.deleteRow && it.idSelectRow === item.idSelectRow);
                    if (isMatchSelectedId.length) {
                        isMatchSelectedId.forEach(ite => {
                            ite.deleteRow = false;
                        });
                    }
                });
                this.filtersAllBooks();
                // this.getBanksRecommendation();
            }
        }
    }

    checkDeleted(itemChecked: any) {
        itemChecked.deleteRow = !itemChecked.deleteRow;
        if (itemChecked.deleteRow && !itemChecked.idSelectRow && this.banktransForMatchAll.filter(it => it.deleteRow && it.idSelectRow !== false).length) {
            this.showModalAfterSelected = true;
            setTimeout(() => {
                this.banktransForMatchAll.filter(it => it.idSelectRow === false).forEach(it => {
                    it.deleteRow = false;
                });
                this.banktransForMatch.filter(it => it.idSelectRow === false).forEach(it => {
                    it.deleteRow = false;
                });
                itemChecked.deleteRow = false;
                this.filtersAllBooks();
            }, 10);
            return;
        }

        if (this.hasRowOfDeleted) {
        } else {
            // this.currentTab = 1;
        }
        if (!itemChecked.deleteRow) {
            const idSelectRowMatched = this.banktransForMatchAll.filter(it => !it.deleteRow && it.idSelectRow !== false);
            console.log(idSelectRowMatched);
            if (idSelectRowMatched.length) {
                const idSelectRowMatchedSameTable = this.banktransForMatchAll.filter(it => it.deleteRow && it.idSelectRow !== false && idSelectRowMatched.some(item => item.idSelectRow === it.idSelectRow));
                idSelectRowMatchedSameTable.forEach(item => {
                    item.deleteRow = false;
                });
                idSelectRowMatched.forEach(item => {
                    const isMatchSelectedId = this.cashflowMatchAll.filter(it => it.checkRow && it.idSelectRow === item.idSelectRow);
                    if (isMatchSelectedId.length) {
                        isMatchSelectedId.forEach(ite => {
                            ite.checkRow = false;
                        });
                    }
                });
                this.filtersAllCash();
            }
        }

        this.filtersAllBooks();
        if (itemChecked.deleteRow && itemChecked.idSelectRow === false) {
            this.getBanksRecommendation();
        }
    }

    checkChecked(itemRow: any) {
        itemRow.checkRow = !itemRow.checkRow;
        if (this.currentTab === 1) {
            if (itemRow.checkRow && !itemRow.idSelectRow && this.cashflowMatchAll.filter(it => it.checkRow && it.idSelectRow !== false).length) {
                this.showModalAfterSelected = true;
                setTimeout(() => {
                    this.cashflowMatchAll.filter(it => it.idSelectRow === false).forEach(it => {
                        it.checkRow = false;
                    });
                    this.cashflowMatch.filter(it => it.idSelectRow === false).forEach(it => {
                        it.checkRow = false;
                    });
                    itemRow.checkRow = false;
                    this.filtersAllCash();
                }, 10);
                return;
            }
            if (!itemRow.checkRow) {
                debugger
                const idSelectRowMatched = this.cashflowMatchAll.filter(it => !it.checkRow && it.idSelectRow !== false);
                // console.log(idSelectRowMatched)
                if (idSelectRowMatched.length) {
                    const idSelectRowMatchedSameTable = this.cashflowMatchAll.filter(it => it.checkRow && it.idSelectRow !== false && idSelectRowMatched.some(item => item.idSelectRow === it.idSelectRow));
                    idSelectRowMatchedSameTable.forEach(item => {
                        item.checkRow = false;
                    });
                    idSelectRowMatched.forEach(item => {
                        const isMatchSelectedId = this.banktransForMatchAll.filter(it => it.deleteRow && it.idSelectRow === item.idSelectRow);
                        if (isMatchSelectedId.length) {
                            isMatchSelectedId.forEach(ite => {
                                ite.deleteRow = false;
                            });
                        }
                    });
                    this.filtersAllBooks();
                    // this.getBanksRecommendation();
                }
            }
        }
        this.filtersAllCash();
    }

    checkReco() {
        if (this.cashflowMatchReco && this.cashflowMatchReco.length) {
            this.currentTab = 0;
            this.filtersAllCash();
        }
    }

    getDataTables() {
        this.isFutureTransesOpened = false;
        this.isMadeInBiziboxOpened = false;
        this.isHashTransesOpened = false;
        this.isBiziboxMatchedOpened = false;
        this.booksSortControl = new FormControl({
            orderBy: null,
            order: 'DESC'
        });
        this.bankSortControl = new FormControl({
            orderBy: null,
            order: 'DESC'
        });
        this.loaderBooks = true;
        this.loaderCash = true;
        this.checkAllRows = false;
        this.checkAllBooks = false;
        this.hasRowOfChecked = false;
        this.banktransForMatch = [];
        this.currentTab = 1;
        this.filterInputBooks.setValue('', {
            emitEvent: false,
            emitModelToViewChange: true,
            emitViewToModelChange: false
        });
        this.filterInputUnadjusted.setValue('', {
            emitEvent: false,
            emitModelToViewChange: true,
            emitViewToModelChange: false
        });
        setTimeout(() => {
            this.checkNavScroll();
        }, 600);
        this.cashflowMatchAll = null;
        this.hasRowOfDeleted = false;
        this.banktransForMatchAll = null;
        this.matchedTransSaved = null;
        this.matchedTrans = [];

        this.sumsTotal = false;
        this.cashflowMatchReco = null;
        if (this.tabMatched === 1 && this.accountSelected) {
            const parameters = {
                accountId: this.accountSelected.accountId,
                accountType: this.accountSelected.accountType
            };
            // zip(
            //     this.sharedService.getBooksData(parameters),
            //     this.sharedService.getBanksData(parameters)
            // )
            combineLatest([
                this.sharedService.banksBooksUnitedWithMatchAdvised(parameters),
                this.sharedService.paymentTypesTranslate$
            ])
                .pipe(takeUntil(this.destroyed$))
                .subscribe({
                    next: ([res, paymentTypesTranslate]: any) => {
                        this.paymentTypesTranslate = paymentTypesTranslate;
                        // {
                        //     "futureTranses": [
                        //     {
                        //         "asmachta": "string",
                        //         "batchNumber": 0,
                        //         "date": "2018-07-03T00:00:00",
                        //         "dateValue": "2018-07-03T00:00:00",
                        //         "details": "string",
                        //         "fileId": "string",
                        //         "hova": true,
                        //         "journalBankId": "string",
                        //         "journalTransId": "string",
                        //         "oppositeCustId": "string",
                        //         "total": 0,
                        //         "transTypeCode": "string"
                        //     }
                        // ],
                        //     "pastTranses": [
                        //     {
                        //         "asmachta": "string",
                        //         "batchNumber": 0,
                        //         "date": "2018-07-03T00:00:00",
                        //         "dateValue": "2018-07-03T00:00:00",
                        //         "details": "string",
                        //         "fileId": "string",
                        //         "hova": true,
                        //         "journalBankId": "string",
                        //         "journalTransId": "string",
                        //         "oppositeCustId": "string",
                        //         "total": 0,
                        //         "transTypeCode": "string"
                        //     }
                        // ]
                        // }
                        // {
                        //     "banksData": [
                        //     {
                        //         "asmachta": "string",
                        //         "bankTransId": "string",
                        //         "batchNumber": 0,
                        //         "biziboxMutavId": "string",
                        //         "companyAccountId": "string",
                        //         "currencyId": 0,
                        //         "custId": "string",
                        //         "custInactive": true,
                        //         "custPopUp": true,
                        //         "fileId": "string",
                        //         "hova": true,
                        //         "ignoreModifiedBy": "string",
                        //         "ignoreModifiedDate": "2018-07-03T00:00:00",
                        //         "linkId": "string",
                        //         "loanId": "string",
                        //         "mainDesc": "string",
                        //         "misparTnua": 0,
                        //         "note": "string",
                        //         "paymentDesc": "string",
                        //         "paymentId": "string",
                        //         "paymentType": "string",
                        //         "pictureLink": "string",
                        //         "searchkeyId": "string",
                        //         "secDesc": "string",
                        //         "splitArray": [
                        //             {
                        //                 "asmachta": 0,
                        //                 "bankdetailId": "string",
                        //                 "batchNumber": 0,
                        //                 "biziboxMutavId": "string",
                        //                 "chequePicId": "string",
                        //                 "companyAccountId": "string",
                        //                 "currencyId": 0,
                        //                 "custId": "string",
                        //                 "custInactive": true,
                        //                 "custPopUp": true,
                        //                 "fileId": "string",
                        //                 "hova": true,
                        //                 "ignoreModifiedBy": "string",
                        //                 "ignoreModifiedDate": "2018-07-03T00:00:00",
                        //                 "linkId": "string",
                        //                 "mainDesc": "string",
                        //                 "misparTnua": 0,
                        //                 "note": "string",
                        //                 "paymentDesc": "string",
                        //                 "paymentId": "string",
                        //                 "paymentType": "string",
                        //                 "pictureLink": "string",
                        //                 "secDesc": "string",
                        //                 "splitMultiPayment": true,
                        //                 "status": "string",
                        //                 "taxDeduction": "string",
                        //                 "total": 0,
                        //                 "transDate": "2018-07-03T00:00:00",
                        //                 "transTypeCode": "string",
                        //                 "transTypeDefaultAlert": true,
                        //                 "userTransTypeLink": "string"
                        //             }
                        //         ],
                        //         "splitMultiPayment": true,
                        //         "status": "string",
                        //         "taxDeduction": "string",
                        //         "total": 0,
                        //         "transDate": "2018-07-03T00:00:00",
                        //         "transTypeCode": "string",
                        //         "transTypeDefaultAlert": true,
                        //         "userTransTypeLink": "string"
                        //     }
                        // ],
                        //     "cardsData": [
                        //     {
                        //         "batchNumber": 0,
                        //         "ccardTransId": "string",
                        //         "companyAccountId": "string",
                        //         "creditCardId": "string",
                        //         "currencyId": 0,
                        //         "custId": "string",
                        //         "custInactive": true,
                        //         "custPopUp": true,
                        //         "fileId": "string",
                        //         "hova": true,
                        //         "ignoreModifiedBy": "string",
                        //         "ignoreModifiedDate": "2018-07-03T00:00:00",
                        //         "mainDesc": "string",
                        //         "misparTnua": 0,
                        //         "nextCycleDate": "2018-07-03T00:00:00",
                        //         "note": "string",
                        //         "originalTotal": 0,
                        //         "paymentId": "string",
                        //         "paymentType": "string",
                        //         "searchkeyId": "string",
                        //         "secDesc": "string",
                        //         "splitMultiPayment": true,
                        //         "status": "string",
                        //         "taxDeduction": "string",
                        //         "transDate": "2018-07-03T00:00:00",
                        //         "transTotal": 0,
                        //         "transTypeCode": "string",
                        //         "transTypeDefaultAlert": true,
                        //         "userTransTypeLink": "string"
                        //     }
                        // ]
                        // }

                        const response = res
                            ? res['body']
                            : res;
                        // const aa = {
                        //     "banks": {
                        //         "banksData": [
                        //             {
                        //                 "asmachta": "string",
                        //                 "bankTransId": "string",
                        //                 "batchNumber": 0,
                        //                 "biziboxMutavId": "string",
                        //                 "companyAccountId": "string",
                        //                 "currencyId": 0,
                        //                 "custId": "string",
                        //                 "custInactive": true,
                        //                 "custPopUp": true,
                        //                 "fileId": "string",
                        //                 "hova": true,
                        //                 "ignoreModifiedBy": "string",
                        //                 "ignoreModifiedDate": "2018-07-03T00:00:00",
                        //                 "linkId": "string",
                        //                 "loanId": "string",
                        //                 "mainDesc": "string",
                        //                 "misparTnua": 0,
                        //                 "note": "string",
                        //                 "paymentDesc": "string",
                        //                 "paymentId": "string",
                        //                 "paymentType": "string",
                        //                 "pictureLink": "string",
                        //                 "recommendationId": 0,
                        //                 "searchkeyId": "string",
                        //                 "secDesc": "string",
                        //                 "splitArray": [
                        //                     {
                        //                         "asmachta": 0,
                        //                         "bankdetailId": "string",
                        //                         "batchNumber": 0,
                        //                         "biziboxMutavId": "string",
                        //                         "chequePicId": "string",
                        //                         "companyAccountId": "string",
                        //                         "currencyId": 0,
                        //                         "custId": "string",
                        //                         "custInactive": true,
                        //                         "custPopUp": true,
                        //                         "fileId": "string",
                        //                         "hova": true,
                        //                         "ignoreModifiedBy": "string",
                        //                         "ignoreModifiedDate": "2018-07-03T00:00:00",
                        //                         "linkId": "string",
                        //                         "mainDesc": "string",
                        //                         "misparTnua": 0,
                        //                         "note": "string",
                        //                         "paymentDesc": "string",
                        //                         "paymentId": "string",
                        //                         "paymentType": "string",
                        //                         "pictureLink": "string",
                        //                         "recommendationId": 0,
                        //                         "secDesc": "string",
                        //                         "splitMultiPayment": true,
                        //                         "status": "string",
                        //                         "taxDeduction": "string",
                        //                         "total": 0,
                        //                         "transDate": "2018-07-03T00:00:00",
                        //                         "transTypeCode": "string",
                        //                         "transTypeDefaultAlert": true,
                        //                         "userTransTypeLink": "string"
                        //                     }
                        //                 ],
                        //                 "splitMultiPayment": true,
                        //                 "status": "string",
                        //                 "taxDeduction": "string",
                        //                 "total": 0,
                        //                 "transDate": "2018-07-03T00:00:00",
                        //                 "transTypeCode": "string",
                        //                 "transTypeDefaultAlert": true,
                        //                 "userTransTypeLink": "string"
                        //             }
                        //         ],
                        //         "cardsData": [
                        //             {
                        //                 "batchNumber": 0,
                        //                 "ccardTransId": "string",
                        //                 "companyAccountId": "string",
                        //                 "creditCardId": "string",
                        //                 "currencyId": 0,
                        //                 "custId": "string",
                        //                 "custInactive": true,
                        //                 "custPopUp": true,
                        //                 "fileId": "string",
                        //                 "hova": true,
                        //                 "ignoreModifiedBy": "string",
                        //                 "ignoreModifiedDate": "2018-07-03T00:00:00",
                        //                 "mainDesc": "string",
                        //                 "misparTnua": 0,
                        //                 "nextCycleDate": "2018-07-03T00:00:00",
                        //                 "note": "string",
                        //                 "originalTotal": 0,
                        //                 "paymentId": "string",
                        //                 "paymentType": "string",
                        //                 "searchkeyId": "string",
                        //                 "secDesc": "string",
                        //                 "splitMultiPayment": true,
                        //                 "status": "string",
                        //                 "taxDeduction": "string",
                        //                 "transDate": "2018-07-03T00:00:00",
                        //                 "transTotal": 0,
                        //                 "transTypeCode": "string",
                        //                 "transTypeDefaultAlert": true,
                        //                 "userTransTypeLink": "string"
                        //             }
                        //         ]
                        //     },
                        //     "books": {
                        //         "futureTranses": [
                        //             {
                        //                 "asmachta": "string",
                        //                 "batchNumber": 0,
                        //                 "date": "2018-07-03T00:00:00",
                        //                 "dateValue": "2018-07-03T00:00:00",
                        //                 "details": "string",
                        //                 "fileId": "string",
                        //                 "hova": true,
                        //                 "journalBankId": "string",
                        //                 "oppositeCustId": "string",
                        //                 "recommendationId": 0,
                        //                 "sourceType": "string",
                        //                 "total": 0,
                        //                 "transTypeCode": "string"
                        //             }
                        //         ],
                        //         "pastTranses": [
                        //             {
                        //                 "asmachta": "string",
                        //                 "batchNumber": 0,
                        //                 "date": "2018-07-03T00:00:00",
                        //                 "dateValue": "2018-07-03T00:00:00",
                        //                 "details": "string",
                        //                 "fileId": "string",
                        //                 "hova": true,
                        //                 "journalBankId": "string",
                        //                 "oppositeCustId": "string",
                        //                 "recommendationId": 0,
                        //                 "sourceType": "string",
                        //                 "total": 0,
                        //                 "transTypeCode": "string"
                        //             }
                        //         ]
                        //     }
                        // }
                        this.loaderBooks = false;
                        this.loaderCash = false;

                        this.banktransForMatchAll = response.books;
                        // this.banktransForMatchAll.futureTranses = [
                        //     {
                        //         asmachta: '0',
                        //         batchNumber: 79,
                        //         date: 1549497600000,
                        //         dateValue: 1549490400000,
                        //         details: null,
                        //         fileId: '9f67805a-9f62-4952-8e8c-a7db56570149',
                        //         hova: false,
                        //         journalBankId: 'bef06d2c-8240-4581-a7b5-11a25fbb4f74',
                        //         journalTransId: '22e741b8-5f67-4d57-ae16-28e8d111e682',
                        //         oppositeCustId: null,
                        //         total: 133044,
                        //         transTypeCode: ''
                        //     },
                        //     {
                        //         asmachta: '0',
                        //         batchNumber: 235,
                        //         date: 1614643200000,
                        //         dateValue: 1614636000000,
                        //         details: 'בזק ביג 1/21',
                        //         fileId: null,
                        //         hova: false,
                        //         journalBankId: 'dcd92173-6b23-47af-a1ac-5405b1748a57',
                        //         journalTransId: '8b6743b0-2ca6-4715-b82a-6d2cdf8c69e8',
                        //         oppositeCustId: '500008',
                        //         total: 53.11,
                        //         transTypeCode: ''
                        //     }];
                        if (this.banktransForMatchAll.futureTranses) {
                            this.banktransForMatchAll.futureTranses =
                                this.banktransForMatchAll.futureTranses.map((trns) =>
                                    this.setupItemView(trns, true)
                                );
                        } else {
                            this.banktransForMatchAll.futureTranses = [];
                        }
                        if (this.banktransForMatchAll.pastTranses) {
                            this.banktransForMatchAll.pastTranses =
                                this.banktransForMatchAll.pastTranses.map((trns) =>
                                    this.setupItemView(trns, false)
                                );
                        } else {
                            this.banktransForMatchAll.pastTranses = [];
                        }
                        this.banktransForMatchAll = [
                            ...this.banktransForMatchAll.futureTranses,
                            ...this.banktransForMatchAll.pastTranses
                        ];
                        this.cashflowMatchAll = response.banks
                            ? response.banks[
                                this.accountSelected.accountType === 'BANK'
                                    ? 'banksData'
                                    : 'cardsData'
                                ]
                            : response.banks;
                        const dataArr = [];
                        this.cashflowMatchAll.forEach((v) => {
                            if (v.splitArray && v.splitArray.length) {
                                v.splitArray.forEach(vCh => {
                                    vCh.totalParent = v.total;
                                    vCh.childenLen = v.splitArray.length;
                                });
                                dataArr.push(...v.splitArray);
                            } else {
                                dataArr.push(v);
                            }
                        });
                        this.cashflowMatchAll = dataArr.map((trns) =>
                            this.setupItemCashView(trns)
                        );
                        this.sumsTotal = {};
                        this.sumsTotal.bank = this.cashflowMatchAll.reduce(
                            (total, item, currentIndex) => {
                                return (
                                    total +
                                    (item.hova
                                        ? -Number(item.total)
                                        : Math.abs(Number(item.total)))
                                );
                            },
                            0
                        );
                        this.sumsTotal.books = this.banktransForMatchAll.reduce(
                            (total, item, currentIndex) => {
                                return (
                                    total +
                                    (item.hova
                                        ? -Number(item.total)
                                        : Math.abs(Number(item.total)))
                                );
                            },
                            0
                        );
                        this.sumsTotal.dif = this.sumsTotal.bank + this.sumsTotal.books;
                        this.filtersAllBooks();
                        this.filtersAllCash();
                    },
                    error: (err: HttpErrorResponse) => {
                        if (err.error instanceof Error) {
                            console.log('An error occurred:', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    },
                    complete: () => console.info('complete')
                });
            this.scrollSelectedAccountIntoView();
        } else {
            if (this.accountSelected) {
                this.loaderMatchedTrans = true;
                const intShowDates = setInterval(() => {
                    if (this.childMatchDates) {
                        clearInterval(intShowDates);
                        this.childMatchDates.selectedRange.subscribe((paramDate) => {
                            const parameters = {
                                accountId: this.accountSelected.accountId,
                                accountType: this.accountSelected.accountType,
                                from: paramDate.fromDate,
                                till: paramDate.toDate
                            };
                            this.sharedService.matchedTrans(parameters).subscribe(
                                (response: any) => {
                                    let defNull = null;
                                    // defNull = {
                                    //     'paymentType': 'BANK_TRANS',
                                    //     'paymentId': 'e04f5ea0-fe46-1fdb-e053-0b6519acf1e4',
                                    //     'date': 1661029200000,
                                    //     'dateValue': 1661029200000,
                                    //     'asmachta': '800701',
                                    //     'details': 'הלוואה- פרעון1235',
                                    //     'hova': true,
                                    //     'total': -2041.69,
                                    //     'balance': -60004.34,
                                    //     'batchNumber': 20,
                                    //     'fileId': 'string',
                                    //     'journalBankMatchId': 'string',
                                    //     'journalTransId': 'string',
                                    //     'oppositeCustId': 'string',
                                    //     'sourceType': 'JOURNAL_TEMP',
                                    //     'transTypeCode': 'string'
                                    // };
                                    this.loaderMatchedTrans = false;
                                    this.matchedTransSaved = response ? response['body'] : response;
                                    if (this.matchedTransSaved.hashMatched) {
                                        const hashMatched = [];
                                        this.matchedTransSaved.hashMatched.forEach((it, indexPar) => {
                                            if (it.banks && it.books) {
                                                if (it.banks.length > it.books.length) {
                                                    it.banks.forEach((itch, index) => {
                                                        hashMatched.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.banks.length,
                                                            indexPar: 'hashMatched_' + indexPar,
                                                            book:
                                                                it.books.length >= index + 1
                                                                    ? it.books[index]
                                                                    : defNull,
                                                            bank: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.banks.length
                                                        });
                                                    });
                                                } else {
                                                    it.books.forEach((itch, index) => {
                                                        hashMatched.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.books.length,
                                                            indexPar: 'hashMatched_' + indexPar,
                                                            bank:
                                                                it.banks.length >= index + 1
                                                                    ? it.banks[index]
                                                                    : defNull,
                                                            book: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.books.length
                                                        });
                                                    });
                                                }
                                            } else {
                                                if (it.banks) {
                                                    it.banks.forEach((itch, index) => {
                                                        hashMatched.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.banks.length,
                                                            indexPar: 'hashMatched_' + indexPar,
                                                            book: defNull,
                                                            bank: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.banks.length
                                                        });
                                                    });
                                                } else if (it.books) {
                                                    it.books.forEach((itch, index) => {
                                                        hashMatched.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.books.length,
                                                            indexPar: 'hashMatched_' + indexPar,
                                                            bank: defNull,
                                                            book: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.books.length
                                                        });
                                                    });
                                                }
                                            }
                                        });
                                        this.matchedTransSaved.hashMatched = hashMatched.map((trns) =>
                                            this.setupItemViewMatched(trns, true, false, false)
                                        );
                                    } else {
                                        this.matchedTransSaved.hashMatched = [];
                                    }

                                    if (this.matchedTransSaved.madeInBizibox) {
                                        const madeInBizibox = [];
                                        this.matchedTransSaved.madeInBizibox.forEach((it, indexPar) => {
                                            if (it.banks && it.books) {
                                                if (it.banks.length > it.books.length) {
                                                    it.banks.forEach((itch, index) => {
                                                        madeInBizibox.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.banks.length,
                                                            indexPar: 'madeInBizibox_' + indexPar,
                                                            book:
                                                                it.books.length >= index + 1
                                                                    ? it.books[index]
                                                                    : defNull,
                                                            bank: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.banks.length
                                                        });
                                                    });
                                                } else {
                                                    it.books.forEach((itch, index) => {
                                                        madeInBizibox.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.books.length,
                                                            indexPar: 'madeInBizibox_' + indexPar,
                                                            bank:
                                                                it.banks.length >= index + 1
                                                                    ? it.banks[index]
                                                                    : defNull,
                                                            book: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.books.length
                                                        });
                                                    });
                                                }
                                            } else {
                                                if (it.banks) {
                                                    it.banks.forEach((itch, index) => {
                                                        madeInBizibox.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.banks.length,
                                                            indexPar: 'madeInBizibox_' + indexPar,
                                                            book: defNull,
                                                            bank: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.banks.length
                                                        });
                                                    });
                                                } else if (it.books) {
                                                    it.books.forEach((itch, index) => {
                                                        madeInBizibox.push({
                                                            isFirst: index === 0,
                                                            isLast: index + 1 === it.books.length,
                                                            indexPar: 'madeInBizibox_' + indexPar,
                                                            bank: defNull,
                                                            book: itch,
                                                            matchNum: it.matchNum,
                                                            totalRows: it.books.length
                                                        });
                                                    });
                                                }
                                            }
                                        });
                                        this.matchedTransSaved.madeInBizibox = madeInBizibox.map((trns) =>
                                            this.setupItemViewMatched(trns, false, true, false)
                                        );
                                    } else {
                                        this.matchedTransSaved.madeInBizibox = [];
                                    }

                                    if (this.matchedTransSaved.biziboxMatched) {
                                        const biziboxMatched = [];
                                        this.matchedTransSaved.biziboxMatched.forEach(
                                            (it, indexPar) => {
                                                if (it.banks && it.books) {
                                                    if (it.banks.length > it.books.length) {
                                                        it.banks.forEach((itch, index) => {
                                                            biziboxMatched.push({
                                                                isFirst: index === 0,
                                                                isLast: index + 1 === it.banks.length,
                                                                indexPar: 'biziboxMatched_' + indexPar,
                                                                book:
                                                                    it.books.length >= index + 1
                                                                        ? it.books[index]
                                                                        : defNull,
                                                                bank: itch,
                                                                totalRows: it.banks.length
                                                            });
                                                        });
                                                    } else {
                                                        it.books.forEach((itch, index) => {
                                                            biziboxMatched.push({
                                                                isFirst: index === 0,
                                                                isLast: index + 1 === it.books.length,
                                                                indexPar: 'biziboxMatched_' + indexPar,
                                                                bank:
                                                                    it.banks.length >= index + 1
                                                                        ? it.banks[index]
                                                                        : defNull,
                                                                book: itch,
                                                                totalRows: it.books.length
                                                            });
                                                        });
                                                    }
                                                } else {
                                                    if (it.banks) {
                                                        it.banks.forEach((itch, index) => {
                                                            biziboxMatched.push({
                                                                isFirst: index === 0,
                                                                isLast: index + 1 === it.banks.length,
                                                                indexPar: 'biziboxMatched_' + indexPar,
                                                                book: defNull,
                                                                bank: itch,
                                                                totalRows: it.banks.length
                                                            });
                                                        });
                                                    } else if (it.books) {
                                                        it.books.forEach((itch, index) => {
                                                            biziboxMatched.push({
                                                                isFirst: index === 0,
                                                                isLast: index + 1 === it.books.length,
                                                                indexPar: 'biziboxMatched_' + indexPar,
                                                                bank: defNull,
                                                                book: itch,
                                                                totalRows: it.books.length
                                                            });
                                                        });
                                                    }
                                                }
                                            }
                                        );
                                        this.matchedTransSaved.biziboxMatched = biziboxMatched.map(
                                            (trns) => this.setupItemViewMatched(trns, false, false, true)
                                        );
                                    } else {
                                        this.matchedTransSaved.biziboxMatched = [];
                                    }
                                    this.matchedTransSaved = [
                                        ...this.matchedTransSaved.hashMatched,
                                        ...this.matchedTransSaved.madeInBizibox,
                                        ...this.matchedTransSaved.biziboxMatched
                                    ];
                                    console.log(this.matchedTransSaved);
                                    this.filtersMatchedTrans();
                                },
                                (err: HttpErrorResponse) => {
                                    if (err.error instanceof Error) {
                                        console.log('An error occurred:', err.error.message);
                                    } else {
                                        console.log(
                                            `Backend returned code ${err.status}, body was: ${err.error}`
                                        );
                                    }
                                }
                            );
                        });
                    }
                }, 20);
            }
        }
    }

    cancelMatch(journalBankMatchId: any) {
        this.sharedService.cancelMatched([journalBankMatchId]).subscribe(() => {
            this.getDataTables();
        });
    }

    openTopMessage() {
        if (
            this.banktransForMatchAll.filter((it) => !it.isFutureTranses).length >
            0 &&
            this.cashflowMatchAll.length > 0
        ) {
            this.reportService.cancelToastMatch = {
                class: 'red',
                message: this.domSanitizer.bypassSecurityTrustHtml(
                    '<p style="cursor: pointer;">לחץ כאן על מנת להשלים את תהליך התאמות בנקים</p>'
                ),
                onClose: () => {
                    this.reportService.cancelToastMatch = null;
                },
                onClick: () => {
                    this.reportService.cancelToastMatch = null;
                    this.open_logicType_again();
                }
            };
        } else {
            this.reportService.cancelToastMatch = {
                class: 'yellow',
                message: this.domSanitizer.bypassSecurityTrustHtml(
                    '<p style="cursor: pointer;">בוצעו התאמות לכל פקודות הספרים, ניתן לשנות תאריך וליצור התאמות חדשות</p>'
                ),
                onClose: () => {
                    this.reportService.cancelToastMatch = null;
                },
                onClick: () => {
                    this.reportService.cancelToastMatch = null;
                    this.open_logicType_again();
                }
            };
        }
    }

    disabledMatchBtn(): boolean {
        if (((!this.hasRowOfChecked || this.hasRowOfChecked && this.hasRowOfChecked.size === 0) && this.hasRowOfDeleted && this.hasRowOfDeleted.size > 1 && this.hasRowOfDeleted.sum === 0) || ((!this.hasRowOfDeleted || this.hasRowOfDeleted && this.hasRowOfDeleted.size === 0) && this.hasRowOfChecked && this.hasRowOfChecked.size > 1 && this.hasRowOfChecked.sum === 0)) {
            return false;
        }
        if ((this.hasRowOfChecked && this.hasRowOfDeleted && (toFixedNumber(this.hasRowOfDeleted ? this.hasRowOfDeleted.sum : 0) + toFixedNumber(this.hasRowOfChecked ? this.hasRowOfChecked.sum : 0)) === 0)) {
            return false;
        }
        return true;
    }

    accountantMatch() {
        let cashflowMatchTmp;
        if (
            this.cashflowMatchReco &&
            this.cashflowMatchReco.length &&
            this.currentTab === 0
        ) {
            cashflowMatchTmp = this.cashflowMatchReco;
        } else {
            cashflowMatchTmp = this.cashflowMatchAll;
        }
        // if (
        //     cashflowMatchTmp &&
        //     cashflowMatchTmp.length &&
        //     cashflowMatchTmp.filter((item) => item.checkRow).length
        // ) {
        //
        // }
        this.sharedService
            .accountantMatch({
                accountId: this.accountSelected.accountId,
                accountType: this.accountSelected.accountType,
                companyId: this.userService.appData.userData.companySelect.companyId,
                journals: this.banktransForMatch
                    .filter((item) => item.deleteRow)
                    .map((it) => it.journalBankId),
                payments: cashflowMatchTmp
                    .filter((item) => item.checkRow)
                    .map((it) => {
                        return {
                            paymentId: it.paymentId,
                            paymentType: it.paymentType
                        };
                    })
            })
            .subscribe(() => {
                this.accountsBar(true);
            });
    }

    toggleBooksOrderTo(field: any) {
        if (this.booksSortControl.value.orderBy === field) {
            this.booksSortControl.patchValue({
                orderBy: this.booksSortControl.value.orderBy,
                order: this.booksSortControl.value.order === 'ASC' ? 'DESC' : 'ASC'
            });
        } else {
            this.booksSortControl.patchValue({
                orderBy: field,
                order: 'DESC'
            });
        }
        this.filtersAllBooks();
    }

    toggleBankOrderTo(field: any) {
        if (this.bankSortControl.value.orderBy === field) {
            this.bankSortControl.patchValue({
                orderBy: this.bankSortControl.value.orderBy,
                order: this.bankSortControl.value.order === 'ASC' ? 'DESC' : 'ASC'
            });
        } else {
            this.bankSortControl.patchValue({
                orderBy: field,
                order: 'DESC'
            });
        }
        this.filtersAllCash();
    }

    filtersMatchedTrans(): void {
        // isFutureTranses
        this.matchedTrans = [].concat(this.matchedTransSaved);

        let matchedTransBook = [];
        if (this.filterInputBooks.value) {
            const searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
                this.filterInputBooks.value
            );
            matchedTransBook = this.filterPipe.transform(
                [].concat(this.matchedTrans),
                this.filterInputBooks.value,
                searchInDates
                    ? [
                        'details',
                        'transDateStr_date',
                        'batchNumber',
                        'oppositeCustId',
                        'transTypeCode',
                        'asmachta',
                        'transDateStr',
                        'total'
                    ]
                    : [
                        'details',
                        'batchNumber',
                        'oppositeCustId',
                        'transTypeCode',
                        'asmachta',
                        'total'
                    ],
                undefined,
                undefined,
                'book'
            );

            if (matchedTransBook.length) {
                matchedTransBook = matchedTransBook.map((it) => it.indexPar);
            }
        }
        let matchedTransBank = [];
        if (this.filterInputUnadjusted.value) {
            const searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
                this.filterInputUnadjusted.value
            );
            matchedTransBank = this.filterPipe.transform(
                [].concat(this.matchedTrans),
                this.filterInputUnadjusted.value,
                searchInDates
                    ? [
                        'details',
                        'transDateStr_date',
                        'asmachta',
                        'transDateStr',
                        'total'
                    ]
                    : ['details', 'asmachta', 'total'],
                undefined,
                undefined,
                'bank'
            );
            if (matchedTransBank.length) {
                matchedTransBook.push(...matchedTransBank.map((it) => it.indexPar));
            }
        }
        if (matchedTransBook.length) {
            this.matchedTrans = this.matchedTrans.filter((it) =>
                matchedTransBook.includes(it.indexPar)
            );
        } else {
            if (this.filterInputBooks.value || this.filterInputUnadjusted.value) {
                this.matchedTrans = [];
            }
        }

        if (this.matchedTrans.length) {
            const show_isFutureTransesTitle =
                this.matchedTrans.filter((it) => it.isFutureTranses).length > 0;
            const matchedTransF = (this.isHashTransesOpened ? this.matchedTrans.filter((it) => it.isFutureTranses) : []);
            if (show_isFutureTransesTitle) {
                matchedTransF.unshift({
                    isFutureTranses: true,
                    isFutureTransesTitle: true,
                    isMadeInBizibox: false,
                    isMadeInBiziboxTitle: false,
                    isBiziboxMatched: false,
                    isBiziboxMatchedTitle: false,
                    asmachta: null,
                    batchNumber: null,
                    date: null,
                    dateValue: null,
                    details: null,
                    fileId: null,
                    hova: false,
                    journalBankId: null,
                    journalTransId: null,
                    oppositeCustId: null,
                    total: null,
                    transTypeCode: ''
                });
            }
            const show_isBiziboxMatchedTitle =
                this.matchedTrans.filter((it) => it.isBiziboxMatched).length > 0;
            const matchedTransB = (this.isBiziboxMatchedOpened ? this.matchedTrans.filter((it) => it.isBiziboxMatched) : []);
            if (show_isBiziboxMatchedTitle) {
                matchedTransB.unshift({
                    isFutureTranses: false,
                    isFutureTransesTitle: false,
                    isMadeInBizibox: false,
                    isMadeInBiziboxTitle: false,
                    isBiziboxMatched: true,
                    isBiziboxMatchedTitle: true,
                    asmachta: null,
                    batchNumber: null,
                    date: null,
                    dateValue: null,
                    details: null,
                    fileId: null,
                    hova: false,
                    journalBankId: null,
                    journalTransId: null,
                    oppositeCustId: null,
                    total: null,
                    transTypeCode: ''
                });
            }

            const show_MadeInBiziboxTitle =
                this.matchedTrans.filter((it) => it.isMadeInBizibox).length > 0;
            const matchedTransM = (this.isMadeInBiziboxOpened ? this.matchedTrans.filter((it) => it.isMadeInBizibox) : []);
            if (show_MadeInBiziboxTitle) {
                matchedTransM.unshift({
                    isFutureTranses: false,
                    isFutureTransesTitle: false,
                    isBiziboxMatched: false,
                    isBiziboxMatchedTitle: false,
                    isMadeInBizibox: true,
                    isMadeInBiziboxTitle: true,
                    asmachta: null,
                    batchNumber: null,
                    date: null,
                    dateValue: null,
                    details: null,
                    fileId: null,
                    hova: false,
                    journalBankId: null,
                    journalTransId: null,
                    oppositeCustId: null,
                    total: null,
                    transTypeCode: ''
                });
            }
            this.matchedTrans = [
                ...matchedTransF,
                ...matchedTransB,
                ...matchedTransM
            ];
        }

        this.loaderMatchedTrans = false;
    }

    filtersAllBooks(): void {
        this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
            this.filterInputBooks.value
        );
        // isFutureTranses
        if (this.filterInputBooks.value) {
            this.banktransForMatch = this.filterPipe.transform(
                [].concat(this.banktransForMatchAll),
                this.filterInputBooks.value,
                this.searchInDates
                    ? [...this.searchableList, 'transDateStr', 'transDateStr_date']
                    : this.searchableList
            );
        } else {
            this.banktransForMatch = [].concat(this.banktransForMatchAll);
        }

        let show_isFutureTransesTitle = false;
        if (this.banktransForMatch.length) {
            switch (this.booksSortControl.value.orderBy) {
                case 'batchNumber':
                case 'totalPlusMinus':
                case 'asmachta':
                case 'transDateTime':
                case 'transDateTime_date':
                    // noinspection DuplicatedCode
                    const notNumber = this.banktransForMatch.filter(
                        (fd) => typeof fd[this.booksSortControl.value.orderBy] !== 'number'
                    );
                    this.banktransForMatch = this.banktransForMatch
                        .filter(
                            (fd) =>
                                typeof fd[this.booksSortControl.value.orderBy] === 'number'
                        )
                        .sort((a, b) => {
                            const lblA = a[this.booksSortControl.value.orderBy],
                                lblB = b[this.booksSortControl.value.orderBy];
                            return lblA || lblB
                                ? !lblA
                                    ? 1
                                    : !lblB
                                        ? -1
                                        : this.booksSortControl.value.order === 'ASC'
                                            ? lblA - lblB
                                            : lblB - lblA
                                : 0;
                        })
                        .concat(notNumber);
                    break;
                case 'oppositeCustId':
                case 'transTypeCode':
                case 'details':
                    // noinspection DuplicatedCode
                    const notString = this.banktransForMatch.filter(
                        (fd) => typeof fd[this.booksSortControl.value.orderBy] !== 'string'
                    );
                    this.banktransForMatch = this.banktransForMatch
                        .filter(
                            (fd) =>
                                typeof fd[this.booksSortControl.value.orderBy] === 'string'
                        )
                        .sort((a, b) => {
                            const lblA = a[this.booksSortControl.value.orderBy],
                                lblB = b[this.booksSortControl.value.orderBy];
                            return (
                                (lblA || lblB
                                    ? !lblA
                                        ? 1
                                        : !lblB
                                            ? -1
                                            : lblA.localeCompare(lblB)
                                    : 0) * (this.booksSortControl.value.order === 'DESC' ? -1 : 1)
                            );
                        })
                        .concat(notString);
                    break;
            }
            show_isFutureTransesTitle =
                this.banktransForMatch.filter((it) => it.isFutureTranses).length > 0;
            if (this.isFutureTransesOpened) {
                this.banktransForMatch = [
                    ...this.banktransForMatch.filter((it) => it.isFutureTranses),
                    ...this.banktransForMatch.filter((it) => !it.isFutureTranses)
                ];
            } else {
                this.banktransForMatch = [
                    ...this.banktransForMatch.filter((it) => !it.isFutureTranses)
                ];
            }
        }

        if (show_isFutureTransesTitle) {
            this.banktransForMatch.unshift({
                isFutureTranses: true,
                isFutureTransesTitle: true,
                asmachta: null,
                batchNumber: null,
                date: null,
                dateValue: null,
                details: null,
                fileId: null,
                hova: false,
                journalBankId: null,
                journalTransId: null,
                oppositeCustId: null,
                total: null,
                transTypeCode: ''
            });
            if (this.cashflowMatch && this.cashflowMatch.length) {
                this.cashflowMatch = this.cashflowMatch.filter((it) => !it.isFutureTranses);
                this.cashflowMatch.unshift({
                    isFutureTranses: true,
                    isFutureTransesTitle: true,
                    asmachta: null,
                    batchNumber: null,
                    date: null,
                    dateValue: null,
                    details: null,
                    fileId: null,
                    hova: false,
                    journalBankId: null,
                    journalTransId: null,
                    oppositeCustId: null,
                    total: null,
                    transTypeCode: ''
                });
            }
        } else {
            if (this.cashflowMatch && this.cashflowMatch.length) {
                this.cashflowMatch = this.cashflowMatch.filter((it) => !it.isFutureTranses);
            }
        }


        this.hasRowOfDeleted = this.banktransForMatch
            .filter((item) => item.deleteRow)
            .reduce((acmltr, item) => {
                if (acmltr === null) {
                    acmltr = {
                        size: 0,
                        sum: 0,
                        sumShow: 0
                    };
                }
                acmltr.size++;
                acmltr.sumShow += Number(item.total);
                acmltr.sum += item.hova ? Number(item.total) * -1 : Number(item.total); //(item.hova ? -Number(item.total) : Math.abs(Number(item.total)));
                return acmltr;
            }, null);

        this.loaderBooks = false;
        this.loaderCash = false;
    }

    filtersAllCash(idToScroll?: any): void {
        let cashflowMatchTmp;
        if (
            this.cashflowMatchReco &&
            this.cashflowMatchReco.length &&
            this.currentTab === 0
        ) {
            cashflowMatchTmp = this.cashflowMatchReco;
        } else {
            cashflowMatchTmp = this.cashflowMatchAll;
        }
        if (
            cashflowMatchTmp.filter((item) => item.checkRow).length ===
            cashflowMatchTmp.length
        ) {
            this.checkAllRows = true;
        } else {
            this.checkAllRows = false;
        }

        if (this.filterInputUnadjusted.value) {
            cashflowMatchTmp = this.filterPipe.transform(
                [].concat(cashflowMatchTmp),
                this.filterInputUnadjusted.value,
                this.searchableListUnadjusted
            );
        }

        this.cashflowMatch = cashflowMatchTmp;
        if (this.cashflowMatch.length) {
            switch (this.bankSortControl.value.orderBy) {
                case 'batchNumber':
                case 'totalPlusMinus':
                case 'transDateTime':
                case 'asmachta':
                case 'transDateTime_date':
                case 'targetOriginalDateTime':
                case 'nextCycleDateTime':
                    // noinspection DuplicatedCode
                    const notNumber = this.cashflowMatch.filter(
                        (fd) => typeof fd[this.bankSortControl.value.orderBy] !== 'number'
                    );
                    this.cashflowMatch = this.cashflowMatch
                        .filter(
                            (fd) => typeof fd[this.bankSortControl.value.orderBy] === 'number'
                        )
                        .sort((a, b) => {
                            const lblA = a[this.bankSortControl.value.orderBy],
                                lblB = b[this.bankSortControl.value.orderBy];
                            return lblA || lblB
                                ? !lblA
                                    ? 1
                                    : !lblB
                                        ? -1
                                        : this.bankSortControl.value.order === 'ASC'
                                            ? lblA - lblB
                                            : lblB - lblA
                                : 0;
                        })
                        .concat(notNumber);
                    break;
                case 'oppositeCustId':
                case 'transTypeCode':
                case 'mainDesc':
                case 'paymentDesc':
                    // noinspection DuplicatedCode
                    const notString = this.cashflowMatch.filter(
                        (fd) => typeof fd[this.bankSortControl.value.orderBy] !== 'string'
                    );
                    this.cashflowMatch = this.cashflowMatch
                        .filter(
                            (fd) => typeof fd[this.bankSortControl.value.orderBy] === 'string'
                        )
                        .sort((a, b) => {
                            const lblA = a[this.bankSortControl.value.orderBy],
                                lblB = b[this.bankSortControl.value.orderBy];
                            return (
                                (lblA || lblB
                                    ? !lblA
                                        ? 1
                                        : !lblB
                                            ? -1
                                            : lblA.localeCompare(lblB)
                                    : 0) * (this.bankSortControl.value.order === 'DESC' ? -1 : 1)
                            );
                        })
                        .concat(notString);
                    break;
            }
        }


        this.cashflowMatch = this.cashflowMatch.filter((it) => !it.isFutureTranses);
        let show_isFutureTransesTitle = this.banktransForMatch && this.banktransForMatch.length &&
            this.banktransForMatch.filter((it) => it.isFutureTranses).length > 0 && this.cashflowMatch && this.cashflowMatch.length;
        if (show_isFutureTransesTitle) {
            this.cashflowMatch.unshift({
                isFutureTranses: true,
                isFutureTransesTitle: true,
                asmachta: null,
                batchNumber: null,
                date: null,
                dateValue: null,
                details: null,
                fileId: null,
                hova: false,
                journalBankId: null,
                journalTransId: null,
                oppositeCustId: null,
                total: null,
                transTypeCode: ''
            });
        }


        setTimeout(() => {
            if (idToScroll) {
                const isFoundCompleteMatch = this.cashflowMatch.find(
                    (fd) => fd.transDateStr === idToScroll.transDateStr
                );
                if (isFoundCompleteMatch) {
                    this.scrollById(
                        isFoundCompleteMatch['paymentId'] +
                        '_' +
                        isFoundCompleteMatch['paymentType']
                    );
                } else {
                    const allThePastDates = JSON.parse(
                        JSON.stringify(this.cashflowMatch)
                    ).filter(
                        (fd) => idToScroll.transDateTime > fd.targetOriginalDateTime
                    );
                    if (allThePastDates.length) {
                        allThePastDates.forEach((it) => {
                            it.distance =
                                idToScroll.transDateTime - it.targetOriginalDateTime;
                        });
                        const dateAfterDis = allThePastDates.sort((a, b) => {
                            const lblA = a['distance'],
                                lblB = b['distance'];
                            return lblA || lblB
                                ? !lblA
                                    ? 1
                                    : !lblB
                                        ? -1
                                        : 'ASC' === 'ASC'
                                            ? lblA - lblB
                                            : lblB - lblA
                                : 0;
                        });
                        this.scrollById(
                            dateAfterDis[0]['paymentId'] +
                            '_' +
                            dateAfterDis[0]['paymentType']
                        );
                    } else {
                        const allTheFutureDates = JSON.parse(
                            JSON.stringify(this.cashflowMatch)
                        );
                        allTheFutureDates.forEach((it) => {
                            it.distance =
                                it.targetOriginalDateTime - idToScroll.transDateTime;
                        });
                        const dateAfterDis = allTheFutureDates.sort((a, b) => {
                            const lblA = a['distance'],
                                lblB = b['distance'];
                            return lblA || lblB
                                ? !lblA
                                    ? 1
                                    : !lblB
                                        ? -1
                                        : 'ASC' === 'ASC'
                                            ? lblA - lblB
                                            : lblB - lblA
                                : 0;
                        });
                        this.scrollById(
                            dateAfterDis[0]['paymentId'] +
                            '_' +
                            dateAfterDis[0]['paymentType']
                        );
                    }
                }
            }
        }, 20);

        this.hasRowOfChecked = cashflowMatchTmp
            .filter((item) => item.checkRow)
            .reduce((acmltr, item) => {
                if (acmltr === null) {
                    acmltr = {
                        size: 0,
                        sum: 0,
                        sumShow: 0
                    };
                }
                acmltr.size++;
                acmltr.sumShow += Number(item.total);
                acmltr.sum += item.hova ? Number(item.total) * -1 : Number(item.total); //(item.hova ? -Number(item.total) : Math.abs(Number(item.total)));
                return acmltr;
            }, null);

        this.loaderCash = false;
    }

    public selectDate(eve: any) {
        this.sharedService
            .updateStartWorkDate({
                accountId: this.accountSelected.accountId,
                accountType: this.accountSelected.accountType,
                companyId: this.userService.appData.userData.companySelect.companyId,
                startWorkDate: this.accountSelected.startWorkDate
            })
            .subscribe(() => {
                this.accountsBar(true);
            });
    }

    scrollSelectedAccountIntoView() {
        if (this.navBanks) {
            const idxToScrollTo = this.accountSelected
                ? this.accountsBarData.accountsBarDto.indexOf(this.accountSelected)
                : -1;
            // console.log('idxToScrollTo = %o', idxToScrollTo);
            if (
                !this.navBanks.nativeElement ||
                !(this.navBanks.nativeElement as HTMLElement).children.length
            ) {
                setTimeout(() => {
                    this.scrollListToIndex(
                        this.navBanks.nativeElement as HTMLElement,
                        idxToScrollTo
                    );
                }, 300);
            } else {
                this.scrollListToIndex(
                    this.navBanks.nativeElement as HTMLElement,
                    idxToScrollTo
                );
            }
        }
    }

    ngAfterViewInit(): void {
        console.log('AfterViewInit');
        const bankAndCreditScreenTab = this.storageService.sessionStorageGetterItem(
            'bankAndCreditScreenTab'
        );
        if (bankAndCreditScreenTab !== null) {
            this.fileStatus = bankAndCreditScreenTab;
        } else {
            // this.fileStatus = 'BANK';
        }
        // this.storageService.sessionStorageSetter(
        //     'bankAndCreditScreenTab',
        //     this.fileStatus
        // );
        // if (this.userService.appData && this.userService.appData.userData && this.userService.appData.userData.companySelect && !this.customerCustList.length) {
        //     this.sharedService.general({
        //         'uuid': this.userService.appData.userData.companySelect.companyId,
        //     }).subscribe((response:any) => {
        //         const responseRest = (response) ? response['body'] : response;
        //         this.report856 = responseRest.report856;
        //     });
        //     this.companyGetCustomerList();
        // }
    }

    reloadData(saveFilter?: any) {
        // if (!this.logicTypeShow && this.accountsBarData.logicType === 'POPUP') {
        //     this.openTopMessage();
        // }
        if (this.fileStatus === 'BANK') {
            this.childDates.selectedRange
                .pipe(
                    filter(
                        () =>
                            Array.isArray(this.userService.appData.userData.accountSelect) &&
                            this.userService.appData.userData.accountSelect.length
                    ),
                    take(1)
                )
                .subscribe((rng) => this.filterDates(rng, saveFilter));
        } else if (this.fileStatus === 'CREDIT') {
            this.selectionSummary.reset();
            this.childCardsDates.selectedRange
                .pipe(
                    filter(() => {
                        const scltdCards = this.cardsSelector.selectedCards;
                        return Array.isArray(scltdCards) && scltdCards.length > 0;
                    }),
                    take(1)
                )
                .subscribe((rng) => this.filterDates(rng, saveFilter));
        } else if (this.fileStatus === 'BANK_MATCH') {
            this.accountsBar(true);
        }
        // if (!this.logicTypeShow) {
        //
        // } else {
        // }
    }

    open_logicType_again() {
        this.logicTypeShow = this.accountsBarData.logicType === 'POPUP';
        this.getDataTables();
    }

    startChild(): void {
        console.log('BankAndCreditComponent');
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.selectedCardRangeSub) {
            this.selectedCardRangeSub.unsubscribe();
        }
        // if (this.cardsListArrivedSub) {
        //     this.cardsListArrivedSub.unsubscribe();
        // }
        if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
            this.getExportFiles(true);
        }
        if (this.fileStatus === 'BANK_MATCH') {
            this.accountsBar();
        }
    }


    setBankAcc(acc: any): void {
        this.accountSelected = acc;
        setTimeout(() => {
            this.checkNavScroll();
        }, 600);
        this.getDataTables();
    }

    public thirdDateOpenItem(item, bool) {
        item.get('thirdDateOpen').patchValue(bool);
        item.thirdDateOpen = bool;
    }

    public openNote(note, $event, file) {
        const rect = $event.target.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        file.isBottom = window.innerHeight - (rect.top + scrollTop) < 140;
        // console.log('isBottom', file.isBottom);
        this.openNoteData = file;
        note.show($event);
    }

    nextScroll(elem: any, reschedule?: boolean) {
        const navData = this.navigationData(elem);
        this.scrollListToIndex(elem, navData.nextIndex, {
            inline:
                document.defaultView.getComputedStyle(elem as HTMLElement).direction ===
                'rtl'
                    ? 'start'
                    : 'end',
            block: 'center',
            behavior: 'smooth'
        });
        setTimeout(() => {
            this.checkNavScroll();
        }, 600);
        if (navData.nextIndex === (elem as HTMLElement).children.length - 1) {
            this.scrollRobotStop();
        } else if (reschedule === true) {
            this.scrollRobotStop();
            this.scrollRobot = setInterval(() => {
                this.nextScroll(elem);
            }, 800);
        }
    }

    scrollRobotStop(evt?: Event) {
        // if (evt) {
        //     console.log('%o ---- stopping robot ------------', (evt.target as HTMLElement).id);
        // }
        if (this.scrollRobot) {
            clearInterval(this.scrollRobot);
            this.scrollRobot = null;
        }
    }

    checkNavScroll() {
        if (this.navBanks) {
            const elem = this.navBanks.nativeElement;
            const browser = this.browserDetect.browserDetect.browser;
            this.nav.prev = false;
            this.nav.next = false;

            if (elem.scrollWidth <= elem.clientWidth) {
                console.log('Not have scroll');
                this.nav.prev = false;
                this.nav.next = false;
            } else {
                this.nav.prev = true;
                this.nav.next = true;
                if (
                    (browser === 'Edge' || browser === 'Chrome') &&
                    elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth + 15
                ) {
                    console.log('Edge Left');
                    this.nav.prev = true;
                    this.nav.next = false;
                }
                if (elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth) {
                    if (browser === 'Mozilla') {
                        console.log('Edge Left');
                        this.nav.prev = true;
                        this.nav.next = false;
                    }
                    if (browser === 'Chrome') {
                        console.log('Edge Right');
                        this.nav.prev = true;
                        this.nav.next = false;
                    }
                }

                if (elem.scrollWidth + Math.abs(elem.scrollLeft) === elem.clientWidth) {
                    if (browser === 'Firefox') {
                        console.log('Edge Left');
                        this.nav.prev = true;
                        this.nav.next = false;
                    }
                }

                if (Math.abs(elem.scrollLeft) === 0) {
                    if (browser === 'Mozilla' || browser === 'Edge') {
                        console.log('Edge Right');
                        this.nav.prev = false;
                        this.nav.next = true;
                    }
                    if (browser === 'Chrome') {
                        console.log('Edge Left');
                        this.nav.prev = false;
                        this.nav.next = true;
                    }
                    if (browser === 'Firefox') {
                        console.log('Edge Right');
                        this.nav.prev = false;
                        this.nav.next = true;
                    }
                }
            }
        }
    }

    prevScroll(elem: any, reschedule?: boolean) {
        const navData = this.navigationData(elem);
        this.scrollListToIndex(elem, navData.prevIndex, {
            inline:
                document.defaultView.getComputedStyle(elem as HTMLElement).direction ===
                'rtl'
                    ? 'end'
                    : 'start',
            block: 'center',
            behavior: 'smooth'
        });
        setTimeout(() => {
            this.checkNavScroll();
        }, 600);
        if (navData.prevIndex === 0) {
            this.scrollRobotStop();
        } else if (reschedule === true) {
            this.scrollRobotStop();
            this.scrollRobot = setInterval(() => {
                this.prevScroll(elem);
            }, 800);
        }
    }

    changeAcc(event): void {
        if (event) {
            // const bankAndCreditStatus = this.storageService.sessionStorageGetterItem('bankAndCreditStatus');
            // if (bankAndCreditStatus !== null) {
            //     this.fileStatus = bankAndCreditStatus;
            //     // this.storageService.sessionStorageRemoveItem('bankAndCreditStatus');
            // } else {
            //     //this.fileStatus = 'BANK';
            // }
            this.showFloatNav = false;
            this.queryString = '';
            this.filterInput.setValue('', {
                emitEvent: false,
                emitModelToViewChange: true,
                emitViewToModelChange: false
            });
            // this.filterInput = new FormControl();
            this.bankDetails = false;
            this.bankDetailsSave = false;
            this.filterLink = 'all';
            this.bankDetailsSave = false;
            this.companyFilesSortControl = new FormControl({
                orderBy: 'transDate',
                order: 'DESC'
            });
            this.statusArr = [];
            this.editArr = [];
            this.filterNote = null;
            this.filterTypesStatus = null;
            this.paymentDescArr = [];
            this.transTypeCodeArr = [];
            this.filterTransTypeCode = null;
            this.filterTypesPaymentDesc = null;
            this.hovaArr = [];
            this.filterTypesHova = null;
            this.selcetAllFiles = null;
            this.currentPage = 0;
            this.entryLimit = 50;
        } else {
            // const bankAndCreditStatus = this.storageService.sessionStorageGetterItem('bankAndCreditStatus');
            // if (bankAndCreditStatus !== null) {
            //     this.fileStatus = bankAndCreditStatus;
            //     // this.storageService.sessionStorageRemoveItem('bankAndCreditStatus');
            // }
        }
        const bankAndCreditScreenTab = this.storageService.sessionStorageGetterItem(
            'bankAndCreditScreenTab'
        );
        if (bankAndCreditScreenTab !== null) {
            this.fileStatus = bankAndCreditScreenTab;
        } else {
            // this.fileStatus = 'BANK';
        }
        // this.storageService.sessionStorageSetter(
        //     'bankAndCreditScreenTab',
        //     this.fileStatus
        // );

        this.loader = true;
        // this.storageService.sessionStorageSetter('bankAndCreditScreenTab', this.fileStatus);
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.selectedCardRangeSub) {
            this.selectedCardRangeSub.unsubscribe();
        }
        setTimeout(() => {
            try {
                if (this.fileStatus === 'BANK' && this.childDates) {
                    this.selectedRangeSub = this.childDates.selectedRange
                        .pipe(
                            filter(
                                () =>
                                    Array.isArray(
                                        this.userService.appData.userData.accountSelect
                                    ) && this.userService.appData.userData.accountSelect.length
                            )
                        )
                        .subscribe((rng) => this.filterDates(rng));
                } else if (this.fileStatus === 'CREDIT' && this.childCardsDates) {
                    this.selectionSummary.reset();
                    this.selectedCardRangeSub = this.childCardsDates.selectedRange
                        .pipe(
                            filter(() => {
                                const scltdCards = this.cardsSelector.selectedCards;
                                return Array.isArray(scltdCards) && scltdCards.length > 0;
                            })
                        )
                        .subscribe((rng) => this.filterDates(rng));
                } else if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
                    this.getExportFiles(true);
                }
            } catch (e) {
            }
        }, 10);
    }

    downloadFiles(param: any) {
        this[param] = false;
        if (this.docsfile) {
            const a = document.createElement('a');
            a.target = '_parent';
            a.href =
                param === 'enabledDownloadLink_docfile'
                    ? this.docsfile.docfile
                    : this.docsfile.paramsfile;
            (document.body || document.documentElement).appendChild(a);
            a.click();
            a.parentNode.removeChild(a);
        } else {
            this.enabledDownloadLink = false;
            this.sharedService
                .exportFileManualDownload(this.ocrExportFileId)
                .pipe(
                    map((response: any) =>
                        response && !response.error ? response.body : null
                    ),
                    first()
                )
                .subscribe(
                    {
                        next: (docfile) => {
                            this.enabledDownloadLink = true;
                            if (docfile) {
                                this.docsfile = docfile;
                                const a = document.createElement('a');
                                a.target = '_parent';
                                a.href =
                                    param === 'enabledDownloadLink_docfile'
                                        ? this.docsfile.docfile
                                        : this.docsfile.paramsfile;
                                (document.body || document.documentElement).appendChild(a);
                                a.click();
                                a.parentNode.removeChild(a);
                            }
                        },
                        error: (err: HttpErrorResponse) => {
                            this.responseRestPath = true;
                            this.showModalCheckFolderFile = 'ERROR';
                            if (err.error instanceof Error) {
                                console.log('An error occurred:', err.error.message);
                            } else {
                                console.log(
                                    `Backend returned code ${err.status}, body was: ${err.error}`
                                );
                            }
                        }
                    }
                );
        }
    }

    public setCustIdReceipt() {
        this.arrReceipt.controls.forEach((value, idx) => {
            if (idx > 0) {
                value.patchValue({
                    custId: this.arrReceipt.controls[0].get('custId').value
                });
            }
        });
    }

    checkImageSourceFrom(checkData): any {
        if (checkData.image) {
            return this.sanitizer.bypassSecurityTrustUrl(
                'data:image/jpg;base64,' + checkData.image
            );
        }
        // if (checkData.chequeBankNumber) {
        //     return `/assets/images/bank${checkData.chequeBankNumber}.png`;
        // }
        return '';
    }

    getCustName(custId: any) {
        if (custId && this.customerCustList && this.customerCustList.length) {
            const getCust = this.customerCustList.find(
                (cust) => cust.custId === custId
            );
            if (getCust && getCust.lName) {
                return getCust.lName;
            }
        }
        return null;
    }

    public selectCustCard(i: number) {
        if (
            this.report856 &&
            this.rowToSplit.hova &&
            this.arrReceipt.controls[i].get('paymentCustId').value &&
            (this.arrReceipt.controls[i].get('paymentCustId').value
                    .hashCartisCodeId === 2 ||
                this.arrReceipt.controls[i].get('paymentCustId').value
                    .hashCartisCodeId === 25)
        ) {
            this.arrReceipt.controls[i].patchValue({
                show_taxDeductionCustId: true
            });
        }
        if (i === 0 && !this.rowToSplit.custId && !this.getJournalHistoryData) {
            this.getJournalHistoryData = true;
            // let taxDeductionCustId = this.userService.appData.userData.companyCustomerDetails ? (
            //     (this.rowToSplit.hova && this.report856) ? this.userService.appData.userData.companyCustomerDetails.supplierTaxDeduction : this.userService.appData.userData.companyCustomerDetails.customerTaxDeduction
            // ) : null;
            // if (taxDeductionCustId) {
            //     taxDeductionCustId = taxDeductionCustId.custId;
            // }
            const taxDeductionCustId = null;
            this.ocrService
                .journalHistory({
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    custId: this.arrReceipt.controls[0].get('paymentCustId').value.custId,
                    receipt: true
                })
                .subscribe((res) => {
                    this.getJournalHistory = res ? res['body'] : res;
                    if (this.getJournalHistory && this.getJournalHistory.length) {
                        this.getJournalHistory.forEach((item) => {
                            // "asmachta1": "string",
                            //     "asmachta2": "string",
                            //     "asmachta3": "string",
                            //     "batchNum": 0,
                            //     "cartisMaam": "string",
                            //     "cust": "string",
                            //     "details": "string",
                            //     "maamPrc": "string",
                            //     "matahAmount": 0,
                            //     "misparTnua": 0,
                            //     "ocrFileId": "string",
                            //     "oppositCust": "string",
                            //     "paymentDate": "2018-07-03T00:00:00",
                            //     "paymentNikui": 0,
                            //     "referenceDate": "2018-07-03T00:00:00",
                            //     "taxDeductionCustId": "string",
                            //     "totalBeforeMaam": 0,
                            //     "totalIncludeMaam": 0,
                            //     "totalMaam": 0

                            let cust =
                                item.cust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === item.cust
                                    )
                                    : null;
                            if (
                                !cust &&
                                item.cust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                cust = {
                                    cartisName: item.cust,
                                    cartisCodeId: null,
                                    custId: item.cust,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    cust
                                );
                            }
                            item.cust = cust;

                            // if (item.cust) {
                            //     item.cust = {
                            //         custId: item.cust.custId,
                            //         lName: item.cust.custLastName,
                            //         hp: item.cust.oseknums && item.cust.oseknums.length ? item.cust.oseknums[0] : null,
                            //         id: item.cust.palCode
                            //     };
                            // } else {
                            //     item.cust = null;
                            // }

                            let taxDeductionCustIdVal =
                                (item.taxDeductionCustId || taxDeductionCustId) &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) =>
                                            custIdxRec.custId ===
                                            (item.taxDeductionCustId || taxDeductionCustId)
                                    )
                                    : null;
                            if (
                                !taxDeductionCustIdVal &&
                                (item.taxDeductionCustId || taxDeductionCustId) &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                taxDeductionCustIdVal = {
                                    cartisName: item.taxDeductionCustId || taxDeductionCustId,
                                    cartisCodeId: null,
                                    custId: item.taxDeductionCustId || taxDeductionCustId,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    taxDeductionCustIdVal
                                );
                            }
                            item.taxDeductionCustId = taxDeductionCustIdVal;
                            // if (item.taxDeductionCustId) {
                            //     item.taxDeductionCustId = {
                            //         custId: item.taxDeductionCustId.custId,
                            //         lName: item.taxDeductionCustId.custLastName,
                            //         hp: item.taxDeductionCustId.oseknums && item.taxDeductionCustId.oseknums.length ? item.taxDeductionCustId.oseknums[0] : null,
                            //         id: item.taxDeductionCustId.palCode
                            //     };
                            // } else {
                            //     item.taxDeductionCustId = null;
                            // }

                            let oppositCust =
                                item.oppositCust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === item.oppositCust
                                    )
                                    : null;
                            if (
                                !oppositCust &&
                                item.oppositCust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                oppositCust = {
                                    cartisName: item.oppositCust,
                                    cartisCodeId: null,
                                    custId: item.oppositCust,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    oppositCust
                                );
                            }
                            item.oppositCust = oppositCust;
                            // if (item.oppositCust) {
                            //     item.oppositCust = {
                            //         custId: item.oppositCust.custId,
                            //         lName: item.oppositCust.custLastName,
                            //         hp: item.oppositCust.oseknums && item.oppositCust.oseknums.length ? item.oppositCust.oseknums[0] : null,
                            //         id: item.oppositCust.palCode
                            //     };
                            // } else {
                            //     item.oppositCust = null;
                            // }
                        });
                    }
                });
        }
    }

    updateCheckedTranses(row: any): void {
        this.sharedService
            .updateCheckedTranses({
                paymentId: row.paymentId,
                paymentType: row.paymentType
            })
            .subscribe((res) => {
                const originRow =
                    this.fileStatus === 'BANK'
                        ? this.bankDetailsSave.find(
                            (item) => item.paymentId === row.paymentId
                        )
                        : this.cardDetailsSave.find(
                            (item) => item.ccardTransId === row.ccardTransId
                        );
                originRow.status = 'CHECKED';
                if (this.fileStatus === 'BANK') {
                    this.bankDetails = false;
                } else {
                    this.cardDetails = false;
                }
                this.selcetAllFiles = false;
                this.filtersAll(undefined, true, true);
            });
    }

    scrollById(fileIdToScroll) {
        const isExistFileId = this.cashflowMatch.findIndex(
            (fd) => fd['paymentId'] + '_' + fd['paymentType'] === fileIdToScroll
        );
        if (isExistFileId !== -1 && this.virtualScrollSaved) {
            requestAnimationFrame(() => {
                this.virtualScrollSaved.scrollToIndex(isExistFileId);
            });
            // setTimeout(() => {
            //   requestAnimationFrame(() => {
            //     this.runTimerScroll(
            //       this._rowForScroll.toArray().length - 1,
            //       fileIdToScroll
            //     );
            //   });
            // }, 100);
        }
    }

    runTimerScroll(idx, fileIdToScroll) {
        const lastObj = this.cashflowMatch[this.cashflowMatch.length - 1];
        const lastId = lastObj['paymentId'] + '_' + lastObj['paymentType'];
        this.subscriptionTime2 = timer(10, 100).subscribe((val) => {
            const idExist = this._rowForScroll
                .toArray()
                .findIndex((it) => it.nativeElement.id === fileIdToScroll);
            const idLastExist = this._rowForScroll
                .toArray()
                .findIndex((it) => it.nativeElement.id === lastId);
            if (idExist === -1) {
                if (idLastExist === -1) {
                    requestAnimationFrame(() => {
                        if (
                            this._rowForScroll.toArray()[idx] &&
                            this._rowForScroll.toArray()[idx].nativeElement
                        ) {
                            this._rowForScroll.toArray()[idx].nativeElement.scrollIntoView({
                                block: 'start',
                                inline: 'center',
                                behavior: 'instant'
                            });
                        }
                    });
                } else {
                    requestAnimationFrame(() => {
                        if (
                            this._rowForScroll.toArray()[idLastExist] &&
                            this._rowForScroll.toArray()[idLastExist].nativeElement
                        ) {
                            this._rowForScroll
                                .toArray()
                                [idLastExist].nativeElement.scrollIntoView({
                                block: 'start',
                                inline: 'center',
                                behavior: 'smooth'
                            });
                        }
                    });
                    this.subscriptionTime2.unsubscribe();
                }
            } else {
                requestAnimationFrame(() => {
                    if (
                        this._rowForScroll.toArray()[idExist] &&
                        this._rowForScroll.toArray()[idExist].nativeElement
                    ) {
                        this._rowForScroll.toArray()[idExist].nativeElement.scrollIntoView({
                            block: 'start',
                            inline: 'center',
                            behavior: 'smooth'
                        });
                    }
                });
                this.subscriptionTime2.unsubscribe();
            }
        });
    }

    setTaxDeductionCustIdReceipt(i: number) {
        if (i === 0) {
            const taxDeductionCustId =
                this.arrReceipt.controls[i].get('taxDeductionCustId').value;
            if (taxDeductionCustId) {
                this.arrReceipt.controls[i].get('paymentTotal').enable();
            } else {
                this.arrReceipt.controls[i].get('paymentTotal').disable();
            }
        }
    }

    public calcDisabledPaymentTotal(indexRow: number) {
        if (indexRow === 0) {
            const row_taxDeductionCustId_Exist =
                this.arrReceipt.controls[indexRow].get('show_taxDeductionCustId')
                    .value === true;
            if (
                row_taxDeductionCustId_Exist &&
                this.arrReceipt.controls[indexRow].get('taxDeductionCustId').value
            ) {
                this.arrReceipt.controls[indexRow].get('paymentTotal').enable();
            } else {
                this.arrReceipt.controls[indexRow].get('paymentTotal').disable();
            }
        }
    }

    aaa(item: any) {
        console.log(item);
    }

    editReceipt(row: any): void {
        // asmachta: "8903335"
        // bankTransId: "b9f86362-e483-0af2-e053-0b6519ac35be"
        // biziboxMutavId: null
        // companyAccountId: "acbd7a9c-32f8-6c47-e053-0b6519ac4bf8"
        // custId: null
        // custPopUp: true
        // fileId: null
        // hova: false
        // linkId: null
        // loanId: null
        // mainDesc: "זיכוי שוברים ויזה 08903335"
        // paymentDesc: "Slika"
        // paymentId: "b9f86362-e483-0af2-e053-0b6519ac35be"
        // paymentType: "BANK_TRANS"
        // pictureLink: null
        // searchkeyId: "62d232f2-da98-1d89-e053-0b6519aca347"
        // secDesc: null
        // splitArray: null
        // status: "EMPTY"
        // taxDeduction: null
        // total: 58.52
        // transDate: 1611698400000
        this.activeDD =
            this.fileStatus === 'BANK' ? row.paymentId : row.ccardTransId;

        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === row.companyAccountId
        );

        if (
            row.pictureLink ||
            (row.splitArrayBase && row.splitArrayBase.paymentDesc === 'Checks')
        ) {
            const params = {
                pictureLink: row.pictureLink,
                companyAccountId: row.companyAccountId,
                folderName: [
                    trnsAcc.bankId,
                    trnsAcc.bankSnifId,
                    trnsAcc.bankAccountId
                ].join(''),
                bankTransId: row.bankTransId
                    ? row.bankTransId
                    : row.transId
                        ? row.transId
                        : row['chequePaymentId']
                            ? row['chequePaymentId']
                            : null,
                journal: true
            };
            if (row.splitArrayBase) {
                params['chequePicId'] = row['chequePicId'];
            }
            this.restCommonService.getCheckDetail(params).subscribe((res) => {
                this.additionalDetails = res.body;
            });
        } else if (!row.unionId && row.linkId) {
            const params = {
                bankTransId: row.bankTransId || row.transId,
                linkId: row.linkId,
                companyAccountId: row.companyAccountId,
                journal: true
            };
            if (row.splitArrayBase) {
                params['bankdetailId'] = row['bankdetailId'];
            }
            zip(
                this.restCommonService.getPerutBankdetail(params),
                this.transTypesService.selectedCompanyTransTypes
            ).subscribe(([rslt, categories]: any) => {
                const adtnlsArr = rslt && !rslt.error ? rslt['body'] : null;
                if (Array.isArray(adtnlsArr) && adtnlsArr.length > 1) {
                    adtnlsArr.forEach(
                        (rows) =>
                            (rows.transType = rows.transTypeId
                                ? (rows.transType = categories.find(
                                    (cat) => cat.transTypeId === rows.transTypeId
                                ))
                                : null)
                    );
                }
                if (Array.isArray(adtnlsArr)) {
                    adtnlsArr
                        .filter((adtnl) => adtnl.detailstransfer)
                        .forEach((adtnl) => {
                            if (adtnl.detailstransfer.startsWith('{')) {
                                try {
                                    const detailstransferJson = JSON.parse(adtnl.detailstransfer);
                                    adtnl.detailsContentType = 'json';
                                    adtnl.detailstransfer = Object.entries(
                                        detailstransferJson
                                    ).map((keyvalArr) => {
                                        return {
                                            key: keyvalArr[0],
                                            value: keyvalArr[1]
                                        };
                                    });
                                } catch (e) {
                                }
                            }

                            if (
                                !('detailsContentType' in adtnl) &&
                                adtnl.detailstransfer.startsWith('<')
                            ) {
                                adtnl.detailstransfer = this.sanitizer.bypassSecurityTrustHtml(
                                    adtnl.detailstransfer
                                );
                                adtnl.detailsContentType = 'html';
                            }
                        });
                }
                this.containerWidth =
                    Array.isArray(adtnlsArr) && adtnlsArr.length > 1 ? 535 + 128 : 660;
                this.containerHeight = 260;
                if (!adtnlsArr || adtnlsArr.length === 0) {
                    this.transactionAdditionalDetailsSum = 0;
                    this.containerHeight = 120;
                } else {
                    this.transactionAdditionalDetailsSum = adtnlsArr[0].hasOwnProperty(
                        'transfertotal'
                    )
                        ? adtnlsArr.reduceRight((acc, item) => acc + item.transfertotal, 0)
                        : adtnlsArr.reduceRight((acc, item) => acc + item.chequeTotal, 0);

                    this.containerHeight =
                        'detailsContentType' in adtnlsArr[0] ||
                        (adtnlsArr[0].detailstransfer &&
                            adtnlsArr[0].detailstransfer.length > 200)
                            ? 470
                            : adtnlsArr.length > 1
                                ? 360
                                : 260;
                }

                this.additionalDetails = adtnlsArr;
            });
        }

        this.rowToSplit = row;

        if (this.bankProcessTransType) {
            this.rowToSplit.transTypeDefinedArr = JSON.parse(
                JSON.stringify(row.transTypeDefinedArr)
            ).filter((it) => it.value);
        }

        this.receipt = null;
        this.getJournalHistory = null;
        this.showDocumentListStorageDataFired = false;
        this.getJournalHistoryData = false;
        this.editReceiptModalShow = true;
        this.showDocumentListStorageDataFiredRece = false;
        // let taxDeductionCustId = this.userService.appData.userData.companyCustomerDetails
        //     ? ((this.rowToSplit.hova && this.report856) ?
        //         this.userService.appData.userData.companyCustomerDetails.supplierTaxDeduction
        //         : this.userService.appData.userData.companyCustomerDetails.customerTaxDeduction)
        //     : null;
        // if (taxDeductionCustId) {
        //     taxDeductionCustId = taxDeductionCustId.custId;
        // }
        const taxDeductionCustId = null;

        this.sharedService
            .getJournalTrans({
                paymentId: row.paymentId,
                paymentType: row.paymentType
            })
            .subscribe((res) => {
                const getJourForFileArr = res ? res['body'] : res;
                this.showTaxDeduction =
                    getJourForFileArr.showTaxDeduction !== undefined
                        ? getJourForFileArr.showTaxDeduction
                        : false;
                // "showTaxDeduction": true,
                //     "rows":[{
                // const getJourForFileArr = [
                //     {
                //         'asmachta': '3255235',
                //         'childId': 'string',
                //         'custId': '1154',
                //         'dateValue': this.userService.appData.moment(1609579024694).toDate(),
                //         'details': 'string',
                //         'invoiceDate': this.userService.appData.moment(1609579024694).toDate(),
                //         'paymentAsmachta': '265678',
                //         'paymentCustId': '2390',
                //         'paymentNikui': 2340,
                //         'paymentTotal': 120,
                //         'taxDeductionCustId': '7028',
                //         'total': 340
                //     }
                // ];
                // "childId": "f464e188-2e5b-42bf-b3df-2400510d95a1",
                //     "invoiceDate": 1583964000000,
                //     "custId": "11",
                //     "total": 1149.00,
                //     "asmachta": "81500131979",
                //     "dateValue": 1584568800000,
                //     "paymentCustId": null,
                //     "paymentTotal": null,
                //     "taxDeductionCustId": "10630",
                //     "paymentNikui": null,
                //     "details": null,
                //     "paymentAsmachta": null

                if (
                    getJourForFileArr &&
                    getJourForFileArr.rows &&
                    getJourForFileArr.rows.length
                ) {
                    const sumsOfParent = getJourForFileArr.rows.reduce(
                        (total, item, currentIndex) => {
                            return [
                                total[0] + Number(item.total),
                                total[1] + Number(item.paymentNikui),
                                total[2] + Number(item.paymentTotal)
                            ];
                        },
                        [0, 0, 0]
                    );

                    this.saverValuesReceipt = {
                        total: sumsOfParent[1] + sumsOfParent[2],
                        paymentNikui: sumsOfParent[1],
                        paymentTotal: sumsOfParent[2]
                    };

                    this.receipt = this.fb.group({
                        name: 'receiptFormGr',
                        arr: this.fb.array(
                            getJourForFileArr.rows.map((item, idx) => {
                                // if (!this.cupaAllTheOptions_paymentCustId &&
                                //     (
                                //         !this.userService.appData.userData.companyCustomerDetails.cupa ||
                                //         (this.userService.appData.userData.companyCustomerDetails.cupa && !this.userService.appData.userData.companyCustomerDetails.cupa.find(custIdxRec => custIdxRec.custId === item.paymentCustId))
                                //     )
                                //     && this.userService.appData.userData.companyCustomerDetails.all.find(custIdxRec => custIdxRec.custId === item.paymentCustId)) {
                                //     this.cupaAllTheOptions_paymentCustId = true;
                                // }

                                let custId =
                                    item.custId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                            (custIdxRec) => custIdxRec.custId === item.custId
                                        )
                                        : null;
                                if (
                                    !custId &&
                                    item.custId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                ) {
                                    custId = {
                                        cartisName: item.custId,
                                        cartisCodeId: null,
                                        custId: item.custId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                        custId
                                    );
                                }
                                let paymentCustId =
                                    item.paymentCustId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                            (custIdxRec) => custIdxRec.custId === item.paymentCustId
                                        )
                                        : null;
                                if (
                                    !paymentCustId &&
                                    item.paymentCustId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                ) {
                                    paymentCustId = {
                                        cartisName: item.paymentCustId,
                                        cartisCodeId: null,
                                        custId: item.paymentCustId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                        paymentCustId
                                    );
                                }
                                let taxDeductionCustId =
                                    item.taxDeductionCustId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                            (custIdxRec) =>
                                                custIdxRec.custId === item.taxDeductionCustId
                                        )
                                        : null;
                                if (
                                    !taxDeductionCustId &&
                                    item.taxDeductionCustId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                ) {
                                    taxDeductionCustId = {
                                        cartisName: item.taxDeductionCustId,
                                        cartisCodeId: null,
                                        custId: item.taxDeductionCustId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                        taxDeductionCustId
                                    );
                                }
                                const paymentCustIdSaved = paymentCustId;
                                const taxDeductionCustIdSaved = taxDeductionCustId;

                                let disabled_paymentCustId = false;
                                let disabled_taxDeductionCustId = false;
                                if (this.bankProcessTransType) {
                                    if (
                                        item.transTypeCode &&
                                        this.rowToSplit.transTypeDefinedArr.length
                                    ) {
                                        const transTypeCodeObj =
                                            this.rowToSplit.transTypeDefinedArr.find(
                                                (it) => it.value === item.transTypeCode
                                            );
                                        if (transTypeCodeObj) {
                                            if (
                                                transTypeCodeObj.custId &&
                                                transTypeCodeObj.custId !== '?' &&
                                                transTypeCodeObj.custId !== '*'
                                            ) {
                                                paymentCustId =
                                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                                        (custIdxRec) =>
                                                            custIdxRec.custId === transTypeCodeObj.custId
                                                    );
                                                if (!paymentCustId) {
                                                    paymentCustId = {
                                                        cartisName: transTypeCodeObj.paymentCustId,
                                                        cartisCodeId: null,
                                                        custId: transTypeCodeObj.paymentCustId,
                                                        lName: null,
                                                        hp: null,
                                                        id: null,
                                                        pettyCash: false,
                                                        supplierTaxDeduction: null,
                                                        customerTaxDeduction: null
                                                    };
                                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                                        paymentCustId
                                                    );
                                                }
                                                disabled_paymentCustId = true;
                                            }
                                            if (
                                                transTypeCodeObj.taxDeductionCustId &&
                                                transTypeCodeObj.taxDeductionCustId !== '?' &&
                                                transTypeCodeObj.taxDeductionCustId !== '*'
                                            ) {
                                                taxDeductionCustId =
                                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                                        (custIdxRec) =>
                                                            custIdxRec.custId ===
                                                            transTypeCodeObj.taxDeductionCustId
                                                    );
                                                if (!taxDeductionCustId) {
                                                    taxDeductionCustId = {
                                                        cartisName: transTypeCodeObj.taxDeductionCustId,
                                                        cartisCodeId: null,
                                                        custId: transTypeCodeObj.taxDeductionCustId,
                                                        lName: null,
                                                        hp: null,
                                                        id: null,
                                                        pettyCash: false,
                                                        supplierTaxDeduction: null,
                                                        customerTaxDeduction: null
                                                    };
                                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                                        taxDeductionCustId
                                                    );
                                                }
                                                disabled_taxDeductionCustId = true;
                                            }
                                        }
                                    }
                                }
                                const transTypeDefinedArr = this.bankProcessTransType
                                    ? this.addPriemerObject(
                                        JSON.parse(
                                            JSON.stringify(this.rowToSplit.transTypeDefinedArr)
                                        ),
                                        item.transTypeCode
                                    )
                                    : [];
                                const show_taxDeductionCustId =
                                    this.bankProcessTransType &&
                                    !item.showTaxDeduction &&
                                    disabled_taxDeductionCustId
                                        ? true
                                        : this.report856 &&
                                        this.rowToSplit.hova &&
                                        paymentCustId &&
                                        (paymentCustId.hashCartisCodeId === 2 ||
                                            paymentCustId.hashCartisCodeId === 25)
                                            ? true
                                            : item.showTaxDeduction;
                                return this.fb.group({
                                    transTypeDefinedArr: this.fb.array(transTypeDefinedArr),
                                    showTaxDeduction: item.showTaxDeduction,
                                    show_taxDeductionCustId: show_taxDeductionCustId,
                                    paymentCustIdSaved: paymentCustIdSaved,
                                    taxDeductionCustIdSaved: taxDeductionCustIdSaved,
                                    newRow: false,
                                    thirdDateOpen: item.thirdDateOpen,
                                    invoiceDate: this.fb.control({
                                        value: item.invoiceDate
                                            ? this.userService.appData
                                                .moment(item.invoiceDate)
                                                .toDate()
                                            : null,
                                        disabled: true
                                    }),
                                    transTypeCode: this.fb.control({
                                        value: this.bankProcessTransType
                                            ? item.transTypeCode
                                            : null,
                                        disabled: false
                                    }),
                                    dateValue: this.fb.control({
                                        value: item.dateValue
                                            ? this.userService.appData.moment(item.dateValue).toDate()
                                            : null,
                                        disabled: false
                                    }),
                                    thirdDate: this.fb.control({
                                        value: item.thirdDate
                                            ? this.userService.appData.moment(item.thirdDate).toDate()
                                            : null,
                                        disabled: false
                                    }),
                                    custId: this.fb.control(
                                        {
                                            //כרטיס ספק/לקוח
                                            value: custId,
                                            disabled: true //idx !== 0
                                        },
                                        [Validators.required]
                                    ),
                                    total: this.fb.control(
                                        {
                                            value: idx === 0 ? item.total : item.paymentTotal,
                                            disabled: idx === 0
                                        },
                                        [Validators.required]
                                    ),
                                    paymentTotal: this.fb.control(
                                        {
                                            value: item.paymentTotal,
                                            disabled:
                                                idx === 0 &&
                                                (!taxDeductionCustId || !item.showTaxDeduction)
                                        },
                                        [Validators.required]
                                    ),
                                    paymentNikui: this.fb.control(
                                        {
                                            value: item.paymentNikui,
                                            disabled: false
                                        },
                                        [Validators.required]
                                    ),
                                    paymentCustId: this.fb.control(
                                        {
                                            //כרטיס קופה
                                            value: paymentCustId,
                                            disabled: disabled_paymentCustId
                                        },
                                        [Validators.required]
                                    ),
                                    taxDeductionCustId: this.fb.control(
                                        {
                                            //כרטיס ניכוי מס
                                            value: taxDeductionCustId,
                                            disabled: disabled_taxDeductionCustId //false
                                        },
                                        [Validators.required]
                                    ),
                                    asmachta: this.fb.control({
                                        value: item.asmachta,
                                        disabled: true
                                    }),
                                    paymentAsmachta: this.fb.control({
                                        value: item.paymentAsmachta,
                                        disabled: false
                                    }),
                                    asmachta3: this.fb.control({
                                        value: item.asmachta3,
                                        disabled: false
                                    }),
                                    details: this.fb.control({
                                        value: item.details,
                                        disabled: false
                                    })
                                });
                            })
                        )
                    });

                    // this.arrReceipt.controls.forEach(control => {
                    //     const propertyValues = Object.values(control['controls']);
                    //
                    //
                    //     debugger
                    //     propertyValues.valueChanges
                    //         .pipe(
                    //             debounceTime(300),
                    //             distinctUntilChanged(),
                    //             pairwise()
                    //         )
                    //         .subscribe(input => {
                    //             console.log('input', input);
                    //         });
                    // });

                    this.calcReceipt();
                } else {
                    this.receipt = this.fb.group({
                        name: 'receiptFormGr',
                        arr: this.fb.array([])
                    });
                }
                // "asmachta": "string",
                //     "childId": "string",
                //     "custId": "string",
                //     "dateValue": "2018-07-03T00:00:00",
                //     "details": "string",
                //     "invoiceDate": "2018-07-03T00:00:00",
                //     "paymentAsmachta": "string",
                //     "paymentCustId": "string",
                //     "paymentNikui": 0,
                //     "paymentTotal": 0,
                //     "taxDeductionCustId": "string",
                //     "total": 0
            });

        if (this.rowToSplit.custId) {
            this.getJournalHistoryData = true;
            this.ocrService
                .journalHistory({
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    custId: this.rowToSplit.custId,
                    receipt: true
                })
                .subscribe((res) => {
                    this.getJournalHistory = res ? res['body'] : res;
                    if (this.getJournalHistory && this.getJournalHistory.length) {
                        this.getJournalHistory.forEach((item) => {
                            // "asmachta1": "string",
                            //     "asmachta2": "string",
                            //     "asmachta3": "string",
                            //     "batchNum": 0,
                            //     "cartisMaam": "string",
                            //     "cust": "string",
                            //     "details": "string",
                            //     "maamPrc": "string",
                            //     "matahAmount": 0,
                            //     "misparTnua": 0,
                            //     "ocrFileId": "string",
                            //     "oppositCust": "string",
                            //     "paymentDate": "2018-07-03T00:00:00",
                            //     "paymentNikui": 0,
                            //     "referenceDate": "2018-07-03T00:00:00",
                            //     "taxDeductionCustId": "string",
                            //     "totalBeforeMaam": 0,
                            //     "totalIncludeMaam": 0,
                            //     "totalMaam": 0

                            let cust =
                                item.cust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === item.cust
                                    )
                                    : null;
                            if (
                                !cust &&
                                item.cust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                cust = {
                                    cartisName: item.cust,
                                    cartisCodeId: null,
                                    custId: item.cust,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    cust
                                );
                            }

                            item.cust = cust;

                            // if (item.cust) {
                            //     item.cust = {
                            //         custId: item.cust.custId,
                            //         lName: item.cust.custLastName,
                            //         hp: item.cust.oseknums && item.cust.oseknums.length ? item.cust.oseknums[0] : null,
                            //         id: item.cust.palCode
                            //     };
                            // } else {
                            //     item.cust = null;
                            // }

                            let taxDeductionCustIdVal =
                                item.taxDeductionCustId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) =>
                                            custIdxRec.custId === item.taxDeductionCustId
                                    )
                                    : null;
                            if (
                                !taxDeductionCustIdVal &&
                                item.taxDeductionCustId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                taxDeductionCustIdVal = {
                                    cartisName: item.taxDeductionCustId,
                                    cartisCodeId: null,
                                    custId: item.taxDeductionCustId,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    taxDeductionCustIdVal
                                );
                            }
                            item.taxDeductionCustId = taxDeductionCustIdVal;

                            // if (item.taxDeductionCustId) {
                            //     item.taxDeductionCustId = {
                            //         custId: item.taxDeductionCustId.custId,
                            //         lName: item.taxDeductionCustId.custLastName,
                            //         hp: item.taxDeductionCustId.oseknums && item.taxDeductionCustId.oseknums.length ? item.taxDeductionCustId.oseknums[0] : null,
                            //         id: item.taxDeductionCustId.palCode
                            //     };
                            // } else {
                            //     item.taxDeductionCustId = null;
                            // }
                            let oppositCust =
                                item.oppositCust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === item.oppositCust
                                    )
                                    : null;
                            if (
                                !oppositCust &&
                                item.oppositCust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                oppositCust = {
                                    cartisName: item.oppositCust,
                                    cartisCodeId: null,
                                    custId: item.oppositCust,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    oppositCust
                                );
                            }
                            item.oppositCust = oppositCust;
                            // if (item.oppositCust) {
                            //     item.oppositCust = {
                            //         custId: item.oppositCust.custId,
                            //         lName: item.oppositCust.custLastName,
                            //         hp: item.oppositCust.oseknums && item.oppositCust.oseknums.length ? item.oppositCust.oseknums[0] : null,
                            //         id: item.oppositCust.palCode
                            //     };
                            // } else {
                            //     item.oppositCust = null;
                            // }
                        });
                    }
                });
        } else {
            this.getJournalHistory = [];
        }
    }

    isSamePayment() {
        if (
            this.receipt &&
            this.arrReceipt &&
            this.arrReceipt.controls.length > 1
        ) {
            const mainPaymentCustId =
                this.arrReceipt.controls[0].get('paymentCustId').value;
            const someNorEq = this.arrReceipt.controls.some((item, index) => {
                if (index !== 0) {
                    const valFirstRow =
                        !mainPaymentCustId ||
                        (mainPaymentCustId && mainPaymentCustId.custId);
                    const rowPayment =
                        this.arrReceipt.controls[index].get('paymentCustId').value;
                    const valOfRow = !rowPayment || (rowPayment && rowPayment.custId);
                    return valFirstRow !== valOfRow;
                } else {
                    return false;
                }
            });
            return !someNorEq;
        } else {
            return true;
        }
    }

    addReceipt() {
        const obj = {
            transTypeDefinedArr: this.fb.array(
                this.bankProcessTransType
                    ? this.addPriemerObject(
                        JSON.parse(JSON.stringify(this.rowToSplit.transTypeDefinedArr)),
                        false
                    )
                    : []
            ),
            showTaxDeduction: false,
            show_taxDeductionCustId: false,
            paymentCustIdSaved: null,
            taxDeductionCustIdSaved: null,
            thirdDateOpen: false,
            newRow: true,
            invoiceDate: this.fb.control({
                value: this.arrReceipt.controls[0].get('invoiceDate').value,
                disabled: true
            }),
            transTypeCode: this.fb.control({
                value: null,
                disabled: false
            }),
            dateValue: this.fb.control({
                value: this.arrReceipt.controls[0].get('dateValue').value,
                disabled: false
            }),
            thirdDate: this.fb.control({
                value: this.arrReceipt.controls[0].get('thirdDate').value,
                disabled: false
            }),
            custId: this.fb.control({
                //כרטיס ספק/לקוח
                value: this.arrReceipt.controls[0].get('custId').value,
                disabled: true
            }),
            paymentCustId: this.fb.control(
                {
                    //כרטיס קופה
                    value: null,
                    disabled: false
                },
                [Validators.required]
            ),
            total: this.fb.control(
                {
                    value: 0,
                    disabled: false
                },
                [Validators.required]
            ),
            paymentTotal: this.fb.control(
                {
                    value: 0,
                    disabled: false
                },
                [Validators.required]
            ),
            paymentNikui: this.fb.control(
                {
                    value: null,
                    disabled: false
                },
                [Validators.required]
            ),
            taxDeductionCustId: this.fb.control(
                {
                    //כרטיס ניכוי מס
                    value: this.arrReceipt.controls[0].get('taxDeductionCustId').value,
                    disabled: false
                },
                [Validators.required]
            ),
            asmachta: this.fb.control({
                value: this.arrReceipt.controls[0].get('asmachta').value,
                disabled: true
            }),
            paymentAsmachta: this.fb.control({
                value: null,
                disabled: false
            }),
            asmachta3: this.fb.control({
                value: null,
                disabled: false
            }),
            details: this.fb.control({
                value: this.arrReceipt.controls[0].get('details').value,
                disabled: false
            })
        };
        this.arrReceipt.push(this.fb.group(obj));
    }

    removeReceipt(index: number) {
        this.arrReceipt.controls[index - 1].patchValue({
            total:
                toFixedNumber(
                    Number(this.arrReceipt.controls[index - 1].get('total').value)
                ) +
                toFixedNumber(
                    Number(this.arrReceipt.controls[index].get('total').value)
                ),
            paymentTotal:
                toFixedNumber(
                    Number(this.arrReceipt.controls[index - 1].get('paymentTotal').value)
                ) +
                toFixedNumber(
                    Number(this.arrReceipt.controls[index].get('paymentTotal').value)
                ),
            paymentNikui:
                toFixedNumber(
                    Number(this.arrReceipt.controls[index - 1].get('paymentNikui').value)
                ) +
                toFixedNumber(
                    Number(this.arrReceipt.controls[index].get('paymentNikui').value)
                )
        });
        this.arrReceipt.removeAt(index);
        this.arrReceipt.updateValueAndValidity();

        // if (this.arrReceipt.controls.length > 1) {
        //     this.arrReceipt.controls[0].get('custId').disable();
        // } else {
        //     this.arrReceipt.controls[0].get('custId').enable();
        // }

        this.calcReceipt();
    }

    public calcChildTax() {
        this.arrReceipt.controls.forEach((item, index) => {
            if (index !== 0) {
                this.arrReceipt.controls[index].patchValue({
                    taxDeductionCustId: this.showTaxDeduction
                        ? this.arrReceipt.controls[0].get('taxDeductionCustId').value
                        : null,
                    paymentNikui: this.showTaxDeduction ? toFixedNumber(0) : null
                });
            }
        });
    }

    selectTransTypeCodeFromModal(i: number) {
        const transTypeCode =
            this.arrReceipt.controls[i].get('transTypeCode').value;
        const transTypeDefinedArr = this.addPriemerObject(
            JSON.parse(JSON.stringify(this.rowToSplit.transTypeDefinedArr)),
            transTypeCode
        );
        const arrForm = this.transTypeDefinedFormArray(i);
        arrForm.reset();
        while (arrForm.length) {
            arrForm.removeAt(0);
            arrForm.updateValueAndValidity();
        }
        // this.arrReceipt.controls[i].patchValue({transTypeDefinedArr: transTypeDefinedArr});

        // arrForm.setControl(Number('transTypeDefinedArr'), new FormControl(transTypeDefinedArr));

        this.arrReceipt.controls[i]['setControl'](
            'transTypeDefinedArr',
            new FormControl(transTypeDefinedArr)
        );

        // console.log(this.arrReceipt.controls[i].get('transTypeDefinedArr').value);

        const transTypeCodeObj = transTypeDefinedArr.find(
            (it) => it.value === transTypeCode
        );
        let paymentCustId, taxDeductionCustId;
        if (transTypeCodeObj) {
            if (transTypeCodeObj.precenf === null) {
                transTypeCodeObj.precenf = 0;
            }
            const new_paymentTotal = toFixedNumber(
                Number(this.arrReceipt.controls[i].get('total').value) /
                (1 - transTypeCodeObj.precenf / 100)
            );
            this.arrReceipt.controls[i].patchValue({
                paymentNikui: toFixedNumber(
                    new_paymentTotal -
                    Number(this.arrReceipt.controls[i].get('total').value)
                ),
                paymentTotal: new_paymentTotal
            });
            if (
                transTypeCodeObj.custId &&
                transTypeCodeObj.custId !== '?' &&
                transTypeCodeObj.custId !== '*'
            ) {
                paymentCustId =
                    this.userService.appData.userData.companyCustomerDetails.all.find(
                        (custIdxRec) => custIdxRec.custId === transTypeCodeObj.custId
                    );
                if (!paymentCustId) {
                    paymentCustId = {
                        cartisName: transTypeCodeObj.paymentCustId,
                        cartisCodeId: null,
                        custId: transTypeCodeObj.paymentCustId,
                        lName: null,
                        hp: null,
                        id: null,
                        pettyCash: false,
                        supplierTaxDeduction: null,
                        customerTaxDeduction: null
                    };
                    this.userService.appData.userData.companyCustomerDetails.all.push(
                        paymentCustId
                    );
                }
                this.arrReceipt.controls[i].patchValue({
                    paymentCustId: paymentCustId
                });
                this.arrReceipt.controls[i].get('paymentCustId').disable();
            } else {
                this.arrReceipt.controls[i].patchValue({
                    paymentCustId: this.arrReceipt.controls[i].value.paymentCustIdSaved
                });
                this.arrReceipt.controls[i].get('paymentCustId').enable();
            }
            if (
                transTypeCodeObj.taxDeductionCustId &&
                transTypeCodeObj.taxDeductionCustId !== '?' &&
                transTypeCodeObj.taxDeductionCustId !== '*'
            ) {
                taxDeductionCustId =
                    this.userService.appData.userData.companyCustomerDetails.all.find(
                        (custIdxRec) =>
                            custIdxRec.custId === transTypeCodeObj.taxDeductionCustId
                    );
                if (!taxDeductionCustId) {
                    taxDeductionCustId = {
                        cartisName: transTypeCodeObj.taxDeductionCustId,
                        cartisCodeId: null,
                        custId: transTypeCodeObj.taxDeductionCustId,
                        lName: null,
                        hp: null,
                        id: null,
                        pettyCash: false,
                        supplierTaxDeduction: null,
                        customerTaxDeduction: null
                    };
                    this.userService.appData.userData.companyCustomerDetails.all.push(
                        taxDeductionCustId
                    );
                }
                this.arrReceipt.controls[i].patchValue({
                    taxDeductionCustId: taxDeductionCustId,
                    show_taxDeductionCustId: true
                });
                this.arrReceipt.controls[i].get('taxDeductionCustId').disable();
            } else {
                this.arrReceipt.controls[i].patchValue({
                    taxDeductionCustId:
                    this.arrReceipt.controls[i].value.taxDeductionCustIdSaved,
                    show_taxDeductionCustId: true
                });
                this.arrReceipt.controls[i].get('taxDeductionCustId').enable();
                this.arrReceipt.controls[i].get('paymentTotal').enable();
            }
        } else {
            this.arrReceipt.controls.forEach((v) => {
                // const show_taxDeductionCustId = v.get('show_taxDeductionCustId').value;
                // if (show_taxDeductionCustId) {
                //
                // }
                const taxDeductionCustIdChild = v.get('taxDeductionCustId').value;
                if (taxDeductionCustIdChild) {
                    v.get('taxDeductionCustId').enable();
                }
            });
        }
    }

    public calcReceipt(
        calcByTotalIncludedMaam?: boolean,
        indexRow?: number,
        isKeyPress?: string
    ): void {
        if (indexRow !== undefined) {
            const row_taxDeductionCustId_Exist =
                this.arrReceipt.controls[indexRow].get('show_taxDeductionCustId')
                    .value === true;
            if (
                !(
                    this.arrReceipt.controls[indexRow]
                        .get('total')
                        .value.toString()
                        .slice(-1) === '.' ||
                    this.arrReceipt.controls[indexRow]
                        .get('total')
                        .value.toString()
                        .slice(-2) === '.0'
                )
            ) {
                this.arrReceipt.controls[indexRow].patchValue({
                    total: toFixedNumber(
                        this.arrReceipt.controls[indexRow].get('total').value
                    )
                });
            }
            if (
                !(
                    this.arrReceipt.controls[indexRow]
                        .get('paymentTotal')
                        .value.toString()
                        .slice(-1) === '.' ||
                    this.arrReceipt.controls[indexRow]
                        .get('paymentTotal')
                        .value.toString()
                        .slice(-2) === '.0'
                )
            ) {
                this.arrReceipt.controls[indexRow].patchValue({
                    paymentTotal: toFixedNumber(
                        this.arrReceipt.controls[indexRow].get('paymentTotal').value
                    )
                });
            }
            if (!this.arrReceipt.controls[indexRow].get('paymentNikui')) {
                this.arrReceipt.controls[indexRow].patchValue({
                    paymentNikui: toFixedNumber(
                        this.arrReceipt.controls[indexRow].get('paymentNikui').value
                    )
                });
            } else {
                if (this.arrReceipt.controls[indexRow].get('paymentNikui').value) {
                    if (
                        !(
                            this.arrReceipt.controls[indexRow]
                                .get('paymentNikui')
                                .value.toString()
                                .slice(-1) === '.' ||
                            this.arrReceipt.controls[indexRow]
                                .get('paymentNikui')
                                .value.toString()
                                .slice(-2) === '.0'
                        )
                    ) {
                        this.arrReceipt.controls[indexRow].patchValue({
                            paymentNikui: toFixedNumber(
                                this.arrReceipt.controls[indexRow].get('paymentNikui').value
                            )
                        });
                    }
                } else {
                    this.arrReceipt.controls[indexRow].patchValue({
                        paymentNikui: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentNikui').value
                        )
                    });
                }
            }

            const fieldSumAll = Number(
                this.rowToSplit[this.fileStatus === 'BANK' ? 'total' : 'transTotal']
            );
            clearTimeout(this.debounce);
            this.debounce = setTimeout(() => {
                if (indexRow === 0) {
                    if (isKeyPress === 'paymentTotal') {
                        if (
                            toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentTotal').value
                                )
                            ) >
                            toFixedNumber(
                                Number(this.arrReceipt.controls[indexRow].get('total').value)
                            )
                        ) {
                            const difBetweenSums =
                                toFixedNumber(
                                    Number(this.arrReceipt.controls[indexRow].get('total').value)
                                ) -
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentTotal').value
                                    )
                                );
                            this.arrReceipt.controls[indexRow].patchValue({
                                paymentNikui: toFixedNumber(Number(difBetweenSums))
                            });
                        } else {
                            this.arrReceipt.controls[indexRow].patchValue({
                                paymentTotal: toFixedNumber(
                                    Number(this.arrReceipt.controls[indexRow].get('total').value)
                                )
                            });
                        }
                    }
                    if (isKeyPress === 'paymentNikui') {
                        this.arrReceipt.controls[indexRow].patchValue({
                            paymentTotal: toFixedNumber(
                                Number(this.arrReceipt.controls[indexRow].get('total').value) +
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                )
                            )
                        });
                    }
                } else {
                    if (this.arrReceipt.controls.length === 2) {
                        if (isKeyPress === 'total') {
                            const maxTotal = toFixedNumber(Number(fieldSumAll) - 0.1);
                            if (
                                toFixedNumber(
                                    Number(this.arrReceipt.controls[indexRow].get('total').value)
                                ) > maxTotal
                            ) {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    total: maxTotal,
                                    paymentTotal: toFixedNumber(
                                        maxTotal +
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('paymentNikui')
                                                .value
                                        )
                                    )
                                });
                                this.arrReceipt.controls[0].patchValue({
                                    total: 0.1,
                                    paymentTotal: toFixedNumber(
                                        Number(0.1) +
                                        Number(
                                            this.arrReceipt.controls[0].get('paymentNikui').value
                                        )
                                    )
                                });
                            } else {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    total: toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('total').value
                                        )
                                    ),
                                    paymentTotal: toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('total').value
                                        ) +
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('paymentNikui')
                                                .value
                                        )
                                    )
                                });
                                const mainTotal = toFixedNumber(
                                    Number(fieldSumAll) -
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('total').value
                                    )
                                );
                                this.arrReceipt.controls[0].patchValue({
                                    total: mainTotal,
                                    paymentTotal: toFixedNumber(
                                        Number(mainTotal) +
                                        Number(
                                            this.arrReceipt.controls[0].get('paymentNikui').value
                                        )
                                    )
                                });
                            }
                        }
                        if (isKeyPress === 'paymentTotal') {
                            const taxDeductionCustId =
                                this.arrReceipt.controls[indexRow].get(
                                    'taxDeductionCustId'
                                ).value;
                            const maxTotal = toFixedNumber(Number(fieldSumAll) - 0.1);
                            let paymentTotal = toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentTotal').value
                                )
                            );
                            if (
                                (!taxDeductionCustId || !row_taxDeductionCustId_Exist) &&
                                paymentTotal > maxTotal
                            ) {
                                paymentTotal = maxTotal;
                            } else if (
                                taxDeductionCustId &&
                                row_taxDeductionCustId_Exist &&
                                paymentTotal > fieldSumAll
                            ) {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentNikui: toFixedNumber(paymentTotal - fieldSumAll)
                                });
                            }
                            const currentTotal =
                                paymentTotal -
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                    )
                                );
                            this.arrReceipt.controls[indexRow].patchValue({
                                total: currentTotal,
                                paymentTotal: paymentTotal
                            });
                            const mainTotal = toFixedNumber(
                                Number(fieldSumAll) - currentTotal
                            );
                            this.arrReceipt.controls[0].patchValue({
                                total: mainTotal,
                                paymentTotal: toFixedNumber(
                                    Number(mainTotal) +
                                    Number(
                                        this.arrReceipt.controls[0].get('paymentNikui').value
                                    )
                                )
                            });
                        }
                        if (isKeyPress === 'paymentNikui') {
                            this.arrReceipt.controls[indexRow].patchValue({
                                paymentNikui: toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                    )
                                ),
                                paymentTotal: toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('total').value
                                    ) +
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikui')
                                            .value
                                    )
                                )
                            });
                        }
                    }
                    if (this.arrReceipt.controls.length > 2) {
                        if (isKeyPress === 'total') {
                            const sumsTotalsAllNotFirstNotCurrent = this.arrReceipt.controls
                                .filter((it, idx) => idx !== 0 && idx !== indexRow)
                                .reduce((total, item, currentIndex) => {
                                    return total + Number(item.get('total').value);
                                }, 0);
                            if (
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('total').value
                                    ) + 0.1
                                ) >
                                toFixedNumber(
                                    Number(this.arrReceipt.controls[0].get('total').value)
                                )
                            ) {
                                const newTotal = toFixedNumber(
                                    Number(this.arrReceipt.controls[0].get('total').value) - 0.1
                                );
                                this.arrReceipt.controls[indexRow].patchValue({
                                    total: newTotal,
                                    paymentTotal: toFixedNumber(
                                        newTotal +
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('paymentNikui')
                                                .value
                                        )
                                    )
                                });
                                this.arrReceipt.controls[0].patchValue({
                                    total: 0.1,
                                    paymentTotal: toFixedNumber(
                                        Number(0.1) +
                                        Number(
                                            this.arrReceipt.controls[0].get('paymentNikui').value
                                        )
                                    )
                                });
                            } else {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    total: toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('total').value
                                        )
                                    ),
                                    paymentTotal: toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('total').value
                                        ) +
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('paymentNikui')
                                                .value
                                        )
                                    )
                                });
                                const mainTotal = toFixedNumber(
                                    Number(fieldSumAll) -
                                    sumsTotalsAllNotFirstNotCurrent -
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('total').value
                                    )
                                );
                                this.arrReceipt.controls[0].patchValue({
                                    total: mainTotal,
                                    paymentTotal: toFixedNumber(
                                        Number(mainTotal) +
                                        Number(
                                            this.arrReceipt.controls[0].get('paymentNikui').value
                                        )
                                    )
                                });
                            }
                        }
                        if (isKeyPress === 'paymentTotal') {
                            const sumsTotalsAllNotFirstNotCurrent = this.arrReceipt.controls
                                .filter((it, idx) => idx !== 0 && idx !== indexRow)
                                .reduce((total, item, currentIndex) => {
                                    return total + Number(item.get('total').value);
                                }, 0);
                            const currentMainTotal =
                                Number(fieldSumAll) - sumsTotalsAllNotFirstNotCurrent;
                            const taxDeductionCustId =
                                this.arrReceipt.controls[indexRow].get(
                                    'taxDeductionCustId'
                                ).value;
                            const maxTotal = toFixedNumber(currentMainTotal - 0.1);
                            let paymentTotal = toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentTotal').value
                                )
                            );
                            if (
                                (!taxDeductionCustId || !row_taxDeductionCustId_Exist) &&
                                paymentTotal > maxTotal
                            ) {
                                paymentTotal = maxTotal;
                            } else if (
                                taxDeductionCustId &&
                                row_taxDeductionCustId_Exist &&
                                paymentTotal > currentMainTotal
                            ) {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentNikui: toFixedNumber(paymentTotal - currentMainTotal)
                                });
                            }
                            const currentTotal =
                                paymentTotal -
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                    )
                                );
                            this.arrReceipt.controls[indexRow].patchValue({
                                total: currentTotal,
                                paymentTotal: paymentTotal
                            });
                            const mainTotal = toFixedNumber(currentMainTotal - currentTotal);
                            this.arrReceipt.controls[0].patchValue({
                                total: mainTotal,
                                paymentTotal: toFixedNumber(
                                    Number(mainTotal) +
                                    Number(
                                        this.arrReceipt.controls[0].get('paymentNikui').value
                                    )
                                )
                            });
                        }
                        if (isKeyPress === 'paymentNikui') {
                            this.arrReceipt.controls[indexRow].patchValue({
                                paymentNikui: toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                    )
                                ),
                                paymentTotal: toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('total').value
                                    ) +
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikui')
                                            .value
                                    )
                                )
                            });
                        }
                    }
                }

                // if (isKeyPress === 'paymentTotal') {
                //     const sumsTotals2 = this.arrReceipt.controls.reduce((total, item, currentIndex) => {
                //         if (currentIndex !== (indexRow + 1)) {
                //             return [total[0] + Number(item.get('paymentTotal').value), total[1] + Number(item.get('paymentNikui').value)];
                //         } else {
                //             return [total[0], total[1]];
                //         }
                //     }, [0, 0]);
                //
                //     const totalNow = sumsTotals2[0] + sumsTotals2[1];
                //     if ((totalNow) < fieldSumAll) {
                //         const difBetweenSums = fieldSumAll - totalNow;
                //         if (this.arrReceipt.controls[indexRow + 1] !== undefined) {
                //             this.arrReceipt.controls[indexRow + 1].patchValue({
                //                 total: toFixedNumber(difBetweenSums),
                //                 paymentTotal: toFixedNumber(difBetweenSums),
                //                 paymentNikui: toFixedNumber(0)
                //             });
                //         } else {
                //             const obj = {
                //                 paymentCustIdSaved: this.arrReceipt.controls[0].value.paymentCustIdSaved,
                //                 taxDeductionCustIdSaved: this.arrReceipt.controls[0].value.taxDeductionCustIdSaved,
                //                 thirdDateOpen: false,
                //                 invoiceDate: this.fb.control({
                //                     value: this.arrReceipt.controls[0].get('invoiceDate').value,
                //                     disabled: true
                //                 }),
                //                 dateValue: this.fb.control({
                //                     value: this.arrReceipt.controls[0].get('dateValue').value,
                //                     disabled: false
                //                 }),
                //                 transTypeCode: this.fb.control({
                //                     value: null,
                //                     disabled: false
                //                 }),
                //                 thirdDate: this.fb.control({
                //                     value: this.arrReceipt.controls[0].get('thirdDate').value,
                //                     disabled: false
                //                 }),
                //                 custId: this.fb.control({//כרטיס ספק/לקוח
                //                     value: this.arrReceipt.controls[0].get('custId').value,
                //                     disabled: true
                //                 }),
                //                 total: this.fb.control({
                //                     value: toFixedNumber(difBetweenSums),
                //                     disabled: true
                //                 }, [Validators.required]),
                //                 paymentCustId: this.fb.control({//כרטיס קופה
                //                     value: null,
                //                     disabled: false
                //                 }, [Validators.required]),
                //                 paymentTotal: this.fb.control({
                //                     value: toFixedNumber(difBetweenSums),
                //                     disabled: false
                //                 }, [Validators.required]),
                //                 taxDeductionCustId: this.fb.control({//כרטיס ניכוי מס
                //                     value: this.showTaxDeduction ? this.arrReceipt.controls[0].get('taxDeductionCustId').value : null,
                //                     disabled: false
                //                 }, [Validators.required]),
                //                 paymentNikui: this.fb.control({
                //                     value: this.showTaxDeduction ? 0 : null,
                //                     disabled: true
                //                 }, [Validators.required]),
                //                 asmachta: this.fb.control({
                //                     value: this.arrReceipt.controls[0].get('asmachta').value,
                //                     disabled: true
                //                 }),
                //                 paymentAsmachta: this.fb.control({
                //                     value: null,
                //                     disabled: false
                //                 }),
                //                 asmachta3: this.fb.control({
                //                     value: null,
                //                     disabled: false
                //                 }),
                //                 details: this.fb.control({
                //                     value: this.arrReceipt.controls[0].get('details').value,
                //                     disabled: false
                //                 })
                //             };
                //             this.arrReceipt.push(this.fb.group(obj));
                //             this.arrReceipt.controls[0].get('custId').disable();
                //         }
                //     } else if (totalNow > fieldSumAll) {
                //         if (indexRow === 0) {
                //             const difBetweenSums = totalNow - fieldSumAll;
                //             if (toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value)) - difBetweenSums >= 0) {
                //                 this.arrReceipt.controls[indexRow].patchValue({
                //                     paymentNikui: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value)) - difBetweenSums
                //                 });
                //             } else {
                //                 this.arrReceipt.controls[indexRow].patchValue({
                //                     paymentTotal: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value))
                //                 });
                //             }
                //         } else {
                //             const sumsTotals3 = this.arrReceipt.controls.reduce((total, item, currentIndex) => {
                //                 if (currentIndex !== (indexRow - 1)) {
                //                     return [total[0] + Number(item.get('paymentTotal').value), total[1] + Number(item.get('paymentNikui').value)];
                //                 } else {
                //                     return [total[0], total[1]];
                //                 }
                //             }, [0, 0, 0]);
                //             const totalNowWithoutPrev = sumsTotals3[0] + sumsTotals3[1];
                //             const difBetweenSums = fieldSumAll - totalNowWithoutPrev;
                //             if (difBetweenSums >= 1) {
                //                 const newPaymentTotal = toFixedNumber(Number(this.arrReceipt.controls[indexRow - 1].get('paymentTotal').value)) - (toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentTotal').value)) - toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)));
                //                 if (newPaymentTotal >= 0) {
                //                     this.arrReceipt.controls[indexRow - 1].patchValue({
                //                         paymentTotal: newPaymentTotal,
                //                         total: toFixedNumber(Number(this.arrReceipt.controls[indexRow - 1].get('paymentNikui').value)) + newPaymentTotal
                //                     });
                //                 } else {
                //                     this.arrReceipt.controls[indexRow].patchValue({
                //                         paymentTotal: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value))
                //                     });
                //                 }
                //             } else {
                //                 this.arrReceipt.controls[indexRow].patchValue({
                //                     paymentTotal: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value))
                //                 });
                //             }
                //
                //
                //         }
                //
                //     }
                //
                //     this.arrReceipt.controls[indexRow].patchValue({
                //         total: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value)) + toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentTotal').value))
                //     });
                // }
                // if (isKeyPress === 'paymentNikui' && indexRow === 0) {
                //     if (toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)) - toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value)) >= 0) {
                //         this.arrReceipt.controls[indexRow].patchValue({
                //             paymentTotal: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)) - toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value))
                //         });
                //     } else {
                //         this.arrReceipt.controls[indexRow].patchValue({
                //             paymentTotal: 0,
                //             paymentNikui: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value))
                //         });
                //     }
                //
                //     // const sumsTotals = this.arrReceipt.controls.reduce((total, item, currentIndex) => {
                //     //     return [total[0] + Number(item.get('total').value), total[1] + Number(item.get('paymentNikui').value), total[2] + Number(item.get('paymentTotal').value)];
                //     // }, [0, 0, 0]);
                //     // console.log(Number(this.fileFieldsForm.get('17').get('effectiveValue').value), (sumsTotals[1] + sumsTotals[2]));
                //     // if ((sumsTotals[1] + sumsTotals[2]) > Number(this.fileFieldsForm.get('17').get('effectiveValue').value)) {
                //     //     const sumsOfAllTheOtherRows = (sumsTotals[0]) - (toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)));
                //     //     this.arrReceipt.controls[indexRow].patchValue({
                //     //         paymentNikui: toFixedNumber(Number(this.fileFieldsForm.get('17').get('effectiveValue').value) - sumsOfAllTheOtherRows),
                //     //         paymentTotal: toFixedNumber(0)
                //     //     });
                //     // } else {
                //     //     this.arrReceipt.controls[indexRow].patchValue({
                //     //         paymentTotal: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)) - toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value))
                //     //     });
                //     // }
                // }

                if (
                    this.arrReceipt.controls[indexRow].get('newRow').value === true &&
                    this.arrReceipt.controls[indexRow].get('paymentNikui').value === 0 &&
                    (isKeyPress === 'paymentTotal' || isKeyPress === 'total')
                ) {
                    const transTypeCode =
                        this.arrReceipt.controls[indexRow].get('transTypeCode').value;
                    const transTypeDefinedArr = JSON.parse(
                        JSON.stringify(this.rowToSplit.transTypeDefinedArr)
                    );
                    const transTypeCodeObj = transTypeDefinedArr.find(
                        (it) => it.value === transTypeCode
                    );
                    if (transTypeCodeObj && transTypeCodeObj.precenf) {
                        this.selectTransTypeCodeFromModal(indexRow);
                    }
                }
            }, 500);
        }
    }

    splitReceiptJournalTrans() {
        this.editReceiptModalShow = false;
        this.selectedTransaction = this.rowToSplit;
        // const custId = this.arrReceipt.controls[0].get('custId').value;
        // this.fileFieldsForm.get('2').patchValue({
        //     effectiveValue: custId
        // }, {emitEvent: false, onlySelf: true});
        // if (custId.custId) {
        //     const currencyFormControl = this.fileFieldsForm.get('2');
        //     this.ocrService.setFieldValue({
        //         fileId: this._fileScanView.fileId,
        //         fieldId: 2,
        //         fileResultId: currencyFormControl.value.fileResultId,
        //         fieldPage: 0,
        //         fieldPosition: null,
        //         fieldValue: custId.custId,
        //         locationNum: null,
        //         locationDesc: null,
        //         fieldSearchkey: null,
        //         manualTyped: true
        //     }).pipe(take(1))
        //         .subscribe(() => {
        //         });
        // }
        // if (this.arrReceipt.controls.length === 1) {
        //     const dateValue = this.arrReceipt.controls[0].get('dateValue').value;
        //     if (this.fileFieldsForm.get('14') && this.fileFieldsForm.get('14').get('effectiveValue').value !== dateValue) {
        //         this.fileFieldsForm.get('14').patchValue({
        //             effectiveValue: dateValue
        //         });
        //     }
        //     const paymentCustId = this.arrReceipt.controls[0].get('paymentCustId').value;
        //     if (paymentCustId.custId && this.fileFieldsForm.get('30') && this.fileFieldsForm.get('30').get('effectiveValue').value && (this.fileFieldsForm.get('30').get('effectiveValue').value.custId !== paymentCustId.custId)) {
        //         this.fileFieldsForm.get('30').patchValue({
        //             effectiveValue: paymentCustId
        //         });
        //     }
        //     const paymentNikui = this.arrReceipt.controls[0].get('paymentNikui').value;
        //     if (this.fileFieldsForm.get('33') && toFixedNumber(this.fileFieldsForm.get('33').get('effectiveValue').value) !== toFixedNumber(paymentNikui)) {
        //         this.fileFieldsForm.get('33').patchValue({
        //             effectiveValue: toFixedNumber(paymentNikui)
        //         });
        //     }
        //     const paymentAsmachta = this.arrReceipt.controls[0].get('paymentAsmachta').value;
        //     if (this.fileFieldsForm.get('31') && String(this.fileFieldsForm.get('31').get('effectiveValue').value) !== String(paymentAsmachta)) {
        //         this.fileFieldsForm.get('31').patchValue({
        //             effectiveValue: paymentAsmachta
        //         });
        //     }
        // }
        // if (this.arrReceipt.controls.length > 1) {
        //     const paymentNikui = this.arrReceipt.controls[0].get('paymentNikui').value;
        //     if (this.fileFieldsForm.get('33') && toFixedNumber(this.fileFieldsForm.get('33').get('effectiveValue').value) !== toFixedNumber(paymentNikui)) {
        //         this.fileFieldsForm.get('33').patchValue({
        //             effectiveValue: toFixedNumber(paymentNikui)
        //         });
        //     }
        // }
        if (this.arrReceipt.controls.length === 1) {
            this.rowToSplit.splitMultiPayment = false;
            if (
                this.arrReceipt.controls[0].get('paymentCustId').value.custId !==
                this.rowToSplit.custId
            ) {
                const paymentCustId =
                    this.arrReceipt.controls[0].get('paymentCustId').value;
                this.rowToSplit.custId = paymentCustId.custId;
                this.rowToSplit.cust = paymentCustId;
                this.rowToSplit.custName = paymentCustId.cartisName
                    ? paymentCustId.cartisName
                    : 'בחירה';

                if (this.fileStatus === 'BANK') {
                    const row = this.bankDetailsSave.find(
                        (it) => it.paymentId === this.rowToSplit.paymentId
                    );
                    row.cust = this.rowToSplit.cust;
                    row.custName = this.rowToSplit.custName;
                    row.custId = this.rowToSplit.custId;
                } else if (this.fileStatus === 'CREDIT') {
                    const row = this.cardDetailsSave.find(
                        (it) => it.ccardTransId === this.rowToSplit.ccardTransId
                    );
                    row.cust = this.rowToSplit.cust;
                    row.custName = this.rowToSplit.custName;
                    row.custId = this.rowToSplit.custId;
                }
                this.filtersAll();
            }
        } else {
            this.rowToSplit.splitMultiPayment = true;
        }
        const paramsToSplit = {
            companyId: this.userService.appData.userData.companySelect.companyId,
            companyAccountId: this.rowToSplit.companyAccountId,
            currencyId: this.rowToSplit.currencyId,
            paymentId: this.rowToSplit.paymentId,
            paymentType: this.rowToSplit.paymentType,
            splitArray: this.arrReceipt.controls.map((item) => ({
                transTypeCode: this.bankProcessTransType
                    ? item.get('transTypeCode').value
                    : null,
                dateValue: item.get('dateValue').value
                    ? this.userService.appData
                        .moment(item.get('dateValue').value)
                        .toDate()
                    : null,
                thirdDate: item.get('thirdDate').value
                    ? this.userService.appData
                        .moment(item.get('thirdDate').value)
                        .toDate()
                    : null,
                paymentCustId: item.get('paymentCustId').value.custId,
                taxDeductionCustId:
                    item.get('show_taxDeductionCustId').value === true
                        ? !item.get('taxDeductionCustId').value
                            ? null
                            : item.get('taxDeductionCustId').value.custId
                        : null,
                total: item.get('total').value,
                paymentNikui:
                    item.get('show_taxDeductionCustId').value === true
                        ? item.get('paymentNikui').value !== null
                            ? item.get('paymentNikui').value
                            : null
                        : null,
                paymentTotal: item.get('paymentTotal').value,
                paymentAsmachta: item.get('paymentAsmachta').value,
                asmachta3: item.get('asmachta3').value,
                details: item.get('details').value,
                invoiceDate: item.get('invoiceDate').value,
                asmachta: item.get('asmachta').value,
                custId: item.get('custId').value
                    ? item.get('custId').value.custId
                    : item.get('custId').value
            }))
        };
        if (this.fileStatus === 'CREDIT') {
            paramsToSplit['creditCardId'] = this.rowToSplit.creditCardId;
        }
        if (paramsToSplit.splitArray.every((it) => it.custId !== null)) {
            this.sharedService.splitJournalTrans(paramsToSplit).subscribe(() => {
                if (this.receipt) {
                    let control: AbstractControl = null;
                    this.receipt.reset();
                    this.receipt.markAsUntouched();
                    Object.keys(this.receipt.controls).forEach((name) => {
                        control = this.receipt.controls[name];
                        control.setErrors(null);
                    });
                }

                this.reload();
            });
        }
    }

    isDisabledSplitReceiptJournalTrans(): boolean {
        if (this.receipt && this.arrReceipt) {
            if (
                Object.values(this.arrReceipt.controls).some((fc) => {
                    const row_taxDeductionCustId_Exist =
                        fc.get('show_taxDeductionCustId').value === true;
                    const valReq = {
                        dateValue:
                            fc.get('dateValue').enabled && fc.get('dateValue').invalid,
                        custId: fc.get('custId').enabled && fc.get('custId').invalid,
                        paymentCustId:
                            fc.get('paymentCustId').enabled &&
                            fc.get('paymentCustId').invalid,
                        taxDeductionCustId:
                            row_taxDeductionCustId_Exist &&
                            fc.get('taxDeductionCustId').enabled &&
                            fc.get('taxDeductionCustId').invalid,
                        total: fc.get('total').enabled && fc.get('total').invalid,
                        paymentTotal:
                            fc.get('paymentTotal').enabled &&
                            (fc.get('paymentTotal').invalid ||
                                this.getNum(fc.get('paymentTotal').value) === 0),
                        paymentNikui:
                            row_taxDeductionCustId_Exist &&
                            fc.get('paymentNikui').enabled &&
                            fc.get('paymentNikui').invalid &&
                            this.getNum(fc.get('paymentNikui').value) !== 0,
                        equalDropDowns:
                            fc.get('custId').value &&
                            fc.get('paymentCustId').value &&
                            fc.get('custId').value.custId ===
                            fc.get('paymentCustId').value.custId
                    };

                    const someIsInvalid = Object.values(valReq).some((val) => val);
                    // console.log('----someIsInvalid----', someIsInvalid, valReq, fc.get('totalIncludedMaam').value, fc.get('totalMaam').value, fc.get('totalWithoutMaam').value);
                    return someIsInvalid;
                })
            ) {
                return true;
            }
        }

        return false;
    }

    public transTypeDefinedFormArray(indexRow: number): FormArray {
        return this.arrReceipt.controls[indexRow].get(
            'transTypeDefinedArr'
        ) as FormArray;
    }

    public getCompanyCustomerDetails() {
        this.sharedService
            .companyGetCustomer({
                companyId: this.userService.appData.userData.companySelect.companyId,
                sourceProgramId:
                this.userService.appData.userData.companySelect.sourceProgramId
            })
            .subscribe((response: any) => {
                this.companyCustomerDetailsData = {
                    esderMaam: this.userService.appData.userData.companySelect.esderMaam
                };
                this.loaderGetCompanyCustomerDetails = false;
            });
    }

    getNum(val): number {
        return toNumber(val);
    }

    dialogMaskListen() {
        if (
            this.showDocumentListStorageDataFired &&
            !this.globalListenerWhenInEdit
        ) {
            this.globalListenerWhenInEdit = this.renderer.listen(
                'document',
                'click',
                ($event) => {
                    // console.log('details listener called');
                    const eventPath = BrowserService.pathFrom($event);
                    // console.log('Checking if should terminate edit: %o', eventPath);
                    const shouldTerminateEdit =
                        eventPath[0].classList.contains('p-dialog-mask');
                    if (shouldTerminateEdit) {
                        console.log('Terminating edit (clicked on : %o)', eventPath);
                        this.showDocumentListStorageDataFired = false;
                        if (this.globalListenerWhenInEdit) {
                            this.globalListenerWhenInEdit();
                            this.globalListenerWhenInEdit = null;
                            return;
                        }
                    }
                }
            );
        }
    }

    dialogMaskListenRece() {
        if (
            this.showDocumentListStorageDataFiredRece &&
            this.rowToSplit.fileId &&
            !this.sidebarImgs
        ) {
            this.getDocumentStorageData(this.rowToSplit.fileId);
        }
        if (
            this.showDocumentListStorageDataFiredRece &&
            !this.globalListenerWhenInEdit
        ) {
            this.globalListenerWhenInEdit = this.renderer.listen(
                'document',
                'click',
                ($event) => {
                    // console.log('details listener called');
                    const eventPath = BrowserService.pathFrom($event);
                    // console.log('Checking if should terminate edit: %o', eventPath);
                    const shouldTerminateEdit =
                        eventPath[0].classList.contains('p-dialog-mask');
                    if (shouldTerminateEdit) {
                        console.log('Terminating edit (clicked on : %o)', eventPath);
                        this.showDocumentListStorageDataFiredRece = false;
                        this.sidebarImgs = false;
                        if (this.globalListenerWhenInEdit) {
                            this.globalListenerWhenInEdit();
                            this.globalListenerWhenInEdit = null;
                            return;
                        }
                    }
                }
            );
        }
    }

    onHideEditReceipt() {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;

        this.selectedTransaction = this.rowToSplit;
        this.showDocumentListStorageDataFiredRece = false;
        this.sidebarImgs = false;
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
            this.globalListenerWhenInEdit = null;
            return;
        }
    }

    printAdditionalDetails(): void {
        BrowserService.printHtml(
            document.getElementsByClassName('wrapData')[0] as HTMLElement,
            this.rowToSplit.mainDesc
        );
    }

    printAdditionalPaymentDetails(): void {
        this.printWorker = true;
        setTimeout(() => {
            BrowserService.printHtml(
                document.getElementsByClassName('wrapDataToPrint')[0] as HTMLElement,
                this.fileData.transDetails.mainDesc
            );
            setTimeout(() => {
                this.printWorker = false;
            }, 200);
        }, 10);
    }

    override reload() {
        console.log('reload child');
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.selectedCardRangeSub) {
            this.selectedCardRangeSub.unsubscribe();
        }
        if (this.cardsListArrivedSub) {
            this.cardsListArrivedSub.unsubscribe();
        }
        if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
            this.getExportFiles(true);
        }
        this.ngAfterViewInit();
        this.reloadData();
    }

    public hideDropCartis() {
        if (this.subscriptionTime) {
            this.subscriptionTime.unsubscribe();
        }
        this.loaderGetCompanyCustomerDetails = false;
    }

    public setValCartisModal(dd: any, fid: any) {
        const obj = {
            cartisName: dd.filterValue,
            cartisCodeId: null,
            custId: dd.filterValue,
            lName: null,
            hp: null,
            id: null,
            pettyCash: false,
            supplierTaxDeduction: null,
            customerTaxDeduction: null
        };
        this.userService.appData.userData.companyCustomerDetails.all.push(obj);
        dd.options = this.userService.appData.userData.companyCustomerDetails.all;
        dd.overlayVisible = false;
        fid.patchValue(obj);
    }

    public getCompanyCustomerDetailsTimer() {
        this.loaderGetCompanyCustomerDetails = true;
        let dataReceiveDate = null;
        this.subscriptionTime = timer(0, 5000)
            .pipe(
                switchMap(() =>
                    this.ocrService.getCompanyJournalTransData({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                )
            )
            .subscribe((response: any) => {
                const getCompanyJournalTransData =
                    response && !response.error ? response.body : null;
                if (getCompanyJournalTransData) {
                    if (!dataReceiveDate) {
                        dataReceiveDate = getCompanyJournalTransData.dataReceiveDate;
                    }
                    if (dataReceiveDate !== getCompanyJournalTransData.dataReceiveDate) {
                        this.subscriptionTime.unsubscribe();
                        this.userService.appData.userData.companyCustomerDetails = null;
                        this.sharedService.companyCustomerDetails$ = null;
                        this.companyGetCustomerList();
                    }
                }
            });
    }

    oppositeCustHistory(row: any, formDropdownsCustomerCustList?: any) {
        // if(this.rowIdSave && this.rowIdSave)
        // this.rowIdSave = row;
        // debugger
        this.rowForMatchCust = row;
        // console.log('row: ', row);
        this.customerCustList = this.customerCustList.filter((it) => !it.isHistory);
        // this.customerCustList = JSON.parse(JSON.stringify(this.customerCustList));
        // console.log(' this.customerCustList: ',  this.customerCustList);

        // setTimeout(() => {
        //     // if (formDropdownsCustomerCustList) {
        //     //     formDropdownsCustomerCustList.options = this.customerCustList;
        //     //     formDropdownsCustomerCustList.optionsToDisplay = this.customerCustList;
        //     //     formDropdownsCustomerCustList.selectedOption = {
        //     //         label: row.cust.cartisName,
        //     //         value: row.cust
        //     //     };
        //     // }
        //     if (this.formDropdownsCustomerCustLists && this.formDropdownsCustomerCustLists.length) {
        //         this.formDropdownsCustomerCustLists
        //             .forEach(item => {
        //                 item.options = this.customerCustList;
        //                 // item.optionsToDisplay = this.customerCustList;
        //                 // if (item.value) {
        //                 //     item.selectedOption = {
        //                 //         label: item.cartisName,
        //                 //         value: item.custId
        //                 //     };
        //                 // }
        //             });
        //     }
        // }, 0);
        setTimeout(() => {
            this.sharedService
                .oppositeCustHistory({
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    sourceProgramId:
                    this.userService.appData.userData.companySelect.sourceProgramId,
                    transArray: row
                        ? [
                            {
                                biziboxMutavId: row.biziboxMutavId,
                                searchkeyId: row.searchkeyId
                            }
                        ]
                        : this.showFloatNav.selcetedFiles.map((it) => {
                            return {
                                biziboxMutavId: it.biziboxMutavId,
                                searchkeyId: it.searchkeyId
                            };
                        })
                })
                .subscribe((res) => {
                    let oppositeCustHistoryTrans = res && !res.error ? res.body : [];
                    // oppositeCustHistoryTrans = [{"custId":"10630","custLastName":"בדיקת היסטוריה 2"}, {"custId":"10631","custLastName":"בדיקת היסטוריה 1"}]
                    if (oppositeCustHistoryTrans && oppositeCustHistoryTrans.length) {
                        oppositeCustHistoryTrans = oppositeCustHistoryTrans.map((it) => {
                            const cartisName = it.custId
                                ? it.custId + (it.custLastName ? ' - ' + it.custLastName : '')
                                : it.custLastName
                                    ? it.custLastName
                                    : '';
                            return {
                                cartisName: cartisName,
                                custId: it.custId,
                                lName: it.custLastName,
                                hp: null,
                                id: null,
                                isHistory: true
                            };
                        });
                        oppositeCustHistoryTrans[
                        oppositeCustHistoryTrans.length - 1
                            ].isLastHistory = true;
                        oppositeCustHistoryTrans.unshift({
                            cartisName: null,
                            custId: null,
                            lName: null,
                            title: true,
                            disabled: true,
                            hp: null,
                            id: null,
                            isHistory: true
                        });
                        // this.customerCustList = this.customerCustList.filter(it => !oppositeCustHistoryTrans.some(cust => cust.custId === it.custId));
                        this.customerCustList = oppositeCustHistoryTrans.concat(
                            this.customerCustList
                        );


                        // console.log('customerCustList', this.customerCustList);
                        // if (formDropdownsCustomerCustList) {
                        //     formDropdownsCustomerCustList.options = this.customerCustList;
                        //     formDropdownsCustomerCustList.optionsToDisplay = this.customerCustList;
                        //     formDropdownsCustomerCustList.selectedOption = {
                        //         label: row.cust.cartisName,
                        //         value: row.cust
                        //     };
                        // }
                        // if (this.formDropdownsCustomerCustLists && this.formDropdownsCustomerCustLists.length) {
                        //     this.formDropdownsCustomerCustLists
                        //         .forEach(item => {
                        //             item.options = this.customerCustList;
                        //             // item.optionsToDisplay = this.customerCustList;
                        //             // if(item.value){
                        //             //     item.selectedOption = {
                        //             //         label: item.cartisName,
                        //             //         value: item.custId
                        //             //     };
                        //             // }
                        //         });
                        // }
                    }
                    const izuCustId = row.account ? row.account.izuCustId : row.card ? row.card.izuCustId : null;
                    // console.log(izuCustId)
                    if (izuCustId) {
                        const existSameVal = this.customerCustList.findIndex(it => it.custId === izuCustId);
                        if (existSameVal !== -1) {
                            this.customerCustList[existSameVal]['disabled'] = true;
                        }
                    }
                });
        }, 0);
    }

    disabledValues(arrForms: any) {
        if (arrForms && arrForms.length) {
            const arrFormsCust = arrForms.filter(it => it && it.custId).map(it => it.custId);
            this.userService.appData.userData.companyCustomerDetails.all.forEach(it => {
                it.disabledVal = arrFormsCust.includes(it.custId);
            });
        }
    }

    companyGetCustomerList(
        isFromDateFilter?: boolean,
        paramDate?: any,
        saveFilter?: boolean
    ) {
        this.customerCustList = [];
        this.sharedService
            .companyGetCustomer({
                companyId: this.userService.appData.userData.companySelect.companyId,
                sourceProgramId:
                this.userService.appData.userData.companySelect.sourceProgramId
            })
            .subscribe((resp) => {
                // const companyCustomerDetails = (resp && !resp.error) ? resp.body : [];
                // if (companyCustomerDetails && companyCustomerDetails.length) {
                //     // filter(it => it.cartisCodeId === 1300 || it.cartisCodeId === 1400 || it.cartisCodeId === 3 || it.cartisCodeId === 7 || it.cartisCodeId === 1000 || it.cartisCodeId === 1011)
                //     const allTypes = companyCustomerDetails.map(it => {
                //         return {
                //             cartisCodeId: it.cartisCodeId,
                //             custId: it.custId,
                //             lName: it.custLastName,
                //             hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                //             id: it.palCode,
                //             pettyCash: it.pettyCash ? it.pettyCash : false,
                //             supplierTaxDeduction: it.supplierTaxDeduction,
                //             customerTaxDeduction: it.customerTaxDeduction
                //         };
                //     });
                //     this.companyCustomerDetailsData = {
                //         indexDataExpense: allTypes,
                //         cupa: companyCustomerDetails.filter(it => it.cartisCodeId === 1700 || it.cartisCodeId === 1800).map(it => {
                //             return {
                //                 cartisCodeId: it.cartisCodeId,
                //                 custId: it.custId,
                //                 lName: it.custLastName,
                //                 hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                //                 id: it.palCode,
                //                 pettyCash: it.pettyCash ? it.pettyCash : false
                //             };
                //         })
                //     };
                //
                //     allTypes.unshift({
                //         custId: null,
                //         lName: 'ללא',
                //         hp: null,
                //         id: null
                //     });
                //     this.customerCustList = JSON.parse(JSON.stringify(allTypes));
                //     this.customerCustList = JSON.parse(JSON.stringify(allTypes));
                // } else {
                //     const allTypes = [{
                //         custId: null,
                //         lName: 'ללא',
                //         hp: null,
                //         id: null
                //     }];
                //     this.customerCustList = JSON.parse(JSON.stringify(allTypes));
                //     this.customerCustList = JSON.parse(JSON.stringify(allTypes));
                // }
                this.customerCustList = JSON.parse(
                    JSON.stringify(
                        this.userService.appData.userData.companyCustomerDetails.all
                    )
                );
                this.customerCustList.unshift({
                    cartisName: 'ביטול בחירה',
                    cartisCodeId: null,
                    custId: '',
                    lName: 'ביטול בחירה',
                    hp: null,
                    id: null,
                    pettyCash: false,
                    supplierTaxDeduction: null,
                    customerTaxDeduction: null
                });
                // cartisCodeId: 0
                // custId: "1115"
                // custLastName: "יפתח שפירא"
                // oseknums: []
                // palCode: "68"
                // pettyCash: true
                if (!isFromDateFilter) {
                    if (this.fileStatus === 'BANK') {
                        if (
                            Array.isArray(this.bankDetailsSave) &&
                            this.bankDetailsSave.length
                        ) {
                            for (const fd of this.bankDetailsSave) {
                                let custId =
                                    fd.custId && this.customerCustList
                                        ? this.customerCustList.find(
                                            (custIdxRec) => custIdxRec.custId === fd.custId
                                        )
                                        : null;
                                if (!custId && fd.custId && this.customerCustList) {
                                    custId = {
                                        cartisName: fd.custId,
                                        cartisCodeId: null,
                                        custId: fd.custId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.customerCustList.push(custId);
                                }
                                fd.cust = custId;
                                fd.custName = custId ? custId.cartisName : 'בחירה';

                                // if (fd.custId) {
                                //     const custFromList = this.customerCustList.find(cust => cust.custId === fd.custId);
                                //     fd.cust = custFromList ? custFromList : null;
                                //     fd.custName = custFromList ? custFromList.cartisName : 'בחירה';
                                // } else {
                                //     fd.cust = null;
                                //     fd.custName = 'בחירה';
                                // }
                            }
                        }
                        if (Array.isArray(this.bankDetails) && this.bankDetails.length) {
                            for (const fd of this.bankDetails) {
                                // if (fd.custId) {
                                //     const custFromList = this.customerCustList.find(cust => cust.custId === fd.custId);
                                //     fd.cust = custFromList ? custFromList : null;
                                //     fd.custName = custFromList ? custFromList.cartisName : 'בחירה';
                                // } else {
                                //     fd.cust = null;
                                //     fd.custName = 'בחירה';
                                // }

                                let custId =
                                    fd.custId && this.customerCustList
                                        ? this.customerCustList.find(
                                            (custIdxRec) => custIdxRec.custId === fd.custId
                                        )
                                        : null;
                                if (!custId && fd.custId && this.customerCustList) {
                                    custId = {
                                        cartisName: fd.custId,
                                        cartisCodeId: null,
                                        custId: fd.custId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.customerCustList.push(custId);
                                }
                                fd.cust = custId;
                                fd.custName = custId ? custId.cartisName : 'בחירה';
                            }
                        }
                    } else if (this.fileStatus === 'CREDIT') {
                        if (
                            Array.isArray(this.cardDetailsSave) &&
                            this.cardDetailsSave.length
                        ) {
                            for (const fd of this.cardDetailsSave) {
                                // if (fd.custId) {
                                //     const custFromList = this.customerCustList.find(cust => cust.custId === fd.custId);
                                //     fd.cust = custFromList ? custFromList : null;
                                //     fd.custName = custFromList ? custFromList.cartisName : 'בחירה';
                                // } else {
                                //     fd.cust = null;
                                //     fd.custName = 'בחירה';
                                // }

                                let custId =
                                    fd.custId && this.customerCustList
                                        ? this.customerCustList.find(
                                            (custIdxRec) => custIdxRec.custId === fd.custId
                                        )
                                        : null;
                                if (!custId && fd.custId && this.customerCustList) {
                                    custId = {
                                        cartisName: fd.custId,
                                        cartisCodeId: null,
                                        custId: fd.custId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.customerCustList.push(custId);
                                }
                                fd.cust = custId;
                                fd.custName = custId ? custId.cartisName : 'בחירה';
                            }
                        }
                        if (Array.isArray(this.cardDetails) && this.cardDetails.length) {
                            for (const fd of this.cardDetails) {
                                // if (fd.custId) {
                                //     const custFromList = this.customerCustList.find(cust => cust.custId === fd.custId);
                                //     fd.cust = custFromList ? custFromList : null;
                                //     fd.custName = custFromList ? custFromList.cartisName : 'בחירה';
                                // } else {
                                //     fd.cust = null;
                                //     fd.custName = 'בחירה';
                                // }

                                let custId =
                                    fd.custId && this.customerCustList
                                        ? this.customerCustList.find(
                                            (custIdxRec) => custIdxRec.custId === fd.custId
                                        )
                                        : null;
                                if (!custId && fd.custId && this.customerCustList) {
                                    custId = {
                                        cartisName: fd.custId,
                                        cartisCodeId: null,
                                        custId: fd.custId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.customerCustList.push(custId);
                                }
                                fd.cust = custId;
                                fd.custName = custId ? custId.cartisName : 'בחירה';
                            }
                        }
                    }
                }

                this.customerCustList = JSON.parse(
                    JSON.stringify(this.customerCustList)
                );
                if (isFromDateFilter) {
                    this.getData(paramDate, saveFilter);
                }

                if (this.custModal) {
                    if (!this.rowForMatchCust) {
                        this.oppositeCustHistory(false);
                    }
                }
            });
    }

    setStatus(fileStatus: string): void {
        if (this.fileStatus === 'BANK_MATCH' && fileStatus === 'BANK_MATCH') {
            this.getDataTables();
            return;
        }
        this.queryString = '';
        // this.filterInput.setValue('', {
        //     emitEvent: false,
        //     onlySelf: true
        // });
        this.filterInput.setValue('', {
            emitEvent: false,
            emitModelToViewChange: true,
            emitViewToModelChange: false
        });
        this.isHashTransesOpened = false;
        this.isMadeInBiziboxOpened = false;
        this.isFutureTransesOpened = false;
        this.booksSortControl = new FormControl({
            orderBy: null,
            order: 'DESC'
        });
        this.bankSortControl = new FormControl({
            orderBy: null,
            order: 'DESC'
        });
        this.loaderBooks = true;
        this.loaderCash = true;
        this.checkAllRows = false;
        this.checkAllBooks = false;
        this.hasRowOfChecked = false;
        this.banktransForMatch = [];
        this.currentTab = 1;
        this.filterInputBooks.setValue('', {
            emitEvent: false,
            emitModelToViewChange: true,
            emitViewToModelChange: false
        });
        this.filterInputUnadjusted.setValue('', {
            emitEvent: false,
            emitModelToViewChange: true,
            emitViewToModelChange: false
        });
        setTimeout(() => {
            this.checkNavScroll();
        }, 600);
        this.cashflowMatchAll = null;
        this.hasRowOfDeleted = false;
        this.banktransForMatchAll = null;
        this.sumsTotal = false;
        this.cashflowMatchReco = null;
        this.showFloatNav = false;
        this.bankDetails = false;
        this.bankDetailsSave = false;
        this.filterLink = 'all';
        this.bankDetailsSave = false;
        this.companyFilesSortControl = new FormControl({
            orderBy: 'transDate',
            order: 'DESC'
        });
        this.statusArr = [];
        this.filterTypesStatus = null;
        this.paymentDescArr = [];
        this.transTypeCodeArr = [];
        this.filterTransTypeCode = null;
        this.filterTypesPaymentDesc = null;
        this.hovaArr = [];
        this.editArr = [];
        this.filterNote = null;
        this.filterTypesHova = null;
        this.selcetAllFiles = null;
        this.currentPage = 0;
        this.entryLimit = 50;
        if (this.paginator && this.paginator.changePage) {
            this.paginator.changePage(0);
        }
        this.fileStatus = fileStatus;
        this.storageService.sessionStorageSetter(
            'bankAndCreditScreenTab',
            this.fileStatus
        );
        this.startChild();
    }

    getTooltipName(sugTnua: any) {
        if (!sugTnua) {
            return null;
        }
        switch (sugTnua) {
            case 'BZ1':
                return 'מע"מ מלא';
            case 'BZ2':
                return 'ללא מע"מ';
            case 'BZ3':
                return 'מע"מ ⅔';
            case 'BZ4':
                return 'מע"מ ¼';
            case 'BZ5':
                return 'מע"מ מלא רכוש קבוע';
            case 'BZ6':
                return 'מע"מ מלא יבוא';
            case 'BZ7':
                return 'מע"מ פתוח';
            case 'BZ0':
                return 'קבלה - עם ניכוי מס';
            case 'BZ':
                return 'קבלה - בלי ניכוי מס';
            default:
                return null;
        }
    }

    roundAndAddCommaFunc(num: any) {
        if (num) {
            return roundAndAddComma(num);
        }
        return '';
    }

    changeExportFile(parent: any) {
        this.sharedService
            .changeExportFile({
                uuids: parent.transData.map((it) => it.paymentId)
            })
            .subscribe(() => {
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                this.getExportFiles(true);
            });
    }

    deleteCommand(parent: any) {
        this.deleteCommandModal = {
            uuids: parent.transData.map((it) => it.paymentId)
        };
    }

    deleteCommandRow(it: any) {
        this.deleteCommandRowModal = {
            uuids: [it.paymentId]
        };
    }

    deleteCommandSend() {
        this.sharedService.deleteCommand(this.deleteCommandModal).subscribe(() => {
            this.sharedService
                .countStatusBank(
                    this.userService.appData.userData.companySelect.companyId
                )
                .subscribe((res) => {
                    this.countStatusData =
                        res.body && res.body.length ? res.body[0] : null;
                });
            this.deleteCommandModal = false;
            const showChildren = this.journalTransData
                .filter((fd) => fd.showChildren)
                .map((it) => it.ocrExportFileId);
            this.getExportFiles(true, showChildren);
        });
    }

    deleteCommandRowSend() {
        this.sharedService
            .deleteCommand(this.deleteCommandRowModal)
            .subscribe(() => {
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                this.deleteCommandRowModal = false;
                const showChildren = this.journalTransData
                    .filter((fd) => fd.showChildren)
                    .map((it) => it.ocrExportFileId);
                this.getExportFiles(true, showChildren);
            });
    }

    deleteFile(): void {
        this.fileToRemove = false;
        this.journalTransComponent.reportService.postponed = {
            action: this.sharedService.deleteCommand({
                uuids:
                    this.showFloatNav && this.showFloatNav.selcetedFiles.length
                        ? this.showFloatNav.selcetedFiles.map((file) => file.paymentId)
                        : [null]
            }),
            message: this.journalTransComponent.sanitizer.bypassSecurityTrustHtml(
                this.showFloatNav && this.showFloatNav.selcetedFiles.length === 1
                    ? 'הפקודה נמחקה בהצלחה'
                    : this.showFloatNav.selcetedFiles.length + ' פקודות נמחקו בהצלחה'
            ),
            fired: false
        };
        timer(3000)
            .pipe(
                switchMap(() => {
                    if (
                        this.journalTransComponent.reportService.postponed &&
                        this.journalTransComponent.reportService.postponed.action
                    ) {
                        return this.journalTransComponent.reportService.postponed.action;
                    } else {
                        return EMPTY;
                    }
                }),
                tap(() => {
                    this.journalTransComponent.reportService.postponed.fired = true;
                }),
                take(1)
            )
            .subscribe(() => {
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                this.showFloatNav = false;
                const showChildren = this.journalTransData
                    .filter((fd) => fd.showChildren)
                    .map((it) => it.ocrExportFileId);
                this.getExportFiles(true, showChildren);
            });
    }

    cancelExportFileFor(parent: any) {
        if (this.exportFileCancelPrompt && this.exportFileCancelPrompt.visible) {
            this.exportFileCancelPrompt.visible = false;
        }

        this.exportFileCancelPrompt = {
            visible: true,
            pending: false,
            prompt: parent.downloadUser,
            approve: () => {
                if (
                    this.exportFileCancelPrompt.approveSubscription &&
                    !this.exportFileCancelPrompt.approveSubscription.closed
                ) {
                    return;
                }

                this.exportFileCancelPrompt.pending = true;
                this.exportFileCancelPrompt.approveSubscription = this.sharedService
                    .exportFileCancelFile(parent.ocrExportFileId)
                    .pipe(
                        first(),
                        finalize(() => (this.exportFileCancelPrompt.pending = false))
                    )
                    .subscribe((value) => {
                        this.exportFileCancelPrompt.visible = false;
                        this.startChild();
                    });
            },
            decline: () => {
                this.exportFileCancelPrompt.visible = false;
            }
        };
    }

    createExportFileFor(parent: any) {
        if (!this.userService.appData || !this.userService.appData.folderState) {
            return;
        }

        this.ocrExportFileId = parent.ocrExportFileId;
        if (this.userService.appData.folderState === 'OK') {
            if (parent.createExportFileSub) {
                return;
            }
            parent.createExportFileSub = this.sharedService
                .exportFileCreateFolder(parent.ocrExportFileId)
                .pipe(
                    first(),
                    finalize(() => (parent.createExportFileSub = null))
                )
                .subscribe((value) => {
                    this.responseRestPath = value ? value['body'] : value;
                    if (!this.responseRestPath) {
                        this.startChild();
                    } else {
                        this.showModalCheckFolderFile = true;
                        const checkFolderFile = setInterval(() => {
                            if (this.showModalCheckFolderFile !== true) {
                                clearInterval(checkFolderFile);
                            } else {
                                this.sharedService
                                    .checkFolderFile(parent.ocrExportFileId)
                                    .subscribe((res) => {
                                        if (res && res.body && res.body !== 'NOT_DONE') {
                                            this.showModalCheckFolderFile = res.body;
                                            clearInterval(checkFolderFile);
                                            if (
                                                res.body === 'ERROR' &&
                                                !this.userService.appData.isAdmin
                                            ) {
                                                this.sharedService
                                                    .folderError({
                                                        companyId:
                                                        this.userService.appData.userData.companySelect
                                                            .companyId,
                                                        ocrExportFileId: parent.ocrExportFileId
                                                    })
                                                    .subscribe((value) => {
                                                    });
                                            }
                                        }
                                    });
                            }
                        }, 5000);
                    }
                });

            this.docsfile = null;

            this.exportFileFolderCreatePrompt = {
                onAnchorClick(): void {
                },
                onHide(): void {
                },
                pending: false,
                prompt: '',
                visible: false,
                cancelFile: () => {
                    this.showModalCheckFolderFile = false;
                    this.sharedService
                        .cancelFile(parent.ocrExportFileId)
                        .subscribe((res) => {
                        });
                },
                manualDownloadLink: () => {
                    this.enabledDownloadLink = false;
                    // if (docsfile) {
                    //     this.saveFileToDisk(docsfile.docfile, docsfile.paramsfile).then((resData) => {
                    //         this.exportFileFolderCreatePrompt.visible = false;
                    //         this.startChild();
                    //     });
                    // }
                }
            };
        } else if (this.userService.appData.folderState === 'NOT_OK') {
            if (!this.userService.appData.isAdmin) {
                this.sharedService
                    .folderError({
                        companyId: this.userService.appData.userData.companySelect.companyId
                    })
                    .subscribe((value) => {
                    });
            }
            this.docsfile = null;

            this.exportFileFolderCreatePrompt = {
                visible: true,
                pending: false,
                onAnchorClick: () => {
                    let counter = 0;
                    this.exportFileFolderCreatePrompt.pending = true;
                    this.exportFileFolderCreatePrompt.approveSubscription = timer(
                        500,
                        30 * 1000
                    )
                        .pipe(
                            tap(() => counter++),
                            switchMap(() =>
                                this.sharedService
                                    .exporterFolderState()
                                    .pipe(
                                        map((response: any) =>
                                            response && !response.error ? response.body : response
                                        )
                                    )
                            ),
                            takeWhileInclusive(
                                (response: any) =>
                                    response != null &&
                                    !response.error &&
                                    response.folderState !== 'OK' &&
                                    counter < 10 &&
                                    this.exportFileFolderCreatePrompt &&
                                    this.exportFileFolderCreatePrompt.visible
                            ),
                            finalize(
                                () => (this.exportFileFolderCreatePrompt.pending = false)
                            )
                        )
                        .subscribe((response: any) => {
                            this.userService.appData.countStatusData =
                                response && !!response.exporterState
                                    ? response.exporterState
                                    : null;
                            this.userService.appData.folderState =
                                response && !!response.folderState
                                    ? response.folderState
                                    : null;
                        });
                },
                onHide: () => {
                    if (
                        this.userService.appData.folderState === 'OK' &&
                        this.exportFileFolderCreatePrompt.approveSubscription &&
                        this.exportFileFolderCreatePrompt.approveSubscription.closed
                    ) {
                        parent.createExportFileSub = this.sharedService
                            .exportFileCreateFolder(parent.ocrExportFileId)
                            .pipe(
                                first(),
                                finalize(() => (parent.createExportFileSub = null))
                            )
                            .subscribe((value) => {
                                this.responseRestPath = value ? value['body'] : value;
                                if (!this.responseRestPath) {
                                    this.startChild();
                                } else {
                                    this.showModalCheckFolderFile = true;
                                    const checkFolderFile = setInterval(() => {
                                        if (this.showModalCheckFolderFile !== true) {
                                            clearInterval(checkFolderFile);
                                        } else {
                                            this.sharedService
                                                .checkFolderFile(parent.ocrExportFileId)
                                                .subscribe((res) => {
                                                    if (res && res.body && res.body !== 'NOT_DONE') {
                                                        this.showModalCheckFolderFile = res.body;
                                                        clearInterval(checkFolderFile);
                                                        if (
                                                            res.body === 'ERROR' &&
                                                            !this.userService.appData.isAdmin
                                                        ) {
                                                            this.sharedService
                                                                .folderError({
                                                                    companyId:
                                                                    this.userService.appData.userData
                                                                        .companySelect.companyId,
                                                                    ocrExportFileId: parent.ocrExportFileId
                                                                })
                                                                .subscribe((value) => {
                                                                });
                                                        }
                                                    }
                                                });
                                        }
                                    }, 5000);
                                }
                            });
                    }
                },
                prompt: null,
                cancelFile: () => {
                    this.showModalCheckFolderFile = false;
                    this.sharedService
                        .cancelFile(parent.ocrExportFileId)
                        .subscribe((res) => {
                        });
                },
                manualDownloadLink: () => {
                    this.enabledDownloadLink = false;
                    // if (docsfile) {
                    //     this.saveFileToDisk(docsfile.docfile, docsfile.paramsfile).then((resData) => {
                    //         this.exportFileFolderCreatePrompt.visible = false;
                    //         this.startChild();
                    //     });
                    // }
                }
            };
        } else if (this.userService.appData.folderState === 'NOT_EXIST') {
            this.docsfile = null;

            this.exportFileFolderCreatePrompt = {
                visible: true,
                pending: false,
                onAnchorClick: () => {
                    let counter = 0;
                    this.exportFileFolderCreatePrompt.pending = true;
                    this.exportFileFolderCreatePrompt.approveSubscription = timer(
                        500,
                        30 * 1000
                    )
                        .pipe(
                            tap(() => counter++),
                            switchMap(() =>
                                this.sharedService
                                    .exporterFolderState()
                                    .pipe(
                                        map((response: any) =>
                                            response && !response.error ? response.body : response
                                        )
                                    )
                            ),
                            takeWhileInclusive(
                                (response: any) =>
                                    response != null &&
                                    !response.error &&
                                    response.folderState !== 'OK' &&
                                    counter < 10 &&
                                    this.exportFileFolderCreatePrompt &&
                                    this.exportFileFolderCreatePrompt.visible
                            ),
                            finalize(() => {
                                this.exportFileFolderCreatePrompt.pending = false;
                                if (
                                    this.userService.appData.folderState === 'OK' &&
                                    this.exportFileFolderCreatePrompt.visible
                                ) {
                                    this.exportFileFolderCreatePrompt.visible = false;
                                }
                            })
                        )
                        .subscribe((response: any) => {
                            this.userService.appData.countStatusData =
                                response && !!response.exporterState
                                    ? response.exporterState
                                    : null;
                            this.userService.appData.folderState =
                                response && !!response.folderState
                                    ? response.folderState
                                    : null;
                        });
                },
                onHide: () => {
                    if (
                        this.userService.appData.folderState === 'OK' &&
                        this.exportFileFolderCreatePrompt.approveSubscription &&
                        this.exportFileFolderCreatePrompt.approveSubscription.closed
                    ) {
                        parent.createExportFileSub = this.sharedService
                            .exportFileCreateFolder(parent.ocrExportFileId)
                            .pipe(
                                first(),
                                finalize(() => (parent.createExportFileSub = null))
                            )
                            .subscribe((value) => {
                                this.responseRestPath = value ? value['body'] : value;
                                if (!this.responseRestPath) {
                                    this.startChild();
                                } else {
                                    this.showModalCheckFolderFile = true;
                                    const checkFolderFile = setInterval(() => {
                                        if (this.showModalCheckFolderFile !== true) {
                                            clearInterval(checkFolderFile);
                                        } else {
                                            this.sharedService
                                                .checkFolderFile(parent.ocrExportFileId)
                                                .subscribe((res) => {
                                                    if (res && res.body && res.body !== 'NOT_DONE') {
                                                        this.showModalCheckFolderFile = res.body;
                                                        clearInterval(checkFolderFile);
                                                        if (
                                                            res.body === 'ERROR' &&
                                                            !this.userService.appData.isAdmin
                                                        ) {
                                                            this.sharedService
                                                                .folderError({
                                                                    companyId:
                                                                    this.userService.appData.userData
                                                                        .companySelect.companyId,
                                                                    ocrExportFileId: parent.ocrExportFileId
                                                                })
                                                                .subscribe((value) => {
                                                                });
                                                        }
                                                    }
                                                });
                                        }
                                    }, 5000);
                                }
                            });
                    }
                },
                prompt: null,
                cancelFile: () => {
                    this.showModalCheckFolderFile = false;
                    this.sharedService
                        .cancelFile(parent.ocrExportFileId)
                        .subscribe((res) => {
                        });
                },
                manualDownloadLink: () => {
                    this.enabledDownloadLink = false;
                    // if (docsfile) {
                    //     this.saveFileToDisk(docsfile.docfile, docsfile.paramsfile).then((resData) => {
                    //         this.exportFileFolderCreatePrompt.visible = false;
                    //         this.startChild();
                    //     });
                    // }
                }
            };
        }
    }

    getExportFiles(isReset?: boolean, showChildren?: any): void {
        // if (!isReset) {
        //     this.resetVars();
        // }
        this.companyFilesSortControl = new FormControl({
            orderBy: 'invoiceDate',
            order: 'DESC'
        });
        this.loader = true;
        if (
            this.userService.appData.userData &&
            this.userService.appData.userData.creditCards
        ) {
            this.sharedService
                .getExportFilesBank(
                    this.userService.appData.userData.companySelect.companyId
                )
                .subscribe(
                    (response: any) => {
                        // const aaa = [{
                        //     'ocrExportFileId': '82acfcee-4fbd-4682-a39b-2acdee0106b4',
                        //     'vatDateFrom': null,
                        //     'vatDateTill': null,
                        //     'status': 'CREATE_JOURNAL_TRANS',
                        //     'dateLastModified': 1620032008408,
                        //     'dateCreated': 1619516836879,
                        //     'fileType': 'BANK_AND_CREDIT',
                        //     'numOfBankData': 6,
                        //     'numOfCreditData': 9,
                        //     'batchNumber': null,
                        //     'dateAllow': null,
                        //     'downloadUserId': null,
                        //     'collapseText': null,
                        //     'transData': [{
                        //         'paymentId': 'c07bb867-66a9-2508-e053-0b6519ac3d46',
                        //         'paymentType': 'BANK_TRANS',
                        //         'companyAccountId': 'acbd7a9c-3be5-6c47-e053-0b6519ac4bf8',
                        //         'creditCardId': null,
                        //         'izuCustId': '410434',
                        //         'invoiceDate': 1618779600000,
                        //         'sugTnua': null,
                        //         'total': 1775,
                        //         'hova': true,
                        //         'custId': '410434',
                        //         'details': 'העברה לשרמן זקלין או אהרן-שרות הנדסה',
                        //         'splitNum': null
                        //     }]
                        // }];
                        let arrCards = [];
                        this.userService.appData.userData.creditCards.forEach((id) => {
                            arrCards = arrCards.concat(id.children);
                        });
                        this.journalTransDataSave = response ? response['body'] : response;
                        if (Array.isArray(this.journalTransDataSave)) {
                            for (const gr of this.journalTransDataSave) {
                                const total = gr.transData.reduce(
                                    (am, item) => am + Number(item.total),
                                    0
                                );
                                gr.total = Math.round(total);

                                const dateFrom = new Date(gr.dateCreated);
                                const dateTo = new Date();
                                const diffMonths =
                                    dateTo.getMonth() -
                                    dateFrom.getMonth() +
                                    12 * (dateTo.getFullYear() - dateFrom.getFullYear());
                                gr.dateCreatedOld = diffMonths > 6;

                                for (const fd of gr.transData) {
                                    fd.parent = Object.assign(JSON.parse(JSON.stringify(gr)), {
                                        transData: null
                                    });
                                    fd.status = gr.status;
                                    fd.sugTnuaTooltip = fd.sugTnua
                                        ? this.getTooltipName(fd.sugTnua)
                                        : null;
                                    fd.cardAccName = fd.creditCardId
                                        ? arrCards.find(
                                            (acc: any) => acc.creditCardId === fd.creditCardId
                                        )
                                            ? arrCards.find(
                                                (acc: any) => acc.creditCardId === fd.creditCardId
                                            ).creditCardNickname
                                            : this.userService.appData.userData.accounts.find(
                                                (acc: any) => acc.companyAccountId === fd.companyAccountId
                                            )
                                                ? this.userService.appData.userData.accounts.find(
                                                    (acc: any) => acc.companyAccountId === fd.companyAccountId
                                                ).accountNickname
                                                : null
                                        : this.userService.appData.userData.accounts.find(
                                            (acc: any) => acc.companyAccountId === fd.companyAccountId
                                        )
                                            ? this.userService.appData.userData.accounts.find(
                                                (acc: any) => acc.companyAccountId === fd.companyAccountId
                                            ).accountNickname
                                            : null;
                                    // if (this.customerCustList.length && fd.custId) {
                                    //     const custFromList = this.customerCustList.find(cust => cust.custId === fd.custId);
                                    //     fd.cust = custFromList ? custFromList : null;
                                    //     fd.custName = custFromList ? custFromList.cartisName : '-';
                                    // } else {
                                    //     fd.cust = null;
                                    //     fd.custName = fd.custId ? fd.custId : '-';
                                    // }

                                    let custId =
                                        fd.custId && this.customerCustList
                                            ? this.customerCustList.find(
                                                (custIdxRec) => custIdxRec.custId === fd.custId
                                            )
                                            : null;
                                    if (!custId && fd.custId && this.customerCustList) {
                                        custId = {
                                            cartisName: fd.custId,
                                            cartisCodeId: null,
                                            custId: fd.custId,
                                            lName: null,
                                            hp: null,
                                            id: null,
                                            pettyCash: false,
                                            supplierTaxDeduction: null,
                                            customerTaxDeduction: null
                                        };
                                        this.customerCustList.push(custId);
                                    }
                                    fd.cust = custId;
                                    fd.custName = custId ? custId.cartisName : 'בחירה';
                                    fd.custIdCards =
                                        fd.custId &&
                                        fd.custId.toString().includes('כרטיסים מרובים');
                                }
                                gr.showChildren = showChildren
                                    ? showChildren.some((it) => it === gr.ocrExportFileId)
                                    : false;
                            }
                            this.journalTransDataSave = JSON.parse(
                                JSON.stringify(
                                    this.journalTransDataSave.filter((gr) => gr.transData.length)
                                )
                            );
                        } else {
                            this.journalTransDataSave = [];
                        }
                        if (this.journalTransDataSave && this.journalTransDataSave.length) {
                            this.filterInput.enable({
                                emitEvent: false,
                                onlySelf: true
                            });
                        } else {
                            this.filterInput.disable({
                                emitEvent: false,
                                onlySelf: true
                            });
                        }
                        this.journalTransData = JSON.parse(
                            JSON.stringify(this.journalTransDataSave)
                        );

                        this.filtersAllJournalTransData();
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

    filtersAllJournalTransData(priority?: any, isSorted?: boolean): void {
        // const aaa = [{
        //     'ocrExportFileId': '82acfcee-4fbd-4682-a39b-2acdee0106b4',
        //     'vatDateFrom': null,
        //     'vatDateTill': null,
        //     'status': 'CREATE_JOURNAL_TRANS',
        //     'dateLastModified': 1620032008408,
        //     'dateCreated': 1619516836879,
        //     'fileType': 'BANK_AND_CREDIT',
        //     'numOfBankData': 6,
        //     'numOfCreditData': 9,
        //     'batchNumber': null,
        //     'dateAllow': null,
        //     'downloadUserId': null,
        //     'collapseText': null,
        //     'transData': [{
        //         'paymentId': 'c07bb867-66a9-2508-e053-0b6519ac3d46',
        //         'paymentType': 'BANK_TRANS',
        //         'companyAccountId': 'acbd7a9c-3be5-6c47-e053-0b6519ac4bf8',
        //         'creditCardId': null,
        //         'izuCustId': '410434',
        //         'invoiceDate': 1618779600000,
        //         'sugTnua': null,
        //         'total': 1775,
        //         'hova': true,
        //         'custId': '410434',
        //         'details': 'העברה לשרמן זקלין או אהרן-שרות הנדסה',
        //         'splitNum': null
        //     }]
        // }];

        if (
            this.journalTransDataSave &&
            Array.isArray(this.journalTransDataSave) &&
            this.journalTransDataSave.length
        ) {
            this.journalTransData = JSON.parse(
                JSON.stringify(this.journalTransDataSave)
            );
            this.journalTransData = !this.queryString
                ? this.journalTransData
                : this.journalTransData.filter((fd) => {
                    fd.transData = fd.transData.filter((fdChild) => {
                        return [
                            fdChild.splitNum,
                            fdChild.custId,
                            fdChild.sugTnua,
                            fdChild.details,
                            fdChild.total,
                            this.sumPipe.transform(fdChild.total),
                            fdChild.izuCustId,
                            fdChild.cardAccName,
                            this.dtPipe.transform(fdChild.invoiceDate, 'dd/MM/y')
                        ]
                            .filter(
                                (v) => (typeof v === 'string' || typeof v === 'number') && !!v
                            )
                            .some((vstr) =>
                                vstr
                                    .toString()
                                    .toUpperCase()
                                    .includes(this.queryString.toUpperCase())
                            );
                    });
                    if (fd.transData.length) {
                        fd.showChildren = true;
                        return fd;
                    }
                });

            if (this.journalTransData.length) {
                switch (this.companyFilesSortControl.value.orderBy) {
                    case 'invoiceDate':
                    case 'total':
                        // noinspection DuplicatedCode
                        this.journalTransData = this.journalTransData.filter((item) => {
                            const notNumber = item.transData.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'number'
                            );
                            item.transData = item.transData
                                .filter(
                                    (fd) =>
                                        typeof fd[this.companyFilesSortControl.value.orderBy] ===
                                        'number'
                                )
                                .sort((a, b) => {
                                    const lblA = a[this.companyFilesSortControl.value.orderBy],
                                        lblB = b[this.companyFilesSortControl.value.orderBy];
                                    return lblA || lblB
                                        ? !lblA
                                            ? 1
                                            : !lblB
                                                ? -1
                                                : this.companyFilesSortControl.value.order === 'ASC'
                                                    ? lblA - lblB
                                                    : lblB - lblA
                                        : 0;
                                })
                                .concat(notNumber);
                            return item;
                        });
                        break;
                    case 'sugTnua':
                    case 'details':
                    case 'izuCustId':
                    case 'custId':
                    case 'cardAccName':
                        // noinspection DuplicatedCode
                        this.journalTransData = this.journalTransData.filter((item) => {
                            const notString = item.transData.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'string'
                            );
                            item.transData = item.transData
                                .filter(
                                    (fd) =>
                                        typeof fd[this.companyFilesSortControl.value.orderBy] ===
                                        'string'
                                )
                                .sort((a, b) => {
                                    const lblA = a[this.companyFilesSortControl.value.orderBy],
                                        lblB = b[this.companyFilesSortControl.value.orderBy];
                                    return (
                                        (lblA || lblB
                                            ? !lblA
                                                ? 1
                                                : !lblB
                                                    ? -1
                                                    : lblA.localeCompare(lblB)
                                            : 0) *
                                        (this.companyFilesSortControl.value.order === 'DESC'
                                            ? -1
                                            : 1)
                                    );
                                })
                                .concat(notString);
                            return item;
                        });
                        break;
                }

                if (this.fileIdToScroll) {
                    const fileIdToScroll = this.fileIdToScroll;
                    this.fileIdToScroll = null;
                    this.journalTransData.forEach((it) => {
                        it.showChildren = it.transData.some(
                            (file) => file.fileId === fileIdToScroll
                        );
                    });
                }
            }

            const selcetedFiles = this.journalTransData
                .flatMap((fd) => fd.transData)
                .filter((it) => it.selcetFile);
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedFilesEnabled: selcetedFiles.every(
                        (file) =>
                            !(
                                (file.status === 'CREATE_JOURNAL_TRANS' &&
                                    file.parent.collapseText) ||
                                file.status === 'JOURNAL_TRANS_PROCESS' ||
                                file.status === 'TEMP_COMMAND' ||
                                file.status === 'PERMANENT_COMMAND'
                            )
                    )
                };
            } else {
                this.showFloatNav = false;
            }
        } else {
            this.journalTransData = [];
        }
        let allTransData = [];
        this.journalTransData.forEach((it, idxs) => {
            const parentObj = JSON.parse(JSON.stringify(it));
            parentObj.idx = idxs;
            allTransData.push(
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {
                    transData: null
                })
            );

            if (!parentObj.showChildren) {
                parentObj.transData = [];
            } else {
                parentObj.transData.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = idx1;
                });
            }
            allTransData = allTransData.concat(parentObj.transData);
        });
        this.allTransData = allTransData;
        // console.log(allTransData);

        this.loader = false;
    }

    colsAct(parent, idx): void {
        parent.showChildren = !parent.showChildren;
        this.journalTransDataSave[idx].showChildren = parent.showChildren;
        console.log('parent.showChildren', parent.showChildren);
        // setTimeout(() => {

        this.checkSelectedJournalTransData();
        let allTransData = [];
        this.journalTransData.forEach((it, idxs) => {
            const parentObj = JSON.parse(JSON.stringify(it));
            parentObj.idx = idxs;
            allTransData.push(
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {
                    transData: null
                })
            );

            if (!parentObj.showChildren) {
                parentObj.transData = [];
            } else {
                parentObj.transData.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = idx1;
                });
            }
            allTransData = allTransData.concat(parentObj.transData);
        });
        this.allTransData = allTransData;
        // console.log(allTransData);
        // }, 0);
    }

    checkAllChildSelectedJournalTransData(parent: any): void {
        parent.transData.forEach((it) => {
            it.selcetFile = parent.selcetFiles;
        });
    }

    async saveFileToDisk(url: any, url2: any): Promise<any> {
        return new Promise(async (resolve, reject) => {
            try {
                const writeURLToFile = async (fileHandle: any, res: any) => {
                    const writable = await fileHandle.createWritable();
                    await res.body['pipeTo'](writable);
                };
                const response = await fetch(url);
                const response2 = await fetch(url2);
                const pathUrl = url.split('/');
                const suggestedName = pathUrl[pathUrl.length - 1].split('?')[0];
                const fileHandlerPicker = await window['showSaveFilePicker']({
                    id: 'file1',
                    startIn: 'downloads',
                    suggestedName: suggestedName,
                    types: [
                        {
                            description: 'File'
                        }
                    ]
                });
                writeURLToFile(fileHandlerPicker, response).then(async () => {
                    console.log('FILE 1 DOWNLOADED!!!');
                    const pathUrl2 = url2.split('/');
                    const suggestedName2 = pathUrl2[pathUrl2.length - 1].split('?')[0];
                    const fileHandlerPicker2 = await window['showSaveFilePicker']({
                        id: 'file1',
                        suggestedName: suggestedName2,
                        types: [
                            {
                                description: 'File'
                            }
                        ]
                    });
                    writeURLToFile(fileHandlerPicker2, response2).then(() => {
                        console.log('FILE 2 DOWNLOADED!!!');
                        resolve(true);
                    });
                });
            } catch (error) {
                console.log(error);
                resolve(false);
            }
        });
    }

    checkSelectedJournalTransData(): void {
        this.journalTransDataSave.forEach((item, index) => {
            item.selcetFiles =
                item.transData.filter((it) => it.selcetFile).length ===
                item.transData.length;
        });
        this.journalTransData.forEach((item, index) => {
            item.selcetFiles =
                item.transData.filter((it) => it.selcetFile).length ===
                item.transData.length;
        });

        const selcetedFiles = this.journalTransData
            .flatMap((fd) => fd.transData)
            .filter((it) => it.selcetFile);
        if (selcetedFiles.length > 1) {
            this.showFloatNav = {
                selcetedFiles,
                selcetedFilesEnabled: selcetedFiles.every(
                    (file) =>
                        !(
                            (file.status === 'CREATE_JOURNAL_TRANS' &&
                                file.parent.collapseText) ||
                            file.status === 'JOURNAL_TRANS_PROCESS' ||
                            file.status === 'TEMP_COMMAND' ||
                            file.status === 'PERMANENT_COMMAND'
                        )
                )
            };
        } else {
            this.showFloatNav = false;
        }
    }

    trackByIdJournalTransData(index: number, row: any): number {
        return row.idx;
    }

    getCompanyDocumentsData(): void {
    }

    filterDates(paramDate: any, saveFilter?: boolean): void {
        this.selcetAllFiles = false;
        this.loader = true;

        this.showFloatNav = false;
        this.queryString = '';
        // this.bankDetails = false;
        this.bankDetailsSave = false;
        // this.filterLink = 'all';
        // this.companyFilesSortControl = new FormControl({
        //     orderBy: 'transDate',
        //     order: 'DESC'
        // });
        this.transTypeDefinedZhut = [];
        this.transTypeDefinedHova = [];

        // this.statusArr = [];
        // this.filterTypesStatus = null;
        // this.paymentDescArr = [];
        // this.transTypeCodeArr = [];
        // this.filterTransTypeCode = null;
        // this.filterTypesPaymentDesc = null;
        // this.hovaArr = [];
        // this.filterTypesHova = null;
        // this.currentPage = 0;
        // this.entryLimit = 50;

        if (
            this.userService.appData &&
            this.userService.appData.userData &&
            this.userService.appData.userData.companySelect
        ) {
            this.sharedService
                .transTypeDefined({
                    uuid: this.userService.appData.userData.companySelect.companyId
                })
                .subscribe((transTypeDefinedRes) => {
                    const transTypeDefined =
                        transTypeDefinedRes && !transTypeDefinedRes.error
                            ? transTypeDefinedRes.body
                            : [];
                    if (transTypeDefined && transTypeDefined.length) {
                        const zhutFirst = transTypeDefined
                            .filter(
                                (it) => it.transTypeClass === 'RECEIPT' && it.zikui === false
                            )
                            .map((item) => {
                                return {
                                    maamPrc: item.maamPrc,
                                    custId: item.custId,
                                    oppositeCustId: item.oppositeCustId,
                                    paymentNikui: item.totalMaam,
                                    taxDeductionCustId: item.custMaamId,
                                    zikui: item.zikui,
                                    onlyName: item.transTypeCode.includes('BIZ_'),
                                    label: item.transTypeName,
                                    value: item.transTypeCode,
                                    precenf: item.precenf
                                };
                            });
                        const zhutEnd = transTypeDefined
                            .filter(
                                (it) => it.transTypeClass === 'PAYMENTS' && it.zikui === true
                            )
                            .map((item) => {
                                return {
                                    maamPrc: item.maamPrc,
                                    custId: item.custId,
                                    oppositeCustId: item.oppositeCustId,
                                    paymentNikui: item.totalMaam,
                                    taxDeductionCustId: item.custMaamId,
                                    zikui: item.zikui,
                                    onlyName: item.transTypeCode.includes('BIZ_'),
                                    label: item.transTypeName,
                                    value: item.transTypeCode,
                                    precenf: item.precenf
                                };
                            });
                        this.transTypeDefinedZhut = [...zhutFirst, ...zhutEnd];

                        const hovaFirst = transTypeDefined
                            .filter(
                                (it) => it.transTypeClass === 'PAYMENTS' && it.zikui === false
                            )
                            .map((item) => {
                                return {
                                    maamPrc: item.maamPrc,
                                    custId: item.custId,
                                    oppositeCustId: item.oppositeCustId,
                                    paymentNikui: item.totalMaam,
                                    taxDeductionCustId: item.custMaamId,
                                    zikui: item.zikui,
                                    onlyName: item.transTypeCode.includes('BIZ_'),
                                    label: item.transTypeName,
                                    value: item.transTypeCode,
                                    precenf: item.precenf
                                };
                            });
                        const hovaEnd = transTypeDefined
                            .filter(
                                (it) => it.transTypeClass === 'RECEIPT' && it.zikui === true
                            )
                            .map((item) => {
                                return {
                                    maamPrc: item.maamPrc,
                                    custId: item.custId,
                                    oppositeCustId: item.oppositeCustId,
                                    paymentNikui: item.totalMaam,
                                    taxDeductionCustId: item.custMaamId,
                                    zikui: item.zikui,
                                    onlyName: item.transTypeCode.includes('BIZ_'),
                                    label: item.transTypeName,
                                    value: item.transTypeCode,
                                    precenf: item.precenf
                                };
                            });
                        this.transTypeDefinedHova = [...hovaFirst, ...hovaEnd];
                    }

                    if (
                        this.userService.appData &&
                        this.userService.appData.userData &&
                        this.userService.appData.userData.companySelect &&
                        !this.customerCustList.length
                    ) {
                        // this.sharedService.general({
                        //     'uuid': this.userService.appData.userData.companySelect.companyId,
                        // }).subscribe((response:any) => {
                        //     const responseRest = (response) ? response['body'] : response;
                        //     this.report856 = responseRest.report856;
                        // });

                        // this.sharedService.bankJournal({
                        //     uuid: this.userService.appData.userData.companySelect.companyId,
                        // }).subscribe(() => {
                        //
                        // });

                        this.companyGetCustomerList(true, paramDate, saveFilter);
                    } else {
                        this.getData(paramDate, saveFilter);
                    }
                });
        }
    }

    addPriemerObject(arr: any, existValue: any) {
        if (arr && arr.length && existValue) {
            return [
                {
                    maamPrc: null,
                    precenf: null,
                    custId: null,
                    oppositeCustId: null,
                    paymentNikui: null,
                    taxDeductionCustId: null,
                    onlyName: true,
                    zikui: null,
                    label: 'ביטול בחירה',
                    value: null
                },
                ...arr
            ];
        } else {
            return arr;
        }
    }

    public changeDatesFrequencyDesc(type: string): void {
        if (type === 'sendDateFrom' || type === 'sendDateTill') {
            const dateFrom = this.advancedSearchParams
                .get('sendDateFrom')
                .value.getTime();
            const dateTill = this.advancedSearchParams
                .get('sendDateTill')
                .value.getTime();
            if (type === 'sendDateFrom') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('sendDateTill')
                        .setValue(this.advancedSearchParams.get('sendDateFrom').value);
                }
            } else if (type === 'sendDateTill') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('sendDateFrom')
                        .setValue(this.advancedSearchParams.get('sendDateTill').value);
                }
            }
        } else if (type === 'invoiceDateFrom' || type === 'invoiceDateTill') {
            const dateFrom = this.advancedSearchParams
                .get('invoiceDateFrom')
                .value.getTime();
            const dateTill = this.advancedSearchParams
                .get('invoiceDateTill')
                .value.getTime();
            if (type === 'invoiceDateFrom') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('invoiceDateTill')
                        .setValue(this.advancedSearchParams.get('invoiceDateFrom').value);
                }
            } else if (type === 'invoiceDateTill') {
                if (dateFrom > dateTill) {
                    this.advancedSearchParams
                        .get('invoiceDateFrom')
                        .setValue(this.advancedSearchParams.get('invoiceDateTill').value);
                }
            }
        }
    }

    togglePanel1() {
        // if (!this.showPanelDD) {
        //
        // }
        this.showPanelDD1 = !this.showPanelDD1;
    }

    clearFilter1(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    search1() {
        // if (
        //     (this.advancedSearchParams1.get('sendDateFrom').value && !this.advancedSearchParams1.get('sendDateTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('sendDateFrom').value && this.advancedSearchParams1.get('sendDateTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('invoiceDateFrom').value && !this.advancedSearchParams1.get('invoiceDateTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('invoiceDateFrom').value && this.advancedSearchParams1.get('invoiceDateTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('totalBeforeMaamFrom').value && this.advancedSearchParams1.get('totalbeforeMaamTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('totalBeforeMaamFrom').value && !this.advancedSearchParams1.get('totalbeforeMaamTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('totalIncludeMaamFrom').value && this.advancedSearchParams1.get('totalIncludeMaamTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('totalIncludeMaamFrom').value && !this.advancedSearchParams1.get('totalIncludeMaamTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('supplierHp').value && this.advancedSearchParams1.get('supplierHp').errors && (this.advancedSearchParams1.get('supplierHp').errors.idILInvalid || this.advancedSearchParams1.get('supplierHp').errors.minlength))
        //     ||
        //     (this.advancedSearchParams1.get('batchNumber').value && this.advancedSearchParams1.get('batchNumber').errors)
        //     ||
        //     (!this.advancedSearchParams1.get('custFrom').value && this.advancedSearchParams1.get('custTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('custFrom').value && !this.advancedSearchParams1.get('custTill').value)
        // ) {
        //     return;
        // }
        //
        // if (this.advancedSearchParams1.get('invoiceDateFrom').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         invoiceDateFrom: null
        //     });
        // }
        // if (this.advancedSearchParams1.get('invoiceDateTill').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         invoiceDateTill: null
        //     });
        // }
        // if (this.advancedSearchParams1.get('sendDateFrom').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         sendDateFrom: null
        //     });
        // }
        // if (this.advancedSearchParams1.get('sendDateTill').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         sendDateTill: null
        //     });
        // }
        this.togglePanel1();
        console.log(this.advancedSearchParams1);
        this.selectedParamsForSearch1();
    }

    selectedParamsForSearch1() {
        // const arrOfKeys = Object.keys(this.advancedSearchParams1.value);
        // this.valuesExistStr = arrOfKeys.filter(it => (it !== 'invoiceDateFrom' && it !== 'invoiceDateTill' && it !== 'sendDateFrom' && it !== 'sendDateTill') && event.value[it])
        //     .map(key => typeof (event.value[key]) === 'boolean' ? (key === 'niklat' ? 'סטטוס נקלט' : 'סטטוס ממתין לקליטה') :
        //         (typeof (event.value[key]) === 'object' ? event.value[key].custId : event.value[key]))
        //     .reverse()
        //     .join(', ');
        //
        // this.invoiceDateFilterData.fromDate = this.advancedSearchParams.get('invoiceDateFrom').value;
        // this.invoiceDateFilterData.toDate = this.advancedSearchParams.get('invoiceDateTill').value;
        // this.sendDateFilterData.fromDate = this.advancedSearchParams.get('sendDateFrom').value;
        // this.sendDateFilterData.toDate = this.advancedSearchParams.get('sendDateTill').value;
        //
        // if (this.archivesDateChildren.length) {
        //     const invoiceDateFilterData = this.archivesDateChildren.last;
        //     if (this.invoiceDateFilterData.fromDate) {
        //         const mmntNow = this.userService.appData.moment(this.invoiceDateFilterData.fromDate);
        //         const mmntPlus30d = this.userService.appData.moment(this.invoiceDateFilterData.toDate);
        //         invoiceDateFilterData.customDatesPreset.from = new RangePoint(
        //             mmntNow.date(),
        //             mmntNow.month(),
        //             mmntNow.year());
        //         invoiceDateFilterData.customDatesPreset.till = new RangePoint(
        //             mmntPlus30d.date(),
        //             mmntPlus30d.month(),
        //             mmntPlus30d.year());
        //         invoiceDateFilterData.selectedPresetFromArchiveSearch = invoiceDateFilterData.customDatesPreset;
        //     } else {
        //         invoiceDateFilterData.selectedPresetFromArchiveSearch = null;
        //     }
        //
        //     const sendDateFilterData = this.archivesDateChildren.first;
        //     if (this.sendDateFilterData.fromDate) {
        //         const mmntNow = this.userService.appData.moment(this.sendDateFilterData.fromDate);
        //         const mmntPlus30d = this.userService.appData.moment(this.sendDateFilterData.toDate);
        //         sendDateFilterData.customDatesPreset.from = new RangePoint(
        //             mmntNow.date(),
        //             mmntNow.month(),
        //             mmntNow.year());
        //         sendDateFilterData.customDatesPreset.till = new RangePoint(
        //             mmntPlus30d.date(),
        //             mmntPlus30d.month(),
        //             mmntPlus30d.year());
        //         sendDateFilterData.selectedPresetFromArchiveSearch = sendDateFilterData.customDatesPreset;
        //     } else {
        //         sendDateFilterData.selectedPresetFromArchiveSearch = null;
        //     }
        // }
        // this.fileSearch(this.saveFolder.text, this.saveFolder.folder, false, true);
    }

    cleanAdvancedSearch1() {
        // this.valuesExistStr = false;
        // this.advancedSearchParams.patchValue({
        //     fileName: null,
        //     supplierHp: null,
        //     asmachta: null,
        //     batchNumber: null,
        //     totalBeforeMaamFrom: null,
        //     totalbeforeMaamTill: null,
        //     totalIncludeMaamFrom: null,
        //     totalIncludeMaamTill: null,
        //     custFrom: null,
        //     custTill: null,
        //     mamtinLeklita: false,
        //     niklat: false,
        //     invoiceDateFrom: null,
        //     invoiceDateTill: null,
        //     sendDateFrom: null,
        //     sendDateTill: null,
        // });
        // this.invoiceDateFilterData.fromDate = this.advancedSearchParams.get('invoiceDateFrom').value;
        // this.invoiceDateFilterData.toDate = this.advancedSearchParams.get('invoiceDateTill').value;
        // this.sendDateFilterData.fromDate = this.advancedSearchParams.get('sendDateFrom').value;
        // this.sendDateFilterData.toDate = this.advancedSearchParams.get('sendDateTill').value;
        // if (this.queryString !== null && this.queryString.length) {
        //     if (!this.saveFolder) {
        //         this.fileSearch(this.queryString);
        //     } else {
        //         this.fileSearch(this.queryString, this.saveFolder.folder);
        //     }
        // } else {
        //     this.reportService.joinToBizibox$.next(false);
        //     this.saveFolder = false;
        //     this.stateScreen = 'folders';
        // }
    }

    togglePanel1Bank() {
        // if (!this.showPanelDD) {
        //
        // }
        this.showPanelDD1Bank = !this.showPanelDD1Bank;
    }

    clearFilter1Bank(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    search1Bank() {
        // if (
        //     (this.advancedSearchParams1.get('sendDateFrom').value && !this.advancedSearchParams1.get('sendDateTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('sendDateFrom').value && this.advancedSearchParams1.get('sendDateTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('invoiceDateFrom').value && !this.advancedSearchParams1.get('invoiceDateTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('invoiceDateFrom').value && this.advancedSearchParams1.get('invoiceDateTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('totalBeforeMaamFrom').value && this.advancedSearchParams1.get('totalbeforeMaamTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('totalBeforeMaamFrom').value && !this.advancedSearchParams1.get('totalbeforeMaamTill').value)
        //     ||
        //     (!this.advancedSearchParams1.get('totalIncludeMaamFrom').value && this.advancedSearchParams1.get('totalIncludeMaamTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('totalIncludeMaamFrom').value && !this.advancedSearchParams1.get('totalIncludeMaamTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('supplierHp').value && this.advancedSearchParams1.get('supplierHp').errors && (this.advancedSearchParams1.get('supplierHp').errors.idILInvalid || this.advancedSearchParams1.get('supplierHp').errors.minlength))
        //     ||
        //     (this.advancedSearchParams1.get('batchNumber').value && this.advancedSearchParams1.get('batchNumber').errors)
        //     ||
        //     (!this.advancedSearchParams1.get('custFrom').value && this.advancedSearchParams1.get('custTill').value)
        //     ||
        //     (this.advancedSearchParams1.get('custFrom').value && !this.advancedSearchParams1.get('custTill').value)
        // ) {
        //     return;
        // }
        //
        // if (this.advancedSearchParams1.get('invoiceDateFrom').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         invoiceDateFrom: null
        //     });
        // }
        // if (this.advancedSearchParams1.get('invoiceDateTill').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         invoiceDateTill: null
        //     });
        // }
        // if (this.advancedSearchParams1.get('sendDateFrom').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         sendDateFrom: null
        //     });
        // }
        // if (this.advancedSearchParams1.get('sendDateTill').value === '') {
        //     this.advancedSearchParams1.patchValue({
        //         sendDateTill: null
        //     });
        // }
        this.togglePanel1Bank();
        console.log(this.advancedSearchParams1Bank);
        this.selectedParamsForSearch1Bank();
    }

    selectedParamsForSearch1Bank() {
        // const arrOfKeys = Object.keys(this.advancedSearchParams1.value);
        // this.valuesExistStr = arrOfKeys.filter(it => (it !== 'invoiceDateFrom' && it !== 'invoiceDateTill' && it !== 'sendDateFrom' && it !== 'sendDateTill') && event.value[it])
        //     .map(key => typeof (event.value[key]) === 'boolean' ? (key === 'niklat' ? 'סטטוס נקלט' : 'סטטוס ממתין לקליטה') :
        //         (typeof (event.value[key]) === 'object' ? event.value[key].custId : event.value[key]))
        //     .reverse()
        //     .join(', ');
        //
        // this.invoiceDateFilterData.fromDate = this.advancedSearchParams.get('invoiceDateFrom').value;
        // this.invoiceDateFilterData.toDate = this.advancedSearchParams.get('invoiceDateTill').value;
        // this.sendDateFilterData.fromDate = this.advancedSearchParams.get('sendDateFrom').value;
        // this.sendDateFilterData.toDate = this.advancedSearchParams.get('sendDateTill').value;
        //
        // if (this.archivesDateChildren.length) {
        //     const invoiceDateFilterData = this.archivesDateChildren.last;
        //     if (this.invoiceDateFilterData.fromDate) {
        //         const mmntNow = this.userService.appData.moment(this.invoiceDateFilterData.fromDate);
        //         const mmntPlus30d = this.userService.appData.moment(this.invoiceDateFilterData.toDate);
        //         invoiceDateFilterData.customDatesPreset.from = new RangePoint(
        //             mmntNow.date(),
        //             mmntNow.month(),
        //             mmntNow.year());
        //         invoiceDateFilterData.customDatesPreset.till = new RangePoint(
        //             mmntPlus30d.date(),
        //             mmntPlus30d.month(),
        //             mmntPlus30d.year());
        //         invoiceDateFilterData.selectedPresetFromArchiveSearch = invoiceDateFilterData.customDatesPreset;
        //     } else {
        //         invoiceDateFilterData.selectedPresetFromArchiveSearch = null;
        //     }
        //
        //     const sendDateFilterData = this.archivesDateChildren.first;
        //     if (this.sendDateFilterData.fromDate) {
        //         const mmntNow = this.userService.appData.moment(this.sendDateFilterData.fromDate);
        //         const mmntPlus30d = this.userService.appData.moment(this.sendDateFilterData.toDate);
        //         sendDateFilterData.customDatesPreset.from = new RangePoint(
        //             mmntNow.date(),
        //             mmntNow.month(),
        //             mmntNow.year());
        //         sendDateFilterData.customDatesPreset.till = new RangePoint(
        //             mmntPlus30d.date(),
        //             mmntPlus30d.month(),
        //             mmntPlus30d.year());
        //         sendDateFilterData.selectedPresetFromArchiveSearch = sendDateFilterData.customDatesPreset;
        //     } else {
        //         sendDateFilterData.selectedPresetFromArchiveSearch = null;
        //     }
        // }
        // this.fileSearch(this.saveFolder.text, this.saveFolder.folder, false, true);
    }

    cleanAdvancedSearch1Bank() {
        // this.valuesExistStr = false;
        // this.advancedSearchParams.patchValue({
        //     fileName: null,
        //     supplierHp: null,
        //     asmachta: null,
        //     batchNumber: null,
        //     totalBeforeMaamFrom: null,
        //     totalbeforeMaamTill: null,
        //     totalIncludeMaamFrom: null,
        //     totalIncludeMaamTill: null,
        //     custFrom: null,
        //     custTill: null,
        //     mamtinLeklita: false,
        //     niklat: false,
        //     invoiceDateFrom: null,
        //     invoiceDateTill: null,
        //     sendDateFrom: null,
        //     sendDateTill: null,
        // });
        // this.invoiceDateFilterData.fromDate = this.advancedSearchParams.get('invoiceDateFrom').value;
        // this.invoiceDateFilterData.toDate = this.advancedSearchParams.get('invoiceDateTill').value;
        // this.sendDateFilterData.fromDate = this.advancedSearchParams.get('sendDateFrom').value;
        // this.sendDateFilterData.toDate = this.advancedSearchParams.get('sendDateTill').value;
        // if (this.queryString !== null && this.queryString.length) {
        //     if (!this.saveFolder) {
        //         this.fileSearch(this.queryString);
        //     } else {
        //         this.fileSearch(this.queryString, this.saveFolder.folder);
        //     }
        // } else {
        //     this.reportService.joinToBizibox$.next(false);
        //     this.saveFolder = false;
        //     this.stateScreen = 'folders';
        // }
    }

    getData(paramDate: any, saveFilter?: boolean) {
        // this.showScreen = true;
        if (this.fileStatus === 'BANK') {
            if (this.userService.appData.userData.accountSelect.length) {
                this.loader = true;
                // this.advancedSearchParams.get('description').value,
                zip(
                    this.sharedService.bankDetails({
                        companyAccountIds:
                            this.userService.appData.userData.accountSelect.map((account) => {
                                return account.companyAccountId;
                            }),
                        dateFrom: paramDate.fromDate,
                        dateTill: paramDate.toDate
                    }),
                    this.sharedService.paymentTypesTranslate$
                ).subscribe(
                    ([response, paymentTypesTranslate]: any) => {
                        let bankDetailsSave = response ? response['body'] : response;
                        this.showScreen = bankDetailsSave.item === true;
                        bankDetailsSave = bankDetailsSave.rows;
                        const bankDetailsBuilder = [];
                        if (Array.isArray(bankDetailsSave)) {
                            let idxRows = 0;
                            for (const fd of bankDetailsSave) {
                                if (!fd.splitArray) {
                                    let custId =
                                        fd.custId && this.customerCustList
                                            ? this.customerCustList.find(
                                                (custIdxRec) => custIdxRec.custId === fd.custId
                                            )
                                            : null;
                                    if (!custId && fd.custId && this.customerCustList) {
                                        custId = {
                                            cartisName: fd.custId,
                                            cartisCodeId: null,
                                            custId: fd.custId,
                                            lName: null,
                                            hp: null,
                                            id: null,
                                            pettyCash: false,
                                            supplierTaxDeduction: null,
                                            customerTaxDeduction: null
                                        };
                                        this.customerCustList.push(custId);
                                    }
                                    fd.cust = custId;
                                    fd.custName = custId ? custId.cartisName : 'בחירה';

                                    // if (this.customerCustList.length && fd.custId) {
                                    //     const custFromList = this.customerCustList.find(cust => cust.custId === fd.custId);
                                    //     fd.cust = custFromList ? custFromList : null;
                                    //     fd.custName = custFromList ? custFromList.cartisName : 'בחירה';
                                    // } else {
                                    //     fd.cust = null;
                                    //     fd.custName = fd.custId ? fd.custId : 'בחירה';
                                    // }
                                    fd.custIdCards =
                                        fd.custId &&
                                        fd.custId.toString().includes('כרטיסים מרובים');
                                    fd.account = this.userService.appData.userData.accounts.find(
                                        (acc: any) => acc.companyAccountId === fd.companyAccountId
                                    );
                                    if (this.bankProcessTransType) {
                                        const transTypeDefinedArr = fd.hova
                                            ? this.transTypeDefinedHova
                                            : this.transTypeDefinedZhut;
                                        fd.transTypeDefinedArr = this.addPriemerObject(
                                            JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                                                (it) =>
                                                    it.oppositeCustId === '?' ||
                                                    it.oppositeCustId === '*' ||
                                                    it.oppositeCustId === null ||
                                                    it.oppositeCustId === fd.account.izuCustId
                                            ),
                                            fd.transTypeCode
                                        );
                                    }

                                    fd.paymentDescTranslate = paymentTypesTranslate[
                                        fd['paymentDesc']
                                        ]
                                        ? paymentTypesTranslate[fd['paymentDesc']]
                                        : fd['paymentDesc'];
                                    fd.asmachta =
                                        fd.asmachta !== null ? String(fd.asmachta) : fd.asmachta;
                                    fd.totalFull = fd.hova
                                        ? -Math.abs(fd.total)
                                        : Math.abs(fd.total);
                                    fd.status_desc =
                                        this.translate.translations[this.translate.currentLang][
                                            'bankDetails-status'
                                            ][fd.status];
                                    if (
                                        fd.pictureLink &&
                                        (fd.pictureLink === 'x' || fd.pictureLink === 'X')
                                    ) {
                                        fd.pictureLink = null;
                                    }
                                    bankDetailsBuilder.push(fd);
                                } else {
                                    let idx = 0;
                                    const length = fd.splitArray.length;
                                    for (const fdChild of fd.splitArray) {
                                        if (idx === 0) {
                                            fdChild.firstSplit = true;
                                        }
                                        fdChild.splitArrayLength = length;
                                        // fdChild['indexInGroup'] = idx;

                                        let custId =
                                            fdChild.custId && this.customerCustList
                                                ? this.customerCustList.find(
                                                    (custIdxRec) => custIdxRec.custId === fdChild.custId
                                                )
                                                : null;
                                        if (!custId && fdChild.custId && this.customerCustList) {
                                            custId = {
                                                cartisName: fdChild.custId,
                                                cartisCodeId: null,
                                                custId: fdChild.custId,
                                                lName: null,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.customerCustList.push(custId);
                                        }
                                        fdChild.cust = custId;
                                        fdChild.custName = custId ? custId.cartisName : 'בחירה';

                                        // if (this.customerCustList.length && fdChild.custId) {
                                        //     const custFromList = this.customerCustList.find(cust => cust.custId === fdChild.custId);
                                        //     fdChild.cust = custFromList ? custFromList : null;
                                        //     fdChild.custName = custFromList ? custFromList.cartisName : 'בחירה';
                                        // } else {
                                        //     fdChild.cust = null;
                                        //     fdChild.custName = fdChild.custId ? fdChild.custId : 'בחירה';
                                        // }
                                        fdChild.transDate = fd.transDate;
                                        fdChild.custIdCards =
                                            fdChild.custId &&
                                            fdChild.custId.toString().includes('כרטיסים מרובים');
                                        fdChild.account =
                                            this.userService.appData.userData.accounts.find(
                                                (acc: any) => acc.companyAccountId === fd.companyAccountId
                                            );
                                        if (this.bankProcessTransType) {
                                            const transTypeDefinedArr = fdChild.hova
                                                ? this.transTypeDefinedHova
                                                : this.transTypeDefinedZhut;
                                            fdChild.transTypeDefinedArr = this.addPriemerObject(
                                                JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                                                    (it) =>
                                                        it.oppositeCustId === '?' ||
                                                        it.oppositeCustId === '*' ||
                                                        it.oppositeCustId === null ||
                                                        it.oppositeCustId === fdChild.account.izuCustId
                                                ),
                                                fdChild.transTypeCode
                                            );
                                        }
                                        fdChild.paymentDescTranslate = paymentTypesTranslate[
                                            fdChild['paymentDesc']
                                            ]
                                            ? paymentTypesTranslate[fdChild['paymentDesc']]
                                            : fdChild['paymentDesc'];
                                        fdChild.asmachta =
                                            fdChild.asmachta !== null
                                                ? String(fdChild.asmachta)
                                                : fdChild.asmachta;
                                        fdChild.totalFull = fd.hova
                                            ? -Math.abs(fd.total)
                                            : Math.abs(fd.total);
                                        fdChild.status_desc =
                                            this.translate.translations[this.translate.currentLang][
                                                'bankDetails-status'
                                                ][fdChild.status];
                                        if (
                                            fdChild.pictureLink &&
                                            (fdChild.pictureLink === 'x' ||
                                                fdChild.pictureLink === 'X')
                                        ) {
                                            fdChild.pictureLink = null;
                                        }
                                        const splitArrayBase = fd;
                                        splitArrayBase.splitArray = null;
                                        fdChild.splitArrayBase = splitArrayBase;
                                        fdChild.idxRows = idxRows;
                                        bankDetailsBuilder.push(fdChild);
                                        idx++;
                                    }
                                }

                                idxRows++;
                            }
                            this.bankDetailsSave = bankDetailsBuilder;
                        } else {
                            this.bankDetailsSave = [];
                        }

                        if (this.bankDetailsSave && this.bankDetailsSave.length) {
                            this.filterInput.enable();
                        } else {
                            this.filterInput.disable();
                        }
                        this.bankDetails = JSON.parse(JSON.stringify(this.bankDetailsSave));
                        if (!saveFilter) {
                            this.filtersAll();
                        } else {
                            this.filtersAll(undefined, true, true);
                        }
                    }
                );
            }
        } else if (this.fileStatus === 'CREDIT') {
            this.loader = true;
            this.selectionSummary.sumForSelectedPeriod = null;
            const selectedCards = this.cardsSelector.selectedCards;
            const arrCards = selectedCards.map((card) => card.creditCardId);
            if (arrCards.length) {
                let obj = {
                    creditCardIds: arrCards
                };

                if (
                    this.childCardsDates.selectedPreset.name === 'customMonths' ||
                    this.childCardsDates.selectedPreset.name === 'customDates'
                ) {
                    obj = Object.assign(obj, {
                        dateFrom: paramDate.fromDate,
                        dateTill: paramDate.toDate,
                        filterType: null
                    });
                } else {
                    obj = Object.assign(obj, {
                        dateFrom: null,
                        dateTill: null,
                        filterType: Math.abs(
                            this.childCardsDates.selectedPreset['monthsDelta']
                        )
                    });
                }
                // this.advancedSearchParams.get('description').value,
                this.sharedService.cardDetails(obj).subscribe(
                    (response: any) => {
                        // ccardTransId: "a8e9996e-cb6d-270c-e053-0b6519ac88cf"
                        // creditCardId: "a8e9996e-cb6a-270c-e053-0b6519ac88cf"
                        // custId: null
                        // fileId: null
                        // mainDesc: "עיריית יהוד מונוסון"
                        // nextCycleDate: 1594760400000
                        // originalTotal: 326
                        // searchkeyId: "a8e9996e-cb73-270c-e053-0b6519ac88cf"
                        // secDesc: null
                        // status: "EMPTY"
                        // transDate: 1592773200000
                        // transTotal: 326
                        const cardDetailsSave = response ? response['body'] : response;
                        this.showScreen = cardDetailsSave.item === true;
                        this.cardDetailsSave = cardDetailsSave.rows;

                        if (Array.isArray(this.cardDetailsSave)) {
                            for (const fd of this.cardDetailsSave) {
                                let custId =
                                    fd.custId && this.customerCustList
                                        ? this.customerCustList.find(
                                            (custIdxRec) => custIdxRec.custId === fd.custId
                                        )
                                        : null;
                                if (!custId && fd.custId && this.customerCustList) {
                                    custId = {
                                        cartisName: fd.custId,
                                        cartisCodeId: null,
                                        custId: fd.custId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.customerCustList.push(custId);
                                }
                                fd.cust = custId;
                                fd.custName = custId ? custId.cartisName : 'בחירה';

                                // if (this.customerCustList.length && fd.custId) {
                                //     const custFromList = this.customerCustList.find(cust => cust.custId === fd.custId);
                                //     fd.cust = custFromList ? custFromList : null;
                                //     fd.custName = custFromList ? custFromList.cartisName : 'בחירה';
                                // } else {
                                //     fd.cust = null;
                                //     fd.custName = fd.custId ? fd.custId : 'בחירה';
                                // }
                                fd.custIdCards =
                                    fd.custId && fd.custId.toString().includes('כרטיסים מרובים');
                                fd.status_desc =
                                    this.translate.translations[this.translate.currentLang][
                                        'bankDetails-status'
                                        ][fd.status];
                                const card = this.cardsSelector.selectedCards.find(
                                    (it) => it.creditCardId === fd.creditCardId
                                );
                                fd.card = card;
                                if (card) {
                                    fd.creditCardNickname = card.creditCardNickname;
                                } else {
                                    fd.creditCardNickname = null;
                                }

                                if (this.bankProcessTransType) {
                                    const transTypeDefinedArr = fd.hova
                                        ? this.transTypeDefinedHova
                                        : this.transTypeDefinedZhut;
                                    fd.transTypeDefinedArr = this.addPriemerObject(
                                        JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                                            (it) =>
                                                it.oppositeCustId === '?' ||
                                                it.oppositeCustId === '*' ||
                                                it.oppositeCustId === null ||
                                                it.oppositeCustId === fd.card.izuCustId
                                        ),
                                        fd.transTypeCode
                                    );
                                }
                            }
                        } else {
                            this.cardDetailsSave = [];
                        }
                        if (this.cardDetailsSave && this.cardDetailsSave.length) {
                            this.filterInput.enable();
                        } else {
                            this.filterInput.disable();
                        }
                        this.cardDetails = JSON.parse(JSON.stringify(this.cardDetailsSave));
                        if (!saveFilter) {
                            this.filtersAll();
                        } else {
                            this.filtersAll(undefined, true, true);
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
            } else {
                this.cardDetailsSave = [];
                if (this.cardDetailsSave && this.cardDetailsSave.length) {
                    this.filterInput.enable();
                } else {
                    this.filterInput.disable();
                }
                this.cardDetails = JSON.parse(JSON.stringify(this.cardDetailsSave));
                if (!saveFilter) {
                    this.filtersAll();
                } else {
                    this.filtersAll(undefined, true, true);
                }
            }
        }
    }

    toggleCompanyFilesOrderTo(field: any) {
        if (this.companyFilesSortControl.value.orderBy === field) {
            this.companyFilesSortControl.patchValue({
                orderBy: this.companyFilesSortControl.value.orderBy,
                order:
                    this.companyFilesSortControl.value.order === 'ASC' ? 'DESC' : 'ASC'
            });
        } else {
            this.companyFilesSortControl.patchValue({
                orderBy: field,
                order: 'DESC'
            });
        }
        this.filtersAll(undefined, true);
    }

    toggleCompanyFilesOrderToJOURNAL(field: any) {
        if (this.companyFilesSortControl.value.orderBy === field) {
            this.companyFilesSortControl.patchValue({
                orderBy: this.companyFilesSortControl.value.orderBy,
                order:
                    this.companyFilesSortControl.value.order === 'ASC' ? 'DESC' : 'ASC'
            });
        } else {
            this.companyFilesSortControl.patchValue({
                orderBy: field,
                order: 'DESC'
            });
        }
        this.filtersAllJournalTransData();
    }

    filterCategory(type: any) {
        console.log('----------------type-------', type);
        if (type.type === 'hova') {
            this.filterTypesHova = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'status') {
            if (this.selcetAllFiles) {
                this.selcetAllFiles = false;
                this.selecteAllFilesEvent();
            }
            this.filterTypesStatus = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'paymentDesc') {
            this.filterTypesPaymentDesc = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'transTypeCode') {
            this.filterTransTypeCode = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'note') {
            this.filterNote = type.checked;
            this.filtersAll(type.type);
        }
    }

    filtersAll(
        priority?: any,
        isSorted?: boolean,
        stayInSamePage?: boolean
    ): void {
        if (this.fileStatus === 'BANK') {
            if (
                this.bankDetailsSave &&
                Array.isArray(this.bankDetailsSave) &&
                this.bankDetailsSave.length
            ) {
                try {
                    if (this.filterLink === 'care') {
                        this.bankDetails = JSON.parse(
                            JSON.stringify(this.bankDetailsSave)
                        ).filter((row) => row.status === 'EMPTY');
                    } else {
                        this.bankDetails = JSON.parse(JSON.stringify(this.bankDetailsSave));
                    }
                } catch (e) {
                    console.log(e);
                }

                if (this.bankDetails.length) {
                    if (this.typeOfFlow !== 'all') {
                        this.bankDetails = this.bankDetails.filter((fd) => {
                            if (this.typeOfFlow === 'hova') {
                                return fd.hova === true;
                            } else {
                                return fd.hova === false;
                            }
                        });
                    }

                    this.bankDetails = !this.queryString
                        ? this.bankDetails
                        : this.bankDetails.filter((fd) => {
                            const valuesForSearch = [
                                fd.mainDesc,
                                fd.secDesc,
                                fd.account.bankAccountId,
                                this.dtPipe.transform(fd.transDate, 'dd/MM/yy'),
                                fd.paymentDescTranslate,
                                fd.asmachta,
                                this.sumPipe.transform(fd.total),
                                fd.total,
                                fd.custId
                            ];
                            if (this.bankProcessTransType && fd.transTypeCode) {
                                const find_transTypeCode = fd.transTypeDefinedArr.find(
                                    (it) => it.value === fd.transTypeCode
                                );
                                valuesForSearch.push(
                                    find_transTypeCode
                                        ? find_transTypeCode.onlyName
                                            ? find_transTypeCode.label.toString()
                                            : find_transTypeCode.value.toString()
                                        : fd.transTypeCode.toString()
                                );
                            }
                            if (fd.splitArrayBase) {
                                valuesForSearch.push(fd.splitArrayBase.total);
                                valuesForSearch.push(
                                    this.sumPipe.transform(fd.splitArrayBase.total)
                                );
                                valuesForSearch.push(fd.splitArrayBase.asmachta);
                                valuesForSearch.push(fd.splitArrayBase.mainDesc);
                                if (
                                    this.bankProcessTransType &&
                                    fd.splitArrayBase.transTypeCode
                                ) {
                                    const find_transTypeCode =
                                        fd.splitArrayBase.transTypeDefinedArr.find(
                                            (it) => it.value === fd.splitArrayBase.transTypeCode
                                        );
                                    valuesForSearch.push(
                                        find_transTypeCode
                                            ? find_transTypeCode.onlyName
                                                ? find_transTypeCode.label.toString()
                                                : find_transTypeCode.value.toString()
                                            : fd.splitArrayBase.transTypeCode.toString()
                                    );
                                }
                            }
                            return valuesForSearch
                                .filter(
                                    (v) =>
                                        (typeof v === 'string' || typeof v === 'number') && !!v
                                )
                                .some((vstr) =>
                                    vstr
                                        .toString()
                                        .toUpperCase()
                                        .includes(this.queryString.toUpperCase())
                                );
                        });
                }

                if (priority === 'note' && this.filterNote && !this.filterNote.length) {
                    this.bankDetails = [];
                }
                // if (priority === 'hova' && this.filterTypesHova && !this.filterTypesHova.length) {
                //     this.bankDetails = [];
                // }
                if (
                    priority === 'status' &&
                    this.filterTypesStatus &&
                    !this.filterTypesStatus.length
                ) {
                    this.bankDetails = [];
                }
                if (
                    priority === 'paymentDesc' &&
                    this.filterTypesPaymentDesc &&
                    !this.filterTypesPaymentDesc.length
                ) {
                    this.bankDetails = [];
                }
                if (this.bankProcessTransType) {
                    if (
                        priority === 'transTypeCode' &&
                        this.filterTransTypeCode &&
                        !this.filterTransTypeCode.length
                    ) {
                        this.bankDetails = [];
                    }
                }
                // if (this.filterTypesHova && this.filterTypesHova.length) {
                //     this.bankDetails = this.bankDetails.filter((item) => {
                //         if (item.hova !== undefined) {
                //             return this.filterTypesHova.some(it => it === item.hova.toString());
                //         }
                //     });
                // }
                if (this.filterNote && this.filterNote.length) {
                    this.bankDetails = this.bankDetails.filter((item) => {
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
                }
                if (this.filterTypesStatus && this.filterTypesStatus.length) {
                    this.bankDetails = this.bankDetails.filter((item) => {
                        if (item.status) {
                            const statusDone =
                                item.status.toString() === 'CHECKED' ||
                                item.status.toString() === 'DONE';
                            return this.filterTypesStatus.some((it) =>
                                statusDone
                                    ? it === 'CHECKED' || it === 'DONE'
                                    : it === item.status.toString()
                            );
                        }
                    });
                }
                if (this.filterTypesPaymentDesc && this.filterTypesPaymentDesc.length) {
                    this.bankDetails = this.bankDetails.filter((item) => {
                        if (item.paymentDesc) {
                            return this.filterTypesPaymentDesc.some(
                                (it) => it === item.paymentDesc.toString()
                            );
                        }
                    });
                }
                if (this.bankProcessTransType) {
                    if (this.filterTransTypeCode && this.filterTransTypeCode.length) {
                        this.bankDetails = this.bankDetails.filter((item) => {
                            if (item.transTypeCode) {
                                return this.filterTransTypeCode.some(
                                    (it) => it === item.transTypeCode.toString()
                                );
                            }
                        });
                    }
                }

                if (!isSorted) {
                    if (priority !== 'note') {
                        if (!this.filterNote || !this.filterNote.length) {
                            this.rebuildEditMap(this.bankDetails);
                        }
                    }
                    // if (priority !== 'hova') {
                    //     if (!this.filterTypesHova || !this.filterTypesHova.length) {
                    //         this.rebuildHovaMap(this.bankDetails);
                    //     }
                    // }
                    if (priority !== 'status') {
                        if (!this.filterTypesStatus || !this.filterTypesStatus.length) {
                            this.rebuildStatusMap(this.bankDetails);
                        }
                    }
                    if (priority !== 'paymentDesc') {
                        if (
                            !this.filterTypesPaymentDesc ||
                            !this.filterTypesPaymentDesc.length
                        ) {
                            this.rebuildPaymentDescMap(this.bankDetails);
                        }
                    }
                    if (this.bankProcessTransType) {
                        if (priority !== 'transTypeCode') {
                            if (
                                !this.filterTransTypeCode ||
                                !this.filterTransTypeCode.length
                            ) {
                                this.rebuildTransTypeCodeMap(this.bankDetails);
                            }
                        }
                    }
                }

                if (this.bankDetails.length > 1) {
                    switch (this.companyFilesSortControl.value.orderBy) {
                        case 'transDate':
                        case 'totalFull':
                            // noinspection DuplicatedCode
                            const notNumber = this.bankDetails.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'number'
                            );
                            this.bankDetails = this.bankDetails
                                .filter(
                                    (fd) =>
                                        typeof fd[this.companyFilesSortControl.value.orderBy] ===
                                        'number'
                                )
                                .sort((a, b) => {
                                    const lblA = a[this.companyFilesSortControl.value.orderBy],
                                        lblB = b[this.companyFilesSortControl.value.orderBy];
                                    return lblA || lblB
                                        ? !lblA
                                            ? 1
                                            : !lblB
                                                ? -1
                                                : this.companyFilesSortControl.value.order === 'ASC'
                                                    ? lblA - lblB
                                                    : lblB - lblA
                                        : 0;
                                })
                                .concat(notNumber);
                            break;
                        case 'mainDesc':
                        case 'asmachta':
                        case 'custId':
                            // noinspection DuplicatedCode
                            const notString = this.bankDetails.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'string'
                            );
                            this.bankDetails = this.bankDetails
                                .filter(
                                    (fd) =>
                                        typeof fd[this.companyFilesSortControl.value.orderBy] ===
                                        'string'
                                )
                                .sort((a, b) => {
                                    const lblA = a[this.companyFilesSortControl.value.orderBy],
                                        lblB = b[this.companyFilesSortControl.value.orderBy];
                                    return (
                                        (lblA || lblB
                                            ? !lblA
                                                ? 1
                                                : !lblB
                                                    ? -1
                                                    : lblA.localeCompare(lblB)
                                            : 0) *
                                        (this.companyFilesSortControl.value.order === 'DESC'
                                            ? -1
                                            : 1)
                                    );
                                })
                                .concat(notString);
                            break;
                    }
                }
                const selcetedFiles = this.bankDetails.filter((it) => it.selcetFile);
                if (selcetedFiles.length > 1) {
                    this.showFloatNav = {
                        selcetedFiles,
                        isNotDisabled: selcetedFiles.every(
                            (file) =>
                                file.status !== 'TEMP_COMMAND' &&
                                file.status !== 'PERMANENT_COMMAND'
                        ),
                        isNotIGNORE: selcetedFiles.every(
                            (file) => file.status === 'CHECKED' || file.status === 'RECHECK' || file.status === 'DONE' || file.status === 'EMPTY'
                        ),
                        isReturnToCareFiles: selcetedFiles.every(
                            (file) => file.status === 'ADD_ITEM_IGNORE' || file.status === 'CUSTOMER_IGNORE'
                        ),
                        linkPic: selcetedFiles.every((row) => row.fileId === null)
                    };
                } else {
                    this.showFloatNav = false;
                }
            } else {
                this.bankDetails = [];
            }

            this.loader = false;
            this.bankDetailsSlice = [];

            // this.bankDetailsSlice = this.bankDetails.slice((this.currentPage * this.entryLimit), ((this.currentPage * this.entryLimit) + this.entryLimit));
            // if (!stayInSamePage) {
            //
            // } else {
            //
            // }

            const bankDetailsSlice = this.bankDetails.slice(
                this.currentPage * this.entryLimit,
                this.currentPage * this.entryLimit + this.entryLimit
            );
            if (bankDetailsSlice.length) {
                let idx = 0;
                for (const row of bankDetailsSlice) {
                    if (row.splitArrayBase) {
                        if (idx > 0) {
                            let isFirst = false;
                            if (!bankDetailsSlice[idx - 1].splitArrayBase) {
                                isFirst = true;
                            }
                            if (
                                bankDetailsSlice[idx - 1].splitArrayBase &&
                                bankDetailsSlice[idx - 1].idxRows !== row.idxRows
                            ) {
                                isFirst = true;
                            }
                            row.firstSplit = isFirst;
                        }

                        if (row.firstSplit || idx === 0) {
                            let idxInsideGr = 0;
                            let idxInside = 0;

                            const s4 = () =>
                                Math.floor((1 + Math.random()) * 0x10000)
                                    .toString(16)
                                    .substring(1);
                            const uuid = `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${
                                s4() + s4() + s4()
                            }`;

                            // const dataFilter = this.bankDetailsSlice.filter(rowInside=> rowInside.splitArrayBase && rowInside.idxRows === row.idxRows);
                            for (const rowInside of bankDetailsSlice) {
                                if (idx <= idxInside) {
                                    if (
                                        rowInside.splitArrayBase &&
                                        rowInside.idxRows === row.idxRows
                                    ) {
                                        rowInside.indexInGroup = idxInsideGr;
                                        rowInside.idGroup = uuid;

                                        idxInsideGr++;

                                        if (
                                            bankDetailsSlice[idxInside + 1] &&
                                            bankDetailsSlice[idxInside + 1].idxRows !== row.idxRows
                                        ) {
                                            break;
                                        }
                                    }
                                }

                                idxInside++;
                            }
                            row.idGroup = uuid;
                            row.splitArrayFilterLength = idxInsideGr;
                            row.calcFlex = this.calcFlex(row, idx);
                        }
                    }
                    idx++;
                }
                this.bankDetailsSlice = bankDetailsSlice;
            } else {
                this.currentPage = 0;
                this.paginator.changePage(0);
            }
        } else if (this.fileStatus === 'CREDIT') {
            if (
                this.cardDetailsSave &&
                Array.isArray(this.cardDetailsSave) &&
                this.cardDetailsSave.length
            ) {
                if (this.filterLink === 'care') {
                    this.cardDetails = JSON.parse(
                        JSON.stringify(this.cardDetailsSave)
                    ).filter((row) => row.status === 'EMPTY');
                } else {
                    this.cardDetails = JSON.parse(JSON.stringify(this.cardDetailsSave));
                }
                if (this.cardDetails.length) {
                    this.cardDetails = !this.queryString
                        ? this.cardDetails
                        : this.cardDetails.filter((fd) => {
                            const valuesForSearch = [
                                fd.mainDesc,
                                fd.secDesc,
                                fd.creditCardNickname,
                                this.dtPipe.transform(fd.transDate, 'dd/MM/yy'),
                                this.dtPipe.transform(fd.nextCycleDate, 'dd/MM/yy'),
                                this.sumPipe.transform(fd.originalTotal),
                                fd.originalTotal,
                                this.sumPipe.transform(fd.transTotal),
                                fd.transTotal,
                                fd.custId
                            ];
                            if (this.bankProcessTransType && fd.transTypeCode) {
                                const find_transTypeCode = fd.transTypeDefinedArr.find(
                                    (it) => it.value === fd.transTypeCode
                                );
                                valuesForSearch.push(
                                    find_transTypeCode
                                        ? find_transTypeCode.onlyName
                                            ? find_transTypeCode.label.toString()
                                            : find_transTypeCode.value.toString()
                                        : fd.transTypeCode.toString()
                                );
                            }
                            return valuesForSearch
                                .filter(
                                    (v) =>
                                        (typeof v === 'string' || typeof v === 'number') && !!v
                                )
                                .some((vstr) =>
                                    vstr
                                        .toString()
                                        .toUpperCase()
                                        .includes(this.queryString.toUpperCase())
                                );
                        });
                }

                if (priority === 'note' && this.filterNote && !this.filterNote.length) {
                    this.cardDetails = [];
                }
                if (
                    priority === 'status' &&
                    this.filterTypesStatus &&
                    !this.filterTypesStatus.length
                ) {
                    this.cardDetails = [];
                }
                if (this.bankProcessTransType) {
                    if (
                        priority === 'transTypeCode' &&
                        this.filterTransTypeCode &&
                        !this.filterTransTypeCode.length
                    ) {
                        this.cardDetails = [];
                    }
                }
                if (this.filterTypesStatus && this.filterTypesStatus.length) {
                    this.cardDetails = this.cardDetails.filter((item) => {
                        if (item.status) {
                            const statusDone =
                                item.status.toString() === 'CHECKED' ||
                                item.status.toString() === 'DONE';
                            return this.filterTypesStatus.some((it) =>
                                statusDone
                                    ? it === 'CHECKED' || it === 'DONE'
                                    : it === item.status.toString()
                            );
                        }
                    });
                }
                if (this.filterNote && this.filterNote.length) {
                    this.cardDetails = this.cardDetails.filter((item) => {
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
                }
                if (this.bankProcessTransType) {
                    if (this.filterTransTypeCode && this.filterTransTypeCode.length) {
                        this.cardDetails = this.cardDetails.filter((item) => {
                            if (item.transTypeCode) {
                                return this.filterTransTypeCode.some(
                                    (it) => it === item.transTypeCode.toString()
                                );
                            }
                        });
                    }
                }
                if (!isSorted) {
                    if (priority !== 'note') {
                        if (!this.filterNote || !this.filterNote.length) {
                            this.rebuildEditMap(this.cardDetails);
                        }
                    }
                    if (priority !== 'status') {
                        if (!this.filterTypesStatus || !this.filterTypesStatus.length) {
                            this.rebuildStatusMap(this.cardDetails);
                        }
                    }
                    if (this.bankProcessTransType) {
                        if (priority !== 'transTypeCode') {
                            if (
                                !this.filterTransTypeCode ||
                                !this.filterTransTypeCode.length
                            ) {
                                this.rebuildTransTypeCodeMap(this.cardDetails);
                            }
                        }
                    }
                }

                if (this.cardDetails.length > 1) {
                    switch (this.companyFilesSortControl.value.orderBy) {
                        case 'transDate':
                        case 'nextCycleDate':
                        case 'originalTotal':
                        case 'transTotal':
                            // noinspection DuplicatedCode
                            const notNumber = this.cardDetails.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'number'
                            );
                            this.cardDetails = this.cardDetails
                                .filter(
                                    (fd) =>
                                        typeof fd[this.companyFilesSortControl.value.orderBy] ===
                                        'number'
                                )
                                .sort((a, b) => {
                                    const lblA = a[this.companyFilesSortControl.value.orderBy],
                                        lblB = b[this.companyFilesSortControl.value.orderBy];
                                    if (this.companyFilesSortControl.value.order === 'ASC') {
                                        return lblA - lblB;
                                    } else {
                                        return lblB - lblA;
                                    }
                                })
                                .concat(notNumber);
                            break;
                        case 'mainDesc':
                        case 'creditCardNickname':
                        case 'custId':
                            // noinspection DuplicatedCode
                            const notString = this.cardDetails.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'string'
                            );
                            this.cardDetails = this.cardDetails
                                .filter(
                                    (fd) =>
                                        typeof fd[this.companyFilesSortControl.value.orderBy] ===
                                        'string'
                                )
                                .sort((a, b) => {
                                    const lblA = a[this.companyFilesSortControl.value.orderBy],
                                        lblB = b[this.companyFilesSortControl.value.orderBy];
                                    return (
                                        (lblA || lblB
                                            ? !lblA
                                                ? 1
                                                : !lblB
                                                    ? -1
                                                    : lblA.localeCompare(lblB)
                                            : 0) *
                                        (this.companyFilesSortControl.value.order === 'DESC'
                                            ? -1
                                            : 1)
                                    );
                                })
                                .concat(notString);
                            break;
                    }
                }

                const selcetedFiles = this.cardDetails.filter((it) => it.selcetFile);
                if (selcetedFiles.length > 1) {
                    this.showFloatNav = {
                        selcetedFiles,
                        isNotDisabled: selcetedFiles.every(
                            (file) =>
                                file.status !== 'TEMP_COMMAND' &&
                                file.status !== 'PERMANENT_COMMAND'
                        ),
                        isNotIGNORE: selcetedFiles.every(
                            (file) => file.status === 'CHECKED' || file.status === 'RECHECK' || file.status === 'DONE' || file.status === 'EMPTY'
                        ),
                        isReturnToCareFiles: selcetedFiles.every(
                            (file) => file.status === 'ADD_ITEM_IGNORE' || file.status === 'CUSTOMER_IGNORE'
                        ),
                        linkPic: selcetedFiles.every((row) => row.fileId === null)
                    };
                } else {
                    this.showFloatNav = false;
                }
            } else {
                this.cardDetails = [];
            }

            this.reduceDatesFilter();

            this.loader = false;
        }
    }

    groupBy(list, keyGetter): any {
        // tslint:disable-next-line:no-shadowed-variable
        const map = new Map();
        list.forEach((item) => {
            const key = keyGetter(item);
            const collection = map.get(key);
            if (!collection) {
                map.set(key, [item]);
            } else {
                collection.push(item);
            }
        });
        return map;
    }

    reduceDatesFilter(): void {
        // this.cardDetails.forEach(it => {
        //       const nextCycleDate = new Date(it['nextCycleDate']);
        //       nextCycleDate.setHours(0, 0, 0, 0);
        //       it['nextCycleDate'] = nextCycleDate.getTime();
        //   });

        // const grouped = this.groupBy(this.cardDetails, (date) =>
        //     this.dtPipe.transform(date.nextCycleDate, 'dd/MM/yy')
        // );
        // const cardDetails: any = Array.from(grouped.values());
        // const sortedArray = cardDetails.sort(function (a, b) {
        //     return b[0].nextCycleDate - a[0].nextCycleDate;
        // });
        // console.log(cardDetails);
        // const dataArr = [];
        // sortedArray.forEach((main) => {
        //     dataArr.push(
        //         {
        //             nextCycleDate: main[0].nextCycleDate,
        //             title: true,
        //             status: ''
        //         },
        //         ...main
        //     );
        // });
        //
        // // const notNumber = this.cardDetails.filter(fd => typeof fd['nextCycleDate'] !== 'number');
        // // this.cardDetails = (this.cardDetails.filter(fd => typeof fd['nextCycleDate'] === 'number').sort((a, b) => {
        // //     const lblA = a['nextCycleDate'],
        // //         lblB = b['nextCycleDate'];
        // //     return ((lblA || lblB)
        // //         ? (!lblA ? 1 : !lblB ? -1 : ((lblB - lblA)))
        // //         : 0);
        // // })).concat(notNumber);
        // // console.log(this.cardDetails);
        //
        // // const dataArr = [];
        // // [].concat(this.cardDetails).forEach((a, idx, arr) => {
        // //     try {
        // //         // console.log(arr.length === idx + 1, arr.length, idx);
        // //
        // //         if (idx === 0) {
        // //             dataArr.push({
        // //                 nextCycleDate: arr[idx].nextCycleDate,
        // //                 title: true,
        // //                 status: ''
        // //             }, a);
        // //         } else {
        // //             const thisDate = new Date(arr[idx].nextCycleDate).toLocaleString('en-GB', {
        // //                 'year': 'numeric',
        // //                 'month': '2-digit'
        // //             });
        // //             const prevRowDate = new Date(arr[idx - 1].nextCycleDate).toLocaleString('en-GB', {
        // //                 'year': 'numeric',
        // //                 'month': '2-digit'
        // //             });
        // //             if (thisDate !== prevRowDate) {
        // //                 dataArr.push({
        // //                     nextCycleDate: arr[idx].nextCycleDate,
        // //                     title: true,
        // //                     status: ''
        // //                 }, a);
        // //             } else {
        // //                 dataArr.push(a);
        // //             }
        // //         }
        // //
        // //         // console.log(arr.length === idx + 1, arr.length, idx);
        // //
        // //     } catch (e) {
        // //         console.log('eeee', e);
        // //     }
        // // });
        // // console.log(dataArr);
        // this.cardDetails = dataArr;

        const bankDetailsSlice = this.cardDetails.slice(
            this.currentPage * this.entryLimit,
            this.currentPage * this.entryLimit + this.entryLimit
        );
        if (!bankDetailsSlice.length) {
            this.currentPage = 0;
            this.paginator.changePage(0);
        }
    }

    setHover(event: any, i: any) {
        // console.log(event.target.offsetTop, scrollContainer.offsetParent.offsetTop);
        //   console.log(event.currentTarget.offsetTop + scrollContainer.offsetParent.offsetTop);
        // this.setHoverOffset = event.currentTarget.offsetTop + scrollContainer.offsetParent.offsetTop;

        this.setHoverOffset = event.currentTarget.offsetTop;

        this.bankDetailsSlice.forEach((row, idx) => {
            if (idx !== i) {
                row.activeDD = false;
            }
        });
    }

    hoverCardRow(i: any) {
        this.cardDetails.forEach((row, idx) => {
            if (idx !== i) {
                row.activeDD = false;
            }
        });
    }

    onScrollCubes(i?: number): void {
        this.tooltipElem = null;
        this.tooltipEditRef['_results'].forEach((it, idx) => {
            if (i !== undefined && idx !== i) {
                it.hide();
            }
            if (i === undefined) {
                it.hide();
            }
        });
        this.formDropdownsRef['_results'].forEach((it, idx) => {
            if (i !== undefined && idx !== i) {
                it.hide();
            }
            if (i === undefined) {
                it.hide();
            }
        });
        this.formDropdownsCustRef['_results'].forEach((it, idx) => {
            if (i !== undefined && idx !== i) {
                it.hide();
            }
            if (i === undefined) {
                it.hide();
            }
        });
    }

    calcFlex(row: any, index: any): any {
        // const isFiltered = (this.companyFilesSortControl.value.orderBy !== 'transDate' || (this.bankDetails.length !== this.bankDetailsSave.length));
        const lengthOfTotalRows = row.splitArrayFilterLength;
        const entryLimit = this.entryLimit;
        const currentElemSum = this.currentPage * entryLimit;
        // const currentIndex = index - currentElemSum;
        // const indexInGroup = !isFiltered ? (row.indexInGroup + 1) : (row.idxRows + 1);
        let numbersOfVisibleRows = lengthOfTotalRows;
        // if ((!row.firstSplit && index === 0)) {
        //     numbersOfVisibleRows = lengthOfTotalRows - (indexInGroup - 1);
        // }

        if (index + 1 + numbersOfVisibleRows > entryLimit) {
            numbersOfVisibleRows = entryLimit - index;
        }

        if (currentElemSum / index === 1) {
            // numbersOfVisibleRows = lengthOfTotalRows - (indexInGroup - 1);
        }
        const pxTotal = 35 * Math.abs(numbersOfVisibleRows);
        console.log(numbersOfVisibleRows, pxTotal);
        return pxTotal;
    }

    cleanAdvancedSearch() {
        // this.valuesExistStr = false;
        this.advancedSearchParams.patchValue({
            description: null,
            asmachta: null,
            totalFrom: null,
            totalTill: null,
            custFrom: null,
            custTill: null,
            doseNumber: null,
            orderNumber: null
        });
        // this.invoiceDateFilterData.fromDate = this.advancedSearchParams.get('invoiceDateFrom').value;
        // this.invoiceDateFilterData.toDate = this.advancedSearchParams.get('invoiceDateTill').value;
        // this.sendDateFilterData.fromDate = this.advancedSearchParams.get('sendDateFrom').value;
        // this.sendDateFilterData.toDate = this.advancedSearchParams.get('sendDateTill').value;
        // if (this.queryString !== null && this.queryString.length) {
        //     if (!this.saveFolder) {
        //         this.fileSearch(this.queryString);
        //     } else {
        //         this.fileSearch(this.queryString, this.saveFolder.folder);
        //     }
        // } else {
        //     this.saveFolder = false;
        //     this.stateScreen = 'folders';
        // }
    }

    selectedParamsForSearch(event: any) {
        // const arrOfKeys = Object.keys(event.value);
        // this.valuesExistStr = arrOfKeys.filter(it => (it !== 'invoiceDateFrom' && it !== 'invoiceDateTill' && it !== 'sendDateFrom' && it !== 'sendDateTill') && event.value[it])
        //     .map(key => typeof (event.value[key]) === 'boolean' ? (key === 'niklat' ? 'סטטוס נקלט' : 'סטטוס ממתין לקליטה') :
        //         (typeof (event.value[key]) === 'object' ? event.value[key].custId : event.value[key]))
        //     .reverse()
        //     .join(', ');
        //
        // this.invoiceDateFilterData.fromDate = this.advancedSearchParams.get('invoiceDateFrom').value;
        // this.invoiceDateFilterData.toDate = this.advancedSearchParams.get('invoiceDateTill').value;
        // this.sendDateFilterData.fromDate = this.advancedSearchParams.get('sendDateFrom').value;
        // this.sendDateFilterData.toDate = this.advancedSearchParams.get('sendDateTill').value;
        //
        // if (this.archivesDateChildren.length) {
        //     const invoiceDateFilterData = this.archivesDateChildren.last;
        //     if (this.invoiceDateFilterData.fromDate) {
        //         const mmntNow = this.userService.appData.moment(this.invoiceDateFilterData.fromDate);
        //         const mmntPlus30d = this.userService.appData.moment(this.invoiceDateFilterData.toDate);
        //         invoiceDateFilterData.customDatesPreset.from = new RangePoint(
        //             mmntNow.date(),
        //             mmntNow.month(),
        //             mmntNow.year());
        //         invoiceDateFilterData.customDatesPreset.till = new RangePoint(
        //             mmntPlus30d.date(),
        //             mmntPlus30d.month(),
        //             mmntPlus30d.year());
        //         invoiceDateFilterData.selectedPresetFromArchiveSearch = invoiceDateFilterData.customDatesPreset;
        //     } else {
        //         invoiceDateFilterData.selectedPresetFromArchiveSearch = null;
        //     }
        //
        //     const sendDateFilterData = this.archivesDateChildren.first;
        //     if (this.sendDateFilterData.fromDate) {
        //         const mmntNow = this.userService.appData.moment(this.sendDateFilterData.fromDate);
        //         const mmntPlus30d = this.userService.appData.moment(this.sendDateFilterData.toDate);
        //         sendDateFilterData.customDatesPreset.from = new RangePoint(
        //             mmntNow.date(),
        //             mmntNow.month(),
        //             mmntNow.year());
        //         sendDateFilterData.customDatesPreset.till = new RangePoint(
        //             mmntPlus30d.date(),
        //             mmntPlus30d.month(),
        //             mmntPlus30d.year());
        //         sendDateFilterData.selectedPresetFromArchiveSearch = sendDateFilterData.customDatesPreset;
        //     } else {
        //         sendDateFilterData.selectedPresetFromArchiveSearch = null;
        //     }
        // }
        // this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
    }

    selecteAllFilesEvent(): void {
        if (this.fileStatus === 'BANK') {
            if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'ADD_ITEM_IGNORE'
            ) {
                this.bankDetailsSlice.forEach((row) => {
                    if (row.status === 'ADD_ITEM_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'HASH_MATCH_IGNORE'
            ) {
                this.bankDetailsSlice.forEach((row) => {
                    if (row.status === 'HASH_MATCH_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'BIZIBOX_MATCH_IGNORE'
            ) {
                this.bankDetailsSlice.forEach((row) => {
                    if (row.status === 'BIZIBOX_MATCH_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'CUSTOMER_IGNORE'
            ) {
                this.bankDetailsSlice.forEach((row) => {
                    if (row.status === 'CUSTOMER_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 2 &&
                this.filterTypesStatus[0].includes('_IGNORE') &&
                this.filterTypesStatus[1].includes('_IGNORE')
            ) {
                this.bankDetailsSlice.forEach((row) => {
                    if (row.status.includes('_IGNORE')) {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else {
                const all_is_ignore = this.bankDetailsSlice.every(
                    (row) =>
                        row.status === 'CUSTOMER_IGNORE' ||
                        row.status === 'ADD_ITEM_IGNORE' ||
                        row.status === 'HASH_MATCH_IGNORE' ||
                        row.status === 'BIZIBOX_MATCH_IGNORE'
                );
                if (all_is_ignore) {
                    this.bankDetailsSlice.forEach((row) => {
                        row.selcetFile = this.selcetAllFiles;
                    });
                } else {
                    this.bankDetailsSlice.forEach((row) => {
                        if (
                            !row.status.includes('_IGNORE') &&
                            row.status !== 'PERMANENT_COMMAND' &&
                            row.status !== 'TEMP_COMMAND' &&
                            !row.disabled
                        ) {
                            row.selcetFile = this.selcetAllFiles;
                        }
                    });
                }
            }

            const selcetedFiles = this.bankDetailsSlice.filter(
                (row) => row.selcetFile
            );
            if (selcetedFiles.length) {
                const isIGNORE = this.bankDetailsSlice.some(
                    (row) => row.selcetFile && row.status.includes('_IGNORE')
                );
                this.bankDetailsSlice.forEach((it) => {
                    if (isIGNORE) {
                        if (!it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    } else {
                        if (it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    }
                });
            } else {
                this.bankDetailsSlice.forEach((it) => {
                    it.disabled = false;
                });
            }
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    isNotDisabled: selcetedFiles.every(
                        (file) =>
                            file.status !== 'TEMP_COMMAND' &&
                            file.status !== 'PERMANENT_COMMAND'
                    ),
                    isNotIGNORE: selcetedFiles.every(
                        (file) => file.status === 'CHECKED' || file.status === 'RECHECK' || file.status === 'DONE' || file.status === 'EMPTY'
                    ),
                    isReturnToCareFiles: selcetedFiles.every(
                        (file) => file.status === 'ADD_ITEM_IGNORE' || file.status === 'CUSTOMER_IGNORE'
                    ),
                    linkPic: selcetedFiles.every((row) => row.fileId === null)
                };
            } else {
                this.showFloatNav = false;
            }
        } else if (this.fileStatus === 'CREDIT') {
            const cardDetailsSlice = this.cardDetails.slice(
                this.currentPage * this.entryLimit,
                this.currentPage * this.entryLimit + this.entryLimit
            );
            if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'ADD_ITEM_IGNORE'
            ) {
                cardDetailsSlice.forEach((row) => {
                    if (row.status === 'ADD_ITEM_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'HASH_MATCH_IGNORE'
            ) {
                cardDetailsSlice.forEach((row) => {
                    if (row.status === 'HASH_MATCH_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'BIZIBOX_MATCH_IGNORE'
            ) {
                cardDetailsSlice.forEach((row) => {
                    if (row.status === 'BIZIBOX_MATCH_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 1 &&
                this.filterTypesStatus[0] === 'CUSTOMER_IGNORE'
            ) {
                cardDetailsSlice.forEach((row) => {
                    if (row.status === 'CUSTOMER_IGNORE') {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else if (
                this.filterTypesStatus &&
                this.filterTypesStatus.length === 2 &&
                this.filterTypesStatus[0].includes('_IGNORE') &&
                this.filterTypesStatus[1].includes('_IGNORE')
            ) {
                cardDetailsSlice.forEach((row) => {
                    if (row.status.includes('_IGNORE')) {
                        row.selcetFile = this.selcetAllFiles;
                    }
                });
            } else {
                const all_is_ignore = cardDetailsSlice
                    .filter((it) => !it.title)
                    .every(
                        (row) =>
                            row.status === 'CUSTOMER_IGNORE' ||
                            row.status === 'ADD_ITEM_IGNORE' ||
                            row.status === 'HASH_MATCH_IGNORE' ||
                            row.status === 'BIZIBOX_MATCH_IGNORE'
                    );
                if (all_is_ignore) {
                    cardDetailsSlice.forEach((row) => {
                        if (!row.title) {
                            row.selcetFile = this.selcetAllFiles;
                        }
                    });
                } else {
                    cardDetailsSlice.forEach((row) => {
                        if (
                            !row.status.includes('_IGNORE') &&
                            row.status !== 'PERMANENT_COMMAND' &&
                            row.status !== 'TEMP_COMMAND' &&
                            !row.disabled &&
                            !row.title
                        ) {
                            row.selcetFile = this.selcetAllFiles;
                        }
                    });
                }
            }
            const selcetedFiles = cardDetailsSlice.filter(
                (row) => row.selcetFile && !row.title
            );
            if (selcetedFiles.length) {
                const isIGNORE = cardDetailsSlice.some(
                    (row) => row.selcetFile && row.status.includes('_IGNORE')
                );
                cardDetailsSlice.forEach((it) => {
                    if (isIGNORE) {
                        if (!it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    } else {
                        if (it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    }
                });
            } else {
                cardDetailsSlice.forEach((it) => {
                    it.disabled = false;
                });
            }
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    isNotDisabled: selcetedFiles.every(
                        (file) =>
                            file.status !== 'TEMP_COMMAND' &&
                            file.status !== 'PERMANENT_COMMAND'
                    ),
                    isNotIGNORE: selcetedFiles.every(
                        (file) => file.status === 'CHECKED' || file.status === 'RECHECK' || file.status === 'DONE' || file.status === 'EMPTY'
                    ),
                    isReturnToCareFiles: selcetedFiles.every(
                        (file) => file.status === 'ADD_ITEM_IGNORE' || file.status === 'CUSTOMER_IGNORE'
                    ),
                    linkPic: selcetedFiles.every((row) => row.fileId === null)
                };
            } else {
                this.showFloatNav = false;
            }
        }
    }

    isSelecteAllDisabled() {
        if (this.filterTypesStatus) {
            if (
                (this.filterTypesStatus.length === 1 &&
                    (this.filterTypesStatus[0] === 'ADD_ITEM_IGNORE' ||
                        this.filterTypesStatus[0] === 'CUSTOMER_IGNORE' ||
                        this.filterTypesStatus[0] === 'HASH_MATCH_IGNORE' ||
                        this.filterTypesStatus[0] === 'BIZIBOX_MATCH_IGNORE')) ||
                (this.filterTypesStatus.length === 2 &&
                    this.filterTypesStatus[0].includes('_IGNORE') &&
                    this.filterTypesStatus[1].includes('_IGNORE'))
            ) {
                return false;
            } else {
                if (this.fileStatus === 'BANK') {
                    const isIGNORE = this.bankDetailsSlice.some(
                        (row) => row.status.includes('_IGNORE') && row.selcetFile
                    );
                    return isIGNORE;
                } else {
                    const cardDetailsSlice = this.cardDetails.slice(
                        this.currentPage * this.entryLimit,
                        this.currentPage * this.entryLimit + this.entryLimit
                    );
                    const isIGNORE = cardDetailsSlice.some(
                        (row) => row.status.includes('_IGNORE') && row.selcetFile
                    );
                    return isIGNORE;
                }
            }
        } else {
            if (this.fileStatus === 'BANK') {
                const all_is_ignore = this.bankDetailsSlice.every(
                    (row) =>
                        row.status === 'CUSTOMER_IGNORE' ||
                        row.status === 'ADD_ITEM_IGNORE' ||
                        row.status === 'HASH_MATCH_IGNORE' ||
                        row.status === 'BIZIBOX_MATCH_IGNORE'
                );
                if (all_is_ignore) {
                    return false;
                }
                const isIGNORE = this.bankDetailsSlice.some(
                    (row) => row.status.includes('_IGNORE') && row.selcetFile
                );
                return isIGNORE;
            } else {
                if (this.cardDetails) {
                    const cardDetailsSlice = this.cardDetails.slice(
                        this.currentPage * this.entryLimit,
                        this.currentPage * this.entryLimit + this.entryLimit
                    );
                    const all_is_ignore = cardDetailsSlice
                        .filter((it) => !it.title)
                        .every(
                            (row) =>
                                row.status === 'CUSTOMER_IGNORE' ||
                                row.status === 'ADD_ITEM_IGNORE' ||
                                row.status === 'HASH_MATCH_IGNORE' ||
                                row.status === 'BIZIBOX_MATCH_IGNORE'
                        );
                    if (all_is_ignore) {
                        return false;
                    }
                    const isIGNORE = cardDetailsSlice.some(
                        (row) => row.status.includes('_IGNORE') && row.selcetFile
                    );
                    return isIGNORE;
                } else {
                    return false;
                }
            }
        }
    }

    checkSelected(): void {
        if (this.fileStatus === 'BANK') {
            const selcetedFiles = this.bankDetails.filter((row) => row.selcetFile);
            if (selcetedFiles.length) {
                const isIGNORE = this.bankDetails.some(
                    (row) => row.selcetFile && row.status.includes('_IGNORE')
                );
                this.bankDetails.forEach((it) => {
                    if (isIGNORE) {
                        if (!it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    } else {
                        if (it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    }
                });
            } else {
                this.bankDetails.forEach((it) => {
                    it.disabled = false;
                });
            }

            this.selcetAllFiles = this.bankDetails
                .filter(
                    (row) =>
                        !row.status.includes('_IGNORE') &&
                        row.status !== 'PERMANENT_COMMAND' &&
                        row.status !== 'TEMP_COMMAND'
                )
                .every((row) => row.selcetFile);

            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    isNotDisabled: selcetedFiles.every(
                        (file) =>
                            file.status !== 'TEMP_COMMAND' &&
                            file.status !== 'PERMANENT_COMMAND'
                    ),
                    isNotIGNORE: selcetedFiles.every(
                        (file) => file.status === 'CHECKED' || file.status === 'RECHECK' || file.status === 'DONE' || file.status === 'EMPTY'
                    ),
                    isReturnToCareFiles: selcetedFiles.every(
                        (file) => file.status === 'ADD_ITEM_IGNORE' || file.status === 'CUSTOMER_IGNORE'
                    ),
                    linkPic: selcetedFiles.every((row) => row.fileId === null)
                };
            } else {
                this.showFloatNav = false;
            }
        } else if (this.fileStatus === 'CREDIT') {
            const selcetedFiles = this.cardDetails.filter(
                (row) => row.selcetFile && !row.title
            );
            if (selcetedFiles.length) {
                const isIGNORE = this.cardDetails.some(
                    (row) => row.selcetFile && row.status.includes('_IGNORE')
                );
                this.cardDetails.forEach((it) => {
                    if (isIGNORE) {
                        if (!it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    } else {
                        if (it.status.includes('_IGNORE')) {
                            it.disabled = true;
                        }
                    }
                });
            } else {
                this.cardDetails.forEach((it) => {
                    it.disabled = false;
                });
            }
            this.selcetAllFiles = this.cardDetails
                .filter(
                    (row) =>
                        !row.status.includes('_IGNORE') &&
                        row.status !== 'PERMANENT_COMMAND' &&
                        row.status !== 'TEMP_COMMAND'
                )
                .every((row) => row.selcetFile);
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    isNotDisabled: selcetedFiles.every(
                        (file) =>
                            file.status !== 'TEMP_COMMAND' &&
                            file.status !== 'PERMANENT_COMMAND'
                    ),
                    isNotIGNORE: selcetedFiles.every(
                        (file) => file.status === 'CHECKED' || file.status === 'RECHECK' || file.status === 'DONE' || file.status === 'EMPTY'
                    ),
                    isReturnToCareFiles: selcetedFiles.every(
                        (file) => file.status === 'ADD_ITEM_IGNORE' || file.status === 'CUSTOMER_IGNORE'
                    ),
                    linkPic: selcetedFiles.every((row) => row.fileId === null)
                };
            } else {
                this.showFloatNav = false;
            }
        }
    }

    trackById(index: number, val: any): any {
        const idName = this.fileStatus === 'BANK' ? 'paymentId' : 'ccardTransId';
        return val[idName] + '_' + index;
    }

    trackByIdBooks(index: number, val: any): any {
        return val.journalBankId;
    }

    trackByIdBank(index: number, val: any): any {
        return val['paymentId'] + '_' + val['paymentType'] + '_' + index;
    }

    trackById2(index: number, val: any): any {
        const idName = this.fileStatus === 'BANK' ? 'paymentId' : 'ccardTransId';
        return val[idName] + '_2' + index;
    }

    trackById3(index: number, val: any): any {
        const idName = this.fileStatus === 'BANK' ? 'paymentId' : 'ccardTransId';
        return val[idName] + '_3' + index;
    }

    paginate(event) {
        this.entryLimit = Number(event.rows);
        if (this.currentPage !== +event.page) {
            this.scrollContainer.nativeElement.scrollTop = 0;
        }
        this.currentPage = event.page;

        try {
            if (this.fileStatus === 'BANK') {
                this.bankDetailsSlice = [];
                const bankDetailsSlice = this.bankDetails.slice(
                    this.currentPage * this.entryLimit,
                    this.currentPage * this.entryLimit + this.entryLimit
                );
                let idx = 0;
                for (const row of bankDetailsSlice) {
                    if (row.splitArrayBase) {
                        if (idx > 0) {
                            let isFirst = false;
                            if (!bankDetailsSlice[idx - 1].splitArrayBase) {
                                isFirst = true;
                            }
                            if (
                                bankDetailsSlice[idx - 1].splitArrayBase &&
                                bankDetailsSlice[idx - 1].idxRows !== row.idxRows
                            ) {
                                isFirst = true;
                            }
                            row.firstSplit = isFirst;
                        }

                        if (row.firstSplit || idx === 0) {
                            let idxInsideGr = 0;
                            let idxInside = 0;

                            const s4 = () =>
                                Math.floor((1 + Math.random()) * 0x10000)
                                    .toString(16)
                                    .substring(1);
                            const uuid = `${s4() + s4()}-${s4()}-${s4()}-${s4()}-${
                                s4() + s4() + s4()
                            }`;

                            // const dataFilter = this.bankDetailsSlice.filter(rowInside=> rowInside.splitArrayBase && rowInside.idxRows === row.idxRows);
                            for (const rowInside of bankDetailsSlice) {
                                if (idx <= idxInside) {
                                    if (
                                        rowInside.splitArrayBase &&
                                        rowInside.idxRows === row.idxRows
                                    ) {
                                        rowInside.indexInGroup = idxInsideGr;
                                        rowInside.idGroup = uuid;

                                        idxInsideGr++;

                                        if (
                                            bankDetailsSlice[idxInside + 1] &&
                                            bankDetailsSlice[idxInside + 1].idxRows !== row.idxRows
                                        ) {
                                            break;
                                        }
                                    }
                                }

                                idxInside++;
                            }
                            row.idGroup = uuid;
                            row.splitArrayFilterLength = idxInsideGr;
                            row.calcFlex = this.calcFlex(row, idx);
                        }
                    }
                    idx++;
                }
                this.bankDetailsSlice = bankDetailsSlice;
            }
        } catch (e) {
        }
    }

    handler(event?: any) {
        if (this.fileStatus === 'BANK') {
            this.filterDates(
                this.childDates.selectedPreset.selectedPeriod(this.userService)
            );
        } else if (this.fileStatus === 'CREDIT') {
            this.filterDates(
                this.childCardsDates.selectedPreset.selectedPeriod(this.userService)
            );
        } else if (this.fileStatus === 'BANK_MATCH') {
            this.accountsBar(true);
        }
    }

    createDocFile(ocrExportFileId: string): void {
        this.loader = true;
        this.sharedService
            .createDocFileBank({
                companyId: this.userService.appData.userData.companySelect.companyId,
                ocrFileExportId: ocrExportFileId
            })
            .subscribe(
                (response: any) => {
                    if (response && response['body']) {
                        for (const link of [
                            response['body']['docfile'],
                            response['body']['paramsfile']
                        ]) {
                            if (!link) {
                                continue;
                            }
                            requestAnimationFrame(() => {
                                const a = document.createElement('a');
                                a.target = '_blank';
                                a.href = link;
                                a.click();
                            });
                        }
                    }
                    // const link = (response) ? response['body'] : response;
                    // const a = document.createElement('a');
                    // a.target = '_blank';
                    // a.href = link;
                    // a.click();
                    this.loader = false;
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

    public appearsInBankTooltip(trns: any): string | null {
        if (!trns.secDesc) {
            return null;
        }
        if (!trns._appearsInBankTooltip) {
            trns._appearsInBankTooltip = this.domSanitizer.sanitize(
                SecurityContext.HTML,
                `${
                    this.translate.translations[this.translate.currentLang].expressions
                        .appearsInBankAs
                }<b>${trns.secDesc}</b></span>`
            );
        }
        return trns._appearsInBankTooltip;
    }

    public startDescriptionEditAt(trns: any, input: HTMLInputElement): void {
        // if (!trns.secDesc) {
        //     trns.secDesc = trns.mainDesc;
        // }
        requestAnimationFrame(() => {
            input.selectionStart = input.selectionEnd = 1000;
            input.scrollLeft =
                getComputedStyle(input).direction === 'rtl' ? 0 : input.scrollWidth;
        });
    }

    public submitChanges(trns: any): void {
        const originRow =
            this.fileStatus === 'BANK'
                ? this.bankDetailsSave.find((item) => item.paymentId === trns.paymentId)
                : this.cardDetailsSave.find(
                    (item) => item.ccardTransId === trns.ccardTransId
                );
        if (!this.hasChanges(trns, originRow)) {
            return;
        }
        const idName = this.fileStatus === 'BANK' ? 'paymentId' : 'ccardTransId';
        this.loader = true;
        this.sharedService
            .transDescUpdate({
                paymentId: trns[idName],
                paymentType: trns.paymentType,
                userDesc: trns.mainDesc
            })
            .subscribe(
                () => {
                    trns.secDesc = originRow.mainDesc;
                    originRow.mainDesc = trns.mainDesc;
                    this.loader = false;
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

    public cancelChanges(): void {
    }

    hideDocumentListStorageData(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentListStorageDataFired = false;
        this.sidebarImgs = [];
        this.sidebarImgsDescList = false;
        console.log('hideDocumentStorageData');
    }

    rotateInside() {
        if (this.degRotateImg === 0) {
            this.degRotateImg = 90;
        } else if (this.degRotateImg === 90) {
            this.degRotateImg = 180;
        } else if (this.degRotateImg === 180) {
            this.degRotateImg = 270;
        } else if (this.degRotateImg === 270) {
            this.degRotateImg = 0;
        } else {
            this.degRotateImg = 0;
        }
    }

    zoomStepInside(direction: number, type: string) {
        const newImageScale = this[type] + 0.1 * Math.sign(direction);
        // if (newImageScale > 1.6 || newImageScale < 0.2) {
        //     return;
        // }
        this[type] = newImageScale;
    }

    showDocumentListStorageData(fileId: string): void {
        this.sidebarImgsDescList = false;
        this.finishedLoadedImgView = false;
        this.showDocumentListStorageDataFired = true;
        this.getDocumentStorageData(fileId);
    }

    isArray(obj: any): boolean {
        return Array.isArray(obj);
    }

    hideDocumentPaymentDetails(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentListStorageDataFired = false;
        this.sidebarImgs = [];
        this.sidebarImgsDescList = false;
        this.fileData = false;
        console.log('hideDocumentStorageData');
    }

    getPaymentDetails(fileData: any): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.sidebarImgsDescList = false;
        this.finishedLoadedImgView = false;
        // companyAccountId: "d3ceaa49-739c-0f0a-e053-0b6519ace0fd"
        // creditCardId: null
        // custId: "10000 - רכוש קבוע"
        // details: "כספומט פרטי989"
        // hova: false
        // invoiceDate: 1641333600000
        // isChanged: false
        // isDeleted: false
        // izuCustId: "20000"
        // paymentId: "d3ceaa49-73d0-0f0a-e053-0b6519ace0fd"
        // paymentType: "BANK_TRANS"
        // splitNum: null
        // sugTnua: null
        // total: 206.9
        this.fileData = {
            item: fileData
        };
        this.sharedService
            .getPaymentDetails({
                paymentId: fileData.paymentId,
                paymentType: fileData.paymentType
            })
            .subscribe(
                async (response: any) => {
                    const responseRest = response ? response['body'] : response;
                    // const responseRest: any = {
                    //     'transDetails': {
                    //         'fromTable': 'BANK_TRANS',
                    //         'transDate': 1640124000000,
                    //         'nextCycleDate': null,
                    //         'mainDesc': '610137 יצוא ח-ן פתוח',
                    //         'paymentDesc': 'Other',
                    //         'asmachta': '610137',
                    //         'hova': true,
                    //         'total': 32.04,
                    //         'transTotal': null,
                    //         'originalTotal': null,
                    //         'custId': '100010',
                    //         'status': 'DONE'
                    //     },
                    //     'journalTranses': {
                    //         'rows': [{
                    //             'showTaxDeduction': false,
                    //             'childId': '31454536-99a9-4d0f-be37-8ce1af6d8df9',
                    //             'invoiceDate': 1640124000000,
                    //             'custId': '20004',
                    //             'total': 32.04,
                    //             'dateValue': 1640124000000,
                    //             'paymentCustId': '100010',
                    //             'paymentTotal': 32.04,
                    //             'taxDeductionCustId': '50006',
                    //             'paymentNikui': 0,
                    //             'details': '610137 יצוא ח-ן פתוח',
                    //             'asmachta': '610137',
                    //             'paymentAsmachta': null,
                    //             'companyAccountId': 'd3cebfcb-b53d-0ff8-e053-0b6519ac8b4d',
                    //             'creditCardId': null,
                    //             'thirdDate': 1640124000000,
                    //             'asmachta3': null,
                    //             'transTypeCode': null,
                    //             'thirdDateOpen': true
                    //         }]
                    //     },
                    //     'checkDetails': [],
                    //     'bankTransferDetails': [],
                    //     'loanDetails': null,
                    //     'fileId': '078993f0-1302-47c0-9294-bf6c490f7300',
                    //     'fileIdLink': {
                    //         '078993f0-1302-47c0-9294-bf6c490f7300': [{
                    //             'contentUrl': 'https://bb-docs-dev.s3.eu-west-1.amazonaws.com/078993f0-1302-47c0-9294-bf6c490f7300.jpg?X-Amz-Security-Token=IQoJb3JpZ2luX2VjENj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCWV1LXdlc3QtMSJHMEUCIQDbTCq%2FWeJrQVTnRVOxqXvew54Smm19cpCmhkOf3dw9SQIgBM8kwjV7LEkPR1z9F7TRidrfwfeVnWMmiXd%2Fn5CuBL4q2wQIkP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgwxMzY1MTEwNDQxMDAiDHhYSkySsOg3l2KErCqvBHWucFztWAU8rZV8XVs81E%2FxewgH1rPHTQq2JLauPJUFoZekzcGXXdlihn6qwKUoFPCvsOd2oeVPrsfDEtTLVjkpcWXJ0LTpDQZzAy%2BbpABhSv3fQi1ddbb2JkXwiK%2BwObxfa684HE993mfct3ijB3512586%2FvMTRow8%2FkX2tvCKFcjsIWdzFeYHPctkef5rop6JQ4rUkLTzebP1CmS%2FPHtBrCcUjFOYxHM5wwWZjBXCc7qabaedzKjD5o%2F6cdxkTfo13ez8ajAI7XD4Bw6YBXMYSnlNIWOIVZeU1Wecwn%2B3KJv%2B4w78eHilA5EEdIgEHvEyQjBakpfFLMsUxcjP7yuoc6g4jXJcHYTg%2FiVVN8h7PInhspyE2db7c5R3b0NFbz6PXf58bOrty5hnrtoTqeNd%2Fxj4Bt3YP9kshE%2F7b7fUVogXY54kY3nisoDJ8%2B5LWQMDznshzf9Oub4frn2qjr1XfcWHujzF6RkeAGsNmhLPgnyNvqBUSeOcC82wf60MqPwhguqjDs2PVtz3Fo8oJ3El%2Fd28Qcd9ZQWiDHnKOUk7sK9JfH9PdvCzoUGDq9uhbVXprtPN90doLdQ%2BA3JPWQdoe2TJ%2FNPFMzz1ONf3N9uRSJ%2BVcHjcGrBwgQg4Ax4NGDkuaNF1Uxv7u4lSl75Cym5l1MghJ3Pi6kffPbOt6es6BgWaK2ey2AKIztlRagIxHRBmMKnGLSTudrbqkjWoQxiq0mAT1nUpyQmnJR7QUiYwsvSakwY6qQEwFEaJwCpIIZpwd6aYbUwpzIc6WruqkmkRl32V%2Bxhrtqyh5RXfnQ5W9j3OCpayYfO6X0IBs4G7nJQULHs4FN%2B1P1a7m%2B0VdY1ppQCYphZ539YG3LgGm7r%2FEtQHdXV5VColJe%2F0ML5ubj8HTUxLHLN0bbBtQNEx3ZyPxgWOvx3gOJIz2tJlssGTXKSto73BK1mEYoCVr%2BXOWvTrsbNx3Co7KgpeDgpUEnGk&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220425T161118Z&X-Amz-SignedHeaders=host&X-Amz-Expires=180&X-Amz-Credential=ASIAR7SFRHICDWRL2J7N%2F20220425%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Signature=c7c452237a0d24e977348f5db57d86ae516a08a7bb09b9cee6ed44aa9629ec59',
                    //             'visionResultUrl': 'https://bb-json-dev.s3.eu-west-1.amazonaws.com/078993f0-1302-47c0-9294-bf6c490f7300.json?X-Amz-Security-Token=IQoJb3JpZ2luX2VjENj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCWV1LXdlc3QtMSJHMEUCIQDbTCq%2FWeJrQVTnRVOxqXvew54Smm19cpCmhkOf3dw9SQIgBM8kwjV7LEkPR1z9F7TRidrfwfeVnWMmiXd%2Fn5CuBL4q2wQIkP%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARABGgwxMzY1MTEwNDQxMDAiDHhYSkySsOg3l2KErCqvBHWucFztWAU8rZV8XVs81E%2FxewgH1rPHTQq2JLauPJUFoZekzcGXXdlihn6qwKUoFPCvsOd2oeVPrsfDEtTLVjkpcWXJ0LTpDQZzAy%2BbpABhSv3fQi1ddbb2JkXwiK%2BwObxfa684HE993mfct3ijB3512586%2FvMTRow8%2FkX2tvCKFcjsIWdzFeYHPctkef5rop6JQ4rUkLTzebP1CmS%2FPHtBrCcUjFOYxHM5wwWZjBXCc7qabaedzKjD5o%2F6cdxkTfo13ez8ajAI7XD4Bw6YBXMYSnlNIWOIVZeU1Wecwn%2B3KJv%2B4w78eHilA5EEdIgEHvEyQjBakpfFLMsUxcjP7yuoc6g4jXJcHYTg%2FiVVN8h7PInhspyE2db7c5R3b0NFbz6PXf58bOrty5hnrtoTqeNd%2Fxj4Bt3YP9kshE%2F7b7fUVogXY54kY3nisoDJ8%2B5LWQMDznshzf9Oub4frn2qjr1XfcWHujzF6RkeAGsNmhLPgnyNvqBUSeOcC82wf60MqPwhguqjDs2PVtz3Fo8oJ3El%2Fd28Qcd9ZQWiDHnKOUk7sK9JfH9PdvCzoUGDq9uhbVXprtPN90doLdQ%2BA3JPWQdoe2TJ%2FNPFMzz1ONf3N9uRSJ%2BVcHjcGrBwgQg4Ax4NGDkuaNF1Uxv7u4lSl75Cym5l1MghJ3Pi6kffPbOt6es6BgWaK2ey2AKIztlRagIxHRBmMKnGLSTudrbqkjWoQxiq0mAT1nUpyQmnJR7QUiYwsvSakwY6qQEwFEaJwCpIIZpwd6aYbUwpzIc6WruqkmkRl32V%2Bxhrtqyh5RXfnQ5W9j3OCpayYfO6X0IBs4G7nJQULHs4FN%2B1P1a7m%2B0VdY1ppQCYphZ539YG3LgGm7r%2FEtQHdXV5VColJe%2F0ML5ubj8HTUxLHLN0bbBtQNEx3ZyPxgWOvx3gOJIz2tJlssGTXKSto73BK1mEYoCVr%2BXOWvTrsbNx3Co7KgpeDgpUEnGk&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20220425T161118Z&X-Amz-SignedHeaders=host&X-Amz-Expires=180&X-Amz-Credential=ASIAR7SFRHICDWRL2J7N%2F20220425%2Feu-west-1%2Fs3%2Faws4_request&X-Amz-Signature=f98c12a949ea4a7d2b02dd1be7d31e1bceff519b622fad40ee339f74130aa5ac',
                    //             'fileId': '078993f0-1302-47c0-9294-bf6c490f7300'
                    //         }]
                    //     }
                    // };

                    // bankAccountId: 348975
                    // companyAccountId: "d3ceb50a-02fe-0f79-e053-0b6519acffbf"
                    // loanDate: 1581458400000
                    // loanFinish: 1739311200000
                    // loanId: "d3ceb50a-086c-0f79-e053-0b6519acffbf"
                    // loanIntrest: 5.1
                    // loanName: "הלו. שונות"
                    // loanNextPaymentDate: 1641938400000
                    // loanOriginalTotal: 200000
                    // loanPayments: 60
                    // loanTotalLeft: 132727.42
                    // nextPaymentTotal: 3783.63
                    // paymentsNumberLeft: 38

                    combineLatest(
                        [this.sharedService.companyGetCustomer({
                            companyId:
                            this.userService.appData.userData.companySelect.companyId,
                            sourceProgramId:
                            this.userService.appData.userData.companySelect.sourceProgramId
                        }),
                            this.sharedService.paymentTypesTranslate$]
                    ).subscribe(([cards, paymentTypesTranslate]: any) => {
                        if (
                            responseRest.journalTranses &&
                            responseRest.journalTranses.rows
                        ) {
                            responseRest.journalTranses.rows.forEach((item) => {
                                if (item.showTaxDeduction) {
                                    let taxDeductionCustId =
                                        item.taxDeductionCustId &&
                                        this.userService.appData.userData.companyCustomerDetails.all
                                            ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (custIdxRec) =>
                                                    custIdxRec.custId === item.taxDeductionCustId
                                            )
                                            : null;
                                    if (
                                        !taxDeductionCustId &&
                                        item.taxDeductionCustId &&
                                        this.userService.appData.userData.companyCustomerDetails.all
                                    ) {
                                        taxDeductionCustId = {
                                            cartisName: item.taxDeductionCustId,
                                            cartisCodeId: null,
                                            custId: item.taxDeductionCustId,
                                            lName: null,
                                            hp: null,
                                            id: null,
                                            pettyCash: false,
                                            supplierTaxDeduction: null,
                                            customerTaxDeduction: null
                                        };
                                        this.userService.appData.userData.companyCustomerDetails.all.push(
                                            taxDeductionCustId
                                        );
                                    }
                                    item.taxDeductionCustId = taxDeductionCustId;
                                }
                                let paymentCustId =
                                    item.paymentCustId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                            (custIdxRec) => custIdxRec.custId === item.paymentCustId
                                        )
                                        : null;
                                if (
                                    !paymentCustId &&
                                    item.paymentCustId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                ) {
                                    paymentCustId = {
                                        cartisName: item.paymentCustId,
                                        cartisCodeId: null,
                                        custId: item.paymentCustId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                        paymentCustId
                                    );
                                }
                                item.paymentCustId = paymentCustId;
                                let custId =
                                    item.custId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                            (custIdxRec) => custIdxRec.custId === item.custId
                                        )
                                        : null;
                                if (
                                    !custId &&
                                    item.custId &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                ) {
                                    custId = {
                                        cartisName: item.custId,
                                        cartisCodeId: null,
                                        custId: item.custId,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                        custId
                                    );
                                }
                                item.custId = custId;
                            });
                        }
                        if (responseRest.transDetails) {
                            responseRest.transDetails.status_desc =
                                this.translate.translations[this.translate.currentLang][
                                    'bankDetails-status'
                                    ][responseRest.transDetails.status];
                            responseRest.transDetails.paymentDescTranslate =
                                paymentTypesTranslate[responseRest.transDetails['paymentDesc']]
                                    ? paymentTypesTranslate[
                                        responseRest.transDetails['paymentDesc']
                                        ]
                                    : responseRest.transDetails['paymentDesc'];
                            let custId =
                                responseRest.transDetails.custId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) =>
                                            custIdxRec.custId === responseRest.transDetails.custId
                                    )
                                    : null;
                            if (
                                !custId &&
                                responseRest.transDetails.custId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                custId = {
                                    cartisName: responseRest.transDetails.custId,
                                    cartisCodeId: null,
                                    custId: responseRest.transDetails.custId,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    custId
                                );
                            }
                            responseRest.transDetails.custId = custId;
                        }
                        if (
                            responseRest.fileIdLink &&
                            responseRest.fileIdLink[responseRest.fileId] &&
                            this.isArray(responseRest.fileIdLink[responseRest.fileId])
                        ) {
                            responseRest.fileIdLink[responseRest.fileId].forEach((item) => {
                                item.finishedLoadedImgView = false;
                            });
                        }
                        if (responseRest.loanDetails) {
                            responseRest.loanDetails[0].arrSlices = new Array(12);
                            if (
                                responseRest.loanDetails[0].paymentsNumberLeft === null ||
                                !responseRest.loanDetails[0].loanPayments
                            ) {
                                responseRest.loanDetails[0].arrSlices.fill(false);
                            } else if (responseRest.loanDetails[0].paymentsNumberLeft === 0) {
                                responseRest.loanDetails[0].arrSlices.fill(true);
                            } else {
                                const numberOfSlicesToHover = Math.round(
                                    (responseRest.loanDetails[0].loanPayments -
                                        responseRest.loanDetails[0].paymentsNumberLeft) /
                                    (responseRest.loanDetails[0].loanPayments /
                                        responseRest.loanDetails[0].arrSlices.length)
                                );
                                responseRest.loanDetails[0].arrSlices.fill(
                                    true,
                                    0,
                                    numberOfSlicesToHover
                                );
                                responseRest.loanDetails[0].arrSlices.fill(
                                    false,
                                    numberOfSlicesToHover
                                );
                            }
                        }
                        this.fileData = Object.assign(this.fileData, responseRest);
                    });
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
        // this.sidebarImgsDescList = false;
        // this.finishedLoadedImgView = false;
        // this.showDocumentListStorageDataFired = true;
        // this.getDocumentStorageData(fileId);
    }

    getDocumentStorageData(fileId?: string): void {
        this.sharedService.getDocumentStorageData([fileId]).subscribe(
            async (response: any) => {
                const responseRest = response ? response['body'] : response;
                const getDocumentStorageData = responseRest[fileId];
                this.sidebarImgs = getDocumentStorageData;
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

    public backToCare(tooltipEditFile?: any): void {
        this.loader = true;
        const text = tooltipEditFile
            ? 'הפקודה הזמנית שנוצרה עבור ' +
            (this.fileStatus === 'CREATE_JOURNAL_TRANS'
                ? tooltipEditFile.details
                : tooltipEditFile.mainDesc) +
            ' בוטלה וממתינה לטיפול'
            : 'הפקודות הזמניות שנוצרו עבור התנועות שנבחרו בוטלו וממתינות לטיפול';
        this.journalTransComponent.reportService.forLogic = {
            message: this.domSanitizer.bypassSecurityTrustHtml('<p>' + text + '</p>'),
            fired: false
        };
        const idName =
            this.fileStatus === 'BANK' || this.fileStatus === 'CREATE_JOURNAL_TRANS'
                ? 'paymentId'
                : 'ccardTransId';
        this.sharedService
            .backToCare({
                transactions: tooltipEditFile
                    ? [
                        {
                            paymentId: tooltipEditFile[idName],
                            paymentType: tooltipEditFile.paymentType
                        }
                    ]
                    : this.showFloatNav.selcetedFiles.map((file) => {
                        return {
                            paymentId: file[idName],
                            paymentType: file.paymentType
                        };
                    })
            })
            .subscribe(
                (response: any) => {
                    this.selcetAllFiles = false;
                    this.sharedService
                        .countStatusBank(
                            this.userService.appData.userData.companySelect.companyId
                        )
                        .subscribe((res) => {
                            this.countStatusData =
                                res.body && res.body.length ? res.body[0] : null;
                        });
                    const responseRest = response ? response['body'] : response;

                    if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
                        const arrayPaymentsIds = tooltipEditFile
                            ? [tooltipEditFile[idName]]
                            : this.showFloatNav.selcetedFiles.map((file) => file[idName]);
                        const originRow = this.journalTransDataSave.filter((fd) => {
                            const returnRows = fd.transData.filter((fdChild) =>
                                arrayPaymentsIds.some((it) => it === fdChild.paymentId)
                            );
                            const lenCcard = returnRows.filter(
                                (it) => it.paymentType === 'CCARD_TRANS'
                            ).length;
                            const lenNotCcard = returnRows.length - lenCcard;
                            fd.numOfCreditData -= lenCcard;
                            fd.numOfBankData -= lenNotCcard;
                            fd.transData = fd.transData.filter(
                                (fdChild) =>
                                    !arrayPaymentsIds.some((it) => it === fdChild.paymentId)
                            );
                            if (fd.transData.length) {
                                return fd;
                            }
                        });
                        this.journalTransDataSave = originRow;
                        this.filtersAllJournalTransData();
                    } else {
                        if (responseRest.length) {
                            if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
                                responseRest.forEach((it) => {
                                    const originRow = this.journalTransDataSave.find(
                                        (item) => item.paymentId === it.transId
                                    );
                                    if (originRow) {
                                        originRow.status = it.status;
                                        originRow.custId = it.custId;
                                        let custId =
                                            originRow.custId && this.customerCustList
                                                ? this.customerCustList.find(
                                                    (custIdxRec) =>
                                                        custIdxRec.custId === originRow.custId
                                                )
                                                : null;
                                        if (!custId && originRow.custId && this.customerCustList) {
                                            custId = {
                                                cartisName: originRow.custId,
                                                cartisCodeId: null,
                                                custId: originRow.custId,
                                                lName: null,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.customerCustList.push(custId);
                                        }
                                        originRow.cust = custId;
                                        originRow.custName = custId ? custId.cartisName : 'בחירה';
                                    }

                                    // if (this.customerCustList.length && originRow.custId) {
                                    //     const custFromList = this.customerCustList.find(cust => cust.custId === originRow.custId);
                                    //     originRow.cust = custFromList ? custFromList : null;
                                    //     originRow.custName = custFromList ? custFromList.cartisName : '-';
                                    // } else {
                                    //     originRow.cust = null;
                                    //     originRow.custName = originRow.custId ? originRow.custId : '-';
                                    // }
                                });
                                this.filtersAllJournalTransData();
                            } else {
                                responseRest.forEach((it) => {
                                    const originRow =
                                        this.fileStatus === 'BANK'
                                            ? this.bankDetailsSave.find(
                                                (item) => item.paymentId === it.transId
                                            )
                                            : this.cardDetailsSave.find(
                                                (item) => item.ccardTransId === it.transId
                                            );
                                    if (originRow) {
                                        originRow.status = it.status;
                                        originRow.custId = it.custId;
                                        originRow.status_desc =
                                            this.translate.translations[this.translate.currentLang][
                                                'bankDetails-status'
                                                ][originRow.status];
                                        originRow.custIdCards =
                                            originRow.custId &&
                                            originRow.custId.toString().includes('כרטיסים מרובים');
                                    }
                                });
                                if (this.fileStatus === 'BANK') {
                                    this.bankDetails = false;
                                } else {
                                    this.cardDetails = false;
                                }
                                // this.filtersAll();
                                this.filtersAll(undefined, true, true);
                            }
                        } else {
                            // if (this.fileStatus === 'BANK') {
                            //     this.childDates.selectedRange
                            //         .pipe(
                            //             take(1)
                            //         )
                            //         .subscribe((rng) => this.filterDates(rng));
                            // } else {
                            //     this.childCardsDates.selectedRange
                            //         .pipe(
                            //             take(1)
                            //         )
                            //         .subscribe((rng) => this.filterDates(rng));
                            // }
                        }
                    }

                    setTimeout(() => {
                        this.journalTransComponent.reportService.forLogic = null;
                    }, 3000);
                },
                (err: HttpErrorResponse) => {
                    this.sharedService
                        .countStatusBank(
                            this.userService.appData.userData.companySelect.companyId
                        )
                        .subscribe((res) => {
                            this.countStatusData =
                                res.body && res.body.length ? res.body[0] : null;
                        });
                    setTimeout(() => {
                        this.journalTransComponent.reportService.forLogic = null;
                    }, 3000);
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

    public backToCareBankMatch(tooltipEditFile?: any): void {
        this.sharedService
            .backToCare({
                transactions: [
                    {
                        paymentId: tooltipEditFile.paymentId,
                        paymentType: tooltipEditFile.paymentType
                    }
                ]
            })
            .subscribe(
                (response: any) => {
                    this.getDataTables();
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

    public updateIgnoreBankMatch(tooltipEditFile: any): void {
        this.sharedService
            .updateIgnore({
                transactions: [
                    {
                        paymentId: tooltipEditFile.paymentId,
                        paymentType: tooltipEditFile.paymentType
                    }
                ]
            })
            .subscribe(
                (response: any) => {
                    this.getDataTables();
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

    public updateIgnore(tooltipEditFile: any): void {
        this.loader = true;
        const idName = this.fileStatus === 'BANK' ? 'paymentId' : 'ccardTransId';

        this.sharedService
            .updateIgnore({
                transactions:
                    tooltipEditFile &&
                    tooltipEditFile.selcetedFiles &&
                    tooltipEditFile.selcetedFiles.length
                        ? tooltipEditFile.selcetedFiles.map((file) => {
                            return {
                                paymentId: file[idName],
                                paymentType: file.paymentType
                            };
                        })
                        : [
                            {
                                paymentId: tooltipEditFile[idName],
                                paymentType: tooltipEditFile.paymentType
                            }
                        ]
            })
            .subscribe(
                (response: any) => {
                    const responseRest = response ? response['body'] : response;
                    if (responseRest.length) {
                        responseRest.forEach((it) => {
                            const originRow =
                                this.fileStatus === 'BANK'
                                    ? this.bankDetailsSave.find(
                                        (item) => item.paymentId === it.transId
                                    )
                                    : this.cardDetailsSave.find(
                                        (item) => item.ccardTransId === it.transId
                                    );
                            originRow.status = it.status;
                            originRow.status_desc =
                                this.translate.translations[this.translate.currentLang][
                                    'bankDetails-status'
                                    ][it.status];
                            originRow.custId = it.custId;
                            originRow.custIdCards =
                                originRow.custId &&
                                originRow.custId.toString().includes('כרטיסים מרובים');
                            originRow.ignoreModifiedBy = it.ignoreModifiedBy;
                            originRow.ignoreModifiedDate = it.ignoreModifiedDate;
                        });
                    } else {
                        if (
                            tooltipEditFile &&
                            tooltipEditFile.selcetedFiles &&
                            tooltipEditFile.selcetedFiles.length
                        ) {
                            tooltipEditFile.selcetedFiles.forEach((it) => {
                                const originRow =
                                    this.fileStatus === 'BANK'
                                        ? this.bankDetailsSave.find(
                                            (item) => item.paymentId === it.paymentId
                                        )
                                        : this.cardDetailsSave.find(
                                            (item) => item.ccardTransId === it.ccardTransId
                                        );
                                originRow.status = 'CUSTOMER_IGNORE';
                                originRow.status_desc =
                                    this.translate.translations[this.translate.currentLang][
                                        'bankDetails-status'
                                        ][originRow.status];
                            });
                        } else {
                            const originRow =
                                this.fileStatus === 'BANK'
                                    ? this.bankDetailsSave.find(
                                        (item) => item.paymentId === tooltipEditFile.paymentId
                                    )
                                    : this.cardDetailsSave.find(
                                        (item) =>
                                            item.ccardTransId === tooltipEditFile.ccardTransId
                                    );
                            originRow.status = 'CUSTOMER_IGNORE';
                            originRow.status_desc =
                                this.translate.translations[this.translate.currentLang][
                                    'bankDetails-status'
                                    ][originRow.status];
                        }
                    }
                    if (this.fileStatus === 'BANK') {
                        this.bankDetails = false;
                    } else {
                        this.cardDetails = false;
                    }
                    this.selcetAllFiles = false;
                    this.filtersAll(undefined, true, true);
                    // this.loader = false;

                    // if (this.fileStatus === 'BANK') {
                    //     this.bankDetails = false;
                    // } else {
                    //     this.cardDetails = false;
                    // }
                    // this.rebuildStatusMap(this.fileStatus === 'BANK' ? this.bankDetailsSave : this.cardDetailsSave);
                    // this.statusArr.forEach((status) => {
                    //     if (status.id === 'IGNORE') {
                    //         status.checked = true;
                    //     } else {
                    //         status.checked = false;
                    //     }
                    // });
                    // this.filterCategory({
                    //     checked: ['IGNORE'],
                    //     type: 'status'
                    // });
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

    loanDetails(loanId: string, companyAccountId: string) {
        this.selectedCompanyAccountIds = [companyAccountId];
        this.loanId = loanId;
        this.toggleLoanDetails = true;
    }

    connectFilesFromModal($event: any) {
        this.connectFilesFromModalArr = $event;
    }

    imageLink(params: any) {
        const originRow =
            this.fileStatus === 'BANK'
                ? this.bankDetailsSave.find(
                    (item) => item.paymentId === params.paymentId
                )
                : this.cardDetailsSave.find(
                    (item) => item.ccardTransId === params.paymentId
                );
        originRow.fileId = null;
        if (this.fileStatus === 'BANK') {
            this.bankDetails = false;
        } else {
            this.cardDetails = false;
        }
        this.filtersAll(undefined, true, true);

        const obj = {
            fileId: null,
            transactions: [params]
        };
        this.sharedService.imageLink(obj).subscribe(() => {
            this.showArchiveModal_TransId = false;
        });
    }

    imageLinkPaymentDetails() {
        const obj = {
            fileId: null,
            transactions: [
                {
                    paymentId: this.fileData.item.paymentId,
                    paymentType: this.fileData.item.paymentType
                }
            ]
        };
        this.sharedService.imageLink(obj).subscribe(() => {
        });
    }

    connectFilesSubmit() {
        this.loader = true;
        const idName =
            this.fileStatus === 'BANK' || this.fileStatus === 'CREATE_JOURNAL_TRANS'
                ? 'paymentId'
                : 'ccardTransId';

        const obj = {
            fileId: this.connectFilesFromModalArr[0].fileId,
            transactions: Array.isArray(this.showArchiveModal)
                ? this.showArchiveModal.map((it) => {
                    return {
                        paymentType: it.paymentType,
                        paymentId: it[idName]
                    };
                })
                : [this.showArchiveModal]
        };
        this.showArchiveModal = false;
        this.sharedService.imageLink(obj).subscribe(
            () => {
                if (this.fileStatus === 'BANK') {
                    this.childDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                } else if (this.fileStatus === 'CREDIT') {
                    this.childCardsDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                } else if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
                    const showChildren = this.journalTransData
                        .filter((fd) => fd.showChildren)
                        .map((it) => it.ocrExportFileId);
                    this.getExportFiles(true, showChildren);
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

    handleClick(eve) {
        this.fileIdToToActive = false;
    }

    printPage(type: any) {
        this.reportService.reportIsProcessing$.next(true);
        this.printData = type === 'all' ? this.journalTransData : [type];
        setTimeout(() => {
            if (this.elemToPrint && this.elemToPrint['nativeElement']) {
                BrowserService.printHtml(
                    this.elemToPrint['nativeElement'],
                    'פקודות יומן - בנק ואשראי'
                );
                this.printData = false;
                this.reportService.reportIsProcessing$.next(false);
            }
        }, 1000);
    }

    public setValCartis(dd: any, row: any) {
        const obj = {
            cartisName: dd.filterValue,
            cartisCodeId: null,
            custId: dd.filterValue,
            lName: null,
            hp: null,
            id: null,
            pettyCash: false,
            supplierTaxDeduction: null,
            customerTaxDeduction: null
        };
        this.userService.appData.userData.companyCustomerDetails.all.push(obj);
        this.customerCustList.push(obj);
        dd.options = this.customerCustList;
        dd.overlayVisible = false;
        row.cust = obj;
        this.selectCust(row.cust);
    }

    selectTransTypeCode(fd: any) {
        if (this.fileStatus === 'BANK') {
            if (fd.splitArrayBase) {
                if (fd.splitArrayBase.transTypeCode) {
                    const transTypeDefinedArr = fd.splitArrayBase.hova
                        ? this.transTypeDefinedHova
                        : this.transTypeDefinedZhut;
                    fd.splitArrayBase.transTypeDefinedArr = this.addPriemerObject(
                        JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                            (it) =>
                                it.oppositeCustId === '?' ||
                                it.oppositeCustId === '*' ||
                                it.oppositeCustId === null ||
                                it.oppositeCustId === fd.splitArrayBase.account.izuCustId
                        ),
                        fd.transTypeCode
                    );
                }
            } else {
                const transTypeDefinedArr = fd.hova
                    ? this.transTypeDefinedHova
                    : this.transTypeDefinedZhut;
                fd.transTypeDefinedArr = this.addPriemerObject(
                    JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                        (it) =>
                            it.oppositeCustId === '?' ||
                            it.oppositeCustId === '*' ||
                            it.oppositeCustId === null ||
                            it.oppositeCustId === fd.account.izuCustId
                    ),
                    fd.transTypeCode
                );
            }

            const row = this.bankDetailsSave.find(
                (it) => it.paymentId === fd.paymentId
            );

            if (row.splitArrayBase) {
                if (row.splitArrayBase.transTypeCode) {
                    row.splitArrayBase.transTypeCode = fd.transTypeCode;
                    const transTypeDefinedArr = row.splitArrayBase.hova
                        ? this.transTypeDefinedHova
                        : this.transTypeDefinedZhut;
                    row.splitArrayBase.transTypeDefinedArr = this.addPriemerObject(
                        JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                            (it) =>
                                it.oppositeCustId === '?' ||
                                it.oppositeCustId === '*' ||
                                it.oppositeCustId === null ||
                                it.oppositeCustId === row.splitArrayBase.account.izuCustId
                        ),
                        fd.transTypeCode
                    );
                }
            } else {
                row.transTypeCode = fd.transTypeCode;
                const transTypeDefinedArr = row.hova
                    ? this.transTypeDefinedHova
                    : this.transTypeDefinedZhut;
                row.transTypeDefinedArr = this.addPriemerObject(
                    JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                        (it) =>
                            it.oppositeCustId === '?' ||
                            it.oppositeCustId === '*' ||
                            it.oppositeCustId === null ||
                            it.oppositeCustId === row.account.izuCustId
                    ),
                    fd.transTypeCode
                );
            }
            this.filtersAll(undefined, true, true);

            let dataText = 'ביטול בחירה';
            if (fd.transTypeCode) {
                const find_transTypeCode = fd.transTypeDefinedArr.find(
                    (it) => it.value === fd.transTypeCode
                );
                if (find_transTypeCode) {
                    dataText = find_transTypeCode.onlyName
                        ? find_transTypeCode.label.toString()
                        : find_transTypeCode.value.toString();
                }
            }
            if (
                fd.transTypeCode &&
                fd.userTransTypeLink &&
                fd.userTransTypeLink !== fd.transTypeCode
            ) {
                this.shoeModalSelectType = {
                    dataText: fd.transTypeCode,
                    param: {
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        transTypeCode: fd.transTypeCode,
                        paymentsArray: [
                            {
                                biziboxMutavId: fd.biziboxMutavId,
                                paymentId: fd.paymentId,
                                paymentType: fd.paymentType,
                                searchkeyId: fd.searchkeyId
                            }
                        ],
                        popupType: 1
                    },
                    userTransTypeLink: fd.userTransTypeLink
                };
            } else {
                const param = {
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    transTypeCode: fd.transTypeCode,
                    paymentsArray: [
                        {
                            biziboxMutavId: fd.biziboxMutavId,
                            paymentId: fd.paymentId,
                            paymentType: fd.paymentType,
                            searchkeyId: fd.searchkeyId
                        }
                    ],
                    popupType: null
                };
                this.typeChangeSelected(param);
            }
        } else if (this.fileStatus === 'CREDIT') {
            const transTypeDefinedArr = fd.hova
                ? this.transTypeDefinedHova
                : this.transTypeDefinedZhut;
            fd.transTypeDefinedArr = this.addPriemerObject(
                JSON.parse(JSON.stringify(transTypeDefinedArr)).filter(
                    (it) =>
                        it.oppositeCustId === '?' ||
                        it.oppositeCustId === '*' ||
                        it.oppositeCustId === null ||
                        it.oppositeCustId === fd.card.izuCustId
                ),
                fd.transTypeCode
            );
            const row = this.cardDetailsSave.find(
                (it) => it.ccardTransId === fd.ccardTransId
            );
            row.transTypeCode = fd.transTypeCode;
            row.transTypeDefinedArr = fd.transTypeDefinedArr;

            this.filtersAll(undefined, true, true);

            let dataText = 'ביטול בחירה';
            if (fd.transTypeCode) {
                const find_transTypeCode = fd.transTypeDefinedArr.find(
                    (it) => it.value === fd.transTypeCode
                );
                if (find_transTypeCode) {
                    dataText = find_transTypeCode.onlyName
                        ? find_transTypeCode.label.toString()
                        : find_transTypeCode.value.toString();
                }
            }
            if (
                fd.transTypeCode &&
                fd.userTransTypeLink &&
                fd.userTransTypeLink !== fd.transTypeCode
            ) {
                this.shoeModalSelectType = {
                    dataText: fd.transTypeCode,
                    param: {
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        transTypeCode: fd.transTypeCode,
                        paymentsArray: [
                            {
                                biziboxMutavId: fd.biziboxMutavId,
                                paymentId: fd.paymentId,
                                paymentType: fd.paymentType,
                                searchkeyId: fd.searchkeyId
                            }
                        ],
                        popupType: 1
                    },
                    userTransTypeLink: fd.userTransTypeLink
                };
            } else {
                const param = {
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    transTypeCode: fd.transTypeCode,
                    paymentsArray: [
                        {
                            biziboxMutavId: fd.biziboxMutavId,
                            paymentId: fd.paymentId,
                            paymentType: fd.paymentType,
                            searchkeyId: fd.searchkeyId
                        }
                    ],
                    popupType: null
                };
                this.typeChangeSelected(param);
            }
        }
    }

    typeChangeSelected(params: any) {
        this.shoeModalSelectType = false;
        this.sharedService.updateTransType(params).subscribe(
            () => {
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                if (this.fileStatus === 'BANK') {
                    this.childDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                } else {
                    this.childCardsDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                }
            },
            (err: HttpErrorResponse) => {
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                if (this.fileStatus === 'BANK') {
                    this.childDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                } else {
                    this.childCardsDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                }
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

    clickLink(clickParentLink: any, show: any) {
        const isAddOpen = document.getElementsByClassName('additional-details-container');
        const element_find = clickParentLink.getElementsByClassName('nicknameInpLink');
        if (show) {
            this.modalLoan = false;
            if (!isAddOpen || isAddOpen && !isAddOpen.length) {
                if (element_find && element_find.length) {
                    element_find[0].click();
                }
            }
        } else {
            this.modalLoan = true;
            this.toggleLoanDetails = false;
            this.loanId = null;
            if (isAddOpen && isAddOpen.length) {
                if (element_find && element_find.length) {
                    element_find[0].click();
                }
            }
        }
    }

    selectCust(custModal, isSetNewCard?: boolean) {
        this.custIdForMatch = custModal;
        this.custModal = false;
        if (isSetNewCard) {
            // this.customerCustList.push({
            //     cartisName: this.custIdForMatch.custId,
            //     cartisCodeId: null,
            //     custId: this.custIdForMatch.custId,
            //     lName: null,
            //     hp: null,
            //     id: null,
            //     pettyCash: false,
            //     supplierTaxDeduction: null,
            //     customerTaxDeduction: null
            // });
            this.customerCustList.push({
                cartisName: this.custIdForMatch.custId,
                cartisCodeId: null,
                custId: this.custIdForMatch.custId,
                lName: null,
                hp: null,
                id: null,
                pettyCash: false,
                supplierTaxDeduction: null,
                customerTaxDeduction: null
            });
        }

        if (this.rowForMatchCust) {
            // console.log(this.custIdForMatch, this.rowForMatchCust);
            if (this.fileStatus === 'BANK') {
                const row = this.bankDetailsSave.find(
                    (it) => it.paymentId === this.selectedTransaction.paymentId
                );
                this.selectedTransaction.cust = row.cust;
                this.selectedTransaction.custName = row.custName;
            } else if (this.fileStatus === 'CREDIT') {
                const row = this.cardDetailsSave.find(
                    (it) => it.ccardTransId === this.selectedTransaction.ccardTransId
                );
                this.selectedTransaction.cust = row.cust;
                this.selectedTransaction.custName = row.custName;
            }
            this.filtersAll(undefined, true, true);
        } else {
            console.log(this.custIdForMatch, this.showFloatNav.selcetedFiles);
        }
        const idName = this.fileStatus === 'BANK' ? 'paymentId' : 'ccardTransId';

        this.paramsForUpdateCust = {
            companyId: this.userService.appData.userData.companySelect.companyId,
            sourceProgramId:
            this.userService.appData.userData.companySelect.sourceProgramId,
            custId:
                this.custIdForMatch.custId === '' ? null : this.custIdForMatch.custId,
            paymentsArray: this.rowForMatchCust
                ? [
                    {
                        /*
                                      'biziboxMutavId': this.rowForMatchCust.biziboxMutavId ? this.rowForMatchCust.biziboxMutavId : null,
                                      'searchkeyId': this.rowForMatchCust.searchkeyId ? this.rowForMatchCust.searchkeyId : null,
                  */
                        paymentId: this.rowForMatchCust.paymentId,
                        paymentType: this.rowForMatchCust.paymentType
                        // 'transId': this.rowForMatchCust[idName] ? this.rowForMatchCust[idName] : (this.rowForMatchCust.transId ? this.rowForMatchCust.transId : null)
                    }
                ]
                : this.showFloatNav.selcetedFiles.map((it) => {
                    return {
                        /*
                                      'biziboxMutavId': it.biziboxMutavId ? it.biziboxMutavId : null,
                                      'searchkeyId': it.searchkeyId ? it.searchkeyId : null,
                  */
                        paymentId: it.paymentId,
                        paymentType: it.paymentType

                        // 'transId': it[idName] ? it[idName] : null
                    };
                }),
            updateAll: false
        };
        if (this.rowForMatchCust) {
            this.updateTransParam = {
                custId: this.custIdForMatch.custId,
                transId: this.rowForMatchCust
                    ? this.rowForMatchCust[idName]
                        ? this.rowForMatchCust[idName]
                        : this.rowForMatchCust.transId
                            ? this.rowForMatchCust.transId
                            : null
                    : this.showFloatNav.selcetedFiles[0][idName]
                        ? this.showFloatNav.selcetedFiles[0][idName]
                        : null
            };
        }
        if (
            !isSetNewCard &&
            ((this.rowForMatchCust && this.rowForMatchCust.custPopUp) ||
                (!this.rowForMatchCust &&
                    this.showFloatNav.selcetedFiles.length &&
                    this.showFloatNav.selcetedFiles.every((file) => file.custPopUp)))
        ) {
            let old_custId = true;

            if (this.rowForMatchCust) {
                if (this.fileStatus === 'BANK') {
                    const row = this.bankDetailsSave.find(
                        (it) => it.paymentId === this.rowForMatchCust.paymentId
                    );
                    old_custId = row.cust ? row.cust.custId : ' ';
                } else if (this.fileStatus === 'CREDIT') {
                    const row = this.cardDetailsSave.find(
                        (it) => it.ccardTransId === this.rowForMatchCust.ccardTransId
                    );
                    old_custId = row.cust ? row.cust.custId : ' ';
                }
            }
            this.modalEditCardsBeforeSend = old_custId;
        } else {
            if (this.rowForMatchCust) {
                if (this.fileStatus === 'BANK') {
                    const row = this.bankDetailsSave.find(
                        (it) => it.paymentId === this.rowForMatchCust.paymentId
                    );
                    row.cust = this.custIdForMatch;
                    row.custId = row.cust.custId;
                    if (row.custId) {
                        row.custName = row.cust.cartisName || 'בחירה';
                    } else {
                        row.custName = 'בחירה';
                    }
                } else if (this.fileStatus === 'CREDIT') {
                    const row = this.cardDetailsSave.find(
                        (it) => it.ccardTransId === this.rowForMatchCust.ccardTransId
                    );
                    row.cust = this.custIdForMatch;
                    row.custId = row.cust.custId;
                    if (row.custId) {
                        row.custName = row.cust.cartisName || 'בחירה';
                    } else {
                        row.custName = 'בחירה';
                    }
                }
                this.filtersAll(undefined, true, true);
            }
            this.sharedService.updateCust(this.paramsForUpdateCust).subscribe(
                () => {
                    this.sharedService
                        .countStatusBank(
                            this.userService.appData.userData.companySelect.companyId
                        )
                        .subscribe((res) => {
                            this.countStatusData =
                                res.body && res.body.length ? res.body[0] : null;
                        });
                    if (this.fileStatus === 'BANK') {
                        this.childDates.selectedRange
                            .pipe(take(1))
                            .subscribe((rng) => this.filterDates(rng, true));
                    } else {
                        this.childCardsDates.selectedRange
                            .pipe(take(1))
                            .subscribe((rng) => this.filterDates(rng, true));
                    }
                },
                (err: HttpErrorResponse) => {
                    this.sharedService
                        .countStatusBank(
                            this.userService.appData.userData.companySelect.companyId
                        )
                        .subscribe((res) => {
                            this.countStatusData =
                                res.body && res.body.length ? res.body[0] : null;
                        });
                    if (this.fileStatus === 'BANK') {
                        this.childDates.selectedRange
                            .pipe(take(1))
                            .subscribe((rng) => this.filterDates(rng, true));
                    } else {
                        this.childCardsDates.selectedRange
                            .pipe(take(1))
                            .subscribe((rng) => this.filterDates(rng, true));
                    }
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

    updateCust() {
        if (this.rowForMatchCust) {
            if (this.fileStatus === 'BANK') {
                const row = this.bankDetailsSave.find(
                    (it) => it.paymentId === this.rowForMatchCust.paymentId
                );
                row.cust = this.custIdForMatch;
                row.custId = row.cust.custId;
                if (row.custId || row.custId === '') {
                    row.custName = row.cust.cartisName || 'בחירה';
                } else {
                    row.custName = 'בחירה';
                }
            } else if (this.fileStatus === 'CREDIT') {
                const row = this.cardDetailsSave.find(
                    (it) => it.ccardTransId === this.rowForMatchCust.ccardTransId
                );
                row.cust = this.custIdForMatch;
                row.custId = row.cust.custId;
                if (row.custId || row.custId === '') {
                    row.custName = row.cust.cartisName || 'בחירה';
                } else {
                    row.custName = 'בחירה';
                }
            }
            this.filtersAll(undefined, true, true);
        }
        this.modalEditCardsBeforeSend = false;
        this.sharedService.updateCust(this.paramsForUpdateCust).subscribe(
            () => {
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                if (this.fileStatus === 'BANK') {
                    this.childDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                } else {
                    this.childCardsDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                }
            },
            (err: HttpErrorResponse) => {
                this.sharedService
                    .countStatusBank(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((res) => {
                        this.countStatusData =
                            res.body && res.body.length ? res.body[0] : null;
                    });
                if (this.fileStatus === 'BANK') {
                    this.childDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                } else {
                    this.childCardsDates.selectedRange
                        .pipe(take(1))
                        .subscribe((rng) => this.filterDates(rng, true));
                }
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

    companyGetCustomer(row?: any): void {
        if (row) {
            this.rowForMatchCust = row;
            this.custModal = true;
        } else {
            this.rowForMatchCust = false;
            this.custModal = true;
            if (this.customerCustList.length) {
                this.oppositeCustHistory(false);
            }
        }
    }

    showArchiveModalFromTransactionAdditional(row?: any): void {
        this.showArchiveModal = {
            paymentType: row.paymentType,
            paymentId: row.transId
        };
    }

    copyText(item: string) {
        const listener = (e: ClipboardEvent) => {
            e.clipboardData.setData('text/plain', item);
            e.preventDefault();
        };

        document.addEventListener('copy', listener);
        // document.execCommand('copy');
        navigator.clipboard.writeText(item).then(r => {
        });
        document.removeEventListener('copy', listener);
    }

    ngOnDestroy(): void {
        this.reportService.cancelToastMatch = null;
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        if (this.scrollSubscription2) {
            this.scrollSubscription2.unsubscribe();
        }
        if (this.scrollSubscription1) {
            this.scrollSubscription1.unsubscribe();
        }
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.subscriptionTime) {
            this.subscriptionTime.unsubscribe();
        }
        if (this.subscriptionTime2) {
            this.subscriptionTime2.unsubscribe();
        }
        if (this.cardsListArrivedSub) {
            this.cardsListArrivedSub.unsubscribe();
        }
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        this.destroy();
    }

    private setupItemCashView(trns: any, checkRows?: any): void {
        // console.log('trns -> %o', trns);

        const total = trns.transTotal !== undefined ? trns.transTotal : trns.total;
        if (checkRows && checkRows.length) {
            const isMatch = checkRows.find(
                (val) =>
                    val['paymentId'] + '_' + val['paymentType'] ===
                    trns['paymentId'] + '_' + trns['paymentType']
            );
            if (isMatch && isMatch.checkRow) {
                trns.checkRow = true;
            }
        }
        // if (total === 101 || total === 19.8) {
        //     trns.recommendationId = 234;
        // }
        const acc1 = this.accountsBarData.accountsBarDto.find(
            (it) => it.accountId === trns.companyAccountId
        );
        const acc2 = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === trns.companyAccountId
        );
        return Object.assign(trns, {
            account: Object.assign(acc1 ? acc1 : {}, acc2 ? acc2 : {}),
            paymentDescTranslate: this.paymentTypesTranslate[trns['paymentDesc']] ? this.paymentTypesTranslate[trns['paymentDesc']] : trns['paymentDesc'],
            total: total,
            checkRow: trns.recommendationId !== undefined && trns.recommendationId !== null,
            idSelectRow: trns.recommendationId !== undefined && trns.recommendationId !== null ? trns.recommendationId : false,
            asmachta:
                trns.asmachta !== null && trns.asmachta !== undefined
                    ? Number(trns.asmachta)
                    : null,
            totalPlusMinus: trns.hova ? -Number(total) : Math.abs(Number(total)),
            transDateFull: new Date(trns.transDate),
            targetOriginalDateTime: new Date(trns.transDate).getTime(),
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.transDate,
                'dd/MM/yy'
            ),
            transDateStr: this.dtPipe.transform(trns.transDate, 'dd/MM/yy'),
            nextCycleDateStr: this.dtPipe.transform(trns.nextCycleDate, 'dd/MM/yy'),
            nextCycleDateTime: new Date(trns.nextCycleDate).getTime()
        });
    }

    private setupItemView(trns: any, isFutureTranses: boolean): void {
        // console.log('trns -> %o', trns);

        let transTypeCode = trns.transTypeCode;
        const newDataLabel = this.transTypeCodeArrValues.find(
            (it) => it.value === trns.transTypeCode
        );
        if (newDataLabel) {
            transTypeCode = newDataLabel.label;
        }
        // if (trns.total === 101 || trns.total === 19.8) {
        //     trns.recommendationId = 234;
        // }
        return Object.assign(trns, {
            transTypeCode: transTypeCode,
            deleteRow: trns.recommendationId !== undefined && trns.recommendationId !== null,
            idSelectRow: trns.recommendationId !== undefined && trns.recommendationId !== null ? trns.recommendationId : false,
            asmachta:
                trns.asmachta !== null && trns.asmachta !== undefined
                    ? Number(trns.asmachta)
                    : null,
            totalPlusMinus: trns.hova
                ? -Number(trns.total)
                : Math.abs(Number(trns.total)),
            isFutureTranses: isFutureTranses,
            transDateFull: new Date(trns.dateValue),
            transDateTime: new Date(trns.dateValue).getTime(),
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.dateValue,
                'dd/MM/yy'
            ),
            transDateStr: this.dtPipe.transform(trns.dateValue, 'dd/MM/yy'),
            transDateFull_date: new Date(trns.date),
            transDateTime_date: new Date(trns.date).getTime(),
            transDateHumanizedStr_date: this.dtHumanizePipe.transform(
                trns.date,
                'dd/MM/yy'
            ),
            transDateStr_date: this.dtPipe.transform(trns.date, 'dd/MM/yy')
        });
    }

    private setupItemViewMatched(trns: any, isFutureTranses: boolean, isMadeInBizibox: boolean, isBiziboxMatched: boolean): void {
        // console.log('trns -> %o', trns);
        if (trns.bank) {
            trns.bank.transDateFull = new Date(trns.bank.dateValue);
            trns.bank.transDateHumanizedStr = this.dtHumanizePipe.transform(
                trns.bank.dateValue,
                'dd/MM/yy'
            );
            trns.bank.transDateStr = this.dtPipe.transform(
                trns.bank.dateValue,
                'dd/MM/yy'
            );
            trns.bank.transDateFull_date = new Date(trns.bank.date);
            trns.bank.transDateHumanizedStr_date = this.dtHumanizePipe.transform(
                trns.bank.date,
                'dd/MM/yy'
            );
            trns.bank.transDateStr_date = this.dtPipe.transform(
                trns.bank.date,
                'dd/MM/yy'
            );
        }

        if (trns.book) {
            let transTypeCode = trns.book.transTypeCode;
            const newDataLabel = this.transTypeCodeArrValues.find(
                (it) => it.value === trns.book.transTypeCode
            );
            if (newDataLabel) {
                transTypeCode = newDataLabel.label;
            }
            trns.book.transTypeCode = transTypeCode;
            trns.book.transDateFull = new Date(trns.book.dateValue);
            trns.book.transDateHumanizedStr = this.dtHumanizePipe.transform(
                trns.book.dateValue,
                'dd/MM/yy'
            );
            trns.book.transDateStr = this.dtPipe.transform(
                trns.book.dateValue,
                'dd/MM/yy'
            );
            trns.book.transDateFull_date = new Date(trns.book.date);
            trns.book.transDateHumanizedStr_date = this.dtHumanizePipe.transform(
                trns.book.date,
                'dd/MM/yy'
            );
            trns.book.transDateStr_date = this.dtPipe.transform(
                trns.book.date,
                'dd/MM/yy'
            );
        }

        return Object.assign(trns, {
            isFutureTranses: isFutureTranses,
            isMadeInBizibox: isMadeInBizibox,
            isBiziboxMatched: isBiziboxMatched
        });
    }

    private navigationData(list: HTMLElement): {
        prevIndex: number;
        nextIndex: number;
    } {
        const parentRect: any = list.getBoundingClientRect();
        const childrenRects: any[] = Array.from(list.children).map((li) =>
            li.getBoundingClientRect()
        );

        // console.log('parent -> %o, children -> %o', parentRect, childrenRects);

        const fullyVisible = childrenRects
            .filter((chr) => {
                // debugger;
                return (
                    (parentRect.left <= chr.left ||
                        Math.abs(parentRect.left - chr.left) <= 1) &&
                    chr.left < parentRect.right &&
                    parentRect.left < chr.right &&
                    (chr.right <= parentRect.right ||
                        Math.abs(parentRect.right - chr.right) <= 1) &&
                    chr.top >= parentRect.top &&
                    chr.bottom <= parentRect.bottom
                );
            })
            .map((chr) => childrenRects.indexOf(chr));
        // console.log('fullyVisible -> %o', fullyVisible);

        const result = {
            prevIndex: fullyVisible[0] > 0 ? fullyVisible[0] - 1 : 0,
            nextIndex:
                fullyVisible[fullyVisible.length - 1] < childrenRects.length - 1
                    ? fullyVisible[fullyVisible.length - 1] + 1
                    : childrenRects.length - 1
        };

        if (result.prevIndex > 0) {
            while (
                childrenRects[result.prevIndex].width === 0 &&
                result.prevIndex >= 0
                ) {
                --result.prevIndex;
            }
        }

        if (result.nextIndex < childrenRects.length) {
            while (
                childrenRects[result.nextIndex].width === 0 &&
                result.nextIndex <= childrenRects.length
                ) {
                ++result.nextIndex;
            }
        }

        return result;
    }

    private scrollListToIndex(
        list: HTMLElement,
        idx: number,
        opts?: ScrollIntoViewOptions
    ) {
        // console.log('scrollListToIndex => %o, list has %o',
        //     idx, list.children.length);
        if (list && idx >= 0 && idx < list.children.length) {
            // console.log('scrolling to %o with %o', idx, opts);
            // requestAnimationFrame(() => {
            list.children[idx].scrollIntoView(
                opts || {
                    behavior: 'smooth'
                }
            );
            // });
        }
    }

    private getAdditionalItemFilename() {
        // return [
        //     'העברה',
        //     this.transaction.hova ? 'מחשבון' : 'לחשבון',
        //     this.transaction.account.accountNickname,
        //     'על סך',
        //     this.transaction.total,
        //     'מתאריך',
        //     new Date(this.transaction.transDate).toLocaleDateString('en-GB', {
        //         'day': 'numeric',
        //         'year': '2-digit',
        //         'month': '2-digit'
        //     })
        // ].join(' ');
    }

    private rebuildStatusMap(withOtherFiltersApplied: any[]): void {
        const statusArrMap: { [key: string]: any } = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (
                    dtRow.status_desc &&
                    dtRow.status_desc.toString() &&
                    !acmltr[dtRow.status_desc.toString()]
                ) {
                    acmltr[dtRow.status_desc.toString()] = {
                        val: dtRow.status_desc.toString(),
                        id: dtRow.status.toString(),
                        checked: true
                    };

                    if (
                        acmltr['all'].checked &&
                        !acmltr[dtRow.status_desc.toString()].checked
                    ) {
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
        this.statusArr = Object.values(statusArrMap);
        console.log('this.statusArr => %o', this.statusArr);
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

    private rebuildHovaMap(withOtherFiltersApplied: any[]): void {
        const hovaArrMap: { [key: string]: any } = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (
                    dtRow.hova !== undefined &&
                    dtRow.hova.toString() &&
                    !acmltr[dtRow.hova.toString()]
                ) {
                    acmltr[dtRow.hova.toString()] = {
                        val: dtRow.hova === true ? 'חובה' : 'זכות',
                        id: dtRow.hova.toString(),
                        checked: true
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.hova.toString()].checked) {
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
        this.hovaArr = Object.values(hovaArrMap);
        console.log('this.hovaArr => %o', this.hovaArr);
    }

    private rebuildPaymentDescMap(withOtherFiltersApplied: any[]): void {
        const paymentDescArrMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.paymentDesc &&
                        dtRow.paymentDesc.toString() &&
                        !acmltr[dtRow.paymentDesc.toString()]
                    ) {
                        acmltr[dtRow.paymentDesc.toString()] = {
                            val: dtRow.paymentDescTranslate.toString(),
                            id: dtRow.paymentDesc.toString(),
                            checked: true
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.paymentDesc.toString()].checked
                        ) {
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
        this.paymentDescArr = Object.values(paymentDescArrMap);
        console.log('this.paymentDescArr => %o', this.paymentDescArr);
    }

    private rebuildTransTypeCodeMap(withOtherFiltersApplied: any[]): void {
        const transTypeCodeMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.transTypeCode &&
                        dtRow.transTypeCode.toString() &&
                        !acmltr[dtRow.transTypeCode.toString()]
                    ) {
                        const find_transTypeCode = dtRow.transTypeDefinedArr.find(
                            (it) => it.value === dtRow.transTypeCode
                        );
                        acmltr[dtRow.transTypeCode.toString()] = {
                            val: find_transTypeCode
                                ? find_transTypeCode.onlyName
                                    ? find_transTypeCode.label.toString()
                                    : find_transTypeCode.value.toString()
                                : dtRow.transTypeCode.toString(),
                            id: dtRow.transTypeCode.toString(),
                            checked: true
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.transTypeCode.toString()].checked
                        ) {
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
        this.transTypeCodeArr = Object.values(transTypeCodeMap);
        console.log('this.transTypeCodeArr => %o', this.transTypeCodeArr);
    }

    toFixedNumber(val: any) {
        return toFixedNumber(val);
    }

    private hasChanges(trns: any, originRow: any): boolean {
        // console.log('Checking if changed...');
        return trns.mainDesc !== originRow.mainDesc;
    }
}
