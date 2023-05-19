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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {Observable, Subject, timer} from 'rxjs';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {BrowserService} from '@app/shared/services/browser.service';
import {ReportService} from '@app/core/report.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {GeneralComponent} from '@app/accountants/companies/general/general.component';

@Component({
    templateUrl: './general-company.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class GeneralCompanyComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public info: any;
    public assessorArr: any = [];
    public assessorArrSaved: any = [];

    public snifMaamArr: any = [];
    public snifMaamArrSaved: any = [];

    public infoModal: any;
    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
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
    public show_modal_report856 = false;
    public showModalEsderMaam = false;
    public dbYearHistoryArr: any;
    public bookKeepingCustRes: any = null;
    private readonly destroyed$ = new Subject<void>();
    public showReceivingFilesModal: any = false;
    public showReceivingFilesModalInside: boolean = false;
    public showUpdateFolderPlusModal: any = false;
    public generalResponseRest: any = {};

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public reportService: ReportService,
        private filterPipe: FilterPipe,
        public sanitizer: DomSanitizer,
        private http: HttpClient,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public translate: TranslateService,
        private storageService: StorageService,
        private sumPipe: SumPipe,
        public snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        public router: Router,
        public generalComponent: GeneralComponent
    ) {
        super(sharedComponent);

        this.info = new FormGroup({
            sourceProgramName: new FormControl({
                value: '',
                disabled: true
            }),
            sourceProgramId: new FormControl({
                value: '',
                disabled: true
            }),
            dbName: new FormControl({
                value: '',
                disabled: true
            }),
            report856: new FormControl({
                value: true,
                disabled: true
            }),
            yearlyProgram: new FormControl({
                value: false,
                disabled: true
            }),
            mikdamotPrc: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [Validators.pattern('\\d+')]
            ),
            hiring: new FormControl({
                value: true,
                disabled: true
            }),
            nikuiMasNum: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                [Validators.pattern('\\d+')]
            ),
            nikuiExpirationDate: new FormControl({
                value: '',
                disabled: false
            }),
            vatReportType: new FormControl({
                value: '',
                disabled: true
            }),
            esderMaam: new FormControl({
                value: '',
                disabled: true
            }),
            snifMaam: new FormControl({
                value: '',
                disabled: false
            }),
            assessor: new FormControl({
                value: '',
                disabled: false
            }),
            folderPlus: new FormControl({
                value: false,
                disabled: false
            })
        });

        this.infoModal = new FormGroup({
            supplierTaxDeductionCustId: new FormControl(
                {
                    value: '',
                    disabled: false
                },
                {
                    validators: [Validators.required]
                }
            )
        });
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngOnInit(): void {
        this.bookKeepingCustRes = null;
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
                    .general({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                    .subscribe((response: any) => {
                        const responseRest = response ? response['body'] : response;
                        this.generalResponseRest = responseRest;
                        // assessor: null
                        // companyId: "909e0702-483b-1d4b-e053-650019accda1"
                        // dbName: "BIGRAF12"
                        // esderMaam: "MONTH"
                        // hiring: null
                        // manager: false
                        // mikdamotPrc: null
                        // nikuiExpirationDate: null
                        // nikuiMasNum: null
                        // report856: null
                        // snifMaam: null
                        // sourceProgramId: 333
                        // userId: "00000000-0000-0000-0999-000000000000"
                        // vatReportType: "REGULAR"
                        this.info.patchValue({
                            sourceProgramName: responseRest.sourceProgramId
                                ? this.translate.translations[this.translate.currentLang][
                                    'sourcePrograms'
                                    ][responseRest.sourceProgramId]
                                : '',
                            sourceProgramId: responseRest.sourceProgramId,
                            yearlyProgram:
                                responseRest.yearlyProgram === undefined
                                    ? false
                                    : responseRest.yearlyProgram,
                            vatReportType: responseRest.vatReportType,
                            dbName: responseRest.dbName,
                            esderMaam: responseRest.esderMaam,
                            report856:
                                responseRest.report856 === null ? true : responseRest.report856,
                            mikdamotPrc: responseRest.mikdamotPrc,
                            hiring: responseRest.hiring === null ? true : responseRest.hiring,
                            folderPlus: responseRest.folderPlus === null ? true : responseRest.folderPlus,
                            nikuiMasNum: responseRest.nikuiMasNum,
                            nikuiExpirationDate: responseRest.nikuiExpirationDate
                                ? new Date(responseRest.nikuiExpirationDate)
                                : responseRest.nikuiExpirationDate
                        });
                        if (responseRest.folderPlus === null) {
                            this.info.get('folderPlus').disable();
                        }
                        if (responseRest.manager) {
                            this.info.get('vatReportType').enable();
                            this.info.get('esderMaam').enable();
                            this.info.get('report856').enable();
                            this.info.get('hiring').enable();
                        }
                        this.sharedService.getSnifMaam().subscribe((snif) => {
                            this.snifMaamArrSaved = snif.body;
                            this.info.patchValue({
                                snifMaam: responseRest.snifMaam
                                    ? snif.body.find(
                                        (cty) => cty.snifMaamId === responseRest.snifMaam
                                    )
                                    : ''
                            });
                            this.snifMaamArr = this.addPriemerObject(this.snifMaamArrSaved);
                        });

                        this.sharedService.getAssessor().subscribe((assessor) => {
                            this.assessorArrSaved = assessor.body;
                            this.info.patchValue({
                                assessor: responseRest.assessor
                                    ? assessor.body.find(
                                        (cty) => cty.assessorId === responseRest.assessor
                                    )
                                    : ''
                            });
                            this.assessorArr = this.addPriemerObject_assessor(
                                this.assessorArrSaved
                            );
                        });
                    });

                this.bookKeepingCust();
            });
    }


    bookKeepingCust() {
        this.sharedService
            .bookKeepingCust({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                this.bookKeepingCustRes = response ? response['body'] : response;
                this.sharedService
                    .companyGetCustomer({
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        sourceProgramId:
                        this.userService.appData.userData.companySelect.sourceProgramId
                    })
                    .subscribe((resp) => {
                        if (this.infoModal) {
                            let supplierTaxDeductionCustId =
                                this.bookKeepingCustRes.supplierTaxDeductionCustId;
                            if (supplierTaxDeductionCustId) {
                                supplierTaxDeductionCustId =
                                    this.userService.appData.userData.companyCustomerDetails.customerTaxDeductionCustIdExpenseArr.find(
                                        (it) => it.custId === supplierTaxDeductionCustId
                                    );
                            } else {
                                this.show_modal_report856 = true;
                            }
                            this.infoModal.patchValue({
                                supplierTaxDeductionCustId: supplierTaxDeductionCustId || null
                            });
                        }
                    });
            });
    }

    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    updateValues(param: string, val: any) {
        if (param === 'folderPlus') {
            if (val) {
                this.showReceivingFilesModal = true;
            } else {
                this.showUpdateFolderPlusModal = true;
            }
        } else {
            const pbj = {};
            pbj[param] = val;
            this.info.patchValue(pbj);
            this.updateCompany(param === 'esderMaam');
        }
    }

    updateValues_report856() {
        const pbj = {};
        pbj['report856'] = false;
        this.info.patchValue(pbj);
    }

    setReport856() {
        if (this.infoModal.invalid) {
            BrowserService.flattenControls(this.infoModal).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }
        this.sharedService
            .setReport856({
                companyId: this.userService.appData.userData.companySelect.companyId,
                supplierTaxDeductionCustId: this.infoModal.get(
                    'supplierTaxDeductionCustId'
                ).value
                    ? this.infoModal.get('supplierTaxDeductionCustId').value.custId
                    : null,
                customerTaxDeductionCustId: null,
                report856: true
            })
            .subscribe(() => {
                const pbj = {};
                pbj['report856'] = true;
                this.info.patchValue(pbj);
                this.bookKeepingCust();
            });
    }

    addPriemerObject(arr: any) {
        if (
            arr &&
            arr.length &&
            this.info.get('snifMaam').value &&
            this.info.get('snifMaam').value.snifMaamId
        ) {
            return [
                {
                    snifMaamId: null,
                    snifMaamName: 'ביטול בחירה'
                },
                ...arr
            ];
        } else {
            return arr;
        }
    }

    addPriemerObject_assessor(arr: any) {
        if (
            arr &&
            arr.length &&
            this.info.get('assessor').value &&
            this.info.get('assessor').value.assessorId
        ) {
            return [
                {
                    assessorId: null,
                    assessorName: 'ביטול בחירה'
                },
                ...arr
            ];
        } else {
            return arr;
        }
    }

    updateCompany(showToast?: boolean) {
        // debugger;
        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }
        const params = {
            companyId: this.userService.appData.userData.companySelect.companyId,
            assessor: this.info.get('assessor').value
                ? this.info.get('assessor').value.assessorId
                : null,
            snifMaam: this.info.get('snifMaam').value
                ? this.info.get('snifMaam').value.snifMaamId
                : null,
            sourceProgramId: this.info.get('sourceProgramId').value,
            // yearlyProgram: this.info.get('yearlyProgram').value,
            vatReportType: this.info.get('vatReportType').value,
            dbName: this.info.get('dbName').value,
            esderMaam: this.info.get('esderMaam').value,
            report856: this.info.get('report856').value,
            mikdamotPrc: this.info.get('mikdamotPrc').value,
            hiring: this.info.get('hiring').value,
            nikuiMasNum: this.info.get('nikuiMasNum').value,
            nikuiExpirationDate: this.info.get('nikuiExpirationDate').value,
            folderPlus: this.info.get('folderPlus').value
        };

        this.assessorArr = this.addPriemerObject_assessor(this.assessorArrSaved);
        this.snifMaamArr = this.addPriemerObject(this.snifMaamArrSaved);

        console.log('params: ', params);
        if (showToast) {
            this.reportService.postponed = {
                action: null,
                message: this.sanitizer.bypassSecurityTrustHtml(
                    'שינוי זה יחול מתקופת הדיווח הבאה'
                ),
                fired: false
            };
            timer(3000).subscribe(() => {
                this.reportService.postponed = null;
            });
            this.generalComponent.startCounter();
            // this.showModalEsderMaam = true;
        }
        this.sharedService.updateGeneral(params).subscribe(() => {
            if (showToast) {
                this.generalComponent.resReceived();
            }
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


    hideReceivingFilesModal($event) {
        if (!$event) {
            this.info.patchValue({
                folderPlus: false
            });
            this.showReceivingFilesModal = false;
        }
    }

    hideUpdateFolderPlusModal($event) {
        if (!$event) {
            this.info.patchValue({
                folderPlus: true
            });
            this.showUpdateFolderPlusModal = false;
        }
    }

    updateFolderPlusStatus() {
        this.showReceivingFilesModal = false;
        const pbj = {};
        pbj['folderPlus'] = true;
        this.info.patchValue(pbj);
        this.updateCompany(false);
    }

    updateFolderPlusStatusManual() {
        this.showUpdateFolderPlusModal = false;
        const pbj = {};
        pbj['folderPlus'] = false;
        this.info.patchValue(pbj);
        this.updateCompany(false);
    }


    dbYearHistory() {
        this.sharedService
            .dbYearHistory({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                const responseRest = response ? response['body'] : response;
                console.log(responseRest);
                this.dbYearHistoryArr = responseRest;
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
