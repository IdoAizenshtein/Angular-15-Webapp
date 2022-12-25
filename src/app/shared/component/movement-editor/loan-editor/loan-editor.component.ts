import {Component, Input, OnChanges, SimpleChange, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {EditingType} from '../enums';

@Component({
    selector: 'app-loan-editor',
    templateUrl: './loan-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class LoanEditorComponent implements OnChanges {
    EditingType = EditingType;

    @Input() form: any;
    @Input() companyTransTypes: any[];
    @Input() companyId: string;
    @Input() mode: EditingType | null = null;
    @Input() show_applyCategorySelectionToPastCntrl: any = false;

    fields: { name: string; control: FormControl; options?: any[] }[];

    get result() {
        const rslt = this.form.value;

        ['transTypeId', 'companyAccountId'].forEach((fldName: string) => {
            if (fldName in rslt && rslt[fldName] !== null) {
                rslt[fldName] = rslt[fldName][fldName];
            }
        });
        return rslt;
    }

    @Input() source: {
        autoUpdateTypeName: string;
        companyAccountId: string;
        expence: boolean;
        expirationDate: Date | number | null;
        frequencyDay: string;
        lastBankDate: Date | number | null;
        lastBankTotal: number | null;
        paymentDesc: string;
        targetType: string;
        total: number;
        transDate: Date | number;
        transFrequencyName: string;
        transId: string;
        transName: string;
        transTypeId: string;
        updatedBy: string;
    };

    constructor(
        public fb: FormBuilder,
        public userService: UserService,
        private translateService: TranslateService
    ) {
        this.fields = [
            {
                name: 'companyAccountId',
                control: this.fb.control(null, [Validators.required]) // ,
                // options:
            },
            {
                name: 'transName',
                control: this.fb.control(null, [Validators.required])
            },
            {
                name: 'transTypeId',
                control: this.fb.control(null, [Validators.required])
            },
            {
                name: 'paymentDesc',
                control: this.fb.control(null, [Validators.required]),
                // options: ['Checks', 'BankTransfer', 'Other']
                options: Object.keys(
                    this.translateService.instant('paymentTypes') as any
                ).map((val) => {
                    return {
                        label: this.translateService.instant('paymentTypes.' + val),
                        value: val
                    };
                })
            },
            {
                name: 'transFrequencyName',
                control: this.fb.control('MONTH', [Validators.required]),
                options: Object.entries(
                    this.translateService.instant('transactionFrequencyTypes')
                )
                    .filter(([k]) => !['MULTIPLE', 'YEAR'].includes(k))
                    .map(([k, v]) => {
                        return {
                            label: (v as any).text,
                            value: k
                        };
                    })
            },
            {
                name: 'total',
                control: this.fb.control(null, [
                    Validators.required,
                    Validators.pattern(/^[\d\-.]+$/)
                ])
            },
            {
                name: 'transDate',
                control: new FormControl(new Date(), [Validators.required])
            },
            {
                name: 'expirationDate',
                control: this.fb.control(null, [])
            }
        ];
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        // debugger;
        if (changes['form']) {
            this.populateForm();
        }

        if (changes['source']) {
            this.applySource();
            this.setControlsStateAndVisibility();
        }

        if (changes['mode']) {
            this.setControlsStateAndVisibility();
        }
    }

    private populateForm(): void {
        if (this.form) {
            this.fields.forEach((fld) => {
                if (!this.form.contains(fld.name)) {
                    this.form.addControl(fld.name, fld.control);
                } else {
                    this.form.registerControl(fld.name, fld.control);
                }
            });
        }
    }

    reset() {
        if (this.form) {
            ['transName', 'total']
                .filter((fldName) => this.form.contains(fldName))
                .forEach((fldName: string) => {
                    this.form.get(fldName).reset();
                });
        }
    }

    // validateSum(e) {
    //     const str = String.fromCharCode(e.which);
    //     if (!str) {
    //         return;
    //     }
    //
    //     if (!/^[\d.]$/.test(str)) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         return false;
    //     }
    //
    //     return true;
    // }
    //
    // validateTimes(e) {
    //     const str = String.fromCharCode(e.which);
    //     if (!str) {
    //         return;
    //     }
    //
    //     if (!/^[\d]$/.test(str)) {
    //         e.preventDefault();
    //         e.stopPropagation();
    //         return false;
    //     }
    //
    //     return true;
    // }

    private applySource(): void {
        if (this.source && this.form) {
            this.form.patchValue(this.source, {
                onlySelf: true
            });

            if (this.form.get('companyAccountId') !== null) {
                const accToSelect = this.userService.appData.userData.accounts.find(
                    (acc:any) => acc.companyAccountId === this.source.companyAccountId
                );
                this.form.get('companyAccountId').setValue(accToSelect);
            }

            if (this.form.get('transTypeId') !== null) {
                const catToSelect = this.companyTransTypes.find(
                    (cc) => cc.transTypeId === this.source.transTypeId
                );
                this.form.get('transTypeId').setValue(catToSelect);
            }

            if (this.form.get('total') !== null) {
                this.form
                    .get('total')
                    .setValue(this.source.total ? Math.abs(this.source.total) : null);
            }

            // const startDate = this.source.transDate instanceof Date
            //     ? this.source.transDate
            //     : this.source.transDate > 0
            //         ? new Date(+this.source.transDate)
            //         : null;
            // const endDate = this.source.expirationDate instanceof Date
            //     ? this.source.expirationDate
            //     : this.source.expirationDate > 0
            //         ? new Date(+this.source.expirationDate)
            //         : null;
            //
            // if (this.form.get('transDate') !== null) {
            //     this.form.get('transDate').setValue(startDate);
            // }
            //
            // if (this.form.get('expirationDate') !== null) {
            //     this.form.get('expirationDate').setValue(endDate);
            // }
        }
    }

    setControlsStateAndVisibility(): void {
        if (this.source && this.form) {
            [
                'companyAccountId',
                'paymentDesc',
                'transFrequencyName',
                'total',
                'transDate',
                'expirationDate'
            ].forEach((fldName) => this.form.get(fldName).disable());

            if (this.mode === EditingType.Single) {
                this.form.setErrors({
                    nonEditable: true
                });
            }
        }
    }
}
