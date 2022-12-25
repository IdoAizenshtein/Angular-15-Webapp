import {Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {TokenService, TokenStatus, TokenStatusResponse} from '@app/core/token.service';
import {DialogState} from '../token-update-dialog/token-update-dialog.component';
import {map, shareReplay, switchMap, takeUntil, tap} from 'rxjs/operators';
import {Observable, of, Subject, timer} from 'rxjs';
import {takeWhileInclusive} from '../../../functions/takeWhileInclusive';
import {UserService} from '@app/core/user.service';
import {publishRef} from '../../../functions/publishRef';

@Component({
    selector: 'app-token-credentials-update-button',
    templateUrl: './token-credentials-update-button.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TokenCredentialsUpdateButtonComponent
    implements OnInit, OnDestroy, OnChanges {
    @Input() tokenData: { companyId: string; tokenId: string };

    @Input() pollAfterUpdate = true;

    @Input() balanceLastUpdatedDate: number;

    public TokenStatus = TokenStatus;

    updatePromptVisible = false;

    public tokenStatusLoad$: Observable<TokenStatusResponse>;
    private readonly destroyed$ = new Subject<void>();

    constructor(
        public tokenService: TokenService,
        public userService: UserService
    ) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['tokenData']) {
            this.rebuildLoader();
        }
    }

    ngOnInit() {
        this.rebuildLoader();
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    private rebuildLoader(): void {
        if (this.tokenData && this.tokenData.companyId && this.tokenData.tokenId) {
            this.tokenStatusLoad$ = this.tokenService
                .tokenGetStatus({
                    companyId: this.tokenData.companyId,
                    tokens: [this.tokenData.tokenId]
                })
                .pipe(
                    map((rslt) => rslt[0]),
                    tap((rslt) => {
                        if (
                            rslt &&
                            this.tokenService.isTokenStatusProgressing(rslt.tokenStatus) &&
                            !(
                                this.userService.appData.userData
                                    .companySelectedBillingStatus === 'RESTRICT'
                            )
                        ) {
                            this.tokenStatusLoad$ = timer(0, 5000).pipe(
                                switchMap((v) => {
                                    return v === 0
                                        ? of(rslt)
                                        : this.tokenService
                                            .tokenGetStatus({
                                                companyId: this.tokenData.companyId,
                                                tokens: [this.tokenData.tokenId]
                                            })
                                            .pipe(map((rslt1) => rslt1[0]));
                                }),
                                publishRef, // shareReplay(1)
                                takeWhileInclusive((rslt2) =>
                                    this.tokenService.isTokenStatusProgressing(rslt2.tokenStatus)
                                )
                            );
                        }
                    }),
                    shareReplay(1),
                    takeUntil(this.destroyed$)
                );
        }
    }

    onUpdateStartClick() {
        this.resetUpdatePromptData();
    }

    private resetUpdatePromptData() {
        this.updatePromptVisible = true;
    }

    // noinspection JSMethodCanBeStatic
    onUpdateDialogVisibilityChange(state: DialogState) {
        if (state === DialogState.UPDATE_SUCCEEDED) {
            // this.status.tokenStatus = TokenStatus[TokenStatus.InProgress];
        }
    }
}
