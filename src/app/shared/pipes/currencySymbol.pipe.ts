import {getCurrencySymbol} from '@angular/common';

import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'currencySymbol',
    pure: true
})
export class CurrencySymbolPipe implements PipeTransform {
    transform(currencyCode: string | number): any {
        if (!currencyCode) {
            return '';
        }
        if (currencyCode === 'CHF') {
            return '₣';
        }

        if (typeof currencyCode === 'number') {
            // console.log('currencySymbol ===> %o', currencyCode);

            if (currencyCode === 1) {
                return getCurrencySymbol('ILS', 'narrow');
            } else if (currencyCode === 2) {
                return getCurrencySymbol('USD', 'narrow');
            } else if (currencyCode === 11) {
                return getCurrencySymbol('EUR', 'narrow');
            }
        }

        return getCurrencySymbol(String(currencyCode), 'narrow');
    }
}
