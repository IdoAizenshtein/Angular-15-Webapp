import {Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation} from '@angular/core';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {BehaviorSubject, combineLatest, merge, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {distinctUntilChanged, first, map, switchMap, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {publishRef} from '../../../functions/publishRef';
import {UserService} from '@app/core/user.service';
import {AdditionalInfo} from '../additional-info';
import {ReportService} from '@app/core/report.service';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {TransTypesService} from '@app/core/transTypes.service';
import {Router} from '@angular/router';

@Component({
    selector: 'app-loan-details-overlay-prompt',
    templateUrl: './loan-details-overlay-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class LoanDetailsOverlayPromptComponent extends AdditionalInfo implements OnDestroy {
    override additionalDetails$: Observable<Array<any>>;
    printWorker: boolean = false;
    containerWidth: number = 515;
    containerHeight: number = 355;
    private readonly input$ = new ReplaySubject<any>(1);
    public readonly selectedItemId$ = new BehaviorSubject<string>(null);
    private readonly reload$ = new Subject<void>();
    private readonly destroyed$ = new Subject<void>();
    readonly processing$ = new BehaviorSubject<boolean>(false);


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

    transactionAdditionalDetailsSum: number;


    constructor(
        private restCommonService: RestCommonService,
        private reportService: ReportService,
        private sanitizer: DomSanitizer,
        private translate: TranslateService,
        el: ElementRef,
        public router: Router,
        public override userService: UserService,
        public transTypesService: TransTypesService
    ) {
        super(el, userService);

    }

    override reload(getDataFromNew?: boolean): void {
        if (
            !this.transaction ||
            (!this.transaction.loanId || !this.transaction.companyAccountId)
        ) {
            this.additionalDetails$ = null;
            return;
        }

        // console.log('reload --> %o', this.transaction);
        if (getDataFromNew) {
            this.refresh.emit(true);
        }
        // this.transaction

        this.additionalDetails$ = merge(
            this.input$.pipe(distinctUntilChanged()),
            this.reload$
        ).pipe(
            switchMap(() => {
                if (
                    this.transaction.companyAccountId
                ) {
                    return this.restCommonService.loanDetails({
                        companyAccountIds: [this.transaction.companyAccountId],
                        loanId: this.transaction.loanId
                    });
                } else {
                    return of({body: []});
                }
            }),
            map((response: any) => (!response || response.error ? [] : response.body)),
            publishRef,
            takeUntil(this.destroyed$),
            first()
        );

        this.selectedItem$ = combineLatest(
            [
                this.additionalDetails$,
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

        this.input$.next('true');
    }


    companyGetCustomerEmit(row) {
        this.companyGetCustomer.emit(row);
    }


    // ngOnChanges(changes: SimpleChanges): void {
    //     if ('companyAccountId' in changes) {
    //         this.input$.next(changes['companyAccountId'].currentValue);
    //     }
    //     if ('selectedItemId' in changes) {
    //         this.selectedItemId$.next(changes['selectedItemId'].currentValue);
    //     }
    // }


    override ngOnDestroy(): void {
        super.ngOnDestroy();
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

}
