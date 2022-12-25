import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {take, tap} from 'rxjs/operators';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {Subject} from 'rxjs/internal/Subject';
import {UserService} from "@app/core/user.service";

@Component({
    selector: 'app-category-change-prompt',
    templateUrl: './category-change-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CategoryChangePromptComponent {
    visible = true;

    readonly changeTypes = Object.keys(CategoryChangeType);
    readonly changeTypeControl = new FormControl(
        this.changeTypes[0],
        Validators.required
    );

    @Input() data: {
        transTypeName: string;
        transName: string;
        transTypeId: string;
        companyId: string;
        kvua: any;
        bankTransId: string;
        ccardTransId: string;
        searchkeyId: string;
    };
    @Input() budgetHistory = false;
    @Output() approved: EventEmitter<any> = new EventEmitter();
    @Output() hidden: EventEmitter<any> = new EventEmitter();
    @Output() searchkeyDefined: EventEmitter<void> = new EventEmitter();

    readonly processing$ = new Subject<boolean>();

    constructor(private restCommonService: RestCommonService,    public userService: UserService) {
    }

    apply() {
        if (!this.budgetHistory) {
            this.approved.emit();
            switch (this.changeTypeControl.value) {
                case CategoryChangeType.both:
                case CategoryChangeType.future:
                case CategoryChangeType.past:
                    this.processing$.next(true);
                    this.restCommonService
                        .defineSearchKey({
                            updateType: CategoryChangeType[this.changeTypeControl.value],
                            transTypeId: this.data.transTypeId,
                            companyId: this.data.companyId,
                            kvua: this.data.kvua,
                            bankTransId: this.data.bankTransId,
                            ccardTransId: this.data.ccardTransId,
                            searchkeyId: this.data.searchkeyId
                        })
                        .pipe(
                            take(1),
                            tap({
                                complete: () => this.processing$.next(false)
                            })
                        )
                        .subscribe(() => {
                            this.searchkeyDefined.next();
                            this.visible = false;
                        });
                    break;
                default:
                    this.visible = false;
                    break;
            }
        } else {
            this.processing$.next(true);
            this.approved.emit(this.changeTypeControl.value);
            this.processing$.next(false);
            this.visible = false;
        }
    }
}

export enum CategoryChangeType {
    single = 'single',
    both = 'both',
    past = 'past',
    future = 'future'
}
