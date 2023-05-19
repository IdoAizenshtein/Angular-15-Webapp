import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
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
import {AbstractControl, FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {map} from 'rxjs/operators';
import {Observable, of, Subject} from 'rxjs';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {ReloadServices} from '@app/shared/services/reload.services';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {Location} from '@angular/common';

@Component({
    templateUrl: './accounting-firm-establishment.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class AccountingFirmEstablishmentComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public info: any;
    public originalData: any;
    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
    public exist: any = {
        exists: false,
        originalCompanyName: null
    };
    public businessCategoryArrSaved: any = [];
    public businessCategoryArr: any = [];
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        private restCommonService: RestCommonService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        private filterPipe: FilterPipe,
        private http: HttpClient,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public translate: TranslateService,
        private storageService: StorageService,
        private sumPipe: SumPipe,
        private location: Location,
        public snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        public router: Router
    ) {
        super(sharedComponent);

        this.info = new FormGroup({
            accountantFirstName: new FormControl({
                value: '',
                disabled: false
            }, {
                validators: [
                    Validators.required,
                    Validators.maxLength(30)
                ],
                updateOn: 'change'
            }),
            accountantLastName: new FormControl({
                value: '',
                disabled: false
            }, {
                validators: [
                    Validators.required,
                    Validators.maxLength(30)
                ],
                updateOn: 'change'
            }),
            officeName: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                {
                    validators: [
                        Validators.required,
                        Validators.maxLength(30)
                    ],
                    updateOn: 'change'
                }),
            accountantIdentificationNumber: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [
                    Validators.required,
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            officeHp: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                {
                    validators: [
                        Validators.required,
                        Validators.maxLength(9),
                        Validators.pattern('\\d+'),
                        ValidatorsFactory.idValidatorIL
                    ],
                    asyncValidators: this.hpExistValidator.bind(this),
                    updateOn: 'change'
                }
            ),
            accountantMail: new FormControl(
                {
                    value: null,
                    disabled: false
                },
                {
                    validators: [Validators.required, ValidatorsFactory.emailExtended],
                    asyncValidators: this.emailNotExistsValidator.bind(this)
                }
            ),
            officeMail: new FormControl(
                {
                    value: null,
                    disabled: false
                },
                {
                    validators: [
                        Validators.required,
                        ValidatorsFactory.emailExtended
                    ]
                }
            ),
            officePhone: new FormControl('', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(11),
                ValidatorsFactory.cellNumberValidatorIL
            ]),
            accountantCellPhone: new FormControl('', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(11),
                ValidatorsFactory.cellNumberValidatorIL
            ])

        });
    }


    private hpExistValidator(
        fc: AbstractControl
    ): Observable<ValidationErrors | null> {
        if (fc && fc.dirty && fc.value) {
            return this.restCommonService.isExistsHp(fc.value.toString()).pipe(
                map((response: any) => {
                    const isExist = response ? response['body'] : response;
                    return isExist ? {hpExists: true} : null;
                })
            );
        }
        return of(null);
    }

    private emailNotExistsValidator(
        fc: AbstractControl
    ): Observable<ValidationErrors | null> {
        if (fc && fc.dirty && fc.value) {
            return this.restCommonService.mailValidation(fc.value.toString()).pipe(
                map((response: any) => {
                    const isExist = response ? response['body'] : response;
                    return isExist.exist ? isExist : null;
                })
            );
        }

        return of(null);
    }


    override reload() {
        console.log('reload child');
        this.info = new FormGroup({
            accountantFirstName: new FormControl({
                value: '',
                disabled: false
            }, {
                validators: [
                    Validators.required,
                    Validators.maxLength(30)
                ],
                updateOn: 'change'
            }),
            accountantLastName: new FormControl({
                value: '',
                disabled: false
            }, {
                validators: [
                    Validators.required,
                    Validators.maxLength(30)
                ],
                updateOn: 'change'
            }),
            officeName: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                {
                    validators: [
                        Validators.required,
                        Validators.maxLength(30)
                    ],
                    updateOn: 'change'
                }),
            accountantIdentificationNumber: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [
                    Validators.required,
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            officeHp: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                {
                    validators: [
                        Validators.required,
                        Validators.maxLength(9),
                        Validators.pattern('\\d+'),
                        ValidatorsFactory.idValidatorIL
                    ],
                    asyncValidators: this.hpExistValidator.bind(this)
                }
            ),
            accountantMail: new FormControl(
                {
                    value: null,
                    disabled: false
                },
                {
                    validators: [Validators.required, ValidatorsFactory.emailExtended],
                    asyncValidators: this.emailNotExistsValidator.bind(this)
                }
            ),
            officeMail: new FormControl(
                {
                    value: null,
                    disabled: false
                },
                {
                    validators: [
                        Validators.required,
                        ValidatorsFactory.emailExtended
                    ]
                }
            ),
            officePhone: new FormControl('', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(11),
                ValidatorsFactory.cellNumberValidatorIL
            ]),
            accountantCellPhone: new FormControl('', [
                Validators.required,
                Validators.minLength(10),
                Validators.maxLength(11),
                ValidatorsFactory.cellNumberValidatorIL
            ])

        });
        this.ngOnInit();
    }

    ngOnInit(): void {
        console.log('ngOnInit');
        if (this.userService.appData.isAdmin && this.userService.appData.userData && this.userService.appData.userData.biziboxOfficeCreator) {

        } else {
            this.router.navigate(['/accountants/companies'], {
                queryParamsHandling: 'preserve',
                relativeTo: this.route
            });
        }
    }

    createNewOffice() {
        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        const params = {
            officeName: this.info.get('officeName').value,
            officeHp: this.info.get('officeHp').value,
            officePhone: this.info.get('officePhone').value,
            officeMail: this.info.get('officeMail').value,
            accountantFirstName: this.info.get('accountantFirstName').value,
            accountantLastName: this.info.get('accountantLastName').value,
            accountantIdentificationNumber: this.info.get('accountantIdentificationNumber').value,
            accountantCellPhone: this.info.get('accountantCellPhone').value,
            accountantMail: this.info.get('accountantMail').value
        };

        this.sharedService.createNewOffice(params).subscribe((res) => {
            const id = res ? res['body'] : res;
            this.userService.appData.userOnBehalf = {
                id: id,
                name: this.info.get('accountantFirstName').value + ' ' + this.info.get('accountantLastName').value,
                companyToSelect: this.info.get('officeHp').value
            };
            this.storageService.localStorageSetter(
                'userOnBehalf',
                JSON.stringify(this.userService.appData.userOnBehalf)
            );
            window.open(this.location.prepareExternalUrl('accountants/companies'), '_self');
        });
    }

    isDisabled() {
        const form_controls = Object.values(this.info.controls);
        const valuesInvalidExist = form_controls.some(fd => fd['invalid']);
        return valuesInvalidExist;
    }

    handleKeyPress(e) {
        const str = String.fromCharCode(e.which);
        if (!str) {
            return;
        }
        this.isCapsLock = ((): any => {
            const charCode = e.which || e.keyCode;
            let isShift = false;
            if (e.shiftKey) {
                isShift = e.shiftKey;
            } else if (e.modifiers) {
                isShift = !!(e.modifiers & 4);
            }

            if (charCode >= 97 && charCode <= 122 && isShift) {
                return true;
            }
            if (charCode >= 65 && charCode <= 90 && !isShift) {
                return true;
            }

            this.isValidCellPart =
                e.target.id === 'cell' ? /^[\d-]$/.test(str) : null;
            console.log(
                'e.target = %o, e.target.id = %o => %o return %o',
                e.target,
                e.target.id,
                e.target.id === 'cell',
                this.isValidCellPart
            );
            if (this.isValidCellPart === false) {
                e.preventDefault();
                e.stopPropagation();
            }
        })();
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    ngOnDestroy(): void {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        this.destroy();
    }
}
