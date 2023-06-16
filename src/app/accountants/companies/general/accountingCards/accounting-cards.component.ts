import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
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
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {filter, map, startWith, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {BrowserService} from '@app/shared/services/browser.service';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    selector: 'app-accounting-cards',
    templateUrl: './accounting-cards.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class AccountingCardsComponent
    extends ReloadServices
    implements OnDestroy, OnInit {
    public info: any;
    companyCustomerDetails: any;
    maamCustIds: any;
    maamCustIds12: any;
    maamCustIds13: any;
    maamCustIds14: any;

    public loader: boolean = true;
    @Input() isModal: any = false;
    @Input() infoAccountingCards: any;
    @Input() supplierTaxDeductionCustIdReq: any = false;
    public pettyCashCustIdArr: any = [];
    public supplierTaxDeductionCustIdArr: any = [];
    public customerTaxDeductionCustIdArr: any = [];
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
        public router: Router
    ) {
        super(sharedComponent);
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngOnInit(): void {
        if (this.isModal && this.infoAccountingCards) {
            if (this.supplierTaxDeductionCustIdReq) {
                this.infoAccountingCards
                    .get('supplierTaxDeductionCustId')
                    .setValidators([Validators.required]);
            } else {
                this.infoAccountingCards
                    .get('supplierTaxDeductionCustId')
                    .setValidators(null);
            }
            this.infoAccountingCards
                .get('supplierTaxDeductionCustId')
                .updateValueAndValidity();
        }
        this.info =
            this.isModal && this.infoAccountingCards
                ? this.infoAccountingCards
                : new FormGroup({
                    pettyCashCustId: new FormControl({
                        value: '',
                        disabled: false
                    }),
                    custMaamTsumot: new FormControl(
                        {
                            value: '',
                            disabled: false
                        },
                        !this.isModal
                            ? {}
                            : {
                                validators: [Validators.required]
                            }
                    ),
                    custMaamYevu: new FormControl(
                        {
                            value: '',
                            disabled: false
                        },
                        !this.isModal
                            ? {}
                            : {
                                validators: [Validators.required]
                            }
                    ),
                    custMaamNechasim: new FormControl(
                        {
                            value: '',
                            disabled: false
                        },
                        !this.isModal
                            ? {}
                            : {
                                validators: [Validators.required]
                            }
                    ),
                    openingBalanceCustId: new FormControl({
                        value: '',
                        disabled: false
                    }),
                    incomeCustId: new FormControl({
                        value: '',
                        disabled: false
                    }),
                    cancelBalanceCustId: new FormControl({
                        value: '',
                        disabled: false
                    }),
                    custMaamIska: new FormControl(
                        {
                            value: '',
                            disabled: false
                        },
                        !this.isModal
                            ? {}
                            : {
                                validators: [Validators.required]
                            }
                    ),
                    supplierTaxDeductionCustId: new FormControl(
                        {
                            value: '',
                            disabled: false
                        },
                        !this.supplierTaxDeductionCustIdReq
                            ? {}
                            : {
                                validators: [Validators.required]
                            }
                    ),
                    customerTaxDeductionCustId: new FormControl({
                        value: '',
                        disabled: false
                    }),
                    expenseCustId: new FormControl({
                        value: '',
                        disabled: false
                    })
                });

        this.loader = true;
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
                    if (
                        this.userService.appData.userData.companySelect &&
                        this.userService.appData.userData.companySelect.esderMaam === 'NONE'
                    ) {
                        this.info.get('custMaamTsumot').disable();
                        this.info.get('custMaamIska').disable();
                        this.info.get('custMaamNechasim').disable();
                        this.info.get('custMaamYevu').disable();
                    }

                    this.sharedService
                        .bookKeepingCust({
                            uuid: this.userService.appData.userData.companySelect.companyId
                        })
                        .subscribe((response: any) => {
                            const responseRest = response ? response['body'] : response;
                            // cancelBalanceCustId: null
                            // companyId: "909e0702-483b-1d4b-e053-650019accda1"
                            // custMaamIska: "1100"
                            // custMaamNechasim: "1102"
                            // custMaamTsumot: "1101"
                            // customerTaxDeductionCustId: null
                            // expenseCustId: null
                            // incomeCustId: null
                            // openingBalanceCustId: null
                            // pettyCashCustId: null
                            // supplierTaxDeductionCustId: null
                            // userId: null

                            this.sharedService
                                .getMaamCustIds({
                                    companyId:
                                    this.userService.appData.userData.companySelect.companyId,
                                    sourceProgramId:
                                    this.userService.appData.userData.companySelect
                                        .sourceProgramId
                                })
                                .subscribe((resp) => {
                                    const res = resp.body;
                                    this.maamCustIds = res.map((it) => {
                                        const cartisName = it.custId
                                            ? it.custId +
                                            (it.custLastName ? ' - ' + it.custLastName : '')
                                            : it.custLastName
                                                ? it.custLastName
                                                : '';
                                        return {
                                            cartisName: cartisName,
                                            custId: it.custId,
                                            lName: it.custLastName,
                                            hashCartisCodeId: it.hashCartisCodeId,
                                            hp: null,
                                            id: it.custId
                                        };
                                    });
                                    this.maamCustIds12 = this.maamCustIds.filter(it => it.hashCartisCodeId === '12');
                                    this.maamCustIds13 = this.maamCustIds.filter(it => it.hashCartisCodeId === '13');
                                    this.maamCustIds14 = this.maamCustIds.filter(it => it.hashCartisCodeId === '14');

                                    let custMaamTsumot = responseRest.custMaamTsumot;
                                    if (custMaamTsumot) {
                                        custMaamTsumot = this.maamCustIds.find(
                                            (it) => it.custId === responseRest.custMaamTsumot
                                        );
                                        if (custMaamTsumot && !this.maamCustIds13.some(it => it.custId === responseRest.custMaamTsumot)) {
                                            this.maamCustIds13.push(custMaamTsumot);
                                        }
                                    }
                                    let custMaamNechasim = responseRest.custMaamNechasim;
                                    if (custMaamNechasim) {
                                        custMaamNechasim = this.maamCustIds.find(
                                            (it) => it.custId === responseRest.custMaamNechasim
                                        );
                                        if (custMaamNechasim && !this.maamCustIds14.some(it => it.custId === responseRest.custMaamNechasim)) {
                                            this.maamCustIds14.push(custMaamNechasim);
                                        }
                                    }
                                    let custMaamIska = responseRest.custMaamIska;
                                    if (custMaamIska) {
                                        custMaamIska = this.maamCustIds.find(
                                            (it) => it.custId === responseRest.custMaamIska
                                        );
                                        if (custMaamIska && !this.maamCustIds12.some(it => it.custId === responseRest.custMaamIska)) {
                                            this.maamCustIds12.push(custMaamIska);
                                        }
                                    }

                                    let custMaamYevu = responseRest.custMaamYevu;
                                    if (custMaamYevu) {
                                        custMaamYevu = this.maamCustIds.find(
                                            (it) => it.custId === responseRest.custMaamYevu
                                        );
                                        if (custMaamYevu && !this.maamCustIds13.some(it => it.custId === responseRest.custMaamYevu)) {
                                            this.maamCustIds13.push(custMaamYevu);
                                        }
                                    }
                                    this.info.patchValue({
                                        custMaamTsumot: custMaamTsumot || null,
                                        custMaamNechasim: custMaamNechasim || null,
                                        custMaamIska: custMaamIska || null,
                                        custMaamYevu: custMaamYevu || null
                                    });
                                });

                            this.sharedService
                                .companyGetCustomer({
                                    companyId:
                                    this.userService.appData.userData.companySelect.companyId,
                                    sourceProgramId:
                                    this.userService.appData.userData.companySelect
                                        .sourceProgramId
                                })
                                .subscribe((resp) => {
                                    // const res = resp.body;
                                    // this.companyCustomerDetails = res.map(it => {
                                    //     return {
                                    //         custId: it.custId,
                                    //         lName: it.custLastName,
                                    //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                                    //         id: it.palCode
                                    //     };
                                    // });

                                    let pettyCashCustId = responseRest.pettyCashCustId;
                                    if (pettyCashCustId) {
                                        pettyCashCustId =
                                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (it) => it.custId === responseRest.pettyCashCustId
                                            );
                                    }

                                    let openingBalanceCustId = responseRest.openingBalanceCustId;
                                    if (openingBalanceCustId) {
                                        openingBalanceCustId =
                                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (it) => it.custId === responseRest.openingBalanceCustId
                                            );
                                    }
                                    let incomeCustId = responseRest.incomeCustId;
                                    if (incomeCustId) {
                                        incomeCustId =
                                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (it) => it.custId === responseRest.incomeCustId
                                            );
                                    }
                                    let cancelBalanceCustId = responseRest.cancelBalanceCustId;
                                    if (cancelBalanceCustId) {
                                        cancelBalanceCustId =
                                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (it) => it.custId === responseRest.cancelBalanceCustId
                                            );
                                    }

                                    let supplierTaxDeductionCustId =
                                        responseRest.supplierTaxDeductionCustId;
                                    if (supplierTaxDeductionCustId) {
                                        supplierTaxDeductionCustId =
                                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (it) =>
                                                    it.custId === responseRest.supplierTaxDeductionCustId
                                            );
                                    }
                                    let customerTaxDeductionCustId =
                                        responseRest.customerTaxDeductionCustId;
                                    if (customerTaxDeductionCustId) {
                                        customerTaxDeductionCustId =
                                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (it) =>
                                                    it.custId === responseRest.customerTaxDeductionCustId
                                            );
                                    }
                                    let expenseCustId = responseRest.expenseCustId;
                                    if (expenseCustId) {
                                        expenseCustId =
                                            this.userService.appData.userData.companyCustomerDetails.all.find(
                                                (it) => it.custId === responseRest.expenseCustId
                                            );
                                    }
                                    this.info.patchValue({
                                        pettyCashCustId: pettyCashCustId || null,
                                        openingBalanceCustId: openingBalanceCustId || null,
                                        incomeCustId: incomeCustId || null,
                                        cancelBalanceCustId: cancelBalanceCustId || null,
                                        supplierTaxDeductionCustId:
                                            supplierTaxDeductionCustId || null,
                                        customerTaxDeductionCustId:
                                            customerTaxDeductionCustId || null,
                                        expenseCustId: expenseCustId || null
                                    });
                                    this.loader = false;

                                    this.pettyCashCustIdArr = this.addPriemerObject(
                                        this.userService.appData.userData.companyCustomerDetails
                                            ? this.userService.appData.userData.companyCustomerDetails
                                                .all
                                            : [],
                                        this.info.get('pettyCashCustId').value &&
                                        this.info.get('pettyCashCustId').value.custId
                                    );
                                    this.supplierTaxDeductionCustIdArr = this.supplierTaxDeductionCustIdReq
                                        ? this.userService.appData.userData.companyCustomerDetails
                                            ? this.userService.appData.userData.companyCustomerDetails
                                                .supplierTaxDeductionCustIdArr
                                            : []
                                        : this.addPriemerObject(
                                            this.userService.appData.userData.companyCustomerDetails
                                                ? this.userService.appData.userData
                                                    .companyCustomerDetails
                                                    .supplierTaxDeductionCustIdArr
                                                : [],
                                            this.info.get('supplierTaxDeductionCustId').value &&
                                            this.info.get('supplierTaxDeductionCustId').value
                                                .custId
                                        );
                                    this.customerTaxDeductionCustIdArr = this.addPriemerObject(
                                        this.userService.appData.userData.companyCustomerDetails
                                            ? this.userService.appData.userData.companyCustomerDetails
                                                .customerTaxDeductionCustIdArr
                                            : [],
                                        this.info.get('customerTaxDeductionCustId').value &&
                                        this.info.get('customerTaxDeductionCustId').value.custId
                                    );
                                });
                        });
                });
        } else {
            if (this.isModal.esderMaam === 'NONE') {
                this.info.get('custMaamTsumot').disable();
                this.info.get('custMaamIska').disable();
                this.info.get('custMaamNechasim').disable();
                this.info.get('custMaamYevu').disable();
                this.info.get('custMaamTsumot').setValidators(null);
                this.info.get('custMaamIska').setValidators(null);
                this.info.get('custMaamNechasim').setValidators(null);
                this.info.get('custMaamYevu').setValidators(null);
                this.info.get('custMaamTsumot').updateValueAndValidity();
                this.info.get('custMaamIska').updateValueAndValidity();
                this.info.get('custMaamNechasim').updateValueAndValidity();
                this.info.get('custMaamYevu').updateValueAndValidity();
            } else {
                this.info.get('custMaamTsumot').enable();
                this.info.get('custMaamIska').enable();
                this.info.get('custMaamNechasim').enable();
                this.info.get('custMaamYevu').enable();
                this.info.get('custMaamTsumot').setValidators([Validators.required]);
                this.info.get('custMaamIska').setValidators([Validators.required]);
                this.info.get('custMaamNechasim').setValidators([Validators.required]);
                this.info.get('custMaamYevu').setValidators([Validators.required]);
                this.info.get('custMaamTsumot').updateValueAndValidity();
                this.info.get('custMaamIska').updateValueAndValidity();
                this.info.get('custMaamNechasim').updateValueAndValidity();
                this.info.get('custMaamYevu').updateValueAndValidity();
            }

            this.sharedService
                .bookKeepingCust({
                    uuid: this.isModal.companyId
                })
                .subscribe((response: any) => {
                    const responseRest = response ? response['body'] : response;
                    // cancelBalanceCustId: null
                    // companyId: "909e0702-483b-1d4b-e053-650019accda1"
                    // custMaamIska: "1100"
                    // custMaamNechasim: "1102"
                    // custMaamTsumot: "1101"
                    // customerTaxDeductionCustId: null
                    // expenseCustId: null
                    // incomeCustId: null
                    // openingBalanceCustId: null
                    // pettyCashCustId: null
                    // supplierTaxDeductionCustId: null
                    // userId: null

                    this.sharedService
                        .getMaamCustIds({
                            companyId: this.isModal.companyId,
                            sourceProgramId: this.isModal.sourceProgramId
                        })
                        .subscribe((resp) => {
                            const res = resp.body;
                            this.maamCustIds = res.map((it) => {
                                const cartisName = it.custId
                                    ? it.custId + (it.custLastName ? ' - ' + it.custLastName : '')
                                    : it.custLastName
                                        ? it.custLastName
                                        : '';
                                return {
                                    cartisName: cartisName,
                                    custId: it.custId,
                                    lName: it.custLastName,
                                    hp: null,
                                    id: it.custId
                                };
                            });
                            this.maamCustIds12 = this.maamCustIds.filter(it => it.hashCartisCodeId === '12');
                            this.maamCustIds13 = this.maamCustIds.filter(it => it.hashCartisCodeId === '13');
                            this.maamCustIds14 = this.maamCustIds.filter(it => it.hashCartisCodeId === '14');

                            let custMaamTsumot = responseRest.custMaamTsumot;
                            if (custMaamTsumot) {
                                custMaamTsumot = this.maamCustIds.find(
                                    (it) => it.custId === responseRest.custMaamTsumot
                                );
                                if (custMaamTsumot && !this.maamCustIds13.some(it => it.custId === responseRest.custMaamTsumot)) {
                                    this.maamCustIds13.push(custMaamTsumot);
                                }
                            }
                            let custMaamNechasim = responseRest.custMaamNechasim;
                            if (custMaamNechasim) {
                                custMaamNechasim = this.maamCustIds.find(
                                    (it) => it.custId === responseRest.custMaamNechasim
                                );
                                if (custMaamNechasim && !this.maamCustIds14.some(it => it.custId === responseRest.custMaamNechasim)) {
                                    this.maamCustIds14.push(custMaamNechasim);
                                }
                            }
                            let custMaamIska = responseRest.custMaamIska;
                            if (custMaamIska) {
                                custMaamIska = this.maamCustIds.find(
                                    (it) => it.custId === responseRest.custMaamIska
                                );
                                if (custMaamIska && !this.maamCustIds12.some(it => it.custId === responseRest.custMaamIska)) {
                                    this.maamCustIds12.push(custMaamIska);
                                }
                            }
                            let custMaamYevu = responseRest.custMaamYevu;
                            if (custMaamYevu) {
                                custMaamYevu = this.maamCustIds.find(
                                    (it) => it.custId === responseRest.custMaamYevu
                                );
                                if (custMaamYevu && !this.maamCustIds13.some(it => it.custId === responseRest.custMaamYevu)) {
                                    this.maamCustIds13.push(custMaamYevu);
                                }
                            }
                            if (!this.infoAccountingCards) {
                                this.info.patchValue({
                                    custMaamTsumot: null,
                                    custMaamNechasim: custMaamNechasim || null,
                                    custMaamIska: custMaamIska || null,
                                    custMaamYevu: custMaamYevu || null
                                });
                            }


                            if (this.isModal.esderMaam === 'NONE') {
                                this.info.get('custMaamTsumot').disable();
                                this.info.get('custMaamIska').disable();
                                this.info.get('custMaamNechasim').disable();
                                this.info.get('custMaamYevu').disable();
                                this.info.get('custMaamTsumot').setValidators(null);
                                this.info.get('custMaamIska').setValidators(null);
                                this.info.get('custMaamNechasim').setValidators(null);
                                this.info.get('custMaamYevu').setValidators(null);
                                this.info.get('custMaamTsumot').updateValueAndValidity();
                                this.info.get('custMaamIska').updateValueAndValidity();
                                this.info.get('custMaamNechasim').updateValueAndValidity();
                                this.info.get('custMaamYevu').updateValueAndValidity();
                            } else {
                                this.info.get('custMaamTsumot').enable();
                                this.info.get('custMaamIska').enable();
                                this.info.get('custMaamNechasim').enable();
                                this.info.get('custMaamYevu').enable();
                                this.info
                                    .get('custMaamTsumot')
                                    .setValidators([Validators.required]);
                                this.info
                                    .get('custMaamIska')
                                    .setValidators([Validators.required]);
                                this.info
                                    .get('custMaamNechasim')
                                    .setValidators([Validators.required]);
                                this.info
                                    .get('custMaamYevu')
                                    .setValidators([Validators.required]);
                                this.info.get('custMaamTsumot').updateValueAndValidity();
                                this.info.get('custMaamIska').updateValueAndValidity();
                                this.info.get('custMaamNechasim').updateValueAndValidity();
                                this.info.get('custMaamYevu').updateValueAndValidity();
                            }

                        });

                    this.sharedService
                        .companyGetCustomer({
                            companyId: this.isModal.companyId,
                            sourceProgramId: this.isModal.sourceProgramId
                        })
                        .subscribe((resp) => {
                            // const res = resp.body;
                            // this.companyCustomerDetails = res.map(it => {
                            //     return {
                            //         custId: it.custId,
                            //         lName: it.custLastName,
                            //         hp: it.oseknums && it.oseknums.length ? it.oseknums[0] : null,
                            //         id: it.palCode
                            //     };
                            // });
                            let pettyCashCustId = responseRest.pettyCashCustId;
                            if (pettyCashCustId) {
                                pettyCashCustId =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (it) => it.custId === responseRest.pettyCashCustId
                                    );
                            }
                            let openingBalanceCustId = responseRest.openingBalanceCustId;
                            if (openingBalanceCustId) {
                                openingBalanceCustId =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (it) => it.custId === responseRest.openingBalanceCustId
                                    );
                            }
                            let incomeCustId = responseRest.incomeCustId;
                            if (incomeCustId) {
                                incomeCustId =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (it) => it.custId === responseRest.incomeCustId
                                    );
                            }
                            let cancelBalanceCustId = responseRest.cancelBalanceCustId;
                            if (cancelBalanceCustId) {
                                cancelBalanceCustId =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (it) => it.custId === responseRest.cancelBalanceCustId
                                    );
                            }

                            let supplierTaxDeductionCustId =
                                responseRest.supplierTaxDeductionCustId;
                            if (supplierTaxDeductionCustId) {
                                supplierTaxDeductionCustId =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (it) =>
                                            it.custId === responseRest.supplierTaxDeductionCustId
                                    );
                            }
                            let customerTaxDeductionCustId =
                                responseRest.customerTaxDeductionCustId;
                            if (customerTaxDeductionCustId) {
                                customerTaxDeductionCustId =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (it) =>
                                            it.custId === responseRest.customerTaxDeductionCustId
                                    );
                            }
                            let expenseCustId = responseRest.expenseCustId;
                            if (expenseCustId) {
                                expenseCustId =
                                    this.userService.appData.userData.companyCustomerDetails.all.find(
                                        (it) => it.custId === responseRest.expenseCustId
                                    );
                            }
                            if (!this.infoAccountingCards) {
                                this.info.patchValue({
                                    pettyCashCustId: pettyCashCustId || null,
                                    openingBalanceCustId: openingBalanceCustId || null,
                                    incomeCustId: incomeCustId || null,
                                    cancelBalanceCustId: cancelBalanceCustId || null,
                                    supplierTaxDeductionCustId:
                                        supplierTaxDeductionCustId || null,
                                    customerTaxDeductionCustId:
                                        customerTaxDeductionCustId || null,
                                    expenseCustId: expenseCustId || null
                                });
                            }


                            if (this.isModal.esderMaam === 'NONE') {
                                this.info.get('custMaamTsumot').disable();
                                this.info.get('custMaamIska').disable();
                                this.info.get('custMaamNechasim').disable();
                                this.info.get('custMaamYevu').disable();
                                this.info.get('custMaamTsumot').setValidators(null);
                                this.info.get('custMaamIska').setValidators(null);
                                this.info.get('custMaamNechasim').setValidators(null);
                                this.info.get('custMaamYevu').setValidators(null);
                                this.info.get('custMaamTsumot').updateValueAndValidity();
                                this.info.get('custMaamIska').updateValueAndValidity();
                                this.info.get('custMaamNechasim').updateValueAndValidity();
                                this.info.get('custMaamYevu').updateValueAndValidity();
                            } else {
                                this.info.get('custMaamTsumot').enable();
                                this.info.get('custMaamIska').enable();
                                this.info.get('custMaamNechasim').enable();
                                this.info.get('custMaamYevu').enable();
                                this.info
                                    .get('custMaamTsumot')
                                    .setValidators([Validators.required]);
                                this.info
                                    .get('custMaamIska')
                                    .setValidators([Validators.required]);
                                this.info
                                    .get('custMaamNechasim')
                                    .setValidators([Validators.required]);
                                this.info
                                    .get('custMaamYevu')
                                    .setValidators([Validators.required]);
                                this.info.get('custMaamTsumot').updateValueAndValidity();
                                this.info.get('custMaamIska').updateValueAndValidity();
                                this.info.get('custMaamNechasim').updateValueAndValidity();
                                this.info.get('custMaamYevu').updateValueAndValidity();
                            }

                            this.loader = false;

                            this.pettyCashCustIdArr = this.addPriemerObject(
                                this.userService.appData.userData.companyCustomerDetails
                                    ? this.userService.appData.userData.companyCustomerDetails.all
                                    : [],
                                this.info.get('pettyCashCustId').value &&
                                this.info.get('pettyCashCustId').value.custId
                            );
                            this.supplierTaxDeductionCustIdArr = this
                                .supplierTaxDeductionCustIdReq
                                ? this.userService.appData.userData.companyCustomerDetails
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .supplierTaxDeductionCustIdArr
                                    : []
                                : this.addPriemerObject(
                                    this.userService.appData.userData.companyCustomerDetails
                                        ? this.userService.appData.userData.companyCustomerDetails
                                            .supplierTaxDeductionCustIdArr
                                        : [],
                                    this.info.get('supplierTaxDeductionCustId').value &&
                                    this.info.get('supplierTaxDeductionCustId').value.custId
                                );
                            this.customerTaxDeductionCustIdArr = this.addPriemerObject(
                                this.userService.appData.userData.companyCustomerDetails
                                    ? this.userService.appData.userData.companyCustomerDetails
                                        .customerTaxDeductionCustIdArr
                                    : [],
                                this.info.get('customerTaxDeductionCustId').value &&
                                this.info.get('customerTaxDeductionCustId').value.custId
                            );
                        });
                });

        }
    }


    startChild(): void {
        console.log('BankAndCreditComponent');
    }

    addPriemerObject(arr: any, isExistValue: boolean) {
        if (arr && arr.length && isExistValue) {
            return [
                {
                    cartisName: 'ביטול בחירה',
                    cartisCodeId: null,
                    custId: null,
                    hashCartisCodeId: null,
                    lName: null,
                    hp: null,
                    id: null,
                    pettyCash: false,
                    supplierTaxDeduction: null,
                    customerTaxDeduction: null
                },
                ...arr
            ];
        } else {
            return arr;
        }
    }

    updateBookKeepingCust() {
        this.pettyCashCustIdArr = this.addPriemerObject(
            this.userService.appData.userData.companyCustomerDetails
                ? this.userService.appData.userData.companyCustomerDetails.all
                : [],
            this.info.get('pettyCashCustId').value &&
            this.info.get('pettyCashCustId').value.custId
        );
        this.supplierTaxDeductionCustIdArr = this.supplierTaxDeductionCustIdReq
            ? this.userService.appData.userData.companyCustomerDetails
                ? this.userService.appData.userData.companyCustomerDetails
                    .supplierTaxDeductionCustIdArr
                : []
            : this.addPriemerObject(
                this.userService.appData.userData.companyCustomerDetails
                    ? this.userService.appData.userData.companyCustomerDetails
                        .supplierTaxDeductionCustIdArr
                    : [],
                this.info.get('supplierTaxDeductionCustId').value &&
                this.info.get('supplierTaxDeductionCustId').value.custId
            );
        this.customerTaxDeductionCustIdArr = this.addPriemerObject(
            this.userService.appData.userData.companyCustomerDetails
                ? this.userService.appData.userData.companyCustomerDetails
                    .customerTaxDeductionCustIdArr
                : [],
            this.info.get('customerTaxDeductionCustId').value &&
            this.info.get('customerTaxDeductionCustId').value.custId
        );

        if (this.info.invalid) {
            BrowserService.flattenControls(this.info).forEach((ac) =>
                ac.markAsDirty()
            );
            return;
        }

        if (!this.isModal) {
        const params = {
            companyId: !this.isModal
                ? this.userService.appData.userData.companySelect.companyId
                : this.isModal.companyId,
            pettyCashCustId: this.info.get('pettyCashCustId').value
                ? this.info.get('pettyCashCustId').value.custId
                : null,
            cancelBalanceCustId: this.info.get('cancelBalanceCustId').value
                ? this.info.get('cancelBalanceCustId').value.custId
                : null,
            custMaamTsumot: this.info.get('custMaamTsumot').value
                ? this.info.get('custMaamTsumot').value.custId
                : null,
            custMaamYevu: this.info.get('custMaamYevu').value
                ? this.info.get('custMaamYevu').value.custId
                : null,
            custMaamIska: this.info.get('custMaamIska').value
                ? this.info.get('custMaamIska').value.custId
                : null,
            custMaamNechasim: this.info.get('custMaamNechasim').value
                ? this.info.get('custMaamNechasim').value.custId
                : null,
            supplierTaxDeductionCustId: this.info.get('supplierTaxDeductionCustId')
                .value
                ? this.info.get('supplierTaxDeductionCustId').value.custId
                : null,
            customerTaxDeductionCustId: this.info.get('customerTaxDeductionCustId')
                .value
                ? this.info.get('customerTaxDeductionCustId').value.custId
                : null,
            openingBalanceCustId: this.info.get('openingBalanceCustId').value
                ? this.info.get('openingBalanceCustId').value.custId
                : null,
            incomeCustId: this.info.get('incomeCustId').value
                ? this.info.get('incomeCustId').value.custId
                : null,
            expenseCustId: this.info.get('expenseCustId').value
                ? this.info.get('expenseCustId').value.custId
                : null
        };

        console.log('params: ', params);
        this.sharedService.updateBookKeepingCust(params).subscribe(() => {
        });
        }
    }

    clearFilter(dropdown: Dropdown): void {
        dropdown.resetFilter();
    }

    ngOnDestroy(): void {
        if (this.destroyed$) {
            this.destroyed$.next();
            this.destroyed$.complete();
        }
        this.destroy();
    }
}
