export function getDaysBetweenDates(date1, date2): number {
    const one_day: number = 1000 * 60 * 60 * 24;
    const date1_ms: number = date1.getTime();
    const date2_ms: number = date2.getTime();
    const difference_ms: number = date2_ms - date1_ms;
    return Math.round(difference_ms / one_day);
}

export function getMonthBetweenDates(dt2, dt1): number {
    let diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60 * 60 * 24 * 7 * 4;
    return Math.abs(Math.round(diff));
}

export function getMonthCountBetweenIncluded(from: Date, till: Date) {
    let run = new Date(from),
        count = 0;
    do {
        count++;
        run = new Date(run.setMonth(run.getMonth() + 1, 1));
    } while (run < till);

    // console.lo
    return count;
}

export function closestFutureDateNoWeekends(from: Date | number) {
    const run = new Date(
        from instanceof Date ? (from as Date).getTime() : (from as number)
    );
    do {
        run.setDate(run.getDate() + 1);
    } while (run.getDay() > 6);

    return run;
}

export function withinTwentyFourHours(from: Date | number) {
    const timeOfDayBefore = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), new Date().getHours() - 24, new Date().getMinutes()).getTime()
    return from > timeOfDayBefore;
}
