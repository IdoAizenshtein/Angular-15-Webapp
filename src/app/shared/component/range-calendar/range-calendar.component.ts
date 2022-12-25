import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {Range, RangePoint} from '../date-range-selectors/presets';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-range-calendar',
    templateUrl: './range-calendar.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class RangeCalendarComponent implements OnInit, OnChanges {
    RangeSelectionType = RangeSelectionType;
    @Input()
    selectionType = RangeSelectionType.MONTHS;

    @Input()
    min: Date;
    @Input()
    max: Date;

    @Input()
    selection: Range;

    allowed: Range;
    years: number[];

    current: {
        from: {
            month: number;
            year: number;
        };
        till: {
            month: number;
            year: number;
        };
    };

    readonly locale: any;

    currentDates: {
        from: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][];
        till: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][];
    };

    constructor(
        public translate: TranslateService,
        public userService: UserService
    ) {
        this.locale = translate.instant('langCalendar');
    }

    ngOnInit(): void {
        if (!this.min || !this.max) {
            this.max = new Date();
            this.min = new Date(this.max);
            this.min.setFullYear(this.min.getFullYear() - 2);

            this.rebuildConstraints();
        }
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (
            (changes['min'] && changes['min'].currentValue) ||
            (changes['max'] && changes['max'].currentValue)
        ) {
            this.rebuildConstraints();
        }
    }

    private rebuildConstraints() {
        this.allowed = {
            from: new RangePoint(
                this.min.getDate(),
                this.min.getMonth(),
                this.min.getFullYear()
            ),
            till: new RangePoint(
                this.max.getDate(),
                this.max.getMonth(),
                this.max.getFullYear()
            )
        };

        this.rebuildLists();

        this.current = {
            from:
                this.selection && this.selection.from
                    ? {
                        month: this.selection.from.month,
                        year: this.selection.from.year
                    }
                    : {
                        month: this.allowed.from.month,
                        year: this.allowed.from.year
                    },
            till:
                this.selection && this.selection.till
                    ? {
                        month: this.selection.till.month,
                        year: this.selection.till.year
                    }
                    : {
                        month: this.allowed.till.month,
                        year: this.allowed.till.year
                    }
        };
        this.currentDates = {
            from: this.createMonth(this.current.from),
            till: this.createMonth(this.current.till)
        };
    }

    private rebuildLists(): void {
        this.years = [];
        for (let i = this.allowed.from.year; i <= this.allowed.till.year; i++) {
            this.years.push(i);
        }
    }

    private toMonths(mon: number, year: number): number {
        if (mon < 0) {
            mon = mon + 12;
            year -= 1;
        } else if (mon >= 12) {
            mon = mon % 12;
            year += 1;
        }
        return year * 12 + mon;
    }

    mayNavigateTo(mon: number | null, year: number) {
        const inpnum = this.toMonths(mon, year);

        return (
            this.toMonths(
                mon === null ? 0 : this.allowed.from.month,
                this.allowed.from.year
            ) <= inpnum &&
            inpnum <=
            this.toMonths(
                mon === null ? 0 : this.allowed.till.month,
                this.allowed.till.year
            )
        );
    }

    isBefore(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) <
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    isAfter(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) >
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    isEqual(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) ===
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    isInsideSelectionRange(year: number, month: number, day: number = 0) {
        if (!this.selection.from || !this.selection.till) {
            return false;
        }

        if (day === 0) {
            const inpnum = this.toMonths(month, year);
            return (
                this.toMonths(this.selection.from.month, this.selection.from.year) <=
                inpnum &&
                inpnum <=
                this.toMonths(this.selection.till.month, this.selection.till.year)
            );
        }

        const dt = new Date(year, month, day);
        return (
            new Date(
                this.selection.from.year,
                this.selection.from.month,
                this.selection.from.day
            ) <= dt &&
            dt <=
            new Date(
                this.selection.till.year,
                this.selection.till.month,
                this.selection.till.day
            )
        );
    }

    makesSelectionInvalid(from: any, till: any) {
        if (!from || !till) {
            return false;
        }

        return RangePoint.asDate(from) > RangePoint.asDate(till);
    }

    stepMonth(monYear: { month: number; year: number }, step: number) {
        const rsltMonIdx = monYear.month + step;
        if (rsltMonIdx < 0) {
            monYear.month = rsltMonIdx + 12;
            monYear.year -= 1;
        } else if (rsltMonIdx >= 12) {
            monYear.month = rsltMonIdx % 12;
            monYear.year += 1;
        } else {
            monYear.month = rsltMonIdx;
        }
    }

    select(range: { from: any; till: any }) {
        if (this.selection) {
            if (!range.from && this.selection.from) {
                this.selection.from = null;
            } else if (
                range.from &&
                (!this.selection.from || !this.selection.from.toDate)
            ) {
                if (range.from.toDate) {
                    this.selection.from = range.from;
                } else {
                    this.selection.from = new RangePoint(
                        range.from.day,
                        range.from.month,
                        range.from.year
                    );
                }
            } else if (range.from && this.selection.from) {
                this.selection.from.copy(range.from);
            }

            if (!range.till && this.selection.till) {
                this.selection.till = null;
            } else if (
                range.till &&
                (!this.selection.till || !this.selection.till.toDate)
            ) {
                if (range.till.toDate) {
                    this.selection.till = range.till;
                } else {
                    this.selection.till = new RangePoint(
                        range.till.day,
                        range.till.month,
                        range.till.year
                    );
                }
            } else if (range.till && this.selection.till) {
                this.selection.till.copy(range.till);
            }
        } else {
            this.selection = range;
        }
    }

    createMonth(monYear: { month: number; year: number }): {
        day: number;
        month: number;
        year: number;
        today: boolean;
        selectable: boolean;
    }[][] {
        const dates: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][] = [];
        const firstDay = this.getFirstDayOfMonthIndex(monYear.month, monYear.year);
        const daysLength = this.getDaysCountInMonth(monYear.month, monYear.year);
        const prevMonthDaysLength = this.getDaysCountInPrevMonth(
            monYear.month,
            monYear.year
        );
        const sundayIndex = this.getSundayIndex();
        let dayNo = 1;
        const today = this.userService.appData.moment().toDate();

        for (let i = 0; i < 6; i++) {
            const week = [];

            if (i === 0) {
                for (
                    let j = prevMonthDaysLength - firstDay + 1;
                    j <= prevMonthDaysLength;
                    j++
                ) {
                    const prev = this.getPreviousMonthAndYear(
                        monYear.month,
                        monYear.year
                    );
                    week.push({
                        day: j,
                        month: prev.month,
                        year: prev.year,
                        otherMonth: true,
                        today: this.isToday(today, j, prev.month, prev.year),
                        selectable: this.isSelectable(j, prev.month, prev.year)
                    });
                }

                const remainingDaysLength = 7 - week.length;
                for (let j = 0; j < remainingDaysLength; j++) {
                    week.push({
                        day: dayNo,
                        month: monYear.month,
                        year: monYear.year,
                        today: this.isToday(today, dayNo, monYear.month, monYear.year),
                        selectable: this.isSelectable(dayNo, monYear.month, monYear.year)
                    });
                    dayNo++;
                }
            } else {
                for (let j = 0; j < 7; j++) {
                    if (dayNo > daysLength) {
                        const next = this.getNextMonthAndYear(monYear.month, monYear.year);
                        week.push({
                            day: dayNo - daysLength,
                            month: next.month,
                            year: next.year,
                            otherMonth: true,
                            today: this.isToday(
                                today,
                                dayNo - daysLength,
                                next.month,
                                next.year
                            ),
                            selectable: this.isSelectable(
                                dayNo - daysLength,
                                next.month,
                                next.year
                            )
                        });
                    } else {
                        week.push({
                            day: dayNo,
                            month: monYear.month,
                            year: monYear.year,
                            today: this.isToday(today, dayNo, monYear.month, monYear.year),
                            selectable: this.isSelectable(dayNo, monYear.month, monYear.year)
                        });
                    }

                    dayNo++;
                }
            }

            dates.push(week);
        }

        return dates;
    }

    isSelectable(day, month, year): boolean {
        let validMin = true;
        let validMax = true;

        if (this.min) {
            if (this.min.getFullYear() > year) {
                validMin = false;
            } else if (this.min.getFullYear() === year) {
                if (this.min.getMonth() > month) {
                    validMin = false;
                    // } else if (this.min.getMonth() === month) {
                    //     if (this.min.getDate() > day) {
                    //         validMin = false;
                    //     }
                }
            }
        }

        if (this.max) {
            if (this.max.getFullYear() < year) {
                validMax = false;
            } else if (this.max.getFullYear() === year) {
                if (this.max.getMonth() < month) {
                    validMax = false;
                } else if (this.max.getMonth() === month) {
                    if (this.max.getDate() < day) {
                        validMax = false;
                    }
                }
            }
        }

        return validMin && validMax;
    }

    getFirstDayOfMonthIndex(month: number, year: number) {
        const day = new Date();
        day.setDate(1);
        day.setMonth(month);
        day.setFullYear(year);

        const dayIndex = day.getDay() + this.getSundayIndex();
        return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    }

    getDaysCountInMonth(month: number, year: number) {
        return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
    }

    getDaysCountInPrevMonth(month: number, year: number) {
        const prev = this.getPreviousMonthAndYear(month, year);
        return this.getDaysCountInMonth(prev.month, prev.year);
    }

    getPreviousMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 0) {
            m = 11;
            y = year - 1;
        } else {
            m = month - 1;
            y = year;
        }

        return {month: m, year: y};
    }

    getNextMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 11) {
            m = 0;
            y = year + 1;
        } else {
            m = month + 1;
            y = year;
        }

        return {month: m, year: y};
    }

    getSundayIndex() {
        return this.locale.firstDayOfWeek > 0 ? 7 - this.locale.firstDayOfWeek : 0;
    }

    daylightSavingAdjust(date) {
        if (!date) {
            return null;
        }

        date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);

        return date;
    }

    isToday(today, day, month, year): boolean {
        return (
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year
        );
    }
}

export enum RangeSelectionType {
    MONTHS,
    DAYS
}
