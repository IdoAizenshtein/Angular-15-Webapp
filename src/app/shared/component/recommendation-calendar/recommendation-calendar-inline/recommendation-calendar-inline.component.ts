import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';
import {distinctUntilChanged, filter, map, shareReplay, switchMap, tap} from 'rxjs/operators';
import {UserService} from '@app/core/user.service';
import {RestCommonService} from '@app/shared/services/restCommon.service';

@Component({
    selector: 'app-recommendation-calendar-inline',
    templateUrl: './recommendation-calendar-inline.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class RecommendationCalendarInlineComponent
    implements OnInit, OnChanges {
    selectedDate: Date;
    defaultDate: Date;

    private _presetData: {
        account: {
            companyAccountId: string;
            currency: string;
        };
        sum: string;
        month: number;
        year: number;
    };
    get presetData() {
        return this._presetData;
    }

    @Input()
    set presetData(val: any) {
        if (val) {
            this.presetData$.next(val);
        }
        this._presetData = val;
    }

    readonly presetData$: ReplaySubject<{
        account: {
            companyAccountId: string;
            currency: string;
        };
        sum: string;
        month: number;
        year: number;
    }> = new ReplaySubject(1);

    readonly recommendations$: Observable<{
        recommendedDate: number;
        recommendedDateDt: any;
        reommendationsList: [
            {
                color: string;
                dayTypeId: number;
                growHarigaDate: number;
                harigaDate: number;
                holiday: string;
                itra: number;
                newTotalCredit: number;
                totalCredit: number;
                transDate: number;
            }
        ];
        daysMap: {
            [k: string]: {
                color: string;
                dayTypeId: number;
                growHarigaDate: number;
                harigaDate: number;
                holiday: string;
                itra: number;
                newTotalCredit: number;
                totalCredit: number;
                transDate: number;
            };
        };
    }>;

    @Input()
    minDate: Date;

    readonly maxDate: Date;

    constructor(
        public userService: UserService,
        private restCommonService: RestCommonService
    ) {
        this.recommendations$ = this.presetData$.asObservable().pipe(
            filter((pr) => {
                return (
                    pr.account &&
                    pr.account.companyAccountId !== null &&
                    pr.month > 0 &&
                    pr.year > 0
                );
            }),
            distinctUntilChanged((pr1, pr2) => {
                // debugger;
                return (
                    (pr1 === null) === (pr2 === null) &&
                    pr1.account.companyAccountId === pr2.account.companyAccountId &&
                    pr1.sum === pr2.sum &&
                    pr1.month === pr2.month &&
                    pr1.year === pr2.year
                );
            }),
            tap(() => {
                console.log('recommendations now!!!');
            }),
            map((pr) => {
                // debugger;
                const range = {
                    dateFrom: new Date(pr.year, pr.month - 1, 1, 0, 0, 0, 0),
                    dateTill: new Date(pr.year, pr.month, 1, 0, 0, 0, 0)
                };
                range.dateTill.setDate(range.dateTill.getDate() - 1);
                range.dateTill.setHours(23, 59, 59, 999);

                return Object.assign(pr, range);
            }),
            switchMap((pr) =>
                restCommonService.getRecommendation({
                    companyAccountId: pr.account.companyAccountId,
                    dateFrom: pr.dateFrom,
                    dateTill: pr.dateTill,
                    total: pr.sum
                })
            ),
            map((rslt) => {
                if (!rslt || rslt.error) {
                    return null;
                }

                const recommendedDate = rslt.body.recommendedDate
                    ? new Date(rslt.body.recommendedDate)
                    : null;
                const rsltClient = Object.assign(rslt.body, {
                    daysMap: rslt.body.reommendationsList.reduce((acmltr, day) => {
                        const dt = new Date(day.transDate);
                        const key = dt.getDate() + '-' + dt.getMonth();
                        acmltr[key] = day;
                        return acmltr;
                    }, Object.create(null)),
                    recommendedDateDt: recommendedDate
                });

                return rsltClient;
            }),
            tap((rsltClient) => {
                this.selectedDate = rsltClient ? rsltClient.recommendedDateDt : null;
                this.defaultDate = rsltClient && rsltClient.reommendationsList && rsltClient.reommendationsList.length ? new Date(rsltClient.reommendationsList[10].transDate) : null;
            }),
            shareReplay(1)
        );

        this.minDate = new Date();
        this.maxDate = this.userService.appData
            .moment()
            .add(5, 'months')
            .endOf('month')
            .toDate();
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('')
        // if (changes['companyId']) {
        //     this.rebuildMainLoader();
        // }
    }

    ngOnInit() {
        console.log('')
        // this.rebuildMainLoader();
        // this.loadRecommendations({ month: new Date().getMonth() + 1, year: new Date().getFullYear()});
    }

    loadRecommendations($event: { month: number; year: number }): void {
        console.log('loadRecommendations called with %o', $event);

        if (this.presetData && $event) {
            this.presetData = Object.assign(
                JSON.parse(JSON.stringify(this.presetData)),
                $event
            );
        }
    }
}
