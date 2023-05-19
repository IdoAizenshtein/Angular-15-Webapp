// Exact copy of contact.awesome.pipe
import {Pipe, PipeTransform} from '@angular/core';
import {formatAsSumNoMath, roundAndAddComma} from '../functions/addCommaToNumbers';

@Pipe({name: 'sum'})
export class SumPipe implements PipeTransform {
    transform(
        value: any,
        noFraction: boolean = false,
        unsigned: boolean = false,
        parse:boolean = true
    ): string {
        const valNum = parse ? Number.parseFloat(value) : value;

        if (Number.isFinite(valNum)) {
            return noFraction
                ? roundAndAddComma(unsigned === true ? Math.abs(valNum) : valNum) // addCommaToNumbers(valNum).split('.')[0]
                : formatAsSumNoMath(unsigned === true ? Math.abs(valNum) : valNum); // addCommaToNumbers(valNum);
        }
        return value;
    }
}
