import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChange, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {EditingType} from '../enums';
import {Calendar} from 'primeng/calendar';
import {WeekDay} from '@angular/common';
import {Subscription} from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-slika-editor',
    templateUrl: './slika-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SlikaEditorComponent implements OnChanges, OnDestroy, OnInit {
    EditingType = EditingType;

    @Input() form: any;
    @Input() companyTransTypes: any[];
    @Input() companyId: string;
    @Input() mode: EditingType | null = null;
    @Input() show_applyCategorySelectionToPastCntrl: any = false;

    fields: { name: string; control: FormControl; options?: any[] }[];
    readonly frequencyDayOfMonth: {
        name: string;
        control: FormControl;
        options: { label: string; value: number }[];
    };
    readonly frequencyDayOfWeek: {
        name: string;
        control: FormControl;
        options: { label: string; value: string }[];
    };

    get result() {
        const rslt = this.form.value;
        // debugger;
        ['transTypeId', 'companyAccountId'].forEach((fldName: string) => {
            if (fldName in rslt && rslt[fldName] !== null) {
                rslt[fldName] = rslt[fldName][fldName];
            }
        });

        if (
            rslt['frequencyAutoUpdateTypeName'] === 'USER_DEFINED_TOTAL' &&
            ['MONTH', 'WEEK'].includes(rslt['transFrequencyName'])
        ) {
            rslt.frequencyDay = rslt['frequencyDay$' + rslt.transFrequencyName];
        }
        // if (rslt.autoUpdateTypeName && rslt.autoUpdateTypeName.includes('$')) {
        //     [rslt.autoUpdateTypeName, rslt.transFrequencyName] = rslt.autoUpdateTypeName.split('$');
        //     rslt.total = rslt['total$' + rslt.transFrequencyName];
        //     rslt.frequencyDay = rslt['frequencyDay$' + rslt.transFrequencyName];
        // }

        ['MONTH', 'WEEK'].forEach((freqName) => {
            // delete rslt['total$' + freqName];
            delete rslt['frequencyDay$' + freqName];
        });

        // if (rslt.autoUpdateTypeName === 'USER_CURRENT_TOTAL'
        //         && (!rslt.transFrequencyName || rslt.transFrequencyName === 'NONE')) {
        //     rslt.transFrequencyName = 'MONTH';
        // }

        rslt['autoUpdateTypeName'] = this.form.getRawValue()['autoUpdateTypeName'];

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

    readonly today;

    @ViewChild('transDateSelector', {read: Calendar})
    transDateSelector: Calendar;

    private valueChangeSubs: Array<Subscription>;

    constructor(
        private fb: FormBuilder,
        public userService: UserService,
        private translateService: TranslateService
    ) {
        this.today = this.userService.appData.moment().toDate();
        this.frequencyDayOfMonth = {
            name: 'frequencyDay$MONTH',
            control: this.fb.control(null, [Validators.required]),
            options: Array.from({length: 31}, (value, key) => key + 1).map((v) => {
                return {
                    label: String(v),
                    value: v
                };
            })
        };

        this.frequencyDayOfWeek = {
            name: 'frequencyDay$WEEK',
            control: this.fb.control(null, [Validators.required]),
            options: (
                this.translateService.instant('langCalendar.dayNames') as string[]
            )
                .slice(0, 5)
                .map((v, ind) => {
                    return {
                        label: v,
                        value: (WeekDay[ind] as string).toUpperCase()
                    };
                })
        };
    }

    ngOnInit() {

    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
        if (changes['form']) {
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
                    control: this.fb.control(null, []),
                    options: Object.entries(
                        this.translateService.instant('transactionFrequencyTypes')
                    )
                        .filter(([k, v]) => ['MONTH', 'WEEK', 'DAY'].includes(k))
                        .map(([k, v]) => {
                            return {
                                label: (v as any).text,
                                value: k
                            };
                        })
                },
                {
                    name: 'autoUpdateTypeName',
                    control: this.fb.control('AVG_3_MONTHS', [Validators.required]),
                    options: [
                        'AVG_3_MONTHS',
                        'USER_DEFINED_TOTAL',
                        'USER_CURRENT_TOTAL'
                    ].map((val, idx) => {
                        switch (val) {
                            case 'USER_DEFINED_TOTAL':
                                return {
                                    label: 'קבוע', // idx === 1 ? 'קבוע, חודשי:' : 'קבוע, שבועי:',
                                    value: val
                                    // val + (val !== 'USER_DEFINED_TOTAL' ? ''
                                    // : (idx === 1 ? '$MONTH' : '$WEEK'))
                                };
                            case 'USER_CURRENT_TOTAL':
                                return {
                                    label: 'לפי זיכויים בפועל',
                                    value: val
                                };
                            default:
                                return {
                                    label: this.translateService.instant('autoUpdateTypes.' + val),
                                    value: val
                                };
                        }
                    })
                },
                // {
                //     name: 'total$MONTH',
                //     control: this.fb.control(
                //         null,
                //         [Validators.pattern(/^[\d\-.]+$/)])
                // },
                // {
                //     name: 'total$WEEK',
                //     control: this.fb.control(
                //         null,
                //         [Validators.pattern(/^[\d\-.]+$/)])
                // },
                // {
                //     name: 'asmachta',
                //     control: this.fb.control(
                //         null,
                //         [Validators.pattern(/^[\d\-.]+$/)])
                // },
                {
                    name: 'transDate',
                    control: new FormControl(new Date(), [Validators.required])
                },
                // {
                //     name: 'expirationDate',
                //     control: this.fb.control(
                //         null,
                //         [])
                // }
                {
                    name: 'total',
                    control: this.fb.control(null, [
                        Validators.required,
                        Validators.pattern(/^[\d\-.]+$/)
                    ])
                },
                {
                    name: 'frequencyAutoUpdateTypeName',
                    control: this.fb.control(
                        null, // 'AVG_3_MONTHS',
                        [Validators.required]
                    )
                }
            ];
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

    ngOnDestroy(): void {
        if (this.valueChangeSubs) {
            this.valueChangeSubs.forEach((sub) => sub.unsubscribe());
        }
    }

    private populateForm(): void {
        if (this.form) {
            [
                this.frequencyDayOfMonth,
                this.frequencyDayOfWeek,
                ...this.fields
            ].forEach((fld) => {
                if (!this.form.contains(fld.name)) {
                    this.form.addControl(fld.name, fld.control);
                } else {
                    this.form.registerControl(fld.name, fld.control);
                }
            });

            if (this.valueChangeSubs) {
                this.valueChangeSubs.forEach((sub) => sub.unsubscribe());
            }

            this.valueChangeSubs = [
                this.form
                    .get('autoUpdateTypeName')
                    .valueChanges.subscribe((val: string) => {

                    if (this.form.controls['transFrequencyName']) { //this.form.get('frequencyAutoUpdateTypeName').value === 'USER_DEFINED_TOTAL'
                        if (val === 'AVG_3_MONTHS' || val === 'USER_DEFINED_TOTAL') {
                            this.form.controls['transFrequencyName'].addValidators([Validators.required]);
                        } else {
                            this.form.controls['transFrequencyName'].clearValidators();
                        }
                        this.form.controls['transFrequencyName'].updateValueAndValidity();
                    }

                    if (this.mode === EditingType.Single) {
                        this.form.get('total').enable();
                    } else {
                        // debugger;
                        if (val === 'USER_DEFINED_TOTAL') {
                            this.form.get('total').enable();
                        } else {
                            this.form.get('total').disable();
                        }

                        // if (val === 'USER_CURRENT_TOTAL') {
                        //     this.form.get('transFrequencyName').disable();
                        // } else {
                        //     this.form.get('transFrequencyName').enable();
                        // }
                    }
                }),
                this.form
                    .get('transFrequencyName')
                    .valueChanges.subscribe((val: string) => {
                    ['MONTH', 'WEEK']
                        .filter((freq) => 'frequencyDay$' + freq in this.form.controls)
                        .forEach((freq) => {
                            // debugger;
                            if (freq !== val) {
                                this.form.get('frequencyDay$' + freq).disable();
                            } else {
                                this.form.get('frequencyDay$' + freq).enable();
                            }
                        });
                })
            ];


            // this.form.get('autoUpdateTypeName').valueChanges
            //     .subscribe((val: string) => {
            //         const splitted = val ? val.split('$') : [];
            //         // console.log('val is %o', val);
            //         ['MONTH', 'WEEK']
            //             .filter(freq => this.form.get('total$' + freq) !== null)
            //             .forEach(freq => {
            //                 const controls = [
            //                     this.form.get('total$' + freq),
            //                     this.form.get('frequencyDay$' + freq)
            //                 ];
            //                 if (splitted.length > 1 && splitted[1] === freq) {
            //                     controls.forEach((cntrl, idx) => cntrl.setValidators(
            //                         idx === 0 ? [Validators.required, Validators.pattern(/^[\d\-.]+$/)]
            //                             : [Validators.required]
            //                     ));
            //                 } else {
            //                     controls.forEach(cntrl => cntrl.clearValidators());
            //                 }
            //                 controls.forEach(cntrl => cntrl.updateValueAndValidity());
            //             });
            //
            //         // this.form.get('transFrequencyName').setValue(splitted.length > 1
            //         //     ? splitted[1] : null);
            //
            // //         if (splitted.length > 1) {
            // //             this.form.get('total').enable();
            // //         } else {
            // //             this.form.get('total').disable();
            // //         }
            //     });
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
                    (acc: any) => acc.companyAccountId === this.source.companyAccountId
                );
                this.form.get('companyAccountId').setValue(accToSelect);
            }

            if (this.form.get('transTypeId') !== null) {
                const catToSelect = this.companyTransTypes.find(
                    (cc) => cc.transTypeId === this.source.transTypeId
                );
                this.form.get('transTypeId').setValue(catToSelect);
            }

            ['MONTH', 'WEEK'].forEach((freq) => {
                // this.form.get('total$' + freq).reset(null);
                this.form.get('frequencyDay$' + freq).reset(null);
            });
            if (
                // this.source.autoUpdateTypeName === 'USER_DEFINED_TOTAL'
                // &&
                ['MONTH', 'WEEK'].includes(this.source.transFrequencyName)
            ) {
                // this.form.get('autoUpdateTypeName').setValue(this.source.autoUpdateTypeName + '$' + this.source.transFrequencyName);
                // this.form.get('total$' + this.source.transFrequencyName).setValue(Math.abs(this.source.total));
                this.form
                    .get('frequencyDay$' + this.source.transFrequencyName)
                    .setValue(this.source.frequencyDay);
            }

            if (this.source.transFrequencyName === 'NONE') {
                this.form.get('autoUpdateTypeName').setValue(null);
            }

            if (this.source.transFrequencyName === '') {
                this.form.get('transFrequencyName').patchValue(null);
                if (this.fields) {
                    this.fields.find(it => it.name === 'transFrequencyName').control.patchValue(null);
                }
            }

        }
    }

    setControlsStateAndVisibility(): void {
        if (this.source && this.form) {
            // (this.mode === EditingType.Series
            //     ? ['companyAccountId', 'paymentDesc', 'transFrequencyName', 'transDate']
            //     : ['companyAccountId', 'paymentDesc', 'transFrequencyName', 'transName', 'transDate', 'asmachta'])
            //     .forEach(fldName => this.form.get(fldName).disable());
            [
                'frequencyAutoUpdateTypeName',
                'companyAccountId',
                'paymentDesc',
                'transFrequencyName',
                'transName',
                'transDate',
                'transTypeId',
                'total',
                'autoUpdateTypeName', // ...['MONTH', 'WEEK'].map(freq => 'total$' + freq)
                ...['MONTH', 'WEEK'].map((freq) => 'frequencyDay$' + freq)
            ]
                .filter((fldName) => this.form.get(fldName) !== null)
                .forEach((fldName) => {
                    switch (fldName) {
                        case 'frequencyAutoUpdateTypeName':
                        case 'transName':
                        case 'transTypeId':
                            if (this.mode === EditingType.Single) {
                                this.form.get(fldName).disable();
                            } else {
                                this.form.get(fldName).enable();
                            }
                            break;
                        case 'autoUpdateTypeName':
                            // if (this.form.get('frequencyAutoUpdateTypeName').value === 'USER_DEFINED_TOTAL') {
                            //     debugger
                            //     if (this.form.get('autoUpdateTypeName').value === 'AVG_3_MONTHS' || this.form.get('autoUpdateTypeName').value === 'USER_DEFINED_TOTAL') {
                            //         this.form.controls['transFrequencyName'].addValidators([Validators.required]);
                            //     } else {
                            //         this.form.controls['transFrequencyName'].clearValidators();
                            //     }
                            //     this.form.controls['transFrequencyName'].updateValueAndValidity();
                            // }
                            if (
                                this.mode === EditingType.Single ||
                                this.form.get('frequencyAutoUpdateTypeName').value !==
                                'USER_DEFINED_TOTAL'
                            ) {
                                this.form.get(fldName).disable();
                            } else {
                                this.form.get(fldName).enable();
                            }
                            break;
                        case 'total':
                            if (
                                this.mode === EditingType.Single ||
                                (this.form.get('frequencyAutoUpdateTypeName').value ===
                                    'USER_DEFINED_TOTAL' &&
                                    this.form.get('autoUpdateTypeName').value ===
                                    'USER_DEFINED_TOTAL')
                            ) {
                                this.form.get(fldName).enable();
                            } else {
                                this.form.get(fldName).disable();
                            }
                            break;
                        case 'transFrequencyName':
                            this.form.get(fldName).enable();
                            // if (
                            //     this.mode === EditingType.Single ||
                            //     this.form.get('frequencyAutoUpdateTypeName').value !==
                            //     'USER_DEFINED_TOTAL' ||
                            //     this.form.get('autoUpdateTypeName').value ===
                            //     'USER_CURRENT_TOTAL'
                            // ) {
                            //     this.form.get(fldName).disable();
                            // } else {
                            //     this.form.get(fldName).enable();
                            // }
                            break;
                        default:
                            this.form.get(fldName).disable();
                            break;
                    }

                    if (fldName.includes('$')) {
                        // debugger;
                        if (
                            this.mode === EditingType.Series &&
                            this.form.get('frequencyAutoUpdateTypeName').value ===
                            'USER_DEFINED_TOTAL' &&
                            fldName.endsWith('$' + this.form.get('transFrequencyName').value)
                        ) {
                            this.form.get(fldName).enable();
                        } else {
                            this.form.get(fldName).disable();
                        }
                    }
                });
            // debugger;
        }
    }

    setDateOpt(eve: any) {
        this.form.get('transFrequencyName').patchValue(eve.value);
    }

    shouldDisplay(fld: any): boolean {
        return (
            this.mode === EditingType.Series
                ? [
                    'companyAccountId',
                    'transName',
                    'transTypeId',
                    'paymentDesc',
                    'autoUpdateTypeName',
                    'transFrequencyName'
                ]
                : [
                    'companyAccountId',
                    'transName',
                    'transTypeId',
                    'paymentDesc',
                    'transDate',
                    'total',
                    'asmachta',
                    'transDate'
                ]
        ).includes(fld.name);
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

    frequencyAutoUpdateTypeNameUserChange(
        val: 'AVG_3_MONTHS' | 'USER_DEFINED_TOTAL'
    ) {
        if (val === 'AVG_3_MONTHS') {
            this.applySource();
            this.form.get('autoUpdateTypeName').setValue(val);
            // } else {
            // if (this.source.autoUpdateTypeName !== 'USER_DEFINED_TOTAL') {
            //     this.form.get('transDate').setValue('');
            // }
        }
        this.form.get('frequencyAutoUpdateTypeName').setValue(val);
        this.setControlsStateAndVisibility();
        // debugger;
    }
}



