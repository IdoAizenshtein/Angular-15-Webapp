import {Pipe, PipeTransform} from '@angular/core';
import {TokenStatus} from '@app/core/token.service';

@Pipe({
    name: 'tokenStatusAsIconSrc',
    pure: true
})
export class TokenStatusAsIconSrcPipe implements PipeTransform {
    transform(value: string | TokenStatus): string | null {
        switch (value) {
            case 'Valid':
            case 'VALID':
            case TokenStatus.Valid:
            case 'VALIDPOALIMBAASAKIM':
            case TokenStatus.VALIDPOALIMBAASAKIM:
                return '/assets/images/valid.png';
            case 'LoginFailed':
            case 'INVALIDPASSWORD':
            case 'WRONG_PASS':
            case TokenStatus.LoginFailed:
            case 'INVALIDPASSORDANDACCESS':
            case TokenStatus.INVALIDPASSORDANDACCESS:
                return '/assets/images/invalid.png';
            case 'TechnicalProblem':
            case 'TECHNICALPROBLEM':
            case TokenStatus.TechnicalProblem:
                return '/assets/images/fb-logo-bizibox-32-32.png';
            case 'Blocked':
            case 'BLOCKED':
            case TokenStatus.Blocked:
                return '/assets/images/lock.png';
            case 'MARCODRequired':
            case 'MARCODREQUIRED':
            case 'DISCODRequired':
            case 'DISCODREQUIRED':
            case TokenStatus.DISCODREQUIRED:
                return '/assets/images/key.png';
            case 'OTPRequired':
            case 'OTPREQUIRED':
            case TokenStatus.OTPRequired:
                return '/assets/images/balloon.png';
            case 'Expired':
            case 'PASSWORDEXPIRED':
            case 'OTP_WAS_NOT_PROVIDED':
            case TokenStatus.Expired:
            case 'AboutToExpire':
            case 'PASSWORDABOTTOEXPIRED':
            case TokenStatus.AboutToExpire:
                return '/assets/images/act-then-redo.png';
            case 'New':
            case 'NEW':
            case TokenStatus.New:
            case 'InProgress':
            case 'INPROGRESS':
            case TokenStatus.InProgress:
            case 'BANKTRANSLOAD':
            case 'BankTransLoad':
            case TokenStatus.BankTransLoad:
            case 'CREDITCARDLOAD':
            case 'CreditCardLoad':
            case TokenStatus.CreditCardLoad:
            case 'CHECKSLOAD':
            case 'ChecksLoad':
            case TokenStatus.ChecksLoad:
            case 'DEPOSITLOAD':
            case 'DepositLoad':
            case TokenStatus.DepositLoad:
            case 'LOANLOAD':
            case 'LoanLoad':
            case TokenStatus.LoanLoad:
            case 'STANDINGORDERSLOAD':
            case 'StandingOrdersLoad':
            case TokenStatus.StandingOrdersLoad:
            case 'FOREIGNTRANSLOAD':
            case 'ForeignTransLoad':
            case TokenStatus.ForeignTransLoad:
            case 'ALMOST_DONE':
            case TokenStatus.ALMOST_DONE:
                return '/assets/images/inProgress.png';
            case 'SUSPENDED':
            case TokenStatus.SUSPENDED:
                return '/assets/images/inProgress.png';
            default:
                return '';
        }
    }
}
