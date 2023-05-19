import {Component, Input, OnDestroy, OnInit, Optional, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
// import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
// import {DialogComponent} from '@app/shared/component/dialog/dialog.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {tap} from 'rxjs/operators';
import {HelpCenterService} from '@app/customers/help-center/help-center.service';
import {AuthService} from '@app/login/auth.service';
import {ValidatorsFactory} from '../foreign-credentials/validators';
import {UserService} from '@app/core/user.service';
import {Router} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {Dialog} from 'primeng/dialog';
import {SharedComponent} from '@app/shared/component/shared.component';

@Component({
    selector: 'app-service-call-dialog',
    templateUrl: './service-call-dialog.component.html',
    encapsulation: ViewEncapsulation.None
})
export class ServiceCallDialogComponent implements OnInit, OnDestroy {
    readonly serviceCallForm: any = new FormGroup({
        companyId: new FormControl(null),
        companyName: new FormControl(null),
        companyHp: this.sharedComponent.isNoCompaniesFound ? new FormControl('', Validators.compose([Validators.required,
            ValidatorsFactory.idValidatorIL, Validators.maxLength(9),
            Validators.pattern('\\d+')])) : new FormControl(null),
        accountNickname: new FormControl(null),
        taskTitle: new FormControl('', [Validators.required]),
        closeMailToSend: new FormControl('', [
            Validators.required,
            // Validators.email,
            ValidatorsFactory.emailExtended
        ]),
        taskOpenerName: new FormControl('', [Validators.required]),
        taskDesc: new FormControl('', [Validators.required]),
        userCellPhone: new FormControl('', [
            Validators.required,
            ValidatorsFactory.cellNumberValidatorILWithInternationalFormats
        ])
    });

    public subjects: Array<{
        subject: string;
        hint?: string;
        hintClick?: () => void;
    }>;

    public saveData = new FormControl(!!(this.storageService.localStorageGetterItem('userCellPhone') ||
        this.storageService.localStorageGetterItem('closeMailToSend') ||
        this.storageService.localStorageGetterItem('taskOpenerName')));

    @Input() data: any;
    @Input() dialogCall: any;

    @Input() companyId: any = false;
    @Input() accountNickname: any = false;
    @Input() dataFromBankAndCreditScreen: any = false;
    @Input() isHashavshevet: boolean = false;
    @Input() companiesFromBank: any = [];
    @Input() isBank: any = true;

    constructor(
        @Optional() public dialog: Dialog,
        private authService: AuthService,
        private storageService: StorageService,
        private helpCenterService: HelpCenterService,
        public userService: UserService,
        private router: Router,
        @Optional() public sharedComponent: SharedComponent
    ) {
    }

    ngOnInit() {
        if (this.dialogCall) {
            this.dialogCall.draggable = false;
            this.dialogCall.resizable = false;
            this.dialogCall.responsive = true;
            this.dialogCall.minX = 0;
            this.dialogCall.minY = 0;
            // this.dialog.minHeight = 492;
            // this.dialog.autoAlign = true;
            this.dialogCall.showHeader = true;
            this.dialogCall.styleClass = 'service-call-dialog';
        }


        let companySelect = false;
        let appServiceCallDialogSaved: any = false;
        if (this.userService.appData.userData.companies && this.companyId && !this.dataFromBankAndCreditScreen) {
            companySelect = this.userService.appData.userData.companies.find(
                (co) => co.companyId === this.companyId
            );
            appServiceCallDialogSaved = this.storageService.localStorageGetterItem(
                this.companyId + '-' + this.accountNickname + '-app-service-call-dialog'
            );
            if (appServiceCallDialogSaved) {
                appServiceCallDialogSaved = JSON.parse(appServiceCallDialogSaved);
            }
        }
        if (this.userService.appData.userData.companies && this.dataFromBankAndCreditScreen && this.userService.appData.userData.companySelect) {
            companySelect = this.userService.appData.userData.companies.find(
                (co) => co.companyId === this.userService.appData.userData.companySelect.companyId
            );
            appServiceCallDialogSaved = this.storageService.localStorageGetterItem(
                this.userService.appData.userData.companySelect.companyId + '-' + this.dataFromBankAndCreditScreen.params.screenType + '-app-service-call-dialog'
            );
            if (appServiceCallDialogSaved) {
                appServiceCallDialogSaved = JSON.parse(appServiceCallDialogSaved);
            }
        }


        if (this.isHashavshevet) {
            this.subjects = [
                {
                    subject: 'חשבונות בנק'
                },
                {
                    subject: 'כרטיסי אשראי'
                },
                {
                    subject: 'הוספת חשבון פועלים לעסקים'
                },
                {
                    subject: 'אפליקציית פועלים לעסקים'
                },
                {
                    subject: 'יבוא נתונים'
                },
                {
                    subject: 'תשלומים'
                },
                {
                    subject: 'אחר'
                }
            ];
        } else if (!!this.sharedComponent && !!this.sharedComponent.isNoCompaniesFound) {
            this.subjects = [
                {
                    subject: 'הוספת חברה מרווחית אונליין'
                },
                {
                    subject: 'הוספת חברה ממשרדית'
                },
                {
                    subject: 'הוספת חברה מפריוריטי'
                },
                {
                    subject: 'לא מצאתי את החברה שרציתי'
                }
            ];
        } else {
            if (
                this.userService.appData.userData &&
                this.userService.appData.userData.accountant
            ) {
                this.subjects = [
                    {
                        subject: 'הוספת חברה לפקודות יומן לחשבוניות'
                    },
                    {
                        subject: 'הגדרות חברה'
                    },
                    {
                        subject: 'העלאת מסמכים'
                    },
                    {
                        subject: 'כפילות חשבוניות'
                    },
                    {
                        subject: 'ארכיון המסמכים'
                    },
                    {
                        subject: 'יצירת קובץ בתיקיית ביזיבוקס במחשב'
                    },
                    {
                        subject: 'קליטת קובץ לתוכנת הנה"ח'
                    },
                    {
                        subject: 'פתיחת כרטיס הנהלת חשבונות'
                    }
                ];
            } else {
                if (
                    this.userService.appData &&
                    this.userService.appData.userData &&
                    this.userService.appData.userData.companySelect &&
                    this.userService.appData.userData.companySelect['biziboxType'] ===
                    'regular'
                ) {
                    this.subjects = [
                        {
                            subject: 'סיסמאות וחשבונות לא מעודכנים',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/settings'
                                            : '/accountants/companies/help-center/settings'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'צ\'קים',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/checks'
                                            : '/accountants/companies/help-center/checks'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'סקירה כללית',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/overview'
                                            : '/accountants/companies/help-center/overview'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'סינון, מיון וחיפוש תנועות'
                        },
                        {
                            subject: 'תשלומים ל- bizibox'
                        },
                        {
                            subject: 'הוספת חשבון פועלים לעסקים'
                        },
                        {
                            subject: 'נושאים אחרים'
                        }
                    ];
                } else {
                    this.subjects = [
                        {
                            subject: 'סיסמאות וחשבונות לא מעודכנים',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/settings'
                                            : '/accountants/companies/help-center/settings'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'צ\'קים',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/checks'
                                            : '/accountants/companies/help-center/checks'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'תנועות קבועות',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/fixedMovements'
                                            : '/accountants/companies/help-center/fixedMovements'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'התאמות בנקים',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/bankmatch'
                                            : '/accountants/companies/help-center/bankmatch'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'סקירה כללית',
                            hint: 'לחצו לצפיה בשאלות ותשובות וסרטוני הדרכה בנושא',
                            hintClick: () => {
                                this.router.navigate(
                                    [
                                        !this.userService.appData.userData.accountant
                                            ? '/cfl/help-center/overview'
                                            : '/accountants/companies/help-center/overview'
                                    ],
                                    {queryParamsHandling: 'preserve'}
                                );
                            }
                        },
                        {
                            subject: 'סינון, מיון וחיפוש תנועות'
                        },
                        {
                            subject: 'משיכת צ\'קים מתוכנת הנה"ח'
                        },
                        {
                            subject: 'תשלומים ל- bizibox'
                        },
                        {
                            subject: 'הוספת חשבון פועלים לעסקים'
                        },
                        {
                            subject: 'נושאים אחרים'
                        }
                    ];
                }
            }
        }
        if (companySelect) {
            this.subjects.push(
                {
                    subject: 'יתרות לא רציפות'
                },
                {
                    subject: 'הוזנו נתונים ממקור אחר'
                }
            );
        }
        const userCellPhone =
            this.storageService.localStorageGetterItem('userCellPhone');
        const closeMailToSend =
            this.storageService.localStorageGetterItem('closeMailToSend');
        if (!this.isHashavshevet) {
            if (this.data !== true) {
                this.subjects.push({
                    subject: 'בעיית אקספורטר'
                });

                this.serviceCallForm.patchValue({
                    accountNickname: this.accountNickname ? this.accountNickname : null,
                    taskTitle: this.subjects[this.subjects.length - 1],
                    closeMailToSend: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.closeMailToSend
                        : closeMailToSend
                            ? closeMailToSend
                            : this.data.mail,
                    userCellPhone: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.userCellPhone
                        : userCellPhone
                            ? userCellPhone
                            : this.userService.appData.userData &&
                            this.userService.appData.userData.phone
                                ? this.userService.appData.userData.phone
                                : null,
                    companyId: companySelect
                        ? companySelect
                        : this.userService.appData.userData &&
                        this.userService.appData.userData.companySelect
                            ? this.userService.appData.userData.companySelect
                            : null,
                    taskOpenerName: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.taskOpenerName
                        : this.data.firstName + ' ' + this.data.lastName,
                    taskDesc: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.taskDesc
                        : 'טעינת הנתונים מהנה"ח לא מתבצעת, גם לאחר איתחול המחשב של ' +
                        this.userService.appData.expComputerName +
                        ' התקלה עדיין לא נפתרה.'
                });
            } else {
                this.serviceCallForm.patchValue({
                    accountNickname: this.accountNickname ? this.accountNickname : null,
                    closeMailToSend: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.closeMailToSend
                        : closeMailToSend
                            ? closeMailToSend
                            : this.authService.getLoggedInUsername(),
                    userCellPhone: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.userCellPhone
                        : userCellPhone
                            ? userCellPhone
                            : this.userService.appData.userData &&
                            this.userService.appData.userData.phone
                                ? this.userService.appData.userData.phone
                                : null,
                    companyId: companySelect
                        ? companySelect
                        : this.userService.appData.userData &&
                        this.userService.appData.userData.companySelect
                            ? this.userService.appData.userData.companySelect
                            : null,
                    taskOpenerName: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.taskOpenerName
                        : this.storageService.localStorageGetterItem('taskOpenerName') ?
                            this.storageService.localStorageGetterItem('taskOpenerName') :
                            '',
                    taskDesc: appServiceCallDialogSaved
                        ? appServiceCallDialogSaved.taskDesc
                        : ''
                });
            }
        }

        if (this.dataFromBankAndCreditScreen) {
            this.subjects = this.dataFromBankAndCreditScreen.subjects;
            this.serviceCallForm.get('accountNickname').disable();
        }
    }

    async submitServiceCall(): Promise<any> {
        console.log('submit service call -> %o', this.serviceCallForm.value);
        if (!this.isHashavshevet) {
            if (
                this.serviceCallForm.invalid ||
                (this.userService.appData.userData &&
                    this.userService.appData.userData.accountant &&
                    !this.serviceCallForm.value.companyId &&
                    (!this.sharedComponent || !this.sharedComponent.isNoCompaniesFound))
            ) {
                BrowserService.flattenControls(this.serviceCallForm).forEach((ac) =>
                    ac.markAsDirty()
                );
                return;
            } else if (
                this.serviceCallForm.pending ||
                this.serviceCallForm.disabled
            ) {
                return;
            }

            const paramServiceCallForm = this.serviceCallForm.value;
            paramServiceCallForm.companyId = paramServiceCallForm.companyId
                ? paramServiceCallForm.companyId.companyId
                : null;
            let serviceCallRequest = Object.assign(
                Object.create(null),
                paramServiceCallForm,
                {
                    taskTitle: this.serviceCallForm.value.taskTitle.subject
                }
            );
            if (!this.dataFromBankAndCreditScreen || (this.saveData.value && this.dataFromBankAndCreditScreen)) {
                this.storageService.localStorageSetter(
                    'userCellPhone',
                    String(this.serviceCallForm.value.userCellPhone)
                );
                this.storageService.localStorageSetter(
                    'closeMailToSend',
                    String(this.serviceCallForm.value.closeMailToSend)
                );
                this.storageService.localStorageSetter(
                    'taskOpenerName',
                    String(this.serviceCallForm.value.taskOpenerName)
                )
            }
            if (!this.saveData.value) {
                this.storageService.localStorageRemoveItem('userCellPhone');
                this.storageService.localStorageRemoveItem('closeMailToSend');
                this.storageService.localStorageRemoveItem('taskOpenerName');
            }
            if (this.saveData.value && this.companyId && !this.dataFromBankAndCreditScreen) {
                this.storageService.localStorageSetter(
                    this.companyId +
                    '-' +
                    this.serviceCallForm.value.accountNickname +
                    '-app-service-call-dialog',
                    JSON.stringify(this.serviceCallForm.value)
                );
            }
            if (this.saveData.value && (this.dataFromBankAndCreditScreen)) {
                this.storageService.localStorageSetter(
                    this.userService.appData.userData.companySelect.companyId +
                    '-' +
                    this.dataFromBankAndCreditScreen.params.screenType +
                    '-app-service-call-dialog',
                    JSON.stringify(this.serviceCallForm.value)
                );
            }
            if (this.dataFromBankAndCreditScreen) {
                if(this.dataFromBankAndCreditScreen.count){
                    this.sharedComponent.mixPanelEvent('kriat sherut', {
                        count: this.dataFromBankAndCreditScreen.count
                    });
                }
                serviceCallRequest = Object.assign(serviceCallRequest, this.dataFromBankAndCreditScreen.params);
            }
            if (!!this.sharedComponent && !!this.sharedComponent.isNoCompaniesFound) {
                serviceCallRequest.accountant = true;
                serviceCallRequest.taskCategoryId = 'F30005F9-2E7F-31C4-E053-0100007FAE18';
            }
            this.serviceCallForm.markAsPending();
            serviceCallRequest.gRecaptcha = await this.userService.executeAction('open-ticket');
            this.helpCenterService
                .requestOpenTicket(serviceCallRequest)
                .pipe(tap(() => this.serviceCallForm.markAsDirty()))
                .subscribe((resp) => {
                    if (resp && !resp.error) {
                        if(this.router.url.includes('help-center')){
                            this.sharedComponent.mixPanelEvent('open service call');
                        }
                        this.serviceCallForm.disable();
                        if (this.dialogCall) {
                            // this.dialog.closable = false;
                            this.dialogCall.styleClass =
                                'service-call-dialog ticketAlreadyIssued';
                            this.dialogCall.container.classList.add('ticketAlreadyIssued');
                            this.dialogCall.headerViewChild.nativeElement.remove();
                        }
                    }
                });
        } else {
            if (this.serviceCallForm.invalid) {
                BrowserService.flattenControls(this.serviceCallForm).forEach((ac) =>
                    ac.markAsDirty()
                );
                return;
            } else if (
                this.serviceCallForm.pending ||
                this.serviceCallForm.disabled
            ) {
                return;
            }

            const paramServiceCallForm = this.serviceCallForm.value;
            let serviceCallRequest = {
                accountNickName: paramServiceCallForm.accountNickname
                    ? paramServiceCallForm.accountNickname.accountNickname
                    : null,
                companyName: paramServiceCallForm.companyName
                    ? paramServiceCallForm.companyName.companyName
                    : null,
                companyHp: paramServiceCallForm.companyHp
                    ? paramServiceCallForm.companyHp.companyHp
                    : null,
                closeMailToSend: paramServiceCallForm.closeMailToSend,
                stationId: this.userService.appData.station_id,
                taskDesc: paramServiceCallForm.taskDesc,
                taskTitle: this.serviceCallForm.value.taskTitle.subject,
                taskOpenerName: paramServiceCallForm.taskOpenerName,
                userCellPhone: paramServiceCallForm.userCellPhone,
                accountant: null
            };
            if (this.dataFromBankAndCreditScreen) {
                serviceCallRequest = Object.assign(serviceCallRequest, this.dataFromBankAndCreditScreen.params);
            }
            if (!this.dataFromBankAndCreditScreen || (this.saveData.value && this.dataFromBankAndCreditScreen)) {
                this.storageService.localStorageSetter(
                    'userCellPhone',
                    String(this.serviceCallForm.value.userCellPhone)
                );
                this.storageService.localStorageSetter(
                    'closeMailToSend',
                    String(this.serviceCallForm.value.closeMailToSend)
                );
                this.storageService.localStorageSetter(
                    'taskOpenerName',
                    String(this.serviceCallForm.value.taskOpenerName)
                );
            }

            this.serviceCallForm.markAsPending();
            this.helpCenterService
                .apiOpenTicket(serviceCallRequest)
                .pipe(tap(() => this.serviceCallForm.markAsDirty()))
                .subscribe((resp) => {
                    if (resp && !resp.error) {
                        if(this.router.url.includes('help-center')){
                            this.sharedComponent.mixPanelEvent('open service call');
                        }
                        if (this.dialogCall) {
                            // this.dialog.closable = false;
                            this.dialogCall.styleClass =
                                'service-call-dialog ticketAlreadyIssued';
                            this.dialogCall.container.classList.add('ticketAlreadyIssued');
                            this.dialogCall.headerViewChild.nativeElement.remove();
                        }
                        this.serviceCallForm.disable();
                    }
                });
        }
    }

    ngOnDestroy(): void {
        if (!!this.sharedComponent) {
            this.sharedComponent.isNoCompaniesFound = false;
        }
    }
}
