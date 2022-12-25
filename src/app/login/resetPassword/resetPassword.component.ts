import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {AuthService} from '../auth.service';
import {UserService} from '@app/core/user.service';
import {StorageService} from '@app/shared/services/storage.service';
import {HttpServices} from '@app/shared/services/http.services';
import {FormBuilder, FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {ErrorStateMatcher} from '@angular/material/core';
import {filter, map, switchMap, takeUntil} from 'rxjs/operators';
import {EMPTY, merge, Observable, Subject} from 'rxjs';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';

enum EResetPasswordState {
    RESET,
    OTP,
    SET_PASSWORD,
    CAN_NOT_BE_CHANGED
}

/** Error when invalid control is dirty, touched, or submitted. */
export class ImmediateErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(
        control: FormControl | null,
        form: FormGroupDirective | NgForm | null | any
    ): boolean {
        const isSubmitted = form && form.submitted;
        return !!(
            control &&
            control.invalid &&
            (control.dirty || control.touched || isSubmitted)
        );
    }
}

export class FormAwaredErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(
        control: FormControl | null,
        form: FormGroupDirective | NgForm | null | any
    ): boolean {
        // debugger;
        return (
            control &&
            control.dirty &&
            (control.parent || form) &&
            (control.parent || form).invalid
        );
    }
}

@Component({
    templateUrl: './resetPassword.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
    public state: EResetPasswordState;
    public formResetPassword: any;
    public resetState = EResetPasswordState;
    public translateParams = {phone: ''};
    public formInProgress = false;
    public isNoMoreTry = false;
    tokenInfo = {
        maskedPhoneNumber: null,
        smsRemained: 0
    };
    passwordHide = true;
    confirmPasswordHide = true;
    isCapsLock = null;
    isHebrew = false;
    incorrectCodes = 0;

    readonly immediateErrorMatcher = new ImmediateErrorStateMatcher();
    sucessfulyAuthenticatedWithUsernameProvided$: Observable<boolean>;
    private readonly destroyed$ = new Subject<void>();

    readonly formAwaredErrorStateMatcher = new FormAwaredErrorStateMatcher();

    constructor(
        public translate: TranslateService,
        public authService: AuthService,
        public router: Router,
        public userService: UserService,
        public storageService: StorageService,
        public httpServices: HttpServices,
        private _fb: FormBuilder,
        private route: ActivatedRoute
    ) {
        this.userService = userService;
        this.state = EResetPasswordState.RESET;
    }

    ngOnInit() {
        this.formResetPassword = this._fb.group({
            reset: this._fb.group({
                email: new FormControl('', {
                    validators: [Validators.required, Validators.email],
                    updateOn: 'blur'
                })
            }),
            confirm: this._fb.group({
                // code: ['', Validators.compose([Validators.required, Validators.pattern(new RegExp(/^-?[0-9][^\.]*$/))])]
                code: [
                    '',
                    [Validators.required, Validators.pattern(new RegExp(/^\d*$/))]
                ]
            }),
            setPassword: this._fb.group(
                {
                    password: [
                        '',
                        Validators.compose([
                            Validators.required,
                            Validators.minLength(8),
                            Validators.maxLength(12),
                            ValidatorsFactory.passwordValidatorBizibox
                        ])
                    ],
                    confirmPassword: ['', Validators.required]
                },
                {validators: this.passwordMatchValidator}
            )
        });

        this.sucessfulyAuthenticatedWithUsernameProvided$ = merge(
            this.route.paramMap.pipe(
                filter((params) => params.has('forcePasswordChange')),
                map((params) => !!params.get('forcePasswordChange'))
            ),
            this.route.queryParamMap.pipe(
                filter((params) => params.has('username')),
                map((params) => params.get('username')),
                switchMap((username) => {
                    if (username) {
                        return this.authService
                            .login(username, username, false)
                            .pipe(
                                map(
                                    (response: any) =>
                                        !!(
                                            response &&
                                            response.status < 400 &&
                                            !response.error &&
                                            response.body &&
                                            response.body.token
                                        )
                                )
                            );
                    }
                    return EMPTY;
                })
            )
        ).pipe(takeUntil(this.destroyed$));

        this.sucessfulyAuthenticatedWithUsernameProvided$.subscribe((result) => {
            if (result) {
                this.setScreenState(EResetPasswordState.SET_PASSWORD);
            }
        });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
    }

    // passwordValidator(c: FormControl) {
    //     const reDigit = new RegExp(/(?=.*\d)/);
    //     const reLetter = new RegExp(/(?=.*[a-zA-Z])/);
    //     const result: any = {};
    //     if (!reDigit.test(c.value)) result.nodigit = true;
    //     if (!reLetter.test(c.value)) result.noletter = true;
    //     return isEmpty(result) ? null : result;
    // }

    passwordMatchValidator(g: any) {
        return g.get('password').value === g.get('confirmPassword').value
            ? null
            : {mismatch: true};
    }

    setScreenState(screen: EResetPasswordState) {
        this.formResetPassword.reset();
        this.state = screen;
    }

    handleFocusEmail() {
        this.formResetPassword.get('reset')['controls'].email.markAsUntouched();
    }

    handleKeyPress(e) {
        const str = String.fromCharCode(e.which);
        if (!str) {
            return;
        }
        this.isHebrew = str.search(/[\u0590-\u05FF]/) >= 0;
        this.isCapsLock = ((): any => {
            const charCode = e.which || e.keyCode;
            let isShift = false;
            if (e.shiftKey) {
                isShift = e.shiftKey;
            } else if (e.modifiers) {
                isShift = !!(e.modifiers & 4);
            }

            if (charCode >= 97 && charCode <= 122 && isShift) {
                return true;
            }
            if (charCode >= 65 && charCode <= 90 && !isShift) {
                return true;
            }
            return false;
        })();
    }

    handleKeyDown(e) {
        if (e.which == 20 && this.isCapsLock !== null) {
            this.isCapsLock = !this.isCapsLock;
        }
    }

    submitForm(formName) {
        // debugger;
        if (this.formInProgress || !this.formResetPassword.get(formName).valid) {
            return;
        }

        this.formInProgress = true;
        switch (formName) {
            case 'reset':
                return this.resetPassword();
            case 'confirm':
                return this.confirmOtp();
            case 'setPassword':
                return this.changePassword();
            default:
                this.formInProgress = false;
        }
    }

    resetPassword(): void {
        const {email} = this.formResetPassword.get('reset').value;
        this.authService.resetPassword(email).subscribe((response: any) => {
            this.formInProgress = false;
            if (
                [401, 403, 400].includes(response.status) ||
                response.error ||
                !response.body.tokenInfo ||
                !response.body.tokenInfo.maskedPhoneNumber ||
                response.body.tokenInfo.maskedPhoneNumber === 'User not found'
            ) {
                return this.setScreenState(EResetPasswordState.CAN_NOT_BE_CHANGED);
            }

            this.tokenInfo = response.body.tokenInfo;
            this.translateParams.phone = response.body.tokenInfo.maskedPhoneNumber;
            this.setScreenState(EResetPasswordState.OTP);

            this.formResetPassword
                .get('setPassword.password')
                .setValidators([
                    Validators.required,
                    Validators.minLength(8),
                    Validators.maxLength(12),
                    ValidatorsFactory.passwordValidatorBizibox,
                    ValidatorsFactory.passwordNotEqualToUsernameValidatorBizibox(email)
                ]);
        });
    }

    confirmOtp(): void {
        const {code} = this.formResetPassword.get('confirm').value;
        this.authService.loginOtp(code, false).subscribe((response: any) => {
            this.formInProgress = false;
            if (response.status === 401) {
                return this.authService.logout();
            }
            if (
                ![400, 403].includes(response.status) &&
                !response.error &&
                ![
                    'Incorrect one time token code',
                    'userNotfound',
                    'userNotFound'
                ].includes(response.body.token)
            ) {
                return this.setScreenState(EResetPasswordState.SET_PASSWORD);
            }

            this.incorrectCodes++;
            if (this.incorrectCodes >= 3) {
                this.isNoMoreTry = true;
                // setTimeout(() => this.authService.logout(), 3000);
            }

            this.formResetPassword.get('confirm.code').setErrors({incorrect: true});
        });
    }

    private changePassword(): void {
        const {password} = this.formResetPassword.get('setPassword').value;
        this.authService.changePassword(password).subscribe((response: any) => {
            this.formInProgress = false;
            if (response.status === 401) {
                return this.authService.logout();
            }
            if ([400, 403].includes(response.status)) {
                return this.formResetPassword
                    .get('setPassword')
                    .setErrors({incorrect: true});
            }
        });
    }

    resendSms(): void {
        if (!this.tokenInfo.smsRemained) {
            return;
        }
        this.authService.resentOtpSms().subscribe((response: any) => {
            this.tokenInfo = response.body;
        });
    }
}
