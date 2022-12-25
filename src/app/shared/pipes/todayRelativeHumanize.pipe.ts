import {Inject, LOCALE_ID, Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {DatePipe} from '@angular/common';
import {UserService} from '@app/core/user.service';

@Pipe({
    name: 'todayRelativeHumanize',
    pure: true
})
export class TodayRelativeHumanizePipe implements PipeTransform {
    private readonly datePipe: DatePipe;

    constructor(
        public translate: TranslateService,
        @Inject(LOCALE_ID) private locale: string,
        public userService: UserService
    ) {
        this.datePipe = new DatePipe(locale);
    }

    transform(
        value: number | string | Date,
        format: string = 'dd/MM/yy',
        otherwise: string = ''
    ): any {
        if (!value) {
            return otherwise;
        }

        const mmnt = this.userService.appData.moment(value);
        if (!mmnt.isValid()) {
            return otherwise;
        }

        const daysBetween = this.userService.appData
            .moment()
            .startOf('day')
            .diff(mmnt.startOf('day'), 'days');

        // console.log('====> %o - %o = %o days',
        //   this.datePipe.transform(valueAsDate, format),
        //   this.datePipe.transform(today, format),
        //   daysBetween);

        if (format === 'dataReceiveDate') {
            if (daysBetween > 0) {
                return this.datePipe.transform(value, 'dd/MM/yy HH:mm');
            } else {
                return (
                    this.translate.instant('sumsTitles.today') +
                    ' ' +
                    this.datePipe.transform(value, 'HH:mm')
                );
            }
        }

        if (format === 'drugged') {
            return (
                this.translate.translations[this.translate.currentLang].sumsTitles
                    .dragged +
                ' ' +
                daysBetween +
                ' ' +
                this.translate.translations[this.translate.currentLang].sumsTitles.days
            );
        }

        if (format === 'itraHeader') {
            if (daysBetween === 0) {
                return this.translate.instant('sumsTitles.balanceUpToday');
            } else {
                return (
                    this.translate.instant('sumsTitles.balanceOutdated') +
                    this.datePipe.transform(mmnt.toDate(), 'dd/MM/yy')
                );
            }
        }

        switch (daysBetween) {
            case 0:
                return this.translate.instant('sumsTitles.today');
            case 1:
                return this.translate.instant('sumsTitles.yesterday');
            case -1:
                return this.translate.instant('sumsTitles.tomorrow');
            default:
                return format !== 'days'
                    ? this.datePipe.transform(mmnt.toDate(), format)
                    : (daysBetween > 0
                        ? this.translate.instant('sumsTitles.before')
                        : this.translate.instant('sumsTitles.in')) +
                    ' ' +
                    Math.abs(daysBetween) +
                    ' ' +
                    this.translate.instant('sumsTitles.days');
        }
    }
}
