import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {CustomersSettingsComponent} from '../customers-settings.component';
import {SharedService} from '@app/shared/services/shared.service';
import {Observable, Subject} from 'rxjs';
import {SharedComponent} from '@app/shared/component/shared.component';
import {FormControl, FormGroup} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ReloadServices} from '@app/shared/services/reload.services';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {Router} from '@angular/router';
import {BrowserService} from '@app/shared/services/browser.service';

// import {AutoComplete} from 'primeng/components/autocomplete/autocomplete';

@Component({
    templateUrl: './product-settings.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ProductSettingsComponent
    extends ReloadServices
    implements OnInit, OnDestroy {
    public info: any;
    public isReady = false;

    public modalUpdateValuesExportFileTypeId: any = false;

    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
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
    public dbYearHistoryArr: any;
    private readonly destroyed$ = new Subject<void>();
    isYear: boolean = false;
    params: any = {};
    showSupplierDocOrderTypeEdit = false;
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

    constructor(
        public userService: UserService,
        public settingsComponent: CustomersSettingsComponent,
        public sharedService: SharedService,
        private restCommonService: RestCommonService,
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        private ocrService: OcrService,
        public snackBar: MatSnackBar,
        public router: Router
    ) {
        super(sharedComponent);

        this.info = new FormGroup({
            folderPlus: new FormControl({
                value: false,
                disabled: true
            }),
            supplierAsmachtaNumChar: new FormControl({
                value: '0',
                disabled: true
            }),
            expenseAsmachtaType: new FormControl({
                value: '2',
                disabled: true
            }),
            incomeAsmachtaType: new FormControl({
                value: '1',
                disabled: true
            }),
            expenseOnly: new FormControl({
                value: true,
                disabled: true
            }),
            invertedCreditInvoice: new FormControl({
                value: true,
                disabled: true
            }),
            invoicePayment: new FormControl({
                value: false,
                disabled: true
            }),
            // exportFileVatPeriod: new FormControl({
            //     value: 'MONTH',
            //     disabled: true
            // }),
            unitedMailFiles: new FormControl({
                value: '0',
                disabled: true
            }),
            thirdDate: new FormControl({
                value: '0',
                disabled: true
            }),
            supplierDocOrderType: new FormControl({
                value: '1',
                disabled: true
            }),
            supplierIncomeOrderType: new FormControl({
                value: '3',
                disabled: false
            }),
            supplierExpenseOrderType: new FormControl({
                value: '4',
                disabled: false
            }),
            izuAsmachtaNumChar: new FormControl({
                value: '',
                disabled: true
            }),
            izuCreditValueDate: new FormControl({
                value: '',
                disabled: true
            }),
            indPkudotYoman: new FormControl({
                value: '',
                disabled: true
            }),
            izuFileExportType: new FormControl({
                value: '',
                disabled: true
            }),
            bankAsmachtaNumChar: new FormControl({
                value: '0',
                disabled: true
            }),
            exportFileTypeId: new FormControl({
                value: '1',
                disabled: true
            }),
            exportFileBankPeriod: new FormControl({
                value: '1',
                disabled: true
            }),
        });
    }


    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngOnInit(): void {
        this.sharedService.officeSettings()
            .subscribe((response: any) => {
                const responseRest = response ? response['body'] : response;
                this.isReady = true;
                this.params = responseRest;
                this.isYear = responseRest.supplierJournal.yearlyProgram;
                this.info.patchValue({
                    supplierAsmachtaNumChar: responseRest.supplierJournal.supplierAsmachtaNumChar
                        ? String(responseRest.supplierJournal.supplierAsmachtaNumChar)
                        : '0',
                    expenseAsmachtaType: responseRest.supplierJournal.expenseAsmachtaType
                        ? responseRest.supplierJournal.expenseAsmachtaType
                        : '2',
                    incomeAsmachtaType: responseRest.supplierJournal.incomeAsmachtaType
                        ? responseRest.supplierJournal.incomeAsmachtaType
                        : '1',
                    expenseOnly:
                        responseRest.supplierJournal.expenseOnly !== null
                            ? responseRest.supplierJournal.expenseOnly
                            : true,
                    folderPlus:
                        responseRest.folderPlus ? responseRest.folderPlus : false,
                    invertedCreditInvoice:
                        responseRest.supplierJournal.invertedCreditInvoice !== null &&
                        responseRest.supplierJournal.invertedCreditInvoice !== undefined
                            ? responseRest.supplierJournal.invertedCreditInvoice
                            : true,
                    invoicePayment:
                        responseRest.supplierJournal.invoicePayment !== null
                            ? responseRest.supplierJournal.invoicePayment
                            : false,
                    // exportFileVatPeriod: responseRest.supplierJournal.exportFileVatPeriod ? responseRest.supplierJournal.exportFileVatPeriod : 'MONTH',
                    unitedMailFiles: responseRest.supplierJournal.unitedMailFiles
                        ? responseRest.supplierJournal.unitedMailFiles
                        : '0',
                    thirdDate: responseRest.supplierJournal.thirdDate
                        ? responseRest.supplierJournal.thirdDate
                        : '0',
                    supplierDocOrderType: responseRest.supplierJournal.supplierDocOrderType
                        ? responseRest.supplierJournal.supplierDocOrderType.toString()
                        : '1',

                    supplierIncomeOrderType: responseRest.supplierJournal.supplierIncomeOrderType
                        ? responseRest.supplierJournal.supplierIncomeOrderType
                        : '3',
                    supplierExpenseOrderType: responseRest.supplierJournal.supplierExpenseOrderType
                        ? responseRest.supplierJournal.supplierExpenseOrderType
                        : '4',

                    izuAsmachtaNumChar: responseRest.companyExportDataDto.izuAsmachtaNumChar
                        ? responseRest.companyExportDataDto.izuAsmachtaNumChar.toString()
                        : '0',
                    indPkudotYoman: responseRest.companyExportDataDto.indPkudotYoman
                        ? responseRest.companyExportDataDto.indPkudotYoman
                        : '0',
                    izuCreditValueDate: responseRest.companyExportDataDto.izuCreditValueDate
                        ? responseRest.companyExportDataDto.izuCreditValueDate
                        : 'TRANS_DATE',
                    izuFileExportType: responseRest.companyExportDataDto.izuFileExportType
                        ? responseRest.companyExportDataDto.izuFileExportType.toString()
                        : '1',

                    bankAsmachtaNumChar: responseRest.bankJournal.bankAsmachtaNumChar
                        ? String(responseRest.bankJournal.bankAsmachtaNumChar)
                        : '0',
                    exportFileTypeId: responseRest.bankJournal.exportFileTypeId
                        ? responseRest.bankJournal.exportFileTypeId
                        : '1',
                    exportFileBankPeriod: responseRest.bankJournal.exportFileBankPeriod
                        ? responseRest.bankJournal.exportFileBankPeriod
                        : '1',
                });
                // if (responseRest.bankJournal.notExportIncomes) {
                //     Object.entries(responseRest.bankJournal.notExportIncomes).forEach((it) => {
                //         const findItem = this.notExportIncomes.notExportIncomes.find(
                //             (item) => item.name === it[0]
                //         );
                //         if (findItem) {
                //             findItem.value = it[1];
                //         }
                //     });
                //     if (
                //         this.notExportIncomes.notExportIncomes
                //             .filter((it) => it.name !== 'all')
                //             .every((it) => it.value)
                //     ) {
                //         this.notExportIncomes.notExportIncomes[0].value = true;
                //     }
                //     const allSelected = this.notExportIncomes.notExportIncomes.filter(
                //         (it) => it.value === true
                //     );
                //     this.notExportIncomes.title =
                //         allSelected.length === 0
                //             ? 'בחירה'
                //             : allSelected.length === 1
                //                 ? allSelected[0].title
                //                 : allSelected.length ===
                //                 this.notExportIncomes.notExportIncomes.length
                //                     ? 'כל סוגי התשלום'
                //                     : 'נבחרו ' + allSelected.length + ' סוגי תשלום';
                // }
                if (responseRest.manager) {
                    this.info.get('supplierAsmachtaNumChar').enable();
                    this.info.get('expenseAsmachtaType').enable();
                    this.info.get('incomeAsmachtaType').enable();
                    this.info.get('expenseOnly').enable();
                    this.info.get('folderPlus').enable();
                    this.info.get('invertedCreditInvoice').enable();
                    this.info.get('invoicePayment').enable();
                    // this.info.get('exportFileVatPeriod').enable();
                    this.info.get('unitedMailFiles').enable();
                    this.info.get('thirdDate').enable();
                    this.info.get('supplierDocOrderType').enable();
                    this.info.get('izuAsmachtaNumChar').enable();
                    this.info.get('indPkudotYoman').enable();
                    this.info.get('izuCreditValueDate').enable();
                    this.info.get('izuFileExportType').enable();
                    this.info.get('bankAsmachtaNumChar').enable();
                    this.info.get('exportFileTypeId').enable();
                    this.info.get('exportFileBankPeriod').enable();
                }
            });


    }

    // setTitles_notExportIncomes(isAll?: any) {
    //     if (isAll) {
    //         if (this.notExportIncomes.notExportIncomes[0].name === 'all') {
    //             this.notExportIncomes.notExportIncomes.forEach((it, idx) => {
    //                 this.notExportIncomes.notExportIncomes[idx].value =
    //                     this.notExportIncomes.notExportIncomes[0].value;
    //             });
    //         }
    //     }
    //     let allSelected = this.notExportIncomes.notExportIncomes.filter(
    //         (it) => it.value === true
    //     );
    //     if (
    //         !isAll &&
    //         !this.notExportIncomes.notExportIncomes[0].value &&
    //         allSelected.length === this.notExportIncomes.notExportIncomes.length - 1
    //     ) {
    //         this.notExportIncomes.notExportIncomes[0].value = true;
    //     }
    //     allSelected = this.notExportIncomes.notExportIncomes.filter(
    //         (it) => it.value === true
    //     );
    //     this.notExportIncomes.title =
    //         allSelected.length === 0
    //             ? 'בחירה'
    //             : allSelected.length === 1
    //                 ? allSelected[0].title
    //                 : allSelected.length === this.notExportIncomes.notExportIncomes.length
    //                     ? 'כל סוגי התשלום'
    //                     : 'נבחרו ' + allSelected.length + ' סוגי תשלום';
    // }

    updateValuesExportFileTypeId(val: number) {
        setTimeout(() => {
            const pbj = {};
            pbj['exportFileTypeId'] = val === 2 ? 1 : 2;
            this.info.patchValue(pbj);
        }, 500);
        this.modalUpdateValuesExportFileTypeId = val;
    }

    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    updateValues(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
        this.updateSettings();
    }

    updateValuesFromModal(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
    }

    updateValuesTypeId(val: number) {
        const pbj = {};
        pbj['exportFileTypeId'] = val;
        this.info.patchValue(pbj);
        this.updateValues('exportFileTypeId', val);
    }

    updateSettings() {
        // debugger;
        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }
        this.params.folderPlus = this.info.get('folderPlus').value;

        this.params.supplierJournal['supplierAsmachtaNumChar'] = Number(this.info.get('supplierAsmachtaNumChar').value);
        this.params.supplierJournal['expenseAsmachtaType'] = Number(this.info.get('expenseAsmachtaType').value);
        this.params.supplierJournal['incomeAsmachtaType'] = Number(this.info.get('incomeAsmachtaType').value);
        this.params.supplierJournal['expenseOnly'] = this.info.get('expenseOnly').value;
        this.params.supplierJournal['invertedCreditInvoice'] = this.info.get('invertedCreditInvoice').value;
        this.params.supplierJournal['invoicePayment'] = this.info.get('invoicePayment').value;
        // this.params.supplierJournal['exportFileVatPeriod'] = this.info.get('exportFileVatPeriod').value;
        this.params.supplierJournal['unitedMailFiles'] = Number(this.info.get('unitedMailFiles').value);
        this.params.supplierJournal['thirdDate'] = Number(this.info.get('thirdDate').value);
        this.params.supplierJournal['supplierDocOrderType'] = Number(this.info.get('supplierDocOrderType').value);
        this.params.supplierJournal['supplierIncomeOrderType'] = Number(this.info.get('supplierIncomeOrderType').value);
        this.params.supplierJournal['supplierExpenseOrderType'] = Number(this.info.get('supplierExpenseOrderType').value);

        this.params.companyExportDataDto['izuAsmachtaNumChar'] = Number(this.info.get('izuAsmachtaNumChar').value);
        this.params.companyExportDataDto['indPkudotYoman'] = this.info.get('indPkudotYoman').value;
        this.params.companyExportDataDto['izuCreditValueDate'] = this.info.get('izuCreditValueDate').value;
        this.params.companyExportDataDto['izuFileExportType'] = Number(this.info.get('izuFileExportType').value);

        this.params.bankJournal['bankAsmachtaNumChar'] = Number(this.info.get('bankAsmachtaNumChar').value);
        this.params.bankJournal['exportFileTypeId'] = Number(this.info.get('exportFileTypeId').value);
        this.params.bankJournal['exportFileBankPeriod'] = Number(this.info.get('exportFileBankPeriod').value);

        console.log('params: ', this.params);
        this.sharedService.updateSettings(this.params).subscribe(() => {
        });
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
