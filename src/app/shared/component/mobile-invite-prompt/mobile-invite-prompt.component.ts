import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {HttpServices} from '@app/shared/services/http.services';
import {BehaviorSubject, defer} from 'rxjs';
import {InterfaceParamHttp} from '../../interfaces/interface.param.http';
import {filter, map, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';

@Component({
    selector: 'app-mobile-invite-prompt',
    templateUrl: './mobile-invite-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class MobileInvitePromptComponent implements OnInit, OnDestroy {
    visible: boolean;
    readonly linkRequested$: BehaviorSubject<boolean> = new BehaviorSubject(
        false
    );
    readonly linkProvided$ = defer(() => {
        return this.linkRequested$.pipe(
            filter((val) => val),
            switchMap(() => {
                const interfaceParamHttp: InterfaceParamHttp<any> = {
                    method: 'get',
                    path: 'v1/users/send-app-download-message',
                    responseType: 'text',
                    isProtected: true,
                    isAuthorization: true
                };
                return this.httpServices
                    .sendHttp<any>(interfaceParamHttp)
                    .pipe(
                        map((response: any) =>
                            response && !response.error ? response.body : null
                        )
                    );
            }),
            // tap((response:any) => {
            //     // if (response) {
            //     //     this.userService.appData.userData.showAppPopup = false;
            //     // }
            // }),
            takeUntil(this.destroyed$)
        );
    });
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        private httpServices: HttpServices
    ) {
    }

    ngOnInit(): void {
        this.visible = true;
        this.linkRequested$.next(false);
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    provideLink(): void {
        this.linkRequested$.next(true);
    }

    hide(): void {
        this.visible = false;
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/users/hide-app-popup',
            isProtected: true,
            isAuthorization: true
        };
        this.httpServices
            .sendHttp<any>(interfaceParamHttp)
            .pipe(tap(() => (this.userService.appData.userData.showAppPopup = false)))
            .subscribe(() => {
            });
    }
}
