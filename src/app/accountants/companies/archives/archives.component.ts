import {
    AfterViewInit,
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
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {ActivatedRoute, NavigationExtras, Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {StorageService} from '@app/shared/services/storage.service';
import {
    HttpClient,
    HttpErrorResponse,
    HttpEventType,
    HttpHeaders,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import {BehaviorSubject, EMPTY, interval, lastValueFrom, Observable, Subject, Subscription, timer, combineLatest} from 'rxjs';
import {SharedService} from '@app/shared/services/shared.service';
import {DomSanitizer, SafeHtml, SafeUrl} from '@angular/platform-browser';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    map, retry,
    startWith,
    switchMap,
    take,
    takeUntil,
    tap
} from 'rxjs/operators';
import {ReportService} from '@app/core/report.service';
import {
    NewDocsAvailablePromptComponent
} from '@app/accountants/companies/shared/new-docs-available-prompt/new-docs-available-prompt.component';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {OverlayPanel} from 'primeng/overlaypanel';
import {DatePipe} from '@angular/common';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {TranslateService} from '@ngx-translate/core';
import jsPDF from 'jspdf';
import {AccountantsDocComponent} from '@app/accountants/companies/shared/accountants-doc/accountants-doc.component';
import {
    ArchivesDateRangeSelectorComponent
} from '@app/shared/component/date-range-selectors/archives-date-range-selector.component';
// @ts-ignore
declare var Dynamsoft: any = window['Dynamsoft'];

import {RangePoint} from '@app/shared/component/date-range-selectors/presets';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {BrowserService} from '@app/shared/services/browser.service';
import {SelectItemGroup} from 'primeng/api/selectitemgroup';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {HttpServices} from '@app/shared/services/http.services';
import {ReloadServices} from '@app/shared/services/reload.services';
import {getPageHeight} from "@app/shared/functions/getPageHeight";


const PDFDocument = window['PDFLib'].PDFDocument;
const pdfjsLib = window['pdfjsLib'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/js/pdf.worker.js';

@Component({
    selector: 'app-archives',
    templateUrl: './archives.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ArchivesComponent
    extends ReloadServices
    implements AfterViewInit, OnDestroy, OnInit {
    public setForLogicAfterUpload = false;
    public openNoteData: any;
    @ViewChild('fileDropRef', {read: ElementRef}) fileDropRef: ElementRef;
    public subscription: Subscription;
    public countStatusDataFixed: any = false;
    public folders: any = false;
    public loader = false;
    public selcetAllFiles = false;
    public searchableList = ['companyHp', 'companyName'];
    public items = [];
    public queryString: string = '';
    public currentPage: number = 0;
    public entryLimit: number = 10;
    @Input() isModal: any = false;
    @Output() setFiles: EventEmitter<any> = new EventEmitter();
    @Input() counter: any = 10;
    public filterInput = new FormControl();
    public sortPipeDir: any = null;
    public uploadFilesOcrPopUp: {
        visible: boolean;
        urlsFiles: any;
    };
    public scanFilesOcrPopUp: {
        visible: boolean;
        urlsFiles: any;
    };
    public window: any = window;
    public innerHeight: any = window.innerHeight;
    public imageScaleNewInvoice: number = 1;
    public degRotateImg: number = 0;
    public finishedPrepareFiles = false;
    public filesForContainer: any = 0;
    public filesForContainerCompleted: any = 0;
    public numberOfFilesForUpload: any = 0;
    public files: any = [];
    public keepOriginFiles: boolean = false;
    public changeStateUploadFile: boolean = false;
    public rightSideTooltip: any = 0;
    public filesBeforeOrder: any = [];
    public filesOriginal: any = [];
    public filesFromFolder: any = false;
    public filesFromFolderSave: any = false;
    public progress: any;
    public folderSelect: any = null;
    public fileViewer: any = false;
    public fileViewerSaved: any = false;
    public typeUpload: any = false;
    public showDocumentStorageDataFired = false;
    public sidebarImgs: any = false;
    public timeFireHover: any = false;
    public isNgSrc: any = true;
    public finishedLoadedImgView = false;
    public postponed: {
        action: Observable<any>;
        message: SafeHtml;
        fired?: boolean;
    };
    public fileUploadProgress = false;
    public isPdf = false;
    public fileScanView: any = false;
    readonly docNote: {
        note: any;
        visible: boolean;
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
    readonly docFolders: {
        visible: boolean;
        companyId: any;
        fileId?: any;
        childId?: any;
        folderSelect: any;
        reset: () => void;
        onApprove: (folderSelect: any) => void;
        show(companyId: any): void;
    } = {
        visible: false,
        companyId: null,
        folderSelect: null,
        show(companyId: any): void {
        },
        onApprove: (folderSelect: any) => {
        },
        reset: () => {
        }
    };
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
    public subscriptionStatus: Subscription;
    public interGetFolders: Subscription;
    public interGetFiles: Subscription;
    public countStatusData: any = false;
    public companyFilesSortControl: any = new FormControl({
        label: 'מיון',
        orderBy: 'folderName',
        order: 'DESC'
    });
    public saveFolder: any = false;
    @ViewChildren('tooltipEdit') tooltipEditRef: OverlayPanel;
    public createFolderModal: {
        visible: boolean;
        progress: boolean;
        createType: boolean;
        folderName: any;
        approve: () => void;
        show(isEdit?: boolean, folderName?: string): void;
    };
    public editFileModal: {
        visible: boolean;
        progress: boolean;
        fileName: any;
        approve: () => void;
        show(name: string): void;
    };
    public stateScreen = 'folders';
    public valuesExistStr: any = false;
    public sortFoldersType: any = [
        {
            label: 'שם תיקייה',
            orderBy: 'folderName',
            order: 'DESC'
        },
        {
            label: 'בשימוש נפוץ',
            orderBy: 'lastUseDate',
            order: 'DESC'
        },
        {
            label: 'פתיחה אחרונה',
            orderBy: 'dateCreated',
            order: 'DESC'
        }
    ];
    public tooltipEditFolder: any;
    public folderToRemove: any = false;
    public filesSortControl: any = new FormControl({
        orderBy: 'sendDate',
        order: 'DESC'
    });
    public viewAsList: boolean = true;
    public invoiceDateArr: any[];
    public filterTypesInvoiceDate: any = null;
    public maamMonthArr: any[];
    public filterTypesMaamMonth: any = null;
    public showFloatNav: any = false;
    public tooltipEditFile: any;
    public fileToRemove: any = false;
    public sendDateFilterData = {
        fromDate: null,
        toDate: null
    };
    public invoiceDateFilterData = {
        fromDate: null,
        toDate: null
    };
    public editArr: any[];
    public filterTypesEdit: any = null;
    public isGotAbsorbedFolder = false;
    @ViewChild(AccountantsDocComponent) childAccountantsDoc: AccountantsDocComponent;
    @ViewChildren(ArchivesDateRangeSelectorComponent) archivesDateChildren: QueryList<ArchivesDateRangeSelectorComponent>;
    public filesFromFolderSaveParams: any = {
        pageNumber: 0,
        numberOfRowsPerPage: 50,
        totalPages: 0,
        totalElements: 0
    };
    public advancedSearchParams: any;
    public interval$: BehaviorSubject<number> = new BehaviorSubject(
        2 * 60 * 1000
    );


    public draggedIndex: number = -1;
    public onDragOverIndex: number = -1;
    public getCompanyData$: Observable<any>;
    public companyDataObj: any = false;
    public subscribeInter$: Subscription;
    public eventRclickUpload: any;
    public indexFileTimer = 0;
    public progressAll = new Subject<number>();
    public agreementPopup: any = false;
    @ViewChild('elemToPrint') elemToPrint: HTMLElement;
    public otherUpload: any = false;
    public sidebarImgsDescList: any = false;
    currencySign: any = false;
    public currencyList: any = [];
    readonly currencyList$: Observable<Array<SelectItemGroup>>;
    public rate = 0;
    isMatah = false;
    public companyCustomerDetails: any = false;
    public showDocumentListStorageDataFile: any = false;
    public typeOfStatus: any;
    scrollSubscription = Subscription.EMPTY;
    private _window = typeof window === 'object' && window ? window : null;
    private readonly destroyed$ = new Subject<void>();
    private readonly dtPipe: DatePipe;

    constructor(
        public userService: UserService,
        public reportService: ReportService,
        public httpServices: HttpServices,
        private _changeDetectionRef: ChangeDetectorRef,
        public override sharedComponent: SharedComponent,
        private sortPipe: SortPipe,
        public translate: TranslateService,
        private http: HttpClient,
        public sanitizer: DomSanitizer,
        private httpClient: HttpClient,
        private sumPipe: SumPipe,
        private ocrService: OcrService,
        private route: ActivatedRoute,
        private storageService: StorageService,
        private sharedService: SharedService,
        public snackBar: MatSnackBar,
        public router: Router
    ) {
        super(sharedComponent);

        this.dtPipe = new DatePipe('en-IL');
        if (this.isModal) {
            this.viewAsList = false;
        } else {
            const archivesViewAsList =
                this.storageService.localStorageGetterItem('archivesViewAsList');
            this.viewAsList = archivesViewAsList
                ? archivesViewAsList === 'true'
                : true;
        }

        this.advancedSearchParams = new FormGroup({
            fileName: new FormControl(null),
            supplierHp: new FormControl(null, [
                Validators.compose([
                    Validators.minLength(9),
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ])
            ]),
            batchNumber: new FormControl(null, [
                Validators.compose([Validators.pattern('\\d+')])
            ]),
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
            sendDateFrom: new FormControl(null),
            sendDateTill: new FormControl(null)
        });

        this.docNote = {
            note: null,
            visible: false,
            noteFC: new FormGroup({
                note: new FormControl(null)
            }),
            fd: null,
            show(fd?: any, showFloatNav?: any): void {
                if (fd) {
                    if (fd.fileDetails && fd.fileId) {
                        fd.fileDetails.fileId = fd.fileId;
                        this.fd = fd.fileDetails;
                    } else {
                        this.fd = fd;
                    }
                    this.noteFC.reset({
                        note: fd.note
                    });
                    this.note = fd.note;
                } else if (showFloatNav) {
                    this.fd = null;
                    this.noteFC.reset({
                        note:
                            showFloatNav.selcetedFiles.length === 1
                                ? showFloatNav.selcetedFiles[0].note
                                : ''
                    });
                    this.note =
                        showFloatNav.selcetedFiles.length === 1
                            ? showFloatNav.selcetedFiles[0].note
                            : '';
                }
                this.visible = true;
            },
            approve: () => {
                if (
                    !(this.showFloatNav && this.docNote.fd === null) &&
                    (this.docNote.noteFC.value.note || '').trim() ===
                    (this.docNote.fd.note || '').trim()
                ) {
                    this.docNote.visible = false;
                    return;
                }

                this.sharedService
                    .updateOcrDocumentData({
                        filesId:
                            this.showFloatNav && this.docNote.fd === null
                                ? this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                                : [this.docNote.fd.fileId],
                        flag:
                            this.showFloatNav && this.docNote.fd === null
                                ? this.showFloatNav.selcetedFiles.length === 1
                                    ? this.showFloatNav.selcetedFiles[0].flag
                                    : null
                                : this.docNote.fd.flag,
                        note: this.docNote.noteFC.value.note
                    })
                    .subscribe(
                        (response: any) => {
                            const idsFiles =
                                this.showFloatNav && this.docNote.fd === null
                                    ? this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                                    : [this.docNote.fd.fileId];
                            const note = this.docNote.noteFC.value.note;

                            if (this.showFloatNav && this.docNote.fd === null) {
                                this.showFloatNav.selcetedFiles.forEach((file) => {
                                    file.note = this.docNote.noteFC.value.note;
                                });
                            } else {
                                this.docNote.fd.note = this.docNote.noteFC.value.note;
                                if (this.docNote.fd.fileId) {
                                    this.filesFromFolderSave.forEach((fd) => {
                                        if (fd.fileId === this.docNote.fd.fileId) {
                                            fd.note = this.docNote.fd.note;
                                        }
                                    });
                                }
                            }
                            this.docNote.visible = false;
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
        };
        this.docFolders = {
            visible: false,
            companyId: null,
            folderSelect: null,
            fileId: null,
            childId: null,
            reset: () => {
                this.reportService.postponed = null;
            },
            show(companyId: any): void {
                this.reset();
                this.folderSelect = null;
                if (typeof companyId === 'string') {
                    this.companyId = companyId;
                } else {
                    this.companyId = companyId.companyId;
                    this.fileId = companyId.fileId;
                    if (companyId.childId) {
                        this.childId = companyId.childId;
                    }
                }
                this.visible = true;
            },
            onApprove: (folderSelect: any) => {
                console.log(folderSelect);
                if (this.otherUpload) {
                    this.docFolders.visible = false;
                    this.uploadFilesOcr();
                } else {
                    if (this.docFolders.childId) {
                        this.sharedService
                            .archiveSinglePage({
                                childId: this.docFolders.childId,
                                fileId: this.docFolders.fileId,
                                folderId: folderSelect.folderId
                            })
                            .subscribe((response: any) => {
                                const fileId = response ? response['body'] : response;
                                if (this.queryString && this.queryString.length) {
                                    this.fileSearch(this.queryString, null, (newFiles) => {
                                        const newFile = newFiles.find(
                                            (file) => file.fileId === fileId
                                        );
                                        this.childAccountantsDoc.setFile(newFile, newFiles);
                                    });
                                } else {
                                    this.fileSearch(
                                        this.saveFolder.text,
                                        this.saveFolder.folder,
                                        (newFiles) => {
                                            const newFile = newFiles.find(
                                                (file) => file.fileId === fileId
                                            );
                                            this.childAccountantsDoc.setFile(newFile, newFiles);
                                        }
                                    );
                                }
                                this.docFolders.visible = false;
                            });
                    } else {
                        this.reportService.postponed = {
                            action: this.sharedService.changeFileFolder({
                                fileIds: this.docFolders.fileId
                                    ? [this.docFolders.fileId]
                                    : this.showFloatNav && !this.tooltipEditFile
                                        ? this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                                        : [this.tooltipEditFile.fileId],
                                folder: folderSelect.folderId,
                                userId: null
                            }),
                            message: this.sanitizer.bypassSecurityTrustHtml(
                                !this.docFolders.fileId &&
                                this.showFloatNav &&
                                !this.tooltipEditFile &&
                                this.showFloatNav.selcetedFiles.length > 1
                                    ? this.showFloatNav.selcetedFiles.length +
                                    (' מסמכים הועברו ' +
                                        '<b>' +
                                        'לתיקיית ' +
                                        folderSelect.folderName +
                                        '</b>')
                                    : 'המסמך הועבר ' +
                                    '<b>' +
                                    'לתיקיית ' +
                                    folderSelect.folderName +
                                    '</b>'
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
                            .subscribe(() => {
                                this.tooltipEditFile = null;
                                if (this.queryString && this.queryString.length) {
                                    this.fileSearch(this.queryString);
                                } else {
                                    this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
                                }
                                if (this.fileScanView) {
                                    this.childAccountantsDoc.setFile(
                                        this.childAccountantsDoc.navigatorData$.value.forwardLink
                                    );
                                }
                            });

                        this.docFolders.visible = false;
                    }
                }
            }
        };
        this.createFolderModal = {
            visible: false,
            progress: false,
            createType: true,
            folderName: new FormControl('', {
                validators: [Validators.required]
            }),
            show(isEdit?: boolean, folderName?: string): void {
                if (isEdit) {
                    this.createType = false;
                    this.folderName.reset(folderName);
                } else {
                    this.createType = true;
                    this.folderName.reset('');
                }
                this.visible = true;
            },
            approve: () => {
                this.createFolderModal.progress = true;
                this.createFolderModal.visible = false;
                if (this.createFolderModal.createType) {
                    this.createFolder();
                } else {
                    this.updateFolderName();
                }
            }
        };
        this.editFileModal = {
            visible: false,
            progress: false,
            fileName: new FormControl('', {
                validators: [Validators.required]
            }),
            show(name: string): void {
                this.fileName.reset(name);
                this.visible = true;
            },
            approve: () => {
                this.editFileModal.progress = true;
                this.editFileModal.visible = false;
                this.updateFileName();
            }
        };
        this.filterInput.valueChanges
            .pipe(debounceTime(1000), distinctUntilChanged())
            .subscribe((term) => {
                this.queryString = term;
                if (this.queryString !== null) {
                    if (!this.saveFolder) {
                        if (this.queryString.length) {
                            if (!this.saveFolder) {
                                this.fileSearch(this.queryString, false, false, true);
                            } else {
                                this.fileSearch(
                                    this.queryString,
                                    this.saveFolder.folder,
                                    false,
                                    true
                                );
                            }
                        } else {
                            this.saveFolder = false;
                            this.stateScreen = 'folders';
                        }
                    } else {
                        this.fileSearch(
                            this.queryString,
                            this.saveFolder.folder,
                            false,
                            true
                        );
                    }
                }
            });

        this.ocrService.getCurrencyList().subscribe((currencies) => {
            this.currencyList = currencies;
        });
    }

    get isWindows() {
        return (
            window.navigator['userAgentData']['platform'] === "Windows"
        );
    }

    get maxSizeHeightModal() {
        return window.innerHeight - 300;
    }

    get companyHpEmail(): string {
        if (
            this.userService.appData.userData.companySelect &&
            this.userService.appData.userData.companySelect.companyHp
        ) {
            return (
                (
                    '000000000' +
                    this.userService.appData.userData.companySelect.companyHp
                ).slice(-9) + '@biziboxcpa.com'
            );
        }
        return '';
    }

    @HostListener('window:keydown', ['$event'])
    handleKeyDown(event: KeyboardEvent) {
        if (this.fileScanView && event.code === 'Escape') {
            this.fileScanView = false;
        }
        if (
            (event.ctrlKey || event.metaKey) &&
            (event.code === 'KeyA')
        ) {
            if (this.files.length && this.fileViewer) {
                this.selcetAllFiles = !this.selcetAllFiles;
                this.files.forEach((fd, index) => {
                    fd.selcetFile = this.selcetAllFiles;
                });
                return false;
            } else if (!this.viewAsList && !this.docNote.visible) {
                this.selcetAllFiles = !this.selcetAllFiles;
                this.selecteAllFilesEvent();
                return false;
            }
        }
        return true;
    }

    @HostListener('document:dragover', ['$event'])
    @HostListener('drop', ['$event'])
    onDragDropFileVerifyZone(event) {
        // if (event.target.matches('div.drop_zone')) {
        //     // In drop zone. I don't want listeners later in event-chain to meddle in here
        //     event.stopPropagation();
        // } else {
        //     // Outside of drop zone! Prevent default action, and do not show copy/move icon
        //
        // }

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

    override reload() {
        console.log('reload child');
        this.fileScanView = false;
        this.getFolders();
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

    eventRightPos(event: any) {
        this.rightSideTooltip =
            window.innerWidth -
            (event.target.parentElement.offsetLeft + event.target.offsetWidth) -
            33;
    }

    ngOnInit() {
        this.reportService.joinToBizibox$.next(false);
        this._changeDetectionRef.detectChanges();
        if (this.isModal) {
            this.viewAsList = false;
        }
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
                    this.userService.appData.userData.companySelect &&
                    this.userService.appData.userData.companySelect.METZALEM
                ) {
                    this.agreementPopup = this.userService.appData.userData.companySelect
                        .agreementPopup
                        ? {
                            agreementConfirmation: null,
                            sendMarketingInformation: null,
                            agreementClicked: false,
                            step: 1
                        }
                        : false;
                }

                this.fileScanView = false;
                this.getFolders();

                this.getCompanyData$ = this.sharedService
                    .getCompanyData({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .pipe(
                        tap(() => {
                            this.companyDataObj = false;
                        }),
                        map((response: any) => {
                            if (response && !response.error && response.body) {
                                return response.body;
                            } else {
                                return {};
                            }
                        }),
                        tap((data: any) => {
                            this.companyDataObj = data;
                        })
                    );
            });
        this.route.queryParams.subscribe((params) => {
            if (params['tab']) {
                const navigationExtras: NavigationExtras = {
                    queryParams: {id: params['id']},
                    queryParamsHandling: null,
                    relativeTo: this.route
                };
                this.router.navigate([], navigationExtras);
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

    refreshBack($event?: any) {
        if ($event) {
            this.getCountStatus();
            if (this.queryString && this.queryString.length) {
                this.fileSearch(this.queryString);
            } else {
                this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
            }
        }
    }

    getCountStatus(): void {
        if (!this.isModal) {
            this.countStatusDataFixed = false;
            if (this.subscriptionStatus) {
                this.subscriptionStatus.unsubscribe();
            }
            this.sharedService
                .countStatus({
                    uuid: this.userService.appData.userData.companySelect.companyId
                })
                .subscribe((response: any) => {
                    this.countStatusDataFixed = response ? response['body'] : response;
                    this.countStatusDataFixed.forConfirmBase =
                        this.countStatusDataFixed.forConfirm;
                    if (response['body'].forLogic > 0) {
                        this.reportService.forLogic = {
                            message: this.sanitizer.bypassSecurityTrustHtml(
                                '<p>' +
                                (response['body'].forLogic === 1
                                    ? 'מסמך ממתין לפיענוח'
                                    : response['body'].forLogic + ' מסמכים ממתינים לפיענוח') +
                                '</p>'
                            ),
                            fired: false
                        };
                    } else {
                        this.reportService.forLogic = null;
                    }

                    this.interval$.next(
                        this.countStatusDataFixed.forLogic === 0 &&
                        !this.setForLogicAfterUpload
                            ? 2 * 60 * 1000
                            : 5 * 1000
                    );
                    this.countStatus();
                });
        }
    }

    getFolders(): void {
        this.getCountStatus();
        this.loader = true;
        this.sharedService
            .getFolders({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                this.folders = response ? response['body'] : response;
                this.folders = this.folders.filter((folder) => folder);
                this.loader = false;
                if (this.folders && this.folders.length) {
                    if (this.userService.appData.savedUploadFile) {
                        const waitingFolder = this.folders.find(
                            (fl) =>
                                fl.folderId ===
                                this.userService.appData.savedUploadFile.folderId
                        );
                        if (waitingFolder) {
                            this.fileSearch(null, waitingFolder);
                        }
                    }
                    this.filtersAllFolders();
                }
            });
    }

    trackFolder(idx: number, item: any) {
        return (item ? item.folderId : null) || idx;
    }

    onScroll(scrollbarRef: any) {
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        this.scrollSubscription = scrollbarRef.scrolled.subscribe(e => {
            this.onScrollCubes();
        });
    }

    getPageHeightFunc(value: any) {
        return getPageHeight(value)
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

    countStatus($event?: any): void {
        if ($event) {
            this.fileScanView = false;
            this.getFolders();
            return;
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
                        this.userService.appData.userData.companySelect.companyId
                ),
                switchMap(() =>
                    this.sharedService.countStatus({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                ),
                takeUntil(this.destroyed$)
            )
            .subscribe((response: any) => {
                const numNewDocs =
                    response['body'].forConfirm -
                    this.countStatusDataFixed.forConfirmBase;
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
                                    response['body'].forConfirm;
                                this.getFolders();
                            }).bind(this)
                        }
                    });
                }

                if (this.countStatusData) {
                    if (response['body'].forLogic !== this.countStatusData.forLogic) {
                        this.reportService.forLogic = {
                            message: this.sanitizer.bypassSecurityTrustHtml(
                                '<p>' +
                                (response['body'].forLogic === 1
                                    ? 'מסמך ממתין לפיענוח'
                                    : response['body'].forLogic + ' מסמכים ממתינים לפיענוח') +
                                '</p>'
                            ),
                            fired: false
                        };
                    } else {
                        this.reportService.forLogic = null;
                    }
                }

                this.countStatusData = response ? response['body'] : response;
                if (
                    this.setForLogicAfterUpload &&
                    this.countStatusData.forLogic === 0
                ) {
                    this.countStatusDataFixed.forLogic = 0;
                    this.setForLogicAfterUpload = false;
                    this.interval$.next(2 * 60 * 1000);
                }
            });
    }

    submitChangesOPERATIONTYPE(item: any): void {
        const newValue = {
            label: item.value.label,
            orderBy: item.value.orderBy,
            order: item.value.order === 'ASC' ? 'DESC' : 'ASC'
        };
        this.sortFoldersType.find(
            (sortType) => sortType.orderBy === item.value.orderBy
        ).order = newValue.order;
        this.companyFilesSortControl.patchValue(newValue);
        this.filtersAllFolders();
    }

    filtersAllFolders(): void {
        switch (this.companyFilesSortControl.value.orderBy) {
            case 'lastUseDate':
            case 'dateCreated':
                // noinspection DuplicatedCode
                const notNumber = this.folders.filter(
                    (fd) =>
                        typeof fd[this.companyFilesSortControl.value.orderBy] !== 'number'
                );
                this.folders = this.folders
                    .filter(
                        (fd) =>
                            typeof fd[this.companyFilesSortControl.value.orderBy] === 'number'
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
            case 'folderName':
                // noinspection DuplicatedCode
                const nullValues = this.folders.filter(
                    (fd) => !fd[this.companyFilesSortControl.value.orderBy]
                );
                const realValuesFolders = this.folders.filter(
                    (fd) => fd[this.companyFilesSortControl.value.orderBy]
                );
                const isHebrew = realValuesFolders
                    .filter((it) =>
                        /[\u0590-\u05FF]/.test(
                            it[this.companyFilesSortControl.value.orderBy]
                        )
                    )
                    .sort((a, b) =>
                        a[this.companyFilesSortControl.value.orderBy] >
                        b[this.companyFilesSortControl.value.orderBy]
                            ? 1
                            : -1
                    );
                const isEnglish = realValuesFolders
                    .filter((it) =>
                        /^[A-Za-z]+$/.test(it[this.companyFilesSortControl.value.orderBy])
                    )
                    .sort((a, b) =>
                        a[this.companyFilesSortControl.value.orderBy] >
                        b[this.companyFilesSortControl.value.orderBy]
                            ? 1
                            : -1
                    );
                const isNumbers = realValuesFolders
                    .filter((it) =>
                        /^[0-9]+$/.test(it[this.companyFilesSortControl.value.orderBy])
                    )
                    .sort((a, b) =>
                        a[this.companyFilesSortControl.value.orderBy] >
                        b[this.companyFilesSortControl.value.orderBy]
                            ? 1
                            : -1
                    );
                const isOthers = realValuesFolders
                    .filter(
                        (it) =>
                            !/^[A-Za-z]+$/.test(
                                it[this.companyFilesSortControl.value.orderBy]
                            ) &&
                            !/^[0-9]+$/.test(
                                it[this.companyFilesSortControl.value.orderBy]
                            ) &&
                            !/[\u0590-\u05FF]/.test(
                                it[this.companyFilesSortControl.value.orderBy]
                            )
                    )
                    .sort((a, b) =>
                        a[this.companyFilesSortControl.value.orderBy] >
                        b[this.companyFilesSortControl.value.orderBy]
                            ? 1
                            : -1
                    );
                const folders = isHebrew.concat(
                    isEnglish,
                    isNumbers,
                    isOthers,
                    nullValues
                );
                this.folders =
                    this.companyFilesSortControl.value.order === 'DESC'
                        ? folders
                        : folders.reverse();
                break;
        }
        console.log(this.folders);
    }

    returnToFolders(): void {
        this.reportService.joinToBizibox$.next(false);
        this.filesFromFolderSaveParams = {
            pageNumber: 0,
            numberOfRowsPerPage: 50,
            totalPages: 0,
            totalElements: 0
        };
        this.selcetAllFiles = false;
        this.stateScreen = 'folders';
        this.filterTypesEdit = null;
        this.editArr = [];
        this.queryString = '';
        this.saveFolder = false;
        this.invoiceDateArr = null;
        this.filterTypesInvoiceDate = null;
        this.maamMonthArr = null;
        this.filterTypesMaamMonth = null;
        this.showFloatNav = false;
        this.tooltipEditFile = null;
        this.fileToRemove = false;
        this.filesFromFolder = false;
        this.filesFromFolderSave = false;
        this.filesSortControl = new FormControl({
            orderBy: 'sendDate',
            order: 'DESC'
        });
        this.sendDateFilterData = {
            fromDate: null,
            toDate: null
        };
        this.invoiceDateFilterData = {
            fromDate: null,
            toDate: null
        };
    }

    sendDateFilter(event: any) {
        this.sendDateFilterData = event;
        this.advancedSearchParams.patchValue({
            sendDateFrom: this.sendDateFilterData.fromDate,
            sendDateTill: this.sendDateFilterData.toDate
        });
        this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
    }

    updateOcrDocumentStatus() {
        this.sharedService
            .updateOcrDocumentStatus({
                fileStatus: 'WAIT_FOR_CONFIRM',
                filesId:
                    this.tooltipEditFile && this.tooltipEditFile.fileId
                        ? [this.tooltipEditFile.fileId]
                        : this.showFloatNav && this.showFloatNav.selcetedFiles.length
                            ? this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                            : [null]
                // 'folderId': this.folderSelect.folderId
            })
            .subscribe(
                (response: any) => {
                    if (this.queryString && this.queryString.length) {
                        this.fileSearch(this.queryString);
                    } else {
                        this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
                    }
                },
                (err: HttpErrorResponse) => {
                }
            );
    }

    invoiceDateFilter(event: any) {
        this.invoiceDateFilterData = event;
        this.advancedSearchParams.patchValue({
            invoiceDateFrom: this.invoiceDateFilterData.fromDate,
            invoiceDateTill: this.invoiceDateFilterData.toDate
        });
        this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
    }

    selectedParamsForSearch(event: any) {
        const arrOfKeys = Object.keys(event.value);
        this.valuesExistStr = arrOfKeys
            .filter(
                (it) =>
                    it !== 'invoiceDateFrom' &&
                    it !== 'invoiceDateTill' &&
                    it !== 'sendDateFrom' &&
                    it !== 'sendDateTill' &&
                    event.value[it]
            )
            .map((key) =>
                typeof event.value[key] === 'boolean'
                    ? key === 'niklat'
                        ? 'סטטוס נקלט'
                        : 'סטטוס ממתין לקליטה'
                    : typeof event.value[key] === 'object'
                        ? event.value[key].custId
                        : event.value[key]
            )
            .reverse()
            .join(', ');

        this.invoiceDateFilterData.fromDate =
            this.advancedSearchParams.get('invoiceDateFrom').value;
        this.invoiceDateFilterData.toDate =
            this.advancedSearchParams.get('invoiceDateTill').value;
        this.sendDateFilterData.fromDate =
            this.advancedSearchParams.get('sendDateFrom').value;
        this.sendDateFilterData.toDate =
            this.advancedSearchParams.get('sendDateTill').value;

        if (this.archivesDateChildren.length) {
            const invoiceDateFilterData = this.archivesDateChildren.last;
            if (this.invoiceDateFilterData.fromDate) {
                const mmntNow = this.userService.appData.moment(
                    this.invoiceDateFilterData.fromDate
                );
                const mmntPlus30d = this.userService.appData.moment(
                    this.invoiceDateFilterData.toDate
                );
                invoiceDateFilterData.customDatesPreset.from = new RangePoint(
                    mmntNow.date(),
                    mmntNow.month(),
                    mmntNow.year()
                );
                invoiceDateFilterData.customDatesPreset.till = new RangePoint(
                    mmntPlus30d.date(),
                    mmntPlus30d.month(),
                    mmntPlus30d.year()
                );
                invoiceDateFilterData.selectedPresetFromArchiveSearch =
                    invoiceDateFilterData.customDatesPreset;
            } else {
                invoiceDateFilterData.selectedPresetFromArchiveSearch = null;
            }

            const sendDateFilterData = this.archivesDateChildren.first;
            if (this.sendDateFilterData.fromDate) {
                const mmntNow = this.userService.appData.moment(
                    this.sendDateFilterData.fromDate
                );
                const mmntPlus30d = this.userService.appData.moment(
                    this.sendDateFilterData.toDate
                );
                sendDateFilterData.customDatesPreset.from = new RangePoint(
                    mmntNow.date(),
                    mmntNow.month(),
                    mmntNow.year()
                );
                sendDateFilterData.customDatesPreset.till = new RangePoint(
                    mmntPlus30d.date(),
                    mmntPlus30d.month(),
                    mmntPlus30d.year()
                );
                sendDateFilterData.selectedPresetFromArchiveSearch =
                    sendDateFilterData.customDatesPreset;
            } else {
                sendDateFilterData.selectedPresetFromArchiveSearch = null;
            }
        }
        this.fileSearch(this.saveFolder.text, this.saveFolder.folder, false, true);
    }

    cleanAdvancedSearch() {
        this.valuesExistStr = false;
        this.advancedSearchParams.patchValue({
            fileName: null,
            supplierHp: null,
            asmachta: null,
            batchNumber: null,
            totalBeforeMaamFrom: null,
            totalbeforeMaamTill: null,
            totalIncludeMaamFrom: null,
            totalIncludeMaamTill: null,
            custFrom: null,
            custTill: null,
            mamtinLeklita: false,
            niklat: false,
            invoiceDateFrom: null,
            invoiceDateTill: null,
            sendDateFrom: null,
            sendDateTill: null
        });
        this.invoiceDateFilterData.fromDate =
            this.advancedSearchParams.get('invoiceDateFrom').value;
        this.invoiceDateFilterData.toDate =
            this.advancedSearchParams.get('invoiceDateTill').value;
        this.sendDateFilterData.fromDate =
            this.advancedSearchParams.get('sendDateFrom').value;
        this.sendDateFilterData.toDate =
            this.advancedSearchParams.get('sendDateTill').value;
        if (this.queryString !== null && this.queryString.length) {
            if (!this.saveFolder) {
                this.fileSearch(this.queryString);
            } else {
                this.fileSearch(this.queryString, this.saveFolder.folder);
            }
        } else {
            this.reportService.joinToBizibox$.next(false);
            this.saveFolder = false;
            this.stateScreen = 'folders';
        }
    }

    focusSearch(inputSearch: any): void {
        setTimeout(() => {
            inputSearch.focus();
        }, 500);
    }

    fileSearch(
        text?: any,
        folder?: any,
        cb?: any,
        isSearchedByMainInputs?: boolean
    ): void {
        this.stateScreen = 'files';
        if (
            this.userService.appData.userData.companySelect.METZALEM &&
            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
            'KSAFIM' &&
            this.userService.appData.userData.companySelect.METZALEM_TYPE !==
            'KSAFIM_ANHALATHESHBONOT'
        ) {
            this.reportService.joinToBizibox$.next(true);
        }
        this.loader = true;
        if (!folder) {
            if (this.isModal) {
                this.viewAsList = false;
            } else {
                this.viewAsList = true;
            }
            this.saveFolder = false;
        } else {
            this.saveFolder = {
                text: text,
                folder: folder
            };
        }
        this.isGotAbsorbedFolder =
            folder && folder.folderId === '11111111-1111-1111-1111-111111111111';
        this.selcetAllFiles = false;
        this.sharedService
            .fileSearch(
                Object.assign(
                    {
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        folderIds: folder ? [folder.folderId] : [],
                        pageNum: isSearchedByMainInputs
                            ? 0
                            : this.filesFromFolderSaveParams.pageNumber,
                        pageSize: this.filesFromFolderSaveParams.numberOfRowsPerPage,
                        invoiceDateFrom: this.invoiceDateFilterData.fromDate
                            ? this.userService.appData
                                .moment(this.invoiceDateFilterData.fromDate)
                                .valueOf()
                            : null,
                        invoiceDateTill: this.invoiceDateFilterData.toDate
                            ? this.userService.appData
                                .moment(this.invoiceDateFilterData.toDate)
                                .endOf('day')
                                .valueOf()
                            : null,
                        sendDateFrom: this.sendDateFilterData.fromDate
                            ? this.userService.appData
                                .moment(this.sendDateFilterData.fromDate)
                                .valueOf()
                            : null,
                        sendDateTill: this.sendDateFilterData.toDate
                            ? this.userService.appData
                                .moment(this.sendDateFilterData.toDate)
                                .endOf('day')
                                .valueOf()
                            : null,
                        text: text ? text : null
                    },
                    !this.valuesExistStr
                        ? {}
                        : {
                            text: null,
                            fileName: this.advancedSearchParams.get('fileName').value,
                            supplierHp: this.advancedSearchParams.get('supplierHp').value,
                            asmachta: this.advancedSearchParams.get('asmachta').value,
                            totalBeforeMaamFrom: this.advancedSearchParams.get(
                                'totalBeforeMaamFrom'
                            ).value,
                            totalbeforeMaamTill: this.advancedSearchParams.get(
                                'totalbeforeMaamTill'
                            ).value,
                            totalIncludeMaamFrom: this.advancedSearchParams.get(
                                'totalIncludeMaamFrom'
                            ).value,
                            totalIncludeMaamTill: this.advancedSearchParams.get(
                                'totalIncludeMaamTill'
                            ).value,
                            custFrom: this.advancedSearchParams.get('custFrom').value
                                ? this.advancedSearchParams.get('custFrom').value.custId
                                : null,
                            custTill: this.advancedSearchParams.get('custTill').value
                                ? this.advancedSearchParams.get('custTill').value.custId
                                : null,
                            mamtinLeklita:
                            this.advancedSearchParams.get('mamtinLeklita').value,
                            batchNumber: this.advancedSearchParams.get('batchNumber').value,
                            niklat: this.advancedSearchParams.get('niklat').value
                        }
                )
            )
            .subscribe(
                (response: any) => {
                    const filesFromFolderSaveParams = response
                        ? response['body']
                        : response;
                    this.filesFromFolderSaveParams = {
                        pageNumber: filesFromFolderSaveParams.number,
                        numberOfRowsPerPage: filesFromFolderSaveParams.size,
                        totalPages: filesFromFolderSaveParams.totalPages,
                        totalElements: filesFromFolderSaveParams.totalElements
                    };
                    this.filesFromFolderSave =
                        filesFromFolderSaveParams && filesFromFolderSaveParams.content
                            ? filesFromFolderSaveParams.content
                            : [];
                    if (Array.isArray(this.filesFromFolderSave)) {
                        const monthNames = this.translate.instant(
                            'langCalendar.monthNames'
                        ) as string[];
                        for (const fd of this.filesFromFolderSave) {
                            fd.invoiceDateSrc = fd.invoiceDate;
                            fd.invoiceDate = this.dtPipe.transform(
                                fd.invoiceDate,
                                'dd/MM/yy'
                            );
                            if (this.isGotAbsorbedFolder && fd.maamMonth) {
                                const dt = this.userService.appData.moment(fd.maamMonth);
                                fd.maamMonth = monthNames[dt.month()] + ' ' + dt.format('YY');
                                fd.asmachta =
                                    fd.asmachta !== null ? String(fd.asmachta) : fd.asmachta;
                            }
                        }
                    } else {
                        this.filesFromFolderSave = [];
                    }
                    // if (this.filesFromFolderSave && this.filesFromFolderSave.length) {
                    //     this.filterInput.enable();
                    // } else {
                    //     this.filterInput.disable();
                    // }

                    this.filesFromFolder = JSON.parse(
                        JSON.stringify(this.filesFromFolderSave)
                    );

                    if (this.userService.appData.savedUploadFile) {
                        const fileUploaded = this.filesFromFolder.find(
                            (fl) =>
                                fl.fileId ===
                                this.userService.appData.savedUploadFile.file.fileId
                        );
                        this.showDocumentStorageData(fileUploaded.fileId, fileUploaded);
                        this.userService.appData.savedUploadFile = null;
                    }
                    if (cb) {
                        cb(this.filesFromFolder);
                    }
                    this.filtersAll();
                    console.log('fileSearch---', this.filesFromFolder);
                    if (folder) {
                        this.updateLastUseDate(folder.folderId);
                    }
                },
                (err: HttpErrorResponse) => {
                }
            );
    }

    filterCategory(type: any) {
        console.log('----------------type-------', type);
        if (type.type === 'invoiceDate') {
            this.filterTypesInvoiceDate = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'edit') {
            this.filterTypesEdit = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'maamMonth') {
            this.filterTypesMaamMonth = type.checked;
            this.filtersAll(type.type);
        }
    }

    filtersAll(priority?: string): void {
        this.loader = true;
        if (
            this.filesFromFolderSave &&
            Array.isArray(this.filesFromFolderSave) &&
            this.filesFromFolderSave.length
        ) {
            this.filesFromFolder = this.filesFromFolderSave;
            // this.filesFromFolder = !this.queryString ? this.filesFromFolderSave
            //     : this.filesFromFolderSave
            //         .filter(fd => {
            //             return [
            //                 fd.name,
            //                 fd.asmachta,
            //                 fd.totalIncludeMaam,
            //                 this.sumPipe.transform(fd.totalIncludeMaam),
            //                 this.dtPipe.transform(fd.sendDate, 'dd/MM/yy'),
            //                 fd.invoiceDate,
            //                 fd.folderName,
            //                 fd.statusDesc,
            //                 fd.maamMonth,
            //                 (this.userService.appData && this.userService.appData.isAdmin) ? fd.uniqueId : ''
            //             ]
            //                 .filter(v => (typeof v === 'string' || typeof v === 'number') && !!v)
            //                 .some(vstr => vstr.toString().includes(this.queryString));
            //         });

            if (this.viewAsList) {
                if (priority === 'invoiceDate') {
                    if (
                        this.filterTypesInvoiceDate &&
                        this.filterTypesInvoiceDate.length
                    ) {
                        this.filesFromFolder = this.filesFromFolder.filter((item) => {
                            if (item.invoiceDate || item.invoiceDate === null) {
                                return this.filterTypesInvoiceDate.some(
                                    (it) => it === String(item.invoiceDate)
                                );
                            }
                        });
                    } else if (
                        this.filterTypesInvoiceDate &&
                        !this.filterTypesInvoiceDate.length
                    ) {
                        this.filesFromFolder = [];
                    }
                }
                if (priority === 'maamMonth' && this.isGotAbsorbedFolder) {
                    if (this.filterTypesMaamMonth && this.filterTypesMaamMonth.length) {
                        this.filesFromFolder = this.filesFromFolder.filter((item) => {
                            if (item.maamMonth) {
                                return this.filterTypesMaamMonth.some(
                                    (it) => it === item.maamMonth.toString()
                                );
                            }
                        });
                    } else if (
                        this.filterTypesMaamMonth &&
                        !this.filterTypesMaamMonth.length
                    ) {
                        this.filesFromFolder = [];
                    }
                }
                if (priority === 'edit') {
                    if (this.filterTypesEdit && this.filterTypesEdit.length) {
                        this.filesFromFolder = this.filesFromFolder.filter((item) => {
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
                        this.filesFromFolder = [];
                    }
                }

                if (priority !== 'invoiceDate') {
                    this.rebuildInvoiceDate(this.filesFromFolder);
                }
                if (priority !== 'edit') {
                    this.rebuildEditMap(this.filesFromFolder);
                }
                if (priority !== 'maamMonth' && this.isGotAbsorbedFolder) {
                    this.rebuildMaamMonth(this.filesFromFolder);
                }
            }

            if (this.filesFromFolder.length > 1) {
                switch (this.filesSortControl.value.orderBy) {
                    case 'sendDate':
                    case 'totalIncludeMaam':
                        // noinspection DuplicatedCode
                        const notNumber = this.filesFromFolder.filter(
                            (fd) =>
                                typeof fd[this.filesSortControl.value.orderBy] !== 'number'
                        );
                        this.filesFromFolder = this.filesFromFolder
                            .filter(
                                (fd) =>
                                    typeof fd[this.filesSortControl.value.orderBy] === 'number'
                            )
                            .sort((a, b) => {
                                const lblA = a[this.filesSortControl.value.orderBy],
                                    lblB = b[this.filesSortControl.value.orderBy];
                                return lblA || lblB
                                    ? !lblA
                                        ? 1
                                        : !lblB
                                            ? -1
                                            : this.filesSortControl.value.order === 'ASC'
                                                ? lblA - lblB
                                                : lblB - lblA
                                    : 0;
                            })
                            .concat(notNumber);
                        break;
                    case 'name':
                    case 'asmachta':
                    case 'folderName':
                    case 'statusDesc':
                        // noinspection DuplicatedCode
                        const notString = this.filesFromFolder.filter(
                            (fd) =>
                                typeof fd[this.filesSortControl.value.orderBy] !== 'string'
                        );
                        this.filesFromFolder = this.filesFromFolder
                            .filter(
                                (fd) =>
                                    typeof fd[this.filesSortControl.value.orderBy] === 'string'
                            )
                            .sort((a, b) => {
                                const lblA = a[this.filesSortControl.value.orderBy],
                                    lblB = b[this.filesSortControl.value.orderBy];
                                return (
                                    (lblA || lblB
                                        ? !lblA
                                            ? 1
                                            : !lblB
                                                ? -1
                                                : lblA.localeCompare(lblB)
                                        : 0) *
                                    (this.filesSortControl.value.order === 'DESC' ? -1 : 1)
                                );
                            })
                            .concat(notString);
                        break;
                }
            }

            const selcetedFiles = this.filesFromFolder.filter((it) => it.selcetFile);
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedFilesRemove: selcetedFiles.every(
                        (file) => (file.details && file.statusDesc) || !file.details
                    ),
                    selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                    selcetedFilesNote: selcetedFiles.every((file) => file.note)
                };
            } else {
                this.showFloatNav = false;
            }

            if (!this.viewAsList) {
                this.filesFromFolder.forEach((fd, idx) => {
                    fd.idx = idx + 1;
                });
                const grouped = this.groupBy(this.filesFromFolder, (date) =>
                    this.dtPipe.transform(date.sendDate, 'MM/yy')
                );
                this.filesFromFolder = Array.from(grouped.values());
                console.log(this.filesFromFolder);
            }
        } else {
            this.filesFromFolder = [];
        }

        this.loader = false;
    }

    groupBy(list, keyGetter): any {
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

    toggleCompanyFilesOrderTo(field: any) {
        if (this.filesSortControl.value.orderBy === field) {
            this.filesSortControl.patchValue({
                orderBy: this.filesSortControl.value.orderBy,
                order: this.filesSortControl.value.order === 'ASC' ? 'DESC' : 'ASC'
            });
        } else {
            this.filesSortControl.patchValue({
                orderBy: field,
                order: 'DESC'
            });
        }
        this.filtersAll();
    }

    selecteAllFilesEvent(): void {
        if (this.viewAsList) {
            this.filesFromFolder.forEach((file) => {
                file.selcetFile = this.selcetAllFiles;
            });
            const selcetedFiles = this.filesFromFolder.filter((it) => it.selcetFile);
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedFilesRemove: selcetedFiles.every(
                        (file) => (file.details && file.statusDesc) || !file.details
                    ),
                    selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                    selcetedFilesNote: selcetedFiles.every((file) => file.note)
                };
            } else {
                this.showFloatNav = false;
            }
        } else {
            this.filesFromFolderSave.forEach((file) => {
                file.selcetFile = this.selcetAllFiles;
            });
            const selcetedFiles = this.filesFromFolderSave.filter(
                (it) => it.selcetFile
            );
            if (selcetedFiles.length > 1) {
                this.showFloatNav = {
                    selcetedFiles,
                    selcetedFilesRemove: selcetedFiles.every(
                        (file) => (file.details && file.statusDesc) || !file.details
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
        this.selcetAllFiles = this.filesFromFolder.every((file) => file.selcetFile);
        const selcetedFiles = this.filesFromFolder.filter((it) => it.selcetFile);
        if (selcetedFiles.length > 1) {
            this.showFloatNav = {
                selcetedFiles,
                selcetedFilesRemove: selcetedFiles.every(
                    (file) => (file.details && file.statusDesc) || !file.details
                ),
                selcetedFilesFlag: selcetedFiles.every((file) => file.flag),
                selcetedFilesNote: selcetedFiles.every((file) => file.note)
            };
        } else {
            this.showFloatNav = false;
        }
    }

    updateLastUseDate(folderId: string): void {
        this.sharedService
            .updateLastUseDate({
                uuid: folderId
            })
            .subscribe(
                (response: any) => {
                },
                (err: HttpErrorResponse) => {
                }
            );
    }

    advancedFileSearch(text: string): void {
        this.sharedService
            .advancedFileSearch({
                companyId: this.userService.appData.userData.companySelect.companyId,
                folderIds: [null],
                invoiceDateFrom: null,
                invoiceDateTill: null,
                sendDateFrom: null,
                sendDateTill: null,
                text: text
            })
            .subscribe(
                (response: any) => {
                    const res = response ? response['body'] : response;
                },
                (err: HttpErrorResponse) => {
                }
            );
    }

    createFolder(): void {
        this.sharedService
            .createFolder({
                companyId: this.userService.appData.userData.companySelect.companyId,
                folderName: this.createFolderModal.folderName.value
            })
            .subscribe(
                (response: any) => {
                    this.getFolders();
                    this.createFolderModal.progress = false;
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

    deleteFolder(): void {
        this.folderToRemove = false;
        this.reportService.postponed = {
            action: this.sharedService.deleteFolder({
                uuid: this.tooltipEditFolder.folderId
            }),
            message: this.sanitizer.bypassSecurityTrustHtml('התיקייה נמחקה בהצלחה'),
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
            .subscribe(() => {
                this.tooltipEditFile = null;
                this.getFolders();
            });
    }

    updateFolderName(): void {
        this.tooltipEditFolder.folderName = this.createFolderModal.folderName.value;
        this.sharedService
            .updateFolderName({
                id: this.tooltipEditFolder.folderId,
                name: this.createFolderModal.folderName.value
            })
            .subscribe(
                (response: any) => {
                    // this.getFolders();
                    this.tooltipEditFolder = null;
                    this.createFolderModal.progress = false;
                },
                (err: HttpErrorResponse) => {
                }
            );
    }

    updateOfficeFolder(): void {
        this.tooltipEditFolder.officeFolder = !this.tooltipEditFolder.officeFolder;
        this.sharedService
            .updateOfficeFolder({
                folderId: this.tooltipEditFolder.folderId,
                officeFolder: this.tooltipEditFolder.officeFolder,
                accountantOfficeId: this.userService.appData.userData.accountantOfficeId
            })
            .subscribe(
                () => {
                    this.tooltipEditFolder = null;
                    // this.getFolders();
                },
                (err: HttpErrorResponse) => {
                }
            );
    }

    deleteFile(): void {
        this.fileToRemove = false;
        this.reportService.postponed = {
            action: this.sharedService.deleteFile({
                ids:
                    this.tooltipEditFile && this.tooltipEditFile.fileId
                        ? [this.tooltipEditFile.fileId]
                        : this.showFloatNav && this.showFloatNav.selcetedFiles.length
                            ? this.showFloatNav.selcetedFiles.map((file) => file.fileId)
                            : [null]
            }),
            message: this.sanitizer.bypassSecurityTrustHtml(
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
            .subscribe(() => {
                if (this.queryString && this.queryString.length) {
                    this.fileSearch(this.queryString);
                } else {
                    this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
                }
            });
    }

    updateFileName(): void {
        const name = this.editFileModal.fileName.value;
        this.sharedService
            .updateFileName({
                id: this.tooltipEditFile.fileId,
                name: name,
                userId: null
            })
            .subscribe(
                (response: any) => {
                    this.filesFromFolderSave.find(
                        (file) => file.fileId === this.tooltipEditFile.fileId
                    ).name = name;
                    this.filesFromFolder.find(
                        (file) => file.fileId === this.tooltipEditFile.fileId
                    ).name = name;
                },
                (err: HttpErrorResponse) => {
                }
            );
    }

    round(num: number): number {
        return Math.round(num);
    }

    goToInvoice(file: any): void {
        if (this.viewAsList) {
            this.hideDocumentStorageData();
        }
        this.countStatusData = false;
        if (this.subscriptionStatus) {
            this.subscriptionStatus.unsubscribe();
        }
        this.fileScanViewOpen(file);
    }

    focusNote(): void {
        // setTimeout(() => {
        //     textarea.focus();
        // }, 500);
    }

    ngAfterViewInit(): void {
        console.log('ngAfterViewInit');
    }

    getItemSize(item) {
        return 33;
    }

    trackById(index: number, row: any): string {
        return row.fileId;
    }

    paginate(event) {
        this.filesFromFolderSaveParams.numberOfRowsPerPage = event.rows;
        this.filesFromFolderSaveParams.pageNumber = event.page;
        if (this.queryString && this.queryString.length) {
            this.fileSearch(this.queryString);
        } else {
            this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
        }
    }

    clear() {
        this.items = [];
    }

    uploadFilesOcr(type?: string): void {
        if (this.fileDropRef && this.fileDropRef.nativeElement) {
            this.fileDropRef.nativeElement.type = 'text';
            setTimeout(() => {
                if(this.fileDropRef && this.fileDropRef.nativeElement){
                    this.fileDropRef.nativeElement.type = 'file';
                }
            }, 200);
        }

        if (type) {
            this.otherUpload = false;
            this.typeUpload = type;
        } else {
            this.typeUpload = false;
        }
        this.fileViewer = false;

        this.files = [];
        this.filesOriginal = [];
        this.filesBeforeOrder = [];
        this.fileUploadProgress = false;
        this.progress = false;
        this.uploadFilesOcrPopUp = {
            visible: true,
            urlsFiles: {
                links: []
            }
        };
        this.folderSelect = false;
    }

    loadScanFilesOcr(): void {
        this.filesBeforeOrder = [];
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

    resetVarsUpload() {
        this.files = [];
        this.filesBeforeOrder = [];
        this.filesOriginal = [];
        if (this.fileDropRef && this.fileDropRef.nativeElement) {
            this.fileDropRef.nativeElement.type = 'text';
            setTimeout(() => {
                if (this.fileDropRef && this.fileDropRef.nativeElement) {
                    if(this.fileDropRef && this.fileDropRef.nativeElement){
                        this.fileDropRef.nativeElement.type = 'file';
                    }
                }
            }, 200);
        }
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
        if (this.scanFilesOcrPopUp && this.scanFilesOcrPopUp.urlsFiles) {
            this.scanFilesOcrPopUp.urlsFiles = {
                links: []
            };
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
                        if(this.fileDropRef && this.fileDropRef.nativeElement){
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
            this.fileDropRef.nativeElement.type = 'text';
            setTimeout(() => {
                if(this.fileDropRef && this.fileDropRef.nativeElement){
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
            this.getFolders();
        } else {
            this.storageService.sessionStorageSetter(
                'accountants-doc-open',
                JSON.stringify(file)
            );
            this.router.navigate(
                ['/accountants/companies/journalTrans/suppliersAndCustomers'],
                {
                    queryParamsHandling: 'preserve',
                    relativeTo: this.route
                }
            );
        }
    }

    resetReloadAndReturnToMain() {
        this.files = [];
        this.filesBeforeOrder = [];
        this.fileDropRef.nativeElement.type = 'text';
        setTimeout(() => {
            if(this.fileDropRef && this.fileDropRef.nativeElement){
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
        this.returnToFolders();
        this.getFolders();
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

    // ShowImageEditor(idx, idxImg) {
    //     if (this.arr[idx].DWObject) {
    //         if (this.arr[idx].DWObject.HowManyImagesInBuffer == 0) {
    //             alert('There is no image in buffer.');
    //         } else {
    //             this.arr[idx].DWObject.ShowImageEditor();
    //         }
    //     }
    // }
    //
    // progressRunning() {
    //     this.showScanLoader = false;
    //     // let numProgress = 0;
    //     // const progress = new Subject<number>();
    //     // this.showProgressScan.progress = progress.asObservable();
    //     // progress.next(0);
    //     // const intervalProgress: Subscription = interval(150)
    //     //     .pipe(startWith(0)).subscribe(() => {
    //     //         numProgress += 1;
    //     //         if (numProgress <= 100) {
    //     //             progress.next(numProgress);
    //     //         } else {
    //     //             progress.complete();
    //     //             if (intervalProgress) {
    //     //                 intervalProgress.unsubscribe();
    //     //             }
    //     //         }
    //     //     });
    // }

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

    fileBrowseHandler(files: any) {
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

    formatPhone(phone: any): string {
        if (!phone) {
            return '';
        }
        phone = phone.toString();
        if (phone.length === 10) {
            return phone.slice(0, 3) + '-' + phone.slice(3);
        } else {
            return phone.slice(0, 2) + '-' + phone.slice(2);
        }
    }

    public openNote(note, $event, file) {
        const rect = $event.target.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        file.isBottom = window.innerHeight - (rect.top + scrollTop) < 140;
        // console.log('isBottom', file.isBottom);
        this.openNoteData = file;
        note.show($event);
    }

    removeFile(index: number) {
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
            if(this.fileDropRef && this.fileDropRef.nativeElement){
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

    calcMinus(num: number): number {
        if (num < 0) {
            return Math.abs(num);
        } else {
            return -num;
        }
    }

    sanitizeImageUrl(imageUrl: string): SafeUrl {
        return this.sanitizer.bypassSecurityTrustUrl(imageUrl);
    }

    uploadFromModalArchive() {
        this.sharedService
            .getUploadUrl({
                companyId: this.userService.appData.userData.companySelect.companyId,
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
                status: 'ARCHIVE',
                folderId: '33333333-3333-3333-3333-333333333333',
                expense: null,
                uploadSource: 'UPLOAD'
            })
            .subscribe((response: any) => {
                this.uploadFilesOcrPopUp.urlsFiles = response
                    ? response['body']
                    : response;
                const urlUpload = this.uploadFilesOcrPopUp.urlsFiles.links[0];
                console.log('responseFiles', this.uploadFilesOcrPopUp.urlsFiles);
                this.progress = this.uploadToServer(this.files);
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
                combineLatest(...allProgressObservables).subscribe((end) => {
                    this.progressAll.complete();
                    subscriptionTimer.unsubscribe();
                    subscriptionTimerGetFilesPing.unsubscribe();
                    this._window.removeEventListener('beforeunload', preventClose, true);
                    this.fileUploadProgress = false;
                    this.files = [];
                    this.uploadFilesOcrPopUp = {
                        visible: false,
                        urlsFiles: {
                            links: []
                        }
                    };
                    this.returnToFolders();
                    this.interGetFolders = interval(2000)
                        .pipe(
                            startWith(0),
                            switchMap(() =>
                                this.sharedService.getFolders({
                                    uuid: this.userService.appData.userData.companySelect
                                        .companyId
                                })
                            )
                        )
                        .subscribe((responseFolders) => {
                            const folders = responseFolders
                                ? responseFolders['body']
                                : responseFolders;
                            const isFolderExist = folders.find(
                                (folder) =>
                                    folder.folderId === '33333333-3333-3333-3333-333333333333'
                            );
                            if (isFolderExist) {
                                this.interGetFolders.unsubscribe();
                                this.folders = folders;
                                this.folders = this.folders.filter((folder) => folder);
                                if (this.folders && this.folders.length) {
                                    this.filtersAllFolders();
                                }
                                const text = null;
                                this.stateScreen = 'files';
                                if (!isFolderExist) {
                                    if (this.isModal) {
                                        this.viewAsList = false;
                                    } else {
                                        this.viewAsList = true;
                                    }
                                    this.saveFolder = false;
                                } else {
                                    this.saveFolder = {
                                        text: text,
                                        folder: isFolderExist
                                    };
                                }
                                this.isGotAbsorbedFolder =
                                    isFolderExist &&
                                    isFolderExist.folderId ===
                                    '11111111-1111-1111-1111-111111111111';
                                this.selcetAllFiles = false;
                                this.interGetFiles = interval(2000)
                                    .pipe(
                                        startWith(0),
                                        switchMap(() =>
                                            this.sharedService.fileSearch(
                                                Object.assign(
                                                    {
                                                        companyId:
                                                        this.userService.appData.userData.companySelect
                                                            .companyId,
                                                        folderIds: isFolderExist
                                                            ? [isFolderExist.folderId]
                                                            : [],
                                                        pageNum: this.filesFromFolderSaveParams.pageNumber,
                                                        pageSize:
                                                        this.filesFromFolderSaveParams
                                                            .numberOfRowsPerPage,
                                                        invoiceDateFrom: this.invoiceDateFilterData.fromDate
                                                            ? this.userService.appData
                                                                .moment(this.invoiceDateFilterData.fromDate)
                                                                .valueOf()
                                                            : null,
                                                        invoiceDateTill: this.invoiceDateFilterData.toDate
                                                            ? this.userService.appData
                                                                .moment(this.invoiceDateFilterData.toDate)
                                                                .endOf('day')
                                                                .valueOf()
                                                            : null,
                                                        sendDateFrom: this.sendDateFilterData.fromDate
                                                            ? this.userService.appData
                                                                .moment(this.sendDateFilterData.fromDate)
                                                                .valueOf()
                                                            : null,
                                                        sendDateTill: this.sendDateFilterData.toDate
                                                            ? this.userService.appData
                                                                .moment(this.sendDateFilterData.toDate)
                                                                .endOf('day')
                                                                .valueOf()
                                                            : null,
                                                        text: text ? text : null
                                                    },
                                                    !this.valuesExistStr
                                                        ? {}
                                                        : {
                                                            text: null,
                                                            fileName:
                                                            this.advancedSearchParams.get('fileName')
                                                                .value,
                                                            supplierHp:
                                                            this.advancedSearchParams.get('supplierHp')
                                                                .value,
                                                            asmachta:
                                                            this.advancedSearchParams.get('asmachta')
                                                                .value,
                                                            totalBeforeMaamFrom:
                                                            this.advancedSearchParams.get(
                                                                'totalBeforeMaamFrom'
                                                            ).value,
                                                            totalbeforeMaamTill:
                                                            this.advancedSearchParams.get(
                                                                'totalbeforeMaamTill'
                                                            ).value,
                                                            totalIncludeMaamFrom:
                                                            this.advancedSearchParams.get(
                                                                'totalIncludeMaamFrom'
                                                            ).value,
                                                            totalIncludeMaamTill:
                                                            this.advancedSearchParams.get(
                                                                'totalIncludeMaamTill'
                                                            ).value,
                                                            custFrom: this.advancedSearchParams.get(
                                                                'custFrom'
                                                            ).value
                                                                ? this.advancedSearchParams.get('custFrom')
                                                                    .value.custId
                                                                : null,
                                                            custTill: this.advancedSearchParams.get(
                                                                'custTill'
                                                            ).value
                                                                ? this.advancedSearchParams.get('custTill')
                                                                    .value.custId
                                                                : null,
                                                            mamtinLeklita:
                                                            this.advancedSearchParams.get('mamtinLeklita')
                                                                .value,
                                                            batchNumber:
                                                            this.advancedSearchParams.get('batchNumber')
                                                                .value,
                                                            niklat:
                                                            this.advancedSearchParams.get('niklat').value
                                                        }
                                                )
                                            )
                                        )
                                    )
                                    .subscribe((responseFiles) => {
                                        const filesFromFolderSaveParams = responseFiles
                                            ? responseFiles['body']
                                            : responseFiles;
                                        const filesFromFolderSave =
                                            filesFromFolderSaveParams &&
                                            filesFromFolderSaveParams.content
                                                ? filesFromFolderSaveParams.content
                                                : [];
                                        if (
                                            Array.isArray(filesFromFolderSave) &&
                                            filesFromFolderSave.length
                                        ) {
                                            const newFile = filesFromFolderSave.find((file) =>
                                                urlUpload.s3UploadUrl.includes(file.fileId)
                                            );
                                            if (newFile) {
                                                this.interGetFiles.unsubscribe();
                                                this.filesFromFolderSaveParams = {
                                                    pageNumber: filesFromFolderSaveParams.number,
                                                    numberOfRowsPerPage: filesFromFolderSaveParams.size,
                                                    totalPages: filesFromFolderSaveParams.totalPages,
                                                    totalElements: filesFromFolderSaveParams.totalElements
                                                };
                                                this.filesFromFolderSave = filesFromFolderSave;
                                                if (Array.isArray(this.filesFromFolderSave)) {
                                                    const monthNames = this.translate.instant(
                                                        'langCalendar.monthNames'
                                                    ) as string[];
                                                    for (const fd of this.filesFromFolderSave) {
                                                        fd.selcetFile = newFile.fileId === fd.fileId;
                                                        fd.invoiceDateSrc = fd.invoiceDate;
                                                        fd.invoiceDate = this.dtPipe.transform(
                                                            fd.invoiceDate,
                                                            'dd/MM/yy'
                                                        );
                                                        if (this.isGotAbsorbedFolder && fd.maamMonth) {
                                                            const dt = this.userService.appData.moment(
                                                                fd.maamMonth
                                                            );
                                                            fd.maamMonth =
                                                                monthNames[dt.month()] + ' ' + dt.format('YY');
                                                        }
                                                    }
                                                } else {
                                                    this.filesFromFolderSave = [];
                                                }
                                                this.filesFromFolder = JSON.parse(
                                                    JSON.stringify(this.filesFromFolderSave)
                                                );
                                                this.filtersAll();
                                                console.log('fileSearch---', this.filesFromFolder);
                                                if (isFolderExist) {
                                                    this.updateLastUseDate(isFolderExist.folderId);
                                                }
                                            }
                                        }
                                    });
                            }
                        });
                });
            });
    }

    async prepareFilesList(files: Array<any>) {
        if (this.isModal) {
            this.loader = true;
            this.files = [];
            this.uploadFilesOcrPopUp = {
                visible: false,
                urlsFiles: {
                    links: []
                }
            };
            this.fileUploadProgress = true;
            for (const item of files) {
                item['id'] = crypto['randomUUID']();
                if (item.size && item.size / 1048576 >= 7) {
                    item.src = null;
                    this.files.push(item);
                    this.filesBeforeOrder.push(item);
                    this.filesOriginal.push(item);
                    this.uploadFromModalArchive();
                } else {
                    if (item.type === 'application/pdf') {
                        // item.src = this.sanitizer.bypassSecurityTrustResourceUrl(
                        //     URL.createObjectURL(item) + '#toolbar=0&scrollbar=0&navpanes=0'
                        // );
                        // this.files.push(item);
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
                                itemPdf['isDigital'] = !!pdfData.info.IsSignaturesPresent;
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
                                        this.files.push(item);
                                        this.filesBeforeOrder.push(item);
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
                                    this.files.push(file);
                                    this.filesBeforeOrder.push(file);
                                }
                            } catch (errPdf: any) {
                                console.log(errPdf);
                                if (
                                    errPdf &&
                                    errPdf.message &&
                                    errPdf.message.includes('Invalid PDF structure')
                                ) {
                                    this.uploadFromModalArchive();
                                }
                            }
                        } else {
                            try {
                                await pdfjsLib.getDocument(typedArray).promise;
                                item.src = this.sanitizer.bypassSecurityTrustResourceUrl(
                                    URL.createObjectURL(item) +
                                    '#toolbar=0&scrollbar=0&navpanes=0'
                                );
                                this.files.push(item);
                                this.filesBeforeOrder.push(item);
                                this.filesOriginal.push(item);
                            } catch (errPdf: any) {
                                console.log(errPdf);
                                if (
                                    errPdf &&
                                    errPdf.message &&
                                    errPdf.message.includes('Invalid PDF structure')
                                ) {
                                    this.uploadFromModalArchive();
                                }
                            }
                        }

                        console.log(this.files)
                        this.uploadFromModalArchive();
                    } else if (
                        item.type.includes('image/') &&
                        item.type !== 'image/gif'
                    ) {
                        const reader: any = new FileReader();
                        reader.onload = () => {
                            item.src = this.sanitizeImageUrl(reader.result);
                            this.files.push(item);
                            this.filesBeforeOrder.push(item);
                            this.filesOriginal.push(item);
                            this.uploadFromModalArchive();
                        };
                        reader.readAsDataURL(item);
                    }
                }
            }
        } else {
            // for (const item of files) {
            //     if (item.type === 'application/pdf') {
            //         item.src = this.sanitizer.bypassSecurityTrustResourceUrl(
            //             URL.createObjectURL(item) + '#toolbar=0&scrollbar=0&navpanes=0'
            //         );
            //         this.files.push(item);
            //     } else {
            //         const reader:any = new FileReader();
            //         reader.onload = () => {
            //             item.src = this.sanitizeImageUrl(reader.result);
            //             this.files.push(item);
            //         };
            //         reader.readAsDataURL(item);
            //     }
            // }

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
                                itemPdf['isDigital'] = !!pdfData.info.IsSignaturesPresent;
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
                                    URL.createObjectURL(item) +
                                    '#toolbar=0&scrollbar=0&navpanes=0'
                                );
                                // this.files.push(item);
                                this.filesBeforeOrder.push(item);
                                this.filesForContainerCompleted =
                                    this.filesForContainerCompleted + 1;

                                item['numPages'] = pdf.numPages;
                                this.filesOriginal.push(item);

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
                    } else {
                        const reader: any = new FileReader();
                        reader.onload = () => {
                            item.src = this.sanitizeImageUrl(reader.result);
                            // this.files.push(item);
                            this.filesBeforeOrder.push(item);
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
                        };
                        reader.readAsDataURL(item);
                    }
                }
            }
        }
    }

    fileViewerOpen(type: string): void {
        this.fileViewer = type;
        this.fileViewerSaved = type;
        if (this.uploadFilesOcrPopUp && this.uploadFilesOcrPopUp.visible) {
            this.uploads(this.fileViewer);
        }
    }

    formatBytes(bytes, decimals) {
        if (bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const dm = decimals <= 0 ? 0 : decimals || 2;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
                            // const imageBase64 = await this.createImageBase64FromBlob(files[i]);
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
        this.sharedService
            .getUploadUrl({
                companyId: this.userService.appData.userData.companySelect.companyId,
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
                folderId:
                    type === 'ARCHIVE' ||
                    (this.userService.appData.userData.companySelect &&
                        this.userService.appData.userData.companySelect.METZALEM)
                        ? this.folderSelect.folderId
                        : null,
                expense:
                    this.userService.appData.userData.companySelect &&
                    this.userService.appData.userData.companySelect.METZALEM &&
                    this.typeUpload
                        ? this.typeUpload === 'exp'
                            ? 1
                            : this.typeUpload === 'inc'
                                ? 0
                                : null
                        : null,
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
                                this.returnToFolders();
                                this.getFolders();
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
                window.addEventListener('beforeunload', preventClose, true);
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
                combineLatest(...allProgressObservables).subscribe((end) => {
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
                    //             this.setForLogicAfterUpload = true;
                    //             this.interval$.next(5 * 1000);
                    //             this.returnToFolders();
                    //             this.getFolders();
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
                                this.userService.appData.userData.companySelect.companyName +
                                ' ועברו לפיענוח'
                        }
                    );
                    this.setForLogicAfterUpload = true;
                    this.interval$.next(5 * 1000);
                    this.returnToFolders();
                    this.getFolders();
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
                companyId: this.userService.appData.userData.companySelect.companyId,
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
                combineLatest(...allProgressObservables).subscribe((end) => {
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
                    //             this.setForLogicAfterUpload = true;
                    //             this.returnToFolders();
                    //             this.getFolders();
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
                                this.userService.appData.userData.companySelect.companyName +
                                ' ועברו לפיענוח'
                        }
                    );
                    this.setForLogicAfterUpload = true;
                    this.returnToFolders();
                    this.getFolders();
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

    onRightClick(event: any) {
        return false;
    }

    onRightClickInside(event: any) {
        const currentTarget = event.currentTarget;
        this.eventRclickUpload = currentTarget;
        this.eventRclickUpload.layerY = currentTarget.offsetTop;
        this.eventRclickUpload.layerX = currentTarget.offsetLeft;
    }

    trackByIndex(index: number, val: any): number {
        return index;
    }

    async onLoad(file: any): Promise<any> {
        if (!file.urlImgProgress && !file.urlImg) {
            file.urlImgProgress = true;
            const res = await lastValueFrom(this.sharedService
                .getDocumentStorageData([file.fileId]))
            if (
                res &&
                res['body'] &&
                res['body'][file.fileId] &&
                res['body'][file.fileId].length
            ) {
                const contentUrl = res['body'][file.fileId][0].contentUrl;
                if (this.isModal) {
                    const subscribeInter$ = interval(3000)
                        .pipe(startWith(0))
                        .subscribe(async () => {
                            try {
                                console.log('isModal: ', this.isModal);
                                if (this.isModal) {
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
                                    }
                                    if (subscribeInter$) {
                                        subscribeInter$.unsubscribe();
                                    }
                                    return contentUrl;
                                } else {
                                    if (subscribeInter$) {
                                        subscribeInter$.unsubscribe();
                                    }
                                }
                            } catch (error) {
                                console.log('isModal err 404: ', this.isModal);
                                if (!this.isModal) {
                                    if (subscribeInter$) {
                                        subscribeInter$.unsubscribe();
                                    }
                                }
                                // error.status === 404
                            }
                        });
                } else {
                    try {
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
                        }
                        return contentUrl;
                    } catch (error) {
                        // error.status === 404
                    }
                }
            }
        }
        return new Promise((resolve, reject) => {
            resolve('');
        });
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

    public actionRClick(
        file: any,
        actualTarget: any,
        $event: any,
        tooltipEdit: any
    ) {
        if (!this.isModal) {
            this.onScrollCubes();
            this.tooltipEditFile = file;
            tooltipEdit.toggle($event, actualTarget);
            this.onRightClick($event);
        } else {
            return false;
        }
        return true;
    }

    public onKeydownMain(event: any, file: any, idx?: number): void {
        if (!event.shiftKey) {
            event.preventDefault();
            if (this.files.length) {
                if ((event.ctrlKey || event.metaKey) && !this.isModal) {
                    file.selcetFile = !file.selcetFile;
                } else {
                    file.selcetFile = !file.selcetFile;
                    this.files.forEach((fd, index) => {
                        if (fd.selcetFile && index !== idx) {
                            fd.selcetFile = false;
                        }
                    });
                }
            } else {
                if ((event.ctrlKey || event.metaKey) && !this.isModal) {
                    file.selcetFile = !file.selcetFile;
                } else {
                    file.selcetFile = !file.selcetFile;
                    this.filesFromFolderSave.forEach((fd) => {
                        if (fd.selcetFile && fd.fileId !== file.fileId) {
                            fd.selcetFile = false;
                        }
                    });
                }

                const selcetedFiles = this.filesFromFolderSave.filter(
                    (it) => it.selcetFile
                );
                if (selcetedFiles.length > 1) {
                    this.showFloatNav = {
                        selcetedFiles,
                        selcetedFilesRemove: selcetedFiles.every(
                            (fd) => (fd.details && fd.statusDesc) || !fd.details
                        ),
                        selcetedFilesFlag: selcetedFiles.every((fd) => fd.flag),
                        selcetedFilesNote: selcetedFiles.every((fd) => fd.note)
                    };
                } else {
                    this.showFloatNav = false;
                }
            }

            if (this.isModal) {
                if (this.files.length) {
                    const selcetedFiles = this.files.filter((it) => it.selcetFile);
                    this.setFiles.next(selcetedFiles);
                } else {
                    const selcetedFiles = this.filesFromFolderSave.filter(
                        (it) => it.selcetFile
                    );
                    this.setFiles.next(selcetedFiles);
                }
            }
        }
    }

    showDocumentStorageDataViewAsGrid(src: string, isPdf: boolean, isNgSrc?:any): void {
        this.showDocumentStorageDataFired = true;
        this.timeFireHover = false;
        this.isPdf = isPdf;
        this.isNgSrc = isNgSrc !== false;
        this.sidebarImgs = src;
    }

    showDocumentStorageDataViewQuick(file: any): void {
        this.showDocumentStorageDataFired = true;
        this.timeFireHover = false;
        this.isPdf = false;
        this.sidebarImgs = file.multipaged ? file.pages : file.urlImg;
    }

    isArray(obj: any): boolean {
        return Array.isArray(obj);
    }

    showDocumentStorageData(fileId: string, file?: any): void {
        // approveDate: 1630242332613
        // approveUserId: "1eab11ef-6ad2-08ff-e053-650aa8c0f96d"
        // asmachta: "M2101618001"
        // details: false
        // duplicate: false
        // fileId: "d2517abd-6fc1-4d57-8617-219dd23c7a49"
        // flag: false
        // folderName: null
        // invoiceDate: "19/05/21"
        // maamMonth: 1625086800000
        // name: "אור מאניה"
        // note: null
        // sendDate: 1629881354517
        // status: "ARCHIVE"
        // statusDesc: null
        // totalBeforeMaam: 57.26
        // totalIncludeMaam: 67
        // uniqueId: 257524640
        this.sidebarImgsDescList = false;
        this.finishedLoadedImgView = false;
        this.showDocumentStorageDataFired = true;
        if (file) {
            this.showDocumentListStorageDataFile = file;
            this.showDocumentListStorageDataFile.showCommand =
                file.status === 'CREATE_JOURNAL_TRANS' ||
                file.status === 'TEMP_COMMAND' ||
                file.status === 'PERMANENT_COMMAND';
            if (this.showDocumentListStorageDataFile.showCommand) {
                // this.showDocumentListStorageDataFile.currencyCode = 1;
                this.isMatah = this.showDocumentListStorageDataFile.currencyCode !== 1;
                const code = this.currencyList.find(
                    (ite) => ite.id === this.showDocumentListStorageDataFile.currencyCode
                );
                this.currencySign = code.sign;
                this.ocrService
                    .currencyGetRates({
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        currencyCode: code ? code.code : null,
                        invoiceDate: this.showDocumentListStorageDataFile.invoiceDateSrc
                    })
                    .subscribe((res) => {
                        const rateObj = res ? res['body'] : res;
                        if (rateObj) {
                            this.rate = rateObj.rate;
                        }
                    });
                this.sharedService
                    .countStatus({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .subscribe((response: any) => {
                        const countStatusDataFixed = response ? response['body'] : response;
                        this.typeOfStatus =
                            countStatusDataFixed['transTypeStatus'] === null ||
                            countStatusDataFixed['transTypeStatus'] === 'NOT_INTERESTED'
                                ? 'maamPrc'
                                : 'transTypeCode';
                        this.companyGetCustomer(fileId);
                    });
            }
        }

        this.getDocumentStorageData(fileId);
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
                            this.reportService.reportIsProcessing$.next(false);
                            const fileName =
                                (
                                    this.tooltipEditFile.originalFileName ||
                                    this.tooltipEditFile.name
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

    public async getDocumentStorageDataForAllSelectedFiles(
        isPrint?: boolean
    ): Promise<void> {
        if (this.showFloatNav.selcetedFiles.length > 1) {
            if (isPrint) {
                this.reportService.reportIsProcessingPrint$.next(true);
            } else {
                this.reportService.reportIsProcessing$.next(true);
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
            this.reportService.reportIsProcessing$.next(false);
            doc.save('group_selected_files.pdf');
        } else {
            this.reportService.reportIsProcessingPrint$.next(false);
            doc.autoPrint();
            const oHiddFrame: any = document.createElement('iframe');
            oHiddFrame.style.position = 'fixed';
            oHiddFrame.style.visibility = 'hidden';
            oHiddFrame.src = doc.output('bloburl');
            document.body.appendChild(oHiddFrame);
        }
    }

    changeView(viewAsList: string): void {
        if (!this.isModal) {
            this.viewAsList = viewAsList === 'list';
        }
        this.filesFromFolder = false;
        this.filesFromFolderSave = false;
        this.filesFromFolderSaveParams = {
            pageNumber: 0,
            numberOfRowsPerPage: 50,
            totalPages: 0,
            totalElements: 0
        };
        this.storageService.localStorageSetter(
            'archivesViewAsList',
            String(this.viewAsList)
        );
        this.fileSearch(this.saveFolder.text, this.saveFolder.folder);
    }

    getMonthNum(date: any) {
        return Number(this.userService.appData.moment(date).format('M')) - 1;
    }

    updateOcrDocumentDataForAllSelectedFiles(): void {
        this.showFloatNav.selcetedFiles.forEach((file) => {
            file.flag = !(this.showFloatNav && this.showFloatNav.selcetedFilesFlag);
        });
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
                .updateAgreementConfirmation({
                    agreementConfirmation: null,
                    sendMarketingInformation: null,
                    agreementClicked: true,
                    companyId: this.userService.appData.userData.companySelect.companyId
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
                .updateAgreementConfirmation({
                    agreementConfirmation: agreementPopup.agreementConfirmation,
                    sendMarketingInformation: agreementPopup.sendMarketingInformation,
                    agreementClicked: false,
                    companyId: this.userService.appData.userData.companySelect.companyId
                })
                .subscribe((response: any) => {
                });
        }
    }

    ngOnDestroy() {
        this.reportService.forLogic = null;
        this.reportService.postponed = null;
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }

        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        if (this.subscriptionStatus) {
            this.subscriptionStatus.unsubscribe();
        }
        if(this.interval$){
            this.interval$.unsubscribe();
        }
        if (this.interGetFolders) {
            this.interGetFolders.unsubscribe();
        }
        if (this.interGetFiles) {
            this.interGetFiles.unsubscribe();
        }
        if (this.subscribeInter$) {
            this.subscribeInter$.unsubscribe();
        }
        this.destroy();
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

    private rebuildInvoiceDate(withOtherFiltersApplied: any[]): void {
        const invoiceDateMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.invoiceDate &&
                        dtRow.invoiceDate.toString() &&
                        !acmltr[dtRow.invoiceDate.toString()]
                    ) {
                        acmltr[dtRow.invoiceDate.toString()] = {
                            val: dtRow.invoiceDate.toString(),
                            id: dtRow.invoiceDate.toString(),
                            checked: true
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.invoiceDate.toString()].checked
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
                    withOtherFiltersApplied.some((item) => !item.invoiceDate)
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
        this.invoiceDateArr = Object.values(invoiceDateMap);
        console.log('this.invoiceDateArr => %o', this.invoiceDateArr);
    }

    private rebuildMaamMonth(withOtherFiltersApplied: any[]): void {
        const maamMonthMap: { [key: string]: any } = withOtherFiltersApplied.reduce(
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
        this.maamMonthArr = Object.values(maamMonthMap);
        console.log('this.maamMonthMap => %o', this.maamMonthArr);
    }
}
