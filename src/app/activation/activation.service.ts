import {Injectable} from '@angular/core';
import {HttpServices} from '@app/shared/services/http.services';
import {StorageService} from '@app/shared/services/storage.service';
import {Observable} from 'rxjs';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {UserService} from '@app/core/user.service';

@Injectable()
export class ActivationService {
    constructor(
        public httpServices: HttpServices,
        private storageService: StorageService,
        public userService: UserService
    ) {
    }

    activateUser(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/activate',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    getContactInfo(id: string): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/landing-page/get-contact-info/' + id,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    getOfficeContactInfo(id: string): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/office/landing-page/get-accountant-info/' + id,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }


    updateContactInfo(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/landing-page/update-contact-info',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    updateOfficeContactInfo(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/office/landing-page/accountant-agreement-confirm',
            isJson: true,
            params: request.params,
            isProtected: true,
            isAuthorization: false,
            isAuthorizationToken: request.token
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    sendOtp(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/landing-page/send-otp',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    sendOfficeOtp(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            path: 'v1/office/landing-page/send-otp',
            method: 'get',
            isJson: true,
            isProtected: true,
            isAuthorization: false,
            isAuthorizationToken: request.token
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    sendMail(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/landing-page/send-email-otp',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    sendOfficeMail(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            path: 'v1/office/landing-page/send-email-otp',
            method: 'get',
            isProtected: true,
            isAuthorization: false,
            isAuthorizationToken: request.token
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    resendOtp(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/landing-page/resend-otp',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    resendOfficeOtp(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            path: 'v1/office/landing-page/resend-otp',
            method: 'get',
            isProtected: true,
            isAuthorization: false,
            isAuthorizationToken: request.token
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    resendOfficeVms(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/office/landing-page/resend-vms',
            isProtected: true,
            isAuthorization: false,
            isAuthorizationToken: request.token
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    resendEmailOtp(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/landing-page/resend-email-otp',
            isJson: true,
            params: request,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
    resendOfficeEmailOtp(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/office/landing-page/resend-email-otp',
            isProtected: true,
            isAuthorization: false,
            isAuthorizationToken: request.token
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

}
