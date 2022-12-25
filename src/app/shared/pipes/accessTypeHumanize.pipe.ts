import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'accessTypeHumanize',
    pure: true
})
export class AccessTypeHumanizePipe implements PipeTransform {
    constructor(public translate: TranslateService) {
    }

    transform(accessType: 'KSAFIM' | 'ANHALATHESHBONOT' | 'ALL' | null): string {
        if (!accessType) {
            return '';
        }

        switch (accessType) {
            case 'ANHALATHESHBONOT':
            case 'KSAFIM':
            case 'ALL':
                return this.translate.instant('companyAccessTypes.' + accessType);
            default:
                return '';
        }
    }
}
