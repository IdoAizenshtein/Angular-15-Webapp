import {Injectable} from '@angular/core';
import {HttpServices} from '@app/shared/services/http.services';
import {Observable, ReplaySubject} from 'rxjs';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {map} from 'rxjs/operators';
import {TranslateService} from '@ngx-translate/core';
import {
    CompanyTokenTrackInput
} from '@app/shared/component/foreign-credentials/token-tracker-on-demand/token-tracker-on-demand.component';
import {UserService} from './user.service';

@Injectable()
export class TokenService {
    public readonly trackOnDemand$ = new ReplaySubject<CompanyTokenTrackInput>(1);

    constructor(
        private httpServices: HttpServices,
        private translate: TranslateService,
        public userService: UserService
    ) {
    }

    tokenCreate(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path:
                this.userService &&
                this.userService.appData &&
                this.userService.appData.userData &&
                this.userService.appData.userData.accountant
                    ? 'v1/token/accountant/create'
                    : 'v1/token/cfl/create',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    tokenStationCreate(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/token/create',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
            // isAuthorizationToken: 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJuZXdwcm9qZWN0QGJpemlib3guYml6IiwiY3JlYXRlZCI6MTYyOTk5MzMzOTk5MSwicmVtZW1iZXItbWUiOnRydWUsInR5cGUiOiJBVVRIIiwiZXhwIjoxNjMyNTg1MzM5LCJ1dWlkIjoiNDA2ZmFmNzYtOWIyYS00M2YzLTljYjctYjZkZTAyZWRkOTdkIn0.52l3jfKMjB7kVRu6ETxdFraPlyrqByj9vvFryEACax_vZuMj-Vi_si8yiTkuzEIt8J4o4gT2uo9um_KaxSj9Ug'
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    tokenUpdate(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/token/cfl/update',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    hashAppTokenWork(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/token/cfl/hash-app-token-work',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    hashAppTokenOtp(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/token/cfl/hash-app-token-otp',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    downloadAppMessage(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/download-app-message',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    updateCreditAccount(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/update-credit-account',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    tokenGetStatus(request: {
        companyId?: string;
        tokens: string[];
    }): Observable<Array<TokenStatusResponse>> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/token/cfl/token-get-status',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(interfaceParamHttp)
            .pipe(map((response: any) => response.body));
    }

    stationTokenGetStatus(request: {
        companyId?: string;
        stationId: string;
        tokens: string[];
    }): Observable<Array<TokenStatusResponse>> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/token-get-status',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(interfaceParamHttp)
            .pipe(map((response: any) => response.body));
    }

    appTokenStatus(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/token/cfl/app-token-status',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(interfaceParamHttp)
            .pipe(map((response: any) => response.body));
    }

    companyTokensGetStatus(
        is_accountant: boolean,
        tokenType: TokenType,
        request: { uuid: string }
    ): Observable<Array<TokenStatusResponse>> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path:
                'v1/token/' +
                (is_accountant && TokenType[tokenType] !== 'SLIKA'
                    ? TokenType[tokenType] === 'ACCOUNT'
                        ? 'accountant/account'
                        : 'accountant/credit-card'
                    : 'cfl/' + TokenType[tokenType]),
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(interfaceParamHttp)
            .pipe(map((response: any) => response.body));
    }

    setTokenNickname(request: { token: string; tokenNickname: string }) {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/token/cfl/update-nickname',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    shouldTokenUpdatePassword(tStatus: string | null) {
        return [
            TokenStatus.LoginFailed,
            TokenStatus.Expired,
            TokenStatus.AboutToExpire,
            TokenStatus.Blocked,
            TokenStatus.MARCODRequired,
            TokenStatus.DISCODREQUIRED,
            TokenStatus.OTP_WAS_NOT_PROVIDED,
            TokenStatus.WRONG_PASS
        ].includes(this.toTokenStatusEnumValue(tStatus));
        // || (tStatus === null);
    }

    isTokenStatusProgressing(tStatus: string | number | null): boolean {
        return [
            TokenStatus.New,
            TokenStatus.InProgress,
            TokenStatus.BankTransLoad,
            TokenStatus.CreditCardLoad,
            TokenStatus.ChecksLoad,
            TokenStatus.DepositLoad,
            TokenStatus.LoanLoad,
            TokenStatus.StandingOrdersLoad,
            TokenStatus.ForeignTransLoad,
            TokenStatus.ALMOST_DONE
        ].includes(this.toTokenStatusEnumValue(tStatus));
    }

    tokenStatusToCompletionPercentage(tStatus: string | TokenStatus | null) {
        if (!this.isTokenStatusProgressing(tStatus)) {
            return null;
        }

        switch (tStatus) {
            case 'New':
            case 'NEW':
            case 'InProgress':
            case 'INPROGRESS':
            case TokenStatus.New:
            case TokenStatus.InProgress:
                return 10;
            case 'BankTransLoad':
            case 'BANKTRANSLOAD':
            case TokenStatus.BankTransLoad:
                return 20;
            case 'CreditCardLoad':
            case 'CREDITCARDLOAD':
            case TokenStatus.CreditCardLoad:
                return 30;
            case 'ChecksLoad':
            case 'CHECKSLOAD':
            case TokenStatus.ChecksLoad:
                return 40;
            case 'DepositLoad':
            case 'DEPOSITLOAD':
            case TokenStatus.DepositLoad:
                return 50;
            case 'LoanLoad':
            case 'LOANLOAD':
            case TokenStatus.LoanLoad:
                return 60;
            case 'StandingOrdersLoad':
            case 'STANDINGORDERSLOAD':
            case TokenStatus.StandingOrdersLoad:
                return 70;
            case 'ForeignTransLoad':
            case 'FOREIGNTRANSLOAD':
            case TokenStatus.ForeignTransLoad:
                return 80;
            case 'ALMOST_DONE':
            case TokenStatus.ALMOST_DONE:
                return 95;
            default:
                return null;
        }
    }

    tokenTypeByTargetId(id: string | number): TokenType | null {
        const idStr = String(id);
        const fcs = this.translate.instant('foreignCredentials');
        // debugger;
        if (idStr in fcs.banks) {
            return TokenType.ACCOUNT;
        }
        if (idStr in fcs.cards) {
            return TokenType.CREDITCARD;
        }
        if (idStr in fcs.clearingAgencies) {
            return TokenType.SLIKA;
        }
        return null;
    }


    toTokenStatusEnumValue(value: string | number): TokenStatus | null {
        switch (value) {
            case 'Valid':
            case 'VALID':
            case TokenStatus.Valid:
                return TokenStatus.Valid;
            case 'LoginFailed':
            case 'INVALIDPASSWORD':
            case 'WRONG_PASS':
            case TokenStatus.LoginFailed:
                return TokenStatus.LoginFailed;
            case 'TechnicalProblem':
            case 'TECHNICALPROBLEM':
            case TokenStatus.TechnicalProblem:
                return TokenStatus.TechnicalProblem;
            case 'Blocked':
            case 'BLOCKED':
            case TokenStatus.Blocked:
                return TokenStatus.Blocked;
            case 'MARCODRequired':
            case 'MARCODREQUIRED':
            case TokenStatus.MARCODRequired:
                return TokenStatus.MARCODRequired;
            case 'DISCODRequired':
            case 'DISCODREQUIRED':
            case TokenStatus.DISCODREQUIRED:
                return TokenStatus.DISCODREQUIRED;
            case 'OTPRequired':
            case 'OTPREQUIRED':
            case TokenStatus.OTPRequired:
                return TokenStatus.OTPRequired;
            case 'Expired':
            case 'PASSWORDEXPIRED':
            case TokenStatus.Expired:
                return TokenStatus.Expired;
            case 'AboutToExpire':
            case 'PASSWORDABOTTOEXPIRED':
            case TokenStatus.AboutToExpire:
                return TokenStatus.AboutToExpire;
            case 'New':
            case 'NEW':
            case TokenStatus.New:
                return TokenStatus.New;
            case 'InProgress':
            case 'INPROGRESS':
            case TokenStatus.InProgress:
                return TokenStatus.InProgress;
            case 'BANKTRANSLOAD':
            case 'BankTransLoad':
            case TokenStatus.BankTransLoad:
                return TokenStatus.BankTransLoad;
            case 'CREDITCARDLOAD':
            case 'CreditCardLoad':
            case TokenStatus.CreditCardLoad:
                return TokenStatus.CreditCardLoad;
            case 'CHECKSLOAD':
            case 'ChecksLoad':
            case TokenStatus.ChecksLoad:
                return TokenStatus.ChecksLoad;
            case 'DEPOSITLOAD':
            case 'DepositLoad':
            case TokenStatus.DepositLoad:
                return TokenStatus.DepositLoad;
            case 'LOANLOAD':
            case 'LoanLoad':
            case TokenStatus.LoanLoad:
                return TokenStatus.LoanLoad;
            case 'STANDINGORDERSLOAD':
            case 'StandingOrdersLoad':
            case TokenStatus.StandingOrdersLoad:
                return TokenStatus.StandingOrdersLoad;
            case 'FOREIGNTRANSLOAD':
            case 'ForeignTransLoad':
            case TokenStatus.ForeignTransLoad:
                return TokenStatus.ForeignTransLoad;
            // case 'INVALIDPASSWORD':
            // case 'WRONG_PASS':
            case 'INVALIDPASSORDANDACCESS':
            case 'INVALIDPASSWORDANDACCESS':
            case 'InvalidPassordAndAccess':
            case 'InvalidPasswordAndAccess':
            case TokenStatus.INVALIDPASSORDANDACCESS:
                return TokenStatus.INVALIDPASSORDANDACCESS;
            case 'VALIDPOALIMBAASAKIM':
            case TokenStatus.VALIDPOALIMBAASAKIM:
                return TokenStatus.VALIDPOALIMBAASAKIM;
            case 'AGREEMENT_REQUIRED':
            case TokenStatus.AGREEMENT_REQUIRED:
                return TokenStatus.AGREEMENT_REQUIRED;
            case 'SUSPENDED':
            case TokenStatus.SUSPENDED:
                return TokenStatus.SUSPENDED;
            case 'ALMOST_DONE':
            case TokenStatus.ALMOST_DONE:
            case -1:
                return TokenStatus.ALMOST_DONE;
            case 'OTP_WAS_NOT_PROVIDED':
                return TokenStatus.OTP_WAS_NOT_PROVIDED;
            case 'NOT_UP_TO_DATE':
                return TokenStatus.NOT_UP_TO_DATE;
            case 'WRONG_OTP_CODE':
                return TokenStatus.WRONG_OTP_CODE;
            case 'UP_TO_DATE':
                return TokenStatus.UP_TO_DATE;
            // case 'WRONG_PASS':
            //     return TokenStatus.WRONG_PASS;
            case 'BANK_TECHNICALPROBLEM':
                return TokenStatus.BANK_TECHNICALPROBLEM;
            case 'OPT_CODE_INSERT':
                return TokenStatus.OPT_CODE_INSERT;
            default:
                return null;
        }
    }

    public settingsKeyByTargetId(websiteTargetTypeId: number): string | null {
        const targetType = this.tokenTypeByTargetId(websiteTargetTypeId);
        let targetTypeDesc;
        switch (targetType) {
            case TokenType.ACCOUNT: {
                targetTypeDesc = 'banks';
                break;
            }
            case TokenType.CREDITCARD: {
                targetTypeDesc = 'cards';
                break;
            }
            case TokenType.SLIKA: {
                targetTypeDesc = 'clearingAgencies';
                break;
            }
            default: {
                targetTypeDesc = null;
                break;
            }
        }
        return targetTypeDesc !== null
            ? 'foreignCredentials.' + targetTypeDesc + '.' + websiteTargetTypeId
            : null;
    }
}

export enum TokenType {
    ACCOUNT,
    CREDITCARD,
    SLIKA
}

export enum TokenStatus {
    Valid = 0,
    TechnicalProblem = 1,
    LoginFailed = 2,
    Blocked = 3,
    Expired = 4,
    AboutToExpire = 5,
    InProgress = 9,
    New = 10,
    OTPRequired = 12,
    BankTransLoad = 100,
    CreditCardLoad = 101,
    ChecksLoad = 102,
    DepositLoad = 103,
    LoanLoad = 104,
    StandingOrdersLoad = 105,
    ForeignTransLoad = 106,
    MARCODRequired = 157,
    DISCODREQUIRED = 158,
    INVALIDPASSORDANDACCESS = 999,
    INVALIDPASSWORD = 999,
    VALIDPOALIMBAASAKIM = 8,
    AGREEMENT_REQUIRED = 17,
    OTP_WAS_NOT_PROVIDED = 120,
    SUSPENDED = 18,
    ALMOST_DONE = -1,
    NOT_UP_TO_DATE = -2,
    UP_TO_DATE = -3,
    WRONG_PASS = -4,
    BANK_TECHNICALPROBLEM = -5,
    WRONG_OTP_CODE = -6,
    OPT_CODE_INSERT = 99
}

export interface TokenStatusResponse {
    errorDesc: any;
    token: string;
    tokenNickname: string;
    tokenStatus: string;
    websiteTargetTypeId: any;
    wrngPswrdTrialCount: number | null;
    screenPasswordUpdateCount: number | null;
    isFromAccount: boolean;
    hasPrivs: boolean;
    dateCreated: number;
    companyAccountId: string;
    setDefAcc?: any;
    poalimBeasakim?: any;
}

export const bankIdsOrderedForSelection = [
    '12',
    '122',
    '10',
    '11',
    '158',
    '17',
    '157',
    '20',
    '31',
    '14',
    '13',
    '4',
    '46',
    '52',
    '9',
    '54',
    '126'
];
// [12, 122, 10, 11, 158, 17, 157, 20, 31, 14, 13, 4, 46, 52, 9, 54, 126];
