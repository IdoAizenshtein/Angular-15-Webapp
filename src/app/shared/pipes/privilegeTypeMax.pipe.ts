import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'privilegeTypeMax',
    pure: true
})
export class PrivilegeTypeMaxPipe implements PipeTransform {
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
            | Array<| 'KSAFIM'
            | 'ANHALATHESHBONOT'
            | 'COMPANYADMIN'
            | 'COMPANYSUPERADMIN'
            | 'REGULAR'>
    ): number {
        if (!privilegeType) {
            return -1;
        }

        return Array.isArray(privilegeType)
            ? privilegeType.reduce(
                (currMax, privType) => Math.max(currMax, this.asNumber(privType)),
                -1
            )
            : this.asNumber(privilegeType);
    }

    private asNumber(
        privilegeType:
            | 'KSAFIM'
            | 'ANHALATHESHBONOT'
            | 'COMPANYADMIN'
            | 'COMPANYSUPERADMIN'
            | 'REGULAR'
            | null
    ): number {
        switch (privilegeType) {
            case 'COMPANYSUPERADMIN':
                return 3;
            case 'COMPANYADMIN':
                return 2;
            case 'REGULAR':
                return 0;
            default:
                return -1;
        }
    }
}
