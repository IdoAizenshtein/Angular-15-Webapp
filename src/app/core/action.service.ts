import {Injectable} from '@angular/core';
import {Message} from './messages.service';
import {Router} from '@angular/router';
import {EMPTY, ReplaySubject, Subject} from 'rxjs';
import {CustomPreset, Preset} from '@app/shared/component/date-range-selectors/presets';
import {HttpServices} from '@app/shared/services/http.services';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {switchMap, take} from 'rxjs/operators';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers/customers.component';
import {TokenService, TokenStatusResponse} from './token.service';
import {
    CyclicTransactionInput
} from '@app/shared/component/cyclic-transaction-history/cyclic-transaction-history.component';
import {UserService} from './user.service';
import {TranslateService} from '@ngx-translate/core';

@Injectable()
export class ActionService {
    public readonly navigateToBankAccountDetails$: Subject<{
        accountId: string;
        preset: Preset;
        query?: string;
    }> = new ReplaySubject(1, 500);

    public readonly navigateToTazrimFixed$: Subject<{
        accountId: string;
        transId?: string;
        targetType?: string;
        query?: string;
        action?: 'history' | 'remove' | 'update';
    }> = new ReplaySubject(1, 500);

    public readonly showupTokenUpdateDialog$: Subject<{
        visible: boolean;
        companyId: string;
        tokenData: TokenStatusResponse;
    }> = new ReplaySubject(1, 500);

    public readonly showupTransactionHistoryDialog$: Subject<{
        visible: boolean;
        trns: CyclicTransactionInput;
    }> = new ReplaySubject(1, 500);

    public readonly navigateToSlikaGraph$: Subject<{
        companyAccountId: string;
        preset: Preset;
        tokenId: string;
    }> = new ReplaySubject(1, 500);

    private navigateToBudget: Subject<{
        companyAccountId: string;
        preset: string;
        budgetId: any;
        keyId: any;
    }> = new Subject<any>();

    public showupEditMovementDataDialog: Subject<any> = new Subject();

    navigateToBudget$ = this.navigateToBudget.asObservable();

    private navigateToCheck: Subject<{
        companyAccountId: string;
        preset: any;
    }> = new Subject<any>();
    navigateToCheck$ = this.navigateToCheck.asObservable();

    private navigateToCashFlow: Subject<{
        companyAccountId: string;
        preset: string;
    }> = new Subject<any>();
    navigateToCashFlow$ = this.navigateToCashFlow.asObservable();

    public isAfterDidAction: Subject<any> = new Subject();
    public isAfterDidAction$ = this.isAfterDidAction.asObservable();

    public readonly showupTransactionDeleteDialog$: Subject<{
        visible: boolean;
        item: any;
        transName: any;
        type: string;
        title: string;
    }> = new ReplaySubject(1, 500);

    constructor(
        private router: Router,
        private httpServices: HttpServices,
        private tokenService: TokenService,
        public userService: UserService,
        public translate: TranslateService
    ) {
    }

    doUsingMessage(
        action: string,
        params: Message,
        sharedComponent: SharedComponent
    ): void {
        if (
            this.userService.appData.userData.companySelect.budgetPopUpType === 3 &&
            (params.keyType === 'BUDGET' || params.keyType === 'BUDGET_DETAILS')
        ) {
            sharedComponent.budgetPopUpType.visible = 5;
            this.isAfterDidAction.next(true);
        } else {
            switch (action) {
                case 'bankaccountByAccount':
                    this.navigateToBankAccountDetails({
                        accountId:
                            !params || !params.companyAccountId
                                ? null
                                : params.companyAccountId
                    });
                    break;
                case 'bankaccountBySearchword':
                    this.navigateToBankAccountDetails({
                        accountId:
                            !params || !params.companyAccountId
                                ? null
                                : params.companyAccountId,
                        query: params && params.linked_text
                    });
                    break;
                case 'goToCyclicTrans':
                    this.navigateToTazrimFixed({
                        accountId:
                            !params || !params.companyAccountId
                                ? null
                                : params.companyAccountId,
                        query: params && params.linked_text
                    });
                    break;
                case 'regulatePayment':
                    this.router
                        .navigate(
                            [
                                !this.userService.appData.userData.accountant
                                    ? '/cfl/billing'
                                    : '/accountants/companies/billing'
                            ],
                            {
                                queryParamsHandling: 'preserve'
                            }
                        )
                        .then(() => {
                            this.isAfterDidAction.next(true);
                        });
                    break;
                case 'getTransHistory':
                    this.openTransactionHistoryDialogFor({
                        // companyId: sharedComponent.userService.appData.userData.companySelect.companyId,
                        companyAccountId: params.companyAccountId,
                        targetType: params && params.keyType,
                        transId: params && params.keyId
                    });
                    // this.navigateToTazrimFixed({
                    //     accountId: !params || !params.companyAccountId ? null : params.companyAccountId,
                    //     query: params && params.linked_text,
                    //     targetType: params && params.keyType,
                    //     transId: params && params.keyId,
                    //     action: 'history'
                    // });
                    break;
                case 'removeAlert':
                    this.navigateToTazrimFixed({
                        accountId:
                            !params || !params.companyAccountId
                                ? null
                                : params.companyAccountId,
                        transId: params && params.keyId,
                        action: 'remove'
                    });
                    break;
                case 'updateTransaction':
                    this.navigateToTazrimFixed({
                        accountId:
                            !params || !params.companyAccountId
                                ? null
                                : params.companyAccountId,
                        transId: params && params.keyId,
                        action: 'update'
                    });
                    break;
                case 'averageThreeMonths':
                    this.updateTransactionAutoUpdateType({
                        companyAccountId: params.companyAccountId,
                        targetType: params && params.keyType,
                        transId: params && params.keyId
                    });
                    break;
                case 'openTicket':
                    sharedComponent.showOpenTicket();
                    this.isAfterDidAction.next(true);
                    break;
                case 'tokenAlert':
                    this.sendTokenAlertWith({
                        indAlert: 0,
                        tokenIds: [params && params.keyId]
                    });
                    break;
                case 'openPasswordPopup':
                    this.openTokenUpdateDialogFor({
                        companyId:
                        sharedComponent.userService.appData.userData.companySelect
                            .companyId,
                        tokenId: params && params.keyId
                    });
                    break;
                case 'returnTrans':
                    this.sendReturnTransactionWith(params && params.keyType, {
                        companyAccountId: params && params.companyAccountId,
                        transId: params && params.keyId
                    });
                    break;
                case 'taryaPopup':
                    if (sharedComponent) {
                        sharedComponent.tryToShowTaryaPopup();
                        this.isAfterDidAction.next(true);
                    }
                    break;
                case 'loanDetails':
                    if (sharedComponent) {
                        sharedComponent.showLoanDetailsPopupWith({
                            companyAccountId: params && params.companyAccountId,
                            loanId: params && params.keyId
                        });
                        this.isAfterDidAction.next(true);
                    }
                    break;
                case 'SlikaTwoMonths': {
                    const endOfCurrentMonthMmnt = this.userService.appData
                        .moment()
                        .endOf('month')
                        .endOf('day');
                    this.navigateToSlikaGraph({
                        companyAccountId: params && params.companyAccountId,
                        tokenId: params && params.keyId,
                        preset: CustomPreset.createDatesPreset(
                            this.userService.appData
                                .moment(endOfCurrentMonthMmnt)
                                .startOf('month')
                                .subtract(2, 'months')
                                .startOf('day')
                                .toDate(),
                            endOfCurrentMonthMmnt.toDate()
                        )
                    });
                    break;
                }
                case 'paymentDelete': {
                    this.showupTransactionDeleteDialog$.next({
                        visible: true,
                        item: params,
                        transName: null,
                        type: 'multi',
                        title: this.translate.instant('actions.deleteMovement.titleMulti')
                    });
                    this.isAfterDidAction.next(true);
                    break;
                }
                case 'SlikaThirteenMonths': {
                    const endOfCurrentMonthMmnt = this.userService.appData
                        .moment()
                        .endOf('month')
                        .endOf('day');
                    this.navigateToSlikaGraph({
                        companyAccountId: params && params.companyAccountId,
                        tokenId: params && params.keyId,
                        preset: CustomPreset.createDatesPreset(
                            this.userService.appData
                                .moment(endOfCurrentMonthMmnt)
                                .startOf('month')
                                .subtract(13, 'months')
                                .startOf('day')
                                .toDate(),
                            endOfCurrentMonthMmnt.toDate()
                        )
                    });
                    break;
                }

                case 'budgetScreen':
                case 'updateBudget':
                case 'showKeyInBudget':
                case 'openKeyHistory':
                case 'openKeyMonthHistory':
                    this.navigateToBudgetScreen({
                        companyAccountId: params && params.companyAccountId,
                        budgetId: params && params['budgetId'],
                        keyId: params && params.keyId,
                        preset: action
                    });
                    break;

                case 'goToAccountSettings': {
                    this.router
                        .navigate(
                            [
                                !this.userService.appData.userData.accountant
                                    ? '/cfl/settings/bankAccounts'
                                    : '/accountants/companies/settings/bankAccounts'
                            ],
                            {
                                queryParamsHandling: 'preserve'
                            }
                        )
                        .then(() => {
                            this.isAfterDidAction.next(true);
                        });
                    break;
                }

                case 'showCheckDetails':
                case 'updateNonCyclicTransaction':
                case 'updateTazrimTransaction': {
                    this.isAfterDidAction.next(true);
                    break;
                }

                case 'showCheqimLemishmeret':
                case 'showCheqimLenicaion':
                    this.navigateToCheckScreen({
                        companyAccountId: params && params.companyAccountId,
                        preset: action
                    });
                    break;

                case 'showCashflowChecks':
                    this.navigateToCashFlowScreen({
                        companyAccountId: params && params.companyAccountId,
                        preset: action
                    });
                    break;

                default:
                    console.log(
                        'Has nothing to do with action: %o, message: %o',
                        action,
                        params
                    );
                    break;
            }
        }
    }

    private navigateToBankAccountDetails(navParams: {
        accountId: string;
        query?: string;
    }) {
        this.router
            .navigate(
                [
                    !this.userService.appData.userData.accountant
                        ? '/cfl/financialManagement/bankAccount/details'
                        : '/accountants/companies/financialManagement/bankAccount/details'
                ],
                {
                    queryParamsHandling: 'preserve'
                }
            )
            .then(() => {
                this.navigateToBankAccountDetails$.next(
                    Object.assign(
                        {
                            preset: new CustomPreset('last30Days')
                        },
                        navParams
                    )
                );
                this.isAfterDidAction.next(true);
            });
    }

    private navigateToTazrimFixed(navParams: {
        accountId: string;
        transId?: string;
        targetType?: string;
        query?: string;
        action?: 'history' | 'remove' | 'update';
    }) {
        this.router
            .navigate(
                [
                    !this.userService.appData.userData.accountant
                        ? '/cfl/cash-flow/fixedMovements/details'
                        : '/accountants/companies/cash-flow/fixedMovements/details'
                ],
                {
                    queryParamsHandling: 'preserve'
                }
            )
            .then(() => {
                this.navigateToTazrimFixed$.next(navParams);
                this.isAfterDidAction.next(true);
            });
    }

    private updateTransactionAutoUpdateType(param: {
        companyAccountId: string;
        transId: string;
        targetType: string;
    }) {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/cyclic-trans/cfl/single`,
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        this.httpServices
            .sendHttp<any>(params)
            .pipe(
                // filter(resp => resp && !resp.error),
                switchMap((resp) => {
                    if (
                        !resp ||
                        !resp.error ||
                        !Array.isArray(resp.body.transes) ||
                        !resp.body.transes.length
                    ) {
                        return EMPTY;
                    }
                    resp.autoUpdateTypeName = 'AVG_3_MONTHS';
                    const paramsUpd: InterfaceParamHttp<any> = {
                        method: 'post',
                        path: `v1/cyclic-trans/cfl/${param.targetType}/update`,
                        params: resp,
                        isJson: true,
                        isProtected: true,
                        isAuthorization: true
                    };
                    return this.httpServices.sendHttp<any>(paramsUpd);
                }),
                take(1)
            )
            .subscribe(() => {
                this.isAfterDidAction.next(true);
            });
    }

    private sendTokenAlertWith(param: { tokenIds: any; indAlert: number }) {
        if (
            !param ||
            !param.tokenIds ||
            (!param.tokenIds && param.tokenIds.length)
        ) {
            console.log('action sendTokenAlertWith has nothing to do with %o', param);
            this.isAfterDidAction.next(true);
            return;
        }
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/messages/cfl/token-alert`,
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        this.httpServices
            .sendHttp<any>(params)
            .pipe(take(1))
            .subscribe(() => {
                this.isAfterDidAction.next(true);
            });
    }

    private openTokenUpdateDialogFor(param: { companyId: any; tokenId: string }) {
        if (!param || !param.companyId || !param.tokenId) {
            console.log(
                'action openTokenUpdateDialogFor has nothing to do with %o',
                param
            );
            this.isAfterDidAction.next(true);
            return;
        }
        this.tokenService
            .tokenGetStatus({
                companyId: param.companyId,
                tokens: [param.tokenId]
            })
            .pipe(take(1))
            .subscribe((response: any) => {
                if (response && response.length) {
                    this.showupTokenUpdateDialog$.next({
                        visible: true,
                        companyId: param.companyId,
                        tokenData: response[0]
                    });
                    this.isAfterDidAction.next(true);
                }
            });
    }

    private sendReturnTransactionWith(
        operationType: string,
        param: { companyAccountId: string; transId: string }
    ) {
        if (!operationType || !param || !param.companyAccountId || !param.transId) {
            console.log(
                'action sendReturnTransactionWith has nothing to do with operationType: %o, param: %o',
                operationType,
                param
            );
            this.isAfterDidAction.next(true);
            return;
        }
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/cyclic-trans/cfl/${operationType}/return`,
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        this.httpServices
            .sendHttp<any>(params)
            .pipe(take(1))
            .subscribe(() => {
                this.isAfterDidAction.next(true);
            });
    }

    private openTransactionHistoryDialogFor(param: {
        // companyId: string,
        companyAccountId: string;
        transId: string;
        targetType: string;
    }) {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/cyclic-trans/cfl/single`,
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        this.httpServices
            .sendHttp<any>(params)
            .pipe(take(1))
            .subscribe((response: any) => {
                if (
                    response &&
                    !response.error &&
                    Array.isArray(response.body.transes) &&
                    response.body.transes.length
                ) {
                    this.showupTransactionHistoryDialog$.next({
                        visible: true,
                        trns: response.body.transes[0]
                    });
                    this.isAfterDidAction.next(true);
                }
            });
    }

    private navigateToSlikaGraph(navParams: {
        companyAccountId: string;
        tokenId: string;
        preset: Preset;
    }) {
        // this.storageService.sessionStorageSetter(DateRangeSelectorBaseComponent.storageKey(this.route, 'details'),
        //     JSON.stringify(CustomPreset.createDatesPreset(param.dateFrom, param.dateTill))
        // );
        // this.storageService.sessionStorageSetter('slika/*-filterSolkim',
        //     JSON.stringify([solek.companyAccountId + solek.solekNum]));
        this.router
            .navigate(
                [
                    !this.userService.appData.userData.accountant
                        ? '/cfl/financialManagement/slika/graph'
                        : '/accountants/companies/financialManagement/slika/graph'
                ],
                {
                    queryParamsHandling: 'preserve'
                }
            )
            .then(() => {
                this.navigateToSlikaGraph$.next(navParams);
                this.isAfterDidAction.next(true);
            });
    }

    private navigateToBudgetScreen(navParams: {
        companyAccountId: string;
        budgetId: any;
        preset: string;
        keyId: any;
    }) {
        this.router
            .navigate(
                [
                    !this.userService.appData.userData.accountant
                        ? '/cfl/budget'
                        : '/accountants/companies/budget'
                ],
                {
                    queryParamsHandling: 'preserve'
                }
            )
            .then(() => {
                this.navigateToBudget.next(navParams);
                this.isAfterDidAction.next(true);
            });
    }

    private navigateToCheckScreen(navParams: {
        companyAccountId: string;
        preset: any;
    }) {
        this.router
            .navigate(
                [
                    !this.userService.appData.userData.accountant
                        ? '/cfl/financialManagement/checks/in-checks'
                        : '/accountants/companies/financialManagement/checks/in-checks'
                ],
                {
                    queryParamsHandling: 'preserve'
                }
            )
            .then(() => {
                this.navigateToCheck.next(navParams);
                this.isAfterDidAction.next(true);
            });
    }

    private navigateToCashFlowScreen(navParams: {
        companyAccountId: string;
        preset: any;
    }) {
        this.router
            .navigate(
                [
                    !this.userService.appData.userData.accountant
                        ? '/cfl/cash-flow/daily/details'
                        : '/accountants/companies/cash-flow/daily/details'
                ],
                {
                    queryParamsHandling: 'preserve'
                }
            )
            .then(() => {
                this.navigateToCashFlow.next(navParams);
                this.isAfterDidAction.next(true);
            });
    }
}
