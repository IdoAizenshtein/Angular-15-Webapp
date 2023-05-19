import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {UserService} from '@app/core/user.service';

import {debounceTime, distinctUntilChanged, filter, map, take, tap} from 'rxjs/operators';

import {StorageService} from '@app/shared/services/storage.service';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {AccountsDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/accounts-date-range-selector.component';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {Subscription} from 'rxjs/internal/Subscription';
import {FormControl} from '@angular/forms';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './financialManagement-bankAccount-graph.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementBankAccountGraphComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    public accountBalanceGraph: number;
    public creditLimitGraph: number;
    public balanceUseGraph: number;

    @ViewChild(AccountsDateRangeSelectorComponent)
    childDates: AccountsDateRangeSelectorComponent;
    // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;
    public dataTableAll: any[] = [];
    public loader = false;
    public readonly ddSelectGraph: Array<{ label: string; value: string }>;
    public selectedValueGraph: 'expenses' | 'balance';
    public chartData: any;
    public showValues = false;
    public showCreditLines = false;

    public accountBalance: number;
    public creditLimit: number;
    public balanceUse: number;
    public accountSelectExchange: any = false;
    public accountSelectInDeviation: any = false;
    public accountSelectOneNotUpdate: any = false;

    // private readonly storageKey: string;

    showingUpdateCredentials = false;

    bankTrans: any;
    bankTransSub: Subscription;
    filterInput = new FormControl();
    public filterTypesCategory: any = null;
    public filterPaymentTypesCategory: any = null;
    private paymentTypesMap: { [key: string]: any };
    public paymentTypesArr: any[];
    private transTypesMap: { [key: string]: any };
    public transTypesArr: any[];
    private searchableList = [
        'paymentDescTranslate',
        'mainDesc',
        'transTypeName',
        'asmachta',
        'total',
        'itra'
    ];
    private searchableListTypes = ['paymentDesc', 'transTypeId'];
    private daysScale: boolean;

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        public sharedService: SharedService,
        private storageService: StorageService,
        private currencySymbolPipe: CurrencySymbolPipe,
        private filterPipe: FilterPipe
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
                    'menu.customers.financialManagement.bankAccount.charts.expenses'
                ),
                value: 'expenses'
            }
        ];

        // this.storageKey = 'bankAccount/graph-selectedGraph';
        //
        // try {
        //     this.selectedValueGraph = this.storageService.sessionStorageGetterItem(this.storageKey);
        //     if (!this.selectedValueGraph || !this.ddSelectGraph.find(slctn => slctn.value === this.selectedValueGraph)) {
        //         throw new Error('Failed to initialize selectedValueGraph from storage');
        //     }
        // } catch (e) {
        //     this.selectedValueGraph = 'expenses';
        // }
        this.selectedValueGraph = 'expenses';

        this.filterInput.valueChanges
            .pipe(
                filter(() => this.bankTrans),
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged(),
                tap((term) => {
                    this.sharedComponent.mixPanelEvent('search', {
                        value: term
                    });
                    this.storageService.sessionStorageSetter('details-filterQuery', term);
                })
            )
            .subscribe(() => this.applyFilter());
    }

    override reload() {
        console.log('reload child');
        this.changeAcc(false);
    }

    changeAcc(event): void {
        this.loader = true;
        console.log(this.userService.appData.userData.accountSelect);

        // tslint:disable-next-line:max-line-length
        [this.accountBalance, this.creditLimit, this.balanceUse] =
            this.userService.appData.userData.accountSelect.reduce(
                function (a, b) {
                    return [
                        a[0] + b.accountBalance,
                        a[1] + Math.abs(b.creditLimit),
                        a[2] + b.balanceUse
                    ];
                },
                [0, 0, 0]
            );
        // console.log('%o', [this.accountBalance, this.creditLimit, this.balanceUse]);

        this.accountSelectInDeviation =
            this.userService.appData.userData.accountSelect.filter((account) => {
                return account.balanceUse < 0;
            });
        console.log(
            'this.accountSelectInDeviation => %o',
            this.accountSelectInDeviation
        );

        if (this.userService.appData.userData.accountSelect.length) {
            this.accountSelectExchange =
                this.userService.appData.userData.accountSelect.filter((account) => {
                    return account.currency !== 'ILS';
                });
            this.sharedComponent.mixPanelEvent('accounts drop', {
                accounts: (this.userService.appData.userData.accountSelect.length === this.accountSelectExchange.length) ? 'כל החשבונות מט"ח' :
                    (((this.userService.appData.userData.accounts.length - this.accountSelectExchange.length) === this.userService.appData.userData.accountSelect.length) ? 'כל החשבונות' :
                        (
                            this.userService.appData.userData.accountSelect.map(
                                (account) => {
                                    return account.companyAccountId;
                                }
                            )
                        ))
            });
            // if (this.accountSelectExchange.length) {
            //     this.sharedComponent.mixPanelEvent('accounts drop');
            // }
        } else {
            this.accountSelectExchange = [];
        }
        this.accountSelectOneNotUpdate = false;
        if (
            this.userService.appData.userData.accountSelect.length === 1 &&
            !this.userService.appData.userData.accountSelect[0].isUpToDate &&
            !this.userService.appData.userData.accountSelect[0]
                .outdatedBecauseNotFound
        ) {
            this.accountSelectOneNotUpdate = this.userService.appData
                .moment()
                .startOf('day')
                .diff(
                    this.userService.appData
                        .moment(
                            this.userService.appData.userData.accountSelect[0]
                                .balanceLastUpdatedDate
                        )
                        .startOf('day'),
                    'days'
                );
        }
        if (this.childDates) {
            this.childDates.selectedRange
                .pipe(take(1))
                .subscribe((rng) => this.filterDates(rng));
        }

        // this.childDates.filter('monthsWithoutCalendar');
        // this.filterDates(this.childDates.selectedPeriod);
    }

    getInfoAcc(id: string, param: string): any {
        if (id !== null && param !== undefined) {
            return this.userService.appData.userData.accounts.filter((account) => {
                return account.companyAccountId === id;
            })[0][param];
        } else {
            return '';
        }
    }

    getCurrencySymbol(currencyCode?: string): string {
        if (!currencyCode) {
            return null;
        }
        return this.currencySymbolPipe.transform(currencyCode);
    }

    selectAccountInDeviation(
        accountSelector: AccountSelectComponent,
        account: any
    ): void {
        console.log('%o, %o', accountSelector, account);
        this.userService.appData.userData.accountSelect = [].concat(account);
        accountSelector.applyValuesFromModel();
        this.changeAcc(null);
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

    filterDates(paramDate: any): void {
        this.reloadData(paramDate);
        return;

        // this.loader = true;
        //
        // const parameters: any = {
        //     'companyAccountIds': this.userService.appData.userData.accountSelect.map((id) => id.companyAccountId),
        //     'companyId': this.userService.appData.userData.companySelect.companyId,
        //     'dateFrom': paramDate.fromDate,
        //     'dateTill': paramDate.toDate
        // };
        //
        // let wsCharts: any;
        //
        // const daysScale = this.userService.appData.moment(paramDate.toDate).startOf('day')
        //     .diff(this.userService.appData.moment(paramDate.fromDate).startOf('day'),
        //             'days') <= 31;
        // if (daysScale) {
        //     wsCharts = this.sharedService.getBankTransAggregate({
        //         'accountShowOnly': this.userService.appData.userData.accountSelect.map((id) => id.companyAccountId),
        //         'companyId': this.userService.appData.userData.companySelect.companyId,
        //         'dateFrom': paramDate.fromDate,
        //         'dateTill': paramDate.toDate
        //     }).pipe(
        //         tap((resp) => {
        //             if (Array.isArray(resp['body'])) {
        //                 const maxDateToShow = new Date().setHours(23, 59, 59, 999);
        //                 resp['body'].forEach(acc => {
        //                     acc.accountTransactions.filter(trns => trns.transDate > maxDateToShow)
        //                         .forEach(trns => {
        //                             trns.hova = trns.zhut = trns.itra = null;
        //                         });
        //                 });
        //                 // accountTransactions
        //             }
        //         }),
        //         map((resp) => {
        //             let transformedResult;
        //             if (this.selectedValueGraph === 'balance') {
        //                 transformedResult = resp['body'].reduce((acmltr, accountData) => {
        //                     if (accountData.accountUuid !== null) {
        //                         accountData.accountTransactions
        //                             .filter(trns => trns.itra != null)
        //                             .forEach((trns) => {
        //                                 let dayData = acmltr.find(dayDta => dayDta.date === trns.transDate);
        //                                 if (!dayData) {
        //                                     dayData = {
        //                                         date: trns.transDate,
        //                                         itraSum: 0,
        //                                         companyAccountsItrot: []
        //                                     };
        //                                     acmltr.unshift(dayData);
        //                                 }
        //
        //                                 dayData.itraSum += +trns.itra;
        //                                 dayData.companyAccountsItrot.push({
        //                                     companyAccountId: accountData.accountUuid,
        //                                     itra: trns.itra
        //                                 });
        //                             });
        //                     }
        //                     return acmltr;
        //                 }, []);
        //             } else {
        //                 transformedResult = resp['body'].reduce((acmltr, accountData) => {
        //                     if (accountData.accountUuid !== null) {
        //                         accountData.accountTransactions
        //                             .filter(trns => trns.zhut != null || trns.hova !== null)
        //                             .forEach((trns) => {
        //                                 let dayData = acmltr.find(dayDta => dayDta.date === trns.transDate);
        //                                 if (!dayData) {
        //                                     dayData = {
        //                                         date: trns.transDate,
        //                                         zhutTotal: 0,
        //                                         hovaTotal: 0,
        //                                         zhutDetails: // [],
        //                                             this.sharedService.getBankTransPerDay({
        //                                                 companyAccountIds: this.userService.appData.userData.accountSelect
        //                                                     .map((id) => id.companyAccountId),
        //                                                 hova: false,
        //                                                 transDate: trns.transDate
        //                                             }),
        //                                         hovaDetails: // [],
        //                                             this.sharedService.getBankTransPerDay({
        //                                                 companyAccountIds: this.userService.appData.userData.accountSelect
        //                                                     .map((id) => id.companyAccountId),
        //                                                 hova: true,
        //                                                 transDate: trns.transDate
        //                                             })
        //                                     };
        //                                     acmltr.unshift(dayData);
        //                                 }
        //
        //                                 dayData.zhutTotal += +trns.zhut;
        //                                 dayData.hovaTotal += +trns.hova;
        //                             });
        //                     }
        //                     return acmltr;
        //                 }, []);
        //             }
        //
        //             transformedResult.sort((a, b) => a.date - b.date);
        //
        //             return {
        //                 body: transformedResult
        //             };
        //         })
        //     );
        // } else if (this.selectedValueGraph === 'balance') {
        //     // if (this.selectedValueGraph === 'balance') {
        //     wsCharts = this.sharedService.getBankTransGraphItrot(parameters);
        // } else {
        //     wsCharts = this.sharedService.getGraphZhutHova(parameters);
        // }
        // wsCharts.subscribe(
        //     response => {
        //         this.dataTableAll = (response) ? response['body'] : response;
        //         if (this.dataTableAll.length) {
        //             if (this.selectedValueGraph === 'expenses') {
        // tslint:disable-next-line:max-line-length
        //                 [this.accountBalanceGraph, this.creditLimitGraph, this.balanceUseGraph] = this.dataTableAll.reduce(function (a, b) {
        //                     return [a[0] + b.zhutTotal, a[1] + b.hovaTotal, a[2] + b.zhutTotal + b.hovaTotal];
        //                 }, [0, 0, 0]);
        //             }
        //             this.updateChart();
        //         } else {
        //             [this.accountBalanceGraph, this.creditLimitGraph, this.balanceUseGraph] = [null, null, null];
        //             this.loader = false;
        //         }
        //     }, (err: HttpErrorResponse) => {
        //         if (err.error instanceof Error) {
        //             console.log('An error occurred:', err.error.message);
        //         } else {
        //             console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        //         }
        //     }
        // );
    }

    updateChart(): void {
        this.loader = true;
        const dataTableAll = this.dataTableAll;
        const currencySymbol =
            this.userService.appData.userData.accountSelect &&
            this.userService.appData.userData.accountSelect.length
                ? this.getCurrencySymbol(
                    this.userService.appData.userData.accountSelect[0].currency
                )
                : null;
        let data;
        const plotLines = [];
        // const plotLines = [{
        //     // color: '#d63838',
        //     width: 3,
        //     value: 0,
        //     dashStyle: 'ShortDash',
        //     zIndex: 3,
        //     label: {
        //         enabled: false
        //     }
        // }];
        if (this.selectedValueGraph === 'balance') {
            let maxVal = null,
                minVal = null,
                series = [];
            if (Array.isArray(dataTableAll) && dataTableAll.length) {
                if (this.showCreditLines) {
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
                        const minmax = dataTableAll.reduce(
                            (
                                acmltr: { min: number; max: number },
                                item: {
                                    date: number;
                                    itrot: Array<{ accountId: string; itra: number }>;
                                }
                            ) => {
                                const overallItra = item.itrot.find(
                                    (accItra) => !accItra.accountId
                                );
                                acmltr.min = Math.min(acmltr.min, overallItra.itra);
                                acmltr.max = Math.max(acmltr.max, overallItra.itra);
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
                        data: dataTableAll.reduce(
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
                                            return {
                                                name: this.getInfoAcc(
                                                    accItem.accountId,
                                                    'accountNickname'
                                                ),
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
                // const seriesMap = dataTableAll
                //     .reduce((acmltr, item: { date: number, itrot: Array<{ accountId: string, itra: number }> }) => {
                //         return item.itrot
                //             .filter((accItra: { accountId: string, itra: number }) => !!accItra.accountId)
                //             .reduce((acmltr0, accItra: { accountId: string, itra: number }, i) => {
                //                 const accSeries = acmltr0.get(accItra.accountId) || {
                //                     cursor: 'pointer',
                //                     name: this.getInfoAcc(accItra.accountId, 'accountNickname'),
                //                     visible: i === 0,
                //                     states: {
                //                         hover: {
                //                             lineWidth: 2
                //                         }
                //                     },
                //                     marker: {
                //                         symbol: 'circle'
                //                     },
                //                     data: []
                //                 };
                //                 accSeries.data.push({
                //                     x: item.date,
                //                     y: accItra.itra,
                //                     currency: this.getCurrencySymbol(currencySymbol)
                //                 });
                //                 return acmltr0.set(accItra.accountId, accSeries);
                //             }, acmltr);
                //     }, new Map<string, any>());
                //
                // series = Array.from(seriesMap.values());
            }
            // const arrMaxLines = [];
            // let arrMaxItrot = [];
            // const series = !dataTableAll.length ? []
            //     : dataTableAll[0].companyAccountsItrot.map((param) => param.companyAccountId).map((id, idx) => {
            //         const arrItrot = dataTableAll.reduce((arrBuilder, arr) => {
            //             const accItraRecord = arr.companyAccountsItrot.find((a) => {
            //                 return a.companyAccountId === id;
            //             });
            //             arrBuilder.push({
            //                 x: arr.date,
            //                 y: accItraRecord ? accItraRecord.itra : null,
            //                 currency: this.getCurrencySymbol(this.getInfoAcc(id, 'currency'))
            //             });
            //             return arrBuilder;
            //         }, []);
            //         if (this.showCreditLines) {
            //             const creditLimit = this.getInfoAcc(id, 'creditLimit');
            //             arrMaxLines.push(creditLimit);
            //             plotLines.push({
            //                 // color: this.getColorOfBank(this.getInfoAcc(id, 'bankId')),
            //                 // color: this.getColorRandom(idx),
            //                 width: 2,
            //                 value: creditLimit,
            //                 dashStyle: 'ShortDash',
            //                 zIndex: 3,
            //                 label: {
            //                     enabled: false
            //                 }
            //             });
            //             arrMaxItrot = arrMaxItrot.concat(arrItrot.map(val => val.y));
            //         }
            //         return {
            //             cursor: 'pointer',
            //             accountId: id,
            //             name: this.getInfoAcc(id, 'accountNickname'),
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
            //
            // if (this.showCreditLines && arrMaxLines.length && arrMaxItrot.length) {
            //     const maxValueLines = Math.max.apply(null, arrMaxLines);
            //     const maxValueItrot = Math.max.apply(null, arrMaxItrot);
            //     if (maxValueLines > maxValueItrot) {
            //         const onePrecent = (maxValueLines / 100);
            //         maxVal = maxValueLines + onePrecent;
            //     }
            //
            //     const minValueLines = Math.min.apply(null, arrMaxLines);
            //     const minValueItrot = Math.min.apply(null, arrMaxItrot);
            //     if (minValueLines < minValueItrot) {
            //         const onePrecent = (Math.max(maxValueLines, maxValueItrot) / 100);
            //         minVal = minValueLines - onePrecent;
            //     }
            // }
            data = {
                line: true,
                dataLabelsEnabled: this.showValues,
                truncateFutureDates: true,
                plotLines: plotLines,
                gridLineWidth: 1,
                markerEnabled: false,
                crosshair: false,
                // crosshair: {
                //     width: 2,
                //     color: '#cbc9c9'
                // },
                maxY: maxVal,
                minY: minVal,
                xAxiscategories:
                    Array.isArray(dataTableAll) && dataTableAll.length
                        ? dataTableAll.map((dates) => dates.date)
                        : [],
                tooltips: [],
                series: series
            };
            // debugger;
        } else {
            data = {
                currencySymbol: currencySymbol,
                maxY: null,
                // line: true,
                columnGroup: true,
                dataLabelsEnabled: this.showValues, // true,
                plotLines: plotLines,
                gridLineWidth: 1,
                markerEnabled: this.showValues, // true,
                crosshair: false,
                xAxiscategories: dataTableAll.map((dates) => dates.date),
                tooltips: dataTableAll.map((param) => {
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
                        data: dataTableAll.map((param) => {
                            return {
                                x: param.date,
                                y: param.zhutTotal,
                                dataLabels: {
                                    y: Math.abs(param.hovaTotal) >= param.zhutTotal ? 0 : -20
                                }
                            };
                        }),
                        dataLabels: {
                            verticalAlign: 'top'
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
                        data: dataTableAll.map((param) => {
                            return {
                                x: param.date,
                                y: Math.abs(param.hovaTotal),
                                dataLabels: {
                                    y: Math.abs(param.hovaTotal) >= param.zhutTotal ? -20 : 0
                                }
                            };
                        }),
                        dataLabels: {
                            verticalAlign: 'top'
                        }
                    }
                ]
            };
        }

        this.childDates.selectedRange.pipe(take(1)).subscribe((rng) => {
            data.fromDate = new Date(rng.fromDate);
            data.toDate = new Date(rng.toDate);
            this.chartData = data;
            this.loader = false;
        });
        // const selectedPeriod = this.childDates.selectedPeriod;
        // data.fromDate = new Date(selectedPeriod.fromDate);
        // data.toDate = new Date(selectedPeriod.toDate);
        // this.chartData = data;
        // this.loader = false;
    }

    ngAfterViewInit(): void {
        // this.storageService.sessionStorageSetter('bankAccount-defaultViewName', 'graph');
        this.childDates.selectedRange
            .pipe(
                filter(
                    () =>
                        Array.isArray(this.userService.appData.userData.accountSelect) &&
                        this.userService.appData.userData.accountSelect.length
                )
            )
            .subscribe((rng) => this.filterDates(rng));
    }

    ngOnInit(): void {
        const detailsFilterPaymentTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'details-filterPaymentTypesCategory'
            );
        if (detailsFilterPaymentTypesCategory !== null) {
            this.filterPaymentTypesCategory =
                detailsFilterPaymentTypesCategory === '' ||
                detailsFilterPaymentTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterPaymentTypesCategory);
        }
        const detailsFilterTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'details-filterTypesCategory'
            );
        if (detailsFilterTypesCategory !== null) {
            this.filterTypesCategory =
                detailsFilterTypesCategory === '' ||
                detailsFilterTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterTypesCategory);
        }
        const detailsFilterQuery = this.storageService.sessionStorageGetterItem(
            'details-filterQuery'
        );
        if (detailsFilterQuery) {
            this.filterInput.setValue(detailsFilterQuery);
        }


    }

    ngOnDestroy(): void {
        if (this.bankTransSub) {
            this.bankTransSub.unsubscribe();
        }
        this.destroy();
    }

    onChartTypeChange(evt: any) {
        // this.storageService.sessionStorageSetter(this.storageKey, evt.value);
        this.sharedComponent.mixPanelEvent('view drop');
        this.childDates.selectedRange
            .pipe(take(1))
            .subscribe((rng) => this.filterDates(rng));
        // this.filterDates(this.childDates.selectedPeriod);
    }

    reloadData(paramDate: any): void {
        if (!this.userService.appData.userData.accountSelect.length) {
            this.bankTrans = null;
            this.applyFilter();
            return;
        }

        this.daysScale =
            this.userService.appData
                .moment(paramDate.toDate)
                .startOf('day')
                .diff(
                    this.userService.appData.moment(paramDate.fromDate).startOf('day'),
                    'days'
                ) <= 31;

        const parameters: any =
            this.selectedValueGraph === 'expenses'
                ? {
                    companyAccountIds:
                        this.userService.appData.userData.accountSelect.map((account) => {
                            return account.companyAccountId;
                        }),
                    companyId:
                    this.userService.appData.userData.companySelect.companyId,
                    dateFrom: paramDate.fromDate,
                    dateTill: paramDate.toDate
                }
                : {
                    accountToSum: this.userService.appData.userData.accountSelect.map(
                        (account) => {
                            return account.companyAccountId;
                        }
                    ),
                    companyId:
                    this.userService.appData.userData.companySelect.companyId,
                    dateFrom: paramDate.fromDate,
                    dateTill: paramDate.toDate
                };
        if (this.bankTransSub) {
            this.bankTransSub.unsubscribe();
        }

        const dataLoadObs =
            this.selectedValueGraph === 'expenses'
                ? this.sharedService.getBankTrans(parameters).pipe(
                    tap((rslt: any) => {
                        if (
                            rslt &&
                            !rslt.error &&
                            Array.isArray(rslt.body.bankTransList)
                        ) {
                            rslt.body.bankTransList.forEach((trns) => {
                                Object.assign(trns, {
                                    paymentDescTranslate: this.translate.instant(
                                        'paymentTypes.' + trns['paymentDesc']
                                    )
                                });
                            });
                        }
                    })
                )
                : this.sharedService.getBankTransAggregate(parameters).pipe(
                    map((rslt: any) => {
                        if (!rslt || (rslt.error && !Array.isArray(rslt.body))) {
                            return rslt;
                        }

                        const byDaySet: Map<number, any> = rslt.body.reduce(
                            (
                                acmltr: Map<number, any>,
                                item: {
                                    accountUuid: string;
                                    accountTransactions: Array<{
                                        transDate: number;
                                        itra: number;
                                    }>;
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

                        let byDaySorted = Array.from(byDaySet.values());
                        byDaySorted.sort((a, b) => a.date - b.date);
                        if (!this.daysScale) {
                            const mmnt = this.userService.appData.moment;
                            byDaySorted = byDaySorted.filter((val, idx, array) => {
                                return (
                                    idx === array.length - 1 ||
                                    mmnt(array[idx + 1].date).month() !==
                                    mmnt(array[idx].date).month()
                                );
                            });
                        }

                        return {
                            body: byDaySorted
                        };
                    })
                );
        // : this.sharedService.getBankTransGraphItrot(parameters);

        this.bankTransSub = dataLoadObs.subscribe((rslt) => {
            this.bankTrans = rslt && !rslt.error ? rslt.body : null;
            this.applyFilter();
        });
    }

    private rebuildPaymentTypesMap(withOtherFiltersApplied: any[]): void {
        this.paymentTypesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (dtRow.paymentDesc && !acmltr[dtRow.paymentDesc]) {
                    acmltr[dtRow.paymentDesc] = {
                        val: dtRow.paymentDesc,
                        id: dtRow.paymentDesc,
                        checked:
                            !Array.isArray(this.filterPaymentTypesCategory) ||
                            this.filterPaymentTypesCategory.includes(dtRow.paymentDesc)
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.paymentDesc].checked) {
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
        this.paymentTypesArr = Object.values(this.paymentTypesMap);
        // console.log('this.paymentTypesArr => %o', this.paymentTypesArr);
    }

    private rebuildTransTypesMap(withOtherFiltersApplied: any[]): void {
        this.transTypesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (dtRow.transTypeId && !acmltr[dtRow.transTypeId]) {
                    acmltr[dtRow.transTypeId] = {
                        val: dtRow.transTypeName,
                        id: dtRow.transTypeId,
                        checked:
                            !Array.isArray(this.filterTypesCategory) ||
                            this.filterTypesCategory.includes(dtRow.transTypeId)
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.transTypeId].checked) {
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
        this.transTypesArr = Object.values(this.transTypesMap);
        // console.log('this.transTypesArr => %o', this.transTypesArr);
    }

    private applyFilter(rebuild:boolean = true) {
        if (!this.bankTrans) {
            this.dataTableAll = [];
            this.accountBalanceGraph =
                this.creditLimitGraph =
                    this.balanceUseGraph =
                        null;
            this.paymentTypesMap = this.transTypesMap = null;
            this.transTypesArr = this.paymentTypesArr = null;
            this.updateChart();
            return;
        }

        if (this.selectedValueGraph === 'expenses') {
            let filteredTransactions = this.filterPipe.transform(
                this.bankTrans.bankTransList,
                this.filterInput.value,
                this.searchableList
            );
            if(rebuild){
                this.rebuildPaymentTypesMap(filteredTransactions);
                this.rebuildTransTypesMap(filteredTransactions);
            }

            filteredTransactions = this.filterPipe.transform(
                filteredTransactions,
                this.filterTypesCategory,
                this.searchableListTypes
            );
            filteredTransactions = this.filterPipe.transform(
                filteredTransactions,
                this.filterPaymentTypesCategory,
                this.searchableListTypes
            );

            this.dataTableAll = Object.values(
                filteredTransactions.reduce((acmltr: { [k: number]: any }, trns) => {
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

                    if (trns.hova) {
                        acmltr[key].hovaTotal += trns.total * -1;
                        acmltr[key].hovaDetails.push(trns);
                    } else {
                        acmltr[key].zhutTotal += trns.total;
                        acmltr[key].zhutDetails.push(trns);
                    }

                    return acmltr;
                }, Object.create(null))
            );
        } else {
            this.accountBalanceGraph =
                this.creditLimitGraph =
                    this.balanceUseGraph =
                        null;
            this.paymentTypesMap = this.transTypesMap = null;
            this.transTypesArr = this.paymentTypesArr = null;
            this.dataTableAll = this.bankTrans;
        }

        this.dataTableAll.sort((a, b) => a.date - b.date);

        [this.accountBalanceGraph, this.creditLimitGraph, this.balanceUseGraph] =
            this.dataTableAll.length
                ? this.dataTableAll.reduce(
                    function (a, b) {
                        return [
                            a[0] + b.zhutTotal,
                            a[1] + b.hovaTotal,
                            a[2] + b.zhutTotal + b.hovaTotal
                        ];
                    },
                    [0, 0, 0]
                )
                : [null, null, null];

        if (this.selectedValueGraph === 'balance') {
            this.creditLimitGraph =
                Array.isArray(this.userService.appData.userData.accountSelect) &&
                this.userService.appData.userData.accountSelect.length &&
                this.userService.appData.userData.accountSelect.some(
                    (acc: any) => acc.creditLimit !== null
                )
                    ? Math.abs(
                        this.userService.appData.userData.accountSelect
                            .map((acc: any) => acc.creditLimit)
                            .reduce((a, b) => a + b, 0)
                    )
                    : null;
        }

        this.updateChart();
    }

    filterCategory(type: any) {
        if (type.type === 'payment') {
            this.sharedComponent.mixPanelEvent('filter payment type', {
                value: type.checked
            });
            this.filterPaymentTypesCategory = type.checked;
            this.storageService.sessionStorageSetter(
                'details-filterPaymentTypesCategory',
                JSON.stringify(this.filterPaymentTypesCategory)
            );
            this.applyFilter(false);
        } else if (type.type === 'transType') {
            this.sharedComponent.mixPanelEvent('filter category', {
                value: type.checked
            });
            this.filterTypesCategory = type.checked;
            this.storageService.sessionStorageSetter(
                'details-filterTypesCategory',
                JSON.stringify(this.filterTypesCategory)
            );
            this.applyFilter(false);
        }
    }

    // downloadGraph() {
    //     // debugger;
    //     const svg = document.getElementsByTagName('svg')[0] as SVGElement;
    //     const svgRect = svg.getBoundingClientRect();
    //     const svgData = new XMLSerializer().serializeToString( svg );
    //
    //     const canvas = document.createElement('canvas');
    //     canvas.width = svgRect.width;
    //     canvas.height = svgRect.height;
    //
    //     const img = document.createElement('img');
    //     img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData))));
    //     img.onload = function() {
    //         canvas.getContext('2d').drawImage(img, 0, 0);
    //
    //         const objectUrl = canvas.toDataURL('image/png');
    //
    //         // window.open(canvas.toDataURL('image/png'));
    //
    //         const a: HTMLAnchorElement = document.createElement('a') as HTMLAnchorElement;
    //
    //         a.href = objectUrl;
    //         a.download = 'graph.png';
    //         document.body.appendChild(a);
    //         a.click();
    //
    //         document.body.removeChild(a);
    //         URL.revokeObjectURL(objectUrl);
    //     };
    // }
}
