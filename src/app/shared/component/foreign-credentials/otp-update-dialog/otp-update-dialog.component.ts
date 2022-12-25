import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChange,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {defer, Observable, of, timer} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';
import {TokenService, TokenStatus, TokenStatusResponse} from '@app/core/token.service';
import {BankForeignCredentialsService, QuestionBase} from '../foreign-credentials.service';
import {DialogState} from '../token-update-dialog/token-update-dialog.component';
import {takeWhileInclusive} from '../../../functions/takeWhileInclusive';
import {publishRef} from '../../../functions/publishRef';
import {UserService} from "@app/core/user.service";

@Component({
    selector: 'app-otp-update-dialog',
    templateUrl: './otp-update-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class OtpUpdateDialogComponent implements OnChanges, OnInit {
    private _display = false;

    @Input()
    get display(): boolean {
        return this._display;
    }

    set display(val: boolean) {
        this._display = val;
        this.displayChange.emit(this._display);

        if (this.otpForm && this.otpForm.controls['length']) {
            this.otpForm.reset();
        }
    }

    @Output() displayChange = new EventEmitter<boolean>();

    @Input()
    companyId: string;

    @Input() tokenData: TokenStatusResponse;

    readonly otpForm: any;

    public DialogState = DialogState;
    public TokenStatus = TokenStatus;

    state: DialogState | null = null;

    otpTargetSettings: any = null;
    otpTypeSettings: any = null;
    otpControl: QuestionBase<string> = null;

    @Output() updateSuccess = new EventEmitter<string>();
    @Output() updateFailure = new EventEmitter<any>();
    @Output() statusPollingFinished = new EventEmitter<any>();

    private tokenSettingsUpdater$: Observable<any>;
    private readonly MAX_POLLING_ATTEMPTS = 12;
    tokenStatusPoll$: Observable<any>;

    constructor(
        public translate: TranslateService,
        private bankForeignCreds: BankForeignCredentialsService,
        private tokenService: TokenService,
        public userService: UserService
    ) {
        this.otpForm = new FormGroup({});

        this.tokenSettingsUpdater$ = defer(() =>
            of({
                bankId: this.tokenData.websiteTargetTypeId,
                companyId: this.companyId,
                tokenId: this.tokenData.token,
                bankUserName: null,
                bankPass: null,
                bankAuto: this.otpForm.get(this.otpControl.key).value
            })
        ).pipe(
            tap(() => (this.state = DialogState.UPDATING)),
            switchMap((request) => this.tokenService.tokenUpdate(request)),
            tap((resp) => {
                this.state = resp.error
                    ? DialogState.UPDATE_FAILED
                    : DialogState.UPDATE_SUCCEEDED;
                if (this.state === DialogState.UPDATE_SUCCEEDED) {
                    this.updateSuccess.emit(this.tokenData.token);
                } else {
                    this.updateFailure.emit(this.tokenData.token);
                }
            })
        );
    }

    ngOnInit() {
        this.tokenSettingsUpdater$ = defer(() =>
            of({
                bankId: this.tokenData.websiteTargetTypeId,
                companyId: this.companyId,
                tokenId: this.tokenData.token,
                bankUserName: null,
                bankPass: null,
                bankAuto: this.otpForm.get('otpcode').value
            })
        ).pipe(
            tap(() => (this.state = DialogState.UPDATING)),
            switchMap((request) => this.tokenService.tokenUpdate(request)),
            tap((resp) => {
                this.state = resp.error
                    ? DialogState.UPDATE_FAILED
                    : DialogState.UPDATE_SUCCEEDED;
                if (this.state === DialogState.UPDATE_SUCCEEDED) {
                    this.updateSuccess.emit(this.tokenData.token);
                } else {
                    this.updateFailure.emit(this.tokenData.token);
                }
            })
        );

        this.resetPollingObs();
    }

    submitTokenUpdate(): void {
        this.tokenSettingsUpdater$.subscribe();
    }

    resetPollingObs(): void {
        this.state = null;

        this.tokenStatusPoll$ = // zip(timer(300, 5000), this.updateSuccess)
            this.updateSuccess.pipe(
                switchMap((updatedToken) =>
                    timer(300, 5000).pipe(map((i) => [i, updatedToken]))
                ),
                switchMap(([i, updatedToken]: any[]) => {
                    // console.log('polling -----> %o', i);
                    return this.tokenService
                        .tokenGetStatus({
                            companyId: this.companyId,
                            tokens: [updatedToken]
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
                                        [TokenStatus.New, TokenStatus.InProgress].includes(
                                            respStatus
                                        )
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
                tap((tknStat) => {
                    this.tokenData.tokenStatus = tknStat.tokenStatus;
                    this.tokenData.screenPasswordUpdateCount =
                        tknStat.screenPasswordUpdateCount;
                }),
                takeWhileInclusive(
                    (tknStat) => tknStat && tknStat['uiStatus'] === 'WAITING'
                ),
                tap((tknStat) => this.statusPollingFinished.emit(tknStat)),
                publishRef
            );
    }


    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes['tokenData']) {
            this.reset();
        }
    }

    private reset() {
        Object.keys(this.otpForm.controls).forEach((cntrlName) =>
            this.otpForm.removeControl(cntrlName)
        );

        if (
            this.tokenData &&
            (this.otpTargetSettings = this.translate.instant(
                'foreignCredentials.banks.' + this.tokenData.websiteTargetTypeId
            )).otp
        ) {
            this.otpTargetSettings.otpTypes = this.otpTargetSettings.otpTypes.filter(
                (otpt) => otpt.value !== 'message'
            );

            this.otpTypeSettings = this.otpTargetSettings.otpTypes[0];

            this.otpForm.addControl(
                'otpType',
                new FormControl(this.otpTypeSettings.value, [Validators.required])
            );
            this.otpForm.get('otpType').valueChanges.subscribe((newVal) => {
                if (this.otpControl && this.otpForm.contains(this.otpControl.key)) {
                    this.otpForm.removeControl(this.otpControl.key);
                }
                this.otpTypeSettings = this.otpTargetSettings.otpTypes.find(
                    (otpt) => otpt.value === newVal
                );
                this.resetCodeControl();
            });
            this.resetCodeControl();
        }
    }

    private resetCodeControl() {
        if (!this.otpTypeSettings) {
            this.otpControl = null;
            return;
        }
        // debugger;
        this.otpControl = new QuestionBase<string>(
            Object.assign(
                {
                    key: 'otpcode',
                    controlType: 'text'
                },
                this.otpTypeSettings.code
            )
        );

        const codeCntrl = this.bankForeignCreds.toFormControl(this.otpControl);
        this.otpForm.addControl(this.otpControl.key, codeCntrl);
        codeCntrl.reset(null, {
            onlySelf: false,
            emitEvent: true
        });
        // this.otpForm.updateValueAndValidity();
    }
}
