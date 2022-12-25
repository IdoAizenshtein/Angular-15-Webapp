/* tslint:disable:max-line-length */
import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    selector: 'app-journal-vendor-and-customer',
    templateUrl: './journal-vendor-and-customer.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class JournalVendorAndCustomerComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public info: any;
    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
    @Input() isModal: any = false;
    @Input() infoJournalVendorAndCustomerComponent: any;
    showPopUpSetRevaluationCurr = false;
    showSupplierDocOrderTypeEdit = false;
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
    public currencyListTemp: any = false;
    public currencySetModal: any = false;
    public currencyList: any = [];
    public revaluationCurrCodeArr: any = [];
    public selectedCurrency: any = false;
    public type_currencyRates_modal: any;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public translate: TranslateService,
        public snackBar: MatSnackBar,
        public router: Router
    ) {
        super(sharedComponent);

        this.ocrService.getCurrencyList().subscribe((currencies) => {
            this.currencyList = currencies;
            this.revaluationCurrCodeArr = this.currencyList
                .filter((it) => it.code !== 'ILS')
                .map((cur) => {
                    return {
                        label: cur.sign,
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

    ngOnInit(): void {
        this.info =
            this.isModal && this.infoJournalVendorAndCustomerComponent
                ? this.infoJournalVendorAndCustomerComponent
                : new FormGroup({
                    invoicePayment: new FormControl({
                        value: false,
                        disabled: false
                    }),
                    invertedCreditInvoice: new FormControl({
                        value: true,
                        disabled: false
                    }),
                    supplierAsmachtaNumChar: new FormControl({
                        value: '0',
                        disabled: !this.isModal
                    }),
                    thirdDate: new FormControl({
                        value: '0',
                        disabled: false
                    }),
                    // manualApprove: new FormControl({
                    //     value: true,
                    //     disabled: false
                    // }),
                    expenseOnly: new FormControl({
                        value: true,
                        disabled: false
                    }),
                    expenseAsmachtaType: new FormControl({
                        value: '2',
                        disabled: !this.isModal
                    }),
                    supplierDocOrderType: new FormControl({
                        value: '1',
                        disabled: false
                    }),
                    supplierIncomeOrderType: new FormControl({
                        value: '3',
                        disabled: false
                    }),
                    supplierExpenseOrderType: new FormControl({
                        value: '4',
                        disabled: false
                    }),
                    unitedMailFiles: new FormControl({
                        value: '0',
                        disabled: false
                    }),
                    exportFileVatPeriod: new FormControl({
                        value: this.asExportFileVatPeriodWithDefault(),
                        disabled: !this.isModal
                    }),
                    incomeAsmachtaType: new FormControl({
                        value: '1',
                        disabled: !this.isModal
                    }),
                    journalInvoiceCreditMemo: new FormControl({
                        value: true,
                        disabled: !this.isModal
                    }),
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
                });

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
                        .supplierJournal({
                            uuid: this.userService.appData.userData.companySelect.companyId
                        })
                        .subscribe((response: any) => {
                            const responseRest = response ? response['body'] : response;
                            // const responseRest = {
                            //     'supplierAsmachtaNumChar': null,
                            //     'manualApprove': false,
                            //     'incomeAsmachtaType': 2,
                            //     'expenseAsmachtaType': null,
                            //     'revaluationCurrCode': null,
                            //     'revaluationCurr': false,
                            //     'currencyRates': [
                            //         {
                            //             'fixedRate': null,
                            //             'code': 'EUR',
                            //             'type': 'BANK'
                            //         },
                            //         {
                            //             'fixedRate': null,
                            //             'code': 'GBP',
                            //             'type': 'BANK'
                            //         },
                            //         {
                            //             'fixedRate': 4,
                            //             'code': 'USD',
                            //             'type': 'FIXED'
                            //         }
                            //     ],
                            //     'manager': true,
                            //     'companyId': '36ed09c5-8e14-40d9-862c-ad8cba16f1df'
                            // };

                            this.info.patchValue({
                                exportFileVatPeriod: this.asExportFileVatPeriodWithDefault(
                                    responseRest.exportFileVatPeriod ||
                                    this.userService.appData.userData.companySelect.esderMaam
                                ),
                                invoicePayment:
                                    responseRest.invoicePayment !== null
                                        ? responseRest.invoicePayment
                                        : false,
                                invertedCreditInvoice:
                                    responseRest.invertedCreditInvoice !== null &&
                                    responseRest.invertedCreditInvoice !== undefined
                                        ? responseRest.invertedCreditInvoice
                                        : true,
                                supplierAsmachtaNumChar: responseRest.supplierAsmachtaNumChar
                                    ? String(responseRest.supplierAsmachtaNumChar)
                                    : '0',
                                thirdDate:
                                    this.userService.appData.userData.companySelect.esderMaam ===
                                    'NONE'
                                        ? '1'
                                        : responseRest.thirdDate
                                            ? responseRest.thirdDate
                                            : '0',
                                // manualApprove: responseRest.manualApprove !== null ? responseRest.manualApprove : true,
                                expenseAsmachtaType: responseRest.expenseAsmachtaType
                                    ? responseRest.expenseAsmachtaType
                                    : '2',
                                incomeAsmachtaType: responseRest.incomeAsmachtaType
                                    ? responseRest.incomeAsmachtaType
                                    : '1',
                                supplierDocOrderType: responseRest.supplierDocOrderType
                                    ? responseRest.supplierDocOrderType.toString()
                                    : '1',
                                supplierIncomeOrderType: responseRest.supplierIncomeOrderType
                                    ? responseRest.supplierIncomeOrderType
                                    : '3',
                                supplierExpenseOrderType: responseRest.supplierExpenseOrderType
                                    ? responseRest.supplierExpenseOrderType
                                    : '4',
                                unitedMailFiles: responseRest.unitedMailFiles
                                    ? responseRest.unitedMailFiles
                                    : '0',
                                revaluationCurr:
                                    responseRest.revaluationCurr !== null
                                        ? responseRest.revaluationCurr
                                        : false,
                                expenseOnly:
                                    responseRest.expenseOnly !== null
                                        ? responseRest.expenseOnly
                                        : true,
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
                            if (responseRest.manager) {
                                if (
                                    this.userService.appData.userData.companySelect.esderMaam !==
                                    'NONE'
                                ) {
                                    this.info.get('exportFileVatPeriod').enable();
                                }
                                this.info.get('supplierAsmachtaNumChar').enable();
                                this.info.get('expenseAsmachtaType').enable();
                                this.info.get('incomeAsmachtaType').enable();
                            }
                            if (
                                this.userService.appData.userData.companySelect.esderMaam ===
                                'NONE'
                            ) {
                                this.info.get('thirdDate').disable();
                            }
                            if (!responseRest.exportFileVatPeriod) {
                                this.updateValues(
                                    'exportFileVatPeriod',
                                    this.asExportFileVatPeriodWithDefault(
                                        this.userService.appData.userData.companySelect.esderMaam
                                    )
                                );
                            }
                        });
                });
        } else {
            if (!this.infoJournalVendorAndCustomerComponent) {
                this.sharedService
                    .supplierJournal({
                        uuid: this.isModal.companyId
                    })
                    .subscribe((response: any) => {
                        const responseRest = response ? response['body'] : response;
                        // const responseRest = {
                        //     'supplierAsmachtaNumChar': null,
                        //     'manualApprove': false,
                        //     'incomeAsmachtaType': 2,
                        //     'expenseAsmachtaType': null,
                        //     'revaluationCurrCode': null,
                        //     'revaluationCurr': false,
                        //     'currencyRates': [
                        //         {
                        //             'fixedRate': null,
                        //             'code': 'EUR',
                        //             'type': 'BANK'
                        //         },
                        //         {
                        //             'fixedRate': null,
                        //             'code': 'GBP',
                        //             'type': 'BANK'
                        //         },
                        //         {
                        //             'fixedRate': 4,
                        //             'code': 'USD',
                        //             'type': 'FIXED'
                        //         }
                        //     ],
                        //     'manager': true,
                        //     'companyId': '36ed09c5-8e14-40d9-862c-ad8cba16f1df'
                        // };

                        this.info.patchValue({
                            exportFileVatPeriod: this.asExportFileVatPeriodWithDefault(
                                responseRest.exportFileVatPeriod || this.isModal.esderMaam
                            ),
                            invoicePayment:
                                responseRest.invoicePayment !== null
                                    ? responseRest.invoicePayment
                                    : false,
                            invertedCreditInvoice:
                                responseRest.invertedCreditInvoice !== null &&
                                responseRest.invertedCreditInvoice !== undefined
                                    ? responseRest.invertedCreditInvoice
                                    : true,
                            supplierAsmachtaNumChar: responseRest.supplierAsmachtaNumChar
                                ? String(responseRest.supplierAsmachtaNumChar)
                                : '0',
                            thirdDate:
                                this.isModal.esderMaam === 'NONE'
                                    ? '1'
                                    : responseRest.thirdDate
                                        ? responseRest.thirdDate
                                        : '0',
                            // manualApprove: responseRest.manualApprove !== null ? responseRest.manualApprove : true,
                            expenseAsmachtaType: responseRest.expenseAsmachtaType
                                ? responseRest.expenseAsmachtaType
                                : '2',
                            incomeAsmachtaType: responseRest.incomeAsmachtaType
                                ? responseRest.incomeAsmachtaType
                                : '1',
                            supplierDocOrderType: responseRest.supplierDocOrderType
                                ? responseRest.supplierDocOrderType.toString()
                                : '1',
                            supplierIncomeOrderType: responseRest.supplierIncomeOrderType
                                ? responseRest.supplierIncomeOrderType
                                : '3',
                            supplierExpenseOrderType: responseRest.supplierExpenseOrderType
                                ? responseRest.supplierExpenseOrderType
                                : '4',
                            unitedMailFiles: responseRest.unitedMailFiles
                                ? responseRest.unitedMailFiles
                                : '0',
                            revaluationCurr:
                                responseRest.revaluationCurr !== null
                                    ? responseRest.revaluationCurr
                                    : false,
                            expenseOnly:
                                responseRest.expenseOnly !== null
                                    ? responseRest.expenseOnly
                                    : true,
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
                        if (responseRest.manager) {
                            if (this.isModal.esderMaam !== 'NONE') {
                                this.info.get('exportFileVatPeriod').enable();
                            }
                            this.info.get('supplierAsmachtaNumChar').enable();
                            this.info.get('expenseAsmachtaType').enable();
                            this.info.get('incomeAsmachtaType').enable();
                        }
                        if (this.isModal.esderMaam === 'NONE') {
                            this.info.get('thirdDate').disable();
                        }
                        if (!responseRest.exportFileVatPeriod) {
                            const def = this.asExportFileVatPeriodWithDefault(
                                this.isModal.esderMaam
                            );
                            this.updateValues('exportFileVatPeriod', def);
                        }
                    });
            } else {
                const def = this.asExportFileVatPeriodWithDefault(
                    this.isModal.esderMaam
                );
                this.updateValues('exportFileVatPeriod', def);
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
            this.updateSupplierJournal();
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
        this.updateSupplierJournal();
    }

    trackCurrency(idx: number, item: any) {
        return (item ? item.code : null) || idx;
    }


    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    openPopUpSetRevaluationCurr() {
        setTimeout(() => {
            const pbj = {};
            pbj['revaluationCurr'] = false;
            this.info.patchValue(pbj);
        }, 10);
        this.showPopUpSetRevaluationCurr = true;
    }

    updateValues(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
        this.updateSupplierJournal();
    }

    updateValuesFromModal(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
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
            this.updateSupplierJournal();
        }
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

    updateSupplierJournal() {
        // debugger;
        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }
        const params = {
            companyId: !this.isModal
                ? this.userService.appData.userData.companySelect.companyId
                : this.isModal.companyId,
            supplierAsmachtaNumChar: Number(
                this.info.get('supplierAsmachtaNumChar').value
            ),
            expenseAsmachtaType: Number(this.info.get('expenseAsmachtaType').value),
            incomeAsmachtaType: Number(this.info.get('incomeAsmachtaType').value),
            supplierDocOrderType: Number(this.info.get('supplierDocOrderType').value),
            supplierIncomeOrderType: Number(
                this.info.get('supplierIncomeOrderType').value
            ),
            supplierExpenseOrderType: Number(
                this.info.get('supplierExpenseOrderType').value
            ),
            thirdDate: Number(this.info.get('thirdDate').value),
            // manualApprove: this.info.get('manualApprove').value,
            expenseOnly: this.info.get('expenseOnly').value,
            revaluationCurr: this.info.get('revaluationCurr').value,
            revaluationCurrCode: this.info.get('revaluationCurrCode').value,
            invoicePayment: this.info.get('invoicePayment').value,
            invertedCreditInvoice: this.info.get('invertedCreditInvoice').value,
            exportFileVatPeriod: this.info.get('exportFileVatPeriod').value,
            unitedMailFiles: Number(this.info.get('unitedMailFiles').value),
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
        if (!this.isModal) {
            this.sharedService.updateSupplierJournal(params).subscribe(() => {
            });
        }
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

    asExportFileVatPeriodWithDefault(valToApply = 'MONTH'): string {
        const defaultVal =
            (this.isModal
                ? this.isModal.esderMaam
                : this.userService.appData &&
                this.userService.appData.userData &&
                this.userService.appData.userData.companySelect
                    ? this.userService.appData.userData.companySelect.esderMaam
                    : '') !== 'TWO_MONTH'
                ? 'MONTH'
                : 'TWO_MONTH';
        return [defaultVal, 'NONE'].includes(valToApply) ? valToApply : defaultVal;
    }
}
