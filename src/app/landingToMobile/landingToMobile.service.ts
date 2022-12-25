import { Injectable } from '@angular/core';
import { HttpServices } from '@app/shared/services/http.services';
import { StorageService } from '@app/shared/services/storage.service';
import { Observable } from 'rxjs';
import { InterfaceParamHttp } from '@app/shared/interfaces/interface.param.http';
import { UserService } from '@app/core/user.service';

@Injectable()
export class LandingToMobileService {
  constructor(
    public httpServices: HttpServices,
    private storageService: StorageService,
    public userService: UserService
  ) {}

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
}
