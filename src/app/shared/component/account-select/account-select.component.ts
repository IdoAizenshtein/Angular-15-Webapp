import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {slideInOut} from '../../animations/slideInOut';
import {AccountsByCurrencyGroup, AccountsByCurrencyGroupPlainSelection} from './accountsByCurrencyGroup';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router, UrlSegment} from '@angular/router';
import {BrowserService} from '@app/shared/services/browser.service';

@Component({
    selector: 'app-acc-select',
    templateUrl: './account-select.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class AccountSelectComponent
    implements AfterViewInit {
    public static readonly DEFAULT_PRIMARY_CURRENCY = 'ILS';

    public showPanelDD = false;
    public accountsByCurrencyGroups: AccountsByCurrencyGroup[] = [];
    public parentNode: ElementRef;

    private allowOutdatedAccountsInMultipleSelection = false;
    @Input() unFocus: boolean;
    @Input() disabled: boolean;
    @Input() isBankAndCreditScreen: boolean = false;

    @Input()
    set accounts(accounts: any) {
        const primaryCurrencyOnly =
            this.route.routeConfig.path.includes('-checks') ||
            // || this.router.url.includes('beneficiary')
            (this.router.url.includes('cash-flow') &&
                !this.router.url.includes('fixedMovements') &&
                !this.router.url.includes('bankAndCredit') &&
                !this.router.url.includes('budget') &&
                !this.router.url.includes('daily'));
        this.allowOutdatedAccountsInMultipleSelection =
            this.route.routeConfig.path.includes('-checks') ||
            this.router.url.includes('beneficiary') ||
            this.router.url.includes('bankAndCredit') ||
            this.router.url.includes('budget') ||
            (this.router.url.includes('cash-flow') &&
                this.router.url.includes('fixedMovements'));
        if (accounts) {
            if (primaryCurrencyOnly) {
                accounts = accounts.filter(
                    (acc:any) =>
                        acc.currency === AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
                );
            }

            accounts.sort((a, b) => {
                if (Boolean(a.primaryAccount) === Boolean(b.primaryAccount)) {
                    return a.dateCreated - b.dateCreated;
                }
                if (Boolean(a.primaryAccount) && !b.primaryAccount) {
                    return -1;
                }
                return 1;
            });

            accounts
                .filter((acc:any) => 'checked' in acc)
                .forEach((acc:any) => (acc['checked'] = false));

            const detailsFilterAcc = this.storageService.sessionStorageGetterItem(
                this.storageKey
            );
            const detailsFilterAccParse =
                detailsFilterAcc && !this.router.url.includes('budget')
                    ? JSON.parse(detailsFilterAcc)
                    : [];

            // console.log('detailsFilterAcc => %o', detailsFilterAcc);

            this.userService.appData.userData.accountSelect = accounts.reduce(
                (acmltr, account) => {
                    // account.isUpToDate = AccountsByCurrencyGroup.isToday(account.balanceLastUpdatedDate);

                    if (detailsFilterAccParse) {
                        const foundAccMatch = detailsFilterAccParse.find((acc:any) => {
                            return acc === account.companyAccountId;
                        });
                        if (
                            foundAccMatch &&
                            (this.allowOutdatedAccountsInMultipleSelection ||
                                acmltr.length === 0 ||
                                (account.isUpToDate && acmltr[acmltr.length - 1].isUpToDate))
                        ) {
                            acmltr.push(account);
                        }
                    }

                    return acmltr;
                },
                []
            );
            // console.log('1. userData.accountSelect => %o', this.userService.appData.userData.accountSelect);

            if (!this.userService.appData.userData.accountSelect.length) {
                this.userService.appData.userData.accountSelect = accounts.filter(
                    (acc:any) =>
                        acc.currency === AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY &&
                        (this.allowOutdatedAccountsInMultipleSelection || acc.isUpToDate)
                );
            }
            // console.log('2. userData.accountSelect => %o', this.userService.appData.userData.accountSelect);
            if (!this.userService.appData.userData.accountSelect.length) {
                const primaryAcc = accounts.find((acc:any) => acc.primaryAccount === true);
                if (primaryAcc) {
                    this.userService.appData.userData.accountSelect.push(primaryAcc);
                }
            }
            // console.log('3. userData.accountSelect => %o', this.userService.appData.userData.accountSelect);

            if (!this.userService.appData.userData.accountSelect.length) {
                const firstWithPrimaryCurrency = accounts.find(
                    (acc:any) =>
                        acc.currency === AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
                );
                if (firstWithPrimaryCurrency) {
                    this.userService.appData.userData.accountSelect.push(
                        firstWithPrimaryCurrency
                    );
                }
            }
            // console.log('4. userData.accountSelect => %o', this.userService.appData.userData.accountSelect);

            if (
                !this.userService.appData.userData.accountSelect.length &&
                accounts.length
            ) {
                this.userService.appData.userData.accountSelect.push(accounts[0]);
            }
            // console.log('5. userData.accountSelect => %o', this.userService.appData.userData.accountSelect);

            this.userService.appData.userData.accountSelect.forEach(
                (acc:any) => (acc.checked = true)
            );

            this.accountsByCurrencyGroups = this.buildByCurrencyGroups(accounts);

            this.accountsByCurrencyGroups.sort((a, b) => {
                if (a.containsPrimaryAccount === b.containsPrimaryAccount) {
                    return 0;
                }
                if (a.containsPrimaryAccount && !b.containsPrimaryAccount) {
                    return -1;
                }
                return 1;
            });
            this.changedTrigger.emit(false);
        }
    }

    @Output() changedTrigger = new EventEmitter<boolean>();

    readonly storageKey: string;

    constructor(
        public translate: TranslateService,
        public userService: UserService,
        private _element: ElementRef,
        public router: Router,
        private storageService: StorageService,
        private route: ActivatedRoute
    ) {
        this.userService.appData.userData.accountSelect = [];
        if (['in-checks', 'out-checks'].includes(this.route.routeConfig.path)) {
            this.storageKey = '*-checks' + '-filterAcc';
        } else {
            const pathToRoot = route.pathFromRoot
                .filter((actRoute) => actRoute.snapshot.url.length)
                .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), [])
                .map((urlseg: UrlSegment) => urlseg.path);

            if (
                pathToRoot.includes('financialManagement') &&
                pathToRoot.includes('bankAccount')
            ) {
                this.storageKey = 'bankAccount/*-filterAcc';
            } else if (
                pathToRoot.includes('cash-flow') &&
                pathToRoot.includes('daily')
            ) {
                this.storageKey = 'daily/*-filterAcc';
            } else {
                this.storageKey = this.route.routeConfig.path + '-filterAcc';
            }
        }
    }

    @HostListener('document:click', ['$event'])
    onClickOutside($event: any) {
        // console.log('%o, -- %o', $event, this.parentNode);
        const elementRefInPath = BrowserService.pathFrom($event).find(
            (node) => node === this._element.nativeElement
        );
        if (!elementRefInPath) {
            if (this.showPanelDD) {
                this.showPanelDD = false;
            }
        }
    }

    ngAfterViewInit(): void {
        this.parentNode = this._element.nativeElement;
    }


    buildByCurrencyGroups(accounts: any[]): any[] {
        console.log('accounts: %o', accounts);
        const groupsMap = accounts.reduce((groups, acc) => {
            let currencyAccsArr = groups[acc.currency];
            if (!currencyAccsArr) {
                currencyAccsArr = [];
                groups[acc.currency] = currencyAccsArr;
            }
            currencyAccsArr.push(acc);
            return groups;
        }, {});

        return Object.values(groupsMap).map((currencyAccsArr: any) =>
            this.allowOutdatedAccountsInMultipleSelection
                ? new AccountsByCurrencyGroupPlainSelection(currencyAccsArr)
                : new AccountsByCurrencyGroup(currencyAccsArr)
        );
    }

    changeSelectionAt(group: AccountsByCurrencyGroup, idx: number): void {
        const currentlySelectedGroup = this.selectedGroup;
        let changeResult;
        if (idx >= 0) {
            changeResult = group.accounts[idx].checked
                ? group.deselectAt(idx)
                : group.selectAt(idx);
        } else {
            const oldVal = group.select;
            group.select = !oldVal;
            changeResult = oldVal !== group.select;
        }

        if (changeResult) {
            if (currentlySelectedGroup && currentlySelectedGroup !== group) {
                currentlySelectedGroup.select = false;
            }
            // console.log('group.accounts.filter(acc => acc.checked) => %o', group.accounts.filter(acc => acc.checked));
            this.userService.appData.userData.accountSelect = group.accounts.filter(
                (acc:any) => acc.checked
            );
            this.storeSelection();
            this.changedTrigger.emit(true);
        }
    }

    get selectedGroup(): AccountsByCurrencyGroup {
        return this.accountsByCurrencyGroups.find(
            (group) => group.selected.length > 0
        );
    }

    applyValuesFromModel(): void {
        this.accountsByCurrencyGroups.forEach((group) => group.clearSelection());

        this.storeSelection();

        if (this.accountsByCurrencyGroups && this.accountsByCurrencyGroups.length) {
            this.userService.appData.userData.accountSelect.forEach((acc:any) => {
                const accGrp = this.accountsByCurrencyGroups.find(
                    (grp) => grp.currency === acc.currency
                );
                accGrp.selectAt(accGrp.accounts.indexOf(acc));
            });
        }
    }

    private storeSelection(): void {
        this.storageService.sessionStorageClear('sortableIdGr');
        // this.storageService.sessionStorageClear(this.route.routeConfig.path + '-');
        if (!this.router.url.includes('budget')) {
            this.storageService.sessionStorageSetter(
                this.storageKey,
                JSON.stringify(
                    this.userService.appData.userData.accountSelect.map(
                        (id) => id.companyAccountId
                    )
                )
            );
        }
    }


}
