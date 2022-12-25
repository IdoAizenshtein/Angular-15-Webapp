import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {BeneficiaryService} from '@app/core/beneficiary.service';
import {FormControl, FormGroup, ValidationErrors, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {BrowserService} from '@app/shared/services/browser.service';
import {Observable, of} from 'rxjs';
import {first, map, shareReplay} from 'rxjs/operators';
import {ValidatorsFactory} from '../../foreign-credentials/validators';
import {TransTypesService} from '@app/core/transTypes.service';

@Component({
    selector: 'app-beneficiary-create-prompt',
    templateUrl: './beneficiary-create-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class BeneficiaryCreatePromptComponent {
    private static readonly DEFAULT_TRANSTYPE_ID =
        'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
    @Input()
    visible: boolean;
    @Output() visibleChange = new EventEmitter<boolean>();

    private _createWith: {
        companyAccountId: string;
        paymentDesc: string;
        accountMutavName: string;
        accountId: number;
        snifId: number;
        bankId: number;
        biziboxMutavId: string;
        transTypeId: string;
    };
    private saveValues: {
        accountId: number;
        snifId: number;
        bankId: number;
        result?: Observable<ValidationErrors>;
    } = {
        accountId: null,
        snifId: null,
        bankId: null
    };
    readonly createForm: any;
    banks: { label: string; value: string }[];
    private isRunning: boolean = false;

    @Output() creationSuccess = new EventEmitter<{
        accountMutavId: string;
        biziboxMutavId: string;
        transTypeId: string;
    }>();

    // readonly beneficiariesAreadyExist$: Observable<null | { existingBeneficiaries: string[] }>;

    @Input()
    set createWith(val: {
        companyAccountId: string;
        paymentDesc: string;
        accountMutavName: string;
        accountId: number;
        snifId: number;
        bankId: number;
        biziboxMutavId: string;
        transTypeId: string;
        fakeMutav: boolean;
    }) {
        this._createWith = val;
        if (val) {
            if (Object.keys(this.createForm.controls).some((k) => k in val)) {
                this.createForm.patchValue(val);
                if (val.transTypeId && typeof val.transTypeId === 'string') {
                    this.transTypesService.selectedCompanyTransTypes
                        .pipe(first())
                        .subscribe((rslt) => {
                            this.createForm.patchValue({
                                transTypeId: rslt.find(
                                    (ctt) => val.transTypeId === ctt.transTypeId
                                )
                            });
                        });
                }
                const controlNames = [
                    'accountMutavName',
                    'bankId',
                    'snifId',
                    'accountId'
                ];
                controlNames
                    .filter(
                        (nm) =>
                            this.createForm.get(nm).disabled !== (val.fakeMutav === false)
                    )
                    .map((nm) => this.createForm.get(nm))
                    .forEach((cntrl) => {
                        if (val.fakeMutav === false) {
                            cntrl.disable();
                        } else {
                            cntrl.enable();
                        }
                    });
            }
        }
    }

    get beneficiaryId(): string | null {
        return this._createWith ? this._createWith.biziboxMutavId : null;
    }

    constructor(
        public userService: UserService,
        private beneficiaryService: BeneficiaryService,
        private translateService: TranslateService,
        public transTypesService: TransTypesService
    ) {
        this.createForm = new FormGroup(
            {
                accountMutavName: new FormControl('', [Validators.required]),
                bankId: new FormControl('', {
                    validators: [Validators.required],
                    updateOn: 'blur'
                }),
                snifId: new FormControl('', {
                    validators: [Validators.required],
                    updateOn: 'blur'
                }),
                accountId: new FormControl('', {
                    validators: [Validators.required],
                    updateOn: 'blur'
                }),
                transTypeId: new FormControl('', [Validators.required]),
                contactName: new FormControl(''),
                contactMail: new FormControl('', ValidatorsFactory.emailExtended),
                contactPhone: new FormControl(''),
                accountMutavHp: new FormControl(''),
                companyId: new FormControl(
                    this.userService.appData.userData.companySelect.companyId
                )
            },
            null,
            this.validateBeneficiaryUnique.bind(this)
            // ,
            // null,
            // BeneficiaryValidators.beneficiaryExistsValidator(this.beneficiaryService)
        );

        this.translateService.get('banks').subscribe((rslt) => {
            this.banks = Object.entries(rslt)
                .filter(([k]) => {
                    const kNum = +k;
                    return kNum < 100 || kNum === 126;
                })
                .map(([k, v]) => {
                    return {
                        label: String(v),
                        value: k
                    };
                });
        });

        this.transTypesService.selectedCompanyTransTypes.subscribe((rslt) => {
            const defaultTransType = Array.isArray(rslt)
                ? rslt.find(
                    (ctt) =>
                        ctt.transTypeId ===
                        BeneficiaryCreatePromptComponent.DEFAULT_TRANSTYPE_ID
                )
                : null;
            if (defaultTransType) {
                this.createForm.patchValue({
                    transTypeId: defaultTransType
                });
            }
        });

        // const beneficiaryKeyParts = ['bankId', 'snifId', 'accountId'];
        // this.beneficiariesAreadyExist$ = this.createForm.valueChanges
        //     .pipe(
        //         filter(val => !!val),
        //         debounceTime(300),
        //         distinctUntilChanged((v1, v2) => {
        //             return !(beneficiaryKeyParts.some(k => v1[k] !== v2[k]));
        //         }),
        //         switchMap(fgVal => {
        //             const request = {
        //                 accountId: fgVal.accountId,
        //                 bankId: fgVal.bankId,
        //                 companyId: fgVal.companyId,
        //                 snifId: fgVal.snifId
        //             };
        //             if (!!(Object.values(request).some((v) => !v))) {
        //                 return of(null);
        //             }
        //             return beneficiaryService.isBeneficiaryExistsWith(request);
        //         }),
        //         map(response => response && !response.error && Array.isArray(response.body) && response.body.length
        //             && (!this.beneficiaryId || !response.body.includes(this._createWith.accountMutavName))
        //             ? {existingBeneficiaries: response.body} : null
        //         ),
        //         tap(response => {
        //             if (!!response) {
        //                 this.createForm.setErrors(Object.assign(this.createForm.errors || {}, response));
        //             } else if (this.createForm.hasError('existingBeneficiaries')) {
        //                 const errs = JSON.parse(JSON.stringify(this.createForm.errors));
        //                 delete errs.existingBeneficiaries;
        //                 this.createForm.setErrors(errs);
        //             }
        //         }),
        //         publishReplay(1),
        //         refCount()
        //     );
    }

    validateBeneficiaryUnique(
        fg: any
    ): any {
        const fgVal = fg.value;
        const request = {
            accountId: fgVal.accountId,
            bankId: fgVal.bankId,
            companyId: fgVal.companyId,
            snifId: fgVal.snifId
        };

        if (Object.values(request).some((v) => !v)) {
            return of(null);
        }
        if (this.saveValues &&
            !(
                this.saveValues.accountId === request.accountId &&
                this.saveValues.snifId === request.snifId &&
                this.saveValues.bankId === request.bankId
            )
        ) {
            this.saveValues.accountId = request.accountId;
            this.saveValues.snifId = request.snifId;
            this.saveValues.bankId = request.bankId;
            this.saveValues.result = this.beneficiaryService
                .isBeneficiaryExistsWith(request)
                .pipe(
                    map((response: any) =>
                        response &&
                        !response.error &&
                        Array.isArray(response.body) &&
                        response.body.length &&
                        (!this.beneficiaryId ||
                            !response.body.includes(this._createWith.accountMutavName))
                            ? {existingBeneficiaries: response.body}
                            : null
                    ),
                    shareReplay(1)
                );
        }

        return this.saveValues.result;
    }

    highlightIfInvalid() {
        if (this.createForm.invalid) {
            BrowserService.flattenControls(this.createForm).forEach((ac) =>
                ac.markAsDirty()
            );
            return false;
        }
        return true;
    }

    hide(): void {
        this.isRunning = false;
        this.visible = false;
        this.visibleChange.emit(false);
    }

    apply() {
        if (!this.isRunning) {
            this.isRunning = true;
            const beneficiaryData = Object.assign(
                {},
                this._createWith || {},
                this.createForm.getRawValue()
            );
            if ('transTypeId' in beneficiaryData.transTypeId) {
                beneficiaryData.transTypeId = beneficiaryData.transTypeId.transTypeId;
            }

            if (!beneficiaryData.paymentDesc) {
                beneficiaryData.paymentDesc = 'BankTransfer';
            }

            if ('biziboxMutavId' in beneficiaryData) {
                this.beneficiaryService.update(beneficiaryData).subscribe({
                    next: (response: any) => {
                        if (!response || response.error) {
                            return;
                        }
                        // const createdResp: { accountMutavId: string, biziboxMutavId: string } = response.body;
                        this.creationSuccess.emit(
                            Object.assign(beneficiaryData, response.body)
                        );
                    },
                    complete: () => {
                        this.hide();
                    }
                });
            } else {
                this.beneficiaryService.create(beneficiaryData).subscribe({
                    next: (response: any) => {
                        if (!response || response.error) {
                            return;
                        }
                        // const createdResp: { accountMutavId: string, biziboxMutavId: string } = response.body;
                        this.creationSuccess.emit(
                            Object.assign(beneficiaryData, response.body)
                        );
                    },
                    complete: () => {
                        this.hide();
                    }
                });
            }
        }
    }
}
