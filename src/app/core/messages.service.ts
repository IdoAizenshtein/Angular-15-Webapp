import {Injectable} from '@angular/core';
import {merge, Observable, Subject} from 'rxjs';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {UserService} from './user.service';
import {HttpServices} from '@app/shared/services/http.services';
import {map, mergeMap, tap} from 'rxjs/operators';
import {publishRef} from '@app/shared/functions/publishRef';

@Injectable()
export class MessagesService {
    private _messagesCount$: Observable<number>;
    public _messagesStart: any = false;

    get messagesCount$() {
        if (!this._messagesStart) {
            this._messagesStart = true;
        }
        if (!this._messagesCount$) {
            this._messagesCount$ = merge(
                this.companySelectionChange$,
                this.messageStateChanged$
            ).pipe(
                mergeMap(() =>
                    this.requestMessagesCount({
                        uuid: this.userService.appData.userData.companySelect.companyId
                    })
                ),
                map((response: any) => (!response.error ? response.body : null)),
                publishRef
            );
        }

        return this._messagesCount$;
    }

    private readonly messageStateChanged$: Subject<void> = new Subject<void>();

    public readonly companySelectionChange$: Subject<void> = new Subject<void>();

    constructor(
        public userService: UserService,
        private httpServices: HttpServices
    ) {
    }

    getCompanyMessages(
        request: {
            companyAccountIds: string[];
            companyId: string;
            source: 'popup' | 'overview' | 'page';
        } = {
            companyAccountIds: Array.isArray(
                this.userService.appData.userData.accountSelect
            )
                ? this.userService.appData.userData.accountSelect.map(
                    (acc:any) => acc.companyAccountId
                )
                : [],
            companyId: this.userService.appData.userData.exampleCompany
                ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
                : this.userService.appData.userData.companySelect.companyId,
            source: 'overview'
        }
    ): Observable<Array<Message>> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/messages/${
                this.userService.appData.userData.pathMainApp === 'accountants'
                    ? 'accountant'
                    : 'cfl'
            }`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(params)
            .pipe(map((resp) => (resp && Array.isArray(resp.body) ? resp.body : [])));
        // return of(null);
    }

    updateMessagesState(request: {
        indHide?: boolean;
        indRead?: boolean;
        messageIds: string[];
    }): Observable<any> {
        const params: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/messages/${
                this.userService.appData.userData.pathMainApp === 'accountants'
                    ? 'accountant'
                    : this.userService.appData.userData.pathMainApp
            }/user-read-update`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices
            .sendHttp<any>(params)
            .pipe(tap(() => this.messageStateChanged$.next()));
    }

    private requestMessagesCount(request: { uuid: string }): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/messages/${
                this.userService.appData.userData.pathMainApp === 'accountants'
                    ? 'accountant'
                    : this.userService.appData.userData.pathMainApp
            }/count`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }

    public getMessageFiles(request: any): Observable<any> {
        const interfaceParamHttp: InterfaceParamHttp<any> = {
            method: 'post',
            path: `v1/ocr/get-message-files`,
            params: request,
            isJson: true,
            isProtected: true,
            isAuthorization: true
        };
        return this.httpServices.sendHttp<any>(interfaceParamHttp);
    }
}

export class Message {
    companyAccountId: string;
    dateCreated: number;
    iconName: string;
    indAlert: string;
    indNew: boolean;
    indOpen: boolean;
    indRead: boolean;
    keyId: string;
    budgetId: string;
    keyType: string;
    linked_action: string;
    linked_text: string;
    messageId: string;
    messageTemplate: string;
    peula1: string;
    peula2: string;
    peulaName1: string;
    peulaName2: string;
    userId: string;
    indHide: boolean;
    uploadSource: any;
}
