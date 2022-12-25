import {Component, Input, OnChanges, SimpleChange, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {EditingType} from '../enums';
import {Calendar} from 'primeng/calendar';

@Component({
    selector: 'app-directd-editor',
    templateUrl: './directd-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class DirectdEditorComponent implements OnChanges {
    EditingType = EditingType;

    @Input() form: any;
    @Input() companyTransTypes: any[];
    @Input() companyId: string;
    @Input() mode: EditingType | null = null;
    @Input() show_applyCategorySelectionToPastCntrl: any = false;

    fields: { name: string; control: FormControl; options?: any[] }[];

    get result() {
        const rslt = Object.assign(Object.create(null), this.form.value);

        ['endDateOn', 'endDateTimes'].forEach((k) => delete rslt[k]);

        ['transTypeId', 'companyAccountId'].forEach((fldName: string) => {
            if (fldName in rslt && rslt[fldName] !== null) {
                rslt[fldName] = rslt[fldName][fldName];
            }
        });

        if (this.form.get('autoUpdateTypeName').value === 'USER_DEFINED_TOTAL') {
            Object.assign(rslt, {
                expirationDate: this.selectedExpirationDate
            });
        }
        let transFrequencyNameResult = this.form.get('transFrequencyName').value;
        if (
            this.source.transFrequencyName === 'MULTIPLE' &&
            this.form.get('transFrequencyName').value === 'MONTH' &&
            Math.abs(this.form.get('total').value) === Math.abs(this.source.total)
        ) {
            transFrequencyNameResult = 'MULTIPLE';
        }
        rslt.transFrequencyName = transFrequencyNameResult;
        if (
            this.source.transFrequencyName === 'MULTIPLE' &&
            this.form.get('transFrequencyName').value === 'MONTH' &&
            Math.abs(this.form.get('total').value) !== Math.abs(this.source.total)
        ) {
            rslt['frequencyDay'] = rslt.transDate.getDate().toString();
        }
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

    readonly today = new Date();

    @ViewChild('transDateSelector', {read: Calendar})
    transDateSelector: Calendar;

    readonly endDateOn: FormControl;
    readonly endDateTimes: FormControl;

    private get selectedExpirationDate(): Date | null {
        let transDate: Date | null;
        if (this.form.get('expirationDate').value === 'none') {
            transDate = null;
        } else if (this.form.get('expirationDate').value === 'times') {
            const fromDate = this.form.get('transDate').value as Date;
            let times = +this.form.get('endDateTimes').value;
            transDate = new Date(fromDate);
            transDate.setHours(0, 0, 0, 0);
            const now = new Date();

            while (transDate < now) {
                switch (this.form.get('transFrequencyName').value) {
                    case 'DAY':
                        transDate.setDate(transDate.getDate() + 1);
                        break;
                    case 'WEEK':
                        transDate.setDate(transDate.getDate() + 7);
                        break;
                    case 'MONTH':
                        transDate.setMonth(transDate.getMonth() + 1);
                        break;
                    case 'TWO_MONTHS':
                        transDate.setMonth(transDate.getMonth() + 2);
                        break;
                    case 'QUARTER':
                        transDate.setMonth(transDate.getMonth() + 4);
                        break;
                }
            }

            if (--times > 0) {
                switch (this.form.get('transFrequencyName').value) {
                    case 'DAY':
                        transDate.setDate(transDate.getDate() + times);
                        break;
                    case 'WEEK':
                        transDate.setDate(transDate.getDate() + times * 7);
                        break;
                    case 'MONTH':
                        transDate.setMonth(transDate.getMonth() + times);
                        break;
                    case 'TWO_MONTHS':
                        transDate.setMonth(transDate.getMonth() + times * 2);
                        break;
                    case 'QUARTER':
                        transDate.setMonth(transDate.getMonth() + times * 4);
                        break;
                    // case 'YEAR':
                    //     transDate.setFullYear(transDate.getFullYear() + times);
                    //     break;
                }
            }
        } else {
            transDate = this.form.get('endDateOn').value as Date;
        }

        return transDate;
    }

    constructor(
        private fb: FormBuilder,
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
                    // .filter(([k]) => 'YEAR' !== k)
                    .filter(([k]) => !['MULTIPLE', 'YEAR'].includes(k))
                    .map(([k, v]) => {
                        return {
                            label: (v as any).text,
                            value: k
                        };
                    })
            },
            {
                name: 'transDate',
                control: new FormControl(new Date(), [Validators.required])
            },
            {
                name: 'expirationDate',
                // control: this.fb.control(
                //     null,
                //     [])
                control: this.fb.control('none', [Validators.required]),
                options: [
                    {
                        label: this.translateService.instant('endDate.none'),
                        value: 'none'
                    },
                    {
                        label: this.translateService.instant('endDate.times'),
                        value: 'times'
                    },
                    {
                        label: this.translateService.instant('endDate.on'),
                        value: 'on'
                    }
                ]
            },
            {
                name: 'autoUpdateTypeName',
                control: this.fb.control('AVG_3_MONTHS', [Validators.required]),
                options: ['AVG_3_MONTHS', 'LAST_BANK_TOTAL', 'USER_DEFINED_TOTAL'].map(
                    (val) => {
                        return {
                            label:
                                val === 'USER_DEFINED_TOTAL'
                                    ? 'קבוע'
                                    : this.translateService.instant('autoUpdateTypes.' + val),
                            value: val
                        };
                    }
                )
            },
            {
                name: 'total',
                control: this.fb.control(null, [
                    Validators.required,
                    Validators.pattern(/^[\d\-.]+$/)
                ])
            }
        ];

        this.endDateOn = new FormControl(null, []);
        this.endDateTimes = new FormControl(null, [
            Validators.pattern(/\d+/),
            Validators.min(1)
        ]);
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

            if (!this.form.contains('endDateOn')) {
                this.form.addControl('endDateOn', this.endDateOn);
            }
            if (!this.form.contains('endDateTimes')) {
                this.form.addControl('endDateTimes', this.endDateTimes);
            }
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

            if (!this.source.expirationDate) {
                this.form.get('expirationDate').setValue('none');
                this.endDateOn.setValue(null);
            } else {
                this.form.get('expirationDate').setValue('on');
                this.endDateOn.setValue(this.source.expirationDate);
            }

            if (
                this.mode === EditingType.Series &&
                this.source.autoUpdateTypeName !== 'USER_DEFINED_TOTAL' &&
                this.form.get('autoUpdateTypeName').value === 'USER_DEFINED_TOTAL'
            ) {
                this.form.get('transDate').setValue('');
            }

            if (this.source.transFrequencyName === 'MULTIPLE') {
                this.form.get('transFrequencyName').setValue('MONTH');
            }
        }
    }

    setControlsStateAndVisibility(): void {
        if (this.source && this.form) {
            [
                'companyAccountId',
                'transName',
                'transTypeId',
                'paymentDesc',
                'transFrequencyName',
                'transDate',
                'expirationDate',
                'autoUpdateTypeName',
                'total'
            ]
                .filter((fldName) => this.form.get(fldName) !== null)
                .forEach((fldName) => {
                    switch (fldName) {
                        case 'autoUpdateTypeName':
                        case 'transTypeId':
                        case 'transName':
                            if (this.mode === EditingType.Series) {
                                this.form.get(fldName).enable();
                            } else {
                                this.form.get(fldName).disable();
                            }
                            break;
                        case 'transDate':
                            if (this.mode === EditingType.Single) {
                                this.form.get(fldName).enable();
                            } else {
                                if (
                                    (this.form.get('autoUpdateTypeName').value ===
                                        'AVG_3_MONTHS') !==
                                    this.form.get(fldName).disabled
                                ) {
                                    if (
                                        this.form.get('autoUpdateTypeName').value === 'AVG_3_MONTHS'
                                    ) {
                                        this.form.get(fldName).disable();
                                    } else {
                                        this.form.get(fldName).enable();
                                    }
                                }
                                // this.form.get(fldName).disable();
                            }
                            break;
                        case 'transFrequencyName':
                        case 'expirationDate':
                            if (
                                (this.form.get('autoUpdateTypeName').value ===
                                    'AVG_3_MONTHS') !==
                                this.form.get(fldName).disabled
                            ) {
                                if (
                                    this.form.get('autoUpdateTypeName').value === 'AVG_3_MONTHS'
                                ) {
                                    this.form.get(fldName).disable();
                                } else {
                                    this.form.get(fldName).enable();
                                }
                            }
                            break;
                        case 'total':
                            this.form.get(fldName).enable();
                            break;
                        default:
                            this.form.get(fldName).disable();
                            break;
                    }
                });
        }
    }

    shouldDisplay(fld: any): boolean {
        if (
            (fld.name === 'autoUpdateTypeName' && this.mode === EditingType.Single) ||
            (fld.name === 'transFrequencyName' && this.mode === EditingType.Single) ||
            (fld.name === 'expirationDate' && this.mode === EditingType.Single)
            /*|| (fld.name === 'total' && this.mode === EditingType.Series)*/
        ) {
            return false;
        }

        return true;
        // return (this.mode === EditingType.Series
        //     ? ['companyAccountId', 'transName', 'transTypeId', 'paymentDesc', 'autoUpdateTypeName']
        //     :  ['companyAccountId', 'transName', 'transTypeId', 'paymentDesc', 'transDate', 'total', 'asmachta', 'transDate'])
        //         .includes(fld.name);
    }

    scrollTillSelectable() {
        const startOfMinMonth = new Date(
            this.transDateSelector.minDate.getFullYear(),
            this.transDateSelector.minDate.getMonth(),
            1
        );
        while (
            new Date(
                this.transDateSelector.currentYear,
                this.transDateSelector.currentMonth,
                1
            ) < startOfMinMonth
            ) {
            this.transDateSelector.navForward(document.createEvent('Event'));
        }
    }

    autoUpdateTypeNameUserChange(val: 'AVG_3_MONTHS' | 'USER_DEFINED_TOTAL') {
        if (val === 'AVG_3_MONTHS') {
            this.applySource();
        } else {
            if (this.source.autoUpdateTypeName !== 'USER_DEFINED_TOTAL') {
                this.form.get('transDate').setValue('');
            }
        }
        this.form.get('autoUpdateTypeName').setValue(val);
        this.setControlsStateAndVisibility();
    }
}
