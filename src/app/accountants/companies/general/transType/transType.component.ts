import {AfterContentChecked, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {UserService} from '@app/core/user.service';
import {SharedComponent} from '@app/shared/component/shared.component';
import {SharedService} from '@app/shared/services/shared.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {StorageService} from '@app/shared/services/storage.service';
import {SumPipe} from '@app/shared/pipes/sum.pipe';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {OcrService} from '@app/accountants/companies/shared/ocr.service';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {Observable, Subject} from 'rxjs';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    selector: 'app-trans-type',
    templateUrl: './transType.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TransTypeComponent
    extends ReloadServices
    implements OnDestroy, OnInit, AfterContentChecked {
    public info: any;
    public originalData: any;
    companyCustomerDetails$: Observable<any>;
    public isCapsLock = null;
    public isValidCellPart: boolean | null = null;
    public interested: boolean = false;
    public transTypeAll: any = false;
    public transType: any = false;
    public removeItemModal: any = false;
    @Input() isModal: any = false;
    @Input() showAllTypes: any = true;


    private readonly destroyed$ = new Subject<void>();

    constructor(
        public userService: UserService,
        private ocrService: OcrService,
        public override sharedComponent: SharedComponent,
        public sharedService: SharedService,
        private filterPipe: FilterPipe,
        private http: HttpClient,
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        public translate: TranslateService,
        private storageService: StorageService,
        private sumPipe: SumPipe,
        public snackBar: MatSnackBar,
        private domSanitizer: DomSanitizer,
        public router: Router,
        private cdref: ChangeDetectorRef
    ) {
        super(sharedComponent);
        this.interested = false;
        this.transType = false;
        this.transTypeAll = false;
    }

    override reload() {
        console.log('reload child');
        this.interested = false;
        this.transType = false;
        this.transTypeAll = false;
        this.ngOnInit();
    }

    ngAfterContentChecked() {
        this.cdref.detectChanges();
    }

    ngOnInit(): void {
        if (!this.isModal) {
            this.sharedComponent.getDataEvent
                .pipe(
                    startWith(true),
                    map(() =>
                        this.userService.appData &&
                        this.userService.appData.userData &&
                        this.userService.appData.userData.companySelect
                            ? this.userService.appData.userData.companySelect.companyId
                            : null
                    ),
                    filter((companyId) => !!companyId),
                    takeUntil(this.destroyed$)
                )
                .subscribe(() => {
                    this.get_transType();
                });
        } else {
            this.get_transType();
        }
    }

    get_transType() {
        this.sharedService
            .transTypeWithAutoApply({
                // this.sharedService.transType({
                uuid: this.isModal
                    ? this.isModal.companyId
                    : this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                this.transType = response ? response['body'] : response;
                this.transType.expenseData.forEach((it) => {
                    if (!it.rows.length) {
                        it.rows = [
                            {
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: {
                                    transTypeCode: null,
                                    transTypeName: null
                                },
                                transTypeName: null,
                                zikui: null
                            }
                        ];
                    } else {
                        if (!it.rows.some((item) => item.parent)) {
                            it.rows.unshift({
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: null,
                                transTypeName: null,
                                zikui: null
                            });
                        }
                        let isParentExist = false;
                        it.rows.forEach((row) => {
                            if (
                                this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                !row.empty &&
                                row.defined === false
                            ) {
                                this.changeDef(row, 'EXPENSE');
                            }

                            row.transTypeCode = {
                                transTypeCode: row.transTypeCode,
                                transTypeName: row.transTypeName
                            };
                            if (row.parent) {
                                if (!isParentExist) {
                                    isParentExist = true;
                                } else {
                                    row.parent = false;
                                }
                            }
                        });
                    }
                });
                this.transType.incomeData.forEach((it) => {
                    if (!it.rows.length) {
                        it.rows = [
                            {
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: {
                                    transTypeCode: null,
                                    transTypeName: null
                                },
                                transTypeName: null,
                                zikui: null
                            }
                        ];
                    } else {
                        if (!it.rows.some((item) => item.parent)) {
                            it.rows.unshift({
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: null,
                                transTypeName: null,
                                zikui: null
                            });
                        }
                        let isParentExist = false;
                        it.rows.forEach((row) => {
                            if (
                                this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                !row.empty &&
                                row.defined === false
                            ) {
                                this.changeDef(row, 'INCOME');
                            }
                            row.transTypeCode = {
                                transTypeCode: row.transTypeCode,
                                transTypeName: row.transTypeName
                            };
                            if (row.parent) {
                                if (!isParentExist) {
                                    isParentExist = true;
                                } else {
                                    row.parent = false;
                                }
                            }
                        });
                    }
                });
                this.transType.receiptData.forEach((it) => {
                    if (!it.rows.length) {
                        it.rows = [
                            {
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: {
                                    transTypeCode: null,
                                    transTypeName: null
                                },
                                transTypeName: null,
                                zikui: null
                            }
                        ];
                    } else {
                        if (!it.rows.some((item) => item.parent)) {
                            it.rows.unshift({
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: null,
                                transTypeName: null,
                                zikui: null
                            });
                        }
                        let isParentExist = false;
                        it.rows.forEach((row) => {
                            if (
                                this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                !row.empty &&
                                row.defined === false
                            ) {
                                this.changeDef(row, 'RECEIPT');
                            }
                            row.transTypeCode = {
                                transTypeCode: row.transTypeCode,
                                transTypeName: row.transTypeName
                            };
                            if (row.parent) {
                                if (!isParentExist) {
                                    isParentExist = true;
                                } else {
                                    row.parent = false;
                                }
                            }
                        });
                    }
                });
                this.transType.paymentsData.forEach((it) => {
                    if (!it.rows.length) {
                        it.rows = [
                            {
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: {
                                    transTypeCode: null,
                                    transTypeName: null
                                },
                                transTypeName: null,
                                zikui: null
                            }
                        ];
                    } else {
                        if (!it.rows.some((item) => item.parent)) {
                            it.rows.unshift({
                                empty: true,
                                defined: false,
                                expenseCust1: null,
                                expenseCust2: null,
                                expensePrc1: null,
                                expensePrc2: null,
                                incomeCust1: null,
                                incomeCust2: null,
                                incomePrc1: null,
                                incomePrc2: null,
                                parent: true,
                                transTypeCode: null,
                                transTypeName: null,
                                zikui: null
                            });
                        }
                        let isParentExist = false;
                        it.rows.forEach((row) => {
                            if (
                                this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                !row.empty &&
                                row.defined === false
                            ) {
                                this.changeDef(row, 'PAYMENTS');
                            }
                            row.transTypeCode = {
                                transTypeCode: row.transTypeCode,
                                transTypeName: row.transTypeName
                            };
                            if (row.parent) {
                                if (!isParentExist) {
                                    isParentExist = true;
                                } else {
                                    row.parent = false;
                                }
                            }
                        });
                    }
                });

                this.interested = this.transType.transTypeStatus !== 'NOT_INTERESTED';
                if (this.interested) {
                    const allTransTypeCode = [];

                    const allTransTypeCodeExpense = [];
                    this.transType.expenseData.forEach((item) => {
                        item.rows.forEach((row) => {
                            allTransTypeCodeExpense.push(row.transTypeCode.transTypeCode);
                        });
                    });
                    const allTransTypeCodeIncome = [];
                    this.transType.incomeData.forEach((item) => {
                        item.rows.forEach((row) => {
                            allTransTypeCodeIncome.push(row.transTypeCode.transTypeCode);
                        });
                    });
                    const allTransTypeCodeReceiptData = [];
                    this.transType.receiptData.forEach((item) => {
                        item.rows.forEach((row) => {
                            allTransTypeCodeReceiptData.push(row.transTypeCode.transTypeCode);
                        });
                    });
                    const allTransTypeCodePaymentsData = [];
                    this.transType.paymentsData.forEach((item) => {
                        item.rows.forEach((row) => {
                            allTransTypeCodePaymentsData.push(
                                row.transTypeCode.transTypeCode
                            );
                        });
                    });
                    allTransTypeCode.push(
                        ...allTransTypeCodeExpense,
                        ...allTransTypeCodeIncome,
                        ...allTransTypeCodeReceiptData,
                        ...allTransTypeCodePaymentsData
                    );

                    this.sharedService
                        .transTypeAll({
                            uuid: this.isModal
                                ? this.isModal.companyId
                                : this.userService.appData.userData.companySelect.companyId
                        })
                        .subscribe((responseAll) => {
                            this.transTypeAll = responseAll
                                ? responseAll['body']
                                : responseAll;
                            this.transType.expenseData.forEach((it) => {
                                it.rows.forEach((row) => {
                                    let ddOpt = this.transTypeAll.expenseData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                            if (rw.otherTypes === false) {
                                                if (
                                                    rw.transTypeCode === row.transTypeCode.transTypeCode
                                                ) {
                                                    return rw;
                                                } else {
                                                    if (
                                                        !allTransTypeCode.some(
                                                            (rwChild) => rwChild === rw.transTypeCode
                                                        )
                                                    ) {
                                                        return rw;
                                                    }
                                                }
                                            }
                                        })
                                        .map((ele) => {
                                            return {
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            };
                                        });
                                    let lenOfOtherTypesFalse = ddOpt.length;
                                    let isFirstOthers = true;
                                    this.transTypeAll.expenseData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                        if (rw.otherTypes === true) {
                                            if (
                                                rw.transTypeCode === row.transTypeCode.transTypeCode
                                            ) {
                                                lenOfOtherTypesFalse = true;
                                                return rw;
                                            } else {
                                                if (
                                                    !allTransTypeCode.some(
                                                        (rwChild) => rwChild === rw.transTypeCode
                                                    )
                                                ) {
                                                    return rw;
                                                }
                                            }
                                        }
                                    })
                                        .forEach((ele) => {
                                            ddOpt.push({
                                                isFirstHistory: isFirstOthers,
                                                isHistory: true,
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            });
                                            isFirstOthers = false;
                                        });
                                    if (lenOfOtherTypesFalse) {
                                        ddOpt.unshift({
                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                            transTypeName: null
                                        });
                                    }
                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                        ddOpt[0].disabled = true;
                                    }
                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                    row.optionsParent = ddOpt.filter(
                                        (item) =>
                                            !item.originValue ||
                                            (item.originValue && item.originValue.parent)
                                    );
                                });
                            });
                            this.transType.incomeData.forEach((it) => {
                                it.rows.forEach((row) => {
                                    let ddOpt = this.transTypeAll.incomeData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                            if (rw.otherTypes === false) {
                                                if (
                                                    rw.transTypeCode === row.transTypeCode.transTypeCode
                                                ) {
                                                    return rw;
                                                } else {
                                                    if (
                                                        !allTransTypeCode.some(
                                                            (rwChild) => rwChild === rw.transTypeCode
                                                        )
                                                    ) {
                                                        return rw;
                                                    }
                                                }
                                            }
                                        })
                                        .map((ele) => {
                                            return {
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            };
                                        });
                                    let lenOfOtherTypesFalse = ddOpt.length;
                                    let isFirstOthers = true;
                                    this.transTypeAll.incomeData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                        if (rw.otherTypes === true) {
                                            if (
                                                rw.transTypeCode === row.transTypeCode.transTypeCode
                                            ) {
                                                lenOfOtherTypesFalse = true;
                                                return rw;
                                            } else {
                                                if (
                                                    !allTransTypeCode.some(
                                                        (rwChild) => rwChild === rw.transTypeCode
                                                    )
                                                ) {
                                                    return rw;
                                                }
                                            }
                                        }
                                    })
                                        .forEach((ele) => {
                                            ddOpt.push({
                                                isFirstHistory: isFirstOthers,
                                                isHistory: true,
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            });
                                            isFirstOthers = false;
                                        });
                                    if (lenOfOtherTypesFalse) {
                                        ddOpt.unshift({
                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                            transTypeName: null
                                        });
                                    }
                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                        ddOpt[0].disabled = true;
                                    }
                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                    row.optionsParent = ddOpt.filter(
                                        (item) =>
                                            !item.originValue ||
                                            (item.originValue && item.originValue.parent)
                                    );
                                });
                            });
                            this.transType.receiptData.forEach((it) => {
                                it.rows.forEach((row) => {
                                    let ddOpt = this.transTypeAll.receiptData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                            if (rw.otherTypes === false) {
                                                if (
                                                    rw.transTypeCode === row.transTypeCode.transTypeCode
                                                ) {
                                                    return rw;
                                                } else {
                                                    if (
                                                        !allTransTypeCode.some(
                                                            (rwChild) => rwChild === rw.transTypeCode
                                                        )
                                                    ) {
                                                        return rw;
                                                    }
                                                }
                                            }
                                        })
                                        .map((ele) => {
                                            return {
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            };
                                        });
                                    let lenOfOtherTypesFalse = ddOpt.length;
                                    let isFirstOthers = true;
                                    this.transTypeAll.receiptData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                        if (rw.otherTypes === true) {
                                            if (
                                                rw.transTypeCode === row.transTypeCode.transTypeCode
                                            ) {
                                                lenOfOtherTypesFalse = true;
                                                return rw;
                                            } else {
                                                if (
                                                    !allTransTypeCode.some(
                                                        (rwChild) => rwChild === rw.transTypeCode
                                                    )
                                                ) {
                                                    return rw;
                                                }
                                            }
                                        }
                                    })
                                        .forEach((ele) => {
                                            ddOpt.push({
                                                isFirstHistory: isFirstOthers,
                                                isHistory: true,
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            });
                                            isFirstOthers = false;
                                        });
                                    if (lenOfOtherTypesFalse) {
                                        ddOpt.unshift({
                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                            transTypeName: null
                                        });
                                    }
                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                        ddOpt[0].disabled = true;
                                    }
                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                    row.optionsParent = ddOpt.filter(
                                        (item) =>
                                            !item.originValue ||
                                            (item.originValue && item.originValue.parent)
                                    );
                                });
                            });
                            this.transType.paymentsData.forEach((it) => {
                                it.rows.forEach((row) => {
                                    let ddOpt = this.transTypeAll.paymentsData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                            if (rw.otherTypes === false) {
                                                if (
                                                    rw.transTypeCode === row.transTypeCode.transTypeCode
                                                ) {
                                                    return rw;
                                                } else {
                                                    if (
                                                        !allTransTypeCode.some(
                                                            (rwChild) => rwChild === rw.transTypeCode
                                                        )
                                                    ) {
                                                        return rw;
                                                    }
                                                }
                                            }
                                        })
                                        .map((ele) => {
                                            return {
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            };
                                        });
                                    let lenOfOtherTypesFalse = ddOpt.length;
                                    let isFirstOthers = true;
                                    this.transTypeAll.paymentsData
                                        .find((item) => item.desc === it.desc)
                                        .rows.filter((rw) => {
                                        if (rw.otherTypes === true) {
                                            if (
                                                rw.transTypeCode === row.transTypeCode.transTypeCode
                                            ) {
                                                lenOfOtherTypesFalse = true;
                                                return rw;
                                            } else {
                                                if (
                                                    !allTransTypeCode.some(
                                                        (rwChild) => rwChild === rw.transTypeCode
                                                    )
                                                ) {
                                                    return rw;
                                                }
                                            }
                                        }
                                    })
                                        .forEach((ele) => {
                                            ddOpt.push({
                                                isFirstHistory: isFirstOthers,
                                                isHistory: true,
                                                transTypeCode: ele.transTypeCode,
                                                transTypeName: ele.transTypeName,
                                                originValue: ele
                                            });
                                            isFirstOthers = false;
                                        });
                                    if (lenOfOtherTypesFalse) {
                                        ddOpt.unshift({
                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                            transTypeName: null
                                        });
                                    }
                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                        ddOpt[0].disabled = true;
                                    }
                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                    row.optionsParent = ddOpt.filter(
                                        (item) =>
                                            !item.originValue ||
                                            (item.originValue && item.originValue.parent)
                                    );
                                });
                            });
                            // console.log(this.transType.receiptData)
                            // debugger
                        });
                } else {
                    if (
                        this.storageService.sessionStorageGetterItem(
                            'onChangeValInterested'
                        )
                    ) {
                        this.onChangeValInterested(true);
                        this.storageService.sessionStorageRemoveItem(
                            'onChangeValInterested'
                        );
                    }
                }
            });
    }

    addCancelOpt(options: any, transTypeCode: any) {
        const isCancelExist = options.some(it => it.transTypeCode === 'ללא');
        const isHistoryTitleExist = options.some(it => it.transTypeCode === 'סוגי תנועה נוספים');
        if (options && options.length && options[0].isHistory && !isHistoryTitleExist) {
            options.unshift({
                transTypeCode: 'סוגי תנועה נוספים',
                transTypeName: 'title',
                disabled: true
            });
        }
        if (transTypeCode && transTypeCode.transTypeName && !isCancelExist) {
            options.unshift({
                transTypeCode: 'ללא',
                transTypeName: null
            });
            return options;
        } else {
            if (transTypeCode.transTypeCode === null) {
                options.unshift({
                    transTypeCode: null,
                    transTypeName: 'test',
                    disabled: !options.length
                });
            }
            if (isCancelExist) {
                return options.filter(it => it.transTypeCode !== 'ללא');
            } else {
                return options;
            }
        }
    }

    onChangeValInterested(interested: boolean) {
        this.sharedService
            .updateTransTypeStatus({
                companyId: this.isModal
                    ? this.isModal.companyId
                    : this.userService.appData.userData.companySelect.companyId,
                interested: interested
            })
            .subscribe((responseAll1) => {
                if (interested) {
                    this.sharedService
                        .transTypeWithAutoApply({
                            // this.sharedService.transType({
                            uuid: this.isModal
                                ? this.isModal.companyId
                                : this.userService.appData.userData.companySelect.companyId
                        })
                        .subscribe((response: any) => {
                            this.transType = response ? response['body'] : response;
                            this.interested =
                                this.transType.transTypeStatus !== 'NOT_INTERESTED';
                            if (this.interested && !this.transTypeAll) {
                                const allTransTypeCode = [];

                                const allTransTypeCodeExpense = [];
                                this.transType.expenseData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodeExpense.push(row.transTypeCode);
                                    });
                                });
                                const allTransTypeCodeIncome = [];
                                this.transType.incomeData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodeIncome.push(row.transTypeCode);
                                    });
                                });
                                const allTransTypeCodeReceiptData = [];
                                this.transType.receiptData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodeReceiptData.push(row.transTypeCode);
                                    });
                                });
                                const allTransTypeCodePaymentsData = [];
                                this.transType.paymentsData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodePaymentsData.push(row.transTypeCode);
                                    });
                                });
                                allTransTypeCode.push(
                                    ...allTransTypeCodeExpense,
                                    ...allTransTypeCodeIncome,
                                    ...allTransTypeCodeReceiptData,
                                    ...allTransTypeCodePaymentsData
                                );

                                this.sharedService
                                    .transTypeAll({
                                        uuid: this.isModal
                                            ? this.isModal.companyId
                                            : this.userService.appData.userData.companySelect
                                                .companyId
                                    })
                                    .subscribe((responseAll) => {
                                        this.transTypeAll = responseAll
                                            ? responseAll['body']
                                            : responseAll;
                                        this.transType.expenseData.forEach((it) => {
                                            if (!it.rows.length) {
                                                it.rows = [
                                                    {
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    }
                                                ];
                                            } else {
                                                if (!it.rows.some((item) => item.parent)) {
                                                    it.rows.unshift({
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    });
                                                }
                                                let isParentExist = false;
                                                it.rows.forEach((row) => {
                                                    if (
                                                        this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                                        !row.empty &&
                                                        row.defined === false
                                                    ) {
                                                        this.changeDef(row, 'EXPENSE');
                                                    }
                                                    row.transTypeCode = {
                                                        transTypeCode: row.transTypeCode,
                                                        transTypeName: row.transTypeName
                                                    };
                                                    if (row.parent) {
                                                        if (!isParentExist) {
                                                            isParentExist = true;
                                                        } else {
                                                            row.parent = false;
                                                        }
                                                    }
                                                });
                                            }

                                            if (this.transTypeAll) {
                                                it.rows.forEach((row) => {
                                                    let ddOpt = this.transTypeAll.expenseData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                            if (rw.otherTypes === false) {
                                                                if (
                                                                    rw.transTypeCode ===
                                                                    (row.transTypeCode.transTypeCode
                                                                        ? row.transTypeCode.transTypeCode
                                                                        : row.transTypeCode)
                                                                ) {
                                                                    return rw;
                                                                } else {
                                                                    if (
                                                                        !allTransTypeCode.some(
                                                                            (rwChild) => rwChild === rw.transTypeCode
                                                                        )
                                                                    ) {
                                                                        return rw;
                                                                    }
                                                                }
                                                            }
                                                        })
                                                        .map((ele) => {
                                                            return {
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            };
                                                        });
                                                    let lenOfOtherTypesFalse = ddOpt.length;
                                                    let isFirstOthers = true;
                                                    this.transTypeAll.expenseData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                        if (rw.otherTypes === true) {
                                                            if (
                                                                rw.transTypeCode ===
                                                                (row.transTypeCode.transTypeCode
                                                                    ? row.transTypeCode.transTypeCode
                                                                    : row.transTypeCode)
                                                            ) {
                                                                lenOfOtherTypesFalse = true;
                                                                return rw;
                                                            } else {
                                                                if (
                                                                    !allTransTypeCode.some(
                                                                        (rwChild) => rwChild === rw.transTypeCode
                                                                    )
                                                                ) {
                                                                    return rw;
                                                                }
                                                            }
                                                        }
                                                    })
                                                        .forEach((ele) => {
                                                            ddOpt.push({
                                                                isFirstHistory: isFirstOthers,
                                                                isHistory: true,
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            });
                                                            isFirstOthers = false;
                                                        });
                                                    if (lenOfOtherTypesFalse) {
                                                        ddOpt.unshift({
                                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                                            transTypeName: null
                                                        });
                                                    }
                                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                        ddOpt[0].disabled = true;
                                                    }
                                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                                    row.optionsParent = ddOpt.filter(
                                                        (item) =>
                                                            !item.originValue ||
                                                            (item.originValue && item.originValue.parent)
                                                    );
                                                });
                                            }
                                        });
                                        this.transType.incomeData.forEach((it) => {
                                            if (!it.rows.length) {
                                                it.rows = [
                                                    {
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    }
                                                ];
                                            } else {
                                                if (!it.rows.some((item) => item.parent)) {
                                                    it.rows.unshift({
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    });
                                                }
                                                let isParentExist = false;
                                                it.rows.forEach((row) => {
                                                    if (
                                                        this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                                        !row.empty &&
                                                        row.defined === false
                                                    ) {
                                                        this.changeDef(row, 'INCOME');
                                                    }
                                                    row.transTypeCode = {
                                                        transTypeCode: row.transTypeCode,
                                                        transTypeName: row.transTypeName
                                                    };
                                                    if (row.parent) {
                                                        if (!isParentExist) {
                                                            isParentExist = true;
                                                        } else {
                                                            row.parent = false;
                                                        }
                                                    }
                                                });
                                            }
                                            if (this.transTypeAll) {
                                                it.rows.forEach((row) => {
                                                    let ddOpt = this.transTypeAll.incomeData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                            if (rw.otherTypes === false) {
                                                                if (
                                                                    rw.transTypeCode ===
                                                                    (row.transTypeCode.transTypeCode
                                                                        ? row.transTypeCode.transTypeCode
                                                                        : row.transTypeCode)
                                                                ) {
                                                                    return rw;
                                                                } else {
                                                                    if (
                                                                        !allTransTypeCode.some(
                                                                            (rwChild) => rwChild === rw.transTypeCode
                                                                        )
                                                                    ) {
                                                                        return rw;
                                                                    }
                                                                }
                                                            }
                                                        })
                                                        .map((ele) => {
                                                            return {
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            };
                                                        });
                                                    let lenOfOtherTypesFalse = ddOpt.length;
                                                    let isFirstOthers = true;
                                                    this.transTypeAll.incomeData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                        if (rw.otherTypes === true) {
                                                            if (
                                                                rw.transTypeCode ===
                                                                (row.transTypeCode.transTypeCode
                                                                    ? row.transTypeCode.transTypeCode
                                                                    : row.transTypeCode)
                                                            ) {
                                                                lenOfOtherTypesFalse = true;
                                                                return rw;
                                                            } else {
                                                                if (
                                                                    !allTransTypeCode.some(
                                                                        (rwChild) => rwChild === rw.transTypeCode
                                                                    )
                                                                ) {
                                                                    return rw;
                                                                }
                                                            }
                                                        }
                                                    })
                                                        .forEach((ele) => {
                                                            ddOpt.push({
                                                                isFirstHistory: isFirstOthers,
                                                                isHistory: true,
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            });
                                                            isFirstOthers = false;
                                                        });

                                                    if (lenOfOtherTypesFalse) {
                                                        ddOpt.unshift({
                                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                                            transTypeName: null
                                                        });
                                                    }
                                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                        ddOpt[0].disabled = true;
                                                    }
                                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                                    row.optionsParent = ddOpt.filter(
                                                        (item) =>
                                                            !item.originValue ||
                                                            (item.originValue && item.originValue.parent)
                                                    );
                                                });
                                            }
                                        });
                                        this.transType.receiptData.forEach((it) => {
                                            if (!it.rows.length) {
                                                it.rows = [
                                                    {
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    }
                                                ];
                                            } else {
                                                if (!it.rows.some((item) => item.parent)) {
                                                    it.rows.unshift({
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    });
                                                }
                                                let isParentExist = false;
                                                it.rows.forEach((row) => {
                                                    if (
                                                        this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                                        !row.empty &&
                                                        row.defined === false
                                                    ) {
                                                        this.changeDef(row, 'RECEIPT');
                                                    }
                                                    row.transTypeCode = {
                                                        transTypeCode: row.transTypeCode,
                                                        transTypeName: row.transTypeName
                                                    };
                                                    if (row.parent) {
                                                        if (!isParentExist) {
                                                            isParentExist = true;
                                                        } else {
                                                            row.parent = false;
                                                        }
                                                    }
                                                });
                                            }
                                            if (this.transTypeAll) {
                                                it.rows.forEach((row) => {
                                                    let ddOpt = this.transTypeAll.receiptData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                            if (rw.otherTypes === false) {
                                                                if (
                                                                    rw.transTypeCode ===
                                                                    (row.transTypeCode.transTypeCode
                                                                        ? row.transTypeCode.transTypeCode
                                                                        : row.transTypeCode)
                                                                ) {
                                                                    return rw;
                                                                } else {
                                                                    if (
                                                                        !allTransTypeCode.some(
                                                                            (rwChild) => rwChild === rw.transTypeCode
                                                                        )
                                                                    ) {
                                                                        return rw;
                                                                    }
                                                                }
                                                            }
                                                        })
                                                        .map((ele) => {
                                                            return {
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            };
                                                        });
                                                    let lenOfOtherTypesFalse = ddOpt.length;
                                                    let isFirstOthers = true;
                                                    this.transTypeAll.receiptData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                        if (rw.otherTypes === true) {
                                                            if (
                                                                rw.transTypeCode ===
                                                                (row.transTypeCode.transTypeCode
                                                                    ? row.transTypeCode.transTypeCode
                                                                    : row.transTypeCode)
                                                            ) {
                                                                lenOfOtherTypesFalse = true;
                                                                return rw;
                                                            } else {
                                                                if (
                                                                    !allTransTypeCode.some(
                                                                        (rwChild) => rwChild === rw.transTypeCode
                                                                    )
                                                                ) {
                                                                    return rw;
                                                                }
                                                            }
                                                        }
                                                    })
                                                        .forEach((ele) => {
                                                            ddOpt.push({
                                                                isFirstHistory: isFirstOthers,
                                                                isHistory: true,
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            });
                                                            isFirstOthers = false;
                                                        });

                                                    if (lenOfOtherTypesFalse) {
                                                        ddOpt.unshift({
                                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                                            transTypeName: null
                                                        });
                                                    }
                                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                        ddOpt[0].disabled = true;
                                                    }
                                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                                    row.optionsParent = ddOpt.filter(
                                                        (item) =>
                                                            !item.originValue ||
                                                            (item.originValue && item.originValue.parent)
                                                    );
                                                });
                                            }
                                        });
                                        this.transType.paymentsData.forEach((it) => {
                                            if (!it.rows.length) {
                                                it.rows = [
                                                    {
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    }
                                                ];
                                            } else {
                                                if (!it.rows.some((item) => item.parent)) {
                                                    it.rows.unshift({
                                                        empty: true,
                                                        defined: false,
                                                        expenseCust1: null,
                                                        expenseCust2: null,
                                                        expensePrc1: null,
                                                        expensePrc2: null,
                                                        incomeCust1: null,
                                                        incomeCust2: null,
                                                        incomePrc1: null,
                                                        incomePrc2: null,
                                                        parent: true,
                                                        transTypeCode: {
                                                            transTypeCode: null,
                                                            transTypeName: null
                                                        },
                                                        transTypeName: null,
                                                        zikui: null
                                                    });
                                                }
                                                let isParentExist = false;
                                                it.rows.forEach((row) => {
                                                    if (
                                                        this.transType.transTypeStatus === 'NOT_DEFINED' &&
                                                        !row.empty &&
                                                        row.defined === false
                                                    ) {
                                                        this.changeDef(row, 'PAYMENTS');
                                                    }
                                                    row.transTypeCode = {
                                                        transTypeCode: row.transTypeCode,
                                                        transTypeName: row.transTypeName
                                                    };
                                                    if (row.parent) {
                                                        if (!isParentExist) {
                                                            isParentExist = true;
                                                        } else {
                                                            row.parent = false;
                                                        }
                                                    }
                                                });
                                            }
                                            if (this.transTypeAll) {
                                                it.rows.forEach((row) => {
                                                    let ddOpt = this.transTypeAll.paymentsData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                            if (rw.otherTypes === false) {
                                                                if (
                                                                    rw.transTypeCode ===
                                                                    (row.transTypeCode.transTypeCode
                                                                        ? row.transTypeCode.transTypeCode
                                                                        : row.transTypeCode)
                                                                ) {
                                                                    return rw;
                                                                } else {
                                                                    if (
                                                                        !allTransTypeCode.some(
                                                                            (rwChild) => rwChild === rw.transTypeCode
                                                                        )
                                                                    ) {
                                                                        return rw;
                                                                    }
                                                                }
                                                            }
                                                        })
                                                        .map((ele) => {
                                                            return {
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            };
                                                        });
                                                    let lenOfOtherTypesFalse = ddOpt.length;
                                                    let isFirstOthers = true;
                                                    this.transTypeAll.paymentsData
                                                        .find((item) => item.desc === it.desc)
                                                        .rows.filter((rw) => {
                                                        if (rw.otherTypes === true) {
                                                            if (
                                                                rw.transTypeCode ===
                                                                (row.transTypeCode.transTypeCode
                                                                    ? row.transTypeCode.transTypeCode
                                                                    : row.transTypeCode)
                                                            ) {
                                                                lenOfOtherTypesFalse = true;
                                                                return rw;
                                                            } else {
                                                                if (
                                                                    !allTransTypeCode.some(
                                                                        (rwChild) => rwChild === rw.transTypeCode
                                                                    )
                                                                ) {
                                                                    return rw;
                                                                }
                                                            }
                                                        }
                                                    })
                                                        .forEach((ele) => {
                                                            ddOpt.push({
                                                                isFirstHistory: isFirstOthers,
                                                                isHistory: true,
                                                                transTypeCode: ele.transTypeCode,
                                                                transTypeName: ele.transTypeName,
                                                                originValue: ele
                                                            });
                                                            isFirstOthers = false;
                                                        });
                                                    if (lenOfOtherTypesFalse) {
                                                        ddOpt.unshift({
                                                            transTypeCode: ddOpt.length ? 'ללא' : null,
                                                            transTypeName: null
                                                        });
                                                    }
                                                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                        ddOpt[0].disabled = true;
                                                    }
                                                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                                    row.optionsParent = ddOpt.filter(
                                                        (item) =>
                                                            !item.originValue ||
                                                            (item.originValue && item.originValue.parent)
                                                    );
                                                });
                                            }
                                        });
                                    });
                            } else {
                                const allTransTypeCode = [];
                                const allTransTypeCodeExpense = [];
                                this.transType.expenseData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodeExpense.push(row.transTypeCode);
                                    });
                                });
                                const allTransTypeCodeIncome = [];
                                this.transType.incomeData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodeIncome.push(row.transTypeCode);
                                    });
                                });
                                const allTransTypeCodeReceiptData = [];
                                this.transType.receiptData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodeReceiptData.push(row.transTypeCode);
                                    });
                                });
                                const allTransTypeCodePaymentsData = [];
                                this.transType.paymentsData.forEach((item) => {
                                    item.rows.forEach((row) => {
                                        allTransTypeCodePaymentsData.push(row.transTypeCode);
                                    });
                                });
                                allTransTypeCode.push(
                                    ...allTransTypeCodeExpense,
                                    ...allTransTypeCodeIncome,
                                    ...allTransTypeCodeReceiptData,
                                    ...allTransTypeCodePaymentsData
                                );

                                this.transType.expenseData.forEach((it) => {
                                    if (!it.rows.length) {
                                        it.rows = [
                                            {
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            }
                                        ];
                                    } else {
                                        if (!it.rows.some((item) => item.parent)) {
                                            it.rows.unshift({
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            });
                                        }
                                        let isParentExist = false;
                                        it.rows.forEach((row) => {
                                            row.transTypeCode = {
                                                transTypeCode: row.transTypeCode,
                                                transTypeName: row.transTypeName
                                            };
                                            if (row.parent) {
                                                if (!isParentExist) {
                                                    isParentExist = true;
                                                } else {
                                                    row.parent = false;
                                                }
                                            }
                                        });
                                    }

                                    if (this.transTypeAll) {
                                        it.rows.forEach((row) => {
                                            let ddOpt = this.transTypeAll.expenseData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                    if (rw.otherTypes === false) {
                                                        if (
                                                            rw.transTypeCode ===
                                                            (row.transTypeCode.transTypeCode
                                                                ? row.transTypeCode.transTypeCode
                                                                : row.transTypeCode)
                                                        ) {
                                                            return rw;
                                                        } else {
                                                            if (
                                                                !allTransTypeCode.some(
                                                                    (rwChild) => rwChild === rw.transTypeCode
                                                                )
                                                            ) {
                                                                return rw;
                                                            }
                                                        }
                                                    }
                                                })
                                                .map((ele) => {
                                                    return {
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    };
                                                });
                                            let lenOfOtherTypesFalse = ddOpt.length;
                                            let isFirstOthers = true;
                                            this.transTypeAll.expenseData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                if (rw.otherTypes === true) {
                                                    if (
                                                        rw.transTypeCode ===
                                                        (row.transTypeCode.transTypeCode
                                                            ? row.transTypeCode.transTypeCode
                                                            : row.transTypeCode)
                                                    ) {
                                                        lenOfOtherTypesFalse = true;
                                                        return rw;
                                                    } else {
                                                        if (
                                                            !allTransTypeCode.some(
                                                                (rwChild) => rwChild === rw.transTypeCode
                                                            )
                                                        ) {
                                                            return rw;
                                                        }
                                                    }
                                                }
                                            })
                                                .forEach((ele) => {
                                                    ddOpt.push({
                                                        isFirstHistory: isFirstOthers,
                                                        isHistory: true,
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    });
                                                    isFirstOthers = false;
                                                });
                                            if (lenOfOtherTypesFalse) {
                                                ddOpt.unshift({
                                                    transTypeCode: ddOpt.length ? 'ללא' : null,
                                                    transTypeName: null
                                                });
                                            }
                                            if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                ddOpt[0].disabled = true;
                                            }
                                            ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                            row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                            row.optionsParent = ddOpt.filter(
                                                (item) =>
                                                    !item.originValue ||
                                                    (item.originValue && item.originValue.parent)
                                            );
                                        });
                                    }
                                });
                                this.transType.incomeData.forEach((it) => {
                                    if (!it.rows.length) {
                                        it.rows = [
                                            {
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            }
                                        ];
                                    } else {
                                        if (!it.rows.some((item) => item.parent)) {
                                            it.rows.unshift({
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            });
                                        }
                                        let isParentExist = false;
                                        it.rows.forEach((row) => {
                                            row.transTypeCode = {
                                                transTypeCode: row.transTypeCode,
                                                transTypeName: row.transTypeName
                                            };
                                            if (row.parent) {
                                                if (!isParentExist) {
                                                    isParentExist = true;
                                                } else {
                                                    row.parent = false;
                                                }
                                            }
                                        });
                                    }
                                    if (this.transTypeAll) {
                                        it.rows.forEach((row) => {
                                            let ddOpt = this.transTypeAll.incomeData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                    if (rw.otherTypes === false) {
                                                        if (
                                                            rw.transTypeCode ===
                                                            (row.transTypeCode.transTypeCode
                                                                ? row.transTypeCode.transTypeCode
                                                                : row.transTypeCode)
                                                        ) {
                                                            return rw;
                                                        } else {
                                                            if (
                                                                !allTransTypeCode.some(
                                                                    (rwChild) => rwChild === rw.transTypeCode
                                                                )
                                                            ) {
                                                                return rw;
                                                            }
                                                        }
                                                    }
                                                })
                                                .map((ele) => {
                                                    return {
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    };
                                                });
                                            let lenOfOtherTypesFalse = ddOpt.length;
                                            let isFirstOthers = true;
                                            this.transTypeAll.incomeData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                if (rw.otherTypes === true) {
                                                    if (
                                                        rw.transTypeCode ===
                                                        (row.transTypeCode.transTypeCode
                                                            ? row.transTypeCode.transTypeCode
                                                            : row.transTypeCode)
                                                    ) {
                                                        lenOfOtherTypesFalse = true;
                                                        return rw;
                                                    } else {
                                                        if (
                                                            !allTransTypeCode.some(
                                                                (rwChild) => rwChild === rw.transTypeCode
                                                            )
                                                        ) {
                                                            return rw;
                                                        }
                                                    }
                                                }
                                            })
                                                .forEach((ele) => {
                                                    ddOpt.push({
                                                        isFirstHistory: isFirstOthers,
                                                        isHistory: true,
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    });
                                                    isFirstOthers = false;
                                                });

                                            if (lenOfOtherTypesFalse) {
                                                ddOpt.unshift({
                                                    transTypeCode: ddOpt.length ? 'ללא' : null,
                                                    transTypeName: null
                                                });
                                            }
                                            if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                ddOpt[0].disabled = true;
                                            }
                                            ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                            row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                            row.optionsParent = ddOpt.filter(
                                                (item) =>
                                                    !item.originValue ||
                                                    (item.originValue && item.originValue.parent)
                                            );
                                        });
                                    }
                                });
                                this.transType.receiptData.forEach((it) => {
                                    if (!it.rows.length) {
                                        it.rows = [
                                            {
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            }
                                        ];
                                    } else {
                                        if (!it.rows.some((item) => item.parent)) {
                                            it.rows.unshift({
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            });
                                        }
                                        let isParentExist = false;
                                        it.rows.forEach((row) => {
                                            row.transTypeCode = {
                                                transTypeCode: row.transTypeCode,
                                                transTypeName: row.transTypeName
                                            };
                                            if (row.parent) {
                                                if (!isParentExist) {
                                                    isParentExist = true;
                                                } else {
                                                    row.parent = false;
                                                }
                                            }
                                        });
                                    }
                                    if (this.transTypeAll) {
                                        it.rows.forEach((row) => {
                                            let ddOpt = this.transTypeAll.receiptData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                    if (rw.otherTypes === false) {
                                                        if (
                                                            rw.transTypeCode ===
                                                            (row.transTypeCode.transTypeCode
                                                                ? row.transTypeCode.transTypeCode
                                                                : row.transTypeCode)
                                                        ) {
                                                            return rw;
                                                        } else {
                                                            if (
                                                                !allTransTypeCode.some(
                                                                    (rwChild) => rwChild === rw.transTypeCode
                                                                )
                                                            ) {
                                                                return rw;
                                                            }
                                                        }
                                                    }
                                                })
                                                .map((ele) => {
                                                    return {
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    };
                                                });
                                            let lenOfOtherTypesFalse = ddOpt.length;
                                            let isFirstOthers = true;
                                            this.transTypeAll.receiptData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                if (rw.otherTypes === true) {
                                                    if (
                                                        rw.transTypeCode ===
                                                        (row.transTypeCode.transTypeCode
                                                            ? row.transTypeCode.transTypeCode
                                                            : row.transTypeCode)
                                                    ) {
                                                        lenOfOtherTypesFalse = true;
                                                        return rw;
                                                    } else {
                                                        if (
                                                            !allTransTypeCode.some(
                                                                (rwChild) => rwChild === rw.transTypeCode
                                                            )
                                                        ) {
                                                            return rw;
                                                        }
                                                    }
                                                }
                                            })
                                                .forEach((ele) => {
                                                    ddOpt.push({
                                                        isFirstHistory: isFirstOthers,
                                                        isHistory: true,
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    });
                                                    isFirstOthers = false;
                                                });

                                            if (lenOfOtherTypesFalse) {
                                                ddOpt.unshift({
                                                    transTypeCode: ddOpt.length ? 'ללא' : null,
                                                    transTypeName: null
                                                });
                                            }
                                            if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                ddOpt[0].disabled = true;
                                            }
                                            ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                            row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                            row.optionsParent = ddOpt.filter(
                                                (item) =>
                                                    !item.originValue ||
                                                    (item.originValue && item.originValue.parent)
                                            );
                                        });
                                    }
                                });
                                this.transType.paymentsData.forEach((it) => {
                                    if (!it.rows.length) {
                                        it.rows = [
                                            {
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            }
                                        ];
                                    } else {
                                        if (!it.rows.some((item) => item.parent)) {
                                            it.rows.unshift({
                                                empty: true,
                                                defined: false,
                                                expenseCust1: null,
                                                expenseCust2: null,
                                                expensePrc1: null,
                                                expensePrc2: null,
                                                incomeCust1: null,
                                                incomeCust2: null,
                                                incomePrc1: null,
                                                incomePrc2: null,
                                                parent: true,
                                                transTypeCode: {
                                                    transTypeCode: null,
                                                    transTypeName: null
                                                },
                                                transTypeName: null,
                                                zikui: null
                                            });
                                        }
                                        let isParentExist = false;
                                        it.rows.forEach((row) => {
                                            row.transTypeCode = {
                                                transTypeCode: row.transTypeCode,
                                                transTypeName: row.transTypeName
                                            };
                                            if (row.parent) {
                                                if (!isParentExist) {
                                                    isParentExist = true;
                                                } else {
                                                    row.parent = false;
                                                }
                                            }
                                        });
                                    }
                                    if (this.transTypeAll) {
                                        it.rows.forEach((row) => {
                                            let ddOpt = this.transTypeAll.paymentsData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                    if (rw.otherTypes === false) {
                                                        if (
                                                            rw.transTypeCode ===
                                                            (row.transTypeCode.transTypeCode
                                                                ? row.transTypeCode.transTypeCode
                                                                : row.transTypeCode)
                                                        ) {
                                                            return rw;
                                                        } else {
                                                            if (
                                                                !allTransTypeCode.some(
                                                                    (rwChild) => rwChild === rw.transTypeCode
                                                                )
                                                            ) {
                                                                return rw;
                                                            }
                                                        }
                                                    }
                                                })
                                                .map((ele) => {
                                                    return {
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    };
                                                });
                                            let lenOfOtherTypesFalse = ddOpt.length;
                                            let isFirstOthers = true;
                                            this.transTypeAll.paymentsData
                                                .find((item) => item.desc === it.desc)
                                                .rows.filter((rw) => {
                                                if (rw.otherTypes === true) {
                                                    if (
                                                        rw.transTypeCode ===
                                                        (row.transTypeCode.transTypeCode
                                                            ? row.transTypeCode.transTypeCode
                                                            : row.transTypeCode)
                                                    ) {
                                                        lenOfOtherTypesFalse = true;
                                                        return rw;
                                                    } else {
                                                        if (
                                                            !allTransTypeCode.some(
                                                                (rwChild) => rwChild === rw.transTypeCode
                                                            )
                                                        ) {
                                                            return rw;
                                                        }
                                                    }
                                                }
                                            })
                                                .forEach((ele) => {
                                                    ddOpt.push({
                                                        isFirstHistory: isFirstOthers,
                                                        isHistory: true,
                                                        transTypeCode: ele.transTypeCode,
                                                        transTypeName: ele.transTypeName,
                                                        originValue: ele
                                                    });
                                                    isFirstOthers = false;
                                                });
                                            if (lenOfOtherTypesFalse) {
                                                ddOpt.unshift({
                                                    transTypeCode: ddOpt.length ? 'ללא' : null,
                                                    transTypeName: null
                                                });
                                            }
                                            if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                                                ddOpt[0].disabled = true;
                                            }
                                            ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                                            row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                                            row.optionsParent = ddOpt.filter(
                                                (item) =>
                                                    !item.originValue ||
                                                    (item.originValue && item.originValue.parent)
                                            );
                                        });
                                    }
                                });
                            }
                        });
                }
            });
    }

    addRow(
        type: string,
        desc: string,
        transTypeName: any,
        options: any,
        transTypeCode?: any,
        transClass?: any
    ) {
        const findIndexTrans = this.transType[type].findIndex((it) => {
            return it.desc === desc;
        });
        const it = this.transType[type][findIndexTrans];
        // let allTheOptUsed = true;
        const optionsNew = options.filter(
            (opt) =>
                !it.rows.some(
                    (item) => item.transTypeCode && item.transTypeCode.transTypeCode === opt.transTypeCode
                )
        );
        // options.forEach(opt => {
        //     if (!it.rows.some(item => item.transTypeCode.transTypeCode === opt.transTypeCode)) {
        //         allTheOptUsed = false;
        //     }
        // });
        const rowToAdd = {
            empty: true,
            defined: false,
            expenseCust1: null,
            expenseCust2: null,
            expensePrc1: null,
            expensePrc2: null,
            incomeCust1: null,
            incomeCust2: null,
            incomePrc1: null,
            incomePrc2: null,
            parent: false,
            transTypeCode: transTypeCode
                ? transTypeCode
                : {
                    transTypeCode: null,
                    transTypeName: null
                },
            options: this.addCancelOpt((optionsNew.length === 1 && optionsNew[0].transTypeName !== null) ||
            optionsNew.length > 1
                ? optionsNew
                : [
                    {
                        disabled: true,
                        transTypeCode: '',
                        transTypeName: 'לא מצאנו סוגי תנועה נוספים לתיאור זה'
                    }
                ], transTypeCode ? transTypeCode : {
                transTypeCode: null,
                transTypeName: null
            }),
            transTypeName: null,
            zikui: null
        };
        if (rowToAdd.options.length === 1 && rowToAdd.options[0].transTypeCode === null) {
            rowToAdd.options[0].disabled = true;
        }
        it.rows.push(rowToAdd);
        if (transTypeCode) {
            this.updateTransTypeCode(rowToAdd, transClass);
        }
    }

    onClickOptionDD(disabled?: boolean, event?: any) {
        if (disabled) {
            event.stopPropagation();
        }
    }

    removeItem(type: string, desc: string, idx: number, row: any) {
        if (row.transTypeCode.transTypeCode) {
            this.removeItemModal = {
                type,
                desc,
                idx,
                row
            };
        } else {
            this.transType[type].forEach((it) => {
                if (it.desc === desc) {
                    it.rows.splice(idx, 1);
                }
            });
        }
    }

    transTypeDelete() {
        this.sharedService
            .transTypeDelete({
                companyId: this.isModal
                    ? this.isModal.companyId
                    : this.userService.appData.userData.companySelect.companyId,
                transTypeCode: this.removeItemModal.row.transTypeCode.transTypeCode
            })
            .subscribe((responseAll) => {
                this.transType[this.removeItemModal.type].forEach((it) => {
                    if (it.desc === this.removeItemModal.desc) {
                        it.rows.splice(this.removeItemModal.idx, 1);
                    }
                });
                this.removeItemModal = false;
                this.refreshOptions();
            });
    }

    refreshOptions() {
        const allTransTypeCode = [];

        const allTransTypeCodeExpense = [];
        this.transType.expenseData.forEach((item) => {
            item.rows.forEach((row) => {
                if (row.transTypeCode) {
                    allTransTypeCodeExpense.push(row.transTypeCode.transTypeCode);
                }
            });
        });
        const allTransTypeCodeIncome = [];
        this.transType.incomeData.forEach((item) => {
            item.rows.forEach((row) => {
                if (row.transTypeCode) {
                    allTransTypeCodeIncome.push(row.transTypeCode.transTypeCode);
                }
            });
        });

        const allTransTypeCodeReceiptData = [];
        this.transType.receiptData.forEach((item) => {
            item.rows.forEach((row) => {
                if (row.transTypeCode) {
                    allTransTypeCodeReceiptData.push(row.transTypeCode.transTypeCode);
                }
            });
        });
        const allTransTypeCodePaymentsData = [];
        this.transType.paymentsData.forEach((item) => {
            item.rows.forEach((row) => {
                if (row.transTypeCode) {
                    allTransTypeCodePaymentsData.push(row.transTypeCode.transTypeCode);
                }
            });
        });
        allTransTypeCode.push(
            ...allTransTypeCodeExpense,
            ...allTransTypeCodeIncome,
            ...allTransTypeCodeReceiptData,
            ...allTransTypeCodePaymentsData
        );
        if (this.transTypeAll) {
            this.transType.expenseData.forEach((it) => {
                it.rows.forEach((row) => {
                    let ddOpt = this.transTypeAll.expenseData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                            if (rw.otherTypes === false) {
                                if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                    return rw;
                                } else {
                                    if (
                                        !allTransTypeCode.some(
                                            (rwChild) => rwChild === rw.transTypeCode
                                        )
                                    ) {
                                        return rw;
                                    }
                                }
                            }
                        })
                        .map((ele) => {
                            return {
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele
                            };
                        });
                    let lenOfOtherTypesFalse = ddOpt.length;
                    let isFirstOthers = true;
                    this.transTypeAll.expenseData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                        if (rw.otherTypes === true) {
                            if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                lenOfOtherTypesFalse = true;
                                return rw;
                            } else {
                                if (
                                    !allTransTypeCode.some(
                                        (rwChild) => rwChild === rw.transTypeCode
                                    )
                                ) {
                                    return rw;
                                }
                            }
                        }
                    })
                        .forEach((ele) => {
                            ddOpt.push({
                                isFirstHistory: isFirstOthers,
                                isHistory: true,
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele
                            });
                            isFirstOthers = false;
                        });
                    if (lenOfOtherTypesFalse) {
                        ddOpt.unshift({
                            transTypeCode: ddOpt.length ? 'ללא' : null,
                            transTypeName: null
                        });
                    }
                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                        ddOpt[0].disabled = true;
                    }
                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                    row.optionsParent = ddOpt.filter(
                        (item) =>
                            !item.originValue || (item.originValue && item.originValue.parent)
                    );
                });
            });
            this.transType.incomeData.forEach((it) => {
                it.rows.forEach((row) => {
                    let ddOpt = this.transTypeAll.incomeData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                            if (rw.otherTypes === false) {
                                if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                    return rw;
                                } else {
                                    if (
                                        !allTransTypeCode.some(
                                            (rwChild) => rwChild === rw.transTypeCode
                                        )
                                    ) {
                                        return rw;
                                    }
                                }
                            }
                        })
                        .map((ele) => {
                            return {
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele
                            };
                        });
                    let lenOfOtherTypesFalse = ddOpt.length;
                    let isFirstOthers = true;
                    this.transTypeAll.incomeData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                        if (rw.otherTypes === true) {
                            if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                lenOfOtherTypesFalse = true;
                                return rw;
                            } else {
                                if (
                                    !allTransTypeCode.some(
                                        (rwChild) => rwChild === rw.transTypeCode
                                    )
                                ) {
                                    return rw;
                                }
                            }
                        }
                    })
                        .forEach((ele) => {
                            ddOpt.push({
                                isFirstHistory: isFirstOthers,
                                isHistory: true,
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele
                            });
                            isFirstOthers = false;
                        });
                    if (lenOfOtherTypesFalse) {
                        ddOpt.unshift({
                            transTypeCode: ddOpt.length ? 'ללא' : null,
                            transTypeName: null
                        });
                    }
                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                        ddOpt[0].disabled = true;
                    }
                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                    row.optionsParent = ddOpt.filter(
                        (item) =>
                            !item.originValue || (item.originValue && item.originValue.parent)
                    );
                });
            });
            this.transType.receiptData.forEach((it) => {
                it.rows.forEach((row) => {
                    let ddOpt = this.transTypeAll.receiptData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                            if (rw.otherTypes === false) {
                                if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                    return rw;
                                } else {
                                    if (
                                        !allTransTypeCode.some(
                                            (rwChild) => rwChild === rw.transTypeCode
                                        )
                                    ) {
                                        return rw;
                                    }
                                }
                            }
                        })
                        .map((ele) => {
                            return {
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele ? JSON.parse(JSON.stringify(ele)) : ele
                            };
                        });
                    let lenOfOtherTypesFalse = ddOpt.length;
                    let isFirstOthers = true;
                    this.transTypeAll.receiptData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                        if (rw.otherTypes === true) {
                            if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                lenOfOtherTypesFalse = true;
                                return rw;
                            } else {
                                if (
                                    !allTransTypeCode.some(
                                        (rwChild) => rwChild === rw.transTypeCode
                                    )
                                ) {
                                    return rw;
                                }
                            }
                        }
                    })
                        .forEach((ele) => {
                            ddOpt.push({
                                isFirstHistory: isFirstOthers,
                                isHistory: true,
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele ? JSON.parse(JSON.stringify(ele)) : ele
                            });
                            isFirstOthers = false;
                        });
                    if (lenOfOtherTypesFalse) {
                        ddOpt.unshift({
                            transTypeCode: ddOpt.length ? 'ללא' : null,
                            transTypeName: null
                        });
                    }
                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                        ddOpt[0].disabled = true;
                    }
                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                    row.optionsParent = ddOpt.filter(
                        (item) =>
                            !item.originValue || (item.originValue && item.originValue.parent)
                    );
                });
            });
            this.transType.paymentsData.forEach((it) => {
                it.rows.forEach((row) => {
                    let ddOpt = this.transTypeAll.paymentsData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                            if (rw.otherTypes === false) {
                                if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                    return rw;
                                } else {
                                    if (
                                        !allTransTypeCode.some(
                                            (rwChild) => rwChild === rw.transTypeCode
                                        )
                                    ) {
                                        return rw;
                                    }
                                }
                            }
                        })
                        .map((ele) => {
                            return {
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele
                            };
                        });
                    let lenOfOtherTypesFalse = ddOpt.length;
                    let isFirstOthers = true;
                    this.transTypeAll.paymentsData
                        .find((item) => item.desc === it.desc)
                        .rows.filter((rw) => {
                        if (rw.otherTypes === true) {
                            if (rw.transTypeCode === row.transTypeCode.transTypeCode) {
                                lenOfOtherTypesFalse = true;
                                return rw;
                            } else {
                                if (
                                    !allTransTypeCode.some(
                                        (rwChild) => rwChild === rw.transTypeCode
                                    )
                                ) {
                                    return rw;
                                }
                            }
                        }
                    })
                        .forEach((ele) => {
                            ddOpt.push({
                                isFirstHistory: isFirstOthers,
                                isHistory: true,
                                transTypeCode: ele.transTypeCode,
                                transTypeName: ele.transTypeName,
                                originValue: ele
                            });
                            isFirstOthers = false;
                        });
                    if (lenOfOtherTypesFalse) {
                        ddOpt.unshift({
                            transTypeCode: ddOpt.length ? 'ללא' : null,
                            transTypeName: null
                        });
                    }
                    if (ddOpt.length === 1 && ddOpt[0].transTypeCode === null) {
                        ddOpt[0].disabled = true;
                    }
                    ddOpt = ddOpt.filter(item => !(item.transTypeCode === 'ללא' && item.transTypeName === null));
                    row.options = this.addCancelOpt(ddOpt, row.transTypeCode);
                    row.optionsParent = ddOpt.filter(
                        (item) =>
                            !item.originValue || (item.originValue && item.originValue.parent)
                    );
                });
            });
            this.cdref.detectChanges();
        }

    }

    updateTransTypeCode(
        row: any,
        transClass: string,
        type?: string,
        desc?: string
    ) {
        if (
            row.parent === true &&
            row.transTypeCode &&
            row.transTypeCode.originValue &&
            row.transTypeCode.originValue.parent === false
        ) {
            const transTypeCode = row.transTypeCode;
            setTimeout(() => {
                row.transTypeCode = JSON.parse(JSON.stringify(row.transTypeCodeOld));
                this.transType[type].forEach((it) => {
                    if (it.desc === desc) {
                        it.rows.forEach((v1) => {
                            if (v1.parent === true) {
                                v1.transTypeCode = row.transTypeCode;
                            }
                        });
                    }
                });
                this.addRow(
                    type,
                    desc,
                    row.transTypeName,
                    row.options,
                    transTypeCode,
                    transClass
                );
            }, 10);
        } else {
            if (row.empty) {
                // console.log('last: ', this.transType.receiptData[0].rows[0]);

                this.sharedService
                    .transTypeApprove({
                        companyId: this.isModal
                            ? this.isModal.companyId
                            : this.userService.appData.userData.companySelect.companyId,
                        transTypeCode: row.transTypeCode.transTypeCode,
                        transClass: transClass
                    })
                    .subscribe(() => {
                        const originValue = row.transTypeCode.originValue;
                        if (originValue) {
                            row.empty = false;
                            row.expenseCust1 = originValue.expenseCust1;
                            row.expenseCust2 = originValue.expenseCust2;
                            row.expensePrc1 = originValue.expensePrc1;
                            row.expensePrc2 = originValue.expensePrc2;
                            row.incomeCust1 = originValue.incomeCust1;
                            row.incomeCust2 = originValue.incomeCust2;
                            row.incomePrc1 = originValue.incomePrc1;
                            row.incomePrc2 = originValue.incomePrc2;
                            row.zikui = originValue.zikui;
                        }
                        row.defined = true;
                        row.transTypeCode = {
                            transTypeCode: row.transTypeCode.transTypeCode,
                            transTypeName: row.transTypeCode.transTypeName
                        };
                        row.transTypeName = row.transTypeCode.transTypeName;
                        this.refreshOptions();
                    });
            } else {
                if (row.transTypeCode.transTypeCode === 'ללא') {
                    this.sharedService
                        .transTypeDelete({
                            companyId: this.isModal
                                ? this.isModal.companyId
                                : this.userService.appData.userData.companySelect.companyId,
                            transTypeCode: row.transTypeCodeOld.transTypeCode
                        })
                        .subscribe(() => {
                            row.empty = true;
                            row.defined = false;
                            row.expenseCust1 = null;
                            row.expenseCust2 = null;
                            row.expensePrc1 = null;
                            row.expensePrc2 = null;
                            row.incomeCust1 = null;
                            row.incomeCust2 = null;
                            row.incomePrc1 = null;
                            row.incomePrc2 = null;
                            row.zikui = null;
                            row.transTypeCode = {
                                transTypeCode: null,
                                transTypeName: null
                            };
                            // row.options = [{
                            //     transTypeCode: 'ללא',
                            //     transTypeName: null
                            // }];
                            row.transTypeName = null;
                            this.refreshOptions();
                        });
                } else {
                    this.sharedService
                        .transTypeReplace({
                            companyId: this.isModal
                                ? this.isModal.companyId
                                : this.userService.appData.userData.companySelect.companyId,
                            transTypeCodeOld: row.transTypeCodeOld.transTypeCode,
                            transTypeCodeNew: row.transTypeCode.transTypeCode,
                            transClass: transClass
                        })
                        .subscribe(() => {
                            const originValue = row.transTypeCode.originValue;
                            if (originValue) {
                                row.defined = originValue.defined;
                                row.expenseCust1 = originValue.expenseCust1;
                                row.expenseCust2 = originValue.expenseCust2;
                                row.expensePrc1 = originValue.expensePrc1;
                                row.expensePrc2 = originValue.expensePrc2;
                                row.incomeCust1 = originValue.incomeCust1;
                                row.incomeCust2 = originValue.incomeCust2;
                                row.incomePrc1 = originValue.incomePrc1;
                                row.incomePrc2 = originValue.incomePrc2;
                                row.zikui = originValue.zikui;
                            }
                            row.transTypeCode = {
                                transTypeCode: row.transTypeCode.transTypeCode,
                                transTypeName: row.transTypeCode.transTypeName
                            };
                            row.transTypeName = row.transTypeCode.transTypeName;
                            this.refreshOptions();
                        });
                }
            }
        }
    }

    transTypeApprove(row: any, transClass: string) {
        if (row.defined) {
            this.sharedService
                .transTypeApprove({
                    companyId: this.isModal
                        ? this.isModal.companyId
                        : this.userService.appData.userData.companySelect.companyId,
                    transTypeCode: row.transTypeCode.transTypeCode,
                    transClass: transClass
                })
                .subscribe((responseAll) => {
                });
        }
    }

    trackDesc(idx: number, item: any) {
        return (item ? item.desc : null) || idx;
    }


    startChild(): void {
        console.log('TransTypeComponent');
    }

    handleKeyPress(e) {
        const str = String.fromCharCode(e.which);
        if (!str) {
            return;
        }
        this.isCapsLock = ((): any => {
            const charCode = e.which || e.keyCode;
            let isShift = false;
            if (e.shiftKey) {
                isShift = e.shiftKey;
            } else if (e.modifiers) {
                isShift = !!(e.modifiers & 4);
            }

            if (charCode >= 97 && charCode <= 122 && isShift) {
                return true;
            }
            if (charCode >= 65 && charCode <= 90 && !isShift) {
                return true;
            }

            this.isValidCellPart =
                e.target.id === 'cell' ? /^[\d-]$/.test(str) : null;
            console.log(
                'e.target = %o, e.target.id = %o => %o return %o',
                e.target,
                e.target.id,
                e.target.id === 'cell',
                this.isValidCellPart
            );
            if (this.isValidCellPart === false) {
                e.preventDefault();
                e.stopPropagation();
            }
        })();
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    changeDef(row: any, transClass: string) {
        row.defined = !row.defined;
        this.transTypeApprove(row, transClass);
    }

    // aaaa(ajghf: any) {
    //     console.log(ajghf);
    // }

    getTransTypeCodeValues(val: any) {
        return typeof val === 'object' ? val : {
            transTypeCode: val.transTypeCode,
            transTypeName: val.transTypeName
        };
    }

    ngOnDestroy(): void {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        this.destroy();
    }
}
