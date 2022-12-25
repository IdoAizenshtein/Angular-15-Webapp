import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {StorageService} from '@app/shared/services/storage.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {merge, Observable, of, Subject, Subscription, timer, combineLatest} from 'rxjs';
import {filter, map, shareReplay, startWith, switchMap, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {TokenService, TokenStatusResponse, TokenType} from '@app/core/token.service';
import {FormControl, FormGroup} from '@angular/forms';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {GeneralComponent} from '../general.component';
import {ReloadServices} from '@app/shared/services/reload.services';
import {HttpErrorResponse} from '@angular/common/http';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './account.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class AccountComponent
    extends ReloadServices
    implements OnInit, OnDestroy {
    byTokenGroups$: Observable<ByTokenGroup[]> = null;
    deletedAccounts$: Observable<any> = null;
    tokenStatusesUpdate$: Observable<TokenStatusResponse[]> = null;
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
    public tooltipEditFile: any;
    public openCardDDEdit: any = false;
    linkedCreditCards$: Observable<{ [k: string]: any[] }>;
    readonly forceReload$ = new Subject<void>();
    public readonly selectedCompany$: BehaviorSubject<any> = new BehaviorSubject(
        false
    );
    public arrCompanyGetCustomer: any;
    private tokenStatusesUpdater: Subscription = null;
    private _selectedAccountBeforeEdit: any = null;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        public tokenService: TokenService,
        public generalComponent: GeneralComponent,
        private ocrService: OcrService,
        public translate: TranslateService,
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
                this.sharedService
                    .accountDelete(
                        this.accountDeletePrompt.account.companyAccountId,
                        true
                    )
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

    override reload() {
        console.log('reload child');
        this.forceReload$.next();
    }


    startChild(): void {
        console.log('BankAndCreditComponent');
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
                combineLatest(
              [      this.sharedService
                  .getAccounts(selectedCompany.companyId)
                  // this.sharedService.getAccountsSettings(selectedCompany.companyId)
                  .pipe(
                      tap((responseAcc: any) => {
                          if (responseAcc.body) {
                              const accountsWithLinkedCardsRequest =
                                  responseAcc.body.accounts
                                      .filter((acc:any) => acc.creditCardNum)
                                      .map((acc:any) => {
                                          return {uuid: acc.companyAccountId};
                                      });
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
                                          (acc:any) => (acc.isUpToDate = acc.isUpdate)
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
                  ),
                  this.sharedService.companyGetCustomer({
                      companyId: selectedCompany.companyId,
                      sourceProgramId: selectedCompany.sourceProgramId
                  })]
                )
            ),
            map((resSub: any) => {
                const [responseAcc, responseTkn, resCompanyGetCustomer] = resSub;
                // [responseAcc, responseTkn, resCompanyGetCustomer]
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

                const accs = responseAcc['body'] ? responseAcc['body'].accounts : [];
                if (accs.length) {
                    accs.forEach((it) => {
                        it.izuCustId = it.izuCustId
                            ? this.userService.appData.userData.companyCustomerDetails.banksCards.find(
                                (custIdxRec) => custIdxRec.custId === it.izuCustId
                            )
                            : '';
                    });
                }

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
                        // @ts-ignore
                        const newObj: any = {
                            token: objAcc.token,
                            tokenStatus: null,
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
                    }
                } else if (responseTkn && responseTkn.length && accs && accs.length) {
                    const allAccWithoutTknMatch = accs.filter((acc:any) =>
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
                        }
                    }
                }
                if (responseAcc['body'].exampleCompany) {
                    return null;
                } else {
                    return responseTkn.map((tknSt) => {
                        if (!(tknSt.token in this.groupExpanded)) {
                            this.groupExpanded[tknSt.token] = this.groupExpanded.all;
                        }

                        return {
                            id: tknSt.token,
                            status: tknSt,
                            children: accs.filter((acc:any) => acc.token === tknSt.token)
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
            shareReplay(1),
            takeUntil(this.destroyed$)
        );

        this.deletedAccounts$ = this.byTokenGroups$.pipe(
            withLatestFrom(this.selectedCompany$),
            switchMap(([groups, selectedCompany]) =>
                this.sharedService.getDeletedAccounts({
                    companyId: selectedCompany.companyId,
                    tokenIds: Array.isArray(groups) ? groups.map((gr) => gr.id) : []
                })
            ),
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
            publishRef,
            takeUntil(this.destroyed$)
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
                this.storageService.localStorageSetter(
                    'settings-bankAccounts.showDeleted',
                    val
                )
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
                                .filter((acc:any) => acc !== account && acc.primaryAccount)
                                .forEach((acc:any) => (acc.primaryAccount = false));
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
        this.selectedCompany$.complete();
        this.destroyed$.next();
        this.destroyed$.complete();
        this.destroy();
    }

    navigateToCreditCard(creditCardId: string) {
        this.selectedCompany$.pipe(take(1)).subscribe((selectedCompany) => {
            this.router
                .navigate(['../creditCard'], {
                    relativeTo: this.route,
                    queryParamsHandling: 'preserve'
                })
                .then((rslt) => {
                    if (rslt) {
                        this.generalComponent.scrollToCard = {
                            companyId: selectedCompany.companyId,
                            creditCardId: creditCardId
                        };
                    }
                });
        });
    }

    accountDelete(account) {
        this.accountDeletePrompt.account = account;
        this.accountDeletePrompt.visible = true;
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
                .updateIzuCust({
                    companyAccountId: itemChild.companyAccountId,
                    custId: itemChild.izuCustId.custId
                })
                .subscribe(() => {
                    this.sharedService
                        .getAccounts(itemChild.companyId)
                        .pipe(
                            tap((response: any) => {
                                this.userService.appData.userData.exampleCompany =
                                    response && !response.error && response.body.exampleCompany;
                            })
                        )
                        .subscribe(
                            (response: any) => {
                                this.userService.appData.userData.accounts =
                                    response && !response.error ? response.body.accounts : null;
                                if (Array.isArray(this.userService.appData.userData.accounts)) {
                                    this.userService.appData.userData.accounts.forEach((acc:any) => {
                                        acc.isUpToDate = acc.isUpdate;
                                        acc.outdatedBecauseNotFound =
                                            !acc.isUpToDate &&
                                            acc.alertStatus === 'Not found in bank website';
                                    });
                                }
                                this.reload();
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
                });
        }
    }
}

export class ByTokenGroup {
    id: string;
    status: TokenStatusResponse;
    children: Array<any>;
}
