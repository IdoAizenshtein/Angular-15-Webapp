import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BankForeignCredentialsService, QuestionBase} from '../foreign-credentials.service';
import {bankIdsOrderedForSelection} from '@app/core/token.service';

@Component({
    selector: 'app-bank-foreign-credentials',
    templateUrl: './bank-credentials.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class BankCredentialsComponent implements OnInit, OnChanges {
    @Input() bankCredentialsGroup: any;
    @Input() settings: any[];
    @Input() is_station: any = false;
    @Output() changedTrigger = new EventEmitter<boolean>();

    voiceMessage: boolean = false;

    banks: any[];
    selectedSettings: any;
    foreignControls: QuestionBase<string>[] = null;
    readonly otpTypeQuestionStub: QuestionBase<string>;
    otpCodeQuestionStub: QuestionBase<string> = null;
    passwordHide = true;
    otpInProgress = false;
    bankCodeUpdateGroup: any = null;

    @Input() useMaterialComponents = false;

    @Input()
    set resetBankDD(reset: any) {
        if (reset) {
            Object.keys(this.bankCredentialsGroup.controls).forEach((key) => {
                if (key !== 'bank') {
                    this.bankCredentialsGroup.removeControl(key);
                }
            });
            this.bankCredentialsGroup.get('bank').patchValue(null);
            this.setBankControlsFor(null);
        }
    }

    constructor(
        public translate: TranslateService,
        private fb: FormBuilder,
        private bankForeignCreds: BankForeignCredentialsService
    ) {
        this.otpTypeQuestionStub = new QuestionBase<string>({
            key: 'otpType'
        });
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes['settings']) {
            if (Object.keys(changes['settings'].currentValue).length === 0) {
                this.banks = [];
            } else {
                this.banks = Object.entries(changes['settings'].currentValue).map(
                    ([key, val]: any) => {
                        return {
                            label:
                                'name' in val
                                    ? val['name']
                                    : this.translate.instant('banks.' + key),
                            value: key
                        };
                    }
                );
                this.banks.sort((a, b) => {
                    const aIndex = bankIdsOrderedForSelection.indexOf(a.value),
                        bIndex = bankIdsOrderedForSelection.indexOf(b.value);
                    if (aIndex === -1 && (aIndex === -1) === (bIndex === -1)) {
                        return 0;
                    } else if (aIndex === -1) {
                        return 1;
                    } else if (bIndex === -1) {
                        return -1;
                    } else {
                        return aIndex - bIndex;
                    }
                });
                // this.banks = [{
                //     label: this.translate.translations[this.translate.currentLang].expressions.select + '...',
                //     value: '-1'
                // }].concat(
                //     Object.entries(changes['settings'].currentValue)
                //         .map(([key, val]) => {
                //             return {
                //                 label: 'name' in val
                //                     ? val['name']
                //                     : this.translate.instant('banks.' + key),
                //                 value: key
                //             };
                //         })
                // );
            }
        }
        if (
            changes['bankCredentialsGroup'] &&
            changes['bankCredentialsGroup'].currentValue &&
            (changes['bankCredentialsGroup'].currentValue as FormGroup).contains(
                'bank'
            ) &&
            (changes['bankCredentialsGroup'].currentValue as FormGroup).get('bank')
                .value
        ) {
            this.setBankControlsFor(
                (changes['bankCredentialsGroup'].currentValue as FormGroup).get('bank')
                    .value
            );
        }
    }

    ngOnInit(): void {
        if (this.bankCredentialsGroup === null) {
            this.bankCredentialsGroup = this.fb.group({
                bank: [null, [Validators.required]]
            });
        } else if (!this.bankCredentialsGroup.get('bank')) {
            this.bankCredentialsGroup.addControl(
                'bank',
                new FormControl(null, [Validators.required])
            );
        }
    }

    setBankControlsFor(bankSelection: any): void {
        if (bankSelection) {
            this.changedTrigger.emit(true);
        }
        this.selectedSettings =
            bankSelection === '122' && this.is_station
                ? this.translate.instant('122_station')
                : this.settings[bankSelection];

        if (this.foreignControls) {
            this.foreignControls.forEach((fc) =>
                this.bankCredentialsGroup.removeControl(fc.key)
            );
            this.bankCredentialsGroup.removeControl(this.otpTypeQuestionStub.key);
            if (this.otpCodeQuestionStub !== null) {
                this.bankCredentialsGroup.removeControl(this.otpCodeQuestionStub.key);
            }
        } else {
            Object.keys(this.bankCredentialsGroup.controls).forEach((key) => {
                if (key !== 'bank') {
                    this.bankCredentialsGroup.removeControl(key);
                }
            });
        }

        if (
            !this.selectedSettings ||
            !Object.keys(this.selectedSettings).length ||
            (bankSelection === '122' && !this.is_station)
        ) {
            this.foreignControls = null;
            return;
            // } else if (bankSelection === '157' || bankSelection === '158') {
            //     this.foreignControls = this.settings[this.selectedSettings.regularParent]
            //         .filter(fld => fld.key !== 'userCode')
            //         .map(fc => new QuestionBase(fc));
            //     this.selectedSettings.otpTypes = this.selectedSettings.otpTypes.filter(otpt => otpt.value !== 'message');
        } else {
            this.foreignControls = this.selectedSettings.map(
                (fc) => new QuestionBase(fc)
            );
            // this.bankForeignCreds.createControlsForBank(bankSelection);
        }

        if (this.foreignControls && this.foreignControls.length) {
            this.foreignControls.forEach((fc) =>
                this.bankCredentialsGroup.addControl(
                    fc.key,
                    this.bankForeignCreds.toFormControl(fc)
                )
            );
        }

        if (
            this.selectedSettings &&
            this.selectedSettings.otp &&
            this.selectedSettings.otpTypes
        ) {
            const defaultOtpTypeToSelect =
                bankSelection === '157' || bankSelection === '158'
                    ? 'application'
                    : this.selectedSettings.otpTypes[0].value;
            this.bankCredentialsGroup.addControl(
                this.otpTypeQuestionStub.key,
                new FormControl(defaultOtpTypeToSelect, [Validators.required])
            );

            this.attachOtpControls(defaultOtpTypeToSelect);
            this.bankCredentialsGroup
                .get('otpType')
                .valueChanges.subscribe((val) => this.attachOtpControls(val));
        }
    }

    attachOtpControls(otpType: string): void {
        this.bankCredentialsGroup.removeControl('otpcode');

        console.log('attachOtpControls: %o', otpType);
        const otpTypeSettings = this.selectedSettings.otpTypes.find(
            (otpt) => otpt.value === otpType
        );

        if (this.otpCodeQuestionStub !== null) {
            this.bankCredentialsGroup.removeControl(this.otpCodeQuestionStub.key);
        }

        if (otpTypeSettings.code) {
            this.otpCodeQuestionStub = new QuestionBase<string>(
                Object.assign(
                    {
                        key: 'otpcode',
                        controlType: 'text'
                    },
                    otpTypeSettings.code
                )
            );
            this.bankCredentialsGroup.addControl(
                this.otpCodeQuestionStub.key,
                this.bankForeignCreds.toFormControl(this.otpCodeQuestionStub)
            );
        } else if (otpTypeSettings.response) {
            this.otpCodeQuestionStub = new QuestionBase<string>(
                Object.assign(
                    {
                        key: 'otpcode',
                        controlType: 'text'
                    },
                    otpTypeSettings.response
                )
            );
            const controls = {};
            controls[this.otpCodeQuestionStub.key] =
                this.bankForeignCreds.toFormControl(this.otpCodeQuestionStub);
            this.bankCodeUpdateGroup = new FormGroup(controls);
        }
    }

    onOtpInitClick(otpType: string): void {
        this.otpInProgress = true;
    }

    onOtpCodeSubmit(): void {
        this.otpInProgress = false;
    }

    public getResults(): any | null {
        if (this.foreignControls === null) {
            return null;
        }
        const keyUsername = this.foreignControls[0].key,
            keyPassword = this.foreignControls.find(
                (fc) => fc.controlType === 'password'
            ).key,
            keyCode =
                this.foreignControls.length < 3
                    ? 'otpcode'
                    : this.foreignControls[1].controlType === 'password'
                        ? this.foreignControls[2].key
                        : this.foreignControls[1].key;
        const params = {
            bankAuto:
                keyCode === 'cellPhone'
                    ? null
                    : this.bankCredentialsGroup.contains(keyCode)
                        ? this.bankCredentialsGroup.get(keyCode).value
                        : null,
            bankId: this.useMaterialComponents
                ? this.bankCredentialsGroup.get('bank').value.value
                : this.bankCredentialsGroup.get('bank').value,
            bankPass: this.bankCredentialsGroup.get(keyPassword).value,
            bankUserName: this.bankCredentialsGroup.get(keyUsername).value
        };
        if (
            this.bankCredentialsGroup.get('cellPhone') &&
            this.bankCredentialsGroup.get('bank') &&
            this.bankCredentialsGroup.get('bank').value === '122'
        ) {
            params['cellPhone'] = this.bankCredentialsGroup.get('cellPhone').value;
        }
        if (
            this.is_station &&
            this.bankCredentialsGroup.get('bank') &&
            this.bankCredentialsGroup.get('bank').value === '122'
        ) {
            params['voiceMessage'] = this.voiceMessage;
        }
        return params;
    }
}
