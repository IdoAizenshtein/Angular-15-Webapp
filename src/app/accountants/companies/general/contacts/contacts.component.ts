import {ApplicationRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewEncapsulation} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {StorageService} from '@app/shared/services/storage.service';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {AbstractControl, FormArray, FormBuilder, FormControl, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';

import {Subject, Subscription} from 'rxjs';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {BrowserService} from '@app/shared/services/browser.service';

@Component({
    selector: 'app-contacts',
    templateUrl: './contacts.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ContactsComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public contacts: any;
    public loader = true;
    public activeRow;
    @Input() isModal: any = false;
    @Input() isModalFromCompaniesScreen: any = false;
    @Output() closeModal: EventEmitter<any> = new EventEmitter();
    @Input() contactsInput: any;
    public deleteContactModal: any = false;
    public joinAppContactModal: any = false;
    public contactSaved: any = false;
    public isDev: any = false;
    public authorizedSignerContactModal: any = false;
    public subscriptionReloadContacts: Subscription;
    private readonly destroyed$ = new Subject<void>();
    private globalListenerWhenInEdit: () => void | boolean;

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        private renderer: Renderer2,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        private filterPipe: FilterPipe,
        public fb: FormBuilder,
        private appRef: ApplicationRef,
        private http: HttpClient,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public translate: TranslateService,
        private storageService: StorageService,
        private sumPipe: SumPipe,
        public snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        public router: Router
    ) {
        super(sharedComponent);

        if (
            window.location.host.includes('dev') ||
            window.location.host.includes('localhost')
        ) {
            this.isDev = true;
        }
        if (this.subscriptionReloadContacts) {
            this.subscriptionReloadContacts.unsubscribe();
        }
        this.subscriptionReloadContacts = this.userService.reloadEvent.subscribe(
            () => {
                this.reload();
            }
        );
    }

    get arr(): FormArray {
        return this.contacts.get('contactsRows') as FormArray;
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    isContactValid() {
        if (this.isModal) {
            if (this.arr) {
                const arr = this.arr;
                // this.contacts = this.childContactsComponent.contacts;
                if (arr && arr.controls && arr.controls.length) {
                    return arr.controls.some((contact, idx) => {
                        const isEqu =
                            Object.keys(contact.value).length &&
                            Object.keys(contact.value).every((key) => {
                                if (key === 'joinApp') {
                                    return contact.value[key] === false;
                                } else {
                                    return (contact.value[key] === null || contact.value[key] === '');
                                }
                            });
                        return (!contact.valid && contact.touched && !isEqu);
                    });
                }
            }
            return false;
        } else {
            return true;
        }
    }

    ngOnInit(): void {
        this.activeRow = null;
        this.loader = true;

        if (!this.isModal) {
            this.contacts = this.fb.group({
                contactsRows: this.fb.array([])
            });
            if (!this.isModalFromCompaniesScreen) {
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
                        this.loader = true;
                        this.contacts = this.fb.group({
                            contactsRows: this.fb.array([])
                        });
                        this.sharedService
                            .contacts({
                                uuid: this.userService.appData.userData.companySelect.companyId
                            })
                            .subscribe((response: any) => {
                                const responseRest = response ? response['body'] : response;

                                // console.log(responseRest);
                                responseRest.forEach((row) => {
                                    this.arr.push(
                                        this.fb.group({
                                            firstName: new FormControl(
                                                {
                                                    value: row.firstName,
                                                    disabled: false
                                                },
                                                {
                                                    validators: [Validators.required]
                                                }
                                            ),
                                            lastName: new FormControl(
                                                {
                                                    value: row.lastName,
                                                    disabled: false
                                                },
                                                {
                                                    validators: [Validators.required],
                                                    updateOn: !this.isModal ? 'blur' : 'change'
                                                }
                                            ),
                                            cellPhone: new FormControl(
                                                {
                                                    value: row.cellPhone,
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
                                                    updateOn: !this.isModal ? 'blur' : 'change'
                                                }
                                            ),
                                            phoneNum: new FormControl(
                                                {
                                                    value: row.phoneNum,
                                                    disabled: false
                                                },
                                                {
                                                    validators: [
                                                        Validators.required,
                                                        ValidatorsFactory.cellNumberValidatorIL,
                                                        this.forbiddenCellPhoneAndPhoneExistValidator()
                                                    ],
                                                    updateOn: !this.isModal ? 'blur' : 'change'
                                                }
                                            ),
                                            email: new FormControl(
                                                {
                                                    value: row.email,
                                                    disabled: !!row.joinApp
                                                },
                                                {
                                                    validators: [
                                                        Validators.required,
                                                        ValidatorsFactory.emailExtended,
                                                        this.forbiddenMailExistValidator()
                                                    ],
                                                    updateOn: !this.isModal ? 'blur' : 'change'
                                                }
                                            ),
                                            position: new FormControl(
                                                {
                                                    value: row.position,
                                                    disabled: false
                                                },
                                                {
                                                    updateOn: !this.isModal ? 'blur' : 'change'
                                                }
                                            ),
                                            companyContactIdsMark: this.fb.control(false),
                                            authorizedSigner: this.fb.control(row.authorizedSigner),
                                            joinApp: this.fb.control(row.joinApp),
                                            companyContactId: row.companyContactId,
                                            agreementConfirmationDate: row.agreementConfirmationDate,
                                            agreementSendDate: row.agreementSendDate,
                                            companyId: row.companyId
                                        })
                                    );
                                });
                                this.loader = false;
                            });
                    });
            } else {
                this.sharedService
                    .contacts({
                        uuid: this.isModalFromCompaniesScreen.companyId
                    })
                    .subscribe((response: any) => {
                        const responseRest = response ? response['body'] : response;

                        // console.log(responseRest);
                        responseRest.forEach((row) => {
                            this.arr.push(
                                this.fb.group({
                                    firstName: new FormControl(
                                        {
                                            value: row.firstName,
                                            disabled: false
                                        },
                                        {
                                            validators: [Validators.required]
                                        }
                                    ),
                                    lastName: new FormControl(
                                        {
                                            value: row.lastName,
                                            disabled: false
                                        },
                                        {
                                            validators: [Validators.required],
                                            updateOn: !this.isModal ? 'blur' : 'change'
                                        }
                                    ),
                                    cellPhone: new FormControl(
                                        {
                                            value: row.cellPhone,
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
                                            updateOn: !this.isModal ? 'blur' : 'change'
                                        }
                                    ),
                                    email: new FormControl(
                                        {
                                            value: row.email,
                                            disabled: !!row.joinApp
                                        },
                                        {
                                            validators: [
                                                Validators.required,
                                                ValidatorsFactory.emailExtended,
                                                this.forbiddenMailExistValidator()
                                            ],
                                            updateOn: !this.isModal ? 'blur' : 'change'
                                        }
                                    ),
                                    authorizedSigner: this.fb.control(row.authorizedSigner),
                                    companyContactIdsMark: this.fb.control(false),
                                    companyContactId: row.companyContactId,
                                    companyId: row.companyId,
                                    agreementConfirmationDate: row.agreementConfirmationDate,
                                    agreementSendDate: row.agreementSendDate,
                                    joinApp: this.fb.control(row.joinApp),
                                    phoneNum: new FormControl({
                                        value: row.phoneNum,
                                        disabled: true
                                    }),
                                    position: new FormControl({
                                        value: row.position,
                                        disabled: true
                                    })
                                })
                            );
                        });
                        this.loader = false;
                    });
            }
        } else {
            this.contacts = this.contactsInput
                ? this.contactsInput
                : this.fb.group({
                    contactsRows: this.fb.array([
                        this.fb.group({
                            firstName: new FormControl(
                                {
                                    value: null,
                                    disabled: false
                                },
                                {
                                    validators: [Validators.required]
                                }
                            ),
                            lastName: new FormControl(
                                {
                                    value: null,
                                    disabled: false
                                },
                                !this.isModal
                                    ? {
                                        updateOn: !this.isModal ? 'blur' : 'change'
                                    }
                                    : {
                                        validators: [Validators.required],
                                        updateOn: !this.isModal ? 'blur' : 'change'
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
                                    updateOn: !this.isModal ? 'blur' : 'change'
                                }
                            ),
                            phoneNum: new FormControl(
                                {
                                    value: null,
                                    disabled: false
                                },
                                !this.isModal
                                    ? {
                                        validators: [
                                            Validators.required,
                                            ValidatorsFactory.cellNumberValidatorIL,
                                            this.forbiddenCellPhoneAndPhoneExistValidator()
                                        ],
                                        updateOn: !this.isModal ? 'blur' : 'change'
                                    }
                                    : {}
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
                                    updateOn: !this.isModal ? 'blur' : 'change'
                                }
                            ),
                            position: new FormControl(
                                {
                                    value: null,
                                    disabled: false
                                },
                                !this.isModal
                                    ? {
                                        updateOn: !this.isModal ? 'blur' : 'change'
                                    }
                                    : {}
                            ),
                            joinApp: this.fb.control(false),
                            companyContactId: null,
                            agreementConfirmationDate: null,
                            agreementSendDate: null,
                            companyId: null
                        })
                    ])
                });

            // this.sharedService.contacts({
            //     'uuid': this.isModal.companyId,
            // }).subscribe((response:any) => {
            //     const responseRest = (response) ? response['body'] : response;
            //
            //     // console.log(responseRest);
            //     responseRest.forEach((row) => {
            //         this.arr.push(this.fb.group(
            //             {
            //                 firstName: new FormControl({
            //                     value: row.firstName,
            //                     disabled: false
            //                 }, {
            //                     validators: [Validators.required]
            //                 }),
            //                 lastName: new FormControl({
            //                     value: row.lastName,
            //                     disabled: false
            //                 }, {
            //                     updateOn: !this.isModal ? 'blur' : 'change'
            //                 }),
            //                 cellPhone: new FormControl({
            //                     value: row.cellPhone,
            //                     disabled: false
            //                 }, {
            //                     validators: [Validators.required, ValidatorsFactory.cellNumberValidatorIL],
            //                     updateOn: !this.isModal ? 'blur' : 'change'
            //                 }),
            //                 phoneNum: new FormControl({
            //                     value: row.phoneNum,
            //                     disabled: false
            //                 }, {
            //                     validators: [Validators.required, ValidatorsFactory.cellNumberValidatorIL],
            //                     updateOn: !this.isModal ? 'blur' : 'change'
            //                 }),
            //                 email: new FormControl({
            //                     value: row.email,
            //                     disabled: false
            //                 }, {
            //                     validators: [Validators.required, ValidatorsFactory.emailExtended],
            //                     updateOn: !this.isModal ? 'blur' : 'change'
            //                 }),
            //                 position: new FormControl({
            //                     value: row.position,
            //                     disabled: false
            //                 }, {
            //                     updateOn: !this.isModal ? 'blur' : 'change'
            //                 }),
            //                 joinApp: this.fb.control({
            //                     value: false,
            //                 }),
            //                 companyContactId: row.companyContactId,
            //                 companyId: row.companyId
            //             }
            //         ));
            //     });
            //     this.loader = false;
            //
            // });

            this.loader = false;
        }
    }


    trackById(index: number, val: any): any {
        return val.companyContactId + '_' + index;
    }

    startChild(): void {
        console.log('ContactsComponent');
    }

    // updateValues(param: string, val: any) {
    //     const pbj = {};
    //     pbj[param] = val;
    //     this.contacts.patchValue(pbj);
    //     this.updateContact(any);
    // }
    activeRowClick() {
        if (!this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit = this.renderer.listen(
                'document',
                'click',
                ($event) => {
                    if (this.activeRow === null) {
                        this.globalListenerWhenInEdit();
                        this.globalListenerWhenInEdit = null;
                        return;
                    }
                    //   console.log('details row listener called');
                    const eventPath = BrowserService.pathFrom($event);
                    console.log('Checking if should terminate edit: %o', eventPath);
                    const shouldTerminateEdit =
                        !eventPath[0].id.includes('idRow_') &&
                        !eventPath.some((node) => node.id && node.id.includes('idRow_'));
                    if (shouldTerminateEdit) {
                        console.log('Terminating edit (clicked on : %o)', eventPath);
                        this.activeRow = null;
                        if (this.globalListenerWhenInEdit) {
                            this.globalListenerWhenInEdit();
                            this.globalListenerWhenInEdit = null;
                        }
                    }
                }
            );
        }
    }

    forbiddenMailExistValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isEmailExist = this.arr.controls.filter(
                (it) =>
                    it['controls'] &&
                    it['controls'].email.value &&
                    it['controls'].email.value === control.value
            );
            return isEmailExist && isEmailExist.length > 1
                ? {forbiddenMail: {value: control.value}}
                : null;
        };
    }

    forbiddenCellPhoneExistValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isEmailExist = this.arr.controls.filter(
                (it) =>
                    it['controls'] &&
                    it['controls'].cellPhone.value &&
                    it['controls'].cellPhone.value === control.value
            );
            const isPhoneNumExist = this.arr.controls.filter(
                (it) =>
                    it['controls'] &&
                    it['controls'].phoneNum.value &&
                    it['controls'].phoneNum.value === control.value
            );
            return (isEmailExist && isEmailExist.length > 1 || isPhoneNumExist && isPhoneNumExist.length)
                ? {forbiddenCellPhone: {value: control.value}}
                : null;
        };
    }

    forbiddenCellPhoneAndPhoneExistValidator(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isCellPhoneExist = this.arr.controls.filter(
                (it) =>
                    it['controls'] &&
                    it['controls'].cellPhone.value &&
                    it['controls'].cellPhone.value === control.value
            );
            const isPhoneNumExist = this.arr.controls.filter(
                (it) =>
                    it['controls'] &&
                    it['controls'].phoneNum.value &&
                    it['controls'].phoneNum.value === control.value
            );

            return (isPhoneNumExist && isPhoneNumExist.length > 1 || isCellPhoneExist && isCellPhoneExist.length)
                ? {forbiddenCellPhone: {value: control.value}}
                : null;
        };
    }

    forbiddenMailExistValidatorModal(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isEmailExist = this.arr.controls.filter(
                (it) =>
                    it['controls'] &&
                    it['controls'].email.value &&
                    it['controls'].email.value === control.value
            );
            return isEmailExist && isEmailExist.length > 0
                ? {forbiddenMail: {value: control.value}}
                : null;
        };
    }

    forbiddenCellPhoneExistValidatorModal(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            if (!control.value || control.value === '') {
                return null;
            }
            const isEmailExist = this.arr.controls.filter(
                (it) =>
                    it['controls'] &&
                    it['controls'].cellPhone.value &&
                    it['controls'].cellPhone.value === control.value
            );
            return isEmailExist && isEmailExist.length > 0
                ? {forbiddenCellPhone: {value: control.value}}
                : null;
        };
    }

    updateContactMail(contact: any) {
        if (
            !contact.get('email').hasError('forbiddenMail') &&
            !contact.get('cellPhone').hasError('forbiddenCellPhone')
        ) {
            this.updateContact(contact);
        }
    }

    updateContact(contact: any, i?: any) {
        // if (this.contacts.invalid) {
        //     BrowserService.flattenControls(this.contacts).forEach(ac => ac.markAsDirty());
        //     return;
        // }
        const authorizedSigner = contact.get('authorizedSigner').value;
        if (!authorizedSigner && i !== undefined) {
            this.arr.controls[i].patchValue({
                companyContactIdsMark: false
            });
        }

        console.log('params: ', contact.value, contact.touched);
        if (!this.isModal) {
            if (contact.touched) {
                if (
                    contact.get('firstName').value &&
                    contact.get('lastName').value &&
                    contact.get('email').value &&
                    !contact.get('email').invalid &&
                    contact.get('cellPhone').value &&
                    !contact.get('cellPhone').invalid &&
                    ((contact.get('phoneNum').value && !contact.get('phoneNum').invalid) || !contact.get('phoneNum').value)
                ) {
                    if (contact.value.companyContactId) {
                        const params = {
                            companyContactId: contact.value.companyContactId,
                            companyId: contact.value.companyId,
                            firstName: contact.get('firstName').value,
                            authorizedSigner: contact.get('authorizedSigner').value
                        };
                        if (!contact.get('cellPhone').invalid) {
                            params['cellPhone'] = contact.get('cellPhone').value || null;
                        } else if (
                            contact.get('cellPhone').invalid &&
                            contact.get('cellPhone').value === ''
                        ) {
                            params['cellPhone'] = null;
                        }
                        if (!contact.get('email').invalid) {
                            params['email'] = contact.get('email').value || null;
                        } else if (
                            contact.get('email').invalid &&
                            contact.get('email').value === ''
                        ) {
                            params['email'] = null;
                        }
                        if (!contact.get('lastName').invalid) {
                            params['lastName'] = contact.get('lastName').value || null;
                        }
                        if (!contact.get('phoneNum').invalid) {
                            params['phoneNum'] = contact.get('phoneNum').value || null;
                        } else if (
                            contact.get('phoneNum').invalid &&
                            contact.get('phoneNum').value === ''
                        ) {
                            params['phoneNum'] = null;
                        }
                        if (!contact.get('position').invalid) {
                            params['position'] = contact.get('position').value || null;
                        }
                        this.sharedService.updateContact(params).subscribe(() => {
                            this.reload();
                        });
                    } else {
                        const params = {
                            companyId: this.isModalFromCompaniesScreen
                                ? this.isModalFromCompaniesScreen.companyId
                                : this.userService.appData.userData.companySelect.companyId,
                            firstName: contact.get('firstName').value,
                            authorizedSigner: contact.get('authorizedSigner').value
                        };
                        if (!contact.get('cellPhone').invalid) {
                            params['cellPhone'] = contact.get('cellPhone').value || null;
                        } else if (
                            contact.get('cellPhone').invalid &&
                            contact.get('cellPhone').value === ''
                        ) {
                            params['cellPhone'] = null;
                        }
                        if (!contact.get('email').invalid) {
                            params['email'] = contact.get('email').value || null;
                        } else if (
                            contact.get('email').invalid &&
                            contact.get('email').value === ''
                        ) {
                            params['email'] = null;
                        }
                        if (!contact.get('lastName').invalid) {
                            params['lastName'] = contact.get('lastName').value || null;
                        }
                        if (!contact.get('phoneNum').invalid) {
                            params['phoneNum'] = contact.get('phoneNum').value || null;
                        } else if (
                            contact.get('phoneNum').invalid &&
                            contact.get('phoneNum').value === ''
                        ) {
                            params['phoneNum'] = null;
                        }
                        if (!contact.get('position').invalid) {
                            params['position'] = contact.get('position').value || null;
                        }
                        this.sharedService.addContact(params).subscribe((response: any) => {
                            const responseRest = response ? response['body'] : response;
                            contact.patchValue({
                                companyContactId: responseRest.companyContactId,
                                companyId: responseRest.companyId,
                                firstName: responseRest.firstName
                            });
                        });
                    }
                }
            }
        }
    }

    addContact() {
        this.userService.appData.addContactModal = {
            company: this.isModalFromCompaniesScreen
                ? this.isModalFromCompaniesScreen
                : !this.isModal
                    ? this.userService.appData.userData.companySelect
                    : this.isModal,
            contacts: this.arr,
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
                                this.forbiddenCellPhoneExistValidatorModal()
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
                            this.forbiddenMailExistValidatorModal()
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
                agreementConfirmationDate: null,
                agreementSendDate: null,
                companyContactId: null
            })
        };
        // this.arr.push(this.fb.group(
        //     {
        //         firstName: new FormControl({
        //             value: null,
        //             disabled: false
        //         }, {
        //             validators: [Validators.required]
        //         }),
        //         lastName: new FormControl({
        //             value: null,
        //             disabled: false
        //         }, (!this.isModal ? {
        //             updateOn: !this.isModal ? 'blur' : 'change'
        //         } : {
        //             validators: [Validators.required],
        //             updateOn: !this.isModal ? 'blur' : 'change'
        //         })),
        //         cellPhone: new FormControl({
        //             value: null,
        //             disabled: false
        //         }, {
        //             validators: [Validators.required, ValidatorsFactory.cellNumberValidatorIL],
        //             updateOn: !this.isModal ? 'blur' : 'change'
        //         }),
        //         phoneNum: new FormControl({
        //                 value: null,
        //                 disabled: false
        //             },
        //             (!this.isModal && !this.isModalFromCompaniesScreen ? {
        //                 validators: [Validators.required, ValidatorsFactory.cellNumberValidatorIL],
        //                 updateOn: !this.isModal ? 'blur' : 'change'
        //             } : {})),
        //         email: new FormControl({
        //             value: null,
        //             disabled: false
        //         }, {
        //             validators: [Validators.required, ValidatorsFactory.emailExtended, this.forbiddenMailExistValidator()],
        //             updateOn: !this.isModal ? 'blur' : 'change'
        //         }),
        //         position: new FormControl({
        //                 value: null,
        //                 disabled: false
        //             },
        //             (!this.isModal && !this.isModalFromCompaniesScreen ? {
        //                 updateOn: !this.isModal ? 'blur' : 'change'
        //             } : {})
        //         ),
        //         companyContactIdsMark: this.fb.control(false),
        //         joinApp: this.fb.control(false),
        //         authorizedSigner: this.fb.control(false),
        //         companyContactId: null,
        //         companyId: null
        //     }
        // ));
        // this.activeRow = this.arr.controls.length - 1;
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

    deleteContact(index: number, contact: any) {
        this.activeRow = null;
        this.activeRowClick();
        if (!this.isModal) {
            if (contact.get('joinApp').value) {
                this.deleteContactModal = {
                    index,
                    contact
                };
            } else {
                const companyContactId = contact.value.companyContactId;
                // this.arr.removeAt(index);
                // const value = this.arr.value;
                // this.arr.patchValue(
                //     value
                //         .slice(0, index)
                //         .concat(value.slice(index + 1))
                //         .concat(value[index])
                // );
                // this.arr.removeAt(value.length - 1);
                // this.arr.updateValueAndValidity();
                // this.arr.removeAt(index);
                const value = this.arr.value;
                while (this.arr.length - 1 > index) {
                    const center = this.arr.controls[index + 1].value;
                    this.arr.controls[index + 1].patchValue(this.arr.controls[index].value);
                    this.arr.controls[index].patchValue(center);
                    index++;
                }
                this.arr.removeAt(value.length - 1);
                this.arr.updateValueAndValidity();
                if (companyContactId) {
                    this.sharedService
                        .deleteContact({
                            uuid: companyContactId
                        })
                        .subscribe(() => {
                        });
                }
            }
        } else {
            // this.arr.removeAt(index);
            const value = this.arr.value;
            while (this.arr.length - 1 > index) {
                const center = this.arr.controls[index + 1].value;
                this.arr.controls[index + 1].patchValue(this.arr.controls[index].value);
                this.arr.controls[index].patchValue(center);
                index++;
            }
            this.arr.removeAt(value.length - 1);
            this.arr.updateValueAndValidity();
        }
    }

    deleteContactFromModal(index: number, contact: any) {
        this.deleteContactModal = false;
        const companyContactId = contact.value.companyContactId;
        // this.arr.removeAt(index);
        const value = this.arr.value;
        while (this.arr.length - 1 > index) {
            const center = this.arr.controls[index + 1].value;
            this.arr.controls[index + 1].patchValue(this.arr.controls[index].value);
            this.arr.controls[index].patchValue(center);
            index++;
        }
        this.arr.removeAt(value.length - 1);
        this.arr.updateValueAndValidity();
        if (companyContactId) {
            this.sharedService
                .deleteContact({
                    uuid: companyContactId
                })
                .subscribe(() => {
                });
        }
    }

    joinAppContact(contact: any) {
        if (!this.isModal) {
            if (contact.get('joinApp').value) {
                contact.get('email').disable();
                const supplierJournalItem = !this.isModal
                    ? this.isModalFromCompaniesScreen
                        ? this.isModalFromCompaniesScreen.supplierJournalItem
                        : this.userService.appData.userData.companySelect
                            .supplierJournalItem
                    : this.isModal.supplierJournalItem;
                this.joinAppContactModal = {
                    supplierJournalItem: supplierJournalItem === true,
                    join: true,
                    contact: contact
                };
                this.contactSaved = {
                    contact: contact
                };
            } else {
                contact.get('email').enable();
                this.joinAppContactModal = {
                    join: false,
                    contact: contact
                };
                this.contactSaved = {
                    contact: contact
                };
            }
        }
    }

    sendLandingPageMessages() {
        const companyContactIdList = this.arr.controls
            .filter(
                (it) =>
                    it['controls'].companyContactId.value &&
                    it['controls'].companyContactIdsMark.value &&
                    it['controls'] &&
                    it['controls'].email.value &&
                    !it['controls'].email.invalid &&
                    it['controls'].cellPhone.value &&
                    !it['controls'].cellPhone.invalid
            )
            .map((v) => v['controls'].companyContactId.value);
        if (companyContactIdList.length) {
            // const companyContactIdList = this.arr.value.filter(it => it.companyContactId && it.companyContactIdsMark && it.email && it.cellPhone).map(v => v.companyContactId);
            this.sharedService
                .sendLandingPageMessages(companyContactIdList)
                .subscribe(() => {
                    this.userService.appData.submitAlertContact = true;
                    setTimeout(() => {
                        this.userService.appData.submitAlertContact = false;
                    }, 3000);
                });
        }
    }

    joinAppContactFromModal(contact: any) {
        if (!this.joinAppContactModal.join) {
            if (contact.value.companyContactId) {
                this.sharedService
                    .cancelAppContact({
                        uuid: contact.value.companyContactId
                    })
                    .subscribe(() => {
                    });
            }
        } else {
            if (
                this.joinAppContactModal.join &&
                !this.joinAppContactModal['supplierJournalItem']
            ) {
                // this.storageService.sessionStorageSetter('backTo', 'contacts');
                this.router.navigate(
                    ['/accountants/companies/companyProducts/addProducts'],
                    {
                        queryParamsHandling: 'preserve',
                        relativeTo: this.route
                    }
                );
            }
            if (
                this.joinAppContactModal.join &&
                this.joinAppContactModal['supplierJournalItem']
            ) {
                if (contact.value.companyContactId) {
                    this.sharedService
                        .joinAppContact({
                            uuid: contact.value.companyContactId
                        })
                        .subscribe(() => {
                        });
                }
            }
        }
        this.joinAppContactModal = false;
    }

    joinAppContactModalClose(contact: any) {
        contact.patchValue({
            joinApp: !contact.get('joinApp').value
        });
        if (contact.get('joinApp').value) {
            contact.get('email').disable();
        } else {
            contact.get('email').enable();
        }
        this.joinAppContactModal = false;
        this.contactSaved = false;
    }

    authorizedSignerContact(contact: any, i?: any) {
        if (contact.get('authorizedSigner').value) {
            this.authorizedSignerContactModal = {
                authorizedSigner: true,
                contact: contact,
                i: i
            };
            this.contactSaved = {
                contact: contact
            };
        } else {
            this.updateContact(contact, i);
            // this.authorizedSignerContactModal = {
            //     authorizedSigner: false,
            //     contact: contact
            // };
            // this.contactSaved = {
            //     contact: contact
            // };
        }

        // this.updateContact(contact, i);
    }

    authorizedSignerContactModalClose(contact: any) {
        contact.patchValue({
            authorizedSigner: !contact.get('authorizedSigner').value
        });
        this.authorizedSignerContactModal = false;
        this.contactSaved = false;
    }

    authorizedSignerContactFromModal(param: any) {
        this.sharedService
            .sendLandingPageMessages([
                this.authorizedSignerContactModal.contact.value.companyContactId
            ])
            .subscribe(() => {
                this.userService.appData.submitAlertContact = true;
                setTimeout(() => {
                    this.userService.appData.submitAlertContact = false;
                }, 3000);
            });
        setTimeout(() => {
            this.updateContact(
                this.authorizedSignerContactModal.contact,
                this.authorizedSignerContactModal.i
            );
            this.authorizedSignerContactModal = false;
        }, 1000);
    }

    ngOnDestroy(): void {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
        }
        if (this.subscriptionReloadContacts) {
            this.subscriptionReloadContacts.unsubscribe();
        }
        this.destroy();
    }
}
