import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '@app/core/user.service';
import {Observable, timer} from 'rxjs';
import {ReportService} from '@app/core/report.service';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {TokenService} from '@app/core/token.service';
import {HttpServices} from '@app/shared/services/http.services';
import {Subject} from 'rxjs/internal/Subject';
import {AuthService} from '@app/login/auth.service';
import {StorageService} from '@app/shared/services/storage.service';
import {SharedService} from '@app/shared/services/shared.service';
import {HttpErrorResponse} from '@angular/common/http';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {AbstractControl, FormBuilder, FormControl, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {ValidatorsFactory} from '../foreign-credentials/validators';
import {publishRef} from '../../functions/publishRef';
import {SharedComponent} from '@app/shared/component/shared.component';

@Component({
    selector: 'app-top-notification-area',
    templateUrl: './top-notification-area.component.html',
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class TopNotificationAreaComponent implements OnInit, OnDestroy {
    toastTransactionCreation: {
        duration: number;
        onPaymentNavigationSelected?: Function;
        multiple?: boolean;
        text?: string;
    };
    timer$: Observable<number>;

    readonly mailVerificationPrompt: {
        visible: boolean;
        sendActivationMails$: Observable<any>;
    } = {
        visible: false,
        sendActivationMails$: null
    };
    popUpReplaceMailShow = false;

    backendFailedResponse$: Observable<any>;
    private readonly destroyed$ = new Subject<void>();
    public readonly companySelectionChange$: Subject<void> = new Subject<void>();
    @Input() runTopNot = false;
    knowledgeBaseVisible: any = false;
    companiesWithoutAgreement: any = false;
    loaderSubmit: any = true;
    showAddInfo: any = false;
    submitAlert: any = false;
    addContactForm: any;
    public joinAppContactModal: any = false;
    public contactSaved: any = false;
    public authorizedSignerContactModal: any = false;
    accountantAgreementStatus: any = {};
    selcetAllFiles: any = false;
    public showModalVar: boolean = true;
    public hideModalVar: boolean = false;
    public addContactModalError: boolean = false;


    constructor(
        public sharedComponent: SharedComponent,
        public router: Router,
        private route: ActivatedRoute,
        public authService: AuthService,
        public userService: UserService,
        public fb: FormBuilder,
        public reportService: ReportService,
        private restCommonService: RestCommonService,
        private storageService: StorageService,
        public tokenService: TokenService,
        private sharedService: SharedService,
        private httpService: HttpServices
    ) {
        this.companySelectionChange$.subscribe(() => {
            const isExampleCompany = this.userService.appData.userData.exampleCompany;
            const inAccountancyButHasNoPermission =
                this.router.url.includes('cfl/accountancy/') &&
                !this.userService.appData.userData.companySelect.privs.includes(
                    'ANHALATHESHBONOT'
                );
            const mailActivation =
                this.userService.appData.userData.activatedType === 'dialogUpdate';
            const companySelectedBillingStatusWarn =
                this.userService.appData.userData.companySelectedBillingStatus ===
                'WARN';
            const countStatusData_NOT_OK =
                this.userService.appData.countStatusData === 'NOT_OK' &&
                this.userService.appData.userData &&
                this.userService.appData.userData.accountant;
            const countStatusDataOldNOT_OK =
                this.userService.appData.countStatusDataOldNOT_OK &&
                this.userService.appData.userData &&
                this.userService.appData.userData.accountant;
            if (
                countStatusData_NOT_OK ||
                countStatusDataOldNOT_OK ||
                companySelectedBillingStatusWarn ||
                inAccountancyButHasNoPermission ||
                (mailActivation &&
                    !inAccountancyButHasNoPermission &&
                    !isExampleCompany) ||
                (!this.userService.appData.userData.companySelectedBillingStatus &&
                    !inAccountancyButHasNoPermission &&
                    isExampleCompany)
            ) {
                this.userService.appData.userData.topSideMesagges = true;
            } else {
                this.userService.appData.userData.topSideMesagges = false;
            }
        });
    }

    closePoalimAlert() {
        this.userService.appData.userData.companySelect.alertTokensMotyEyalPoalimAsakim = false;
        if (!this.userService.appData.userData.companySelect.alertTokensOthers.length) {
            this.userService.appData.userData.companySelect.alertTokens = false;
        }
    }

    updateContactSelected(row: any, dd: any) {
        if (row.contactSelected && row.contactSelected.value !== 'null') {
            row.companyContacts.unshift({
                label: 'ביטול בחירה',
                value: 'null'
            });
        } else {
            row.companyContacts = row.companyContacts.filter(it => it.value !== 'null');
        }

        if (dd) {
            dd.options = row.companyContacts;
        }
        // dd.optionsToDisplay = row.companyContacts;
        // dd._options = row.companyContacts;
    }

    isCompaniesScreen() {
        const urlState: string = this.router.url.split('?')[0];
        return urlState === '/accountants/companies';
    }

    withinTwentyFourHours(dateTime: any) {
        return Math.floor(Math.abs(dateTime - new Date().getTime()) / 36e5);
    }

    withinTwentyFourHoursMin(dateTime: any) {
        const hours = Math.floor(Math.abs(dateTime - new Date().getTime()) / 36e5);
        if (hours >= 1) {
            return hours;
        } else {
            return Math.floor((Math.abs(dateTime - new Date().getTime()) / 36e5) * 60);
        }
    }

    showCompaniesWithoutAgreement() {
        this.loaderSubmit = true;
        this.accountantAgreementStatus = {};
        this.sharedService.accountantAgreementStatus().subscribe((response) => {
            this.accountantAgreementStatus = (response) ? response['body'] : response;
            const agreementStatuses = [];
            this.accountantAgreementStatus.agreementStatuses.forEach((row) => {
                if (row.companyContacts && row.companyContacts.length) {
                    const allCompamiesWithoutAgreement = row.companyContacts.every((v) => !v.agreementSendDate);
                    row.companyContacts.forEach((v, i) => {
                        v.label = v.firstName + ' ' + v.lastName;
                        v.value = v.companyContactId;
                        if (v.agreementSendDate) {
                            const rowCopy = JSON.parse(JSON.stringify(row));
                            rowCopy.contactSelected = v;
                            rowCopy.selcetFile = false;
                            rowCopy.agreementSendDate = true;
                            agreementStatuses.push(rowCopy);
                        } else {
                            if (i + 1 === row.companyContacts.length && allCompamiesWithoutAgreement) {
                                const rowCopy = JSON.parse(JSON.stringify(row));
                                rowCopy.selcetFile = false;
                                rowCopy.agreementSendDate = false;
                                rowCopy.companyContacts = rowCopy.companyContacts.filter(it => !it.agreementSendDate);
                                // if (!rowCopy.companyContacts.length) {
                                //     rowCopy.companyContacts = [{
                                //         label: '',
                                //         value: ''
                                //     }, {
                                //         label: 'הוספת איש קשר חדש',
                                //         value: 'add',
                                //         inactive: true
                                //     }];
                                // } else {
                                //     rowCopy.companyContacts.push({
                                //         label: 'הוספת איש קשר חדש',
                                //         value: 'add',
                                //         inactive: true
                                //     });
                                // }
                                agreementStatuses.push(rowCopy);
                            }
                        }
                    });
                } else {
                    const rowCopy = JSON.parse(JSON.stringify(row));
                    rowCopy.selcetFile = false;
                    rowCopy.agreementSendDate = false;
                    rowCopy.companyContacts = [];
                    agreementStatuses.push(rowCopy);
                }
            });

            this.accountantAgreementStatus.agreementStatuses = agreementStatuses;
            this.submitAlert = false;
            this.loaderSubmit = false;
        });
        this.companiesWithoutAgreement = true;
    }

    selecteAllFilesEvent(): void {
        this.accountantAgreementStatus.agreementStatuses.forEach((row) => {
            row.selcetFile = this.selcetAllFiles;
        });
    }

    checkSelected(): void {
        this.selcetAllFiles = this.accountantAgreementStatus.agreementStatuses.every(row => row.selcetFile);
    }


    companiesWithoutAgreementSubmit() {
        this.loaderSubmit = true;
        const isSelected = this.accountantAgreementStatus.agreementStatuses.filter(it => (it.agreementSendDate && it.contactSelected && it.contactSelected.value !== 'null' && it.selcetFile) || (!it.agreementSendDate && it.contactSelected && it.contactSelected.value !== 'null'));
        if (isSelected.length) {
            this.sharedService
                .sendLandingPageMessages(
                    isSelected.map((v) => v.contactSelected.companyContactId)
                )
                .subscribe(() => {
                    this.loaderSubmit = false;
                    this.submitAlert = isSelected.length;
                    setTimeout(() => {
                        this.submitAlert = false;
                        this.companiesWithoutAgreement = false;
                    }, 3000);
                });
        }
    }

    isDisabledSelectedContacts() {
        if (this.accountantAgreementStatus.agreementStatuses) {
            const isSelected = this.accountantAgreementStatus.agreementStatuses.filter(it => (it.agreementSendDate && it.contactSelected && it.contactSelected.value !== 'null' && it.selcetFile) || (!it.agreementSendDate && it.contactSelected && it.contactSelected.value !== 'null'));
            if (isSelected.length) {
                return false;
            }
        }
        return true;
    }

    trackById(idx: number, item: any) {
        return item.custId;
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    getContactsList(row: any, runAgain?: boolean) {
        if (row.contactList && !runAgain) {
        } else {
            row.contactSelected = null;
            row.contactList = [
                {
                    label: 'loader',
                    value: ''
                }
            ];
            row.contactListLoader = true;
            this.sharedService
                .contacts({
                    uuid: row.companyId
                })
                .subscribe((response: any) => {
                    row.contactList = response ? response['body'] : response;
                    row.contactList.forEach((v) => {
                        v.label = v.firstName + ' ' + v.lastName;
                        v.value = v.companyContactId;
                    });
                    row.contactListLoader = false;
                    if (row.contactListLoader === false && !row.contactList.length) {
                        row.contactList = [
                            {
                                label: 'לא נמצאו אנשי קשר לחברה זו',
                                value: ''
                            },
                            {
                                label: 'הוספת איש קשר חדש',
                                value: 'add'
                            }
                        ];
                    } else {
                        row.contactList.push({
                            label: 'הוספת איש קשר חדש',
                            value: 'add'
                        });
                    }
                    // row =  this.contactList[0].companyContactId
                });
        }
    }

    openModalAddContact($event: any, row: any) {
        $event.stopPropagation();

        // companyId
        // companyName
        this.userService.appData.addContactModal = {
            company: row,
            contacts: null,
            reloadLocalArr: true,
            addContactForm: this.fb.group({
                firstName: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        updateOn: 'change',
                        validators: [Validators.required]
                    }
                ),
                lastName: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [Validators.required],
                        updateOn: 'change'
                    }
                ),
                cellPhone: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [
                            Validators.required,
                            Validators.compose([
                                ValidatorsFactory.cellNumberValidatorIL,
                                // tslint:disable-next-line:max-line-length
                                this.forbiddenCellPhoneExistValidator()
                            ])
                        ],
                        updateOn: 'change'
                    }
                ),
                email: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [
                            Validators.required,
                            ValidatorsFactory.emailExtended,
                            this.forbiddenMailExistValidator()
                        ],
                        updateOn: 'change'
                    }
                ),
                position: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        updateOn: 'change'
                    }
                ),
                companyContactIdsMark: this.fb.control(false),
                joinApp: this.fb.control(false),
                authorizedSigner: this.fb.control(false),
                companyContactId: null
            })
        };

        this.sharedService
            .contacts({
                uuid: row.companyId
            })
            .subscribe((response: any) => {
                const responseRest = response ? response['body'] : response;
                this.userService.appData.addContactModal.contactsList = responseRest;
            });
    }

    forbiddenMailExistValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isEmailExist = this.userService.appData.addContactModal.contacts
                ? this.userService.appData.addContactModal.contacts.controls.filter(
                    (it) =>
                        it['controls'] &&
                        it['controls'].email.value &&
                        it['controls'].email.value === control.value
                )
                : this.userService.appData.addContactModal.contactsList
                    ? this.userService.appData.addContactModal.contactsList.filter(
                        (it) => it.email && it.email === control.value
                    )
                    : false;
            return isEmailExist && isEmailExist.length > 0
                ? {forbiddenMail: {value: control.value}}
                : null;
        };
    }

    forbiddenCellPhoneExistValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isEmailExist = this.userService.appData.addContactModal.contacts
                ? this.userService.appData.addContactModal.contacts.controls.filter(
                    (it) =>
                        it['controls'] &&
                        it['controls'].cellPhone.value &&
                        it['controls'].cellPhone.value === control.value
                )
                : this.userService.appData.addContactModal.contactsList
                    ? this.userService.appData.addContactModal.contactsList.filter(
                        (it) => it.cellPhone && it.cellPhone === control.value
                    )
                    : false;
            return isEmailExist && isEmailExist.length > 0
                ? {forbiddenCellPhone: {value: control.value}}
                : null;
        };
    }

    joinAppContact(contact: any) {
        if (contact.get('joinApp').value) {
            const supplierJournalItem =
                this.userService.appData.addContactModal.company.supplierJournalItem;
            this.joinAppContactModal = {
                supplierJournalItem: supplierJournalItem === true,
                join: true,
                contact: contact
            };
            this.contactSaved = {
                contact: contact
            };
        } else {
            this.joinAppContactModal = {
                join: false,
                contact: contact
            };
            this.contactSaved = {
                contact: contact
            };
        }
    }

    joinAppContactModalClose(contact: any) {
        contact.patchValue({
            joinApp: !contact.get('joinApp').value
        });
        this.joinAppContactModal = false;
        this.contactSaved = false;
    }

    joinAppContactFromModal(param: any) {
        this.joinAppContactModal = false;
    }

    authorizedSignerContact(contact: any) {
        // if (contact.get('authorizedSigner').value) {
        //     this.authorizedSignerContactModal = {
        //         authorizedSigner: true,
        //         contact: contact
        //     };
        //     this.contactSaved = {
        //         contact: contact
        //     };
        // } else {
        //     this.authorizedSignerContactModal = {
        //         authorizedSigner: false,
        //         contact: contact
        //     };
        //     this.contactSaved = {
        //         contact: contact
        //     };
        // }
    }

    authorizedSignerContactModalClose(contact: any) {
        contact.patchValue({
            authorizedSigner: !contact.get('authorizedSigner').value
        });
        this.authorizedSignerContactModal = false;
        this.contactSaved = false;
    }

    authorizedSignerContactFromModal(param: any) {
        this.authorizedSignerContactModal = false;
    }

    addContactSave() {
        const contact = this.userService.appData.addContactModal.addContactForm;
        const row = this.userService.appData.addContactModal.company;
        const contacts = this.userService.appData.addContactModal.contacts;
        const reload = this.userService.appData.addContactModal.reload;
        const isBeforeAddProduct = this.userService.appData.addContactModal.isBeforeAddProduct;
        const updateDD = this.userService.appData.addContactModal.updateDD;
        const reloadLocalArr = this.userService.appData.addContactModal.reloadLocalArr;
        const params = {
            companyId: this.userService.appData.addContactModal.company.companyId,
            firstName: contact.get('firstName').value,
            authorizedSigner: contact.get('authorizedSigner').value
        };
        params['cellPhone'] = contact.get('cellPhone').value || null;
        params['email'] = contact.get('email').value || null;
        params['lastName'] = contact.get('lastName').value || null;
        params['phoneNum'] = null;
        this.userService.appData.addContactModal = false;
        this.sharedService.addContact(params).subscribe((response: any) => {
            const responseRest = response ? response['body'] : response;
            //     companyContactId: responseRest.companyContactId,
            //     companyId: responseRest.companyId,
            //     firstName: responseRest.firstName
            if (this.companiesWithoutAgreement && responseRest.companyContactId) {
                if (this.accountantAgreementStatus && this.accountantAgreementStatus.agreementStatuses) {
                    this.accountantAgreementStatus.agreementStatuses.forEach(it => {
                        if (it.companyId === row.companyId) {
                            responseRest.label = responseRest.firstName + ' ' + responseRest.lastName;
                            responseRest.value = responseRest.companyContactId;
                            it.contactSelected = responseRest;
                            it.companyContacts.push(responseRest);
                            this.updateContactSelected(it, null);
                        }
                    });
                }
            }

            if (isBeforeAddProduct) {
                if (response.status === 400) {
                    this.addContactModalError = true;
                } else {
                    this.router.navigate(['./companies/companyProducts/addProducts'], {
                        queryParamsHandling: 'merge',
                        relativeTo: this.route
                    });
                }
            }


            if (updateDD && !isBeforeAddProduct) {
                responseRest.label = responseRest.firstName + ' ' + responseRest.lastName;
                responseRest.value = responseRest.companyContactId;
                updateDD.next({
                    company: row,
                    contactAdded: responseRest
                });
            } else {
                if (
                    responseRest.companyContactId &&
                    contact.get('authorizedSigner').value &&
                    !this.companiesWithoutAgreement
                ) {
                    this.sharedService
                        .sendLandingPageMessages([responseRest.companyContactId])
                        .subscribe(() => {
                            this.userService.appData.submitAlertContact = true;
                            setTimeout(() => {
                                this.userService.appData.submitAlertContact = false;
                            }, 3000);
                        });
                }
            }

            setTimeout(() => {
                if (responseRest.companyContactId && contact.get('joinApp').value) {
                    this.sharedService
                        .joinAppContact({
                            uuid: responseRest.companyContactId
                        })
                        .subscribe(() => {
                            if (updateDD && !isBeforeAddProduct) {

                            } else {
                                if (contacts) {
                                    this.userService.reloadEvent.next(true);
                                } else {
                                    // this.getContactsList(row, true);
                                }
                            }

                        });
                } else {
                    if (updateDD && !isBeforeAddProduct) {

                    } else {
                        if (contacts || reload) {
                            this.userService.reloadEvent.next(true);
                        } else {
                            // this.getContactsList(row, true);
                        }
                    }
                }
            }, 1000);

        });
    }

    addContact() {
    }

    showOpenTicket(getData?: boolean) {
        if (getData) {
            this.sharedService.getUserSettings().subscribe(
                (response: any) => {
                    this.knowledgeBaseVisible = response ? response['body'] : response;
                    // {
                    //     "activated": true,
                    //     "activatorDateCreated": "2018-07-03T00:00:00",
                    //     "authenticationType": "REGULAR",
                    //     "cellPhone": "string",
                    //     "firstName": "string",
                    //     "language": "string",
                    //     "lastName": "string",
                    //     "mail": "string"
                    // }
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
            this.knowledgeBaseVisible = true;
        }
    }

    private recreateBackendFailureListener() {
        return this.httpService.backendFailedResponse$.pipe(
            switchMap(() =>
                timer(0, 2000).pipe(
                    map((i) => i + 1),
                    take(2),
                    tap({
                        complete: () => {
                            // debugger;
                            this.backendFailedResponse$ =
                                this.recreateBackendFailureListener();
                            this.userService.appData.userData.topSideMesagges = true;
                        }
                    })
                )
            )
        );
    }

    ngOnInit(): void {
        if (this.runTopNot) {
            this.backendFailedResponse$ = this.recreateBackendFailureListener();
        }
        // this.userService.appData.userData.topSideMesagges = (
        //     this.userService.appData.userData.companySelectedBillingStatus === 'WARN' ||
        //     (this.router.url.includes('cfl/accountancy/') && !this.userService.appData.userData.companySelect.privs.includes('ANHALATHESHBONOT')) ||
        //     (this.userService.appData.userData.activatedType === 'dialogUpdate' && !((this.router.url.includes('cfl/accountancy/') && !this.userService.appData.userData.companySelect.privs.includes('ANHALATHESHBONOT'))) && !this.userService.appData.userData.exampleCompany));
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    public toastTransactionCreationSuccess(actionHandler: {
        duration: number;
        onPaymentNavigationSelected?: Function;
        multiple?: boolean;
        text?: string;
    }) {
        this.toastTransactionCreation = actionHandler;
        this.timer$ = timer(1000, 1000).pipe(takeUntil(this.destroyed$));
    }

    changeApplied(event: any): void {
        if (event) {
            this.popUpReplaceMailShow = false;
            setTimeout(() => {
                this.authService.logout();
            }, 200);
        } else {
            this.popUpReplaceMailShow = false;
        }
    }

    showupMailVerificationPrompt() {
        this.mailVerificationPrompt.sendActivationMails$ = this.restCommonService
            .sendActivationMails()
            .pipe(
                map((resp) => (resp && !resp.error ? resp.body : null)),
                publishRef
            );
        this.mailVerificationPrompt.visible = true;
    }

    hideAlertTokens(): void {
        const companyIdsHideAlertTokens =
            this.storageService.sessionStorageGetterItem('companyIdsHideAlertTokens');
        if (companyIdsHideAlertTokens !== null) {
            const companyIdsHideAlertTokensArr = JSON.parse(
                companyIdsHideAlertTokens
            );
            companyIdsHideAlertTokensArr.push(
                this.userService.appData.userData.companySelect.companyId
            );
            this.storageService.sessionStorageSetter(
                'companyIdsHideAlertTokens',
                JSON.stringify(companyIdsHideAlertTokensArr)
            );
        } else {
            this.storageService.sessionStorageSetter(
                'companyIdsHideAlertTokens',
                JSON.stringify([
                    this.userService.appData.userData.companySelect.companyId
                ])
            );
        }
        const tokenIds =
            this.userService.appData.userData.companySelect.alertTokens.map(
                (tokens) => tokens.token
            );
        this.userService.appData.userData.companySelect.alertTokens = false;
        this.sharedService
            .tokenAlert({
                indAlert: 0,
                tokenIds: tokenIds
            })
            .subscribe(() => {
            });
    }
}
