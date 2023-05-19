import {Component, Input, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {Chart, StockChart} from 'angular-highcharts';
import {TranslateService} from '@ngx-translate/core';
import {roundAndAddComma} from '../../functions/addCommaToNumbers';
import {UserService} from '@app/core/user.service';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
// import * as Highcharts from 'highcharts';
import {interval, Observable} from 'rxjs';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {DateRangeSelectorBaseComponent} from '../date-range-selectors/date-range-selector-base.component';
import {CustomPreset} from '../date-range-selectors/presets';
import * as moment from 'moment-timezone';
// @ts-ignore
let Highcharts: any = null;

export function normalizeCommonJSImport<T>(
    importPromise: Promise<T>,
): Promise<T> {
    return importPromise.then((m: any) => (m.default || m) as T);
}

const loadHighcharts = normalizeCommonJSImport(
    import('highcharts')
);

@Component({
    selector: 'app-charts',
    templateUrl: './charts.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ChartsComponent implements OnInit, OnDestroy {
    public chart: Chart | StockChart | any;
    public chartRender: any;
    public chartRenderPie: any;
    public chartPoints: any = {
        start: 0,
        finish: 0,
        max: 0,
        side: false
    };
    public loopInter: any = true;
    public loopInterPrev: any = true;

    @Input() scrollHeight: any;
    // @Input() setExtremesInput: boolean;

    // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;

    @Input()
    set hover(on: { seriesIndex: number; pointIndex: number }) {
        // console.log('====> called with %o', on);

        if (this.chart && this.chart.ref) {
            if (on.seriesIndex >= 0 && this.chart.ref.series.length) {
                if (
                    on.pointIndex >= 0 &&
                    on.pointIndex < this.chart.ref.series[on.seriesIndex].data.length
                ) {
                    this.chart.ref.series[on.seriesIndex].data[on.pointIndex].select(
                        true,
                        false
                    );
                } else {
                    this.chart.ref.series[on.seriesIndex].select(true);
                }
            } else {
                this.chart.ref.getSelectedPoints().forEach((pnt) => pnt.select(false));
                this.chart.ref.getSelectedSeries().forEach((ser) => ser.select(false));
            }
        }
    }

    private readonly changes: MutationObserver;
    private readonly twelveHours: number = 1000 * 60 * 60 * 12;

    constructor(
        public translate: TranslateService,
        public userService: UserService,
        private storageService: StorageService,
        private router: Router,
        private route: ActivatedRoute,
        private restCommonService: RestCommonService
    ) {

        this.changes = new MutationObserver((mutations: MutationRecord[]) => {
            // console.log('%o', mutations);
            if (mutations.length && this.chart && this.chart.ref) {
                setTimeout(() => {
                    if (this.chart && this.chart.ref) {
                        requestAnimationFrame(() => {
                            if (this.chart && this.chart.ref) {
                                this.chart.ref.reflow();
                            }
                        });
                    }
                }, 200);
                console.log(' ====> reflow ====> %o, %o', mutations, this.chart);
            }
        });
    }

    public async ngOnInit() {
        Highcharts = await loadHighcharts;
        Highcharts.setOptions({
            time: {
                timezone: 'Asia/Jerusalem',
                timezoneOffset: new Date().getTimezoneOffset(),
                getTimezoneOffset: function (timestamp) {
                    return -moment.tz(timestamp, 'Asia/Jerusalem').utcOffset();
                }
            },
            colors: [
                '#78bbf7',
                '#fde5a5',
                '#acfbe9',
                '#ace0fb',
                '#acb9fb',
                '#e2acfb',
                '#fbacde',
                '#fbacac',
                '#fbc4ac',
                '#fbebac',
                '#b0fbac',
                '#acf3fb',
                '#c8acfb',
                '#e0fbac',
                '#acacfb',
                '#acfbc6'
                // '#18AA9D',
                // '#c02ad6',
                // '#FB8C00',
                // '#494989',
                // '#54cad5',
                // '#8BC34A',
                // '#d62a67',
                // '#2ad6bc',
                // '#2a57d6',
                // '#8f2ad6',
                // '#415264',
                // '#d62aa7',
                // '#0097A7',
                // '#AFB42B',
                // '#bb0154',
                // '#FF5722',
                // '#4A7082',
                // '#303F9F',
                // '#B33771',
                // '#26A69A',
                // '#365F49',
                // '#2a93d6',
                // '#7B1FA2',
                // '#522ad6',
                // '#757575',
                // '#F9A825',
                // '#a701bb',
                // '#388E3C',
                // '#1976D2',
                // '#C2185B',
                // '#d62a2a',
                // '#f0de30'
            ],
            lang: {
                noData: '',
                thousandsSep: '\u002C'
            },
            chart: {
                style: {
                    fontFamily: 'Assistant, Arial, Helvetica, sans-serif'
                }
            },
            xAxis: {
                labels: {
                    style: {
                        fontFamily: 'Assistant, Arial, Helvetica, sans-serif'
                    }
                },
            },
            yAxis: {
                labels: {
                    style: {
                        fontFamily: 'Assistant, Arial, Helvetica, sans-serif'
                    }
                }
            }
        });
        (<any>Highcharts.Pointer.prototype).onContainerMouseMove = function (e) {
            const chart = this.chart;
            // if (!defined(H.hoverChartIndex) ||
            //     !charts[H.hoverChartIndex] ||
            //     !charts[H.hoverChartIndex].mouseIsDown) {
            //     H.hoverChartIndex = chart.index;
            // }
            if (
                !Highcharts.defined((<any>Highcharts).hoverChartIndex) ||
                !Highcharts.charts[(<any>Highcharts).hoverChartIndex] ||
                !(<any>Highcharts.charts[(<any>Highcharts).hoverChartIndex]).mouseIsDown
            ) {
                (<any>Highcharts).hoverChartIndex = chart.index;
            }
            e = this.normalize(e);
            // In IE8 we apparently need this returnValue set to false in order to
            // avoid text being selected. But in Chrome, e.returnValue is prevented,
            // plus we don't need to run e.preventDefault to prevent selected text
            // in modern browsers. So we set it conditionally. Remove it when IE8 is
            // no longer needed. #2251, #3224.
            if (!e.preventDefault) {
                e.returnValue = false;
            }
            if (chart.mouseIsDown === 'mousedown') {
                this.drag(e);
            }
            // Show the tooltip and run mouse over events (#977)
            if (
                !this.inClass(e.target, 'tooltip-charts') &&
                !this.inClass(e.target, 'tooltipAllAcc') &&
                (this.inClass(e.target, 'highcharts-tracker') ||
                    chart.isInsidePlot(
                        e.chartX - chart.plotLeft,
                        e.chartY - chart.plotTop
                    )) &&
                !chart.openMenu
            ) {
                this.runPointActions(e);
            }
        };
        /**
         * Custom Axis extension to allow emulation of negative values on a logarithmic
         * Y axis. Note that the scale is not mathematically correct, as a true
         * logarithmic axis never reaches or crosses zero.
         */
        (function (H) {
            const axisProt = <any>H.Axis.prototype;
            // Pass error messages
            axisProt.allowNegativeLog = true;

            // Override conversions
            axisProt.log2lin = function (num) {
                const isNegative = num < 0;
                let adjustedNum = Math.abs(num),
                    result;
                if (adjustedNum < 10) {
                    adjustedNum += (10 - adjustedNum) / 10;
                }
                result = Math.log(adjustedNum) / Math.LN10;
                return isNegative ? -result : result;
            };
            axisProt.lin2log = function (num) {
                const isNegative = num < 0,
                    absNum = Math.abs(num);
                let result = Math.pow(10, absNum);
                if (result < 10) {
                    result = (10 * (result - 1)) / (10 - 1);
                }
                return isNegative ? -result : result;
            };
        })(Highcharts);
        // console.log('init ----> %o', (document.getElementById('side-nav') as HTMLElement));
        this.changes.observe(document.getElementById('side-nav') as HTMLElement, {
            attributes: true,
            // childList: true,
            subtree: true,
            // characterData: true,
            attributeFilter: ['style']
        });
    }

    ngOnDestroy(): void {
        this.changes.disconnect();
    }

    @Input()
    set chartData(data: any) {
        if (this.chart && this.chart.ref) {
            this.chart.ref.destroy();
            this.chart = null;
        }

        if (data) {
            if (Array.isArray(data.series)) {
                data.series
                    .filter(
                        (ser) =>
                            Array.isArray(ser.data) &&
                            ser.data.length &&
                            typeof ser.data[0] === 'object' &&
                            'y' in ser.data[0]
                    )
                    .forEach((ser) => ser.data.forEach((pnt) => (pnt.y = +pnt.y)));
            } else if (data.data && Array.isArray(data.data.series)) {
                data.data.series
                    .filter(
                        (ser) =>
                            Array.isArray(ser.data) &&
                            ser.data.length &&
                            typeof ser.data[0] === 'object' &&
                            'y' in ser.data[0]
                    )
                    .forEach((ser) => ser.data.forEach((pnt) => (pnt.y = +pnt.y)));
            }
        }

        if (data) {
            let isDaily: boolean | any | null = null;

            const fromDate = data.fromDate;
            const toDate = data.toDate;
            const xMin = 0.45;
            let xMax;
            let xAxiscategoriesAll = [];

            if (data.series) {
                const one_day: number = 1000 * 60 * 60 * 24;

                const monthly = data.series.some((ser) => {
                    return (
                        ser.data &&
                        ser.data.some((pnt, idx, arr) => {
                            const idx2 = idx === 0 ? idx + 1 : idx - 1;
                            if (idx2 >= arr.length || !pnt.x || !arr[idx2].x) {
                                return false;
                            }
                            return Math.round(Math.abs(pnt.x - arr[idx2].x) / one_day) >= 28;
                        })
                    );
                });
                const daily = data.series.some((ser) => {
                    return (
                        ser.data &&
                        ser.data.some((pnt, idx, arr) => {
                            const idx2 = idx === 0 ? idx + 1 : idx - 1;
                            if (idx2 >= arr.length || !pnt.x || !arr[idx2].x) {
                                return false;
                            }
                            return Math.round(Math.abs(pnt.x - arr[idx2].x) / one_day) <= 2;
                        })
                    );
                });

                if (daily) {
                    isDaily = true;
                } else if (monthly) {
                    isDaily = false;
                }
            }

            if (fromDate !== undefined) {
                const daysBetween =
                    this.userService.appData
                        .moment(toDate)
                        .endOf('day')
                        .diff(
                            this.userService.appData.moment(fromDate).startOf('day'),
                            'days'
                        ) + 1;
                // getDaysBetweenDates(fromDate, toDate);

                if (isDaily === null) {
                    isDaily = daysBetween <= 32;
                }

                if (isDaily) {
                    const mmntTmp = this.userService.appData
                            .moment(fromDate)
                            .startOf('day'),
                        mmntTill = this.userService.appData.moment(toDate).endOf('day');
                    do {
                        xAxiscategoriesAll.push(mmntTmp.toDate());
                        mmntTmp.add(1, 'day');
                    } while (mmntTmp.isBefore(mmntTill));
                    // for (let i = 0; i < daysBetween; i++) {
                    //     xAxiscategoriesAll.push(new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + i).getTime());
                    // }
                    // // xMin = null;
                    // console.log(xAxiscategoriesAll)
                    // debugger
                } else {
                    const mmntTmp = this.userService.appData
                            .moment(fromDate)
                            .startOf('month'),
                        mmntTill = this.userService.appData.moment(toDate).endOf('day');
                    do {
                        xAxiscategoriesAll.push(mmntTmp.toDate());
                        mmntTmp.add(1, 'months');
                    } while (mmntTmp.isBefore(mmntTill));
                    // const monthsBetween =
                    //     Math.ceil(
                    //         this.userService.appData.moment(toDate).endOf('day')
                    //             .diff(this.userService.appData.moment(fromDate).startOf('day'),
                    //                 'months', true)
                    //     );
                    // // toDate.getMonth() - fromDate.getMonth() + 12 * (toDate.getFullYear() - fromDate.getFullYear()) + 1;
                    // for (let i = 0, mmntTmp = this.userService.appData.moment(fromDate).startOf('day'); i < monthsBetween;
                    //      i++, mmntTmp.add(1, 'months')) {
                    //     xAxiscategoriesAll.push(mmntTmp.valueOf());
                    //         // new Date(fromDate.getFullYear(), fromDate.getMonth() + i, fromDate.getDate()).getTime());
                    // }
                }
            } else {
                xAxiscategoriesAll = [].concat(data.xAxiscategories);
            }

            if (xAxiscategoriesAll.length > 1) {
                xMax = xAxiscategoriesAll.length - 1.45;
            } else if (xAxiscategoriesAll.length === 1) {
                xMax = 1;
            } else {
                xMax = xAxiscategoriesAll.length - 1;
                // xMin = null;
            }
            let scrollbar = false;
            if (
                xMax > 30 &&
                isDaily && // && fromDate.getMonth() !== toDate.getMonth()) {
                !this.userService.appData
                    .moment(fromDate)
                    .isSame(this.userService.appData.moment(toDate), 'month')
            ) {
                xMax = 30;
                scrollbar = true;
            }
            if (data.series) {
                data.series.forEach((ser) => {
                    if (ser.data) {
                        ser.data
                            .filter((pnt) => pnt.x)
                            .forEach((pnt, i) => {
                                pnt.xTime = pnt.x;
                                pnt.x = xAxiscategoriesAll.findIndex((xcat) => {
                                    return Math.abs(xcat - pnt.x) <= this.twelveHours;
                                });

                                if (pnt.x < 0) {
                                    // debugger;
                                    console.log(
                                        'Oops... %o not found! Setting this value to %o ',
                                        new Date(pnt.xTime),
                                        new Date(xAxiscategoriesAll[i])
                                    );
                                    pnt.x = i;
                                }

                                if (Number.isFinite(pnt.y)) {
                                    if (data.minY === null || data.minY === undefined) {
                                        data.minY = Math.min(0, pnt.y);
                                    } else {
                                        data.minY = Math.min(pnt.y, data.minY);
                                    }
                                    if (data.maxY === null || data.maxY === undefined) {
                                        data.maxY = pnt.y;
                                    } else {
                                        data.maxY = Math.max(pnt.y, data.maxY);
                                    }
                                }
                            });
                    }
                });
                // console.log('data.series ===> %o, xAxiscategoriesAll: %o',
                //   data.series, xAxiscategoriesAll);

                if (Math.sign(data.maxY) === Math.sign(data.minY)) {
                    if (Math.sign(data.maxY) === -1) {
                        data.maxY = 0;
                    } else if (Math.sign(data.minY) === 1) {
                        data.minY = 0;
                    }
                }
            }
            if (data.tooltips) {
                data.tooltips.forEach((tt, i) => {
                    if (tt.x) {
                        tt.xTime = tt.x;
                        tt.x = xAxiscategoriesAll.findIndex((item) => {
                            return Math.abs(item - tt.x) <= this.twelveHours;
                            // return Math.floor(new Date(item).getTime() / 86400000) === Math.floor(tt.x / 86400000);
                        });
                        if (tt.x < 0) {
                            console.log(
                                'Oops... %o not found! Setting this value to %o ',
                                new Date(tt.xTime),
                                new Date(xAxiscategoriesAll[i])
                            );
                            tt.x = i;
                        }
                    }
                });
            }

            // console.log('data = %o', data);

            if (data.line) {
                let tooltip;
                if (!data.tooltips.length) {
                    const translation = this.translate;
                    const moment = this.userService.appData.moment;
                    tooltip = {
                        // snap: 5,
                        // hideDelay: 1000,
                        shared: true,
                        shadow: false,
                        useHTML: true,
                        crosshairs: true,
                        backgroundColor: '#edf0f2',
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#cbc9c9',
                        padding: 0,
                        formatter: function () {
                            // debugger
                            const total = this.points.reduce((a, b) => a + b.y, 0);
                            let classSum = '';
                            if (
                                Math.abs(Number(total)) !== 0 &&
                                roundAndAddComma(total) !== '0'
                            ) {
                                if (total < 0) {
                                    classSum = 'sum-debit';
                                } else if (total > 0) {
                                    classSum = 'sum-credit';
                                }
                            }
                            const paddingLeft = this.points.length > 5 ? '20' : '10';

                            const pointMmnt = (
                                data.truncateFutureDates
                                    ? moment.min(moment(this.points[0].point.xTime), moment())
                                    : moment(this.points[0].point.xTime)
                            )
                                .toArray()
                                .slice(0, 3);
                            const headerDateStr = pointMmnt
                                .reverse()
                                .map((v, idx) =>
                                    idx === 1 ? translation.instant('months.' + v) : v
                                )
                                .join(' ');

                            let str = `<div class="tooltip-charts">
    <div class="titlesTooltip p-g" style="padding-left: ${paddingLeft}px">
      <div class="p-g-8">יתרה ל ${headerDateStr}</div>
      <div class="p-g-4 titleBold ${classSum}">
      ${this.points[0].point.currency} ${roundAndAddComma(total)}
      </div>
    </div>
    <ul style="max-height: 195px; overflow: auto;-ms-overflow-style:scrollbar;" class="scroll-chrome">`;
                            if (Array.isArray(this.points[0].point.byAccountBalances)) {
                                str += this.points[0].point.byAccountBalances
                                    .map((point) => {
                                        let classSumPoint = '';
                                        if (Math.abs(Number(roundAndAddComma(point.itra))) !== 0) {
                                            if (point.itra < 0) {
                                                classSumPoint = 'sum-debit';
                                            } else if (point.itra > 0) {
                                                classSumPoint = 'sum-credit';
                                            }
                                        }
                                        return `<li style="white-space: nowrap;" class="p-g">
                                              <div class="p-g-7 text">${
                                            point.name
                                        }</div>
                                  <div class="p-g-5 ${classSumPoint}">${
                                            point.currency
                                        } ${roundAndAddComma(point.itra)}</div>
                                              </li>`;
                                    })
                                    .join('');
                            } else {
                                this.points.forEach(function (point) {
                                    let classSumPoint = '';
                                    if (Math.abs(Number(roundAndAddComma(point.y))) !== 0) {
                                        if (point.y < 0) {
                                            classSumPoint = 'sum-debit';
                                        } else if (point.y > 0) {
                                            classSumPoint = 'sum-credit';
                                        }
                                    }
                                    str += `<li style="white-space: nowrap;" class="p-g"><div class="p-g-1">
               <i style="font-size: 12px;color: ${
                                        point.series.color
                                    }" class="fas fa-circle"></i></div>
              <div class="p-g-6 text">
             ${point.series.name}
              </div>
              <div class="p-g-5 ${classSumPoint}">
                 ${point.point.currency} ${roundAndAddComma(point.y)}
                </div>
                </li>`;
                                });
                            }
                            str += '</ul></div>';
                            return str;
                        }
                    };
                } else {
                    const companyAccountIds =
                        this.userService.appData.userData.accountSelect.map(
                            (id) => id.companyAccountId
                        );
                    const companyId =
                        this.userService.appData.userData.companySelect.companyId;
                    const transPerDayCashFlow = this.restCommonService;
                    const translation = this.translate;

                    tooltip = {
                        // snap: 0,
                        // hideDelay: 5000,
                        backgroundColor: '#edf0f2',
                        borderWidth: 1,
                        borderColor: '#cbc9c9',
                        useHTML: true,
                        borderRadius: 2,
                        padding: 0,
                        shadow: false,
                        enabled: true,
                        shared: false,
                        style: {
                            pointerEvents: 'auto'
                        },
                        formatter: function () {
                            // debugger
                            let textLink: string, classSumPoint: string;

                            if (this.series.name === 'משיכות') {
                                textLink = 'לכל המשיכות';
                                classSumPoint = 'sum-debit';
                            }
                            switch (this.series.name) {
                                case translation.instant(
                                    'menu.customers.financialManagement.bankAccount.charts.revenuesName'
                                ):
                                    textLink = 'לכל ההפקדות';
                                    classSumPoint = 'sum-credit';
                                    break;
                                case translation.instant(
                                    'menu.customers.financialManagement.bankAccount.charts.expensesName'
                                ):
                                    textLink = 'לכל המשיכות';
                                    classSumPoint = 'sum-debit';
                                    break;
                                case translation.instant(
                                    'menu.customers.tazrim.charts.incomes'
                                ):
                                    textLink = 'לכל ההכנסות';
                                    classSumPoint = 'sum-credit';
                                    break;
                                case translation.instant(
                                    'menu.customers.tazrim.charts.expenses'
                                ):
                                    textLink = 'לכל ההוצאות';
                                    classSumPoint = 'sum-debit';
                                    break;
                            }

                            let tooltipData;
                            if (!data.tooltips[0].date) {
                                tooltipData = data.tooltips.find(
                                    (ttd) => ttd.x === this.point.x
                                ).details[this.series.index];
                                const l = tooltipData.length;
                                // const paddingLeft = l ? '20' : '10';

                                // tslint:disable-next-line:max-line-length
                                const title = `${this.series.name}${
                                    isDaily ? ' ' + new Date(this.point['xTime']).getDate() : ''
                                } ${
                                    translation.translations[translation.currentLang].months[
                                        new Date(this.point['xTime']).getMonth()
                                        ]
                                } ${new Date(this.point['xTime']).getFullYear()}`;
                                // ${this.series.chart.xAxis['0'].axisTitle ? this.series.chart.xAxis['0'].axisTitle.textStr : ''
                                // debugger;
                                let str = `<div class="tooltip-charts">
    <div class="titlesTooltipTraceWorkaround">
      <div>${title}</div>
      <div id="getData" 
      
      class="${
                                    (isDaily ? 'daymonyear:' : 'monyear:') +
                                    data.series[this.series.index].data.find(
                                        (ttd) => ttd.x === this.point.x
                                    ).xTime

                                }, type:${this.series.index}, classSumPoint:${classSumPoint}"
      >
        ${textLink}
      </div>
    </div>
    <ul style="max-height: 195px; overflow: auto;-ms-overflow-style:scrollbar;" class="scroll-chrome">`;
                                for (let i = 0; i < l; i++) {
                                    // const classSumPoint = (tooltipData[i].total < 0) ? 'sum-debit' : 'sum-credit';

                                    str += `<li style="white-space: nowrap;" class="p-g">
              <div class="p-g-8">
              ${tooltipData[i].mainDesc}
              </div>
              <div class="p-g-4 ${classSumPoint}">
                   ${data.currencySymbol} ${roundAndAddComma(
                                        tooltipData[i].total
                                    )}
                </div>
                </li>`;
                                }
                                str += '</ul></div>';

                                const strNotData = `<div class="tooltip-charts">
    <div class="titlesTooltip" style="padding-left: 10px">
      <div class="notLink">${title}</div>
    </div>
<ul><li><div style="line-height: 40px !important;">
לא נמצאו
${this.series.name}
עבור
${isDaily ? 'יום ' : 'חודש '}
זה
</div>
</li></ul>
</div>`;

                                if (tooltipData instanceof Observable) {
                                    // console.log('data.tooltips[this.series.index] -> %o', data.tooltips[this.series.index][this.point.x]);
                                    (tooltipData as Observable<any>).subscribe((rslt) => {
                                        // console.log('rslt => %o', rslt.body);
                                        const dayDetails = data.tooltips.find(
                                            (ttd) => ttd.x === this.point.x
                                        );
                                        dayDetails.details[this.series.index] = rslt.body;
                                        if (this.series.name === 'משיכות') {
                                            dayDetails.details[this.series.index].forEach(
                                                (trns) => (trns.total = trns.total * -1)
                                            );
                                            dayDetails.details[this.series.index].sort(
                                                (a, b) => a.total - b.total
                                            );
                                        } else {
                                            dayDetails.details[this.series.index].sort(
                                                (a, b) => b.total - a.total
                                            );
                                        }

                                        setTimeout(() => {
                                            // console.log('%o', this);
                                            this.series.chart.redraw();
                                        });
                                    });

                                    return `<div class="tooltip-charts">
                        <div class="titlesTooltip"  style="padding-left: 10px">
                          <div class="notLink">${title}</div>
                        </div>
                        <ul><li><div style="line-height: 40px !important;">
                        טוען
                        ${this.series.name}
                        עבור יום זה...
                        </div>
                        </li></ul>
                        </div>`;
                                }

                                return tooltipData.length > 0 ? str : strNotData;
                            } else {
                                // debugger
                                const title = `${this.series.name}${
                                    isDaily ? ' ' + new Date(this.point['xTime']).getDate() : ''
                                } ${
                                    translation.translations[translation.currentLang].months[
                                        new Date(this.point['xTime']).getMonth()
                                        ]
                                } ${new Date(this.point['xTime']).getFullYear()}`;
                                // const title = `${this.series.name} ${this.point.category} ${this.series.chart.xAxis['0'].axisTitle ? this.series.chart.xAxis['0'].axisTitle.textStr : ''}`;
                                const parameters: any = {
                                    companyAccountIds: companyAccountIds,
                                    companyId: companyId,
                                    dateFrom:
                                        this.point['xTime'] === null
                                            ? new Date().getTime()
                                            : this.point['xTime'],
                                    dateTill:
                                        this.point['xTime'] === null
                                            ? new Date().getTime()
                                            : this.point['xTime'],
                                    expence: classSumPoint === 'sum-debit' ? 1 : 0,
                                    nigreret: this.point['xTime'] === null
                                };
                                transPerDayCashFlow
                                    .transPerDayCashFlow(parameters)
                                    .subscribe((response: any) => {
                                        tooltipData = response ? response['body'] : response;
                                        tooltipData = tooltipData.map((it) => {
                                            return {
                                                mainDesc: it.transName,
                                                total: it.total
                                            };
                                        });

                                        const l = tooltipData.length;
                                        // const paddingLeft = l ? '20' : '10';
                                        let str = `<div class="tooltip-charts">
    <div class="titlesTooltipTraceWorkaround">
      <div>${title}</div>
      <div id="getData"
     class="${
                                            (isDaily ? 'daymonyear:' : 'monyear:') +
                                            data.series[this.series.index].data.find(
                                                (ttd) => ttd.x === this.point.x
                                            ).xTime

                                        }, type:${this.series.index}"
>
        ${textLink}
      </div>
    </div>
    <ul style="max-height: 195px; overflow: auto;-ms-overflow-style:scrollbar;" class="scroll-chrome">`;
                                        for (let i = 0; i < l; i++) {
                                            // const classSumPoint = (tooltipData[i].total < 0) ? 'sum-debit' : 'sum-credit';

                                            str += `<li style="white-space: nowrap;" class="p-g">
              <div class="p-g-8">
              ${tooltipData[i].mainDesc}
              </div>
              <div class="p-g-4 ${classSumPoint}">
                   ${data.currencySymbol} ${roundAndAddComma(
                                                tooltipData[i].total
                                            )}
                </div>
                </li>`;
                                        }
                                        str += '</ul></div>';

                                        const strNotData = `<div class="tooltip-charts">
    <div class="titlesTooltip" style="padding-left: 10px">
      <div class="notLink">${title}</div>
    </div>
<ul><li><div style="line-height: 40px !important;">
לא נמצאו
${this.series.name}
עבור
${isDaily ? 'יום ' : 'חודש '}
זה
</div>
</li></ul>
</div>`;

                                        this.series.chart.tooltip.label.textSetter(
                                            tooltipData.length > 0 ? str : strNotData
                                        );
                                    });

                                return `<div class="tooltip-charts">
                        <div class="titlesTooltip"  style="padding-left: 10px">
                          <div class="notLink">${title}</div>
                        </div>
                        <ul><li><div style="line-height: 40px !important;">
                        טוען
                        ${this.series.name}
                        עבור יום זה...
                        </div>
                        </li></ul>
                        </div>`;
                            }
                        }
                    };
                }

                if (isDaily) {
                    isDaily = [];
                    const flags = [];
                    const l = xAxiscategoriesAll.length;
                    for (let i = 0; i < l; i++) {
                        const month = new Date(xAxiscategoriesAll[i]).getMonth();
                        const year = new Date(xAxiscategoriesAll[i]).getFullYear();
                        if (!flags[year + '_' + month]) {
                            flags[year + '_' + month] = [];
                        }
                        flags[year + '_' + month].push(xAxiscategoriesAll[i]);
                    }
                    // console.log(flags)
                    Object.keys(flags).forEach(key => {
                        const monthDate = flags[key];
                        const numMidMonth: number = parseInt(
                            (monthDate.length / 2).toString(),
                            10
                        );
                        const dateMidMonth: number = monthDate[numMidMonth === 0 ? numMidMonth : numMidMonth - 1];
                        isDaily.push(dateMidMonth);
                    });
                }

                this.chart = new Chart({
                    boost: {
                        useGPUTranslations: true
                    },
                    chart: {
                        events: {
                            click: (event) => {
                                if (event.target['id'] === 'getData') {
                                    const paramsClass = event.target['className'].split(',');
                                    if (paramsClass[0].includes('monyear')) {
                                        this.goToFinancialManagementBankAccountDetailsComponent([
                                            Boolean(Number(paramsClass[1].split(':')[1])),
                                            Number(paramsClass[0].split(':')[1]),
                                            false,
                                            paramsClass[2].includes('sum-credit')
                                        ]);
                                    } else if (paramsClass[0].includes('daymonyear')) {
                                        this.goToFinancialManagementBankAccountDetailsComponent([
                                            Boolean(Number(paramsClass[1].split(':')[1])),
                                            Number(paramsClass[0].split(':')[1]),
                                            true,
                                            paramsClass[2].includes('sum-credit')
                                        ]);
                                    }
                                }
                            }
                        },
                        // defaultSeriesType: 'line',
                        type: 'line',
                        style: {
                            fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                            fontSize: '12px'
                        },
                        plotBorderColor: '#ffffff',
                        plotBorderWidth: 0,
                        plotBackgroundColor: '#ffffff',
                        alignTicks: false,
                        // zoomType: null,
                        // margin: [20, 20, 20, 20],
                        // spacing: [0, 0, 0, 0],
                        plotShadow: false,
                        shadow: false,
                        borderColor: '#ffffff',
                        borderWidth: 0,
                        borderRadius: 0,
                        backgroundColor: '#ffffff',
                        ignoreHiddenSeries: false,
                        animation: {
                            duration: 300
                        },
                        reflow: true,
                        inverted: false,
                        className: 'nameOfClass'
                    },
                    title: {
                        text: ''
                    },
                    subtitle: {
                        text: ''
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        min: data.xAxiscategories.length > 1 ? Math.max(xMin, 0.45) : 0,
                        max: xMax,
                        title: {
                            text: ''
                            // style: {
                            //     fontSize: '16px',
                            //     color: '#0f3860'
                            // },
                            // margin: 10
                        },
                        className: 'xAxisClass',
                        allowDecimals: false,
                        categories: this.getFormatDatesX(xAxiscategoriesAll, isDaily),
                        // reversed: true,
                        crosshair: data.crosshair,
                        labels: {
                            useHTML: true,
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                textAlign: 'center',
                                padding: '0',
                                margin: '0',
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '14px',
                                color: '#0f3860',
                                whiteSpace: 'normal'
                            }
                        },
                        offset: 0,
                        lineWidth: 2,
                        gridLineWidth: data.gridLineWidth,
                        gridLineColor: '#e4e8eb', // color line y wide
                        lineColor: '#cbc9c9',
                        tickColor: '#cbc9c9',
                        tickWidth: 2,
                        tickLength: 6,
                        tickmarkPlacement: 'on',
                        tickPosition: 'outside',
                        startOnTick: false,
                        endOnTick: false,
                        scrollbar: {
                            enabled: scrollbar
                        }
                    },
                    yAxis: {
                        max:
                            data.maxY >= 0 ? data.maxY * 1.1 : data.maxY + data.maxY * -0.1,
                        min: Math.min(data.minY * 1.1, data.minY * -0.05),
                        // min: Math.min(data.minY * 1.1, data.maxY * -0.05),
                        // min: data.minY * 1.1,
                        endOnTick: false,
                        startOnTick: false,
                        // tickAmount: 5,
                        title: {
                            text: ''
                        },
                        allowDecimals: false,
                        tickPosition: 'outside',
                        tickmarkPlacement: 'on',
                        plotLines: [
                            /*{
                                          color: '#999', // '#f21a1a',
                                          dashStyle: 'solid', // 'Dash',
                                          width: 2,
                                          value: 0,
                                          zIndex: 3
                                      },*/ ...data.plotLines.map((pl, idx) => {
                                pl.color = Highcharts.getOptions().colors[idx];
                                return pl;
                            })
                        ],
                        lineColor: '#cbc9c9', // border left side
                        lineWidth: 2, // size border left side
                        opposite: false,
                        gridLineColor: '#e4e8eb', // color line x wide
                        gridLineWidth: data.gridLineWidth, // change to 0 for other screen
                        tickLength: 10,
                        tickWidth: 2,
                        labels: {
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '14px',
                                color: '#0f3860',
                                direction: 'ltr'
                            },
                            align: 'right',
                            x: -15,
                            y: 3,
                            padding: 0
                            // formatter: function () {
                            //   return this.value / 1000 + 'K';
                            // }
                        },
                        offset: 0
                    },
                    legend: data.legend || {
                        enabled: false
                    },
                    plotOptions: {
                        line: {
                            animation: true,
                            // lineWidth: 1, // width of line of graph
                            dataLabels: {
                                style: {
                                    fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                    textOutline: '0px',
                                    color: '#0f3860',
                                    fontSize: '14px',
                                    fontWeight: '400'
                                },
                                align: 'center',
                                enabled: data.dataLabelsEnabled, // titles above pointers
                                y: -5,
                                formatter: function () {
                                    return roundAndAddComma(this.y);
                                }
                            },
                            enableMouseTracking: true
                        },
                        series: {
                            allowPointSelect: false,
                            cursor: 'pointer',
                            stickyTracking: false,
                            dashStyle: 'Solid',
                            marker: {
                                enabled:
                                    data.markerEnabled ||
                                    (data.series &&
                                        data.series.some(
                                            (ser) => ser.data && ser.data.length === 1
                                        )), // change between states
                                symbol: 'circle',
                                radius: 2.5,
                                // width: 8,
                                // height: 8,
                                lineWidth: 1,
                                lineColor: null, // inherit from series,
                                states: {
                                    hover: {
                                        lineWidthPlus: 2
                                    }
                                }
                            },
                            dataLabels: {
                                zIndex: 2
                            }
                        }
                    },
                    tooltip: tooltip,
                    series: data.series
                });
                // // debugger;
                // if (scrollbar) {
                //     this.chart.options.xAxis['scrollbar'] = {
                //         enabled: scrollbar
                //     };
                // }
            } else if (data.lineProfitAndLoss) {
                this.chart = new Chart({
                    boost: {
                        useGPUTranslations: true
                    },
                    chart: {
                        events: {
                            click: (event) => {
                            }
                        },
                        // defaultSeriesType: 'line',
                        type: 'line',
                        style: {
                            fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                            fontSize: '12px'
                        },
                        plotBorderColor: '#ffffff',
                        plotBorderWidth: 0,
                        plotBackgroundColor: '#ffffff',
                        alignTicks: false,
                        // zoomType: null,
                        // margin: [20, 20, 20, 20],
                        // spacing: [0, 0, 0, 0],
                        plotShadow: false,
                        shadow: false,
                        borderColor: '#ffffff',
                        borderWidth: 0,
                        borderRadius: 0,
                        backgroundColor: '#ffffff',
                        ignoreHiddenSeries: false,
                        animation: {
                            duration: 300
                        },
                        reflow: true,
                        inverted: false,
                        className: 'nameOfClass'
                    },
                    title: {
                        text: ''
                    },
                    subtitle: {
                        text: ''
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        // min: Math.max(xMin, 0.45),
                        // max: xMax,
                        title: {
                            text: ''
                            // style: {
                            //     fontSize: '16px',
                            //     color: '#0f3860'
                            // },
                            // margin: 10
                        },
                        className: 'xAxisClass',
                        allowDecimals: false,
                        categories: xAxiscategoriesAll,
                        // reversed: true,
                        crosshair: data.crosshair,
                        labels: {
                            useHTML: true,
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                textAlign: 'center',
                                padding: '0',
                                margin: '0',
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '14px',
                                color: '#0f3860',
                                whiteSpace: 'normal'
                            }
                        },
                        offset: 0,
                        lineWidth: 2,
                        gridLineWidth: 0,
                        lineColor: '#cbc9c9',
                        tickColor: '#cbc9c9',
                        tickWidth: 2,
                        tickLength: 6,
                        tickmarkPlacement: 'on',
                        tickPosition: 'outside',
                        startOnTick: false,
                        endOnTick: false
                    },
                    yAxis: {
                        // max: data.maxY >= 0 ? data.maxY * 1.1 : data.maxY + data.maxY * -0.1,
                        // min: Math.min(data.minY * 1.1, data.maxY * -0.05),
                        // min: data.minY * 1.1,
                        endOnTick: false,
                        startOnTick: false,
                        // tickAmount: 5,
                        title: {
                            text: ''
                        },
                        allowDecimals: false,
                        tickPosition: 'outside',
                        tickmarkPlacement: 'on',
                        plotLines: [
                            {
                                color: '#f21a1a',
                                dashStyle: 'Dash',
                                width: 2,
                                value: 0
                            }
                        ],
                        lineColor: '#cbc9c9', // border left side
                        lineWidth: 2, // size border left side
                        opposite: false,
                        gridLineColor: '#e4e8eb', // color line x wide
                        gridLineWidth: data.gridLineWidth, // change to 0 for other screen
                        tickLength: 10,
                        tickWidth: 2,
                        labels: {
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '14px',
                                color: '#0f3860',
                                direction: 'ltr'
                            },
                            align: 'right',
                            x: -15,
                            y: 3,
                            padding: 0
                            // formatter: function () {
                            //   return this.value / 1000 + 'K';
                            // }
                        },
                        offset: 0
                    },
                    legend: {
                        itemStyle: {
                            color: '#adacac',
                            fontSize: '16px'
                        },
                        symbolWidth: 8,
                        itemDistance: 30,
                        layout: 'horizontal',
                        align: 'right',
                        margin: 0, // floating: true,
                        enabled: true,
                        verticalAlign: 'top',
                        borderWidth: 0,
                        useHTML: true,
                        rtl: true,
                        // y: -50,
                        reversed: true,
                        // x: 20,
                        navigation: {
                            activeColor: '#3E576F',
                            animation: true,
                            arrowSize: 12,
                            inactiveColor: '#CCC',
                            style: {
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontWeight: 'bold',
                                color: '#333',
                                fontSize: '12px'
                            }
                        }
                    },
                    tooltip: {
                        snap: 5,
                        hideDelay: 1000,
                        shared: false,
                        shadow: true,
                        useHTML: true,
                        // crosshairs: true,
                        backgroundColor: '#ffffff',
                        borderRadius: 2,
                        borderWidth: 1,
                        borderColor: '#eaeaea',
                        padding: 0,
                        enabled: true,
                        formatter: function () {
                            let color = '#229f88';
                            if (this.y < 0) {
                                color = '#ef3636';
                            }
                            let str = `<div class="tooltipAllAcc scroll-chrome" style="max-height: 195px; overflow: auto;">
<div class="row title">
<div>
סה״כ חיובים
</div>
<div style="direction: ltr; font-size: 14px; color: ${color}">
₪ ${roundAndAddComma(this.y)}
</div>
</div>
`;
                            const pointSeriesIndex = this.series.chart.series.indexOf(
                                this.series
                            );
                            if (data.tooltipsArr[pointSeriesIndex].length) {
                                data.tooltipsArr[pointSeriesIndex][this.point.x].forEach(
                                    (acc, idx) => {
                                        let colorInside = '#229f88';
                                        if (acc.Val < 0) {
                                            colorInside = '#ef3636';
                                        }
                                        str += `<div class="row">
<div>
<div>
${acc.name}
</div>
</div>
<div style="direction: ltr; font-size: 14px; color: ${colorInside}">₪ ${roundAndAddComma(
                                            acc.Val
                                        )}</div>
</div>`;
                                    }
                                );
                            } else {
                                str += `<div class="row"><div>אין נתונים</div></div>`;
                            }
                            str += '</div>';
                            return str;
                        }
                    },
                    navigation: {
                        buttonOptions: {
                            // align: 'right',
                            // verticalAlign: 'top',
                            y: -45
                        },
                        menuItemStyle: {
                            fontWeight: 'normal',
                            background: 'none',
                            color: '#1387a9'
                        },
                        menuItemHoverStyle: {
                            background: '#1387a9',
                            color: '#fff'
                        }
                    },
                    plotOptions: {
                        line: {
                            animation: true,
                            lineWidth: 1, // width of line of graph
                            dataLabels: {
                                style: {
                                    fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                    textOutline: '0px',
                                    color: '#0f3860',
                                    fontSize: '14px',
                                    fontWeight: '400'
                                },
                                align: 'center',
                                enabled: data.dataLabelsEnabled, // titles above pointers
                                y: -5,
                                formatter: function () {
                                    return roundAndAddComma(this.y);
                                }
                            },
                            enableMouseTracking: true
                        },
                        series: {
                            allowPointSelect: false,
                            cursor: 'pointer',
                            stickyTracking: false,
                            dashStyle: 'Solid',
                            marker: {
                                enabled: data.markerEnabled, // change between states
                                symbol: 'circle',
                                radius: 4,
                                width: 10,
                                height: 10,
                                lineWidth: 1,
                                lineColor: null, // inherit from series,
                                states: {
                                    hover: {
                                        lineWidth: 2
                                    }
                                }
                            }
                        }
                    },
                    series: data.series
                });
            } else if (data.column) {
                this.chart = new Chart({
                    boost: {
                        useGPUTranslations: true
                    },
                    chart: {
                        spacingRight: 0,
                        // defaultSeriesType: 'column',
                        type: 'column',
                        style: {
                            fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                            fontSize: '14px'
                        },
                        plotBorderColor: '#ffffff',
                        plotBorderWidth: 0,
                        plotBackgroundColor: '#ffffff',
                        alignTicks: false,
                        // zoomType: null,
                        plotShadow: false,
                        shadow: false,
                        borderColor: '#ffffff',
                        borderWidth: 0,
                        borderRadius: 0,
                        backgroundColor: '#ffffff',
                        ignoreHiddenSeries: false,
                        animation: {
                            duration: 300
                        },
                        reflow: true,
                        inverted: false,
                        className: 'columnClass'
                    },
                    legend: {
                        enabled: false
                    },
                    title: {
                        text: ''
                    },
                    subtitle: {
                        text: ''
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        reversed: false,
                        crosshair: false,
                        labels: {
                            useHTML: false,
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                textAlign: 'center',
                                padding: '0',
                                margin: '0',
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '14px',
                                color: '#0f3860'
                            }
                        },
                        offset: 0,
                        lineWidth: 0,
                        gridLineWidth: 0,
                        tickWidth: 0,
                        tickLength: 0,
                        tickPosition: 'outside',
                        startOnTick: false,
                        endOnTick: false,
                        tickInterval: 0,
                        title: {
                            text: ''
                        },
                        className: 'xAxisClass',
                        allowDecimals: true,
                        categories: data.xAxiscategories
                    },
                    plotOptions: {
                        series: {
                            stacking: 'normal',
                            allowPointSelect: false,
                            stickyTracking: false
                        },
                        column: {
                            borderWidth: 0,
                            pointWidth: 10
                        }
                    },
                    yAxis: {
                        // tickAmount: 4,
                        // max: data.max,
                        // min: data.min,
                        maxPadding: !data.dataLabelsEnabled ? 0 : 0.1,
                        minPadding: 0,
                        // minTickInterval: 10,
                        tickPixelInterval: 24,
                        // tickAmount: 4,
                        allowDecimals: false,
                        offset: 0,
                        endOnTick: false,
                        startOnTick: false,
                        title: {
                            text: ''
                        },
                        lineWidth: 0, // size border left side
                        opposite: false,
                        gridLineWidth: 0, // change to 0 for other screen
                        tickLength: 0,
                        tickWidth: 0,
                        labels: {
                            useHTML: true,
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '14px',
                                color: '#0f3860',
                                direction: 'ltr'
                            },
                            align: 'right',
                            padding: 0,
                            x: -15,
                            y: 5
                        }
                    },
                    tooltip: {
                        enabled: false
                    },
                    series: data.series
                });
            } else if (data.columnGroup) {
                const companyAccountIds = Array.isArray(
                    this.userService.appData.userData.accountSelect
                )
                    ? this.userService.appData.userData.accountSelect.map(
                        (id) => id.companyAccountId
                    )
                    : [];
                const companyId =
                    this.userService.appData.userData.companySelect.companyId;
                const transPerDayCashFlow = this.restCommonService;
                const translation = this.translate;
                this.chart = new Chart({
                    boost: {
                        useGPUTranslations: true
                    },
                    chart: {
                        type: 'column',
                        // defaultSeriesType: 'column',
                        style: {
                            fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                            fontSize: '12px'
                        },
                        plotBorderColor: '#ffffff',
                        plotBorderWidth: 0,
                        plotBackgroundColor: '#ffffff',
                        alignTicks: false,
                        // zoomType: null,
                        // marginTop: 30,
                        plotShadow: false,
                        shadow: false,
                        borderColor: '#ffffff',
                        borderWidth: 0,
                        borderRadius: 0,
                        backgroundColor: '#ffffff',
                        ignoreHiddenSeries: true,
                        animation: {
                            duration: 300
                        },
                        reflow: true,
                        inverted: false,
                        className: 'nameOfClass',
                        events: {
                            click: (event) => {
                                if (event.target['id'] === 'getData') {
                                    const paramsClass = event.target['className'].split(',');
                                    debugger
                                    if (paramsClass[0].includes('monyear')) {
                                        this.goToFinancialManagementBankAccountDetailsComponent([
                                            Boolean(Number(paramsClass[1].split(':')[1])),
                                            Number(paramsClass[0].split(':')[1]),
                                            false
                                        ]);
                                    } else if (paramsClass[0].includes('daymonyear')) {
                                        this.goToFinancialManagementBankAccountDetailsComponent([
                                            Boolean(Number(paramsClass[1].split(':')[1])),
                                            Number(paramsClass[0].split(':')[1]),
                                            true
                                        ]);
                                    }
                                }
                            },
                            load: (event) => {
                                // (<any>event.target).pointer.onContainerMouseMove = function (e) {
                                //     const chart = this.chart;
                                //     // if (!defined(H.hoverChartIndex) ||
                                //     //     !charts[H.hoverChartIndex] ||
                                //     //     !charts[H.hoverChartIndex].mouseIsDown) {
                                //     //     H.hoverChartIndex = chart.index;
                                //     // }
                                //     if (!Highcharts.defined((<any>Highcharts).hoverChartIndex) ||
                                //         !Highcharts.charts[(<any>Highcharts).hoverChartIndex] ||
                                //         !(<any>Highcharts.charts[(<any>Highcharts).hoverChartIndex]).mouseIsDown) {
                                //         (<any>Highcharts).hoverChartIndex = chart.index;
                                //     }
                                //     e = this.normalize(e);
                                //     // In IE8 we apparently need this returnValue set to false in order to
                                //     // avoid text being selected. But in Chrome, e.returnValue is prevented,
                                //     // plus we don't need to run e.preventDefault to prevent selected text
                                //     // in modern browsers. So we set it conditionally. Remove it when IE8 is
                                //     // no longer needed. #2251, #3224.
                                //     if (!e.preventDefault) {
                                //         e.returnValue = false;
                                //     }
                                //     if (chart.mouseIsDown === 'mousedown') {
                                //         this.drag(e);
                                //     }
                                //     // Show the tooltip and run mouse over events (#977)
                                //     if (!this.inClass(e.target, 'tooltip-charts')
                                //         && (this.inClass(e.target, 'highcharts-tracker') ||
                                //             chart.isInsidePlot(e.chartX - chart.plotLeft, e.chartY - chart.plotTop))
                                //         && !chart.openMenu) {
                                //         this.runPointActions(e);
                                //     }
                                // };
                            }
                        }
                    },
                    legend: data.legend || {
                        useHTML: true,
                        enabled: true,
                        align: 'right',
                        verticalAlign: 'top',
                        // x: 0,
                        // y: 0,
                        margin: 0,
                        rtl: true,
                        symbolHeight: 12,
                        symbolWidth: 12,
                        symbolRadius: 0,
                        floating: false,
                        itemStyle: {
                            color: '#0f3860',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            textOverflow: 'ellipsis'
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    title: {
                        text: ''
                    },
                    subtitle: {
                        text: ''
                    },
                    xAxis: {
                        min: 0, // xMin,
                        max: xAxiscategoriesAll.length - 1,
                        title: {
                            text: isDaily
                                ? `<b>${
                                    // tslint:disable-next-line:max-line-length
                                    this.translate.translations[this.translate.currentLang]
                                        .months[new Date(xAxiscategoriesAll[0]).getMonth()]
                                } ${new Date(xAxiscategoriesAll[0]).getFullYear()}</b>`
                                : '',
                            style: {
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '16px',
                                color: '#0f3860'
                            }
                        },
                        className: 'xAxisClass',
                        // allowDecimals: true,
                        categories: this.getFormatDatesX(xAxiscategoriesAll, isDaily),
                        // reversed: true,
                        labels: {
                            useHTML: true,
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                textAlign: 'center',
                                padding: '0',
                                margin: '0',
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '15px',
                                color: '#0f3860',
                                whiteSpace: 'normal'
                            }
                        },
                        // offset: 0,
                        // lineWidth: 2,
                        // gridLineWidth: 0,
                        gridLineColor: data.gridLineColor || 'rgba(228, 232, 235, 0.40)', // '#e4e8eb', // color line x wide
                        gridLineWidth: data.gridLineWidth || 0, // change to 0 for other screen
                        lineColor: '#cbc9c9',
                        tickColor: '#cbc9c9',
                        tickLength: data.gridLineWidth > 0 ? 0 : 10,
                        // tickWidth: 2,
                        // tickLength: 6,
                        // tickmarkPlacement: 'on',
                        tickPosition: 'inside'
                        // startOnTick: false,
                        // endOnTick: false,
                        // tickInterval: 0,
                        // crosshair: false
                    },
                    yAxis: {
                        endOnTick: false,
                        startOnTick: false,
                        title: {
                            text: ''
                        },
                        allowDecimals: false,
                        tickPosition: 'outside',
                        tickmarkPlacement: 'on',
                        tickLength: 10,
                        tickWidth: 2,
                        plotLines: data.plotLines,
                        lineColor: '#cbc9c9', // border left side
                        lineWidth: 2, // size border left side
                        opposite: false,
                        gridLineColor: '#e4e8eb', // color line x wide
                        gridLineWidth: data.gridLineWidth, // change to 0 for other screen
                        labels: {
                            reserveSpace: true,
                            staggerLines: 1,
                            style: {
                                fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                fontSize: '15px',
                                color: '#0f3860',
                                direction: 'ltr'
                            },
                            align: 'right',
                            x: -15,
                            y: 3,
                            padding: 0
                        },
                        offset: 0,
                        stackLabels: data.stacked &&
                            data.dataLabelsEnabled && {
                                enabled: true,
                                style: {
                                    fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    color: '#0f3860',
                                    direction: 'ltr',
                                    opacity: 1,
                                    visibility: 'visible'
                                },
                                formatter: function () {
                                    return roundAndAddComma(this.total);
                                }
                            }
                    },
                    tooltip: {
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: '#cbc9c9',
                        useHTML: true,
                        borderRadius: 10, // 2,
                        padding: 0.75,
                        shadow: false,
                        enabled: true,
                        shared: false,
                        style: {
                            pointerEvents: 'auto'
                        },
                        formatter:
                            Array.isArray(data.tooltips) && data.tooltips.length
                                ? function () {
                                    // debugger
                                    let textLink: string, classSumPoint: string;
                                    const pointSeriesIndex = this.series.chart.series.indexOf(
                                        this.series
                                    );

                                    if (this.series.name === 'משיכות') {
                                        textLink = 'לכל המשיכות';
                                        classSumPoint = 'sum-debit';
                                    }
                                    switch (this.series.name) {
                                        case translation.instant(
                                            'menu.customers.financialManagement.bankAccount.charts.revenuesName'
                                        ):
                                            textLink = 'לכל ההפקדות';
                                            classSumPoint = 'sum-credit';
                                            break;
                                        case translation.instant(
                                            'menu.customers.financialManagement.bankAccount.charts.expensesName'
                                        ):
                                            textLink = 'לכל המשיכות';
                                            classSumPoint = 'sum-debit';
                                            break;
                                        case translation.instant(
                                            'menu.customers.tazrim.charts.incomes'
                                        ):
                                            textLink = 'לכל ההכנסות';
                                            classSumPoint = 'sum-credit';
                                            break;
                                        case translation.instant(
                                            'menu.customers.tazrim.charts.expenses'
                                        ):
                                            textLink = 'לכל ההוצאות';
                                            classSumPoint = 'sum-debit';
                                            break;
                                    }

                                    let tooltipData;
                                    if (!data.tooltips[0].date) {
                                        tooltipData = data.tooltips.find(
                                            (ttd) => ttd.x === this.point.x
                                        ).details[pointSeriesIndex];
                                        const l = tooltipData.length;
                                        // const paddingLeft = l ? '20' : '10';

                                        // tslint:disable-next-line:max-line-length
                                        const title = `${this.series.name}${
                                            isDaily
                                                ? ' ' + new Date(this.point['xTime']).getDate()
                                                : ''
                                        } ${
                                            translation.translations[translation.currentLang]
                                                .months[new Date(this.point['xTime']).getMonth()]
                                        } ${new Date(this.point['xTime']).getFullYear()}`;
                                        // ${this.series.chart.xAxis['0'].axisTitle ? this.series.chart.xAxis['0'].axisTitle.textStr : ''
                                        // debugger;
                                        let str = `<div class="tooltip-charts">
    <div class="titlesTooltipTraceWorkaround">
      <div>${title}</div>
      <div id="getData" 
      
           class="${
                                            (isDaily ? 'daymonyear:' : 'monyear:') +
                                            this.series.data.find((ttd) => ttd.x === this.point.x)['xTime']

                                        }, type:${pointSeriesIndex}, classSumPoint:${classSumPoint}"
           
>
        ${textLink}
      </div>
    </div>
    <ul style="max-height: 195px; overflow: auto;-ms-overflow-style:scrollbar;" class="scroll-chrome">`;
                                        for (let i = 0; i < l; i++) {
                                            // const classSumPoint = (tooltipData[i].total < 0) ? 'sum-debit' : 'sum-credit';

                                            str += `<li style="white-space: nowrap;" class="p-g">
              <div class="p-g-8">
              ${tooltipData[i].mainDesc}
              </div>
              <div class="p-g-4 ${classSumPoint}">
                   ${data.currencySymbol} ${roundAndAddComma(
                                                tooltipData[i].total
                                            )}
                </div>
                </li>`;
                                        }
                                        str += '</ul></div>';

                                        const strNotData = `<div class="tooltip-charts">
    <div class="titlesTooltip" style="padding-left: 10px">
      <div class="notLink">${title}</div>
    </div>
<ul><li><div style="line-height: 40px !important;">
לא נמצאו
${this.series.name}
עבור
${isDaily ? 'יום ' : 'חודש '}
זה
</div>
</li></ul>
</div>`;

                                        if (tooltipData instanceof Observable) {
                                            // tslint:disable-next-line:max-line-length
                                            // console.log('data.tooltips[this.series.index] -> %o', data.tooltips[this.series.index][this.point.x]);
                                            (tooltipData as Observable<any>).subscribe((rslt) => {
                                                // console.log('rslt => %o', rslt.body);
                                                const dayDetails = data.tooltips.find(
                                                    (ttd) => ttd.x === this.point.x
                                                );
                                                dayDetails.details[pointSeriesIndex] = rslt.body;
                                                if (this.series.name === 'משיכות') {
                                                    dayDetails.details[pointSeriesIndex].forEach(
                                                        (trns) => (trns.total = trns.total * -1)
                                                    );
                                                    dayDetails.details[pointSeriesIndex].sort(
                                                        (a, b) => a.total - b.total
                                                    );
                                                } else {
                                                    dayDetails.details[pointSeriesIndex].sort(
                                                        (a, b) => b.total - a.total
                                                    );
                                                }

                                                setTimeout(() => {
                                                    // console.log('%o', this);
                                                    this.series.chart.redraw();
                                                });
                                            });

                                            return `<div class="tooltip-charts">
                        <div class="titlesTooltip"  style="padding-left: 10px">
                          <div class="notLink">${title}</div>
                        </div>
                        <ul><li><div style="line-height: 40px !important;">
                        טוען
                        ${this.series.name}
                        עבור יום זה...
                        </div>
                        </li></ul>
                        </div>`;
                                        }

                                        return tooltipData.length > 0 ? str : strNotData;
                                    } else {
                                        // debugger
                                        // tslint:disable-next-line:max-line-length
                                        const title = `${this.series.name}${
                                            isDaily
                                                ? ' ' + new Date(this.point['xTime']).getDate()
                                                : ''
                                        } ${
                                            translation.translations[translation.currentLang]
                                                .months[new Date(this.point['xTime']).getMonth()]
                                        } ${new Date(this.point['xTime']).getFullYear()}`;
                                        // tslint:disable-next-line:max-line-length
                                        // const title = `${this.series.name} ${this.point.category} ${this.series.chart.xAxis['0'].axisTitle ? this.series.chart.xAxis['0'].axisTitle.textStr : ''}`;
                                        const parameters: any = {
                                            companyAccountIds: companyAccountIds,
                                            companyId: companyId,
                                            dateFrom:
                                                this.point['xTime'] === null
                                                    ? new Date().getTime()
                                                    : this.point['xTime'],
                                            dateTill:
                                                this.point['xTime'] === null
                                                    ? new Date().getTime()
                                                    : this.point['xTime'],
                                            expence: classSumPoint === 'sum-debit' ? 1 : 0,
                                            nigreret: this.point['xTime'] === null
                                        };
                                        transPerDayCashFlow
                                            .transPerDayCashFlow(parameters)
                                            .subscribe((response: any) => {
                                                tooltipData = response ? response['body'] : response;
                                                tooltipData = tooltipData.map((it) => {
                                                    return {
                                                        mainDesc: it.transName,
                                                        total: it.total
                                                    };
                                                });

                                                const l = tooltipData.length;
                                                // const paddingLeft = l ? '20' : '10';
                                                let str = `<div class="tooltip-charts">
    <div class="titlesTooltipTraceWorkaround">
      <div>${title}</div>
      <div id="getData" 
class="${
                                                    (isDaily ? 'daymonyear:' : 'monyear:') +
                                                    this.series.data.find((ttd) => ttd.x === this.point.x)['xTime']

                                                }, type:${pointSeriesIndex}, classSumPoint:${classSumPoint}"
   
      >
        ${textLink}
      </div>
    </div>
    <ul style="max-height: 195px; overflow: auto;-ms-overflow-style:scrollbar;" class="scroll-chrome">`;
                                                for (let i = 0; i < l; i++) {
                                                    // const classSumPoint = (tooltipData[i].total < 0) ? 'sum-debit' : 'sum-credit';

                                                    str += `<li style="white-space: nowrap;" class="p-g">
              <div class="p-g-8">
              ${tooltipData[i].mainDesc}
              </div>
              <div class="p-g-4 ${classSumPoint}">
                   ${data.currencySymbol} ${roundAndAddComma(
                                                        tooltipData[i].total
                                                    )}
                </div>
                </li>`;
                                                }
                                                str += '</ul></div>';

                                                const strNotData = `<div class="tooltip-charts">
    <div class="titlesTooltip" style="padding-left: 10px">
      <div class="notLink">${title}</div>
    </div>
<ul><li><div style="line-height: 40px !important;">
לא נמצאו
${this.series.name}
עבור
${isDaily ? 'יום ' : 'חודש '}
זה
</div>
</li></ul>
</div>`;

                                                // tslint:disable-next-line:max-line-length
                                                (<any>this.series.chart.tooltip).label.textSetter(
                                                    tooltipData.length > 0 ? str : strNotData
                                                );
                                            });

                                        return `<div class="tooltip-charts">
                        <div class="titlesTooltip"  style="padding-left: 10px">
                          <div class="notLink">${title}</div>
                        </div>
                        <ul><li><div style="line-height: 40px !important;">
                        טוען
                        ${this.series.name}
                        עבור יום זה...
                        </div>
                        </li></ul>
                        </div>`;
                                    }
                                }
                                : function () {
                                    // debugger;
                                    const classSum = this.y < 0 ? 'sum-credit' : '';
                                    // tslint:disable-next-line:max-line-length
                                    return `<div class="tooltip-charts" ${
                                        !this.point['transactionsHtml'] ? 'style="width: auto;"' : ''
                                    }>
    <div class="${
                                        this.point['transactionsHtml']
                                            ? 'titlesTooltipTraceWorkaround'
                                            : 'titlesTooltipWhite'
                                    }" style="background-color: ${this.point.color};">
      <div class="text-ellipsis">${this.series.name}</div>
      <p ${classSum ? `class="${classSum}"` : ''}>
        <span class="sum">${roundAndAddComma(this.y)}</span>
        <span class="currency">${
                                        (<any>this.series).userOptions.currency || data.currencySymbol
                                    }</span>
        ${
                                        this.point['notFinal']
                                            ? `<span>&nbsp;(${this.point['notFinal']})</span>`
                                            : ''
                                    }
      </p>
    </div>${this.point['transactionsHtml'] || ''}</div>`;
                                    // return str;
                                }
                        // positioner: function (labelWidth, labelHeight, point) {
                        //     // default implementation
                        //     const pos: { x: number; y: number } =
                        //         this.chart.tooltip.getPosition(labelWidth, labelHeight, point);
                        //
                        //     // if (!this.chart.hoverPoint || !this.chart.hoverPoint.transactionsHtml) {
                        //     //     return pos;
                        //     // }
                        //
                        //     // pos.x += (labelWidth / 2);
                        //     pos.x =
                        //         this.chart.plotLeft +
                        //         4 + // for arrow
                        //         (this.chart.hoverPoint['clientX'] +
                        //             this.chart.hoverPoint['graphic']['width'] / 2);
                        //
                        //     if (pos.x + labelWidth > this.chart.plotWidth) {
                        //         pos.x =
                        //             this.chart.plotLeft -
                        //             8 + // for arrow
                        //             (this.chart.hoverPoint['clientX'] +
                        //                 this.chart.hoverPoint['graphic']['width'] / 2 -
                        //                 labelWidth);
                        //     }
                        //
                        //     pos.y +=
                        //         (labelHeight / 3) *
                        //         (pos.y > point.plotY + this.chart.plotTop ? -1 : 1);
                        //     // console.log('pos ==> %o', pos);
                        //     pos.y = Math.max(pos.y, 0);
                        //
                        //     return pos;
                        //     // var tooltipX, tooltipY;
                        //     // if (point.plotX + labelWidth > this.chart.plotWidth) {
                        //     //     tooltipX = point.plotX + this.chart.plotLeft - labelWidth - 20;
                        //     // } else {
                        //     //     tooltipX = point.plotX + this.chart.plotLeft + 20;
                        //     // }
                        //     // tooltipY = point.plotY + this.chart.plotTop - 20;
                        //     // return {
                        //     //     x: tooltipX,
                        //     //     y: tooltipY
                        //     // };
                        // }
                    },
                    plotOptions: {
                        column: {
                            pointPadding: data.stacked
                                ? 0 // 0.8 / Math.max(data.series.length, 1) // Math.max(xAxiscategoriesAll.length, 1)
                                : 0.025 * data.series.length,
                            borderWidth: 0,
                            groupPadding: data.stacked
                                ? 0.35
                                : 0.6 / Math.max(data.series.length, 2) // Math.max(xAxiscategoriesAll.length, 1),
                        },
                        series: {
                            stacking: data.stacked ? 'normal' : null,
                            // threshold: Math.min(
                            //     ...data.series
                            //         .map(ser => ser.data.reduce((acmltr, pnt) => Math.min(acmltr, pnt.y), 0))),

                            dataLabels: {
                                style: {
                                    fontFamily: 'Assistant, Arial, Helvetica, sans-serif',
                                    textOutline: '0px',
                                    color: '#0f3860',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                },
                                y: 0,
                                align: 'center',
                                formatter: function () {
                                    // debugger;
                                    // console.log('%o, %o', this.y, this.total);
                                    const formatted = roundAndAddComma(this.y);
                                    return data.stacked && data.dataLabelsEnabled
                                        ? formatted !== roundAndAddComma(this.total)
                                            ? formatted
                                            : ''
                                        : formatted;
                                },
                                verticalAlign: 'top',
                                enabled: data.dataLabelsEnabled,
                                inside: true
                                // rotation: 90,
                                // style: {
                                //     textOutline: '0px',
                                //     color: '#ffffff',
                                //     fontSize: '14px',
                                //     fontWeight: '400'
                                // },
                                // y: 40,
                                // align: 'center',
                                // formatter: function () {
                                //     // debugger;
                                //     // console.log('%o, %o', this.y, this.total);
                                //     const formatted = roundAndAddComma(this.y);
                                //     return (data.stacked && data.dataLabelsEnabled)
                                //         ? (formatted !== roundAndAddComma(this.total) ? formatted : '')
                                //         : formatted;
                                // },
                                // verticalAlign: 'top',
                                // enabled: data.dataLabelsEnabled,
                                // inside: true
                            },
                            events: {
                                legendItemClick: function (targ) {
                                    if (window['mixpanel'] && targ && targ.target && targ.target.name) {
                                        if (targ.target.name.includes('הפקדות') || targ.target.name.includes('משיכות')) {
                                            if (targ.target.name.includes('הפקדות')) {
                                                window['mixpanel'].track('incomes');
                                            }
                                            if (targ.target.name.includes('משיכות')) {
                                                window['mixpanel'].track('outcomes');
                                            }
                                        } else {
                                            window['mixpanel'].track(location.pathname.includes('slika') ? 'one solek view' : 'one card view');
                                        }
                                    }
                                }
                            },
                            states: {
                                inactive: {
                                    opacity: 1
                                },
                                hover: {
                                    enabled: true,
                                    brightness: -0.1
                                }
                            }
                            // point: {
                            //     events: {
                            //         click: function() {
                            //             const chart = this.series.chart as any;
                            //             if (chart.cloneToolTip) {
                            //                 chart.container.firstChild.removeChild(chart.cloneToolTip);
                            //             }
                            //             chart.cloneToolTip = (<any>this.series.chart.tooltip).label.element.cloneNode(true);
                            //             chart.container.firstChild.appendChild(chart.cloneToolTip);
                            //
                            //             if (chart.cloneToolTipContent) {
                            //                 chart.container.removeChild(chart.cloneToolTipContent);
                            //             }
                            //             chart.cloneToolTipContent = Array.prototype.find.call(
                            //                 document
                            //                     .getElementsByClassName('highcharts-label highcharts-tooltip'),
                            //                 (elem) => elem.nodeName === 'DIV')
                            //                 .cloneNode(true);
                            //             // debugger;
                            //             chart.container.appendChild(chart.cloneToolTipContent);
                            //         }
                            //     }
                            // }
                        }
                    },
                    series: data.series
                });
                // console.debug('series: %o, plotOptions: %o',
                //     data.series.length,
                //     (<any>this.chart).options.plotOptions);
            } else if (data.columnWithMinus) {
                this.chartPoints.max = data.max;
                this.chartPoints.start = data.start;
                this.chartPoints.finish = data.finish;

                // if (this.setExtremesInput) {
                //     this.chartPoints.side = 'right';
                //
                //     if (data.data.chart.events) {
                //         data.data.chart.events.load = function () {
                //             setTimeout(() => {
                //                 this.xAxis[0].setExtremes(
                //                     data.max/2,
                //                     data.max-1
                //                 );
                //             }, 2000);
                //         };
                //     } else {
                //         data.data.chart.events = {
                //             load: function () {
                //                 setTimeout(() => {
                //                     this.xAxis[0].setExtremes(
                //                         data.max/2,
                //                         data.max-1
                //                     );
                //                 }, 2000);
                //             }
                //         };
                //     }
                // }
                data['data']['boost'] = {
                    useGPUTranslations: true
                };
                this.chart = new Chart(data.data);
                this.chart.ref$.subscribe((cha) => {
                    this.chartRender = cha;
                });
            } else if (data.pie) {
                if (!this.userService.appData.userData.pieGeneral) {
                    this.userService.appData.userData.pieGeneral = [];
                }
                if (
                    !this.userService.appData.userData.pieGeneral[0] ||
                    this.userService.appData.userData.pieGeneralUpdate === 0
                ) {
                    data['data']['boost'] = {
                        useGPUTranslations: true
                    };
                    this.userService.appData.userData.pieGeneral[0] = new Chart(
                        data.data
                    );
                    this.chart = this.userService.appData.userData.pieGeneral[0];
                    this.userService.appData.userData.pieGeneral[0].ref$.subscribe(
                        (cha) => {
                            this.userService.appData.userData.pieGeneral[0] = cha;
                        }
                    );
                } else {
                    data['data']['boost'] = {
                        useGPUTranslations: true
                    };
                    this.userService.appData.userData.pieGeneral[1] = new Chart(
                        data.data
                    );
                    this.chart = this.userService.appData.userData.pieGeneral[1];
                    this.userService.appData.userData.pieGeneral[1].ref$.subscribe(
                        (cha) => {
                            this.userService.appData.userData.pieGeneral[1] = cha;
                        }
                    );
                }
            } else if (data.asIs) {
                data['data']['boost'] = {
                    useGPUTranslations: true
                };
                this.chart = new Chart(data.data);
            }
        }

        if (this.chart) {
            requestAnimationFrame(() => {
                if (this.chart && this.chart.ref) {
                    this.chart.ref.reflow();
                }
            });
        }

        // requestAnimationFrame(() => {
        //     if (this.chart.ref) {
        //         this.chart.ref.reflow();
        //     }
        // });
    }

    nextPoint(loop) {
        this.loopInter = true;
        if (loop) {
            const subscription = interval(500).subscribe(() => {
                if (
                    this.loopInter === null ||
                    !(
                        this.chartPoints.finish !== 0 &&
                        this.chartPoints.finish < this.chartPoints.max - 1
                    )
                ) {
                    subscription.unsubscribe();
                } else {
                    this.chartPoints.start += 1;
                    this.chartPoints.finish += 1;
                    this.setExtremes(this.chartPoints.start, this.chartPoints.finish);
                }
            });
        } else {
            this.chartPoints.start += 1;
            this.chartPoints.finish += 1;
            this.setExtremes(this.chartPoints.start, this.chartPoints.finish);
        }
    }

    prevPoint(loop) {
        this.loopInterPrev = true;
        if (loop) {
            const subscription = interval(500).subscribe(() => {
                if (this.loopInterPrev === null || this.chartPoints.start === 0) {
                    subscription.unsubscribe();
                } else {
                    this.chartPoints.start -= 1;
                    this.chartPoints.finish -= 1;
                    this.setExtremes(this.chartPoints.start, this.chartPoints.finish);
                }
            });
        } else {
            this.chartPoints.start -= 1;
            this.chartPoints.finish -= 1;
            this.setExtremes(this.chartPoints.start, this.chartPoints.finish);
        }
    }

    mousemovePoint(e) {
        if (
            e.layerX + e.movementX < 0 ||
            e.layerX + e.movementX > e.currentTarget.clientWidth
        ) {
            this.chartPoints.side = false;
        } else {
            if (e.layerX < e.currentTarget.clientWidth / 2) {
                if (this.chartPoints.side !== 'left') {
                    this.chartPoints.side = 'left';
                }
            } else {
                if (this.chartPoints.side !== 'right') {
                    this.chartPoints.side = 'right';
                }
            }
        }
    }

    mouseoutPoint(e) {
        if (
            e.relatedTarget &&
            e.relatedTarget.id &&
            e.relatedTarget.id !== 'prevPoint' &&
            e.relatedTarget.id !== 'nextPoint'
        ) {
            this.chartPoints.side = false;
        }
    }

    clearIntervalAll(event) {
        if (this.loopInterPrev) {
            this.loopInterPrev = null;
        }
        if (this.loopInter) {
            this.loopInter = null;
        }
        if (event.relatedTarget.className.baseVal === undefined) {
            this.chartPoints.side = false;
        }
    }

    setExtremes(start, finish) {
        if (
            this.chartRender &&
            this.chartRender.xAxis &&
            this.chartRender.xAxis.length
        ) {
            this.chartRender.xAxis[0].setExtremes(start, finish);
        }
    }

    updateSeries(data: any, type: string, idx?: any, isLeave?: boolean) {
        const dataArr =
            this.userService.appData.userData.pieGeneral[type === 'green' ? 0 : 1]
                .series[0].data;
        const index = dataArr.findIndex((row) => row.name === idx);
        const thePoint =
            this.userService.appData.userData.pieGeneral[type === 'green' ? 0 : 1]
                .series[0].data[index];
        thePoint.setState(!isLeave ? 'hover' : 'normal');
        // const tooltip = this.userService.appData.userData.pieGeneral[type === 'green' ? 0 : 1].tooltip;
        // if (tooltip) {
        //     // tslint:disable-next-line:max-line-length
        //     //tooltip.refresh([this.userService.appData.userData.pieGeneral[type === 'green' ? 0 : 1].series[0].points[index]]);
        // }
    }

    updateDataSeries(data: any, type: string, title?: any) {
        if (type === 'green') {
            this.userService.appData.userData.pieGeneral[0].setTitle({text: title});
            this.userService.appData.userData.pieGeneral[0].series[0].update({
                type: 'pie',
                data: data
            });
        } else {
            this.userService.appData.userData.pieGeneral[1].setTitle({text: title});
            this.userService.appData.userData.pieGeneral[1].series[0].update({
                type: 'pie',
                data: data
            });
        }
    }

    getFormatDatesX(date: any[], isDaily?: any) {
        const datesAll: any[] = [];
        const monthNames = this.translate.instant(
            'langCalendar.' +
            (!isDaily && date.length > 24 ? 'monthNamesShort' : 'monthNames')
        ) as string[];

        if (isDaily === undefined || !isDaily) {
            date.forEach((dateNum) => {
                const thisDate = new Date(dateNum);
                datesAll.push(
                    `<strong>${
                        date.length < 25
                            ? monthNames[thisDate.getMonth()]
                            : thisDate.getMonth() + 1
                    }</strong> ${
                        date.length < 25 || thisDate.getMonth() === 0
                            ? thisDate.getFullYear()
                            : ''
                    }`
                );
            });
        } else {
            date.forEach((dateNum) => {
                const thisDate = new Date(dateNum);
                let titleMonthYear = '';
                if (
                    Array.isArray(isDaily) &&
                    isDaily.some(
                        (day) =>
                            Math.abs(
                                Math.round((day - thisDate.getTime()) / (1000 * 60 * 60 * 24))
                            ) === 0
                    )
                ) {
                    // tslint:disable-next-line:max-line-length
                    titleMonthYear = `<br><b style="margin-top:10px; font-size:16px; font-weight:bold; display: block;white-space: nowrap; color: #0f3860;">${
                        monthNames[thisDate.getMonth()]
                    } ${thisDate.getFullYear()}</b>`;
                }
                datesAll.push(
                    `<strong style="direction: rtl;">${thisDate.getDate()}</strong>${titleMonthYear}`
                );
            });
        }

        return datesAll;
    }

    goToFinancialManagementBankAccountDetailsComponent(filtersParams: any) {
        if (window['mixpanel']) {
            if (filtersParams[3]) {
                window['mixpanel'].track('all deposits');
            } else {
                window['mixpanel'].track('all transes');
            }
        }
        console.log(
            'goToFinancialManagementBankAccountDetailsComponent: filtersParams => %o',
            filtersParams
        );
        this.storageService.sessionStorageSetter(
            'details-filterAcc',
            JSON.stringify(
                this.userService.appData.userData.accountSelect.map(
                    (id) => id.companyAccountId
                )
            )
        );
        this.storageService.sessionStorageSetter(
            'details-filterTypesVal',
            filtersParams[0]
        );

        this.storageService.sessionStorageSetter(
            DateRangeSelectorBaseComponent.storageKey(this.route, 'details'),
            JSON.stringify(
                filtersParams[2] === true
                    ? CustomPreset.createDatesPreset(filtersParams[1])
                    : CustomPreset.createMonthsPreset(
                        new Date(filtersParams[1]).getMonth(),
                        new Date(filtersParams[1]).getFullYear()
                    )
            )
        );
        // this.storageService.sessionStorageSetter(AccountDatesComponent.storageKey(this.route, 'details'),
        //     JSON.stringify(
        //         filtersParams[2] === true
        //             ? {
        //                 selectedValue: '2',
        //                 dates: {
        //                     calendarFrom: filtersParams[1],
        //                     calendarUntil: filtersParams[1]
        //                 }
        //             }
        //             : {
        //                 selectedValue: '1',
        //                 dates: {
        //                     untilValue: 1,
        //                     selectedValueFromYear: new Date(filtersParams[1]).getFullYear(),
        //                     selectedValueUntilYear: new Date(filtersParams[1]).getFullYear(),
        //                     selectedValueFromMonth: new Date(filtersParams[1]).getMonth(),
        //                     selectedValueUntilMonth: new Date(filtersParams[1]).getMonth()
        //                 }
        //             })
        // );

        this.router.navigate(['../details'], {
            queryParamsHandling: 'preserve',
            relativeTo: this.route
        });
    }
}


// (function(Highcharts) {
//     Highcharts.Renderer.prototype.symbols.callout = function(x, y, w, h, options) {
//         var arrowLength = 6,
//             halfDistance = 6,
//             r = Math.min((options && options.r) || 0, w, h),
//             safeDistance = r + halfDistance,
//             anchorX = options && options.anchorX,
//             anchorY = options && options.anchorY,
//             path;
//
//         path = [
//             'M', x + r, y,
//             'L', x + w - r, y, // top side
//             'C', x + w, y, x + w, y, x + w, y + r, // top-right corner
//             'L', x + w, y + h - r, // right side
//             'C', x + w, y + h, x + w, y + h, x + w - r, y + h, // bottom-right corner
//             'L', x + r, y + h, // bottom side
//             'C', x, y + h, x, y + h, x, y + h - r, // bottom-left corner
//             'L', x, y + r, // left side
//             'C', x, y, x, y, x + r, y // top-right corner
//         ];
//
//         path.splice(23, 3,
//             'L', w / 2 + halfDistance, y + h,
//             w / 2, y + h + arrowLength,
//             w / 2 - halfDistance, y + h,
//             x + r, y + h
//         );
//
//         return path;
//     };
// }(Highcharts));
