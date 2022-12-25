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
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {Observable, Subject} from 'rxjs';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './details.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class DetailsComponent
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
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        private filterPipe: FilterPipe,
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

        this.info = new FormGroup({
            // contactMail: new FormControl('', ValidatorsFactory.emailExtended),
            // billingAccountPhone: new FormControl('', [
            //     Validators.minLength(10),
            //     Validators.maxLength(11),
            //     ValidatorsFactory.cellNumberValidatorIL
            // ]),
            companyName: new FormControl({
                value: '',
                disabled: true
            }),
            englishCompanyName: new FormControl({
                value: '',
                disabled: true
            }),
            street: new FormControl({
                value: '',
                disabled: false
            }),
            cityId: new FormControl({
                value: '',
                disabled: false
            }),
            companyHp: new FormControl(
                {
                    value: '',
                    disabled: true
                },
                [
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            tikNikuim: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [Validators.pattern('\\d+')]
            ),
            osekNum: new FormControl(
                {
                    value: '',
                    disabled: true
                },
                [
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            eilatOsekNum: new FormControl(
                {
                    value: '',
                    disabled: true
                },
                [
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            primaryBusinessCategoryId: new FormControl({
                value: '',
                disabled: false
            }),
            companyDesc: new FormControl({
                value: '',
                disabled: false
            }),
            otherOseknumArray: new FormArray([
                new FormControl(
                    {
                        value: '',
                        disabled: false
                    },
                    [
                        Validators.maxLength(9),
                        Validators.pattern('\\d+'),
                        ValidatorsFactory.idValidatorIL
                    ]
                )
            ])
        });
    }

    get arr(): FormArray {
        return this.info.get('otherOseknumArray') as FormArray;
    }

    addPriemerObject(arr: any, isExistValue: boolean) {
        if (arr && arr.length && isExistValue) {
            return [
                {
                    businessCategoryDesc: null,
                    businessCategoryId: null,
                    businessCategoryName: 'ביטול בחירה',
                    businessCategoryType: null
                },
                ...arr
            ];
        } else {
            return arr;
        }
    }

    override reload() {
        console.log('reload child');
        this.info = new FormGroup({
            // contactMail: new FormControl('', ValidatorsFactory.emailExtended),
            // billingAccountPhone: new FormControl('', [
            //     Validators.minLength(10),
            //     Validators.maxLength(11),
            //     ValidatorsFactory.cellNumberValidatorIL
            // ]),
            companyName: new FormControl({
                value: '',
                disabled: true
            }),
            englishCompanyName: new FormControl({
                value: '',
                disabled: true
            }),
            street: new FormControl({
                value: '',
                disabled: false
            }),
            cityId: new FormControl({
                value: '',
                disabled: false
            }),
            companyHp: new FormControl(
                {
                    value: '',
                    disabled: true
                },
                [
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            tikNikuim: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [Validators.pattern('\\d+')]
            ),
            osekNum: new FormControl(
                {
                    value: '',
                    disabled: true
                },
                [
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            eilatOsekNum: new FormControl(
                {
                    value: '',
                    disabled: true
                },
                [
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            ),
            primaryBusinessCategoryId: new FormControl({
                value: '',
                disabled: false
            }),
            companyDesc: new FormControl({
                value: '',
                disabled: false
            }),
            otherOseknumArray: new FormArray([
                new FormControl(
                    {
                        value: '',
                        disabled: false
                    },
                    [
                        Validators.maxLength(9),
                        Validators.pattern('\\d+'),
                        ValidatorsFactory.idValidatorIL
                    ]
                )
            ])
        });
        this.ngOnInit();
    }

    ngOnInit(): void {
        this.exist = {
            exists: false,
            originalCompanyName: null
        };
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
                this.sharedService
                    .details({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .subscribe((response: any) => {
                        const responseRest = response ? response['body'] : response;
                        responseRest.otherOseknumArray = [
                            responseRest.otherOseknum1,
                            responseRest.otherOseknum2,
                            responseRest.otherOseknum3
                        ];
                        responseRest.otherOseknumArray =
                            responseRest.otherOseknumArray.filter((it) => it !== null);
                        this.originalData = responseRest;
                        this.info.patchValue({
                            companyName: responseRest.companyName,
                            englishCompanyName: responseRest.englishCompanyName,
                            street: responseRest.street,
                            companyHp: responseRest.companyHp,
                            tikNikuim: responseRest.tikNikuim,
                            osekNum: responseRest.osekNum,
                            eilatOsekNum: responseRest.eilatOsekNum,
                            companyDesc: responseRest.companyDesc
                        });
                        responseRest.otherOseknumArray.forEach((cur, idx) => {
                            // @ts-ignore
                            if (idx === 0) {
                                this.arr.controls[0].patchValue(cur);
                            } else {
                                if (cur) {
                                    this.arr.push(
                                        new FormControl(
                                            {
                                                value: cur,
                                                disabled: false
                                            },
                                            [
                                                Validators.maxLength(9),
                                                Validators.pattern('\\d+'),
                                                ValidatorsFactory.idValidatorIL
                                            ]
                                        )
                                    );
                                }
                            }
                        });
                        console.log(this.arr);

                        if (responseRest.manager) {
                            this.info.get('companyName').enable();
                            this.info.get('englishCompanyName').enable();
                            this.info.get('companyHp').enable();
                            this.info.get('osekNum').enable();
                            this.info.get('eilatOsekNum').enable();
                        }
                        this.sharedService.getCities().subscribe((cities) => {
                            this.info.patchValue({
                                cityId: responseRest.cityId
                                    ? cities.body.find(
                                        (cty) => cty.cityId === responseRest.cityId
                                    )
                                    : ''
                            });
                        });

                        this.sharedService
                            .getBusinessCategory()
                            .subscribe((businessCategory) => {
                                this.businessCategoryArrSaved = businessCategory.body;
                                this.info.patchValue({
                                    primaryBusinessCategoryId:
                                        responseRest.primaryBusinessCategoryId
                                            ? businessCategory.body.find(
                                                (cty) =>
                                                    cty.businessCategoryId ===
                                                    responseRest.primaryBusinessCategoryId
                                            )
                                            : ''
                                });
                                this.businessCategoryArr = this.addPriemerObject(
                                    this.businessCategoryArrSaved,
                                    this.info.get('primaryBusinessCategoryId').value &&
                                    this.info.get('primaryBusinessCategoryId').value
                                        .businessCategoryId
                                );
                            });
                    });
            });
    }

    addOtherOsekNum() {
        this.arr.push(
            new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [
                    Validators.maxLength(9),
                    Validators.pattern('\\d+'),
                    ValidatorsFactory.idValidatorIL
                ]
            )
        );
    }

    deleteItem(index: number) {
        const value = this.arr.value;
        this.arr.patchValue(
            value
                .slice(0, index)
                .concat(value.slice(index + 1))
                .concat(value[index])
        );
        this.arr.removeAt(value.length - 1);
        this.arr.updateValueAndValidity();
        this.updateCompany();
    }

    getDetails() {
        this.sharedService
            .details({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                const responseRest = response ? response['body'] : response;
                responseRest.otherOseknumArray = [
                    responseRest.otherOseknum1,
                    responseRest.otherOseknum2,
                    responseRest.otherOseknum3
                ];
                responseRest.otherOseknumArray = responseRest.otherOseknumArray.filter(
                    (it) => it !== null
                );
                this.originalData = responseRest;
                this.info.patchValue({
                    companyName: responseRest.companyName,
                    englishCompanyName: responseRest.englishCompanyName,
                    street: responseRest.street,
                    companyHp: responseRest.companyHp,
                    tikNikuim: responseRest.tikNikuim,
                    osekNum: responseRest.osekNum,
                    eilatOsekNum: responseRest.eilatOsekNum,
                    companyDesc: responseRest.companyDesc
                });
                responseRest.otherOseknumArray.forEach((cur, idx) => {
                    // @ts-ignore
                    if (idx === 0) {
                        this.arr.controls[0].patchValue(cur);
                    } else {
                        if (cur) {
                            this.arr.push(
                                new FormControl(
                                    {
                                        value: cur,
                                        disabled: false
                                    },
                                    [
                                        Validators.maxLength(9),
                                        Validators.pattern('\\d+'),
                                        ValidatorsFactory.idValidatorIL
                                    ]
                                )
                            );
                        }
                    }
                });
                console.log(this.arr);
            });
    }

    startChild(): void {
        this.exist = {
            exists: false,
            originalCompanyName: null
        };
        console.log('BankAndCreditComponent');
    }

    updateValues(param: string, val: string) {
        this.exist = {
            exists: false,
            originalCompanyName: null
        };
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
        this.updateCompany();
    }

    updateCompany() {
        // if (this.info.invalid) {
        //     const form_controls = Object.values(this.info.controls);
        //     const valuesInvalidExist = form_controls.some(fd => fd.invalid && fd.value !== null);
        //     if (valuesInvalidExist) {
        //         BrowserService.flattenControls(this.info).forEach(ac => ac.markAsDirty());
        //         return;
        //     }
        // }

        const companyId = this.userService.appData.userData.companySelect.companyId;
        // if (this.info.get('companyName').value !== this.userService.appData.userData.companySelect.companyName) {
        //     this.userService.appData.userData.companySelect.companyName = this.info.get('companyName').value;
        //     this.userService.appData.userData.companies.find(it => it.companyId === this.userService.appData.userData.companySelect.companyId).companyName = this.userService.appData.userData.companySelect.companyName;
        //     this.sharedComponent.setNameOfCompany(this.userService.appData.userData.companySelect, this.userService.appData.userData.companies);
        // }

        const params = {
            companyId: companyId
        };
        if (this.info.get('cityId').value && this.info.get('cityId').value.cityId) {
            params['cityId'] = this.info.get('cityId').value.cityId;
        }
        if (!this.info.get('companyDesc').invalid) {
            params['companyDesc'] = this.info.get('companyDesc').value || null;
        }
        if (!this.info.get('companyHp').invalid) {
            params['companyHp'] = this.info.get('companyHp').value || null;
        } else if (
            this.info.get('companyHp').invalid &&
            this.info.get('companyHp').value === ''
        ) {
            params['companyHp'] = null;
        }
        if (!this.info.get('companyName').invalid) {
            params['companyName'] = this.info.get('companyName').value || null;
        }
        if (!this.info.get('eilatOsekNum').invalid) {
            params['eilatOsekNum'] = this.info.get('eilatOsekNum').value || null;
        } else if (
            this.info.get('eilatOsekNum').invalid &&
            this.info.get('eilatOsekNum').value === ''
        ) {
            params['eilatOsekNum'] = null;
        }
        if (!this.info.get('englishCompanyName').invalid) {
            params['englishCompanyName'] =
                this.info.get('englishCompanyName').value || null;
        }
        if (!this.info.get('osekNum').invalid) {
            params['osekNum'] = this.info.get('osekNum').value || null;
        } else if (
            this.info.get('osekNum').invalid &&
            this.info.get('osekNum').value === ''
        ) {
            params['osekNum'] = null;
        }
        if (
            this.info.get('primaryBusinessCategoryId').value &&
            this.info.get('primaryBusinessCategoryId').value.businessCategoryId
        ) {
            params['primaryBusinessCategoryId'] = this.info.get(
                'primaryBusinessCategoryId'
            ).value.businessCategoryId;
        } else {
            params['primaryBusinessCategoryId'] = null;
        }
        if (!this.info.get('street').invalid) {
            params['street'] = this.info.get('street').value || null;
        }
        if (!this.info.get('tikNikuim').invalid) {
            params['tikNikuim'] = this.info.get('tikNikuim').value || null;
        } else if (
            this.info.get('tikNikuim').invalid &&
            this.info.get('tikNikuim').value === ''
        ) {
            params['tikNikuim'] = null;
        }
        // params['otherOseknumArray'] = [];

        const otherOseknumArray = [];
        const values = this.arr.value;
        if (values && values.length) {
            this.arr.controls.forEach((it, idx) => {
                // const control = this.arr.controls[idx];
                const value = it.value;
                const invalid = it.invalid;
                if (
                    !invalid &&
                    value !== '' &&
                    value.toString() !== params['companyHp'].toString() &&
                    value.toString() !== params['osekNum'].toString() &&
                    !this.arr.controls.some(
                        (val, index) =>
                            index !== idx && val.value.toString() === value.toString()
                    )
                ) {
                    // const obj = {
                    //     delete: false
                    // };
                    // obj['otherOseknum'] = it.oseknum;
                    // obj['orderId'] = it.orderId;
                    otherOseknumArray.push(Number(value));
                }
            });

            // if (this.originalData.otherOseknumArray && this.originalData.otherOseknumArray.length) {
            //     this.originalData.otherOseknumArray.forEach((it, idx) => {
            //         if (!params['otherOseknumArray'].some(item => item === it) && it !== null) {
            //             // const obj = {
            //             //     delete: true
            //             // };
            //             // obj['orderId'] = it.orderId;
            //             // obj['otherOseknum'] = it.oseknum;
            //             params['otherOseknumArray'].push(null);
            //         }
            //     });
            // }

            // if (params['otherOseknumArray'].length) {
            //     params['otherOseknumArray'].sort((x, y) => x.orderId - y.orderId);
            //     params['otherOseknumArray'].forEach(it => {
            //         delete it.orderId;
            //     });
            // }
        }

        for (let idxOsek = 0; idxOsek < 3; idxOsek++) {
            params['otherOseknum' + (idxOsek + 1)] = otherOseknumArray[idxOsek]
                ? otherOseknumArray[idxOsek]
                : null;
        }

        console.log('params: ', params);
        this.businessCategoryArr = this.addPriemerObject(
            this.businessCategoryArrSaved,
            this.info.get('primaryBusinessCategoryId').value &&
            this.info.get('primaryBusinessCategoryId').value.businessCategoryId
        );
        this.sharedService.updateDetails(params).subscribe((res) => {
            this.exist = res.body;
            this.userService.appData.userData.companies = null;
            this.sharedService.getCompanies().subscribe((companies: any) => {
                this.userService.appData.userData.companies = companies.body;
                this.userService.appData.userData.companies.forEach((companyData) => {
                    companyData.METZALEM =
                        this.userService.appData.userData.accountant === false &&
                        (companyData.privs.includes('METZALEM') ||
                            (companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('KSAFIM')) ||
                            (companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('ANHALATHESHBONOT')) ||
                            (companyData.privs.includes('METZALEM') &&
                                companyData.privs.includes('KSAFIM') &&
                                companyData.privs.includes('ANHALATHESHBONOT')));
                    if (companyData.METZALEM) {
                        if (
                            companyData.privs.includes('METZALEM') &&
                            companyData.privs.includes('KSAFIM') &&
                            companyData.privs.includes('ANHALATHESHBONOT')
                        ) {
                            companyData.METZALEM_TYPE = 'KSAFIM_ANHALATHESHBONOT';
                        } else if (
                            companyData.privs.includes('METZALEM') &&
                            companyData.privs.includes('KSAFIM')
                        ) {
                            companyData.METZALEM_TYPE = 'KSAFIM';
                        } else if (
                            companyData.privs.includes('METZALEM') &&
                            companyData.privs.includes('ANHALATHESHBONOT')
                        ) {
                            companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
                        } else if (companyData.privs.includes('METZALEM')) {
                            companyData.METZALEM_TYPE = 'METZALEM';
                        }
                    }
                    companyData.METZALEM_deskTrialExpired =
                        companyData.METZALEM && !companyData.deskTrialExpired;
                });
                const companySelect = this.userService.appData.userData.companies.find(
                    (co) =>
                        co.companyId ===
                        this.userService.appData.userData.companySelect.companyId
                );
                this.sharedComponent.setNameOfCompany(
                    companySelect,
                    this.userService.appData.userData.companies
                );
            });
        });
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
