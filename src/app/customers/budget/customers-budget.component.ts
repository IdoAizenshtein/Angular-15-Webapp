import {
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {TranslateService} from '@ngx-translate/core';
import {BrowserService} from '@app/shared/services/browser.service';
import {TokenService} from '@app/core/token.service';
import {distinctUntilChanged, filter, map, startWith, takeUntil, withLatestFrom} from 'rxjs/operators';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {slideInOut} from '@app/shared/animations/slideInOut';
import {formatWithoutPoints, roundAndAddComma} from '@app/shared/functions/addCommaToNumbers';
import {DatePipe} from '@angular/common';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {StorageService} from '@app/shared/services/storage.service';
import {HttpErrorResponse} from '@angular/common/http';
import {compareDates} from '@app/shared/functions/compareDates';
import {getDaysBetweenDates} from '@app/shared/functions/getDaysBetweenDates';
import {FormArray, FormBuilder, FormControl, Validators} from '@angular/forms';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {Calendar} from 'primeng/calendar';
import {NgbCarousel, NgbCarouselConfig} from '@ng-bootstrap/ng-bootstrap';
import {TransTypesService} from '@app/core/transTypes.service';
import {defer, Observable, Subject, Subscription} from 'rxjs';
import {ActionService} from '@app/core/action.service';
import {Router} from '@angular/router';
import {OverlayPanel} from 'primeng/overlaypanel';
import {CategorySelectComponent} from '@app/shared/component/category-select/category-select.component';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {publishRef} from '@app/shared/functions/publishRef';
import {getPageHeight} from "@app/shared/functions/getPageHeight";

@Component({
    templateUrl: './customers-budget.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut],
    providers: [NgbCarouselConfig]
})
export class CustomersBudgetComponent implements OnInit, OnDestroy {
    @ViewChild(AccountSelectComponent) accountSelector: AccountSelectComponent;
    @ViewChild('transDateSelector', {read: Calendar})
    transDateSelector: Calendar;
    @ViewChild('budgetTypeElem', {read: ElementRef}) budgetTypeElem: ElementRef;
    @ViewChild('myCarousel') myCarousel: NgbCarousel;
    @ViewChildren('inputBoxTotal', {read: ElementRef})
    inputBoxTotalRef: QueryList<ElementRef>;
    @ViewChildren('budgetCategoryRows', {read: ElementRef})
    budgetCategoryRowsRef: QueryList<ElementRef>;
    @ViewChildren('budgetCubes', {read: ElementRef})
    budgetCubesRef: QueryList<ElementRef>;
    @ViewChild('tooltipNav') tooltipNavRef: OverlayPanel;
    @ViewChildren('tooltipAcc') tooltipAccRef: OverlayPanel;
    @ViewChildren(CategorySelectComponent)
    childCategories: CategorySelectComponent;
    @ViewChild('scrollContainer') scrollContainer: ElementRef;

    public budgetNav: any;
    public readonly today: Date;
    public readonly maxPast: Date;
    public keyHistoryData: any;
    public dataBudgets: any = [];
    private readonly dtPipe: DatePipe;
    public budgetIdActive: string;
    public loaderPrivScreen = false;
    public privScreenEmpty = false;
    public totals: any = [];
    private _selectedTransaction: any;
    private editingTransactionOld: any;
    private _editingTransaction: any;
    public accountsNotUpdates: any;
    // public accountsNotUpdatesOldestTransDate: any;
    public deleteConfirmationPrompt: {
        item: any;
        message: string;
        processing: boolean | null;
        visible: boolean | null;
        onApprove: () => void;
    };
    public dataBudgetsIds: any = [];
    public popupBudgetCreate: any = false;
    public categories: any = [];
    public lengthSlides: any;
    public images: any;
    private readonly destroyed$ = new Subject<void>();
    private readonly DEFAULT_TRANSTYPE_ID =
        'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
    public subscription: Subscription;
    public companyTransTypes: any[] = [];
    public copyTransTypes: any[] = [];
    public isSubmitted: boolean;
    public copyTransTypesIncome: any[] = [];
    public copyTransTypesExpence: any[] = [];
    public copyTransTypesIncomeAll: any[] = [];
    public copyTransTypesExpenceAll: any[] = [];
    private defaultTransType: any | null;
    public addCategory: any;

    public budgetHistoryPrompt: {
        reload: boolean;
        activeTab: number;
        visible: boolean;
        transCalc: number;
        budgetHistoryRow: any;
        budgetHistoryRowSave: any;
        budgetHistory$: Observable<any>;
        changeChart: (tabNum: number) => void;
        createChart: (data: any) => any;
        hide: () => void;
        show: (budgetHistoryRow: any, idx?: any) => void;
        printContent(contentRoot: HTMLElement): void;
    };
    private companyTransTypes$: Observable<any>;
    readonly showValuesControl = new FormControl();
    public dataHistoryLoaded$ = new Subject();
    public restorePopupOpen = false;
    private actionNavigateToBudgetSub: Subscription;
    private navParams: any;
    public budgetOrderType: any = [
        {
            label: 'צבירה ₪',
            value: 'USER_TOTAL'
        },
        {
            label: 'צבירה %',
            value: 'USED_PRC'
        },
        {
            label: 'א׳ ב׳',
            value: 'CATEGORY'
        },
        {
            label: 'הוצאה',
            value: 'OUTCOME'
        },
        {
            label: 'הכנסה',
            value: 'INCOME'
        }
    ];
    public sortDown = false;
    transTypeChangePrompt: {
        data: {
            transTypeName: string;
            transName: string;
            transTypeId: string;
            companyId: string;
            kvua: any;
            bankTransId: string;
            ccardTransId: string;
            searchkeyId: string;
        };
        show: boolean;
        apply: (event: any) => void;
        cancel: (event: any) => void;
    };
    private numLengOrgHistory: boolean;
    public addHistoryParam: boolean = false;
    public langCalendar: any;

    constructor(
        public userService: UserService,
        public translate: TranslateService,
        public browserDetect: BrowserService,
        public sharedComponent: SharedComponent,
        private sharedService: SharedService,
        private currencySymbolPipe: CurrencySymbolPipe,
        public fb: FormBuilder,
        private sortPipe: SortPipe,
        private storageService: StorageService,
        public tokenService: TokenService,
        private config: NgbCarouselConfig,
        private actionService: ActionService,
        private transTypesService: TransTypesService,
        public router: Router
    ) {
        this.dtPipe = new DatePipe('en-IL');
        this.deleteConfirmationPrompt = {
            visible: false,
            processing: null,
            message: null,
            item: null,
            onApprove: null
        };
        this.today = this.userService.appData.moment().toDate();
        this.maxPast = this.userService.appData
            .moment()
            .subtract(11, 'months')
            .startOf('month')
            .toDate();
        this.config.interval = 0;
        this.config.wrap = false;
        this.config.keyboard = false;
        // this.config.pauseOnHover = false;
        // this.direction = 'right';
        this.budgetHistoryPrompt = {
            reload: false,
            activeTab: 2,
            transCalc: 0,
            visible: false,
            budgetHistoryRow: null,
            budgetHistoryRowSave: null,
            createChart: (history: any): any => {
                if (
                    this.getBudgetsDetails().frequencyDesc === 'YEAR' ||
                    !history.currentMonth
                ) {
                    this.budgetHistoryPrompt.activeTab = 1;
                }
                if (this.budgetHistoryPrompt.activeTab === 1) {
                    const containsNegativeValues = history.monthsTotal.some(
                        (mt) => mt.total < 0
                    );
                    const chartData: any = {
                        asIs: true,
                        data: {
                            credits: {enabled: false},
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
                            title: {text: undefined},
                            tooltip: {enabled: false},
                            chart: {
                                plotBorderWidth: 0,
                                spacing: [0, 40, 5, 5]
                            },
                            plotOptions: {
                                series: {
                                    states: {
                                        inactive: {
                                            opacity: 1
                                        },
                                        hover: {
                                            enabled: true,
                                            brightness: -0.1
                                        }
                                    },
                                    dataLabels: {
                                        style: {
                                            textOutline: '0px',
                                            color: '#0f3860',
                                            fontSize: '14px',
                                            fontWeight: 'semi-bold'
                                        },
                                        crop: false,
                                        overflow: 'allow',
                                        allowOverlap: true,
                                        padding: 0,
                                        formatter: function () {
                                            const formattedVal = roundAndAddComma(this['y']);
                                            return formattedVal !== '0' ? formattedVal : null;
                                        },
                                        enabled: this.showValuesControl.value
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
                                startOnTick: false,
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
                                            y: 5,
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
                                    cursor: 'pointer',
                                    name: 'תקופה נוכחית',
                                    color: '#42a6a4',
                                    marker: {
                                        symbol: 'circle'
                                    },
                                    events: {
                                        legendItemClick: (event) => false
                                    },
                                    data: history.monthsTotal.map((mt) => {
                                        const mtMonthMmnt =
                                            this.translate.instant('months')[mt.monthNumber - 1];
                                        const y = mt.monthTotal ? mt.monthTotal : null;
                                        return {
                                            y: mt.monthTotal ? mt.monthTotal : null,
                                            name: mtMonthMmnt,
                                            color:
                                                this.userService.appData.moment().format('M') ===
                                                mt.monthNumber.toString()
                                                    ? <any>{
                                                        linearGradient: {
                                                            x1: '4%',
                                                            y1: '18%',
                                                            x2: '5%',
                                                            y2: '24%',
                                                            spreadMethod: 'repeat'
                                                        },
                                                        stops: [
                                                            ['70%', '#eecc48'],
                                                            ['30%', '#fff']
                                                        ]
                                                    }
                                                    : '#42a6a4',
                                            dataLabels: {
                                                y: 2 * (y >= 0 ? 1 : -1)
                                            }
                                        };
                                    })
                                },
                                {
                                    type: 'column',
                                    pointPadding: 0.25,
                                    visible: !!history.showPrevYearSeriesByDefault,
                                    cursor: 'pointer',
                                    name: 'תקופה מקבילה אשתקד',
                                    color: '#85bbfa',
                                    marker: {
                                        symbol: 'circle'
                                    },
                                    events: {
                                        legendItemClick: ((event) => {
                                            history.showPrevYearSeriesByDefault =
                                                !history.showPrevYearSeriesByDefault;
                                        }).bind(this)
                                    },
                                    data: history.monthsTotal.map((mt) => {
                                        const mtMonthMmnt =
                                            this.translate.instant('months')[mt.monthNumber - 1];
                                        const y = mt.previousTotal ? mt.previousTotal : null;
                                        return {
                                            y: mt.previousTotal ? mt.previousTotal : null,
                                            name: mtMonthMmnt,
                                            color: '#85bbfa',
                                            dataLabels: {
                                                y: 2 * (y >= 0 ? 1 : -1)
                                            }
                                        };
                                    })
                                }
                            ]
                        }
                    };
                    return chartData;
                } else {
                    const containsNegativeValues = history.currentMonth.some(
                        (mt) => mt.dayTotal < 0
                    );
                    const chartData: any = {
                        asIs: true,
                        data: {
                            credits: {enabled: false},
                            legend: {enabled: false},
                            title: {text: undefined},
                            tooltip: {enabled: false},
                            chart: {
                                plotBorderWidth: 0,
                                spacing: [20, 5, 20, 5]
                            },
                            plotOptions: {
                                series: {
                                    states: {
                                        inactive: {
                                            opacity: 1
                                        },
                                        hover: {
                                            enabled: true,
                                            brightness: -0.1
                                        }
                                    },
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
                                        enabled: this.showValuesControl.value
                                    }
                                }
                            },
                            yAxis: {
                                title: {text: undefined},
                                labels: {
                                    style: {
                                        fontSize: '14px',
                                        color: '#0f3860',
                                        fontWeight: '600'
                                    }
                                },
                                gridLineWidth: 0,
                                tickAmount: 15,
                                // minPadding: 0.05,
                                // maxPadding: 0.01,
                                plotLines: [
                                    {
                                        value: 0,
                                        width: containsNegativeValues ? 1 : 0,
                                        color: 'rgba(228, 232, 235, 1.0)',
                                        zIndex: 0
                                    }
                                ],
                                endOnTick: false,
                                startOnTick: false,
                                allowDecimals: false,
                                tickPosition: 'outside',
                                tickmarkPlacement: 'on',
                                tickLength: 10,
                                tickWidth: 1,
                                lineColor: '#cbc9c9',
                                lineWidth: 1,
                                opposite: false
                            },
                            xAxis: {
                                tickWidth: 1,
                                tickLength: 6,
                                tickmarkPlacement: 'on',
                                tickPosition: 'inside',
                                type: 'category',
                                labels: {
                                    rotation: 0,
                                    useHTML: true,
                                    reserveSpace: true,
                                    staggerLines: 1,
                                    style: {
                                        fontWeight: '600',
                                        textAlign: 'center',
                                        padding: '0',
                                        margin: '0',
                                        fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                        fontSize: '14px',
                                        color: '#0f3860',
                                        whiteSpace: 'normal'
                                    }
                                },
                                lineColor: '#cbc9c9',
                                lineWidth: 1,
                                title: {
                                    text: `<b>${
                                        // tslint:disable-next-line:max-line-length
                                        this.translate.translations[this.translate.currentLang]
                                            .months[new Date().getMonth()]
                                    } ${new Date().getFullYear()}</b>`,
                                    style: {
                                        fontSize: '16px',
                                        color: '#0f3860'
                                    },
                                    margin: 20
                                }
                            },
                            series: [
                                {
                                    type: 'column',
                                    pointPadding: 0.25,
                                    data: history.currentMonth.map((mt) => {
                                        const mtMonthMmnt = mt.transDay;
                                        const y = mt.dayTotal ? mt.dayTotal : null;
                                        const isToday =
                                            this.userService.appData.moment().format('D') ===
                                            mtMonthMmnt.toString();
                                        return {
                                            y: y,
                                            name: isToday
                                                ? '<b style="font-weight: 700;">היום</b>'
                                                : mtMonthMmnt,
                                            color: isToday
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
                                                : '#42a6a4',
                                            dataLabels: {
                                                y: 2 * (y >= 0 ? 1 : -1)
                                            }
                                        };
                                    })
                                }
                            ]
                        }
                    };
                    return chartData;
                }
            },
            budgetHistory$: defer(() =>
                this.sharedService
                    .keyHistory({
                        budgetId: this.getBudgetsDetails().budgetId,
                        keyId: this.budgetHistoryPrompt.budgetHistoryRow.keyId,
                        expence: this.budgetHistoryPrompt.budgetHistoryRow.expence,
                        creditCardCalcTypeDesc:
                        this.getBudgetsDetails().creditCardCalcTypeDesc,
                        companyAccountIds: this.getBudgetsDetails().budgetAccounts,
                        withDetails: true
                    })
                    .pipe(
                        withLatestFrom(
                            this.companyTransTypes$,
                            this.sharedService.paymentTypesTranslate$
                        ),
                        map(([history, transTypes, paymentTypes]) => {
                            history = history ? history['body'] : history;
                            this.numLengOrgHistory = false;
                            history.transes.forEach((tr) => {
                                const companyTransType =
                                    this.companyTransTypes.find((tt) => {
                                        return tt.transTypeId === tr.keyId;
                                    }) || this.defaultTransType;
                                tr.transDateFormat = Number.isFinite(tr.transDate)
                                    ? new Date(tr.transDate)
                                    : null;
                                tr.selectedTransType = companyTransType;
                                tr.paymentDescSrc = tr.paymentDesc;
                                tr.transNameSrc = tr.transName;
                                tr.totalSrc = tr.total;
                                tr.paymentDesc =
                                    tr.paymentDesc === 'Budget'
                                        ? 'הוזן ידנית'
                                        : paymentTypes[tr.paymentDesc];
                            });
                            this.showValuesControl.valueChanges.subscribe((val) => {
                                history.chartData =
                                    this.budgetHistoryPrompt.createChart(history);
                                return history;
                            });
                            this.dataHistoryLoaded$.subscribe((val: any) => {
                                if (val) {
                                    if (val.length === 2) {
                                        if (val[1] === true) {
                                            this.addHistoryParam = true;
                                            history.transes = [
                                                val[0],
                                                ...history.transes
                                            ]
                                            if (this.virtualScrollSaved) {
                                                requestAnimationFrame(() => {
                                                    this.virtualScrollSaved.scrollTo({top: 0, duration: 500})
                                                    // this.scrollContainer.nativeElement.scrollTop = 0;
                                                });
                                            }
                                        } else {
                                            if (val[1] === 1) {
                                                const newRows = history.transes.filter(
                                                    (it) => it.newRow
                                                );
                                                if (
                                                    newRows.filter(
                                                        (it) =>
                                                            it.total !== '' &&
                                                            it.total !== null &&
                                                            it.total !== '0' &&
                                                            it.total !== 0 &&
                                                            it.transName !== ''
                                                    ).length === newRows.length
                                                ) {
                                                    this.addHistoryParam = false;
                                                    let finishedSent = 0;
                                                    newRows.forEach((it) => {
                                                        it.newRow = false;
                                                        it.editRow = false;
                                                        it.total = Number(it.total);
                                                        it.totalSrc = it.total;
                                                        it.transNameSrc = it.transName;
                                                        it.transDate = this.userService.appData
                                                            .moment(it.transDateFormat)
                                                            .startOf('day')
                                                            .valueOf();

                                                        this.sharedService
                                                            .createBudgetTrans({
                                                                companyId:
                                                                this.userService.appData.userData
                                                                    .companySelect.companyId,
                                                                transDate: it.transDate,
                                                                expence: it.hova,
                                                                transName: it.transName,
                                                                transTotal: it.total,
                                                                transTypeId: it.keyId
                                                            })
                                                            .subscribe(
                                                                (response: any) => {
                                                                    it.transId = response
                                                                        ? response['body']
                                                                        : response;
                                                                    if (
                                                                        it.keyId ===
                                                                        this.budgetHistoryPrompt.budgetHistoryRow
                                                                            .keyId
                                                                    ) {
                                                                        const monthDiffThisMonth =
                                                                            this.userService.appData
                                                                                .moment()
                                                                                .isSame(it.transDate, 'month');
                                                                        if (monthDiffThisMonth) {
                                                                            this.budgetHistoryPrompt.transCalc +=
                                                                                it.total;
                                                                        }
                                                                        history.monthsTotal.forEach((it1) => {
                                                                            const monthDiff = this.userService.appData
                                                                                .moment(it1.date)
                                                                                .isSame(it.transDate, 'month');
                                                                            if (monthDiff) {
                                                                                it1.monthTotal =
                                                                                    it1.monthTotal + it.total;
                                                                            }
                                                                        });
                                                                        history.currentMonth.forEach((it1) => {
                                                                            if (
                                                                                this.userService.appData
                                                                                    .moment()
                                                                                    .isSame(it.transDate, 'month')
                                                                            ) {
                                                                                const monthDiff =
                                                                                    this.userService.appData
                                                                                        .moment(it.transDate)
                                                                                        .format('D') ===
                                                                                    it1.transDay.toString();
                                                                                if (monthDiff) {
                                                                                    it1.dayTotal =
                                                                                        it1.dayTotal + it.total;
                                                                                }
                                                                            }
                                                                        });
                                                                    }

                                                                    finishedSent += 1;
                                                                    if (newRows.length === finishedSent) {
                                                                        this.numLengOrgHistory = true;
                                                                        history.transes = history.transes.filter(
                                                                            (ite) =>
                                                                                ite.keyId ===
                                                                                this.budgetHistoryPrompt
                                                                                    .budgetHistoryRow.keyId
                                                                        );
                                                                        history.transesTotal =
                                                                            history.transes.reduce(
                                                                                (a, b) => a + b.total,
                                                                                0
                                                                            );
                                                                        const idxSlices =
                                                                            history.monthsTotal.findIndex((v) => {
                                                                                return (
                                                                                    this.userService.appData
                                                                                        .moment(v.date)
                                                                                        .isBefore(
                                                                                            this.userService.appData.moment(),
                                                                                            'month'
                                                                                        ) && v.monthTotal !== 0
                                                                                );
                                                                            });
                                                                        const arrOldMonths =
                                                                            history.monthsTotal.slice(
                                                                                idxSlices,
                                                                                history.monthsTotal.length - 1
                                                                            );
                                                                        if (arrOldMonths.length) {
                                                                            const averageTotal = arrOldMonths.reduce(
                                                                                (a, b) => a + b.monthTotal,
                                                                                0
                                                                            );
                                                                            history.average = (
                                                                                averageTotal / arrOldMonths.length
                                                                            ).toFixed(1);
                                                                        }
                                                                        history.chartData =
                                                                            this.budgetHistoryPrompt.createChart(
                                                                                history
                                                                            );
                                                                        this.calculateLeft();
                                                                    }
                                                                },
                                                                (err: HttpErrorResponse) => {
                                                                    finishedSent += 1;
                                                                }
                                                            );
                                                    });
                                                } else {
                                                    this.addHistoryParam = true;
                                                    newRows
                                                        .filter(
                                                            (it) =>
                                                                it.total === '' ||
                                                                it.total === null ||
                                                                it.total === '0' ||
                                                                it.total === 0
                                                        )
                                                        .forEach((items) => {
                                                            items.errTotal = true;
                                                        });
                                                }
                                            } else if (val[1] === 2) {
                                                this.addHistoryParam = false;
                                                if (val[0]) {
                                                    if (val[0].newRow) {
                                                        history.transes = history.transes.filter(
                                                            (it) => it.transId !== it.transId
                                                        );
                                                    } else {
                                                        val = val[0];
                                                        this.sharedService
                                                            .deleteBudgetTrans({
                                                                uuid: val.transId
                                                            })
                                                            .subscribe(
                                                                () => {
                                                                    this.numLengOrgHistory = true;
                                                                    history.transes = history.transes.filter(
                                                                        (it) => it.transId !== val.transId
                                                                    );
                                                                    history.transesTotal = history.transes.reduce(
                                                                        (a, b) => a + b.total,
                                                                        0
                                                                    );
                                                                    history.monthsTotal.forEach((it) => {
                                                                        const monthDiff = this.userService.appData
                                                                            .moment(it.date)
                                                                            .isSame(
                                                                                this.userService.appData.moment(
                                                                                    val.transDate
                                                                                ),
                                                                                'month'
                                                                            );
                                                                        if (monthDiff) {
                                                                            it.monthTotal =
                                                                                it.monthTotal - Number(val.total);
                                                                        }
                                                                    });
                                                                    history.currentMonth.forEach((it) => {
                                                                        if (
                                                                            this.userService.appData
                                                                                .moment()
                                                                                .isSame(val.transDate, 'month')
                                                                        ) {
                                                                            const monthDiff =
                                                                                this.userService.appData
                                                                                    .moment(val.transDate)
                                                                                    .format('D') ===
                                                                                it.transDay.toString();
                                                                            if (monthDiff) {
                                                                                it.dayTotal =
                                                                                    it.dayTotal - Number(val.total);
                                                                            }
                                                                        }
                                                                    });
                                                                    if (
                                                                        this.userService.appData
                                                                            .moment()
                                                                            .isSame(
                                                                                this.userService.appData.moment(
                                                                                    val.transDate
                                                                                ),
                                                                                'month'
                                                                            )
                                                                    ) {
                                                                        this.budgetHistoryPrompt.transCalc -=
                                                                            Number(val.total);
                                                                    }
                                                                    const idxSlices =
                                                                        history.monthsTotal.findIndex((v) => {
                                                                            return (
                                                                                this.userService.appData
                                                                                    .moment(v.date)
                                                                                    .isBefore(
                                                                                        this.userService.appData.moment(),
                                                                                        'month'
                                                                                    ) && v.monthTotal !== 0
                                                                            );
                                                                        });
                                                                    const arrOldMonths =
                                                                        history.monthsTotal.slice(
                                                                            idxSlices,
                                                                            history.monthsTotal.length - 1
                                                                        );
                                                                    if (arrOldMonths.length) {
                                                                        const averageTotal = arrOldMonths.reduce(
                                                                            (a, b) => a + b.monthTotal,
                                                                            0
                                                                        );
                                                                        history.average = (
                                                                            averageTotal / arrOldMonths.length
                                                                        ).toFixed(1);
                                                                    }

                                                                    history.chartData =
                                                                        this.budgetHistoryPrompt.createChart(
                                                                            history
                                                                        );
                                                                    this.calculateLeft();
                                                                },
                                                                (err: HttpErrorResponse) => {
                                                                }
                                                            );
                                                    }
                                                } else {
                                                    history.transes = history.transes.filter(
                                                        (it) => !it.newRow
                                                    );
                                                }
                                            } else if (val[1] === 3) {
                                                val = val[0];
                                                this.numLengOrgHistory = true;
                                                history.monthsTotal.forEach((it1) => {
                                                    const monthDiff = this.userService.appData
                                                        .moment(it1.date)
                                                        .isSame(
                                                            this.userService.appData.moment(val.transDate),
                                                            'month'
                                                        );
                                                    if (monthDiff) {
                                                        it1.monthTotal = it1.monthTotal + val.totalDef;
                                                    }
                                                    if (val.totalMinusDate) {
                                                        if (
                                                            this.userService.appData
                                                                .moment(it1.date)
                                                                .isSame(Number(val.totalMinusDate), 'month')
                                                        ) {
                                                            it1.monthTotal = it1.monthTotal - val.total;
                                                        }
                                                    }
                                                });

                                                history.currentMonth.forEach((it1) => {
                                                    if (typeof val.totalDefDaily === 'number') {
                                                        if (
                                                            this.userService.appData
                                                                .moment()
                                                                .isSame(val.transDate, 'month')
                                                        ) {
                                                            const monthDiff =
                                                                this.userService.appData
                                                                    .moment(val.transDate)
                                                                    .format('D') === it1.transDay.toString();
                                                            if (monthDiff) {
                                                                it1.dayTotal = it1.dayTotal + val.totalDefDaily;
                                                            }
                                                        }
                                                    } else {
                                                        if (
                                                            this.userService.appData
                                                                .moment()
                                                                .isSame(val.transDate, 'month')
                                                        ) {
                                                            if (
                                                                this.userService.appData
                                                                    .moment(val.transDate)
                                                                    .format('D') === it1.transDay.toString()
                                                            ) {
                                                                it1.dayTotal = it1.dayTotal + val.total;
                                                            }
                                                        }

                                                        if (
                                                            this.userService.appData
                                                                .moment()
                                                                .isSame(Number(val.totalDefDaily), 'month')
                                                        ) {
                                                            if (
                                                                this.userService.appData
                                                                    .moment(Number(val.totalDefDaily))
                                                                    .format('D') === it1.transDay.toString()
                                                            ) {
                                                                it1.dayTotal = it1.dayTotal - val.total;
                                                            }
                                                        }
                                                    }
                                                });
                                                history.transesTotal = history.transes.reduce(
                                                    (a, b) => a + b.total,
                                                    0
                                                );
                                                const idxSlices = history.monthsTotal.findIndex((v) => {
                                                    return (
                                                        this.userService.appData
                                                            .moment(v.date)
                                                            .isBefore(
                                                                this.userService.appData.moment(),
                                                                'month'
                                                            ) && v.monthTotal !== 0
                                                    );
                                                });
                                                const arrOldMonths = history.monthsTotal.slice(
                                                    idxSlices,
                                                    history.monthsTotal.length - 1
                                                );
                                                if (arrOldMonths.length) {
                                                    const averageTotal = arrOldMonths.reduce(
                                                        (a, b) => a + b.monthTotal,
                                                        0
                                                    );
                                                    history.average = (
                                                        averageTotal / arrOldMonths.length
                                                    ).toFixed(1);
                                                }
                                                history.chartData =
                                                    this.budgetHistoryPrompt.createChart(history);
                                                this.calculateLeft();
                                            }
                                        }
                                    } else {
                                        val = val[0];
                                        const monthDefThisMonth = this.userService.appData
                                            .moment()
                                            .isSame(
                                                this.userService.appData.moment(val.transDate),
                                                'month'
                                            );
                                        if (monthDefThisMonth) {
                                            this.budgetHistoryPrompt.transCalc -= Number(val.total);
                                        }
                                        this.numLengOrgHistory = true;
                                        history.transes = history.transes.filter(
                                            (it) => it.transId !== val.transId
                                        );
                                        history.transesTotal = history.transes.reduce(
                                            (a, b) => a + b.total,
                                            0
                                        );
                                        history.monthsTotal.forEach((it) => {
                                            const monthDiff = this.userService.appData
                                                .moment(it.date)
                                                .isSame(
                                                    this.userService.appData.moment(val.transDate),
                                                    'month'
                                                );
                                            if (monthDiff) {
                                                it.monthTotal = it.monthTotal - Number(val.total);
                                            }
                                        });
                                        history.currentMonth.forEach((it) => {
                                            if (
                                                this.userService.appData
                                                    .moment()
                                                    .isSame(val.transDate, 'month')
                                            ) {
                                                const monthDiff =
                                                    this.userService.appData
                                                        .moment(val.transDate)
                                                        .format('D') === it.transDay.toString();
                                                if (monthDiff) {
                                                    it.dayTotal = it.dayTotal - Number(val.total);
                                                }
                                            }
                                        });
                                        const idxSlices = history.monthsTotal.findIndex((v) => {
                                            return (
                                                this.userService.appData
                                                    .moment(v.date)
                                                    .isBefore(
                                                        this.userService.appData.moment(),
                                                        'month'
                                                    ) && v.monthTotal !== 0
                                            );
                                        });
                                        const arrOldMonths = history.monthsTotal.slice(
                                            idxSlices,
                                            history.monthsTotal.length - 1
                                        );
                                        if (arrOldMonths.length) {
                                            const averageTotal = arrOldMonths.reduce(
                                                (a, b) => a + b.monthTotal,
                                                0
                                            );
                                            history.average = (
                                                averageTotal / arrOldMonths.length
                                            ).toFixed(1);
                                        }
                                        history.chartData =
                                            this.budgetHistoryPrompt.createChart(history);
                                        this.calculateLeft();
                                    }
                                }
                                return history;
                            });

                            history.chartData = this.budgetHistoryPrompt.createChart(history);
                            this.budgetHistoryPrompt.reload = false;
                            return history;
                        }),
                        distinctUntilChanged(),
                        publishRef
                    )
            ),
            changeChart: (activeTab: number) => {
                this.budgetHistoryPrompt.activeTab = activeTab;
                this.showValuesControl.setValue(this.showValuesControl.value);
            },
            hide: () => {
                if (this.dataHistoryLoaded$) {
                    this.dataHistoryLoaded$.next(true);
                    this.dataHistoryLoaded$.unsubscribe();
                    this.dataHistoryLoaded$ = new Subject();
                }
                this.addHistoryParam = false;

                if (this.numLengOrgHistory) {
                    this.getBudgetsDetails().budgetsDetails = null;
                    this.budgetActive(this.getBudgetsDetails(), false);
                }

                this.budgetHistoryPrompt.budgetHistoryRow = null;
                this.budgetHistoryPrompt.visible = false;
            },
            show: (detailsRow: any, idx?: any) => {
                this.budgetHistoryPrompt.reload = false;
                if (this.getBudgetsDetails().frequencyDesc === 'YEAR') {
                    this.budgetHistoryPrompt.activeTab = 1;
                } else {
                    this.budgetHistoryPrompt.activeTab = 2;
                }
                // this.budgetHistoryPrompt.activeTab = this.navParams && this.navParams.preset === 'openKeyMonthHistory' ? 2 : 1;
                this.budgetHistoryPrompt.transCalc = 0;
                this.budgetHistoryPrompt.budgetHistoryRow = detailsRow;
                if (idx !== undefined) {
                    this.budgetHistoryPrompt.budgetHistoryRowSave =
                        this.getBudgetsDetails().budgetsDetailsSave.details[idx];
                } else {
                    this.budgetHistoryPrompt.budgetHistoryRowSave =
                        this.getBudgetsDetails().budgetsDetailsSave.details.find(
                            (it) => it.keyId === detailsRow.keyId
                        );
                }
                this.calculateLeft();
                this.navParams = null;
                this.budgetHistoryPrompt.visible = true;
            },
            printContent: (contentRoot: HTMLElement) => {
                BrowserService.printHtml(
                    contentRoot,
                    'היסטוריית  ' + this.budgetHistoryPrompt.budgetHistoryRow.keyName
                );
            }
        };
        this.navParams = null;
        this.actionNavigateToBudgetSub =
            this.actionService.navigateToBudget$.subscribe((navParams) => {
                if (navParams) {
                    this.navParams = navParams;
                    this.storageService.localStorageSetter(
                        'budgetId',
                        this.navParams.budgetId
                    );

                    if (this.router.url.includes('budget')) {
                        if (
                            this.storageService.localStorageGetterItem('budgetId') &&
                            this.dataBudgets.find(
                                (it) =>
                                    it.budgetId ===
                                    this.storageService.localStorageGetterItem('budgetId')
                            )
                        ) {
                            if (this.navParams && this.navParams.preset === 'updateBudget') {
                                this.budgetActive(
                                    this.dataBudgets.find(
                                        (it) =>
                                            it.budgetId ===
                                            this.storageService.localStorageGetterItem('budgetId')
                                    ),
                                    true,
                                    true,
                                    true
                                );
                            } else {
                                this.budgetActive(
                                    this.dataBudgets.find(
                                        (it) =>
                                            it.budgetId ===
                                            this.storageService.localStorageGetterItem('budgetId')
                                    ),
                                    true
                                );
                            }
                        }
                    }
                }
            });
    }

    virtualScrollSaved: any = null;

    onScroll(scrollbarRef: any) {
        this.virtualScrollSaved = scrollbarRef;
    }

    calculateLeft(): void {
        // if (this.budgetHistoryPrompt.budgetHistoryRow.total !== 0) {
        //     if ((((this.budgetHistoryPrompt.budgetHistoryRow.total - this.budgetHistoryPrompt.budgetHistoryRow.totalKeyUse) < 0)
        //         || (this.budgetHistoryPrompt.budgetHistoryRow.totalKeyUse > this.budgetHistoryPrompt.budgetHistoryRow.total))) {
        //         this.budgetHistoryPrompt.budgetHistoryRow.left = 0;
        //     } else {
        //         // this.budgetHistoryPrompt.budgetHistoryRow.left =
        //         //     (this.budgetHistoryPrompt.budgetHistoryRow.total - this.budgetHistoryPrompt.budgetHistoryRow.totalKeyUse)
        //         //     / Number(this.userService.appData.moment().endOf('month').diff(this.userService.appData.moment(), 'days'));
        //         this.budgetHistoryPrompt.budgetHistoryRow['left'] = this.getLeftDaysInMonth === 0
        //             ? (((this.budgetHistoryPrompt.budgetHistoryRowSave.total - this.budgetHistoryPrompt.budgetHistoryRowSave.totalKeyUse - this.budgetHistoryPrompt.transCalc) < 0) ? 0 : this.formatWithoutPointsSum(this.budgetHistoryPrompt.budgetHistoryRowSave.total - this.budgetHistoryPrompt.budgetHistoryRowSave.totalKeyUse - this.budgetHistoryPrompt.transCalc))
        //             : ((this.budgetHistoryPrompt.budgetHistoryRow.total - this.budgetHistoryPrompt.budgetHistoryRow.totalKeyUse - this.budgetHistoryPrompt.transCalc) / this.getLeftDaysInMonth);
        //     }
        // } else {
        //     this.budgetHistoryPrompt.budgetHistoryRow.left = 0;
        // }
        //

        const left =
            this.budgetHistoryPrompt.budgetHistoryRowSave.total -
            (this.budgetHistoryPrompt.budgetHistoryRowSave.totalKeyUse +
                this.budgetHistoryPrompt.transCalc);
        if (
            left < 0 ||
            this.budgetHistoryPrompt.budgetHistoryRowSave.totalKeyUse +
            this.budgetHistoryPrompt.transCalc <
            0
        ) {
            this.budgetHistoryPrompt.budgetHistoryRow.left = 0;
        } else {
            this.budgetHistoryPrompt.budgetHistoryRow.left =
                this.getLeftDaysInMonth === 0
                    ? left
                    : Math.round(left / this.getLeftDaysInMonth);
        }
    }

    formatWithoutPointsSum(sum) {
        return formatWithoutPoints(sum);
    }

    ngOnInit(): void {
        this.companyTransTypes$ =
            this.transTypesService.selectedCompanyTransTypes.pipe(
                takeUntil(this.destroyed$)
            );

        this.subscription = this.sharedComponent.getDataEvent
            .pipe(
                startWith(true),
                filter(
                    () =>
                        this.userService.appData &&
                        this.userService.appData.userData &&
                        this.userService.appData.userData.companySelect
                ),
                withLatestFrom(this.companyTransTypes$),
                takeUntil(this.destroyed$)
            )
            .subscribe(([res, rslt]) => {
                this.onCompanyTransTypesArrive(rslt);
                this.accountsNotUpdates =
                    this.userService.appData.userData.accounts.filter((it, idx) => {
                        if (
                            !compareDates(new Date(), new Date(it.balanceLastUpdatedDate))
                        ) {
                            it.accountsNotUpdatesDays = getDaysBetweenDates(
                                new Date(
                                    this.userService.appData.userData.accounts[0].balanceLastUpdatedDate
                                ),
                                new Date()
                            );
                            return it;
                        }
                    });
                // this.accountsNotUpdatesOldestTransDate = JSON.parse(JSON.stringify(this.accountsNotUpdates));
                // if (this.accountsNotUpdatesOldestTransDate.length) {
                //     this.accountsNotUpdatesOldestTransDate.sort(function (a, b) {
                //         return a.oldestTransDate - b.oldestTransDate;
                //     });
                // }
                this.getBudget();
            });

        if (this.translate.currentLang !== 'ENG') {
            this.langCalendar =
                this.translate.translations[this.translate.currentLang].langCalendar;
        }
    }

    trackById(index: number, val: any): number {
        return val.transId;
    }

    onScrollCubes(): void {
        this.tooltipNavRef.hide();
        this.tooltipAccRef['_results'].forEach((it) => {
            it.hide();
        });
    }

    printBudget(contentRoot: HTMLElement): void {
        BrowserService.printHtml(contentRoot, '');
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

    round(num: number): number {
        return Math.round(num);
    }

    getNumber(num: any): number {
        return Number(num);
    }

    parseIntNum(num: string): number {
        return parseInt(num, 10);
    }

    openNav(event, budget: any, overlaypanel: OverlayPanel) {
        this.budgetNav = budget;
        overlaypanel.toggle(event);
        event.stopPropagation();
    }

    private onCompanyTransTypesArrive(rslt: any[]) {
        this.companyTransTypes = rslt;
        this.defaultTransType = this.companyTransTypes
            ? this.companyTransTypes.find((tt) => {
                return tt.transTypeId === this.DEFAULT_TRANSTYPE_ID;
            })
            : null;
    }

    getBudget(isPriv?: boolean): void {
        this.dataBudgets = [];
        this.privScreenEmpty = false;
        this.sharedService
            .getBudget(
                Object.assign(
                    {
                        companyId: this.userService.appData.userData.companySelect.companyId
                    },
                    isPriv ? {createDefault: true} : {}
                )
            )
            .subscribe((response: any) => {
                this.loaderPrivScreen = false;
                this.dataBudgets = response ? response['body'] : response;
                if (this.dataBudgets.length === 0) {
                    this.privScreenEmpty = true;
                } else {
                    if (this.dataBudgets.length && this.dataBudgets[0].budgetId) {
                        let budgetIdToActive = false;
                        this.dataBudgets.forEach((budget) => {
                            if (
                                this.dataBudgetsIds.length &&
                                this.dataBudgetsIds.every((id) => id !== budget.budgetId)
                            ) {
                                budgetIdToActive = budget.budgetId;
                            }
                            budget.dates = {
                                dateFrom: budget.dateFrom,
                                dateTill: budget.dateTill
                            };
                            budget.indDefaultVar = budget.indDefault;
                            budget.currency = this.currencySymbolPipe.transform(
                                this.getInfoAcc(budget.budgetAccounts[0], 'currency')
                            );
                            const accountsOldestTransDate = budget.budgetAccounts
                                .map((accId) =>
                                    this.userService.appData.userData.accounts.find(
                                        (acc: any) => acc.companyAccountId === accId
                                    )
                                )
                                .filter((acc: any) => !!acc)
                                .reduce((acmltr, acc) => {
                                    return Number.isFinite(acc.oldestTransDate) &&
                                    (acmltr === null || acc.oldestTransDate < acmltr)
                                        ? acc.oldestTransDate
                                        : acmltr;
                                }, null);
                            budget.dates.backLimit = this.userService.appData.moment
                                .max(
                                    budget.frequencyDesc === 'MONTH'
                                        ? this.userService.appData
                                            .moment(budget.dates.dateFrom)
                                            .subtract(11, 'months')
                                        : this.userService.appData
                                            .moment(budget.dates.dateFrom)
                                            .subtract(3, 'years'),
                                    this.userService.appData.moment(accountsOldestTransDate)
                                )
                                .startOf(budget.frequencyDesc === 'MONTH' ? 'month' : 'year');
                            // it.accountsNotUpdatesDays = getDaysBetweenDates(
                            //     new Date(this.userService.appData.userData.accounts[0].balanceLastUpdatedDate),
                            //     new Date());
                        });

                        if (this.dataBudgetsIds.length && budgetIdToActive) {
                            this.dataBudgetsIds = [];
                            this.budgetActive(
                                this.dataBudgets.find((it) => it.budgetId === budgetIdToActive),
                                true,
                                this.navParams && this.navParams.preset === 'updateBudget',
                                this.navParams && this.navParams.preset === 'updateBudget'
                            );
                        } else if (
                            this.storageService.localStorageGetterItem('budgetId') &&
                            this.dataBudgets.find(
                                (it) =>
                                    it.budgetId ===
                                    this.storageService.localStorageGetterItem('budgetId')
                            )
                        ) {
                            this.budgetActive(
                                this.dataBudgets.find(
                                    (it) =>
                                        it.budgetId ===
                                        this.storageService.localStorageGetterItem('budgetId')
                                ),
                                true,
                                this.navParams && this.navParams.preset === 'updateBudget',
                                this.navParams && this.navParams.preset === 'updateBudget'
                            );
                        } else {
                            this.budgetActive(this.dataBudgets[0], true);
                        }
                    } else if (this.dataBudgets.length && this.dataBudgets[0].privs) {
                        this.loaderPrivScreen = true;
                        this.getBudget(true);
                    }
                }
            });
    }

    get getLeftDaysInMonth(): any {
        return (
            Number(this.userService.appData.moment().daysInMonth()) -
            new Date().getDate()
        );
    }

    budgetActive(
        budget: any,
        isActive?: boolean,
        isOpenPopupCreate?: boolean,
        isOpenPopupEdit?: boolean
    ): void {
        budget.canGoBack = this.userService.appData.moment.isMoment(
            budget.dates.backLimit
        )
            ? budget.dates.backLimit.diff(
            budget.dateFrom,
            budget.frequencyDesc === 'MONTH' ? 'months' : 'years'
        ) < 0
            : budget.dates.backLimit
                ? this.userService.appData
                .moment(budget.dates.backLimit)
                .diff(
                    budget.dateFrom,
                    budget.frequencyDesc === 'MONTH' ? 'months' : 'years'
                ) < 0
                : false;
        budget.canGoForward = budget.dateTill < budget.dates.dateTill;

        if (budget.budgetTotalType !== 'both') {
            this.budgetOrderType = [
                {
                    label: 'צבירה ₪',
                    value: 'USER_TOTAL'
                },
                {
                    label: 'צבירה %',
                    value: 'USED_PRC'
                },
                {
                    label: 'א׳ ב׳',
                    value: 'CATEGORY'
                }
            ];
        } else {
            this.budgetOrderType = [
                {
                    label: 'צבירה ₪',
                    value: 'USER_TOTAL'
                },
                {
                    label: 'צבירה %',
                    value: 'USED_PRC'
                },
                {
                    label: 'א׳ ב׳',
                    value: 'CATEGORY'
                },
                {
                    label: 'הוצאה',
                    value: 'OUTCOME'
                },
                {
                    label: 'הכנסה',
                    value: 'INCOME'
                }
            ];
        }

        if (isActive) {
            this.budgetIdActive = budget.budgetId;
            this.storageService.localStorageSetter('budgetId', budget.budgetId);
            this.dataBudgets.forEach((bud) => {
                if (budget.budgetId === bud.budgetId) {
                    budget.showPanelDD = true;
                }
            });
        }

        if (
            ((!isActive && budget.showPanelDD) || isActive || isOpenPopupCreate) &&
            !budget.budgetsDetails
        ) {
            this.sharedService
                .getBudgetDetails({
                    budgetType: budget.budgetType,
                    budgetId: budget.budgetId,
                    budgetAccounts: budget.budgetAccounts,
                    creditCardCalcTypeDesc: budget.creditCardCalcTypeDesc,
                    dateFrom: budget.dateFrom,
                    dateTill: budget.dateTill,
                    companyId: this.userService.appData.userData.companySelect.companyId
                })
                .subscribe((response: any) => {
                    budget.budgetsDetails = response ? response['body'] : response;
                    budget.budgetsDetailsSrc = JSON.parse(
                        JSON.stringify(budget.budgetsDetails)
                    );
                    if (budget.dates.dateFrom === budget.dateFrom) {
                        budget.budgetsDetailsSave = JSON.parse(
                            JSON.stringify(budget.budgetsDetails)
                        );
                    }
                    budget.budgetsDetails.budgetOrderTypeDesc = budget.budgetsDetails
                        .budgetOrderTypeDesc
                        ? budget.budgetsDetails.budgetOrderTypeDesc.toUpperCase()
                        : 'USER_TOTAL';
                    this.sortDown = false;

                    if (!isOpenPopupCreate) {
                        if (this.budgetIdActive === budget.budgetId) {
                            this.totals = budget.budgetsDetails.details.reduce(
                                (a, it) => {
                                    if (it.deleted) {
                                        return [a[0], a[1]];
                                    } else {
                                        if (it.expence) {
                                            return [it.total + a[0], a[1]];
                                        } else {
                                            return [a[0], it.total + a[1]];
                                        }
                                    }
                                },
                                [0, 0]
                            );
                        }
                        if (
                            this.navParams &&
                            (this.navParams.preset === 'showKeyInBudget' ||
                                this.navParams.preset === 'openKeyHistory' ||
                                this.navParams.preset === 'openKeyMonthHistory')
                        ) {
                            setTimeout(() => {
                                const idxToScroll = budget.budgetsDetails.details.findIndex(
                                    (it) => it.budgetDetailsId === this.navParams.keyId
                                );
                                const evntInputHandle =
                                    this.budgetCategoryRowsRef.toArray()[idxToScroll];
                                if (evntInputHandle) {
                                    requestAnimationFrame(() => {
                                        evntInputHandle.nativeElement.scrollIntoView({
                                            block: 'center'
                                        });
                                    });
                                    if (
                                        this.navParams.preset === 'openKeyHistory' ||
                                        this.navParams.preset === 'openKeyMonthHistory'
                                    ) {
                                        this.budgetHistoryPrompt.show(
                                            budget.budgetsDetails.details[idxToScroll],
                                            idxToScroll
                                        );
                                    } else {
                                        this.navParams = null;
                                    }
                                }
                            }, 500);
                        }
                        if (this.navParams && this.navParams.preset === 'budgetScreen') {
                            setTimeout(() => {
                                const idxToScroll = this.dataBudgets.findIndex(
                                    (it) => it.budgetId === this.navParams.budgetId
                                );
                                const evntInputHandle =
                                    this.budgetCubesRef.toArray()[idxToScroll];
                                if (evntInputHandle) {
                                    requestAnimationFrame(() => {
                                        evntInputHandle.nativeElement.scrollIntoView({
                                            block: 'center'
                                        });
                                    });
                                    this.navParams = null;
                                }
                            }, 500);
                        }
                    } else {
                        if (this.navParams && this.navParams.preset === 'updateBudget') {
                            this.totals = budget.budgetsDetails.details.reduce(
                                (a, it) => {
                                    if (it.deleted) {
                                        return [a[0], a[1]];
                                    } else {
                                        if (it.expence) {
                                            return [it.total + a[0], a[1]];
                                        } else {
                                            return [a[0], it.total + a[1]];
                                        }
                                    }
                                },
                                [0, 0]
                            );
                            this.navParams = null;
                            setTimeout(() => this.budgetCreate(budget, isOpenPopupEdit), 0);
                        } else {
                            this.budgetCreate(budget, isOpenPopupEdit);
                        }
                    }
                });
        } else if (budget.budgetsDetails && isOpenPopupCreate) {
            if (this.navParams && this.navParams.preset === 'updateBudget') {
                this.totals = budget.budgetsDetails.details.reduce(
                    (a, it) => {
                        if (it.deleted) {
                            return [a[0], a[1]];
                        } else {
                            if (it.expence) {
                                return [it.total + a[0], a[1]];
                            } else {
                                return [a[0], it.total + a[1]];
                            }
                        }
                    },
                    [0, 0]
                );
                this.navParams = null;
                setTimeout(() => this.budgetCreate(budget, isOpenPopupEdit), 0);
            } else {
                this.budgetCreate(budget, isOpenPopupEdit);
            }
        } else {
            if (this.budgetIdActive === budget.budgetId) {
                this.totals = budget.budgetsDetails.details.reduce(
                    (a, it) => {
                        if (it.deleted) {
                            return [a[0], a[1]];
                        } else {
                            if (it.expence) {
                                return [it.total + a[0], a[1]];
                            } else {
                                return [a[0], it.total + a[1]];
                            }
                        }
                    },
                    [0, 0]
                );
            }
            if (
                this.navParams &&
                (this.navParams.preset === 'showKeyInBudget' ||
                    this.navParams.preset === 'openKeyHistory' ||
                    this.navParams.preset === 'openKeyMonthHistory')
            ) {
                setTimeout(() => {
                    const idxToScroll = budget.budgetsDetails.details.findIndex(
                        (it) => it.budgetDetailsId === this.navParams.keyId
                    );
                    const evntInputHandle =
                        this.budgetCategoryRowsRef.toArray()[idxToScroll];
                    // const evntInputHandle = this.inputBoxTotalRef['_results'][idxToScroll];
                    if (evntInputHandle) {
                        requestAnimationFrame(() =>
                            evntInputHandle.nativeElement.scrollIntoView({block: 'center'})
                        );
                        // evntInputHandle.nativeElement.scrollIntoView({behavior: 'smooth'});
                        if (
                            this.navParams.preset === 'openKeyHistory' ||
                            this.navParams.preset === 'openKeyMonthHistory'
                        ) {
                            this.budgetHistoryPrompt.show(
                                budget.budgetsDetails.details[idxToScroll],
                                idxToScroll
                            );
                        } else {
                            this.navParams = null;
                        }
                    }
                }, 500);
            }
            if (this.navParams && this.navParams.preset === 'budgetScreen') {
                setTimeout(() => {
                    const idxToScroll = this.dataBudgets.findIndex(
                        (it) => it.budgetId === this.navParams.budgetId
                    );
                    const evntInputHandle = this.budgetCubesRef.toArray()[idxToScroll];
                    if (evntInputHandle) {
                        requestAnimationFrame(() =>
                            evntInputHandle.nativeElement.scrollIntoView({block: 'center'})
                        );
                        this.navParams = null;
                    }
                }, 500);
            }
        }
    }

    isShowBudgetsDetails(): boolean {
        if (
            this.dataBudgets &&
            this.dataBudgets.length &&
            this.dataBudgets.filter((it) => it.budgetId === this.budgetIdActive)
                .length &&
            this.dataBudgets.filter((it) => it.budgetId === this.budgetIdActive)[0]
                .budgetsDetails
        ) {
            return true;
        } else {
            return false;
        }
    }

    getBudgetsDetails(): any {
        return this.dataBudgets.find((it) => it.budgetId === this.budgetIdActive);
    }

    getPageHeightFunc(value: any) {
        return getPageHeight(value)
    }

    changeSort(): void {
        this.sortDown = !this.sortDown;
        // asc === bigger
        // desc === smaller
        const budget = this.getBudgetsDetails();
        if (this.sortDown) {
            if (budget.budgetsDetails.budgetOrderTypeDesc === 'USER_TOTAL') {
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'keyName',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'totalKeyUse',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'expence',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'favorite',
                    'smaller'
                );
            } else if (budget.budgetsDetails.budgetOrderTypeDesc === 'USED_PRC') {
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'keyName',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'usedPrc',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'expence',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'favorite',
                    'smaller'
                );
            } else if (budget.budgetsDetails.budgetOrderTypeDesc === 'CATEGORY') {
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'keyName',
                    'smaller'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'expence',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'favorite',
                    'smaller'
                );
            } else if (budget.budgetsDetails.budgetOrderTypeDesc === 'OUTCOME') {
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'keyName',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'totalKeyUse',
                    'smaller'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'expence',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'favorite',
                    'smaller'
                );
            } else if (budget.budgetsDetails.budgetOrderTypeDesc === 'INCOME') {
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'keyName',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'totalKeyUse',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'expence',
                    'bigger'
                );
                budget.budgetsDetails.details = this.sortPipe.transform(
                    budget.budgetsDetails.details,
                    'favorite',
                    'smaller'
                );
            }
        } else {
            budget.budgetsDetails.details = JSON.parse(
                JSON.stringify(budget.budgetsDetailsSrc.details)
            );
        }
    }

    submitChangesOPERATIONTYPE($event: any): void {
        if ($event.originalEvent) {
            $event.originalEvent.preventDefault();
            $event.originalEvent.stopImmediatePropagation();
        } else {
            $event.preventDefault();
            $event.stopImmediatePropagation();
        }

        console.log($event.value);
        this.sortDown = false;

        const budget = this.getBudgetsDetails();
        budget.budgetsDetails.budgetOrderTypeDesc = $event.value;
        budget.budgetsDetails.details = [];

        this.sharedService
            .getBudgetDetails({
                budgetType: budget.budgetType,
                budgetId: budget.budgetId,
                budgetAccounts: budget.budgetAccounts,
                creditCardCalcTypeDesc: budget.creditCardCalcTypeDesc,
                dateFrom: budget.dateFrom,
                dateTill: budget.dateTill,
                companyId: this.userService.appData.userData.companySelect.companyId,
                budgetOrderTypeDesc: budget.budgetsDetails.budgetOrderTypeDesc
            })
            .subscribe((response: any) => {
                budget.budgetsDetails = response ? response['body'] : response;
                budget.budgetsDetailsSrc = JSON.parse(
                    JSON.stringify(budget.budgetsDetails)
                );
                if (this.budgetIdActive === budget.budgetId) {
                    this.totals = budget.budgetsDetails.details.reduce(
                        (a, it) => {
                            if (it.deleted) {
                                return [a[0], a[1]];
                            } else {
                                if (it.expence) {
                                    return [it.total + a[0], a[1]];
                                } else {
                                    return [a[0], it.total + a[1]];
                                }
                            }
                        },
                        [0, 0]
                    );
                }
            });
    }

    removeKey(item: any, idx: number): any {
        this.sharedService
            .removeKey({
                budgetId: this.getBudgetsDetails().budgetId,
                keyId: item.keyId,
                expence: item.expence
            })
            .subscribe((response: any) => {
                this.getBudgetsDetails().budgetsDetails.details.splice(idx, 1);
            });
    }

    public statesRows(state: string, item: any, group?: any, idx?: number): void {
        // console.log('----> statesRows :  %o, %o', state, this.selectedTransaction);
        if (state === 'focus') {
            group.forEach((trns) => {
                if (trns.keyId === item.keyId && trns.expence === item.expence) {
                    this.selectedTransaction = item;
                    this.isEdit(item, true);
                } else {
                    this.isEdit(trns, false);
                }
            });

            setTimeout(() => {
                const evntInputHandle = // this.inputBoxTotalRef['_results'][idx];
                    this.inputBoxTotalRef.find(
                        (el) =>
                            el.nativeElement instanceof HTMLInputElement &&
                            (el.nativeElement as HTMLInputElement).id ===
                            item.keyId + item.expence
                    );
                if (evntInputHandle) {
                    requestAnimationFrame(() => {
                        evntInputHandle.nativeElement.focus({preventScroll: true});
                    });
                }
            }, 20);
        }
        if (state === 'hover') {
            group.forEach((trns) => {
                if (trns.keyId === item.keyId && trns.expence === item.expence) {
                    this.isEdit(trns, true);
                } else {
                    if (
                        !this.selectedTransaction ||
                        this.selectedTransaction.keyId !== trns.keyId ||
                        this.selectedTransaction.expence !== trns.expence
                    ) {
                        this.isEdit(trns, false);
                    }
                }
            });
        }
        if (state === 'leave') {
            group.forEach((trns) => {
                if (
                    !this.selectedTransaction ||
                    this.selectedTransaction.keyId !== trns.keyId ||
                    this.selectedTransaction.expence !== trns.expence
                ) {
                    this.isEdit(trns, false);
                }
            });
        }
    }

    get selectedTransaction(): any {
        return this._selectedTransaction;
    }

    set selectedTransaction(val: any) {
        this._selectedTransaction = val;
        if (this.editingTransaction !== null && this.editingTransaction !== val) {
            this.submitChangesInner();
            // this.submitChanges(null);
        }
    }

    public isEdit(item: any, isEdit: boolean): void {
        if (isEdit) {
            item.totalEdit = true;
        } else {
            item.totalEdit = isEdit;
        }
    }

    private clearActiveTableRow() {
        this._editingTransaction = null;
        this.editingTransaction = null;
        this.selectedTransaction = null;
    }

    private hasChanges(): boolean {
        // console.log('Checking if changed...');

        if (
            !this.editingTransactionOld ||
            !this.editingTransaction ||
            this.editingTransaction.keyId !== this.editingTransactionOld.keyId ||
            this.editingTransaction.expence !== this.editingTransactionOld.expence
        ) {
            return false;
        }
        let isChange = false;
        // console.log('Checking if changed... 1');

        if (
            this.editingTransaction.total === '' ||
            this.editingTransaction.total === undefined ||
            this.editingTransaction.total === null
        ) {
            this.editingTransaction.total = this.editingTransactionOld.total;
        }
        if (
            this.editingTransaction.alertPrc === '' ||
            this.editingTransaction.alertPrc === undefined ||
            this.editingTransaction.alertPrc === null
        ) {
            this.editingTransaction.alertPrc = this.editingTransactionOld.alertPrc;
        }
        if (
            this.editingTransaction.total !== this.editingTransactionOld.total ||
            this.editingTransaction.alertPrc !== this.editingTransactionOld.alertPrc
        ) {
            isChange = true;
        }
        return isChange;
    }

    public changeDatesFrequencyDesc(type: string): void {
        const dateFrom = this.popupBudgetCreate.data
            .get('dateFrom')
            .value.getTime();
        const dateTill = this.popupBudgetCreate.data
            .get('dateTill')
            .value.getTime();
        if (type === 'dateFrom') {
            if (dateFrom > dateTill) {
                this.popupBudgetCreate.data
                    .get('dateTill')
                    .setValue(this.popupBudgetCreate.data.get('dateFrom').value);
            }
        } else if (type === 'dateTill') {
            if (dateFrom > dateTill) {
                this.popupBudgetCreate.data
                    .get('dateFrom')
                    .setValue(this.popupBudgetCreate.data.get('dateTill').value);
            }
        }
    }

    public submitChangesTemp(): void {
        this.editingTransaction.total = Number(this.editingTransaction.total);
        this.editingTransaction.alertPrc = Number(this.editingTransaction.alertPrc);
    }

    private submitChangesInner(
        isFavoriteAndAlert?: boolean,
        isAlert?: boolean
    ): void {
        // console.log('submit changes called %o', $event);
        // debugger;
        if (!isFavoriteAndAlert && !this.hasChanges()) {
            return;
        }
        if (!isFavoriteAndAlert || isAlert) {
            if (this.getBudgetsDetails().indDefault === 1) {
                this.getBudgetsDetails().indDefaultVar = 2;
            }
        }
        this.isEdit(this.editingTransaction, false);
        console.log('Submitting changes...');
        const oldValue = Object.assign({}, this.editingTransactionOld);
        const oldRef = this.editingTransaction;
        this.editingTransactionOld = Object.assign({}, this.editingTransaction);
        this.editingTransaction.total = Number(this.editingTransaction.total);
        this.editingTransaction.alertPrc = Number(this.editingTransaction.alertPrc);
        console.log({
            alert: this.editingTransaction.alert,
            alertPrc: Number(this.editingTransaction.alertPrc),
            budgetId: this.getBudgetsDetails().budgetId,
            expence: this.editingTransaction.expence,
            favorite: this.editingTransaction.favorite,
            indDefault: this.getBudgetsDetails().indDefault,
            keyId: this.editingTransaction.keyId,
            total: Number(this.editingTransaction.total)
        });
        this.sharedService
            .updateBudgetDetails({
                alert: this.editingTransaction.alert,
                alertPrc: Number(this.editingTransaction.alertPrc),
                budgetId: this.getBudgetsDetails().budgetId,
                expence: this.editingTransaction.expence,
                favorite: this.editingTransaction.favorite,
                indDefault: this.getBudgetsDetails().indDefault,
                keyId: this.editingTransaction.keyId,
                total: Number(this.editingTransaction.total)
            })
            .subscribe(
                (response: any) => {
                    this.totals = this.getBudgetsDetails().budgetsDetails.details.reduce(
                        (a, it) => {
                            if (it.deleted) {
                                return [a[0], a[1]];
                            } else {
                                if (it.expence) {
                                    return [Number(it.total) + a[0], a[1]];
                                } else {
                                    return [a[0], Number(it.total) + a[1]];
                                }
                            }
                        },
                        [0, 0]
                    );
                    // this.getBudgetsDetails().totalOutcome = this.totals[0];
                    // this.getBudgetsDetails().totalIncome = this.totals[1];
                    if (isAlert && this.editingTransaction.alert) {
                        if (this.editingTransaction.expence) {
                            this.getBudgetsDetails().outcomeAlert = true;
                        } else {
                            this.getBudgetsDetails().incomeAlert = true;
                        }

                        this.clearActiveTableRow();
                    }
                },
                (err: HttpErrorResponse) => {
                    Object.assign(oldRef, oldValue);
                    if (
                        this.editingTransactionOld &&
                        this.editingTransactionOld.transId === oldRef.transId
                    ) {
                        this.editingTransactionOld = Object.assign({}, oldRef);
                    }

                    if (err.error) {
                        console.log('An error occurred: %o', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
    }

    get editingTransaction(): any {
        return this._editingTransaction;
    }

    set editingTransaction(val: any) {
        if (this._editingTransaction != null && this._editingTransaction !== val) {
            this.submitChangesInner();
        }
        if (this._editingTransaction !== val) {
            this.editingTransactionOld = val
                ? Object.assign(Object.create(null), val)
                : null;
        }
        this._editingTransaction = val;
        if (val) {
            this.selectedTransaction = val;
        }
    }

    public startDescriptionEditAt(trns: any, input: HTMLInputElement): void {
        this.editingTransaction = trns;
        if (input instanceof HTMLInputElement) {
            requestAnimationFrame(() => {
                input.selectionStart = input.selectionEnd = 1000;
                input.scrollLeft =
                    getComputedStyle(input).direction === 'rtl' ? 0 : input.scrollWidth;
            });
        }
    }

    public cancelChanges(): void {
        if (this.hasChanges()) {
            Object.assign(this.editingTransaction, this.editingTransactionOld);
        }
        this.editingTransaction = null;
    }

    public submitChanges($event: any, fieldName?: string): void {
        this.submitChangesInner();
    }

    public changeFavoriteAndAlert(trns: any, isAlert?: boolean): void {
        this.editingTransaction = trns;
        this.submitChangesInner(true, isAlert);
    }

    public startDescriptionEditAtMain(trns: any, input: HTMLInputElement): void {
        if (input instanceof HTMLInputElement) {
            requestAnimationFrame(() => {
                input.selectionStart = input.selectionEnd = 1000;
                input.scrollLeft =
                    getComputedStyle(input).direction === 'rtl' ? 0 : input.scrollWidth;
            });
        }
    }

    public submitChangesMain(
        budget: any,
        isAlertChecked?: boolean,
        isExpence?: boolean
    ): void {
        console.log('Submitting main changes...');
        if (!budget.prcIncome) {
            budget.prcIncome = 0;
        } else {
            budget.prcIncome = Number(budget.prcIncome);
        }
        if (!budget.prcOutcome) {
            budget.prcOutcome = 0;
        } else {
            budget.prcOutcome = Number(budget.prcOutcome);
        }
        if (budget.indDefault === 1) {
            budget.indDefaultVar = 2;
        }
        console.log({
            budgetId: budget.budgetId,
            incomeAlert: budget.incomeAlert,
            indDefault: budget.indDefault,
            outcomeAlert: budget.outcomeAlert,
            prcIncome: Number(budget.prcIncome),
            prcOutcome: Number(budget.prcOutcome)
        });
        this.sharedService
            .updateBudgetPrc({
                budgetId: budget.budgetId,
                incomeAlert: budget.incomeAlert,
                indDefault: budget.indDefault,
                outcomeAlert: budget.outcomeAlert,
                prcIncome: Number(budget.prcIncome),
                prcOutcome: Number(budget.prcOutcome)
            })
            .subscribe(
                (response: any) => {
                    if (isAlertChecked) {
                        if (isExpence && !budget.outcomeAlert) {
                            this.getBudgetsDetails().budgetsDetails.details.forEach((it) => {
                                if (it.expence) {
                                    it.alert = false;
                                }
                            });
                        } else if (!isExpence && !budget.incomeAlert) {
                            this.getBudgetsDetails().budgetsDetails.details.forEach((it) => {
                                if (!it.expence) {
                                    it.alert = false;
                                }
                            });
                        }
                    }
                },
                (err: HttpErrorResponse) => {
                    if (err.error) {
                        console.log('An error occurred: %o', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
    }

    onRemoveClick(trns: any): void {
        this.deleteConfirmationPrompt.item = trns;
        this.deleteConfirmationPrompt.message =
            'התקציב יימחק ללא אפשרות שיחזור, האם להמשיך?';
        this.deleteConfirmationPrompt.onApprove = () => {
            this.deleteConfirmationPrompt.processing = true;
            this.sharedService
                .deletedBudget({
                    uuid: trns.budgetId
                })
                .subscribe((rslt) => {
                    this.deleteConfirmationPrompt.processing = false;
                    if (!rslt.error) {
                        this.deleteConfirmationPrompt.visible = false;
                        this.getBudget();
                    } else {
                        this.deleteConfirmationPrompt.visible = false;
                    }
                });
        };
        this.deleteConfirmationPrompt.visible = true;
    }

    get accountSelect(): FormArray {
        return this.popupBudgetCreate.data.get('companyAccountIds') as FormArray;
    }

    changeAcc(isChange: boolean): void {
        if (!isChange) {
            const accountSelect = this.popupBudgetCreate.data
                .get('companyAccountIds')
                .value.map((ids) => {
                    const accData = this.userService.appData.userData.accounts.find(
                        (acc: any) => acc.companyAccountId === ids
                    );
                    if (accData) {
                        return accData;
                    }
                });
            if (accountSelect && accountSelect.length) {
                this.userService.appData.userData.accountSelect = accountSelect;
                const showaccountSelector = setInterval(() => {
                    if (this.accountSelector) {
                        // console.log('-------accountSelect----2222---', this.userService.appData.userData.accountSelect);
                        clearInterval(showaccountSelector);
                        this.accountSelector.applyValuesFromModel();
                    }
                }, 10);
            }
        }
        // console.log(this.userService.appData.userData.accountSelect);
        this.popupBudgetCreate.data.setControl(
            'companyAccountIds',
            this.fb.array(
                this.userService.appData.userData.accountSelect.map(
                    (acc: any) => acc.companyAccountId
                )
            )
        );
        // console.log(this.popupBudgetCreate.data.get('companyAccountIds'));
    }

    calculateCategories(): void {
        const companyTransTypes = JSON.parse(
            JSON.stringify(this.companyTransTypes)
        );
        const keyDetails = this.popupBudgetCreate.data.get('keyDetails').value;
        const budgetTotalType =
            this.popupBudgetCreate.data.get('budgetTotalType').value;
        const ddCategories = JSON.parse(JSON.stringify(this.categories));
        // companyTransTypes.forEach((cat) => {
        //     const isHove = ddCategories.find(it => it.transTypeId === cat.transTypeId);
        //     cat.hova = isHove && isHove.hova;
        // });
        if (keyDetails) {
            ddCategories.push(
                ...keyDetails
                    .filter(
                        (det) =>
                            !ddCategories.some(
                                (cat) =>
                                    cat.transTypeId === det.keyId && cat.hova === det.expence
                            )
                    )
                    .map((det) => {
                        return {
                            hova: det.expence,
                            add: false,
                            transTypeId: det.keyId,
                            transTypeName: det.keyName
                        };
                    })
            );
            ddCategories.forEach((it) => {
                if (
                    keyDetails.find(
                        (id) => id.keyId === it.transTypeId && it.hova === id.expence
                    )
                ) {
                    it.press = true;
                    if (budgetTotalType === 'both') {
                        const theOtherTypeTrans = ddCategories.find(
                            (item) =>
                                item.transTypeId === it.transTypeId && item.hova === !it.hova
                        );
                        if (theOtherTypeTrans) {
                            theOtherTypeTrans.disabled = true;
                        }
                    }
                }
            });
        }
        const incomes = ddCategories.filter((cat) => !cat.hova);
        const outcome = ddCategories.filter((cat) => cat.hova);

        this.copyTransTypesIncome = companyTransTypes.filter((cat) => {
            if (!incomes.find((ddCat) => cat.transTypeId === ddCat.transTypeId)) {
                const isOp = outcome.find(
                    (ddCat) => cat.transTypeId === ddCat.transTypeId
                );
                if (isOp && isOp.press) {
                    cat.hide = true;
                }
                return cat;
            }
        });
        this.copyTransTypesExpence = companyTransTypes.filter((cat) => {
            if (!outcome.find((ddCat) => cat.transTypeId === ddCat.transTypeId)) {
                const isOp = incomes.find(
                    (ddCat) => cat.transTypeId === ddCat.transTypeId
                );
                if (isOp && isOp.press) {
                    cat.hide = true;
                }
                return cat;
            }
        });
        this.copyTransTypesIncomeAll = companyTransTypes.filter((cat) => {
            const isEx = incomes.find(
                (ddCat) => cat.transTypeId === ddCat.transTypeId
            );
            if (isEx) {
                const isOp = outcome.find(
                    (ddCat) => cat.transTypeId === ddCat.transTypeId
                );
                if (isOp && isOp.press) {
                    cat.hide = true;
                }
                return cat;
            }
        });
        this.copyTransTypesExpenceAll = companyTransTypes.filter((cat) => {
            const isEx = outcome.find(
                (ddCat) => cat.transTypeId === ddCat.transTypeId
            );
            if (isEx) {
                const isOp = incomes.find(
                    (ddCat) => cat.transTypeId === ddCat.transTypeId
                );
                if (isOp && isOp.press) {
                    cat.hide = true;
                }
                return cat;
            }
        });
        if (budgetTotalType === 'both') {
            incomes.sort((a, b) => {
                const lblA = a.transTypeName,
                    lblB = b.transTypeName;
                return lblA || lblB
                    ? !lblA
                        ? 1
                        : !lblB
                            ? -1
                            : lblA.localeCompare(lblB)
                    : 0;
            });
            incomes.push({
                hova: false,
                add: true,
                transTypeId: null,
                transTypeName: 'הוספת קטגוריה'
            });
            outcome.sort((a, b) => {
                const lblA = a.transTypeName,
                    lblB = b.transTypeName;
                return lblA || lblB
                    ? !lblA
                        ? 1
                        : !lblB
                            ? -1
                            : lblA.localeCompare(lblB)
                    : 0;
            });
            outcome.push({
                hova: true,
                add: true,
                transTypeId: null,
                transTypeName: 'הוספת קטגוריה'
            });
            this.popupBudgetCreate.ddCategories = incomes.concat(outcome);
        } else if (budgetTotalType === 'income') {
            incomes.sort((a, b) => {
                const lblA = a.transTypeName,
                    lblB = b.transTypeName;
                return lblA || lblB
                    ? !lblA
                        ? 1
                        : !lblB
                            ? -1
                            : lblA.localeCompare(lblB)
                    : 0;
            });
            incomes.push({
                hova: false,
                add: true,
                transTypeId: null,
                transTypeName: 'הוספת קטגוריה'
            });
            this.popupBudgetCreate.ddCategories = incomes;
        } else if (budgetTotalType === 'outcome') {
            outcome.sort((a, b) => {
                const lblA = a.transTypeName,
                    lblB = b.transTypeName;
                return lblA || lblB
                    ? !lblA
                        ? 1
                        : !lblB
                            ? -1
                            : lblA.localeCompare(lblB)
                    : 0;
            });
            outcome.push({
                hova: true,
                add: true,
                transTypeId: null,
                transTypeName: 'הוספת קטגוריה'
            });
            this.popupBudgetCreate.ddCategories = outcome;
        }

        this.lengthSlides = Array.from(
            {length: Math.ceil(this.popupBudgetCreate.ddCategories.length / 10)},
            (v, i) => i
        );

        this.popupBudgetCreate.ddCategoriesSource = JSON.parse(
            JSON.stringify(this.popupBudgetCreate.ddCategories)
        );
    }

    budgetCreate(budget?: any, isOpenPopupEdit?: boolean): void {
        this.isSubmitted = false;
        let accountSelect;
        if (budget) {
            accountSelect = budget.budgetAccounts
                .map((ids) =>
                    this.userService.appData.userData.accounts.find(
                        (acc: any) => acc.companyAccountId === ids
                    )
                )
                .filter((acc: any) => !!acc);
            // accountSelect = budget.budgetAccounts.map((ids) => {
            //     const accData = this.userService.appData.userData.accounts.find(acc => acc.companyAccountId === ids);
            //     if (accData) {
            //         return accData;
            //     }
            // });
        } else {
            accountSelect = this.userService.appData.userData.accounts.filter(
                (acc: any) => acc.currency === 'ILS'
            );
        }

        // this.userService.appData.userData.accountSelect = JSON.parse(JSON.stringify(accountSelect));
        // console.log('-------accountSelect---1111----', this.userService.appData.userData.accountSelect);
        this.popupBudgetCreate = {
            sourceBudget: budget ? JSON.parse(JSON.stringify(budget)) : null,
            styleClass: 'budget-create',
            header: true,
            body: true,
            footer: true,
            width: 604,
            type: isOpenPopupEdit ? 'edit' : budget ? 'duplication' : 'create',
            data: this.fb.group({
                budgetName: !isOpenPopupEdit ? '' : budget.budgetName,
                budgetTotalType: new FormControl({
                    value: budget ? budget.budgetTotalType : 'outcome', // 'both',
                    disabled:
                        (isOpenPopupEdit && !budget) ||
                        (budget && budget.frequencyDesc !== 'ONE_TIME')
                }),
                budgetType: new FormControl({
                    value: 'CATEGORY',
                    disabled: isOpenPopupEdit ? true : true
                }),
                companyAccountIds: this.fb.array(
                    accountSelect.map((acc: any) => acc.companyAccountId)
                ),
                companyId: this.userService.appData.userData.companySelect.companyId,
                creditCardCalcTypeDesc: budget ? budget.creditCardCalcTypeDesc : 'CALC',
                dateFrom: new FormControl({
                    // tslint:disable-next-line:max-line-length
                    // value: budget ? this.userService.appData.moment(budget.dateFrom).format('DD/MM/YY') : this.userService.appData.moment().startOf('month').format('DD/MM/YY'),
                    value: (budget
                            ? this.userService.appData.moment(budget.dateFrom)
                            : this.userService.appData.moment().startOf('month')
                    ).toDate(),
                    disabled: false
                }),
                dateTill: new FormControl({
                    // tslint:disable-next-line:max-line-length
                    // value: budget ? this.userService.appData.moment(budget.dateTill).format('DD/MM/YY') : this.userService.appData.moment().endOf('month').format('DD/MM/YY'),
                    value: (budget
                            ? this.userService.appData.moment(budget.dateTill)
                            : this.userService.appData.moment().endOf('month')
                    ).toDate(),
                    disabled: false
                }),
                frequencyDesc: new FormControl({
                    value: budget ? budget.frequencyDesc : 'MONTH',
                    disabled: isOpenPopupEdit
                }),
                totalIncome: new FormControl(budget ? budget.totalIncome : '', [
                    Validators.required,
                    Validators.min(1),
                    Validators.pattern('\\d+')
                ]),
                totalOutcome: new FormControl(budget ? budget.totalOutcome : '', [
                    Validators.required,
                    Validators.min(1),
                    Validators.pattern('\\d+')
                ]),
                keyDetails: budget
                    ? this.fb.array(
                        budget.budgetsDetails.details.map((it) => {
                            return this.fb.group({
                                expence: it.expence,
                                keyId: it.keyId,
                                keyName: it.keyName
                            });
                        })
                    )
                    : this.fb.array([])
            }),
            ddBudgetType: [
                {
                    label: 'קטגוריות',
                    value: 'CATEGORY'
                }
            ],
            ddBudgetTotalType: [
                {
                    label: 'הוצאות',
                    value: 'outcome'
                },
                {
                    label: 'הכנסות',
                    value: 'income'
                },
                {
                    label: 'הכנסות והוצאות',
                    value: 'both'
                }
            ],
            ddCreditCardCalcTypeDesc: [
                {
                    label: 'לפי הסכום של התשלום החודשי',
                    value: 'CALC'
                },
                {
                    label: 'לפי הסכום הכולל של העסקה',
                    value: 'ORIGINAL'
                }
            ],
            ddFrequencyDesc: [
                {
                    label: 'חודשי',
                    value: 'MONTH'
                },
                {
                    label: 'שנתי',
                    value: 'YEAR'
                },
                {
                    label: 'חד פעמי',
                    value: 'ONE_TIME'
                }
            ],
            ddCategories: [],
            copySourceKeyDetails:
                budget && isOpenPopupEdit
                    ? budget.budgetsDetails.details.map((it) => {
                        return {
                            expence: it.expence,
                            keyId: it.keyId
                        };
                    })
                    : [],
            isKeyDetailsNotEqual: false
        };

        if (!this.categories.length) {
            this.sharedService
                .getCategories({
                    companyId: this.userService.appData.userData.companySelect.companyId
                })
                .subscribe(
                    (response: any) => {
                        this.categories = response ? response['body'] : response;
                        this.calculateCategories();
                    },
                    (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred: %o', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
        } else {
            this.calculateCategories();
        }

        this.popupBudgetCreate.data
            .get('budgetTotalType')
            .valueChanges.pipe(filter((val) => !!val))
            .subscribe((budgetTotalType) => {
                const ddCategories = JSON.parse(JSON.stringify(this.categories));
                const companyTransTypes = JSON.parse(
                    JSON.stringify(this.companyTransTypes)
                );
                const incomes = ddCategories.filter((cat) => !cat.hova);
                const outcome = ddCategories.filter((cat) => cat.hova);
                // this.copyTransTypesIncome = companyTransTypes.filter((cat) => {
                //     return !incomes.find((ddCat) => cat.transTypeId === ddCat.transTypeId);
                // });
                // this.copyTransTypesExpence = companyTransTypes.filter((cat) => {
                //     return !outcome.find((ddCat) => cat.transTypeId === ddCat.transTypeId);
                // });
                //
                // this.copyTransTypesIncomeAll = companyTransTypes.filter((cat) => {
                //     return incomes.find((ddCat) => cat.transTypeId === ddCat.transTypeId);
                // });
                // this.copyTransTypesExpenceAll = companyTransTypes.filter((cat) => {
                //     return outcome.find((ddCat) => cat.transTypeId === ddCat.transTypeId);
                // });

                this.copyTransTypesIncome = companyTransTypes.filter((cat) => {
                    if (!incomes.find((ddCat) => cat.transTypeId === ddCat.transTypeId)) {
                        const isOp = outcome.find(
                            (ddCat) => cat.transTypeId === ddCat.transTypeId
                        );
                        if (isOp && isOp.press) {
                            cat.hide = true;
                        }
                        return cat;
                    }
                });
                this.copyTransTypesExpence = companyTransTypes.filter((cat) => {
                    if (!outcome.find((ddCat) => cat.transTypeId === ddCat.transTypeId)) {
                        const isOp = incomes.find(
                            (ddCat) => cat.transTypeId === ddCat.transTypeId
                        );
                        if (isOp && isOp.press) {
                            cat.hide = true;
                        }
                        return cat;
                    }
                });
                this.copyTransTypesIncomeAll = companyTransTypes.filter((cat) => {
                    const isEx = incomes.find(
                        (ddCat) => cat.transTypeId === ddCat.transTypeId
                    );
                    if (isEx) {
                        const isOp = outcome.find(
                            (ddCat) => cat.transTypeId === ddCat.transTypeId
                        );
                        if (isOp && isOp.press) {
                            cat.hide = true;
                        }
                        return cat;
                    }
                });
                this.copyTransTypesExpenceAll = companyTransTypes.filter((cat) => {
                    const isEx = outcome.find(
                        (ddCat) => cat.transTypeId === ddCat.transTypeId
                    );
                    if (isEx) {
                        const isOp = incomes.find(
                            (ddCat) => cat.transTypeId === ddCat.transTypeId
                        );
                        if (isOp && isOp.press) {
                            cat.hide = true;
                        }
                        return cat;
                    }
                });

                if (budgetTotalType === 'both') {
                    incomes.sort((a, b) => {
                        const lblA = a.transTypeName,
                            lblB = b.transTypeName;
                        return lblA || lblB
                            ? !lblA
                                ? 1
                                : !lblB
                                    ? -1
                                    : lblA.localeCompare(lblB)
                            : 0;
                    });
                    incomes.push({
                        hova: false,
                        add: true,
                        transTypeId: null,
                        transTypeName: 'הוספת קטגוריה'
                    });
                    outcome.sort((a, b) => {
                        const lblA = a.transTypeName,
                            lblB = b.transTypeName;
                        return lblA || lblB
                            ? !lblA
                                ? 1
                                : !lblB
                                    ? -1
                                    : lblA.localeCompare(lblB)
                            : 0;
                    });
                    outcome.push({
                        hova: true,
                        add: true,
                        transTypeId: null,
                        transTypeName: 'הוספת קטגוריה'
                    });
                    this.popupBudgetCreate.ddCategories = incomes.concat(outcome);
                } else if (budgetTotalType === 'income') {
                    incomes.sort((a, b) => {
                        const lblA = a.transTypeName,
                            lblB = b.transTypeName;
                        return lblA || lblB
                            ? !lblA
                                ? 1
                                : !lblB
                                    ? -1
                                    : lblA.localeCompare(lblB)
                            : 0;
                    });
                    incomes.push({
                        hova: false,
                        add: true,
                        transTypeId: null,
                        transTypeName: 'הוספת קטגוריה'
                    });
                    this.popupBudgetCreate.ddCategories = incomes;
                    console.log('incomes', JSON.stringify(incomes));
                } else if (budgetTotalType === 'outcome') {
                    outcome.sort((a, b) => {
                        const lblA = a.transTypeName,
                            lblB = b.transTypeName;
                        return lblA || lblB
                            ? !lblA
                                ? 1
                                : !lblB
                                    ? -1
                                    : lblA.localeCompare(lblB)
                            : 0;
                    });
                    outcome.push({
                        hova: true,
                        add: true,
                        transTypeId: null,
                        transTypeName: 'הוספת קטגוריה'
                    });
                    this.popupBudgetCreate.ddCategories = outcome;
                }

                this.lengthSlides = Array.from(
                    {
                        length: Math.ceil(this.popupBudgetCreate.ddCategories.length / 10)
                    },
                    (v, i) => i
                );

                const sourceCategoriesPressedSet =
                    this.popupBudgetCreate.ddCategoriesSource
                        .filter((src) => src.press)
                        .reduce(
                            (pressedSet, src) =>
                                pressedSet.add(src.transTypeId + String(src.hova)),
                            new Set()
                        );
                this.popupBudgetCreate.ddCategories
                    .filter(
                        (cat) =>
                            cat.transTypeId &&
                            sourceCategoriesPressedSet.has(cat.transTypeId + String(cat.hova))
                    )
                    .forEach((cat) => this.pressCategory(cat));
            });

        this.popupBudgetCreate.data
            .get('frequencyDesc')
            .valueChanges.pipe(filter((val) => !!val))
            .subscribe((val) => {
                if (val === 'MONTH') {
                    this.popupBudgetCreate.data
                        .get('dateFrom')
                        .setValue(
                            this.userService.appData.moment().startOf('month').toDate()
                        );
                    this.popupBudgetCreate.data
                        .get('dateTill')
                        .setValue(
                            this.userService.appData.moment().endOf('month').toDate()
                        );
                } else if (val === 'YEAR') {
                    this.popupBudgetCreate.data
                        .get('dateFrom')
                        .setValue(
                            this.userService.appData.moment().startOf('year').toDate()
                        );
                    this.popupBudgetCreate.data
                        .get('dateTill')
                        .setValue(this.userService.appData.moment().endOf('year').toDate());
                } else {
                    this.popupBudgetCreate.data.get('dateFrom').setValue(this.today);
                    this.popupBudgetCreate.data.get('dateTill').setValue(this.today);
                }
            });
    }

    budgetCreateWs(load?: any): void {
        this.isSubmitted = true;
        if (
            (this.popupBudgetCreate.data.get('budgetTotalType').value === 'both' &&
                (this.popupBudgetCreate.data.get('totalIncome').invalid ||
                    this.popupBudgetCreate.data.get('totalOutcome').invalid)) ||
            (this.popupBudgetCreate.data.get('budgetTotalType').value === 'income' &&
                this.popupBudgetCreate.data.get('totalIncome').invalid) ||
            (this.popupBudgetCreate.data.get('budgetTotalType').value === 'outcome' &&
                this.popupBudgetCreate.data.get('totalOutcome').invalid) ||
            this.popupBudgetCreate.data.get('budgetName').invalid ||
            !this.popupBudgetCreate.data.get('keyDetails').value.length ||
            !this.isPressCategories() ||
            !this.popupBudgetCreate.data.get('companyAccountIds').value.length
        ) {
            return;
        }
        // console.log('createBudget-------', this.popupBudgetCreate.data.getRawValue());

        const formVal = this.popupBudgetCreate.data.getRawValue();
        if (formVal.budgetTotalType === 'income') {
            formVal.totalOutcome = null;
            formVal.keyDetails = formVal.keyDetails.filter(
                (kd) => kd.expence !== true
            );
        } else if (formVal.budgetTotalType === 'outcome') {
            formVal.totalIncome = null;
            formVal.keyDetails = formVal.keyDetails.filter(
                (kd) => kd.expence === true
            );
        }

        if (!formVal.keyDetails.length) {
            return;
        }

        if (this.popupBudgetCreate.type === 'edit') {
            this.sharedService
                .updateBudget(
                    Object.assign(
                        {
                            budgetId: this.popupBudgetCreate.sourceBudget.budgetId
                        },
                        formVal
                    )
                )
                .subscribe(
                    () => {
                        this.popupBudgetCreate = false;
                        this.getBudget();
                    },
                    (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred: %o', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
        } else {
            this.sharedService.createBudget(formVal).subscribe(
                (response: any) => {
                    if (this.popupBudgetCreate.type === 'create') {
                        this.dataBudgetsIds = this.dataBudgets.map((it) => it.budgetId);
                    }
                    this.popupBudgetCreate = false;
                    this.getBudget();
                },
                (err: HttpErrorResponse) => {
                    if (err.error) {
                        console.log('An error occurred: %o', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
        }
    }

    pressCategory(category: any): void {
        if (!category.add) {
            category.press = !category.press;
            if (this.popupBudgetCreate.data.get('budgetTotalType').value === 'both') {
                const theOtherTypeTrans = this.popupBudgetCreate.ddCategories.find(
                    (it) =>
                        it.transTypeId === category.transTypeId &&
                        it.hova === !category.hova
                );
                if (theOtherTypeTrans) {
                    theOtherTypeTrans.disabled = category.press;
                }

                if (category.hova) {
                    const copyTransTypesIncomeAll = this.copyTransTypesIncomeAll.find(
                        (it) => it.transTypeId === category.transTypeId
                    );
                    if (copyTransTypesIncomeAll) {
                        copyTransTypesIncomeAll.hide = category.press;
                        this.copyTransTypesIncomeAll = JSON.parse(
                            JSON.stringify(this.copyTransTypesIncomeAll)
                        );
                    }
                    const copyTransTypesIncome = this.copyTransTypesIncome.find(
                        (it) => it.transTypeId === category.transTypeId
                    );
                    if (copyTransTypesIncome) {
                        copyTransTypesIncome.hide = category.press;
                        this.copyTransTypesIncome = JSON.parse(
                            JSON.stringify(this.copyTransTypesIncome)
                        );
                    }
                    this.childCategories[
                        'first'
                        ].newTransTypeName.updateValueAndValidity();
                } else {
                    const copyTransTypesExpenceAll = this.copyTransTypesExpenceAll.find(
                        (it) => it.transTypeId === category.transTypeId
                    );
                    if (copyTransTypesExpenceAll) {
                        copyTransTypesExpenceAll.hide = category.press;
                        this.copyTransTypesExpenceAll = JSON.parse(
                            JSON.stringify(this.copyTransTypesExpenceAll)
                        );
                    }
                    const copyTransTypesExpence = this.copyTransTypesExpence.find(
                        (it) => it.transTypeId === category.transTypeId
                    );
                    if (copyTransTypesExpence) {
                        copyTransTypesExpence.hide = category.press;
                        this.copyTransTypesExpence = JSON.parse(
                            JSON.stringify(this.copyTransTypesExpence)
                        );
                    }
                    this.childCategories[
                        'last'
                        ].newTransTypeName.updateValueAndValidity();
                }
            }

            this.popupBudgetCreate.data.setControl(
                'keyDetails',
                this.fb.array(
                    this.popupBudgetCreate.ddCategories
                        .filter((cate) => !cate.add && cate.press)
                        .map((it) => {
                            return this.fb.group({
                                expence: it.hova,
                                keyId: it.transTypeId
                            });
                        })
                )
            );

            if (this.popupBudgetCreate.type === 'edit') {
                const isEqual = this.popupBudgetCreate.copySourceKeyDetails.filter(
                    (o) =>
                        this.popupBudgetCreate.data
                            .get('keyDetails')
                            .value.some((v) => v.keyId === o.keyId && v.expence === o.expence)
                );
                this.popupBudgetCreate.isKeyDetailsNotEqual =
                    isEqual.length !== this.popupBudgetCreate.copySourceKeyDetails.length;
            }
            // console.log(this.popupBudgetCreate.data.get('keyDetails').value);
        }
    }

    scrollTillSelectable() {
        const startOfMinMonth = new Date(
            this.transDateSelector.minDate.getFullYear(),
            this.transDateSelector.minDate.getMonth(),
            1
        );
        while (
            new Date(
                this.transDateSelector.currentYear,
                this.transDateSelector.currentMonth,
                1
            ) < startOfMinMonth
            ) {

            this.transDateSelector.navForward(document.createEvent('Event'));
        }
    }

    public submitAddCategory($event: any, fieldName?: any, idx?: number): void {
        if ($event.originalEvent) {
            $event.originalEvent.preventDefault();
            $event.originalEvent.stopImmediatePropagation();
        } else {
            $event.preventDefault();
            $event.stopImmediatePropagation();
        }

        const category = $event.value;
        this.popupBudgetCreate.ddCategories.splice(idx, 0, {
            press: true,
            hova: fieldName.hova,
            transTypeId: category.transTypeId,
            transTypeName: category.transTypeName
        });

        this.popupBudgetCreate.data.setControl(
            'keyDetails',
            this.fb.array(
                this.popupBudgetCreate.ddCategories
                    .filter((cate) => !cate.add && cate.press)
                    .map((it) => {
                        return this.fb.group({
                            expence: it.hova,
                            keyId: it.transTypeId
                        });
                    })
            )
        );
        const ddCategories = JSON.parse(
            JSON.stringify(this.popupBudgetCreate.ddCategories)
        );
        const companyTransTypes = JSON.parse(
            JSON.stringify(this.companyTransTypes)
        );
        const incomes = ddCategories.filter((cat) => !cat.hova);
        const outcome = ddCategories.filter((cat) => cat.hova);

        if (fieldName.hova) {
            this.copyTransTypesExpence = this.copyTransTypesExpence.filter((cat) => {
                return cat.transTypeId !== category.transTypeId;
            });
            this.copyTransTypesExpenceAll = companyTransTypes.filter((cat) => {
                return outcome.find((ddCat) => cat.transTypeId === ddCat.transTypeId);
            });
        } else {
            this.copyTransTypesIncome = this.copyTransTypesIncome.filter((cat) => {
                return cat.transTypeId !== category.transTypeId;
            });
            this.copyTransTypesIncomeAll = companyTransTypes.filter((cat) => {
                return incomes.find((ddCat) => cat.transTypeId === ddCat.transTypeId);
            });
        }

        if (this.popupBudgetCreate.data.get('budgetTotalType').value === 'both') {
            const theOtherTypeTrans = this.popupBudgetCreate.ddCategories.find(
                (it) =>
                    it.transTypeId === category.transTypeId && it.hova === !fieldName.hova
            );
            if (theOtherTypeTrans) {
                theOtherTypeTrans.disabled = true;
            }

            if (fieldName.hova) {
                const copyTransTypesIncomeAll = this.copyTransTypesIncomeAll.find(
                    (it) => it.transTypeId === category.transTypeId
                );
                if (copyTransTypesIncomeAll) {
                    copyTransTypesIncomeAll.hide = true;
                    this.copyTransTypesIncomeAll = JSON.parse(
                        JSON.stringify(this.copyTransTypesIncomeAll)
                    );
                }
                const copyTransTypesIncome = this.copyTransTypesIncome.find(
                    (it) => it.transTypeId === category.transTypeId
                );
                if (copyTransTypesIncome) {
                    copyTransTypesIncome.hide = true;
                    this.copyTransTypesIncome = JSON.parse(
                        JSON.stringify(this.copyTransTypesIncome)
                    );
                }
                this.childCategories['first'].newTransTypeName.updateValueAndValidity();
            } else {
                const copyTransTypesExpenceAll = this.copyTransTypesExpenceAll.find(
                    (it) => it.transTypeId === category.transTypeId
                );
                if (copyTransTypesExpenceAll) {
                    copyTransTypesExpenceAll.hide = true;
                    this.copyTransTypesExpenceAll = JSON.parse(
                        JSON.stringify(this.copyTransTypesExpenceAll)
                    );
                }
                const copyTransTypesExpence = this.copyTransTypesExpence.find(
                    (it) => it.transTypeId === category.transTypeId
                );
                if (copyTransTypesExpence) {
                    copyTransTypesExpence.hide = true;
                    this.copyTransTypesExpence = JSON.parse(
                        JSON.stringify(this.copyTransTypesExpence)
                    );
                }
                this.childCategories['last'].newTransTypeName.updateValueAndValidity();
            }
        }

        this.lengthSlides = Array.from(
            {length: Math.ceil(this.popupBudgetCreate.ddCategories.length / 10)},
            (v, i) => i
        );
    }

    isPressCategories(): boolean {
        if (
            this.popupBudgetCreate.ddCategories &&
            this.popupBudgetCreate.ddCategories.filter((it) => it.press).length
        ) {
            return true;
        }
        return false;
    }

    // disabledNavDate(type: string): boolean {
    //     if (this.accountsNotUpdatesOldestTransDate) {
    //         if (this.getBudgetsDetails().frequencyDesc === 'MONTH') {
    //             const monthDiff = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
    //                 this.userService.appData.moment(this.getBudgetsDetails().dateFrom),
    //                 'months');
    //             let monthDiffOldestTransDate = 11;
    //             if (this.accountsNotUpdatesOldestTransDate.length) {
    //                 monthDiffOldestTransDate = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
    //                     this.userService.appData.moment(this.accountsNotUpdatesOldestTransDate[0].oldestTransDate),
    //                     'months');
    //             }
    //             if (type === 'prev') {
    //                 return !((monthDiff < 11) && (monthDiff <= monthDiffOldestTransDate));
    //             } else {
    //                 return !(monthDiff > 0);
    //             }
    //         } else {
    //             const yearsDiff = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
    //                 this.userService.appData.moment(this.getBudgetsDetails().dateFrom),
    //                 'years');
    //             let yearsDiffOldestTransDate = 3;
    //             if (this.accountsNotUpdatesOldestTransDate.length) {
    //                 yearsDiffOldestTransDate = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
    //                     this.userService.appData.moment(this.accountsNotUpdatesOldestTransDate[0].oldestTransDate),
    //                     'years');
    //             }
    //             if (type === 'prev') {
    //                 return !((yearsDiff < 3) && (yearsDiff <= yearsDiffOldestTransDate));
    //             } else {
    //                 return !(yearsDiff > 0);
    //             }
    //         }
    //     } else {
    //         return true;
    //     }
    // }

    prevDate(): void {
        if (this.getBudgetsDetails().frequencyDesc === 'MONTH') {
            // const monthDiff = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
            //     this.userService.appData.moment(this.getBudgetsDetails().dateFrom),
            //     'months');
            // let monthDiffOldestTransDate = 11;
            // if (this.accountsNotUpdatesOldestTransDate.length) {
            //     monthDiffOldestTransDate = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
            //         this.userService.appData.moment(this.accountsNotUpdatesOldestTransDate[0].oldestTransDate),
            //         'months');
            // }
            // // console.log(monthDiffOldestTransDate);
            // if ((monthDiff <= 11) && (monthDiff <= monthDiffOldestTransDate)) {
            this.getBudgetsDetails().dateFrom = this.userService.appData
                .moment(this.getBudgetsDetails().dateFrom)
                .subtract(1, 'months')
                .startOf('month')
                .valueOf();
            this.getBudgetsDetails().dateTill = this.userService.appData
                .moment(this.getBudgetsDetails().dateTill)
                .subtract(1, 'months')
                .endOf('month')
                .valueOf();
            // } else {
            //     return;
            // }
        } else {
            // const yearsDiff = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
            //     this.userService.appData.moment(this.getBudgetsDetails().dateFrom),
            //     'years');
            // let yearsDiffOldestTransDate = 3;
            // if (this.accountsNotUpdatesOldestTransDate.length) {
            //     yearsDiffOldestTransDate = this.userService.appData.moment(this.getBudgetsDetails().dates.dateFrom).diff(
            //         this.userService.appData.moment(this.accountsNotUpdatesOldestTransDate[0].oldestTransDate),
            //         'years');
            // }
            // console.log(yearsDiffOldestTransDate);
            // if ((yearsDiff <= 3) && (yearsDiff <= yearsDiffOldestTransDate)) {
            this.getBudgetsDetails().dateFrom = this.userService.appData
                .moment(this.getBudgetsDetails().dateFrom)
                .subtract(1, 'years')
                .startOf('month')
                .valueOf();
            this.getBudgetsDetails().dateTill = this.userService.appData
                .moment(this.getBudgetsDetails().dateTill)
                .subtract(1, 'years')
                .endOf('month')
                .valueOf();
            // } else {
            //     return;
            // }
        }

        this.getBudgetsDetails().budgetsDetails = null;
        this.budgetActive(this.getBudgetsDetails(), false);
    }

    nextDate(): void {
        if (this.getBudgetsDetails().frequencyDesc === 'MONTH') {
            const monthDiff = this.userService.appData
                .moment(this.getBudgetsDetails().dates.dateFrom)
                .diff(
                    this.userService.appData.moment(this.getBudgetsDetails().dateFrom),
                    'months'
                );
            if (monthDiff > 0) {
                this.getBudgetsDetails().dateFrom = this.userService.appData
                    .moment(this.getBudgetsDetails().dateFrom)
                    .add(1, 'months')
                    .startOf('month')
                    .valueOf();
                this.getBudgetsDetails().dateTill = this.userService.appData
                    .moment(this.getBudgetsDetails().dateTill)
                    .add(1, 'months')
                    .endOf('month')
                    .valueOf();
            } else {
                return;
            }
        } else {
            const yearsDiff = this.userService.appData
                .moment(this.getBudgetsDetails().dates.dateFrom)
                .diff(
                    this.userService.appData.moment(this.getBudgetsDetails().dateFrom),
                    'years'
                );
            if (yearsDiff > 0) {
                this.getBudgetsDetails().dateFrom = this.userService.appData
                    .moment(this.getBudgetsDetails().dateFrom)
                    .add(1, 'years')
                    .startOf('month')
                    .valueOf();
                this.getBudgetsDetails().dateTill = this.userService.appData
                    .moment(this.getBudgetsDetails().dateTill)
                    .add(1, 'years')
                    .endOf('month')
                    .valueOf();
            } else {
                return;
            }
        }
        this.getBudgetsDetails().budgetsDetails = null;
        this.budgetActive(this.getBudgetsDetails(), false);
    }

    getPrecentOfFlex(arr, idx, i): boolean {
        const divide = Math.round(
            JSON.parse(JSON.stringify(arr)).slice(idx * 10, idx * 10 + 10).length / 3
        );
        // console.log(divide);
        if (i <= divide * 2) {
            return i % divide === 0;
        } else {
            return false;
        }
    }

    submitChangesHistory(item: any): void {
        if (!item.newRow) {
            if (item.transTypePopup) {
                this.promptForTransTypeChangeApply(item);
            } else {
                item.keyId = item.selectedTransType.transTypeId;
                const params = {
                    transTypeId: item.keyId,
                    companyAccountId:
                        item.paymentDescSrc !== 'Budget' ? item.companyAccountId : null,
                    transId: item.transId,
                    biziboxMutavId:
                        item.paymentDescSrc !== 'Budget' ? item.biziboxMutavId : null,
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    updateType: 'row update',
                    transSource:
                        item.paymentDescSrc !== 'Budget' ? item.transSource : 'BudgetTrans',
                    paymentDesc:
                        item.paymentDescSrc !== 'Budget' ? item.paymentDescSrc : 'Budget',
                    searchkeyId:
                        item.paymentDescSrc !== 'Budget' ? item.searchkeyId : null,
                    kvua: item.paymentDescSrc !== 'Budget' ? item.kvua : false
                };
                this.sharedService.budgetUpdateTransType(params).subscribe(
                    () => {
                        this.dataHistoryLoaded$.next([item]);
                    },
                    (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred: %o', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
            }
        } else {
            item.keyId = item.selectedTransType.transTypeId;
        }
    }

    focusRowHistory(bnfTr: any, transes: any): void {
        if (bnfTr.paymentDescSrc === 'Budget') {
            bnfTr.editRow = true;
            bnfTr.editRowFocus = true;
        }

        transes.forEach((it) => {
            if (it.newRow) {
                it.editRow = true;
                it.editRowFocus = true;
            } else if (it.transId !== bnfTr.transId) {
                it.editRow = false;
                it.editRowFocus = false;
            }
        });
    }
    modelChangeFn(eve:any){
        console.log(eve)
        debugger
    }
    updateBudgetTrans(item: any): void {
        item.editRowFocus = false;
        if (
            item.total === '0' ||
            item.total === 0 ||
            item.total === null ||
            item.total === '' ||
            item.transName === ''
        ) {
            if (
                item.total === null ||
                item.total === '' ||
                item.total === '0' ||
                item.total === 0
            ) {
                item.total = item.totalSrc;
            }
            if (item.transName === '') {
                item.transName = item.transNameSrc;
            }
            item.total =
                item.total !== null && item.total !== undefined
                    ? Number(item.total)
                    : item.total;
        } else {
            item.total = Number(item.total);
            if (!item.newRow) {
                item.totalMinusDate = null;
                if (Number(item.totalSrc) !== Number(item.total)) {
                    if (
                        this.userService.appData
                            .moment()
                            .isSame(
                                this.userService.appData.moment(item.transDateFormat),
                                'month'
                            )
                    ) {
                        item.totalDefDaily = Number(item.total) - Number(item.totalSrc);
                    }
                } else {
                    if (
                        !this.userService.appData
                            .moment()
                            .isSame(
                                this.userService.appData.moment(item.transDateFormat),
                                'month'
                            )
                    ) {
                        item.totalDefDaily = -Number(item.total);
                    } else {
                        if (
                            this.userService.appData
                                .moment(item.transDateFormat)
                                .isSame(
                                    this.userService.appData.moment(item.transDate),
                                    'month'
                                )
                        ) {
                            if (
                                !this.userService.appData
                                    .moment(item.transDateFormat)
                                    .isSame(
                                        this.userService.appData.moment(item.transDate),
                                        'day'
                                    )
                            ) {
                                item.totalDefDaily = item.transDate.toString();
                            }
                        } else {
                            item.totalDefDaily = Number(item.total);
                        }
                    }

                    if (
                        !this.userService.appData
                            .moment(item.transDateFormat)
                            .isSame(this.userService.appData.moment(item.transDate), 'month')
                    ) {
                        item.totalMinusDate = item.transDate.toString();
                    }
                }

                const monthDefMonths = this.userService.appData
                    .moment(item.transDateFormat)
                    .isSame(this.userService.appData.moment(item.transDate), 'month');
                if (monthDefMonths) {
                    item.totalDef = Number(item.total) - Number(item.totalSrc);
                    if (
                        this.userService.appData
                            .moment()
                            .isSame(
                                this.userService.appData.moment(item.transDateFormat),
                                'month'
                            )
                    ) {
                        this.budgetHistoryPrompt.transCalc += Number(item.totalDef);
                    }
                } else {
                    item.totalDef = Number(item.total);

                    const monthDefThisMonth = this.userService.appData
                        .moment()
                        .isSame(this.userService.appData.moment(item.transDate), 'month');
                    if (monthDefThisMonth) {
                        this.budgetHistoryPrompt.transCalc -= Number(item.total);
                    } else {
                        const isThisMonth = this.userService.appData
                            .moment()
                            .isSame(
                                this.userService.appData.moment(item.transDateFormat),
                                'month'
                            );
                        if (isThisMonth) {
                            this.budgetHistoryPrompt.transCalc += Number(item.total);
                        }
                    }
                }

                item.total = Number(item.total);
                item.transDate = this.userService.appData
                    .moment(item.transDateFormat)
                    .startOf('day')
                    .valueOf();
                const params = {
                    transId: item.transId,
                    transName: item.transName,
                    transDate: item.transDateFormat,
                    transTotal: item.total,
                    transTypeId: item.keyId,
                    expence: this.budgetHistoryPrompt.budgetHistoryRow.expence
                };
                this.sharedService.updateBudgetTrans(params).subscribe(
                    () => {
                        item.totalSrc = Number(item.total);
                        item.transNameSrc = item.transName;
                        this.dataHistoryLoaded$.next([item, 3]);
                    },
                    (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred: %o', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
            }
        }
    }

    promptForTransTypeChangeApply(item: any) {
        console.log('promptForTransTypeChangeApply ->> item: %o', item);
        this.transTypeChangePrompt = {
            show: true,
            data: {
                transName: item.transName,
                transTypeName: item.selectedTransType.transTypeName,
                transTypeId: item.selectedTransType.transTypeId,
                companyId: this.userService.appData.userData.companySelect.companyId,
                searchkeyId: item.searchkeyId,
                kvua: item.kvua,
                bankTransId: item.transId,
                ccardTransId: null
            },
            apply: (event: any) => {
                item.keyId = item.selectedTransType.transTypeId;
                const params = {
                    transTypeId: item.keyId,
                    companyAccountId:
                        item.paymentDescSrc !== 'Budget' ? item.companyAccountId : null,
                    transId: item.transId,
                    biziboxMutavId:
                        item.paymentDescSrc !== 'Budget' ? item.biziboxMutavId : null,
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    updateType: 'row update',
                    transSource:
                        item.paymentDescSrc !== 'Budget' ? item.transSource : 'BudgetTrans',
                    paymentDesc:
                        item.paymentDescSrc !== 'Budget' ? item.paymentDescSrc : 'Budget',
                    searchkeyId:
                        item.paymentDescSrc !== 'Budget' ? item.searchkeyId : null,
                    kvua: item.paymentDescSrc !== 'Budget' ? item.kvua : false
                };

                switch (event) {
                    case 'single':
                        params.updateType = 'row update';
                        break;
                    case 'both':
                        params.updateType = 'future+past';
                        break;
                    case 'past':
                        params.updateType = 'past';
                        break;
                    case 'future':
                        params.updateType = 'future';
                        break;
                }

                this.sharedService.budgetUpdateTransType(params).subscribe(
                    () => {
                        if (event === 'both' || event === 'past') {
                            this.budgetHistoryPrompt.reload = true;
                            setTimeout(() => {
                                this.budgetHistoryPrompt.reload = false;
                            }, 300);
                        } else {
                            this.dataHistoryLoaded$.next([item]);
                        }
                    },
                    (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred: %o', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                );
            },
            cancel: (event: any) => {
                if (event) {
                    const companyTransType =
                        this.companyTransTypes.find((tt) => {
                            return tt.transTypeId === item.keyId;
                        }) || this.defaultTransType;
                    item.selectedTransType = companyTransType;
                    item.keyId = item.selectedTransType.transTypeId;
                    this.transTypeChangePrompt.show = false;
                }
            }
        };
    }

    addHistory(): void {
        const companyTransType =
            this.companyTransTypes.find((tt) => {
                return (
                    tt.transTypeId === this.budgetHistoryPrompt.budgetHistoryRow.keyId
                );
            }) || this.defaultTransType;
        this.dataHistoryLoaded$.next([
            {
                transId: 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                    /[xy]/g,
                    function (c) {
                        const r = (Math.random() * 16) | 0,
                            v = c == 'x' ? r : (r & 0x3) | 0x8;
                        return v.toString(16);
                    }
                ),
                transName: this.budgetHistoryPrompt.budgetHistoryRow.expence
                    ? 'הוצאה'
                    : 'הכנסה',
                transNameSrc: this.budgetHistoryPrompt.budgetHistoryRow.expence
                    ? 'הוצאה'
                    : 'הכנסה',
                paymentDescSrc: 'Budget',
                transDateFormat: new Date(),
                paymentDesc: 'הוזן ידנית',
                transDate: this.userService.appData.moment().startOf('day').valueOf(),
                biziboxMutavId: null,
                asmachta: null,
                total: null,
                mutavName: null,
                totalSrc: null,
                companyAccountId: null,
                creditCardId: null,
                hova: this.budgetHistoryPrompt.budgetHistoryRow.expence,
                kvua: false,
                searchkeyId: null,
                transSource: 'BudgetTrans',
                transTypePopup: false,
                keyId: this.budgetHistoryPrompt.budgetHistoryRow.keyId,
                newRow: true,
                editRow: true,
                selectedTransType: companyTransType
            },
            true
        ]);
    }

    removeAddHistory(): void {
        this.dataHistoryLoaded$.next([null, 2]);
    }

    approveaddHistory(): void {
        this.dataHistoryLoaded$.next([null, 1]);
    }

    removeRowFromHistory(item: any): void {
        this.dataHistoryLoaded$.next([item, 2]);
    }

    getNum(num: any): number {
        return Number(num);
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.actionNavigateToBudgetSub) {
            this.actionNavigateToBudgetSub.unsubscribe();
        }
    }
}
