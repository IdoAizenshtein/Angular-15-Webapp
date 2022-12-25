import {
    ActivatedRouteSnapshot,
    CanActivate,
    NavigationEnd,
    PRIMARY_OUTLET,
    Resolve,
    Router,
    RouterStateSnapshot
} from '@angular/router';
import {Observable} from 'rxjs';
import {Directive, OnDestroy} from '@angular/core';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {HttpServices} from '@app/shared/services/http.services';
import {filter, map, mergeMap} from 'rxjs/operators';
import {publishRef} from '@app/shared/functions/publishRef';

@Directive()
export class UserDefaultsResolver
    implements Resolve<any>, CanActivate, OnDestroy {
    readonly constPart;
    readonly defaultDisplayMode;
    readonly userDefaultsSubject: Observable<any>;

    constructor(
        private httpServices: HttpServices,
        private router: Router,
        screenName: string,
        defaultDisplayMode?: string,
        private ignoreParts: string[] = ['graph']
    ) {
        this.constPart = screenName;
        this.defaultDisplayMode = defaultDisplayMode
            ? defaultDisplayMode
            : this.constPart === 'slika'
                ? 'details'
                : 'aggregate';

        this.userDefaultsSubject = this.getUserDefaultsFor(this.constPart).pipe(
            publishRef
        );
        this.router.events
            .pipe(
                filter((evt: any) => evt instanceof NavigationEnd),
                map((evt: NavigationEnd) => {
                    return this.router.parseUrl(evt.url).root.children[PRIMARY_OUTLET].segments;
                })
            )
            .subscribe((urlSegments) => {
                console.log('navigationend for %o', urlSegments);

                const constPartIndex = urlSegments.findIndex(
                    (seg) => seg.path === this.constPart
                );
                if (constPartIndex >= 0 && constPartIndex + 1 < urlSegments.length) {
                    const newDisplayName = urlSegments
                        .slice(constPartIndex + 1)
                        .map((seg) => seg.path)
                        .join('/');

                    if (
                        newDisplayName !== this.ignoreParts.join('/') &&
                        newDisplayName !== 'casflow/matched'
                    ) {
                        this.userDefaultsSubject.subscribe((ud) => {
                            if (ud.displayMode !== newDisplayName) {
                                ud.displayMode = newDisplayName;
                                this.setDisplayModeTo(newDisplayName);
                            }
                        });
                    }
                }
            });
    }

    setNumberOfRowsAt(numberOfRowsPerTable: number): void {
        this.userDefaultsSubject
            .pipe(
                mergeMap((ud) => {
                    ud.numberOfRowsPerTable = numberOfRowsPerTable;
                    return this.setUserDefaultsFor(ud);
                })
            )
            .subscribe((rslt) => {
                console.log(
                    '%o: number of rows set to %d ===> %o',
                    this.constPart,
                    numberOfRowsPerTable,
                    rslt
                );
            });
    }

    resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<any> {
        return this.userDefaultsSubject;
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> {
        // return this.getUserDefaultsFor(this.constPart)
        return this.userDefaultsSubject.pipe(
            map((resp) => {
                const defaultViewName = resp
                    ? resp.displayMode
                    : this.defaultDisplayMode;

                let urlToNavigate = [state.url.split('?')[0], defaultViewName];
                console.log(
                    'resolved ===> aRoute: %o, defaultViewName: %o,  navigate to %o ',
                    state,
                    defaultViewName,
                    urlToNavigate
                );

                if (urlToNavigate.length === 2) {
                    urlToNavigate = [urlToNavigate[0] + '/' + urlToNavigate[1]];
                }
                this.router.navigate(urlToNavigate, {
                    queryParamsHandling: 'preserve',
                    replaceUrl: true
                }).then(r => {
                });
                return false;
            })
        );
    }

    ngOnDestroy(): void {
        console.log('UserDefaultsResolver for %o destroyed', this.constPart);
    }

    private getUserDefaultsFor(section: string): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/default-user-for-screen',
            params: {
                screenName: section
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam).pipe(
            map(
                (result) =>
                    result.body || {
                        displayMode: this.defaultDisplayMode,
                        numberOfRowsPerTable: 50,
                        screenName: section
                    }
            )
        );
    }

    private setUserDefaultsFor(paramsObj: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/default-user-for-screen-update',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(params)
            .pipe(map((result) => result.body));
    }

    private setDisplayModeTo(displayMode: string): void {
        this.userDefaultsSubject
            .pipe(
                mergeMap((ud) => {
                    ud.displayMode = displayMode;
                    return this.setUserDefaultsFor(ud);
                })
            )
            .subscribe((rslt) => {
                console.log(
                    '%o: display mode set to %o ===> %o',
                    this.constPart,
                    displayMode,
                    rslt
                );
            });
    }
}
