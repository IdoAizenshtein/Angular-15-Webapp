import {
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    forwardRef,
    Input,
    NgZone,
    OnInit,
    Output,
    Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Calendar} from 'primeng/calendar';
import {DomHandler} from 'primeng/dom';

import {FormControl, FormGroup, NG_VALUE_ACCESSOR, Validators} from '@angular/forms';
import {merge, Observable, ReplaySubject} from 'rxjs';
import {distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, tap} from 'rxjs/operators';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {DialogComponent} from '../../dialog/dialog.component';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {OverlayService, PrimeNGConfig} from 'primeng/api';
import {publishRef} from '../../../functions/publishRef'; //import {sharedComponent} from '../../../../customers/customers.component';

export const CALENDAR_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RecommendationCalendarInputComponent),
    multi: true
};

@Component({
    selector: 'app-recommendation-calendar-input',
    templateUrl: './recommendation-calendar-input.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [
        trigger('overlayState', [
            state(
                'hidden',
                style({
                    opacity: 0
                })
            ),
            state(
                'visible',
                style({
                    opacity: 1
                })
            ),
            transition('visible => hidden', animate('200ms ease-in')),
            transition('hidden => visible', animate('200ms ease-out'))
        ])
    ],
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: {
        '[class.p-inputwrapper-filled]': 'filled',
        '[class.p-inputwrapper-focus]': 'focus'
    },
    providers: [DomHandler, CALENDAR_VALUE_ACCESSOR]
})
export class RecommendationCalendarInputComponent
    extends Calendar
    implements OnInit {
    private _presetData: any;
    get presetData() {
        return this._presetData;
    }

    @Input()
    set presetData(val: any) {
        console.log('presetData set to %o', val);
        if (val) {
            if (!('month' in val)) {
                val.month = this.currentMonth;
            }
            if (!('year' in val)) {
                val.year = this.currentYear;
            }
            if (val.sum === '') {
                val.sum = null;
            }
            this.presetData$.next(val);
        }
        this._presetData = val;
    }

    readonly presetData$: ReplaySubject<{
        account: {
            companyAccountId: string;
            currency: string;
            isUpToDate: boolean;
        };
        sum: string;
        month: number;
        year: number;
    }> = new ReplaySubject(1);

    showRecommendationView = false;

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

    readonly rcmndtnInputs: any;
    readonly rcmndtnInput$: Observable<{
        account: {
            companyAccountId: string;
            currency: string;
            isUpToDate: boolean;
        };
        sum: string;
        month: number;
        year: number;
    }>;
    @ViewChild(DialogComponent) rcmndtnCalendarDlg;

    @Output()
    public readonly sumFromRecommendationApplied: EventEmitter<string> = new EventEmitter<string>();

    accountsUpToDate: Observable<any[]>;

    mayGoNextMonth: boolean;
    mayGoPrevMonth: boolean;
    isAboveRecommendationRange: boolean;

    constructor(
        domHandler: DomHandler,
        private restCommonService: RestCommonService,
        public userService: UserService,
        sharedComponent: SharedComponent,
        el: ElementRef,
        renderer: Renderer2,
        cd: ChangeDetectorRef,
        zone: NgZone,
        config: PrimeNGConfig,
        overlayService: OverlayService
    ) {
        super(el, renderer, cd, zone, config, overlayService);

        this.readonlyInput = true;
        console.log(this.dates)
        this.recommendations$ = this.presetData$.asObservable().pipe(
            // debounceTime(1000),
            filter((pr) => {
                // debugger;
                return (
                    pr.account &&
                    pr.account.companyAccountId !== null &&
                    pr.account.isUpToDate &&
                    pr.month >= 0 &&
                    pr.year > 0
                );
            }),
            distinctUntilChanged((pr1: any, pr2: any) => {
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
                const range = {
                    dateFrom: new Date(pr.year, pr.month, 1, 0, 0, 0, 0),
                    dateTill: new Date(pr.year, pr.month + 1, 1, 0, 0, 0, 0)
                };
                range.dateTill.setDate(range.dateTill.getDate() - 1);
                range.dateTill.setHours(23, 59, 59, 999);

                return Object.assign(pr, range);
            }),
            switchMap((pr: any) =>
                restCommonService.getRecommendation({
                    companyAccountId: pr.account.companyAccountId,
                    dateFrom: pr.dateFrom,
                    dateTill: pr.dateTill,
                    total: pr.sum
                })
            ),
            map((rslt: any) => {
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
            // tap (rsltClient => {
            //     // this.updateModel(rsltClient ? rsltClient.recommendedDateDt : null);
            // }),
            publishRef
            // shareReplay(1)
        );

        // this.onMonthChange.subscribe(
        //     ($event: { month: number, year: number }) => {
        //         if (this.presetData && $event) {
        //             console.log('loadRecommendations called with %o', $event);
        //             this.presetData = Object.assign(JSON.parse(JSON.stringify(this.presetData)), $event);
        //         }
        //     });
        this.rcmndtnInputs = new FormGroup({
            sum: new FormControl(null, {
                validators: [], // [Validators.required],
                updateOn: 'blur'
            }),
            // account: new FormControl(null, [Validators.required]),
            account: new FormControl(
                {
                    value: null,
                    disabled: true
                },
                [Validators.required]
            ),
            month: new FormControl(null, [Validators.required]),
            year: new FormControl(null, [Validators.required])
        });
        this.rcmndtnInput$ = this.rcmndtnInputs.valueChanges.pipe(
            filter(() => {
                // debugger;
                return this.rcmndtnInputs.valid;
            }),
            map(() => {
                // debugger;
                return this.rcmndtnInputs.getRawValue();
            }),
            publishRef
        );

        this.accountsUpToDate = merge(
            sharedComponent.getDataEvent,
            sharedComponent.forceAccountsReload$
        ).pipe(
            startWith(() => true),
            map(() => {
                return this.userService.appData.userData.accounts.filter(
                    (acc:any) => acc.isUpToDate
                );
            }),
            shareReplay(1)
        );
    }

    // override ngOnInit() {
    //     super.ngOnInit();
    //
    //     // if (this.presetData) {
    //     //     console.log('loadRecommendations called with month: %o, year: %o', this.currentMonth, this.currentYear);
    //     //     this.presetData = Object.assign(JSON.parse(JSON.stringify(this.presetData)), {
    //     //         month: this.currentMonth,
    //     //         year: this.currentYear
    //     //     });
    //     // }
    // }

    override onDateSelect(event, dateMeta) {
        if (this.disabled || !dateMeta.selectable) {
            event.preventDefault();
            return;
        }

        if (this.isMultipleSelection() && this.isSelected(dateMeta)) {
            this.value = this.value.filter((date, i) => {
                return !this.isDateEquals(date, dateMeta);
            });
            this.updateModel(this.value);
        } else {
            if (this.shouldSelectDate(dateMeta)) {
                if (dateMeta.otherMonth) {
                    if (this.selectOtherMonths) {
                        this.currentMonth = dateMeta.month;
                        this.currentYear = dateMeta.year;
                        this.createMonth(this.currentMonth, this.currentYear);
                        this.selectDate(dateMeta);
                    }
                } else {
                    this.selectDate(dateMeta);
                }
            }
        }

        // if (this.isSingleSelection() && (!this.showTime || this.hideOnDateTimeSelect)) {
        //     this.overlayVisible = false;
        // }

        this.updateInputfield();
        event.preventDefault();
    }

    override createMonths(month: number, year: number) {
        console.log('createMonth called with month: %o, year: %o', month, year);

        this.mayGoPrevMonth =
            !year || !this.minDate
                ? true
                : this.userService.appData
                    .moment([year, month, 1])
                    .subtract(1, 'month')
                    .isSameOrAfter(
                        this.userService.appData.moment(this.minDate),
                        'month'
                    );
        this.mayGoNextMonth =
            !year || !this.maxDate
                ? true
                : this.userService.appData
                    .moment([year, month, 1])
                    .add(1, 'month')
                    .isSameOrBefore(
                        this.userService.appData.moment(this.maxDate),
                        'month'
                    );
        this.isAboveRecommendationRange = this.userService.appData
            .moment([year, month, 1])
            .isSameOrAfter(
                this.userService.appData.moment().startOf('month').add(6, 'months')
            );

        if (this.presetData) {
            console.log(
                'loadRecommendations called with month:%o, year: %o',
                month,
                year
            );
            this.presetData = Object.assign(
                JSON.parse(JSON.stringify(this.presetData)),
                {
                    month: month,
                    year: year
                }
            );
        }

        this.months = this.months = [];
        for (let i = 0; i < this.numberOfMonths; i++) {
            let m = month + i;
            let y = year;
            if (m > 11) {
                m = (m % 11) - 1;
                y = year + 1;
            }

            this.months.push(this.createMonth(m, y));
        }
        this.dates = this.months[0]['dates'];
        console.log(this.months, this.dates)
        // super.createMonths(month, year)

    }

    applySelection() {
        if (
            this.isSingleSelection() &&
            (!this.showTime || this.hideOnDateTimeSelect)
        ) {
            this.overlayVisible = false;
        }
    }

    toggleRecommendationView() {
        // this.showRecommendationView = !this.showRecommendationView;
        // requestAnimationFrame(() => this.alignOverlay());

        if (this.showRecommendationView) {
            requestAnimationFrame(() => {
                this.inputfieldViewChild.nativeElement.focus();
            });
            // this.showOverlay();
        } else {
            this.overlayVisible = false;

            requestAnimationFrame(() => {
                const initDataToSet = Object.assign(
                    JSON.parse(JSON.stringify(this.presetData)),
                    {month: this.presetData.month + 1}
                );
                this.rcmndtnInputs.patchValue(initDataToSet);
                (this.rcmndtnCalendarDlg.mask as HTMLElement).style.backgroundColor =
                    'transparent';
            });
        }
        this.showRecommendationView = !this.showRecommendationView;
    }

    applyRecommendedSelection(value: Date, sum: string) {
        this.updateModel(value);
        this.onSelect.emit(value);
        this.updateInputfield();

        if (this.presetData.sum !== sum) {
            this.sumFromRecommendationApplied.emit(sum);
            this.presetData = Object.assign(
                JSON.parse(JSON.stringify(this.presetData)),
                {
                    sum: sum
                }
            );
        }

        this.showRecommendationView = false;
    }

    // override showOverlay() {
    //     this.onTimePickerElementMouseUp(null);
    //     // super.showOverlay();
    // }
}
