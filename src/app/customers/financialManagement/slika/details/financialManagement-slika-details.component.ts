import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {SortPipe} from '@app/shared/pipes/sort.pipe';

import {ActivatedRoute, Router} from '@angular/router';

import {StorageService} from '@app/shared/services/storage.service';
import {HttpErrorResponse} from '@angular/common/http';
import {CustomersFinancialManagementSlikaComponent} from '../customers-financialManagement-slika.component';
import {Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, take} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {Paginator} from 'primeng/paginator';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {DomSanitizer} from '@angular/platform-browser';
import {SolekSelectComponent} from '@app/shared/component/solek-select/solek-select.component';
import {UserDefaultsResolver} from '../../user-defaults-resolver.service';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {ReportService} from '@app/core/report.service';
// tslint:disable-next-line:max-line-length
import {
    ClearingAgenciesDateRangeSelectorComponent
} from '@app/shared/component/date-range-selectors/clearingAgencies-date-range-selector.component';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './financialManagement-slika-details.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementSlikaDetailsComponent
    extends ReloadServices
    implements OnDestroy, OnInit, AfterViewInit {
    public accountBalance: number;
    public creditLimit: number;
    public balanceUse: number;
    public accountSelectExchange: any = false;
    public accountSelectInDeviation: any = false;
    public accountSelectOneNotUpdate: any = false;
    public dataTableInside: any[] = [];
    public dataTable: any[] = [];
    public dataTableAll: any;
    private searchableList = [
        'solekTypeId',
        'solekTypeName',
        'solekBankId',
        'solekBankName',
        'solekDesc',
        'solekNickname',
        'regularPaymentsTotal',
        'paymentsTotal',
        'transTotal',
        'expectedPercent',
        'cycleTotalZefi'
    ];
    private searchableListTypes = ['solekTypeId'];
    public queryString = '';
    public currentPage = 0;
    public entryLimit = 50;
    public filterInput = new FormControl();
    public loader = false;
    public sortableIdGr: any[];
    // public subscription: Subscription;
    @ViewChild('paginator') paginator: Paginator;

    @ViewChild(ClearingAgenciesDateRangeSelectorComponent)
    childDates: ClearingAgenciesDateRangeSelectorComponent;
    // @ViewChild(SolekDatesComponent) childDates: SolekDatesComponent;

    @ViewChild(SolekSelectComponent) solekSelector: SolekSelectComponent;
    @ViewChild('scrollContainer') scrollContainer: ElementRef;

    selectedSolkim: any[];
    selectedSolkimOutdated: any[];
    allSelectedSolkimOutdatedBecauseNotFound: boolean;

    public indexOpenedRows: any[] = [];

    cardTypesArr: any[];
    filterCardTypes: any[];
    selectedSolkimSums: {
        futureBallance: number | null;
        futureCharges: number | null;
        futureCredits: number | null;
    } = {
        futureBallance: null,
        futureCharges: null,
        futureCredits: null
    };
    reportMailSubmitterToggle = false;
    public selectedSolkimArr: any;
    private selectedRangeSub: Subscription;
    private slikaDetailsSub: Subscription;

    get companyId(): string {
        return this.userService.appData.userData.companySelect !== null
            ? this.userService.appData.userData.companySelect.companyId
            : null;
    }

    private readonly queryChangeSub: Subscription;

    constructor(
        private _element: ElementRef,
        private renderer: Renderer2,
        private _sanitizer: DomSanitizer,
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        private customersFinancialManagementSlikaComponent: CustomersFinancialManagementSlikaComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private storageService: StorageService,
        private router: Router,
        private route: ActivatedRoute,
        private defaultsResolver: UserDefaultsResolver,
        private sumPipe: SumPipe,
        private reportService: ReportService
    ) {
        super(sharedComponent);

        // if (this.userService.appData.userData.slika) {
        //    // debugger;
        //     this.getSlikaDetails();
        //
        // } else {
        //     this.subscription = customersFinancialManagementSlikaComponent.getDataSolekEvent.subscribe(() => {
        //         debugger;
        //         this.getSlikaDetails();
        //     });
        // }

        this.queryChangeSub = this.filterInput.valueChanges
            .pipe(
                debounceTime(300),
                filter((val) => !val || val.length > 1),
                distinctUntilChanged()
            )
            .subscribe((term) => {
                this.queryString = term;
                this.filtersAll();
            });
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngAfterViewInit() {
        this.selectedRangeSub = this.childDates.selectedRange
            .pipe(
                filter(() => {
                    const selectedSolkim = this.userService.selectedSolkim();
                    return Array.isArray(selectedSolkim) && selectedSolkim.length > 0;
                })
            )
            .subscribe((rng) => this.filterDates(rng));
    }

    ngOnInit(): void {
        this.defaultsResolver.userDefaultsSubject.subscribe((userDefaults) => {
            console.log('resolved data ===> %o, userDefaults: %o', userDefaults);
            this.entryLimit =
                userDefaults && userDefaults.numberOfRowsPerTable
                    ? +userDefaults.numberOfRowsPerTable
                    : 50;
        });
    }

    paginate(event) {
        console.log('paginate ===> %o', event);

        if (this.entryLimit !== +event.rows) {
            this.entryLimit = +event.rows;
            // this.storageService.sessionStorageSetter('bankAccount-details-rowsPerPage', event.rows);
            this.defaultsResolver.setNumberOfRowsAt(this.entryLimit);
        }

        if (this.currentPage !== +event.page) {
            this.scrollContainer.nativeElement.scrollTop = 0;
        }
        this.currentPage = event.page;
        // this.storageService.sessionStorageSetter('Slika-details-rowsPerPage', event.rows);
    }

    getSlikaDetails(): void {
        this.loader = true;
        // let arrCards = [];
        // let cardsCheck = [];
        // this.userService.appData.userData.slika.forEach((id) => {
        //   cardsCheck = id.children.filter((card) => {
        //     return card.check;
        //   });
        //   const cards = cardsCheck.map((card) => card.oldestCycleDate)
        //     .filter((val) => {
        //       return val !== null;
        //     });
        //   arrCards = arrCards.concat(cards);
        // });
        // let oldestCycleDate;
        // if (arrCards.length) {
        //   oldestCycleDate = Math.min(...arrCards);
        // } else {
        //   oldestCycleDate = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).getTime();
        // }
        // this.childDates.filter('monthCredit', cardsCheck.length, oldestCycleDate);
        const fieldNames = ['futureCharges', 'futureCredits', 'futureBallance'];
        const selectedSolkimToSum = this.userService
            .selectedSolkim()
            .filter((slk) => {
                return fieldNames.some((fldName) => slk[fldName] !== null);
            });
        this.selectedSolkimArr = selectedSolkimToSum;
        this.selectedSolkimSums = selectedSolkimToSum.length
            ? selectedSolkimToSum.reduce(
                (acmltr, slk) => {
                    fieldNames.forEach((fieldName) => {
                        if (fieldName in slk && slk[fieldName] !== null) {
                            if (acmltr[fieldName] !== null) {
                                acmltr[fieldName] += +slk[fieldName];
                            } else {
                                acmltr[fieldName] = +slk[fieldName];
                            }
                        }
                    });
                    return acmltr;
                },
                {
                    futureBallance: null,
                    futureCharges: null,
                    futureCredits: null
                }
            )
            : {
                futureBallance: null,
                futureCharges: null,
                futureCredits: null
            };
        if (
            fieldNames.every((fldName) => this.selectedSolkimSums[fldName] !== null)
        ) {
            this.selectedSolkimSums.futureBallance =
                this.selectedSolkimSums.futureCredits +
                this.selectedSolkimSums.futureCharges;
        }

        this.childDates.selectedRange.pipe(take(1)).subscribe((rng) => {
            this.filterDates(rng);
        });
        // this.childDates.filter('monthCredit');
        // this.filterDates(this.childDates.selectedPeriod);
    }

    filterDates(paramDate: any): void {
        this.loader = true;

        if (this.slikaDetailsSub) {
            this.slikaDetailsSub.unsubscribe();
        }

        this.selectedSolkim = this.userService.selectedSolkim();
        this.selectedSolkimOutdated = this.selectedSolkim.filter(
            (slk) => !slk.balanceIsUpToDate
        );
        this.allSelectedSolkimOutdatedBecauseNotFound =
            this.selectedSolkimOutdated.every(
                (slk) => slk.alertStatus === 'Not found in bank website'
            );

        if (this.selectedSolkim.length) {
            const arrCompanyAccountIds = this.selectedSolkim.map(
                (solek) => solek.companyAccountId
            );
            this.slikaDetailsSub = this.sharedService
                .getSlikaDetails({
                    companyAccounts: arrCompanyAccountIds,
                    solekNums: this.selectedSolkim.map((slk) => slk.solekNum),
                    dateFrom: paramDate.fromDate,
                    dateTill: paramDate.toDate
                })
                .subscribe(
                    (response: any) => {
                        this.dataTableAll = response ? response['body'] : response;
                        if (this.dataTableAll && this.dataTableAll['cycleDetails']) {
                            this.dataTableAll['cycleDetails'].forEach((obj) => {
                                obj.typeTotals.forEach((obj1, idx1, arr1) => {
                                    arr1[idx1].accountNickname = this.getInfoAcc(
                                        obj1.companyAccountId,
                                        'accountNickname'
                                    );
                                    arr1[idx1].bankId = this.getInfoAcc(
                                        obj1.companyAccountId,
                                        'bankId'
                                    );
                                    obj1.solekBankName =
                                        this.translate.instant('clearingAgencies')[
                                            obj1.solekBankId
                                            ] || 'unknown';
                                    obj1.solekTypeName =
                                        this.translate.instant('clearingAgencies')[
                                            obj1.solekTypeId
                                            ] || 'unknown';
                                });
                                obj.opened = this.indexOpenedRows.includes(obj.date);
                            });
                        }
                        this.filtersAll();
                        this.loader = false;
                    },
                    (err: HttpErrorResponse) => {
                        this.loader = false;
                        if (err.error instanceof Error) {
                            console.log('An error occurred:', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
        } else {
            this.dataTableAll = [];
            this.filtersAll();
            this.loader = false;
        }
    }

    getSolekDesk(item: any): any {
        const findSolek = this.selectedSolkimArr.find(
            (it) =>
                it.solekNum === item.solekNum &&
                it.companyAccountId === item.companyAccountId
        );
        if (findSolek) {
            return findSolek.solekDesc;
        } else {
            return '';
        }
    }

    setIndexRowCollapse(opened, cycleDate): void {
        if (opened) {
            this.indexOpenedRows.push(cycleDate);
        } else {
            const getIdx = this.indexOpenedRows.findIndex((element) => {
                return element === cycleDate;
            });
            if (getIdx > -1) {
                this.indexOpenedRows.splice(getIdx, 1);
            }
        }
    }

    clickToPackages(): void {
        if (this.userService.appData.userData.companySelect.lite) {
            if (
                this.userService.appData.userData.companySelect.trialBlocked &&
                this.userService.appData.userData.companySelect.trialBlocked === true
            ) {
                this.sharedService.announceMissionGetCompanies('trialBlocked');
            } else {
                this.router.navigate(
                    [
                        !this.userService.appData.userData.accountant
                            ? '/cfl/packages'
                            : '/accountants/companies/packages'
                    ],
                    {
                        queryParamsHandling: 'preserve',
                        relativeTo: this.route
                    }
                );
            }
        }
    }

    filtersAll(priority?: string): void {
        const duplicateObject =
            this.dataTableAll &&
            this.dataTableAll['cycleDetails'] &&
            this.dataTableAll['cycleDetails'].length
                ? JSON.parse(JSON.stringify(this.dataTableAll['cycleDetails']))
                : [];
        duplicateObject.forEach((gr) => {
            gr.opened = this.indexOpenedRows.includes(gr.date);

            gr.typeTotals.forEach((item) => {
                const findSolek = this.selectedSolkimArr.find(
                    (it) =>
                        it.solekNum === item.solekNum &&
                        it.companyAccountId === item.companyAccountId
                );
                if (findSolek) {
                    item.solekDesc = findSolek.solekDesc;
                } else {
                    item.solekDesc = '';
                }
            });
        });
        this.dataTable = this.filterPipe.transform(
            [].concat(duplicateObject),
            this.queryString,
            this.searchableList,
            'typeTotals'
        );
        if (priority !== 'filterTypes') {
            this.rebuildCardTypesMap(this.dataTable);
        }
        this.dataTable = this.filterPipe.transform(
            this.dataTable,
            this.filterCardTypes,
            this.searchableListTypes,
            'typeTotals'
        );
        this.dataTable.forEach((dayGroup) => {
            Object.assign(
                dayGroup.total,
                dayGroup.typeTotals.reduce(
                    (acmltr, typeTotal) => {
                        for (const propName in acmltr) {
                            if (typeTotal[propName] === null) {
                                acmltr[propName] = null;
                            } else if (acmltr[propName] !== null) {
                                acmltr[propName] += +typeTotal[propName];
                            }
                        }
                        return acmltr;
                    },
                    {
                        paymentsTotal: 0,
                        regularPaymentsTotal: 0,
                        transTotal: 0
                    }
                )
            );
            // dayGroup.total = dayGroup.typeTotals.reduce((acmltr, typeTotal) => {
            //     for (const propName in acmltr) {
            //         if (typeTotal[propName] === null) {
            //             acmltr[propName] = null;
            //         } else if (acmltr[propName] !== null) {
            //             acmltr[propName] += typeTotal[propName];
            //         }
            //     }
            //     return acmltr;
            // }, {
            //     cycleTotalZefi: 0,
            //     expectedPercent: 0,
            //     paymentsTotal: 0,
            //     regularPaymentsTotal: 0,
            //     transTotal: 0
            // });
        });

        if (this.dataTable && (this.filterCardTypes || this.queryString)) {
            this.dataTable
                .filter((gr) => gr.typeTotals && gr.typeTotals.length && !gr.opened)
                .forEach((gr) => (gr.opened = true));
        }

        this.loader = false;
        this.currentPage = 0;
        this.paginator.changePage(0);
    }

    collapseOpen(open: boolean): void {
        if (open) {
            this.indexOpenedRows = this.dataTable.map((gr) => {
                return gr.date;
            });
        } else {
            this.indexOpenedRows.length = 0;
        }

        this.dataTable.forEach((gr) => {
            gr.opened = this.indexOpenedRows.includes(gr.date);
        });
        // this.dataTable.forEach(gr => gr.opened = open);
        // this.dataTableAll['cycleDetails'].forEach((parent, idx, arr) => {
        //     arr[idx].opened = open;
        // });
        // this.filtersAll();
    }

    getInfoAcc(id: string, param: string): any {
        try {
            if (id !== null && param !== undefined) {
                return this.userService.appData.userData.accounts.filter((account) => {
                    return account.companyAccountId === id;
                })[0][param];
            } else {
                return '';
            }
        } catch (e) {
            return '';
        }
    }

    ngOnDestroy() {
        // if (this.subscription) {
        //     this.subscription.unsubscribe();
        // }
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.slikaDetailsSub) {
            this.slikaDetailsSub.unsubscribe();
        }
        if (this.queryChangeSub) {
            this.queryChangeSub.unsubscribe();
        }
        this.destroy();
    }

    selectSolek(solek: any): void {
        this.storageService.sessionStorageSetter(
            SolekSelectComponent.storageKey(this.route),
            JSON.stringify([solek.solekNum])
        );

        this.solekSelector.applySelection([
            {companyAccountId: solek.companyAccountId, solekNum: solek.solekNum}
        ]);
    }

    private rebuildCardTypesMap(withOtherFiltersApplied: any[]): void {
        const selectAllItem = {
            val: this.translate.translations[this.translate.currentLang].filters.all,
            id: 'all',
            checked: true
        };
        const cardTypesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRowParent) => {
                if (dtRowParent.typeTotals) {
                    dtRowParent.typeTotals.forEach((dtRow) => {
                        if (dtRow.solekTypeId && !acmltr[dtRow.solekTypeId]) {
                            acmltr[dtRow.solekTypeId] = {
                                val:
                                    this.translate.translations[this.translate.currentLang]
                                        .clearingAgencies[dtRow.solekTypeId] ||
                                    dtRow.solekTypeId.toString(),
                                id: dtRow.solekTypeId,
                                checked:
                                    !Array.isArray(this.filterCardTypes) ||
                                    this.filterCardTypes.includes(dtRow.solekTypeId)
                            };

                            if (selectAllItem.checked && !acmltr[dtRow.solekTypeId].checked) {
                                selectAllItem.checked = false;
                            }
                        }
                    });
                }
                return acmltr;
            },
            {}
        );
        this.cardTypesArr = [selectAllItem, ...Object.values(cardTypesMap)];
        // console.log('this.transTypesArr => %o', this.transTypesArr);
    }

    filterCardType(type: any) {
        this.filterCardTypes = type.checked;
        this.filtersAll('filterTypes');
    }

    private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
        const additionalProperties: any =
            reportType === 'EXCEL'
                ? {
                    futureRefunds:
                        this.selectedSolkimSums.futureCredits !== null
                            ? this.selectedSolkimSums.futureCredits
                            : 0,
                    futureExpences: this.selectedSolkimSums.futureCharges
                        ? Math.abs(this.selectedSolkimSums.futureCharges)
                        : 0,
                    futureBallance: this.selectedSolkimSums.futureBallance
                        ? this.selectedSolkimSums.futureBallance
                        : 0,
                    total: this.dataTableAll.totalSum,
                    message: this.reportService.buildSolkimMessageFrom(
                        this.selectedSolkimOutdated
                    ),
                    reportDays: this.childDates.asText(),
                    companyId: this.companyId
                }
                : {
                    futureRefunds: String(
                        this.selectedSolkimSums.futureCredits !== null
                            ? this.selectedSolkimSums.futureCredits
                            : 0
                    ),
                    futureExpences: String(
                        this.selectedSolkimSums.futureCharges
                            ? Math.abs(this.selectedSolkimSums.futureCharges)
                            : 0
                    ),
                    futureBallance: String(
                        this.selectedSolkimSums.futureBallance
                            ? this.selectedSolkimSums.futureBallance
                            : 0
                    ),
                    total: String(this.dataTableAll.totalSum),
                    // futureRefunds: this.sumPipe.transform(this.selectedSolkimSums.futureCredits, true),
                    // futureExpences: this.sumPipe.transform(this.selectedSolkimSums.futureCharges, true),
                    // futureBallance: this.sumPipe.transform(this.selectedSolkimSums.futureBallance, true),
                    // total: this.sumPipe.transform(this.dataTableAll.totalSum, true),
                    message: this.reportService.buildSolkimMessageFrom(
                        this.selectedSolkimOutdated
                    ),
                    reportDays: this.childDates.asText(),
                    companyId: this.companyId
                };

        return {
            additionalProperties: additionalProperties,
            data: {
                report: this.dataTable.map((gr) => {
                    const clone = JSON.parse(JSON.stringify(gr));
                    delete gr.opened;
                    gr.typeTotals.forEach((row) => {
                        [
                            'account',
                            '_appearsInBankTooltip',
                            'bankIconSrc',
                            'selectedTransType',
                            'transDateHumanizedStr'
                        ].forEach((pn) => delete row[pn]);
                    });

                    return clone;
                })
            }
        };
    }

    exportTransactions(resultFileType: string): void {
        this.reportService
            .getReport(
                'SLIKA_DETAILED',
                this.reportParamsFromCurrentView(resultFileType),
                resultFileType,
                this.reportService.prepareFilename(...this.getFilename())
            )
            .pipe(take(1))
            .subscribe((rslt) => {
            });
    }

    private getFilename() {
        return [
            this.translate.instant('menu.customers.financialManagement.slika.main'),
            'תצוגה מפורטת',
            this.childDates.asText(),
            this.userService.appData.userData.companySelect.companyName
        ];
    }

    sendTransactions(mailAddress: string): void {
        const request = this.reportParamsFromCurrentView();
        Object.assign(request.additionalProperties, {
            mailTo: mailAddress,
            screenName: this.getFilename().join(' ')
        });
        this.reportService
            .emailReport('SLIKA_DETAILED', request)
            .pipe(take(1))
            .subscribe((rslt) => {
                this.reportMailSubmitterToggle = false;
            });
    }

    printTransactions(): void {
        this.reportService
            .printReport(
                'SLIKA_DETAILED',
                this.reportParamsFromCurrentView('PDF'),
                'PDF',
                this.getFilename().join(' ')
            )
            .pipe(take(1))
            .subscribe((rslt) => {
            });
    }
}
