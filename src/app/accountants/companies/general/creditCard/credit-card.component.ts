import {AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {TranslateService} from '@ngx-translate/core';
import {StorageService} from '@app/shared/services/storage.service';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {BehaviorSubject, combineLatest, from, merge, Observable, of, Subject, Subscription, timer} from 'rxjs';
import {ByTokenGroup} from '@app/customers/settings/bankAccounts/settings-bankAccounts.component';
import {TokenService, TokenStatusResponse, TokenType} from '@app/core/token.service';
import {FormControl, FormGroup} from '@angular/forms';
import {filter, map, shareReplay, startWith, switchMap, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {AccountSelectComponent} from '@app/shared/component/account-select/account-select.component';
import {Dropdown} from 'primeng/dropdown';
import {GeneralComponent} from '../general.component';
import {ReloadServices} from '@app/shared/services/reload.services';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './credit-card.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CreditCardComponent
    extends ReloadServices
    implements OnDestroy, OnInit, AfterViewInit {
    public openCardDDEdit: any = false;
    arrAccounts: any = [];
    defaultCurrencyAccounts: any = [];
    byTokenGroups$: Observable<ByTokenGroup[]> = null;
    tokenStatusesUpdate$: Observable<TokenStatusResponse[]> = null;
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
        syncSelection: () => void;
    };
    public readonly selectedCompany$: BehaviorSubject<any> = new BehaviorSubject(
        false
    );
    public arrCompanyGetCustomer: any;
    public tooltipEditFile: any;
    private tokenStatusesUpdater: Subscription = null;
    private _selectedCardBeforeEdit: any = null;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public translate: TranslateService,
        public tokenService: TokenService,
        private ocrService: OcrService,
        public generalComponent: GeneralComponent,
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
                        }
                    );
            }
        };

        this.cardDeletePrompt = {
            visible: false,
            card: null,
            processing: false,
            onApprove: () => {
                this.cardDeletePrompt.processing = true;
                this.sharedService
                    .creditCardDelete(this.cardDeletePrompt.card.creditCardId, true)
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

    override reload() {
        console.log('reload child');
        this.forceReload$.next();
    }

    ngAfterViewInit(): void {
        if (this.generalComponent.scrollToCard) {
            this.scrollToCard(this.generalComponent.scrollToCard.creditCardId);
            this.generalComponent.scrollToCard = null;
        }
    }

    ngOnInit(): void {
        this.sharedComponent.getDataEvent
            .pipe(
                startWith(true),
                map(() =>
                    this.userService.appData &&
                    this.userService.appData.userData &&
                    this.userService.appData.userData.companySelect
                        ? this.userService.appData.userData.companySelect.companyId
                        : null
                ),
                filter((companyId) => !!companyId),
                takeUntil(this.destroyed$)
            )
            .subscribe(() => {
                this.selectedCompany$.next(
                    this.userService.appData.userData.companySelect
                );
            });
        this.byTokenGroups$ = merge(
            this.selectedCompany$,
            this.forceReload$.pipe(switchMap(() => this.selectedCompany$))
        ).pipe(
            filter((val) => val !== null && val !== false),
            tap(() => (this.loader = true)),
            switchMap((selectedCompany) =>
                combineLatest([
                        this.sharedService
                            .getAccounts(selectedCompany.companyId)
                            // this.sharedService.getAccountsSettings(selectedCompany.companyId)
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
                                switchMap((accs) =>
                                    this.sharedService.getCreditCardsAccountant(
                                        selectedCompany.companyId
                                    )
                                )
                                /*
                                                                                  switchMap((accs) => this.sharedService.getCreditCardDetails(accs.map((acc:any) => {
                                                                                      return {'uuid': acc.companyAccountId};
                                                                                  })))
                                                  */
                            ),
                        this.tokenService.companyTokensGetStatus(
                            this.userService.appData.userData.accountant,
                            TokenType.CREDITCARD,
                            {
                                uuid: selectedCompany.companyId
                            }
                        ),
                        this.sharedService.companyGetCustomer({
                            companyId: selectedCompany.companyId,
                            sourceProgramId: selectedCompany.sourceProgramId
                        })
                    ]
                )
            ),
            map((resSub: any) => {
                const [responseCC, responseTkn, resCompanyGetCustomer] = resSub;
                // }, responseAccTkn]) => {
                // if (resCompanyGetCustomer && !resCompanyGetCustomer.error && Array.isArray(resCompanyGetCustomer.body) && resCompanyGetCustomer.body.length) {
                //     let banksCards = resCompanyGetCustomer.body.filter(it => it.cartisCodeId === 1700);
                //     if (banksCards && banksCards.length) {
                //         banksCards = banksCards.map(it => {
                //             return {
                //                 custId: it.custId,
                //                 lName: it.custLastName,
                //                 hp: null,
                //                 id: null,
                //                 isHistory: true
                //             };
                //         });
                //         banksCards[banksCards.length - 1].isLastHistory = true;
                //     }
                //
                //     const allOthersCards = resCompanyGetCustomer.body.filter(it => it.cartisCodeId !== 1700).map(it => {
                //         return {
                //             custId: it.custId,
                //             lName: it.custLastName,
                //             hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                //             id: it.palCode
                //         };
                //     });
                //
                //     this.arrCompanyGetCustomer = banksCards.concat(allOthersCards);
                // } else {
                //     this.arrCompanyGetCustomer = [];
                // }

                const cCards = responseCC.body;
                cCards.forEach((cc) => {
                    cc.account = this.arrAccounts.find(
                        (acc: any) => acc.companyAccountId === cc.companyAccountId
                    );
                    cc.mayEditCreditLimit = cc.creditLimit === null;
                    cc.izuCustId = cc.izuCustId
                        ? this.userService.appData.userData.companyCustomerDetails.banksCards.find(
                            (custIdxRec) => custIdxRec.custId === cc.izuCustId
                        )
                        : '';
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
                        }
                    }
                }

                return responseTkn.map((tknSt) => {
                    if (!(tknSt.token in this.groupExpanded)) {
                        this.groupExpanded[tknSt.token] = this.groupExpanded.all;
                    }

                    return {
                        id: tknSt.token,
                        status: tknSt,
                        children: cCards.filter((cc) => cc.token === tknSt.token)
                    } as ByTokenGroup;
                });
            }),
            tap(() => {
                // debugger;
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
            withLatestFrom(this.selectedCompany$),
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
            withLatestFrom(this.selectedCompany$),
            switchMap(([groups, selectedCompany]) =>
                this.sharedService.getDeletedCreditCards({
                    companyId: selectedCompany.companyId,
                    tokens: groups.map((gr) => gr.id)
                })
            ),
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
            publishRef
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
                this.storageService.localStorageSetter(
                    'settings-creditCard.showDeleted',
                    val
                );
            });
    }

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

        this.selectedCompany$.complete();
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
            newAccount: $event,
            onApprove: () => {
                this.changeCardLinkedAccountPrompt.processing.next(true);
                this.sharedService
                    .changeCreditCardLinkedAccount({
                        companyAccountId: $event.companyAccountId,
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
            syncSelection: () => {
                accChangeTrigger.updateSelectedOption(
                    this.changeCardLinkedAccountPrompt.card.account
                );
            }
        };
    }

    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    setVarTool(item: any) {
        this.tooltipEditFile = JSON.parse(JSON.stringify(item));
    }

    changeIzuCustId(itemChild) {
        console.log(itemChild);
        if (itemChild.izuCustId) {
            this.sharedService
                .updateIzuCustCreditCard({
                    creditCardId: itemChild.creditCardId,
                    custId: itemChild.izuCustId.custId
                })
                .subscribe(() => {
                    const arraySource = from([
                        this.userService.appData.userData.accounts
                    ]);
                    arraySource
                        .pipe(
                            tap(() => (this.userService.appData.userData.creditCards = null)),
                            switchMap((val) => {
                                if (Array.isArray(val)) {
                                    return this.sharedService.getCreditCardDetails(
                                        val.map((id) => {
                                            return {uuid: id.companyAccountId};
                                        })
                                    );
                                }
                                return of(null);
                            }),
                            map((response: any) =>
                                response && !response.error ? response.body : null
                            ),
                            tap((response: any) =>
                                this.userService.rebuildSelectedCompanyCreditCards(response)
                            )
                        )
                        .subscribe((val) => {
                            console.log(val);
                            this.reload();
                        });
                });
        }
    }
}
