import {Component, Input, OnDestroy, OnInit, ViewChildren, ViewEncapsulation} from '@angular/core';
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
import {debounceTime, distinctUntilChanged, map, tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {ReloadServices} from '@app/shared/services/reload.services';
import {DatePipe} from '@angular/common';
import {FormControl} from '@angular/forms';
import {OverlayPanel} from 'primeng/overlaypanel';

@Component({
    templateUrl: './company-products.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CompanyProductsComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public currentPage: number = 0;
    public entryLimit: number = 50;
    @Input() counter: any = 10;
    public sortPipeDir: any = null;
    public queryParam: any = null;
    public queryString = '';
    public filterInput: FormControl = new FormControl();
    public companyFilesSortControl: FormControl = new FormControl({
        orderBy: 'dateCreated',
        order: 'DESC'
    });
    public loader = false;
    public companies: any = false;
    public companiesSrc: any = false;
    public companyDataObj: any = false;
    @ViewChildren('tooltipMoreData') tooltipMoreDataRef: OverlayPanel;
    public selectedCompany: any;
    public companyNameArr: any[];
    public filterTypesCompanyName: any = null;
    public izuBankArr: any[];
    public filterTypesIzuBank: any = null;
    public izuCreditArr: any[];
    public filterTypesIzuCredit: any = null;
    public journalVendorAndCustomerArr: any[];
    public filterTypesJournalVendorAndCustomer: any = null;
    public journalBankArr: any[];
    public filterTypesJournalBank: any = null;
    public journalCreditArr: any[];
    public filterTypesJournalCredit: any = null;
    public contactsArr: any[];
    public filterTypesContacts: any = null;
    public rowSums = {
        izuBank: 0,
        izuCredit: 0,
        journalVendorAndCustomer: 0,
        journalBank: 0,
        journalCredit: 0
    };
    public componentRefChild: any;
    public rightSideTooltip: any = 0;
    private readonly destroyed$ = new Subject<void>();
    private readonly dtPipe: DatePipe;

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
        this.dtPipe = new DatePipe('en-IL');

        this.filterInput.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((term) => {
                this.queryString = term;
                this.filtersAll();
            });
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngOnInit(): void {
        if (!this.userService.appData.userData.companies) {
            this.sharedComponent.getDataEvent.subscribe((companiesExist) => {
                if (companiesExist) {
                    this.getCompanyProducts();
                }
            });
        } else {
            this.getCompanyProducts();
        }
    }

    onActivate(componentRef: any) {
        this.componentRefChild = componentRef;
        this.componentRefChild.selectedCompany = this.selectedCompany;
    }

    hoverCompanyName(companyId: any, tooltipMoreData: any, event: any) {
        this.rightSideTooltip =
            window.innerWidth -
            (event.target.offsetLeft + event.target.offsetWidth) -
            33;

        this.sharedService
            .getCompanyData({
                uuid: companyId
            })
            .pipe(
                tap(() => {
                    this.companyDataObj = false;
                }),
                map((response: any) => {
                    if (response && !response.error && response.body) {
                        return response.body;
                    } else {
                        return {};
                    }
                }),
                tap((data: any) => {
                    this.companyDataObj = data;
                    // tooltipMoreData.show(event);
                })
            )
            .subscribe(() => {
            });
    }

    getCompanyProducts(): void {
        this.loader = true;

        this.sharedService.products().subscribe((response: any) => {
            const products = response ? response['body'] : response;
            // addProduct: false
            // bankExport: true
            // bankJournal: false
            // companyColor: "RED"
            // companyId: "36ed09c5-8e14-40d9-862c-ad8cba16f1df"
            // contacts: null
            // creditExport: false
            // creditJournal: true
            // supplierJournal: true

            const goToCompanyProducts = this.storageService.localStorageGetterItem(
                'goToCompanyProducts'
            );
            this.companiesSrc = JSON.parse(JSON.stringify(products));
            this.companiesSrc.forEach((company, idx) => {
                company.active =
                    goToCompanyProducts && company.companyId === goToCompanyProducts;
                company.izuBank = company.bankExport;
                company.izuCredit = company.creditExport;
                company.journalVendorAndCustomer = company.supplierJournal;
                company.journalBank = company.bankJournal;
                company.journalCredit = company.creditJournal;
                company.contactsList =
                    company.contacts && company.contacts.length ? company.contacts : [];
                company.contactsListTootip = company.contactsList.join('\n');
                // company.hasAllTheProducts = company.izuBank && company.izuCredit && company.journalVendorAndCustomer && company.journalBank && company.journalCredit;
                company.hasAllTheProducts = !company.addProduct;
                const additional = this.userService.appData.userData.companies.find(
                    (item) => item.companyId === company.companyId
                );
                this.companiesSrc[idx] = Object.assign(
                    additional ? additional : {},
                    company
                );
            });
            if (goToCompanyProducts) {
                this.storageService.localStorageRemoveItem('goToCompanyProducts');
            }
            // console.log('companies: ', this.companiesSrc);
            if (!Array.isArray(this.companiesSrc)) {
                this.companiesSrc = [];
            }
            if (this.companiesSrc && this.companiesSrc.length) {
                this.filterInput.enable();
            } else {
                this.filterInput.disable();
            }
            this.companies = JSON.parse(JSON.stringify(this.companiesSrc));
            this.filtersAll();
        });

        // this.sharedService.journalTrans()
        //     .subscribe((response:any) => {
        //         const journalTrans = (response) ? response['body'] : response;
        //         this.companiesSrc = JSON.parse(JSON.stringify(journalTrans));
        //         this.companiesSrc.forEach((company, idx) => {
        //             company.izuBank = true;
        //             company.izuCredit = true;
        //             company.journalVendorAndCustomer = true;
        //             company.journalBank = idx === 2;
        //             company.journalCredit = true;
        //             company.contactsList = [
        //                 'איש קשר_' + idx,
        //                 'איש קשר משותף',
        //                 'אבג_' + idx
        //             ];
        //             company.contactsListTootip = company.contactsList.join('\n');
        //             company.hasAllTheProducts = company.izuBank && company.izuCredit && company.journalVendorAndCustomer && company.journalBank && company.journalCredit;
        //             const additional = this.userService.appData.userData.companies.find(item => item.companyId === company.companyId);
        //             this.companiesSrc[idx] = Object.assign((additional ? additional : {}), company);
        //         });
        //         // console.log('companies: ', this.companiesSrc);
        //         if (!Array.isArray(this.companiesSrc)) {
        //             this.companiesSrc = [];
        //         }
        //         if (this.companiesSrc && this.companiesSrc.length) {
        //             this.filterInput.enable();
        //         } else {
        //             this.filterInput.disable();
        //         }
        //         this.companies = JSON.parse(JSON.stringify(this.companiesSrc));
        //         this.filtersAll();
        //     });
    }

    resetActive() {
        this.companiesSrc.forEach((company, idx) => {
            company.active = false;
        });
        this.companies.forEach((company, idx) => {
            company.active = false;
        });
    }

    aaaa(tooltipMoreData, $event) {
        setTimeout(() => {
            tooltipMoreData.show($event);
        }, 1000);
    }

    onScrollCubes(i?: number): void {
        this.tooltipMoreDataRef['_results'].forEach((it, idx) => {
            if (i !== undefined && idx !== i) {
                it.hide();
            }
            if (i === undefined) {
                it.hide();
            }
        });
    }

    trackById(index: number, val: any): number {
        return val.companyId;
    }

    paginate(event) {
        this.entryLimit = Number(event.rows);
        this.currentPage = event.page;
    }

    filterCategory(type: any) {
        console.log('----------------type-------', type);
        if (type.type === 'companyName') {
            this.filterTypesCompanyName = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'izuBank') {
            this.filterTypesIzuBank = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'izuCredit') {
            this.filterTypesIzuCredit = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'journalVendorAndCustomer') {
            this.filterTypesJournalVendorAndCustomer = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'journalBank') {
            this.filterTypesJournalBank = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'journalCredit') {
            this.filterTypesJournalCredit = type.checked;
            this.filtersAll(type.type);
        } else if (type.type === 'contacts') {
            this.filterTypesContacts = type.checked;
            this.filtersAll(type.type);
        }
    }

    filtersAll(priority?: string): void {
        if (
            this.companiesSrc &&
            Array.isArray(this.companiesSrc) &&
            this.companiesSrc.length
        ) {
            this.companies = !this.queryString
                ? this.companiesSrc
                : this.companiesSrc.filter((fd) => {
                    return [fd.companyName, fd.companyHp]
                        .filter(
                            (v) => (typeof v === 'string' || typeof v === 'number') && !!v
                        )
                        .some((vstr) => vstr.toString().includes(this.queryString));
                });

            if (priority === 'companyName') {
                if (this.filterTypesCompanyName && this.filterTypesCompanyName.length) {
                    this.companies = this.companies.filter((item) => {
                        if (item.companyId !== undefined && item.companyId !== null) {
                            return this.filterTypesCompanyName.some(
                                (it) => it === item.companyId.toString()
                            );
                        }
                    });
                } else if (
                    this.filterTypesCompanyName &&
                    !this.filterTypesCompanyName.length
                ) {
                    this.companies = [];
                }
            }
            if (priority === 'contacts') {
                if (this.filterTypesContacts && this.filterTypesContacts.length) {
                    this.companies = this.companies.filter((item) => {
                        if (
                            item.contactsList !== undefined &&
                            item.contactsList !== null &&
                            item.contactsList.length
                        ) {
                            return this.filterTypesContacts.some((it) =>
                                item.contactsList.some((it2) => it2 === it.toString())
                            );
                        }
                    });
                } else if (
                    this.filterTypesContacts &&
                    !this.filterTypesContacts.length
                ) {
                    this.companies = [];
                }
            }
            if (priority === 'izuBank') {
                if (this.filterTypesIzuBank && this.filterTypesIzuBank.length) {
                    this.companies = this.companies.filter((item) => {
                        if (item.izuBank !== undefined && item.izuBank !== null) {
                            return this.filterTypesIzuBank.some(
                                (it) => it === item.izuBank.toString()
                            );
                        }
                    });
                } else if (this.filterTypesIzuBank && !this.filterTypesIzuBank.length) {
                    this.companies = [];
                }
            }
            if (priority === 'izuCredit') {
                if (this.filterTypesIzuCredit && this.filterTypesIzuCredit.length) {
                    this.companies = this.companies.filter((item) => {
                        if (item.izuCredit !== undefined && item.izuCredit !== null) {
                            return this.filterTypesIzuCredit.some(
                                (it) => it === item.izuCredit.toString()
                            );
                        }
                    });
                } else if (
                    this.filterTypesIzuCredit &&
                    !this.filterTypesIzuCredit.length
                ) {
                    this.companies = [];
                }
            }
            if (priority === 'journalVendorAndCustomer') {
                if (
                    this.filterTypesJournalVendorAndCustomer &&
                    this.filterTypesJournalVendorAndCustomer.length
                ) {
                    this.companies = this.companies.filter((item) => {
                        if (
                            item.journalVendorAndCustomer !== undefined &&
                            item.journalVendorAndCustomer !== null
                        ) {
                            return this.filterTypesJournalVendorAndCustomer.some(
                                (it) => it === item.journalVendorAndCustomer.toString()
                            );
                        }
                    });
                } else if (
                    this.filterTypesJournalVendorAndCustomer &&
                    !this.filterTypesJournalVendorAndCustomer.length
                ) {
                    this.companies = [];
                }
            }
            if (priority === 'journalBank') {
                if (this.filterTypesJournalBank && this.filterTypesJournalBank.length) {
                    this.companies = this.companies.filter((item) => {
                        if (item.journalBank !== undefined && item.journalBank !== null) {
                            return this.filterTypesJournalBank.some(
                                (it) => it === item.journalBank.toString()
                            );
                        }
                    });
                } else if (
                    this.filterTypesJournalBank &&
                    !this.filterTypesJournalBank.length
                ) {
                    this.companies = [];
                }
            }
            if (priority === 'journalCredit') {
                if (
                    this.filterTypesJournalCredit &&
                    this.filterTypesJournalCredit.length
                ) {
                    this.companies = this.companies.filter((item) => {
                        if (
                            item.journalCredit !== undefined &&
                            item.journalCredit !== null
                        ) {
                            return this.filterTypesJournalCredit.some(
                                (it) => it === item.journalCredit.toString()
                            );
                        }
                    });
                } else if (
                    this.filterTypesJournalCredit &&
                    !this.filterTypesJournalCredit.length
                ) {
                    this.companies = [];
                }
            }
            if (priority !== 'companyName') {
                this.rebuildCompaniesNames(this.companies);
            }
            if (priority !== 'contacts') {
                this.rebuildContacts(this.companies);
            }

            if (priority !== 'izuBank') {
                this.izuBankArr = [
                    {
                        checked: true,
                        id: 'all',
                        val: 'הכל'
                    },
                    {
                        checked: true,
                        id: 'true',
                        val: 'יש'
                    },
                    {
                        checked: true,
                        id: 'false',
                        val: 'אין'
                    }
                ];
            }
            if (priority !== 'izuCredit') {
                this.izuCreditArr = [
                    {
                        checked: true,
                        id: 'all',
                        val: 'הכל'
                    },
                    {
                        checked: true,
                        id: 'true',
                        val: 'יש'
                    },
                    {
                        checked: true,
                        id: 'false',
                        val: 'אין'
                    }
                ];
            }
            if (priority !== 'journalVendorAndCustomer') {
                this.journalVendorAndCustomerArr = [
                    {
                        checked: true,
                        id: 'all',
                        val: 'הכל'
                    },
                    {
                        checked: true,
                        id: 'true',
                        val: 'יש'
                    },
                    {
                        checked: true,
                        id: 'false',
                        val: 'אין'
                    }
                ];
            }
            if (priority !== 'journalBank') {
                this.journalBankArr = [
                    {
                        checked: true,
                        id: 'all',
                        val: 'הכל'
                    },
                    {
                        checked: true,
                        id: 'true',
                        val: 'יש'
                    },
                    {
                        checked: true,
                        id: 'false',
                        val: 'אין'
                    }
                ];
            }
            if (priority !== 'journalCredit') {
                this.journalCreditArr = [
                    {
                        checked: true,
                        id: 'all',
                        val: 'הכל'
                    },
                    {
                        checked: true,
                        id: 'true',
                        val: 'יש'
                    },
                    {
                        checked: true,
                        id: 'false',
                        val: 'אין'
                    }
                ];
            }
        } else {
            this.companies = [];
        }

        this.rowSums = {
            izuBank: this.companies.filter((it) => it.izuBank).length,
            izuCredit: this.companies.filter((it) => it.izuCredit).length,
            journalVendorAndCustomer: this.companies.filter(
                (it) => it.journalVendorAndCustomer
            ).length,
            journalBank: this.companies.filter((it) => it.journalBank).length,
            journalCredit: this.companies.filter((it) => it.journalCredit).length
        };

        this.loader = false;
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

    private rebuildCompaniesNames(withOtherFiltersApplied: any[]): void {
        const companyNameMap: { [key: string]: any } =
            withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (
                        dtRow.companyId &&
                        dtRow.companyId.toString() &&
                        !acmltr[dtRow.companyId.toString()]
                    ) {
                        acmltr[dtRow.companyId.toString()] = {
                            val: dtRow.companyName.toString(),
                            id: dtRow.companyId.toString(),
                            checked: true
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.companyId.toString()].checked
                        ) {
                            acmltr['all'].checked = false;
                        }
                    }
                    return acmltr;
                },
                {
                    all: {
                        val: this.translate.translations[this.translate.currentLang].filters
                            .all,
                        id: 'all',
                        checked: true
                    }
                }
            );
        this.companyNameArr = Object.values(companyNameMap);
        console.log('this.companyNameMap => %o', this.companyNameArr);
    }

    private rebuildContacts(withOtherFiltersApplied: any[]): void {
        const contactsMap: { [key: string]: any } = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                dtRow.contactsList.forEach((contact) => {
                    if (contact && contact.toString() && !acmltr[contact.toString()]) {
                        acmltr[contact.toString()] = {
                            val: contact.toString(),
                            id: contact.toString(),
                            checked: true
                        };

                        if (acmltr['all'].checked && !acmltr[contact.toString()].checked) {
                            acmltr['all'].checked = false;
                        }
                    }
                });

                return acmltr;
            },
            {
                all: {
                    val: this.translate.translations[this.translate.currentLang].filters
                        .all,
                    id: 'all',
                    checked: true
                }
            }
        );
        this.contactsArr = Object.values(contactsMap);
        console.log('this.contactsMap => %o', this.contactsArr);
    }
}
