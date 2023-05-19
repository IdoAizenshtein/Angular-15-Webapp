import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TokenService, TokenStatusResponse} from '@app/core/token.service';
import {catchError, finalize, switchMap, tap} from 'rxjs/operators';
import {timer} from 'rxjs/internal/observable/timer';
import {takeWhileInclusive} from '../../../functions/takeWhileInclusive';
import {of} from 'rxjs/internal/observable/of';
import {Observable} from 'rxjs/internal/Observable';
import {defer} from 'rxjs/internal/observable/defer';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-hash-otp-update-dialog',
    templateUrl: './hash-otp-update-dialog.component.html',
    styleUrls: ['./hash-otp-update-dialog.component.css']
})
export class HashOtpUpdateDialogComponent implements OnInit {
    private _display = false;

    @Input()
    get display(): boolean {
        return this._display;
    }

    set display(val: boolean) {
        this._display = val;
        if (val) {
            this.setStep(OtpUpdateDialogStep.PROMPT);
        }
        this.displayChange.emit(this._display);
        if (!this._display) {
            this.creationSuccess.emit('true');
        }
    }

    @Output() displayChange = new EventEmitter<boolean>();
    @Output() creationSuccess = new EventEmitter<string>();

    @Input() tokenData: TokenStatusResponse;
    @Input() companyId: string;
    @Input() stationId: string;

    public step: OtpUpdateDialogStep;
    public OtpUpdateDialogStep = OtpUpdateDialogStep;

    awaitConnection$: any;
    otpForm: any;
    tokenLastPollResult: TokenStatusResponse;
    otpCodeApply$: Observable<any>;
    monitoring$: Observable<Array<TokenStatusResponse>>;

    constructor(private tokenService: TokenService, public userService: UserService) {
    }

    ngOnInit() {
        if (
            [
                'NOT_UP_TO_DATE',
                'WRONG_OTP_CODE',
                'TECHNICALPROBLEM',
                'UP_TO_DATE'
            ].includes(this.tokenData.tokenStatus)
        ) {
            this.step = OtpUpdateDialogStep.PROMPT;
            this.createAwaitConnectionObs();
        } else {
            this.step = OtpUpdateDialogStep.CODE_PROMPT;
            this.createAwaitConnectionObs();
        }

        this.otpForm = new FormGroup({
            code: new FormControl('', [Validators.required]),
            pending: new FormControl(false)
        });
    }

    setStep(newStep: OtpUpdateDialogStep) {
        this.step = newStep;
    }

    // noinspection JSMethodCanBeStatic
    private fetchTokenStatusResponseFrom(
        response: any
    ): TokenStatusResponse | null {
        if (Array.isArray(response) && response.length > 0) {
            return response[0];
        } else if (
            !response.error &&
            Array.isArray(response.body) &&
            response.body.length > 0
        ) {
            return response.body[0];
        } else if (!!response && !!response.token) {
            return response;
        }

        return null;
    }

    private storeLastPollResultFrom(response: any): TokenStatusResponse | null {
        this.tokenLastPollResult = this.fetchTokenStatusResponseFrom(response);
        return this.tokenLastPollResult;
    }

    createAwaitConnectionObs() {
        // this.setStep(OtpUpdateDialogStep.CODE_PROMPT);

        let status;
        this.awaitConnection$ = defer(() =>
            this.tokenService.hashAppTokenWork({uuid: this.tokenData.token}).pipe(
                tap(() => {
                    this.setStep(OtpUpdateDialogStep.CODE_PROMPT);
                }),
                switchMap(() => timer(5000, 5000)
                    .pipe(
                        switchMap(() => this.tokenService.stationTokenGetStatus({
                                companyId: this.companyId, stationId: this.stationId, tokens: [this.tokenData.token]
                            })
                        ),
                        tap((response: any) => {
                            status = this.fetchTokenStatusResponseFrom(response);
                            console.log('status.tokenStatus, ', status.tokenStatus)
                        }),
                        takeWhileInclusive(() => this.display
                            && !(status.tokenStatus === 'VALIDPOALIMBAASAKIM'
                                ||
                                status.tokenStatus === 'UP_TO_DATE'
                                ||
                                status.tokenStatus === 'VALID'
                                ||
                                status.tokenStatus === 'INVALIDPASSWORD'
                                ||
                                status.tokenStatus === 'WRONG_PASS'
                                ||
                                status.tokenStatus === 'PASSWORDEXPIRED'
                            )),
                        finalize(() => {
                            if (status.tokenStatus === 'INVALIDPASSWORD'
                                ||
                                status.tokenStatus === 'WRONG_PASS'
                                ||
                                status.tokenStatus === 'PASSWORDEXPIRED') {
                                this.display = false;
                            }
                        })
                    )
                ),
                catchError(() => of(null))
            )
        );
    }

    submitOtpCode() {
        if (this.otpForm.invalid || !!this.otpForm.value.pending) {
            return;
        }
        this.otpForm.patchValue({pending: true});
        this.otpForm.get('code').disable();

        this.otpCodeApply$ = this.tokenService
            .hashAppTokenOtp({
                token: this.tokenData.token,
                otpPassword: this.otpForm.get('code').value
            })
            .pipe(
                switchMap(() => timer(5000, 5000)
                    .pipe(
                        switchMap(() =>
                            this.tokenService.stationTokenGetStatus({
                                companyId: this.companyId,
                                stationId: this.stationId,
                                tokens: [this.tokenData.token]
                            })
                        ),
                        takeWhileInclusive((response: any) => {
                            const currentStatus = this.tokenLastPollResult
                                ? this.tokenLastPollResult.tokenStatus
                                : '';
                            if (currentStatus === 'WRONG_OTP_CODE') {
                                this.otpForm.get('code').disable();
                            }
                            return (
                                this.display &&
                                !!this.storeLastPollResultFrom(response) &&
                                (this.tokenLastPollResult.tokenStatus === 'WRONG_OTP_CODE' ||
                                    (!!currentStatus &&
                                        currentStatus.startsWith('VALID') &&
                                        this.tokenLastPollResult.tokenStatus.startsWith('VALID')))
                            );
                        }),
                        finalize(() => {
                            this.otpForm.patchValue({pending: false});
                            this.otpForm.get('code').enable();

                            if (
                                this.tokenLastPollResult &&
                                this.tokenLastPollResult.tokenStatus === 'WRONG_OTP_CODE'
                            ) {
                                this.otpForm.get('code').disable();
                            }
                            if (
                                !this.tokenLastPollResult ||
                                this.tokenLastPollResult.tokenStatus !== 'WRONG_OTP_CODE'
                            ) {
                                this.createMonitoringOs();
                                this.setStep(OtpUpdateDialogStep.MONITORING);
                            }
                        })
                    )
                ),
                catchError(() => {
                    this.otpForm.patchValue({pending: false});
                    this.otpForm.get('code').enable();
                    return of(null);
                })
            );
    }

    public appTokenStatus() {
        this.tokenService
            .appTokenStatus({
                uuid: this.tokenData.token,
                tryAgain: true
            })
            .subscribe(() => {
                this.tokenLastPollResult = null;
                this.otpForm.get('code').enable();
                this.otpForm.get('code').patchValue('');
                this.setStep(OtpUpdateDialogStep.PROMPT);
            });
    }

    private createMonitoringOs() {
        this.monitoring$ = timer(1000, 5000).pipe(
            switchMap(() =>
                this.tokenService.stationTokenGetStatus({
                    companyId: this.companyId,
                    stationId: this.stationId,
                    tokens: [this.tokenData.token]
                })
            ),
            takeWhileInclusive((response: any) => {
                return (
                    this.display &&
                    !!this.storeLastPollResultFrom(response) &&
                    ![
                        'VALIDPOALIMBAASAKIM',
                        'TECHNICALPROBLEM',
                        'WRONG_OTP_CODE'
                    ].includes(this.tokenLastPollResult.tokenStatus)
                );
            }),
            finalize(() => {
                if (
                    this.tokenLastPollResult &&
                    this.tokenLastPollResult.tokenStatus === 'WRONG_OTP_CODE'
                ) {
                    this.otpForm.get('code').disable();
                }
                if (
                    !!this.tokenLastPollResult &&
                    'WRONG_OTP_CODE' === this.tokenLastPollResult.tokenStatus
                ) {
                    this.otpCodeApply$ = null;
                    this.setStep(OtpUpdateDialogStep.CODE_PROMPT);
                } else if (
                    !!this.tokenLastPollResult &&
                    !['TECHNICALPROBLEM', 'WRONG_OTP_CODE', 'INPROGRESS'].includes(
                        this.tokenLastPollResult.tokenStatus
                    )
                ) {
                    this.display = false;
                }
            })
        );
    }
}

export enum OtpUpdateDialogStep {
    PROMPT,
    AWAIT_CONN,
    CODE_PROMPT,
    MONITORING
}
