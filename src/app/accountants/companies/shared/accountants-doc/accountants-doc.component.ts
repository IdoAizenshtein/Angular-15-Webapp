/* tslint:disable:max-line-length no-inferrable-types comment-format whitespace member-ordering */
import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    Renderer2,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {LocationStrategy} from '@angular/common';
import {OcrService} from '../ocr.service';
import {
    BehaviorSubject,
    combineLatest,
    defer,
    EMPTY,
    interval,
    lastValueFrom,
    Observable,
    of,
    Subject,
    Subscription,
    timer,
    zip
} from 'rxjs';
import {
    catchError,
    debounceTime,
    distinctUntilChanged,
    filter,
    map,
    pairwise,
    retry,
    shareReplay,
    skip,
    startWith,
    switchMap,
    take,
    takeUntil,
    tap
} from 'rxjs/operators';
import {HierarchyNode, OcrField} from '../hierarchy-node.model';
import {FileDetails} from '../file-details.model';
import {AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
// import {defaultOptions, PageRenderedEvent} from 'ngx-extended-pdf-viewer';
import {Dropdown} from 'primeng/dropdown';
import {Calendar} from 'primeng/calendar';
import {UserService} from '@app/core/user.service';
import {HttpClient, HttpErrorResponse, HttpEventType, HttpHeaders, HttpRequest, HttpResponse} from '@angular/common/http';
import {GeometryHelperService} from '../geometry-helper.service';
import {SelectItemGroup} from 'primeng/api/selectitemgroup';
import {SelectItem} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';
import {FileStatus} from '../file-status.model';
import {PostponedAction} from './postponed-action';
import {DomSanitizer} from '@angular/platform-browser';
import {DistinctBehaviorSubject} from '../distinct-behavior-subject';
import {inView} from '../intersection-observer';
import jsPDF from 'jspdf';
import {ReportService} from '@app/core/report.service';
import {formatAsSumNoMath, toFixedNumber, toNumber} from '@app/shared/functions/addCommaToNumbers';
import {StorageService} from '@app/shared/services/storage.service';
import {OverlayPanel} from 'primeng/overlaypanel';
import {MatListItem} from '@angular/material/list';
import {ReloadServices} from '@app/shared/services/reload.services';
import {SharedComponent} from '@app/shared/component/shared.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {SharedService} from '@app/shared/services/shared.service';
import {publishRef} from '@app/shared/functions/publishRef';
import {getPageHeight} from '@app/shared/functions/getPageHeight';
import {HttpServices} from '@app/shared/services/http.services';

declare var $: any;

@Component({
    selector: 'app-accountants-doc',
    templateUrl: './accountants-doc.component.html',
    encapsulation: ViewEncapsulation.None
})
export class AccountantsDocComponent
    extends ReloadServices
    implements OnInit, OnDestroy {
    // @HostListener('window:keydown', ['$event'])
    // hashChangeHandler(event) {
    //     console.log('event-----', event)
    //     // window.location.hash = "dontgoback";
    //
    // }
    hierarchy$: Observable<Array<HierarchyNode>>;
    // tslint:disable-next-line:no-input-rename
    // @Input('selectedCompanyFiles') selectedCompanyFiles: any;
    @Input() isTransTypeStatus: boolean = false;
    public changed: any = false;
    public fireIndexDataAfterClosePopUp: any = false;
    public fileChange: boolean = false;
    public pagesForSplit: any;
    public parentExport: any = null;
    public fileDetailsSave: any;
    public show_modal_report856 = false;
    public show_approveActiveCopy = false;
    public overOnCanvas: boolean = false;
    public fieldNameAsmachta: any = '';
    public splitPayment: any = false;
    public report856: any = false;
    public showTaxDeduction: any = false;
    public expenseOnly: any = false;
    public showNegative: any = false;
    public companyIdentificationName: any = null;
    public expenseAsmachtaType: any = 2;
    public incomeAsmachtaType: any = 1;
    public companyIdentificationId: any = null;
    public invoicePayment: FormControl = new FormControl(false);
    public modalShowImg: any = false;
    public arrPagesImgInvoice: any = [];
    public companyCustomerDetailsData: any = [];
    public showInvoiceHistory: any = false;
    public deleteInvoiceModal: any = false;
    public positionLeftDeleteInvoiceModal: number = 0;
    public valueOfSumWhenRevaluationCurr: number = 0;
    public companyCustomerDetailsSave: any;
    public revaluationCurrCode: any = null;
    public revaluationCurrCodeSign: any = null;
    fileDetails$: Observable<FileDetails>;
    dataPagesSize: any = [];
    fileFieldsForm: any;
    showEditModalPreSplit: any = false;
    setValuesOfDocType9: any = null;
    setIncomeOrExpenseDoc21: any = null;
    transTypeCodeArr = [
        {
            label: 'הכנסות פטורות',
            value: 'BIZ_NONE_INCOME'
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
    modalExpenseOnly: any = false;
    isMaamOpen: any = false;
    saveLastUpdateAfterBlur: any = null;
    isChanged33: any = false;
    public showEmptyFields: FormControl = new FormControl(false);
    orders: any;
    receipt: any;
    objOldValues = {};
    @Output() refreshBack: EventEmitter<any> = new EventEmitter();
    @Output() returnBack: EventEmitter<any> = new EventEmitter();
    @Output() goTo_JOURNAL_TRANS: EventEmitter<void> = new EventEmitter();
    @Output() goToRow: EventEmitter<any> = new EventEmitter();
    @Output() docFoldersShow: EventEmitter<any> = new EventEmitter();
    @Output() docNoteShow: EventEmitter<any> = new EventEmitter();
    @Output() docToSend: EventEmitter<any> = new EventEmitter();
    @Output() docRemoveFileShow: EventEmitter<any> = new EventEmitter();
    public maamPercentage = 17;
    public rate = 0;
    public getOffsetWidthMaxVar: any = 0;
    public rateEdit: boolean = false;
    public editHp: boolean = false;
    public numberOfDecimals = 4;
    @ViewChildren('pageImage', {read: ElementRef}) pageImages: QueryList<ElementRef<HTMLImageElement>>;
    @ViewChildren('svgElem', {read: ElementRef}) svgElems: QueryList<ElementRef<SVGAElement>>;
    imageScale = 1;
    sizeAllImg: any = false;
    public imageScaleOldInvoice: number = 1;
    public imageScaleNewInvoice: number = 1;
    public degRotateImg: number = 0;
    public getPageHeightVar: any = 0;
    public innerHeight: any = window.innerHeight;
    public window: any = window;
    // private setCustIdAuto: boolean = false;
    readonly fieldsWithPredefinedEditData: Map<string, any>;
    public changeByNav: boolean = false;
    public changeByNavNew: boolean = false;
    @ViewChild('beneficiarySelectionGuideOvP', {read: OverlayPanel})
    beneficiarySelectionGuideOvP: OverlayPanel;
    readonly alertBeforeSplit: { stopIt: boolean };
    public cupaAllTheOptions: boolean = false;
    public cupaAllTheOptions_paymentCustId: boolean = false;
    public cupaAllTheOptions_custId: boolean = false;
    companyCustomerDetails$: Observable<any>;
    showSplit = false;
    splitDisabled = false;
    isMatah = false;
    loadTime = true;
    currencySign: any = false;
    readonly vatOptions: Array<SelectItem>;
    readonly vatOptionsAll: Array<SelectItem>;
    readonly vatOptionsIncome: Array<SelectItem>;
    readonly docTypeOptions: Array<SelectItem>;
    readonly docTypeOptionsIncome: Array<SelectItem>;
    readonly invoiceTypeOptions: Array<SelectItem>;
    public showDocumentListStorageDataFired: any = false;
    public posTopPhotosInvoice: any = 0;
    public debounce: any;
    public showErrorModal: any = false;
    public modalCancel: any = false;
    @ViewChildren('formDropdowns') formDropdowns: QueryList<Dropdown>;
    @ViewChildren('formDropdownsCartis') formDropdownsCartis: QueryList<Dropdown>;
    @ViewChildren('formDropdownsCartis6')
    formDropdownsCartis6: QueryList<Dropdown>;
    @ViewChildren('formDropdownsMaamCustids')
    formDropdownsMaamCustids: QueryList<Dropdown>;
    @ViewChildren('formCalendars') formCalendars: QueryList<Calendar>;
    public wordsFieldsExist: Array<{
        fieldPage: number;
        fieldPosition: Array<{ x: number; y: number }>;
        field: OcrField;
    }> = [];
    public fileDetails: any = false;
    public visionResult: any = false;
    // }>>>>;
    currentPage = new DistinctBehaviorSubject<number>(1);
    currentInsideModalPage = new DistinctBehaviorSubject<number>(1);
    currentInsideModalPageNew = new DistinctBehaviorSubject<number>(1);
    public visionResultsArr: any = [];
    public symbolsArr: any = [];
    alerstIdsArr: any = [];
    showDoubleSuspect: any = false;
    activeFieldName: boolean = false;
    unionResTemp: unknown = null;
    activeField: {
        field: OcrField;
        element: Element | any;
        formGroup: any;
    };
    @ViewChild('activeWordElement') activeWordElement: any;
    @ViewChild('activeWordElementDiv') activeWordElementDiv: any;
    // visionResultWords$: Observable<Array<Observable<Array<{
    //     vertices: Array<{ x: number; y: number; }>,
    //     text: string;
    @ViewChild('pagesScrollContainer') pagesScrollContainer: HTMLDivElement;
    @ViewChild('fieldsList') scrollContainer: ElementRef;
    activeWord: {
        pageNo: number;
        position: Array<{ x: number; y: number }> | { x: number; y: number }[];
    };
    public sidebarImgsDescList: any = false;
    public showDocumentListStorageDataFile: any = false;
    editOrderModalShow = false;
    editReceiptModalShow = false;
    calcProgress = false;
    editOrderFromDoubleSuspectModalShow = false;
    readonly inlineEditorForm: any;
    navigatorData$: BehaviorSubject<{
        currDocNo: number;
        total: number;
        forwardLink: string;
        backwardLink: string;
    }> = new BehaviorSubject<{
        currDocNo: number;
        total: number;
        forwardLink: string;
        backwardLink: string;
    }>(null);
    public showAlertHideAllFields = false;
    public splitContentModal: any = false;
    public changeDegrees: any = false;

    cachedContent$: Observable<Array<Observable<null | Blob>>>;
    currentPageCachedContent$: Observable<null | Blob>;
    timeForChangePos: any;
    activeDragHandler: {
        src: SVGGraphicsElement;
        vertexIndex: 0 | 1 | 2 | 3;
        vertices: Array<{ x: number; y: number }>;
        offset?: { x: number; y: number };
        transform?: { x: number; y: number };
        closestByXVertex: { x: number; y: number };
        closestByYVertex: { x: number; y: number };
    };
    activeDragMainHandler: {
        src: SVGGraphicsElement;
        vertices: Array<{ x: number; y: number }>;
        offset?: { x: number; y: number };
        transform?: { x: number; y: number };
    };
    // readonly sumsExcludeIncludeAndVat: FormArray;
    public currencyList$: Observable<Array<SelectItemGroup>>;
    public currencyList: any = [];
    public currencyListModal: any = [];
    public arrCurrencies: any = [];
    public arrCurrenciesWithoutILS: any = [];
    readonly docCompanyReplacement: {
        visible: boolean;
        companyReplacement: any;
        onApprove: () => void;
        show(): void;
    };
    readonly docNote: {
        visible: boolean;
        noteFC: any;
        fd: FileDetails;
        approve: () => void;
        show(fd: FileDetails): void;
    };
    readonly navigateToCreateHashBankStatusPrompt: {
        visible: boolean;
        approve: () => void;
    };
    @ViewChildren('pageContainer', {read: ElementRef})
    _pages: QueryList<ElementRef>;
    @ViewChildren('pageContainerInsideModal', {read: ElementRef})
    _pagesInsideModal: QueryList<ElementRef>;
    @ViewChildren('pageContainerInsideModal2', {read: ElementRef})
    _pagesInsideModal2: QueryList<ElementRef>;
    @ViewChildren('pageContainerInsideModalNew', {read: ElementRef})
    _pagesInsideModalNew: QueryList<ElementRef>;
    public fileProgress = true;
    public finishedLoadedImgView = false;
    public loaderGetCompanyCustomerDetails = false;
    public subscriptionTime: any;
    scrollSubscription = Subscription.EMPTY;
    public saverValuesOrder = {
        totalWithoutMaam: 0,
        totalIncludedMaam: 0,
        matahAmount: 0
    };
    public saverValuesReceipt = {
        total: 0,
        paymentNikui: 0,
        paymentTotal: 0
    };
    public getJournalHistory: any = null;
    public suspiciousDoubleInvoice: any = {};
    public modalEditCardsBeforeSend: any = false;
    public saveOldValue: any = false;
    public focusInput: any = {};
    public infoModal: any;
    public uploadNewRotate$: any;
    public rotateFile$: any;
    public imageReplaceUrl$: any;
    @ViewChildren('fieldListItem', {read: MatListItem})
    fieldListItems: QueryList<MatListItem>;
    public mergeFiles = false;
    public selectedItem: any;
    public draggedIndex: number = -1;
    public onDragOverIndex: number = -1;
    public selcetedFiles: any = [];
    scrHeight: any;
    public currencyListTemp: any = false;
    public currencyListTempLoader: any = false;
    public responseRest_supplierJournal: any = null;
    public currencySetModal: any = false;
    public revaluationCurrCodeArr: any = [];
    public selectedCurrency: any = false;
    public type_currencyRates_modal: any;
    public minDateCalendar: any;
    public maxDateCalendar: any;
    public minDateCalendar13: any;
    public maxDateCalendar13: any;
    public minDateCalendar_dateValue: any;
    public maxDateCalendar_dateValue: any;
    public modalDocumentApproveDouble: any = false;
    public modalDocumentApproveOldDate: any = false;
    public arrOption2: any = [];
    public arrOption6: any = [];
    public arrOption6Saved: any = [];
    public arrOption30: any = [];
    public arrOption40: any = [];
    public arrOption41: any = [];
    // tslint:disable-next-line:member-ordering
    public selectedElement;
    // tslint:disable-next-line:member-ordering
    public offset;
    public showDocumentStorageDataFired = false;
    public sidebarImgs: any = false;
    private rollingBack: boolean;
    private readonly forceReload$ = new Subject<void>();
    private readonly forceReloadCurrency$ = new Subject<void>();
    private globalListenerWhenInEdit: () => void | boolean;
    private readonly fieldValueChangeSubscribers: Map<string, Subscription>;
    private visionResult$: Observable<Array<Observable<any>>>;
    private currentPageVisionResults$: Observable<any>;
    private postponedSub: Subscription;
    private inViewObservers: Map<Element, Subscription> = new Map<Element,
        Subscription>();
    private inViewObserversInsideModal: Map<Element, Subscription> = new Map<Element,
        Subscription>();
    private inViewObserversInsideModal2: Map<Element, Subscription> = new Map<Element,
        Subscription>();
    private inViewObserversInsideModalNew: Map<Element, Subscription> = new Map<Element,
        Subscription>();
    private readonly destroyed$ = new Subject<void>();
    private buttonClicked = new Subject<any>();
    private readonly field9ValuesAllowedWithOpenMaamPrc = [
        'חשבונית מס',
        'חשבונית מס קבלה',
        'אחר',
        'חשבונית זיכוי'
    ];
    splitImagesOuputSrc: any = false;
    urlsFiles: any;
    public fileUploadProgress = false;
    public progress: any;
    private _window = typeof window === 'object' && window ? window : null;
    public indexFileTimer = 0;
    public progressAll = new Subject<number>();

    constructor(
        public httpServices: HttpServices,
        private route: ActivatedRoute,
        private ocrService: OcrService,
        private changeDetectorRef: ChangeDetectorRef,
        public reportService: ReportService,
        private fb: FormBuilder,
        private renderer: Renderer2,
        private sharedService: SharedService,
        private http: HttpClient,
        public override sharedComponent: SharedComponent,
        public locationStrategy: LocationStrategy,
        private storageService: StorageService,
        public userService: UserService,
        private geometryHelper: GeometryHelperService,
        private translate: TranslateService,
        private router: Router,
        private domSanitizer: DomSanitizer
    ) {
        super(sharedComponent);

        this.minDateCalendar = this.userService.appData
            .moment()
            .subtract(1, 'years')
            .startOf('year')
            .toDate();
        this.maxDateCalendar = this.userService.appData
            .moment()
            .endOf('day')
            .toDate();

        this.minDateCalendar13 = this.userService.appData
            .moment()
            .subtract(1, 'years')
            .startOf('year')
            .toDate();
        this.maxDateCalendar13 = this.userService.appData
            .moment()
            .add(1, 'years')
            .endOf('year')
            .endOf('day')
            .toDate();

        this.minDateCalendar_dateValue = this.userService.appData
            .moment()
            .subtract(3, 'years')
            .startOf('year')
            .toDate();
        this.maxDateCalendar_dateValue = this.userService.appData
            .moment()
            .add(7, 'years')
            .endOf('year')
            .endOf('day')
            .toDate();

        this.scrHeight = window.innerHeight;
        history.pushState(null, null, location.href);
        this.locationStrategy.onPopState(() => {
            history.pushState(null, null, location.href);
            this.goToRow.emit({
                refresh: this.fileChange,
                response: this._fileScanView.fileId
            });
            return false;
        });
        // defaultOptions.workerSrc = './assets/pdf.worker-es5.js';
        this.fileFieldsForm = new FormGroup({});
        // this.fileFieldsForm = new FormGroup({}, this.excludingPlusVatEqualsIncluding);
        this.fieldValueChangeSubscribers = new Map<string, Subscription>();
        this.fieldsWithPredefinedEditData = new Map<string, any>();
        this.fieldsWithPredefinedEditData.set('2', {}); // אינדקס
        this.fieldsWithPredefinedEditData.set('4', {}); // סוג תנועה
        this.fieldsWithPredefinedEditData.set('5', {}); // חודש דיווח מע"מ
        this.fieldsWithPredefinedEditData.set('6', {}); // כרטיס
        this.fieldsWithPredefinedEditData.set('22', {}); // כרטיס מע”מ
        this.fieldsWithPredefinedEditData.set('9', {}); // סוג מסמך
        this.fieldsWithPredefinedEditData.set('10', {}); // מקור
        this.fieldsWithPredefinedEditData.set('12', {}); // מטבע
        this.fieldsWithPredefinedEditData.set('21', {}); // סוג חשבונית
        this.fieldsWithPredefinedEditData.set('30', {}); // כרטיס קופה
        this.fieldsWithPredefinedEditData.set('40', {}); //  סוג תנועה
        this.fieldsWithPredefinedEditData.set('41', {}); // סוג תנועה (קבלה)
        // this.fieldsWithPredefinedEditData.set('33', {}); // ניכוי מס במקור

        // 'הוצאה - ללא מע"מ', 'הוצאה - מע"מ מלא', 'הוצאה - 2/3 מע"מ', 'הוצאה - 1/4 מע"מ',
        //     'זיכוי הוצאה - ללא מע"מ', 'זיכוי הוצאה - מע"מ מלא',
        //     'הכנסה - ללא מע"מ', 'הכנסה - מע"מ מלא',
        //     'זיכוי הכנסה - ללא מע"מ', 'זיכוי הכנסה - מע"מ מלא'

        this.vatOptionsAll = [
            {
                label: 'מע"מ מלא',
                value: 'FULL'
            },
            {
                label: 'מע"מ ⅔',
                value: 'TWO_THIRD'
            },
            {
                label: 'מע"מ ¼',
                value: 'QUARTER'
            },
            {
                label: 'ללא מע"מ',
                value: 'NONE'
            },
            {
                label: 'מע"מ מלא רכוש קבוע',
                value: 'FULL_PROPERTY'
            },
            {
                label: 'מע"מ מלא יבוא',
                value: 'FULL_IMPORT'
            },
            {
                label: 'מע"מ פתוח',
                value: 'OPEN'
            }
        ];
        this.vatOptions = [
            {
                label: 'מע"מ מלא',
                value: 'FULL'
            },
            {
                label: 'מע"מ ⅔',
                value: 'TWO_THIRD'
            },
            {
                label: 'מע"מ ¼',
                value: 'QUARTER'
            },
            {
                label: 'ללא מע"מ',
                value: 'NONE'
            },
            {
                label: 'מע"מ מלא רכוש קבוע',
                value: 'FULL_PROPERTY'
            },
            {
                label: 'מע"מ מלא יבוא',
                value: 'FULL_IMPORT'
            }
        ];
        this.vatOptionsIncome = [
            {
                label: 'הכנסות פטורות',
                value: 'NONE'
            },
            {
                label: 'הכנסות',
                value: 'FULL'
            }
            // {
            //     label: 'מע"מ פתוח',
            //     value: 'OPEN'
            // }
        ];
        this.docTypeOptions = [
            'חשבונית מס',
            'חשבונית מס קבלה',
            'חשבונית זיכוי',
            'חשבונית מט"ח',
            'מסמך פטור ממע"מ',
            // 'חשבונית עסקה',
            // 'תעודת משלוח',
            // 'קבלה',
            'אחר'
        ].map((value) => {
            return {
                label: value,
                value: value,
                hashBankCreatable:
                    value.startsWith('חשבונית') && value !== 'חשבונית עסקה'
            } as SelectItem;
        });
        this.docTypeOptionsIncome = [
            'חשבונית מס',
            'חשבונית מס קבלה',
            'חשבונית זיכוי',
            'חשבונית מט"ח',
            'מסמך פטור ממע"מ'
            // 'חשבונית עסקה',
            // 'תעודת משלוח',
            // 'קבלה',
        ].map((value) => {
            return {
                label: value,
                value: value,
                hashBankCreatable:
                    value.startsWith('חשבונית') && value !== 'חשבונית עסקה'
            } as SelectItem;
        });
        this.invoiceTypeOptions = [
            {
                label: 'הכנסה',
                value: 0
            },
            {
                label: 'הוצאה',
                value: 1
            }
        ];

        this.forceReloadCurrency$.pipe(startWith(null)).subscribe(() => {
            this.currencyList$ = this.sharedService
                .getCompanyCurrency({
                    uuid: this.userService.appData.userData.companySelect.companyId
                })
                .pipe(
                    map((response: any) => {
                        const currencies =
                            response && !response.error ? response.body : null;
                        this.currencyList = currencies;
                        if (!Array.isArray(currencies)) {
                            return [];
                        }
                        const common: SelectItemGroup = {
                                label: 'מטבעות נפוצים',
                                items: []
                            },
                            commonWithoutILS: SelectItemGroup = {
                                label: 'מטבעות נפוצים',
                                items: []
                            },
                            other: SelectItemGroup = {label: 'מטבעות אחרים', items: []};
                        for (const currency of currencies) {
                            (currency.common ? common : other).items.push({
                                label: [currency.code, currency.sign].join(' - '),
                                value: currency.id
                            } as SelectItem);
                            if (currency.id !== 1 && currency.common) {
                                commonWithoutILS.items.push({
                                    label: [currency.code, currency.sign].join(' - '),
                                    value: currency.id
                                } as SelectItem);
                            }
                        }
                        this.arrCurrencies = [
                            common.items.length ? common : null,
                            other.items.length ? other : null
                        ].filter((v) => !!v);
                        this.arrCurrenciesWithoutILS = [
                            commonWithoutILS.items.length ? commonWithoutILS : null,
                            other.items.length ? other : null
                        ].filter((v) => !!v);
                        return this.arrCurrencies;
                    }),
                    publishRef
                );
        });

        this.inlineEditorForm = new FormGroup({
            fieldValue: new FormControl(''),
            fieldPage: new FormControl(''),
            fieldPosition: new FormControl('')
        });

        // this.sumsExcludeIncludeAndVat = new FormArray([],
        //     this.excludingPlusVatEqualsIncluding);
        // noinspection JSUnusedLocalSymbols
        this.docCompanyReplacement = {
            visible: false,
            companyReplacement: null,
            show(): void {
                this.companyReplacement = null;
                this.visible = true;
            },
            onApprove: () => {
                const selectedCompany = this.docCompanyReplacement.companyReplacement;
                this.reportService.postponed = {
                    action: this.ocrService.changeFileCompany(
                        [this._fileScanView.fileId],
                        selectedCompany.companyId
                    ),
                    message: this.domSanitizer.bypassSecurityTrustHtml(
                        'המסמך הועבר לפיענוח ולאחר מכן יעבור ל' +
                        '<b>' +
                        selectedCompany.companyName +
                        '</b>'
                    ),
                    fired: false
                };
                this.docCompanyReplacement.visible = false;
                timer(3000)
                    .pipe(
                        switchMap(() => {
                            if (
                                this.reportService.postponed &&
                                this.reportService.postponed.action
                            ) {
                                return this.reportService.postponed.action;
                            } else {
                                return EMPTY;
                            }
                        }),
                        tap(() => {
                            this.reportService.postponed.fired = true;
                        }),
                        take(1)
                    )
                    .subscribe((response: any) => {
                        const bodyRes = response ? response['body'] : response;
                        const statusRes = response ? response.status : response;
                        if (statusRes === 422) {
                            this.fileChange = true;
                            if (bodyRes.redoFor) {
                                this._fileScanView.fileId = bodyRes.redoFor;
                                this.setFile(this._fileScanView);
                            } else {
                                this.goToRow.emit({
                                    refresh: true,
                                    response: this._fileScanView.fileId
                                });
                            }
                            return;
                        }
                        this.refreshBack.emit(true);
                        const navData = this.navigatorData$.getValue();
                        if (navData && navData.forwardLink) {
                            this.setFile(navData.forwardLink);
                        }
                    });
            }
        };
        this.docNote = {
            visible: false,
            noteFC: new FormGroup({
                note: new FormControl(null)
            }),
            fd: null,
            show(fd: FileDetails): void {
                this.fd = fd;
                this.noteFC.reset({
                    note: fd.note
                });
                this.visible = true;
            },
            approve: () => {
                if (
                    (this.docNote.noteFC.value.note || '').trim() ===
                    (this.docNote.fd.note || '').trim()
                ) {
                    this.docNote.visible = false;
                    return;
                }

                this.ocrService
                    .setFileData(
                        Object.assign(
                            {
                                fileId: this._fileScanView.fileId,
                                flag: this.docNote.fd.flag
                            },
                            this.docNote.noteFC.value
                        )
                    )
                    .subscribe((response: any) => {
                        this.fileChange = true;
                        this.docNote.fd.note = this.docNote.noteFC.value.note;
                        this.docNote.visible = false;
                        // this.returnBack.emit();
                        const bodyRes = response ? response['body'] : response;
                        const statusRes = response ? response.status : response;
                        if (statusRes === 422) {
                            this.fileChange = true;
                            if (bodyRes.redoFor) {
                                this._fileScanView.fileId = bodyRes.redoFor;
                                this.setFile(this._fileScanView);
                            } else {
                                this.goToRow.emit({
                                    refresh: true,
                                    response: this._fileScanView.fileId
                                });
                            }
                        }
                    });
            }
        };
        this.navigateToCreateHashBankStatusPrompt = {
            visible: false,
            approve: () => {
                this.navigateToCreateHashBankStatusPrompt.visible = false;
                this.goTo_JOURNAL_TRANS.emit();
            }
        };
        this.alertBeforeSplit = {
            stopIt:
                this.storageService.localStorageGetterItem(
                    'alertBeforeSplit.display'
                ) === 'false'
        };
    }

    public _selectedCompanyFiles: any;

    @Input()
    set selectedCompanyFiles(files: any) {
        let allFiles = files;
        if (files && files.length && files[0].titleQuickApproveArray) {
            allFiles = files.filter((it) => !it.titleQuickApproveArray);
        }
        this._selectedCompanyFiles = allFiles;
    }

    get selectedCompanyFiles(): any {
        return this._selectedCompanyFiles;
    }


    public _fileScanView: any;

    @Input()
    set zFileScanView(file: any) {
        this.setFile(file);
    }

    private _postponed: PostponedAction;

    get postponed(): PostponedAction {
        return this._postponed;
    }

    set postponed(value: PostponedAction) {
        if (this.postponedSub && !this.postponedSub.closed) {
            this.postponedSub.unsubscribe();
        }

        const previousActionHandle: Observable<PostponedAction> = defer(() => {
            if (
                value &&
                this._postponed &&
                this._postponed.action &&
                !this._postponed.fired
            ) {
                this._postponed.fired = true;
                return this._postponed.action.pipe(
                    tap(() => {
                        this.returnBack.emit(this.fileChange);
                    }),
                    switchMap(() =>
                        this.navigatorData$.pipe(
                            distinctUntilChanged((a, b) => {
                                return (a === null) === (b === null) && a.total === b.total;
                            }),
                            skip(1)
                        )
                    ),
                    switchMap(() => of(value))
                );
            } else {
                return of(value);
            }
        });

        combineLatest([previousActionHandle, this.navigatorData$])
            .pipe(take(1))
            .subscribe(
                ([newAction, navData]: any) => {
                    this._postponed = newAction;

                    if (newAction && newAction.action) {
                        newAction.fired = !navData || !navData.forwardLink;
                        this.postponedSub = (
                            newAction.fired
                                ? newAction.action
                                : timer(0).pipe(
                                    switchMap(() => newAction.action),
                                    tap(() => {
                                        newAction.fired = true;
                                        // this.returnBack.emit();
                                    })
                                )
                        )
                            .pipe(take(1))
                            .subscribe(
                                () => {
                                    if (navData && navData.forwardLink) {
                                        this._selectedCompanyFiles =
                                            this._selectedCompanyFiles.filter(
                                                (fd) => fd.fileId !== this._fileScanView.fileId
                                            );
                                        this.setFile(navData.forwardLink);
                                    } else {
                                        this.navigateToCreateHashBankStatusPrompt.visible = true;
                                    }
                                },
                                (err: HttpErrorResponse) => {
                                    if (err.error) {
                                        if (err.status === 400) {
                                            this.showErrorModal = true;
                                            this.sharedService
                                                .approveError({
                                                    errorText: err.error.message,
                                                    fileId: this._fileScanView.fileId
                                                })
                                                .subscribe((response: any) => {
                                                });
                                        }
                                        console.log('An error occurred:', err.error.message);
                                    } else {
                                        console.log(
                                            `Backend returned code ${err.status}, body was: ${err.error}`
                                        );
                                    }
                                }
                            );
                    } else {
                        if (navData && navData.forwardLink) {
                            this._selectedCompanyFiles = this._selectedCompanyFiles.filter(
                                (fd) => fd.fileId !== this._fileScanView.fileId
                            );
                            this.setFile(navData.forwardLink);
                        } else {
                            this.navigateToCreateHashBankStatusPrompt.visible = true;
                        }
                    }
                }
            );
    }

    get pageContainer(): QueryList<ElementRef> {
        return this._pages;
    }

    set pageContainer(pages: QueryList<ElementRef>) {
        this._pages = pages;
        pages.reduce((acmltr, item, index) => {
            return acmltr.set(
                item.nativeElement,
                inView(item.nativeElement)
                    .pipe(takeUntil(this.destroyed$))
                    .subscribe((isInView) => {
                        if (isInView && this.currentPage.getValue() !== index + 1) {
                            this.currentPage.next(index + 1);
                        }
                    })
            );
        }, this.inViewObservers);
    }

    get pageContainerInsideModal(): QueryList<ElementRef> {
        return this._pagesInsideModal;
    }

    set pageContainerInsideModal(pages: QueryList<ElementRef>) {
        this._pagesInsideModal = pages;
        pages.reduce((acmltr, item, index) => {
            return acmltr.set(
                item.nativeElement,
                inView(item.nativeElement)
                    .pipe(takeUntil(this.destroyed$))
                    .subscribe((isInView) => {
                        if (
                            isInView &&
                            this.currentInsideModalPage.getValue() !== index + 1
                        ) {
                            this.currentInsideModalPage.next(index + 1);
                        }
                    })
            );
        }, this.inViewObserversInsideModal);
    }

    get pageContainerInsideModal2(): QueryList<ElementRef> {
        return this._pagesInsideModal2;
    }

    set pageContainerInsideModal2(pages: QueryList<ElementRef>) {
        this._pagesInsideModal2 = pages;
        pages.reduce((acmltr, item, index) => {
            return acmltr.set(
                item.nativeElement,
                inView(item.nativeElement)
                    .pipe(takeUntil(this.destroyed$))
                    .subscribe((isInView) => {
                        if (
                            isInView &&
                            this.currentInsideModalPage.getValue() !== index + 1
                        ) {
                            this.currentInsideModalPage.next(index + 1);
                        }
                    })
            );
        }, this.inViewObserversInsideModal2);
    }

    get pageContainerInsideModalNew(): QueryList<ElementRef> {
        return this._pagesInsideModalNew;
    }

    set pageContainerInsideModalNew(pages: QueryList<ElementRef>) {
        this._pagesInsideModalNew = pages;
        pages.reduce((acmltr, item, index) => {
            return acmltr.set(
                item.nativeElement,
                inView(item.nativeElement)
                    .pipe(takeUntil(this.destroyed$))
                    .subscribe((isInView) => {
                        if (
                            isInView &&
                            this.currentInsideModalPageNew.getValue() !== index + 1
                        ) {
                            this.currentInsideModalPageNew.next(index + 1);
                        }
                    })
            );
        }, this.inViewObserversInsideModalNew);
    }

    get isWindows() {
        return (
            window.navigator['userAgentData']['platform'] === 'Windows'
        );
    }

    get arr(): FormArray {
        return this.orders.get('arr') as FormArray;
    }

    get arrReceipt(): FormArray {
        return this.receipt.get('arr') as FormArray;
    }

    @HostListener('window:resize', ['$event'])
    getScreenSize(event?: any) {
        this.scrHeight = window.innerHeight;
    }

    trackCurrency(idx: number, item: any) {
        return (item ? item.code : null) || idx;
    }

    openModalAddCurrency() {
        this.selectedCurrency = false;
        this.currencyListTemp = [];
        this.currencyListTempLoader = true;
        this.responseRest_supplierJournal = null;

        this.sharedService
            .supplierJournal({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                const responseRest_supplierJournal = response
                    ? response['body']
                    : response;
                this.responseRest_supplierJournal = responseRest_supplierJournal;
                this.ocrService.requestCurrencyList().subscribe((currencies) => {
                    const responseRest = currencies ? currencies['body'] : currencies;
                    this.currencyListTemp = responseRest.filter(
                        (it) =>
                            it.code !== 'ILS' &&
                            it.indDefault === false &&
                            !responseRest_supplierJournal.currencyRates.some(
                                (item) => item.code === it.code
                            ) &&
                            !this.currencyList.some((item) => item.code === it.code)
                    );
                    this.currencyListTempLoader = false;
                });
            });
    }

    addCurrency(name: any, bankIsrael: any, selectedCurrency: any) {
        if (selectedCurrency.indDefault) {
            this.responseRest_supplierJournal.currencyRates.push({
                code: selectedCurrency['code'],
                delete: false,
                fixedRate:
                    selectedCurrency['type'] === 'BANK'
                        ? 0
                        : Number(selectedCurrency['fixedRate']),
                hashCodeId: selectedCurrency['hashCodeId']
                    ? Number(selectedCurrency['hashCodeId'])
                    : 0,
                type: selectedCurrency['type']
            });
            this.selectedCurrency = false;
            this.currencyListTemp = false;
            this.updateSupplierJournal();
        } else {
            this.type_currencyRates_modal = {
                type: selectedCurrency.bankIsrael ? 'BANK' : 'FIXED',
                hashCodeId: '',
                value: ''
            };
            this.currencyListTemp = false;
            this.currencySetModal = true;
        }
    }

    addCurrencyModal(name: any, bankIsrael: any, selectedCurrency: any) {
        selectedCurrency['type'] = this.type_currencyRates_modal.type;
        selectedCurrency['fixedRate'] =
            this.type_currencyRates_modal.type === 'BANK'
                ? 0
                : Number(this.type_currencyRates_modal.value);
        selectedCurrency['hashCodeId'] = this.type_currencyRates_modal.hashCodeId
            ? Number(this.type_currencyRates_modal.hashCodeId)
            : 0;
        selectedCurrency['bankIsrael'] = bankIsrael;
        this.responseRest_supplierJournal.currencyRates.push({
            code: selectedCurrency['code'],
            delete: false,
            fixedRate: selectedCurrency['fixedRate'],
            hashCodeId: selectedCurrency['hashCodeId'],
            type: selectedCurrency['type']
        });
        this.selectedCurrency = false;
        this.currencySetModal = false;
        this.updateSupplierJournal();
    }

    setMaxDigitsAfterDecModal(item: any, hashCodeId?: any) {
        let rateInput = item.toString().replace(/[^0-9.]/g, '');
        if (rateInput && rateInput.includes('.')) {
            const splitNumbers = rateInput.split('.');
            if (splitNumbers[1].length > 2) {
                rateInput = splitNumbers[0] + '.' + splitNumbers[1].slice(0, 2);
            }
        }
        if (!hashCodeId) {
            this.type_currencyRates_modal.value = rateInput;
        } else {
            this.type_currencyRates_modal.hashCodeId = rateInput;
        }
    }

    updateSupplierJournal() {
        this.sharedService
            .updateSupplierJournal(this.responseRest_supplierJournal)
            .subscribe(() => {
                this.forceReloadCurrency$.next();
            });
    }

    ngOnDestroy(): void {
        // console.log('outside');
        this.storageService.sessionStorageRemoveItem('accountants-doc-open');
        this.destroyed$.next();
        this.destroyed$.complete();
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        if (this.uploadNewRotate$) {
            this.uploadNewRotate$.unsubscribe();
        }
        if (this.imageReplaceUrl$) {
            this.imageReplaceUrl$.unsubscribe();
        }
        if (this.rotateFile$) {
            this.rotateFile$.unsubscribe();
        }
        if (this.subscriptionTime) {
            this.subscriptionTime.unsubscribe();
        }
        if (document.getElementsByClassName('dragme').length) {
            document.getElementsByClassName('dragme')[0].remove();
        }
        this.destroy();
    }

    getPageHeightFunc(value: any) {
        setTimeout(() => {
            return getPageHeight(value);
        }, 0);
    }

    setDefOpt_maamCustids() {
        if (this.userService.appData.userData.maamCustids && this.userService.appData.userData.maamCustids.length) {
            let custId2 = null;
            if (this.fileFieldsForm.get('2') && this.fileFieldsForm.get('2').get('effectiveValue') && this.fileFieldsForm.get('2').get('effectiveValue').value) {
                custId2 = this.fileFieldsForm.get('2').get('effectiveValue').value.custId;
            }
            let custId30 = null;
            if (this.fileFieldsForm.get('30') && this.fileFieldsForm.get('30').get('effectiveValue') && this.fileFieldsForm.get('30').get('effectiveValue').value) {
                custId30 = this.fileFieldsForm.get('30').get('effectiveValue').value.custId;
            }
            let custId6 = null;
            if (this.fileFieldsForm.get('6') && this.fileFieldsForm.get('6').get('effectiveValue') && this.fileFieldsForm.get('6').get('effectiveValue').value) {
                custId6 = this.fileFieldsForm.get('6').get('effectiveValue').value.custId;
            }
            if (custId2 || custId6 || custId30) {
                this.userService.appData.userData.maamCustids.forEach(it => {
                    it['disabled'] = (it.value === custId2) || (it.value === custId6) || (it.value === custId30);
                });
            }
        }
    }

    addPriemerObject(arrs: any, numDD: any) {
        let arrBuilder = [];
        let arr = JSON.parse(JSON.stringify(arrs));
        if (numDD === 6) {
            let custId2 = null;
            if (this.fileFieldsForm.get('2') && this.fileFieldsForm.get('2').get('effectiveValue') && this.fileFieldsForm.get('2').get('effectiveValue').value) {
                custId2 = this.fileFieldsForm.get('2').get('effectiveValue').value.custId;
            }
            let custId22 = null;
            if (this.fileFieldsForm.get('22') && this.fileFieldsForm.get('22').get('effectiveValue') && this.fileFieldsForm.get('22').get('effectiveValue').value) {
                custId22 = this.fileFieldsForm.get('22').get('effectiveValue').value.custId;
            }
            let custId30 = null;
            if (this.fileFieldsForm.get('30') && this.fileFieldsForm.get('30').get('effectiveValue') && this.fileFieldsForm.get('30').get('effectiveValue').value) {
                custId30 = this.fileFieldsForm.get('30').get('effectiveValue').value.custId;
            }
            if (custId2 || custId22 || custId30) {
                arr.forEach(it => {
                    it['disabled'] = (it.custId === custId2) || (it.custId === custId22) || (it.custId === custId30);
                });
            }
            if (arr.find(it => it.isHistory)) {
                arr.unshift({
                    disabled: true,
                    cartisName: null,
                    custId: null,
                    title: true,
                    lName: null,
                    hp: null,
                    id: null,
                    hashCartisCodeId: 1,
                    isHistory: true
                });
            }
        }
        if (
            arr &&
            arr.length &&
            this.fileFieldsForm.get(numDD.toString()) &&
            this.fileFieldsForm.get(numDD.toString()).get('effectiveValue') &&
            this.fileFieldsForm.get(numDD.toString()).get('effectiveValue').value &&
            this.fileFieldsForm.get(numDD.toString()).get('effectiveValue').value
                .custId
        ) {
            arrBuilder = [
                {
                    cartisName: 'ביטול בחירה',
                    cartisCodeId: null,
                    custId: null,
                    hashCartisCodeId: null,
                    lName: null,
                    isHistory: false,
                    hp: null,
                    id: null,
                    pettyCash: false,
                    supplierTaxDeduction: null,
                    customerTaxDeduction: null
                },
                ...arr
            ];
        } else {
            arrBuilder = arr;
        }
        if (numDD === 2) {
            let custId6 = null;
            if (this.fileFieldsForm.get('6') && this.fileFieldsForm.get('6').get('effectiveValue') && this.fileFieldsForm.get('6').get('effectiveValue').value) {
                custId6 = this.fileFieldsForm.get('6').get('effectiveValue').value.custId;
            }
            let custId22 = null;
            if (this.fileFieldsForm.get('22') && this.fileFieldsForm.get('22').get('effectiveValue') && this.fileFieldsForm.get('22').get('effectiveValue').value) {
                custId22 = this.fileFieldsForm.get('22').get('effectiveValue').value.custId;
            }
            let custId30 = null;
            if (this.fileFieldsForm.get('30') && this.fileFieldsForm.get('30').get('effectiveValue') && this.fileFieldsForm.get('30').get('effectiveValue').value) {
                custId30 = this.fileFieldsForm.get('30').get('effectiveValue').value.custId;
            }

            if (custId6 || custId22 || custId30) {
                arrBuilder.forEach(it => {
                    it['disabled'] = (it.custId === custId6) || (it.custId === custId22) || (it.custId === custId30);
                });
            }
        }
        if (numDD === 30) {
            let custId6 = null;
            if (this.fileFieldsForm.get('6') && this.fileFieldsForm.get('6').get('effectiveValue') && this.fileFieldsForm.get('6').get('effectiveValue').value) {
                custId6 = this.fileFieldsForm.get('6').get('effectiveValue').value.custId;
            }
            let custId22 = null;
            if (this.fileFieldsForm.get('22') && this.fileFieldsForm.get('22').get('effectiveValue') && this.fileFieldsForm.get('22').get('effectiveValue').value) {
                custId22 = this.fileFieldsForm.get('22').get('effectiveValue').value.custId;
            }
            let custId2 = null;
            if (this.fileFieldsForm.get('2') && this.fileFieldsForm.get('2').get('effectiveValue') && this.fileFieldsForm.get('2').get('effectiveValue').value) {
                custId2 = this.fileFieldsForm.get('2').get('effectiveValue').value.custId;
            }

            if (custId6 || custId22 || custId2) {
                arrBuilder.forEach(it => {
                    it['disabled'] = (it.custId === custId6) || (it.custId === custId22) || (it.custId === custId2);
                });
            }
            arrBuilder.unshift({
                cartisName: null,
                custId: null,
                lName: null,
                title: true,
                disabled: true,
                hp: null,
                id: null,
                isHistory: false
            });
        }

        return arrBuilder;
    }

    setDefOpt() {
        this.arrOption6Saved = JSON.parse(JSON.stringify(this.arrOption6));
    }

    trackByUniqueId(index: number, val: any): any {
        return String(val.custId) + '_' + index;
    }

    filterFuncReset(event: any, ddCategories: any) {
        if (event.filter) {
            if (ddCategories.scroller) {
                setTimeout(() => {
                    // ddCategories.scroller.contentStyle.transform = 'translate3d(0px, 0px, 0)';
                    // ddCategories.scroller.contentEl.style.transform = 'translate3d(0px, 0px, 0px)';
                    // ddCategories.scroller.scrollTo({top: 0});
                }, 0);
            }
        } else {
            ddCategories.resetFilter();
            if (ddCategories.scroller) {
                // ddCategories.scroller.scrollTo({top: 0});
            }
        }
    }

    filterFunc(event: any, ddCategories: any) {
        if (event.filter) {
            const categoriesSaved = JSON.parse(JSON.stringify(this.arrOption6Saved));
            const categoriesFiltered = categoriesSaved.filter(it => it.custId && it.custId.includes(event.filter) || (it.lName && it.lName.includes(event.filter)));
            const transTypeRegular = categoriesFiltered.filter((it) => !it.isHistory);
            const transTypeHistory = categoriesFiltered.filter((it) => it.isHistory && !it.title);
            if (transTypeHistory.length) {
                transTypeHistory.forEach(v => {
                    v.isLastHistory = false;
                });
                transTypeHistory[transTypeHistory.length - 1].isLastHistory = true;
                transTypeHistory.unshift({
                    disabled: true,
                    cartisName: null,
                    custId: null,
                    lName: null,
                    hp: null,
                    id: null,
                    title: true,
                    hashCartisCodeId: 1,
                    isHistory: true
                });
                transTypeRegular.unshift(...transTypeHistory);
            }
            this.arrOption6 = transTypeRegular;
            ddCategories.options = this.arrOption6;
            ddCategories.optionsToDisplay = this.arrOption6;
            if (ddCategories.scroller) {
                setTimeout(() => {
                    // ddCategories.scroller.contentStyle.transform = 'translate3d(0px, 0px, 0)';
                    // ddCategories.scroller.contentEl.style.transform = 'translate3d(0px, 0px, 0px)';
                    // ddCategories.scroller.scrollTo({top: 0});
                }, 10);
            }
        } else {
            this.arrOption6 = JSON.parse(JSON.stringify(this.arrOption6Saved));
            ddCategories.resetFilter();
            ddCategories.options = this.arrOption6;
            ddCategories.optionsToDisplay = this.arrOption6;
            if (ddCategories.scroller) {
                // ddCategories.scroller.scrollTo({top: 0});
            }
        }
    }

    // private excludingPlusVatEqualsIncluding(fg: FormGroup): ValidationErrors {
    //     if (fg) {
    //         const [exclude, vat, include] = [fg.get('15'), fg.get('16'), fg.get('17')]
    //             .map(fg0 => fg0 ? parseFloat(fg0.get('effectiveValue').value) : null);
    //         return [exclude, vat, include].some(v => isNaN(v))
    //         || (exclude + vat !== include) ? {excludingPlusVatNotEqualsInclude: true} : null;
    //     }
    //
    //     return null;
    // }

    addPriemerObject_40_41(arr: any, numDD: any): any[] {
        if (
            arr &&
            arr.length &&
            this.fileFieldsForm.get(numDD.toString()) &&
            this.fileFieldsForm.get(numDD.toString()).get('effectiveValue') &&
            this.fileFieldsForm.get(numDD.toString()).get('effectiveValue').value
        ) {
            return [
                {
                    maamPrc: null,
                    precenf: null,
                    custId: null,
                    oppositeCustId: null,
                    paymentNikui: null,
                    taxDeductionCustId: null,
                    onlyName: true,
                    label: 'ביטול בחירה',
                    value: null
                },
                ...arr
            ];
        } else {
            return arr;
        }
    }

    limitCharacters(val: any) {
        if (val && val.length > 32) {
            val = val.slice(0, 32) + '...';
        }
        return val;
    }

    cancelCust(fld: any) {
        // if (fld.fieldId === 40) {
        //     const newDataLabel = this.transTypeCodeArr.find(it => it.value === fld.fieldValue);
        //     if (newDataLabel) {
        //         if (fld.fieldId === 40) {
        //             fld.val40 = newDataLabel.label;
        //         }
        //     }
        // }
        this.modalCancel = fld;
    }

    public reloadFromModal() {
        this.showErrorModal = false;
        this.refreshBack.emit(true);
        this.setFile(this._fileScanView);
    }

    resetFileFieldsForm() {
        if (this.fileFieldsForm) {
            let control: AbstractControl = null;
            this.fileFieldsForm.reset();
            this.fileFieldsForm.markAsUntouched();
            Object.keys(this.fileFieldsForm.controls).forEach((name) => {
                control = this.fileFieldsForm.controls[name];
                control.setErrors(null);
            });
        }

        this.cupaAllTheOptions = false;
    }

    public setFile(file: any, newFiles?: any): void {
        this.loadTime = true;
        this.fileDetailsSave = null;
        this.fileDetails = false;
        this.sizeAllImg = false;
        this.activeField = null;
        this.activeWord = null;
        this.visionResultsArr = [];
        this.symbolsArr = [];
        this.fileFieldsForm = new FormGroup({});
        this.resetFileFieldsForm();
        this.wordsFieldsExist = [];
        this.dataPagesSize = [];
        this._fileScanView = file;
        this.storageService.sessionStorageSetter(
            'accountants-doc-open',
            JSON.stringify(file)
        );
        this.showDoubleSuspect = false;
        this.fileProgress = true;
        this.imageScale = 1;
        this.revaluationCurrCode = null;
        this.revaluationCurrCodeSign = null;
        if (this.scrollContainer && this.scrollContainer.nativeElement) {
            this.scrollContainer.nativeElement.scrollTop = 0;
        }

        let currIndex;
        if (newFiles) {
            currIndex = newFiles.findIndex((fd) => fd.fileId === file.fileId);
            this._selectedCompanyFiles = newFiles;
        } else {
            currIndex = this._selectedCompanyFiles.findIndex(
                (fd) => fd.fileId === file.fileId
            );
        }
        this.navigatorData$.next({
            currDocNo: currIndex + 1,
            total: this._selectedCompanyFiles.length,
            forwardLink:
                currIndex + 1 < this._selectedCompanyFiles.length
                    ? this._selectedCompanyFiles[currIndex + 1]
                    : this._selectedCompanyFiles.length > 1
                        ? this._selectedCompanyFiles[0]
                        : null,
            backwardLink:
                currIndex > 0
                    ? this._selectedCompanyFiles[currIndex - 1]
                    : this._selectedCompanyFiles.length > 1
                        ? this._selectedCompanyFiles[this._selectedCompanyFiles.length - 1]
                        : null
        });
    }

    override reload() {
        // console.log('reload child');
        this.fileDetailsSave = null;
        setTimeout(() => {
            this.forceReload$.next();
        }, 0);
    }

    getNum(val): number {
        return toNumber(val);
    }

    getScrollTop(scrollElem: any): number {
        if (scrollElem && scrollElem.nativeElement) {
            return scrollElem.nativeElement.scrollTop;
        }
        return 0;
    }

    selectedDocTypeValidForHashBankCreation(
        fc: AbstractControl
    ): ValidationErrors {
        if (fc && fc.value) {
            const selectedOpt = this.docTypeOptions.find(
                (opt) => opt.value === fc.value
            );
            return !selectedOpt || !(<any>selectedOpt).hashBankCreatable
                ? {typeIsNotHashCreatable: true}
                : null;
        }

        return null;
    }

    public thirdDateOpenItem(item, bool) {
        item.get('thirdDateOpen').patchValue(bool);
        item.thirdDateOpen = bool;
    }

    ngOnInit() {
        const buttonClickedDebounced = this.buttonClicked.pipe(debounceTime(200));
        buttonClickedDebounced.subscribe((data: any) => {
            this.render(data.page, data.index);
        });
        // if (!this.userService.appData.userData.companySelect.test) {
        //     this.hierarchy$ = this.ocrService.requestFieldsHierarchy()
        //         .pipe(
        //             map(result => result && !result.error ? result.body : []),
        //             tap(categories => {
        //                 if (Array.isArray(categories)) {
        //                     const additionalFieldsCat = categories.find(cat => cat.category === 'שדות נוספים');
        //                     if (additionalFieldsCat) {
        //                         additionalFieldsCat.collapsed = true;
        //                     }
        //                     categories.forEach((items) => {
        //                         const isTotalMaamIncludeExist = items.fields.find(item => item.fieldId === 17);
        //                         if (isTotalMaamIncludeExist) {
        //                             const idxToSplice = items.fields.findIndex(item => item.fieldId === 17);
        //                             items.fields.splice(idxToSplice, 0, {
        //                                 description: null,
        //                                 fieldId: 24,
        //                                 logicType: null,
        //                                 name: 'סכום במט"ח',
        //                                 orderNo: isTotalMaamIncludeExist.orderNo,
        //                                 required: true,
        //                                 valueType: 'NUMBER'
        //                             });
        //                             items.fields.splice(idxToSplice + 1, 0, {
        //                                 description: null,
        //                                 fieldId: 999,
        //                                 logicType: null,
        //                                 name: 'שער חליפין',
        //                                 orderNo: isTotalMaamIncludeExist.orderNo,
        //                                 required: true,
        //                                 valueType: 'NUMBER'
        //                             });
        //                         }
        //                     });
        //                 }
        //             }),
        //             shareReplay(1)
        //         );
        // }

        const showEmptyFieldsSave =
            this.storageService.localStorageGetterItem('showEmptyFields');
        if (showEmptyFieldsSave) {
            this.showEmptyFields.patchValue(showEmptyFieldsSave === 'true');
        }

        this.invoicePayment.valueChanges
            .pipe(debounceTime(100))
            .subscribe((check) => {
                // if (!this.userService.appData.userData.companySelect.test) {
                //     if (check) {
                //         this.fileFieldsForm.get('30').get('effectiveValue').setValidators([Validators.required]);
                //     } else {
                //         this.fileFieldsForm.get('30').get('effectiveValue').setValidators(null);
                //     }
                //     this.fileFieldsForm.get('30').get('effectiveValue').updateValueAndValidity();
                //     this.ocrService.setInvoicePayment({
                //         fileId: this._fileScanView.fileId,
                //         payment: check
                //     })
                //         .subscribe((value) => {
                //             if (check) {
                //                 // const fileId = this._fileScanView.fileId;
                //                 // const aaaa = [{
                //                 //     'fieldId': 32,
                //                 //     'fileResultId': '75e79153-b8db-4313-bbc6-482934755f9f',
                //                 //     'fieldName': 'סכום תשלום',
                //                 //     'fieldValue': 111,
                //                 //     'fieldPosition': [],
                //                 //     'fieldPage': null,
                //                 //     'fieldSearchkey': null,
                //                 //     'locationNum': null,
                //                 //     'alertId': null
                //                 // }, {
                //                 //     'fieldId': 14,
                //                 //     'fileResultId': '323c99f1-8a29-4398-8889-a893ceced7b3',
                //                 //     'fieldName': 'תאריך ערך',
                //                 //     'fieldValue': 1609884000000,
                //                 //     'fieldPosition': [],
                //                 //     'fieldPage': null,
                //                 //     'fieldSearchkey': null,
                //                 //     'locationNum': null,
                //                 //     'alertId': null
                //                 // }]
                //                 if (value && !value.error && Array.isArray(value.body) && value.body.length) {
                //                     value.body.forEach((fe) => {
                //                         if (this.fileFieldsForm.get(fe.fieldId.toString())) {
                //                             this.fileFieldsForm.get(fe.fieldId.toString()).patchValue({
                //                                 fileResultId: fe.fileResultId,
                //                                 effectiveValue: (fe.fieldId.toString() === '14') ? this.userService.appData.moment(fe.fieldValue).toDate() : fe.fieldValue,
                //                                 fieldPage: fe.fieldPage,
                //                                 fieldPosition: fe.fieldPosition,
                //                                 hasBeenDiscovered: Array.isArray(fe.fieldPosition) && fe.fieldPosition.length,
                //                                 searchkey: fe.fieldSearchkey,
                //                                 locationNo: fe.locationNum
                //                             }, {emitEvent: false, onlySelf: true});
                //                         }
                //                     });
                //                 }
                //                 // const date = this.fileFieldsForm.get('14').get('effectiveValue').value;
                //                 // if (date === '' || date === null) {
                //                 //     this.fileFieldsForm.get('14').patchValue({
                //                 //         effectiveValue: this.fileFieldsForm.get('13').get('effectiveValue').value
                //                 //     }, {emitEvent: false, onlySelf: true});
                //                 //     this.ocrService.setFieldValue({
                //                 //         fileId: fileId,
                //                 //         fieldId: 14,
                //                 //         fileResultId: null,
                //                 //         fieldPage: 0,
                //                 //         fieldPosition: null,
                //                 //         fieldValue: this.fileFieldsForm.get('13').get('effectiveValue').value,
                //                 //         locationNum: null,
                //                 //         locationDesc: null,
                //                 //         fieldSearchkey: null,
                //                 //         manualTyped: true
                //                 //     }).pipe(take(1))
                //                 //         .subscribe(() => {
                //                 //         });
                //                 // }
                //
                //                 // const sum = this.fileFieldsForm.get('32').get('effectiveValue').value;
                //                 // if (sum === '' || sum === null) {
                //                 //     this.fileFieldsForm.get('32').patchValue({
                //                 //         effectiveValue: Number(this.fileFieldsForm.get('17').get('effectiveValue').value),
                //                 //     }, {emitEvent: false, onlySelf: true});
                //                 //     this.ocrService.setFieldValue({
                //                 //         fileId: fileId,
                //                 //         fieldId: 32,
                //                 //         fileResultId: null,
                //                 //         fieldPage: 0,
                //                 //         fieldPosition: null,
                //                 //         fieldValue: Number(this.fileFieldsForm.get('17').get('effectiveValue').value),
                //                 //         locationNum: null,
                //                 //         locationDesc: null,
                //                 //         fieldSearchkey: null,
                //                 //         manualTyped: true
                //                 //     }).pipe(take(1))
                //                 //         .subscribe(() => {
                //                 //         });
                //                 // }
                //                 if (this.fileFieldsForm.get('32')) {
                //                     this.fileFieldsForm.get('32').disable();
                //                 }
                //                 // const nikuyMas = this.fileFieldsForm.get('33').get('effectiveValue').value;
                //                 // if ((nikuyMas === '' || nikuyMas === null) && (this.fileFieldsForm.get('21').get('effectiveValue').value === 1 && this.report856)) {
                //                 //     this.fileFieldsForm.get('33').patchValue({
                //                 //         effectiveValue: 0,
                //                 //     }, {emitEvent: false, onlySelf: true});
                //                 //     this.ocrService.setFieldValue({
                //                 //         fileId: fileId,
                //                 //         fieldId: 33,
                //                 //         fileResultId: null,
                //                 //         fieldPage: 0,
                //                 //         fieldPosition: null,
                //                 //         fieldValue: 0,
                //                 //         locationNum: null,
                //                 //         locationDesc: null,
                //                 //         fieldSearchkey: null,
                //                 //         manualTyped: true
                //                 //     }).pipe(take(1))
                //                 //         .subscribe(() => {
                //                 //         });
                //                 // }
                //             }
                //         });
                // } else {
                this.ocrService
                    .setInvoicePayment({
                        fileId: this._fileScanView.fileId,
                        payment: check
                    })
                    .subscribe((value) => {
                        if (
                            value &&
                            !value.error &&
                            value.body &&
                            value.body.approveActive !== undefined
                        ) {
                            this.fileDetailsSave.approveActive = value.body.approveActive;
                            this.fileDetailsSave.approveActiveCopy =
                                this.fileDetailsSave.approveActive;
                        }
                        if (this.fileDetailsSave.approveActive) {
                            this.getJournalTransForFile();
                        } else {
                            this.show_approveActiveCopy = false;
                        }
                        if (check) {
                            if (
                                value &&
                                !value.error &&
                                Array.isArray(value.body.fields) &&
                                value.body.fields.length
                            ) {
                                value.body.fields.forEach((fe) => {
                                    // [
                                    //     {
                                    //         "alertId": 0,
                                    //         "fieldId": 0,
                                    //         "fieldName": "string",
                                    //         "fieldPage": 0,
                                    //         "fieldPosition": [
                                    //             {
                                    //                 "x": 0,
                                    //                 "y": 0
                                    //             }
                                    //         ],
                                    //         "fieldSearchkey": "string",
                                    //         "fieldValue": {},
                                    //         "fileResultId": "string",
                                    //         "locationNum": 0
                                    //     }
                                    // ]
                                    if (this.fileFieldsForm.get(fe.fieldId.toString())) {
                                        const forms = this.fileFieldsForm.get(
                                            fe.fieldId.toString()
                                        );
                                        forms.get('fileResultId').patchValue(fe.fileResultId, {
                                            emitEvent: false,
                                            onlySelf: true
                                        });
                                        forms.get('fieldPage').patchValue(fe.fieldPage, {
                                            emitEvent: false,
                                            onlySelf: true
                                        });
                                        forms.get('fieldPosition').patchValue(fe.fieldPosition, {
                                            emitEvent: false,
                                            onlySelf: true
                                        });
                                        forms
                                            .get('hasBeenDiscovered')
                                            .patchValue(
                                                Array.isArray(fe.fieldPosition) &&
                                                fe.fieldPosition.length,
                                                {
                                                    emitEvent: false,
                                                    onlySelf: true
                                                }
                                            );
                                        forms.get('searchkey').patchValue(fe.fieldSearchkey, {
                                            emitEvent: false,
                                            onlySelf: true
                                        });
                                        forms.get('locationNo').patchValue(fe.locationNum, {
                                            emitEvent: false,
                                            onlySelf: true
                                        });
                                        forms
                                            .get('effectiveValue')
                                            .patchValue(
                                                fe.fieldId.toString() === '14'
                                                    ? this.userService.appData
                                                        .moment(fe.fieldValue)
                                                        .toDate()
                                                    : fe.fieldValue,
                                                {
                                                    emitEvent: false,
                                                    onlySelf: true
                                                }
                                            );
                                    }
                                });
                            }
                        }

                        for (const cat of this.fileDetailsSave.fieldsHierarchy) {
                            for (const fld of cat.fields) {
                                const fie = this.fileFieldsForm.get(fld.fieldId + '');
                                const invoice =
                                    cat.category.includes('נתוני קבלה') &&
                                    !this.invoicePayment.value;
                                fld.hide = !!(
                                    this.showEmptyFields.value &&
                                    ((fie.get('effectiveValue').value !== '' &&
                                            fie.get('effectiveValue').value !== null &&
                                            fie.get('effectiveValue').value !== undefined &&
                                            !fld.fileFldInfo) ||
                                        invoice ||
                                        fie.disabled ||
                                        fie.get('valueTypeOv').value === true)
                                );
                            }
                            cat.hide = cat.fields.every((field) => field.hide);
                        }
                        this.showAlertHideAllFields =
                            this.fileDetailsSave.fieldsHierarchy.every((field) => field.hide);
                    });
                // }
            });

        this.showEmptyFields.valueChanges
            .pipe(debounceTime(100), distinctUntilChanged())
            .subscribe((check) => {
                this.storageService.localStorageSetter(
                    'showEmptyFields',
                    String(check)
                );
                for (const cat of this.fileDetailsSave.fieldsHierarchy) {
                    for (const fld of cat.fields) {
                        const fie = this.fileFieldsForm.get(fld.fieldId + '');
                        const invoice =
                            cat.category.includes('נתוני קבלה') && !this.invoicePayment.value;
                        fld.hide = !!(
                            check &&
                            ((fie.get('effectiveValue').value !== '' &&
                                    fie.get('effectiveValue').value !== null &&
                                    fie.get('effectiveValue').value !== undefined &&
                                    !fld.fileFldInfo) ||
                                invoice ||
                                fie.disabled ||
                                fie.get('valueTypeOv').value === true)
                        );
                    }
                    cat.hide = cat.fields.every((field) => field.hide);
                }
                this.showAlertHideAllFields =
                    this.fileDetailsSave.fieldsHierarchy.every((field) => field.hide);
            });

        this.fileDetails$ = combineLatest(
            [
                this.navigatorData$,
                this.forceReload$.pipe(startWith(null))
            ]
        ).pipe(
            tap(() => {
                console.log('navigatorData$');

                // for (let i = this.sumsExcludeIncludeAndVat.controls.length - 1; i >= 0; --i) {
                //     this.sumsExcludeIncludeAndVat.removeAt(i);
                // }
                Object.values(this.fieldValueChangeSubscribers).forEach((sub) =>
                    sub.unsubscribe()
                );
                this.activeField = null;
                this.activeWord = null;
                this.showDoubleSuspect = false;
                this.currentPage.next(1);
            }),
            switchMap(() => {
                if (
                    !this.unionResTemp
                ) {
                    return this.ocrService['requestFileDetails']({
                        fileId: this._fileScanView.fileId
                    });
                } else {
                    return of({
                        body: this.unionResTemp,
                        status: 200
                    });
                }
            }),
            map((response: any) => {
                if (this.unionResTemp) {
                    this.unionResTemp = null;
                }
                if (response && !response.error) {
                    const bodyRes = response ? response['body'] : response;
                    const statusRes = response ? response.status : response;
                    if (statusRes === 422) {
                        if (bodyRes.redoFor) {
                            this._fileScanView.fileId = bodyRes.redoFor;
                            this.setFile(this._fileScanView);
                        } else {
                            this.goToRow.emit({
                                refresh: true,
                                response: this._fileScanView.fileId
                            });
                        }
                        return null;
                    }
                    return response.body;
                } else {
                    return null;
                }
            }),
            tap((fileDetails: any) => {
                if (fileDetails && fileDetails.fields) {
                    // if (!this.userService.appData.userData.companySelect.test) {
                    //     fileDetails.fields.push({
                    //         alertId: null,
                    //         fieldId: 24,
                    //         fieldName: 'סכום במט"ח',
                    //         fieldPage: null,
                    //         fieldPosition: null,
                    //         fieldSearchkey: null,
                    //         fieldValue: null,
                    //         fileResultId: null,
                    //         locationNum: null
                    //     }, {
                    //         alertId: null,
                    //         fieldId: 999,
                    //         fieldName: 'שער חליפין',
                    //         fieldPage: null,
                    //         fieldPosition: null,
                    //         fieldSearchkey: null,
                    //         fieldValue: null,
                    //         fileResultId: null,
                    //         locationNum: null
                    //     });
                    // }

                    fileDetails.fields.forEach((field) => {
                        if (field.alertId !== undefined && field.alertId !== null) {
                            if (field.fieldId === 11 && field.alertId === 10) {
                                this.showDoubleSuspect = true;
                            }
                            const hasAlert = this.alerstIdsArr.find(
                                (it) => it.alertId === field.alertId
                            );
                            if (hasAlert) {
                                field.alertMessage = hasAlert.alertMessage;
                                field.indBlockAprrove = hasAlert.indBlockAprrove;
                            }
                        }
                    });
                }
            }),
            publishRef
        );

        this.companyCustomerDetails$ = combineLatest(
            [
                this.sharedService.companyGetCustomer({
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    sourceProgramId:
                    this.userService.appData.userData.companySelect.sourceProgramId
                }),
                this.ocrService.getVatList(
                    this.userService.appData.userData.companySelect.companyId
                ),
                this.sharedService.transTypeDefined({
                    uuid: this.userService.appData.userData.companySelect.companyId
                }),
                this.ocrService.alertId()
            ]
        ).pipe(
            map((resMap: any) => {
                const [response, vatListRes, transTypeDefined, alerstIds] = resMap;

                this.alerstIdsArr =
                    alerstIds && !alerstIds.error && alerstIds.body ? alerstIds.body : [];
                const vatReportOptions =
                    vatListRes && !vatListRes.error && vatListRes.body
                        ? vatListRes.body.months
                        : [];
                return {
                    vatList: vatReportOptions,
                    transTypeDefined:
                        transTypeDefined && !transTypeDefined.error
                            ? transTypeDefined.body
                            : []
                };
            }),
            tap((companyCustomerDetails: any) => {
                // {
                //     "cartisCodeId": 0,
                //     "custId": "string",
                //     "custLastName": "string",
                //     "oseknums": [
                //     0
                // ],
                //     "palCode": "string"
                // }
                if (companyCustomerDetails) {
                    // const allTypes = companyCustomerDetails.map(it => {
                    //     return {
                    //         cartisCodeId: it.cartisCodeId,
                    //         custId: it.custId,
                    //         lName: it.custLastName,
                    //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                    //         id: it.palCode,
                    //         pettyCash: it.pettyCash ? it.pettyCash : false,
                    //         supplierTaxDeduction: it.supplierTaxDeduction,
                    //         customerTaxDeduction: it.customerTaxDeduction
                    //     };
                    // });
                    // companyCustomerDetails.custDataIncome = allTypes;
                    // companyCustomerDetails.custDataExpense = allTypes;
                    // companyCustomerDetails.indexDataIncome = allTypes;
                    // companyCustomerDetails.indexDataExpense = allTypes;
                    //
                    // companyCustomerDetails.custData13 = companyCustomerDetails.filter(it => it.cartisCodeId === 13).length ? companyCustomerDetails.filter(it => it.cartisCodeId === 13)[0] : null;
                    // companyCustomerDetails.custData14 = companyCustomerDetails.filter(it => it.cartisCodeId === 14).length ? companyCustomerDetails.filter(it => it.cartisCodeId === 14)[0] : null;
                    // companyCustomerDetails.custData12 = companyCustomerDetails.filter(it => it.cartisCodeId === 12).length ? companyCustomerDetails.filter(it => it.cartisCodeId === 12)[0] : null;
                    //
                    //
                    // companyCustomerDetails.custMaamNechasim = companyCustomerDetails.filter(it => it.custMaamNechasim).length ? companyCustomerDetails.filter(it => it.custMaamNechasim)[0] : null;
                    // companyCustomerDetails.custMaamTsumot = companyCustomerDetails.filter(it => it.custMaamTsumot).length ? companyCustomerDetails.filter(it => it.custMaamTsumot)[0] : null;
                    // companyCustomerDetails.custMaamYevu = companyCustomerDetails.filter(it => it.custMaamYevu).length ? companyCustomerDetails.filter(it => it.custMaamYevu)[0] : null;
                    // companyCustomerDetails.custMaamIska = companyCustomerDetails.filter(it => it.custMaamIska).length ? companyCustomerDetails.filter(it => it.custMaamIska)[0] : null;
                    //
                    //
                    // companyCustomerDetails.cupa = companyCustomerDetails.filter(it => it.cartisCodeId === 1700 || it.cartisCodeId === 1800).map(it => {
                    //     return {
                    //         cartisCodeId: it.cartisCodeId,
                    //         custId: it.custId,
                    //         lName: it.custLastName,
                    //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                    //         id: it.palCode,
                    //         pettyCash: it.pettyCash ? it.pettyCash : false
                    //     };
                    // });
                    // companyCustomerDetails.custDataIncome = companyCustomerDetails.filter(it => it.cartisCodeId === 7 || it.cartisCodeId === 1000).map(it => {
                    //     return {
                    //         custId: it.custId,
                    //         lName: it.custLastName,
                    //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                    //         id: it.palCode
                    //     };
                    // });
                    // companyCustomerDetails.custDataExpense = companyCustomerDetails.filter(it => it.cartisCodeId === 3 || it.cartisCodeId === 1011 || it.cartisCodeId === 46).map(it => {
                    //     return {
                    //         custId: it.custId,
                    //         lName: it.custLastName,
                    //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                    //         id: it.palCode
                    //     };
                    // });
                    // companyCustomerDetails.indexDataIncome = companyCustomerDetails.filter(it => it.cartisCodeId !== 1400 && it.cartisCodeId !== 7 && it.cartisCodeId !== 3 && it.cartisCodeId !== 1000 && it.cartisCodeId !== 1011).map(it => {
                    //     return {
                    //         custId: it.custId,
                    //         lName: it.custLastName,
                    //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                    //         id: it.palCode
                    //     };
                    // });
                    // companyCustomerDetails.indexDataExpense = companyCustomerDetails.filter(it => it.cartisCodeId !== 1300 && it.cartisCodeId !== 7 && it.cartisCodeId !== 3 && it.cartisCodeId !== 1000 && it.cartisCodeId !== 1011).map(it => {
                    //     return {
                    //         custId: it.custId,
                    //         lName: it.custLastName,
                    //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                    //         id: it.palCode
                    //     };
                    // });
                    //console.log(companyCustomerDetails);
                    companyCustomerDetails.esderMaam =
                        this.userService.appData.userData.companySelect.esderMaam;
                    const esderMaam = companyCustomerDetails.esderMaam;
                    companyCustomerDetails.vatReportOptions = [];
                    if (companyCustomerDetails.vatList) {
                        const monthNames = this.translate.instant(
                            'langCalendar.monthNames'
                        ) as string[];
                        if (esderMaam !== 'TWO_MONTH') {
                            for (const month of companyCustomerDetails.vatList) {
                                // console.log('----', this.userService.appData.moment(month));
                                const mmntI = this.userService.appData
                                    .moment(month)
                                    .startOf('month');
                                companyCustomerDetails.vatReportOptions.push({
                                    label: monthNames[mmntI.month()] + ' ' + mmntI.format('YY'),
                                    value: mmntI.valueOf()
                                } as SelectItem);
                            }
                        } else {
                            for (const month of companyCustomerDetails.vatList) {
                                const mmntI = this.userService.appData
                                    .moment(month)
                                    .startOf('month');
                                const pairEnd = this.userService.appData
                                    .moment(mmntI)
                                    .endOf('month')
                                    .add(1, 'months');
                                if (mmntI.format('YY') === pairEnd.format('YY')) {
                                    companyCustomerDetails.vatReportOptions.push({
                                        label:
                                            monthNames[mmntI.month()] +
                                            ' - ' +
                                            monthNames[pairEnd.month()] +
                                            ' ' +
                                            mmntI.format('YY'),
                                        value: mmntI.valueOf()
                                    } as SelectItem);
                                } else {
                                    companyCustomerDetails.vatReportOptions.push({
                                        label: [
                                            monthNames[mmntI.month()] + ' ' + mmntI.format('YY'),
                                            monthNames[pairEnd.month()] + ' ' + pairEnd.format('YY')
                                        ].join(' - '),
                                        value: mmntI.valueOf()
                                    } as SelectItem);
                                }
                            }
                        }
                    }

                    if (
                        companyCustomerDetails.transTypeDefined &&
                        companyCustomerDetails.transTypeDefined.length
                    ) {
                        const arrEnum = ['FULL', 'NONE'];

                        companyCustomerDetails.transTypeDefinedIncome40 =
                            companyCustomerDetails.transTypeDefined
                                .filter(
                                    (it) =>
                                        it.transTypeClass === 'INCOME' ||
                                        it.transTypeClass === 'HOVA_ZHUT'
                                )
                                .map((item) => {
                                    return {
                                        maamPrc: item.maamPrc,
                                        custId: item.custId,
                                        oppositeCustId: item.oppositeCustId,
                                        paymentNikui: item.totalMaam,
                                        taxDeductionCustId: item.custMaamId,
                                        onlyName: item.transTypeCode.includes('BIZ_'),
                                        label: item.transTypeName,
                                        value: item.transTypeCode
                                    };
                                });
                        const transTypeDefinedIncome40 = [];
                        arrEnum.forEach((enums) => {
                            const allObjExistInEnumsTableByFilter =
                                companyCustomerDetails.transTypeDefinedIncome40.filter(
                                    (it) => it.maamPrc === enums
                                );
                            transTypeDefinedIncome40.push(...allObjExistInEnumsTableByFilter);
                        });
                        companyCustomerDetails.transTypeDefinedIncome40 =
                            transTypeDefinedIncome40;

                        companyCustomerDetails.transTypeDefinedIncome41 =
                            companyCustomerDetails.transTypeDefined
                                .filter(
                                    (it) =>
                                        it.transTypeClass === 'RECEIPT' ||
                                        it.transTypeClass === 'HOVA_ZHUT'
                                )
                                .map((item) => {
                                    return {
                                        maamPrc: item.maamPrc,
                                        precenf: item.precenf,
                                        custId: item.custId,
                                        oppositeCustId: item.oppositeCustId,
                                        paymentNikui: item.totalMaam,
                                        taxDeductionCustId: item.custMaamId,
                                        onlyName: item.transTypeCode.includes('BIZ_'),
                                        label: item.transTypeName,
                                        value: item.transTypeCode
                                    };
                                });

                        // companyCustomerDetails.transTypeDefinedIncome41.unshift({
                        //     maamPrc: null,
                        //     precenf: null,
                        //     custId: null,
                        //     oppositeCustId: null,
                        //     paymentNikui: null,
                        //     taxDeductionCustId: null,
                        //     onlyName: true,
                        //     label: 'בחירה',
                        //     value: null
                        // });

                        // const transTypeDefinedIncome41 = [];
                        // const allMatchToEnumIncome41 = companyCustomerDetails.transTypeDefinedIncome41.filter(it => arrEnum.some(enums => enums === it.transTypeCode));
                        // const allNotMatchToEnumIncome41 = companyCustomerDetails.transTypeDefinedIncome41.filter(it => !arrEnum.some(enums => enums === it.transTypeCode));
                        // arrEnum.forEach(enums => {
                        //     const allObjExistInEnumsTableByFilter = allMatchToEnumIncome41.filter(it => it.transTypeCode === enums);
                        //     transTypeDefinedIncome41.push(...allObjExistInEnumsTableByFilter);
                        // });
                        // transTypeDefinedIncome41.push(...allNotMatchToEnumIncome41);
                        // companyCustomerDetails.transTypeDefinedIncome41 = transTypeDefinedIncome41;

                        companyCustomerDetails.transTypeDefinedExpense40 =
                            companyCustomerDetails.transTypeDefined
                                .filter(
                                    (it) =>
                                        it.transTypeClass === 'EXPENSE' ||
                                        it.transTypeClass === 'HOVA_ZHUT'
                                )
                                .map((item) => {
                                    return {
                                        maamPrc: item.maamPrc,
                                        custId: item.custId,
                                        oppositeCustId: item.oppositeCustId,
                                        paymentNikui: item.totalMaam,
                                        taxDeductionCustId: item.custMaamId,
                                        onlyName: item.transTypeCode.includes('BIZ_'),
                                        label: item.transTypeName,
                                        value: item.transTypeCode
                                    };
                                });

                        const arrEnumExpense = [
                            'FULL',
                            'TWO_THIRD',
                            'QUARTER',
                            'FULL_PROPERTY',
                            'FULL_IMPORT',
                            'NONE',
                            'OPEN'
                        ];
                        const transTypeDefinedExpense40 = [];
                        arrEnumExpense.forEach((enums) => {
                            const allObjExistInEnumsTableByFilter =
                                companyCustomerDetails.transTypeDefinedExpense40.filter(
                                    (it) => it.maamPrc === enums
                                );
                            transTypeDefinedExpense40.push(
                                ...allObjExistInEnumsTableByFilter
                            );
                        });
                        companyCustomerDetails.transTypeDefinedExpense40 =
                            transTypeDefinedExpense40;

                        companyCustomerDetails.transTypeDefinedExpense41 =
                            companyCustomerDetails.transTypeDefined
                                .filter(
                                    (it) =>
                                        it.transTypeClass === 'PAYMENTS' ||
                                        it.transTypeClass === 'HOVA_ZHUT'
                                )
                                .map((item) => {
                                    return {
                                        maamPrc: item.maamPrc,
                                        custId: item.custId,
                                        precenf: item.precenf,
                                        oppositeCustId: item.oppositeCustId,
                                        paymentNikui: item.totalMaam,
                                        taxDeductionCustId: item.custMaamId,
                                        onlyName: item.transTypeCode.includes('BIZ_'),
                                        label: item.transTypeName,
                                        value: item.transTypeCode
                                    };
                                });
                        // companyCustomerDetails.transTypeDefinedExpense41.unshift({
                        //     maamPrc: null,
                        //     custId: null,
                        //     precenf: null,
                        //     oppositeCustId: null,
                        //     paymentNikui: null,
                        //     taxDeductionCustId: null,
                        //     onlyName: true,
                        //     label: 'בחירה',
                        //     value: null
                        // });

                        // const transTypeDefinedExpense41 = [];
                        // const allMatchToEnumExpense41 = companyCustomerDetails.transTypeDefinedExpense41.filter(it => arrEnumExpense.some(enums => enums === it.transTypeCode));
                        // const allNotMatchToEnumExpense41 = companyCustomerDetails.transTypeDefinedExpense41.filter(it => !arrEnumExpense.some(enums => enums === it.transTypeCode));
                        // arrEnumExpense.forEach(enums => {
                        //     const allObjExistInEnumsTableByFilter = allMatchToEnumExpense41.filter(it => it.transTypeCode === enums);
                        //     transTypeDefinedExpense41.push(...allObjExistInEnumsTableByFilter);
                        // });
                        // transTypeDefinedExpense41.push(...allNotMatchToEnumExpense41);
                        // companyCustomerDetails.transTypeDefinedExpense41 = transTypeDefinedExpense41;
                    } else {
                        companyCustomerDetails.transTypeDefinedIncome40 = [];
                        companyCustomerDetails.transTypeDefinedExpense40 = [];
                        companyCustomerDetails.transTypeDefinedIncome41 = [];
                        companyCustomerDetails.transTypeDefinedExpense41 = [];
                    }

                    this.companyCustomerDetailsData = companyCustomerDetails;
                }
            }),
            shareReplay(1)
        );

        // this.createFieldsHierarchyHandlers();
        //
        // this.createVisionResultsHandlers();

        this.fileDetails$.pipe(
            switchMap((fileDetails) => {
                console.log('fileDetails$');
                this.fileDetails = fileDetails;
                if (!fileDetails || !Array.isArray(fileDetails.pages)) {
                    return of([]);
                }
                const templateRes = {
                    textAnnotations: [],
                    fullTextAnnotation: {
                        pages: [
                            {
                                property: {},
                                width: 0,
                                height: 0,
                                blocks: []
                            }
                        ],
                        text: ''
                    }
                };
                return of(
                    fileDetails.pages.map((page) =>
                        page.visionResultUrl
                            ? this.http.get(page.visionResultUrl).pipe(
                                map((visionResult: any) => {
                                    if (
                                        !visionResult &&
                                        Array.isArray(visionResult.responses)
                                    ) {
                                        return visionResult.responses.length
                                            ? visionResult.responses[0]
                                            : null;
                                    }

                                    if (!visionResult.textAnnotations) {
                                        return templateRes;
                                    }
                                    return visionResult;
                                }),
                                catchError(() => of(null)),
                                publishRef
                            )
                            : of(null)
                    )
                );
            }),
        ).subscribe((visionResults: any) => {
            this.wordsFieldsExist = [];
            const objResults = {};
            this.visionResultsArr = [];
            this.symbolsArr = [];
            this.dataPagesSize = [];
            if (Array.isArray(visionResults)) {
                visionResults.forEach((it, idx) => {
                    it.pipe(
                        take(1),
                        map((rslt: any) =>
                            rslt && 'responses' in rslt ? rslt.responses[0] : rslt
                        )
                    ).subscribe((response: any) => {
                        console.log('-----------------1111111---------', idx);
                        objResults[idx] = {
                            symbolsArr: [],
                            visionResultsArr: [],
                            dataPagesSize: []
                        };
                        // textAnnotations
                        // boundingPoly: {vertices: [{x: 786, y: 111}, {x: 884, y: 110}, {x: 884, y: 157}, {x: 786, y: 158}]}
                        // description: "קופה"
                        if (
                            response &&
                            response.textAnnotations &&
                            Array.isArray(response.textAnnotations) &&
                            response.textAnnotations.length > 1
                        ) {
                            // this.symbolsArr.push(response.fullTextAnnotation.pages[0].blocks);

                            response.textAnnotations.shift();
                            const vertices_text = response.textAnnotations.filter(
                                (ita) => ita.boundingPoly.vertices
                            );
                            const visionResultArr = vertices_text.flatMap((block) => {
                                const mergedWords = {
                                    text: block.description,
                                    vertices: block.boundingPoly.vertices,
                                    symbols: []
                                };

                                if (
                                    Array.isArray(mergedWords.vertices) &&
                                    mergedWords.vertices.length &&
                                    mergedWords.vertices.find(
                                        (vertx) =>
                                            vertx.x === undefined ||
                                            vertx.y === undefined ||
                                            vertx.x < 0 ||
                                            vertx.y < 0
                                    )
                                ) {
                                    mergedWords.vertices.forEach((item) => {
                                        if (item.x === undefined || item.x < 0) {
                                            item.x = 0;
                                        }
                                        if (item.y === undefined || item.y < 0) {
                                            item.y = 0;
                                        }
                                    });
                                    // mergedWords[idx].vertices = mergedWords.vertices;
                                }
                                if (
                                    Array.isArray(mergedWords.vertices) &&
                                    mergedWords.vertices.length
                                ) {
                                    if (mergedWords.vertices.length === 4) {
                                        if (
                                            mergedWords.vertices[0].y !== mergedWords.vertices[1].y
                                        ) {
                                            mergedWords.vertices[0].y = mergedWords.vertices[1].y;
                                        }
                                        if (
                                            mergedWords.vertices[2].y !== mergedWords.vertices[3].y
                                        ) {
                                            mergedWords.vertices[2].y = mergedWords.vertices[3].y;
                                        }
                                        if (
                                            mergedWords.vertices[0].x !== mergedWords.vertices[3].x
                                        ) {
                                            mergedWords.vertices[0].x = mergedWords.vertices[3].x;
                                        }
                                        if (
                                            mergedWords.vertices[1].x !== mergedWords.vertices[2].x
                                        ) {
                                            mergedWords.vertices[1].x = mergedWords.vertices[2].x;
                                        }
                                    }
                                }
                                return [mergedWords];

                                //
                                // const blockWords = block.paragraphs
                                //     .flatMap(paragraph => paragraph.words);
                                //
                                // const mergedWords = [];
                                // let groupStartIdx = 0;
                                // for (let currIdx = 1; currIdx < blockWords.length; ++currIdx) {
                                //     const groupStringified = this.stringifySymbols(
                                //         blockWords.slice(groupStartIdx, currIdx + 1).flatMap(word => word.symbols));
                                //     if (groupStringified.includes(' ')
                                //         || !this.geometryHelper.areAlignedHorizontally(
                                //             blockWords[currIdx - 1].boundingBox.vertices,
                                //             blockWords[currIdx].boundingBox.vertices)) {
                                //         const wordsToMerge = blockWords.slice(groupStartIdx, currIdx);
                                //         const symbolsToMerge = wordsToMerge.flatMap(word => word.symbols);
                                //         const mergedWord = {
                                //             text: this.stringifySymbols(symbolsToMerge),
                                //             vertices: this.geometryHelper.mergedBoxOf(wordsToMerge),
                                //             symbols: symbolsToMerge
                                //         };
                                //         if (mergedWords.length > 0
                                //             && this.geometryHelper.areLineNeighbours(
                                //                 mergedWords[mergedWords.length - 1].vertices,
                                //                 mergedWord.vertices)) {
                                //             mergedWords[mergedWords.length - 1].vertices =
                                //                 this.geometryHelper.mergedBoxOfPoly([
                                //                     mergedWords[mergedWords.length - 1],
                                //                     mergedWord]);
                                //             mergedWords[mergedWords.length - 1].text += ' ' + mergedWord.text;
                                //             mergedWords[mergedWords.length - 1].symbols = [
                                //                 ...mergedWords[mergedWords.length - 1].symbols,
                                //                 ...mergedWord.symbols
                                //             ];
                                //         } else {
                                //             mergedWords.push(mergedWord);
                                //         }
                                //         groupStartIdx = currIdx;
                                //     }
                                // }
                                //
                                // const wordsToMergeLast = blockWords.slice(groupStartIdx);
                                // const symbolsToMergeLast = wordsToMergeLast.flatMap(word => word.symbols);
                                // const mergedWordLast = {
                                //     text: this.stringifySymbols(symbolsToMergeLast),
                                //     vertices: this.geometryHelper.mergedBoxOf(wordsToMergeLast),
                                //     symbols: symbolsToMergeLast
                                // };
                                // if (mergedWords.length > 0
                                //     && this.geometryHelper.areLineNeighbours(
                                //         mergedWords[mergedWords.length - 1].vertices,
                                //         mergedWordLast.vertices)) {
                                //     mergedWords[mergedWords.length - 1].vertices =
                                //         this.geometryHelper.mergedBoxOfPoly([
                                //             mergedWords[mergedWords.length - 1],
                                //             mergedWordLast]);
                                //     mergedWords[mergedWords.length - 1].text += ' ' + mergedWordLast.text;
                                //     mergedWords[mergedWords.length - 1].symbols = [
                                //         ...mergedWords[mergedWords.length - 1].symbols,
                                //         ...mergedWordLast.symbols
                                //     ];
                                // } else {
                                //     mergedWords.push(mergedWordLast);
                                // }
                            });
                            objResults[idx].visionResultsArr = visionResultArr;
                            // objResults[idx].symbolsArr = response.fullTextAnnotation.pages[0].blocks;

                            // this.visionResultsArr.push(visionResultArr);
                        } else {
                            // this.visionResultsArr.push([]);
                            // this.symbolsArr.push([]);
                        }

                        if (Object.keys(objResults).length === visionResults.length) {
                            Object.keys(objResults).sort();

                            for (const [key, value] of Object.entries(objResults)) {
                                // console.log(`${key}: ${value}`);
                                this.symbolsArr.push(value['symbolsArr']);
                                this.dataPagesSize.push(value['dataPagesSize']);
                                this.visionResultsArr.push(value['visionResultsArr']);
                            }
                            // console.log(this.dataPagesSize);
                            this.createFormAfterGetPagesSize(this.fileDetails);
                        }
                    });
                });
            } else {
                this.createFormAfterGetPagesSize(this.fileDetails);
            }
        });

        // this.visionResultWords$ = this.visionResult$
        //     .pipe(
        //         map(visionResults => {
        //             if (Array.isArray(visionResults)) {
        //                 return visionResults.map(pageVisionResults$ => pageVisionResults$
        //                     .pipe(
        //                         map((visionResult) => {
        //
        //                             // textAnnotations
        //                             // boundingPoly: {vertices: [{x: 786, y: 111}, {x: 884, y: 110}, {x: 884, y: 157}, {x: 786, y: 158}]}
        //                             // description: "קופה"
        //
        //
        //                             if (visionResult && visionResult.textAnnotations
        //                                 && Array.isArray(visionResult.textAnnotations)
        //                                 && visionResult.textAnnotations.length > 1) {
        //                                 debugger
        //                                 const visionResultArr = visionResult.textAnnotations
        //                                     .flatMap(block => {
        //                                         debugger
        //                                         const blockWords = block.paragraphs
        //                                             .flatMap(paragraph => paragraph.words);
        //
        //                                         const mergedWords = [];
        //                                         let groupStartIdx = 0;
        //                                         for (let currIdx = 1; currIdx < blockWords.length; ++currIdx) {
        //                                             const groupStringified = this.stringifySymbols(
        //                                                 blockWords.slice(groupStartIdx, currIdx + 1).flatMap(word => word.symbols));
        //                                             if (groupStringified.includes(' ')
        //                                                 || !this.geometryHelper.areAlignedHorizontally(
        //                                                     blockWords[currIdx - 1].boundingBox.vertices,
        //                                                     blockWords[currIdx].boundingBox.vertices)) {
        //                                                 const wordsToMerge = blockWords.slice(groupStartIdx, currIdx);
        //                                                 const symbolsToMerge = wordsToMerge.flatMap(word => word.symbols);
        //                                                 const mergedWord = {
        //                                                     text: this.stringifySymbols(symbolsToMerge),
        //                                                     vertices: this.geometryHelper.mergedBoxOf(wordsToMerge),
        //                                                     symbols: symbolsToMerge
        //                                                 };
        //                                                 // if (mergedWord.text.includes('20')) {
        //                                                 //     debugger;
        //                                                 // }
        //                                                 if (mergedWords.length > 0
        //                                                     && this.geometryHelper.areLineNeighbours(
        //                                                         mergedWords[mergedWords.length - 1].vertices,
        //                                                         mergedWord.vertices)) {
        //                                                     mergedWords[mergedWords.length - 1].vertices =
        //                                                         this.geometryHelper.mergedBoxOfPoly([
        //                                                             mergedWords[mergedWords.length - 1],
        //                                                             mergedWord]);
        //                                                     mergedWords[mergedWords.length - 1].text += ' ' + mergedWord.text;
        //                                                     mergedWords[mergedWords.length - 1].symbols = [
        //                                                         ...mergedWords[mergedWords.length - 1].symbols,
        //                                                         ...mergedWord.symbols
        //                                                     ];
        //                                                 } else {
        //                                                     mergedWords.push(mergedWord);
        //                                                 }
        //                                                 groupStartIdx = currIdx;
        //                                             }
        //                                         }
        //
        //                                         const wordsToMergeLast = blockWords.slice(groupStartIdx);
        //                                         const symbolsToMergeLast = wordsToMergeLast.flatMap(word => word.symbols);
        //                                         const mergedWordLast = {
        //                                             text: this.stringifySymbols(symbolsToMergeLast),
        //                                             vertices: this.geometryHelper.mergedBoxOf(wordsToMergeLast),
        //                                             symbols: symbolsToMergeLast
        //                                         };
        //                                         // if (mergedWordLast.text.includes('20')) {
        //                                         //     debugger;
        //                                         // }
        //                                         if (mergedWords.length > 0
        //                                             && this.geometryHelper.areLineNeighbours(
        //                                                 mergedWords[mergedWords.length - 1].vertices,
        //                                                 mergedWordLast.vertices)) {
        //                                             mergedWords[mergedWords.length - 1].vertices =
        //                                                 this.geometryHelper.mergedBoxOfPoly([
        //                                                     mergedWords[mergedWords.length - 1],
        //                                                     mergedWordLast]);
        //                                             mergedWords[mergedWords.length - 1].text += ' ' + mergedWordLast.text;
        //                                             mergedWords[mergedWords.length - 1].symbols = [
        //                                                 ...mergedWords[mergedWords.length - 1].symbols,
        //                                                 ...mergedWordLast.symbols
        //                                             ];
        //                                         } else {
        //                                             mergedWords.push(mergedWordLast);
        //                                         }
        //
        //                                         if (Array.isArray(mergedWords) && mergedWords.length) {
        //                                             mergedWords.forEach((items, idx) => {
        //                                                 if (Array.isArray(items.vertices) && items.vertices.length && items.vertices.find(vertx => (vertx.x === undefined || vertx.y === undefined || vertx.x < 0 || vertx.y < 0))) {
        //                                                     items.vertices.forEach(item => {
        //                                                         if (item.x === undefined || item.x < 0) {
        //                                                             item.x = 0;
        //                                                         }
        //                                                         if (item.y === undefined || item.y < 0) {
        //                                                             item.y = 0;
        //                                                         }
        //                                                     });
        //                                                     mergedWords[idx].vertices = items.vertices;
        //                                                     // console.log('value', items, idx, mergedWords);
        //                                                 }
        //                                             });
        //                                         }
        //                                         return mergedWords;
        //                                     });
        //                                 return visionResultArr;
        //                                 // return visionResult.fullTextAnnotation.pages[0].blocks
        //                                 //     .flatMap(block => {
        //                                 //         return block.paragraphs
        //                                 //             .flatMap(paragraph => {
        //                                 //                 return paragraph.words
        //                                 //                     .map(word => {
        //                                 //                         return {
        //                                 //                             text: word.symbols.map(sym => sym.text).join(''),
        //                                 //                             vertices: word.boundingBox.vertices
        //                                 //                         };
        //                                 //                     });
        //                                 //             });
        //                                 //     });
        //                             }
        //                             return [];
        //                         }),
        //                         publishReplay(1),
        //                         refCount()
        //                     ));
        //             }
        //             return visionResults;
        //         })
        //     );


        this.cachedContent$ = this.fileDetails$.pipe(
            switchMap((fileDetails) => {
                if (!fileDetails || !Array.isArray(fileDetails.pages)) {
                    this.fileProgress = false;
                    return of([]);
                }
                if (this.showSplit) {
                    this.getChildren(fileDetails.pages);
                }
                return of(
                    fileDetails.pages.map((page) => {
                        if (!page.contentUrl) {
                            this.fileProgress = false;
                            return of(null);
                        }
                        page.rotate = {degree: 0, step: 90, boundaryRad: 0};
                        return this.http
                            .get(page.contentUrl, {
                                responseType: 'blob'
                            })
                            .pipe(
                                switchMap((invoiceBlob) => {
                                    return new Observable<Blob>((subscriber) => {
                                        const reader: any = new FileReader();
                                        reader.onerror = (err) => subscriber.error(err);
                                        reader.onabort = (err) => subscriber.error(err);
                                        reader.onload = (evt) => {
                                            subscriber.next((evt.target as any).result);
                                            subscriber.complete();
                                            // this.fileProgress = false;
                                            setTimeout(() => {
                                                this.getSizeAllImgs();
                                            }, 100);
                                        };
                                        reader.readAsDataURL(invoiceBlob);
                                    });
                                }),
                                catchError(() => of(null)),
                                publishRef
                            );
                    })
                );
            }),
            publishRef
        );

        this.currentPageCachedContent$ = combineLatest(
            [
                this.cachedContent$,
                this.currentPage
            ]
        ).pipe(
            switchMap(([cachedContent, pageNo]) => {
                return Array.isArray(cachedContent) && pageNo - 1 < cachedContent.length
                    ? cachedContent[pageNo - 1]
                    : null;
            }),
            publishRef
        );
    }

    public setValCartis(dd: any, fid: number) {
        const obj = {
            cartisName: dd.filterValue,
            cartisCodeId: null,
            custId: dd.filterValue,
            lName: null,
            hashCartisCodeId: 1,
            hp: null,
            id: null,
            pettyCash: false,
            supplierTaxDeduction: null,
            customerTaxDeduction: null
        };
        this.userService.appData.userData.companyCustomerDetails.all.push(obj);
        if (fid === 6) {
            this.userService.appData.userData.companyCustomerDetails.allFor6.push(
                obj
            );
            this.sortAllFor6();
            dd.options =
                this.fileFieldsForm.get('21').get('effectiveValue').value === 0
                    ? this.userService.appData.userData.companyCustomerDetails
                        .allFor6Income
                    : this.userService.appData.userData.companyCustomerDetails
                        .allFor6Expense;
        } else {
            dd.options = this.userService.appData.userData.companyCustomerDetails.all;
        }
        dd.overlayVisible = false;
        this.fileFieldsForm
            .get(fid.toString())
            .get('effectiveValue')
            .patchValue(obj);
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

    onScroll(scrollbarRef: any, virtualScroll?: any) {
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        this.scrollSubscription = scrollbarRef.scrolled.subscribe(() => {
            this.hideOpenedPanels();
        });
    }

    public getCompanyCustomerDetailsTimer() {
        if (
            !this.subscriptionTime ||
            (this.subscriptionTime && this.subscriptionTime.isStopped)
        ) {
            this.loaderGetCompanyCustomerDetails = true;
            let dataReceiveDate = null;
            let refresh = true;

            this.subscriptionTime = timer(0, 5000)
                .pipe(
                    switchMap(() =>
                        this.ocrService.getCompanyJournalTransData({
                            uuid: this.userService.appData.userData.companySelect.companyId,
                            refresh: refresh
                        })
                    ),
                    tap(() => {
                        if (refresh === true) {
                            refresh = false;
                        }
                    })
                )
                .subscribe((response: any) => {
                    const getCompanyJournalTransData =
                        response && !response.error ? response.body : null;
                    if (getCompanyJournalTransData) {
                        if (!dataReceiveDate) {
                            dataReceiveDate = getCompanyJournalTransData.dataReceiveDate;
                        }
                        if (
                            dataReceiveDate !== getCompanyJournalTransData.dataReceiveDate
                        ) {
                            this.subscriptionTime.unsubscribe();
                            this.userService.appData.userData.companyCustomerDetails = null;
                            this.sharedService.companyCustomerDetails$ = null;
                            this.getCompanyCustomerDetails(true);
                        }
                    }
                });
        }
    }

    public hideDropCartis() {
        if (this.subscriptionTime) {
            this.subscriptionTime.unsubscribe();
        }
        this.loaderGetCompanyCustomerDetails = false;
    }

    public sortAllFor6() {
        const isHistory =
            this.userService.appData.userData.companyCustomerDetails.allFor6.filter(
                (fd) => fd['isHistory']
            );
        const isNotHistory =
            this.userService.appData.userData.companyCustomerDetails.allFor6.filter(
                (fd) => !fd['isHistory']
            );
        const nullValues = isNotHistory.filter((fd) => !fd['lName']);
        const realValuesFolders = isNotHistory.filter((fd) => fd['lName']);
        const isHebrew = realValuesFolders
            .filter((it) => /[\u0590-\u05FF]/.test(it['lName']))
            .sort((a, b) => (a['lName'] > b['lName'] ? 1 : -1));
        const isEnglish = realValuesFolders
            .filter((it) => /^[A-Za-z]+$/.test(it['lName']))
            .sort((a, b) => (a['lName'] > b['lName'] ? 1 : -1));
        const isNumbers = realValuesFolders
            .filter((it) => /^[0-9]+$/.test(it['lName']))
            .sort((a, b) => (a['lName'] > b['lName'] ? 1 : -1));
        const isOthers = realValuesFolders
            .filter(
                (it) =>
                    !/^[A-Za-z]+$/.test(it['lName']) &&
                    !/^[0-9]+$/.test(it['lName']) &&
                    !/[\u0590-\u05FF]/.test(it['lName'])
            )
            .sort((a, b) => (a['lName'] > b['lName'] ? 1 : -1));
        const allSorted = isHistory.concat(
            isHebrew,
            isEnglish,
            isNumbers,
            isOthers,
            nullValues
        );
        if (this.fileFieldsForm.get('21').get('effectiveValue').value === 0) {
            const arrNum = [
                27, 1, 2, 4, 5, 15, 23, 24, 25, 26, 28, 30, 31, 32, 43, 9, 7, 10, 16,
                47, 50, 8, 17, 11, 44, 48, 51
            ];
            const filterArr = allSorted.filter((it) =>
                arrNum.includes(it.hashCartisCodeId)
            );
            const firsts = filterArr.filter((it) => it.cartisCodeId === 1300);
            const last = filterArr.filter((it) => it.cartisCodeId !== 1300);
            this.userService.appData.userData.companyCustomerDetails.allFor6Income =
                firsts.concat(last);
        } else {
            const arrNum = [
                27, 1, 2, 4, 5, 15, 23, 24, 25, 26, 28, 30, 31, 32, 43, 9, 3, 29, 46,
                49, 52, 13
            ];
            const filterArr = allSorted.filter((it) =>
                arrNum.includes(it.hashCartisCodeId)
            );
            const firsts = filterArr.filter((it) => it.cartisCodeId === 1400);
            const last = filterArr.filter((it) => it.cartisCodeId !== 1400);
            this.userService.appData.userData.companyCustomerDetails.allFor6Expense =
                firsts.concat(last);
        }
        this.arrOption6 = this.userService.appData.userData.companyCustomerDetails
            ? this.fileFieldsForm.get('21').get('effectiveValue').value === 0
                ? this.addPriemerObject(
                    this.userService.appData.userData.companyCustomerDetails
                        .allFor6Income,
                    6
                )
                : this.addPriemerObject(
                    this.userService.appData.userData.companyCustomerDetails
                        .allFor6Expense,
                    6
                )
            : [];
    }

    public getCompanyCustomerDetails(isSetNewVal?: boolean) {
        this.sharedService
            .companyGetCustomer({
                companyId: this.userService.appData.userData.companySelect.companyId,
                sourceProgramId:
                this.userService.appData.userData.companySelect.sourceProgramId
            })
            .subscribe((response: any) => {
                if (isSetNewVal) {
                    this.formDropdownsMaamCustids.forEach((item) => {
                        item.options = this.userService.appData.userData.maamCustids;
                    });
                    this.formDropdownsCartis.forEach((item: any) => {
                        const effectiveValue = item.custId ? item.custId : null;
                        let val =
                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                (custIdxRec) => custIdxRec.custId === effectiveValue
                            );
                        if (!val && effectiveValue) {
                            val = {
                                cartisName: effectiveValue,
                                cartisCodeId: null,
                                custId: effectiveValue,
                                lName: null,
                                hp: null,
                                id: null,
                                pettyCash: false,
                                supplierTaxDeduction: null,
                                customerTaxDeduction: null
                            };
                            this.userService.appData.userData.companyCustomerDetails.all.push(
                                val
                            );
                        }
                        item.options =
                            this.userService.appData.userData.companyCustomerDetails.all;
                        item.optionsToDisplay =
                            this.userService.appData.userData.companyCustomerDetails.all;
                        item.filterValue = '';
                        item.resetFilter();
                    });

                    this.formDropdownsCartis6.forEach((item: any) => {
                        const effectiveValue = item.custId ? item.custId : null;
                        this.userService.appData.userData.companyCustomerDetails.allFor6 =
                            JSON.parse(
                                JSON.stringify(
                                    this.userService.appData.userData.companyCustomerDetails.all
                                )
                            );

                        this.sortAllFor6();

                        let foundMatch = false;
                        if (
                            !!effectiveValue &&
                            this.userService.appData.userData.companyCustomerDetails.allFor6
                        ) {
                            const val =
                                this.userService.appData.userData.companyCustomerDetails.allFor6.find(
                                    (custIdxRec) => custIdxRec.custId === effectiveValue
                                );
                            if (val) {
                                foundMatch = true;
                            }
                        }
                        if (this.fileFieldsForm.get('2').get('effectiveValue').value) {
                            this.ocrService
                                .oppositeCustHistory({
                                    companyId:
                                    this.userService.appData.userData.companySelect.companyId,
                                    sourceProgramId:
                                    this.userService.appData.userData.companySelect
                                        .sourceProgramId,
                                    custId: this.fileFieldsForm.get('2').get('effectiveValue')
                                        .value.custId,
                                    expense: this.fileFieldsForm.get('21')
                                        ? this.fileFieldsForm.get('21').get('effectiveValue').value
                                        : null
                                })
                                .subscribe((res) => {
                                    let oppositeCustHistory = res ? res['body'] : res;
                                    if (oppositeCustHistory && oppositeCustHistory.length) {
                                        oppositeCustHistory = oppositeCustHistory.map((it) => {
                                            const cartisName = it.custId
                                                ? it.custId +
                                                (it.custLastName ? ' - ' + it.custLastName : '')
                                                : it.custLastName
                                                    ? it.custLastName
                                                    : '';
                                            return {
                                                cartisName: cartisName,
                                                custId: it.custId,
                                                lName: it.custLastName,
                                                hp: null,
                                                id: null,
                                                hashCartisCodeId: 1,
                                                isHistory: true
                                            };
                                        });
                                        oppositeCustHistory[
                                        oppositeCustHistory.length - 1
                                            ].isLastHistory = true;

                                        this.userService.appData.userData.companyCustomerDetails.allFor6 =
                                            oppositeCustHistory.concat(
                                                this.userService.appData.userData.companyCustomerDetails.all.filter(
                                                    (it) =>
                                                        !oppositeCustHistory.some(
                                                            (histIt) => histIt.custId === it.custId
                                                        )
                                                )
                                            );
                                    }
                                    if (!foundMatch) {
                                        if (
                                            !!effectiveValue &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .allFor6
                                        ) {
                                            let val =
                                                this.userService.appData.userData.companyCustomerDetails.allFor6.find(
                                                    (custIdxRec) => custIdxRec.custId === effectiveValue
                                                );
                                            if (val) {
                                            } else {
                                                val = {
                                                    cartisName: effectiveValue,
                                                    cartisCodeId: null,
                                                    custId: effectiveValue,
                                                    lName: null,
                                                    hp: null,
                                                    hashCartisCodeId: 1,
                                                    id: null,
                                                    pettyCash: false,
                                                    supplierTaxDeduction: null,
                                                    customerTaxDeduction: null
                                                };
                                                this.userService.appData.userData.companyCustomerDetails.allFor6.push(
                                                    val
                                                );
                                            }
                                        }
                                    }

                                    this.sortAllFor6();

                                    item.options =
                                        this.fileFieldsForm.get('21').get('effectiveValue')
                                            .value === 0
                                            ? this.userService.appData.userData.companyCustomerDetails
                                                .allFor6Income
                                            : this.userService.appData.userData.companyCustomerDetails
                                                .allFor6Expense;
                                    item.optionsToDisplay =
                                        this.fileFieldsForm.get('21').get('effectiveValue')
                                            .value === 0
                                            ? this.userService.appData.userData.companyCustomerDetails
                                                .allFor6Income
                                            : this.userService.appData.userData.companyCustomerDetails
                                                .allFor6Expense;
                                    item.filterValue = '';
                                    item.resetFilter();
                                });
                        } else {
                            if (!foundMatch) {
                                if (
                                    !!effectiveValue &&
                                    this.userService.appData.userData.companyCustomerDetails
                                        .allFor6
                                ) {
                                    const val = {
                                        cartisName: effectiveValue,
                                        cartisCodeId: null,
                                        custId: effectiveValue,
                                        lName: null,
                                        hashCartisCodeId: 1,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.allFor6.push(
                                        val
                                    );
                                }
                            }

                            this.sortAllFor6();

                            item.options =
                                this.fileFieldsForm.get('21').get('effectiveValue').value === 0
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .allFor6Income
                                    : this.userService.appData.userData.companyCustomerDetails
                                        .allFor6Expense;
                            item.optionsToDisplay =
                                this.fileFieldsForm.get('21').get('effectiveValue').value === 0
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .allFor6Income
                                    : this.userService.appData.userData.companyCustomerDetails
                                        .allFor6Expense;
                            item.filterValue = '';
                            item.resetFilter();
                        }
                    });
                }

                // const companyCustomerDetails = (response && !response.error) ? response.body : [];
                // if (companyCustomerDetails && companyCustomerDetails.length) {
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
                //     companyCustomerDetails.custDataIncome = allTypes;
                //     companyCustomerDetails.custDataExpense = allTypes;
                //     companyCustomerDetails.indexDataIncome = allTypes;
                //     companyCustomerDetails.indexDataExpense = allTypes;
                //
                //     companyCustomerDetails.custData13 = companyCustomerDetails.filter(it => it.cartisCodeId === 13).length ? companyCustomerDetails.filter(it => it.cartisCodeId === 13)[0] : null;
                //     companyCustomerDetails.custData14 = companyCustomerDetails.filter(it => it.cartisCodeId === 14).length ? companyCustomerDetails.filter(it => it.cartisCodeId === 14)[0] : null;
                //     companyCustomerDetails.custData12 = companyCustomerDetails.filter(it => it.cartisCodeId === 12).length ? companyCustomerDetails.filter(it => it.cartisCodeId === 12)[0] : null;
                //
                //
                //     companyCustomerDetails.custMaamNechasim = companyCustomerDetails.filter(it => it.custMaamNechasim).length ? companyCustomerDetails.filter(it => it.custMaamNechasim)[0] : null;
                //     companyCustomerDetails.custMaamTsumot = companyCustomerDetails.filter(it => it.custMaamTsumot).length ? companyCustomerDetails.filter(it => it.custMaamTsumot)[0] : null;
                //     companyCustomerDetails.custMaamYevu = companyCustomerDetails.filter(it => it.custMaamYevu).length ? companyCustomerDetails.filter(it => it.custMaamYevu)[0] : null;
                //     companyCustomerDetails.custMaamIska = companyCustomerDetails.filter(it => it.custMaamIska).length ? companyCustomerDetails.filter(it => it.custMaamIska)[0] : null;
                //
                //     companyCustomerDetails.cupa = companyCustomerDetails.filter(it => it.cartisCodeId === 1700 || it.cartisCodeId === 1800).map(it => {
                //         return {
                //             cartisCodeId: it.cartisCodeId,
                //             custId: it.custId,
                //             lName: it.custLastName,
                //             hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                //             id: it.palCode,
                //             pettyCash: it.pettyCash ? it.pettyCash : false
                //         };
                //     });
                //     companyCustomerDetails.esderMaam = this.userService.appData.userData.companySelect.esderMaam;
                // }

                // this.companyCustomerDetailsData = {
                //     esderMaam: this.userService.appData.userData.companySelect.esderMaam
                // };

                this.loaderGetCompanyCustomerDetails = false;
            });
    }

    onKey(event, fieldId) {
        const listItemIdToFind =
            this.activeField && this.activeField.field.fieldId !== 1
                ? 'fieldListItem_' + this.activeField.field.fieldId
                : 'fieldListItem_' + fieldId;
        let findCurrElem = false;
        let findNextElem: any = false;
        this.fieldListItems.forEach((item) => {
            if (item._hostElement.id === listItemIdToFind) {
                findCurrElem = true;
            } else {
                if (findCurrElem && !findNextElem) {
                    const nextElemToActive = item._hostElement;
                    if (nextElemToActive.tabIndex !== -1) {
                        findNextElem = nextElemToActive;
                    }
                }
            }
        });

        if (findNextElem) {
            const newFieldId = findNextElem.id.replace('fieldListItem_', '');
            this.setActiveField(
                this.fileFieldsForm.get(newFieldId + '').value,
                findNextElem,
                this.fileFieldsForm.get(newFieldId + '')
            );
            if (findNextElem) {
                requestAnimationFrame(() => {
                    if (findNextElem.classList.contains('active')) {
                        findNextElem.scrollIntoView();
                    }
                });
            }
        }
    }

    focusFl28() {
        let findNextElem: any = false;

        this.fieldListItems.forEach((item) => {
            if (item._hostElement.id === 'fieldListItem_28') {
                findNextElem = item._hostElement;
            }
        });
        if (findNextElem) {
            const newFieldId = findNextElem.id.replace('fieldListItem_', '');
            this.setActiveField(
                this.fileFieldsForm.get(newFieldId + '').value,
                findNextElem,
                this.fileFieldsForm.get(newFieldId + '')
            );
            if (findNextElem) {
                requestAnimationFrame(() => {
                    if (findNextElem.classList.contains('active')) {
                        findNextElem.scrollIntoView();
                    }
                });
            }
        }
    }

    createFormAfterGetPagesSize(fileDetails) {
        this.companyCustomerDetails$
            .subscribe(() => {
                // this.companyCustomerDetailsSave = companyCustomerDetails;
                this.createNewForm(fileDetails);
            });
    }

    transformPoints(value: Array<{ x: number; y: number }>, args?: any): string {
        return Array.isArray(value) && value.length
            ? value
                .map(
                    (vertx) =>
                        (vertx.x !== undefined ? vertx.x : 0) +
                        ' ' +
                        (vertx.y !== undefined ? vertx.y : 0)
                )
                .join(' ')
            : null;
    }

    createNewForm(fileDetails: any, scrollToBotoom = false) {
        this.showDoubleSuspect = false;
        this.activeField = null;
        this.activeWord = null;
        this.fileFieldsForm = new FormGroup({});
        this.resetFileFieldsForm();
        this.fileDetailsSave = fileDetails;
        this.fileDetailsSave.approveActiveCopy = this.fileDetailsSave.approveActive;
        this.parentExport = fileDetails ? fileDetails.parentExport : null;
        this.showTaxDeduction = fileDetails ? fileDetails.showTaxDeduction : false;
        this.expenseOnly = fileDetails ? fileDetails.expenseOnly : false;
        this.showNegative = fileDetails ? fileDetails.showNegative : false;
        this.companyIdentificationName = fileDetails
            ? fileDetails.companyIdentificationName
            : null;
        this.companyIdentificationId = fileDetails
            ? fileDetails.companyIdentificationId
                ? fileDetails.companyIdentificationId
                : null
            : null;
        if (this.fileDetailsSave.invoicePayment !== null) {
            this.invoicePayment.patchValue(fileDetails['invoicePayment'], {
                emitEvent: false,
                onlySelf: true
            });
        }

        // approveActive: true
        // companyIdentificationId: null
        // documentLogicType: "regular_expense_type"
        // fieldsHierarchy: [{category: "נתוני מסמך",…}, {category: "נתוני פקודת יומן",…}]
        // flag: false
        // jobExecutionId: 3129801
        // note: null
        // pages: [{,…}]
        // parentExport: false
        // status: "WAIT_FOR_CONFIRM"

        const fileId = this._fileScanView.fileId;
        // 'fieldPosition': [{'x': 286, 'y': 29}, {'x': 420, 'y': 29}, {'x': 420, 'y': 59}, {'x': 286, 'y': 59}],
        let isExpense = false;
        let val9 = null;
        for (const cat of this.fileDetailsSave.fieldsHierarchy) {
            for (const fld of cat.fields) {
                const fldKey = String(fld.fieldId);
                if (fldKey === '21') {
                    if (fld.fieldValue === 1) {
                        isExpense = true;
                    }
                }
                if (fldKey === '9') {
                    val9 = fld.fieldValue;
                }
                if (this.fileDetailsSave.matahSums && fldKey === '12') {
                    this.currencyList$.subscribe(() => {
                        const sign = this.currencyList.find(
                            (ite) => ite.id === fld.fieldValue
                        );
                        if (sign) {
                            this.revaluationCurrCodeSign = sign.code;
                        }
                    });
                }
                if ('11' === fldKey) {
                    this.fieldNameAsmachta = fld.fieldName;
                }
                if ('25' === fldKey) {
                    fld.fieldValue = this.roundFourDigits(Number(fld.fieldValue));
                    this.rate = fld.fieldValue;
                }
            }
        }
        this.editHp = this.fileDetailsSave.fieldsHierarchy.some((cat) => {
            return cat.fields.some((fld: any) => {
                const fldKey = String(fld.fieldId);
                if ('9' === fldKey) {
                    if (fld.fieldValue === 'חשבונית מט"ח' || fld.fieldValue === 'אחר') {
                        return true;
                    }
                }
                if ('21' === fldKey) {
                    if (fld.fieldValue === 0) {
                        return true;
                    }
                }
                return false;
            });
        });
        for (const cat of this.fileDetailsSave.fieldsHierarchy) {
            for (const fld of cat.fields) {
                try {
                    const fldKey = String(fld.fieldId);
                    const fileFld = cat.fields.find((fdf) => fdf.fieldId === fld.fieldId);

                    if (fld.valueType === 'NUMBER' || fld.valueType === 'STRING') {
                        if (
                            fileFld &&
                            !fileFld.valueTypeOv &&
                            fileFld.fieldValue === null
                        ) {
                            fld.fieldPosition = [
                                {x: 159, y: 24},
                                {x: 159 + 145, y: 24},
                                {x: 159 + 145, y: 24 + 30},
                                {x: 159, y: 24 + 30}
                            ];
                            fld.fieldPositionFake = true;
                            if (fld.fieldPage === null) {
                                fld.fieldPage = 1;
                            }
                        } else {
                            if (
                                this.dataPagesSize.length &&
                                (!Array.isArray(fileFld.fieldPosition) ||
                                    (Array.isArray(fileFld.fieldPosition) &&
                                        !fileFld.fieldPosition.length))
                            ) {
                                fld.fieldPosition =
                                    this.dataPagesSize[fld.fieldPage ? fld.fieldPage - 1 : 0];
                                fld.fieldPositionFake = true;
                                if (fld.fieldPage === null) {
                                    fld.fieldPage = 1;
                                }
                                // console.log('fld.fieldPosition', fld.fieldPosition);
                            }
                        }
                    }

                    if (fileFld.alertId !== undefined && fileFld.alertId !== null) {
                        if (fileFld.fieldId === 11 && fileFld.alertId === 10) {
                            this.showDoubleSuspect = true;
                        }
                        const hasAlert = this.alerstIdsArr.find(
                            (it) => it.alertId === fileFld.alertId
                        );
                        if (hasAlert) {
                            fileFld.alertMessage = hasAlert.alertMessage;
                            fileFld.indBlockAprrove = hasAlert.indBlockAprrove;
                        }
                    }
                    fld.fileFldInfo = fileFld && fileFld.alertMessage ? fileFld : null;
                    fld.indBlockAprrove =
                        fileFld &&
                        fileFld['indBlockAprrove'] &&
                        fileFld['indBlockAprrove'] === true;

                    let fileFldVal: any = fileFld
                        ? fileFld.valueTypeOv
                            ? fileFld.valueTypeOv
                            : fileFld.fieldValue
                        : null;
                    if (fileFldVal && fld.valueType === 'DATE') {
                        fileFldVal = this.userService.appData.moment(fileFldVal).toDate();

                        if (
                            fld.fieldId === 5 &&
                            Array.isArray(this.companyCustomerDetailsData.vatReportOptions) &&
                            this.companyCustomerDetailsData.vatReportOptions.length > 0
                        ) {
                            const fileFldValToFindInSelect = this.userService.appData
                                .moment(fileFldVal)
                                .valueOf();
                            if (
                                !this.companyCustomerDetailsData.vatReportOptions.some(
                                    (slctdItem) => slctdItem.value === fileFldValToFindInSelect
                                )
                            ) {
                                const idxNextToSelected =
                                    this.companyCustomerDetailsData.vatReportOptions.findIndex(
                                        (slctdItem) => slctdItem.value >= fileFldValToFindInSelect
                                    );
                                if (idxNextToSelected > 0) {
                                    fileFldVal =
                                        this.companyCustomerDetailsData.vatReportOptions[
                                        idxNextToSelected - 1
                                            ].value;
                                }
                            }
                        }
                    } else if (fileFldVal && fld.fieldId === 10) {
                        fileFldVal = fileFldVal === 1;
                    }

                    if (
                        (cat.category !== 'שדות נוספים' || !cat.collapsed) &&
                        fldKey !== '8' &&
                        fileFldVal &&
                        fileFld &&
                        !fld.fieldPositionFake
                    ) {
                        // console.log('fld.fieldId: ', fld.fieldId, ' fieldPositionFake: ', fld.fieldPositionFake);
                        this.wordsFieldsExist.push({
                            fieldPage: fileFld.fieldPage || fileFld.fieldPage || 1,
                            fieldPosition:
                                Array.isArray(fileFld.fieldPosition) &&
                                fileFld.fieldPosition.length
                                    ? fileFld.fieldPosition
                                    : fileFld.fieldPosition,
                            field: fld
                        });
                    }

                    if (this.fileDetailsSave.matahSums && fld.fieldId === 24) {
                        if (!fld.fieldPosition || !fld.fieldPosition.length) {
                            const fd17 = cat.fields.find((fdf) => fdf.fieldId === 17);
                            fld.fieldPage = fd17.fieldPage;
                            fld.fieldPosition = fd17.fieldPosition;
                        }
                    }
                    if (this.fileDetailsSave.matahSums && fld.fieldId === 29) {
                        if (!fld.fieldPosition || !fld.fieldPosition.length) {
                            const fd18 = cat.fields.find((fdf) => fdf.fieldId === 18);
                            fld.fieldPage = fd18.fieldPage;
                            fld.fieldPosition = fd18.fieldPosition;
                        }
                    }
                    if (
                        (fld.fieldId === 40 || fld.fieldId === 4) &&
                        fld.required &&
                        fileFldVal &&
                        fld.valueTypeOv === 'פקודה מפוצלת'
                    ) {
                        fld.required = false;
                    }

                    const fc: any = new FormGroup({
                        valueTypeOv: new FormControl(fld.valueTypeOv && true),
                        indBlockAprrove: new FormControl(fld.indBlockAprrove),
                        fileId: new FormControl(
                            fileFld && fileFld.fileId ? fileFld.fileId : fileId
                        ),
                        fieldId: new FormControl(fileFld ? fileFld.fieldId : fld.fieldId),
                        fileResultId: new FormControl(
                            fileFld ? fileFld.fileResultId : null
                        ),
                        fieldPage: new FormControl(
                            fileFld ? fileFld.fieldPage || fileFld.fieldPage : null
                        ),
                        fieldPosition: new FormControl(
                            fileFld
                                ? Array.isArray(fileFld.fieldPosition) &&
                                fileFld.fieldPosition.length
                                    ? fileFld.fieldPosition
                                    : fileFld.fieldPosition
                                : null
                        ),
                        effectiveValue: new FormControl(
                            fileFldVal,
                            fld.required
                                ? fld.fieldId === 10
                                    ? [Validators.requiredTrue]
                                    : [Validators.required]
                                : null
                        ),
                        hasBeenDiscovered: new FormControl(
                            fileFld &&
                            Array.isArray(fileFld.fieldPosition) &&
                            fileFld.fieldPosition.length
                        ),
                        searchkey: new FormControl(),
                        locationNo: new FormControl(),
                        locationDesc: new FormControl()
                    });

                    if (
                        !fc.value.fieldPage &&
                        Array.isArray(fc.value.fieldPosition) &&
                        fc.value.fieldPosition.length &&
                        fileDetails.pages.length === 1
                    ) {
                        fc.get('fieldPage').setValue(1);
                    }
                    this.fileFieldsForm.setControl(fldKey, fc);

                    if (fld.disabled || fld.fieldId === 28) {
                        fc.disable();
                    } else {
                        fc.enable();
                    }
                    const isDD = [21, 12, 22, 9, 6, 2, 5, 4, 40, 41].some(
                        (id) => id === Number(fld.fieldId)
                    );
                    if (fld.fieldId === 2) {
                        if (
                            !!fileFldVal &&
                            this.userService.appData.userData.companyCustomerDetails.all
                        ) {
                            let val =
                                this.userService.appData.userData.companyCustomerDetails.all.find(
                                    (custIdxRec) => custIdxRec.custId === fileFldVal
                                );
                            if (!val) {
                                val = {
                                    cartisName: fileFldVal,
                                    cartisCodeId: null,
                                    custId: fileFldVal,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    val
                                );
                            }
                            fc.patchValue({
                                effectiveValue: val
                            });
                        }
                        this.arrOption2 = this.userService.appData.userData
                            .companyCustomerDetails
                            ? this.addPriemerObject(
                                this.userService.appData.userData.companyCustomerDetails.all,
                                2
                            )
                            : [];
                    } else if (fld.fieldId === 6) {
                        this.userService.appData.userData.companyCustomerDetails.allFor6 =
                            JSON.parse(
                                JSON.stringify(
                                    this.userService.appData.userData.companyCustomerDetails.all
                                )
                            );

                        let foundMatch = false;
                        if (
                            !!fileFldVal &&
                            this.userService.appData.userData.companyCustomerDetails.all
                        ) {
                            const val =
                                this.userService.appData.userData.companyCustomerDetails.all.find(
                                    (custIdxRec) => custIdxRec.custId === fileFldVal
                                );
                            if (val) {
                                foundMatch = true;
                                fc.patchValue(
                                    {
                                        effectiveValue: val
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }
                        this.sortAllFor6();
                        if (this.fileFieldsForm.get('2').get('effectiveValue').value) {
                            this.ocrService
                                .oppositeCustHistory({
                                    companyId:
                                    this.userService.appData.userData.companySelect.companyId,
                                    sourceProgramId:
                                    this.userService.appData.userData.companySelect
                                        .sourceProgramId,
                                    custId: this.fileFieldsForm.get('2').get('effectiveValue')
                                        .value.custId,
                                    expense: this.fileFieldsForm.get('21')
                                        ? this.fileFieldsForm.get('21').get('effectiveValue').value
                                        : null
                                })
                                .subscribe((res) => {
                                    let oppositeCustHistory = res ? res['body'] : res;
                                    if (oppositeCustHistory && oppositeCustHistory.length) {
                                        oppositeCustHistory = oppositeCustHistory.map((it) => {
                                            const cartisName = it.custId
                                                ? it.custId +
                                                (it.custLastName ? ' - ' + it.custLastName : '')
                                                : it.custLastName
                                                    ? it.custLastName
                                                    : '';
                                            return {
                                                cartisName: cartisName,
                                                custId: it.custId,
                                                lName: it.custLastName,
                                                hp: null,
                                                id: null,
                                                hashCartisCodeId: 1,
                                                isHistory: true
                                            };
                                        });
                                        oppositeCustHistory[
                                        oppositeCustHistory.length - 1
                                            ].isLastHistory = true;

                                        this.userService.appData.userData.companyCustomerDetails.allFor6 =
                                            oppositeCustHistory.concat(
                                                this.userService.appData.userData.companyCustomerDetails.all.filter(
                                                    (it) =>
                                                        !oppositeCustHistory.some(
                                                            (histIt) => histIt.custId === it.custId
                                                        )
                                                )
                                            );
                                    } else {
                                        this.userService.appData.userData.companyCustomerDetails.allFor6 =
                                            JSON.parse(
                                                JSON.stringify(
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                )
                                            );
                                    }
                                    if (!foundMatch) {
                                        if (
                                            !!fileFldVal &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .allFor6
                                        ) {
                                            let val =
                                                this.userService.appData.userData.companyCustomerDetails.allFor6.find(
                                                    (custIdxRec) => custIdxRec.custId === fileFldVal
                                                );
                                            if (val) {
                                                fc.patchValue(
                                                    {
                                                        effectiveValue: val
                                                    },
                                                    {emitEvent: false, onlySelf: true}
                                                );
                                            } else {
                                                val = {
                                                    cartisName: fileFldVal,
                                                    cartisCodeId: null,
                                                    custId: fileFldVal,
                                                    lName: null,
                                                    hp: null,
                                                    id: null,
                                                    hashCartisCodeId: 1,
                                                    pettyCash: false,
                                                    supplierTaxDeduction: null,
                                                    customerTaxDeduction: null
                                                };
                                                this.userService.appData.userData.companyCustomerDetails.allFor6.push(
                                                    val
                                                );
                                                fc.patchValue(
                                                    {
                                                        effectiveValue: val
                                                    },
                                                    {emitEvent: false, onlySelf: true}
                                                );
                                            }
                                        }
                                    }
                                    this.sortAllFor6();
                                });
                        } else {
                            if (!foundMatch) {
                                if (
                                    !!fileFldVal &&
                                    this.userService.appData.userData.companyCustomerDetails
                                        .allFor6
                                ) {
                                    const val = {
                                        cartisName: fileFldVal,
                                        cartisCodeId: null,
                                        custId: fileFldVal,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        hashCartisCodeId: 1,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.allFor6.push(
                                        val
                                    );
                                    fc.patchValue(
                                        {
                                            effectiveValue: val
                                        },
                                        {emitEvent: false, onlySelf: true}
                                    );
                                }
                            }
                            this.sortAllFor6();
                        }
                    } else if (fld.fieldId === 5) {
                        if (
                            fileFldVal &&
                            this.userService.appData.userData.companySelect.esderMaam !==
                            'NONE'
                        ) {
                            fc.patchValue({
                                effectiveValue: this.userService.appData
                                    .moment(fileFldVal)
                                    .valueOf()
                            });
                        } else {
                            fc.patchValue({
                                effectiveValue: null
                            });
                        }
                    } else if (fld.fieldId === 30) {
                        if (fileFldVal !== null) {
                            let val =
                                this.userService.appData.userData.companyCustomerDetails.all.find(
                                    (custIdxRec) => custIdxRec.custId === fileFldVal
                                );
                            if (val) {
                                if (val.cartisCodeId !== 1700 && val.cartisCodeId !== 1800) {
                                    this.cupaAllTheOptions = true;
                                }
                                fc.patchValue(
                                    {
                                        effectiveValue: val
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            } else {
                                this.cupaAllTheOptions = true;
                                val = {
                                    cartisName: fileFldVal,
                                    cartisCodeId: null,
                                    custId: fileFldVal,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    val
                                );
                                fc.patchValue(
                                    {
                                        effectiveValue: val
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }

                        this.rebuildArrData(fld.fieldId);
                    } else if (fld.fieldId === 40) {
                        const arr40 =
                            this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                                ? this.companyCustomerDetailsData.transTypeDefinedExpense40.filter(
                                    (item) =>
                                        item.maamPrc !== 'OPEN' ||
                                        this.field9ValuesAllowedWithOpenMaamPrc.includes(
                                            this.fileFieldsForm.get('9').get('effectiveValue').value
                                        )
                                )
                                : this.companyCustomerDetailsData.transTypeDefinedIncome40.filter(
                                    (item) => item.maamPrc !== 'OPEN'
                                );
                        if (
                            isDD &&
                            fld.required &&
                            fc.get('effectiveValue').value &&
                            fc.get('valueTypeOv').value !== 'פקודה מפוצלת' &&
                            !arr40.some((ite) => ite.value === fc.get('effectiveValue').value)
                        ) {
                            fc.patchValue(
                                {
                                    effectiveValue: null
                                },
                                {emitEvent: false, onlySelf: true}
                            );
                        }
                        this.arrOption40 =
                            this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                                ? this.addPriemerObject_40_41(
                                    this.companyCustomerDetailsData.transTypeDefinedExpense40,
                                    40
                                ).filter(
                                    (item) =>
                                        item.maamPrc !== 'OPEN' ||
                                        this.field9ValuesAllowedWithOpenMaamPrc.includes(
                                            this.fileFieldsForm.get('9').get('effectiveValue').value
                                        )
                                )
                                : this.addPriemerObject_40_41(
                                    this.companyCustomerDetailsData.transTypeDefinedIncome40,
                                    40
                                ).filter((item) => item.maamPrc !== 'OPEN');
                    } else if (fld.fieldId === 41) {
                        const arr41 =
                            this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                                ? this.companyCustomerDetailsData.transTypeDefinedExpense41
                                : this.companyCustomerDetailsData.transTypeDefinedIncome41;
                        if (
                            isDD &&
                            fld.required &&
                            fc.get('effectiveValue').value &&
                            fc.get('valueTypeOv').value !== 'פקודה מפוצלת' &&
                            !arr41.some((ite) => ite.value === fc.get('effectiveValue').value)
                        ) {
                            fc.patchValue(
                                {
                                    effectiveValue: null
                                },
                                {emitEvent: false, onlySelf: true}
                            );
                        }
                        this.arrOption41 =
                            this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                                ? this.addPriemerObject_40_41(
                                    this.companyCustomerDetailsData.transTypeDefinedExpense41,
                                    41
                                )
                                : this.addPriemerObject_40_41(
                                    this.companyCustomerDetailsData.transTypeDefinedIncome41,
                                    41
                                );
                    }
                    if (isDD && fld.required && fc.get('effectiveValue').value) {
                        if (fld.fieldId === 4) {
                            const arr4 = isExpense
                                ? val9 === 'חשבונית מס' ||
                                val9 === 'חשבונית מס קבלה' ||
                                val9 === 'חשבונית זיכוי' ||
                                val9 === 'אחר'
                                    ? this.vatOptionsAll
                                    : this.vatOptions
                                : !isExpense
                                    ? this.vatOptionsIncome
                                    : this.vatOptions;
                            if (
                                !arr4.some(
                                    (ite) => ite.value === fc.get('effectiveValue').value
                                )
                            ) {
                                fc.patchValue(
                                    {
                                        effectiveValue: null
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }
                        if (fld.fieldId === 5) {
                            const arr5 = this.companyCustomerDetailsData.vatReportOptions;
                            if (
                                !arr5.some(
                                    (ite) => ite.value === fc.get('effectiveValue').value
                                )
                            ) {
                                fc.patchValue(
                                    {
                                        effectiveValue: null
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }
                        if (fld.fieldId === 9) {
                            const arr9 = isExpense
                                ? this.docTypeOptions
                                : this.docTypeOptionsIncome;
                            if (
                                !arr9.some(
                                    (ite) => ite.value === fc.get('effectiveValue').value
                                )
                            ) {
                                fc.patchValue(
                                    {
                                        effectiveValue: null
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }
                        if (fld.fieldId === 22) {
                            const arr22 = this.userService.appData.userData.maamCustids;
                            if (
                                !arr22.some(
                                    (ite) => ite.value === fc.get('effectiveValue').value
                                )
                            ) {
                                fc.patchValue(
                                    {
                                        effectiveValue: null
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }
                        // if (fld.fieldId === 12) {
                        //     const arr12 = (this.fileDetailsSave.documentLogicType && (this.fileDetailsSave.documentLogicType === 'revaluation_expense_type' || this.fileDetailsSave.documentLogicType === 'revaluation_income_type' || this.fileDetailsSave.documentLogicType === 'matah_expense_type' || this.fileDetailsSave.documentLogicType === 'matah_income_type')) ? this.arrCurrenciesWithoutILS : this.arrCurrencies;
                        //     if (!arr12.some(ite => ite.value === fc.get('effectiveValue').value)) {
                        //         fc.patchValue({
                        //             effectiveValue: null
                        //         }, {emitEvent: false, onlySelf: true});
                        //     }
                        // }
                        if (fld.fieldId === 21) {
                            const arr21 = this.invoiceTypeOptions;
                            if (
                                !arr21.some(
                                    (ite) => ite.value === fc.get('effectiveValue').value
                                )
                            ) {
                                fc.patchValue(
                                    {
                                        effectiveValue: null
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }
                    }

                    const invoice =
                        cat.category.includes('נתוני קבלה') && !this.invoicePayment.value;
                    fld.hide = !!(
                        this.showEmptyFields.value &&
                        ((fc.get('effectiveValue').value !== '' &&
                                fc.get('effectiveValue').value !== null &&
                                fc.get('effectiveValue').value !== undefined &&
                                !fld.fileFldInfo) ||
                            invoice ||
                            fc.disabled ||
                            fc.get('valueTypeOv').value === true)
                    );
                    this.onChanges(fc, fld, fileDetails);
                } catch (e) {
                    console.log(e);
                }
            }
            cat.hide = cat.fields.every((field) => field.hide);
        }
        this.showAlertHideAllFields = this.fileDetailsSave.fieldsHierarchy.every(
            (field) => field.hide
        );

        this.getSizeAllImgs();
        this.fileProgress = false;

        setTimeout(() => {
            if (
                this.fileFieldsForm.get('2') &&
                this.fileFieldsForm.get('2').get('effectiveValue').value &&
                this.fileFieldsForm.get('28') &&
                !this.fileFieldsForm.get('28').get('effectiveValue').value
            ) {
                this.focusFl28();
            }
            if (this.fileDetailsSave && this.fileDetailsSave.approveActive) {
                this.getJournalTransForFile();
            } else {
                this.show_approveActiveCopy = false;
            }
            if (scrollToBotoom) {
                requestAnimationFrame(() =>
                    this.scrollContainer['nativeElement'].scrollTo({
                        block: 'end',
                        inline: 'nearest',
                        behavior: 'smooth',
                        left: 0,
                        top: this.scrollContainer['nativeElement'].scrollHeight
                    })
                );
            }
        }, 500);
    }

    hideDocumentListStorageData(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentListStorageDataFired = false;
        this.sidebarImgs = [];
        this.sidebarImgsDescList = false;
        console.log('hideDocumentStorageData');
    }

    getJournalTransForFile(): void {
        this.showDocumentListStorageDataFile = this._fileScanView;
        this.sidebarImgsDescList = false;
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1 &&
            !this.revaluationCurrCode;
        this.isMatah = is_matah;
        this.currencySign = !this.revaluationCurrCode
            ? this.currencyList.find(
                (ite) =>
                    ite.id === this.fileFieldsForm.get('12').get('effectiveValue').value
            )
                ? this.currencyList.find(
                    (ite) =>
                        ite.id ===
                        this.fileFieldsForm.get('12').get('effectiveValue').value
                ).sign
                : null
            : this.revaluationCurrCodeSign;

        this.sharedService
            .getInvoiceJournal({
                fileId: this._fileScanView.fileId,
                companyId: this.userService.appData.userData.companySelect.companyId,
                sourceProgramId:
                this.userService.appData.userData.companySelect.sourceProgramId,
                dbName: this.userService.appData.userData.companySelect.dbName
            })
            .subscribe(
                (response: any) => {
                    const vatOptions = [
                        {
                            label: 'ללא מע"מ',
                            value: 'NONE'
                        },
                        {
                            label: 'מע"מ מלא רכוש קבוע',
                            value: 'FULL_PROPERTY'
                        },
                        {
                            label: 'מע"מ מלא יבוא',
                            value: 'FULL_IMPORT'
                        },
                        {
                            label: 'מע"מ ⅔',
                            value: 'TWO_THIRD'
                        },
                        {
                            label: 'מע"מ ¼',
                            value: 'QUARTER'
                        },
                        {
                            label: 'מע"מ מלא',
                            value: 'FULL'
                        },
                        {
                            label: 'מע"מ פתוח',
                            value: 'OPEN'
                        }
                    ];
                    const sidebarImgsDescList = response ? response['body'] : response;
                    if (sidebarImgsDescList.invoices) {
                        sidebarImgsDescList.invoices.forEach((item) => {
                            item.isChanged =
                                item.isChangedArr &&
                                item.isChangedArr.length &&
                                item.isChangedArr.some((it) => it.tempChanged);

                            const tooltipText = item.isChanged
                                ? item.isChangedArr
                                    .filter((it) => it.tempChanged)
                                    .map((ite) => {
                                        return ite.fieldId === 2
                                            ? 'כרטיס'
                                            : ite.fieldId === 6
                                                ? 'כרטיס נגדי'
                                                : ite.fieldId === 13
                                                    ? 'תאריך'
                                                    : ite.fieldId === 17
                                                        ? 'סכום'
                                                        : '';
                                    })
                                : '';
                            item.tooltipText = false;
                            if (item.isChanged) {
                                if (tooltipText.length === 1) {
                                    item.tooltipText = 'ה' + tooltipText[0] + ' שונה בחשבשבת';
                                } else if (tooltipText.length === 2) {
                                    item.tooltipText =
                                        tooltipText[0] + ' ו' + tooltipText[1] + ' שונו בחשבשבת';
                                } else {
                                    let text = '';
                                    tooltipText.forEach((it, idx) => {
                                        if (idx + 1 === tooltipText.length) {
                                            text += 'ו' + it + ' שונו בחשבשבת';
                                        } else {
                                            text += it + ' ,';
                                        }
                                    });
                                }
                            }
                            item.maamPrc = vatOptions.find((it) => it.value === item.maamPrc);
                            let oppositeCust =
                                item.oppositeCust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === item.oppositeCust
                                    )
                                    : null;
                            if (
                                !oppositeCust &&
                                item.oppositeCust &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                oppositeCust = {
                                    cartisName: item.oppositeCust,
                                    cartisCodeId: null,
                                    custId: item.oppositeCust,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    oppositeCust
                                );
                            }
                            item.oppositeCust = oppositeCust;

                            // if (item.oppositeCust) {
                            //     item.oppositeCust = {
                            //         custId: item.oppositeCust.custId,
                            //         lName: item.oppositeCust.custLastName,
                            //         hp: item.oppositeCust.oseknums && item.oppositeCust.oseknums.length ? item.oppositeCust.oseknums[0] : null,
                            //         id: item.oppositeCust.palCode
                            //     };
                            // } else {
                            //     item.oppositeCust = null;
                            // }
                            let cartisMaam =
                                item.cartisMaam &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === item.cartisMaam
                                    )
                                    : null;
                            if (
                                !cartisMaam &&
                                item.cartisMaam &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                cartisMaam = {
                                    cartisName: item.cartisMaam,
                                    cartisCodeId: null,
                                    custId: item.cartisMaam,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                                this.userService.appData.userData.companyCustomerDetails.all.push(
                                    cartisMaam
                                );
                            }
                            item.cartisMaam = cartisMaam;
                            // if (item.cartisMaam) {
                            //     item.cartisMaam = {
                            //         custId: item.cartisMaam.custId,
                            //         lName: item.cartisMaam.custLastName,
                            //         hp: item.cartisMaam.oseknums && item.cartisMaam.oseknums.length ? item.cartisMaam.oseknums[0] : null,
                            //         id: item.cartisMaam.palCode
                            //     };
                            // } else {
                            //     item.cartisMaam = null;
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
                            item.custId = custId;
                            // if (item.custId) {
                            //     item.custId = {
                            //         custId: item.custId.custId,
                            //         lName: item.custId.custLastName,
                            //         hp: item.custId.oseknums && item.custId.oseknums.length ? item.custId.oseknums[0] : null,
                            //         id: item.custId.palCode
                            //     };
                            // } else {
                            //     item.custId = null;
                            // }
                        });
                    }
                    if (sidebarImgsDescList.payments) {
                        sidebarImgsDescList.payments.forEach((item) => {
                            item.maamPrc = vatOptions.find((it) => it.value === item.maamPrc);

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
                            // if (item.paymentCustId) {
                            //     item.paymentCustId = {
                            //         custId: item.paymentCustId.custId,
                            //         lName: item.paymentCustId.custLastName,
                            //         hp: item.paymentCustId.oseknums && item.paymentCustId.oseknums.length ? item.paymentCustId.oseknums[0] : null,
                            //         id: item.paymentCustId.palCode
                            //     };
                            // } else {
                            //     item.paymentCustId = null;
                            // }
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
                            // if (item.custId) {
                            //     item.custId = {
                            //         custId: item.custId.custId,
                            //         lName: item.custId.custLastName,
                            //         hp: item.custId.oseknums && item.custId.oseknums.length ? item.custId.oseknums[0] : null,
                            //         id: item.custId.palCode
                            //     };
                            // } else {
                            //     item.custId = null;
                            // }
                        });
                    }
                    this.sidebarImgsDescList = sidebarImgsDescList;
                    // document.body.classList.add('dragBodyOver');
                    // document.body.addEventListener('dragover', this.dragover_body, false);
                    // document.body.addEventListener('drop', this.drop_body, false);
                    if (sidebarImgsDescList.invoices || sidebarImgsDescList.payments) {
                        this.show_approveActiveCopy = true;
                        setTimeout(() => {
                            const dragme_exist = (<any>$('.containerPage')).children('#dragme').length;
                            if (!dragme_exist) {
                                // document.body.appendChild(
                                //     document.getElementsByClassName('dragme')[0]
                                // );
                                document.getElementsByClassName('containerPage')[0].appendChild(document.getElementsByClassName('dragme')[0]);
                                document.getElementsByClassName('dragme')[0]['style'].display =
                                    'block';
                                // (<any>$('#dragme')).draggable({
                                //     containment: 'body'
                                // });
                            }
                        }, 0);
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

    public dragging(event: any) {
        // console.log('dragging', event, event.dataTransfer)
        const dm = document.getElementsByClassName('dragme');
        dm[0]['style'].left = event.clientX + 'px';
        dm[0]['style'].top = event.clientY + 'px';
        event.preventDefault();
        return false;
    }

    public drag_start(event: any) {
        const style = window.getComputedStyle(event.target, null);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData(
            'text/plain',
            parseInt(style.getPropertyValue('left'), 10) -
            event.clientX +
            ',' +
            (parseInt(style.getPropertyValue('top'), 10) - event.clientY) +
            ',' +
            event.target.getAttribute('data-item')
        );
    }

    public handleDragEnter(e: any) {
        const dm = document.getElementsByClassName('dragme');
        dm[0].classList.add('over');
    }

    public handleDragEnd(e: any) {
        const dm = document.getElementsByClassName('dragme');
        dm[0].classList.remove('over');
    }

    removeEventListener_draganddrop() {
        // document.body.removeEventListener('dragover', this.dragover_body, false);
        // document.body.removeEventListener('drop', this.drop_body, false);

        if (document.getElementsByClassName('dragme').length) {
            document.getElementsByClassName('dragme')[0].remove();
        }
    }

    dragover_body(event: any) {
        // event = event || window.event;
        // var dragX = event.pageX, dragY = event.pageY;
        // console.log('X: ' + dragX + ' Y: ' + dragY);
        // const dm = document.getElementsByClassName('dragme');
        // // dm[parseInt(offset[2], 10)]['style'].left = (event.clientX + parseInt(offset[0], 10)) + 'px';
        // dm[0]['style'].top = (dragY) + 'px';
        // dm[0]['style'].left = (dragX) + 'px';
        event.preventDefault();
        return false;
    }

    drop_body(event: any) {
        const offset = event.dataTransfer.getData('text/plain').split(',');
        const dm = document.getElementsByClassName('dragme');
        dm[parseInt(offset[2], 10)]['style'].left =
            event.clientX + parseInt(offset[0], 10) + 'px';
        dm[parseInt(offset[2], 10)]['style'].top =
            event.clientY + parseInt(offset[1], 10) + 'px';
        event.preventDefault();
        return false;
    }

    onChanges(fc: any, fld: any, fileDetails: any): void {
        const controls = fc['controls'];
        const fldValChangeSub = controls.effectiveValue.valueChanges
            .pipe(
                tap(() => {
                    // this.focusInput[fld.fieldId] = true;
                    console.log('00000000000------');
                }),
                startWith(controls.effectiveValue.value),
                debounceTime(300),
                distinctUntilChanged((val1, val2) => {
                    console.log('111111111111-----', val1, val2);
                    let isTheSameValues = false;
                    if (
                        ((val1 === null || val1 === '') &&
                            (val2 === null || val2 === '')) ||
                        (!!val1 && val1 instanceof Date && !!val2 && val2 instanceof Date
                            ? val1.getTime() === val2.getTime()
                            : !(
                            fld.fieldId === 6 ||
                            fld.fieldId === 2 ||
                            fld.fieldId === 30 ||
                            fld.fieldId === 40 ||
                            fld.fieldId === 41
                        ) && String(val1) === String(val2))
                    ) {
                        isTheSameValues = true;
                    }
                    if (fld.fieldId === 6 || fld.fieldId === 2 || fld.fieldId === 30) {
                        if (
                            val1 !== null &&
                            val2 !== null &&
                            typeof val1 === 'object' &&
                            typeof val2 === 'object' &&
                            val1['custId'] === val2['custId']
                        ) {
                            isTheSameValues = true;
                        }
                    }
                    if (fld.fieldId === 40 || fld.fieldId === 41) {
                        if (val1 !== null && val2 !== null && val1 === val2) {
                            isTheSameValues = true;
                        }
                    }
                    if (fld.fieldId === 21) {
                        if (val1 !== null && val2 !== null && val1 === val2) {
                            isTheSameValues = true;
                        }
                    }
                    if (
                        fld.fieldPage !== controls.fieldPage.value ||
                        fld.fieldPosition !== controls.fieldPosition.value
                    ) {
                        isTheSameValues = false;
                    }
                    let openPopUpChangeDD = false;
                    if (
                        fld.fieldId === 6 ||
                        fld.fieldId === 2 ||
                        fld.fieldId === 30 ||
                        fld.fieldId === 40 ||
                        fld.fieldId === 41 ||
                        fld.fieldId === 21
                    ) {
                        if (
                            fld.approveUserValue !== null &&
                            fld.approveUserValue !==
                            (typeof val2 === 'object' && !!val2 ? val2['custId'] : val2)
                        ) {
                            if (
                                ((fld.fieldId === 6 ||
                                        fld.fieldId === 2 ||
                                        fld.fieldId === 30) &&
                                    val2 &&
                                    val2['custId'] !== null) ||
                                ((fld.fieldId === 40 ||
                                        fld.fieldId === 41 ||
                                        fld.fieldId === 21) &&
                                    val2 !== null)
                            ) {
                                openPopUpChangeDD = true;
                                isTheSameValues = false;
                            }
                        }
                    }
                    if (
                        !isTheSameValues &&
                        (fld.fieldId === 6 ||
                            fld.fieldId === 2 ||
                            fld.fieldId === 30 ||
                            fld.fieldId === 40 ||
                            fld.fieldId === 41 ||
                            (fld.fieldId === 21 &&
                                !(Number(val2) === 0 && this.expenseOnly))) &&
                        (!this.modalEditCardsBeforeSend ||
                            (this.modalEditCardsBeforeSend &&
                                !this.modalEditCardsBeforeSend.fired)) &&
                        !this.rollingBack
                    ) {
                        if (!this.modalEditCardsBeforeSend && openPopUpChangeDD) {
                            let approveUserValue = fld.approveUserValue;
                            if (
                                fld.fieldId === 6 ||
                                fld.fieldId === 2 ||
                                fld.fieldId === 30
                            ) {
                                const cartisName =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === fld.approveUserValue
                                    );
                                if (cartisName) {
                                    approveUserValue = cartisName.cartisName;
                                }
                            }
                            let dataText = val2;
                            let newValText = val2;
                            try {
                                if (fld.fieldId === 40) {
                                    if (
                                        this.fileFieldsForm.get('21').get('effectiveValue')
                                            .value === 1
                                    ) {
                                        const dataLabel =
                                            this.companyCustomerDetailsData.transTypeDefinedExpense40.find(
                                                (it) => it.value === val2
                                            );
                                        if (dataLabel) {
                                            dataText = dataLabel.onlyName
                                                ? dataLabel.label
                                                : dataLabel.label + ' ' + dataLabel.value;
                                            if (dataLabel.onlyName) {
                                                newValText = dataLabel.label;
                                            }
                                        }
                                    } else {
                                        const dataLabel =
                                            this.companyCustomerDetailsData.transTypeDefinedIncome40.find(
                                                (it) => it.value === val2
                                            );
                                        if (dataLabel) {
                                            dataText = dataLabel.onlyName
                                                ? dataLabel.label
                                                : dataLabel.label + ' ' + dataLabel.value;
                                            if (dataLabel.onlyName) {
                                                newValText = dataLabel.label;
                                            }
                                        }
                                    }
                                }
                                if (fld.fieldId === 41) {
                                    if (
                                        this.fileFieldsForm.get('21').get('effectiveValue')
                                            .value === 1
                                    ) {
                                        const dataLabel =
                                            this.companyCustomerDetailsData.transTypeDefinedExpense41.find(
                                                (it) => it.value === val2
                                            );
                                        if (dataLabel) {
                                            dataText = dataLabel.onlyName
                                                ? dataLabel.label
                                                : dataLabel.label + ' ' + dataLabel.value;
                                            if (dataLabel.onlyName) {
                                                newValText = dataLabel.label;
                                            }
                                        }
                                    } else {
                                        const dataLabel =
                                            this.companyCustomerDetailsData.transTypeDefinedIncome41.find(
                                                (it) => it.value === val2
                                            );
                                        if (dataLabel) {
                                            dataText = dataLabel.onlyName
                                                ? dataLabel.label
                                                : dataLabel.label + ' ' + dataLabel.value;
                                            if (dataLabel.onlyName) {
                                                newValText = dataLabel.label;
                                            }
                                        }
                                    }
                                }
                                if (fld.fieldId === 40 || fld.fieldId === 41) {
                                    const newDataLabel = this.transTypeCodeArr.find(
                                        (it) => it.value === approveUserValue
                                    );
                                    if (newDataLabel) {
                                        approveUserValue = newDataLabel.label;
                                    }
                                }
                            } catch (e) {
                                console.log(e);
                            }

                            this.modalEditCardsBeforeSend = {
                                type: fld.fieldId,
                                newVal: val2,
                                newValText: newValText,
                                originVal: val1,
                                dataText: dataText,
                                approveUserValue: approveUserValue,
                                real_approveUserValue: fld.approveUserValue,
                                fired: false,
                                setFieldValueForFuture: 1,
                                hp: this.fileFieldsForm.get('3').value.effectiveValue
                            };
                            this.fileFieldsForm
                                .get(fld.fieldId.toString())
                                .get('effectiveValue')
                                .patchValue(val1, {
                                    emitEvent: false,
                                    onlySelf: true
                                });
                            this.fileFieldsForm
                                .get(fld.fieldId.toString())
                                .get('effectiveValue')
                                .updateValueAndValidity({
                                    emitEvent: false,
                                    onlySelf: true
                                });
                            isTheSameValues = true;
                        }
                    }

                    // if (!isTheSameValues && (fld.fieldId === 6 || fld.fieldId === 2)
                    //     && (!this.modalEditCardsBeforeSend || (this.modalEditCardsBeforeSend && !this.modalEditCardsBeforeSend.fired))
                    //     && !this.rollingBack) {
                    //     if (!this.modalEditCardsBeforeSend) {
                    //         if (!this.companyIdentificationName && !this.fileFieldsForm.get('3').value.effectiveValue) {
                    //             // if ((fld.fieldId === 6 && (!this.fileFieldsForm.get('2') || (this.fileFieldsForm.get('2') && !this.fileFieldsForm.get('2').get('effectiveValue').value)))
                    //             //     || (fld.fieldId === 2 && !this.fileFieldsForm.get('3').value.effectiveValue && !this.companyIdentificationId)) {
                    //
                    //         } else {
                    //             this.modalEditCardsBeforeSend = {
                    //                 type: fld.fieldId,
                    //                 newVal: val2,
                    //                 originVal: val1,
                    //                 fired: false,
                    //                 setFieldValueForFuture: false,
                    //                 hp: this.fileFieldsForm.get('3').value.effectiveValue
                    //             };
                    //             this.fileFieldsForm.get(fld.fieldId.toString()).get('effectiveValue').patchValue(val1, {
                    //                 emitEvent: false,
                    //                 onlySelf: true
                    //             });
                    //             this.fileFieldsForm.get(fld.fieldId.toString()).get('effectiveValue').updateValueAndValidity({
                    //                 emitEvent: false,
                    //                 onlySelf: true
                    //             });
                    //         }
                    //     }
                    //     if (fld.fieldId === 6) {
                    //         isTheSameValues = !(!this.companyIdentificationName && !this.fileFieldsForm.get('3').value.effectiveValue);
                    //     }
                    //     if (fld.fieldId === 2) {
                    //         isTheSameValues = !(!this.companyIdentificationName && !this.fileFieldsForm.get('3').value.effectiveValue);
                    //     }
                    // }

                    if (fld.fieldId === 25) {
                        const rateInput = val2.toString().replace(/[^0-9.]/g, '');
                        if (rateInput && rateInput.includes('.')) {
                            const splitNumbers = rateInput.split('.');
                            if (splitNumbers[1].length > 4) {
                                this.fileFieldsForm.get(fld.fieldId.toString()).patchValue(
                                    {
                                        effectiveValue: this.roundFourDigits(Number(val2))
                                    },
                                    {emitEvent: false, onlySelf: true}
                                );
                            }
                        }
                    }
                    if (
                        this.fileDetailsSave.matahSums &&
                        (fld.fieldId === 24 ||
                            fld.fieldId === 17 ||
                            fld.fieldId === 29 ||
                            fld.fieldId === 18) &&
                        String(val2) === '0'
                    ) {
                        // console.log('panch!', fld.fieldId, val2);
                        this.fileFieldsForm.get(fld.fieldId.toString()).patchValue(
                            {
                                effectiveValue: null
                            },
                            {emitEvent: false, onlySelf: true}
                        );
                    }
                    if (fld.fieldId === 33) {
                        if (val1 !== val2) {
                            this.isChanged33 = true;
                        } else {
                            this.isChanged33 = false;
                        }
                        isTheSameValues = false;
                    }
                    if (
                        fld.fieldId === 21 &&
                        Number(val2) === 0 &&
                        this.expenseOnly &&
                        this.modalExpenseOnly
                    ) {
                        isTheSameValues = false;
                    }
                    if (
                        fld.fieldId === 21 &&
                        Number(val2) === 0 &&
                        this.expenseOnly &&
                        !this.modalExpenseOnly
                    ) {
                        this.modalExpenseOnly = {
                            always: true
                        };
                        this.fileFieldsForm
                            .get(fld.fieldId.toString())
                            .get('effectiveValue')
                            .patchValue(val1, {
                                emitEvent: false,
                                onlySelf: true
                            });
                        this.fileFieldsForm
                            .get(fld.fieldId.toString())
                            .get('effectiveValue')
                            .updateValueAndValidity({
                                emitEvent: false,
                                onlySelf: true
                            });
                        isTheSameValues = true;
                    }
                    // if(isTheSameValues){
                    //     controls.fieldPage.valueChanges
                    //         .pipe(
                    //             startWith(controls.fieldPage.value),
                    //             distinctUntilChanged()
                    //         )
                    //                 .subscribe(selectedValue => {
                    //                     debugger
                    //                 })
                    //     controls.fieldPosition.valueChanges
                    //         .pipe(
                    //             startWith(controls.fieldPosition.value),
                    //             distinctUntilChanged((valPo1, valPo2) => {
                    //                 return Array.isArray(valPo1) === Array.isArray(valPo2) && (!Array.isArray(valPo1) || (valPo1.length === valPo2.length && valPo1.every((item, i) => this.objectsEqual(item, valPo2[i]))));
                    //             })
                    //         )
                    //                 .subscribe(selectedValue => {
                    //           debugger
                    //                 })
                    // }

                    return isTheSameValues;
                }),
                pairwise(),
                filter(() => {
                    if (this.rollingBack) {
                        this.rollingBack = false;
                        return false;
                    }
                    const isFocused = this.focusInput[fld.fieldId];
                    if (isFocused === false && fld.fieldId !== 33) {
                        return false;
                    }
                    if (fld.fieldId === 33 && isFocused) {
                        return false;
                    }
                    return true;
                }),
                switchMap(([oldValue, value]) => {
                    if (
                        fld.fieldId === 6 ||
                        fld.fieldId === 2 ||
                        fld.fieldId === 30 ||
                        fld.fieldId === 40 ||
                        fld.fieldId === 41 ||
                        fld.fieldId === 21
                    ) {
                        this.saveOldValue = oldValue;
                        if (fld.fieldId === 40) {
                            this.arrOption40 =
                                this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                                    ? this.addPriemerObject_40_41(
                                        this.companyCustomerDetailsData.transTypeDefinedExpense40,
                                        40
                                    )
                                    : this.addPriemerObject_40_41(
                                        this.companyCustomerDetailsData.transTypeDefinedIncome40,
                                        40
                                    );
                        } else if (fld.fieldId === 41) {
                            this.arrOption41 =
                                this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                                    ? this.addPriemerObject_40_41(
                                        this.companyCustomerDetailsData.transTypeDefinedExpense41,
                                        41
                                    )
                                    : this.addPriemerObject_40_41(
                                        this.companyCustomerDetailsData.transTypeDefinedIncome41,
                                        41
                                    );
                        } else if (fld.fieldId === 30) {
                            this.rebuildArrData(fld.fieldId);
                        } else if (fld.fieldId === 2) {
                            this.arrOption2 = this.userService.appData.userData
                                .companyCustomerDetails
                                ? this.addPriemerObject(
                                    this.userService.appData.userData.companyCustomerDetails
                                        .all,
                                    2
                                )
                                : [];
                        } else if (fld.fieldId === 6) {
                            this.arrOption6 = this.userService.appData.userData
                                .companyCustomerDetails
                                ? this.fileFieldsForm.get('21').get('effectiveValue').value ===
                                0
                                    ? this.addPriemerObject(
                                        this.userService.appData.userData.companyCustomerDetails
                                            .allFor6Income,
                                        6
                                    )
                                    : this.addPriemerObject(
                                        this.userService.appData.userData.companyCustomerDetails
                                            .allFor6Expense,
                                        6
                                    )
                                : [];
                        }
                    }
                    let defaultValue: any = false;
                    if (
                        this.modalEditCardsBeforeSend &&
                        this.modalEditCardsBeforeSend.fired
                    ) {
                        if (this.modalEditCardsBeforeSend.setFieldValueForFuture) {
                            defaultValue = {
                                val: this.companyIdentificationName
                                    ? 'company_identification'
                                    : this.fileFieldsForm.get('3').value.effectiveValue,
                                popupType: this.modalEditCardsBeforeSend.setFieldValueForFuture
                            };
                        }
                        this.modalEditCardsBeforeSend = false;
                    }
                    if (this.activeWord) {
                        // console.log(value.effectiveValue);
                        this.inlineEditorForm.patchValue({
                            fieldValue: value
                        });
                    }
                    let defaultValue21: any = false;
                    if (
                        fld.fieldId === 21 &&
                        Number(value) === 0 &&
                        this.expenseOnly &&
                        this.modalExpenseOnly &&
                        !this.modalExpenseOnly.always
                    ) {
                        defaultValue21 = {
                            popupType: 1
                        };
                    }
                    if (
                        fld.fieldId === 21 &&
                        Number(value) === 0 &&
                        this.expenseOnly &&
                        this.modalExpenseOnly
                    ) {
                        this.modalExpenseOnly = false;
                    }
                    const form = this.fileFieldsForm.get(String(fld.fieldId));
                    console.log('22222222-----');
                    const isDD = [21, 12, 22, 9, 6, 2, 5, 4, 40, 41].some(
                        (id) => id === Number(fld.fieldId)
                    );
                    const params = {
                        fileId: form.get('fileId').value,
                        fieldId: form.get('fieldId').value,
                        fileResultId: form.get('fileResultId').value,
                        fieldPage: form.get('fieldPage').value,
                        fieldPosition: isDD ? null : form.get('fieldPosition').value,
                        fieldValue:
                            typeof value === 'boolean'
                                ? value
                                    ? 1
                                    : 0
                                : value &&
                                typeof (value === 'object') &&
                                Object.keys(value).includes('custId')
                                    ? value.custId
                                    : Number(fld.fieldId) === 3 && this.editHp && value === ''
                                        ? 0
                                        : value,
                        locationNum: form.get('locationNo').value,
                        locationDesc: form.get('locationDesc').value,
                        fieldSearchkey: form.get('searchkey').value,
                        manualTyped: form.get('effectiveValue').dirty
                    };

                    if (defaultValue) {
                        params['defaultValue'] = defaultValue.val;
                        params['popupType'] = defaultValue.popupType;
                    }
                    if (defaultValue21) {
                        params['popupType'] = defaultValue21.popupType;
                    }
                    return of([
                        this.ocrService.setFieldValue(params),
                        Number(fld.fieldId)
                    ]);
                }),
                shareReplay(1)
            )
            .subscribe((valuesRes) => {
                const fieldIdChanged = valuesRes[1];
                valuesRes[0].subscribe(
                    (value) => {
                        const bodyRes = value ? value['body'] : value;
                        const statusRes = value ? value.status : value;
                        if (statusRes === 422) {
                            this.fileChange = true;
                            if (bodyRes.redoFor) {
                                this._fileScanView.fileId = bodyRes.redoFor;
                                this.setFile(this._fileScanView);
                            } else {
                                this.goToRow.emit({
                                    refresh: true,
                                    response: this._fileScanView.fileId
                                });
                            }
                            return;
                        }
                        this.sidebarImgsDescList = false;
                        // console.log('22222', value.body);
                        this.fileChange = true;
                        if (value && !value.error && value.body) {
                            if (value.body.matahSums !== null) {
                                this.fileDetailsSave.matahSums = value.body.matahSums;
                            }
                            if (value.body.jobExecutionId !== null) {
                                this.fileDetailsSave.jobExecutionId = value.body.jobExecutionId;
                            }
                            if (value.body.splitType !== null) {
                                this.fileDetailsSave.splitType = value.body.splitType;
                            }
                            if (value.body.userApproveFieldsType !== undefined) {
                                this.fileDetailsSave.userApproveFieldsType =
                                    value.body.userApproveFieldsType;
                            }
                            if (value.body.approvedBy !== undefined) {
                                this.fileDetailsSave.approvedBy = value.body.approvedBy;
                            }
                            if (value.body.documentLogicType !== null) {
                                this.fileDetailsSave.documentLogicType =
                                    value.body.documentLogicType;
                            }
                            if (value.body.companyIdentificationId) {
                                this.companyIdentificationId =
                                    value.body.companyIdentificationId;
                            }
                            if (value.body.companyIdentificationName) {
                                this.companyIdentificationName =
                                    value.body.companyIdentificationName;
                            }
                            if (value.body.redoHierarchy) {
                                if (value.body.companyIdentificationName) {
                                    fileDetails.companyIdentificationName =
                                        value.body.companyIdentificationName;
                                }
                                if (value.body.companyIdentificationName) {
                                    fileDetails.companyIdentificationId =
                                        value.body.companyIdentificationId;
                                }
                                if (value.body.showNegative !== undefined) {
                                    fileDetails.showNegative = value.body.showNegative;
                                }
                                fileDetails.approveActive = value.body.approveActive;
                                fileDetails.jobExecutionId = value.body.jobExecutionId;
                                fileDetails.fieldsHierarchy = value.body.fieldsHierarchy;
                                fileDetails.invoicePayment = value.body.invoicePayment;
                                fileDetails.showTaxDeduction = value.body.showTaxDeduction;
                                if (value.body.userApproveFieldsType !== undefined) {
                                    fileDetails.userApproveFieldsType =
                                        value.body.userApproveFieldsType;
                                }
                                if (value.body.approvedBy !== undefined) {
                                    fileDetails.approvedBy = value.body.approvedBy;
                                }
                                fileDetails.expenseOnly = !!value.body.expenseOnly;
                                fileDetails.splitType = value.body.splitType;
                                fileDetails.documentLogicType = value.body.documentLogicType;
                                this.revaluationCurrCodeSign = null;
                                this.fileDetailsSave = null;
                                setTimeout(() => {
                                    this.createNewForm(
                                        fileDetails,
                                        fieldIdChanged === 41 || fieldIdChanged === 33
                                    );
                                }, 0);
                            } else {
                                const is_approveActiveCopy_True =
                                    this.fileDetailsSave.approveActiveCopy === true;
                                this.fileDetailsSave.approveActive = value.body.approveActive;
                                this.fileDetailsSave.approveActiveCopy =
                                    this.fileDetailsSave.approveActive;

                                if (
                                    value.body.fieldsHierarchy &&
                                    value.body.fieldsHierarchy.length &&
                                    value.body.fieldsHierarchy[0].fields
                                ) {
                                    this.saveLastUpdateAfterBlur = null;
                                    const fieldsNew = value.body.fieldsHierarchy[0].fields;
                                    if (Array.isArray(fieldsNew) && fieldsNew.length) {
                                        const isExpenseEffective =
                                            this.fileFieldsForm.get('21').get('effectiveValue')
                                                .value === 1;
                                        fieldsNew.forEach((fe) => {
                                            const fieldId = fe.fieldId;
                                            this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                                const fl = cat.fields.find(
                                                    (it) => it.fieldId === fieldId
                                                );
                                                if (fl) {
                                                    fl.transTypeOv = fe.transTypeOv;
                                                    fl.approveUserValue = fe.approveUserValue;
                                                    fl.fieldValue = fe.fieldValue;
                                                }
                                            });
                                            if (fe.fieldId === 2) {
                                                this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                                    const fl = cat.fields.find((it) => it.fieldId === 2);
                                                    if (fl) {
                                                        fl.default = fe.default;
                                                        fl.defaultUpdatedDate = fe.defaultUpdatedDate;
                                                        fl.defaultUserName = fe.defaultUserName;
                                                        fl.fieldValue = fe.fieldValue;
                                                    }
                                                });
                                            }
                                            if (fe.fieldId === 6) {
                                                this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                                    const fl = cat.fields.find((it) => it.fieldId === 6);
                                                    if (fl) {
                                                        fl.default = fe.default;
                                                        fl.defaultUpdatedDate = fe.defaultUpdatedDate;
                                                        fl.defaultUserName = fe.defaultUserName;
                                                        fl.fieldValue = fe.fieldValue;
                                                    }
                                                });
                                            }
                                            if (fe.fieldId === 9) {
                                                this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                                    const fl = cat.fields.find((it) => it.fieldId === 9);
                                                    if (fl) {
                                                        fl.fieldValue = fe.fieldValue;
                                                    }
                                                });
                                            }
                                            if (fe.fieldId === 21) {
                                                this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                                    const fl = cat.fields.find((it) => it.fieldId === 21);
                                                    if (fl) {
                                                        fl.fieldValue = fe.fieldValue;
                                                    }
                                                });
                                            }
                                            if ('11' === String(fieldId)) {
                                                this.fieldNameAsmachta = fe.fieldName;

                                                if (fe.alertId === undefined || fe.alertId === null) {
                                                    this.showDoubleSuspect = false;
                                                }
                                            }
                                            if (fe.alertId !== undefined && fe.alertId !== null) {
                                                if (fe.fieldId === 11 && fe.alertId === 10) {
                                                    this.showDoubleSuspect = true;
                                                }
                                                const hasAlert = this.alerstIdsArr.find(
                                                    (it) => it.alertId === fe.alertId
                                                );
                                                if (hasAlert) {
                                                    for (const cat1 of this.fileDetailsSave
                                                        .fieldsHierarchy) {
                                                        for (const fld1 of cat1.fields) {
                                                            const fldKey1 = String(fld1.fieldId);
                                                            if (String(fieldId) === fldKey1) {
                                                                fld1.fileFldInfo = hasAlert.alertMessage
                                                                    ? {
                                                                        alertMessage: hasAlert.alertMessage,
                                                                        indBlockAprrove: hasAlert.indBlockAprrove
                                                                    }
                                                                    : null;
                                                                fld1.indBlockAprrove =
                                                                    hasAlert.indBlockAprrove === true;
                                                            }
                                                        }
                                                    }
                                                    if (this.fileFieldsForm.get(fieldId.toString())) {
                                                        this.fileFieldsForm
                                                            .get(fieldId.toString())
                                                            .patchValue(
                                                                {
                                                                    indBlockAprrove: hasAlert.indBlockAprrove
                                                                },
                                                                {emitEvent: false, onlySelf: true}
                                                            );
                                                    }
                                                } else {
                                                    for (const cat1 of this.fileDetailsSave
                                                        .fieldsHierarchy) {
                                                        for (const fld1 of cat1.fields) {
                                                            if (fieldId === fld1.fieldId) {
                                                                fld1.fileFldInfo = null;
                                                                fld1.indBlockAprrove = false;
                                                            }
                                                        }
                                                    }
                                                    if (this.fileFieldsForm.get(fe.fieldId.toString())) {
                                                        this.fileFieldsForm
                                                            .get(fe.fieldId.toString())
                                                            .patchValue(
                                                                {
                                                                    indBlockAprrove: false
                                                                },
                                                                {emitEvent: false, onlySelf: true}
                                                            );
                                                    }
                                                }
                                            } else {
                                                for (const cat1 of this.fileDetailsSave
                                                    .fieldsHierarchy) {
                                                    for (const fld1 of cat1.fields) {
                                                        if (fieldId === fld1.fieldId) {
                                                            fld1.fileFldInfo = null;
                                                            fld1.indBlockAprrove = false;
                                                        }
                                                    }
                                                }
                                                if (this.fileFieldsForm.get(fe.fieldId.toString())) {
                                                    this.fileFieldsForm
                                                        .get(fe.fieldId.toString())
                                                        .patchValue(
                                                            {
                                                                indBlockAprrove: false
                                                            },
                                                            {emitEvent: false, onlySelf: true}
                                                        );
                                                }
                                            }
                                            if (
                                                fieldId !== 28 &&
                                                fieldId === fld.fieldId &&
                                                !this.fieldsWithPredefinedEditData.has(fieldId + '')
                                            ) {
                                                // console.log('this.focusInput[' + fld.fieldId + ']', this.focusInput[fld.fieldId]);
                                                if (
                                                    fe.valueType === 'NUMBER' ||
                                                    fe.valueType === 'STRING'
                                                ) {
                                                    if (
                                                        fe !== undefined &&
                                                        !fe.valueTypeOv &&
                                                        fe === null
                                                    ) {
                                                        fe.fieldPosition = [
                                                            {x: 159, y: 24},
                                                            {x: 159 + 145, y: 24},
                                                            {x: 159 + 145, y: 24 + 30},
                                                            {x: 159, y: 24 + 30}
                                                        ];
                                                        fe.fieldPositionFake = true;
                                                    } else {
                                                        if (
                                                            this.dataPagesSize.length &&
                                                            (!Array.isArray(fe.fieldPosition) ||
                                                                (Array.isArray(fe.fieldPosition) &&
                                                                    !fe.fieldPosition.length))
                                                        ) {
                                                            fe.fieldPosition =
                                                                this.dataPagesSize[
                                                                    fe.fieldPage ? fe.fieldPage - 1 : 0
                                                                    ];
                                                            fe.fieldPositionFake = true;
                                                        }
                                                    }
                                                }

                                                this.saveLastUpdateAfterBlur = {
                                                    fieldId: fld.fieldId,
                                                    disabled: fe.disabled,
                                                    data: {
                                                        valueTypeOv: fe.valueTypeOv,
                                                        fileResultId: fe.fileResultId,
                                                        effectiveValue: this.asFormEffectiveValueNew(fe),
                                                        fieldPage: fe.fieldPage,
                                                        fieldPosition: fe.fieldPosition,
                                                        hasBeenDiscovered:
                                                            Array.isArray(fe.fieldPosition) &&
                                                            fe.fieldPosition.length,
                                                        searchkey: fe.fieldSearchkey,
                                                        locationNo: fe.locationNum
                                                    }
                                                };
                                                if (this.focusInput[fld.fieldId] === false) {
                                                    this.updateInputFromLastSaved(fld.fieldId);
                                                }
                                            } else {
                                                if (this.fileFieldsForm.get(fieldId.toString())) {
                                                    const forms = this.fileFieldsForm.get(
                                                        fieldId.toString()
                                                    );
                                                    // if (fe.disabled !== undefined) {
                                                    //     if (fe.disabled) {
                                                    //         forms.disable({
                                                    //             emitEvent: false,
                                                    //             onlySelf: true
                                                    //         });
                                                    //     } else {
                                                    //         forms.enable({
                                                    //             emitEvent: false,
                                                    //             onlySelf: true
                                                    //         });
                                                    //     }
                                                    // }
                                                    if (
                                                        fe.valueType === 'NUMBER' ||
                                                        fe.valueType === 'STRING'
                                                    ) {
                                                        if (fe && !fe.valueTypeOv && fe === null) {
                                                            fe.fieldPosition = [
                                                                {x: 159, y: 24},
                                                                {x: 159 + 145, y: 24},
                                                                {x: 159 + 145, y: 24 + 30},
                                                                {x: 159, y: 24 + 30}
                                                            ];
                                                            fe.fieldPositionFake = true;
                                                        } else {
                                                            if (
                                                                !Array.isArray(fe.fieldPosition) ||
                                                                (Array.isArray(fe.fieldPosition) &&
                                                                    !fe.fieldPosition.length)
                                                            ) {
                                                                fe.fieldPosition =
                                                                    this.dataPagesSize[
                                                                        fe.fieldPage ? fe.fieldPage - 1 : 0
                                                                        ];
                                                                fe.fieldPositionFake = true;
                                                            }
                                                        }
                                                    }
                                                    forms
                                                        .get('valueTypeOv')
                                                        .patchValue(fe.valueTypeOv && true, {
                                                            emitEvent: false,
                                                            onlySelf: true
                                                        });
                                                    forms
                                                        .get('fileResultId')
                                                        .patchValue(fe.fileResultId, {
                                                            emitEvent: false,
                                                            onlySelf: true
                                                        });
                                                    forms.get('fieldPage').patchValue(fe.fieldPage, {
                                                        emitEvent: false,
                                                        onlySelf: true
                                                    });
                                                    forms
                                                        .get('fieldPosition')
                                                        .patchValue(fe.fieldPosition, {
                                                            emitEvent: false,
                                                            onlySelf: true
                                                        });
                                                    forms
                                                        .get('hasBeenDiscovered')
                                                        .patchValue(
                                                            Array.isArray(fe.fieldPosition) &&
                                                            fe.fieldPosition.length,
                                                            {
                                                                emitEvent: false,
                                                                onlySelf: true
                                                            }
                                                        );
                                                    forms.get('searchkey').patchValue(fe.fieldSearchkey, {
                                                        emitEvent: false,
                                                        onlySelf: true
                                                    });
                                                    forms.get('locationNo').patchValue(fe.locationNum, {
                                                        emitEvent: false,
                                                        onlySelf: true
                                                    });
                                                    forms
                                                        .get('effectiveValue')
                                                        .patchValue(this.asFormEffectiveValueNew(fe), {
                                                            emitEvent: false,
                                                            onlySelf: true
                                                        });
                                                    forms.get('effectiveValue').updateValueAndValidity({
                                                        emitEvent: false,
                                                        onlySelf: true
                                                    });
                                                }
                                            }
                                        });
                                    }
                                }

                                for (const cat of this.fileDetailsSave.fieldsHierarchy) {
                                    for (const fld1 of cat.fields) {
                                        const fie = this.fileFieldsForm.get(fld1.fieldId + '');
                                        const invoice =
                                            cat.category.includes('נתוני קבלה') &&
                                            !this.invoicePayment.value;
                                        fld1.hide = !!(
                                            this.showEmptyFields.value &&
                                            ((fie.get('effectiveValue').value !== '' &&
                                                    fie.get('effectiveValue').value !== null &&
                                                    fie.get('effectiveValue').value !== undefined &&
                                                    !fld1.fileFldInfo) ||
                                                invoice ||
                                                fie.disabled ||
                                                fie.get('valueTypeOv').value === true)
                                        );
                                    }
                                    cat.hide = cat.fields.every((field) => field.hide);
                                }
                                this.showAlertHideAllFields =
                                    this.fileDetailsSave.fieldsHierarchy.every(
                                        (field) => field.hide
                                    );
                                this.editHp = this.fileDetailsSave.fieldsHierarchy.some(
                                    (cat) => {
                                        return cat.fields.some((fldCh: any) => {
                                            const fldKey = String(fldCh.fieldId);
                                            if ('9' === fldKey) {
                                                if (
                                                    fldCh.fieldValue === 'חשבונית מט"ח' ||
                                                    fldCh.fieldValue === 'אחר'
                                                ) {
                                                    return true;
                                                }
                                            }
                                            if ('21' === fldKey) {
                                                if (fldCh.fieldValue === 0) {
                                                    return true;
                                                }
                                            }
                                            return false;
                                        });
                                    }
                                );
                                if (this.fileDetailsSave.approveActive) {
                                    this.getJournalTransForFile();
                                } else {
                                    this.show_approveActiveCopy = false;
                                }
                                if (
                                    this.fileFieldsForm.get('2') &&
                                    this.fileFieldsForm.get('2').get('effectiveValue').value &&
                                    this.fileFieldsForm.get('28') &&
                                    !this.fileFieldsForm.get('28').get('effectiveValue').value
                                ) {
                                    this.focusFl28();
                                }
                            }
                        }
                        if (value.error && value.status === 500) {
                            if (
                                fld.fieldId === 6 ||
                                fld.fieldId === 2 ||
                                fld.fieldId === 30 ||
                                fld.fieldId === 40 ||
                                fld.fieldId === 41
                            ) {
                                this.rollingBack = true;
                                this.fileFieldsForm
                                    .get(fld.fieldId.toString())
                                    .get('effectiveValue')
                                    .patchValue(this.saveOldValue, {
                                        emitEvent: false,
                                        onlySelf: true
                                    });
                                this.fileFieldsForm
                                    .get(fld.fieldId.toString())
                                    .get('effectiveValue')
                                    .updateValueAndValidity({
                                        emitEvent: false,
                                        onlySelf: true
                                    });
                                this.saveOldValue = false;
                            }
                        } else {
                            if (fld.fieldId === 6 || fld.fieldId === 2) {
                                this.saveOldValue = false;
                            }
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
                        if (
                            fld.fieldId === 6 ||
                            fld.fieldId === 2 ||
                            fld.fieldId === 30 ||
                            fld.fieldId === 40 ||
                            fld.fieldId === 41
                        ) {
                            this.rollingBack = true;
                            this.fileFieldsForm
                                .get(fld.fieldId.toString())
                                .get('effectiveValue')
                                .patchValue(this.saveOldValue, {
                                    emitEvent: false,
                                    onlySelf: true
                                });
                            this.fileFieldsForm
                                .get(fld.fieldId.toString())
                                .get('effectiveValue')
                                .updateValueAndValidity({
                                    emitEvent: false,
                                    onlySelf: true
                                });
                            this.saveOldValue = false;
                        }
                    }
                );
            });

        this.fieldValueChangeSubscribers.set(String(fld.fieldId), fldValChangeSub);
    }

    updateFocus(fieldId: any) {
        this.focusInput[fieldId] = true;
        if (fieldId === 33 && this.fileDetailsSave.taxDeductionExist === false) {
            this.show_modal_report856 = true;
            this.infoModal = new FormGroup({
                taxDeductionCustId: new FormControl(
                    {
                        value: '',
                        disabled: false
                    },
                    {
                        validators: [Validators.required]
                    }
                )
            });
        }
    }

    // private asFormEffectiveValue(fld: any, companyCustomerDetails: any, isExpense: boolean) {
    //     if (fld.fieldId === 2) {
    //         return this.userService.appData.userData.companyCustomerDetails.all
    //             .find(custIdxRec => custIdxRec.custId === fld.fieldValue);
    //     } else if (fld.fieldId === 6) {
    //         return this.userService.appData.userData.companyCustomerDetails.all
    //             .find(custIdxRec => custIdxRec.custId === fld.fieldValue);
    //     } else if (fld.fieldId === 4) {
    //
    //     } else if (fld.fieldId === 5) {
    //         return (fld.fieldValue > 0) ? this.userService.appData.moment(fld.fieldValue).valueOf()
    //             : null;
    //     } else if (fld.fieldId === 13) {
    //         if (fld.fieldValue) {
    //             this.ocrService.getMaam({
    //                 date: this.userService.appData.moment(fld.fieldValue).toDate(),
    //             }).subscribe((res) => {
    //                 this.maamPercentage = ((res) ? res['body'] : res);
    //                 if (this.maamPercentage && this.maamPercentage.toString().includes('.')) {
    //                     this.maamPercentage = Number(this.maamPercentage.toString().replace(/\D/g, ''));
    //                 }
    //             });
    //             const currencyId = this.fileFieldsForm.get('12').get('effectiveValue').value;
    //             if (currencyId !== 1) {
    //                 if (!this.rateEdit) {
    //                     const code = this.currencyList.find(ite => ite.id === currencyId);
    //                     this.ocrService.currencyGetRates({
    //                         companyId: this.userService.appData.userData.companySelect.companyId,
    //                         currencyCode: code ? code.code : null,
    //                         invoiceDate: fld.fieldValue
    //                     }).subscribe((res) => {
    //                         const rateObj = ((res) ? res['body'] : res);
    //                         if (rateObj) {
    //                             this.rate = rateObj.rate;
    //                             this.fileFieldsForm.get('999').patchValue({
    //                                 effectiveValue: this.rate
    //                             }, {emitEvent: false, onlySelf: true});
    //                         }
    //                         const rate = Number(this.rate);
    //                         const totalfieldId24 = Number(fld.fieldValue);
    //                         const total = totalfieldId24 * rate;
    //                         this.fileFieldsForm.get('15').patchValue({
    //                             effectiveValue: toFixedNumber(total)
    //                         }, {emitEvent: false, onlySelf: true});
    //                         this.fileFieldsForm.get('16').patchValue({
    //                             effectiveValue: toFixedNumber(0)
    //                         }, {emitEvent: false, onlySelf: true});
    //                         this.fileFieldsForm.get('17').patchValue({
    //                             effectiveValue: toFixedNumber(total)
    //                         }, {emitEvent: false, onlySelf: true});
    //
    //                         // if (this.fileFieldsForm.get('25')) {
    //                         //     this.fileFieldsForm.get('25').patchValue({
    //                         //         effectiveValue: this.rate
    //                         //     }, {emitEvent: false, onlySelf: true});
    //                         //     this.ocrService.setFieldValue({
    //                         //         fileId: this._fileScanView.fileId,
    //                         //         fieldId: 25,
    //                         //         fileResultId: null,
    //                         //         fieldPage: 0,
    //                         //         fieldPosition: null,
    //                         //         fieldValue: this.rate,
    //                         //         locationNum: null,
    //                         //         locationDesc: null,
    //                         //         fieldSearchkey: null,
    //                         //         manualTyped: true
    //                         //     }).pipe(take(1))
    //                         //         .subscribe(() => {
    //                         //         });
    //                         // }
    //                     });
    //                 } else {
    //                     const rate = Number(this.rate);
    //                     const totalfieldId24 = Number(fld.fieldValue);
    //                     const total = totalfieldId24 * rate;
    //                     this.fileFieldsForm.get('15').patchValue({
    //                         effectiveValue: toFixedNumber(total)
    //                     }, {emitEvent: false, onlySelf: true});
    //                     this.fileFieldsForm.get('16').patchValue({
    //                         effectiveValue: toFixedNumber(0)
    //                     }, {emitEvent: false, onlySelf: true});
    //                     this.fileFieldsForm.get('17').patchValue({
    //                         effectiveValue: toFixedNumber(total)
    //                     }, {emitEvent: false, onlySelf: true});
    //                 }
    //             }
    //             return this.userService.appData.moment(fld.fieldValue).toDate();
    //         }
    //     } else if (fld.fieldId === 12) {
    //         const currencyId = fld.fieldValue;
    //         if (currencyId !== 1) {
    //             if (!this.rateEdit && this.fileFieldsForm.get('13').get('effectiveValue').value) {
    //                 this.currencyList$
    //                     .pipe(
    //                         switchMap(() => this.ocrService.currencyGetRates({
    //                             companyId: this.userService.appData.userData.companySelect.companyId,
    //                             currencyCode: this.currencyList.find(ite => ite.id === currencyId) ? this.currencyList.find(ite => ite.id === currencyId).code : null,
    //                             invoiceDate: this.fileFieldsForm.get('13').get('effectiveValue').value
    //                         })),
    //                         take(1)
    //                     )
    //                     .subscribe((res) => {
    //                         const rateObj = ((res) ? res['body'] : res);
    //                         if (rateObj) {
    //                             this.rate = rateObj.rate;
    //                             if (this.fileFieldsForm.get('999')) {
    //                                 this.fileFieldsForm.get('999').patchValue({
    //                                     effectiveValue: this.rate
    //                                 }, {emitEvent: false, onlySelf: true});
    //                             }
    //
    //                             // if (this.fileFieldsForm.get('25')) {
    //                             //     this.fileFieldsForm.get('25').patchValue({
    //                             //         effectiveValue: this.rate
    //                             //     }, {emitEvent: false, onlySelf: true});
    //                             //     this.ocrService.setFieldValue({
    //                             //         fileId: this._fileScanView.fileId,
    //                             //         fieldId: 25,
    //                             //         fileResultId: null,
    //                             //         fieldPage: 0,
    //                             //         fieldPosition: null,
    //                             //         fieldValue: this.rate,
    //                             //         locationNum: null,
    //                             //         locationDesc: null,
    //                             //         fieldSearchkey: null,
    //                             //         manualTyped: true
    //                             //     }).pipe(take(1))
    //                             //         .subscribe(() => {
    //                             //         });
    //                             // }
    //                         }
    //                     });
    //             }
    //             this.fileFieldsForm.get('17').disable();
    //             this.fileFieldsForm.get('15').disable();
    //             this.fileFieldsForm.get('16').disable();
    //
    //
    //             this.fileFieldsForm.get('9').patchValue({
    //                 effectiveValue: 'חשבונית מט"ח'
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('5').disable();
    //         } else {
    //             if (this.userService.appData.userData.companySelect.esderMaam !== 'NONE') {
    //                 this.fileFieldsForm.get('4').enable();
    //             }
    //             this.fileFieldsForm.get('5').enable();
    //             this.fileFieldsForm.get('9').patchValue({
    //                 effectiveValue: 'חשבונית מס'
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('24').patchValue({
    //                 effectiveValue: ''
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('15').patchValue({
    //                 effectiveValue: ''
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('16').patchValue({
    //                 effectiveValue: ''
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('17').patchValue({
    //                 effectiveValue: ''
    //             }, {emitEvent: false, onlySelf: true});
    //             if (this.parentExport) {
    //                 this.fileFieldsForm.get('17').disable();
    //             } else {
    //                 this.fileFieldsForm.get('17').enable();
    //             }
    //         }
    //     } else if (fld.fieldId === 24 && (this.fileFieldsForm.get('12').get('effectiveValue').value !== 1)) {
    //         if (!this.rateEdit) {
    //             this.currencyList$.subscribe(() => {
    //                 const code = this.currencyList.find(ite => ite.id === this.fileFieldsForm.get('12').get('effectiveValue').value);
    //                 this.ocrService.currencyGetRates({
    //                     companyId: this.userService.appData.userData.companySelect.companyId,
    //                     currencyCode: code ? code.code : null,
    //                     invoiceDate: this.fileFieldsForm.get('13').get('effectiveValue').value
    //                 }).subscribe((res) => {
    //                     const rateObj = ((res) ? res['body'] : res);
    //                     if (rateObj) {
    //                         this.rate = rateObj.rate;
    //                         this.fileFieldsForm.get('999').patchValue({
    //                             effectiveValue: this.rate
    //                         }, {emitEvent: false, onlySelf: true});
    //                     }
    //                     const rate = Number(this.rate);
    //                     const totalfieldId24 = Number(fld.fieldValue);
    //                     const total = totalfieldId24 * rate;
    //                     this.fileFieldsForm.get('15').patchValue({
    //                         effectiveValue: toFixedNumber(total)
    //                     }, {emitEvent: false, onlySelf: true});
    //                     this.fileFieldsForm.get('16').patchValue({
    //                         effectiveValue: toFixedNumber(0)
    //                     }, {emitEvent: false, onlySelf: true});
    //                     this.fileFieldsForm.get('17').patchValue({
    //                         effectiveValue: toFixedNumber(total)
    //                     }, {emitEvent: false, onlySelf: true});
    //
    //                     // if (this.fileFieldsForm.get('25')) {
    //                     //     this.fileFieldsForm.get('25').patchValue({
    //                     //         effectiveValue: this.rate
    //                     //     }, {emitEvent: false, onlySelf: true});
    //                     //     this.ocrService.setFieldValue({
    //                     //         fileId: this._fileScanView.fileId,
    //                     //         fieldId: 25,
    //                     //         fileResultId: null,
    //                     //         fieldPage: 0,
    //                     //         fieldPosition: null,
    //                     //         fieldValue: this.rate,
    //                     //         locationNum: null,
    //                     //         locationDesc: null,
    //                     //         fieldSearchkey: null,
    //                     //         manualTyped: true
    //                     //     }).pipe(take(1))
    //                     //         .subscribe(() => {
    //                     //         });
    //                     // }
    //                 });
    //             });
    //         } else {
    //             const rate = Number(this.rate);
    //             const totalfieldId24 = Number(fld.fieldValue);
    //             const total = totalfieldId24 * rate;
    //             this.fileFieldsForm.get('15').patchValue({
    //                 effectiveValue: toFixedNumber(total)
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('16').patchValue({
    //                 effectiveValue: toFixedNumber(0)
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('17').patchValue({
    //                 effectiveValue: toFixedNumber(total)
    //             }, {emitEvent: false, onlySelf: true});
    //         }
    //     } else if (fld.fieldId === 10) {
    //         return fld.fieldValue === 1;
    //     } else if (fld.fieldId === 1) {
    //         return (fld.fieldValue === '' || fld.fieldValue === null) ? 'יש לבחור כרטיס' : fld.fieldValue;
    //     } else if (fld.fieldId === 9) {
    //         if (fld.fieldValue === 'מסמך פטור ממע"מ') {
    //             this.fileFieldsForm.get('16').patchValue({
    //                 effectiveValue: toFixedNumber(0)
    //             }, {emitEvent: false, onlySelf: true});
    //
    //             this.fileFieldsForm.get('17').patchValue({
    //                 effectiveValue: toFixedNumber(this.fileFieldsForm.get('15').get('effectiveValue').value)
    //             }, {emitEvent: false, onlySelf: true});
    //             this.fileFieldsForm.get('4').patchValue({
    //                 effectiveValue: 'NONE'
    //             });
    //             this.fileFieldsForm.get('4').disable();
    //         } else {
    //
    //             if (fld.fieldValue === 'חשבונית מט"ח') {
    //                 this.fileFieldsForm.get('4').patchValue({
    //                     effectiveValue: 'NONE'
    //                 }, {emitEvent: false, onlySelf: true});
    //                 this.fileFieldsForm.get('4').disable();
    //             } else {
    //                 if (this.userService.appData.userData.companySelect.esderMaam !== 'NONE') {
    //                     this.fileFieldsForm.get('4').enable();
    //                 }
    //             }
    //
    //
    //         }
    //     } else if (fld.fieldId === 14) {
    //         if (fld.fieldValue) {
    //             return this.userService.appData.moment(fld.fieldValue).toDate();
    //         }
    //     }
    //
    //
    //     return fld.fieldValue;
    // }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    setReport856() {
        if (this.infoModal.invalid) {
            BrowserService.flattenControls(this.infoModal).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }
        this.sharedService
            .setTaxDeductionCust({
                companyId: this.userService.appData.userData.companySelect.companyId,
                taxDeductionCustId: this.infoModal.get('taxDeductionCustId').value
                    ? this.infoModal.get('taxDeductionCustId').value.custId
                    : null,
                expense: this.fileFieldsForm.get('21')
                    ? this.fileFieldsForm.get('21').get('effectiveValue').value === 0
                        ? false
                        : true
                    : null
            })
            .subscribe(() => {
                this.fileDetailsSave.taxDeductionExist = true;
            });
    }

    set33empty() {
        this.fileFieldsForm.get('33').patchValue(
            {
                effectiveValue: ''
            },
            {emitEvent: false, onlySelf: true}
        );
    }

    updateInputFromLastSaved(fieldId: any) {
        this.focusInput[fieldId] = false;
        if (
            fieldId === 33 &&
            this.fileDetailsSave.taxDeductionExist === true &&
            this.isChanged33
        ) {
            this.fileFieldsForm.get(fieldId.toString()).patchValue({
                effectiveValue: this.fileFieldsForm
                    .get(fieldId.toString())
                    .get('effectiveValue').value
            });
        }
        if (
            this.saveLastUpdateAfterBlur &&
            this.saveLastUpdateAfterBlur.fieldId === fieldId
        ) {
            if (
                this.fileFieldsForm.get(this.saveLastUpdateAfterBlur.fieldId.toString())
            ) {
                const data = this.saveLastUpdateAfterBlur.data;
                const forms = this.fileFieldsForm.get(
                    this.saveLastUpdateAfterBlur.fieldId.toString()
                );
                forms.get('valueTypeOv').patchValue(data.valueTypeOv && true, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('fileResultId').patchValue(data.fileResultId, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('fieldPage').patchValue(data.fieldPage, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('fieldPosition').patchValue(data.fieldPosition, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('hasBeenDiscovered').patchValue(data.hasBeenDiscovered, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('searchkey').patchValue(data.searchkey, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('locationNo').patchValue(data.locationNo, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('effectiveValue').patchValue(data.effectiveValue, {
                    emitEvent: false,
                    onlySelf: true
                });
                forms.get('effectiveValue').updateValueAndValidity({
                    emitEvent: true,
                    onlySelf: true
                });
                // if (this.saveLastUpdateAfterBlur.disabled !== undefined) {
                //     if (this.saveLastUpdateAfterBlur.disabled) {
                //         this.fileFieldsForm.get(this.saveLastUpdateAfterBlur.fieldId.toString()).disable({
                //             emitEvent: false,
                //             onlySelf: true
                //         });
                //     } else {
                //         this.fileFieldsForm.get(this.saveLastUpdateAfterBlur.fieldId.toString()).enable({
                //             emitEvent: false,
                //             onlySelf: true
                //         });
                //     }
                // }
            }
        }
        this.saveLastUpdateAfterBlur = null;
    }

    onClickOptionDD(disabled: boolean, event?: any) {
        if (disabled) {
            event.stopPropagation();
        }
    }

    optionDDorderType(optArr: any) {
        optArr.forEach(option => {
            option['disabled'] = !this.isMaamOpen &&
                option.value === 'OPEN' &&
                this.arr.controls.length > 1;
        });
        return optArr;
    }

    setDisabledDD(optArr: any, i: any) {
        optArr.forEach(item => {
            item['disabled'] = (this.arr.controls[i].get('orderType').value ===
                'OPEN'
                    ? this.arr.controls[i].get('custDataMaam').value &&
                    this.arr.controls[i].get('custDataMaam')
                        .value === item.custId
                    : this.arr.controls[i].get('custDataMaam').value &&
                    this.arr.controls[i].get('custDataMaam').value
                        .custId &&
                    this.arr.controls[i].get('custDataMaam').value
                        .custId === item.custId) ||
                (this.arr.controls[i].get('indexData').value &&
                    this.arr.controls[i].get('indexData').value
                        .custId &&
                    this.arr.controls[i].get('indexData').value
                        .custId === item.custId);
        });
        return optArr;
    }

    setDisabledDD_custDataMaam(optArr: any, i: any) {
        const arr = this.arr;
        optArr.forEach(item => {
            item['disabled'] = ((arr.controls[i].get('custData').value &&
                    arr.controls[i].get('custData').value.custId &&
                    arr.controls[i].get('custData').value.custId ===
                    (arr.controls[i].get('orderType').value ===
                    'OPEN'
                        ? item.value
                        : item.custId)) ||
                (arr.controls[i].get('indexData').value &&
                    arr.controls[i].get('indexData').value.custId &&
                    arr.controls[i].get('indexData').value
                        .custId ===
                    (arr.controls[i].get('orderType').value ===
                    'OPEN'
                        ? item.value
                        : item.custId)));
        });
        return optArr;
    }

    setDisabledDD_custDataMaam_open(optArr: any, i: any) {
        const arr = this.arr;
        optArr.forEach(item => {
            item['disabled'] = ((arr.controls[i].get('custData').value &&
                    arr.controls[i].get('custData').value
                        .custId &&
                    arr.controls[i].get('custData').value
                        .custId === item.custId) ||
                (arr.controls[i].get('indexData').value &&
                    arr.controls[i].get('indexData').value
                        .custId &&
                    arr.controls[i].get('indexData').value
                        .custId === item.custId));
        });
        return optArr;
    }

    setDisabledDD_indexData(optArr: any, i: any) {
        const arr = this.arr;
        optArr.forEach(item => {
            item['disabled'] = ((arr.controls[i].get('orderType').value ===
                'OPEN'
                    ? arr.controls[i].get('custDataMaam').value &&
                    arr.controls[i].get('custDataMaam')
                        .value === item.custId
                    : arr.controls[i].get('custDataMaam').value &&
                    arr.controls[i].get('custDataMaam').value
                        .custId &&
                    arr.controls[i].get('custDataMaam').value
                        .custId === item.custId) ||
                (arr.controls[i].get('custData').value &&
                    arr.controls[i].get('custData').value
                        .custId &&
                    arr.controls[i].get('custData').value
                        .custId === item.custId));
        });
        return optArr;
    }

    disabled_custId(optArr: any, i: any) {
        const fileFieldsForm = this.fileFieldsForm;
        const arrReceipt = this.arrReceipt;
        optArr.forEach(item => {
            item['disabled'] = ((fileFieldsForm.get('6').get('effectiveValue') &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value.custId &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value.custId === item.custId) ||
                (arrReceipt.controls[i].get('paymentCustId')
                        .value &&
                    arrReceipt.controls[i].get('paymentCustId')
                        .value.custId &&
                    arrReceipt.controls[i].get('paymentCustId')
                        .value.custId === item.custId) ||
                (arrReceipt.controls[i].get('taxDeductionCustId')
                        .value &&
                    arrReceipt.controls[i].get('taxDeductionCustId')
                        .value.custId &&
                    arrReceipt.controls[i].get('taxDeductionCustId')
                        .value.custId === item.custId));
        });
        return optArr;
    }

    disabled_paymentCustId(optArr: any, i: any) {
        const fileFieldsForm = this.fileFieldsForm;
        const arrReceipt = this.arrReceipt;
        optArr.forEach(item => {
            item['disabled'] = ((fileFieldsForm.get('6').get('effectiveValue') &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value.custId &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value.custId === item.custId) ||
                (arrReceipt.controls[i].get('custId').value &&
                    arrReceipt.controls[i].get('custId').value
                        .custId &&
                    arrReceipt.controls[i].get('custId').value
                        .custId === item.custId) ||
                (arrReceipt.controls[i].get('taxDeductionCustId')
                        .value &&
                    arrReceipt.controls[i].get('taxDeductionCustId')
                        .value.custId &&
                    arrReceipt.controls[i].get('taxDeductionCustId')
                        .value.custId === item.custId));
        });
        return optArr;
    }

    disabledDD_taxDeductionCustId(optArr: any, i: any) {
        const fileFieldsForm = this.fileFieldsForm;
        const arrReceipt = this.arrReceipt;
        optArr.forEach(item => {
            item['disabled'] = ((fileFieldsForm.get('6').get('effectiveValue') &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value.custId &&
                    fileFieldsForm.get('6').get('effectiveValue')
                        .value.custId === item.custId) ||
                (arrReceipt.controls[i].get('custId').value &&
                    arrReceipt.controls[i].get('custId').value
                        .custId &&
                    arrReceipt.controls[i].get('custId').value
                        .custId === item.custId) ||
                (arrReceipt.controls[i].get('paymentCustId')
                        .value &&
                    arrReceipt.controls[i].get('paymentCustId')
                        .value.custId &&
                    arrReceipt.controls[i].get('paymentCustId')
                        .value.custId === item.custId));
        });
        return optArr;
    }

    isDisabledApprove(): boolean {
        // if (!this.fileFieldsForm.contains('17') || !this.fileFieldsForm.contains('12')) {
        //     return false;
        // }
        if (
            this.fileFieldsForm &&
            Object.keys(this.fileFieldsForm.controls).length
        ) {
            const isItTypeOfDocForHpNorReq =
                (this.fileFieldsForm.get('9') &&
                    this.fileFieldsForm.get('9').get('effectiveValue') &&
                    (this.fileFieldsForm.get('9').get('effectiveValue').value ===
                        'חשבונית מט"ח' ||
                        this.fileFieldsForm.get('9').get('effectiveValue').value ===
                        'אחר')) ||
                this.fileFieldsForm.get('21').get('effectiveValue').value === 0;
            const pettyCash =
                this.fileFieldsForm.get('2').get('effectiveValue') &&
                this.fileFieldsForm.get('2').get('effectiveValue').value &&
                this.fileFieldsForm.get('2').get('effectiveValue').value.pettyCash;
            const maamSumLessThan300 =
                Number(this.fileFieldsForm.get('16').get('effectiveValue').value) <=
                300;
            // console.log(this.fileFieldsForm.get('17').get('effectiveValue').value,
            //     this.fileFieldsForm.invalid,
            //     Object.values(this.fileFieldsForm.controls)
            // );
            if (
                this.fileFieldsForm.get('17').get('effectiveValue').value === 0 ||
                this.fileFieldsForm.get('17').get('effectiveValue').value === '0' ||
                this.fileFieldsForm.get('18').get('effectiveValue').value === 0 ||
                this.fileFieldsForm.get('18').get('effectiveValue').value === '0' ||
                (this.fileFieldsForm.invalid &&
                    Object.values(this.fileFieldsForm.controls).some((fc: any) => {
                        // if (fc.invalid || fc.value.indBlockAprrove) {
                        //     debugger
                        // }
                        const isDisabled =
                            (fc.invalid || fc.value.indBlockAprrove) &&
                            ((fc.get('fieldId').value !== 8 &&
                                    fc.get('fieldId').value !== 999 &&
                                    fc.get('fieldId').value !== 24 &&
                                    (this.fileFieldsForm.get('12').get('effectiveValue').value ===
                                        1 ||
                                        this.revaluationCurrCode) &&
                                    fc.get('fieldId').value !== 25 &&
                                    (this.fileFieldsForm.get('12').get('effectiveValue').value ===
                                        1 ||
                                        this.revaluationCurrCode) &&
                                    fc.get('fieldId').value !== 29 &&
                                    (this.fileFieldsForm.get('12').get('effectiveValue').value ===
                                        1 ||
                                        this.revaluationCurrCode) &&
                                    !(
                                        fc.get('fieldId').value === 3 &&
                                        ((pettyCash && maamSumLessThan300) ||
                                            (!pettyCash && isItTypeOfDocForHpNorReq))
                                    )) ||
                                (!this.revaluationCurrCode &&
                                    (fc.get('fieldId').value === 24 ||
                                        fc.get('fieldId').value === 29 ||
                                        fc.get('fieldId').value === 25 ||
                                        fc.get('fieldId').value === 999) &&
                                    this.fileFieldsForm.get('12').get('effectiveValue').value !==
                                    1));
                        // if(isDisabled){
                        //     if (fc.invalid || fc.value.indBlockAprrove) {
                        //         // debugger
                        //     }
                        // }

                        return isDisabled;
                    }))
            ) {
                return true;
            }

            if (
                this.fileFieldsForm.get('2') &&
                this.fileFieldsForm.get('2').get('effectiveValue').value &&
                this.fileFieldsForm.get('6') &&
                this.fileFieldsForm.get('6').get('effectiveValue').value &&
                this.fileFieldsForm.get('2').get('effectiveValue').value.custId ===
                this.fileFieldsForm.get('6').get('effectiveValue').value.custId
            ) {
                return true;
            }
        }
        return false;
    }

    documentApproveFromModal() {
        this.fileDetailsSave.approveActive = false;
        this.fileDetailsSave.approveActiveCopy = this.fileDetailsSave.approveActive;

        this.ocrService
            .setFileDataIgnore(this.modalDocumentApproveDouble)
            .subscribe((response: any) => {
                const bodyRes = response ? response['body'] : response;
                const statusRes = response ? response.status : response;
                if (statusRes === 422) {
                    this.fileChange = true;
                    if (bodyRes.redoFor) {
                        this._fileScanView.fileId = bodyRes.redoFor;
                        this.setFile(this._fileScanView);
                    } else {
                        this.goToRow.emit({
                            refresh: this.fileChange,
                            response: this._fileScanView.fileId
                        });
                    }
                }

                this.modalDocumentApproveDouble = false;
                this.fileDetailsSave.approveActive = true;
                this.fileDetailsSave.approveActiveCopy =
                    this.fileDetailsSave.approveActive;

                this.documentApproveSender();
                // if (!this.modalDocumentApproveOldDate) {
                //     this.documentApproveSender();
                // }
            });
    }

    // noinspection JSUnusedLocalSymbols
    documentApprove(srcElement: Element) {
        // const isItTypeOfDocForHpNorReq = (this.fileFieldsForm.get('9') && this.fileFieldsForm.get('9').get('effectiveValue') && (this.fileFieldsForm.get('9').get('effectiveValue').value === 'חשבונית מט"ח' || this.fileFieldsForm.get('9').get('effectiveValue').value === 'אחר')) || this.fileFieldsForm.get('21').get('effectiveValue').value === 0;
        // const pettyCash = (this.fileFieldsForm.get('2').get('effectiveValue') && this.fileFieldsForm.get('2').get('effectiveValue').value && this.fileFieldsForm.get('2').get('effectiveValue').value.pettyCash);
        // const maamSumLessThan300 = Number(this.fileFieldsForm.get('16').get('effectiveValue').value) <= 300;
        // if ((this.fileFieldsForm.get('17').get('effectiveValue').value === 0 || this.fileFieldsForm.get('17').get('effectiveValue').value === '0') || this.fileFieldsForm.invalid
        //     && Object.values(this.fileFieldsForm.controls)
        //         .some(fc => (fc.invalid || fc.value.indBlockAprrove) && (
        //             (fc.get('fieldId').value !== 8 && fc.get('fieldId').value !== 999 && (fc.get('fieldId').value !== 24 && (this.fileFieldsForm.get('12').get('effectiveValue').value === 1 || this.revaluationCurrCode)) && !(fc.get('fieldId').value === 3 && ((pettyCash && maamSumLessThan300) || (!pettyCash && isItTypeOfDocForHpNorReq))))
        //             ||
        //             (!this.revaluationCurrCode && (fc.get('fieldId').value === 24 || fc.get('fieldId').value === 999) && this.fileFieldsForm.get('12').get('effectiveValue').value !== 1)
        //         ))) {
        //     return;
        // }
        this.fileChange = true;
        // this.documentApproveSender();

        if (this.showDoubleSuspect) {
            this.modalDocumentApproveDouble = {
                filesId: [this._fileScanView.fileId],
                flag: this.fileDetailsSave.flag,
                note: this.fileDetailsSave.note,
                ignoreDuplicate: true
            };
        } else {
            this.fileDetailsSave.approveActive = false;
            this.fileDetailsSave.approveActiveCopy =
                this.fileDetailsSave.approveActive;
            this.documentApproveSender();
        }

        // this.ocrService.requestFileDetails({fileId: this._fileScanView.fileId})
        //     .subscribe((res) => {
        //         const fileDetails = res.body;
        //         const doubleInvoice = fileDetails.fields.some(field => (field.alertId !== undefined && field.alertId !== null) && (field.fieldId === 11 && field.alertId === 10));
        //         const oldDate = fileDetails.fields.some(field => (field.alertId !== undefined && field.alertId !== null) && (field.fieldId === 13 && field.alertId === 2));
        //
        //         if (doubleInvoice) {
        //             this.modalDocumentApproveDouble = {
        //                 filesId: [this._fileScanView.fileId],
        //                 flag: fileDetails.flag,
        //                 note: fileDetails.note,
        //                 ignoreDuplicate: true
        //             };
        //         }
        //         if (oldDate) {
        //             this.modalDocumentApproveOldDate = true;
        //         }
        //
        //         if (!doubleInvoice && !oldDate) {
        //             this.documentApproveSender();
        //         }
        //     });

        // this.postponed = {
        //     action: this.documentSetStatusThenProceedToNext(FileStatus.CREATE_HASH_BANK, srcElement as HTMLButtonElement),
        //     message: null,
        //     fired: true
        // };
        // // this.documentSetStatusThenProceedToNext(FileStatus.CREATE_HASH_BANK, srcElement as HTMLButtonElement)
        // //     .pipe(
        // //         take(1)
        // //     ).subscribe(() => {
        // // });
    }

    documentApproveSender() {
        this.postponed = {
            action: this.ocrService.setFileStatus(
                this._fileScanView.fileId,
                FileStatus.CREATE_JOURNAL_TRANS
            ),
            message: null,
            fired: true
        };
    }

    setActiveField(
        fld: OcrField,
        htmlElement: any,
        abstractControl: AbstractControl,
        setFocus?: any
    ) {
        if (setFocus) {
            this.focusInput[setFocus] = true;
        }
        this.getSizeAllImgs();
        this.activeWord = null;
        let fldOver = false;
        if (abstractControl.value.fieldId === 27) {
            this.fileDetailsSave.fieldsHierarchy.forEach(cat => {
                const fldOverF = cat.fields.find(it => it.fieldId === 27);
                if (fldOverF) {
                    fldOver = fldOverF;
                }
            });
        }
        const file = fldOver ? fldOver : fld;
        setTimeout(() => {
            if (
                !abstractControl ||
                (abstractControl && abstractControl.disabled && file.fieldId !== 28)
            ) {
                this.activeField = null;
                this.activeFieldName = false;
                return;
            }
            if (
                fld &&
                file.fieldId !== 1 &&
                file.fieldId !== 999 &&
                !fld['valueTypeOv']
            ) {
                if (
                    ((file.fieldId === 15 ||
                            file.fieldId === 16 ||
                            file.fieldId === 17 ||
                            file.fieldId === 18) &&
                        !this.fileDetailsSave.matahSums) ||
                    file.fieldId === 25 ||
                    file.fieldId === 33
                ) {
                    setTimeout(() => {
                        const baseElement = htmlElement.querySelector('input');
                        baseElement.focus();
                    }, 300);
                }

                let fileObj;
                if (
                    (file.fieldId === 17 || file.fieldId === 18 || file.fieldId === 27 || file.fieldId === 16) &&
                    this.fileDetailsSave.matahSums
                ) {

                    // if (this.focusInput['24']) {
                    //     // @ts-ignore
                    //
                    //     debugger
                    // }

                    setTimeout(() => {
                        const baseElement = htmlElement.querySelectorAll('input');
                        if (baseElement.length) {
                            const idFocused = document.activeElement.id;
                            if (idFocused) {
                                if (file.fieldId === 27 || file.fieldId === 16) {
                                    const inputEditable = document.getElementById(file.fieldId.toString());
                                    if (inputEditable) {
                                        inputEditable.focus();
                                    }
                                } else {
                                    const inputEditable =
                                        baseElement[
                                            idFocused === (file.fieldId === 17 ? '24' : '29') ? 0 : 1
                                            ];
                                    const id = inputEditable.getAttribute('id');
                                    if (id === (file.fieldId === 17 ? '24' : '29')) {
                                        fileObj = Object.assign({}, file);
                                        fileObj.fieldId = file.fieldId === 17 ? 24 : 29;
                                    }
                                    inputEditable.focus();
                                }

                            }
                        }

                        this.activeFieldName = false;


                        this.activeField = {
                            field: fileObj ? fileObj : file,
                            element: ((file.fieldId === 27 || file.fieldId === 16) && this.fileDetailsSave.matahSums) ? document.getElementById('fieldListItem_16') : htmlElement,
                            formGroup: abstractControl as FormGroup
                        };

                        if (!baseElement.length) {
                            setTimeout(() => {
                                const baseElementNew = htmlElement.querySelectorAll('input');

                                if (baseElementNew.length) {
                                    const inputEditable =
                                        baseElementNew[
                                            this.activeField.field.fieldId ===
                                            (file.fieldId === 17 ? 24 : 29)
                                                ? 0
                                                : 1
                                            ];
                                    inputEditable.focus();
                                }
                            }, 600);
                        }
                        if (file.fieldId === 27 || file.fieldId === 16) {
                            setTimeout(() => {
                                const inputEditable = document.getElementById(file.fieldId.toString());
                                if (inputEditable) {
                                    inputEditable.focus();
                                }
                            }, 600);
                        }
                        // if (!this.userService.appData.userData.companySelect.test) {
                        //     if (((fileId === 15 || fileId === 16 || fileId === 17) && !this.revaluationCurrCode) || fileId === 24) {
                        //         setTimeout(() => {
                        //             const baseElement = htmlElement.querySelector('input');
                        //             baseElement.focus();
                        //         }, 300);
                        //     }
                        // } else {

                        // }

                        if (
                            !this.activeField.formGroup.value.fieldPosition ||
                            !this.activeField.formGroup.value.fieldPosition.length
                        ) {
                            this.activeField.formGroup.value.fieldPosition =
                                this.activeField.field['fieldPosition'];
                            if (this.activeField.formGroup.value.fieldPage === null) {
                                this.activeField.formGroup.value.fieldPage = 1;
                            }
                        }

                        if (
                            this.activeField.formGroup &&
                            this.activeField.field &&
                            !this.fieldsWithPredefinedEditData.has(
                                this.activeField.field.fieldId + ''
                            ) &&
                            this.activeField.formGroup.value.fieldPage &&
                            Array.isArray(this.activeField.formGroup.value.fieldPosition) &&
                            this.activeField.formGroup.value.fieldPosition.length &&
                            this.activeField.field.fieldId !== 1
                        ) {
                            this.currentPage.next(this.activeField.formGroup.value.fieldPage);
                            const fieldPosition = JSON.parse(
                                JSON.stringify(this.activeField.formGroup.value.fieldPosition)
                            );
                            fieldPosition.forEach((it) => {
                                // it.y += 7;
                                // it.x = (it.x) + ((this.sizeAllImg.pages[this.activeField.formGroup.value.fieldPage - 1].width === this.sizeAllImg.width) ? 0 : (this.sizeAllImg.pages[this.activeField.formGroup.value.fieldPage - 1].offsetPageLeft + ((this.sizeAllImg['offsetPageLeft']) + 10)));
                            });
                            this.activeWord = {
                                pageNo: this.activeField.formGroup.value.fieldPage,
                                position: fieldPosition
                            };
                            this.inlineEditorForm.reset({
                                fieldPage: this.activeField.formGroup.value.fieldPage,
                                fieldPosition: fieldPosition
                            });

                            const syms = this.visionResultsArr[
                            this.activeField.formGroup.value.fieldPage - 1
                                ].filter((sym) => {
                                if (sym.vertices.length === 4) {
                                    if (sym.vertices[0].y !== sym.vertices[1].y) {
                                        sym.vertices[0].y = sym.vertices[1].y;
                                    }
                                    if (sym.vertices[2].y !== sym.vertices[3].y) {
                                        sym.vertices[2].y = sym.vertices[3].y;
                                    }
                                    if (sym.vertices[0].x !== sym.vertices[3].x) {
                                        sym.vertices[0].x = sym.vertices[3].x;
                                    }
                                    if (sym.vertices[1].x !== sym.vertices[2].x) {
                                        sym.vertices[1].x = sym.vertices[2].x;
                                    }
                                }
                                sym.vertices.forEach((it) => {
                                    if (it.x === undefined) {
                                        it.x = 0;
                                    }
                                    if (it.y === undefined) {
                                        it.y = 0;
                                    }
                                });
                                if (
                                    sym.vertices[1].x <= sym.vertices[0].x ||
                                    sym.vertices[1].y >= sym.vertices[2].y
                                ) {
                                    return false;
                                }
                                return this.geometryHelper.rectangleContains(
                                    this.activeField.formGroup.value.fieldPosition,
                                    sym.vertices
                                );
                            });

                            this.inlineEditorForm.patchValue({
                                fieldValue: this.stringifySymbols(syms)
                            });

                            const hasScrollX =
                                this.pagesScrollContainer['nativeElement'].scrollWidth -
                                this.pagesScrollContainer['nativeElement'].clientWidth !==
                                0;
                            const hasScrollY =
                                this.pagesScrollContainer['nativeElement'].scrollHeight -
                                this.pagesScrollContainer['nativeElement'].clientHeight !==
                                0;
                            if (hasScrollX || hasScrollY) {
                                requestAnimationFrame(() => {
                                    // this.pageContainer.toArray()[this.activeField.formGroup.value.fieldPage - 1].nativeElement
                                    //     .scrollIntoView({block: 'start', inline: 'center', behavior: 'smooth'});

                                    const scrollData = {
                                        block: 'start',
                                        inline: 'center',
                                        behavior: 'smooth'
                                    };
                                    if (hasScrollX) {
                                        scrollData['left'] = -(
                                            this.pagesScrollContainer['nativeElement'].scrollWidth -
                                            this.pagesScrollContainer['nativeElement'].clientWidth -
                                            (fieldPosition[0].x * this.imageScale +
                                                (this.sizeAllImg.width -
                                                    this.sizeAllImg.pages[
                                                    this.activeField.formGroup.value.fieldPage - 1
                                                        ]['width']) /
                                                2 -
                                                40)
                                        );
                                    }
                                    if (hasScrollY) {
                                        scrollData['top'] =
                                            fieldPosition[0].y * this.imageScale +
                                            this.sizeAllImg.pages[
                                            this.activeField.formGroup.value.fieldPage - 1
                                                ]['top'] -
                                            50;
                                    }
                                    this.pagesScrollContainer['nativeElement'].scrollTo(
                                        scrollData
                                    );
                                });
                            }

                            // } else {
                            //     this.activeWord = {
                            //         position: null
                            //     };
                        } else {
                            this.inlineEditorForm.reset({});

                            if (
                                this.activeField.field &&
                                this.fieldsWithPredefinedEditData.has(
                                    this.activeField.field.fieldId + ''
                                )
                            ) {
                                this.activeWord = null;
                            }
                        }
                    }, 300);
                } else {
                    this.activeFieldName = false;
                    this.activeField = {
                        field: fileObj ? fileObj : file,
                        element: htmlElement,
                        formGroup: abstractControl as FormGroup
                    };

                    // if (!this.userService.appData.userData.companySelect.test) {
                    //     if (((fileId === 15 || fileId === 16 || fileId === 17) && !this.revaluationCurrCode) || fileId === 24) {
                    //         setTimeout(() => {
                    //             const baseElement = htmlElement.querySelector('input');
                    //             baseElement.focus();
                    //         }, 300);
                    //     }
                    // } else {

                    // }

                    if (
                        !this.activeField.formGroup.value.fieldPosition ||
                        !this.activeField.formGroup.value.fieldPosition.length
                    ) {
                        this.activeField.formGroup.value.fieldPosition =
                            this.activeField.field['fieldPosition'];
                        if (this.activeField.formGroup.value.fieldPage === null) {
                            this.activeField.formGroup.value.fieldPage = 1;
                        }
                    }

                    if (
                        this.activeField.formGroup &&
                        this.activeField.field &&
                        !this.fieldsWithPredefinedEditData.has(
                            this.activeField.field.fieldId + ''
                        ) &&
                        this.activeField.formGroup.value.fieldPage &&
                        Array.isArray(this.activeField.formGroup.value.fieldPosition) &&
                        this.activeField.formGroup.value.fieldPosition.length &&
                        this.activeField.field.fieldId !== 1
                    ) {
                        this.currentPage.next(this.activeField.formGroup.value.fieldPage);
                        const fieldPosition = JSON.parse(
                            JSON.stringify(this.activeField.formGroup.value.fieldPosition)
                        );
                        fieldPosition.forEach((it) => {
                            // it.y =  (it.y);
                            // it.x = (it.x) + ((this.sizeAllImg.pages[this.activeField.formGroup.value.fieldPage - 1].width === this.sizeAllImg.width) ? 0 : (this.sizeAllImg.pages[this.activeField.formGroup.value.fieldPage - 1].offsetPageLeft + ((this.sizeAllImg['offsetPageLeft']) + 10)));
                        });

                        this.activeWord = {
                            pageNo: this.activeField.formGroup.value.fieldPage,
                            position: fieldPosition
                        };
                        this.inlineEditorForm.reset({
                            fieldPage: this.activeField.formGroup.value.fieldPage,
                            fieldPosition: fieldPosition
                        });
                        const syms = this.visionResultsArr[
                        this.activeField.formGroup.value.fieldPage - 1
                            ].filter((sym) => {
                            if (sym.vertices.length === 4) {
                                if (sym.vertices[0].y !== sym.vertices[1].y) {
                                    sym.vertices[0].y = sym.vertices[1].y;
                                }
                                if (sym.vertices[2].y !== sym.vertices[3].y) {
                                    sym.vertices[2].y = sym.vertices[3].y;
                                }
                                if (sym.vertices[0].x !== sym.vertices[3].x) {
                                    sym.vertices[0].x = sym.vertices[3].x;
                                }
                                if (sym.vertices[1].x !== sym.vertices[2].x) {
                                    sym.vertices[1].x = sym.vertices[2].x;
                                }
                            }
                            sym.vertices.forEach((it) => {
                                if (it.x === undefined) {
                                    it.x = 0;
                                }
                                if (it.y === undefined) {
                                    it.y = 0;
                                }
                            });
                            if (
                                sym.vertices[1].x <= sym.vertices[0].x ||
                                sym.vertices[1].y >= sym.vertices[2].y
                            ) {
                                return false;
                            }
                            return this.geometryHelper.rectangleContains(
                                this.activeField.formGroup.value.fieldPosition,
                                sym.vertices
                            );
                        });

                        this.inlineEditorForm.patchValue({
                            fieldValue: this.stringifySymbols(syms)
                        });

                        const hasScrollX =
                            this.pagesScrollContainer['nativeElement'].scrollWidth -
                            this.pagesScrollContainer['nativeElement'].clientWidth !==
                            0;
                        const hasScrollY =
                            this.pagesScrollContainer['nativeElement'].scrollHeight -
                            this.pagesScrollContainer['nativeElement'].clientHeight !==
                            0;
                        if (hasScrollX || hasScrollY) {
                            requestAnimationFrame(() => {
                                // this.pageContainer.toArray()[this.activeField.formGroup.value.fieldPage - 1].nativeElement
                                //     .scrollIntoView({block: 'start', inline: 'center', behavior: 'smooth'});

                                const scrollData = {
                                    block: 'start',
                                    inline: 'center',
                                    behavior: 'smooth'
                                };
                                if (hasScrollX) {
                                    scrollData['left'] = -(
                                        this.pagesScrollContainer['nativeElement'].scrollWidth -
                                        this.pagesScrollContainer['nativeElement'].clientWidth -
                                        (fieldPosition[0].x * this.imageScale +
                                            (this.sizeAllImg.width -
                                                this.sizeAllImg.pages[
                                                this.activeField.formGroup.value.fieldPage - 1
                                                    ]['width']) /
                                            2 -
                                            40)
                                    );
                                }
                                if (hasScrollY) {
                                    scrollData['top'] =
                                        fieldPosition[0].y * this.imageScale +
                                        this.sizeAllImg.pages[
                                        this.activeField.formGroup.value.fieldPage - 1
                                            ]['top'] -
                                        50;
                                }
                                this.pagesScrollContainer['nativeElement'].scrollTo(scrollData);
                            });
                        }

                        // } else {
                        //     this.activeWord = {
                        //         position: null
                        //     };
                    } else {
                        this.inlineEditorForm.reset({});

                        if (
                            this.activeField.field &&
                            this.fieldsWithPredefinedEditData.has(
                                this.activeField.field.fieldId + ''
                            )
                        ) {
                            this.activeWord = null;
                        }
                    }
                }
            } else {
                this.activeField = null;
                this.activeFieldName = true;
            }
        }, 30);
    }

    trackCategory(index: number, item: HierarchyNode) {
        return item.category;
    }

    trackField(
        index: number,
        item: {
            fieldId: number;
            name: string;
        }
    ) {
        return item.fieldId;
    }

    // zoomBestFit(invoiceImage: Element) {
    //     if (invoiceImage instanceof HTMLImageElement) {
    //         const parentRect = invoiceImage.parentElement.getBoundingClientRect();
    //
    //         const wScale = parentRect.width / invoiceImage.width,
    //             hScale = parentRect.height / invoiceImage.height;
    //         this.imageScale = Math.min(wScale, hScale);
    //         // Math.max(wScale, hScale);
    //
    //         // this.imageScale = (parentRect.width * 0.95) / invoiceImage.width;
    //     }
    // }

    zoomBestFitSplit() {
        if (this.pageImages && this.pageImages.length) {
            const parentRect =
                this.pageImages.first.nativeElement.parentElement.getBoundingClientRect();
            const wScale =
                Math.min(parentRect.width, 1200) /
                this.pageImages.first.nativeElement.width;
            const hScale =
                parentRect.height / this.pageImages.first.nativeElement.height;
            const imageScale = Math.min(wScale, hScale);
            const newImageScale = imageScale + 0.05 * Math.sign(-1);
            if (newImageScale > 1.2 || newImageScale < 0.2) {
                this.imageScale = imageScale;
            } else {
                this.imageScale = newImageScale;
            }
        }
    }

    zoomBestFit() {
        if (this.pageImages && this.pageImages.length) {
            this.imageScale = 1;
            this.zoomBestFitBase(true);
            // const parentRect =
            //     this.pageImages.first.nativeElement.parentElement.getBoundingClientRect();
            //
            // const wScale =
            //     Math.min(parentRect.width, 1200) /
            //     this.pageImages.first.nativeElement.width;
            // const hScale =
            //     parentRect.height / this.pageImages.first.nativeElement.height;
            // // Math.max(wScale, hScale);
            //
            // // this.imageScale = (parentRect.width * 0.95) / invoiceImage.width;
            // this.imageScale = Math.min(wScale, hScale);
        }
    }

    zoomBestFitBase(reset?: boolean) {
        // console.log('-------------------------------------------------------------zoomBestFitBase');
        if (this.pageImages && this.pageImages.length) {
            if (reset) {
                const wrapImg = document.querySelector('.scroll-chrome-doc-wrap');
                const wScale =
                    Math.min(wrapImg.clientWidth, 1200) /
                    this.pageImages.first.nativeElement.naturalWidth;
                // const hScale =
                //     wrapImg.clientHeight / this.pageImages.first.nativeElement.naturalHeight;
                const imageScale = wScale;
                const newImageScale = imageScale + 0.1 * Math.sign(-1);
                this.imageScale = newImageScale;
            } else {
                const parentRect =
                    this.pageImages.first.nativeElement.parentElement.getBoundingClientRect();
                const wScale =
                    Math.min(parentRect.width, 1200) /
                    this.pageImages.first.nativeElement.width;
                const hScale =
                    parentRect.height / this.pageImages.first.nativeElement.height;
                const imageScale = Math.min(wScale, hScale);
                if (this.imageScale === 1) {
                    const newImageScale = imageScale + 0.1 * Math.sign(-1);
                    if (newImageScale > 1.2 || newImageScale < 0.2) {
                        this.imageScale = imageScale;
                    } else {
                        this.imageScale = newImageScale;
                    }
                }
            }


            this.getSizeAllImgs();
        }
    }

    getOffsetWidthMax() {
        if (this.pageImages && this.pageImages.length) {
            const offsetWidthArr = [0];
            this.pageImages.forEach((page, idx) => {
                offsetWidthArr.push(page.nativeElement.parentElement.offsetWidth);
            });
            return Math.max(...offsetWidthArr);
        } else {
            return null;
        }
    }

    // // noinspection JSUnusedLocalSymbols
    // pdfPageRendered($event: PageRenderedEvent) {
    //
    // }

    getSizeAllImgs() {
        this.dataPagesSize = [];
        const imageScaleVal = this.imageScale;
        if (this.pageImages && this.pageImages.length) {
            // const parentRect = this.pageImages.first
            //     .nativeElement.parentElement.getBoundingClientRect();
            const sizeAllImg = {
                width: 0,
                height: 0,
                offsetPageLeft: 0,
                pages: [],
                offsetWidthMax: 0
            };
            let topPadding = 7;
            const offsetWidthArr = [];
            this.pageImages.forEach((page, idx) => {
                // const heightImg1 = page.nativeElement.getBoundingClientRect().height * imageScaleVal;
                // const widthImg1 = page.nativeElement.getBoundingClientRect().width * imageScaleVal;

                const heightImg = page.nativeElement.clientHeight * imageScaleVal;
                const widthImg = page.nativeElement.clientWidth * imageScaleVal;
                // page.nativeElement.parentElement.classList.contains("expenseBorder")
                // page.nativeElement.parentElement.classList.contains("expenseBorder")
                // page.nativeElement.parentElement.classList.contains("expenseBorder")

                offsetWidthArr.push(page.nativeElement.parentElement.offsetWidth);
                // debugger
                sizeAllImg.pages.push({
                    real_width: page.nativeElement.clientWidth,
                    width: widthImg,
                    height: heightImg + 14,
                    top: sizeAllImg.height + 7,
                    offsetPageLeft:
                        (page.nativeElement.parentElement.parentElement.getBoundingClientRect()
                                .width -
                            widthImg) /
                        2 +
                        10
                });

                topPadding += 14;
                sizeAllImg.height += heightImg + 14;
                if (widthImg > sizeAllImg.width) {
                    sizeAllImg.width = widthImg;
                    sizeAllImg.offsetPageLeft =
                        (page.nativeElement.parentElement.parentElement.getBoundingClientRect()
                                .width -
                            widthImg) /
                        2 +
                        10;
                }

                const x = page.nativeElement.clientWidth / 2 - 50;
                const y = page.nativeElement.clientHeight / 2 - 15;
                this.dataPagesSize.push([
                    {x: x, y: y},
                    {x: x + 100, y: y},
                    {x: x + 100, y: y + 30},
                    {x: x, y: y + 30}
                    // {'x': 159, 'y': 24},
                    // {'x': 159 + 145, 'y': 24},
                    // {'x': 159 + 145, 'y': 24 + 30},
                    // {'x': 159, 'y': 24 + 30}
                ]);

                if (this.visionResultsArr && this.visionResultsArr.length) {
                    this.visionResultsArr[idx].forEach((mergedWords) => {
                        if (
                            Array.isArray(mergedWords.vertices) &&
                            mergedWords.vertices.length
                        ) {
                            if (mergedWords.vertices.length === 4) {
                                if (mergedWords.vertices[0].y !== mergedWords.vertices[1].y) {
                                    mergedWords.vertices[0].y = mergedWords.vertices[1].y;
                                }
                                if (mergedWords.vertices[2].y !== mergedWords.vertices[3].y) {
                                    mergedWords.vertices[2].y = mergedWords.vertices[3].y;
                                }
                                if (mergedWords.vertices[0].x !== mergedWords.vertices[3].x) {
                                    mergedWords.vertices[0].x = mergedWords.vertices[3].x;
                                }
                                if (mergedWords.vertices[1].x !== mergedWords.vertices[2].x) {
                                    mergedWords.vertices[1].x = mergedWords.vertices[2].x;
                                }

                                let isOutOfImg = false;
                                mergedWords.vertices.forEach((item) => {
                                    if (item.x > page.nativeElement.clientWidth) {
                                        // console.log(mergedWords.text);
                                        isOutOfImg = true;
                                        // debugger
                                    }
                                    if (item.y > page.nativeElement.clientHeight) {
                                        // console.log(mergedWords.text);
                                        isOutOfImg = true;
                                        // debugger
                                    }
                                });
                                if (isOutOfImg) {
                                    mergedWords.vertices = [
                                        {x: 159, y: 24},
                                        {x: 159 + 145, y: 24},
                                        {x: 159 + 145, y: 24 + 30},
                                        {x: 159, y: 24 + 30}
                                    ];
                                }
                            }
                        }
                    });
                }
            });
            sizeAllImg.pages.forEach((page, idx) => {
                page.spaceLeft = (sizeAllImg.width - page.width) / 2;
            });
            // console.log(this.dataPagesSize);

            for (const cat of this.fileDetailsSave.fieldsHierarchy) {
                for (const fld of cat.fields) {
                    try {
                        const fileFld = cat.fields.find(
                            (fdf) => fdf.fieldId === fld.fieldId
                        );
                        const real_width =
                            sizeAllImg.pages[fld.fieldPage ? fld.fieldPage - 1 : 0]
                                .real_width;
                        // console.log('real_width', real_width);
                        if (
                            fileFld &&
                            Array.isArray(fileFld.fieldPosition) &&
                            fileFld.fieldPosition.length
                        ) {
                            let isOutOfBorders = false;
                            fileFld.fieldPosition.forEach((ver) => {
                                if (ver.x > real_width) {
                                    // console.log(fileFld);
                                    // debugger
                                    isOutOfBorders = true;
                                }
                            });
                            if (isOutOfBorders) {
                                fld.fieldPosition = [
                                    {x: 159, y: 24},
                                    {x: 159 + 145, y: 24},
                                    {x: 159 + 145, y: 24 + 30},
                                    {x: 159, y: 24 + 30}
                                ];
                                fld.fieldPositionFake = true;
                                fld.fieldPage = 1;
                                if (this.fileFieldsForm.get(fld.fieldId.toString())) {
                                    const forms = this.fileFieldsForm.get(fld.fieldId.toString());
                                    forms.get('fieldPosition').patchValue(fld.fieldPosition, {
                                        emitEvent: false,
                                        onlySelf: true
                                    });
                                }
                            }
                        }

                        if (fld.valueType === 'NUMBER' || fld.valueType === 'STRING') {
                            if (
                                fileFld &&
                                !fileFld.valueTypeOv &&
                                fileFld.fieldValue === null
                            ) {
                                fld.fieldPosition = [
                                    {x: 159, y: 24},
                                    {x: 159 + 145, y: 24},
                                    {x: 159 + 145, y: 24 + 30},
                                    {x: 159, y: 24 + 30}
                                ];
                                fld.fieldPositionFake = true;
                                fld.fieldPage = 1;
                                if (this.fileFieldsForm.get(fld.fieldId.toString())) {
                                    const forms = this.fileFieldsForm.get(fld.fieldId.toString());
                                    forms.get('fieldPosition').patchValue(fld.fieldPosition, {
                                        emitEvent: false,
                                        onlySelf: true
                                    });
                                }
                            } else {
                                if (
                                    this.dataPagesSize.length &&
                                    (!Array.isArray(fileFld.fieldPosition) ||
                                        (Array.isArray(fileFld.fieldPosition) &&
                                            !fileFld.fieldPosition.length))
                                ) {
                                    fld.fieldPosition =
                                        this.dataPagesSize[fld.fieldPage ? fld.fieldPage - 1 : 0];
                                    fld.fieldPositionFake = true;
                                    fld.fieldPage = 1;
                                    if (this.fileFieldsForm.get(fld.fieldId.toString())) {
                                        const forms = this.fileFieldsForm.get(
                                            fld.fieldId.toString()
                                        );
                                        forms.get('fieldPosition').patchValue(fld.fieldPosition, {
                                            emitEvent: false,
                                            onlySelf: true
                                        });
                                    }
                                }
                            }
                        }
                    } catch (e) {
                    }
                }
            }

            // console.log('offsetWidth: ', offsetWidthArr);
            // console.log('Math.max: ', Math.max(...offsetWidthArr));
            sizeAllImg.offsetWidthMax = Math.max(...offsetWidthArr);
            this.sizeAllImg = sizeAllImg;

            // console.log('sizeAllImg', sizeAllImg);
            // this.sizeAllImg.pages[this.activeWord.pageNo].offsetPageLeft
            // this.sizeAllImg.pages[this.activeWord.pageNo].top
            return true;
        } else {
            this.sizeAllImg = false;
            return false;
        }
    }

    zoomStep(direction: number) {
        const newImageScale = this.imageScale + 0.1 * Math.sign(direction);
        // if (newImageScale > 1.2 || newImageScale < 0.2) {
        //     return;
        // }
        this.imageScale = newImageScale;
        this.getSizeAllImgs();
    }

    zoomStepInside(direction: number, type: string) {
        const newImageScale = this[type] + 0.1 * Math.sign(direction);
        // if (newImageScale > 1.6 || newImageScale < 0.2) {
        //     return;
        // }
        this[type] = newImageScale;
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

    returnAsmachtaDigits(fieldValue: any) {
        if (fieldValue !== null && fieldValue !== undefined) {
            const val = fieldValue.replace(/\D/g, '');
            if (val) {
                if (
                    this.fileDetailsSave.supplierAsmachtaNumChar &&
                    this.fileDetailsSave.supplierAsmachtaNumChar > 0
                ) {
                    return val.slice(
                        -Number(this.fileDetailsSave.supplierAsmachtaNumChar)
                    );
                } else {
                    return val;
                }
            } else {
                return '';
            }
        } else {
            return '';
        }
    }

    getHeightScrollDoc(size: any): number {
        return (
            (window.innerHeight ||
                document.documentElement.clientHeight ||
                document.body.clientHeight) -
            size -
            1
        );
        // if (((window.innerWidth / window.outerWidth) !== 1)) {
        //     let divideNum = 1;
        //     if (
        //         (((window.innerWidth / window.outerWidth) === 1) && window.devicePixelRatio === 2)
        //         ||
        //         navigator.userAgent.includes('Macintosh')
        //     ) {
        //         divideNum = 2;
        //     }
        //     const perInnerHeight = ((window.innerHeight / 100) * (100 - ((((window.devicePixelRatio * 100) / divideNum) - 100))));
        //     const innerHeightOfReg = window.innerHeight + (window.innerHeight - perInnerHeight);
        //     console.log('innerHeightOfReg-size-1', innerHeightOfReg - size - 1);
        //     return (innerHeightOfReg - size - 1);
        // } else {
        //     return (
        //         (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight)
        //         - size
        //         - 1);
        // }
    }

    hoverCanvas(e: any) {
        // console.log('target', e);
        // const scrollOffsetTop = e.target.scrollTop + e.target.offsetHeight;
        // console.log('scrollOffsetTop', scrollOffsetTop);
        //
        // console.log('event.currentTarget.offsetTop', e.currentTarget.offsetTop);
        //
        this.overOnCanvas = false;

        if (e.target.nodeName === 'CANVAS') {
            const rect = e.target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            console.log('x', x);
            console.log('y', y);

            const topStart =
                (this.sizeAllImg.pages[this.activeWord.pageNo - 1]['top'] +
                    this.activeWord.position[0].y) *
                this.imageScale;
            const topEnd =
                (this.sizeAllImg.pages[this.activeWord.pageNo - 1]['top'] +
                    this.activeWord.position[2].y) *
                this.imageScale;
            const leftStart = this.activeWord.position[0].x * this.imageScale;
            const leftEnd = this.activeWord.position[1].x * this.imageScale;

            console.log('topStart', topStart);
            // console.log('topEnd', topEnd);

            console.log('leftStart', leftStart);
            // console.log('leftEnd', leftEnd);

            if (y >= topStart && y <= topEnd && x >= leftStart && x <= leftEnd) {
                console.log('within the borders!');
                this.overOnCanvas = true;
            }
        }

        // fieldPositionMutatedVerticesImageScale.forEach(it => {
        //     it.y = (it.y * this.imageScale) - this.sizeAllImg.pages[indexOfCurentPage]['top'] - 7;
        //     it.x = (it.x * this.imageScale) - ((this.sizeAllImg.width - this.sizeAllImg.pages[indexOfCurentPage]['width']) / 2);
        // });
    }

    setPageNum(event: any) {
        // console.log('target', event.target);
        // console.log('scrollTop', event.target.scrollTop);
        // console.log('offsetHeight', event.target.offsetHeight);
        // console.log('scrollTop+offsetHeight', event.target.scrollTop + event.target.offsetHeight);
        if (this.pageContainer.toArray().length > 1) {
            const scrollOffsetTop =
                event.target.scrollTop + event.target.offsetHeight;
            const pageNo = this.pageContainer
                .toArray()
                .findIndex((element, index) => {
                    // console.log('index---', element.nativeElement.offsetTop)
                    if (index + 1 === this.pageContainer.toArray().length) {
                        return scrollOffsetTop > element.nativeElement.offsetTop;
                    } else {
                        return (
                            scrollOffsetTop > element.nativeElement.offsetTop &&
                            scrollOffsetTop <=
                            this.pageContainer.toArray()[index + 1].nativeElement.offsetTop
                        );
                    }
                });
            // console.log('pageNo----', pageNo + 1);
            this.currentPage.next(pageNo + 1);
        }
    }

    hideOpenedPanels() {
        // console.log("1");
        this.formDropdowns
            .filter((item) => item.overlayVisible === true)
            .forEach((item) => item.hide());
        this.formCalendars
            .filter((item) => item.overlayVisible === true)
            .forEach((item) => (item.overlayVisible = false));
    }

    generateBezierConnector(
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        tension: number
    ): string {
        if (tension < 0) {
            const delta = (y2 - y1) * tension;
            const hx1 = x1;
            const hy1 = y1 - delta;
            const hx2 = x2;
            const hy2 = y2 + delta;
            return (
                'M ' +
                x1 +
                ' ' +
                y1 +
                ' C ' +
                hx1 +
                ' ' +
                hy1 +
                ' ' +
                hx2 +
                ' ' +
                hy2 +
                ' ' +
                x2 +
                ' ' +
                y2
            );
        } else {
            const delta = (x2 - x1) * tension;
            const hx1 = x1 + delta;
            const hy1 = y1;
            const hx2 = x2 - delta;
            // noinspection UnnecessaryLocalVariableJS
            const hy2 = y2;
            return (
                'M ' +
                x1 +
                ' ' +
                y1 +
                ' C ' +
                hx1 +
                ' ' +
                hy1 +
                ' ' +
                hx2 +
                ' ' +
                hy2 +
                ' ' +
                x2 +
                ' ' +
                y2
            );
        }
    }

    // locateInplaceEditor(activeWordElement: Element, scrollContainer: HTMLDivElement, width = 160, activeWordElementaaa): {
    public getScrollLeft(pagesScrollContainer) {
        if (pagesScrollContainer) {
            const scrollLeftPos = pagesScrollContainer.nativeElement.scrollLeft;
            // // console.log('scrollLeftPos: ', scrollLeftPos);
            // // console.log('(pagesScrollContainer.nativeElement.scrollWidth - pagesScrollContainer.nativeElement.clientWidth): ', (pagesScrollContainer.nativeElement.scrollWidth - pagesScrollContainer.nativeElement.clientWidth))
            // //
            // // let left = Math.abs(scrollLeftPos);
            // //let left = ((this.pagesScrollContainer['nativeElement'].scrollWidth - this.pagesScrollContainer['nativeElement'].clientWidth)) - 5;
            // const isScrollW = (pagesScrollContainer.nativeElement.scrollWidth - pagesScrollContainer.nativeElement.clientWidth);
            // const left = (((pagesScrollContainer.nativeElement.scrollWidth) - (this.sizeAllImg.pages[this.activeWord.pageNo - 1].width)) / 2) + 5;
            // console.log('isScrollW:', isScrollW, 'left:', left, 'scrollLeftPos:', scrollLeftPos);

            // console.log('pagesScrollContainer[\'nativeElement\'].scrollWidth', pagesScrollContainer['nativeElement'].scrollWidth);
            // console.log('pagesScrollContainer[\'nativeElement\'].clientWidth', pagesScrollContainer['nativeElement'].clientWidth);
            // console.log(this.sizeAllImg.pages[this.activeWord.pageNo - 1]);

            const spaceScrollLeft =
                pagesScrollContainer['nativeElement'].scrollWidth -
                pagesScrollContainer['nativeElement'].clientWidth;
            let left = this.activeWord.position[1].x * this.imageScale;
            if (spaceScrollLeft <= 1) {
                // console.log('spaceScrollLeft', spaceScrollLeft);
                left +=
                    (pagesScrollContainer['nativeElement'].scrollWidth -
                        this.sizeAllImg.pages[this.activeWord.pageNo - 1].width) /
                    2;
                return left + 12;
            } else {
                // console.log('spaceScrollLeft', spaceScrollLeft);
                // console.log('scrollLeftPos', scrollLeftPos, spaceScrollLeft - Math.abs(scrollLeftPos));

                left -= spaceScrollLeft - Math.abs(scrollLeftPos);
                return left + 19;
            }

            // if (this.isWindows) {
            //     return isScrollW === 0 ? (left + 7) : (-(isScrollW) + Math.abs(scrollLeftPos) + 17);
            // } else {
            //     return isScrollW < 0 ? (left + 7) : (-(isScrollW) + Math.abs(scrollLeftPos) + 17);
            // }
        } else {
            return 0;
        }
    }

    locateInplaceEditor(
        activeWordElement: any,
        scrollContainer: HTMLDivElement,
        width = 160
    ): {
        top: number;
        left: number;
    } {
        // debugger;
        // const activeWord_height = this.activeWord.position[3].y - this.activeWord.position[0].y;
        // const activeWord_width = this.activeWord.position[1].x - this.activeWord.position[0].x;
        // const activeWord_left = this.activeWord.position[0].x;
        // const activeWord_top = this.sizeAllImg.pages[this.activeWord.pageNo - 1]['top'];

        // console.log('activeWord_top:', activeWord_top);
        // console.log('this.activeWord.pageNo:', this.activeWord.pageNo);
        // console.log('activeWord_height:', activeWord_height);
        // const documentImage = (activeWordElement.pageImage as HTMLImageElement);
        const top =
            this.sizeAllImg.pages[this.activeWord.pageNo - 1]['top'] +
            this.activeWord.position[2].y * this.imageScale +
            2;
        // const left = (this.activeWord.position[1].x * this.imageScale) - ((((this.activeWord.position[1].x - this.activeWord.position[0].x) * this.imageScale)) / 2);
        // let left = this.sizeAllImg.pages[this.activeWord.pageNo - 1]['offsetPageLeft'] - 10 + (this.activeWord.position[0].x * this.imageScale) + (((this.activeWord.position[1].x - this.activeWord.position[0].x) * this.imageScale) / 2) - 80;
        //
        // if (this.sizeAllImg.pages[this.activeWord.pageNo - 1].width >= this.sizeAllImg.width && (this.pagesScrollContainer['nativeElement'].scrollWidth - this.pagesScrollContainer['nativeElement'].clientWidth) > 0) {
        //     left -= ((this.pagesScrollContainer['nativeElement'].scrollWidth - this.pagesScrollContainer['nativeElement'].clientWidth) / 2) - ((this.pagesScrollContainer['nativeElement'].scrollWidth - this.pagesScrollContainer['nativeElement'].clientWidth) === 0 ? 0 : 5);
        // }

        // console.log('sizeAllImg', this.sizeAllImg);
        //         console.log('scrollWidth', this.pagesScrollContainer['nativeElement'].scrollWidth);
        //         console.log('clientWidth', this.pagesScrollContainer['nativeElement'].clientWidth);
        //         console.log('offsetWidth', this.pagesScrollContainer['nativeElement'].offsetWidth);

        // const left =  ((this.activeWord.position[0].x * this.imageScale) + ((((this.pagesScrollContainer['nativeElement'].offsetWidth) - (this.sizeAllImg.pages[this.activeWord.pageNo - 1].width)) / 2))) - spaceScrollLeft - (this.sizeAllImg.offsetPageLeft + 17);

        const spaceScrollLeft =
            this.pagesScrollContainer['nativeElement'].scrollWidth -
            this.pagesScrollContainer['nativeElement'].clientWidth;
        const left =
            this.activeWord.position[0].x * this.imageScale +
            ((this.activeWord.position[1].x - this.activeWord.position[0].x) *
                this.imageScale) /
            2 -
            80 +
            (this.pagesScrollContainer['nativeElement'].scrollWidth -
                this.sizeAllImg.pages[this.activeWord.pageNo - 1].width) /
            2 -
            spaceScrollLeft;

        return {
            top: top,
            left: left
        };

        // const documentImage = ((activeWordElement as SVGPolygonElement).viewportElement.previousElementSibling.previousElementSibling as HTMLImageElement);
        // const top = activeWordElement.getBoundingClientRect().bottom
        //     - scrollContainer.getBoundingClientRect().top
        //     + documentImage.offsetTop * this.imageScale
        //     + scrollContainer.scrollTop
        //     + 4;
        // let left = activeWordElement.getBoundingClientRect().left + activeWordElement.getBoundingClientRect().width / 2
        //     - scrollContainer.getBoundingClientRect().left
        //     + (scrollContainer.scrollLeft !== 0 ? documentImage.offsetLeft * this.imageScale : 0)
        //     + scrollContainer.scrollLeft
        //     - (width / 2);
        // if (left < documentImage.offsetLeft * this.imageScale) {
        //     left = documentImage.offsetLeft * this.imageScale;
        // } else if (left + width > (documentImage.offsetLeft + documentImage.offsetWidth) * this.imageScale) {
        //     left = (documentImage.offsetLeft + documentImage.offsetWidth) * this.imageScale - width;
        // }
        // return {
        //     top: top,
        //     left: left
        // };
    }

    inplaceEditorApprove(
        value: {
            fieldValue: string;
            fieldPage: number;
            fieldPosition: Array<{ x: number; y: number }>;
        },
        ocrField: OcrField
    ) {
        const fieldGroup = this.fileFieldsForm.get(
            String(ocrField.fieldId)
        ) as FormGroup;
        if (fieldGroup) {
            let valueToApply = null;
            switch (ocrField.valueType) {
                case 'DATE': {
                    const allowedDateFormats = [
                        'DD/MM/YYYY',
                        'D/M/YYYY',
                        'DD/MM/YY',
                        'D/M/YY',
                        'DD/MM/yyyy',
                        'DD.MM.yyyy',
                        'DD-MM-yyyy',
                        'D/M/yyyy',
                        'D.M.yyyy',
                        'D-M-yyyy',
                        'D/M/yy',
                        'D.M.yy',
                        'D-M-yy',
                        'DD/MM/yy',
                        'DD.MM.yy',
                        'DD-MM-yy',
                        'DD/MMM/yyyy',
                        'DD.MMM.yyyy',
                        'DD-MMM-yyyy',
                        'DD,MMM,yyyy',
                        'D/MMM/yy',
                        'D.MMM.yy',
                        'D-MMM-yy',
                        'D,MMM,yy',
                        'DD MMMM yyyy',
                        'DD MMM yyyy',
                        'DD MMM yy',
                        'DD/MMMM/yyyy',
                        'DD.MMMM.yyyy',
                        'DD-MMMM-yyyy',
                        'DD,MMMM,yyyy',
                        'D/MMMM/yy yyyy/MM/DD',
                        'D.MMMM.yy yyyy.MM.DD',
                        'D-MMMM-yy yyyy-MM-DD',
                        'D,MMMM,yy yyyy,MM,DD',
                        'yyyy/M/D',
                        'yyyy.M.D',
                        'yyyy-M-D',
                        'yy/MM/DD',
                        'yy.MM.DD',
                        'yy-MM-DD',
                        'yy/MM/D',
                        'yy.MM.D',
                        'yy-MM-D',
                        'yyyy/DD/MMM\'',
                        'yyyy.DD.MMM\'',
                        'yyyy-DD-MMM\'',
                        'yyyy/MMM/DD\'',
                        'yyyy.MMM.DD\'',
                        'yyyy-MMM-DD\'',
                        'yyyy,MMM,DD\'',
                        'yyyy/D/MMM\'',
                        'yyyy.D.MMM\'',
                        'yyyy-D-MMM\'',
                        'yyyy,D,MMM\'',
                        'yyyy/MMM/D',
                        'yyyy.MMM.D',
                        'yyyy-MMM-D',
                        'yyyy,MMM,D',
                        'yyyy/DD/MMMM',
                        'yyyy.DD.MMMM',
                        'yyyy-DD-MMMM',
                        'yyyy,DD,MMMM',
                        'yyyy/D/MMMM MM/DD/yyyy',
                        'yyyy.D.MMMM MM.DD.yyyy',
                        'yyyy-D-MMMM MM-DD-yyyy',
                        'yyyy,D,MMMM MM,DD,yyyy',
                        'M/D/yyyy',
                        'M.D.yyyy',
                        'M-D-yyyy',
                        'MM/DD/yy',
                        'MM.DD.yy',
                        'MM-DD-yy',
                        'M/D/yy',
                        'M.D.yy',
                        'M-D-yy',
                        'MMM/DD/yyyy',
                        'MMM.DD.yyyy',
                        'MMM-DD-yyyy',
                        'MMM,DD,yyyy',
                        'MMM/D/yy',
                        'MMM.D.yy',
                        'MMM-D-yy',
                        'MMM,D,yy',
                        'MMMM/DD/yyyy',
                        'MMMM.DD.yyyy',
                        'MMMM-DD-yyyy',
                        'MMMM,DD,yyyy',
                        'MMMM/D/yy',
                        'MMMM D yy',
                        'MMMM D yyyy',
                        'MMMM D, yyyy',
                        'MMM. DD, YYYY',
                        'MMMM DD, YYYY',
                        'MMMM DD,YYYY',
                        'MMM DD, YYYY',
                        'MMM DD,YYYY',
                        'MMM.DD,YYYY',
                        'MMM. D, YYYY',
                        'MMMM D, YYYY',
                        'MMMM D,YYYY',
                        'MMM D, YYYY',
                        'MMM D,YYYY',
                        'MMM.D,YYYY',
                        'MMMM.D.yy',
                        'MMMM-D-yy',
                        'MMMM,D,yy'
                    ];
                    const valCandidate = this.userService.appData
                        .moment(value.fieldValue, allowedDateFormats, true)
                        .lang(['he', 'en', 'fr']);
                    const valCandidateWithoutSpace = this.userService.appData
                        .moment(
                            value.fieldValue.replace(/\s+/g, ''),
                            allowedDateFormats,
                            true
                        )
                        .lang(['he', 'en', 'fr']);

                    if (valCandidate.isValid()) {
                        const isLateThanYear = valCandidate.isSameOrBefore(this.userService.appData
                            .moment()
                            .add(1, 'years')
                            .endOf('year')
                            .endOf('day')
                            .toDate());
                        if (!isLateThanYear) {
                            this.inlineEditorForm.setErrors({
                                shouldNotLateThanYearDate: true
                            });
                            return;
                        }
                        valueToApply = {
                            fieldPage: value.fieldPage,
                            fieldPosition: value.fieldPosition,
                            effectiveValue: valCandidate.toDate()
                        };
                    } else if (valCandidateWithoutSpace.isValid()) {
                        const isLateThanYear = valCandidateWithoutSpace.isSameOrBefore(this.userService.appData
                            .moment()
                            .add(1, 'years')
                            .endOf('year')
                            .endOf('day')
                            .toDate());
                        if (!isLateThanYear) {
                            this.inlineEditorForm.setErrors({
                                shouldNotLateThanYearDate: true
                            });
                            return;
                        }
                        valueToApply = {
                            fieldPage: value.fieldPage,
                            fieldPosition: value.fieldPosition,
                            effectiveValue: valCandidateWithoutSpace.toDate()
                        };
                    } else {
                        this.inlineEditorForm.setErrors({
                            shouldBeDate: true
                        });
                    }
                    break;
                }
                case 'NUMBER': {
                    const valCandidate =
                        value.fieldValue === null ||
                        !/\d/g.test(value.fieldValue.toString().replace(/[^0-9.]/g, ''))
                            ? null
                            : Number(value.fieldValue.toString().replace(/[^0-9.]/g, ''));
                    if (
                        (valCandidate !== null && !isNaN(valCandidate)) ||
                        (ocrField.fieldId === 3 && this.editHp && valCandidate === null)
                    ) {
                        valueToApply = {
                            fieldPage: value.fieldPage,
                            fieldPosition: value.fieldPosition,
                            effectiveValue:
                                ocrField.fieldId === 3 && this.editHp && valCandidate === null
                                    ? 0
                                    : valCandidate
                        };
                    } else {
                        this.inlineEditorForm.setErrors({
                            shouldBeNumber: true
                        });
                    }
                    break;
                }
                default:
                    valueToApply = {
                        fieldPage: value.fieldPage,
                        fieldPosition: value.fieldPosition,
                        effectiveValue: value.fieldValue
                    };
                    break;
            }
            if (valueToApply) {
                if (this.inlineEditorForm.get('fieldValue').dirty) {
                    fieldGroup.get('effectiveValue').markAsDirty();
                } else {
                    fieldGroup.get('effectiveValue').markAsPristine();
                }

                this.focusInput[ocrField.fieldId] = ocrField.fieldId !== 33;
                if ([13, 11, 16, 17, 15, 7, 18, 25].includes(ocrField.fieldId)) {
                    const pageIndex = value.fieldPage - 1;
                    const pageWords =
                        Array.isArray(this.visionResultsArr) &&
                        pageIndex < this.visionResultsArr.length
                            ? this.visionResultsArr[pageIndex]
                            : [];
                    const result = this.locateUserSearchkeyFrom(value, pageWords);
                    fieldGroup.patchValue(
                        Object.assign(
                            valueToApply,
                            result !== null
                                ? result
                                : {
                                    searchkey: null,
                                    locationNo: null,
                                    locationDesc: null
                                }
                        )
                    );
                    this.activeWord = null;
                } else {
                    fieldGroup.patchValue(valueToApply);
                    this.activeWord = null;
                }
            }
        }
    }

    public async getFile(contentUrl: string): Promise<Blob> {
        return lastValueFrom(this.http
            .get(contentUrl, {
                responseType: 'blob'
            }));
    }

    // private documentSetStatusThenProceedToNext(status: FileStatus, actionButton: HTMLButtonElement): Observable<any> {
    //     const fileStatusChangeObs = this.fileId$
    //         .pipe(
    //             // tap(() => {
    //             //     if (actionButton) {
    //             //         requestAnimationFrame(() => actionButton.disabled = true);
    //             //     }
    //             // }),
    //             switchMap(fileId => this.ocrService.setFileStatus({fileId: fileId, fileStatus: status})) // ,
    //             // tap(() => {
    //             //     // this.docsCenterComponent.companiesSummaryForceReload$.next();
    //             //     // this.docsCenterComponent.documentsForceReload$.next(true);
    //             //
    //             //     if (actionButton) {
    //             //         requestAnimationFrame(() => actionButton.disabled = false);
    //             //     }
    //             // })
    //         );
    //     return fileStatusChangeObs;
    //     // return this.attachParentDocumentsReloadAndProceedToNext(fileStatusChangeObs);
    // }

    // private attachParentDocumentsReloadAndProceedToNext(obsToWrap: Observable<any>): Observable<any> {
    //     return obsToWrap
    //         .pipe(
    //             tap(() => {
    //                 this.docsCenterComponent.companiesSummaryForceReload$.next();
    //                 this.docsCenterComponent.documentsForceReload$.next(true);
    //             }),
    //             withLatestFrom(this.navigatorData$),
    //             tap(([, navData]) => {
    //                 if (!navData.total) {
    //                     this.navigateToCreateHashBankStatusPrompt.visible = true;
    //                 } else {
    //                     // noinspection JSIgnoredPromiseFromCall
    //                     this.router.navigate(
    //                         navData.forwardLink ? ['..', navData.forwardLink] : ['..'],
    //                         {
    //                             relativeTo: this.route,
    //                             queryParamsHandling: 'preserve'
    //                         }); // .then(() => this.docsCenterComponent.documentsForceReload$.next(false));
    //                 }
    //             })
    //         );
    // }

    createImageBase64FromBlob(blobFile: Blob, getSizes?: boolean): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader: any = new FileReader();
            reader.onload = (evt) => {
                const result = (evt.target as any).result;
                if (!getSizes) {
                    resolve(result);
                } else {
                    const image = new Image();
                    image.src = result;
                    image.onload = function () {
                        resolve({
                            width: image.width,
                            height: image.height,
                            result: result
                        });
                    };
                }
            };
            reader.readAsDataURL(blobFile);
        });
    }

    downloadContent(isPrint?: any) {
        zip(this.cachedContent$, this.fileDetails$)
            .pipe(take(1))
            .subscribe(async ([content, fileDetails]: any) => {
                if (fileDetails.pages.length > 1) {
                    if (isPrint) {
                        this.reportService.reportIsProcessingPrint$.next(true);
                    } else {
                        this.reportService.reportIsProcessing$.next(true);
                    }
                }

                let doc = new jsPDF({
                    orientation: 'p',
                    unit: 'px',
                    format: 'a4',
                    putOnlyUsedFonts: true,
                    hotfixes: ['px_scaling']
                });
                let width = doc.internal.pageSize.getWidth();
                let height = doc.internal.pageSize.getHeight();
                for (let i = 0; i < fileDetails.pages.length; i++) {
                    const x: any = await this.getFile(fileDetails.pages[i].contentUrl);
                    const imageBase64 = await this.createImageBase64FromBlob(x, true);

                    let outputWidth = imageBase64.width;
                    let outputHeight = imageBase64.height;

                    if (outputWidth > outputHeight && fileDetails.pages.length === 1) {
                        doc = new jsPDF({
                            orientation: 'l',
                            unit: 'px',
                            format: 'a4',
                            putOnlyUsedFonts: true,
                            hotfixes: ['px_scaling']
                        });
                        width = doc.internal.pageSize.getWidth();
                        height = doc.internal.pageSize.getHeight();
                    }
                    if (imageBase64.width > width || imageBase64.height > height) {
                        const inputImageAspectRatio =
                            imageBase64.height > imageBase64.width
                                ? imageBase64.width / imageBase64.height
                                : imageBase64.height / imageBase64.width;
                        if (imageBase64.height > height) {
                            outputHeight = height;
                            outputWidth = height * inputImageAspectRatio;
                        } else  if (imageBase64.width > width) {
                            outputWidth = width;
                            outputHeight = width / inputImageAspectRatio;
                        }
                    }

                    doc.addImage(
                        imageBase64.result,
                        'JPEG',
                        (width - outputWidth) / 2,
                        0,
                        outputWidth,
                        outputHeight
                    );
                    if (
                        fileDetails.pages.length > 1 &&
                        i + 1 !== fileDetails.pages.length
                    ) {
                        doc.addPage('a4', 'p');
                    }
                }
                if (!isPrint) {
                    this.reportService.reportIsProcessing$.next(false);
                    const fileName =
                        (
                            this._fileScanView.originalFileName || this._fileScanView.name
                        ).split('.')[0] + '.pdf';
                    doc.save(fileName);
                } else {
                    this.reportService.reportIsProcessingPrint$.next(false);
                    doc.autoPrint();
                    const oHiddFrame: any = document.createElement('iframe');
                    oHiddFrame.style.position = 'fixed';
                    oHiddFrame.style.visibility = 'hidden';
                    oHiddFrame.src = doc.output('bloburl');
                    document.body.appendChild(oHiddFrame);
                }
            });
    }

    // noinspection JSUnusedLocalSymbols
    documentArchive(srcElement: Element) {
        this.postponed = {
            action: this.ocrService.setFileStatus(
                this._fileScanView.fileId,
                FileStatus.ARCHIVE
            ),
            message: this.domSanitizer.bypassSecurityTrustHtml(
                'המסמך הועבר ' + '<b>' + 'לארכיון' + '</b>'
            )
        };

        // this.postponed = {
        //     action: this.documentSetStatusThenProceedToNext(FileStatus.ARCHIVE, srcElement as HTMLButtonElement),
        //     message: this.domSanitizer.bypassSecurityTrustHtml('המסמך הועבר ' + '<b>' + 'לארכיון' + '</b>')
        // };
        //
        // // this.documentSetStatusThenProceedToNext(FileStatus.ARCHIVE, srcElement as HTMLButtonElement)
        // //     .pipe(
        // //         take(1)
        // //     ).subscribe(() => {});
    }

    scrollToBottom(fieldsList: any) {
        if (!fieldsList) {
            return;
        }
        requestAnimationFrame(() =>
            fieldsList.scrollTo({
                top: fieldsList.getBoundingClientRect().height
            })
        );
        // requestAnimationFrame(() => fieldsList.scrollIntoView({
        //     block: 'end'
        //     inline: 'nearest'
        // }));
    }

    toggleFlagOn(fileDetails: FileDetails) {
        const newFlagValue = !(fileDetails.flag === true);
        this.ocrService
            .setFileData({
                fileId: this._fileScanView.fileId,
                flag: newFlagValue,
                note: fileDetails.note
            })
            .subscribe((response: any) => {
                this.fileChange = true;
                fileDetails.flag = newFlagValue;
                // this.docsCenterComponent.companiesSummaryForceReload$.next();
                // this.docsCenterComponent.documentsForceReload$.next(true);
                const bodyRes = response ? response['body'] : response;
                const statusRes = response ? response.status : response;
                if (statusRes === 422) {
                    this.fileChange = true;
                    if (bodyRes.redoFor) {
                        this._fileScanView.fileId = bodyRes.redoFor;
                        this.setFile(this._fileScanView);
                    } else {
                        this.goToRow.emit({
                            refresh: this.fileChange,
                            response: this._fileScanView.fileId
                        });
                    }
                }
            });
    }

    navigateToDocumentPage(pageNo: number) {
        if (
            this.activeField &&
            this.activeField.formGroup &&
            this.activeField.formGroup.value.fieldPage !== pageNo &&
            this.activeWord
        ) {
            this.activeWord = null;
            this.inlineEditorForm.reset({});
        }

        this.pageContainer.toArray()[pageNo - 1].nativeElement.scrollIntoView({
            block: 'start',
            inline: 'center',
            behavior: 'smooth'
        });
        // this.currentPage.next(pageNo);
    }

    cardsChangeSelected() {
        this.modalEditCardsBeforeSend.fired = true;
        this.fileFieldsForm
            .get(this.modalEditCardsBeforeSend.type.toString())
            .patchValue({
                effectiveValue: this.modalEditCardsBeforeSend.newVal
            });
        this.fireIndexDataAfterClosePopUpFunc();

        // if (this.modalEditCardsBeforeSend.setFieldValueForFuture === 1) {
        //
        //     // if (this.modalEditCardsBeforeSend.type === 2) {
        //     //     this.ocrService.custDefault(Object.assign({
        //     //         companyId: this.userService.appData.userData.companySelect.companyId,
        //     //         sourceProgramId: this.userService.appData.userData.companySelect.sourceProgramId,
        //     //         custId: this.modalEditCardsBeforeSend.newVal.custId,
        //     //         supplierHp: this.modalEditCardsBeforeSend.hp,
        //     //         expense: this.fileFieldsForm.get('21').get('effectiveValue').value
        //     //         // supplierHp: this.modalEditCardsBeforeSend.newVal.effectiveValue.hp
        //     //     }, (!this.fileFieldsForm.get('3').value.effectiveValue && this.companyIdentificationId) ? {
        //     //         companyIdentificationId: this.companyIdentificationId
        //     //     } : {})).subscribe(() => {
        //     //             this.fileFieldsForm.get(this.modalEditCardsBeforeSend.type.toString()).patchValue({
        //     //                 effectiveValue: this.modalEditCardsBeforeSend.newVal
        //     //             });
        //     //             this.fireIndexDataAfterClosePopUpFunc();
        //     //         }, (err: HttpErrorResponse) => {
        //     //             if (err.error) {
        //     //                 console.log('An error occurred:', err.error.message);
        //     //             } else {
        //     //                 console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        //     //             }
        //     //
        //     //             this.modalEditCardsBeforeSend = false;
        //     //             this.fireIndexDataAfterClosePopUpFunc();
        //     //         }
        //     //     );
        //     // }
        //     // if (this.modalEditCardsBeforeSend.type === 6) {
        //     //     this.ocrService.oppositeCustDefault({
        //     //         companyId: this.userService.appData.userData.companySelect.companyId,
        //     //         sourceProgramId: this.userService.appData.userData.companySelect.sourceProgramId,
        //     //         // custId: this.fileFieldsForm.get('2').get('effectiveValue').value.custId,
        //     //         oppositeCustId: this.modalEditCardsBeforeSend.newVal.custId,
        //     //         expense: this.fileFieldsForm.get('21').get('effectiveValue').value,
        //     //         companyIdentificationId: this.companyIdentificationId,
        //     //         supplierHp: this.fileFieldsForm.get('3').value.effectiveValue
        //     //     }).subscribe(() => {
        //     //             this.fileFieldsForm.get(this.modalEditCardsBeforeSend.type.toString()).patchValue({
        //     //                 effectiveValue: this.modalEditCardsBeforeSend.newVal
        //     //             });
        //     //             this.fireIndexDataAfterClosePopUpFunc();
        //     //         }, (err: HttpErrorResponse) => {
        //     //             if (err.error) {
        //     //                 console.log('An error occurred:', err.error.message);
        //     //             } else {
        //     //                 console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        //     //             }
        //     //
        //     //             this.modalEditCardsBeforeSend = false;
        //     //             this.fireIndexDataAfterClosePopUpFunc();
        //     //         }
        //     //     );
        //     // }
        //     // if (this.modalEditCardsBeforeSend.type !== 2 && this.modalEditCardsBeforeSend.type !== 6) {
        //     //     this.fileFieldsForm.get(this.modalEditCardsBeforeSend.type.toString()).patchValue({
        //     //         effectiveValue: this.modalEditCardsBeforeSend.newVal
        //     //     });
        //     //     this.fireIndexDataAfterClosePopUpFunc();
        //     // }
        // } else {
        //     this.modalEditCardsBeforeSend = false;
        //     this.fireIndexDataAfterClosePopUpFunc();
        // }
    }

    public setNew25Type() {
        const newRate =
            Number(this.fileFieldsForm.get('17').get('effectiveValue').value) /
            this.valueOfSumWhenRevaluationCurr;
        // console.log(this.valueOfSumWhenRevaluationCurr, newRate);
        if (this.fileFieldsForm.get('25')) {
            let rateInput = newRate.toString().replace(/[^0-9.]/g, '');
            if (rateInput && rateInput.includes('.')) {
                const splitNumbers = rateInput.split('.');
                if (splitNumbers[1].length > 2) {
                    rateInput = splitNumbers[0] + '.' + splitNumbers[1].slice(0, 2);
                }
            }
            this.fileFieldsForm.get('25').patchValue({
                effectiveValue: rateInput
            });
        }
    }

    indexDataChange(idx: number) {
        if (idx === 0) {
            this.arr.controls.forEach((order, index) => {
                if (index !== 0) {
                    order.patchValue({
                        indexData: this.arr.controls[0].get('indexData').value
                    });
                }
            });
        }
    }

    orderTypeChange(
        idx: number,
        isTransTypeCode?: boolean,
        formDropdowns?: any
    ): void {
        //this.fileFieldsForm.get('21').get('effectiveValue').value === 1 //הוצאה
        //this.fileFieldsForm.get('21').get('effectiveValue').value === 0 //הכנסה
        if (isTransTypeCode) {
            if (this.fileFieldsForm.get('40')) {
                const arrOfTypesCode =
                    this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                        ? this.companyCustomerDetailsData.transTypeDefinedExpense40
                        : this.companyCustomerDetailsData.transTypeDefinedIncome40;
                const typeExist = arrOfTypesCode.find(
                    (code) =>
                        code.value === this.arr.controls[idx].get('transTypeCode').value
                );
                console.log(
                    'typeExist: ',
                    typeExist,
                    this.arr.controls[idx].get('transTypeCode').value
                );
                if (typeExist) {
                    if (typeExist.maamPrc && typeExist.maamPrc !== '?') {
                        this.arr.controls[idx].patchValue({
                            orderType: typeExist.maamPrc
                        });
                    }
                    if (typeExist.oppositeCustId && typeExist.oppositeCustId !== '?') {
                        let oppositeCust =
                            typeExist.oppositeCustId &&
                            this.userService.appData.userData.companyCustomerDetails.all
                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                    (custIdxRec) =>
                                        custIdxRec.custId === typeExist.oppositeCustId
                                )
                                : null;
                        if (
                            !oppositeCust &&
                            typeExist.oppositeCustId &&
                            this.userService.appData.userData.companyCustomerDetails.all
                        ) {
                            oppositeCust = {
                                cartisName: typeExist.oppositeCustId,
                                cartisCodeId: null,
                                custId: typeExist.oppositeCustId,
                                lName: null,
                                hp: null,
                                id: null,
                                pettyCash: false,
                                supplierTaxDeduction: null,
                                customerTaxDeduction: null
                            };
                        }

                        this.arr.controls[idx].patchValue({
                            custData: oppositeCust
                        });
                        this.arr.controls[idx].get('custData').disable();
                    } else {
                        this.arr.controls[idx].get('custData').enable();
                    }
                    if (
                        typeExist.taxDeductionCustId &&
                        typeExist.taxDeductionCustId !== '?'
                    ) {
                        if (this.arr.controls[idx].get('orderType').value === 'OPEN') {
                            // let taxDeductionCustId = typeExist.taxDeductionCustId && this.userService.appData.userData.maamCustids ? this.userService.appData.userData.maamCustids.find(custIdxRec => custIdxRec.value === typeExist.taxDeductionCustId) : null;
                            // if (!taxDeductionCustId && typeExist.taxDeductionCustId && this.userService.appData.userData.maamCustids) {
                            //     taxDeductionCustId = {
                            //         label: typeExist.taxDeductionCustId,
                            //         value: typeExist.taxDeductionCustId
                            //     };
                            // }
                            this.arr.controls[idx].patchValue({
                                custDataMaam:
                                    this.arr.controls[idx].get('orderType').value === 'NONE'
                                        ? null
                                        : typeExist.taxDeductionCustId
                            });
                        } else {
                            let taxDeductionCustId =
                                typeExist.taxDeductionCustId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) =>
                                            custIdxRec.custId === typeExist.taxDeductionCustId
                                    )
                                    : null;
                            if (
                                !taxDeductionCustId &&
                                typeExist.taxDeductionCustId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                taxDeductionCustId = {
                                    cartisName: typeExist.taxDeductionCustId,
                                    cartisCodeId: null,
                                    custId: typeExist.taxDeductionCustId,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                            }
                            this.arr.controls[idx].patchValue({
                                custDataMaam:
                                    this.arr.controls[idx].get('orderType').value === 'NONE'
                                        ? null
                                        : taxDeductionCustId
                            });
                        }

                        if (this.arr.controls[idx].get('orderType').value !== 'OPEN') {
                            this.arr.controls[idx].get('custDataMaam').disable();
                        } else {
                            this.arr.controls[idx].get('custDataMaam').enable();
                        }
                    } else {
                        this.arr.controls[idx].get('custDataMaam').enable();
                    }

                    if (idx === 0) {
                        if (typeExist.custId && typeExist.custId !== '?') {
                            let indexData =
                                typeExist.custId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) => custIdxRec.custId === typeExist.custId
                                    )
                                    : null;
                            if (
                                !indexData &&
                                typeExist.custId &&
                                this.userService.appData.userData.companyCustomerDetails.all
                            ) {
                                indexData = {
                                    cartisName: typeExist.custId,
                                    cartisCodeId: null,
                                    custId: typeExist.custId,
                                    lName: null,
                                    hp: null,
                                    id: null,
                                    pettyCash: false,
                                    supplierTaxDeduction: null,
                                    customerTaxDeduction: null
                                };
                            }
                            this.arr.controls[idx].patchValue({
                                indexData: indexData
                            });

                            this.indexDataChange(idx);
                            this.arr.controls[idx].get('indexData').disable();
                        } else {
                            this.arr.controls[idx].get('indexData').enable();
                        }
                    }

                    this.formDropdownsCartis.forEach((item: any) => {
                        const effectiveValue = item.custId ? item.custId : null;
                        let val =
                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                (custIdxRec) => custIdxRec.custId === effectiveValue
                            );
                        if (!val && effectiveValue) {
                            val = {
                                cartisName: effectiveValue,
                                cartisCodeId: null,
                                custId: effectiveValue,
                                lName: null,
                                hp: null,
                                id: null,
                                pettyCash: false,
                                supplierTaxDeduction: null,
                                customerTaxDeduction: null
                            };
                            this.userService.appData.userData.companyCustomerDetails.all.push(
                                val
                            );
                        }
                        item.options =
                            this.userService.appData.userData.companyCustomerDetails.all;
                        item.optionsToDisplay =
                            this.userService.appData.userData.companyCustomerDetails.all;
                        item.filterValue = '';
                        item.resetFilter();
                    });
                    if (
                        typeExist.taxDeductionCustId &&
                        typeExist.taxDeductionCustId !== '?'
                    ) {
                        if (this.arr.controls[idx].get('orderType').value === 'OPEN') {
                            const taxDeductionCustId =
                                typeExist.taxDeductionCustId &&
                                this.userService.appData.userData.maamCustids
                                    ? this.userService.appData.userData.maamCustids.find(
                                        (custIdxRec) =>
                                            custIdxRec.value === typeExist.taxDeductionCustId
                                    )
                                    : null;
                            if (
                                !taxDeductionCustId &&
                                typeExist.taxDeductionCustId &&
                                this.userService.appData.userData.maamCustids
                            ) {
                                const waitTillShowDDCartis = setInterval(() => {
                                    if (
                                        this.formDropdownsMaamCustids &&
                                        this.formDropdownsMaamCustids.length
                                    ) {
                                        clearInterval(waitTillShowDDCartis);
                                        this.formDropdownsMaamCustids.forEach((item) => {
                                            if (item.value && !item.value) {
                                                let val =
                                                    this.userService.appData.userData.maamCustids.find(
                                                        (custIdxRec) => custIdxRec.value === item.value
                                                    );
                                                if (!val) {
                                                    val = {
                                                        label: item.value,
                                                        value: item.value
                                                    };
                                                    this.userService.appData.userData.maamCustids.push(
                                                        val
                                                    );
                                                }
                                                item.options =
                                                    this.userService.appData.userData.maamCustids;
                                                item.optionsToDisplay =
                                                    this.userService.appData.userData.maamCustids;
                                            }
                                        });
                                    }
                                }, 100);
                            }
                        }
                    }
                }
            }
        }
        const orderType = this.arr.controls[idx].get('orderType').value;
        console.log('orderType: ', orderType);

        if (this.arr.controls[idx].get('orderType').value === 'OPEN') {
            this.arr.controls[idx].get('totalIncludedMaam').disable();
        } else {
            this.arr.controls[idx].get('totalIncludedMaam').enable();
        }

        if (this.arr.controls.length === 1) {
            if (this.arr.controls[idx].get('orderType').value === 'OPEN') {
                this.arr.controls[idx].get('totalWithoutMaam').enable();
                this.arr.controls[idx].get('totalMaam').enable();
                this.arr.controls[idx].get('totalIncludedMaam').disable();
            } else {
                this.arr.controls[idx].get('totalWithoutMaam').disable();
                this.arr.controls[idx].get('totalMaam').disable();
                this.arr.controls[idx].get('totalIncludedMaam').disable();
            }
            // this.arr.controls[idx].get('orderType').disable();
        }

        // console.log(orderType);
        if (idx === 0) {
            this.calcByTypeChange();
        } else {
            if (this.isMatah && this.fileDetailsSave.splitType === 'FOREIGN_OPEN') {
                this.calcByTypeChange(
                    this.arr.controls[idx].get('matahAmount').value,
                    idx,
                    true
                );
            } else {
                this.calcByTypeChange(
                    this.arr.controls[idx].get('totalIncludedMaam').value,
                    idx
                );
            }
        }
        // if (orderType === 'OPEN') {
        //     this.arr.controls[idx].get('custData').enable();
        // } else {
        //     this.arr.controls[idx].get('custData').disable();
        // }
        if (idx !== 0) {
            if (orderType === null) {
                this.arr.controls[idx].get('totalWithoutMaam').disable();
                this.arr.controls[idx].get('totalMaam').disable();
                this.arr.controls[idx].get('matahAmount').disable();
                this.arr.controls[idx].get('totalIncludedMaam').disable();
            } else {
                if (this.isMatah && this.fileDetailsSave.splitType === 'FOREIGN_OPEN') {
                    this.arr.controls[idx].get('matahAmount').enable();
                } else {
                    this.arr.controls[idx].get('totalIncludedMaam').enable();
                }
                if (this.arr.controls[idx].get('orderType').value === 'OPEN') {
                    this.arr.controls[idx].get('totalMaam').enable();
                }
                if (!this.isMatah) {
                    if (
                        orderType === 'TWO_THIRD' ||
                        orderType === 'QUARTER' ||
                        orderType === 'NONE'
                    ) {
                        this.arr.controls[idx].get('totalWithoutMaam').disable();
                    } else {
                        this.arr.controls[idx].get('totalWithoutMaam').enable();
                    }
                }

                if (this.isMaamOpen) {
                    if (this.arr.controls[idx].get('orderType').value === 'OPEN') {
                        this.arr.controls[idx].get('totalWithoutMaam').enable();
                        this.arr.controls[idx].get('totalMaam').enable();
                        this.arr.controls[idx].get('totalIncludedMaam').disable();
                    } else {
                        this.arr.controls[idx].get('totalWithoutMaam').enable();
                        this.arr.controls[idx].get('totalIncludedMaam').enable();
                        this.arr.controls[idx].get('totalMaam').disable();
                    }
                }
            }
        }
    }

    // public calcByRate(indexRow?: number): void {
    //     if (indexRow !== undefined) {
    //         const sumsTotalsChildMatahAmount = this.arr.controls.reduce((total, item, currentIndex) => {
    //             if (currentIndex !== 0 && currentIndex !== indexRow) {
    //                 return total + Number(item.get('matahAmount').value);
    //             } else {
    //                 return total;
    //             }
    //         }, 0);
    //         const matahAmountChildWithoutCurrent = Number(this.saverValuesOrder.matahAmount) - sumsTotalsChildMatahAmount;
    //         if (Number(this.arr.controls[indexRow].get('matahAmount').value) >= matahAmountChildWithoutCurrent) {
    //             this.arr.controls[indexRow].patchValue({
    //                 matahAmount: toFixedNumber(matahAmountChildWithoutCurrent === 0 ? 0 : (matahAmountChildWithoutCurrent - 1))
    //             });
    //         }
    //         const rate = Number(this.rate);
    //         const matahAmount = Number(this.arr.controls[indexRow].get('matahAmount').value);
    //         const total = matahAmount * rate;
    //         this.arr.controls[indexRow].patchValue({
    //             totalIncludedMaam: toFixedNumber(total),
    //             totalWithoutMaam: toFixedNumber(total)
    //         });
    //         const firstRowMatahAmount = matahAmountChildWithoutCurrent - matahAmount;
    //         const totalFirstRow = firstRowMatahAmount * rate;
    //         this.arr.controls[0].patchValue({
    //             matahAmount: toFixedNumber(firstRowMatahAmount),
    //             totalIncludedMaam: toFixedNumber(totalFirstRow),
    //             totalWithoutMaam: toFixedNumber(totalFirstRow)
    //         });
    //     } else {
    //         const sumsTotalsChildMatahAmount = this.arr.controls.reduce((total, item, currentIndex) => {
    //             if (currentIndex !== 0) {
    //                 return total + Number(item.get('matahAmount').value);
    //             } else {
    //                 return total;
    //             }
    //         }, 0);
    //         const matahAmountChildWithoutCurrent = Number(this.saverValuesOrder.matahAmount) - sumsTotalsChildMatahAmount;
    //         const rate = Number(this.rate);
    //         const firstRowMatahAmount = matahAmountChildWithoutCurrent;
    //         const totalFirstRow = firstRowMatahAmount * rate;
    //         this.arr.controls[0].patchValue({
    //             matahAmount: toFixedNumber(firstRowMatahAmount),
    //             totalIncludedMaam: toFixedNumber(totalFirstRow),
    //             totalWithoutMaam: toFixedNumber(totalFirstRow)
    //         });
    //     }
    // }

    public isShowAlert(indexOfRow: number) {
        if (this.arr.controls.length === 1) {
            if (
                !this.sumsEqual(
                    this.arr.controls[0].get('totalWithoutMaam').value,
                    this.arr.controls[0].get('totalMaam').value,
                    this.fileFieldsForm.get('17').get('effectiveValue').value
                ) ||
                Number(this.arr.controls[0].get('totalIncludedMaam').value) !==
                Number(this.fileFieldsForm.get('17').get('effectiveValue').value) ||
                Number(this.arr.controls[0].get('totalMaam').value) >
                Number(this.fileFieldsForm.get('16').get('effectiveValue').value)
            ) {
                return true;
            }
        }
        if (this.arr.controls.length > 1) {
            const sumsTotalIncludedMadamOfAllChildren = Number(
                this.arr.controls
                    .reduce((total, item, currentIndex) => {
                        return total + Number(item.get('totalIncludedMaam').value);
                    }, 0)
                    .toFixed(2)
            );
            const sumsTotals = Number(
                this.arr.controls
                    .reduce((total, item, currentIndex) => {
                        return (
                            total +
                            Number(item.get('totalWithoutMaam').value) +
                            Number(item.get('totalMaam').value)
                        );
                    }, 0)
                    .toFixed(2)
            );
            const totalMaam = Number(
                this.arr.controls
                    .reduce((total, item, currentIndex) => {
                        return total + Number(item.get('totalMaam').value);
                    }, 0)
                    .toFixed(2)
            );
            if (
                Number(sumsTotals) !==
                Number(this.fileFieldsForm.get('17').get('effectiveValue').value) ||
                Number(sumsTotalIncludedMadamOfAllChildren) !==
                Number(this.fileFieldsForm.get('17').get('effectiveValue').value) ||
                Number(totalMaam) >
                Number(this.fileFieldsForm.get('16').get('effectiveValue').value)
            ) {
                return true;
            }
        }
        return false;
    }

    public isShowAlert17(indexOfRow: number) {
        if (this.arr.controls.length === 1) {
            if (
                !this.sumsEqual(
                    this.arr.controls[0].get('totalWithoutMaam').value,
                    this.arr.controls[0].get('totalMaam').value,
                    this.fileFieldsForm.get('17').get('effectiveValue').value
                ) ||
                Number(this.arr.controls[0].get('totalIncludedMaam').value) !==
                Number(this.fileFieldsForm.get('17').get('effectiveValue').value)
            ) {
                return true;
            }
        }
        if (this.arr.controls.length > 1) {
            const sumsTotalIncludedMadamOfAllChildren = Number(
                this.arr.controls
                    .reduce((total, item, currentIndex) => {
                        return total + Number(item.get('totalIncludedMaam').value);
                    }, 0)
                    .toFixed(2)
            );
            const sumsTotals = Number(
                this.arr.controls
                    .reduce((total, item, currentIndex) => {
                        return (
                            total +
                            Number(item.get('totalWithoutMaam').value) +
                            Number(item.get('totalMaam').value)
                        );
                    }, 0)
                    .toFixed(2)
            );
            if (
                Number(sumsTotals) !==
                Number(this.fileFieldsForm.get('17').get('effectiveValue').value) ||
                Number(sumsTotalIncludedMadamOfAllChildren) !==
                Number(this.fileFieldsForm.get('17').get('effectiveValue').value)
            ) {
                return indexOfRow + 1 === this.arr.controls.length;
            }
        }
        return false;
    }

    public isShowAlert16(indexOfRow: number) {
        if (this.arr.controls.length === 1) {
            if (
                Number(this.arr.controls[0].get('totalMaam').value) >
                Number(this.fileFieldsForm.get('16').get('effectiveValue').value)
            ) {
                return true;
            }
        }
        if (this.arr.controls.length > 1) {
            const totalMaam = Number(
                this.arr.controls
                    .reduce((total, item, currentIndex) => {
                        return total + Number(item.get('totalMaam').value);
                    }, 0)
                    .toFixed(2)
            );
            if (
                Number(totalMaam) >
                Number(this.fileFieldsForm.get('16').get('effectiveValue').value)
            ) {
                return indexOfRow + 1 === this.arr.controls.length;
            }
        }
        return false;
    }

    public calcByTypeChange(
        calcByTotalIncludedMaam?: boolean,
        indexRow?: number,
        isKeyPress?: boolean,
        nameOfFl?: string
    ): void {
        if (
            nameOfFl &&
            indexRow !== 0 &&
            this.isMaamOpen &&
            this.arr.controls[0].get('orderType').value === 'OPEN'
        ) {
            this.objOldValues[nameOfFl + '_old_' + indexRow] = Number(
                this.objOldValues[nameOfFl + '_' + indexRow] || 0
            );
            this.objOldValues[nameOfFl + '_' + indexRow] = Number(
                this.arr.controls[indexRow].get(nameOfFl).value
            );
            // console.log(this.objOldValues, this.objOldValues[nameOfFl + '_' + indexRow] - this.objOldValues[nameOfFl + '_old_' + indexRow]);
        }
        if (
            nameOfFl === 'totalWithoutMaam' &&
            !(
                this.arr.controls[indexRow]
                    .get('totalWithoutMaam')
                    .value.toString()
                    .slice(-1) === '.' ||
                this.arr.controls[indexRow]
                    .get('totalWithoutMaam')
                    .value.toString()
                    .slice(-2) === '.0'
            )
        ) {
            this.arr.controls[indexRow].patchValue({
                totalWithoutMaam: toFixedNumber(
                    this.arr.controls[indexRow].get('totalWithoutMaam').value
                )
            });
        }
        if (
            nameOfFl === 'totalIncludedMaam' &&
            !(
                this.arr.controls[indexRow]
                    .get('totalIncludedMaam')
                    .value.toString()
                    .slice(-1) === '.' ||
                this.arr.controls[indexRow]
                    .get('totalIncludedMaam')
                    .value.toString()
                    .slice(-2) === '.0'
            )
        ) {
            this.arr.controls[indexRow].patchValue({
                totalIncludedMaam: toFixedNumber(
                    this.arr.controls[indexRow].get('totalIncludedMaam').value
                )
            });
        }
        if (
            nameOfFl === 'totalMaam' &&
            !(
                this.arr.controls[indexRow]
                    .get('totalMaam')
                    .value.toString()
                    .slice(-1) === '.' ||
                this.arr.controls[indexRow]
                    .get('totalMaam')
                    .value.toString()
                    .slice(-2) === '.0'
            )
        ) {
            this.arr.controls[indexRow].patchValue({
                totalMaam: toFixedNumber(
                    this.arr.controls[indexRow].get('totalMaam').value
                )
            });
        }
        // if (this.arr.controls[0].get('orderType').value === 'OPEN') {
        //     if (nameOfFl === 'totalIncludedMaam' && indexRow !== 0) {
        //         const sumsTotalIncludedMadamOfAllChildren = this.arr.controls.reduce((total, item, currentIndex) => {
        //             if (currentIndex !== 0) {
        //                 return total + Number(item.get('totalIncludedMaam').value);
        //             } else {
        //                 return total;
        //             }
        //         }, 0);
        //         const totalIncludedMaamParent = Number(this.saverValuesOrder.totalIncludedMaam) - sumsTotalIncludedMadamOfAllChildren;
        //         this.arr.controls[0].patchValue({
        //             totalIncludedMaam: toFixedNumber(totalIncludedMaamParent)
        //         });
        //     }
        // }
        const maamDivide = Number('1.' + this.maamPercentage);
        const maamPercentage = Number('0.' + this.maamPercentage);
        const is_matah = this.isMatah;
        const rate = Number(this.rate);
        if (this.isMaamOpen) {
            const fieldSumMaam = Number(
                this.fileFieldsForm.get('16').get('effectiveValue').value
            );
            const sumsTotalsChildWithoutCurrent = this.arr.controls.reduce(
                (total, item, currentIndex) => {
                    if (currentIndex !== 0 && currentIndex !== indexRow) {
                        if (
                            item.get('orderType').value === 'TWO_THIRD' ||
                            item.get('orderType').value === 'QUARTER'
                        ) {
                            const divider =
                                item.get('orderType').value === 'TWO_THIRD'
                                    ? 0.6666666666666666
                                    : 0.25;
                            const originalWithoutMaam =
                                Number(item.get('totalIncludedMaam').value) / maamDivide;
                            const originalMaamMale =
                                Number(item.get('totalIncludedMaam').value) -
                                originalWithoutMaam;
                            const totalMaam = originalMaamMale * divider;
                            return [
                                total[0] + Number(item.get('totalIncludedMaam').value),
                                total[1] +
                                Number(item.get('totalIncludedMaam').value) / maamDivide,
                                total[2] + totalMaam
                            ];
                        } else if (item.get('orderType').value === 'NONE') {
                            return [
                                total[0] + Number(item.get('totalIncludedMaam').value),
                                total[1] + Number(item.get('totalIncludedMaam').value),
                                total[2] + Number(item.get('totalMaam').value)
                            ];
                        } else if (item.get('orderType').value === 'OPEN') {
                            return [
                                total[0] + Number(item.get('totalIncludedMaam').value),
                                total[1] + Number(item.get('totalWithoutMaam').value),
                                total[2] + Number(item.get('totalMaam').value)
                            ];
                        } else {
                            const totalWithoutMaam =
                                Number(item.get('totalIncludedMaam').value) / maamDivide;
                            const totalMaam = totalWithoutMaam * maamPercentage;
                            return [
                                total[0] + Number(item.get('totalIncludedMaam').value),
                                total[1] +
                                Number(item.get('totalIncludedMaam').value) / maamDivide,
                                total[2] + totalMaam
                            ];
                        }
                    } else {
                        return [total[0], total[1], total[2]];
                    }
                },
                [0, 0, 0]
            );
            //console.log('sumsTotalsChildWithoutCurrent', sumsTotalsChildWithoutCurrent);
            const totalIncludedMaamChildWithoutCurrent =
                Number(this.saverValuesOrder.totalIncludedMaam) -
                sumsTotalsChildWithoutCurrent[0];
            const totalWithoutMaamChildWithoutCurrent =
                Number(this.saverValuesOrder.totalWithoutMaam) -
                sumsTotalsChildWithoutCurrent[1];
            const totalMaamChildWithoutCurrent =
                fieldSumMaam - sumsTotalsChildWithoutCurrent[2];
            console.log(
                totalIncludedMaamChildWithoutCurrent,
                totalWithoutMaamChildWithoutCurrent,
                totalMaamChildWithoutCurrent
            );
            if (calcByTotalIncludedMaam !== undefined) {
                // console.log(Number(this.arr.controls[indexRow].get('totalWithoutMaam').value), totalWithoutMaamChildWithoutCurrent, Number(this.saverValuesOrder.totalWithoutMaam), sumsTotalsChildWithoutCurrent[1])
                if (
                    Number(this.arr.controls[indexRow].get('totalIncludedMaam').value) >=
                    totalIncludedMaamChildWithoutCurrent
                ) {
                    this.arr.controls[indexRow].patchValue({
                        totalIncludedMaam: toFixedNumber(
                            totalIncludedMaamChildWithoutCurrent === 0
                                ? 0
                                : totalIncludedMaamChildWithoutCurrent
                        )
                    });
                }
                if (
                    indexRow > 0 &&
                    Number(this.arr.controls[indexRow].get('totalWithoutMaam').value) >=
                    totalWithoutMaamChildWithoutCurrent
                ) {
                    this.arr.controls[indexRow].patchValue({
                        // tslint:disable-next-line:max-line-length
                        totalWithoutMaam: toFixedNumber(
                            totalWithoutMaamChildWithoutCurrent === 0
                                ? 0
                                : totalWithoutMaamChildWithoutCurrent
                        )
                    });
                }
                if (
                    indexRow === 0 &&
                    Number(this.arr.controls[indexRow].get('totalWithoutMaam').value) >=
                    totalWithoutMaamChildWithoutCurrent
                ) {
                    if (
                        Number(this.arr.controls[indexRow].get('totalWithoutMaam').value) >=
                        Number(this.arr.controls[indexRow].get('totalIncludedMaam').value)
                    ) {
                        this.arr.controls[indexRow].patchValue({
                            // tslint:disable-next-line:max-line-length
                            totalWithoutMaam: toFixedNumber(
                                Number(
                                    this.arr.controls[indexRow].get('totalIncludedMaam').value
                                ) - 1
                            )
                        });
                    }
                }
                if (
                    Number(this.arr.controls[indexRow].get('totalMaam').value) >=
                    totalMaamChildWithoutCurrent
                ) {
                    this.arr.controls[indexRow].patchValue({
                        // tslint:disable-next-line:max-line-length
                        totalMaam: toFixedNumber(
                            totalMaamChildWithoutCurrent === 0
                                ? 0
                                : totalMaamChildWithoutCurrent
                        )
                    });
                }
                if (
                    Number(this.arr.controls[indexRow].get('totalMaam').value) >=
                    fieldSumMaam
                ) {
                    this.arr.controls[indexRow].patchValue({
                        // tslint:disable-next-line:max-line-length
                        totalMaam: toFixedNumber(fieldSumMaam === 0 ? 0 : fieldSumMaam)
                    });
                }
                const typeForCalc = this.arr.controls[indexRow].get('orderType').value;
                if (typeForCalc !== null) {
                    const totalIncludedMaam = Number(
                        this.arr.controls[indexRow].get('totalIncludedMaam').value
                    );
                    let objToSet;
                    if (typeForCalc === 'NONE') {
                        objToSet = {
                            totalMaam: '',
                            totalIncludedMaam: toFixedNumber(totalIncludedMaam),
                            totalWithoutMaam: toFixedNumber(totalIncludedMaam)
                        };
                    } else if (typeForCalc === 'OPEN') {
                        if (indexRow === 0) {
                            // const fieldSumAll = Number(this.fileFieldsForm.get('17').get('effectiveValue').value);
                            if (nameOfFl === 'totalWithoutMaam') {
                                // if (Number(this.arr.controls[indexRow].get('totalWithoutMaam').value) > fieldSumAll) {
                                //     this.arr.controls[indexRow].patchValue({
                                //         totalWithoutMaam: toFixedNumber(fieldSumAll)
                                //     });
                                // }
                                // this.arr.controls[indexRow].patchValue({
                                //     totalMaam: toFixedNumber(Number(this.arr.controls[indexRow].get('totalIncludedMaam').value) - Number(this.arr.controls[indexRow].get('totalWithoutMaam').value))
                                // });
                                objToSet = {
                                    totalMaam: toFixedNumber(
                                        Number(
                                            this.arr.controls[indexRow].get('totalIncludedMaam').value
                                        ) -
                                        Number(
                                            this.arr.controls[indexRow].get('totalWithoutMaam')
                                                .value
                                        )
                                    ),
                                    totalIncludedMaam: toFixedNumber(
                                        Number(
                                            this.arr.controls[indexRow].get('totalIncludedMaam').value
                                        )
                                    ),
                                    totalWithoutMaam: toFixedNumber(
                                        Number(
                                            this.arr.controls[indexRow].get('totalWithoutMaam').value
                                        )
                                    )
                                };
                            }
                            // const fieldSumMaam = Number(this.fileFieldsForm.get('16').get('effectiveValue').value);
                            if (nameOfFl === 'totalMaam') {
                                // if (Number(this.arr.controls[indexRow].get('totalMaam').value) > fieldSumMaam) {
                                //     this.arr.controls[indexRow].patchValue({
                                //         totalMaam: toFixedNumber(fieldSumMaam)
                                //     });
                                // }
                                // this.arr.controls[indexRow].patchValue({
                                //     totalWithoutMaam: toFixedNumber(Number(this.arr.controls[indexRow].get('totalIncludedMaam').value) - Number(this.arr.controls[indexRow].get('totalMaam').value))
                                // });
                                objToSet = {
                                    totalMaam: toFixedNumber(
                                        Number(this.arr.controls[indexRow].get('totalMaam').value)
                                    ),
                                    totalIncludedMaam: toFixedNumber(
                                        Number(
                                            this.arr.controls[indexRow].get('totalIncludedMaam').value
                                        )
                                    ),
                                    totalWithoutMaam: toFixedNumber(
                                        Number(
                                            this.arr.controls[indexRow].get('totalIncludedMaam').value
                                        ) -
                                        Number(this.arr.controls[indexRow].get('totalMaam').value)
                                    )
                                };
                            }
                        }
                        if (indexRow > 0) {
                            // const fieldSumAll = Number(this.fileFieldsForm.get('17').get('effectiveValue').value);
                            // const fieldSumMaamAll = Number(this.fileFieldsForm.get('16').get('effectiveValue').value);
                            if (nameOfFl === 'totalWithoutMaam' || nameOfFl === 'totalMaam') {
                                // let sumsTotalsChildWithoutCurrent = this.arr.controls.reduce((total, item, currentIndex) => {
                                //     if (currentIndex !== 0 && currentIndex !== indexRow) {
                                //         return [total[0] + Number(item.get('totalWithoutMaam').value), total[1] + Number(item.get('totalMaam').value)];
                                //     } else {
                                //         return [total[0], total[1]];
                                //     }
                                // }, [0, 0]);
                                // let totalWithoutMaamChildWithoutCurrent = fieldSumAll - sumsTotalsChildWithoutCurrent[0];
                                // let totalMaamChildWithoutCurrent = fieldSumMaamAll - sumsTotalsChildWithoutCurrent[1];
                                // if (Number(this.arr.controls[indexRow].get('totalWithoutMaam').value) > totalWithoutMaamChildWithoutCurrent) {
                                //     this.arr.controls[indexRow].patchValue({
                                //         totalWithoutMaam: toFixedNumber(totalWithoutMaamChildWithoutCurrent)
                                //     });
                                //     sumsTotalsChildWithoutCurrent = this.arr.controls.reduce((total, item, currentIndex) => {
                                //         if (currentIndex !== 0 && currentIndex !== indexRow) {
                                //             return [total[0] + Number(item.get('totalWithoutMaam').value), total[1] + Number(item.get('totalMaam').value)];
                                //         } else {
                                //             return [total[0], total[1]];
                                //         }
                                //     }, [0, 0]);
                                //     totalWithoutMaamChildWithoutCurrent = fieldSumAll - sumsTotalsChildWithoutCurrent[0];
                                //     totalMaamChildWithoutCurrent = fieldSumMaamAll - sumsTotalsChildWithoutCurrent[1];
                                // }
                                // const totalIncludedMaamFirst = toFixedNumber(Number(this.saverValuesOrder.totalWithoutMaam) - (sumsTotalsChildWithoutCurrent[0] + Number(this.arr.controls[indexRow].get('totalWithoutMaam').value)));
                                // this.arr.controls[0].patchValue({
                                //     totalWithoutMaam: totalIncludedMaamFirst,
                                //     totalIncludedMaam: toFixedNumber(totalIncludedMaamFirst + Number(this.arr.controls[0].get('totalMaam').value))
                                // });

                                objToSet = {
                                    totalMaam: toFixedNumber(
                                        Number(this.arr.controls[indexRow].get('totalMaam').value)
                                    ),
                                    totalIncludedMaam: toFixedNumber(
                                        Number(
                                            this.arr.controls[indexRow].get('totalWithoutMaam').value
                                        ) +
                                        Number(this.arr.controls[indexRow].get('totalMaam').value)
                                    ),
                                    totalWithoutMaam: toFixedNumber(
                                        Number(
                                            this.arr.controls[indexRow].get('totalWithoutMaam').value
                                        )
                                    )
                                };
                            }
                            // if (nameOfFl === 'totalMaam') {
                            //     let sumsTotalsChildWithoutCurrent = this.arr.controls.reduce((total, item, currentIndex) => {
                            //         if (currentIndex !== 0 && currentIndex !== indexRow) {
                            //             return [total[0] + Number(item.get('totalWithoutMaam').value), total[1] + Number(item.get('totalMaam').value)];
                            //         } else {
                            //             return [total[0], total[1]];
                            //         }
                            //     }, [0, 0]);
                            //     // let totalWithoutMaamChildWithoutCurrent = fieldSumAll - sumsTotalsChildWithoutCurrent[0];
                            //     let totalMaamChildWithoutCurrent = fieldSumMaamAll - sumsTotalsChildWithoutCurrent[1];
                            //     if (Number(this.arr.controls[indexRow].get('totalMaam').value) > totalMaamChildWithoutCurrent) {
                            //         this.arr.controls[indexRow].patchValue({
                            //             totalMaam: toFixedNumber(totalMaamChildWithoutCurrent)
                            //         });
                            //         sumsTotalsChildWithoutCurrent = this.arr.controls.reduce((total, item, currentIndex) => {
                            //             if (currentIndex !== 0 && currentIndex !== indexRow) {
                            //                 return [total[0] + Number(item.get('totalWithoutMaam').value), total[1] + Number(item.get('totalMaam').value)];
                            //             } else {
                            //                 return [total[0], total[1]];
                            //             }
                            //         }, [0, 0]);
                            //         // totalWithoutMaamChildWithoutCurrent = fieldSumAll - sumsTotalsChildWithoutCurrent[0];
                            //         totalMaamChildWithoutCurrent = fieldSumMaamAll - sumsTotalsChildWithoutCurrent[1];
                            //     }
                            //     const totalMaamFirst = toFixedNumber((Number(this.saverValuesOrder.totalIncludedMaam) - Number(this.saverValuesOrder.totalWithoutMaam)) - (sumsTotalsChildWithoutCurrent[1] + Number(this.arr.controls[indexRow].get('totalMaam').value)));
                            //     this.arr.controls[0].patchValue({
                            //         totalMaam: totalMaamFirst,
                            //         totalIncludedMaam: toFixedNumber(totalMaamFirst + Number(this.arr.controls[0].get('totalWithoutMaam').value))
                            //     });
                            //     this.arr.controls[indexRow].patchValue({
                            //         totalIncludedMaam: toFixedNumber(Number(this.arr.controls[indexRow].get('totalWithoutMaam').value) + Number(this.arr.controls[indexRow].get('totalMaam').value))
                            //     });
                            // }
                        }
                    } else {
                        if (
                            isKeyPress &&
                            typeForCalc !== 'TWO_THIRD' &&
                            typeForCalc !== 'QUARTER' &&
                            !calcByTotalIncludedMaam
                        ) {
                            const totalWithoutMaam = Number(
                                this.arr.controls[indexRow].get('totalWithoutMaam').value
                            );
                            const totalMaam = totalWithoutMaam * maamPercentage;
                            const totalIncludedMaamByWithoutMaam =
                                totalWithoutMaam + totalMaam;
                            objToSet = {
                                totalMaam: toFixedNumber(totalMaam),
                                totalIncludedMaam: toFixedNumber(
                                    totalIncludedMaamByWithoutMaam
                                ),
                                totalWithoutMaam: toFixedNumber(totalWithoutMaam)
                            };
                        } else {
                            if (nameOfFl === 'totalWithoutMaam') {
                                const divider =
                                    typeForCalc === 'TWO_THIRD' ? 0.6666666666666666 : 0.25;
                                const totalWithoutMaam = Number(
                                    this.arr.controls[indexRow].get('totalWithoutMaam').value
                                );
                                let totalMaamSetMain = totalWithoutMaam * maamPercentage;
                                if (typeForCalc === 'TWO_THIRD' || typeForCalc === 'QUARTER') {
                                    totalMaamSetMain = totalMaamSetMain * divider;
                                }
                                const totalIncludedMaamByWithoutMaam =
                                    totalWithoutMaam + totalMaamSetMain;
                                if (
                                    totalMaamSetMain >=
                                    Number(this.arr.controls[0].get('totalMaam').value) &&
                                    totalIncludedMaamByWithoutMaam <
                                    Number(this.arr.controls[0].get('totalIncludedMaam').value)
                                ) {
                                    console.log('1111');
                                    const totalMaamSet =
                                        Number(this.arr.controls[0].get('totalMaam').value) - 1;
                                    let totalWithoutMaamSet =
                                        (totalMaamSet / this.maamPercentage) * 100;
                                    if (
                                        typeForCalc === 'TWO_THIRD' ||
                                        typeForCalc === 'QUARTER'
                                    ) {
                                        totalWithoutMaamSet =
                                            (totalMaamSet / (this.maamPercentage * divider)) * 100;
                                    }
                                    objToSet = {
                                        totalMaam: toFixedNumber(totalMaamSet),
                                        totalIncludedMaam: toFixedNumber(
                                            totalWithoutMaamSet + totalMaamSet
                                        ),
                                        totalWithoutMaam: toFixedNumber(totalWithoutMaamSet)
                                    };
                                } else if (
                                    totalIncludedMaamByWithoutMaam >=
                                    Number(this.arr.controls[0].get('totalIncludedMaam').value)
                                ) {
                                    console.log('2222');

                                    const totalIncludedMaamTop =
                                        Number(
                                            this.arr.controls[0].get('totalIncludedMaam').value
                                        ) - 1;
                                    const originalWithoutMaam = totalIncludedMaamTop / maamDivide;
                                    const originalMaamMale =
                                        totalIncludedMaamTop - originalWithoutMaam;
                                    if (
                                        typeForCalc === 'TWO_THIRD' ||
                                        typeForCalc === 'QUARTER'
                                    ) {
                                        const totalMaamSet =
                                            originalMaamMale *
                                            (typeForCalc === 'TWO_THIRD' ? 0.6666666666666666 : 0.25);
                                        const hefreshMaam = originalMaamMale - totalMaamSet;
                                        objToSet = {
                                            totalMaam: toFixedNumber(totalMaamSet),
                                            totalIncludedMaam: toFixedNumber(totalIncludedMaamTop),
                                            totalWithoutMaam: toFixedNumber(
                                                originalWithoutMaam + hefreshMaam
                                            )
                                        };
                                    } else {
                                        objToSet = {
                                            totalMaam: toFixedNumber(originalMaamMale),
                                            totalIncludedMaam: toFixedNumber(totalIncludedMaamTop),
                                            totalWithoutMaam: toFixedNumber(originalWithoutMaam)
                                        };
                                    }
                                } else {
                                    console.log('33333');

                                    objToSet = {
                                        totalMaam: toFixedNumber(totalMaamSetMain),
                                        totalIncludedMaam: toFixedNumber(
                                            totalIncludedMaamByWithoutMaam
                                        ),
                                        totalWithoutMaam: toFixedNumber(totalWithoutMaam)
                                    };
                                }
                            } else {
                                const divider =
                                    typeForCalc === 'TWO_THIRD' ? 0.6666666666666666 : 0.25;
                                const originalWithoutMaam = totalIncludedMaam / maamDivide;
                                const originalMaamMale =
                                    totalIncludedMaam - originalWithoutMaam;
                                if (typeForCalc === 'TWO_THIRD' || typeForCalc === 'QUARTER') {
                                    const totalMaam = originalMaamMale * divider;
                                    const hefreshMaam = originalMaamMale - totalMaam;
                                    objToSet = {
                                        totalMaam: toFixedNumber(totalMaam),
                                        totalIncludedMaam: toFixedNumber(totalIncludedMaam),
                                        totalWithoutMaam: toFixedNumber(
                                            originalWithoutMaam + hefreshMaam
                                        )
                                    };
                                } else {
                                    // console.log(originalMaamMale, totalIncludedMaam, originalWithoutMaam, this.maamPercentage)
                                    objToSet = {
                                        totalMaam: toFixedNumber(originalMaamMale),
                                        totalIncludedMaam: toFixedNumber(totalIncludedMaam),
                                        totalWithoutMaam: toFixedNumber(originalWithoutMaam)
                                    };
                                }
                            }
                        }
                    }

                    if (
                        !(
                            isKeyPress &&
                            ((calcByTotalIncludedMaam &&
                                    (this.arr.controls[indexRow]
                                            .get('totalIncludedMaam')
                                            .value.toString()
                                            .slice(-1) === '.' ||
                                        this.arr.controls[indexRow]
                                            .get('totalIncludedMaam')
                                            .value.toString()
                                            .slice(-2) === '.0')) ||
                                (!calcByTotalIncludedMaam &&
                                    (this.arr.controls[indexRow]
                                            .get('totalWithoutMaam')
                                            .value.toString()
                                            .slice(-1) === '.' ||
                                        this.arr.controls[indexRow]
                                            .get('totalWithoutMaam')
                                            .value.toString()
                                            .slice(-2) === '.0')) ||
                                (!calcByTotalIncludedMaam &&
                                    (this.arr.controls[indexRow]
                                            .get('totalMaam')
                                            .value.toString()
                                            .slice(-1) === '.' ||
                                        this.arr.controls[indexRow]
                                            .get('totalMaam')
                                            .value.toString()
                                            .slice(-2) === '.0')))
                        )
                    ) {
                        if (is_matah) {
                            objToSet['matahAmount'] = toFixedNumber(
                                Number(objToSet.totalIncludedMaam) / rate
                            ); //IncludeMaam
                            objToSet['totalMaamMatah'] = toFixedNumber(
                                Number(objToSet.totalMaam) / rate
                            ); //Maam
                            objToSet['totalBeforeMaamMatah'] = toFixedNumber(
                                objToSet['matahAmount'] - objToSet['totalMaamMatah']
                            ); //BeforeMaamMatah
                        }
                        if (objToSet) {
                            this.arr.controls[indexRow].patchValue(objToSet, {
                                emitEvent: false,
                                onlySelf: true
                            });
                        }
                    }
                }
            }
            const sumsTotalIncludedMadamOfAllChildren = this.arr.controls.reduce(
                (total, item, currentIndex) => {
                    if (currentIndex !== 0) {
                        return [
                            total[0] + Number(item.get('totalIncludedMaam').value),
                            total[1] + Number(item.get('totalWithoutMaam').value),
                            total[2] + Number(item.get('totalMaam').value)
                        ];
                    } else {
                        return [total[0], total[1], total[2]];
                    }
                },
                [0, 0, 0]
            );
            const totalIncludedMaamParent =
                Number(this.saverValuesOrder.totalIncludedMaam) -
                sumsTotalIncludedMadamOfAllChildren[0];
            const totalWithoutMaamParent =
                Number(this.saverValuesOrder.totalWithoutMaam) -
                sumsTotalIncludedMadamOfAllChildren[1];
            const totalMaamParent =
                fieldSumMaam - sumsTotalIncludedMadamOfAllChildren[2];
            const typeForCalcBase = this.arr.controls[0].get('orderType').value;
            if (
                typeForCalcBase !== null &&
                !(typeForCalcBase === 'OPEN' && indexRow === 0)
            ) {
                let objToSet;
                if (typeForCalcBase === 'NONE') {
                    objToSet = {
                        totalMaam: '',
                        totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                        totalWithoutMaam: toFixedNumber(totalIncludedMaamParent)
                    };
                } else if (typeForCalcBase === 'OPEN') {
                    if (nameOfFl) {
                        const hefreshChanged =
                            this.objOldValues[nameOfFl + '_' + indexRow] -
                            this.objOldValues[nameOfFl + '_old_' + indexRow];
                        const newAmount =
                            Number(this.arr.controls[0].get(nameOfFl).value) - hefreshChanged;
                        if (nameOfFl === 'totalWithoutMaam') {
                            objToSet = {
                                totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                                totalMaam: toFixedNumber(totalIncludedMaamParent - newAmount),
                                totalWithoutMaam: toFixedNumber(newAmount)
                            };
                        }
                        if (nameOfFl === 'totalMaam') {
                            objToSet = {
                                totalMaam: toFixedNumber(newAmount),
                                totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                                totalWithoutMaam: toFixedNumber(
                                    totalIncludedMaamParent - newAmount
                                )
                            };
                        }
                        if (nameOfFl === 'totalIncludedMaam') {
                            objToSet = {
                                totalMaam: toFixedNumber(totalMaamParent),
                                totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                                totalWithoutMaam: toFixedNumber(totalWithoutMaamParent)
                            };
                        }
                    }
                    // console.log(objToSet, nameOfFl, sumsTotalIncludedMadamOfAllChildren);
                } else {
                    const divider =
                        typeForCalcBase === 'TWO_THIRD' ? 0.6666666666666666 : 0.25;
                    const originalWithoutMaam = totalIncludedMaamParent / maamDivide;
                    const originalMaamMale =
                        totalIncludedMaamParent - originalWithoutMaam;
                    if (
                        typeForCalcBase === 'TWO_THIRD' ||
                        typeForCalcBase === 'QUARTER'
                    ) {
                        const totalMaam = originalMaamMale * divider;
                        const hefreshMaam = originalMaamMale - totalMaam;
                        objToSet = {
                            totalMaam: toFixedNumber(totalMaam),
                            totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                            totalWithoutMaam: toFixedNumber(originalWithoutMaam + hefreshMaam)
                        };
                    } else {
                        objToSet = {
                            totalMaam: toFixedNumber(originalMaamMale),
                            totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                            totalWithoutMaam: toFixedNumber(originalWithoutMaam)
                        };
                    }
                }
                if (objToSet) {
                    if (is_matah) {
                        objToSet['matahAmount'] = toFixedNumber(
                            Number(objToSet.totalIncludedMaam) / rate
                        ); //IncludeMaam
                        objToSet['totalMaamMatah'] = toFixedNumber(
                            Number(objToSet.totalMaam) / rate
                        ); //Maam
                        objToSet['totalBeforeMaamMatah'] = toFixedNumber(
                            objToSet['matahAmount'] - objToSet['totalMaamMatah']
                        ); //BeforeMaamMatah
                    }
                    this.arr.controls[0].patchValue(objToSet);
                }
            }
        } else {
            if (is_matah && this.fileDetailsSave.splitType === 'FOREIGN_OPEN') {
                if (
                    nameOfFl === 'matahAmount' &&
                    !(
                        this.arr.controls[indexRow]
                            .get('matahAmount')
                            .value.toString()
                            .slice(-1) === '.' ||
                        this.arr.controls[indexRow]
                            .get('matahAmount')
                            .value.toString()
                            .slice(-2) === '.0'
                    )
                ) {
                    this.arr.controls[indexRow].patchValue({
                        matahAmount: toFixedNumber(
                            this.arr.controls[indexRow].get('matahAmount').value
                        )
                    });
                }
                //matahAmount totalIncludedMaam
                //totalBeforeMaamMatah totalWithoutMaam
                //totalMaamMatah totalMaam
                if (this.arr.controls[0].get('orderType').value !== 'OPEN') {
                    const sumsTotalsChildWithoutCurrent = this.arr.controls.reduce(
                        (total, item, currentIndex) => {
                            if (currentIndex !== 0 && currentIndex !== indexRow) {
                                if (
                                    item.get('orderType').value === 'TWO_THIRD' ||
                                    item.get('orderType').value === 'QUARTER' ||
                                    item.get('orderType').value === 'NONE'
                                ) {
                                    return [
                                        total[0] + Number(item.get('matahAmount').value),
                                        total[1] +
                                        Number(item.get('matahAmount').value) / maamDivide
                                    ];
                                } else {
                                    return [
                                        total[0] + Number(item.get('matahAmount').value),
                                        total[1] + Number(item.get('matahAmount').value)
                                    ];
                                }
                            } else {
                                return [total[0], total[1]];
                            }
                        },
                        [0, 0]
                    );
                    //console.log('sumsTotalsChildWithoutCurrent', sumsTotalsChildWithoutCurrent);
                    const totalIncludedMaamChildWithoutCurrent =
                        Number(this.saverValuesOrder.matahAmount) -
                        sumsTotalsChildWithoutCurrent[0];

                    if (calcByTotalIncludedMaam !== undefined) {
                        if (
                            Number(this.arr.controls[indexRow].get('matahAmount').value) >=
                            totalIncludedMaamChildWithoutCurrent
                        ) {
                            this.arr.controls[indexRow].patchValue({
                                matahAmount: toFixedNumber(
                                    totalIncludedMaamChildWithoutCurrent === 0
                                        ? 0
                                        : totalIncludedMaamChildWithoutCurrent - 1
                                )
                            });
                        }

                        const typeForCalc =
                            this.arr.controls[indexRow].get('orderType').value;
                        if (typeForCalc !== null) {
                            const totalIncludedMaam = Number(
                                this.arr.controls[indexRow].get('matahAmount').value
                            );
                            let objToSet;
                            if (typeForCalc === 'NONE') {
                                objToSet = {
                                    totalMaamMatah: '',
                                    matahAmount: toFixedNumber(totalIncludedMaam),
                                    totalBeforeMaamMatah: toFixedNumber(totalIncludedMaam)
                                };
                            } else {
                                if (
                                    isKeyPress &&
                                    typeForCalc !== 'TWO_THIRD' &&
                                    typeForCalc !== 'QUARTER' &&
                                    !calcByTotalIncludedMaam
                                ) {
                                    const totalMaam = totalIncludedMaam * maamPercentage;
                                    const totalBeforeMaamMatah = totalIncludedMaam - totalMaam;
                                    objToSet = {
                                        totalMaamMatah: toFixedNumber(totalMaam),
                                        matahAmount: toFixedNumber(totalIncludedMaam),
                                        totalBeforeMaamMatah: toFixedNumber(totalBeforeMaamMatah)
                                    };
                                } else {
                                    const divider =
                                        typeForCalc === 'TWO_THIRD' ? 0.6666666666666666 : 0.25;
                                    const originalWithoutMaam = totalIncludedMaam / maamDivide;
                                    const originalMaamMale =
                                        totalIncludedMaam - originalWithoutMaam;
                                    if (
                                        typeForCalc === 'TWO_THIRD' ||
                                        typeForCalc === 'QUARTER'
                                    ) {
                                        const totalMaam = originalMaamMale * divider;
                                        const hefreshMaam = originalMaamMale - totalMaam;
                                        objToSet = {
                                            totalMaamMatah: toFixedNumber(totalMaam),
                                            matahAmount: toFixedNumber(totalIncludedMaam),
                                            totalBeforeMaamMatah: toFixedNumber(
                                                originalWithoutMaam + hefreshMaam
                                            )
                                        };
                                    } else {
                                        objToSet = {
                                            totalMaamMatah: toFixedNumber(originalMaamMale),
                                            matahAmount: toFixedNumber(totalIncludedMaam),
                                            totalBeforeMaamMatah: toFixedNumber(
                                                totalIncludedMaam - originalMaamMale
                                            )
                                        };
                                    }
                                }
                            }

                            if (
                                !(
                                    isKeyPress &&
                                    calcByTotalIncludedMaam &&
                                    (this.arr.controls[indexRow]
                                            .get('matahAmount')
                                            .value.toString()
                                            .slice(-1) === '.' ||
                                        this.arr.controls[indexRow]
                                            .get('matahAmount')
                                            .value.toString()
                                            .slice(-2) === '.0')
                                )
                            ) {
                                objToSet['totalIncludedMaam'] = toFixedNumber(
                                    Number(objToSet.matahAmount) * rate
                                ); //IncludeMaam
                                objToSet['totalMaam'] = toFixedNumber(
                                    Number(objToSet.totalMaamMatah) * rate
                                ); //Maam
                                objToSet['totalWithoutMaam'] = toFixedNumber(
                                    objToSet['totalIncludedMaam'] - objToSet['totalMaam']
                                ); //BeforeMaamMatah
                                this.arr.controls[indexRow].patchValue(objToSet);
                            }
                        }
                    }
                    const sumsTotalIncludedMadamOfAllChildren = this.arr.controls.reduce(
                        (total, item, currentIndex) => {
                            if (currentIndex !== 0) {
                                return total + Number(item.get('matahAmount').value);
                            } else {
                                return total;
                            }
                        },
                        0
                    );
                    const totalIncludedMaamParent =
                        Number(this.saverValuesOrder.matahAmount) -
                        sumsTotalIncludedMadamOfAllChildren;
                    const typeForCalcBase = this.arr.controls[0].get('orderType').value;
                    if (typeForCalcBase !== null) {
                        let objToSet;
                        if (typeForCalcBase === 'NONE') {
                            objToSet = {
                                totalMaamMatah: '',
                                matahAmount: toFixedNumber(totalIncludedMaamParent),
                                totalBeforeMaamMatah: toFixedNumber(totalIncludedMaamParent)
                            };
                        } else {
                            const divider =
                                typeForCalcBase === 'TWO_THIRD' ? 0.6666666666666666 : 0.25;
                            const originalWithoutMaam = totalIncludedMaamParent / maamDivide;
                            const originalMaamMale =
                                totalIncludedMaamParent - originalWithoutMaam;
                            if (
                                typeForCalcBase === 'TWO_THIRD' ||
                                typeForCalcBase === 'QUARTER'
                            ) {
                                const totalMaam = originalMaamMale * divider;
                                const hefreshMaam = originalMaamMale - totalMaam;
                                objToSet = {
                                    totalMaamMatah: toFixedNumber(totalMaam),
                                    matahAmount: toFixedNumber(totalIncludedMaamParent),
                                    totalBeforeMaamMatah: toFixedNumber(
                                        originalWithoutMaam + hefreshMaam
                                    )
                                };
                            } else {
                                objToSet = {
                                    totalMaamMatah: toFixedNumber(originalMaamMale),
                                    matahAmount: toFixedNumber(totalIncludedMaamParent),
                                    totalBeforeMaamMatah: toFixedNumber(
                                        totalIncludedMaamParent - originalMaamMale
                                    )
                                };
                            }
                        }

                        objToSet['totalIncludedMaam'] = toFixedNumber(
                            Number(objToSet.matahAmount) * rate
                        ); //IncludeMaam
                        objToSet['totalMaam'] = toFixedNumber(
                            Number(objToSet.totalMaamMatah) * rate
                        ); //Maam
                        objToSet['totalWithoutMaam'] = toFixedNumber(
                            objToSet['totalIncludedMaam'] - objToSet['totalMaam']
                        ); //BeforeMaamMatah

                        this.arr.controls[0].patchValue(objToSet);
                    }
                } else {
                    //matahAmount totalIncludedMaam
                    //totalBeforeMaamMatah totalWithoutMaam
                    //totalMaamMatah totalMaam

                    this.arr.controls[0].patchValue({
                        matahAmount: toFixedNumber(
                            Number(this.arr.controls[0].get('totalIncludedMaam').value) / rate
                        ),
                        totalBeforeMaamMatah: toFixedNumber(
                            Number(this.arr.controls[0].get('totalWithoutMaam').value) / rate
                        ),
                        totalMaamMatah: toFixedNumber(
                            Number(this.arr.controls[0].get('totalMaam').value) / rate
                        )
                    });
                }
            } else {
                if (is_matah) {
                    if (
                        nameOfFl === 'matahAmount' &&
                        !(
                            this.arr.controls[indexRow]
                                .get('matahAmount')
                                .value.toString()
                                .slice(-1) === '.' ||
                            this.arr.controls[indexRow]
                                .get('matahAmount')
                                .value.toString()
                                .slice(-2) === '.0'
                        )
                    ) {
                        this.arr.controls[indexRow].patchValue({
                            matahAmount: toFixedNumber(
                                this.arr.controls[indexRow].get('matahAmount').value
                            )
                        });
                    }
                }
                if (this.arr.controls[0].get('orderType').value !== 'OPEN') {
                    const sumsTotalsChildWithoutCurrent = this.arr.controls.reduce(
                        (total, item, currentIndex) => {
                            if (currentIndex !== 0 && currentIndex !== indexRow) {
                                if (
                                    item.get('orderType').value === 'TWO_THIRD' ||
                                    item.get('orderType').value === 'QUARTER' ||
                                    item.get('orderType').value === 'NONE'
                                ) {
                                    return [
                                        total[0] + Number(item.get('totalIncludedMaam').value),
                                        total[1] +
                                        Number(item.get('totalIncludedMaam').value) / maamDivide
                                    ];
                                } else {
                                    return [
                                        total[0] + Number(item.get('totalIncludedMaam').value),
                                        total[1] + Number(item.get('totalIncludedMaam').value)
                                    ];
                                }
                            } else {
                                return [total[0], total[1]];
                            }
                        },
                        [0, 0]
                    );
                    //console.log('sumsTotalsChildWithoutCurrent', sumsTotalsChildWithoutCurrent);
                    const totalIncludedMaamChildWithoutCurrent =
                        Number(this.saverValuesOrder.totalIncludedMaam) -
                        sumsTotalsChildWithoutCurrent[0];
                    const totalWithoutMaamChildWithoutCurrent =
                        Number(this.saverValuesOrder.totalWithoutMaam) -
                        sumsTotalsChildWithoutCurrent[1];
                    if (calcByTotalIncludedMaam !== undefined) {
                        // console.log(Number(this.arr.controls[indexRow].get('totalWithoutMaam').value), totalWithoutMaamChildWithoutCurrent, Number(this.saverValuesOrder.totalWithoutMaam), sumsTotalsChildWithoutCurrent[1])
                        if (
                            Number(
                                this.arr.controls[indexRow].get('totalIncludedMaam').value
                            ) >= totalIncludedMaamChildWithoutCurrent
                        ) {
                            this.arr.controls[indexRow].patchValue({
                                totalIncludedMaam: toFixedNumber(
                                    totalIncludedMaamChildWithoutCurrent === 0
                                        ? 0
                                        : totalIncludedMaamChildWithoutCurrent - 1
                                )
                            });
                        }
                        if (
                            Number(
                                this.arr.controls[indexRow].get('totalWithoutMaam').value
                            ) >= totalWithoutMaamChildWithoutCurrent
                        ) {
                            this.arr.controls[indexRow].patchValue({
                                // tslint:disable-next-line:max-line-length
                                totalWithoutMaam: toFixedNumber(
                                    totalWithoutMaamChildWithoutCurrent === 0
                                        ? 0
                                        : totalWithoutMaamChildWithoutCurrent - 1
                                )
                            });
                        }
                        const typeForCalc =
                            this.arr.controls[indexRow].get('orderType').value;
                        if (typeForCalc !== null) {
                            const totalIncludedMaam = Number(
                                this.arr.controls[indexRow].get('totalIncludedMaam').value
                            );
                            let objToSet;
                            if (typeForCalc === 'NONE') {
                                objToSet = {
                                    totalMaam: '',
                                    totalIncludedMaam: toFixedNumber(totalIncludedMaam),
                                    totalWithoutMaam: toFixedNumber(totalIncludedMaam)
                                };
                            } else {
                                if (
                                    isKeyPress &&
                                    typeForCalc !== 'TWO_THIRD' &&
                                    typeForCalc !== 'QUARTER' &&
                                    !calcByTotalIncludedMaam
                                ) {
                                    const totalWithoutMaam = Number(
                                        this.arr.controls[indexRow].get('totalWithoutMaam').value
                                    );
                                    const totalMaam = totalWithoutMaam * maamPercentage;
                                    const totalIncludedMaamByWithoutMaam =
                                        totalWithoutMaam + totalMaam;
                                    objToSet = {
                                        totalMaam: toFixedNumber(totalMaam),
                                        totalIncludedMaam: toFixedNumber(
                                            totalIncludedMaamByWithoutMaam
                                        ),
                                        totalWithoutMaam: toFixedNumber(totalWithoutMaam)
                                    };
                                } else {
                                    const divider =
                                        typeForCalc === 'TWO_THIRD' ? 0.6666666666666666 : 0.25;
                                    const originalWithoutMaam = totalIncludedMaam / maamDivide;
                                    const originalMaamMale =
                                        totalIncludedMaam - originalWithoutMaam;
                                    if (
                                        typeForCalc === 'TWO_THIRD' ||
                                        typeForCalc === 'QUARTER'
                                    ) {
                                        const totalMaam = originalMaamMale * divider;
                                        const hefreshMaam = originalMaamMale - totalMaam;
                                        objToSet = {
                                            totalMaam: toFixedNumber(totalMaam),
                                            totalIncludedMaam: toFixedNumber(totalIncludedMaam),
                                            totalWithoutMaam: toFixedNumber(
                                                originalWithoutMaam + hefreshMaam
                                            )
                                        };
                                    } else {
                                        // console.log(originalMaamMale, totalIncludedMaam, originalWithoutMaam, this.maamPercentage)
                                        objToSet = {
                                            totalMaam: toFixedNumber(originalMaamMale),
                                            totalIncludedMaam: toFixedNumber(totalIncludedMaam),
                                            totalWithoutMaam: toFixedNumber(originalWithoutMaam)
                                        };
                                    }
                                }
                            }

                            if (
                                !(
                                    isKeyPress &&
                                    ((calcByTotalIncludedMaam &&
                                            (this.arr.controls[indexRow]
                                                    .get('totalIncludedMaam')
                                                    .value.toString()
                                                    .slice(-1) === '.' ||
                                                this.arr.controls[indexRow]
                                                    .get('totalIncludedMaam')
                                                    .value.toString()
                                                    .slice(-2) === '.0')) ||
                                        (!calcByTotalIncludedMaam &&
                                            (this.arr.controls[indexRow]
                                                    .get('totalWithoutMaam')
                                                    .value.toString()
                                                    .slice(-1) === '.' ||
                                                this.arr.controls[indexRow]
                                                    .get('totalWithoutMaam')
                                                    .value.toString()
                                                    .slice(-2) === '.0')))
                                )
                            ) {
                                if (is_matah) {
                                    objToSet['matahAmount'] = toFixedNumber(
                                        Number(objToSet.totalIncludedMaam) / rate
                                    ); //IncludeMaam
                                    objToSet['totalMaamMatah'] = toFixedNumber(
                                        Number(objToSet.totalMaam) / rate
                                    ); //Maam
                                    objToSet['totalBeforeMaamMatah'] = toFixedNumber(
                                        objToSet['matahAmount'] - objToSet['totalMaamMatah']
                                    ); //BeforeMaamMatah
                                }
                                this.arr.controls[indexRow].patchValue(objToSet);
                            }
                        }
                    }
                    const sumsTotalIncludedMadamOfAllChildren = this.arr.controls.reduce(
                        (total, item, currentIndex) => {
                            if (currentIndex !== 0) {
                                return total + Number(item.get('totalIncludedMaam').value);
                            } else {
                                return total;
                            }
                        },
                        0
                    );
                    const totalIncludedMaamParent =
                        Number(this.saverValuesOrder.totalIncludedMaam) -
                        sumsTotalIncludedMadamOfAllChildren;
                    const typeForCalcBase = this.arr.controls[0].get('orderType').value;
                    if (typeForCalcBase !== null) {
                        let objToSet;
                        if (typeForCalcBase === 'NONE') {
                            objToSet = {
                                totalMaam: '',
                                totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                                totalWithoutMaam: toFixedNumber(totalIncludedMaamParent)
                            };
                        } else {
                            const divider =
                                typeForCalcBase === 'TWO_THIRD' ? 0.6666666666666666 : 0.25;
                            const originalWithoutMaam = totalIncludedMaamParent / maamDivide;
                            const originalMaamMale =
                                totalIncludedMaamParent - originalWithoutMaam;
                            if (
                                typeForCalcBase === 'TWO_THIRD' ||
                                typeForCalcBase === 'QUARTER'
                            ) {
                                const totalMaam = originalMaamMale * divider;
                                const hefreshMaam = originalMaamMale - totalMaam;
                                objToSet = {
                                    totalMaam: toFixedNumber(totalMaam),
                                    totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                                    totalWithoutMaam: toFixedNumber(
                                        originalWithoutMaam + hefreshMaam
                                    )
                                };
                            } else {
                                objToSet = {
                                    totalMaam: toFixedNumber(originalMaamMale),
                                    totalIncludedMaam: toFixedNumber(totalIncludedMaamParent),
                                    totalWithoutMaam: toFixedNumber(originalWithoutMaam)
                                };
                            }
                        }
                        if (is_matah) {
                            objToSet['matahAmount'] = toFixedNumber(
                                Number(objToSet.totalIncludedMaam) / rate
                            ); //IncludeMaam
                            objToSet['totalMaamMatah'] = toFixedNumber(
                                Number(objToSet.totalMaam) / rate
                            ); //Maam
                            objToSet['totalBeforeMaamMatah'] = toFixedNumber(
                                objToSet['matahAmount'] - objToSet['totalMaamMatah']
                            ); //BeforeMaamMatah
                        }
                        this.arr.controls[0].patchValue(objToSet);
                    }
                } else {
                    if (nameOfFl) {
                        let matahAmount;
                        let totalMaamMatah;
                        let totalBeforeMaamMatah;

                        if (nameOfFl === 'totalIncludedMaam') {
                            matahAmount = toFixedNumber(
                                Number(this.arr.controls[0].get('totalIncludedMaam').value) /
                                rate
                            );
                            totalBeforeMaamMatah = toFixedNumber(
                                Number(this.arr.controls[0].get('totalWithoutMaam').value) /
                                rate
                            );
                            totalMaamMatah = matahAmount - totalBeforeMaamMatah;
                        } else if (nameOfFl === 'totalWithoutMaam') {
                            matahAmount = toFixedNumber(
                                Number(this.arr.controls[0].get('totalIncludedMaam').value) /
                                rate
                            );
                            totalBeforeMaamMatah = toFixedNumber(
                                Number(this.arr.controls[0].get('totalWithoutMaam').value) /
                                rate
                            );
                            totalMaamMatah = matahAmount - totalBeforeMaamMatah;
                        } else if (nameOfFl === 'totalMaam') {
                            totalMaamMatah = toFixedNumber(
                                Number(this.arr.controls[0].get('totalMaam').value) / rate
                            );
                            matahAmount = toFixedNumber(
                                Number(this.arr.controls[0].get('totalIncludedMaam').value) /
                                rate
                            );
                            totalBeforeMaamMatah = matahAmount - totalMaamMatah;
                        }

                        this.arr.controls[0].patchValue({
                            matahAmount: matahAmount,
                            totalBeforeMaamMatah: totalBeforeMaamMatah,
                            totalMaamMatah: totalMaamMatah
                        });
                    } else {
                        this.arr.controls[0].patchValue({
                            matahAmount: toFixedNumber(
                                Number(this.arr.controls[0].get('totalIncludedMaam').value) /
                                rate
                            ),
                            totalBeforeMaamMatah: toFixedNumber(
                                Number(this.arr.controls[0].get('totalWithoutMaam').value) /
                                rate
                            ),
                            totalMaamMatah: toFixedNumber(
                                Number(this.arr.controls[0].get('totalMaam').value) / rate
                            )
                        });
                    }
                }
            }
        }
    }

    nextAfterSetDocTypes() {
        const showEditModalPreSplit = this.showEditModalPreSplit;
        this.showEditModalPreSplit = false;
        // this.fileFieldsForm.get('21').patchValue({
        //     effectiveValue: this.setIncomeOrExpenseDoc21
        // });
        this.fileFieldsForm.get('9').patchValue({
            effectiveValue: this.setValuesOfDocType9
        });
        setTimeout(() => {
            if (showEditModalPreSplit === 1) {
                this.editOrder();
            } else if (showEditModalPreSplit === 2) {
                this.editReceipt();
            }
        }, 2000);
    }

    checkType40() {
        if (
            this.fileFieldsForm.get('40').get('effectiveValue').value ===
            'BIZ_TWO_THIRD' ||
            this.fileFieldsForm.get('40').get('effectiveValue').value ===
            'BIZ_QUARTER' ||
            this.fileFieldsForm.get('40').get('effectiveValue').value ===
            'BIZ_NONE_EXPENSE' ||
            this.fileFieldsForm.get('40').get('effectiveValue').value ===
            'BIZ_NONE_INCOME'
        ) {
            return true;
        } else {
            const arrOfTypesCode =
                this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                    ? this.companyCustomerDetailsData.transTypeDefinedExpense40
                    : this.companyCustomerDetailsData.transTypeDefinedIncome40;
            const typeExist = arrOfTypesCode.find(
                (code) =>
                    code.value ===
                    this.fileFieldsForm.get('40').get('effectiveValue').value
            );
            if (typeExist) {
                if (typeExist.maamPrc) {
                    if (
                        typeExist.maamPrc === 'TWO_THIRD' ||
                        typeExist.maamPrc === 'QUARTER' ||
                        typeExist.maamPrc === 'NONE'
                    ) {
                        return typeExist.maamPrc;
                    }
                }
            }
        }

        return false;
    }

    editOrder(): void {
        if (!this.fileFieldsForm.get('9').get('effectiveValue').value) {
            // if (!this.fileFieldsForm.get('21').get('effectiveValue').value || !this.fileFieldsForm.get('9').get('effectiveValue').value) {
            this.setValuesOfDocType9 = this.fileFieldsForm
                .get('9')
                .get('effectiveValue').value;
            // this.setIncomeOrExpenseDoc21 = this.fileFieldsForm.get('21').get('effectiveValue').value;
            this.showEditModalPreSplit = 1;
        } else {
            for (const cat1 of this.fileDetailsSave.fieldsHierarchy) {
                for (const fld1 of cat1.fields) {
                    if ('11' === String(fld1.fieldId)) {
                        this.fieldNameAsmachta = fld1.fieldName;
                    }
                }
            }
            this.orders = null;
            this.getJournalHistory = null;
            this.showDocumentListStorageDataFired = false;
            this.editOrderModalShow = true;
            // this.revaluationCurrCode = false;
            this.objOldValues = {};

            const is_matah =
                this.fileFieldsForm.get('12').get('effectiveValue').value !== 1 &&
                !this.revaluationCurrCode;
            this.isMatah = is_matah;
            this.currencySign = !this.revaluationCurrCode
                ? this.currencyList.find(
                    (ite) =>
                        ite.id ===
                        this.fileFieldsForm.get('12').get('effectiveValue').value
                )
                    ? this.currencyList.find(
                        (ite) =>
                            ite.id ===
                            this.fileFieldsForm.get('12').get('effectiveValue').value
                    ).sign
                    : null
                : this.revaluationCurrCodeSign;
            // this.fb.control({
            //     value: '',
            //     disabled: true
            // }, [Validators.required, Validators.min(1)]),

            // this.isMatah && this.fileDetailsSave.splitType === 'FOREIGN_OPEN'

            this.ocrService
                .getJourForFile({
                    fileId: this._fileScanView.fileId
                })
                .subscribe((res) => {
                    const getJourForFileArr = res ? res['body'] : res;
                    if (getJourForFileArr.length) {
                        const sumsOfParent = getJourForFileArr.reduce(
                            (total, item, currentIndex) => {
                                const totalBeforeMaam =
                                    item.maamPrc === 'NONE' ||
                                    (this.fileFieldsForm.get('4') &&
                                        this.fileFieldsForm.get('4').disabled)
                                        ? Number(item.totalIncludeMaam)
                                        : Number(item.totalBeforeMaam);
                                return [
                                    total[0] + totalBeforeMaam,
                                    total[1] + Number(item.totalIncludeMaam),
                                    total[2] + Number(item.matahAmount)
                                ];
                            },
                            [0, 0, 0]
                        );
                        this.saverValuesOrder = {
                            totalWithoutMaam: sumsOfParent[0],
                            totalIncludedMaam: sumsOfParent[1],
                            matahAmount: sumsOfParent[2]
                        };
                    } else {
                        this.saverValuesOrder = {
                            totalWithoutMaam: this.fileFieldsForm
                                .get('15')
                                .get('effectiveValue').value,
                            totalIncludedMaam: this.fileFieldsForm
                                .get('17')
                                .get('effectiveValue').value,
                            matahAmount: this.fileFieldsForm.get('24').get('effectiveValue')
                                .value
                        };
                    }
                    // orderType
                    const isExpense =
                        this.fileFieldsForm.get('21').get('effectiveValue').value === 1;
                    this.isMaamOpen =
                        (this.fileFieldsForm.get('4') &&
                            this.fileFieldsForm.get('4').get('effectiveValue').value ===
                            'OPEN') ||
                        (this.fileFieldsForm.get('40') &&
                            this.fileFieldsForm.get('40').get('effectiveValue').value ===
                            'BIZ_OPEN');

                    this.orders = this.fb.group({
                        name: 'ordersFormGr',
                        arr: this.fb.array(
                            !getJourForFileArr.length
                                ? [
                                    this.fb.group(
                                        Object.assign(
                                            {
                                                thirdDateOpen: false,
                                                date: this.fb.control({
                                                    value: this.fileFieldsForm
                                                        .get('13')
                                                        .get('effectiveValue').value,
                                                    disabled: true
                                                }),
                                                dateValue: this.fb.control({
                                                    value: null,
                                                    disabled: false
                                                }),
                                                thirdDate: this.fb.control({
                                                    value: null,
                                                    disabled: false
                                                }),
                                                transTypeCode: this.fb.control(
                                                    {
                                                        value: this.fileFieldsForm
                                                            .get('40')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    },
                                                    [Validators.required]
                                                ),
                                                orderType: this.fileFieldsForm.get('40')
                                                    ? this.fb.control({
                                                        value: this.fileFieldsForm.get('4')
                                                            ? this.fileFieldsForm
                                                            .get('4')
                                                            .get('effectiveValue').value || null
                                                            : null,
                                                        disabled: true
                                                    })
                                                    : (this.fileFieldsForm.get('4') &&
                                                        this.fileFieldsForm.get('4').disabled) ||
                                                    this.fileFieldsForm.get('9').get('effectiveValue')
                                                        .value === 'מסמך פטור ממע"מ'
                                                        ? this.fb.control({
                                                            value: 'NONE',
                                                            disabled: true
                                                        })
                                                        : this.fb.control(
                                                            {
                                                                value: this.fileFieldsForm.get('4')
                                                                    ? this.fileFieldsForm
                                                                    .get('4')
                                                                    .get('effectiveValue').value || null
                                                                    : null,
                                                                disabled: this.isMaamOpen
                                                                    ? true
                                                                    : this.fileFieldsForm.get('4') &&
                                                                    this.fileFieldsForm
                                                                        .get('4')
                                                                        .get('effectiveValue').value === 'OPEN'
                                                            },
                                                            [Validators.required]
                                                        ),
                                                custData: this.fb.control(
                                                    {
                                                        //כרטיס נגדי
                                                        value: this.fileFieldsForm
                                                            .get('6')
                                                            .get('effectiveValue').value,
                                                        disabled: false
                                                    },
                                                    [Validators.required]
                                                ),
                                                totalWithoutMaam: this.fb.control(
                                                    {
                                                        value: this.fileFieldsForm
                                                            .get('15')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    },
                                                    [Validators.required]
                                                ),
                                                totalMaam: this.fb.control(
                                                    {
                                                        value: '',
                                                        disabled: true
                                                    },
                                                    [Validators.required]
                                                ),
                                                custDataMaam: this.fb.control({
                                                    value: this.fileFieldsForm
                                                        .get('6')
                                                        .get('effectiveValue').value,
                                                    disabled: false
                                                }),
                                                indexData: this.fb.control(
                                                    {
                                                        value: this.fileFieldsForm
                                                            .get('2')
                                                            .get('effectiveValue').value, //כרטיס
                                                        disabled: false
                                                    },
                                                    [Validators.required]
                                                ),
                                                totalIncludedMaam: this.fb.control(
                                                    {
                                                        value: this.fileFieldsForm
                                                            .get('17')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    },
                                                    [Validators.required]
                                                ),
                                                asmachta: this.fb.control({
                                                    value: this.fileFieldsForm
                                                        .get('11')
                                                        .get('effectiveValue').value,
                                                    disabled: true
                                                }),
                                                asmachta2: this.fb.control({
                                                    value: '',
                                                    disabled: false
                                                }),
                                                asmachta3: this.fb.control({
                                                    value: '',
                                                    disabled: false
                                                }),
                                                details: this.fileFieldsForm
                                                    .get('7')
                                                    .get('effectiveValue').value
                                            },
                                            is_matah
                                                ? {
                                                    matahAmount: this.fb.control(
                                                        {
                                                            value: this.fileFieldsForm
                                                                .get('24')
                                                                .get('effectiveValue').value,
                                                            disabled: true
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    totalBeforeMaamMatah: this.fb.control({
                                                        value: this.fileFieldsForm
                                                            .get('26')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    }),
                                                    totalMaamMatah: this.fb.control({
                                                        value: this.fileFieldsForm
                                                            .get('27')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    })
                                                }
                                                : {}
                                        )
                                    )
                                ]
                                : getJourForFileArr.map((item, idx) => {
                                    if (idx === 0) {
                                        let oppositeCust =
                                            item.oppositeCust &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                    (custIdxRec) =>
                                                        custIdxRec.custId === item.oppositeCust
                                                )
                                                : null;
                                        if (
                                            !oppositeCust &&
                                            item.oppositeCust &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                        ) {
                                            oppositeCust = {
                                                cartisName: item.oppositeCust,
                                                cartisCodeId: null,
                                                custId: item.oppositeCust,
                                                lName: null,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.userService.appData.userData.companyCustomerDetails.all.push(
                                                oppositeCust
                                            );
                                        }
                                        let cartisMaam =
                                            item.maamPrc !== 'OPEN' &&
                                            item.cartisMaam &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                    (custIdxRec) =>
                                                        custIdxRec.custId === item.cartisMaam
                                                )
                                                : null;
                                        if (
                                            !cartisMaam &&
                                            item.cartisMaam &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                        ) {
                                            cartisMaam = {
                                                cartisName: item.cartisMaam,
                                                cartisCodeId: null,
                                                custId: item.cartisMaam,
                                                lName: null,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.userService.appData.userData.companyCustomerDetails.all.push(
                                                cartisMaam
                                            );
                                        }

                                        let orderType;
                                        let indexData;
                                        let taxDeductionCustId;
                                        let orderTypeChange = false;
                                        let oppositeCustChange = false;
                                        let indexDataChange = false;
                                        let taxDeductionCustIdChange = false;

                                        if (this.fileFieldsForm.get('40')) {
                                            const arrOfTypesCode =
                                                this.fileFieldsForm.get('21').get('effectiveValue')
                                                    .value === 1
                                                    ? this.companyCustomerDetailsData
                                                        .transTypeDefinedExpense40
                                                    : this.companyCustomerDetailsData
                                                        .transTypeDefinedIncome40;
                                            const typeExist = arrOfTypesCode.find(
                                                (code) => code.value === item.transTypeCode
                                            );
                                            if (typeExist) {
                                                if (typeExist.maamPrc && typeExist.maamPrc !== '?') {
                                                    orderType = typeExist.maamPrc;
                                                    orderTypeChange = true;
                                                }
                                                if (
                                                    typeExist.oppositeCustId &&
                                                    typeExist.oppositeCustId !== '?'
                                                ) {
                                                    oppositeCust =
                                                        typeExist.oppositeCustId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                            ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                                (custIdxRec) =>
                                                                    custIdxRec.custId ===
                                                                    typeExist.oppositeCustId
                                                            )
                                                            : null;
                                                    if (
                                                        !oppositeCust &&
                                                        typeExist.oppositeCustId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                    ) {
                                                        oppositeCust = {
                                                            cartisName: typeExist.oppositeCustId,
                                                            cartisCodeId: null,
                                                            custId: typeExist.oppositeCustId,
                                                            lName: null,
                                                            hp: null,
                                                            id: null,
                                                            pettyCash: false,
                                                            supplierTaxDeduction: null,
                                                            customerTaxDeduction: null
                                                        };
                                                        this.userService.appData.userData.companyCustomerDetails.all.push(
                                                            oppositeCust
                                                        );
                                                    }
                                                    oppositeCustChange = true;
                                                }
                                                if (typeExist.custId && typeExist.custId !== '?') {
                                                    indexData =
                                                        typeExist.custId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                            ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                                (custIdxRec) =>
                                                                    custIdxRec.custId === typeExist.custId
                                                            )
                                                            : null;
                                                    if (
                                                        !indexData &&
                                                        typeExist.custId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                    ) {
                                                        indexData = {
                                                            cartisName: typeExist.custId,
                                                            cartisCodeId: null,
                                                            custId: typeExist.custId,
                                                            lName: null,
                                                            hp: null,
                                                            id: null,
                                                            pettyCash: false,
                                                            supplierTaxDeduction: null,
                                                            customerTaxDeduction: null
                                                        };
                                                        this.userService.appData.userData.companyCustomerDetails.all.push(
                                                            indexData
                                                        );
                                                    }
                                                    indexDataChange = true;
                                                }
                                                if (
                                                    typeExist.taxDeductionCustId &&
                                                    typeExist.taxDeductionCustId !== '?'
                                                ) {
                                                    taxDeductionCustIdChange = true;
                                                    if (item.maamPrc === 'OPEN') {
                                                        taxDeductionCustId =
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData.maamCustids
                                                                ? this.userService.appData.userData.maamCustids.find(
                                                                    (custIdxRec) =>
                                                                        custIdxRec.value ===
                                                                        typeExist.taxDeductionCustId
                                                                )
                                                                : null;
                                                        if (
                                                            !taxDeductionCustId &&
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData.maamCustids
                                                        ) {
                                                            taxDeductionCustId = {
                                                                label: typeExist.taxDeductionCustId,
                                                                value: typeExist.taxDeductionCustId
                                                            };
                                                            this.userService.appData.userData.maamCustids.push(
                                                                taxDeductionCustId
                                                            );
                                                        }
                                                    } else {
                                                        taxDeductionCustId =
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData
                                                                .companyCustomerDetails.all
                                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                                    (custIdxRec) =>
                                                                        custIdxRec.custId ===
                                                                        typeExist.taxDeductionCustId
                                                                )
                                                                : null;
                                                        if (
                                                            !taxDeductionCustId &&
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData
                                                                .companyCustomerDetails.all
                                                        ) {
                                                            taxDeductionCustId = {
                                                                cartisName: typeExist.taxDeductionCustId,
                                                                cartisCodeId: null,
                                                                custId: typeExist.taxDeductionCustId,
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
                                                    }
                                                }
                                            }
                                        }

                                        return this.fb.group(
                                            Object.assign(
                                                {
                                                    thirdDateOpen: item.thirdDateOpen,
                                                    date: this.fb.control({
                                                        value: this.fileFieldsForm
                                                            .get('13')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    }),
                                                    dateValue: this.fb.control({
                                                        value: item.dateValue
                                                            ? this.userService.appData
                                                                .moment(item.dateValue)
                                                                .toDate()
                                                            : null,
                                                        disabled: false
                                                    }),
                                                    thirdDate: this.fb.control({
                                                        value: item.thirdDate
                                                            ? this.userService.appData
                                                                .moment(item.thirdDate)
                                                                .toDate()
                                                            : null,
                                                        disabled: false
                                                    }),
                                                    transTypeCode: this.fb.control(
                                                        {
                                                            value: item.transTypeCode,
                                                            disabled:
                                                                this.isMaamOpen &&
                                                                getJourForFileArr.length === 1
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    orderType:
                                                        orderTypeChange && this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value: orderType,
                                                                disabled:
                                                                    this.isMaamOpen &&
                                                                    getJourForFileArr.length === 1
                                                            })
                                                            : this.fb.control(
                                                                {
                                                                    value:
                                                                        this.fileFieldsForm
                                                                            .get('9')
                                                                            .get('effectiveValue').value ===
                                                                        'מסמך פטור ממע"מ'
                                                                            ? 'NONE'
                                                                            : item.maamPrc || null,
                                                                    disabled:
                                                                        this.isMaamOpen &&
                                                                        getJourForFileArr.length === 1
                                                                            ? true
                                                                            : this.isMaamOpen &&
                                                                            getJourForFileArr.length > 1
                                                                                ? false
                                                                                : item.maamPrc === 'OPEN' ||
                                                                                this.fileFieldsForm
                                                                                    .get('9')
                                                                                    .get('effectiveValue').value ===
                                                                                'מסמך פטור ממע"מ'
                                                                },
                                                                [Validators.required]
                                                            ),
                                                    custData:
                                                        oppositeCustChange &&
                                                        this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value: oppositeCust,
                                                                disabled: true
                                                            })
                                                            : this.fb.control(
                                                                {
                                                                    //כרטיס נגדי
                                                                    value: oppositeCust,
                                                                    disabled: false
                                                                    // disabled: (item.maamPrc !== 'OPEN') && !is_matah
                                                                },
                                                                [Validators.required]
                                                            ),
                                                    totalWithoutMaam: this.fb.control(
                                                        {
                                                            value:
                                                                item.maamPrc === 'NONE' ||
                                                                (this.fileFieldsForm.get('4') &&
                                                                    this.fileFieldsForm.get('4').disabled)
                                                                    ? item.totalIncludeMaam
                                                                    : item.totalBeforeMaam,
                                                            disabled: item.maamPrc !== 'OPEN'
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    totalMaam: this.fb.control({
                                                        value: item.totalMaam,
                                                        disabled: item.maamPrc !== 'OPEN'
                                                    }),
                                                    custDataMaam:
                                                        taxDeductionCustIdChange &&
                                                        this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value: taxDeductionCustId,
                                                                disabled: true
                                                            })
                                                            : this.fb.control({
                                                                value:
                                                                    item.maamPrc === 'OPEN'
                                                                        ? item.cartisMaam
                                                                        : cartisMaam,
                                                                disabled: false
                                                            }),
                                                    indexData:
                                                        indexDataChange && this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value: indexData,
                                                                disabled: true
                                                            })
                                                            : this.fb.control(
                                                                {
                                                                    value: this.fileFieldsForm
                                                                        .get('2')
                                                                        .get('effectiveValue').value, //כרטיס
                                                                    disabled: false
                                                                },
                                                                [Validators.required]
                                                            ),
                                                    totalIncludedMaam: this.fb.control(
                                                        {
                                                            value: item.totalIncludeMaam,
                                                            disabled:
                                                                this.isMaamOpen && item.maamPrc === 'OPEN'
                                                                    ? true
                                                                    : item.maamPrc !== 'OPEN'
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    asmachta: this.fb.control({
                                                        value: this.fileFieldsForm
                                                            .get('11')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    }),
                                                    asmachta2: this.fb.control({
                                                        value: item.asmachta2,
                                                        disabled: false
                                                    }),
                                                    asmachta3: this.fb.control({
                                                        value: item.asmachta3,
                                                        disabled: false
                                                    }),
                                                    details: item.details
                                                },
                                                is_matah
                                                    ? {
                                                        matahAmount: this.fb.control(
                                                            {
                                                                value: item.matahAmount,
                                                                disabled: true
                                                            },
                                                            [Validators.required]
                                                        ),
                                                        totalBeforeMaamMatah: this.fb.control({
                                                            value: item.totalBeforeMaamMatah,
                                                            disabled: true
                                                        }),
                                                        totalMaamMatah: this.fb.control({
                                                            value: item.totalMaamMatah,
                                                            disabled: true
                                                        })
                                                    }
                                                    : {}
                                            )
                                        );
                                    } else {
                                        let oppositeCust =
                                            item.oppositeCust &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                    (custIdxRec) =>
                                                        custIdxRec.custId === item.oppositeCust
                                                )
                                                : null;
                                        if (
                                            !oppositeCust &&
                                            item.oppositeCust &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                        ) {
                                            oppositeCust = {
                                                cartisName: item.oppositeCust,
                                                cartisCodeId: null,
                                                custId: item.oppositeCust,
                                                lName: null,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.userService.appData.userData.companyCustomerDetails.all.push(
                                                oppositeCust
                                            );
                                        }
                                        let cartisMaam =
                                            item.maamPrc !== 'OPEN' &&
                                            item.cartisMaam &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                    (custIdxRec) =>
                                                        custIdxRec.custId === item.cartisMaam
                                                )
                                                : null;
                                        if (
                                            !cartisMaam &&
                                            item.cartisMaam &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                        ) {
                                            cartisMaam = {
                                                cartisName: item.cartisMaam,
                                                cartisCodeId: null,
                                                custId: item.cartisMaam,
                                                lName: null,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.userService.appData.userData.companyCustomerDetails.all.push(
                                                cartisMaam
                                            );
                                        }

                                        let orderType;
                                        let indexData;
                                        let taxDeductionCustId;
                                        let orderTypeChange = false;
                                        let oppositeCustChange = false;
                                        let indexDataChange = false;
                                        let taxDeductionCustIdChange = false;
                                        if (this.fileFieldsForm.get('40')) {
                                            const arrOfTypesCode =
                                                this.fileFieldsForm.get('21').get('effectiveValue')
                                                    .value === 1
                                                    ? this.companyCustomerDetailsData
                                                        .transTypeDefinedExpense40
                                                    : this.companyCustomerDetailsData
                                                        .transTypeDefinedIncome40;
                                            const typeExist = arrOfTypesCode.find(
                                                (code) => code.value === item.transTypeCode
                                            );
                                            if (typeExist) {
                                                if (typeExist.maamPrc && typeExist.maamPrc !== '?') {
                                                    orderType = typeExist.maamPrc;
                                                    orderTypeChange = true;
                                                }
                                                if (
                                                    typeExist.oppositeCustId &&
                                                    typeExist.oppositeCustId !== '?'
                                                ) {
                                                    oppositeCust =
                                                        typeExist.oppositeCustId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                            ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                                (custIdxRec) =>
                                                                    custIdxRec.custId ===
                                                                    typeExist.oppositeCustId
                                                            )
                                                            : null;
                                                    if (
                                                        !oppositeCust &&
                                                        typeExist.oppositeCustId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                    ) {
                                                        oppositeCust = {
                                                            cartisName: typeExist.oppositeCustId,
                                                            cartisCodeId: null,
                                                            custId: typeExist.oppositeCustId,
                                                            lName: null,
                                                            hp: null,
                                                            id: null,
                                                            pettyCash: false,
                                                            supplierTaxDeduction: null,
                                                            customerTaxDeduction: null
                                                        };
                                                        this.userService.appData.userData.companyCustomerDetails.all.push(
                                                            oppositeCust
                                                        );
                                                    }
                                                    oppositeCustChange = true;
                                                }
                                                if (
                                                    typeExist.taxDeductionCustId &&
                                                    typeExist.taxDeductionCustId !== '?'
                                                ) {
                                                    taxDeductionCustIdChange = true;
                                                    if (item.maamPrc === 'OPEN') {
                                                        taxDeductionCustId =
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData.maamCustids
                                                                ? this.userService.appData.userData.maamCustids.find(
                                                                    (custIdxRec) =>
                                                                        custIdxRec.value ===
                                                                        typeExist.taxDeductionCustId
                                                                )
                                                                : null;
                                                        if (
                                                            !taxDeductionCustId &&
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData.maamCustids
                                                        ) {
                                                            taxDeductionCustId = {
                                                                label: typeExist.taxDeductionCustId,
                                                                value: typeExist.taxDeductionCustId
                                                            };
                                                            this.userService.appData.userData.maamCustids.push(
                                                                taxDeductionCustId
                                                            );
                                                        }
                                                    } else {
                                                        taxDeductionCustId =
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData
                                                                .companyCustomerDetails.all
                                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                                    (custIdxRec) =>
                                                                        custIdxRec.custId ===
                                                                        typeExist.taxDeductionCustId
                                                                )
                                                                : null;
                                                        if (
                                                            !taxDeductionCustId &&
                                                            typeExist.taxDeductionCustId &&
                                                            this.userService.appData.userData
                                                                .companyCustomerDetails.all
                                                        ) {
                                                            taxDeductionCustId = {
                                                                cartisName: typeExist.taxDeductionCustId,
                                                                cartisCodeId: null,
                                                                custId: typeExist.taxDeductionCustId,
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
                                                    }
                                                }
                                            }

                                            const typeExistCust = arrOfTypesCode.find(
                                                (code) =>
                                                    code.value === getJourForFileArr[0].transTypeCode
                                            );
                                            if (typeExistCust) {
                                                if (
                                                    typeExistCust.custId &&
                                                    typeExistCust.custId !== '?'
                                                ) {
                                                    indexData =
                                                        typeExistCust.custId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                            ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                                (custIdxRec) =>
                                                                    custIdxRec.custId === typeExistCust.custId
                                                            )
                                                            : null;
                                                    if (
                                                        !indexData &&
                                                        typeExistCust.custId &&
                                                        this.userService.appData.userData
                                                            .companyCustomerDetails.all
                                                    ) {
                                                        indexData = {
                                                            cartisName: typeExistCust.custId,
                                                            cartisCodeId: null,
                                                            custId: typeExistCust.custId,
                                                            lName: null,
                                                            hp: null,
                                                            id: null,
                                                            pettyCash: false,
                                                            supplierTaxDeduction: null,
                                                            customerTaxDeduction: null
                                                        };
                                                        this.userService.appData.userData.companyCustomerDetails.all.push(
                                                            indexData
                                                        );
                                                    }
                                                    indexDataChange = true;
                                                }
                                            }
                                        }

                                        return this.fb.group(
                                            Object.assign(
                                                {
                                                    thirdDateOpen: item.thirdDateOpen,
                                                    date: this.fb.control({
                                                        value: this.fileFieldsForm
                                                            .get('13')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    }),
                                                    dateValue: this.fb.control({
                                                        value: item.dateValue
                                                            ? this.userService.appData
                                                                .moment(item.dateValue)
                                                                .toDate()
                                                            : null,
                                                        disabled: false
                                                    }),
                                                    thirdDate: this.fb.control({
                                                        value: item.thirdDate
                                                            ? this.userService.appData
                                                                .moment(item.thirdDate)
                                                                .toDate()
                                                            : null,
                                                        disabled: false
                                                    }),
                                                    transTypeCode: this.fb.control(
                                                        {
                                                            value: item.transTypeCode,
                                                            disabled: false
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    orderType:
                                                        orderTypeChange && this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value: orderType,
                                                                disabled: !this.isMaamOpen
                                                            })
                                                            : this.fb.control(
                                                                {
                                                                    value:
                                                                        this.fileFieldsForm
                                                                            .get('9')
                                                                            .get('effectiveValue').value ===
                                                                        'מסמך פטור ממע"מ'
                                                                            ? 'NONE'
                                                                            : item.maamPrc,
                                                                    disabled: this.isMaamOpen
                                                                        ? false
                                                                        : item.maamPrc === 'OPEN' ||
                                                                        this.fileFieldsForm
                                                                            .get('9')
                                                                            .get('effectiveValue').value ===
                                                                        'מסמך פטור ממע"מ'
                                                                },
                                                                [Validators.required]
                                                            ),
                                                    custData:
                                                        oppositeCustChange &&
                                                        this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value: oppositeCust,
                                                                disabled: true
                                                            })
                                                            : this.fb.control(
                                                                {
                                                                    //כרטיס נגדי
                                                                    value: oppositeCust,
                                                                    disabled: false
                                                                    // disabled: (item.maamPrc !== 'OPEN') && !is_matah
                                                                },
                                                                [Validators.required]
                                                            ),
                                                    totalWithoutMaam: this.fb.control(
                                                        {
                                                            value: item.totalBeforeMaam,
                                                            disabled:
                                                                (item.maamPrc === null ||
                                                                    item.maamPrc === 'TWO_THIRD' ||
                                                                    item.maamPrc === 'QUARTER' ||
                                                                    item.maamPrc === 'NONE' ||
                                                                    is_matah) &&
                                                                item.maamPrc !== 'OPEN'
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    totalMaam: this.fb.control({
                                                        value: item.totalMaam,
                                                        disabled: item.maamPrc !== 'OPEN'
                                                    }),
                                                    custDataMaam:
                                                        taxDeductionCustIdChange &&
                                                        this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value:
                                                                    item.maamPrc === 'NONE'
                                                                        ? null
                                                                        : taxDeductionCustId,
                                                                disabled: item.maamPrc !== 'OPEN'
                                                            })
                                                            : this.fb.control({
                                                                value:
                                                                    item.maamPrc === 'OPEN'
                                                                        ? item.cartisMaam
                                                                        : cartisMaam,
                                                                disabled: false
                                                            }),
                                                    indexData:
                                                        indexDataChange && this.fileFieldsForm.get('40')
                                                            ? this.fb.control({
                                                                value: indexData,
                                                                disabled: true
                                                            })
                                                            : this.fb.control({
                                                                //כרטיס
                                                                value: this.fileFieldsForm
                                                                    .get('2')
                                                                    .get('effectiveValue').value,
                                                                disabled: true
                                                            }),
                                                    totalIncludedMaam: this.fb.control(
                                                        {
                                                            value: item.totalIncludeMaam,
                                                            disabled:
                                                                this.isMaamOpen && item.maamPrc === 'OPEN'
                                                                    ? true
                                                                    : (item.maamPrc === null ||
                                                                        (is_matah &&
                                                                            this.fileDetailsSave.splitType ===
                                                                            'FOREIGN_OPEN')) &&
                                                                    item.maamPrc !== 'OPEN'
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    asmachta: this.fb.control({
                                                        value: this.fileFieldsForm
                                                            .get('11')
                                                            .get('effectiveValue').value,
                                                        disabled: true
                                                    }),
                                                    asmachta2: this.fb.control({
                                                        value: item.asmachta2,
                                                        disabled: false
                                                    }),
                                                    asmachta3: this.fb.control({
                                                        value: item.asmachta3,
                                                        disabled: false
                                                    }),
                                                    details: item.details
                                                },
                                                is_matah
                                                    ? {
                                                        matahAmount: this.fb.control(
                                                            {
                                                                value: item.matahAmount,
                                                                disabled:
                                                                    item.maamPrc === null ||
                                                                    this.fileDetailsSave.splitType !==
                                                                    'FOREIGN_OPEN'
                                                            },
                                                            [Validators.required]
                                                        ),
                                                        totalBeforeMaamMatah: this.fb.control({
                                                            value: item.totalBeforeMaamMatah,
                                                            disabled: true
                                                        }),
                                                        totalMaamMatah: this.fb.control({
                                                            value: item.totalMaamMatah,
                                                            disabled: true
                                                        })
                                                    }
                                                    : {}
                                            )
                                        );
                                    }
                                })
                        )
                    });

                    // this.calcByTypeChange();
                });

            if (
                this.fileFieldsForm.get('2').get('effectiveValue').value &&
                this.fileFieldsForm.get('2').get('effectiveValue').value.custId
            ) {
                this.ocrService
                    .journalHistory({
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        custId: this.fileFieldsForm.get('2').get('effectiveValue').value
                            .custId
                    })
                    .subscribe((res) => {
                        this.getJournalHistory = res ? res['body'] : res;
                        // const isExpense = this.fileFieldsForm.get('21').get('effectiveValue').value === 1;
                        // this.getJournalHistory = [
                        //     {
                        //         'asmachta1': '125215',
                        //         'asmachta2': '333333',
                        //         'asmachta3': 'string',
                        //         'batchNum': 234,
                        //         'cartisMaam': '5003',
                        //         'cust': 'string',
                        //         'details': 'פרטים לבדיקה',
                        //         'maamPrc': 'FULL',
                        //         'misparTnua': 44444,
                        //         'ocrFileId': '458cd066-eb1e-46cb-9c69-0d27c3d67794',
                        //         'oppositCust': '93020',
                        //         'referenceDate': this.fileFieldsForm.get('13').get('effectiveValue').value,
                        //         'totalBeforeMaam': 1000,
                        //         'totalIncludeMaam': 1170,
                        //         'totalMaam': 170
                        //     },
                        //     {
                        //         'asmachta1': '111111',
                        //         'asmachta2': '222222',
                        //         'asmachta3': 'string',
                        //         'batchNum': 999,
                        //         'cartisMaam': '5003',
                        //         'cust': 'string',
                        //         'details': 'פרטים לבדיקה 2',
                        //         'maamPrc': 'NONE',
                        //         'misparTnua': 22222,
                        //         'ocrFileId': '458cd066-eb1e-46cb-9c69-0d27c3d67791',
                        //         'oppositCust': '93020',
                        //         'referenceDate': this.fileFieldsForm.get('13').get('effectiveValue').value,
                        //         'totalBeforeMaam': 1000,
                        //         'totalIncludeMaam': 1170,
                        //         'totalMaam': 170
                        //     }
                        // ];

                        // "asmachta1": "string",
                        //     "asmachta2": "string",
                        //     "asmachta3": "string",
                        //     "batchNum": 0,
                        //     "cartisMaam": "string",
                        //     "cust": "string",
                        //     "details": "string",
                        //     "maamPrc": "string",
                        //     "misparTnua": 0,
                        //     "ocrFileId": "string",
                        //     "oppositCust": "string",
                        //     "referenceDate": "2020-07-07T18:06:32.717Z",
                        //     "totalBeforeMaam": 0,
                        //     "totalIncludeMaam": 0,
                        //     "totalMaam": 0,
                        //     "matahAmount": 0,
                        //     "totalMaamMatah":0, -- new field
                        // "totalBeforeMaamMatah":0 -- new field
                        if (this.getJournalHistory.length) {
                            this.getJournalHistory.forEach((item) => {
                                // if (is_matah) {
                                //     item.maamPrc = 'NONE';
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
                                let cartisMaam =
                                    item.cartisMaam &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                            (custIdxRec) => custIdxRec.custId === item.cartisMaam
                                        )
                                        : null;
                                if (
                                    !cartisMaam &&
                                    item.cartisMaam &&
                                    this.userService.appData.userData.companyCustomerDetails.all
                                ) {
                                    cartisMaam = {
                                        cartisName: item.cartisMaam,
                                        cartisCodeId: null,
                                        custId: item.cartisMaam,
                                        lName: null,
                                        hp: null,
                                        id: null,
                                        pettyCash: false,
                                        supplierTaxDeduction: null,
                                        customerTaxDeduction: null
                                    };
                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                        cartisMaam
                                    );
                                }
                                item.custData = oppositCust;
                                item.cartisMaam = cartisMaam;
                                item.custId = this.userService.appData.userData
                                    .companyCustomerDetails.all
                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (custIdxRec) =>
                                            custIdxRec.custId ===
                                            this.fileFieldsForm.get('2').get('effectiveValue').value
                                                .custId
                                    )
                                    : null;
                            });
                        }
                    });
            } else {
                this.getJournalHistory = [];
            }
        }
    }

    addOrder() {
        if (this.arr.controls.length === 1 && this.isMaamOpen) {
            if (this.fileFieldsForm.get('40')) {
                this.arr.controls[0].get('transTypeCode').enable();
            } else {
                this.arr.controls[0].get('orderType').enable();
            }
        }
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1 &&
            !this.revaluationCurrCode;
        const obj = {
            thirdDateOpen: false,
            date: this.fb.control({
                value: this.arr.controls[0].get('date').value,
                disabled: true
            }),
            dateValue: this.fb.control({
                value: this.arr.controls[0].get('dateValue').value,
                disabled: false
            }),
            thirdDate: this.fb.control({
                value: this.arr.controls[0].get('thirdDate').value,
                disabled: false
            }),
            transTypeCode: this.fb.control(
                {
                    value: this.arr.controls[0].get('transTypeCode').value,
                    disabled: this.isMaamOpen
                        ? false
                        : this.arr.controls[0].get('orderType').value === 'OPEN'
                },
                [Validators.required]
            ),
            orderType: this.fileFieldsForm.get('40')
                ? this.fb.control({
                    value: this.arr.controls[0].get('orderType').value,
                    disabled: !this.isMaamOpen
                })
                : this.fb.control(
                    {
                        value:
                            this.fileFieldsForm.get('9').get('effectiveValue').value ===
                            'מסמך פטור ממע"מ'
                                ? 'NONE'
                                : this.arr.controls[0].get('orderType').value === 'OPEN'
                                    ? 'OPEN'
                                    : null,
                        disabled: this.isMaamOpen
                            ? false
                            : this.arr.controls[0].get('orderType').value === 'OPEN' ||
                            this.fileFieldsForm.get('9').get('effectiveValue').value ===
                            'מסמך פטור ממע"מ'
                    },
                    [Validators.required]
                ),
            custData: this.fb.control(
                {
                    //כרטיס נגדי
                    value: is_matah ? null : this.arr.controls[0].get('custData').value,
                    disabled: this.fileFieldsForm.get('40')
                        ? this.arr.controls[0].get('custData').disabled
                        : false
                },
                [Validators.required]
            ),
            totalWithoutMaam: this.fb.control(
                {
                    value:
                        this.arr.controls[0].get('orderType').value !== 'OPEN' ? '' : 0,
                    disabled: this.arr.controls[0].get('orderType').value !== 'OPEN'
                },
                [Validators.required]
            ),
            totalMaam: this.fb.control({
                value: this.arr.controls[0].get('orderType').value !== 'OPEN' ? '' : 0,
                disabled: this.arr.controls[0].get('orderType').value !== 'OPEN'
            }),
            totalIncludedMaam: this.fb.control(
                {
                    value:
                        this.arr.controls[0].get('orderType').value !== 'OPEN' ? '' : 0,
                    disabled:
                        this.isMaamOpen &&
                        this.arr.controls[0].get('orderType').value === 'OPEN'
                            ? true
                            : (((this.fileFieldsForm.get('4') &&
                                        !this.fileFieldsForm.get('4').disabled) ||
                                    (is_matah &&
                                        this.fileDetailsSave.splitType === 'FOREIGN_OPEN')) &&
                                this.arr.controls[0].get('orderType').value !== 'OPEN') ||
                            this.arr.controls[0].get('orderType').value === 'OPEN'
                },
                [Validators.required]
            ),
            custDataMaam: this.fb.control({
                value: this.arr.controls[0].get('custDataMaam').value,
                disabled: false
            }),
            indexData: this.fb.control({
                //כרטיס
                value: this.arr.controls[0].get('indexData').value,
                disabled: true
            }),
            asmachta: this.fb.control({
                value: this.arr.controls[0].get('asmachta').value,
                disabled: true
            }),
            asmachta2: this.fb.control({
                value: '',
                disabled: false
            }),
            asmachta3: this.fb.control({
                value: '',
                disabled: false
            }),
            details: this.arr.controls[0].get('details').value
        };
        this.arr.push(
            this.fb.group(
                Object.assign(
                    obj,
                    is_matah
                        ? {
                            matahAmount: this.fb.control(
                                {
                                    value:
                                        this.arr.controls[0].get('orderType').value !== 'OPEN'
                                            ? ''
                                            : 0,
                                    disabled: this.isMaamOpen
                                        ? true
                                        : (this.fileFieldsForm.get('4') &&
                                            !this.fileFieldsForm.get('4').disabled) ||
                                        this.fileDetailsSave.splitType !== 'FOREIGN_OPEN'
                                },
                                [Validators.required]
                            ),
                            totalBeforeMaamMatah: this.fb.control({
                                value:
                                    this.arr.controls[0].get('orderType').value !== 'OPEN'
                                        ? ''
                                        : 0,
                                disabled: true
                            }),
                            totalMaamMatah: this.fb.control({
                                value:
                                    this.arr.controls[0].get('orderType').value !== 'OPEN'
                                        ? ''
                                        : 0,
                                disabled: true
                            })
                        }
                        : {}
                )
            )
        );
    }

    removeOrder(index: number) {
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1 &&
            !this.revaluationCurrCode;
        let item;
        if (
            this.isMaamOpen &&
            this.arr.controls[0].get('orderType').value === 'OPEN'
        ) {
            delete this.objOldValues['totalMaam' + '_old_' + index];
            delete this.objOldValues['totalMaam' + '_' + index];
            delete this.objOldValues['totalIncludedMaam' + '_old_' + index];
            delete this.objOldValues['totalIncludedMaam' + '_' + index];
            delete this.objOldValues['totalWithoutMaam' + '_old_' + index];
            delete this.objOldValues['totalWithoutMaam' + '_' + index];
            delete this.objOldValues['matahAmount' + '_old_' + index];
            delete this.objOldValues['matahAmount' + '_' + index];

            item = !is_matah
                ? {
                    totalMaam:
                        Number(this.arr.controls[0].get('totalMaam').value) +
                        Number(this.arr.controls[index].get('totalMaam').value),
                    totalIncludedMaam:
                        Number(this.arr.controls[0].get('totalIncludedMaam').value) +
                        Number(this.arr.controls[index].get('totalIncludedMaam').value),
                    totalWithoutMaam:
                        Number(this.arr.controls[0].get('totalWithoutMaam').value) +
                        Number(this.arr.controls[index].get('totalWithoutMaam').value)
                }
                : {
                    totalMaam:
                        Number(this.arr.controls[0].get('totalMaam').value) +
                        Number(this.arr.controls[index].get('totalMaam').value),
                    totalIncludedMaam:
                        Number(this.arr.controls[0].get('totalIncludedMaam').value) +
                        Number(this.arr.controls[index].get('totalIncludedMaam').value),
                    totalWithoutMaam:
                        Number(this.arr.controls[0].get('totalWithoutMaam').value) +
                        Number(this.arr.controls[index].get('totalWithoutMaam').value),
                    matahAmount:
                        Number(this.arr.controls[0].get('matahAmount').value) +
                        Number(this.arr.controls[index].get('matahAmount').value)
                };
        } else {
            item = !is_matah
                ? {
                    totalMaam: '',
                    totalIncludedMaam: this.saverValuesOrder.totalIncludedMaam,
                    totalWithoutMaam: this.saverValuesOrder.totalWithoutMaam
                }
                : {
                    totalMaam: '',
                    totalIncludedMaam: this.saverValuesOrder.totalIncludedMaam,
                    totalWithoutMaam: this.saverValuesOrder.totalWithoutMaam,
                    matahAmount: this.saverValuesOrder.matahAmount
                };
        }
        this.arr.removeAt(index);
        this.arr.updateValueAndValidity();
        this.arr.controls[0].patchValue(item);
        if (this.arr.controls.length === 1 && this.isMaamOpen) {
            if (this.fileFieldsForm.get('40')) {
                this.arr.controls[0].get('transTypeCode').disable();
            } else {
                this.arr.controls[0].get('orderType').disable();
            }
        }
        if (
            !(
                this.isMaamOpen &&
                this.arr.controls[0].get('orderType').value === 'OPEN'
            )
        ) {
            this.calcByTypeChange();
        }
    }

    fireIndexDataAfterClosePopUpFunc() {
        if (this.fireIndexDataAfterClosePopUp) {
            this.fileFieldsForm.get('2').patchValue({
                effectiveValue: this.fireIndexDataAfterClosePopUp
            });
            this.fireIndexDataAfterClosePopUp = false;
        }
    }

    splitJourTrans() {
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1 &&
            !this.revaluationCurrCode;

        this.editOrderModalShow = false;
        // const orderType = this.arr.controls[0].get('orderType').value;
        // const details = this.arr.controls[0].get('details').value;
        // this.fileFieldsForm.get('4').patchValue({
        //     effectiveValue: orderType,
        // });
        //
        // const custData = this.arr.controls[0].get('custData').value;
        this.fireIndexDataAfterClosePopUp = false;
        // let change_effectiveValue_6 = false;
        // if (this.fileFieldsForm.get('6').get('effectiveValue').value !== custData) {
        //     change_effectiveValue_6 = true;
        // }
        // this.fileFieldsForm.get('6').patchValue({
        //     effectiveValue: custData
        // });

        // const indexData = this.arr.controls[0].get('indexData').value;
        // if (this.fileFieldsForm.get('2').get('effectiveValue').value !== indexData && change_effectiveValue_6) {
        //     this.fireIndexDataAfterClosePopUp = indexData;
        // } else {
        //     this.fileFieldsForm.get('2').patchValue({
        //         effectiveValue: indexData
        //     });
        // }
        // this.fileFieldsForm.get('7').patchValue({
        //     effectiveValue: details
        // });
        // if (this.arr.controls.length === 1) {
        //     this.parentExport = false;
        //     this.fileFieldsForm.get('17').enable();
        // } else {
        //     this.parentExport = true;
        //     this.fileFieldsForm.get('17').disable();
        // }

        // if (this.fileFieldsForm.get('9').get('effectiveValue').value === 'חשבונית מט"ח') {
        //     if (this.parentExport) {
        //         this.fileFieldsForm.get('24').disable();
        //         this.fileFieldsForm.get('999').disable();
        //     } else {
        //         this.fileFieldsForm.get('24').enable();
        //         this.fileFieldsForm.get('999').enable();
        //     }
        // }

        // if (this.parentExport) {
        //     this.fileFieldsForm.get('21').disable();
        //     this.fileFieldsForm.get('9').disable();
        //     this.fileFieldsForm.get('12').disable();
        // } else {
        //     if (this.fileFieldsForm.get('9').get('effectiveValue').value !== 'מסמך פטור ממע"מ'
        //         &&
        //         this.fileFieldsForm.get('9').get('effectiveValue').value !== 'אחר'
        //     ) {
        //         this.fileFieldsForm.get('21').enable();
        //     }
        //     this.fileFieldsForm.get('9').enable();
        //     this.fileFieldsForm.get('12').enable();
        // }

        const isExpense =
            this.fileFieldsForm.get('21').get('effectiveValue').value === 1;
        this.ocrService
            .splitJourTrans({
                companyId: this.userService.appData.userData.companySelect.companyId,
                fileId: this._fileScanView.fileId,
                transes: this.arr.controls.map((item) => {
                    let cartisMaam = null;
                    const orderTypeControl = item.get('orderType').value;
                    if (isExpense) {
                        if (orderTypeControl !== 'NONE') {
                            if (orderTypeControl === 'OPEN') {
                                cartisMaam = item.get('custDataMaam').value;
                            } else if (orderTypeControl === 'FULL_PROPERTY') {
                                cartisMaam = this.userService.appData.userData
                                    .companyCustomerDetails.custMaamNechasim
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .custMaamNechasim.custId
                                    : this.userService.appData.userData.companyCustomerDetails
                                        .custMaamTsumot
                                        ? this.userService.appData.userData.companyCustomerDetails
                                            .custMaamTsumot.custId
                                        : null;
                            } else if (orderTypeControl === 'FULL_IMPORT') {
                                cartisMaam = this.userService.appData.userData
                                    .companyCustomerDetails.custMaamYevu
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .custMaamYevu.custId
                                    : null;
                            } else {
                                cartisMaam = this.userService.appData.userData
                                    .companyCustomerDetails.custMaamTsumot
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .custMaamTsumot.custId
                                    : null;
                            }
                        }
                    } else {
                        if (orderTypeControl !== 'NONE') {
                            cartisMaam = this.userService.appData.userData
                                .companyCustomerDetails.custMaamIska
                                ? this.userService.appData.userData.companyCustomerDetails
                                    .custMaamIska.custId
                                : null;
                        }
                    }

                    return Object.assign(
                        {
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
                            asmachta2: item.get('asmachta2').value,
                            asmachta3: item.get('asmachta3').value,
                            cartisMaam: this.fileFieldsForm.get('40')
                                ? item.get('custDataMaam').value
                                    ? item.get('orderType').value === 'OPEN'
                                        ? item.get('custDataMaam').value
                                        : item.get('custDataMaam').value.custId
                                    : null
                                : cartisMaam,
                            details: item.get('details').value,
                            maamPrc: item.get('orderType').value,
                            transTypeCode: item.get('transTypeCode').value,
                            custId: item.get('indexData').value
                                ? item.get('indexData').value.custId
                                : null,
                            oppositeCust: item.get('custData').value.custId,
                            totalBeforeMaam: item.get('totalWithoutMaam').value,
                            totalIncludeMaam: item.get('totalIncludedMaam').value,
                            totalMaam:
                                item.get('orderType').value === 'NONE' &&
                                item.get('totalMaam').value === ''
                                    ? 0
                                    : item.get('totalMaam').value
                        },
                        is_matah
                            ? {
                                matahAmount: item.get('matahAmount').value,
                                totalBeforeMaamMatah: item.get('totalBeforeMaamMatah').value,
                                totalMaamMatah: item.get('totalMaamMatah').value
                            }
                            : {}
                    );
                })
            })
            .subscribe(() => {
                if (this.orders) {
                    let control: AbstractControl = null;
                    this.orders.reset();
                    this.orders.markAsUntouched();
                    Object.keys(this.orders.controls).forEach((name) => {
                        control = this.orders.controls[name];
                        control.setErrors(null);
                    });
                }
                this.reload();
            });
    }

    isDisabledSplitJourTrans(): boolean {
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1 &&
            !this.revaluationCurrCode;
        // *ngIf="arr.controls[i].get('indexData').value && arr.controls[i].get('custData').value && (arr.controls[i].get('indexData').value.custId === arr.controls[i].get('custData').value.custId)"

        if (this.orders && this.arr) {
            const totalMaamSums = this.arr.controls.reduce(
                (total, item, currentIndex) => {
                    return total + Number(item.get('totalMaam').value);
                },
                0
            );
            const sumsTotals = this.arr.controls.reduce(
                (total, item, currentIndex) => {
                    return (
                        total +
                        Number(item.get('totalWithoutMaam').value) +
                        Number(item.get('totalMaam').value)
                    );
                },
                0
            );
            const totalIncludedMaamSums = this.arr.controls.reduce(
                (total, item, currentIndex) => {
                    return total + Number(item.get('totalIncludedMaam').value);
                },
                0
            );


            if (
                Object.values(this.arr.controls).some((fc) => {
                    const valReq = {
                        transTypeCode: this.fileFieldsForm.get('40')
                            ? this.fileFieldsForm.get('40') &&
                            fc.get('transTypeCode').enabled &&
                            fc.get('transTypeCode').invalid
                            : false,
                        totalIncludedMaam:
                            fc.get('totalIncludedMaam').enabled &&
                            (fc.get('totalIncludedMaam').invalid ||
                                Number(fc.get('totalIncludedMaam').value) <= 0),
                        totalMaam: fc.get('orderType').value === 'NONE' ? false
                            : (fc.get('orderType').value === 'OPEN' &&
                            toFixedNumber(Number(sumsTotals)) ===
                            toFixedNumber(
                                Number(
                                    this.fileFieldsForm.get('17').get('effectiveValue').value
                                )
                            ) &&
                            Number(fc.get('totalMaam').value) <= 0
                                ? false
                                : fc.get('totalMaam').enabled &&
                                (fc.get('totalMaam').invalid ||
                                    Number(fc.get('totalMaam').value) <= 0)),
                        totalWithoutMaam:
                            fc.get('totalWithoutMaam').enabled &&
                            (fc.get('totalWithoutMaam').invalid ||
                                Number(fc.get('totalWithoutMaam').value) <= 0),
                        custData: fc.get('custData').enabled && fc.get('custData').invalid,
                        indexData:
                            fc.get('indexData').enabled && !fc.get('indexData').value,
                        orderType:
                            fc.get('orderType').enabled && fc.get('orderType').invalid,
                        matahAmount: !is_matah
                            ? false
                            : fc.get('matahAmount').enabled &&
                            (fc.get('matahAmount').invalid ||
                                Number(fc.get('matahAmount').value) <= 0),
                        equalDropDowns:
                            fc.get('custData').value &&
                            fc.get('indexData').value &&
                            fc.get('custData').value.custId ===
                            fc.get('indexData').value.custId,
                        totalIncludedMaamMinus:
                            Number(fc.get('totalIncludedMaam').value) < 0,
                        totalMaamMinus: Number(fc.get('totalMaam').value) < 0,
                        totalWithoutMaamMinus: Number(fc.get('totalWithoutMaam').value) < 0
                    };
                    // console.log('valReq', valReq, sumsTotals, Number(this.fileFieldsForm.get('17').get('effectiveValue').value));
                    const someIsInvalid = Object.values(valReq).some((val) => val);
                    // console.log('----someIsInvalid----', someIsInvalid, valReq, fc.get('totalIncludedMaam').value, fc.get('totalMaam').value, fc.get('totalWithoutMaam').value);
                    return someIsInvalid;
                })
            ) {
                return true;
            }

            // console.log(toFixedNumber(Number(totalIncludedMaamSums)), toFixedNumber(Number(this.fileFieldsForm.get('17').get('effectiveValue').value)), toFixedNumber(Number(totalMaamSums)), toFixedNumber(Number(this.fileFieldsForm.get('16').get('effectiveValue').value)));

            if (this.arr.controls[0].get('orderType').value === 'OPEN') {
                if (
                    toFixedNumber(Number(sumsTotals)) !==
                    toFixedNumber(
                        Number(this.fileFieldsForm.get('17').get('effectiveValue').value)
                    ) ||
                    toFixedNumber(Number(totalIncludedMaamSums)) !==
                    toFixedNumber(
                        Number(this.fileFieldsForm.get('17').get('effectiveValue').value)
                    )
                ) {
                    return true;
                }
                if (
                    toFixedNumber(Number(totalMaamSums)) >
                    toFixedNumber(
                        Number(this.fileFieldsForm.get('16').get('effectiveValue').value)
                    )
                ) {
                    return true;
                }
            }
        }

        return false;
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

    receiptTypeChange(idx: number, formDropdowns: any) {
        const arrOfTypesCode =
            this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                ? this.companyCustomerDetailsData.transTypeDefinedExpense41
                : this.companyCustomerDetailsData.transTypeDefinedIncome41;
        const typeExist = arrOfTypesCode.find(
            (code) =>
                code.value ===
                this.arrReceipt.controls[idx].get('transTypeReceiptCode').value
        );
        console.log(
            'typeExist: ',
            typeExist,
            this.arrReceipt.controls[idx].get('transTypeReceiptCode').value
        );
        if (typeExist) {
            const precenf = typeExist.precenf ? typeExist.precenf : 0;
            console.log('typeExist.precenf----', precenf);
            if (typeExist.oppositeCustId && typeExist.oppositeCustId !== '?') {
                let oppositeCust =
                    typeExist.oppositeCustId &&
                    this.userService.appData.userData.companyCustomerDetails.all
                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                            (custIdxRec) => custIdxRec.custId === typeExist.oppositeCustId
                        )
                        : null;
                if (
                    !oppositeCust &&
                    typeExist.oppositeCustId &&
                    this.userService.appData.userData.companyCustomerDetails.all
                ) {
                    oppositeCust = {
                        cartisName: typeExist.oppositeCustId,
                        cartisCodeId: null,
                        custId: typeExist.oppositeCustId,
                        lName: null,
                        hp: null,
                        id: null,
                        pettyCash: false,
                        supplierTaxDeduction: null,
                        customerTaxDeduction: null
                    };
                }
                this.arrReceipt.controls[idx].patchValue({
                    paymentCustId: oppositeCust
                });
                this.arrReceipt.controls[idx].get('paymentCustId').disable();
            } else {
                this.arrReceipt.controls[idx].get('paymentCustId').enable();
            }

            if (
                typeExist.taxDeductionCustId &&
                typeExist.taxDeductionCustId !== '?'
            ) {
                let taxDeductionCustId =
                    typeExist.taxDeductionCustId &&
                    this.userService.appData.userData.companyCustomerDetails.all
                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                            (custIdxRec) =>
                                custIdxRec.custId === typeExist.taxDeductionCustId
                        )
                        : null;
                if (
                    !taxDeductionCustId &&
                    typeExist.taxDeductionCustId &&
                    this.userService.appData.userData.companyCustomerDetails.all
                ) {
                    taxDeductionCustId = {
                        cartisName: typeExist.taxDeductionCustId,
                        cartisCodeId: null,
                        custId: typeExist.taxDeductionCustId,
                        lName: null,
                        hp: null,
                        id: null,
                        pettyCash: false,
                        supplierTaxDeduction: null,
                        customerTaxDeduction: null
                    };
                }
                this.arrReceipt.controls[idx].patchValue({
                    taxDeductionCustId: taxDeductionCustId
                });
                this.arrReceipt.controls[idx].get('taxDeductionCustId').disable();
            } else {
                this.arrReceipt.controls[idx].patchValue({
                    taxDeductionCustId: null
                });
                this.arrReceipt.controls[idx].get('taxDeductionCustId').enable();
            }
            this.formDropdownsCartis.forEach((item: any) => {
                const effectiveValue = item.custId ? item.custId : null;
                let val =
                    this.userService.appData.userData.companyCustomerDetails.all.find(
                        (custIdxRec) => custIdxRec.custId === effectiveValue
                    );
                if (!val && effectiveValue) {
                    val = {
                        cartisName: effectiveValue,
                        cartisCodeId: null,
                        custId: effectiveValue,
                        lName: null,
                        hp: null,
                        id: null,
                        pettyCash: false,
                        supplierTaxDeduction: null,
                        customerTaxDeduction: null
                    };
                    this.userService.appData.userData.companyCustomerDetails.all.push(
                        val
                    );
                }
                if (!this.cupaAllTheOptions_paymentCustId) {
                    this.cupaAllTheOptions_paymentCustId = true;
                }
                item.options =
                    this.userService.appData.userData.companyCustomerDetails.all;
                item.optionsToDisplay =
                    this.userService.appData.userData.companyCustomerDetails.all;
                item.filterValue = '';
                item.resetFilter();
            });

            if (this.fileFieldsForm.get('41')) {
                this.arrReceipt.controls[idx].patchValue({
                    paymentNikui: toFixedNumber(
                        precenf *
                        (Number(this.arrReceipt.controls[idx].get('total').value) / 100)
                    )
                });
                this.calcReceipt(false, idx, 'paymentNikui');
            }

            // this.arrReceipt.controls[idx].patchValue({
            //     paymentNikui: toFixedNumber(Number(typeExist.paymentNikui))
            // });
        }
        this.setCustIdReceipt();
    }

    editReceipt(): void {
        // if (!this.fileFieldsForm.get('21').get('effectiveValue').value || !this.fileFieldsForm.get('9').get('effectiveValue').value) {
        if (!this.fileFieldsForm.get('9').get('effectiveValue').value) {
            this.setValuesOfDocType9 = this.fileFieldsForm
                .get('9')
                .get('effectiveValue').value;
            // this.setIncomeOrExpenseDoc21 = this.fileFieldsForm.get('21').get('effectiveValue').value;
            this.showEditModalPreSplit = 2;
        } else {
            for (const cat1 of this.fileDetailsSave.fieldsHierarchy) {
                for (const fld1 of cat1.fields) {
                    if ('11' === String(fld1.fieldId)) {
                        this.fieldNameAsmachta = fld1.fieldName;
                    }
                }
            }
            const is_matah =
                this.fileFieldsForm.get('12').get('effectiveValue').value !== 1;
            this.isMatah = is_matah;
            const rate = Number(this.rate);
            this.currencySign = this.currencyList.find(
                (ite) =>
                    ite.id === this.fileFieldsForm.get('12').get('effectiveValue').value
            )
                ? this.currencyList.find(
                    (ite) =>
                        ite.id ===
                        this.fileFieldsForm.get('12').get('effectiveValue').value
                ).sign
                : null;
            this.receipt = null;
            this.getJournalHistory = null;
            this.showDocumentListStorageDataFired = false;
            this.editReceiptModalShow = true;
            // let taxDeductionCustId = this.userService.appData.userData.companyCustomerDetails ? (
            //     (this.fileFieldsForm.get('21').get('effectiveValue').value === 1 && this.report856) ? this.userService.appData.userData.companyCustomerDetails.supplierTaxDeduction : this.userService.appData.userData.companyCustomerDetails.customerTaxDeduction
            // ) : null;
            // if (taxDeductionCustId) {
            //     taxDeductionCustId = taxDeductionCustId.custId;
            // }
            const taxDeductionCustId = null;
            this.ocrService
                .getJournalTransForreceipt({
                    fileId: this._fileScanView.fileId
                })
                .subscribe((res) => {
                    const getJourForFileArr = res ? res['body'] : res;
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
                    if (getJourForFileArr && getJourForFileArr.length) {
                        const sumsOfParent = getJourForFileArr.reduce(
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
                                getJourForFileArr.map((item, idx) => {
                                    if (
                                        !this.cupaAllTheOptions_paymentCustId &&
                                        !this.userService.appData.userData.companyCustomerDetails.cupa.find(
                                            (custIdxRec) => custIdxRec.custId === item.paymentCustId
                                        ) &&
                                        this.userService.appData.userData.companyCustomerDetails.all.find(
                                            (custIdxRec) => custIdxRec.custId === item.paymentCustId
                                        )
                                    ) {
                                        this.cupaAllTheOptions_paymentCustId = true;
                                    }
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
                                                (custIdxRec) =>
                                                    custIdxRec.custId === item.paymentCustId
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

                                    let taxDeductionCustIdVal =
                                        item.taxDeductionCustId &&
                                        this.userService.appData.userData.companyCustomerDetails
                                            .taxDeductionArr
                                            ? this.userService.appData.userData.companyCustomerDetails.taxDeductionArr.find(
                                                (custIdxRec) =>
                                                    custIdxRec.custId === item.taxDeductionCustId
                                            )
                                            : null;
                                    if (
                                        !taxDeductionCustIdVal &&
                                        this.userService.appData.userData.companyCustomerDetails
                                            .taxDeductionArr
                                    ) {
                                        if (item.taxDeductionCustId) {
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
                                            this.userService.appData.userData.companyCustomerDetails.taxDeductionArr.push(
                                                taxDeductionCustIdVal
                                            );
                                        } else {
                                            if (
                                                this.fileFieldsForm.get('21').get('effectiveValue')
                                                    .value === 1
                                            ) {
                                                const val =
                                                    this.userService.appData.userData.companyCustomerDetails.taxDeductionArr.find(
                                                        (custIdxRec) => custIdxRec.supplierTaxDeduction
                                                    );
                                                if (val) {
                                                    taxDeductionCustIdVal = {
                                                        cartisName: val.custId,
                                                        cartisCodeId: null,
                                                        custId: val.custId,
                                                        lName: null,
                                                        hp: null,
                                                        id: null,
                                                        pettyCash: false,
                                                        supplierTaxDeduction: null,
                                                        customerTaxDeduction: null
                                                    };
                                                    this.userService.appData.userData.companyCustomerDetails.taxDeductionArr.push(
                                                        taxDeductionCustIdVal
                                                    );
                                                }
                                            } else {
                                                const val =
                                                    this.userService.appData.userData.companyCustomerDetails.taxDeductionArr.find(
                                                        (custIdxRec) => custIdxRec.customerTaxDeduction
                                                    );
                                                if (val) {
                                                    taxDeductionCustIdVal = {
                                                        cartisName: val.custId,
                                                        cartisCodeId: null,
                                                        custId: val.custId,
                                                        lName: null,
                                                        hp: null,
                                                        id: null,
                                                        pettyCash: false,
                                                        supplierTaxDeduction: null,
                                                        customerTaxDeduction: null
                                                    };
                                                    this.userService.appData.userData.companyCustomerDetails.taxDeductionArr.push(
                                                        taxDeductionCustIdVal
                                                    );
                                                }
                                            }
                                        }
                                    }

                                    let changePaymentCustIdVal = false;
                                    let changeTaxDeductionCustIdVal =
                                        this.fileFieldsForm.get('41') &&
                                        this.fileFieldsForm.get('41').get('effectiveValue').value;
                                    let changeCustIdVal = false;
                                    const changePaymentTotalVal = false;
                                    if (this.fileFieldsForm.get('41')) {
                                        const arrOfTypesCode =
                                            this.fileFieldsForm.get('21').get('effectiveValue')
                                                .value === 1
                                                ? this.companyCustomerDetailsData
                                                    .transTypeDefinedExpense41
                                                : this.companyCustomerDetailsData
                                                    .transTypeDefinedIncome41;
                                        const typeExist = arrOfTypesCode.find(
                                            (code) => code.value === item.transTypeReceiptCode
                                        );
                                        if (typeExist) {
                                            if (
                                                typeExist.oppositeCustId &&
                                                typeExist.oppositeCustId !== '?'
                                            ) {
                                                paymentCustId =
                                                    typeExist.oppositeCustId &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                            (custIdxRec) =>
                                                                custIdxRec.custId === typeExist.oppositeCustId
                                                        )
                                                        : null;
                                                if (
                                                    !paymentCustId &&
                                                    typeExist.oppositeCustId &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                ) {
                                                    paymentCustId = {
                                                        cartisName: typeExist.oppositeCustId,
                                                        cartisCodeId: null,
                                                        custId: typeExist.oppositeCustId,
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
                                                changePaymentCustIdVal = true;
                                            }

                                            if (
                                                typeExist.taxDeductionCustId &&
                                                typeExist.taxDeductionCustId !== '?'
                                            ) {
                                                taxDeductionCustIdVal =
                                                    typeExist.taxDeductionCustId &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                            (custIdxRec) =>
                                                                custIdxRec.custId ===
                                                                typeExist.taxDeductionCustId
                                                        )
                                                        : null;
                                                if (
                                                    !taxDeductionCustIdVal &&
                                                    typeExist.taxDeductionCustId &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                ) {
                                                    taxDeductionCustIdVal = {
                                                        cartisName: typeExist.taxDeductionCustId,
                                                        cartisCodeId: null,
                                                        custId: typeExist.taxDeductionCustId,
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
                                                changeTaxDeductionCustIdVal = true;
                                            } else {
                                                taxDeductionCustIdVal = null;
                                                changeTaxDeductionCustIdVal = false;
                                            }

                                            if (typeExist.custId && typeExist.custId !== '?') {
                                                custId =
                                                    typeExist.custId &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                            (custIdxRec) =>
                                                                custIdxRec.custId === typeExist.custId
                                                        )
                                                        : null;
                                                if (
                                                    !custId &&
                                                    typeExist.custId &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                ) {
                                                    custId = {
                                                        cartisName: typeExist.custId,
                                                        cartisCodeId: null,
                                                        custId: typeExist.custId,
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
                                                changeCustIdVal = true;
                                            }

                                            // if (typeExist.precenf !== null) {
                                            //     changePaymentTotalVal = typeExist.precenf;
                                            // }
                                        }
                                    }
                                    return this.fb.group(
                                        Object.assign(
                                            {
                                                thirdDateOpen: item.thirdDateOpen,
                                                invoiceDate: this.fb.control({
                                                    value: item.invoiceDate
                                                        ? this.userService.appData
                                                            .moment(item.invoiceDate)
                                                            .toDate()
                                                        : null,
                                                    disabled: true
                                                }),
                                                dateValue: this.fb.control({
                                                    value: item.dateValue
                                                        ? this.userService.appData
                                                            .moment(item.dateValue)
                                                            .toDate()
                                                        : null,
                                                    disabled: false
                                                }),
                                                thirdDate: this.fb.control({
                                                    value: item.thirdDate
                                                        ? this.userService.appData
                                                            .moment(item.thirdDate)
                                                            .toDate()
                                                        : null,
                                                    disabled: false
                                                }),
                                                transTypeReceiptCode: this.fb.control({
                                                    value: item.transTypeReceiptCode,
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

                                                paymentCustId: this.fb.control(
                                                    {
                                                        //כרטיס קופה
                                                        value: paymentCustId,
                                                        disabled: changePaymentCustIdVal
                                                    },
                                                    [Validators.required]
                                                ),

                                                taxDeductionCustId: this.fb.control(
                                                    {
                                                        //כרטיס ניכוי מס
                                                        value: taxDeductionCustIdVal,
                                                        disabled: changeTaxDeductionCustIdVal
                                                    },
                                                    [Validators.required]
                                                ),
                                                total: this.fb.control(
                                                    {
                                                        value:
                                                            idx === 0
                                                                ? toFixedNumber(
                                                                    item.paymentTotal + item.paymentNikui
                                                                )
                                                                : toFixedNumber(item.paymentTotal),
                                                        disabled: true
                                                    },
                                                    [Validators.required]
                                                ),
                                                paymentTotal: this.fb.control(
                                                    {
                                                        value: toFixedNumber(item.paymentTotal), // changePaymentTotalVal === false ? item.paymentTotal : changePaymentTotalVal,
                                                        disabled: is_matah
                                                            ? this.fileDetailsSave.splitType ===
                                                            'FOREIGN_OPEN'
                                                            : false
                                                    },
                                                    [Validators.required]
                                                ),
                                                paymentNikui: this.fb.control(
                                                    {
                                                        value:
                                                            idx === 0 ? toFixedNumber(item.paymentNikui) : 0,
                                                        disabled: is_matah
                                                            ? this.fileDetailsSave.splitType ===
                                                            'FOREIGN_OPEN' || idx !== 0
                                                            : idx !== 0
                                                    },
                                                    [
                                                        this.fileFieldsForm.get('21').get('effectiveValue')
                                                            .value === 0 ||
                                                        (this.fileFieldsForm.get('21').get('effectiveValue')
                                                                .value === 1 &&
                                                            this.report856)
                                                            ? Validators.required
                                                            : Validators.nullValidator
                                                    ]
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
                                            },
                                            is_matah
                                                ? {
                                                    totalMatah: this.fb.control(
                                                        {
                                                            value:
                                                                idx === 0
                                                                    ? toFixedNumber(
                                                                        (item.paymentTotal +
                                                                            item.paymentNikui) /
                                                                        rate
                                                                    )
                                                                    : toFixedNumber(item.paymentTotal / rate),
                                                            disabled: true
                                                        },
                                                        [Validators.required]
                                                    ),
                                                    paymentTotalMatah: this.fb.control({
                                                        value: toFixedNumber(item.paymentTotal / rate),
                                                        disabled:
                                                            this.fileDetailsSave.splitType !==
                                                            'FOREIGN_OPEN'
                                                    }),
                                                    paymentNikuiMatah: this.fb.control(
                                                        {
                                                            // toFixedNumber(item.paymentNikui / rate)
                                                            value:
                                                                idx === 0
                                                                    ? toFixedNumber(
                                                                        toFixedNumber(
                                                                            (item.paymentTotal +
                                                                                item.paymentNikui) /
                                                                            rate
                                                                        ) -
                                                                        toFixedNumber(
                                                                            item.paymentTotal / rate
                                                                        )
                                                                    )
                                                                    : 0,
                                                            disabled:
                                                                this.fileDetailsSave.splitType !==
                                                                'FOREIGN_OPEN' || idx !== 0
                                                        },
                                                        [
                                                            this.fileFieldsForm
                                                                .get('21')
                                                                .get('effectiveValue').value === 0 ||
                                                            (this.fileFieldsForm
                                                                    .get('21')
                                                                    .get('effectiveValue').value === 1 &&
                                                                this.report856)
                                                                ? Validators.required
                                                                : Validators.nullValidator
                                                        ]
                                                    )
                                                }
                                                : {}
                                        )
                                    );
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

            if (
                this.fileFieldsForm.get('2').get('effectiveValue').value &&
                this.fileFieldsForm.get('2').get('effectiveValue').value.custId
            ) {
                this.ocrService
                    .journalHistory({
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        custId: this.fileFieldsForm.get('2').get('effectiveValue').value
                            .custId,
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
    }

    addReceipt() {
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1;
        const obj = {
            thirdDateOpen: false,
            invoiceDate: this.fb.control({
                value: this.arrReceipt.controls[0].get('invoiceDate').value,
                disabled: true
            }),
            transTypeReceiptCode: this.fb.control({
                value: this.arrReceipt.controls[0].get('transTypeReceiptCode').value,
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
                    value: this.arrReceipt.controls[0].get('paymentCustId').value,
                    disabled: this.fileFieldsForm.get('41')
                        ? this.arrReceipt.controls[0].get('paymentCustId').disabled
                        : false
                },
                [Validators.required]
            ),
            taxDeductionCustId: this.fb.control(
                {
                    //כרטיס ניכוי מס
                    value: this.arrReceipt.controls[0].get('taxDeductionCustId').value,
                    disabled: this.fileFieldsForm.get('41')
                        ? this.arrReceipt.controls[0].get('taxDeductionCustId').disabled
                        : false
                },
                [Validators.required]
            ),
            total: this.fb.control(
                {
                    value: 0,
                    disabled: true
                },
                [Validators.required]
            ),
            paymentTotal: this.fb.control(
                {
                    value: 0,
                    disabled: is_matah
                        ? this.fileDetailsSave.splitType === 'FOREIGN_OPEN'
                        : false
                },
                [Validators.required]
            ),
            paymentNikui: this.fb.control(
                {
                    value: 0,
                    disabled: true
                },
                [
                    this.fileFieldsForm.get('21').get('effectiveValue').value === 0 ||
                    (this.fileFieldsForm.get('21').get('effectiveValue').value === 1 &&
                        this.report856)
                        ? Validators.required
                        : Validators.nullValidator
                ]
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
        this.arrReceipt.push(
            this.fb.group(
                Object.assign(
                    obj,
                    is_matah
                        ? {
                            totalMatah: this.fb.control(
                                {
                                    value: '',
                                    disabled: true
                                },
                                [Validators.required]
                            ),
                            paymentTotalMatah: this.fb.control({
                                value: '',
                                disabled: this.fileDetailsSave.splitType !== 'FOREIGN_OPEN'
                            }),
                            paymentNikuiMatah: this.fb.control(
                                {
                                    value: '',
                                    disabled: true
                                },
                                [
                                    this.fileFieldsForm.get('21').get('effectiveValue')
                                        .value === 0 ||
                                    (this.fileFieldsForm.get('21').get('effectiveValue')
                                            .value === 1 &&
                                        this.report856)
                                        ? Validators.required
                                        : Validators.nullValidator
                                ]
                            )
                        }
                        : {}
                )
            )
        );
    }

    removeReceipt(index: number) {
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1;
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
        if (is_matah) {
            this.arrReceipt.controls[index - 1].patchValue({
                totalMatah:
                    toFixedNumber(
                        Number(this.arrReceipt.controls[index - 1].get('totalMatah').value)
                    ) +
                    toFixedNumber(
                        Number(this.arrReceipt.controls[index].get('totalMatah').value)
                    ),
                paymentTotalMatah:
                    toFixedNumber(
                        Number(
                            this.arrReceipt.controls[index - 1].get('paymentTotalMatah').value
                        )
                    ) +
                    toFixedNumber(
                        Number(
                            this.arrReceipt.controls[index].get('paymentTotalMatah').value
                        )
                    ),
                paymentNikuiMatah:
                    toFixedNumber(
                        Number(
                            this.arrReceipt.controls[index - 1].get('paymentNikuiMatah').value
                        )
                    ) +
                    toFixedNumber(
                        Number(
                            this.arrReceipt.controls[index].get('paymentNikuiMatah').value
                        )
                    )
            });
        }
        this.arrReceipt.removeAt(index);
        this.arrReceipt.updateValueAndValidity();

        // if (this.arrReceipt.controls.length > 1) {
        //     this.arrReceipt.controls[0].get('custId').disable();
        // } else {
        //     this.arrReceipt.controls[0].get('custId').enable();
        // }
        this.calcReceipt();
    }

    public calcReceipt(
        calcByTotalIncludedMaam?: boolean,
        indexRow?: number,
        isKeyPress?: string
    ): void {
        this.calcProgress = true;
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1;
        const rate = Number(this.rate);
        let precenf = 0;
        const arrOfTypesCode =
            this.fileFieldsForm.get('21').get('effectiveValue').value === 1
                ? this.companyCustomerDetailsData.transTypeDefinedExpense41
                : this.companyCustomerDetailsData.transTypeDefinedIncome41;
        const typeExist = arrOfTypesCode.find(
            (code) =>
                code.value ===
                this.arrReceipt.controls[0].get('transTypeReceiptCode').value
        );
        if (typeExist && this.fileFieldsForm.get('41')) {
            precenf = typeExist.precenf ? typeExist.precenf : 0;
        }
        if (indexRow !== undefined) {
            // console.log('typeExist.precenf of first row----', precenf);
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
            if (is_matah) {
                if (
                    !(
                        this.arrReceipt.controls[indexRow]
                            .get('paymentNikuiMatah')
                            .value.toString()
                            .slice(-1) === '.' ||
                        this.arrReceipt.controls[indexRow]
                            .get('paymentNikuiMatah')
                            .value.toString()
                            .slice(-2) === '.0'
                    )
                ) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        paymentNikuiMatah: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentNikuiMatah').value
                        )
                    });
                }
                if (
                    !(
                        this.arrReceipt.controls[indexRow]
                            .get('paymentNikuiMatah')
                            .value.toString()
                            .slice(-1) === '.' ||
                        this.arrReceipt.controls[indexRow]
                            .get('paymentNikuiMatah')
                            .value.toString()
                            .slice(-2) === '.0'
                    )
                ) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        paymentNikuiMatah: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentNikuiMatah').value
                        )
                    });
                }
            }
        }

        const fieldSumAll = Number(
            this.fileFieldsForm.get('17').get('effectiveValue').value
        );
        const fieldSumAllMatah =
            Number(this.fileFieldsForm.get('17').get('effectiveValue').value) / rate;

        clearTimeout(this.debounce);
        this.debounce = setTimeout(() => {
            if (isKeyPress === 'paymentTotal') {
                // const sumsTotals = this.arrReceipt.controls.reduce((total, item, currentIndex) => {
                //     return [total[0] + Number(item.get('total').value), total[1] + Number(item.get('paymentNikui').value), total[2] + Number(item.get('paymentTotal').value)];
                // }, [0, 0, 0]);
                // console.log(Number(this.fileFieldsForm.get('17').get('effectiveValue').value), (sumsTotals[1] + sumsTotals[2]));
                // if ((sumsTotals[1] + sumsTotals[2]) > Number(this.fileFieldsForm.get('17').get('effectiveValue').value)) {
                //     const sumsOfAllTheOtherRows = (sumsTotals[0]) - (toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)));
                //     this.arrReceipt.controls[indexRow].patchValue({
                //         paymentTotal: toFixedNumber(Number(this.fileFieldsForm.get('17').get('effectiveValue').value) - sumsOfAllTheOtherRows),
                //         paymentNikui: toFixedNumber(0)
                //     });
                // }
                if (is_matah) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        totalMatah: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('total').value / rate
                        ),
                        paymentTotalMatah: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentTotal').value /
                            rate
                        ),
                        paymentNikuiMatah:
                            toFixedNumber(
                                this.arrReceipt.controls[indexRow].get('total').value / rate
                            ) -
                            toFixedNumber(
                                this.arrReceipt.controls[indexRow].get('paymentTotal').value /
                                rate
                            ) //toFixedNumber(this.arrReceipt.controls[indexRow].get('paymentNikui').value / rate)
                    });
                }
                const sumsTotals2 = this.arrReceipt.controls.reduce(
                    (total, item, currentIndex) => {
                        if (currentIndex !== indexRow + 1) {
                            return [
                                total[0] + Number(item.get('paymentTotal').value),
                                total[1] + Number(item.get('paymentNikui').value)
                            ];
                        } else {
                            return [total[0], total[1]];
                        }
                    },
                    [0, 0]
                );
                const totalNow = sumsTotals2[0] + sumsTotals2[1];
                if (totalNow < fieldSumAll) {
                    const difBetweenSums = fieldSumAll - totalNow;
                    if (this.arrReceipt.controls[indexRow + 1] !== undefined) {
                        this.arrReceipt.controls[indexRow + 1].patchValue({
                            total: toFixedNumber(difBetweenSums),
                            paymentTotal: toFixedNumber(difBetweenSums),
                            paymentNikui: toFixedNumber(0)
                        });
                        if (is_matah) {
                            this.arrReceipt.controls[indexRow + 1].patchValue({
                                totalMatah: toFixedNumber(difBetweenSums / rate),
                                paymentTotalMatah: toFixedNumber(difBetweenSums / rate),
                                paymentNikuiMatah: toFixedNumber(0)
                            });
                        }
                    } else {
                        const obj = {
                            thirdDateOpen: false,
                            invoiceDate: this.fb.control({
                                value: this.arrReceipt.controls[0].get('invoiceDate').value,
                                disabled: true
                            }),
                            dateValue: this.fb.control({
                                value: this.arrReceipt.controls[0].get('dateValue').value,
                                disabled: false
                            }),
                            thirdDate: this.fb.control({
                                value: this.arrReceipt.controls[0].get('thirdDate').value,
                                disabled: false
                            }),
                            transTypeReceiptCode: this.fb.control({
                                value: this.arrReceipt.controls[0].get('transTypeReceiptCode')
                                    .value,
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
                                    value: this.arrReceipt.controls[0].get('paymentCustId').value,
                                    disabled: false
                                },
                                [Validators.required]
                            ),
                            total: this.fb.control(
                                {
                                    value: toFixedNumber(difBetweenSums),
                                    disabled: true
                                },
                                [Validators.required]
                            ),
                            paymentTotal: this.fb.control(
                                {
                                    value: toFixedNumber(
                                        difBetweenSums - precenf * (difBetweenSums / 100)
                                    ),
                                    disabled: is_matah
                                        ? this.fileDetailsSave.splitType === 'FOREIGN_OPEN'
                                        : false
                                },
                                [Validators.required]
                            ),
                            paymentNikui: this.fb.control(
                                {
                                    value: toFixedNumber(precenf * (difBetweenSums / 100)),
                                    disabled: true
                                },
                                [
                                    this.fileFieldsForm.get('21').get('effectiveValue').value ===
                                    0 ||
                                    (this.fileFieldsForm.get('21').get('effectiveValue').value ===
                                        1 &&
                                        this.report856)
                                        ? Validators.required
                                        : Validators.nullValidator
                                ]
                            ),
                            taxDeductionCustId: this.fb.control(
                                {
                                    //כרטיס ניכוי מס
                                    value:
                                    this.arrReceipt.controls[0].get('taxDeductionCustId').value,
                                    disabled:
                                    this.arrReceipt.controls[0].get('taxDeductionCustId')
                                        .disabled
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
                        this.arrReceipt.push(
                            this.fb.group(
                                Object.assign(
                                    obj,
                                    is_matah
                                        ? {
                                            totalMatah: this.fb.control(
                                                {
                                                    value: toFixedNumber(difBetweenSums / rate),
                                                    disabled: true
                                                },
                                                [Validators.required]
                                            ),
                                            paymentTotalMatah: this.fb.control({
                                                value: toFixedNumber(
                                                    difBetweenSums / rate -
                                                    precenf * (difBetweenSums / rate / 100)
                                                ),
                                                disabled:
                                                    this.fileDetailsSave.splitType !== 'FOREIGN_OPEN'
                                            }),
                                            paymentNikuiMatah: this.fb.control(
                                                {
                                                    value: toFixedNumber(
                                                        precenf * (difBetweenSums / rate / 100)
                                                    ),
                                                    disabled: true
                                                },
                                                [
                                                    this.fileFieldsForm.get('21').get('effectiveValue')
                                                        .value === 0 ||
                                                    (this.fileFieldsForm.get('21').get('effectiveValue')
                                                            .value === 1 &&
                                                        this.report856)
                                                        ? Validators.required
                                                        : Validators.nullValidator
                                                ]
                                            )
                                        }
                                        : {}
                                )
                            )
                        );
                        this.arrReceipt.controls[0].get('custId').disable();
                    }
                } else if (totalNow > fieldSumAll) {
                    if (indexRow === 0) {
                        const difBetweenSums = totalNow - fieldSumAll;
                        if (
                            toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                )
                            ) -
                            difBetweenSums >=
                            0
                        ) {
                            this.arrReceipt.controls[indexRow].patchValue({
                                paymentNikui:
                                    toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('paymentNikui')
                                                .value
                                        )
                                    ) - difBetweenSums
                            });
                            if (is_matah) {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentNikuiMatah: toFixedNumber(
                                        (toFixedNumber(
                                                Number(
                                                    this.arrReceipt.controls[indexRow].get('paymentNikui')
                                                        .value
                                                )
                                            ) -
                                            difBetweenSums) /
                                        rate
                                    )
                                });
                            }
                        } else {
                            this.arrReceipt.controls[indexRow].patchValue({
                                paymentTotal: toFixedNumber(
                                    Number(this.arrReceipt.controls[indexRow].get('total').value)
                                )
                            });
                            if (is_matah) {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentTotalMatah: toFixedNumber(
                                        toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get('total').value
                                            )
                                        ) / rate
                                    )
                                });
                            }
                        }
                    } else {
                        const sumsTotals3 = this.arrReceipt.controls.reduce(
                            (total, item, currentIndex) => {
                                if (currentIndex !== indexRow - 1) {
                                    return [
                                        total[0] + Number(item.get('paymentTotal').value),
                                        total[1] + Number(item.get('paymentNikui').value)
                                    ];
                                } else {
                                    return [total[0], total[1]];
                                }
                            },
                            [0, 0, 0]
                        );
                        const totalNowWithoutPrev = sumsTotals3[0] + sumsTotals3[1];
                        const difBetweenSums = fieldSumAll - totalNowWithoutPrev;
                        if (difBetweenSums >= 1) {
                            const newPaymentTotal =
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow - 1].get('paymentTotal')
                                            .value
                                    )
                                ) -
                                (toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('paymentTotal').value
                                        )
                                    ) -
                                    toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('total').value
                                        )
                                    ));
                            if (newPaymentTotal >= 0) {
                                this.arrReceipt.controls[indexRow - 1].patchValue({
                                    paymentTotal: newPaymentTotal,
                                    total:
                                        toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow - 1].get(
                                                    'paymentNikui'
                                                ).value
                                            )
                                        ) + newPaymentTotal
                                });
                                if (is_matah) {
                                    this.arrReceipt.controls[indexRow - 1].patchValue({
                                        paymentTotalMatah: toFixedNumber(newPaymentTotal / rate),
                                        totalMatah: toFixedNumber(
                                            (toFixedNumber(
                                                    Number(
                                                        this.arrReceipt.controls[indexRow - 1].get(
                                                            'paymentNikui'
                                                        ).value
                                                    )
                                                ) +
                                                newPaymentTotal) /
                                            rate
                                        )
                                    });
                                }
                            } else {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentTotal: toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('total').value
                                        )
                                    )
                                });
                                if (is_matah) {
                                    this.arrReceipt.controls[indexRow].patchValue({
                                        paymentTotalMatah: toFixedNumber(
                                            toFixedNumber(
                                                Number(
                                                    this.arrReceipt.controls[indexRow].get('total').value
                                                )
                                            ) / rate
                                        )
                                    });
                                }
                            }
                        } else {
                            this.arrReceipt.controls[indexRow].patchValue({
                                paymentTotal: toFixedNumber(
                                    Number(this.arrReceipt.controls[indexRow].get('total').value)
                                )
                            });
                            if (is_matah) {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentTotalMatah: toFixedNumber(
                                        toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get('total').value
                                            )
                                        ) / rate
                                    )
                                });
                            }
                        }
                    }
                }
                this.arrReceipt.controls[indexRow].patchValue({
                    total:
                        toFixedNumber(
                            Number(
                                this.arrReceipt.controls[indexRow].get('paymentNikui').value
                            )
                        ) +
                        toFixedNumber(
                            Number(
                                this.arrReceipt.controls[indexRow].get('paymentTotal').value
                            )
                        )
                });
                if (is_matah) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        totalMatah: toFixedNumber(
                            (toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                    )
                                ) +
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentTotal').value
                                    )
                                )) /
                            rate
                        )
                    });
                }

                if (typeExist && this.fileFieldsForm.get('41')) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        paymentNikui: toFixedNumber(
                            precenf *
                            (Number(this.arrReceipt.controls[indexRow].get('total').value) /
                                100)
                        )
                    });
                    this.calcReceipt(false, indexRow, 'paymentNikui');
                }
            }
            if (isKeyPress === 'paymentNikui' && indexRow === 0) {
                if (is_matah) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        totalMatah: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('total').value / rate
                        ),
                        paymentTotalMatah:
                            toFixedNumber(
                                this.arrReceipt.controls[indexRow].get('total').value / rate
                            ) -
                            toFixedNumber(
                                this.arrReceipt.controls[indexRow].get('paymentNikui').value /
                                rate
                            ),
                        paymentNikuiMatah: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentNikui').value /
                            rate
                        )
                    });
                }
                if (
                    toFixedNumber(
                        Number(this.arrReceipt.controls[indexRow].get('total').value)
                    ) -
                    toFixedNumber(
                        Number(
                            this.arrReceipt.controls[indexRow].get('paymentNikui').value
                        )
                    ) >=
                    0
                ) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        paymentTotal: toFixedNumber(
                            toFixedNumber(
                                Number(this.arrReceipt.controls[indexRow].get('total').value)
                            ) -
                            toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentNikui').value
                                )
                            )
                        )
                    });
                    if (is_matah) {
                        this.arrReceipt.controls[indexRow].patchValue({
                            paymentTotalMatah: toFixedNumber(
                                (toFixedNumber(
                                        Number(this.arrReceipt.controls[indexRow].get('total').value)
                                    ) -
                                    toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('paymentNikui')
                                                .value
                                        )
                                    )) /
                                rate
                            )
                        });
                    }
                } else {
                    this.arrReceipt.controls[indexRow].patchValue({
                        paymentTotal: 0,
                        paymentNikui: toFixedNumber(
                            Number(this.arrReceipt.controls[indexRow].get('total').value)
                        )
                    });
                    if (is_matah) {
                        this.arrReceipt.controls[indexRow].patchValue({
                            paymentTotalMatah: 0,
                            paymentNikuiMatah: toFixedNumber(
                                toFixedNumber(
                                    Number(this.arrReceipt.controls[indexRow].get('total').value)
                                ) / rate
                            )
                        });
                    }
                }

                // const sumsTotals = this.arrReceipt.controls.reduce((total, item, currentIndex) => {
                //     return [total[0] + Number(item.get('total').value), total[1] + Number(item.get('paymentNikui').value), total[2] + Number(item.get('paymentTotal').value)];
                // }, [0, 0, 0]);
                // console.log(Number(this.fileFieldsForm.get('17').get('effectiveValue').value), (sumsTotals[1] + sumsTotals[2]));
                // if ((sumsTotals[1] + sumsTotals[2]) > Number(this.fileFieldsForm.get('17').get('effectiveValue').value)) {
                //     const sumsOfAllTheOtherRows = (sumsTotals[0]) - (toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)));
                //     this.arrReceipt.controls[indexRow].patchValue({
                //         paymentNikui: toFixedNumber(Number(this.fileFieldsForm.get('17').get('effectiveValue').value) - sumsOfAllTheOtherRows),
                //         paymentTotal: toFixedNumber(0)
                //     });
                // } else {
                //     this.arrReceipt.controls[indexRow].patchValue({
                //         paymentTotal: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)) - toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value))
                //     });
                // }
            }
            if (is_matah) {
                if (isKeyPress === 'paymentTotalMatah') {
                    this.arrReceipt.controls[indexRow].patchValue({
                        total: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('totalMatah').value * rate
                        ),
                        paymentTotal: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentTotalMatah')
                                .value * rate
                        ),
                        paymentNikui: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentNikuiMatah')
                                .value * rate
                        )
                    });
                    const sumsTotals2 = this.arrReceipt.controls.reduce(
                        (total, item, currentIndex) => {
                            if (currentIndex !== indexRow + 1) {
                                return [
                                    total[0] + Number(item.get('paymentTotalMatah').value),
                                    total[1] + Number(item.get('paymentNikuiMatah').value)
                                ];
                            } else {
                                return [total[0], total[1]];
                            }
                        },
                        [0, 0]
                    );
                    const totalNow = sumsTotals2[0] + sumsTotals2[1];
                    if (totalNow < fieldSumAllMatah) {
                        const difBetweenSums = fieldSumAllMatah - totalNow;
                        if (this.arrReceipt.controls[indexRow + 1] !== undefined) {
                            this.arrReceipt.controls[indexRow + 1].patchValue({
                                total: toFixedNumber(difBetweenSums * rate),
                                paymentTotal: toFixedNumber(difBetweenSums * rate),
                                paymentNikui: toFixedNumber(0),
                                totalMatah: toFixedNumber(difBetweenSums),
                                paymentTotalMatah: toFixedNumber(difBetweenSums),
                                paymentNikuiMatah: toFixedNumber(0)
                            });
                        } else {
                            const obj = {
                                thirdDateOpen: false,
                                invoiceDate: this.fb.control({
                                    value: this.arrReceipt.controls[0].get('invoiceDate').value,
                                    disabled: true
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
                                        value:
                                        this.arrReceipt.controls[0].get('paymentCustId').value,
                                        disabled: false
                                    },
                                    [Validators.required]
                                ),
                                total: this.fb.control(
                                    {
                                        value: toFixedNumber(difBetweenSums * rate),
                                        disabled: true
                                    },
                                    [Validators.required]
                                ),
                                paymentTotal: this.fb.control(
                                    {
                                        value: toFixedNumber(
                                            difBetweenSums * rate -
                                            precenf * ((difBetweenSums * rate) / 100)
                                        ),
                                        disabled: is_matah
                                            ? this.fileDetailsSave.splitType === 'FOREIGN_OPEN'
                                            : false
                                    },
                                    [Validators.required]
                                ),
                                paymentNikui: this.fb.control(
                                    {
                                        value: toFixedNumber(
                                            precenf * ((difBetweenSums * rate) / 100)
                                        ),
                                        disabled: true
                                    },
                                    [
                                        this.fileFieldsForm.get('21').get('effectiveValue')
                                            .value === 0 ||
                                        (this.fileFieldsForm.get('21').get('effectiveValue')
                                                .value === 1 &&
                                            this.report856)
                                            ? Validators.required
                                            : Validators.nullValidator
                                    ]
                                ),
                                taxDeductionCustId: this.fb.control(
                                    {
                                        //כרטיס ניכוי מס
                                        value:
                                        this.arrReceipt.controls[0].get('taxDeductionCustId')
                                            .value,
                                        disabled:
                                        this.arrReceipt.controls[0].get('taxDeductionCustId')
                                            .disabled
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
                                }),
                                totalMatah: this.fb.control(
                                    {
                                        value: toFixedNumber(difBetweenSums),
                                        disabled: true
                                    },
                                    [Validators.required]
                                ),
                                paymentTotalMatah: this.fb.control({
                                    value: toFixedNumber(
                                        difBetweenSums - precenf * (difBetweenSums / 100)
                                    ),
                                    disabled: this.fileDetailsSave.splitType !== 'FOREIGN_OPEN'
                                }),
                                paymentNikuiMatah: this.fb.control(
                                    {
                                        value: toFixedNumber(precenf * (difBetweenSums / 100)),
                                        disabled: true
                                    },
                                    [
                                        this.fileFieldsForm.get('21').get('effectiveValue')
                                            .value === 0 ||
                                        (this.fileFieldsForm.get('21').get('effectiveValue')
                                                .value === 1 &&
                                            this.report856)
                                            ? Validators.required
                                            : Validators.nullValidator
                                    ]
                                )
                            };
                            this.arrReceipt.push(this.fb.group(obj));
                            this.arrReceipt.controls[0].get('custId').disable();
                        }
                    } else if (totalNow > fieldSumAllMatah) {
                        if (indexRow === 0) {
                            const difBetweenSums = totalNow - fieldSumAllMatah;
                            if (
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikuiMatah')
                                            .value
                                    )
                                ) -
                                difBetweenSums >=
                                0
                            ) {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentNikui: toFixedNumber(
                                        (toFixedNumber(
                                                Number(
                                                    this.arrReceipt.controls[indexRow].get(
                                                        'paymentNikuiMatah'
                                                    ).value
                                                )
                                            ) -
                                            difBetweenSums) *
                                        rate
                                    ),
                                    paymentNikuiMatah:
                                        toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get(
                                                    'paymentNikuiMatah'
                                                ).value
                                            )
                                        ) - difBetweenSums
                                });
                            } else {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentTotalMatah: toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('totalMatah').value
                                        )
                                    ),
                                    paymentTotal: toFixedNumber(
                                        toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get('totalMatah')
                                                    .value
                                            )
                                        ) * rate
                                    )
                                });
                            }
                        } else {
                            const sumsTotals3 = this.arrReceipt.controls.reduce(
                                (total, item, currentIndex) => {
                                    if (currentIndex !== indexRow - 1) {
                                        return [
                                            total[0] + Number(item.get('paymentTotalMatah').value),
                                            total[1] + Number(item.get('paymentNikuiMatah').value)
                                        ];
                                    } else {
                                        return [total[0], total[1]];
                                    }
                                },
                                [0, 0, 0]
                            );
                            const totalNowWithoutPrev = sumsTotals3[0] + sumsTotals3[1];
                            const difBetweenSums = fieldSumAllMatah - totalNowWithoutPrev;
                            if (difBetweenSums >= 1) {
                                const newPaymentTotal =
                                    toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow - 1].get(
                                                'paymentTotalMatah'
                                            ).value
                                        )
                                    ) -
                                    (toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get(
                                                    'paymentTotalMatah'
                                                ).value
                                            )
                                        ) -
                                        toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get('totalMatah')
                                                    .value
                                            )
                                        ));
                                if (newPaymentTotal >= 0) {
                                    this.arrReceipt.controls[indexRow - 1].patchValue({
                                        paymentTotalMatah: newPaymentTotal,
                                        totalMatah:
                                            toFixedNumber(
                                                Number(
                                                    this.arrReceipt.controls[indexRow - 1].get(
                                                        'paymentNikuiMatah'
                                                    ).value
                                                )
                                            ) + newPaymentTotal,
                                        paymentTotal: toFixedNumber(newPaymentTotal * rate),
                                        total: toFixedNumber(
                                            (toFixedNumber(
                                                    Number(
                                                        this.arrReceipt.controls[indexRow - 1].get(
                                                            'paymentNikuiMatah'
                                                        ).value
                                                    )
                                                ) +
                                                newPaymentTotal) *
                                            rate
                                        )
                                    });
                                } else {
                                    this.arrReceipt.controls[indexRow].patchValue({
                                        paymentTotalMatah: toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get('totalMatah')
                                                    .value
                                            )
                                        ),
                                        paymentTotal: toFixedNumber(
                                            toFixedNumber(
                                                Number(
                                                    this.arrReceipt.controls[indexRow].get('totalMatah')
                                                        .value
                                                )
                                            ) * rate
                                        )
                                    });
                                }
                            } else {
                                this.arrReceipt.controls[indexRow].patchValue({
                                    paymentTotalMatah: toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('totalMatah').value
                                        )
                                    ),
                                    paymentTotal: toFixedNumber(
                                        toFixedNumber(
                                            Number(
                                                this.arrReceipt.controls[indexRow].get('totalMatah')
                                                    .value
                                            )
                                        ) * rate
                                    )
                                });
                            }
                        }
                    }

                    this.arrReceipt.controls[indexRow].patchValue({
                        total: toFixedNumber(
                            (toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikuiMatah')
                                            .value
                                    )
                                ) +
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentTotalMatah')
                                            .value
                                    )
                                )) *
                            rate
                        ),
                        totalMatah:
                            toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentNikuiMatah')
                                        .value
                                )
                            ) +
                            toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('paymentTotalMatah')
                                        .value
                                )
                            )
                    });
                }
                if (isKeyPress === 'paymentNikuiMatah' && indexRow === 0) {
                    this.arrReceipt.controls[indexRow].patchValue({
                        total: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('totalMatah').value * rate
                        ),
                        paymentTotal: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentTotalMatah')
                                .value * rate
                        ),
                        paymentNikui: toFixedNumber(
                            this.arrReceipt.controls[indexRow].get('paymentNikuiMatah')
                                .value * rate
                        )
                    });
                    if (
                        toFixedNumber(
                            Number(this.arrReceipt.controls[indexRow].get('totalMatah').value)
                        ) -
                        toFixedNumber(
                            Number(
                                this.arrReceipt.controls[indexRow].get('paymentNikuiMatah')
                                    .value
                            )
                        ) >=
                        0
                    ) {
                        this.arrReceipt.controls[indexRow].patchValue({
                            paymentTotalMatah:
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('totalMatah').value
                                    )
                                ) -
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('paymentNikuiMatah')
                                            .value
                                    )
                                ),
                            paymentTotal: toFixedNumber(
                                (toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get('totalMatah').value
                                        )
                                    ) -
                                    toFixedNumber(
                                        Number(
                                            this.arrReceipt.controls[indexRow].get(
                                                'paymentNikuiMatah'
                                            ).value
                                        )
                                    )) *
                                rate
                            )
                        });
                    } else {
                        this.arrReceipt.controls[indexRow].patchValue({
                            paymentTotal: 0,
                            paymentNikuiMatah: toFixedNumber(
                                Number(
                                    this.arrReceipt.controls[indexRow].get('totalMatah').value
                                )
                            ),
                            paymentTotalMatah: 0,
                            paymentNikui: toFixedNumber(
                                toFixedNumber(
                                    Number(
                                        this.arrReceipt.controls[indexRow].get('totalMatah').value
                                    )
                                ) * rate
                            )
                        });
                    }
                }
            }
            this.calcProgress = false;
        }, 500);

        // const sumsTotalsChildWithoutCurrent = this.arrReceipt.controls.reduce((total, item, currentIndex) => {
        //     if (currentIndex !== 0 && currentIndex !== indexRow) {
        //         return [total[0] + Number(item.get('total').value), total[1] + Number(item.get('paymentNikui').value), total[2] + Number(item.get('paymentTotal').value)];
        //     } else {
        //         return [total[0], total[1], total[2]];
        //     }
        // }, [0, 0, 0]);
        // //console.log('sumsTotalsChildWithoutCurrent', sumsTotalsChildWithoutCurrent);
        // const totalChildWithoutCurrent = Number(this.saverValuesReceipt.total) - sumsTotalsChildWithoutCurrent[0];
        // const paymentNikuiChildWithoutCurrent = Number(this.saverValuesReceipt.paymentNikui) - sumsTotalsChildWithoutCurrent[1];
        // const paymentTotalChildWithoutCurrent = Number(this.saverValuesReceipt.paymentTotal) - sumsTotalsChildWithoutCurrent[2];
        //
        // if (calcByTotalIncludedMaam !== undefined) {
        //     if (Number(this.arrReceipt.controls[indexRow].get('total').value) >= totalChildWithoutCurrent) {
        //         this.arrReceipt.controls[indexRow].patchValue({
        //             total: toFixedNumber(totalChildWithoutCurrent === 0 ? 0 : (totalChildWithoutCurrent - 1))
        //         });
        //     }
        //     if (Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value) >= paymentNikuiChildWithoutCurrent) {
        //         this.arrReceipt.controls[indexRow].patchValue({
        //             paymentNikui: toFixedNumber(paymentNikuiChildWithoutCurrent === 0 ? 0 : (paymentNikuiChildWithoutCurrent - 1))
        //         });
        //     }
        //     if (Number(this.arrReceipt.controls[indexRow].get('paymentTotal').value) >= paymentTotalChildWithoutCurrent) {
        //         this.arrReceipt.controls[indexRow].patchValue({
        //             paymentTotal: toFixedNumber(paymentTotalChildWithoutCurrent === 0 ? 0 : (paymentTotalChildWithoutCurrent - 1))
        //         });
        //     }
        //
        //     if (!(isKeyPress &&
        //         (
        //             (calcByTotalIncludedMaam && (this.arrReceipt.controls[indexRow].get('total').value.toString().slice(-1) === '.' || this.arrReceipt.controls[indexRow].get('total').value.toString().slice(-2) === '.0'))
        //             ||
        //             (!calcByTotalIncludedMaam && (this.arrReceipt.controls[indexRow].get('paymentNikui').value.toString().slice(-1) === '.' || this.arrReceipt.controls[indexRow].get('paymentNikui').value.toString().slice(-2) === '.0'))
        //             ||
        //             (!calcByTotalIncludedMaam && (this.arrReceipt.controls[indexRow].get('paymentTotal').value.toString().slice(-1) === '.' || this.arrReceipt.controls[indexRow].get('paymentTotal').value.toString().slice(-2) === '.0'))
        //         ))) {
        //         this.arrReceipt.controls[indexRow].patchValue({
        //             total: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('total').value)),
        //             paymentNikui: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value)),
        //             paymentTotal: toFixedNumber(Number(this.arrReceipt.controls[indexRow].get('paymentTotal').value)),
        //         });
        //     }
        //
        // }

        // if (!isKeyPress) {
        //     const sumsChildrensTotals = this.arrReceipt.controls.reduce((total, item, currentIndex) => {
        //         if (currentIndex !== 0) {
        //             return [total[0] + Number(item.get('paymentNikui').value), total[1] + Number(item.get('paymentTotal').value)];
        //         } else {
        //             return [total[0], total[1]];
        //         }
        //     }, [0, 0]);
        //     this.arrReceipt.controls[0].patchValue({
        //         paymentNikui: Math.abs(this.saverValuesReceipt.paymentNikui - sumsChildrensTotals[0]),
        //         paymentTotal: Math.abs(this.saverValuesReceipt.paymentTotal - sumsChildrensTotals[1])
        //     });
        //     this.arrReceipt.controls[0].patchValue({
        //         total: toFixedNumber(Number(this.arrReceipt.controls[0].get('paymentNikui').value)) + toFixedNumber(Number(this.arrReceipt.controls[0].get('paymentTotal').value))
        //     });
        // }
        // if (indexRow !== 0) {
        //     this.arrReceipt.controls[0].patchValue({
        //         total: toFixedNumber(
        //             Number(this.saverValuesReceipt.total) - (sumsTotalsChildWithoutCurrent[0] + (indexRow !== undefined ? Number(this.arrReceipt.controls[indexRow].get('total').value) : 0))
        //         ),
        //         paymentNikui: toFixedNumber(
        //             Number(this.saverValuesReceipt.paymentNikui) - (sumsTotalsChildWithoutCurrent[1] + (indexRow !== undefined ? Number(this.arrReceipt.controls[indexRow].get('paymentNikui').value) : 0))
        //         ),
        //         paymentTotal: toFixedNumber(
        //             Number(this.saverValuesReceipt.paymentTotal) - (sumsTotalsChildWithoutCurrent[2] + (indexRow !== undefined ? Number(this.arrReceipt.controls[indexRow].get('paymentTotal').value) : 0))
        //         )
        //     });
        // }

        // console.log('this.saverValuesReceipt', this.saverValuesReceipt);
    }

    splitReceiptJournalTrans() {
        const is_matah =
            this.fileFieldsForm.get('12').get('effectiveValue').value !== 1;

        this.editReceiptModalShow = false;
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
        // if (this.arrReceipt.controls.length === 1) {
        //     this.splitPayment = false;
        //     this.fileFieldsForm.get('17').enable();
        //     this.fileFieldsForm.get('33').enable();
        // } else {
        //     this.splitPayment = true;
        //     this.fileFieldsForm.get('17').disable();
        //     this.fileFieldsForm.get('32').disable();
        //     this.fileFieldsForm.get('33').disable();
        // }

        this.ocrService
            .splitReceiptJournalTrans({
                companyId: this.userService.appData.userData.companySelect.companyId,
                fileId: this._fileScanView.fileId,
                payments: this.arrReceipt.controls.map((item) => ({
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
                        item['show_taxDeductionCustId'] === true ||
                        (item['show_taxDeductionCustId'] !== false &&
                            ((this.fileFieldsForm.get('33') &&
                                    this.fileFieldsForm.get('33').get('effectiveValue').value !==
                                    null) ||
                                (this.fileFieldsForm.get('41') &&
                                    this.fileFieldsForm.get('41').get('effectiveValue').value &&
                                    item.get('taxDeductionCustId').value)))
                            ? !item.get('taxDeductionCustId').value
                                ? null
                                : item.get('taxDeductionCustId').value.custId
                            : null,
                    total: item.get('total').value,
                    paymentNikui:
                        item['show_taxDeductionCustId'] === true ||
                        (item['show_taxDeductionCustId'] !== false &&
                            ((this.fileFieldsForm.get('33') &&
                                    this.fileFieldsForm.get('33').get('effectiveValue').value !==
                                    null) ||
                                (this.fileFieldsForm.get('41') &&
                                    this.fileFieldsForm.get('41').get('effectiveValue').value &&
                                    item.get('taxDeductionCustId').value)))
                            ? item.get('paymentNikui').value !== null
                                ? item.get('paymentNikui').value
                                : null
                            : null,
                    paymentTotal: item.get('paymentTotal').value,
                    paymentAsmachta: item.get('paymentAsmachta').value,
                    asmachta3: item.get('asmachta3').value,
                    details: item.get('details').value,
                    paymentTotalMatah: is_matah
                        ? item.get('paymentTotalMatah').value
                        : null,
                    paymentNikuiMatah: is_matah
                        ? item.get('paymentNikuiMatah').value
                        : null,
                    totalMatah: is_matah ? item.get('totalMatah').value : null,
                    transTypeReceiptCode: item.get('transTypeReceiptCode').value
                        ? item.get('transTypeReceiptCode').value
                        : null
                }))
            })
            .subscribe(() => {
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

    isDisabledSplitReceiptJournalTrans(): boolean {
        if (this.receipt && this.arrReceipt) {
            const is_matah =
                this.fileFieldsForm.get('12').get('effectiveValue').value !== 1;

            if (
                Object.values(this.arrReceipt.controls).some((fc) => {
                    const row_taxDeductionCustId_Exist =
                        fc['show_taxDeductionCustId'] === true ||
                        (fc['show_taxDeductionCustId'] !== false &&
                            ((this.fileFieldsForm.get('33') &&
                                    this.fileFieldsForm.get('33').get('effectiveValue').value !==
                                    null) ||
                                (this.fileFieldsForm.get('41') &&
                                    this.fileFieldsForm.get('41').get('effectiveValue').value &&
                                    fc.get('taxDeductionCustId').value)));
                    const valReq = {
                        // transTypeReceiptCode: this.fileFieldsForm.get('41') && fc.get('transTypeReceiptCode').enabled && fc.get('transTypeReceiptCode').invalid,
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
                        equalDropDowns:
                            fc.get('custId').value &&
                            fc.get('paymentCustId').value &&
                            fc.get('custId').value.custId ===
                            fc.get('paymentCustId').value.custId,
                        total: fc.get('total').enabled && fc.get('total').invalid,
                        paymentTotal:
                            fc.get('paymentTotal').enabled &&
                            (fc.get('paymentTotal').invalid ||
                                this.getNum(fc.get('paymentTotal').value) === 0),
                        paymentNikui:
                            row_taxDeductionCustId_Exist &&
                            fc.get('paymentNikui').enabled &&
                            fc.get('paymentNikui').invalid
                    };

                    if (is_matah) {
                        valReq['totalMatah'] =
                            fc.get('totalMatah').enabled && fc.get('totalMatah').invalid;
                        valReq['paymentTotalMatah'] =
                            fc.get('paymentTotalMatah').enabled &&
                            (fc.get('paymentTotalMatah').invalid ||
                                this.getNum(fc.get('paymentTotalMatah').value) === 0);
                        // valReq['paymentNikuiMatah'] = this.showTaxDeduction && fc.get('paymentNikuiMatah').enabled && (fc.get('paymentNikuiMatah').invalid);
                    }
                    const someIsInvalid = Object.values(valReq).some((val) => val);
                    console.log('----someIsInvalid----', someIsInvalid, valReq);
                    return someIsInvalid;
                })
            ) {
                return true;
            }
        }

        return false;
    }

    roundDigitsDec(number: any): number {
        return Math.round((Number(number) + Number.EPSILON) * 100) / 100;
    }

    roundFourDigits(number: any): number {
        return Math.round((Number(number) + Number.EPSILON) * 10000) / 10000;
    }

    getMousePosition(evt) {
        const svg = evt.target;
        const CTM = svg.getScreenCTM();
        return {
            x: (evt.clientX - CTM.e) / CTM.a,
            y: (evt.clientY - CTM.f) / CTM.d
        };
    }

    startDrag(evt) {
        if (evt.target.classList.contains('draggable')) {
            evt.preventDefault();
            this.selectedElement = evt.target;
            this.offset = this.getMousePosition(evt);
            this.offset.x -= parseFloat(
                this.selectedElement.getAttributeNS(null, 'x')
            );
            this.offset.y -= parseFloat(
                this.selectedElement.getAttributeNS(null, 'y')
            );
        }
    }

    calcDrag(evt, coord?: any) {
        let heightOfElem = Number(
            this.selectedElement.getAttributeNS(null, 'height')
        );
        let widthOfElem = Number(
            this.selectedElement.getAttributeNS(null, 'width')
        );

        let xOfElem;
        let yOfElem;

        if (coord) {
            xOfElem = Number(coord.x - this.offset.x);
            yOfElem = Number(coord.y - this.offset.y);
        } else {
            xOfElem = Number(this.selectedElement.getAttributeNS(null, 'x'));
            yOfElem = Number(this.selectedElement.getAttributeNS(null, 'y'));
        }

        // console.log(heightOfElem, widthOfElem, xOfElem, yOfElem);

        let mutatedVertices;
        if (evt.target.classList.contains('draggableTopLeft')) {
            // x = 0, 3 ---same
            // y = 0, 1 ---same
            const correctX =
                xOfElem + 60 < this.activeWord.position[1].x
                    ? xOfElem
                    : this.activeWord.position[1].x - 40;
            const correctY =
                yOfElem + 60 < this.activeWord.position[3].y
                    ? yOfElem
                    : this.activeWord.position[3].y - 40;
            this.selectedElement.setAttributeNS(null, 'x', correctX - 6);
            this.selectedElement.setAttributeNS(null, 'y', correctY - 6);
            mutatedVertices = [
                {
                    x: correctX,
                    y: correctY
                },
                {
                    x: this.activeWord.position[1].x,
                    y: correctY
                },
                {
                    x: this.activeWord.position[2].x,
                    y: this.activeWord.position[2].y
                },
                {
                    x: correctX,
                    y: this.activeWord.position[3].y
                }
            ];
        } else if (evt.target.classList.contains('draggableTopRight')) {
            // x = 1, 2 ---same
            // y = 1, 0 ---same
            const correctX =
                xOfElem + widthOfElem - 60 > this.activeWord.position[0].x
                    ? xOfElem + widthOfElem
                    : this.activeWord.position[0].x + 40;
            const correctY =
                yOfElem + 60 < this.activeWord.position[2].y
                    ? yOfElem
                    : this.activeWord.position[2].y - 40;
            this.selectedElement.setAttributeNS(null, 'x', correctX + 6 - 20);
            this.selectedElement.setAttributeNS(null, 'y', correctY - 6);

            mutatedVertices = [
                {
                    x: this.activeWord.position[0].x,
                    y: correctY
                },
                {
                    x: correctX,
                    y: correctY
                },
                {
                    x: correctX,
                    y: this.activeWord.position[2].y
                },
                {
                    x: this.activeWord.position[3].x,
                    y: this.activeWord.position[3].y
                }
            ];
        } else if (evt.target.classList.contains('draggableBottomRight')) {
            // x = 2, 1 ---same
            // y = 2, 3 ---same

            const correctX =
                xOfElem + widthOfElem - 60 > this.activeWord.position[3].x
                    ? xOfElem + widthOfElem
                    : this.activeWord.position[3].x + 40;
            const correctY =
                yOfElem + heightOfElem - 60 > this.activeWord.position[1].y
                    ? yOfElem + heightOfElem
                    : this.activeWord.position[1].y + 40;
            this.selectedElement.setAttributeNS(null, 'x', correctX + 6 - 20);
            this.selectedElement.setAttributeNS(null, 'y', correctY + 6 - 20);
            mutatedVertices = [
                {
                    x: this.activeWord.position[0].x,
                    y: this.activeWord.position[0].y
                },
                {
                    x: correctX,
                    y: this.activeWord.position[1].y
                },
                {
                    x: correctX,
                    y: correctY
                },
                {
                    x: this.activeWord.position[3].x,
                    y: correctY
                }
            ];
        } else if (evt.target.classList.contains('draggableBottomLeft')) {
            // x = 3, 0 ---same
            // y = 3, 2 ---same
            const correctY =
                yOfElem + heightOfElem - 60 > this.activeWord.position[0].y
                    ? yOfElem + heightOfElem
                    : this.activeWord.position[0].y + 40;
            const correctX =
                xOfElem + 60 < this.activeWord.position[2].x
                    ? xOfElem
                    : this.activeWord.position[2].x - 40;
            this.selectedElement.setAttributeNS(null, 'x', correctX - 6);
            this.selectedElement.setAttributeNS(null, 'y', correctY + 6 - 20);
            mutatedVertices = [
                {
                    x: correctX,
                    y: this.activeWord.position[0].y
                },
                {
                    x: this.activeWord.position[1].x,
                    y: this.activeWord.position[1].y
                },
                {
                    x: this.activeWord.position[2].x,
                    y: correctY
                },
                {
                    x: correctX,
                    y: correctY
                }
            ];
        } else {
            if (widthOfElem < 40) {
                widthOfElem = 40;
            }
            if (heightOfElem < 40) {
                heightOfElem = 40;
            }
            mutatedVertices = [
                {
                    x: xOfElem,
                    y: yOfElem
                },
                {
                    x: xOfElem + widthOfElem,
                    y: yOfElem
                },
                {
                    x: xOfElem + widthOfElem,
                    y: yOfElem + heightOfElem
                },
                {
                    x: xOfElem,
                    y: yOfElem + heightOfElem
                }
            ];
        }

        this.activeWord = {
            pageNo: this.currentPage.getValue(),
            position: mutatedVertices
        };
        this.inlineEditorForm.patchValue({
            fieldPosition: mutatedVertices
        });
    }

    drager(evt, width, height) {
        if (this.selectedElement) {
            evt.preventDefault();
            const coord = this.getMousePosition(evt);
            if (
                evt.target.classList.contains('draggableTopLeft') ||
                evt.target.classList.contains('draggableTopRight') ||
                evt.target.classList.contains('draggableBottomRight') ||
                evt.target.classList.contains('draggableBottomLeft')
            ) {
                this.calcDrag(evt, coord);
            } else {
                const x = coord.x - this.offset.x;
                const widthElem =
                    this.activeWord.position[1].x - this.activeWord.position[0].x;
                if (x <= 0 || x + widthElem >= width) {
                    return;
                }
                const y = coord.y - this.offset.y;
                const heightElem =
                    this.activeWord.position[3].y - this.activeWord.position[0].y;
                if (y <= 0 || y + heightElem >= height) {
                    return;
                }
                this.selectedElement.setAttributeNS(null, 'x', coord.x - this.offset.x);
                this.selectedElement.setAttributeNS(null, 'y', coord.y - this.offset.y);
            }
        }
    }

    endDrag(evt) {
        // if (this.selectedElement) {
        //     // console.log('endDrag');
        //     this.calcDrag(evt);
        //     this.currentPageVisionResults$
        //         .pipe(
        //             take(1)
        //         )
        //         .subscribe((visionResult) => {
        //             if (visionResult && visionResult.fullTextAnnotation
        //                 && Array.isArray(visionResult.fullTextAnnotation.pages)
        //                 && visionResult.fullTextAnnotation.pages.length) {
        //                 const syms = visionResult.fullTextAnnotation.pages[0].blocks
        //                     .flatMap(block => block.paragraphs
        //                         .flatMap(paragraph => paragraph.words
        //                             .flatMap(word => word.symbols
        //                                 .filter(sym => this.geometryHelper.rectanglesIntersect(
        //                                     this.activeWord.position,
        //                                     sym.boundingBox.vertices))
        //                             )
        //                         )
        //                     );
        //
        //                 this.inlineEditorForm.patchValue({
        //                     fieldPage: this.currentPage.getValue(),
        //                     fieldValue: this.stringifySymbols(syms)
        //                 });
        //             }
        //         });
        //
        //     this.selectedElement = null;
        // }
    }

    draggerCanvas(event) {
        const mutatedVertices = event.mutatedVertices;
        const indexOfCurentPage = this.sizeAllImg.pages.findIndex((it, idx) => {
            const endOfPage =
                this.sizeAllImg.pages[idx]['top'] +
                this.sizeAllImg.pages[idx]['height'];
            return mutatedVertices[0].y * this.imageScale <= endOfPage;
        });
        // console.log('mutatedVerticesFirst:', mutatedVertices);
        // console.log('indexOfCurentPage: ', indexOfCurentPage + 1);
        if (indexOfCurentPage + 1 !== this.activeWord.pageNo) {
            this.currentPage.next(indexOfCurentPage + 1);
        }

        mutatedVertices.forEach((it) => {
            it.y =
                (it.y * this.imageScale -
                    this.sizeAllImg.pages[indexOfCurentPage]['top']) /
                this.imageScale;
        });
        // console.log('mutatedVertices:', mutatedVertices);

        if (
            this.pagesScrollContainer &&
            this.pagesScrollContainer['nativeElement']
        ) {
            const hasScrollX =
                this.pagesScrollContainer['nativeElement'].scrollWidth -
                this.pagesScrollContainer['nativeElement'].clientWidth !==
                0;
            const hasScrollY =
                this.pagesScrollContainer['nativeElement'].scrollHeight -
                this.pagesScrollContainer['nativeElement'].clientHeight !==
                0;
            if (hasScrollY) {
                const startOfPage =
                    this.pagesScrollContainer['nativeElement'].scrollTop;
                const endLineStartOfPage = startOfPage + 50;

                const current_y =
                    mutatedVertices[0].y * this.imageScale +
                    this.sizeAllImg.pages[indexOfCurentPage]['top'];
                const current_y_bottom =
                    mutatedVertices[2].y * this.imageScale +
                    this.sizeAllImg.pages[indexOfCurentPage]['top'];

                if (startOfPage !== 0 && current_y <= endLineStartOfPage) {
                    console.log('between Top Header');
                    this.pagesScrollContainer['nativeElement'].scrollTo({
                        top: startOfPage - 15,
                        behavior: 'auto'
                    });
                }
                const heightScreen =
                    this.pagesScrollContainer['nativeElement'].scrollHeight -
                    this.pagesScrollContainer['nativeElement'].clientHeight;
                const endOfPage =
                    startOfPage + this.pagesScrollContainer['nativeElement'].clientHeight;
                const startLineStartOfPage = endOfPage - 50;
                // console.log('heightScreen', heightScreen);

                // console.log('scrollTop', startOfPage);
                // console.log('heightScreen', heightScreen);
                //
                // console.log('clientHeight', this.pagesScrollContainer['nativeElement'].clientHeight);
                // console.log('scrollTop + clientHeight', endOfPage);
                // console.log('(mutatedVertices[2].y * this.imageScale)', (mutatedVertices[2].y * this.imageScale));

                if (
                    startOfPage < heightScreen - 86 &&
                    current_y_bottom >= startLineStartOfPage
                ) {
                    console.log('between Bottom Footer');
                    this.pagesScrollContainer['nativeElement'].scrollTo({
                        top: startOfPage + 15,
                        behavior: 'auto'
                    });
                }
            }
            if (hasScrollX) {
                // const scrollLeftPage = this.pagesScrollContainer['nativeElement'].scrollLeft;
                const current_x =
                    mutatedVertices[0].x * this.imageScale +
                    (this.sizeAllImg.width -
                        this.sizeAllImg.pages[indexOfCurentPage]['width']) /
                    2;
                const current_x_right =
                    mutatedVertices[1].x * this.imageScale +
                    (this.sizeAllImg.width -
                        this.sizeAllImg.pages[indexOfCurentPage]['width']) /
                    2;
                const scrollLeftPage =
                    this.pagesScrollContainer['nativeElement'].scrollWidth -
                    this.pagesScrollContainer['nativeElement'].clientWidth -
                    Math.abs(this.pagesScrollContainer['nativeElement'].scrollLeft);
                const clientWidth =
                    this.pagesScrollContainer['nativeElement'].clientWidth;

                // console.log('scrollLeftPage: ', Math.abs(scrollLeftPage));
                // console.log('current_x_right: ', current_x_right);
                // console.log('clientWidth: ', clientWidth);
                // console.log('(this.pagesScrollContainer[\'nativeElement\'].scrollWidth - this.pagesScrollContainer[\'nativeElement\'].clientWidth): ', (this.pagesScrollContainer['nativeElement'].scrollWidth - this.pagesScrollContainer['nativeElement'].clientWidth));
                // console.log('xxx', clientWidth + Math.abs(scrollLeftPage));
                // console.log('this.sizeAllImg.width', this.sizeAllImg.width);
                // console.log('this.pagesScrollContainer[\'nativeElement\'].scrollWidth', this.pagesScrollContainer['nativeElement'].scrollWidth);

                if (
                    Math.abs(scrollLeftPage) !==
                    this.pagesScrollContainer['nativeElement'].scrollWidth -
                    this.pagesScrollContainer['nativeElement'].clientWidth &&
                    current_x_right >= clientWidth + Math.abs(scrollLeftPage) - 50
                ) {
                    console.log('between Right side');
                    this.pagesScrollContainer['nativeElement'].scrollTo({
                        left: this.pagesScrollContainer['nativeElement'].scrollLeft + 15,
                        behavior: 'auto'
                    });
                }

                // console.log('current_x: ', current_x);

                if (
                    Math.abs(scrollLeftPage) > 35 &&
                    current_x <= Math.abs(scrollLeftPage) + 50
                ) {
                    console.log('between Left side');
                    this.pagesScrollContainer['nativeElement'].scrollTo({
                        left: this.pagesScrollContainer['nativeElement'].scrollLeft - 15,
                        behavior: 'auto'
                    });
                }
            }
            // console.log(this.pagesScrollContainer['nativeElement'].scrollHeight, this.pagesScrollContainer['nativeElement'].clientHeight, this.pagesScrollContainer['nativeElement'].scrollHeight - this.pagesScrollContainer['nativeElement'].clientHeight, aaa, mutatedVertices[0].y * this.imageScale);
        }

        // console.log('this.currentPage.getValue(): ', this.currentPage.getValue());

        // const fieldPositionMutatedVertices = JSON.parse(JSON.stringify(mutatedVertices));
        // const spaceWidth = ((this.sizeAllImg.width - this.sizeAllImg.pages[indexOfCurentPage]['width']) / 2);
        // if (spaceWidth !== 0 || indexOfCurentPage !== 0) {
        // fieldPositionMutatedVertices.forEach(it => {
        //     it.y = ((((it.y * this.imageScale) - (this.sizeAllImg.pages[indexOfCurentPage]['top']))) / this.imageScale) - 7;
        //     it.x = ((((it.x) * this.imageScale) - ((((this.sizeAllImg.width - this.sizeAllImg.pages[indexOfCurentPage]['width']) / 2)))) / this.imageScale) + 7;
        // });
        this.activeWord = {
            pageNo: indexOfCurentPage + 1,
            position: mutatedVertices
        };
        // console.log('fieldPositionMutatedVertices:', fieldPositionMutatedVertices, this.imageScale);

        // const fieldPositionMutatedVerticesImageScale = JSON.parse(JSON.stringify(mutatedVertices));
        // fieldPositionMutatedVerticesImageScale.forEach(it => {
        //     it.y = (it.y * this.imageScale) - this.sizeAllImg.pages[indexOfCurentPage]['top'] - 7;
        //     it.x = (it.x * this.imageScale) - ((this.sizeAllImg.width - this.sizeAllImg.pages[indexOfCurentPage]['width']) / 2);
        // });
        // console.log('fieldPositionMutatedVerticesImageScale:', fieldPositionMutatedVerticesImageScale);

        this.inlineEditorForm.patchValue({
            fieldPosition: mutatedVertices,
            fieldPage: indexOfCurentPage + 1
        });

        if (
            mutatedVertices[0].x <= 0 ||
            mutatedVertices[1].x >=
            this.sizeAllImg.pages[indexOfCurentPage]['width'] / this.imageScale
        ) {
            if (mutatedVertices[0].x <= 0) {
                console.log('smaller left');
            }
            if (
                mutatedVertices[1].x >=
                this.sizeAllImg.pages[indexOfCurentPage]['width'] / this.imageScale
            ) {
                console.log('bigger right');
            }
        } else {
            const syms = this.visionResultsArr[indexOfCurentPage].filter((sym) => {
                if (sym.vertices.length === 4) {
                    if (sym.vertices[0].y !== sym.vertices[1].y) {
                        sym.vertices[0].y = sym.vertices[1].y;
                    }
                    if (sym.vertices[2].y !== sym.vertices[3].y) {
                        sym.vertices[2].y = sym.vertices[3].y;
                    }
                    if (sym.vertices[0].x !== sym.vertices[3].x) {
                        sym.vertices[0].x = sym.vertices[3].x;
                    }
                    if (sym.vertices[1].x !== sym.vertices[2].x) {
                        sym.vertices[1].x = sym.vertices[2].x;
                    }
                }
                sym.vertices.forEach((it) => {
                    if (it.x === undefined) {
                        it.x = 0;
                    }
                    if (it.y === undefined) {
                        it.y = 0;
                    }
                });
                if (
                    sym.vertices[1].x <= sym.vertices[0].x ||
                    sym.vertices[1].y >= sym.vertices[2].y
                ) {
                    return false;
                }
                return this.geometryHelper.rectangleContains(
                    mutatedVertices,
                    sym.vertices
                );
            });

            this.inlineEditorForm.patchValue({
                fieldValue: this.stringifySymbols(syms)
            });

            // if (!this.visionResult) {
            //     this.currentPageVisionResults$
            //         .pipe(
            //             take(1)
            //         )
            //         .subscribe((visionResult) => {
            //             this.visionResult = visionResult;
            //             if (visionResult && visionResult.fullTextAnnotation
            //                 && Array.isArray(visionResult.fullTextAnnotation.pages)
            //                 && visionResult.fullTextAnnotation.pages.length) {
            //
            //             }
            //         });
            // } else {
            //     const visionResult = this.visionResult;
            //     if (visionResult && visionResult.fullTextAnnotation
            //         && Array.isArray(visionResult.fullTextAnnotation.pages)
            //         && visionResult.fullTextAnnotation.pages.length) {
            //         const syms = visionResult.fullTextAnnotation.pages[0].blocks
            //             .flatMap(block => block.paragraphs
            //                 .flatMap(paragraph => paragraph.words
            //                     .flatMap(word => word.symbols
            //                         .filter(sym => this.geometryHelper.rectanglesIntersect(
            //                             mutatedVertices,
            //                             sym.boundingBox.vertices))
            //                     )
            //                 )
            //             );
            //
            //         this.inlineEditorForm.patchValue({
            //             fieldPage: indexOfCurentPage + 1,
            //             fieldValue: this.stringifySymbols(syms)
            //         });
            //     }
            // }

            // const fieldContainingVisionResultsObs = this.visionResult$
            //     .pipe(
            //         switchMap(visionResults => Array.isArray(visionResults) && indexOfCurentPage + 1 <= visionResults.length
            //             ? visionResults[indexOfCurentPage]
            //             : of(null))
            //     );
            //
            // fieldContainingVisionResultsObs
            //     .pipe(
            //         take(1)
            //     )
            //     .subscribe(visionResult => {
            //         this.visionResult = visionResult;
            //         if (visionResult && visionResult.fullTextAnnotation
            //             && Array.isArray(visionResult.fullTextAnnotation.pages)
            //             && visionResult.fullTextAnnotation.pages.length
            //         ) {
            //             const syms = visionResult.fullTextAnnotation.pages[0].blocks
            //                 .flatMap(block => block.paragraphs
            //                     .flatMap(paragraph => paragraph.words
            //                         .flatMap(word => word.symbols
            //                             .filter(sym => {
            //                                 if (sym.boundingBox.vertices.length === 4) {
            //                                     if (sym.boundingBox.vertices[0].y !== sym.boundingBox.vertices[1].y) {
            //                                         sym.boundingBox.vertices[0].y = sym.boundingBox.vertices[1].y;
            //                                     }
            //                                     if (sym.boundingBox.vertices[2].y !== sym.boundingBox.vertices[3].y) {
            //                                         sym.boundingBox.vertices[2].y = sym.boundingBox.vertices[3].y;
            //                                     }
            //                                     if (sym.boundingBox.vertices[0].x !== sym.boundingBox.vertices[3].x) {
            //                                         sym.boundingBox.vertices[0].x = sym.boundingBox.vertices[3].x;
            //                                     }
            //                                     if (sym.boundingBox.vertices[1].x !== sym.boundingBox.vertices[2].x) {
            //                                         sym.boundingBox.vertices[1].x = sym.boundingBox.vertices[2].x;
            //                                     }
            //                                 }
            //                                 sym.boundingBox.vertices.forEach(it => {
            //                                     if (it.x === undefined) {
            //                                         it.x = 0;
            //                                     }
            //                                     if (it.y === undefined) {
            //                                         it.y = 0;
            //                                     }
            //                                 });
            //                                 // console.log(fieldPositionMutatedVertices, sym.boundingBox.vertices);
            //                                 return this.geometryHelper.rectangleContains(
            //                                     fieldPositionMutatedVertices,
            //                                     sym.boundingBox.vertices);
            //                             })
            //                         )
            //                     )
            //                 );
            //             console.log(this.stringifySymbols(syms));
            //             this.inlineEditorForm.patchValue({
            //                 fieldPage: indexOfCurentPage + 1,
            //                 fieldValue: this.stringifySymbols(syms)
            //             });
            //
            //         }
            //     });
        }
    }

    getChildren(pages: any) {
        this.ocrService
            .getChildren({
                fileId: this._fileScanView.fileId
            })
            .subscribe((res) => {
                const getChildrenArr = res ? res['body'] : res;

                pages.forEach((page, idx) => {
                    page.id = getChildrenArr[idx];
                    page.split = false;
                    page.rotate = {degree: 0, step: 90, boundaryRad: 0};
                });

                this.fileProgress = false;
                this.showSplit = true;

                setTimeout(() => {
                    this.zoomBestFitSplit();
                }, 100);
            });
    }

    splitAllPages(pages) {
        pages.forEach((page) => {
            page.split = true;
        });
    }

    filesSplit(pages) {
        this.splitDisabled = true;
        //console.log(pages);
        const pagesContainer = [];
        pages.forEach((page, idx) => {
            if (idx === 0) {
                pagesContainer.push([page.id]);
            } else {
                if (pages[idx - 1].split) {
                    pagesContainer.push([]);
                }
                pagesContainer[pagesContainer.length - 1].push(page.id);
            }
        });
        // console.log({
        //     childrenIdsLists: pagesContainer,
        //     fileId: this._fileScanView.fileId
        // });
        this.ocrService
            .filesSplit({
                childrenIdsLists: pagesContainer,
                fileId: this._fileScanView.fileId
            })
            .subscribe((response: any) => {
                this.showSplit = false;
                this.splitDisabled = false;
                const bodyRes = response ? response['body'] : response;
                const statusRes = response ? response.status : response;
                if (statusRes === 422) {
                    this.fileChange = true;
                    if (bodyRes.redoFor) {
                        this._fileScanView.fileId = bodyRes.redoFor;
                        this.setFile(this._fileScanView);
                    } else {
                        this.goToRow.emit({
                            refresh: this.fileChange,
                            response: this._fileScanView.fileId
                        });
                    }
                    return;
                }
                this.refreshBack.emit(this.fileChange);
                const navData = this.navigatorData$.getValue();
                if (navData && navData.forwardLink) {
                    this.setFile(navData.forwardLink);
                }
            });
    }

    imgBlobSetCanvas(imgBlob, page) {
        const image = new Image();
        image.src = imgBlob;
        image.crossOrigin = 'Anonymous';
        image.onload = () => {
            const boundaryRad = Math.atan(image.width / image.height);
            page.rotate.boundaryRad = boundaryRad;
        };
        page.rotate.image = image;
    }

    rotateAllPages(pages) {
        pages.forEach((page, index) => {
            if (index === 0) {
                this.incButton(page, index);
            } else {
                setTimeout(() => {
                    this.incButton(page, index);
                }, 200);
            }
        });
    }

    incButton(page, index) {
        page.rotate.degree = (360 + page.rotate.degree + page.rotate.step) % 360;
        this.buttonClicked.next({
            page: page, index: index
        });
    }

    descButton(page, index) {
        page.rotate.degree = (360 + page.rotate.degree - page.rotate.step) % 360;
        this.render(page, index);
    }

    calcProjectedRectSizeOfRotatedRect(size, rad): any {
        const {width, height} = size;

        const rectProjectedWidth =
            Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
        const rectProjectedHeight =
            Math.abs(width * Math.sin(rad)) + Math.abs(height * Math.cos(rad));

        return {width: rectProjectedWidth, height: rectProjectedHeight};
    }

    getRotatedImage(rotate, angle): string {
        const image = rotate.image;

        const canvas = document.createElement('canvas');
        const {degree, rad: _rad} = angle;

        const rad = _rad || (degree * Math.PI) / 180 || 0;

        const {width, height} = this.calcProjectedRectSizeOfRotatedRect(
            {width: image.width, height: image.height},
            rad
        );

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.save();

        const sin_Height = image.height * Math.abs(Math.sin(rad));
        const cos_Height = image.height * Math.abs(Math.cos(rad));
        const cos_Width = image.width * Math.abs(Math.cos(rad));
        const sin_Width = image.width * Math.abs(Math.sin(rad));

        let xOrigin, yOrigin;

        if (rad < rotate.boundaryRad) {
            xOrigin = Math.min(sin_Height, cos_Width);
            yOrigin = 0;
        } else if (rad < Math.PI / 2) {
            xOrigin = Math.max(sin_Height, cos_Width);
            yOrigin = 0;
        } else if (rad < Math.PI / 2 + rotate.boundaryRad) {
            xOrigin = width;
            yOrigin = Math.min(cos_Height, sin_Width);
        } else if (rad < Math.PI) {
            xOrigin = width;
            yOrigin = Math.max(cos_Height, sin_Width);
        } else if (rad < Math.PI + rotate.boundaryRad) {
            xOrigin = Math.max(sin_Height, cos_Width);
            yOrigin = height;
        } else if (rad < (Math.PI / 2) * 3) {
            xOrigin = Math.min(sin_Height, cos_Width);
            yOrigin = height;
        } else if (rad < (Math.PI / 2) * 3 + rotate.boundaryRad) {
            xOrigin = 0;
            yOrigin = Math.max(cos_Height, sin_Width);
        } else if (rad < Math.PI * 2) {
            xOrigin = 0;
            yOrigin = Math.min(cos_Height, sin_Width);
        }

        ctx.translate(xOrigin, yOrigin);
        ctx.rotate(rad);
        ctx.drawImage(image, 0, 0);
        ctx.restore();
        return canvas.toDataURL('image/jpeg', 1.0);
    }


    async render(page, index) {
        if (this.uploadNewRotate$) {
            this.uploadNewRotate$.unsubscribe();
        }
        if (this.imageReplaceUrl$) {
            this.imageReplaceUrl$.unsubscribe();
        }
        if (this.rotateFile$) {
            this.rotateFile$.unsubscribe();
        }
        const dataURL: string = this.getRotatedImage(page.rotate, {
            degree: page.rotate.degree
        });
        console.log('page: ', page.rotate.degree);
        const fileName = page.fileId;
        const blob = await this.getFile(dataURL);
        const lastModifiedDate = new Date();
        const file = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: lastModifiedDate.getTime()
        });
        this.imageReplaceUrl$ = this.ocrService[page.rotate.notRotated ? 'imageReplaceUrls' : 'imageReplaceUrl'](fileName).subscribe((response: any) => {
            const urlToUploadFile = response ? response['body'] : response;
            if (page.rotate.notRotated && urlToUploadFile && Array.isArray(urlToUploadFile) && urlToUploadFile.length) {
                for (let idx = 0; idx < urlToUploadFile.length; idx++) {
                    const req = new HttpRequest('PUT', urlToUploadFile[idx], file, {
                        headers: new HttpHeaders({
                            'Content-Type': file.type
                        }),
                        reportProgress: true
                    });
                    const progress = new Subject<number>();
                    progress.next(0);
                    const uploadNewRotate = this.http.request(req)
                        .pipe(
                            retry({
                                count: 3,
                                delay: 1500
                            })
                        ).subscribe((event) => {
                            if (event.type === HttpEventType.UploadProgress) {
                                const percentDone = Math.round((100 * event.loaded) / event.total);
                                progress.next(percentDone);
                            } else if (event instanceof HttpResponse) {
                                progress.complete();
                                if (idx + 1 === urlToUploadFile.length) {
                                    this.reload();
                                }
                                if (uploadNewRotate) {
                                    uploadNewRotate.unsubscribe();
                                }
                            }
                        });
                    progress.subscribe((num) => {
                        console.log('progress: ', num);
                    });
                }
            } else {
                const req = new HttpRequest('PUT', urlToUploadFile, file, {
                    headers: new HttpHeaders({
                        'Content-Type': file.type
                    }),
                    reportProgress: true
                });
                const progress = new Subject<number>();
                progress.next(0);
                this.uploadNewRotate$ = this.http.request(req)
                    .pipe(
                        retry({
                            count: 3,
                            delay: 1500
                        })
                    ).subscribe((event) => {
                        if (event.type === HttpEventType.UploadProgress) {
                            const percentDone = Math.round((100 * event.loaded) / event.total);
                            progress.next(percentDone);
                        } else if (event instanceof HttpResponse) {
                            progress.complete();
                            if (!page.rotate.notRotated) {
                                this.rotateFile$ = this.ocrService.rotateFile({
                                    'angle': page.rotate.degree,
                                    'fileId': fileName
                                }).subscribe(() => {
                                    this.reload();
                                });
                            } else {
                                this.reload();
                            }

                            // const locationsSubscription = this.fileDetails$.subscribe((items) => {
                            //     if (locationsSubscription) {
                            //         locationsSubscription.unsubscribe();
                            //     } else {
                            //         items.pages[index].contentUrl = dataURL;
                            //         this.forceReload$.next();
                            //     }
                            // });
                        }
                    });
                progress.subscribe((num) => {
                    console.log('progress: ', num);
                });
            }

        });
        // debugger
        let locationsSubscription = null;
        locationsSubscription = this.cachedContent$.subscribe((blobs) => {
            if (locationsSubscription) {
                locationsSubscription.unsubscribe();
            } else {
                blobs[index] = new Observable<any>((subscriber) => {
                    subscriber.next(dataURL);
                    subscriber.complete();
                });
            }
        });
        // console.log(dataURL);
    }

    deleteInvoice() {
        let fileId;
        if (this.deleteInvoiceModal === 'fileId') {
            fileId = this._fileScanView.fileId;
        } else if (this.deleteInvoiceModal === 'suspiciousId') {
            fileId = this.modalShowImg.suspiciousId;
        }
        this.ocrService
            .deleteInvoice({
                uuid: fileId
            })
            .subscribe((response: any) => {
                // if (this.deleteInvoiceModal === 'fileId') {
                //     this.refreshBack.emit(true);
                //     const navData = this.navigatorData$.getValue();
                //     if (navData && navData.forwardLink) {
                //         this.setFile(navData.forwardLink);
                //     }
                // } else {
                //     this.refreshBack.emit(true);
                //     this.setFile(this._fileScanView);
                // }
                const bodyRes = response ? response['body'] : response;
                const statusRes = response ? response.status : response;
                if (statusRes === 422) {
                    this.fileChange = true;
                    if (bodyRes.redoFor) {
                        this._fileScanView.fileId = bodyRes.redoFor;
                        this.setFile(this._fileScanView);
                    } else {
                        this.goToRow.emit({
                            refresh: this.fileChange,
                            response: this._fileScanView.fileId
                        });
                    }
                    return;
                }

                this.refreshBack.emit(true);
                const navData = this.navigatorData$.getValue();
                if (navData && navData.forwardLink) {
                    this.setFile(navData.forwardLink);
                }

                this.editOrderFromDoubleSuspectModalShow = false;
                this.deleteInvoiceModal = false;
                this.modalShowImg = false;
            });
    }

    public prepareFiles() {
        this.draggedIndex = -1;
        this.onDragOverIndex = -1;
        this.selcetedFiles = [
            {
                urlImg: this.arrPagesImgInvoice[0].contentUrl,
                fileId: this.modalShowImg.suspiciousId,
                arrUrls: this.arrPagesImgInvoice.map((it) => it.contentUrl)
            }
        ];
        this.fileDetails$.subscribe((items) => {
            this.selcetedFiles.push({
                urlImg: items.pages[0].contentUrl,
                fileId: this._fileScanView.fileId,
                arrUrls: items.pages.map((it) => it.contentUrl)
            });
        });
    }

    trackById(index: number, row: any): string {
        return row.fileId;
    }

    setPageNumInsideModal(event: any) {
        // console.log('target', event.target);
        // console.log('scrollTop', event.target.scrollTop);
        // console.log('offsetHeight', event.target.offsetHeight);
        // console.log('scrollTop+offsetHeight', event.target.scrollTop + event.target.offsetHeight);
        if (
            this.pageContainerInsideModal.toArray().length > 1 &&
            !this.changeByNav
        ) {
            if (
                event.target.scrollHeight ===
                event.target.scrollTop + event.target.offsetHeight
            ) {
                this.currentInsideModalPage.next(
                    this.pageContainerInsideModal.toArray().length
                );
                // console.log('pageNo----', this.pageContainerInsideModal.toArray().length);
            } else {
                const scrollTop = event.target.scrollTop;
                const pageNo = this.pageContainerInsideModal
                    .toArray()
                    .findIndex((element, index) => {
                        // console.log('index---', element.nativeElement.offsetTop);
                        if (index + 1 === this.pageContainerInsideModal.toArray().length) {
                            return scrollTop > element.nativeElement.offsetTop;
                        } else {
                            return (
                                scrollTop <=
                                this.pageContainerInsideModal.toArray()[index + 1].nativeElement
                                    .offsetTop
                            );
                        }
                    });
                // console.log('pageNo----', pageNo + 1);
                this.currentInsideModalPage.next(pageNo + 1);
            }
        }
    }

    setPageNumInsideModal2(event: any) {
        // console.log('target', event.target);
        // console.log('scrollTop', event.target.scrollTop);
        // console.log('offsetHeight', event.target.offsetHeight);
        // console.log('scrollTop+offsetHeight', event.target.scrollTop + event.target.offsetHeight);
        if (
            this.pageContainerInsideModal2.toArray().length > 1 &&
            !this.changeByNav
        ) {
            if (
                event.target.scrollHeight ===
                event.target.scrollTop + event.target.offsetHeight
            ) {
                this.currentInsideModalPage.next(
                    this.pageContainerInsideModal2.toArray().length
                );
                // console.log('pageNo----', this.pageContainerInsideModal2.toArray().length);
            } else {
                const scrollTop = event.target.scrollTop;
                const pageNo = this.pageContainerInsideModal2
                    .toArray()
                    .findIndex((element, index) => {
                        // console.log('index---', element.nativeElement.offsetTop);
                        if (index + 1 === this.pageContainerInsideModal2.toArray().length) {
                            return scrollTop > element.nativeElement.offsetTop;
                        } else {
                            return (
                                scrollTop <=
                                this.pageContainerInsideModal2.toArray()[index + 1]
                                    .nativeElement.offsetTop
                            );
                        }
                    });
                // console.log('pageNo----', pageNo + 1);
                this.currentInsideModalPage.next(pageNo + 1);
            }
        }
    }

    setPageNumInsideModalNew(event: any) {
        // console.log('target', event.target);
        // console.log('scrollTop', event.target.scrollTop);
        // console.log('offsetHeight', event.target.offsetHeight);
        // console.log('scrollTop+offsetHeight', event.target.scrollTop + event.target.offsetHeight);
        if (
            this.pageContainerInsideModalNew.toArray().length > 1 &&
            !this.changeByNavNew
        ) {
            if (
                event.target.scrollHeight ===
                event.target.scrollTop + event.target.offsetHeight
            ) {
                this.currentInsideModalPageNew.next(
                    this.pageContainerInsideModalNew.toArray().length
                );
                // console.log('pageNo----', this.pageContainerInsideModalNew.toArray().length);
            } else {
                const scrollTop = event.target.scrollTop;
                const pageNo = this.pageContainerInsideModalNew
                    .toArray()
                    .findIndex((element, index) => {
                        // console.log('index---', element.nativeElement.offsetTop);
                        if (
                            index + 1 ===
                            this.pageContainerInsideModalNew.toArray().length
                        ) {
                            return scrollTop > element.nativeElement.offsetTop;
                        } else {
                            return (
                                scrollTop <=
                                this.pageContainerInsideModalNew.toArray()[index + 1]
                                    .nativeElement.offsetTop
                            );
                        }
                    });
                // console.log('pageNo----', pageNo + 1);
                this.currentInsideModalPageNew.next(pageNo + 1);
            }
        }
    }

    navigateToDocumentPageInsideModal(pageNo: number) {
        this.changeByNav = true;
        this.currentInsideModalPage.next(pageNo);
        this.pageContainerInsideModal
            .toArray()
            [pageNo - 1].nativeElement.scrollIntoView({
            block: 'start',
            inline: 'center',
            behavior: 'smooth'
        });
        setTimeout(() => {
            this.changeByNav = false;
        }, 1000);
    }

    navigateToDocumentPageInsideModal2(pageNo: number) {
        this.changeByNav = true;
        this.currentInsideModalPage.next(pageNo);
        this.pageContainerInsideModal2
            .toArray()
            [pageNo - 1].nativeElement.scrollIntoView({
            block: 'start',
            inline: 'center',
            behavior: 'smooth'
        });
        setTimeout(() => {
            this.changeByNav = false;
        }, 1000);
    }

    navigateToDocumentPageInsideModalNew(pageNo: number) {
        this.changeByNavNew = true;
        this.currentInsideModalPageNew.next(pageNo);
        this.pageContainerInsideModalNew
            .toArray()
            [pageNo - 1].nativeElement.scrollIntoView({
            block: 'start',
            inline: 'center',
            behavior: 'smooth'
        });
        setTimeout(() => {
            this.changeByNavNew = false;
        }, 1000);
    }

    public doubleSuspect(): void {
        this.imageScaleOldInvoice = 1;
        this.imageScaleNewInvoice = 1;

        this.arrPagesImgInvoice = [];
        this.currentInsideModalPage.next(this.currentPage.getValue());
        this.ocrService
            .suspiciousDoubleInvoice(this._fileScanView.fileId)
            .subscribe((res) => {
                const response = res ? res['body'] : res;
                if (response.invoice) {
                    setTimeout(() => {
                        if (this.currentPage.getValue() > 1) {
                            this.navigateToDocumentPageInsideModal(
                                this.currentPage.getValue()
                            );
                        }
                    }, 100);
                    this.modalShowImg = response;
                    if (this.modalShowImg.invoice === true) {
                        this.currentInsideModalPageNew.next(
                            this.modalShowImg.pageNum ? this.modalShowImg.pageNum : 1
                        );
                        this.ocrService
                            .requestFilePages([this.modalShowImg.suspiciousId])
                            .subscribe(
                                (ress) => {
                                    const responseRest = ress ? ress['body'] : ress;
                                    this.arrPagesImgInvoice =
                                        responseRest[this.modalShowImg.suspiciousId];
                                    setTimeout(() => {
                                        if (
                                            this.modalShowImg.pageNum &&
                                            this.modalShowImg.pageNum > 1
                                        ) {
                                            this.navigateToDocumentPageInsideModalNew(
                                                this.modalShowImg.pageNum
                                            );
                                        }
                                    }, 2500);
                                }
                            );
                        if (
                            this.modalShowImg.status === 'TEMP_COMMAND' ||
                            this.modalShowImg.status === 'PERMANENT_COMMAND'
                        ) {
                            // status in (13,14)
                            this.getJournalHistory = null;
                            this.ocrService
                                .getJourForFile({
                                    fileId: this.modalShowImg.suspiciousId
                                })
                                .subscribe((resp) => {
                                    const getJournalHistory = resp ? resp['body'] : resp;
                                    if (getJournalHistory.length) {
                                        this.getJournalHistory = getJournalHistory;
                                        if (this.getJournalHistory.length) {
                                            this.getJournalHistory.forEach((item) => {
                                                item.referenceDate = item.invoiceDate;
                                                item.oppositCust = item.oppositeCust;
                                                item.asmachta1 = item.asmachta;

                                                let oppositCust =
                                                    item.oppositCust &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                            (custIdxRec) =>
                                                                custIdxRec.custId === item.oppositCust
                                                        )
                                                        : null;
                                                if (
                                                    !oppositCust &&
                                                    item.oppositCust &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
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

                                                let cartisMaam =
                                                    item.cartisMaam &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                        ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                            (custIdxRec) =>
                                                                custIdxRec.custId === item.cartisMaam
                                                        )
                                                        : null;
                                                if (
                                                    !cartisMaam &&
                                                    item.cartisMaam &&
                                                    this.userService.appData.userData
                                                        .companyCustomerDetails.all
                                                ) {
                                                    cartisMaam = {
                                                        cartisName: item.cartisMaam,
                                                        cartisCodeId: null,
                                                        custId: item.cartisMaam,
                                                        lName: null,
                                                        hp: null,
                                                        id: null,
                                                        pettyCash: false,
                                                        supplierTaxDeduction: null,
                                                        customerTaxDeduction: null
                                                    };
                                                    this.userService.appData.userData.companyCustomerDetails.all.push(
                                                        cartisMaam
                                                    );
                                                }

                                                item.custData = oppositCust;
                                                item.cartisMaam = cartisMaam;
                                                item.custId = this.userService.appData.userData
                                                    .companyCustomerDetails.all
                                                    ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                        (custIdxRec) =>
                                                            custIdxRec.custId ===
                                                            this.fileFieldsForm
                                                                .get('2')
                                                                .get('effectiveValue').value.custId
                                                    )
                                                    : null;
                                            });
                                        }
                                    }
                                });
                        } else if (this.modalShowImg.status === 'CREATE_JOURNAL_TRANS') {
                            // status in (12)
                        } else {
                        }
                    } else {
                    }
                } else if (response.invoice === false) {
                    setTimeout(() => {
                        if (this.currentPage.getValue() > 1) {
                            this.navigateToDocumentPageInsideModal2(
                                this.currentPage.getValue()
                            );
                        }
                    }, 100);
                    this.getJournalHistory = null;
                    this.editOrderFromDoubleSuspectModalShow = true;
                    const effectiveValueCustId = this.fileFieldsForm
                        .get('2')
                        .get('effectiveValue').value.custId;
                    const asmachta = this.fileFieldsForm
                        .get('11')
                        .get('effectiveValue')
                        .value.toString();

                    this.ocrService
                        .journalHistory({
                            companyId:
                            this.userService.appData.userData.companySelect.companyId,
                            custId: effectiveValueCustId,
                            asmachta: asmachta,
                            total: this.fileFieldsForm.get('17').get('effectiveValue').value
                        })
                        .subscribe((resp) => {
                            const getJournalHistory = resp ? resp['body'] : resp;
                            if (getJournalHistory.length) {
                                this.getJournalHistory = getJournalHistory;
                                // this.getJournalHistory = getJournalHistory.filter(it => (it.asmachta1 && it.asmachta1.toString().slice(-4) === asmachta) || (it.asmachta2 && it.asmachta2.toString().slice(-4) === asmachta));
                                if (this.getJournalHistory.length) {
                                    this.getJournalHistory.forEach((item) => {
                                        let oppositCust =
                                            item.oppositCust &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                    (custIdxRec) =>
                                                        custIdxRec.custId === item.oppositCust
                                                )
                                                : null;
                                        if (
                                            !oppositCust &&
                                            item.oppositCust &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
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

                                        let cartisMaam =
                                            item.cartisMaam &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                                ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                    (custIdxRec) =>
                                                        custIdxRec.custId === item.cartisMaam
                                                )
                                                : null;
                                        if (
                                            !cartisMaam &&
                                            item.cartisMaam &&
                                            this.userService.appData.userData.companyCustomerDetails
                                                .all
                                        ) {
                                            cartisMaam = {
                                                cartisName: item.cartisMaam,
                                                cartisCodeId: null,
                                                custId: item.cartisMaam,
                                                lName: null,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.userService.appData.userData.companyCustomerDetails.all.push(
                                                cartisMaam
                                            );
                                        }

                                        item.custData = oppositCust;
                                        item.cartisMaam = cartisMaam;
                                        item.custId = this.userService.appData.userData
                                            .companyCustomerDetails.all
                                            ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (custIdxRec) =>
                                                    custIdxRec.custId ===
                                                    this.fileFieldsForm.get('2').get('effectiveValue')
                                                        .value.custId
                                            )
                                            : null;
                                    });
                                }
                            }
                        });
                }
            });
    }

    public selectItem(item: any) {
        this.selectedItem = item;
    }

    public onDrop($event: any, index: number) {
        this.handleDrop(index);
    }

    public allowDrop($event: any, index: number) {
        this.onDragOverIndex = index;
        $event.preventDefault();
    }

    public onDragStart($event: any, index: number) {
        this.draggedIndex = index;
    }

    public handleDrop(droppedIndex: number) {
        const item = this.selcetedFiles[this.draggedIndex];
        this.selcetedFiles.splice(this.draggedIndex, 1);
        this.selcetedFiles.splice(droppedIndex, 0, item);
        this.draggedIndex = -1;
        this.onDragOverIndex = -1;
        // console.log(this.showFloatNav.selcetedFiles)
        this.selectItem(null);
    }

    onRightClick(event: any) {
        return false;
    }

    calcMinus(num: number): number {
        if (num < 0) {
            return Math.abs(num);
        } else {
            return -num;
        }
    }

    showDocumentStorageDataViewAsGrid(fileId: string): void {
        this.showDocumentStorageDataFired = true;
        this.sidebarImgs = this.selcetedFiles.find(
            (it) => it.fileId === fileId
        ).arrUrls;
    }

    hideDocumentStorageData(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentStorageDataFired = false;
        // console.log('hideDocumentStorageData');
    }

    filesUnion() {
        this.mergeFiles = false;
        this.modalShowImg = false;
        this.reportService.postponed = {
            action: this.ocrService.filesUnion({
                fileIds: this.selcetedFiles.map((file) => file.fileId),
                duplicate: true,
                currentFileId: this._fileScanView.fileId
            }),
            message: this.domSanitizer.bypassSecurityTrustHtml(
                this.selcetedFiles.length + ' חשבוניות אוחדו'
            ),
            fired: false
        };
        timer(3000)
            .pipe(
                switchMap(() => {
                    if (
                        this.reportService.postponed &&
                        this.reportService.postponed.action
                    ) {
                        return this.reportService.postponed.action;
                    } else {
                        return EMPTY;
                    }
                }),
                tap(() => {
                    this.reportService.postponed.fired = true;
                }),
                take(1)
            )
            .subscribe((res) => {
                const response = res ? res['body'] : res;
                const statusRes = res ? res.status : res;
                if (statusRes === 422 || response) {
                    this.fileChange = true;
                    if (response.redoFor) {
                        this._fileScanView.fileId = response.redoFor;
                        this.setFile(this._fileScanView);
                    } else {
                        this._fileScanView.fileId = response.fileId;
                        if (response.status !== 'WAIT_FOR_CONFIRM') {
                            // this.returnBack.emit(this.fileChange);
                            this.goToRow.emit({
                                refresh: this.fileChange,
                                response: this._fileScanView.fileId
                            });
                        } else {
                            this.unionResTemp = response;
                            this.refreshBack.emit(true);
                            this.forceReload$.next();
                        }
                    }
                    return;
                }

                // this.goToRow.emit({
                //     refresh: true,
                //     response: response
                // });
            });
    }

    returnToRow(isCREATE_JOURNAL_TRANS?: boolean) {
        if (isCREATE_JOURNAL_TRANS) {
            const fileId = this.modalShowImg.suspiciousId;
            this.goToRow.emit({
                refresh: false,
                response: fileId,
                fileStatus: 'CREATE_JOURNAL_TRANS'
            });
        } else {
            this.goToRow.emit({
                refresh: false,
                response: this._fileScanView.fileId
            });
        }
    }

    onAlertBeforeSplitHide(): void {
        if (this.alertBeforeSplit.stopIt) {
            this.storageService.localStorageSetter(
                'alertBeforeSplit.display',
                'false'
            );
        }
        this.addOrder();
    }

    setActiveFieldEvent(event: any) {
        const word = event.word;

        const i = event.i;
        const vertices = JSON.parse(JSON.stringify(word.vertices));
        // const top = this.sizeAllImg.pages[i]['top'];
        // vertices.forEach((it) => {
        //     it.y = (it.y) - top + (i === 0 ? 7 : 14 * i);
        //     it.x = ((((it.x * this.imageScale)) + ((((this.sizeAllImg.width - this.sizeAllImg.pages[i]['width']) / 2)))) / this.imageScale) + 7;
        // });

        this.activeWord = {position: vertices, pageNo: i + 1};
        this.inlineEditorForm.patchValue({
            fieldValue: word.text,
            fieldPage: i + 1,
            fieldPosition: word.vertices
        });
        this.currentPage.next(i + 1);
        this.changed = !this.changed;
    }

    setActiveFieldFromExistingWordDrag(event: any) {
        const word = event;
        //event.vertices
        const fieldPosition = event.fieldPosition;
        const i = event.fieldPage - 1;
        const vertices = JSON.parse(JSON.stringify(fieldPosition));
        // vertices.forEach((it) => {
        //     it.y = it.y / this.imageScale;
        //     it.x = (it.x) + ((this.sizeAllImg.pages[i].width === this.sizeAllImg.width) ? 0 : (this.sizeAllImg.pages[i].offsetPageLeft + ((this.sizeAllImg['offsetPageLeft']) + 10)));
        // });
        this.activeWord = {position: vertices, pageNo: i + 1};
        this.inlineEditorForm.patchValue({
            fieldValue: word.field.fieldValue,
            fieldPage: i + 1,
            fieldPosition: fieldPosition
        });
        this.currentPage.next(i + 1);
        const listItemIdToFind = 'fieldListItem_' + word.field.fieldId;
        const fieldListItem = this.fieldListItems.find(
            (item) => item._hostElement.id === listItemIdToFind
        );
        if (fieldListItem) {
            requestAnimationFrame(() => {
                if (fieldListItem._hostElement.classList.contains('active')) {
                    fieldListItem._hostElement.scrollIntoView();
                }
            });
        }
        this.changed = !this.changed;
    }

    setActiveFieldFromExistingWord(word: {
        fieldPage: number;
        fieldPosition: Array<{ x: number; y: number }>;
        field: OcrField;
    }) {
        const listItemIdToFind = 'fieldListItem_' + word.field.fieldId;
        const fieldListItem = this.fieldListItems.find(
            (item) => item._hostElement.id === listItemIdToFind
        );
        this.setActiveField(
            word.field,
            fieldListItem ? fieldListItem._hostElement : null,
            this.fileFieldsForm.get(word.field.fieldId + '')
        );
        if (fieldListItem) {
            requestAnimationFrame(() => {
                if (fieldListItem._hostElement.classList.contains('active')) {
                    fieldListItem._hostElement.scrollIntoView();
                }
            });
        }
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
                        eventPath[eventPath.length > 1 ? (eventPath.length - 1) : 0].classList.contains('p-dialog-mask');
                    if (shouldTerminateEdit) {
                        // console.log('Terminating edit (clicked on : %o)', eventPath);
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

    formatAsSumNoMathNum(val) {
        if (!isFinite(Number(val))) {
            return 0;
        } else {
            return formatAsSumNoMath(val);
        }
    }

    updateExpenseOnly(always: boolean) {
        if (always) {
            this.sharedService
                .updateExpenseOnly({
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    expenseOnly: false
                })
                .subscribe((res) => {
                    this.fileFieldsForm.get('21').get('effectiveValue').patchValue(0);
                });
        } else {
            this.fileFieldsForm.get('21').get('effectiveValue').patchValue(0);
        }
    }

    cancelCustServer(modalCancel: any) {
        const fld = modalCancel;
        const fileDetails = this.fileDetails;
        this.fileDetailsSave.userApproveFieldsType = null;
        const isDD = [21, 12, 22, 9, 6, 2, 5, 4, 40, 41].some(
            (id) => id === Number(modalCancel.fieldId)
        );
        const data = this.fileFieldsForm.get(modalCancel.fieldId.toString());
        const value = data.get('effectiveValue').value;
        this.ocrService
            .setFieldValue({
                popupType: 4, // 2,
                fileId: data.get('fileId').value,
                fieldId: data.get('fieldId').value,
                fileResultId: data.get('fileResultId').value,
                fieldPage: data.get('fieldPage').value,
                fieldPosition: isDD ? null : data.get('fieldPosition').value,
                fieldValue:
                    typeof value === 'boolean'
                        ? value
                            ? 1
                            : 0
                        : value &&
                        typeof (value === 'object') &&
                        Object.keys(value).includes('custId')
                            ? value.custId
                            : Number(modalCancel.fieldId) === 3 && this.editHp && value === ''
                                ? 0
                                : value,
                locationNum: data.get('locationNo').value,
                locationDesc: data.get('locationDesc').value,
                fieldSearchkey: data.get('searchkey').value,
                manualTyped: true
            })
            .pipe(take(1))
            .subscribe((valueRes) => {
                const bodyRes = valueRes ? valueRes['body'] : valueRes;
                const statusRes = valueRes ? valueRes.status : valueRes;
                if (statusRes === 422) {
                    this.fileChange = true;
                    if (bodyRes.redoFor) {
                        this._fileScanView.fileId = bodyRes.redoFor;
                        this.setFile(this._fileScanView);
                    } else {
                        this.goToRow.emit({
                            refresh: this.fileChange,
                            response: this._fileScanView.fileId
                        });
                    }
                    return;
                }
                if (valueRes && !valueRes.error && valueRes.body) {
                    this.fileDetailsSave.approveActive = valueRes.body.approveActive;
                    this.fileDetailsSave.approveActiveCopy =
                        this.fileDetailsSave.approveActive;

                    if (valueRes.body.matahSums !== null) {
                        this.fileDetailsSave.matahSums = valueRes.body.matahSums;
                    }
                    if (valueRes.body.jobExecutionId !== null) {
                        this.fileDetailsSave.jobExecutionId = valueRes.body.jobExecutionId;
                    }
                    if (valueRes.body.splitType !== null) {
                        this.fileDetailsSave.splitType = valueRes.body.splitType;
                    }
                    if (valueRes.body.userApproveFieldsType !== undefined) {
                        this.fileDetailsSave.userApproveFieldsType =
                            valueRes.body.userApproveFieldsType;
                    }
                    if (valueRes.body.approvedBy !== undefined) {
                        this.fileDetailsSave.approvedBy = valueRes.body.approvedBy;
                    }
                    if (valueRes.body.documentLogicType !== null) {
                        this.fileDetailsSave.documentLogicType =
                            valueRes.body.documentLogicType;
                    }
                    if (valueRes.body.companyIdentificationId) {
                        this.companyIdentificationId =
                            valueRes.body.companyIdentificationId;
                    }
                    if (valueRes.body.companyIdentificationName) {
                        this.companyIdentificationName =
                            valueRes.body.companyIdentificationName;
                    }
                    if (valueRes.body.redoHierarchy) {
                        if (valueRes.body.companyIdentificationName) {
                            fileDetails.companyIdentificationName =
                                valueRes.body.companyIdentificationName;
                        }
                        if (valueRes.body.companyIdentificationName) {
                            fileDetails.companyIdentificationId =
                                valueRes.body.companyIdentificationId;
                        }
                        if (valueRes.body.showNegative !== undefined) {
                            fileDetails.showNegative = valueRes.body.showNegative;
                        }
                        fileDetails.jobExecutionId = valueRes.body.jobExecutionId;
                        fileDetails.fieldsHierarchy = valueRes.body.fieldsHierarchy;
                        fileDetails.invoicePayment = valueRes.body.invoicePayment;
                        fileDetails.showTaxDeduction = valueRes.body.showTaxDeduction;
                        if (valueRes.body.userApproveFieldsType !== undefined) {
                            fileDetails.userApproveFieldsType =
                                valueRes.body.userApproveFieldsType;
                        }
                        if (valueRes.body.approvedBy !== undefined) {
                            fileDetails.approvedBy = valueRes.body.approvedBy;
                        }
                        fileDetails.expenseOnly = !!valueRes.body.expenseOnly;
                        fileDetails.splitType = valueRes.body.splitType;
                        fileDetails.documentLogicType = valueRes.body.documentLogicType;
                        this.revaluationCurrCodeSign = null;
                        this.fileDetailsSave = null;
                        setTimeout(() => {
                            this.createNewForm(fileDetails);
                        }, 0);
                    } else {
                        if (
                            valueRes.body.fieldsHierarchy &&
                            valueRes.body.fieldsHierarchy.length &&
                            valueRes.body.fieldsHierarchy[0].fields
                        ) {
                            this.saveLastUpdateAfterBlur = null;
                            const fieldsNew = valueRes.body.fieldsHierarchy[0].fields;
                            if (Array.isArray(fieldsNew) && fieldsNew.length) {
                                const isExpenseEffective =
                                    this.fileFieldsForm.get('21').get('effectiveValue').value ===
                                    1;
                                fieldsNew.forEach((fe) => {
                                    const fieldId = fe.fieldId;
                                    this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                        const fl = cat.fields.find((it) => it.fieldId === fieldId);
                                        if (fl) {
                                            fl.transTypeOv = fe.transTypeOv;
                                            fl.approveUserValue = fe.approveUserValue;
                                        }
                                    });
                                    if (fe.fieldId === 2) {
                                        this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                            const fl = cat.fields.find((it) => it.fieldId === 2);
                                            if (fl) {
                                                fl.default = fe.default;
                                                fl.defaultUpdatedDate = fe.defaultUpdatedDate;
                                                fl.defaultUserName = fe.defaultUserName;
                                            }
                                        });
                                    }
                                    if (fe.fieldId === 6) {
                                        this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                            const fl = cat.fields.find((it) => it.fieldId === 6);
                                            if (fl) {
                                                fl.default = fe.default;
                                                fl.defaultUpdatedDate = fe.defaultUpdatedDate;
                                                fl.defaultUserName = fe.defaultUserName;
                                            }
                                        });
                                    }
                                    if (fe.fieldId === 9) {
                                        this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                            const fl = cat.fields.find((it) => it.fieldId === 9);
                                            if (fl) {
                                                fl.fieldValue = fe.fieldValue;
                                            }
                                        });
                                    }
                                    if (fe.fieldId === 21) {
                                        this.fileDetailsSave.fieldsHierarchy.forEach((cat) => {
                                            const fl = cat.fields.find((it) => it.fieldId === 21);
                                            if (fl) {
                                                fl.fieldValue = fe.fieldValue;
                                            }
                                        });
                                    }
                                    if ('11' === String(fieldId)) {
                                        this.fieldNameAsmachta = fe.fieldName;

                                        if (fe.alertId === undefined || fe.alertId === null) {
                                            this.showDoubleSuspect = false;
                                        }
                                    }
                                    if (fe.alertId !== undefined && fe.alertId !== null) {
                                        if (fe.fieldId === 11 && fe.alertId === 10) {
                                            this.showDoubleSuspect = true;
                                        }
                                        const hasAlert = this.alerstIdsArr.find(
                                            (it) => it.alertId === fe.alertId
                                        );
                                        if (hasAlert) {
                                            for (const cat1 of this.fileDetailsSave.fieldsHierarchy) {
                                                for (const fld1 of cat1.fields) {
                                                    const fldKey1 = String(fld1.fieldId);
                                                    if (String(fieldId) === fldKey1) {
                                                        fld1.fileFldInfo = hasAlert.alertMessage
                                                            ? {
                                                                alertMessage: hasAlert.alertMessage,
                                                                indBlockAprrove: hasAlert.indBlockAprrove
                                                            }
                                                            : null;
                                                        fld1.indBlockAprrove =
                                                            hasAlert.indBlockAprrove === true;
                                                    }
                                                }
                                            }
                                            if (this.fileFieldsForm.get(fieldId.toString())) {
                                                this.fileFieldsForm.get(fieldId.toString()).patchValue(
                                                    {
                                                        indBlockAprrove: hasAlert.indBlockAprrove
                                                    },
                                                    {emitEvent: false, onlySelf: true}
                                                );
                                            }
                                        } else {
                                            for (const cat1 of this.fileDetailsSave.fieldsHierarchy) {
                                                for (const fld1 of cat1.fields) {
                                                    if (fieldId === fld1.fieldId) {
                                                        fld1.fileFldInfo = null;
                                                        fld1.indBlockAprrove = false;
                                                    }
                                                }
                                            }
                                            if (this.fileFieldsForm.get(fe.fieldId.toString())) {
                                                this.fileFieldsForm
                                                    .get(fe.fieldId.toString())
                                                    .patchValue(
                                                        {
                                                            indBlockAprrove: false
                                                        },
                                                        {emitEvent: false, onlySelf: true}
                                                    );
                                            }
                                        }
                                    } else {
                                        for (const cat1 of this.fileDetailsSave.fieldsHierarchy) {
                                            for (const fld1 of cat1.fields) {
                                                if (fieldId === fld1.fieldId) {
                                                    fld1.fileFldInfo = null;
                                                    fld1.indBlockAprrove = false;
                                                }
                                            }
                                        }
                                        if (this.fileFieldsForm.get(fe.fieldId.toString())) {
                                            this.fileFieldsForm.get(fe.fieldId.toString()).patchValue(
                                                {
                                                    indBlockAprrove: false
                                                },
                                                {emitEvent: false, onlySelf: true}
                                            );
                                        }
                                    }

                                    if (
                                        fieldId !== 28 &&
                                        fieldId === fld.fieldId &&
                                        !this.fieldsWithPredefinedEditData.has(fieldId + '')
                                    ) {
                                        // console.log('this.focusInput[' + fld.fieldId + ']', this.focusInput[fld.fieldId]);
                                        if (
                                            fe.valueType === 'NUMBER' ||
                                            fe.valueType === 'STRING'
                                        ) {
                                            if (fe !== undefined && !fe.valueTypeOv && fe === null) {
                                                fe.fieldPosition = [
                                                    {x: 159, y: 24},
                                                    {x: 159 + 145, y: 24},
                                                    {x: 159 + 145, y: 24 + 30},
                                                    {x: 159, y: 24 + 30}
                                                ];
                                                fe.fieldPositionFake = true;
                                            } else {
                                                if (
                                                    this.dataPagesSize.length &&
                                                    (!Array.isArray(fe.fieldPosition) ||
                                                        (Array.isArray(fe.fieldPosition) &&
                                                            !fe.fieldPosition.length))
                                                ) {
                                                    fe.fieldPosition =
                                                        this.dataPagesSize[
                                                            fe.fieldPage ? fe.fieldPage - 1 : 0
                                                            ];
                                                    fe.fieldPositionFake = true;
                                                }
                                            }
                                        }

                                        this.saveLastUpdateAfterBlur = {
                                            fieldId: fld.fieldId,
                                            disabled: fe.disabled,
                                            data: {
                                                valueTypeOv: fe.valueTypeOv,
                                                fileResultId: fe.fileResultId,
                                                effectiveValue: this.asFormEffectiveValueNew(fe),
                                                fieldPage: fe.fieldPage,
                                                fieldPosition: fe.fieldPosition,
                                                hasBeenDiscovered:
                                                    Array.isArray(fe.fieldPosition) &&
                                                    fe.fieldPosition.length,
                                                searchkey: fe.fieldSearchkey,
                                                locationNo: fe.locationNum
                                            }
                                        };
                                        if (this.focusInput[fld.fieldId] === false) {
                                            this.updateInputFromLastSaved(fld.fieldId);
                                        }
                                    } else {
                                        if (this.fileFieldsForm.get(fieldId.toString())) {
                                            const forms = this.fileFieldsForm.get(fieldId.toString());
                                            // if (fe.disabled !== undefined) {
                                            //     if (fe.disabled) {
                                            //         forms.disable({
                                            //             emitEvent: false,
                                            //             onlySelf: true
                                            //         });
                                            //     } else {
                                            //         forms.enable({
                                            //             emitEvent: false,
                                            //             onlySelf: true
                                            //         });
                                            //     }
                                            // }
                                            if (
                                                fe.valueType === 'NUMBER' ||
                                                fe.valueType === 'STRING'
                                            ) {
                                                if (fe && !fe.valueTypeOv && fe === null) {
                                                    fe.fieldPosition = [
                                                        {x: 159, y: 24},
                                                        {x: 159 + 145, y: 24},
                                                        {x: 159 + 145, y: 24 + 30},
                                                        {x: 159, y: 24 + 30}
                                                    ];
                                                    fe.fieldPositionFake = true;
                                                } else {
                                                    if (
                                                        this.dataPagesSize.length &&
                                                        (!Array.isArray(fe.fieldPosition) ||
                                                            (Array.isArray(fe.fieldPosition) &&
                                                                !fe.fieldPosition.length))
                                                    ) {
                                                        fe.fieldPosition =
                                                            this.dataPagesSize[
                                                                fe.fieldPage ? fe.fieldPage - 1 : 0
                                                                ];
                                                        fe.fieldPositionFake = true;
                                                    }
                                                }
                                            }
                                            forms
                                                .get('valueTypeOv')
                                                .patchValue(fe.valueTypeOv && true, {
                                                    emitEvent: false,
                                                    onlySelf: true
                                                });
                                            forms.get('fileResultId').patchValue(fe.fileResultId, {
                                                emitEvent: false,
                                                onlySelf: true
                                            });
                                            forms.get('fieldPage').patchValue(fe.fieldPage, {
                                                emitEvent: false,
                                                onlySelf: true
                                            });
                                            forms.get('fieldPosition').patchValue(fe.fieldPosition, {
                                                emitEvent: false,
                                                onlySelf: true
                                            });
                                            forms
                                                .get('hasBeenDiscovered')
                                                .patchValue(
                                                    Array.isArray(fe.fieldPosition) &&
                                                    fe.fieldPosition.length,
                                                    {
                                                        emitEvent: false,
                                                        onlySelf: true
                                                    }
                                                );
                                            forms.get('searchkey').patchValue(fe.fieldSearchkey, {
                                                emitEvent: false,
                                                onlySelf: true
                                            });
                                            forms.get('locationNo').patchValue(fe.locationNum, {
                                                emitEvent: false,
                                                onlySelf: true
                                            });
                                            forms
                                                .get('effectiveValue')
                                                .patchValue(this.asFormEffectiveValueNew(fe), {
                                                    emitEvent: false,
                                                    onlySelf: true
                                                });
                                            forms.get('effectiveValue').updateValueAndValidity({
                                                emitEvent: false,
                                                onlySelf: true
                                            });
                                        }
                                    }
                                });
                            }
                        }

                        for (const cat of this.fileDetailsSave.fieldsHierarchy) {
                            for (const fld1 of cat.fields) {
                                const fie = this.fileFieldsForm.get(fld1.fieldId + '');
                                const invoice =
                                    cat.category.includes('נתוני קבלה') &&
                                    !this.invoicePayment.value;
                                fld1.hide = !!(
                                    this.showEmptyFields.value &&
                                    ((fie.get('effectiveValue').value !== '' &&
                                            fie.get('effectiveValue').value !== null &&
                                            fie.get('effectiveValue').value !== undefined &&
                                            !fld1.fileFldInfo) ||
                                        invoice ||
                                        fie.disabled ||
                                        fie.get('valueTypeOv').value === true)
                                );
                            }
                            cat.hide = cat.fields.every((field) => field.hide);
                        }
                        this.showAlertHideAllFields =
                            this.fileDetailsSave.fieldsHierarchy.every((field) => field.hide);
                        this.editHp = this.fileDetailsSave.fieldsHierarchy.some((cat) => {
                            return cat.fields.some((fldCh: any) => {
                                const fldKey = String(fldCh.fieldId);
                                if ('9' === fldKey) {
                                    if (
                                        fldCh.fieldValue === 'חשבונית מט"ח' ||
                                        fldCh.fieldValue === 'אחר'
                                    ) {
                                        return true;
                                    }
                                }
                                if ('21' === fldKey) {
                                    if (fldCh.fieldValue === 0) {
                                        return true;
                                    }
                                }
                                return false;
                            });
                        });
                        if (
                            this.fileFieldsForm.get('2') &&
                            this.fileFieldsForm.get('2').get('effectiveValue').value &&
                            this.fileFieldsForm.get('28') &&
                            !this.fileFieldsForm.get('28').get('effectiveValue').value
                        ) {
                            this.focusFl28();
                        }
                    }
                }
                if (valueRes.error && valueRes.status === 500) {
                    if (
                        fld.fieldId === 6 ||
                        fld.fieldId === 2 ||
                        fld.fieldId === 30 ||
                        fld.fieldId === 40 ||
                        fld.fieldId === 41
                    ) {
                        this.rollingBack = true;
                        this.fileFieldsForm
                            .get(fld.fieldId.toString())
                            .get('effectiveValue')
                            .patchValue(this.saveOldValue, {
                                emitEvent: false,
                                onlySelf: true
                            });
                        this.fileFieldsForm
                            .get(fld.fieldId.toString())
                            .get('effectiveValue')
                            .updateValueAndValidity({
                                emitEvent: false,
                                onlySelf: true
                            });
                        this.saveOldValue = false;
                    }
                } else {
                    if (fld.fieldId === 6 || fld.fieldId === 2) {
                        this.saveOldValue = false;
                    }
                }
            });

        // modalCancel.default = false;
        // if (modalCancel.fieldId === 2) {
        //     this.sharedService.cancelCustDefault({
        //         companyId: this.userService.appData.userData.companySelect.companyId,
        //         sourceProgramId: this.userService.appData.userData.companySelect.sourceProgramId,
        //         custId: this.fileFieldsForm.get('2').get('effectiveValue').value.custId,
        //         supplierHp: this.fileFieldsForm.get('3').get('effectiveValue').value,
        //         companyIdentificationId: this.companyIdentificationId
        //     })
        //         .subscribe((res) => {
        //
        //         });
        // } else if (modalCancel.fieldId === 6) {
        //     this.sharedService.cancelOppositeCustDefault({
        //         companyId: this.userService.appData.userData.companySelect.companyId,
        //         sourceProgramId: this.userService.appData.userData.companySelect.sourceProgramId,
        //         supplierHp: this.fileFieldsForm.get('3').get('effectiveValue').value,
        //         // custId: this.fileFieldsForm.get('2').get('effectiveValue').value.custId,
        //         oppositeCustId: this.fileFieldsForm.get('6').get('effectiveValue').value.custId,
        //         companyIdentificationId: this.companyIdentificationId
        //         // expense: this.fileFieldsForm.get('21') ? this.fileFieldsForm.get('21').get('effectiveValue').value : null
        //     })
        //         .subscribe((res) => {
        //
        //         });
        // }
    }

    keydownActiveFieldInput(eve: any) {
        eve.target.style.height = '1px';
        eve.target.style.height = eve.target.scrollHeight + 'px';
    }

    rebuildArrData(fldId: number | string) {
        switch (fldId) {
            case 30:
            case '30':
                this.arrOption30 = this.userService.appData.userData
                    .companyCustomerDetails
                    ? !this.cupaAllTheOptions &&
                    this.userService.appData.userData.companyCustomerDetails.cupa
                        ? this.addPriemerObject(
                            this.userService.appData.userData.companyCustomerDetails.cupa,
                            30
                        )
                        : this.addPriemerObject(
                            this.userService.appData.userData.companyCustomerDetails.all,
                            30
                        )
                    : [];
                break;
        }
    }

    private objectsEqual(val1: any, val2: any): boolean {
        return (
            (val1 === null) === (val2 === null) &&
            Object.keys(val2)
                .filter((k) => val2.hasOwnProperty(k))
                .every((k) => (!val1[k] && !val2[k]) || val1[k] === val2[k])
        );
    }

    private asFormEffectiveValueNew(fld: any) {
        if (fld.valueTypeOv) {
            return String(fld.valueTypeOv);
        } else {
            if (fld.fieldId === 2) {
                if (fld.fieldValue === null) {
                    return fld.fieldValue;
                }

                if (fld.fieldValue) {
                    this.formDropdownsCartis6.forEach((item: any) => {
                        const effectiveValue = item.custId ? item.custId : null;
                        this.userService.appData.userData.companyCustomerDetails.allFor6 =
                            JSON.parse(
                                JSON.stringify(
                                    this.userService.appData.userData.companyCustomerDetails.all
                                )
                            );

                        let foundMatch = false;
                        if (
                            !!effectiveValue &&
                            this.userService.appData.userData.companyCustomerDetails.allFor6
                        ) {
                            const val =
                                this.userService.appData.userData.companyCustomerDetails.allFor6.find(
                                    (custIdxRec) => custIdxRec.custId === effectiveValue
                                );
                            if (val) {
                                foundMatch = true;
                            }
                        }
                        this.sortAllFor6();

                        this.ocrService
                            .oppositeCustHistory({
                                companyId:
                                this.userService.appData.userData.companySelect.companyId,
                                sourceProgramId:
                                this.userService.appData.userData.companySelect
                                    .sourceProgramId,
                                custId: fld.fieldValue,
                                expense: this.fileFieldsForm.get('21')
                                    ? this.fileFieldsForm.get('21').get('effectiveValue').value
                                    : null
                            })
                            .subscribe((res) => {
                                let oppositeCustHistory = res ? res['body'] : res;
                                if (oppositeCustHistory && oppositeCustHistory.length) {
                                    oppositeCustHistory = oppositeCustHistory.map((it) => {
                                        const cartisName = it.custId
                                            ? it.custId +
                                            (it.custLastName ? ' - ' + it.custLastName : '')
                                            : it.custLastName
                                                ? it.custLastName
                                                : '';
                                        return {
                                            cartisName: cartisName,
                                            custId: it.custId,
                                            lName: it.custLastName,
                                            hp: null,
                                            id: null,
                                            hashCartisCodeId: 1,
                                            isHistory: true
                                        };
                                    });
                                    oppositeCustHistory[
                                    oppositeCustHistory.length - 1
                                        ].isLastHistory = true;

                                    this.userService.appData.userData.companyCustomerDetails.allFor6 =
                                        oppositeCustHistory.concat(
                                            this.userService.appData.userData.companyCustomerDetails.all.filter(
                                                (it) =>
                                                    !oppositeCustHistory.some(
                                                        (histIt) => histIt.custId === it.custId
                                                    )
                                            )
                                        );
                                }
                                if (!foundMatch) {
                                    if (
                                        !!effectiveValue &&
                                        this.userService.appData.userData.companyCustomerDetails
                                            .allFor6
                                    ) {
                                        let val =
                                            this.userService.appData.userData.companyCustomerDetails.allFor6.find(
                                                (custIdxRec) => custIdxRec.custId === effectiveValue
                                            );
                                        if (val) {
                                        } else {
                                            val = {
                                                cartisName: effectiveValue,
                                                cartisCodeId: null,
                                                custId: effectiveValue,
                                                lName: null,
                                                hashCartisCodeId: 1,
                                                hp: null,
                                                id: null,
                                                pettyCash: false,
                                                supplierTaxDeduction: null,
                                                customerTaxDeduction: null
                                            };
                                            this.userService.appData.userData.companyCustomerDetails.allFor6.push(
                                                val
                                            );
                                        }
                                    }
                                }
                                this.sortAllFor6();

                                item.options =
                                    this.fileFieldsForm.get('21').get('effectiveValue').value ===
                                    0
                                        ? this.userService.appData.userData.companyCustomerDetails
                                            .allFor6Income
                                        : this.userService.appData.userData.companyCustomerDetails
                                            .allFor6Expense;
                                item.optionsToDisplay =
                                    this.fileFieldsForm.get('21').get('effectiveValue').value ===
                                    0
                                        ? this.userService.appData.userData.companyCustomerDetails
                                            .allFor6Income
                                        : this.userService.appData.userData.companyCustomerDetails
                                            .allFor6Expense;
                                item.filterValue = '';
                                item.resetFilter();
                            });
                    });
                }
                if (
                    this.userService.appData.userData.companyCustomerDetails &&
                    this.userService.appData.userData.companyCustomerDetails.all
                ) {
                    let val =
                        this.userService.appData.userData.companyCustomerDetails.all.find(
                            (custIdxRec) => custIdxRec.custId === fld.fieldValue
                        );
                    if (!val) {
                        val = {
                            cartisName: fld.fieldValue,
                            cartisCodeId: null,
                            custId: fld.fieldValue,
                            lName: null,
                            hp: null,
                            id: null,
                            pettyCash: false,
                            supplierTaxDeduction: null,
                            customerTaxDeduction: null
                        };
                        this.userService.appData.userData.companyCustomerDetails.all.push(
                            val
                        );
                    }
                    return val;
                } else {
                    return null;
                }
            } else if (fld.fieldId === 6) {
                if (fld.fieldValue === null) {
                    return fld.fieldValue;
                }
                if (
                    this.userService.appData.userData.companyCustomerDetails &&
                    this.userService.appData.userData.companyCustomerDetails.allFor6
                ) {
                    let val =
                        this.userService.appData.userData.companyCustomerDetails.allFor6.find(
                            (custIdxRec) => custIdxRec.custId === fld.fieldValue
                        );
                    if (!val) {
                        val = {
                            cartisName: fld.fieldValue,
                            cartisCodeId: null,
                            custId: fld.fieldValue,
                            lName: null,
                            hp: null,
                            hashCartisCodeId: 1,
                            id: null,
                            pettyCash: false,
                            supplierTaxDeduction: null,
                            customerTaxDeduction: null
                        };
                        this.userService.appData.userData.companyCustomerDetails.allFor6.push(
                            val
                        );
                        this.sortAllFor6();
                    }
                    return val;
                } else {
                    return null;
                }
            } else if (fld.fieldId === 30) {
                if (fld.fieldValue === null) {
                    return fld.fieldValue;
                }
                if (
                    this.userService.appData.userData.companyCustomerDetails &&
                    this.userService.appData.userData.companyCustomerDetails.all
                ) {
                    let val =
                        this.userService.appData.userData.companyCustomerDetails.all.find(
                            (custIdxRec) => custIdxRec.custId === fld.fieldValue
                        );
                    if (!val) {
                        val = {
                            cartisName: fld.fieldValue,
                            cartisCodeId: null,
                            custId: fld.fieldValue,
                            lName: null,
                            hp: null,
                            id: null,
                            pettyCash: false,
                            supplierTaxDeduction: null,
                            customerTaxDeduction: null
                        };
                        this.cupaAllTheOptions = true;
                        this.userService.appData.userData.companyCustomerDetails.all.push(
                            val
                        );
                    } else {
                        if (val.cartisCodeId !== 1700 && val.cartisCodeId !== 1800) {
                            this.cupaAllTheOptions = true;
                        }
                    }
                    return val;
                } else {
                    return null;
                }
            } else if (fld.fieldId === 4) {
                return fld.fieldValue;
            } else if (fld.fieldId === 5) {
                let fileFldValToFindInSelect =
                    fld.fieldValue > 0
                        ? this.userService.appData.moment(fld.fieldValue).valueOf()
                        : null;
                if (fileFldValToFindInSelect) {
                    if (
                        Array.isArray(this.companyCustomerDetailsData.vatReportOptions) &&
                        this.companyCustomerDetailsData.vatReportOptions.length > 0
                    ) {
                        if (
                            !this.companyCustomerDetailsData.vatReportOptions.some(
                                (slctdItem) => slctdItem.value === fileFldValToFindInSelect
                            )
                        ) {
                            const idxNextToSelected =
                                this.companyCustomerDetailsData.vatReportOptions.findIndex(
                                    (slctdItem) => slctdItem.value >= fileFldValToFindInSelect
                                );
                            if (idxNextToSelected > 0) {
                                fileFldValToFindInSelect =
                                    this.companyCustomerDetailsData.vatReportOptions[
                                    idxNextToSelected - 1
                                        ].value;
                            }
                        }
                    }
                }
                return fileFldValToFindInSelect;
            } else if (fld.fieldId === 13) {
                if (fld.fieldValue) {
                    return this.userService.appData.moment(fld.fieldValue).toDate();
                }
            } else if (fld.fieldId === 12) {
                const currencyId = fld.fieldValue;
                if (this.fileDetailsSave.matahSums) {
                    this.currencyList$.subscribe(() => {
                        const sign = this.currencyList.find((ite) => ite.id === currencyId);
                        this.revaluationCurrCodeSign = sign.code;
                    });
                } else {
                    this.revaluationCurrCodeSign = null;
                }
            } else if (
                fld.fieldId === 24 &&
                this.fileFieldsForm.get('12').get('effectiveValue').value !== 1
            ) {
            } else if (fld.fieldId === 10) {
                return fld.fieldValue === 1;
            } else if (fld.fieldId === 1) {
                return fld.fieldValue === '' || fld.fieldValue === null
                    ? 'יש לבחור כרטיס'
                    : fld.fieldValue;
            } else if (fld.fieldId === 9) {
            } else if (fld.fieldId === 14) {
                if (fld.fieldValue) {
                    return this.userService.appData.moment(fld.fieldValue).toDate();
                }
            } else if (fld.fieldId === 25) {
                const rate = this.roundFourDigits(Number(fld.fieldValue));
                this.rate = rate;
                return String(rate);
            }

            return typeof fld.fieldValue === 'number'
                ? String(fld.fieldValue)
                : fld.fieldValue;
        }
    }

    private stringifySymbols(
        syms: Array<{
            text: string;
            property?: {
                detectedBreak?: {
                    type: string;
                };
            };
        }>
    ): string {
        if (!Array.isArray(syms)) {
            return null;
        }

        return syms.reduce((acmltr, sym, idx, arr) => {
            acmltr += sym.text;
            if (idx < arr.length - 1) {
                acmltr += ' ';
            }
            return acmltr;
        }, '');
    }

    private createFieldsHierarchyHandlers() {
        // this.wordsFieldsExist = [];
        // zip(this.fileDetails$, this.companyCustomerDetails$)
        //     .subscribe(([fileDetails, companyCustomerDetails]) => {
        //         // const locationsSubscription = this.visionResult$.subscribe((res) => {
        //         //     if (locationsSubscription) {
        //         //         locationsSubscription.unsubscribe();
        //         //     } else {
        //         //
        //         //     }
        //         // });
        //         this.visionResultsArr = [];
        //         this.symbolsArr = [];
        //         this.dataPagesSize = [];
        //
        //         this.visionResult$
        //             .pipe(
        //                 take(1)
        //             )
        //             .subscribe((visionResults) => {
        //                 const objResults = {};
        //                 this.visionResultsArr = [];
        //                 this.symbolsArr = [];
        //                 this.dataPagesSize = [];
        //                 if (Array.isArray(visionResults)) {
        //                     visionResults.forEach((it, idx) => {
        //                         it.pipe(
        //                             take(1),
        //                             map(rslt => rslt && ('responses' in rslt) ? rslt.responses[0] : rslt)
        //                         ).subscribe((response:any) => {
        //                             console.log('-----------------1111111---------', idx);
        //                             objResults[idx] = {
        //                                 symbolsArr: [],
        //                                 visionResultsArr: [],
        //                                 dataPagesSize: []
        //                             };
        //                             if (response && response.fullTextAnnotation && response.fullTextAnnotation.pages && Array.isArray(response.fullTextAnnotation.pages)) {
        //                                 let height = response.fullTextAnnotation.pages[0].height;
        //                                 let width = response.fullTextAnnotation.pages[0].width;
        //
        //                                 if (this.pageImages && this.pageImages.length && height === 0 && width === 0) {
        //                                     width = this.pageImages['_results'][idx].nativeElement.width;
        //                                     height = this.pageImages['_results'][idx].nativeElement.height;
        //                                 }
        //                                 const x = (width / 2) - 50;
        //                                 const y = (height / 2) - 15;
        //                                 objResults[idx].dataPagesSize = [
        //                                     {'x': x, 'y': y},
        //                                     {'x': x + 100, 'y': y},
        //                                     {'x': x + 100, 'y': y + 30},
        //                                     {'x': x, 'y': y + 30}
        //                                 ];
        //                                 objResults[idx].symbolsArr = response.fullTextAnnotation.pages[0].blocks;
        //
        //                                 // this.symbolsArr.push(response.fullTextAnnotation.pages[0].blocks);
        //                                 const visionResultArr = response.fullTextAnnotation.pages[0].blocks
        //                                     .flatMap(block => {
        //                                         const blockWords = block.paragraphs
        //                                             .flatMap(paragraph => paragraph.words);
        //
        //                                         const mergedWords = [];
        //                                         let groupStartIdx = 0;
        //                                         for (let currIdx = 1; currIdx < blockWords.length; ++currIdx) {
        //                                             const groupStringified = this.stringifySymbols(
        //                                                 blockWords.slice(groupStartIdx, currIdx + 1).flatMap(word => word.symbols));
        //                                             if (groupStringified.includes(' ')
        //                                                 || !this.geometryHelper.areAlignedHorizontally(
        //                                                     blockWords[currIdx - 1].boundingBox.vertices,
        //                                                     blockWords[currIdx].boundingBox.vertices)) {
        //                                                 const wordsToMerge = blockWords.slice(groupStartIdx, currIdx);
        //                                                 const symbolsToMerge = wordsToMerge.flatMap(word => word.symbols);
        //                                                 const mergedWord = {
        //                                                     text: this.stringifySymbols(symbolsToMerge),
        //                                                     vertices: this.geometryHelper.mergedBoxOf(wordsToMerge),
        //                                                     symbols: symbolsToMerge
        //                                                 };
        //                                                 if (mergedWords.length > 0
        //                                                     && this.geometryHelper.areLineNeighbours(
        //                                                         mergedWords[mergedWords.length - 1].vertices,
        //                                                         mergedWord.vertices)) {
        //                                                     mergedWords[mergedWords.length - 1].vertices =
        //                                                         this.geometryHelper.mergedBoxOfPoly([
        //                                                             mergedWords[mergedWords.length - 1],
        //                                                             mergedWord]);
        //                                                     mergedWords[mergedWords.length - 1].text += ' ' + mergedWord.text;
        //                                                     mergedWords[mergedWords.length - 1].symbols = [
        //                                                         ...mergedWords[mergedWords.length - 1].symbols,
        //                                                         ...mergedWord.symbols
        //                                                     ];
        //                                                 } else {
        //                                                     mergedWords.push(mergedWord);
        //                                                 }
        //                                                 groupStartIdx = currIdx;
        //                                             }
        //                                         }
        //
        //                                         const wordsToMergeLast = blockWords.slice(groupStartIdx);
        //                                         const symbolsToMergeLast = wordsToMergeLast.flatMap(word => word.symbols);
        //                                         const mergedWordLast = {
        //                                             text: this.stringifySymbols(symbolsToMergeLast),
        //                                             vertices: this.geometryHelper.mergedBoxOf(wordsToMergeLast),
        //                                             symbols: symbolsToMergeLast
        //                                         };
        //                                         if (mergedWords.length > 0
        //                                             && this.geometryHelper.areLineNeighbours(
        //                                                 mergedWords[mergedWords.length - 1].vertices,
        //                                                 mergedWordLast.vertices)) {
        //                                             mergedWords[mergedWords.length - 1].vertices =
        //                                                 this.geometryHelper.mergedBoxOfPoly([
        //                                                     mergedWords[mergedWords.length - 1],
        //                                                     mergedWordLast]);
        //                                             mergedWords[mergedWords.length - 1].text += ' ' + mergedWordLast.text;
        //                                             mergedWords[mergedWords.length - 1].symbols = [
        //                                                 ...mergedWords[mergedWords.length - 1].symbols,
        //                                                 ...mergedWordLast.symbols
        //                                             ];
        //                                         } else {
        //                                             mergedWords.push(mergedWordLast);
        //                                         }
        //
        //                                         if (Array.isArray(mergedWords) && mergedWords.length) {
        //                                             mergedWords.forEach((items, idx) => {
        //                                                 if (Array.isArray(items.vertices) && items.vertices.length && items.vertices.find(vertx => (vertx.x === undefined || vertx.y === undefined || vertx.x < 0 || vertx.y < 0))) {
        //                                                     items.vertices.forEach(item => {
        //                                                         if (item.x === undefined || item.x < 0) {
        //                                                             item.x = 0;
        //                                                         }
        //                                                         if (item.y === undefined || item.y < 0) {
        //                                                             item.y = 0;
        //                                                         }
        //                                                     });
        //                                                     mergedWords[idx].vertices = items.vertices;
        //                                                 }
        //                                             });
        //                                         }
        //                                         return mergedWords;
        //                                     });
        //
        //                                 objResults[idx].visionResultsArr = visionResultArr;
        //                                 // this.visionResultsArr.push(visionResultArr);
        //                             } else {
        //                                 // this.visionResultsArr.push([]);
        //                                 // this.symbolsArr.push([]);
        //                             }
        //
        //                             if (Object.keys(objResults).length === visionResults.length) {
        //                                 Object.keys(objResults).sort();
        //
        //                                 for (const [key, value] of Object.entries(objResults)) {
        //                                     // console.log(`${key}: ${value}`);
        //                                     this.symbolsArr.push(value['symbolsArr']);
        //                                     this.dataPagesSize.push(value['dataPagesSize']);
        //                                     this.visionResultsArr.push(value['visionResultsArr']);
        //                                 }
        //                                 debugger
        //                                 // console.log(this.dataPagesSize);
        //                                 this.createFormAfterGetPagesSize(fileDetails);
        //                             }
        //                         });
        //                     });
        //                 } else {
        //                     this.createFormAfterGetPagesSize(fileDetails);
        //                 }
        //             });
        //
        //     });
        // // }
    }

    private createVisionResultsHandlers(): any {
        // this.currentPageVisionResults$ = zip(
        //     this.visionResult$)
        //     .pipe(
        //         switchMap(([visionResults]) => {
        //             return null;
        //             // return Array.isArray(visionResults) && (pageNo - 1) < visionResults.length
        //             //     ? visionResults[pageNo - 1]
        //             //         .pipe(
        //             //             // TODO: this for backward compatability, remove later
        //             //             map(rslt => rslt && ('responses' in rslt) ? rslt.responses[0] : rslt)
        //             //         )
        //             //     : null;
        //         }),
        //         shareReplay(1)
        //         // publishReplay(1),
        //         // refCount()
        //     );
        // this.wordsFieldsExist = [];
        // this.visionResultsArr = [];
        // this.symbolsArr = [];
        // this.dataPagesSize = [];
        //
        // this.visionResult$
        //     .pipe(
        //         take(1)
        //     )
        //     .subscribe((visionResults) => {
        //         const objResults = {};
        //         this.visionResultsArr = [];
        //         this.symbolsArr = [];
        //         this.dataPagesSize = [];
        //         if (Array.isArray(visionResults)) {
        //             visionResults.forEach((it, idx) => {
        //                 it.pipe(
        //                     take(1),
        //                     map(rslt => rslt && ('responses' in rslt) ? rslt.responses[0] : rslt)
        //                 ).subscribe((response:any) => {
        //                     console.log('-----------------1111111---------', idx);
        //                     objResults[idx] = {
        //                         symbolsArr: [],
        //                         visionResultsArr: [],
        //                         dataPagesSize: []
        //                     };
        //                     if (response && response.fullTextAnnotation && response.fullTextAnnotation.pages && Array.isArray(response.fullTextAnnotation.pages)) {
        //                         let height = response.fullTextAnnotation.pages[0].height;
        //                         let width = response.fullTextAnnotation.pages[0].width;
        //
        //                         if (this.pageImages && this.pageImages.length && height === 0 && width === 0) {
        //                             width = this.pageImages['_results'][idx].nativeElement.width;
        //                             height = this.pageImages['_results'][idx].nativeElement.height;
        //                         }
        //                         const x = (width / 2) - 50;
        //                         const y = (height / 2) - 15;
        //                         objResults[idx].dataPagesSize = [
        //                             {'x': x, 'y': y},
        //                             {'x': x + 100, 'y': y},
        //                             {'x': x + 100, 'y': y + 30},
        //                             {'x': x, 'y': y + 30}
        //                         ];
        //                         objResults[idx].symbolsArr = response.fullTextAnnotation.pages[0].blocks;
        //
        //                         // this.symbolsArr.push(response.fullTextAnnotation.pages[0].blocks);
        //                         const visionResultArr = response.fullTextAnnotation.pages[0].blocks
        //                             .flatMap(block => {
        //                                 const blockWords = block.paragraphs
        //                                     .flatMap(paragraph => paragraph.words);
        //
        //                                 const mergedWords = [];
        //                                 let groupStartIdx = 0;
        //                                 for (let currIdx = 1; currIdx < blockWords.length; ++currIdx) {
        //                                     const groupStringified = this.stringifySymbols(
        //                                         blockWords.slice(groupStartIdx, currIdx + 1).flatMap(word => word.symbols));
        //                                     if (groupStringified.includes(' ')
        //                                         || !this.geometryHelper.areAlignedHorizontally(
        //                                             blockWords[currIdx - 1].boundingBox.vertices,
        //                                             blockWords[currIdx].boundingBox.vertices)) {
        //                                         const wordsToMerge = blockWords.slice(groupStartIdx, currIdx);
        //                                         const symbolsToMerge = wordsToMerge.flatMap(word => word.symbols);
        //                                         const mergedWord = {
        //                                             text: this.stringifySymbols(symbolsToMerge),
        //                                             vertices: this.geometryHelper.mergedBoxOf(wordsToMerge),
        //                                             symbols: symbolsToMerge
        //                                         };
        //                                         if (mergedWords.length > 0
        //                                             && this.geometryHelper.areLineNeighbours(
        //                                                 mergedWords[mergedWords.length - 1].vertices,
        //                                                 mergedWord.vertices)) {
        //                                             mergedWords[mergedWords.length - 1].vertices =
        //                                                 this.geometryHelper.mergedBoxOfPoly([
        //                                                     mergedWords[mergedWords.length - 1],
        //                                                     mergedWord]);
        //                                             mergedWords[mergedWords.length - 1].text += ' ' + mergedWord.text;
        //                                             mergedWords[mergedWords.length - 1].symbols = [
        //                                                 ...mergedWords[mergedWords.length - 1].symbols,
        //                                                 ...mergedWord.symbols
        //                                             ];
        //                                         } else {
        //                                             mergedWords.push(mergedWord);
        //                                         }
        //                                         groupStartIdx = currIdx;
        //                                     }
        //                                 }
        //
        //                                 const wordsToMergeLast = blockWords.slice(groupStartIdx);
        //                                 const symbolsToMergeLast = wordsToMergeLast.flatMap(word => word.symbols);
        //                                 const mergedWordLast = {
        //                                     text: this.stringifySymbols(symbolsToMergeLast),
        //                                     vertices: this.geometryHelper.mergedBoxOf(wordsToMergeLast),
        //                                     symbols: symbolsToMergeLast
        //                                 };
        //                                 if (mergedWords.length > 0
        //                                     && this.geometryHelper.areLineNeighbours(
        //                                         mergedWords[mergedWords.length - 1].vertices,
        //                                         mergedWordLast.vertices)) {
        //                                     mergedWords[mergedWords.length - 1].vertices =
        //                                         this.geometryHelper.mergedBoxOfPoly([
        //                                             mergedWords[mergedWords.length - 1],
        //                                             mergedWordLast]);
        //                                     mergedWords[mergedWords.length - 1].text += ' ' + mergedWordLast.text;
        //                                     mergedWords[mergedWords.length - 1].symbols = [
        //                                         ...mergedWords[mergedWords.length - 1].symbols,
        //                                         ...mergedWordLast.symbols
        //                                     ];
        //                                 } else {
        //                                     mergedWords.push(mergedWordLast);
        //                                 }
        //
        //                                 if (Array.isArray(mergedWords) && mergedWords.length) {
        //                                     mergedWords.forEach((items, idx) => {
        //                                         if (Array.isArray(items.vertices) && items.vertices.length && items.vertices.find(vertx => (vertx.x === undefined || vertx.y === undefined || vertx.x < 0 || vertx.y < 0))) {
        //                                             items.vertices.forEach(item => {
        //                                                 if (item.x === undefined || item.x < 0) {
        //                                                     item.x = 0;
        //                                                 }
        //                                                 if (item.y === undefined || item.y < 0) {
        //                                                     item.y = 0;
        //                                                 }
        //                                             });
        //                                             mergedWords[idx].vertices = items.vertices;
        //                                         }
        //                                     });
        //                                 }
        //                                 return mergedWords;
        //                             });
        //
        //                         objResults[idx].visionResultsArr = visionResultArr;
        //                         // this.visionResultsArr.push(visionResultArr);
        //                     } else {
        //                         // this.visionResultsArr.push([]);
        //                         // this.symbolsArr.push([]);
        //                     }
        //
        //                     if (Object.keys(objResults).length === visionResults.length) {
        //                         Object.keys(objResults).sort();
        //
        //                         for (const [key, value] of Object.entries(objResults)) {
        //                             // console.log(`${key}: ${value}`);
        //                             this.symbolsArr.push(value['symbolsArr']);
        //                             this.dataPagesSize.push(value['dataPagesSize']);
        //                             this.visionResultsArr.push(value['visionResultsArr']);
        //                         }
        //                         debugger
        //                         // console.log(this.dataPagesSize);
        //                         this.createFormAfterGetPagesSize(fileDetails);
        //                     }
        //                 });
        //             });
        //         } else {
        //             this.createFormAfterGetPagesSize(fileDetails);
        //         }
        //     });
    }

    splitContent() {
        this.splitContentModal = true;

        this.ocrService.getOriginalDocumentPicture({fileId: this._fileScanView.fileId})
            .subscribe((response: any) => {
                const bodyRes = response ? response['body'] : response;
                let rotate = {
                    boundaryRad: 0,
                    image: null
                };
                const image = new Image();
                image.src = bodyRes.contentUrl;
                image.crossOrigin = 'Anonymous';
                image.onload = () => {
                    if (image.height > image.width) {
                        this.changeDegrees = true;
                        rotate.boundaryRad = Math.atan(image.width / image.height);
                        rotate.image = image;
                        const dataURL: string = this.getRotatedImage(rotate, {
                            degree: 90
                        });
                        this.splitContentModal = dataURL;
                    } else {
                        this.changeDegrees = false;
                        this.splitContentModal = bodyRes.contentUrl;
                    }
                };
            });
    }

    async splitImagesOuput(arrUrls: any) {
        // console.log('arrUrls: ', arrUrls);
        // this.splitContentModal = arrUrls.stageDataURL;
        this.splitContentModal = false;
        this.splitImagesOuputSrc = arrUrls.dataURLs;
        // console.log(arrUrls.stageDataURL);
        let rotate = {
            rotate: {
                boundaryRad: 0,
                image: null,
                degree: 0,
                notRotated: true
            },
            fileId: this._fileScanView.fileId
        };
        const image = new Image();
        image.src = arrUrls.stageDataURL;
        image.crossOrigin = 'Anonymous';
        image.onload = () => {
            if (this.changeDegrees) {
                rotate.rotate.boundaryRad = Math.atan(image.width / image.height);
                rotate.rotate.image = image;
                rotate.rotate.degree = 270;
                // this.buttonClicked.next({
                //     page: rotate, index: this.currentPage.getValue() - 1
                // });
                this.render(rotate, this.currentPage.getValue() - 1);
            } else {
                rotate.rotate.boundaryRad = Math.atan(image.width / image.height);
                rotate.rotate.image = image;
                this.render(rotate, this.currentPage.getValue() - 1);
                // this.buttonClicked.next({
                //     page: rotate, index: this.currentPage.getValue() - 1
                // });
            }
        };

        const files = [];
        for (let i = 0; i < arrUrls.dataURLs.length; i++) {
            const fileName = this._fileScanView.fileId + '_' + i;
            const blob = await this.getFile(arrUrls.dataURLs[i]);
            const lastModifiedDate = new Date();
            const file = new File([blob], fileName, {
                type: 'image/jpeg',
                lastModified: lastModifiedDate.getTime()
            });
            files.push(file);
        }
        await this.uploads(files);
    }

    public uploadToServer(files: any): {
        [key: string]: { progress: Observable<number> };
    } {
        this.progressAll = new Subject<number>();
        this.progressAll.next(0);
        const percentDoneTotal = [];
        const status: { [key: string]: { progress: Observable<number> } } = {};
        files.forEach((file: any, index) => {
            file.fileId =
                this.urlsFiles.links[index].s3UploadUrl.split(
                    '/'
                )[4];
            const req = new HttpRequest(
                'PUT',
                this.urlsFiles.links[index].s3UploadUrl,
                file,
                {
                    headers: new HttpHeaders({
                        'Content-Type': file.type
                    }),
                    reportProgress: true
                }
            );
            const progress = new Subject<number>();
            progress.next(0);
            this.http.request(req)
                .pipe(
                    retry({
                        count: 3,
                        delay: 1500
                    })
                ).subscribe(
                {
                    next: (event) => {
                        if (event.type === HttpEventType.UploadProgress) {
                            const percentDone = Math.round((100 * event.loaded) / event.total);
                            progress.next(percentDone);
                            percentDoneTotal[index] = percentDone / files.length;
                            const totalAll = percentDoneTotal.reduce((a, b) => a + b, 0);
                            // console.log('totalAll: ', totalAll);
                            this.progressAll.next(Math.round(totalAll));
                        } else if (event instanceof HttpResponse) {
                            progress.complete();
                        }
                    },
                    error: (error) => {
                        const reqServer = new HttpRequest(
                            'POST',
                            this.httpServices.mainUrl +
                            '/v1/ocr/upload-workaround/' +
                            this.urlsFiles.links[index]
                                .workaroundUploadUrl,
                            file,
                            {
                                headers: new HttpHeaders({
                                    'Content-Type': 'application/octet-stream',
                                    Authorization: this.userService.appData.token
                                }),
                                reportProgress: true
                            }
                        );
                        this.http.request(reqServer).subscribe(
                            (event) => {
                                if (event.type === HttpEventType.UploadProgress) {
                                    const percentDone = Math.round(
                                        (100 * event.loaded) / event.total
                                    );
                                    progress.next(percentDone);
                                    percentDoneTotal[index] = percentDone / files.length;
                                    const totalAll = percentDoneTotal.reduce((a, b) => a + b, 0);
                                    // console.log('totalAll: ', totalAll);
                                    this.progressAll.next(Math.round(totalAll));
                                } else if (event instanceof HttpResponse) {
                                    progress.complete();
                                }
                            },
                            (error) => {
                            }
                        );
                    }
                }
            );

            status[file.name] = {
                progress: progress.asObservable()
            };
            progress.next(0);
        });
        return status;
    }

    public async uploads(files: any): Promise<any> {
        this.fileUploadProgress = true;
        const filesCapture = files;
        this.urlsFiles = null;
        // console.log('files', files)
        this.sharedService
            .getUploadUrl({
                companyId: this.userService.appData.userData.companySelect.companyId,
                files: files.map((item) => {
                    return {
                        fileName: item.name,
                        fileType: item.type,
                        parent: false
                    };
                }),
                status: 'WAIT_FOR_CARE',
                originalFileId: this._fileScanView.fileId,
                folderId: null,
                expense: null,
                uploadSource: 'SEPARATED'
            })
            .subscribe((response: any) => {
                this.urlsFiles = response
                    ? response['body']
                    : response;
                console.log('responseFiles', this.urlsFiles);
                this.progress = this.uploadToServer(filesCapture);
                // console.log(this.files)

                // const subscriptionTimerGetFilesStatus = interval(5000)
                //     .pipe(
                //         startWith(0),
                //         switchMap(() =>
                //             this.sharedService.getFilesStatus(
                //                 files.map((item) => {
                //                     return item.fileId;
                //                 })
                //             )
                //         )
                //     )
                //     .subscribe((responseStatus) => {
                //         const responseStatusData = responseStatus
                //             ? responseStatus['body']
                //             : responseStatus;
                //         responseStatusData.forEach((item) => {
                //             const setStatus = files.find(
                //                 (file) => file.fileId === item.fileId
                //             );
                //             if (setStatus && item.status === 'WAIT_FOR_CONFIRM') {
                //                 setStatus.ready = true;
                //             }
                //         });
                //         // console.log(this.files);
                //         if (
                //             files.every((file) => file.ready) ||
                //             !this.fileUploadProgress
                //         ) {
                //             subscriptionTimerGetFilesStatus.unsubscribe();
                //             if (files.every((file) => file.ready)) {
                //                 // this.componentRefChild.startChild();
                //             }
                //         }
                //     });

                const preventClose = function (e) {
                    e.preventDefault();
                    e.returnValue = '';
                };
                this._window.addEventListener('beforeunload', preventClose, true);
                const subscriptionTimerGetFilesPing = interval(20000)
                    .pipe(
                        startWith(0),
                        switchMap(() =>
                            this.sharedService.pingProcess(
                                this.urlsFiles.processId
                            )
                        )
                    )
                    .subscribe((responseStatus) => {
                    });

                const allProgressObservables = [];
                // tslint:disable-next-line:forin
                for (const key in this.progress) {
                    // noinspection JSUnfilteredForInLoop
                    allProgressObservables.push(this.progress[key].progress);
                }

                this.indexFileTimer = 0;
                const subscriptionTimer = timer(1000, 1000).subscribe(() => {
                    if (this.indexFileTimer + 1 >= files.length) {
                        this.indexFileTimer = 0;
                    } else {
                        this.indexFileTimer += 1;
                    }
                    // console.log('indexFileTimer: ', this.indexFileTimer);
                    // console.log('this.files[this.indexFileTimer].name: ', this.files[this.indexFileTimer].name);
                });
                // noinspection JSUnusedLocalSymbols
                zip(...allProgressObservables).subscribe((end) => {
                    this.progressAll.complete();
                    subscriptionTimer.unsubscribe();
                    subscriptionTimerGetFilesPing.unsubscribe();
                    this._window.removeEventListener('beforeunload', preventClose, true);

                    this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                        {
                            duration: 3,
                            multiple: filesCapture.length > 1,
                            text:
                                filesCapture.length +
                                ' מסמכים הועלו לחברת ' +
                                this.userService.appData.userData.companySelect.companyName +
                                ' ועברו לפיענוח'
                        }
                    );

                    // afterUpload

                });
            });
    }

    splitContentModalClose() {
        // document.querySelectorAll(".img-pos").forEach(el => el.remove());
    }

    private locateUserSearchkeyFrom(
        value: {
            fieldValue: string;
            fieldPage: number;
            fieldPosition: Array<{ x: number; y: number }>;
        },
        pageWords: Array<{
            vertices: Array<{ x: number; y: number }>;
            text: string;
        }>
    ): {
        searchkey: string;
        locationNo: number;
        locationDesc: 'RIGHT' | 'LEFT' | 'UP' | 'DOWN';
    } | null {
        if (
            !value ||
            !value.fieldPosition ||
            !value.fieldPosition.length ||
            !pageWords ||
            !pageWords.length
        ) {
            return null;
        }

        const pageWordsCandidatesOnly = pageWords.filter(
            (pw) => !!pw.text && !!pw.text.trim() && pw.text.trim() !== ':'
        );
        if (!pageWordsCandidatesOnly.length) {
            return null;
        }

        const pageWordContainsField = pageWordsCandidatesOnly.find(
            (pageWord) =>
                this.geometryHelper.rectangleContains(
                    pageWord.vertices,
                    value.fieldPosition
                ) &&
                value.fieldPosition.some(
                    (fldVertex) =>
                        !pageWord.vertices.some(
                            (vertex) => vertex.x === fldVertex.x && vertex.y === fldVertex.y
                        )
                )
        );
        if (pageWordContainsField) {
            //     const valMinX = this.geometryHelper.minX(value.fieldPosition);
            //     const leftRightSplitted = pageWordContainsField.symbols
            //         .filter(sym => !this.geometryHelper.rectanglesIntersect(
            //             value.fieldPosition, sym.boundingBox.vertices))
            //         .reduce((splitted, sym) => {
            //             if (this.geometryHelper.minX(sym.boundingBox.vertices) < valMinX) {
            //                 splitted.left.push(sym);
            //             } else {
            //                 splitted.right.push(sym);
            //             }
            //             return splitted;
            //         }, {left: [], right: []});
            //     let searchkeyCandidate = this.stringifySymbols(leftRightSplitted.right)
            //         .replace(/^[:\s]+|[:\s]+$/g, '');
            //     const selectedIndex = pageWordsCandidatesOnly.indexOf(pageWordContainsField);
            //     if (searchkeyCandidate) {
            //         return {
            //             searchkey: searchkeyCandidate,
            //             locationNo: pageWordsCandidatesOnly
            //                 .filter((pageWord, idx) => idx < selectedIndex
            //                     && this.stringifySymbols(pageWord.symbols).includes(searchkeyCandidate))
            //                 .length + 1,
            //             locationDesc: 'LEFT'
            //         };
            //     } else if ((searchkeyCandidate = this.stringifySymbols(leftRightSplitted.left)
            //         .replace(/^[:\s]+|[:\s]+$/g, ''))) {
            //         return {
            //             searchkey: searchkeyCandidate,
            //             locationNo: pageWordsCandidatesOnly
            //                 .filter((pageWord, idx) => idx < selectedIndex
            //                     && this.stringifySymbols(pageWord.symbols).includes(searchkeyCandidate))
            //                 .length + 1,
            //             locationDesc: 'RIGHT'
            //         };
            //     }
        }

        const pageWordsWithoutField = pageWordsCandidatesOnly.filter(
            (pageWord) =>
                !this.geometryHelper.rectanglesIntersect(
                    value.fieldPosition,
                    pageWord.vertices
                )
        );
        if (!pageWordsWithoutField.length) {
            return null;
        }

        const centerOfFieldBox = this.geometryHelper.centerOf(value.fieldPosition);
        const hNeighbours = pageWordsWithoutField.filter((pageWord) =>
            this.geometryHelper.areAlignedHorizontally(
                value.fieldPosition,
                pageWord.vertices
            )
        );
        if (hNeighbours.length) {
            hNeighbours.sort((a, b) => {
                const centerOfA = this.geometryHelper.centerOf(a.vertices),
                    centerOfB = this.geometryHelper.centerOf(b.vertices);
                return (
                    Math.hypot(
                        centerOfA.x - centerOfFieldBox.x,
                        centerOfA.y - centerOfFieldBox.y
                    ) -
                    Math.hypot(
                        centerOfB.x - centerOfFieldBox.x,
                        centerOfB.y - centerOfFieldBox.y
                    )
                );
            });
            hNeighbours.sort((a, b) => {
                const aAtRight =
                    this.geometryHelper.minX(a.vertices) > centerOfFieldBox.x;
                const bAtRight =
                    this.geometryHelper.minX(b.vertices) > centerOfFieldBox.x;
                return aAtRight === bAtRight ? 0 : aAtRight && !bAtRight ? -1 : 1;
            });
            const selectedIndex = pageWordsWithoutField.indexOf(hNeighbours[0]);
            return {
                searchkey: hNeighbours[0].text.replace(/^:+|:+$/g, ''),
                locationNo:
                    pageWordsWithoutField.filter(
                        (pageWord, idx) =>
                            idx < selectedIndex && pageWord.text === hNeighbours[0].text
                    ).length + 1,
                locationDesc:
                    this.geometryHelper.minX(hNeighbours[0].vertices) > centerOfFieldBox.x
                        ? 'LEFT'
                        : 'RIGHT'
            };
        } else {
            const allNeighbours = [...pageWordsWithoutField].sort((a, b) => {
                const centerOfA = this.geometryHelper.centerOf(a.vertices),
                    centerOfB = this.geometryHelper.centerOf(b.vertices);
                const yDiffA = Math.abs(centerOfA.y - centerOfFieldBox.y),
                    yDiffB = Math.abs(centerOfB.y - centerOfFieldBox.y);
                if (yDiffA > yDiffB) {
                    return 1;
                } else if (yDiffB > yDiffA) {
                    return -1;
                }

                return (
                    Math.hypot(
                        centerOfA.x - centerOfFieldBox.x,
                        centerOfA.y - centerOfFieldBox.y
                    ) -
                    Math.hypot(
                        centerOfB.x - centerOfFieldBox.x,
                        centerOfB.y - centerOfFieldBox.y
                    )
                );
            });
            const selectedIndex = pageWordsWithoutField.indexOf(allNeighbours[0]);
            return {
                searchkey: allNeighbours[0].text.replace(/^:+|:+$/g, ''),
                locationNo:
                    pageWordsWithoutField.filter(
                        (pageWord, idx) =>
                            idx < selectedIndex && pageWord.text === allNeighbours[0].text
                    ).length + 1,
                locationDesc:
                    this.geometryHelper.minY(allNeighbours[0].vertices) >
                    centerOfFieldBox.y
                        ? 'UP'
                        : 'DOWN'
            };
        }
    }

    // private recalculateInvoiceTotalsAndVat(isTaxFreeInvoice: boolean, totalIncludingVat: number) {
    //     const maamDivide = isTaxFreeInvoice ? 1 : Number('1.' + this.maamPercentage);
    //     const totalWithoutMaam_fieldId15 = totalIncludingVat / maamDivide;
    //     const totalMaam_fieldId16 = totalIncludingVat - totalWithoutMaam_fieldId15;
    //     this.fileFieldsForm.get('15').patchValue({
    //         effectiveValue: toFixedNumber(totalWithoutMaam_fieldId15)
    //     });
    //     this.fileFieldsForm.get('16').patchValue({
    //         effectiveValue: toFixedNumber(totalMaam_fieldId16)
    //     });
    // }

    private sumsEqual(v1: any, v2: any, sum: any): boolean {
        return (Number(v1) + Number(v2)).toFixed(2) === Number(sum).toFixed(2);
    }
}
