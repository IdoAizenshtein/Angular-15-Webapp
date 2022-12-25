import {Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren, ViewEncapsulation} from '@angular/core';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {DomSanitizer} from '@angular/platform-browser';
import {BrowserService} from '@app/shared/services/browser.service';
import {TranslateService} from '@ngx-translate/core';
import {ReportService} from '@app/core/report.service';
import {AdditionalInfo} from '../additional-info';
import {Dropdown} from 'primeng/dropdown';
import {UserService} from '@app/core/user.service';
import {Observable, of, Subscription} from 'rxjs';
import {map, shareReplay, switchMap, take, tap} from 'rxjs/operators';
import {Router} from '@angular/router';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-checks-view',
    templateUrl: './checks-view.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ChecksViewComponent extends AdditionalInfo implements OnDestroy {
    // @ViewChild('additionalsContainer', {read: ElementRef}) additionalsContainer: ElementRef;
    @ViewChildren('checksChain', {read: ElementRef})
    checksChainItemsRef: QueryList<ElementRef>;
    additionalBodyHasScroll = false;

    override additionalDetails$: Observable<any>;

    selectedCheck = null;
    transactionAdditionalDetailsSum: number;

    containerWidth: number = 660;
    containerHeight: number = 340;
    @ViewChild('scrollContainer') scrollContainer: ElementRef<HTMLElement>;

    printOptionStub = null;
    readonly printOptions: { label: string; value: string }[];
    private subscription: Subscription;
    public companyTransTypes: any[] = [];
    private globalListenerWhenInEdit: () => void | boolean;

    constructor(
        private restCommonService: RestCommonService,
        private reportService: ReportService,
        private sanitizer: DomSanitizer,
        public router: Router,
        private translate: TranslateService,
        protected override el: ElementRef,
        public override userService: UserService
    ) {
        super(el, userService);

        this.printOptions = [
            {
                label: "צ'ק בודד",
                value: 'singleCheck'
            },
            {
                label: "כל צ'קים",
                value: 'allChecks'
            }
        ];
    }

    override reload(): void {
        if (
            !this.transaction ||
            (!this.transaction.pictureLink && !this.transaction.splitArrayBase)
        ) {
            this.additionalDetails$ = null;
            return;
        }
        const params =
            this.transaction.source === 'checkpic'
                ? {}
                : Object.assign(
                    {
                        pictureLink: this.transaction.pictureLink,
                        companyAccountId: this.transaction.companyAccountId,
                        folderName: [
                            this.transaction.account.bankId,
                            this.transaction.account.bankSnifId,
                            this.transaction.account.bankAccountId
                        ].join(''),
                        bankTransId: this.transaction.bankTransId
                            ? this.transaction.bankTransId
                            : this.transaction.transId
                                ? this.transaction.transId
                                : this.transaction['chequePaymentId']
                                    ? this.transaction['chequePaymentId']
                                    : null
                    },
                    this.isJournal
                        ? {
                            journal: true
                        }
                        : {}
                );

        if (this.transaction.splitArrayBase) {
            params['chequePicId'] = this.transaction['chequePicId'];
        }
        console.log('reload --> %o', this.transaction);
        this.additionalDetails$ = (
            this.transaction.source === 'checkpic'
                ? of({
                    body: [
                        {
                            depositDate: this.transaction.depositDate,
                            chequeAccountNumber: this.transaction.chequeAccountNumber,
                            chequeBankNumber: this.transaction.chequeBankNumber,
                            chequeBranchNumber: this.transaction.chequeBranchNumber,
                            chequeNumber: this.transaction.chequeNumber,
                            chequeTotal: this.transaction.chequeTotal,
                            imageNameKey: this.transaction.imageNameKey,
                            image: this.transaction.image
                        }
                    ]
                })
                : this.restCommonService.getCheckDetail(params)
        ).pipe(
            map((rslt) => rslt['body']),
            tap((adtnlsArr) => {
                this.containerWidth = 660;
                this.containerHeight = 340;
                let hasChecksChain = false;
                if (!adtnlsArr || adtnlsArr.length === 0) {
                    this.transactionAdditionalDetailsSum = 0;
                    this.containerHeight = 120;
                } else {
                    adtnlsArr.forEach((trns) => {
                        trns.selectedTransType =
                            this.userService.appData.userData.companySelect.companyTransTypes.find(
                                (tt) => {
                                    return tt.transTypeId === trns.transTypeId;
                                }
                            );
                    });

                    this.transactionAdditionalDetailsSum = adtnlsArr[0].hasOwnProperty(
                        'transfertotal'
                    )
                        ? adtnlsArr.reduceRight((acc, item) => acc + item.transfertotal, 0)
                        : adtnlsArr.reduceRight((acc, item) => acc + item.chequeTotal, 0);

                    hasChecksChain =
                        adtnlsArr[0].hasOwnProperty('chequeTotal') && adtnlsArr.length > 1;
                    this.selectedCheck = adtnlsArr[0];
                    this.containerWidth = hasChecksChain
                        ? this.isJournal
                            ? 1017 + (this.isCustIdCards ? 128 : 0)
                            : 1193
                        : 660;
                }

                // this.renderer.setStyle(this.additionalsContainer.nativeElement,
                //     'width',
                //     containerWidth + 'px');
                // this.renderer.setStyle(this.additionalsContainer.nativeElement,
                //     'height',
                //     containerHeight + 'px');

                // if (hasChecksChain) {
                setTimeout(() => {
                    if (this.checksChainItemsRef && this.checksChainItemsRef.length > 0) {
                        this.checksChainItemsRef.first.nativeElement.focus();
                    } else {
                        ((this.el.nativeElement as HTMLElement)
                                .firstElementChild as HTMLElement
                        ).focus();
                    }
                }, 300);
                // }
            }),
            shareReplay(1)
        );
    }

    checkImageSourceFrom(checkData): any {
        if (checkData.image) {
            return this.sanitizer.bypassSecurityTrustUrl(
                'data:image/jpg;base64,' + checkData.image
            );
        }
        if (checkData.chequeBankNumber) {
            return `/assets/images/bank${checkData.chequeBankNumber}.png`;
        }
        return '';
    }

    changeCategory(item?: any, $event?: any) {
        // if ($event.originalEvent) {
        //     $event.originalEvent.preventDefault();
        //     $event.originalEvent.stopImmediatePropagation();
        // } else {
        //     $event.preventDefault();
        //     $event.stopImmediatePropagation();
        // }

        console.log({
            transId: item.transId,
            transTypeId: item.selectedTransType.transTypeId
        });
        this.restCommonService
            .updateCheckCategory({
                transId: item.transId,
                transTypeId: item.selectedTransType.transTypeId
            })
            .subscribe((response: any) => {
            });
    }

    companyGetCustomerEmit(row) {
        this.companyGetCustomer.emit(row);
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

    stepAdditionalCheckRow(newIndex: number, additionalDetails: any[]): boolean {
        // console.log('stepAdditionalCheckRow ==> newIndex: %o, additionalDetails: %o', newIndex, additionalDetails);
        if (newIndex === additionalDetails.length) {
            newIndex = 0;
        } else if (newIndex < 0) {
            newIndex = additionalDetails.length - 1;
        }
        this.selectedCheck = additionalDetails[newIndex];
        const slctdNative = this.checksChainItemsRef.find(
            (item, idx) => idx === newIndex
        ).nativeElement;
        slctdNative.focus({preventScroll: true});
        slctdNative.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'center'
        });
        return false;
    }

    exportAdditionalDetails(resultFileType: string): void {
        this.additionalDetails$
            .pipe(
                map((dets) => {
                    let report;
                    if (dets.length === 1) {
                        report = JSON.parse(JSON.stringify(dets[0]));
                        if (report.image) {
                            report.image = [
                                [
                                    this.transaction.account.bankId,
                                    this.transaction.account.bankSnifId,
                                    this.transaction.account.bankAccountId
                                ].join(''),
                                report.imageNameKey
                            ].join('/');
                        }
                        delete report.imageNameKey;

                        // report.chequeBankNumber = report.chequeBankNumber;
                        report.chequeBank = this.translate.instant(
                            'banks.' + report.chequeBankNumber
                        );
                    } else {
                        report = dets;
                    }

                    return report;
                }),
                switchMap((report) =>
                    this.reportService.getReport(
                        !Array.isArray(report) ? 'CHECK_DETAILS' : 'MULTIPLE_CHECK_DETAILS',
                        {
                            additionalProperties: {
                                reportDays: [
                                    this.transaction.account.accountNickname,
                                    'לתאריך',
                                    new Date(this.transaction.transDate).toLocaleDateString(
                                        'en-GB',
                                        {
                                            day: 'numeric',
                                            year: '2-digit',
                                            month: '2-digit'
                                        }
                                    )
                                ].join(' ')
                            },
                            data: {
                                report: report
                            }
                        },
                        resultFileType,
                        this.getAdditionalItemFilename()
                    )
                ),
                take(1)
            )
            .subscribe(() => {
            });
    }

    printAdditionalDetails(): void {
        BrowserService.printHtml(
            document.getElementsByClassName(
                'additional-details-check'
            )[0] as HTMLElement,
            this.getAdditionalItemFilename()
        );
    }

    private getAdditionalItemFilename() {
        return [
            "הפקדת צ'ק",
            this.transaction.hova ? 'מחשבון' : 'לחשבון',
            this.transaction.account.accountNickname,
            'לתאריך',
            new Date(this.transaction.transDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                year: '2-digit',
                month: '2-digit'
            })
        ].join(' ');
    }

    getImagSizes(uri: string): Promise<any> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.src = uri;
            image.onload = function () {
                resolve({
                    width: image.width,
                    height: image.height
                });
            };
        });
    }

    async printOptionSelected($event, dd: Dropdown, additionalDetails: any) {
        if ($event.value) {
            // console.log(this.printOptionStub, this.selectedCheck, additionalDetails);

            let doc = new jsPDF({
                orientation: 'p',
                unit: 'px',
                format: 'a4',
                putOnlyUsedFonts: true,
                hotfixes: ['px_scaling']
            });
            let width = doc.internal.pageSize.getWidth();
            let height = doc.internal.pageSize.getHeight();
            if (this.printOptionStub === 'singleCheck') {
                if (this.selectedCheck.image) {
                    const uri = 'data:image/jpg;base64,' + this.selectedCheck.image;
                    const imageBase64 = await this.getImagSizes(uri);
                    let outputWidth = imageBase64.width;
                    let outputHeight = imageBase64.height;
                    if (imageBase64.width > width || imageBase64.height > height) {
                        const inputImageAspectRatio =
                            imageBase64.width / imageBase64.height;
                        if (imageBase64.width > width) {
                            outputWidth = width;
                            outputHeight = width / inputImageAspectRatio;
                        } else if (imageBase64.height > height) {
                            outputHeight = height;
                            outputWidth = height * inputImageAspectRatio;
                        }
                    }

                    doc.addImage(
                        uri,
                        'JPEG',
                        (width - outputWidth) / 2,
                        0,
                        outputWidth,
                        outputHeight
                    );
                }
            } else {
                this.reportService.reportIsProcessingPrint$.next(true);

                for (let i = 0; i < additionalDetails.length; i++) {
                    if (additionalDetails[i].image) {
                        const uri = 'data:image/jpg;base64,' + additionalDetails[i].image;
                        const imageBase64 = await this.getImagSizes(uri);
                        let outputWidth = imageBase64.width;
                        let outputHeight = imageBase64.height;
                        if (outputWidth > outputHeight && additionalDetails.length === 1) {
                            doc = new jsPDF({
                                orientation: 'l',
                                unit: 'px',
                                format: 'a4',
                                putOnlyUsedFonts: true,
                                hotfixes: ['px_scaling']
                            });
                            width = doc.internal.pageSize.getWidth();
                            height = doc.internal.pageSize.getHeight();
                        }
                        if (imageBase64.width > width || imageBase64.height > height) {
                            const inputImageAspectRatio =
                                imageBase64.width / imageBase64.height;
                            if (imageBase64.width > width) {
                                outputWidth = width;
                                outputHeight = width / inputImageAspectRatio;
                            } else if (imageBase64.height > height) {
                                outputHeight = height;
                                outputWidth = height * inputImageAspectRatio;
                            }
                        }

                        doc.addImage(
                            uri,
                            'JPEG',
                            (width - outputWidth) / 2,
                            0,
                            outputWidth,
                            outputHeight
                        );
                        if (
                            additionalDetails.length > 1 &&
                            i + 1 !== additionalDetails.length
                        ) {
                            doc.addPage('a4', 'p');
                        }
                    }
                }
            }

            this.reportService.reportIsProcessingPrint$.next(false);
            doc.autoPrint();
            const oHiddFrame: any = document.createElement('iframe');
            oHiddFrame.style.position = 'fixed';
            oHiddFrame.style.visibility = 'hidden';
            oHiddFrame.src = doc.output('bloburl');
            document.body.appendChild(oHiddFrame);
            dd.clear($event.originalEvent);
        }
    }

    get companyId(): string {
        return this.userService.appData.userData.companySelect !== null
            ? this.userService.appData.userData.companySelect.companyId
            : null;
    }

    override ngOnDestroy(): void {
        super.ngOnDestroy();
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        if (this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit();
        }
    }
}
