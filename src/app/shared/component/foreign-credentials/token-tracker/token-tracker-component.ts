import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {TokenService, TokenStatus, TokenStatusResponse, TokenType} from '@app/core/token.service';
import {map, switchMap} from 'rxjs/operators';
import {combineLatest, Observable, of, timer, zip} from 'rxjs';
import {takeWhileInclusive} from '../../../functions/takeWhileInclusive';
import {FormGroup} from '@angular/forms';
import {DialogState} from '../token-update-dialog/token-update-dialog.component';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {Subscription} from 'rxjs/internal/Subscription';
import {UserService} from '@app/core/user.service';
import {publishRef} from '../../../functions/publishRef';

@Component({
    selector: 'app-token-tracker',
    templateUrl: './token-tracker-component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TokenTrackerComponent implements OnInit, OnChanges {
    @Input() companyId: string;
    @Input() isAccountant: boolean;
    @Input() showToast: boolean = false;

    public TokenStatus = TokenStatus;
    public TokenType = TokenType;

    public tokenStatusLoad$: Observable<TokenStatusResponse[]>;
    statusToShow$: Observable<TokenStatusResponse>;
    exampleCompanyPoll$: Observable<any>;

    readonly addTokenPrompt: { visible: boolean; form: any };
    updatePromptVisible = false;

    readonly reloadPrompt: {
        visible: boolean;
        countdownTimer$: Observable<number> | null;
        onApprove: () => void;
        rollout: () => void;
        countdownCompleteSub: Subscription;
    };

    constructor(
        public tokenService: TokenService,
        private restCommonService: RestCommonService,
        public userService: UserService
    ) {
        this.addTokenPrompt = {
            visible: false,
            form: new FormGroup({
                // bank: new FormControl(null, [Validators.required])
            })
        };

        this.reloadPrompt = {
            visible: false,
            countdownTimer$: null,
            rollout: function () {
                this.countdownTimer$ = timer(0, 1000).pipe(
                    map((iter) => 5 - iter),
                    takeWhileInclusive((count) => count >= 0)
                );
                this.visible = true;

                this.countdownCompleteSub = this.countdownTimer$.subscribe(
                    undefined,
                    undefined,
                    () => {
                        this.visible = false;
                        this.onApprove();
                        console.log('completed!');
                    }
                );
            },
            onApprove: () => {
                window.location.reload();
            },
            countdownCompleteSub: null
        };
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['companyId']) {
            this.rebuildMainLoader();
        }
    }

    ngOnInit() {
        this.rebuildMainLoader();
    }

    private rebuildMainLoader(): void {
        if (this.companyId && !this.isAccountant) {
            // debugger;
            const companyUserDefinedTokens = this.tokenService
                .companyTokensGetStatus(
                    this.userService.appData.userData.accountant,
                    TokenType.ACCOUNT,
                    {uuid: this.companyId}
                )
                .pipe(map((rslt) => rslt.filter((tknResp) => !tknResp.isFromAccount)));

            this.tokenStatusLoad$ = combineLatest(
           [
               companyUserDefinedTokens,
               timer(0, 5000)
           ]
            ).pipe(
                switchMap(([tokensLoaded, timerIdx]) => {
                    const tokensToPoll = tokensLoaded.filter((tknStat) =>
                        this.tokenService.isTokenStatusProgressing(tknStat.tokenStatus)
                    );
                    const tokensNotToPoll = tokensLoaded.filter(
                        (tknStat) =>
                            !this.tokenService.isTokenStatusProgressing(tknStat.tokenStatus)
                    );
                    return combineLatest(
                   [
                       tokensToPoll.length > 0
                           ? timerIdx === 0
                               ? of(tokensToPoll)
                               : this.tokenService.tokenGetStatus({
                                   companyId: this.companyId,
                                   tokens: tokensToPoll.map((tknStat) => tknStat.token)
                               })
                           : of([]),
                       of(tokensNotToPoll)
                   ]
                    );
                }),
                map((x: TokenStatusResponse[][]) => {
                    return x.reduce((merged, tknStatuses) => {
                        if (tknStatuses && tknStatuses.length) {
                            merged = merged.concat(...tknStatuses);
                        }
                        return merged;
                    }, []);
                    // return [...polledStatuses, ...notPolledStatuses];
                }),
                publishRef, // shareReplay(1)
                takeWhileInclusive((rslts) =>
                    rslts.some((rslt) =>
                        this.tokenService.isTokenStatusProgressing(rslt.tokenStatus)
                    )
                )
            );

            this.statusToShow$ = this.tokenStatusLoad$.pipe(
                map((rslts) => this.statusToShow(rslts))
            );

            this.exampleCompanyPoll$ = timer(0, 5000).pipe(
                switchMap(() => this.restCommonService.getAccounts(this.companyId)),
                map((rslt) => rslt.body),
                // filter(rslt => !rslt.exampleCompany),
                publishRef, // shareReplay(1)
                takeWhileInclusive((rslt) => rslt.exampleCompany === true)
            );
        }
    }

    statusToShow(
        tokenStatuses: TokenStatusResponse[]
    ): TokenStatusResponse | null {
        // debugger;
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

    tokenAdded(): void {
        this.rebuildMainLoader();
    }

    onUpdatePasswordClick() {
        this.updatePromptVisible = true;
    }

    onUpdateDialogVisibilityChange(state: DialogState) {
        if (state === DialogState.UPDATE_SUCCEEDED) {
            this.rebuildMainLoader();
        }
    }
}
