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
import {BehaviorSubject, merge, Observable, ReplaySubject, Subject} from 'rxjs';
import {map, switchMap, tap} from 'rxjs/operators';
import {formatWithoutPoints, roundAndAddComma} from '../../functions/addCommaToNumbers';
import {UserService} from '@app/core/user.service';
import {publishRef} from '../../functions/publishRef';

export interface CyclicTransactionInput {
    transName: string;
    paymentDesc: string;
    targetType: string;
    transId: string;
    bankTransIds: string[];
    companyAccountId: string;
    total: number;
    expence: boolean;
    transFrequencyName: string;
    frequencyDay: string | number;
    autoUpdateTypeName: string;
    paymentDescOriginal: string;
    biziboxMutavId: string;
    mutavArray: Array<any>;
}

@Component({
    selector: 'app-cyclic-trans-history',
    templateUrl: './cyclic-transaction-history.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CyclicTransactionHistoryComponent
    implements OnInit, OnChanges, OnDestroy {
    @Input()
    cyclicTrans: CyclicTransactionInput;

    private validInput$ = new ReplaySubject<CyclicTransactionInput>(1);
    private readonly forceReload$ = new Subject<void>();
    historyData$: Observable<any>;
    reloading$: BehaviorSubject<boolean> = new BehaviorSubject(false);

    @Output() historyRecordDeleted = new EventEmitter<any>();

    constructor(
        public restCommonService: RestCommonService,
        public userService: UserService
    ) {
    }

    ngOnInit(): void {
        this.historyData$ = merge(
            this.validInput$,
            this.forceReload$.pipe(switchMap(() => this.validInput$))
        ).pipe(
            tap(() => this.reloading$.next(true)),
            switchMap((cyclicTrans) => {
                return cyclicTrans.paymentDesc !== 'RECOMMENDATION'
                    ? this.restCommonService.getCyclicTransHistory({
                        targetType: cyclicTrans.targetType,
                        transId: cyclicTrans.transId
                    })
                    : this.restCommonService.getRecommendationTransHistory({
                        bankTransIds: cyclicTrans.bankTransIds,
                        companyAccountId: cyclicTrans.companyAccountId,
                        biziboxMutavId: cyclicTrans.biziboxMutavId,
                        mutavArray: cyclicTrans.mutavArray
                    });
            }),
            map((resp) =>
                this.transformResponse(resp && !resp.error ? resp.body : resp.error)
            ),
            tap(
                () => this.reloading$.next(false)
            ),
            publishRef
        );
    }

    ngOnDestroy(): void {
        this.validInput$.complete();
        this.forceReload$.complete();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['cyclicTrans']) {
            console.log(
                'changes.cyclicTrans => %o',
                changes['cyclicTrans'].currentValue
            );
            if (
                changes['cyclicTrans'].currentValue &&
                ((changes['cyclicTrans'].currentValue.bankTransIds &&
                        changes['cyclicTrans'].currentValue.companyAccountId) ||
                    (changes['cyclicTrans'].currentValue.targetType &&
                        changes['cyclicTrans'].currentValue.transId))
            ) {
                this.validInput$.next(changes['cyclicTrans'].currentValue);
            }
        }
    }

    formatWithoutPointsSum(sum) {
        return formatWithoutPoints(sum);
    }

    private transformResponse(response: any): any {
        if ('bankTranses' in response) {
            response.transes = response.bankTranses;
            delete response.bankTranses;

            if (Array.isArray(response.transes)) {
                const renamePairs = [
                    ['total', 'bankTotal'],
                    ['transDescAzonly', 'transDesc']
                ];
                response.transes.forEach((rcmdtnTrns) => {
                    renamePairs
                        .filter(
                            ([change, to]) => change in rcmdtnTrns && !(to in rcmdtnTrns)
                        )
                        .forEach(([change, to]) => {
                            rcmdtnTrns[to] = rcmdtnTrns[change];
                            delete rcmdtnTrns[change];
                        });
                });
            }
        }
        let chartData = null;
        if (Array.isArray(response.monthsTotals)) {
            chartData = {
                column: true,
                dataLabelsEnabled: true,
                gridLineWidth: 0,
                markerEnabled: false,
                crosshair: false,
                xAxiscategories: [],
                min: 0,
                series: [
                    {
                        stack: 'a',
                        showInLegend: false,
                        enableMouseTracking: false,
                        color: '#f7f7f7',
                        data: []
                    },
                    {
                        stack: 'a',
                        showInLegend: false,
                        enableMouseTracking: false,
                        color: '#00a9a5',
                        data: [],
                        dataLabels: {
                            style: {
                                textOutline: '0px',
                                color: '#0f3860',
                                fontSize: '14px',
                                fontWeight: '400'
                            },
                            // align: 'center',
                            verticalAlign: 'top',
                            crop: false,
                            overflow: 'none',
                            y: -30,
                            formatter: function () {
                                const formattedVal = roundAndAddComma(this.y);
                                return formattedVal !== '0' ? formattedVal : null;
                            },
                            enabled: true
                        }
                    }
                ]
            };

            response.monthsTotals.sort((a, b) => a.month - b.month);
            response.monthsTotals.forEach((val) => {
                chartData.series[1].data.push({
                    y: val.total ? Math.abs(val.total) : null
                });
                chartData.xAxiscategories.push(
                    this.userService.appData.moment(val.month).format('MM/YY')
                );
            });
            const yVals = chartData.series[1].data.map((val) => val.y);
            chartData.max = Math.ceil(Math.max(...yVals));
            chartData.series[1].data.forEach((clmn) => {
                chartData.series[0].data.push({
                    y: chartData.max - clmn.y
                });
            });
        }

        response.chartData = chartData;
        return response;
    }

    transactionTrack(idx, transaction) {
        return transaction.transId;
    }

    onHistoryRowHandleClick(trns: any) {
        if (!trns.transId) {
            trns.transId = this.cyclicTrans.transId;
        }
        this.restCommonService.setDismissed(trns).subscribe(() => {
            this.historyRecordDeleted.next(trns);
            this.forceReload$.next();
        });

        // const request = {
        //     'array': [
        //         {
        //             'dateFrom': trns.dateFrom,
        //             'dateTill': trns.dateTill,
        //             'dueDate': null,
        //             'hova': true,
        //             'matchLinkId': trns.matchLinkId,
        //             'matchedBy': null,
        //             'paymentDesc': null,
        //             'targetId': null,
        //             'targetName': trns.targetName,
        //             'targetTotal': null,
        //             'targetTransTypeId': null,
        //             'targetTypeId': trns.targetTypeId,
        //             'targetTypeName': null,
        //             'transId': trns.transId
        //         }
        //     ],
        //     'bankMatchTransInner': {
        //         'asmachta': null,
        //         'bankPaymentDesc': null,
        //         'bankTotal': null,
        //         'bankTransId': trns.bankTransId,
        //         'companyAccountId': this.cyclicTrans.companyAccountId,
        //         'expence': null,
        //         'matchDate': null,
        //         'matchedUserName': null,
        //         'pictureLink': null,
        //         'transDate': null,
        //         'transDesc': null
        //     }
        // };
        //
        // this.restCommonService.setApart(request)
        //     .subscribe(() => {
        //         this.historyRecordDeleted.next(trns);
        //         this.forceReload$.next();
        //     });
    }
}
