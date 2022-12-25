import {Injectable} from '@angular/core';
import {Location} from '@angular/common';
import {HttpServices} from '@app/shared/services/http.services';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {combineLatest, interval, Observable, of, timer, zip} from 'rxjs';
import {catchError, filter, map, skipWhile, switchMap, tap} from 'rxjs/operators';
import {UserService} from '@app/core/user.service';
import {Router} from '@angular/router';
import {takeWhileInclusive} from '@app/shared/functions/takeWhileInclusive';
import {AuthService} from '../login/auth.service';
import {StorageService} from '@app/shared/services/storage.service';
import {ErpService} from '../erp/erp.service';
import {publishRef} from '@app/shared/functions/publishRef';

@Injectable()
export class AdminService {
    private _usersToAdminCriteria: {
        type: 'companyHp' | 'companyName' | 'userName' | 'officeName';
        value: string;
    } = {
        type: 'companyName',
        value: null
    };
    get usersToAdminCriteria(): {
        type: 'companyHp' | 'companyName' | 'userName' | 'officeName';
        value: string;
    } {
        return this._usersToAdminCriteria;
    }

    set usersToAdminCriteria(val) {
        if (
            this._usersToAdminCriteria.type !== val.type ||
            this._usersToAdminCriteria.value !== val.value
        ) {
            this.usersToAdmin$ = this.requestUsersToAdmin(val).pipe(
                map((response: any) => (response && !response.error ? response.body : [])),
                publishRef
            );
        }
        this._usersToAdminCriteria = val;
    }

    private usersToAdmin$: Observable<Array<any>>;

    get usersToAdmin() {
        // if (!this.usersToAdmin$) {
        //     this.usersToAdmin$ = this.requestUsersToAdmin().pipe(
        //         map((response:any) => response && !response.error ? response.body : []),
        //         publishReplay(1),
        //         refCount()
        //     );
        // }

        return this.usersToAdmin$;
    }

    private banksList$: Observable<Array<{ bankId: number; bankName: string }>>;

    get banksList() {
        if (!this.banksList$) {
            this.banksList$ = this.requestBanksList().pipe(
                map((response: any) => (!response.error ? response.body : [])),
                publishRef
            );
        }

        return this.banksList$;
    }

    private paymentTypes$: Observable<Array<{ id: string; name: string; paymentDescription: string }>>;

    get paymentTypes() {
        if (!this.paymentTypes$) {
            this.paymentTypes$ = this.requestPaymentTypesList().pipe(
                map((response: any) => (!response.error ? response.body : [])),
                publishRef
            );
        }

        return this.paymentTypes$;
    }

    private categories$: Observable<Array<{ transTypeId: string; transTypeName: string }>>;

    get categories() {
        if (!this.categories$) {
            this.categories$ = this.requestCategoriesList().pipe(
                map((response: any) => (!response.error ? response.body : [])),
                publishRef
            );
        }

        return this.categories$;
    }

    private appVersion$: Observable<any>;

    get appVersion() {
        if (!this.appVersion$) {
            this.appVersion$ = interval(3000).pipe(
                // filter(() => this.userService.appData && this.userService.appData.userData),
                switchMap(() => this.appVersionGet()),
                tap((response: any) =>
                    console.log('Getting current app version... Got: %o', response)
                ),
                takeWhileInclusive((response: any) => response === null),
                publishRef
            );
        }

        return this.appVersion$;
    }

    public readonly versionChangeTracker;
    private readonly VERSION_POLL_INTERVAL = 8 * 60 * 1000;

    constructor(
        private httpServices: HttpServices,
        public userService: UserService,
        private storageService: StorageService,
        private erpService: ErpService,
        private authService: AuthService,
        private router: Router,
        private location: Location
    ) {
        this.versionChangeTracker = combineLatest(
     [
         timer(this.VERSION_POLL_INTERVAL / 2, this.VERSION_POLL_INTERVAL).pipe(
             // filter(() => this.userService.appData && this.userService.appData.userData),
             switchMap(() => this.appVersionGet()),
             filter((response: any) => response !== null)
         ),
         this.appVersion
     ]
        ).pipe(
            tap(([fromServer, local]) =>
                console.log(
                    'Polling current app version... Got: server: %o, local: %o',
                    fromServer,
                    local
                )
            ),
            map(([fromServer, local]) => {
                return fromServer.version !== local.version;
            }),
            skipWhile((response: any) => !response)
        );
    }

    private requestUsersToAdmin(params: {
        type: 'companyHp' | 'companyName' | 'userName' | 'officeName';
        value: string;
    }): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/adm/cfl-users',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            catchError(() => {
                return of(null);
            })
        );
    }

    public switchUser(type?: any): void {
        let url = '/';
        if (
            this.userService.appData.userOnBehalf &&
            this.userService.appData.userOnBehalf.companyToSelect
        ) {
            url +=
                'cfl/general?id=' +
                this.userService.appData.userOnBehalf.companyToSelect;
        }

        this.authService.getUserData(true).subscribe((response: any) => {
            if (type && type === 'subscriptionNumber') {
                // const uuid = crypto['randomUUID']();
                // this.storageService.localStorageSetter('trustId', uuid);
                // this.erpService.setTrust({
                //     'stationId': this.userService.appData.userDataAdmin.stationId,
                //     'trustId': uuid
                // }).subscribe(() => {
                // });
                window.open(
                    this.location.prepareExternalUrl(
                        `/api-account-management?station_id=${this.userService.appData.userDataAdmin.stationId}&bookKeepingId=${this.userService.appData.userDataAdmin.bookKeepingId}`
                    ),
                    '_self'
                );
            } else {
                if (this.userService.appData.userData.accountant === true) {
                    this.userService.appData.redirectUrl =
                        this.userService.appData.userData.pathMainApp;
                    // tslint:disable-next-line:max-line-length
                    // this.router.navigate([`/${this.userService.appData.redirectUrl}`], {queryParamsHandling: 'preserve'});
                    let redirect = this.location.normalize(
                        this.userService.appData.redirectUrl
                    );
                    // const [path, query] = redirect.split('?');
                    // this.location.replaceState(path, query);
                    this.userService.appData.userOnBehalfPrompt.visible = false;
                    // this.router.navigateByUrl(redirect, {queryParamsHandling: 'preserve'});

                    if (redirect === 'accountants') {
                        redirect =
                            'accountants/companies/journalTrans/suppliersAndCustomers?id=' +
                            this.userService.appData.userOnBehalf.companyToSelect;
                    }
                    if (type && type === 'officeName') {
                        redirect = 'accountants/companies?tab=journal-trans';
                    }
                    window.open(this.location.prepareExternalUrl(redirect), '_self');
                } else {
                    window.open(this.location.prepareExternalUrl(url), '_self');
                }
            }
        });
    }

    public searchKeysGetFiltered(
        filterSettings: {
            bankId: string;
            misparHofaot: number;
            paymentDesc: string;
            transTypeId: string;
            searchkey: string;
            currPage: number;
        } = {
            bankId: null,
            misparHofaot: 50,
            paymentDesc: null,
            transTypeId: null,
            searchkey: null,
            currPage: 0
        }
    ) {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            // method: 'get',
            method: 'post',
            path: 'v1/adm/searchkey',
            params: filterSettings,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    private requestBanksList(): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/adm/bank-list',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    private requestPaymentTypesList(): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/adm/payment-list',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    private requestCategoriesList(): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/adm/category-list',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    searchkeyUpdate(
        request: [
            {
                searchkeyCatId: string;
                searchkeyId: string;
                transTypeId: string;
            }
        ]
    ): Observable<any> {
        const countParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/adm/searchkey/update',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(countParam);
    }

    appVersionGet(): Observable<{ version: string }> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/server/version',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            map((response: any) => {
                return !response.error ? (response.body as { version: string }) : null;
            }),
            catchError(() => {
                return of(null);
            })
        );
    }
}
