import {Pipe, PipeTransform} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Pipe({
    name: 'toIconSrc',
    pure: true
})
export class ToIconSrcPipe implements PipeTransform {
    private readonly banksOutOfOrder = [34, 57, 58];

    constructor(private translate: TranslateService) {
    }

    transform(
        value: number | string | any,
        prefix: string = '',
        size: string = '',
        isSmallSize: boolean = false
    ): string | null {
        let _val: number;
        if (!value || !((_val = +value) > 0)) {
            return null;
        }

        if (!prefix || prefix === 'any') {
            let transGrp;
            if (
                Object.keys((transGrp = this.translate.instant('banks'))).includes(
                    String(value)
                ) ||
                this.banksOutOfOrder.includes(_val)
            ) {
                prefix = 'bank';
            } else if (
                Object.keys(
                    (transGrp = this.translate.instant('creditCards'))
                ).includes(String(value))
            ) {
                prefix = 'card';
            } else if (
                Object.keys(
                    (transGrp = this.translate.instant('clearingAgencies'))
                ).includes(String(value))
            ) {
                prefix = 'solek';
            }
        }

        if (prefix === 'bank') {
            if (_val === 122) {
                _val = 12;
            } else if (_val === 157 || _val === 57) {
                _val = 17;
            } else if (_val === 158 || _val === 58) {
                _val = 11;
            } else if (_val === 34) {
                _val = 10;
            } else if (_val === 55) {
                _val = 31;
            }
        }
        if (isSmallSize) {
            return `/assets/images/bankAndCardsIcons/${prefix}${_val}${
                size ? '-' + size : ''
            }.png`;
        } else {
            return `/assets/images/${prefix}${_val}${size ? '-' + size : ''}.png`;
        }
    }
}
