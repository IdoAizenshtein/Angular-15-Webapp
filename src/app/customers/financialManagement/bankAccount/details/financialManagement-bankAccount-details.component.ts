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
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {UserService} from '@app/core/user.service';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {HttpErrorResponse} from '@angular/common/http';
import {combineLatest, Observable, of, Subscription, timer} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, first, map, take, tap} from 'rxjs/operators';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {SortPipe} from '@app/shared/pipes/sort.pipe';

import {FormArray, FormBuilder, FormControl} from '@angular/forms';

import {ActivatedRoute, Router} from '@angular/router';

import {DatePipe} from '@angular/common';
import {StorageService} from '@app/shared/services/storage.service';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {Paginator} from 'primeng/paginator';

import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {DomSanitizer} from '@angular/platform-browser';
import {CategorySelectComponent} from '@app/shared/component/category-select/category-select.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {UserDefaultsResolver} from '../../user-defaults-resolver.service';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {ReportService} from '@app/core/report.service';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {AccountsDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/accounts-date-range-selector.component';
import {ActionService} from '@app/core/action.service';
import {CustomPreset} from '@app/shared/component/date-range-selectors/presets';
import {TransTypesService} from '@app/core/transTypes.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './financialManagement-bankAccount-details.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementBankAccountDetailsComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    public filterTypesVal: any = null;
    public filterTypesCategory: any = null;
    public filterPaymentTypesCategory: any = null;
    public accountBalance: number;
    public creditLimit: number;
    searchInDates = false;

    get creditLimitAbs(): number {
        return Math.abs(this.creditLimit);
    }

    public balanceUse: number;
    public accountSelectExchange: any = false;
    public accountSelectInDeviation: any = false;
    public accountSelectOneNotUpdate: any = false;
    public dataTable: any[] = [];
    public dataTableAll: any[] = [];
    public searchableListTypes = ['paymentDesc', 'transTypeId'];
    public searchableList = [
        'paymentDescTranslate',
        'mainDesc',
        'transTypeName',
        'asmachta',
        'total',
        'itra',
        'mutavNames'
    ];
    // , 'accountNickname'];
    public queryString = '';
    public currentPage = 0;
    public entryLimit = 50;
    // @Input() counter: any = 10;
    public filterInput = new FormControl();

    @ViewChild(AccountsDateRangeSelectorComponent)
    childDates: AccountsDateRangeSelectorComponent;
    // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;
    private selectedRangeSub: Subscription;

    @ViewChild('scrollContainer') scrollContainer: ElementRef<HTMLElement>;
    private paymentTypesMap: { [key: string]: any };
    public paymentTypesArr: any[];
    private transTypesMap: { [key: string]: any };
    public transTypesArr: any[];
    public sortPipeDir: any = null;
    public loader = false;
    public companyTransTypes: any[] = [];
    public scrollContainerHasScroll = false;
    public dataTableToday: any[] = [];
    public questionableExpanded = false;
    public tablePristine = true;
    public updatePermitted: boolean;
    private readonly updatePermittedObs: Observable<number>;
    public companySelectSub: Subscription;
    private updatePermittedSub: Subscription;
    private subscription: Subscription;

    @ViewChild('paginator') paginator: Paginator;

    private transTypeChangeEventSub: Subscription;
    private readonly dtPipe: DatePipe;

    private _selectedTransaction: any;
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

    reportMailSubmitterToggle = false;

    totals: { totalExpenses: number; totalIncomes: number };

    @ViewChild(AccountSelectComponent) accountSelector: AccountSelectComponent;
    private actionNavigateToBankAccountDetailsSub: Subscription;

    summarizePresented: { total: number; totalHova: number };
    sortColumn: 'transDate' | 'description' = 'transDate';

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
    beneficiaryTransTypeChangePrompt: {
        data: {
            transTypeName: string;
            transName: string;
            transTypeId: string;
            companyId: string;
            transId: string;
            biziboxMutavId: string;
        };
        apply: () => void;
    };

    // private bankTransSub: Subscription;
    // private bankTransTodaySub: Subscription;
    private allTransactionsSub: Subscription;
    beneficiaryFilter = new FormControl();
    beneficiaryFilterOptions: Array<{
        val: string;
        id: string;
        checked: boolean;
    }> = [];
    public cashSplitPopupOpen: any = false;
    @ViewChild('scrollContainerInside') scrollContainerInside: ElementRef;
    public scrollContainerInsideHasScroll = false;
    @ViewChildren('totalFields', {read: ElementRef})
    paymentCreateTotalsRef: QueryList<ElementRef>;

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        public sharedService: SharedService,
        private reportService: ReportService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private route: ActivatedRoute,
        private router: Router,
        public fb: FormBuilder,
        private storageService: StorageService,
        // private domHandler: DomHandler,
        private _element: ElementRef,
        private renderer: Renderer2,
        private dtHumanizePipe: TodayRelativeHumanizePipe,
        private _sanitizer: DomSanitizer,
        private defaultsResolver: UserDefaultsResolver,
        private sumPipe: SumPipe,
        private currencySymbolPipe: CurrencySymbolPipe,
        private actionService: ActionService, // private beneficiaryService: BeneficiaryService,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);

        this.dtPipe = new DatePipe('en-IL');

        this.filterInput.valueChanges
            .pipe(
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged(),
                tap((term) => {
                    this.storageService.sessionStorageSetter('details-filterQuery', term);
                })
            )
            .subscribe((term) => {
                this.sharedComponent.mixPanelEvent('search');
                this.queryString = term;
                this.filtersAll();
            });

        this.updatePermittedObs = timer(100, 10 * 1000).pipe(
            map((x) => {
                console.log('Emitted %o -> %o', x, this.updatePermitted);
                return x;
            }),
            publishRef
        );

        this.subscription =
            this.transTypesService.selectedCompanyTransTypes.subscribe(
                (rslt) => (this.companyTransTypes = rslt)
            );
    }

    override reload() {
        console.log('reload child');
        this.changeAcc(false);
    }

    ngOnInit(): void {
        this.defaultsResolver.userDefaultsSubject.subscribe((userDefaults) => {
            console.log('resolved data ===> %o, userDefaults: %o', userDefaults);
            this.entryLimit =
                userDefaults && userDefaults.numberOfRowsPerTable
                    ? +userDefaults.numberOfRowsPerTable
                    : 50;
        });

        const detailsFilterTypesVal = this.storageService.sessionStorageGetterItem(
            'details-filterTypesVal'
        );
        if (detailsFilterTypesVal !== null) {
            this.filterTypesVal =
                detailsFilterTypesVal === 'null' ? null : detailsFilterTypesVal;
        }
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
        const detailsRowsPerPage = Number.parseInt(
            this.storageService.sessionStorageGetterItem(
                'bankAccount-details-rowsPerPage'
            )
        );
        if (Number.isFinite(detailsRowsPerPage)) {
            this.entryLimit = detailsRowsPerPage;
        }
        const detailsFilterQuery = this.storageService.sessionStorageGetterItem(
            'details-filterQuery'
        );
        if (detailsFilterQuery) {
            this.filterInput.setValue(detailsFilterQuery);
        }

        this.transTypeChangeEventSub =
            this.sharedService.transTypeChangeEvent.subscribe((evt) => {
                console.log('transTypeChangeEvent occured: %o', evt);

                if (this.dataTableAll) {
                    switch (evt.type) {
                        case 'change':
                            this.dataTableAll
                                .filter((trans) => trans.transTypeId === evt.value.transTypeId)
                                .forEach(
                                    (trans) => (trans.transTypeName = evt.value.transTypeName)
                                );
                            break;
                        case 'delete':
                            this.dataTableAll
                                .filter((trans) => trans.transTypeId === evt.value.transTypeId)
                                .forEach((trans) => {
                                    trans.transTypeName = 'ללא קטגוריה';
                                    trans.transTypeId = null;
                                });
                            break;
                    }
                }
            });
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.companySelectSub) {
            this.companySelectSub.unsubscribe();
        }
        if (this.updatePermittedSub) {
            this.updatePermittedSub.unsubscribe();
        }
        if (this.transTypeChangeEventSub) {
            this.transTypeChangeEventSub.unsubscribe();
        }
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
        }
        if (this.actionNavigateToBankAccountDetailsSub) {
            this.actionNavigateToBankAccountDetailsSub.unsubscribe();
        }
        if (this.selectedRangeSub) {
            this.selectedRangeSub.unsubscribe();
        }
        if (this.allTransactionsSub) {
            this.allTransactionsSub.unsubscribe();
        }
        this.destroy();
    }

    ngAfterViewInit() {
        console.log('ngAfterViewInit');
        this.actionNavigateToBankAccountDetailsSub =
            this.actionService.navigateToBankAccountDetails$.subscribe(
                (navParams) => {
                    if (navParams) {
                        this.queryString = navParams.query ? navParams.query : '';

                        if (navParams.preset) {
                            this.childDates.selectPresetWith(navParams.preset.name);
                        }

                        const accToSelect = navParams.accountId
                            ? this.userService.appData.userData.accounts.find(
                                (acc: any) => acc.companyAccountId === navParams.accountId
                            )
                            : null;
                        if (
                            accToSelect &&
                            !(
                                this.userService.appData.userData.accountSelect === 1 &&
                                this.userService.appData.userData.accountSelect[0] ===
                                accToSelect
                            )
                        ) {
                            setTimeout(() => {
                                this.userService.appData.userData.accountSelect = [accToSelect];
                                this.accountSelector.applyValuesFromModel();
                                this.changeAcc(null);
                            });
                        } else {
                            setTimeout(() => {
                                this.filtersAll();
                            });
                        }
                    }
                }
            );
        this.selectedRangeSub = this.childDates.selectedRange
            .pipe(
                filter(
                    () =>
                        Array.isArray(this.userService.appData.userData.accountSelect) &&
                        this.userService.appData.userData.accountSelect.length
                )
            )
            .subscribe((rng) => this.filterDates(rng));
        // this.storageService.sessionStorageSetter('bankAccount-defaultViewName', 'details');
        // this.defaultsResolver.setDisplayModeTo(this.route.snapshot.url[0].toString());
    }

    filterTypes(type: any) {
        this.filterTypesVal = type;
        this.filtersAll();
    }

    filterCategory(type: any) {
        if (type.type === 'payment') {
            this.sharedComponent.mixPanelEvent('filter - payment type', {
                value: type.checked
            });
            this.filterPaymentTypesCategory = type.checked;
            this.filtersAll('filterPaymentTypesCategory');
        } else if (type.type === 'transType') {
            this.sharedComponent.mixPanelEvent('filter - category', {
                value: type.checked
            });
            this.filterTypesCategory = type.checked;
            this.filtersAll('filterTypesCategory');
        } else if (type.type === 'biziboxMutavId') {
            this.sharedComponent.mixPanelEvent('filter - mutav', {
                value: type.checked
            });
            this.beneficiaryFilter.setValue(type.checked);
            this.filtersAll('biziboxMutavId');
        }
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

    changeAcc(event): void {
        if (event) {
            this.filterTypesVal = null;
            this.filterTypesCategory = null;
            this.filterPaymentTypesCategory = null;
        }
        this.loader = true;
        [this.accountBalance, this.creditLimit, this.balanceUse] =
            this.userService.appData.userData.accountSelect.reduce(
                function (a, b) {
                    return [
                        a[0] + b.accountBalance,
                        a[1] + b.creditLimit,
                        a[2] + b.balanceUse
                    ];
                },
                [0, 0, 0]
            );
        console.log('%o', [this.accountBalance, this.creditLimit, this.balanceUse]);
        if (this.userService.appData.userData.accountSelect.length > 1) {
            this.accountSelectInDeviation =
                this.userService.appData.userData.accountSelect.filter((account) => {
                    return account.balanceUse < 0;
                });
        } else {
            this.accountSelectInDeviation = [];
        }
        console.log(
            'this.accountSelectInDeviation => %o',
            this.accountSelectInDeviation
        );
        if (this.userService.appData.userData.accountSelect.length) {
            this.accountSelectExchange =
                this.userService.appData.userData.accountSelect.filter((account) => {
                    return account.currency !== 'ILS';
                });
            // if (this.accountSelectExchange.length) {
                this.sharedComponent.mixPanelEvent('accounts drop', {
                    accounts:(this.userService.appData.userData.accountSelect.length === this.accountSelectExchange.length) ? 'כל החשבונות מט"ח' :
                        (((this.userService.appData.userData.accounts.length-this.accountSelectExchange.length) === this.userService.appData.userData.accountSelect.length)? 'כל החשבונות' :
                            (
                                this.userService.appData.userData.accountSelect.map(
                                    (account) => {
                                        return account.companyAccountId;
                                    }
                                )
                            ))
                });
            // }
        } else {
            this.accountSelectExchange = [];
        }
        this.accountSelectOneNotUpdate = false;
        if (this.userService.appData.userData.accountSelect.length === 1) {
            if (
                !this.userService.appData.userData.accountSelect[0].isUpToDate &&
                !this.userService.appData.userData.accountSelect[0]
                    .outdatedBecauseNotFound
            ) {
                // if (!compareDates(new Date(), new Date(this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate))) {
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
                // this.accountSelectOneNotUpdate = getDaysBetweenDates(
                //     new Date(this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate),
                //     new Date());
            }
        }

        // this.childDates.filter('days');
        // this.filterDates(this.childDates.selectedPeriod);
        if (this.childDates) {
            this.childDates.selectedRange
                .pipe(take(1))
                .subscribe((rng) => this.filterDates(rng));
        }


        // const todayParameters: any = {
        //     'companyAccountIds': this.userService.appData.userData.accountSelect.map((account) => {
        //         return account.companyAccountId;
        //     }),
        //     'companyId': this.userService.appData.userData.companySelect.companyId
        // };
        //
        // if (this.bankTransTodaySub) {
        //     this.bankTransTodaySub.unsubscribe();
        // }
        // this.bankTransTodaySub = this.sharedService.getBankTransPeulotToday(todayParameters)
        //     .subscribe(response => {
        //         if (!response.body || response.body.length === 0) {
        //             this.dataTableToday = [];
        //             return;
        //         }
        //         this.dataTableToday = [].concat(
        //             response.body
        //                 .map(trns => this.setupTransItemView(trns))
        //                 .reduce((accmltr, trans) => {
        //                     if (trans.hova) {
        //                         accmltr.totalHova += +trans.total;
        //                     } else {
        //                         accmltr.total += +trans.total;
        //                     }
        //                     return accmltr;
        //                 }, {
        //                     rowSum: true,
        //                     balanceLastUpdatedDate: this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate,
        //                     total: 0,
        //                     totalHova: 0
        //                 }),
        //             response.body);
        //         // if (!this.mayUpdateQuestionableTransactions()) {
        //         //     this.updatePermittedSub = this.updatePermittedObs.subscribe(() => this.mayUpdateQuestionableTransactions());
        //         // }
        //         this.expandQuestionablesIfNeeded();
        //     });
        // // } else {
        // //     this.dataTableToday = [];
        // //     if (this.updatePermittedSub) {
        // //         this.updatePermittedSub.unsubscribe();
        // //     }
        // // }
    }

    mixPanelEventEvent(paymentDesc: unknown) {
        if (paymentDesc === 'BankTransfer') {
            this.sharedComponent.mixPanelEvent('perut bank transfer');
        }
        if (paymentDesc === 'Checks') {
            this.sharedComponent.mixPanelEvent('perut check');
        }
        if (paymentDesc === 'Loans') {
            this.sharedComponent.mixPanelEvent('perut loan');
        }
    }

    filterDates(paramDate: any): void {
        // debugger;
        this.loader = true;

        // if (this.bankTransTodaySub) {
        //     this.bankTransTodaySub.unsubscribe();
        // }
        //
        // if (this.bankTransSub) {
        //     this.bankTransSub.unsubscribe();
        // }

        if (this.allTransactionsSub) {
            this.allTransactionsSub.unsubscribe();
        }

        if (this.userService.appData.userData.accountSelect.length) {
            this.allTransactionsSub = combineLatest(
                [
                    this.userService.appData
                        .moment()
                        .isBetween(paramDate.fromDate, paramDate.toDate, 'day', '[]')
                        ? this.sharedService
                            .getBankTransPeulotToday({
                                companyAccountIds:
                                    this.userService.appData.userData.accountSelect.map(
                                        (account) => {
                                            return account.companyAccountId;
                                        }
                                    ),
                                companyId:
                                this.userService.appData.userData.companySelect.companyId
                            })
                            .pipe(
                                map((response: any) =>
                                    !response || response.error ? [] : response.body
                                )
                            )
                        : of([]),
                    this.sharedService
                        .getBankTrans({
                            companyAccountIds:
                                this.userService.appData.userData.accountSelect.map((account) => {
                                    return account.companyAccountId;
                                }),
                            companyId:
                            this.userService.appData.userData.companySelect.companyId,
                            dateFrom: paramDate.fromDate,
                            dateTill: paramDate.toDate
                        })
                        .pipe(
                            map((response: any) =>
                                !response || response.error
                                    ? {bankTransList: []}
                                    : response.body
                            )
                        ),
                    this.sharedService.paymentTypesTranslate$
                ]
            )
                // this.sharedService.paymentTypesTranslate$,
                // this.beneficiaryService.selectedCompanyBeneficiaries)
                .pipe(first())
                .subscribe(
                    (resSub: any) => {
                        const [responseQuestionable, response, paymentTypesTranslate] = resSub;
                        console.log(paymentTypesTranslate);
                        // .subscribe(([responseQuestionable, response, paymentTypesTranslate, selectedCompanyBeneficiaries]) => {
                        if (
                            !Array.isArray(responseQuestionable) ||
                            !responseQuestionable.length
                        ) {
                            this.dataTableToday = [];
                        } else {
                            this.dataTableToday = [].concat(
                                responseQuestionable
                                    .map((trns) =>
                                        this.setupTransItemView(trns, paymentTypesTranslate)
                                    )
                                    // .map(trns => this.setupTransItemView(trns, paymentTypesTranslate, selectedCompanyBeneficiaries))
                                    .reduce(
                                        (accmltr, trans: any) => {
                                            if (trans.hova) {
                                                accmltr.totalHova += trans.total;
                                            } else {
                                                accmltr.total += trans.total;
                                            }
                                            return accmltr;
                                        },
                                        {
                                            rowSum: true,
                                            balanceLastUpdatedDate:
                                            this.userService.appData.userData.accountSelect[0]
                                                .balanceLastUpdatedDate,
                                            total: 0,
                                            totalHova: 0
                                        }
                                    ),
                                responseQuestionable
                            );
                        }

                        if (!response) {
                            this.dataTableAll = [];
                            this.totals = response;
                        } else {
                            this.dataTableAll =
                                !Array.isArray(response.bankTransList) ||
                                !response.bankTransList.length
                                    ? []
                                    : response.bankTransList.map((trns) =>
                                        this.setupTransItemView(trns, paymentTypesTranslate)
                                    );
                            // .map(trns => this.setupTransItemView(trns, paymentTypesTranslate, selectedCompanyBeneficiaries));
                            this.totals = response;
                        }

                        // this.rebuildBeneficiaryFilterOptions([...this.dataTableAll, ...this.dataTableToday]);

                        this.filtersAll();
                    }
                );

            // if (this.userService.appData.moment().isBetween(paramDate.fromDate, paramDate.toDate, 'day', '[]')) {
            //     this.bankTransTodaySub = zip(
            //             this.sharedService.getBankTransPeulotToday({
            //                 companyAccountIds: this.userService.appData.userData.accountSelect.map((account) => {
            //                     return account.companyAccountId;
            //                 }),
            //                 companyId: this.userService.appData.userData.companySelect.companyId
            //             }),
            //             this.sharedService.paymentTypesTranslate$,
            //             this.beneficiaryService.selectedCompanyBeneficiaries)
            //         .subscribe(([response, paymentTypesTranslate, selectedCompanyBeneficiaries]) => {
            //             if (!response.body || response.body.length === 0) {
            //                 this.dataTableToday = [];
            //                 return;
            //             }
            //             this.dataTableToday = [].concat(
            //                 response.body
            //                     .map(trns => this.setupTransItemView(trns, paymentTypesTranslate))
            //                     .reduce((accmltr, trans) => {
            //                         if (trans.hova) {
            //                             accmltr.totalHova += +trans.total;
            //                         } else {
            //                             accmltr.total += +trans.total;
            //                         }
            //                         return accmltr;
            //                     }, {
            //                         rowSum: true,
            //                         balanceLastUpdatedDate: this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate,
            //                         total: 0,
            //                         totalHova: 0
            //                     }),
            //                 response.body);
            //             // if (!this.mayUpdateQuestionableTransactions()) {
            // tslint:disable-next-line:max-line-length
            //             //     this.updatePermittedSub = this.updatePermittedObs.subscribe(() => this.mayUpdateQuestionableTransactions());
            //             // }
            //             this.expandQuestionablesIfNeeded();
            //         });
            // } else {
            //     this.dataTableToday = [];
            // }
            //
            // const parameters: any = {
            //     'companyAccountIds': this.userService.appData.userData.accountSelect.map((account) => {
            //         return account.companyAccountId;
            //     }),
            //     'companyId': this.userService.appData.userData.companySelect.companyId,
            //     'dateFrom': paramDate.fromDate,
            //     'dateTill': paramDate.toDate
            // };
            // this.bankTransSub = zip(this.sharedService.getBankTrans(parameters),
            //     this.sharedService.paymentTypesTranslate$)
            //     .subscribe(([response, paymentTypesTranslate]) => {
            //             this.dataTableAll = response['body'].bankTransList
            //                 .map(trns => this.setupTransItemView(trns, paymentTypesTranslate));
            //             this.totals = response['body'];
            //             this.loader = false;
            //             this.filtersAll();
            //         }, (err: HttpErrorResponse) => {
            //             if (err.error) {
            //                 console.log('An error occurred:', err.error.message);
            //             } else {
            //                 console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
            //             }
            //         }
            //     );
        } else {
            this.dataTableAll = [];
            this.dataTableToday = [];
            this.loader = false;
            this.rebuildBeneficiaryFilterOptions([]);
            this.filtersAll();
        }
    }

    filtersAll(priority?: string): void {
        this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
            this.queryString
        );
        this.dataTable = this.filterPipe.transform(
            [].concat(this.dataTableAll),
            this.queryString,
            [...this.searchableList, 'transDateHumanizedStr']
        );
        this.dataTable = this.filterPipe.transform(
            this.dataTable,
            this.filterTypesVal,
            ['hova']
        );

        if (priority !== 'filterTypesCategory') {
            const buildMapFrom = this.withBeneficiaryFilterApplied(
                this.filterPipe.transform(
                    this.dataTable,
                    this.filterPaymentTypesCategory,
                    this.searchableListTypes
                )
            );
            this.rebuildTransTypesMap(buildMapFrom);
            // this.rebuildTransTypesMap(this.filterPipe.transform(this.dataTable, this.filterPaymentTypesCategory,
            //     this.searchableListTypes));
        }
        if (priority !== 'filterPaymentTypesCategory') {
            const buildMapFrom = this.withBeneficiaryFilterApplied(
                this.filterPipe.transform(
                    this.dataTable,
                    this.filterTypesCategory,
                    this.searchableListTypes
                )
            );
            this.rebuildPaymentTypesMap(buildMapFrom);
            // this.rebuildPaymentTypesMap(this.filterPipe.transform(this.dataTable, this.filterTypesCategory,
            //     this.searchableListTypes));
        }
        if (priority !== 'biziboxMutavId') {
            const buildMapFrom = this.filterPipe.transform(
                this.filterPipe.transform(
                    this.dataTable,
                    this.filterTypesCategory,
                    this.searchableListTypes
                ),
                this.filterPaymentTypesCategory,
                this.searchableListTypes
            );
            this.rebuildBeneficiaryFilterOptions(buildMapFrom);
        }

        // if (this.beneficiaryFilter.value) {
        this.dataTable = this.withBeneficiaryFilterApplied(this.dataTable);
        // this.dataTable = this.dataTable
        //     .filter(item => Array.isArray(item.mutavNames) && item.mutavNames.length > 0
        //         && this.beneficiaryFilter.value.some(bnfName => item.mutavNames.includes(bnfName)));
        // // this.dataTable = this.filterPipe.transform(this.dataTable, this.beneficiaryFilter.value,
        // //     ['biziboxMutavId']);
        // }

        this.dataTable = this.filterPipe.transform(
            this.dataTable,
            this.filterTypesCategory,
            this.searchableListTypes
        );
        this.dataTable = this.filterPipe.transform(
            this.dataTable,
            this.filterPaymentTypesCategory,
            this.searchableListTypes
        );

        this.storageService.sessionStorageSetter(
            'details-filterTypesVal',
            this.filterTypesVal
        );
        this.storageService.sessionStorageSetter(
            'details-filterPaymentTypesCategory',
            JSON.stringify(this.filterPaymentTypesCategory)
        );
        this.storageService.sessionStorageSetter(
            'details-filterTypesCategory',
            JSON.stringify(this.filterTypesCategory)
        );

        this.dataTable = this.sortPipe.transform(
            this.dataTable,
            this.sortColumn === 'transDate' ? 'rowNum' : 'mainDesc',
            this.sortPipeDir
        );
        this.reduceSumsFilter();
        this.loader = false;
        this.currentPage = 0;
        this.paginator.changePage(0);

        this.tablePristine =
            this.sortColumn === 'transDate' &&
            (this.sortPipeDir === null || this.sortPipeDir === 'bigger') &&
            !this.queryString &&
            // && this.filterTypesVal === null
            this.filterTypesCategory === null &&
            this.filterPaymentTypesCategory === null;

        this.summarizePresented = [
            ...this.dataTable,
            ...(this.tablePristine ? this.dataTableToday : [])
        ]
            .filter((row) => !row.rowSum)
            .reduce(
                (acmltr, tr) => {
                    if (tr.hova === true) {
                        acmltr.totalHova += tr.total;
                    } else {
                        acmltr.total += tr.total;
                    }
                    return acmltr;
                },
                {total: 0, totalHova: 0}
            );

        this.expandQuestionablesIfNeeded();

        this.validateScrollPresence();
    }

    private expandQuestionablesIfNeeded(): void {
        if (
            this.tablePristine &&
            !this.questionableExpanded &&
            this.dataTableToday.length > 0 &&
            this.dataTableAll.length === 0
        ) {
            // debugger;
            this.questionableExpanded = true;
        }
    }

    sortPipeFilter(eventColumn: 'transDate' | 'description'): void {
        if (eventColumn === 'transDate') {
            this.sharedComponent.mixPanelEvent('order - date');
        }
        if (eventColumn === 'description') {
            this.sharedComponent.mixPanelEvent('order - description');
        }

        if (eventColumn !== this.sortColumn) {
            this.sortColumn = eventColumn;
            this.sortPipeDir = 'bigger';
        } else {
            if (this.sortPipeDir && this.sortPipeDir === 'smaller') {
                this.sortPipeDir = 'bigger';
            } else {
                this.sortPipeDir = 'smaller';
            }
        }

        this.filtersAll();
    }

    reduceSumsFilter(): void {
        [].concat(this.dataTable).reduce((a, b, idx, arr) => {
                try {
                    let totalHova = 0,
                        total = 0,
                        rowSum = 0;
                    if (b.hova) {
                        totalHova = +b.total;
                    } else {
                        total = +b.total;
                    }
                    const thisDate = new Date(b.transDate).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: '2-digit'
                    });
                    if (idx !== 0) {
                        const nextRowDate = new Date(arr[idx - 1].transDate).toLocaleString(
                            'en-GB',
                            {
                                year: 'numeric',
                                month: '2-digit'
                            }
                        );
                        if (thisDate !== nextRowDate) {
                            rowSum = 1;
                            this.dataTable.splice(idx + a[3], 0, {
                                rowSum: true,
                                itra: a[0],
                                total: a[1],
                                totalHova: a[2],
                                date: arr[idx - 1].transDate
                            });
                            a[0] = 0;
                            a[1] = 0;
                            a[2] = 0;
                        }
                        if (arr.length === idx + 1) {
                            this.dataTable.splice(idx + a[3] + 2, 0, {
                                rowSum: true,
                                itra: a[0] + +b.itra,
                                total: a[1] + total,
                                totalHova: a[2] + totalHova,
                                date: arr[idx].transDate
                            });
                            a[0] = 0;
                            a[1] = 0;
                            a[2] = 0;
                        }
                    }
                    return [
                        a[0] + +b.itra,
                        a[1] + total,
                        a[2] + totalHova,
                        a[3] + rowSum
                    ];
                } catch (e) {
                    return [0, 0, 0, 0];
                }
            },
            [0, 0, 0, 0]
        );
    }

    trackById(index: number, val: any): number {
        return val.rowNum;
    }

    paginate(event) {
        console.log('paginate ===> %o', event);

        if (this.entryLimit !== +event.rows) {
            this.entryLimit = +event.rows;
            // this.storageService.sessionStorageSetter('bankAccount-details-rowsPerPage', event.rows);
            this.defaultsResolver.setNumberOfRowsAt(this.entryLimit);
        }

        if (this.currentPage !== +event.page) {
            this.scrollContainer.nativeElement.scrollTop = 0;
            this.currentPage = event.page;
            // this.hideAdditional();
        }
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
                    val: this.translate.instant('filters.all'),
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
                    val: this.translate.instant('filters.all'),
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

    private validateScrollPresence(): void {
        setTimeout(() => {
            const scrollContainerHasScrollNow =
                this.scrollContainer !== null &&
                this.scrollContainer.nativeElement.scrollHeight >
                this.scrollContainer.nativeElement.clientHeight;
            if (this.scrollContainerHasScroll !== scrollContainerHasScrollNow) {
                // console.log('validateScrollPresence: scrollContainerHasScroll > %o', scrollContainerHasScrollNow);
                this.scrollContainerHasScroll = scrollContainerHasScrollNow;
            }
        });
    }

    private mayUpdateQuestionableTransactions(): boolean {
        // console.log('here --------> this = %o', this);
        this.updatePermitted =
            Date.now() - this.dataTableToday[0].balanceLastUpdatedDate >=
            60 * 60 * 1000;
        if (this.updatePermitted && this.updatePermittedSub) {
            this.updatePermittedSub.unsubscribe();
        }
        return this.updatePermitted;
    }

    updateQuestionable(): void {
        this.dataTableToday[0].balanceLastUpdatedDate = Date.now();
        this.updatePermitted = false;
        this.updatePermittedSub = this.updatePermittedObs.subscribe(() =>
            this.mayUpdateQuestionableTransactions()
        );
    }

    selectAccountInDeviation(
        accountSelector: AccountSelectComponent,
        account: any
    ): void {
        console.log('%o, %o', accountSelector, account);
        this.userService.appData.userData.accountSelect = [].concat(account);
        accountSelector.applyValuesFromModel();
        this.changeAcc(null);
        // accountSelector.selectAccount(account);
    }

    clearFilter(): void {
        this.queryString = null;
        this.filterTypesVal = null;
        this.filterTypesCategory = null;
        this.filterPaymentTypesCategory = null;
        this.filtersAll();
    }

    private setupTransItemView(
        trns: any,
        paymentTypesTranslate: { [p: string]: string }
    ): void {
        // private setupTransItemView(trns: any, paymentTypesTranslate: { [p: string]: string },
        //                            selectedCompanyBeneficiaries: Array<Beneficiary>): void {
        // console.log('trns -> %o', trns);

        const trnsAcc = this.userService.appData.userData.accounts.find(
            (acc: any) => acc.companyAccountId === trns.companyAccountId
        );

        if (trns.pictureLink === 'x' || trns.pictureLink === 'X') {
            trns.pictureLink = null;
        }

        let mayEditTransType = true;
        if (
            (trns.paymentDesc === 'Checks' &&
                trns.pictureLink !== null &&
                trns.pictureLink !== '00000000-0000-0000-0000-000000000000') ||
            (trns.linkId && trns.linkId !== '00000000-0000-0000-0000-000000000000') ||
            (trns.cashCat && trns.cashCat === true)
        ) {
            mayEditTransType = false;
        }
        // if (trns.paymentDesc === 'Checks' && trns.pictureLink !== null && trns.pictureLink !== '00000000-0000-0000-0000-000000000000') {
        //     trns.transTypeName = 'קטגוריות שונות';
        // }

        return Object.assign(trns, {
            account: trnsAcc,
            accountNickname: trnsAcc ? trnsAcc.accountNickname : null,
            // bankIconSrc: trnsAcc ? '/assets/images/bank' + trnsAcc.bankId + '.png' : null,
            paymentDescTranslate: paymentTypesTranslate[trns['paymentDesc']],
            // paymentDescTranslate: this.translate.translations[this.translate.currentLang]
            //     .paymentTypes[trns['paymentDesc']],
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.transDate,
                'dd/MM/yy'
            ),
            transDateStr: this.dtPipe.transform(trns.transDate, 'dd/MM/yy'),
            selectedTransType: this.companyTransTypes.find((tt) => {
                return tt.transTypeId === trns.transTypeId;
            }),
            mayEditTransType: mayEditTransType
            // mayEditTransType: !!trns.biziboxMutavId
            //     ? !trns.linkId || trns.linkId !== '00000000-0000-0000-0000-000000000000'
            //     : true
            // beneficiary: !!trns.biziboxMutavId && Array.isArray(selectedCompanyBeneficiaries)
            //     ? selectedCompanyBeneficiaries.find(bnf => bnf.biziboxMutavId === trns.biziboxMutavId)
            //     : null
        });
    }

    public appearsInBankTooltip(trns: any): string | null {
        if (!trns.secondDesc) {
            return null;
        }
        if (!trns._appearsInBankTooltip) {
            trns._appearsInBankTooltip = this._sanitizer.sanitize(
                SecurityContext.HTML,
                `${
                    this.translate.translations[this.translate.currentLang].expressions
                        .appearsInBankAs
                }<b>${trns.secondDesc}</b></span>`
            );
        }
        return trns._appearsInBankTooltip;
    }

    public descriptionTooltip(transDesc: HTMLElement): string | null {
        // console.log('descriptionTooltip: %o', transDesc);
        return transDesc.clientWidth < transDesc.scrollWidth
            ? transDesc.innerText || transDesc.textContent
            : null;
    }

    public startDescriptionEditAt(trns: any, input: HTMLInputElement): void {
        this.editingTransaction = trns;
        this.showCategoryDropDown = false;
        requestAnimationFrame(() => {
            //   // this.descInputRef.nativeElement.select();
            input.selectionStart = input.selectionEnd = 1000;
            // console.log('this.descInputRef.nativeElement -> %o, %o', this.descInputRef.nativeElement.scrollLeft,
            //   this.descInputRef.nativeElement.scrollWidth);
            input.scrollLeft =
                getComputedStyle(input).direction === 'rtl' ? 0 : input.scrollWidth;
        });
    }

    public startCategoryEditAt(trns: any, event: any) {
        event.stopPropagation();
        this.editingTransaction = trns;
        this.showCategoryDropDown = true;
        // setTimeout(() => {
        //   this.categorySelector.show();
        // });
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
                    //   console.log('details row listener called');
                    const eventPath = BrowserService.pathFrom($event);
                    // console.log('Checking if should terminate edit: %o', eventPath);
                    const shouldTerminateEdit =
                        !eventPath[0].classList.contains('p-dialog-mask') &&
                        !eventPath.some(
                            (node) =>
                                (this.scrollContainer && (node === this.scrollContainer.nativeElement)) ||
                                (node.classList && node.classList.contains('p-dialog'))
                        );
                    if (shouldTerminateEdit) {
                        console.log('Terminating edit (clicked on : %o)', eventPath);
                        this.cancelChanges();
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

    public submitChanges($event: Event): void {
        // console.log('submit changes called %o', $event);
        if (!this.hasChanges()) {
            return;
        }
        this.editingTransaction.selectedTransType = 'bankdetail';
        console.log('Submitting changes...');
        const oldValue = Object.assign({}, this.editingTransactionOld);
        if (!this.editingTransaction.secondDesc) {
            this.editingTransaction.secondDesc = oldValue.mainDesc;
        }

        this.sharedService
            .bankTransRowUpdate({
                transId: this.editingTransaction.bankTransId,
                companyId: this.companyId,
                transName: this.editingTransaction.mainDesc,
                transTypeId: this.editingTransaction.transTypeId,
                companyAccountId: this.editingTransaction.companyAccountId
            })
            .subscribe(
                () => {
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

                    const currPageTmp = this.paginator ? this.paginator.getPage() : null;

                    this.filtersAll();

                    if (currPageTmp && this.paginator.getPageCount() > currPageTmp) {
                        this.currentPage = currPageTmp;
                        this.paginator.changePage(this.currentPage);
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
        // console.log('Checking if changed...');

        if (
            !this.editingTransactionOld ||
            !this.editingTransaction ||
            this.editingTransaction.bankTransId !==
            this.editingTransactionOld.bankTransId
        ) {
            return false;
        }

        // console.log('Checking if changed... 1');
        if (!this.editingTransaction.mainDesc) {
            this.editingTransaction.mainDesc = this.editingTransactionOld.mainDesc;
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

        return (
            this.editingTransaction.mainDesc !== this.editingTransactionOld.mainDesc
        );
    }

    private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
        const additionalProperties: any =
            reportType === 'EXCEL'
                ? {
                    accountBalance: this.accountBalance,
                    usedBalance: this.balanceUse,
                    reportDays: this.childDates.asText(),
                    creditLimit: this.creditLimitAbs,
                    currency: this.currencySymbolPipe.transform(
                        this.userService.appData.userData.accountSelect[0].currency
                    ),
                    message: this.reportService.buildMessageFrom(
                        this.userService.appData.userData.accountSelect
                    )
                }
                : {
                    accountBalance: this.sumPipe.transform(this.accountBalance, true),
                    usedBalance: this.sumPipe.transform(this.balanceUse, true),
                    reportDays: this.childDates.asText(),
                    creditLimit: this.sumPipe.transform(this.creditLimitAbs, true),
                    currency: this.currencySymbolPipe.transform(
                        this.userService.appData.userData.accountSelect[0].currency
                    ),
                    message: this.reportService.buildMessageFrom(
                        this.userService.appData.userData.accountSelect
                    )
                };

        return {
            additionalProperties: additionalProperties,
            data: {
                report: [
                    ...(this.tablePristine ? this.dataTableToday : []),
                    ...this.dataTable
                ]
                    .filter((trnsRow) => !trnsRow.rowSum)
                    .map((row) => {
                        const clone = JSON.parse(JSON.stringify(row));
                        [
                            'account',
                            '_appearsInBankTooltip',
                            'bankIconSrc',
                            'selectedTransType',
                            'transDateHumanizedStr'
                        ].forEach((pn) => delete clone[pn]);

                        return clone;
                    })
                // report: [].concat(this.dataTable.filter(trnsRow => !(trnsRow.rowSum)))
                //     .concat(this.tablePristine ? this.dataTableToday.filter(trnsRow => !(trnsRow.rowSum)) : [])
                //     .map(row => {
                //         const clone = JSON.parse(JSON.stringify(row));
                //         ['account', '_appearsInBankTooltip', 'bankIconSrc', 'selectedTransType', 'transDateHumanizedStr']
                //             .forEach(pn => delete clone[pn]);
                //
                //         return clone;
                //     })
            }
        };
    }

    exportTransactions(resultFileType: string): void {
        this.reportService
            .getReport(
                'BANK_TRANS_DETAILED',
                this.reportParamsFromCurrentView(resultFileType),
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
                'BANK_TRANS_DETAILED',
                this.reportParamsFromCurrentView('PDF'),
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
            .emailReport('BANK_TRANS_DETAILED', request)
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
            'תצוגה מפורטת',
            this.childDates.asText(),
            this.userService.appData.userData.companySelect.companyName
        ];
    }

    navigateToMatchView(item: any): void {
        let navUrl;
        if (item.matchPrc === 100) {
            navUrl = [
                !this.userService.appData.userData.accountant
                    ? '/cfl/cash-flow/bankmatch/bank/matched'
                    : '/accountants/companies/cash-flow/bankmatch/bank/matched'
            ];
            this.storageService.sessionStorageSetter(
                'bank/matched-filterDates',
                JSON.stringify(CustomPreset.createDatesPreset(new Date(item.transDate)))
            );

            // this.storageService.sessionStorageSetter('bank/matched-filterDates', JSON.stringify({
            //     selectedValue: '2',
            //     dates: {
            //         calendarFrom: new Date(item.transDate).toISOString(),
            //         calendarUntil: new Date(item.transDate).toISOString()
            //     }
            // }));
        } else {

            navUrl = [
                !this.userService.appData.userData.accountant
                    ? '/cfl/cash-flow/bankmatch/bank'
                    : '/accountants/companies/cash-flow/bankmatch/bank'
            ];
        }

        if (item.hathamaHelkit) {
            this.sharedComponent.mixPanelEvent('half matched trans');
        } else {
            if (item.matchPrc === 100) {
                this.sharedComponent.mixPanelEvent('matched trans');
            } else {
                this.sharedComponent.mixPanelEvent('not matched trans');
            }
        }


        this.userService.appData.userData.bankMatchAccountIdNavigateTo =
            item.companyAccountId;
        this.router.navigate(navUrl, {queryParamsHandling: 'preserve'});
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
                transName: item.mainDesc,
                transTypeName: event.value.transTypeName,
                transTypeId: event.value.transTypeId,
                companyId: this.userService.appData.userData.companySelect.companyId,
                searchkeyId: item.searchkeyId,
                kvua: item.kvua,
                bankTransId: item.bankTransId,
                ccardTransId: null
            },
            apply: () => {
                this.editingTransaction = item;
                this.editingTransaction.selectedTransType = event.value;
                this.submitChanges(event.originalEvent);
            }
        };
    }

    promptForBeneficiaryTransTypeChangeApply(
        item: any,
        event: { originalEvent: Event; value: any }
    ) {
        console.log(
            'promptForBeneficiaryTransTypeChangeApply ->> item: %o, event: %o',
            item,
            event
        );
        this.beneficiaryTransTypeChangePrompt = {
            data: {
                transName: item.mainDesc,
                transTypeName: event.value.transTypeName,
                transTypeId: event.value.transTypeId,
                companyId: this.userService.appData.userData.companySelect.companyId,
                transId: item.bankTransId,
                biziboxMutavId: item.biziboxMutavId
            },
            apply: () => {
                this.editingTransaction = item;
                this.editingTransaction.selectedTransType = event.value;
                this.submitChanges(event.originalEvent);
            }
        };
    }

    handler(event?: any) {
        this.filterDates(
            this.childDates.selectedPreset.selectedPeriod(this.userService)
        );
    }

    private rebuildBeneficiaryFilterOptions(
        withOtherFiltersApplied: any[]
    ): void {
        if (
            !Array.isArray(withOtherFiltersApplied) ||
            !withOtherFiltersApplied.length
        ) {
            this.beneficiaryFilterOptions = [];
            this.beneficiaryFilter.setValue(null);
            return;
        }

        const availableOptions = Array.from(
            withOtherFiltersApplied.reduce((acmltr, trns) => {
                return Array.isArray(trns.mutavNames) && trns.mutavNames.length
                    ? trns.mutavNames.reduce((acmltr0, mn) => acmltr0.add(mn), acmltr)
                    : acmltr;
            }, new Set())
        ).map((beneficiaryName: any) => {
            return {
                val: beneficiaryName,
                id: beneficiaryName,
                checked:
                    !Array.isArray(this.beneficiaryFilter.value) ||
                    this.beneficiaryFilter.value.includes(beneficiaryName)
            };
        });
        // const availableOptions = Array.from(withOtherFiltersApplied.reduce((acmltr, trns) => {
        //         return trns.beneficiary ? acmltr.add(trns.beneficiary) : acmltr;
        //     }, new Set())
        // ).map((beneficiary: any) => {
        //     return {
        //         val: beneficiary.accountMutavName,
        //         id: beneficiary.biziboxMutavId,
        //         checked: !Array.isArray(this.beneficiaryFilter.value)
        //             || this.beneficiaryFilter.value.includes(beneficiary.biziboxMutavId)
        //     };
        // });

        // if (!availableOptions.length) {
        //     this.beneficiaryFilterOptions = [];
        //     this.beneficiaryFilter.setValue(null);
        //     return;
        // }
        if (
            withOtherFiltersApplied.some(
                (trns) => !Array.isArray(trns.mutavNames) || !trns.mutavNames.length
            )
        ) {
            availableOptions.push({
                val: 'ללא מוטב',
                id: 'n/a',
                checked:
                    !Array.isArray(this.beneficiaryFilter.value) ||
                    this.beneficiaryFilter.value.includes('n/a')
            });
        }

        if (
            Array.isArray(this.beneficiaryFilter.value) &&
            availableOptions.length
        ) {
            const valueStillAvailable = this.beneficiaryFilter.value.filter((fval) =>
                availableOptions.some((opt) => opt.id === fval)
            );
            if (valueStillAvailable.length !== this.beneficiaryFilter.value.length) {
                this.beneficiaryFilter.setValue(
                    valueStillAvailable.length === 0 ? null : valueStillAvailable
                );
            }
        }

        this.beneficiaryFilterOptions = [
            {
                val: this.translate.instant('filters.all'),
                id: 'all',
                checked: availableOptions.every((opt) => !!opt.checked)
            },
            ...availableOptions
        ];
        // console.log('this.beneficiaryFilterOptions => %o', this.beneficiaryFilterOptions);
    }

    private withBeneficiaryFilterApplied(withOtherFiltersApplied: any[]): any[] {
        if (
            !Array.isArray(this.beneficiaryFilter.value) ||
            !Array.isArray(withOtherFiltersApplied) ||
            !withOtherFiltersApplied.length
        ) {
            return withOtherFiltersApplied;
        }

        if (this.beneficiaryFilter.value.includes('n/a')) {
            const nonEmptyFilterVals = this.beneficiaryFilter.value.filter(
                (v) => v !== 'n/a'
            );
            return withOtherFiltersApplied.filter(
                (item) =>
                    !Array.isArray(item.mutavNames) ||
                    !item.mutavNames.length ||
                    (nonEmptyFilterVals.length &&
                        Array.isArray(item.mutavNames) &&
                        item.mutavNames.length > 0 &&
                        nonEmptyFilterVals.some((bnfName) =>
                            item.mutavNames.includes(bnfName)
                        ))
            );
        }
        return this.filterPipe.transform(
            withOtherFiltersApplied,
            this.beneficiaryFilter.value,
            ['mutavNames']
        );
    }

    get arr(): FormArray {
        return this.cashSplitPopupOpen.table.get('arr') as FormArray;
    }

    round(num: number): number {
        return Math.round(num);
    }

    public openCashSplit(item: any, event: any): void {
        this.cashSplitPopupOpen = item;
        this.cashSplitPopupOpen.tableSrc = [];
        this.sharedService
            .cashDetails({
                uuid: this.cashSplitPopupOpen.bankTransId
            })
            .subscribe(
                (response: any) => {
                    const data = response ? response['body'] : response;
                    if (data && data.length) {
                        this.cashSplitPopupOpen.tableSrc = data;
                        this.cashSplitPopupOpen.table = this.fb.group({
                            name: 'formGr',
                            arr: this.fb.array(
                                data.map((it) => {
                                    let transTypeId = this.companyTransTypes.find((tt) => {
                                        return tt.transTypeId === it.transTypeId;
                                    });
                                    if (!transTypeId) {
                                        transTypeId = this.companyTransTypes.find((tt) => {
                                            return (
                                                tt.transTypeId ===
                                                '8a583d2a-c88d-584c-a2a2-33ae9a36d888'
                                            );
                                        });
                                    }
                                    return this.fb.group({
                                        cashCatDesc: it.cashCatDesc,
                                        total: it.total,
                                        isDeleted: it.isDeleted,
                                        transTypeId: transTypeId,
                                        cashCatId: it.cashCatId
                                    });
                                })
                            )
                        });
                    } else {
                        this.cashSplitPopupOpen.table = this.fb.group({
                            name: 'formGr',
                            arr: this.fb.array([
                                this.fb.group({
                                    cashCatDesc: this.cashSplitPopupOpen.mainDesc,
                                    total: this.cashSplitPopupOpen.total,
                                    cashCatId: null,
                                    isDeleted: false,
                                    transTypeId: this.companyTransTypes.find((tt) => {
                                        return (
                                            tt.transTypeId === '8a583d2a-c88d-584c-a2a2-33ae9a36d888'
                                        );
                                    })
                                })
                            ])
                        });
                    }

                    this.calcSumTotals();
                },
                () => {
                    this.cashSplitPopupOpen.table = this.fb.group({
                        name: 'formGr',
                        arr: this.fb.array([
                            this.fb.group({
                                cashCatDesc: this.cashSplitPopupOpen.mainDesc,
                                total: this.cashSplitPopupOpen.total,
                                cashCatId: null,
                                isDeleted: false,
                                transTypeId: this.companyTransTypes.find((tt) => {
                                    return (
                                        tt.transTypeId === '8a583d2a-c88d-584c-a2a2-33ae9a36d888'
                                    );
                                })
                            })
                        ])
                    });
                    this.calcSumTotals();
                }
            );

        this.cashSplitPopupOpen.offsetTop =
            window.innerHeight > event.clientY + 30 + 315
                ? event.clientY + 30
                : event.clientY - 315 - 20;
    }

    public addSplit(transferFocus?: boolean): void {
        const obj = {
            cashCatDesc: this.cashSplitPopupOpen.mainDesc,
            total: '',
            cashCatId: null,
            isDeleted: false,
            transTypeId: this.companyTransTypes.find((tt) => {
                return tt.transTypeId === '8a583d2a-c88d-584c-a2a2-33ae9a36d888';
            })
        };
        this.arr.push(this.fb.group(obj));
        this.validateScrollPresenceInside();
        this.calcSumTotals();

        if (transferFocus === true) {
            setTimeout(() => {
                this.paymentCreateTotalsRef.last.nativeElement.focus();
            });
        }

        requestAnimationFrame(() => {
            this.paymentCreateTotalsRef.last.nativeElement.scrollIntoView();
        });
    }

    removeItem(index: number) {
        this.arr.removeAt(index);
        this.arr.updateValueAndValidity();

        this.validateScrollPresenceInside();
        this.calcSumTotals();
    }

    private validateScrollPresenceInside(): void {
        setTimeout(() => {
            const scrollContainerHasScrollNow =
                this.scrollContainerInside !== null &&
                this.scrollContainerInside.nativeElement.scrollHeight >
                this.scrollContainerInside.nativeElement.clientHeight;
            if (this.scrollContainerInsideHasScroll !== scrollContainerHasScrollNow) {
                this.scrollContainerInsideHasScroll = scrollContainerHasScrollNow;
            }
        });
    }

    public calcSumTotals(): void {
        this.cashSplitPopupOpen.sumTotals = this.arr.value.reduce(
            (total, item) => total + Number(item.total),
            0
        );
    }

    public submitData(): void {
        if (!this.cashSplitPopupOpen.table.valid) {
            BrowserService.flattenControls(this.cashSplitPopupOpen.table).forEach(
                (ac) => ac.markAsDirty()
            );
            return;
        }

        const cashData = JSON.parse(JSON.stringify(this.arr.value));
        cashData.forEach((it) => {
            it.isDeleted = false;
            it.transTypeId = it.transTypeId.transTypeId;
        });
        if (this.cashSplitPopupOpen.tableSrc.length) {
            this.cashSplitPopupOpen.tableSrc.forEach((it) => {
                if (!this.arr.value.some((item) => item.cashCatId === it.cashCatId)) {
                    it.isDeleted = true;
                    cashData.push(it);
                }
            });
        }
        if (cashData.length === 1) {
            this.sharedService
                .bankTransRowUpdate({
                    transId: this.cashSplitPopupOpen.bankTransId,
                    companyId: this.companyId,
                    transName: this.arr.value[0].cashCatDesc,
                    transTypeId: this.arr.value[0].transTypeId.transTypeId,
                    companyAccountId: this.cashSplitPopupOpen.companyAccountId
                })
                .subscribe(
                    () => {
                        this.cashSplitPopupOpen = false;
                        this.handler();
                    },
                    (err: HttpErrorResponse) => {
                        this.cashSplitPopupOpen = false;

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
            if (this.arr.value.length === 1) {
                cashData[0].isDeleted = true;
            }
            this.sharedService
                .cashSplit({
                    companyId: this.companyId,
                    bankTransId: this.cashSplitPopupOpen.bankTransId,
                    hova: this.cashSplitPopupOpen.hova,
                    cashData: cashData
                })
                .subscribe(
                    () => {
                        if (this.arr.value.length === 1) {
                            this.sharedService
                                .bankTransRowUpdate({
                                    transId: this.cashSplitPopupOpen.bankTransId,
                                    companyId: this.companyId,
                                    transName: this.arr.value[0].cashCatDesc,
                                    transTypeId: this.arr.value[0].transTypeId.transTypeId,
                                    companyAccountId: this.cashSplitPopupOpen.companyAccountId
                                })
                                .subscribe(
                                    () => {
                                        this.cashSplitPopupOpen = false;
                                        this.handler();
                                    },
                                    (err: HttpErrorResponse) => {
                                        this.cashSplitPopupOpen = false;

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
                            this.cashSplitPopupOpen = false;
                            this.handler();
                        }
                    },
                    (err: HttpErrorResponse) => {
                        this.cashSplitPopupOpen = false;
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
