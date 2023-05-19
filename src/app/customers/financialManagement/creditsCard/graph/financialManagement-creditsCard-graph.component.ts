import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {UserService} from '@app/core/user.service';
import {CardsSelectComponent} from '@app/shared/component/cards-select/cards-select.component';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute} from '@angular/router';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {
    CcardsDateRangeSelectorComponent
} from '@app/shared/component/date-range-selectors/ccards-date-range-selector.component';
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
import {BehaviorSubject, combineLatest, defer, Observable, of, ReplaySubject, Subscription} from 'rxjs';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {FormControl} from '@angular/forms';
import {roundAndAddComma} from '@app/shared/functions/addCommaToNumbers';
import {TransTypesService} from '@app/core/transTypes.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';

export interface CreditCardTransaction {
    ccardTransId: string;
    creditCardId: string;
    companyAccountId: string;
    mainDescription: string;
    transTotal: number;
    transTypeId: string;
    cycleDate: number;
    note: string;
}

export interface CycleEvent {
    iskatHul: number;
    iskatHulStr: string;
    cycleDate: number;
    cycleTotal: number;
    notFinal: boolean;
    transactions: CreditCardTransaction[];
}

@Component({
    templateUrl: './financialManagement-creditsCard-graph.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementCreditsCardGraphComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(CcardsDateRangeSelectorComponent)
    childDates: CcardsDateRangeSelectorComponent;
    @ViewChild(CardsSelectComponent) cardsSelector: CardsSelectComponent;

    // public dataTableAll: any[] = [];
    public loader = false;
    // public ddSelectGraph: any[];
    // public selectedValueGraph: any;
    // public chartData: any;
    // public showValues = false;
    // public showCreditLines = false;

    creditCardsOutdated: any[] = [];
    allCreditCardsOutdatedBecauseNotFound: boolean;

    private readonly cardsSelected$ = new ReplaySubject<any[]>(1);
    private detailedDataLoad$: Observable<CycleEvent[]>;
    private loadedDataRepacked$: Observable<any>;

    readonly queryControl = new FormControl('');
    readonly showValuesControl = new FormControl();
    readonly showStackedControl = new FormControl();
    private readonly filterChanged$ = new BehaviorSubject<{
        query: string;
        categories: string[];
    }>({
        query: '',
        categories: null
    });
    chartData$: Observable<any>;

    transTypesArr: { val: string | any; checked: boolean; id: string }[];
    private queryChangeSub: Subscription;

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private storageService: StorageService,
        private route: ActivatedRoute,
        private currencySymbolPipe: CurrencySymbolPipe,
        private filterPipe: FilterPipe,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);
    }

    override reload() {
        console.log('reload child');
        this.getCreditCardTazrimGraph();
    }

    ngAfterViewInit() {
        // console.log(this.cardsSelector)
        // debugger
        this.detailedDataLoad$ = defer(() => {
            return combineLatest([this.cardsSelected$, this.childDates.selectedRange]);
        }).pipe(
            switchMap(([cards, range]) => {
                const arrCards = cards.map((card) => card.creditCardId);
                if (
                    arrCards.length === 1 &&
                    this.cardsSelector.selectedCards[0].cycleDay &&
                    ['cCardClosestFuture', 'cCardClosestPast'].includes(
                        this.childDates.selectedPreset.name
                    )
                ) {
                    const cycleDayInCurrMonth = this.userService.appData
                        .moment()
                        .date(this.cardsSelector.selectedCards[0].cycleDay)
                        .startOf('day');
                    if (cycleDayInCurrMonth.isBefore(this.userService.appData.moment())) {
                        // now after cycle day
                        if (this.childDates.selectedPreset.name === 'cCardClosestFuture') {
                            range.fromDate = cycleDayInCurrMonth
                                .clone()
                                .add(1, 'days')
                                .toDate();
                            range.toDate = cycleDayInCurrMonth
                                .add(1, 'months')
                                .endOf('day')
                                .toDate();
                        } else if (
                            this.childDates.selectedPreset.name === 'cCardClosestPast'
                        ) {
                            range.fromDate = cycleDayInCurrMonth
                                .clone()
                                .subtract(1, 'months')
                                .add(1, 'days')
                                .toDate();
                            range.toDate = cycleDayInCurrMonth.endOf('day').toDate();
                        }
                    } else {
                        if (this.childDates.selectedPreset.name === 'cCardClosestFuture') {
                            range.fromDate = cycleDayInCurrMonth
                                .clone()
                                .subtract(1, 'months')
                                .add(1, 'days')
                                .toDate();
                            range.toDate = cycleDayInCurrMonth.endOf('day').toDate();
                        } else if (
                            this.childDates.selectedPreset.name === 'cCardClosestPast'
                        ) {
                            range.fromDate = cycleDayInCurrMonth
                                .clone()
                                .subtract(2, 'months')
                                .add(1, 'days')
                                .toDate();
                            range.toDate = cycleDayInCurrMonth
                                .subtract(1, 'months')
                                .endOf('day')
                                .toDate();
                        }
                    }
                }

                return arrCards.length
                    ? this.sharedService.getCreditCardTransactionDetails({
                        companyId:
                        this.userService.appData.userData.companySelect.companyId,
                        creditCardIds: arrCards,
                        dateFrom: range.fromDate,
                        dateTill: range.toDate,
                        filterType: this.childDates.selectedFilterType
                    })
                    : of({body: []});
            }),
            map((resp: any) => (resp && !resp.error ? resp.body : [])),
            tap((detailedData) => this.rebuildTransTypesList(detailedData)),
            publishRef
        );

        this.loadedDataRepacked$ = defer(() => this.detailedDataLoad$).pipe(
            withLatestFrom(this.childDates.selectedRange),
            map(([detailedData, range]) => this.repack(detailedData, range))
        );
        this.showValuesControl.valueChanges
            .subscribe(() => {
                this.sharedComponent.mixPanelEvent('show values');
            });
        this.showStackedControl.valueChanges
            .subscribe(() => {
                this.sharedComponent.mixPanelEvent('united view');
            });
        this.chartData$ = defer(() => {
            return combineLatest([
                    this.loadedDataRepacked$,
                    this.filterChanged$.pipe(
                        distinctUntilChanged((a, b) => {
                            // debugger;
                            return (
                                a === b ||
                                (a !== null &&
                                    b !== null &&
                                    a.query === b.query &&
                                    a.categories === b.categories)
                            );
                        })
                    ),
                    this.showValuesControl.valueChanges.pipe(
                        startWith(this.showValuesControl.value)
                    ),
                    this.showStackedControl.valueChanges.pipe(
                        startWith(this.showStackedControl.value)
                    )
                ]
            );
        }).pipe(
            withLatestFrom(this.childDates.selectedRange),
            map(([[repackedData, currFilter, showValues, showStacked], range]) => {
                const chartData = this.createChartData(repackedData, currFilter, range);
                chartData.dataLabelsEnabled = !!showValues;
                chartData.stacked = !!showStacked;
                return chartData;
            }),
            publishRef
        );

        this.queryChangeSub = this.queryControl.valueChanges
            .pipe(
                debounceTime(500),
                filter((val) => !val || val.trim().length > 1),
                distinctUntilChanged(),
                tap((term) => {
                    this.storageService.sessionStorageSetter(
                        'creditsCard/details-filterQuery',
                        term
                    );
                })
            )
            .subscribe((val) => {
                this.sharedComponent.mixPanelEvent('search',{
                    value:val
                });

                this.filterChanged$.next({
                    query: val,
                    categories: this.filterChanged$.value.categories
                });
            });

        const detailsFilterTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'creditsCard/details-filterTypesCategory'
            );
        if (detailsFilterTypesCategory !== null) {
            this.filterChanged$.next({
                query: this.filterChanged$.value.query,
                categories:
                    detailsFilterTypesCategory === '' ||
                    detailsFilterTypesCategory === 'null'
                        ? null
                        : JSON.parse(detailsFilterTypesCategory)
            });
        }
        const detailsFilterQuery = this.storageService.sessionStorageGetterItem(
            'creditsCard/details-filterQuery'
        );
        if (detailsFilterQuery) {
            this.queryControl.setValue(detailsFilterQuery);
        }
    }

    ngOnInit(): void {
        console.log('')
    }

    ngOnDestroy(): void {
        this.cardsSelected$.complete();
        if (this.queryChangeSub) {
            this.queryChangeSub.unsubscribe();
        }
        this.destroy();
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
    getCreditCardTazrimGraph(cardsDD?:any): void {
        const cardsSelector = cardsDD ? cardsDD : this.cardsSelector
        // console.log(cardsSelector)
        // debugger
        this.creditCardsOutdated = cardsSelector.selectedCards.filter(
            (cc) => !cc.balanceIsUpToDate
        );
        this.allCreditCardsOutdatedBecauseNotFound = this.creditCardsOutdated.every(
            (cc) => cc.alertStatus === 'Not found in bank website'
        );
        this.cardsSelected$.next(cardsSelector.selectedCards);
        this.sharedComponent.mixPanelEvent('credits drop', {
            credits: (this.userService.appData.userData.creditCards.length === cardsSelector.selectedCards.length) ? 'כל הכרטיסים' : cardsSelector.selectedCards.map((card) => card.creditCardId)
        });
    }

    // filterDates(paramDate: any): void {
    //     this.loader = true;
    //
    //     const arrCards = this.cardsSelector.selectedCards.map((card) => card.creditCardId);
    //     if (arrCards.length) {
    //         const daysScale = getDaysBetweenDates(new Date(paramDate.fromDate),
    //             new Date(paramDate.toDate)) <= 31;
    //         this.sharedService.getCreditCardTazrimGraph({
    //             'creditCardIds': arrCards,
    //             'dateFrom': paramDate.fromDate,
    //             'dateTill': paramDate.toDate
    //         }).subscribe(
    //             response => {
    //                 this.dataTableAll = (response) ? response['body'] : response;
    //                 if (this.dataTableAll.length) {
    //
    //                     if (!daysScale) {
    //                         this.dataTableAll.forEach(ccData => {
    //                             ccData.cycles = this.groupCyclesByMonth(ccData.cycles);
    //                         });
    //                     }
    //
    //                     this.updateChart();
    //                 } else {
    //                     this.loader = false;
    //                 }
    //             }, (err: HttpErrorResponse) => {
    //                 if (err.error) {
    //                     console.log('An error occurred:', err.error.message);
    //                 } else {
    //                     console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
    //                 }
    //             });
    //     } else {
    //         this.dataTableAll = [];
    //         this.updateChart();
    //         this.loader = false;
    //     }
    // }
    //
    //
    // updateChart(): void {
    //     this.loader = true;
    //     const dataTableAll = this.dataTableAll;
    //     // const flags = [], xAxiscategories = [];
    //     const selectedCards = this.userService.selectedCreditCards();
    //     const series = dataTableAll.map((val, idx) => {
    //
    //         const selectedCard = selectedCards.find(cc => cc.creditCardId === val.creditCardId);
    //         // console.log('selectedCard: %o', selectedCard);
    //
    //         return {
    //             cursor: 'pointer',
    //             name: selectedCard.creditCardNickname,
    //             // color: this.getColorRandom(idx),
    //             data: val.cycles.map((sum) => {
    //                 return {
    //                     x: sum.month,
    //                     y: sum.monthlyTotal,
    //                     notFinal: sum.notFinal ? this.translate.translations[this.translate.currentLang].titles.notFinal : null
    //                 };
    //             }),
    //             currency: this.currencySymbolPipe.transform(selectedCard.currency)
    //         };
    //     });
    //     const plotLines = [{
    //         // color: '#d63838',
    //         width: 2,
    //         value: 0,
    //         dashStyle: 'ShortDash',
    //         label: {
    //             enabled: false
    //         }
    //     }];
    //
    //     this.childDates.selectedRange
    //         .pipe(
    //             take(1)
    //         )
    //         .subscribe((rng) => {
    //             this.chartData = {
    //                 fromDate: new Date(rng.fromDate),
    //                 toDate: new Date(rng.toDate),
    //                 columnGroup: true,
    //                 dataLabelsEnabled: this.showValues,
    //                 plotLines: plotLines,
    //                 gridLineWidth: 1,
    //                 markerEnabled: true,
    //                 crosshair: false,
    //                 // xAxiscategories: xAxiscategories,
    //                 series: series
    //             };
    //             // console.log(JSON.stringify(xAxiscategories));
    //             // console.log(JSON.stringify(series));
    //
    //             this.loader = false;
    //         });
    // }

    selectCreditCard(card: any): void {
        this.storageService.sessionStorageSetter(
            CardsSelectComponent.storageKey(this.route),
            JSON.stringify([card.creditCardId])
        );

        this.cardsSelector.applySelection([card.creditCardId]);
    }

    // private groupCyclesByMonth(cycles: any[]): any[] {
    //     if (!(cycles instanceof Array) || !cycles.length) {
    //         return cycles;
    //     }
    //
    //     const grouped = Object.values(cycles.reduce((acmltr, cycleData) => {
    //         const monthKey = new Date(new Date(cycleData.month).setDate(1)).setHours(0, 0, 0, 0);
    //         if (acmltr[monthKey]) {
    //             acmltr[monthKey].monthlyTotal += +cycleData.monthlyTotal;
    //             acmltr[monthKey].notFinal = acmltr[monthKey].notFinal || cycleData.notFinal;
    //         } else {
    //             acmltr[monthKey] = {
    //                 month: monthKey,
    //                 monthlyTotal: cycleData.monthlyTotal,
    //                 notFinal: cycleData.notFinal
    //             };
    //         }
    //
    //         return acmltr;
    //     }, {}));
    //
    //     grouped.sort((a, b) => a['month'] - b['month']);
    //
    //     return grouped;
    // }

    private repack(
        detailedData: CycleEvent[],
        range: { fromDate: Date | null; toDate: Date | null }
    ): {
        [k: number]: {
            notFinal: boolean;
            transactionsByCardIdMap: {
                [k1: string]: CreditCardTransaction[];
            };
        };
    } {
        if (detailedData.length) {
            const useDayScale =
                this.userService.appData
                    .moment(range.toDate)
                    .diff(range.fromDate, 'days') < 32;

            return detailedData.reduce((acmltr, cycleEvt) => {
                const dtGroupKey = (
                    useDayScale
                        ? this.userService.appData.moment(cycleEvt.cycleDate)
                        : this.userService.appData
                            .moment(cycleEvt.cycleDate)
                            .startOf('month')
                )
                    .startOf('day')
                    .valueOf();

                acmltr[dtGroupKey] = acmltr[dtGroupKey] || {
                    notFinal: cycleEvt.notFinal,
                    transactionsByCardIdMap: Object.create(null)
                };

                cycleEvt.transactions.forEach((tr) => {
                    acmltr[dtGroupKey].transactionsByCardIdMap[tr.creditCardId] =
                        acmltr[dtGroupKey].transactionsByCardIdMap[tr.creditCardId] || [];

                    acmltr[dtGroupKey].transactionsByCardIdMap[tr.creditCardId].push(tr);
                });

                return acmltr;
            }, Object.create(null));
        }

        return Object.create(null);
    }

    private createChartData(
        detailedData: {
            [date: number]: {
                notFinal: boolean;
                transactionsByCardIdMap: {
                    [k1: string]: CreditCardTransaction[];
                };
            };
        },
        currFilter: { query: string; categories: string[] },
        range: { fromDate: Date | null; toDate: Date | null }
    ): any {
        const series = [];

        if (detailedData) {
            const allSeriesMap = Object.keys(detailedData)
                .sort((a, b) => +a - +b)
                .reduce((allSeries, xMark) => {
                    Object.keys(detailedData[xMark].transactionsByCardIdMap).reduce(
                        (acmltr, creditCardId) => {
                            const transactionsFiltered = this.filterPipe.transform(
                                this.filterPipe.transform(
                                    detailedData[xMark].transactionsByCardIdMap[creditCardId],
                                    currFilter.categories,
                                    ['transTypeId']
                                ),
                                currFilter.query,
                                ['mainDescription', 'note']
                            );

                            if (transactionsFiltered.length) {
                                let card;
                                if (!acmltr[creditCardId]) {
                                    card = this.cardsSelector.selectedCards.find(
                                        (cc) => cc.creditCardId === creditCardId
                                    );

                                    if (!card) {
                                        return acmltr;
                                    }
                                }

                                acmltr[creditCardId] = acmltr[creditCardId] || {
                                    cursor: 'pointer',
                                    name: card.creditCardNickname,
                                    data: [],
                                    currency: this.currencySymbolPipe.transform(card.currency)
                                };

                                acmltr[creditCardId].data.push({
                                    x: this.userService.appData.moment(+xMark).toDate(),
                                    y: transactionsFiltered.reduce(
                                        (sum, trans) => sum + trans.transTotal,
                                        0
                                    ),
                                    notFinal:
                                        detailedData[xMark].notFinal === true
                                            ? this.translate.instant('titles.notFinal')
                                            : null,
                                    transactionsHtml: [
                                        // tslint:disable-next-line:max-line-length
                                        '<ul style="max-height: 195px; overflow: auto;-ms-overflow-style:scrollbar;" class="scroll-chrome">',
                                        transactionsFiltered
                                            .sort((a, b) => b.transTotal - a.transTotal)
                                            .map((tr) => {
                                                return [
                                                    '<li style="white-space: nowrap;" class="p-g">',
                                                    `<div class="p-g-8">${tr.transDesc}</div>`,
                                                    `<div class="p-g-1"></div>`,
                                                    `<div class="p-g-3">${roundAndAddComma(
                                                        tr.transTotal
                                                    )}</div>`,
                                                    '</li>'
                                                ].join('');
                                            })
                                            .join(''),
                                        '</ul>'
                                    ].join('')
                                });
                            }

                            return acmltr;
                        },
                        allSeries
                    );

                    return allSeries;
                }, Object.create(null));

            series.push(...Object.values(allSeriesMap));
        }

        const useDayScale =
            this.userService.appData
                .moment(range.toDate)
                .diff(range.fromDate, 'days') < 32;

        const plotLines = series.find((ser) => !!ser.data.find((pnt) => pnt.y < 0))
            ? [
                {
                    color: '#cbc9c9', // '#d63838',
                    width: 2,
                    value: 0,
                    label: {
                        enabled: false
                    }
                }
            ]
            : [];

        return {
            // range.fromDate,
            fromDate: (useDayScale
                    ? this.userService.appData.moment(range.fromDate)
                    : this.userService.appData.moment(range.fromDate).startOf('month')
            )
                .startOf('day')
                .toDate(),
            // range.toDate,
            toDate: (useDayScale
                    ? this.userService.appData.moment(range.toDate)
                    : this.userService.appData.moment(range.toDate).startOf('month')
            )
                .startOf('day')
                .toDate(),
            columnGroup: true,
            plotLines: plotLines,
            gridLineWidth: 1,
            markerEnabled: true,
            crosshair: false,
            series: series
        };
    }

    private rebuildTransTypesList(detailedData: CycleEvent[]) {
        this.transTypesService.selectedCompanyTransTypes
            .pipe(first())
            .subscribe((rslt) => {
                const availableTransTypesMap = detailedData.reduce(
                    (acmltr, ce) => {
                        ce.transactions.reduce((acmltr1, tr) => {
                            let companyTransType;
                            if (
                                tr.transTypeId &&
                                !acmltr1[tr.transTypeId] &&
                                (companyTransType = rslt.find(
                                    (cmpnTrType) => cmpnTrType.transTypeId === tr.transTypeId
                                ))
                            ) {
                                acmltr1[tr.transTypeId] = {
                                    val: companyTransType.transTypeName,
                                    id: tr.transTypeId,
                                    checked:
                                        !Array.isArray(this.filterChanged$.value.categories) ||
                                        this.filterChanged$.value.categories.includes(
                                            tr.transTypeId
                                        )
                                };

                                if (
                                    !acmltr1[tr.transTypeId].checked &&
                                    acmltr1['all'].checked
                                ) {
                                    acmltr1['all'].checked = false;
                                }
                            }
                            return acmltr1;
                        }, acmltr);
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
                this.transTypesArr = Object.values(availableTransTypesMap);

                this.filterChanged$.next({
                    query: this.queryControl.value,
                    categories: availableTransTypesMap['all'].checked
                        ? null
                        : this.transTypesArr.filter((tt) => tt.checked).map((tt) => tt.id)
                });
            });
    }

    filterCategory($event: any) {
        this.sharedComponent.mixPanelEvent('filter category', {
            value: $event.checked
        });
        this.filterChanged$.next({
            query: this.queryControl.value,
            categories: $event.checked
        });
        this.storageService.sessionStorageSetter(
            'creditsCard/details-filterTypesCategory',
            JSON.stringify($event.checked)
        );
    }
}
