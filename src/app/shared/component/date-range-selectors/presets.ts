import {UserService} from '@app/core/user.service';

export class RangePoint {
    static asDate(rp: RangePoint) {
        if (!rp) {
            return null;
        }

        return new Date(rp.year, rp.month, rp.day);
    }

    constructor(public day: number, public month: number, public year: number) {
    }

    toDate(): Date | null {
        return RangePoint.asDate(this);
    }

    copy(val: { day: number; month: number; year: number }) {
        this.day = val.day;
        this.month = val.month;
        this.year = val.year;
    }
}

export interface Range {
    from: RangePoint;
    till: RangePoint;
}

export abstract class Preset implements Range {
    from: RangePoint;
    till: RangePoint;
    default?: boolean;
    useRawName?: boolean;

    protected constructor(readonly name: string) {
    }

    selectedPeriod(us: UserService): {
        fromDate: Date | null;
        toDate: Date | null;
    } {
        const rslt = {
            fromDate: null,
            toDate: null
        };

        if (!this.from) {
            rslt.fromDate = null;
        } else {
            rslt.fromDate = us.appData
                .moment([
                    this.from.year,
                    this.from.month,
                    this.from.day === 0 ? 1 : this.from.day
                ])
                .startOf('day')
                .toDate();
        }

        if (!this.till) {
            rslt.toDate = null;
        } else {
            let mmnt = us.appData.moment([
                this.till.year,
                this.till.month,
                this.till.day === 0 ? 1 : this.till.day
            ]);
            if (this.till.day === 0) {
                mmnt = mmnt.endOf('month');
            }
            rslt.toDate = mmnt.endOf('day').toDate();
        }
        // if (this.till && this.till.day === 0) {
        //     rslt.toDate = new Date(this.till.year, this.till.month, 1);
        //     rslt.toDate.setMonth(rslt.toDate.getMonth() + 1);
        //     rslt.toDate.setDate(rslt.toDate.getDate() - 1);
        // } else {
        //     rslt.toDate = this.till ? this.till.toDate() : null;
        // }
        return rslt;
    }
}

export class CustomPreset extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(name: string) {
        super(name);
    }

    static createMonthsPreset(
        mon: number,
        year,
        monTill?: number,
        yearTill?: number
    ): CustomPreset {
        const rslt = new CustomPreset('customMonths');
        rslt.from = new RangePoint(0, mon, year);
        rslt.till = new RangePoint(
            0,
            monTill !== null && isFinite(monTill) ? monTill : mon,
            yearTill !== null && isFinite(yearTill) ? yearTill : year
        );

        return rslt;
    }

    static createDatesPreset(
        from: number | Date,
        till?: number | Date
    ): CustomPreset {
        const rslt = new CustomPreset('customDates');
        const _from = from instanceof Date ? from : new Date(from);
        const _till =
            till !== null && till !== undefined
                ? till instanceof Date
                    ? till
                    : new Date(till)
                : _from;

        rslt.from = new RangePoint(
            _from.getDate(),
            _from.getMonth(),
            _from.getFullYear()
        );
        rslt.till = new RangePoint(
            _till.getDate(),
            _till.getMonth(),
            _till.getFullYear()
        );

        return rslt;
    }
}

export class NDaysFromNow extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(readonly daysDelta: number, name?: string) {
        super(
            name
                ? name
                : (daysDelta > 0 ? 'next' : 'last') + Math.abs(daysDelta) + 'Days'
        );
        const now = new Date();

        if (daysDelta < 0) {
            this.till = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
            now.setDate(now.getDate() + daysDelta + 1);
            this.from = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
        } else {
            this.from = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
            now.setDate(now.getDate() + daysDelta);
            this.till = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
        }
    }
}

export class NFromStartWorkDate extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(readonly dateFrom: any) {
        super('all');
        const now = new Date();
        this.till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
        this.from = new RangePoint(
            dateFrom.getDate(),
            dateFrom.getMonth(),
            dateFrom.getFullYear()
        );
        this.default = true;
    }
}


export class NMonthsFromNow extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(readonly monthsDelta: number, name?: string) {
        super(
            name
                ? name
                : Math.trunc(monthsDelta) === 0
                    ? 'currentMonth'
                    : (Math.trunc(monthsDelta) < 0 ? 'last' : 'next') +
                    Math.abs(Math.trunc(monthsDelta)) +
                    'Months'
        );

        const now = new Date();
        const monthsDeltaInt = Math.trunc(monthsDelta);
        if (monthsDeltaInt === 0) {
            if (monthsDeltaInt === monthsDelta) {
                this.till = new RangePoint(0, now.getMonth(), now.getFullYear());
                this.from = new RangePoint(0, now.getMonth(), now.getFullYear());
            } else {
                if (monthsDelta > 0) {
                    this.from = new RangePoint(
                        now.getDate(),
                        now.getMonth(),
                        now.getFullYear()
                    );
                    now.setFullYear(now.getFullYear(), now.getMonth() + 1, 0);
                    this.till = new RangePoint(
                        now.getDate(),
                        now.getMonth(),
                        now.getFullYear()
                    );
                } else {
                    this.till = new RangePoint(
                        now.getDate(),
                        now.getMonth(),
                        now.getFullYear()
                    );
                    this.from = new RangePoint(1, now.getMonth(), now.getFullYear());
                }
            }
        } else if (monthsDelta > 0) {
            if (monthsDeltaInt === monthsDelta) {
                this.from = new RangePoint(
                    now.getDate(),
                    now.getMonth(),
                    now.getFullYear()
                );
                now.setMonth(now.getMonth() + monthsDelta);
                this.till = new RangePoint(
                    now.getDate(),
                    now.getMonth(),
                    now.getFullYear()
                );
            } else {
                this.from = new RangePoint(
                    now.getDate(),
                    now.getMonth(),
                    now.getFullYear()
                );
                now.setFullYear(
                    now.getFullYear(),
                    now.getMonth() + monthsDeltaInt + 1,
                    0
                );
                this.till = new RangePoint(
                    now.getDate(),
                    now.getMonth(),
                    now.getFullYear()
                );
            }
        } else {
            if (monthsDeltaInt === monthsDelta) {
                this.till = new RangePoint(
                    now.getDate(),
                    now.getMonth(),
                    now.getFullYear()
                );
                now.setMonth(now.getMonth() + monthsDelta);
                this.from = new RangePoint(
                    now.getDate(),
                    now.getMonth(),
                    now.getFullYear()
                );
            } else {
                this.till = new RangePoint(
                    now.getDate(),
                    now.getMonth(),
                    now.getFullYear()
                );
                now.setMonth(now.getMonth() + monthsDeltaInt);
                this.from = new RangePoint(1, now.getMonth(), now.getFullYear());
            }
        }
    }
}

export class NthMonthFromNow extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(readonly monthsDelta: number, name?: string) {
        super(
            name
                ? name
                : monthsDelta === 0
                    ? 'currentMonth'
                    : (monthsDelta < 0 ? 'past' : 'future') +
                    Math.abs(monthsDelta) +
                    'Month'
        );

        const now = new Date();
        now.setMonth(now.getMonth() + monthsDelta);
        this.from = new RangePoint(0, now.getMonth(), now.getFullYear());
        this.till = new RangePoint(0, now.getMonth(), now.getFullYear());
    }
}

export class NWeeksFromNow extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(readonly weeksDelta: number, name?: string) {
        super(
            name
                ? name
                : weeksDelta === 0
                    ? 'currentWeek'
                    : (weeksDelta < 0 ? 'last' : 'next') + Math.abs(weeksDelta) + 'Weeks'
        );
        const now = new Date();
        const startOfCurrentWeek = new Date();
        startOfCurrentWeek.setDate(now.getDate() - now.getDay());

        if (weeksDelta === 0 || (weeksDelta < 0 && weeksDelta > -1)) {
            this.from = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
            this.till = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
        } else if (weeksDelta > 0 && weeksDelta < 1) {
            this.from = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
            startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7);
            this.till = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
        } else if (weeksDelta > 0) {
            this.from = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
            startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7 * weeksDelta);
            this.till = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
        } else {
            this.till = new RangePoint(
                now.getDate(),
                now.getMonth(),
                now.getFullYear()
            );
            startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7 * weeksDelta);
            this.from = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
        }
    }
}

export class NthWeekFromNow extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(readonly weeksDelta: number, name?: string) {
        super(
            name
                ? name
                : weeksDelta === 0
                    ? 'currentWeek'
                    : (weeksDelta < 0 ? 'past' : 'future') + Math.abs(weeksDelta) + 'Week'
        );

        const now = new Date();
        const startOfCurrentWeek = new Date();
        startOfCurrentWeek.setDate(now.getDate() - now.getDay());

        if (
            weeksDelta === 0 ||
            (weeksDelta < 0 && weeksDelta > -1) ||
            (weeksDelta > 0 && weeksDelta < 1)
        ) {
            this.from = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
            startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7 - 1);
            this.till = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
        } else {
            startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7 * weeksDelta);
            this.from = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
            startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 7 - 1);
            this.till = new RangePoint(
                startOfCurrentWeek.getDate(),
                startOfCurrentWeek.getMonth(),
                startOfCurrentWeek.getFullYear()
            );
        }
    }
}

export class NthYearFromNow extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor(readonly yearsDelta: number, name?: string) {
        super(
            name
                ? name
                : String(
                    new Date(
                        new Date().setFullYear(new Date().getFullYear() + yearsDelta)
                    ).getFullYear()
                )
        );

        this.useRawName = !name;

        const dt = new Date();
        dt.setFullYear(dt.getFullYear() + yearsDelta);
        this.from = new RangePoint(0, 0, dt.getFullYear());
        this.till = new RangePoint(0, 11, dt.getFullYear());
    }
}

export class CCardFuture extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor() {
        super('cCardFuture');

        const now = new Date();
        now.setDate(1);
        this.from = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );

        now.setMonth(now.getMonth() + 3);
        now.setDate(now.getDate() - 1);
        this.till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
    }
}

export class CCardClosestFuture extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor() {
        super('cCardClosestFuture');

        const now = new Date();
        now.setDate(1);
        this.from = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );

        now.setMonth(now.getMonth() + 2);
        now.setDate(now.getDate() - 1);
        this.till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
    }
}

export class CCardClosestPast extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor() {
        super('cCardClosestPast');

        const now = new Date();
        this.till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );

        now.setDate(1);
        now.setMonth(now.getMonth() - 1);
        this.from = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
    }
}

export class ClrAgencyFuture extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor() {
        super('clrAgencyFuture');

        const now = new Date();
        this.from = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );

        // now.setMonth(now.getMonth() + 4);
        // now.setDate(now.getDate() - 1);
        // this.till = new RangePoint(now.getDate(), now.getMonth(), now.getFullYear());
        this.till = null;
    }
}

export class ClrAgencyClosestFuture extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor() {
        super('clrAgencyClosestFuture');

        const now = new Date();
        now.setDate(1);
        this.from = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );

        now.setMonth(now.getMonth() + 2);
        now.setDate(now.getDate() - 1);
        this.till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
    }
}

export class ClrAgencyClosestPast extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor() {
        super('clrAgencyClosestPast');

        const now = new Date();
        this.till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );

        now.setDate(1);
        now.setMonth(now.getMonth() - 1);
        this.from = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
    }
}

export class OverviewLatest extends Preset {
    override from: RangePoint;
    override till: RangePoint;

    constructor() {
        super('overviewLatest');

        const now = new Date();
        if (now.getDate() < 2) {
            const fr = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            this.from = new RangePoint(fr.getDate(), fr.getMonth(), fr.getFullYear());
        } else {
            this.from = new RangePoint(1, now.getMonth(), now.getFullYear());
        }
        this.till = new RangePoint(
            now.getDate(),
            now.getMonth(),
            now.getFullYear()
        );
    }
}
