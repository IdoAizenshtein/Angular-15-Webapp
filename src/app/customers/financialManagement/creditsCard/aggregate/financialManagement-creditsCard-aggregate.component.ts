import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {CustomersFinancialManagementCreditsCardComponent} from '../customers-financialManagement-creditsCard.component';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service';
import {UserService} from '@app/core/user.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {FormControl} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {DatePipe} from '@angular/common';
import {CardsSelectComponent} from '@app/shared/component/cards-select/cards-select.component';
import {getMonthCountBetweenIncluded} from '@app/shared/functions/getDaysBetweenDates';
import {ReportService} from '@app/core/report.service';
import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {BrowserService} from '@app/shared/services/browser.service';
import {
    DateRangeSelectorBaseComponent
} from '@app/shared/component/date-range-selectors/date-range-selector-base.component';
import {CustomPreset} from '@app/shared/component/date-range-selectors/presets';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {take} from 'rxjs/operators';
import {SharedComponent} from '@app/shared/component/shared.component';
import {ReloadServices} from '@app/shared/services/reload.services';

declare var $: any;

@Component({
    templateUrl: './financialManagement-creditsCard-aggregate.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementCreditsCardAggregateComponent
    extends ReloadServices
    implements OnDestroy, AfterViewInit {
    public filterTypesVal: any = null;
    public filterTypesCategory: any = null;
    public filterPaymentTypesCategory: any = null;
    public accountBalance: number;
    public creditLimit: number;
    public balanceUse: number;
    public accountSelectExchange: any = false;
    public accountSelectInDeviation: any = false;
    public accountSelectOneNotUpdate: any = false;
    public dataTableInside: any[] = [];
    public dataTable: any[] = [];
    public dataTableAll: any[] = [];
    @Input() counter: any = 10;
    public filterInput = new FormControl();
    public paymentTyps: any[];
    public transTypeName: any[];
    public sortPipeDir: any = null;
    public loader = false;
    public sortableIdGr: any[];
    public subscription: Subscription;
    @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport;
    @ViewChild(CdkVirtualForOf, {static: true}) private virtualForOf: CdkVirtualForOf<any[]>;
    @ViewChild('aggregate', {read: ElementRef}) accountsListRef: ElementRef;
    @ViewChildren('cardHandle', {read: ElementRef})
    cardHandlesRef: QueryList<ElementRef>;
    cardHandlesScrollIndex: number = 0;

    private range: { dateFrom: Date; dateTill: Date };
    private rangeVirtual: any;
    public window: any = window;

    private _hoverOn: { item: any; childIndex: number };
    get hoverOn(): { item: any; childIndex: number } {
        return this._hoverOn;
    }

    @Input() set hoverOn(val: { item: any; childIndex: number }) {
        this._hoverOn = val;

        if (!this.hoverOn) {
            this.hoverOnAsChartData = null;
            return;
        }

        this.hoverOnAsChartData = {
            seriesIndex: 1,
            pointIndex:
                getMonthCountBetweenIncluded(this.range.dateFrom, this.range.dateTill) -
                val.childIndex
        };
    }

    @Input() hoverOnAsChartData: { seriesIndex: number; pointIndex: number };

    reportMailSubmitterToggle = false;
    public nav = {
        prev: false,
        next: false
    };

    private readonly CURRENCIES_ORDER = ['ILS', 'USD', 'EUR'];
    CLS:any;
    constructor(
        public translate: TranslateService,
        private customersFinancialManagementCreditsCardComponent: CustomersFinancialManagementCreditsCardComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        public browserDetect: BrowserService,
        private storageService: StorageService,
        private router: Router,
        private route: ActivatedRoute,
        public override sharedComponent: SharedComponent,
        private datePipe: DatePipe,
        private reportService: ReportService,
        private todayRelativeHumanizePipe: TodayRelativeHumanizePipe,
        private currencySymbol: CurrencySymbolPipe
    ) {
        super(sharedComponent);

        // if (this.userService.appData.userData.creditCards) {
        // } else {
        //     this.subscription = customersFinancialManagementCreditsCardComponent.getDataCardsEvent.subscribe((value) => {
        //     });
        // }
    }

    override reload() {
        console.log('reload child');
        this.getCreditCardTazrimSummary();
    }

    ngAfterViewInit() {
        this.virtualForOf.viewChange.subscribe((range: any) => this.rangeVirtual = range);
    }

    getCreditCardTazrimSummary(): void {
        this.loader = true;
        let arrCards = [];
        this.userService.appData.userData.creditCards.forEach((id) => {
            const cards = id.children
                .filter((card) => {
                    return card.check;
                })
                .map((card) => card.creditCardId);
            arrCards = arrCards.concat(cards);
        });
        this.range = {
            // dateFrom: new Date(new Date().getFullYear(), new Date().getMonth() - 10, 1),
            // dateTill: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0)
            dateFrom: this.userService.appData
                .moment()
                .subtract(10, 'months')
                .startOf('month')
                .toDate(),
            dateTill: this.userService.appData
                .moment()
                .add(1, 'months')
                .endOf('month')
                .toDate()
        };
        // this.range.monthsBetween = getMonthCountBetweenIncluded(this.range.dateFrom, this.range.dateTill);

        // this.normalizeData(null, this.range.dateFrom, this.range.dateTill);
        this.sharedService
            .getCreditCardTazrimSummary({
                creditCardIds: arrCards,
                dateFrom: this.range.dateFrom,
                dateTill: this.range.dateTill
            })
            .subscribe(
                (response: any) => {
                    const data = response
                        ? this.normalizeData(
                            response['body'],
                            this.range.dateFrom,
                            this.range.dateTill
                        )
                        : response;
                    data.forEach((key, idx, arr) => {
                        let cardFilter: any = {};
                        this.userService.appData.userData.creditCards.forEach((card) => {
                            const cardIsFilter = card.children.filter((car) => {
                                return key.creditCardId === car.creditCardId;
                            })[0];
                            if (cardIsFilter) {
                                cardFilter = cardIsFilter;
                            }
                        });
                        arr[idx] = Object.assign(cardFilter, key);
                        arr[idx].accountNickname = this.getInfoAcc(
                            arr[idx].companyAccountId,
                            'accountNickname'
                        );
                        arr[idx].currency = AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY;
                        arr[idx].outdatedBecauseNotFound =
                            !arr[idx].balanceIsUpToDate &&
                            arr[idx].alertStatus === 'Not found in bank website';
                        // this.getInfoAcc(arr[idx].companyAccountId, 'currency');
                        const arrSeries: any = [
                            {
                                stack: 'a',
                                showInLegend: false,
                                enableMouseTracking: false,
                                color: '#edf0f2',
                                data: []
                            },
                            {
                                stack: 'a',
                                data: [],
                                states: {
                                    select: {
                                        color: '#343C47'
                                    }
                                }
                            }
                        ];
                        const maxVal = Math.max.apply(
                            null,
                            key.monthSummaries.map((val) =>
                                Array.isArray(val.monthlyTotal) && val.monthlyTotal.length > 0
                                    ? val.monthlyTotal[0].total
                                    : null
                            )
                        );
                        let minVal = Math.min.apply(
                            null,
                            key.monthSummaries.map((val) =>
                                Array.isArray(val.monthlyTotal) && val.monthlyTotal.length > 0
                                    ? val.monthlyTotal[0].total
                                    : null
                            )
                        );
                        if (minVal > 0) {
                            minVal = 0;
                        }

                        // console.log('idx: %o, nick: %o, min: %o, max: %o',
                        //   idx, arr[idx].accountNickname, minVal, maxVal);

                        key.monthSummaries.forEach((val) => {
                            if (Array.isArray(val.monthlyTotal)) {
                                val.monthlyTotal.sort((a, b) => {
                                    const aIdx = this.CURRENCIES_ORDER.indexOf(a[0]),
                                        bIdx = this.CURRENCIES_ORDER.indexOf(b[0]);
                                    if (aIdx < 0 && aIdx < 0 === bIdx < 0) {
                                        return 0;
                                    } else if (aIdx < 0) {
                                        return 1;
                                    } else if (bIdx < 0) {
                                        return -1;
                                    } else {
                                        return aIdx - bIdx;
                                    }
                                });
                            }
                            const dfltCurrencyTotal =
                                Array.isArray(val.monthlyTotal) && val.monthlyTotal.length > 0
                                    ? val.monthlyTotal[0]
                                    : null;

                            arrSeries[0].data.push({
                                color: '#edf0f2',
                                y:
                                    maxVal -
                                    (dfltCurrencyTotal !== null ? dfltCurrencyTotal.total : 0)
                            });

                            arrSeries[1].data.push({
                                color:
                                    dfltCurrencyTotal === null || !dfltCurrencyTotal.notFinal
                                        ? '#73879e'
                                        : {
                                            linearGradient: {
                                                x1: '4%',
                                                x2: '5%',
                                                y1: '18%',
                                                y2: '24%',
                                                spreadMethod: 'repeat'
                                            },
                                            stops: [
                                                ['0%', '#f4cb08'],
                                                ['50%', '#edf0f2']
                                            ]
                                        },
                                y: dfltCurrencyTotal !== null ? dfltCurrencyTotal.total : null
                            });
                        });
                        const xAxiscategories = key.monthSummaries.map((val) => {
                            return this.datePipe.transform(val.month, 'MM');
                        });
                        arr[idx].monthSummaries.sort(function (a, b) {
                            return a['month'] < b['month'] ? 1 : -1;
                        });

                        arr[idx].chartData = {
                            column: true,
                            dataLabelsEnabled: false,
                            gridLineWidth: 0,
                            markerEnabled: false,
                            crosshair: false,
                            xAxiscategories: xAxiscategories,
                            series: arrSeries,
                            max: Math.ceil(maxVal),
                            min: minVal
                        };
                    });

                    const sortableIdGr =
                        this.storageService.sessionStorageGetterItem('sortableIdGrCards');
                    if (sortableIdGr !== null && sortableIdGr !== 'null') {
                        this.sortableIdGr = JSON.parse(sortableIdGr);
                        data.sort(
                            (a, b) =>
                                this.sortableIdGr.indexOf(a.creditCardId) -
                                this.sortableIdGr.indexOf(b.creditCardId)
                        );
                    }
                    this.sortableIdGr = data.map((card) => {
                        return card.creditCardId;
                    });
                    this.storageService.sessionStorageSetter(
                        'sortableIdGrCards',
                        JSON.stringify(this.sortableIdGr)
                    );

                    this.userService.appData.userData.creditCardsDetails = data;
                    // let idxOld;
                    // (<any>$('#sortable'))
                    //     .sortable({
                    //         items: 'li:not(.p-disabled)',
                    //         handle: '.topTitles',
                    //         axis: 'x',
                    //         // scroll: false,
                    //         tolerance: 'pointer',
                    //         scrollSensitivity: 100,
                    //         scrollSpeed: 100,
                    //         start: (e, ui) => {
                    //             idxOld = ui.item.index();
                    //         },
                    //         update: (event, ui) => {
                    //             this.sortableIdGr = this.arrayMove(
                    //                 this.sortableIdGr,
                    //                 idxOld,
                    //                 ui.item.index()
                    //             );
                    //             this.storageService.sessionStorageSetter(
                    //                 'sortableIdGrCards',
                    //                 JSON.stringify(this.sortableIdGr)
                    //             );
                    //             idxOld = undefined;
                    //             setTimeout(() => {
                    //                 this.checkNavScroll();
                    //             }, 600);
                    //         }
                    //     })
                    //     .disableSelection();
                    // setTimeout(() => {
                    //     this.checkNavScroll();
                    // }, 600);
                    this.loader = false;
                },
                (err: HttpErrorResponse) => {
                    if (err.error instanceof Error) {
                        console.log('An error occurred:', err.error.message);
                    } else {
                        console.log(
                            `Backend returned code ${err.status}, body was: ${err.error}`
                        );
                    }
                }
            );
    }

    drop(event: CdkDragDrop<string[]>) {
        // const creditCardsDetails = this.arrayMove(
        //     this.userService.appData.userData.creditCardsDetails,
        //     event.previousIndex,
        //     event.currentIndex
        // );
        // moveItemInArray(this.userService.appData.userData.creditCardsDetails, event.previousIndex, event.currentIndex);
        // const vsStartIndex = this.viewPort.getRenderedRange().start;
        // moveItemInArray(this.userService.appData.userData.creditCardsDetails, event.previousIndex + vsStartIndex, event.currentIndex + vsStartIndex);
        // setTimeout(()=>{
        //     this.userService.appData.userData.creditCardsDetails = creditCardsDetails;
        //     console.log(creditCardsDetails)
        // }, 4000)

        // moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        // this.userService.appData.userData.creditCardsDetails = [...this.userService.appData.userData.creditCardsDetails];



        // add the number of first missing elements in virtual scroll
        // dynamic array
        const PREV_IND_WITH_OFFSET: number = this.rangeVirtual.start + event.previousIndex;
        const CUR_IND_WITH_OFFSET: number = this.rangeVirtual.start + event.currentIndex;
        moveItemInArray(this.userService.appData.userData.creditCardsDetails, PREV_IND_WITH_OFFSET, CUR_IND_WITH_OFFSET);
        this.userService.appData.userData.creditCardsDetails = [...this.userService.appData.userData.creditCardsDetails];
        this.sortableIdGr = this.arrayMove(
            this.sortableIdGr,
            PREV_IND_WITH_OFFSET,
            CUR_IND_WITH_OFFSET
        );
        this.storageService.sessionStorageSetter(
            'sortableIdGrCards',
            JSON.stringify(this.sortableIdGr)
        );
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

    arrayMove(arr: any[], old_index: number, new_index: number): any[] {
        while (old_index < 0) {
            old_index += arr.length;
        }
        while (new_index < 0) {
            new_index += arr.length;
        }
        if (new_index >= arr.length) {
            let k = new_index - arr.length + 1;
            while (k--) {
                arr.push(undefined);
            }
        }
        arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
        return arr;
    }


    public stepCard(dir: number, evnt: any): void {
        if (this.viewPort['_totalContentSize'] > this.viewPort['_viewportSize']) {
            // const idx = this.cardHandlesScrollIndex + dir;
            // const new_index:any = idx < 0 ? 0 : idx + 1 > this.userService.appData.userData.creditCardsDetails.length ? this.userService.appData.userData.creditCardsDetails.length - 1 : idx;
            // this.cardHandlesScrollIndex = new_index;

            if (dir === 1) {
                const measureScrollOffsetEnd = this.viewPort.measureScrollOffset('end');
                if (measureScrollOffsetEnd > 25) {
                    // const nextIndex:any = idx + 1 > this.userService.appData.userData.creditCardsDetails.length ? this.userService.appData.userData.creditCardsDetails.length - 1 : idx;
                    this.cardHandlesScrollIndex = this.cardHandlesScrollIndex + 1;
                    this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth');
                }
            }
            if (dir === -1) {
                if (this.viewPort.measureScrollOffset('right') > 505) {
                    // const prevIndex:any = idx < 0 ? 0 : idx;
                    this.cardHandlesScrollIndex = this.cardHandlesScrollIndex - 1;
                    this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth')
                }
            }
            // this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth')
            // this.scrollIntoViewCardAt(+evnt.target.getAttribute('tabindex') + dir);
        }
    }

    nextScroll(elem: any) {
        // const visibleIndices = this.findVisibleCardIndices();
        // let scrollToIndex = visibleIndices[visibleIndices.length - 1].tabindex;
        // if (visibleIndices[visibleIndices.length - 1].fullyVisible) {
        //     scrollToIndex += 1;
        // }
        // console.log(
        //     'nextScroll: visibleIndices -> %o will scroll to: %o',
        //     visibleIndices,
        //     scrollToIndex
        // );
        // this.viewPort.scrollToIndex(scrollToIndex, 'smooth')
        // const end = this.viewPort.getRenderedRange().end;
        // const total = this.viewPort.getDataLength();
        const measureScrollOffsetEnd = this.viewPort.measureScrollOffset('end');
        if (measureScrollOffsetEnd > 25) {
            const idx = this.cardHandlesScrollIndex + 1;
            // const nextIndex:any = idx + 1 > this.userService.appData.userData.creditCardsDetails.length ? this.userService.appData.userData.creditCardsDetails.length - 1 : idx;
            this.cardHandlesScrollIndex = idx;
            this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth');
        }
        // console.log(end, total, measureScrollOffsetEnd)
        // this.scrollIntoViewCardAt(scrollToIndex);
        // this.scrollTo(elem, -1040, 200);
    }

    prevScroll(elem: any) {
        // const visibleIndices = this.findVisibleCardIndices();
        // let scrollToIndex = visibleIndices[0].tabindex;
        // if (
        //     visibleIndices[0].fullyVisible &&
        //     (this.browserDetect.browserDetect.browser === 'Chrome' ||
        //         this.browserDetect.browserDetect.browser === 'Mozilla' ||
        //         this.browserDetect.browserDetect.browser === 'Edge')
        // ) {
        //     scrollToIndex -= 1;
        // }

        // console.log(
        //     'nextScroll: visibleIndices -> %o will scroll to: %o',
        //     visibleIndices,
        //     scrollToIndex
        // );
        if (this.viewPort.measureScrollOffset('right') > 505) {
            const idx = this.cardHandlesScrollIndex - 1;
            // const prevIndex:any = idx < 0 ? 0 : idx;
            this.cardHandlesScrollIndex = idx;
            this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth')
        }
        // this.scrollIntoViewCardAt(scrollToIndex, 'start');
        // this.scrollTo(elem, 1040, 200);
    }

    checkNavScroll() {
        // const elem = this.accountsListRef.nativeElement;
        // const browser = this.browserDetect.browserDetect.browser;
        // this.nav.prev = false;
        // this.nav.next = false;
        //
        // if (elem.scrollWidth <= elem.clientWidth) {
        //     console.log('Not have scroll');
        //     this.nav.prev = false;
        //     this.nav.next = false;
        // } else {
        //     this.nav.prev = true;
        //     this.nav.next = true;
        //     if (
        //         (browser === 'Edge' || browser === 'Chrome') &&
        //         elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth + 15
        //     ) {
        //         console.log('Edge Left');
        //         this.nav.prev = true;
        //         this.nav.next = false;
        //     }
        //
        //     if (elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth) {
        //         if (browser === 'Mozilla') {
        //             console.log('Edge Left');
        //             this.nav.prev = true;
        //             this.nav.next = false;
        //         }
        //     }
        //
        //     if (elem.scrollWidth + Math.abs(elem.scrollLeft) === elem.clientWidth) {
        //         if (browser === 'Firefox') {
        //             console.log('Edge Left');
        //             this.nav.prev = true;
        //             this.nav.next = false;
        //         }
        //     }
        //
        //     if (Math.abs(elem.scrollLeft) === 0) {
        //         if (browser === 'Mozilla' || browser === 'Edge') {
        //             console.log('Edge Right');
        //             this.nav.prev = false;
        //             this.nav.next = true;
        //         }
        //         if (browser === 'Chrome') {
        //             console.log('Edge Left');
        //             this.nav.prev = false;
        //             this.nav.next = true;
        //         }
        //         if (browser === 'Firefox') {
        //             console.log('Edge Right');
        //             this.nav.prev = false;
        //             this.nav.next = true;
        //         }
        //     }
        // }
    }

    //
    // scrollTo(elem: any, xScroll: number, scrollDuration: any): void {
    //   const scrollStep: any = (xScroll / (scrollDuration / 15));
    //   const fullStep: any = elem.scrollLeft - ((xScroll < 0) ? Math.abs(xScroll) : -xScroll);
    //   const scrollInterval = setInterval(() => {
    //     if ((scrollStep > 0 && ((elem.scrollWidth - elem.offsetWidth) === elem.scrollLeft)) || scrollStep < 0 && elem.scrollLeft === 0) {
    //       clearInterval(scrollInterval);
    //     } else if ((scrollStep < 0 && elem.scrollLeft > fullStep) || (scrollStep > 0 && elem.scrollLeft < fullStep)) {
    //       elem.scrollBy(scrollStep, 0);
    //     } else {
    //       clearInterval(scrollInterval);
    //     }
    //   }, 15);
    // }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.destroy();
    }

    private normalizeData(response: any, from: Date, till: Date): any {
        if (!(response instanceof Array)) {
            return response;
        }

        let run = from;
        const months = [];
        do {
            // console.log('run ===> %o', run);
            months.push(new Date(run));
            run = new Date(run.setMonth(run.getMonth() + 1, 1));
        } while (run < till);

        // console.log('months: %o', months);

        response.forEach((ccData) => {
            if (ccData.monthSummaries == null) {
                ccData.monthSummaries = [];
            }

            months.forEach((monAnchor, idx) => {
                if (
                    idx === ccData.monthSummaries.length ||
                    !ccData.monthSummaries[idx] ||
                    !ccData.monthSummaries[idx].month ||
                    new Date(ccData.monthSummaries[idx].month).getMonth() !==
                    monAnchor.getMonth()
                ) {
                    // console.log('normalizing... found: %o where %o expected',
                    //   ccData.monthSummaries[idx] && ccData.monthSummaries[idx].month
                    //   ? new Date(ccData.monthSummaries[idx].month) : 'nothing',
                    //   monAnchor);

                    ccData.monthSummaries.splice(idx, 0, {
                        month: monAnchor.getTime(),
                        monthlyTotal: null,
                        notFinal: null // idx > 0 ? ccData.monthSummaries[idx - 1].notFinal : null
                    });
                }
            });
        });

        return response;
    }

    goToFinancialManagementCreditsCardDetailsComponent(
        card: any,
        monthSummary: any
    ): void {
        // console.log('Called goToFinancialManagementCreditsCardDetailsComponent with %o, %o', card, monthSummary);
        const anchorDt = new Date(monthSummary.month);

        this.storageService.sessionStorageSetter(
            DateRangeSelectorBaseComponent.storageKey(this.route, 'details'),
            JSON.stringify(
                CustomPreset.createMonthsPreset(
                    anchorDt.getMonth(),
                    anchorDt.getFullYear()
                )
            )
        );
        // this.storageService.sessionStorageSetter(AccountDatesComponent.storageKey(this.route, 'details'), JSON.stringify({
        //     selectedValue: '1',
        //     dates: {
        //         untilValue: 1,
        //         selectedValueFromMonth: anchorDt.getMonth(),
        //         selectedValueFromYear: anchorDt.getFullYear(),
        //         selectedValueUntilMonth: anchorDt.getMonth(),
        //         selectedValueUntilYear: anchorDt.getFullYear()
        //     }
        // }));
        this.storageService.sessionStorageSetter(
            CardsSelectComponent.storageKey(this.route, 'details'),
            JSON.stringify([card.creditCardId])
        );

        this.router.navigate(['../details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    trackById(index: number, row: any): string {
        return row.creditCardId;
    }


    private scrollIntoViewCardAt(idx: number, inline = 'end'): void {
        if (idx <= 0 || idx > this.cardHandlesRef.length) {
            return;
        }
        // const cardHandlesArr = this.cardHandlesRef.toArray();
        // if (idx < 0) {
        //   idx = cardHandlesArr.length - 1;
        // } else if (idx === cardHandlesArr.length) {
        //   idx = 0;
        // }

        const evntAccHandle: any = this.cardHandlesRef.find(
            (ccH) => +ccH.nativeElement.getAttribute('tabindex') === idx
        );

        if (evntAccHandle) {
            console.log('scrolling to %o', idx);
            requestAnimationFrame(() => {
                evntAccHandle.nativeElement.focus({preventScroll: true});
                evntAccHandle.nativeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: inline
                });
                setTimeout(() => {
                    this.checkNavScroll();
                }, 600);
            });
        }
    }

    private findVisibleCardIndices(): any[] {
        const indices = this.cardHandlesRef
            .filter((ccH) => {
                if (!ccH.nativeElement.offsetParent) {
                    return false;
                }
                const viewportWidth = ccH.nativeElement.offsetParent.scrollWidth;
                const ccRect = ccH.nativeElement.getBoundingClientRect();
                // console.log('%o -> %o, viewportWidth: %o',
                //   +ccH.nativeElement.getAttribute('tabindex'),
                //   ccRect,
                //   viewportWidth);
                return (
                    (ccRect.left >= 0 && ccRect.left < viewportWidth) ||
                    (ccRect.right > 0 && ccRect.right <= viewportWidth) ||
                    (ccRect.left < 0 && ccRect.right > viewportWidth)
                );
            })
            .map((ccH) => {
                const viewportWidth = ccH.nativeElement.offsetParent.scrollWidth;
                const ccRect = ccH.nativeElement.getBoundingClientRect();

                return {
                    tabindex: +ccH.nativeElement.getAttribute('tabindex'),
                    fullyVisible: ccRect.left >= 0 && ccRect.right <= viewportWidth + 8
                };
            });

        indices.sort((a, b) => a.tabindex - b.tabindex);
        return indices;
    }

    sortedIndexOf(ccItem: any): number {
        if (!this.sortableIdGr || !ccItem.creditCardId) {
            return -1;
        }

        return this.sortableIdGr.indexOf(ccItem.creditCardId) + 1;
    }

    setCreditLimitAtCard(item: any, $event: number): void {
        const oldValue = item.creditLimit;
        item.creditLimit = $event;

        this.sharedService.updateCreditCard(item).subscribe({
            next: (updateRslt) => {
                if (updateRslt.error) {
                    item.creditLimit = oldValue;
                    return;
                }

                this.sharedService
                    .getCreditCardDetails(
                        this.userService.appData.userData.accounts.map((id) => {
                            return {uuid: id.companyAccountId};
                        })
                    )
                    .subscribe((ccDetailsRslt) => {
                        if (Array.isArray(ccDetailsRslt.body)) {
                            const currCardsMap =
                                this.userService.appData.userData.creditCards.reduce(
                                    (aggr, ccgr) => {
                                        ccgr.children.forEach(
                                            (ccInAcc) => (aggr[ccInAcc.creditCardId] = ccInAcc)
                                        );
                                        return aggr;
                                    },
                                    Object.create(null)
                                );
                            ccDetailsRslt.body
                                .filter((cc) => currCardsMap[cc.creditCardId])
                                .forEach((cc) =>
                                    Object.assign(currCardsMap[cc.creditCardId], cc)
                                );
                        }

                        this.getCreditCardTazrimSummary();
                    });
            },
            error: () => {
                item.creditLimit = oldValue;
            }
        });
    }

    private reportParamsFromCurrentView(reportType?: string): any {
        const creditCardsData =
            this.userService.appData.userData.creditCardsDetails.map((item) => {
                return {
                    accountUuid: item.creditCardId,
                    accountNickname: item.accountNickname,
                    creditLimit:
                        item.creditLimit === 0 || item.creditLimit ? item.creditLimit : '',
                    availableCredit:
                        item.availableCredit === 0 || item.availableCredit
                            ? item.availableCredit
                            : '',
                    cycleDay: item.cycleDay
                        ? item.cycleDay +
                        ' ' +
                        this.translate.instant('sumsTitles.ofTheMonth')
                        : this.translate.instant('sumsTitles.notReached'),
                    creditCardNickname:
                        this.translate.instant('creditCards.' + item.creditCardTypeId) +
                        '\n' +
                        item.creditCardNo +
                        (!item.bankLoaded
                            ? '(' + this.translate.instant('sumsTitles.nonBank') + ')'
                            : ''),
                    message:
                        item.balanceOutdatedDays > 0
                            ? this.translate.instant('sumsTitles.notUpdates') +
                            '\n' +
                            this.translate.instant('sumsTitles.lastUpdate') +
                            ' ' +
                            this.todayRelativeHumanizePipe.transform(
                                item.balanceLastUpdatedDate,
                                'days'
                            )
                            : null
                };
            });

        const additionalProperties = {
            reportDays:
                this.range.dateFrom.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    year: '2-digit',
                    month: '2-digit'
                }) +
                ' - ' +
                this.range.dateTill.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    year: '2-digit',
                    month: '2-digit'
                }),
            accountData: creditCardsData
        };

        return {
            additionalProperties: additionalProperties,
            data: {
                report: this.userService.appData.userData.creditCardsDetails.map(
                    (item) => {
                        // debugger
                        const clone = JSON.parse(JSON.stringify(item.monthSummaries));
                        clone.forEach((mon) => {
                            if (Array.isArray(mon.monthlyTotal)) {
                                mon.monthlyTotal.forEach(
                                    (mt) =>
                                        (mt.iskatHul = this.currencySymbol.transform(mt.iskatHul))
                                );
                            }
                        });
                        return {
                            creditCardId: item.creditCardId,
                            monthSummaries: clone
                        };
                    }
                )
            }
        };
    }

    exportTransactions(resultFileType: string = 'EXCEL'): void {
        this.reportService
            .getReport(
                'CREDIT_CARD_TRANS_AGGREGATED',
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
            this.translate.instant(
                'menu.customers.financialManagement.creditsCard.main'
            ),
            'תצוגה מרוכזת',
            this.range.dateFrom.toLocaleDateString('en-GB', {
                day: 'numeric',
                year: '2-digit',
                month: '2-digit'
            }) +
            ' - ' +
            this.range.dateTill.toLocaleDateString('en-GB', {
                day: 'numeric',
                year: '2-digit',
                month: '2-digit'
            }),
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
            .emailReport('CREDIT_CARD_TRANS_AGGREGATED', request)
            .pipe(take(1))
            .subscribe((rslt) => {
                this.reportMailSubmitterToggle = false;
            });
    }
}
