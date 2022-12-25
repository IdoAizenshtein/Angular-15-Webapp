import {Component, Input, OnChanges, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {BankForeignCredentialsService, QuestionBase} from '../foreign-credentials.service';
import {TranslateService} from '@ngx-translate/core';
import {filter} from 'rxjs/operators';
import {TokenService, TokenStatus, TokenStatusResponse} from '@app/core/token.service';

@Component({
    selector: 'app-token-update-foreign-credentials',
    templateUrl: './token-credentials-update.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TokenCredentialsUpdateComponent
    implements OnChanges {
    @Input() form: any;
    @Input() tokenData: TokenStatusResponse;
    settings: any;
    tokenStatus: TokenStatus;

    hideFirst = true;
    hideThird = true;
    hidePassword = false;

    foreignControls: QuestionBase<string>[] = null;
    passwordShowMasked = true;

    // otpCodeQuestionStub: QuestionBase<string> = null;
    readonly otpForm: any;
    otpTargetSettings: any = null;
    otpTypeSettings: any = null;
    otpControl: QuestionBase<string> = null;

    constructor(
        private translate: TranslateService,
        private bankForeignCreds: BankForeignCredentialsService,
        private tokenService: TokenService
    ) {
        this.otpForm = new FormGroup({});
        this.otpForm.valueChanges
            .pipe(
                filter(
                    (newVal: any) =>
                        this.otpTargetSettings !== null &&
                        'otpType' in newVal &&
                        (!this.otpTypeSettings ||
                            !newVal['otpType'] ||
                            this.otpTargetSettings.otpTypes.find((otpt: any) => otpt.value === newVal['otpType']
                            ).value !== this.otpTypeSettings.value)
                )
            )
            .subscribe((newVal) => {
                if (this.otpControl && this.otpForm.contains(this.otpControl.key)) {
                    this.otpForm.removeControl(this.otpControl.key);
                }
                this.otpTypeSettings = this.otpTargetSettings.otpTypes.find(
                    (otpt) => otpt.value === newVal['otpType']
                );
                if (!this.otpTypeSettings) {
                    this.otpControl = null;
                } else {
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
                    if (this.otpTypeSettings.value === 'constant') {
                        const removeIdx = this.otpControl.validators.indexOf(
                            Validators.required
                        );
                        if (removeIdx >= 0) {
                            this.otpControl.validators.splice(removeIdx, 1);
                        }
                    }

                    const codeCntrl = this.bankForeignCreds.toFormControl(
                        this.otpControl
                    );
                    this.otpForm.addControl(this.otpControl.key, codeCntrl);
                    codeCntrl.reset(null, {
                        onlySelf: false,
                        emitEvent: true
                    });
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // debugger;
        if (changes['tokenData']) {
            if (this.foreignControls) {
                this.foreignControls.forEach((fc) => this.form.removeControl(fc.key));
            }
            Object.keys(this.otpForm.controls).forEach((name) =>
                this.otpForm.removeControl(name)
            );

            if (!changes['tokenData'].currentValue) {
                return;
            }

            const settingsKey = this.tokenService.settingsKeyByTargetId(
                this.tokenData.websiteTargetTypeId
            );
            this.settings =
                settingsKey !== null ? this.translate.instant(settingsKey) : null;
            this.tokenStatus = this.tokenService.toTokenStatusEnumValue(
                this.tokenData.tokenStatus
            );

            if (
                this.tokenService.shouldTokenUpdatePassword(
                    this.tokenData.tokenStatus
                ) ||
                this.settings.otp === true
            ) {
                this.hideFirst = true;
                this.hideThird = true;
            } else {
                this.hideFirst = false;
                this.hideThird = false;
            }

            this.hidePassword =
                [TokenStatus.MARCODRequired, TokenStatus.DISCODREQUIRED].includes(
                    this.tokenStatus
                ) && !(this.tokenData as any).autoDiscod;

            // this.foreignControls = Array.isArray(this.settings) ? this.settings.map(fc => new QuestionBase(fc)) : [];
            if (Array.isArray(this.settings)) {
                this.foreignControls = this.settings.map((fc) => new QuestionBase(fc));
                this.otpTargetSettings = null;
            } else if (this.settings && (this.settings as any).otp) {
                this.foreignControls = this.translate
                    .instant('foreignCredentials.banks.' + this.settings.regularParent)
                    .filter((fld) => fld.key !== 'userCode')
                    .map((fc) => new QuestionBase(fc));

                this.otpTargetSettings = this.settings as any;
                this.otpTargetSettings.otpTypes =
                    this.otpTargetSettings.otpTypes.filter(
                        (otpt) => otpt.value !== 'message'
                    );

                let otpTypeSelectedByDefault;
                if (
                    (this.tokenData as any).autoDiscod === true &&
                    this.otpTargetSettings.otpTypes.some(
                        (otpt) => otpt.value === 'constant'
                    )
                ) {
                    otpTypeSelectedByDefault = 'constant';
                } else {
                    otpTypeSelectedByDefault = this.otpTargetSettings.otpTypes.find(
                        (otpt) => otpt.value !== 'constant'
                    ).value;
                }

                // this.otpTypeSettings = this.otpTargetSettings.otpTypes[0];

                this.otpForm.addControl(
                    'otpType',
                    new FormControl(
                        otpTypeSelectedByDefault, // this.otpTypeSettings.value,
                        [Validators.required]
                    )
                );

                this.form.setControl('otp', this.otpForm);
            } else {
                this.foreignControls = [];
                this.otpTargetSettings = null;
            }

            this.rebuildControls();
        }
    }


    rebuildControls(): void {
        if (this.foreignControls && this.foreignControls.length) {
            this.foreignControls.forEach((fc) => this.form.removeControl(fc.key));
            const pwdControl = this.foreignControls.find(
                (fc) => fc.controlType === 'password'
            );

            if (
                !this.hideFirst &&
                (!pwdControl || this.foreignControls[0] !== pwdControl)
            ) {
                const fc = this.foreignControls[0];
                this.form.setControl(fc.key, this.bankForeignCreds.toFormControl(fc));
            }

            if (pwdControl && !this.hidePassword) {
                const confirmPwdKey = pwdControl.key + 'Confirm';
                let confirmPwd = this.foreignControls.find(
                    (fc) => fc.key === confirmPwdKey
                );
                if (!confirmPwd) {
                    confirmPwd = JSON.parse(JSON.stringify(pwdControl));
                    confirmPwd.key = pwdControl.key + 'Confirm';
                    this.translate
                        .get('foreignCredentialsUpdate.confirmLabelPtrn', {
                            param: pwdControl.label
                        })
                        .subscribe((result) => (confirmPwd.label = result));
                    confirmPwd.validators = [];
                    confirmPwd.rules = [];
                    this.foreignControls.splice(
                        this.foreignControls.indexOf(pwdControl) + 1,
                        0,
                        confirmPwd
                    );
                }
                this.form.setControl(
                    pwdControl.key,
                    this.bankForeignCreds.toFormControl(pwdControl)
                );
                this.form.setControl(
                    confirmPwd.key,
                    this.bankForeignCreds.toFormControl(confirmPwd)
                );

                if (this.form.validator) {
                    this.form.setValidators(
                        Validators.compose([
                            this.form.validator,
                            this.passwordMatchValidatorCreate(pwdControl.key)
                        ])
                    );
                } else {
                    this.form.setValidators([
                        this.passwordMatchValidatorCreate(pwdControl.key)
                    ]);
                }
            } else if (pwdControl && this.hidePassword) {
                this.form.clearValidators();
            }

            const nonPasswordCntrls = this.foreignControls.filter(
                (fc) => fc.controlType !== 'password'
            );
            if (nonPasswordCntrls.length > 1 && !this.hideThird) {
                const fc = nonPasswordCntrls[nonPasswordCntrls.length - 1];
                this.form.setControl(fc.key, this.bankForeignCreds.toFormControl(fc));
            }

            this.form.updateValueAndValidity();
        }
    }

    passwordMatchValidatorCreate(controlNameToCompare: string): any {
        return (fg: any) => {
            return fg.contains(controlNameToCompare) &&
            fg.contains(controlNameToCompare + 'Confirm') &&
            fg.get(controlNameToCompare).value ===
            fg.get(controlNameToCompare + 'Confirm').value
                ? null
                : {passwordNotMatch: true};
        };
    }

    public getResults(): any | null {
        // if (this.otpCodeQuestionStub && this.form.contains(this.otpCodeQuestionStub.key)) {
        //     return {
        //         'bankAuto': this.form.get(this.otpCodeQuestionStub.key).value,
        //         'bankPass': null,
        //         'bankUserName': null
        //     };
        // }

        if (this.foreignControls === null) {
            return null;
        }

        const keyUsername = this.foreignControls[0].key,
            keyPassword = this.foreignControls.find(
                (fc) => fc.controlType === 'password'
            ).key,
            keyQuestn = this.foreignControls.find(
                (fc, idx) => idx > 0 && fc.controlType !== 'password'
            );

        let bankAutoVal = null;
        if (this.settings.otp && this.otpForm.get('otpcode').value) {
            bankAutoVal = this.otpForm.get('otpcode').value;
        } else if (
            !this.hideThird &&
            keyQuestn &&
            this.form.contains(keyQuestn.key) &&
            this.form.get(keyQuestn.key).value
        ) {
            bankAutoVal = this.form.get(keyQuestn.key).value;
        } else if (
            this.tokenData.websiteTargetTypeId === 90 &&
            this.form.contains(keyUsername) &&
            this.form.get(keyUsername).value
        ) {
            bankAutoVal = this.form.get(keyUsername).value;
        }

        return {
            bankAuto: bankAutoVal,
            bankPass:
                this.form.contains(keyPassword) && this.form.get(keyPassword).value
                    ? this.form.get(keyPassword).value
                    : null,
            bankUserName:
                this.form.contains(keyUsername) && this.form.get(keyUsername).value
                    ? this.form.get(keyUsername).value
                    : null
        };
    }
}
