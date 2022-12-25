import {Component, Input, OnChanges, OnDestroy, SimpleChange, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {EditingType} from '../enums';
import {UserService} from '@app/core/user.service';
import {Calendar} from 'primeng/calendar';
import {filter, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';

@Component({
    selector: 'app-other-editor',
    templateUrl: './wire-cheque-other-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class OtherEditorComponent implements OnChanges, OnDestroy {
    private static readonly DEFAULT_TRANSTYPE_ID =
        'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
    EditingType = EditingType;

    @Input() form: any;
    @Input() companyTransTypes: any[];
    @Input() companyId: string;
    @Input() mode: EditingType | null = null;
    @Input() setDateFromMessage: boolean = false;

    fields: { name: string; control: FormControl; options?: any[] }[];

    get result() {
        const rslt = this.form.value;

        ['transTypeId', 'companyAccountId', 'biziboxMutavId'].forEach(
            (fldName: string) => {
                if (fldName in rslt && rslt[fldName] !== null) {
                    rslt[fldName] = rslt[fldName][fldName];
                }
            }
        );
        return rslt;
    }

    @Input() show_applyCategorySelectionToPastCntrl: any = false;

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
        asmachta: string;
        biziboxMutavId: string | { biziboxMutavId: string };
    };

    readonly today: Date;

    @ViewChild('transDateSelector', {read: Calendar})
    transDateSelector: Calendar;

    private applyingSource: boolean;

    private readonly destroyed$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    constructor(
        private fb: FormBuilder,
        public userService: UserService,
        private translateService: TranslateService
    ) {
        this.today = this.userService.appData.moment().toDate();
        this.fields = [
            {
                name: 'companyAccountId',
                control: this.fb.control(null, [Validators.required]) // ,
                // options:
            },
            {
                name: 'biziboxMutavId',
                control: this.fb.control(null) // ,
                // [Validators.required])
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
                options: ['Checks', 'BankTransfer', 'Other']
                    // options: Object.keys(this.translateService.instant('paymentTypes') as any)
                    .map((key) => {
                        return {
                            label: this.translateService.instant('paymentTypes.' + key),
                            value: key
                        };
                    })
            },
            // {
            //     name: 'autoUpdateTypeName',
            //     control: this.fb.control(
            //         'AVG_3_MONTHS',
            //         [Validators.required]),
            //     options: ['AVG_3_MONTHS', 'USER_DEFINED_TOTAL', 'LAST_BANK_TOTAL', 'USER_CURRENT_TOTAL'].map((val) => {
            //         return {
            //             label: this.translateService.instant('autoUpdateTypes.' + val),
            //             value: val
            //         };
            //     })
            // },
            // {
            //     name: 'transFrequencyName',
            //     control: this.fb.control(
            //         null,
            //         []),
            //     options: Object.entries(this.translateService.instant('transactionFrequencyTypes'))
            //         .map(([k, v]) => {
            //             return {
            //                 label: (v as any).text,
            //                 value: k
            //             };
            //         })
            // },
            {
                name: 'asmachta',
                control: this.fb.control(null, [Validators.pattern(/^[\d\-.]+$/)])
            },
            {
                name: 'transDate',
                control: new FormControl(new Date(), [Validators.required])
            },
            {
                name: 'total',
                control: this.fb.control(null, [
                    Validators.required,
                    Validators.pattern(/^[\d\-.]+$/)
                ])
            },
            {
                name: 'expirationDate',
                control: this.fb.control(null, [])
            }
        ];
    }

    ngOnChanges(changes: { [propKey: string]: SimpleChange }) {
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

                    if (fld.name === 'biziboxMutavId') {
                        fld.control.valueChanges
                            .pipe(
                                filter((val) => !!val && !this.applyingSource),
                                takeUntil(this.destroyed$)
                            )
                            .subscribe((val) => {
                                if (val) {
                                    this.form.patchValue({
                                        transName: [
                                            'העברה ',
                                            this.source.expence ? 'ל-' : 'מ-',
                                            val.accountMutavName
                                        ].join(''),
                                        transTypeId: this.companyTransTypes.find(
                                            (ctt) => ctt.transTypeId === val.transTypeId
                                        )
                                    });
                                } else if (
                                    !this.form.get('transTypeId').value ||
                                    this.form.get('transTypeId').value.transTypeId !==
                                    OtherEditorComponent.DEFAULT_TRANSTYPE_ID
                                ) {
                                    this.form
                                        .get('transTypeId')
                                        .setValue(
                                            this.companyTransTypes.find(
                                                (tt) =>
                                                    tt.transTypeId ===
                                                    OtherEditorComponent.DEFAULT_TRANSTYPE_ID
                                            )
                                        );
                                }
                                // debugger;
                            });
                    }
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
            this.applyingSource = true;

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
                this.form.get('total').setValue(Math.abs(this.source.total));
            }
            if (this.setDateFromMessage) {
                const originalDate =
                    (this.source as any).originalDate instanceof Date
                        ? (this.source as any).originalDate
                        : (this.source as any).originalDate > 0
                            ? new Date(+(this.source as any).originalDate)
                            : null;
                this.form.get('transDate').setValue(originalDate);
            }

            this.applyingSource = false;
        }
    }

    setControlsStateAndVisibility(): void {
        if (this.source && this.form) {
            [
                'companyAccountId',
                'paymentDesc',
                'transTypeId',
                'transName',
                'transDate',
                'asmachta',
                'total'
            ]
                .filter((fldName) => this.form.get(fldName) !== null)
                .forEach((fldName) => this.form.get(fldName).enable());
            // .forEach(fldName => {
            //     switch (fldName) {
            //         case 'transName':
            //         case 'transTypeId':
            //             if (this.mode === EditingType.Single) {
            //                 this.form.get(fldName).disable();
            //             } else {
            //                 this.form.get(fldName).enable();
            //             }
            //             break;
            //         default:
            //             this.form.get(fldName).disable();
            //             break;
            //     }
            // });
        }
    }

    shouldDisplay(fld: any/*fld: { name: string, control: FormControl, options?: any[] }*/): boolean {
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
}
