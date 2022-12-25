import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'privilegeTypeHumanize',
    pure: true
})
export class PrivilegeTypeHumanizePipe implements PipeTransform {
    constructor(public translate: TranslateService) {
    }

    transform(
        privilegeType:
            | 'KSAFIM'
            | 'ANHALATHESHBONOT'
            | 'COMPANYADMIN'
            | 'COMPANYSUPERADMIN'
            | 'REGULAR'
            | null
    ): string {
        if (!privilegeType) {
            return '';
        }

        switch (privilegeType) {
            case 'COMPANYSUPERADMIN':
                return this.translate.instant('userTypes.sysAdmin');
            case 'COMPANYADMIN':
                return this.translate.instant('userTypes.primaryUser');
            case 'ANHALATHESHBONOT':
            case 'KSAFIM':
            case 'REGULAR':
                return this.translate.instant('userTypes.user');
            default:
                return '';
        }
    }
}
