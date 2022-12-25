import {Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {FormControl, FormGroup} from '@angular/forms';
import {
    debounceTime,
    distinctUntilChanged,
    filter,
    first,
    map,
    startWith,
    switchMap,
    take,
    tap,
    withLatestFrom
} from 'rxjs/operators';
import {SharedService} from '@app/shared/services/shared.service'; // import {sharedService} from '../../../customers.service';
import {combineLatest, Observable, of, Subject, Subscription} from 'rxjs';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {SharedComponent} from '@app/shared/component/shared.component'; // import {sharedComponent} from '../../../customers.component';
import {TranslateService} from '@ngx-translate/core';
import {EditingType, MovementEditorComponent} from '@app/shared/component/movement-editor/movement-editor.component';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, ActivatedRouteSnapshot, UrlSegment} from '@angular/router';
import {DatePipe, WeekDay} from '@angular/common';
import {BrowserService} from '@app/shared/services/browser.service';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {ReportService} from '@app/core/report.service';
import {TransactionFrequencyHumanizePipe} from '@app/shared/pipes/transFrequencyHumanize.pipe';
import {ActionService} from '@app/core/action.service';
import {TransTypesService} from '@app/core/transTypes.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';
import {Dialog} from "primeng/dialog";

@Component({
    templateUrl: './tazrim-fixedMovements-details.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    providers: [DatePipe]
})
export class TazrimFixedMovementsDetailsComponent
    extends ReloadServices
    implements OnInit, OnDestroy {
    @ViewChild(AccountSelectComponent) accountSelector: AccountSelectComponent;

    readonly filter: {
        expense: boolean | null;
        query: string | null;
        transTypes: string[] | null;
        autoUpdateTypes: string[] | null;
        transFrequencies: string[] | null;
        beneficiary: string[] | null;
    };
    readonly summary: {
        avgExpense: number | null;
        avgIncome: number | null;
    };
    readonly queryInp = new FormControl('');
    groups: {
        [paymentDesc: string]: {
            transactions: any[];
            expanded: boolean;
            key?: any;
            sum: number | null;
        };
    } = {};

    private readonly transTypesSub: Subscription;
    transTypesMap: { [key: string]: any };
    transTypesArr: any[];
    transFrequenciesArr: any[];

    autoUpdateTypesArr: any[];

    companyTransTypes: any[] = [];
    private defaultCategory: any = null;
    private transTypeChangeEventSub: Subscription;

    private dataLoaded$: Observable<any>;
    dataFiltered: Observable<any>;
    restoreTrans: any = false;
    createMovementData: {
        visible: boolean;
        title: string;
        form: any;
        loading: boolean | null;
        source: any | null;
        onApprove: () => void;
    };
    @ViewChild('createEditor') createEditor: MovementEditorComponent;

    private readonly paymentTypesInOrder = [
        'RECOMMENDATION',
        'BankTransfer',
        'DirectDebit',
        'credit',
        'Slika',
        'cash',
        'Loans',
        'Deposits',
        'Checks',
        'Other'
    ];

    outdatedSelectedAccounts: {
        companyAccountId: string;
        balanceLastUpdatedDate: Date;
        accountNickname: string;
    }[];
    private readonly storageKey: string;

    handlerShownAt: any;
    editMovementData: {
        visible: boolean;
        title: string;
        form: any;
        loading: boolean | null;
        source: any;
    };
    @ViewChild('editEditor') editEditor: MovementEditorComponent;
    @ViewChild('editMovementDataDlg') editMovementDataDlg: Dialog;

    transHistoryData: {
        visible: boolean;
        title: string;
        trns: any; // , loading: boolean | null,
        // historyData: Observable<any>, reload: () => void
    };
    // @ViewChild('transHistoryDlg') transHistoryDlg: DialogComponent;

    public deleteConfirmationPrompt: {
        item: any;
        message: string;
        processing: boolean | null;
        visible: boolean | null;
        onApprove: () => void;
    };

    readonly deletePermittedTargetTypes = [
        'CCARD_TAZRIM',
        'CYCLIC_TRANS',
        'LOAN_TAZRIM',
        'SOLEK_TAZRIM',
        'DIRECTD'
    ];

    @ViewChild('messageContainer', {read: ElementRef})
    messageContainerRef: ElementRef;
    reportMailSubmitterToggle = false;

    private actionNavigateToTazrimFixedSub: Subscription;

    private accountsSelectionChange$ = new Subject<void>();
    private filterChange$ = new Subject<void>();
    loading$ = new Subject<boolean>();

    // private readonly transTypesLoader$: Observable<any>;
    beneficiaryFilterOptions: Array<{
        val: string;
        id: string;
        checked: boolean;
    }> = [];

    constructor(
        public userService: UserService,
        private sharedService: SharedService,
        private filterPipe: FilterPipe,
        public override sharedComponent: SharedComponent,
        private translate: TranslateService,
        private storageService: StorageService,
        route: ActivatedRoute,
        private datePipe: DatePipe,
        private currencySymbolPipe: CurrencySymbolPipe,
        private transactionFrequencyHumanize: TransactionFrequencyHumanizePipe,
        private reportService: ReportService,
        private actionService: ActionService,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);

        this.filter = {
            expense: null,
            query: null,
            transTypes: null,
            autoUpdateTypes: null,
            transFrequencies: null,
            beneficiary: null
        };
        this.summary = {
            avgExpense: null,
            avgIncome: null
        };

        // this.transTypesLoader$ = sharedComponent.getDataEvent
        //     .pipe(
        //         startWith(true),
        //         filter(() => this.userService.appData.userData.companySelect),
        //         switchMap(() => this.sharedService.getTransTypesNotFiltered(
        //             this.userService.appData.userData.companySelect.companyId)
        //         ),
        //         publishReplay(1),
        //         refCount()
        //     );

        this.transTypesSub =
            this.transTypesService.selectedCompanyTransTypes.subscribe((rslt) => {
                this.companyTransTypes = rslt;
                this.defaultCategory = this.companyTransTypes
                    ? this.companyTransTypes.find(
                        (tt) => tt.transTypeId === 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d'
                    )
                    : null;
            });

        this.createMovementData = {
            visible: false,
            title: '',
            form: new FormGroup({}),
            source: null,
            loading: null,
            onApprove: null
        };

        this.storageKey =
            route.snapshot.pathFromRoot
                .map((ars: ActivatedRouteSnapshot) => ars.url)
                .filter((urlsegArr: UrlSegment[]) => urlsegArr.length > 0)
                .slice(-2)
                .reduce((acmltr, urlsegArr) => [...acmltr, ...urlsegArr], [])
                .map((urlseg: UrlSegment) => urlseg.path)
                .join('/') + '-filter';

        this.editMovementData = {
            visible: false,
            title: '',
            form: new FormGroup({}),
            source: null,
            loading: null
        };

        this.deleteConfirmationPrompt = {
            visible: false,
            processing: null,
            message: null,
            item: null,
            onApprove: null
        };
    }

    ngOnInit(): void {
        this.queryInp.valueChanges
            .pipe(
                filter((term) => term.length !== 1),
                debounceTime(300),
                distinctUntilChanged()
            )
            .subscribe((term) => {
                this.filter.query = term;
                this.doFilter();
            });

        Object.assign(
            this.filter,
            JSON.parse(this.storageService.sessionStorageGetterItem(this.storageKey))
        );

        this.transTypeChangeEventSub =
            this.sharedService.transTypeChangeEvent.subscribe((evt) => {
                // console.log('transTypeChangeEvent occured: %o', evt);
                switch (evt.type) {
                    case 'change':
                        this.dataLoaded$
                            .pipe(
                                tap((transactions: any[]) => {
                                    transactions
                                        .filter(
                                            (trans) => trans.transTypeId === evt.value.transTypeId
                                        )
                                        .forEach(
                                            (trans) => (trans.transTypeName = evt.value.transTypeName)
                                        );
                                })
                            )
                            .subscribe(() => {
                            });
                        this.doFilter();
                        break;
                    case 'delete':
                        this.dataLoaded$
                            .pipe(
                                tap((transactions: any[]) => {
                                    transactions
                                        .filter(
                                            (trans) => trans.transTypeId === evt.value.transTypeId
                                        )
                                        .forEach((trans) => {
                                            if (this.defaultCategory) {
                                                trans.transTypeName =
                                                    this.defaultCategory.transTypeName;
                                                trans.transTypeId = this.defaultCategory.transTypeId;
                                            } else {
                                                trans.transTypeId = null;
                                                trans.transTypeName = null;
                                            }
                                        });
                                })
                            )
                            .subscribe(() => {
                            });
                        this.doFilter();
                        break;
                }
            });

        this.dataLoaded$ = this.accountsSelectionChange$.pipe(
            map(() => {
                return this.userService.appData.userData.accountSelect &&
                this.userService.appData.userData.accountSelect.length
                    ? this.userService.appData.userData.accountSelect.map(
                        (acc: any) => acc.companyAccountId
                    )
                    : [];
            }),
            tap(() => {
                this.summary.avgExpense = null;
                this.summary.avgIncome = null;

                this.loading$.next(true);
            }),
            switchMap((selectAccIds: string[]) => {
                return !selectAccIds.length
                    ? of([[], []])
                    : combineLatest(
                        [
                            this.sharedService
                                .getCyclicTransactionsRecommendations({
                                    accountIds:
                                        this.userService.appData.userData.accountSelect.map(
                                            (acc: any) => acc.companyAccountId
                                        )
                                })
                                .pipe(
                                    map((response: any) =>
                                        response && !response.error ? response.body : []
                                    )
                                ),
                            this.sharedService
                                .getCyclicTransactions({
                                    companyId: this.userService.appData.userData.exampleCompany
                                        ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
                                        : this.userService.appData.userData.companySelect
                                            ? this.userService.appData.userData.companySelect.companyId
                                            : null,
                                    companyAccountIds:
                                        this.userService.appData.userData.accountSelect.map(
                                            (acc: any) => acc.companyAccountId
                                        )
                                })
                                .pipe(
                                    tap((response: any) => {
                                        if (
                                            response &&
                                            !response.error &&
                                            response.body &&
                                            response.body.monthly
                                        ) {
                                            this.summary.avgIncome =
                                                response.body.monthly.monthlyIncome;
                                            this.summary.avgExpense =
                                                response.body.monthly.monthlyExpense;
                                        }
                                    }),
                                    map((response: any) =>
                                        response && !response.error ? response.body.transes : []
                                    )
                                ),
                            this.transTypesService.selectedCompanyTransTypes
                        ]
                    );
            }),
            map(([respRecommendations, respExisting, transTypes]: any) => {
                const recommendations: any[] = respRecommendations
                    .filter(
                        (accWithRecomendations) =>
                            accWithRecomendations.recommendations &&
                            accWithRecomendations.recommendations.length
                    )
                    .reduce((collector, accWithRecomendations) => {
                        return [
                            ...collector,
                            ...accWithRecomendations.recommendations.map((rcmndtn) => {
                                rcmndtn.companyAccountId =
                                    accWithRecomendations.companyAccountId;
                                rcmndtn.paymentDescOriginal = rcmndtn.paymentDesc;
                                rcmndtn.paymentDesc = 'RECOMMENDATION';
                                rcmndtn.autoUpdateTypeName = rcmndtn.autoUpdateTypeName
                                    ? rcmndtn.autoUpdateTypeName.toUpperCase()
                                    : rcmndtn.autoUpdateTypeName;
                                // rcmndtn.transFrequencyName = rcmndtn.patternType;
                                switch (rcmndtn.transFrequencyName) {
                                    case 'WEEKLY':
                                        rcmndtn.transFrequencyName = 'WEEK';
                                        break;
                                    case 'MONTHLY':
                                        rcmndtn.transFrequencyName = 'MONTH';
                                        break;
                                    case 'TWO_MONTH':
                                        rcmndtn.transFrequencyName = 'TWO_MONTHS';
                                        break;
                                }
                                rcmndtn.updatedBy = 'SYSTEM';

                                if (
                                    !('mutavNames' in rcmndtn) &&
                                    'mutavArray' in rcmndtn &&
                                    Array.isArray(rcmndtn.mutavArray) &&
                                    rcmndtn.mutavArray.length
                                ) {
                                    rcmndtn.mutavNames = rcmndtn.mutavArray
                                        .map((bnfc) => (bnfc ? bnfc.accountMutavName : null))
                                        .filter((bnfName) => !!bnfName);
                                }

                                return rcmndtn;
                            })
                        ];
                    }, []);

                const existing: any = respExisting;
                if (existing) {
                    existing
                        .filter(
                            (trns) =>
                                trns.expence === true &&
                                (trns.total > 0 || trns.lastBankTotal > 0)
                        )
                        .forEach((trns) => {
                            trns.total = +trns.total > 0 ? +trns.total * -1 : trns.total;
                            trns.lastBankTotal =
                                +trns.lastBankTotal > 0
                                    ? +trns.lastBankTotal * -1
                                    : trns.lastBankTotal;
                            trns.monthlyAverageTotal =
                                +trns.monthlyAverageTotal > 0
                                    ? +trns.monthlyAverageTotal * -1
                                    : trns.monthlyAverageTotal;
                        });
                }

                const unitedResults = [...recommendations, ...existing];

                unitedResults.forEach((trns) => {
                    const trnsTransType = transTypes.find(
                        (tt) => tt.transTypeId === trns.transTypeId
                    );
                    trns.transTypeName = trnsTransType
                        ? trnsTransType.transTypeName
                        : this.defaultCategory
                            ? this.defaultCategory.transTypeName
                            : null;
                });

                return unitedResults;
            }),
            tap(() => this.loading$.next(false)),
            tap((unitedResults) => {
                if (
                    this.transHistoryData &&
                    this.transHistoryData.trns &&
                    this.transHistoryData.visible
                ) {
                    const trnsHistoryShown = unitedResults.find(
                        (trns) => trns.transId === this.transHistoryData.trns.transId
                    );
                    if (trnsHistoryShown) {
                        this.transHistoryData.trns.total = trnsHistoryShown.total;
                    }
                }
            }),
            publishRef
        );

        this.dataFiltered = combineLatest(
            [
                this.dataLoaded$,
                this.filterChange$.pipe(startWith(null))
            ]
        ).pipe(
            map(([transactions]) => {
                if (transactions) {
                    if (this.filter.expense !== null) {
                        return transactions.filter(
                            (tr) => tr.expence === this.filter.expense
                        );
                    }
                }
                return transactions;
            }),
            map((transactions: any[]) => {
                if (transactions) {
                    if (this.filter.query !== null) {
                        return this.filterPipe.transform(transactions, this.filter.query, [
                            'transName',
                            'total',
                            'transTypeName',
                            'lastBankTotal',
                            'monthlyAverageTotal',
                            'mutavNames'
                        ]);
                    }
                }
                return transactions;
            }),
            tap((transactions: any[]) => {
                const transFrequencies = this.filter.transFrequencies;
                if (
                    this.filter.transFrequencies &&
                    this.filter.transFrequencies.length &&
                    this.filter.transFrequencies.some(
                        (it) => it === 'MONTH' || it === 'MULTIPLE'
                    )
                ) {
                    transFrequencies.push('MONTH');
                    transFrequencies.push('MULTIPLE');
                }
                const checkableFiltersToApply: {
                    propName: string;
                    propVals: string[] | null;
                }[] = [
                    {propName: 'transTypeId', propVals: this.filter.transTypes},
                    {
                        propName: 'autoUpdateTypeName',
                        propVals: this.filter.autoUpdateTypes
                    },
                    {propName: 'transFrequencyName', propVals: transFrequencies},
                    {propName: 'beneficiary', propVals: this.filter.beneficiary}
                ]; // .filter(cftl => cftl.propVals !== null);
                this.rebuildBeneficiaryFilterOptions(
                    checkableFiltersToApply
                        .filter((chkFilter) => chkFilter.propName !== 'beneficiary')
                        .reduce((acmltr, chkFilter) => {
                            return chkFilter.propVals === null
                                ? acmltr
                                : this.filterPipe.transform(acmltr, chkFilter.propVals, [
                                    chkFilter.propName
                                ]);
                        }, transactions)
                );
                // this.rebuildBeneficiaryFilterOptions(transactions);

                this.rebuildTransTypesMap(
                    checkableFiltersToApply
                        .filter((chkFilter) => chkFilter.propName !== 'transTypeId')
                        .reduce((acmltr, chkFilter) => {
                            return chkFilter.propVals === null
                                ? acmltr
                                : chkFilter.propName === 'beneficiary'
                                    ? this.withBeneficiaryFilterApplied(acmltr)
                                    : this.filterPipe.transform(acmltr, chkFilter.propVals, [
                                        chkFilter.propName
                                    ]);
                        }, transactions)
                );
                // this.rebuildTransTypesMap(transactions);

                this.rebuildAutoUpdateTypesMap(
                    checkableFiltersToApply
                        .filter((chkFilter) => chkFilter.propName !== 'autoUpdateTypeName')
                        .reduce((acmltr, chkFilter) => {
                            return chkFilter.propVals === null
                                ? acmltr
                                : chkFilter.propName === 'beneficiary'
                                    ? this.withBeneficiaryFilterApplied(acmltr)
                                    : this.filterPipe.transform(acmltr, chkFilter.propVals, [
                                        chkFilter.propName
                                    ]);
                        }, transactions)
                );
                // this.rebuildAutoUpdateTypesMap(transactions);

                this.rebuildTransFrequenciesMap(
                    checkableFiltersToApply
                        .filter((chkFilter) => chkFilter.propName !== 'transFrequencyName')
                        .reduce((acmltr, chkFilter) => {
                            return chkFilter.propVals === null
                                ? acmltr
                                : chkFilter.propName === 'beneficiary'
                                    ? this.withBeneficiaryFilterApplied(acmltr)
                                    : this.filterPipe.transform(acmltr, chkFilter.propVals, [
                                        chkFilter.propName
                                    ]);
                        }, transactions)
                );
                // this.rebuildTransFrequenciesMap(transactions);
            }),
            tap(() => {
                const transFrequencies = this.filter.transFrequencies;
                if (
                    this.filter.transFrequencies &&
                    this.filter.transFrequencies.length &&
                    this.filter.transFrequencies.some(
                        (it) => it === 'MONTH' || it === 'MULTIPLE'
                    )
                ) {
                    transFrequencies.push('MONTH');
                    transFrequencies.push('MULTIPLE');
                }
                this.storageService.sessionStorageSetter(
                    this.storageKey,
                    JSON.stringify({
                        transTypes: this.filter.transTypes,
                        autoUpdateTypes: this.filter.autoUpdateTypes,
                        transFrequencies: transFrequencies,
                        expense: this.filter.expense
                    })
                );
            }),
            map((transactions: any[]) => {
                if (
                    !transactions ||
                    !transactions.length ||
                    (this.filter.transTypes === null &&
                        this.filter.autoUpdateTypes === null &&
                        this.filter.transFrequencies === null &&
                        this.filter.beneficiary === null)
                ) {
                    return transactions;
                }
                const transFrequencies = this.filter.transFrequencies;
                if (
                    this.filter.transFrequencies &&
                    this.filter.transFrequencies.length &&
                    this.filter.transFrequencies.some(
                        (it) => it === 'MONTH' || it === 'MULTIPLE'
                    )
                ) {
                    transFrequencies.push('MONTH');
                    transFrequencies.push('MULTIPLE');
                }
                const checkableFiltersToApply: {
                    propName: string;
                    propVals: string[] | null;
                }[] = [
                    {propName: 'transTypeId', propVals: this.filter.transTypes},
                    {
                        propName: 'autoUpdateTypeName',
                        propVals: this.filter.autoUpdateTypes
                    },
                    {propName: 'transFrequencyName', propVals: transFrequencies}
                ].filter((cftl) => cftl.propVals !== null);

                if (
                    checkableFiltersToApply.some(
                        (chkFltr) => chkFltr.propVals.length === 0
                    ) ||
                    (Array.isArray(this.filter.beneficiary) &&
                        !this.filter.beneficiary.length)
                ) {
                    return [];
                }

                transactions = this.withBeneficiaryFilterApplied(transactions);

                return transactions.filter((trns) => {
                    return checkableFiltersToApply.every((chkFltr) =>
                        chkFltr.propVals.includes(trns[chkFltr.propName])
                    );
                });
            }),
            withLatestFrom(this.sharedService.paymentTypesTranslate$),
            map(([transactions, paymentTypesTranslate]) => {
                if (this.groups) {
                    Object.values(this.groups).forEach((gr) => {
                        gr.transactions.length = 0;
                        gr.sum = null;
                    });
                }
                let allDeletedObj: any = false;
                if (transactions) {
                    transactions
                        .filter((it) => !it.delete)
                        .reduce((acmltr, tr) => {
                            const groupKey = this.groupKeyOf(tr, paymentTypesTranslate);

                            if (!acmltr[groupKey]) {
                                acmltr[groupKey] = {
                                    key: groupKey,
                                    transactions: [],
                                    expanded: groupKey === 'fixedMovementGroups.Recommendations',
                                    sum: 0
                                };
                            }

                            acmltr[groupKey].transactions.push(tr);
                            acmltr[groupKey].sum += +(tr.targetType === 'SOLEK_TAZRIM'
                                ? tr.monthlyAverageTotal
                                : tr.total);
                            // (tr.paymentDesc === 'RECOMMENDATION' ? tr.total : tr.monthlyAverageTotal);

                            return acmltr;
                        }, this.groups);

                    const allDeleted = transactions.filter((it) => it.delete);
                    if (allDeleted.length) {
                        const totalAll = allDeleted.reduce((a, b) => {
                            return (
                                a +
                                +(b.targetType === 'SOLEK_TAZRIM'
                                    ? b.monthlyAverageTotal
                                    : b.total)
                            );
                        }, 0);
                        allDeletedObj = {
                            deletedGr: true,
                            expanded: false,
                            key: 'תנועות שנמחקו',
                            sum: totalAll,
                            transactions: allDeleted
                        };
                    }
                }
                const groupsToShow = Object.values(this.groups).filter(
                    (gr) => gr.transactions.length > 0
                );
                groupsToShow.forEach((g) =>
                    g.transactions.sort((t1, t2) => t2.total - t1.total)
                );
                groupsToShow.sort((g1, g2) => {
                    // if (g1.transactions[0].paymentDesc === 'RECOMMENDATION') {
                    //     return -1;
                    // } else if (g2.transactions[0].paymentDesc === 'RECOMMENDATION') {
                    //     return 1;
                    // }
                    // // return g2.sum - g1.sum;
                    // return g1InOrderIdx - g2InOrderIdx;
                    const g1InOrderIdx = this.paymentTypesInOrder.indexOf(
                            g1.transactions[0].paymentDesc
                        ),
                        g2InOrderIdx = this.paymentTypesInOrder.indexOf(
                            g2.transactions[0].paymentDesc
                        );
                    if (g1InOrderIdx < 0 !== g2InOrderIdx < 0) {
                        return g1InOrderIdx >= 0 ? -1 : 1;
                    } else if (g1InOrderIdx < 0) {
                        return 0;
                    } else {
                        return g1InOrderIdx - g2InOrderIdx;
                    }
                });
                if (allDeletedObj) {
                    groupsToShow.push(allDeletedObj);
                }
                if (
                    groupsToShow.length &&
                    (this.filter.query ||
                        this.filter.autoUpdateTypes ||
                        this.filter.transFrequencies ||
                        this.filter.transTypes)
                ) {
                    groupsToShow.forEach((g) => (g.expanded = true));
                }
                return groupsToShow;
            }),
            publishRef
        );

        this.actionNavigateToTazrimFixedSub =
            this.actionService.navigateToTazrimFixed$.subscribe((navParams) => {
                const accToSelect = navParams.accountId
                    ? this.userService.appData.userData.accounts.find(
                        (acc: any) => acc.companyAccountId === navParams.accountId
                    )
                    : null;
                if (
                    accToSelect &&
                    !(
                        this.userService.appData.userData.accountSelect === 1 &&
                        this.userService.appData.userData.accountSelect[0] === accToSelect
                    )
                ) {
                    setTimeout(() => {
                        this.userService.appData.userData.accountSelect = [accToSelect];
                        this.accountSelector.applyValuesFromModel();
                        this.changeAcc();
                    });
                }
                this.filter.transTypes = null;
                this.filter.autoUpdateTypes = null;
                this.filter.transFrequencies = null;
                this.filter.expense = null;
                this.queryInp.patchValue(navParams.query ? navParams.query : '');

                if (navParams.transId && navParams.action) {
                    this.dataFiltered.pipe(take(1)).subscribe((groupsToShow) => {
                        let foundTransaction;
                        for (
                            let grIdx = 0;
                            !foundTransaction && grIdx < groupsToShow.length;
                            grIdx++
                        ) {
                            for (
                                let trIdx = 0;
                                !foundTransaction &&
                                trIdx < groupsToShow[grIdx].transactions.length;
                                trIdx++
                            ) {
                                if (
                                    groupsToShow[grIdx].transactions[trIdx].transId ===
                                    navParams.transId
                                ) {
                                    foundTransaction = groupsToShow[grIdx].transactions[trIdx];
                                }
                            }
                        }
                        if (!foundTransaction) {
                            for (
                                let grIdx = 0;
                                !foundTransaction && grIdx < groupsToShow.length;
                                grIdx++
                            ) {
                                for (
                                    let trIdx = 0;
                                    !foundTransaction &&
                                    trIdx < groupsToShow[grIdx].transactions.length;
                                    trIdx++
                                ) {
                                    const mutavArray =
                                        groupsToShow[grIdx].transactions[trIdx].mutavArray;
                                    if (
                                        mutavArray &&
                                        Array.isArray(mutavArray) &&
                                        mutavArray.length
                                    ) {
                                        const isMatch = mutavArray.find(
                                            (it) => it.transId === navParams.transId
                                        );
                                        if (isMatch) {
                                            foundTransaction =
                                                groupsToShow[grIdx].transactions[trIdx];
                                        }
                                    }
                                }
                            }
                        }

                        if (foundTransaction) {
                            switch (navParams.action) {
                                case 'history':
                                    this.showHistoryFor(foundTransaction);
                                    break;
                                case 'remove':
                                    this.handlerShownAt = foundTransaction;
                                    this.onDeleteMovementClick();
                                    break;
                                case 'update':
                                    this.handlerShownAt = foundTransaction;
                                    this.onEditMovementClick();
                                    break;
                            }
                        }
                    });
                }
            });
    }

    ngOnDestroy(): void {
        if (this.transTypesSub) {
            this.transTypesSub.unsubscribe();
        }

        this.transTypeChangeEventSub.unsubscribe();

        if (this.actionNavigateToTazrimFixedSub) {
            this.actionNavigateToTazrimFixedSub.unsubscribe();
        }
        this.destroy();
    }

    override reload() {
        console.log('reload child');
        this.changeAcc();
    }

    changeAcc() {
        setTimeout(() => this.accountsSelectionChange$.next(), 10);

        this.outdatedSelectedAccounts =
            this.userService.appData.userData.accountSelect.filter(
                (acc: any) => !acc.isUpToDate
            );
        // .filter(acc => !AccountsByCurrencyGroup.isToday(acc.balanceLastUpdatedDate));
    }

    doFilter(): void {
        this.filterChange$.next();
    }

    groupTrack(idx, group) {
        return group.key;
    }

    transactionTrack(idx, transaction) {
        return transaction.transId;
    }

    collapseOpen(val: boolean) {
        if (this.groups) {
            Object.values(this.groups).forEach((gr) => (gr.expanded = val));
        }
    }

    onCheckableFilterChange(evt: any) {
        if (evt.type === 'transType') {
            this.filter.transTypes = evt.checked;
        } else if (evt.type === 'autoUpdateTypeName') {
            this.filter.autoUpdateTypes = evt.checked;
        } else if (evt.type === 'transFrequencyName') {
            this.filter.transFrequencies = evt.checked;
        } else if (evt.type === 'biziboxMutavId') {
            this.filter.beneficiary = evt.checked;
        }
        this.doFilter();
    }

    private rebuildTransTypesMap(withOtherFiltersApplied: any[]): void {
        this.transTypesMap = withOtherFiltersApplied
            ? withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (dtRow.transTypeId && !acmltr[dtRow.transTypeId]) {
                        const categoryItem = this.companyTransTypes.find(
                            (ctt) => ctt.transTypeId === dtRow.transTypeId
                        );
                        acmltr[dtRow.transTypeId] = {
                            val: categoryItem ? categoryItem.transTypeName : '',
                            id: dtRow.transTypeId,
                            checked:
                                !Array.isArray(this.filter.transTypes) ||
                                this.filter.transTypes.includes(dtRow.transTypeId)
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
            )
            : {};
        this.transTypesArr = Object.values(this.transTypesMap);
    }

    private rebuildAutoUpdateTypesMap(withOtherFiltersApplied: any[]): void {
        const autoUpdateTypesMap = withOtherFiltersApplied
            ? withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    if (dtRow.autoUpdateTypeName && !acmltr[dtRow.autoUpdateTypeName]) {
                        acmltr[dtRow.autoUpdateTypeName] = {
                            val: dtRow.autoUpdateTypeName,
                            id: dtRow.autoUpdateTypeName,
                            checked:
                                !Array.isArray(this.filter.autoUpdateTypes) ||
                                this.filter.autoUpdateTypes.includes(dtRow.autoUpdateTypeName)
                        };

                        if (
                            acmltr['all'].checked &&
                            !acmltr[dtRow.autoUpdateTypeName].checked
                        ) {
                            acmltr['all'].checked = false;
                        }
                    }
                    return acmltr;
                },
                {
                    all: {
                        val: this.translate.translations[this.translate.currentLang]
                            .filters.all,
                        id: 'all',
                        checked: true
                    }
                }
            )
            : {};
        this.autoUpdateTypesArr = Object.values(autoUpdateTypesMap);
    }

    private rebuildTransFrequenciesMap(withOtherFiltersApplied: any[]): void {
        const transFrequenciesMap = withOtherFiltersApplied
            ? withOtherFiltersApplied.reduce(
                (acmltr, dtRow) => {
                    const name =
                        dtRow.transFrequencyName === 'NONE'
                            ? 'ללא'
                            : this.translate.instant(
                                'transactionFrequencyTypes.' +
                                dtRow.transFrequencyName +
                                '.text'
                            );
                    if (name && !acmltr[name]) {
                        acmltr[name] = {
                            val: name,
                            id: dtRow.transFrequencyName,
                            checked:
                                !Array.isArray(this.filter.transFrequencies) ||
                                this.filter.transFrequencies.includes(
                                    dtRow.transFrequencyName
                                )
                        };

                        if (acmltr['all'].checked && !acmltr[name].checked) {
                            acmltr['all'].checked = false;
                        }
                    }
                    return acmltr;
                },
                {
                    all: {
                        val: this.translate.translations[this.translate.currentLang]
                            .filters.all,
                        id: 'all',
                        checked: true
                    }
                }
            )
            : {};
        this.transFrequenciesArr = Object.values(transFrequenciesMap);
    }

    onCreateMovementClick(evt: any): void {
        // debugger;
        if (
            evt.srcElement.id === 'createIncomeBtn' ||
            evt.srcElement.id === 'createExpenseBtn'
        ) {
            this.createMovementData.form.reset();
            BrowserService.flattenControls(this.createMovementData.form).forEach(
                (ac) => ac.markAsPristine()
            );

            this.createMovementData.title = this.translate.instant(
                'formFixedMovement.createTitle',
                {movementType: evt.srcElement.textContent}
            );
            this.createMovementData.source = {
                checkboxUnLocked: true,
                calculateAutoUpdateTypeCntrl: false,
                targetType: 'CYCLIC_TRANS',
                expence: evt.srcElement.id === 'createExpenseBtn',
                transTypeId: 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d',
                companyAccountId:
                    this.userService.appData.userData.accountSelect &&
                    this.userService.appData.userData.accountSelect.length === 1
                        ? this.userService.appData.userData.accountSelect[0]
                            .companyAccountId
                        : null,
                transDate: null
            };
            this.createMovementData.onApprove = () => this.onSubmitCreatedMovement();
            this.createMovementData.visible = true;
        }
    }

    onSubmitCreatedMovement(): void {
        if (!this.createMovementData.form.valid) {
            BrowserService.flattenControls(this.createMovementData.form).forEach(
                (ac) => ac.markAsDirty()
            );
            return;
        }
        const dataToSubmit = Object.assign(
            this.createMovementData.source,
            this.createEditor.result
        );
        dataToSubmit.transFrquencyName = dataToSubmit.transFrequencyName;
        delete dataToSubmit.transFrequencyName;
        dataToSubmit.companyId = this.userService.appData.userData.exampleCompany
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId;
        this.createMovementData.loading = true;
        this.sharedService
            .createCyclicTransaction(dataToSubmit)
            .subscribe((rslt) => {
                console.log('submit finished! got %o', rslt);
                this.createMovementData.loading = false;
                if (!rslt.error) {
                    this.createMovementData.visible = false;
                    this.createEditor.reset();
                    this.changeAcc();
                }
            });

        // console.log('submit called! got %o', dataToSubmit);
    }

    onSubmitUpdatedMovement(): void {
        if (!this.editMovementData.form.valid) {
            BrowserService.flattenControls(this.editMovementData.form).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        const dataToSubmit = this.editEditor.result; // Object.assign(this.editMovementData.source, this.editEditor.result);
        this.editMovementData.loading = true;
        this.sharedService
            .updateCyclicTransaction(
                EditingType.Series,
                this.editMovementData.source.targetType,
                dataToSubmit
            )
            .subscribe((rslt) => {
                console.log('submit finished! got %o', rslt);
                this.editMovementData.loading = false;
                if (!rslt.error) {
                    this.editMovementData.visible = false;
                    this.changeAcc();
                }
            });

        // console.log('submit called! got %o', dataToSubmit);
    }

    selectOutdatedAccount(acc: any): void {
        this.userService.appData.userData.accountSelect = [acc];
        this.accountSelector.applyValuesFromModel();
        this.changeAcc();
    }

    onEditMovementClick(trns?: any) {
        const trnsInner = trns ? trns : this.handlerShownAt;

        this.editEditor.reset();
        this.sharedService.paymentTypesTranslate$
            .pipe(first())
            .subscribe((paymentTypesTranslate) => {
                const groupKey = this.groupKeyOf(trnsInner, paymentTypesTranslate);
                this.editMovementData.title =
                    this.translate.instant('formFixedMovement.editTitle', {
                        movementType:
                            trnsInner.expence === true ? 'הוצאה קבועה' : 'הכנסה קבועה'
                    }) +
                    ' - ' +
                    groupKey;
            });
        // this.editMovementData.title = this.translate.instant('formFixedMovement.editTitle',
        //     {
        //         movementType: (trnsInner.expence === true
        //             ? 'הוצאה קבועה'
        //             : 'הכנסה קבועה')
        //     })
        //     + ' - ' + this.translate.instant('paymentTypes.' + trnsInner.paymentDesc);

        this.editMovementData.form = new FormGroup({});
        // trnsInner.logic = false;
        this.editMovementData.source = JSON.parse(JSON.stringify(trnsInner));
        this.editMovementData.visible = true;

        setTimeout(() => this.editMovementDataDlg.center());
    }

    showHistoryFor(trns: any): void {
        this.transHistoryData = {
            visible: true,
            title: trns.transName,
            trns: trns
        };
    }

    onRestoreClick(trns: any): void {
        this.restoreTrans = trns;
    }

    userRestore() {
        this.sharedService
            .cyclicTransRestore({
                keyId: this.restoreTrans.transId,
                keyType:
                    this.restoreTrans.paymentDesc === 'Slika'
                        ? 'SOLEK_ID'
                        : this.restoreTrans.paymentDesc === 'credit'
                            ? 'CREDIT_CARD_ID'
                            : this.restoreTrans.paymentDesc === 'Loans'
                                ? 'LOAN_ID'
                                : 'TRANS_ID'
            })
            .subscribe((rslt) => {
                this.changeAcc();
                console.log('cyclicTransRestore finished! got %o', rslt);
            });
        this.restoreTrans = false;
    }

    onRecommendationAddClick(trns: any): void {
        this.createMovementData.title = this.translate.instant(
            'formFixedMovement.createTitle',
            {
                movementType: trns.expence ? 'הוצאה קבועה' : 'הכנסה קבועה'
            }
        );
        this.createEditor.reset();
        this.createMovementData.visible = true;

        let nextTransDate = new Date();
        const now = new Date();
        // debugger;
        if (trns.lastBankDate) {
            nextTransDate = new Date(trns.lastBankDate);
            do {
                switch (trns.transFrequencyName) {
                    case 'DAY':
                        nextTransDate.setDate(nextTransDate.getDate() + 1);
                        break;
                    case 'WEEK':
                        nextTransDate.setDate(nextTransDate.getDate() + 7);
                        break;
                    case 'MONTH':
                        nextTransDate.setMonth(nextTransDate.getMonth() + 1);
                        break;
                    case 'TWO_MONTHS':
                        nextTransDate.setMonth(nextTransDate.getMonth() + 2);
                        break;
                    case 'QUARTER':
                        nextTransDate.setMonth(nextTransDate.getMonth() + 4);
                        break;
                    default:
                        nextTransDate = now;
                        break;
                }
            } while (nextTransDate < now);
        }

        this.createMovementData.source = Object.assign(
            JSON.parse(JSON.stringify(trns)),
            {
                targetType: 'CYCLIC_TRANS',
                paymentDesc: 'BankTransfer',
                transDate: nextTransDate,
                fromRecommendation: true
            }
        );

        this.createMovementData.onApprove = () => {
            if (!this.createMovementData.form.valid) {
                BrowserService.flattenControls(this.createMovementData.form).forEach(
                    (ac) => ac.markAsDirty()
                );
                return;
            }
            const dataToSubmit = Object.assign(
                this.createMovementData.source,
                this.createEditor.result
            );
            dataToSubmit.companyId =
                this.userService.appData.userData.companySelect.companyId;
            dataToSubmit.biziboxMutavId = dataToSubmit.biziboxMutavId
                ? dataToSubmit.biziboxMutavId
                : null;
            this.createMovementData.loading = true;
            if (
                dataToSubmit.transFrequencyName === 'WEEK' &&
                dataToSubmit.transDate
            ) {
                try {
                    dataToSubmit.transDate = new Date(dataToSubmit.transDate);
                } catch (e) {
                }
                dataToSubmit['frequencyDay'] = (
                    WeekDay[dataToSubmit.transDate.getDay()] as string
                ).toUpperCase();
            }
            this.sharedService
                .recommendationApprove(dataToSubmit)
                .subscribe((rslt) => {
                    console.log('submit finished! got %o', rslt);
                    this.createMovementData.loading = false;
                    if (!rslt.error) {
                        this.createMovementData.visible = false;
                        this.createEditor.reset();
                        this.changeAcc();
                    }
                });
        };
        // trns.companyId = this.userService.appData.userData.companySelect.companyId;
        // this.sharedService.recommendationApprove(trns)
        //     .subscribe(() => this.changeAcc());
    }

    onRecommendationRemoveClick(trns: any): void {
        this.deleteConfirmationPrompt.item = trns;
        this.deleteConfirmationPrompt.message = this.translate.instant(
            'actions.deleteRecommendationPattern',
            this.deleteConfirmationPrompt.item
        );
        this.deleteConfirmationPrompt.onApprove = () => {
            this.deleteConfirmationPrompt.processing = true;
            this.sharedService
                .recommendationRemove({
                    companyAccountId: trns.companyAccountId,
                    bankTransIds: trns.bankTransIds,
                    biziboxMutavId: trns.biziboxMutavId,
                    mutavArray: trns.mutavArray,
                    hamlazaLoMutavId: trns.hamlazaLoMutavId
                })
                .subscribe((rslt) => {
                    this.deleteConfirmationPrompt.processing = false;
                    if (!rslt.error) {
                        this.deleteConfirmationPrompt.visible = false;
                        this.changeAcc();
                    }
                });
        };
        this.deleteConfirmationPrompt.visible = true;

        // this.sharedService.recommendationRemove({
        //     companyAccountId: trns.companyAccountId,
        //     bankTransIds: trns.bankTransIds
        // })
        //     .subscribe(() => this.changeAcc());
    }

    onDeleteMovementClick() {
        this.deleteConfirmationPrompt.item = this.handlerShownAt;
        this.deleteConfirmationPrompt.message = this.translate.instant(
            'actions.deleteFixedFuturePattern',
            this.deleteConfirmationPrompt.item
        );
        this.deleteConfirmationPrompt.onApprove = () => {
            this.deleteConfirmationPrompt.processing = true;
            this.sharedService
                .deleteCyclicTransaction(
                    this.deleteConfirmationPrompt.item.targetType,
                    {
                        companyAccountId:
                        this.deleteConfirmationPrompt.item.companyAccountId,
                        transId: this.deleteConfirmationPrompt.item.transId
                    }
                )
                .subscribe((rslt) => {
                    this.deleteConfirmationPrompt.processing = false;
                    if (!rslt.error) {
                        this.deleteConfirmationPrompt.visible = false;
                        this.changeAcc();
                    }
                });
        };
        this.deleteConfirmationPrompt.visible = true;

        // // debugger;
        // this.sharedService.deleteCyclicTransaction(this.handlerShownAt.targetType, {
        //     companyAccountId: this.handlerShownAt.companyAccountId,
        //     transId: this.handlerShownAt.transId
        // })
        //     .subscribe(() => this.changeAcc());
    }

    // onHistoryRowHandleClick(trns: any, source: any) {
    //     const request = {
    //         'array': [
    //             {
    //                 'dateFrom': trns.dateFrom,
    //                 'dateTill': trns.dateTill,
    //                 'dueDate': null,
    //                 'hova': true,
    //                 'matchLinkId': trns.matchLinkId,
    //                 'matchedBy': null,
    //                 'paymentDesc': null,
    //                 'targetId': null,
    //                 'targetName': trns.targetName,
    //                 'targetTotal': null,
    //                 'targetTransTypeId': null,
    //                 'targetTypeId': trns.targetTypeId,
    //                 'targetTypeName': null,
    //                 'transId': trns.transId
    //             }
    //         ],
    //         'bankMatchTransInner': {
    //             'asmachta': null,
    //             'bankPaymentDesc': null,
    //             'bankTotal': null,
    //             'bankTransId': trns.bankTransId,
    //             'companyAccountId': source.companyAccountId,
    //             'expence': null,
    //             'matchDate': null,
    //             'matchedUserName': null,
    //             'pictureLink': null,
    //             'transDate': null,
    //             'transDesc': null
    //         }
    //     };
    //
    //     this.sharedService.setApart(request)
    //         .subscribe(() => {
    //             this.transHistoryData.reload();
    //             this.changeAcc();
    //         });
    //
    // }

    private reportParamsFromCurrentView(
        reportType: string = 'EXCEL'
    ): Observable<any> {
        return this.dataFiltered.pipe(
            map((groupsToShow) => {
                debugger;
                let msg = this.messageContainerRef
                    ? (this.messageContainerRef.nativeElement as HTMLElement).innerText
                    : null;
                let splitted;
                if (msg && (splitted = msg.split(/(\|.+)/g)).length > 1) {
                    msg =
                        splitted[0].trim() +
                        ': ' +
                        this.outdatedSelectedAccounts
                            .map((acc: any) => acc.accountNickname)
                            .join(', ');
                }
                const additionalProperties: any = {
                    companyId: this.userService.appData.userData.companySelect.companyId,
                    currency: this.currencySymbolPipe.transform(
                        this.userService.appData.userData.accountSelect[0].currency
                    ),
                    monthlyIncome: this.summary.avgIncome,
                    monthlyExpense: this.summary.avgExpense,
                    message: msg
                };
                // debugger;
                return {
                    additionalProperties: additionalProperties,
                    data: {
                        report: groupsToShow
                            .filter((it) => !it.deletedGr)
                            .reduce((acmltr, group) => {
                                const groupTransactionsClones = group.transactions.map(
                                    (trns) => {
                                        const clone = JSON.parse(JSON.stringify(trns));
                                        clone.paymentDesc = this.translate.instant(
                                            'paymentTypes.' + trns.paymentDesc
                                        );
                                        clone.updatedBy = [
                                            trns.updatedBy
                                                ? this.translate.instant('updateBy.' + trns.updatedBy) +
                                                ', '
                                                : '',
                                            this.translate.instant(
                                                'autoUpdateTypes.' + trns.autoUpdateTypeName
                                            )
                                        ].join('');

                                        if (trns.transFrequencyName !== 'NONE') {
                                            if (
                                                trns.autoUpdateTypeName === 'USER_CURRENT_TOTAL' &&
                                                (trns.paymentDesc === 'Slika' ||
                                                    trns.paymentDesc === 'credit')
                                            ) {
                                                clone.transFrequencyName =
                                                    trns.paymentDesc === 'Slika'
                                                        ? 'לפי זיכוי קרוב'
                                                        : 'לפי חיוב קרוב';
                                            } else {
                                                clone.transFrequencyName = [
                                                    this.translate.instant(
                                                        'transactionFrequencyTypes.' +
                                                        trns.transFrequencyName +
                                                        '.text'
                                                    ),
                                                    this.transactionFrequencyHumanize.transform(
                                                        trns.frequencyDay,
                                                        trns.transFrequencyName
                                                    )
                                                ].join('\n');
                                            }
                                        } else {
                                            clone.updatedBy = 'לא ניתן לחשב צפי';
                                            clone.transFrequencyName = null;
                                            // clone.transFrequencyName = 'לא ניתן לחשב צפי';
                                        }

                                        return clone;
                                    }
                                );
                                return [...acmltr, ...groupTransactionsClones];
                            }, [])
                    }
                };
            })
        );
    }

    exportTransactions(resultFileType: string): void {
        this.reportParamsFromCurrentView(resultFileType)
            .pipe(
                switchMap((repParams) =>
                    this.reportService.getReport(
                        'CYCLIC_TRANS',
                        repParams,
                        resultFileType,
                        this.reportService.prepareFilename(...this.getFilename())
                    )
                ),
                take(1)
            )
            .subscribe(() => {
            });
    }

    sendTransactions(mailAddress: string): void {
        this.reportMailSubmitterToggle = false;
        this.reportParamsFromCurrentView()
            .pipe(
                tap((repParams) => {
                    Object.assign(repParams.additionalProperties, {
                        mailTo: mailAddress,
                        screenName: this.getFilename().join(' ')
                    });
                }),
                switchMap((repParams) =>
                    this.reportService.emailReport('CYCLIC_TRANS', repParams)
                ),
                take(1)
            )
            .subscribe(() => {
                this.reportMailSubmitterToggle = false;
            });
    }

    printTransactions(): void {
        this.reportParamsFromCurrentView()
            .pipe(
                switchMap((repParams) =>
                    this.reportService.printReport(
                        'CYCLIC_TRANS',
                        repParams,
                        'PDF',
                        this.getFilename().join(' ')
                    )
                ),
                take(1)
            )
            .subscribe(() => {
            });
    }

    private getFilename() {
        return [
            this.translate.instant('menu.customers.tazrim.fixedMovements'),
            this.userService.appData.userData.companySelect.companyName
        ];
    }

    // noinspection JSMethodCanBeStatic
    private groupKeyOf(
        tr: { targetType: string; paymentDesc: string },
        paymentTypesTranslate: { [k: string]: string }
    ): string {
        if (tr.paymentDesc === 'RECOMMENDATION') {
            return 'fixedMovementGroups.Recommendations';
        }

        return paymentTypesTranslate[tr.paymentDesc];

        // switch (tr.targetType) {
        //     case 'DIRECTD':
        //         return 'fixedMovementGroups.DirectDebits';
        //     case 'LOAN_TAZRIM':
        //         return 'fixedMovementGroups.Loans';
        //     case 'CCARD_TAZRIM':
        //         return 'fixedMovementGroups.CCards';
        //     case 'SOLEK_TAZRIM':
        //         return 'fixedMovementGroups.Slika';
        //     case 'CASH':
        //         return 'fixedMovementGroups.Cash';
        //     case 'CYCLIC_TRANS':
        //         switch (tr.paymentDesc) {
        //             case 'BankTransfer':
        //                 return 'fixedMovementGroups.BankTransfers';
        //             case 'Checks':
        //                 return 'fixedMovementGroups.Checks';
        //             case 'Other':
        //                 return 'fixedMovementGroups.Other';
        //             default:
        //                 return tr.paymentDesc;
        //         }
        //     default:
        //         return tr.targetType;
        // }
    }

    private rebuildBeneficiaryFilterOptions(
        withOtherFiltersApplied: any[]
    ): void {
        if (
            !Array.isArray(withOtherFiltersApplied) ||
            !withOtherFiltersApplied.length
        ) {
            this.beneficiaryFilterOptions = [];
            this.filter.beneficiary = null;
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
                    !Array.isArray(this.filter.beneficiary) ||
                    this.filter.beneficiary.includes(beneficiaryName)
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
                    !Array.isArray(this.filter.beneficiary) ||
                    this.filter.beneficiary.includes('n/a')
            });
        }

        if (Array.isArray(this.filter.beneficiary)) {
            const valueStillAvailable = this.filter.beneficiary.filter((fval) =>
                availableOptions.some((opt) => opt.id === fval)
            );
            if (valueStillAvailable.length !== this.filter.beneficiary.length) {
                this.filter.beneficiary =
                    valueStillAvailable.length === 0 ? null : valueStillAvailable;
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
            !Array.isArray(this.filter.beneficiary) ||
            !Array.isArray(withOtherFiltersApplied) ||
            !withOtherFiltersApplied.length
        ) {
            return withOtherFiltersApplied;
        }

        if (this.filter.beneficiary.includes('n/a')) {
            const nonEmptyFilterVals = this.filter.beneficiary.filter(
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
            this.filter.beneficiary,
            ['mutavNames']
        );
    }
}
