import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'alertStatusHumanize',
    pure: true
})
export class AlertStatusHumanizePipe implements PipeTransform {
    constructor(public translate: TranslateService) {
    }

    transform(
        alertStatus:
            | 'Error itrot sequence'
            | 'Not found in bank website'
            | string
            | null,
        statusSubject: 'account' | 'card' | 'solek' = null,
        prefix: string = null
    ): string {
        if (!alertStatus) {
            return '';
        }

        if (statusSubject) {
            return this.translate.instant(
                'alertStatusTranslate.' + statusSubject + '.' + alertStatus
            );
        }

        switch (alertStatus) {
            case 'Not found in bank website':
                return (prefix || '') + this.translate.instant('filters.inactive');
            default:
                return '';
        }
    }
}
