import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {UserService} from '@app/core/user.service';
import {BehaviorSubject, combineLatest, concat, defer, Observable, of, Subject} from 'rxjs';
import {BeneficiaryService, CompanyBeneficiary, CompanyBeneficiaryHistory} from '@app/core/beneficiary.service';
import {FormControl, FormGroup} from '@angular/forms';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    first,
    map,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    tap,
    withLatestFrom
} from 'rxjs/operators';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {TranslateService} from '@ngx-translate/core';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {PaginatorComponent} from '@app/shared/component/paginator/paginator.component';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {roundAndAddComma} from '@app/shared/functions/addCommaToNumbers';
import {BrowserService} from '@app/shared/services/browser.service';
import {TransTypesService} from '@app/core/transTypes.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './customers-financialManagement-beneficiary.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CustomersFinancialManagementBeneficiaryComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    readonly forceReload$: any = new Subject<void>();
    private readonly destroyed$ = new Subject<void>();

    readonly filter: any;
    private companyBeneficiaries$: any;
    beneficiariesPresented$: any;
    readonly loading$ = new BehaviorSubject<boolean>(true);

    currentPage = 0;
    entryLimit = 25;
    private readonly searchableList = [
        'accountMutavName',
        'accountMutavDetails',
        'accountMutavHp',
        'contactMail',
        'contactName',
        'contactPhone',
        'averageThreeMonths',
        'transTypeName',
        'accountId'
    ];

    transTypesArr: any[] = [];
    companyTransTypes$: Observable<any>;
    public beneficiariesPresented: any = false;
    public beneficiariesSaved: any;
    private companies$: Observable<Array<any>>;
    companiesFitlered$: Observable<Array<any>>;


    @ViewChild('scrollContainer') scrollContainerRef: ElementRef<HTMLDivElement>;
    selectedBeneficiary: CompanyBeneficiary;

    @ViewChild(PaginatorComponent) paginator: PaginatorComponent;

    beneficiaryCategoryChangePrompt: {
        visible: boolean;
        beneficiary: CompanyBeneficiary;
        doRetroactively: FormControl;
        processing: boolean;
        apply: () => void;
        hide: () => void;
        show: (beneficiary: CompanyBeneficiary) => void;
    };

    beneficiaryHistoryPrompt: {
        visible: boolean;
        beneficiary: CompanyBeneficiary;
        beneficiaryHistory$: Observable<CompanyBeneficiaryHistory>;
        hide: () => void;
        show: (beneficiary: CompanyBeneficiary) => void;
        printContent(contentRoot: HTMLElement): void;
    };

    private readonly forceRefilter$: any = new BehaviorSubject<void>(null);
    // private forceRefilter$: Subject<any> = new Subject<any>();
    // public forceRefilterOb = this.forceRefilter$.asObservable();

    constructor(
        private activated: ActivatedRoute,
        private storageService: StorageService,
        public userService: UserService,
        private translate: TranslateService,
        private beneficiaryService: BeneficiaryService,
        private sharedService: SharedService,
        public override sharedComponent: SharedComponent,
        private filterPipe: FilterPipe,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);

        this.filter = new FormGroup({
            type: new FormControl(''),
            query: new FormControl(''),
            sort: new FormControl({
                column: 'absAverageThreeMonths',
                order: 'desc'
            }),
            category: new FormControl('')
        });

        this.beneficiaryCategoryChangePrompt = {
            visible: false,
            beneficiary: null,
            doRetroactively: new FormControl(false),
            processing: false,
            apply: () => {
                this.beneficiaryCategoryChangePrompt.processing = true;
                const bnf = this.beneficiaryCategoryChangePrompt.beneficiary;
                this.beneficiaryService
                    .updateCategory({
                        companyId: this.userService.appData.userData.exampleCompany
                            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
                            : this.userService.appData.userData.companySelect.companyId,
                        biziboxMutavId: bnf.biziboxMutavId,
                        transTypeId: bnf.form.value.transType.transTypeId,
                        updateType: this.beneficiaryCategoryChangePrompt.doRetroactively
                            .value
                            ? 'future+past'
                            : 'future',
                        transId: null
                    })
                    .subscribe({
                        next: (resp) => {
                            if (resp && !resp.error) {
                                Object.assign(bnf, bnf.form.value);
                                if (bnf.transType) {
                                    bnf.transTypeId = bnf.transType.transTypeId;
                                    bnf.transTypeName = bnf.transType.transTypeName;
                                } else {
                                    bnf.transTypeId = bnf.transType.transTypeId;
                                    bnf.transTypeName = this.translate.instant(
                                        'expressions.noTransType'
                                    );
                                }
                                this.forceRefilter$.next(true);
                                this.forceReload$.next();
                            } else {
                                bnf.form.patchValue({
                                    transType: bnf.transType
                                });
                            }
                        },
                        error: (e) => {
                            bnf.form.patchValue({
                                transType: bnf.transType
                            });
                        },
                        complete: () => {
                            this.beneficiaryCategoryChangePrompt.processing = false;
                            this.beneficiaryCategoryChangePrompt.visible = false;
                        }
                    });
            },
            hide: () => {
                const bnf = this.beneficiaryCategoryChangePrompt.beneficiary;
                bnf.form.patchValue({
                    transType: bnf.transType
                });
                this.beneficiaryCategoryChangePrompt.visible = false;
                this.beneficiaryCategoryChangePrompt.beneficiary = null;
            },
            show: (beneficiary) => {
                this.beneficiaryCategoryChangePrompt.beneficiary = beneficiary;
                this.beneficiaryCategoryChangePrompt.doRetroactively.setValue(false);
                this.beneficiaryCategoryChangePrompt.visible = true;
            }
        };

        this.beneficiaryHistoryPrompt = {
            visible: false,
            beneficiary: null,
            beneficiaryHistory$: defer(() =>
                this.beneficiaryService
                    .history({
                        biziboxMutavId:
                        this.beneficiaryHistoryPrompt.beneficiary.biziboxMutavId,
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        companyAccountIds:
                            this.userService.appData.userData.accountSelect.map(
                                (acc: any) => acc.companyAccountId
                            ),
                        isDetails: true
                    })
                    .pipe(
                        withLatestFrom(
                            this.companyTransTypes$,
                            this.sharedService.paymentTypesTranslate$
                        ),
                        map(([history, transTypes, paymentTypes]) => {
                            history.transes.forEach((tr) => {
                                const transType = transTypes.find(
                                    (tt) => tt.transTypeId === tr.transTypeId
                                );
                                tr.transTypeName = transType
                                    ? transType.transTypeName
                                    : this.translate.instant('expressions.noTransType');
                                tr.paymentDesc = paymentTypes[tr.paymentDesc];
                            });
                            history.monthsTotal.sort((a, b) => a.month - b.month);
                            const containsNegativeValues = history.monthsTotal.some(
                                (mt) => mt.total < 0
                            );
                            const chartData: { asIs: boolean; data: any } = {
                                asIs: true,
                                data: {
                                    credits: {enabled: false},
                                    legend: {enabled: false},
                                    title: {text: undefined},
                                    tooltip: {enabled: false},
                                    chart: {
                                        plotBorderWidth: 0,
                                        spacing: [20, 40, 5, 5]
                                    },
                                    plotOptions: {
                                        series: {
                                            dataLabels: {
                                                style: {
                                                    textOutline: '0px',
                                                    color: '#0f3860',
                                                    fontSize: '14px',
                                                    fontWeight: 'semi-bold'
                                                },
                                                crop: false,
                                                overflow: 'allow',
                                                formatter: function () {
                                                    const formattedVal = roundAndAddComma(this['y']);
                                                    return formattedVal !== '0' ? formattedVal : null;
                                                },
                                                enabled: true
                                            }
                                        }
                                    },
                                    yAxis: {
                                        title: {text: undefined},
                                        labels: {
                                            style: {
                                                fontSize: '14px',
                                                color: '#0f3860',
                                                fontWeight: '400'
                                            }
                                        },
                                        gridLineWidth: 0,
                                        tickAmount: 5,
                                        // minPadding: 0.05,
                                        // maxPadding: 0.01,
                                        plotLines: [
                                            {
                                                value: 0,
                                                width: containsNegativeValues ? 1 : 0,
                                                color: 'rgba(228, 232, 235, 1.0)',
                                                zIndex: 0
                                            },
                                            {
                                                color: 'rgba(221, 231, 241, 0.65)',
                                                // 'rgba(2,34,126,0.3)',
                                                // 'rgba(0,169,165,0.2)',
                                                // 'rgba(15,56,96,0.3)',
                                                width: 8,
                                                value: history.average,
                                                label: {
                                                    text: 'ממוצע',
                                                    textAlign: 'right',
                                                    align: 'right',
                                                    x: 36,
                                                    style: {
                                                        fontSize: '14px',
                                                        color: '#0f3860',
                                                        fontWeight: '400'
                                                    }
                                                },
                                                zIndex: 4
                                            }
                                        ]
                                    },
                                    xAxis: {
                                        type: 'category',
                                        labels: {
                                            style: {
                                                fontSize: '14px',
                                                color: '#0f3860',
                                                fontWeight: '400'
                                            }
                                        },
                                        lineWidth: 0
                                    },
                                    series: [
                                        {
                                            type: 'column',
                                            pointPadding: 0.25,
                                            data: history.monthsTotal.map((mt) => {
                                                const mtMonthMmnt = this.userService.appData.moment(
                                                    mt.month
                                                );
                                                const y = mt.total ? mt.total : null;
                                                // const y = mt.total
                                                //     ? mt.total : (mtMonthMmnt.isSame(this.userService.appData.moment(), 'month')
                                                //     ? 10000 : null)
                                                return {
                                                    y: mt.total ? mt.total : null,
                                                    name: mtMonthMmnt.format('MM/YY'),
                                                    color: mtMonthMmnt.isSame(
                                                        this.userService.appData.moment(),
                                                        'month'
                                                    )
                                                        ? <any>{
                                                            linearGradient: {
                                                                x1: '4%',
                                                                y1: '18%',
                                                                x2: '5%',
                                                                y2: '24%',
                                                                spreadMethod: 'repeat'
                                                            },
                                                            stops: [
                                                                ['0%', '#eecc48'],
                                                                ['50%', '#fff']
                                                            ]
                                                        }
                                                        : '#00a9a5',
                                                    dataLabels: {
                                                        y: 2 * (y >= 0 ? 1 : -1)
                                                    }
                                                };
                                            })
                                        }
                                    ]
                                }
                            };
                            // const chartData = {
                            //     column: true,
                            //     dataLabelsEnabled: true,
                            //     gridLineWidth: 0,
                            //     markerEnabled: false,
                            //     crosshair: false,
                            //     xAxiscategories: [],
                            //     // min: Math.min(history.average, 0),
                            //     // max: 0,
                            //     plotLines: [{
                            //         color: 'rgba(2,34,126,0.3)',
                            //         // 'rgba(0,169,165,0.2)',
                            //         // 'rgba(15,56,96,0.3)',
                            //         width: 4,
                            //         value: history.average,
                            //         label: {
                            //             text: 'ממוצע',
                            //             align: 'right',
                            //             x: -5
                            //         },
                            //         zIndex: 5
                            //     }],
                            //     series: [
                            //         // {
                            //         //     stack: 'a',
                            //         //     showInLegend: false,
                            //         //     enableMouseTracking: false,
                            //         //     color: '#f7f7f7',
                            //         //     data: []
                            //         // },
                            //         {
                            //             stack: 'a',
                            //             showInLegend: false,
                            //             enableMouseTracking: false,
                            //             color: '#00a9a5',
                            //             data: [],
                            //             dataLabels: {
                            //                 style: {
                            //                     textOutline: '0px',
                            //                     color: '#0f3860',
                            //                     fontSize: '14px',
                            //                     fontWeight: '400'
                            //                 },
                            //                 // // align: 'center',
                            //                 // verticalAlign: 'bottom',
                            //                 // crop: false,
                            //                 // overflow: 'none',
                            //                 // // y: -30,
                            //                 inside: false,
                            //                 crop: false,
                            //                 overflow: 'allow',
                            //                 formatter: function () {
                            //                     const formattedVal = roundAndAddComma(this.y);
                            //                     return formattedVal !== '0' ? formattedVal : null;
                            //                 },
                            //                 enabled: true
                            //             }
                            //         }
                            //     ]
                            // };
                            //
                            // history.monthsTotal.sort((a, b) => a.month - b.month);
                            // history.monthsTotal.forEach((val) => {
                            //     chartData.series[0].data.push({
                            //         y: val.total ? val.total : null
                            //     });
                            //     chartData.xAxiscategories.push(
                            //         this.userService.appData.moment(val.month).format('MM/YY'));
                            // });
                            // const yVals = chartData.series[1].data.map((val) => val.y);
                            // chartData.max = Math.ceil(Math.max(...yVals));
                            // chartData.series[1].data.forEach(clmn => {
                            //     chartData.series[0].data.push({
                            //         y: chartData.max - clmn.y
                            //     });
                            // });
                            history.chartData = chartData;

                            return history;
                        }),
                        publishRef
                    )
            ),
            hide: () => {
                this.beneficiaryHistoryPrompt.beneficiary = null;
                this.beneficiaryHistoryPrompt.visible = false;
            },
            show: (beneficiary) => {
                this.beneficiaryHistoryPrompt.beneficiary = beneficiary;
                this.beneficiaryHistoryPrompt.visible = true;
            },
            printContent: (contentRoot: HTMLElement) => {
                BrowserService.printHtml(
                    contentRoot,
                    'היסטוריית מוטב ' +
                    this.beneficiaryHistoryPrompt.beneficiary.accountMutavName
                );
            }
        };
    }

    override reload() {
        console.log('reload child');
        this.forceReload$.next();
    }

    ngOnInit(): void {
        const companySelected = this.sharedComponent.getDataEvent
            .pipe(
                startWith(true),
                map(() => this.userService.appData && this.userService.appData.userData && this.userService.appData.userData.companySelect
                    ? this.userService.appData.userData.companySelect.companyId : null),
                filter(companyId => !!companyId),
                takeUntil(this.destroyed$)
            );

        this.companyTransTypes$ = this.transTypesService.selectedCompanyTransTypes
            .pipe(
                takeUntil(this.destroyed$)
            );

        this.companyBeneficiaries$ = concat(
            companySelected
                .pipe(
                    first()
                ),
            this.forceReload$
        )
            .pipe(
                filter(() => this.userService.appData && this.userService.appData.userData
                    && this.userService.appData.userData.companySelect
                    && this.userService.appData.userData.accountSelect),
                tap(() => {
                    // if(this.userService.appData.userData.accountSelect.filter((account) => {
                    //     return account.currency !== 'ILS';
                    // }).length){
                    //     this.sharedComponent.mixPanelEvent('accounts drop');
                    // }

                    const accountSelectExchange = this.userService.appData.userData.accountSelect.filter((account) => {
                        return account.currency !== 'ILS';
                    });
                    this.sharedComponent.mixPanelEvent('accounts drop', {
                        accounts: (this.userService.appData.userData.accountSelect.length === accountSelectExchange.length) ? 'כל החשבונות מט"ח' :
                            (((this.userService.appData.userData.accounts.length - accountSelectExchange.length) === this.userService.appData.userData.accountSelect.length) ? 'כל החשבונות' :
                                (
                                    this.userService.appData.userData.accountSelect.map(
                                        (account) => {
                                            return account.companyAccountId;
                                        }
                                    )
                                ))
                    });
                    this.loading$.next(true);
                }),
                switchMap(() => {
                    return (this.userService.appData.userData.accountSelect.length)
                        ? this.beneficiaryService.getBeneficiariesForAccountsIn({
                            companyId: this.userService.appData.userData.companySelect.companyId,
                            companyAccountIds: this.userService.appData.userData.accountSelect
                                .map(acc => acc.companyAccountId)
                        })
                        : of([]);
                }),
                // tap(() => this.loading$.next(false)),
                withLatestFrom(this.companyTransTypes$),
                map(([companyBeneficiaries, companyCategories]) => {
                    companyBeneficiaries
                        .forEach(bnf => {
                            bnf.transType = companyCategories.find(cc => cc.transTypeId === bnf.transTypeId);
                            bnf.transTypeName = bnf.transType
                                ? bnf.transType.transTypeName
                                : this.translate.instant('expressions.noTransType');
                            bnf.form = new FormGroup({
                                transType: new FormControl(bnf.transType),
                                accountMutavHp: new FormControl(bnf.accountMutavHp),
                                accountMutavDetails: new FormControl(bnf.accountMutavDetails),
                                contactName: new FormControl(bnf.contactName),
                                contactMail: new FormControl(bnf.contactMail, ValidatorsFactory.emailExtended),
                                contactPhone: new FormControl(bnf.contactPhone) // , ValidatorsFactory.cellNumberValidatorIL)
                            });
                        });

                    const transTypesMap = companyBeneficiaries.reduce((acmltr, dtRow) => {
                        if (dtRow.transTypeId && !acmltr[dtRow.transTypeId]) {
                            acmltr[dtRow.transTypeId] = {
                                val: dtRow.transTypeName,
                                id: dtRow.transTypeId,
                                checked: !Array.isArray(this.filter.value.category)
                                    || this.filter.value.category.includes(dtRow.transTypeId)
                            };

                            if (acmltr['all'].checked && !acmltr[dtRow.transTypeId].checked) {
                                acmltr['all'].checked = false;
                            }
                        }
                        return acmltr;
                    }, {
                        all: {
                            val: this.translate.instant('filters.all'),
                            id: 'all',
                            checked: true
                        }
                    });
                    this.transTypesArr = Object.values(transTypesMap);


                    return companyBeneficiaries;
                }),
                shareReplay(1)
            );

        this.beneficiariesPresented$ =
            combineLatest([
                this.companyBeneficiaries$,
                this.filter.valueChanges
                    .pipe(
                        // tap(() => {
                        //     this.loading$.next(true);
                        //     console.log(this.loading$);
                        // }),
                        startWith(this.filter.value),
                        debounceTime(20),
                        distinctUntilChanged()
                    ),
                this.forceRefilter$
            ])
                .pipe(
                    map((res: any) => {
                        let [rows, filterVal] = res;
                        if (rows && rows.length) {
                            rows = (filterVal.type || (Array.isArray(filterVal.category) && filterVal.category.length) || filterVal.query)
                                ? rows.filter(it => {
                                        let isTypeFilter = !filterVal.type;
                                        let isCategoryFilter = !(Array.isArray(filterVal.category) && filterVal.category.length);
                                        let isQueryFilter = !filterVal.query;
                                        if (filterVal.type) {
                                            isTypeFilter = filterVal.type === 'debit'
                                                ? it.averageThreeMonths <= 0
                                                : it.averageThreeMonths >= 0;
                                        }
                                        if ((Array.isArray(filterVal.category) && filterVal.category.length)) {
                                            isCategoryFilter = filterVal.category.includes(it.transTypeId);
                                        }
                                        if (filterVal.query) {
                                            const query = filterVal.query.toString().toLowerCase();
                                            isQueryFilter =
                                                (it['accountMutavName'] && it['accountMutavName'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['accountMutavDetails'] && it['accountMutavDetails'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['accountMutavHp'] && it['accountMutavHp'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['contactMail'] && it['contactMail'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['contactName'] && it['contactName'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['contactPhone'] && it['contactPhone'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['averageThreeMonths'] && it['averageThreeMonths'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['transTypeName'] && it['transTypeName'].toString()
                                                    .toLowerCase()
                                                    .includes(query)) ||
                                                (it['accountId'] && it['accountId'].toString()
                                                    .toLowerCase()
                                                    .includes(query));
                                        }
                                        if (isTypeFilter && isCategoryFilter && isQueryFilter) {
                                            return true;
                                        } else {
                                            return false;
                                        }
                                    }
                                )
                                : rows;


                            // rows = filterVal.type
                            //     ? rows.filter(bfn =>
                            //         filterVal.type === 'debit'
                            //             ? bfn.averageThreeMonths <= 0
                            //             : bfn.averageThreeMonths >= 0)
                            //     : rows;
                            //
                            // rows = Array.isArray(filterVal.category)
                            //     ? filterVal.category.length > 0
                            //         ? rows.filter(bfn => filterVal.category.includes(bfn.transTypeId))
                            //         : []
                            //     : rows;
                            // // this.filterPipe.transform(rows, filterVal.query, this.searchableList)
                            //
                            // rows = filterVal.query
                            //     ? rows.filter(it => {
                            //         const query = filterVal.query.toString().toLowerCase();
                            //         return it['accountMutavName'] && it['accountMutavName'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['accountMutavDetails'] && it['accountMutavDetails'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['accountMutavHp'] && it['accountMutavHp'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['contactMail'] && it['contactMail'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['contactName'] && it['contactName'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['contactPhone'] && it['contactPhone'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['averageThreeMonths'] && it['averageThreeMonths'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['transTypeName'] && it['transTypeName'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query) ||
                            //             it['accountId'] && it['accountId'].toString()
                            //                 .toLowerCase()
                            //                 .includes(query);
                            //     })
                            //     : rows;
                            // debugger;

                            if (filterVal.sort.column === 'absAverageThreeMonths') {
                                rows.sort((v1, v2) => this.compareNumberVals(v1[filterVal.sort.column], v2[filterVal.sort.column])
                                    * (filterVal.sort.order === 'desc' ? -1 : 1)
                                );
                            } else if (filterVal.sort.column === 'accountMutavName') {
                                rows.sort((v1, v2) => this.compareStringVals(v1[filterVal.sort.column], v2[filterVal.sort.column])
                                    * (filterVal.sort.order === 'desc' ? -1 : 1)
                                );
                            }
                        }
                        return rows;
                    }),
                    tap(() => {
                        if (this.paginator) {
                            // debugger;
                            this.paginator.changePage(0);
                        }
                        this.loading$.next(false);
                    }),
                    publishRef,
                    takeUntil(this.destroyed$)
                );
    }

    ngAfterViewInit(): void {

    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
        this.destroy();
    }

    paginate(event) {
        console.log('paginate ===> %o', event);

        if (this.entryLimit !== +event.rows) {
            this.entryLimit = +event.rows;
        }

        if (this.currentPage !== +event.page) {
            if (this.scrollContainerRef) {
                requestAnimationFrame(() =>
                    this.scrollContainerRef.nativeElement.scrollTo(0, 0)
                );
            }
            this.currentPage = event.page;
        }
    }

    private compareStringVals(a: string, b: string): number {
        return a || b ? (!a ? -1 : !b ? 1 : a.localeCompare(b)) : 0;
    }

    private compareNumberVals(a: number, b: number): number {
        return a || b ? (!a ? -1 : !b ? 1 : a - b) : 0;
    }

    toggleSortOrderTo(columnName: string) {
        this.filter.patchValue({
            sort: {
                column: columnName,
                order:
                    this.filter.value.sort.column === columnName
                        ? this.filter.value.sort.order === 'desc'
                            ? 'asc'
                            : 'desc'
                        : 'desc'
            }
        });
    }

    submitChanges($event?: Event) {
        if (this.selectedBeneficiary.form.invalid) {
            this.cancelChanges($event);
            return;
        }

        const submittingChangesFor = this.selectedBeneficiary;
        const somethingChanged = Object.entries(
            this.selectedBeneficiary.form.value
        ).some(([k, v]) => {
            if (k === 'transType') {
                return false;
            }

            return String(submittingChangesFor[k]) !== String(v);
        });

        if (!somethingChanged) {
            return;
        }
        const submitCandidate = Object.assign(
            {
                companyId: this.userService.appData.userData.companySelect.companyId,
                biziboxMutavId: this.selectedBeneficiary.biziboxMutavId,
                accountMutavName: this.selectedBeneficiary.accountMutavName,
                bankId: this.selectedBeneficiary.bankId,
                snifId: this.selectedBeneficiary.snifId,
                accountId: this.selectedBeneficiary.accountId
            },
            this.selectedBeneficiary.form.value
        );
        submitCandidate.transTypeId = submitCandidate.transType
            ? submitCandidate.transType.transTypeId
            : null;
        delete submitCandidate.transType;

        this.beneficiaryService.update(submitCandidate).subscribe((resp) => {
            if (resp && !resp.error) {
                this.applyCommitedFor(submittingChangesFor);
                this.forceRefilter$.next(true);
            }
        });
    }

    cancelChanges($event?: Event) {
        this.selectedBeneficiary.form.patchValue({
            transType: this.selectedBeneficiary.transType,
            accountMutavHp: this.selectedBeneficiary.accountMutavHp,
            accountMutavDetails: this.selectedBeneficiary.accountMutavDetails,
            contactName: this.selectedBeneficiary.contactName,
            contactMail: this.selectedBeneficiary.contactMail,
            contactPhone: this.selectedBeneficiary.contactPhone
        });
    }

    private applyCommitedFor(bnf: CompanyBeneficiary) {
        Object.assign(bnf, bnf.form.value);
        if (bnf.transType) {
            bnf.transTypeId = bnf.transType.transTypeId;
            bnf.transTypeName = bnf.transType.transTypeName;
        } else {
            bnf.transTypeId = bnf.transType.transTypeId;
            bnf.transTypeName = this.translate.instant('expressions.noTransType');
        }
    }
}
