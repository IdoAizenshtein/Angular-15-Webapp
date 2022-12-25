import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'ifNotIn'
})
export class IfNotInPipe implements PipeTransform {
    transform(source: Array<any>, another: Array<any>): any {
        if (
            !Array.isArray(source) ||
            !source.length ||
            !Array.isArray(another) ||
            !another.length
        ) {
            return source;
        }

        return source.filter((it) => !another.includes(it));
    }
}
