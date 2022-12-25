import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {delay, filter, map, switchMap, tap} from 'rxjs/operators';
import {TokenService, TokenStatus, TokenType} from '@app/core/token.service';
import {combineLatest, defer, EMPTY, Observable, of, Subscription, timer, zip} from 'rxjs';
import {takeWhileInclusive} from '../../../functions/takeWhileInclusive';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {AccountSelectComponent} from '../../account-select/account-select.component';
import {UserService} from '@app/core/user.service';
import {StorageService} from '@app/shared/services/storage.service';
import {publishRef} from '../../../functions/publishRef';

@Component({
    selector: 'app-token-create-dialog',
    templateUrl: './token-create-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TokenCreateDialogComponent implements OnDestroy, OnInit {
    public _display = false;
    @Input()
    get display(): boolean {
        return this._display && !this.hashAppTokenOtpModal;
    }

    set display(val: boolean) {
        this._display = val;
        this.displayChange.emit(this._display);
        // this.state = null;
        // this.account.reset();
        if (this.autoCloseSub && !this.autoCloseSub.closed) {
            this.autoCloseSub.unsubscribe();
        }
        if (!this._display) {
            this.creationSuccessClose.emit(true);
        }
    }

    public bankCredentialsOTP: any;

    @Input() title: string;

    @Output() displayChange = new EventEmitter<boolean>();

    @Input()
    settings: any;

    @Input()
    companyId: string;

    tokenTypes = TokenType;
    @Input()
    type: TokenType;
    @Input() is_station: any = false;
    @Input() accFromBank: any = [];
    public hashAppTokenOtpModal = false;

    get typeForTranslate() {
        switch (this.type) {
            case TokenType.ACCOUNT:
                return 'banks';
            case TokenType.CREDITCARD:
                return 'cards';
            case TokenType.SLIKA:
                return 'clearingAgencies';
            default:
                return null;
        }
    }

    processing: boolean;
    duplicateFound = false;

    @Output() creationSuccess = new EventEmitter<string>();
    @Output() creationFailure = new EventEmitter<any>();
    @Output() statusPollingFinished = new EventEmitter<any>();
    @Output() creationSuccessClose = new EventEmitter<any>();
    @Output() openCallService = new EventEmitter<any>();

    private createOrUpdateToken$: Observable<any>;
    private readonly MAX_POLLING_ATTEMPTS = 60;
    tokenStatusPoll$: Observable<any>;

    // private createdCredentialsCache: {[key: string]: string} = {};
    constructor(
        private tokenService: TokenService,
        private restCommonService: RestCommonService,
        public userService: UserService,
        private storageService: StorageService,
        private fb: FormBuilder
    ) {
        this.processing = false;
    }

    accounts$: Observable<any>;

    private accountNumberAutoFillSub: Subscription;
    lastUsedWebsiteTargetId: string;

    public TokenStatus = TokenStatus;
    private autoCloseSub: Subscription;

    innerRetryCount = 0;
    createdTokenId: string;
    newTokenSaved: string;

    ngOnInit() {
        this.resetPollingObs();

        this.resetForm();

        this.accounts$ = defer(() => {
            if (
                this.companyId &&
                [TokenType.CREDITCARD, TokenType.SLIKA].includes(this.type)
            ) {
                // debugger;
                return this.restCommonService.getAccounts(this.companyId).pipe(
                    map((responseAccs) =>
                        responseAccs && !responseAccs.error
                            ? responseAccs.body.accounts.filter(
                                (acc:any) =>
                                    acc.currency ===
                                    AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
                            )
                            : []
                    ),
                    tap((rslt) => {
                        if (rslt.length && TokenType.SLIKA === this.type) {
                            this.accountNumberAutoFillSub = accountNumberAutoFill$.subscribe(
                                ([accVal, solekVal]: any) => {
                                    // debugger;
                                    this.settings.get('userId').setValue(accVal.bankAccountId);
                                }
                            );
                        }
                    })
                );
            }
            if (
                this.is_station &&
                [TokenType.CREDITCARD, TokenType.SLIKA].includes(this.type)
            ) {
                return of(this.accFromBank);
            }

            return EMPTY;
        });

        const accountNumberAutoFill$ = defer(() => {
            return combineLatest(
         [
             this.settings.get('linkedAccount').valueChanges,
             this.settings.get('clearingAgency').valueChanges
         ]
            ).pipe(
                filter(
                    ([accVal, solekVal]: any) =>
                        solekVal === '82' && accVal && this.settings.contains('userId')
                )
            );
        });
    }

    ngOnDestroy() {
        if (this.accountNumberAutoFillSub) {
            this.accountNumberAutoFillSub.unsubscribe();
        }
        if (this.autoCloseSub) {
            this.autoCloseSub.unsubscribe();
        }
    }

    submitSettings(bankCredsResult: any) {
        this.lastUsedWebsiteTargetId = bankCredsResult['bankId'];
        // debugger;
        // const bankCredsResult = this.bankCredentialsComp.getResults();
        if (bankCredsResult === null || this.companyId === null) {
            return;
        }

        const request =
            this.companyId === ''
                ? Object.assign(
                    {
                        companyAccountId:
                            [TokenType.CREDITCARD, TokenType.SLIKA].includes(this.type) &&
                            this.settings.contains('linkedAccount')
                                ? this.settings.get('linkedAccount').value
                                    ? this.settings.get('linkedAccount').value.companyAccountId
                                    : null
                                : null
                    },
                    bankCredsResult
                )
                : Object.assign(
                    {
                        companyId: this.companyId,
                        companyAccountId:
                            [TokenType.CREDITCARD, TokenType.SLIKA].includes(this.type) &&
                            this.settings.contains('linkedAccount')
                                ? this.settings.get('linkedAccount').value
                                    ? this.settings.get('linkedAccount').value.companyAccountId
                                    : null
                                : null
                    },
                    bankCredsResult
                );

        if (this.is_station && !this.createdTokenId) {
            request.stationId = this.is_station;
            // request.tokenId = 'CA75CF8D-7CA3-762D-E053-0B6519AC6F99';
        }

        // let existingToken;
        // if ((existingToken = this.createdCredentialsCache[this.toCredentialsKey(bankCredsResult)])) {
        //     request['tokenId'] = existingToken;
        //     this.createOrUpdateToken$ = this.tokenService.tokenUpdate(request);
        // } else {
        //     this.createOrUpdateToken$ = this.tokenService.tokenCreate(request);
        // }

        this.createOrUpdateToken$ = this.createdTokenId
            ? this.tokenService.tokenUpdate(
                Object.assign(request, {
                    tokenId: this.createdTokenId
                })
            )
            : this.is_station
                ? this.tokenService.tokenStationCreate(request)
                : this.tokenService.tokenCreate(request);

        this.duplicateFound = false;
        this.processing = true;
        this.createOrUpdateToken$
            .pipe(tap(() => (this.processing = false)))
            .subscribe(
                {
                    next: (resp) => {
                        const newToken = resp.body || null;
                        if (newToken !== null) {
                            if (!this.is_station) {
                                this.creationSuccess.emit(
                                    this.createdTokenId || (this.createdTokenId = newToken)
                                );
                            } else {
                                if (
                                    this.settings.contains('bank') &&
                                    this.settings.get('bank').value === '122' &&
                                    this.is_station
                                ) {
                                    this.newTokenSaved = newToken;
                                    this.storageService.localStorageSetter(
                                        'cellPhone_otp',
                                        this.settings.get('cellPhone').value
                                    );
                                    this.tokenService
                                        .hashAppTokenWork({
                                            uuid: newToken
                                        })
                                        .subscribe(
                                            {
                                                next: (respWork) => {
                                                    this._display = false;
                                                    this.hashAppTokenOtpModal = true;
                                                },
                                                error: (error) => {
                                                    // this._display = false;
                                                    // this.hashAppTokenOtpModal = true;
                                                    this.processing = false;
                                                    this.creationFailure.emit(error);
                                                }
                                            }
                                        );
                                } else {
                                    this.creationSuccess.emit(
                                        this.createdTokenId || (this.createdTokenId = newToken)
                                    );

                                    // this.creationSuccessClose.emit(true);
                                }
                                // const mapsToken = this.accFromBank.map(tknStat => tknStat.token);
                                // this.tokenService.stationTokenGetStatus({
                                //     tokens: [newToken],
                                //     stationId: this.is_station
                                // })
                                //     .subscribe(() => {
                                //
                                //     });
                            }
                            // if (existingToken) {
                            //     this.creationSuccess.emit(existingToken);
                            // } else {
                            //     this.createdCredentialsCache[this.toCredentialsKey(bankCredsResult)] = newToken;
                            //     this.creationSuccess.emit(newToken);
                            // }
                        } else if (resp.error && resp.error.status === 409) {
                            this.duplicateFound = true;
                        }
                    },
                    error: (error) => {
                        this.processing = false;
                        this.creationFailure.emit(error);
                    }
                }
            );
    }

    resetPollingObs() {
        this.tokenStatusPoll$ = // zip(timer(300, 5000), this.creationSuccess)
            this.creationSuccess.pipe(
                switchMap((newToken) =>
                    timer(300, 5000).pipe(map((i) => [i, newToken]))
                ),
                // withLatestFrom(this.creationSuccess),
                switchMap(([i, newToken]: any[]) => {
                    return (
                        !this.is_station
                            ? this.tokenService.tokenGetStatus({
                                companyId: this.companyId,
                                tokens: [newToken]
                            })
                            : this.tokenService.stationTokenGetStatus({
                                tokens: [newToken],
                                stationId: this.is_station
                            })
                    ).pipe(
                        map((resp) => {
                            const tknStat = resp[0];
                            if (tknStat) {
                                console.log(' -----> try no.' + i);
                                // debugger;
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
                                    // } else if ([TokenStatus.LoginFailed].includes(respStatus)) { // REMOVE THIS !!!!!!!
                                    //     tknStat['uiStatus'] = 'SUCCESS';
                                } else {
                                    tknStat['uiStatus'] = 'UPDATE_AND_RETRY';
                                }
                            }
                            return tknStat;
                        }),
                        tap((tknStat) => {
                            this.innerRetryCount = tknStat.screenPasswordUpdateCount;

                            if (tknStat['uiStatus'] === 'SUCCESS') {
                                this.autoCloseSub = of(true)
                                    .pipe(delay(5000))
                                    .subscribe(() => {
                                        this.display = false;
                                    });

                                if (
                                    this.userService.appData.userData.companySelect.companyId ===
                                    this.companyId
                                ) {
                                    this.tokenService.trackOnDemand$.next({
                                        companyId: this.companyId,
                                        tokensToTrack: [tknStat.token]
                                    });
                                }
                            }
                        })
                    );
                }),
                takeWhileInclusive(
                    (tknStat) => tknStat && tknStat['uiStatus'] === 'WAITING'
                ),
                tap((tknStat) => this.statusPollingFinished.emit(tknStat)),
                publishRef
            );
    }

    resetForm() {
        // debugger;
        this.createdTokenId = null;
        if (!this.bankCredentialsOTP) {
            this.bankCredentialsOTP = this.fb.group({
                otpPassword: [
                    null,
                    [
                        Validators.compose([
                            Validators.required,
                            Validators.minLength(1),
                            Validators.pattern('\\d+')
                        ])
                    ]
                ]
            });
        } else {
            this.bankCredentialsOTP.get('otpPassword').patchValue(null);
        }
        if (this.settings) {
            if ([TokenType.CREDITCARD, TokenType.SLIKA].includes(this.type)) {
                this.settings.addControl(
                    'linkedAccount',
                    new FormControl(null, [Validators.required])
                );
            } else if (this.settings.contains('linkedAccount')) {
                this.settings.removeControl('linkedAccount');
            }
        }
    }

    // private toCredentialsKey(creds: {bankId: string, bankUserName: string}): string {
    //     return [creds.bankId, creds.bankUserName].join('___');
    // }
    hashAppTokenOtp(): void {
        combineLatest(
    [
        this.tokenService.downloadAppMessage({
            cellPhone: this.settings.get('cellPhone').value
            // 'linkAndroid': 'linkAndroid',
            // 'linkApple': 'linkApple'
        }),
        this.tokenService.hashAppTokenOtp({
            token: this.newTokenSaved,
            otpPassword: this.bankCredentialsOTP.get('otpPassword').value
        })
    ]
        ).subscribe(
            {
                next: (respWork) => {
                    this.creationSuccessClose.emit(this.settings.get('cellPhone').value);
                    this.hashAppTokenOtpModal = false;
                },
                error: (error) => {
                    this.creationSuccessClose.emit(true);
                    this.hashAppTokenOtpModal = false;
                }
            }
        );
    }

    retry(): void {
        Object.entries(this.settings.controls)
            .filter(([name, cntrl]) => /password/gi.test(name) || /id/gi.test(name))
            .forEach(([name, cntrl]: any) => cntrl.reset());
        this.resetPollingObs();
    }
}
