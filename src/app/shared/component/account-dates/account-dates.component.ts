/* tslint:disable:max-line-length */
import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {slideInOut} from '../../animations/slideInOut';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router, UrlSegment} from '@angular/router';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers/customers.component';
import {Subscription} from 'rxjs';

@Component({
    selector: 'app-acc-dates',
    templateUrl: './account-dates.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class AccountDatesComponent implements OnInit, OnDestroy {
    public showPanelDD = false;
    public selectedValue: number | string = 0;
    public selectedValueLastMonth: any;
    public months: any = [];
    public untilDate: any;
    public fromDate: any;
    public untilValue: number | string = 0;
    public fromValue: number | string = 0;
    public calendarFrom: Date = new Date(new Date().getFullYear(), 0, 1);
    public calendarUntil: Date = new Date();
    public selectedValueFromMonth = 0;
    public selectedValueOfYear: number = new Date().getFullYear();
    public selectedValueFromYear: number = new Date().getFullYear();
    public selectedValueUntilMonth: number = new Date().getMonth();
    public selectedValueUntilYear: number = new Date().getFullYear();
    public calendarToday: Date = new Date();
    public langCalendar: any;
    public years: any = AccountDatesComponent.defaultYear(0);
    public optionA: string;
    public optionAArr: any[] = [];
    public hasValidRange = true;
    public minDateInAccounts: Date;
    public currentSettings: any;
    public validationError: string = null;
    public subscription: Subscription;

    // public saveDates: any;
    @ViewChild('selector', {read: ElementRef}) selectorRef: ElementRef;

    private _oldestTransDate: Date;
    get oldestTransDate(): Date {
        return this._oldestTransDate;
    }

    @Input()
    set oldestTransDate(val: Date | null) {
        if (val !== this._oldestTransDate) {
            console.log('applyOldestTransDate => %o', val);

            const currentPath = this.route.pathFromRoot
                .filter((actRoute) => actRoute.snapshot.url.length)
                .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), []);

            this._oldestTransDate = val;

            if (!this._oldestTransDate) {
                this.years = AccountDatesComponent.defaultYear(0);
            } else {
                if (
                    currentPath.find((urlseg) => urlseg.path === 'slika') ||
                    currentPath.find((urlseg) => urlseg.path === 'checks') ||
                    currentPath.find((urlseg) => urlseg.path === 'trialBalance')
                ) {
                    this.years = [];
                    for (
                        let year = new Date().getFullYear() + 3;
                        year >= this._oldestTransDate.getFullYear();
                        year--
                    ) {
                        this.years.unshift({label: year, value: year});
                    }
                } else {
                    this.years = [];
                    for (
                        let year = new Date().getFullYear();
                        year >= this._oldestTransDate.getFullYear();
                        year--
                    ) {
                        this.years.unshift({label: year, value: year});
                    }
                }
            }
        }
    }

    get getMonths(): any {
        const y = [];
        for (let i = 0; i < 12; i++) {
            y.push({
                label:
                    this.translate.translations[this.translate.currentLang].months[i],
                value: i
            });
        }
        return y;
    }

    get yearRange(): string {
        const currentPath = this.route.pathFromRoot
            .filter((actRoute) => actRoute.snapshot.url.length)
            .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), []);
        if (
            this.optionA === 'DaysTazrim' &&
            currentPath.find((urlseg) => urlseg.path === 'details')
        ) {
            return `${this.minDateInAccounts.getFullYear()}:${this.calendarToday.getFullYear()}`;
        } else {
            // console.log('yearRange => %o', `${this.years[this.years.length - 1].value}:${this.years[0].value}`);
            return `${this.years[0].value}:${
                this.years[this.years.length - 1].value
            }`;
        }
    }

    get today(): Date {
        return new Date();
    }

    public get selectedPeriod(): { fromDate: Date | null; toDate: Date | null } {
        const today: Date = this.today;
        let fromDate, toDate;
        switch (this.selectedValue.toString()) {
            case '0':
                toDate = new Date();
                if (this.optionA === 'months') {
                    fromDate = new Date(
                        today.setMonth(-this.selectedValueLastMonth.name)
                    );
                } else if (this.optionA === 'days') {
                    fromDate = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        today.getDate() - this.selectedValueLastMonth.name
                    );
                } else if (this.optionA === 'DaysTazrim') {
                    if (
                        this.userService.appData.userData &&
                        this.userService.appData.userData.accountSelect &&
                        this.userService.appData.userData.accountSelect.length
                    ) {
                        fromDate = new Date(
                            this.userService.appData.userData.accountSelect[0].balanceLastUpdatedDate
                        );
                    } else {
                        fromDate = new Date();
                    }
                    toDate = new Date(
                        fromDate.getFullYear(),
                        fromDate.getMonth(),
                        fromDate.getDate() + this.selectedValueLastMonth.name
                    );
                } else if (
                    this.optionA === 'monthsWithoutCalendar' ||
                    this.optionA === 'monthCredit' ||
                    this.optionA === 'monthCreditWithoutCalendar'
                ) {
                    fromDate = new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() - (this.selectedValueLastMonth.name - 1),
                        1
                    );
                    toDate = new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() + 1,
                        0
                    );
                } else if (this.optionA === 'monthChecks') {
                    fromDate = null;
                    toDate = null;
                } else if (this.optionA === 'aggregateGeneral') {
                    fromDate = new Date(this.selectedValueOfYear, 0, 1);
                    toDate = new Date(this.selectedValueOfYear, 11, 31);
                } else if (this.optionA === 'trialBalance') {
                    fromDate = new Date(1980, 0, 1);
                    toDate = new Date(2029, 0, 1);
                } else if (this.optionA === 'profitAndLoss') {
                    fromDate = new Date(new Date().getFullYear(), 0, 1);
                    toDate = new Date(new Date().getFullYear(), 11, 31);
                } else if (this.optionA === 'bookKeepingAnalyze') {
                    const momentSlctd = this.userService.appData.moment({
                        year: this.selectedValueOfYear,
                        month: this.selectedValueLastMonth,
                        day: 1
                    });
                    fromDate = momentSlctd.toDate();
                    toDate = momentSlctd.endOf('month').toDate();
                    // fromDate = new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1);
                    // toDate = new Date(new Date().getFullYear(), new Date().getMonth() - 2, this.daysInMonth(new Date().getMonth() - 2 + 1, new Date().getFullYear()));
                }

                break;
            case '1':
                fromDate = new Date(
                    this.selectedValueFromYear,
                    this.selectedValueFromMonth,
                    1
                );
                if (this.optionA === 'DaysTazrim') {
                    if (this.fromValue === 0) {
                        if (
                            this.userService.appData.userData.accounts &&
                            this.userService.appData.userData.accountSelect
                        ) {
                            const selectedValueFromMonth = new Date(
                                this.userService.appData.userData.accountSelect.length
                                    ? this.userService.appData.userData.accountSelect[0]
                                        .balanceLastUpdatedDate
                                    : this.userService.appData.userData.accounts[0]
                                        .balanceLastUpdatedDate
                            );
                            fromDate = new Date(
                                selectedValueFromMonth.getFullYear(),
                                selectedValueFromMonth.getMonth(),
                                selectedValueFromMonth.getDate()
                            );
                        } else {
                            fromDate = today;
                        }
                    }
                    toDate = new Date(
                        this.selectedValueUntilYear,
                        this.selectedValueUntilMonth,
                        this.daysInMonth(
                            this.selectedValueUntilMonth + 1,
                            this.selectedValueUntilYear
                        )
                    );
                } else {
                    if (this.untilValue === 0) {
                        toDate = today;
                    } else {
                        toDate = new Date(
                            this.selectedValueUntilYear,
                            this.selectedValueUntilMonth,
                            this.daysInMonth(
                                this.selectedValueUntilMonth + 1,
                                this.selectedValueUntilYear
                            )
                        );
                    }
                }

                break;
            case '2':
                if (
                    this.optionA === 'profitAndLoss' ||
                    this.optionA === 'bookKeepingAnalyze'
                ) {
                    fromDate = new Date(this.selectedValueOfYear, 0, 1);
                    toDate = new Date(this.selectedValueOfYear, 11, 31 - 1);
                } else {
                    fromDate = this.calendarFrom;
                    toDate = this.calendarUntil;
                }
                break;
        }

        if (fromDate) {
            // fromDate = new Date(Date.UTC(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate(), 0, 0, 0, 0));
            fromDate.setHours(0, 0, 0, 0);
        }
        if (toDate) {
            // toDate = new Date(Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59, 999));
            toDate.setHours(23, 59, 59, 999);
        }

        return {
            fromDate: fromDate,
            toDate: toDate
        };
    }

    @Input()
    set option(option: any) {
        if (this.optionA !== option) {
            this.optionA = option;

            if (
                this.optionA === 'months' ||
                this.optionA === 'monthsWithoutCalendar' ||
                this.optionA === 'profitAndLoss' ||
                this.optionA === 'monthCredit' ||
                this.optionA === 'trialBalance' ||
                this.optionA === 'monthCreditWithoutCalendar' ||
                this.optionA === 'monthChecks' ||
                this.optionA === 'aggregateGeneral' ||
                this.optionA === 'profitAndLoss' ||
                this.optionA === 'bookKeepingAnalyze'
            ) {
                if (this.optionA === 'monthChecks' || this.optionA === 'trialBalance') {
                    this.calendarToday = null;
                }
                if (
                    this.optionA === 'aggregateGeneral' &&
                    this.storageService.sessionStorageGetterItem(this.storageKey) === null
                ) {
                    this.selectedValue = 1;

                    const frDateToSelect = new Date();
                    if (frDateToSelect.getDate() === 1) {
                        frDateToSelect.setMonth(frDateToSelect.getMonth() - 1);
                    }
                    this.selectedValueFromMonth = frDateToSelect.getMonth();
                    this.selectedValueFromYear = frDateToSelect.getFullYear();
                }
                // this.selectedValueLastMonth = {name: 3};
                this.optionAArr = [];
                for (let i = 1; i < 13; i++) {
                    this.optionAArr.push({
                        name: i
                    });
                }

                if (
                    ['profitAndLoss', 'bookKeepingAnalyze', 'trialBalance'].includes(
                        this.optionA
                    )
                ) {
                    this.years = []; // AccountDatesComponent.defaultYear(2000 - this.userService.appData.moment().year());
                    for (
                        let i = this.userService.appData.moment().year();
                        i >= 2000;
                        i--
                    ) {
                        this.years.unshift({label: i, value: i});
                    }
                }

                if (this.optionA === 'bookKeepingAnalyze') {
                    if (
                        this.storageService.sessionStorageGetterItem(this.storageKey) ===
                        null
                    ) {
                        this.selectedValue = 2;
                        this.selectedValueOfYear = new Date().getFullYear();
                        // new Date(new Date().getFullYear() - 1, new Date().getMonth(), new Date().getDate()).getFullYear();
                    }
                    if (!this.selectedValueLastMonth) {
                        this.selectedValueLastMonth = new Date(
                            new Date().getFullYear(),
                            new Date().getMonth() - 2,
                            1
                        ).getMonth();
                    }
                } else {
                    if (
                        !this.selectedValueLastMonth ||
                        !this.optionAArr.find(
                            (opt) => opt.name === this.selectedValueLastMonth.name
                        )
                    ) {
                        this.selectedValueLastMonth = {name: 3};
                    }
                }
            } else if (this.optionA === 'days') {
                // this.selectedValueLastMonth = {name: 30};
                this.optionAArr = [
                    {
                        name: 7
                    },
                    {
                        name: 30
                    },
                    {
                        name: 60
                    },
                    {
                        name: 90
                    }
                ];

                if (
                    !this.selectedValueLastMonth ||
                    !this.optionAArr.find(
                        (opt) => opt.name === this.selectedValueLastMonth.name
                    )
                ) {
                    this.selectedValueLastMonth = {name: 30};
                }
            } else if (this.optionA === 'DaysTazrim') {
                // this.selectedValueLastMonth = {name: 30};
                this.optionAArr = [
                    {
                        name: 30
                    },
                    {
                        name: 60
                    },
                    {
                        name: 90
                    }
                ];
                this.calendarToday = null;
                this.untilValue = 1;
                if (
                    !this.selectedValueLastMonth ||
                    !this.optionAArr.find(
                        (opt) => opt.name === this.selectedValueLastMonth.name
                    )
                ) {
                    this.selectedValueLastMonth = {name: 30};
                }
                const currentPath = this.route.pathFromRoot
                    .filter((actRoute) => actRoute.snapshot.url.length)
                    .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), []);

                if (
                    this.userService.appData.userData.accounts &&
                    this.userService.appData.userData.accountSelect
                ) {
                    const calculatedVal =
                        this.userService.appData.userData.accountSelect[0]
                            .balanceLastUpdatedDate;
                    const selectedValueUntilMonth = new Date(
                        new Date(calculatedVal).getFullYear(),
                        new Date(calculatedVal).getMonth() + 1,
                        new Date(calculatedVal).getDate()
                    );
                    this.selectedValueUntilMonth = selectedValueUntilMonth.getMonth();
                    this.selectedValueUntilYear = selectedValueUntilMonth.getFullYear();
                    this.selectedValueFromMonth = new Date(calculatedVal).getMonth();
                    this.selectedValueFromYear = new Date(calculatedVal).getFullYear();

                    this.years = [
                        {
                            label: this.selectedValueFromYear,
                            value: this.selectedValueFromYear
                        },
                        {
                            label: this.selectedValueFromYear + 1,
                            value: this.selectedValueFromYear + 1
                        }
                    ];

                    if (currentPath.find((urlseg) => urlseg.path === 'details')) {
                        const calculatedValOld =
                            this.userService.minOldestTransDateInSelectedAccounts();
                        if (!this.calendarFrom) {
                            this.calendarFrom = new Date(
                                new Date().getFullYear(),
                                new Date().getMonth(),
                                new Date().getDate() - 30
                            );
                            this.calendarUntil = new Date(
                                new Date().getFullYear(),
                                new Date().getMonth(),
                                new Date().getDate() + 30
                            );
                        }
                        this.minDateInAccounts = new Date(calculatedValOld);
                        this.calendarToday = new Date(
                            new Date(calculatedValOld).getFullYear() + 1,
                            new Date(calculatedValOld).getMonth(),
                            new Date(calculatedValOld).getDate()
                        );
                    } else {
                        if (!this.calendarFrom) {
                            this.calendarFrom = new Date(calculatedVal);
                            this.calendarUntil = new Date(
                                this.calendarFrom.getFullYear(),
                                this.calendarFrom.getMonth() + 1,
                                this.calendarFrom.getDate()
                            );
                        }
                        this.minDateInAccounts = new Date(calculatedVal);
                        this.calendarToday = new Date(
                            new Date(calculatedVal).getFullYear() + 1,
                            new Date(calculatedVal).getMonth(),
                            new Date(calculatedVal).getDate()
                        );
                    }
                } else {
                    this.subscription = this.sharedComponent.getDataEvent.subscribe(
                        (value) => {
                            setTimeout(() => {
                                const calculatedVal =
                                    this.userService.appData.userData.accountSelect[0]
                                        .balanceLastUpdatedDate;
                                const selectedValueUntilMonth = new Date(
                                    new Date(calculatedVal).getFullYear(),
                                    new Date(calculatedVal).getMonth() + 1,
                                    new Date(calculatedVal).getDate()
                                );
                                this.selectedValueUntilMonth =
                                    selectedValueUntilMonth.getMonth();
                                this.selectedValueUntilYear =
                                    selectedValueUntilMonth.getFullYear();
                                this.selectedValueFromMonth = new Date(
                                    calculatedVal
                                ).getMonth();
                                this.selectedValueFromYear = new Date(
                                    calculatedVal
                                ).getFullYear();
                                this.years = [
                                    {
                                        label: this.selectedValueFromYear,
                                        value: this.selectedValueFromYear
                                    },
                                    {
                                        label: this.selectedValueFromYear + 1,
                                        value: this.selectedValueFromYear + 1
                                    }
                                ];
                                if (currentPath.find((urlseg) => urlseg.path === 'details')) {
                                    const calculatedValOld =
                                        this.userService.minOldestTransDateInSelectedAccounts();
                                    if (!this.calendarFrom) {
                                        this.calendarFrom = new Date(
                                            new Date().getFullYear(),
                                            new Date().getMonth(),
                                            new Date().getDate() - 30
                                        );
                                        this.calendarUntil = new Date(
                                            new Date().getFullYear(),
                                            new Date().getMonth(),
                                            new Date().getDate() + 30
                                        );
                                    }
                                    this.minDateInAccounts = new Date(calculatedValOld);
                                    this.calendarToday = new Date(
                                        new Date(calculatedValOld).getFullYear() + 1,
                                        new Date(calculatedValOld).getMonth(),
                                        new Date(calculatedValOld).getDate()
                                    );
                                } else {
                                    if (!this.calendarFrom) {
                                        this.calendarFrom = new Date(calculatedVal);
                                        this.calendarUntil = new Date(
                                            this.calendarFrom.getFullYear(),
                                            this.calendarFrom.getMonth() + 1,
                                            this.calendarFrom.getDate()
                                        );
                                    }
                                    this.minDateInAccounts = new Date(calculatedVal);
                                    this.calendarToday = new Date(
                                        new Date(calculatedVal).getFullYear() + 1,
                                        new Date(calculatedVal).getMonth(),
                                        new Date(calculatedVal).getDate()
                                    );
                                }
                            }, 1000);
                        }
                    );
                }
            }
        }
    }

    @Output() changedTrigger: EventEmitter<any> = new EventEmitter();

    readonly storageKey: string;
    // private get storageKey(): string {
    //   return this.route.routeConfig.path + '-filterDates';
    // }

    static defaultYear(num: number = 4): any {
        const y = [];
        const current = new Date().getFullYear() + num;
        for (let i = 0; i < num + 4; i++) {
            y.unshift({label: current - i, value: current - i});
        }
        return y;
    }

    static storageKey(route: ActivatedRoute, replaceLastWith?: string): string {
        const pathToRoot = route.pathFromRoot
            .filter((actRoute) => actRoute.snapshot.url.length)
            .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), [])
            .map((urlseg: UrlSegment) => urlseg.path);

        if (replaceLastWith) {
            pathToRoot.splice(-1, 1, replaceLastWith);
        }

        if (
            ['in-checks', 'out-checks'].includes(pathToRoot[pathToRoot.length - 1])
        ) {
            pathToRoot[pathToRoot.length - 1] = '*-checks';
        }

        return pathToRoot.slice(-2).join('/') + '-filterDates';
    }

    constructor(
        public translate: TranslateService,
        public router: Router,
        public userService: UserService,
        public route: ActivatedRoute,
        public storageService: StorageService,
        public sharedComponent: SharedComponent
    ) {
        this.months = this.getMonths;
        this.untilDate = [
            {
                label:
                this.translate.translations[this.translate.currentLang].filters.until
                    .today,
                value: 0
            },
            {
                label:
                this.translate.translations[this.translate.currentLang].filters.until
                    .month,
                value: 1
            }
        ];
        this.fromDate = [
            {
                label:
                this.translate.translations[this.translate.currentLang].filters.from
                    .today,
                value: 0
            },
            {
                label:
                this.translate.translations[this.translate.currentLang].filters.from
                    .month,
                value: 1
            }
        ];
        this.storageKey = AccountDatesComponent.storageKey(this.route);
        //        this.readFromStorage();
    }

    ngOnInit(): void {
        if (this.translate.currentLang !== 'ENG') {
            this.langCalendar =
                this.translate.translations[this.translate.currentLang].langCalendar;
        }
        this.readFromStorage();
        this.synchronizeInternals();
    }

    private daysInMonth(month, year): number {
        return new Date(year, month, 0).getDate();
    }

    recalculateConstraints(): void {
        const currentPath = this.route.pathFromRoot
            .filter((actRoute) => actRoute.snapshot.url.length)
            .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), []);
        if (!currentPath.some((urlseg) => urlseg.path === 'matched')) {
            let calculatedVal;
            if (
                currentPath.find(
                    (urlseg) =>
                        urlseg.path === 'bankAccount' ||
                        urlseg.path === 'checks' ||
                        urlseg.path === 'general'
                )
            ) {
                calculatedVal = this.userService.minOldestTransDateInSelectedAccounts();
            } else if (currentPath.find((urlseg) => urlseg.path === 'creditsCard')) {
                calculatedVal =
                    this.userService.minOldestTransDateInSelectedCreditCards();
            } else if (currentPath.find((urlseg) => urlseg.path === 'slika')) {
                calculatedVal = this.userService.minOldestTransDateInSelectedSolkim();
            }

            this.oldestTransDate =
                calculatedVal !== null ? new Date(calculatedVal) : null;
        }
    }

    private readFromStorage(): void {
        try {
            const detailsFilterDatesParse = JSON.parse(
                this.storageService.sessionStorageGetterItem(this.storageKey)
            );
            if (detailsFilterDatesParse) {
                this.selectedValue = detailsFilterDatesParse.selectedValue
                    ? detailsFilterDatesParse.selectedValue.toString()
                    : this.optionA === 'aggregateGeneral'
                        ? '1'
                        : this.optionA === 'bookKeepingAnalyze'
                            ? '2'
                            : '0';
                if (this.selectedValue === '0') {
                    if (this.optionA !== 'bookKeepingAnalyze') {
                        let optToFind =
                            detailsFilterDatesParse.dates &&
                            detailsFilterDatesParse.dates.selectedValueLast
                                ? +detailsFilterDatesParse.dates.selectedValueLast
                                : this.optionA === 'months' ||
                                this.optionA === 'monthsWithoutCalendar' ||
                                this.optionA === 'monthCredit' ||
                                this.optionA === 'monthCreditWithoutCalendar'
                                    ? 3
                                    : 30;

                        if (this.optionA === 'aggregateGeneral') {
                            optToFind = new Date().getFullYear();
                        }

                        if (!this.optionAArr || this.optionAArr.length === 0) {
                            this.selectedValueLastMonth = {
                                name: optToFind
                            };
                        } else {
                            const foundOpt = this.optionAArr.find(
                                (opt) => opt.name === optToFind
                            );
                            if (foundOpt) {
                                this.selectedValueLastMonth = foundOpt;
                            }
                        }
                    } else {
                        const optToFind =
                            detailsFilterDatesParse.dates &&
                            detailsFilterDatesParse.dates.selectedValueLast
                                ? +detailsFilterDatesParse.dates.selectedValueLast
                                : new Date(
                                    new Date().getFullYear(),
                                    new Date().getMonth() - 2,
                                    1
                                ).getMonth();
                        this.selectedValueLastMonth = optToFind;
                        const optToFindYear =
                            detailsFilterDatesParse.dates &&
                            detailsFilterDatesParse.dates.selectedValueOfYear
                                ? detailsFilterDatesParse.dates.selectedValueOfYear
                                : new Date(
                                    new Date().getFullYear(),
                                    new Date().getMonth() - 2,
                                    1
                                ).getFullYear();
                        this.selectedValueOfYear = optToFindYear;
                    }
                } else if (this.selectedValue === '1') {
                    this.fromValue = detailsFilterDatesParse.dates.fromValue;
                    this.untilValue = detailsFilterDatesParse.dates.untilValue;
                    this.selectedValueFromYear =
                        detailsFilterDatesParse.dates.selectedValueFromYear;
                    this.selectedValueFromMonth =
                        detailsFilterDatesParse.dates.selectedValueFromMonth;
                    this.selectedValueUntilMonth =
                        'selectedValueUntilMonth' in detailsFilterDatesParse.dates
                            ? detailsFilterDatesParse.dates.selectedValueUntilMonth
                            : new Date().getMonth();
                    this.selectedValueUntilYear = detailsFilterDatesParse.dates
                        .selectedValueUntilYear
                        ? detailsFilterDatesParse.dates.selectedValueUntilYear
                        : new Date().getFullYear();
                } else if (this.selectedValue === '2') {
                    if (this.optionA === 'profitAndLoss') {
                        const optToFindYear =
                            detailsFilterDatesParse.dates &&
                            detailsFilterDatesParse.dates.selectedValueLast
                                ? detailsFilterDatesParse.dates.selectedValueLast
                                : new Date().getFullYear();
                        this.selectedValueOfYear = optToFindYear;
                        // const optToFind = new Date().getFullYear();
                        // if (!this.optionAArr || this.optionAArr.length === 0) {
                        //     this.selectedValueLastMonth = {
                        //         name: optToFind
                        //     };
                        // } else {
                        //     const foundOpt = this.optionAArr.find(opt => opt.name === optToFind);
                        //     if (foundOpt) {
                        //         this.selectedValueLastMonth = foundOpt;
                        //     }
                        // }
                    } else if (this.optionA === 'bookKeepingAnalyze') {
                        const optToFindYear =
                            detailsFilterDatesParse.dates &&
                            detailsFilterDatesParse.dates.selectedValueOfYear
                                ? detailsFilterDatesParse.dates.selectedValueOfYear
                                : new Date(
                                    new Date().getFullYear() - 1,
                                    new Date().getMonth(),
                                    new Date().getDate()
                                ).getFullYear();
                        this.selectedValueOfYear = optToFindYear;
                    } else {
                        this.calendarFrom = new Date(
                            detailsFilterDatesParse.dates.calendarFrom
                        );
                        this.calendarUntil = new Date(
                            detailsFilterDatesParse.dates.calendarUntil
                        );
                    }
                }
            }
        } catch (e) {
            console.error('Failed to apply session storage value.', e);
            // if (!this.optionA) {
            //   this.option = 'days';
            // }
            // this.selectedValueLastMonth = {
            //   name: this.optionA === 'months' || this.optionA === 'monthsWithoutCalendar'
            //   || this.optionA === 'monthCredit' || this.optionA === 'monthCreditWithoutCalendar' ? 3 : 30
            // };
        }

        // console.log(`this.selectedValue: %o, this.selectedValueLastMonth: %o,
        //       this.untilValue: %o, this.selectedValueFromYear: %o, this.selectedValueUntilMonth: %o,
        //       this.calendarFrom: %o, this.calendarUntil: %o`,
        //     this.selectedValue,
        //     this.selectedValueLastMonth,
        //     this.untilValue,
        //     this.selectedValueFromYear,
        //     this.selectedValueUntilMonth,
        //     this.calendarFrom,
        //     this.calendarUntil);
    }

    filter(option?: string, length?: number, oldestCycleDate?: number): void {
        // this.recalculateConstraints();

        // const optionWillChange = option && this.optionA !== option;
        if (option) {
            this.option = option;
            // } else if (optionWillChange) {
            //   if (option === 'monthCredit' || this.optionA === 'monthCreditWithoutCalendar') {
            //     try {
            //       this.selectedValue = this.selectedValue.toString();
            //       if (length === 1) {
            //         this.selectedValueLastMonth.name = 3;
            //       } else {
            //         this.selectedValueLastMonth.name = 1;
            //       }
            //       this.untilValue = 1;
            //       this.selectedValueFromYear = new Date(oldestCycleDate).getFullYear();
            //       this.selectedValueFromMonth = new Date(oldestCycleDate).getMonth();
            //       const nextMonth = new Date(new Date(oldestCycleDate).getFullYear(), new Date(oldestCycleDate).getMonth() + 1, 1);
            //       this.selectedValueUntilMonth = new Date(nextMonth).getMonth();
            //       this.selectedValueUntilYear = new Date(nextMonth).getFullYear();
            //       this.calendarFrom = new Date(oldestCycleDate);
            //       this.calendarUntil = new Date(new Date(oldestCycleDate).getFullYear(), new Date(oldestCycleDate).getMonth() + 2, 0);
            //     } catch (e) {
            //     }
            //   } else if (option === 'monthsWithoutCalendar') {
            //     this.selectedValue = this.selectedValue.toString();
            //     this.selectedValueLastMonth.name = 3;
            //   }
        }

        // this.synchronizeInternals();
    }

    validateRange(): void {
        const fromDate = new Date(
            this.selectedValueFromYear,
            this.selectedValueFromMonth,
            1
        );
        let toDate;
        if (this.untilValue === 0) {
            toDate = this.today;
        } else {
            // console.log('%o, %o, %o, %o',
            //     this.selectedValueUntilYear, this.today.getFullYear(),
            //     this.selectedValueUntilMonth, this.today.getMonth());
            const dayInMonth =
                this.selectedValueUntilYear === this.today.getFullYear() &&
                this.selectedValueUntilMonth === this.today.getMonth()
                    ? this.today.getDate()
                    : this.daysInMonth(
                        this.selectedValueUntilMonth + 1,
                        this.selectedValueUntilYear
                    );

            toDate = new Date(
                this.selectedValueUntilYear,
                this.selectedValueUntilMonth,
                dayInMonth
            );
        }
        // console.log('today: %o, fromDate: %o, toDate: %o, (toDate <= this.today && fromDate <= toDate) = %o',
        //     this.today, fromDate, toDate,
        //     toDate <= this.today && fromDate <= toDate);
        if (
            this.optionA === 'monthChecks' ||
            this.optionA === 'trialBalance' ||
            this.optionA === 'DaysTazrim'
        ) {
            this.hasValidRange = fromDate <= toDate;
        } else {
            this.hasValidRange = toDate <= this.today && fromDate <= toDate;
        }
        this.validationError = this.hasValidRange
            ? null
            : fromDate > toDate
                ? this.translate.translations[this.translate.currentLang].validation
                    .dateRangeInvalid
                : this.translate.translations[this.translate.currentLang].validation
                    .dateRangeInFuture;
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    private synchronizeInternals(): void {
        const selectedValue: string = this.selectedValue.toString();
        switch (selectedValue) {
            case '0':
                this.currentSettings = {
                    selectedValue: selectedValue,
                    dates: {
                        selectedValueLast:
                            this.optionA === 'aggregateGeneral'
                                ? this.selectedValueOfYear
                                : this.optionA !== 'bookKeepingAnalyze' &&
                                this.optionA !== 'profitAndLoss'
                                    ? this.selectedValueLastMonth.name
                                    : this.selectedValueLastMonth,
                        selectedValueOfYear: this.selectedValueOfYear
                    }
                };

                this.storageService.sessionStorageSetter(
                    this.storageKey,
                    JSON.stringify(this.currentSettings)
                );
                break;
            case '1':
                this.currentSettings = {
                    selectedValue: selectedValue,
                    dates: Object.assign(
                        {
                            untilValue: this.untilValue,
                            fromValue: this.fromValue,
                            selectedValueFromYear: this.selectedValueFromYear,
                            selectedValueFromMonth: this.selectedValueFromMonth
                        },
                        this.untilValue !== 0
                            ? {
                                selectedValueUntilMonth: this.selectedValueUntilMonth,
                                selectedValueUntilYear: this.selectedValueUntilYear
                            }
                            : {}
                    )
                };

                this.storageService.sessionStorageSetter(
                    this.storageKey,
                    JSON.stringify(this.currentSettings)
                );
                break;
            case '2':
                this.currentSettings = {
                    selectedValue: selectedValue,
                    dates: {
                        calendarFrom:
                            this.optionA === 'bookKeepingAnalyze'
                                ? new Date(this.selectedValueOfYear, 0, 1)
                                : this.calendarFrom,
                        calendarUntil:
                            this.optionA === 'bookKeepingAnalyze'
                                ? new Date(this.selectedValueOfYear, 11, 31 - 1)
                                : this.calendarUntil,
                        selectedValueLast:
                            this.optionA === 'profitAndLoss' ||
                            this.optionA === 'bookKeepingAnalyze'
                                ? this.selectedValueOfYear
                                : this.selectedValueLastMonth.name
                    }
                };

                this.storageService.sessionStorageSetter(
                    this.storageKey,
                    JSON.stringify(this.currentSettings)
                );
                break;
        }
    }

    togglePanel(): void {
        if (!this.showPanelDD) {
            this.synchronizeInternals();
            if (
                this.optionA !== 'DaysTazrim' &&
                this.optionA !== 'trialBalance' &&
                this.optionA !== 'profitAndLoss' &&
                this.optionA !== 'bookKeepingAnalyze'
            ) {
                this.recalculateConstraints();
            }
            this.showPanelDD = true;
        } else {
            this.discardChanges();
        }
    }

    commitChanges(): void {
        this.showPanelDD = false;
        this.synchronizeInternals();

        // this.saveDates = this.selectedPeriod;
        this.changedTrigger.emit(this.selectedPeriod);
        // this.changedTrigger.emit({
        //   'fromDate': (typeof fromDate === 'string') ? fromDate : fromDate.toISOString(),
        //   'toDate': (typeof toDate === 'string') ? toDate : toDate.toISOString(),
        //   'selectedValue': this.selectedValue
        // });
    }

    discardChanges(): void {
        this.showPanelDD = false;

        this.selectedValue = this.currentSettings.selectedValue;

        switch (this.selectedValue) {
            case '0':
                this.selectedValueOfYear =
                    this.optionA !== 'bookKeepingAnalyze' &&
                    this.optionA !== 'profitAndLoss'
                        ? this.currentSettings.dates.selectedValueLast
                        : this.currentSettings.dates.selectedValueOfYear;
                this.selectedValueLastMonth =
                    this.optionA !== 'bookKeepingAnalyze'
                        ? this.optionAArr.find(
                            (opt) =>
                                opt.name === this.currentSettings.dates.selectedValueLast
                        )
                        : this.currentSettings.dates.selectedValueLast;
                break;
            case '1':
                this.selectedValueFromMonth =
                    this.currentSettings.dates.selectedValueFromMonth;
                this.selectedValueFromYear =
                    this.currentSettings.dates.selectedValueFromYear;
                this.untilValue =
                    this.currentSettings.dates.selectedValueUntilMonth ||
                    this.currentSettings.dates.selectedValueUntilYear
                        ? 1
                        : 0;
                this.fromValue = this.currentSettings.dates.fromValue
                    ? this.currentSettings.dates.fromValue
                    : 0;
                this.selectedValueUntilMonth =
                    this.currentSettings.dates.selectedValueUntilMonth;
                this.selectedValueUntilYear =
                    this.currentSettings.dates.selectedValueUntilYear;
                break;
            case '2':
                this.selectedValueOfYear = this.currentSettings.dates.selectedValueLast;
                break;
        }
        if (this.selectedValue !== '0') {
            if (this.optionA !== 'aggregateGeneral') {
                if (
                    this.optionA !== 'bookKeepingAnalyze' &&
                    this.optionA !== 'profitAndLoss'
                ) {
                    const dfltOption =
                        this.optionA === 'months' ||
                        this.optionA === 'monthsWithoutCalendar' ||
                        this.optionA === 'monthCredit' ||
                        this.optionA === 'monthCreditWithoutCalendar'
                            ? 3
                            : 30;
                    this.selectedValueLastMonth = this.optionAArr.find(
                        (opt) => opt.name === dfltOption
                    );
                } else {
                    this.selectedValueLastMonth = new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() - 2,
                        1
                    ).getMonth();
                    this.selectedValueOfYear = new Date(
                        new Date().getFullYear(),
                        new Date().getMonth() - 2,
                        1
                    ).getFullYear();
                }
            } else {
                this.selectedValueFromMonth = this.currentSettings.dates
                    .selectedValueFromMonth
                    ? this.currentSettings.dates.selectedValueFromMonth
                    : new Date().getMonth();
                this.selectedValueOfYear = this.currentSettings.dates.selectedValueLast;
            }
        }
        if (this.selectedValue !== '1') {
            this.untilValue = 0;
            this.fromValue = 0;
            this.selectedValueFromMonth = 0;
            this.selectedValueFromYear = new Date().getFullYear();
            this.selectedValueUntilMonth = new Date().getMonth();
            this.selectedValueUntilYear = new Date().getFullYear();
        }
        if (this.selectedValue !== '2' && this.optionA !== 'profitAndLoss') {
            if (this.optionA !== 'profitAndLoss') {
                this.calendarFrom = new Date(new Date().getFullYear(), 0, 1);
                this.calendarUntil = new Date();
            } else {
                this.selectedValueFromMonth = this.currentSettings.dates
                    .selectedValueFromMonth
                    ? this.currentSettings.dates.selectedValueFromMonth
                    : new Date().getMonth();
                this.selectedValueOfYear = this.currentSettings.dates.selectedValueLast;
            }
        }

        this.validateRange();
    }

    public asText(): string {
        const txt =
            this.selectorRef.nativeElement.textContent ||
            this.selectorRef.nativeElement.innerText;
        return txt ? txt.trim() : txt;
    }
}
