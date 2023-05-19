import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {UserService} from '@app/core/user.service';

import {StorageService} from '@app/shared/services/storage.service';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {
    CashflowDateRangeSelectorComponent
} from '@app/shared/component/date-range-selectors/cashflow-date-range-selector.component';
import {BehaviorSubject, combineLatest, Observable, of, ReplaySubject} from 'rxjs';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    first,
    map,
    startWith,
    switchMap, take,
    tap,
    withLatestFrom
} from 'rxjs/operators';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {FormControl} from '@angular/forms';
import {Subscription} from 'rxjs/internal/Subscription';
import {TransTypesService} from '@app/core/transTypes.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './tazrim-daily-graph.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TazrimDailyGraphComponent
    extends ReloadServices
    implements AfterViewInit, OnInit, OnDestroy {
    public accountBalanceGraph: number;
    public creditLimitGraph: number;
    public balanceUseGraph: number;
    @ViewChild(AccountSelectComponent) accountSelector: AccountSelectComponent;

    @ViewChild(CashflowDateRangeSelectorComponent)
    childDates: CashflowDateRangeSelectorComponent;

    public dataTableAll: any[] = [];
    public loader = false;
    public ddSelectGraph: any[];
    public selectedValueGraph: 'expenses' | 'balance';
    public chartData: any;
    public showValues = false;
    // public showCreditLines = false;

    // private readonly storageKey: string;

    accountsWithHariga: {
        companyAccountId: string;
        harigaDate: Date;
    }[];

    private readonly accountSelectionChange$ = new ReplaySubject<any[]>();
    private readonly filterChanged$ = new BehaviorSubject<{
        query: string;
        categories: string[];
        paymentTypes: string[];
    }>({
        query: '',
        categories: null,
        paymentTypes: null
    });
    chartData$: Observable<any>;
    public paymentTypesArr: any[];
    public transTypesArr: any[];
    private selectedRangeRecalc$: Observable<{
        fromDate: Date | null;
        toDate: Date | null;
    }>;
    readonly queryControl = new FormControl('');
    private queryChangeSub: Subscription;
    readonly showValuesControl = new FormControl();
    readonly showCreditLinesControl = new FormControl();
    readonly showBarsControl = new FormControl(false);
    private daysScale: boolean;

    public accountSelectOneNotUpdate: boolean | number = false;

    chartDataBalance$: Observable<any>;
    accountSelectInDeviation: any[] = [];

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        public sharedService: SharedService,
        private storageService: StorageService,
        private filterPipe: FilterPipe,
        private currencySymbol: CurrencySymbolPipe,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);

        this.ddSelectGraph = [
            {
                label: this.translate.instant(
                    'menu.customers.financialManagement.bankAccount.charts.balance'
                ),
                value: 'balance'
            },
            {
                label: this.translate.instant(
                    'menu.customers.tazrim.charts.incomesAndExpenses'
                ),
                value: 'expenses'
            }
        ];

        //
        // this.storageKey = 'daily/graph-selectedGraph';
        //
        // try {
        //     this.selectedValueGraph = this.storageService.sessionStorageGetterItem(this.storageKey);
        //     if (!this.selectedValueGraph || !this.ddSelectGraph.find(slctn => slctn.value === this.selectedValueGraph)) {
        //         throw new Error('Failed to initialize selectedValueGraph from storage');
        //     }
        // } catch (e) {
        //     this.selectedValueGraph = 'balance';
        // }
        this.selectedValueGraph = 'expenses';
    }

    ngAfterViewInit(): void {

        this.selectedRangeRecalc$ = this.childDates.selectedRange.pipe(
            map(() => this.childDates.recalculateSelectedRangeIfNecessary()),
            publishRef
        );

        const accountSelectionChangeWrap$ = this.accountSelectionChange$.pipe(
            tap((accounts) => {
                if (Array.isArray(accounts) && accounts.length > 1) {
                    this.accountSelectInDeviation = accounts.filter((account) => {
                        return account.balanceUse < 0;
                    });
                } else {
                    this.accountSelectInDeviation = [];
                }
            })
        );

        const dataLoad$ = combineLatest(
            [
                accountSelectionChangeWrap$,
                this.selectedRangeRecalc$
            ]
        ).pipe(
            switchMap(([accounts, range]) => {
                // debugger;
                if (!accounts || !accounts.length) {
                    return of({body: null});
                }
                const parameters: any = {
                    companyAccountIds: accounts.map((account) => {
                        return account.companyAccountId;
                    }),
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    dateFrom: range.fromDate,
                    dateTill: range.toDate,
                    expence: -1
                };
                this.daysScale =
                    this.userService.appData
                        .moment(range.toDate)
                        .startOf('day')
                        .diff(
                            this.userService.appData.moment(range.fromDate).startOf('day'),
                            'days'
                        ) <= 31;
                return this.sharedService.cashFlowDetails(parameters);
            }),
            tap({
                next: (rslt: any) => {
                    this.accountsWithHariga =
                        !rslt || !rslt.body || !Array.isArray(rslt.body.harigaArray)
                            ? null
                            : rslt.body.harigaArray.filter(
                                (accHariga) => accHariga.harigaDate > 0
                            );
                },
                error: () => (this.accountsWithHariga = null)
            }),
            tap({
                next: (rslt) => {
                    const transactions =
                        !rslt || !rslt.body || !Array.isArray(rslt.body.cashFlowDetails)
                            ? null
                            : rslt.body.cashFlowDetails;
                    this.rebuildPaymentTypesMap(transactions);
                    this.rebuildTransTypesMap(transactions);
                },
                error: () => (this.transTypesArr = this.paymentTypesArr = null)
            }),
            tap({
                next: (rslt) => {
                    const transactions =
                        !rslt || !rslt.body || !Array.isArray(rslt.body.cashFlowDetails)
                            ? null
                            : rslt.body.cashFlowDetails;
                    if (!transactions) {
                        this.accountBalanceGraph =
                            this.creditLimitGraph =
                                this.balanceUseGraph =
                                    null;
                    } else {
                        [
                            this.accountBalanceGraph,
                            this.creditLimitGraph,
                            this.balanceUseGraph
                        ] = transactions.reduce(
                            function (acmltr, tr) {
                                if (tr.expence) {
                                    acmltr[1] += tr.total;
                                    acmltr[2] -= tr.total;
                                } else {
                                    acmltr[0] += tr.total;
                                    acmltr[2] += tr.total;
                                }

                                return acmltr;
                            },
                            [0, 0, 0]
                        );
                    }
                },
                error: () =>
                    (this.accountBalanceGraph =
                        this.creditLimitGraph =
                            this.balanceUseGraph =
                                null)
            }),
            publishRef
        );

        this.chartData$ = combineLatest(
            [
                dataLoad$,
                this.filterChanged$,
                this.showValuesControl.valueChanges.pipe(
                    startWith(this.showValuesControl.value)
                ),
                this.showBarsControl.valueChanges.pipe(
                    startWith(this.showBarsControl.value)
                )
            ]
        ).pipe(
            withLatestFrom(this.selectedRangeRecalc$),
            map(([[loaded, filterToApply], selectedRange]) => {
                if (
                    !loaded ||
                    !loaded.body ||
                    !Array.isArray(loaded.body.cashFlowDetails)
                ) {
                    this.accountBalanceGraph =
                        this.creditLimitGraph =
                            this.balanceUseGraph =
                                null;
                    return null;
                }
                let filtered = filterToApply.query
                    ? this.filterPipe.transform(
                        loaded.body.cashFlowDetails,
                        filterToApply.query,
                        ['transName']
                    )
                    : loaded.body.cashFlowDetails;
                filtered = this.filterPipe.transform(
                    filtered,
                    filterToApply.categories,
                    ['transTypeId']
                );
                filtered = this.filterPipe.transform(
                    filtered,
                    filterToApply.paymentTypes,
                    ['paymentDesc']
                );

                if (!filtered.length) {
                    this.accountBalanceGraph =
                        this.creditLimitGraph =
                            this.balanceUseGraph =
                                null;
                    return null;
                }

                if (filtered.length) {
                    [
                        this.accountBalanceGraph,
                        this.creditLimitGraph,
                        this.balanceUseGraph
                    ] = filtered.reduce(
                        function (acmltr, tr) {
                            if (tr.expence) {
                                acmltr[1] += tr.total;
                                acmltr[2] -= tr.total;
                            } else {
                                acmltr[0] += tr.total;
                                acmltr[2] += tr.total;
                            }

                            return acmltr;
                        },
                        [0, 0, 0]
                    );
                }

                // const days = [];
                // for (let dt = selectedRange.fromDate; dt < selectedRange.toDate;
                //      dt = this.userService.appData.moment(dt).add(1, 'days').toDate()) {
                //     days.push(dt);
                // }

                return Object.assign(this.createChart(filtered), {
                    fromDate: selectedRange.fromDate,
                    toDate: selectedRange.toDate // ,
                    // xAxiscategories: days
                });
            })
        );

        this.queryChangeSub = this.queryControl.valueChanges
            .pipe(
                debounceTime(500),
                filter((val) => !val || val.trim().length > 1),
                distinctUntilChanged(),
                tap((term) => {
                    this.storageService.sessionStorageSetter(
                        'daily/details-filterQuery',
                        term
                    );
                })
            )
            .subscribe((val) => {
                this.sharedComponent.mixPanelEvent('search',{value: val});

                this.filterChanged$.next({
                    query: val,
                    categories: this.filterChanged$.value.categories,
                    paymentTypes: this.filterChanged$.value.paymentTypes
                });
            });

        const detailsFilterPaymentTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'daily/details-filterPaymentTypesCategory'
            );
        if (detailsFilterPaymentTypesCategory !== null) {
            this.filterChanged$.value.paymentTypes =
                detailsFilterPaymentTypesCategory === '' ||
                detailsFilterPaymentTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterPaymentTypesCategory);
        }
        const detailsFilterTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'daily/details-filterTypesCategory'
            );
        if (detailsFilterTypesCategory !== null) {
            this.filterChanged$.value.categories =
                detailsFilterTypesCategory === '' ||
                detailsFilterTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterTypesCategory);
        }
        const detailsFilterQuery = this.storageService.sessionStorageGetterItem(
            'daily/details-filterQuery'
        );
        if (detailsFilterQuery) {
            this.filterChanged$.value.query = detailsFilterQuery;
            this.queryControl.setValue(detailsFilterQuery, {
                emitEvent: false
            });
        }

        const balanceDataLoad$ = combineLatest(
            [
                accountSelectionChangeWrap$,
                this.selectedRangeRecalc$
            ]
        ).pipe(
            tap(([accounts]) => {
                this.creditLimitGraph =
                    Array.isArray(accounts) &&
                    accounts.length &&
                    accounts.some((acc: any) => acc.creditLimit !== null)
                        ? this.userService.appData.userData.accountSelect
                            .map((acc: any) => acc.creditLimit)
                            .reduce((a, b) => a + b, 0)
                        : null;
            }),
            switchMap(([accounts, range]) => {
                // debugger;
                if (!accounts || !accounts.length) {
                    return of({body: null});
                }
                const parameters: any = {
                    companyAccountIds: accounts.map((account) => {
                        return account.companyAccountId;
                    }),
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    dateFrom: range.fromDate,
                    dateTill: range.toDate,
                    expence: -1
                };
                return this.sharedService.aggregateCashFlow(parameters);
            }),
            tap({
                next: (rslt: any) => {
                    this.accountsWithHariga = !Array.isArray(rslt.body)
                        ? null
                        : rslt.body
                            .filter((acc: any) => acc.accountUuid && acc.harigaDate > 0)
                            .map((acc: any) => {
                                return {
                                    companyAccountId: acc.accountUuid,
                                    harigaDate: acc.harigaDate
                                };
                            });
                },
                error: () => (this.accountsWithHariga = null)
            }),
            publishRef
        );

        this.chartDataBalance$ = combineLatest(
            [
                balanceDataLoad$,
                this.selectedRangeRecalc$,
                this.showValuesControl.valueChanges.pipe(
                    startWith(this.showValuesControl.value)
                ),
                this.showCreditLinesControl.valueChanges.pipe(
                    startWith(this.showCreditLinesControl.value)
                )
            ]
        ).pipe(
            map(([loaded, selectedRange]) => {
                if (!loaded || !loaded.body || !Array.isArray(loaded.body)) {
                    return null;
                }
                return Object.assign(this.createBalanceChart(loaded.body), {
                    fromDate: selectedRange.fromDate,
                    toDate: selectedRange.toDate // ,
                    // xAxiscategories: days
                });
            })
        );
    }

    ngOnDestroy(): void {
        if (this.queryChangeSub) {
            this.queryChangeSub.unsubscribe();
        }
        this.destroy();
    }

    override reload() {
        console.log('reload child');
        this.changeAcc();
    }
    sendEvent(isOpened: any) {
        if (isOpened && this.childDates) {
            this.childDates.selectedRange
                .pipe(take(1))
                .subscribe((paramDate) => {
                    this.sharedComponent.mixPanelEvent('days drop', {
                        value: paramDate.fromDate + '-' + paramDate.toDate
                    });
                });
        }
    }
    changeAcc(): void {
        // // this.loader = true;
        // this.childDates.selectedRange
        //     .pipe(
        //         filter(() => Array.isArray(this.userService.appData.userData.accountSelect)
        //             && this.userService.appData.userData.accountSelect.length)
        //     )
        //     .subscribe(() => this.filterDates(this.childDates.recalculateSelectedRangeIfNecessary()));
        // // this.childDates.filter('DaysTazrim');
        // // this.filterDates(this.childDates.selectedPeriod);
        // if (this.userService.appData.userData.accountSelect.filter((account) => {
        //     return account.currency !== 'ILS';
        // }).length) {
        //     this.sharedComponent.mixPanelEvent('accounts drop');
        // }
        const accountSelectExchange = this.userService.appData.userData.accountSelect.filter((account) => {
            return account.currency !== 'ILS';
        })
        this.sharedComponent.mixPanelEvent('accounts drop', {
            accounts:(this.userService.appData.userData.accountSelect.length === accountSelectExchange.length) ? 'כל החשבונות מט"ח' :
                (((this.userService.appData.userData.accounts.length-accountSelectExchange.length) === this.userService.appData.userData.accountSelect.length)? 'כל החשבונות' :
                    (
                        this.userService.appData.userData.accountSelect.map(
                            (account) => {
                                return account.companyAccountId;
                            }
                        )
                    ))
        });
        this.accountSelectionChange$.next(
            this.userService.appData.userData.accountSelect
        );
        this.accountSelectOneNotUpdate = false;
        if (
            this.userService.appData.userData.accountSelect.length === 1 &&
            !this.userService.appData.userData.accountSelect[0].isUpToDate
        ) {
            this.accountSelectOneNotUpdate = this.userService.appData
                .moment()
                .diff(
                    this.userService.appData.moment(
                        this.userService.appData.userData.accountSelect[0]
                            .balanceLastUpdatedDate
                    ),
                    'days'
                );
        }
    }

    // getInfoAcc(id: string, param: string): any {
    //     if (id !== null && param !== undefined) {
    //         return this.userService.appData.userData.accounts.filter((account) => {
    //             return account.companyAccountId === id;
    //         })[0][param];
    //     } else {
    //         return '';
    //     }
    // }
    //
    // getCurrencySymbol(currencyCode?: string): string {
    //     if (!currencyCode) {
    //         return null;
    //     }
    //     return getCurrencySymbol(currencyCode, 'narrow');
    // }

    selectExceededAccount(accountId: string): void {
        this.userService.appData.userData.accountSelect =
            this.userService.appData.userData.accounts.filter(
                (acc: any) => acc.companyAccountId === accountId
            );
        this.accountSelector.applyValuesFromModel();
        // this.changeAcc(null);
    }

    // filterDates(paramDate: any): void {
    //     this.loader = true;
    //     this.accountsWithHariga = null;
    //     if (!this.userService.appData.userData.accountSelect.length
    //         || this.userService.appData.userData.accountSelect.length === 1
    //         && !this.userService.appData.userData.accountSelect[0].isUpToDate) {
    //         this.dataTableAll = [];
    //         [this.accountBalanceGraph, this.creditLimitGraph, this.balanceUseGraph] = [null, null, null];
    //         this.loader = false;
    //     } else {
    //         const parameters: any = {
    //             'companyAccountIds': this.userService.appData.userData.accountSelect.map((account) => {
    //                 return account.companyAccountId;
    //             }),
    //             'companyId': this.userService.appData.userData.companySelect.companyId,
    //             'dateFrom': paramDate.fromDate,
    //             'dateTill': paramDate.toDate,
    //             'expence': -1
    //         };
    //         this.sharedService.aggregateCashFlow(parameters)
    //             .subscribe(
    //                 response => {
    //                     const dataTableAll = (response) ? response['body'] : response;
    //                     const accounts = dataTableAll.filter((account) => {
    //                         return account.accountUuid !== null;
    //                     });
    //                     const allAcc = (accounts.length === 1) ? [] : dataTableAll.filter((account) => {
    //                         return account.accountUuid === null;
    //                     });
    //                     accounts.sort((a, b) => {
    //                         return this.userService.appData.userData.accountSelect.findIndex(
    //                             (acc:any) => acc.companyAccountId === a.accountUuid)
    //                             - this.userService.appData.userData.accountSelect.findIndex(
    //                                 (acc:any) => acc.companyAccountId === b.accountUuid);
    //                     });
    //
    //                     const outdatedSelectedAccountsMap: { [k: string]: number } = this.userService.appData.userData.accountSelect
    //                         .filter(acc => !acc.isUpToDate)
    //                         .reduce((acmltr, outdatedAcc) => {
    //                             acmltr[outdatedAcc.companyAccountId] = outdatedAcc.balanceLastUpdatedDate;
    //                             return acmltr;
    //                         }, Object.create(null));
    //
    //                     accounts
    //                         .filter(acc => outdatedSelectedAccountsMap[acc.accountUuid])
    //                         .forEach((acc:any) => {
    //                             acc.accountTransactions
    //                                 .filter(trns => trns.transDate > outdatedSelectedAccountsMap[acc.accountUuid])
    //                                 .forEach(trns => [trns.zhut, trns.hova, trns.itra, trns.totalCredit] = [null, null, null, null]);
    //                         });
    //
    //                     accounts.forEach(accId => {
    //                         accId.balanceUse = (this.getInfoAcc(accId.accountUuid, 'balanceUse') < 0);
    //                         accId.isUpToDate = this.getInfoAcc(accId.accountUuid, 'isUpToDate');
    //                     });
    //                     this.dataTableAll = accounts.concat(allAcc);
    //
    //                     if (accounts.length) {
    //                         [this.accountBalanceGraph, this.creditLimitGraph] = accounts
    //                             .reduce(function (acmltr, acc) {
    //                                 if (acc.accountTransactions) {
    //                                     return acc.accountTransactions.reduce((acmltr1, dayTrns) => {
    //                                         acmltr1[0] += +dayTrns.zhut;
    //                                         acmltr1[1] += +dayTrns.hova;
    //                                         return acmltr1;
    //                                     }, acmltr);
    //                                 }
    //                                 return acmltr;
    //                             }, [null, null]);
    //                         this.balanceUseGraph = this.accountBalanceGraph - this.creditLimitGraph;
    //
    //                         this.accountsWithHariga = accounts.filter(acc => Number.isFinite(acc.harigaDate))
    //                             .map(acc => {
    //                                 return {
    //                                     companyAccountId: acc.accountUuid,
    //                                     harigaDate: acc.harigaDate
    //                                 };
    //                             });
    //                     }
    //
    //                     // let isShowNigrarotToday = false;
    //                     // this.dataTableAll.forEach((acc, index) => {
    //                     //   if (acc.hovaNigrarot !== null && acc.zhutNigrarot !== null) {
    //                     //     isShowNigrarotToday = true;
    //                     //   }
    //                     // });
    //                     // if (isShowNigrarotToday) {
    //                     //   this.dataTableAll.forEach((acc, index) => {
    //                     //     if (acc.hovaNigrarot !== null && acc.zhutNigrarot !== null) {
    //                     //       if (acc.accountTransactions) {
    //                     //         this.dataTableAll[index].accountTransactions.unshift({
    //                     //           hova: acc.accountTransactions[0].hova - acc.hovaNigrarot,
    //                     //           itra: null,
    //                     //           totalCredit: null,
    //                     //           transDate: null,
    //                     //           zhut:  acc.accountTransactions[0].zhut - acc.zhutNigrarot
    //                     //         });
    //                     //       }
    //                     //     } else {
    //                     //       if (acc.accountTransactions) {
    //                     //         this.dataTableAll[index].accountTransactions.unshift({
    //                     //           hova: null,
    //                     //           itra: null,
    //                     //           totalCredit: null,
    //                     //           transDate: null,
    //                     //           zhut: null
    //                     //         });
    //                     //       }
    //                     //     }
    //                     //   });
    //                     // }
    //
    //                     if (this.dataTableAll.length) {
    //                         // if (this.selectedValueGraph === 'expenses') {
    //                         //   [this.accountBalanceGraph, this.creditLimitGraph, this.balanceUseGraph] =
    //                         //   this.dataTableAll.reduce(function (a, b) {
    //                         //     return [a[0] + b.zhutTotal, a[1] + b.hovaTotal, a[2] + b.zhutTotal + b.hovaTotal];
    //                         //   }, [0, 0, 0]);
    //                         // }
    //                         this.updateChart();
    //                     } else {
    //                         [this.accountBalanceGraph, this.creditLimitGraph, this.balanceUseGraph] = [null, null, null];
    //                         this.loader = false;
    //                     }
    //                     this.loader = false;
    //                 }, (err: HttpErrorResponse) => {
    //                     if (err.error) {
    //                         console.log('An error occurred:', err.error.message);
    //                     } else {
    //                         console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
    //                     }
    //                 }
    //             );
    //     }
    // }
    //
    // updateChart(): void {
    //     this.loader = true;
    //     let dataTableAll = [].concat(this.dataTableAll);
    //     const currencySymbol = this.getCurrencySymbol(this.userService.appData.userData.accountSelect[0].currency);
    //     let data;
    //     const plotLines = [];
    //     // const plotLines = [{
    //     //     // color: '#d63838',
    //     //     width: 3,
    //     //     value: 0,
    //     //     dashStyle: 'ShortDash',
    //     //     zIndex: 3,
    //     //     label: {
    //     //         enabled: false
    //     //     }
    //     // }];
    //     if (this.selectedValueGraph === 'balance') {
    //         dataTableAll = dataTableAll.filter((account) => {
    //             return account.accountUuid !== null;
    //         });
    //         let maxVal = null, minVal = null;
    //         const arrMaxLines = [];
    //         let arrMaxItrot = [];
    //         const series = dataTableAll.map((id, idx) => {
    //             const arrItrot = id.accountTransactions.reduce((arrBuilder, arr) => {
    //                 arrBuilder.push({
    //                     x: arr.transDate,
    //                     y: arr.itra,
    //                     currency: this.getCurrencySymbol(this.getInfoAcc(id.accountUuid, 'currency'))
    //                 });
    //                 return arrBuilder;
    //             }, []);
    //             if (this.showCreditLines) {
    //                 const creditLimit = this.getInfoAcc(id.accountUuid, 'creditLimit');
    //                 arrMaxLines.push(creditLimit);
    //                 plotLines.push({
    //                     // color: this.getColorOfBank(this.getInfoAcc(id, 'bankId')),
    //                     // color: this.getColorRandom(idx),
    //                     width: 2,
    //                     value: creditLimit,
    //                     dashStyle: 'ShortDash',
    //                     zIndex: 3,
    //                     label: {
    //                         enabled: false
    //                     }
    //                 });
    //                 arrMaxItrot = arrMaxItrot.concat(arrItrot.map(val => val.y));
    //             }
    //             return {
    //                 cursor: 'pointer',
    //                 accountId: id.accountUuid,
    //                 name: this.getInfoAcc(id.accountUuid, 'accountNickname'),
    //                 // color: this.getColorRandom(idx),
    //                 // color: this.getColorOfBank(this.getInfoAcc(id, 'bankId')),
    //                 states: {
    //                     hover: {
    //                         lineWidth: 2
    //                     }
    //                 },
    //                 marker: {
    //                     symbol: 'circle'
    //                 },
    //                 data: arrItrot
    //             };
    //         });
    //
    //         series.sort((a, b) => this.userService.appData.userData.accountSelect
    //                 .findIndex(acc => acc.companyAccountId === a.accountId)
    //             - this.userService.appData.userData.accountSelect
    //                 .findIndex(acc => acc.companyAccountId === b.accountId));
    //
    //         if (this.showCreditLines && arrMaxLines.length && arrMaxItrot.length) {
    //             const maxValueLines = Math.max.apply(null, arrMaxLines);
    //             const maxValueItrot = Math.max.apply(null, arrMaxItrot);
    //             if (maxValueLines > maxValueItrot) {
    //                 const onePrecent = (maxValueLines / 100);
    //                 maxVal = maxValueLines + onePrecent;
    //             }
    //
    //             const minValueLines = Math.min.apply(null, arrMaxLines);
    //             const minValueItrot = Math.min.apply(null, arrMaxItrot);
    //             if (minValueLines < minValueItrot) {
    //                 const onePrecent = (Math.max(maxValueLines, maxValueItrot) / 100);
    //                 minVal = minValueLines - onePrecent;
    //             }
    //         }
    //         data = {
    //             line: true,
    //             dataLabelsEnabled: this.showValues,
    //             plotLines: plotLines,
    //             gridLineWidth: 1,
    //             markerEnabled: false,
    //             crosshair: {
    //                 width: 2,
    //                 color: '#cbc9c9'
    //             },
    //             maxY: maxVal,
    //             minY: minVal,
    //             xAxiscategories: dataTableAll[0].accountTransactions.map((dates) => dates.transDate),
    //             legend: {
    //                 enabled: true,
    //                 itemStyle: {
    //                     // color: '#adacac',
    //                     fontSize: '14px'
    //                 },
    //                 verticalAlign: 'top',
    //                 rtl: this.userService.appData.dir === 'rtl',
    //                 align: 'right',
    //                 margin: 0 // ,
    //                 // floating: true
    //             },
    //             lineWidth: 2,
    //             tooltips: [],
    //             series: series
    //         };
    //         // debugger;
    //     } else {
    //         if (dataTableAll.length > 1) {
    //             dataTableAll = dataTableAll.filter((account) => {
    //                 return account.accountUuid === null;
    //             });
    //         }
    //         data = {
    //             currencySymbol: currencySymbol,
    //             maxY: null,
    //             line: true,
    //             dataLabelsEnabled: this.showValues,
    //             plotLines: plotLines,
    //             gridLineWidth: 1,
    //             markerEnabled: this.showValues,
    //             crosshair: false,
    //             xAxiscategories: dataTableAll[0].accountTransactions.map((dates) => dates.transDate),
    //             legend: {
    //                 enabled: true,
    //                 itemStyle: {
    //                     // color: '#adacac',
    //                     fontSize: '14px'
    //                 },
    //                 verticalAlign: 'top',
    //                 rtl: this.userService.appData.dir === 'rtl',
    //                 align: 'right',
    //                 margin: 0 // ,
    //                 // floating: true
    //             },
    //             lineWidth: 2,
    //             // tooltips: [
    //             //   dataTableAll.map((param) => param.zhutDetails
    //             //     // .sort((a, b) => b.total - a.total)
    //             //     // .slice(0, 10)
    //             //   ),
    //             //   dataTableAll.map((param) => param.hovaDetails
    //             //     // .sort((a, b) => b.total - a.total)
    //             //     // .slice(0, 10)
    //             //   )
    //             // ],
    //             tooltips: dataTableAll[0].accountTransactions.map((param) => {
    //                 return {
    //                     date: param.transDate
    //                 };
    //             }),
    //             series: [{
    //                 cursor: 'pointer',
    //                 name: this.translate.instant('menu.customers.tazrim.charts.incomes'),
    //                 color: '#05ae09',
    //                 // states: {
    //                 //     hover: {
    //                 //         lineWidth: 2
    //                 //     }
    //                 // },
    //                 marker: {
    //                     symbol: 'circle'
    //                 },
    //                 data: dataTableAll[0].accountTransactions.map((param) => {
    //                     return {
    //                         x: param.transDate,
    //                         y: param.zhut
    //                     };
    //                 }),
    //                 dataLabels: {
    //                     verticalAlign: 'bottom'
    //                 }
    //             }, {
    //                 cursor: 'pointer',
    //                 name: this.translate.instant('menu.customers.tazrim.charts.expenses'),
    //                 color: '#e83939',
    //                 // states: {
    //                 //     hover: {
    //                 //         lineWidth: 2
    //                 //     }
    //                 // },
    //                 marker: {
    //                     symbol: 'circle'
    //                 },
    //                 data: dataTableAll[0].accountTransactions.map((param) => {
    //                     return {
    //                         x: param.transDate,
    //                         y: param.hova * -1
    //                     };
    //                 }),
    //                 dataLabels: {
    //                     verticalAlign: 'top'
    //                 }
    //             }]
    //         };
    //     }
    //
    //     this.childDates.selectedRange
    //         .pipe(
    //             take(1)
    //         )
    //         .subscribe((rng) => {
    //             data.fromDate = new Date(rng.fromDate);
    //             data.toDate = new Date(rng.toDate);
    //             this.chartData = data;
    //             this.loader = false;
    //         });
    //     // const selectedPeriod = this.childDates.selectedPeriod;
    //     // data.fromDate = new Date(selectedPeriod.fromDate);
    //     // data.toDate = new Date(selectedPeriod.toDate);
    //     // this.chartData = data;
    //     // this.loader = false;
    // }

    ngOnInit(): void {
        console.log('ngOnInit')
        // this.storageService.sessionStorageSetter('daily-defaultViewName', 'graph');
    }

    // onChartTypeChange(evt: any) {
    //     // this.storageService.sessionStorageSetter(this.storageKey, evt.value);
    //
    //     // this.childDates.selectedRange
    //     //     .pipe(
    //     //         take(1)
    //     //     )
    //     //     .subscribe(() => {
    //     //         this.createChart(this.childDates.recalculateSelectedRangeIfNecessary());
    //     //     });
    //     // this.filterDates(this.childDates.selectedPeriod);
    // }

    private rebuildPaymentTypesMap(withOtherFiltersApplied: any[]): void {
        const paymentTypesMap = !withOtherFiltersApplied
            ? null
            : withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (dtRow.paymentDesc && !acmltr[dtRow.paymentDesc]) {
                        acmltr[dtRow.paymentDesc] = {
                            val: dtRow.paymentDesc,
                            id: dtRow.paymentDesc,
                            checked:
                                !Array.isArray(this.filterChanged$.value.paymentTypes) ||
                                this.filterChanged$.value.paymentTypes.includes(
                                    dtRow.paymentDesc
                                )
                        };

                        if (acmltr['all'].checked && !acmltr[dtRow.paymentDesc].checked) {
                            acmltr['all'].checked = false;
                        }
                    }
                    return acmltr;
                },
                {
                    all: {
                        val: this.translate.instant('filters.all'),
                        id: 'all',
                        checked: true
                    }
                }
            );
        this.paymentTypesArr = !paymentTypesMap
            ? null
            : Object.values(paymentTypesMap);

        // this.filterChanged$.next({
        //     query: this.queryControl.value,
        //     categories: this.filterChanged$.value.categories,
        //     paymentTypes: !paymentTypesMap || paymentTypesMap['all'].checked
        //         ? null
        //         : this.paymentTypesArr.filter(tt => tt.checked).map(tt => tt.id)
        // });
        this.filterChanged$.value.paymentTypes =
            !paymentTypesMap || paymentTypesMap['all'].checked
                ? null
                : this.paymentTypesArr.filter((tt) => tt.checked).map((tt) => tt.id);
    }

    private rebuildTransTypesMap(withOtherFiltersApplied: any[]): void {
        // debugger;
        this.transTypesService.selectedCompanyTransTypes
            .pipe(first())
            .subscribe((rslt) => {
                const availableTransTypesMap = !withOtherFiltersApplied
                    ? null
                    : withOtherFiltersApplied.reduce(
                        (acmltr, tr) => {
                            if (tr.transTypeId && !acmltr[tr.transTypeId]) {
                                const companyTransType = rslt.find(
                                    (cmpnTrType) => cmpnTrType.transTypeId === tr.transTypeId
                                );
                                acmltr[tr.transTypeId] = {
                                    val: companyTransType ? companyTransType.transTypeName : '',
                                    id: tr.transTypeId,
                                    checked:
                                        !Array.isArray(this.filterChanged$.value.categories) ||
                                        this.filterChanged$.value.categories.includes(
                                            tr.transTypeId
                                        )
                                };

                                if (
                                    !acmltr[tr.transTypeId].checked &&
                                    acmltr['all'].checked
                                ) {
                                    acmltr['all'].checked = false;
                                }
                            }
                            return acmltr;
                        },
                        {
                            all: {
                                val: this.translate.instant('filters.all'),
                                id: 'all',
                                checked: true
                            }
                        }
                    );
                this.transTypesArr = !availableTransTypesMap
                    ? null
                    : Object.values(availableTransTypesMap);

                this.filterChanged$.value.paymentTypes =
                    !availableTransTypesMap || availableTransTypesMap['all'].checked
                        ? null
                        : this.paymentTypesArr
                            .filter((tt) => tt.checked)
                            .map((tt) => tt.id);
            });
    }

    private createChart(filteredData: any[]) {
        // debugger;
        if (!Array.isArray(filteredData) || !filteredData.length) {
            return null;
        }

        let repacked =
            this.selectedValueGraph === 'expenses' &&
            this.showBarsControl.value === true
                ? filteredData.reduce((acmltr: { [k: number]: any }, trns) => {
                    const key = this.daysScale
                        ? trns.transDate
                        : this.userService.appData
                            .moment(trns.transDate)
                            .startOf('month')
                            .startOf('day')
                            .valueOf();
                    if (!(key in acmltr)) {
                        acmltr[key] = {
                            date: key,
                            zhutTotal: 0,
                            hovaTotal: 0,
                            zhutDetails: [],
                            hovaDetails: []
                        };
                    }
                    trns.mainDesc = trns.transName;
                    if (trns.expence) {
                        acmltr[key].hovaTotal += trns.total * -1;
                        acmltr[key].hovaDetails.push(trns);
                    } else {
                        acmltr[key].zhutTotal += trns.total;
                        acmltr[key].zhutDetails.push(trns);
                    }

                    return acmltr;
                }, Object.create(null))
                : filteredData.reduce((acmltr, tr) => {
                    if (!acmltr[tr.transDate]) {
                        acmltr[tr.transDate] = {
                            zhutDetails: [],
                            hovaDetails: [],
                            zhut: 0,
                            hova: 0
                        };
                    }

                    const trTooltipRow = {
                        mainDesc: tr.transName,
                        total: tr.total
                    };
                    if (tr.expence) {
                        acmltr[tr.transDate].hovaDetails.push(trTooltipRow);
                        acmltr[tr.transDate].hova += tr.total;
                    } else {
                        acmltr[tr.transDate].zhutDetails.push(trTooltipRow);
                        acmltr[tr.transDate].zhut += tr.total;
                    }

                    return acmltr;
                }, Object.create(null));
        let dates;
        if (
            this.selectedValueGraph === 'expenses' &&
            this.showBarsControl.value === true
        ) {
            repacked = Object.values(repacked);
            repacked.sort((a, b) => a.date - b.date);
        } else {
            dates = Object.keys(repacked).map((dt) => +dt);
            dates.sort((a, b) => +a - +b);
        }
        // console.log(this.selectedValueGraph === 'expenses' && this.showBarsControl.value ? repacked.map((datesChild) => datesChild.date) :
        //     dates.map((dt) =>
        //     this.userService.appData.moment(dt).toDate()
        // ))

        return this.selectedValueGraph === 'expenses' && this.showBarsControl.value
            ? {
                currencySymbol: this.currencySymbol.transform(
                    this.userService.appData.userData.accountSelect[0].currency
                ),
                maxY: null,
                // line: true,
                columnGroup: true,
                dataLabelsEnabled: this.showValuesControl.value, // true,
                plotLines: [],
                gridLineWidth: 1,
                markerEnabled: this.showValuesControl.value, // true,
                crosshair: false,
                xAxiscategories: repacked.map((datesChild) => datesChild.date),
                tooltips: repacked.map((param) => {
                    return {
                        x: param.date,
                        details: [param.zhutDetails, param.hovaDetails]
                    };
                }),
                // tooltips: [
                //   dataTableAll.map((param) => param.zhutDetails
                //     // .sort((a, b) => b.total - a.total)
                //     // .slice(0, 10)
                //   ),
                //   dataTableAll.map((param) => param.hovaDetails
                //     // .sort((a, b) => b.total - a.total)
                //     // .slice(0, 10)
                //   )
                // ],
                legend: {
                    x: -60,
                    enabled: true,
                    itemStyle: {
                        // color: '#adacac',
                        fontSize: '14px'
                    },
                    verticalAlign: 'top',
                    rtl: this.userService.appData.dir === 'rtl',
                    align: 'right',
                    symbolHeight: 12,
                    symbolWidth: 12,
                    symbolRadius: 0,
                    margin: 0 // ,
                    // floating: true
                },
                lineWidth: 2,
                series: [
                    {
                        cursor: 'pointer',
                        name: this.translate.instant(
                            'menu.customers.financialManagement.bankAccount.charts.revenuesName'
                        ),
                        color: '#05ae09',
                        // states: {
                        //     hover: {
                        //         lineWidth: 3
                        //     }
                        // },
                        marker: {
                            symbol: 'circle'
                        },
                        data: repacked.map((param) => {
                            return {
                                x: param.date,
                                y: param.zhutTotal,
                                dataLabels: {
                                    y: Math.abs(param.hovaTotal) >= param.zhutTotal ? 0 : -20,
                                    verticalAlign: 'top'
                                }
                            };
                        }),
                        //     dataTableAll.map((param) => {
                        //     return {
                        //         x: param.date,
                        //         y: param.zhutTotal
                        //     };
                        // }),
                        dataLabels: {
                            //------new
                            verticalAlign: 'top'
                            // verticalAlign: 'bottom'
                        }
                    },
                    {
                        cursor: 'pointer',
                        name: this.translate.instant(
                            'menu.customers.financialManagement.bankAccount.charts.expensesName'
                        ),
                        color: '#e83939',
                        // states: {
                        //     hover: {
                        //         lineWidth: 3
                        //     }
                        // },
                        marker: {
                            symbol: 'circle'
                        },
                        data: repacked.map((param) => {
                            return {
                                x: param.date,
                                y: Math.abs(param.hovaTotal),
                                dataLabels: {
                                    y: Math.abs(param.hovaTotal) >= param.zhutTotal ? -20 : 0
                                }
                            };
                        }),
                        // data: dataTableAll.map((param) => {
                        //     return {
                        //         x: param.date,
                        //         y: param.hovaTotal
                        //     };
                        // }),
                        dataLabels: {
                            verticalAlign: 'top'
                        }
                    }
                ]
            }
            : {
                currencySymbol: this.currencySymbol.transform(
                    this.userService.appData.userData.accountSelect[0].currency
                ),
                maxY: null,
                line: true,
                // columnGroup: true,
                dataLabelsEnabled: this.showValuesControl.value, // true,
                plotLines: [],
                gridLineWidth: 1,
                markerEnabled: this.showValuesControl.value, // true,
                crosshair: false,
                xAxiscategories: dates.map((dt) =>
                    this.userService.appData.moment(dt).toDate()
                ),
                tooltips: dates.map((dt) => {
                    return {
                        x: dt, // this.userService.appData.moment(dt).toDate(),
                        details: [repacked[dt].zhutDetails, repacked[dt].hovaDetails]
                    };
                }),
                // tooltips: [
                //   dataTableAll.map((param) => param.zhutDetails
                //     // .sort((a, b) => b.total - a.total)
                //     // .slice(0, 10)
                //   ),
                //   dataTableAll.map((param) => param.hovaDetails
                //     // .sort((a, b) => b.total - a.total)
                //     // .slice(0, 10)
                //   )
                // ],
                legend: {
                    x: -60,
                    enabled: true,
                    itemStyle: {
                        // color: '#adacac',
                        fontSize: '14px'
                    },
                    verticalAlign: 'top',
                    rtl: this.userService.appData.dir === 'rtl',
                    align: 'right',
                    margin: 0 // ,
                    // floating: true
                },
                lineWidth: 2,
                series: [
                    {
                        cursor: 'pointer',
                        name: this.translate.instant(
                            'menu.customers.financialManagement.bankAccount.charts.revenuesName'
                        ),
                        color: '#05ae09',
                        // states: {
                        //     hover: {
                        //         lineWidth: 3
                        //     }
                        // },
                        marker: {
                            symbol: 'circle'
                        },
                        data: dates.map((dt) => {
                            return {
                                x: dt, // this.userService.appData.moment(dt).toDate(),
                                y: repacked[dt].zhut
                                // dataLabels: {
                                //     y: 0,
                                // },
                            };
                        }),
                        //     dataTableAll.map((param) => {
                        //     return {
                        //         x: param.date,
                        //         y: param.zhutTotal
                        //     };
                        // }),
                        dataLabels: {
                            // verticalAlign: 'top'
                            verticalAlign: 'bottom'
                        }
                    },
                    {
                        cursor: 'pointer',
                        name: this.translate.instant(
                            'menu.customers.financialManagement.bankAccount.charts.expensesName'
                        ),
                        color: '#e83939',
                        // states: {
                        //     hover: {
                        //         lineWidth: 3
                        //     }
                        // },
                        marker: {
                            symbol: 'circle'
                        },
                        data: dates.map((dt) => {
                            return {
                                x: dt, // this.userService.appData.moment(dt).toDate(),
                                y: repacked[dt].hova * -1
                                // dataLabels: {
                                //     y: 0,
                                // }
                            };
                        }),
                        // data: dataTableAll.map((param) => {
                        //     return {
                        //         x: param.date,
                        //         y: param.hovaTotal
                        //     };
                        // }),
                        dataLabels: {
                            verticalAlign: 'top'
                        }
                    }
                ]
            };
    }

    filterCategory(type: any) {
        if (type.type === 'payment') {
            this.sharedComponent.mixPanelEvent('payment type filter', {value:type.checked});
            this.filterChanged$.next({
                query: this.filterChanged$.value.query,
                paymentTypes: type.checked,
                categories: this.filterChanged$.value.categories
            });
            this.storageService.sessionStorageSetter(
                'daily/details-filterPaymentTypesCategory',
                JSON.stringify(type.checked)
            );
        } else if (type.type === 'transType') {
            this.sharedComponent.mixPanelEvent('category fillter');
            this.filterChanged$.next({
                query: this.filterChanged$.value.query,
                categories: type.checked,
                paymentTypes: this.filterChanged$.value.paymentTypes
            });
            this.storageService.sessionStorageSetter(
                'daily/details-filterTypesCategory',
                JSON.stringify(type.checked)
            );
        }
    }

    private createBalanceChart(
        data: Array<{
            accountUuid: string;
            accountTransactions: Array<{ transDate: number; itra: number }>;
        }>
    ) {
        let maxVal = null,
            minVal = null,
            series = [];
        const plotLines = [];
        if (Array.isArray(data) && data.length) {
            const currencySymbol = this.currencySymbol.transform(
                this.userService.appData.userData.accountSelect[0].currency
            );
            // noinspection DuplicatedCode
            const byDaySet: Map<number, any> = data.reduce(
                (
                    acmltr: Map<number, any>,
                    item: {
                        accountUuid: string;
                        accountTransactions: Array<{ transDate: number; itra: number }>;
                    }
                ) => {
                    return item.accountTransactions.reduce((acmltr0, tr) => {
                        const dayTrs = acmltr.get(tr.transDate) || {
                            date: tr.transDate,
                            itrot: []
                        };
                        dayTrs.itrot.push({
                            accountId: item.accountUuid,
                            itra: tr.itra
                        });
                        return acmltr.set(tr.transDate, dayTrs);
                    }, acmltr);
                },
                new Map<number, any>()
            );

            const byDaySorted = Array.from(byDaySet.values());
            byDaySorted.sort((a, b) => a.date - b.date);

            series = [
                {
                    cursor: 'pointer',
                    states: {
                        hover: {
                            lineWidth: 2
                        }
                    },
                    marker: {
                        symbol: 'circle'
                    },
                    data: byDaySorted.reduce(
                        (
                            acmltr,
                            item: {
                                date: number;
                                itrot: Array<{ accountId: string; itra: number }>;
                            }
                        ) => {
                            acmltr.push({
                                x: item.date,
                                y: item.itrot.find((accItem) => !accItem.accountId).itra,
                                currency: currencySymbol,
                                byAccountBalances: item.itrot
                                    .filter((accItem) => accItem.accountId)
                                    .map((accItem) => {
                                        const selectedAcc =
                                            this.userService.appData.userData.accountSelect.find(
                                                (acc: any) => acc.companyAccountId === accItem.accountId
                                            );
                                        return {
                                            name: selectedAcc.accountNickname,
                                            itra: accItem.itra,
                                            currency: currencySymbol
                                        };
                                    })
                            });
                            return acmltr;
                        },
                        []
                    )
                }
            ];

            if (this.showCreditLinesControl.value) {
                const overallCreditLimit =
                    this.userService.appData.userData.accountSelect.reduce(
                        (acmltr, acc) => {
                            if (acc.creditLimit !== null && acc.creditLimit !== undefined) {
                                return acmltr !== null
                                    ? acmltr + acc.creditLimit
                                    : acc.creditLimit;
                            }
                            return acmltr;
                        },
                        null
                    );
                if (overallCreditLimit !== null) {
                    const minmax = data
                        .find((item) => !item.accountUuid)
                        .accountTransactions.reduce(
                            (
                                acmltr: { min: number; max: number },
                                item: { transDate: number; itra: number }
                            ) => {
                                acmltr.min = Math.min(acmltr.min, item.itra);
                                acmltr.max = Math.max(acmltr.max, item.itra);
                                return acmltr;
                            },
                            {min: null, max: null}
                        );
                    minVal = Math.min(overallCreditLimit, minmax.min) * 1.1;
                    maxVal = Math.max(overallCreditLimit, minmax.max) * 1.1;

                    plotLines.push({
                        // color: this.getColorOfBank(this.getInfoAcc(id, 'bankId')),
                        // color: this.getColorRandom(idx),
                        width: 2,
                        value: overallCreditLimit,
                        dashStyle: 'ShortDash',
                        zIndex: 3,
                        label: {
                            enabled: false
                        }
                    });
                }
            }
        }
        // // debugger;
        // const series = !Array.isArray(data) || !data.length ? []
        //     : data.map((accWithTransactions) => {
        //         const selectedAcc = this.userService.appData.userData.accountSelect
        //             .find(acc => acc.companyAccountId === accWithTransactions.accountUuid);
        //         const arrItrot = accWithTransactions.accountTransactions
        //             .map(value => {
        //                 return {
        //                     x: value.transDate,
        //                     y: value.itra,
        //                     currency: this.currencySymbolPipe.transform(selectedAcc.currency)
        //                 };
        //             });
        //         return {
        //             cursor: 'pointer',
        //             accountId: accWithTransactions.accountUuid,
        //             name: selectedAcc.accountNickname,
        //             states: {
        //                 hover: {
        //                     lineWidth: 2
        //                 }
        //             },
        //             marker: {
        //                 symbol: 'circle'
        //             },
        //             data: arrItrot
        //         };
        //     });
        //
        // series.sort((a, b) => this.userService.appData.userData.accountSelect
        //         .findIndex(acc => acc.companyAccountId === a.accountId)
        //     - this.userService.appData.userData.accountSelect
        //         .findIndex(acc => acc.companyAccountId === b.accountId));

        const xAxiscategories: any =
            !Array.isArray(data) || !data.length
                ? []
                : Array.from(
                    data.reduce((datesSet, accWithTransactions) => {
                        accWithTransactions.accountTransactions
                            .map((value) => value.transDate)
                            .reduce((datesSet1, date) => datesSet1.add(date), datesSet);
                        return datesSet;
                    }, new Set())
                );
        xAxiscategories.sort((a, b) => a - b);

        return {
            line: true,
            dataLabelsEnabled: this.showValuesControl.value,
            truncateFutureDates: this.selectedValueGraph !== 'balance',
            maxY: maxVal,
            minY: minVal,
            plotLines: plotLines,
            gridLineWidth: 1,
            markerEnabled: false,
            crosshair: false,
            // crosshair: {
            //     width: 2,
            //     color: '#cbc9c9'
            // },
            xAxiscategories: xAxiscategories,
            tooltips: [],
            series: series
        };
    }
}
