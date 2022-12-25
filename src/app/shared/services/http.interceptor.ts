import {Injectable} from '@angular/core';

import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
    HttpResponse
} from '@angular/common/http';
import {map, Observable, throwError} from 'rxjs';

import {catchError, finalize, tap} from 'rxjs/operators';
import {UserService} from '@app/core/user.service';

@Injectable()
export class TimingInterceptor implements HttpInterceptor {
    constructor(public userService: UserService) {
        this.userService.appData.numOfXHR = -1;
    }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const started = Date.now();
        let ok: string;
        if (this.userService.appData.numOfXHR === -1) {
            this.userService.appData.numOfXHR = 0;
        }
        this.userService.appData.numOfXHR++;
        this.userService.reqDataEventSend();

        return next.handle(req).pipe(
            tap(
                {
                    next: (event) => (ok = event instanceof HttpResponse ? 'succeeded' : ''),
                    error: (error) => (ok = 'failed')
                }
            ),
            finalize(() => {
                const elapsed = Date.now() - started;
                console.log(
                    `Request for ${req.method} "${req.urlWithParams}" ${ok} in ${elapsed} ms.`
                );
                this.userService.appData.numOfXHR--;
                this.userService.reqDataEventSend();
            })
        );
    }
}

@Injectable({
    providedIn: 'root'
})
export class ChunkLoadErrorInterceptor implements HttpInterceptor {
    constructor() {
    }

    intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        return next.handle(req)
            .pipe(
                map(x => {
                    if (x instanceof HttpErrorResponse) {
                        throw x;
                    }
                    return x;
                })
            )
            .pipe(
                catchError(error => {
                    if (error.status === 404 && error.message.includes('Loading chunk')) {
                        window.location.reload();
                    }
                    return throwError(error);
                })
            );
    }
}
