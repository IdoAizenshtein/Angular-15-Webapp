import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'isPeriodicType',
    pure: true
})
export class IsPeriodicTypePipe implements PipeTransform {
    static periodicTypes = [
        'CYCLIC_TRANS',
        'SOLEK_TAZRIM',
        'CCARD_TAZRIM',
        'LOAN_TAZRIM',
        'DIRECTD',
        'CASH'
    ];

    transform(value: string): boolean {
        if (!value) {
            return null;
        }

        return value && IsPeriodicTypePipe.periodicTypes.includes(value);
    }
}
