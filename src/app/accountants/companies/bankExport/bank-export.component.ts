import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    QueryList,
    TemplateRef,
    ViewChild,
    ViewChildren,
    ViewContainerRef,
    ViewEncapsulation
} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {ActivatedRoute, Router} from '@angular/router';
import {fromEvent, interval, lastValueFrom, Observable, Subject, Subscription, timer, zip} from 'rxjs';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {debounceTime, distinctUntilChanged, retry, startWith, switchMap, take} from 'rxjs/operators';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {StorageService} from '@app/shared/services/storage.service';
import {SharedService} from '@app/shared/services/shared.service';
import {DatePipe} from '@angular/common';
import {OverlayPanel} from 'primeng/overlaypanel';
import {TranslateService} from '@ngx-translate/core';
import {DomSanitizer, SafeUrl} from '@angular/platform-browser';
import {HttpClient, HttpErrorResponse, HttpEventType, HttpHeaders, HttpRequest, HttpResponse} from '@angular/common/http';
import {ReportService} from '@app/core/report.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {BrowserService} from '@app/shared/services/browser.service';
import {Listbox} from 'primeng/listbox/listbox';
import {HttpServices} from '@app/shared/services/http.services';
import {Dropdown} from 'primeng/dropdown';
import {CustomPreset, Range, RangePoint} from '@app/shared/component/date-range-selectors/presets';
import {getPageHeight} from '@app/shared/functions/getPageHeight';
// @ts-ignore
declare var Dynamsoft: any = window['Dynamsoft'];

const PDFDocument = window['PDFLib'].PDFDocument;
const pdfjsLib = window['pdfjsLib'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/js/pdf.worker.js';

export interface Element {
    companyHp: number;
    companyName: string;
    sourceProgramId: string;
    companyId: string;
}

@Component({
    templateUrl: './bank-export.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class BankExportComponent extends ReloadServices
    implements AfterViewInit, OnDestroy, OnInit {
    @ViewChild('itemsContainer', {read: ViewContainerRef}) container: ViewContainerRef;
    @ViewChild('item', {read: TemplateRef}) template: TemplateRef<any>;

    @ViewChildren('itemsContainerChild', {read: ViewContainerRef}) containerChild: ViewContainerRef;
    @ViewChild('itemChild', {read: TemplateRef}) templateChild: TemplateRef<any>;

    @ViewChild('fileDropRef', {read: ElementRef}) fileDropRef: ElementRef;
    public filesForContainer: any = 0;
    public filesForContainerCompleted: any = 0;
    public numberOfFilesForUpload: any = 0;
    public openCardDDEdit: any = false;
    public searchableList = ['companyHp', 'companyName'];
    public items = [];
    public loader = false;
    public companies: any = false;
    public companiesSrc: any = false;
    public companiesWithoutAgreement: any = false;
    public izuFilter: any = false;
    public izuSrc: any = false;
    public showModalNotAvailableExport: any = false;

    public currencyList: any = [];
    public countStatusData: any = {};
    public typeFilterExport: string = 'all';
    public typeOfFlow: string = 'all';


    public showItrotModal: any = false;
    public allIzuData = [];
    public activeCompany = null;
    public activeCompanyAnchor = null;

    public activeCompanyLoader: boolean = false;
    public activeCompanyDetails: any = null;
    public numFilterExport: any = false;
    public isTall: boolean = false;
    public currentPage: number = 0;
    public activeIndexCompany: number = 0;

    public entryLimit: number = 50;
    @Input() counter: any = 10;
    // public subscription: Observable<any>;
    public sortPipeDir: any = null;
    scrollSubscription = Subscription.EMPTY;
    virtualScrollSaved: any = null;

    @ViewChildren('formDropdowns') formDropdownsRef: QueryList<any>;

    public queryParam: any = null;
    public queryString = '';
    public filterInput: FormControl = new FormControl();
    public companyFilesSortControl: FormControl = new FormControl({
        orderBy: 'dateCreated',
        order: 'DESC'
    });
    public yearlyProgramShow: boolean = false;
    public sourceProgramIdShow: boolean = false;
    public esderMaamArr: any[];
    public sourceProgramIdArr: any[];
    public tokenValidStatusArr: any[];
    public agreementConfirmedArr: any[];
    public yearlyProgramArr: any[];
    public filterTypesSourceProgramId: any = null;
    public filterTypesTokenValidStatus: any = null;
    public filterTypesEsderMaam: any = null;
    public filterTypesYearlyProgram: any = null;
    public filterTypesAgreementConfirmedStatus: any = null;
    public queryExportString: any = '';
    public isSearch: boolean = false;
    public allIsFolderPlus: any = null;
    public paramsForExport: any = false;
    public hashBankDetails: any = false;
    public synced: any = null;
    public show_unsynced_companies: any = false;

    public filterExportInput: FormControl = new FormControl();
    @ViewChildren('tooltipEdit') tooltipEditRef: OverlayPanel;
    @ViewChildren('tooltipMoreData') tooltipMoreDataRef: OverlayPanel;
    public uploadFilesOcrPopUp: {
        visible: boolean;
        urlsFiles: any;
    };
    public scanFilesOcrPopUp: {
        visible: boolean;
        urlsFiles: any;
    };
    public tooltipEditFile: any;
    public keepOriginFiles: boolean = false;
    public changeStateUploadFile: boolean = false;
    public finishedPrepareFiles = false;
    public files: any = [];
    scrollSubscriptionFilter = Subscription.EMPTY;
    setCompanyIndex: boolean = false;

    public filesBeforeOrder: any = [];
    public filesOriginal: any = [];
    public fileViewer: any = false;
    public fileViewerSaved: any = false;
    public draggedIndex: number = -1;
    public onDragOverIndex: number = -1;
    public showDocumentStorageDataFired = false;
    public timeFireHover: any = false;
    public fileUploadProgress = false;
    public isPdf = false;
    public fileScanView: any = false;
    public arr = [
        {
            DWObject: null
        }
    ];
    public index = 0;
    public scanerList = [];
    public dynamsoftReady = false;
    public selectedScan = null;
    public finishedScan = false;
    public errorString: any = false;
    public showScanLoader = false;
    public showProgressScan: any = false;
    public scanStatusProgress: any = null;
    public stopped = false;
    public selectedItem: any;
    public selcetAllFiles = false;
    public progress: any;
    public folderSelect: any = null;
    public companySelect: any;
    public sidebarImgs: any = false;
    public eventRclickUpload: any;
    public subjectsForCompany: any;
    public subjectsForCompanyWhatsApp: any;
    public showExportPage: any = false;
    public companyForHashBankPopup: any;
    readonly docToSend: {
        visible: boolean;
        form: any;
        fd: any;
        approve: () => void;
        show: (fd?: any, showFloatNav?: any) => void;
    } = {
        visible: false,
        form: new FormGroup({
            sendType: new FormControl('MAIL'),
            from: new FormControl(null),
            fromMail: new FormControl(null),
            sendToClient: new FormControl(true),
            subject: new FormControl(null),
            toMail: new FormControl(null),
            targetUserId: new FormControl(null)
        }),
        fd: null,
        show: (fd?: any, showFloatNav?: any) => {
        },
        approve: () => {
        }
    };
    public sendTypeList: any = [
        {label: 'מייל', value: 'MAIL', disabled: false},
        {label: 'וואטסאפ - בקרוב', value: null, disabled: true},
        {label: 'הודעה - בקרוב', value: null, disabled: true}
    ];
    public createTemplateSubjectModal: {
        visible: boolean;
        progress: boolean;
        subjectId?: any;
        createType: boolean;
        subjectName: FormControl;
        subjectText: FormControl;
        approve: () => void;
        show(): void;
    };
    public subjectToRemove: any = false;
    public indexFileTimer = 0;
    public progressAll = new Subject<number>();
    public agreementPopup: any = false;
    @ViewChild('elemToPrint') elemToPrint: HTMLElement;
    public innerHeight: any = window.innerHeight;
    public imageScaleNewInvoice: number = 1;
    public isNgSrc: any = true;
    public window: any = window;
    public degRotateImg: number = 0;
    @ViewChildren('plist_subjectsForCompany')
    plist_subjectsForCompany_ref: QueryList<Listbox>;
    public isDev: any = false;
    public contacts: any = [];
    public contactsWithoutAgreement: any = [];
    public contactsWithoutAgreementNames: any = '';
    public exportPopupType: any = false;

    public showCreditExportPopup: any = false;
    public resetParamDDCust: any = false;
    public showPopupSpecialCharacters: any = false;


    public showExchangeRatePopup: any = false;

    public contactsModal: any;
    public showContactModal: boolean = false;

    public showContactModalaaa: boolean = true;

    current: {
        from: {
            month: number;
            year: number;
        };
        till: {
            month: number;
            year: number;
        };
    };
    readonly locale: any;
    allowed: Range;
    years: number[];
    currentDates: {
        from: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][];
        till: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][];
    };
    min: Date;
    max: Date;
    selection: CustomPreset;
    public selectedCompany: any;
    @ViewChild('historyToPrint') historyToPrint: HTMLElement;
    @ViewChild('historyToPrint2') historyToPrint2: HTMLElement;
    public file_0: boolean = true;
    public file_1: boolean = true;
    public enabledDownloadLink: boolean = true;
    public docsfile: any = null;
    public exportFileFolderCreatePrompt: any = false;
    public modalIzuInfo: any = false;
    public isHebrew1: any = false;
    public isHebrew2: any = false;
    public rightSideTooltip: any = 0;
    private _window = typeof window === 'object' && window ? window : null;
    private readonly dtPipe: DatePipe;
    setHeightDialogPopUpTypePx: any = 'auto';
    setWidthDialogPopUpTypePx: any = 'auto';
    public loaderGetList = true;

    constructor(
        public userService: UserService,
        public override sharedComponent: SharedComponent,
        public httpServices: HttpServices,
        private sortPipe: SortPipe,
        public translate: TranslateService,
        private sharedService: SharedService,
        private route: ActivatedRoute,
        private http: HttpClient,
        public reportService: ReportService,
        public sanitizer: DomSanitizer,
        private httpClient: HttpClient,
        public storageService: StorageService,
        public router: Router,
        private changeDetector: ChangeDetectorRef
    ) {
        super(sharedComponent);
        if (
            window.location.host.includes('dev') ||
            window.location.host.includes('localhost')
        ) {
            this.isDev = true;
            this.sendTypeList[1] = {
                label: 'וואטסאפ',
                value: 'WHATSAPP',
                disabled: false
            };
        }
        this.locale = translate.instant('langCalendar');
        this.selection = new CustomPreset('customDates');
        const mmntNow = this.userService.appData.moment();
        this.selection.from = new RangePoint(
            mmntNow.date(),
            mmntNow.month(),
            mmntNow.year()
        );
        this.selection.till = new RangePoint(
            mmntNow.date(),
            mmntNow.month(),
            mmntNow.year()
        );
        console.log('constructor customDatesPreset---', this.selection);

        // if (this.userService.appData.userData.companies && this.queryParam) {
        //     this.items = JSON.parse(JSON.stringify(this.userService.appData.userData.companies));
        //
        // } else {
        //     this.subscription = this.sharedComponent.getDataEvent.subscribe((value) => {
        //         this.items = JSON.parse(JSON.stringify(this.userService.appData.userData.companies));
        //
        //     });
        // }

        this.agreementPopup = this.userService.appData.userData.agreementPopup
            ? {
                agreementConfirmation: null,
                sendMarketingInformation: null,
                agreementClicked: false,
                step: 1
            }
            : false;

        this.dtPipe = new DatePipe('en-IL');
        this.filterExportInput.valueChanges
            .pipe(
                debounceTime(300),
                distinctUntilChanged()
            )
            .subscribe((term: any) => {
                if (term !== null) {
                    if (term.trimStart().length >= 1) {
                        this.queryExportString = term.trim();
                        this.isSearch = true;
                        this.filtersIzuAll(false, true);
                    } else {
                        this.queryExportString = '';
                        this.isSearch = false;
                        this.filtersIzuAll(false, true);
                    }
                }
            });

        this.docToSend = {
            visible: false,
            form: new FormGroup({
                sendType: new FormControl('MAIL'),
                targetUserId: new FormControl(null),
                from: new FormControl(null, [Validators.required]),
                fromMail: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [Validators.required, ValidatorsFactory.emailExtended],
                        updateOn: 'blur'
                    }
                ),
                toMail: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [Validators.required, ValidatorsFactory.emailExtended],
                        updateOn: 'blur'
                    }
                ),
                sendToClient: new FormControl(true),
                subject: new FormControl({
                    companyId: '',
                    subjectId: '22222222-2222-2222-2222-222222222222',
                    subjectName:
                        this.userService.appData.userData.firstName +
                        ' ' +
                        this.userService.appData.userData.lastName +
                        'הודעה מ',
                    subjectText: '',
                    system: true
                })
            }),
            fd: null,
            show: (fd?: any, showFloatNav?: any) => {
                if (fd) {
                    this.docToSend.fd = fd;
                } else if (showFloatNav) {
                    this.docToSend.fd = null;
                }
                const sendType = this.storageService.localStorageGetterItem(
                    'sendType_' + this.docToSend.fd
                );
                const toMail = this.storageService.localStorageGetterItem(
                    'toMail_' + this.docToSend.fd
                );
                const targetUserId = this.storageService.localStorageGetterItem(
                    'targetUserId_' + this.docToSend.fd
                );

                this.docToSend.form.reset({
                    // sendType: (this.contactsWithoutAgreement.length) ? 'WHATSAPP' : (sendType ? sendType : 'MAIL'),
                    sendType: sendType ? sendType : 'MAIL',
                    targetUserId: targetUserId ? targetUserId : null,
                    from: null,
                    fromMail: null,
                    sendToClient: true,
                    subject: {
                        companyId: '',
                        subjectId: '22222222-2222-2222-2222-222222222222',
                        subjectName:
                            this.userService.appData.userData.firstName +
                            ' ' +
                            this.userService.appData.userData.lastName +
                            'הודעה מ',
                        subjectText: '',
                        system: true
                    },
                    toMail: toMail ? toMail : null
                });
                this.docToSend.form.patchValue({
                    from:
                        this.userService.appData.userData.firstName +
                        ' ' +
                        this.userService.appData.userData.lastName,
                    fromMail: this.userService.appData.userData.mail
                        ? this.userService.appData.userData.mail.trim()
                        : null
                });
                this.sharedService.getSubjectsForCompany(this.docToSend.fd).subscribe(
                    (response: any) => {
                        this.subjectsForCompany = response
                            ? response['body'].filter(
                                (it) =>
                                    (!it.messageType || it.messageType !== 'whatsapp') &&
                                    it.subjectId !== '11111111-1111-1111-1111-111111111111' &&
                                    it.subjectId !== '4d3744ae-ce6f-4f55-8f7e-2eca6d45c856'
                            )
                            : response;
                        this.subjectsForCompanyWhatsApp = response
                            ? response['body'].filter(
                                (it) => it.messageType && it.messageType === 'whatsapp'
                            )
                            : response;
                        this.subjectsForCompanyWhatsApp.forEach((v) => {
                            v.subjectTextBasic = v.subjectText;
                            v.subjectText = '';
                        });
                        if (
                            this.docToSend.form.value.sendType === 'WHATSAPP' &&
                            this.subjectsForCompanyWhatsApp.length
                        ) {
                            const addSubject = JSON.parse(
                                JSON.stringify(this.subjectsForCompanyWhatsApp)
                            ).find(
                                (it) => it.subjectId === '4d3744ae-ce6f-4f55-8f7e-2eca6d45c856'
                            );
                            if (
                                addSubject &&
                                this.router.url.includes('journalTrans/suppliersAndCustomers')
                            ) {
                                this.docToSend.form.patchValue({
                                    subject: addSubject
                                });
                            } else {
                                const itemWhatsApp = JSON.parse(
                                    JSON.stringify(this.subjectsForCompanyWhatsApp)
                                )[0];
                                this.docToSend.form.patchValue({
                                    subject: itemWhatsApp
                                });
                            }
                        } else {
                            const addSubject = JSON.parse(
                                JSON.stringify(this.subjectsForCompany)
                            ).find(
                                (it) => it.subjectId === '22222222-2222-2222-2222-222222222222'
                            );
                            if (addSubject) {
                                addSubject.subjectText = '';
                                addSubject.subjectName +=
                                    this.userService.appData.userData.firstName +
                                    ' ' +
                                    this.userService.appData.userData.lastName;
                                this.docToSend.form.patchValue({
                                    subject: addSubject
                                });
                            } else {
                                this.docToSend.form.patchValue({
                                    subject: {
                                        companyId: '',
                                        subjectId: '22222222-2222-2222-2222-222222222222',
                                        subjectName:
                                            this.userService.appData.userData.firstName +
                                            ' ' +
                                            this.userService.appData.userData.lastName +
                                            'הודעה מ',
                                        subjectText: '',
                                        system: true
                                    }
                                });
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
                    }
                );
                this.sharedService
                    .contacts({
                        uuid: this.docToSend.fd
                    })
                    .subscribe((response: any) => {
                        this.contacts = response ? response['body'] : response;
                        // this.contactsWithoutAgreement = [];
                        // const agreementConfirmationDateTrue = this.contacts.filter(it => it.agreementConfirmationDate === true);
                        this.contacts.forEach((v) => {
                            v.label = v.firstName + ' ' + v.lastName;
                            v.value = v.companyContactId;
                            // if (!v.agreementConfirmationDate && !agreementConfirmationDateTrue.length) {
                            //     this.contactsWithoutAgreement.push(v);
                            // }
                        });
                        // this.docToSend.form.patchValue({
                        //     targetUserId: this.contacts[0].companyContactId
                        // });
                        // if (this.contactsWithoutAgreement.length) {
                        //     this.contactsWithoutAgreementNames = this.contactsWithoutAgreement.map(it => it.firstName).join(', ');
                        //     this.docToSend.form.patchValue({
                        //         sendType: 'WHATSAPP'
                        //     });
                        // }

                        this.contactsWithoutAgreement = [];
                        const agreementConfirmationDateTrue = this.contacts.filter(
                            (it) =>
                                !it.agreementConfirmationDate &&
                                this.docToSend.form.value.targetUserId === it.companyContactId
                        );
                        if (agreementConfirmationDateTrue.length) {
                            this.contactsWithoutAgreement.push(
                                agreementConfirmationDateTrue[0]
                            );
                            this.contactsWithoutAgreementNames =
                                agreementConfirmationDateTrue.map((it) => it.firstName);
                            // this.docToSend.form.patchValue({
                            //     sendType: 'WHATSAPP'
                            // });
                        }
                    });

                this.docToSend.visible = true;
            },
            approve: async () => {
                if (this.docToSend.form.value.toMail) {
                    this.storageService.localStorageSetter(
                        'toMail_' + this.docToSend.fd,
                        this.docToSend.form.value.toMail
                    );
                }
                if (this.docToSend.form.value.targetUserId) {
                    this.storageService.localStorageSetter(
                        'targetUserId_' + this.docToSend.fd,
                        this.docToSend.form.value.targetUserId
                    );
                }
                const addToDetails =
                    '\n בברכה, \n' +
                    (this.docToSend.form.get('from').value
                        ? this.docToSend.form.get('from').value
                        : this.userService.appData.userData.firstName +
                        ' ' +
                        this.userService.appData.userData.lastName);
                // console.log(this.docToSend.form);
                this.docToSend.visible = false;
                const gRecaptcha = await this.userService.executeAction('send-client-message');
                this.sharedService
                    .sendClientMessage(
                        this.docToSend.form.value.sendType === 'WHATSAPP'
                            ? {
                                gRecaptcha: gRecaptcha,
                                fileIds: [],
                                details:
                                    !this.docToSend.form.value.subject ||
                                    this.docToSend.form.value.subject.subjectText === ''
                                        ? null
                                        : this.docToSend.form.value.subject.subjectText,
                                from: null,
                                fromMail: null,
                                sendType: this.docToSend.form.value.sendType,
                                subject:
                                    !this.docToSend.form.value.subject ||
                                    this.docToSend.form.value.subject.subjectName === ''
                                        ? null
                                        : this.docToSend.form.value.subject.subjectName,
                                toMail: null,
                                targetUserId: this.docToSend.form.value.targetUserId
                            }
                            : {
                                gRecaptcha: gRecaptcha,
                                targetUserId: this.docToSend.form.value.targetUserId,
                                fileIds: [],
                                details:
                                    !this.docToSend.form.value.subject ||
                                    this.docToSend.form.value.subject.subjectText === ''
                                        ? null
                                        : this.docToSend.form.value.subject.subjectText +
                                        addToDetails,
                                from:
                                    this.docToSend.form.value.from === ''
                                        ? null
                                        : this.docToSend.form.value.from,
                                fromMail:
                                    this.docToSend.form.value.fromMail === ''
                                        ? null
                                        : this.docToSend.form.value.fromMail,
                                sendType: this.docToSend.form.value.sendType,
                                subject:
                                    !this.docToSend.form.value.subject ||
                                    this.docToSend.form.value.subject.subjectName === ''
                                        ? null
                                        : this.docToSend.form.value.subject.subjectName,
                                toMail:
                                    this.docToSend.form.value.toMail === ''
                                        ? null
                                        : this.docToSend.form.value.toMail
                            }
                    )
                    .subscribe(
                        () => {
                            this.docToSend.visible = false;
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
        };
        this.createTemplateSubjectModal = {
            visible: false,
            progress: false,
            subjectId: null,
            createType: true,
            subjectName: new FormControl('', {
                validators: [Validators.required]
            }),
            subjectText: new FormControl('', {
                validators: [Validators.required]
            }),
            show(
                isEdit?: boolean,
                subjectName?: string,
                subjectText?: string,
                subjectId?: string
            ): void {
                if (isEdit) {
                    this.createType = false;
                    this.subjectId = subjectId;
                    this.subjectName.reset(subjectName);
                    this.subjectText.reset(subjectText);
                } else {
                    this.subjectId = null;
                    this.createType = true;
                    this.subjectName.reset('');
                    this.subjectText.reset('');
                }
                this.visible = true;
            },
            approve: () => {
                this.createTemplateSubjectModal.progress = true;
                this.createTemplateSubjectModal.visible = false;
                if (this.createTemplateSubjectModal.createType) {
                    this.sharedService
                        .createSubjects({
                            companyId: this.docToSend.fd,
                            subjectName: this.createTemplateSubjectModal.subjectName.value,
                            subjectText: this.createTemplateSubjectModal.subjectText.value
                        })
                        .subscribe(
                            () => {
                                this.sharedService
                                    .getSubjectsForCompany(this.docToSend.fd)
                                    .subscribe(
                                        (response: any) => {
                                            this.subjectsForCompany = response
                                                ? response['body']
                                                : response;
                                            this.createTemplateSubjectModal.progress = false;
                                        },
                                        (err: HttpErrorResponse) => {
                                            this.createTemplateSubjectModal.progress = false;

                                            if (err.error) {
                                                console.log('An error occurred:', err.error.message);
                                            } else {
                                                console.log(
                                                    `Backend returned code ${err.status}, body was: ${err.error}`
                                                );
                                            }
                                        }
                                    );
                            },
                            (err: HttpErrorResponse) => {
                                this.createTemplateSubjectModal.progress = false;

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
                    this.sharedService
                        .updateSubjects({
                            subjectId: this.createTemplateSubjectModal.subjectId,
                            subjectName: this.createTemplateSubjectModal.subjectName.value,
                            subjectText: this.createTemplateSubjectModal.subjectText.value
                        })
                        .subscribe(
                            () => {
                                const updateRow = this.subjectsForCompany.find(
                                    (it) =>
                                        it.subjectId === this.createTemplateSubjectModal.subjectId
                                );
                                updateRow.subjectName =
                                    this.createTemplateSubjectModal.subjectName.value;
                                updateRow.subjectText =
                                    this.createTemplateSubjectModal.subjectText.value;
                                this.createTemplateSubjectModal.progress = false;
                            },
                            (err: HttpErrorResponse) => {
                                this.createTemplateSubjectModal.progress = false;

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
        };
    }

    get isWindows() {
        return (
            window.navigator['userAgentData']['platform'] === 'Windows'
        );
    }

    get companyHpEmail(): string {
        if (this.companySelect && this.companySelect.companyHp) {
            return (
                ('000000000' + this.companySelect.companyHp).slice(-9) +
                '@biziboxcpa.com'
            );
        }
        return '';
    }

    get maxSizeHeightModal() {
        return window.innerHeight - 300;
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (this.fileScanView && event.code === 'Escape') {
            this.fileScanView = false;
        }
        if (this.files && this.fileViewer) {
            if (
                (event.ctrlKey || event.metaKey) &&
                (event.code === 'KeyA')
            ) {
                this.selcetAllFiles = !this.selcetAllFiles;
                this.files.forEach((fd, index) => {
                    fd.selcetFile = this.selcetAllFiles;
                });
                return false;
            }
        }
        return true;
    }

    @HostListener('document:dragover', ['$event'])
    @HostListener('drop', ['$event'])
    onDragDropFileVerifyZone(event) {
        if (
            (!this.fileViewer &&
                this.uploadFilesOcrPopUp &&
                this.uploadFilesOcrPopUp.visible) ||
            (!this.fileViewer &&
                this.scanFilesOcrPopUp &&
                this.scanFilesOcrPopUp.visible)
        ) {
            event.preventDefault();
            event.dataTransfer.effectAllowed = 'none';
            event.dataTransfer.dropEffect = 'none';
        }
    }

    private async buildData(length: number) {
        if (length) {
            await this.awaitIntervalGetContainer();
            if (this.container) {
                for (let n = 0; n < length; n++) {
                    if (this.allIzuData && this.allIzuData.length && this.allIzuData[n]) {
                        const copyParent = JSON.parse(JSON.stringify(this.allIzuData[n]));
                        copyParent.dataArray = [];
                        const context = {
                            companyParent: copyParent,
                            iParent: n
                        };
                        this.container.createEmbeddedView(this.template, context, {
                            index: n
                        });
                        // const parentConGet = this.container.get(n);
                        await this.awaitIntervalTimeRes(n);
                        const contChildGet: any = this.containerChild.get(n);
                        const dataArray = this.allIzuData[n].dataArray;
                        const len_dataArray = dataArray.length;
                        for (let i = 0; i < len_dataArray; i++) {
                            if (this.container.length) {
                                const contextChild = {
                                    company: dataArray[i],
                                    i: i,
                                    companyParent: copyParent,
                                    iParent: n
                                };
                                contChildGet.createEmbeddedView(this.templateChild, contextChild, {
                                    index: i
                                });
                            }
                            if ((i % 5) === 0) {
                                await this.awaitTime(10);
                            }
                        }
                        // await this.awaitTime(10);
                    }
                }
            }
        } else {
            if (this.container) {
                if (this.container.length) {
                    this.container.clear();
                }
            }
        }
    }

    awaitTime(time: any) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(true);
            }, time);
        });
    }

    awaitIntervalTimeRes(index: any) {
        return new Promise((resolve, reject) => {
            const interChild = setInterval(() => {
                const contChildGet: any = this.containerChild.get(index);
                if (contChildGet) {
                    clearInterval(interChild);
                    resolve(true);
                }
            }, 10);
        });
    }

    awaitIntervalGetContainer() {
        return new Promise((resolve, reject) => {
            const interChild = setInterval(() => {
                if (this.container) {
                    if (this.container.length) {
                        this.container.clear();
                    }
                    clearInterval(interChild);
                    resolve(true);
                }
            }, 10);
        });
    }

    ngOnInit() {
        this.showExportPage = this.userService.appData && (this.userService.appData.isAdmin ||
            (this.userService.appData.userData && !!this.userService.appData.userData.showNewExportPage));

        this.sharedComponent.getCompaniesEvent
            .pipe(
                startWith(true),
                take(1)
            )
            .subscribe((companiesExist: any) => {
                if (companiesExist) {
                    if (!!this.showExportPage) {
                        this.exportIzu();
                    }
                }
            });

        Dynamsoft.WebTwainEnv.ResourcesPath = '/assets/files/resources';
        // Dynamsoft.WebTwainEnv.ResourcesPath = 'assets/dwt-resources';
        Dynamsoft.WebTwainEnv.ProductKey =
            'f0068WQAAAMjD37MYQuF8gD5cX23zdlnKwTn6csMXDHsXWOK4CRS4lDE82sTzeW1ejTcOS7m7gOE9leRs0VSPDlpjDkIWENg=';
        // Dynamsoft.WebTwainEnv.ProductKey = 't0115YQEAADLdsKeUCK4+tJktPdfzkeFCkXXNRfl+fAMlzbNS/nDM0sXKq9mW/WFrty8KF3g7lNtAYfUOiICxcac/R4b8dBDJIczVQygkgTcBywD7uHkqFV0+gY9CX58UiSYJd4uYkjBa/RBSgJwlY3AAym9Xsw==';
        Dynamsoft.WebTwainEnv.AutoLoad = false;
        if (this.isWindows) {
            Dynamsoft.WebTwainEnv.RegisterEvent('OnWebTwainReady', () => {
                this.Dynamsoft_OnReady();
            });
        }
    }

    isExistCustId(custId: any, companyId: any) {
        if (this.izuSrc && this.izuSrc.length) {
            let existId = false;
            const isExist = this.izuSrc.find(it => it.companyId === companyId);
            if (isExist) {
                if (isExist.dataArray.find(it => it.izuCustId === custId)) {
                    existId = true;
                }
            }
            if (existId) {
                return true;
            }
        }
        return false;
    }

    contactsWithoutAgreementSend() {
        const companyContactIdList = this.contactsWithoutAgreement.map(
            (v) => v.companyContactId
        );
        this.sharedService
            .sendLandingPageMessages(companyContactIdList)
            .subscribe(() => {
                // this.companiesWithoutAgreement = true;
                // setTimeout(() => {
                //     this.companiesWithoutAgreement = false;
                // }, 3000);

                this.userService.appData.submitAlertContact = true;
                setTimeout(() => {
                    this.userService.appData.submitAlertContact = false;
                }, 3000);
                this.contactsWithoutAgreement = [];
            });
    }

    getIzuInfo(row: any) {
        this.modalIzuInfo = row;
        this.sharedService
            .getIzuInfo({
                accountId: row.accountId,
                accountType: row.accountType
            })
            .subscribe((response: any) => {
                this.modalIzuInfo.getIzuInfo = response ? response['body'] : response;

                // this.modalIzuInfo.getIzuInfo = {
                //     'newTransesToExport': 12, //תנועות חדשות לייצוא
                //     'newTransesToExportLink': 'string', //בלחיצה על הקובייה להעביר ללינק
                //     'exporterData': {
                //         'codeKulet': true, //האם בוצעה משיכה של קוד קולט (וי או איקס)
                //         'companyCustomerData': { //תאריך משיכת כרטיסי הנה"ח
                //             'date': '2023-03-29T17:02:10.717Z', //התאריך ושעה
                //             'hasDelta': true, //קיים דלתא או לא
                //             'link': 'string', //בלחיצה על הקובייה להעביר ללינק
                //             'status': 'string' //FAIL צבע הקובייה, יהיה אדום רק במצב של
                //         },
                //         'hashBankData': { //תאריך משיכת דפי בנק
                //             'date': '2023-03-29T17:02:10.717Z',
                //             'hasDelta': false,
                //             'link': 'string',
                //             'status': 'FAIL'
                //         },
                //         'lastHashChangeDate': '2023-03-29T17:02:10.717Z' //שינוי אחרון במסד הנתונים של חשבשבת
                //     },
                //     'accountDataLink': 'string', //פרטי חשבון, בלחיצה על הקובייה להעביר ללינק
                //     'tokenResultLink': 'string', //פרטי טוקן, בלחיצה על הקובייה להעביר ללינק
                //     'tokenSummeryLink': 'string', //סיכום טעינת טוקן, בלחיצה על הקובייה להעביר ללינק
                //     'lastHbFromAccount': { //התנועה האחרונה בהנה"ח - מחשבון בנק/מכרטיס אשראי
                //         'asmachta': 'string', //אסמכתא
                //         'balance': 0, //יתרה
                //         'date': '2023-03-29T17:02:10.717Z', //תאריך
                //         'total': 0, //סכום
                //         'transCount': 0, //כמות פעולות
                //         'unique': 'string' //unique ערך
                //     },
                //     'lastHbFromHashBank': { //התנועה האחרונה בהנה"ח - מחשבנק
                //         'asmachta': 'string',
                //         'balance': 0,
                //         'date': '2023-03-29T17:02:10.717Z',
                //         'total': 0,
                //         'transCount': 0,
                //         'unique': 'string'
                //     },
                //     'feedbackDesc': 'string' //הערות
                // };
            });
    }

    feedbackDescChangeFn(val: any) {
// console.log(val)
        this.sharedService
            .updateFeedbackDesc({
                accountId: this.modalIzuInfo.accountId,
                accountType: this.modalIzuInfo.accountType,
                feedbackDesc: val
            })
            .subscribe((response: any) => {

            });
    }

    handleKeyPressHeb1(e: any) {
        this.isHebrew1 = false;
        const str = String.fromCharCode(e.which);
        if (!str) {
            return;
        }
        this.isHebrew1 = str.search(/[\u0590-\u05FF]/) >= 0;
        if (this.isHebrew1) {
            e.preventDefault();
            e.stopPropagation();
        }
    }


    handleKeyPressHeb2(e: any) {
        this.isHebrew2 = false;
        const str = String.fromCharCode(e.which);
        if (!str) {
            return;
        }
        this.isHebrew2 = str.search(/[\u0590-\u05FF]/) >= 0;
        if (this.isHebrew2) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    moveToBankCredit(company: any, companyParent: any) {
        if (company.creditCardId || company.creditCardMatahId) {
            this.storageService.sessionStorageSetter(
                'creditsCard/*-filterCards',
                JSON.stringify([company.creditCardId || company.creditCardMatahId])
            );
            this.sharedComponent.selectCompanyParam(
                companyParent,
                'financialManagement/creditsCard/details'
            );
        } else {
            this.storageService.sessionStorageSetter(
                'bankAccount/*-filterAcc',
                JSON.stringify([company.companyAccountId])
            );
            this.sharedComponent.selectCompanyParam(
                companyParent,
                'financialManagement/bankAccount/details'
            );
        }
    }

    hebMailExistValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isHebrew = /[\u0590-\u05FF]/.test(control.value);
            return isHebrew ? {hebMailExist: {value: control.value}} : null;
        };
    }

    setVarTool(item: any, parent: any, openModal?: any, changeIzuCustId?: any) {
        this.tooltipEditFile = JSON.parse(JSON.stringify(item));
        this.tooltipEditFile['izuCustIdSrc'] = this.tooltipEditFile['izuCustId'];
        // this.tooltipEditFile['izuCustId'] = {
        //     custId: this.tooltipEditFile['izuCustIdSrc']
        // }
        this.tooltipEditFile['parent'] = parent;
        this.sharedService
            .companyGetCustomerExport({
                companyId: parent.companyId,
                sourceProgramId: parent.sourceProgramId
            })
            .subscribe(
                {
                    next: (resp: any) => {
                        this.userService.appData.userData.companyCustomerDetailsExport = resp
                            ? resp
                            : {
                                all: [],
                                banksCardsExport: [],
                                cupa: [],
                                cupa_new: [],
                                banksCards: [],
                                taxDeductionArr: [],
                                customerTaxDeductionCustIdArr: [],
                                taxDeductionCustIdHova: [],
                                taxDeductionCustIdZhut: [],
                                oppositeCustForChecks: [],
                                customerTaxDeductionCustIdExpenseArr: []
                            };

                        this.tooltipEditFile['izuCustId'] = this.tooltipEditFile['izuCustId'] && this.tooltipEditFile['izuCustId'] !== 'לא משוייך כרטיס'
                            ? (this.userService.appData.userData.companyCustomerDetailsExport.banksCardsExport.find(
                                (custIdxRec) =>
                                    custIdxRec.custId === this.tooltipEditFile['izuCustId']
                            ) ? this.userService.appData.userData.companyCustomerDetailsExport.banksCardsExport.find(
                                (custIdxRec) =>
                                    custIdxRec.custId === this.tooltipEditFile['izuCustId']
                            ).custId : '')
                            : '';
                    },
                    error: (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred:', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                }
            );

        if (openModal) {
            this.openCardDDEdit = true;
        }
        if (changeIzuCustId) {
            this.changeIzuCustId(this.tooltipEditFile, parent, true);
        }

        // company.creditCardId ? company.creditCardId : company.creditCardMatahId ? company.creditCardMatahId : company.companyAccountId
    }

    companyGetCustomerExport(parent: any, company: any) {
        if (company.companyCustomerDetailsExport && company.companyCustomerDetailsExport.banksCardsExport) {
            company.companyCustomerDetailsExport.banksCardsExport = this.disabledData(company.companyCustomerDetailsExport.banksCardsExport, company, parent.companyId);
        } else {
            company['izuCustIdSrc'] = company['izuCustId'];
            this.loaderGetList = true;
            this.sharedService
                .companyGetCustomerExport({
                    companyId: parent.companyId,
                    sourceProgramId: parent.sourceProgramId
                })
                .subscribe(
                    {
                        next: (resp: any) => {
                            company.companyCustomerDetailsExport = resp
                                ? resp
                                : {
                                    all: [],
                                    cupa: [],
                                    cupa_new: [],
                                    banksCards: [],
                                    banksCardsExport: [],
                                    taxDeductionArr: [],
                                    customerTaxDeductionCustIdArr: [],
                                    taxDeductionCustIdHova: [],
                                    taxDeductionCustIdZhut: [],
                                    oppositeCustForChecks: [],
                                    customerTaxDeductionCustIdExpenseArr: []
                                };
                            if (company['izuCustId'] && company['izuCustId'] !== 'לא משוייך כרטיס') {
                                const foundCartis = company.companyCustomerDetailsExport.banksCardsExport.find(
                                    (custIdxRec) =>
                                        custIdxRec.custId === company['izuCustId']
                                );
                                if (foundCartis) {
                                    company['izuCustId'] = foundCartis.custId;
                                }
                                console.log(company['izuCustId'])
                            }
                            company.companyCustomerDetailsExport.banksCardsExport = this.disabledData(company.companyCustomerDetailsExport.banksCardsExport, company, parent.companyId);
                            this.loaderGetList = false;
                        },
                        error: (err: HttpErrorResponse) => {
                            if (err.error) {
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

    moveToContact(): void {
        const companySelect = this.userService.appData.userData.companies.find(
            (co) => co.companyId === this.docToSend.fd
        );
        this.sharedComponent.selectCompanyParam(companySelect, '/general/contacts');
    }

    aaa(jgkhjf: any) {
        console.log(jgkhjf);
        debugger
    }

    setHeightDialogPopUpType(dialogRef) {
        setTimeout(() => {
            if (dialogRef && dialogRef.container && dialogRef.container.clientHeight) {
                this.setHeightDialogPopUpTypePx = dialogRef.container.clientHeight + 'px';
            }
            if (dialogRef && dialogRef.container && dialogRef.container.clientWidth) {
                this.setWidthDialogPopUpTypePx = dialogRef.container.clientWidth + 10 + 'px';
            }
        }, 10);
    }

    changeSendType() {
        this.storageService.localStorageSetter(
            'sendType_' + this.docToSend.fd,
            this.docToSend.form.value.sendType
        );
        if (
            this.docToSend.form.value.sendType === 'WHATSAPP' &&
            this.subjectsForCompanyWhatsApp.length
        ) {
            const addSubject = JSON.parse(
                JSON.stringify(this.subjectsForCompanyWhatsApp)
            ).find((it) => it.subjectId === '4d3744ae-ce6f-4f55-8f7e-2eca6d45c856');
            if (
                addSubject &&
                this.router.url.includes('journalTrans/suppliersAndCustomers')
            ) {
                this.docToSend.form.patchValue({
                    subject: addSubject
                });
            } else {
                const itemWhatsApp = JSON.parse(
                    JSON.stringify(this.subjectsForCompanyWhatsApp)
                )[0];
                this.docToSend.form.patchValue({
                    subject: itemWhatsApp
                });
            }
        } else {
            const addSubject = JSON.parse(
                JSON.stringify(this.subjectsForCompany)
            ).find((it) => it.subjectId === '22222222-2222-2222-2222-222222222222');
            if (addSubject) {
                addSubject.subjectText = '';
                addSubject.subjectName +=
                    this.userService.appData.userData.firstName +
                    ' ' +
                    this.userService.appData.userData.lastName;
                this.docToSend.form.patchValue({
                    subject: addSubject
                });
            } else {
                this.docToSend.form.patchValue({
                    subject: {
                        companyId: '',
                        subjectId: '22222222-2222-2222-2222-222222222222',
                        subjectName:
                            this.userService.appData.userData.firstName +
                            ' ' +
                            this.userService.appData.userData.lastName +
                            'הודעה מ',
                        subjectText: '',
                        system: true
                    }
                });
            }
        }
    }

    keepOriginFilesChange() {
        if (this.keepOriginFiles) {
            this.files = [...this.filesOriginal];
        } else {
            this.files = [...this.filesBeforeOrder];
        }
        setTimeout(() => {
            this.changeStateUploadFile = true;
            setTimeout(() => {
                this.changeStateUploadFile = false;
            }, 1000);
        }, 400);
        // console.log(this.files);
    }

    onClickOptionDD(disabled: boolean, event: any) {
        if (disabled) {
            event.stopPropagation();
        }
    }

    public deleteSubject() {
        this.sharedService
            .deleteSubjects({
                subjectId: this.subjectToRemove.subjectId
            })
            .subscribe(
                (response: any) => {
                    const indexRow = this.subjectsForCompany.findIndex(
                        (it) => it.subjectId === this.subjectToRemove.subjectId
                    );
                    this.subjectsForCompany.splice(indexRow, 1);
                    if (
                        this.plist_subjectsForCompany_ref &&
                        this.plist_subjectsForCompany_ref.length
                    ) {
                        this.plist_subjectsForCompany_ref.forEach((item) => {
                            item.options = this.subjectsForCompany;
                        });
                    }
                    if (this.docToSend.visible) {
                        const addSubject = this.subjectsForCompany.find(
                            (it) => it.subjectId === '22222222-2222-2222-2222-222222222222'
                        );
                        if (addSubject) {
                            addSubject.subjectText = '';
                            this.docToSend.form.patchValue({
                                subject: addSubject
                            });
                        } else {
                            this.docToSend.form.patchValue({
                                subject: {
                                    companyId: '',
                                    subjectId: '22222222-2222-2222-2222-222222222222',
                                    subjectName:
                                        this.userService.appData.userData.firstName +
                                        ' ' +
                                        this.userService.appData.userData.lastName +
                                        'הודעה מ',
                                    subjectText: '',
                                    system: true
                                }
                            });
                        }
                    }

                    this.subjectToRemove = false;
                },
                (err: HttpErrorResponse) => {
                    this.createTemplateSubjectModal.progress = false;

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

    override reload() {
        console.log('reload child');
        if (!!this.showExportPage) {
            this.exportIzu();
        }
    }

    round(num: number): number {
        return Math.round(num);
    }

    onScroll(scrollbarRef: any, virtualScroll: any) {
        this.virtualScrollSaved = virtualScroll;

        // setTimeout(() => {
        //     if (this.scrollSubscription) {
        //         this.activeCompanyLoader = false;
        //         this.scrollSubscription.unsubscribe();
        //     }
        //     this.scrollSubscription = this.virtualScrollSaved.elementScrolled()
        //         .pipe(
        //             map(() => this.virtualScrollSaved.measureScrollOffset('bottom')),
        //             filter((y1) => y1 <= 0.5),
        //             throttleTime(300),
        //             debounceTime(300)
        //         )
        //         .subscribe(e => {
        //             console.log('------------End - move to next Company');
        //             const companyId = this.activeCompany.companyId;
        //             const getIndexCur = this.allIzuData.findIndex(it => it.companyId === companyId);
        //             if (getIndexCur !== -1 && (getIndexCur + 1) <= (this.allIzuData.length - 1)) {
        //                 this.activeCompanyAnchor = this.allIzuData[getIndexCur + 1];
        //                 anchor.click();
        //             }
        //
        //
        //             // this.virtualScrollSaved = null;
        //             // if (this.scrollSubscription) {
        //             //     this.scrollSubscription.unsubscribe();
        //             // }
        //
        //             // this.activeCompany = null;
        //             // // this.activeCompanyLoader = true;
        //             // // this.setActiveCompany(this.allIzuData[getIndexCur + 1]);
        //             // setTimeout(() => {
        //             //     this.activeCompany = this.allIzuData[getIndexCur + 1];
        //             //     this.activeCompanyLoader = false;
        //             // }, 10000);
        //             // console.log('scrolled', virtualScroll.measureScrollOffset('bottom'), e);
        //
        //             // const heightRows = (61 * this.activeCompany.dataArray.length) + 9;
        //             // // console.log('heightRows:', heightRows)
        //             // if (!this.activeCompanyLoader && (heightRows > e.target.clientHeight) &&
        //             //     ((e.target.offsetHeight + e.target.scrollTop + 0.5) >= e.target.scrollHeight)) {
        //             //     console.log('------------End - move to next Company');
        //             //     const companyId = this.activeCompany.companyId;
        //             //     this.activeCompany = null;
        //             //     setTimeout(() => {
        //             //         const getIndexCur = this.allIzuData.findIndex(it => it.companyId === companyId);
        //             //         if (getIndexCur !== -1 && (getIndexCur + 1) <= (this.allIzuData.length - 1)) {
        //             //             this.activeCompanyLoader = true;
        //             //             debugger
        //             //             this.setActiveCompany(this.allIzuData[getIndexCur + 1]);
        //             //             setTimeout(() => {
        //             //                 this.activeCompanyLoader = false;
        //             //                 debugger
        //             //             }, 200);
        //             //         }
        //             //     }, 10);
        //             // }
        //         });
        // }, 100);


        // let changed = false;
        // this.scrollSubscription = scrollbarRef.scrolled.subscribe(e => {
        //     // console.log("e.target: ", e.target.offsetHeight + e.target.scrollTop + 0.5)
        //     // console.log('--------------------')
        //     // // console.log("e.target.scrollHeight: ", e.target.scrollHeight)
        //     // // console.log("e.offsetHeight: ", e.target.offsetHeight)
        //     // // console.log("e.scrollTop: ", e.target.scrollTop)
        //     // // console.log("e.scrollTop: ", e)
        //     //
        //     // const heightRows = (61 * this.activeCompany.dataArray.length) + 9;
        //     // // console.log('heightRows:', heightRows)
        //     // if ((heightRows > e.target.clientHeight) &&
        //     //     ((e.target.offsetHeight + e.target.scrollTop + 0.5) >= e.target.scrollHeight)) {
        //     //     changed = true;
        //     //     console.log('------------End - move to next Company');
        //     //     const companyId = this.activeCompany.companyId;
        //     //     // this.activeCompany = null;
        //     //     setTimeout(()=>{
        //     //         const getIndexCur = this.allIzuData.findIndex(it => it.companyId === companyId);
        //     //         if (getIndexCur !== -1 && (getIndexCur + 1) <= (this.allIzuData.length - 1)) {
        //     //             this.setActiveCompany(this.allIzuData[getIndexCur + 1]);
        //     //             // setTimeout(() => {
        //     //             //     changed = true;
        //     //             // }, 200);
        //     //         }
        //     //     }, 0);
        //     // }
        //     // console.log('--------------------')
        //     // this.onScrollCubes();
        // });
    }

    onScrollFilter(scrollbarRef: any, virtualScroll: any) {
        // if (this.scrollSubscriptionFilter) {
        //     this.scrollSubscriptionFilter.unsubscribe();
        // }
        // this.scrollSubscriptionFilter = scrollbarRef.scrolled.subscribe(e => {
        //     if (!this.setCompanyIndex) {
        //         let size = 0;
        //         let indexCompany = 0;
        //         for (let index = 0, len = this.allIzuData.length; index < len; index++) {
        //             const it = this.allIzuData[index];
        //             size += (61 * it.dataArray.length) + 9;
        //             if (size > e.target.scrollTop) {
        //                 indexCompany = index;
        //                 break;
        //             }
        //         }
        //         // console.log(e.target.scrollTop)
        //         console.log('indexCompany: ', indexCompany);
        //         this.activeIndexCompany = indexCompany;
        //     }
        //     // console.log(e);
        // });
    }

    setActiveIndexCompany(idx: any, scrollable: any) {
        this.activeIndexCompany = idx;
        this.activeCompanyDetails = this.userService.appData.userData.companies
            .find(co => co.companyId === this.allIzuData[idx].companyId);
        if (scrollable) {
            this.setCompanyIndex = true;
            // let size = 0;
            // this.allIzuData.forEach((it, index)=>{
            //     if(index < idx){
            //         size += (61 * it.dataArray.length) + 9;
            //     }
            // })
            // requestAnimationFrame(() => {
            //     // scrollable.scrollToIndex(idx);
            //
            //     // scrollable.scrollTo({top: size});
            // });
            scrollable.scrollToElement('#' + this.allIzuData[idx].idRowGroup);
            setTimeout(() => {
                this.setCompanyIndex = false;
            }, 1000);
        }
    }

    setActiveCompanyFromTable(companyId: any, idRowGroup: any, scrollable: any) {
        const idx = this.allIzuData.findIndex(it => it.companyId === companyId);
        this.activeIndexCompany = idx;
        if (scrollable) {
            this.setCompanyIndex = true;
            scrollable.scrollToElement('#' + idRowGroup);
            setTimeout(() => {
                this.setCompanyIndex = false;
            }, 1000);
        }
    }

    setActiveCompany(company: any) {
        this.activeCompany = company;
        if (this.virtualScrollSaved) {
            this.virtualScrollSaved.scrollTo({top: 0});
        }
        this.activeCompanyDetails = this.userService.appData.userData.companies
            .find(co => co.companyId === this.activeCompany.companyId);
    }


    exportIzu(): void {
        this.loader = true;
        this.numFilterExport = false;
        this.currencyList = [];
        this.sharedService.exporterFolderState().subscribe((response: any) => {
            this.countStatusData = response ? response['body'] : response;
            this.sharedService.getCurrencyList().subscribe((responseCurr) => {
                this.currencyList = responseCurr ? responseCurr['body'] : responseCurr;
                this.sharedService.izuExport().subscribe((response: any) => {
                    const izu = response ? response['body'] : response;
                    this.izuSrc = [];
                    try {
                        if (!Array.isArray(izu)) {
                            this.izuSrc = [];
                        } else {
                            this.izuSrc = izu ? JSON.parse(JSON.stringify(izu)) : izu;
                        }
                    } catch (e) {
                        console.log(e);
                    }
                    for (const fd of this.izuSrc) {
                        // fd.dataReceiveDate = 1651467600000;
                        // fd.uploadSource = fd.uploadSource ? fd.uploadSource.toLowerCase() : fd.uploadSource;
                        // fd.noDataAvailable = typeof fd.invoiceDate !== 'number'
                        //     && typeof fd.totalIncludeMaam !== 'number'
                        //     && !fd.documentNum && !fd.documentType && !fd.name;
                        // fd.documentNum = fd.documentNum ? Number(fd.documentNum) : fd.documentNum;
                        // fd.asmachta = fd.asmachta !== null ? String(fd.asmachta) : fd.asmachta;
                        fd.authorized =
                            this.userService.appData.userData.companies.find(
                                companyFromUserData =>
                                    companyFromUserData.companyId === fd.companyId)?.['authorized'];
                        let lastAccBank = null;
                        for (const fdChild of fd.dataArray) {
                            if (!fdChild.currencyId) {
                                fdChild.currencyId = 1;
                            }
                            if (fdChild.currencyId) {
                                const sign = this.currencyList.find(
                                    (curr) => curr.id === fdChild.currencyId
                                );
                                fdChild.currencyString = sign ? sign.sign : null;
                                fdChild.currencyName = sign ? sign.name : null;
                            }
                            if (!fdChild.izuCustId) {
                                fdChild.izuCustId = 'לא משוייך כרטיס';
                                fdChild.izuCustPlaceHolder = 'לא משוייך כרטיס';
                            } else {
                                fdChild.izuCustPlaceHolder =
                                    fdChild.izuCustId
                                    + (fdChild.izuCustDesc ?
                                        (' - ' +
                                            fdChild.izuCustDesc) : '');
                            }
                            if (
                                fdChild.lastExportStatus === 'OK'
                            ) {
                                fdChild.lastExportStatusText = 'נתונים מעודכנים';
                            }
                            if (fdChild.lastExportStatus === 'WAIT_TO_EXPORT' || fdChild.lastExportStatus === 'READY_TO_IMPORT') {
                                fdChild.lastExportStatusText = 'נתונים זמינים לייצוא';
                            }

                            if (fdChild.lastExportStatus === 'FAIL') {
                                fdChild.lastExportStatusText = 'קיימת בעיה בקליטת הקובץ';
                            }
                            if (fdChild.lastExportStatus === 'IN_TEST') {
                                fdChild.lastExportStatusText = 'נתונים בהכנה';
                            }

                            if (this.userService.appData.isAdmin) {
                                if (fdChild.lastExportStatus === 'OTHER_SOURCE_DATA') {
                                    fdChild.lastExportStatusText = 'הוזנו נתונים ממקור אחר';
                                }
                                if (fdChild.lastExportStatus === 'TECHNICAL_PROBLEM') {
                                    fdChild.lastExportStatusText = 'יתרה לא תקינה';
                                }
                            } else {
                                if (fdChild.lastExportStatus === 'OTHER_SOURCE_DATA' || fdChild.lastExportStatus === 'TECHNICAL_PROBLEM') {
                                    fdChild.lastExportStatusText = 'יתרה לא תקינה';
                                }
                            }
                            if (fdChild.accountType !== 'BANK') {
                                const getAccData = fd.dataArray.find(it => it.accountType === 'BANK' && it.companyAccountId === fdChild.companyAccountId);
                                if (getAccData) {
                                    fdChild.accData = getAccData;
                                } else {
                                    const getAccDataAccId = fd.dataArray.find(it => it.accountType === 'BANK' && it.accountId === fdChild.accountId);
                                    if (getAccDataAccId) {
                                        fdChild.accData = getAccDataAccId;
                                    } else {
                                        fdChild.accData = lastAccBank;
                                    }
                                }
                            } else {
                                lastAccBank = fdChild;
                            }
                        }
                        fd.dataReceiveDateRed = !fd.dataReceiveDate ||
                            (fd.dataReceiveDate &&
                                this.userService.appData.moment().isAfter(fd.dataReceiveDate, 'day'));
                    }
                    if (this.izuSrc && this.izuSrc.length) {
                        const syncedAll = this.izuSrc.every(it => it.synced);
                        const syncedSome = !syncedAll ? (this.izuSrc.some(it => it.synced) ? this.izuSrc.filter(it => !it.synced) : false): false;
                        this.synced = syncedAll ? true : syncedSome;

                        this.allIsFolderPlus = this.izuSrc.every(it => it.folderPlus);
                        this.filterExportInput.enable();
                    } else {
                        this.filterExportInput.disable();
                    }
                    if (!this.activeCompany) {
                        this.filtersIzuAll(true);
                    } else {
                        this.filtersIzuAll(false, true);
                    }
                });
            });
        });
    }

    eventRightPos(event: any) {
        this.rightSideTooltip =
            window.innerWidth -
            (event.target.offsetLeft + event.target.offsetWidth) -
            33;
    }

    exportAllCompany() {
        const isWait = this.izuSrc.some(it => it.dataArray.some(itChild => itChild.lastExportStatus === 'WAIT_TO_EXPORT'));
        if (isWait) {
            if (!this.isSearch || (this.isSearch && this.paramsForExport && this.paramsForExport.updateAll)) {
                this.paramsForExport = false;
                const createExportData = this.izuSrc.map(it => {
                    return {
                        companyId: it.companyId,
                        accounts: it.dataArray
                            .filter((fd) => fd.companyAccountId && !fd.creditCardId)
                            .map((fc) => fc.companyAccountId),
                        credits: it.dataArray
                            .filter((fd) => fd.creditCardId)
                            .map((fc) => fc.creditCardId),
                        creditsMatah: it.dataArray
                            .filter((fd) => fd.creditCardMatahId)
                            .map((fc) => fc.creditCardMatahId)
                    };
                });
                const params = {
                    createExportData: createExportData
                };
                console.log('params', params);
                this.sharedService.exportCreate(params).subscribe((response: any) => {
                    this.reload();
                });
            } else {
                if (!this.paramsForExport) {
                    this.paramsForExport = {
                        updateAll: false
                    };
                } else {
                    this.paramsForExport = false;
                    const createExportData = this.allIzuData.map(it => {
                        return {
                            companyId: it.companyId,
                            accounts: it.dataArray
                                .filter((fd) => fd.companyAccountId && !fd.creditCardId)
                                .map((fc) => fc.companyAccountId),
                            credits: it.dataArray
                                .filter((fd) => fd.creditCardId)
                                .map((fc) => fc.creditCardId),
                            creditsMatah: it.dataArray
                                .filter((fd) => fd.creditCardMatahId)
                                .map((fc) => fc.creditCardMatahId)
                        };
                    });
                    const params = {
                        createExportData: createExportData
                    };
                    console.log('params', params);
                    this.sharedService.exportCreate(params).subscribe((response: any) => {
                        this.reload();
                    });
                }
            }

        } else {
            this.showModalNotAvailableExport = true;
        }


        // this.docsfile = null;
        // this.exportFileFolderCreatePrompt = false;
        //
        // this.sharedService.getOshtnuFiles().subscribe((response: any) => {
        //     this.docsfile = response ? Object.entries(response['body']) : response;
        //     if (this.docsfile.length > 1) {
        //         this.exportFileFolderCreatePrompt = true;
        //     } else {
        //         const a = document.createElement('a');
        //         a.target = '_parent';
        //         a.href = this.docsfile[0][1];
        //         (document.body || document.documentElement).appendChild(a);
        //         a.click();
        //         a.parentNode.removeChild(a);
        //     }
        // });
    }

    exportCompany(currentCompany: any) {
        console.log(currentCompany);
        if (currentCompany) {
            const params = {
                createExportData: [
                    {
                        companyId: currentCompany.companyId,
                        accounts: currentCompany.dataArray
                            .filter((fd) => fd.companyAccountId && !fd.creditCardId)
                            .map((fc) => fc.companyAccountId),
                        credits: currentCompany.dataArray
                            .filter((fd) => fd.creditCardId)
                            .map((fc) => fc.creditCardId),
                        creditsMatah: currentCompany.dataArray
                            .filter((fd) => fd.creditCardMatahId)
                            .map((fc) => fc.creditCardMatahId)
                    }
                ]
            };
            console.log('params', params);
            this.sharedService.exportCreate(params).subscribe((response: any) => {
            });
        }
    }

    checkIfStillHover(eve, elem) {
        fromEvent(elem, 'mouseleave').subscribe(
            (x) => {
                eve.hide();
                setTimeout(() => {
                    eve.hide();
                }, 10);
                // console.log('mouseleave!', eve);
            }
        );
    }

    onScrollCubes(i?: number): void {
        if (this.tooltipMoreDataRef && this.tooltipMoreDataRef['_results']) {
            this.tooltipMoreDataRef['_results'].forEach((it, idx) => {
                if (i !== undefined && idx !== i) {
                    it.hide();
                }
                if (i === undefined) {
                    it.hide();
                }
            });
        }
        if (this.tooltipEditRef && this.tooltipEditRef['_results']) {
            this.tooltipEditRef['_results'].forEach((it, idx) => {
                if (i !== undefined && idx !== i) {
                    it.hide();
                }
                if (i === undefined) {
                    it.hide();
                }
            });
        }

    }

    blurMainSection() {
        if (this.formDropdownsRef && this.formDropdownsRef['_results'] && this.formDropdownsRef['_results'].length) {
            this.formDropdownsRef['_results'].forEach((it, idx) => {
                if (it && it.hide) {
                    it.hide();
                }
            });
        }
        const className = document.getElementsByClassName('p-overlay');
        for (let index = 0; index < className.length; index++) {
            className[index].remove();
        }
    }

    filtersIzuAll(isFirstLoad?: boolean, setFirst?: boolean): void {
        if (this.formDropdownsRef && this.formDropdownsRef['_results'] && this.formDropdownsRef['_results'].length) {
            this.formDropdownsRef['_results'].forEach((it, idx) => {
                if (it && it.hide) {
                    it.hide();
                }
            });
        }
        const className = document.getElementsByClassName('p-overlay');
        for (let index = 0; index < className.length; index++) {
            className[index].remove();
        }
        const setCounterCompanies = setFirst || !this.numFilterExport;
        if (setCounterCompanies) {
            this.numFilterExport = false;
        }

        if (this.izuSrc && Array.isArray(this.izuSrc) && this.izuSrc.length) {
            if (setCounterCompanies) {
                this.numFilterExport = {
                    all: 0,
                    notUpdated: 0,
                    izuEmpty: 0,
                    linkItra: 0,
                    folderPlusIssue: 0
                };
            }

            this.izuFilter = !this.isSearch
                ? JSON.parse(JSON.stringify(this.izuSrc))
                : JSON.parse(JSON.stringify(this.izuSrc)).filter((fd: any) => {
                    const dataArray = fd.dataArray.filter((fdChild: any) => {
                        // balanceLastUpdateDate: 1608815102000
                        // bankId: 158
                        // companyAccountId: "b73674ad-47fa-54ec-e053-0b6519acc564"
                        // companyId: null
                        // creditCardId: null
                        // creditCardMatahId: null
                        // currencyId: null
                        // izuCustId: null
                        // izuEmpty: true
                        // lastExportDate: 1622447857000
                        // lastExportStatus: null
                        // lastExportTransDesc: null
                        // lastExportUserDesc: null
                        // linkItra: false
                        // nickname: "דיסקונט+ 1013647"
                        // notUpdated: true
                        // tokenStatus: "INPROGRESS"

                        return [
                            fdChild.nickname,
                            this.dtPipe.transform(
                                fdChild.balanceLastUpdateDate,
                                'dd/MM/yy'
                            ),
                            this.dtPipe.transform(fdChild.lastExportDate, 'dd/MM/yy'),
                            fdChild.tokenStatus,
                            fdChild.izuCustId,
                            fdChild.lastExportUserDesc,
                            fdChild.lastExportTransDesc,
                            fdChild.lastExportStatusText
                        ]
                            .filter(
                                (v) => (typeof v === 'string' || typeof v === 'number') && !!v
                            )
                            .some((vstr) =>
                                vstr
                                    .toString()
                                    .toUpperCase()
                                    .includes(this.queryExportString.toUpperCase())
                            );
                    });

                    // companyHp: 515973261
                    // companyId: "a8a7668a-2edf-4375-e053-650019acb2fd"
                    // companyName: "IU 119"
                    // dataReceiveDate: null
                    // dbName: "CLAIR2020"
                    // izuEmpty: true
                    // linkItra: false
                    // notUpdated: true
                    // sourceProgramId: 333

                    const isMatchMain = [
                        fd.companyHp,
                        fd.companyName,
                        this.dtPipe.transform(fd.dataReceiveDate, 'dd/MM/yy'),
                        fd.dbName,
                        fd.sourceProgramId
                    ]
                        .filter(
                            (v) => (typeof v === 'string' || typeof v === 'number') && !!v
                        )
                        .some((vstr) =>
                            vstr
                                .toString()
                                .toUpperCase()
                                .includes(this.queryExportString.toUpperCase())
                        );

                    if (isMatchMain || dataArray.length) {
                        if (dataArray.length) {
                            fd.dataArray = dataArray;
                        }
                        return true;
                    }
                    return false;
                });

            if (this.typeFilterExport !== 'all') {
                this.izuFilter = this.izuFilter.filter((fd: any) => {
                    const dataArray = fd.dataArray.filter((fdChild: any) => {
                        if (fdChild[this.typeFilterExport]) {
                            return true;
                        }
                        return false;
                    });

                    if (dataArray.length) {
                        fd.dataArray = dataArray;
                        return true;
                    }
                    return false;
                });
            }
            if (this.typeOfFlow !== 'all') {
                this.izuFilter = this.izuFilter.filter((fd: any) => {
                    const dataArray = fd.dataArray.filter((fdChild: any) => {
                        if ((this.typeOfFlow === 'credit' && (fdChild.creditCardId || fdChild.creditCardMatahId)) || (this.typeOfFlow === 'bank' && (!fdChild.creditCardId && !fdChild.creditCardMatahId))) {
                            return true;
                        }

                        return false;
                    });
                    fd.dataArray = dataArray;
                    return dataArray.length;
                });
            }
            if (setCounterCompanies) {
                this.izuFilter.forEach((fd) => {
                    const numFilterExportCompany = {
                        notUpdated: 0,
                        linkItra: 0,
                        izuEmpty: 0,
                        folderPlusIssue: 0
                    };
                    fd['idRow'] = crypto['randomUUID']();
                    fd['idRowGroup'] = 'id_' + fd.companyId.replace(/-/g, '');
                    fd['title'] = fd.companyName + ' ' + fd.companyHp;

                    fd.dataArray.forEach((fdChild) => {
                        fdChild['idRow'] = crypto['randomUUID']();
                        if (fdChild.notUpdated) {
                            numFilterExportCompany.notUpdated += 1;
                        }
                        if (fdChild.linkItra) {
                            numFilterExportCompany.linkItra += 1;
                        }
                        if (fdChild.izuEmpty) {
                            numFilterExportCompany.izuEmpty += 1;
                        }
                        if (fdChild.folderPlusIssue) {
                            numFilterExportCompany.folderPlusIssue += 1;
                        }
                    });
                    if (numFilterExportCompany.notUpdated > 0) {
                        this.numFilterExport.notUpdated += 1;
                    }
                    if (numFilterExportCompany.linkItra > 0) {
                        this.numFilterExport.linkItra += 1;
                    }
                    if (numFilterExportCompany.izuEmpty > 0) {
                        this.numFilterExport.izuEmpty += 1;
                    }
                    if (numFilterExportCompany.folderPlusIssue > 0) {
                        this.numFilterExport.folderPlusIssue += 1;
                    }
                    // izuEmpty: true
                    // linkItra: false
                    // notUpdated: true
                });
                this.numFilterExport.all = this.izuFilter.length;
            }
        } else {
            this.izuFilter = [];
        }


        // let allIzuData = [];
        // this.izuFilter.forEach((it, idxs) => {
        //     if (this.queryExportString || isFirstLoad) {
        //         it.showChildren = true;
        //     }
        //     const parentObj = JSON.parse(JSON.stringify(it));
        //     parentObj.idx = idxs;
        //     allIzuData.push(
        //         Object.assign(JSON.parse(JSON.stringify(parentObj)), {
        //             dataArray: null
        //         })
        //     );
        //     if (!parentObj.showChildren) {
        //         parentObj.dataArray = [];
        //     } else {
        //         parentObj.dataArray.forEach((it1, idx1) => {
        //             it1.idxParent = idxs;
        //             it1.idx = idx1;
        //         });
        //     }
        //     allIzuData = allIzuData.concat(parentObj.dataArray);
        // });
        // allIzuData.forEach(fdChild => {
        //     fdChild['idRow'] = crypto['randomUUID']();
        // });
        this.allIzuData = this.izuFilter;
        if (this.isSearch) {
            this.buildData(this.allIzuData.length);
        }
        if (setFirst && this.activeCompany) {
            const isExist = this.allIzuData.find(it => it.companyId === this.activeCompany.companyId);
            if (isExist) {
                this.activeCompany = isExist;
            } else {
                this.activeCompany = this.allIzuData[0];
            }
            if (!this.isSearch && this.virtualScrollSaved) {
                this.virtualScrollSaved.scrollTo({top: 0});
            }
        }
        if (!this.activeCompany || isFirstLoad) {
            if (this.allIzuData.length) {
                this.activeCompany = this.allIzuData[0];
            } else {
                this.activeCompany = null;
            }
            if (!this.isSearch && this.virtualScrollSaved) {
                this.virtualScrollSaved.scrollTo({top: 0});
            }
        }
        if (this.activeCompany) {
            this.activeCompanyDetails = this.userService.appData.userData.companies
                .find(co => co.companyId === this.activeCompany.companyId);
        }
        console.log(this.allIzuData);
        this.loader = false;
    }

    formatPhone(phone: string): string {
        if (!phone) {
            return '';
        }
        if (phone.length === 10) {
            return phone.slice(0, 3) + '-' + phone.slice(3);
        } else {
            return phone.slice(0, 2) + '-' + phone.slice(2);
        }
    }


    toggleExpandedForAllTo(open: any) {
        let allIzuData = [];
        this.izuFilter.forEach((it, idxs) => {
            it.showChildren = open;
            const parentObj = JSON.parse(JSON.stringify(it));
            parentObj.idx = idxs;
            allIzuData.push(
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {
                    dataArray: null
                })
            );

            if (!open) {
                parentObj.dataArray = [];
            } else {
                parentObj.dataArray.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = idx1;
                });
            }
            allIzuData = allIzuData.concat(parentObj.dataArray);
        });
        this.allIzuData = allIzuData;
        console.log(allIzuData);
    }

    colsAct(parent, idx): void {
        parent.showChildren = !parent.showChildren;
        this.izuSrc[idx].showChildren = parent.showChildren;
        console.log('parent.showChildren', parent.showChildren);
        let allIzuData = [];
        this.izuFilter.forEach((it, idxs) => {
            const parentObj = JSON.parse(JSON.stringify(it));
            parentObj.idx = idxs;
            allIzuData.push(
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {
                    dataArray: null
                })
            );

            if (!parentObj.showChildren) {
                parentObj.dataArray = [];
            } else {
                parentObj.dataArray.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = idx1;
                });
            }
            allIzuData = allIzuData.concat(parentObj.dataArray);
        });
        this.allIzuData = allIzuData;
        console.log(allIzuData);
    }


    ngAfterViewInit(): void {
        console.log('ngAfterViewInit');
    }

    getItemSize(item) {
        return 33;
    }

    trackById(index: number, val: any): any {
        // let ids: any;
        // if ((val.companyAccountId || val.creditCardId || val.creditCardMatahId)) {
        //     ids = (val.companyAccountId || val.creditCardId || val.creditCardMatahId) + '_' + index;
        // } else {
        //     if (val.companyId) {
        //         ids = val.companyId + '_' + index;
        //     } else {
        //         ids = '_' + index;
        //     }
        // }
        // // console.log(ids)
        return val.idRow;
    }
    trackByCompanyId(index: number, val: any): any {
        return val.companyId;
    }
    trackByUniqueId(index: number, val: any): any {
        return val.uniqueId + '_' + index;
    }

    paginate(event) {
        this.entryLimit = Number(event.rows);
        this.currentPage = event.page;
    }

    clear() {
        this.items = [];
    }

    onRightClick(event: any) {
        return false;
    }

    onRightClickInside(event: any) {
        const currentTarget = event.currentTarget;
        this.eventRclickUpload = currentTarget;
        this.eventRclickUpload.layerY = currentTarget.offsetTop;
        this.eventRclickUpload.layerX = currentTarget.offsetLeft;
    }

    public onKeydownMain(event: any, file: any, idx: number): void {
        if (!event.shiftKey) {
            event.preventDefault();
            if (event.ctrlKey || event.metaKey) {
                file.selcetFile = !file.selcetFile;
            } else {
                file.selcetFile = !file.selcetFile;
                this.files.forEach((fd, index) => {
                    if (fd.selcetFile && index !== idx) {
                        fd.selcetFile = false;
                    }
                });
            }
        }
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
        const item = this.files[this.draggedIndex];
        this.files.splice(this.draggedIndex, 1);
        this.files.splice(droppedIndex, 0, item);
        this.draggedIndex = -1;
        this.onDragOverIndex = -1;
        // console.log(this.files);
    }

    showDocumentStorageDataViewAsGrid(src: string, isPdf: boolean, isNgSrc?: any): void {
        this.showDocumentStorageDataFired = true;
        this.timeFireHover = false;
        this.isPdf = isPdf;
        this.isNgSrc = isNgSrc !== false;
        this.sidebarImgs = src;
    }

    hideDocumentStorageData(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentStorageDataFired = false;
        this.sidebarImgs = false;
        console.log('hideDocumentStorageData');
    }

    fileScanViewOpen(file: any): void {
        this.fileScanView = file;
    }

    goToInvoiceLocal(file: any) {
        const fileViewer = this.fileViewerSaved;
        if (fileViewer === 'ARCHIVE') {
            this.userService.appData.savedUploadFile = {
                file: file,
                folderId: this.folderSelect.folderId
            };
        }
        if (this.uploadFilesOcrPopUp && this.uploadFilesOcrPopUp.visible) {
            this.files = [];
            this.filesBeforeOrder = [];
            this.filesOriginal = [];
            this.fileDropRef.nativeElement.type = 'text';
            setTimeout(() => {
                if (this.fileDropRef && this.fileDropRef.nativeElement) {
                    this.fileDropRef.nativeElement.type = 'file';
                }
            }, 200);
            this.progress = false;
            this.fileViewer = false;
            this.fileViewerSaved = false;
            this.fileUploadProgress = false;
            this.folderSelect = false;
            this.files = [];
            this.progress = false;
            this.uploadFilesOcrPopUp = {
                visible: false,
                urlsFiles: {
                    links: []
                }
            };
        }
        if (fileViewer === 'ARCHIVE') {
            this.router.navigate(['/accountants/companies/archives'], {
                queryParamsHandling: 'preserve',
                relativeTo: this.route
            });
        } else {
            this.storageService.sessionStorageSetter(
                'accountants-doc-open',
                JSON.stringify(file)
            );
            this.sharedComponent.selectCompanyParam(
                this.companySelect,
                'journalTrans/suppliersAndCustomers'
            );
        }
    }

    resetAndReturnToMainUploadScreen(isCloseBtn?: boolean) {
        if (!isCloseBtn) {
            if (
                !this.fileUploadProgress &&
                this.scanFilesOcrPopUp &&
                this.scanFilesOcrPopUp.visible
            ) {
                this.stopped = false;
                this.fileViewer = false;
                this.showProgressScan = false;
                this.scanerList = [];
                this.selectedScan = null;
                this.index = 0;
                this.files = [];
                this.filesBeforeOrder = [];
                this.filesOriginal = [];
                this.progress = false;
                this.scanFilesOcrPopUp.urlsFiles = {
                    links: []
                };
                this.unload();
            } else {
                if (this.uploadFilesOcrPopUp && this.uploadFilesOcrPopUp.visible) {
                    this.files = [];
                    this.filesBeforeOrder = [];
                    this.filesOriginal = [];
                    this.fileDropRef.nativeElement.type = 'text';
                    setTimeout(() => {
                        if (this.fileDropRef && this.fileDropRef.nativeElement) {
                            this.fileDropRef.nativeElement.type = 'file';
                        }
                    }, 200);
                    this.progress = false;
                    this.fileViewer = false;
                    this.fileUploadProgress = false;
                    this.folderSelect = false;
                    this.files = [];
                    this.progress = false;
                    this.uploadFilesOcrPopUp = {
                        visible: false,
                        urlsFiles: {
                            links: []
                        }
                    };
                } else {
                    if (this.filesBeforeOrder && this.filesBeforeOrder.length) {
                        this.files = this.filesBeforeOrder;
                    }
                    this.fileViewer = false;
                }
            }
        } else {
            if (this.filesBeforeOrder && this.filesBeforeOrder.length) {
                this.files = this.filesBeforeOrder;
            }
            this.fileViewer = false;
        }
    }


    uploadFilesOcr(company: any): void {
        this.companySelect = company;
        if (this.fileDropRef && this.fileDropRef.nativeElement) {
            this.fileDropRef.nativeElement.type = 'text';
            setTimeout(() => {
                if (this.fileDropRef && this.fileDropRef.nativeElement) {
                    this.fileDropRef.nativeElement.type = 'file';
                }
            }, 200);
        }
        this.progress = false;
        this.fileViewer = false;
        this.fileUploadProgress = false;
        this.filesBeforeOrder = [];
        this.filesOriginal = [];
        this.files = [];
        this.folderSelect = false;
        this.uploadFilesOcrPopUp = {
            visible: true,
            urlsFiles: {
                links: []
            }
        };
    }

    loadScanFilesOcr(company: any): void {
        this.companySelect = company;
        this.filesBeforeOrder = [];
        this.filesOriginal = [];
        this.stopped = false;
        this.fileViewer = false;
        this.showProgressScan = false;
        this.scanerList = [];
        this.selectedScan = null;
        this.index = 0;
        this.files = [];
        this.progress = false;
        this.scanFilesOcrPopUp = {
            visible: true,
            urlsFiles: {
                links: []
            }
        };
        window['OnWebTwainPreExecuteCallback'] = function () {
        };
        window['OnWebTwainPostExecuteCallback'] = function () {
        };
        window['promptDlgWidth'] = 460;
        window['_show_install_dialog'] = function (
            ProductName,
            objInstallerUrl,
            bHTML5,
            iPlatform,
            bIE,
            bSafari,
            bSSL,
            strIEVersion
        ) {
            let ObjString;

            ObjString = [
                '<div class="header-scanPopUpInstall">' +
                '<h1> זיהוי סורקים </h1>' +
                '<span class="fa fa-fw fa-times" onclick="Dynamsoft.WebTwainEnv.CloseDialog()">&nbsp;</span>' +
                '</div>'
            ];
            ObjString.push(
                '<div style="display: flex;justify-content: center;align-items: center;margin: 15px 20px 0px 20px;"><a id="dwt-btn-install" style="display: inline-block;" target="_blank" href="'
            );
            let url = '';
            if (iPlatform === Dynamsoft.EnumDWT_PlatformType.enumWindow) {
                url = '/assets/files/resources/dist/DynamsoftServiceSetup.msi';
            } else if (iPlatform === Dynamsoft.EnumDWT_PlatformType.enumMac) {
                url = '/assets/files/resources/dist/DynamsoftServiceSetup.pkg';
            } else if (iPlatform === Dynamsoft.EnumDWT_PlatformType.enumLinux) {
                url = '/assets/files/resources/dist/DynamsoftServiceSetup.deb';
            }
            ObjString.push(url);
            setTimeout(() => {
                const a: HTMLAnchorElement = document.createElement(
                    'a'
                ) as HTMLAnchorElement;
                a.href = url;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window['reconnectTime'] = new Date();
                setTimeout(window['DWT_Reconnect'], 10);
            }, 300);
            ObjString.push('"');
            if (bHTML5) {
                ObjString.push(' html5="1"');
            } else {
                ObjString.push(' html5="0"');
            }
            ObjString.push(' >');
            ObjString.push(
                '<svg style="fill: #022258;height: 44px;width: auto;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><g id="Download"><path d="M464,96H304V64a8,8,0,0,0-8-8H216a8,8,0,0,0-8,8V96H48A40.045,40.045,0,0,0,8,136V360a40.045,40.045,0,0,0,40,40H181.754l-4,16H144a8,8,0,0,0-8,8v24a8,8,0,0,0,8,8H368a8,8,0,0,0,8-8V424a8,8,0,0,0-8-8H334.246l-4-16H464a40.045,40.045,0,0,0,40-40V136A40.045,40.045,0,0,0,464,96ZM224,168V72h64v96a8,8,0,0,0,8,8h14.037L256,236.041,201.963,176H216A8,8,0,0,0,224,168ZM24,136a24.027,24.027,0,0,1,24-24H208v48H184a8,8,0,0,0-5.946,13.352l72,80a8,8,0,0,0,11.892,0l72-80A8,8,0,0,0,328,160H304V112H464a24.027,24.027,0,0,1,24,24V336H24ZM360,440H152v-8H360Zm-42.246-24H194.246l4-16H313.754ZM488,360a24.027,24.027,0,0,1-24,24H48a24.027,24.027,0,0,1-24-24v-8H488Z"/><path d="M48,376H88a8,8,0,0,0,0-16H48a8,8,0,0,0,0,16Z"/><path d="M112,376h8a8,8,0,0,0,0-16h-8a8,8,0,0,0,0,16Z"/><path d="M352,272H160a8,8,0,0,0-8,8v32a8,8,0,0,0,8,8H352a8,8,0,0,0,8-8V280A8,8,0,0,0,352,272Zm-8,32H168V288H344Z"/></g></svg>'
            );
            ObjString.push('</a></div>');

            ObjString.push(
                '<div class="scanPopUpInstall-text">' +
                'כדי להתחיל לסרוק ישירות מהסורק שבמשרדך ל- bizibox' +
                '<br>' +
                'נבצע תהליך התקנה חד פעמי של תוכנה לזיהוי סורקים.' +
                '<strong>' +
                'ההורדה מתבצעת אוטומטית,' +
                '<br>' +
                'בסיומה יש לבצע את ההתקנה במחשב.' +
                '</strong></div>'
            );

            if (bHTML5) {
                if (bIE) {
                    ObjString.push(
                        '<div class="dynamsoft-dwt-dlg-tail" style="text-align:right; padding-right: 80px">'
                    );
                    ObjString.push(
                        '1. יש להוסיף את האתר לרשימת האתרים הבטוחים שנמצא במיקום הבא:<br />'
                    );
                    ObjString.push(
                        'IE | Tools | Internet Options | Security | Trusted Sites.<br />'
                    );
                    ObjString.push('2. לאחר מכן, יש לרענן את חלונית הדפדפן');
                    ObjString.push('</div>');
                }
            } else {
                ObjString.push(
                    '<div class="dynamsoft-dwt-dlg-tail" style="text-align:right; padding-right: 80px">'
                );
                if (bIE) {
                    ObjString.push('לאחר ההתקנה יש לבצע את הפעולות הבאות:<br />');
                    ObjString.push('1. אתחלו (Restart) את הדפדפן מחדש<br />');
                    ObjString.push(
                        '2.  אפשרו ל-"DynamicWebTWAIN" לרוץ בדפדפן ע״י לחיצה על הסרגל העליון בדפדפן.'
                    );
                } else {
                    ObjString.push(
                        '<div class="dynamsoft-dwt-dlg-red">לאחר ההתקנה יש <strong>לרענן</strong> את חלונית הדפדפן.</div>'
                    );
                }
                ObjString.push('</div>');
            }

            // @ts-ignore
            Dynamsoft.WebTwainEnv.ShowDialog(
                window['promptDlgWidth'],
                0,
                ObjString.join('')
            );
        };
        window['DCP_DWT_onclickInstallButton'] = function (evt) {
            const btnInstall = document.getElementById('dwt-btn-install');
            if (btnInstall) {
                setTimeout(function () {
                    const install = document.getElementById('dwt-install-url-div');
                    if (install) {
                        install.style.display = 'none';
                    }

                    const el = document.getElementById('dwt-btn-install');
                    if (el && el.getAttribute('html5') === '1') {
                        const pel = el.parentNode;
                        const newDiv = document.createElement('div');

                        newDiv.id = 'dwt-btn-install';
                        newDiv.className = 'dwt-btn-install-try-connect';
                        newDiv.style.textAlign = 'center';
                        newDiv.style.paddingBottom = '15px';
                        newDiv.innerHTML = 'מנסה להתחבר לתוכנה...';
                        newDiv.setAttribute('html5', '1');

                        pel.removeChild(el);
                        pel.appendChild(newDiv);
                        window['reconnectTime'] = new Date();
                        setTimeout(window['DWT_Reconnect'], 10);
                    } else {
                        const pel = el.parentNode;
                        pel.removeChild(el);
                    }
                }, 10);
            }
            return true;
        };
        window['DWT_Reconnect'] = function () {
            // @ts-ignore
            if ((new Date() - window['reconnectTime']) / 1000 > 30) {
                return;
            }
            Dynamsoft.WebTwainEnv['CheckConnectToTheService'](
                function () {
                    Dynamsoft.WebTwainEnv['ConnectToTheService']();
                },
                function () {
                    setTimeout(window['DWT_Reconnect'], 1000);
                }
            );
        };
        Dynamsoft.WebTwainEnv.Load();
    }

    unload() {
        console.log('unload');
        if (this.arr.length > 1) {
            this.arr.forEach((elem) => {
                if (
                    elem.DWObject &&
                    elem.DWObject.config.containerID !== 'dwtcontrolContainer'
                ) {
                    Dynamsoft.WebTwainEnv.DeleteDWTObject(
                        elem.DWObject.config.containerID
                    );
                }
            });
            this.arr.splice(1);
        }
        if (this.arr.length && this.arr[0] && this.arr[0].DWObject) {
            this.arr[0].DWObject = null;
        }
        this.arr = [
            {
                DWObject: null
            }
        ];
        this.Dynamsoft_OnReady();
        this.finishedScan = false;
        this.selectedScan = null;
        this.files = [];
        this.stopped = false;
        this.scanerList = [];
        this.showProgressScan = false;
        this.showScanLoader = false;
        this.fileViewer = false;
        Dynamsoft.WebTwainEnv.Unload();
        location.reload();
    }

    refreshScanList(): void {
        if (this.arr && this.arr.length && this.arr[0].DWObject) {
            this.scanerList = [];
            const count = this.arr[0].DWObject.SourceCount;
            for (let i = 0; i < count; i++) {
                this.scanerList.push({
                    name: this.arr[0].DWObject.GetSourceNameItems(i)
                });
            }
            if (this.selectedScan) {
                const getIdxSelected = this.scanerList.findIndex(
                    (fd) => fd.name === this.selectedScan.name
                );
                if (getIdxSelected !== -1) {
                    this.selectedScan = this.scanerList[getIdxSelected];
                } else {
                    this.selectedScan = this.scanerList[0];
                }
            } else {
                this.selectedScan = this.scanerList[0];
            }
        }
        if (!this.scanerList.length) {
            this.errorString = {
                errorCode: null,
                errorString:
                    'לא זוהו סורקים. באפשרותך לבצע סריקה חוזרת ע״י לחיצה על סימון ⟲',
                response: ''
            };
        }
    }

    Dynamsoft_OnReady() {
        console.log('Dynamsoft_OnReady');
        this.dynamsoftReady = true;
        this.scanerList = [];

        Dynamsoft.WebTwainEnv.CreateDWTObjectEx(
            {
                WebTwainId: 'dwtcontrolContainer'
            },
            (newDWObject) => {
                this.arr[this.index].DWObject = newDWObject;
                if (this.arr[this.index].DWObject) {
                    console.log('DWObject----', this.arr[this.index].DWObject);
                    this.scanerList = [];
                    const count = this.arr[0].DWObject.SourceCount;
                    for (let i = 0; i < count; i++) {
                        this.scanerList.push({
                            name: this.arr[0].DWObject.GetSourceNameItems(i)
                        });
                    }
                    if (this.selectedScan) {
                        const getIdxSelected = this.scanerList.findIndex(
                            (fd) => fd.name === this.selectedScan.name
                        );
                        if (getIdxSelected !== -1) {
                            this.selectedScan = this.scanerList[getIdxSelected];
                        } else {
                            this.selectedScan = this.scanerList[0];
                        }
                    } else {
                        this.selectedScan = this.scanerList[0];
                    }

                    setTimeout(() => {
                        if (
                            !this.scanerList.length &&
                            this.scanFilesOcrPopUp &&
                            this.scanFilesOcrPopUp.visible
                        ) {
                            this.refreshScanList();
                        }
                    }, 2000);
                }
            },
            (errorString) => {
                console.log(errorString);
            }
        );
    }

    RotateLeft(idx, idxImg, id) {
        if (this.arr[idx].DWObject) {
            if (this.arr[idx].DWObject.HowManyImagesInBuffer > 0) {
                this.arr[idx].DWObject.RotateLeft(idxImg);
                const thisFile = this.files.find((fd) => fd.id === id);
                if (thisFile) {
                    thisFile.src += '?' + Math.random();
                }
            }
        }
    }

    RotateRight(idx, idxImg, id) {
        if (this.arr[idx].DWObject) {
            if (this.arr[idx].DWObject.HowManyImagesInBuffer > 0) {
                this.arr[idx].DWObject.RotateRight(idxImg);
                const thisFile = this.files.find((fd) => fd.id === id);
                if (thisFile) {
                    thisFile.src += '?' + Math.random();
                }
            }
        }
    }

    Mirror(idx, idxImg, id) {
        if (this.arr[idx].DWObject) {
            if (this.arr[idx].DWObject.HowManyImagesInBuffer > 0) {
                this.arr[idx].DWObject.Mirror(idxImg);
                const thisFile = this.files.find((fd) => fd.id === id);
                if (thisFile) {
                    thisFile.src += '?' + Math.random();
                }
            }
        }
    }

    Flip(idx, idxImg, id) {
        if (this.arr[idx].DWObject) {
            if (this.arr[idx].DWObject.HowManyImagesInBuffer > 0) {
                this.arr[idx].DWObject.Flip(idxImg);
                const thisFile = this.files.find((fd) => fd.id === id);
                if (thisFile) {
                    thisFile.src += '?' + Math.random();
                }
            }
        }
    }

    funcScanStatus = (status) => {
        if (!this.stopped) {
            console.log('not stop funcScanStatus');
            if (status.event === 'beforeAcquire') {
                if (!this.errorString && this.showScanLoader) {
                    this.showScanLoader = false;
                    this.showProgressScan = status;
                }
            } else if (status.event === 'postTransfer' && !status.bScanCompleted) {
                if (
                    status.result.currentPageNum !== this.showProgressScan.currentPageNum
                ) {
                    this.showScanLoader = false;
                    this.showProgressScan = status;
                }
            } else if (status.event === 'postTransfer' && status.bScanCompleted) {
                this.showProgressScan = status;
            }
        }

        console.log('----funcScanStatus---- ', status);
    };

    stopScan() {
        this.stopped = true;
        this.showScanLoader = false;
        this.showProgressScan = false;
        if (this.arr[this.index] && this.arr[this.index].DWObject) {
            if (
                this.arr[this.index].DWObject.config.containerID !==
                'dwtcontrolContainer'
            ) {
                Dynamsoft.WebTwainEnv.DeleteDWTObject(
                    this.arr[this.index].DWObject.config.containerID
                );
                this.arr.splice(this.index, 1);
            }
        }
        this.refreshScanList();
    }

    scan() {
        this.scanStatusProgress = null;
        this.arr[this.index].DWObject.startScan({
            // setupId: "", // An id that specifies this specific setup.
            exception: 'fail', // "ignore" or “fail”
            scanner: this.selectedScan.name,
            ui: {
                bShowUI: false
            },
            // transferMode: EnumDWT_TransferMode.TWSX_NATIVE, //file, memory, native
            // insertingIndex: 3,
            // profile: "",
            //base64String, if not empty, it overrides settings and more settings.
            settings: {
                exception: 'fail', // "ignore" (default) or "fail",
                pixelType: Dynamsoft.EnumDWT_PixelType.TWPT_RGB, //rgb, bw, gray, etc
                resolution: 200, // 300
                bFeeder: true,
                bDuplex: false //whether to enable duplex
            },
            moreSettings: {
                exception: 'fail', // "ignore" or “fail”
                // bitDepth: 24, //1,8,24,etc
                pageSize: Dynamsoft.EnumDWT_CapSupportedSizes.TWSS_A4, //A4, etc.
                unit: Dynamsoft.EnumDWT_UnitType.TWUN_INCHES
                // layout: {
                //     left: float,
                //     top: float,
                //     right: float,
                //     bottom: float
                // }, //Optional. If specified, it'll override pageSize
                // pixelFlavor: EnumDWT_CapPixelFlavor.TWPF_CHOCOLATE,
                //TWPF_CHOCOLATE (0) or TWPF_VANILLA (1)
                // brightness: 0,
                // contrast: 0,
                // nXferCount: -1,
                // //Number of pages to transfer per scan
                // autoDiscardBlankPages: true,//Device dependent
                // autoBorderDetection: true,//Device dependent
                // autoDeskew: true,//Device dependent
                // autoBright: true //Device dependent
            },
            funcScanStatus: this.funcScanStatus
            //funcScanStatus is triggered before the scan, after each page is transferrer
            // and after the scan completes. status is a JSON object that has the following structure
            //{ bScanCompleted: false,
            //  event: "postTransfer"
            //  result: {currentPageNum: 2}
            //}
            // outputSetup : {
            //     type: "http",
            //     // http is the only supported type in v15.0
            //     format: EnumDWT_ImageType.IT_PDF,
            //     // Specify the output file type
            //     reTries: 3,
            //     // Specify the number of times to try the upload before it succeeds
            //     useUploader: false,
            //     //Whether to use the File Uploader module
            //     singlePost: true,
            //     //Whether to upload all data in one or multiple posts
            //     showProgressBar: true,
            //     //Whether to show the progress bar when uploading
            //     removeAfterOutput: true,
            //     //Whether to remove the images after the upload is done
            //     funcHttpUploadStatus:funcHttpUploadStatus(fileInfo),
            //     //fileInfo is a JSON object that has info like
            //     //fileName, percentage, statusCode, responseString.
            //     pdfSetup: {// Specify how the PDF file is created.
            //         author: 'tom',
            //         compression: EnumDWT_PDFCompressionType,
            //         creator: 'dwt',
            //         creationDate: 'D:20181231',
            //         keyWords: 'dwt',
            //         modifiedDate: 'D:20181231',
            //         producer: 'dynamsoft',
            //         subject: 'blah',
            //         title: 'dwt',
            //         version: 1.4,
            //         quality: 80 //only for JPEG compression
            //     },
            //     httpParams: {
            //         url: "http://dynamsoft.com/receivepost.aspx",
            //         // Specify the URL to post to
            //         headers: {},
            //         // Headers to be added in the post request
            //         formFields: {},
            //         // Extra form fileds to be added in the post
            //         maxSizeLimit: 100000,
            //         // Set a limit on how big a file is allowed to be uploaded (bytes)
            //         threads: 4,
            //         // Specifies how many threads are to be used for the upload
            //         remoteName:"RemoteName<%06d>",
            //         // Specifies the names for the files (streams) in the form
            //         fileName: "uploadedFile<%06d>.jpg"
            //         // Specifies the names for the uploaded files
            //     }
            // }
        })
            .then((scanSetup) => {
                console.log('-------scanSetup------', scanSetup);
                console.log('DWObject----', this.arr[this.index].DWObject);
                if (this.stopped) {
                    this.showProgressScan = false;
                    this.stopped = false;
                    return;
                }
                setTimeout(() => {
                    this.showProgressScan = false;
                }, 800);
                this.showScanLoader = false;

                const mapServerId =
                    this.arr[this.index].DWObject._ImgManager._UIView
                        .mapModelImageControl;
                Object.keys(mapServerId).forEach((item, indexFor) => {
                    const currentImageIndexInBuffer =
                        this.arr[this.index].DWObject.CurrentImageIndexInBuffer;
                    const it = mapServerId[item];
                    console.log(currentImageIndexInBuffer, it);
                    this.files.push({
                        index: this.index,
                        id: it.ticks,
                        idxImg: it.index,
                        src: it.imageUrl,
                        selcetFile: false,
                        type: 'image/png',
                        name: 'img' + it.ticks + '_' + it.serverId + '.png'
                    });
                    this.filesBeforeOrder.push({
                        index: this.index,
                        id: it.ticks,
                        idxImg: it.index,
                        src: it.imageUrl,
                        selcetFile: false,
                        type: 'image/png',
                        name: 'img' + it.ticks + '_' + it.serverId + '.png'
                    });
                });

                // console.log('this.files', this.files);
                // window.open(url, '_blank');
                this.index += 1;
                this.refreshScanList();
            })
            .catch((errorObject) => {
                console.log('-------errorObject------', errorObject);
                this.showProgressScan = false;
                this.showScanLoader = false;
                if (this.stopped) {
                    this.stopped = false;
                    return;
                }

                if (this.arr[this.index] && this.arr[this.index].DWObject) {
                    console.log(this.arr[this.index].DWObject.config);
                    if (
                        this.arr[this.index].DWObject.config.containerID !==
                        'dwtcontrolContainer'
                    ) {
                        Dynamsoft.WebTwainEnv.DeleteDWTObject(
                            this.arr[this.index].DWObject.config.containerID
                        );
                        this.arr.splice(this.index, 1);
                    }
                }
                this.refreshScanList();

                if (
                    errorObject.errorCode === -2129 ||
                    errorObject.errorCode === -1029
                ) {
                    errorObject.errorString =
                        'לא זוהו מסמכים במגש הסורק. אנא הכנס את המסמך למגש הסורק והתחל את הסריקה שוב.';
                    errorObject.errorCode = null;
                } else if (errorObject.errorCode === -1003) {
                    errorObject.errorString =
                        'לא הצלחנו להשיג גישה אל הסורק שנבחר, בדקו את חיבור הרשת למחשב ולסורק, חברו את הסורק ולחצו על סימון ⟲ לרענון הסורקים.';
                    errorObject.errorCode = null;
                } else if (errorObject.errorCode === -2308) {
                    let url = '';
                    if (Dynamsoft.Lib.env.bWin) {
                        url = '/assets/files/resources/dist/DynamsoftServiceSetup.msi';
                    } else if (Dynamsoft.Lib.env.bMac) {
                        url = '/assets/files/resources/dist/DynamsoftServiceSetup.pkg';
                    } else if (Dynamsoft.Lib.env.bLinux) {
                        url = '/assets/files/resources/dist/DynamsoftServiceSetup.deb';
                    }
                    errorObject.errorString =
                        'לא הצלחנו להשיג גישה אל הסורק שנבחר מכיוון שהתוכנה הוסרה. <a href="' +
                        url +
                        '" target="_blank">התקינו את התוכנה שנית.</a>';
                    errorObject.errorCode = null;
                } else {
                    errorObject.errorString = 'הסריקה לא הצליחה, אנא בדקו את הסורק';
                }
                this.errorString = errorObject;
            });
    }

    AcquireImage() {
        this.showScanLoader = true;
        if (!this.arr[this.index]) {
            this.arr.push({
                DWObject: null
            });
            Dynamsoft.WebTwainEnv.CreateDWTObjectEx(
                {
                    WebTwainId: 'dwtcontrolContainer' + this.index
                },
                (newDWObject) => {
                    this.arr[this.index].DWObject = newDWObject;
                    this.scan();
                },
                (errorString) => {
                    console.log(errorString);
                }
            );
        } else {
            this.scan();
        }
    }

    onFileDropped($event) {
        $event = Array.from($event);
        $event = $event.filter((item) =>
            [
                'image/bmp',
                'image/jpg',
                'image/jpeg',
                'image/png',
                'image/tif',
                'image/tiff',
                'application/pdf',
                '.tif'
            ].includes(item.type)
        );
        if ($event.length) {
            this.prepareFilesList($event);
        }
    }

    fileBrowseHandler(files) {
        files = files.files;
        files = Array.from(files);
        files = files.filter((item) =>
            [
                'image/bmp',
                'image/jpg',
                'image/jpeg',
                'image/png',
                'image/tif',
                'image/tiff',
                'application/pdf',
                '.tif'
            ].includes(item.type)
        );
        if (files.length) {
            this.prepareFilesList(files);
        }
    }

    deleteFile(index: number) {
        const newFileList = Array.from(this.fileDropRef.nativeElement.files);
        newFileList.splice(index, 1);
        const idFileToDelete = this.files[index].id ? this.files[index].id : null;
        this.files.splice(index, 1);
        this.files.forEach((fd, idx) => {
            if (fd.selcetFile) {
                newFileList.splice(idx, 1);
            }
        });
        this.files = this.files.filter((fd) => !fd.selcetFile);
        if (this.keepOriginFiles) {
            if (idFileToDelete) {
                const lenOfSameId = this.files.filter(
                    (fd) => fd.id && fd.id === idFileToDelete
                );
                if (!lenOfSameId.length) {
                    const filesOriginalWithoutId = this.filesBeforeOrder.filter(
                        (fd) => (fd.id && fd.id !== idFileToDelete) || !fd.id
                    );
                    this.filesBeforeOrder = [...filesOriginalWithoutId];
                }
            }
            this.filesOriginal = [...this.files];
        } else {
            if (idFileToDelete) {
                const lenOfSameId = this.files.filter(
                    (fd) => fd.id && fd.id === idFileToDelete
                );
                if (!lenOfSameId.length) {
                    const filesOriginalWithoutId = this.filesOriginal.filter(
                        (fd) => (fd.id && fd.id !== idFileToDelete) || !fd.id
                    );
                    this.filesOriginal = [...filesOriginalWithoutId];
                }
            }
            this.filesBeforeOrder = [...this.files];
        }
        this.fileDropRef.nativeElement.type = 'text';
        setTimeout(() => {
            if (this.fileDropRef && this.fileDropRef.nativeElement) {
                this.fileDropRef.nativeElement.type = 'file';
            }
        }, 200);
        if (!this.files.length) {
            this.fileViewer = false;
        }
    }

    deleteScanFile(index: number) {
        this.files.splice(index, 1);
        this.files = this.files.filter((fd) => !fd.selcetFile);
        if (!this.files.length) {
            this.fileViewer = false;
            this.unload();
        }
    }

    addImageProcess(item: any) {
        return new Promise((resolve, reject) => {
            const reader: any = new FileReader();
            reader.onload = () => {
                resolve(this.sanitizeImageUrl(reader.result));
            };
            reader.readAsDataURL(item);
        });
    }

    async prepareFilesList(files: Array<any>) {
        this.filesForContainer = files.length;
        this.filesForContainerCompleted = 0;
        this.finishedPrepareFiles = false;
        this.fileViewer = true;

        for (let idxMain = 0; idxMain < files.length; idxMain++) {
            const item = files[idxMain];
            item['id'] = crypto['randomUUID']();
            if (item.size && item.size / 1048576 >= 7) {
                item.src = null;
                // this.files.push(item);
                this.filesBeforeOrder.push(item);
                this.filesOriginal.push(item);
                this.filesForContainerCompleted = this.filesForContainerCompleted + 1;
                if (idxMain + 1 === files.length) {
                    this.finishedPrepareFiles = true;
                    if (this.keepOriginFiles) {
                        this.files = [...this.filesOriginal];
                    } else {
                        this.files = [...this.filesBeforeOrder];
                    }
                }
            } else {
                if (item.type === 'application/pdf') {
                    let encodeCorrect = true;
                    const donorPdfBytes = await item.arrayBuffer();
                    const typedArray = new Uint8Array(donorPdfBytes);
                    if (window['jschardet']) {
                        if (window['jschardet'].detect) {
                            const textBin = await item.text();
                            const detectEncoding = window['jschardet'].detect(textBin, {
                                minimumThreshold: 0
                            });
                            // console.log(detectEncoding);
                            if (
                                detectEncoding.encoding &&
                                detectEncoding.encoding === 'windows-1252'
                            ) {
                                console.log('לא תקין');
                                encodeCorrect = false;
                            }
                        }
                    }
                    if (encodeCorrect) {
                        try {
                            const pdf = await pdfjsLib.getDocument(typedArray).promise;
                            const pdfData = await pdf.getMetadata();
                            console.log(
                                'PDF loaded, IsSignaturesPresent: ',
                                pdfData.info.IsSignaturesPresent
                            );

                            const itemPdf = item;
                            itemPdf.src = this.sanitizer.bypassSecurityTrustResourceUrl(
                                URL.createObjectURL(itemPdf) +
                                '#toolbar=0&scrollbar=0&navpanes=0'
                            );
                            itemPdf['numPages'] = pdf.numPages;
                            this.filesOriginal.push(itemPdf);

                            for (let idx = 0; idx < pdf.numPages; idx++) {
                                const pageNumber = idx + 1;
                                const page = await pdf.getPage(pageNumber);
                                console.log('Page loaded');

                                const isDocumentDigital = await page.getTextContent();
                                if (pdfData.info.IsSignaturesPresent) {
                                    console.log(
                                        'digital PDF, number of words found: ',
                                        isDocumentDigital.items.length
                                    );
                                    item.src = this.sanitizer.bypassSecurityTrustResourceUrl(
                                        URL.createObjectURL(item) +
                                        '#toolbar=0&scrollbar=0&navpanes=0'
                                    );
                                    item['isDigital'] = !!pdfData.info.IsSignaturesPresent;

                                    // this.files.push(item);
                                    this.filesBeforeOrder.push(item);
                                    if (idxMain + 1 === files.length) {
                                        this.finishedPrepareFiles = true;
                                        if (this.keepOriginFiles) {
                                            this.files = [...this.filesOriginal];
                                        } else {
                                            this.files = [...this.filesBeforeOrder];
                                        }
                                    }
                                    break;
                                } else {
                                    console.log('none digital PDF');
                                }

                                const scale = 1;
                                const viewport = page.getViewport({scale: scale});
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                const PRINT_UNITS = 200 / 72.0;
                                canvas.width = Math.floor(viewport.width * PRINT_UNITS);
                                canvas.height = Math.floor(viewport.height * PRINT_UNITS);

                                const ctx = canvas.getContext('2d');
                                ctx.save();
                                ctx.fillStyle = 'rgb(255, 255, 255)';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                ctx.restore();

                                // canvas.height = viewport.height;
                                // canvas.width = viewport.width;
                                const renderContext = {
                                    canvasContext: context,
                                    viewport: viewport,
                                    transform: [PRINT_UNITS, 0, 0, PRINT_UNITS, 0, 0]
                                };
                                await page.render(renderContext).promise;
                                console.log('Page rendered');
                                const src = canvas.toDataURL('image/jpeg', 1);

                                // console.log(src);

                                const lastModifiedDate = new Date();
                                const blob = await this.getFile(src);
                                const fileName = item.name.split('.')[0] + '_' + idx + '.jpg';
                                const file = new File([blob], fileName, {
                                    type: 'image/jpeg',
                                    lastModified: lastModifiedDate.getTime()
                                });
                                file['src'] = this.sanitizeImageUrl(src);
                                file['id'] = itemPdf['id'];
                                // this.files.push(file);
                                this.filesBeforeOrder.push(file);

                                if (
                                    idxMain + 1 === files.length &&
                                    pageNumber === pdf.numPages
                                ) {
                                    this.finishedPrepareFiles = true;
                                    if (this.keepOriginFiles) {
                                        this.files = [...this.filesOriginal];
                                    } else {
                                        this.files = [...this.filesBeforeOrder];
                                    }
                                }
                            }
                            this.filesForContainerCompleted =
                                this.filesForContainerCompleted + 1;
                        } catch (errPdf: any) {
                            console.log(errPdf);
                            if (
                                errPdf &&
                                errPdf.message &&
                                errPdf.message.includes('Invalid PDF structure')
                            ) {
                                if (idxMain + 1 === files.length) {
                                    this.finishedPrepareFiles = true;
                                    if (this.keepOriginFiles) {
                                        this.files = [...this.filesOriginal];
                                    } else {
                                        this.files = [...this.filesBeforeOrder];
                                    }
                                }
                            }
                        }
                    } else {
                        try {
                            const pdf = await pdfjsLib.getDocument(typedArray).promise;
                            item.src = this.sanitizer.bypassSecurityTrustResourceUrl(
                                URL.createObjectURL(item) + '#toolbar=0&scrollbar=0&navpanes=0'
                            );
                            // this.files.push(item);
                            this.filesBeforeOrder.push(item);
                            item['numPages'] = pdf.numPages;
                            this.filesOriginal.push(item);
                            this.filesForContainerCompleted =
                                this.filesForContainerCompleted + 1;
                            if (idxMain + 1 === files.length) {
                                this.finishedPrepareFiles = true;
                                if (this.keepOriginFiles) {
                                    this.files = [...this.filesOriginal];
                                } else {
                                    this.files = [...this.filesBeforeOrder];
                                }
                            }
                        } catch (errPdf: any) {
                            console.log(errPdf);
                            if (
                                errPdf &&
                                errPdf.message &&
                                errPdf.message.includes('Invalid PDF structure')
                            ) {
                                if (idxMain + 1 === files.length) {
                                    this.finishedPrepareFiles = true;
                                    if (this.keepOriginFiles) {
                                        this.files = [...this.filesOriginal];
                                    } else {
                                        this.files = [...this.filesBeforeOrder];
                                    }
                                }
                            }
                        }
                    }

                    // item.src = this.sanitizer.bypassSecurityTrustResourceUrl(
                    //     URL.createObjectURL(item) + '#toolbar=0&scrollbar=0&navpanes=0'
                    // );
                    // this.files.push(item);
                } else if (item.type.includes('image/') && item.type !== 'image/gif') {
                    const src_result = await this.addImageProcess(item);
                    item.src = src_result;
                    // this.files.push(item);
                    this.filesBeforeOrder.push(item);
                    this.filesForContainerCompleted =
                        this.filesForContainerCompleted + 1;
                    this.filesOriginal.push(item);

                    if (idxMain + 1 === files.length) {
                        this.finishedPrepareFiles = true;
                        if (this.keepOriginFiles) {
                            this.files = [...this.filesOriginal];
                        } else {
                            this.files = [...this.filesBeforeOrder];
                        }
                    }
                }
            }
        }
    }

    sanitizeImageUrl(imageUrl: string): SafeUrl {
        return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
    }

    fileViewerOpen(type: string): void {
        this.fileViewer = type;
        this.fileViewerSaved = type;
        if (this.uploadFilesOcrPopUp && this.uploadFilesOcrPopUp.visible) {
            this.uploads(this.fileViewer);
        }
    }

    trackByIndex(index: number, val: any): number {
        return index;
    }

    isSelectedFile(): boolean {
        if (this.files.length && this.files.some((fd) => fd.selcetFile)) {
            return false;
        }
        return true;
    }

    public async uploads(type: string): Promise<any> {
        this.fileUploadProgress = true;
        this.fileViewer = false;
        if (this.files.some((it) => it.merge)) {
            const pagesContainer = [];
            this.files.forEach((page, idx) => {
                if (idx === 0) {
                    pagesContainer.push([page]);
                } else {
                    if (!this.files[idx - 1].merge) {
                        pagesContainer.push([]);
                    }
                    pagesContainer[pagesContainer.length - 1].push(page);
                }
            });
            this.numberOfFilesForUpload = pagesContainer.length;
            const filesAfterMerge = [];
            for (let iMain = 0; iMain < pagesContainer.length; iMain++) {
                const files = pagesContainer[iMain];
                if (files.length > 1) {
                    const pdfDoc = await PDFDocument.create();
                    for (let i = 0; i < files.length; i++) {
                        if (files[i].type === 'application/pdf') {
                            const donorPdfBytes = await files[i].arrayBuffer();
                            const donorPdfDoc = await PDFDocument.load(donorPdfBytes);
                            const indices = donorPdfDoc.getPageIndices();
                            const [...firstDonorPage] = await pdfDoc.copyPages(
                                donorPdfDoc,
                                indices
                            );
                            firstDonorPage.forEach((item) => {
                                pdfDoc.addPage(item);
                            });
                        } else {
                            const donorImgBytes = await files[i].arrayBuffer();
                            const jpgImage =
                                files[i].type === 'image/png'
                                    ? await pdfDoc.embedPng(donorImgBytes)
                                    : await pdfDoc.embedJpg(donorImgBytes);
                            const page = pdfDoc.addPage();
                            // Draw the JPG image in the center of the page
                            const aspectRatio = jpgImage.height / jpgImage.width;
                            const height = page.getWidth() * aspectRatio;
                            const dif = page.getHeight() - height;
                            // Draw the JPG image in the center of the page
                            page.drawImage(jpgImage, {
                                x: 0,
                                y: dif - dif / 2,
                                width: page.getWidth(),
                                height: height
                            });
                        }
                    }
                    console.log(pdfDoc);
                    const blob = await pdfDoc.save();
                    const fileName = files[0].name.split('.')[0] + '.pdf';
                    const lastModifiedDate = new Date();
                    const file = new File([blob], fileName, {
                        type: 'application/pdf',
                        lastModified: lastModifiedDate.getTime()
                    });
                    file['merge'] = true;
                    file['src'] = this.sanitizer.bypassSecurityTrustResourceUrl(
                        URL.createObjectURL(file) + '#toolbar=0&scrollbar=0&navpanes=0'
                    );
                    filesAfterMerge.push(file);
                } else {
                    filesAfterMerge.push(files[0]);
                }
            }
            this.files = filesAfterMerge;
        } else {
            this.numberOfFilesForUpload = this.files.length;
        }
        // console.log('files', this.files)
        this.sharedService
            .getUploadUrl({
                companyId: this.companySelect.companyId,
                files: this.files.map((item) => {
                    return {
                        fileName: item.name,
                        fileType: item.type,
                        parent:
                            item.type === 'application/pdf' &&
                            (item.merge ||
                                (this.keepOriginFiles && item.numPages && item.numPages > 1) ||
                                item.isDigital)
                    };
                }),
                status: type,
                folderId: type === 'ARCHIVE' ? this.folderSelect.folderId : null,
                expense: null,
                uploadSource: 'UPLOAD'
            })
            .subscribe((response: any) => {
                this.uploadFilesOcrPopUp.urlsFiles = response
                    ? response['body']
                    : response;
                console.log('responseFiles', this.uploadFilesOcrPopUp.urlsFiles);
                this.progress = this.uploadToServer(this.files);

                const subscriptionTimerGetFilesStatus = interval(5000)
                    .pipe(
                        startWith(0),
                        switchMap(() =>
                            this.sharedService.getFilesStatus(
                                this.files.map((item) => {
                                    return item.fileId;
                                })
                            )
                        )
                    )
                    .subscribe((responseStatus) => {
                        const responseStatusData = responseStatus
                            ? responseStatus['body']
                            : responseStatus;
                        responseStatusData.forEach((item) => {
                            const setStatus = this.files.find(
                                (file) => file.fileId === item.fileId
                            );
                            if (setStatus && item.status === 'WAIT_FOR_CONFIRM') {
                                setStatus.ready = true;
                            }
                        });
                        // console.log(this.files);
                        if (
                            this.files.every((file) => file.ready) ||
                            !this.fileUploadProgress
                        ) {
                            subscriptionTimerGetFilesStatus.unsubscribe();
                            if (this.files.every((file) => file.ready)) {
                                this.exportIzu();
                            }
                        }
                    });

                const allProgressObservables = [];
                // tslint:disable-next-line:forin
                for (const key in this.progress) {
                    // noinspection JSUnfilteredForInLoop
                    allProgressObservables.push(this.progress[key].progress);
                }
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
                                this.uploadFilesOcrPopUp.urlsFiles.processId
                            )
                        )
                    )
                    .subscribe((responseStatus) => {
                    });
                this.indexFileTimer = 0;
                const subscriptionTimer = timer(1000, 1000).subscribe(() => {
                    if (this.indexFileTimer + 1 >= this.files.length) {
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
                    // if (type === 'ARCHIVE') {
                    //     this.reportService.postponed = {
                    //         action: this.sharedService.updateOcrDocumentStatus(
                    //             {
                    //                 'fileStatus': FileStatus.ARCHIVE,
                    //                 'filesId': this.files.map(file => file.fileId),
                    //                 'folderId': this.folderSelect.folderId
                    //             }),
                    //         message: this.sanitizer.bypassSecurityTrustHtml(
                    //             (this.files.length > 1) ?
                    //                 (this.files.length + (' מסמכים הועברו ' + '<b>' + 'לארכיון' + '</b>'))
                    //                 : ('המסמך הועבר ' + '<b>' + 'לארכיון' + '</b>')),
                    //         fired: false
                    //     };
                    //     timer(3000)
                    //         .pipe(
                    //             switchMap(() => {
                    //                 if (this.reportService.postponed && this.reportService.postponed.action) {
                    //                     return this.reportService.postponed.action;
                    //                 } else {
                    //                     return EMPTY;
                    //                 }
                    //             }),
                    //             tap(() => {
                    //                 this.reportService.postponed.fired = true;
                    //             }),
                    //             take(1)
                    //         )
                    //         .subscribe(() => {
                    //             this.exportIzu();
                    //
                    //         });
                    // } else {
                    //
                    //
                    // }

                    this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                        {
                            duration: 3,
                            multiple: this.files.length > 1,
                            text:
                                this.files.length +
                                ' מסמכים הועלו לחברת ' +
                                this.companySelect.companyName +
                                ' ועברו לפיענוח'
                        }
                    );
                    // this.exportIzu();
                    // this.fileUploadProgress = false;
                    // this.folderSelect = false;
                    // this.files = [];
                    // this.progress = false;
                    // this.uploadFilesOcrPopUp = {
                    //     visible: false,
                    //     urlsFiles: []
                    // };
                });
            });
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
                this.uploadFilesOcrPopUp.urlsFiles.links[index].s3UploadUrl.split(
                    '/'
                )[4];
            const req = new HttpRequest(
                'PUT',
                this.uploadFilesOcrPopUp.urlsFiles.links[index].s3UploadUrl,
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
                    next: (event: any) => {
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
                    error: (error: any) => {
                        const reqServer = new HttpRequest(
                            'POST',
                            this.httpServices.mainUrl +
                            '/v1/ocr/upload-workaround/' +
                            this.uploadFilesOcrPopUp.urlsFiles.links[index]
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
                            {
                                next: (event: any) => {
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
                                error: (error) => {
                                }
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

    public async getFile(contentUrl: string): Promise<Blob> {
        return lastValueFrom(this.httpClient
            .get(contentUrl, {
                responseType: 'blob'
            }));
    }

    public async getFileAsArrayBuffer(contentUrl: string): Promise<ArrayBuffer> {
        return lastValueFrom(this.httpClient
            .get(contentUrl, {
                responseType: 'arraybuffer'
            }));
    }

    public uploadUrlsToServer(files: any): {
        [key: string]: { progress: Observable<number> };
    } {
        this.progressAll = new Subject<number>();
        this.progressAll.next(0);
        const percentDoneTotal = [];
        const status: { [key: string]: { progress: Observable<number> } } = {};
        files.forEach((file: any, index) => {
            const req = new HttpRequest(
                'PUT',
                this.scanFilesOcrPopUp.urlsFiles.links[index].s3UploadUrl,
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
            this.http.request(req).pipe(
                retry({
                    count: 3,
                    delay: 1500
                })
            ).subscribe(
                {
                    next: (event: any) => {
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
                            this.scanFilesOcrPopUp.urlsFiles.links[index].workaroundUploadUrl,
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
                            {
                                next: (event: any) => {
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
                                error: (error) => {
                                }
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

    public async uploadsScan(type: string): Promise<any> {
        this.fileUploadProgress = true;
        this.fileViewer = false;
        if (this.files.some((it) => it.merge)) {
            const pagesContainer = [];
            this.files.forEach((page, idx) => {
                if (idx === 0) {
                    pagesContainer.push([page]);
                } else {
                    if (!this.files[idx - 1].merge) {
                        pagesContainer.push([]);
                    }
                    pagesContainer[pagesContainer.length - 1].push(page);
                }
            });
            const filesAfterMerge = [];
            for (let iMain = 0; iMain < pagesContainer.length; iMain++) {
                const files = pagesContainer[iMain];
                if (files.length > 1) {
                    const pdfDoc = await PDFDocument.create();
                    for (let i = 0; i < files.length; i++) {
                        if (files[i].type === 'application/pdf') {
                            const donorPdfBytes = await this.getFileAsArrayBuffer(
                                files[i].src
                            );
                            const donorPdfDoc = await PDFDocument.load(donorPdfBytes);
                            const indices = donorPdfDoc.getPageIndices();
                            const [...firstDonorPage] = await pdfDoc.copyPages(
                                donorPdfDoc,
                                indices
                            );
                            firstDonorPage.forEach((item) => {
                                pdfDoc.addPage(item);
                            });
                        } else {
                            const donorImgBytes = await this.getFileAsArrayBuffer(
                                files[i].src
                            );
                            const jpgImage =
                                files[i].type === 'image/png'
                                    ? await pdfDoc.embedPng(donorImgBytes)
                                    : await pdfDoc.embedJpg(donorImgBytes);
                            const page = pdfDoc.addPage();
                            // Draw the JPG image in the center of the page
                            const aspectRatio = jpgImage.height / jpgImage.width;
                            const height = page.getWidth() * aspectRatio;
                            const dif = page.getHeight() - height;
                            // Draw the JPG image in the center of the page
                            page.drawImage(jpgImage, {
                                x: 0,
                                y: dif - dif / 2,
                                width: page.getWidth(),
                                height: height
                            });
                        }
                    }
                    // console.log(pdfDoc);
                    const blob = await pdfDoc.save();
                    const fileName = files[0].name.split('.')[0] + '.pdf';
                    const lastModifiedDate = new Date();
                    const file = new File([blob], fileName, {
                        type: 'application/pdf',
                        lastModified: lastModifiedDate.getTime()
                    });
                    file['merge'] = true;
                    file['src'] = this.sanitizer.bypassSecurityTrustResourceUrl(
                        URL.createObjectURL(file) + '#toolbar=0&scrollbar=0&navpanes=0'
                    );
                    filesAfterMerge.push(file);
                } else {
                    const fileName = files[0].name;
                    const lastModifiedDate = new Date();
                    const blob = await this.getFile(files[0].src);
                    const file = new File([blob], fileName, {
                        type: files[0].type,
                        lastModified: lastModifiedDate.getTime()
                    });
                    filesAfterMerge.push(file);
                }
            }
            this.files = filesAfterMerge;
        } else {
            for (let iMain = 0; iMain < this.files.length; iMain++) {
                const files = this.files[iMain];
                const fileName = files.name;
                const lastModifiedDate = new Date();
                const blob = await this.getFile(files.src);
                const file = new File([blob], fileName, {
                    type: files.type,
                    lastModified: lastModifiedDate.getTime()
                });
                this.files[iMain] = file;
            }
        }
        this.sharedService
            .getUploadUrl({
                companyId: this.companySelect.companyId,
                files: this.files.map((item) => {
                    return {
                        fileName: item.name,
                        fileType: item.type,
                        parent:
                            item.type === 'application/pdf' &&
                            (item.merge ||
                                (this.keepOriginFiles && item.numPages && item.numPages > 1) ||
                                item.isDigital)
                    };
                }),
                status: type,
                folderId: type === 'ARCHIVE' ? this.folderSelect.folderId : null,
                expense: null,
                uploadSource: 'SCAN'
            })
            .subscribe((response: any) => {
                this.scanFilesOcrPopUp.urlsFiles = response
                    ? response['body']
                    : response;
                console.log('responseFiles', this.scanFilesOcrPopUp.urlsFiles);
                this.progress = this.uploadUrlsToServer(this.files);
                const allProgressObservables = [];
                // tslint:disable-next-line:forin
                for (const key in this.progress) {
                    // noinspection JSUnfilteredForInLoop
                    allProgressObservables.push(this.progress[key].progress);
                }
                const preventClose = function (e) {
                    e.preventDefault();
                    e.returnValue = '';
                };
                window.addEventListener('beforeunload', preventClose, true);
                const subscriptionTimerGetFilesPing = interval(20000)
                    .pipe(
                        startWith(0),
                        switchMap(() =>
                            this.sharedService.pingProcess(
                                this.scanFilesOcrPopUp.urlsFiles.processId
                            )
                        )
                    )
                    .subscribe((responseStatus) => {
                        if (
                            this.files.every((file) => file.ready) ||
                            !this.fileUploadProgress
                        ) {
                            subscriptionTimerGetFilesPing.unsubscribe();
                            window.removeEventListener('beforeunload', preventClose, true);
                        }
                    });
                this.indexFileTimer = 0;
                const subscriptionTimer = timer(1000, 1000).subscribe(() => {
                    if (this.indexFileTimer + 1 >= this.files.length) {
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
                    // if (type === 'ARCHIVE') {
                    //     this.reportService.postponed = {
                    //         action: this.sharedService.updateOcrDocumentStatus(
                    //             {
                    //                 'fileStatus': FileStatus.ARCHIVE,
                    //                 'filesId': this.files.map(file => file.fileId),
                    //                 'folderId': this.folderSelect.folderId
                    //             }),
                    //         message: this.sanitizer.bypassSecurityTrustHtml(
                    //             (this.files.length > 1) ?
                    //                 (this.files.length + (' מסמכים הועברו ' + '<b>' + 'לארכיון' + '</b>'))
                    //                 : ('המסמך הועבר ' + '<b>' + 'לארכיון' + '</b>')),
                    //         fired: false
                    //     };
                    //     timer(3000)
                    //         .pipe(
                    //             switchMap(() => {
                    //                 if (this.reportService.postponed && this.reportService.postponed.action) {
                    //                     return this.reportService.postponed.action;
                    //                 } else {
                    //                     return EMPTY;
                    //                 }
                    //             }),
                    //             tap(() => {
                    //                 this.reportService.postponed.fired = true;
                    //             }),
                    //             take(1)
                    //         )
                    //         .subscribe(() => {
                    //             this.exportIzu();
                    //         });
                    // } else {
                    //
                    // }
                    this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                        {
                            duration: 3,
                            multiple: this.files.length > 1,
                            text:
                                this.files.length +
                                ' מסמכים הועלו לחברת ' +
                                this.companySelect.companyName +
                                ' ועברו לפיענוח'
                        }
                    );
                    this.exportIzu();
                    this.unload();
                    this.fileUploadProgress = false;
                    this.folderSelect = false;
                    this.files = [];
                    this.progress = false;
                    this.scanFilesOcrPopUp = {
                        visible: false,
                        urlsFiles: {
                            links: []
                        }
                    };
                });
            });
    }

    calcMinus(num: number): number {
        if (num < 0) {
            return Math.abs(num);
        } else {
            return -num;
        }
    }

    printScreen() {
        this.reportService.reportIsProcessing$.next(true);
        setTimeout(() => {
            if (this.elemToPrint && this.elemToPrint['nativeElement']) {
                BrowserService.printHtml(
                    this.elemToPrint['nativeElement'],
                    'הסכם שימוש ומדיניות הפרטיות'
                );
                this.reportService.reportIsProcessing$.next(false);
            }
        }, 1000);
    }

    updateAgreementConfirmation(agreementPopup: any) {
        if (agreementPopup === false) {
            this.sharedService
                .updateAgreementUserConfirmation({
                    agreementConfirmation: null,
                    sendMarketingInformation: null,
                    agreementClicked: true
                })
                .subscribe((response: any) => {
                });
        } else {
            if (agreementPopup.agreementConfirmation) {
                agreementPopup.agreementConfirmation = new Date(
                    Date.now()
                ).toISOString();
            }
            if (agreementPopup.sendMarketingInformation) {
                agreementPopup.sendMarketingInformation = new Date(
                    Date.now()
                ).toISOString();
            } else {
                agreementPopup.sendMarketingInformation = null;
            }
            this.agreementPopup = false;

            this.sharedService
                .updateAgreementUserConfirmation({
                    agreementConfirmation: agreementPopup.agreementConfirmation,
                    sendMarketingInformation: null,
                    agreementClicked: false
                })
                .subscribe((response: any) => {
                });
        }
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

    disabledData(arr: any, company: any, companyId: any) {
        // arr = arr.filter(it => !it.title && !it.defNull);
        arr.forEach(item => {
            item.disabled = company['izuCustIdSrc'] === item.custId || this.isExistCustId(item.custId, companyId) || item.title;
        });
        if (arr.length && !arr.find(it => it.title)) {
            arr.unshift({
                disabled: true,
                title: true,
                custId: 'null',
                lName: null,
                hp: null
            });
        }
        if (this.userService.appData && this.userService.appData.isAdmin) {
            if ((!company.izuCustId || (company.izuCustId === 'לא משוייך כרטיס')) && arr.length && arr.find(it => it.defNull)) {
                arr = arr.filter(it => !it.defNull);
            }
            if (company.izuCustId && (company.izuCustId !== 'לא משוייך כרטיס') && arr.length && !arr.find(it => it.defNull)) {
                arr.unshift({
                    disabled: false,
                    title: false,
                    defNull: true,
                    cartisName: 'ביטול בחירה',
                    custId: 'defNull',
                    lName: null,
                    hp: null
                });
            }
        }

        return arr;
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    addCreditExportItem(showCreditExportPopupItemChild: any, showCreditExportPopupParent: any) {
        this.sharedService
            .addCreditExportItem({
                uuid: showCreditExportPopupParent.companyId
            })
            .subscribe((res) => {
                showCreditExportPopupItemChild.showCreditExportPopup = false;
                this.changeIzuCustId(showCreditExportPopupItemChild, showCreditExportPopupParent);
            });
    }

    addExchangeRate(showExchangeRatePopup: any) {
        this.sharedService
            .addExchangeRate({
                companyId: showExchangeRatePopup.parent.companyId,
                'currencyRate': {
                    'code': showExchangeRatePopup.itemChild.findMatchCode.code,
                    'delete': false,
                    fixedRate:
                        showExchangeRatePopup.itemChild.form.get('type').value === 'FIXED' ? Number(showExchangeRatePopup.itemChild.form.get('fixedRate').value) : 0,
                    hashCodeId: showExchangeRatePopup.itemChild.form.get('hashCodeId').value ? Number(showExchangeRatePopup.itemChild.form.get('hashCodeId').value) : 0,
                    type: showExchangeRatePopup.itemChild.form.get('type').value
                }
            })
            .subscribe(() => {
                showExchangeRatePopup.itemChild.showExchangeRatePopup = false;
                this.changeIzuCustId(showExchangeRatePopup.itemChild, showExchangeRatePopup.parent);
            });
    }

    updateValues(param: any, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.showExchangeRatePopup.itemChild.form.patchValue(pbj);
    }

    setMaxDigitsAfterDec() {
        let rateInput = this.showExchangeRatePopup.itemChild.form
            .get('fixedRate')
            .value.toString()
            .replace(/[^0-9.]/g, '');
        if (rateInput && rateInput.includes('.')) {
            const splitNumbers = rateInput.split('.');
            if (splitNumbers[1].length > 2) {
                rateInput = splitNumbers[0] + '.' + splitNumbers[1].slice(0, 2);
            }
        }
        this.showExchangeRatePopup.itemChild.form.patchValue({
            fixedRate: rateInput
        });
    }

    resetDDCustId(src: any) {
        const itemChild = src.itemChild;
        const idChild = (itemChild.accountType !== 'BANK' && (itemChild.creditCardId ||
            itemChild.creditCardMatahId) ? (itemChild.creditCardId ? 'creditCardId' : 'creditCardMatahId'
        ) : 'accountId');

        const parent = this.allIzuData.find((item) => item.companyId === src.parent.companyId);
        if (parent) {
            const foundChild = parent.dataArray.find(it => it[idChild] === itemChild[idChild]);
            if (foundChild) {
                foundChild.izuCustId = itemChild.izuCustIdSrc;
            }
        }
        if (!this.isSearch) {
            const foundChild = this.activeCompany.dataArray.find(it => it[idChild] === itemChild[idChild]);
            if (foundChild) {
                foundChild.izuCustId = itemChild.izuCustIdSrc;
            }
        }
    }

    changeIzuCustId(itemChild: any, parent: any, notUpdatePopUp?: any) {
        console.log(itemChild, parent);
        const fullCardSelected = itemChild.companyCustomerDetailsExport ? itemChild.companyCustomerDetailsExport.banksCardsExport.find(it => it.custId === itemChild.izuCustId) : null;
        itemChild.fullCardSelected = fullCardSelected;
        this.resetParamDDCust = {
            itemChild: itemChild,
            parent: parent
        };
        this.exportPopupType = false;
        if (parent.folderPlus && itemChild.fullCardSelected && itemChild.fullCardSelected.custId && (itemChild.fullCardSelected.custId.includes('-') || itemChild.fullCardSelected.custId.includes(';'))) {
            this.showPopupSpecialCharacters = true;
            setTimeout(() => {
                this.resetDDCustId(this.resetParamDDCust);
            }, 200);
            return;
        }
        if ((this.userService.appData && this.userService.appData.isAdmin) && itemChild.izuCustId === 'defNull') {
            this.sharedService
                .connectCust({
                    accountId: itemChild.accountType !== 'BANK' ? (itemChild.accountType === 'CCARD_MATAH' ? itemChild.creditCardMatahId : itemChild.creditCardId) : itemChild.accountId,
                    accountType: itemChild.accountType,
                    companyId: parent.companyId,
                    custId: null,
                    popupType: 'DISCONNECT'
                })
                .subscribe(() => {
                    this.reload();
                });
            return;
        }
        if (itemChild.showCreditExportPopup && !notUpdatePopUp) {
            this.showCreditExportPopup = {
                itemChild: itemChild,
                parent: parent
            };
            return;
        }
        if (itemChild.showExchangeRatePopup && !notUpdatePopUp) {
            if (!itemChild.currencyId) {
                itemChild.currencyId = 1;
            }
            itemChild.findMatchCode = this.currencyList.find((it) => it.id === itemChild.currencyId);
            if (!itemChild.findMatchCode) {
                itemChild.findMatchCode = {
                    'id': 1,
                    'name': 'שקל חדש',
                    'sign': '₪',
                    'code': 'ILS',
                    'common': true,
                    'bankIsrael': false,
                    'indDefault': false
                };
            }
            itemChild.form = new FormGroup({
                type: new FormControl({
                    // BANK or FIXED
                    value: 'BANK',
                    disabled: false
                }),
                fixedRate: new FormControl({
                    // null or number
                    value: '',
                    disabled: false
                }),
                hashCodeId: new FormControl({
                    // null or number
                    value: '',
                    disabled: false
                })
            });
            this.showExchangeRatePopup = {
                itemChild: itemChild,
                parent: parent
            };
            return;
        }


        if (itemChild.izuCustId) {
            if (
                itemChild.creditCardId ||
                itemChild.creditCardMatahId ||
                itemChild.accountType !== 'BANK'
            ) {
                this.sharedService
                    .exportPopupType({
                        accountId: itemChild.accountType === 'CCARD_MATAH' ? itemChild.creditCardMatahId : itemChild.creditCardId,
                        accountType: itemChild.accountType,
                        companyId: parent.companyId,
                        custId: itemChild.izuCustId
                    })
                    .subscribe((res) => {
                        const dataPopUp = res ? res['body'] : res;
                        this.exportPopupType = JSON.parse(JSON.stringify(dataPopUp));
                        if (!this.exportPopupType['fixTrans']) {
                            this.exportPopupType['fixTrans'] = 'ADD_TRANS';
                        }

                        if (this.exportPopupType.popupType === 'NOT_EXIST' || this.exportPopupType.popupType === 'NOT_UPDATED') {
                            this.resetDDCustId({
                                itemChild: itemChild,
                                parent: parent
                            });
                        }
                        itemChild['parent'] = parent;
                        this.exportPopupType['item'] = itemChild;

                        if (
                            this.exportPopupType.biziboxTransData &&
                            this.exportPopupType.biziboxTransData.length
                        ) {
                            this.exportPopupType.biziboxTransDataArr =
                                dataPopUp.biziboxTransData;
                        }
                        if (
                            this.exportPopupType.hashBankData &&
                            this.exportPopupType.hashBankData.length
                        ) {
                            this.exportPopupType.hashBankDataArr = JSON.parse(
                                JSON.stringify(dataPopUp.hashBankData)
                            );
                            const hashBankDataArr = [];
                            this.exportPopupType.hashBankDataArr.forEach((it) => {
                                const formatDate = this.dtPipe.transform(it.date, 'dd/MM/yy');
                                it[formatDate] = true;
                                const formatDatePrev = hashBankDataArr.length
                                    ? this.dtPipe.transform(
                                        hashBankDataArr[hashBankDataArr.length - 1].date,
                                        'dd/MM/yy'
                                    )
                                    : null;
                                if (!hashBankDataArr.length || formatDate !== formatDatePrev) {
                                    hashBankDataArr.push(
                                        Object.assign(
                                            {
                                                title: true
                                            },
                                            it
                                        )
                                    );
                                }
                                hashBankDataArr.push(it);
                            });
                            this.exportPopupType.hashBankDataArr.sort((a, b) => {
                                return a.date - b.date;
                            });
                            console.log(hashBankDataArr);
                            this.exportPopupType.hashBankDataArrWithTitleSaved =
                                hashBankDataArr;
                            this.generateArrFilter();

                            // sort by date from old to new
                        }

                        if (
                            this.exportPopupType.biziboxTransData &&
                            this.exportPopupType.biziboxTransData.length
                        ) {
                            this.exportPopupType.biziboxTransData =
                                this.exportPopupType.biziboxTransData[0];
                        }
                        if (
                            this.exportPopupType.hashBankData &&
                            this.exportPopupType.hashBankData.length
                        ) {
                            this.exportPopupType.hashBankData =
                                this.exportPopupType.hashBankData[0];
                        }
                        if (this.exportPopupType.popupType === 'CUST_EMPTY') {
                            const oldestTransIzuDate = this.userService.appData.moment(
                                this.exportPopupType.oldestTransIzuDate
                            );
                            this.selection.from = new RangePoint(
                                oldestTransIzuDate.date(),
                                oldestTransIzuDate.month(),
                                oldestTransIzuDate.year()
                            );
                            const maxTransIzuDate = this.exportPopupType.maxTransIzuDate ? this.userService.appData.moment(
                                this.exportPopupType.maxTransIzuDate
                            ) : this.userService.appData.moment();
                            this.max = new Date(maxTransIzuDate.year(), maxTransIzuDate.month(), maxTransIzuDate.date());
                            // this.max.setDate(this.max.getDate());
                            this.setMinDateAndRebuildConstraints(oldestTransIzuDate.toDate());
                        }
                        if (this.exportPopupType.popupType === 'BALANCE_DIFFERENCE') {
                            this.exportPopupType['fixTrans'] = 'MANUAL';
                        }
                        if (this.exportPopupType && (this.exportPopupType.popupType === 'MATCHED_HEFRESH' || this.exportPopupType.popupType === 'CARD_NO_MATCH_HEFRESH' || this.exportPopupType.popupType === 'CARD_MATCH_PROBLEM')) {
                            this.exportPopupType['sumbitAllowed'] = false;
                            this.exportPopupType['fixTrans'] = 'ADD_TRANS';
                            if (this.exportPopupType.cycleDates) {
                                this.exportPopupType.cycleDates.forEach(it => {
                                    it.disabled = !it.matched;
                                });
                                if (this.exportPopupType.cycleDates[0].ccardTazrimId === '00000000-0000-0000-0000-000000000000') {
                                    this.exportPopupType.cycleDates[0].text = 'החל מהמחזור הבא';
                                }
                                const recommended = this.exportPopupType.cycleDates.find(it => it.recommended);
                                this.exportPopupType.izuDateFrom = recommended ? recommended.cycleDate : null;
                            } else {
                                this.exportPopupType.izuDateFrom = null;
                            }
                        }
                        if (this.exportPopupType && (this.exportPopupType.popupType === 'CARD_CUST_EMPTY' || this.exportPopupType.popupType === 'CARD_NO_MATCH' || this.exportPopupType.popupType === 'MATCHED')) {
                            if (this.exportPopupType.cycleDates) {
                                this.exportPopupType.cycleDates.forEach(it => {
                                    it.disabled = !it.matched;
                                });
                                if (this.exportPopupType.cycleDates[0].ccardTazrimId === '00000000-0000-0000-0000-000000000000') {
                                    this.exportPopupType.cycleDates[0].text = 'החל מהמחזור הבא';
                                }
                                const recommended = this.exportPopupType.cycleDates.find(it => it.recommended);
                                this.exportPopupType.izuDateFrom = recommended ? recommended.cycleDate : null;
                            } else {
                                this.exportPopupType.izuDateFrom = null;
                            }
                        }

                        // if (this.exportPopupType && this.exportPopupType.popupType === 'VALID') {
                        //     this.nextAfterVALID();
                        // }

                    });


                // this.sharedService.updateIzuCustCreditCard({
                //     creditCardId: itemChild.creditCardId || itemChild.creditCardMatahId,
                //     custId: itemChild.izuCustId.custId
                // }).subscribe(() => {
                //     const arraySource = from([this.userService.appData.userData.accounts]);
                //     arraySource
                //         .pipe(
                //             tap(() => this.userService.appData.userData.creditCards = null),
                //             switchMap((val) => {
                //                 if (Array.isArray(val)) {
                //                     return this.sharedService.getCreditCardDetails(
                //                         val.map((id) => {
                //                             return {'uuid': id.companyAccountId};
                //                         })
                //                     );
                //                 }
                //                 return of(null);
                //             }),
                //             map(response => response && !response.error ? response.body : null),
                //             tap((response:any) => this.userService.rebuildSelectedCompanyCreditCards(response))
                //         ).subscribe(val => {
                //         console.log(val);
                //         this.reload();
                //     });
                // });
            } else {
                this.sharedService
                    .exportPopupType({
                        accountId: itemChild.accountId,
                        accountType: itemChild.accountType,
                        companyId: parent.companyId,
                        custId: itemChild.izuCustId
                    })
                    .subscribe((res) => {
                        // res = {
                        //     body: {
                        //         'balanceDifference': 230,
                        //         'biziboxTransData': [
                        //             {
                        //                 'asmachta': '324324435',
                        //                 'balance': 23,
                        //                 'date': '2018-07-03T00:00:00',
                        //                 'name': 'שם חשב',
                        //                 'total': 54
                        //             }
                        //         ],
                        //         'hashBankData': [
                        //             {
                        //                 'asmachta': '43243244',
                        //                 'balance': 34,
                        //                 'date': '2019-08-03T00:00:00',
                        //                 'name': 'שם בנק',
                        //                 'total': 255
                        //             }
                        //         ],
                        //         'oldestTransIzuDate': '2018-07-03T00:00:00',
                        //         'popupType': 'NOT_UPDATED',
                        //         'transId': 'string'
                        //     }
                        // };
                        const dataPopUp = res ? res['body'] : res;
                        this.exportPopupType = JSON.parse(JSON.stringify(dataPopUp));
                        if (!this.exportPopupType['fixTrans']) {
                            this.exportPopupType['fixTrans'] = 'ADD_TRANS';
                        }
                        if (this.exportPopupType.popupType === 'NOT_EXIST' || this.exportPopupType.popupType === 'NOT_UPDATED') {
                            this.resetDDCustId({
                                itemChild: itemChild,
                                parent: parent
                            });
                        }
                        itemChild['parent'] = parent;
                        this.exportPopupType['item'] = itemChild;

                        if (
                            this.exportPopupType.biziboxTransData &&
                            this.exportPopupType.biziboxTransData.length
                        ) {
                            this.exportPopupType.biziboxTransDataArr =
                                dataPopUp.biziboxTransData;
                        }
                        if (
                            this.exportPopupType.hashBankData &&
                            this.exportPopupType.hashBankData.length
                        ) {
                            this.exportPopupType.hashBankDataArr = JSON.parse(
                                JSON.stringify(dataPopUp.hashBankData)
                            );
                            const hashBankDataArr = [];
                            this.exportPopupType.hashBankDataArr.forEach((it) => {
                                const formatDate = this.dtPipe.transform(it.date, 'dd/MM/yy');
                                it[formatDate] = true;
                                const formatDatePrev = hashBankDataArr.length
                                    ? this.dtPipe.transform(
                                        hashBankDataArr[hashBankDataArr.length - 1].date,
                                        'dd/MM/yy'
                                    )
                                    : null;
                                if (!hashBankDataArr.length || formatDate !== formatDatePrev) {
                                    hashBankDataArr.push(
                                        Object.assign(
                                            {
                                                title: true
                                            },
                                            it
                                        )
                                    );
                                }
                                hashBankDataArr.push(it);
                            });
                            this.exportPopupType.hashBankDataArr.sort((a, b) => {
                                return a.date - b.date;
                            });
                            console.log(hashBankDataArr);
                            this.exportPopupType.hashBankDataArrWithTitleSaved =
                                hashBankDataArr;
                            this.generateArrFilter();

                            // sort by date from old to new
                        }

                        if (
                            this.exportPopupType.biziboxTransData &&
                            this.exportPopupType.biziboxTransData.length
                        ) {
                            this.exportPopupType.biziboxTransData =
                                this.exportPopupType.biziboxTransData[0];
                        }
                        if (
                            this.exportPopupType.hashBankData &&
                            this.exportPopupType.hashBankData.length
                        ) {
                            this.exportPopupType.hashBankData =
                                this.exportPopupType.hashBankData[0];
                        }
                        if (this.exportPopupType.popupType === 'CUST_EMPTY') {
                            const oldestTransIzuDate = this.userService.appData.moment(
                                this.exportPopupType.oldestTransIzuDate
                            );
                            this.selection.from = new RangePoint(
                                oldestTransIzuDate.date(),
                                oldestTransIzuDate.month(),
                                oldestTransIzuDate.year()
                            );
                            const maxTransIzuDate = this.exportPopupType.maxTransIzuDate ? this.userService.appData.moment(
                                this.exportPopupType.maxTransIzuDate
                            ) : this.userService.appData.moment();
                            this.max = new Date(maxTransIzuDate.year(), maxTransIzuDate.month(), maxTransIzuDate.date());
                            this.setMinDateAndRebuildConstraints(oldestTransIzuDate.toDate());
                        }
                        if (this.exportPopupType.popupType === 'BALANCE_DIFFERENCE') {
                            this.exportPopupType['fixTrans'] = 'MANUAL';
                        }
                        // if (this.exportPopupType && this.exportPopupType.popupType === 'VALID') {
                        //     this.nextAfterVALID();
                        // }
                    });

                // this.sharedService.updateIzuCust({
                //     companyAccountId: itemChild.companyAccountId,
                //     custId: itemChild.izuCustId.custId
                // }).subscribe(() => {
                //     this.sharedService.getAccounts(itemChild.parent.companyId)
                //         .pipe(
                //             tap((response:any) => {
                //                 this.userService.appData.userData.exampleCompany =
                //                     response && !response.error && response.body.exampleCompany;
                //             })
                //         )
                //         .subscribe(
                //             response => {
                //                 this.userService.appData.userData.accounts = response && !response.error
                //                     ? response.body.accounts : null;
                //                 if (Array.isArray(this.userService.appData.userData.accounts)) {
                //                     this.userService.appData.userData.accounts
                //                         .forEach(acc => {
                //                             acc.isUpToDate = acc.isUpdate;
                //                             acc.outdatedBecauseNotFound = !acc.isUpToDate
                //                                 && acc.alertStatus === 'Not found in bank website';
                //                         });
                //                 }
                //                 this.reload();
                //
                //             }, (err: HttpErrorResponse) => {
                //                 if (err.error instanceof Error) {
                //                     console.log('An error occurred:', err.error.message);
                //                 } else {
                //                     console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
                //                 }
                //             }
                //         );
                // });
            }
        }
    }

    openCol(item: any) {
        const formatDate = this.dtPipe.transform(item.date, 'dd/MM/yy');
        item[formatDate] = !item[formatDate];
        this.exportPopupType.hashBankDataArrWithTitleSaved.forEach((it) => {
            const formatDateIt = this.dtPipe.transform(it.date, 'dd/MM/yy');
            if (formatDateIt === formatDate) {
                it[formatDateIt] = item[formatDate];
            }
        });
        this.generateArrFilter();
    }

    generateArrFilter() {
        this.exportPopupType.hashBankDataArrWithTitle = JSON.parse(
            JSON.stringify(this.exportPopupType.hashBankDataArrWithTitleSaved)
        ).filter(
            (it) =>
                it.title ||
                (!it.title && it[this.dtPipe.transform(it.date, 'dd/MM/yy')])
        );
    }

    printHistoryTable() {
        this.reportService.reportIsProcessing$.next(true);
        setTimeout(() => {
            if (this.historyToPrint && this.historyToPrint['nativeElement']) {
                BrowserService.printHtml(
                    this.historyToPrint['nativeElement'],
                    'השוואת תנועות' +
                    ' - ' +
                    this.exportPopupType.item.parent.companyName +
                    'חש ' +
                    this.exportPopupType.item.nickname
                );
                this.reportService.reportIsProcessing$.next(false);
            }
        }, 1000);
    }

    goToWebsite() {

    }

    nextAfterCUSTEMPTY() {
        const dateFrom = new Date(
            this.selection.from.year,
            this.selection.from.month,
            this.selection.from.day
        );
        this.sharedService
            .connectCust({
                accountId: this.exportPopupType['item'].accountId,
                accountType: this.exportPopupType['item'].accountType,
                companyId: this.exportPopupType['item'].parent.companyId,
                custId: typeof this.exportPopupType['item'].izuCustId === 'string' ? this.exportPopupType['item'].izuCustId : this.exportPopupType['item'].izuCustId.custId,
                fixTrans: null,
                izuDateFrom: dateFrom,
                popupType: this.exportPopupType.popupType,
                transId: null
            })
            .subscribe(() => {
                this.reload();
            });
        this.exportPopupType = false;
    }

    nextAfterBALANCEDIFFERENCE() {
        this.sharedService
            .connectCust({
                accountId: this.exportPopupType['item'].accountId,
                accountType: this.exportPopupType['item'].accountType,
                companyId: this.exportPopupType['item'].parent.companyId,
                custId: typeof this.exportPopupType['item'].izuCustId === 'string' ? this.exportPopupType['item'].izuCustId : this.exportPopupType['item'].izuCustId.custId,
                fixTrans: this.exportPopupType.fixTrans,
                izuDateFrom: null,
                popupType: this.exportPopupType.popupType,
                transId: null
            })
            .subscribe(() => {
                this.reload();
            });
        this.exportPopupType = false;
    }

    nextAfterVALID() {
        this.sharedService
            .connectCust({
                accountId: this.exportPopupType['item'].accountId,
                accountType: this.exportPopupType['item'].accountType,
                companyId: this.exportPopupType['item'].parent.companyId,
                custId: typeof this.exportPopupType['item'].izuCustId === 'string' ? this.exportPopupType['item'].izuCustId : this.exportPopupType['item'].izuCustId.custId,
                fixTrans: null,
                izuDateFrom: null,
                popupType: this.exportPopupType.popupType,
                transId: this.exportPopupType.transId
            })
            .subscribe(() => {
                this.reload();
            });
        this.exportPopupType = false;
    }

    nextAfterNOT_UPDATED() {
        this.sharedService
            .connectCust({
                accountId: this.exportPopupType['item'].accountId,
                accountType: this.exportPopupType['item'].accountType,
                companyId: this.exportPopupType['item'].parent.companyId,
                custId: typeof this.exportPopupType['item'].izuCustId === 'string' ? this.exportPopupType['item'].izuCustId : this.exportPopupType['item'].izuCustId.custId,
                fixTrans: null,
                izuDateFrom: null,
                popupType: this.exportPopupType.popupType,
                transId: null
            })
            .subscribe(() => {
                this.reload();
            });
        this.exportPopupType = false;
    }

    nextAfterMATCHED_HEFRESH() {
        this.sharedService
            .connectCust({
                accountId: this.exportPopupType['item'].accountType === 'CCARD_MATAH' ? this.exportPopupType['item'].creditCardMatahId : this.exportPopupType['item'].creditCardId,
                accountType: this.exportPopupType['item'].accountType,
                companyId: this.exportPopupType['item'].parent.companyId,
                custId: typeof this.exportPopupType['item'].izuCustId === 'string' ? this.exportPopupType['item'].izuCustId : this.exportPopupType['item'].izuCustId.custId,
                fixTrans: this.exportPopupType['fixTrans'],
                izuDateFrom: this.exportPopupType.izuDateFrom,
                popupType: this.exportPopupType.popupType,
                transId: null
            })
            .subscribe(() => {
                this.reload();
            });
        this.exportPopupType = false;
    }

    nextAfterCARD_CUST_EMPTY() {
        this.sharedService
            .connectCust({
                accountId: this.exportPopupType['item'].accountType === 'CCARD_MATAH' ? this.exportPopupType['item'].creditCardMatahId : this.exportPopupType['item'].creditCardId,
                accountType: this.exportPopupType['item'].accountType,
                companyId: this.exportPopupType['item'].parent.companyId,
                custId: typeof this.exportPopupType['item'].izuCustId === 'string' ? this.exportPopupType['item'].izuCustId : this.exportPopupType['item'].izuCustId.custId,
                fixTrans: null,
                izuDateFrom: this.exportPopupType.izuDateFrom,
                popupType: this.exportPopupType.popupType,
                transId: null
            })
            .subscribe(() => {
                this.reload();
            });
        this.exportPopupType = false;
    }

    nextAfterHB_DELETE() {
        this.sharedService
            .connectCust({
                accountId: this.exportPopupType['item'].accountId,
                accountType: this.exportPopupType['item'].accountType,
                companyId: this.exportPopupType['item'].parent.companyId,
                custId: typeof this.exportPopupType['item'].izuCustId === 'string' ? this.exportPopupType['item'].izuCustId : this.exportPopupType['item'].izuCustId.custId,
                fixTrans:
                    (this.exportPopupType.popupType === 'HB_DELETE' || this.exportPopupType.popupType === 'NO_MATCH' || this.exportPopupType.popupType === 'LAST_DAY_MATCHED')
                        ? this.exportPopupType.fixTrans
                        : null,
                izuDateFrom: this.exportPopupType.oldestTransIzuDate,
                popupType: this.exportPopupType.popupType,
                transId: null
            })
            .subscribe(() => {
                this.reload();
            });
        this.exportPopupType = false;
    }

    ngOnDestroy() {
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        if (this.scrollSubscriptionFilter) {
            this.scrollSubscriptionFilter.unsubscribe();
        }

        // if (this.subscription) {
        //     this.subscription.unsubscribe();
        // }
        this.destroy();
    }

    mayNavigateTo(mon: number | null, year: number) {
        const inpnum = this.toMonths(mon, year);

        return (
            this.toMonths(
                mon === null ? 0 : this.allowed.from.month,
                this.allowed.from.year
            ) <= inpnum &&
            inpnum <=
            this.toMonths(
                mon === null ? 0 : this.allowed.till.month,
                this.allowed.till.year
            )
        );
    }

    isBefore(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) <
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    isAfter(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) >
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    isEqual(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) ===
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    stepMonth(monYear: { month: number; year: number }, step: number) {
        const rsltMonIdx = monYear.month + step;
        if (rsltMonIdx < 0) {
            monYear.month = rsltMonIdx + 12;
            monYear.year -= 1;
        } else if (rsltMonIdx >= 12) {
            monYear.month = rsltMonIdx % 12;
            monYear.year += 1;
        } else {
            monYear.month = rsltMonIdx;
        }
    }

    createMonth(monYear: { month: number; year: number }): {
        day: number;
        month: number;
        year: number;
        today: boolean;
        selectable: boolean;
    }[][] {
        const dates: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][] = [];
        const firstDay = this.getFirstDayOfMonthIndex(monYear.month, monYear.year);
        const daysLength = this.getDaysCountInMonth(monYear.month, monYear.year);
        const prevMonthDaysLength = this.getDaysCountInPrevMonth(
            monYear.month,
            monYear.year
        );
        const sundayIndex = this.getSundayIndex();
        let dayNo = 1;
        const today = this.userService.appData.moment().toDate();

        for (let i = 0; i < 6; i++) {
            const week = [];

            if (i === 0) {
                for (
                    let j = prevMonthDaysLength - firstDay + 1;
                    j <= prevMonthDaysLength;
                    j++
                ) {
                    const prev = this.getPreviousMonthAndYear(
                        monYear.month,
                        monYear.year
                    );
                    week.push({
                        day: j,
                        month: prev.month,
                        year: prev.year,
                        otherMonth: true,
                        today: this.isToday(today, j, prev.month, prev.year),
                        selectable: this.isSelectable(j, prev.month, prev.year)
                    });
                }

                const remainingDaysLength = 7 - week.length;
                for (let j = 0; j < remainingDaysLength; j++) {
                    week.push({
                        day: dayNo,
                        month: monYear.month,
                        year: monYear.year,
                        today: this.isToday(today, dayNo, monYear.month, monYear.year),
                        selectable: this.isSelectable(dayNo, monYear.month, monYear.year)
                    });
                    dayNo++;
                }
            } else {
                for (let j = 0; j < 7; j++) {
                    if (dayNo > daysLength) {
                        const next = this.getNextMonthAndYear(monYear.month, monYear.year);
                        week.push({
                            day: dayNo - daysLength,
                            month: next.month,
                            year: next.year,
                            otherMonth: true,
                            today: this.isToday(
                                today,
                                dayNo - daysLength,
                                next.month,
                                next.year
                            ),
                            selectable: this.isSelectable(
                                dayNo - daysLength,
                                next.month,
                                next.year
                            )
                        });
                    } else {
                        week.push({
                            day: dayNo,
                            month: monYear.month,
                            year: monYear.year,
                            today: this.isToday(today, dayNo, monYear.month, monYear.year),
                            selectable: this.isSelectable(dayNo, monYear.month, monYear.year)
                        });
                    }

                    dayNo++;
                }
            }

            dates.push(week);
        }

        return dates;
    }

    getFirstDayOfMonthIndex(month: number, year: number) {
        const day = new Date();
        day.setDate(1);
        day.setMonth(month);
        day.setFullYear(year);

        const dayIndex = day.getDay() + this.getSundayIndex();
        return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    }

    getDaysCountInMonth(month: number, year: number) {
        return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
    }

    getDaysCountInPrevMonth(month: number, year: number) {
        const prev = this.getPreviousMonthAndYear(month, year);
        return this.getDaysCountInMonth(prev.month, prev.year);
    }

    getPreviousMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 0) {
            m = 11;
            y = year - 1;
        } else {
            m = month - 1;
            y = year;
        }

        return {month: m, year: y};
    }

    getNextMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 11) {
            m = 0;
            y = year + 1;
        } else {
            m = month + 1;
            y = year;
        }

        return {month: m, year: y};
    }

    getSundayIndex() {
        return this.locale.firstDayOfWeek > 0 ? 7 - this.locale.firstDayOfWeek : 0;
    }

    daylightSavingAdjust(date) {
        if (!date) {
            return null;
        }

        date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);

        return date;
    }

    isToday(today, day, month, year): boolean {
        return (
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year
        );
    }

    isSelectable(day, month, year): boolean {
        let validMin = true;
        let validMax = true;

        if (this.min) {
            if (this.min.getFullYear() > year) {
                validMin = false;
            } else if (this.min.getFullYear() === year) {
                if (this.min.getMonth() > month) {
                    validMin = false;
                } else if (this.min.getMonth() === month) {
                    if (this.min.getDate() > day) {
                        validMin = false;
                    }
                }
            }
        }

        if (this.max) {
            if (this.max.getFullYear() < year) {
                validMax = false;
            } else if (this.max.getFullYear() === year) {
                if (this.max.getMonth() < month) {
                    validMax = false;
                } else if (this.max.getMonth() === month) {
                    if (this.max.getDate() < day) {
                        validMax = false;
                    }
                }
            }
        }

        return validMin && validMax;
    }

    downloadFiles(param: any) {
        this['file_' + param] = false;
        const a = document.createElement('a');
        a.target = '_parent';
        a.href = this.docsfile[param][1];
        (document.body || document.documentElement).appendChild(a);
        a.click();
        a.parentNode.removeChild(a);
    }

    targetUserIdChanged() {
        this.contactsWithoutAgreement = [];
        this.contactsWithoutAgreementNames = '';
        if (this.contacts && this.contacts.length) {
            const contactSelected = this.contacts.find(
                (it) => this.docToSend.form.value.targetUserId === it.companyContactId
            );
            if (contactSelected) {
                this.docToSend.form.patchValue({
                    toMail: contactSelected.email
                });
            }
            const agreementConfirmationDateTrue = this.contacts.filter(
                (it) =>
                    !it.agreementConfirmationDate &&
                    this.docToSend.form.value.targetUserId === it.companyContactId
            );
            if (agreementConfirmationDateTrue.length) {
                this.contactsWithoutAgreement.push(agreementConfirmationDateTrue[0]);
                this.contactsWithoutAgreementNames = agreementConfirmationDateTrue.map(
                    (it) => it.firstName
                );
                // this.docToSend.form.patchValue({
                //     sendType: 'WHATSAPP'
                // });
            }
        }
    }

    openContactModal(company: any) {
        this.contactsModal = null;
        this.selectedCompany = company;
        this.showContactModal = true;
    }

    getPageHeightFunc(value: any) {
        return getPageHeight(value);
    }

    private rebuildSourceProgramIdMap(withOtherFiltersApplied: any[]): void {
        const sourceProgramIdMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.sourceProgramId &&
                        dtRow.sourceProgramId.toString() &&
                        !acmltr[dtRow.sourceProgramId.toString()]
                    ) {
                        acmltr[dtRow.sourceProgramId.toString()] = {
                            val: this.translate.translations[this.translate.currentLang]
                                .sourcePrograms[dtRow.sourceProgramId.toString()],
                            id: dtRow.sourceProgramId.toString(),
                            checked: true
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.sourceProgramId.toString()].checked
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
        this.sourceProgramIdArr = Object.values(sourceProgramIdMap);
        console.log('this.sourceProgramIdArr => %o', this.sourceProgramIdArr);
    }

    private toMonths(mon: number, year: number): number {
        if (mon < 0) {
            mon = mon + 12;
            year -= 1;
        } else if (mon >= 12) {
            mon = mon % 12;
            year += 1;
        }
        return year * 12 + mon;
    }

    private rebuildLists(): void {
        this.years = [];
        for (let i = this.allowed.from.year; i <= this.allowed.till.year; i++) {
            this.years.push(i);
        }
    }

    private rebuildConstraints() {
        this.allowed = {
            from: new RangePoint(
                this.min.getDate(),
                this.min.getMonth(),
                this.min.getFullYear()
            ),
            till: new RangePoint(
                this.max.getDate(),
                this.max.getMonth(),
                this.max.getFullYear()
            )
        };

        this.rebuildLists();

        this.current = {
            from:
                this.selection && this.selection.from
                    ? {
                        month: this.selection.from.month,
                        year: this.selection.from.year
                    }
                    : {
                        month: this.allowed.from.month,
                        year: this.allowed.from.year
                    },
            till:
                this.selection && this.selection.till
                    ? {
                        month: this.selection.till.month,
                        year: this.selection.till.year
                    }
                    : {
                        month: this.allowed.till.month,
                        year: this.allowed.till.year
                    }
        };
        this.currentDates = {
            from: this.createMonth(this.current.from),
            till: this.createMonth(this.current.till)
        };
    }

    private setMinDateAndRebuildConstraints(dt: Date | number | null) {
        if (typeof dt === 'number') {
            this.min = this.userService.appData
                .moment(this.max)
                .subtract(6, 'months')
                .toDate();
        } else if (dt instanceof Date) {
            this.min = dt;
        } else {
            this.min = this.userService.appData
                .moment(this.max)
                .subtract(6, 'months')
                .toDate();
        }

        this.rebuildConstraints();
    }

    ccardTransMatchPeulot(companyAccountId) {
        this.sharedService.ccardTransMatchPeulot(companyAccountId)
            .subscribe();
    }

    currencyTooltipText(company): string {
        const text = company.currencyName + ' - ' + company.currencyString;
        return company.bankSnifId ? text.concat("\n" + "סניף " + company.bankSnifId) : text;
    }

    shouldShowBalanceCheckAdmin(company): boolean {
        return company.izuCustId && company.izuCustId !== "לא משוייך כרטיס" &&
            company.lastExportStatus && company.lastExportStatus !== "OK" &&
            company.lastExportStatus !== "WAIT_TO_EXPORT" &&
            company.lastExportStatus !== "IN_TEST";
    }

    hashBankPopup(company, companyParent) {
        this.sharedService
            .getHashBankInfo({
                companyId: companyParent.companyId,
                accountKey: company.izuCustId,
                pageNum: 0
            })
            .subscribe((response) => {
                this.hashBankDetails = response ? response['body'] : response;
            })
        this.companyForHashBankPopup = company;
        this.companyForHashBankPopup.companyName = companyParent.companyName;
        this.companyForHashBankPopup.companyHp = companyParent.companyHp;
    }
    paginateHashBankPopup(event: any, companyId: string) {
        const nextRequestPage = event.page;
        this.sharedService
            .getHashBankInfo({
                companyId: companyId,
                accountKey: this.companyForHashBankPopup.izuCustId,
                pageNum: nextRequestPage
            })
            .subscribe((response) => {
                this.hashBankDetails = response ? response['body'] : response;
            })
    }
}
