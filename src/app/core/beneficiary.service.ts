import {Injectable} from '@angular/core';
import {HttpServices} from '@app/shared/services/http.services';
import {UserService} from './user.service';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {Observable, of, Subject, throwError} from 'rxjs';
import {map, shareReplay, switchMap, takeUntil, tap} from 'rxjs/operators';

@Injectable()
export class BeneficiaryService {
    private selectedCompanyBeneficiaries$: Observable<Array<Beneficiary>>;

    get selectedCompanyBeneficiaries(): Observable<Array<Beneficiary>> {
        if (!this.selectedCompanyBeneficiaries$) {
            this.selectedCompanyBeneficiaries$ = this.getBeneficiariesFor(
                this.userService.appData.userData.companySelect.companyId
            ).pipe(
                shareReplay(1),
                takeUntil(this.selectedCompanyBeneficiariesReload$)
            );
        }
        return this.selectedCompanyBeneficiaries$;
    }

    private readonly selectedCompanyBeneficiariesReload$ = new Subject<void>();
    public readonly companySelectionChange$: Subject<void> = new Subject<void>();

    constructor(
        private httpServices: HttpServices,
        public userService: UserService
    ) {
        this.companySelectionChange$.subscribe(() =>
            this.selectedCompanyBeneficiariesReload()
        );
    }

    private getBeneficiariesFor(
        companyId: number | string
    ): Observable<Array<Beneficiary>> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/mutav/get-mutavim',
            params: {
                uuid: companyId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(request)
            .pipe(
                switchMap((response: any) =>
                    response && !response.error
                        ? of(response.body)
                        : throwError(response ? response.error : 'Invalid response')
                )
            );
    }

    selectedCompanyBeneficiariesReload() {
        this.selectedCompanyBeneficiariesReload$.next();
        this.selectedCompanyBeneficiaries$ = null;
    }

    public isBeneficiaryExistsWith(criteria: {
        accountId: number;
        bankId: number;
        companyId: string;
        snifId: number;
    }): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/mutav/existing-mutav',
            params: criteria,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    create(beneficiaryData: {
        accountMutavHp: number;
        accountMutavName: string;
        bankId: number;
        snifId: number;
        accountId: number;
        transTypeId: string;
        contactMail: string;
        contactName: string;
        contactPhone: string;
        companyAccountId: string;
        companyId: string;
        paymentTypeId: string;
    }): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/mutav/create-mutav',
            params: beneficiaryData,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request).pipe(
            tap((response: any) => {
                if (response && !response.error) {
                    this.selectedCompanyBeneficiariesReload();
                }
            })
        );
    }

    update(beneficiaryData: {
        accountMutavHp: number;
        accountMutavName: string;
        bankId: number;
        snifId: number;
        accountId: number;
        biziboxMutavId: string;
        transTypeId: string;
        contactMail: string;
        contactName: string;
        contactPhone: string;
        companyAccountId: string;
        companyId: string;
        paymentTypeId: string;
    }): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/mutav/update-mutav',
            params: beneficiaryData,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request).pipe(
            tap((response: any) => {
                if (response && !response.error) {
                    this.selectedCompanyBeneficiariesReload();
                }
            })
        );
    }

    history(beneficiaryData: {
        biziboxMutavId: string;
        companyAccountIds: string[];
        companyId: string;
        isDetails: boolean;
    }): Observable<CompanyBeneficiaryHistory> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/mutav/history',
            params: beneficiaryData,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request).pipe(
            map((response: any) => {
                return response && !response.error ? response.body : [];
            })
        );
    }

    updateCategory(data: {
        companyId: string;
        biziboxMutavId: string;
        transTypeId: string;
        updateType: 'bankdetail' | 'future+past' | 'past' | 'future';
        transId: string;
    }): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/mutav/update-mutav-category',
            params: data,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request).pipe(
            tap((response: any) => {
                if (response && !response.error) {
                    this.selectedCompanyBeneficiariesReload();
                }
            })
        );
    }

    public getBeneficiariesForAccountsIn(data: {
        companyAccountIds: Array<string>;
        companyId: number | string;
    }): Observable<Array<CompanyBeneficiary>> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/mutav/company-mutav-details',
            params: data,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(request)
            .pipe(
                switchMap((response: any) =>
                    response && !response.error
                        ? of(response.body)
                        : throwError(response ? response.error : 'Invalid response')
                )
            );
    }

    public rebuildBeneficiariaryArrayForUpdate(
        source: {
            biziboxMutavId?: string;
            total?: number;
            transId?: string;
            unionId?: string;
            mutavArray: Array<{
                biziboxMutavId: string;
                total: number;
                transId: string;
                transTypeId: string;
            }>;
        },
        target: Array<{
            biziboxMutavId: string;
            total: number;
            transId: string;
            transTypeId: string;
        }>
    ): Array<{
        biziboxMutavId: string;
        isDeleted?: boolean;
        total: number;
        transId: string;
        transTypeId: string;
        transTazrimMapId?: string;
    }> {
        let srcMutavArray = source.mutavArray;
        if (!Array.isArray(srcMutavArray) || !srcMutavArray.length) {
            if (!!source.biziboxMutavId && !source.unionId) {
                srcMutavArray = [
                    <any>{
                        biziboxMutavId: source.biziboxMutavId,
                        total: source.total,
                        // transId: source.transId,
                        transTazrimMapId: source.transId
                    }
                ];
            } else {
                return target;
            }
        }

        if (!Array.isArray(target) || !target.length) {
            return srcMutavArray.map((r) =>
                Object.assign(JSON.parse(JSON.stringify(r)), {isDeleted: true})
            );
        } else {
            return [
                ...srcMutavArray
                    .filter(
                        (rs) =>
                            rs.biziboxMutavId &&
                            !target.some((rt) => rt.biziboxMutavId === rs.biziboxMutavId)
                    )
                    .map((r) =>
                        Object.assign(JSON.parse(JSON.stringify(r)), {isDeleted: true})
                    ),
                ...target.map((r) =>
                    Object.assign(JSON.parse(JSON.stringify(r)), {isDeleted: false})
                )
            ];
        }
    }
}

export class Beneficiary {
    biziboxMutavId: string;
    accountMutavName: string;
    bankId: number;
    accountId: string;
    transTypeId: string;
    paymentTypeId: string;
}

// export class BeneficiaryValidators {
//     static beneficiaryExistsValidator(bs: BeneficiaryService): AsyncValidatorFn {
//         return (fg: FormGroup): Promise<ValidationErrors | null> | Observable<ValidationErrors | null> => {
//             const fgVal = !!fg ? fg.getRawValue() : null;
//             if (!fgVal) {
//                 return null;
//             }
//             const request = {
//                 accountId: fgVal.accountId,
//                 bankId: fgVal.bankId,
//                 companyId: fgVal.companyId,
//                 snifId: fgVal.snifId
//             };
//             if (!!(Object.values(request).some((v) => !v))) {
//                 return null;
//             }
//             return bs.isBeneficiaryExistsWith(request)
//                 .pipe(
//                     map(response => response && !response.error && Array.isArray(response.body) && response.body.length
//                         ? {existingBeneficiaries: response.body} : null
//                     )
//                 );
//         };
//     }
// }

export class CompanyBeneficiary {
    absLastMonthSum: number;
    accountId: number;
    accountMutavDetails: string;
    accountMutavHp: number;
    accountMutavName: string;
    averageThreeMonths: number;
    bankId: number;
    biziboxMutavId: string;
    contactMail: string;
    contactName: string;
    contactPhone: string;
    hashCustId: string;
    isCyclic: boolean;
    lastMonthSum: number;
    snifId: number;
    transTypeId: string;
    transTypeName: string;
    transType: any;
    form: any;
    sourceProgramId: string;
}

export class CompanyBeneficiaryHistory {
    average: number;
    monthsTotal: Array<{
        month: number;
        total: number;
    }>;
    transes: Array<{
        asmachta: string;
        paymentDesc: string;
        total: 0;
        transDate: number;
        transId: string;
        transName: string;
        transTypeId: string;
        transTypeName: string;
    }>;
    transesTotal: number;
    chartData: any;
}
