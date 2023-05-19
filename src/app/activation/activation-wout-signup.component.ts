import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {from, Observable, Subject} from 'rxjs';
import {switchMap, takeUntil, tap} from 'rxjs/operators';
import {AuthService} from '../login/auth.service';
import {Location} from '@angular/common';
import {ActivationService} from './activation.service';
import {UserService} from '@app/core/user.service';

@Component({
    template: '',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ActivationWoutSignupComponent implements OnInit, OnDestroy {
    private readonly destroyed$ = new Subject<void>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        public userService: UserService,
        private location: Location,
        private authService: AuthService,
        private activationService: ActivationService
    ) {
    }

    ngOnInit(): void {
        this.route.queryParamMap
            .pipe(
                tap(() => {
                    this.location.replaceState('/');
                    this.authService.logoutNoRedirect();
                    // this.router.navigateByUrl(redirect, {queryParamsHandling: 'preserve'});
                }),
                switchMap((params) => {
                    const userName = params.has('user_name')
                        ? params.get('user_name').trim()
                        : '';
                    const activator = params.has('activator')
                        ? params.get('activator').trim()
                        : '';
                    return !!userName && !!activator
                        ? new Observable<any>((observer: any) => {
                            this.activationService
                                .activateUser({
                                    uuid: activator
                                }).subscribe(() => {
                                this.userService.executeAction('token').then((gRecaptcha) => {
                                    this.authService.login(userName, userName, gRecaptcha, false).subscribe((res) => {
                                        observer.next(
                                            res
                                        );
                                    });
                                });
                            });
                        })
                        : from(
                            this.router.navigateByUrl('/', {
                                replaceUrl: true
                            })
                        );
                }),
                takeUntil(this.destroyed$)
            )
            .subscribe(() => {
            });
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }
}
