import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {TitleCasePipe, WeekDay} from '@angular/common';

@Pipe({
    name: 'transactionFrequencyHumanize',
    pure: true
})
export class TransactionFrequencyHumanizePipe implements PipeTransform {
    constructor(
        public translate: TranslateService,
        private titleCase: TitleCasePipe
    ) {
    }

    transform(frequencyInterval: number | string, frequencyType: string): string {
        if (frequencyInterval === frequencyType) {
            return '';
        }

        const frequencyTypeConfig: {
            [key: string]: { text: string; pattern: string };
        } = this.translate.instant('transactionFrequencyTypes');

        if (!frequencyTypeConfig[frequencyType]) {
            return '';
        }

        try {
            let param: { day: string };
            if (frequencyType === 'DAY') {
                param = {
                    day: Number.isInteger(frequencyInterval as number)
                        ? this.translate.instant('langCalendar.dayNames')[
                        (frequencyInterval as number) - 1
                            ]
                        : (frequencyInterval as string) && (frequencyInterval as string)
                            ? (frequencyInterval as string)
                                .split(',')
                                .map((day) => {
                                    const weekdayIdx = Number.isInteger(Number(day))
                                        ? Number(day) - 1
                                        : WeekDay[this.titleCase.transform(day)];
                                    return this.translate.instant('langCalendar.dayNamesShort')[
                                        weekdayIdx
                                        ];
                                })
                                .join(', ')
                            : null
                };
                if (param.day !== null && param.day !== undefined) {
                    return this.translate.instant(
                        `transactionFrequencyTypes.WEEK.pattern`,
                        param
                    );
                }
            } else if (frequencyType === 'WEEK' || frequencyType === 'WEEKLY') {
                const weekdayIdx: number = Number.isInteger(frequencyInterval as number)
                    ? (frequencyInterval as number) - 1
                    : WeekDay[this.titleCase.transform(frequencyInterval as string)];
                param = {
                    day: this.translate.instant('langCalendar.dayNames')[weekdayIdx]
                };
            } else {
                const datesInMonth =
                    typeof frequencyInterval === 'number'
                        ? [frequencyInterval]
                        : (frequencyInterval as string)
                            .split(',')
                            .map((num) => Number(num))
                            .filter(isFinite);
                if (!datesInMonth.length) {
                    throw new Error(
                        'Failed to parse dates in month from ' + frequencyInterval
                    );
                }
                param = {
                    day: datesInMonth.join(', ')
                };
            }

            return this.translate.instant(
                `transactionFrequencyTypes.${frequencyType}.pattern`,
                param
            );
        } catch (e) {
            return '';
        }
    }
}
