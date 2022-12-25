import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'sortPipe',
    pure: true
})
export class SortPipe implements PipeTransform {
    transform(items: any, input: any, operator: string = 'bigger'): any {
        if (!items || !input) {
            return items;
        }

        items.sort(function (a, b) {
            if (a[input] === b[input]) {
                return 0;
            }

            if (input in a !== input in b) {
                return input in a ? -1 : 1;
            }

            if (!operator || operator === 'bigger') {
                return a[input] > b[input] ? 1 : -1;
            } else {
                return a[input] < b[input] ? 1 : -1;
            }
        });
        return items;
    }
}
