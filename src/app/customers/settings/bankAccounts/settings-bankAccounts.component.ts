import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {combineLatest, Observable, of, Subject, Subscription, timer, forkJoin, merge} from 'rxjs';
import {filter, map, shareReplay, switchMap, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {TokenService, TokenStatusResponse, TokenType} from '@app/core/token.service';
import {FormControl, FormGroup} from '@angular/forms';
import {CustomersSettingsComponent} from '../customers-settings.component';
import {ActivatedRoute, Router} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {TranslateService} from '@ngx-translate/core';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './settings-bankAccounts.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SettingsBankAccountsComponent
    extends ReloadServices
    implements OnInit, OnDestroy {
    // public arrCompanies: any = [];
    //
    // private _selectedCompany: any = null;
    // get selectedCompany(): any {
    //     return this._selectedCompany;
    // }
    // set selectedCompany(val: any) {
    //     this._selectedCompany = val;
    //     this.selectedCompanyChange$.next(val);
    // }
    //
    // private selectedCompanyChange$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    byTokenGroups$: Observable<ByTokenGroup[]> = null;
    deletedAccounts$: Observable<any> = null;
    tokenStatusesUpdate$: Observable<TokenStatusResponse[]> = null;
    private tokenStatusesUpdater: Subscription = null;

    public subscription: Subscription;
    public showDeletedAccounts = new FormControl(true);
    public loader = false;

    tokenTypes = TokenType;
    readonly addTokenPrompt: {
        visible: boolean;
        form: any;
        show: () => void;
    };

    groupExpanded: any;

    private _selectedAccountBeforeEdit: any = null;
    private _selectedAccount: any = null;
    get selectedAccount(): any {
        return this._selectedAccount;
    }

    set selectedAccount(val: any) {
        if (
            this._selectedAccount !== null &&
            (val === null ||
                this._selectedAccount.companyAccountId !== val.companyAccountId) &&
            this._selectedAccount.accountNickname !==
            this._selectedAccountBeforeEdit.accountNickname
        ) {
            if (!this._selectedAccount.accountNickname) {
                this._selectedAccount.accountNickname =
                    this._selectedAccountBeforeEdit.accountNickname;
            } else {
                const accClosure = this._selectedAccount;
                const prevNickname = this._selectedAccountBeforeEdit.accountNickname;
                this.sharedComponent.mixPanelEvent('change account nicname');
                this.sharedService
                    .setAccountNickname({
                        companyAccountId: this._selectedAccount.companyAccountId,
                        nickName: this._selectedAccount.accountNickname
                    })
                    .subscribe(
                        (resp) => {
                            if (resp.error) {
                                accClosure.accountNickname = prevNickname;
                            }
                        },
                        () => {
                            accClosure.accountNickname = prevNickname;
                        }
                    );
            }
        }

        if (this._selectedAccount !== val) {
            this._selectedAccount = val;
            this._selectedAccountBeforeEdit =
                this._selectedAccount !== null
                    ? JSON.parse(JSON.stringify(this._selectedAccount))
                    : null;
        }
    }

    // private _selectedTokenBeforeEdit: TokenStatusResponse = null;
    // private _selectedToken: TokenStatusResponse = null;
    // get selectedToken(): TokenStatusResponse {
    //     return this._selectedToken;
    // }
    // set selectedToken(val: TokenStatusResponse) {
    //     if (this._selectedToken !== null
    //         && (val === null || this._selectedToken.token !== val.token)
    //         && this._selectedToken.tokenNickname !== this._selectedTokenBeforeEdit.tokenNickname) {
    //
    //         if (!this._selectedToken.tokenNickname) {
    //             this._selectedToken.tokenNickname = this._selectedTokenBeforeEdit.tokenNickname;
    //         } else {
    //             const tknClosure = this._selectedToken;
    //             const prevNickname = this._selectedTokenBeforeEdit.tokenNickname;
    //             this.tokenService.setTokenNickname({
    //                 token: this._selectedToken.token,
    //                 tokenNickname: this._selectedToken.tokenNickname
    //             }).subscribe((resp) => {
    //                     if (resp.error) {
    //                         tknClosure.tokenNickname = prevNickname;
    //                     }
    //                 },
    //                 (err) => {
    //                     tknClosure.tokenNickname = prevNickname;
    //                 });
    //         }
    //     }
    //
    //     if (this._selectedToken !== val) {
    //         this._selectedToken = val;
    //         this._selectedTokenBeforeEdit = this._selectedToken !== null
    //             ? JSON.parse(JSON.stringify(this._selectedToken))
    //             : null;
    //     }
    // }

    accountRestorePrompt: {
        visible: boolean;
        account: any;
        processing: boolean;
        onApprove: () => void;
    };
    accountDeletePrompt: {
        visible: boolean;
        account: any;
        processing: boolean;
        onApprove: () => void;
    };

    linkedCreditCards$: Observable<{ [k: string]: any[] }>;
    readonly forceReload$ = new Subject<void>();
    private readonly destroyed$ = new Subject<void>();
    public exampleCompany: any = false;

    constructor(
        public userService: UserService,
        public override sharedComponent: SharedComponent,
        private sharedService: SharedService,
        public tokenService: TokenService,
        public translate: TranslateService,
        public settingsComponent: CustomersSettingsComponent,
        private router: Router,
        private route: ActivatedRoute,
        private storageService: StorageService
    ) {
        super(sharedComponent);

        this.groupExpanded = {
            all: true
        };

        this.addTokenPrompt = {
            visible: false,
            form: new FormGroup({
                // bank: new FormControl(null, [Validators.required])
            }),
            show: () => {
                this.addTokenPrompt.form.reset();
                this.addTokenPrompt.visible = true;
            }
        };

        this.accountRestorePrompt = {
            visible: false,
            account: null,
            processing: false,
            onApprove: () => {
                this.accountRestorePrompt.processing = true;
                this.sharedService
                    .accountUndelete({
                        companyAccountId:
                        this.accountRestorePrompt.account.companyAccountId,
                        tokenType: 'bank'
                    })
                    .pipe(tap(() => (this.accountRestorePrompt.processing = false)))
                    .subscribe(
                        () => {
                            this.accountRestorePrompt.visible = false;
                            // this.startChild();
                            this.forceReload$.next();
                        },
                        () => {
                            this.accountRestorePrompt.processing = false;
                        }
                    );
            }
        };

        this.accountDeletePrompt = {
            visible: false,
            account: null,
            processing: false,
            onApprove: () => {
                this.accountDeletePrompt.processing = true;
                this.sharedComponent.mixPanelEvent('delete account', {
                    uuid: this.accountDeletePrompt.account.companyAccountId
                });
                this.sharedService
                    .accountDelete(this.accountDeletePrompt.account.companyAccountId)
                    .pipe(tap(() => (this.accountDeletePrompt.processing = false)))
                    .subscribe(
                        () => {
                            this.accountDeletePrompt.visible = false;
                            // this.startChild();
                            this.forceReload$.next();
                        },
                        () => {
                            this.accountDeletePrompt.processing = false;
                        }
                    );
            }
        };
    }


    override reload() {
        console.log('reload child');
        this.forceReload$.next();
    }

    ngOnInit(): void {
        this.byTokenGroups$ = merge(
            this.settingsComponent.selectedCompany$,
            this.forceReload$.pipe(
                switchMap(() => this.settingsComponent.selectedCompany$)
            )
        ).pipe(
            takeUntil(this.destroyed$),
            filter((val) => val !== null && val !== false),
            tap(() => (this.loader = true)),
            switchMap((selectedCompany) =>
                forkJoin(
            [
                this.sharedService
                    .getAccountsSettings(selectedCompany.companyId)
                    .pipe(
                        tap((responseAcc: any) => {
                            if (responseAcc.body) {
                                const accountsWithLinkedCardsRequest =
                                    responseAcc.body.accounts ?
                                        responseAcc.body.accounts
                                            .filter((acc: any) => acc.creditCardNum)
                                            .map((acc: any) => {
                                                return {uuid: acc.companyAccountId};
                                            }) : []
                                this.linkedCreditCards$ = (
                                    accountsWithLinkedCardsRequest.length
                                        ? this.sharedService.getCreditCardDetails(
                                            accountsWithLinkedCardsRequest
                                        )
                                        : of({})
                                ).pipe(
                                    map((responseCC: any) => {
                                        const cCards = responseCC.body;
                                        return cCards.reduce((acmltr, ccard) => {
                                            if (ccard.companyAccountId in acmltr) {
                                                acmltr[ccard.companyAccountId].push(ccard);
                                            } else {
                                                acmltr[ccard.companyAccountId] = [ccard];
                                            }
                                            return acmltr;
                                        }, Object.create(null));
                                    }),
                                    shareReplay(1),
                                    takeUntil(this.destroyed$)
                                );

                                if (
                                    this.userService.appData.userData.companySelect
                                        .companyId === selectedCompany.companyId
                                ) {
                                    this.userService.appData.userData.exampleCompany =
                                        responseAcc.body.exampleCompany;
                                    this.userService.appData.userData.accounts =
                                        responseAcc.body.accounts;
                                    if (
                                        Array.isArray(this.userService.appData.userData.accounts)
                                    ) {
                                        this.userService.appData.userData.accounts.forEach(
                                            (acc: any) => (acc.isUpToDate = acc.isUpdate)
                                        );
                                        // = this.isTodayPipe.transform(acc.balanceLastUpdatedDate));
                                    }
                                    this.sharedComponent.forceAccountsReload$.next();
                                }
                            }
                        })
                    ),
                this.tokenService.companyTokensGetStatus(
                    this.userService.appData.userData.accountant,
                    TokenType.ACCOUNT,
                    {
                        uuid: selectedCompany.companyId
                    }
                )
            ]
                )
            ),
            map((resMap: any) => {
                const [responseAcc, responseTkn] = resMap;
                const accs = responseAcc.body ? responseAcc.body.accounts : [];
                if (responseTkn && !responseTkn.length && accs && accs.length) {
                    const groupBy = (key) => (array) =>
                        array.reduce((objectsByKeyValue, obj) => {
                            const value = obj[key];
                            objectsByKeyValue[value] = (
                                objectsByKeyValue[value] || []
                            ).concat(obj);
                            return objectsByKeyValue;
                        }, {});

                    const arrayGr = groupBy('token')(accs);
                    // tslint:disable-next-line:forin
                    for (const property in arrayGr) {
                        // console.log(`${property}: ${arrayGr[property]}`)
                        const objAcc = arrayGr[property][0];
                        if(objAcc.token){
                            // @ts-ignore
                            const newObj: any = {
                                token: objAcc.token,
                                tokenStatus:
                                    objAcc.token === '88e6c85e-b914-4928-8436-47e86dddd3a4' ||
                                    objAcc.token === '88e6c85e-b914-4928-8436-47e86dddd3a5'
                                        ? 'VALID'
                                        : null,
                                tokenNickname: this.translate.instant('banks.' + objAcc.bankId),
                                isFromAccount: true,
                                websiteTargetTypeId: objAcc.bankId,
                                screenPasswordUpdateCount: null,
                                dateCreated: objAcc.dateCreated,
                                tokenTargetType: 'ACCOUNT',
                                hasPrivs: true,
                                companyAccountId: objAcc.companyAccountId,
                                anotherCompanyExist: false
                            };
                            responseTkn.push(newObj);
                        }else{
                            const arrayGrByBankId = groupBy('bankId')(arrayGr[property]);

                            for (const propertySecond in arrayGrByBankId) {
                                const objAccSecond = arrayGrByBankId[propertySecond][0];
                                const newObjSecond: any = {
                                    token: objAccSecond.token,
                                    tokenStatus:
                                        objAccSecond.token === '88e6c85e-b914-4928-8436-47e86dddd3a4' ||
                                        objAccSecond.token === '88e6c85e-b914-4928-8436-47e86dddd3a5'
                                            ? 'VALID'
                                            : null,
                                    tokenNickname: this.translate.instant('banks.' + objAccSecond.bankId),
                                    isFromAccount: true,
                                    websiteTargetTypeId: objAccSecond.bankId,
                                    screenPasswordUpdateCount: null,
                                    dateCreated: objAccSecond.dateCreated,
                                    tokenTargetType: 'ACCOUNT',
                                    hasPrivs: true,
                                    companyAccountId: objAccSecond.companyAccountId,
                                    anotherCompanyExist: false
                                };
                                responseTkn.push(newObjSecond);
                            }
                        }
                    }
                } else if (responseTkn && responseTkn.length && accs && accs.length) {
                    const allAccWithoutTknMatch = accs.filter((acc: any) =>
                        responseTkn.every((tkn) => tkn.token !== acc.token)
                    );
                    if (allAccWithoutTknMatch.length) {
                        const groupBy = (key) => (array) =>
                            array.reduce((objectsByKeyValue, obj) => {
                                const value = obj[key];
                                objectsByKeyValue[value] = (
                                    objectsByKeyValue[value] || []
                                ).concat(obj);
                                return objectsByKeyValue;
                            }, {});

                        const arrayGr = groupBy('token')(allAccWithoutTknMatch);
                        // tslint:disable-next-line:forin
                        for (const property in arrayGr) {
                            // console.log(`${property}: ${arrayGr[property]}`)
                            const objAcc = arrayGr[property][0];
                            if(objAcc.token){
                                // @ts-ignore
                                const newObj: any = {
                                    token: objAcc.token,
                                    tokenStatus:
                                        objAcc.token === '88e6c85e-b914-4928-8436-47e86dddd3a4' ||
                                        objAcc.token === '88e6c85e-b914-4928-8436-47e86dddd3a5'
                                            ? 'VALID'
                                            : null,
                                    tokenNickname: this.translate.instant('banks.' + objAcc.bankId),
                                    isFromAccount: true,
                                    websiteTargetTypeId: objAcc.bankId,
                                    screenPasswordUpdateCount: null,
                                    dateCreated: objAcc.dateCreated,
                                    tokenTargetType: 'ACCOUNT',
                                    hasPrivs: true,
                                    companyAccountId: objAcc.companyAccountId,
                                    anotherCompanyExist: false
                                };
                                responseTkn.push(newObj);
                            }else{
                                const arrayGrByBankId = groupBy('bankId')(arrayGr[property]);

                                for (const propertySecond in arrayGrByBankId) {
                                    const objAccSecond = arrayGrByBankId[propertySecond][0];
                                    const newObjSecond: any = {
                                        token: objAccSecond.token,
                                        tokenStatus:
                                            objAccSecond.token === '88e6c85e-b914-4928-8436-47e86dddd3a4' ||
                                            objAccSecond.token === '88e6c85e-b914-4928-8436-47e86dddd3a5'
                                                ? 'VALID'
                                                : null,
                                        tokenNickname: this.translate.instant('banks.' + objAccSecond.bankId),
                                        isFromAccount: true,
                                        websiteTargetTypeId: objAccSecond.bankId,
                                        screenPasswordUpdateCount: null,
                                        dateCreated: objAccSecond.dateCreated,
                                        tokenTargetType: 'ACCOUNT',
                                        hasPrivs: true,
                                        companyAccountId: objAccSecond.companyAccountId,
                                        anotherCompanyExist: false
                                    };
                                    responseTkn.push(newObjSecond);
                                }
                            }
                        }
                    }
                }
                if (responseAcc.body.exampleCompany) {
                    return null;
                } else {
                    return responseTkn.map((tknSt: any) => {
                        if (!(tknSt.token in this.groupExpanded)) {
                            this.groupExpanded[(tknSt.token + '_' + tknSt.websiteTargetTypeId)] = this.groupExpanded.all;
                        }

                        return {
                            id: tknSt.token,
                            key: (tknSt.token + '_' + tknSt.websiteTargetTypeId),
                            status: tknSt,
                            children: accs.filter((acc: any) => (acc.token + '_' + acc.bankId) === (tknSt.token + '_' + tknSt.websiteTargetTypeId))
                        } as ByTokenGroup;
                    });
                }
            }),
            tap(() => {
                this.loader = false;
                if (this.tokenStatusesUpdater === null) {
                    this.tokenStatusesUpdater = this.tokenStatusesUpdate$.subscribe();
                }
            }),
            shareReplay(1)
        );

        this.deletedAccounts$ = this.byTokenGroups$.pipe(
            withLatestFrom(this.settingsComponent.selectedCompany$),
            switchMap(([groups, selectedCompany]) => {
                const tokenIds = Array.isArray(groups) ? groups.filter((grC) => grC.id).map((gr) => gr.id) : [];
                return tokenIds.length ? this.sharedService.getDeletedAccounts({
                    companyId: selectedCompany.companyId,
                    tokenIds: tokenIds
                }) : of({
                    error: true
                });
            }),
            map((response: any) => {
                if (response.error || !Array.isArray(response.body)) {
                    return {};
                }

                return response.body.reduce((acmltr, acc) => {
                    if (acc.token) {
                        if (acc.token in acmltr) {
                            acmltr[acc.token].push(acc);
                        } else {
                            acmltr[acc.token] = [acc];
                        }
                    }
                    return acmltr;
                }, Object.create(null));
            }),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        this.tokenStatusesUpdate$ = combineLatest(
            [
                this.byTokenGroups$,
                timer(5000, 5000)
            ]
        ).pipe(
            map(([groups]) => {
                   return  groups ? groups.filter((group) =>
                        this.tokenService.isTokenStatusProgressing(group.status.tokenStatus)
                    ) : []
                }
            ),
            filter((groupsToUpdate) => groupsToUpdate.length > 0),
            withLatestFrom(this.settingsComponent.selectedCompany$),
            switchMap(([groupsToUpdate, selectedCompany]) => {
                return this.tokenService
                    .tokenGetStatus({
                        companyId: selectedCompany.companyId,
                        tokens: groupsToUpdate.map((group) => group.id)
                    })
                    .pipe(
                        tap((responseTkn) => {
                            responseTkn.forEach((tknStResp, idx) => {
                                groupsToUpdate[idx].status = tknStResp;
                            });
                        })
                    );
            })
        );

        // if (this.userService.appData.userData.companies) {
        //     this.startChild();
        // } else {
        //     this.subscription = this.sharedComponent.getDataEvent.subscribe(() => this.startChild());
        // }

        const storageVal = this.storageService.localStorageGetterItem(
            'settings-bankAccounts.showDeleted'
        );
        this.showDeletedAccounts.patchValue(!storageVal || 'true' === storageVal);
        this.showDeletedAccounts.valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe((val: any) =>
                {
                    if(!val){
                        this.sharedComponent.mixPanelEvent('unshow deleted accounts');
                    }
                    this.storageService.localStorageSetter(
                        'settings-bankAccounts.showDeleted',
                        val
                    )
                }
            );
    }

    // startChild() {
    // this.loader = true;
    // if (this.userService.appData.userData.companies) {
    //     this.arrCompanies = [].concat(this.userService.appData.userData.companies);
    //     this.selectedCompany = (this.selectedCompany) ? this.selectedCompany : this.arrCompanies[0];
    // } else {
    //     this.loader = false;
    // }
    // }

    toggleExpandedForAllTo(k: boolean) {
        if (k === true && this.groupExpanded.all === k) {
            return;
        }
        this.groupExpanded.all = k;
        Object.keys(this.groupExpanded)
            .filter((grK) => grK !== 'all' && this.groupExpanded[grK] !== k)
            .forEach((grK) => (this.groupExpanded[grK] = k));
    }

    toggleExpandedFor(k: string) {
        this.groupExpanded[k] = !this.groupExpanded[k];

        if (k === 'all') {
            Object.keys(this.groupExpanded)
                .filter((grK) => grK !== 'all')
                .forEach((grK) => (this.groupExpanded[grK] = this.groupExpanded.all));
        } else if (this.groupExpanded.all && !this.groupExpanded[k]) {
            this.groupExpanded.all = false;
        }
    }

    accountSetPrimary(account) {
        this.sharedService
            .accountSetPrimary({
                companyAccountId: account.companyAccountId,
                companyId: account.companyId
            })
            .pipe(withLatestFrom(this.byTokenGroups$))
            .subscribe(
                ([resp, tokenGroups]) => {
                    if (resp && !resp.error && resp.body === 1) {
                        tokenGroups.forEach((tknGrp) => {
                            tknGrp.children
                                .filter((acc: any) => acc !== account && acc.primaryAccount)
                                .forEach((acc: any) => (acc.primaryAccount = false));
                        });

                        account.primaryAccount = true;
                    }
                },
                () => {
                }
            );
    }

    accountRestore(account) {
        this.accountRestorePrompt.account = account;
        this.accountRestorePrompt.visible = true;
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.tokenStatusesUpdater) {
            this.tokenStatusesUpdater.unsubscribe();
        }

        this.destroyed$.next();
        this.destroyed$.complete();
        this.destroy();
    }

    navigateToCreditCard(creditCardId: string) {
        this.settingsComponent.selectedCompany$
            .pipe(take(1))
            .subscribe((selectedCompany) => {
                this.router
                    .navigate(['../creditCard'], {
                        relativeTo: this.route,
                        queryParamsHandling: 'preserve'
                    })
                    .then((rslt) => {
                        if (rslt) {
                            this.settingsComponent.scrollToCard = {
                                companyId: selectedCompany.companyId,
                                creditCardId: creditCardId // '6ed236b1-eb54-60f9-e053-0b6519ac055f'
                            };
                        }
                    });
            });
        // this.customersSettingsComponent
    }

    accountDelete(account) {
        this.accountDeletePrompt.account = account;
        this.accountDeletePrompt.visible = true;
    }
}

export class ByTokenGroup {
    id: string;
    key: string;
    status: TokenStatusResponse;
    children: Array<any>;
}
