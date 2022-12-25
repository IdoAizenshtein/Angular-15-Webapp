import {Component, ElementRef, ViewEncapsulation} from '@angular/core';
import {AdditionalInfo} from '../additional-info';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {ReportService} from '@app/core/report.service';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {combineLatest, Observable, zip} from 'rxjs';
import {first, map, switchMap, tap} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {TransTypesService} from '@app/core/transTypes.service';
import {Router} from '@angular/router';
import {publishRef} from '../../../functions/publishRef';

@Component({
    selector: 'app-union-view',
    templateUrl: './union-view.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class UnionViewComponent extends AdditionalInfo {
    override additionalDetails$: Observable<any>;

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

    override reload(): void {
        // console.log('reload --> %o', this.transaction);
        if (!this.transaction || !this.transaction.unionId) {
            this.additionalDetails$ = null;
            return;
        }

        const dataObs = this.restCommonService.getUnionBankdetail({
            transId: this.transaction.bankTransId || this.transaction.transId,
            dateFrom: this.transaction.kvuaDateFrom,
            // originalDate: this.transaction.originalDate,
            companyId: this.userService.appData.userData.companySelect.companyId
        });

        this.additionalDetails$ = combineLatest(
         [
             dataObs,
             this.transTypesService.selectedCompanyTransTypes
         ]
        ).pipe(
            map(([rslt, categories]) => {
                const adtnlsArr = rslt && !rslt.error ? rslt['body'] : null;
                if (Array.isArray(adtnlsArr) && adtnlsArr.length > 0) {
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
                this.containerWidth = 660; // Array.isArray(adtnlsArr) && adtnlsArr.length > 1 ? 800 : 660;
                this.containerHeight = 260;
                if (!adtnlsArr || adtnlsArr.length === 0) {
                    this.transactionAdditionalDetailsSum = 0;
                    this.containerHeight = 120;
                } else {
                    this.transactionAdditionalDetailsSum = adtnlsArr.reduceRight(
                        (acc, item) => acc + item.total,
                        0
                    );
                    this.containerHeight = 360; // (adtnlsArr.length > 1) ? 360 : 260;
                }
            }),
            publishRef,
            first()
        );
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
        BrowserService.printHtml(
            document.getElementsByClassName(
                'additional-details-transfer'
            )[0] as HTMLElement,
            this.getAdditionalItemFilename()
        );
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
        // console.log('promptForTransTypeChangeApply ->> item: %o, event: %o', item, event);
        // debugger;
        this.transTypeChangePrompt.data = {
            transName: item.accountMutavName,
            transTypeName: event.value.transTypeName,
            transTypeId: event.value.transTypeId,
            companyId: this.userService.appData.userData.companySelect.companyId,
            transId: item.transId,
            biziboxMutavId: item.biziboxMutavId,
            companyAccountId: this.transaction.companyAccountId
        };
        // this.transTypeChangePrompt.apply = () => {};
    }
}
