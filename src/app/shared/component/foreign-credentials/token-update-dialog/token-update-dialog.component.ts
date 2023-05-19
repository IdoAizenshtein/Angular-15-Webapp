import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChange,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {defer, EMPTY, Observable, of, Subject, timer} from 'rxjs';
import {map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {TokenCredentialsUpdateComponent} from '../token-credentials-update/token-credentials-update.component';
import {TokenService, TokenStatus, TokenStatusResponse, TokenType} from '@app/core/token.service';
import {takeWhileInclusive} from '../../../functions/takeWhileInclusive';
import {AccountSelectComponent} from '../../account-select/account-select.component';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {UserService} from '@app/core/user.service';
import {publishRef} from '../../../functions/publishRef';

@Component({
    selector: 'app-bank-update-foreign-credentials-dialog',
    templateUrl: './token-update-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TokenUpdateDialogComponent
    implements OnChanges, OnDestroy, OnInit {
    private _display = false;

    @Input()
    get display(): boolean {
        return this._display;
    }

    set display(val: boolean) {
        console.log('val---', val)
        this._display = val;
        this.state = null;
        this.account.reset();
        if (!this._display) {
            this.displayChange.emit(this._display);
        }
    }

    @Output() displayChange = new EventEmitter<any>();
    @Output() creationSuccess = new EventEmitter<any>();
    @Output() closeAndOpenOTP = new EventEmitter<any>();

    @Input()
    companyId: string;

    @Input() tokenData: TokenStatusResponse;

    @Input() pollAfterUpdate: boolean;

    readonly account: any;
    @ViewChild(TokenCredentialsUpdateComponent)
    creds: TokenCredentialsUpdateComponent;

    public DialogState = DialogState;
    public TokenStatus = TokenStatus;

    state: DialogState | null = null;
    tokenStatus$: Observable<any>;
    private stopPollingTokenStatus = new Subject();
    private readonly MAX_POLLING_ATTEMPTS = 60;

    targetType: TokenType | null | any;
    targetTypeDesc: any;
    duplicateFound = false;
    public hashAppTokenOtpModal = false;
    public hashAppTokenOtpModalError = false;
    public stopRunning = false;

    public bankCredentialsOTP: any;

    public progressCode = false;
    public bankCredentialsOTPError = false;

    accounts$: Observable<any>;
    @Input() accFromBank: any = [];
    @Input() is_station: any = false;

    constructor(
        public translate: TranslateService,
        private fb: FormBuilder,
        private tokenService: TokenService,
        private restCommonService: RestCommonService,
        public userService: UserService
    ) {
        this.account = this.fb.group({});
        this.pollAfterUpdate = true;

        this.accounts$ = defer(() => {
            if (
                !this.is_station &&
                this.companyId &&
                [TokenType.CREDITCARD, TokenType.SLIKA].includes(this.targetType)
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
                    shareReplay(1)
                );
            }
            if (
                this.is_station &&
                [TokenType.CREDITCARD, TokenType.SLIKA].includes(this.targetType)
            ) {
                return of(this.accFromBank);
            }
            return EMPTY;
        });
    }

    ngOnInit() {
        this.progressCode = false;
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

        // if (this.tokenData['poalimBeasakim']) {
        //     this.duplicateFound = false;
        //     this.state = DialogState.UPDATE_SUCCEEDED;
        //     this.startTokenStatusPolling();
        // }
    }

    hashAppTokenOtp(): void {
        this.hashAppTokenOtpModalError = false;
        this.bankCredentialsOTPError = false;
        this.progressCode = true;
        this.tokenService
            .hashAppTokenWork({
                uuid: this.tokenData.token
            })
            .subscribe(
                () => {
                }
            );
        this.tokenService
            .hashAppTokenOtp({
                token: this.tokenData.token,
                otpPassword: this.bankCredentialsOTP.get('otpPassword').value
            })
            .subscribe(
                {
                    next: () => {
                        this.stopRunning = false;
                        this.startTokenStatusPolling();
                        // this.creationSuccessClose.emit(this.settings.get('cellPhone').value);
                        // this.hashAppTokenOtpModal = false;
                    },
                    error: (error) => {
                        this.bankCredentialsOTPError = true;
                        this.progressCode = false;
                        this.stopRunning = true;
                        // this.creationSuccessClose.emit(true);
                        // this.hashAppTokenOtpModal = false;
                    }
                }
            );
    }
    mixPanelEvent(eventName: string, params?: any) {
        if (window['mixpanel']) {
            if (!params) {
                window['mixpanel'].track(eventName);
            } else {
                window['mixpanel'].track(eventName, params);
            }
        }
    }
    submitTokenUpdate(): void {
        // const cntrlNames = Object.keys(this.account.controls);
        const request = Object.assign(
            {
                bankId: this.tokenData.websiteTargetTypeId,
                companyId: this.companyId,
                tokenId: this.tokenData.token // ,
                // 'bankUserName': this.account.controls['username'] ? this.account.controls['username'].value : null,
                // 'bankPass': this.account.controls[cntrlNames.find(nme => nme.includes('userPassword'))].value,
                // 'bankAuto': this.account.controls['userCode'] ? this.account.controls['userCode'].value : null
            },
            this.creds.getResults()
        );

        this.state = DialogState.UPDATING;
        this.duplicateFound = false;
        this.tokenService.tokenUpdate(request).subscribe(
            {
                next: (resp) => {
                    this.duplicateFound = resp.error && resp.error.status === 409;
                    this.state = !resp.error
                        ? DialogState.UPDATE_SUCCEEDED
                        : this.duplicateFound
                            ? DialogState.UPDATE_FAILED
                            : null;
                    if (this.state === DialogState.UPDATE_SUCCEEDED) {
                        this.mixPanelEvent('update information');
                        if (this.pollAfterUpdate) {
                            this.startTokenStatusPolling();
                        } else {
                            this.tokenData.tokenStatus = TokenStatus[TokenStatus.InProgress];
                            this.display = false;
                        }
                    }
                    if (
                        this.is_station &&
                        [TokenType.CREDITCARD].includes(this.targetType)
                    ) {
                        this.tokenService
                            .updateCreditAccount({
                                companyAccountId:
                                this.account.get('linkedAccount').value.companyAccountId,
                                creditCardId: this.account.get('linkedAccount').value.accountId //this.tokenData.token
                            })
                            .subscribe(() => {
                            });
                    }
                },
                error: (error) => {
                    console.error(
                        'Token update (%o) for account %o failed.',
                        request,
                        this.tokenData,
                        error
                    );
                    this.state = DialogState.UPDATE_FAILED;
                }
            }
        );
    }

    ngOnDestroy(): void {
        this.stopPollingTokenStatus.unsubscribe();
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes['tokenData'] && changes['tokenData'].currentValue) {
            const targetTypeId = (
                changes['tokenData'].currentValue as TokenStatusResponse
            ).websiteTargetTypeId;
            this.targetType = this.tokenService.tokenTypeByTargetId(targetTypeId);
            switch (this.targetType) {
                case TokenType.ACCOUNT: {
                    this.targetTypeDesc = 'banks';
                    break;
                }
                case TokenType.CREDITCARD: {
                    this.targetTypeDesc = 'cards';
                    break;
                }
                case TokenType.SLIKA: {
                    this.targetTypeDesc = 'clearingAgencies';
                    break;
                }
                default: {
                    this.targetTypeDesc = null;
                    break;
                }
            }

            if (this.account) {
                if ([TokenType.CREDITCARD, TokenType.SLIKA].includes(this.targetType)) {
                    this.account.addControl('linkedAccount', new FormControl(''));
                    // , [Validators.required]));

                    if (this.targetType === TokenType.SLIKA) {
                        this.account.controls['linkedAccount'].disable();
                    }

                    if (
                        (changes['tokenData'].currentValue as TokenStatusResponse).setDefAcc
                    ) {
                        this.accounts$.subscribe((response: any) => {
                            this.account.patchValue({
                                linkedAccount: response.find(
                                    (acc:any) => acc.companyAccountId === this.tokenData.setDefAcc
                                )
                            });
                        });
                    } else if (
                        (changes['tokenData'].currentValue as TokenStatusResponse)
                            .companyAccountId
                    ) {
                        this.accounts$.subscribe((response: any) => {
                            this.account.patchValue({
                                linkedAccount: response.find(
                                    (acc:any) =>
                                        acc.companyAccountId === this.tokenData.companyAccountId
                                )
                            });
                        });
                    }
                } else if (this.account.contains('linkedAccount')) {
                    this.account.removeControl('linkedAccount');
                }
            }
        }
    }

    aaaa(daaa: any) {
        debugger;
    }

    startTokenStatusPolling(): void {
        // this.tokenStatus$ = timer((this.tokenData['poalimBeasakim'] ? 0 : 3000), 5000)
        this.tokenStatus$ = timer(3000, 5000).pipe(
            switchMap((i) => {
                return (
                    !this.is_station
                        ? this.tokenService.tokenGetStatus({
                            companyId: this.companyId,
                            tokens: [this.tokenData.token]
                        })
                        : this.tokenService.stationTokenGetStatus({
                            tokens: [this.tokenData.token],
                            stationId: this.is_station
                        })
                ).pipe(
                    map((resp) => {
                        let tknStat = resp[0];
                        if (tknStat) {
                            const respStatus = this.tokenService.toTokenStatusEnumValue(
                                tknStat.tokenStatus
                            );
                            if (this.hashAppTokenOtpModal) {
                                if (
                                    tknStat.errorDesc &&
                                    (tknStat.errorDesc === 'WRONG OTP CODE1' ||
                                        tknStat.errorDesc === 'WRONG OTP CODE2')
                                ) {
                                    this.hashAppTokenOtpModalError = true;
                                    this.progressCode = false;
                                    this.stopRunning = true;
                                } else {
                                    if (
                                        [
                                            TokenStatus.BankTransLoad,
                                            TokenStatus.CreditCardLoad,
                                            TokenStatus.ChecksLoad,
                                            TokenStatus.DepositLoad,
                                            TokenStatus.LoanLoad,
                                            TokenStatus.StandingOrdersLoad,
                                            TokenStatus.ForeignTransLoad
                                        ].includes(respStatus)
                                    ) {
                                        this.hashAppTokenOtpModal = false;
                                        this.progressCode = false;
                                        this.hashAppTokenOtpModalError = false;
                                        this.bankCredentialsOTPError = false;
                                        this.stopRunning = false;
                                    }
                                }
                            }
                            if (
                                this.is_station &&
                                respStatus &&
                                (respStatus === TokenStatus.OTP_WAS_NOT_PROVIDED ||
                                    respStatus === TokenStatus.OPT_CODE_INSERT) &&
                                !this.hashAppTokenOtpModal
                            ) {
                                // this.hashAppTokenOtpModal = true;
                                this.stopRunning = true;
                                this.closeAndOpenOTP.emit();
                                this.display = false;
                                tknStat = null;
                                return tknStat;
                            }
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
                                ].includes(respStatus)
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
                            } else if (
                                [
                                    TokenStatus.BankTransLoad,
                                    TokenStatus.CreditCardLoad,
                                    TokenStatus.ChecksLoad,
                                    TokenStatus.DepositLoad,
                                    TokenStatus.LoanLoad,
                                    TokenStatus.StandingOrdersLoad,
                                    TokenStatus.ForeignTransLoad,
                                    TokenStatus.ALMOST_DONE
                                ].includes(respStatus)
                            ) {
                                tknStat['uiStatus'] = 'LOAD_DATA';
                            } else {
                                tknStat['uiStatus'] = 'UPDATE_AND_RETRY';
                            }
                        }
                        return tknStat;
                    })
                );
            }),
            tap((tknStat: any) => {
                if (!tknStat) {
                    return;
                }

                if (!this.is_station) {
                    if (
                        tknStat['uiStatus'] === 'SUCCESS' &&
                        this.userService.appData.userData.companySelect.companyId ===
                        this.companyId
                    ) {
                        this.tokenService.trackOnDemand$.next({
                            companyId: this.companyId,
                            tokensToTrack: [tknStat.token]
                        });
                    }
                }

                if (tknStat['uiStatus'] !== 'WAITING') {
                    this.tokenData.tokenStatus = tknStat.tokenStatus;
                    this.tokenData.screenPasswordUpdateCount =
                        tknStat.screenPasswordUpdateCount;
                }
            }),
            takeWhileInclusive(
                (tknStat) =>
                    tknStat &&
                    (tknStat['uiStatus'] === 'WAITING' ||
                        tknStat['uiStatus'] === 'LOAD_DATA') &&
                    !this.stopRunning
            ),
            publishRef
        );
    }
}

export enum DialogState {
    UPDATING,
    UPDATE_SUCCEEDED,
    UPDATE_FAILED
}
