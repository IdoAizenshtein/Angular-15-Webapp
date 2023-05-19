/* tslint:disable:member-ordering no-inferrable-types max-line-length comment-format */
import {AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {ActivatedRoute, Router} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {SharedService} from '@app/shared/services/shared.service';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {debounceTime, distinctUntilChanged, filter, finalize, first, map, startWith, switchMap, take, takeUntil, tap, retry} from 'rxjs/operators';
import {BehaviorSubject, EMPTY, interval, lastValueFrom, Observable, Subject, Subscription, timer, zip} from 'rxjs';
import {FormControl} from '@angular/forms';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {DatePipe} from '@angular/common';
import {TranslateService} from '@ngx-translate/core';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import jsPDF from 'jspdf';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {OverlayPanel} from 'primeng/overlaypanel';
import {JournalTransComponent} from '../journal-trans.component';
import {FileStatus} from '@app/accountants/companies/shared/file-status.model';
import {AccountantsDocComponent} from '@app/accountants/companies/shared/accountants-doc/accountants-doc.component';
import {SelectItem} from 'primeng/api';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {SelectItemGroup} from 'primeng/api/selectitemgroup';
import {ReloadServices} from '@app/shared/services/reload.services';
import {
    NewDocsAvailablePromptComponent
} from '@app/accountants/companies/shared/new-docs-available-prompt/new-docs-available-prompt.component';
import {roundAndAddComma} from '@app/shared/functions/addCommaToNumbers';
import {takeWhileInclusive} from '@app/shared/functions/takeWhileInclusive';
import {BrowserService} from '@app/shared/services/browser.service';
import {ReportService} from '@app/core/report.service';
import {getPageHeight} from '@app/shared/functions/getPageHeight';
import {MessagesService} from '@app/core/messages.service';
import {HelpCenterService} from '@app/customers/help-center/help-center.service';

@Component({
    templateUrl: './suppliers-and-customers.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SuppliersAndCustomersComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    public vatOptions = [
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
    @ViewChild(AccountantsDocComponent)
    childAccountantsDoc: AccountantsDocComponent;
    @ViewChildren('tooltipEdit') tooltipEditRef: OverlayPanel;
    public subscriptionTime: Subscription;
    public documentsData: any = false;
    public documentsDataSaveForFilter: any = [];
    public titleQuickApproveArrayOpened: any = true;
    public documentsDataSave: any = false;
    public pettyIsOpened: any = false;
    public showFloatNav: any = false;
    public fileStatus: string = 'WAIT_FOR_CONFIRM';
    public countStatusData: any = false;
    public countStatusDataFixed: any = false;
    public typeOfStatus: any;
    public showModalTransType: any = false;
    public subscriptionStatus: Subscription;
    public loader = false;
    public allTransData = [];
    public queryString = '';
    public zoomCube: number = 1;
    public filterInput: FormControl = new FormControl();
    public companyFilesSortControl: FormControl = new FormControl({
        orderBy: 'dateCreated',
        order: 'DESC'
    });
    public setForLogicAfterUpload = false;
    public selectTypeNotPetty = false;
    public viewAsList: boolean;
    public selcetAllFiles = false;
    public filterTypesSupplierHp: any = null;
    public filterTypesOppositeCust: any = null;
    public filterTypesIndex: any = null;
    public filterTypesTransTypeCode: any = null;
    public filterTypesEdit: any = null;
    public searchableListTypes = ['index', 'note', 'supplierHp', 'flag'];
    public editArr: any[];
    public supplierHpArr: any[];
    public indexArr: any[];
    public transTypeCodeArr: any[];
    public data_overlayPanel: any[] = [];
    public oppositeCustArr: any[];
    public postponed: {
        action: Observable<any>;
        message: SafeHtml;
        fired?: boolean;
    };
    public forLogic: {
        message: SafeHtml;
        fired?: boolean;
    };
    public tooltipEditFile: any;
    public tooltipEditParentFile: any;
    public elemToEdit: any;
    public showDocumentStorageDataFired = false;
    public sidebarImgs: any = false;
    public timeFireHover: any = false;
    public active = false;
    public subscription: Subscription;
    public finishedLoadedImgView = false;
    public imageScaleNewInvoice: number = 1;
    public degRotateImg: number = 0;
    public window: any = window;
    public innerHeight: any = window.innerHeight;
    public ocrExportFileToRemove: any = false;
    public monthsJournalTransArr: any[];
    public quickApproveArr: any[];
    public maamPrcArr: any[];
    public filterTypesMonthsJournalTrans: any = null;
    public filterTypesMaamPrc: any = null;
    public filterTypesQuickApprove: any = null;
    public filterTypesEditJournalTrans: any = null;
    public journalTransData: any = false;
    public journalTransDataSave: any = false;
    public scrollContainerHasScroll = false;
    @ViewChild('scrollContainerVirtual') scrollContainerVirtual: ElementRef<HTMLElement>;

    public fileToRemove: any = false;
    public mergeFiles = false;
    public selectedItem: any;
    public draggedIndex: number = -1;
    public onDragOverIndex: number = -1;
    public vatList = [];
    public showModalChangeMaamMonth: any = false;
    public selectedValueMaam: any = null;
    public showDocumentListStorageDataFired = false;
    public showDocumentListStorageDataFile: any = false;
    currencySign: any = false;
    public currencyList: any = [];
    readonly currencyList$: Observable<Array<SelectItemGroup>>;
    public rate = 0;
    isMatah = false;
    public companyCustomerDetails: any = false;
    public sidebarImgsDescList: any = false;
    public fileIdToScroll: any = false;
    public fileIdToToActive: any = false;
    public isRun = false;
    public printData: any = false;
    @ViewChild('elemToPrint') elemToPrint: HTMLElement;
    public interval$: BehaviorSubject<number> = new BehaviorSubject(
        2 * 60 * 1000
    );
    @ViewChildren('rowForScroll', {read: ElementRef})
    _rowForScroll: QueryList<ElementRef>;
    @ViewChild('scroll') scrollContainer: ElementRef;
    public exportFileCancelPrompt: {
        approveSubscription?: Subscription;
        visible: boolean;
        pending: boolean;
        approve: () => void;
        decline: () => void;
        prompt: string;
    };
    public enabledDownloadLink: boolean = true;

    public docsfile: any = null;
    public enabledDownloadLink_docfile: boolean = true;
    public enabledDownloadLink_paramsfile: boolean = true;
    public exportFileFolderCreatePrompt: {
        alertDownloadedOneFileOnly?: boolean;
        approveSubscription?: Subscription | any;
        visible: boolean;
        pending: boolean;
        prompt: string;
        onAnchorClick: () => void;
        onHide: () => void;
        cancelFile: () => void;
        manualDownloadLink: () => void;
    };
    public readonly FOLDER_REPAIR_URL =
        'https://deployment.bizibox.biz/test/WizSetup.msi';
    public showNote: FormControl = new FormControl(true);
    public parentManualCustIdsArray: any = false;
    public responseRestPath: any = false;
    public showModalCheckFolderFile: any = false;
    public ocrExportFileId: any;
    scrollSubscription = Subscription.EMPTY;
    virtualScrollSaved: any = null;
    private readonly dtPipe: DatePipe;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        public override sharedComponent: SharedComponent,
        private sharedService: SharedService,
        private helpCenterService: HelpCenterService,
        private ocrService: OcrService,
        private filterPipe: FilterPipe,
        private http: HttpClient,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public translate: TranslateService,
        private messagesService: MessagesService,
        private storageService: StorageService,
        public journalTransComponent: JournalTransComponent,
        private sumPipe: SumPipe,
        public reportService: ReportService,
        public snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        public router: Router
    ) {
        super(sharedComponent);

        this.currencyList = [];
        this.sharedService.getCurrencyList().subscribe((responseCurr) => {
            this.currencyList = responseCurr ? responseCurr['body'] : responseCurr;
        });

        const saved_showNote =
            this.storageService.localStorageGetterItem('showNote');
        this.showNote.patchValue(!saved_showNote || 'true' === saved_showNote, {
            emitEvent: false,
            onlySelf: true
        });
        this.storageService.localStorageSetter('showNote', this.showNote.value);

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
                if (
                    this.userService.appData.userData.companySelect.supplierJournalItem
                ) {
                    this.isRun = true;
                    this.countStatusDataFixed = false;
                    const suppliersAndCustomersStatus =
                        this.storageService.sessionStorageGetterItem(
                            'suppliersAndCustomersStatus'
                        );
                    if (suppliersAndCustomersStatus !== null) {
                        this.storageService.localStorageSetter(
                            'suppliersAndCustomersViewAsList',
                            'true'
                        );
                        if (suppliersAndCustomersStatus === 'WAIT_FOR_CARE') {
                            this.viewAsList = false;
                        } else {
                            this.viewAsList = true;
                        }
                        this.storageService.localStorageSetter(
                            'suppliersAndCustomersViewAsList',
                            String(this.viewAsList)
                        );
                        this.fileStatus = suppliersAndCustomersStatus;
                        this.storageService.localStorageSetter(
                            'suppliersAndCustomersFileStatus',
                            String(this.fileStatus)
                        );

                        this.storageService.sessionStorageRemoveItem(
                            'suppliersAndCustomersStatus'
                        );
                    } else {
                        const suppliersAndCustomersFileStatus =
                            this.storageService.localStorageGetterItem(
                                'suppliersAndCustomersFileStatus'
                            );
                        if (suppliersAndCustomersFileStatus !== null) {
                            this.fileStatus = suppliersAndCustomersFileStatus;
                        } else {
                            this.fileStatus = 'WAIT_FOR_CONFIRM';
                            this.storageService.localStorageSetter(
                                'suppliersAndCustomersFileStatus',
                                String(this.fileStatus)
                            );
                        }
                    }

                    this.countStatusAll(true);
                }
            });
        // this.subscription = this.sharedComponent.getDataEvent.subscribe((value) => {
        //
        // });
        // if (this.userService.appData.userData.companySelect && !this.isRun) {
        //   // this.sharedComponent.getDataEvent.next(true);
        // }

        this.dtPipe = new DatePipe('en-IL');
        const suppliersAndCustomersViewAsList =
            this.storageService.localStorageGetterItem(
                'suppliersAndCustomersViewAsList'
            );
        this.viewAsList = suppliersAndCustomersViewAsList
            ? suppliersAndCustomersViewAsList === 'true'
            : true;

        this.filterInput.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((term) => {
                this.queryString = term;
                if (this.fileStatus !== 'CREATE_JOURNAL_TRANS') {
                    this.filtersAll();
                } else {
                    this.filtersAllJournalTransData();
                }
            });

        this.ocrService.getCurrencyList().subscribe((currencies) => {
            this.currencyList = currencies;
        });
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        // event.preventDefault();
        // event.stopPropagation();
        if (
            (event.ctrlKey || event.metaKey) &&
            (event.code === 'KeyA')
        ) {
            if (!this.viewAsList && !this.journalTransComponent.docNote.visible) {
                this.selcetAllFiles = !this.selcetAllFiles;
                this.selecteAllFilesEvent();
                return false;
            }
        }
        return true;
    }

    override reload() {
        if (this.journalTransComponent.fileScanView) {
            return;
        }
        console.log('reload child');
        this.countStatusAll(true);
    }

    ngOnInit(): void {
        this.showNote.valueChanges
            .pipe(debounceTime(100), distinctUntilChanged())
            .subscribe((check) => {
                this.storageService.localStorageSetter('showNote', this.showNote.value);
                if (this.scrollContainer && this.scrollContainer.nativeElement) {
                    this.scrollContainer.nativeElement.scrollTop = 0;
                }
                this.getCompanyDocumentsData(true);
                // console.log('this.showNote.value', this.showNote.value);
            });
    }

    ngAfterViewInit(): void {
        const savedFile = this.storageService.sessionStorageGetterItem(
            'accountants-doc-open'
        );
        if (savedFile) {
            this.goToInvoice(JSON.parse(savedFile));
        }
    }

    createLeadOcr() {
        this.sharedService
            .createLeadOcr({
                fullName: this.userService.appData.userDataAdmin.userName,
                phone: this.userService.appData.userDataAdmin.phone,
                leadSource: 'ocr'
            })
            .subscribe(() => {
                if (
                    this.userService.appData.userData.companySelect &&
                    this.userService.appData.userData.companySelect.companyId
                ) {
                    this.storageService.localStorageSetter(
                        'goToCompanyProducts',
                        this.userService.appData.userData.companySelect.companyId
                    );
                }
                this.router.navigate(['/accountants/companies/companyProducts'], {
                    queryParamsHandling: 'preserve'
                });
            });
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

    getPageHeightFunc(value: any) {
        return getPageHeight(value);
    }

    countStatusAll(loadData?: boolean) {
        this.countStatusData = false;
        if (this.subscriptionStatus) {
            this.subscriptionStatus.unsubscribe();
        }
        this.journalTransComponent.reportService.forLogic = null;

        this.sharedService
            .countStatus(
                Object.assign(
                    {
                        uuid: this.userService.appData.userData.companySelect.companyId,
                        showNote: this.showNote.value === true ? 1 : 0
                    },
                    this.fileStatus === 'WAIT_FOR_CARE'
                        ? {
                            showNote: this.showNote.value === true ? 1 : 0
                        }
                        : {}
                )
            )
            .subscribe((response: any) => {
                this.countStatusDataFixed = response ? response['body'] : response;

                if (loadData) {
                    this.typeOfStatus =
                        this.countStatusDataFixed['transTypeStatus'] === null ||
                        this.countStatusDataFixed['transTypeStatus'] === 'NOT_INTERESTED'
                            ? 'maamPrc'
                            : 'transTypeCode';
                    this.startChild();
                }

                this.countStatusDataFixed.forConfirmBase =
                    this.countStatusDataFixed.forConfirm;
                if (this.countStatusDataFixed.transTypeStatus === 'NOT_DEFINED') {
                    this.showModalTransType = true;
                }
                this.handleCountStatusResponse(response);

                // if (response['body'].forLogic > 0) {
                //     this.journalTransComponent.reportService.forLogic = {
                //         message: this.domSanitizer.bypassSecurityTrustHtml(
                //             '<p>' +
                //             (response['body'].forLogic === 1
                //                 ? 'מסמך ממתין לפיענוח'
                //                 : (response['body'].forLogic + ' מסמכים ממתינים לפיענוח'))
                //             + '</p>'
                //         ),
                //         fired: false
                //     };
                // } else {
                //     this.journalTransComponent.reportService.forLogic = null;
                // }
                // this.interval$.next((this.countStatusDataFixed.forLogic === 0 && !this.setForLogicAfterUpload ? (2 * 60 * 1000) : (5 * 1000)));

                this.countStatus();
            });
    }

    printContent(contentRoot: any): void {
        //BrowserService.printPdf(contentRoot, 'ספקים ולקוחות');
    }

    changeView(viewAsList: string): void {
        this.viewAsList = viewAsList === 'list';
        this.storageService.localStorageSetter(
            'suppliersAndCustomersViewAsList',
            String(this.viewAsList)
        );
        this.startChild();
    }

    onScrollCubes(i?: number): void {
        this.tooltipEditRef['_results'].forEach((it, idx) => {
            if (i !== undefined && idx !== i) {
                it.hide();
            }
            if (i === undefined) {
                it.hide();
            }
        });
    }

    onScroll11() {
        console.log('scrolled!!');
    }

    resetVars(): void {
        this.isRun = false;
        this.loader = false;
        this.showModalCheckFolderFile = false;
        if (!this.storageService.sessionStorageGetterItem('accountants-doc-open')) {
            this.journalTransComponent.fileScanView = false;
        }
        //this.countStatusDataFixed = false;
        this.documentsDataSave = false;
        this.documentsData = false;
        //this.fileStatus = 'WAIT_FOR_CONFIRM';
        this.supplierHpArr = [];
        this.indexArr = [];
        this.transTypeCodeArr = [];
        this.oppositeCustArr = [];
        this.filterTypesSupplierHp = null;
        this.filterTypesOppositeCust = null;
        this.filterTypesIndex = null;
        this.filterTypesTransTypeCode = null;
        this.filterTypesEdit = null;
        this.editArr = [];
        this.showFloatNav = false;
        this.companyFilesSortControl = new FormControl({
            orderBy:
                this.fileStatus !== 'CREATE_JOURNAL_TRANS' ? 'dateCreated' : null,
            order: 'DESC'
        });
        this.selcetAllFiles = false;
        this.tooltipEditFile = null;
        this.tooltipEditParentFile = null;
        this.showDocumentStorageDataFired = false;
        this.sidebarImgs = false;
        this.timeFireHover = false;
        this.finishedLoadedImgView = false;
        this.queryString = '';
        this.filterInput.reset('', {
            emitEvent: false,
            onlySelf: true
        });
        this.ocrExportFileToRemove = false;
        this.monthsJournalTransArr = [];
        this.quickApproveArr = [];
        this.maamPrcArr = [];
        this.filterTypesMonthsJournalTrans = null;
        this.filterTypesEditJournalTrans = null;
        this.journalTransData = false;
        this.journalTransDataSave = false;
    }

    downloadFiles(param: any) {
        this[param] = false;
        if (this.docsfile) {
            const a = document.createElement('a');
            a.target = '_parent';
            a.href = param === 'enabledDownloadLink_docfile'
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
                    map((response: any) => {
                       if (response.status === 206) {
                           throw response;
                       }
                       return response;
                    }),
                    retry(3),
                    map((response: any) => {
                        if (!!response) {
                            if (response.status === 500) {
                                throw response;
                            }
                            return response.error || response.body;
                        }
                        return null;
                    }),
                    first()
                )
                .subscribe({
                        next: (docfile) => {
                            this.enabledDownloadLink = true;
                            if (docfile) {
                                this.docsfile = docfile;
                                const a = document.createElement('a');
                                a.target = '_parent';
                                a.href = param === 'enabledDownloadLink_docfile'
                                    ? this.docsfile.docfile
                                    : this.docsfile.paramsfile;
                                (document.body || document.documentElement).appendChild(a);
                                a.click();
                                a.parentNode.removeChild(a);
                            }
                        },
                        error: async (err: HttpErrorResponse) => {
                            this.responseRestPath = true;
                            this.showModalCheckFolderFile = 'ERROR';
                            const userData = this.userService.appData.isAdmin
                                ? this.userService.appData.userDataAdmin
                                : this.userService.appData.userData;

                            this.sharedService.cancelFile(this.ocrExportFileId).subscribe(() => {});

                            let serviceCallRequest = {
                                'closeMailToSend': userData.mail,
                                'companyId': this.userService.appData.userData.companySelect.companyId,
                                'taskDesc': 'כישלון בתהליך הורדת קובץ',
                                'taskOpenerName': userData.userName,
                                'userCellPhone': userData.phone,
                                'companyName': this.userService.appData.userData.companySelect.companyName,
                                'taskTitle': 'כישלון בתהליך הורדת קובץ'
                            };
                            serviceCallRequest['gRecaptcha'] = await this.userService.executeAction('open-ticket');
                            this.helpCenterService
                                .requestOpenTicket(serviceCallRequest)
                                .subscribe((resp) => {
                                });

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

    startChild(): void {
        this.resetVars();
        console.log(
            '---------------------SuppliersAndCustomersComponent-----------------'
        );

        if (this.fileStatus !== 'CREATE_JOURNAL_TRANS') {
            if (this.fileStatus === 'WAIT_FOR_CARE') {
                this.viewAsList = false;
            }
            this.getCompanyDocumentsData(true);
        } else {
            this.getExportFiles(true);
        }
    }

    public openNote(note, $event, file) {
        const rect = $event.target.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        file.isBottom = window.innerHeight - (rect.top + scrollTop) < 140;
        console.log('isBottom', file.isBottom);
        this.tooltipEditFile = file;
        note.show($event);
    }

    public openOverlayPanel(
        panel,
        $event,
        data,
        is_maamComponentsArray?: boolean
    ) {
        // const rect = $event.target.getBoundingClientRect();
        // const scrollTop = window.scrollY || document.documentElement.scrollTop;
        // file.isBottom = (window.innerHeight - (rect.top + scrollTop)) < 140;
        // console.log('isBottom', file.isBottom);
        if (is_maamComponentsArray) {
            data
                .filter((it) => it.custMaam)
                .forEach((it) => {
                    if (!it.custMaam) {
                        it.custMaamText = 'ללא מע״מ';
                    } else {
                        const custData = this.userService.appData.userData
                            .companyCustomerDetails.all
                            ? this.userService.appData.userData.companyCustomerDetails.all.find(
                                (custIdxRec) => custIdxRec.custId === it.custMaam
                            )
                            : null;
                        if (custData) {
                            it.custMaamText = custData.lName;
                        } else {
                            it.custMaamText = 'ללא מע״מ';
                        }
                    }
                });
        }

        this.data_overlayPanel = data;
        panel.show($event);
    }

    filterCategory(type: any) {
        console.log('----------------type-------', type);
        if (type.type === 'oppositeCust') {
            this.filterTypesOppositeCust = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'index') {
            this.filterTypesIndex = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'transTypeCode') {
            this.filterTypesTransTypeCode = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'maamPrc') {
            this.filterTypesMaamPrc = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'edit') {
            this.filterTypesEdit = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'quickApprove') {
            this.filterTypesQuickApprove = type.checked;
            this.filtersAll(type.type);
        }
        // if (type.type === 'supplierHp') {
        //     this.filterTypesSupplierHp = type.checked;
        //     this.filtersAll(type.type);
        // }
    }

    filterCategoryJournalTransData(type: any) {
        console.log('----------------type-------', type);
        if (type.type === 'maamMonth') {
            this.filterTypesMonthsJournalTrans = type.checked;
            this.filtersAllJournalTransData(type.type);
        } else if (type.type === 'maamPrc') {
            this.filterTypesMaamPrc = type.checked;
            this.filtersAllJournalTransData(type.type);
        } else if (type.type === 'transTypeCode') {
            this.filterTypesTransTypeCode = type.checked;
            this.filtersAllJournalTransData(type.type);
        } else if (type.type === 'edit') {
            this.filterTypesEditJournalTrans = type.checked;
            this.filtersAllJournalTransData(type.type);
        }
    }

    async onLoad(file: any): Promise<any> {
        if (!file.urlImgProgress && !file.urlImg) {
            file.urlImgProgress = true;

            const res: any = await lastValueFrom(this.sharedService
                .getDocumentStorageData([file.fileId]));

            if (
                res &&
                res['body'] &&
                res['body'][file.fileId] &&
                res['body'][file.fileId].length
            ) {
                const contentUrl = res['body'][file.fileId][0].contentUrl;
                // const x: any = await this.getFile(contentUrl);
                // const imageBase64 = await this.createImageBase64FromBlob(x);
                file.urlImg = contentUrl;
                file.multipaged =
                    res &&
                    res['body'] &&
                    res['body'][file.fileId] &&
                    res['body'][file.fileId].length > 1;
                if (file.multipaged) {
                    file.pages = res['body'][file.fileId];
                    // file.pages = [of(file.urlImg),
                    //     ...res['body'][file.fileId].slice(1)
                    //         .map(pageUrl => this.httpClient.get(
                    //             contentUrl, {
                    //                 responseType: 'blob'
                    //             })
                    //             .pipe(
                    //                 switchMap(imgData => fromPromise(this.createImageBase64FromBlob(imgData)))
                    //             )
                    //         )
                    // ];
                }
                return contentUrl;
            }
            if (res && res.error) {
                return new Promise((resolve, reject) => {
                    file.finishedLoaded = true;
                    resolve('');
                });
            }
        }
        return new Promise((resolve, reject) => {
            resolve('');
        });
    }

    filtersAll(priority?: any, isSorted?: boolean): void {
        if (
            this.documentsDataSave &&
            Array.isArray(this.documentsDataSave) &&
            this.documentsDataSave.length
        ) {
            this.documentsData = !this.queryString
                ? this.documentsDataSave
                : this.documentsDataSave.filter((fd) => {
                    return [
                        fd.name,
                        fd.totalIncludeMaam,
                        this.sumPipe.transform(fd.totalIncludeMaam),
                        this.dtPipe.transform(fd.dateCreated, 'dd/MM/yy'),
                        this.dtPipe.transform(fd.invoiceDate, 'dd/MM/y'),
                        fd.documentNum,
                        fd.asmachta,
                        // fd.supplierHp,
                        fd.cust,
                        fd.oppositeCust,
                        this.viewAsList
                            ? this.typeOfStatus === 'transTypeCode'
                                ? fd.transTypeCode
                                : this.translate.instant('vatOptions.' + fd.maamPrc)
                            : '',
                        this.fileStatus === 'WAIT_FOR_CARE' ? fd.folderName : '',
                        this.userService.appData && this.userService.appData.isAdmin
                            ? fd.uniqueId
                            : ''
                    ]
                        .filter(
                            (v) => (typeof v === 'string' || typeof v === 'number') && !!v
                        )
                        .some(
                            (vstr) =>
                                vstr.toString().includes(this.queryString) ||
                                vstr.toString().includes(this.queryString.toUpperCase()) ||
                                vstr.toString().includes(this.queryString.toLowerCase())
                        );
                });

            if (this.viewAsList) {
                // if (priority === 'supplierHp') {
                //     if (this.filterTypesSupplierHp && this.filterTypesSupplierHp.length) {
                //         this.documentsData = this.documentsData.filter((item) => {
                //             if (item.supplierHp) {
                //                 return this.filterTypesSupplierHp.some(it => it === item.supplierHp.toString());
                //             }
                //         });
                //     } else if (this.filterTypesSupplierHp && !this.filterTypesSupplierHp.length) {
                //         this.documentsData = [];
                //     }
                // }
                if (priority === 'oppositeCust') {
                    if (
                        this.filterTypesOppositeCust &&
                        this.filterTypesOppositeCust.length
                    ) {
                        this.documentsData = this.documentsData.filter((item) => {
                            if (item.oppositeCust || item.oppositeCust === null) {
                                return this.filterTypesOppositeCust.some(
                                    (it) => it === String(item.oppositeCust)
                                );
                            }
                        });
                    } else if (
                        this.filterTypesOppositeCust &&
                        !this.filterTypesOppositeCust.length
                    ) {
                        this.documentsData = [];
                    }
                }
                if (priority === 'index') {
                    if (this.filterTypesIndex && this.filterTypesIndex.length) {
                        this.documentsData = this.documentsData.filter((item) => {
                            if (item.cust || item.cust === null) {
                                return this.filterTypesIndex.some(
                                    (it) => it === String(item.cust)
                                );
                            }
                        });
                    } else if (this.filterTypesIndex && !this.filterTypesIndex.length) {
                        this.documentsData = [];
                    }
                }
                if (this.typeOfStatus === 'transTypeCode') {
                    if (priority === 'transTypeCode') {
                        if (
                            this.filterTypesTransTypeCode &&
                            this.filterTypesTransTypeCode.length
                        ) {
                            this.documentsData = this.documentsData.filter((item) => {
                                if (item.transTypeCode || item.transTypeCode === null) {
                                    return this.filterTypesTransTypeCode.some(
                                        (it) => it === String(item.transTypeCode)
                                    );
                                }
                            });
                        } else if (
                            this.filterTypesTransTypeCode &&
                            !this.filterTypesTransTypeCode.length
                        ) {
                            this.documentsData = [];
                        }
                    }
                }
                if (this.typeOfStatus === 'maamPrc') {
                    if (priority === 'maamPrc') {
                        if (this.filterTypesMaamPrc && this.filterTypesMaamPrc.length) {
                            this.documentsData = this.documentsData.filter((item) => {
                                if (item.maamPrc || item.maamPrc === null) {
                                    return this.filterTypesMaamPrc.some(
                                        (it) => it === String(item.maamPrc)
                                    );
                                }
                            });
                        } else if (
                            this.filterTypesMaamPrc &&
                            !this.filterTypesMaamPrc.length
                        ) {
                            this.documentsData = [];
                        }
                    }
                }
                if (priority === 'quickApprove') {
                    if (
                        this.filterTypesQuickApprove &&
                        this.filterTypesQuickApprove.length
                    ) {
                        this.documentsData = this.documentsData.filter((item) => {
                            if (item.quickApprove !== undefined) {
                                return this.filterTypesQuickApprove.some(
                                    (it) => it === String(item.quickApprove)
                                );
                            }
                        });
                    } else if (
                        this.filterTypesQuickApprove &&
                        !this.filterTypesQuickApprove.length
                    ) {
                        this.documentsData = [];
                    }
                }

                if (priority === 'edit') {
                    if (this.filterTypesEdit && this.filterTypesEdit.length) {
                        this.documentsData = this.documentsData.filter((item) => {
                            return this.filterTypesEdit.some((it) => {
                                if (it === 'flag' && item.flag) {
                                    return item;
                                }
                                if (it === 'note' && item.note !== null) {
                                    return item;
                                }
                                if (
                                    it === 'withoutMark' &&
                                    item.flag === false &&
                                    item.note === null
                                ) {
                                    return item;
                                }
                            });
                        });
                    } else if (this.filterTypesEdit && !this.filterTypesEdit.length) {
                        this.documentsData = [];
                    }
                }
                // if (priority !== 'supplierHp') {
                //     this.rebuildSupplierHpMap(this.documentsData);
                // }
                if (!isSorted) {
                    if (priority !== 'quickApprove') {
                        this.rebuildQuickApproveMap(this.documentsData);
                    }
                    if (priority !== 'oppositeCust') {
                        this.rebuildOppositeCustMap(this.documentsData);
                    }
                    if (priority !== 'index') {
                        this.rebuildIndexMap(this.documentsData);
                    }
                    if (priority !== 'edit') {
                        this.rebuildEditMap(this.documentsData);
                    }
                    if (this.typeOfStatus === 'transTypeCode') {
                        if (priority !== 'transTypeCode') {
                            this.rebuildTransTypeCodeMap(this.documentsData);
                        }
                    }
                    if (this.typeOfStatus === 'maamPrc') {
                        if (priority !== 'maamPrc') {
                            this.rebuildMaamPrcMap(this.documentsData);
                        }
                    }
                } else {
                    if (
                        this.filterTypesQuickApprove &&
                        this.filterTypesQuickApprove.length
                    ) {
                        this.documentsData = this.documentsData.filter((item) => {
                            if (item.quickApprove !== undefined) {
                                return this.filterTypesQuickApprove.some(
                                    (it) => it === String(item.quickApprove)
                                );
                            }
                        });
                    }
                    if (
                        this.filterTypesOppositeCust &&
                        this.filterTypesOppositeCust.length
                    ) {
                        this.documentsData = this.documentsData.filter((item) => {
                            if (item.oppositeCust || item.oppositeCust === null) {
                                return this.filterTypesOppositeCust.some(
                                    (it) => it === String(item.oppositeCust)
                                );
                            }
                        });
                    }
                    if (this.filterTypesIndex && this.filterTypesIndex.length) {
                        this.documentsData = this.documentsData.filter((item) => {
                            if (item.cust || item.cust === null) {
                                return this.filterTypesIndex.some(
                                    (it) => it === String(item.cust)
                                );
                            }
                        });
                    }
                    if (this.typeOfStatus === 'transTypeCode') {
                        if (
                            this.filterTypesTransTypeCode &&
                            this.filterTypesTransTypeCode.length
                        ) {
                            this.documentsData = this.documentsData.filter((item) => {
                                if (item.transTypeCode || item.transTypeCode === null) {
                                    return this.filterTypesTransTypeCode.some(
                                        (it) => it === String(item.transTypeCode)
                                    );
                                }
                            });
                        }
                    }
                    if (this.typeOfStatus === 'maamPrc') {
                        if (this.filterTypesMaamPrc && this.filterTypesMaamPrc.length) {
                            this.documentsData = this.documentsData.filter((item) => {
                                if (item.maamPrc || item.maamPrc === null) {
                                    return this.filterTypesMaamPrc.some(
                                        (it) => it === String(item.maamPrc)
                                    );
                                }
                            });
                        }
                    }
                    if (this.filterTypesEdit && this.filterTypesEdit.length) {
                        this.documentsData = this.documentsData.filter((item) => {
                            return this.filterTypesEdit.some((it) => {
                                if (it === 'flag' && item.flag) {
                                    return item;
                                }
                                if (it === 'note' && item.note !== null) {
                                    return item;
                                }
                                if (
                                    it === 'withoutMark' &&
                                    item.flag === false &&
                                    item.note === null
                                ) {
                                    return item;
                                }
                            });
                        });
                    }
                }
            }

            if (this.documentsData.length > 1) {
                switch (this.companyFilesSortControl.value.orderBy) {
                    case 'dateCreated':
                        this.documentsData = [...this.documentsData].sort((a, b) => {
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
                        });
                        break;
                    case 'invoiceDate':
                    case 'totalIncludeMaam':
                    case 'documentNum':
                        // noinspection DuplicatedCode
                        const notNumber = this.documentsData.filter(
                            (fd) =>
                                typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                'number'
                        );
                        this.documentsData = this.documentsData
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
                            .concat(
                                notNumber.filter((fd) => !fd.noDataAvailable),
                                notNumber.filter((fd) => fd.noDataAvailable)
                            );
                        break;
                    case 'name':
                    case 'asmachta':
                        // noinspection DuplicatedCode
                        const notString = this.documentsData.filter(
                            (fd) =>
                                typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                'string'
                        );
                        this.documentsData = this.documentsData
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
                                    (this.companyFilesSortControl.value.order === 'DESC' ? -1 : 1)
                                );
                            })
                            .concat(
                                notString.filter((fd) => !fd.noDataAvailable),
                                notString.filter((fd) => fd.noDataAvailable)
                            );
                        break;
                }
            }

            const selcetedFiles = this.documentsData.filter((it) => it.selcetFile);
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedQuickApproveRows: selcetedFiles.every(
                        (file) => file.quickApprove && !file.titleQuickApproveArray
                    ),
                    selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                    selcetedFilesNote: selcetedFiles.every((file) => file.note)
                };
            } else {
                this.showFloatNav = false;
            }

            if (!this.viewAsList) {
                this.documentsData.forEach((fd, idx) => {
                    fd.idx = idx + 1;
                });
                this.documentsDataSave.forEach((fd, idx) => {
                    const currFile = this.documentsData.find(
                        (fdSaved) => fdSaved.fileId === fd.fileId
                    );
                    if (currFile) {
                        fd.idx = currFile.idx;
                    }
                });
                this.documentsDataSave.sort((a, b) => {
                    return a.idx - b.idx;
                });
                const grouped = this.groupBy(this.documentsData, (date) =>
                    this.dtPipe.transform(date.dateCreated, 'MM/yy')
                );
                this.documentsData = Array.from(grouped.values());
                console.log(this.documentsData);
            } else {
                // const quickApproveArrayRows = this.documentsData.filter(it => it.quickApprove);
                // const regularArrayRows = this.documentsData.filter(it => !it.quickApprove);
                //
                // if (regularArrayRows.length) {
                //     regularArrayRows[0].isFirst = true;
                // }
                // this.documentsData = [...quickApproveArrayRows, ...regularArrayRows];
                // if (quickApproveArrayRows.length) {
                //     this.documentsData.unshift({
                //         fileId: '000000000000',
                //         titleQuickApproveArray: true,
                //         numOfRows: quickApproveArrayRows.length,
                //         quickApproveArrayRow: true
                //     });
                // }
                this.documentsDataSaveForFilter = JSON.parse(
                    JSON.stringify(this.documentsData)
                );
                // if (!this.titleQuickApproveArrayOpened) {
                //     this.documentsData = this.documentsDataSaveForFilter.filter(it => !it.quickApprove || it.titleQuickApproveArray);
                // }
            }

            if (this.fileIdToScroll) {
                const fileIdToScroll = this.fileIdToScroll;
                this.fileIdToScroll = null;
                const isExistFileId = this.documentsData.findIndex(
                    (fd) => fd.fileId === fileIdToScroll
                );
                if (isExistFileId !== -1 && this.virtualScrollSaved) {
                    requestAnimationFrame(() => {
                        this.virtualScrollSaved.scrollToIndex(isExistFileId);
                    });
                }
                // if (isExistFileId) {
                //   setTimeout(() => {
                //     requestAnimationFrame(() => {
                //       this.runTimerScroll(
                //         this._rowForScroll.toArray().length - 1,
                //         fileIdToScroll
                //       );
                //     });
                //   }, 100);
                // }
            }
        } else {
            this.documentsData = [];
        }

        this.loader = false;
    }

    setFileStatus(fileId?: string) {
        const params = {
            filesId: fileId
                ? [fileId]
                : this.documentsDataSaveForFilter
                    .filter((it) => it.quickApprove && !it.titleQuickApproveArray)
                    .map((id) => id.fileId),
            fileStatus: 'CREATE_JOURNAL_TRANS',
            quickApprove: true
        };
        console.log(params);
        this.sharedService.updateOcrDocumentStatus(params).subscribe(() => {
            this.getCompanyDocumentsData(true);
        });
    }

    setFileStatusSelected() {
        const params = {
            filesId: this.showFloatNav.selcetedFiles.map((file) => file.fileId),
            fileStatus: 'CREATE_JOURNAL_TRANS',
            quickApprove: true
        };
        console.log(params);
        this.sharedService.updateOcrDocumentStatus(params).subscribe(() => {
            this.getCompanyDocumentsData(true);
        });
    }

    changeFilterRowsType() {
        this.titleQuickApproveArrayOpened = !this.titleQuickApproveArrayOpened;
        if (!this.titleQuickApproveArrayOpened) {
            this.documentsData = this.documentsDataSaveForFilter.filter(
                (it) => !it.quickApprove || it.titleQuickApproveArray
            );
        } else {
            this.documentsData = this.documentsDataSaveForFilter;
        }

        const selcetedFiles = this.documentsData.filter((it) => it.selcetFile);
        if (selcetedFiles.length > 1) {
            this.showFloatNav = {
                selcetedFiles,
                selcetedQuickApproveRows: selcetedFiles.every(
                    (file) => file.quickApprove && !file.titleQuickApproveArray
                ),
                selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                selcetedFilesNote: selcetedFiles.every((file) => file.note)
            };
        } else {
            this.showFloatNav = false;
        }
    }

    runTimerScroll(idx, fileIdToScroll) {
        const lastId = this.documentsData[this.documentsData.length - 1].fileId;
        this.subscriptionTime = timer(10, 100).subscribe((val) => {
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
                    this.subscriptionTime.unsubscribe();
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
                this.subscriptionTime.unsubscribe();
            }
        });
    }

    goToInvoice(file: any): void {
        if (this.viewAsList) {
            this.hideDocumentStorageData();
        }
        this.countStatusData = false;
        // if (this.subscriptionStatus) {
        //     this.subscriptionStatus.unsubscribe();
        // }
        this.snackBar.dismiss();
        this.journalTransComponent.fileScanViewOpen(file);
    }

    getMonthNum(date: any) {
        return Number(this.userService.appData.moment(date).format('M')) - 1;
    }

    toggleCompanyFilesOrderTo(field: string) {
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
        if (this.fileStatus !== 'CREATE_JOURNAL_TRANS') {
            this.filtersAll(undefined, true);
        } else {
            this.filtersAllJournalTransData(undefined, true);
        }
    }

    refreshBack($event?: any) {
        if ($event) {
            // this.countStatus();
            this.getCompanyDocumentsData(true);
        }
    }

    goToRow($event?: any) {
        if ($event) {
            const fileIdToScroll = $event.response;
            this.fileIdToScroll = fileIdToScroll;
            this.fileIdToToActive = fileIdToScroll;
            if ($event.fileStatus && $event.fileStatus === 'CREATE_JOURNAL_TRANS') {
                this.setStatus('CREATE_JOURNAL_TRANS');
            } else {
                if ($event.refresh) {
                    // this.countStatus();
                    this.getCompanyDocumentsData(true);
                } else {
                    if (!this.viewAsList) {
                        this.changeView('grid');
                    } else {
                        const suppliersAndCustomersViewAsList =
                            this.storageService.localStorageGetterItem(
                                'suppliersAndCustomersViewAsList'
                            );
                        if (
                            suppliersAndCustomersViewAsList &&
                            suppliersAndCustomersViewAsList !== 'true'
                        ) {
                            this.changeView('list');
                        }
                        const isExistFileId = this.documentsData.findIndex(
                            (fd) => fd.fileId === fileIdToScroll
                        );
                        if (isExistFileId !== -1 && this.virtualScrollSaved) {
                            requestAnimationFrame(() => {
                                this.virtualScrollSaved.scrollToIndex(isExistFileId);
                            });
                        }
                        // if (isExistFileId) {
                        //   setTimeout(() => {
                        //     requestAnimationFrame(() => {
                        //       this.runTimerScroll(
                        //         this._rowForScroll.toArray().length - 1,
                        //         fileIdToScroll
                        //       );
                        //     });
                        //   }, 100);
                        // }
                    }
                }
            }
        }
    }

    countStatus($event?: any): void {
        if ($event) {
            this.startChild();
        }
        if (this.subscriptionStatus) {
            this.subscriptionStatus.unsubscribe();
        }
        this.subscriptionStatus = this.interval$
            .pipe(
                switchMap((value) => interval(value)),
                filter(
                    () =>
                        this.userService.appData.userData.companySelect &&
                        this.userService.appData.userData.companySelect.companyId &&
                        !this.journalTransComponent.fileScanView
                ),
                switchMap(() =>
                    this.sharedService.countStatus(
                        Object.assign(
                            {
                                uuid: this.userService.appData.userData.companySelect.companyId,
                                showNote: this.showNote.value === true ? 1 : 0
                            },
                            this.fileStatus === 'WAIT_FOR_CARE'
                                ? {
                                    showNote: this.showNote.value === true ? 1 : 0
                                }
                                : {}
                        )
                    )
                ),
                takeUntil(this.destroyed$)
            )
            .subscribe((response: any) => this.handleCountStatusResponse(response));
    }

    getCompanyDocumentsData(isReset?: boolean, cb?: any): void {
        if (!isReset) {
            this.resetVars();
        }
        if (this.userService.appData.userData.companySelect) {
            this.loader = true;
            const paramsFiles = {
                companyId: this.userService.appData.userData.companySelect.companyId,
                fileStatus: this.fileStatus
            };
            if (this.fileStatus === 'WAIT_FOR_CARE') {
                paramsFiles['showNote'] = this.showNote.value === true ? 1 : 0;
                this.sharedService
                    .countStatus({
                        uuid: this.userService.appData.userData.companySelect.companyId,
                        showNote: paramsFiles['showNote']
                    })
                    .subscribe((response: any) => {
                        this.countStatusDataFixed = response ? response['body'] : response;
                        this.countStatusDataFixed.forConfirmBase =
                            this.countStatusDataFixed.forConfirm;
                        this.handleCountStatusResponse(response);
                    });
            }
            this.sharedService.getCompanyDocumentsData(paramsFiles).subscribe(
                (response: any) => {
                    const documentsDataSave = response ? response['body'] : response;
                    // const documentsDataSaveArrBuilder = [];
                    // if (documentsDataSave.quickApproveArray && Array.isArray(documentsDataSave.quickApproveArray) && documentsDataSave.quickApproveArray.length) {
                    //     for (const fd of documentsDataSave.quickApproveArray) {
                    //         fd.quickApproveArrayRow = true;
                    //     }
                    //     documentsDataSaveArrBuilder.push(...documentsDataSave.quickApproveArray);
                    // }
                    // if (documentsDataSave.regularArray && Array.isArray(documentsDataSave.regularArray) && documentsDataSave.regularArray.length) {
                    //     for (const fd of documentsDataSave.regularArray) {
                    //         fd.regularArrayRow = true;
                    //     }
                    //     documentsDataSaveArrBuilder.push(...documentsDataSave.regularArray);
                    // }
                    for (const fd of documentsDataSave) {
                        if (fd.quickApprove && !fd.duplicate) {
                            fd.quickApprove = true;
                        } else {
                            fd.quickApprove = false;
                        }
                    }
                    this.documentsDataSave = documentsDataSave;
                    // console.log(documentsDataSaveArrBuilder);
                    if (Array.isArray(this.documentsDataSave)) {
                        for (const fd of this.documentsDataSave) {
                            const code = this.currencyList.find(
                                (ite) => ite.id === fd.currencyCode
                            );
                            fd['sign'] = code ? code.sign : '₪';
                            fd.uploadSource = fd.uploadSource
                                ? fd.uploadSource.toLowerCase()
                                : fd.uploadSource;
                            fd.noDataAvailable =
                                typeof fd.invoiceDate !== 'number' &&
                                typeof fd.totalIncludeMaam !== 'number' &&
                                !fd.documentNum &&
                                !fd.documentType &&
                                !fd.name;
                            fd.documentNum = fd.documentNum
                                ? Number(fd.documentNum)
                                : fd.documentNum;
                            fd.asmachta =
                                fd.asmachta !== null ? String(fd.asmachta) : fd.asmachta;
                        }
                    } else {
                        this.documentsDataSave = [];
                    }
                    if (this.documentsDataSave && this.documentsDataSave.length) {
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
                    this.documentsData = JSON.parse(
                        JSON.stringify(this.documentsDataSave)
                    );
                    if (cb) {
                        cb(this.documentsDataSave);
                    }
                    this.filtersAll();
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

    deleteExportFile(ocrExportFile: any): void {
        this.journalTransComponent.reportService.postponed = {
            action: this.sharedService.deleteExportFile(
                ocrExportFile.ocrExportFileId
            ),
            message: this.journalTransComponent.sanitizer.bypassSecurityTrustHtml(
                ocrExportFile.numOfFiles +
                ' חשבוניות הועברו חזרה לסטטוס אישור והקובץ נמחק'
            ),
            fired: false
        };
        this.ocrExportFileToRemove = false;
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
                this.journalTransDataSave = this.journalTransDataSave.filter(
                    (fd) => fd.ocrExportFileId !== ocrExportFile.ocrExportFileId
                );
                this.filtersAllJournalTransData();
            });
    }

    deleteFile(): void {
        this.fileToRemove = false;
        this.journalTransComponent.reportService.postponed = {
            action: this.sharedService.deleteFile({
                deleteJournal: true,
                ids:
                    this.tooltipEditFile && this.tooltipEditFile.fileId
                        ? [this.tooltipEditFile.fileId]
                        : this.showFloatNav && this.showFloatNav.selcetedFiles.length
                            ? this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                            : [null]
            }),
            message: this.journalTransComponent.sanitizer.bypassSecurityTrustHtml(
                (this.tooltipEditFile && this.tooltipEditFile.fileId) ||
                (this.showFloatNav && this.showFloatNav.selcetedFiles.length === 1)
                    ? 'המסמך נמחק בהצלחה'
                    : this.showFloatNav.selcetedFiles.length + ' מסמכים נמחקו בהצלחה'
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
                this.getExportFiles(true);
            });
    }

    updateOcrDocumentStatus(): void {
        const paramsToSend = {
            fileStatus: FileStatus.WAIT_FOR_CONFIRM,
            filesId:
                this.showFloatNav && !this.tooltipEditFile
                    ? this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                    : [this.tooltipEditFile.fileId],
            folderId: null
        };
        this.journalTransComponent.reportService.postponed = {
            action: this.sharedService.updateOcrDocumentStatus(paramsToSend),
            message: this.journalTransComponent.sanitizer.bypassSecurityTrustHtml(
                this.showFloatNav &&
                !this.tooltipEditFile &&
                this.showFloatNav.selcetedFiles.length > 1
                    ? this.showFloatNav.selcetedFiles.length +
                    (' מסמכים הועברו ' + '<b>' + 'לאישור' + '</b>')
                    : 'המסמך הועבר ' + '<b>' + 'לאישור' + '</b>'
            ),
            fired: false,
            cancelled: () => {
                paramsToSend['fileStatus'] = FileStatus.WAIT_FOR_CONFIRM;
                this.sharedService
                    .updateOcrDocumentStatus(paramsToSend)
                    .subscribe(() => {
                        this.tooltipEditParentFile = null;
                        this.tooltipEditFile = null;
                        this.getExportFiles();
                    });
            }
        };
        this.journalTransComponent.reportService.postponed.action
            .pipe(take(1))
            .subscribe(() => {
                this.tooltipEditParentFile = null;
                this.tooltipEditFile = null;
                this.getExportFiles();

                setTimeout(() => {
                    this.journalTransComponent.reportService.postponed.fired = true;
                }, 3000);
            });
    }

    trackById(index: number, row: any): string {
        return row.fileId;
    }

    trackByIdJournalTransData(index: number, row: any): number {
        return row.idx;
    }

    setStatus(fileStatus: string): void {
        this.fileStatus = fileStatus;
        this.storageService.localStorageSetter(
            'suppliersAndCustomersFileStatus',
            String(this.fileStatus)
        );

        if (this.fileStatus === 'WAIT_FOR_CONFIRM') {
            this.viewAsList = true;
        }
        if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
            this.snackBar.dismiss();
        }
        this.sharedService
            .countStatus(
                Object.assign(
                    {
                        uuid: this.userService.appData.userData.companySelect.companyId,
                        showNote: this.showNote.value === true ? 1 : 0
                    },
                    this.fileStatus === 'WAIT_FOR_CARE'
                        ? {
                            showNote: this.showNote.value === true ? 1 : 0
                        }
                        : {}
                )
            )
            .subscribe((response: any) => {
                this.countStatusDataFixed = response ? response['body'] : response;
                this.countStatusDataFixed.forConfirmBase =
                    this.countStatusDataFixed.forConfirm;
            });
        this.startChild();
    }

    filtersAllJournalTransData(priority?: any, isSorted?: boolean): void {
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
                    fd.fileData = fd.fileData.filter((fdChild) => {
                        return [
                            fdChild.name,
                            fdChild.oppositeCust,
                            fdChild.maamMonth,
                            fdChild.totalIncludeMaam,
                            this.sumPipe.transform(fdChild.totalIncludeMaam),
                            fdChild.totalIncludeMaamMatah,
                            this.sumPipe.transform(fdChild.totalIncludeMaamMatah),
                            fdChild.asmachta,
                            this.typeOfStatus === 'transTypeCode'
                                ? fdChild.transTypeCode
                                : fdChild.maamPrcDesc,
                            this.dtPipe.transform(fdChild.invoiceDate, 'dd/MM/yy'),
                            this.userService.appData && this.userService.appData.isAdmin
                                ? fd.uniqueId
                                : ''
                        ]
                            .filter(
                                (v) => (typeof v === 'string' || typeof v === 'number') && !!v
                            )
                            .some(
                                (vstr) =>
                                    vstr.toString().includes(this.queryString) ||
                                    vstr.toString().includes(this.queryString.toUpperCase()) ||
                                    vstr.toString().includes(this.queryString.toLowerCase())
                            );
                    });
                    if (fd.fileData.length) {
                        fd.showChildren = true;
                        return fd;
                    }
                });

            if (priority === 'maamMonth') {
                if (
                    this.filterTypesMonthsJournalTrans &&
                    this.filterTypesMonthsJournalTrans.length
                ) {
                    this.journalTransData = this.journalTransData.filter((item) => {
                        item.fileData = item.fileData.filter((fdChild) => {
                            if (fdChild.maamMonth) {
                                return this.filterTypesMonthsJournalTrans.some(
                                    (it) => it === fdChild.maamMonth.toString()
                                );
                            }
                        });
                        if (item.fileData.length) {
                            item.showChildren = true;
                            return item;
                        }
                    });
                } else if (
                    this.filterTypesMonthsJournalTrans &&
                    !this.filterTypesMonthsJournalTrans.length
                ) {
                    this.journalTransData = [];
                }
            }
            if (this.typeOfStatus === 'maamPrc') {
                if (priority === 'maamPrc') {
                    if (this.filterTypesMaamPrc && this.filterTypesMaamPrc.length) {
                        this.journalTransData = this.journalTransData.filter((item) => {
                            item.fileData = item.fileData.filter((fdChild) => {
                                if (fdChild.maamPrc) {
                                    return this.filterTypesMaamPrc.some(
                                        (it) => it === fdChild.maamPrc.toString()
                                    );
                                }
                            });
                            if (item.fileData.length) {
                                item.showChildren = true;
                                return item;
                            }
                        });
                    } else if (
                        this.filterTypesMaamPrc &&
                        !this.filterTypesMaamPrc.length
                    ) {
                        this.journalTransData = [];
                    }
                }
            }

            if (this.typeOfStatus === 'transTypeCode') {
                if (priority === 'transTypeCode') {
                    if (
                        this.filterTypesTransTypeCode &&
                        this.filterTypesTransTypeCode.length
                    ) {
                        this.journalTransData = this.journalTransData.filter((item) => {
                            item.fileData = item.fileData.filter((fdChild) => {
                                if (fdChild.transTypeCode) {
                                    return this.filterTypesTransTypeCode.some(
                                        (it) => it === fdChild.transTypeCode.toString()
                                    );
                                }
                            });
                            if (item.fileData.length) {
                                item.showChildren = true;
                                return item;
                            }
                        });
                    } else if (
                        this.filterTypesTransTypeCode &&
                        !this.filterTypesTransTypeCode.length
                    ) {
                        this.journalTransData = [];
                    }
                }
            }

            if (priority === 'edit') {
                if (
                    this.filterTypesEditJournalTrans &&
                    this.filterTypesEditJournalTrans.length
                ) {
                    this.journalTransData = this.journalTransData.filter((item) => {
                        item.fileData = item.fileData.filter((fdChild) => {
                            return this.filterTypesEditJournalTrans.some((it) => {
                                if (it === 'flag' && fdChild.flag) {
                                    return fdChild;
                                }
                                if (it === 'note' && fdChild.note !== null) {
                                    return fdChild;
                                }
                                if (
                                    it === 'withoutMark' &&
                                    fdChild.flag === false &&
                                    fdChild.note === null
                                ) {
                                    return fdChild;
                                }
                            });
                        });
                        if (item.fileData.length) {
                            item.showChildren = true;
                            return item;
                        }
                    });
                } else if (
                    this.filterTypesEditJournalTrans &&
                    !this.filterTypesEditJournalTrans.length
                ) {
                    this.journalTransData = [];
                }
            }

            if (!isSorted) {
                if (priority !== 'maamMonth') {
                    this.rebuildMonthsJournalTransMap(
                        this.journalTransData.flatMap((fd) => fd.fileData)
                    );
                }
                if (this.typeOfStatus === 'maamPrc') {
                    if (priority !== 'maamPrc') {
                        this.rebuildMaamPrcMap(
                            this.journalTransData.flatMap((fd) => fd.fileData)
                        );
                    }
                }

                if (priority !== 'edit') {
                    this.rebuildEditMap(
                        this.journalTransData.flatMap((fd) => fd.fileData)
                    );
                }
                if (this.typeOfStatus === 'transTypeCode') {
                    if (priority !== 'transTypeCode') {
                        this.rebuildTransTypeCodeMap(
                            this.journalTransData.flatMap((fd) => fd.fileData)
                        );
                    }
                }
            } else {
                if (
                    this.filterTypesMonthsJournalTrans &&
                    this.filterTypesMonthsJournalTrans.length
                ) {
                    this.journalTransData = this.journalTransData.filter((item) => {
                        item.fileData = item.fileData.filter((fdChild) => {
                            if (fdChild.maamMonth) {
                                return this.filterTypesMonthsJournalTrans.some(
                                    (it) => it === fdChild.maamMonth.toString()
                                );
                            }
                        });
                        if (item.fileData.length) {
                            item.showChildren = true;
                            return item;
                        }
                    });
                }

                if (this.typeOfStatus === 'maamPrc') {
                    if (this.filterTypesMaamPrc && this.filterTypesMaamPrc.length) {
                        this.journalTransData = this.journalTransData.filter((item) => {
                            item.fileData = item.fileData.filter((fdChild) => {
                                if (fdChild.maamPrc) {
                                    return this.filterTypesMaamPrc.some(
                                        (it) => it === fdChild.maamPrc.toString()
                                    );
                                }
                            });
                            if (item.fileData.length) {
                                item.showChildren = true;
                                return item;
                            }
                        });
                    }
                }

                if (this.typeOfStatus === 'transTypeCode') {
                    if (
                        this.filterTypesTransTypeCode &&
                        this.filterTypesTransTypeCode.length
                    ) {
                        this.journalTransData = this.journalTransData.filter((item) => {
                            item.fileData = item.fileData.filter((fdChild) => {
                                if (fdChild.transTypeCode) {
                                    return this.filterTypesTransTypeCode.some(
                                        (it) => it === fdChild.transTypeCode.toString()
                                    );
                                }
                            });
                            if (item.fileData.length) {
                                item.showChildren = true;
                                return item;
                            }
                        });
                    }
                }

                if (
                    this.filterTypesEditJournalTrans &&
                    this.filterTypesEditJournalTrans.length
                ) {
                    this.journalTransData = this.journalTransData.filter((item) => {
                        item.fileData = item.fileData.filter((fdChild) => {
                            return this.filterTypesEditJournalTrans.some((it) => {
                                if (it === 'flag' && fdChild.flag) {
                                    return fdChild;
                                }
                                if (it === 'note' && fdChild.note !== null) {
                                    return fdChild;
                                }
                                if (
                                    it === 'withoutMark' &&
                                    fdChild.flag === false &&
                                    fdChild.note === null
                                ) {
                                    return fdChild;
                                }
                            });
                        });
                        if (item.fileData.length) {
                            item.showChildren = true;
                            return item;
                        }
                    });
                }
            }
            if (this.journalTransData.length) {
                switch (this.companyFilesSortControl.value.orderBy) {
                    case 'invoiceDate':
                    case 'totalIncludeMaam':
                    case 'totalIncludeMaamMatah':
                        // noinspection DuplicatedCode
                        this.journalTransData = this.journalTransData.filter((item) => {
                            const notNumber = item.fileData.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'number'
                            );
                            item.fileData = item.fileData
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
                    case 'name':
                    case 'asmachta':
                    case 'oppositeCust':
                        // noinspection DuplicatedCode
                        this.journalTransData = this.journalTransData.filter((item) => {
                            const notString = item.fileData.filter(
                                (fd) =>
                                    typeof fd[this.companyFilesSortControl.value.orderBy] !==
                                    'string'
                            );
                            item.fileData = item.fileData
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
                    const showChildren_journalTransData_idx =
                        this.storageService.localStorageGetterItem(
                            'showChildren_journalTransData_idx'
                        );
                    const fileIdToScroll = this.fileIdToScroll;
                    this.fileIdToScroll = null;
                    this.journalTransData.forEach((it, idx) => {
                        if (
                            showChildren_journalTransData_idx !== null &&
                            Number(showChildren_journalTransData_idx) === idx
                        ) {
                            it.showChildren = true;
                        } else {
                            it.showChildren = it.fileData.some(
                                (file) => file.fileId === fileIdToScroll
                            );
                        }
                    });
                    // const isExistFileId = this.journalTransData.find(fd => fd.fileId === fileIdToScroll);
                    // if (isExistFileId) {
                    //     setTimeout(() => {
                    //         requestAnimationFrame(() => {
                    //             this.runTimerScroll((this._rowForScroll.toArray().length - 1), fileIdToScroll);
                    //         });
                    //     }, 100);
                    // }
                } else {
                    const showChildren_journalTransData_idx =
                        this.storageService.localStorageGetterItem(
                            'showChildren_journalTransData_idx'
                        );
                    this.journalTransData.forEach((it, idx) => {
                        if (
                            showChildren_journalTransData_idx !== null &&
                            Number(showChildren_journalTransData_idx) === idx
                        ) {
                            it.showChildren = true;
                        } else {
                            it.showChildren = false;
                        }
                    });
                }
            }

            const selcetedFiles = this.journalTransData
                .flatMap((fd) => fd.fileData)
                .filter((it) => it.selcetFile);
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                    selcetedFilesNote: selcetedFiles.every((file) => file.note),
                    statusTEMPCOMMAND: selcetedFiles.some(
                        (file) => file.status === 'TEMP_COMMAND'
                    ),
                    statusJOURNAL_TRANS_PROCESS: selcetedFiles.some(
                        (file) => file.status === 'JOURNAL_TRANS_PROCESS'
                    ),
                    containsCollapseText: this.journalTransData.some(
                        (jtd) =>
                            !!jtd.collapseText &&
                            Array.isArray(jtd.fileData) &&
                            jtd.fileData.some((fd) => !!fd.selcetFile)
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
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {fileData: null})
            );

            if (!parentObj.showChildren) {
                parentObj.fileData = [];
            } else {
                parentObj.fileData.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = idx1;
                });
            }
            allTransData = allTransData.concat(parentObj.fileData);
        });
        this.allTransData = allTransData;
        // console.log(allTransData);
        this.validateScrollPresence();
        this.loader = false;
    }

    private validateScrollPresence(): void {
        setTimeout(() => {
            console.log(this.scrollContainerVirtual);
            const scrollContainerHasScrollNow =
                this.scrollContainerVirtual !== null &&
                this.scrollContainerVirtual['elementRef'].nativeElement.scrollHeight >
                this.scrollContainerVirtual['elementRef'].nativeElement.clientHeight;
            if (this.scrollContainerHasScroll !== scrollContainerHasScrollNow) {
                // console.log('validateScrollPresence: scrollContainerHasScroll > %o', scrollContainerHasScrollNow);
                this.scrollContainerHasScroll = scrollContainerHasScrollNow;
            }
        });
    }

    checkSelect(parent, children) {
        const isSomeSelected = children.some((it) => it.selcetFile);

        if (parent.pettyCash) {
            this.journalTransDataSave.forEach((item, index) => {
                if (!item.pettyCash) {
                    item.disabledSelcetFile = isSomeSelected;
                    for (const fd of item.fileData) {
                        fd.disabledSelcetFile = isSomeSelected;
                    }
                }
            });
            this.journalTransData.forEach((item, index) => {
                if (!item.pettyCash) {
                    item.disabledSelcetFile = isSomeSelected;
                    for (const fd of item.fileData) {
                        fd.disabledSelcetFile = isSomeSelected;
                    }
                }
            });
        } else {
            this.journalTransDataSave.forEach((item, index) => {
                if (item.pettyCash) {
                    item.disabledSelcetFile = isSomeSelected;
                    for (const fd of item.fileData) {
                        fd.disabledSelcetFile = isSomeSelected;
                    }
                }
            });
            this.journalTransData.forEach((item, index) => {
                if (item.pettyCash) {
                    item.disabledSelcetFile = isSomeSelected;
                    for (const fd of item.fileData) {
                        fd.disabledSelcetFile = isSomeSelected;
                    }
                }
            });
        }
    }

    printPage(type: any) {
        this.reportService.reportIsProcessing$.next(true);
        this.printData = type === 'all' ? this.journalTransData : [type];
        setTimeout(() => {
            if (this.elemToPrint && this.elemToPrint['nativeElement']) {
                BrowserService.printHtml(
                    this.elemToPrint['nativeElement'],
                    'פקודות יומן - ספקים ולקוחות'
                );
                this.printData = false;
                this.reportService.reportIsProcessing$.next(false);
            }
        }, 1000);
    }

    checkSelectedJournalTransData(): void {
        this.journalTransDataSave.forEach((item, index) => {
            item.selcetFiles =
                item.fileData.filter((it) => it.selcetFile).length ===
                item.fileData.length;
        });
        this.journalTransData.forEach((item, index) => {
            item.selcetFiles =
                item.fileData.filter((it) => it.selcetFile).length ===
                item.fileData.length;
        });

        const selcetedFiles = this.journalTransData
            .flatMap((fd) => fd.fileData)
            .filter((it) => it.selcetFile);
        // this.selectTypeNotPetty = selcetedFiles.length && !selcetedFiles[0].pettyCash;
        if (selcetedFiles.length > 1) {
            this.showFloatNav = {
                selcetedFiles,
                selcetedFilesPettyCash: selcetedFiles.every(
                    (file) =>
                        file.pettyCash ||
                        file.status === 'NOT_PERMANENT_COMMAND' ||
                        file.status === 'NOT_TEMP_COMMAND'
                ),
                selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                selcetedFilesNote: selcetedFiles.every((file) => file.note),
                statusTEMPCOMMAND: selcetedFiles.some(
                    (file) => file.status === 'TEMP_COMMAND'
                ),
                statusJOURNAL_TRANS_PROCESS: selcetedFiles.some(
                    (file) => file.status === 'JOURNAL_TRANS_PROCESS'
                ),
                containsCollapseText: this.journalTransData.some(
                    (jtd) =>
                        !!jtd.collapseText &&
                        Array.isArray(jtd.fileData) &&
                        jtd.fileData.some((fd) => !!fd.selcetFile)
                )
            };
        } else {
            this.showFloatNav = false;
        }
    }

    getExportFiles(isReset?: boolean): void {
        if (!isReset) {
            this.resetVars();
        }
        this.loader = true;
        this.vatList = [];
        zip(
            this.sharedService.getExportFiles(
                this.userService.appData.userData.companySelect.companyId
            ),
            this.sharedService.getVatList(
                this.userService.appData.userData.companySelect.companyId
            )
        ).subscribe({
            next: (resSub: any) => {
                const [response, vatListRes] = resSub;
                const esderMaam =
                    this.userService.appData.userData.companySelect.esderMaam;
                const vatList = vatListRes ? vatListRes['body'].months : vatListRes;
                const monthNames = this.translate.instant(
                    'langCalendar.monthNames'
                ) as string[];
                if (esderMaam !== 'TWO_MONTH') {
                    for (const month of vatList) {
                        const mmntI = this.userService.appData
                            .moment(month)
                            .startOf('month');
                        this.vatList.push({
                            label: monthNames[mmntI.month()] + ' ' + mmntI.format('YY'),
                            value: mmntI.valueOf()
                        } as SelectItem);
                    }
                } else {
                    for (const month of vatList) {
                        const mmntI = this.userService.appData
                            .moment(month)
                            .startOf('month');
                        const pairEnd = this.userService.appData
                            .moment(mmntI)
                            .endOf('month')
                            .add(1, 'months');
                        if (mmntI.format('YY') === pairEnd.format('YY')) {
                            this.vatList.push({
                                label:
                                    monthNames[mmntI.month()] +
                                    ' - ' +
                                    monthNames[pairEnd.month()] +
                                    ' ' +
                                    mmntI.format('YY'),
                                value: mmntI.valueOf()
                            } as SelectItem);
                        } else {
                            this.vatList.push({
                                label: [
                                    monthNames[mmntI.month()] + ' ' + mmntI.format('YY'),
                                    monthNames[pairEnd.month()] + ' ' + pairEnd.format('YY')
                                ].join(' - '),
                                value: mmntI.valueOf()
                            } as SelectItem);
                        }
                    }
                }
                // console.log(this.vatList);
                this.journalTransDataSave = response ? response['body'] : response;
                if (Array.isArray(this.journalTransDataSave)) {
                    for (const gr of this.journalTransDataSave) {
                        gr.monthName = null;

                        if (gr.pettyCash) {
                            const totalMaam = gr.fileData.reduce(
                                (total, item) => total + Number(item.totalMaam),
                                0
                            );
                            gr.totalMaam = Math.round(totalMaam);
                        } else {
                            if (
                                gr.status === 'CREATE_JOURNAL_TRANS' ||
                                gr.status === 'TEMP_COMMAND' ||
                                gr.status === 'FOLDER_PLUS_ISSUE' ||
                                gr.status === 'PERMANENT_COMMAND'
                            ) {
                                gr.totalIncludeMaam = gr.fileData.reduce(
                                    (total, item) =>
                                        Number((total + Number(item.totalIncludeMaam)).toFixed(2)),
                                    0
                                );
                                /*
                                                                        const totalIncludeMaam = gr.fileData.reduce((total, item) => total + Number(item.totalIncludeMaam), 0);
                                                                        gr.totalIncludeMaam = Math.round(totalIncludeMaam);
                                    */
                            }
                        }

                        if (gr.vatDateFrom && gr.vatDateTill) {
                            const sameYear =
                                this.userService.appData.moment(gr.vatDateFrom).year() ===
                                this.userService.appData.moment().year();
                            const year = sameYear
                                ? ''
                                : ' ' +
                                this.userService.appData.moment(gr.vatDateFrom).format('YY');
                            if (
                                this.userService.appData.moment(gr.vatDateFrom).month() ===
                                this.userService.appData.moment(gr.vatDateTill).month()
                            ) {
                                gr.monthName =
                                    monthNames[
                                        this.userService.appData.moment(gr.vatDateFrom).month()
                                        ] + year;
                            } else {
                                if ((this.userService.appData.moment(gr.vatDateFrom).year() ===
                                        this.userService.appData.moment(gr.vatDateTill).year()) &&
                                    this.userService.appData.moment(gr.vatDateFrom).month() === 0
                                    &&
                                    this.userService.appData.moment(gr.vatDateTill).month() === 11) {
                                    gr.monthName = this.userService.appData.moment(gr.vatDateFrom).format('YYYY');
                                } else {
                                    gr.monthName =
                                        monthNames[
                                            this.userService.appData.moment(gr.vatDateFrom).month()
                                            ] +
                                        ' - ' +
                                        monthNames[
                                            this.userService.appData.moment(gr.vatDateTill).month()
                                            ] +
                                        year;
                                }


                            }
                        }

                        gr.dateLastModifiedName =
                            monthNames[this.userService.appData.moment(gr.dateLastModified).month()];
                        gr.manualCustIdsArray = [];
                        for (const fd of gr.fileData) {
                            const code = this.currencyList.find(
                                (ite) => ite.id === fd.currencyCode
                            );
                            if (code) {
                                fd.currencySign = code.sign;
                            } else {
                                fd.currencySign = null;
                            }

                            if (fd.manualCustIdsArray && fd.manualCustIdsArray.length) {
                                fd.manualCustIdsArray.forEach((it) => {
                                    if (!gr.manualCustIdsArray.some((ids) => ids === it)) {
                                        gr.manualCustIdsArray.push(it);
                                    }
                                });
                            }
                            fd.parent = Object.assign(JSON.parse(JSON.stringify(gr)), {
                                fileData: null
                            });
                            fd.uploadSource = fd.uploadSource
                                ? fd.uploadSource.toLowerCase()
                                : fd.uploadSource;
                            fd.status = gr.status;
                            fd.maamPrcDesc = fd.maamPrc
                                ? this.vatOptions.find((it) => it.value === fd.maamPrc).label
                                : null;

                            if (fd.maamMonth) {
                                fd.pettyCash = gr.pettyCash;
                                fd.ocrExportFileId = gr.ocrExportFileId;
                                const dt = this.userService.appData
                                    .moment(fd.maamMonth)
                                    .startOf('month');

                                if (esderMaam !== 'TWO_MONTH') {
                                    fd.maamMonth = monthNames[dt.month()] + ' ' + dt.format('YY');
                                } else {
                                    if (dt.month() % 2 !== 0) {
                                        dt.subtract(1, 'months');
                                    }
                                    const pairEnd = this.userService.appData
                                        .moment(dt)
                                        .endOf('month')
                                        .add(1, 'months');
                                    fd.maamMonth =
                                        dt.format('YY') === pairEnd.format('YY')
                                            ? monthNames[dt.month()] +
                                            ' - ' +
                                            monthNames[pairEnd.month()] +
                                            ' ' +
                                            dt.format('YY')
                                            : [
                                                monthNames[dt.month()] + ' ' + dt.format('YY'),
                                                monthNames[pairEnd.month()] +
                                                ' ' +
                                                pairEnd.format('YY')
                                            ].join(' - ');
                                }

                                fd.maamMonthVal = dt.valueOf();
                            }
                        }
                        gr.showChildren = false;
                    }
                    this.journalTransDataSave = JSON.parse(
                        JSON.stringify(
                            this.journalTransDataSave.filter((gr) => gr.fileData.length)
                        )
                    );
                    const gr_PERMANENT_COMMAND_Rows = JSON.parse(
                        JSON.stringify(
                            this.journalTransDataSave
                                .filter((gr) => gr.status === 'PERMANENT_COMMAND')
                                .sort((a, b) => {
                                    const lblA = a['vatDateFrom'],
                                        lblB = b['vatDateFrom'];
                                    return lblA || lblB
                                        ? !lblA
                                            ? 1
                                            : !lblB
                                                ? -1
                                                : lblA - lblB
                                        : 0;
                                })
                        )
                    );
                    const allGrRows = JSON.parse(
                        JSON.stringify(
                            this.journalTransDataSave.filter(
                                (gr) => gr.status !== 'PERMANENT_COMMAND'
                            )
                        )
                    );
                    const concatGr = allGrRows.concat(gr_PERMANENT_COMMAND_Rows);
                    this.journalTransDataSave = JSON.parse(JSON.stringify(concatGr));
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
            error: (err: HttpErrorResponse) => {
                if (err.error) {
                    console.log('An error occurred:', err.error.message);
                } else {
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            },
            complete: () => console.info('complete')
        });
    }

    roundAndAddCommaFunc(num: any) {
        if (num !== undefined) {
            return roundAndAddComma(num);
        }
        return '';
    }

    checkAllChildSelectedJournalTransData(parent: any): void {
        parent.fileData.forEach((it) => {
            it.selcetFile = parent.selcetFiles;
        });
    }

    colsAct(parent, idx): void {
        parent.showChildren = !parent.showChildren;
        this.journalTransDataSave[idx].showChildren = parent.showChildren;
        console.log('parent.showChildren', parent.showChildren);
        if (parent.showChildren) {
            this.storageService.localStorageSetter(
                'showChildren_journalTransData_idx',
                idx
            );
        } else {
            this.storageService.localStorageRemoveItem(
                'showChildren_journalTransData_idx'
            );
        }
        // setTimeout(() => {
        if (parent.pettyCash) {
            this.journalTransDataSave.forEach((item, index) => {
                if (index !== idx) {
                    // item.selcetFiles = false;
                    item.showChildren = false;
                    for (const fd of item.fileData) {
                        // fd.selcetFile = false;
                    }
                }
            });
            this.journalTransData.forEach((item, index) => {
                if (index !== idx) {
                    // item.selcetFiles = false;
                    item.showChildren = false;
                    for (const fd of item.fileData) {
                        // fd.selcetFile = false;
                    }
                }
            });

            this.checkSelectedJournalTransData();
        } else {
            this.journalTransDataSave.forEach((item, index) => {
                if (item.pettyCash) {
                    // item.selcetFiles = false;
                    item.showChildren = false;
                    for (const fd of item.fileData) {
                        // fd.selcetFile = false;
                    }
                }
            });
            this.journalTransData.forEach((item, index) => {
                if (item.pettyCash) {
                    // item.selcetFiles = false;
                    item.showChildren = false;
                    for (const fd of item.fileData) {
                        // fd.selcetFile = false;
                    }
                }
            });

            this.checkSelectedJournalTransData();
        }
        let allTransData = [];
        this.journalTransData.forEach((it, idxs) => {
            const parentObj = JSON.parse(JSON.stringify(it));
            parentObj.idx = idxs;
            allTransData.push(
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {fileData: null})
            );

            if (!parentObj.showChildren) {
                parentObj.fileData = [];
            } else {
                parentObj.fileData.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = idx1;
                });
            }
            allTransData = allTransData.concat(parentObj.fileData);
        });
        this.allTransData = allTransData;
        this.validateScrollPresence();
        // console.log(allTransData);
        // }, 0);
    }

    maamMonthChange(file: any) {
        file.maamMonth = this.vatList.find(
            (month) => month.value === file.maamMonthVal
        ).label;
        this.sharedService
            .updateMaamMonth({
                fileIds: [file.fileId],
                maamMonth: file.maamMonthVal
            })
            .subscribe(() => {
                this.getExportFiles();
            });
    }

    maamMonthChangeForSelected(maamMonthVal: any) {
        this.showModalChangeMaamMonth = false;
        this.sharedService
            .updateMaamMonth({
                fileIds: this.showFloatNav.selcetedFiles.map((file) => file.fileId),
                maamMonth: maamMonthVal
            })
            .subscribe(() => {
                this.getExportFiles();
            });
    }

    selecteAllFilesEvent(): void {
        if (this.viewAsList) {
            this.documentsData.forEach((file) => {
                if (!file.titleQuickApproveArray) {
                    file.selcetFile = this.selcetAllFiles;
                }
            });
            const selcetedFiles = this.documentsData.filter((it) => it.selcetFile);
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedQuickApproveRows: selcetedFiles.every(
                        (file) => file.quickApprove && !file.titleQuickApproveArray
                    ),
                    selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                    selcetedFilesNote: selcetedFiles.every((file) => file.note)
                };
            } else {
                this.showFloatNav = false;
            }
        } else {
            this.documentsDataSave.forEach((file) => {
                file.selcetFile = this.selcetAllFiles;
            });
            const selcetedFiles = this.documentsDataSave.filter(
                (it) => it.selcetFile
            );
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedQuickApproveRows: selcetedFiles.every(
                        (file) => file.quickApprove && !file.titleQuickApproveArray
                    ),
                    selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                    selcetedFilesNote: selcetedFiles.every((file) => file.note)
                };
            } else {
                this.showFloatNav = false;
            }
        }
    }

    checkSelected(): void {
        this.selcetAllFiles = this.documentsData
            .filter((it) => it.titleQuickApproveArray !== true)
            .every((file) => file.selcetFile);

        const selcetedFiles = this.documentsData.filter((it) => it.selcetFile);
        if (selcetedFiles.length > 1) {
            this.showFloatNav = {
                selcetedFiles,
                selcetedQuickApproveRows: selcetedFiles.every(
                    (file) => file.quickApprove && !file.titleQuickApproveArray
                ),
                selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                selcetedFilesNote: selcetedFiles.every((file) => file.note)
            };
        } else {
            this.showFloatNav = false;
        }
    }

    updateOcrDocumentData(file: any): void {
        file.flag = !file.flag;

        this.sharedService
            .updateOcrDocumentData({
                filesId: [file.fileId],
                flag: file.flag,
                note: file.note
            })
            .subscribe(
                (response: any) => {
                    if (this.fileStatus !== 'CREATE_JOURNAL_TRANS') {
                        if (Array.isArray(this.documentsDataSave)) {
                            const copyInDocumentsDataSave = this.documentsDataSave.find(
                                (it) => it.fileId === file.fileId
                            );
                            if (copyInDocumentsDataSave) {
                                copyInDocumentsDataSave.flag = file.flag;
                            }
                        }
                        if (this.fileStatus === 'WAIT_FOR_CARE' && !file.flag) {
                            // this.documentsDataSave.findIndex(it => it.fileId === file.fileId)

                            this.documentsDataSave = this.documentsDataSave.filter(
                                (it) => it.fileId !== file.fileId
                            );
                        }
                        this.filtersAll('edit');
                    } else {
                        this.journalTransDataSave.forEach((fd) => {
                            fd.fileData.forEach((fi) => {
                                if (fi.fileId === file.fileId) {
                                    fi.flag = file.flag;
                                }
                            });
                        });
                        this.filtersAllJournalTransData();
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

    public async getFile(contentUrl: string): Promise<Blob> {
        return lastValueFrom(this.httpClient
            .get(contentUrl, {
                responseType: 'blob'
            }));
    }

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

    hideDocumentStorageData(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentStorageDataFired = false;
        this.sidebarImgs = false;
        console.log('hideDocumentStorageData');
    }

    showDocumentStorageData(fileId: string): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.finishedLoadedImgView = false;
        this.showDocumentStorageDataFired = true;
        this.getDocumentStorageData(fileId);
    }

    showDocumentStorageDataViewAsGrid(src): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.finishedLoadedImgView = false;
        this.showDocumentStorageDataFired = true;
        this.timeFireHover = false;
        this.sidebarImgs = src.multipaged ? src.pages : src.urlImg;
    }

    isArray(obj: any): boolean {
        return Array.isArray(obj);
    }

    calcMinus(num: number): number {
        if (num < 0) {
            return -num;
        } else {
            return Math.abs(num);
        }
    }

    calcZoom(elemToEdit: any): string {
        if (elemToEdit) {
            return elemToEdit.style.zoom;
        }
        return '100%';
    }

    calcLeft(elemToEdit: any): number {
        if (elemToEdit && this.zoomCube !== 1) {
            const offsetLeft =
                elemToEdit.offsetLeft *
                (Number(elemToEdit.style.zoom.replace('%', '')) / 100) +
                (this.zoomCube === 2 ? 87 : 123);
            // console.log(offsetLeft, elemToEdit.offsetLeft);
            return offsetLeft;
        }
        return 0;
    }

    calcTop(elemToEdit: any): number {
        if (elemToEdit && this.zoomCube !== 1) {
            const offsetTop = (this.zoomCube === 2 ? 150 : 200);
            // console.log(offsetTop, elemToEdit.offsetTop);
            return offsetTop;
        }
        return 0;
    }

    public onKeydownMain(event: any, file: any): void {
        if (!event.shiftKey) {
            event.preventDefault();
            if (event.ctrlKey || event.metaKey) {
                file.selcetFile = !file.selcetFile;
            } else {
                file.selcetFile = !file.selcetFile;
                this.documentsDataSave.forEach((fd) => {
                    if (fd.selcetFile && fd.fileId !== file.fileId) {
                        fd.selcetFile = false;
                    }
                });
            }
            const selcetedFiles = this.documentsDataSave.filter(
                (it) => it.selcetFile
            );
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedQuickApproveRows: selcetedFiles.every(
                        (filed) => filed.quickApprove && !filed.titleQuickApproveArray
                    ),
                    selcetedFilesFlag: selcetedFiles.every((fd) => fd.flag),
                    selcetedFilesNote: selcetedFiles.every((fd) => fd.note)
                };
            } else {
                this.showFloatNav = false;
            }
        }
    }

    public async getDocumentStorageDataForAllSelectedFiles(
        isPrint?: boolean
    ): Promise<void> {
        if (this.showFloatNav.selcetedFiles.length > 1) {
            if (isPrint) {
                this.journalTransComponent.reportService.reportIsProcessingPrint$.next(
                    true
                );
            } else {
                this.journalTransComponent.reportService.reportIsProcessing$.next(true);
            }
        }
        let getDocumentStorageData = [];
        for (let idx = 0; idx < this.showFloatNav.selcetedFiles.length; idx++) {
            const res = await lastValueFrom(this.sharedService
                .getDocumentStorageData([this.showFloatNav.selcetedFiles[idx].fileId]));
            if (res) {
                getDocumentStorageData = getDocumentStorageData.concat(
                    res['body'][this.showFloatNav.selcetedFiles[idx].fileId]
                );
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
        for (let i = 0; i < getDocumentStorageData.length; i++) {
            const x: any = await this.getFile(getDocumentStorageData[i].contentUrl);
            const imageBase64 = await this.createImageBase64FromBlob(x, true);
            let outputWidth = imageBase64.width;
            let outputHeight = imageBase64.height;
            if (outputWidth > outputHeight && getDocumentStorageData.length === 1) {
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
                } else if (imageBase64.width > width) {
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
                getDocumentStorageData.length > 1 &&
                i + 1 !== getDocumentStorageData.length
            ) {
                doc.addPage('a4', 'p');
            }
        }
        if (!isPrint) {
            this.journalTransComponent.reportService.reportIsProcessing$.next(false);
            doc.save('group_selected_files.pdf');
        } else {
            this.journalTransComponent.reportService.reportIsProcessingPrint$.next(
                false
            );
            doc.autoPrint();
            const oHiddFrame: any = document.createElement('iframe');
            oHiddFrame.style.position = 'fixed';
            oHiddFrame.style.visibility = 'hidden';
            oHiddFrame.src = doc.output('bloburl');
            document.body.appendChild(oHiddFrame);
        }
    }

    updateOcrDocumentDataForAllSelectedFiles(): void {
        this.showFloatNav.selcetedFiles.forEach((file) => {
            file.flag = !(this.showFloatNav && this.showFloatNav.selcetedFilesFlag);
        });
        if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
            this.journalTransDataSave.forEach((fd) => {
                fd.fileData.forEach((fi) => {
                    if (
                        this.showFloatNav.selcetedFiles.some((f) => f.fileId === fi.fileId)
                    ) {
                        fi.flag = !(
                            this.showFloatNav && this.showFloatNav.selcetedFilesFlag
                        );
                    }
                });
            });
        }
        this.sharedService
            .updateOcrDocumentData({
                filesId: this.showFloatNav.selcetedFiles.map((file) => file.fileId),
                flag: !(this.showFloatNav && this.showFloatNav.selcetedFilesFlag),
                note:
                    this.showFloatNav.selcetedFiles.length === 1
                        ? this.showFloatNav.selcetedFiles[0].note
                        : null
            })
            .subscribe(
                (response: any) => {
                    if (this.fileStatus !== 'CREATE_JOURNAL_TRANS') {
                        this.filtersAll('edit');
                    } else {
                        this.filtersAllJournalTransData();
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

    getDocumentStorageData(fileId?: string, isPrint?: boolean): void {
        this.sharedService
            .getDocumentStorageData([fileId ? fileId : this.tooltipEditFile.fileId])
            .subscribe(
                async (response: any) => {
                    const responseRest = response ? response['body'] : response;
                    const getDocumentStorageData =
                        responseRest[fileId ? fileId : this.tooltipEditFile.fileId];
                    if (fileId) {
                        this.sidebarImgs = getDocumentStorageData;
                    }
                    if (!fileId) {
                        if (getDocumentStorageData.length > 1) {
                            if (isPrint) {
                                this.journalTransComponent.reportService.reportIsProcessingPrint$.next(
                                    true
                                );
                            } else {
                                this.journalTransComponent.reportService.reportIsProcessing$.next(
                                    true
                                );
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
                        for (let i = 0; i < getDocumentStorageData.length; i++) {
                            const x: any = await this.getFile(
                                getDocumentStorageData[i].contentUrl
                            );
                            const imageBase64 = await this.createImageBase64FromBlob(x, true);
                            let outputWidth = imageBase64.width;
                            let outputHeight = imageBase64.height;
                            if (
                                outputWidth > outputHeight &&
                                getDocumentStorageData.length === 1
                            ) {
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
                                } else if (imageBase64.width > width) {
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
                                getDocumentStorageData.length > 1 &&
                                i + 1 !== getDocumentStorageData.length
                            ) {
                                doc.addPage('a4', 'p');
                            }
                        }

                        if (!isPrint) {
                            this.journalTransComponent.reportService.reportIsProcessing$.next(
                                false
                            );
                            const fileName =
                                (
                                    this.tooltipEditFile.originalFileName ||
                                    this.tooltipEditFile.name ||
                                    this.tooltipEditFile.documentType ||
                                    new Date().toISOString()
                                ).split('.')[0] + '.pdf';
                            doc.save(fileName);
                        } else {
                            this.journalTransComponent.reportService.reportIsProcessingPrint$.next(
                                false
                            );
                            doc.autoPrint();
                            const oHiddFrame: any = document.createElement('iframe');
                            oHiddFrame.style.position = 'fixed';
                            oHiddFrame.style.visibility = 'hidden';
                            oHiddFrame.src = doc.output('bloburl');
                            document.body.appendChild(oHiddFrame);
                        }
                        this.tooltipEditParentFile = null;
                        this.tooltipEditFile = null;
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

    onRightClick(event: any) {
        return false;
    }

    public removeFromSelcetedFiles(file: any): void {
        file.selcetFile = false;
        this.documentsDataSave.forEach((fd) => {
            if (fd.selcetFile && fd.fileId !== file.fileId) {
                fd.selcetFile = false;
            }
        });
        this.showFloatNav.selcetedFiles = this.showFloatNav.selcetedFiles.filter(
            (it) => it.fileId !== file.fileId
        );
        if (this.showFloatNav.selcetedFiles.length > 1) {
            this.showFloatNav.selcetedFilesFlag =
                this.showFloatNav.selcetedFiles.every((fd) => fd.flag);
            this.showFloatNav.selcetedFilesNote =
                this.showFloatNav.selcetedFiles.every((fd) => fd.note);
            this.showFloatNav.selcetedQuickApproveRows =
                this.showFloatNav.selcetedFiles.every(
                    (fd) => fd.quickApprove && !fd.titleQuickApproveArray
                );
        } else {
            this.showFloatNav = false;
            this.mergeFiles = false;
        }
    }

    filesUnion() {
        this.mergeFiles = false;
        this.journalTransComponent.reportService.postponed = {
            action: this.sharedService.filesUnion({
                fileIds: this.showFloatNav.selcetedFiles.map((file) => file.fileId)
            }),
            message: this.journalTransComponent.sanitizer.bypassSecurityTrustHtml(
                'המסמכים שאוחדו נמצאים בתהליך עיבוד, נעדכן שהאיחוד יסתיים'
            ),
            fired: false
        };
        // this.showFloatNav.selcetedFiles.length + ' חשבוניות אוחדו'),
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
                this.showFloatNav = false;
                this.countStatusAll(true);
            });
    }

    prepareFileDataVar(arr: any) {
        this.showFloatNav = {
            selcetedFiles: arr
        };
    }

    changePettyCashPress(fileData: any, monthName: any, isPettyCash?: any) {
        if (isPettyCash) {
            this.journalTransComponent.reportService.postponed = {
                action: this.sharedService.changePettyCash({
                    uuids: fileData.map((file) => file.fileId)
                }),
                message: this.journalTransComponent.sanitizer.bypassSecurityTrustHtml(
                    fileData.length +
                    ' חשבוניות של קופה קטנה נוספו לקובץ מע"מ ' +
                    (monthName ? monthName : '')
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
                    this.getExportFiles(true);
                });
        } else {
            this.sharedService
                .changePettyCash({
                    uuids: fileData.map((file) => file.fileId)
                })
                .subscribe(() => {
                    this.getExportFiles(true);
                });
        }
    }

    changePettyCash(fileUn?: any) {
        if (!fileUn) {
            const thisGr = this.journalTransData.find(
                (item) =>
                    item.ocrExportFileId ===
                    this.showFloatNav.selcetedFiles[0].ocrExportFileId
            );
            if (
                thisGr &&
                thisGr.pettyCash &&
                thisGr.fileData.every((file) => file.selcetFile)
            ) {
                this.journalTransComponent.reportService.postponed = {
                    action: this.sharedService.changePettyCash({
                        uuids: this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                    }),
                    message: this.journalTransComponent.sanitizer.bypassSecurityTrustHtml(
                        this.showFloatNav.selcetedFiles.length +
                        ' חשבוניות של קופה קטנה נוספו לקובץ מע"מ ' +
                        (thisGr && thisGr.monthName ? thisGr.monthName : '')
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
                                return this.journalTransComponent.reportService.postponed
                                    .action;
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
                        this.getExportFiles(true);
                        this.showFloatNav = false;
                    });
            } else {
                this.sharedService
                    .changePettyCash({
                        uuids: this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                    })
                    .subscribe(() => {
                        this.getExportFiles(true);
                        this.showFloatNav = false;
                    });
            }
        } else {
            this.sharedService
                .changePettyCash({
                    uuids: [fileUn.fileId]
                })
                .subscribe(() => {
                    this.getExportFiles(true);
                });
        }
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
        const item = this.showFloatNav.selcetedFiles[this.draggedIndex];
        this.showFloatNav.selcetedFiles.splice(this.draggedIndex, 1);
        this.showFloatNav.selcetedFiles.splice(droppedIndex, 0, item);
        this.draggedIndex = -1;
        this.onDragOverIndex = -1;
        // console.log(this.showFloatNav.selcetedFiles)
        this.selectItem(null);
    }

    createDocFile(ocrExportFileId: string): void {
        this.loader = true;
        this.sharedService
            .createDocFile({
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

    hideDocumentListStorageData(): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.showDocumentListStorageDataFired = false;
        this.sidebarImgs = [];
        this.sidebarImgsDescList = false;
        console.log('hideDocumentStorageData');
    }

    showDocumentListStorageData(file: any): void {
        this.imageScaleNewInvoice = 1;
        this.degRotateImg = 0;
        this.sidebarImgsDescList = false;
        this.finishedLoadedImgView = false;
        this.showDocumentListStorageDataFired = true;
        // currencyCode: 1
        // invoiceType: 1
        this.showDocumentListStorageDataFile = file;
        this.isMatah = this.showDocumentListStorageDataFile.currencyCode !== 1;
        const code = this.currencyList.find(
            (ite) => ite.id === this.showDocumentListStorageDataFile.currencyCode
        );
        this.currencySign = code.sign;
        this.ocrService
            .currencyGetRates({
                companyId: this.userService.appData.userData.companySelect.companyId,
                currencyCode: code ? code.code : null,
                invoiceDate: this.showDocumentListStorageDataFile.invoiceDate
            })
            .subscribe((res) => {
                const rateObj = res ? res['body'] : res;
                if (rateObj) {
                    this.rate = rateObj.rate;
                }
            });
        this.companyGetCustomer(file.fileId);
        this.getDocumentStorageData(file.fileId);
    }

    companyGetCustomer(fileId: string): void {
        this.sharedService
            .companyGetCustomer({
                companyId: this.userService.appData.userData.companySelect.companyId,
                sourceProgramId:
                this.userService.appData.userData.companySelect.sourceProgramId
            })
            .subscribe(
                (res) => {
                    this.getJournalTransForFile(fileId);
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

    // public moveUp() {
    //     const index = this.showFloatNav.selcetedFiles.indexOf(this.selectedItem);
    //     if (index === 0) {
    //         return;
    //     }
    //     this.swapElements(index, index - 1);
    //     console.log(this.showFloatNav.selcetedFiles)
    // }
    //
    // public moveDown() {
    //     const index = this.showFloatNav.selcetedFiles.indexOf(this.selectedItem);
    //     if (index === this.showFloatNav.selcetedFiles.length - 1) {
    //         return;
    //     }
    //     this.swapElements(index, index + 1);
    //     console.log(this.showFloatNav.selcetedFiles)
    // }

    updateTransTypeStatus() {
        this.sharedService
            .updateTransTypeStatus({
                companyId: this.userService.appData.userData.companySelect.companyId,
                interested: false
            })
            .subscribe(() => {
                this.showModalTransType = false;
            });
    }

    getJournalTransForFile(fileId: string): void {
        this.sharedService
            .getInvoiceJournal({
                fileId: fileId,
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

    ngOnDestroy() {
        this.journalTransComponent.reportService.forLogic = null;
        this.journalTransComponent.reportService.cancelToast = null;
        if (this.subscriptionStatus) {
            this.subscriptionStatus.unsubscribe();
        }
        if(this.interval$){
            this.interval$.unsubscribe();
        }
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        this.active = false;
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.subscriptionTime) {
            this.subscriptionTime.unsubscribe();
        }
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        this.destroy();
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

    createExportFileForPrevModal(parent: any) {
        this.parentManualCustIdsArray = parent;
    }

    createExportFileForFolder(parent: any) {
        const folderPlus = this.userService.appData.userData.companySelect.folderPlus;
        // if (!this.userService.appData || !this.userService.appData.folderState) {
        //     return;
        // }
        this.ocrExportFileId = parent.ocrExportFileId;
        this.sharedService
            .exportFileCreateFolder(parent.ocrExportFileId,
                this.userService.appData.userData.companySelect.companyId)
            .pipe(
                first(),
                finalize(() => (parent.createExportFileSub = null))
            )
            .subscribe({
                next: (value) => {
                    // {
                    //     "filePath": "string",
                    //     "folderState": "string"
                    // }
                    this.responseRestPath = value ? value['body'] : value;
                    if (folderPlus && this.responseRestPath.folderState === 'OK') {
                        this.sharedComponent.messagesSideShow = true;
                        const subscriptionTimerGetFilesStatus = interval(10000)
                            .pipe(
                                startWith(0),
                                tap(() => {
                                    if (!this.userService.appData.userData.companySelect) {
                                        subscriptionTimerGetFilesStatus.unsubscribe();
                                    }
                                }),
                                filter(() => this.userService.appData.userData.companySelect),
                                tap(() => {
                                    this.messagesService.messageStateChanged$.next();
                                })
                            )
                            .subscribe(() => {
                                // if (this.sharedComponent.openMessagesAgain) {
                                //     this.sharedComponent.messagesSideShow = true;
                                // }
                                this.userService.appData.reloadMessagesEvent
                                    .pipe(take(1))
                                    .subscribe((reload: any) => {
                                        if (this.sharedComponent.messagesSideShow && reload) {
                                            this.sharedComponent.reloadMessagesEve.next();
                                        }
                                    });
                                // const stopInterval = this.sharedComponent.reloadMessagesSavedData && this.sharedComponent.reloadMessagesSavedData.find(it => it.indNew === true && it.uploadSource === 'FOLDER' && (it.indAlert === 'bizibox' || it.indAlert === 'red'));
                                if (!this.userService.appData.userData.companySelect) {
                                    subscriptionTimerGetFilesStatus.unsubscribe();
                                }
                            });

                        this.startChild();
                    } else {
                        if (parent.manualCustIdsArray && parent.manualCustIdsArray.length && this.responseRestPath.folderState === 'OK') {
                            this.createExportFileForPrevModal(
                                parent
                            );
                        } else {
                            this.createExportFileFor(
                                parent
                            );
                        }
                    }

                },
                error: (err: HttpErrorResponse) => {
                    if (err.error instanceof Error) {
                        console.log('An error occurred:', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            });
    }

    onHide_exportFileFolderCreatePrompt(hideVisible?: any, cancelFile?: any) {
        if (
            (
                (this.exportFileFolderCreatePrompt.approveSubscription && this.exportFileFolderCreatePrompt.approveSubscription.closed && this.responseRestPath.folderState === 'NOT_EXIST')
                ||
                (!this.exportFileFolderCreatePrompt.approveSubscription && this.responseRestPath.folderState === 'NOT_OK')
            )
            && ((this.enabledDownloadLink_paramsfile && !this.enabledDownloadLink_docfile) || (this.enabledDownloadLink_docfile && !this.enabledDownloadLink_paramsfile))) {
            if (cancelFile) {
                this.sharedService
                    .cancelFile(this.ocrExportFileId)
                    .subscribe((res) => {
                    });
                if (hideVisible) {
                    this.exportFileFolderCreatePrompt.visible = false;
                }
                this.exportFileFolderCreatePrompt.onHide();
                this.startChild();
                this.enabledDownloadLink = true;
                this.enabledDownloadLink_docfile = true;
                this.enabledDownloadLink_paramsfile = true;
                this.exportFileFolderCreatePrompt.alertDownloadedOneFileOnly = false;
            } else {
                this.exportFileFolderCreatePrompt.alertDownloadedOneFileOnly = true;
            }
        } else {
            // if ((
            //         (this.exportFileFolderCreatePrompt.approveSubscription && this.exportFileFolderCreatePrompt.approveSubscription.closed && this.responseRestPath.folderState === 'NOT_EXIST')
            //         ||
            //         (!this.exportFileFolderCreatePrompt.approveSubscription && this.responseRestPath.folderState === 'NOT_OK')
            //     )
            //     && ((!this.enabledDownloadLink_paramsfile && !this.enabledDownloadLink_docfile))) {
            //     this.sharedService
            //         .cancelFile(this.ocrExportFileId)
            //         .subscribe((res) => {
            //         });
            // }
            if (hideVisible) {
                this.exportFileFolderCreatePrompt.visible = false;
            }
            this.exportFileFolderCreatePrompt.onHide();
            this.startChild();
            this.enabledDownloadLink = true;
            this.enabledDownloadLink_docfile = true;
            this.enabledDownloadLink_paramsfile = true;
            this.exportFileFolderCreatePrompt.alertDownloadedOneFileOnly = false;
        }
    }

    createExportFileFor(parent: any) {
        this.ocrExportFileId = parent.ocrExportFileId;
        if (this.responseRestPath.folderState === 'OK') {
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
                    //
                    //     this.saveFileToDisk(docsfile.docfile, docsfile.paramsfile).then((resData) => {
                    //         this.exportFileFolderCreatePrompt.visible = false;
                    //         this.startChild();
                    //     });
                    // }
                }
            };
        } else if (this.responseRestPath.folderState === 'NOT_OK') {
            // if (!this.userService.appData.isAdmin) {
            //     this.sharedService
            //         .folderError({
            //             companyId: this.userService.appData.userData.companySelect.companyId
            //         })
            //         .subscribe((value) => {
            //         });
            // }
            this.docsfile = null;
            this.exportFileFolderCreatePrompt = {
                visible: true,
                pending: false,
                onAnchorClick: () => {

                },
                onHide: () => {
                    // if (
                    //     this.responseRestPath.folderState === 'OK' &&
                    //     this.exportFileFolderCreatePrompt.approveSubscription &&
                    //     this.exportFileFolderCreatePrompt.approveSubscription.closed
                    // ) {
                    //     parent.createExportFileSub = this.sharedService
                    //         .exportFileCreateFolder(parent.ocrExportFileId,
                    //             this.userService.appData.userData.companySelect.companyId)
                    //         .pipe(
                    //             first(),
                    //             finalize(() => (parent.createExportFileSub = null))
                    //         )
                    //         .subscribe((value) => {
                    //             this.responseRestPath = value ? value['body'] : value;
                    //             if (!this.responseRestPath) {
                    //                 this.startChild();
                    //             } else {
                    //                 this.showModalCheckFolderFile = true;
                    //                 const checkFolderFile = setInterval(() => {
                    //                     if (this.showModalCheckFolderFile !== true) {
                    //                         clearInterval(checkFolderFile);
                    //                     } else {
                    //                         this.sharedService
                    //                             .checkFolderFile(parent.ocrExportFileId)
                    //                             .subscribe((res) => {
                    //                                 if (res && res.body && res.body !== 'NOT_DONE') {
                    //                                     this.showModalCheckFolderFile = res.body;
                    //                                     clearInterval(checkFolderFile);
                    //                                     if (
                    //                                         res.body === 'ERROR' &&
                    //                                         !this.userService.appData.isAdmin
                    //                                     ) {
                    //                                         this.sharedService
                    //                                             .folderError({
                    //                                                 companyId:
                    //                                                 this.userService.appData.userData
                    //                                                     .companySelect.companyId,
                    //                                                 ocrExportFileId: parent.ocrExportFileId
                    //                                             })
                    //                                             .subscribe((value) => {
                    //                                             });
                    //                                     }
                    //                                 }
                    //                             });
                    //                     }
                    //                 }, 5000);
                    //             }
                    //         });
                    // }
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
                    // this.sharedService.exportFileManualDownload(parent.ocrExportFileId)
                    //     .pipe(
                    //         map(response => response && !response.error ? response.body : null),
                    //         first()
                    //     )
                    //     .subscribe(docfile => {
                    //             if (docfile) {
                    //
                    //                 // requestAnimationFrame(() => {
                    //                 //     this.saveFileToDisk(docfile.docfile, docfile.paramsfile).then((resData) => {
                    //                 //         this.exportFileFolderCreatePrompt.visible = false;
                    //                 //         this.startChild();
                    //                 //     });
                    //                 //
                    //                 //     // const a = document.createElement('a');
                    //                 //     // a.target = '_parent';
                    //                 //     // a.href = docfile.paramsfile;
                    //                 //     // (document.body || document.documentElement).appendChild(a);
                    //                 //     // a.click();
                    //                 //     // a.parentNode.removeChild(a);
                    //                 //     //
                    //                 //     // setTimeout(function () {
                    //                 //     //     const a2 = document.createElement('a');
                    //                 //     //     a2.target = '_parent';
                    //                 //     //     a2.href = docfile.docfile;
                    //                 //     //     (document.body || document.documentElement).appendChild(a2);
                    //                 //     //     a2.click();
                    //                 //     //     a2.parentNode.removeChild(a2);
                    //                 //     // }, 2000);
                    //                 // });
                    //             }
                    //         }, (err: HttpErrorResponse) => {
                    //             this.responseRestPath = true;
                    //             this.showModalCheckFolderFile = 'ERROR';
                    //             if (err.error instanceof Error) {
                    //                 console.log('An error occurred:', err.error.message);
                    //             } else {
                    //                 console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
                    //             }
                    //         }
                    //     );
                }
            };
        } else if (this.responseRestPath.folderState === 'NOT_EXIST') {
            this.docsfile = null;
            this.exportFileFolderCreatePrompt = {
                alertDownloadedOneFileOnly: false,
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
                                    .exportFileCreateFolder(this.ocrExportFileId, this.userService.appData.userData.companySelect.companyId)
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
                                    this.responseRestPath.folderState === 'OK' &&
                                    this.exportFileFolderCreatePrompt.visible
                                ) {
                                    this.exportFileFolderCreatePrompt.visible = false;
                                }
                            })
                        )
                        .subscribe((response: any) => {
                            this.responseRestPath = response;
                            // this.userService.appData.countStatusData =
                            //     response && !!response.exporterState
                            //         ? response.exporterState
                            //         : null;
                        });
                },
                onHide: () => {
                    if (
                        this.responseRestPath.folderState === 'OK' &&
                        this.exportFileFolderCreatePrompt.approveSubscription &&
                        this.exportFileFolderCreatePrompt.approveSubscription.closed
                    ) {
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

                        // parent.createExportFileSub = this.sharedService
                        //     .exportFileCreateFolder(parent.ocrExportFileId,
                        //         this.userService.appData.userData.companySelect.companyId)
                        //     .pipe(
                        //         first(),
                        //         finalize(() => (parent.createExportFileSub = null))
                        //     )
                        //     .subscribe((value) => {
                        //         this.responseRestPath = value ? value['body'] : value;
                        //         if (!this.responseRestPath) {
                        //             this.startChild();
                        //         } else {
                        //             this.showModalCheckFolderFile = true;
                        //             const checkFolderFile = setInterval(() => {
                        //                 if (this.showModalCheckFolderFile !== true) {
                        //                     clearInterval(checkFolderFile);
                        //                 } else {
                        //                     this.sharedService
                        //                         .checkFolderFile(parent.ocrExportFileId)
                        //                         .subscribe((res) => {
                        //                             if (res && res.body && res.body !== 'NOT_DONE') {
                        //                                 this.showModalCheckFolderFile = res.body;
                        //                                 clearInterval(checkFolderFile);
                        //                                 if (
                        //                                     res.body === 'ERROR' &&
                        //                                     !this.userService.appData.isAdmin
                        //                                 ) {
                        //                                     this.sharedService
                        //                                         .folderError({
                        //                                             companyId:
                        //                                             this.userService.appData.userData
                        //                                                 .companySelect.companyId,
                        //                                             ocrExportFileId: parent.ocrExportFileId
                        //                                         })
                        //                                         .subscribe((value) => {
                        //                                         });
                        //                                 }
                        //                             }
                        //                         });
                        //                 }
                        //             }, 5000);
                        //         }
                        //     });
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

    private rebuildSupplierHpMap(withOtherFiltersApplied: any[]): void {
        const supplierHpMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.supplierHp &&
                        dtRow.supplierHp.toString() &&
                        !acmltr[dtRow.supplierHp.toString()]
                    ) {
                        acmltr[dtRow.supplierHp.toString()] = {
                            val: dtRow.supplierHp.toString(),
                            id: dtRow.supplierHp.toString(),
                            checked: true
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.supplierHp.toString()].checked
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
        this.supplierHpArr = Object.values(supplierHpMap);
        console.log('this.supplierHpArr => %o', this.supplierHpArr);
    }

    private rebuildIndexMap(withOtherFiltersApplied: any[]): void {
        const indexArrMap: { [key: string]: any } = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (
                    dtRow.cust &&
                    dtRow.cust.toString() &&
                    !acmltr[dtRow.cust.toString()]
                ) {
                    acmltr[dtRow.cust.toString()] = {
                        val: dtRow.cust.toString(),
                        id: dtRow.cust.toString(),
                        checked: true
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.cust.toString()].checked) {
                        acmltr['all'].checked = false;
                    }
                }
                return acmltr;
            },
            Object.assign(
                {
                    all: {
                        val: this.translate.translations[this.translate.currentLang].filters
                            .all,
                        id: 'all',
                        checked: true
                    }
                },
                withOtherFiltersApplied.some((item) => !item.cust)
                    ? {
                        ריקים: {
                            val: 'ריקים',
                            id: 'null',
                            checked: true
                        }
                    }
                    : {}
            )
        );
        this.indexArr = Object.values(indexArrMap);
        console.log('this.indexArr => %o', this.indexArr);
    }

    private rebuildTransTypeCodeMap(withOtherFiltersApplied: any[]): void {
        const transTypeCodeArrMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.transTypeCode &&
                        dtRow.transTypeCode.toString() &&
                        !acmltr[dtRow.transTypeCode.toString()]
                    ) {
                        acmltr[dtRow.transTypeCode.toString()] = {
                            val: dtRow.transTypeCode.toString(),
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
                Object.assign(
                    {
                        all: {
                            val: this.translate.translations[this.translate.currentLang]
                                .filters.all,
                            id: 'all',
                            checked: true
                        }
                    },
                    withOtherFiltersApplied.some((item) => !item.transTypeCode)
                        ? {
                            ריקים: {
                                val: 'ריקים',
                                id: 'null',
                                checked: true
                            }
                        }
                        : {}
                )
            );
        this.transTypeCodeArr = Object.values(transTypeCodeArrMap);
        console.log('this.transTypeCodeArr => %o', this.transTypeCodeArr);
    }

    private rebuildMaamPrcMap(withOtherFiltersApplied: any[]): void {
        const maamPrcArrMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.maamPrc &&
                        dtRow.maamPrc.toString() &&
                        !acmltr[dtRow.maamPrc.toString()]
                    ) {
                        const vatOptionFound = this.vatOptions.find(
                            (it) => it.value === dtRow.maamPrc.toString()
                        );
                        acmltr[dtRow.maamPrc.toString()] = {
                            val: vatOptionFound
                                ? vatOptionFound.label
                                : dtRow.maamPrc.toString(),
                            id: dtRow.maamPrc.toString(),
                            checked: true
                        };
                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.maamPrc.toString()].checked
                        ) {
                            acmltr['all'].checked = false;
                        }
                    }
                    return acmltr;
                },
                Object.assign(
                    {
                        all: {
                            val: this.translate.translations[this.translate.currentLang]
                                .filters.all,
                            id: 'all',
                            checked: true
                        }
                    },
                    withOtherFiltersApplied.some((item) => !item.maamPrc)
                        ? {
                            ריקים: {
                                val: 'ריקים',
                                id: 'null',
                                checked: true
                            }
                        }
                        : {}
                )
            );
        this.maamPrcArr = Object.values(maamPrcArrMap);
        console.log('this.maamPrcArr => %o', this.maamPrcArr);
    }

    private rebuildOppositeCustMap(withOtherFiltersApplied: any[]): void {
        const oppositeCustArrMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.oppositeCust &&
                        dtRow.oppositeCust.toString() &&
                        !acmltr[dtRow.oppositeCust.toString()]
                    ) {
                        acmltr[dtRow.oppositeCust.toString()] = {
                            val: dtRow.oppositeCust.toString(),
                            id: dtRow.oppositeCust.toString(),
                            checked: true
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.oppositeCust.toString()].checked
                        ) {
                            acmltr['all'].checked = false;
                        }
                    }
                    return acmltr;
                },
                Object.assign(
                    {
                        all: {
                            val: this.translate.translations[this.translate.currentLang]
                                .filters.all,
                            id: 'all',
                            checked: true
                        }
                    },
                    withOtherFiltersApplied.some((item) => !item.oppositeCust)
                        ? {
                            ריקים: {
                                val: 'ריקים',
                                id: 'null',
                                checked: true
                            }
                        }
                        : {}
                )
            );

        this.oppositeCustArr = Object.values(oppositeCustArrMap);
        console.log('this.oppositeCustArr => %o', this.oppositeCustArr);
    }

    private rebuildEditMap(withOtherFiltersApplied: any[]): void {
        const base = [
            {
                checked: true,
                id: 'all',
                val: 'הכל'
            }
        ];

        if (withOtherFiltersApplied.filter((it) => it.flag).length) {
            base.push({
                checked: true,
                id: 'flag',
                val: 'דגל'
            });
        }
        if (withOtherFiltersApplied.filter((it) => it.note !== null).length) {
            base.push({
                checked: true,
                id: 'note',
                val: 'פיתקית'
            });
        }
        if (
            withOtherFiltersApplied.filter(
                (it) => it.flag === false && it.note === null
            ).length
        ) {
            base.push({
                checked: true,
                id: 'withoutMark',
                val: 'ללא סימון'
            });
        }

        this.editArr = base;
        console.log('this.editArr => %o', this.editArr);
    }

    private rebuildMonthsJournalTransMap(withOtherFiltersApplied: any[]): void {
        const monthsMap: { [key: string]: any } = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (
                    dtRow.maamMonth &&
                    dtRow.maamMonth.toString() &&
                    !acmltr[dtRow.maamMonth.toString()]
                ) {
                    acmltr[dtRow.maamMonth.toString()] = {
                        val: dtRow.maamMonth.toString(),
                        id: dtRow.maamMonth.toString(),
                        checked: true
                    };

                    if (
                        acmltr['all'].checked &&
                        !acmltr[dtRow.maamMonth.toString()].checked
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
        this.monthsJournalTransArr = Object.values(monthsMap);
        console.log('this.monthsJournalTransArr => %o', this.monthsJournalTransArr);
    }

    private rebuildQuickApproveMap(withOtherFiltersApplied: any[]): void {
        const quickApproveMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.quickApprove !== undefined &&
                        dtRow.quickApprove.toString() &&
                        !acmltr[dtRow.quickApprove.toString()]
                    ) {
                        acmltr[dtRow.quickApprove.toString()] = {
                            val: dtRow.quickApprove ? 'זיהוי מלא' : 'זיהוי חלקי',
                            id: dtRow.quickApprove.toString(),
                            checked: true
                        };
                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.quickApprove.toString()].checked
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
        this.quickApproveArr = Object.values(quickApproveMap);
        console.log('this.quickApproveArr => %o', this.quickApproveArr);
    }

    private rebuildMaamPrcJournalTransMap(withOtherFiltersApplied: any[]): void {
        const monthsMap: { [key: string]: any } = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (
                    dtRow.maamPrc &&
                    dtRow.maamPrc.toString() &&
                    !acmltr[dtRow.maamPrc.toString()]
                ) {
                    acmltr[dtRow.maamPrc.toString()] = {
                        val: dtRow.maamPrcDesc.toString(),
                        id: dtRow.maamPrc.toString(),
                        checked: true
                    };

                    if (
                        acmltr['all'].checked &&
                        !acmltr[dtRow.maamPrc.toString()].checked
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
        this.maamPrcArr = Object.values(monthsMap);
        console.log('this.maamPrcArr => %o', this.maamPrcArr);
    }

    private handleCountStatusResponse(response: any) {
        const countStatusData =
            response && !response.error
                ? (response.body as {
                    ocrExportFileData: any;
                    companyId: string;
                    forCare: number;
                    forConfirm: number;
                    forLogic: number;
                    journalTrans: number;
                    lastUploadDate: number;
                    userCancelToast: { text: string; ocrExportFileId: string } | null;
                    systemCancelToast: { text: string; ocrExportFileId: string } | null;
                })
                : null;

        if (this.fileStatus === 'CREATE_JOURNAL_TRANS') {
            if (
                JSON.stringify(countStatusData.ocrExportFileData) !==
                JSON.stringify(this.countStatusDataFixed.ocrExportFileData)
            ) {
                this.startChild();
            }
        }

        if (
            this.fileStatus !== 'CREATE_JOURNAL_TRANS' &&
            countStatusData &&
            !this.journalTransComponent.fileScanView &&
            (!this.journalTransComponent.uploadFilesOcrPopUp ||
                (this.journalTransComponent.uploadFilesOcrPopUp &&
                    !this.journalTransComponent.uploadFilesOcrPopUp.visible)) &&
            (!this.journalTransComponent.scanFilesOcrPopUp ||
                (this.journalTransComponent.scanFilesOcrPopUp &&
                    !this.journalTransComponent.scanFilesOcrPopUp.visible))
        ) {
            const numNewDocs =
                countStatusData.forConfirm - this.countStatusDataFixed.forConfirmBase;
            if (numNewDocs > 0) {
                const text =
                    numNewDocs === 1
                        ? 'קיים מסמך חדש'
                        : 'קיימים ' + numNewDocs.toString() + ' מסמכים חדשים';
                this.snackBar.openFromComponent(NewDocsAvailablePromptComponent, {
                    duration: 0,
                    horizontalPosition: 'end',
                    verticalPosition: 'bottom',
                    direction: this.userService.appData.dir,
                    panelClass: 'docs-update-snack',
                    data: {
                        text: text,
                        onRefreshSelected: (() => {
                            this.snackBar.dismiss();
                            this.countStatusDataFixed.forConfirmBase =
                                countStatusData.forConfirm;
                            this.startChild();
                        }).bind(this)
                    }
                });
            }
        } else {
            this.snackBar.dismiss();
        }

        if (
            this.countStatusData &&
            countStatusData &&
            countStatusData.forLogic > 0
            // && (countStatusData.forLogic !== this.countStatusData.forLogic)
        ) {
            this.journalTransComponent.reportService.forLogic = {
                message: this.domSanitizer.bypassSecurityTrustHtml(
                    '<p>' +
                    (countStatusData.forLogic === 1
                        ? 'מסמך ממתין לפיענוח'
                        : countStatusData.forLogic + ' מסמכים ממתינים לפיענוח') +
                    '</p>'
                ),
                fired: false
            };
        } else {
            this.journalTransComponent.reportService.forLogic = null;
        }

        if (countStatusData) {
            this.journalTransComponent.reportService.cancelToast =
                countStatusData.userCancelToast
                    ? {
                        message: this.domSanitizer.bypassSecurityTrustHtml(
                            '<p>' + countStatusData.userCancelToast.text + '</p>'
                        ),
                        onClose: () => {
                            this.sharedService
                                .exportFileHideCancelToast(
                                    countStatusData.userCancelToast.ocrExportFileId
                                )
                                .pipe(first())
                                .subscribe(() => {
                                });
                        }
                    }
                    : countStatusData.systemCancelToast
                        ? {
                            message: this.domSanitizer.bypassSecurityTrustHtml(
                                '<p>' + countStatusData.systemCancelToast.text + '</p>'
                            ),
                            onClose: () => {
                                this.sharedService
                                    .exportFileHideCancelToast(
                                        countStatusData.systemCancelToast.ocrExportFileId
                                    )
                                    .pipe(first())
                                    .subscribe(() => {
                                    });
                            }
                        }
                        : null;
        }

        this.countStatusData = countStatusData || {};
        if (this.setForLogicAfterUpload && this.countStatusData.forLogic === 0) {
            this.countStatusDataFixed.forLogic = 0;
            this.setForLogicAfterUpload = false;
        }
        this.countStatusDataFixed.forConfirm = this.countStatusData.forConfirm;
        this.countStatusDataFixed.journalTrans = this.countStatusData.journalTrans;
        this.countStatusDataFixed.forCare = this.countStatusData.forCare;

        const newInterval =
            this.countStatusDataFixed.forLogic === 0 &&
            !this.setForLogicAfterUpload &&
            !this.journalTransComponent.reportService.cancelToast
                ? 2 * 60 * 1000
                : 5 * 1000;

        if (this.interval$.getValue() !== newInterval) {
            this.interval$.next(newInterval);
        }
    }
}
