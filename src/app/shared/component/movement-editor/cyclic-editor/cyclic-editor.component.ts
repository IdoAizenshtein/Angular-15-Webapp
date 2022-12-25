import {Component, Input, OnChanges, OnDestroy, SimpleChange, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormControl, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {EditingType} from '../enums';
import {Calendar} from 'primeng/calendar';
import {filter, takeUntil} from 'rxjs/operators';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {
    BeneficiaryMultiSelectComponent
} from '../../beneficiary/beneficiary-multi-select/beneficiary-multi-select.component';
import {BeneficiaryService} from '@app/core/beneficiary.service';
import {Subject} from 'rxjs/internal/Subject';

@Component({
    selector: 'app-cyclic-editor',
    templateUrl: './cyclic-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CyclicEditorComponent implements OnChanges, OnDestroy {
    private static readonly DEFAULT_TRANSTYPE_ID =
        'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
    EditingType = EditingType;

    @Input() form: any;
    @Input() companyTransTypes: any[];
    @Input() companyId: string;
    @Input() mode: EditingType | null = null;
    @Input() dontAllowAddition: any = false;
    @Input() show_applyCategorySelectionToPastCntrl: any = false;

    fields: { name: string; control: FormControl; options?: any[] }[];

    // readonly dayNamesDropdownModel: { label: string, value: string }[];
    readonly endDateOn: FormControl;
    readonly endDateTimes: FormControl;

    @ViewChild('beneficiaryMultiSelectComponent', {
        read: BeneficiaryMultiSelectComponent
    })
    beneficiaryMultiSelectComponent: BeneficiaryMultiSelectComponent;
    readonly multipleCategoriesId = '00000000-0000-0000-0000-000000000000';

    private get selectedExpirationDate(): Date | null {
        let transDate: Date | null;
        if (this.form.get('endDate').value === 'none') {
            transDate = null;
        } else if (this.form.get('endDate').value === 'times') {
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

    get result(): {
        autoUpdateTypeName: string | null;
        companyAccountId: string | null;
        expirationDate: Date | null;
        companyId: string | null;
        paymentDesc: string | null;
        targetType: string;
        total: number | null;
        transDate: Date | null;
        transFrequencyName: string;
        transName: string;
        transTypeId: string;
        asmachta: string | null;
        mutavArray: Array<{
            biziboxMutavId: string;
            total: number;
            transTypeId: string;
            applyTransTypeRetroactively?: boolean;
        }>;
    } {
        const mutavArrayResult =
            this.beneficiaryService.rebuildBeneficiariaryArrayForUpdate(
                this.source,
                this.form.getRawValue().mutavArray
            ); // this.form.get('mutavArray').value
        if (
            Array.isArray(mutavArrayResult) &&
            this.source.transId &&
            this.mode === EditingType.Series
        ) {
            mutavArrayResult.forEach((bnfR: any) => {
                bnfR.updateType = bnfR.applyTransTypeRetroactively
                    ? 'future+matched'
                    : 'future';
            });
        }

        const result = {
            cash: this.form.get('cash').value,
            autoUpdateTypeName:
                this.calculateAutoUpdateTypeCntrl.value === true
                    ? 'AVG_3_MONTHS'
                    : 'USER_DEFINED_TOTAL',
            // this.source.fromRecommendation
            // ? (this.calculateAutoUpdateTypeCntrl.value === true
            //     ? 'AVG_3_MONTHS' : 'USER_DEFINED_TOTAL')
            // : this.form.get('autoUpdateTypeName').value,
            asmachta: this.form.get('asmachta').value,
            companyAccountId:
            this.form.get('companyAccountId').value.companyAccountId,
            expirationDate: this.selectedExpirationDate,
            companyId: this.companyId,
            paymentDesc: this.form.get('paymentDesc').value,
            targetType: 'CYCLIC_TRANS',
            total: this.form.get('total').value,
            transDate: this.form.get('transDate').value as Date,
            transFrequencyName: this.form.get('transFrequencyName').value,
            transName: this.form.get('transName').value,
            transTypeId: this.form.get('transTypeId').value
                ? this.form.get('transTypeId').value.transTypeId
                : null,
            mutavArray: mutavArrayResult
        };
        if (
            this.source.transFrequencyName === 'MULTIPLE' &&
            this.mode === EditingType.Series &&
            this.calculateAutoUpdateTypeCntrl.value
        ) {
            result['transFrequencyName'] = 'MULTIPLE';
        }
        if (
            this.source.transFrequencyName === 'MULTIPLE' &&
            this.form.get('transFrequencyName').value === 'MONTH' &&
            this.mode === EditingType.Series &&
            !this.calculateAutoUpdateTypeCntrl.value
        ) {
            result['transFrequencyName'] = 'MONTH';
            result['frequencyDay'] = result.transDate.getDate().toString();
        }
        console.log(result);
        // if ((this.form.get('transFrequencyName').value !== this.source.transFrequencyName) || (Math.abs(this.form.get('total').value) !== Math.abs(this.source.total))) {
        //     result['autoUpdateTypeName'] = 'USER_DEFINED_TOTAL';
        // }
        return result;
    }

    @Input() source: {
        fromRecommendation?: any;
        paymentDescOriginal?: any;
        calculateAutoUpdateTypeCntrl?: boolean;
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
        checkboxUnLocked?: boolean;
        isUnion?: boolean;
        transDate: Date | number;
        transFrequencyName: string;
        transId: string;
        transName: string;
        transTypeId: string;
        updatedBy: string;
        cash: any;
        // biziboxMutavId: string | {biziboxMutavId: string}
        biziboxMutavId: string;
        mutavArray: Array<{
            biziboxMutavId: string;
            total: number;
            transTypeId: string;
            transId: string;
        }>; // ,
        // fromRecommendation: boolean
    };

    readonly today;

    @ViewChild('transDateSelector', {read: Calendar})
    transDateSelector: Calendar;

    private applyingSource: boolean;
    readonly calculateAutoUpdateTypeCntrl = new FormControl(true);
    readonly applyCategorySelectionToPastCntrl = new FormControl(false);

    private readonly destroyed$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    constructor(
        private fb: FormBuilder,
        public userService: UserService,
        private translateService: TranslateService,
        public restCommonService: RestCommonService,
        private beneficiaryService: BeneficiaryService
    ) {
        this.userService.appData.updateCyclicPast = false;
        // this.dayNamesDropdownModel = (this.translateService.instant('langCalendar.dayNames') as string[])
        //     .slice(0, 6)
        //     .map((dayName) => {
        //         return {
        //             label: dayName,
        //             value: dayName
        //         };
        //     });
        this.today = this.userService.appData.moment().toDate();
        this.fields = [
            {
                name: 'companyAccountId',
                control: this.fb.control(null, [Validators.required]) // ,
                // options:
            },
            {
                name: 'mutavArray',
                // name: 'biziboxMutavId',
                control: this.fb.control(
                    null // ,
                    // [Validators.required]
                )
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
                control: this.fb.control(
                    'BankTransfer', // 'Checks',
                    [Validators.required]
                ) // ,
                // options: ['Checks', 'BankTransfer', 'Other'].map((val) => {
                //         return {
                //             label: this.translateService.instant('paymentTypes.' + val),
                //             value: val
                //         };
                // })
            },
            {
                name: 'cash',
                control: this.fb.control({
                    value: null,
                    disabled: this.calculateAutoUpdateTypeCntrl.value
                }),
                options: [
                    {
                        label: 'ראשון - חמישי',
                        value: 5
                    },
                    {
                        label: 'ראשון - שישי',
                        value: 6
                    },
                    {
                        label: 'ראשון - שבת',
                        value: 7
                    }
                ]
            },
            {
                name: 'asmachta',
                control: this.fb.control(null, [Validators.pattern(/^[\d\-.]+$/)])
            },
            {
                name: 'transFrequencyName',
                control: this.fb.control(
                    {
                        value: 'MONTH',
                        disabled: this.calculateAutoUpdateTypeCntrl.value
                    },
                    [Validators.required]
                ),
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
                name: 'transDate',
                control: new FormControl(new Date(), [Validators.required])
            },
            {
                name: 'total',
                control: this.fb.control(
                    {
                        value: null,
                        disabled:
                            this.mode === EditingType.Series &&
                            this.calculateAutoUpdateTypeCntrl.value &&
                            !this.source.checkboxUnLocked
                    },
                    [Validators.required, Validators.pattern(/^[\d\-.]+$/)]
                )
            },
            {
                name: 'autoUpdateTypeName',
                control: this.fb.control('AVG_3_MONTHS', [Validators.required]),
                options: ['AVG_3_MONTHS', 'LAST_BANK_TOTAL', 'USER_DEFINED_TOTAL'].map(
                    (val) => {
                        return {
                            label: this.translateService.instant('autoUpdateTypes.' + val),
                            value: val
                        };
                    }
                )
            },
            {
                name: 'endDate',
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
            }
        ];

        this.endDateOn = new FormControl(null, []);
        this.endDateTimes = new FormControl(null, [
            Validators.pattern(/\d+/),
            Validators.min(1)
        ]);

        this.fields
            .find((fld) => fld.name === 'autoUpdateTypeName')
            .control.valueChanges.pipe(
            filter(
                (val) =>
                    this.form &&
                    this.mode !== EditingType.Single &&
                    this.source &&
                    this.source.transId &&
                    this.form.controls['total'] &&
                    (val === 'USER_DEFINED_TOTAL') !== this.form.get('total').enabled
            ),
            takeUntil(this.destroyed$)
        )
            .subscribe((val) => {
                this.form
                    .get('total')
                    .setValue(this.source.total ? Math.abs(this.source.total) : null);
                if (
                    (val === 'USER_DEFINED_TOTAL' || this.source.checkboxUnLocked) &&
                    !this.source.isUnion
                ) {
                    this.form.get('total').enable();
                } else {
                    this.form.get('total').disable();
                }
            });

        this.fields
            .find((fld) => fld.name === 'mutavArray')
            .control.valueChanges.pipe(
            filter(
                () =>
                    this.form &&
                    !this.applyingSource &&
                    !!this.beneficiaryMultiSelectComponent
            ),
            takeUntil(this.destroyed$)
        )
            .subscribe((val) => {
                const notEmpty = Array.isArray(val) && val.length;
                const moreThanOne = notEmpty && val.length > 1;
                if (notEmpty) {
                    // debugger;
                    if (this.mode !== EditingType.Single) {
                        this.form
                            .get('transName')
                            .setValue(
                                [
                                    'העברה ',
                                    this.source.expence ? 'ל' : 'מ',
                                    '-',
                                    moreThanOne
                                        ? val.length + ' מוטבים'
                                        : this.beneficiaryMultiSelectComponent.value[0].beneficiary
                                            .accountMutavName
                                ].join('')
                            );
                    }

                    this.form
                        .get('total')
                        .setValue(val.reduce((total, bnfR) => total + bnfR.total, 0));
                }

                if (this.mode !== EditingType.Single) {
                    if (moreThanOne) {
                        const selectedTransTypeIdsSet = Array.from(
                            new Set(val.map((row) => row.transTypeId))
                        );
                        const transTypeToSet =
                            selectedTransTypeIdsSet.length === 1
                                ? this.companyTransTypes.find(
                                    (tt) => tt.transTypeId === selectedTransTypeIdsSet[0]
                                )
                                : this.companyTransTypes.find(
                                    (tt) => tt.transTypeId === this.multipleCategoriesId
                                );
                        this.form.get('transTypeId').setValue(transTypeToSet);
                        // if (!this.source.checkboxUnLocked) {
                        //     this.form.get('total').disable();
                        //     this.form.get('transTypeId').disable();
                        // }

                        this.form.get('total').disable();
                        this.form.get('transTypeId').disable();
                    } else {
                        if (notEmpty) {
                            this.form
                                .get('transTypeId')
                                .setValue(
                                    this.companyTransTypes.find(
                                        (tt) => tt.transTypeId === val[0].transTypeId
                                    )
                                );
                            this.applyCategorySelectionToPastCntrl.setValue(
                                !!val[0].applyTransTypeRetroactively
                            );
                        } else if (
                            !this.form.get('transTypeId').value ||
                            this.form.get('transTypeId').value.transTypeId !==
                            CyclicEditorComponent.DEFAULT_TRANSTYPE_ID
                        ) {
                            // } else if (this.form.get('transTypeId').value
                            //                 && this.form.get('transTypeId').value.transTypeId === this.multipleCategoriesId) {
                            this.form
                                .get('transTypeId')
                                .setValue(
                                    this.companyTransTypes.find(
                                        (tt) =>
                                            tt.transTypeId ===
                                            CyclicEditorComponent.DEFAULT_TRANSTYPE_ID
                                    )
                                );
                        }

                        if (!this.source.isUnion) {
                            this.form.get('total').enable();
                        }
                        this.form.get('transTypeId').enable();
                        // this.mode === EditingType.Series ? this.form.get('transTypeId').enable() : this.form.get('transTypeId').disable();
                    }
                }
            });

        this.applyCategorySelectionToPastCntrl.valueChanges
            .pipe(
                filter(
                    () =>
                        (this.form.get('transTypeId').enabled &&
                            (this.form.get('mutavArray').value && this.form.get('mutavArray').value.length) &&
                            !(!this.source.transId || this.source['fromRecommendation'])) &&
                        this.mode === EditingType.Series &&
                        this.form &&
                        this.form.value &&
                        Array.isArray(this.form.value.mutavArray) &&
                        this.form.value.mutavArray.length === 1 &&
                        ('applyTransTypeRetroactively' in this.form.value.mutavArray[0] ||
                            (this.mode === EditingType.Series && !!this.source.transId))
                ),
                takeUntil(this.destroyed$)
            )
            .subscribe((val) => {
                if(  (this.form.get('transTypeId').enabled &&
                    this.form.get('mutavArray').value.length &&
                    !(!this.source.transId || this.source['fromRecommendation']))){
                    const mutavArray = this.form.value.mutavArray;
                    mutavArray[0].applyTransTypeRetroactively = val;
                    this.form.patchValue(
                        {
                            mutavArray: mutavArray
                        },
                        {emitEvent: false}
                    );
                }
            });

        this.calculateAutoUpdateTypeCntrl.valueChanges.subscribe((val) => {
            if (
                !this.form.get('transFrequencyName').value ||
                this.form.get('transFrequencyName').value !== 'DAY' ||
                val
            ) {
                this.form.get('cash').disable();
            } else {
                this.form.get('cash').enable();
            }
            if (val && !this.source.checkboxUnLocked) {
                this.form.get('total').disable();
                this.form.get('transFrequencyName').disable();
            } else {
                if (!this.source.isUnion) {
                    this.form.get('total').enable();
                }
                this.form.get('transFrequencyName').enable();
            }
        });

        this.fields
            .find((fld) => fld.name === 'total')
            .control.valueChanges.pipe(
            filter(
                (val) =>
                    this.form &&
                    !this.applyingSource &&
                    this.form.get('total').valid &&
                    this.form.value &&
                    Array.isArray(this.form.value.mutavArray) &&
                    this.form.value.mutavArray.length === 1 &&
                    this.form.value.mutavArray[0].total !== val
            ),
            takeUntil(this.destroyed$)
        )
            .subscribe((val) => {
                this.form.value.mutavArray[0].total = val;
                this.form.patchValue(
                    {
                        mutavArray: [this.form.value.mutavArray[0]]
                    },
                    {emitEvent: false}
                );
            });

        this.fields
            .find((fld) => fld.name === 'transFrequencyName')
            .control.valueChanges.pipe(
            filter(
                (val) =>
                    this.form &&
                    !this.applyingSource &&
                    this.form.get('transFrequencyName').valid &&
                    this.form.value
            ),
            takeUntil(this.destroyed$)
        )
            .subscribe((val) => {
                if (val && val === 'DAY' && !this.calculateAutoUpdateTypeCntrl.value) {
                    this.form.get('cash').enable();
                } else {
                    this.form.get('cash').disable();
                }
            });

        this.fields
            .find((fld) => fld.name === 'paymentDesc')
            .control.valueChanges.pipe(
            filter(
                (val) =>
                    this.form &&
                    !this.applyingSource &&
                    this.form.get('paymentDesc').valid &&
                    this.form.value
            ),
            takeUntil(this.destroyed$)
        )
            .subscribe((val) => {
                if (val) {
                    if (val === 'cash') {
                        this.fields.find((fd) => fd.name === 'transFrequencyName').options =
                            Object.entries(
                                this.translateService.instant('transactionFrequencyTypes')
                            )
                                .filter(
                                    ([k]) =>
                                        !['TWO_MONTHS', 'QUARTER', 'MULTIPLE', 'YEAR'].includes(k)
                                )
                                .map(([k, v]) => {
                                    return {
                                        label: (v as any).text,
                                        value: k
                                    };
                                });

                        //this.form.get('transFrequencyName').setValue('MONTH');
                    } else {
                        this.fields.find((fd) => fd.name === 'transFrequencyName').options =
                            Object.entries(
                                this.translateService.instant('transactionFrequencyTypes')
                            )
                                .filter(([k]) => !['MULTIPLE', 'YEAR'].includes(k))
                                .map(([k, v]) => {
                                    return {
                                        label: (v as any).text,
                                        value: k
                                    };
                                });
                    }
                    // this.form.get('transFrequencyName').enable();
                } else {
                    // this.form.get('transFrequencyName').disable();
                }
            });

        this.fields
            .find((fld) => fld.name === 'transTypeId')
            .control.valueChanges.pipe(
            filter(
                (val) =>
                    !!val &&
                    this.form &&
                    !this.applyingSource &&
                    this.form.get('transTypeId').valid &&
                    this.form.value
            ),
            takeUntil(this.destroyed$)
        )
            .subscribe((val) => {
                setTimeout(() => {
                    if (
                        Array.isArray(this.form.value.mutavArray) &&
                        this.form.value.mutavArray.length === 1 &&
                        this.form.value.mutavArray[0].transTypeId !== val.transTypeId
                    ) {
                        this.form.value.mutavArray[0].transTypeId = val.transTypeId;
                        this.form.patchValue(
                            {
                                mutavArray: [this.form.value.mutavArray[0]]
                            },
                            {emitEvent: false}
                        );
                    }
                });
            });
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
            this.applySource();
            this.setControlsStateAndVisibility();
        }
    }

    private populateForm(): void {
        if (this.form) {
            this.fields.forEach((fld) => {
                if (!this.form.contains(fld.name)) {
                    this.form.addControl(fld.name, fld.control);
                    //
                    // if (fld.name === 'biziboxMutavId') {
                    //     fld.control.valueChanges
                    //         .pipe(
                    //             filter(val => !!val && !this.applyingSource)
                    //         )
                    //         .subscribe(val => {
                    //             // debugger;
                    //             this.form.patchValue({
                    //                 transName: ['העברה ',
                    //                     this.source.expence ? 'ל-' : 'מ-',
                    //                     val.accountMutavName].join(''),
                    //                 transTypeId: this.companyTransTypes.find(ctt => ctt.transTypeId === val.transTypeId)
                    //             });
                    //         });
                    // }
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
        if (this.form.contains('transName')) {
            this.form.get('transName').reset();
        }
        if (this.form.contains('total')) {
            this.form.get('total').reset();
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

            if (this.form.get('paymentDesc') !== null) {
                this.form
                    .get('paymentDesc')
                    .setValue(this.source.paymentDescOriginal || this.source.paymentDesc);
            }

            if (this.form.get('total') !== null) {
                this.form
                    .get('total')
                    .setValue(this.source.total ? Math.abs(this.source.total) : null);
            }
            if (
                this.form.get('cash') !== null &&
                this.form.get('paymentDesc') !== null &&
                this.form.get('paymentDesc').value === 'cash'
            ) {
                this.form
                    .get('cash')
                    .setValue(this.source.cash ? this.source.cash : null);
            }

            // if (this.form.get('transFrequencyName') !== null) {
            //     this.form.get('transFrequencyName').setValue(this.source.transFrequencyName ? this.source.transFrequencyName : 'MONTH');
            // }

            if (
                this.form.get('paymentDesc') !== null &&
                this.form.get('paymentDesc').value === 'cash'
            ) {
                this.fields.find((fd) => fd.name === 'transFrequencyName').options =
                    Object.entries(
                        this.translateService.instant('transactionFrequencyTypes')
                    )
                        .filter(
                            ([k]) =>
                                !['TWO_MONTHS', 'QUARTER', 'MULTIPLE', 'YEAR'].includes(k)
                        )
                        .map(([k, v]) => {
                            return {
                                label: (v as any).text,
                                value: k
                            };
                        });

                // this.form.get('transFrequencyName').setValue('MONTH');
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

            if ((this.source as any).nigreret === true) {
                const originalDate =
                    (this.source as any).originalDate instanceof Date
                        ? (this.source as any).originalDate
                        : (this.source as any).originalDate > 0
                            ? new Date(+(this.source as any).originalDate)
                            : null;
                this.form.get('transDate').setValue(originalDate);
            }

            if (!this.source.expirationDate) {
                this.form.get('endDate').setValue('none');
                this.endDateOn.setValue(null);
            } else {
                this.form.get('endDate').setValue('on');
                this.endDateOn.setValue(this.source.expirationDate);
            }

            if (!this.source.autoUpdateTypeName) {
                this.form.get('autoUpdateTypeName').setValue('AVG_3_MONTHS');
            }

            // debugger;
            if (
                !this.source.transFrequencyName ||
                this.source.transFrequencyName === 'MULTIPLE'
            ) {
                this.form.get('transFrequencyName').setValue('MONTH');
            }

            if (
                !this.source.transFrequencyName ||
                this.source.transFrequencyName !== 'DAY'
            ) {
            }

            const autoUpdateTypeNameFld = this.fields.find(
                (fld) => fld.name === 'autoUpdateTypeName'
            );
            if (autoUpdateTypeNameFld) {
                const lastBankTotalOpt = autoUpdateTypeNameFld.options.find(
                    (opt) => opt.value === 'LAST_BANK_TOTAL'
                );
                if (lastBankTotalOpt) {
                    lastBankTotalOpt.label = this.translateService.instant(
                        !this.source.expence
                            ? 'expressions.byLatestIncome'
                            : 'autoUpdateTypes.' + lastBankTotalOpt.value
                    );
                }
            }
            // debugger;
            if (
                !Array.isArray(this.source.mutavArray) &&
                this.source.biziboxMutavId
            ) {
                this.form.patchValue({
                    mutavArray: [
                        {
                            biziboxMutavId: this.source.biziboxMutavId,
                            total: this.source.total,
                            transTypeId: this.source.transTypeId
                        }
                    ]
                });
            } else if (!Array.isArray(this.source.mutavArray)) {
                this.form.patchValue({
                    mutavArray: null
                });
            }
            if (this.source.calculateAutoUpdateTypeCntrl !== undefined) {
                this.calculateAutoUpdateTypeCntrl.setValue(
                    this.source.calculateAutoUpdateTypeCntrl
                );
            } else {
                this.calculateAutoUpdateTypeCntrl.setValue(
                    this.form.get('autoUpdateTypeName').value === 'AVG_3_MONTHS'
                );
            }

            this.applyCategorySelectionToPastCntrl.setValue(false);

            this.applyingSource = false;
        }
    }

    setControlsStateAndVisibility(): void {
        if (this.source && this.form) {
            [
                'companyAccountId',
                'transTypeId',
                'transName',
                'paymentDesc',
                'asmachta',
                'total',
                'cash',
                'transFrequencyName'
            ]
                .filter((fldName) => this.form.get(fldName) !== null)
                .forEach((fldName) => {
                    switch (fldName) {
                        case 'transFrequencyName':
                            if (
                                this.mode === EditingType.Series &&
                                this.calculateAutoUpdateTypeCntrl.value &&
                                !this.source.checkboxUnLocked
                            ) {
                                this.form.get(fldName).disable();
                            } else {
                                if (
                                    this.mode === EditingType.Single &&
                                    !this.source.checkboxUnLocked
                                ) {
                                    this.form.get(fldName).disable();
                                } else {
                                    this.form.get(fldName).enable();
                                }
                            }
                            break;

                        case 'total':
                            // debugger;
                            const cntrl = this.form.get(fldName);
                            if (
                                this.mode === EditingType.Series &&
                                this.calculateAutoUpdateTypeCntrl.value &&
                                !this.source.checkboxUnLocked
                            ) {
                                cntrl.disable();
                            } else {
                                if (
                                    (!Array.isArray(this.source.mutavArray) ||
                                        this.source.mutavArray.length < 2 ||
                                        this.source.checkboxUnLocked) &&
                                    !this.source.isUnion
                                ) {
                                    cntrl.enable();
                                } else {
                                    cntrl.disable();
                                }
                            }

                            // if (this.mode === EditingType.Single || (this.source && !this.source.transId)) {
                            //     this.form.get(fldName).enable();
                            // } else {
                            //     if (this.form.get('autoUpdateTypeName').value === 'USER_DEFINED_TOTAL') {
                            //         this.form.get(fldName).enable();
                            //     } else {
                            //         this.form.get('total').setValue(this.source.total ? Math.abs(this.source.total) : null);
                            //         this.form.get(fldName).disable();
                            //     }
                            // }
                            break;
                        case 'transTypeId':
                            const cntrlTransTypeId = this.form.get(fldName);
                            if (this.mode === EditingType.Single) {
                                cntrlTransTypeId.disable();
                            } else {
                                if (
                                    !Array.isArray(this.source.mutavArray) ||
                                    this.source.mutavArray.length < 2 ||
                                    this.source.checkboxUnLocked
                                ) {
                                    cntrlTransTypeId.enable();
                                } else {
                                    cntrlTransTypeId.disable();
                                }
                            }
                            break;
                        case 'transDate':
                        case 'asmachta':
                        case 'paymentDesc':
                            this.form.get(fldName).enable();
                            break;

                        case 'cash':
                            if (
                                !this.form.get('transFrequencyName').value ||
                                this.form.get('transFrequencyName').value !== 'DAY' ||
                                this.calculateAutoUpdateTypeCntrl.value
                            ) {
                                this.form.get(fldName).disable();
                            } else {
                                this.form.get(fldName).enable();
                            }
                            break;

                        default:
                            if (this.mode === EditingType.Single) {
                                this.form.get(fldName).disable();
                            } else {
                                this.form.get(fldName).enable();
                            }
                            break;
                    }
                });

            const bnfCntrl = this.form.get('mutavArray');
            if (
                bnfCntrl.disabled !==
                (this.mode === EditingType.Series &&
                    (<any>this.source).fromRecommendation === true)
                // && (!!this.source.biziboxMutavId
                //         || (Array.isArray(this.source.mutavArray) && this.source.mutavArray.length > 0))
            ) {
                bnfCntrl.disabled ? bnfCntrl.enable() : bnfCntrl.disable();
            }
        }
    }

    shouldDisplay(fld: any): boolean {
        if (fld.name === 'autoUpdateTypeName') {
            return false;
        }
        if (
            fld.name === 'expirationDate' ||
            fld.name === 'endDate' ||
            // if (fld.name === 'autoUpdateTypeName' || fld.name === 'expirationDate' || fld.name === 'endDate'
            fld.name === 'transFrequencyName'
        ) {
            return this.mode === EditingType.Series;
            // && (fld.name === 'autoUpdateTypeName'
            //     ? !this.source.fromRecommendation
            //     : true);
        }
        if (fld.name === 'asmachta') {
            return this.mode === EditingType.Single;
        }
        if (fld.name === 'cash') {
            return this.form.get('paymentDesc').value === 'cash';
        }

        return true;
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
