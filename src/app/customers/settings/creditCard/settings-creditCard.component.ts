import {AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {BehaviorSubject, combineLatest, forkJoin, merge, Observable, of, Subject, Subscription, timer} from 'rxjs';
import {filter, map, shareReplay, switchMap, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {TranslateService} from '@ngx-translate/core';
import {TokenService, TokenStatusResponse, TokenType} from '@app/core/token.service';
import {ByTokenGroup} from '../bankAccounts/settings-bankAccounts.component';
import {FormControl, FormGroup} from '@angular/forms';
import {CustomersSettingsComponent} from '../customers-settings.component';
import {Dropdown} from 'primeng/dropdown';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {StorageService} from '@app/shared/services/storage.service';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './settings-creditCard.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SettingsCreditCardComponent
    extends ReloadServices
    implements OnInit, AfterViewInit, OnDestroy {
    arrAccounts: any = [];
    defaultCurrencyAccounts: any = [];
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
    // private selectedCompanyChange$: BehaviorSubject<any> = new BehaviorSubject<any>(null);
    byTokenGroups$: Observable<ByTokenGroup[]> = null;
    tokenStatusesUpdate$: Observable<TokenStatusResponse[]> = null;
    private tokenStatusesUpdater: Subscription = null;

    tokenTypes = TokenType;
    readonly addTokenPrompt: {
        visible: boolean;
        form: any;
        show: () => void;
    };

    groupExpanded: any;

    public subscription: Subscription;
    public showDeletedCards = new FormControl(true);
    public loader = false;
    public exampleCompany: any = false;

    private _selectedCardBeforeEdit: any = null;
    private _selectedCard: any = null;
    get selectedCard(): any {
        return this._selectedCard;
    }

    set selectedCard(val: any) {
        if (
            this._selectedCard !== null &&
            (val === null || this._selectedCard.creditCardId !== val.creditCardId) &&
            (this._selectedCard.creditCardNickname !==
                this._selectedCardBeforeEdit.creditCardNickname ||
                this._selectedCardBeforeEdit.creditLimit !==
                this._selectedCard.creditLimit)
        ) {
            if (!this._selectedCard.creditCardNickname) {
                this._selectedCard.creditCardNickname =
                    this._selectedCardBeforeEdit.creditCardNickname;
            } else if (
                this._selectedCard.creditLimit !== null &&
                typeof this._selectedCard.creditLimit !== 'number' &&
                !this._selectedCard.creditLimit
            ) {
                this._selectedCard.creditLimit =
                    this._selectedCardBeforeEdit.creditLimit;
            } else {
                const ccClosure = this._selectedCard;
                const prevNickname = this._selectedCardBeforeEdit.creditCardNickname;
                const prevCreditLimit = this._selectedCardBeforeEdit.creditLimit;
                this.sharedService
                    .updateCreditCard(JSON.parse(JSON.stringify(this._selectedCard)))
                    .subscribe(
                        (resp) => {
                            if (resp.error) {
                                ccClosure.creditCardNickname = prevNickname;
                                ccClosure.creditLimit = prevCreditLimit;
                            } else {
                                ccClosure.mayEditCreditLimit = ccClosure.creditLimit === null;
                                if (!ccClosure.mayEditCreditLimit) {
                                    ccClosure.creditLimit = +ccClosure.creditLimit;
                                }
                            }
                        },
                        () => {
                            ccClosure.creditCardNickname = prevNickname;
                            ccClosure.creditLimit = prevCreditLimit;
                        }
                    );
            }
        }

        if (this._selectedCard !== val) {
            this._selectedCard = val;
            this._selectedCardBeforeEdit =
                this._selectedCard !== null
                    ? JSON.parse(JSON.stringify(this._selectedCard))
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

    deletedCards$: Observable<any>;
    public readonly forceReload$ = new Subject<void>();

    cardRestorePrompt: {
        visible: boolean;
        card: any;
        processing: boolean;
        onApprove: () => void;
    };
    cardDeletePrompt: {
        visible: boolean;
        card: any;
        processing: boolean;
        onApprove: () => void;
    };
    changeCardLinkedAccountPrompt: {
        visible: boolean;
        processing: BehaviorSubject<boolean>;
        oldAccount: any;
        newAccount: any;
        card: any;
        onApprove: () => void;
        syncSelection: (isChanged: any) => void;
    };
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        public override sharedComponent: SharedComponent,
        private sharedService: SharedService,
        public translate: TranslateService,
        public tokenService: TokenService,
        public settingsComponent: CustomersSettingsComponent,
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

        this.cardRestorePrompt = {
            visible: false,
            card: null,
            processing: false,
            onApprove: () => {
                this.cardRestorePrompt.processing = true;
                this.sharedService
                    .accountUndelete({
                        companyAccountId: this.cardRestorePrompt.card.creditCardId,
                        tokenType: 'card'
                    })
                    .pipe(tap(() => (this.cardRestorePrompt.processing = false)))
                    .subscribe(
                        () => {
                            this.cardRestorePrompt.visible = false;
                            this.forceReload$.next();
                        },
                        () => {
                        }
                    );
            }
        };

        this.cardDeletePrompt = {
            visible: false,
            card: null,
            processing: false,
            onApprove: () => {
                this.sharedComponent.mixPanelEvent('delete credit', {
                    uuid: this.cardDeletePrompt.card.creditCardId
                });
                this.cardDeletePrompt.processing = true;
                this.sharedService
                    .creditCardDelete(this.cardDeletePrompt.card.creditCardId)
                    .pipe(tap(() => (this.cardDeletePrompt.processing = false)))
                    .subscribe(
                        (response: any) => {
                            if (!response.error) {
                                this.cardDeletePrompt.visible = false;
                                // this.startChild();
                                this.forceReload$.next();
                            }
                        },
                        () => {
                            this.cardDeletePrompt.processing = false;
                        }
                    );
            }
        };
    }

    ngAfterViewInit(): void {
        if (this.settingsComponent.scrollToCard) {
            this.scrollToCard(
                this.settingsComponent.scrollToCard.creditCardId // ,
                // this.settingsComponent.scrollToCard.companyId
            );
            this.settingsComponent.scrollToCard = null;
        }
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
                                map((responseAccs: any) => responseAccs.body.accounts),
                                tap((accs: any) => {
                                    this.arrAccounts = accs;
                                    this.defaultCurrencyAccounts = accs.filter(
                                        (acc: any) =>
                                            acc.currency ===
                                            AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
                                    );
                                }),
                                switchMap((accs: any) =>
                                    this.sharedService.getCreditCardDetails(
                                        accs.map((acc: any) => {
                                            return {uuid: acc.companyAccountId};
                                        })
                                    )
                                )
                            ),
                        this.tokenService.companyTokensGetStatus(
                            this.userService.appData.userData.accountant,
                            TokenType.CREDITCARD,
                            {
                                uuid: selectedCompany.companyId
                            }
                        ) // ,
                        // this.tokenService.companyTokensGetStatus(TokenType.ACCOUNT, {
                        //     uuid: selectedCompany.companyId
                        // })
                    ]
                )
            ),
            map((resMap: any) => {
                const [responseCC, responseTkn] = resMap;
                // }, responseAccTkn]) => {
                const cCards = responseCC.body;

                cCards.forEach((cc) => {
                    cc.account = this.arrAccounts.find(
                        (acc: any) => acc.companyAccountId === cc.companyAccountId
                    );
                    cc.bankId = cc.account.bankId;
                    cc.mayEditCreditLimit = cc.creditLimit === null;
                });

                if (responseTkn && !responseTkn.length && cCards && cCards.length) {
                    const groupBy = (key) => (array) =>
                        array.reduce((objectsByKeyValue, obj) => {
                            const value = obj[key];
                            objectsByKeyValue[value] = (
                                objectsByKeyValue[value] || []
                            ).concat(obj);
                            return objectsByKeyValue;
                        }, {});

                    const arrayGr = groupBy('token')(cCards);
                    // tslint:disable-next-line:forin
                    for (const property in arrayGr) {
                        // console.log(`${property}: ${arrayGr[property]}`)
                        const objAcc = arrayGr[property][0];
                        if (objAcc.token) {
                            // @ts-ignore
                            const newObj: any = {
                                token: objAcc.token,
                                tokenStatus: null,
                                tokenNickname: this.translate.instant(
                                    'banks.' + objAcc.account.bankId
                                ),
                                isFromAccount: true,
                                websiteTargetTypeId: objAcc.account.bankId,
                                screenPasswordUpdateCount: null,
                                dateCreated: objAcc.dateCreated,
                                tokenTargetType: 'ACCOUNT',
                                hasPrivs: true,
                                companyAccountId: objAcc.companyAccountId,
                                anotherCompanyExist: false
                            };
                            responseTkn.push(newObj);
                        } else {
                            const arrayGrByBankId = groupBy('creditCardTypeId')(arrayGr[property]);
                            for (const propertySecond in arrayGrByBankId) {
                                const objAccSecond = arrayGrByBankId[propertySecond][0];
                                const newObjSecond: any = {
                                    token: objAccSecond.token,
                                    tokenStatus: null,
                                    tokenNickname: this.translate.instant(
                                        'banks.' + objAccSecond.account.bankId
                                    ),
                                    isFromAccount: true,
                                    websiteTargetTypeId: objAccSecond.account.bankId,
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
                } else if (
                    responseTkn &&
                    responseTkn.length &&
                    cCards &&
                    cCards.length
                ) {
                    const allAccWithoutTknMatch = cCards.filter((acc: any) =>
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
                            if (objAcc.token) {
                                // @ts-ignore
                                const newObj: any = {
                                    token: objAcc.token,
                                    tokenStatus: null,
                                    tokenNickname: this.translate.instant(
                                        'banks.' + objAcc.account.bankId
                                    ),
                                    isFromAccount: true,
                                    websiteTargetTypeId: objAcc.account.bankId,
                                    screenPasswordUpdateCount: null,
                                    dateCreated: objAcc.dateCreated,
                                    tokenTargetType: 'ACCOUNT',
                                    hasPrivs: true,
                                    companyAccountId: objAcc.companyAccountId,
                                    anotherCompanyExist: false
                                };
                                responseTkn.push(newObj);
                            } else {
                                const arrayGrByBankId = groupBy('creditCardTypeId')(arrayGr[property]);
                                for (const propertySecond in arrayGrByBankId) {
                                    const objAccSecond = arrayGrByBankId[propertySecond][0];
                                    const newObjSecond: any = {
                                        token: objAccSecond.token,
                                        tokenStatus: null,
                                        tokenNickname: this.translate.instant(
                                            'banks.' + objAccSecond.account.bankId
                                        ),
                                        isFromAccount: true,
                                        websiteTargetTypeId: objAccSecond.creditCardTypeId, //objAccSecond.account.bankId,
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

                const cardsArr = responseTkn.map((tknSt) => {
                    if (!(tknSt.token in this.groupExpanded)) {
                        this.groupExpanded[tknSt.token ? tknSt.token : (tknSt.token + '_' + tknSt.websiteTargetTypeId)] = this.groupExpanded.all;
                    }
                    const filterCards = cCards.filter((cc) => {
                        return cc.token ? cc.token === tknSt.token : ((cc.token + '_' + cc.creditCardTypeId) === (tknSt.token + '_' + tknSt.websiteTargetTypeId));
                    })
                    return {
                        id: tknSt.token,
                        key: tknSt.token ? tknSt.token : (tknSt.token + '_' + tknSt.websiteTargetTypeId),
                        status: tknSt,
                        children: filterCards
                    } as ByTokenGroup;
                });
                return cardsArr;
            }),
            tap(() => {
                this.loader = false;
                if (this.tokenStatusesUpdater === null) {
                    this.tokenStatusesUpdater = this.tokenStatusesUpdate$.subscribe();
                }
            }),
            shareReplay(1)
        );

        this.tokenStatusesUpdate$ = combineLatest(
            [
                this.byTokenGroups$,
                timer(5000, 5000)
            ]
        ).pipe(
            map(([groups]) =>
                groups.filter((group) =>
                    this.tokenService.isTokenStatusProgressing(group.status.tokenStatus)
                )
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

        this.deletedCards$ = this.byTokenGroups$.pipe(
            withLatestFrom(this.settingsComponent.selectedCompany$),
            switchMap(([groups, selectedCompany]) => {
                const tokenIds = Array.isArray(groups) ? groups.filter((grC) => grC.id).map((gr) => gr.id) : [];
                return tokenIds.length ? this.sharedService.getDeletedCreditCards({
                    companyId: selectedCompany.companyId,
                    tokens: tokenIds
                }) : of({
                    error: true
                });
            }),
            map((response: any) => {
                if (response.error || !Array.isArray(response.body)) {
                    return {};
                }

                return response.body.reduce((acmltr, ccard) => {
                    if (ccard.token) {
                        ccard.account = this.arrAccounts.find(
                            (acc: any) => acc.companyAccountId === ccard.companyAccountId
                        );

                        if (ccard.token in acmltr) {
                            acmltr[ccard.token].push(ccard);
                        } else {
                            acmltr[ccard.token] = [ccard];
                        }
                    }
                    return acmltr;
                }, Object.create(null));
            }),
            shareReplay(1)
        );
        //
        // if (this.userService.appData.userData.companies) {
        //     this.startChild();
        // } else {
        //     this.subscription = this.sharedComponent.getDataEvent.subscribe(() => this.startChild());
        // }

        const storageVal = this.storageService.localStorageGetterItem(
            'settings-creditCard.showDeleted'
        );
        this.showDeletedCards.patchValue(!storageVal || 'true' === storageVal);
        this.showDeletedCards.valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe((val: any) => {
                    if (!val) {
                        this.sharedComponent.mixPanelEvent('unshow deleted credits');
                    }
                    this.storageService.localStorageSetter(
                        'settings-creditCard.showDeleted',
                        val
                    );
                }
            );
    }

    // private setupItemView(trns: any): void {
    //     const trnsAcc = this.arrAccounts
    //         .find(acc => acc.companyAccountId === trns.companyAccountId);
    //     return Object.assign(trns, {
    //         account: trnsAcc
    //     });
    // }

    // startChild() {
    //     this.loader = true;
    //     // if (this.userService.appData.userData.companies) {
    //     //     this.arrCompanies = [].concat(this.userService.appData.userData.companies);
    //     //     this.selectedCompany = (this.selectedCompany) ? this.selectedCompany : this.arrCompanies[0];
    //     // }
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

    creditCardRestore(card) {
        // debugger;
        this.cardRestorePrompt.card = card;
        this.cardRestorePrompt.visible = true;
    }

    scrollToCard(creditCardId: string /*, companyId: string */) {
        // if (this.selectedCompany.companyId !== companyId) {
        //     const companytoSelect = this.arrCompanies.find(cmpny => cmpny.companyId === companyId);
        //     if (!companytoSelect) {
        //         return;
        //     } else {
        //         this.selectedCompany = companytoSelect;
        //     }
        // }
        this.byTokenGroups$.subscribe((rslt) => {
            let cardToScrollTo;
            const tokenToExpand = rslt.find(
                (tknGrp) =>
                    (cardToScrollTo = tknGrp.children.find(
                        (ccard) => ccard.creditCardId === creditCardId
                    ))
            );
            if (tokenToExpand && tokenToExpand.id in this.groupExpanded) {
                requestAnimationFrame(() => {
                    this.toggleExpandedForAllTo(false);
                    this.toggleExpandedFor(tokenToExpand.id);
                    // if (!this.groupExpanded[tokenToExpand.id]) {
                    //     this.toggleExpandedFor(tokenToExpand.id);
                    // }
                    this.selectedCard = cardToScrollTo;
                });
                requestAnimationFrame(() => {
                    const ccardElement = document.getElementById('card_' + creditCardId);
                    if (ccardElement) {
                        ccardElement.scrollIntoView();
                    }
                });
            }
        });
    }

    cardDelete(card: any) {
        this.cardDeletePrompt.card = card;
        this.cardDeletePrompt.visible = true;
    }

    promptForAccountChangeAt(
        itemChild: any,
        $event: any,
        accChangeTrigger: Dropdown
    ) {
        // console.log('itemChild: %o, event: %o', itemChild, $event);

        this.changeCardLinkedAccountPrompt = {
            visible: true,
            processing: new BehaviorSubject(false),
            card: itemChild,
            oldAccount: this.arrAccounts.find((acc: any) => acc === itemChild.account),
            newAccount: $event.value,
            onApprove: () => {
                this.changeCardLinkedAccountPrompt.processing.next(true);
                this.sharedService
                    .changeCreditCardLinkedAccount({
                        companyAccountId: $event.value.companyAccountId,
                        creditCardId: itemChild.creditCardId
                    })
                    .pipe(
                        tap({
                            next: () => {
                                this.changeCardLinkedAccountPrompt.processing.next(false);
                            },
                            error: () => {
                                this.changeCardLinkedAccountPrompt.processing.next(false);
                            }
                        }),
                        take(1)
                    )
                    .subscribe((resp) => {
                        if (resp && !resp.error) {
                            this.changeCardLinkedAccountPrompt.card.account =
                                this.changeCardLinkedAccountPrompt.newAccount;
                            this.changeCardLinkedAccountPrompt.visible = false;
                            this.forceReload$.next();
                        } else {
                            this.changeCardLinkedAccountPrompt.card.account =
                                this.changeCardLinkedAccountPrompt.oldAccount;
                        }
                        accChangeTrigger.updateSelectedOption(
                            this.changeCardLinkedAccountPrompt.card.account
                        );
                    });
            },
            syncSelection: (isChanged: any) => {
                if (!isChanged) {
                    this.changeCardLinkedAccountPrompt.card.account = this.changeCardLinkedAccountPrompt.card.accountSaved;
                }
                accChangeTrigger.updateSelectedOption(isChanged ?
                    this.changeCardLinkedAccountPrompt.card.account : this.changeCardLinkedAccountPrompt.card.accountSaved
                );
            }
        };
    }
}
