import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {tap} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {BeneficiaryService} from '@app/core/beneficiary.service';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-beneficiary-category-change-prompt',
    templateUrl: './beneficiary-category-change-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class BeneficiaryCategoryChangePromptComponent {
    visible = true;

    readonly changeTypes = Object.keys(BeneficiaryCategoryChangeType);
    readonly changeTypeControl = new FormControl(
        this.changeTypes[0],
        Validators.required
    );

    @Input() data: {
        transTypeName: string;
        transName: string;
        transTypeId: string;
        companyId: string;
        transId: string;
        biziboxMutavId: string;
    };

    @Input() mode: 'optionalFuture' | null = 'optionalFuture';
    @Input() skipBeneficiaryUpdateIfSingleSelected = true;

    @Output() approved: EventEmitter<string> = new EventEmitter();
    @Output() hidden: EventEmitter<void> = new EventEmitter();
    @Output() beneficiaryCategoryUpdated: EventEmitter<void> = new EventEmitter();

    readonly processing$ = new Subject<boolean>();
    readonly doRetroactively = new FormControl(false);

    constructor(
        private beneficiaryService: BeneficiaryService,
        public userService: UserService
    ) {
    }

    apply() {
        const selectedUpdateType =
            this.mode === 'optionalFuture'
                ? BeneficiaryCategoryChangeType[this.changeTypeControl.value]
                : this.doRetroactively.value === true
                    ? BeneficiaryCategoryChangeType.both
                    : BeneficiaryCategoryChangeType.future;
        this.approved.emit(selectedUpdateType);

        if (
            this.mode === 'optionalFuture' &&
            BeneficiaryCategoryChangeType[this.changeTypeControl.value] ===
            BeneficiaryCategoryChangeType.single &&
            this.skipBeneficiaryUpdateIfSingleSelected
        ) {
            this.visible = false;
            return;
        }

        this.processing$.next(true);

        this.beneficiaryService
            .updateCategory({
                updateType: <any>selectedUpdateType,
                transTypeId: this.data.transTypeId,
                companyId: this.userService.appData.userData.exampleCompany
                    ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
                    : this.data.companyId,
                biziboxMutavId: this.data.biziboxMutavId,
                transId: this.data.transId
            })
            .pipe(
                tap({
                    complete: () => this.processing$.next(false)
                })
            )
            .subscribe(() => {
                this.beneficiaryCategoryUpdated.emit();
                this.visible = false;
            });
    }
}

export enum BeneficiaryCategoryChangeType {
    single = 'bankdetail',
    both = 'future+past',
    past = 'past',
    future = 'future'
}
