import {Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {ActivatedRoute, NavigationEnd, Router} from '@angular/router';
import {UserService} from '@app/core/user.service';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {ReplaySubject} from 'rxjs/internal/ReplaySubject';
import {Subscription} from 'rxjs/internal/Subscription';
import {FormGroup} from '@angular/forms';
import {filter, map, shareReplay, startWith, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {TokenType} from '@app/core/token.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {Observable} from 'rxjs/internal/Observable';
import {Subject} from 'rxjs/internal/Subject';
import {HttpErrorResponse} from '@angular/common/http';
import {SignupService} from '@app/signup/signup.service';
import {StorageService} from '@app/shared/services/storage.service';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './customers-settings.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CustomersSettingsComponent implements OnInit, OnDestroy {
    public componentRefChild: any;

    public scrollToCard: { companyId: string; creditCardId: string } = null;

    public readonly arrCompanies$: ReplaySubject<any> = new ReplaySubject(1);
    public readonly selectedCompany$: BehaviorSubject<any> = new BehaviorSubject(
        false
    );

    public selectedCompanyVal: any;
    private subscription: Subscription;
    // public selectedCompany: any;
    public exampleCompany: any = false;

    readonly createCompanyPrompt: {
        form: any;
        visible: boolean;
        processing: boolean;
        onSubmit: () => void;
        show: () => void;
    };
    readonly addTokenPrompt: {
        visible: boolean;
        form: any;
        show: () => void;
    };
    tokenTypes = TokenType;

    @ViewChild('rowOfCompanies') rowOfCompanies: ElementRef<HTMLElement>;

    readonly isUsersTabAvailableForSelectedCompany$: Observable<boolean>;
    userEditStateSelected$: Observable<boolean>;
    private readonly destroyed$ = new Subject<void>();
    public userSettings: any = {};
    public userData: any;
    public officeUsersCount: any;
    public previousUrl: any = false;
    private readonly routerSubscription: Subscription;

    constructor(
        public router: Router,
        private route: ActivatedRoute,
        private sharedService: SharedService,
        public signupService: SignupService,
        public storageService: StorageService,
        public userService: UserService,
        public sharedComponent: SharedComponent
    ) {
        const urlState: string = this.router.url.split('?')[0];

        this.routerSubscription = router.events
            .pipe(filter((event: any) => event instanceof NavigationEnd))
            .subscribe((event: NavigationEnd) => {
                // console.log('-------------', event.urlAfterRedirects, 'prev:', event.url);
                // debugger
                // if(this.previousUrl){
                //
                // }
                // this.previousUrl = event.url;
                if (
                    event.url === '/accountants/companies/settings' ||
                    event.url.includes('/cfl/settings?')
                ) {
                    if (
                        !urlState.includes('settings/alerts') &&
                        !urlState.includes('settings/officeUsers') &&
                        !urlState.includes('settings/users') &&
                        !urlState.includes('settings/businessDetails')
                    ) {
                        if (!this.userService.appData.userData.accountant) {
                            this.router.navigate(['/cfl/settings/bankAccounts'], {
                                queryParamsHandling: 'preserve',
                                relativeTo: this.route
                            });
                        } else {
                            this.router.navigate(
                                ['/accountants/companies/settings/myaccount'],
                                {
                                    queryParamsHandling: 'preserve',
                                    relativeTo: this.route
                                }
                            );
                        }
                    }
                }
            });

        if (
            (this.userService.appData &&
                this.userService.appData.isAdmin &&
                this.userService.appData.userDataAdmin.officePriv) ||
            (this.userService.appData &&
                !this.userService.appData.isAdmin &&
                this.userService.appData.userData.officePriv)
        ) {
            this.sharedService
                .officeUsersCount({
                    uuid: this.userService.appData.isAdmin
                        ? this.userService.appData.userDataAdmin.accountantOfficeId
                        : this.userService.appData.userData.accountantOfficeId
                })
                .subscribe(
                    (response: any) => {
                        this.officeUsersCount = response ? response['body'] : response;
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
        }

        this.sharedService.getUserSettings().subscribe(
            (response: any) => {
                this.userSettings = response ? response['body'] : response;
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
        this.selectedCompany$
            .subscribe((val) => {
                if (val !== false && val !== null) {
                    this.storageService.sessionStorageSetter('selectedCompany$Settings', val ? JSON.stringify(val) : null);
                    this.sharedService.getAccounts(val ? val.companyId : null)
                        .subscribe(
                            response => {
                                this.exampleCompany = response && !response.error && response.body.exampleCompany;
                                if (this.componentRefChild.exampleCompany !== undefined) {
                                    this.componentRefChild.exampleCompany = this.exampleCompany;
                                }
                            }, (err: HttpErrorResponse) => {
                                if (err.error instanceof Error) {
                                    console.log('An error occurred:', err.error.message);
                                } else {
                                    console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
                                }
                            }
                        );


                    if (val && val.biziboxType === 'regular' && urlState.includes('settings/bookKeepingAccounts')) {
                        if (this.userService.appData.userData.companySelect.trialBlocked &&
                            this.userService.appData.userData.companySelect.trialBlocked === true) {
                            this.sharedService.announceMissionGetCompanies('trialBlocked');
                        } else {
                            this.router.navigate([(!this.userService.appData.userData.accountant ? '/cfl/packages' : '/accountants/companies/packages')], {
                                queryParamsHandling: 'preserve',
                                relativeTo: this.route
                            });
                        }
                    }
                }
            });

        // if (this.userService.appData.userData.companies) {
        //     this.onCompaniesResolved();
        // } else {
        //     this.subscription = this.sharedComponent.getDataEvent
        //         .subscribe(() => this.onCompaniesResolved());
        // }

        this.createCompanyPrompt = {
            form: new FormGroup({}),
            visible: false,
            processing: false,
            show: () => {
                this.createCompanyPrompt.form.reset();
                this.createCompanyPrompt.visible = true;
            },
            onSubmit: () => {
                if (!this.createCompanyPrompt.form.valid) {
                    BrowserService.flattenControls(this.createCompanyPrompt.form).forEach(
                        (ac) => ac.markAsDirty()
                    );
                    return;
                } else {
                    this.createCompanyPrompt.processing = true;
                    this.sharedComponent.mixPanelEvent('new company');
                    const frmVal = this.createCompanyPrompt.form.value;
                    const saveCompanies = JSON.parse(
                        JSON.stringify(this.userService.appData.userData.companies)
                    );
                    let {firstName, lastName, cellPhone, mail} = this.userSettings;
                    if (this.userService.appData && this.userService.appData.isAdmin) {
                        this.sharedService.userOnBehalf().subscribe((response: any) => {
                            const resBody = response ? response['body'] : response;
                            cellPhone = resBody.cellPhone;
                            firstName = resBody.firstName;
                            lastName = resBody.lastName;
                            mail = resBody.username;
                            const req = {
                                biziboxType: this.selectedCompany$.value.biziboxType,
                                firstName: firstName,
                                lastName: lastName,
                                phoneNumber: cellPhone,
                                username: mail,
                                hesderId: '4'
                            };
                            this.signupService
                                .updateLeadInfo(req)
                                .pipe(take(1))
                                .subscribe(() => {
                                    const req1 = {
                                        companyInfo: {
                                            biziboxType: this.selectedCompany$.value.biziboxType,
                                            businessCategory: frmVal.profile,
                                            companyHp: frmVal.id,
                                            companyName: frmVal.name,
                                            hesderId: '4'
                                        },
                                        userInfo: {
                                            firstName: firstName,
                                            lastName: lastName,
                                            cellPhone: cellPhone,
                                            username: mail,
                                            password: ''
                                        }
                                    };
                                    this.signupService
                                        .signupCreate(req1, false)
                                        .pipe(
                                            tap(
                                                () =>
                                                    (this.userService.appData.userData.companies = null)
                                            ),
                                            switchMap(() => {
                                                return this.sharedService
                                                    .getCompanies()
                                                    .pipe(
                                                        map((companiesResp) => [
                                                            (<any>companiesResp).body.find((com) =>
                                                                saveCompanies.every(
                                                                    (save) => save.companyId !== com.companyId
                                                                )
                                                            ).companyId,
                                                            (<any>companiesResp).body
                                                        ])
                                                    );
                                            })
                                        )
                                        .subscribe({
                                            next: (resNext: any) => {
                                                const [newCompanyId, companies] = resNext;
                                                this.userService.appData.userData.companies = companies;
                                                this.userService.appData.userData.companies.forEach(
                                                    (companyData) => {
                                                        companyData.METZALEM =
                                                            this.userService.appData.userData.accountant ===
                                                            false &&
                                                            (companyData.privs.includes('METZALEM') ||
                                                                (companyData.privs.includes('METZALEM') &&
                                                                    companyData.privs.includes('KSAFIM')) ||
                                                                (companyData.privs.includes('METZALEM') &&
                                                                    companyData.privs.includes(
                                                                        'ANHALATHESHBONOT'
                                                                    )) ||
                                                                (companyData.privs.includes('METZALEM') &&
                                                                    companyData.privs.includes('KSAFIM') &&
                                                                    companyData.privs.includes(
                                                                        'ANHALATHESHBONOT'
                                                                    )));
                                                        if (companyData.METZALEM) {
                                                            if (
                                                                companyData.privs.includes('METZALEM') &&
                                                                companyData.privs.includes('KSAFIM') &&
                                                                companyData.privs.includes('ANHALATHESHBONOT')
                                                            ) {
                                                                companyData.METZALEM_TYPE =
                                                                    'KSAFIM_ANHALATHESHBONOT';
                                                            } else if (
                                                                companyData.privs.includes('METZALEM') &&
                                                                companyData.privs.includes('KSAFIM')
                                                            ) {
                                                                companyData.METZALEM_TYPE = 'KSAFIM';
                                                            } else if (
                                                                companyData.privs.includes('METZALEM') &&
                                                                companyData.privs.includes('ANHALATHESHBONOT')
                                                            ) {
                                                                companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
                                                            } else if (
                                                                companyData.privs.includes('METZALEM')
                                                            ) {
                                                                companyData.METZALEM_TYPE = 'METZALEM';
                                                            }
                                                        }
                                                        companyData.METZALEM_deskTrialExpired =
                                                            companyData.METZALEM &&
                                                            !companyData.deskTrialExpired;
                                                    }
                                                );
                                                this.arrCompanies$.next(
                                                    this.userService.appData.userData.companies
                                                );
                                                this.selectedCompany$.next(
                                                    this.userService.appData.userData.companies.find(
                                                        (arrc) => arrc.companyId === newCompanyId
                                                    )
                                                );

                                                this.createCompanyPrompt.visible = false;
                                                this.addTokenPrompt.show();
                                            },
                                            error: () => (this.createCompanyPrompt.processing = false),
                                            complete: () => (this.createCompanyPrompt.processing = false)
                                        });
                                });
                        });
                    } else {
                        const req = {
                            biziboxType: this.selectedCompany$.value.biziboxType,
                            firstName: firstName,
                            lastName: lastName,
                            phoneNumber: cellPhone,
                            username: mail,
                            hesderId: '4'
                        };
                        this.signupService
                            .updateLeadInfo(req)
                            .pipe(take(1))
                            .subscribe(() => {
                                const req1 = {
                                    companyInfo: {
                                        biziboxType: this.selectedCompany$.value.biziboxType,
                                        businessCategory: frmVal.profile,
                                        companyHp: frmVal.id,
                                        companyName: frmVal.name,
                                        hesderId: '4'
                                    },
                                    userInfo: {
                                        firstName: firstName,
                                        lastName: lastName,
                                        cellPhone: cellPhone,
                                        username: mail,
                                        password: ''
                                    }
                                };
                                this.signupService
                                    .signupCreate(req1, false)
                                    .pipe(
                                        tap(
                                            () => (this.userService.appData.userData.companies = null)
                                        ),
                                        switchMap(() => {
                                            return this.sharedService
                                                .getCompanies()
                                                .pipe(
                                                    map((companiesResp) => [
                                                        (<any>companiesResp).body.find((com) =>
                                                            saveCompanies.every(
                                                                (save) => save.companyId !== com.companyId
                                                            )
                                                        ).companyId,
                                                        (<any>companiesResp).body
                                                    ])
                                                );
                                        })
                                    )
                                    .subscribe({
                                        next: (resNext: any) => {
                                            const [newCompanyId, companies] = resNext;
                                            this.userService.appData.userData.companies = companies;
                                            this.userService.appData.userData.companies.forEach(
                                                (companyData) => {
                                                    companyData.METZALEM =
                                                        this.userService.appData.userData.accountant ===
                                                        false &&
                                                        (companyData.privs.includes('METZALEM') ||
                                                            (companyData.privs.includes('METZALEM') &&
                                                                companyData.privs.includes('KSAFIM')) ||
                                                            (companyData.privs.includes('METZALEM') &&
                                                                companyData.privs.includes(
                                                                    'ANHALATHESHBONOT'
                                                                )) ||
                                                            (companyData.privs.includes('METZALEM') &&
                                                                companyData.privs.includes('KSAFIM') &&
                                                                companyData.privs.includes(
                                                                    'ANHALATHESHBONOT'
                                                                )));
                                                    if (companyData.METZALEM) {
                                                        if (
                                                            companyData.privs.includes('METZALEM') &&
                                                            companyData.privs.includes('KSAFIM') &&
                                                            companyData.privs.includes('ANHALATHESHBONOT')
                                                        ) {
                                                            companyData.METZALEM_TYPE =
                                                                'KSAFIM_ANHALATHESHBONOT';
                                                        } else if (
                                                            companyData.privs.includes('METZALEM') &&
                                                            companyData.privs.includes('KSAFIM')
                                                        ) {
                                                            companyData.METZALEM_TYPE = 'KSAFIM';
                                                        } else if (
                                                            companyData.privs.includes('METZALEM') &&
                                                            companyData.privs.includes('ANHALATHESHBONOT')
                                                        ) {
                                                            companyData.METZALEM_TYPE = 'ANHALATHESHBONOT';
                                                        } else if (companyData.privs.includes('METZALEM')) {
                                                            companyData.METZALEM_TYPE = 'METZALEM';
                                                        }
                                                    }
                                                    companyData.METZALEM_deskTrialExpired =
                                                        companyData.METZALEM &&
                                                        !companyData.deskTrialExpired;
                                                }
                                            );
                                            this.arrCompanies$.next(
                                                this.userService.appData.userData.companies
                                            );
                                            this.selectedCompany$.next(
                                                this.userService.appData.userData.companies.find(
                                                    (arrc) => arrc.companyId === newCompanyId
                                                )
                                            );

                                            this.createCompanyPrompt.visible = false;
                                            this.addTokenPrompt.show();
                                        },
                                        error: () => (this.createCompanyPrompt.processing = false),
                                        complete: () =>
                                            (this.createCompanyPrompt.processing = false)
                                    });
                            });
                    }

                    // this.sharedService.createCompany({
                    //     businessCategory: frmVal.profile,
                    //     companyHp: frmVal.id,
                    //     companyName: frmVal.name
                    // }).pipe(
                    //     tap(() => this.userService.appData.userData.companies = null),
                    //     switchMap((newCompanyId) => {
                    //         return this.sharedService.getCompanies()
                    //             .pipe(
                    //                 map((companiesResp) => [newCompanyId, (<any>companiesResp).body])
                    //             );
                    //     })
                    // ).subscribe({
                    //     next: ([newCompanyId, companies]) => {
                    //         this.userService.appData.userData.companies = companies;
                    //         this.arrCompanies$.next(this.userService.appData.userData.companies);
                    //         this.selectedCompany$.next(
                    //             this.userService.appData.userData.companies
                    //                 .find(arrc => arrc.companyId === newCompanyId));
                    //
                    //         this.createCompanyPrompt.visible = false;
                    //         this.addTokenPrompt.show();
                    //     },
                    //     error: () => this.createCompanyPrompt.processing = false,
                    //     complete: () => this.createCompanyPrompt.processing = false
                    // });
                }
            }
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

        this.isUsersTabAvailableForSelectedCompany$ = this.selectedCompany$.pipe(
            map(
                (selectedCompany) =>
                    selectedCompany &&
                    ['ADMIN', 'COMPANYADMIN', 'COMPANYSUPERADMIN'].some((priv) =>
                        selectedCompany.privs.includes(priv)
                    )
            ),
            publishRef
        );

        this.userEditStateSelected$ = this.router.events.pipe(
            filter((evt) => {
                // debugger;
                return evt instanceof NavigationEnd;
            }),
            map((evt) => {
                // debugger;
                return (<NavigationEnd>evt).url.includes('/users/');
            }),
            startWith(false),
            shareReplay(1),
            takeUntil(this.destroyed$)
        );
    }

    onActivate(componentRef: any) {
        this.componentRefChild = componentRef;
        if (this.componentRefChild.exampleCompany !== undefined) {
            this.componentRefChild.exampleCompany = this.exampleCompany;
        }
        if (typeof this.componentRefChild.startChild === 'function') {
            this.componentRefChild.startChild();
        }
    }

    ngOnInit(): void {
        this.sharedComponent.getDataEvent
            .pipe(
                startWith(true),
                filter((result) =>
                    Array.isArray(this.userService.appData.userData.companies)
                ),
                take(1)
            )
            .subscribe(() => {
                this.onCompaniesResolved();
            });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.routerSubscription.unsubscribe();

        this.arrCompanies$.complete();
        this.selectedCompany$.complete();

        this.destroyed$.next();
        this.destroyed$.complete();
    }

    public onCompaniesResolved() {
        this.arrCompanies$.next(this.userService.appData.userData.companies);
        if (
            Array.isArray(this.userService.appData.userData.companies) &&
            this.userService.appData.userData.companies.length
        ) {
            if (this.selectedCompany$.value) {
                this.selectedCompany$.next(
                    this.userService.appData.userData.companies.find(
                        (arrc) => arrc.companyId === this.selectedCompany$.value.companyId
                    )
                );
            } else {
                const selectedCompany$Settings =
                    this.storageService.sessionStorageGetterItem(
                        'selectedCompany$Settings'
                    );
                if (selectedCompany$Settings && selectedCompany$Settings !== 'null') {
                    this.selectedCompany$.next(
                        this.userService.appData.userData.companies.find(
                            (arrc) => arrc.companyId === JSON.parse(selectedCompany$Settings).companyId
                        )
                    );
                } else {
                    this.selectedCompany$.next(
                        this.userService.appData.userData.companySelect
                            ? this.userService.appData.userData.companySelect
                            : this.userService.appData.userData.companies[0]
                    );
                }
            }
        }
    }
}
