import {Component, ElementRef, ViewEncapsulation} from '@angular/core';
import {AdditionalInfo} from '../additional-info';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {ReportService} from '@app/core/report.service';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {combineLatest, Observable, of, zip} from 'rxjs';
import {first, map, switchMap, tap} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {UserService} from '@app/core/user.service';
import {TransTypesService} from '@app/core/transTypes.service';
import {Router} from '@angular/router';
import {publishRef} from '../../../functions/publishRef';

@Component({
    selector: 'app-transfer-view',
    templateUrl: './transfer-view.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TransferViewComponent extends AdditionalInfo {
    override additionalDetails$: Observable<any>;
    printWorker: boolean = false;
    containerWidth: number = 660;
    containerHeight: number = 260;

    transactionAdditionalDetailsSum: number;

    readonly transTypeChangePrompt: {
        data: {
            transTypeName: string;
            transName: string;
            transTypeId: string;
            companyId: string;
            transId: string;
            biziboxMutavId: string;
            companyAccountId: string;
        };
        apply: () => void;
    };

    constructor(
        private restCommonService: RestCommonService,
        private reportService: ReportService,
        private sanitizer: DomSanitizer,
        private translate: TranslateService,
        el: ElementRef,
        public router: Router,
        public override userService: UserService,
        public transTypesService: TransTypesService
    ) {
        super(el, userService);
        this.transTypeChangePrompt = {
            data: null,
            apply: () => {
            }
        };
    }

    override reload(getDataFromNew?: boolean): void {
        if (
            !this.transaction ||
            (!this.transaction.linkId &&
                (<any>this.transaction).source !== 'bankdetails' &&
                !this.transaction.splitArrayBase)
        ) {
            this.additionalDetails$ = null;
            return;
        }
        // console.log('reload --> %o', this.transaction);
        if (getDataFromNew) {
            this.refresh.emit(true);
        }
        const isSendWs =
            (this.transaction.linkId &&
                (<any>this.transaction).source !== 'bankdetails') ||
            this.transaction.splitArrayBase;
        const params = isSendWs
            ? Object.assign(
                {
                    bankTransId:
                        this.transaction.bankTransId || this.transaction.transId,
                    linkId: this.transaction.linkId,
                    companyAccountId: this.transaction.companyAccountId
                },
                this.isJournal
                    ? {
                        journal: true
                    }
                    : {}
            )
            : {};
        if (this.transaction.splitArrayBase) {
            params['bankdetailId'] = this.transaction['bankdetailId'];
        }
        const dataObs = isSendWs
            ? this.restCommonService.getPerutBankdetail(params)
            : of({
                body: [
                    {
                        accountnumber: (<any>this.transaction).accountnumber,
                        accounttransfernumber: (<any>this.transaction)
                            .accounttransfernumber,
                        banknumber: (<any>this.transaction).banknumber,
                        banktransfernumber: (<any>this.transaction).banktransfernumber,
                        branchnumber: (<any>this.transaction).branchnumber,
                        branchtransfernumber: (<any>this.transaction).banktransfernumber,
                        depositetransferdate: (<any>this.transaction)
                            .depositetransferdate,
                        detailstransfer: (<any>this.transaction).detailstransfer,
                        namepayertransfer: (<any>this.transaction).namepayertransfer,
                        transTypeId: (<any>this.transaction).transTypeId,
                        transfertotal: (<any>this.transaction).transfertotal
                    }
                ]
            });

        this.additionalDetails$ = combineLatest(
          [
              dataObs,
              this.transTypesService.selectedCompanyTransTypes
          ]
        ).pipe(
            map(([rslt, categories]) => {
                const adtnlsArr = rslt && !rslt.error ? rslt['body'] : null;
                if (Array.isArray(adtnlsArr) && adtnlsArr.length > 1) {
                    adtnlsArr.forEach(
                        (row) =>
                            (row.transType = row.transTypeId
                                ? (row.transType = categories.find(
                                    (cat) => cat.transTypeId === row.transTypeId
                                ))
                                : null)
                    );
                }
                return adtnlsArr;
            }),
            tap((adtnlsArr) => {
                if (Array.isArray(adtnlsArr)) {
                    adtnlsArr
                        .filter((adtnl) => adtnl.detailstransfer)
                        .forEach((adtnl) => {
                            if (adtnl.detailstransfer.startsWith('{')) {
                                try {
                                    const detailstransferJson = JSON.parse(adtnl.detailstransfer);
                                    adtnl.detailsContentType = 'json';
                                    adtnl.detailstransfer = Object.entries(
                                        detailstransferJson
                                    ).map((keyvalArr) => {
                                        return {
                                            key: keyvalArr[0],
                                            value: keyvalArr[1]
                                        };
                                    });
                                } catch (e) {
                                }
                            }

                            if (
                                !('detailsContentType' in adtnl) &&
                                adtnl.detailstransfer.startsWith('<')
                            ) {
                                adtnl.detailstransfer = this.sanitizer.bypassSecurityTrustHtml(
                                    adtnl.detailstransfer
                                );
                                // .sanitize(SecurityContext.HTML, rslt.body[0].detailstransfer);
                                adtnl.detailsContentType = 'html';
                            }
                        });
                }
                this.containerWidth =
                    Array.isArray(adtnlsArr) && adtnlsArr.length > 1
                        ? this.isJournal
                            ? 535 + (this.isCustIdCards ? 128 : 0)
                            : 800
                        : 660;
                this.containerHeight = 260;
                if (!adtnlsArr || adtnlsArr.length === 0) {
                    this.transactionAdditionalDetailsSum = 0;
                    this.containerHeight = 120;
                } else {
                    this.transactionAdditionalDetailsSum = adtnlsArr[0].hasOwnProperty(
                        'transfertotal'
                    )
                        ? adtnlsArr.reduceRight((acc, item) => acc + item.transfertotal, 0)
                        : adtnlsArr.reduceRight((acc, item) => acc + item.chequeTotal, 0);

                    this.containerHeight =
                        'detailsContentType' in adtnlsArr[0] ||
                        (adtnlsArr[0].detailstransfer &&
                            adtnlsArr[0].detailstransfer.length > 200)
                            ? 470
                            : adtnlsArr.length > 1
                                ? 360
                                : 260;
                }
            }),
            publishRef,
            first()
        );
    }

    getCustName(custId: any) {
        if (
            custId &&
            this.companyCustomerDetails &&
            this.companyCustomerDetails.length
        ) {
            const getCust = this.companyCustomerDetails.find(
                (cust) => cust.custId === custId
            );
            if (getCust && getCust.custLastName) {
                return getCust.custLastName;
            }
        }
        return null;
    }

    exportAdditionalDetails(resultFileType: string): void {
        this.additionalDetails$
            .pipe(
                switchMap((adtnlsArr: any[]) =>
                    this.reportService.getReport(
                        adtnlsArr.length === 1
                            ? 'SINGLE_BANK_TRANS'
                            : 'MULTIPLE_BANK_TRANS',
                        {
                            additionalProperties: {
                                accountNum: this.transaction.account.accountNickname,
                                transDate: new Date(this.transaction.transDate).toISOString(),
                                expence: this.transaction.hova
                            },
                            data: {
                                report: adtnlsArr.length === 1 ? adtnlsArr[0] : adtnlsArr
                            }
                        },
                        resultFileType,
                        this.getAdditionalItemFilename()
                    )
                ),
                first()
            )
            .subscribe(() => {
            });
    }

    printAdditionalDetails(): void {
        this.printWorker = true;
        setTimeout(() => {
            BrowserService.printHtml(
                (document.getElementsByClassName(
                        'additional-details-transfer-one'
                    )[0] ||
                    document.getElementsByClassName(
                        'additional-details-transfer'
                    )[0]) as HTMLElement,
                this.getAdditionalItemFilename()
            );
            setTimeout(() => {
                this.printWorker = false;
            }, 200);
        }, 10);
    }

    private getAdditionalItemFilename() {
        return [
            'העברה',
            this.transaction.hova ? 'מחשבון' : 'לחשבון',
            this.transaction.account.accountNickname,
            'על סך',
            this.transaction.total,
            'מתאריך',
            new Date(this.transaction.transDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                year: '2-digit',
                month: '2-digit'
            })
        ].join(' ');
    }

    promptForTransTypeChangeApply(
        item: any,
        event: { originalEvent: Event; value: any }
    ) {
        console.log('transTypeChangeApply ->> item: %o, event: %o', item, event);
        this.transTypeChangePrompt.data = {
            transName: item.namepayertransfer,
            transTypeName: event.value.transTypeName,
            transTypeId: event.value.transTypeId,
            companyId: this.userService.appData.userData.companySelect.companyId,
            transId: item.transId,
            biziboxMutavId: item.biziboxMutavId,
            companyAccountId: this.transaction.companyAccountId
        };
        // this.transTypeChangePrompt.apply = () => {};
    }

    companyGetCustomerEmit(row) {
        this.companyGetCustomer.emit(row);
    }
}
