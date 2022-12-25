import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {BehaviorSubject, combineLatest, merge, Observable, of, ReplaySubject, Subject, zip} from 'rxjs';
import {distinctUntilChanged, first, map, switchMap, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {publishRef} from '../../functions/publishRef';
import {UserService} from "@app/core/user.service";

@Component({
    selector: 'app-loan-details-prompt',
    templateUrl: './loan-details-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class LoanDetailsPromptComponent
    implements OnInit, OnDestroy, OnChanges {
    private readonly input$ = new ReplaySubject<Array<string>>(1);
    public readonly selectedItemId$ = new BehaviorSubject<string>(null);
    private readonly reload$ = new Subject<void>();
    private readonly destroyed$ = new Subject<void>();
    readonly processing$ = new BehaviorSubject<boolean>(false);

    loanDetails$: Observable<Array<any>>;

    @Input() companyAccountId: Array<string>;
    @Input() selectedItemId: string;
    @Input() loanId: any = null;
    @Input() modal: any = true;


    visible = true;

    selectedItem$: Observable<any>;
    popUpRemovePrompt = false;

    // tslint:disable-next-line:no-output-on-prefix
    @Output() hideLoan: EventEmitter<any> = new EventEmitter();
    @Output() loanDeleted: EventEmitter<any> = new EventEmitter();

    ngOnChanges(changes: SimpleChanges): void {
        if ('companyAccountId' in changes) {
            this.input$.next(changes['companyAccountId'].currentValue);
        }
        if ('selectedItemId' in changes) {
            this.selectedItemId$.next(changes['selectedItemId'].currentValue);
        }
    }

    constructor(private restCommonService: RestCommonService,
                public userService: UserService) {
    }

    ngOnInit(): void {
        this.loanDetails$ = merge(
            this.input$.pipe(distinctUntilChanged()),
            this.reload$
        ).pipe(
            switchMap(() => {
                if (
                    Array.isArray(this.companyAccountId) &&
                    this.companyAccountId.length
                ) {
                    return this.restCommonService.loanDetails({
                        companyAccountIds: this.companyAccountId,
                        loanId: this.loanId
                    });
                } else {
                    return of({body: []});
                }
            }),
            map((response: any) => (!response || response.error ? [] : response.body)),
            publishRef,
            takeUntil(this.destroyed$)
        );

        this.selectedItem$ = combineLatest(
         [
             this.loanDetails$,
             this.selectedItemId$
         ]
        ).pipe(
            map(([all, idToSelect]) => {
                if (!Array.isArray(all) || !all.length) {
                    return null;
                }
                const selectedItem = idToSelect
                    ? all.find((item) => item.loanId === idToSelect)
                    : all[0];
                return selectedItem;
            }),
            tap((selectedItem) => {
                if (selectedItem && !Array.isArray(selectedItem.arrSlices)) {
                    selectedItem.arrSlices = new Array(12);
                    if (
                        selectedItem.paymentsNumberLeft === null ||
                        !selectedItem.loanPayments
                    ) {
                        selectedItem.arrSlices.fill(false);
                    } else if (selectedItem.paymentsNumberLeft === 0) {
                        selectedItem.arrSlices.fill(true);
                    } else {
                        const numberOfSlicesToHover = Math.round(
                            (selectedItem.loanPayments - selectedItem.paymentsNumberLeft) /
                            (selectedItem.loanPayments / selectedItem.arrSlices.length)
                        );
                        selectedItem.arrSlices.fill(true, 0, numberOfSlicesToHover);
                        selectedItem.arrSlices.fill(false, numberOfSlicesToHover);
                    }
                }
            }),
            publishRef,
            takeUntil(this.destroyed$)
        );
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    setActive(item: any) {
        this.selectedItemId$.next(item.id);
    }

    removeSelectedLoan() {
        this.selectedItem$
            .pipe(
                tap(() => this.processing$.next(true)),
                switchMap((selectedItem) =>
                    this.restCommonService.deleteLoanAndDeposit({
                        params: {
                            companyAccountId: selectedItem.companyAccountId,
                            id: selectedItem.loanId
                        },
                        url: 'loan'
                    })
                ),
                withLatestFrom(this.selectedItem$),
                first()
            )
            .subscribe({
                next: ([rslt, selectedItem]) => {
                    if (rslt && !rslt.error) {
                        this.loanDeleted.next(selectedItem);
                        this.reload$.next();
                    }
                },
                complete: () => {
                    this.processing$.next(false);
                    this.popUpRemovePrompt = false;
                }
            });
    }

    dynamicalyApply(
        companyAccountId: Array<string>,
        selectedItemId?: string
    ): void {
        if (companyAccountId) {
            this.companyAccountId = companyAccountId;
            this.input$.next(this.companyAccountId);
        }
        if (selectedItemId) {
            this.selectedItemId = selectedItemId;
            this.selectedItemId$.next(this.selectedItemId);
        }
    }
}
