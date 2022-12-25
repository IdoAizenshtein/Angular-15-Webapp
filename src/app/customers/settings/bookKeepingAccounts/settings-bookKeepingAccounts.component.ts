import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {CustomersSettingsComponent} from '../customers-settings.component';
import {BehaviorSubject, combineLatest, defer, merge, Observable, of, Subject, zip} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {ReloadServices} from '@app/shared/services/reload.services';
import {SharedComponent} from '@app/shared/component/shared.component';
import {publishRef} from '@app/shared/functions/publishRef';
import {UserService} from "@app/core/user.service";

@Component({
    templateUrl: './settings-bookKeepingAccounts.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SettingsBookKeepingAccountsComponent
    extends ReloadServices
    implements OnInit, OnDestroy {
    readonly loading$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private readonly forceReload$ = new Subject<void>();
    private readonly destroyed$ = new Subject<void>();

    selectedCompanyAccountBankSettings$: Observable<Array<BookKeepingSourceProgramSettingsRepacked>>;

    readonly groupsExpanded: { [k: string]: boolean } = Object.create(null);
    accountPairingPrompt: {
        visible: boolean;
        selectedCompanyAccountId: string;
        cust: BookKeepingSourceProgramSettings;
        onApprove: () => void;
    };

    public selectedCompanyAccounts$: Observable<any[]>;

    classifyAsBankPrompt: {
        visible: boolean;
        onApproveCustomer: (row: {
            companyCustomerId: string;
            processing$: BehaviorSubject<boolean>;
        }) => void;
        nonBankSettings$: Observable<any[]> | null;
        filterInput: FormControl;
    };

    constructor(
        private sharedService: SharedService,
        public override sharedComponent: SharedComponent,
        public settingsComponent: CustomersSettingsComponent,
        public userService: UserService,
        private filterPipe: FilterPipe
    ) {
        super(sharedComponent);
    }

    override reload() {
        console.log('reload child');
        this.forceReload$.next();
    }

    ngOnInit(): void {
        this.selectedCompanyAccountBankSettings$ = merge(
            this.settingsComponent.selectedCompany$,
            this.forceReload$.pipe(
                switchMap(() => this.settingsComponent.selectedCompany$)
            )
        ).pipe(
            takeUntil(this.destroyed$),
            tap(() => {
                this.loading$.next(true);
            }),
            switchMap((val) =>
                val && val.companyId
                    ? this.sharedService.getAccountBankSettingsForCompany(val.companyId)
                    : of(null)
            ),
            map((result: any) => {
                if (!result || result.error) {
                    return [];
                }

                const rslt = Object.values(
                    result.body as {
                        [k: number]: Array<BookKeepingSourceProgramSettings>;
                    }
                );
                return rslt.map((custList) => {
                    custList.sort((a, b) => {
                        if (
                            (a.companyAccountId && b.companyAccountId) ||
                            (!a.companyAccountId && !b.companyAccountId)
                        ) {
                            return 0;
                        }
                        return a.companyAccountId ? -1 : 1;
                    });
                    return {
                        sourceProgramId: custList[0].sourceProgramId,
                        sourceProgramName: custList[0].sourceProgramName,
                        byAccountGroups: Object.values(
                            custList.reduce((acmltr, custRec) => {
                                const groupKey = custRec.companyAccountId || 'none';
                                if (!(groupKey in acmltr)) {
                                    acmltr[groupKey] = [];
                                }
                                acmltr[groupKey].push(custRec);
                                return acmltr;
                            }, Object.create(null))
                        )
                    } as BookKeepingSourceProgramSettingsRepacked;
                });
            }),
            tap({
                next: () => this.loading$.next(false),
                error: () => this.loading$.next(false)
            })
        );

        this.selectedCompanyAccounts$ = this.settingsComponent.selectedCompany$.pipe(
                takeUntil(this.destroyed$),
                switchMap((selectedCompany) =>
                    this.sharedService.getAccountsSettings(selectedCompany.companyId)
                ),
                map((responseAcc: any) =>
                    responseAcc && !responseAcc.error ? responseAcc.body.accounts : []
                ),
                publishRef
            );
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
        this.destroy();
    }

    updateBankPairing(
        row: BookKeepingSourceProgramSettings,
        newCompanyAccountId: string | null
    ) {
        this.settingsComponent.selectedCompany$
            .pipe(
                tap(() => {
                    if (!row.processing$) {
                        row.processing$ = new BehaviorSubject<boolean>(true);
                    } else {
                        row.processing$.next(true);
                    }
                }),
                switchMap((company) =>
                    this.sharedService.updateAccountPairing({
                        companyAccountId: newCompanyAccountId,
                        companyCustomerId: row.companyCustomerId,
                        companyId: company.companyId,
                        custId: row.custId,
                        sourceProgramId: row.sourceProgramId
                    })
                ),
                take(1)
            )
            .subscribe({
                next: (resp: any) => {
                    if (resp && !resp.error) {
                        this.forceReload$.next();
                    }
                },
                error: (e) => null,
                complete: () => row.processing$.next(false)
            });
    }

    rolloutAccountPairingPromptFor(row: BookKeepingSourceProgramSettings) {
        this.accountPairingPrompt = {
            visible: true,
            cust: row,
            selectedCompanyAccountId: row.companyAccountId,
            onApprove: () => {
                this.settingsComponent.selectedCompany$
                    .pipe(
                        tap(() => {
                            if (!row.processing$) {
                                row.processing$ = new BehaviorSubject<boolean>(true);
                            } else {
                                row.processing$.next(true);
                            }
                        }),
                        switchMap((company) =>
                            this.sharedService.updateAccountPairing({
                                companyAccountId:
                                this.accountPairingPrompt.selectedCompanyAccountId,
                                companyCustomerId: row.companyCustomerId,
                                companyId: company.companyId,
                                custId: row.custId,
                                sourceProgramId: row.sourceProgramId
                            })
                        ),
                        take(1)
                    )
                    .subscribe(
                        {
                            next: (resp: any) => {
                                if (resp && !resp.error) {
                                    this.accountPairingPrompt = null;
                                    this.forceReload$.next();
                                }
                            },
                            error: (e) => null,
                            complete: () => row.processing$.next(false)
                        }
                    );
            }
        };
    }

    rolloutClassifyAsBankPromptFor(sourceProgramId: number) {
        this.classifyAsBankPrompt = {
            visible: true,
            filterInput: new FormControl(),
            nonBankSettings$: defer(() =>
                combineLatest(
            [
                this.settingsComponent.selectedCompany$.pipe(
                    switchMap((company) =>
                        this.sharedService.getAccountNonBankSettingsForCompanyAndSource({
                            companyId: company.companyId,
                            sourceProgramId: sourceProgramId
                        })
                    ),
                    map((resp: any) => (resp && !resp.error ? resp.body : []))
                ),
                this.classifyAsBankPrompt.filterInput.valueChanges.pipe(
                    debounceTime(300),
                    distinctUntilChanged(),
                    startWith('')
                )
            ]
                )
            ).pipe(
                map(([settings, filterVal]) => {
                    if (!filterVal || !Array.isArray(settings) || !settings.length) {
                        return settings;
                    }

                    return this.filterPipe.transform(settings, filterVal, [
                        'custId',
                        'companyCustomerLname',
                        'targetSupplierTypeName'
                    ]);
                }),
                publishRef,
                takeUntil(this.destroyed$)
            ),
            onApproveCustomer: (row: {
                companyCustomerId: string;
                processing$: BehaviorSubject<boolean>;
            }) => {
                this.settingsComponent.selectedCompany$
                    .pipe(
                        tap(() => {
                            if (!row.processing$) {
                                row.processing$ = new BehaviorSubject<boolean>(true);
                            } else {
                                row.processing$.next(true);
                            }
                        }),
                        switchMap((company) =>
                            this.sharedService.supplierUpdateType({
                                companyCustomerId: row.companyCustomerId,
                                companyId: company.companyId,
                                userTargetSupplierTypeId: 1700
                            })
                        ),
                        map((resp: any) => (resp && !resp.error ? resp.body : [])),
                        take(1)
                    )
                    .subscribe({
                        next: (resp) => {
                            if (resp && !resp.error) {
                                this.classifyAsBankPrompt = null;
                                this.forceReload$.next();
                            }
                        },
                        error: (e) => console.error(e),
                        complete: () => row.processing$.next(false)
                    })
            }
        };
    }
}

export class BookKeepingSourceProgramSettings {
    companyCustomerId: string;
    companyCustomerLname: string;
    custId: string;
    sourceProgramId: number;
    companyAccountId: string;
    bankAccountId: number;
    bankId: number;
    bankSnifId: number;
    bankNickname: string;
    finalTargetSupplierTypeId: number;
    recommendedCompanyAccountId: string;
    recommendedBankAccountId: number;
    recommendedBankId: number;
    recommendedBankSnifId: number;
    sourceProgramName: string;
    processing$: BehaviorSubject<boolean>;
}

export class BookKeepingSourceProgramSettingsRepacked {
    sourceProgramId: number;
    sourceProgramName: string;
    byAccountGroups: Array<Array<BookKeepingSourceProgramSettings>>;
}
