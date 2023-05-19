import {
    AfterViewInit,
    Component,
    ElementRef,
    Input,
    OnDestroy,
    OnInit,
    QueryList,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {UserService} from '@app/core/user.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {FormControl} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {getDaysBetweenDates} from '@app/shared/functions/getDaysBetweenDates';

import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {ReportService} from '@app/core/report.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {AccountsDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/accounts-date-range-selector.component';
import {filter, take} from 'rxjs/operators';
import {Subscription} from 'rxjs';
import {DateRangeSelectorBaseComponent} from '@app/shared/component/date-range-selectors/date-range-selector-base.component';
import {CustomPreset} from '@app/shared/component/date-range-selectors/presets';
import {ReloadServices} from '@app/shared/services/reload.services';
import {CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

declare var $: any;

@Component({
    templateUrl: './financialManagement-bankAccount-aggregate.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementBankAccountAggregateComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    public filterTypesVal: any = null;
    public accountBalance: number;
    public creditLimit: number;

    get creditLimitAbs(): number {
        return Math.abs(this.creditLimit);
    }

    public balanceUse: number;

    public dataTableInside: any[] = [];
    public dataTable: any[] = [];
    public dataTableAll: any[] = [];
    public queryString = '';
    public entryLimit = 10;
    @Input() counter: any = 10;
    public filterInput = new FormControl();

    @ViewChild(AccountsDateRangeSelectorComponent)
    childDates: AccountsDateRangeSelectorComponent;
    // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;

    public transTypeName: any[];
    public sortPipeDir: any = null;
    public loader = false;
    public sortableIdGr: any[];
    private scrollEventHandleHelper: { lastHandleY: number; ticking: boolean } = {
        lastHandleY: 0,
        ticking: false
    };
    public nav = {
        prev: false,
        next: false
    };
    @ViewChildren('accountHandles', {read: ElementRef})
    accountHandlesRef: QueryList<ElementRef>;
    @ViewChild('aggregate', {read: ElementRef}) accountsListRef: ElementRef;

    showingUpdateCredentials = false;
    reportMailSubmitterToggle = false;

    dataTableInsideSub: Subscription;

    hoveredRow = -1;

    private bankTransAggregateSub: Subscription;
    // private bankTransTodaySub: Subscription;
    private selectedRangeSub: Subscription;
    private allTransactionsSub: Subscription;
    @ViewChild(CdkVirtualScrollViewport) viewPort: CdkVirtualScrollViewport;

    @ViewChild(CdkVirtualForOf, {static: true}) private virtualForOf: CdkVirtualForOf<any[]>;
    private rangeVirtual: any;
    public window: any = window;
    cardHandlesScrollIndex: number = 1;

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private reportService: ReportService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        public browserDetect: BrowserService,
        private storageService: StorageService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        super(sharedComponent);
    }

    override reload() {
        console.log('reload child');
        this.childDates.selectedRange
            .pipe(take(1))
            .subscribe((rng) => this.filterDates(rng));
    }

    ngAfterViewInit() {
        this.virtualForOf.viewChange.subscribe((range: any) => this.rangeVirtual = range);

        this.selectedRangeSub = this.childDates.selectedRange
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
        this.route.data.subscribe((data: any) => {
            console.log('resolved data ===> %o, aRoute: %o', data, this.route);
            this.entryLimit =
                data.userDefaults && data.userDefaults.numberOfRowsPerTable
                    ? +data.userDefaults.numberOfRowsPerTable
                    : 50;
        });

        // this.selectedRangeSub = this.childDates.selectedRange
        //     .pipe(
        //         filter(() => Array.isArray(this.userService.appData.userData.accountSelect)
        //             && this.userService.appData.userData.accountSelect.length)
        //     )
        //     .subscribe(rng => this.filterDates(rng));
    }

    changeAcc(event): void {
        this.loader = true;
        console.log(this.userService.appData.userData.accountSelect);
        [this.accountBalance, this.creditLimit, this.balanceUse] =
            this.userService.appData.userData.accountSelect.reduce(
                function (a, b) {
                    return [
                        a[0] + +b.accountBalance,
                        a[1] + +b.creditLimit,
                        a[2] + +b.balanceUse
                    ];
                },
                [0, 0, 0]
            );

        // this.childDates.selectedRange
        //     .pipe(
        //         take(1)
        //     )
        //     .subscribe((rng) => this.filterDates(rng));
        if (this.childDates) {
            this.childDates.selectedRange
                .pipe(take(1))
                .subscribe((rng) => this.filterDates(rng));
        }

        // if (this.userService.appData.userData.accountSelect.filter((account) => {
        //     return account.currency !== 'ILS';
        // }).length) {
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
        // this.childDates.filter('days');
        // this.filterDates(this.childDates.selectedPeriod);
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

    getInfoAcc(id: string, param: string, applyAbsForCreditLimit = true): any {
        if (id !== null && param !== undefined) {
            const acc = this.userService.appData.userData.accounts.find((account) => {
                return account.companyAccountId === id;
            });
            const result = acc ? acc[param] : null;

            return result && param === 'creditLimit' && applyAbsForCreditLimit
                ? Math.abs(result)
                : result;
        } else {
            return '';
        }
    }

    isForexAccount(id: string): boolean {
        return (
            this.getInfoAcc(id, 'currency') !==
            AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
        );
    }

    // compareDatesInline(dateToCompare): boolean {
    //     return new Date().toLocaleString('en-GB', {
    //         'year': 'numeric',
    //         'month': '2-digit',
    //         'day': '2-digit'
    //     }) === new Date(dateToCompare).toLocaleString('en-GB', {
    //         'year': 'numeric',
    //         'month': '2-digit',
    //         'day': '2-digit'
    //     });
    // }

    filterDates(paramDate: any): void {
        if (this.allTransactionsSub) {
            this.allTransactionsSub.unsubscribe();
        }
        // if (this.bankTransTodaySub) {
        //     this.bankTransTodaySub.unsubscribe();
        // }

        if (!this.userService.appData.userData.accountSelect.length) {
            this.loader = false;
            this.dataTableAll = [];
            this.sortableIdGr = [];
            requestAnimationFrame(() => this.checkNavScroll());
            return;
        }

        this.loader = true;
        const parameters: any = {
            accountShowOnly: [],
            // this.userService.appData.userData.accountSelect.filter((account) => {
            //     return !compareDates(new Date(), new Date(account.balanceLastUpdatedDate)) || account.currency !== 'ILS';
            // }).map((id) => id.companyAccountId),
            accountToSum: [],
            // this.userService.appData.userData.accountSelect.filter((account) => {
            //     return compareDates(new Date(), new Date(account.balanceLastUpdatedDate)) && account.currency === 'ILS';
            // }).map((id) => id.companyAccountId),
            companyId: this.userService.appData.userData.companySelect.companyId,
            dateFrom: paramDate.fromDate,
            dateTill: paramDate.toDate
        };
        this.userService.appData.userData.accountSelect.forEach((acc) =>
            (acc.aggregate === true
                    ? parameters.accountToSum
                    : parameters.accountShowOnly
            ).push(acc.companyAccountId)
        );

        this.allTransactionsSub = this.sharedService
            .getBankTransAggregate(parameters)
            .pipe(take(1))
            .subscribe((response: any) => {
                    const dataTableAll = response ? response['body'] : response;
                    const allAcc = dataTableAll.slice(dataTableAll.length - 1);
                    // const allAcc = dataTableAll.filter((account) => {
                    //   return account.accountUuid === null;// && account.accountTransactions.length;
                    // });
                    const accounts = dataTableAll.slice(0, dataTableAll.length - 1);
                    // const accounts = dataTableAll.filter((account) => {
                    //   return account.accountUuid !== null;
                    // });
                    accounts.sort((a, b) => {
                        return (
                            this.userService.appData.userData.accountSelect.findIndex(
                                (acc) => acc.companyAccountId === a.accountUuid
                            ) -
                            this.userService.appData.userData.accountSelect.findIndex(
                                (acc) => acc.companyAccountId === b.accountUuid
                            )
                        );
                    });

                    const outdatedSelectedAccountsMap: { [k: string]: number } =
                        this.userService.appData.userData.accountSelect
                            .filter((acc) => !acc.isUpToDate)
                            .reduce((acmltr, outdatedAcc) => {
                                acmltr[outdatedAcc.companyAccountId] =
                                    outdatedAcc.balanceLastUpdatedDate;
                                return acmltr;
                            }, Object.create(null));

                    accounts
                        .filter((acc) => outdatedSelectedAccountsMap[acc.accountUuid])
                        .forEach((acc) => {
                            acc.accountTransactions
                                .filter(
                                    (trns) =>
                                        trns.transDate >
                                        outdatedSelectedAccountsMap[acc.accountUuid]
                                )
                                .forEach(
                                    (trns) =>
                                        ([trns.zhut, trns.hova, trns.itra] = [null, null, null])
                                );
                        });

                    const sortableIdGr =
                        this.storageService.sessionStorageGetterItem('sortableIdGr');
                    if (sortableIdGr !== null && sortableIdGr !== 'null') {
                        this.sortableIdGr = JSON.parse(sortableIdGr);
                        accounts.sort((a, b) => {
                            const storedIndexOfA = this.sortableIdGr.indexOf(a.accountUuid);
                            const storedIndexOfB = this.sortableIdGr.indexOf(b.accountUuid);

                            // console.log('storedIndexOfA: %o, storedIndexOfB: %o', storedIndexOfA, storedIndexOfB);
                            if (storedIndexOfA === storedIndexOfB) {
                                return (
                                    this.userService.appData.userData.accountSelect.findIndex(
                                        (acc: any) => acc.companyAccountId === a.accountUuid
                                    ) -
                                    this.userService.appData.userData.accountSelect.findIndex(
                                        (acc: any) => acc.companyAccountId === b.accountUuid
                                    )
                                );
                            }
                            if (storedIndexOfA === -1 || storedIndexOfB === -1) {
                                return storedIndexOfA === -1 ? 1 : -1;
                            }

                            return storedIndexOfA - storedIndexOfB;
                        });
                    }
                    this.sortableIdGr = accounts.map((acc: any) => acc.accountUuid);
                    this.storageService.sessionStorageSetter(
                        'sortableIdGr',
                        JSON.stringify(this.sortableIdGr)
                    );

                    this.dataTableAll = allAcc.concat(accounts);


                    this.dataTableAll.forEach((acc: any) => {
                        if (acc.accountTransactions) {
                            acc.accountTransactions.sort((a, b) => {
                                return b.transDate - a.transDate;
                            });
                        }
                    });
                    setTimeout(() => {
                        this.viewPort.scrollToIndex(1, 'smooth');
                        setTimeout(() => {
                            this.loader = false;
                        }, 100);
                    }, 10);
                    // if (this.userService.appData.moment().isBetween(paramDate.fromDate, paramDate.toDate, 'day', '[]')) {
                    //     const parametersToday: any = {
                    //         'companyAccountIds': this.userService.appData.userData.accountSelect.filter((account) => {
                    //             return compareDates(new Date(), new Date(account.balanceLastUpdatedDate));
                    //         }).map((id) => id.companyAccountId),
                    //         'companyId': this.userService.appData.userData.companySelect.companyId,
                    //         'dateFrom': paramDate.fromDate,
                    //         'dateTill': paramDate.toDate
                    //     };
                    //     this.bankTransTodaySub = this.sharedService.getBankTransPeulotToday(parametersToday)
                    //         .pipe(
                    //             take(1)
                    //         )
                    //         .subscribe(
                    //             resp => {
                    //                 const dataTableToday = (resp) ? resp['body'] : resp;
                    //
                    //                 let allAccountsTodaySummary = allAcc[0].accountTransactions[0];
                    //                 if (!allAccountsTodaySummary) {
                    //                     allAccountsTodaySummary = {
                    //                         transDate: new Date().getTime()
                    //                     };
                    //                     allAcc[0].accountTransactions.push(allAccountsTodaySummary);
                    //                 }
                    //                 Object.assign(allAccountsTodaySummary, {
                    //                     hova: null,
                    //                     zhut: null,
                    //                     itra: null,
                    //                     isTodaySummary: true
                    //                 });
                    //
                    //                 accounts.forEach((account) => {
                    //                     let accountTodaySummary;
                    //                     if (account.accountTransactions.length > 0) {
                    //                         accountTodaySummary = account.accountTransactions[0];
                    //                     } else {
                    //                         accountTodaySummary = {
                    //                             transDate: new Date().getTime()
                    //                         };
                    //                         account.accountTransactions.push(accountTodaySummary);
                    //                     }
                    //                     Object.assign(accountTodaySummary, {
                    //                         hova: 0,
                    //                         zhut: 0,
                    //                         itra: null,
                    //                         isTodaySummary: true
                    //                     });
                    //
                    //                     dataTableToday.filter((val) => {
                    //                         return account.accountUuid === val.companyAccountId;
                    //                     }).reduce((a, b) => {
                    //                         if (b.hova) {
                    //                             a.hova = a.hova ? a.hova + b.total : b.total;
                    //                             // allAccountsTodaySummary.hova = allAccountsTodaySummary.hova
                    //                             //   ? allAccountsTodaySummary.hova + b.total
                    //                             //   : b.total;
                    //                         } else {
                    //                             a.zhut = a.zhut ? a.zhut + b.total : b.total;
                    //                             // allAccountsTodaySummary.zhut = allAccountsTodaySummary.hova
                    //                             //   ? allAccountsTodaySummary.zhut + b.total
                    //                             //   : b.total;
                    //                         }
                    //                         return a;
                    //                     }, accountTodaySummary);
                    //                 });
                    //             }, (err: HttpErrorResponse) => {
                    //                 if (err.error) {
                    //                     console.log('An error occurred:', err.error.message);
                    //                 } else {
                    //                     console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
                    //                 }
                    //             }
                    //         );
                    // }

                    // let idxOld;
                    // (<any>$('#sortable'))
                    //     .sortable({
                    //         items: 'li:not(.p-disabled)',
                    //         handle: '.topTitles',
                    //         // containment: 'parent',
                    //         axis: 'x',
                    //         // scroll: false,
                    //         tolerance: 'pointer',
                    //         scrollSensitivity: 100,
                    //         scrollSpeed: 100,
                    //         activate: (e, ui) => {
                    //             ui.sender.scrollTop(0);
                    //         },
                    //         start: (e, ui) => {
                    //             idxOld = ui.item.index();
                    //         },
                    //         update: (event, ui) => {
                    //             console.log('old: ' + (idxOld - 1));
                    //             console.log('update: ' + (ui.item.index() - 1));
                    //             this.sortableIdGr = this.arrayMove(
                    //                 this.sortableIdGr,
                    //                 idxOld - 1,
                    //                 ui.item.index() - 1
                    //             );
                    //             console.log(this.sortableIdGr);
                    //             this.storageService.sessionStorageSetter(
                    //                 'sortableIdGr',
                    //                 JSON.stringify(this.sortableIdGr)
                    //             );
                    //             idxOld = undefined;
                    //             this.scrollEventHandleHelper.ticking = false;
                    //             setTimeout(() => {
                    //                 this.checkNavScroll();
                    //             }, 600);
                    //         }
                    //     })
                    //     .disableSelection();
                    // setTimeout(() => {
                    //     this.checkNavScroll();
                    // }, 600);
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
            console.log(this.cardHandlesScrollIndex);
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
            this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth');
            console.log(this.cardHandlesScrollIndex);
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
        moveItemInArray(this.dataTableAll, PREV_IND_WITH_OFFSET, CUR_IND_WITH_OFFSET);
        this.dataTableAll = [...this.dataTableAll];
        this.sortableIdGr = this.arrayMove(
            this.sortableIdGr,
            PREV_IND_WITH_OFFSET,
            CUR_IND_WITH_OFFSET
        );
        this.storageService.sessionStorageSetter(
            'sortableIdGr',
            JSON.stringify(this.sortableIdGr)
        );
    }

    trackById(index: number, row: any): string {
        return row.accountUuid;
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
                    this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth');
                }
            }
            // this.viewPort.scrollToIndex(this.cardHandlesScrollIndex, 'smooth')
            // this.scrollIntoViewCardAt(+evnt.target.getAttribute('tabindex') + dir);
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

    goToFinancialManagementBankAccountDetailsComponent(filtersParams: any) {
        this.sharedComponent.mixPanelEvent('all transes');

        this.storageService.sessionStorageSetter(
            'bankAccount/*-filterAcc',
            filtersParams[0] === null
                ? JSON.stringify(
                    this.userService.appData.userData.accountSelect.map(
                        (id) => id.companyAccountId
                    )
                )
                : JSON.stringify([filtersParams[0]])
        );
        this.storageService.sessionStorageSetter(
            'details-filterTypesVal',
            filtersParams[1]
        );
        this.storageService.sessionStorageSetter(
            DateRangeSelectorBaseComponent.storageKey(this.route, 'details'),
            JSON.stringify(CustomPreset.createDatesPreset(filtersParams[2]))
        );
        // this.storageService.sessionStorageSetter(AccountDatesComponent.storageKey(this.route, 'details'), JSON.stringify({
        //     selectedValue: '2',
        //     dates: {
        //         calendarFrom: new Date(filtersParams[2]).toISOString(),
        //         calendarUntil: new Date(filtersParams[2]).toISOString()
        //     }
        // }));

        this.router.navigate(['../details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }

    getBankTransPerDay(
        companyAccountIds: string[],
        hova: boolean,
        transDate: string
    ): any {
        // console.log('getBankTransPerDay for: %o, %o ', transDate, hova);
        this.dataTableInside = null; // [];
        if (this.dataTableInsideSub) {
            this.dataTableInsideSub.unsubscribe();
        }

        if (companyAccountIds && companyAccountIds.length > 0) {
            const parameters: any = {
                companyAccountIds: companyAccountIds,
                hova: hova,
                transDate: transDate
            };
            this.dataTableInsideSub = this.sharedService
                .getBankTransPerDay(parameters)
                .pipe(take(1))
                .subscribe(
                    (response: any) => {
                        this.dataTableInside = response ? response['body'] : response;
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
    }

    // nextScroll(elem: any) {
    //     const visibleIndices = this.findVisibleAccountIndices();
    //     let scrollToIndex = visibleIndices[visibleIndices.length - 1].tabindex;
    //     if (visibleIndices[visibleIndices.length - 1].fullyVisible) {
    //         scrollToIndex += 1;
    //     }
    //     console.log(
    //         'nextScroll: visibleIndices -> %o will scroll to: %o',
    //         visibleIndices,
    //         scrollToIndex
    //     );
    //     this.scrollIntoViewAccountAt(scrollToIndex);
    //     // this.scrollTo(elem, -1040, 200);
    // }
    //
    // prevScroll(elem: any) {
    //     const visibleIndices = this.findVisibleAccountIndices();
    //     let scrollToIndex = visibleIndices[0].tabindex;
    //     // tslint:disable-next-line:max-line-length
    //     if (
    //         visibleIndices[0].fullyVisible ||
    //         this.browserDetect.browserDetect.browser === 'Chrome' ||
    //         this.browserDetect.browserDetect.browser === 'Mozilla' ||
    //         this.browserDetect.browserDetect.browser === 'Edge'
    //     ) {
    //         scrollToIndex -= 1;
    //     }
    //     console.log(
    //         'nextScroll: visibleIndices -> %o will scroll to: %o',
    //         visibleIndices,
    //         scrollToIndex
    //     );
    //     this.scrollIntoViewAccountAt(scrollToIndex, 'start');
    //     // this.scrollTo(elem, 1040, 200);
    // }
    //
    // checkNavScroll() {
    //     const elem = this.accountsListRef.nativeElement;
    //     const browser = this.browserDetect.browserDetect.browser;
    //     this.nav.prev = false;
    //     this.nav.next = false;
    //
    //     if (elem.scrollWidth <= elem.clientWidth) {
    //         console.log('Not have scroll');
    //         this.nav.prev = false;
    //         this.nav.next = false;
    //     } else {
    //         this.nav.prev = true;
    //         this.nav.next = true;
    //         if (
    //             (browser === 'Edge' || browser === 'Chrome') &&
    //             elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth + 15
    //         ) {
    //             console.log('Edge Left');
    //             this.nav.prev = true;
    //             this.nav.next = false;
    //         }
    //
    //         if (elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth) {
    //             if (browser === 'Mozilla') {
    //                 console.log('Edge Left');
    //                 this.nav.prev = true;
    //                 this.nav.next = false;
    //             }
    //         }
    //
    //         if (elem.scrollWidth + Math.abs(elem.scrollLeft) === elem.clientWidth) {
    //             if (browser === 'Firefox') {
    //                 console.log('Edge Left');
    //                 this.nav.prev = true;
    //                 this.nav.next = false;
    //             }
    //         }
    //
    //         if (Math.abs(elem.scrollLeft) === 0) {
    //             if (browser === 'Mozilla' || browser === 'Edge') {
    //                 console.log('Edge Right');
    //                 this.nav.prev = false;
    //                 this.nav.next = true;
    //             }
    //             if (browser === 'Chrome') {
    //                 console.log('Edge Left');
    //                 this.nav.prev = false;
    //                 this.nav.next = true;
    //             }
    //             if (browser === 'Firefox') {
    //                 console.log('Edge Right');
    //                 this.nav.prev = false;
    //                 this.nav.next = true;
    //             }
    //         }
    //     }
    // }

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


    public daysFromTodayHumanized(date: number | Date): string {
        const days = getDaysBetweenDates(
            date instanceof Date ? date : new Date(date),
            new Date()
        );
        return days === 1
            ? this.translate.translations[this.translate.currentLang].sumsTitles
                .yesterday
            : this.translate.translations[this.translate.currentLang].sumsTitles
                .before +
            ' ' +
            days +
            ' ' +
            this.translate.translations[this.translate.currentLang].sumsTitles
                .days;
    }

    public stepAccount(dir: number, evnt: any): void {
        this.scrollIntoViewAccountAt(+evnt.target.getAttribute('tabindex') + dir);
    }

    private scrollIntoViewAccountAt(idx: number, inline = 'end'): void {
        if (idx < 0 || idx >= this.accountHandlesRef.length) {
            return;
        }
        const accountHandlesArr = this.accountHandlesRef.toArray();
        // if (idx < 0) {
        //   idx = accountHandlesArr.length - 1;
        // } else if (idx === accountHandlesArr.length) {
        //   idx = 0;
        // }

        const evntAccHandle = this.accountHandlesRef.find(
            (accH) => +accH.nativeElement.getAttribute('tabindex') === idx
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

    private findVisibleAccountIndices(): any[] {
        const indices = this.accountHandlesRef
            .filter((accH) => {
                if (!accH.nativeElement.offsetParent) {
                    return false;
                }
                const viewportWidth = accH.nativeElement.offsetParent.scrollWidth;
                const accRect = accH.nativeElement.getBoundingClientRect();
                console.log(
                    '%o -> %o, viewportWidth: %o',
                    +accH.nativeElement.getAttribute('tabindex'),
                    accRect,
                    viewportWidth
                );
                return (
                    (accRect.left >= 0 && accRect.left < viewportWidth) ||
                    (accRect.right > 0 && accRect.right <= viewportWidth) ||
                    (accRect.left < 0 && accRect.right > viewportWidth)
                );
            })
            .map((accH) => {
                const viewportWidth = accH.nativeElement.offsetParent.scrollWidth;
                const accRect = accH.nativeElement.getBoundingClientRect();

                return {
                    tabindex: +accH.nativeElement.getAttribute('tabindex'),
                    fullyVisible: accRect.left >= 0 && accRect.right <= viewportWidth
                };
            });

        indices.sort((a, b) => a.tabindex - b.tabindex);
        return indices;
    }

    // sortedIndexOf(accItem: any): number {
    //   if (!accItem.accountUuid) {
    //     return 0;
    //   }
    //
    //   return this.sortableIdGr.indexOf(accItem.accountUuid) + 1;
    // }

    toAbsolute(val: number) {
        return Math.abs(val);
    }

    tooltipToggleFor(acc: any, transDay: any, hova: boolean, $event: any): void {
        // console.log('tooltipToggleFor -> %o, %o, %o, %o', acc, transDay, hova, $event);
        if (hova) {
            acc.opened1 = $event;
        } else {
            acc.opened2 = $event;
        }

        if ($event) {
            if (acc.accountUuid === null) {
                this.getBankTransPerDay(
                    this.userService.appData.userData.accountSelect.map(
                        (id) => id.companyAccountId
                    ),
                    hova,
                    transDay.transDate
                );
            } else {
                this.getBankTransPerDay([acc.accountUuid], hova, transDay.transDate);
            }
        }
    }

    listScrollVertically($event: any) {
        if (
            this.scrollEventHandleHelper.lastHandleY === $event.srcElement.scrollTop
        ) {
            return;
        }

        this.scrollEventHandleHelper.lastHandleY = $event.srcElement.scrollTop;

        if (!this.scrollEventHandleHelper.ticking) {
            const allTransLists = this.accountHandlesRef.map(
                (ref) => ref.nativeElement.children[0]
            );
            // console.log('transactionsScrolled -> %o at %o', $event.srcElement.scrollTop,
            //   allTransLists);

            requestAnimationFrame(() => {
                // allTransLists.forEach(lst => lst.style.visibility = 'hidden');
                // requestAnimationFrame(() => {
                allTransLists.forEach(
                    (lst) =>
                        (lst.style.top = this.scrollEventHandleHelper.lastHandleY + 'px')
                );
                // allTransLists.forEach(lst => lst.style.visibility = 'visible');
                this.scrollEventHandleHelper.ticking = false;
                // });
            });

            this.scrollEventHandleHelper.ticking = true;
        }
    }

    private reportParamsFromCurrentView(): any {
        const dataTableWithoutSummary = this.dataTableAll.filter(
            (acc: any) => acc.accountUuid
        );
        const dataTableForReport =
            dataTableWithoutSummary.length === 1
                ? dataTableWithoutSummary
                : this.dataTableAll;

        const accountData = dataTableForReport.map((acc: any) => {
            if (!acc.accountUuid) {
                return {
                    accountUuid: null,
                    accountBalance: this.accountBalance,
                    creditLimit: this.creditLimitAbs,
                    usedBalance: this.balanceUse
                };
            }
            const accSlctd = this.userService.appData.userData.accountSelect.find(
                (accS) => accS.companyAccountId === acc.accountUuid
            );
            return {
                accountUuid: acc.accountUuid,
                accountBalance: accSlctd.accountBalance,
                creditLimit: Math.abs(accSlctd.creditLimit),
                usedBalance: accSlctd.balanceUse,
                message: this.reportService.buildMessageFrom([accSlctd])
            };
        });

        return {
            additionalProperties: {
                reportDays: this.childDates.asText(),
                accountData: accountData
            },
            data: {
                report: dataTableForReport
            }
        };
    }

    exportTransactions(resultFileType: string): void {
        this.reportService
            .getReport(
                'BANK_TRANS_AGGREGATED',
                this.reportParamsFromCurrentView(),
                resultFileType,
                this.reportService.prepareFilename(...this.getFilename())
            )
            .pipe(take(1))
            .subscribe((rslt) => {
            });
    }

    printTransactions(): void {
        this.reportService
            .printReport(
                'BANK_TRANS_AGGREGATED',
                this.reportParamsFromCurrentView(),
                'PDF',
                this.getFilename().join(' ')
            )
            .pipe(take(1))
            .subscribe((rslt) => {
            });
    }

    sendTransactions(mailAddress: string): void {
        const request = this.reportParamsFromCurrentView();
        Object.assign(request.additionalProperties, {
            mailTo: mailAddress,
            screenName: this.getFilename().join(' ')
        });
        this.reportService
            .emailReport('BANK_TRANS_AGGREGATED', request)
            .pipe(take(1))
            .subscribe((rslt) => {
                this.reportMailSubmitterToggle = false;
            });
    }

    private getFilename() {
        return [
            this.translate.instant(
                'menu.customers.financialManagement.bankAccount.main'
            ),
            'תצוגה מרוכזת',
            this.childDates.asText(),
            this.userService.appData.userData.companySelect.companyName
        ];
    }

    ngOnDestroy(): void {
        if (this.dataTableInsideSub) {
            this.dataTableInsideSub.unsubscribe();
        }
        if (this.bankTransAggregateSub) {
            this.bankTransAggregateSub.unsubscribe();
        }
        // if (this.bankTransTodaySub) {
        //     this.bankTransTodaySub.unsubscribe();
        // }
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.allTransactionsSub) {
            this.allTransactionsSub.unsubscribe();
        }
        // const sortableInst = (<any>$('#sortable')).sortable('instance');
        // if (sortableInst) {
        //     sortableInst.destroy();
        // }
        this.destroy();
    }
}
