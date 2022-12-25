import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
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
import {HttpClient, HttpErrorResponse, HttpEventType, HttpHeaders, HttpRequest, HttpResponse} from '@angular/common/http';
import {EMPTY, fromEvent, interval, lastValueFrom, Observable, Subject, timer, zip} from 'rxjs';
import {SharedService} from '@app/shared/services/shared.service';
import {DomSanitizer, SafeHtml, SafeUrl} from '@angular/platform-browser';
import {FileStatus} from '@app/accountants/companies/shared/file-status.model';
import {distinctUntilChanged, filter, map, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {ReportService} from '@app/core/report.service';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {OverlayPanel} from 'primeng/overlaypanel';
import {MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig} from '@angular/material/legacy-dialog';
import {PlayVideoDialogComponent} from '@app/customers/help-center/customer-help-video/play-video-dialog/play-video-dialog.component';
import {HelpCenterService} from '@app/customers/help-center/help-center.service';
import {Listbox} from 'primeng/listbox/listbox';
import {HttpServices} from '@app/shared/services/http.services';
// @ts-ignore
declare var Dynamsoft: any = window['Dynamsoft'];
// import {CdkDragDrop, moveItemInArray, transferArrayItem, CdkDrag} from '@angular/cdk/drag-drop';
// import {DragDropModule} from '@angular/cdk/drag-drop';
// @NgModule({
//     exports: [
//         DragDropModule
//     ]
// })
// drop(event: CdkDragDrop<number[]>) {
//     if (event.previousContainer === event.container) {
//         moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
//     } else {
//         transferArrayItem(event.previousContainer.data,
//             event.container.data,
//             event.previousIndex,
//             event.currentIndex);
//     }
// }
const PDFDocument = window['PDFLib'].PDFDocument;
const pdfjsLib = window['pdfjsLib'];
pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/js/pdf.worker.js';

declare var $: any;

export interface SubjectItem {
    companyId: 'string';
    subjectId: 'string';
    subjectName: 'string';
    subjectText: 'string';
    system: true;
}

@Component({
    templateUrl: './journal-trans.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class JournalTransComponent implements AfterViewInit, OnDestroy, OnInit {
    @ViewChild('fileDropRef', {read: ElementRef}) fileDropRef: ElementRef;
    public imageScaleNewInvoice: number = 1;
    public degRotateImg: number = 0;
    public selcetAllFiles = false;
    public searchableList = ['companyHp', 'companyName'];
    public items = [];
    public queryString = '';
    public currentPage = 0;
    public entryLimit = 10;
    @Input() counter: any = 10;
    public filterInput = new FormControl();
    public sortPipeDir: any = null;
    public componentRefChild: any;
    public subjectsForCompanyWhatsApp: any;
    public uploadFilesOcrPopUp: {
        visible: boolean;
        urlsFiles: any;
    };
    public scanFilesOcrPopUp: {
        visible: boolean;
        urlsFiles: any;
    };
    public isHebrew1: any = false;
    public isHebrew2: any = false;
    public files: any = [];
    public filesBeforeOrder: any = [];
    public filesOriginal: any = [];
    public finishedPrepareFiles = false;
    public filesForContainer: any = 0;
    public filesForContainerCompleted: any = 0;
    public numberOfFilesForUpload: any = 0;
    public progress: any;
    public folderSelect: any = null;
    public fileViewer: any = false;
    public fileViewerSaved: any = false;
    public uploadProcess: any = false;
    public showDocumentStorageDataFired = false;
    public changeStateUploadFile: boolean = false;
    public innerHeight: any = window.innerHeight;
    public window: any = window;
    public sidebarImgs: any = false;
    public timeFireHover: any = false;
    public isNgSrc: any = true;
    public postponed: {
        action: Observable<any>;
        message: SafeHtml;
        fired?: boolean;
    };
    public fileUploadProgress = false;
    public indexFileTimer = 0;
    public progressAll = new Subject<number>();
    public isPdf = false;
    public fileScanView: any = false;
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
    readonly docFolders: {
        visible: boolean;
        isOnlyOne?: boolean;
        companyId: any;
        fileId?: any;
        childId?: any;
        positionLeft?: any;
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
    public eventRclickUpload: any;
    readonly docToRemove: {
        visible: boolean;
        form: any;
        fd: any;
        approve: () => void;
        show: (fd?: any, showFloatNav?: any) => void;
    } = {
        visible: false,
        form: new FormGroup({
            from: new FormControl(null),
            fromMail: new FormControl(null),
            sendToClient: new FormControl(false),
            subject: new FormControl(null),
            toMail: new FormControl(null)
        }),
        fd: null,
        show: (fd?: any, showFloatNav?: any) => {
        },
        approve: () => {
        }
    };
    public contactsWithoutAgreement: any = [];
    public contactsWithoutAgreementNames: any = '';
    public companiesWithoutAgreement: any = false;
    readonly docToSend: {
        visible: boolean;
        form: any;
        fd: any;
        showCheckBox: boolean;
        approve: () => void;
        show: (fd?: any, showFloatNav?: any, showCheckBox?: any) => void;
    } = {
        visible: false,
        showCheckBox: true,
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
        show: (fd?: any, showFloatNav?: any, showCheckBox?: any) => {
        },
        approve: () => {
        }
    };
    readonly docCompanyReplacement: {
        visible: boolean;
        companyReplacement: any;
        onApprove: () => void;
        show(): void;
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
    public selectedItem: any;
    public draggedIndex = -1;
    public onDragOverIndex = -1;
    // tslint:disable-next-line:member-ordering
    public subjectsForCompany: any;
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
    public getCompanyData$: Observable<any>;
    public companyDataObj: any = false;
    public openModalVideo = false;
    @ViewChildren('tooltipEdit') tooltipEditRef: OverlayPanel;
    public sendTypeList: any = [
        {label: 'מייל', value: 'MAIL', disabled: false},
        {label: 'וואטסאפ - בקרוב', value: null, disabled: true},
        {label: 'הודעה - בקרוב', value: null, disabled: true}
    ];
    public isDev: any = false;
    public contacts: any = [];
    @ViewChildren('plist_subjectsForCompany')
    plist_subjectsForCompany_ref: QueryList<Listbox>;
    public keepOriginFiles: boolean = false;
    public rightSideTooltip: any = 0;
    private _window = typeof window === 'object' && window ? window : null;
    private readonly destroyed$ = new Subject<void>();
    private TextDecoder: any;

    // tslint:disable-next-line:member-ordering
    constructor(
        public userService: UserService,
        public reportService: ReportService,
        public sharedComponent: SharedComponent,
        private sortPipe: SortPipe,
        public dialog: MatDialog,
        private ocrService: OcrService,
        private http: HttpClient,
        public httpServices: HttpServices,
        public sanitizer: DomSanitizer,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        private storageService: StorageService,
        private sharedService: SharedService,
        private helpCenterService: HelpCenterService,
        public router: Router
    ) {
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
        this.docToRemove = {
            visible: false,
            form: new FormGroup({
                from: new FormControl(null, [Validators.required]),
                fromMail: new FormControl(null, {
                    validators: [Validators.required, ValidatorsFactory.emailExtended],
                    updateOn: 'blur'
                }),
                toMail: new FormControl(null, {
                    validators: [Validators.required, ValidatorsFactory.emailExtended],
                    updateOn: 'blur'
                }),
                sendToClient: new FormControl(false),
                subject: new FormControl(null)
            }),
            fd: null,
            show: (fd?: any, showFloatNav?: any) => {
                if (fd) {
                    this.docToRemove.fd = fd;
                } else if (showFloatNav) {
                    this.docToRemove.fd = null;
                }
                this.docToRemove.form.reset({
                    from: null,
                    fromMail: null,
                    sendToClient: false,
                    subject: null,
                    toMail: null
                });
                this.docToRemove.form
                    .get('sendToClient')
                    .valueChanges.pipe(distinctUntilChanged())
                    .subscribe((send) => {
                        if (send) {
                            const addSubject = this.subjectsForCompany.find(
                                (it) => it.subjectId === '11111111-1111-1111-1111-111111111111'
                            );
                            if (addSubject) {
                                addSubject.subjectText =
                                    'שלום רב, \n' + 'לידיעתך המסמך המצורף הוסר ולא יוכר כהוצאה.';
                                this.docToRemove.form.patchValue({
                                    from:
                                        this.userService.appData.userData.firstName +
                                        ' ' +
                                        this.userService.appData.userData.lastName,
                                    fromMail: this.userService.appData.userData.mail
                                        ? this.userService.appData.userData.mail.trim()
                                        : null,
                                    subject: addSubject
                                });
                            } else {
                                this.docToRemove.form.patchValue({
                                    from:
                                        this.userService.appData.userData.firstName +
                                        ' ' +
                                        this.userService.appData.userData.lastName,
                                    fromMail: this.userService.appData.userData.mail
                                        ? this.userService.appData.userData.mail.trim()
                                        : null,
                                    subject: {
                                        companyId: 'string',
                                        subjectId: '11111111-1111-1111-1111-111111111111',
                                        subjectName: 'הסרת מסמך',
                                        subjectText:
                                            'שלום רב, \n' +
                                            'לידיעתך המסמך המצורף הוסר ולא יוכר כהוצאה.',
                                        system: true
                                    }
                                });
                            }
                        } else {
                            this.docToRemove.form.reset({
                                from: null,
                                fromMail: null,
                                subject: null,
                                toMail: null
                            });
                        }
                    });

                this.sharedService
                    .getSubjectsForCompany(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe(
                        (response: any) => {
                            this.subjectsForCompany = response ? response['body'] : response;

                            const addSubject = this.subjectsForCompany.find(
                                (it) => it.subjectId === '11111111-1111-1111-1111-111111111111'
                            );
                            if (addSubject) {
                                addSubject.subjectText =
                                    'שלום רב, \n' + 'לידיעתך המסמך המצורף הוסר ולא יוכר כהוצאה.';
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
                this.docToRemove.visible = true;
            },
            approve: () => {
                const addToDetails =
                    '\n בברכה, \n' +
                    (this.docToRemove.form.get('from').value
                        ? this.docToRemove.form.get('from').value
                        : this.userService.appData.userData.firstName +
                        ' ' +
                        this.userService.appData.userData.lastName);
                // console.log(this.docToRemove.form);
                this.docToRemove.visible = false;
                this.sharedService
                    .removeUnknownFile({
                        filesId:
                            this.componentRefChild.showFloatNav &&
                            this.docToRemove.fd === null
                                ? this.componentRefChild.showFloatNav.selcetedFiles.map(
                                    (file) => file.fileId
                                )
                                : [this.docToRemove.fd],
                        details:
                            !this.docToRemove.form.value.subject ||
                            this.docToRemove.form.value.subject.subjectText === ''
                                ? null
                                : this.docToRemove.form.value.subject.subjectText +
                                addToDetails,
                        from:
                            this.docToRemove.form.value.from === ''
                                ? null
                                : this.docToRemove.form.value.from,
                        fromMail:
                            this.docToRemove.form.value.fromMail === ''
                                ? null
                                : this.docToRemove.form.value.fromMail,
                        sendToClient: this.docToRemove.form.value.sendToClient,
                        subject:
                            !this.docToRemove.form.value.subject ||
                            this.docToRemove.form.value.subject.subjectName === ''
                                ? null
                                : this.docToRemove.form.value.subject.subjectName,
                        toMail:
                            this.docToRemove.form.value.toMail === ''
                                ? null
                                : this.docToRemove.form.value.toMail
                    })
                    .subscribe(
                        () => {
                            if (this.fileScanView) {
                                this.componentRefChild.getCompanyDocumentsData(true);
                                if (
                                    this.componentRefChild.documentsDataSave.length > 1 &&
                                    this.componentRefChild.childAccountantsDoc.navigatorData$
                                        .value.forwardLink
                                ) {
                                    this.componentRefChild.childAccountantsDoc.setFile(
                                        this.componentRefChild.childAccountantsDoc.navigatorData$
                                            .value.forwardLink
                                    );
                                } else {
                                    this.fileScanView = false;
                                }
                            } else {
                                this.componentRefChild.getCompanyDocumentsData();
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
        };
        this.docToSend = {
            visible: false,
            form: new FormGroup({
                sendType: new FormControl('MAIL'),
                targetUserId: new FormControl(null),
                from: new FormControl(null, [Validators.required]),
                fromMail: new FormControl(null, {
                    validators: [Validators.required, ValidatorsFactory.emailExtended],
                    updateOn: 'blur'
                }),
                toMail: new FormControl(null, {
                    validators: [Validators.required, ValidatorsFactory.emailExtended],
                    updateOn: 'blur'
                }),
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
            showCheckBox: true,
            show: (fd?: any, showFloatNav?: any, showCheckBox?: any) => {
                if (showCheckBox !== undefined && showCheckBox === false) {
                    this.docToSend.showCheckBox = false;
                }
                if (fd) {
                    this.docToSend.fd = fd;
                } else if (showFloatNav) {
                    this.docToSend.fd = null;
                } else {
                    this.docToSend.fd = null;
                }
                // console.log('fd', fd)
                const sendType = this.storageService.localStorageGetterItem(
                    'sendType_' +
                    this.userService.appData.userData.companySelect.companyId
                );
                const toMail = this.storageService.localStorageGetterItem(
                    'toMail_' + this.userService.appData.userData.companySelect.companyId
                );
                const targetUserId = this.storageService.localStorageGetterItem(
                    'targetUserId_' +
                    this.userService.appData.userData.companySelect.companyId
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
                this.sharedService
                    .getSubjectsForCompany(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe(
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
                                    (it) =>
                                        it.subjectId === '4d3744ae-ce6f-4f55-8f7e-2eca6d45c856'
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
                                    (it) =>
                                        it.subjectId === '22222222-2222-2222-2222-222222222222'
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
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .subscribe((response: any) => {
                        this.contacts = response ? response['body'] : response;
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
                            this.docToSend.form.patchValue({
                                sendType: 'WHATSAPP'
                            });
                        }
                    });

                this.docToSend.visible = true;
            },
            approve: () => {
                if (this.docToSend.form.value.toMail) {
                    this.storageService.localStorageSetter(
                        'toMail_' +
                        this.userService.appData.userData.companySelect.companyId,
                        this.docToSend.form.value.toMail
                    );
                }
                if (this.docToSend.form.value.targetUserId) {
                    this.storageService.localStorageSetter(
                        'targetUserId_' +
                        this.userService.appData.userData.companySelect.companyId,
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
                this.sharedService
                    .sendClientMessage(
                        this.docToSend.form.value.sendType === 'WHATSAPP'
                            ? {
                                fileIds: this.docToSend.form.value.sendToClient
                                    ? this.componentRefChild.showFloatNav &&
                                    this.docToSend.fd === null
                                        ? this.componentRefChild.showFloatNav.selcetedFiles.map(
                                            (file) =>
                                                this.componentRefChild.fileStatus ===
                                                'CREATE_JOURNAL_TRANS'
                                                    ? file.paymentId
                                                    : file.fileId
                                        )
                                        : [this.docToSend.fd]
                                    : [],
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
                                fileIds: this.docToSend.form.value.sendToClient
                                    ? this.componentRefChild.showFloatNav &&
                                    this.docToSend.fd === null
                                        ? this.componentRefChild.showFloatNav.selcetedFiles.map(
                                            (file) =>
                                                this.componentRefChild.fileStatus ===
                                                'CREATE_JOURNAL_TRANS'
                                                    ? file.paymentId
                                                    : file.fileId
                                        )
                                        : [this.docToSend.fd]
                                    : [],
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
                            if (
                                this.componentRefChild.fileStatus === 'BANK' ||
                                this.componentRefChild.fileStatus === 'CREDIT' ||
                                this.componentRefChild.fileStatus === 'CREATE_JOURNAL_TRANS'
                            ) {
                                this.componentRefChild.ngAfterViewInit();
                                this.componentRefChild.reloadData(true);
                            } else {
                                if (this.fileScanView) {
                                    this.componentRefChild.getCompanyDocumentsData(true);
                                    this.componentRefChild.childAccountantsDoc.setFile(
                                        this.componentRefChild.childAccountantsDoc.navigatorData$
                                            .value.forwardLink
                                    );
                                } else {
                                    this.componentRefChild.getCompanyDocumentsData();
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
                            companyId:
                            this.userService.appData.userData.companySelect.companyId,
                            subjectName: this.createTemplateSubjectModal.subjectName.value,
                            subjectText: this.createTemplateSubjectModal.subjectText.value
                        })
                        .subscribe(
                            () => {
                                this.sharedService
                                    .getSubjectsForCompany(
                                        this.userService.appData.userData.companySelect.companyId
                                    )
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
        this.docNote = {
            visible: false,
            noteFC: new FormGroup({
                note: new FormControl(null)
            }),
            note: null,
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
                        note: this.fd.note
                    });
                    this.note = this.fd.note;
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
                    !(this.componentRefChild.showFloatNav && this.docNote.fd === null) &&
                    (this.docNote.noteFC.value.note || '').trim() ===
                    (this.docNote.fd.note || '').trim()
                ) {
                    this.docNote.visible = false;
                    return;
                }
                if (
                    this.componentRefChild.fileStatus === 'BANK' ||
                    this.componentRefChild.fileStatus === 'CREDIT'
                ) {
                    this.sharedService
                        .setPaymentData({
                            payments: [
                                {
                                    paymentId: this.docNote.fd.paymentId,
                                    paymentType: this.docNote.fd.paymentType
                                }
                            ],
                            note:
                                this.docNote.noteFC.value.note === ''
                                    ? null
                                    : this.docNote.noteFC.value.note
                        })
                        .subscribe(
                            (response: any) => {
                                const note =
                                    this.docNote.noteFC.value.note === ''
                                        ? null
                                        : this.docNote.noteFC.value.note;
                                this.docNote.fd.note = note;
                                if (this.componentRefChild.fileStatus === 'BANK') {
                                    this.componentRefChild.bankDetailsSave.forEach((file) => {
                                        if (file.paymentId === this.docNote.fd.paymentId) {
                                            file.note = note;
                                        }
                                    });
                                    const base = [
                                        {
                                            checked: this.componentRefChild.editArr[0].checked,
                                            id: 'all',
                                            val: 'הכל'
                                        }
                                    ];
                                    if (
                                        this.componentRefChild.bankDetailsSave.filter(
                                            (it) => it.note !== undefined && it.note !== null
                                        ).length
                                    ) {
                                        const isNote = this.componentRefChild.editArr.find(
                                            (it) => it.id === 'note'
                                        );
                                        let checked = true;
                                        if (isNote) {
                                            checked = isNote.checked;
                                        }
                                        base.push({
                                            checked: checked,
                                            id: 'note',
                                            val: 'פיתקית'
                                        });
                                    }
                                    if (
                                        this.componentRefChild.bankDetailsSave.filter(
                                            (it) => it.note === null
                                        ).length
                                    ) {
                                        const isNotNote = this.componentRefChild.editArr.find(
                                            (it) => it.id === 'withoutMark'
                                        );
                                        let checked = true;
                                        if (isNotNote) {
                                            checked = isNotNote.checked;
                                        }
                                        base.push({
                                            checked: checked,
                                            id: 'withoutMark',
                                            val: 'ללא פיתקית'
                                        });
                                    }
                                    this.componentRefChild.editArr = base;
                                } else {
                                    this.componentRefChild.cardDetailsSave.forEach((file) => {
                                        if (file.paymentId === this.docNote.fd.paymentId) {
                                            file.note = note;
                                        }
                                    });
                                    const base = [
                                        {
                                            checked: this.componentRefChild.editArr[0].checked,
                                            id: 'all',
                                            val: 'הכל'
                                        }
                                    ];
                                    if (
                                        this.componentRefChild.cardDetailsSave.filter(
                                            (it) => it.note !== undefined && it.note !== null
                                        ).length
                                    ) {
                                        const isNote = this.componentRefChild.editArr.find(
                                            (it) => it.id === 'note'
                                        );
                                        let checked = true;
                                        if (isNote) {
                                            checked = isNote.checked;
                                        }
                                        base.push({
                                            checked: checked,
                                            id: 'note',
                                            val: 'פיתקית'
                                        });
                                    }
                                    if (
                                        this.componentRefChild.cardDetailsSave.filter(
                                            (it) => it.note === null
                                        ).length
                                    ) {
                                        const isNotNote = this.componentRefChild.editArr.find(
                                            (it) => it.id === 'withoutMark'
                                        );
                                        let checked = true;
                                        if (isNotNote) {
                                            checked = isNotNote.checked;
                                        }
                                        base.push({
                                            checked: checked,
                                            id: 'withoutMark',
                                            val: 'ללא פיתקית'
                                        });
                                    }
                                    this.componentRefChild.editArr = base;
                                }
                                this.componentRefChild.filtersAll(undefined, true, true);
                                this.docNote.visible = false;
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
                    this.sharedService
                        .updateOcrDocumentData({
                            filesId:
                                this.componentRefChild.showFloatNav && this.docNote.fd === null
                                    ? this.componentRefChild.showFloatNav.selcetedFiles.map(
                                        (file) => file.fileId
                                    )
                                    : [this.docNote.fd.fileId],
                            flag:
                                this.componentRefChild.showFloatNav && this.docNote.fd === null
                                    ? this.componentRefChild.showFloatNav.selcetedFiles.length ===
                                    1
                                        ? this.componentRefChild.showFloatNav.selcetedFiles[0].flag
                                        : null
                                    : this.docNote.fd.flag,
                            note:
                                this.docNote.noteFC.value.note === ''
                                    ? null
                                    : this.docNote.noteFC.value.note
                        })
                        .subscribe(
                            (response: any) => {
                                if (this.componentRefChild.childAccountantsDoc) {
                                    this.componentRefChild.childAccountantsDoc.fileChange = true;
                                }
                                const idsFiles =
                                    this.componentRefChild.showFloatNav &&
                                    this.docNote.fd === null
                                        ? this.componentRefChild.showFloatNav.selcetedFiles.map(
                                            (file) => file.fileId
                                        )
                                        : [this.docNote.fd.fileId];
                                const note =
                                    this.docNote.noteFC.value.note === ''
                                        ? null
                                        : this.docNote.noteFC.value.note;

                                if (
                                    this.componentRefChild.showFloatNav &&
                                    this.docNote.fd === null
                                ) {
                                    if (note) {
                                        this.componentRefChild.showFloatNav.selcetedFiles.forEach(
                                            (file) => {
                                                file.note = note;
                                            }
                                        );
                                    }
                                } else {
                                    this.docNote.fd.note = note;
                                    if (
                                        this.componentRefChild.fileStatus !==
                                        'CREATE_JOURNAL_TRANS' &&
                                        this.docNote.fd.fileId
                                    ) {
                                        this.componentRefChild.documentsDataSave.forEach((fd) => {
                                            if (fd.fileId === this.docNote.fd.fileId) {
                                                fd.note = this.docNote.fd.note;
                                            }
                                        });
                                        if (this.componentRefChild.viewAsList) {
                                            this.componentRefChild.documentsData.forEach((fd) => {
                                                if (fd.fileId === this.docNote.fd.fileId) {
                                                    fd.note = this.docNote.fd.note;
                                                }
                                            });
                                        }
                                    }
                                }

                                if (
                                    this.componentRefChild.fileStatus !== 'CREATE_JOURNAL_TRANS'
                                ) {
                                    if (
                                        this.componentRefChild.fileStatus === 'WAIT_FOR_CARE' &&
                                        !this.docNote.fd.flag &&
                                        !this.docNote.fd.note
                                    ) {
                                        this.componentRefChild.documentsDataSave =
                                            this.componentRefChild.documentsDataSave.filter(
                                                (it) => it.fileId !== this.docNote.fd.fileId
                                            );
                                    }
                                    this.componentRefChild.filtersAll('edit');
                                } else {
                                    this.componentRefChild.journalTransDataSave.forEach((fd) => {
                                        fd.fileData.forEach((fi) => {
                                            if (idsFiles.some((f) => f === fi.fileId)) {
                                                fi.note = note;
                                            }
                                        });
                                    });
                                    this.componentRefChild.filtersAllJournalTransData();
                                }
                                this.docNote.visible = false;
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
        };
        this.docFolders = {
            visible: false,
            companyId: null,
            folderSelect: null,
            fileId: null,
            childId: null,
            positionLeft: null,
            isOnlyOne: false,
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
                    if (companyId.positionLeft) {
                        this.positionLeft = companyId.positionLeft;
                    }
                    if (companyId.childId) {
                        this.childId = companyId.childId;
                    }
                    if (companyId.isOnlyOne) {
                        this.isOnlyOne = companyId.isOnlyOne;
                    }
                }
                this.visible = true;
            },
            onApprove: (folderSelect: any) => {
                console.log(folderSelect);
                if (this.docFolders.childId) {
                    this.sharedService
                        .archiveSinglePage({
                            childId: this.docFolders.childId,
                            fileId: this.docFolders.fileId,
                            folderId: folderSelect.folderId
                        })
                        .subscribe((response: any) => {
                            const fileId = response ? response['body'] : response;
                            this.componentRefChild.getCompanyDocumentsData(
                                true,
                                (newFiles) => {
                                    if (this.docFolders.isOnlyOne) {
                                        this.componentRefChild.childAccountantsDoc.showSplit =
                                            false;
                                        const newFileIdx = newFiles.findIndex(
                                            (file) => file.fileId === fileId
                                        );
                                        this.componentRefChild.childAccountantsDoc.setFile(
                                            newFiles[newFileIdx + 1],
                                            newFiles
                                        );
                                    } else {
                                        const newFile = newFiles.find(
                                            (file) => file.fileId === fileId
                                        );
                                        this.componentRefChild.childAccountantsDoc.setFile(
                                            newFile,
                                            newFiles
                                        );
                                    }
                                }
                            );
                            this.docFolders.visible = false;
                        });

                    if (this.docFolders.isOnlyOne) {
                        this.sharedService
                            .updateOcrDocumentStatus({
                                fileStatus: FileStatus.ARCHIVE,
                                filesId: [this.docFolders.fileId],
                                folderId: '44444444-4444-4444-4444-444444444444'
                            })
                            .subscribe((response: any) => {
                                const statusRes = response ? response.status : response;
                                if (statusRes === 422) {
                                    this.componentRefChild.startChild();
                                }

                            });
                    }
                } else {
                    const paramsToSend = {
                        fileStatus: FileStatus.ARCHIVE,
                        filesId: this.docFolders.fileId
                            ? [this.docFolders.fileId]
                            : this.componentRefChild.showFloatNav &&
                            !this.componentRefChild.tooltipEditFile
                                ? this.componentRefChild.showFloatNav.selcetedFiles.map(
                                    (file) => file.fileId
                                )
                                : [this.componentRefChild.tooltipEditFile.fileId],
                        folderId: folderSelect.folderId
                    };
                    this.reportService.postponed = {
                        action: this.sharedService.updateOcrDocumentStatus(paramsToSend),
                        message: this.sanitizer.bypassSecurityTrustHtml(
                            !this.docFolders.fileId &&
                            this.componentRefChild.showFloatNav &&
                            !this.componentRefChild.tooltipEditFile &&
                            this.componentRefChild.showFloatNav.selcetedFiles.length > 1
                                ? this.componentRefChild.showFloatNav.selcetedFiles.length +
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
                        fired: false,
                        cancelled: () => {
                            paramsToSend['fileStatus'] = FileStatus.WAIT_FOR_CONFIRM;
                            this.sharedService
                                .updateOcrDocumentStatus(paramsToSend)
                                .subscribe(() => {
                                    if (this.docFolders.positionLeft) {
                                        this.componentRefChild.childAccountantsDoc.modalShowImg =
                                            false;
                                    }
                                    if (this.componentRefChild.childAccountantsDoc) {
                                        this.componentRefChild.childAccountantsDoc.fileChange =
                                            true;
                                    }
                                    if (
                                        this.componentRefChild.childAccountantsDoc &&
                                        this.componentRefChild.childAccountantsDoc
                                            .editOrderFromDoubleSuspectModalShow
                                    ) {
                                        this.componentRefChild.childAccountantsDoc.editOrderFromDoubleSuspectModalShow =
                                            false;
                                    }
                                    this.componentRefChild.tooltipEditFile = null;

                                    if (this.fileScanView) {
                                        if (
                                            this.componentRefChild.fileStatus !==
                                            'CREATE_JOURNAL_TRANS'
                                        ) {
                                            this.componentRefChild.getCompanyDocumentsData(true);
                                        } else {
                                            this.componentRefChild.getExportFiles(true);
                                        }
                                        this.componentRefChild.childAccountantsDoc.setFile(
                                            this.componentRefChild.childAccountantsDoc.navigatorData$
                                                .value.forwardLink
                                        );
                                    } else {
                                        if (
                                            this.componentRefChild.fileStatus !==
                                            'CREATE_JOURNAL_TRANS'
                                        ) {
                                            this.componentRefChild.getCompanyDocumentsData();
                                        } else {
                                            this.componentRefChild.getExportFiles();
                                        }
                                    }
                                });
                        }
                    };

                    this.reportService.postponed.action.pipe(take(1)).subscribe(() => {
                        if (this.docFolders.positionLeft) {
                            this.componentRefChild.childAccountantsDoc.modalShowImg = false;
                        }
                        if (this.componentRefChild.childAccountantsDoc) {
                            this.componentRefChild.childAccountantsDoc.fileChange = true;
                        }
                        if (
                            this.componentRefChild.childAccountantsDoc &&
                            this.componentRefChild.childAccountantsDoc
                                .editOrderFromDoubleSuspectModalShow
                        ) {
                            this.componentRefChild.childAccountantsDoc.editOrderFromDoubleSuspectModalShow =
                                false;
                        }
                        this.componentRefChild.tooltipEditFile = null;

                        if (this.fileScanView) {
                            if (
                                this.componentRefChild.fileStatus !== 'CREATE_JOURNAL_TRANS'
                            ) {
                                this.componentRefChild.getCompanyDocumentsData(true);
                            } else {
                                this.componentRefChild.getExportFiles(true);
                            }
                            this.componentRefChild.childAccountantsDoc.setFile(
                                this.componentRefChild.childAccountantsDoc.navigatorData$.value
                                    .forwardLink
                            );
                        } else {
                            if (
                                this.componentRefChild.fileStatus !== 'CREATE_JOURNAL_TRANS'
                            ) {
                                this.componentRefChild.getCompanyDocumentsData();
                            } else {
                                this.componentRefChild.getExportFiles();
                            }
                        }

                        setTimeout(() => {
                            this.reportService.postponed.fired = true;
                        }, 3000);
                    });

                    this.docFolders.visible = false;
                }
            }
        };
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
                        this.componentRefChild.showFloatNav &&
                        !this.componentRefChild.tooltipEditFile
                            ? this.componentRefChild.showFloatNav.selcetedFiles.map(
                                (file) => file.fileId
                            )
                            : [this.componentRefChild.tooltipEditFile.fileId],
                        selectedCompany.companyId
                    ),
                    message: this.sanitizer.bypassSecurityTrustHtml(
                        this.componentRefChild.showFloatNav &&
                        !this.componentRefChild.tooltipEditFile &&
                        this.componentRefChild.showFloatNav.selcetedFiles.length > 1
                            ? this.componentRefChild.showFloatNav.selcetedFiles.length +
                            (' המסמכים הועברו לפיענוח ולאחר מכן יועברו ל' +
                                '<b>' +
                                selectedCompany.companyName +
                                '</b>')
                            : 'המסמך הועבר לפיענוח ולאחר מכן יעבור ל' +
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
                    .subscribe(() => {
                        this.componentRefChild.tooltipEditFile = null;
                        if (this.componentRefChild.fileStatus !== 'CREATE_JOURNAL_TRANS') {
                            this.componentRefChild.getCompanyDocumentsData();
                        } else {
                            this.componentRefChild.getExportFiles();
                        }
                    });
            }
        };
    }

    get isWindows() {
        return (
            window.navigator['userAgentData']['platform'] === 'Windows'
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

    changeSendType() {
        this.storageService.localStorageSetter(
            'sendType_' + this.userService.appData.userData.companySelect.companyId,
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

    async playVideoInDialog(id: any) {
        this.helpCenterService.requestVimeoData(id).subscribe((vimeoData) => {
            const dialogConfig = new MatDialogConfig();

            dialogConfig.disableClose = false;
            dialogConfig.autoFocus = true;

            const innerWidth = window.innerWidth;
            let relativeWidth = (innerWidth * 80) / 100; // take up to 80% of the screen size
            if (innerWidth > 1500) {
                relativeWidth = (1500 * 80) / 100;
                // } else {
                //     relativeWidth = (innerWidth * 80) / 100;
            }

            const relativeHeight = (relativeWidth * 9) / 16; // 16:9 to which we add 120 px for the dialog action buttons ("close")
            // const relativeHeight = (relativeWidth * 9) / 16 + 120; // 16:9 to which we add 120 px for the dialog action buttons ("close")
            dialogConfig.width = 1200 + 'px';
            dialogConfig.height = '690px'; // relativeHeight + 'px';

            dialogConfig.data = {
                vimeoData: vimeoData,
                relativeWidth: relativeWidth,
                relativeHeight: relativeHeight
            };

            this.dialog.open(PlayVideoDialogComponent, dialogConfig);
        });
    }

    onClickOptionDD(disabled: boolean, event: any) {
        if (disabled) {
            event.stopPropagation();
        }
    }

    ngOnInit() {
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
        Dynamsoft.DWT.ResourcesPath = '/assets/files/Resources';
        // Dynamsoft.DWT.ResourcesPath = 'assets/dwt-resources';
        Dynamsoft.DWT.ProductKey =
            'f0068WQAAAMjD37MYQuF8gD5cX23zdlnKwTn6csMXDHsXWOK4CRS4lDE82sTzeW1ejTcOS7m7gOE9leRs0VSPDlpjDkIWENg=';
        // Dynamsoft.DWT.ProductKey = 't0115YQEAADLdsKeUCK4+tJktPdfzkeFCkXXNRfl+fAMlzbNS/nDM0sXKq9mW/WFrty8KF3g7lNtAYfUOiICxcac/R4b8dBDJIczVQygkgTcBywD7uHkqFV0+gY9CX58UiSYJd4uYkjBa/RBSgJwlY3AAym9Xsw==';
        Dynamsoft.DWT.AutoLoad = false;
        if (this.isWindows) {
            Dynamsoft.DWT.RegisterEvent('OnWebTwainReady', () => {
                this.Dynamsoft_OnReady();
            });
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
    }

    moveToContact(): void {
        this.router.navigate(['/accountants/companies/general/contacts'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    focusNote(textarea: any): void {
        setTimeout(() => {
            textarea.focus();
        }, 500);
    }

    filtersAll(): void {
        this.items = this.sortPipe.transform(
            this.items,
            'companyName',
            this.sortPipeDir
        );
    }

    ngAfterViewInit(): void {
        console.log('ngAfterViewInit');
    }

    sortPipeFilter(): void {
        this.sortPipeDir = this.sortPipeDir === 'smaller' ? 'bigger' : 'smaller';
        this.filtersAll();
    }

    getItemSize(item) {
        return 33;
    }

    trackById(index: number, val: any): number {
        return val.companyHp;
    }

    trackByIndex(index: number, val: any): number {
        return index;
    }

    paginate(event) {
        this.entryLimit = Number(event.rows);
        this.currentPage = event.page;
    }

    clear() {
        this.items = [];
    }

    onActivate(componentRef: any) {
        this.componentRefChild = componentRef;
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
            this.keepOriginFiles = false;
            this.filesOriginal = [];
            this.fileDropRef.nativeElement.type = 'text';
            setTimeout(() => {
                this.fileDropRef.nativeElement.type = 'file';
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
            this.componentRefChild.goToInvoice(file);
        }
        // this.storageService.sessionStorageSetter('accountants-doc-open', JSON.stringify(file));
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

    resetReloadAndReturnToMain() {
        this.files = [];
        this.filesBeforeOrder = [];
        this.keepOriginFiles = false;
        this.filesOriginal = [];
        this.fileDropRef.nativeElement.type = 'text';
        setTimeout(() => {
            this.fileDropRef.nativeElement.type = 'file';
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
        this.componentRefChild.startChild();
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
                this.keepOriginFiles = false;
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
                    this.keepOriginFiles = false;
                    this.filesOriginal = [];
                    this.fileDropRef.nativeElement.type = 'text';
                    setTimeout(() => {
                        this.fileDropRef.nativeElement.type = 'file';
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
                    this.keepOriginFiles = false;
                    this.fileViewer = false;
                }
            }
        } else {
            if (this.filesBeforeOrder && this.filesBeforeOrder.length) {
                this.files = this.filesBeforeOrder;
            }
            this.keepOriginFiles = false;
            this.fileViewer = false;
        }
    }

    uploadFilesOcr(): void {
        if (this.componentRefChild.snackBar) {
            this.componentRefChild.snackBar.dismiss();
        }
        if (this.fileDropRef && this.fileDropRef.nativeElement) {
            this.fileDropRef.nativeElement.type = 'text';
            setTimeout(() => {
                this.fileDropRef.nativeElement.type = 'file';
            }, 200);
        }
        this.progress = false;
        this.fileViewer = false;
        this.fileUploadProgress = false;
        this.filesBeforeOrder = [];
        this.keepOriginFiles = false;
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

    loadScanFilesOcr(): void {
        if (this.componentRefChild.snackBar) {
            this.componentRefChild.snackBar.dismiss();
        }

        this.stopped = false;
        this.fileViewer = false;
        this.showProgressScan = false;
        this.scanerList = [];
        this.selectedScan = null;
        this.index = 0;
        this.files = [];
        this.filesBeforeOrder = [];
        this.keepOriginFiles = false;
        this.filesOriginal = [];
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
                '<span class="fa fa-fw fa-times" onclick="Dynamsoft.DWT.CloseDialog()">&nbsp;</span>' +
                '</div>'
            ];
            ObjString.push(
                '<div style="display: flex;justify-content: center;align-items: center;margin: 15px 20px 0px 20px;"><a id="dwt-btn-install" style="display: inline-block;" target="_blank" href="'
            );
            let url = '';
            if (iPlatform === Dynamsoft.DWT.EnumDWT_PlatformType.enumWindow) {
                url = '/assets/files/resources/dist/DynamsoftServiceSetup.msi';
            } else if (iPlatform === Dynamsoft.DWT.EnumDWT_PlatformType.enumMac) {
                url = '/assets/files/resources/dist/DynamsoftServiceSetup.pkg';
            } else if (iPlatform === Dynamsoft.DWT.EnumDWT_PlatformType.enumLinux) {
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
                'כדי להתחיל לסרוק ישירות מהסורק שבמשרדך ל- bizobox' +
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
            Dynamsoft.DWT.ShowDialog(
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
                    if (el && el.getAttribute('html5') == '1') {
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
            Dynamsoft.DWT['CheckConnectToTheService'](
                function () {
                    Dynamsoft.DWT['ConnectToTheService']();
                },
                function () {
                    setTimeout(window['DWT_Reconnect'], 1000);
                }
            );
        };
        Dynamsoft.DWT.Load();
    }

    unload() {
        console.log('unload');
        if (this.arr.length > 1) {
            this.arr.forEach((elem) => {
                if (
                    elem.DWObject &&
                    elem.DWObject.config.containerID !== 'dwtcontrolContainer'
                ) {
                    Dynamsoft.DWT.DeleteDWTObject(
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
        Dynamsoft.DWT.Unload();
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

        Dynamsoft.DWT.CreateDWTObjectEx(
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
                Dynamsoft.DWT.DeleteDWTObject(
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
                pixelType: Dynamsoft.DWT.EnumDWT_PixelType.TWPT_RGB, //rgb, bw, gray, etc
                resolution: 200, // 300
                bFeeder: true,
                bDuplex: false //whether to enable duplex
            },
            moreSettings: {
                exception: 'fail', // "ignore" or “fail”
                // bitDepth: 24, //1,8,24,etc
                pageSize: Dynamsoft.DWT.EnumDWT_CapSupportedSizes.TWSS_A4, //A4, etc.
                unit: Dynamsoft.DWT.EnumDWT_UnitType.TWUN_INCHES
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
                        Dynamsoft.DWT.DeleteDWTObject(
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
            Dynamsoft.DWT.CreateDWTObjectEx(
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
            this.fileDropRef.nativeElement.type = 'file';
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

    round(num: number): number {
        return Math.round(num);
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
                this.filesForContainerCompleted = this.filesForContainerCompleted + 1;
                this.filesBeforeOrder.push(item);
                this.filesOriginal.push(item);
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
                    // const localUri = URL.createObjectURL(item);
                    // const pdf = await pdfjsLib.getDocument(localUri).promise;
                    // URL.revokeObjectURL(localUri);
                    let encodeCorrect = true;
                    const donorPdfBytes = await item.arrayBuffer();
                    const typedArray = new Uint8Array(donorPdfBytes);
                    if (window['jschardet']) {
                        if (window['jschardet'].detect) {
                            const textBin = await item.text();
                            const detectEncoding = window['jschardet'].detect(textBin, {
                                minimumThreshold: 0
                            });
                            console.log(detectEncoding);
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
                                    item['isDigital'] = true;
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
                                // const downloadURL = URL.createObjectURL(blob);
                                // window.open(downloadURL);

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
                            this.filesForContainerCompleted =
                                this.filesForContainerCompleted + 1;
                            this.filesBeforeOrder.push(item);

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
                } else if (item.type.includes('image/') && item.type !== 'image/gif') {
                    const src_result = await this.addImageProcess(item);
                    item.src = src_result;
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
        // console.log('files', this.files)
        const filesCapture = this.files;
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
                uploadSource: 'UPLOAD'
            })
            .subscribe((response: any) => {
                this.uploadFilesOcrPopUp.urlsFiles = response
                    ? response['body']
                    : response;
                console.log('responseFiles', this.uploadFilesOcrPopUp.urlsFiles);
                this.progress = this.uploadToServer(filesCapture); // this.uploadToServer(this.files);
                // console.log(this.files)

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
                                this.componentRefChild.startChild();
                            }
                        }
                    });

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

                const allProgressObservables = [];
                // tslint:disable-next-line:forin
                for (const key in this.progress) {
                    // noinspection JSUnfilteredForInLoop
                    allProgressObservables.push(this.progress[key].progress);
                }

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
                    //                 'filesId': filesCapture.map(file => file.fileId), // this.files.map(file => file.fileId),
                    //                 'folderId': this.folderSelect.folderId
                    //             }),
                    //         message: this.sanitizer.bypassSecurityTrustHtml(
                    //             (filesCapture.length > 1) ?
                    //                 (filesCapture.length + (' מסמכים הועברו ' + '<b>' + 'לארכיון' + '</b>'))
                    //                 : ('המסמך הועבר ' + '<b>' + 'לארכיון' + '</b>')),
                    //         // (this.files.length > 1) ?
                    //         //     (this.files.length + (' מסמכים הועברו ' + '<b>' + 'לארכיון' + '</b>'))
                    //         //     : ('המסמך הועבר ' + '<b>' + 'לארכיון' + '</b>')),
                    //         fired: false
                    //     };
                    //     timer(3000)
                    //         .pipe(switchMap(() => {
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
                    //         ).subscribe(() => {
                    //         this.componentRefChild.setForLogicAfterUpload = true;
                    //         this.componentRefChild.interval$.next(5 * 1000);
                    //         this.afterUpload();
                    //         this.componentRefChild.startChild();
                    //     });
                    // } else {
                    //
                    // }

                    this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                        {
                            duration: 3,
                            multiple: filesCapture.length > 1,
                            text:
                                filesCapture.length +
                                ' מסמכים הועלו לחברת ' +
                                this.userService.appData.userData.companySelect.companyName +
                                ' ועברו לפיענוח'
                            // multiple: this.files.length > 1,
                            // text: this.files.length + ' מסמכים הועלו לחברת ' + this.userService.appData.userData.companySelect.companyName + ' ועברו לפיענוח'
                        }
                    );
                    this.componentRefChild.setForLogicAfterUpload = true;
                    this.componentRefChild.interval$.next(5 * 1000);
                    this.afterUpload();
                    this.componentRefChild.startChild();
                });
            });
    }

    afterUpload() {
        // this.fileUploadProgress = false;
        // this.folderSelect = false;
        // this.files = [];
        // this.progress = false;
        // this.uploadFilesOcrPopUp = {
        //     visible: false,
        //     urlsFiles: []
        // };
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
            this.http.request(req).subscribe(
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

    createImageBase64FromBlob(blobFile: Blob): Promise<any> {
        return new Promise((resolve, reject) => {
            const reader: any = new FileReader();
            reader.onload = (evt) => {
                resolve((evt.target as any).result);
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
            this.http.request(req).subscribe(
                (event) => {
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
                (error) => {
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
                        },
                        (error) => {
                        }
                    );
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
                    //             this.afterScan();
                    //             this.componentRefChild.setForLogicAfterUpload = true;
                    //             this.componentRefChild.startChild();
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
                    this.afterScan();
                    this.componentRefChild.setForLogicAfterUpload = true;
                    this.componentRefChild.startChild();
                });
            });
    }

    afterScan() {
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

    eventRightPos(event: any) {
        this.rightSideTooltip =
            window.innerWidth -
            (event.target.parentElement.offsetLeft + event.target.offsetWidth) -
            33;
    }

    handleClick() {
        this.componentRefChild.fileIdToToActive = false;
    }

    public onDragleave() {
        console.log('onDragleave');
    }

    // public onDrag($event: any, ulContainerDrag: any) {
    //     const width = Array.from(ulContainerDrag.children).reduce((a, b) => {
    //         return a + b['offsetWidth'];
    //     }, 0);
    //     // console.log('width', width);
    //     const viewportOffset = ulContainerDrag.getBoundingClientRect();
    //     const top = viewportOffset.top;
    //     const left = viewportOffset.left;
    //     const bottom = viewportOffset.bottom;
    //     const right = left + width;
    //     console.log('dropEffect', $event.dataTransfer.dropEffect)
    //     // console.log('boxBorders', {
    //     //     left,
    //     //     top,
    //     //     bottom,
    //     //     right
    //     // });
    //     // console.log('$event.XY', {
    //     //     x: $event.x,
    //     //     y: $event.y
    //     // });
    //     // console.log('$event.screenXY', {
    //     //     screenX: $event.screenX,
    //     //     screenY: $event.screenY
    //     // });
    //     if ($event.x < left) {
    //         console.log('out from left');
    //         // $event.preventDefault();
    //         // this.isDraggable = false;
    //         // return false;
    //
    //
    //         (<any>$($event)).addClass( 'unselectable' ) // All these attributes are inheritable
    //             .attr( 'unselectable', 'on' ) // For IE9 - This property is not inherited, needs to be placed onto everything
    //             .attr( 'draggable', 'false' ) // For moz and webkit, although Firefox 16 ignores this when -moz-user-select: none; is set, it's like these properties are mutually exclusive, seems to be a bug.
    //             .on( 'dragstart', function() { return false; } );  // Needed since Firefox 16 seems to ingore the 'draggable' attribute we just applied above when '-moz-user-select: none' is applied to the CSS
    //
    //         (<any>$($event)) // Apply non-inheritable properties to the child elements
    //             .find( '*' )
    //             .attr( 'draggable', 'false' )
    //             .attr( 'unselectable', 'on' );
    //     }
    //     if ($event.x > right) {
    //         console.log('out from right');
    //         (<any>$($event))
    //             .addClass( 'unselectable' ) // All these attributes are inheritable
    //             .attr( 'unselectable', 'on' ) // For IE9 - This property is not inherited, needs to be placed onto everything
    //             .attr( 'draggable', 'false' ) // For moz and webkit, although Firefox 16 ignores this when -moz-user-select: none; is set, it's like these properties are mutually exclusive, seems to be a bug.
    //             .on( 'dragstart', function() { return false; } );  // Needed since Firefox 16 seems to ingore the 'draggable' attribute we just applied above when '-moz-user-select: none' is applied to the CSS
    //
    //         (<any>$($event)) // Apply non-inheritable properties to the child elements
    //             .find( '*' )
    //             .attr( 'draggable', 'false' )
    //             .attr( 'unselectable', 'on' );
    //         // $event.preventDefault();
    //         // this.isDraggable = false;
    //         // return false;
    //     }
    // }

    public refreshBack(list: any) {
        const newFilesArr = [];
        list.forEach((it) => {
            newFilesArr.push(this.files[it]);
        });
        this.files = newFilesArr;
    }

    public onDrop($event: any, index: number) {
        this.handleDrop(index);
    }

    public allowDrop($event: any, index: number) {
        console.log('allowDrop');

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
                    if (this.docToRemove.visible) {
                        const addSubject = this.subjectsForCompany.find(
                            (it) => it.subjectId === '11111111-1111-1111-1111-111111111111'
                        );
                        if (addSubject) {
                            addSubject.subjectText =
                                'שלום רב, \n' + 'לידיעתך המסמך המצורף הוסר ולא יוכר כהוצאה.';
                            this.docToRemove.form.patchValue({
                                from:
                                    this.userService.appData.userData.firstName +
                                    ' ' +
                                    this.userService.appData.userData.lastName,
                                fromMail: this.userService.appData.userData.mail
                                    ? this.userService.appData.userData.mail.trim()
                                    : null,
                                subject: addSubject
                            });
                        } else {
                            this.docToRemove.form.patchValue({
                                from:
                                    this.userService.appData.userData.firstName +
                                    ' ' +
                                    this.userService.appData.userData.lastName,
                                fromMail: this.userService.appData.userData.mail
                                    ? this.userService.appData.userData.mail.trim()
                                    : null,
                                subject: {
                                    companyId: 'string',
                                    subjectId: '11111111-1111-1111-1111-111111111111',
                                    subjectName: 'הסרת מסמך',
                                    subjectText:
                                        'שלום רב, \n' +
                                        'לידיעתך המסמך המצורף הוסר ולא יוכר כהוצאה.',
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

    contactsWithoutAgreementSend() {
        const companyContactIdList = this.contactsWithoutAgreement.map(
            (v) => v.companyContactId
        );
        this.sharedService
            .sendLandingPageMessages(companyContactIdList)
            .subscribe(() => {
                this.userService.appData.submitAlertContact = true;
                setTimeout(() => {
                    this.userService.appData.submitAlertContact = false;
                }, 3000);
                // this.companiesWithoutAgreement = true;
                // setTimeout(() => {
                //     this.companiesWithoutAgreement = false;
                // }, 3000);
                this.contactsWithoutAgreement = [];
            });
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

    ngOnDestroy() {
        this.reportService.forLogic = null;
        this.reportService.postponed = null;
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
    }
}
