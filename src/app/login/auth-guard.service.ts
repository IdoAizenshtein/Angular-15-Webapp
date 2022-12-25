import {Injectable} from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    CanLoad,
    Route,
    Router,
    RouterStateSnapshot,
    UrlSegment,
    UrlSegmentGroup,
    UrlSerializer,
    UrlTree
} from '@angular/router';
import {AuthService} from './auth.service';
// import {StorageService} from '@app/shared/services/storage.service';
import {UserService} from '@app/core/user.service';
import {Observable, of} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {Location} from '@angular/common';
import jwt_decode from "jwt-decode";

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild, CanLoad {
    constructor(
        private authService: AuthService,
        public router: Router, // private storageService: StorageService,
        public userService: UserService,
        private location: Location
    ) {
        this.userService.appData.token = authService.getToken();
        // this.storageService.localStorageGetterItem('token');
    }

    getPathOfMainState(url: string): string {
        const tree: UrlTree = this.router.parseUrl(url);
        const g: UrlSegmentGroup = tree.root.children['primary'];
        const s: UrlSegment[] = g.segments;
        return s[0].path;
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        const url: string = state.url;
        return this.checkLogin(url);
    }

    canActivateChild(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        return this.canActivate(route, state);
    }

    canLoad(route: Route): Observable<boolean> {
        const url = `/${route.path}`;
        return this.checkLogin(url);
    }

    checkLogin(url: string): Observable<boolean> {
        if (
            url.includes('api-account-management') ||
            url.includes('agreement-page')
        ) {
            return of(true);
        } else {
            if (
                !BrowserService.isMobile() && // && (url !== '/login') && (url !== '/reset-password')) {
                (!url ||
                    ['/login', '/reset-password', '/signup'].every(
                        (prfx) => !url.startsWith(prfx)
                    ))
            ) {
                this.userService.appData.redirectUrl = this.location.path(); // location.pathname + location.search;
                // url.split('?')[0];
                return this.authService.isTokenExpired().pipe(
                    mergeMap((isExpired) => {
                        const baseToken = this.authService.getToken();
                        if (!baseToken) {
                            this.authService.logout();
                            this.userService.appData.redirectUrl = this.location.path();
                            return of(false);
                        }

                        try {
                            const decodedToken: any = jwt_decode(baseToken);
                            if (isExpired || (decodedToken && decodedToken.type !== 'AUTH')) {
                                this.authService.logout();
                                return of(false);
                            }
                        } catch (e) {
                            this.authService.logout();
                            return of(false);
                        }

                        if (this.userService.appData.userData === undefined) {
                            return this.authService.getUserData(true).pipe(
                                map((response: any) => {
                                    if (response && response[0] && response[0].error) {
                                        this.authService.logout();
                                    } else if (this.userService.appData.userData !== null) {
                                        if (
                                            url === '/' ||
                                            (this.userService.appData.userData.pathMainApp ===
                                                'cfl' &&
                                                this.getPathOfMainState(url) === 'accountants')
                                        ) {
                                            this.userService.appData.redirectUrl =
                                                this.userService.appData.userData.pathMainApp;

                                            // tslint:disable-next-line:max-line-length
                                            // this.router.navigate([`/${this.userService.appData.redirectUrl}`], {queryParamsHandling: 'preserve'});
                                            const redirect = this.location.normalize(
                                                this.userService.appData.redirectUrl
                                            );
                                            const [path, query] = redirect.split('?');
                                            this.location.replaceState(path, query);
                                            this.router.navigateByUrl(redirect);

                                            return false;
                                        }
                                        return true;
                                    }
                                    return true;
                                })
                            );
                        }

                        if (this.userService.appData.userData !== null) {
                            if (
                                url === '/' ||
                                (this.userService.appData.userData.pathMainApp === 'cfl' &&
                                    this.getPathOfMainState(url) === 'accountants')
                            ) {
                                this.userService.appData.redirectUrl =
                                    this.userService.appData.userData.pathMainApp;

                                // this.router.navigate([`/${this.userService.appData.redirectUrl}`], {queryParamsHandling: 'preserve'});
                                const redirect = this.location.normalize(
                                    this.userService.appData.redirectUrl
                                );
                                const [path, query] = redirect.split('?');
                                this.location.replaceState(path, query);
                                this.router.navigateByUrl(redirect);

                                return of(false);
                            }
                        }
                        return of(true);
                    })
                );
            } else if (BrowserService.isMobile()) {
                this.userService.appData.landingToMobile = 'regular';
                this.router.navigate(['/landingToMobile'], {queryParamsHandling: ''});
                return of(false);
            } else {
                return of(true);
            }
        }
    }
}
