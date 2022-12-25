import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'messageTypeAsIconSrc',
    pure: true
})
export class MessageTypeAsIconSrcPipe implements PipeTransform {
    transform(value: string, ...args): any {
        switch (value) {
            case 'direct_debit':
                return '/assets/images/financial10.png';
            // return '/assets/images/msg-type-' + value + '.png';
            case 'system_alert':
                return '/assets/images/fb-logo-bizibox-32-32.png';
            case 'osh':
                return '/assets/images/osh.png';
            case 'slika':
                return '/assets/images/slika.png';
            case 'loan':
                return '/assets/images/loan.png';
            case 'bank_transfer':
                return '/assets/images/bank_transfer.png';
            case 'cheque':
                return '/assets/images/cheque.png';
            case 'credit_card':
                return '/assets/images/credit_card.png';
            case 'budget':
                return '/assets/images/budgetIcn.png';
            default:
                return '';
        }
    }
}
