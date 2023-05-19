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
    selector: 'app-acc-select-by-currency',
    templateUrl: './account-select-by-currency.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class AccountSelectByCurrencyComponent
    implements AfterViewInit {
    public static readonly DEFAULT_PRIMARY_CURRENCY = 'ILS';
    public checkAll = true;
    public checkedArr:any = [];

    public showPanelDD = false;
    public accountsByCurrencyGroups: AccountsByCurrencyGroup[] = [];
    public parentNode: ElementRef;

    private allowOutdatedAccountsInMultipleSelection = false;
    @Input() unFocus: boolean;
    @Input() disabled: boolean;
    @Input() isBankAndCreditScreen: boolean = false;
    public accountsSrc: any = [];
    public currenciesList: any = [];
    public selectedCur:any = {};

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
            // if (primaryCurrencyOnly) {
            //     accounts = accounts.filter(
            //         (acc:any) =>
            //             acc.currency === AccountSelectByCurrencyComponent.DEFAULT_PRIMARY_CURRENCY
            //     );
            // }
            accounts = accounts.filter(
                (acc:any) =>
                    acc.izuCustId
            );
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
            this.accountsSrc = JSON.parse(JSON.stringify(accounts));
            // console.log(this.accountsSrc)
            // debugger
            const obCur = {};
            this.accountsSrc.forEach(it => {
                obCur[it.currency] = {
                    sign:it.sign,
                    currency: it.currency,
                    currencyId: it.currencyId,
                    currencyString: it.currencyString,
                    selected: false
                };
            });
            const entrCur = [];
            for (const [key, value] of Object.entries(obCur)) {
                entrCur.push(value);
            }
            if(entrCur.length){
                entrCur.sort((a, b) => (a['currencyId'] > b['currencyId'] ? 1 : -1));
                entrCur[0].selected = true;
            }
            this.currenciesList = entrCur;
            this.filterByCurrency();
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

    resetAllSelected(){
        this.currenciesList.forEach(it=>{
            it.selected = false;
        })
    }
    filterByCurrency() {
        const selectedCur = this.currenciesList.find(it => it.selected);
        this.selectedCur = selectedCur;
        if (selectedCur) {
            const accountsSrc: any = JSON.parse(JSON.stringify(this.accountsSrc)).filter(it => {
                return it.currency === selectedCur.currency;
            });
            accountsSrc.forEach(
                (acc:any) => (acc.checked = true)
            );
            // console.log(accountsSrc);
            // debugger
            this.userService.appData.userData.accountSelect = accountsSrc;
            this.checkAll = this.userService.appData.userData.accountSelect.every(
                (cardsAcc) => cardsAcc.checked
            );
            this.checkedArr = this.userService.appData.userData.accountSelect.filter(
                (cardsAcc) => cardsAcc.checked
            );
            this.changedTrigger.emit(false);
        }
    }
    changeAll() {
        this.userService.appData.userData.accountSelect.forEach((cards, idx, arr) => {
            arr[idx].checked = this.checkAll;
        });
        this.checkedArr = this.userService.appData.userData.accountSelect.filter(
            (cardsAcc) => cardsAcc.checked
        );
    }


    changeSelectionAt(): void {
        this.checkAll = this.userService.appData.userData.accountSelect.every(
            (cardsAcc) => cardsAcc.checked
        );
        this.checkedArr = this.userService.appData.userData.accountSelect.filter(
            (cardsAcc) => cardsAcc.checked
        );
        this.changedTrigger.emit(true);
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
