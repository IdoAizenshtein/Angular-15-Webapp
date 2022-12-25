import {AfterViewInit, Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {SignupService} from '@app/signup/signup.service';
import {ActivatedRoute, Router} from '@angular/router';
import {filter, map, switchMap} from 'rxjs/operators';
import {Observable, Subscription, timer} from 'rxjs';
import {TokenService, TokenStatus} from '@app/core/token.service';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';
import {takeWhileInclusive} from '@app/shared/functions/takeWhileInclusive';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';
import {AuthService} from '@app/login/auth.service';
import {BehaviorSubject} from 'rxjs/internal/BehaviorSubject';
import {AnalyticsService} from '@app/core/analytics.service';
import {BreakpointObserver} from '@angular/cdk/layout';
import {StorageService} from '@app/shared/services/storage.service';
import {publishRef} from '@app/shared/functions/publishRef';
import {UserService} from "@app/core/user.service";

@Component({
    providers: [
        Location,
        {provide: LocationStrategy, useClass: PathLocationStrategy}
    ],
    templateUrl: './signup.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SignupComponent implements OnInit, OnDestroy, AfterViewInit {
    // currentStep: FormGroup;
    currentStepName: string | any;
    currentStepIdx: number | null | any = null;
    public showPopUpPreSighUp: boolean = true;

    readonly banks: any[];

    personal: any;
    business: any;
    account: any;
    tokenTrack: any;

    // passwordHide = true;
    // isCapsLock = null;
    // isHebrew = false;
    // formInProgress = false;
    hoveredReferent: any = null;
    private referentsAutoHoverSub: Subscription = null;
    pauseHoveringAutomation = false;

    // @ViewChild(BankCredentialsComponent) bankCredentialsComp: BankCredentialsComponent;

    createdCompanyId: string = null;
    // banksCredentialSettings: any[] = null;
    tokenId: string | null = null;
    tokenStatus: Observable<any>;
    // private stopPollingTokenStatus = new Subject();
    private readonly MAX_POLLING_ATTEMPTS = 60;
    // isValidCellPart: boolean | null = null;
    public lite: boolean = false;
    // readonly isMobile = BrowserService.isMobile();

    readonly formInProgress$: BehaviorSubject<boolean> = new BehaviorSubject(
        false
    );
    agreementId: string;
    private paramsSub: Subscription;

    constructor(
        public translate: TranslateService,
        public userService: UserService,
        private fb: FormBuilder,
        // private bankForeignCreds: BankForeignCredentialsService,
        private signupService: SignupService,
        private tokenService: TokenService,
        private route: ActivatedRoute,
        private router: Router,
        private location: Location,
        public authService: AuthService,
        private analyticsService: AnalyticsService,
        public storageService: StorageService,
        private breakpointObserver: BreakpointObserver
    ) {
        // const queryParams: string = this.route.snapshot.queryParams['biziboxType'];
        // if (queryParams) {
        //     if (queryParams === 'regular') {
        //         this.lite = true;
        //     } else {
        //         this.lite = false;
        //     }
        // }
        breakpointObserver
            .observe([
                '(max-height: 680px) and (orientation: landscape)'
                // Breakpoints.TabletLandscape,
                // Breakpoints.HandsetLandscape
            ])
            .subscribe((result) => {
                console.log('result---', result);
                const elem = document.getElementsByClassName('Signup__card');
                if (elem.length) {
                    if (result.matches) {
                        const elemImg = document
                            .getElementsByClassName('Signup__card-header')[0]
                            .getElementsByTagName('img');
                        elemImg[0]['style']['height'] = '8vh';
                        if (elemImg.length === 2) {
                            elemImg[1]['style']['height'] = '8vh';
                        }
                        elem[0]['style'].webkitTransform = 'scale(0.8)';
                        elem[0]['style'].msTransform = 'scale(0.8)';
                        elem[0]['style'].transform = 'scale(0.8)';
                        elem[0]['style']['transform-origin'] = 'center top';
                        elem[0]['style']['padding-top'] = '4vh';
                    } else {
                        elem[0]['style'].webkitTransform = 'scale(1)';
                        elem[0]['style'].msTransform = 'scale(1)';
                        elem[0]['style'].transform = 'scale(1)';
                    }
                }
            });
    }

    ngOnDestroy(): void {
        if (this.paramsSub) {
            this.paramsSub.unsubscribe();
        }

        // this.stopPollingTokenStatus.next();
        // this.stopPollingTokenStatus.complete();

        if (this.referentsAutoHoverSub !== null) {
            this.referentsAutoHoverSub.unsubscribe();
        }
    }

    ngOnInit(): void {
        // [this.personal, this.business, this.account, this.tokenTrack] = [this.createForm(Steps.PERSONAL_DATA),
        //     this.createForm(Steps.BUSINESS_DATA),
        //     this.createForm(Steps.ADD_ACCOUNT_OR_START_DEMO),
        //     this.createForm(Steps.TRACK_TOKEN_STATUS)];

        // this.bankForeignCreds.banksSettingsAtSignup()
        //     .subscribe(rslt => {
        //         this.banksCredentialSettings = rslt;
        //     });

        // this.currentStep = this.personal;

        this.lite = this.route.snapshot.queryParams['biziboxType'] === 'regular';
        // const queryParams: string = this.route.snapshot.queryParams['biziboxType'];
        // if (queryParams || this.storageService.sessionStorageGetterItem('lite')) {
        //     if (queryParams === 'regular' || this.storageService.sessionStorageGetterItem('lite')) {
        //         this.storageService.sessionStorageSetter('lite', 'true');
        //         this.lite = true;
        //     } else {
        //         this.lite = false;
        //     }
        // }

        this.agreementId = this.route.snapshot.queryParams['agreementId'];

        // isracard
        // @ts-ignore
        if (this.agreementId === '11') {
        }
        // @ts-ignore
        if (
            this.agreementId === '11' ||
            this.route.snapshot.queryParams['biziboxType']
        ) {
            this.showPopUpPreSighUp = false;
        }
        // this.paramsSub = this.route.paramMap
        //     .subscribe((params) => {
        //         this.agreementId = params.get('agreementId');
        //         debugger
        //     });

        setTimeout(() => {
            this.router.navigate(['.'], {relativeTo: this.route});
        }, 100);
    }

    ngAfterViewInit(): void {
        this.referentsAutoHoverSub = timer(100, 10000)
            .pipe(
                filter(() => !this.pauseHoveringAutomation),
                switchMap(() =>
                    this.translate.get(
                        this.lite ? 'signup.referentsLight' : 'signup.referents'
                    )
                )
            )
            .subscribe((val) => {
                let idx = val.indexOf(this.hoveredReferent) + 1;
                if (val.length === idx) {
                    idx = 0;
                }
                this.hoveredReferent = val[idx];
            });
    }

    createForm(step: Steps): FormGroup {
        switch (step) {
            case Steps.PERSONAL_DATA:
                return (
                    this.personal ||
                    (this.personal = this.fb.group(
                        {
                            firstName: ['', [Validators.required, Validators.maxLength(30)]],
                            lastName: ['', [Validators.required, Validators.maxLength(30)]],
                            mail: new FormControl('', {
                                validators: [Validators.required, Validators.email],
                                asyncValidators: this.emailNotExistsValidator.bind(this),
                                updateOn: 'blur'
                            }),
                            // mail: ['',
                            //   Validators.compose([Validators.required, Validators.email]),
                            //   this.emailNotExistsValidator.bind(this),
                            //   {updateOn: 'blur'}],
                            cell: [
                                '',
                                Validators.compose([
                                    Validators.required,
                                    Validators.minLength(10),
                                    Validators.maxLength(11),
                                    ValidatorsFactory.cellNumberValidatorIL
                                ])
                            ],
                            password: [
                                '',
                                Validators.compose([
                                    Validators.required,
                                    Validators.minLength(8),
                                    Validators.maxLength(12),
                                    ValidatorsFactory.passwordValidatorBizibox
                                ])
                            ],
                            agreementConfirm: ['', Validators.requiredTrue],
                            marketingMessagesAgreed: [true]
                        },
                        {
                            validators: ValidatorsFactory.fieldValuesAreDifferentValidator([
                                'mail',
                                'password'
                            ])
                        }
                    ))
                );
            case Steps.BUSINESS_DATA:
                return (
                    this.business ||
                    (this.business = this.fb.group({
                        name: ['', [Validators.required, Validators.maxLength(40)]],
                        id: [
                            '',
                            Validators.compose([
                                Validators.required,
                                Validators.minLength(9),
                                Validators.maxLength(9),
                                Validators.pattern('\\d+'),
                                ValidatorsFactory.idValidatorIL
                            ]),
                            [this.businessIdNotExistsValidator.bind(this)]
                        ],
                        profile: ['', [Validators.maxLength(30)]]
                    }))
                );
            case Steps.ADD_ACCOUNT_OR_START_DEMO:
                return this.account || (this.account = this.fb.group({}));
            case Steps.TRACK_TOKEN_STATUS:
                return this.tokenTrack || (this.tokenTrack = this.fb.group({}));
            default:
                return null;
        }
    }

    private emailNotExistsValidator(fc: AbstractControl) {
        const group: any = fc instanceof FormGroup ? fc : fc.parent;
        const req = {
            firstName: group.get('firstName').value,
            lastName: group.get('lastName').value,
            phoneNumber: group.get('cell').value,
            username: fc.value,
            hesderId: this.agreementId
        };
        return timer(500).pipe(
            switchMap(() => this.signupService.isEmailExists(req)),
            map((resp) => {
                return resp.body && resp.body.exists === false
                    ? null
                    : {
                        emailExists: true
                    };
            })
        );
    }

    private businessIdNotExistsValidator(g: FormControl) {
        const req = {
            companyHp: g.value,
            username: this.personal.get('mail').value
        };
        return this.signupService.isBusinessIdExists(req).pipe(
            map((resp) => {
                return resp.body && resp.body.exists === false
                    ? null
                    : {
                        idExists: true
                    };
            })
        );
    }

    // handleKeyPress(e) {
    //     const str = String.fromCharCode(e.which);
    //     if (!str) {
    //         return;
    //     }
    //     this.isHebrew = str.search(/[\u0590-\u05FF]/) >= 0;
    //     this.isCapsLock = (():any => {
    //         const charCode = e.which || e.keyCode;
    //         let isShift = false;
    //         if (e.shiftKey) {
    //             isShift = e.shiftKey;
    //         } else if (e.modifiers) {
    //             isShift = !!(e.modifiers & 4);
    //         }
    //
    //         if (charCode >= 97 && charCode <= 122 && isShift) {
    //             return true;
    //         }
    //         if (charCode >= 65 && charCode <= 90 && !isShift) {
    //             return true;
    //         }
    //
    //         this.isValidCellPart = e.target.id === 'cell' ? /^[\d-]$/.test(str) : null;
    //         console.log('e.target = %o, e.target.id = %o => %o return %o',
    //                         e.target, e.target.id, e.target.id === 'cell', this.isValidCellPart);
    //         if ((this.isValidCellPart === false) || this.isHebrew) {
    //             e.preventDefault();
    //             e.stopPropagation();
    //         }
    //     })();
    // }
    //
    // handleKeyDown(e) {
    //     if (e.which === 20 && this.isCapsLock !== null) {
    //         this.isCapsLock = !this.isCapsLock;
    //     }
    // }

    // onBack(group: FormGroup) {
    //     if (group === this.business) {
    //         this.currentStep = this.personal;
    //         // } else if (group === this.account) {
    //         //   this.currentStep = this.business;
    //     }
    // }
    //
    // onSubmit(group: FormGroup) {
    //     console.log('valid: %o, value: %o', group.valid, group.value);
    //
    //     if (group === this.personal) {
    //         this.currentStep = this.business;
    //         const req = {
    //             firstName: this.personal.get('firstName').value,
    //             lastName: this.personal.get('lastName').value,
    //             phoneNumber: this.personal.get('cell').value,
    //             username: this.personal.get('mail').value,
    //             hesderId: this.route.snapshot.params['aggreementId'] || null
    //         };
    //         this.signupService.updateLeadInfo(req).subscribe(() => {
    //         });
    //
    //     } else if (group === this.business) {
    //         const req = {
    //             companyInfo: {
    //                 businessCategory: this.business.get('profile').value,
    //                 companyHp: this.business.get('id').value,
    //                 companyName: this.business.get('name').value,
    //                 hesderId: this.route.snapshot.params['aggreementId'] || null
    //             },
    //             userInfo: {
    //                 firstName: this.personal.get('firstName').value,
    //                 lastName: this.personal.get('lastName').value,
    //                 cellPhone: this.personal.get('cell').value,
    //                 username: this.personal.get('mail').value,
    //                 password: this.personal.get('password').value,
    //             }
    //         };
    //
    //         this.formInProgress = true;
    //         this.signupService.signupCreate(req)
    //             .subscribe(() => {
    //                 this.formInProgress = false;
    //                 this.currentStep = this.account;
    //
    //                 this.signupService.getCompanies()
    //                     .subscribe(companyResult => {
    //                         this.createdCompanyId = Array.isArray(companyResult.body) && companyResult.body.length > 0
    //                             ? companyResult.body[0].companyId : null;
    //                     }, (error) => {
    //                         console.error('Default company fetch for created user failed.', error);
    //                     });
    //             }, () => {
    //                 this.formInProgress = false;
    //             });
    //     } else if (group === this.account) {
    //
    //         const bankCredsResult = this.bankCredentialsComp.getResults();
    //         if (bankCredsResult === null) {
    //             this.reloadSelf();
    //             return;
    //         }
    //
    //         const createOrUpdateTokenObs = !this.tokenId
    //             ? this.tokenService.tokenCreate(Object.assign({
    //                 'companyId': this.createdCompanyId
    //             }, bankCredsResult))
    //             : this.tokenService.tokenUpdate(Object.assign({
    //                 'companyId': this.createdCompanyId,
    //                 'tokenId': this.tokenId
    //             }, bankCredsResult));
    //
    //         this.formInProgress = true;
    //         createOrUpdateTokenObs.subscribe((resp) => {
    //             this.formInProgress = false;
    //             this.tokenId = this.tokenId || resp.body || null;
    //             if (this.tokenId) {
    //                 this.startTokenStatusPolling();
    //             }
    //             this.currentStep = this.tokenTrack;
    //         }, (error) => {
    //             console.error('Default company fetch for created user failed.', error);
    //             this.tokenId = null;
    //             this.formInProgress = false;
    //         });
    //
    //     } else if (group === this.tokenTrack) {
    //         this.reloadSelf();
    //     }
    // }

    startTokenStatusPolling(): void {
        this.tokenStatus = timer(3000, 5000).pipe(
            switchMap((i) => {
                return this.tokenService
                    .tokenGetStatus({
                        companyId: this.createdCompanyId,
                        tokens: [this.tokenId]
                    })
                    .pipe(
                        map((resp) => {
                            const tknStat = resp[0];
                            if (tknStat) {
                                const respStatus = this.tokenService.toTokenStatusEnumValue(
                                    tknStat.tokenStatus
                                );
                                if (
                                    respStatus === null ||
                                    [TokenStatus.New, TokenStatus.InProgress].includes(respStatus)
                                ) {
                                    tknStat['uiStatus'] =
                                        i < this.MAX_POLLING_ATTEMPTS ? 'WAITING' : 'TIMED_OUT';
                                } else if (
                                    [
                                        TokenStatus.Valid,
                                        TokenStatus.VALIDPOALIMBAASAKIM,
                                        TokenStatus.AboutToExpire
                                    ].includes(respStatus) ||
                                    this.tokenService.isTokenStatusProgressing(respStatus)
                                ) {
                                    tknStat['uiStatus'] = 'SUCCESS';
                                } else if (
                                    [
                                        TokenStatus.TechnicalProblem,
                                        TokenStatus.INVALIDPASSORDANDACCESS
                                    ].includes(respStatus)
                                ) {
                                    tknStat['uiStatus'] = 'FAILURE';
                                } else {
                                    tknStat['uiStatus'] = 'UPDATE_AND_RETRY';
                                }
                            }
                            return tknStat;
                        })
                    );
            }),
            takeWhileInclusive(
                (tknStat) => tknStat && tknStat['uiStatus'] === 'WAITING'
            ),
            publishRef
        );

        // this.tokenStatus = timer(3000, 5000)
        //   .pipe(
        //     switchMap((i) => {
        //       return i < this.MAX_POLLING_ATTEMPTS
        //         ? this.tokenService.tokenGetStatus({ companyId: this.createdCompanyId, tokens: [this.tokenId] })
        //         // ? of({
        //         //   body: {
        //         //     'extractdate': Date.now(),
        //         //     'runCount': Date.now(),
        //         //     'tokenStatus': 'NEW',
        //         //     'wrngPswrdTrialCount': 0
        //         //   }
        //         // })
        //         : of([{
        //             'uiStatus': 'TIMED_OUT'
        //           }]);
        //     }),
        //     map(resp => {
        //       const tknStat = resp[0];
        //       if (tknStat && tknStat.tokenStatus && !tknStat['uiStatus']) {
        //         const respStatus = tknStat.tokenStatus ? tknStat.tokenStatus.toUpperCase() : null;
        //         if (respStatus === 'VALID' || respStatus.endsWith('LOAD')) {
        //           tknStat['uiStatus'] = 'SUCCESS';
        //         } else if (!respStatus || respStatus === 'TECHNICALPROBLEM') {
        //           tknStat['uiStatus'] = 'FAILURE';
        //         } else if (tknStat.tokenStatus === 'NEW' || tknStat.tokenStatus === 'INPROGRESS') {
        //           tknStat['uiStatus'] = 'WAITING';
        //         } else {
        //           tknStat['uiStatus'] = 'UPDATE_AND_RETRY';
        //         }
        //       }
        //       return tknStat;
        //     }),
        //     tap(tknStat => {
        //       if (tknStat && tknStat['uiStatus'] !== 'WAITING') {
        //         setTimeout(() => {
        //           this.stopPollingTokenStatus.next();
        //         });
        //       }
        //     }),
        //     takeUntil(this.stopPollingTokenStatus),
        //     share()
        //   );
    }

    onSkipToDemoCompanyClick(): void {
        this.analyticsService.notifyOnSignupSuccess();
        this.signupService.skipToDemoCompany().subscribe(() => {
            this.reloadSelf();
        });
    }

    reloadSelf() {
        window.open(this.location.prepareExternalUrl('/'), '_self');
        // this.router.navigateByUrl('/');
        // this.router.navigate(['/'], {
        //     relativeTo: this.route
        // });
    }

    stepChangedTo($event: any) {
        console.log(
            'step changed to %o at %o',
            this.route.firstChild.routeConfig.path,
            this.route.routeConfig.children
                .map((ch) => ch.path)
                .indexOf(this.route.firstChild.routeConfig.path)
        );
        // $event);
        this.currentStepName = this.route.firstChild.routeConfig.path;
        this.currentStepIdx = this.route.routeConfig.children
            .map((ch) => ch.path)
            .indexOf(this.currentStepName);
    }

    onSkipToDemoCompanyMove(): void {
        this.signupService.skipToDemoCompany().subscribe(() => {
            this.reloadSelf();
        });
    }
}

enum Steps {
    PERSONAL_DATA,
    BUSINESS_DATA,
    ADD_ACCOUNT_OR_START_DEMO,
    TRACK_TOKEN_STATUS
}
