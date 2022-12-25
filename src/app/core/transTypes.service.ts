import {Injectable, OnDestroy} from '@angular/core';
import {merge, Observable, of, Subject, throwError} from 'rxjs';
import {filter, map, shareReplay, startWith, switchMap, takeUntil, tap} from 'rxjs/operators';
import {HttpServices} from '@app/shared/services/http.services';
import {UserService} from './user.service';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';

@Injectable()
export class TransTypesService implements OnDestroy {
    private selectedCompanyTransTypes$: Observable<Array<any>>;

    get selectedCompanyTransTypes(): Observable<Array<any>> {
        if (!this.selectedCompanyTransTypes$) {
            this.selectedCompanyTransTypes$ = merge(
                this.companySelectionChange$.pipe(startWith(null)),
                this.selectedCompanyTransTypesReload$
            ).pipe(
                filter(
                    () =>
                        this.userService.appData &&
                        this.userService.appData.userData &&
                        this.userService.appData.userData.companySelect &&
                        this.userService.appData.userData.companySelect.companyId
                ),
                switchMap(() =>
                    this.getTransTypesFor(
                        this.userService.appData.userData.companySelect.companyId
                    )
                ),
                shareReplay(1),
                takeUntil(this.destroyed$)
            );
        }
        return this.selectedCompanyTransTypes$;
    }

    private readonly destroyed$ = new Subject<void>();
    private readonly selectedCompanyTransTypesReload$ = new Subject<void>();
    public readonly transTypeChangeEvent: Subject<any> = new Subject();
    public readonly companySelectionChange$: Subject<void> = new Subject<void>();

    ngOnDestroy(): void {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        if (this.selectedCompanyTransTypesReload$) {
            this.selectedCompanyTransTypesReload$.next();
            this.selectedCompanyTransTypesReload$.complete();
        }
        if (this.companySelectionChange$) {
            this.companySelectionChange$.next();
            this.companySelectionChange$.complete();
        }
    }

    constructor(
        private httpServices: HttpServices,
        public userService: UserService
    ) {
        // this.companySelectionChange$
        //     .subscribe(() => this.selectedCompanyTransTypesReload());
    }

    private getTransTypesFor(companyId: number | string): Observable<Array<any>> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/trans-type',
            params: {
                uuid: companyId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request).pipe(
            switchMap((response: any) =>
                response && !response.error
                    ? of(response.body)
                    : throwError(response ? response.error : 'Invalid response')
            ),
            map((transTypes) => {
                // debugger;
                transTypes
                    .filter(
                        (transType) =>
                            transType.companyId === '00000000-0000-0000-0000-000000000000'
                    )
                    .forEach((transtType) => (transtType.immutable = true));

                return transTypes;
            })
        );
    }

    selectedCompanyTransTypesReload() {
        this.selectedCompanyTransTypesReload$.next();
    }

    transTypeCreate(paramsObj: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/trans-type-create',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params).pipe(
            tap(() => {
                this.selectedCompanyTransTypesReload();
                this.transTypeChangeEvent.next({
                    type: 'create',
                    value: paramsObj
                });
            })
        );
    }

    transTypeDelete(paramsObj: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/trans-type-delete',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params).pipe(
            tap(() => {
                this.selectedCompanyTransTypesReload();
                this.transTypeChangeEvent.next({
                    type: 'delete',
                    value: paramsObj
                });
            })
        );
    }

    transTypeUpdate(paramsObj: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/trans-type-update',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params).pipe(
            tap(() => {
                this.selectedCompanyTransTypesReload();
                this.transTypeChangeEvent.next({
                    type: 'change',
                    value: paramsObj
                });
            })
        );
    }
}
