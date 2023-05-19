import {Injectable} from '@angular/core';
import {InterfaceParamHttp} from '../interfaces/interface.param.http';
import {defer, Observable} from 'rxjs';
import {UserService} from '@app/core/user.service';
import {HttpServices} from './http.services';
import {EditingType} from '../component/movement-editor/enums';
import {map} from 'rxjs/operators';
import {SearchkeyCategory} from './shared.service';
import {publishRef} from '../functions/publishRef';

@Injectable()
export class RestCommonService {
    constructor(
        public userService: UserService,
        public httpServices: HttpServices
    ) {
    }

    defineSearchKey(param: {
        transTypeId: string;
        companyId: string;
        kvua: any;
        bankTransId: string;
        ccardTransId: string;
        searchkeyId: string;
        updateType: string;
    }): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/searchkey/define-searchkey',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getSearchkeyCat(): Observable<any> {
        const companiesParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/searchkey/searchkey-cat',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(companiesParam);
    }

    public readonly searchkeyCategories$: Observable<Array<SearchkeyCategory>> =
        defer(() => this.getSearchkeyCat()).pipe(
            map((rslt) => rslt.body),
            publishRef
        );
    public readonly paymentTypesTranslateSelectable$: Observable<Array<{ [k: string]: string }>> = this.searchkeyCategories$.pipe(
        map((skcs) => {
            const skcsAsDropdownItems = skcs
                .filter((skc) => skc.showInDrop)
                .map((skc) => {
                    return {
                        label: skc.name,
                        value: skc.paymentDescription
                    };
                });
            skcsAsDropdownItems.sort((a, b) => {
                if (a.value === 'Other') {
                    return 1;
                }
                if (b.value === 'Other') {
                    return -1;
                }
                const lblA = a.label,
                    lblB = b.label;
                return lblA || lblB
                    ? !lblA
                        ? 1
                        : !lblB
                            ? -1
                            : lblA.localeCompare(lblB)
                    : 0;
            });
            return skcsAsDropdownItems;
        }),
        publishRef
    );

    transPerDayCashFlow(paramsObj: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/cash-flow/trans-per-day',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCyclicTransHistory(params: {
        targetType: string;
        transId: string;
    }): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/history',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getRecommendationTransHistory(params: {
        bankTransIds: string[];
        companyAccountId: string;
        biziboxMutavId: string;
        mutavArray: Array<any>;
    }): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/recommendation/history',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    setDismissed(historyItem: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/dismissed',
            params: historyItem,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getAccounts(id: number | string): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path:
                'v1/account/' +
                (this.userService.appData.userData.accountant ? 'accountant' : 'cfl'),
            params: {
                uuid: id
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(accountsParam)
            .pipe(
                map((response: any) =>
                    !this.userService.appData.userData.accountant ||
                    !response ||
                    !!response.error
                        ? response
                        : {body: {accounts: response.body}}
                )
            );
    }

    loanDetails(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/over-view/${
                this.userService.appData.userData.accountant ? 'accountant' : 'cfl'
            }/loan-details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getRecommendation(request: {
        companyAccountId: any;
        dateFrom: Date;
        dateTill: Date;
        total: string;
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/payments/cfl/recommendation',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    sendActivationMails(): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/send-activation-mail',
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getCheckDetail(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path:
                'v1/account/' +
                (this.userService.appData.userData.accountant ? 'accountant' : 'cfl') +
                '/check-details',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    updateCheckCategory(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/update-check-category',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getPerutBankdetail(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path:
                'v1/account/' +
                (this.userService.appData.userData.accountant ? 'accountant' : 'cfl') +
                '/perut-bank-detail',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getUnionBankdetail(param: {
        companyId: any;
        transId: string;
        dateFrom: number /* originalDate: number */;
    }): Observable<any> {
        return this.httpServices.sendHttp<any>({
            method: 'post',
            path: 'v1/account/cfl/cash-flow/get-union-bankdetail',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        });
    }

    checkMailExists(params: any): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/mail-check',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    mailValidation(params: any): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/mail-validation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    mailValidationCfl(params: any): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cfl/mail-validation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    isExistsHp(officeHp: string): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'get',
            path: `v1/office/is-exists/${officeHp}`,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    updateUserMail(params: any): Observable<any> {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/mail-update',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    deleteLoanAndDeposit(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/over-view/cfl/delete-row-${request.url}`,
            params: request.params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    deleteOperation(request: {
        editType: any;
        operationType: string;
        params: { companyAccountId: string; transId: string; dateFrom: number };
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: [
                'v1',
                request.editType === EditingType.Series ? 'cyclic-trans' : 'payments',
                'cfl',
                request.operationType,
                'delete'
            ].join('/'),
            params: request.params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }
}
