import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'sortIcon'
})
export class SortIconPipe implements PipeTransform {
    transform(value: 'asc' | 'desc' | null, args?: any): any {
        if (!!value && value.toLowerCase() === 'asc') {
            return 'sort_asc';
        } else if (!!value && value.toLowerCase() === 'desc') {
            return 'sort_desc';
        } else {
            return 'sort_unordered';
        }
    }
}
