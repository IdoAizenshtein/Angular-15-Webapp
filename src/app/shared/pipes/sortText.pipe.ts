import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'sortTextPipe',
    pure: true
})
export class SortTextPipe implements PipeTransform {
    transform(items: any, input: any, operator: string = 'asc'): any {
        if (!items) {
            return items;
        }

        return [].concat(items).sort(function (a, b) {
            return operator === 'asc'
                ? new Intl.Collator().compare(a[input], b[input])
                : -1 * new Intl.Collator().compare(a[input], b[input]);
        });
    }
}
