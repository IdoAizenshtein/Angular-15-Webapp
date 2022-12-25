/* tslint:disable:max-line-length */
import {Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
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
import {Subject} from 'rxjs';
import {ReloadServices} from '@app/shared/services/reload.services';
import {DatePipe, Location} from '@angular/common';
import {FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {BrowserService} from '@app/shared/services/browser.service';
import {ReportService} from '@app/core/report.service';
import {ContactsComponent} from '../../../general/contacts/contacts.component';
import {AccountingCardsComponent} from '../../../general/accountingCards/accounting-cards.component';
import {
    JournalVendorAndCustomerComponent
} from '../../../general/journalVendorAndCustomer/journal-vendor-and-customer.component';
import {CompanyProductsComponent} from '../company-products.component';
import {JournalBankAndCreditComponent} from '../../../general/journalBankAndCredit/journal-bank-and-credit.component';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';

@Component({
    templateUrl: './add-products.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class AddProductsComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public loader = false;
    public selectedCompany: any;
    text: string;
    filteredCompanies: string[];
    step: number = 1;
    stepInside: number = 1;
    public info: any;
    public savedParam: any;
    public setInfo = false;
    public contactsList: any = [];
    public vatReportTypeArr = [
        {
            label: 'PCN',
            value: 'PCN'
        },
        {
            label: 'דיגיטלית',
            value: 'DIGITAL'
        },
        {
            label: 'שובר',
            value: 'REGULAR'
        }
    ];
    public generalResponse;
    public query = '';
    public products: any = false;
    public showModalTransType: any = false;
    public progressSend: boolean = false;
    public sendWizardMail: any = false;
    public showModalScreenTransTypes: any = false;
    @ViewChild(ContactsComponent) childContactsComponent: ContactsComponent;
    public contacts: any;
    @ViewChild(AccountingCardsComponent)
    childAccountingCardsComponent: AccountingCardsComponent;
    public infoAccountingCards: any;
    @ViewChild(JournalVendorAndCustomerComponent)
    childJournalVendorAndCustomerComponent: JournalVendorAndCustomerComponent;
    @ViewChild(JournalBankAndCreditComponent)
    childJournalBankAndCreditComponent: JournalBankAndCreditComponent;
    public infoJournalVendorAndCustomerComponent: any;
    public infoJournalBankAndCreditComponent: any;
    public notExportIncomesInput: any = false;
    private readonly destroyed$ = new Subject<void>();
    private readonly dtPipe: DatePipe;

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public companyProductsComponent: CompanyProductsComponent,
        private filterPipe: FilterPipe,
        private http: HttpClient,
        private location: Location,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public translate: TranslateService,
        public reportService: ReportService,
        public sanitizer: DomSanitizer,
        private storageService: StorageService,
        private sumPipe: SumPipe,
        public snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        public router: Router
    ) {
        super(sharedComponent);
        this.dtPipe = new DatePipe('en-IL');
    }

    get arr(): FormArray {
        return this.contacts.get('contactsRows') as FormArray;
    }

    get otherOseknumArray(): FormArray {
        return this.info.get('otherOseknumArray') as FormArray;
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngOnInit(): void {
        if (!this.userService.appData.userData.companies) {
            this.sharedComponent.getDataEvent.subscribe((companiesExist) => {
                if (companiesExist) {
                }
            });
        } else {
        }

        if (this.selectedCompany) {
            this.selectCompany();
        }
    }

    onClickOptionDD(disabled: boolean, event: any) {
        if (disabled) {
            event.stopPropagation();
        }
    }

    filterCompanies(event) {
        console.log(event.query);
        this.query = event.query;
        const filteredCompanies =
            this.userService.appData.userData.companies.filter((it) => {
                return [it.companyName, it.companyHp]
                    .filter(
                        (v) => (typeof v === 'string' || typeof v === 'number') && !!v
                    )
                    .some((vstr) => vstr.toString().includes(event.query));
            });
        if (filteredCompanies.length) {
            const notString = filteredCompanies.filter(
                (fd) => typeof fd['companyName'] !== 'string'
            );
            this.filteredCompanies = filteredCompanies
                .filter((fd) => typeof fd['companyName'] === 'string')
                .sort((a, b) => {
                    const lblA = a['companyName'],
                        lblB = b['companyName'];
                    return (
                        (lblA || lblB
                            ? !lblA
                                ? 1
                                : !lblB
                                    ? -1
                                    : lblA.localeCompare(lblB)
                            : 0) * 1
                    );
                })
                .concat(notString);
        } else {
            this.filteredCompanies = filteredCompanies;
        }
    }

    saveParamsFromChildJournalBankAndCreditComponent() {
        this.infoJournalBankAndCreditComponent =
            this.childJournalBankAndCreditComponent.info;
        this.notExportIncomesInput =
            this.childJournalBankAndCreditComponent.notExportIncomes;
    }

    selectCompany() {
        this.progressSend = false;
        console.log(this.selectedCompany);
        this.products = false;
        this.sharedService
            .getCompanyItems(this.selectedCompany.companyId)
            .subscribe((resp) => {
                this.products = {
                    saved: resp.body,
                    ...resp.body
                };
                if (this.products.saved.creditJournal) {
                    this.products.creditJournal = false;
                }
                if (this.products.saved.supplierJournal) {
                    this.products.supplierJournal = false;
                }
                if (this.products.saved.bankJournal) {
                    this.products.bankJournal = false;
                }
                // bankExport: false
                // bankJournal: false
                // creditExport: false
                // creditJournal: false
                // supplierJournal: false
            });
        this.info = null;
    }

    getGeneral() {
        if (!this.info) {
            this.userService.appData.userData.companyCustomerDetails = null;
            this.sharedService.companyCustomerDetails$ = null;
            this.sharedService
                .companyGetCustomer({
                    companyId: this.selectedCompany.companyId,
                    sourceProgramId: this.selectedCompany.sourceProgramId
                })
                .subscribe((resp) => {
                });

            this.info = new FormGroup({
                yearlyProgram: new FormControl({
                    value: null,
                    disabled: true
                }),
                vatReportType: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    this.products.supplierJournal
                        ? {
                            validators: [Validators.required]
                        }
                        : {}
                ),
                esderMaam: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    this.products.supplierJournal
                        ? {
                            validators: [Validators.required]
                        }
                        : {}
                ),
                report856: new FormControl({
                    value: true,
                    disabled: false
                }),
                interested: new FormControl({
                    value: false,
                    disabled: false
                }),
                bankProcessTransType: new FormControl({
                    value: '',
                    disabled: false
                }),
                otherOseknumArray: new FormArray([
                    new FormControl(
                        {
                            value: '',
                            disabled: false
                        },
                        this.products.supplierJournal
                            ? {
                                validators: [
                                    Validators.maxLength(9),
                                    Validators.pattern('\\d+'),
                                    ValidatorsFactory.idValidatorIL
                                ]
                            }
                            : {}
                    )
                ])
            });

            this.sharedService
                .general({
                    uuid: this.selectedCompany.companyId
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

                    this.info.patchValue({
                        yearlyProgram: !responseRest.yearlyProgram
                            ? null
                            : responseRest.yearlyProgram,
                        vatReportType:
                            responseRest.vatReportType === undefined
                                ? null
                                : responseRest.vatReportType,
                        esderMaam:
                            responseRest.esderMaam === undefined
                                ? null
                                : responseRest.esderMaam,
                        report856:
                            responseRest.report856 === null ? true : responseRest.report856
                    });
                    if (this.products.supplierJournal) {
                        responseRest.otherOseknumArray.forEach((cur, idx) => {
                            // @ts-ignore
                            if (idx === 0) {
                                this.otherOseknumArray.controls[0].patchValue(cur);
                            } else {
                                if (cur) {
                                    this.otherOseknumArray.push(
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
                        console.log(this.otherOseknumArray);
                    }

                    // if (responseRest.manager) {
                    //     this.info.get('vatReportType').enable();
                    //     this.info.get('esderMaam').enable();
                    // }
                    this.generalResponse = responseRest;
                });

            this.contactsList = [];
            this.sharedService
                .contacts({
                    uuid: this.selectedCompany.companyId
                })
                .subscribe((response: any) => {
                    const responseRest = response ? response['body'] : response;

                    // console.log(responseRest);
                    responseRest.forEach((row) => {
                        this.contactsList.push(row.firstName + ' ' + row.lastName);
                    });
                });

            if (this.products.supplierJournal) {
                this.sharedService
                    .transTypeWithAutoApply({
                        // this.sharedService.transType({
                        uuid: this.selectedCompany.companyId
                    })
                    .subscribe((response: any) => {
                        const transType = response ? response['body'] : response;
                        const interested =
                            transType.transTypeStatus === 'NOT_DEFINED' ||
                            transType.transTypeStatus === 'DEFINED';
                        this.updateValues_interested('interested', interested);
                        /*
                                this.info.patchValue({
                                    interested: interested
                                });
            */
                    });
            }

            if (
                this.products &&
                !this.products.supplierJournal &&
                ((this.products.bankJournal && !this.products.creditJournal) ||
                    (!this.products.bankJournal && this.products.creditJournal) ||
                    (this.products.bankJournal && this.products.creditJournal))
            ) {
                this.sharedService
                    .bankJournal({
                        uuid: this.selectedCompany.companyId
                    })
                    .subscribe((response: any) => {
                        const responseRest = response ? response['body'] : response;
                        this.savedParam = responseRest;

                        this.updateValues_interested(
                            'bankProcessTransType',
                            responseRest.bankProcessTransType
                        );
                        /*
                                this.info.patchValue({
                                    bankProcessTransType: responseRest.bankProcessTransType
                                });
            */
                        if (responseRest.transTypeStatus === 'NOT_INTERESTED') {
                            this.info.get('bankProcessTransType').disable();
                        }
                    });
            }

            // if(this.products.bankJournal || this.products.creditJournal){
            //     this.sharedService.firstConstruction({
            //         'uuid': this.selectedCompany.companyId,
            //     }).subscribe((response:any) => {
            //
            //     });
            // }
        }
    }

    deleteItem(index: number) {
        const value = this.otherOseknumArray.value;
        this.otherOseknumArray.patchValue(
            value
                .slice(0, index)
                .concat(value.slice(index + 1))
                .concat(value[index])
        );
        this.otherOseknumArray.removeAt(value.length - 1);
        this.otherOseknumArray.updateValueAndValidity();
    }

    addOtherOsekNum() {
        this.otherOseknumArray.push(
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

    processContacts() {
        this.contacts = this.childContactsComponent.contacts;
        if (this.arr && this.arr.controls && this.arr.controls.length) {
            this.arr.controls.forEach((contact, idx) => {
                if (!contact.valid && idx > 0) {
                    this.arr.removeAt(idx);
                    this.arr.updateValueAndValidity();
                }
            });
        }
    }

    updateValues(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);
        this.updateCompany();
    }

    updateValues_interested(param: string, val: any) {
        const pbj = {};
        pbj[param] = val;
        this.info.patchValue(pbj);

        if (
            val === true &&
            ['interested', 'bankProcessTransType'].includes(param)
        ) {
            if ('interested' === param) {
                this.showModalScreenTransTypes_interested();
            }
            if ('bankProcessTransType' === param) {
                this.showModalScreenTransTypes_bankProcessTransType();
            }
        }
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    updateCompany(showToast?: boolean) {
        this.selectedCompany.esderMaam = this.info.get('esderMaam').value;

        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        // const params = {
        //     companyId: this.selectedCompany.companyId,
        //     esderMaam: this.info.get('esderMaam').value,
        //     // yearlyProgram: this.info.get('yearlyProgram').value,
        //     vatReportType: this.info.get('vatReportType').value,
        //     assessor: this.generalResponse.assessor,
        //     snifMaam: this.generalResponse.snifMaam,
        //     sourceProgramId: this.generalResponse.sourceProgramId,
        //     dbName: this.generalResponse.dbName,
        //     report856: this.generalResponse.report856,
        //     mikdamotPrc: this.generalResponse.mikdamotPrc,
        //     hiring: this.generalResponse.hiring,
        //     nikuiMasNum: this.generalResponse.nikuiMasNum,
        //     nikuiExpirationDate: this.generalResponse.nikuiExpirationDate,
        // };
        //
        // console.log('params: ', params);
        // this.sharedService.updateGeneral(params).subscribe(() => {
        //     if (showToast) {
        //         this.reportService.postponed = {
        //             action: null,
        //             message: this.sanitizer.bypassSecurityTrustHtml('שינוי זה יחול מתקופת הדיווח הבא'),
        //             fired: false
        //         };
        //         timer(3000)
        //             .subscribe(() => {
        //                 this.reportService.postponed = null;
        //             });
        //     }
        //     // this.userService.appData.userData.companies = null;
        //     // this.sharedService.getCompanies().subscribe((companies: any) => {
        //     //     this.userService.appData.userData.companies = companies.body;
        //     //     const companySelect = this.userService.appData.userData.companies.find(co => co.companyId === this.userService.appData.userData.companySelect.companyId);
        //     //     this.sharedComponent.setNameOfCompany(companySelect, this.userService.appData.userData.companies);
        //     // });
        // });
    }

    updateCompanyLast() {
        return new Promise((resolve, reject) => {
            // await this.addContact();
            const params = {
                wizard: true,
                companyId: this.selectedCompany.companyId,
                esderMaam: this.info.get('esderMaam').value,
                vatReportType: this.info.get('vatReportType').value,
                assessor: this.generalResponse.assessor,
                snifMaam: this.generalResponse.snifMaam,
                sourceProgramId: this.generalResponse.sourceProgramId,
                dbName: this.generalResponse.dbName,
                report856: this.info.get('report856').value,
                mikdamotPrc: this.generalResponse.mikdamotPrc,
                hiring: this.generalResponse.hiring,
                nikuiMasNum: this.generalResponse.nikuiMasNum,
                nikuiExpirationDate: this.generalResponse.nikuiExpirationDate
            };
            if (this.products.supplierJournal) {
                const otherOseknumArray = [];
                const values = this.otherOseknumArray.value;
                if (values && values.length) {
                    this.otherOseknumArray.controls.forEach((it, idx) => {
                        const value = it.value;
                        const invalid = it.invalid;
                        if (
                            !invalid &&
                            value !== '' &&
                            !this.otherOseknumArray.controls.some(
                                (val, index) =>
                                    index !== idx && val.value.toString() === value.toString()
                            )
                        ) {
                            otherOseknumArray.push(Number(value));
                        }
                    });
                }
                for (let idxOsek = 0; idxOsek < 3; idxOsek++) {
                    params['otherOseknum' + (idxOsek + 1)] = otherOseknumArray[idxOsek]
                        ? otherOseknumArray[idxOsek]
                        : null;
                }
            }

            console.log('params: ', params);
            resolve(params);
            // this.sharedService.updateGeneral(params).subscribe(() => {
            //     // if (showToast) {
            //     //     this.reportService.postponed = {
            //     //         action: null,
            //     //         message: this.sanitizer.bypassSecurityTrustHtml('שינוי זה יחול מתקופת הדיווח הבא'),
            //     //         fired: false
            //     //     };
            //     //     timer(3000)
            //     //         .subscribe(() => {
            //     //             this.reportService.postponed = null;
            //     //         });
            //     // }
            //     this.userService.appData.userData.companies = null;
            //     this.sharedService.getCompanies().subscribe((companies: any) => {
            //         this.userService.appData.userData.companies = companies.body;
            //         this.userService.appData.userData.companies.forEach(companyData => {
            //             companyData.METZALEM = (this.userService.appData.userData.accountant === false &&
            //                 (
            //                     companyData.privs.includes('METZALEM') ||
            //                     (companyData.privs.includes('METZALEM') && companyData.privs.includes('KSAFIM')) ||
            //                     (companyData.privs.includes('METZALEM') && companyData.privs.includes('ANHALATHESHBONOT')) ||
            //                     (companyData.privs.includes('METZALEM') && companyData.privs.includes('KSAFIM') && companyData.privs.includes('ANHALATHESHBONOT'))
            //                 )
            //             );
            //             if (companyData.METZALEM) {
            //                 if ((companyData.privs.includes('METZALEM') && companyData.privs.includes('KSAFIM') && companyData.privs.includes('ANHALATHESHBONOT'))) {
            //                     companyData.METZALEM_TYPE = 'KSAFIM_ANHALATHESHBONOT';
            //                 } else if ((companyData.privs.includes('METZALEM') && companyData.privs.includes('KSAFIM'))) {
            //                     companyData.METZALEM_TYPE = 'KSAFIM';
            //                 } else if ((companyData.privs.includes('METZALEM') && companyData.privs.includes('ANHALATHESHBONOT'))) {
            //                     companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
            //                 } else if (companyData.privs.includes('METZALEM')) {
            //                     companyData.METZALEM_TYPE = 'METZALEM';
            //                 }
            //             }
            //             companyData.METZALEM_deskTrialExpired = companyData.METZALEM && !companyData.deskTrialExpired;
            //
            //         });
            //         const companySelect = this.userService.appData.userData.companies.find(co => co.companyId === this.selectedCompany.companyId);
            //         this.sharedComponent.setNameOfCompany(companySelect, this.userService.appData.userData.companies);
            //         resolve(true);
            //     });
            // });
        });
    }

    updateSupplierJournal() {
        return new Promise((resolve, reject) => {
            // debugger;
            if (this.infoJournalVendorAndCustomerComponent.invalid) {
                BrowserService.flattenControls(
                    this.infoJournalVendorAndCustomerComponent
                ).forEach((ac) => ac.markAsDirty());
                resolve(null);
                return;
            }
            const params = {
                wizard: true,
                companyId: this.selectedCompany.companyId,
                supplierAsmachtaNumChar: Number(
                    this.infoJournalVendorAndCustomerComponent.get(
                        'supplierAsmachtaNumChar'
                    ).value
                ),
                expenseAsmachtaType: Number(
                    this.infoJournalVendorAndCustomerComponent.get('expenseAsmachtaType')
                        .value
                ),
                incomeAsmachtaType: Number(
                    this.infoJournalVendorAndCustomerComponent.get('incomeAsmachtaType')
                        .value
                ),
                thirdDate: Number(
                    this.infoJournalVendorAndCustomerComponent.get('thirdDate').value
                ),
                // manualApprove: this.infoJournalVendorAndCustomerComponent.get('manualApprove').value,
                expenseOnly:
                this.infoJournalVendorAndCustomerComponent.get('expenseOnly').value,
                revaluationCurr:
                this.infoJournalVendorAndCustomerComponent.get('revaluationCurr')
                    .value,
                revaluationCurrCode: this.infoJournalVendorAndCustomerComponent.get(
                    'revaluationCurrCode'
                ).value,
                invoicePayment:
                this.infoJournalVendorAndCustomerComponent.get('invoicePayment')
                    .value,
                exportFileVatPeriod: this.infoJournalVendorAndCustomerComponent.get(
                    'exportFileVatPeriod'
                ).value,
                supplierDocOrderType: Number(
                    this.infoJournalVendorAndCustomerComponent.get('supplierDocOrderType')
                        .value
                ),
                supplierIncomeOrderType: Number(
                    this.infoJournalVendorAndCustomerComponent.get(
                        'supplierIncomeOrderType'
                    ).value
                ),
                supplierExpenseOrderType: Number(
                    this.infoJournalVendorAndCustomerComponent.get(
                        'supplierExpenseOrderType'
                    ).value
                ),
                invertedCreditInvoice: this.infoJournalVendorAndCustomerComponent.get(
                    'invertedCreditInvoice'
                ).value,
                currencyRates: this.infoJournalVendorAndCustomerComponent
                    .get('currencyRates')
                    .value.map((it) => {
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
            // const idxToDelete = this.infoJournalVendorAndCustomerComponent.get('currencyRates').value.findIndex(it => {
            //     const code = Object.keys(it)[0];
            //     return it[code].delete === true;
            // });
            // if (idxToDelete !== -1) {
            //     this.childJournalVendorAndCustomerComponent.arr.removeAt(idxToDelete);
            // }
            resolve(params);
            // this.sharedService.updateSupplierJournal(params).subscribe(() => {
            //     resolve(true);
            // });
        });
    }

    updateBankJournal() {
        return new Promise((resolve, reject) => {
            // debugger;

            if (this.infoJournalBankAndCreditComponent.invalid) {
                BrowserService.flattenControls(
                    this.infoJournalBankAndCreditComponent
                ).forEach((ac) => ac.markAsDirty());
                resolve(null);
                return;
            }

            const notExportIncomes = {};
            this.notExportIncomesInput.notExportIncomes
                .filter((it) => it.name !== 'all')
                .forEach((it) => {
                    notExportIncomes[it.name] = it.value;
                });
            const params = {
                companyId: this.selectedCompany.companyId,
                bankAsmachtaNumChar: Number(
                    this.infoJournalBankAndCreditComponent.get('bankAsmachtaNumChar')
                        .value
                ),
                exportFileTypeId: Number(
                    this.infoJournalBankAndCreditComponent.get('exportFileTypeId').value
                ),
                exportFileBankPeriod: Number(
                    this.infoJournalBankAndCreditComponent.get('exportFileBankPeriod')
                        .value
                ),
                bankAutoJournalTrans: true,
                oppositeCustForChecks: this.infoJournalBankAndCreditComponent.get(
                    'oppositeCustForChecks'
                ).value
                    ? this.infoJournalBankAndCreditComponent.get('oppositeCustForChecks')
                        .value.custId
                    : null,
                notExportIncomes: notExportIncomes
            };
            if (
                this.infoJournalBankAndCreditComponent &&
                this.infoJournalBankAndCreditComponent.get('bankProcessTransType')
            ) {
                params['bankProcessTransType'] =
                    this.infoJournalBankAndCreditComponent.get(
                        'bankProcessTransType'
                    ).value;
            }
            console.log('params: ', params);
            resolve(params);
            // this.sharedService.updateBankJournal(params).subscribe(() => {
            // });
        });
    }

    addContact() {
        return new Promise((resolve, reject) => {
            this.userService.appData.sendWizardMailCheck = true;
            this.userService.appData.sendWizardMailInfo = {
                mail:
                    ('000000000' + this.selectedCompany.companyHp).slice(-9) +
                    '@biziboxcpa.com',
                name: this.selectedCompany.companyName
            };
            if (this.products.supplierJournal) {
                this.userService.appData.sendWizardMail = [];
            }
            if (this.arr && this.arr.controls && this.arr.controls.length) {
                const contactValid = this.arr.controls.filter(
                    (contact) => contact.valid
                );
                if (contactValid.length) {
                    contactValid.forEach((contact, idx) => {
                        if (contact.valid) {
                            if (
                                this.products.supplierJournal &&
                                this.userService.appData.sendWizardMail
                            ) {
                                this.userService.appData.sendWizardMail.push(null);
                            }

                            const params = {
                                companyId: this.selectedCompany.companyId,
                                firstName: contact.get('firstName').value
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
                                if (
                                    this.products.supplierJournal &&
                                    this.userService.appData.sendWizardMail
                                ) {
                                    this.userService.appData.sendWizardMail[idx] =
                                        responseRest.companyContactId;
                                }
                                if (contact.get('joinApp').value) {
                                    this.sharedService
                                        .joinAppContact({
                                            uuid: responseRest.companyContactId
                                        })
                                        .subscribe(() => {
                                        });
                                }

                                if (idx + 1 === contactValid.length) {
                                    resolve(true);
                                }
                            });
                        }
                    });
                } else {
                    resolve(true);
                }
            } else {
                resolve(true);
            }
        });
    }

    getDetails() {
        return new Promise((resolve, reject) => {
            this.sharedService
                .details({
                    uuid: this.selectedCompany.companyId
                })
                .subscribe((response: any) => {
                    //const responseRest = (response) ? response['body'] : response;
                    resolve(true);
                });
        });
    }

    updateBookKeepingCust() {
        return new Promise((resolve, reject) => {
            // debugger;
            // if (this.info.invalid) {
            //     BrowserService.flattenControls(this.info).forEach(ac => ac.markAsDirty());
            //     return;
            // }
            // pettyCashCustId
            // custMaamIska
            // custMaamNechasim
            // customerTaxDeductionCustId
            // custMaamTsumot
            // supplierTaxDeductionCustId
            const params = {
                companyId: this.selectedCompany.companyId,
                pettyCashCustId: this.infoAccountingCards.get('pettyCashCustId').value
                    ? this.infoAccountingCards.get('pettyCashCustId').value.custId
                    : null,
                cancelBalanceCustId: this.infoAccountingCards.get('cancelBalanceCustId')
                    .value
                    ? this.infoAccountingCards.get('cancelBalanceCustId').value.custId
                    : null,
                custMaamTsumot: this.infoAccountingCards.get('custMaamTsumot').value
                    ? this.infoAccountingCards.get('custMaamTsumot').value.custId
                    : null,
                custMaamYevu: this.infoAccountingCards.get('custMaamYevu').value
                    ? this.infoAccountingCards.get('custMaamYevu').value.custId
                    : null,
                custMaamIska: this.infoAccountingCards.get('custMaamIska').value
                    ? this.infoAccountingCards.get('custMaamIska').value.custId
                    : null,
                custMaamNechasim: this.infoAccountingCards.get('custMaamNechasim').value
                    ? this.infoAccountingCards.get('custMaamNechasim').value.custId
                    : null,
                supplierTaxDeductionCustId: this.infoAccountingCards.get(
                    'supplierTaxDeductionCustId'
                ).value
                    ? this.infoAccountingCards.get('supplierTaxDeductionCustId').value
                        .custId
                    : null,
                customerTaxDeductionCustId: this.infoAccountingCards.get(
                    'customerTaxDeductionCustId'
                ).value
                    ? this.infoAccountingCards.get('customerTaxDeductionCustId').value
                        .custId
                    : null,
                openingBalanceCustId: this.infoAccountingCards.get(
                    'openingBalanceCustId'
                ).value
                    ? this.infoAccountingCards.get('openingBalanceCustId').value.custId
                    : null,
                incomeCustId: this.infoAccountingCards.get('incomeCustId').value
                    ? this.infoAccountingCards.get('incomeCustId').value.custId
                    : null,
                expenseCustId: this.infoAccountingCards.get('expenseCustId').value
                    ? this.infoAccountingCards.get('expenseCustId').value.custId
                    : null
            };
            if (
                this.infoJournalBankAndCreditComponent &&
                this.infoJournalBankAndCreditComponent.get('bankProcessTransType')
            ) {
                params['bankProcessTransType'] =
                    this.infoJournalBankAndCreditComponent.get(
                        'bankProcessTransType'
                    ).value;
            }

            console.log('params: ', params);
            resolve(params);

            // this.sharedService.updateBookKeepingCust(params).subscribe(() => {
            // });
        });
    }

    async sendAll() {
        if (this.progressSend) {
            return;
        }
        this.progressSend = true;
        const param_update_wizard = {
            companyId: this.selectedCompany.companyId,
            updateGeneral: null,
            updateBankJournal: null,
            updateBookKeepingCust: null,
            updateSupplierJournal: null
        };
        param_update_wizard['updateGeneral'] = await this.updateCompanyLast();

        if (
            this.products &&
            ((this.products.supplierJournal &&
                    !this.products.bankJournal &&
                    !this.products.creditJournal) ||
                (this.products.supplierJournal &&
                    this.products.bankJournal &&
                    !this.products.creditJournal) ||
                (this.products.supplierJournal &&
                    this.products.bankJournal &&
                    this.products.creditJournal) ||
                (this.products.supplierJournal &&
                    !this.products.bankJournal &&
                    this.products.creditJournal))
        ) {
            param_update_wizard['updateBookKeepingCust'] =
                await this.updateBookKeepingCust();
        }

        if (
            this.info.get('report856').value &&
            this.childJournalBankAndCreditComponent &&
            this.childJournalBankAndCreditComponent.bookKeepingCustParams &&
            this.products &&
            !this.products.supplierJournal &&
            ((this.products.bankJournal && !this.products.creditJournal) ||
                (!this.products.bankJournal && this.products.creditJournal) ||
                (this.products.bankJournal && this.products.creditJournal)) &&
            this.infoJournalBankAndCreditComponent.get('supplierTaxDeductionCustId')
        ) {
            const bookKeepingCustParams =
                this.childJournalBankAndCreditComponent.bookKeepingCustParams;
            const params = {
                companyId: this.selectedCompany.companyId,
                pettyCashCustId: bookKeepingCustParams.pettyCashCustId,
                cancelBalanceCustId: bookKeepingCustParams.cancelBalanceCustId,
                custMaamTsumot: bookKeepingCustParams.custMaamTsumot,
                custMaamYevu: bookKeepingCustParams.custMaamYevu,
                custMaamIska: bookKeepingCustParams.custMaamIska,
                custMaamNechasim: bookKeepingCustParams.custMaamNechasim,
                supplierTaxDeductionCustId: this.infoJournalBankAndCreditComponent.get(
                    'supplierTaxDeductionCustId'
                ).value
                    ? this.infoJournalBankAndCreditComponent.get(
                        'supplierTaxDeductionCustId'
                    ).value.custId
                    : null,
                customerTaxDeductionCustId:
                bookKeepingCustParams.customerTaxDeductionCustId,
                openingBalanceCustId: bookKeepingCustParams.openingBalanceCustId,
                incomeCustId: bookKeepingCustParams.incomeCustId,
                expenseCustId: bookKeepingCustParams.expenseCustId
            };
            if (
                this.infoJournalBankAndCreditComponent &&
                this.infoJournalBankAndCreditComponent.get('bankProcessTransType')
            ) {
                params['bankProcessTransType'] =
                    this.infoJournalBankAndCreditComponent.get(
                        'bankProcessTransType'
                    ).value;
            }
            param_update_wizard['updateBookKeepingCust'] = params;
        }

        if (
            this.products &&
            ((this.products.supplierJournal &&
                    !this.products.bankJournal &&
                    !this.products.creditJournal) ||
                (this.products.supplierJournal &&
                    !this.products.creditJournal &&
                    this.products.bankJournal) ||
                (this.products.supplierJournal &&
                    this.products.bankJournal &&
                    this.products.creditJournal) ||
                (this.products.supplierJournal &&
                    !this.products.bankJournal &&
                    this.products.creditJournal))
        ) {
            param_update_wizard['updateSupplierJournal'] =
                await this.updateSupplierJournal();
        } else {
            param_update_wizard['updateBankJournal'] = await this.updateBankJournal();
        }

        if (
            this.products &&
            ((this.products.supplierJournal &&
                    !this.products.creditJournal &&
                    this.products.bankJournal) ||
                (this.products.supplierJournal &&
                    this.products.bankJournal &&
                    this.products.creditJournal) ||
                (this.products.supplierJournal &&
                    !this.products.bankJournal &&
                    this.products.creditJournal))
        ) {
            param_update_wizard['updateBankJournal'] = await this.updateBankJournal();
        }
        // ['updateGeneral', 'updateBankJournal', 'updateBookKeepingCust', 'updateSupplierJournal']
        //     .forEach(propName => {
        //         if (!!param_update_wizard[propName] && Object.keys(param_update_wizard[propName]).length === 0) {
        //             param_update_wizard[propName] = null;
        //         }
        //     });

        this.sharedService.updateWizard(param_update_wizard).subscribe(async () => {
            await this.addContact();
            await this.getDetails();
            this.sharedService
                .addItem({
                    companyId: this.selectedCompany.companyId,
                    bankExport: false,
                    creditExport: false,
                    supplierJournal: this.products.saved.supplierJournal
                        ? null
                        : this.products.supplierJournal,
                    bankJournal: this.products.saved.bankJournal
                        ? null
                        : this.products.bankJournal,
                    creditJournal: this.products.saved.creditJournal
                        ? null
                        : this.products.creditJournal
                })
                .subscribe(() => {
                    this.userService.appData.userData.companies = null;
                    this.sharedService.getCompanies().subscribe((companies: any) => {
                        this.userService.appData.userData.companies = companies.body;
                        this.userService.appData.userData.companies.forEach(
                            (companyData) => {
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
                            }
                        );
                        // const companySelect = this.userService.appData.userData.companies.find(co => co.companyId === this.userService.appData.userData.companySelect.companyId);
                        // this.sharedComponent.setNameOfCompany(companySelect, this.userService.appData.userData.companies);
                    });

                    if (this.products.supplierJournal) {
                        this.sharedService
                            .countStatus({
                                uuid: this.selectedCompany.companyId
                            })
                            .subscribe((response: any) => {
                                const countStatusDataFixed = response
                                    ? response['body']
                                    : response;
                                // if (countStatusDataFixed.transTypeStatus === 'NOT_DEFINED') {
                                //     this.showModalTransType = true;
                                // } else {
                                //     setTimeout(() => {
                                //         this.goToCompanyProducts();
                                //     }, 800);
                                // }
                                setTimeout(() => {
                                    this.goToCompanyProducts();
                                }, 800);
                            });
                    }

                    if (
                        this.products &&
                        !this.products.supplierJournal &&
                        ((this.products.bankJournal && !this.products.creditJournal) ||
                            (!this.products.bankJournal && this.products.creditJournal) ||
                            (this.products.bankJournal && this.products.creditJournal))
                    ) {
                        this.sharedService
                            .countStatus({
                                uuid: this.selectedCompany.companyId
                            })
                            .subscribe((response: any) => {
                                const countStatusDataFixed = response
                                    ? response['body']
                                    : response;
                                // if (countStatusDataFixed.transTypeStatus === 'NOT_DEFINED') {
                                //     this.showModalTransType = true;
                                // } else {
                                //     setTimeout(() => {
                                //         this.goToCompanyProducts();
                                //     }, 800);
                                // }
                                setTimeout(() => {
                                    this.goToCompanyProducts();
                                }, 800);
                            });
                        // this.sharedService.updateBankJournal({
                        //     'companyId': this.selectedCompany.companyId,
                        //     bankAsmachtaNumChar: this.savedParam.bankAsmachtaNumChar,
                        //     exportFileTypeId: this.savedParam.exportFileTypeId,
                        //     exportFileBankPeriod: this.savedParam.exportFileBankPeriod,
                        //     bankAutoJournalTrans: true,
                        //     bankProcessTransType: this.info.get('bankProcessTransType').value
                        // }).subscribe(() => {
                        //
                        // });
                    }
                });
        });
    }

    moveToTransType() {
        this.storageService.sessionStorageSetter('onChangeValInterested', 'true');
        const companySelect = this.userService.appData.userData.companies.find(
            (co) => co.companyId === this.selectedCompany.companyId
        );
        this.sharedComponent.selectCompanyParam(
            companySelect,
            '/accountants/companies/general/transType'
        );
    }

    showModalScreenTransTypes_bankProcessTransType() {
        if (this.info.get('bankProcessTransType').value) {
            this.storageService.sessionStorageSetter('onChangeValInterested', 'true');
            this.showModalScreenTransTypes = true;
        }
    }

    showModalScreenTransTypes_interested() {
        if (this.info.get('interested').value) {
            this.storageService.sessionStorageSetter('onChangeValInterested', 'true');
            this.showModalScreenTransTypes = true;
        }
    }

    updateTransTypeStatus() {
        this.showModalTransType = false;
        this.goToCompanyProducts();
        // this.sharedService.updateTransTypeStatus({
        //     'companyId': this.selectedCompany.companyId,
        //     'interested': false
        // }).subscribe(() => {
        //     this.showModalTransType = false;
        //     this.goToCompanyProducts();
        // });
    }

    supplierJournal_updateTransTypeStatus() {
        if (this.products.supplierJournal) {
            this.sharedService
                .updateTransTypeStatus({
                    companyId: this.selectedCompany.companyId,
                    interested: this.info.get('interested').value
                })
                .subscribe((responseAll1) => {
                });
        }
    }

    goToCompanyProducts(isClosed?: boolean): void {
        // if (this.storageService.sessionStorageGetterItem('backTo')) {
        //     this.storageService.sessionStorageRemoveItem('backTo');
        //     this.router.navigate(['/accountants/companies/general/contacts'], {
        //         queryParamsHandling: 'preserve',
        //         relativeTo: this.route
        //     });
        // } else {

        //     const navigationExtras: NavigationExtras = {
        //         relativeTo: this.route,
        //         queryParamsHandling: 'merge'
        //     };
        //     this.router.navigate(['../'], navigationExtras);

        // }
        if (this.selectedCompany && this.selectedCompany.companyId) {
            this.storageService.localStorageSetter(
                'goToCompanyProducts',
                this.selectedCompany.companyId
            );
        }

        this.location.back();

        setTimeout(() => {
            if (this.router.url.includes('accountants/companies')) {
                if (!isClosed && this.companyProductsComponent) {
                    this.companyProductsComponent.ngOnInit();
                }
            }
        }, 500);
    }


    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    ngOnDestroy(): void {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        this.destroy();
    }
}
