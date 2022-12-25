import { Injectable } from '@angular/core';
import { InterfaceParamHttp } from '@app/shared/interfaces/interface.param.http';
import { UserService } from '@app/core/user.service';
import { HttpServices } from '@app/shared/services/http.services';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, of } from 'rxjs';
import { Searchable } from './shared/searchable.model';

@Injectable({
  providedIn: 'root'
})
export class HelpCenterService {
  public readonly navigateSearchable$: ReplaySubject<Searchable> =
    new ReplaySubject(1, 500);

  constructor(
    public userService: UserService,
    public httpServices: HttpServices,
    private http: HttpClient
  ) {}

  // private _videoList$: Observable<Array<VideoData>>;
  // get videoList$(): Observable<Array<VideoData>> {
  //     if (!this._videoList$) {
  //         this._videoList$ = this.requestVideoList()
  //             .pipe(
  //                 map((response:any) => !response.error ? response.body : null),
  //                 tap(response => {
  //                     if (Array.isArray(response)) {
  //                         response
  //                             .forEach(item => {
  //                                 item.vimeoData = this.requestVimeoData(item.url);
  //                             });
  //                     }
  //                 }),
  //                 publishReplay(1),
  //                 refCount()
  //             );
  //     }
  //
  //     return this._videoList$;
  // }

  private effectiveBiziboxType(): string {
    if (!this.userService.appData.userData) {
      return '';
    }

    return this.userService.appData.userData.accountant
      ? 'accountant'
      : this.userService.appData.userData.companySelect
      ? this.userService.appData.userData.companySelect.biziboxType
      : '';
  }

  public requestVideoList(): Observable<any> {
    const params: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/help/get-video',
      params: {
        biziboxType: this.effectiveBiziboxType()
      },
      isJson: true,
      isProtected: true,
      isAuthorization: false
    };
    return this.httpServices.sendHttp<any>(params);
  }

  public requestVimeoData(vimeoId: string): Observable<any> {
    if (!vimeoId) {
      return of(null);
    }
    return this.http.get(
      'https://vimeo.com/api/oembed.json?url=https%3A//vimeo.com/' + vimeoId
    );
  }

  public requestFAQList(): Observable<any> {
    const params: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/help/get-questions-answers',
      params: {
        biziboxType: this.effectiveBiziboxType()
      },
      isJson: true,
      isProtected: true,
      isAuthorization: false
    };
    return this.httpServices.sendHttp<any>(params);
  }

  public requestTermList(): Observable<any> {
    const params: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/help/get-terms',
      params: {
        biziboxType: this.effectiveBiziboxType()
      },
      isJson: true,
      isProtected: true,
      isAuthorization: false
    };
    return this.httpServices.sendHttp<any>(params);
  }

  public requestOpenTicket(reqData: {
    closeMailToSend: string;
    taskDesc: string;
    taskOpenerName: string;
    taskTitle: string;
  }): Observable<any> {
    const params: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/help/open-ticket',
      params: Object.assign(
        {
          accountant:
            this.userService.appData.userData &&
            this.userService.appData.userData.accountant
              ? true
              : null
        },
        reqData
      ),
      isJson: true,
      isProtected: true,
      isAuthorization: true
    };
    return this.httpServices.sendHttp<any>(params);
  }

  public apiOpenTicket(reqData: any): Observable<any> {
    const params: InterfaceParamHttp<any> = {
      method: 'post',
      path: 'v1/help/api-open-ticket',
      params: reqData,
      isJson: true,
      isProtected: true,
      isAuthorization: true
    };
    return this.httpServices.sendHttp<any>(params);
  }
}
