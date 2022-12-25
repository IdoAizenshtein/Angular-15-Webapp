import {Injectable} from '@angular/core';
import {HttpServices} from '@app/shared/services/http.services';
import {StorageService} from '@app/shared/services/storage.service';
import {Observable} from 'rxjs';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {UserService} from '@app/core/user.service';

@Injectable()
export class ErpService {
    constructor(
        public httpServices: HttpServices,
        private storageService: StorageService,
        public userService: UserService
    ) {
    }

    trustStatus(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/auth/trust-status',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(request);
    }

    dailyMailActivated(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/daily-mail-activated',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    getAccountsForStation(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/get-accounts-for-station',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    writeGeneralError(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/write-general-error',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getCurrencyList(): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/ocr/get-currency',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getStationId(subscriptionNumber:any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/station/get-stationId/' + subscriptionNumber,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(request);
    }

    screenPopupType(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/screen-popup-type',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    accountConnectRecommendation(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/account-connect-recommendation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    addCompany(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/add-company',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    bankConnect(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account-key/bank-connect',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    biziboxReconnect(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account-key/bizibox-reconnect',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getUserForStation(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/get-user-for-station',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteUser(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/delete-user',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateUser(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/update-user',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    sendActivationMail(params: any): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/send-activation-mail',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    sendActivationMailNotAuthorization(params: any): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/send-activation-mail',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    updateActivation(params: any): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/update-activation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    balanceDifference(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/balance-difference',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    biziboxAccountHistory(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account-key/bizibox-account-history',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    creditcardConnect(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account-key/creditcard-connect',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    setTrust(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/auth/set-trust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateAgreementConfirmation(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/update-agreement-confirmation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    bankDisconnect(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account-key/bank-disconnect',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    creditcardDisconnect(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account-key/creditcard-disconnect',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }
}
