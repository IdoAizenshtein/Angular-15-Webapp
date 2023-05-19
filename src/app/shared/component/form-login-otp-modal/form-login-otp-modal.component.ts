/* tslint:disable:max-line-length */
import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {slideInOut} from '../../animations/slideInOut';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MyErrorStateMatcher} from '@app/erp/accountManagement/main-accountManagement.component';
import {HttpErrorResponse} from '@angular/common/http';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {AuthService} from '@app/login/auth.service';
import {exhaustMap, tap} from 'rxjs/operators';
import {of} from 'rxjs';

@Component({
    selector: 'app-form-login-otp-modal',
    templateUrl: './form-login-otp-modal.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class FormLoginOtpModalComponent implements OnInit, OnDestroy {
    @Input() formLoginOtpModal: boolean = false;
    @Output() changedTrigger = new EventEmitter<boolean>();

    public tokenInfo = {
        phone: null,
        smsRemained: 0
    };
    matcher = new MyErrorStateMatcher();
    public formLoginOtp: any;
    public formInProgress = false;

    constructor(
        public translate: TranslateService,
        public router: Router,
        public userService: UserService,
        public route: ActivatedRoute,
        private fb: FormBuilder,
        public authService: AuthService,
        public storageService: StorageService
    ) {

    }

    ngOnInit(): void {
        this.formLoginOtp = this.fb.group({
            code: [
                '',
                Validators.compose([
                    Validators.required,
                    Validators.pattern(new RegExp(/^-?[0-9][^\.]*$/))
                ])
            ],
            vms: new FormControl(false)
        });
        this.sendSms().then(r => {

        });
    }


    async sendSms(): Promise<void> {
        const gRecaptcha = await this.userService.executeAction('send-sms');
        this.authService.sendSms(false, gRecaptcha)
            .pipe(
                exhaustMap((response: any) => {
                    if (
                        !response ||
                        response.error ||
                        !response.body ||
                        !response.body.token ||
                        [
                            'Incorrect one time token code',
                            'userNotfound',
                            'userNotFound'
                        ].includes(response.body.token)
                    ) {
                        throw new Error('Could not trigger otp process');
                    }
                    return of(response.body);
                }),
                tap((otpTriggerResp: any) => {
                    // this.companySuperAdminPrivTransferPrompt.otpVerifyStep.confirmForm.patchValue(
                    //     {token: otpTriggerResp.token}
                    // )
                })
            ).subscribe((response) => {
            this.tokenInfo = response;
            this.tokenInfo.phone = response.maskedPhoneNumber;
        });
    }

    loginOtp(model, isValid: boolean): void {
        if (!isValid || this.formInProgress) {
            return;
        }
        this.formInProgress = true;
        this.authService.sendOtpCode(model.code).subscribe(
            (response: any) => {
                this.formInProgress = false;
                if ([400, 401, 403].includes(response.status)) {
                    return this.formLoginOtp.setErrors({incorrect: true});
                }
                if (
                    response &&
                    response.body &&
                    response.body.token &&
                    response.body.token.includes('Incorrect')
                ) {
                    return this.formLoginOtp.setErrors({
                        wrongCode: true,
                        incorrect: false
                    });
                }
                this.formLoginOtpModal = false;
                this.changedTrigger.emit(true);
                // this.openSetTrust = true;
            },
            (err: HttpErrorResponse) => {
                if (err.error instanceof Error) {
                    // A client-side or network error occurred. Handle it accordingly.
                    console.log('An error occurred:', err.error.message);
                } else {
                    // The backend returned an unsuccessful response code.
                    // The response body may contain clues as to what went wrong,
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    async resendSms(): Promise<void> {
        if (!this.tokenInfo.smsRemained) {
            return;
        }
        const gRecaptcha = await this.userService.executeAction('resend-sms');
        this.authService.resentOtpSms(false, gRecaptcha).subscribe((response: any) => {
            this.tokenInfo.smsRemained = response?.body?.smsRemained;
        });
    }

    resentOtpVms(): void {
        if (!this.tokenInfo.smsRemained) {
            return;
        }
        this.authService.resentOtpVms(false).subscribe((response: any) => {
            this.tokenInfo.smsRemained = response?.body?.smsRemained;
        });
    }

    ngOnDestroy(): void {

    }
}
