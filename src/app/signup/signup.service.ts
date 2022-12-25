import { Injectable } from '@angular/core';
import { HttpServices } from '@app/shared/services/http.services';
import { StorageService } from '@app/shared/services/storage.service';
import { Observable } from 'rxjs';
import { InterfaceParamHttp } from '@app/shared/interfaces/interface.param.http';
import { tap } from 'rxjs/operators';
import { UserService } from '@app/core/user.service';

@Injectable()
export class SignupService {
  lastFinishedStepIdx: number | null = null;

  constructor(
    public httpServices: HttpServices,
    private storageService: StorageService,
    public userService: UserService
  ) {}

  isEmailExists(request: any): Observable<any> {
    const interfaceParamHttp: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/users/cfl/is-exists',
      isJson: true,
      params: request,
      isProtected: true,
      isAuthorization: false
    };
    return this.httpServices.sendHttp<any>(interfaceParamHttp);
  }

  isBusinessIdExists(request: {
    companyHp: string | number;
    username: string | null;
  }): Observable<any> {
    const interfaceParamHttp: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/companies/hp-exists',
      isJson: true,
      params: request,
      isProtected: true,
      isAuthorization: request.username === null
    };
    return this.httpServices.sendHttp<any>(interfaceParamHttp);
  }

  getCompanies(): Observable<any> {
    const companiesParam: InterfaceParamHttp<any> = {
      method: 'get',
      path: 'v1/companies',
      isProtected: true,
      isAuthorization: true
    };
    return this.httpServices.sendHttp<any>(companiesParam);
  }

  updateLeadInfo(request: any): Observable<any> {
    const interfaceParamHttp: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/users/cfl/update-lead-info',
      isJson: true,
      params: request,
      isProtected: true,
      isAuthorization: false
    };
    return this.httpServices.sendHttp<any>(interfaceParamHttp);
  }

  signupCreate(request: any, replaceInStorage:any = true): Observable<any> {
    const interfaceParamHttp: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/auth/sign-up-create',
      isJson: true,
      params: request,
      isProtected: true,
      isAuthorization: false
    };
    return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
      tap((rslt) => {
        if (replaceInStorage) {
          this.storageService.localStorageSetter('token', rslt.body.token);
          this.userService.appData.token = rslt.body.token;
        }
      })
    );
  }

  skipToDemoCompany(): Observable<any> {
    const interfaceParamHttp: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/users/cfl/update-lead-example',
      isJson: true,
      params: {},
      isProtected: true,
      isAuthorization: true
    };
    return this.httpServices.sendHttp<any>(interfaceParamHttp);
  }

  newLead(request: any): Observable<any> {
    const interfaceParamHttp: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/companies/new-lead',
      isJson: true,
      params: request,
      isProtected: true,
      isAuthorization: true
    };
    return this.httpServices.sendHttp<any>(interfaceParamHttp);
  }
}
