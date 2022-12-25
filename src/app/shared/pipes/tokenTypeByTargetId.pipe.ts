import {Pipe, PipeTransform} from '@angular/core';
import {TokenService, TokenType} from '@app/core/token.service';

@Pipe({
    name: 'asTokenType',
    pure: true
})
export class TokenTypeByTargetIdPipe implements PipeTransform {
    constructor(private tokenService: TokenService) {
    }

    transform(websiteTargetId: string, type?: 'name'): TokenType | any {
        if (type === 'name') {
            switch (this.tokenService.tokenTypeByTargetId(websiteTargetId)) {
                case TokenType.ACCOUNT: {
                    return 'banks';
                }
                case TokenType.CREDITCARD: {
                    return 'cards';
                }
                case TokenType.SLIKA: {
                    return 'clearingAgencies';
                }
            }
        }
        return this.tokenService.tokenTypeByTargetId(websiteTargetId);
    }
}
