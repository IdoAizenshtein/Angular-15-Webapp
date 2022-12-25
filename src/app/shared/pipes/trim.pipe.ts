// Exact copy of contact.awesome.pipe
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({name: 'trim'})
export class TrimPipe implements PipeTransform {
    transform(text: any): any {
        if (typeof text === 'object') {
            text = JSON.stringify(text, null, 2)
                .replace(' ', '&nbsp;')
                .replace('\n', '<br/>');
        }
        return text ? text : '';
    }
}
