import {Pipe, PipeTransform} from '@angular/core';
import {TokenService, TokenStatus} from '@app/core/token.service';

@Pipe({
    name: 'toTokenStatusEnumValue',
    pure: true
})
export class ToTokenStatusEnumValuePipe implements PipeTransform {
    constructor(private tokenService: TokenService) {
    }

    transform(value: string | number): TokenStatus | null {
        return this.tokenService.toTokenStatusEnumValue(value);
    }
}
