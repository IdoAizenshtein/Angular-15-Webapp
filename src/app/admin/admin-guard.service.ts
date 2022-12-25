import {Injectable} from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    CanActivateChild,
    CanLoad,
    Route,
    RouterStateSnapshot
} from '@angular/router';
import {Observable} from 'rxjs/internal/Observable';
import {UserService} from '@app/core/user.service';

@Injectable()
export class AdminGuard implements CanActivate, CanActivateChild, CanLoad {
    constructor(public userService: UserService) {
    }

    canActivate(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        return this.userService.appData.isAdmin;
    }

    canActivateChild(
        childRoute: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        return this.userService.appData.isAdmin;
    }

    canLoad(route: Route): Observable<boolean> | Promise<boolean> | boolean {
        return this.userService.appData.isAdmin;
    }
}
