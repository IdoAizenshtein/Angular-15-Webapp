/* tslint:disable:max-line-length */
import {AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {Location} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {ErpService} from '../erp.service';
import {
    AbstractControl,
    FormArray,
    FormBuilder,
    FormControl,
    FormGroup,
    FormGroupDirective,
    NgForm,
    ValidationErrors,
    Validators
} from '@angular/forms';
import {debounceTime, distinctUntilChanged} from 'rxjs/operators';
import {TokenType} from '@app/core/token.service';
import {Observable, of, Subject} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {AuthService} from '@app/login/auth.service';
import {ErrorStateMatcher} from '@angular/material/core';
import {TranslateService} from '@ngx-translate/core';
import {BrowserService} from '@app/shared/services/browser.service';
import {ReportService} from '@app/core/report.service';
import {CustomPreset, Range, RangePoint} from '@app/shared/component/date-range-selectors/presets';
import {ValidatorsFactory} from '@app/shared/component/foreign-credentials/validators';

@Component({
    templateUrl: './main-accountManagement.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class MainAccountManagementComponent
    implements AfterViewInit, OnInit {
    public accountsForStation: any = false;
    public tooltipEditFile: any;
    public showItrotModal: any = false;
    public accFromBank: any = [];
    public alertAppTokenOtpModal: any = false;
    public showModalErrorParams: any = false;
    public currencyList: any = [];
    @ViewChild('scrollContainer') scrollContainer: ElementRef;
    public queryString = '';
    public filterInput = new FormControl();
    public formLoginOtp: any;
    readonly addTokenPrompt: {
        visible: boolean;
        form: any;
        type: string;
        show: (type: string) => void;
    };
    tokenTypes = TokenType;
    readonly forceReload$ = new Subject<void>();
    public formInProgress = false;
    public formLoginOtpModal = false;
    public openSetTrust = false;
    public translateParams = {phone: '', blockingTime: 0};
    matcher = new MyErrorStateMatcher();
    public agreementPopup: any = false;
    public showModalStatus: any = false;
    @ViewChild('elemToPrint') elemToPrint: HTMLElement;
    @ViewChild('historyToPrint') historyToPrint: HTMLElement;

    public screenPopupType: any = {};
    public accountConnectRecommendationResponse: any = [];
    public accountConnectRecommendationList: any = false;
    public selectedValue: any;
    public balanceDifferenceAuto: any = false;
    public userForStation: any = false;
    public contacts: any;
    public loader = true;
    public activeRow;
    private globalListenerWhenInEdit: () => void | boolean;
    public deleteContactModal: any = false;
    public alertEndProcess: any = false;
    readonly processing$ = new Subject<boolean>();
    public subscriptionNumber: any;
    public stationId: any = '';

    current: {
        from: {
            month: number;
            year: number;
        };
        till: {
            month: number;
            year: number;
        };
    };
    readonly locale: any;
    allowed: Range;
    years: number[];
    currentDates: {
        from: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][];
        till: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][];
    };
    min: Date;
    max: Date;
    selection: CustomPreset;
    public showModalGetStationId: boolean = false;

    // tslint:disable-next-line:member-ordering
    constructor(
        public userService: UserService,
        private location: Location,
        public reportService: ReportService,
        public translate: TranslateService,
        private erpService: ErpService,
        public fb: FormBuilder,
        private renderer: Renderer2,
        private storageService: StorageService,
        private route: ActivatedRoute,
        private _fb: FormBuilder,
        public authService: AuthService
    ) {
        this.locale = translate.instant('langCalendar');
        this.selection = new CustomPreset('customDates');
        const mmntNow = this.userService.appData.moment().subtract(1, 'days');
        const mmntPlus30d = this.userService.appData.moment().add(30, 'days');
        this.selection.from = new RangePoint(
            mmntNow.date(),
            mmntNow.month(),
            mmntNow.year()
        );
        this.selection.till = new RangePoint(
            mmntPlus30d.date(),
            mmntPlus30d.month(),
            mmntPlus30d.year()
        );
        console.log('constructor customDatesPreset---', this.selection);
        this.addTokenPrompt = {
            visible: false,
            type: '',
            form: new FormGroup({
                // bank: new FormControl(null, [Validators.required])
            }),
            show: (type: string) => {
                this.addTokenPrompt.form.reset();
                this.addTokenPrompt.visible = true;
                this.addTokenPrompt.type = type;
            }
        };
        this.filterInput.valueChanges
            .pipe(debounceTime(300), distinctUntilChanged())
            .subscribe((term) => {
                this.queryString = term;
                this.accountsForStation.accountsByStationData = JSON.parse(
                    JSON.stringify(this.accountsForStation.accountsByStationDataSaved)
                );
                this.accountsForStation.accountsByStationData =
                    this.accountsForStation.accountsByStationData.filter((it) => {
                        if (
                            it.companyName
                                .toString()
                                .toLowerCase()
                                .includes(this.queryString.toString().toLowerCase())
                        ) {
                            return it;
                        } else {
                            it.accountDetails = it.accountDetails.filter((child) =>
                                child.accountNickname
                                    .toString()
                                    .toLowerCase()
                                    .includes(this.queryString.toString().toLowerCase())
                            );
                            if (it.accountDetails.length) {
                                return it;
                            } else {
                                return false;
                            }
                        }
                    });
                if (this.scrollContainer && this.scrollContainer.nativeElement) {
                    requestAnimationFrame(() => {
                        this.scrollContainer.nativeElement.scrollTop = 0;
                    });
                }
            });
    }

    ngOnInit() {
        if (!this.min || !this.max) {
            this.max = new Date();
            this.max.setDate(this.max.getDate() - 1);

            this.setMinDateAndRebuildConstraints(
                this.userService.appData.moment(this.max).subtract(6, 'months').toDate()
            );
            /*
                              this.min = new Date(this.max);
                              this.min.setMonth(this.min.getMonth() - 6);
                              this.min.setDate(this.max.getDate());
                              this.rebuildConstraints();
                  */
        }
        if (this.scrollContainer && this.scrollContainer.nativeElement) {
            requestAnimationFrame(() => {
                this.scrollContainer.nativeElement.scrollTop = 0;
            });
        }
        // this.formLoginOtp.reset();
        //
        this.formLoginOtp = this._fb.group({
            code: [
                '',
                Validators.compose([
                    Validators.required,
                    Validators.pattern(new RegExp(/^-?[0-9][^\.]*$/))
                ])
            ]
        });
        if (!this.userService.appData.station_id) {
            this.showModalGetStationId = true;
        } else {
            if (this.userService.appData.isAdmin) {
                this.getAccountsForStation();
            } else {
                this.trustStatus();
            }
        }

    }

    private setMinDateAndRebuildConstraints(dt: Date | number | null) {
        if (typeof dt === 'number') {
            this.min = this.userService.appData
                .moment(this.max)
                .subtract(6, 'months')
                .toDate();
        } else if (dt instanceof Date) {
            this.min = dt;
        } else {
            this.min = this.userService.appData
                .moment(this.max)
                .subtract(6, 'months')
                .toDate();
        }

        this.rebuildConstraints();
    }

    getStationId(subscriptionNumber: any) {
        this.stationId = '';
        this.processing$.next(true);
        this.erpService
            .getStationId(subscriptionNumber)
            .subscribe((response: any) => {
                this.processing$.next(false);
                this.stationId = response
                    ? response['body']
                    : response;
                if (this.stationId) {
                    this.showModalGetStationId = false;
                    this.userService.appData.station_id = this.stationId;
                    this.storageService.localStorageSetter('station_id', this.stationId);
                    this.userService.appData.station_params.station_id = this.stationId;
                    this.reloadSelf();
                }
            });
    }

    trustStatus() {
        if (this.userService.appData && this.userService.appData.station_id) {
            this.erpService
                .trustStatus({
                    stationId: this.userService.appData.station_id,
                    trustId: this.storageService.localStorageGetterItem('trustId')
                        ? this.storageService.localStorageGetterItem('trustId')
                        : null
                })
                .subscribe((response: any) => {
                    this.userService.appData.trustStatus = response
                        ? response['body']
                        : response;
                    this.userService.appData.token =
                        this.userService.appData.trustStatus.token;
                    if (this.userService.appData.trustStatus.loginStatus === 'CONSTANT') {
                        this.getAccountsForStation();
                    } else if (
                        this.userService.appData.trustStatus.loginStatus === 'TEMP'
                    ) {
                        this.translateParams.phone =
                            this.userService.appData.trustStatus.maskedPhoneNumber;
                        this.formLoginOtpModal = true;
                    } else {
                        this.openSetTrust = true;
                    }
                });
        }
    }

    setTrust() {
        this.accountsForStation = {};
        const uuid = crypto['randomUUID']();
        this.storageService.localStorageSetter('trustId', uuid);
        this.openSetTrust = false;
        this.erpService
            .setTrust({
                stationId: this.userService.appData.station_id,
                trustId: uuid
            })
            .subscribe((response: any) => {
                this.getAccountsForStation();
            });
    }

    reloadSelf() {
        if (this.userService.appData.isAdmin) {
            this.getAccountsForStation();
        } else {
            this.trustStatus();
        }
    }

    loginOtp(model, isValid: boolean): void {
        if (!isValid || this.formInProgress) {
            return;
        }
        this.formInProgress = true;
        this.authService.loginOtp(model.code, false).subscribe(
            (response: any) => {
                this.formInProgress = false;
                if ([400, 401, 403].includes(response.status)) {
                    return this.formLoginOtp.setErrors({incorrect: true});
                }
                if (
                    response &&
                    response.body &&
                    response.body.token &&
                    response.body.token.includes('Incorrect')
                ) {
                    return this.formLoginOtp.setErrors({
                        wrongCode: true,
                        incorrect: false
                    });
                }

                this.formLoginOtpModal = false;
                this.openSetTrust = true;
            },
            (err: HttpErrorResponse) => {
                if (err.error instanceof Error) {
                    // A client-side or network error occurred. Handle it accordingly.
                    console.log('An error occurred:', err.error.message);
                } else {
                    // The backend returned an unsuccessful response code.
                    // The response body may contain clues as to what went wrong,
                    console.log(
                        `Backend returned code ${err.status}, body was: ${err.error}`
                    );
                }
            }
        );
    }

    getSourceProgramId(sourceProgram: any) {
        switch (sourceProgram) {
            case 'HASHAVSEVET':
            case 'HASHAVSHEVET':
                return 333;
            case 'LIRAM':
                return 222;
            case 'RIVHIT':
                return 111;
            case 'SAP':
                return 2221;
            case 'NESER':
                return 1116;
            case 'ICOUNT':
                return 1119;
            case 'EXCEL':
                return 150;
            case 'BANK':
                return 888;
            case 'BANKCREDITCARD':
                return 556;
            case 'OUTCREDITCARD':
                return 555;
            case 'CHECK_SAVE':
                return 8881;
            case 'CHEQUEPIC':
                return 8888;
            case 'BANK_DIRECT_DEBIT':
                return 8884;
            case 'BANK_WIRE':
                return 8883;
            case 'DEPOSIT':
                return 8885;
            case 'LOAN':
                return 8886;
            case 'OUTSOLEK':
                return 5551;
            case 'MIVZAK_BANKAI':
                return 444;
            case 'ATZMAIT':
                return 3332;
            case 'RIVHIT_ONLINE':
                return 777;
            case 'VERIFON':
                return 7772;
            case 'COMAX':
                return 666;
            case 'GAZIT':
                return 7776;
            case 'MYCROS':
                return 7779;
            case 'TAKBULIT':
                return 3331;
            case 'CHECKS_PROGRAM':
                return 9991;
            case 'ARDANI':
                return 224;
            case 'PRIORITY':
                return 9996;
            case 'NESHER':
                return 1120;
            case 'MISRADIT':
                return 9995;
            default:
                return '';
        }
    }

    dailyMailActivated(dailyMail: any) {
        this.erpService
            .dailyMailActivated({
                stationId: this.userService.appData.station_id,
                dailyMail: dailyMail
            })
            .subscribe((response: any) => {
            });
    }

    getAccountsForStation() {
        /*
                    if (this.userService.appData.station_params.station_id && this.userService.appData.station_params.bookKeepingId) {
                        this.agreementPopup = this.userService.appData.trustStatus.agreementPopup ? {
                            agreementConfirmation: null,
                            sendMarketingInformation: null,
                            agreementClicked: false,
                            dailyMail: true,
                            step: 1
                        } : false;
                        if (!this.agreementPopup) {
                            this.accountsForStation = {};
                            this.currencyList = [];
                            this.erpService.getCurrencyList().subscribe((responseCurr) => {
                                this.currencyList = (responseCurr) ? responseCurr['body'] : responseCurr;

                                this.erpService.getAccountsForStation({
                                    'uuid': this.userService.appData.station_id,
                                }).subscribe((response:any) => {
                                    this.accountsForStation = (response) ? response['body'] : response;
                                    this.accountsForStation.sourceProgramId = this.getSourceProgramId(this.accountsForStation.sourceProgram);

                                    if (this.accountsForStation.accountsByStationData) {
                                        this.accountsForStation.accountsByStationData.forEach(it => {
                                            it.accountDetails.forEach(accChild => {
                                                const sign = this.currencyList.find(curr => curr.id === accChild.currencyId);
                                                accChild.sign = sign ? sign.sign : null;
                                            });
                                        });
                                        this.accFromBank = [];
                                        JSON.parse(JSON.stringify(this.accountsForStation.accountsByStationData)).forEach(it => {
                                            const accFromBank = it.accountDetails.filter(acc => acc.tokenTargetType === 'ACCOUNT').map(accChild => {
                                                accChild.companyAccountId = accChild.accountId;
                                                return accChild;
                                            });
                                            this.accFromBank.push(...accFromBank);
                                        });
                                        console.log('accFromBank: ', this.accFromBank);
                                        this.accountsForStation.accountsByStationDataSaved = JSON.parse(
                                            JSON.stringify(this.accountsForStation.accountsByStationData));


                                        this.userService.appData.accFromBank = [];
                                        JSON.parse(JSON.stringify(this.accountsForStation.accountsByStationData)).forEach(it => {
                                            it.accountDetails.forEach(accChild => {
                                                this.userService.appData.accFromBank.push({
                                                    accountNickname: accChild.accountNickname
                                                });
                                            });
                                        });
                                        this.userService.appData.companiesFromBank = this.accountsForStation.accountsByStationDataSaved.map(it => {
                                            return {
                                                companyName: it.companyName
                                            };
                                        });

                                    } else {
                                        this.accountsForStation.accountsByStationData = [];
                                        this.accountsForStation.accountsByStationDataSaved = [];
                                    }


                                    if (!this.userService.appData.station_params.isUrlWithoutParams && this.userService.appData.station_params.station_id && this.userService.appData.station_params.custId && this.userService.appData.station_params.companyHp) {
                                        this.erpService.screenPopupType({
                                            'stationId': this.userService.appData.station_id,
                                            'balance': this.userService.appData.station_params.balance,
                                            'dateValue': this.userService.appData.station_params.dateValue,
                                            'total': this.userService.appData.station_params.total,
                                            'custId': this.userService.appData.station_params.custId,
                                            'companyHp': this.userService.appData.station_params.companyHp
                                        }).subscribe((responseType) => {
                                            this.screenPopupType = (responseType) ? responseType['body'] : responseType;
                                            // this.screenPopupType.popupType = 'CONNECT';
                                            this.screenPopupType.linked = true;
                                            const accMatch = JSON.parse(JSON.stringify(this.accountsForStation.accountsByStationDataSaved)).filter(it => {
                                                it.accountDetails = it.accountDetails.filter(child => child.accountId === this.screenPopupType.accountId);
                                                if (it.accountDetails.length) {
                                                    return it;
                                                }
                                            });
                                            if (accMatch.length) {
                                                this.screenPopupType.companyId = accMatch[0].companyId;
                                                this.screenPopupType.bankAccountId = accMatch[0].accountDetails[0].bankAccountId;
                                                this.screenPopupType.currencyId = accMatch[0].accountDetails[0].currencyId;
                                                this.screenPopupType.sign = accMatch[0].accountDetails[0].sign;
                                                this.screenPopupType.accountNickname = accMatch[0].accountDetails[0].accountNickname;
                                                this.screenPopupType.snifId = accMatch[0].accountDetails[0].snifId;
                                                this.setMinDateAndRebuildConstraints(accMatch[0].accountDetails[0].oldestTransDate);
                                            }

                                            // accountId: null
                                            // accountType: null
                                            // popupType: "CONNECT"
                                            if (this.screenPopupType.popupType === 'CONNECT') {
                                                this.accountConnectRecommendation();
                                            }
                                            if (this.screenPopupType.popupType === 'IMPORT_ERROR') {
                                                let matchCsutId = null;
                                                this.accountsForStation.accountsByStationDataSaved.forEach(it => {
                                                    const isMatchCsutId = it.accountDetails.find(child => child.izuCustId === this.userService.appData.station_params.custId);
                                                    if (isMatchCsutId) {
                                                        isMatchCsutId.companyId = it.companyId;
                                                        matchCsutId = isMatchCsutId;
                                                    }
                                                });
                                                if (matchCsutId) {
                                                    if (matchCsutId.tokenStatus !== 'VALID') {
                                                        this.showModalStatus = matchCsutId;
                                                    }
                                                }
                                            }
                                            if (this.screenPopupType.popupType === 'BALANCE_DIFFERENCE' && this.screenPopupType.accountType === 'BANK') {
                                                this.balanceDifference();
                                            }
                                            if ((this.screenPopupType.popupType === 'BALANCE_DIFFERENCE' || this.screenPopupType.popupType === 'CUST_EMPTY') && this.screenPopupType.accountType === 'CCARD') {
                                                this.biziboxAccountHistoryCcard();
                                            }
                                        });
                                    }
                                });
                            });
                        }
                    } else {
                        this.showModalErrorParams = true;
                        if (this.userService.appData.station_params.custId && this.userService.appData.station_params.station_id) {
                            this.erpService.writeGeneralError({
                                'stationId': this.userService.appData.station_id,
                                'errorMessage': 'Bad redirect url - ' + this.userService.appData.station_params.url
                            }).subscribe((response:any) => {

                            });
                        }
                    }
            */

        if (
            (this.userService.appData.station_params.station_id &&
                this.userService.appData.station_params.bookKeepingId &&
                !this.userService.appData.station_params.custId &&
                !this.userService.appData.station_params.companyHp &&
                !this.userService.appData.station_params.dbName &&
                !this.userService.appData.station_params.hashCompanyId) ||
            (this.userService.appData.station_params.station_id &&
                this.userService.appData.station_params.custId &&
                this.userService.appData.station_params.companyHp &&
                this.userService.appData.station_params.dbName &&
                this.userService.appData.station_params.hashCompanyId &&
                this.userService.appData.station_params.bookKeepingId)
        ) {
            this.showModalErrorParams = false;
        } else {
            this.showModalErrorParams = true;
            if (
                this.userService.appData.station_params.custId &&
                this.userService.appData.station_params.station_id
            ) {
                this.erpService
                    .writeGeneralError({
                        stationId: this.userService.appData.station_id,
                        errorMessage:
                            'Bad redirect url - ' +
                            this.userService.appData.station_params.url
                    })
                    .subscribe((response: any) => {
                    });
            }
        }

        if (!this.showModalErrorParams) {
            if (!this.userService.appData.isAdmin) {
                this.agreementPopup = this.userService.appData.trustStatus
                    .agreementPopup
                    ? {
                        agreementConfirmation: null,
                        sendMarketingInformation: null,
                        agreementClicked: false,
                        dailyMail: true,
                        step: 1
                    }
                    : false;
            }

            if (!this.agreementPopup) {
                this.accountsForStation = {};
                this.currencyList = [];
                this.erpService.getCurrencyList().subscribe((responseCurr) => {
                    this.currencyList = responseCurr
                        ? responseCurr['body']
                        : responseCurr;

                    this.erpService
                        .getAccountsForStation({
                            uuid: this.userService.appData.station_id
                        })
                        .subscribe((response: any) => {
                            this.accountsForStation = response ? response['body'] : response;
                            this.accountsForStation.sourceProgramId = this.getSourceProgramId(
                                this.accountsForStation.sourceProgram
                            );

                            if (this.accountsForStation.accountsByStationData) {
                                this.accountsForStation.accountsByStationData.forEach((it) => {
                                    it.accountDetails.forEach((accChild) => {
                                        const sign = this.currencyList.find(
                                            (curr) => curr.id === accChild.currencyId
                                        );
                                        accChild.sign = sign ? sign.sign : null;
                                    });
                                });
                                this.accFromBank = [];
                                JSON.parse(
                                    JSON.stringify(this.accountsForStation.accountsByStationData)
                                ).forEach((it) => {
                                    const accFromBank = it.accountDetails
                                        .filter((acc: any) => acc.accountType === 'BANK')
                                        // .filter(acc => acc.tokenTargetType === 'ACCOUNT')
                                        .map((accChild) => {
                                            accChild.companyAccountId = accChild.accountId;
                                            return accChild;
                                        });
                                    this.accFromBank.push(...accFromBank);
                                });
                                console.log('accFromBank: ', this.accFromBank);
                                this.accountsForStation.accountsByStationDataSaved = JSON.parse(
                                    JSON.stringify(this.accountsForStation.accountsByStationData)
                                );

                                this.userService.appData.accFromBank = [];
                                JSON.parse(
                                    JSON.stringify(this.accountsForStation.accountsByStationData)
                                ).forEach((it) => {
                                    it.accountDetails.forEach((accChild) => {
                                        this.userService.appData.accFromBank.push({
                                            accountNickname: accChild.accountNickname
                                        });
                                    });
                                });
                                this.userService.appData.companiesFromBank =
                                    this.accountsForStation.accountsByStationDataSaved.map(
                                        (it) => {
                                            return {
                                                companyName: it.companyName
                                            };
                                        }
                                    );
                            } else {
                                this.accountsForStation.accountsByStationData = [];
                                this.accountsForStation.accountsByStationDataSaved = [];
                            }

                            if (
                                !this.userService.appData.station_params.isUrlWithoutParams &&
                                this.userService.appData.station_params.station_id &&
                                this.userService.appData.station_params.custId &&
                                this.userService.appData.station_params.companyHp
                            ) {
                                this.erpService
                                    .screenPopupType({
                                        stationId: this.userService.appData.station_id,
                                        balance: this.userService.appData.station_params.balance,
                                        dateValue:
                                        this.userService.appData.station_params.dateValue,
                                        total: this.userService.appData.station_params.total,
                                        custId: this.userService.appData.station_params.custId,
                                        companyHp: this.userService.appData.station_params.companyHp
                                    })
                                    .subscribe((responseType) => {
                                        this.screenPopupType = responseType
                                            ? responseType['body']
                                            : responseType;
                                        // this.screenPopupType.popupType = 'CONNECT';
                                        this.screenPopupType.linked = true;
                                        const accMatch = JSON.parse(
                                            JSON.stringify(
                                                this.accountsForStation.accountsByStationDataSaved
                                            )
                                        ).filter((it) => {
                                            it.accountDetails = it.accountDetails.filter(
                                                (child) =>
                                                    child.accountId === this.screenPopupType.accountId
                                            );
                                            if (it.accountDetails.length) {
                                                return it;
                                            }
                                        });
                                        if (accMatch.length) {
                                            this.screenPopupType.accountType =
                                                accMatch[0].accountType;
                                            this.screenPopupType.companyId = accMatch[0].companyId;
                                            this.screenPopupType.bankAccountId =
                                                accMatch[0].accountDetails[0].bankAccountId;
                                            this.screenPopupType.currencyId =
                                                accMatch[0].accountDetails[0].currencyId;
                                            this.screenPopupType.sign =
                                                accMatch[0].accountDetails[0].sign;
                                            this.screenPopupType.accountNickname =
                                                accMatch[0].accountDetails[0].accountNickname;
                                            this.screenPopupType.snifId =
                                                accMatch[0].accountDetails[0].snifId;
                                            this.setMinDateAndRebuildConstraints(
                                                accMatch[0].accountDetails[0].oldestTransDate
                                            );
                                        }

                                        // accountId: null
                                        // accountType: null
                                        // popupType: "CONNECT"
                                        if (this.screenPopupType.popupType === 'CONNECT') {
                                            this.accountConnectRecommendation();
                                        }
                                        if (this.screenPopupType.popupType === 'IMPORT_ERROR') {
                                            let matchCsutId = null;
                                            this.accountsForStation.accountsByStationDataSaved.forEach(
                                                (it) => {
                                                    const isMatchCsutId = it.accountDetails.find(
                                                        (child) =>
                                                            child.izuCustId ===
                                                            this.userService.appData.station_params.custId
                                                    );
                                                    if (isMatchCsutId) {
                                                        isMatchCsutId.companyId = it.companyId;
                                                        matchCsutId = isMatchCsutId;
                                                    }
                                                }
                                            );
                                            if (matchCsutId) {
                                                if (matchCsutId.tokenStatus !== 'VALID') {
                                                    this.showModalStatus = matchCsutId;
                                                }
                                            }
                                        }
                                        if (
                                            this.screenPopupType.popupType === 'BALANCE_DIFFERENCE' &&
                                            this.screenPopupType.accountType === 'BANK'
                                        ) {
                                            this.balanceDifference();
                                        }
                                        if (
                                            (this.screenPopupType.popupType ===
                                                'BALANCE_DIFFERENCE' ||
                                                this.screenPopupType.popupType === 'CUST_EMPTY') &&
                                            (this.screenPopupType.accountType === 'CCARD' ||
                                                this.screenPopupType.accountType === 'CCARD_MATAH')
                                        ) {
                                            this.biziboxAccountHistoryCcard();
                                        }

                                        this.userService.appData.station_params.isUrlWithoutParams =
                                            true;
                                    });
                            }
                        });
                });
            }
        }
    }

    accountConnectRecommendation(changeToConnect?: boolean) {
        this.accountConnectRecommendationResponse = [];
        this.selectedValue = null;
        this.accountConnectRecommendationList = false;
        if (changeToConnect) {
            this.erpService
                .addCompany({
                    stationId: this.userService.appData.station_id,
                    companyHp: this.userService.appData.station_params.companyHp,
                    hashCompanyId: this.userService.appData.station_params.hashCompanyId
                })
                .subscribe((response: any) => {
                });
        }
        this.erpService
            .accountConnectRecommendation({
                stationId: this.userService.appData.station_id,
                balance: this.userService.appData.station_params.balance,
                dateValue: this.userService.appData.station_params.dateValue,
                total: this.userService.appData.station_params.total
            })
            .subscribe((response: any) => {
                this.accountConnectRecommendationResponse = response
                    ? response['body']
                    : response;
                this.accountConnectRecommendationResponse.forEach((it) => {
                    const sign = this.currencyList.find(
                        (curr) => curr.id === it.currencyId
                    );
                    it.sign = sign ? sign.sign : null;
                    this.accountsForStation.accountsByStationDataSaved.forEach(
                        (accGr) => {
                            const isSameAcc = accGr.accountDetails.find(
                                (item) => item.accountId === it.accountId
                            );
                            if (isSameAcc) {
                                it.currencyString = isSameAcc.currencyString;
                            }
                        }
                    );
                });
                // this.accountConnectRecommendationResponse[0].recommended = true;
                // this.accountConnectRecommendationResponse[0].popupType = 'NONE';

                this.accountConnectRecommendationList = {
                    linked: this.accountConnectRecommendationResponse.filter(
                        (it) => it.linked
                    ),
                    unlinked: this.accountConnectRecommendationResponse.filter(
                        (it) => !it.linked
                    )
                };

                if (changeToConnect) {
                    this.screenPopupType.popupType = 'CONNECT';
                }
            });
    }

    addContact() {
        this.arr.push(
            this.fb.group({
                firstName: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [Validators.required]
                    }
                ),
                lastName: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [Validators.required]
                    }
                ),
                phone: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [
                            Validators.required,
                            ValidatorsFactory.cellNumberValidatorIL
                        ],
                        updateOn: 'change'
                    }
                ),
                mail: new FormControl(
                    {
                        value: null,
                        disabled: false
                    },
                    {
                        validators: [Validators.required, ValidatorsFactory.emailExtended],
                        asyncValidators: this.emailNotExistsValidator.bind(this),
                        updateOn: 'change'
                    }
                ),
                dailyMail: this.fb.control(true),
                activated: false,
                stationUserId: null
            })
        );
        this.activeRow = this.arr.controls.length - 1;
    }

    deleteContactFromModal(index: number, contact: any) {
        const stationUserId = contact.value.stationUserId;
        this.deleteContactModal = false;
        // this.arr.removeAt(index);
        const value = this.arr.value;
        this.arr.patchValue(
            value
                .slice(0, index)
                .concat(value.slice(index + 1))
                .concat(value[index])
        );
        this.arr.removeAt(value.length - 1);
        this.arr.updateValueAndValidity();
        if (stationUserId) {
            this.erpService
                .deleteUser({
                    uuid: stationUserId
                })
                .subscribe(() => {
                });
        }
    }

    deleteContact(index: number, contact: any) {
        if (contact.value.stationUserId) {
            this.deleteContactModal = {
                index,
                contact
            };
        } else {
            const value = this.arr.value;
            this.arr.patchValue(
                value
                    .slice(0, index)
                    .concat(value.slice(index + 1))
                    .concat(value[index])
            );
            this.arr.removeAt(value.length - 1);
            this.arr.updateValueAndValidity();
        }
    }

    enterInput(e: any) {
        // console.log('enter')
        e.preventDefault();
        e.stopPropagation();
    }

    handleKeyPress(e: any) {
        const str = String.fromCharCode(e.which);
        if (!str) {
            return;
        }
        const isHebrew = str.search(/[\u0590-\u05FF]/) >= 0;
        if (isHebrew) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    activeRowClick() {
        if (!this.globalListenerWhenInEdit) {
            this.globalListenerWhenInEdit = this.renderer.listen(
                'document',
                'click',
                ($event) => {
                    if (this.activeRow === null) {
                        this.globalListenerWhenInEdit();
                        this.globalListenerWhenInEdit = null;
                        return;
                    }
                    //   console.log('details row listener called');
                    const eventPath = BrowserService.pathFrom($event);
                    console.log('Checking if should terminate edit: %o', eventPath);
                    const shouldTerminateEdit =
                        !eventPath[0].id.includes('idRow_') &&
                        !eventPath.some((node) => node.id && node.id.includes('idRow_'));
                    if (shouldTerminateEdit) {
                        console.log('Terminating edit (clicked on : %o)', eventPath);
                        this.activeRow = null;
                        if (this.globalListenerWhenInEdit) {
                            this.globalListenerWhenInEdit();
                            this.globalListenerWhenInEdit = null;
                        }
                    }
                }
            );
        }
    }

    get arr(): FormArray {
        return this.contacts.get('contactsRows') as FormArray;
    }

    trackById(index: number, val: any): any {
        return val.stationUserId + '_' + index;
    }

    creationSuccessClose(eve: any) {
        this.addTokenPrompt.visible = false;
        this.getAccountsForStation();
        if (eve !== true) {
            this.alertAppTokenOtpModal = true;
        }
    }

    reActivate(contact: any) {
        // console.log('contact.value.stationUserId', contact.value.stationUserId);
        this.erpService
            .sendActivationMail({
                stationUserId: contact.value.stationUserId,
                stationId: this.userService.appData.station_id,
                mail: contact.value.mail
            })
            .subscribe(() => {
                contact.value.activated = true;
            });
    }

    getUserForStation() {
        this.contacts = this.fb.group({
            contactsRows: this.fb.array([])
        });
        this.activeRow = null;
        this.loader = true;
        this.userForStation = {};
        this.erpService
            .getUserForStation({
                uuid: this.userService.appData.station_id
            })
            .subscribe((response: any) => {
                this.userForStation.data = response ? response['body'] : response;

                // activated: false
                // dailyMail: false
                // firstName: "Je"
                // lastName: "Sus"
                // mail: null
                // phone: "0556634334"
                // stationUserId: "1760b1f3-270c-4837-b0ad-936e5301fe4b"

                this.userForStation.data.forEach((row) => {
                    this.arr.push(
                        this.fb.group({
                            firstName: new FormControl(
                                {
                                    value: row.firstName,
                                    disabled: false
                                },
                                {
                                    validators: [Validators.required]
                                }
                            ),
                            lastName: new FormControl(
                                {
                                    value: row.lastName,
                                    disabled: false
                                },
                                {
                                    validators: [Validators.required]
                                }
                            ),
                            phone: new FormControl(
                                {
                                    value: row.phone,
                                    disabled: false
                                },
                                {
                                    validators: [
                                        Validators.required,
                                        ValidatorsFactory.cellNumberValidatorIL
                                    ],
                                    updateOn: 'change'
                                }
                            ),
                            mail: new FormControl(
                                {
                                    value: row.mail,
                                    disabled: false
                                },
                                {
                                    validators: [
                                        Validators.required,
                                        ValidatorsFactory.emailExtended
                                    ],
                                    asyncValidators: this.emailNotExistsValidator.bind(this),
                                    updateOn: 'change'
                                }
                            ),
                            dailyMail: this.fb.control(row.dailyMail),
                            activated: row.activated,
                            stationUserId: row.stationUserId,
                            src: JSON.parse(JSON.stringify(row))
                        })
                    );
                });
                this.loader = false;
            });
    }

    private emailNotExistsValidator(
        fc: AbstractControl
    ): Observable<ValidationErrors | null> {
        if (fc && fc.dirty && fc.value) {
            const controls = this.arr.controls;
            const stationUserId = fc.parent.value.stationUserId;
            let exist = false;
            controls.forEach((it) => {
                if (
                    it.value.stationUserId !== stationUserId &&
                    it.value.mail === fc.value
                ) {
                    exist = true;
                }
            });
            if (exist) {
                return of({exist: exist});
            } else {
                return of(null);
            }
        }

        return of(null);
    }

    updateUser() {
        const arrUsers = [];
        if (this.arr && this.arr.controls && this.arr.controls.length) {
            this.arr.controls.forEach((contact, idx) => {
                if (contact.valid) {
                    if (contact.value.stationUserId) {
                        if (
                            contact.value.src.activated !== contact.value.activated ||
                            contact.value.src.dailyMail !== contact.get('dailyMail').value ||
                            contact.value.src.firstName !== contact.get('firstName').value ||
                            contact.value.src.lastName !== contact.get('lastName').value ||
                            contact.value.src.mail !== contact.get('mail').value ||
                            contact.value.src.phone !== contact.get('phone').value
                        ) {
                            arrUsers.push({
                                activated: contact.value.activated,
                                dailyMail: contact.get('dailyMail').value,
                                firstName: contact.get('firstName').value,
                                lastName: contact.get('lastName').value,
                                mail: contact.get('mail').value,
                                phone: contact.get('phone').value,
                                stationUserId: contact.value.stationUserId
                            });
                        }
                    } else {
                        arrUsers.push({
                            activated: contact.value.activated,
                            dailyMail: contact.get('dailyMail').value,
                            firstName: contact.get('firstName').value,
                            lastName: contact.get('lastName').value,
                            mail: contact.get('mail').value,
                            phone: contact.get('phone').value,
                            stationUserId: null
                        });
                    }
                }
            });
        }

        if (arrUsers.length) {
            this.erpService
                .updateUser({
                    users: arrUsers,
                    stationId: this.userService.appData.station_id
                })
                .subscribe(() => {
                });
        }

        this.userForStation = false;
    }

    biziboxReconnect(
        lastBankTransId: any,
        dateFrom: any,
        balanceDifferenceAuto?: any
    ) {
        this.erpService
            .biziboxReconnect({
                // 'companyId': this.screenPopupType.companyId,
                accountType: this.screenPopupType.accountType,
                accountId: this.screenPopupType.accountId,
                stationId: this.userService.appData.station_id,
                custId: this.userService.appData.station_params.custId,
                sourceProgramId: this.accountsForStation.sourceProgramId,
                companyHp: this.userService.appData.station_params.companyHp,
                companyName: this.userService.appData.station_params.companyName,
                lastBankTransId:
                    balanceDifferenceAuto !== undefined && balanceDifferenceAuto === false
                        ? '00000000-0000-0000-0333-000000000000'
                        : lastBankTransId,
                balanceDifference:
                    balanceDifferenceAuto && this.screenPopupType.balanceDifference
                        ? this.screenPopupType.balanceDifference.balanceDifference
                        : null,
                dateFrom: dateFrom,
                dbName: this.userService.appData.station_params.dbName,
                hashCompanyId: this.userService.appData.station_params.hashCompanyId
            })
            .subscribe((response: any) => {
            });
    }

    balanceDifference() {
        this.screenPopupType.biziboxAccountHistory = false;
        this.erpService
            .balanceDifference({
                balance: this.userService.appData.station_params.balance,
                dateValue: this.userService.appData.station_params.dateValue,
                total: this.userService.appData.station_params.total,
                companyAccountId: this.screenPopupType.accountId
            })
            .subscribe((response: any) => {
                this.screenPopupType.balanceDifference = response
                    ? response['body']
                    : response;
                // balanceDifference: 0
                // biziboxBalance: 188
                // dateValue: 1634568033
                // lastBankTransId: null
                // total: null
            });
    }

    biziboxAccountHistoryCcard() {
        this.erpService
            .biziboxAccountHistory({
                dateValue: this.userService.appData.station_params.dateValue,
                accountId: this.screenPopupType.accountId,
                accountType: this.screenPopupType.accountType
            })
            .subscribe((response: any) => {
                this.screenPopupType.biziboxAccountHistory = response
                    ? response['body']
                    : response;
                this.screenPopupType.biziboxAccountHistory.forEach((v) => {
                    v.value = v.cycleDate + '_' + v.currencyId;
                    const sign = this.currencyList.find(
                        (curr) => curr.id === v.currencyId
                    );
                    v.sign = sign ? sign.sign : '₪';
                });
                this.screenPopupType.biziboxAccountHistory.unshift({
                    value: 'startingNextCycle',
                    startingNextCycle: true,
                    cycleDate: this.userService.appData.moment('1980-01-01').valueOf()
                });
                this.screenPopupType.balanceDifference = 'none';

                // "asmachta": "string",
                //     "currencyId": 0,
                //     "cycleDate": "2018-07-03T00:00:00",
                //     "cycleTotal": 0,
                //     "dateValue": "2018-07-03T00:00:00",
                //     "description": "string",
                //     "itra": 0,
                //     "recommended": true,
                //     "rowsCount": 0,
                //     "total": 0

                // currencyId: 1
                // cycleDate: 1633813200000
                // cycleTotal: 16127.14
                // rowsCount: 88
            });
    }

    bankConnect(
        lastBankTransId: any,
        dateFrom: any,
        balanceDifferenceAuto?: any
    ) {
        this.erpService
            .bankConnect({
                companyId: null,
                companyAccountId: this.screenPopupType.accountId,
                stationId: this.userService.appData.station_params.station_id,
                custId: this.userService.appData.station_params.custId,
                sourceProgramId: this.accountsForStation.sourceProgramId,
                companyHp: this.userService.appData.station_params.companyHp,
                companyName: this.userService.appData.station_params.companyName,
                lastBankTransId:
                    balanceDifferenceAuto !== undefined && balanceDifferenceAuto === false
                        ? '00000000-0000-0000-0333-000000000000'
                        : lastBankTransId,
                balanceDifference:
                    balanceDifferenceAuto && this.screenPopupType.balanceDifference
                        ? this.screenPopupType.balanceDifference.balanceDifference
                        : null,
                dateFrom: dateFrom,
                dbName: this.userService.appData.station_params.dbName,
                hashCompanyId: this.userService.appData.station_params.hashCompanyId
            })
            .subscribe((response: any) => {
            });
    }

    creditcardConnect(dateFrom: any, balanceDifference = null) {
        this.erpService
            .creditcardConnect({
                companyId: null,
                creditCardId: this.screenPopupType.accountId,
                stationId: this.userService.appData.station_params.station_id,
                custId: this.userService.appData.station_params.custId,
                sourceProgramId: this.accountsForStation.sourceProgramId,
                companyHp: this.userService.appData.station_params.companyHp,
                companyName: this.userService.appData.station_params.companyName,
                balanceDifference: balanceDifference,
                dateFrom: dateFrom,
                dbName: this.userService.appData.station_params.dbName,
                hashCompanyId: this.userService.appData.station_params.hashCompanyId,
                accountType: this.selectedValue ? this.selectedValue.accountType : null
            })
            .subscribe((response: any) => {
            });
    }

    biziboxAccountHistory() {
        this.screenPopupType.biziboxAccountHistory = true;
        this.erpService
            .biziboxAccountHistory({
                dateValue: this.userService.appData.station_params.dateValue,
                accountId: this.screenPopupType.accountId,
                accountType: this.screenPopupType.accountType
            })
            .subscribe((response: any) => {
                this.screenPopupType.biziboxAccountHistory = response
                    ? response['body']
                    : response;

                // this.screenPopupType.biziboxAccountHistory = [
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה תיאור לבדיקה תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     },
                //     {
                //         asmachta: 2412412,
                //         dateValue: 1634677998385,
                //         total: 12412,
                //         itra: 43412,
                //         description: 'תיאור לבדיקה'
                //     }
                // ];
                // "asmachta": "string",
                //     "currencyId": 0,
                //     "cycleDate": "2018-07-03T00:00:00",
                //     "cycleTotal": 0,
                //     "dateValue": "2018-07-03T00:00:00",
                //     "description": "string",
                //     "itra": 0,
                //     "recommended": true,
                //     "rowsCount": 0,
                //     "total": 0
            });
    }

    accountConnectRecommendationNext() {
        console.log('this.selectedValue: ', this.selectedValue);
        this.screenPopupType.accountId = this.selectedValue.accountId;
        this.screenPopupType.accountType = this.selectedValue.accountType;
        this.screenPopupType.linked = this.selectedValue.linked;
        this.screenPopupType.lastBankTransId = this.selectedValue.lastBankTransId;
        const accMatch = JSON.parse(
            JSON.stringify(this.accountsForStation.accountsByStationDataSaved)
        ).filter((it) => {
            it.accountDetails = it.accountDetails.filter(
                (child) => child.accountId === this.screenPopupType.accountId
            );
            if (it.accountDetails.length) {
                return it;
            }
        });
        if (accMatch.length) {
            this.screenPopupType.companyId = accMatch[0].companyId;
            this.screenPopupType.bankAccountId =
                accMatch[0].accountDetails[0].bankAccountId;
            this.screenPopupType.currencyId =
                accMatch[0].accountDetails[0].currencyId;
            this.screenPopupType.sign = accMatch[0].accountDetails[0].sign;
            this.screenPopupType.accountNickname =
                accMatch[0].accountDetails[0].accountNickname;
            this.screenPopupType.snifId = accMatch[0].accountDetails[0].snifId;
        }

        if (this.selectedValue.popupType === 'NONE') {
            this.screenPopupType.popupType = false;
            if (this.selectedValue.linked) {
                // v1/account-key/bizibox-reconnect
                this.biziboxReconnect(
                    this.screenPopupType.lastBankTransId,
                    this.userService.appData.station_params.dateValue
                );
            } else {
                if (this.selectedValue.accountType === 'BANK') {
                    // v1/account-key/bank-connect
                    this.bankConnect(
                        this.screenPopupType.lastBankTransId,
                        this.userService.appData.station_params.dateValue
                    );
                } else {
                    // v1/account-key/creditcard-connect
                    this.creditcardConnect(
                        this.userService.appData.station_params.dateValue
                    );
                }
            }
            this.alertEndProcess = true;
        } else {
            this.screenPopupType.popupType = this.selectedValue.popupType;

            if (
                this.screenPopupType.popupType === 'BALANCE_DIFFERENCE' &&
                this.screenPopupType.accountType === 'BANK'
            ) {
                this.balanceDifference();
            }

            if (
                (this.screenPopupType.popupType === 'BALANCE_DIFFERENCE' ||
                    this.screenPopupType.popupType === 'CUST_EMPTY') &&
                (this.screenPopupType.accountType === 'CCARD' ||
                    this.screenPopupType.accountType === 'CCARD_MATAH')
            ) {
                this.biziboxAccountHistoryCcard();
            }

            // this.screenPopupType.popupType = 'CUST_EMPTY';
            // this.screenPopupType.accountType = 'BANK';
        }
    }

    nextAfterCUSTEMPTY() {
        const dateFrom = new Date(
            this.selection.from.year,
            this.selection.from.month,
            this.selection.from.day
        );
        this.screenPopupType.popupType = false;
        if (this.screenPopupType.linked) {
            this.biziboxReconnect(null, dateFrom);
        } else {
            this.bankConnect(null, dateFrom);
        }
        this.alertEndProcess = true;
    }

    nextAfterBALANCEDIFFERENCE() {
        this.screenPopupType.popupType = false;
        if (this.screenPopupType.linked) {
            this.biziboxReconnect(
                this.screenPopupType.lastBankTransId,
                this.userService.appData.station_params.dateValue,
                this.balanceDifferenceAuto
            );
        } else {
            this.bankConnect(
                this.screenPopupType.lastBankTransId,
                this.userService.appData.station_params.dateValue,
                this.balanceDifferenceAuto
            );
        }
        this.alertEndProcess = true;
    }

    nextAfterCCARD() {
        // console.log('this.screenPopupType.dateFrom', this.screenPopupType.dateFrom.cycleDate);
        if (
            (this.screenPopupType.accountType === 'CCARD' ||
                this.screenPopupType.accountType === 'CCARD_MATAH') &&
            this.screenPopupType.popupType === 'BALANCE_DIFFERENCE'
        ) {
            this.screenPopupType.popupType = false;
            this.creditcardConnect(
                this.screenPopupType.dateFrom.cycleDate,
                this.screenPopupType.balanceDifference === 'balance'
                    ? this.userService.appData.station_params.balance
                    : null
            );
            this.alertEndProcess = true;
            return;
        }

        this.screenPopupType.popupType = false;
        if (this.screenPopupType.linked) {
            this.biziboxReconnect(
                null,
                this.screenPopupType.dateFrom.cycleDate,
                null
            );
        } else {
            this.creditcardConnect(
                this.screenPopupType.dateFrom.cycleDate,
                this.screenPopupType.balanceDifference === 'balance'
                    ? this.userService.appData.station_params.balance
                    : null
            );
        }
        this.alertEndProcess = true;
    }

    printScreen() {
        this.reportService.reportIsProcessing$.next(true);
        setTimeout(() => {
            if (this.elemToPrint && this.elemToPrint['nativeElement']) {
                BrowserService.printHtml(
                    this.elemToPrint['nativeElement'],
                    'הסכם שימוש ומדיניות הפרטיות'
                );
                this.reportService.reportIsProcessing$.next(false);
            }
        }, 1000);
    }

    printHistoryTable() {
        this.reportService.reportIsProcessing$.next(true);
        setTimeout(() => {
            if (this.historyToPrint && this.historyToPrint['nativeElement']) {
                BrowserService.printHtml(
                    this.historyToPrint['nativeElement'],
                    'השוואת תנועות' +
                    ' - ' +
                    this.userService.appData.station_params.companyName +
                    ' / ' +
                    'חש ' +
                    this.screenPopupType.snifId +
                    ' / ' +
                    this.screenPopupType.accountNickname
                );
                this.reportService.reportIsProcessing$.next(false);
            }
        }, 1000);
    }

    updateAgreementConfirmation(agreementPopup: any) {
        this.userService.appData.trustStatus.agreementPopup = false;
        this.getAccountsForStation();
        this.erpService
            .updateAgreementConfirmation({
                uuid: this.userService.appData.station_id
            })
            .subscribe((response: any) => {
            });
    }

    disconnect(row: any) {
        if (row.accountType === 'BANK') {
            this.erpService
                .bankDisconnect({
                    uuid: row.accountId
                })
                .subscribe((response: any) => {
                    setTimeout(() => {
                        this.getAccountsForStation();
                    }, 3000);
                });
        }
        if (row.accountType === 'CCARD' || row.accountType === 'CCARD_MATAH') {
            this.erpService
                .creditcardDisconnect({
                    creditCardId: row.accountId,
                    accountType: row.accountType
                })
                .subscribe((response: any) => {
                    setTimeout(() => {
                        this.getAccountsForStation();
                    }, 3000);
                });
        }
    }

    ngAfterViewInit(): void {
        console.log('ngAfterViewInit');
    }

    trackCompany(idx: number, item: any) {
        return (item ? item.companyId : null) || idx;
    }

    trackAccount(idx: number, item: any) {
        return (item ? item.accountId : null) || idx;
    }


    private toMonths(mon: number, year: number): number {
        if (mon < 0) {
            mon = mon + 12;
            year -= 1;
        } else if (mon >= 12) {
            mon = mon % 12;
            year += 1;
        }
        return year * 12 + mon;
    }

    mayNavigateTo(mon: number | null, year: number) {
        const inpnum = this.toMonths(mon, year);

        return (
            this.toMonths(
                mon === null ? 0 : this.allowed.from.month,
                this.allowed.from.year
            ) <= inpnum &&
            inpnum <=
            this.toMonths(
                mon === null ? 0 : this.allowed.till.month,
                this.allowed.till.year
            )
        );
    }

    isBefore(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) <
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    isAfter(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) >
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    isEqual(
        mon: number | null,
        year: number,
        constraint: { month: number; year: number }
    ) {
        return (
            this.toMonths(mon, year) ===
            this.toMonths(mon === null ? 0 : constraint.month, constraint.year)
        );
    }

    makesSelectionInvalid(from: RangePoint, till: RangePoint) {
        if (!from || !till) {
            return false;
        }

        return RangePoint.asDate(from) > RangePoint.asDate(till);
    }

    isInsideSelectionRange(year: number, month: number, day: number = 0) {
        if (!this.selection.from || !this.selection.till) {
            return false;
        }

        if (day === 0) {
            const inpnum = this.toMonths(month, year);
            return (
                this.toMonths(this.selection.from.month, this.selection.from.year) <=
                inpnum &&
                inpnum <=
                this.toMonths(this.selection.till.month, this.selection.till.year)
            );
        }

        const dt = new Date(year, month, day);
        return (
            new Date(
                this.selection.from.year,
                this.selection.from.month,
                this.selection.from.day
            ) <= dt &&
            dt <=
            new Date(
                this.selection.till.year,
                this.selection.till.month,
                this.selection.till.day
            )
        );
    }

    stepMonth(monYear: { month: number; year: number }, step: number) {
        const rsltMonIdx = monYear.month + step;
        if (rsltMonIdx < 0) {
            monYear.month = rsltMonIdx + 12;
            monYear.year -= 1;
        } else if (rsltMonIdx >= 12) {
            monYear.month = rsltMonIdx % 12;
            monYear.year += 1;
        } else {
            monYear.month = rsltMonIdx;
        }
    }

    private rebuildLists(): void {
        this.years = [];
        for (let i = this.allowed.from.year; i <= this.allowed.till.year; i++) {
            this.years.push(i);
        }
    }

    private rebuildConstraints() {
        this.allowed = {
            from: new RangePoint(
                this.min.getDate(),
                this.min.getMonth(),
                this.min.getFullYear()
            ),
            till: new RangePoint(
                this.max.getDate(),
                this.max.getMonth(),
                this.max.getFullYear()
            )
        };

        this.rebuildLists();

        this.current = {
            from:
                this.selection && this.selection.from
                    ? {
                        month: this.selection.from.month,
                        year: this.selection.from.year
                    }
                    : {
                        month: this.allowed.from.month,
                        year: this.allowed.from.year
                    },
            till:
                this.selection && this.selection.till
                    ? {
                        month: this.selection.till.month,
                        year: this.selection.till.year
                    }
                    : {
                        month: this.allowed.till.month,
                        year: this.allowed.till.year
                    }
        };
        this.currentDates = {
            from: this.createMonth(this.current.from),
            till: this.createMonth(this.current.till)
        };
    }

    createMonth(monYear: { month: number; year: number }): {
        day: number;
        month: number;
        year: number;
        today: boolean;
        selectable: boolean;
    }[][] {
        const dates: {
            day: number;
            month: number;
            year: number;
            today: boolean;
            selectable: boolean;
        }[][] = [];
        const firstDay = this.getFirstDayOfMonthIndex(monYear.month, monYear.year);
        const daysLength = this.getDaysCountInMonth(monYear.month, monYear.year);
        const prevMonthDaysLength = this.getDaysCountInPrevMonth(
            monYear.month,
            monYear.year
        );
        const sundayIndex = this.getSundayIndex();
        let dayNo = 1;
        const today = this.userService.appData.moment().toDate();

        for (let i = 0; i < 6; i++) {
            const week = [];

            if (i === 0) {
                for (
                    let j = prevMonthDaysLength - firstDay + 1;
                    j <= prevMonthDaysLength;
                    j++
                ) {
                    const prev = this.getPreviousMonthAndYear(
                        monYear.month,
                        monYear.year
                    );
                    week.push({
                        day: j,
                        month: prev.month,
                        year: prev.year,
                        otherMonth: true,
                        today: this.isToday(today, j, prev.month, prev.year),
                        selectable: this.isSelectable(j, prev.month, prev.year)
                    });
                }

                const remainingDaysLength = 7 - week.length;
                for (let j = 0; j < remainingDaysLength; j++) {
                    week.push({
                        day: dayNo,
                        month: monYear.month,
                        year: monYear.year,
                        today: this.isToday(today, dayNo, monYear.month, monYear.year),
                        selectable: this.isSelectable(dayNo, monYear.month, monYear.year)
                    });
                    dayNo++;
                }
            } else {
                for (let j = 0; j < 7; j++) {
                    if (dayNo > daysLength) {
                        const next = this.getNextMonthAndYear(monYear.month, monYear.year);
                        week.push({
                            day: dayNo - daysLength,
                            month: next.month,
                            year: next.year,
                            otherMonth: true,
                            today: this.isToday(
                                today,
                                dayNo - daysLength,
                                next.month,
                                next.year
                            ),
                            selectable: this.isSelectable(
                                dayNo - daysLength,
                                next.month,
                                next.year
                            )
                        });
                    } else {
                        week.push({
                            day: dayNo,
                            month: monYear.month,
                            year: monYear.year,
                            today: this.isToday(today, dayNo, monYear.month, monYear.year),
                            selectable: this.isSelectable(dayNo, monYear.month, monYear.year)
                        });
                    }

                    dayNo++;
                }
            }

            dates.push(week);
        }

        return dates;
    }

    getFirstDayOfMonthIndex(month: number, year: number) {
        const day = new Date();
        day.setDate(1);
        day.setMonth(month);
        day.setFullYear(year);

        const dayIndex = day.getDay() + this.getSundayIndex();
        return dayIndex >= 7 ? dayIndex - 7 : dayIndex;
    }

    getDaysCountInMonth(month: number, year: number) {
        return 32 - this.daylightSavingAdjust(new Date(year, month, 32)).getDate();
    }

    getDaysCountInPrevMonth(month: number, year: number) {
        const prev = this.getPreviousMonthAndYear(month, year);
        return this.getDaysCountInMonth(prev.month, prev.year);
    }

    getPreviousMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 0) {
            m = 11;
            y = year - 1;
        } else {
            m = month - 1;
            y = year;
        }

        return {month: m, year: y};
    }

    getNextMonthAndYear(month: number, year: number) {
        let m, y;

        if (month === 11) {
            m = 0;
            y = year + 1;
        } else {
            m = month + 1;
            y = year;
        }

        return {month: m, year: y};
    }

    getSundayIndex() {
        return this.locale.firstDayOfWeek > 0 ? 7 - this.locale.firstDayOfWeek : 0;
    }

    daylightSavingAdjust(date) {
        if (!date) {
            return null;
        }

        date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);

        return date;
    }

    isToday(today, day, month, year): boolean {
        return (
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year
        );
    }

    isSelectable(day, month, year): boolean {
        let validMin = true;
        let validMax = true;

        if (this.min) {
            if (this.min.getFullYear() > year) {
                validMin = false;
            } else if (this.min.getFullYear() === year) {
                if (this.min.getMonth() > month) {
                    validMin = false;
                } else if (this.min.getMonth() === month) {
                    if (this.min.getDate() > day) {
                        validMin = false;
                    }
                }
            }
        }

        if (this.max) {
            if (this.max.getFullYear() < year) {
                validMax = false;
            } else if (this.max.getFullYear() === year) {
                if (this.max.getMonth() < month) {
                    validMax = false;
                } else if (this.max.getMonth() === month) {
                    if (this.max.getDate() < day) {
                        validMax = false;
                    }
                }
            }
        }

        return validMin && validMax;
    }
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(
        control: FormControl | null,
        form: FormGroupDirective | NgForm | null | any
    ): boolean {
        const invalidCtrl = !!(control && control.invalid);
        const invalidParent = !!(
            control &&
            control.parent &&
            control.parent.invalid
        );
        return invalidCtrl || invalidParent;
    }
}
