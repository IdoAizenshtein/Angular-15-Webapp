import {
    AfterViewInit,
    Component,
    ElementRef,
    HostListener,
    OnDestroy,
    OnInit,
    Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {HttpErrorResponse} from '@angular/common/http';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {formatWithoutPoints, roundAndAddComma} from '@app/shared/functions/addCommaToNumbers';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {TranslateService} from '@ngx-translate/core';
import {ActivatedRoute, Router} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {isObservable, Observable, of, Subject, zip} from 'rxjs';
import {filter, map, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {ChartsComponent} from '@app/shared/component/charts/charts.component';
import {getCurrencySymbol} from '@angular/common';
import {getDaysBetweenDates} from '@app/shared/functions/getDaysBetweenDates';
import {TokenService, TokenStatus} from '@app/core/token.service';
import {OverviewDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/overview-date-range-selector.component';
import {CustomPreset, RangePoint} from '@app/shared/component/date-range-selectors/presets';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {MessagesService} from '@app/core/messages.service';
import {ToIconSrcPipe} from '@app/shared/pipes/toIconSrc.pipe';
import {TransTypesService} from '@app/core/transTypes.service';
import {DialogState} from '@app/shared/component/foreign-credentials/token-update-dialog/token-update-dialog.component';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {ReportService} from '@app/core/report.service';
import {publishRef} from '@app/shared/functions/publishRef';

// declare var $: any;

@Component({
    templateUrl: './customers-general.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CustomersGeneralComponent implements OnInit, OnDestroy, AfterViewInit {
    public dataChart: any;
    public pieChartGreen: any;
    public pieChartRed: any;
    public dataTableAll: any[] = [];
    public messagesToday: any[] = [];
    public messages: any[] = [];
    public financialDataObj: any;
    // public loanDetailsData: any;
    public depositDetailsData: any;
    public tokenStatusPass: any = false;
    @ViewChild(OverviewDateRangeSelectorComponent) childDates: OverviewDateRangeSelectorComponent;
    // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;
    public transTypesArr: any[];
    private transTypesMap: { [key: string]: any };
    public filterTypesCategory: any = null;

    public filterOperation: 'TRANS_TYPE' | 'PAYMENT_DESC' = 'PAYMENT_DESC';
    public updateOperationAggregateData: any;
    public zhutNigrarot: number | null;
    public hovaNigrarot: number | null;
    public nigrarotCount: number | null;
    public showCreditLine: boolean | number = false;
    public popUpDeposit: any = false;
    public popUpRemoveLoansAndDeposit: any = false;
    public showItemPop = {};
    @ViewChild(ChartsComponent) childGraph: ChartsComponent;
    @ViewChild('widthGraph') widthGraph: ElementRef;
    @ViewChild(AccountSelectComponent) accountSelector: AccountSelectComponent;
    public selectedNotUpdatedAccounts: any[];
    public arrSlices: any[] = [
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false
    ];
    // private transactionAdditionalDetailId$ = new Subject<any>();
    // public showAdditionalItem: any;
    // private showAdditionalTarget: any;
    // public additionalCheckSelected: any = null;
    // public additionalBodyHasScroll = false;
    public TokenStatus = TokenStatus;
    public updatePromptVisible = false;
    companyMessages: Observable<any>;
    expectedToExceedAccounts: {
        companyAccountId: string;
        harigaDate: number;
    }[];
    selectedAccountsExceedSummary: {
        exceeded: {
            companyAccountId: string;
            balanceUse: number;
        }[];
        expectedTo: any;
    };
    updatePromptData: {
        token: string;
        status: string;
        bankId: string;
        websiteTargetTypeId: string;
        accountNickname: string;
        companyId: string;
    } = null;
    dateTotalsHovered: any[];
    dateTotalsHoveredParentStyle: string | null;
    dateTotalsHoveredStyle: string | null;
    paymentTypesTranslate: any;
    // private companyTransTypes: any[];
    // private companyTransTypes$: Subscription;
    paramDate: any;
    readonly palette = {
        incomes: ['#73c79a', '#50b07d', '#359562', '#278754', '#136238'].reverse(),
        expenses: [
            '#fcd4d2',
            '#f8bdb9',
            '#f6a59e',
            '#f4857c',
            '#f26666',
            '#ef3636',
            '#c50000'
        ].reverse()
    };
    getDetailsPopupGeneral: any;
    @ViewChild(AccountSelectComponent) accSelector: AccountSelectComponent;

    creditLimitRenderedByChart = false;
    chartDetailTooltips: {
        [k: string]: {
            point: any;
            result: Observable<any> | string;
        };
    };

    private readonly destroyed$ = new Subject<void>();

    toggleLoanDetails: boolean;
    selectedCompanyAccountIds: Array<string>;

    constructor(
        public userService: UserService,
        private sharedService: SharedService,
        private renderer: Renderer2,
        private dtHumanizePipe: TodayRelativeHumanizePipe,
        private currencySymbolPipe: CurrencySymbolPipe,
        public translate: TranslateService,
        private router: Router,
        private route: ActivatedRoute,
        private storageService: StorageService,
        public sharedComponent: SharedComponent,
        public browserDetect: BrowserService,
        private filterPipe: FilterPipe,
        private reportService: ReportService,
        public tokenService: TokenService,
        private messagesService: MessagesService,
        private toIconSrcPipe: ToIconSrcPipe,
        private transTypesService: TransTypesService
    ) {
        // if (this.userService.appData.userData.companies) {
        //     this.sharedService.getTransTypes(this.userService.appData.userData.companySelect.companyId)
        //         .subscribe(rslt => this.companyTransTypes = rslt);
        // } else {
        //     this.companyTransTypes$ = sharedComponent.getDataEvent.pipe(switchMap(() => {
        //         return this.sharedService.getTransTypes(this.userService.appData.userData.companySelect.companyId);
        //     })).subscribe(rslt => this.companyTransTypes = rslt);
        // }
        // this.companyTransTypes$ = this.transTypesService.selectedCompanyTransTypes
        //     .pipe(
        //         takeUntil(this.destroyed$)
        //     )
        //     .subscribe(rslt => this.onCategoriesArrive(rslt));
    }

    ngOnInit() {
        console.log('')
    }

    ngAfterViewInit(): void {
        this.changeAcc(null);

        this.companyMessages = this.accSelector.changedTrigger
            // this.companyMessages = zip(
            //     this.sharedComponent.getDataEvent.pipe(startWith(true)),
            //     this.accSelector.onChange.pipe(startWith(true)))
            .pipe(
                startWith(true),
                filter(
                    () =>
                        this.userService.appData &&
                        this.userService.appData.userData &&
                        this.userService.appData.userData.companySelect
                ),
                switchMap(() => {
                    return this.userService.appData.userData.companySelect &&
                    this.userService.appData.userData.accountSelect
                        ? this.messagesService.getCompanyMessages()
                        : of([]);
                }),
                publishRef
            );

        this.childDates.selectedRange
            .pipe(
                filter(
                    () =>
                        Array.isArray(this.userService.appData.userData.accountSelect) &&
                        this.userService.appData.userData.accountSelect.length
                )
            )
            .subscribe((rng) => this.filterDates(rng));

        let companyIdsHideAlertTokensArr = null;
        this.sharedComponent.getDataEvent
            .pipe(
                startWith(true),
                tap(() => {
                    companyIdsHideAlertTokensArr = [];
                    const companyIdsHideAlertTokens =
                        this.storageService.sessionStorageGetterItem(
                            'companyIdsHideAlertTokens'
                        );
                    if (companyIdsHideAlertTokens !== null) {
                        companyIdsHideAlertTokensArr = JSON.parse(
                            companyIdsHideAlertTokens
                        );
                    }
                }),
                map(() =>
                    this.userService.appData &&
                    this.userService.appData.userData &&
                    this.userService.appData.userData.companySelect
                        ? this.userService.appData.userData.companySelect.companyId
                        : null
                ),
                filter(
                    (companyId) =>
                        !!companyId &&
                        (!companyIdsHideAlertTokensArr.length ||
                            !companyIdsHideAlertTokensArr.some((ids) => ids === companyId))
                ),
                takeUntil(this.destroyed$)
            )
            .subscribe(() => {
                this.userService.appData.userData.companySelect.alertTokens = false;
                this.sharedService
                    .getAlertTokens(
                        this.userService.appData.userData.companySelect.companyId
                    )
                    .subscribe((response: any) => {
                        this.userService.appData.userData.companySelect.alertTokens =
                            response && Array.isArray(response['body'])
                                ? response['body']
                                : [];
                        if (this.userService.appData.userData.companySelect.alertTokens.length) {
                            const alertTokensMotyEyalPoalimAsakim = this.userService.appData.userData.companySelect.alertTokens.filter(it =>
                                it.token === '88e6c85e-b914-4928-8436-47e86dddd3a4' ||
                                it.token === '88e6c85e-b914-4928-8436-47e86dddd3a5' ||
                                it.token === '88E6C85EB9144928843647E86DDDD3A5' ||
                                it.token === '88E6C85EB9144928843647E86DDDD3A4');
                            const alertTokensOthers = this.userService.appData.userData.companySelect.alertTokens.filter(it =>
                                it.token !== '88e6c85e-b914-4928-8436-47e86dddd3a4' &&
                                it.token !== '88e6c85e-b914-4928-8436-47e86dddd3a5' &&
                                it.token !== '88E6C85EB9144928843647E86DDDD3A5' &&
                                it.token !== '88E6C85EB9144928843647E86DDDD3A4');
                            this.userService.appData.userData.companySelect.alertTokensMotyEyalPoalimAsakim = alertTokensMotyEyalPoalimAsakim.length > 0;
                            this.userService.appData.userData.companySelect.alertTokensOthers = alertTokensOthers;
                        }
                    });
            });
    }

    ngOnDestroy(): void {
        // if (this.companyTransTypes$) {
        //     this.companyTransTypes$.unsubscribe();
        // }
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    private setupItemView(trns: any): void {
        // console.log('trns -> %o', trns);

        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === trns.accountUuid
        );
        trns.active = false;
        return Object.assign(trns, trnsAcc);
    }

    selectAccountInDeviation(account: any): void {
        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === account.companyAccountId
        );
        this.userService.appData.userData.accountSelect = [].concat(trnsAcc);
        this.accountSelector.applyValuesFromModel();
        this.changeAcc(null);
    }

    changeAcc(event): void {
        if (this.childDates) {
            this.financialData();

            this.childDates.selectedRange
                .pipe(take(1))
                .subscribe((rng) => this.filterDates(rng));
            // this.childDates.filter('aggregateGeneral');
            // this.filterDates(this.childDates.selectedPeriod);

            this.getListMessages();

            if (!this.userService.appData.userData.accountSelect.length) {
                this.dataTableAll = [];
                this.dataChart = undefined;
                this.zhutNigrarot = null;
                this.hovaNigrarot = null;
                this.nigrarotCount = null;
                this.selectedAccountsExceedSummary = null;
                this.tokenStatusPass = false;
                return;
            }

            if (this.userService.appData.userData.companySelect.lite) {
                this.getStatusOfPasswords();
            }

            const selectedValueFromMonth = new Date(
                this.userService.appData.userData.accountSelect.length
                    ? this.userService.appData.userData.accountSelect[0]
                        .balanceLastUpdatedDate
                    : this.userService.appData.userData.accounts[0].balanceLastUpdatedDate
            );

            const parameters: any = {
                companyAccountIds: this.userService.appData.userData.accountSelect.map(
                    (account) => {
                        return account.companyAccountId;
                    }
                ),
                companyId: this.userService.appData.userData.companySelect.companyId,
                dateFrom: this.userService.appData.userData.companySelect.lite
                    ? new Date(
                        new Date().getFullYear(),
                        new Date().getMonth(),
                        new Date().getDate() - 30
                    )
                    : new Date(
                        selectedValueFromMonth.getFullYear(),
                        selectedValueFromMonth.getMonth(),
                        selectedValueFromMonth.getDate() - 2
                    ),
                dateTill: this.userService.appData.userData.companySelect.lite
                    ? new Date()
                    : new Date(
                        selectedValueFromMonth.getFullYear(),
                        selectedValueFromMonth.getMonth(),
                        selectedValueFromMonth.getDate() + 30
                    ),
                expence: -1
            };
            console.log(
                'dateFrom = %o, dateTill = %o',
                parameters.dateFrom,
                parameters.dateTill
            );
            this.sharedService.aggregateCashFlow(parameters).subscribe(
                {
                    next: (response: any) => {
                        const dataTableAll =
                            response && Array.isArray(response['body']) ? response['body'] : [];
                        const accounts = dataTableAll.filter((account) => {
                            return (
                                account.accountUuid !== null &&
                                parameters.companyAccountIds.includes(account.accountUuid)
                            );
                        });
                        const allAcc = dataTableAll.filter((account) => {
                            return account.accountUuid === null;
                        });
                        accounts.sort((a, b) => {
                            return (
                                this.userService.appData.userData.accountSelect.findIndex(
                                    (acc: any) => acc.companyAccountId === a.accountUuid
                                ) -
                                this.userService.appData.userData.accountSelect.findIndex(
                                    (acc: any) => acc.companyAccountId === b.accountUuid
                                )
                            );
                        });

                        const outdatedSelectedAccountsMap: { [k: string]: number } =
                            this.userService.appData.userData.accountSelect
                                .filter((acc: any) => !acc.isUpToDate)
                                .reduce((acmltr, outdatedAcc) => {
                                    acmltr[outdatedAcc.companyAccountId] =
                                        outdatedAcc.balanceLastUpdatedDate;
                                    return acmltr;
                                }, Object.create(null));

                        accounts
                            .filter((acc: any) => outdatedSelectedAccountsMap[acc.accountUuid])
                            .forEach((acc: any) => {
                                acc.accountTransactions
                                    .filter(
                                        (trns) =>
                                            trns.transDate > outdatedSelectedAccountsMap[acc.accountUuid]
                                    )
                                    .forEach(
                                        (trns) =>
                                            ([trns.zhut, trns.hova, trns.itra, trns.totalCredit] = [
                                                null,
                                                null,
                                                null,
                                                null
                                            ])
                                    );
                            });

                        if (this.userService.appData.userData.accountSelect.length === 1) {
                            this.dataTableAll = accounts;
                        } else {
                            this.dataTableAll = allAcc.concat(accounts);
                        }

                        this.dataTableAll = this.dataTableAll.map((trns) =>
                            this.setupItemView(trns)
                        );
                        if (this.dataTableAll.length) {
                            this.dataTableAll[0].balanceUse = this.dataTableAll
                                .filter((acc: any) => acc.accountUuid !== null)
                                .map((acc: any) => +acc.balanceUse)
                                .reduce((a, b) => a + b, 0);
                            this.dataTableAll[0].accountBalance = this.dataTableAll
                                .filter((acc: any) => acc.accountUuid !== null)
                                .map((acc: any) => +acc.accountBalance)
                                .reduce((a, b) => a + b, 0);
                            this.dataTableAll[0].creditLimit = this.dataTableAll
                                .filter((acc: any) => acc.accountUuid !== null)
                                .map((acc: any) => +acc.creditLimit)
                                .reduce((a, b) => a + b, 0);
                            this.zhutNigrarot = +this.dataTableAll[0].zhutNigrarot;
                            this.hovaNigrarot = +this.dataTableAll[0].hovaNigrarot;
                            this.nigrarotCount = allAcc[0].countTrans;
                        } else {
                            this.zhutNigrarot = null;
                            this.hovaNigrarot = null;
                            this.nigrarotCount = null;
                        }

                        if (this.dataTableAll.length) {
                            this.setGraphItrot(this.dataTableAll[0]);
                        } else {
                            this.dataChart = undefined;
                        }

                        this.selectedAccountsExceedSummary = {
                            exceeded: this.userService.appData.userData.accountSelect
                                .filter((acc: any) => +acc.balanceUse < 0)
                                .map((acc: any) => {
                                    return {
                                        companyAccountId: acc.companyAccountId,
                                        balanceUse: +acc.balanceUse
                                    };
                                }),
                            expectedTo: accounts
                                .filter((acc: any) => acc.harigaDate !== null)
                                .map((acc: any) => {
                                    return {
                                        companyAccountId: acc.accountUuid,
                                        harigaDate: new Date(acc.harigaDate)
                                    };
                                })
                        };

                        // this.expectedToExceedAccounts = accounts.filter(acc => acc.harigaDate !== null)
                        //     .map(acc => {
                        //         return {
                        //             companyAccountId: acc.accountUuid,
                        //             harigaDate: new Date(acc.harigaDate)
                        //         };
                        //     });
                    },
                    error: (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred:', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                }
            );
        }
    }

    filterDates(paramDate: any): void {
        this.paramDate = paramDate;
        if (this.userService.appData.userData.accountSelect.length) {
            const parameters: any = {
                operationType: this.filterOperation,
                params: {
                    companyAccountIds:
                        this.userService.appData.userData.accountSelect.map((account) => {
                            return account.companyAccountId;
                        }),
                    dateFrom: paramDate.fromDate,
                    dateTill: paramDate.toDate
                }
            };
            zip(
                this.sharedService.updateOperationAggregate(parameters),
                this.sharedService.paymentTypesTranslate$,
                this.transTypesService.selectedCompanyTransTypes
            )
                .pipe(takeUntil(this.destroyed$))
                .subscribe((resSub: any) => {
                    const [response, paymentTypesTranslate, companyTransTypes] = resSub;
                    this.paymentTypesTranslate = paymentTypesTranslate;
                    this.updateOperationAggregateData = response
                        ? response['body']
                        : response;
                    let totalIncomes = '-';
                    if (this.updateOperationAggregateData.totalIncomes !== null) {
                        // tslint:disable-next-line:max-line-length
                        totalIncomes = `${this.currencySymbolPipe.transform(
                            this.userService.appData.userData.accountSelect[0].currency
                        )} ${roundAndAddComma(
                            this.updateOperationAggregateData.totalIncomes
                        )}`;
                    }
                    let totalExpenses = '-';
                    if (this.updateOperationAggregateData.totalExpenses !== null) {
                        // tslint:disable-next-line:max-line-length
                        totalExpenses = `${this.currencySymbolPipe.transform(
                            this.userService.appData.userData.accountSelect[0].currency
                        )} ${roundAndAddComma(
                            this.updateOperationAggregateData.totalExpenses
                        )}`;
                        this.updateOperationAggregateData.totalExpenses = Math.abs(
                            this.updateOperationAggregateData.totalExpenses
                        );
                    }

                    if (this.updateOperationAggregateData.incomes) {
                        this.updateOperationAggregateData.incomes.forEach((item: any) => {
                            item.press = true;
                            item.prc = item.dateTotals[0].prc;
                            const itemTransType =
                                this.filterOperation === 'TRANS_TYPE'
                                    ? companyTransTypes.find(
                                        (tt) => tt.transTypeName === item.description
                                    )
                                    : null;
                            item.link = {
                                type: false,
                                dates: true,
                                paymentType:
                                    this.filterOperation === 'PAYMENT_DESC'
                                        ? item.description
                                        : null,
                                transType: itemTransType ? itemTransType.transTypeId : null
                            };
                        });
                    }
                    if (this.updateOperationAggregateData.expenses) {
                        this.updateOperationAggregateData.expenses.forEach((item: any) => {
                            item.press = true;
                            item.prc = item.dateTotals[0].prc;
                            const itemTransType =
                                this.filterOperation === 'TRANS_TYPE'
                                    ? companyTransTypes.find(
                                        (tt) => tt.transTypeName === item.description
                                    )
                                    : null;
                            item.link = {
                                type: true,
                                dates: true,
                                paymentType:
                                    this.filterOperation === 'PAYMENT_DESC'
                                        ? item.description
                                        : null,
                                transType: itemTransType ? itemTransType.transTypeId : null
                            };
                        });
                    }

                    const incomes = this.updateOperationAggregateData.incomes;
                    const expenses = this.updateOperationAggregateData.expenses;
                    this.userService.appData.userData.pieGeneral = false;
                    const _this = this;
                    this.pieChartGreen =
                        incomes === null || !incomes.length
                            ? this.createDummyPieChart('incomes')
                            : {
                                pie: true,
                                data: {
                                    chart: {
                                        plotBackgroundColor: null,
                                        plotBorderWidth: null,
                                        plotShadow: false,
                                        type: 'pie',
                                        spacingRight: 0,
                                        marginBottom: 20,
                                        style: {
                                            fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                            fontSize: '14px'
                                        },
                                        plotBorderColor: '#ffffff',
                                        alignTicks: false,
                                        zoomType: null,
                                        shadow: false,
                                        borderColor: '#ffffff',
                                        borderWidth: 0,
                                        borderRadius: 0,
                                        backgroundColor: null, // '#ffffff',
                                        ignoreHiddenSeries: false,
                                        animation: {
                                            duration: 300
                                        },
                                        reflow: true,
                                        inverted: false,
                                        className: 'columnClass',
                                        events: {
                                            click: function (e) {
                                                const isTitle = (e.target as HTMLElement)
                                                    ? [
                                                        <HTMLElement>e.target,
                                                        <HTMLElement>e.target.parentElement
                                                    ]
                                                        .filter((el) => el)
                                                        .map((el) => el.getAttribute('class'))
                                                        .some(
                                                            (clss) =>
                                                                clss && clss.includes('highcharts-title')
                                                        )
                                                    : false;
                                                if (isTitle) {
                                                    _this.goToBankAccount({
                                                        type: false,
                                                        dates: true
                                                    });
                                                }
                                            }.bind(this)
                                        }
                                    },
                                    legend: {
                                        enabled: false
                                    },
                                    subtitle: {
                                        text: ''
                                    },
                                    colors: this.palette.incomes,
                                    title: {
                                        useHTML: true,
                                        text: `<div class="strongTitle">
${this.translate.instant('menu.customers.tazrim.charts.incomes')}
</div>
<div class="sumTitle">
${totalIncomes}
</div>`,
                                        align: 'center',
                                        verticalAlign: 'middle',
                                        y: 10
                                    },
                                    credits: {
                                        enabled: false
                                    },
                                    plotOptions: {
                                        pie: {
                                            borderColor: null,
                                            innerSize: '60%',
                                            allowPointSelect: true,
                                            cursor: 'pointer',
                                            dataLabels: {
                                                enabled: false,
                                                format: '{point.p}%',
                                                style: {
                                                    fontWeight: 'bold',
                                                    color: '#022258',
                                                    fontSize: '14px',
                                                    textOutline: null
                                                },
                                                distance: -21,
                                                padding: 0
                                            }
                                        },
                                        series: {
                                            allowPointSelect: true,
                                            shadow: false,
                                            states: {
                                                inactive: {
                                                    opacity: 1
                                                },
                                                hover: {
                                                    enabled: true,
                                                    animation: {
                                                        duration: 70
                                                    },
                                                    brightness: 0,
                                                    halo: {
                                                        size: 16,
                                                        opacity: 1,
                                                        attributes: {
                                                            'stroke-width': 0
                                                        }
                                                    }
                                                }
                                            },
                                            point: {
                                                events: {
                                                    mouseOver: function (e) {
                                                        const chart = this['name'];
                                                        incomes.forEach((item) => {
                                                            if (item.description === chart) {
                                                                item.active = true;
                                                            } else {
                                                                item.active = false;
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            events: {
                                                mouseOut: () => {
                                                    this.updateOperationAggregateData.incomes.forEach(
                                                        (item) => {
                                                            item.active = false;
                                                        }
                                                    );
                                                }
                                            },
                                            animation: {
                                                duration: 200
                                            }
                                        }
                                    },
                                    tooltip: {
                                        // snap: 0,
                                        // hideDelay: 5000,
                                        backgroundColor: '#ffffff',
                                        borderWidth: 1,
                                        borderColor: '#ebebeb',
                                        useHTML: true,
                                        borderRadius: 4,
                                        padding: 0,
                                        shadow: true,
                                        enabled: true,
                                        shared: false,
                                        style: {
                                            pointerEvents: 'auto'
                                        },
                                        formatter: function (this: any) {
                                            return `<div class="tooltip-charts pie-tooltip">
<div class="title">
                      ${this.key}
</div>
<div class="total" style="color: #229f88;">
                        ${roundAndAddComma(this.y)}
</div>
<div class="total">
                        ${this.point.p !== 0 ? this.point.p : 'קטן מ-1'}%
</div>
                        </div>`;
                                        }
                                    },
                                    series: [
                                        {
                                            colorByPoint: true,
                                            type: 'pie',
                                            data: incomes.map((item) => {
                                                if (this.filterOperation === 'PAYMENT_DESC') {
                                                    item.descriptionOrigin = item.description;
                                                    item.description =
                                                        paymentTypesTranslate[item.description];
                                                    // this.translate.instant('paymentTypes.' + item.description);
                                                }
                                                return {
                                                    p: item.dateTotals[0].prc,
                                                    name: item.description,
                                                    y: item.dateTotals[0].total,
                                                    sliced: false,
                                                    selected: false
                                                };
                                            })
                                        }
                                    ]
                                }
                            };
                    this.pieChartRed =
                        expenses === null || !expenses.length
                            ? this.createDummyPieChart('expenses')
                            : {
                                pie: true,
                                data: {
                                    chart: {
                                        plotBackgroundColor: null,
                                        plotBorderWidth: null,
                                        plotShadow: false,
                                        type: 'pie',
                                        spacingRight: 0,
                                        marginBottom: 20,
                                        style: {
                                            fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                            fontSize: '14px'
                                        },
                                        plotBorderColor: '#ffffff',
                                        alignTicks: false,
                                        zoomType: null,
                                        shadow: false,
                                        borderColor: '#ffffff',
                                        borderWidth: 0,
                                        borderRadius: 0,
                                        backgroundColor: null, // '#ffffff',
                                        ignoreHiddenSeries: false,
                                        animation: {
                                            duration: 300
                                        },
                                        reflow: true,
                                        inverted: false,
                                        className: 'columnClass',
                                        events: {
                                            click: function (e) {
                                                const isTitle = (e.target as HTMLElement)
                                                    ? [
                                                        <HTMLElement>e.target,
                                                        <HTMLElement>e.target.parentElement
                                                    ]
                                                        .filter((el) => el)
                                                        .map((el) => el.getAttribute('class'))
                                                        .some(
                                                            (clss) =>
                                                                clss && clss.includes('highcharts-title')
                                                        )
                                                    : false;
                                                if (isTitle) {
                                                    _this.goToBankAccount({type: true, dates: true});
                                                }
                                            }.bind(this)
                                        }
                                    },
                                    colors: this.palette.expenses,
                                    title: {
                                        useHTML: true,
                                        text: `<div class="strongTitle">
${this.translate.instant('menu.customers.tazrim.charts.expenses')}
</div>
<div class="sumTitle">
${totalExpenses}
</div>`,
                                        align: 'center',
                                        verticalAlign: 'middle',
                                        y: 10
                                    },
                                    tooltip: {
                                        // snap: 0,
                                        // hideDelay: 5000,
                                        backgroundColor: '#ffffff',
                                        borderWidth: 1,
                                        borderColor: '#ebebeb',
                                        useHTML: true,
                                        borderRadius: 4,
                                        padding: 0,
                                        shadow: true,
                                        enabled: true,
                                        shared: false,
                                        style: {
                                            pointerEvents: 'auto'
                                        },
                                        formatter: function (this: any) {
                                            return `<div class="tooltip-charts pie-tooltip">
<div class="title">
                      ${this.key}
</div>
<div class="total" style="color: #c50000;">
                        ${roundAndAddComma(this.y)}
</div>
<div class="total">
                        ${this.point.p !== 0 ? this.point.p : 'קטן מ-1'}%
</div>
                        </div>`;
                                        }
                                    },
                                    credits: {
                                        enabled: false
                                    },
                                    plotOptions: {
                                        pie: {
                                            borderColor: null,
                                            innerSize: '60%',
                                            allowPointSelect: true,
                                            cursor: 'pointer',
                                            dataLabels: {
                                                enabled: false,
                                                format: '{point.p}%',
                                                style: {
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    textOutline: null
                                                },
                                                distance: -21,
                                                padding: 0
                                            }
                                        },
                                        series: {
                                            allowPointSelect: true,
                                            shadow: false,
                                            states: {
                                                inactive: {
                                                    opacity: 1
                                                },
                                                hover: {
                                                    enabled: true,
                                                    // brightness: -0.1
                                                    animation: {
                                                        duration: 70
                                                    },
                                                    brightness: 0,
                                                    halo: {
                                                        size: 16,
                                                        opacity: 1,
                                                        attributes: {
                                                            'stroke-width': 0
                                                        }
                                                    }
                                                }
                                            },
                                            point: {
                                                events: {
                                                    mouseOver: function () {
                                                        const chart = this['name'];
                                                        expenses.forEach((item) => {
                                                            if (item.description === chart) {
                                                                item.active = true;
                                                            } else {
                                                                item.active = false;
                                                            }
                                                        });
                                                    }
                                                }
                                            },
                                            events: {
                                                mouseOut: () => {
                                                    this.updateOperationAggregateData.expenses.forEach(
                                                        (item) => {
                                                            item.active = false;
                                                        }
                                                    );
                                                }
                                            },
                                            animation: {
                                                duration: 200
                                            }
                                        }
                                    },
                                    series: [
                                        {
                                            colorByPoint: true,
                                            type: 'pie',
                                            data:
                                                expenses && expenses.length
                                                    ? expenses.map((item) => {
                                                        if (this.filterOperation === 'PAYMENT_DESC') {
                                                            item.descriptionOrigin = item.description;
                                                            item.description =
                                                                paymentTypesTranslate[item.description];
                                                            // this.translate.instant('paymentTypes.' + item.description);
                                                        }
                                                        return {
                                                            p: item.dateTotals[0].prc,
                                                            name: item.description,
                                                            y: Math.abs(item.dateTotals[0].total),
                                                            sliced: false,
                                                            selected: false
                                                        };
                                                    })
                                                    : []
                                        }
                                    ]
                                }
                            };
                });
        } else {
            this.pieChartGreen = {};
            this.pieChartRed = {};
        }
    }

    activePie(type: string, item?: any, isLeave?: boolean) {
        // if (item) {
        //     item.active = true;
        // }
        if (type === 'green') {
            // let idx: any = null;
            // if (item) {
            //     idx = this.pieChartGreen.data.series[0].data.findIndex((row) => row.name === item.description);
            // }
            // this.pieChartGreen.data.series[0].data.forEach((row) => {
            //     if (item) {
            //         if (row.name === item.description) {
            //             row.sliced = true;
            //             row.selected = true;
            //         } else {
            //             row.sliced = false;
            //             row.selected = false;
            //         }
            //     } else {
            //         row.sliced = false;
            //         row.selected = false;
            //     }
            // });
            this.childGraph.updateSeries(
                this.pieChartGreen.data.series[0].data,
                type,
                item ? item.description : null,
                isLeave
            );
        }
        if (type === 'red') {
            // let idx: any = null;
            // if (item) {
            //     idx = this.pieChartRed.data.series[0].data.findIndex((row) => row.name === item.description);
            // }
            // this.pieChartRed.data.series[0].data.forEach((row) => {
            //     if (item) {
            //         if (row.name === item.description) {
            //             row.sliced = true;
            //             row.selected = true;
            //         } else {
            //             row.sliced = false;
            //             row.selected = false;
            //         }
            //     } else {
            //         row.sliced = false;
            //         row.selected = false;
            //     }
            // });
            this.childGraph.updateSeries(
                this.pieChartRed.data.series[0].data,
                type,
                item ? item.description : null,
                isLeave
            );
        }
    }

    round(num: number): number {
        return Math.round(num);
    }

    addToGraph(item: any, type: string): void {
        // item.press = !item.press;
        if (type === 'green') {
            const incomes = this.updateOperationAggregateData.incomes;
            const arrAfterFilter = incomes.filter((it) => it.press);
            const lengthAfterFilter = arrAfterFilter.length;
            const sumsAllItems = arrAfterFilter.reduce(
                (sum, ite) => sum + ite.dateTotals[0].total,
                0
            );
            incomes.forEach((it) => {
                it.prc =
                    lengthAfterFilter === incomes.length
                        ? it.dateTotals[0].prc
                        : Math.round(it.dateTotals[0].total / (sumsAllItems / 100));
            });
            const incomesChartFilter = arrAfterFilter.map((ite) => {
                return {
                    p:
                        lengthAfterFilter === incomes.length
                            ? ite.dateTotals[0].prc
                            : Math.round(ite.dateTotals[0].total / (sumsAllItems / 100)),
                    name: ite.description,
                    y: ite.dateTotals[0].total,
                    sliced: false,
                    selected: false
                };
            });

            if (incomesChartFilter.length > 1) {
                let totalIncomes = '-';
                const total = incomesChartFilter.reduce((a, b) => a + b.y, 0);
                // tslint:disable-next-line:max-line-length
                totalIncomes = `${this.currencySymbolPipe.transform(
                    this.userService.appData.userData.accountSelect[0].currency
                )} ${roundAndAddComma(total)}`;
                this.updateOperationAggregateData.totalIncomes = Math.abs(total);
                this.childGraph.updateDataSeries(
                    incomesChartFilter,
                    type,
                    `<div class="strongTitle">
${this.translate.instant('menu.customers.tazrim.charts.incomes')}
</div>
<div class="sumTitle">
${totalIncomes}
</div>`
                );
            } else {
                if (incomesChartFilter.length === 1) {
                    let totalIncomes = '-';
                    // tslint:disable-next-line:max-line-length
                    totalIncomes = `${this.currencySymbolPipe.transform(
                        this.userService.appData.userData.accountSelect[0].currency
                    )} ${roundAndAddComma(incomesChartFilter[0].y)}`;
                    this.updateOperationAggregateData.totalIncomes = Math.abs(
                        incomesChartFilter[0].y
                    );
                    this.userService.appData.userData.pieGeneralUpdate = 0;
                    const _this = this;
                    // this.userService.appData.userData.pieGeneral = false;
                    this.pieChartGreen = {
                        pie: true,
                        data: {
                            chart: {
                                plotBackgroundColor: null,
                                plotBorderWidth: null,
                                plotShadow: false,
                                type: 'pie',
                                spacingRight: 0,
                                marginBottom: 20,
                                style: {
                                    fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                    fontSize: '14px'
                                },
                                plotBorderColor: '#ffffff',
                                alignTicks: false,
                                zoomType: null,
                                shadow: false,
                                borderColor: '#ffffff',
                                borderWidth: 0,
                                borderRadius: 0,
                                backgroundColor: null, // '#ffffff',
                                ignoreHiddenSeries: false,
                                animation: {
                                    duration: 300
                                },
                                reflow: true,
                                inverted: false,
                                className: 'columnClass',
                                events: {
                                    click: function (e) {
                                        const isTitle = (e.target as HTMLElement)
                                            ? [
                                                <HTMLElement>e.target,
                                                <HTMLElement>e.target.parentElement
                                            ]
                                                .filter((el) => el)
                                                .map((el) => el.getAttribute('class'))
                                                .some(
                                                    (clss) => clss && clss.includes('highcharts-title')
                                                )
                                            : false;
                                        if (isTitle) {
                                            _this.goToBankAccount({type: false, dates: true});
                                        }
                                    }.bind(this)
                                }
                            },
                            legend: {
                                enabled: false
                            },
                            subtitle: {
                                text: ''
                            },
                            colors: this.palette.incomes,
                            title: {
                                useHTML: true,
                                text: `<div class="strongTitle">
${this.translate.instant('menu.customers.tazrim.charts.incomes')}
</div>
<div class="sumTitle">
${totalIncomes}
</div>`,
                                align: 'center',
                                verticalAlign: 'middle',
                                y: 10
                            },
                            credits: {
                                enabled: false
                            },
                            plotOptions: {
                                pie: {
                                    borderColor: null,
                                    innerSize: '60%',
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: {
                                        enabled: false,
                                        format: '{point.p}%',
                                        style: {
                                            fontWeight: 'bold',
                                            color: '#022258',
                                            fontSize: '14px',
                                            textOutline: null
                                        },
                                        distance: -21,
                                        padding: 0
                                    }
                                },
                                series: {
                                    allowPointSelect: true,
                                    shadow: false,
                                    states: {
                                        inactive: {
                                            opacity: 1
                                        },
                                        hover: {
                                            enabled: true,
                                            animation: {
                                                duration: 70
                                            },
                                            brightness: 0,
                                            halo: {
                                                size: 16,
                                                opacity: 1,
                                                attributes: {
                                                    'stroke-width': 0
                                                }
                                            }
                                        }
                                    },
                                    point: {
                                        events: {
                                            mouseOver: function (e) {
                                                const chart = this['name'];
                                                incomes.forEach((item) => {
                                                    if (item.description === chart) {
                                                        item.active = true;
                                                    } else {
                                                        item.active = false;
                                                    }
                                                });
                                            }
                                        }
                                    },
                                    events: {
                                        mouseOut: () => {
                                            this.updateOperationAggregateData.incomes.forEach(
                                                (item) => {
                                                    item.active = false;
                                                }
                                            );
                                        }
                                    },
                                    animation: {
                                        duration: 200
                                    }
                                }
                            },
                            tooltip: {
                                // snap: 0,
                                // hideDelay: 5000,
                                backgroundColor: '#ffffff',
                                borderWidth: 1,
                                borderColor: '#ebebeb',
                                useHTML: true,
                                borderRadius: 4,
                                padding: 0,
                                shadow: true,
                                enabled: true,
                                shared: false,
                                style: {
                                    pointerEvents: 'auto'
                                },
                                formatter: function (this: any) {
                                    return `<div class="tooltip-charts pie-tooltip">
<div class="title">
                      ${this.key}
</div>
<div class="total" style="color: #229f88;">
                        ${roundAndAddComma(this.y)}
</div>
<div class="total">
                        ${this.point.p !== 0 ? this.point.p : 'קטן מ-1'}%
</div>
                        </div>`;
                                }
                            },
                            series: [
                                {
                                    colorByPoint: true,
                                    type: 'pie',
                                    data: incomesChartFilter
                                }
                            ]
                        }
                    };
                } else {
                    this.updateOperationAggregateData.totalIncomes = Math.abs(0);
                    this.pieChartGreen = this.createDummyPieChart('incomes');
                }
            }
        }
        if (type === 'red') {
            const expenses = this.updateOperationAggregateData.expenses;
            const arrAfterFilter = expenses.filter((it) => it.press);
            const lengthAfterFilter = arrAfterFilter.length;
            const sumsAllItems = arrAfterFilter.reduce(
                (sum, ite) => sum + ite.dateTotals[0].total,
                0
            );
            expenses.forEach((it) => {
                it.prc =
                    lengthAfterFilter === expenses.length
                        ? it.dateTotals[0].prc
                        : Math.round(it.dateTotals[0].total / (sumsAllItems / 100));
            });
            const expensesChartFilter = arrAfterFilter.map((ite) => {
                return {
                    p:
                        lengthAfterFilter === expenses.length
                            ? ite.dateTotals[0].prc
                            : Math.round(ite.dateTotals[0].total / (sumsAllItems / 100)),
                    name: ite.description,
                    y: Math.abs(ite.dateTotals[0].total),
                    sliced: false,
                    selected: false
                };
            });

            if (expensesChartFilter.length > 1) {
                let totalExpenses = '-';
                const total = expensesChartFilter.reduce((a, b) => a + b.y, 0);
                // tslint:disable-next-line:max-line-length
                totalExpenses = `${this.currencySymbolPipe.transform(
                    this.userService.appData.userData.accountSelect[0].currency
                )} ${roundAndAddComma(total)}`;
                this.updateOperationAggregateData.totalExpenses = Math.abs(total);
                this.childGraph.updateDataSeries(
                    expensesChartFilter,
                    type,
                    `<div class="strongTitle">
${this.translate.instant('menu.customers.tazrim.charts.expenses')}
</div>
<div class="sumTitle">
${totalExpenses}
</div>`
                );
            } else {
                if (expensesChartFilter.length === 1) {
                    let totalExpenses = '-';
                    // tslint:disable-next-line:max-line-length
                    totalExpenses = `${this.currencySymbolPipe.transform(
                        this.userService.appData.userData.accountSelect[0].currency
                    )} ${roundAndAddComma(expensesChartFilter[0].y)}`;
                    this.updateOperationAggregateData.totalExpenses = Math.abs(
                        expensesChartFilter[0].y
                    );
                    this.userService.appData.userData.pieGeneralUpdate = 1;
                    const _this = this;
                    //this.userService.appData.userData.pieGeneral = false;
                    this.pieChartRed = {
                        pie: true,
                        data: {
                            chart: {
                                plotBackgroundColor: null,
                                plotBorderWidth: null,
                                plotShadow: false,
                                type: 'pie',
                                spacingRight: 0,
                                marginBottom: 20,
                                style: {
                                    fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                    fontSize: '14px'
                                },
                                plotBorderColor: '#ffffff',
                                alignTicks: false,
                                zoomType: null,
                                shadow: false,
                                borderColor: '#ffffff',
                                borderWidth: 0,
                                borderRadius: 0,
                                backgroundColor: null, // '#ffffff',
                                ignoreHiddenSeries: false,
                                animation: {
                                    duration: 300
                                },
                                reflow: true,
                                inverted: false,
                                className: 'columnClass',
                                events: {
                                    click: function (e) {
                                        const isTitle = (e.target as HTMLElement)
                                            ? [
                                                <HTMLElement>e.target,
                                                <HTMLElement>e.target.parentElement
                                            ]
                                                .filter((el) => el)
                                                .map((el) => el.getAttribute('class'))
                                                .some(
                                                    (clss) => clss && clss.includes('highcharts-title')
                                                )
                                            : false;
                                        if (isTitle) {
                                            _this.goToBankAccount({type: true, dates: true});
                                        }
                                    }.bind(this)
                                }
                            },
                            colors: this.palette.expenses,
                            title: {
                                useHTML: true,
                                text: `<div class="strongTitle">
${this.translate.instant('menu.customers.tazrim.charts.expenses')}
</div>
<div class="sumTitle">
${totalExpenses}
</div>`,
                                align: 'center',
                                verticalAlign: 'middle',
                                y: 10
                            },
                            tooltip: {
                                // snap: 0,
                                // hideDelay: 5000,
                                backgroundColor: '#ffffff',
                                borderWidth: 1,
                                borderColor: '#ebebeb',
                                useHTML: true,
                                borderRadius: 4,
                                padding: 0,
                                shadow: true,
                                enabled: true,
                                shared: false,
                                style: {
                                    pointerEvents: 'auto'
                                },
                                formatter: function (this: any) {
                                    return `<div class="tooltip-charts pie-tooltip">
<div class="title">
                      ${this.key}
</div>
<div class="total" style="color: #c50000;">
                        ${roundAndAddComma(this.y)}
</div>
<div class="total">
                        ${this.point.p !== 0 ? this.point.p : 'קטן מ-1'}%
</div>
                        </div>`;
                                }
                            },
                            credits: {
                                enabled: false
                            },
                            plotOptions: {
                                pie: {
                                    borderColor: null,
                                    innerSize: '60%',
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: {
                                        enabled: false,
                                        format: '{point.p}%',
                                        style: {
                                            fontWeight: 'bold',
                                            color: 'white',
                                            fontSize: '14px',
                                            textOutline: null
                                        },
                                        distance: -21,
                                        padding: 0
                                    }
                                },
                                series: {
                                    allowPointSelect: true,
                                    shadow: false,
                                    states: {
                                        inactive: {
                                            opacity: 1
                                        },
                                        hover: {
                                            enabled: true,
                                            animation: {
                                                duration: 70
                                            },
                                            brightness: 0,
                                            halo: {
                                                size: 16,
                                                opacity: 1,
                                                attributes: {
                                                    'stroke-width': 0
                                                }
                                            }
                                        }
                                    },
                                    point: {
                                        events: {
                                            mouseOver: function () {
                                                const chart = this['name'];
                                                expenses.forEach((item) => {
                                                    if (item.description === chart) {
                                                        item.active = true;
                                                    } else {
                                                        item.active = false;
                                                    }
                                                });
                                            }
                                        }
                                    },
                                    events: {
                                        mouseOut: () => {
                                            this.updateOperationAggregateData.expenses.forEach(
                                                (item) => {
                                                    item.active = false;
                                                }
                                            );
                                        }
                                    },
                                    animation: {
                                        duration: 200
                                    }
                                }
                            },
                            series: [
                                {
                                    colorByPoint: true,
                                    type: 'pie',
                                    data: expensesChartFilter
                                }
                            ]
                        }
                    };
                } else {
                    this.updateOperationAggregateData.totalExpenses = Math.abs(0);
                    this.pieChartRed = this.createDummyPieChart('expenses');
                }
            }
        }
    }

    formatWithoutPointsSum(sum) {
        return formatWithoutPoints(sum);
    }

    financialData() {
        this.financialDataObj = {};
        const parameters: any = {
            companyAccountIds: this.userService.appData.userData.accountSelect.map(
                (account) => {
                    return account.companyAccountId;
                }
            ),
            dateFrom: 'null',
            dateTill: 'null'
        };
        this.sharedService.financialData(parameters).subscribe(
            (response: any) => {
                this.financialDataObj = response ? response['body'] : response;
            },
            (err: HttpErrorResponse) => {
                if (err.error) {
                    console.log('An error occurred:', err.error.message);
                } else {
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    scrollAcc(evntAccHandle: any) {
        requestAnimationFrame(() => {
            evntAccHandle.target.focus({preventScroll: true});
            evntAccHandle.target.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        });
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(event) {
        if (this.dataTableAll && this.dataTableAll.length) {
            const itemActive = this.dataTableAll.find((acc: any) => acc.active);
            if (itemActive) {
                const widthGraphColOnly =
                    Math.floor((this.widthGraph.nativeElement.offsetWidth - 55) / 40) - 1;
                let xMax = itemActive.accountTransactions.length;
                if (xMax > widthGraphColOnly) {
                    xMax = widthGraphColOnly;
                }
                this.childGraph.chartPoints.finish =
                    this.childGraph.chartPoints.start + xMax;
                this.childGraph.setExtremes(
                    this.childGraph.chartPoints.start,
                    this.childGraph.chartPoints.finish
                );
            }
        }
    }

    setGraphItrot(item: any) {
        const sharedService = this.sharedService;
        const companyId = this.userService.appData.userData.companySelect.companyId;
        const widthGraphColOnly =
            Math.floor((this.widthGraph.nativeElement.offsetWidth - 55) / 40) - 1;
        this.dataTableAll.forEach((acc: any) => {
            if (acc.accountUuid === item.accountUuid) {
                acc.active = true;
            } else {
                acc.active = false;
            }
        });
        let isAllAcc = false;
        if (
            this.dataTableAll[0].accountUuid === null &&
            this.dataTableAll[0].active
        ) {
            isAllAcc = true;
        }
        // let oldDate = 0;
        const nowMmnt = this.userService.appData.moment();
        const accBalanceLastUpdatedDateMmnt = this.userService.appData.moment(
            item.balanceLastUpdatedDate
                ? item.balanceLastUpdatedDate
                : this.userService.appData.userData.accountSelect[0]
                    .balanceLastUpdatedDate
        );
        const hideData =
            this.userService.appData
                .moment()
                .diff(accBalanceLastUpdatedDateMmnt, 'days', true) > 3;
        const data = item.accountTransactions.map((trans) => {
            const transDateMmnt = this.userService.appData.moment(trans.transDate);
            if (nowMmnt.isSame(transDateMmnt, 'day')) {
                // if (accBalanceLastUpdatedDateMmnt.isSame(transDateMmnt, 'day')) {
                return {
                    color: '#022258',
                    y: trans.itra,
                    marker: {enabled: true, radius: 6},
                    transDateMmnt: transDateMmnt
                };
            } else {
                return {
                    color: '#34b0d7',
                    y: trans.itra,
                    transDateMmnt: transDateMmnt
                };
            }
            // if (item.balanceLastUpdatedDate !== undefined) {
            //     if (+trans.itra < +item.creditLimit) {
            //         return {
            //             color: '#fcd4d2',
            //             y: +trans.itra
            //         };
            //     } else {
            //         const days = compareDates(new Date(item.balanceLastUpdatedDate), new Date(trans.transDate));
            //         if (days) {
            //             return {
            //                 color: '#022258',
            //                 y: +trans.itra,
            //                 marker: { enabled: true }
            //             };
            //         } else {
            //             if (item.balanceLastUpdatedDate < trans.transDate) {
            //                 return {
            //                     color: '#34b0d7',
            //                     y: +trans.itra
            //                 };
            //             } else {
            //                 oldDate += 1;
            //                 return {
            //                     color: '#dee4e8',
            //                     y: +trans.itra
            //                 };
            //             }
            //         }
            //     }
            // } else {
            //     if (+trans.itra < +item.creditLimit) {
            //         return {
            //             color: '#fcd4d2',
            //             y: +trans.itra
            //         };
            //     } else {
            //         const days = compareDates(new Date(this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate),
            //             new Date(trans.transDate));
            //         if (days) {
            //             return {
            //                 color: '#022258',
            //                 y: +trans.itra,
            //                 marker: { enabled: true }
            //             };
            //         } else {
            //             if (this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate < trans.transDate) {
            //                 return {
            //                     color: '#34b0d7',
            //                     y: +trans.itra
            //                 };
            //             } else {
            //                 oldDate += 1;
            //                 return {
            //                     color: '#dee4e8',
            //                     y: +trans.itra
            //                 };
            //             }
            //         }
            //     }
            // }
        });

        const minLine = Math.min(
            ...data.map((line) => line.y),
            item.creditLimit || 0,
            0
        );
        const maxLine = Math.max(
            ...data.map((line) => line.y),
            item.creditLimit || 0,
            0
        );
        // if (minLine > 0) {
        //     minLine = 0;
        // }
        let xMax = item.accountTransactions.length;
        let scrollbar = false;
        if (xMax > widthGraphColOnly) {
            xMax = widthGraphColOnly;
            scrollbar = false;
        }

        this.showCreditLine = item.creditLimit
            ? item.creditLimit * Math.sign(item.creditLimit) * -1
            : false; // false;
        const isShowCreditInGraph = this;
        const currency = getCurrencySymbol(
            [this.userService.appData.userData.accountSelect[0].currency][0],
            'narrow'
        );

        // let KLimit = '';
        // if ((item.creditLimit / 1000) !== 0) {
        //     KLimit = 'K';
        // }
        // if (item.creditLimit !== undefined && ((+item.creditLimit < minLine) || (+item.creditLimit > maxLine))) {
        //     this.showCreditLine = +item.creditLimit;
        // }
        // debugger;
        // let timeoutWs, isFire = true;
        this.chartDetailTooltips = null;
        this.dataChart = {
            // locationCreditLimit: (this.showCreditLine !== false) ? ((this.showCreditLine < minLine) ? 'bottom' : 'top') : false,
            start: 0,
            finish: hideData ? 0 : xMax,
            max: item.accountTransactions.length,
            columnWithMinus: true,
            data: {
                chart: {
                    type: 'area',
                    spacingRight: 25,
                    marginBottom: 25,
                    defaultSeriesType: 'column',
                    style: {
                        fontSize: '14px'
                    },
                    plotBorderColor: '#ffffff',
                    plotBorderWidth: 0,
                    plotBackgroundColor: '#ffffff',
                    alignTicks: false,
                    zoomType: null,
                    plotShadow: false,
                    shadow: false,
                    borderColor: '#ffffff',
                    borderWidth: 0,
                    borderRadius: 0,
                    backgroundColor: '#ffffff',
                    ignoreHiddenSeries: false,
                    animation: {
                        duration: 300
                    },
                    reflow: true,
                    inverted: false,
                    className: 'columnClass',
                    events: {
                        render: function () {
                            // if (this.yAxis[0].plotLinesAndBands.length
                            //         && this.yAxis[0].plotLinesAndBands
                            //                 .some(plob => plob.label && plob.label.textStr && plob.label.textStr.includes('valYDes'))) {
                            //     isShowCreditInGraph.creditLimitRenderedByChart = true;
                            // } else {
                            //     isShowCreditInGraph.creditLimitRenderedByChart = false;
                            // }
                            //
                            // // const yExtremes = this.yAxis[0].getExtremes();
                            // isShowCreditInGraph.dataChart.locationCreditLimit =
                            //     isShowCreditInGraph.showCreditLine !== false && !isShowCreditInGraph.creditLimitRenderedByChart
                            //          ? this.yAxis[0].dataMin > isShowCreditInGraph.showCreditLine ? 'bottom' : 'top'
                            //          : false;
                            // // if (isShowCreditInGraph.dataChart.locationCreditLimit) {
                            // //     console.log('showCreditLine ==> %o, yExtremes ==> %o, locationCreditLimit ==> %o',
                            // //         isShowCreditInGraph.showCreditLine,
                            // //         this.yAxis[0].getExtremes(),
                            // //         isShowCreditInGraph.dataChart.locationCreditLimit);
                            // // }
                            // // console.log('render ==> 1. %o; 2. %o, 3. %o',
                            // //     this.yAxis[0].plotLinesAndBands.length,
                            // //     this.yAxis[0].plotLinesAndBands
                            // //         .some(plob => plob.label),
                            // //     this.yAxis[0].plotLinesAndBands
                            // //         .some(plob => plob.label && plob.label.textStr)
                            // //     );
                            // // console.log('render ==> %o, creditLimitRenderedByChart ==> %o',
                            // //     this.yAxis[0].plotLinesAndBands, isShowCreditInGraph.creditLimitRenderedByChart);
                            //
                            // tslint:disable-next-line:max-line-length
                            // // if (this.series.length < 1 || this.series.filter(ser => ser.visible).length < 1) { // check series is empty
                            // //     this.renderer.text('לא נמצאו יתרות', 140, 120)
                            // //         .css({
                            // //             color: '#4572A7',
                            // //             fontSize: '16px'
                            // //         })
                            // //         .add();
                            // // }
                        }
                    }
                },
                legend: {
                    enabled: false
                },
                title: {
                    text: hideData
                        ? ['—————————', 'לא נמצאו יתרות', '—————————'].join(' ')
                        : '',
                    style: {
                        color: '#022258',
                        fontSize: '1.1rem',
                        fontWeight: '600'
                    },
                    verticalAlign: 'middle',
                    floating: true
                },
                subtitle: {
                    text: ''
                },
                credits: {
                    enabled: false
                },
                xAxis: {
                    min: 0,
                    max: xMax,
                    scrollbar: {
                        enabled: scrollbar,
                        barBackgroundColor: '#34b0d7',
                        barBorderRadius: 0,
                        barBorderWidth: 0,
                        buttonBackgroundColor: '#34b0d7',
                        buttonBorderWidth: 0,
                        buttonArrowColor: '#022258',
                        buttonBorderRadius: 0,
                        rifleColor: '#022258',
                        trackBackgroundColor: 'white',
                        trackBorderWidth: 1,
                        trackBorderColor: '#34b0d7',
                        trackBorderRadius: 0,
                        height: 8
                    },
                    plotLines: [],
                    // plotLines: (oldDate) ?
                    //     [{
                    //         color: '#c3cdd7',
                    //         width: 2,
                    //         value: oldDate - 1 + 0.5
                    //     }] : [],
                    reversed: false,
                    crosshair: false,
                    labels: {
                        // useHTML: false,
                        reserveSpace: true,
                        staggerLines: 1,
                        overflow: 'allow',
                        style: {
                            textAlign: 'center',
                            padding: '0',
                            margin: '0',
                            fontSize: '14px',
                            color: '#022258'
                        },
                        formatter(this: any) {
                            const pnt = this.chart.series[0].options.data[this.value];
                            if (!pnt) {
                                return '';
                            }
                            const txt = isShowCreditInGraph.dtHumanizePipe.transform(
                                pnt.transDateMmnt.toDate(),
                                'dd/MM'
                            );
                            if (pnt.transDateMmnt.isBefore(nowMmnt, 'day')) {
                                return `<span style="color: rgba(2, 34, 88, 0.6)">${txt}</span>`;
                            } else if (pnt.transDateMmnt.isAfter(nowMmnt, 'day')) {
                                return `<span>${txt}</span>`;
                            } else {
                                return `<span style="font-weight: bold">${txt}</span>`;
                            }
                            // const todayIdx = Array.isArray(this.axis.categories)
                            //         ? this.axis.categories.indexOf('היום')
                            //         : -1;
                            // if (this.pos < todayIdx) {
                            //     return `<span style="color: rgba(15, 56, 96, 0.6)">${txt}</span>`;
                            // } else if (this.pos > todayIdx) {
                            //     return `<span>${this.value}</span>`;
                            // } else {
                            //     return `<span style="font-weight: bold">${txt}</span>`;
                            // }
                            // debugger;
                            // return `<span style="font-weight: ${this.value === 'היום' ? 'bold' : 'normal'}">${this.value}</span>`;
                        }
                    },
                    offset: 0,
                    lineWidth: 0,
                    gridLineWidth: 1,
                    gridLineColor: 'rgba(228, 232, 235, .6)',
                    tickWidth: 0,
                    tickLength: 0,
                    tickPosition: 'outside',
                    startOnTick: false,
                    endOnTick: false,
                    tickInterval: 1,
                    minorTicks: true,
                    minorTickInterval: 0.5,
                    title: {
                        text: ''
                    },
                    className: 'xAxisClass'
                    // allowDecimals: true,
                    // categories: item.accountTransactions.map((trans) => {
                    //     return this.dtHumanizePipe.transform(trans.transDate, 'dd/MM');
                    // })
                },
                plotOptions: {
                    series: {
                        stacking: 'normal',
                        allowPointSelect: false,
                        stickyTracking: false,
                        events: {
                            // mouseOver: function () {
                            //     isFire = true;
                            // },
                            // mouseOut: function () {
                            //     isFire = false;
                            //     clearTimeout(timeoutWs);
                            // }
                        },
                        marker: {
                            enabled: false
                        },
                        states: {
                            hover: {
                                enabled: false
                            }
                        },
                        threshold: minLine // -Infinity
                        // ,
                        // dataLabels: {
                        //     style: {
                        //         textOutline: '0px',
                        //         color: '#022258',
                        //         fontSize: '14px',
                        //         fontWeight: '400'
                        //     },
                        //     align: 'center',
                        //     formatter: function () {
                        //         return roundAndAddComma(this.y);
                        //     },
                        //     enabled: true
                        // }
                    },
                    column: {
                        pointWidth: 30,
                        borderWidth: 0,
                        borderRadius: 0,
                        pointPadding: 10,
                        minPointLength: 10
                    }
                },
                yAxis: {
                    // type: 'logarithmic',
                    // minorTickInterval: 'auto',
                    // tickAmount: 6,
                    reversed: false,
                    // showFirstLabel: true,
                    // showLastLabel: true,
                    min: minLine * (Math.sign(minLine) === -1 ? 1.005 : 0.995),
                    max: maxLine * (Math.sign(maxLine) === -1 ? 0.995 : 1.005),
                    // maxPadding: 0.025,
                    // minPadding: 0.025,
                    // allowDecimals: false,
                    // endOnTick: true, // false,
                    // startOnTick: true, // false,
                    title: {text: ''},
                    offset: 0,
                    lineWidth: 0, // size border left side
                    opposite: false,
                    gridLineWidth: 1, // change to 0 for other screen
                    gridLineColor: 'rgba(228, 232, 235, .6)',
                    tickLength: 0,
                    tickWidth: 0,
                    tickPixelInterval: 20,
                    labels: {
                        // useHTML: true,
                        // formatter: function () {
                        //     debugger;
                        //     return this.axis.defaultLabelFormatter.call(this);
                        // },
                        // formatter: function () {
                        //     // if (item.creditLimit !== undefined && (item.creditLimit === this.value)) {
                        //     //     isShowCreditInGraph.showCreditLine = false;
                        //     // }
                        //     let K = '';
                        //     if ((this.value / 1000) !== 0) {
                        //         K = 'K';
                        //     }
                        //     return this.value / 1000 + K;
                        // },
                        // reserveSpace: true,
                        // staggerLines: 1,
                        style: {
                            fontSize: '14px',
                            color: '#022258',
                            direction: 'ltr'
                        }
                        // align: 'right',
                        // padding: 0,
                        // x: -15,
                        // y: 0
                    },
                    plotLines:
                        this.showCreditLine === false || hideData
                            ? [
                                // {
                                //     color: '#757575',
                                //     dashStyle: 'Solid',
                                //     width: 2,
                                //     value: 0,
                                //     zIndex: 4
                                // }
                            ]
                            : [
                                // {
                                //     color: '#757575',
                                //     dashStyle: 'Solid',
                                //     width: 2,
                                //     value: 0,
                                //     zIndex: 4
                                // },
                                {
                                    color: '#c50000',
                                    dashStyle: 'Solid',
                                    width: 1,
                                    value: this.showCreditLine, // item.creditLimit,
                                    zIndex: 4,
                                    label: {
                                        // useHTML: true,
                                        verticalAlign: 'top',
                                        // textAlign: 'right',
                                        align: 'right',
                                        text: this.formatWithoutPointsSum(
                                            Math.abs(item.creditLimit)
                                        ),
                                        //                                 text: `<div style="background: #ffffff;">מ. אשראי</div>
                                        // <div class="valYDes" style="color: #ce423e;border: 1px solid #ce423e;">
                                        //   <div class="arrow-right"></div>
                                        //                      ${item.creditLimit / 1000}${KLimit}
                                        //                         </div>`,
                                        style: {
                                            fontSize: '16px',
                                            color: '#c50000',
                                            direction: 'ltr',
                                            fontWeight: '600'
                                        },
                                        // y: -11,
                                        x: 10
                                    }
                                }
                            ]
                },
                tooltip: {
                    snap: 5,
                    hideDelay: 1000,
                    shared: true,
                    // shadow: false,
                    useHTML: true,
                    crosshairs: true,
                    backgroundColor: '#ffffff',
                    borderRadius: 2,
                    borderWidth: 1,
                    borderColor: '#eaeaea',
                    padding: 0,
                    // outside: true,
                    enabled: true,
                    formatter: function (this: any) {
                        if (isAllAcc) {
                            let color = '#229f88';
                            if (this.y < 0) {
                                color = '#ef3636';
                            }
                            const txt = isShowCreditInGraph.dtHumanizePipe.transform(
                                data[this.x].transDateMmnt.toDate(),
                                'dd/MM'
                            );
                            let str = `<div class="tooltipAllAcc scroll-chrome" style="max-height: 166px; overflow: auto;">
<div class="row title">
<div>
יתרה ל${txt}
</div>
<div style="direction: ltr; font-size: 14px; color: ${color}">
${currency} ${roundAndAddComma(this.y)}
</div>
</div>
`;

                            isShowCreditInGraph.dataTableAll.forEach((acc, idx) => {
                                if (idx > 0) {
                                    let colorInside = '#229f88';
                                    if (
                                        acc.accountTransactions[this.points[0].point.index].itra < 0
                                    ) {
                                        colorInside = '#ef3636';
                                    }
                                    str += `<div class="row">
<div>
<div style="line-height: 28px;">
<img  ngSrc="${isShowCreditInGraph.toIconSrcPipe.transform(
                                        acc.bankId,
                                        'bank'
                                    )}" 
                                   style="height: auto; width: 18px; position: relative; vertical-align: middle;" fill>
</div>
<div>
${acc.accountNickname}
</div>
</div>
<div style="direction: ltr; font-size: 14px; color: ${colorInside}">${currency} ${roundAndAddComma(
                                        acc.accountTransactions[this.points[0].point.index].itra
                                    )}</div>
</div>`;
                                }
                            });
                            str += '</div>';
                            return str;
                        } else {
                            // let color = '#229f88';
                            // if (this.y < 0) {
                            //     color = '#ef3636';
                            // }
                            const txt = isShowCreditInGraph.dtHumanizePipe.transform(
                                data[this.x].transDateMmnt.toDate(),
                                'dd/MM'
                            );
                            let str = [
                                '<div class="tooltipAllAcc scroll-chrome"  style="max-height: 166px; overflow: auto;">',
                                '<div class="row title">',
                                '<div>',
                                `יתרה ל${txt}`,
                                '</div>',
                                `<div style="direction: ltr; font-size: 14px; color: ${
                                    this.y < 0 ? '#ef3636' : '#229f88'
                                }">`,
                                `${currency} ${roundAndAddComma(this.y)}`,
                                '</div>',
                                '</div>'
                            ].join('');

                            const key = this.x + ',' + this.y;
                            if (
                                !isShowCreditInGraph.chartDetailTooltips ||
                                !(key in isShowCreditInGraph.chartDetailTooltips)
                            ) {
                                if (!isShowCreditInGraph.chartDetailTooltips) {
                                    isShowCreditInGraph.chartDetailTooltips = {};
                                }
                                let obs: Observable<any>;
                                let isCashFlowDetails = false;
                                if (this.points[0].color === '#022258') {
                                    // obs = sharedService.getBankTransPeulotToday({
                                    //     'companyAccountIds': item.accountUuid,
                                    //     'companyId': companyId
                                    // })
                                    //     .pipe(
                                    //         map(response => response && !response.error ? response.body : [])
                                    //     );
                                    isCashFlowDetails = true;
                                    obs = sharedService
                                        .cashFlowDetails({
                                            companyAccountIds: item.accountUuid,
                                            companyId: companyId,
                                            dateFrom:
                                            item.accountTransactions[this.points[0].point.index]
                                                .transDate,
                                            dateTill:
                                            item.accountTransactions[this.points[0].point.index]
                                                .transDate,
                                            expence: -1
                                        })
                                        .pipe(
                                            map((response: any) =>
                                                response && !response.error
                                                    ? response.body.cashFlowDetails
                                                    : []
                                            )
                                        );
                                } else if (
                                    isShowCreditInGraph.userService.appData
                                        .moment()
                                        .startOf('day')
                                        .isAfter(
                                            isShowCreditInGraph.userService.appData.moment(
                                                item.accountTransactions[this.points[0].point.index]
                                                    .transDate
                                            )
                                        )
                                ) {
                                    obs = sharedService
                                        .getBankTrans({
                                            companyAccountIds: item.accountUuid,
                                            companyId: companyId,
                                            dateFrom:
                                            item.accountTransactions[this.points[0].point.index]
                                                .transDate,
                                            dateTill:
                                            item.accountTransactions[this.points[0].point.index]
                                                .transDate
                                        })
                                        .pipe(
                                            map((response: any) =>
                                                response && !response.error
                                                    ? response.body.bankTransList
                                                    : []
                                            )
                                        );
                                } else {
                                    isCashFlowDetails = true;
                                    obs = sharedService
                                        .cashFlowDetails({
                                            companyAccountIds: item.accountUuid,
                                            companyId: companyId,
                                            dateFrom:
                                            item.accountTransactions[this.points[0].point.index]
                                                .transDate,
                                            dateTill:
                                            item.accountTransactions[this.points[0].point.index]
                                                .transDate,
                                            expence: -1
                                        })
                                        .pipe(
                                            map((response: any) =>
                                                response && !response.error
                                                    ? response.body.cashFlowDetails
                                                    : []
                                            )
                                        );
                                }

                                isShowCreditInGraph.chartDetailTooltips[key] = {
                                    point: this.point || this.points[0].point,
                                    result: obs
                                };

                                obs.subscribe({
                                    next: (tooltipData: any) => {
                                        if (
                                            isShowCreditInGraph.chartDetailTooltips &&
                                            isShowCreditInGraph.chartDetailTooltips[key]
                                        ) {
                                            // debugger;
                                            if (!Array.isArray(tooltipData)) {
                                                isShowCreditInGraph.chartDetailTooltips[key].result =
                                                    '';
                                                return;
                                            }

                                            isShowCreditInGraph.chartDetailTooltips[key].result =
                                                tooltipData.length
                                                    ? tooltipData
                                                        .map((tr) =>
                                                            [
                                                                '<div class="row">',
                                                                '<div>',
                                                                '<div>',
                                                                tr.mainDesc || tr.transName,
                                                                '</div>',
                                                                '</div>',
                                                                '<div style="direction: ltr; font-size: 14px;',
                                                                ' color: ' +
                                                                (tr[isCashFlowDetails ? 'expence' : 'hova']
                                                                    ? '#ef3636'
                                                                    : '#229f88'),
                                                                '">',
                                                                currency,
                                                                (isCashFlowDetails && tr['expence']
                                                                    ? '-'
                                                                    : '') + roundAndAddComma(tr.total),
                                                                '</div>',
                                                                '</div>'
                                                            ].join('')
                                                        )
                                                        .join('')
                                                    : '<div class="row"><div>אין תנועות צפויות</div></div>';
                                        }
                                    },
                                    error: (e) => (isShowCreditInGraph.chartDetailTooltips[key].result =
                                        '<div class="row"><div>כרגע, לא ניתן להביא את התנועות</div></div>'),
                                    complete: () => requestAnimationFrame(() => {
                                        if (isShowCreditInGraph.chartDetailTooltips) {
                                            isShowCreditInGraph.chartDetailTooltips[
                                                key
                                                ].point.series.chart.redraw();
                                        }
                                    })
                                });

                            } else {
                                if (
                                    isObservable(
                                        isShowCreditInGraph.chartDetailTooltips[key].result
                                    )
                                ) {
                                    str += '<div class="row"><div>טוען נתונים....</div></div>';
                                } else {
                                    str += isShowCreditInGraph.chartDetailTooltips[key].result;
                                }
                            }
                            str += '</div>';

                            return str;
                        }
                    }
                },
                series: [
                    {
                        data: data,
                        type: 'areaspline',
                        dashStyle: '',
                        // fillOpacity: 0.1,
                        fillColor: {
                            linearGradient: {
                                x1: 0,
                                y1: 0,
                                x2: 0,
                                y2: 1
                            },
                            stops: [
                                [0, 'rgba(67,116,157,0.16)'],
                                [0.7, 'rgba(67,116,157,0.10)'],
                                [1, 'rgba(67,116,157,0)']
                                // [0, 'rgba(15,56,96,0.3)'],
                                // [0.9, 'rgba(15,56,96,0.1)'],
                                // [1, 'rgba(255,255,255,0.005)'],
                            ]
                        },
                        lineWidth: 3,
                        // lineColor: '#022258',
                        visible: !hideData,
                        zoneAxis: 'x',
                        zones: [
                            {
                                value: data.findIndex((pnt) => pnt.color === '#022258'),
                                color: '#022258'
                            },
                            {
                                dashStyle: 'Dash',
                                color: '#022258'
                            }
                        ]
                    }
                ]
            }
        };

        // console.log('------- data: %o', JSON.stringify(data));
        console.log('dataChart ===> %o', this.dataChart);

        setTimeout(() => {
            if (this.dataTableAll && this.dataTableAll.length) {
                const itemActive = this.dataTableAll.find((acc: any) => acc.active);
                if (itemActive) {
                    if (this.userService.appData.userData.companySelect.lite) {
                        this.childGraph.chartPoints.start =
                            itemActive.accountTransactions.length - xMax;
                        this.childGraph.chartPoints.finish =
                            itemActive.accountTransactions.length - 1;
                        this.childGraph.setExtremes(
                            this.childGraph.chartPoints.start,
                            this.childGraph.chartPoints.finish
                        );
                    } else {
                        this.childGraph.chartPoints.finish =
                            this.childGraph.chartPoints.start + xMax;
                        this.childGraph.setExtremes(
                            this.childGraph.chartPoints.start,
                            this.childGraph.chartPoints.finish
                        );
                    }
                }
            }
        }, 50);
    }

    getListMessages() {
        if (this.userService.appData.userData.accountSelect.length) {
            const todayParameters: any = {
                companyAccountIds: this.userService.appData.userData.accountSelect.map(
                    (account) => {
                        return account.companyAccountId;
                    }
                ),
                companyId: this.userService.appData.userData.companySelect.companyId,
                dateFrom: new Date().toISOString(),
                dateTill: new Date().toISOString()
            };
            const parameters: any = {
                companyAccountIds: this.userService.appData.userData.accountSelect.map(
                    (account) => {
                        return account.companyAccountId;
                    }
                ),
                companyId: this.userService.appData.userData.companySelect.companyId,
                dateFrom: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate() - 30
                ).toISOString(),
                dateTill: new Date().toISOString()
            };
            zip(
                this.sharedService.getBankTransPeulotToday(todayParameters),
                this.sharedService.getBankTrans(parameters)
            ).subscribe(
                (response: any) => {
                    this.messagesToday = response[0] ? response[0]['body'] : response[0];
                    this.messagesToday = this.messagesToday.map((trns) =>
                        this.setupTransItemView(trns)
                    );
                    this.messagesToday.sort((a, b) => a.rowNum - b.rowNum);
                    if (this.messagesToday.length) {
                        this.messagesToday.unshift({
                            title: true,
                            transDateHumanizedStr: 'היום'
                        });
                    }
                    this.messages = response[1]
                        ? response[1]['body'].bankTransList
                        : response[1];
                    this.messages = this.messages.map((trns) =>
                        this.setupTransItemView(trns)
                    );
                    this.messages.sort((a, b) => {
                        return a.rowNum - b.rowNum;
                        // return (a['transDate'] < b['transDate']) ? 1 : -1;
                    });
                    [].concat(this.messages).reduce((a, b, idx, arr) => {
                            try {
                                let title = 0;
                                const thisDate = b.transDateHumanizedStr;
                                if (idx !== 0) {
                                    const nextRowDate = arr[idx + 1].transDateHumanizedStr;
                                    if (thisDate !== nextRowDate) {
                                        title = 1;
                                        this.messages.splice(idx + a[0] + 1, 0, {
                                            title: true,
                                            transDateHumanizedStr: arr[idx + 1].transDateHumanizedStr
                                        });
                                    }
                                } else {
                                    title = 1;
                                    this.messages.splice(idx, 0, {
                                        title: true,
                                        first: true,
                                        transDateHumanizedStr: arr[idx].transDateHumanizedStr
                                    });
                                }
                                return [a[0] + title];
                            } catch (e) {
                                return [0];
                            }
                        },
                        [0]
                    );
                }
            );
        }
    }

    getStatusOfPasswords() {
        if (this.userService.appData.userData.accountSelect.length) {
            this.selectedNotUpdatedAccounts =
                this.userService.appData.userData.accountSelect.filter((acc: any) =>
                    getDaysBetweenDates(new Date(acc.balanceLastUpdatedDate), new Date())
                );

            if (this.selectedNotUpdatedAccounts.length) {
                const parameters: any = {
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    tokens: [this.selectedNotUpdatedAccounts[0].token]
                };
                this.tokenService.tokenGetStatus(parameters).subscribe(
                    (response: any) => {
                        const tknStat = response[0];
                        if (tknStat) {
                            tknStat['tokenStatusFormat'] =
                                this.tokenService.toTokenStatusEnumValue(tknStat.tokenStatus);
                            this.tokenStatusPass = tknStat;
                        }
                    }
                );
            } else {
                this.tokenStatusPass = false;
            }
        }
    }

    private setupTransItemView(trns: any): void {
        // console.log('trns -> %o', trns);

        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === trns.companyAccountId
        );

        return Object.assign(trns, {
            account: trnsAcc,
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.transDate,
                'dd/MM/yy'
            ),
            accountNickname: trnsAcc ? trnsAcc.accountNickname : null // ,
            // bankIconSrc: trnsAcc ? '/assets/images/bank' + trnsAcc.bankId + '.png' : null
        });
    }

    private applyCurrentAccountsSelectionBeforeNavigation(
        storageKeyPrefix: string,
        accountIdToSelect?: string
    ) {
        this.storageService.sessionStorageSetter(
            storageKeyPrefix + '-filterAcc',
            JSON.stringify(
                !accountIdToSelect
                    ? this.userService.appData.userData.accountSelect.map(
                        (acc: any) => acc.companyAccountId
                    )
                    : [accountIdToSelect]
            )
        );
    }

    goToBankMatch() {
        this.userService.appData.userData.bankMatchAccountIdNavigateTo =
            this.userService.appData.userData.accountSelect[0].companyAccountId;
        this.sharedComponent.mixPanelEvent('match screen');
        this.router.navigate(['/cfl/cash-flow/bankmatch/bank'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    goToCheck(val: string) {
        if(val === 'not_paid'){
            this.sharedComponent.mixPanelEvent('checks lepiraon');
        }
        if(val === 'mishmeret_babank'){
            this.sharedComponent.mixPanelEvent('checks lemishmeret')
        }
        if(val === 'lenicaion'){
            this.sharedComponent.mixPanelEvent('checks benicayon')
        }

        if (
            val === 'not_paid' &&
            this.userService.appData.userData.companySelect.lite
        ) {
            if (
                this.userService.appData.userData.companySelect.trialBlocked &&
                this.userService.appData.userData.companySelect.trialBlocked === true
            ) {
                this.sharedService.announceMissionGetCompanies('trialBlocked');
            } else {
                this.router.navigate(['/cfl/packages'], {
                    queryParamsHandling: 'preserve',
                    relativeTo: this.route
                });
            }
        } else {
            this.applyCurrentAccountsSelectionBeforeNavigation('*-checks');
            this.storageService.sessionStorageSetter(
                'in-checks-filterQueryStatus',
                val
            );
            this.storageService.sessionStorageSetter(
                'checks/*-checks-filterDates',
                JSON.stringify({name: 'checksOutstanding'})
            );
            this.router.navigate(['/cfl/financialManagement/checks/in-checks'], {
                queryParamsHandling: 'preserve',
                relativeTo: this.route
            });
        }
    }

    goToOutCheck(val: string) {
        if(val === 'mechake_lehafkada'){
            this.sharedComponent.mixPanelEvent('checks letashlum');
        }
        if (
            val === 'mechake_lehafkada' &&
            this.userService.appData.userData.companySelect.lite
        ) {
            if (
                this.userService.appData.userData.companySelect.trialBlocked &&
                this.userService.appData.userData.companySelect.trialBlocked === true
            ) {
                this.sharedService.announceMissionGetCompanies('trialBlocked');
            } else {
                this.router.navigate(['/cfl/packages'], {
                    queryParamsHandling: 'preserve',
                    relativeTo: this.route
                });
            }
        } else {
            this.applyCurrentAccountsSelectionBeforeNavigation('*-checks');
            this.storageService.sessionStorageSetter(
                'out-checks-filterQueryStatus',
                val
            );
            this.storageService.sessionStorageSetter(
                'checks/*-checks-filterDates',
                JSON.stringify({name: 'checksOutstanding'})
            );
            this.router.navigate(['/cfl/financialManagement/checks/out-checks'], {
                queryParamsHandling: 'preserve',
                relativeTo: this.route
            });
        }
    }

    goToCreditCard() {
        this.sharedComponent.mixPanelEvent('credits');
        this.storageService.sessionStorageSetter(
            'creditsCard/*-filterCards',
            JSON.stringify(
                this.userService.appData.userData.accountSelect.map(
                    (acc: any) => acc.companyAccountId
                )
            )
        );
        const now = new Date();
        now.setDate(1);
        const from = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
        now.setMonth(now.getMonth() + 3);
        now.setDate(now.getDate() - 1);
        const till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
        this.storageService.sessionStorageSetter(
            'creditsCard/*-filterDates',
            JSON.stringify({
                name: 'cCardFuture',
                from: from,
                till: till
            })
        );
        this.router.navigate(['/cfl/financialManagement/creditsCard/details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    goToSlika() {
        this.sharedComponent.mixPanelEvent('slika');
        this.storageService.sessionStorageSetter(
            'slika/*-filterSolkim',
            JSON.stringify(
                this.userService.appData.userData.accountSelect.map(
                    (acc: any) => acc.companyAccountId
                )
            )
        );
        const now = new Date();
        this.storageService.sessionStorageSetter(
            'slika/*-filterDates',
            JSON.stringify({
                name: 'clrAgencyFuture',
                from: new RangePoint(now.getDate(), now.getMonth(), now.getFullYear()),
                till: null
            })
        );
        this.router.navigate(['/cfl/financialManagement/slika/details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    goToBankAccount(filterSettings?: any) {
        if (filterSettings && 'type' in filterSettings) {
            this.storageService.sessionStorageSetter(
                'details-filterTypesVal',
                String(filterSettings.type)
            );
        } else {
            this.storageService.sessionStorageClear('details-filterTypesVal');
        }
        if (filterSettings && filterSettings.paymentType) {
            this.storageService.sessionStorageSetter(
                'details-filterPaymentTypesCategory',
                JSON.stringify([filterSettings.paymentType])
            );
        } else {
            this.storageService.sessionStorageClear(
                'details-filterPaymentTypesCategory'
            );
        }
        if (filterSettings && filterSettings.transType) {
            this.storageService.sessionStorageSetter(
                'details-filterTypesCategory',
                JSON.stringify([filterSettings.transType])
            );
        } else {
            this.storageService.sessionStorageClear('details-filterTypesCategory');
        }
        if (filterSettings && filterSettings.dates) {
            this.storageService.sessionStorageSetter(
                'bankAccount/*-filterDates',
                JSON.stringify(this.translateDateSelectorValueToBankAccount())
            );
        } else {
            this.storageService.sessionStorageSetter(
                'bankAccount/*-filterDates',
                JSON.stringify({name: 'last30Days'})
                // JSON.stringify({'selectedValue': '0', 'dates': {'selectedValueLast': 30}})
            );
        }
        this.sharedComponent.mixPanelEvent('accounts screen');
        this.applyCurrentAccountsSelectionBeforeNavigation('bankAccount/*');
        this.router.navigate(['/cfl/financialManagement/bankAccount/details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
        const incomes = this.updateOperationAggregateData.incomes
            .filter((it) => it.press)
            .map((item) => {
                return item.descriptionOrigin
                    ? item.descriptionOrigin
                    : item.description;
            });

        const expenses = this.updateOperationAggregateData.expenses
            .filter((it) => it.press)
            .map((item) => {
                return item.descriptionOrigin
                    ? item.descriptionOrigin
                    : item.description;
            });

        return {
            additionalProperties: {},
            data: {
                report: [
                    {
                        companyAccountIds:
                            this.userService.appData.userData.accountSelect.map((account) => {
                                return account.companyAccountId;
                            }),
                        dateFrom: new Date(this.paramDate.fromDate).toISOString(),
                        dateTill: new Date(this.paramDate.toDate).toISOString(),
                        descriptions: [].concat(incomes, expenses)
                    }
                ]
            }
        };
    }

    exportTransactions(resultFileType: string): void {
        this.sharedComponent.mixPanelEvent('excel');
        this.reportService
            .getReport(
                this.filterOperation === 'PAYMENT_DESC'
                    ? 'OVERVIEW_PAYMENT_DESC'
                    : 'OVERVIEW_TRANS_TYPE',
                this.reportParamsFromCurrentView(),
                resultFileType,
                this.reportService.prepareFilename(...this.getFilename())
            )
            .pipe(take(1))
            .subscribe((rslt) => {
            });
    }

    private getFilename() {
        return [
            'סקירה כללית',
            'הפקדות ומשיכות - לפי' + (this.filterOperation === 'PAYMENT_DESC')
                ? 'סוג תשלום'
                : 'קטגוריות',
            this.childDates.asText(),
            this.userService.appData.userData.companySelect.companyName
        ];
    }

    printPies(contentRoot: HTMLElement): void {
        this.sharedComponent.mixPanelEvent('print');
        const copyOfElem: any = contentRoot;
        BrowserService.printHtml(copyOfElem, '');
    }

    getDetails(item: any, hova: boolean): void {
        this.sharedComponent.mixPanelEvent((hova ? 'outcomes' : 'incomes') + ' - perut peulot');
        const url = `v1/account/${this.filterOperation}/details`;
        const params = {
            companyAccountIds: this.userService.appData.userData.accountSelect.map(
                (account) => {
                    return account.companyAccountId;
                }
            ),
            dateFrom: new Date(this.paramDate.fromDate).toISOString(),
            dateTill: new Date(this.paramDate.toDate).toISOString(),
            description: item.descriptionOrigin
                ? item.descriptionOrigin
                : item.description,
            hova: hova,
            total: item.dateTotals[0].total,
            transTypeId: item.transTypeId
        };
        this.sharedService.getDetailsPopupGeneral(url, params).subscribe(
            (response: any) => {
                this.userService.appData.showPopUptDetails = Object.assign(
                    response ? response['body'] : response,
                    item
                );
                this.userService.appData.showPopUptDetails.hova = hova;
                if (this.filterOperation === 'PAYMENT_DESC') {
                    this.userService.appData.showPopUptDetails.transes.forEach((row) => {
                        row.transTypeName =
                            this.userService.appData.userData.companySelect.companyTransTypes.find(
                                (tt) => tt.transTypeId === row.transTypeId
                            ).transTypeName;
                    });
                }
                this.userService.appData.showPopUptDetails.transesSrc = JSON.parse(
                    JSON.stringify(this.userService.appData.showPopUptDetails.transes)
                );
                this.filtersAll();
            },
            (err: HttpErrorResponse) => {
                if (err.error) {
                    console.log('An error occurred:', err.error.message);
                } else {
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    filterCategory(type: any) {
        this.filterTypesCategory = type.checked;
        this.filtersAll('filterTypesCategory');
    }

    filtersAll(priority?: string): void {
        if (
            this.userService.appData.showPopUptDetails.transesSrc &&
            !(
                Array.isArray(this.userService.appData.showPopUptDetails.transesSrc) &&
                !this.userService.appData.showPopUptDetails.transesSrc.length
            )
        ) {
            if (priority !== 'filterTypesCategory') {
                this.rebuildTransTypesMap(
                    this.userService.appData.showPopUptDetails.transesSrc
                );
            }
            this.userService.appData.showPopUptDetails.transes =
                this.filterPipe.transform(
                    this.userService.appData.showPopUptDetails.transesSrc,
                    this.filterTypesCategory,
                    ['generalName']
                );
        }
        this.userService.appData.showPopUptDetails.transesTotal =
            this.userService.appData.showPopUptDetails.transes.reduce(
                (accumulator, currentValue) => accumulator + currentValue.total,
                0
            );
    }

    private rebuildTransTypesMap(withOtherFiltersApplied: any[]): void {
        this.transTypesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (dtRow.generalName && !acmltr[dtRow.generalName]) {
                    acmltr[dtRow.generalName] = {
                        val: dtRow.generalName,
                        id: dtRow.generalName,
                        checked:
                            !Array.isArray(this.filterTypesCategory) ||
                            this.filterTypesCategory.includes(dtRow.generalName)
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.generalName].checked) {
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
        this.transTypesArr.sort((a, b) => a.val.localeCompare(b.val));
        const findIdxAll = this.transTypesArr.findIndex((it) => it.id === 'all');
        const element = this.transTypesArr[findIdxAll];
        this.transTypesArr.splice(findIdxAll, 1);
        this.transTypesArr.splice(0, 0, element);
        // console.log('this.transTypesArr => %o', this.transTypesArr);
    }

    goToTazrimLink(accountIdToSelect?: string) {
        this.storageService.sessionStorageSetter(
            'daily/*-filterDates',
            JSON.stringify({selectedValue: '0', dates: {selectedValueLast: 30}})
        );
        this.applyCurrentAccountsSelectionBeforeNavigation(
            'daily/*-filterAcc',
            accountIdToSelect
        );
        this.sharedComponent.mixPanelEvent('tazrim yomi screen');
        this.router.navigate(['/cfl/cash-flow/daily/details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    loanDetails() {
        this.sharedComponent.mixPanelEvent('loans');
        this.selectedCompanyAccountIds =
            this.userService.appData.userData.accountSelect.map(
                (account) => account.companyAccountId
            );
        this.toggleLoanDetails = true;
        // this.popUpLoansAndDeposit = {
        //     styleClass: 'popUpLoansAndDeposit',
        //     height: 400,
        //     width: 762,
        //     type: 'loanDetails'
        // };
        // this.loanDetailsData = [];
        // const parameters: any = {
        //     'companyAccountIds': this.userService.appData.userData.accountSelect.map((account) => {
        //         return account.companyAccountId;
        //     }),
        //     'dateFrom': null,
        //     'dateTill': null
        // };
        // this.sharedService.loanDetails(parameters)
        //     .subscribe(
        //         response => {
        //             this.loanDetailsData = (response) ? response['body'] : response;
        //             if (this.loanDetailsData.length) {
        //                 this.loanDetailsData[0].active = true;
        //                 this.showItemPop = this.loanDetailsData[0];
        //
        //                 if (this.showItemPop['paymentsNumberLeft'] === null) {
        //                     this.arrSlices.forEach((slice, idx) => this.arrSlices[idx] = false);
        //                 } else if (this.showItemPop['paymentsNumberLeft'] === 0) {
        //                     this.arrSlices.forEach((slice, idx) => this.arrSlices[idx] = true);
        //                 } else if (this.showItemPop['loanPayments'] === null || this.showItemPop['loanPayments'] === 0) {
        //                     this.arrSlices.forEach((slice, idx) => this.arrSlices[idx] = false);
        //                 } else {
        //                     // tslint:disable-next-line:max-line-length
        //                     const numberOfSlices = Math.round((this.showItemPop['loanPayments'] - this.showItemPop['paymentsNumberLeft']) / (this.showItemPop['loanPayments'] / 12));
        //                     this.arrSlices.forEach((slice, idx) => {
        //                         if (idx < numberOfSlices) {
        //                             this.arrSlices[idx] = true;
        //                         } else {
        //                             this.arrSlices[idx] = false;
        //                         }
        //                     });
        //                 }
        //             }
        //         }, (err: HttpErrorResponse) => {
        //             if (err.error) {
        //                 console.log('An error occurred:', err.error.message);
        //             } else {
        //                 console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
        //             }
        //         }
        //     );
    }

    depositDetails() {
        this.sharedComponent.mixPanelEvent('diposits');
        this.popUpDeposit = {
            styleClass: 'popUpLoansAndDeposit',
            height: 363,
            width: 610 // ,
            // type: 'depositDetails'
        };
        this.depositDetailsData = [];
        const parameters: any = this.userService.appData.userData.accountSelect.map(
            (account) => {
                return {
                    uuid: account.companyAccountId
                };
            }
        );
        this.sharedService.depositDetails(parameters).subscribe(
            (response: any) => {
                this.depositDetailsData = response ? response['body'] : response;
                if (this.depositDetailsData.length) {
                    this.depositDetailsData[0].active = true;
                    this.showItemPop = this.depositDetailsData[0];
                }
            },
            (err: HttpErrorResponse) => {
                if (err.error) {
                    console.log('An error occurred:', err.error.message);
                } else {
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    setActive(item: any) {
        // const allArr = (this.popUpDeposit.type === 'loanDetails') ? this.loanDetailsData : this.depositDetailsData;
        // allArr.forEach((it) => it.active = false);
        this.depositDetailsData.forEach((it) => (it.active = false));
        item.active = true;
        this.showItemPop = item;
        // if (this.popUpDeposit.type === 'loanDetails') {
        //     if (this.showItemPop['paymentsNumberLeft'] === null) {
        //         this.arrSlices.forEach((slice, idx) => this.arrSlices[idx] = false);
        //     } else if (this.showItemPop['paymentsNumberLeft'] === 0) {
        //         this.arrSlices.forEach((slice, idx) => this.arrSlices[idx] = true);
        //     } else if (this.showItemPop['loanPayments'] === null || this.showItemPop['loanPayments'] === 0) {
        //         this.arrSlices.forEach((slice, idx) => this.arrSlices[idx] = false);
        //     } else {
        //         // tslint:disable-next-line:max-line-length
        // tslint:disable-next-line:max-line-length
        //         const numberOfSlices = Math.round((this.showItemPop['loanPayments'] - this.showItemPop['paymentsNumberLeft']) / (this.showItemPop['loanPayments'] / 12));
        //         this.arrSlices.forEach((slice, idx) => {
        //             if (idx < numberOfSlices) {
        //                 this.arrSlices[idx] = true;
        //             } else {
        //                 this.arrSlices[idx] = false;
        //             }
        //         });
        //     }
        // }
    }

    removeFromSystem() {
        // const type = this.popUpDeposit.type;
        this.popUpDeposit = false;
        this.popUpRemoveLoansAndDeposit = {
            styleClass: 'popUpRemoveLoansAndDeposit',
            height: 225,
            width: 399,
            type: 'depositDetails' // type
        };
    }

    removeLoansAndDeposit() {
        const params = {
            params: {
                companyAccountId: this.showItemPop['companyAccountId'],
                // tslint:disable-next-line:max-line-length
                // 'id': (this.popUpRemoveLoansAndDeposit.type === 'loanDetails') ? this.showItemPop['loanId'] : this.showItemPop['depositId']
                id: this.showItemPop['depositId']
            },
            url: 'deposit'
            // url: (this.popUpRemoveLoansAndDeposit.type === 'loanDetails') ? 'loan' : 'deposit'
        };
        this.sharedService.deleteLoanAndDeposit(params).subscribe(
            (response: any) => {
                this.popUpRemoveLoansAndDeposit = false;
                this.showItemPop = {};
                this.changeAcc(null);
            },
            (err: HttpErrorResponse) => {
                if (err.error) {
                    console.log('An error occurred:', err.error.message);
                } else {
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    // showAdditionalAt(trns: any, target: HTMLElement): void {
    //     // console.log('onRowShowAdditional: %o, target: %o', $event, $event.target);
    //     // this.showAdditionalItem = $event.item;
    //     this.showAdditionalItem = trns;
    //     this.showAdditionalTarget = target;
    //     this.additionalCheckSelected = null;
    //
    //     if (trns.linkId) {
    //         const req = Object.assign(Object.create(null),
    //             {
    //                 linkId: trns.linkId,
    //                 companyAccountId: trns.companyAccountId
    //             });
    //         this.transactionAdditionalDetailId$.next(req);
    //     } else if (trns.pictureLink) {
    //         const req = Object.assign(Object.create(null),
    //             {
    //                 pictureLink: trns.pictureLink,
    //                 companyAccountId: trns.companyAccountId,
    //                 folderName: trns.account.bankId + '' + trns.account.bankSnifId + '' + trns.account.bankAccountId
    //             });
    //         this.transactionAdditionalDetailId$.next(req);
    //     }
    //
    //     this.rolloutAdditionalsPopup();
    // }
    //
    // private rolloutAdditionalsPopup(): void {
    //     setTimeout(() => {
    //         console.log('rolling out.... %o', this.additionalsContainer);
    //         this.additionalsContainer.nativeElement.focus({preventScroll: true});
    //         this.additionalsContainer.nativeElement.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
    //     }, 0);
    // }
    //
    // checkImageSourceFrom(checkAdditional: any): string {
    //     if (checkAdditional.image) {
    //         return 'data:image/jpg;base64,' + checkAdditional.image;
    //     }
    //     if (checkAdditional.chequeBankNumber) {
    //         return `/assets/images/bank${checkAdditional.chequeBankNumber}.png`;
    //     }
    //     return '';
    // }
    //
    // hideAdditional(): void {
    //     this.showAdditionalItem = null;
    //     this.additionalCheckSelected = null;
    // }
    //
    // stepAdditionalCheckRow(dir: number, additionalDetails: any[]): boolean {
    //     console.log('stepAdditionalCheckRow ==> dir: %o, additionalDetails: %o', dir, additionalDetails);
    //     if (this.additionalCheckSelected) {
    //         let indexToSelect = additionalDetails.indexOf(this.additionalCheckSelected) + dir;
    //         if (indexToSelect === additionalDetails.length) {
    //             indexToSelect = 0;
    //         } else if (indexToSelect < 0) {
    //             indexToSelect = additionalDetails.length - 1;
    //         }
    //         this.additionalCheckSelected = additionalDetails[indexToSelect];
    //         const slctdNative = this.checksChainItemsRef.find((item, idx) => idx === indexToSelect).nativeElement;
    //         slctdNative.focus({preventScroll: true});
    //         slctdNative.scrollIntoView({
    //             behavior: 'auto',
    //             block: 'nearest',
    //             inline: 'center'
    //         });
    //         return false;
    //     }
    // }

    private translateDateSelectorValueToBankAccount() {
        return CustomPreset.createMonthsPreset(
            this.childDates.selectedPreset.from.month,
            this.childDates.selectedPreset.from.year
        );

        // if (+this.childDates.selectedValue === 1) {
        //     return this.childDates.currentSettings;
        // } else if (+this.childDates.selectedValue === 0) {
        //     const selectedYear = +this.childDates.currentSettings.dates.selectedValueLast;
        //     const isCurrentYear = selectedYear === new Date().getFullYear();
        //     return {
        //         selectedValue: '1',
        //         dates: Object.assign({
        //             untilValue: isCurrentYear ? 0 : 1,
        //             fromValue: this.childDates.fromValue,
        //             selectedValueFromYear: selectedYear,
        //             selectedValueFromMonth: 0
        //         }, !isCurrentYear ? {
        //             selectedValueUntilMonth: 11,
        //             selectedValueUntilYear: selectedYear
        //         } : {})
        //     };
        //
        // }
    }

    todayRelativizeDays(timestamp: number) {
        return getDaysBetweenDates(new Date(timestamp), new Date());
    }

    private createDummyPieChart(pieType: string): any {
        let palette: string[], titleHtml: string;
        if (pieType === 'incomes') {
            palette = this.palette.incomes;
            titleHtml = `<div class="strongTitle">
                ${this.translate.instant(
                'menu.customers.tazrim.charts.incomes'
            )}
                </div>
                <div class="sumTitle">-</div>`;
        } else if (pieType === 'expenses') {
            palette = this.palette.expenses;
            titleHtml = `<div class="strongTitle">
                ${this.translate.instant(
                'menu.customers.tazrim.charts.expenses'
            )}
                </div>
                <div class="sumTitle">-</div>`;
        }

        return {
            pie: true,
            data: {
                chart: {
                    plotBackgroundColor: null,
                    plotBorderWidth: null,
                    plotShadow: false,
                    type: 'pie',
                    spacingRight: 0,
                    marginBottom: 20,
                    style: {
                        fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                        fontSize: '14px'
                    },
                    plotBorderColor: '#ffffff',
                    alignTicks: false,
                    zoomType: null,
                    shadow: false,
                    borderColor: '#ffffff',
                    borderWidth: 0,
                    borderRadius: 0,
                    backgroundColor: null, // '#ffffff',
                    ignoreHiddenSeries: false,
                    animation: {
                        duration: 300
                    },
                    reflow: true,
                    inverted: false,
                    className: 'columnClass'
                },
                legend: {
                    enabled: false
                },
                subtitle: {
                    text: ''
                },
                colors: palette,
                title: {
                    useHTML: true,
                    text: titleHtml,
                    align: 'center',
                    verticalAlign: 'middle',
                    y: 10
                },
                credits: {
                    enabled: false
                },
                plotOptions: {
                    pie: {
                        borderColor: null,
                        innerSize: '60%',
                        allowPointSelect: false,
                        cursor: 'pointer',
                        dataLabels: {
                            enabled: false,
                            distance: -21,
                            padding: 0
                        }
                    },
                    series: {
                        allowPointSelect: false,
                        shadow: false,
                        states: {
                            hover: {enabled: false}
                        },
                        animation: {
                            duration: 200
                        }
                    }
                },
                tooltip: {
                    enabled: false
                },
                series: [
                    {
                        colorByPoint: true,
                        type: 'pie',
                        data: [
                            {name: 'dummy', y: 1, sliced: false, selected: false},
                            {name: 'dummy', y: 1, sliced: false, selected: false},
                            {name: 'dummy', y: 1, sliced: false, selected: false}
                        ]
                    }
                ]
            }
        };
    }

    onUpdatePasswordClick() {
        this.resetUpdatePromptData();
        this.updatePromptVisible = true;
    }

    private resetUpdatePromptData() {
        if (this.tokenStatusPass.tokenStatus == null) {
            this.updatePromptData = null;
            return;
        }

        this.updatePromptData = {
            token: this.tokenStatusPass.token,
            status: this.tokenStatusPass.tokenStatus,
            bankId: String(this.tokenStatusPass.websiteTargetTypeId),
            websiteTargetTypeId: String(this.tokenStatusPass.websiteTargetTypeId),
            accountNickname: this.tokenStatusPass.tokenNickname,
            companyId: this.userService.appData.userData.companySelect.companyId
        };
    }

    onUpdateDialogVisibilityChange(state: DialogState) {
        if (state === DialogState.UPDATE_SUCCEEDED) {
            this.tokenStatusPass.tokenStatus = TokenStatus[TokenStatus.InProgress];
        }
    }

    sendEvent(isOpened: any) {
        if (isOpened) {
            this.sharedComponent.mixPanelEvent('date drop');
        }
    }
}
