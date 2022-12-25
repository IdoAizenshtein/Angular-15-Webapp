/* tslint:disable:max-line-length */
import {Injectable, OnDestroy} from '@angular/core';
import {InterfaceParamHttp} from '../interfaces/interface.param.http';
import {combineLatest, defer, Observable, of, Subject} from 'rxjs';
import {map, shareReplay, tap} from 'rxjs/operators';
import {UserService} from '@app/core/user.service';
import {HttpServices} from './http.services';
import {EditingType} from '../component/movement-editor/enums';
import {WeekDay} from '@angular/common';
import {SelectItem} from 'primeng/api';
import {publishRef} from '../functions/publishRef';

@Injectable()
export class SharedService implements OnDestroy {
    constructor(
        public userService: UserService,
        public httpServices: HttpServices
    ) {
    }

    companyCustomerDetails$: any | null;
    companyCustomerDetailsExport$: any | null;

    private missionAnnouncedSource: Subject<string> = new Subject<string>();
    missionAnnounced$ = this.missionAnnouncedSource.asObservable();

    private missionStartBusinessTrialOpen: Subject<string> =
        new Subject<string>();
    missionStartBusinessTrialOpen$ =
        this.missionStartBusinessTrialOpen.asObservable();

    public transTypeChangeEvent: Subject<any> = new Subject();

    public readonly companyGetCustomer$: Observable<Array<any>> = defer(() =>
        this.companyGetCustomer({
            companyId: this.userService.appData.userData.companySelect.companyId,
            sourceProgramId:
            this.userService.appData.userData.companySelect.sourceProgramId
        })
    ).pipe(
        map((rslt: any) => rslt.body),
        publishRef
    );

    public readonly cities$: Observable<Array<any>> = defer(() =>
        this.getCities()
    ).pipe(
        map((rslt: any) => rslt.body),
        publishRef
    );
    public readonly accountantOfficeDetails$: Observable<Array<any>> = defer(() =>
        this.getOfficeDetails()
    ).pipe(
        map((rslt: any) => rslt.body),
        publishRef
    );
    public readonly businessCategory$: Observable<Array<any>> = defer(() =>
        this.getBusinessCategory()
    ).pipe(
        map((rslt: any) => rslt.body),
        publishRef
    );

    public readonly snifMaam$: Observable<Array<any>> = defer(() =>
        this.getSnifMaam()
    ).pipe(
        map((rslt: any) => rslt.body),
        publishRef
    );

    public readonly assessor$: Observable<Array<any>> = defer(() =>
        this.getAssessor()
    ).pipe(
        map((rslt: any) => rslt.body),
        publishRef
    );

    public readonly searchkeyCategories$: Observable<Array<SearchkeyCategory>> =
        defer(() => this.getSearchkeyCat()).pipe(
            map((rslt: any) => rslt.body),
            publishRef
        );

    public readonly paymentTypesTranslate$: Observable<{ [k: string]: string }> =
        this.searchkeyCategories$.pipe(
            map((rslt) => {
                return rslt.reduce((acltr, skc) => {
                    acltr[skc.paymentDescription] = skc.name;
                    return acltr;
                }, Object.create(null));
            }),
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

    announceMissionGetCompanies(mission: string) {
        this.missionAnnouncedSource.next(mission);
    }

    startBusinessTrialOpen() {
        this.missionStartBusinessTrialOpen.next('');
    }

    getCompanies(): any {
        if (this.userService.appData.userData.companies) {
            return of(this.userService.appData.userData.companies);
        } else {
            const companiesParam: InterfaceParamHttp<any> = {
                method: 'get',
                path: 'v1/companies',
                isProtected: true,
                isAuthorization: true
            };
            return this.httpServices.sendHttp<any>(companiesParam);
        }
    }

    getCompany(id: number | string): any {
        return this.getCompanies().pipe(
            map((companies) => this.getResCompany(id, companies))
        );
    }

    getResCompany(id: number | string, companies: any): any {
        if (companies && companies.body) {
            companies = companies.body;
        }
        if (Number.isNaN(+id)) {
            return companies.find((company) => company.companyId === id);
        } else {
            return companies.find((company) => company.companyHp === +id);
        }
    }

    getAccounts(id: number | string): any {
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

    getMessages(id: number | string): any {
        const countParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/messages/cfl/count',
            params: {
                uuid: id
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(countParam);
    }

    getBankTrans(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/bank-trans',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getBankTransPeulotToday(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/bank-trans-peulot-today',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getBankTransPerDay(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/bank-trans/trans-per-day',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    bankTransRowUpdate(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/bank-trans-row-update',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getBankTransAggregate(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/bank-trans/aggregate',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getBankTransGraphItrot(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/bank-trans/graph-itrot',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getGraphZhutHova(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/bank-trans/graph-zhut-hova',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getPerutBankdetail(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/account/${
                this.userService.appData.userData.accountant ? 'accountant' : 'cfl'
            }/perut-bank-detail`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCheckDetail(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/account/${
                this.userService.appData.userData.accountant ? 'accountant' : 'cfl'
            }/check-details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    // getTransTypes(id: number | string): any {
    //     const params: InterfaceParamHttp<any> = {
    //         method: 'post',
    //         path: 'v1/account/cfl/trans-type',
    //         params: {
    //             'uuid': id
    //         },
    //         isJson: true,
    //         isProtected: true,
    //         isAuthorization: true
    //     };
    //     return this.httpServices.sendHttp<any>(params)
    //         .pipe(
    //             map(rslt => {
    //                 if (!rslt || rslt.error) {
    //                     return [];
    //                 }
    //
    //                 const transTypes = rslt.body;
    //                 transTypes.filter(transType => transType.companyId === '00000000-0000-0000-0000-000000000000')
    //                     .forEach(transtType => transtType.immutable = true);
    //
    //                 return transTypes;
    //             })
    //         );
    // }
    //
    // transTypeCreate(paramsObj: any): any {
    //     const params: InterfaceParamHttp<any> = {
    //         method: 'post',
    //         path: 'v1/account/cfl/trans-type-create',
    //         params: paramsObj,
    //         isJson: true,
    //         isProtected: true,
    //         isAuthorization: true
    //     };
    //     return this.httpServices.sendHttp<any>(params)
    //         .pipe(
    //             tap(() => {
    //                 this.transTypeChangeEvent.next({
    //                     type: 'create',
    //                     value: paramsObj
    //                 });
    //             })
    //         );
    // }
    //
    // transTypeDelete(paramsObj: any): any {
    //     const params: InterfaceParamHttp<any> = {
    //         method: 'post',
    //         path: 'v1/account/cfl/trans-type-delete',
    //         params: paramsObj,
    //         isJson: true,
    //         isProtected: true,
    //         isAuthorization: true
    //     };
    //     return this.httpServices.sendHttp<any>(params)
    //         .pipe(
    //             tap(() => {
    //                 this.transTypeChangeEvent.next({
    //                     type: 'delete',
    //                     value: paramsObj
    //                 });
    //             })
    //         );
    // }
    //
    // transTypeUpdate(paramsObj: any): any {
    //     const params: InterfaceParamHttp<any> = {
    //         method: 'post',
    //         path: 'v1/account/cfl/trans-type-update',
    //         params: paramsObj,
    //         isJson: true,
    //         isProtected: true,
    //         isAuthorization: true
    //     };
    //     return this.httpServices.sendHttp<any>(params)
    //         .pipe(
    //             tap(() => {
    //                 this.transTypeChangeEvent.next({
    //                     type: 'change',
    //                     value: paramsObj
    //                 });
    //             })
    //         );
    // }
    //
    // getTransTypesNotFiltered(id: number | string): any {
    //     const params: InterfaceParamHttp<any> = {
    //         method: 'post',
    //         path: 'v1/account/cfl/trans-type',
    //         params: {
    //             'uuid': id
    //         },
    //         isJson: true,
    //         isProtected: true,
    //         isAuthorization: true
    //     };
    //     return this.httpServices.sendHttp<any>(params)
    //         .pipe(
    //             map(rslt => {
    //                 const transTypes = rslt.body;
    //
    //                 transTypes.filter(transType => transType.companyId === '00000000-0000-0000-0000-000000000000')
    //                     .forEach(transtType => transtType.immutable = true);
    //
    //                 return transTypes;
    //             })
    //         );
    // }

    ngOnDestroy(): void {
        this.transTypeChangeEvent.complete();
    }

    getCreditCardDetails(ids: number | string | any): any {
        if (
            this.userService.appData.userData.accountant &&
            this.userService.appData.userData.companySelect &&
            !!this.userService.appData.userData.companySelect &&
            !!this.userService.appData.userData.companySelect.companyId
        ) {
            return this.getCreditCardsAccountant(
                this.userService.appData.userData.companySelect.companyId
            );
        }
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl',
            /*
                        path: 'v1/credit-card/' + (this.userService.appData.userData.accountant ? 'accountant' : 'cfl'),
            */
            params: ids,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getCreditCardsAccountant(companyId: string): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/accountant',
            params: {uuid: companyId},
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    countStatusBank(ids: number | string | any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/count-status',
            params: {
                uuids: [ids]
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getCreditCardTazrimSummary(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/sum',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCreditCardTransactionDetails(paramsObj: any): any {
        if (paramsObj.creditCardIds) {
            const accountsParam: InterfaceParamHttp<any> = {
                method: 'post',
                path: 'v1/credit-card/cfl/details',
                params: paramsObj,
                isJson: true,
                isProtected: true,
                isAuthorization: true
            };
            return this.httpServices.sendHttp<any>(accountsParam);
        } else {
            return of([]);
        }
    }

    ccardTransRowUpdate(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/card-trans-row-update',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCreditCardTazrimGraph(paramsObj: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/graph',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    updateCreditCard(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/update',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    updateIzuCustCreditCard(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/accountant/update-izu-cust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getSlikaCfl(ids: number | string): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl',
            params: ids,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getSlikaSummary(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl/sum',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getSlikaDetails(paramsObj: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl/details',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getSlikaGraph(paramsObj: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl/graph',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getInChecks(paramsObj: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/checks/cfl/in-checks',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getOutChecks(paramsObj: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/checks/cfl/out-checks',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    updateCheckRow(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/payments/cfl/payment-row-update/check',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    deleteCheckRow(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/payments/cfl/CHEQUE/delete',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }
    recoveryChecks(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/checks/cfl/recovery-checks',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }
    aggregateCashFlow(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/cash-flow/aggregate',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    transPerDayCashFlow(paramsObj: any): any {
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

    paymentCreate(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/payments/cfl/create',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    transTypeHistory(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/trans-type-history',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    cashFlowDetails(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/cash-flow/details',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    updateOperation(request: any): any {
        if (request.operationType === 'BANK_TRANS') {
            return this.bankTransRowUpdate(request.params);
        }
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            // path: `v1/payments/cfl/${request.operationType}/update`,
            path: [
                'v1',
                request.editType === EditingType.Series ? 'cyclic-trans' : 'payments',
                'cfl',
                request.operationType,
                'update'
            ].join('/'),
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
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: [
                'v1',
                request.editType === EditingType.Series ? 'cyclic-trans' : 'payments',
                'cfl',
                request.operationType,
                'delete'
            ].join('/'),
            // path: `v1/payments/cfl/${request.operationType}/delete`,
            params: request.params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getBankMatchAccount(paramsObj: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/bank-match-account',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCyclicTransactions(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getCyclicTransactionsRecommendations(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/recommendations',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    existingCheck(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/checks/cfl/existing-cheque',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    createCyclicTransaction(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/create',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    bankMatchRestart(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/match-restart',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    banktransForMatch(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/banktrans-for-match',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    bankMatchDelete(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/bank-delete',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    cashflowMatch(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/cashflow-match',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getMatchedTrans(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/matched-trans',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    setApart(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/set-apart-matched',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    bankMatch(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/cfl/match',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getUserSettings(): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/users/settings',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    officeUsersCount(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            path: 'v1/users/office-users-count',
            method: 'get',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getOfficeUsers(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            path: 'v1/users/get-office-users',
            method: 'get',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getOfficeCompanies(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            path: 'v1/companies/get-office-companies',
            method: 'get',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    updateUserDetails(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/update-user-details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    changeOfficePriv(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/priv/change-office-priv',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    setCompanyPrivs(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/priv/set-company-privs',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    companyPrivsSwap(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/priv/company-privs-swap',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    userFreeze(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/user-freeze',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    officeUserDelete(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/office-user-delete',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    createNewOfficeUser(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/create-new-office-user',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    userRestore(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/user-restore',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    userFreezePopup(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/user-freeze-popup',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    updateUser(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/update',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    sendSms(): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/auth/otp/send-sms',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    turnOnTwoPhaseForUser(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/two-factor/on',
            isHeaderAuth: params,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    turnOffTwoPhaseForUser(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/two-factor/off',
            isHeaderAuth: params,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    checkMailExists(params: any): any {
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

    updateUserMail(params: any): any {
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

    updateCyclicTransaction(
        type: EditingType,
        targetType: string,
        dataToSubmit: {
            autoUpdateTypeName: any;
            companyAccountId: any;
            companyId: string;
            paymentDesc: any;
            total: number;
            transDate: Date;
            expirationDate: Date;
            transFrequencyName: any;
            transName: any;
            transTypeId: any;
        }
    ): any {
        if (targetType === 'BANK_TRANS') {
            return this.bankTransRowUpdate(dataToSubmit);
        }
        if (dataToSubmit.transDate) {
            try {
                dataToSubmit.transDate = new Date(dataToSubmit.transDate);
            } catch (e) {
            }
        }
        if (
            targetType === 'CYCLIC_TRANS' &&
            type !== EditingType.Single &&
            ['MONTH', 'WEEK'].includes(dataToSubmit.transFrequencyName) &&
            dataToSubmit.transDate
        ) {
            if (dataToSubmit.transFrequencyName === 'WEEK') {
                dataToSubmit['frequencyDay'] = (
                    WeekDay[dataToSubmit.transDate.getDay()] as string
                ).toUpperCase();
            }
            if (dataToSubmit.transFrequencyName === 'MONTH') {
                dataToSubmit['frequencyDay'] = dataToSubmit.transDate.getDate();
            }
        }
        if (dataToSubmit.transFrequencyName === 'WEEK' && dataToSubmit.transDate) {
            dataToSubmit['frequencyDay'] = (
                WeekDay[dataToSubmit.transDate.getDay()] as string
            ).toUpperCase();
        }
        if (dataToSubmit.transFrequencyName === 'MONTH' && dataToSubmit.transDate) {
            dataToSubmit['frequencyDay'] = dataToSubmit.transDate.getDate();
        }
        if (targetType === 'CYCLIC_TRANS') {
            dataToSubmit['updateCyclicPast'] = this.userService.appData.updateCyclicPast;
        }
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: [
                'v1',
                type === EditingType.Single ? 'payments' : 'cyclic-trans',
                'cfl',
                targetType,
                'update'
            ].join('/'),
            params: dataToSubmit,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    getCyclicTransHistory(params: {
        targetType: string;
        transId: string;
    }): any {
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
    }): any {
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

    financialData(params: any): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/over-view/cfl/financial-data',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    updateOperationAggregate(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/account/${request.operationType}/aggregate`,
            params: request.params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    recommendationApprove(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/recommendation-approve',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cyclicTransRestore(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/restore',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    recommendationRemove(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/cyclic-trans/cfl/recommendation/remove',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    userTicketCreate(param: {
        body: any;
        companyName: any | string;
        screenName: string;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/create-ticket',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteCyclicTransaction(
        targetType: string,
        request: {
            companyAccountId: string;
            transId: string;
        }
    ): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/cyclic-trans/cfl/${targetType}/delete`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCyclicTransactionSingle(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/cyclic-trans/cfl/single`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    updateSingleTransactionFromBankMatch(targetType: any, dataToSubmit: any) {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: ['v1', 'payments', 'cfl', targetType, 'update-from-bankmatch'].join(
                '/'
            ),
            params: dataToSubmit,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    loanDetails(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/over-view/cfl/loan-details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    depositDetails(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/over-view/cfl/deposit-details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    deleteLoanAndDeposit(request: any): any {
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

    // getTokenStatus(token: string): any {
    //     const accountsParam: InterfaceParamHttp<any> = {
    //         method: 'post',
    //         path: 'v1/token/cfl/get-status',
    //         params: {
    //             token: token
    //         },
    //         isJson: true,
    //         isProtected: true,
    //         isAuthorization: true
    //     };
    //     return this.httpServices.sendHttp<any>(accountsParam);
    // }

    accountSetPrimary(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/account/cfl/account-set-primary`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getMaazan(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/maazan-getlist`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    supplierUpdateType(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/supplier-update-type`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getRevachHefsed(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/profit-and-loss`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    sendActivationMails(): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/send-activation-mail',
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    updateCompany(request: any): any {
        if (request.companyId) {
            const params: InterfaceParamHttp<any> = {
                method: 'post',
                path: `v1/companies/update`,
                params: request,
                isJson: true,
                isProtected: true,
                isAuthorization: true
            };
            return this.httpServices.sendHttp<any>(params);
        } else {
            return of([]);
        }
    }

    updateAccountantDetails(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/office/update-accountant-details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCities(): any {
        const companiesParam: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/get-cities',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(companiesParam);
    }

    getOfficeDetails(): any {
        const param: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/office/accountant-details',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(param);
    }

    getBusinessCategory(): any {
        const companiesParam: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/get-business-category',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(companiesParam);
    }

    getSnifMaam(): any {
        const companiesParam: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/get-snif-maam',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(companiesParam);
    }

    getAssessor(): any {
        const companiesParam: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/get-assessor',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(companiesParam);
    }

    getDeletedAccounts(request: {
        companyId: string;
        tokenIds: string[];
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/get-deleted-account',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    setAccountNickname(request: {
        companyAccountId: string;
        nickName: string;
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/set-account-nickname',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    accountUndelete(request: {
        companyAccountId: string;
        tokenType: 'bank' | 'card' | 'solek';
        solekNum?: string | number;
    }): any {
        // debugger;
        if (request.tokenType === 'solek' && !request.solekNum) {
            throw new Error('solekNum is not provided.')
        }

        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/undeleted-account',
            params:
                request.tokenType === 'solek'
                    ? request
                    : (request as { companyAccountId; tokenType }),
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    accountDelete(companyAccountId: string, accountant?: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/accountant/account-delete', //'v1/account/cfl/account-delete',
            params: {
                uuid: companyAccountId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getDeletedCreditCards(request: {
        companyId: string;
        tokens: string[];
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/get-deleted-credit-card',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getDeletedSolkim(request: {
        companyId: string;
        tokens: string[];
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl/get-deleted-solek',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    updateSolekDesc(request: {
        companyAccountId: string;
        solekNum: number;
        solekDesc: string;
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl/set-solek-desc',
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
    }): any {
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

    graphBookKeeping(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/graph-data`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    detailsBookKeeping(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    aggregateBookKeeping(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/aggregate`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    netProfitBookKeeping(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/net-profit`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    grossProfitBookKeeping(request: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/book-keeping/cfl/gross-profit`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    createCompany(req: {
        businessCategory: string;
        companyHp: string;
        companyName: string;
    }): any {
        // debugger;
        const request = Object.assign(
            {
                esderMaam: 555, // hardcoded
                hesderId: 1, // hardcoded
                selfManaged: 1, // hardcoded
                sourceProgramId: null, // hardcoded
                defaultUserId: null // this.userService.appData.userData.userName
            },
            req
        );
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/companies/add`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(params)
            .pipe(map((rslt) => rslt.body));
    }

    getBillingAccounts(): any {
        const companiesParam: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/billing/get_user_billing_accounts',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(companiesParam);
    }

    getBillingAccountsDetails(request: {
        billingAccountId: string;
        companyIds: string[];
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/billing/billing-account-details',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getBillingPaymentsHistory(billingAccountId: string): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/billing/get-billing-history',
            params: {
                uuid: billingAccountId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCardcomClient(request: {
        billingAccountAddress: string;
        billingAccountCity: string;
        billingAccountCompanyName: string;
        billingAccountEmail: string;
        billingAccountHp: number;
        billingAccountId: string;
        billingAccountName: string;
        billingAccountPhone: string;
        companyId: string;
        leloMaam: boolean;
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/billing/get-cardcom-client',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(params);
    }

    updateBillingAccount(request: {
        billingAccountAddress: string;
        billingAccountCity: string;
        billingAccountCompanyName: string;
        billingAccountEmail: string;
        billingAccountHp: number;
        billingAccountId: string;
        billingAccountName: string;
        billingAccountPhone: string;
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/billing/update-billing-account',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    downloadBillingInvoice(request: {
        invoiceNumber: number;
        invoiceresponseInvoicetype: string;
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/billing/download-invoice',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'blob'
        };
        return this.httpServices.sendHttp<any>(params).pipe(
            tap((rslt) => {
                const blobOpts = {type: 'application/pdf'};
                const fileExt = '.pdf';
                const fileName = 'invoice_' + request.invoiceNumber;

                const blob = new Blob([rslt.body], blobOpts);
                const nav = (window.navigator as any);
                if (nav.msSaveOrOpenBlob) {
                    nav.msSaveBlob(blob, fileName + fileExt);
                } else {
                    const objectUrl = URL.createObjectURL(blob);
                    const a: HTMLAnchorElement = document.createElement(
                        'a'
                    ) as HTMLAnchorElement;
                    a.href = objectUrl;
                    a.download = fileName + fileExt;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(objectUrl);
                }
            })
        );
    }

    sendBillingInvoice(request: {
        emailAddress: string;
        invoiceNumber: number;
        invoiceresponseInvoicetype: string;
    }): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/billing/send-invoice-mail',
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getMessagesSettingsForCompany(companyId: number | string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/messages/cfl/user-setting',
            params: {
                uuid: companyId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    resetMessagesSettingsForCompany(companyId: number | string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/messages/cfl/user-setting-default',
            params: {
                uuid: companyId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateMessagesSettings(
        data: {
            enabled: boolean;
            messageTypeId: string;
            push: boolean;
        }[],
        companyId: string
    ): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/messages/cfl/user-setting-update',
            params: data.map((mt) =>
                Object.assign(
                    {
                        companyId: companyId
                    },
                    mt
                )
            ),
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };

        return this.httpServices.sendHttp<any>(request);
    }

    updateMessagesTimeToSendSettings(timeToSend: number): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/messages/cfl/user-time-to-send',
            params: {
                pushTimeToSend: timeToSend
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };

        return this.httpServices.sendHttp<any>(request);
    }

    creditCardDelete(creditCardId: string, accountant?: any): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/credit-card-delete',
            params: {
                uuid: creditCardId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    solekDelete(companyAccountId: string, solekNum: number): any {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl/slika-delete',
            params: {
                companyAccountId: companyAccountId,
                solekNum: solekNum
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getAccountsSettings(id: number | string): any {
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/account-setting',
            params: {
                uuid: id
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    changeCreditCardLinkedAccount(params: {
        companyAccountId: string;
        creditCardId: string;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/credit-card/cfl/update-credit-account',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    changeClearingAgencyLinkedAccount(params: {
        oldCompanyAccountId: string;
        newCompanyAccountId: string;
        solekNum: string | number;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/slika/cfl/update-solek-account',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getAccountBankSettingsForCompany(
        companyId: number | string
    ): any {
        const countParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/book-keeping/cfl/account-bank-settings',
            params: {
                uuid: companyId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(countParam);
    }

    updateAccountPairing(params: {
        companyId: any;
        sourceProgramId: number;
        custId: string;
        companyCustomerId: string;
        companyAccountId: string;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/book-keeping/cfl/update-bank-account',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getAccountNonBankSettingsForCompanyAndSource(param: {
        companyId: any;
        sourceProgramId: number;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/book-keeping/cfl/account-non-bank-settings',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    defineSearchKey(param: {
        transTypeId: string;
        companyId: string;
        kvua: any;
        bankTransId: string;
        ccardTransId: string;
        searchkeyId: string;
        updateType: string;
    }): any {
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

    getSearchkeyCat(): any {
        const companiesParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/searchkey/searchkey-cat',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(companiesParam);
    }

    getUnionDet(param: {
        unionId: any;
        transDate: any;
        companyAccountId: any;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/cash-flow/get-union-det',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    setDismissed(historyItem: any): any {
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

    getUsersForCompany(id: number | string): any {
        if (id) {
            const request: InterfaceParamHttp<any> = {
                method: 'post',
                path: 'v1/users/get-users-for-company',
                params: {
                    uuid: id
                },
                isJson: true,
                isProtected: true,
                isAuthorization: true
            };
            return this.httpServices.sendHttp<any>(request);
        } else {
            return of([]);
        }
    }

    getCompaniesForUser(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/companies-for-user',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteUser(param: {
        companyIds: string[];
        deleteUserId: string;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/delete-user',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getPrivsForUser(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/get-privs-for-user',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    replaceCompanySuperAdmin(
        otpHeaders: {
            otpCode: string;
            otpToken: string;
        },
        params: {
            companyId: string;
            otherUserId: string;
        }
    ): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/replace-super-admin',
            params: params,
            isJson: true,
            isHeaderAuth: otpHeaders,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getUsersToCopyFor(companyIds: string[]): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/get-users-to-copy',
            params: {
                companyIds: companyIds
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createNewUser(param: {
        firstName: string;
        lastName: string;
        phoneNumber: string;
        userMail: string;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/create-new-user',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updatePrivsForUser(param: {
        userId: any;
        companies: any;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/update-user-privs',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getUnionBankdetail(param: {
        companyId: any;
        transId: string;
        dateFrom: number /* originalDate: number */;
    }): any {
        return this.httpServices.sendHttp<any>({
            method: 'post',
            path: 'v1/account/cfl/cash-flow/get-union-bankdetail',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        });
    }

    startBusinessTrial(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/start-business-trial',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    startTrialForDeskUser(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/start-trial-for-desk-user',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    customerServiceUpgrade(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/customer-service-upgrade',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    customerDenyUpgrade(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/deny-upgrade',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    customerApproveUpgrade(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/approve-upgrade',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    endBiziboxService(param: {
        companyIds: any;
        reason: string;
        text: string;
    }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/end-bizibox-service',
            params: param,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    customerApproveDowngrade(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/approve-downgrade',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getBudget(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/get-budget',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    sendWizardMail(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/send-wizard-mail',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getBudgetDetails(params: {
        companyId: any;
        budgetType: any;
        budgetId: any;
        budgetAccounts: any;
        creditCardCalcTypeDesc: any;
        dateFrom: any;
        dateTill: any;
        budgetOrderTypeDesc?: any;
    }): any {
        const parameters = {
            budgetId: params.budgetId,
            companyAccountIds: params.budgetAccounts,
            companyId: params.companyId,
            creditCardCalcTypeDesc: params.creditCardCalcTypeDesc,
            dateFrom: params.dateFrom,
            dateTill: params.dateTill
        };
        if (params.budgetOrderTypeDesc) {
            parameters['budgetOrderTypeDesc'] = params['budgetOrderTypeDesc'];
        }
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/budget/cfl/${params.budgetType}/get-budget-details`,
            params: parameters,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateBudgetPrc(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/update-budget-prc',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateBudgetDetails(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/update-budget-details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deletedBudget(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/delete',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getCategories(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/get-categories',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createBudget(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/create-budget',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateBudget(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/update-budget',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    keyHistory(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/key-history',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    budgetUpdateTransType(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/update-trans-type',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createBudgetTrans(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/create-budget-trans',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateBudgetTrans(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/update-budget-trans',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    removeKey(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/remove-key',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    budgetPopUp(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/budget-pop-up',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateCheckCategory(params: any): any {
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

    updateIzuCust(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/accountant/update-izu-cust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    exportPopupType(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export/popup-type',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    connectCust(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export/connect-cust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteBudgetTrans(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/budget/cfl/delete-budget-trans',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getDetailsPopupGeneral(url: string, params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: url,
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    oneAccountPopUp(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/one-account-pop-up',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    excelDuplicateImport(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/payments/cfl/excel-duplicate-import',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cashDetails(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/cash-details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cashSplit(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/cash-split',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    userOnBehalf(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/users/user-on-behalf',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    exporterFolderState(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/users/exporter-folder-state',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    folderError(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export-file/folder-error',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getUploadUrl(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            // path: 'v1/ocr/get-upload-url',
            path: 'v1/ocr/desktop/get-upload-url',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getFilesStatus(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-files-status',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateAgreementConfirmation(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-agreement-confirmation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateAgreementUserConfirmation(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/update-agreement-confirmation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    uploadFiles(url: string, params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: url,
            params: params,
            isJson: false,
            isFormData: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    countStatus(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/count-status',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    approveError(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/approve-error',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getCompanyDocumentsData(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-files',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateOcrDocumentData(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/set-file-data',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    accountSetNote(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/account/cfl/set-note',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    setPaymentData(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/set-payment-data',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    removeUnknownFile(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/remove-unknown-file',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    sendClientMessage(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/send-client-message',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getSubjectsForCompany(companyId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: `v1/ocr/get-subjects/${companyId}`,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    pingProcess(processId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: `v1/ocr/ping/${processId}`,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createSubjects(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/create-subject',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateSubjects(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/update-subject',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteSubjects(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/delete-subject',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    changePettyCash(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/change-export-file',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    fileSearch(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/file-search',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    advancedFileSearch(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/advanced-file-search',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getFolders(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-folders',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createFolder(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/create-folder',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteFolder(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/delete-folder',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateFolderName(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/update-folder-name',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateOfficeFolder(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/update-office-folder',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateLastUseDate(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/update-last-use-date',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    changeFileFolder(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/change-file-folder',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    archiveSinglePage(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/archive-single-page',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteFile(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/delete-file',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    filesUnion(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/files-union',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateFileName(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/update-file-name',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateOcrDocumentStatus(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/set-file-status',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createLeadOcr(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/create-lead-ocr',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getDocumentStorageData(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-invoice-link',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getPaymentDetails(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/get-payment-details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getJournalTransForFile(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-journal-trans-for-file',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getInvoiceJournal(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-invoice-journal',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateTransTypeStatus(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-trans-type-status',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getAlertTokens(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/token/cfl/get-alert-tokens',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    tokenAlert(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/messages/cfl/token-alert',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getExportFiles(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-export-files',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getExportFilesBank(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/get-export-files',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getVatList(userId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-vat-list',
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteExportFile(ocrExportFileId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/delete-export-file',
            params: {
                uuid: ocrExportFileId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateMaamMonth(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/update-maam-month',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    companyGetCustomer(params: any): any {
        if (!this.companyCustomerDetails$) {
            const request: InterfaceParamHttp<any> = {
                method: 'post',
                path: 'v1/ocr/company-get-customer',
                params: params,
                isJson: true,
                isProtected: true,
                isAuthorization: true
            };
            const requestMaam: InterfaceParamHttp<any> = {
                method: 'post',
                path: 'v1/ocr/get-maam-cust-ids',
                params: params,
                isJson: true,
                isProtected: true,
                isAuthorization: true
            };
            this.companyCustomerDetails$ =
                combineLatest(
                    [
                        this.httpServices.sendHttp<any>(request),
                        this.httpServices.sendHttp<any>(requestMaam)
                    ]
                ).pipe(
                    map(([response, maamResponse]) => {
                        const maamData = maamResponse
                            ? maamResponse['body'].map((value) => {
                                const cartisName = value.custId
                                    ? value.custId +
                                    (value.custLastName ? ' - ' + value.custLastName : '')
                                    : value.custLastName
                                        ? value.custLastName
                                        : '';
                                return {
                                    label: cartisName,
                                    value: value.custId
                                } as SelectItem;
                            })
                            : maamResponse;

                        if (response && !response.error) {
                            if (response.body && response.body.length) {
                                let cartisCodeId13: any = null;
                                let cartisCodeId14: any = null;
                                let cartisCodeId12: any = null;
                                let custMaamNechasim: any = null;
                                let custMaamTsumot: any = null;
                                let custMaamYevu: any = null;
                                let custMaamIska: any = null;
                                let supplierTaxDeduction: any = null;
                                let customerTaxDeduction: any = null;

                                const all = response.body.map((it) => {
                                    const cartisName = it.custId
                                        ? it.custId + (it.custLastName ? ' - ' + it.custLastName : '')
                                        : it.custLastName
                                            ? it.custLastName
                                            : '';
                                    const obj = {
                                        cartisName: cartisName,
                                        cartisCodeId: it.cartisCodeId,
                                        custId: it.custId,
                                        hashCartisCodeId: it.hashCartisCodeId,
                                        lName: it.custLastName,
                                        hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                                        id: it.palCode,
                                        pettyCash: it.pettyCash ? it.pettyCash : false,
                                        supplierTaxDeduction: it.supplierTaxDeduction,
                                        customerTaxDeduction: it.customerTaxDeduction
                                    };

                                    if (it.cartisCodeId === 13 && !cartisCodeId13) {
                                        cartisCodeId13 = obj;
                                    }
                                    if (it.cartisCodeId === 14 && !cartisCodeId14) {
                                        cartisCodeId14 = obj;
                                    }
                                    if (it.cartisCodeId === 12 && !cartisCodeId12) {
                                        cartisCodeId12 = obj;
                                    }
                                    if (it.custMaamNechasim && !custMaamNechasim) {
                                        custMaamNechasim = obj;
                                    }
                                    if (it.custMaamTsumot && !custMaamTsumot) {
                                        custMaamTsumot = obj;
                                    }
                                    if (it.custMaamYevu && !custMaamYevu) {
                                        custMaamYevu = obj;
                                    }
                                    if (it.custMaamIska && !custMaamIska) {
                                        custMaamIska = obj;
                                    }
                                    if (it.supplierTaxDeduction && !supplierTaxDeduction) {
                                        supplierTaxDeduction = obj;
                                    }
                                    if (it.customerTaxDeduction && !customerTaxDeduction) {
                                        customerTaxDeduction = obj;
                                    }
                                    return obj;
                                });

                                let banksCards = JSON.parse(JSON.stringify(all)).filter(
                                    (it) => it.cartisCodeId === 1700
                                );
                                if (banksCards && banksCards.length) {
                                    banksCards = banksCards.map((it) => {
                                        it.isHistory = true;
                                        return it;
                                    });
                                    banksCards[banksCards.length - 1].isLastHistory = true;
                                }

                                return [
                                    {
                                        all: all,
                                        banksCards: banksCards.concat(
                                            all.filter((it) => it.cartisCodeId !== 1700)
                                        ),
                                        cupa: all.filter(
                                            (it) => it.cartisCodeId === 1700 || it.cartisCodeId === 1800
                                        ),
                                        taxDeductionArr: all.filter(
                                            (it) =>
                                                it.hashCartisCodeId === 18 ||
                                                it.hashCartisCodeId === 19 ||
                                                it.hashCartisCodeId === 20 ||
                                                it.hashCartisCodeId === 21 ||
                                                it.hashCartisCodeId === 22 ||
                                                it.hashCartisCodeId === 33 ||
                                                it.hashCartisCodeId === 34 ||
                                                it.hashCartisCodeId === 35 ||
                                                it.hashCartisCodeId === 36 ||
                                                it.hashCartisCodeId === 37 ||
                                                it.hashCartisCodeId === 38 ||
                                                it.hashCartisCodeId === 39 ||
                                                it.hashCartisCodeId === 40 ||
                                                it.hashCartisCodeId === 41 ||
                                                it.hashCartisCodeId === 42 ||
                                                it.hashCartisCodeId === 45
                                        ),
                                        customerTaxDeductionCustIdExpenseArr: all.filter(
                                            (it) =>
                                                it.hashCartisCodeId === 18 ||
                                                it.hashCartisCodeId === 19 ||
                                                it.hashCartisCodeId === 20 ||
                                                it.hashCartisCodeId === 21 ||
                                                it.hashCartisCodeId === 33 ||
                                                it.hashCartisCodeId === 34 ||
                                                it.hashCartisCodeId === 35 ||
                                                it.hashCartisCodeId === 36 ||
                                                it.hashCartisCodeId === 37 ||
                                                it.hashCartisCodeId === 38 ||
                                                it.hashCartisCodeId === 39 ||
                                                it.hashCartisCodeId === 40 ||
                                                it.hashCartisCodeId === 41 ||
                                                it.hashCartisCodeId === 42 ||
                                                it.hashCartisCodeId === 45
                                        ),
                                        customerTaxDeductionCustIdArr: all.filter(
                                            (it) => it.hashCartisCodeId === 22
                                        ),
                                        taxDeductionCustIdHova: all.filter(
                                            (it) => it.hashCartisCodeId === 2
                                        ),
                                        taxDeductionCustIdZhut: all.filter(
                                            (it) =>
                                                it.hashCartisCodeId === 2 || it.hashCartisCodeId === 22
                                        ),
                                        oppositeCustForChecks: all.filter(
                                            (it) =>
                                                it.hashCartisCodeId === 1700 ||
                                                it.hashCartisCodeId === 1800
                                        ),
                                        cupa_new: all.filter(
                                            (it) =>
                                                it.cartisCodeId === 1300 ||
                                                it.cartisCodeId === 1400 ||
                                                it.cartisCodeId === 3 ||
                                                it.cartisCodeId === 7 ||
                                                it.cartisCodeId === 1000 ||
                                                it.cartisCodeId === 1011
                                        ),
                                        cartisCodeId13: cartisCodeId13,
                                        cartisCodeId14: cartisCodeId14,
                                        cartisCodeId12: cartisCodeId12,
                                        custMaamNechasim: custMaamNechasim,
                                        custMaamTsumot: custMaamTsumot,
                                        custMaamYevu: custMaamYevu,
                                        custMaamIska: custMaamIska,
                                        supplierTaxDeduction: supplierTaxDeduction,
                                        customerTaxDeduction: customerTaxDeduction
                                    },
                                    maamData
                                ];
                            } else {
                                return [null, maamData];
                            }
                        } else {
                            return [null, maamData];
                        }
                    }),
                    shareReplay(1)
                );
            this.companyCustomerDetails$.subscribe(([resp, respMaam]) => {
                this.userService.appData.userData.companyCustomerDetails = resp
                    ? resp
                    : {
                        all: [],
                        cupa: [],
                        cupa_new: [],
                        banksCards: [],
                        taxDeductionArr: [],
                        customerTaxDeductionCustIdArr: [],
                        taxDeductionCustIdHova: [],
                        taxDeductionCustIdZhut: [],
                        oppositeCustForChecks: [],
                        customerTaxDeductionCustIdExpenseArr: []
                    };

                this.userService.appData.userData.maamCustids = respMaam || null;
            });
        }
        return this.companyCustomerDetails$;
    }


    companyGetCustomerExport(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/company-get-customer',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request).pipe(
            map((response) => {
                if (response && !response.error) {
                    if (response.body && response.body.length) {
                        let cartisCodeId13: any = null;
                        let cartisCodeId14: any = null;
                        let cartisCodeId12: any = null;
                        let custMaamNechasim: any = null;
                        let custMaamTsumot: any = null;
                        let custMaamYevu: any = null;
                        let custMaamIska: any = null;
                        let supplierTaxDeduction: any = null;
                        let customerTaxDeduction: any = null;

                        const all = response.body.map((it) => {
                            const cartisName = it.custId
                                ? it.custId + (it.custLastName ? ' - ' + it.custLastName : '')
                                : it.custLastName
                                    ? it.custLastName
                                    : '';
                            const obj = {
                                cartisName: cartisName,
                                cartisCodeId: it.cartisCodeId,
                                custId: it.custId,
                                hashCartisCodeId: it.hashCartisCodeId,
                                lName: it.custLastName,
                                hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                                id: it.palCode,
                                pettyCash: it.pettyCash ? it.pettyCash : false,
                                supplierTaxDeduction: it.supplierTaxDeduction,
                                customerTaxDeduction: it.customerTaxDeduction
                            };

                            if (it.cartisCodeId === 13 && !cartisCodeId13) {
                                cartisCodeId13 = obj;
                            }
                            if (it.cartisCodeId === 14 && !cartisCodeId14) {
                                cartisCodeId14 = obj;
                            }
                            if (it.cartisCodeId === 12 && !cartisCodeId12) {
                                cartisCodeId12 = obj;
                            }
                            if (it.custMaamNechasim && !custMaamNechasim) {
                                custMaamNechasim = obj;
                            }
                            if (it.custMaamTsumot && !custMaamTsumot) {
                                custMaamTsumot = obj;
                            }
                            if (it.custMaamYevu && !custMaamYevu) {
                                custMaamYevu = obj;
                            }
                            if (it.custMaamIska && !custMaamIska) {
                                custMaamIska = obj;
                            }
                            if (it.supplierTaxDeduction && !supplierTaxDeduction) {
                                supplierTaxDeduction = obj;
                            }
                            if (it.customerTaxDeduction && !customerTaxDeduction) {
                                customerTaxDeduction = obj;
                            }
                            return obj;
                        });

                        let banksCards = JSON.parse(JSON.stringify(all)).filter(
                            (it) => it.cartisCodeId === 1700
                        );
                        if (banksCards && banksCards.length) {
                            banksCards = banksCards.map((it) => {
                                it.isHistory = true;
                                return it;
                            });
                            banksCards[banksCards.length - 1].isLastHistory = true;
                        }

                        return {
                            all: all,
                            banksCards: banksCards.concat(
                                all.filter((it) => it.cartisCodeId !== 1700)
                            ),
                            cupa: all.filter(
                                (it) => it.cartisCodeId === 1700 || it.cartisCodeId === 1800
                            ),
                            taxDeductionArr: all.filter(
                                (it) =>
                                    it.hashCartisCodeId === 18 ||
                                    it.hashCartisCodeId === 19 ||
                                    it.hashCartisCodeId === 20 ||
                                    it.hashCartisCodeId === 21 ||
                                    it.hashCartisCodeId === 22 ||
                                    it.hashCartisCodeId === 33 ||
                                    it.hashCartisCodeId === 34 ||
                                    it.hashCartisCodeId === 35 ||
                                    it.hashCartisCodeId === 36 ||
                                    it.hashCartisCodeId === 37 ||
                                    it.hashCartisCodeId === 38 ||
                                    it.hashCartisCodeId === 39 ||
                                    it.hashCartisCodeId === 40 ||
                                    it.hashCartisCodeId === 41 ||
                                    it.hashCartisCodeId === 42 ||
                                    it.hashCartisCodeId === 45
                            ),
                            customerTaxDeductionCustIdExpenseArr: all.filter(
                                (it) =>
                                    it.hashCartisCodeId === 18 ||
                                    it.hashCartisCodeId === 19 ||
                                    it.hashCartisCodeId === 20 ||
                                    it.hashCartisCodeId === 21 ||
                                    it.hashCartisCodeId === 33 ||
                                    it.hashCartisCodeId === 34 ||
                                    it.hashCartisCodeId === 35 ||
                                    it.hashCartisCodeId === 36 ||
                                    it.hashCartisCodeId === 37 ||
                                    it.hashCartisCodeId === 38 ||
                                    it.hashCartisCodeId === 39 ||
                                    it.hashCartisCodeId === 40 ||
                                    it.hashCartisCodeId === 41 ||
                                    it.hashCartisCodeId === 42 ||
                                    it.hashCartisCodeId === 45
                            ),
                            customerTaxDeductionCustIdArr: all.filter(
                                (it) => it.hashCartisCodeId === 22
                            ),
                            taxDeductionCustIdHova: all.filter(
                                (it) => it.hashCartisCodeId === 2
                            ),
                            taxDeductionCustIdZhut: all.filter(
                                (it) =>
                                    it.hashCartisCodeId === 2 || it.hashCartisCodeId === 22
                            ),
                            oppositeCustForChecks: all.filter(
                                (it) =>
                                    it.hashCartisCodeId === 1700 ||
                                    it.hashCartisCodeId === 1800
                            ),
                            cupa_new: all.filter(
                                (it) =>
                                    it.cartisCodeId === 1300 ||
                                    it.cartisCodeId === 1400 ||
                                    it.cartisCodeId === 3 ||
                                    it.cartisCodeId === 7 ||
                                    it.cartisCodeId === 1000 ||
                                    it.cartisCodeId === 1011
                            ),
                            cartisCodeId13: cartisCodeId13,
                            cartisCodeId14: cartisCodeId14,
                            cartisCodeId12: cartisCodeId12,
                            custMaamNechasim: custMaamNechasim,
                            custMaamTsumot: custMaamTsumot,
                            custMaamYevu: custMaamYevu,
                            custMaamIska: custMaamIska,
                            supplierTaxDeduction: supplierTaxDeduction,
                            customerTaxDeduction: customerTaxDeduction
                        };
                    } else {
                        return null;
                    }
                } else {
                    return null;
                }

            }),
            shareReplay(1)
        );
    }


    oppositeCustHistory(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/opposite-cust-history',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getJournalTrans(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/get-journal-trans',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateCheckedTranses(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/update-checked-transes',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    splitJournalTrans(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/split-journal-trans',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getMaamCustIds(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/get-maam-cust-ids',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getCompanyData(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/get-company-data',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transTypeDefined(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/trans-type/defined',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getCompanyCurrency(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/get-company-currency',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateDetails(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateGeneral(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-general',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    setReport856(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/set-report856',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    setTaxDeductionCust(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/set-tax-deduction-cust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateBookKeepingCust(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-book-keeping-cust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateIzu(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/users/update-izu',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateExportToken(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-export-token',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createApiToken(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/office/create-api-token',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    companyList(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/api/company-list',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateExporterFileStatus(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-exporter-file-status',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    validationSession(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/api/validation-session',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateApiToken(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/office/update-api-token',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateContact(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-contact',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    sendLandingPageMessages(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/send-landing-page-messages',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    accountantAgreementStatus(): any {
        const request: InterfaceParamHttp<any> = {
            path: 'v1/companies/accountant-agreement-status',
            method: 'get',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteContact(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/delete-contact',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    joinAppContact(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/join-app-contact',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cancelAppContact(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/cancel-app-contact',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    addContact(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/add-contact',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateSupplierJournal(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-supplier-journal',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    addItem(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/add-item',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateBankJournal(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-bank-journal',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateWizard(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-wizard',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    dbYearHistory(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/db-year-history',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    details(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transType(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/trans-type',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transTypeAll(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/trans-type/all',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transTypeApprove(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/trans-type-approve',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transTypeDelete(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/trans-type-delete',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transTypeReplace(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/trans-type-replace',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transTypeWithAutoApply(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/trans-type/auto-apply-first',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    general(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/general',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    izu(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/users/izu',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getExporterFileStatus(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/get-exporter-file-status',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    contacts(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/contacts',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    firstConstruction(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/first-construction',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    supplierJournal(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/supplier-journal',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    bankJournal(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/bank-journal',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    accountsBar(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/accounts-bar',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getBanksRecommendation(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/recommendation',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    accountantMatch(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/match',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cancelMatched(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/match/cancel',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateStartWorkDate(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/update-start-work-date',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    banksBooksUnitedWithMatchAdvised(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/banks-books/match-advised',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getBooksData(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/books',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getBanksData(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/banks',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    matchedTrans(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-match/accountant/matched-trans',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    bookKeepingCust(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/book-keeping-cust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createDocFile(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/create-doc-file',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true // ,
            // responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(request);
    }

    createDocFileBank(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/create-doc-file',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true // ,
            // responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(request);
    }

    journalTrans(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/journal-trans',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    suppliersCustomersOv(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/suppliers-customers-ov',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    journalBankCreditOv(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/journal-bank-credit-ov',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    izuExport(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/export/izu',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getCurrencyList(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/ocr/get-currency',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    products(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/companies/products',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getOshtnuFiles(): any {
        const request: InterfaceParamHttp<any> = {
            method: 'get',
            path: 'v1/export/get-oshtnu-files',
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    bankDetails(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/bank-details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    exportCreate(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export/create',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cardDetails(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/card-details',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    transDescUpdate(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/user-desc-update',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    backToCare(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/back-to-care',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateIgnore(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/update-ignore',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    imageLink(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/image-link',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateCust(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/update-cust',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateTransType(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/update-trans-type',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    exportFileCancelFile(ocrExportFileId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export-file/cancel-file',
            params: {
                uuid: ocrExportFileId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(request);
    }

    changeExportFile(params: { uuids: any }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/change-export-file',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    deleteCommand(params: { uuids: any }): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/bank-process/delete-commands',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    updateExpenseOnly(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/update-expense-only',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cancelCustDefault(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/cancel-cust-default',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cancelOppositeCustDefault(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/ocr/cancel-opposite-cust-default',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    exportFileCreateFolder(ocrExportFileId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export-file/create-folder',
            params: {
                uuid: ocrExportFileId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(request);
    }

    checkFolderFile(ocrExportFileId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export-file/check-folder-file',
            params: {
                uuid: ocrExportFileId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(request);
    }

    cancelFile(ocrExportFileId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export-file/cancel-file',
            params: {
                uuid: ocrExportFileId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    exportFileManualDownload(ocrExportFileId: string): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export-file/manual-download',
            params: {
                uuid: ocrExportFileId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getCompanyItems(id: string) {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/companies/get-company-items',
            params: {
                uuid: id
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    exportFileHideCancelToast(ocrExportFileId: string) {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/export-file/hide-cancel-toast',
            params: {
                uuid: ocrExportFileId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getAccountsForStation(params: any): any {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/station/get-accounts-for-station',
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }
}

export class SearchkeyCategory {
    id: string;
    name: string;
    paymentDescription: string;
    paymentType: number;
    showInDrop: boolean;
}
