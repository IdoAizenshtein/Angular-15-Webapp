import {Injectable} from '@angular/core';
import {HttpServices} from '@app/shared/services/http.services';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {Observable} from 'rxjs';
import {Currency} from './currency.model';
import {map, shareReplay} from 'rxjs/operators';
import {FileStatus} from './file-status.model';
import {UserService} from '@app/core/user.service';

@Injectable({
    providedIn: 'root'
})
export class OcrService {
    private baseUrl = 'v1/ocr';
    private currencyList$: Observable<Array<Currency>>;
    private companyCustomerDetails$: Observable<any>;

    constructor(
        private httpServices: HttpServices,
        public userService: UserService
    ) {
    }

    public requestAllCompaniesDocSummary(): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/company-data`,
            params: null,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    public requestCompanyFilesData(request: {
        companyId: string;
        fileStatus: string;
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-files`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    public requestFileDetails(request: { fileId: string }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-file-details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    public requestFileDetailsNew(request: { fileId: string }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-file-details-new`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    public setInvoicePayment(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/set-invoice-payment`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    requestFieldsHierarchy(): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'get',
            path: `${this.baseUrl}/fields-order`,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    setFieldValue(request: {
        fileResultId: string | any;
        fieldPosition: Array<{ x: number; y: number }> | any;
        locationDesc: 'RIGHT' | 'LEFT' | 'UP' | 'DOWN' | any;
        fieldSearchkey: string | any;
        locationNum: number | any;
        fieldValue: string | number | Date | any;
        fieldPage: number | any;
        fileId: string;
        popupType?: number;
        fieldId: number;
        manualTyped: boolean;
        defaultValue?: any;
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/set-field-value`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    setFieldValueNew(request: {
        fileResultId: string | any;
        fieldPosition: Array<{ x: number; y: number }> | any;
        locationDesc: 'RIGHT' | 'LEFT' | 'UP' | 'DOWN' | any;
        fieldSearchkey: string | any;
        locationNum: number | any;
        fieldValue: string | number | Date | any;
        fieldPage: number | any;
        fileId: string;
        fieldId: number;
        manualTyped: boolean;
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/set-field-value-new`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    requestCompanyCustomerDetails(request: { companyIds: Array<string> }) {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/company-cust-details`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    companyGetCustomer(request: { companyId: string; sourceProgramId: any }) {
        if (!this.companyCustomerDetails$) {
            const params: InterfaceParamHttp<any> = {
                method: 'post',
                path: `${this.baseUrl}/company-get-customer`,
                params: request,
                isJson: true,
                isProtected: true,
                isAuthorization: true
            };
            this.companyCustomerDetails$ = this.httpServices
                .sendHttp<any>(params)
                .pipe(
                    map((response: any) =>
                        response && !response.error ? response.body : null
                    ),
                    shareReplay(1)
                );
        }
        return this.companyCustomerDetails$;
    }

    getCompanyJournalTransData(request: any) {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/companies/get-company-data`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getVatList(userId: string): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-vat-list`,
            params: {
                uuid: userId
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    getChildren(request: { fileId: string }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-children`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    filesSplit(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/files-split`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    deleteInvoice(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/delete-invoice`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    filesUnion(params: any): Observable<any> {
        const request: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/files-union`,
            params: params,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(request);
    }

    suspiciousDoubleInvoice(fileId: string): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'get',
            path: `${this.baseUrl}/suspicious-double-invoice/${fileId}`,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getCurrencyList(): Observable<Array<Currency>> {
        if (!this.currencyList$) {
            this.currencyList$ = this.requestCurrencyList().pipe(
                map((response: any) => (response && !response.error ? response.body : null)),
                shareReplay(1)
            );
        }
        return this.currencyList$;
    }

    requestCurrencyList(): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'get',
            path: `${this.baseUrl}/get-currency`,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    setFileStatus(
        fileId: string,
        fileStatus: string | FileStatus
    ): Observable<any> {
        return this.setFilesStatus({filesId: [fileId], fileStatus: fileStatus});
    }

    setFilesStatus(request: {
        filesId: Array<string>;
        fileStatus: string | FileStatus;
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/set-file-status`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    changeFileCompany(fileId: any, companyId: string): Observable<any> {
        return this.changeFilesCompany({filesId: fileId, companyId: companyId});
    }

    changeFilesCompany(request: {
        companyId: string;
        filesId: Array<string>;
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/change-company`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    setFileData(request: {
        fileId: string;
        note: string;
        flag: boolean;
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/set-file-data`,
            params: {
                filesId: [request.fileId],
                note: request.note,
                flag: request.flag
            },
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    setFileDataIgnore(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/set-file-data`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    requestFilePages(request: Array<string>): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-invoice-link`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getMaam(request: { date: string }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-maam`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    currencyGetRates(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/currency-get-rates`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    imageReplaceUrl(fileId: string): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'get',
            path: `${this.baseUrl}/image-replace-url/${fileId}`,
            isProtected: true,
            isAuthorization: true,
            responseType: 'text'
        };
        return this.httpServices.sendHttp<any>(params);
    }

    rotateFile(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/rotate`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getJourForFile(request: { fileId: string }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-journal-trans-for-file`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    getJournalTransForreceipt(request: { fileId: string }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/get-journal-trans-for-receipt`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    journalHistory(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/journal-history`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    splitJourTrans(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/split-journal-trans`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    splitReceiptJournalTrans(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/split-receipt-journal-trans`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    oppositeCustHistory(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/opposite-cust-history`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    custDefault(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/cust-default`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    oppositeCustDefault(request: any): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `${this.baseUrl}/opposite-cust-default`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }

    alertId(): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'get',
            path: `${this.baseUrl}/alert-id`,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(params);
    }
}
