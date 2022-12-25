import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {TokenService, TokenStatus, TokenStatusResponse} from '@app/core/token.service';
import {BehaviorSubject, Observable, of, Subscription, timer} from 'rxjs';
import {map, switchMap, withLatestFrom} from 'rxjs/operators';
import {UserService} from '@app/core/user.service';
import {publishRef} from '../../../functions/publishRef';

export interface CompanyTokenTrackInput {
    companyId: string;
    tokensToTrack: string[];
}

@Component({
    selector: 'app-token-tracker-on-demand',
    templateUrl: './token-tracker-on-demand.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TokenTrackerOnDemandComponent implements OnInit, OnDestroy {
    public TokenStatus = TokenStatus;

    private companyId: string;
    private readonly tokensToTrack$ = new BehaviorSubject<string[]>([]);
    private readonly latestStatuses$ = new BehaviorSubject<TokenStatusResponse[]>(
        []
    );

    private readonly innerSubs: Subscription[];
    public tokenStatusToShow$: Observable<TokenStatusResponse | null>;

    constructor(
        public tokenService: TokenService,
        public userService: UserService
    ) {
        this.innerSubs = [
            this.tokenService.trackOnDemand$.subscribe((val) => {
                this.companyId = val ? val.companyId : null;
                this.tokensToTrack$.next(val ? val.tokensToTrack : []);
            }),
            this.tokensToTrack$.subscribe((tokensToTrack) => {
                // debugger;
                const statusesStillRelevant = this.latestStatuses$.value.filter(
                    (status) => tokensToTrack.includes(status.token)
                );
                if (
                    statusesStillRelevant.length !== this.latestStatuses$.value.length
                ) {
                    this.latestStatuses$.next(statusesStillRelevant);
                }
            }),
            timer(0, 5000)
                .pipe(
                    withLatestFrom(this.tokensToTrack$),
                    switchMap(([tick, tokenIds]) => {
                        if (!this.companyId || !tokenIds || !tokenIds.length) {
                            return of([]);
                        }

                        if (
                            this.companyId !==
                            this.userService.appData.userData.companySelect.companyId
                        ) {
                            this.tokensToTrack$.next([]);
                            this.latestStatuses$.next([]);
                            return of([]);
                        }

                        const tokenIdsToLoad = this.latestStatuses$.value.length
                            ? tokenIds.filter((tokenId) => {
                                const latestStatusForToken = this.latestStatuses$.value.find(
                                    (status) => status.token === tokenId
                                );
                                return (
                                    !latestStatusForToken ||
                                    this.tokenService.isTokenStatusProgressing(
                                        latestStatusForToken.tokenStatus
                                    )
                                );
                            })
                            : tokenIds;

                        if (!tokenIdsToLoad.length) {
                            return of([]);
                        }

                        return this.tokenService.tokenGetStatus({
                            companyId: this.companyId,
                            tokens: tokenIdsToLoad
                        });
                    })
                )
                .subscribe((responses: TokenStatusResponse[]) => {
                    if (responses && responses.length) {
                        // debugger;
                        const receivedTokenIds = responses.map((status) => status.token);
                        const statusesUpdated = [
                            ...responses.filter((status) =>
                                this.tokensToTrack$.value.includes(status.token)
                            ),
                            ...this.latestStatuses$.value.filter(
                                (status) =>
                                    this.tokensToTrack$.value.includes(status.token) &&
                                    !receivedTokenIds.includes(status.token)
                            )
                        ];

                        this.latestStatuses$.next(statusesUpdated);
                    }
                })
        ];
    }

    ngOnInit(): void {
        this.tokenStatusToShow$ = this.latestStatuses$.pipe(
            map((latestStatuses) => this.statusToShow(latestStatuses)),
            publishRef
        );
    }

    ngOnDestroy(): void {
        this.tokensToTrack$.complete();
        this.latestStatuses$.complete();

        this.innerSubs.forEach((sub) => sub.unsubscribe());
    }

    statusToShow(
        tokenStatuses: TokenStatusResponse[]
    ): TokenStatusResponse | null {
        if (!Array.isArray(tokenStatuses) || !tokenStatuses.length) {
            return null;
        }

        return tokenStatuses.reduce((selected, tknStat) => {
            if (selected === null) {
                return tknStat;
            }
            // if (this.tokenService.toTokenStatusEnumValue(tknStat.tokenStatus) >
            //         this.tokenService.toTokenStatusEnumValue(selected.tokenStatus)) {
            //     return tknStat;
            // }
            if (
                !this.tokenService.isTokenStatusProgressing(selected.tokenStatus) &&
                (this.tokenService.isTokenStatusProgressing(tknStat.tokenStatus) ||
                    tknStat.dateCreated < selected.dateCreated)
            ) {
                return tknStat;
            }

            return selected;
        }, null);
        //
        // return Math.max(...tokenStatuses
        //     .map(tknStat => this.tokenService.toTokenStatusEnumValue(tknStat.tokenStatus)));
    }

    reload() {
        this.tokensToTrack$.next([]);
        this.latestStatuses$.next([]);
        window.location.reload();
    }
}
