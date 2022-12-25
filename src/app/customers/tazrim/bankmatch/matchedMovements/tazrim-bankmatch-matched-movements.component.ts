import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {UserService} from '@app/core/user.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {FormBuilder, FormControl} from '@angular/forms';
// import {UserDefaultsResolver} from '../../user-defaults-resolver.service';
import {DatePipe} from '@angular/common';
import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {Dropdown} from 'primeng/dropdown/dropdown';
import {HttpErrorResponse} from '@angular/common/http';
import {Paginator} from 'primeng/paginator';
import {debounceTime, distinctUntilChanged, filter} from 'rxjs/operators';
// tslint:disable-next-line:max-line-length
import {
    BankMatchDateRangeSelectorComponent
} from '@app/shared/component/date-range-selectors/bankMatch-date-range-selector.component';
import {Beneficiary, BeneficiaryService} from '@app/core/beneficiary.service';
import {combineLatest} from 'rxjs';
import {ReloadServices} from '@app/shared/services/reload.services';

declare var $: any;

@Component({
    templateUrl: './tazrim-bankmatch-matched-movements.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TazrimBankmatchMatchedMovementsComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    public filterTypesVal: any = null;
    public dataTableAll: any[] = [];
    public dataTable: any[] = [];

    public filterInput = new FormControl();
    public queryString = '';
    public banktransForMatchAll: any;
    public banktransForMatch: any = [];
    public cashflowMatchAll: any;
    public cashflowMatch: any = [];
    public cashflowMatchReco: any = [];
    public paymentTypesArr: any[];
    public typePaymentsDD: any[] = [];
    public loader = false;
    public loaderCash = false;
    public searchInDates = false;
    public searchableList = ['total', 'transDate', 'transDescAzonly'];
    public filterPaymentTypesCategory: any = null;
    public searchableListTypes = ['paymentDesc'];
    public sortPipeDir: any = null;
    public sortPipeDirCash: any = null;
    private readonly dtPipe: DatePipe;
    public hasRowOfDeleted: boolean = false;
    public accountSelectOneNotUpdate: any = false;
    public popUpDeleteMatch: any = false;
    public showModalAutoMatch: any = false;

    public cancelMatch: any = false;
    public checkAllRows: any = false;
    public hasRowOfChecked: any = false;
    // public showAdditionalItem: any;
    // private transactionAdditionalDetailId$ = new Subject<any>();
    // transactionAdditionalDetails$: Observable<any>;
    // transactionAdditionalDetailsSum: number;
    // private lastAddionalsLoaded: any[];
    // additionalCheckSelected: any = null;
    // additionalBodyHasScroll = false;
    // private showAdditionalTarget: any;
    // @ViewChildren('checksChain', {read: ElementRef}) checksChainItemsRef: QueryList<ElementRef>;
    // @ViewChild('additionalsContainer', {read: ElementRef}) additionalsContainer: ElementRef;
    // @ViewChild('additionalBodyContainer') additionalBodyContainer: ElementRef;
    public currentTab: number = 1;
    private typePay: any[];
    private typeExpece: any[];

    @ViewChild(BankMatchDateRangeSelectorComponent)
    childDates: BankMatchDateRangeSelectorComponent;
    // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;

    public currentPage = 0;
    public entryLimit = 50;
    @ViewChild('scrollContainer') scrollContainer: ElementRef;
    @ViewChild('paginator') paginator: Paginator;
    public alertNotData: boolean = false;

    public sortPipeDirDate1: any = null;
    public sortPipeDirDate2: any = null;
    public sortPipeDirDate3: any = null;

    private readonly typesForbiddenForUnmatch = [
        'SOLEK_TAZRIM',
        'LOAN_TAZRIM',
        'CCARD_TAZRIM'
    ];

    constructor(
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private filterPipe: FilterPipe,
        private sortPipe: SortPipe,
        private dtHumanizePipe: TodayRelativeHumanizePipe,
        // private renderer: Renderer2,
        // private storageService: StorageService,
        // private router: Router,
        // private route: ActivatedRoute,
        // private defaultsResolver: UserDefaultsResolver,
        public fb: FormBuilder,
        private beneficiaryService: BeneficiaryService
    ) {
        super(sharedComponent);

        this.filterInput.valueChanges
            .pipe(
                debounceTime(300),
                filter((term) => !term || term.length === 0 || term.length >= 2),
                distinctUntilChanged()
            )
            .subscribe((term) => {
                this.queryString = term;
                this.filtersAll();
            });
        //
        // const paymentTypes = this.translate.translations[this.translate.currentLang].paymentTypes;
        // if (paymentTypes) {
        //     for (const o in paymentTypes) {
        //         if (paymentTypes.hasOwnProperty(o)) {
        //             this.typePaymentsDD.push({label: paymentTypes[o], value: o});
        //         }
        //     }
        // }
        //
        this.dtPipe = new DatePipe('en-IL');
    }

    ngAfterViewInit() {
        if (this.childDates) {
            this.childDates.selectedRange
                .pipe(filter(() => this.userService.appData.userData.bankMatchAccountAcc))
                .subscribe((rng) => this.filterDates(rng));
        }
    }

    ngOnInit(): void {
        console.log('ngOnInit')
        // this.transactionAdditionalDetails$ = this.transactionAdditionalDetailId$
        //     .pipe(
        //         distinctUntilChanged((a, b) => {
        //             if ('linkId' in a && 'linkId' in b) {
        //                 return a.linkId === b.linkId;
        //             }
        //             if ('pictureLink' in a && 'pictureLink' in b) {
        //                 return a.pictureLink === b.pictureLink;
        //             }
        //             return false;
        //         }),
        //         switchMap(item => {
        //             if ('linkId' in item) {
        //                 return this.sharedService.getPerutBankdetail(item);
        //             } else if ('pictureLink' in item) {
        //                 return this.sharedService.getCheckDetail(item);
        //             }
        //         }),
        //         map(rslt => rslt['body']),
        //         tap(adtnlsArr => {
        //             this.lastAddionalsLoaded = adtnlsArr;
        //
        //             let containerWidth = 660;
        //             let hasChecksChain = false;
        //             if (!adtnlsArr || adtnlsArr.length === 0) {
        //                 this.transactionAdditionalDetailsSum = 0;
        //             } else {
        //                 this.transactionAdditionalDetailsSum = adtnlsArr[0].hasOwnProperty('transfertotal')
        //                     ? adtnlsArr.reduceRight((acc, item) => acc + item.transfertotal, 0)
        //                     : adtnlsArr.reduceRight((acc, item) => acc + item.chequeTotal, 0);
        //
        //                 hasChecksChain = (adtnlsArr[0].hasOwnProperty('chequeTotal') && adtnlsArr.length > 1);
        //                 this.additionalCheckSelected = hasChecksChain ? adtnlsArr[0] : null;
        //                 containerWidth = hasChecksChain ? 1000 : 660;
        //             }
        //
        //             this.renderer.setStyle(this.additionalsContainer.nativeElement,
        //                 'width',
        //                 containerWidth + 'px');
        //
        //             if (hasChecksChain && this.checksChainItemsRef && this.checksChainItemsRef.length > 0) {
        //                 this.checksChainItemsRef.first.nativeElement.focus();
        //             }
        //
        //             this.rolloutAdditionalsPopup();
        //         })
        //     );
        // this.childDates.selectedRange
        //     .pipe(
        //         filter(() => this.userService.appData.userData.bankMatchAccountAcc)
        //     )
        //     .subscribe(rng => this.filterDates(rng));
        // this.startChild();
    }

    ngOnDestroy() {
        this.destroy();
    }

    paginate(event) {
        console.log('paginate ===> %o', event);

        // if (this.entryLimit !== +event.rows) {
        //     this.entryLimit = +event.rows;
        //     // this.storageService.sessionStorageSetter('bankAccount-details-rowsPerPage', event.rows);
        //     this.defaultsResolver.setNumberOfRowsAt(this.entryLimit);
        // }

        if (this.currentPage !== +event.page) {
            this.scrollContainer.nativeElement.scrollTop = 0;
            this.currentPage = event.page;
        }
    }

    filterTypes(type: any) {
        this.filterTypesVal = type;
        this.filtersAll();
    }

    filterDates(paramDate: any): void {
        const parameters: any = {
            companyAccountIds: [
                this.userService.appData.userData.bankMatchAccountAcc.companyAccountId
            ],
            dateFrom: paramDate.fromDate,
            dateTill: paramDate.toDate
        };

        combineLatest(
            [
                this.sharedService.getMatchedTrans(parameters),
                this.sharedService.paymentTypesTranslate$,
                this.beneficiaryService.selectedCompanyBeneficiaries
            ]
        )
            // this.sharedService.getMatchedTrans(parameters)
            //     .pipe(
            //         withLatestFrom(this.sharedService.paymentTypesTranslate$,
            //             this.beneficiaryService.selectedCompanyBeneficiaries)
            //     )
            .subscribe(
                {
                    next: (nextRes: any) => {
                        const [response, paymentTypesTranslate, selectedCompanyBeneficiaries] = nextRes;
                        this.dataTableAll = response ? response['body'] : response;
                        this.dataTableAll = this.dataTableAll.map((trns) =>
                            this.setupItemView(
                                trns,
                                paymentTypesTranslate,
                                selectedCompanyBeneficiaries
                            )
                        );
                        this.filtersAll(false);
                    },
                    error: (err: HttpErrorResponse) => {
                        if (err.error) {
                            console.log('An error occurred:', err.error.message);
                        } else {
                            console.log(
                                `Backend returned code ${err.status}, body was: ${err.error}`
                            );
                        }
                    }
                }
            );
    }

    startChild(): void {
        this.loader = true;
        this.filterTypesVal = null;
        this.popUpDeleteMatch = false;
        if (this.childDates) {
            this.childDates.selectedRange
                .pipe(filter(() => this.userService.appData.userData.bankMatchAccountAcc))
                .subscribe((rng) => this.filterDates(rng));
        }

        // this.chilupdate-lead-exampledDates.filter('days');
        // this.filterDates(this.childDates.selectedPeriod);
    }

    filtersAll(priority?: any): void {
        if (this.filterTypesVal === null) {
            this.dataTable = [].concat(this.dataTableAll);
        } else {
            this.dataTable = [].concat(this.dataTableAll).filter((row) => {
                if (this.filterTypesVal === 'false') {
                    if (row.bankMatchTransInner.matchedUserName === 'מערכת') {
                        return row;
                    }
                } else {
                    if (row.bankMatchTransInner.matchedUserName !== 'מערכת') {
                        return row;
                    }
                }
            });
        }

        if (this.queryString) {
            this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
                this.queryString
            );
            this.dataTable = this.dataTable.filter((row) => {
                // tslint:disable-next-line:max-line-length
                if (
                    (row.bankMatchTransInner.transDesc &&
                        row.bankMatchTransInner.transDesc
                            .toString()
                            .toLowerCase()
                            .includes(this.queryString.toString().toLowerCase())) ||
                    // tslint:disable-next-line:max-line-length
                    (row.bankMatchTransInner.paymentDescTranslate &&
                        row.bankMatchTransInner.paymentDescTranslate
                            .toString()
                            .toLowerCase()
                            .includes(this.queryString.toString().toLowerCase())) ||
                    // tslint:disable-next-line:max-line-length
                    (row.bankMatchTransInner.bankTotal &&
                        row.bankMatchTransInner.bankTotal
                            .toString()
                            .toLowerCase()
                            .includes(this.queryString.toString().toLowerCase())) ||
                    (this.searchInDates &&
                        // tslint:disable-next-line:max-line-length
                        row.bankMatchTransInner.matchDateStr &&
                        row.bankMatchTransInner.matchDateStr
                            .toString()
                            .toLowerCase()
                            .includes(this.queryString.toString().toLowerCase())) ||
                    // tslint:disable-next-line:max-line-length
                    (row.bankMatchTransInner.transDateStr &&
                        row.bankMatchTransInner.transDateStr
                            .toString()
                            .toLowerCase()
                            .includes(this.queryString.toString().toLowerCase()))
                ) {
                    return row;
                }
                // debugger
                const isExist = row.array.some((inside) => {
                    // tslint:disable-next-line:max-line-length
                    return (
                        (inside.targetName &&
                            inside.targetName
                                .toString()
                                .toLowerCase()
                                .includes(this.queryString.toString().toLowerCase())) ||
                        // tslint:disable-next-line:max-line-length
                        (inside.paymentDescTranslate &&
                            inside.paymentDescTranslate
                                .toString()
                                .toLowerCase()
                                .includes(this.queryString.toString().toLowerCase())) ||
                        // tslint:disable-next-line:max-line-length
                        (inside.targetTotal &&
                            inside.targetTotal
                                .toString()
                                .toLowerCase()
                                .includes(this.queryString.toString().toLowerCase())) ||
                        // tslint:disable-next-line:max-line-length
                        (this.searchInDates &&
                            inside.dueDateStr &&
                            inside.dueDateStr
                                .toString()
                                .toLowerCase()
                                .includes(this.queryString.toString().toLowerCase()))
                    );
                });
                if (isExist) {
                    return row;
                }
            });
        }

        if (priority !== false) {
            if (this.dataTable.length) {
                if (priority === 1) {
                    this.dataTable = this.dataTable.sort((a, b) => {
                        if (!this.sortPipeDirDate1 || this.sortPipeDirDate1 === 'bigger') {
                            return a.bankMatchTransInner.transDateFull.getTime() >
                            b.bankMatchTransInner.transDateFull.getTime()
                                ? 1
                                : -1;
                        } else {
                            return a.bankMatchTransInner.transDateFull.getTime() <
                            b.bankMatchTransInner.transDateFull.getTime()
                                ? 1
                                : -1;
                        }
                    });
                }
                if (priority === 3) {
                    this.dataTable = this.dataTable.sort((a, b) => {
                        if (!this.sortPipeDirDate3 || this.sortPipeDirDate3 === 'bigger') {
                            return a.bankMatchTransInner.matchDateFull.getTime() >
                            b.bankMatchTransInner.matchDateFull.getTime()
                                ? 1
                                : -1;
                        } else {
                            return a.bankMatchTransInner.matchDateFull.getTime() <
                            b.bankMatchTransInner.matchDateFull.getTime()
                                ? 1
                                : -1;
                        }
                    });
                }
            }
        }

        this.alertNotData = this.dataTable.length === 0;
        // this.banktransForMatch = this.sortPipe.transform(this.banktransForMatch, 'total', this.sortPipeDir);
        this.loader = false;
        this.currentPage = 0;
        this.paginator.changePage(0);
    }

    filtersAllCash(priority?: boolean): void {
        this.cashflowMatch = [].concat(
            this.cashflowMatchReco.length && this.currentTab === 0
                ? this.cashflowMatchReco
                : this.cashflowMatchAll
        );
        this.cashflowMatch = this.sortPipe.transform(
            this.cashflowMatch,
            'total',
            this.sortPipeDirCash
        );
        this.calcRowGroup();
        this.loaderCash = false;
    }

    checkReco() {
        if (this.cashflowMatchReco.length) {
            this.currentTab = 0;
            this.filtersAllCash();
        }
    }

    trackById(index: number, row: any): string {
        return row.bankMatchTransInner.bankTransId;
    }

    sortPipeFilter(type: number): void {
        if (type === 1) {
            if (this.sortPipeDirDate1 && this.sortPipeDirDate1 === 'smaller') {
                this.sortPipeDirDate1 = 'bigger';
            } else {
                this.sortPipeDirDate1 = 'smaller';
            }
        }
        // if (type === 2) {
        //     if (this.sortPipeDirDate2 && this.sortPipeDirDate2 === 'smaller') {
        //         this.sortPipeDirDate2 = 'bigger';
        //     } else {
        //         this.sortPipeDirDate2 = 'smaller';
        //     }
        // }
        if (type === 3) {
            if (this.sortPipeDirDate3 && this.sortPipeDirDate3 === 'smaller') {
                this.sortPipeDirDate3 = 'bigger';
            } else {
                this.sortPipeDirDate3 = 'smaller';
            }
        }
        this.filtersAll(type);
    }

    sortPipeFilterCash(): void {
        if (this.sortPipeDirCash && this.sortPipeDirCash === 'smaller') {
            this.sortPipeDirCash = 'bigger';
        } else {
            this.sortPipeDirCash = 'smaller';
        }
        this.filtersAllCash();
    }

    // private rebuildPaymentTypesMap(withOtherFiltersApplied: any[]): void {
    //     this.paymentTypesMap = withOtherFiltersApplied.reduce((acmltr, dtRow) => {
    //         if (dtRow.paymentDesc && !acmltr[dtRow.paymentDesc]) {
    //             acmltr[dtRow.paymentDesc] = {
    //                 val: dtRow.paymentDesc,
    //                 id: dtRow.paymentDesc,
    // tslint:disable-next-line:max-line-length
    //                 checked: !Array.isArray(this.filterPaymentTypesCategory) || this.filterPaymentTypesCategory.includes(dtRow.paymentDesc)
    //             };
    //
    //             if (acmltr['all'].checked && !acmltr[dtRow.paymentDesc].checked) {
    //                 acmltr['all'].checked = false;
    //             }
    //         }
    //         return acmltr;
    //     }, {
    //         all: {
    //             val: this.translate.translations[this.translate.currentLang].filters.all,
    //             id: 'all',
    //             checked: true
    //         }
    //     });
    //     this.paymentTypesArr = Object.values(this.paymentTypesMap);
    // }

    filterCategory(type: any) {
        this.filterPaymentTypesCategory = type.checked;
        this.filtersAll(true);
    }

    private setupItemView(
        trns: any,
        paymentTypesTranslate: { [p: string]: string },
        selectedCompanyBeneficiaries: Array<Beneficiary>
    ): void {
        // console.log('trns -> %o', trns);
        trns.array = trns.array.map((trnsInside) =>
            this.setupItemInsideView(trnsInside, paymentTypesTranslate)
        );
        trns.allowUnmatch = trns.array.every(
            (item) => !this.typesForbiddenForUnmatch.includes(item.targetTypeName)
        );

        Object.assign(trns.bankMatchTransInner, {
            transDateFull: new Date(trns.bankMatchTransInner.transDate),
            matchDateFull: new Date(trns.bankMatchTransInner.matchDate),
            paymentDescTranslate:
                paymentTypesTranslate[trns.bankMatchTransInner['bankPaymentDesc']],
            transDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.bankMatchTransInner.transDate,
                'dd/MM/yy'
            ),
            matchDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.bankMatchTransInner.matchDate,
                'dd/MM/yy'
            ),
            transDateStr: this.dtPipe.transform(
                trns.bankMatchTransInner.transDate,
                'dd/MM/yy'
            ),
            matchDateStr: this.dtPipe.transform(
                trns.bankMatchTransInner.matchDate,
                'dd/MM/yy'
            ),
            beneficiary: trns.bankMatchTransInner.biziboxMutavId
                ? selectedCompanyBeneficiaries.find(
                    (cmpBnf) =>
                        cmpBnf.biziboxMutavId === trns.bankMatchTransInner.biziboxMutavId
                )
                : null
        });
        return trns;
    }

    private setupItemInsideView(
        trns: any,
        paymentTypesTranslate: { [k: string]: string }
    ): void {
        // console.log('trns -> %o', trns);
        return Object.assign(trns, {
            dueDateFull: new Date(trns.dueDate),
            paymentDescTranslate: paymentTypesTranslate[trns['paymentDesc']],
            dueDateHumanizedStr: this.dtHumanizePipe.transform(
                trns.dueDate,
                'dd/MM/yy'
            ),
            dueDateStr: this.dtPipe.transform(trns.dueDate, 'dd/MM/yy')
        });
    }

    checkDeleted() {
        if (this.cancelMatch) {
            this.cancelMatch = false;
        }
        this.hasRowOfDeleted = this.banktransForMatch.some(
            (item) => item.deleteRow
        );
        if (this.hasRowOfDeleted) {
            const objectTypePay = {};
            const objectTypeExpece = {};
            this.banktransForMatch
                .filter((item) => item.deleteRow)
                .forEach((thisItem) => {
                    objectTypePay[thisItem.paymentDesc] = thisItem.paymentDesc;
                    objectTypeExpece[thisItem.hova] = thisItem.hova;
                });
            this.typePay = Object.values(objectTypePay);
            this.typeExpece = Object.values(objectTypeExpece);
            this.cashflowMatchReco = []
                .concat(this.cashflowMatchAll)
                .filter((item) => {
                    return (
                        this.typePay.some((row) => row === item.paymentDesc) &&
                        this.typeExpece.some((row) => row === item.expence)
                    );
                });
            if (this.cashflowMatchReco.length) {
                this.currentTab = 0;
            } else {
                this.currentTab = 1;
            }
        } else {
            this.cashflowMatchReco = [];
            this.currentTab = 1;
        }
        this.filtersAllCash();
    }

    moveToNextAcc(): void {
        const idxActive =
            this.userService.appData.userData.bankMatchAccount.findIndex(
                (acc: any) =>
                    acc.companyAccountId ===
                    this.userService.appData.userData.bankMatchAccountAcc.companyAccountId
            );
        this.userService.appData.userData.bankMatchAccountAcc =
            this.userService.appData.userData.bankMatchAccount[idxActive + 1];
        this.startChild();
    }

    bankMatchDelete() {
        this.sharedService.setApart(this.popUpDeleteMatch.item).subscribe(() => {
            this.popUpDeleteMatch = false;
            this.startChild();
        });
    }

    bankMatchDeleteAutoMatch() {
        this.sharedService.setApart(this.showModalAutoMatch).subscribe(() => {
            this.showModalAutoMatch = false;
            this.startChild();
        });
    }

    openPopBankMatchDelete(bankTransId?: any) {
        const item = this.dataTableAll.filter(
            (row) => row.bankMatchTransInner.bankTransId === bankTransId
        )[0];

        if (
            item.array.length === 1 &&
            item.array[0].searchkeyUpdate &&
            item.bankMatchTransInner.searchkeyUpdate
        ) {
            item.array[0].searchkeyUpdate = false;
            this.showModalAutoMatch = item;
        } else {
            this.popUpDeleteMatch = {
                styleClass: 'bankMatchRestartPop',
                height: 220,
                width: 350,
                item: this.dataTableAll.filter(
                    (row) => row.bankMatchTransInner.bankTransId === bankTransId
                )[0]
            };
        }
    }

    // private locateRelatively(el: any, target: any) {
    //     const adcW = parseInt(el.style.width, 10);
    //     const adcH = parseInt(el.style.height, 10);
    //
    //     let adcX = target.offsetLeft - target.scrollLeft + target.clientLeft
    //         + target.offsetWidth / 2
    //         - adcW / 2;
    //     if (adcX + adcW > target.offsetParent.clientWidth - 10) {
    //         adcX -= (adcX + adcW - (target.offsetParent.clientWidth - 10));
    //     }
    //     el.style.left = adcX + 'px';
    //     el.children[0].style.left = target.offsetLeft - adcX - el.children[0].offsetWidth + 'px';
    //     let adcY = target.offsetTop + target.offsetHeight;
    //     if (adcY - adcH > 0
    //         && ((adcY + adcH) - (target.offsetParent.scrollTop + target.offsetParent.clientHeight)) >
    //         (target.offsetParent.scrollTop - (adcY - adcH))) {
    //         adcY = target.offsetTop - adcH - 4;
    //         el.classList.remove('arrow-up');
    //         el.classList.add('arrow-down');
    //         // el.children[0].style.top = adcH - 1.9 + 'px';
    //     } else {
    //         adcY += 4;
    //         el.classList.remove('arrow-down');
    //         el.classList.add('arrow-up');
    //         // el.children[0].style.top = el.children[0].offsetHeight * -1 + .9 + 'px';
    //     }
    //
    //     // console.log(`offsetTop: %o, scrollTop: %o, clientTop: %o => y: %o, rect: %o, rect-parent: %o`,
    //     //   target.offsetTop, target.scrollTop, target.clientTop,
    //     //   target.offsetTop - target.scrollTop + target.clientTop,
    //     //   target.getBoundingClientRect(), target.offsetParent.getBoundingClientRect());
    //
    //     // console.log(`x,y,w,h: %o,%o,%o,%o, offsetTop: %o, offsetLeft: %o,
    //     //         offsetParent.offsetHeight: %o, offsetParent.scrollTop: %o, offsetParent.scrollHeight: %o, clientBorderRect: %o,
    //     //         parent.clientBorderRect: %o`,
    //     //   adcX,
    //     //   adcY,
    //     //   adcW,
    //     //   adcH,
    //     //   target.offsetTop,
    //     //   target.offsetLeft,
    //     //   target.offsetParent.offsetHeight,
    //     //   target.offsetParent.scrollTop,
    //     //   target.offsetParent.scrollHeight,
    //     //   target.getBoundingClientRect(),
    //     //   target.offsetParent.getBoundingClientRect());
    //
    //     // el.style.top = adcY + 'px';
    // }
    //
    // showAdditionalAt(trns: any, target: HTMLElement): void {
    //     // console.log('onRowShowAdditional: %o, target: %o', $event, $event.target);
    //     // this.showAdditionalItem = $event.item;
    //     this.showAdditionalItem = trns;
    //     this.showAdditionalTarget = target;
    //     this.additionalCheckSelected = null;
    //
    //     if (trns.linkId) {
    //         const req = Object.assign(Object.create(null),
    //             {
    //                 linkId: trns.linkId,
    //                 companyAccountId: trns.companyAccountId
    //             });
    //         this.transactionAdditionalDetailId$.next(req);
    //     } else if (trns.pictureLink) {
    //         const req = Object.assign(Object.create(null),
    //             {
    //                 pictureLink: trns.pictureLink,
    //                 companyAccountId: trns.companyAccountId,
    //                 folderName: trns.account.bankId + '' + trns.account.bankSnifId + '' + trns.account.bankAccountId
    //             });
    //         this.transactionAdditionalDetailId$.next(req);
    //     }
    //
    //     this.rolloutAdditionalsPopup();
    // }
    //
    // private rolloutAdditionalsPopup(): void {
    //     setTimeout(() => {
    //         console.log('rolling out.... %o', this.additionalsContainer);
    //         this.additionalsContainer.nativeElement.focus({preventScroll: true});
    //         this.additionalsContainer.nativeElement.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'nearest'});
    //     }, 0);
    // }
    //
    //
    // checkImageSourceFrom(checkAdditional: any): string {
    //     if (checkAdditional.image) {
    //         return 'data:image/jpg;base64,' + checkAdditional.image;
    //     }
    //     if (checkAdditional.chequeBankNumber) {
    //         return `/assets/images/bank${checkAdditional.chequeBankNumber}.png`;
    //     }
    //     return '';
    // }
    //
    // hideAdditional(): void {
    //     this.showAdditionalItem = null;
    //     this.additionalCheckSelected = null;
    // }
    //
    // stepAdditionalCheckRow(dir: number, additionalDetails: any[]): boolean {
    //     console.log('stepAdditionalCheckRow ==> dir: %o, additionalDetails: %o', dir, additionalDetails);
    //     if (this.additionalCheckSelected) {
    //         let indexToSelect = additionalDetails.indexOf(this.additionalCheckSelected) + dir;
    //         if (indexToSelect === additionalDetails.length) {
    //             indexToSelect = 0;
    //         } else if (indexToSelect < 0) {
    //             indexToSelect = additionalDetails.length - 1;
    //         }
    //         this.additionalCheckSelected = additionalDetails[indexToSelect];
    //         const slctdNative = this.checksChainItemsRef.find((item, idx) => idx === indexToSelect).nativeElement;
    //         slctdNative.focus({preventScroll: true});
    //         slctdNative.scrollIntoView({
    //             behavior: 'auto',
    //             block: 'nearest',
    //             inline: 'center'
    //         });
    //         return false;
    //     }
    // }

    checkAllRowsFunc() {
        if (this.cancelMatch) {
            this.cancelMatch = false;
        }
        if (this.cashflowMatchReco.length && this.currentTab === 0) {
            this.cashflowMatchReco.forEach((item) => {
                item.checkRow = this.checkAllRows;
            });
            this.hasRowOfChecked = this.cashflowMatchReco.some(
                (item) => item.checkRow
            );
        } else {
            this.cashflowMatchAll.forEach((item) => {
                item.checkRow = this.checkAllRows;
            });
            this.hasRowOfChecked = this.cashflowMatchAll.some(
                (item) => item.checkRow
            );
        }
        this.filtersAllCash();
    }

    checkChecked(itemRow: any) {
        if (this.cancelMatch) {
            this.cancelMatch = false;
        }
        if (this.cashflowMatchReco.length && this.currentTab === 0) {
            this.cashflowMatchReco.forEach((item) => {
                if (item.targetId === itemRow.targetId) {
                    item.checkRow = itemRow.checkRow;
                }
            });
            this.hasRowOfChecked = this.cashflowMatchReco.some(
                (item) => item.checkRow
            );
        } else {
            this.cashflowMatchAll.forEach((item) => {
                if (item.targetId === itemRow.targetId) {
                    item.checkRow = itemRow.checkRow;
                }
            });
            this.hasRowOfChecked = this.cashflowMatchAll.some(
                (item) => item.checkRow
            );
        }
        this.filtersAllCash();
    }

    // private setupItemCashView(trns: any): void {
    //     // console.log('trns -> %o', trns);
    //
    //     return Object.assign(trns, {
    //         transDateFull: new Date(trns.targetOriginalDate),
    //         paymentDescTranslate: this.translate.translations[this.translate.currentLang].paymentTypes[trns['paymentDesc']],
    //         transDateHumanizedStr: this.dtHumanizePipe.transform(trns.targetOriginalDate, 'dd/MM/yy'),
    //         transDateStr: this.dtPipe.transform(trns.targetOriginalDate, 'dd/MM/yy')
    //     });
    // }

    private calcRowGroup(): void {
        const nigreret = this.cashflowMatch.filter((rows) => rows.hovAvar === true);
        const future = this.cashflowMatch.filter((rows) => rows.hovAvar === false);
        this.cashflowMatch = {
            nigreret: {
                parent: {
                    opened: true
                },
                children: nigreret
            },
            future: {
                parent: {
                    opened: true
                },
                children: future
            }
        };
    }

    override reload() {
        console.log('reload child');
    }

    clearFilter(dropdown: Dropdown) {
        dropdown.resetFilter();
    }
}
