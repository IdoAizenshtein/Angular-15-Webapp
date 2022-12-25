import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'findInArrayBy'
})
export class FindInArrayByPipe implements PipeTransform {
    transform(values: Array<any>, fieldName: string, fieldValue: any): any {
        if (!Array.isArray(values) || !values.length || !fieldName) {
            return null;
        }

        return values.find(
            (value) => fieldName in value && value[fieldName] === fieldValue
        );
    }
}
