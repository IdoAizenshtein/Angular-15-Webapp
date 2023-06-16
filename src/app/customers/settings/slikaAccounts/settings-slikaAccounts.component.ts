import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
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
    templateUrl: './settings-slikaAccounts.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SettingsSlikaAccountsComponent
    extends ReloadServices
    implements OnInit, OnDestroy {
    public arrAccounts: any = [];
    defaultCurrencyAccounts: any = [];
    // public arrCompanies: any = [];

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
    tokenStatusesUpdate$: Observable<TokenStatusResponse[]> = null;
    private tokenStatusesUpdater: Subscription = null;
    groupExpanded: any;

    tokenTypes = TokenType;
    readonly addTokenPrompt: {
        visible: boolean;
        form: any;
        show: () => void;
    };

    public subscription: Subscription;
    public showDeletedSolkim = new FormControl(true);
    public loader = false;

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
    //
    private _selectedSolekBeforeEdit: any = null;
    private _selectedSolek: any = null;
    get selectedSolek(): any {
        return this._selectedSolek;
    }

    set selectedSolek(val: any) {
        if (
            this._selectedSolek !== null &&
            (val === null || this._selectedSolek.solekNum !== val.solekNum) &&
            this._selectedSolek.solekDesc !== this._selectedSolekBeforeEdit.solekDesc
        ) {
            if (!this._selectedSolek.solekDesc) {
                this._selectedSolek.solekDesc = this._selectedSolekBeforeEdit.solekDesc;
            } else {
                const ccClosure = this._selectedSolek;
                const prevNickname = this._selectedSolekBeforeEdit.solekDesc;
                this.sharedService
                    .updateSolekDesc(JSON.parse(JSON.stringify(this._selectedSolek)))
                    .subscribe(
                        (resp) => {
                            if (resp.error) {
                                ccClosure.solekDesc = prevNickname;
                            }
                        },
                        () => {
                            ccClosure.solekDesc = prevNickname;
                        }
                    );
            }
        }

        if (this._selectedSolek !== val) {
            this._selectedSolek = val;
            this._selectedSolekBeforeEdit =
                this._selectedSolek !== null
                    ? JSON.parse(JSON.stringify(this._selectedSolek))
                    : null;
        }
    }

    deletedSolkim$: Observable<any>;
    public readonly forceReload$ = new Subject<void>();

    solekRestorePrompt: {
        visible: boolean;
        solek: any;
        processing: boolean;
        onApprove: () => void;
    };
    solekDeletePrompt: {
        visible: boolean;
        solek: any;
        processing: boolean;
        onApprove: () => void;
    };
    changeSolekLinkedAccountPrompt: {
        visible: boolean;
        processing: BehaviorSubject<boolean>;
        oldAccount: any;
        newAccount: any;
        solek: any;
        onApprove: () => void;
        syncSelection: (isChanged: any) => void;
    };
    private readonly destroyed$ = new Subject<void>();
    public exampleCompany: any = false;

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

        this.solekRestorePrompt = {
            visible: false,
            solek: null,
            processing: false,
            onApprove: () => {
                this.solekRestorePrompt.processing = true;
                this.sharedService
                    .accountUndelete({
                        companyAccountId: this.solekRestorePrompt.solek.companyAccountId,
                        tokenType: 'solek',
                        solekNum: this.solekRestorePrompt.solek.solekNum
                    })
                    .pipe(
                        tap(
                            () => (this.solekRestorePrompt.processing = false)
                        ),
                        take(1)
                    )
                    .subscribe(() => {
                        this.solekRestorePrompt.visible = false;
                        this.forceReload$.next();
                    });
            }
        };

        this.solekDeletePrompt = {
            visible: false,
            solek: null,
            processing: false,
            onApprove: () => {
                this.solekDeletePrompt.processing = true;
                this.sharedComponent.mixPanelEvent('delete solek', {
                    uuid: this.solekDeletePrompt.solek.solekNum
                });
                this.sharedService
                    .solekDelete(
                        this.solekDeletePrompt.solek.companyAccountId,
                        this.solekDeletePrompt.solek.solekNum
                    )
                    .pipe(
                        tap(
                            () => (this.solekDeletePrompt.processing = false)
                        ),
                        take(1)
                    )
                    .subscribe((response: any) => {
                        if (!response.error) {
                            this.solekDeletePrompt.visible = false;
                            // this.startChild();
                            this.forceReload$.next();
                        }
                    });
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
            switchMap((selectedCompany) => forkJoin(
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
                                    this.sharedService.getSlikaCfl(
                                        accs.map((acc: any) => {
                                            return {uuid: acc.companyAccountId};
                                        })
                                    )
                                )
                            ),
                        this.tokenService.companyTokensGetStatus(
                            this.userService.appData.userData.accountant,
                            TokenType.SLIKA,
                            {
                                uuid: selectedCompany.companyId
                            }
                        )
                    ]
                )
            ),
            map((resMap: any) => {
                const [responseAcc, responseTkn] = resMap;
                const solekAccs =
                    responseAcc.body && Array.isArray(responseAcc.body.solekDetails)
                        ? responseAcc.body.solekDetails
                        : [];
                solekAccs.forEach(
                    (slkAcc) =>
                        (slkAcc.account = this.arrAccounts.find(
                            (acc: any) => acc.companyAccountId === slkAcc.companyAccountId
                        ))
                );
                if (
                    responseTkn &&
                    !responseTkn.length &&
                    solekAccs &&
                    solekAccs.length
                ) {
                    const groupBy = (key) => (array) =>
                        array.reduce((objectsByKeyValue, obj) => {
                            const value = obj[key];
                            objectsByKeyValue[value] = (
                                objectsByKeyValue[value] || []
                            ).concat(obj);
                            return objectsByKeyValue;
                        }, {});

                    const arrayGr = groupBy('token')(solekAccs);
                    // tslint:disable-next-line:forin
                    for (const property in arrayGr) {
                        // console.log(`${property}: ${arrayGr[property]}`)
                        const objAcc = arrayGr[property][0];
                        if(objAcc.token){
                            // @ts-ignore
                            const newObj: any = {
                                token: objAcc.token,
                                tokenStatus: null,
                                tokenNickname: this.translate.instant(
                                    'clearingAgencies.' + objAcc.solekBankId
                                ),
                                isFromAccount: true,
                                websiteTargetTypeId: objAcc.solekBankId,
                                screenPasswordUpdateCount: null,
                                dateCreated: objAcc.dateCreated,
                                tokenTargetType: 'SLIKA',
                                hasPrivs: true,
                                companyAccountId: objAcc.companyAccountId,
                                anotherCompanyExist: false
                            };
                            responseTkn.push(newObj);
                        }else{
                            const arrayGrByBankId = groupBy('solekBankId')(arrayGr[property]);

                            for (const propertySecond in arrayGrByBankId) {
                                const objAccSecond = arrayGrByBankId[propertySecond][0];
                                const newObjSecond: any = {
                                    token: objAccSecond.token,
                                    tokenStatus: null,
                                    tokenNickname: this.translate.instant(
                                        'clearingAgencies.' + objAccSecond.solekBankId
                                    ),
                                    isFromAccount: true,
                                    websiteTargetTypeId: objAccSecond.solekBankId,
                                    screenPasswordUpdateCount: null,
                                    dateCreated: objAccSecond.dateCreated,
                                    tokenTargetType: 'SLIKA',
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
                    solekAccs &&
                    solekAccs.length
                ) {
                    const allAccWithoutTknMatch = solekAccs.filter((acc: any) =>
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
                                    tokenStatus: null,
                                    tokenNickname: this.translate.instant(
                                        'clearingAgencies.' + objAcc.solekBankId
                                    ),
                                    isFromAccount: true,
                                    websiteTargetTypeId: objAcc.solekBankId,
                                    screenPasswordUpdateCount: null,
                                    dateCreated: objAcc.dateCreated,
                                    tokenTargetType: 'SLIKA',
                                    hasPrivs: true,
                                    companyAccountId: objAcc.companyAccountId,
                                    anotherCompanyExist: false
                                };
                                responseTkn.push(newObj);
                            }else{
                                const arrayGrByBankId = groupBy('solekBankId')(arrayGr[property]);

                                for (const propertySecond in arrayGrByBankId) {
                                    const objAccSecond = arrayGrByBankId[propertySecond][0];
                                    const newObjSecond: any = {
                                        token: objAccSecond.token,
                                        tokenStatus: null,
                                        tokenNickname: this.translate.instant(
                                            'clearingAgencies.' + objAccSecond.solekBankId
                                        ),
                                        isFromAccount: true,
                                        websiteTargetTypeId: objAccSecond.solekBankId,
                                        screenPasswordUpdateCount: null,
                                        dateCreated: objAccSecond.dateCreated,
                                        tokenTargetType: 'SLIKA',
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
                // debugger;
                return responseTkn.map((tknSt) => {
                    if (!(tknSt.token in this.groupExpanded)) {
                        this.groupExpanded[(tknSt.token + '_' + tknSt.websiteTargetTypeId)] = this.groupExpanded.all;
                    }

                    return {
                        id: tknSt.token,
                        key: (tknSt.token + '_' + tknSt.websiteTargetTypeId),
                        status: tknSt,
                        children: solekAccs.filter((acc: any) => (acc.token + '_' + acc.solekBankId) === (tknSt.token + '_' + tknSt.websiteTargetTypeId))
                    } as ByTokenGroup;
                });
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

        this.deletedSolkim$ = this.byTokenGroups$.pipe(
            withLatestFrom(this.settingsComponent.selectedCompany$),
            switchMap(([groups, selectedCompany]) => {
                const tokenIds = Array.isArray(groups) ? groups.filter((grC) => grC.id).map((gr) => gr.id) : [];
                return tokenIds.length ? this.sharedService.getDeletedSolkim({
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

                return response.body.reduce((acmltr, slk) => {
                    if (slk.token) {
                        slk.account = this.arrAccounts.find(
                            (acc: any) => acc.companyAccountId === slk.companyAccountId
                        );

                        if (slk.token in acmltr) {
                            acmltr[slk.token].push(slk);
                        } else {
                            acmltr[slk.token] = [slk];
                        }
                    }
                    return acmltr;
                }, Object.create(null));
            }),
            shareReplay(1)
        );

        // if (this.userService.appData.userData.companies) {
        //     this.startChild();
        // } else {
        //     this.subscription = this.sharedComponent.getDataEvent.subscribe(() => this.startChild());
        // }

        const storageVal = this.storageService.localStorageGetterItem(
            'settings-slikaAccounts.showDeleted'
        );
        this.showDeletedSolkim.patchValue(!storageVal || 'true' === storageVal);
        this.showDeletedSolkim.valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe((val: any) => {
                    if (!val) {
                        this.sharedComponent.mixPanelEvent('unshow deleted accounts');
                    }
                    this.storageService.localStorageSetter(
                        'settings-slikaAccounts.showDeleted',
                        val
                    );
                }
            );
    }

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

    solekRestore(solek) {
        // debugger;
        this.solekRestorePrompt.solek = solek;
        this.solekRestorePrompt.visible = true;
    }

    solekDelete(solek: any) {
        this.solekDeletePrompt.solek = solek;
        this.solekDeletePrompt.visible = true;
    }

    promptForAccountChangeAt(
        itemChild: any,
        $event: any,
        accChangeTrigger: Dropdown
    ) {
        // console.log('itemChild: %o, event: %o', itemChild, $event);

        this.changeSolekLinkedAccountPrompt = {
            visible: true,
            processing: new BehaviorSubject(false),
            solek: itemChild,
            oldAccount: this.arrAccounts.find((acc: any) => acc.companyAccountId === itemChild.companyAccountId),
            newAccount: $event.value,
            onApprove: () => {
                this.changeSolekLinkedAccountPrompt.processing.next(true);
                this.sharedService
                    .changeClearingAgencyLinkedAccount({
                        oldCompanyAccountId: itemChild.companyAccountId,
                        newCompanyAccountId: $event.value.companyAccountId,
                        solekNum: itemChild.solekNum
                    })
                    .pipe(
                        tap({
                            next: () => {
                                this.changeSolekLinkedAccountPrompt.processing.next(false);
                            },
                            error: () => {
                                this.changeSolekLinkedAccountPrompt.processing.next(false);
                            }
                        }),
                        take(1)
                    )
                    .subscribe((resp) => {
                        if (resp && !resp.error) {
                            this.changeSolekLinkedAccountPrompt.solek.account =
                                this.changeSolekLinkedAccountPrompt.newAccount;
                            this.changeSolekLinkedAccountPrompt.visible = false;
                            this.forceReload$.next();
                        } else {
                            this.changeSolekLinkedAccountPrompt.solek.account =
                                this.changeSolekLinkedAccountPrompt.oldAccount;
                        }
                        this.changeSolekLinkedAccountPrompt.syncSelection(true);
                    });
            },
            syncSelection: (isChanged: any) => {
                if (!isChanged) {
                    this.changeSolekLinkedAccountPrompt.solek.account = this.changeSolekLinkedAccountPrompt.solek.accountSaved;
                }
                accChangeTrigger.updateSelectedOption(isChanged ?
                    this.changeSolekLinkedAccountPrompt.solek.account : this.changeSolekLinkedAccountPrompt.solek.accountSaved
                );
            }
        };
    }
}
