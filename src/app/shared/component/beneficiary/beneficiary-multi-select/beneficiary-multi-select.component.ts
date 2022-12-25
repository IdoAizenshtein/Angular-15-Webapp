import {
    AfterViewInit,
    Component,
    EventEmitter,
    forwardRef,
    Input,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {
    ControlContainer,
    ControlValueAccessor,
    FormArray,
    FormControl,
    FormGroup,
    NG_VALUE_ACCESSOR,
    Validators
} from '@angular/forms';
import {UserService} from '@app/core/user.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {OverlayPanel} from 'primeng/overlaypanel';
import {defer, Observable, Subject} from 'rxjs';
import {filter, map, take, takeUntil} from 'rxjs/operators';
import {Beneficiary, BeneficiaryService} from '@app/core/beneficiary.service';
import {StorageService} from '@app/shared/services/storage.service';
import {Subscription} from 'rxjs/internal/Subscription';

export const BENEFICIARIES_MLTI_SELECT_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => BeneficiaryMultiSelectComponent),
    multi: true
};

@Component({
    selector: 'app-beneficiary-multi-select',
    templateUrl: './beneficiary-multi-select.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    providers: [BENEFICIARIES_MLTI_SELECT_VALUE_ACCESSOR]
})
export class BeneficiaryMultiSelectComponent
    implements ControlValueAccessor, OnDestroy, OnInit, AfterViewInit {

    private static readonly DEFAULT_TRANSTYPE_ID =
        'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
    value: Array<{
        beneficiary: any;
        total: number;
        transType: any;
        applyTransTypeRetroactively?: boolean;
        transId?: string;
        transTazrimMapId?: string;
    }>;
    @Output() changed = new EventEmitter<any>();

    @Input() createWith: {
        companyAccountId: string;
        total: number;
        paymentDesc: string;
    };

    readonly editForm: FormArray;

    @Input() companyTransTypes: Array<any> = [];
    @Input() placeholder = 'לא חובה';

    @ViewChild('trigger') triggerRef: any;
    @ViewChild('beneficiariesMultiSelector', {read: OverlayPanel})
    overlay: OverlayPanel;

    @ViewChild('beneficiarySelectionGuideOvP', {read: OverlayPanel}) beneficiarySelectionGuideOvP: OverlayPanel;

    @ViewChild('beneficiarySelectionGuideOvPOpenBtn') beneficiarySelectionGuideOvPOpenBtn: any;


    beneficiarySelectionGuide: { stopIt: boolean };

    @Input() inputId: string;
    @Input() dontAllowAddition: any = false;

    @Input() config: {
        totalDisabled?: any;
        traceSelectedBeneficiariesWithExistingTransactions: any;
        allowAddition: any;
        showApplyRetroactivelyOption: any;
    } = {
        traceSelectedBeneficiariesWithExistingTransactions: true,
        allowAddition: true,
        showApplyRetroactivelyOption: false
    };

    onChange;
    onTouched;
    private nodesBeforeOverlay: Element[];
    private activeClickListener: () => void;

    private readonly destroyed$ = new Subject<void>();
    exclusions: Array<Beneficiary | string> = [];

    readonly selectedBeneficiariesWithExistingTransactions$: Observable<string> =
        defer(() => {
            return this.editForm.valueChanges.pipe(
                map((vals) => {
                    return vals
                        .map((val) => val.beneficiary)
                        .filter(
                            (bnf) =>
                                !!bnf &&
                                bnf.peulotCount &&
                                (!this.value ||
                                    !this.value.some(
                                        (row) =>
                                            row.beneficiary.biziboxMutavId === bnf.biziboxMutavId
                                    ))
                        )
                        .map((bnf) => `<strong>${bnf.accountMutavName}</strong>`)
                        .join(',&nbsp;');
                }),
                takeUntil(this.destroyed$)
            );
        });

    private observer: IntersectionObserver;
    disabled: boolean;
    private readonly beneficiaryChangeSubscribers: Map<FormGroup, Subscription> =
        new Map<FormGroup, Subscription>();

    get valueDetailed() {
        if (!Array.isArray(this.value) || !this.value.length) {
            return '';
        }

        return this.value
            .map((bnf) => (bnf.beneficiary ? bnf.beneficiary.accountMutavName : ''))
            .filter((name) => !!name)
            .join('<br />');
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    writeValue(
        val: Array<{
            biziboxMutavId: string;
            total: number;
            transTypeId: string;
            applyTransTypeRetroactively?: boolean;
            transId?: string;
            transTazrimMapId?: string;
        }>
    ): void {
        // this.value = obj;
        if (!Array.isArray(val) || !val.length) {
            this.value = null;
            return;
        }

        this.beneficiaryService.selectedCompanyBeneficiaries
            .pipe(take(1))
            .subscribe((bnfs) => {
                this.value = val.map((item) => {
                    return Object.assign(
                        {
                            beneficiary: bnfs.find(
                                (bnf) => bnf.biziboxMutavId === item.biziboxMutavId
                            ),
                            transType:
                                Array.isArray(this.companyTransTypes) && item.transTypeId
                                    ? this.companyTransTypes.find(
                                        (tt) => tt.transTypeId === item.transTypeId
                                    )
                                    : null,
                            total: item.total
                        },
                        'applyTransTypeRetroactively' in item
                            ? {
                                applyTransTypeRetroactively: item.applyTransTypeRetroactively
                            }
                            : {},
                        'transId' in item ? {transId: item.transId} : {},
                        'transId' in item ? {transTazrimMapId: item.transTazrimMapId} : {}
                    );
                });
            });
    }

    ngOnDestroy(): void {
        this.detachOverlayHideListener();
        this.destroyed$.next();
        this.destroyed$.complete();

        if (
            this.beneficiarySelectionGuideOvP &&
            this.beneficiarySelectionGuideOvP.overlayVisible
        ) {
            this.beneficiarySelectionGuideOvP.hide();
        }
        if (this.observer) {
            this.observer.disconnect();
        }
        this.clearBeneficiarySubscribers();
    }

    ngOnInit(): void {
        this.beneficiarySelectionGuide = {
            stopIt:
                this.storageService.localStorageGetterItem(
                    'beneficiarySelectionGuide.display'
                ) === 'false'
        };
    }

    ngAfterViewInit(): void {

        if (this.triggerRef) {
            const btn = this.triggerRef.nativeElement;
            // this.renderer.setAttribute(btn, 'disabled', isDisabled ? 'true' : 'false');
            this.disabled
                ? this.renderer.setAttribute(btn, 'disabled', '')
                : this.renderer.removeAttribute(btn, 'disabled');

            if (!this.beneficiarySelectionGuide.stopIt) {
                this.observer = new IntersectionObserver((entries: any[]) => {
                    if (
                        entries &&
                        entries.length &&
                        entries[entries.length - 1].isIntersecting &&
                        !this.beneficiarySelectionGuide.stopIt &&
                        !this.disabled
                    ) {
                        requestAnimationFrame(() =>
                        setTimeout(()=>{
                            this.beneficiarySelectionGuideOvP.show(
                                new Event('custom'),
                                this.triggerRef.nativeElement
                            )
                        },100)
                        );
                        // setTimeout(()=>{
                        //     this.beneficiarySelectionGuideOvPOpenBtn.nativeElement.click();
                        // },100)
                    } else if (
                        this.beneficiarySelectionGuideOvP &&
                        this.beneficiarySelectionGuideOvP.overlayVisible
                    ) {
                        this.beneficiarySelectionGuideOvP.hide();
                    }
                });
                this.observer.observe(this.triggerRef.nativeElement);
            }
        }
        // if (!this.beneficiarySelectionGuide.stopIt) {
        //     requestAnimationFrame(() =>
        //         this.beneficiarySelectionGuideOvP.show(new Event('custom'), this.trigger.nativeElement)
        //     );
        // }
    }
    getHookPos(elem:any){
        setTimeout(()=>{
            console.log(elem)
        },100)
    }
    constructor(
        public userService: UserService,
        private storageService: StorageService,
        private beneficiaryService: BeneficiaryService,
        private renderer: Renderer2,
        private controlContainer: ControlContainer
    ) {
        this.editForm = new FormArray([
            // this.createBeneficiaryRow()
        ]);

        this.editForm.valueChanges
            .pipe(takeUntil(this.destroyed$))
            .subscribe((vals) => {
                const selectedBeneficiaries = vals
                    .map((val) => val.beneficiary)
                    .filter((bnf) => !!bnf);
                if (
                    selectedBeneficiaries.length !== this.exclusions.length ||
                    this.exclusions.some(
                        (excl, idx) => excl !== selectedBeneficiaries[idx]
                    )
                ) {
                    this.exclusions = selectedBeneficiaries;
                }
            });
    }

    showSelector($event, beneficiariesMultiSelector) {
        if (this.onTouched) {
            this.onTouched($event);
        }

        beneficiariesMultiSelector.show($event);
        const formArrayLength = Math.max(
            Array.isArray(this.value) ? this.value.length : 0,
            1
        );
        if (formArrayLength !== this.editForm.length) {
            if (formArrayLength > this.editForm.length) {
                for (let i = this.editForm.length; i < formArrayLength; ++i) {
                    this.editForm.push(this.createBeneficiaryRow());
                }
            } else {
                for (let i = this.editForm.length - 1; i >= formArrayLength; --i) {
                    this.removeBeneficiary(this.editForm.at(i) as FormGroup);
                    this.editForm.removeAt(i);
                    this.editForm.updateValueAndValidity();
                }
            }
        }

        const resetVal =
            Array.isArray(this.value) && this.value.length
                ? this.value
                : [
                    {
                        beneficiary: null,
                        transType: this.companyTransTypes
                            ? this.companyTransTypes.find(
                                (ctt) =>
                                    ctt.transTypeId ===
                                    BeneficiaryMultiSelectComponent.DEFAULT_TRANSTYPE_ID
                            )
                            : null,
                        total: this.createWith.total ? this.createWith.total : null
                    }
                ];

        this.editForm.reset(resetVal);

        this.editForm.controls
            .filter(
                (fg) =>
                    fg.get('transType').enabled !==
                    (!this.config || this.config.allowAddition)
            )
            .forEach((fg) => {
                const fc = fg.get('transType');
                fc.enabled ? fc.disable() : fc.enable();
            });
        this.editForm.controls.forEach((fg) => {
            const fc = fg.get('total');
            this.config && this.config.totalDisabled ? fc.disable() : fc.enable();
        });
        this.overlay.show($event);
    }

    private createBeneficiaryRow(): any {
        const total = this.createWith ? this.createWith.total : null;
        const row = new FormGroup({
            beneficiary: new FormControl('', Validators.required),
            transType: new FormControl(
                this.companyTransTypes
                    ? this.companyTransTypes.find(
                        (ctt) =>
                            ctt.transTypeId ===
                            BeneficiaryMultiSelectComponent.DEFAULT_TRANSTYPE_ID
                    )
                    : null,
                Validators.required
            ),
            total: new FormControl(
                {
                    value: total,
                    disabled: this.config && this.config.totalDisabled
                },
                [Validators.required, Validators.min(1)]
            ),
            applyTransTypeRetroactively: new FormControl(false)
        });

        this.beneficiaryChangeSubscribers.set(
            row,
            row
                .get('beneficiary')
                .valueChanges.pipe(
                filter(() => !!this.overlay && this.overlay.overlayVisible),
                // distinctUntilChanged(),
                takeUntil(this.destroyed$)
            )
                .subscribe((val: any) => {
                    if (row.get('transType').enabled) {
                        row
                            .get('transType')
                            .setValue(
                                this.companyTransTypes
                                    ? val
                                        ? this.companyTransTypes.find(
                                            (ctt) => ctt.transTypeId === val.transTypeId
                                        )
                                        : this.companyTransTypes.find(
                                            (ctt) =>
                                                ctt.transTypeId ===
                                                BeneficiaryMultiSelectComponent.DEFAULT_TRANSTYPE_ID
                                        )
                                    : null
                            );
                    }
                })
        );

        return row;
    }

    addBeneficiary() {
        const bnfcryRow = this.createBeneficiaryRow();
        bnfcryRow.get('total').reset(null);
        this.editForm.push(bnfcryRow);
    }

    private clickListener(event: any): boolean | void {
        const eventPath = BrowserService.pathFrom(event);
        const clickedElsewhereOnPreviouslyExisting = eventPath
            .filter(
                (el) => !(el instanceof HTMLBodyElement)
            )
            .some((el) => this.nodesBeforeOverlay.includes(el));
        if (clickedElsewhereOnPreviouslyExisting) {
            this.overlay.hide();
        }
    }

    attachOverlayHideListener() {
        this.nodesBeforeOverlay = [this.triggerRef.nativeElement];
        let parent;
        let stop;
        do {
            parent = this.renderer.parentNode(
                this.nodesBeforeOverlay[this.nodesBeforeOverlay.length - 1]
            );
            stop =
                !parent ||
                parent instanceof HTMLBodyElement
            if (!stop) {
                this.nodesBeforeOverlay.push(parent);
            }
        } while (!stop);

        this.nodesBeforeOverlay.push(
            ...Array.from(document.getElementsByClassName('p-dialog-mask'))
        );

        setTimeout(() => {
            this.activeClickListener = this.renderer.listen(
                'document',
                'mousedown',
                this.clickListener.bind(this)
            );
        });
    }

    detachOverlayHideListener() {
        if (this.activeClickListener) {
            this.activeClickListener();
            this.activeClickListener = null;
        }
    }

    submitChanges() {
        if (this.editForm.invalid) {
            BrowserService.flattenControls(this.editForm).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        const newVal = this.editForm.getRawValue();
        const newValPlain = Array.isArray(newVal)
            ? newVal.map((row) => {
                const rowVal = {
                    biziboxMutavId: row.beneficiary
                        ? row.beneficiary.biziboxMutavId
                        : null,
                    transTypeId: row.transType ? row.transType.transTypeId : null,
                    total: Number(row.total)
                };

                if (this.config && this.config.showApplyRetroactivelyOption) {
                    rowVal['applyTransTypeRetroactively'] =
                        row.applyTransTypeRetroactively;
                }

                let foundInValue;
                if (
                    rowVal.biziboxMutavId &&
                    Array.isArray(this.value) &&
                    (foundInValue = this.value.find(
                        (v) =>
                            v.beneficiary &&
                            v.beneficiary.biziboxMutavId === rowVal.biziboxMutavId
                    ))
                ) {
                    ['transId', 'transTazrimMapId']
                        .filter((k) => k in foundInValue)
                        .forEach((k) => (rowVal[k] = foundInValue[k]));
                }

                return rowVal;
            })
            : null;

        this.value = newVal;
        if (this.onChange) {
            this.onChange(newValPlain);
        }
        this.changed.emit({
            originalEvent: newVal,
            value: newValPlain
        });
        this.overlay.hide();
    }

    onBeneficiarySelectionGuideHide(): void {
        if (this.beneficiarySelectionGuide.stopIt) {
            this.storageService.localStorageSetter(
                'beneficiarySelectionGuide.display',
                'false'
            );
        }
    }

    centralizeHorizontally(ovp: OverlayPanel) {
        requestAnimationFrame(() => {
            // debugger;
            const triggerRect = this.triggerRef.nativeElement.getBoundingClientRect();
            const ovpRect = (ovp.container as HTMLElement).getBoundingClientRect();
            (ovp.container as HTMLElement).style.left =
                triggerRect.right - triggerRect.width / 2 - ovpRect.width / 2 + 'px';
        });
    }

    toggleSelector($event: MouseEvent, beneficiariesMultiSelector: any) {
        if (this.overlay.overlayVisible) {
            this.overlay.hide();
        } else {
            this.showSelector($event, beneficiariesMultiSelector);
        }
    }

    clear() {
        this.value = null;
        this.onChange(this.value);
        for (let i = this.editForm.length - 1; i >= 0; --i) {
            this.removeBeneficiary(this.editForm.at(i) as FormGroup);
            this.editForm.removeAt(i);
            this.editForm.updateValueAndValidity();
        }
        // this.clearBeneficiarySubscribers();
    }

    removeBeneficiary(editBnf: any) {
        const bnfSubscriber = this.beneficiaryChangeSubscribers.get(editBnf);
        if (bnfSubscriber) {
            bnfSubscriber.unsubscribe();
            this.beneficiaryChangeSubscribers.delete(editBnf);
        }
    }

    private clearBeneficiarySubscribers() {
        this.beneficiaryChangeSubscribers.forEach((bnfSubscriber) =>
            bnfSubscriber.unsubscribe()
        );
        this.beneficiaryChangeSubscribers.clear();
    }
}
