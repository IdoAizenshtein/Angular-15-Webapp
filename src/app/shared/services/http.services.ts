import {Observable, of, ReplaySubject, Subject, throwError} from 'rxjs';
import {forwardRef, Inject, Injectable, OnDestroy} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders, HttpParams} from '@angular/common/http';

import {catchError, retry, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {InterfaceParamHttp, Params} from '../interfaces/interface.param.http';
import {Router} from '@angular/router';
import {UserService} from '@app/core/user.service';
import {BrowserService} from './browser.service';
import {StorageService} from './storage.service';

@Injectable()
export class HttpServices implements OnDestroy {
    private static readonly iso8601RegEx =
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

    public mainUrl = 'rest/api';
    private browserService: BrowserService;
    private storageService: StorageService;
    public messageSource: Subject<any> = new Subject();

    private readonly backendFailedResponse: ReplaySubject<any> =
        new ReplaySubject<any>(1, 2000);
    public readonly backendFailedResponse$ =
        this.backendFailedResponse.asObservable();

    private static customFormat(val: Date): string | number {
        return val.getTime();
        // let month: string | number = val.getMonth() + 1;
        // let day: string | number = val.getDate();
        // let hours: string | number = val.getHours();
        // let minutes: string | number = val.getMinutes();
        // let seconds: string | number = val.getSeconds();
        //
        // month = (month < 10) ? '0' + month : month;
        // day = (day < 10) ? '0' + day : day;
        // hours = (hours < 10) ? '0' + hours : hours;
        // minutes = (minutes < 10) ? '0' + minutes : minutes;
        // seconds = (seconds < 10) ? '0' + seconds : seconds;
        //
        //
        // return `${val.getFullYear()}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    constructor(
        private http: HttpClient,
        private router: Router,
        public userService: UserService,
        @Inject(forwardRef(() => BrowserService)) browserService: BrowserService,
        @Inject(forwardRef(() => StorageService)) storageService: StorageService
    ) {
        this.browserService = browserService;
        this.storageService = storageService;
        if (!environment.production) {
            // this.mainUrl = 'https://qa-bsecure.bizibox.biz/rest/api';
            this.mainUrl = 'https://dev-bsecure.bizibox.biz/rest/api';
            // this.mainUrl = 'https://bsecure.bizibox.biz/rest/api';
            // this.mainUrl = 'https://stg-bsecure.bizibox.biz/rest/api';
            // this.mainUrl = 'https://adm1.bizibox.biz/rest/api';
            //  this.mainUrl = 'https://dev-adm1.bizibox.biz/rest/api';
            //  this.mainUrl = 'https://qa-adm1.bizibox.biz/rest/api';
            //   this.mainUrl = 'https://aws-stg-adm1.bizibox.biz/rest/api';
            //   this.mainUrl = 'https://aws-stg-bsecure.bizibox.biz/rest/api';
            //  this.mainUrl = 'https://stg-adm1.bizibox.biz/rest/api';
        }
    }

    public static serialize<T>(options?: T): HttpParams {
        let httpParams: HttpParams = new HttpParams();
        Object.keys(options).forEach(function (key) {
            httpParams = httpParams.append(key, options[key]);
        });
        return httpParams;
    }

    public sendHttp<T>(
        interfaceParamHttp: InterfaceParamHttp<T>
    ): Observable<any> {
        const url = interfaceParamHttp.isFormData
            ? interfaceParamHttp.path
            : `${
                interfaceParamHttp.isProtected
                    ? this.mainUrl
                    : this.mainUrl.replace('/rest/api', '')
            }/${interfaceParamHttp.path}`;
        const httpOptions = {
            headers: new HttpHeaders(),
            withCredentials: true,
            observe: 'response'
        };
        if (interfaceParamHttp.isFormData) {
            httpOptions['reportProgress'] = true;
        }
        const parameters: Params = {
            method: interfaceParamHttp.method,
            url: url,
            options: httpOptions
        };
        if (interfaceParamHttp.isAuthorization && this.userService.appData.token) {
            parameters.options.headers = httpOptions.headers.append(
                'Authorization',
                this.userService.appData.token
            );
        }
        if (interfaceParamHttp.isAuthorizationToken) {
            parameters.options.headers = httpOptions.headers.append(
                'Authorization',
                interfaceParamHttp.isAuthorizationToken
            );
        }

        if (interfaceParamHttp.method !== 'get') {
            const contentType: string = interfaceParamHttp.isJson
                ? 'application/json'
                : interfaceParamHttp.isFormData
                    ? interfaceParamHttp.params['type']
                    : 'application/x-www-form-urlencoded; charset=UTF-8';
            if (contentType) {
                parameters.options.headers = httpOptions.headers.append(
                    'Content-Type',
                    contentType
                );
            }
            if (interfaceParamHttp.params) {
                if (interfaceParamHttp.isFormData) {
                    const formData: FormData = new FormData();
                    // @ts-ignore
                    formData.append(
                        'file',
                        interfaceParamHttp['params'],
                        interfaceParamHttp['params']['name']
                    );
                } else {
                    parameters.options.body = interfaceParamHttp.isJson
                        ? JSON.stringify(this.convertDates(interfaceParamHttp.params))
                        : HttpServices.serialize(
                            this.convertDates(interfaceParamHttp.params)
                        );
                }
            }
            if (interfaceParamHttp.isHeaderAuth) {
                if (interfaceParamHttp.isHeaderAuth.otpToken) {
                    parameters.options.headers = httpOptions.headers.append(
                        'otpToken',
                        interfaceParamHttp.isHeaderAuth.otpToken
                    );
                }
                if (interfaceParamHttp.isHeaderAuth.otpCode) {
                    parameters.options.headers = httpOptions.headers.append(
                        'otpCode',
                        interfaceParamHttp.isHeaderAuth.otpCode
                    );
                }
            }
        }
        if (interfaceParamHttp.responseType) {
            parameters.options.responseType = interfaceParamHttp.responseType;
        }

        if (
            this.userService.appData &&
            this.userService.appData.isAdmin &&
            this.userService.appData.userOnBehalf &&
            this.userService.appData.userOnBehalf.id
        ) {
            parameters.options.headers = httpOptions.headers.append(
                'X-User-on-behalf',
                this.userService.appData.userOnBehalf.id
            );
        }
        let idx = 0;
        return this.http
            .request<any>(parameters.method, parameters.url, parameters.options)
            .pipe(
                tap((event: any) => {
                    this.log(event);
                    if (
                        (event.url.includes('create-doc-file') ||
                            event.url.includes('manual-download')) &&
                        event.status === 206
                    ) {
                        throw event;
                    }
                }),
                // retry({
                //     count: url.includes('change-password') || url.includes('add-contact') ? 0 :  2,
                //     delay: url.includes('create-doc-file') || url.includes('manual-download') ? 10000 : 1500
                // }),
                catchError(this.handleError<any>(url, (interfaceParamHttp.isHeaderAuth || interfaceParamHttp.stopRedInError)))
            );
    }

    private handleError<T>(
        operation = 'operation',
        otpApproveRequired: boolean,
        result?: T
    ) {
        return (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
                // A client-side or network error occurred. Handle it accordingly.
                console.log('An error occurred:', err.error.message);
            } else {
                if (
                    err.status === 404 ||
                    (err.status === 400 && err.url.includes('change-password')) ||
                    (err.status === 400 && err.url.includes('add-contact')) ||
                    (err.status === 400 && err.url.includes('auth/otp/code')) ||
                    err.status === 409 ||
                    err.status === 500 ||
                    this.router.url === '/reset-password' ||
                    this.router.url.endsWith('/signup')
                ) {
                    return of(err);
                } else {
                    // The backend returned an unsuccessful response code.
                    // The response body may contain clues as to what went wrong,
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );

                    if (
                        err.status === 401 ||
                        (err.status === 403 && !otpApproveRequired)
                    ) {
                        if(err.status === 401){
                            this.storageService.localStorageRemoveItem('token');
                        }

                        // || (err.status === 403 && !err.url.includes('two-factor'))) {
                        this.router.navigate(['/login'], {
                            queryParamsHandling: 'preserve'
                        });
                        return of(err);
                    }
                }
                if(err.status === 403 && otpApproveRequired){
                    return of(err);
                }
                if (
                    (![400, 401, 403, 409, 200].includes(err.status)) || ((operation.includes('create-doc-file') || (operation.includes('manual-download')) && err.status === 206))
                ) {
                    return of(err);
                }
            }
            console.error(err); // log to console instead
            this.log(`${operation} failed: ${err.message}`);
            return throwError(() => err);
        };
    }

    private log(message: any): void {
        console.log(message);
    }

    ngOnDestroy() {
        if (this.messageSource) {
            this.messageSource.unsubscribe();
        }
    }

    private convertDates(obj: any): any {
        if (obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            const array = obj as Array<any>;
            for (let i = 0; i < array.length; i++) {
                array[i] = this.convertDates(array[i]);
            }
        } else if (obj instanceof Date) {
            obj = HttpServices.customFormat(obj as Date); // (obj as Date).getTime();
        } else if (
            (typeof obj === 'string' || obj instanceof String) &&
            HttpServices.iso8601RegEx.test(String(obj))
        ) {
            obj = this.convertDates(new Date(String(obj)));
        } else if (obj === Object(obj)) {
            for (const property in obj) {
                if (!obj.hasOwnProperty || obj.hasOwnProperty(property)) {
                    obj[property] = this.convertDates(obj[property]);
                }
            }
        }

        return obj;
    }
}
