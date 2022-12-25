import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'monthYear',
    pure: true
})
export class MonthYearPipe implements PipeTransform {
    constructor(public translate: TranslateService) {
    }

    transform(value: number | string | Date): any {
        if (!value) {
            return '';
        }

        let valueAsDate: Date = null;
        if (value instanceof Date) {
            valueAsDate = value;
        } else if (typeof value === 'number' && Number.isInteger(value)) {
            valueAsDate = new Date(value);
        } else if (
            typeof value === 'string' &&
            !Number.isNaN(Date.parse(value)) &&
            Date.parse(value) > 0
        ) {
            valueAsDate = new Date(value);
        }

        if (valueAsDate == null) {
            return '';
        }

        const now = new Date();
        return (
            this.translate.translations[this.translate.currentLang].langCalendar
                .monthNames[valueAsDate.getMonth()] +
            ' ' +
            valueAsDate.getFullYear()
        );
    }
}
