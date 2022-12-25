/* tslint:disable:max-line-length */
import {Injectable} from '@angular/core';
import {HttpServices} from '@app/shared/services/http.services';
import {BehaviorSubject, Observable, timer} from 'rxjs';
import {InterfaceParamHttp} from '@app/shared/interfaces/interface.param.http';
import {TranslateService} from '@ngx-translate/core';
import {tap} from 'rxjs/operators';
import {UserService} from './user.service';
import {SafeHtml} from '@angular/platform-browser';

@Injectable()
export class ReportService {
    // readonly twelveHours = 1000 * 60 * 60 * 36;

    readonly reportIsProcessing$: BehaviorSubject<boolean> = new BehaviorSubject(
        false
    );
    readonly reportIsProcessingPrint$: BehaviorSubject<boolean> =
        new BehaviorSubject(false);
    readonly joinToBizibox$: BehaviorSubject<boolean> = new BehaviorSubject(
        false
    );
    public postponed: {
        action: Observable<any>;
        message: SafeHtml;
        fired?: boolean;
        cancelled?: () => void;
    };
    public forLogic: {
        message: SafeHtml;
        fired?: boolean;
    };
    public cancelToast: {
        message: SafeHtml;
        onClose: () => void;
    };
    public cancelToastMatch: {
        class: string;
        message: SafeHtml;
        onClose: () => void;
        onClick: () => void;
    };

    constructor(
        private httpServices: HttpServices,
        private translate: TranslateService,
        public userService: UserService
    ) {
        this.postponed = null;
        this.forLogic = null;
    }

    public showCancel() {
        this.postponed.action = null;
        this.postponed.message = 'הפעולה בוטלה';
        if (this.postponed.cancelled) {
            this.postponed.cancelled();
        }
        timer(3000).subscribe(() => {
            this.postponed = null;
        });
    }

    public buildMessageFrom(accounts: any[]): string {
        if (!accounts || !accounts.length) {
            return null;
        }

        // const todayEnd = new Date().setHours(23, 59, 59, 999);i
        // const accountsOutdated = accounts.filter((account) => {
        //   return (todayEnd - account.balanceLastUpdatedDate) > this.twelveHours;
        // });
        const accountsOutdated = accounts.filter((acc:any) => acc.isUpToDate === false);
        if (accountsOutdated.length === 1) {
            // const daysBefore = getDaysBetweenDates(
            //     new Date(accountsOutdated[0].balanceLastUpdatedDate),
            //     new Date());
            const daysBefore = this.userService.appData
                .moment()
                .diff(
                    this.userService.appData.moment(
                        accountsOutdated[0].balanceLastUpdatedDate
                    ),
                    'days'
                );
            return (
                this.translate.instant('sumsTitles.notUpdates') +
                '\n' +
                this.translate.instant('sumsTitles.lastUpdate') +
                ' ' +
                (daysBefore === 1
                    ? this.translate.instant('sumsTitles.yesterday')
                    : this.translate.instant('sumsTitles.before') +
                    ' ' +
                    daysBefore +
                    ' ' +
                    this.translate.instant('sumsTitles.days'))
            );
        } else if (accountsOutdated.length > 1) {
            return [
                this.translate.instant('expressions.cardsDataOutdated0'),
                this.translate.instant('filters.accounts'),
                ':',
                accountsOutdated.map((cc) => cc.accountNickname).join(', ')
            ].join(' ');
            // return this.translate.instant('expressions.cardsDataOutdated0')
            //     + ' ' + accountsOutdated.length
            //     + ' ' + this.translate.instant('filters.accounts');
        }

        const accountsInDeviation = accounts.filter(
            (account) => account.balanceUse < 0
        );
        if (accountsInDeviation.length) {
            if (accounts.length === 1) {
                return `${this.translate.instant(
                    'sumsTitles.account'
                )} ${this.translate.instant('sumsTitles.exceeding')}`;
            } else if (accountsInDeviation.length === 1) {
                return (
                    this.translate.instant('sumsTitles.account') +
                    ' ' +
                    accountsInDeviation[0].accountNickname +
                    ' ' +
                    this.translate.instant('sumsTitles.exceeding')
                );
            } else {
                return `${accountsInDeviation.length} ${this.translate.instant(
                    'sumsTitles.accountsExceeded'
                )}`;
            }
        }

        return null;
    }

    public buildCCardMessageFrom(selectionSummary: any): string {
        if (selectionSummary.creditCardsOutdated.length > 0) {
            if (selectionSummary.creditCardsOutdated.length === 1) {
                // const daysBefore = getDaysBetweenDates(
                //     new Date(selectionSummary.creditCardsOutdated[0].balanceLastUpdatedDate),
                //     new Date());
                const daysBefore = this.userService.appData
                    .moment()
                    .diff(
                        this.userService.appData.moment(
                            selectionSummary.creditCardsOutdated[0].balanceLastUpdatedDate
                        ),
                        'days'
                    );

                return [
                    this.translate.instant('sumsTitles.notUpdates'),
                    selectionSummary.count === 1
                        ? [
                            '\n',
                            this.translate.instant('sumsTitles.lastUpdate'),
                            daysBefore,
                            this.translate.instant('sumsTitles.days')
                        ].join(' ')
                        : [
                            '\n',
                            this.translate.instant('expressions.forCard'),
                            selectionSummary.creditCardsOutdated[0].creditCardNickname
                        ].join(' ')
                ].join('');
            } else {
                return [
                    this.translate.instant('expressions.cardsDataOutdated0'),
                    this.translate.instant('expressions.cardsDataOutdated1'),
                    ':',
                    selectionSummary.creditCardsOutdated
                        .map((cc) => cc.creditCardNickname)
                        .join(', ')
                ].join(' ');
                // return [
                //     this.translate.instant('expressions.cardsDataOutdated0'),
                //     selectionSummary.creditCardsOutdated.length,
                //     this.translate.instant('expressions.cardsDataOutdated1')
                // ].join(' ');
            }
        } else if (selectionSummary.creditLimitAlmostReachedFor.length > 0) {
            if (selectionSummary.creditLimitAlmostReachedFor.length === 1) {
                return [
                    this.translate.instant('sumsTitles.creditLimitOne'),
                    selectionSummary.count === 1
                        ? this.translate.instant('expressions.isAboutToBeReached')
                        : [
                            this.translate.instant('expressions.of'),
                            selectionSummary.creditLimitAlmostReachedFor[0]
                                .creditCardNickname
                        ].join(' ')
                ].join(' ');
            } else {
                return [
                    this.translate.instant('sumsTitles.creditLimitOne'),
                    this.translate.instant('expressions.of'),
                    selectionSummary.creditLimitAlmostReachedFor.length,
                    this.translate.instant('expressions.cardsDataOutdated1'),
                    this.translate.instant('expressions.isAboutToBeReached')
                ].join(' ');
            }
        }

        return null;
    }

    public buildSolkimMessageFrom(selectedSolkimOutdated: any[]) {
        if (!selectedSolkimOutdated || !selectedSolkimOutdated.length) {
            return null;
        }

        if (selectedSolkimOutdated.length === 1) {
            if (selectedSolkimOutdated[0].checked) {
                // const daysBefore = getDaysBetweenDates(
                //     new Date(selectedSolkimOutdated[0].ballanceLastUpdatedDate),
                //     new Date());
                const daysBefore = this.userService.appData
                    .moment()
                    .diff(
                        this.userService.appData.moment(
                            selectedSolkimOutdated[0].balanceLastUpdatedDate
                        ),
                        'days'
                    );

                return (
                    this.translate.instant('sumsTitles.notUpdates') +
                    '\n' +
                    this.translate.instant('sumsTitles.lastUpdate') +
                    ' ' +
                    (daysBefore === 1
                        ? this.translate.instant('sumsTitles.yesterday')
                        : this.translate.instant('sumsTitles.before') +
                        ' ' +
                        daysBefore +
                        ' ' +
                        this.translate.instant('sumsTitles.days'))
                );
            } else {
                return (
                    this.translate.instant('expressions.forClearingAgency') +
                    ' ' +
                    (selectedSolkimOutdated[0].solekDesc ||
                        this.translate.instant(
                            'clearingAgencies.' + selectedSolkimOutdated[0].solekBankId
                        ) +
                        ' ' +
                        selectedSolkimOutdated[0].solekNum)
                );
            }
        } else if (selectedSolkimOutdated.length > 1) {
            return [
                this.translate.instant('expressions.solkimDataOutdated0'),
                this.translate.instant('expressions.solkimDataOutdated1'),
                ':',
                selectedSolkimOutdated
                    .map(
                        (slk) =>
                            this.translate.instant('clearingAgencies.' + slk.solekBankId) +
                            ' ' +
                            slk.solekNum
                    )
                    .join(', ')
            ].join(' ');
            // return this.translate.instant('expressions.solkimDataOutdated0')
            //     + ' ' + selectedSolkimOutdated.length
            //     + ' ' + this.translate.instant('expressions.solkimDataOutdated1');
        }

        return null;
    }

    requestReport(
        reportType: string,
        paramsObj: any,
        fileType: string
    ): Observable<any> {
        try {
            paramsObj.additionalProperties.balanceLastUpdatedDate =
                this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate;
        } catch (e) {
            paramsObj.additionalProperties.balanceLastUpdatedDate = null;
        }
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/report/' + reportType + '/download/' + fileType,
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'blob'
        };
        this.reportIsProcessing$.next(true);
        return this.httpServices.sendHttp<any>(accountsParam).pipe(
            tap({
                next: () => this.reportIsProcessing$.next(false),
                error: () => this.reportIsProcessing$.next(false)
            })
        );
    }

    getReport(
        reportType: string,
        paramsObj: any,
        fileType: string,
        fileName: string
    ): Observable<any> {
        return this.requestReport(reportType, paramsObj, fileType).pipe(
            tap((rslt) => {
                let blobOpts;
                let fileExt;
                if (fileType === 'EXCEL') {
                    blobOpts = {type: 'application/vnd.ms-excel'};
                    fileExt = '.xlsx';
                } else if (fileType === 'PDF') {
                    blobOpts = {type: 'application/pdf'};
                    fileExt = '.pdf';
                }

                const blob = new Blob([rslt.body], blobOpts);
                const nav = (window.navigator as any);
                if (nav.msSaveOrOpenBlob) {
                    nav.msSaveBlob(blob, fileName + fileExt);
                } else {
                    // const newWindow = window.open('/');
                    // if (newWindow.document.readyState === 'complete') {
                    //     newWindow['location'] = URL.createObjectURL(blob);
                    // } else {
                    //     newWindow.onload = () => {
                    //         newWindow['location'] = URL.createObjectURL(blob);
                    //     };
                    // }

                    // const file = new File([rslt.body], fileName + fileExt, blobOpts);

                    // const reader:any = new FileReader();
                    // reader.onload = function (e) {
                    //     window.location.href = reader.result;
                    // };
                    // reader.readAsDataURL(blob);

                    const objectUrl = URL.createObjectURL(blob);
                    const a: HTMLAnchorElement = document.createElement(
                        'a'
                    ) as HTMLAnchorElement;
                    a.href = objectUrl;
                    a.download = fileName + fileExt;
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(function () {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(a.href);
                    }, 100);
                    /*
                                          document.body.removeChild(a);
                                          URL.revokeObjectURL(objectUrl);
                          */
                }
            })
        );
    }

    printReport(
        reportType: string,
        paramsObj: any,
        fileType: string,
        fileName: string
    ): Observable<any> {
        return this.requestReport(reportType, paramsObj, fileType).pipe(
            tap((rslt) => {
                let blobOpts;
                let fileExt;
                if (fileType === 'EXCEL') {
                    blobOpts = {type: 'application/vnd.ms-excel'};
                    fileExt = '.xlsx';
                } else if (fileType === 'PDF') {
                    blobOpts = {type: 'application/pdf'};
                    fileExt = '.pdf';
                }
                const objectUrl = URL.createObjectURL(new Blob([rslt.body], blobOpts));
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = objectUrl;
                document.body.appendChild(iframe);
                const nav = (window.navigator as any);
                if (nav.msSaveOrOpenBlob) {
                    const blob = new Blob([rslt.body], blobOpts);
                    nav.msSaveBlob(blob, fileName + fileExt);
                } else {
                    iframe.contentWindow.print();
                }
            })
        );
    }

    emailReport(reportType: string, paramsObj: any): Observable<any> {
        try {
            paramsObj.additionalProperties.balanceLastUpdatedDate =
                this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate;
        } catch (e) {
            paramsObj.additionalProperties.balanceLastUpdatedDate = null;
        }
        const accountsParam: InterfaceParamHttp<any> = {
            method: 'post',
            path: 'v1/report/' + reportType + '/download/email',
            params: paramsObj,
            isJson: true,
            isProtected: true,
            isAuthorization: true,
            responseType: 'blob'
        };
        return this.httpServices.sendHttp<any>(accountsParam);
    }

    prepareFilename(...args) {
        return args
            .join('-')
            .replace(/\//g, '_')
            .replace(/\s+/g, '-')
            .replace(/-{2,}/g, '-')
            .replace(/[\\/:"*?<>|]+/g, '');
    }
}
