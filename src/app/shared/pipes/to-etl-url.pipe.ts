import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'toEtlUrl'
})
export class ToEtlUrlPipe implements PipeTransform {
    constructor() {
    }

    transform(value: any, args?: any): any {
        const currHost = window.location.hostname;

        let etlHostPart = 'i-etl';
        if (currHost.includes('stg')) {
            etlHostPart = 'etl-stage';
        } else if (currHost.includes('dev') || currHost.includes('localhost')) {
            etlHostPart = 'dev-etl';
        }

        return `https://${etlHostPart}.bizibox.biz${value}`;
    }
}
