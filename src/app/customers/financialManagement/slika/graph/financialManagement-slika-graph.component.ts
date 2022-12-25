import {AfterViewInit, Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import {UserService} from '@app/core/user.service';

import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {CurrencySymbolPipe} from '@app/shared/pipes/currencySymbol.pipe';
import {SolekSelectComponent} from '@app/shared/component/solek-select/solek-select.component';
// tslint:disable-next-line:max-line-length
import {
    ClearingAgenciesDateRangeSelectorComponent
} from '@app/shared/component/date-range-selectors/clearingAgencies-date-range-selector.component';
import {filter, take, takeWhile} from 'rxjs/operators';
import {CustomersFinancialManagementSlikaComponent} from '../customers-financialManagement-slika.component';
import {ActionService} from '@app/core/action.service';
import {Subscription} from 'rxjs/internal/Subscription';
import {timer} from 'rxjs/internal/observable/timer';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
    templateUrl: './financialManagement-slika-graph.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class FinancialManagementSlikaGraphComponent
    extends ReloadServices
    implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(ClearingAgenciesDateRangeSelectorComponent)
    childDates: ClearingAgenciesDateRangeSelectorComponent;

    @ViewChild(SolekSelectComponent) solekSelector: SolekSelectComponent;

    public dataTableAll: any[] = [];
    public loader = false;
    public ddSelectGraph: any[];
    public selectedValueGraph: any;
    public chartData: any;
    public showValues = false;
    public showCreditLines = false;
    public typeGraph: string;
    public selectedSolkimArr: any;

    selectedSolkim: any[];
    selectedSolkimOutdated: any[];
    allSelectedSolkimOutdatedBecauseNotFound: boolean;
    private actionNavigateToSlikaGraphSub: Subscription;

    constructor(
        private customersFinancialManagementSlikaComponent: CustomersFinancialManagementSlikaComponent,
        public translate: TranslateService,
        public override sharedComponent: SharedComponent,
        public userService: UserService,
        private sharedService: SharedService,
        private storageService: StorageService,
        private router: Router,
        private route: ActivatedRoute,
        private currencySymbolPipe: CurrencySymbolPipe,
        private actionService: ActionService
    ) {
        super(sharedComponent);
    }

    override reload() {
        console.log('reload child');
        this.ngOnInit();
    }

    ngOnInit(): void {
        this.actionNavigateToSlikaGraphSub =
            this.actionService.navigateToSlikaGraph$.subscribe((navParams) => {
                if (navParams) {
                    if (navParams.preset) {
                        this.childDates.customDatesPreset.from = navParams.preset.from;
                        this.childDates.customDatesPreset.till = navParams.preset.till;
                        this.childDates.selectedPreset = this.childDates.customDatesPreset;
                    }

                    if (navParams.tokenId) {
                        timer(100, 300)
                            .pipe(
                                takeWhile(
                                    () => !Array.isArray(this.userService.appData.userData.slika)
                                )
                            )
                            .subscribe({
                                complete: () => {
                                    const solekSelectionByTokenToNavigate =
                                        this.userService.appData.userData.slika
                                            .filter((acc: any) =>
                                                acc.children.some(
                                                    (slk) =>
                                                        slk.token === navParams.tokenId ||
                                                        slk.solekId === navParams.tokenId
                                                )
                                            )
                                            .reduce((acmltr, acc) => {
                                                return [
                                                    ...acmltr,
                                                    ...acc.children
                                                        .filter(
                                                            (slk) =>
                                                                slk.token === navParams.tokenId ||
                                                                slk.solekId === navParams.tokenId
                                                        )
                                                        .map((slk) => {
                                                            return {
                                                                companyAccountId: acc.companyAccountId,
                                                                solekNum: slk.solekNum
                                                            };
                                                        })
                                                ];
                                            }, []);
                                    if (solekSelectionByTokenToNavigate.length) {
                                        this.solekSelector.applySelection(
                                            solekSelectionByTokenToNavigate
                                        );
                                    } else if (navParams.companyAccountId) {
                                        const accWithTokens =
                                            this.userService.appData.userData.slika.find(
                                                (acc: any) =>
                                                    acc.companyAccountId === navParams.companyAccountId
                                            );
                                        if (accWithTokens && accWithTokens.children.length) {
                                            this.solekSelector.applySelection(
                                                accWithTokens.children.map((slk) => {
                                                    return {
                                                        companyAccountId: accWithTokens.companyAccountId,
                                                        solekNum: slk.solekNum
                                                    };
                                                })
                                            );
                                        }
                                    }
                                }
                            });
                    }

                    //
                    // const accToSelect = navParams.accountId
                    //     ? this.userService.appData.userData.accounts.find(acc => acc.companyAccountId === navParams.accountId)
                    //     : null;
                    // if (accToSelect
                    //     && !(this.userService.appData.userData.accountSelect === 1
                    //         && this.userService.appData.userData.accountSelect[0] === accToSelect)) {
                    //     setTimeout(() => {
                    //         this.userService.appData.userData.accountSelect = [accToSelect];
                    //         this.accountSelector.applyValuesFromModel();
                    //         this.changeAcc(null);
                    //     });
                    // } else {
                    //     setTimeout(() => {
                    //         this.filtersAll();
                    //     });
                    // }
                }
            });
    }

    ngAfterViewInit() {
        this.childDates.selectedRange
            .pipe(
                filter(() => {
                    const selectedSolkim = this.userService.selectedSolkim();
                    return Array.isArray(selectedSolkim) && selectedSolkim.length > 0;
                })
            )
            .subscribe((rng) => this.filterDates(rng));

    }

    ngOnDestroy() {
        this.destroy();
    }

    getSlikaDetails(): void {
        // const fieldNames = ['futureCharges', 'futureCredits', 'futureBallance'];
        // const selectedSolkimToSum = this.userService.selectedSolkim().filter(slk => {
        //     return fieldNames.some(fldName => slk[fldName] !== null);
        // });
        // this.selectedSolkimArr = selectedSolkimToSum;
        this.childDates.selectedRange
            .pipe(take(1))
            .subscribe((rng) => this.filterDates(rng));
    }

    filterDates(paramDate: any): void {
        this.loader = true;

        this.selectedSolkim = this.userService.selectedSolkim();
        this.selectedSolkimOutdated = this.selectedSolkim.filter(
            (slk) => !slk.balanceIsUpToDate
        );
        this.allSelectedSolkimOutdatedBecauseNotFound =
            this.selectedSolkimOutdated.every(
                (slk) => slk.alertStatus === 'Not found in bank website'
            );

        if (this.selectedSolkim.length) {
            const arrSoleks = this.selectedSolkim.map((solek) => solek.solekNum);
            const arrCompanyAccountIds = this.selectedSolkim.map(
                (solek) => solek.companyAccountId
            );
            const daysScale =
                this.userService.appData
                    .moment(paramDate.toDate)
                    .diff(paramDate.fromDate, 'days') < 32;

            if (daysScale) {
                // less than more 1 month
                this.typeGraph = 'getSlikaGraph';
                this.sharedService
                    .getSlikaGraph({
                        companyAccounts: arrCompanyAccountIds,
                        solekNums: arrSoleks,
                        dateFrom: paramDate.fromDate,
                        dateTill: paramDate.toDate
                    })
                    .subscribe(
                        (response: any) => {
                            this.dataTableAll = response ? response['body'] : response;
                            this.updateChart();
                        },
                        (err: HttpErrorResponse) => {
                            if (err.error instanceof Error) {
                                console.log('An error occurred:', err.error.message);
                            } else {
                                console.log(
                                    `Backend returned code ${err.status}, body was: ${err.error}`
                                );
                            }
                        }
                    );
            } else {
                // more than one month
                this.typeGraph = 'getSlikaSummary';
                this.sharedService
                    .getSlikaSummary({
                        companyAccountIds: arrCompanyAccountIds,
                        solekNums: arrSoleks,
                        dateFrom: paramDate.fromDate,
                        dateTill: paramDate.toDate
                    })
                    .subscribe(
                        (response: any) => {
                            this.dataTableAll = response ? response['body'] : response;
                            this.updateChart();
                        },
                        (err: HttpErrorResponse) => {
                            if (err.error instanceof Error) {
                                console.log('An error occurred:', err.error.message);
                            } else {
                                console.log(
                                    `Backend returned code ${err.status}, body was: ${err.error}`
                                );
                            }
                        }
                    );
            }
        } else {
            this.dataTableAll = [];
            this.updateChart();
            this.loader = false;
        }
    }

    getSolekDesk(item: any): any {
        const findSolek = this.selectedSolkim.find(
            (it) =>
                it.solekNum === item.solekNum &&
                it.companyAccountId === item.companyAccountId
        );
        if (findSolek) {
            return findSolek.solekDesc;
        } else {
            return '';
        }
    }

    updateChart(): void {
        this.loader = true;
        const dataTableAll = this.dataTableAll;
        const xAxiscategories = [];
        // debugger;
        const series = dataTableAll.map((val) => {
            const selectedSolek = this.selectedSolkim.find(
                (slk) => slk.solekNum === val.solekNum
            );

            const seriesData =
                this.typeGraph === 'getSlikaSummary'
                    ? val.monthlyTotals.map((sum) => {
                        return {
                            x: sum.cycleDate,
                            y: sum.monthlyTotal
                        };
                    })
                    : val.innerData.map((sum) => {
                        return {
                            x: sum.date,
                            y: sum.total
                        };
                    });
            seriesData.sort((a, b) => a.x - b.x);

            return {
                cursor: 'pointer',
                name: `${this.getSolekDesk(selectedSolek)}
            ${selectedSolek.solekNum}`,
                currency: this.currencySymbolPipe.transform(selectedSolek.currency),
                data: seriesData
            };
            // if (this.typeGraph === 'getSlikaSummary') {
            //   return {
            //     cursor: 'pointer',
            //     name: selectedSolek.solekBankId + ' ' + selectedSolek.solekNum,
            //     // color: this.getColorRandom(idx),
            //     data: val.monthlyTotals.map((sum) => sum.monthlyTotal)
            //   };
            // } else {
            //   return {
            //     cursor: 'pointer',
            //     name: selectedSolek.solekBankId + ' ' + selectedSolek.solekNum,
            //     // color: this.getColorRandom(idx),
            //     data: val.innerData.map((sum) => sum.total)
            //   };
            // }
        });
        const plotLines = [
            {
                color: '#d63838',
                width: 2,
                value: 0,
                dashStyle: 'ShortDash',
                label: {
                    enabled: false
                }
            }
        ];

        this.childDates.selectedRange.pipe(take(1)).subscribe((rng) => {
            const fromDate = !rng.toDate
                    ? this.userService.appData
                        .moment(rng.fromDate)
                        .startOf('month')
                        .toDate()
                    : rng.fromDate,
                toDate = !rng.toDate
                    ? this.userService.appData
                        .moment(
                            Math.max(
                                ...series.map((ser) => ser.data[ser.data.length - 1].x)
                            )
                        )
                        .toDate()
                    : rng.toDate;

            const daysScale =
                this.userService.appData.moment(toDate).diff(fromDate, 'days') < 32;

            // const selectedPeriod = rng;
            // if (rng.toDate === null) {
            //     selectedPeriod.fromDate.setDate(1);
            //     selectedPeriod.toDate = new Date(Math.max(...series.map(ser => ser.data[ser.data.length - 1].x)));
            // }
            //
            this.chartData = {
                fromDate: daysScale
                    ? fromDate
                    : this.userService.appData.moment(fromDate).startOf('month').toDate(),
                toDate: daysScale
                    ? toDate
                    : this.userService.appData.moment(toDate).startOf('month').toDate(),
                // fromDate: selectedPeriod.fromDate,
                // toDate: selectedPeriod.toDate,
                columnGroup: true,
                dataLabelsEnabled: this.showValues,
                plotLines: plotLines,
                gridLineWidth: 1,
                markerEnabled: true,
                crosshair: false,
                xAxiscategories: xAxiscategories,
                series: series
            };
            // console.log(JSON.stringify(xAxiscategories));
            // console.log(JSON.stringify(series));

            this.loader = false;
        });
    }

    selectSolek(solek: any): void {
        this.storageService.sessionStorageSetter(
            SolekSelectComponent.storageKey(this.route),
            JSON.stringify([solek.solekNum])
        );

        this.solekSelector.applySelection([
            {companyAccountId: solek.companyAccountId, solekNum: solek.solekNum}
        ]);
    }
}
