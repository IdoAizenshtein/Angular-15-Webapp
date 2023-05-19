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
import {CustomersFinancialManagementSlikaComponent} from '../customers-financialManagement-slika.component';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {UserService} from '@app/core/user.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {HttpErrorResponse} from '@angular/common/http';

import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {DatePipe} from '@angular/common';
import {getMonthCountBetweenIncluded} from '@app/shared/functions/getDaysBetweenDates';
import {SolekSelectComponent} from '@app/shared/component/solek-select/solek-select.component';
import {ReportService} from '@app/core/report.service';
import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {BrowserService} from '@app/shared/services/browser.service';
import {
    DateRangeSelectorBaseComponent
} from '@app/shared/component/date-range-selectors/date-range-selector-base.component';
import {CustomPreset} from '@app/shared/component/date-range-selectors/presets';
import {take} from 'rxjs/operators';
import {ReloadServices} from '@app/shared/services/reload.services';
import {SharedComponent} from '@app/shared/component/shared.component';
import {CdkDragDrop, moveItemInArray} from "@angular/cdk/drag-drop";
import {CdkVirtualForOf, CdkVirtualScrollViewport} from "@angular/cdk/scrolling";

declare var $: any;

@Component({
    templateUrl: './financialManagement-slika-aggregate.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementSlikaAggregateComponent
    extends ReloadServices
    implements OnDestroy, AfterViewInit {
    public loader = false;
    public sortableIdGr: any[];
    public subscription: Subscription;
    public nav = {
        prev: false,
        next: false
    };
    @ViewChild('aggregate', {read: ElementRef}) accountsListRef: ElementRef;
    @ViewChildren('cardHandle', {read: ElementRef})
    cardHandlesRef: QueryList<ElementRef>;

    private range: { dateFrom: Date; dateTill: Date };

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
    @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport;
    @ViewChild(CdkVirtualForOf, {static: true}) private virtualForOf: CdkVirtualForOf<any[]>;
    private rangeVirtual: any;
    public window: any = window;
    cardHandlesScrollIndex: number = 0;


    constructor(
        public translate: TranslateService,
        private customersFinancialManagementSlikaComponent: CustomersFinancialManagementSlikaComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private storageService: StorageService,
        private router: Router,
        private route: ActivatedRoute,
        private datePipe: DatePipe,
        public browserDetect: BrowserService,
        public override sharedComponent: SharedComponent,
        private todayRelativeHumanizePipe: TodayRelativeHumanizePipe,
        private reportService: ReportService
    ) {
        super(sharedComponent);

        // if (this.userService.appData.userData.slika) {
        //     // this.getSlikaSummary();
        // } else {
        //     // this.subscription = customersFinancialManagementSlikaComponent.getDataSolekEvent.subscribe(() => {
        //     //     this.getSlikaSummary();
        //     // });
        // }
    }

    override reload() {
        console.log('reload child');
        this.getSlikaSummary();
    }

    ngAfterViewInit() {
        this.virtualForOf.viewChange.subscribe((range: any) => this.rangeVirtual = range);
    }

    getSlikaSummary(): void {
        this.loader = true;
        const selectedSolkim = this.userService.selectedSolkim();
        if (selectedSolkim.length) {
            this.range = {
                dateFrom: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() - 8,
                    1
                ),
                dateTill: new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() + 4,
                    0
                )
            };

            const arrSoleks = selectedSolkim.map((solek) => solek.solekNum);
            const arrCompanyAccountIds = selectedSolkim.map(
                (solek) => solek.companyAccountId
            );
            this.sharedService
                .getSlikaSummary({
                    companyAccountIds: arrCompanyAccountIds,
                    solekNums: arrSoleks,
                    dateFrom: this.range.dateFrom.toISOString(),
                    dateTill: this.range.dateTill.toISOString()
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
                        // let data = (response) ? response['body'] : response;
                        // debugger
                        data.forEach((key, idx, arr) => {
                            let cardFilter: any = {};
                            this.userService.appData.userData.slika.forEach((solek) => {
                                const cardIsFilter = solek.children.filter((car) => {
                                    return key.solekNum === car.solekNum;
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
                            arr[idx].currency = this.getInfoAcc(
                                arr[idx].companyAccountId,
                                'currency'
                            );
                            arr[idx].outdatedBecauseNotFound =
                                !arr[idx].balanceIsUpToDate &&
                                arr[idx].alertStatus === 'Not found in bank website';
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
                                key.monthlyTotals.map((val) => val.monthlyTotal)
                            );
                            let minVal = Math.min.apply(
                                null,
                                key.monthlyTotals.map((val) => val.monthlyTotal)
                            );
                            if (minVal > 0) {
                                minVal = 0;
                            }

                            key.monthlyTotals.forEach((val) => {
                                arrSeries[0].data.push({
                                    color: '#edf0f2',
                                    y: maxVal - val.monthlyTotal
                                });

                                arrSeries[1].data.push({
                                    color: !val.notFinal
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
                                    y: val.monthlyTotal
                                });
                            });
                            const xAxiscategories = key.monthlyTotals.map((val) => {
                                return this.datePipe.transform(val.cycleDate, 'MM');
                            });

                            // key.monthlyTotals.forEach((val, index) => {
                            //   monthlyTotals.forEach((val1, index1) => {
                            //     const cycleDate = new Date(val1.cycleDate);
                            //     const cycleDateThis = new Date(val.cycleDate);
                            //     if (cycleDate.getFullYear() === cycleDateThis.getFullYear() && cycleDate.getMonth() === cycleDateThis.getMonth()) {
                            //       monthlyTotals[index1].cycleDate = val.cycleDate;
                            //       monthlyTotals[index1].monthlyTotal = val.monthlyTotal;
                            //       monthlyTotals[index1].notFinal = val.notFinal;
                            //       arrSeries[0].data[index1].color = '#edf0f2';
                            //       arrSeries[0].data[index1].y = maxVal - val.monthlyTotal;
                            //       arrSeries[1].data[index1].color = (!val.notFinal) ? '#73879e' : {
                            //         linearGradient: {
                            //           x1: '4%',
                            //           x2: '5%',
                            //           y1: '18%',
                            //           y2: '24%',
                            //           spreadMethod: 'repeat'
                            //         },
                            //         stops: [
                            //           ['0%', '#f4cb08'],
                            //           ['50%', '#edf0f2']
                            //         ]
                            //       };
                            //       arrSeries[1].data[index1].y = val.monthlyTotal;
                            //     }
                            //   });
                            // });
                            //
                            // arr[idx].monthlyTotals = monthlyTotals;

                            arr[idx].monthlyTotals.sort(function (a, b) {
                                return a['cycleDate'] < b['cycleDate'] ? 1 : -1;
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
                            this.storageService.sessionStorageGetterItem('sortableIdGrSolek');
                        if (sortableIdGr !== null && sortableIdGr !== 'null') {
                            this.sortableIdGr = JSON.parse(sortableIdGr);
                            data.sort(
                                (a, b) =>
                                    this.sortableIdGr.indexOf(a.solekNum) -
                                    this.sortableIdGr.indexOf(b.solekNum)
                            );
                        }
                        this.sortableIdGr = data.map((card) => {
                            return card.solekNum;
                        });
                        this.storageService.sessionStorageSetter(
                            'sortableIdGrSolek',
                            JSON.stringify(this.sortableIdGr)
                        );

                        this.userService.appData.userData.soleksDetails = data;
                        // let idxOld;
                        // (<any>$('#sortable'))
                        //   .sortable({
                        //     items: 'li:not(.p-disabled)',
                        //     handle: '.topTitles',
                        //     axis: 'x',
                        //     // scroll: false,
                        //     tolerance: 'pointer',
                        //     scrollSensitivity: 100,
                        //     scrollSpeed: 100,
                        //     start: (e, ui) => {
                        //       idxOld = ui.item.index();
                        //     },
                        //     update: (event, ui) => {
                        //       this.sortableIdGr = this.arrayMove(
                        //         this.sortableIdGr,
                        //         idxOld,
                        //         ui.item.index()
                        //       );
                        //       this.storageService.sessionStorageSetter(
                        //         'sortableIdGrSolek',
                        //         JSON.stringify(this.sortableIdGr)
                        //       );
                        //       idxOld = undefined;
                        //       setTimeout(() => {
                        //         this.checkNavScroll();
                        //       }, 600);
                        //     }
                        //   })
                        //   .disableSelection();
                        // setTimeout(() => {
                        //   this.checkNavScroll();
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
        } else {
            this.userService.appData.userData.soleksDetails = [];
            this.loader = false;
        }
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

    // nextScroll(elem: any) {
    //   this.scrollTo(elem, -1040, 200);
    // }
    //
    // prevScroll(elem: any) {
    //   this.scrollTo(elem, 1040, 200);
    // }
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
        moveItemInArray(this.userService.appData.userData.soleksDetails, PREV_IND_WITH_OFFSET, CUR_IND_WITH_OFFSET);
        this.userService.appData.userData.soleksDetails = [...this.userService.appData.userData.soleksDetails];
        this.sortableIdGr = this.arrayMove(
            this.sortableIdGr,
            PREV_IND_WITH_OFFSET,
            CUR_IND_WITH_OFFSET
        );
        this.storageService.sessionStorageSetter(
            'sortableIdGrSolek',
            JSON.stringify(this.sortableIdGr)
        );
    }

    trackById(index: number, row: any): string {
        return row.solekNum;
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

        const evntAccHandle = this.cardHandlesRef.find(
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
                    fullyVisible: ccRect.left >= 0 && ccRect.right <= viewportWidth
                };
            });

        indices.sort((a, b) => a.tabindex - b.tabindex);
        return indices;
    }

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
            if (ccData.monthlyTotals == null) {
                ccData.monthlyTotals = [];
            }

            ccData.monthlyTotals.sort(function (a, b) {
                return a['cycleDate'] < b['cycleDate'] ? -1 : 1;
            });

            months.forEach((monAnchor, idx) => {
                if (
                    idx === ccData.monthlyTotals.length ||
                    !ccData.monthlyTotals[idx] ||
                    !ccData.monthlyTotals[idx].cycleDate ||
                    new Date(ccData.monthlyTotals[idx].cycleDate).getMonth() !==
                    monAnchor.getMonth()
                ) {
                    // console.log('normalizing... found: %o where %o expected',
                    //   ccData.monthlyTotals[idx] && ccData.monthlyTotals[idx].cycleDate
                    //   ? new Date(ccData.monthlyTotals[idx].cycleDate) : 'nothing',
                    //   monAnchor);

                    ccData.monthlyTotals.splice(idx, 0, {
                        cycleDate: monAnchor.getTime(),
                        monthlyTotal: null,
                        notFinal: null // idx > 0 ? ccData.monthlyTotals[idx - 1].notFinal : null
                    });
                }
            });
        });

        return response;
    }

    goToFinancialManagementSlikaDetailsComponent(
        solek: any,
        monthSummary: any
    ): void {
        this.sharedComponent.mixPanelEvent('all transes');

        // console.log('Called goToFinancialManagementCreditsCardDetailsComponent with %o, %o', card, monthSummary);
        const anchorDt = new Date(monthSummary.cycleDate);
        this.storageService.sessionStorageSetter(
            DateRangeSelectorBaseComponent.storageKey(this.route, 'details'),
            JSON.stringify(
                CustomPreset.createMonthsPreset(
                    anchorDt.getMonth(),
                    anchorDt.getFullYear()
                )
            )
        );
        this.storageService.sessionStorageSetter(
            SolekSelectComponent.storageKey(this.route, 'details'),
            JSON.stringify([solek.companyAccountId + solek.solekNum])
        );

        this.router.navigate(['../details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    private reportParamsFromCurrentView(reportType?: string): any {
        const solekData = this.userService.selectedSolkim().map((item) => {
            return {
                solekNum: item.solekNum,
                solekBankId: item.solekBankId,
                message:
                    item.balanceOutdatedDays > 0
                        ? this.translate.instant('sumsTitles.notUpdates') +
                        '\n' +
                        this.translate.instant('sumsTitles.lastUpdate') +
                        ' ' +
                        this.todayRelativeHumanizePipe.transform(
                            item.ballanceLastUpdatedDate,
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
            solekData: solekData
        };

        return {
            additionalProperties: additionalProperties,
            data: {
                report: this.userService.appData.userData.soleksDetails.map((item) => {
                    return {
                        solekNum: item.solekNum,
                        companyAccountIds: item.companyAccountIds,
                        monthlyTotals: item.monthlyTotals
                    };
                })
            }
        };
    }

    exportTransactions(resultFileType: string = 'EXCEL'): void {
        this.reportService
            .getReport(
                'SLIKA_AGGREGATED',
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
            .emailReport('SLIKA_AGGREGATED', request)
            .pipe(take(1))
            .subscribe((rslt) => {
                this.reportMailSubmitterToggle = false;
            });
    }
}
