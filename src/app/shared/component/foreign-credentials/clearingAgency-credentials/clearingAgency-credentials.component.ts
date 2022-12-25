import {Component, Input, OnChanges, OnInit, SimpleChange, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BankForeignCredentialsService, QuestionBase} from '../foreign-credentials.service';

@Component({
    selector: 'app-clearing-agency-foreign-credentials',
    templateUrl: './clearingAgency-credentials.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ClearingAgencyCredentialsComponent implements OnInit, OnChanges {
    public readonly credType: string = 'clearingAgency';
    public readonly credTypeDescParent: string = 'clearingAgencies';

    @Input() credentials: any;
    @Input() settings: any[];

    sources: { label: string; value: any }[];
    foreignControls: QuestionBase<string>[] = null;

    passwordHide = true;

    constructor(
        public translate: TranslateService,
        private fb: FormBuilder,
        private bankForeignCreds: BankForeignCredentialsService
    ) {
    }

    ngOnInit() {
        // debugger;
        if (this.credentials === null) {
            this.credentials = this.fb.group({});
        }

        if (!this.credentials.contains(this.credType)) {
            this.credentials.addControl(
                this.credType,
                new FormControl(null, [Validators.required])
            );
        }

        this.credentials
            .get(this.credType)
            .valueChanges.subscribe(() => this.rebuildCredentialsView());
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        // debugger;
        if (changes['settings']) {
            if (Object.keys(changes['settings'].currentValue).length === 0) {
                this.sources = [];
            } else {
                this.sources = Object.keys(changes['settings'].currentValue).map(
                    (key) => {
                        return {
                            label: this.translate.instant(
                                [this.credTypeDescParent, key].join('.')
                            ),
                            value: key
                        };
                    }
                );
            }
        }
        if (
            changes['credentials'] &&
            changes['credentials'].currentValue &&
            (changes['credentials'].currentValue as FormGroup).contains(
                this.credType
            ) &&
            (changes['credentials'].currentValue as FormGroup).get(this.credType)
                .value
        ) {
            this.rebuildCredentialsView();
        }
    }

    rebuildCredentialsView() {
        const selectedType =
            this.credentials && this.credentials.contains(this.credType)
                ? this.credentials.get(this.credType).value
                : null;

        if (!selectedType) {
            return;
        }

        if (this.foreignControls) {
            this.foreignControls.forEach((fc) =>
                this.credentials.removeControl(fc.key)
            );
        }

        const selectedSettings = this.settings[selectedType];
        if (!Array.isArray(selectedSettings) || selectedSettings.length < 1) {
            return;
        }

        this.foreignControls = selectedSettings.map((fc) => new QuestionBase(fc));
        if (this.foreignControls && this.foreignControls.length) {
            this.foreignControls.forEach((fc) =>
                this.credentials.addControl(
                    fc.key,
                    this.bankForeignCreds.toFormControl(fc)
                )
            );
        }
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
                    ? null
                    : this.foreignControls[1].controlType === 'password'
                        ? this.foreignControls[2].key
                        : this.foreignControls[1].key;

        return {
            bankAuto:
                keyCode !== null
                    ? this.credentials.get(keyCode).value
                    : this.credentials.get(this.credType).value === '90'
                        ? this.credentials.get(keyUsername).value
                        : null,
            bankId: this.credentials.get(this.credType).value,
            bankPass: this.credentials.get(keyPassword).value,
            bankUserName: this.credentials.get(keyUsername).value
        };
    }
}
