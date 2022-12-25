import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Observable, Subject} from 'rxjs';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ReloadServices} from '@app/shared/services/reload.services';

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
                title: "צ'ק חוזר",
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

    constructor(
        public userService: UserService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public translate: TranslateService,
        public snackBar: MatSnackBar,
        public router: Router
    ) {
        super(sharedComponent);
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
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
                            )
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

                                })

                            if (responseRest.transTypeStatus === 'NOT_INTERESTED') {
                                this.info.get('bankProcessTransType').disable();
                            }

                            if (responseRest.manager) {
                                this.info.get('bankAsmachtaNumChar').enable();
                                this.info.get('exportFileTypeId').enable();
                                this.info.get('exportFileBankPeriod').enable();
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
                                    : null
                            });
                            if (responseRest.manager) {
                                this.info.get('bankAsmachtaNumChar').enable();
                                this.info.get('exportFileTypeId').enable();
                                this.info.get('exportFileBankPeriod').enable();
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
                                    : null
                            });
                            if (responseRest.transTypeStatus === 'NOT_INTERESTED') {
                                this.info.get('bankProcessTransType').disable();
                            }
                            if (responseRest.manager) {
                                this.info.get('bankAsmachtaNumChar').enable();
                                this.info.get('exportFileTypeId').enable();
                                this.info.get('exportFileBankPeriod').enable();
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


    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    detachOverlayHideListener() {
        console.log('detachOverlayHideListener');
        this.updateBankJournal();
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
        this.updateBankJournal();
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

    setAllCompanyCustomerDetails(formDropdowns?:any) {
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
                    })
                }
            } else {
                if (isExistTitle) {
                    arr = arr.filter(it => !it.title);
                }
            }
        }
        return arr;
    }

    updateBankJournal() {
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
                bankProcessTransType: this.info.get('bankProcessTransType').value,
                bankAutoJournalTrans: true,
                oppositeCustForChecks: this.info.get('oppositeCustForChecks').value
                    ? this.info.get('oppositeCustForChecks').value.custId
                    : null,
                notExportIncomes: notExportIncomes
            };
            console.log('params: ', params);
            this.sharedService.updateBankJournal(params).subscribe(() => {
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
}
