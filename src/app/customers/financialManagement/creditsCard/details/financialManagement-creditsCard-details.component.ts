/* tslint:disable:max-line-length */
import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    OnInit,
    QueryList,
    Renderer2,
    SecurityContext,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../../../../core/user.service';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {SortPipe} from '@app/shared/pipes/sort.pipe';

import {ActivatedRoute, Router} from '@angular/router';

import {Subscription} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, take, tap} from 'rxjs/operators';

import {StorageService} from '@app/shared/services/storage.service';
import {HttpErrorResponse} from '@angular/common/http';
import {CustomersFinancialManagementCreditsCardComponent} from '../customers-financialManagement-creditsCard.component';
import {FormControl} from '@angular/forms';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {DomSanitizer} from '@angular/platform-browser';
import {CategorySelectComponent} from '@app/shared/component/category-select/category-select.component';
import {CreditCardSelectionSummary} from './creditCardSelectionSummary';
import {CardsSelectComponent} from '@app/shared/component/cards-select/cards-select.component';
import {DatePipe} from '@angular/common';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {UserDefaultsResolver} from '../../user-defaults-resolver.service';
import {ReportService} from '../../../../core/report.service';
import {CcardsDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/ccards-date-range-selector.component';
import {TransTypesService} from '../../../../core/transTypes.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {getPageHeight} from '@app/shared/functions/getPageHeight';

@Component({
    templateUrl: './financialManagement-creditsCard-details.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementCreditsCardDetailsComponent
    extends ReloadServices
    implements OnDestroy, OnInit, AfterViewInit {
    public filterTypesCategory: any = null;
    public dataTable: any[] = [];
    public allTransData = [];
    public dataTableAll: any[] = [];
    public searchableList = [
        'mainDescription',
        'originalTotal',
        'transTotal',
        'transTypeName',
        'note'
    ];
    public searchInDates = false;
    public queryString = '';
    public currentPage = 0;
    public entryLimit = 50;
    public filterInput = new FormControl();
    public transTypeName: any[];
    public sortPipeDir = 'smaller';
    public loader = false;
    public sortableIdGr: any[];
    public subscription: Subscription;
    // @ViewChild('paginator') paginator: Paginator;
    public hideScroll: boolean = false;
    @ViewChild(CcardsDateRangeSelectorComponent)
    childDates: CcardsDateRangeSelectorComponent;
    // @ViewChild(CardsDatesComponent) childDates: CardsDatesComponent;

    @ViewChild(CardsSelectComponent) cardsSelector: CardsSelectComponent;
    @ViewChild('scrollContainer') scrollContainer: any;

    public transTypesArr: any[];
    public companyTransTypes: any[] = [];
    public scrollContainerHasScroll = false;
    public searchableListTypes = ['transTypeId'];
    private transTypesMap: { [key: string]: any };
    public indexOpenedRows: any[] = [];
    selectionSummary: CreditCardSelectionSummary;

    @ViewChild('inputBox') _el: ElementRef;
    private transTypeChangeEventSub: Subscription;

    private _selectedTransaction: any;
    private transactionDetailsSub: Subscription;

    get selectedTransaction(): any {
        return this._selectedTransaction;
    }

    set selectedTransaction(val: any) {
        this._selectedTransaction = val;
        if (this.editingTransaction !== null && this.editingTransaction !== val) {
            this.submitChanges(null);
        }
    }

    private editingTransactionOld: any;
    private _editingTransaction: any;
    get editingTransaction(): any {
        return this._editingTransaction;
    }

    set editingTransaction(val: any) {
        if (this._editingTransaction != null && this._editingTransaction !== val) {
            this.submitChanges(null);
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
        this.showCategoryDropDown = false;
    }

    public showCategoryDropDown: boolean;
    @ViewChild('categorySelector') categorySelector: CategorySelectComponent;
    private globalListenerWhenInEdit: () => void | boolean;
    @ViewChildren('checksChain', {read: ElementRef})
    checksChainItemsRef: QueryList<ElementRef>;

    reportMailSubmitterToggle = false;

    private selectedRangeSub: Subscription;

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
        apply: () => void;
    };

    private rebuildTransTypesMap(withOtherFiltersApplied: any[]): void {
        this.transTypesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRowParent) => {
                dtRowParent.transactions.forEach((dtRow) => {
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
                });
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

    get companyId(): string {
        return this.userService.appData.userData.companySelect !== null
            ? this.userService.appData.userData.companySelect.companyId
            : null;
    }

    constructor(
        private _element: ElementRef,
        private renderer: Renderer2,
        public browserDetect: BrowserService,
        private _sanitizer: DomSanitizer,
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        private customersFinancialManagementCreditsCardComponent: CustomersFinancialManagementCreditsCardComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private storageService: StorageService,
        private router: Router,
        private route: ActivatedRoute,
        private dtPipe: DatePipe,
        private currencySymbolPipe: CurrencySymbolPipe,
        private sumPipe: SumPipe,
        private defaultsResolver: UserDefaultsResolver,
        private reportService: ReportService,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);

        if (this.userService.appData.userData.creditCards) {
        } else {
            this.subscription =
                customersFinancialManagementCreditsCardComponent.getDataCardsEvent.subscribe(
                    () => {
                    }
                );
        }

        this.filterInput.valueChanges
            .pipe(
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged(),
                tap((term) => {
                    this.storageService.sessionStorageSetter(
                        'creditsCard/details-filterQuery',
                        term
                    );
                })
            )
            .subscribe((term) => {
                this.sharedComponent.mixPanelEvent('search');
                this.queryString = term;
                this.filtersAll();
            });

        this.subscription =
            this.transTypesService.selectedCompanyTransTypes.subscribe(
                (rslt) => (this.companyTransTypes = rslt)
            );

        this.selectionSummary = new CreditCardSelectionSummary(this.userService);
    }

    override reload() {
        console.log('reload child');
        this.getCreditCardTransactionDetails();
    }

    ngAfterViewInit() {
        this.selectedRangeSub = this.childDates.selectedRange
            .pipe(
                filter(() => {
                    const scltdCards = this.cardsSelector.selectedCards;
                    return Array.isArray(scltdCards) && scltdCards.length > 0;
                })
            )
            .subscribe((rng) => this.filterDates(rng));
    }

    //
    // @HostListener('document:click', ['$event'])
    // onClickOutside($event: any) {
    //   if (!this.inEditMode) {
    //     return;
    //   }
    //   console.log('details row listener called');
    //   const eventPath = BrowserService.pathFrom($event);
    //   // console.log('Checking if should terminate edit: %o', eventPath);
    //   const shouldTerminateEdit =
    //     !eventPath[0].classList.contains('p-dialog-mask')
    //     && !eventPath
    //       .filter(node => node.classList)
    //       .some(node => node.classList.contains('p-dialog'))
    //     && !eventPath.some(node => node === this._element.nativeElement);
    //   if (shouldTerminateEdit) {
    //     console.log('Terminating edit (clicked on : %o)', eventPath);
    //   }
    // }
    //
    ngOnInit(): void {
        const detailsFilterTypesCategory =
            this.storageService.sessionStorageGetterItem(
                'creditsCard/details-filterTypesCategory'
            );
        if (detailsFilterTypesCategory !== null) {
            this.filterTypesCategory =
                detailsFilterTypesCategory === '' ||
                detailsFilterTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterTypesCategory);
        }
        const detailsFilterQuery = this.storageService.sessionStorageGetterItem(
            'creditsCard/details-filterQuery'
        );
        if (detailsFilterQuery) {
            this.filterInput.setValue(detailsFilterQuery);
        }

        this.defaultsResolver.userDefaultsSubject.subscribe((userDefaults) => {
            console.log('resolved data ===> %o, userDefaults: %o', userDefaults);
            this.entryLimit =
                userDefaults && userDefaults.numberOfRowsPerTable
                    ? +userDefaults.numberOfRowsPerTable
                    : 50;
        });

        this.transTypeChangeEventSub =
            this.sharedService.transTypeChangeEvent.subscribe((evt) => {
                console.log('transTypeChangeEvent occured: %o', evt);

                if (this.dataTableAll) {
                    switch (evt.type) {
                        case 'change':
                            this.dataTableAll.forEach((group) =>
                                group.transactions
                                    .filter(
                                        (trans) => trans.transTypeId === evt.value.transTypeId
                                    )
                                    .forEach(
                                        (trans) => (trans.transTypeName = evt.value.transTypeName)
                                    )
                            );
                            this.dataTable.forEach((group) =>
                                group.transactions
                                    .filter(
                                        (trans) => trans.transTypeId === evt.value.transTypeId
                                    )
                                    .forEach(
                                        (trans) => (trans.transTypeName = evt.value.transTypeName)
                                    )
                            );
                            break;
                        case 'delete':
                            this.dataTableAll.forEach((group) => {
                                group.transactions
                                    .filter(
                                        (trans) => trans.transTypeId === evt.value.transTypeId
                                    )
                                    .forEach((trans) => {
                                        trans.transTypeName = 'ללא קטגוריה';
                                        trans.transTypeId = null;
                                    });
                            });
                            this.dataTable.forEach((group) => {
                                group.transactions
                                    .filter(
                                        (trans) => trans.transTypeId === evt.value.transTypeId
                                    )
                                    .forEach((trans) => {
                                        trans.transTypeName = 'ללא קטגוריה';
                                        trans.transTypeId = null;
                                    });
                            });
                            break;
                    }
                }
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
            this.scrollContainer.scrollTo({
                top: 0
            });
            // this.scrollContainer.nativeElement.scrollTop = 0;
        }
        this.currentPage = event.page;
        // this.storageService.sessionStorageSetter('creditsCard-details-rowsPerPage', event.rows);
    }

    filterCategory(type: any) {
        this.sharedComponent.mixPanelEvent('filter category', {
            value: type.checked
        });
        this.filterTypesCategory = type.checked;
        this.filtersAll('filterTypes');
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

    getCreditCardTransactionDetails(): void {
        const selectedCards = this.cardsSelector.selectedCards;
        const arrCards = selectedCards.map((card) => card.creditCardId);
        this.sharedComponent.mixPanelEvent('credits drop', {
            credits: (this.userService.appData.userData.creditCards.length === selectedCards.length) ? 'כל הכרטיסים' : arrCards
        });
        this.loader = true;
        // let arrCards = [];
        // let cardsCheck = [];
        // this.userService.appData.userData.creditCards.forEach((id) => {
        //   cardsCheck = id.children.filter((card) => {
        //     return card.check;
        //   });
        //
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

        this.selectionSummary.reset();
        this.childDates.selectedRange
            .pipe(take(1))
            .subscribe((rng) => this.filterDates(rng));
        // this.childDates.filter('monthCredit');
        // this.filterDates(this.childDates.selectedPreset);
    }

    filterDates(paramDate: any, reloadCategoriesFilter?: any): void {
        if (reloadCategoriesFilter) {
            this.hideScroll = true;
        }

        this.loader = true;
        this.selectionSummary.sumForSelectedPeriod = null;
        const selectedCards = this.cardsSelector.selectedCards;
        const arrCards = selectedCards.map((card) => card.creditCardId);
        // this.userService.appData.userData.creditCards.forEach((id) => {
        //   const cards = id.children.filter((card) => {
        //     return card.check;
        //   }).map((card) => card.creditCardId);
        //   arrCards = arrCards.concat(cards);
        // });

        if (this.transactionDetailsSub) {
            this.transactionDetailsSub.unsubscribe();
        }

        if (arrCards.length) {
            // this.collapseOpenVal = selectedCards.length === 1;

            // if (arrCards.length === 1 && this.cardsSelector.selectedCards[0].cycleDay
            //         && ['cCardClosestFuture', 'cCardClosestPast'].includes(this.childDates.selectedPreset.name)) {
            //     const cycleDayInCurrMonth = this.userService.appData.moment()
            //         .date(this.cardsSelector.selectedCards[0].cycleDay)
            //         .startOf('day');
            //     if (cycleDayInCurrMonth.isBefore(this.userService.appData.moment())) { // now after cycle day
            //         if (this.childDates.selectedPreset.name === 'cCardClosestFuture') {
            //             paramDate.fromDate = cycleDayInCurrMonth.clone().add(1, 'days').toDate();
            //             paramDate.toDate = cycleDayInCurrMonth.add(1, 'months').endOf('day').toDate();
            //         } else if (this.childDates.selectedPreset.name === 'cCardClosestPast') {
            //             paramDate.fromDate = cycleDayInCurrMonth.clone().subtract(1, 'months').add(1, 'days').toDate();
            //             paramDate.toDate = cycleDayInCurrMonth.endOf('day').toDate();
            //         }
            //     } else {
            //         if (this.childDates.selectedPreset.name === 'cCardClosestFuture') {
            //             paramDate.fromDate = cycleDayInCurrMonth.clone().subtract(1, 'months').add(1, 'days').toDate();
            //             paramDate.toDate = cycleDayInCurrMonth.endOf('day').toDate();
            //         } else if (this.childDates.selectedPreset.name === 'cCardClosestPast') {
            //             paramDate.fromDate = cycleDayInCurrMonth.clone().subtract(2, 'months').add(1, 'days').toDate();
            //             paramDate.toDate = cycleDayInCurrMonth.subtract(1, 'months').endOf('day').toDate();
            //         }
            //     }
            // }

            this.transactionDetailsSub = this.sharedService
                .getCreditCardTransactionDetails({
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    creditCardIds: arrCards,
                    dateFrom: paramDate.fromDate,
                    dateTill: paramDate.toDate,
                    filterType: this.childDates.selectedFilterType
                })
                .subscribe(
                    (response: any) => {
                        this.dataTableAll = response ? response['body'] : response;
                        const startOfToday = new Date().setHours(0, 0, 0, 0);
                        let sumForSelectedPeriod = null;
                        this.dataTableAll.forEach((obj, idx, arr) => {
                            obj.futureCharge = obj.cycleDate >= startOfToday;

                            // if (selectedCards.length === 1 && !this.indexOpenedRows.includes(obj.cycleDate)) {
                            //   this.indexOpenedRows.push(obj.cycleDate);
                            // }

                            if (obj.transactions.length) {
                                obj.cardIds = [];
                                obj.cardsData = {};
                                arr[idx].transactions.forEach((trns) => {
                                    trns.transDateStr = this.dtPipe.transform(
                                        trns.transDate,
                                        'dd/MM/yy'
                                    );
                                    trns.transTypeName = this.getNameOfCategory(trns.transTypeId);

                                    if (trns.creditCardId && !obj.cardsData[trns.creditCardId]) {
                                        obj.cardIds.push(trns.creditCardId);
                                        const transactionCard = selectedCards.find(
                                            (cc) => cc.creditCardId === trns.creditCardId
                                        );
                                        const transactionAcc =
                                            this.userService.appData.userData.creditCards.find(
                                                (ccAcc) =>
                                                    ccAcc.companyAccountId ===
                                                    transactionCard.companyAccountId
                                            );

                                        obj.cardsData[trns.creditCardId] = {
                                            creditCardNickname: transactionCard.creditCardNickname,
                                            creditCardNo: transactionCard.creditCardNo,
                                            bankLoaded: transactionCard.bankLoaded,
                                            creditCardTypeId: transactionCard.creditCardTypeId,
                                            accountNickname: transactionAcc.accountNickname,
                                            bankId: transactionAcc.bankId,
                                            nicknameByUser: transactionCard.nicknameByUser
                                        };
                                    }

                                    if (trns.currentPaymentNumber && trns.totalNumOfPayments) {
                                        trns.note =
                                            this.translate.translations[this.translate.currentLang]
                                                .expressions.paymentXFromY0 +
                                            trns.currentPaymentNumber +
                                            this.translate.translations[this.translate.currentLang]
                                                .expressions.paymentXFromY1 +
                                            trns.totalNumOfPayments;
                                    }
                                    if (trns.transTotal < 0) {
                                        trns.note = trns.note
                                            ? trns.note +
                                            ' ' +
                                            this.translate.translations[this.translate.currentLang]
                                                .expressions.credit
                                            : this.translate.translations[this.translate.currentLang]
                                                .expressions.credit;
                                    }
                                    if (
                                        trns.iskaCurrency &&
                                        trns.currency &&
                                        trns.iskaCurrency !== trns.currency
                                    ) {
                                        const forexTransNote = this.translate.instant(
                                            'expressions.forexTransaction'
                                        );
                                        trns.note = trns.note
                                            ? trns.note + ' ' + forexTransNote
                                            : forexTransNote;
                                    }

                                    trns.selectedTransType = this.companyTransTypes.find((tt) => {
                                        return tt.transTypeId === trns.transTypeId;
                                    });
                                });
                            }
                            if (
                                !sumForSelectedPeriod ||
                                !sumForSelectedPeriod[obj.iskatHulStr]
                            ) {
                                if (!sumForSelectedPeriod) {
                                    sumForSelectedPeriod = {};
                                }
                                sumForSelectedPeriod[obj.iskatHulStr] = 0;
                            }
                            sumForSelectedPeriod[obj.iskatHulStr] += +obj.cycleTotal;
                        });
                        this.selectionSummary.sumForSelectedPeriod = sumForSelectedPeriod;
                        this.filtersAll('', reloadCategoriesFilter);
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
            this.dataTableAll = [];
            this.filtersAll('', reloadCategoriesFilter);
            this.loader = false;
        }
    }

    setIndexRowCollapse(opened, cycleDate): void {
        if (opened) {
            this.sharedComponent.mixPanelEvent('open detailed transes');
            this.indexOpenedRows.push(cycleDate);
        } else {
            this.sharedComponent.mixPanelEvent('close detailed transes');
            const getIdx = this.indexOpenedRows.findIndex((element) => {
                return element === cycleDate;
            });
            if (getIdx > -1) {
                this.indexOpenedRows.splice(getIdx, 1);
            }
        }

        this.dataTable.forEach((dateTransGroup) => {
            dateTransGroup.opened =
                this.indexOpenedRows.findIndex(
                    (element) => element === dateTransGroup.cycleDate
                ) >= 0;
        });

        let allTransData = [];
        this.dataTable.forEach((it, idxs) => {
            const parentObj = JSON.parse(JSON.stringify(it));
            parentObj.idx = crypto['randomUUID']();
            parentObj.parent = true;
            allTransData.push(
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {transactions: null})
            );
            if (!parentObj.opened) {
                parentObj.transactions = [];
            } else {
                parentObj.transactions.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = crypto['randomUUID']();
                });
            }
            allTransData = allTransData.concat(parentObj.transactions);
        });
        this.allTransData = allTransData;
    }

    filtersAll(priority?: string, reloadCategoriesFilter?: any): void {
        let scrollTop = 0;

        if (reloadCategoriesFilter) {
            this.hideScroll = true;
            scrollTop = this.scrollContainer['elementRef'].nativeElement.scrollTop;
        }

        setTimeout(
            () => {
                const duplicateObject = JSON.parse(JSON.stringify(this.dataTableAll));
                this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
                    this.queryString
                );
                duplicateObject.forEach((dateTransGroup) => {
                    dateTransGroup.opened =
                        this.indexOpenedRows.findIndex(
                            (element) => element === dateTransGroup.cycleDate
                        ) >= 0;
                });
                this.dataTable = this.filterPipe.transform(
                    [].concat(duplicateObject),
                    this.queryString,
                    this.searchInDates
                        ? [...this.searchableList, 'transDateStr']
                        : this.searchableList,
                    'transactions'
                );

                if (priority !== 'filterTypes') {
                    this.rebuildTransTypesMap(this.dataTable);
                    // this.rebuildTransTypesMap(this.filterPipe.transform(this.dataTable, this.filterTypesCategory,
                    //     this.searchableListTypes, 'transactions'));
                }

                this.dataTable = this.filterPipe.transform(
                    this.dataTable,
                    this.filterTypesCategory,
                    this.searchableListTypes,
                    'transactions'
                );
                this.storageService.sessionStorageSetter(
                    'creditsCard/details-filterTypesCategory',
                    JSON.stringify(this.filterTypesCategory)
                );
                this.dataTable = this.sortPipe.transform(
                    this.dataTable,
                    'cycleDate',
                    this.sortPipeDir
                );
                this.dataTable.forEach((dateTransGroup) => {
                    dateTransGroup.transactions = this.sortPipe.transform(
                        dateTransGroup.transactions,
                        'transDate',
                        this.sortPipeDir
                    );
                    if (
                        this.queryString ||
                        (Array.isArray(this.filterTypesCategory) &&
                            this.filterTypesCategory.length)
                    ) {
                        dateTransGroup.cycleTotal = dateTransGroup.transactions.reduce(
                            (acmltr, trans) => acmltr + trans.transTotal,
                            0
                        );
                    }
                });

                if (this.dataTable && (this.filterTypesCategory || this.queryString)) {
                    this.dataTable
                        .filter(
                            (gr) => gr.transactions && gr.transactions.length && !gr.opened
                        )
                        .forEach((gr) => (gr.opened = true));
                }

                let allTransData = [];
                this.dataTable.forEach((it, idxs) => {
                    const parentObj = JSON.parse(JSON.stringify(it));
                    parentObj.idx = crypto['randomUUID']();
                    parentObj.parent = true;
                    allTransData.push(
                        Object.assign(JSON.parse(JSON.stringify(parentObj)), {transactions: null})
                    );
                    if (!parentObj.opened) {
                        parentObj.transactions = [];
                    } else {
                        parentObj.transactions.forEach((it1, idx1) => {
                            it1.idxParent = idxs;
                            it1.idx = crypto['randomUUID']();
                        });
                    }
                    allTransData = allTransData.concat(parentObj.transactions);
                });
                this.allTransData = allTransData;
                this.loader = false;
                this.currentPage = 0;
                // this.paginator.changePage(0);

                if (reloadCategoriesFilter) {
                    requestAnimationFrame(() => {
                        if (this.scrollContainer && this.scrollContainer['elementRef'].nativeElement) {
                            this.scrollContainer.scrollTo({top: scrollTop});
                            setTimeout(() => {
                                this.hideScroll = false;
                            }, 200);
                        }
                    });
                }
            },
            reloadCategoriesFilter ? 100 : 0
        );
    }

    collapseOpen(open: boolean): void {
        if (open) {
            this.sharedComponent.mixPanelEvent('open all');
            this.indexOpenedRows = this.dataTableAll.map((parent) => {
                return parent.cycleDate;
            });
        } else {
            this.sharedComponent.mixPanelEvent('close all');
            this.indexOpenedRows.length = 0;
        }

        this.dataTable.forEach((dateTransGroup) => {
            dateTransGroup.opened =
                this.indexOpenedRows.findIndex(
                    (element) => element === dateTransGroup.cycleDate
                ) >= 0;
        });

        let allTransData = [];
        this.dataTable.forEach((it, idxs) => {
            const parentObj = JSON.parse(JSON.stringify(it));
            parentObj.idx = crypto['randomUUID']();
            parentObj.parent = true;
            allTransData.push(
                Object.assign(JSON.parse(JSON.stringify(parentObj)), {transactions: null})
            );
            if (!parentObj.opened) {
                parentObj.transactions = [];
            } else {
                parentObj.transactions.forEach((it1, idx1) => {
                    it1.idxParent = idxs;
                    it1.idx = crypto['randomUUID']();
                });
            }
            allTransData = allTransData.concat(parentObj.transactions);
        });
        this.allTransData = allTransData;

        // // this.collapseOpenVal = open;
        // // this.dataTableAll.forEach((parent, idx, arr) => {
        // //   arr[idx].opened = open;
        // // });
        // this.filtersAll();
    }

    trackByIdData(index: number, row: any): number {
        return row.idx;
    }

    sortPipeFilter(): void {
        this.sharedComponent.mixPanelEvent('order date');
        this.sortPipeDir = this.sortPipeDir !== 'smaller' ? 'smaller' : 'bigger';
        this.filtersAll();
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

    public startDescriptionEditAt(trns: any, input: HTMLInputElement): void {
        this.editingTransaction = trns;
        this.showCategoryDropDown = false;
        requestAnimationFrame(() => {
            input.selectionStart = input.selectionEnd = 1000;
            // console.log('this.descInputRef.nativeElement -> %o, %o', this.descInputRef.nativeElement.scrollLeft,
            //   this.descInputRef.nativeElement.scrollWidth);
            input.scrollLeft =
                getComputedStyle(input).direction === 'rtl' ? 0 : input.scrollWidth;
        });
    }

    getNameOfCategory(id: any) {
        if (id && this.companyTransTypes) {
            const transTypeName = this.companyTransTypes.find((tt) => {
                return tt.transTypeId === id;
            });
            return transTypeName
                ? transTypeName.transTypeName
                : this.translate.instant('expressions.noTransType');
        } else {
            return '';
        }
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.transTypeChangeEventSub) {
            this.transTypeChangeEventSub.unsubscribe();
        }
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.transactionDetailsSub) {
            this.transactionDetailsSub.unsubscribe();
        }
        this.destroy();
    }

    public startCategoryEditAt(trns: any, event: any) {
        event.stopPropagation();
        this.editingTransaction = trns;
        this.showCategoryDropDown = true;
        setTimeout(() => {
            this.categorySelector.show();
        });
        if (!this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit = this.renderer.listen(
                'document',
                'click',
                ($event) => {
                    if (!this.editingTransaction) {
                        this.globalListenerWhenInEdit();
                        this.globalListenerWhenInEdit = null;
                        return;
                    }

                    if (
                        this.browserDetect.browserDetect.browser !== 'Edge' &&
                        this.browserDetect.browserDetect.browser !== 'Mozilla'
                    ) {
                        //   console.log('details row listener called');
                        const eventPath = BrowserService.pathFrom($event);
                        // console.log('Checking if should terminate edit: %o', eventPath);
                        const shouldTerminateEdit =
                            !eventPath[0].classList.contains('p-dialog-mask') &&
                            !eventPath.some(
                                (node) =>
                                    (this.scrollContainer && (node === this.scrollContainer['elementRef'].nativeElement)) ||
                                    (node.classList && node.classList.contains('p-dialog'))
                            );
                        if (shouldTerminateEdit) {
                            console.log('Terminating edit (clicked on : %o)', eventPath);
                            this.cancelChanges();
                        }
                    }
                }
            );
        }
    }

    public cancelChanges(): void {
        if (this.hasChanges()) {
            Object.assign(this.editingTransaction, this.editingTransactionOld);
        }
        this.editingTransaction = null;
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
            this.globalListenerWhenInEdit = null;
        }
    }

    public submitChanges($event: Event, reloadCategoriesFilter?: boolean): void {
        console.log('submit changes called %o', $event);
        if (!this.hasChanges()) {
            if (reloadCategoriesFilter) {
                this.hideScroll = true;
                this.filtersAll('', reloadCategoriesFilter);
            }
            return;
        }
        console.log('Submitting changes...');
        const oldValue = Object.assign({}, this.editingTransactionOld);
        if (!this.editingTransaction.secondDescription) {
            this.editingTransaction.secondDescription = oldValue.mainDescription;
        } else if (
            this.editingTransaction.secondDescription ===
            this.editingTransaction.mainDescription
        ) {
            this.editingTransaction.secondDescription = null;
        }

        this.sharedComponent.mixPanelEvent('credit description');

        // const capturedForSuccess = Object.assign({}, this.editingTransaction);
        this.sharedService
            .ccardTransRowUpdate({
                ccardTransId: this.editingTransaction.ccardTransId,
                companyAccountId: this.editingTransaction.companyAccountId,
                userDescription:
                    this.editingTransaction.secondDescription &&
                    this.editingTransaction.secondDescription ===
                    this.editingTransaction.mainDescription
                        ? null
                        : this.editingTransaction.mainDescription,
                transTypeId: this.editingTransaction.transTypeId,
                companyId: this.companyId
            })
            .subscribe(
                () => {
                    // this.getCreditCardTransactionDetails();

                    if (
                        this.editingTransaction &&
                        this.editingTransactionOld &&
                        this.editingTransaction.ccardTransId ===
                        this.editingTransactionOld.ccardTransId
                    ) {
                        this.editingTransactionOld = Object.assign(
                            {},
                            this.editingTransaction
                        );
                    }

                    // this.dataTableAll.some(group => {
                    //     const originalTrans = group.transactions.find(trns => trns.ccardTransId === capturedForSuccess.ccardTransId);
                    //     if (originalTrans) {
                    //         for (const propName of ['mainDescription', 'secondDescription', 'transTypeId', 'transTypeName']) {
                    //             originalTrans[propName] = capturedForSuccess[propName];
                    //         }
                    //         return true;
                    //     }
                    //     return false;
                    // });

                    this.dataTable.forEach((it) => {
                        const rowItem = it.transactions.find(
                            (ite) => ite.ccardTransId === this.editingTransaction.ccardTransId
                        );
                        if (rowItem) {
                            if (
                                this.editingTransaction.secondDescription &&
                                this.editingTransaction.secondDescription ===
                                this.editingTransaction.mainDescription
                            ) {
                            } else {
                                rowItem.mainDescription =
                                    this.editingTransaction.mainDescription;
                            }
                        }
                    });

                    this.dataTableAll.forEach((it) => {
                        const rowItem = it.transactions.find(
                            (ite) => ite.ccardTransId === this.editingTransaction.ccardTransId
                        );
                        if (rowItem) {
                            if (
                                this.editingTransaction.secondDescription &&
                                this.editingTransaction.secondDescription ===
                                this.editingTransaction.mainDescription
                            ) {
                            } else {
                                rowItem.mainDescription =
                                    this.editingTransaction.mainDescription;
                            }
                        }
                    });

                    if (reloadCategoriesFilter) {
                        this.hideScroll = true;
                        this.filtersAll('', reloadCategoriesFilter);
                    }
                },
                (err: HttpErrorResponse) => {
                    Object.assign(this.editingTransaction, oldValue);

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

    private hasChanges(): boolean {
        console.log('Checking if changed...');
        if (
            !this.editingTransactionOld ||
            !this.editingTransaction ||
            this.editingTransaction.ccardTransId !==
            this.editingTransactionOld.ccardTransId
        ) {
            return false;
        }

        // console.log('Checking if changed... 1');
        if (!this.editingTransaction.mainDescription) {
            this.editingTransaction.mainDescription =
                this.editingTransactionOld.mainDescription;
        }

        if (
            this.editingTransaction.selectedTransType !==
            this.editingTransactionOld.selectedTransType
        ) {
            if (
                this.editingTransaction &&
                this.editingTransactionOld &&
                this.editingTransaction.transTypeId ===
                this.editingTransactionOld.transTypeId
            ) {
                this.editingTransaction.transTypeId =
                    this.editingTransaction.selectedTransType.transTypeId;
                this.editingTransaction.transTypeName =
                    this.editingTransaction.selectedTransType.transTypeName;
                return true;
            }
        }
        // if (this.editingTransaction.selectedTransType !== this.editingTransactionOld.selectedTransType) {
        //     this.editingTransaction.transTypeId = this.editingTransaction.selectedTransType.transTypeId;
        //     this.editingTransaction.transTypeName = this.getNameOfCategory(this.editingTransaction.selectedTransType.transTypeId);
        //     return true;
        // }

        return (
            this.editingTransaction.mainDescription !==
            this.editingTransactionOld.mainDescription
        );
    }

    selectCreditCard(card: any): void {
        this.storageService.sessionStorageSetter(
            CardsSelectComponent.storageKey(this.route),
            JSON.stringify([card.creditCardId])
        );

        this.cardsSelector.applySelection([card.creditCardId]);
    }

    appearsInBankTooltip(trns: any): string | null {
        if (!trns.secondDescription) {
            return null;
        }
        if (!trns._appearsInBankTooltip) {
            trns._appearsInBankTooltip = this._sanitizer.sanitize(
                SecurityContext.HTML,
                // tslint:disable-next-line:max-line-length
                `${
                    this.translate.translations[this.translate.currentLang].expressions
                        .appearsInBankAs
                }<b>${trns.secondDescription}</b></span>`
            );
        }
        return trns._appearsInBankTooltip;
    }

    public showCardTooltip(trns: any): boolean {
        const eqNames =
            trns.creditCardNickname ===
            `${this.translate.instant('creditCards.' + trns.creditCardTypeId)}-${
                trns.creditCardNo
            }`;
        if (!trns.creditCardNo || eqNames) {
            return false;
        }
        return true;
    }

    public appearsInCardTooltip(trns: any): string | null {
        // const eqNames = trns.creditCardNickname === `${this.translate.instant('creditCards.' + trns.creditCardTypeId)}-${trns.creditCardNo}`;
        // if (!trns.creditCardNo || eqNames) {
        //     return null;
        // }
        if (!trns._appearsInCardTooltip) {
            trns._appearsInCardTooltip = this._sanitizer.sanitize(
                SecurityContext.HTML,
                `<span>${this.translate.instant(
                    'creditCards.' + trns.creditCardTypeId
                )}</span> <span>${trns.creditCardNo}</span>`
            );
        }
        return trns._appearsInCardTooltip;
    }

    private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
        const additionalProperties: any =
            reportType === 'EXCEL'
                ? {
                    sum: this.selectionSummary.sumForSelectedPeriodArr.map(
                        ([currency, value]) =>
                            [this.currencySymbolPipe.transform(currency), value].join('')
                    ),
                    // sum: this.selectionSummary.sumForSelectedPeriod,
                    availableCredit: this.selectionSummary.availableCredit,
                    cycleDay: this.selectionSummary.cycleDay,
                    message: this.reportService.buildCCardMessageFrom(
                        this.selectionSummary
                    ),
                    reportDays: this.childDates.asText(),
                    companyId: this.companyId,
                    currency: this.currencySymbolPipe.transform(
                        this.selectionSummary.currency
                    )
                }
                : {
                    sum: this.selectionSummary.sumForSelectedPeriodArr.map(
                        ([currency, value]) =>
                            [this.currencySymbolPipe.transform(currency), value].join('')
                    ),
                    // sum: this.selectionSummary.sumForSelectedPeriod,
                    // this.sumPipe.transform(this.selectionSummary.sumForSelectedPeriod, true),
                    availableCredit: this.selectionSummary.availableCredit,
                    // this.sumPipe.transform(this.selectionSummary.availableCredit, true),
                    cycleDay: this.selectionSummary.cycleDay,
                    message: this.reportService.buildCCardMessageFrom(
                        this.selectionSummary
                    ),
                    reportDays: this.childDates.asText(),
                    companyId: this.companyId,
                    currency: this.currencySymbolPipe.transform(
                        this.selectionSummary.currency
                    )
                };

        return {
            additionalProperties: additionalProperties,
            data: {
                report: this.dataTable.map((gr) => {
                    const clone = JSON.parse(JSON.stringify(gr));

                    clone.iskatHulStr = this.currencySymbolPipe.transform(
                        clone.iskatHulStr
                    );

                    clone.transactions.forEach((row) => {
                        [
                            'account',
                            '_appearsInBankTooltip',
                            'bankIconSrc',
                            'selectedTransType',
                            'transDateHumanizedStr',
                            'opened'
                        ].forEach((pn) => delete row[pn]);

                        row.currency = this.currencySymbolPipe.transform(row.currency);
                        row.iskaCurrency = this.currencySymbolPipe.transform(
                            row.iskaCurrency
                        );

                        const transCard = clone.cardsData[row.creditCardId];
                        if (clone.cardsData[row.creditCardId]) {
                            row.creditCardNickname =
                                this.translate.instant(
                                    'creditCards.' + transCard.creditCardTypeId
                                ) +
                                '\n' +
                                transCard.creditCardNo;
                        }
                    });

                    delete clone.cardIds;
                    delete clone.cardsData;

                    return clone;
                })
            }
        };
    }

    exportTransactions(resultFileType: string): void {
        this.reportService
            .getReport(
                'CREDIT_CARD_DETAILS',
                this.reportParamsFromCurrentView(resultFileType),
                resultFileType,
                this.reportService.prepareFilename(...this.getFilename())
            )
            .pipe(take(1))
            .subscribe(() => {
            });
    }

    private getFilename() {
        return [
            this.translate.instant(
                'menu.customers.financialManagement.creditsCard.main'
            ),
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
            .emailReport('CREDIT_CARD_DETAILS', request)
            .pipe(take(1))
            .subscribe(() => {
                this.reportMailSubmitterToggle = false;
            });
    }

    getPageHeightFunc(value: any) {
        return getPageHeight(value);
    }

    printTransactions(): void {
        this.reportService
            .printReport(
                'CREDIT_CARD_DETAILS',
                this.reportParamsFromCurrentView('PDF'),
                'PDF',
                this.getFilename().join(' ')
            )
            .pipe(take(1))
            .subscribe(() => {
            });
    }

    promptForTransTypeChangeApply(
        item: any,
        event: { originalEvent: Event; value: any }
    ) {
        console.log(
            'promptForTransTypeChangeApply ->> item: %o, event: %o',
            item,
            event
        );
        this.transTypeChangePrompt = {
            data: {
                transName: item.mainDescription,
                transTypeName: event.value.transTypeName,
                transTypeId: event.value.transTypeId,
                companyId: this.userService.appData.userData.companySelect.companyId,
                searchkeyId: item.searchkeyId,
                kvua: false,
                bankTransId: null,
                ccardTransId: item.ccardTransId
            },
            apply: () => {
                // item.transTypeName = event.value.transTypeName;
                // item.transTypeId = event.value.transTypeId;
                // item.selectedTransType = event.value;
                // this.dataTable.forEach((it) => {
                //     const rowItem = it.transactions.find((ite) => ite.ccardTransId === item.ccardTransId);
                //     if (rowItem) {
                //         rowItem.selectedTransType = event.value;
                //     }
                // });
                //
                // this.dataTableAll.forEach((it) => {
                //     const rowItem = it.transactions.find((ite) => ite.ccardTransId === item.ccardTransId);
                //     if (rowItem) {
                //         rowItem.selectedTransType = event.value;
                //     }
                // });
                //

                this.editingTransaction = item;
                this.editingTransaction.selectedTransType = event.value;
                this.submitChanges(event.originalEvent, true);

                const itemGroupInTable = this.dataTableAll.find((gr) =>
                    gr.transactions.some((ite) => ite.ccardTransId === item.ccardTransId)
                );
                if (itemGroupInTable) {
                    const tr = itemGroupInTable.transactions.find(
                        (ite) => ite.ccardTransId === item.ccardTransId
                    );
                    tr.selectedTransType = event.value;
                    tr.transTypeName = event.value.transTypeName;
                    tr.transTypeId = event.value.transTypeId;
                }

                // setTimeout(() => this.submitChanges(event.originalEvent, true), 1000);
            }
        };
        this.sharedComponent.mixPanelEvent('category');
    }
}
