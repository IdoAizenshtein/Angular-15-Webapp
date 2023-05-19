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
import {Subject, Subscription} from 'rxjs';
import {FilterPipe, FilterPipeBiggerSmaller} from '@app/shared/pipes/filter.pipe';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {DatePipe} from '@angular/common';
import {StorageService} from '@app/shared/services/storage.service';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {Calendar} from 'primeng/calendar';
import {Dropdown} from 'primeng/dropdown';
import {Paginator} from 'primeng/paginator';

import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {DomSanitizer} from '@angular/platform-browser';
import {CategorySelectComponent} from '@app/shared/component/category-select/category-select.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {UserDefaultsResolver} from '../../user-defaults-resolver.service';
import {compareDates} from '@app/shared/functions/compareDates';
import {getDaysBetweenDates} from '@app/shared/functions/getDaysBetweenDates';
import {ReportService} from '@app/core/report.service';
import {debounceTime, distinctUntilChanged, filter, take, takeUntil} from 'rxjs/operators';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {ChecksAdditionComponent} from '../addition/checks-addition.component';
import {BankAccountByIdPipe} from '@app/shared/pipes/bankAccountById.pipe';
import {ChecksDateRangeSelectorComponent} from '@app/shared/component/date-range-selectors/checks-date-range-selector.component';
import {TransTypesService} from '@app/core/transTypes.service';
import {ActionService} from '@app/core/action.service';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './financialManagement-checks-details.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementChecksDetailsComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    public filterTypesVal: any = null;
    public filterTypesCategory: any = null;
    public filterProgramName: any = null;
    public filterPaymentTypesCategory: any = null;
    public accountBalance: number;
    public creditLimit: number;
    public queryStatus: string;
    searchInDates = false;
    reportMailSubmitterToggle = false;

    get creditLimitAbs(): number {
        return Math.abs(this.creditLimit);
    }

    private navParams: any;

    public disabledAfterCreate: boolean = false;
    public balanceUse: number;
    public accountSelectExchange: any = false;
    public accountSelectInDeviation: any = false;
    public accountSelectOneNotUpdate: any = false;
    public dataTable: any[] = [];
    public dataTableAll: any[] = [];
    public searchableListTypes = ['transTypeId'];
    public searchableListProgramName = ['programName'];
    public searchableList = [
        'mainDescription',
        'statusText',
        'transTypeName',
        'chequeNo',
        'chequeComment',
        'total',
        'programName'
    ];
    // , 'accountNickname'];
    public queryString = '';
    public currentPage = 0;
    public sumTotalAll = 0;
    public entryLimit = 20;
    // @Input() counter: any = 10;
    public filterInput = new FormControl();

    @ViewChild(ChecksDateRangeSelectorComponent)
    childDates: ChecksDateRangeSelectorComponent;
    // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;

    @ViewChild('scrollContainer') scrollContainer: ElementRef;
    public paymentTypesArr: any[];
    private transTypesMap: { [key: string]: any };
    private programNamesMap: { [key: string]: any };
    public transTypesArr: any[];
    public programNameArr: any[];
    public sortPipeDir: any = null;
    public loader = false;
    public companyTransTypes: any[] = [];
    public scrollContainerHasScroll = false;
    public dataTableToday: any[] = [];
    public questionableExpanded = false;
    public tablePristine = true;
    public updatePermitted: boolean;
    // private readonly updatePermittedObs: Observable<number>;
    public companySelectSub: Subscription;
    private updatePermittedSub: Subscription;
    public subscription: Subscription;
    public showAdditionalItem: any;
    private actionNavigateToScreenSub: Subscription;

    @ViewChild('paginator') paginator: Paginator;
    private transTypeChangeEventSub: Subscription;
    private readonly dtPipe: DatePipe;

    @ViewChildren('checksChain', {read: ElementRef})
    checksChainItemsRef: QueryList<ElementRef>;

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

    private lastAddionalsLoaded: any[];
    public statusTotals: any;
    public selcetAllFiles = false;
    public showBottomBtnRestore = false;


    public deleteConfirmationPrompt: {
        item: any;
        message: string;
        processing: boolean | null;
        visible: boolean | null;
        onApprove: () => void;
    };
    public restorePrompt: {
        item: any;
        message: string;
        processing: boolean | null;
        visible: boolean | null;
        onApprove: () => void;
    };

    public addChequesDialog: {
        visible: boolean | null;
        title: string;
        form: any;
        accounts: any[] | null;
        receiptTypeId: number | null;
    };
    @ViewChild('checksAddition') checksAdditionComponent: ChecksAdditionComponent;

    accountsSelectableForEdit: any[] = null;

    @ViewChildren('inputBoxCalendar', {read: Calendar}) inputBoxCalendars;
    @ViewChildren('accountsDD', {read: Dropdown}) accountsDDs;

    sortColumn: 'dueDate' | 'chequeNo' = 'dueDate';

    private readonly destroyed$ = new Subject<void>();

    beneficiaryFilter = new FormControl();
    beneficiaryFilterOptions: Array<{
        val: string;
        id: string;
        checked: boolean;
    }> = [];

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public router: Router,
        public userService: UserService,
        private sharedService: SharedService,
        private reportService: ReportService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private filterPipeBiggerSmaller: FilterPipeBiggerSmaller,
        private route: ActivatedRoute,
        private actionService: ActionService,
        private storageService: StorageService,
        // private domHandler: DomHandler,
        private _element: ElementRef,
        private renderer: Renderer2,
        private dtHumanizePipe: TodayRelativeHumanizePipe,
        private _sanitizer: DomSanitizer,
        private defaultsResolver: UserDefaultsResolver,
        // private sumPipe: SumPipe,
        public snackBar: MatSnackBar,
        private bankAccByIdPipe: BankAccountByIdPipe,
        private transTypesService: TransTypesService
    ) {
        super(sharedComponent);

        this.dtPipe = new DatePipe('en-IL');

        this.filterInput.valueChanges
            .pipe(
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged()
            )
            .subscribe((term) => {
                this.sharedComponent.mixPanelEvent('search', {
                    value: term
                });


                this.queryString = term;
                if (this.queryString && this.queryString.length) {
                    this.queryStatus = 'undefined';
                }
                this.filtersAll();
            });

        this.subscription = this.transTypesService.selectedCompanyTransTypes
            .pipe(takeUntil(this.destroyed$))
            .subscribe((rslt) => (this.companyTransTypes = rslt));

        // if (this.userService.appData.userData.companies) {
        //     this.sharedService.getTransTypes(this.userService.appData.userData.companySelect.companyId)
        //         .subscribe(rslt => this.companyTransTypes = rslt);
        // } else {
        //     this.subscription = sharedComponent.getDataEvent.pipe(switchMap(() => {
        //         return this.sharedService.getTransTypes(this.userService.appData.userData.companySelect.companyId);
        //     })).subscribe(rslt => this.companyTransTypes = rslt);
        // }

        this.deleteConfirmationPrompt = {
            visible: false,
            processing: null,
            message: null,
            item: null,
            onApprove: () => {
                this.deleteConfirmationPrompt.processing = true;
                this.sharedService
                    .deleteCheckRow({
                        companyAccountId:
                        this.deleteConfirmationPrompt.item.companyAccountId,
                        transId: this.deleteConfirmationPrompt.item.chequePaymentId
                    })
                    .subscribe((rslt) => {
                        this.deleteConfirmationPrompt.processing = false;
                        if (!rslt.error) {
                            this.deleteConfirmationPrompt.visible = false;
                            this.changeAcc(null);
                        }
                    });
            }
        };
        this.restorePrompt = {
            visible: false,
            processing: null,
            message: null,
            item: null,
            onApprove: () => {
                this.showBottomBtnRestore = false;
                this.restorePrompt.processing = true;
                this.sharedService
                    .recoveryChecks({
                        chequePaymentIds: this.restorePrompt.item.map(it => it.chequePaymentId),
                        companyAccountIds: this.restorePrompt.item.map(it => it.companyAccountId)
                    })
                    .subscribe((rslt) => {
                        this.restorePrompt.processing = false;
                        if (!rslt.error) {
                            this.restorePrompt.visible = false;
                            this.changeAcc(null);
                        }
                    });
            }
        };

        this.addChequesDialog = {
            visible: false,
            title: null,
            form: new FormGroup({}),
            accounts: null,
            receiptTypeId: null
        };

        this.navParams = null;
        this.actionNavigateToScreenSub =
            this.actionService.navigateToCheck$.subscribe((navParams) => {
                if (navParams) {
                    this.navParams = navParams;
                    if (this.navParams) {
                        this.storageService.sessionStorageSetter(
                            'checks/*-checks-filterDates',
                            JSON.stringify({name: 'checksOutstanding'})
                        );
                        this.storageService.sessionStorageSetter(
                            '*-checks-filterAcc',
                            JSON.stringify(
                                !this.navParams.companyAccountId
                                    ? this.userService.appData.userData.accountSelect.map(
                                        (acc: any) => acc.companyAccountId
                                    )
                                    : [this.navParams.companyAccountId]
                            )
                        );
                        if (this.navParams.preset === 'showCheqimLemishmeret') {
                            this.storageService.sessionStorageSetter(
                                'in-checks-filterQueryStatus',
                                'mishmeret_babank'
                            );
                        }
                        if (this.navParams.preset === 'showCheqimLenicaion') {
                            this.storageService.sessionStorageSetter(
                                'in-checks-filterQueryStatus',
                                'lenicaion'
                            );
                            this.navParams = null;
                        }
                    }
                }
            });
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
        this.ngAfterViewInit();
    }

    ngOnInit(): void {

        this.defaultsResolver.userDefaultsSubject.subscribe((userDefaults) => {
            console.log('resolved data ===> %o, userDefaults: %o', userDefaults);
            this.entryLimit =
                userDefaults &&
                userDefaults.numberOfRowsPerTable &&
                userDefaults.numberOfRowsPerTable <= 100
                    ? +userDefaults.numberOfRowsPerTable
                    : 20;
        });

        const detailsFilterQueryStatus =
            this.storageService.sessionStorageGetterItem(
                this.route.routeConfig.path + '-filterQueryStatus'
            );
        if (detailsFilterQueryStatus !== null) {
            this.queryStatus =
                detailsFilterQueryStatus === 'null' ? null : detailsFilterQueryStatus;
        }

        const detailsFilterTypesCategory =
            this.storageService.sessionStorageGetterItem(
                this.route.routeConfig.path + '-filterTypesCategory'
            );
        if (detailsFilterTypesCategory !== null) {
            this.filterTypesCategory =
                detailsFilterTypesCategory === 'null'
                    ? null
                    : JSON.parse(detailsFilterTypesCategory);
        }

        const detailsFilterProgramName =
            this.storageService.sessionStorageGetterItem(
                this.route.routeConfig.path + '-filterProgramName'
            );
        if (detailsFilterProgramName !== null) {
            this.filterTypesCategory =
                detailsFilterProgramName === 'null'
                    ? null
                    : JSON.parse(detailsFilterProgramName);
        }

        const detailsRowsPerPage = Number.parseInt(
            this.storageService.sessionStorageGetterItem(
                this.route.routeConfig.path + '-details-rowsPerPage'
            )
        );
        if (Number.isFinite(detailsRowsPerPage)) {
            this.entryLimit = detailsRowsPerPage;
        }

        this.transTypeChangeEventSub =
            this.sharedService.transTypeChangeEvent.subscribe((evt) => {
                console.log('transTypeChangeEvent occured: %o', evt);

                if (this.dataTableAll && this.dataTableAll['chequeDetails']) {
                    switch (evt.type) {
                        case 'change':
                            this.dataTableAll['chequeDetails']
                                .filter((trans) => trans.transTypeId === evt.value.transTypeId)
                                .forEach(
                                    (trans) => (trans.transTypeName = evt.value.transTypeName)
                                );
                            break;
                        case 'delete':
                            this.dataTableAll['chequeDetails']
                                .filter((trans) => trans.transTypeId === evt.value.transTypeId)
                                .forEach((trans) => {
                                    trans.transTypeName = this.translate.instant(
                                        'expressions.noTransType'
                                    );
                                    trans.transTypeId = null;
                                });
                            break;
                    }
                }
            });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
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
        if (this.actionNavigateToScreenSub) {
            this.actionNavigateToScreenSub.unsubscribe();
        }
        this.destroy();
    }

    ngAfterViewInit() {
        // this.storageService.sessionStorageSetter('checks-defaultViewName', 'details');
        // this.defaultsResolver.setDisplayModeTo(this.route.snapshot.url[0].toString());

        this.childDates.selectedRange
            .pipe(
                filter(
                    () =>
                        Array.isArray(this.userService.appData.userData.accountSelect) &&
                        this.userService.appData.userData.accountSelect.length
                ),
                takeUntil(this.destroyed$)
            )
            .subscribe((rng) => this.filterDates(rng));
    }

    filterTypes(type: any) {
        this.filterTypesVal = type;
        this.filtersAll();
    }

    filterCategory(type: any) {
        this.sharedComponent.mixPanelEvent('filter category', {
            value: type.checked
        });
        this.filterTypesCategory = type.checked;
        this.filtersAll('filterTypes');
    }

    filterProgram(type: any) {
        this.sharedComponent.mixPanelEvent('check source filter', {
            value: type.checked
        });
        this.filterProgramName = type.checked;
        this.filtersAll('filterProgram');
    }

    filterBeneficiaries(val: any) {
        this.sharedComponent.mixPanelEvent('mutav', {
            value: val.checked
        });
        this.beneficiaryFilter.setValue(val.checked);
        this.filtersAll('biziboxMutavId');
    }

    sendEvent(isOpened: any) {
        if (isOpened && this.childDates) {
            this.sharedComponent.mixPanelEvent('checks type drop', {
                value: this.childDates.asText()
            });
        }
    }

    mixPanelAcc() {
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
    }

    changeAcc(event): void {
        if (event) {
            this.filterTypesVal = null;
            this.filterTypesCategory = null;
            this.filterProgramName = null;
            this.filterPaymentTypesCategory = null;
        }
        // this.loader = true;
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

        this.accountSelectOneNotUpdate = false;
        this.accountSelectInDeviation = [];

        if (this.userService.appData.userData.accountSelect.length === 1) {
            if (
                !compareDates(
                    new Date(),
                    new Date(
                        this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate
                    )
                )
            ) {
                this.accountSelectOneNotUpdate = getDaysBetweenDates(
                    new Date(
                        this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate
                    ),
                    new Date()
                );
            }
        } else if (this.userService.appData.userData.accountSelect.length > 1) {
            this.accountSelectInDeviation =
                this.userService.appData.userData.accountSelect.filter((account) => {
                    if (
                        !compareDates(new Date(), new Date(account.balanceLastUpdatedDate))
                    ) {
                        const getDaysBetween = getDaysBetweenDates(
                            new Date(account.balanceLastUpdatedDate),
                            new Date()
                        );
                        if (getDaysBetween) {
                            return account;
                        }
                    }
                });
        }
        if (this.childDates) {
            this.childDates.selectedRange
                .pipe(take(1))
                .subscribe((rng) => this.filterDates(rng));
        }


        // this.childDates.filter('monthChecks');
        // this.filterDates(this.childDates.selectedPeriod);

        this.accountsSelectableForEdit =
            this.userService.appData.userData.accounts.filter(
                (acc: any) =>
                    acc.currency === AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
            );
    }

    selecteAllFilesEvent(): void {
        this.dataTable.forEach((row) => {
            row.selcetFile = this.selcetAllFiles;
        });
        if (this.selcetAllFiles) {
            this.showBottomBtnRestore = true;
        } else {
            this.showBottomBtnRestore = false;
        }
    }

    checkSelected() {
        this.showBottomBtnRestore = this.dataTable.filter(it => it.selcetFile).length > 1;
    }

    filterDates(paramDate: any, keepPageSelection = false): void {
        const currPageTmp =
            keepPageSelection && this.paginator ? this.paginator.getPage() : null;

        // debugger;
        this.loader = true;
        if (this.userService.appData.userData.accountSelect.length) {
            const parameters: any = {
                companyAccountIds: this.userService.appData.userData.accountSelect.map(
                    (account) => {
                        return account.companyAccountId;
                    }
                ),
                dateFrom: paramDate.fromDate,
                dateTill: paramDate.toDate
            };

            let ws;
            if (this.router.url.includes('in-checks')) {
                ws = this.sharedService.getInChecks(parameters);
            } else if (this.router.url.includes('out-checks')) {
                ws = this.sharedService.getOutChecks(parameters);
            }

            ws.subscribe(
                (response: any) => {
                    this.statusTotals = {};
                    this.dataTableAll = response ? response['body'] : response;
                    if (this.dataTableAll['statusTotals']) {
                        this.dataTableAll['statusTotals'].forEach((status) => {
                            this.statusTotals[status.status.toLowerCase()] = status.total;
                        });
                    }
                    if (
                        this.navParams &&
                        this.navParams.preset === 'showCheqimLemishmeret'
                    ) {
                        if (!this.statusTotals.mishmeret_babank) {
                            this.storageService.sessionStorageSetter(
                                'in-checks-filterQueryStatus',
                                'not_paid'
                            );
                            this.queryStatus = 'not_paid';
                        }
                        this.navParams = null;
                    }

                    this.setStatusDef();

                    // this.rebuildBeneficiaryFilterOptions(this.dataTableAll['chequeDetails']);

                    if (this.dataTableAll['chequeDetails']) {
                        this.dataTableAll['chequeDetails'].forEach((item) => {
                            item.selectedTransType = this.companyTransTypes.find((tt) => {
                                return tt.transTypeId === item.transTypeId;
                            });
                            item.transTypeName = item.selectedTransType
                                ? item.selectedTransType.transTypeName
                                : this.translate.instant('expressions.noTransType');
                            item.bankId = this.getInfoAcc(item.companyAccountId, 'bankId');
                            item.account = this.userService.appData.userData.accounts.find(
                                (acc: any) => acc.companyAccountId === item.companyAccountId
                            );
                            item.accountNickname = this.getInfoAcc(
                                item.companyAccountId,
                                'accountNickname'
                            );
                            item.statusText = this.translate.instant(
                                'sumsTitles.' + this.getStatus(item.status, item.dueDate)
                            );
                            item.transDateHumanizedStr = this.dtHumanizePipe.transform(
                                item.dueDate,
                                'dd/MM/yy'
                            );
                            item.transDateStr = this.dtPipe.transform(
                                item.dueDate,
                                'dd/MM/yy'
                            );
                            item.isRemovable = this.isRemovable(item.status, item.dueDate);
                            item.systemMessage =
                                item.status === 'NIMHAK_ALIADEI_USER' && item.deleteDate > 0
                                    ? this.translate.instant(
                                        !item.deleteAlYadei ||
                                        /^[\d\-a-fA-F]+$/g.test(item.deleteAlYadei)
                                            ? 'expressions.deletedOnDatePattern'
                                            : 'expressions.deletedByUserOnDatePattern',
                                        {
                                            by: item.deleteAlYadei,
                                            on: this.dtPipe.transform(item.deleteDate, 'dd/MM/yy')
                                        }
                                    )
                                    : null;
                            item.dueDateAsDate = new Date(item.dueDate);
                            item.isEditable = {
                                dueDateAsDate:
                                    item.isRemovable &&
                                    'CHEQUE' === item.targetType &&
                                    this.userService.appData
                                        .moment(item.dueDate)
                                        .isSameOrAfter(this.userService.appData.moment(), 'day'),
                                account:
                                    item.isRemovable &&
                                    ['CHEQUE', 'ERP_CHEQUE'].includes(item.targetType),
                                mainDescription: true,
                                transType: true,
                                chequeNo:
                                    item.isRemovable && ['CHEQUE'].includes(item.targetType),
                                chequeComment: true,
                                total: item.isRemovable && ['CHEQUE'].includes(item.targetType)
                            };
                            if (item.isEditable.account) {
                                item.account = this.bankAccByIdPipe.transform(
                                    item.companyAccountId
                                );
                            }
                        });
                    }
                    this.sortPipeDir = 'bigger';
                    this.filtersAll(null, keepPageSelection);

                    // if (currPageTmp) {
                    //     requestAnimationFrame(() => {
                    //         if (this.paginator && this.paginator.getPageCount() > currPageTmp) {
                    //             this.currentPage = currPageTmp;
                    //             this.paginator.changePage(currPageTmp);
                    //         }
                    //     });
                    // }
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
        } else {
            this.statusTotals = {};
            this.dataTableAll = [];
            this.loader = false;
            this.filtersAll(null, keepPageSelection);
        }
    }

    setStatusDef() {
        if (!this.queryStatus || !this.statusTotals[this.queryStatus]) {
            if (
                (this.router.url.includes('in-checks') && this.statusTotals.not_paid) ||
                (this.router.url.includes('out-checks') &&
                    this.statusTotals.mechake_lehafkada)
            ) {
                this.queryStatus = this.router.url.includes('in-checks')
                    ? 'not_paid'
                    : 'mechake_lehafkada';
                return;
            } else if (
                (this.router.url.includes('in-checks') &&
                    this.statusTotals.mechake_lehafkada) ||
                (this.router.url.includes('out-checks') &&
                    this.statusTotals.future_due_date)
            ) {
                this.queryStatus = this.router.url.includes('in-checks')
                    ? 'mechake_lehafkada'
                    : 'future_due_date';
                return;
            } else if (
                (this.router.url.includes('in-checks') &&
                    this.statusTotals.mishmeret_babank) ||
                (this.router.url.includes('out-checks') &&
                    this.statusTotals.past_due_date)
            ) {
                this.queryStatus = this.router.url.includes('in-checks')
                    ? 'mishmeret_babank'
                    : 'past_due_date';
                return;
            } else if (this.statusTotals.ufkad_veshulam) {
                this.queryStatus = 'ufkad_veshulam';
                return;
            } else if (
                this.router.url.includes('in-checks') &&
                this.statusTotals.lenicaion
            ) {
                this.queryStatus = 'lenicaion';
                return;
            } else if (this.statusTotals.nimhak_aliadei_user) {
                this.queryStatus = 'nimhak_aliadei_user';
                return;
            } else if (
                (this.router.url.includes('in-checks') &&
                    this.statusTotals.ufkad_vehazar &&
                    this.statusTotals.huavar_lesapak_vehazar) ||
                (this.router.url.includes('out-checks') &&
                    this.statusTotals.return_check)
            ) {
                this.queryStatus = this.router.url.includes('in-checks')
                    ? 'ufkad_vehazar'
                    : 'return_check';
                return;
            }
        }
    }

    filtersAll(priority?: any, keepPageSelection?: boolean): void {
        // debugger;
        this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
            this.queryString
        );
        if (
            this.dataTableAll['chequeDetails'] &&
            this.dataTableAll['chequeDetails'].length
        ) {
            this.dataTable = this.filterPipe.transform(
                [].concat(this.dataTableAll['chequeDetails']),
                this.queryString,
                this.searchInDates
                    ? [...this.searchableList, 'transDateStr']
                    : this.searchableList
            );
            if (this.dataTable.length) {
                if (this.queryStatus && this.queryStatus !== 'undefined') {
                    if (this.queryStatus === 'ufkad_vehazar') {
                        this.dataTable = this.filterPipe.transform(
                            this.dataTable,
                            [
                                this.queryStatus.toUpperCase(),
                                'huavar_lesapak_vehazar'.toUpperCase()
                            ],
                            ['status']
                        );
                    } else if (this.queryStatus === 'return_check') {
                        this.dataTable = this.filterPipe.transform(
                            this.dataTable,
                            [
                                this.queryStatus.toUpperCase(),
                                'huavar_lesapak_vehazar'.toUpperCase(),
                                'ufkad_vehazar'.toUpperCase()
                            ],
                            ['status']
                        );
                    } else if (this.queryStatus === 'not_paid') {
                        this.dataTable = this.filterPipe.transform(
                            this.dataTable,
                            [
                                this.queryStatus.toUpperCase(),
                                'mechake_lehafkada'.toUpperCase(),
                                'mishmeret_babank'.toUpperCase()
                            ],
                            ['status']
                        );
                    } else if (this.queryStatus === 'future_due_date') {
                        this.dataTable = this.filterPipeBiggerSmaller.transform(
                            this.dataTable,
                            ['MECHAKE_LEHAFKADA'],
                            ['status'],
                            'dueDate',
                            true
                        );
                    } else if (this.queryStatus === 'past_due_date') {
                        this.dataTable = this.filterPipeBiggerSmaller.transform(
                            this.dataTable,
                            ['MECHAKE_LEHAFKADA'],
                            ['status'],
                            'dueDate',
                            false
                        );
                    } else {
                        this.dataTable = this.filterPipe.transform(
                            this.dataTable,
                            [this.queryStatus.toUpperCase()],
                            ['status']
                        );
                    }
                }
                if (priority !== 'filterTypes') {
                    const buildMapFrom = this.withBeneficiaryFilterApplied(
                        this.filterPipe.transform(
                            this.dataTable,
                            this.filterProgramName,
                            this.searchableListProgramName
                        )
                    );
                    this.rebuildTransTypesMap(buildMapFrom);
                    // this.rebuildTransTypesMap(this.filterPipe.transform(this.dataTable, null, this.searchableListTypes));
                }
                if (priority !== 'filterProgram') {
                    const buildMapFrom = this.withBeneficiaryFilterApplied(
                        this.filterPipe.transform(
                            this.dataTable,
                            this.filterTypesCategory,
                            this.searchableListTypes
                        )
                    );
                    this.rebuildProgramNamesMap(buildMapFrom);
                    // this.rebuildProgramNamesMap(this.filterPipe.transform(this.dataTable, null, this.searchableListProgramName));
                }
                if (priority !== 'biziboxMutavId') {
                    const buildMapFrom = this.filterPipe.transform(
                        this.filterPipe.transform(
                            this.dataTable,
                            this.filterTypesCategory,
                            this.searchableListTypes
                        ),
                        this.filterProgramName,
                        this.searchableListProgramName
                    );
                    this.rebuildBeneficiaryFilterOptions(buildMapFrom);
                }

                this.dataTable = this.withBeneficiaryFilterApplied(this.dataTable);
                this.dataTable = this.filterPipe.transform(
                    this.dataTable,
                    this.filterProgramName,
                    this.searchableListProgramName
                );
                this.dataTable = this.filterPipe.transform(
                    this.dataTable,
                    this.filterTypesCategory,
                    this.searchableListTypes
                );
                this.dataTable = this.sortPipe.transform(
                    this.dataTable,
                    this.sortColumn, // 'dueDate',
                    this.sortPipeDir
                );
                if (this.dataTable.length && this.paginator !== undefined) {
                    if (!keepPageSelection) {
                        this.paginator.changePage(0);
                    }
                }
            }
        } else {
            this.dataTable = [];
        }
        this.storageService.sessionStorageSetter(
            this.route.routeConfig.path + '-filterQueryStatus',
            this.queryStatus
        );
        this.storageService.sessionStorageSetter(
            this.route.routeConfig.path + '-filterTypesCategory',
            JSON.stringify(this.filterTypesCategory)
        );
        this.storageService.sessionStorageSetter(
            this.route.routeConfig.path + '-filterProgramName',
            JSON.stringify(this.filterProgramName)
        );

        this.sumTotalAll = this.dataTable.reduce((a, b) => a + b.total, 0);

        this.loader = false;
        if (!keepPageSelection) {
            this.currentPage = 0;
        }
        this.tablePristine =
            (this.sortPipeDir === null || this.sortPipeDir === 'bigger') &&
            !this.queryString &&
            this.filterTypesCategory === null &&
            this.filterProgramName === null;

        this.validateScrollPresence();
    }

    getStatus(statusKey: string, dueDate: number): string {
        const status = statusKey.toLowerCase();
        if (this.router.url.includes('in-checks') && status === 'not_paid') {
            return 'notRepaid';
        } else if (
            this.router.url.includes('in-checks') &&
            status === 'mechake_lehafkada'
        ) {
            return 'notDeposited';
        } else if (
            this.router.url.includes('in-checks') &&
            status === 'mishmeret_babank'
        ) {
            return 'depositedSafekeeping';
        } else if (
            this.router.url.includes('out-checks') &&
            status === 'mechake_lehafkada'
        ) {
            if (dueDate >= new Date().getTime()) {
                return 'futureMaturityDate';
            } else {
                return 'repaymentPassed';
            }
        } else if (status === 'future_due_date') {
            return 'futureMaturityDate';
        } else if (status === 'mishmeret_babank') {
            return 'depositedSafekeeping';
        } else if (status === 'past_due_date') {
            return 'repaymentPassed';
        } else if (status === 'ufkad_veshulam') {
            return 'repaid';
        } else if (status === 'lenicaion') {
            return 'discount';
        } else if (status === 'nimhak_aliadei_user') {
            return 'manuallyDeleted';
        } else if (
            status === 'ufkad_vehazar' ||
            status === 'huavar_lesapak_vehazar'
        ) {
            return 'comeBack';
        } else if (status === 'return_check') {
            return 'notHonored';
        } else {
            return 'none';
        }
    }

    isRemovable(statusKey: string, dueDate: number): boolean {
        const status = statusKey.toLowerCase();
        if (
            this.router.url.includes('in-checks') &&
            status === 'mechake_lehafkada'
        ) {
            return true;
        } else if (
            this.router.url.includes('in-checks') &&
            status === 'mishmeret_babank'
        ) {
            return true;
        } else if (
            this.router.url.includes('out-checks') &&
            status === 'mechake_lehafkada'
        ) {
            if (dueDate >= new Date().getTime()) {
                return true;
            } else {
                return true;
            }
        } else if (status === 'ufkad_veshulam') {
            return false;
        } else if (status === 'lenicaion') {
            return true;
        } else if (status === 'nimhak_aliadei_user') {
            return false;
        } else if (
            status === 'ufkad_vehazar' ||
            status === 'huavar_lesapak_vehazar'
        ) {
            return true;
        } else if (status === 'return_check') {
            return true;
        } else {
            return false;
        }
    }

    sortPipeFilter(columnName?: 'dueDate' | 'chequeNo'): void {
        if (columnName === 'dueDate') {
            this.sharedComponent.mixPanelEvent('date order');
        }
        if (columnName === 'chequeNo') {
            this.sharedComponent.mixPanelEvent('num of check order');
        }
        if (columnName && columnName !== this.sortColumn) {
            this.sortColumn = columnName;
            this.sortPipeDir = 'smaller';
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
                        totalHova = b.total;
                    } else {
                        total = b.total;
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
                                itra: a[0] + b.itra,
                                total: a[1] + total,
                                totalHova: a[2] + totalHova,
                                date: arr[idx].transDate
                            });
                            a[0] = 0;
                            a[1] = 0;
                            a[2] = 0;
                        }
                    }
                    return [a[0] + b.itra, a[1] + total, a[2] + totalHova, a[3] + rowSum];
                } catch (e) {
                    return [0, 0, 0, 0];
                }
            },
            [0, 0, 0, 0]
        );
    }

    trackById(index: number, val: any): number {
        return val.dueDate;
    }

    paginate(event) {
        console.log('paginate ===> %o', event);
        if (this.entryLimit !== +event.rows) {
            this.entryLimit = +event.rows;
            // this.storageService.sessionStorageSetter('checks-details-rowsPerPage', event.rows);
            this.defaultsResolver.setNumberOfRowsAt(this.entryLimit);
        }

        if (this.currentPage !== +event.page) {
            this.scrollContainer.nativeElement.scrollTop = 0;
            this.currentPage = event.page;
        }
    }

    private rebuildProgramNamesMap(withOtherFiltersApplied: any[]): void {
        this.programNamesMap = withOtherFiltersApplied.reduce(
            (acmltr, dtRow) => {
                if (dtRow.programName && !acmltr[dtRow.programName]) {
                    acmltr[dtRow.programName] = {
                        val: dtRow.programName,
                        id: dtRow.programName,
                        checked:
                            !Array.isArray(this.filterTypesCategory) ||
                            this.filterTypesCategory.includes(dtRow.programName)
                    };

                    if (acmltr['all'].checked && !acmltr[dtRow.programName].checked) {
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
        this.programNameArr = Object.values(this.programNamesMap);
        // console.log('this.transTypesArr => %o', this.transTypesArr);
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

    // getNameOfCategory(id: any) {
    //     if (id && this.companyTransTypes) {
    //         const transTypeName = this.companyTransTypes.find(tt => {
    //             return tt.transTypeId === id;
    //         });
    //         return transTypeName ? transTypeName.transTypeName : this.translate.instant('expressions.noTransType');
    //     } else {
    //         return '';
    //     }
    // }

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

    checkImageSourceFrom(checkAdditional: any): string {
        if (checkAdditional.image) {
            return 'data:image/jpg;base64,' + checkAdditional.image;
        }
        if (checkAdditional.chequeBankNumber) {
            return `/assets/images/bank${checkAdditional.chequeBankNumber}.png`;
        }
        return '';
    }

    // private setupTransItemView(trns: any): void {
    //     // console.log('trns -> %o', trns);
    //
    //     const trnsAcc = this.userService.appData.userData.accounts
    //         .find(acc => acc.companyAccountId === trns.companyAccountId);
    //
    //     return Object.assign(trns, {
    //         account: trnsAcc,
    //         accountNickname: trnsAcc ? trnsAcc.accountNickname : null,
    //         bankIconSrc: trnsAcc ? '/assets/images/bank' + trnsAcc.bankId + '.png' : null,
    //         paymentDescTranslate: this.translate.translations[this.translate.currentLang]
    //             .paymentTypes[trns['mainDescription']],
    //         transDateHumanizedStr: this.dtHumanizePipe.transform(trns.transDate, 'dd/MM/yy'),
    //         transDateStr: this.dtPipe.transform(trns.transDate, 'dd/MM/yy'),
    //         selectedTransType: this.companyTransTypes.find(tt => {
    //             return tt.transTypeId === trns.transTypeId;
    //         })
    //     });
    // }

    public appearsInBankTooltip(trns: any): string | null {
        if (!trns.secondDescription) {
            return null;
        }
        if (!trns._appearsInBankTooltip) {
            trns._appearsInBankTooltip = this._sanitizer.sanitize(
                SecurityContext.HTML,
                `${this.translate.instant('expressions.appearsInBankAs')}<b>${
                    trns.secondDescription
                }</b></span>`
            );
        }
        return trns._appearsInBankTooltip;
    }

    public startDescriptionEditAt(trns: any, input?: HTMLInputElement): void {
        this.editingTransaction = trns;
        this.showCategoryDropDown = false;

        if (input instanceof HTMLInputElement) {
            requestAnimationFrame(() => {
                //   // this.descInputRef.nativeElement.select();
                input.selectionStart = input.selectionEnd = 1000;
                // console.log('this.descInputRef.nativeElement -> %o, %o', this.descInputRef.nativeElement.scrollLeft,
                //   this.descInputRef.nativeElement.scrollWidth);
                input.scrollLeft =
                    getComputedStyle(input).direction === 'rtl' ? 0 : input.scrollWidth;
            });
        }
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

    public cancelChanges(type?: string): void {
        if (this.hasChanges(type)) {
            Object.assign(this.editingTransaction, this.editingTransactionOld);
        }
        this.editingTransaction = null;
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
            this.globalListenerWhenInEdit = null;
        }
    }

    public submitChanges($event: Event, type?: string): void {
        // console.log('submit changes called %o', $event);
        // debugger;
        if (!this.hasChanges(type)) {
            return;
        }

        if (
            this.editingTransaction.targetType !== 'BANK_TRANS' &&
            !this.editingTransaction.total
        ) {
            this.editingTransaction.total = this.editingTransactionOld.total;
            return;
        }
        let textMixPanelEvent = '';
        if (type === 'account') {
            textMixPanelEvent = 'change account';
        }
        if (type === 'mainDescription') {
            textMixPanelEvent = 'change check description';
        }
        // if (type === 'dueDateAsDate') {
        //     textMixPanelEvent = 'change account';
        // }
        if (type === 'chequeNo') {
            textMixPanelEvent = 'change check number';
        }
        if (type === 'chequeComment') {
            textMixPanelEvent = 'change remarks';
        }
        if (type === 'total') {
            textMixPanelEvent = 'change total';
        }
        if (!type && $event) {
            textMixPanelEvent = 'change category';
        }
        this.sharedComponent.mixPanelEvent(textMixPanelEvent);


        console.log('Submitting changes...');
        const oldValue = Object.assign({}, this.editingTransactionOld);
        if (!this.editingTransaction.secondDescription) {
            this.editingTransaction.secondDescription = oldValue.mainDescription;
        }
        if (this.editingTransaction.targetType !== 'BANK_TRANS') {
            this.sharedService
                .updateCheckRow({
                    biziboxMutavId: this.editingTransaction.biziboxMutavId
                        ? this.editingTransaction.biziboxMutavId
                        : null,
                    dueDate: this.editingTransaction.dueDateAsDate,
                    chequeComment: this.editingTransaction.chequeComment,
                    chequeNo: this.editingTransaction.chequeNo,
                    chequePaymentId: this.editingTransaction.chequePaymentId,
                    companyAccountId: this.editingTransaction.account
                        ? this.editingTransaction.account.companyAccountId
                        : this.editingTransaction.companyAccountId,
                    total: this.editingTransaction.total,
                    transTypeId: this.editingTransaction.transTypeId,
                    userDescription: this.editingTransaction.mainDescription
                })
                .subscribe(
                    (response: any) => {
                        if (response.error) {
                            Object.assign(this.editingTransaction, oldValue);
                            this.editingTransaction.chequeComment =
                                oldValue.chequeComment || null;
                            return;
                        }
                        if (
                            this.editingTransaction &&
                            this.editingTransactionOld &&
                            this.editingTransaction.transTypeId ===
                            this.editingTransactionOld.transTypeId
                        ) {
                            this.editingTransactionOld = Object.assign(
                                {},
                                this.editingTransaction
                            );
                        }

                        // this.filterDates(this.childDates.selectedPeriod);
                        this.childDates.selectedRange
                            .pipe(take(1))
                            .subscribe((rng) => this.filterDates(rng, true));
                    },
                    (err: HttpErrorResponse) => {
                        Object.assign(this.editingTransaction, oldValue);
                        this.editingTransaction.chequeComment =
                            oldValue.chequeComment || null;

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
            this.sharedService
                .bankTransRowUpdate({
                    companyAccountId: this.editingTransaction.account
                        ? this.editingTransaction.account.companyAccountId
                        : this.editingTransaction.companyAccountId,
                    companyId: this.companyId,
                    transId: this.editingTransaction.chequePaymentId,
                    transName: this.editingTransaction.userDescription,
                    transTypeId: this.editingTransaction.transTypeId
                })
                .subscribe(
                    (response: any) => {
                        if (response.error) {
                            Object.assign(this.editingTransaction, oldValue);
                            this.editingTransaction.chequeComment =
                                oldValue.chequeComment || null;
                            return;
                        }
                        if (
                            this.editingTransaction &&
                            this.editingTransactionOld &&
                            this.editingTransaction.transTypeId ===
                            this.editingTransactionOld.transTypeId
                        ) {
                            this.editingTransactionOld = Object.assign(
                                {},
                                this.editingTransaction
                            );
                        }

                        // this.filterDates(this.childDates.selectedPeriod);
                        this.childDates.selectedRange
                            .pipe(take(1))
                            .subscribe((rng) => this.filterDates(rng, true));
                    },
                    (err: HttpErrorResponse) => {
                        Object.assign(this.editingTransaction, oldValue);
                        this.editingTransaction.chequeComment =
                            oldValue.chequeComment || null;

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

    private hasChanges(type?: string): boolean {
        // console.log('Checking if changed...');
        if (
            !this.editingTransactionOld ||
            !this.editingTransaction ||
            this.editingTransaction.chequePaymentId !==
            this.editingTransactionOld.chequePaymentId
        ) {
            return false;
        }

        // console.log('Checking if changed... 1');
        if (!this.editingTransaction.mainDescription) {
            this.editingTransaction.mainDescription =
                this.editingTransactionOld.mainDescription;
        }

        if (!this.editingTransaction.chequeComment) {
            this.editingTransaction.chequeComment =
                this.editingTransactionOld.chequeComment;
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

        if (type === 'mainDescription') {
            return (
                this.editingTransaction.mainDescription !==
                this.editingTransactionOld.mainDescription
            );
        } else if (type === 'chequeComment') {
            return (
                this.editingTransaction.chequeComment !==
                this.editingTransactionOld.chequeComment
            );
        } else if (type === 'dueDateAsDate') {
            return (
                this.editingTransaction.dueDateAsDate !==
                this.editingTransactionOld.dueDateAsDate
            );
        } else if (type === 'account') {
            return (
                this.editingTransaction.account &&
                this.editingTransaction.account.companyAccountId !==
                this.editingTransactionOld.companyAccountId
            );
        } else if (type === 'chequeNo') {
            return (
                this.editingTransaction.chequeNo !== this.editingTransactionOld.chequeNo
            );
        } else if (type === 'total') {
            return this.editingTransaction.total !== this.editingTransactionOld.total;
        }
        return false;
    }

    exportAdditionalDetails(resultFileType: string): void {
        if (
            this.showAdditionalItem &&
            this.lastAddionalsLoaded &&
            this.lastAddionalsLoaded.length
        ) {
            if (this.showAdditionalItem.linkId) {
                this.reportService
                    .getReport(
                        this.lastAddionalsLoaded.length === 1
                            ? 'SINGLE_BANK_TRANS'
                            : 'MULTIPLE_BANK_TRANS',
                        {
                            additionalProperties: {
                                accountNum: this.showAdditionalItem.accountNickname,
                                transDate: new Date(
                                    this.showAdditionalItem.transDate
                                ).toISOString()
                            },
                            data: {
                                report:
                                    this.lastAddionalsLoaded.length === 1
                                        ? this.lastAddionalsLoaded[0]
                                        : this.lastAddionalsLoaded
                            }
                        },
                        resultFileType,
                        'פרטי העברה'
                    )
                    .pipe(take(1))
                    .subscribe(() => {
                    });
            }
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

    private isActiveStatus(status: string): boolean {
        if (!status) {
            return false;
        }

        if (this.queryStatus === status) {
            return true;
        }

        if (this.router.url.includes('in-checks')) {
            return (
                status === 'huavar_lesapak_vehazar' &&
                this.queryStatus === 'ufkad_vehazar'
            );
        }

        return false;
    }

    private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
        const statusNamesInOrder = this.router.url.includes('in-checks')
            ? [
                'not_paid',
                'mechake_lehafkada',
                'mishmeret_babank',
                'ufkad_veshulam',
                'lenicaion',
                'nimhak_aliadei_user',
                'ufkad_vehazar',
                'huavar_lesapak_vehazar'
            ]
            : [
                'mechake_lehafkada',
                'future_due_date',
                'past_due_date',
                'ufkad_veshulam',
                'nimhak_aliadei_user',
                'return_check'
            ];
        const checkStatuses = statusNamesInOrder
            .filter((sn) => sn in this.statusTotals && this.statusTotals[sn] !== null)
            .map((sn) => {
                const so = {
                    name: sn,
                    amount: this.statusTotals[sn], // reportType === 'EXCEL' ? this.statusTotals[sn]
                    // : this.sumPipe.transform(this.statusTotals[sn], true),
                    selected: this.isActiveStatus(sn)
                };

                switch (sn) {
                    case 'not_paid':
                        so.name = this.translate.instant('sumsTitles.notRepaid');
                        break;
                    case 'future_due_date':
                        so.name = this.translate.instant('sumsTitles.futureMaturityDate');
                        break;
                    case 'mechake_lehafkada':
                        so.name = this.translate.instant(
                            this.router.url.includes('in-checks')
                                ? 'sumsTitles.notDeposited'
                                : 'sumsTitles.notRepaid'
                        );
                        break;
                    case 'past_due_date':
                        so.name = this.translate.instant('sumsTitles.repaymentPassed');
                        break;
                    case 'mishmeret_babank':
                        so.name = this.translate.instant('sumsTitles.depositedSafekeeping');
                        break;
                    case 'ufkad_veshulam':
                        so.name = this.translate.instant('sumsTitles.repaid');
                        break;
                    case 'lenicaion':
                        so.name = this.translate.instant('sumsTitles.discount');
                        break;
                    case 'nimhak_aliadei_user':
                        so.name = this.translate.instant('sumsTitles.manuallyDeleted');
                        break;
                    case 'ufkad_vehazar':
                        so.name = this.translate.instant('sumsTitles.comeBack');
                        break;
                    case 'return_check':
                        so.name = this.translate.instant('sumsTitles.notHonored');
                        break;
                }

                return so;
            });

        const additionalProperties: any =
            reportType === 'EXCEL'
                ? {
                    checkStatuses: checkStatuses,
                    message: this.reportService.buildMessageFrom(
                        this.userService.appData.userData.accountSelect
                    ),
                    reportDays: this.childDates.asText(),
                    companyId: this.companyId,
                    hasFutureStatuses: (this.router.url.includes('in-checks')
                            ? ['not_paid', 'mechake_lehafkada']
                            : ['future_due_date', 'mechake_lehafkada']
                    ).every(
                        (sn) => sn in this.statusTotals && this.statusTotals[sn] !== null
                    )
                }
                : {
                    checkStatuses: checkStatuses,
                    message: this.reportService.buildMessageFrom(
                        this.userService.appData.userData.accountSelect
                    ),
                    reportDays: this.childDates.asText(),
                    companyId: this.companyId
                };

        return {
            additionalProperties: additionalProperties,
            data: {
                report: this.dataTable.map((row) => {
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
            }
        };
    }

    exportTransactions(resultFileType: string): void {
        this.reportService
            .getReport(
                this.getReportName(),
                this.reportParamsFromCurrentView(resultFileType),
                resultFileType,
                this.reportService.prepareFilename(...this.getFilename())
            )
            .pipe(take(1))
            .subscribe(() => {
            });
    }

    private getReportName(): string {
        return this.route.snapshot.url[0].path.replace('-', '_').toUpperCase();
    }

    private getFilename() {
        return [
            // this.translate.instant('menu.customers.financialManagement.checks.main'),
            // 'תצוגה מפורטת',
            this.route.snapshot.url[0].path.includes('in-checks')
                ? this.translate.instant('filters.inChecks')
                : this.translate.instant('filters.outChecks'),
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
            .emailReport(this.getReportName(), request)
            .pipe(take(1))
            .subscribe(() => {
                this.reportMailSubmitterToggle = false;
            });
    }

    printTransactions(): void {
        this.reportService
            .printReport(
                this.getReportName(),
                this.reportParamsFromCurrentView('PDF'),
                'PDF',
                this.getFilename().join(' ')
            )
            .pipe(take(1))
            .subscribe(() => {
            });
    }

    onRowRestoreClick(item?: any): void {
        if (item) {
            this.sharedComponent.mixPanelEvent('resotre one check');
            item = [item];
        } else {
            this.sharedComponent.mixPanelEvent('resotre multy check');
            item = this.dataTable.filter(it => it.selcetFile);
        }
        this.restorePrompt.item = item;
        this.restorePrompt.message = item.length === 1 ?
            'האם ברצונך לשחזר את הצ׳ק '
            +
            item[0].mainDescription
            +
            '?'
            :
            'האם ברצונך לשחזר את ' +
            item.length
            +
            ' הצ׳קים שנבחרו?';
        this.restorePrompt.visible = true;
    }

    onRowDeleteClick(item: any): void {
        this.sharedComponent.mixPanelEvent('delete check');
        this.deleteConfirmationPrompt.item = item;
        this.deleteConfirmationPrompt.message = this.translate.instant(
            'actions.deleteChequePattern',
            this.deleteConfirmationPrompt.item
        );
        this.deleteConfirmationPrompt.visible = true;

        // this.sharedService.recommendationRemove({
        //     companyAccountId: trns.companyAccountId,
        //     bankTransIds: trns.bankTransIds
        // })
        //     .subscribe(() => this.changeAcc());
    }

    onAddCheckClick(evt: Event) {
        this.addChequesDialog.title = this.translate.instant(
            'formFixedMovement.createTitle',
            {movementType: (evt.target as HTMLLIElement).innerText}
        );
        this.addChequesDialog.receiptTypeId =
            (evt.target as HTMLLIElement).id === 'addIncomeCheck' ? 400 : 44;

        this.sharedComponent.mixPanelEvent(this.addChequesDialog.receiptTypeId === 400 ? 'add income' : 'add outcome');

        this.addChequesDialog.form = new FormGroup({});
        this.addChequesDialog.visible = true;
        this.addChequesDialog.accounts =
            this.userService.appData.userData.accounts.filter(
                (acc: any) =>
                    acc.currency === AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
            );

        if (
            this.userService.appData.userData.accountSelect &&
            this.userService.appData.userData.accountSelect.length
        ) {
            if (!this.addChequesDialog.form.contains('account')) {
                this.addChequesDialog.form.addControl(
                    'account',
                    new FormControl(null, [Validators.required])
                );
            }
            this.addChequesDialog.form
                .get('account')
                .setValue(this.userService.appData.userData.accountSelect[0]);
        }

        this.addChequesDialog.form.addControl('ddMutav', new FormControl(''));
    }

    paymentCreateWs(typeToClose: boolean): void {
        this.disabledAfterCreate = true;
        if (!this.addChequesDialog.form.valid) {
            BrowserService.flattenControls(this.addChequesDialog.form).forEach((ac) =>
                ac.markAsDirty()
            );
            this.disabledAfterCreate = false;
            return;
        }
        const formResult = this.addChequesDialog.form.value;
        const parameters: any = {
            biziboxMutavId:
                formResult.ddMutav &&
                formResult.ddMutav !== '' &&
                formResult.ddMutav.biziboxMutavId
                    ? formResult.ddMutav.biziboxMutavId
                    : null,
            companyAccountId: formResult.account.companyAccountId,
            companyId: this.userService.appData.userData.companySelect.companyId,
            receiptTypeId: this.addChequesDialog.receiptTypeId,
            sourceProgramId: null,
            targetType: 'Checks',
            deleteOldExcel: false,
            transes: formResult.cheques.map((item) => {
                return {
                    asmachta: item.asmachta,
                    dueDate: item.dueDate.toISOString(),
                    paymentDesc: item.paymentDesc,
                    total: item.total,
                    transTypeId: item.transType.transTypeId
                };
            })
        };

        this.sharedService.paymentCreate(parameters).subscribe(
            () => {
                this.disabledAfterCreate = false;

                // const type = this.userService.appData.popUpShow.type;
                this.userService.appData.popUpShow = false;
                if (!typeToClose) {
                    this.checksAdditionComponent.reset();
                }

                // this.filterDates(this.childDates.selectedPeriod);
                this.childDates.selectedRange
                    .pipe(take(1))
                    .subscribe((rng) => this.filterDates(rng));

                if (typeToClose) {
                    this.addChequesDialog.visible = false;
                    // this.snackBar.openFromComponent(PaymentCreateSuccessComponent,
                    //     {
                    //         panelClass: 'snack-success',
                    //         duration: 3000,
                    //         verticalPosition: 'top'
                    //     });
                    this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess(
                        {
                            duration: 3
                        }
                    );
                }
            },
            (err: HttpErrorResponse) => {
                this.disabledAfterCreate = false;

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

    // hasItemWithEditable(propName: string) {
    //     return propName && this.dataTable && this.dataTable.length
    //         && this.dataTable.some(item => item.isEditable[propName]);
    // }

    hasItemWith(propName: string) {
        return (
            propName &&
            this.dataTable &&
            this.dataTable.length &&
            this.dataTable.some((item) => item[propName])
        );
    }

    onContainerScroll() {
        this.inputBoxCalendars
            .filter((clndr) => clndr.overlayVisible)
            .forEach((clndr) => {
                clndr.overlayVisible = false;
                if (
                    clndr.inputfieldViewChild &&
                    clndr.inputfieldViewChild.nativeElement
                ) {
                    clndr.inputfieldViewChild.nativeElement.blur();
                }
            });
        this.accountsDDs
            .filter((accdd) => accdd.overlayVisible)
            .forEach((accdd) => {
                accdd.overlayVisible = false;
                if (accdd.container.nativeElement && accdd.container.nativeElement) {
                    accdd.container.nativeElement.blur();
                }
            });
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

        if (Array.isArray(this.beneficiaryFilter.value)) {
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
}
