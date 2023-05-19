import {Injectable, OnDestroy} from '@angular/core';
import {BrowserService} from '@app/shared/services/browser.service';
import {HttpServices} from '@app/shared/services/http.services';
import {StorageService} from '@app/shared/services/storage.service';
import {UserService} from '@app/core/user.service';
import {Router} from '@angular/router';
import {combineLatest, Observable, of, Subject} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {catchError, map, tap} from 'rxjs/operators';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {get} from 'lodash';
import {Location} from '@angular/common';
import jwt_decode from 'jwt-decode';

@Injectable()
export class AuthService implements OnDestroy {
    constructor(
        public browserService: BrowserService,
        public httpServices: HttpServices,
        private storageService: StorageService,
        public userService: UserService,
        private router: Router,
        private location: Location
    ) {
    }

    public langEvent: Subject<any> = new Subject();

    public getToken(): string {
        // return this.storageService.localStorageGetterItem('token')
        //     || this.storageService.getCookie('bizibox_token-new');
        return this.storageService.localStorageGetterItem('token');
    }

    private getDiffMinutes(dt2, dt1): number {
        let diff = (dt2.getTime() - dt1.getTime()) / 1000 / 60;
        return Math.abs(Math.round(diff));
    }

    private getTokenExpirationDate(token: string): Date {
        try {
            const decoded: any = jwt_decode(token);
            if (decoded.exp === undefined) {
                return null;
            }
            const date = new Date(0);
            date.setUTCSeconds(decoded.exp);
            return date;
        } catch (e) {
            return null;
        }
    }

    public isTokenExpired(token?: string): Observable<boolean> {
        token = token || this.getToken();
        if (!token) {
            return of(true);
        }

        const date = this.getTokenExpirationDate(token);

        if (!date) {
            return of(false);
        }
        /*
                    if (date === undefined) {
                        return of(false);
                    }
            */
        const currentDate = new Date();

        if (date.valueOf() > currentDate.valueOf()) {
            if (this.getDiffMinutes(date, currentDate) < 15) {
                return this.refreshToken().pipe(map(() => false));
            }
            return of(false);
        } else {
            return of(true);
        }
    }

    private refreshToken(): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/auth/refresh',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            tap((response: any) => {
                if (response.status !== 401 && response.status !== 403) {
                    const token: string = response.body.token;
                    if (token) {
                        this.storageService.localStorageSetter('token', token);
                        this.userService.appData.token =
                            this.storageService.localStorageGetterItem('token');
                    }
                }
            }),
            catchError(this.handleErrorLogin<any>())
        );
    }

    private setLoginState(token: string, autologin = true) {
        if (!token) {
            return;
        }
        this.storageService.localStorageSetter('token', token);
        this.userService.appData.token = token;

        if (!autologin) {
            return;
        }

        try {
            const decodedToken: any = jwt_decode(token);
            // if (decodedToken.type !== 'AUTH') return;
            if (decodedToken.type === 'FORCE_PASSWORD_CHANGE') {
                this.router.navigate([
                    '/reset-password',
                    {
                        forcePasswordChange: true
                    }
                ]);
                return;
            } else if (decodedToken.type !== 'AUTH') {
                return;
            }
        } catch (e) {
            return;
        }

        this.getUserData().subscribe(
            (response: any) => {
                console.log('getUserData');
            }
        );
    }

    public login(
        username: string,
        password: string,
        gRecaptcha: any,
        rememberMe?: boolean
    ): Observable<any> {
        interface DataParams {
            username: string;
            password: string;
            rememberMe: boolean;
            gRecaptcha: any;
        }

        const data: DataParams = {
            username: username,
            password: password,
            rememberMe: rememberMe,
            gRecaptcha: gRecaptcha
        };
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/auth/token',
            params: data,
            isJson: true,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            tap((response: any) => {
                if (
                    [401, 403].includes(response.status) ||
                    !get(response, 'body.token')
                ) {
                    return;
                }
                this.setLoginState(response.body.token);
            }),
            catchError(this.handleErrorLogin<any>())
        );
    }

    public loginOtp(code: string, autologin = true): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/auth/otp/code?code=${code}`,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            tap((response: any) => {
                if (
                    [400, 401, 403].includes(response.status) ||
                    !get(response, 'body.token') ||
                    [
                        'Incorrect one time token code',
                        'userNotfound',
                        'userNotFound'
                    ].includes(response.body.token)
                ) {
                    return;
                }

                this.setLoginState(response.body.token, autologin);
            }),
            catchError(this.handleErrorLogin<any>())
        );
    }

    public sendOtpCode(code: string): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/auth/otp/code?code=${code}`,
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            stopRedInError: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }


    public resentOtpSms(isAuthorizationToken: any, gRecaptcha: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/auth/otp/resend-sms',
            isJson: true,
            params: {
                gRecaptcha: gRecaptcha
            },
            isProtected: true //,
            // isAuthorization: true
        };
        if (!!isAuthorizationToken) {
            interfaceParamHttp['isAuthorizationToken'] = isAuthorizationToken;
        } else {
            interfaceParamHttp['isAuthorization'] = true;
        }
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    public resentOtpVms(isAuthorizationToken: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/auth/otp/resend-vms',
            isJson: true,
            isProtected: true //,
            // isAuthorization: true
        };
        if (!!isAuthorizationToken) {
            interfaceParamHttp['isAuthorizationToken'] = isAuthorizationToken;
        } else {
            interfaceParamHttp['isAuthorization'] = true;
        }
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }


    public sendSms(isAuthorizationToken: any, gRecaptcha: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/auth/otp/send-sms',
            isJson: true,
            params: {
                gRecaptcha: gRecaptcha
            },
            isProtected: true //,
            // isAuthorization: true
        };
        if (!!isAuthorizationToken) {
            interfaceParamHttp['isAuthorizationToken'] = isAuthorizationToken;
        } else {
            interfaceParamHttp['isAuthorization'] = true;
        }
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }


    public getUserData(isOnlyThis: boolean = false): Observable<any> {
        const arrSender = [
            this.httpServices.sendHttp<any>({
                method: 'get',
                path: 'v1/users/current',
                isProtected: true,
                isAuthorization: true
            })
        ];

        if (this.userService.appData && this.userService.appData.isAdmin) {
            arrSender.push(
                this.httpServices.sendHttp<any>({
                    method: 'get',
                    path: 'v1/users/current-on-behalf',
                    isProtected: true,
                    isAuthorization: true
                })
            );
        }

        return combineLatest(arrSender).pipe(
            tap((response: any) => {
                if (response[0]) {
                    this.userService.appData.userData = response[0].body;
                    try {
                        if ((this.userService.appData.userData.biziboxRole === 'REPRESENTATIVE' ||
                            this.userService.appData.userData.biziboxRole === 'REPRESENTATIVE_MANAGER' ||
                                this.userService.appData.userData.biziboxRole === 'SALES_REPRESENTATIVE')
                            && this.userService.appData.isAdmin) {
                            this.userService.appData.hideCompanyName = true;
                        } else {
                            this.userService.appData.hideCompanyName = false;
                        }
                    } catch (e) {

                    }
                    if (window['mixpanel']) {
                        window['mixpanel'].set_group('user name', this.userService.appData.userData.userName);
                    }
                }
                if (
                    response[1] &&
                    this.userService.appData &&
                    this.userService.appData.isAdmin
                ) {
                    this.userService.appData.userDataAdmin = response[1].body;
                    this.userService.appData.userData.accountant =
                        this.userService.appData.userDataAdmin.accountant;
                }
                if (this.userService.appData && !this.userService.appData.isAdmin) {
                    this.userService.appData.userDataAdmin = response[0].body;
                }
                if (
                    this.userService.appData.userData.activated === false &&
                    !this.userService.appData.isActivated
                ) {
                    this.userService.appData.userData.activatedType = 'dialogUpdate';
                }
                if (this.userService.appData.isActivated) {
                    setTimeout(() => {
                        this.userService.appData.isActivated = false;
                    }, 6000);
                }

                // if (this.userService.appData.userData.accountant === true) {
                this.httpServices
                    .sendHttp<any>({
                        method: 'post',
                        path: 'v1/ocr/get-new-system-updates',
                        params: {
                            type:
                                this.userService.appData.userData.accountant === true
                                    ? 'accountant'
                                    : 'cfl'
                        },
                        isJson: true,
                        isProtected: true,
                        isAuthorization: true
                    })
                    .subscribe((updates) => {
                        // updates = {
                        //     body: [
                        //         {
                        //             'expiration_date': '2018-07-03T00:00:00',
                        //             'link_text': null,
                        //             'subject': 'כותרת של תוכן חדש',
                        //             'text': 'טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש',
                        //             'type': null,
                        //             'link': null,
                        //             'version': 0,
                        //             'systemUpdateId:': '123334441'
                        //         },
                        //         {
                        //             'expiration_date': '2018-07-03T00:00:00',
                        //             'link_text': null,
                        //             'subject': 'כותרת 2 של תוכן חדש',
                        //             'text': 'טקסט2 של תוכן חדש',
                        //             'type': null,
                        //             'link': null,
                        //             'version': 0,
                        //             'systemUpdateId:': '123334442'
                        //         },
                        //         {
                        //             'expiration_date': '2018-07-03T00:00:00',
                        //             'link_text': 'לינק לדוגמה',
                        //             'subject': 'כותרת3 של תוכן חדש',
                        //             'text': 'טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש טקסט של תוכן חדש',
                        //             'type': null,
                        //             'link': 'https://www.google.com/',
                        //             'version': 0,
                        //             'systemUpdateId:': '123334443'
                        //         },
                        //         {
                        //             'expiration_date': '2018-07-03T00:00:00',
                        //             'link_text': null,
                        //             'subject': 'כותרת4 של תוכן חדש',
                        //             'text': 'טקסט4 של תוכן חדש',
                        //             'type': null,
                        //             'link': null,
                        //             'version': 0,
                        //             'systemUpdateId:': '123334444'
                        //         },
                        //         {
                        //             'expiration_date': '2018-07-03T00:00:00',
                        //             'link_text': null,
                        //             'subject': 'כותרת5 של תוכן חדש',
                        //             'text': 'טקסט5 של תוכן חדש',
                        //             'type': null,
                        //             'link': null,
                        //             'version': 0,
                        //             'systemUpdateId:': '123334445'
                        //         }
                        //     ]
                        // };
                        let data = updates.body;
                        if (data && data.length) {
                            let updatesList: any = [];
                            updatesList = this.storageService.localStorageGetterItem(
                                'updatesList_' + this.userService.appData.userData.userName
                            );
                            if (updatesList !== null) {
                                // @ts-ignore
                                updatesList = JSON.parse(updatesList);
                                data = data.filter(
                                    (it) =>
                                        !updatesList.some(
                                            (itSaved) =>
                                                itSaved.systemUpdateId === it.systemUpdateId &&
                                                itSaved.version === it.version
                                        )
                                );
                            }
                        }
                        this.userService.appData.updatesList =
                            data && data.length
                                ? {
                                    data: data,
                                    indexOpen: 0
                                }
                                : false;
                    });
                // }
                if (!this.userService.appData.userData.accountant) {
                    const arrSenderNav = [];
                    const screens = ['bankAccount', 'creditsCard', 'checks', 'slika', 'daily', 'fixedMovements'];
                    screens.forEach(section => {
                        arrSenderNav.push(this.httpServices.sendHttp<any>({
                            method: 'post',
                            path: 'v1/users/default-user-for-screen',
                            params: {
                                screenName: section
                            },
                            isJson: true,
                            isProtected: true,
                            isAuthorization: true
                        }));
                    });
                    combineLatest(arrSenderNav)
                        .subscribe((navScreens: any) => {
                            navScreens.forEach((sec) => {
                                const screen = sec.body;
                                if (screen && screen.screenName) {
                                    this.storageService.localStorageSetter(
                                        screen.screenName,
                                        JSON.stringify(screen)
                                    );
                                }
                            });
                        });
                }

                const lang: string = this.userService.appData.userData.language;
                const pathMainApp: string =
                    this.userService.appData.userData.accountant === true
                        ? 'accountants'
                        : 'cfl';
                this.userService.appData['userData'].pathMainApp = pathMainApp;
                this.userService.appData.isLoggedIn = true;
                this.langEvent.next({lang: lang});

                const beneficiariesAdvertisePromptTimesShownKey =
                    this.userService.appData.userData.userName +
                    '_beneficiariesAdvertisePromptTimesShown';
                const beneficiariesAdvertisePromptTimesShown =
                    (Number(
                        this.storageService.localStorageGetterItem(
                            beneficiariesAdvertisePromptTimesShownKey
                        )
                    ) || 0) + 1;
                if (beneficiariesAdvertisePromptTimesShown < 3) {
                    this.userService.appData.userData.beneficiariesAdvertisePrompt = {
                        show: true
                    };
                    this.storageService.localStorageSetter(
                        beneficiariesAdvertisePromptTimesShownKey,
                        String(beneficiariesAdvertisePromptTimesShown)
                    );
                }

                if (!isOnlyThis) {
                    if (!this.userService.appData.userData.changePasswordRequired) {
                        // tslint:disable-next-line:max-line-length
                        // const redirect: string = (this.userService.appData.redirectUrl && this.userService.appData.redirectUrl !== '/')
                        //     ? this.userService.appData.redirectUrl
                        //     : `/${pathMainApp}`;
                        // this.router.navigate([redirect], {queryParamsHandling: 'preserve'});
                        const redirect = this.location.normalize(
                            this.userService.appData.redirectUrl &&
                            this.userService.appData.redirectUrl !== '/'
                                ? this.userService.appData.redirectUrl
                                : pathMainApp
                        );
                        const [path, query] = redirect.split('?');
                        this.location.replaceState(path, query);
                        this.router.navigateByUrl(redirect);
                        //
                        // if (this.userService.appData.userData.showAppPopup) {
                        //     this.userService.mobileInvitePrompt.show(this.us);
                        // }
                    } else {
                        this.router.navigate([
                            '/reset-password',
                            {
                                forcePasswordChange: true
                            }
                        ]);
                    }
                }
            }),
            catchError(this.handleErrorLogin<any>())
        );
    }

    public resetPassword(email: string) {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/auth/otp/reset-password?username=${email}`,
            isJson: true,
            isProtected: true,
            isAuthorization: false
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            tap((response: any) => {
                if (
                    [400, 401, 403].includes(response.status) ||
                    !get(response, 'body.token') ||
                    [
                        'Incorrect one time token code',
                        'userNotfound',
                        'userNotFound'
                    ].includes(response.body.token)
                ) {
                    return;
                }
                this.setLoginState(response.body.token, false);
            })
        );
    }

    public changePassword(password: string) {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/change-password',
            isJson: true,
            params: {newPassword: password},
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            tap((response: any) => {
                if (
                    [400, 401, 403].includes(response.status) ||
                    !get(response, 'body.token')
                ) {
                    return;
                }
                this.setLoginState(response.body.token);
            }),
            catchError(this.handleErrorLogin<any>())
        );
    }

    public replacePassword(params: { newPassword: string; oldPassword: string }) {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/change-password',
            isJson: true,
            params: params,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp).pipe(
            tap((response: any) => {
                if (
                    [400, 401, 403].includes(response.status) ||
                    !get(response, 'body.token')
                ) {
                    return;
                }
                this.setLoginState(response.body.token, false);
            }),
            catchError(this.handleErrorLogin<any>())
        );
    }

    private handleErrorLogin<T>(operation = 'operation', result?: T) {
        return (err: HttpErrorResponse) => {
            console.log(err);
            this.storageService.localStorageRemoveItem('token');
            this.logout();
            return of(err);
        };
    }

    public logout(): void {
        this.logoutNoRedirect();
        this.router.navigate(['/login'], {queryParamsHandling: ''});
    }

    public logoutNoRedirect(): void {
        this.userService.appData.isLoggedIn = false;

        // this.storageService.localStorageClear();
        ['token', 'userOnBehalf'].forEach((key) =>
            this.storageService.localStorageRemoveItem(key)
        );
        const listOfServiceSaved = Object.entries(localStorage).filter(([key]) =>
            key.endsWith('app-service-call-dialog')
        );
        if (listOfServiceSaved.length) {
            listOfServiceSaved.forEach((v) => {
                this.storageService.localStorageRemoveItem(v[0]);
            });
        }
        this.storageService.sessionStorageClear();
        this.userService.appData.redirectUrl = null;
        this.userService.appData.userData = null;
    }

    public getLoggedInUsername(): string {
        const token = this.getToken();
        if (!token) {
            return null;
        }
        try {
            const decoded: any = jwt_decode(token);
            return decoded && decoded.sub;
        } catch (e) {
            return null;
        }
    }

    ngOnDestroy() {
        if (this.langEvent) {
            this.langEvent.unsubscribe();
        }
    }
}
