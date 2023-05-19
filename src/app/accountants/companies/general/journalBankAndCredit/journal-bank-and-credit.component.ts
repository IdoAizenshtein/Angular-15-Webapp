import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ReloadServices} from '@app/shared/services/reload.services';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {GeneralComponent} from '@app/accountants/companies/general/general.component';

@Component({
    selector: 'app-journal-bank-and-credit',
    templateUrl: './journal-bank-and-credit.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class JournalBankAndCreditComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public info: any;
    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
    public modalUpdateValuesExportFileTypeId: any = false;
    @Input() isModal: any = false;
    @Input() infoJournalBankAndCreditComponent: any;
    @Input() hide_bankProcessTransType: any = false;
    @Input() report856: any = false;
    @Input() notExportIncomesInput: any = false;
    public notExportIncomes: any = {
        title: 'בחירה',
        notExportIncomes: [
            {
                name: 'all',
                title: 'כל סוגי התשלום',
                value: false
            },
            {
                name: 'checks',
                title: 'שיקים',
                value: false
            },
            {
                name: 'cash',
                title: 'מזומן',
                value: false
            },
            {
                name: 'credit',
                title: 'כרטיס אשראי',
                value: false
            },
            {
                name: 'slika',
                title: 'סליקה',
                value: false
            },
            {
                name: 'mortgage',
                title: 'משכנתא',
                value: false
            },
            {
                name: 'standingOrder',
                title: 'הוראת קבע',
                value: false
            },
            {
                name: 'bankTransfer',
                title: 'העברה בנקאית',
                value: false
            },
            {
                name: 'other',
                title: 'אחר',
                value: false
            },
            {
                name: 'bankfees',
                title: 'עמלה',
                value: false
            },
            {
                name: 'loans',
                title: 'הלוואה',
                value: false
            },
            {
                name: 'deposits',
                title: 'פיקדון/חסכון',
                value: false
            },
            {
                name: 'bouncedcheck',
                title: 'צ\'ק חוזר',
                value: false
            },
            {
                name: 'directDebit',
                title: 'הרשאה לחיוב חשבון',
                value: false
            }
        ]
    };
    public isReady = false;
    public bookKeepingCustParams: any;
    public izuAsmachtaNumCharArr = [
        {
            label: 'כל הספרות',
            value: '0'
        },
        {
            label: '4 ספרות אחרונות',
            value: '4'
        },
        {
            label: '5 ספרות אחרונות',
            value: '5'
        },
        {
            label: '6 ספרות אחרונות',
            value: '6'
        },
        {
            label: '7 ספרות אחרונות',
            value: '7'
        },
        {
            label: '8 ספרות אחרונות',
            value: '8'
        },
        {
            label: '9 ספרות אחרונות',
            value: '9'
        }
    ];
    public exportFileTypeIdArr = [
        {
            label: 'בנק ואשראי ביחד',
            value: '1'
        },
        {
            label: 'בנק, אשראי - כל אחד בנפרד',
            value: '2'
        }
    ];
    public oppositeCustForChecksArr: any = [];
    public supplierTaxDeductionCustIdArr: any = [];
    public cupaAllTheOptions: boolean = false;
    private readonly destroyed$ = new Subject<void>();

    public currencyListTemp: any = false;
    public currencySetModal: any = false;
    public currencyList: any = [];
    public revaluationCurrCodeArr: any = [];
    public modalBeforeContinue: any = false;
    public selectedCurrency: any = false;
    public type_currencyRates_modal: any;
    currencyRates: any;
    setCurrDef: any = {};
    showPopUpSetRevaluationCurr = false;

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public translate: TranslateService,
        public snackBar: MatSnackBar,
        public router: Router,
        public generalComponent: GeneralComponent
    ) {
        super(sharedComponent);
        this.ocrService.getCurrencyList().subscribe((currencies) => {
            this.currencyList = currencies;
            this.revaluationCurrCodeArr = this.currencyList
                .filter((it) => it.code !== 'ILS')
                .map((cur) => {
                    return {
                        label: cur.code + ' - ' + cur.sign,
                        value: cur.code
                    };
                });
        });
    }

    get arr(): FormArray {
        return this.info.get('currencyRates') as FormArray;
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    setCurrDefFunc(param: any) {
        this.setCurrDef[param] = this.info.get(param).value;
    }

    ngOnInit(): void {
        if (this.isModal && this.notExportIncomesInput) {
            this.notExportIncomes = this.notExportIncomesInput;
        }
        if (this.isModal && this.infoJournalBankAndCreditComponent) {
            if (this.report856 && this.hide_bankProcessTransType) {
                this.infoJournalBankAndCreditComponent
                    .get('supplierTaxDeductionCustId')
                    .setValidators([Validators.required]);
            } else {
                if (
                    this.infoJournalBankAndCreditComponent.get(
                        'supplierTaxDeductionCustId'
                    )
                ) {
                    this.infoJournalBankAndCreditComponent
                        .get('supplierTaxDeductionCustId')
                        .setValidators(null);
                }
            }
            if (
                this.infoJournalBankAndCreditComponent.get('supplierTaxDeductionCustId')
            ) {
                this.infoJournalBankAndCreditComponent
                    .get('supplierTaxDeductionCustId')
                    .updateValueAndValidity();
            }
        }

        this.info =
            this.isModal && this.infoJournalBankAndCreditComponent
                ? this.infoJournalBankAndCreditComponent
                : new FormGroup(
                    Object.assign(
                        {
                            bankAsmachtaNumChar: new FormControl({
                                value: '0',
                                disabled: !this.isModal
                            }),
                            exportFileTypeId: new FormControl({
                                value: '1',
                                disabled: !this.isModal
                            }),
                            exportFileBankPeriod: new FormControl({
                                value: '1',
                                disabled: !this.isModal
                            }),
                            bankAutoJournalTrans: new FormControl({
                                value: true,
                                disabled: false
                            }),
                            uniteJournalForPayments: new FormControl({
                                value: false,
                                disabled: false
                            }),
                            oppositeCustForChecks: new FormControl({
                                value: null,
                                disabled: false
                            }),
                            supplierTaxDeductionCustId: new FormControl(
                                {
                                    value: '',
                                    disabled: false
                                },
                                this.isModal &&
                                this.report856 &&
                                this.hide_bankProcessTransType
                                    ? {
                                        validators: [Validators.required]
                                    }
                                    : {}
                            ),
                            revaluationCurr: new FormControl({
                                value: false,
                                disabled: false
                            }),
                            revaluationCurrCode: new FormControl({
                                value: 'USD',
                                disabled: false
                            }),
                            currencyRates: new FormArray([
                                new FormGroup({
                                    EUR: new FormGroup({
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
                                        }),
                                        delete: new FormControl({
                                            value: false,
                                            disabled: false
                                        }),
                                        bankIsrael: new FormControl({
                                            value: true,
                                            disabled: false
                                        })
                                    })
                                }),
                                new FormGroup({
                                    USD: new FormGroup({
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
                                        }),
                                        delete: new FormControl({
                                            value: false,
                                            disabled: false
                                        }),
                                        bankIsrael: new FormControl({
                                            value: true,
                                            disabled: false
                                        })
                                    })
                                })
                            ])
                        },
                        this.hide_bankProcessTransType
                            ? {}
                            : {
                                bankProcessTransType: new FormControl({
                                    value: '',
                                    disabled: false
                                })
                            }
                    )
                );

        if (!this.isModal) {
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
                        .bankJournal({
                            uuid: this.userService.appData.userData.companySelect.companyId
                        })
                        .subscribe((response: any) => {
                            this.isReady = true;
                            const responseRest = response ? response['body'] : response;
                            this.currencyRates = responseRest.currencyRates;

                            this.info.patchValue({
                                revaluationCurr:
                                    responseRest.revaluationCurr !== null
                                        ? responseRest.revaluationCurr
                                        : false,
                                revaluationCurrCode: responseRest.revaluationCurrCode
                                    ? responseRest.revaluationCurrCode
                                    : 'USD'
                            });
                            responseRest.currencyRates.forEach((cur) => {
                                let bankIsrael = true;
                                const isMatchCode = this.currencyList.find(
                                    (it) => it.code === cur.code
                                );
                                if (isMatchCode) {
                                    bankIsrael = isMatchCode.bankIsrael;
                                }
                                // @ts-ignore
                                const isCodeExist = this.arr.controls.find((it) =>
                                    it.get(cur.code)
                                );
                                if (isCodeExist) {
                                    isCodeExist.get(cur.code).patchValue({
                                        type: bankIsrael ? cur.type : 'FIXED',
                                        fixedRate: cur.fixedRate,
                                        hashCodeId: cur.hashCodeId || '',
                                        delete: false,
                                        bankIsrael: bankIsrael
                                    });
                                } else {
                                    this.arr.push(
                                        new FormGroup({
                                            [cur.code]: new FormGroup({
                                                type: new FormControl({
                                                    value: bankIsrael ? cur.type : 'FIXED',
                                                    disabled: false
                                                }),
                                                fixedRate: new FormControl({
                                                    value: cur.fixedRate,
                                                    disabled: false
                                                }),
                                                hashCodeId: new FormControl({
                                                    value: cur.hashCodeId || '',
                                                    disabled: false
                                                }),
                                                bankIsrael: new FormControl({
                                                    value: bankIsrael,
                                                    disabled: false
                                                }),
                                                delete: new FormControl({
                                                    value: false,
                                                    disabled: false
                                                })
                                            })
                                        })
                                    );
                                }
                            });
                            console.log(this.arr);

                            this.sharedService
                                .companyGetCustomer({
                                    companyId:
                                    this.userService.appData.userData.companySelect.companyId,
                                    sourceProgramId:
                                    this.userService.appData.userData.companySelect
                                        .sourceProgramId
                                })
                                .subscribe(() => {
                                    let oppositeCustForChecks = responseRest.oppositeCustForChecks;
                                    if (
                                        oppositeCustForChecks &&
                                        this.userService.appData.userData.companyCustomerDetails &&
                                        this.userService.appData.userData.companyCustomerDetails
                                            .oppositeCustForChecks
                                    ) {
                                        oppositeCustForChecks =
                                            this.userService.appData.userData.companyCustomerDetails.cupa.find(
                                                (it) => it.custId === responseRest.oppositeCustForChecks
                                            );
                                    }
                                    this.info.patchValue({
                                        bankAsmachtaNumChar: responseRest.bankAsmachtaNumChar
                                            ? String(responseRest.bankAsmachtaNumChar)
                                            : '0',
                                        exportFileBankPeriod: responseRest.exportFileBankPeriod
                                            ? responseRest.exportFileBankPeriod
                                            : '1',
                                        exportFileTypeId: responseRest.exportFileTypeId
                                            ? responseRest.exportFileTypeId
                                            : '1',
                                        uniteJournalForPayments: responseRest.uniteJournalForPayments !== null
                                            ? responseRest.uniteJournalForPayments
                                            : false,
                                        bankProcessTransType: responseRest.bankProcessTransType,
                                        oppositeCustForChecks: oppositeCustForChecks
                                            ? oppositeCustForChecks
                                            : null
                                    });

                                    this.oppositeCustForChecksArr = this.addPriemerObject(
                                        this.userService.appData.userData.companyCustomerDetails
                                            ? this.userService.appData.userData.companyCustomerDetails[
                                                this.cupaAllTheOptions ? 'all' : 'cupa'
                                                ]
                                            : [],
                                        this.info.get('oppositeCustForChecks').value &&
                                        this.info.get('oppositeCustForChecks').value.custId
                                    );
                                    if (responseRest.notExportIncomes) {
                                        Object.entries(responseRest.notExportIncomes).forEach((it) => {
                                            const findItem = this.notExportIncomes.notExportIncomes.find(
                                                (item) => item.name === it[0]
                                            );
                                            if (findItem) {
                                                findItem.value = it[1];
                                            }
                                        });
                                        if (
                                            this.notExportIncomes.notExportIncomes
                                                .filter((it) => it.name !== 'all')
                                                .every((it) => it.value)
                                        ) {
                                            this.notExportIncomes.notExportIncomes[0].value = true;
                                        }
                                        const allSelected =
                                            this.notExportIncomes.notExportIncomes.filter(
                                                (it) => it.value === true
                                            );
                                        this.notExportIncomes.title =
                                            allSelected.length === 0
                                                ? 'בחירה'
                                                : allSelected.length === 1
                                                    ? allSelected[0].title
                                                    : allSelected.length ===
                                                    this.notExportIncomes.notExportIncomes.length
                                                        ? 'כל סוגי התשלום'
                                                        : 'נבחרו ' + allSelected.length + ' סוגי תשלום';
                                    }

                                });

                            if (responseRest.transTypeStatus === 'NOT_INTERESTED') {
                                this.info.get('bankProcessTransType').disable();
                            }

                            if (responseRest.manager) {
                                this.info.get('bankAsmachtaNumChar').enable();
                                this.info.get('exportFileTypeId').enable();
                                this.info.get('exportFileBankPeriod').enable();
                            }
                            if (responseRest.yearlyProgram) {
                                this.info.get('exportFileBankPeriod').disable();
                            }
                        });
                });
        } else {
            if (!this.infoJournalBankAndCreditComponent) {
                this.sharedService
                    .bankJournal({
                        uuid: this.isModal.companyId
                    })
                    .subscribe((response: any) => {
                        this.isReady = true;
                        const responseRest = response ? response['body'] : response;
                        this.currencyRates = responseRest.currencyRates;
                        this.info.patchValue({
                            revaluationCurr:
                                responseRest.revaluationCurr !== null
                                    ? responseRest.revaluationCurr
                                    : false,
                            revaluationCurrCode: responseRest.revaluationCurrCode
                                ? responseRest.revaluationCurrCode
                                : 'USD'
                        });
                        responseRest.currencyRates.forEach((cur) => {
                            let bankIsrael = true;
                            const isMatchCode = this.currencyList.find(
                                (it) => it.code === cur.code
                            );
                            if (isMatchCode) {
                                bankIsrael = isMatchCode.bankIsrael;
                            }
                            // @ts-ignore
                            const isCodeExist = this.arr.controls.find((it) =>
                                it.get(cur.code)
                            );
                            if (isCodeExist) {
                                isCodeExist.get(cur.code).patchValue({
                                    type: bankIsrael ? cur.type : 'FIXED',
                                    fixedRate: cur.fixedRate,
                                    hashCodeId: cur.hashCodeId || '',
                                    bankIsrael: bankIsrael,
                                    delete: false
                                });
                            } else {
                                this.arr.push(
                                    new FormGroup({
                                        [cur.code]: new FormGroup({
                                            type: new FormControl({
                                                value: bankIsrael ? cur.type : 'FIXED',
                                                disabled: false
                                            }),
                                            fixedRate: new FormControl({
                                                value: cur.fixedRate,
                                                disabled: false
                                            }),
                                            hashCodeId: new FormControl({
                                                value: cur.hashCodeId || '',
                                                disabled: false
                                            }),
                                            delete: new FormControl({
                                                value: false,
                                                disabled: false
                                            }),
                                            bankIsrael: new FormControl({
                                                value: bankIsrael,
                                                disabled: false
                                            })
                                        })
                                    })
                                );
                            }
                        });
                        console.log(this.arr);

                        let oppositeCustForChecks = responseRest.oppositeCustForChecks;
                        if (
                            oppositeCustForChecks &&
                            this.userService.appData.userData.companyCustomerDetails &&
                            this.userService.appData.userData.companyCustomerDetails
                                .oppositeCustForChecks
                        ) {
                            oppositeCustForChecks =
                                this.userService.appData.userData.companyCustomerDetails.cupa.find(
                                    (it) => it.custId === responseRest.oppositeCustForChecks
                                );
                        }
                        if (this.hide_bankProcessTransType) {
                            this.info.patchValue({
                                bankAsmachtaNumChar: responseRest.bankAsmachtaNumChar
                                    ? String(responseRest.bankAsmachtaNumChar)
                                    : '0',
                                exportFileBankPeriod: responseRest.exportFileBankPeriod
                                    ? responseRest.exportFileBankPeriod
                                    : '1',
                                exportFileTypeId: responseRest.exportFileTypeId
                                    ? responseRest.exportFileTypeId
                                    : '1',
                                oppositeCustForChecks: oppositeCustForChecks
                                    ? oppositeCustForChecks
                                    : null,
                                uniteJournalForPayments: responseRest.uniteJournalForPayments !== null
                                    ? responseRest.uniteJournalForPayments
                                    : false
                            });
                            if (responseRest.manager) {
                                this.info.get('bankAsmachtaNumChar').enable();
                                this.info.get('exportFileTypeId').enable();
                                this.info.get('exportFileBankPeriod').enable();
                            }
                            if (responseRest.yearlyProgram) {
                                this.info.get('exportFileBankPeriod').disable();
                            }
                        } else {
                            this.info.patchValue({
                                bankAsmachtaNumChar: responseRest.bankAsmachtaNumChar
                                    ? String(responseRest.bankAsmachtaNumChar)
                                    : '0',
                                exportFileBankPeriod: responseRest.exportFileBankPeriod
                                    ? responseRest.exportFileBankPeriod
                                    : '1',
                                exportFileTypeId: responseRest.exportFileTypeId
                                    ? responseRest.exportFileTypeId
                                    : '1',
                                bankProcessTransType: responseRest.bankProcessTransType,
                                oppositeCustForChecks: oppositeCustForChecks
                                    ? oppositeCustForChecks
                                    : null,
                                uniteJournalForPayments: responseRest.uniteJournalForPayments !== null
                                    ? responseRest.uniteJournalForPayments
                                    : false
                            });
                            if (responseRest.transTypeStatus === 'NOT_INTERESTED') {
                                this.info.get('bankProcessTransType').disable();
                            }
                            if (responseRest.manager) {
                                this.info.get('bankAsmachtaNumChar').enable();
                                this.info.get('exportFileTypeId').enable();
                                this.info.get('exportFileBankPeriod').enable();
                            }
                            if (responseRest.yearlyProgram) {
                                this.info.get('exportFileBankPeriod').disable();
                            }
                        }
                        this.oppositeCustForChecksArr = this.addPriemerObject(
                            this.userService.appData.userData.companyCustomerDetails
                                ? this.userService.appData.userData.companyCustomerDetails.cupa
                                : [],
                            this.info.get('oppositeCustForChecks').value &&
                            this.info.get('oppositeCustForChecks').value.custId
                        );
                        if (responseRest.notExportIncomes) {
                            Object.entries(responseRest.notExportIncomes).forEach((it) => {
                                const findItem = this.notExportIncomes.notExportIncomes.find(
                                    (item) => item.name === it[0]
                                );
                                if (findItem) {
                                    findItem.value = it[1];
                                }
                            });
                            if (
                                this.notExportIncomes.notExportIncomes
                                    .filter((it) => it.name !== 'all')
                                    .every((it) => it.value)
                            ) {
                                this.notExportIncomes.notExportIncomes[0].value = true;
                            }
                            const allSelected = this.notExportIncomes.notExportIncomes.filter(
                                (it) => it.value === true
                            );
                            this.notExportIncomes.title =
                                allSelected.length === 0
                                    ? 'בחירה'
                                    : allSelected.length === 1
                                        ? allSelected[0].title
                                        : allSelected.length ===
                                        this.notExportIncomes.notExportIncomes.length
                                            ? 'כל סוגי התשלום'
                                            : 'נבחרו ' + allSelected.length + ' סוגי תשלום';
                        }
                    });
            }

            if (this.isModal && this.report856 && this.hide_bankProcessTransType) {
                this.sharedService
                    .bookKeepingCust({
                        uuid: this.isModal.companyId
                    })
                    .subscribe((response: any) => {
                        const responseRest = response ? response['body'] : response;
                        this.bookKeepingCustParams = responseRest;
                        this.sharedService
                            .companyGetCustomer({
                                companyId: this.isModal.companyId,
                                sourceProgramId: this.isModal.sourceProgramId
                            })
                            .subscribe((resp) => {
                                let supplierTaxDeductionCustId =
                                    responseRest.supplierTaxDeductionCustId;
                                if (supplierTaxDeductionCustId) {
                                    supplierTaxDeductionCustId =
                                        this.userService.appData.userData.companyCustomerDetails.customerTaxDeductionCustIdExpenseArr.find(
                                            (it) =>
                                                it.custId === responseRest.supplierTaxDeductionCustId
                                        );
                                }
                                this.info.patchValue({
                                    supplierTaxDeductionCustId: supplierTaxDeductionCustId || null
                                });
                                this.supplierTaxDeductionCustIdArr = this.userService.appData
                                    .userData.companyCustomerDetails
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .customerTaxDeductionCustIdExpenseArr
                                    : [];
                                // this.supplierTaxDeductionCustIdArr = this.addPriemerObject((this.userService.appData.userData.companyCustomerDetails ? this.userService.appData.userData.companyCustomerDetails.customerTaxDeductionCustIdExpenseArr : []), this.info.get('supplierTaxDeductionCustId').value && this.info.get('supplierTaxDeductionCustId').value.custId);
                            });
                    });
            }
        }
    }

    getKey(obj) {
        const key = Object.keys(obj);
        if (key && key.length) {
            // code: "USD"
            // common: true
            // id: 2
            // name: "דולר ארה"ב"
            // sign: "$"
            const findMatchCode = this.currencyList.find((it) => it.code === key[0]);
            if (findMatchCode) {
                return findMatchCode;
            }
        }
        return {};
    }

    getKeyName(obj) {
        const key = Object.keys(obj);
        if (key && key.length) {
            return key[0];
        }
        return '';
    }

    openModalAddCurrency() {
        this.selectedCurrency = false;
        this.currencyListTemp = this.currencyList.filter(
            (it) =>
                it.code !== 'ILS' &&
                !this.arr.value.some((cur) => Object.keys(cur)[0] === it.code)
        );
    }

    addCurrency(name: any, bankIsrael: any, selectedCurrency: any) {
        if (selectedCurrency.indDefault) {
            this.arr.push(
                new FormGroup({
                    [name]: new FormGroup({
                        type: new FormControl({
                            //BANK or FIXED
                            value: bankIsrael ? 'BANK' : 'FIXED',
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
                        }),
                        delete: new FormControl({
                            value: false,
                            disabled: false
                        }),
                        bankIsrael: new FormControl({
                            value: bankIsrael,
                            disabled: false
                        })
                    })
                })
            );
            this.selectedCurrency = false;
            this.currencyListTemp = false;
            this.updateBankJournal();
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
        this.arr.push(
            new FormGroup({
                [name]: new FormGroup({
                    type: new FormControl({
                        value: this.type_currencyRates_modal.type,
                        disabled: false
                    }),
                    fixedRate: new FormControl({
                        // null or number
                        value:
                            this.type_currencyRates_modal.type === 'BANK'
                                ? ''
                                : this.type_currencyRates_modal.value,
                        disabled: false
                    }),
                    hashCodeId: new FormControl({
                        value: this.type_currencyRates_modal.hashCodeId,
                        disabled: false
                    }),
                    delete: new FormControl({
                        value: false,
                        disabled: false
                    }),
                    bankIsrael: new FormControl({
                        value: bankIsrael,
                        disabled: false
                    })
                })
            })
        );
        this.selectedCurrency = false;
        this.currencySetModal = false;
        this.updateBankJournal();
    }

    trackCurrency(idx: number, item: any) {
        return (item ? item.code : null) || idx;
    }

    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    detachOverlayHideListener() {
        console.log('detachOverlayHideListener');
        this.updateBankJournal(true);
    }

    setTitles_notExportIncomes(isAll?: any) {
        if (isAll) {
            if (this.notExportIncomes.notExportIncomes[0].name === 'all') {
                this.notExportIncomes.notExportIncomes.forEach((it, idx) => {
                    this.notExportIncomes.notExportIncomes[idx].value =
                        this.notExportIncomes.notExportIncomes[0].value;
                });
            }
        }
        let allSelected = this.notExportIncomes.notExportIncomes.filter(
            (it) => it.value === true
        );
        if (
            !isAll &&
            !this.notExportIncomes.notExportIncomes[0].value &&
            allSelected.length === this.notExportIncomes.notExportIncomes.length - 1
        ) {
            this.notExportIncomes.notExportIncomes[0].value = true;
        }
        allSelected = this.notExportIncomes.notExportIncomes.filter(
            (it) => it.value === true
        );
        this.notExportIncomes.title =
            allSelected.length === 0
                ? 'בחירה'
                : allSelected.length === 1
                    ? allSelected[0].title
                    : allSelected.length === this.notExportIncomes.notExportIncomes.length
                        ? 'כל סוגי התשלום'
                        : 'נבחרו ' + allSelected.length + ' סוגי תשלום';
    }

    updateValues(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
        this.updateBankJournal(param === 'exportFileBankPeriod' || param === 'oppositeCustForChecks' || param === 'exportFileTypeId');
    }

    updateValuesFromModal(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
    }

    setMaxDigitsAfterDec(item: any) {
        let rateInput = item
            .get(this.getKeyName(item.value))
            .get('fixedRate')
            .value.toString()
            .replace(/[^0-9.]/g, '');
        if (rateInput && rateInput.includes('.')) {
            const splitNumbers = rateInput.split('.');
            if (splitNumbers[1].length > 2) {
                rateInput = splitNumbers[0] + '.' + splitNumbers[1].slice(0, 2);
            }
        }
        item
            .get(this.getKeyName(item.value))
            .get('fixedRate')
            .patchValue(rateInput);
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

    updateValuesCurrencyRatesTypesInit(item: any, val: any, param: string) {
        this.modalBeforeContinue = {
            type: 'updateValuesCurrencyRatesTypes',
            item: item,
            val: val,
            param: param,
            changeTo: val === 'BANK' ? 'FIXED' : 'BANK'
        };
    }

    preliminaryModalApproval() {
        if (this.modalBeforeContinue.type === 'updateValuesCurrencyRatesTypes') {
            this.updateValuesCurrencyRatesTypes(this.modalBeforeContinue.item, this.modalBeforeContinue.val, this.modalBeforeContinue.param);
        }
        if (this.modalBeforeContinue.type === 'revaluationCurrCode') {
            if (this.currencyRates.some(it => it.code === this.info.get('revaluationCurrCode').value)) {
                this.updateBankJournal();
            } else {
                this.selectedCurrency = this.currencyList.find(it => it.code === this.info.get('revaluationCurrCode').value);
                this.addCurrency(
                    this.selectedCurrency.code,
                    this.selectedCurrency.bankIsrael,
                    this.selectedCurrency
                );
            }
        }
        if (this.modalBeforeContinue.type === 'revaluationCurrFalse') {
            this.updateValues('revaluationCurr', false);
        }
        if (this.modalBeforeContinue.type === 'revaluationCurrTrue') {
            this.openPopUpSetRevaluationCurr();
        }
        this.modalBeforeContinue = false;
    }

    preliminaryModalCancelation() {
        if (this.modalBeforeContinue.type === 'updateValuesCurrencyRatesTypes') {
            const pbj = {};
            pbj[this.modalBeforeContinue.param] = this.modalBeforeContinue.changeTo;
            this.modalBeforeContinue.item.get(Object.keys(this.modalBeforeContinue.item.value)).patchValue(pbj);
        }
        if (this.modalBeforeContinue.type === 'revaluationCurrCode') {
            const pbj = {};
            pbj['revaluationCurrCode'] = this.modalBeforeContinue.changeTo;
            this.info.patchValue(pbj);
        }
        if (this.modalBeforeContinue.type === 'revaluationCurrFalse' || this.modalBeforeContinue.type === 'revaluationCurrTrue') {
            const pbj = {};
            pbj['revaluationCurr'] = this.modalBeforeContinue.changeTo;
            this.info.patchValue(pbj);
        }
        this.modalBeforeContinue = false;
    }

    openModalBeforeContinue(type) {
        this.modalBeforeContinue = {
            type: type,
            changeTo: type === 'revaluationCurrFalse' ? true : type === 'revaluationCurrTrue' ? false : this.setCurrDef['revaluationCurrCode']
        };
    }

    updateValuesCurrencyRatesTypes(item: any, val: any, param: string) {
        const pbj = {};
        pbj[param] = val;
        item.get(Object.keys(item.value)).patchValue(pbj);
        if (
            !(
                val === 'FIXED' &&
                (!item.get(Object.keys(item.value)).get('fixedRate').value ||
                    item.get(Object.keys(item.value)).get('fixedRate').value === '')
            )
        ) {
            this.updateBankJournal();
        }
    }

    updateValuesTypeId(val: number) {
        const pbj = {};
        pbj['exportFileTypeId'] = val;
        this.info.patchValue(pbj);
        this.updateValues('exportFileTypeId', val);
    }

    updateValuesExportFileTypeId(val: number) {
        setTimeout(() => {
            const pbj = {};
            pbj['exportFileTypeId'] = val === 2 ? 1 : 2;
            this.info.patchValue(pbj);
        }, 500);
        this.modalUpdateValuesExportFileTypeId = val;
    }

    setAllCompanyCustomerDetails(formDropdowns?: any) {
        this.oppositeCustForChecksArr = this.addPriemerObject(
            this.userService.appData.userData.companyCustomerDetails
                ? this.userService.appData.userData.companyCustomerDetails.all
                : [],
            this.info.get('oppositeCustForChecks').value &&
            this.info.get('oppositeCustForChecks').value.custId
        );
        formDropdowns.show();
    }

    addPriemerObject(arr: any, isExistValue: boolean) {
        if (arr && arr.length && isExistValue) {
            arr = [
                {
                    cartisName: 'ביטול בחירה',
                    cartisCodeId: null,
                    custId: null,
                    hashCartisCodeId: null,
                    lName: null,
                    hp: null,
                    id: null,
                    pettyCash: false,
                    supplierTaxDeduction: null,
                    customerTaxDeduction: null
                },
                ...arr
            ];
        }
        if (arr) {
            const isExistTitle = arr.some(it => it.title);
            if (!this.cupaAllTheOptions) {
                if (!isExistTitle) {
                    arr.unshift({
                        cartisName: '',
                        title: true,
                        cartisCodeId: null,
                        custId: 'title',
                        hashCartisCodeId: null,
                        lName: null,
                        hp: null,
                        id: null,
                        pettyCash: false,
                        supplierTaxDeduction: null,
                        customerTaxDeduction: null,
                        disabled: true
                    });
                }
            } else {
                if (isExistTitle) {
                    arr = arr.filter(it => !it.title);
                }
            }
        }
        return arr;
    }

    updateBankJournal(startCounter?: boolean) {
        // if (this.isModal && this.report856 && this.hide_bankProcessTransType) {
        //     this.supplierTaxDeductionCustIdArr = this.addPriemerObject((this.userService.appData.userData.companyCustomerDetails ? this.userService.appData.userData.companyCustomerDetails.customerTaxDeductionCustIdExpenseArr : []), this.info.get('supplierTaxDeductionCustId').value && this.info.get('supplierTaxDeductionCustId').value.custId);
        // }
        this.oppositeCustForChecksArr = this.addPriemerObject(
            this.userService.appData.userData.companyCustomerDetails
                ? this.userService.appData.userData.companyCustomerDetails[
                    this.cupaAllTheOptions ? 'all' : 'cupa'
                    ]
                : [],
            this.info.get('oppositeCustForChecks').value &&
            this.info.get('oppositeCustForChecks').value.custId
        );
        // debugger;
        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        if (!this.isModal) {
            if (startCounter) {
                this.generalComponent.startCounter();
            }
            const notExportIncomes = {};
            this.notExportIncomes.notExportIncomes
                .filter((it) => it.name !== 'all')
                .forEach((it) => {
                    notExportIncomes[it.name] = it.value;
                });
            const params = {
                companyId: !this.isModal
                    ? this.userService.appData.userData.companySelect.companyId
                    : this.isModal.companyId,
                bankAsmachtaNumChar: Number(this.info.get('bankAsmachtaNumChar').value),
                exportFileTypeId: Number(this.info.get('exportFileTypeId').value),
                exportFileBankPeriod: Number(
                    this.info.get('exportFileBankPeriod').value
                ),
                revaluationCurr: this.info.get('revaluationCurr').value,
                revaluationCurrCode: this.info.get('revaluationCurrCode').value,
                bankProcessTransType: this.info.get('bankProcessTransType').value,
                uniteJournalForPayments: this.info.get('uniteJournalForPayments').value,
                bankAutoJournalTrans: true,
                oppositeCustForChecks: this.info.get('oppositeCustForChecks').value
                    ? this.info.get('oppositeCustForChecks').value.custId
                    : null,
                notExportIncomes: notExportIncomes,
                currencyRates: this.arr.value
                    .map((it) => {
                        const code = Object.keys(it)[0];
                        return {
                            fixedRate:
                                it[code].type === 'FIXED' ? Number(it[code].fixedRate) : 0,
                            hashCodeId: it[code].hashCodeId ? Number(it[code].hashCodeId) : 0,
                            code: code,
                            type: it[code].type,
                            delete: it[code].delete === true
                        };
                    })
                    .filter(
                        (obj) =>
                            (obj.type === 'FIXED' && obj.fixedRate) ||
                            obj.type === 'BANK' ||
                            obj.delete === true
                    )
            };
            console.log('params: ', params);
            const idxToDelete = this.arr.value.findIndex((it) => {
                const code = Object.keys(it)[0];
                return it[code].delete === true;
            });
            if (idxToDelete !== -1) {
                this.arr.removeAt(idxToDelete);
                this.arr.updateValueAndValidity();
            }
            this.sharedService.updateBankJournal(params).subscribe(() => {
                if (startCounter) {
                    this.generalComponent.resReceived();
                }
            });
        }
    }

    openPopUpSetRevaluationCurr() {
        setTimeout(() => {
            const pbj = {};
            pbj['revaluationCurr'] = false;
            this.info.patchValue(pbj);
        }, 10);
        this.showPopUpSetRevaluationCurr = true;
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
