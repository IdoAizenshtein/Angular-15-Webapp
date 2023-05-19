import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../auth.service';
import {UserService} from '@app/core/user.service';
import {StorageService} from '@app/shared/services/storage.service';
import {HttpServices} from '@app/shared/services/http.services';
import {UserAuth} from '@app/shared/interfaces/interface.param.http';
import {FormBuilder, FormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {TranslateService} from '@ngx-translate/core';
import jwt_decode from "jwt-decode";

import {merge} from 'rxjs';
import {ErrorStateMatcher} from '@angular/material/core';

export enum ELoginState {
    LOGIN,
    OTP_LOGIN
}

@Component({
    templateUrl: './login.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class LoginComponent implements OnInit {
    public state: ELoginState;
    public formLogin: any;
    public formLoginOtp: any;
    public loginState = ELoginState;
    public formInProgress = false;
    public loginIsBlocked = false;
    public translateParams = {phone: '', blockingTime: 0};
    tokenInfo = {
        maskedPhoneNumber: null,
        smsRemained: 0
    };
    hide = true;
    matcher = new MyErrorStateMatcher();

    public containsFailedAttemptCredentials = false;
    private lastFailedAttemptCredentials: { username: string; password: string } =
        null;

    isCapsLock = null;
    isHebrew = false;

    constructor(
        public translate: TranslateService,
        public authService: AuthService,
        public router: Router,
        public userService: UserService,
        public storageService: StorageService,
        public httpServices: HttpServices,
        private _fb: FormBuilder,
        public snackBar: MatSnackBar
    ) {
        this.userService = userService;
        this.state = ELoginState.LOGIN;
    }

    ngOnInit() {
        this.formLogin = this._fb.group({
            formUser: this._fb.group({
                username: new FormControl('', {
                    validators: this.userService.appData.isAdmin
                        ? [Validators.required]
                        : [Validators.required, Validators.email] // ,
                    // updateOn: 'blur'
                }),
                password: ['', <any>Validators.required],
                rememberMe: [true]
            })
        });
        this.formLoginOtp = this._fb.group({
            code: [
                '',
                Validators.compose([
                    Validators.required,
                    Validators.pattern(new RegExp(/^-?[0-9][^\.]*$/))
                ])
            ],
            vms: new FormControl(false)
        });

        merge(
            this.formLogin.get('formUser').get('username').valueChanges,
            this.formLogin.get('formUser').get('password').valueChanges
        ).subscribe(() => {
            if (this.lastFailedAttemptCredentials === null) {
                return;
            }

            this.containsFailedAttemptCredentials =
                this.formLogin.get('formUser').get('username').value ===
                this.lastFailedAttemptCredentials.username &&
                this.formLogin.get('formUser').get('password').value ===
                this.lastFailedAttemptCredentials.password;
        });
    }

    handleFocusUsername() {
        this.formLogin.get('formUser')['controls'].username.markAsUntouched();
    }

    setScreenState(screen: ELoginState) {
        this.formLogin.reset();
        this.formLoginOtp.reset();
        this.state = screen;
    }

    async login(model: UserAuth, isValid: boolean): Promise<void> {
        if (
            !isValid ||
            this.formInProgress ||
            this.containsFailedAttemptCredentials
        ) {
            return;
        }
        const {username, password, rememberMe} = model.formUser;
        this.formInProgress = true;
        this.loginIsBlocked = false;
        const gRecaptcha = await this.userService.executeAction('token');
        this.authService.login(username, password, gRecaptcha, rememberMe).subscribe({
            next: (response: any) => {
                this.formInProgress = false;
                if (response.status === 401 || response.status === 403) {
                    this.translate.get('validation').subscribe((res: any) => {
                        this.snackBar.open(res.errorFromServer, res.action, {
                            duration: 2000
                        });
                    });

                    this.rememberFailedAttempt(username, password);
                    return this.formLogin.get('formUser').setErrors({incorrect: true});
                }

                if (response.status === 423) {
                    this.translateParams.blockingTime =
                        parseInt(response.error.message, 10) + 1;
                    this.loginIsBlocked = true;
                    return;
                }

                const token: string = response.body.token;
                if (token) {
                    const decodedToken: any = jwt_decode(token);
                    if (decodedToken.type !== 'PRE_AUTH') {
                        return;
                    }
                    this.tokenInfo = response.body.tokenInfo;
                    this.translateParams.phone =
                        response.body.tokenInfo.maskedPhoneNumber;
                    return this.setScreenState(ELoginState.OTP_LOGIN);
                } else {
                    this.translate.get('validation').subscribe((res: any) => {
                        this.snackBar.open(res.errorFromServer, res.action, {
                            duration: 2000
                        });
                    });

                    this.rememberFailedAttempt(username, password);
                    this.formLogin.get('formUser').setErrors({incorrect: true});
                }
            }
        });
    }

    loginOtp(model, isValid: boolean): void {
        if (!isValid || this.formInProgress) {
            return;
        }
        this.formInProgress = true;
        this.authService.loginOtp(model.code).subscribe(
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
            }
        );
    }

    async resendSms(): Promise<void> {
        if (!this.tokenInfo.smsRemained) {
            return;
        }
        const gRecaptcha = await this.userService.executeAction('resend-sms');
        this.authService.resentOtpSms(false, gRecaptcha).subscribe((response: any) => {
            this.tokenInfo = response.body;
        });
    }
    resentOtpVms(): void {
        if (!this.tokenInfo.smsRemained) {
            return;
        }
        this.authService.resentOtpVms(false).subscribe((response: any) => {
            this.tokenInfo = response.body;
        });
    }
    private rememberFailedAttempt(username: string, password: string) {
        this.lastFailedAttemptCredentials = {
            username: username,
            password: password
        };
        this.containsFailedAttemptCredentials = true;
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

    reloadSelf() {
        window.location.reload();
    }
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(
        control: FormControl | null,
        form: FormGroupDirective | NgForm | null | any
    ): boolean {
        const invalidCtrl = !!(control && control.invalid);
        const invalidParent = !!(
            control &&
            control.parent &&
            control.parent.invalid
        );
        return invalidCtrl || invalidParent;
    }
}
