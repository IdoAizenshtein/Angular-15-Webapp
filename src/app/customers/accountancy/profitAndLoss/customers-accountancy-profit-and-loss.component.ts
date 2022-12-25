import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { UserService } from '../../../core/user.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  take
} from 'rxjs/operators';
import { AccountDatesComponent } from '@app/shared/component/account-dates/account-dates.component';
import { slideInOut } from '@app/shared/animations/slideInOut';
import { ReportService } from '../../../core/report.service';
import { ReloadServices } from '@app/shared/services/reload.services';

@Component({
  templateUrl: './customers-accountancy-profit-and-loss.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  animations: [slideInOut]
})
export class CustomersAccountancyProfitAndLossComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  public subscription: Subscription;
  public showPanelDD = false;
  public trialBalanceArr: any;
  public trialBalance: any;
  public loader = false;
  public indexOpenedRows: any[] = [];
  public collapseOpenVal = false;
  public showValues = false;
  public customAlert = false;
  public filterInput = new FormControl();
  public queryString = '';
  public cartis_code_getlist: any = [
    {
      description: 'לקוחות',
      target_supplier_type_id: 1300,
      ind_expense: -1
    },
    {
      description: 'הכנסה',
      target_supplier_type_id: 1000,
      ind_expense: 0
    },
    {
      description: 'הוצאות הנהלה וכלליות',
      target_supplier_type_id: 1011,
      ind_expense: 1
    },
    {
      description: 'ספקים',
      target_supplier_type_id: 1400,
      ind_expense: -1
    },
    {
      description: 'קופה',
      target_supplier_type_id: 1800,
      ind_expense: -1
    },
    {
      description: 'הוצאות מימון',
      target_supplier_type_id: 1033,
      ind_expense: 1
    },
    {
      description: 'עלות המכירות',
      target_supplier_type_id: 1022,
      ind_expense: 1
    },
    {
      description: 'בנק',
      target_supplier_type_id: 1700,
      ind_expense: -1
    },
    {
      description: 'הפרשי מלאי',
      target_supplier_type_id: 1023,
      ind_expense: 1
    },
    {
      description: 'מאזני',
      target_supplier_type_id: 1500,
      ind_expense: -1
    }
  ];
  @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;
  public parameters: any = {
    dateFrom: '',
    dateTill: ''
  };
  public valueRadioPrev = 'yes';
  public radioGroupChangePre = 'radio1';
  public stockEnterance: number;
  public stockExit: number;
  public stockEnterancePrev: number;
  public stockExitPrev: number;
  public revahHefsed: any;
  public revahHefsedArr: any;
  public selectRevah: any = [];
  public selectRevahSet: any;
  public chartData: any;

  reportMailSubmitterToggle = false;

  constructor(
    public translate: TranslateService,
    public override sharedComponent: SharedComponent,
    public userService: UserService,
    private sharedService: SharedService,
    private reportService: ReportService
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
        this.collapseOpenVal = true;
        this.customAlert = false;
        this.filtersAll();
      });
  }
  override reload() {
    console.log('reload child');
    this.loadData();
  }
  ngOnInit(): void {
    if (this.userService.appData.userData.companies) {
      requestAnimationFrame(() => this.loadData());
      // this.loadData();
    } else {
      this.subscription = this.sharedComponent.getDataEvent.subscribe(() =>
        this.loadData()
      );
    }
  }

  loadData() {
    if (
      !this.userService.appData.userData.companySelect.privs.includes(
        'ANHALATHESHBONOT'
      )
    ) {
      this.userService.appData.userData.companySelect.example = true;
    }

    this.childDates.filter('profitAndLoss');
    this.filterDates(this.childDates.selectedPeriod);
  }

  filterDates(paramDate: any): void {
    this.loader = true;
    this.parameters.dateFrom = paramDate.fromDate;
    this.parameters.dateTill = paramDate.toDate;
    this.getRevachHefsed();
  }

  getRevachHefsed() {
    this.loader = true;
    let stockEnterance = 0,
      stockExit = 0,
      stockEnterancePrev = 0,
      stockExitPrev = 0;
    if (this.stockEnterance) {
      stockEnterance = parseInt(this.stockEnterance.toString(), 10);
    }
    if (this.stockExit) {
      stockExit = parseInt(this.stockExit.toString(), 10);
    }
    if (this.stockEnterancePrev) {
      stockEnterancePrev = parseInt(this.stockEnterancePrev.toString(), 10);
    }
    if (this.stockExitPrev) {
      stockExitPrev = parseInt(this.stockExitPrev.toString(), 10);
    }
    this.sharedService
      .getRevachHefsed({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.parameters.dateFrom.toISOString(),
        dateTill: this.parameters.dateTill.toISOString(),
        prevYear: 1,
        stockEnterance: stockEnterance,
        stockEnterancePrev: stockEnterancePrev,
        stockExit: stockExit,
        stockExitPrev: stockExitPrev
      })
      .subscribe(
        (response:any) => {
          this.revahHefsedArr = response ? response['body'] : response;
          this.revahHefsed = JSON.parse(JSON.stringify(this.revahHefsedArr));
          if (this.revahHefsed.data.length) {
            this.selectRevah = [];
            this.revahHefsed.data.forEach((a, index) => {
              if (index % 2 === 0) {
                const obj = {
                  val: index,
                  name: a.title
                };
                this.selectRevah.push(obj);
              }
              if (a.data) {
                a.rowZero = a.data[0].sum === 0;
              }
              if (a.smallData) {
                a.rowZero = a.smallData[0].sum === 0;
              }
              a.rowsAsList.forEach((v, ind) => {
                if (v.data) {
                  v.rowZero = v.data[0].sum === 0;
                }
                if (v.smallData) {
                  v.rowZero = v.smallData[0].sum === 0;
                }
                v.rowsAsList.forEach((c) => {
                  if (c.data) {
                    c.rowZero = c.data[0].sum === 0;
                  }
                  if (c.smallData) {
                    c.rowZero = c.smallData[0].sum === 0;
                  }
                });
              });
            });
            this.selectRevahSet = this.selectRevah[0];
            this.setGraph();
          }

          this.loader = false;
        },
        (err: HttpErrorResponse) => {}
      );
  }

  resetArr() {
    this.valueRadioPrev = this.valueRadioPrev === 'yes' ? 'no' : 'yes';

    this.revahHefsed = JSON.parse(JSON.stringify(this.revahHefsedArr));
    if (this.revahHefsed.data.length) {
      this.revahHefsed.data.forEach((a, index) => {
        if (a.data) {
          a.rowZero = a.data[0].sum === 0;
        }
        if (a.smallData) {
          a.rowZero = a.smallData[0].sum === 0;
        }
        a.rowsAsList.forEach((v, ind) => {
          if (v.data) {
            v.rowZero = v.data[0].sum === 0;
          }
          if (v.smallData) {
            v.rowZero = v.smallData[0].sum === 0;
          }
          v.rowsAsList.forEach((c) => {
            if (c.data) {
              c.rowZero = c.data[0].sum === 0;
            }
            if (c.smallData) {
              c.rowZero = c.smallData[0].sum === 0;
            }
          });
        });
      });
      this.setGraph();
    }
  }

  setGraph() {
    const ind = this.selectRevahSet.val;
    const tooltipThisYear = [],
      tooltipPrevYear = [];
    const graph = JSON.parse(JSON.stringify(this.revahHefsed));
    const monthNames = this.translate.instant(
      'langCalendar.' +
        (graph.dates.length > 24 ? 'monthNamesShort' : 'monthNames')
    ) as string[];
    // tslint:disable-next-line:max-line-length radix
    const month = graph.dates.map(
      (dates) =>
        `<strong>${
          monthNames[parseInt(dates.toString().substring(4, 6)) - 1]
        }</strong> ${dates.toString().substring(0, 4)}`
    );
    const sumThisYear = graph.data[ind].data
      .filter((a) => a.summary === false)
      .map((b) => b.sum);
    const sumPrevYear = graph.data[ind + 1].smallData
      .filter((a) => a.summary === false)
      .map((b) => b.sum);

    let tooltipThisYearSlice = [];
    if (graph.data[ind].rowsAsList.length) {
      const wrapArr = [];
      let i = 0;
      while (i < graph.data[ind].rowsAsList[0].data.length - 1) {
        graph.data[ind].rowsAsList.forEach((a) => {
          if (this.valueRadioPrev === 'yes') {
            const objects = {
              name: a.title,
              Val: a.data[i + 1].sum
            };
            wrapArr.push(objects);
          } else {
            if (!a.rowZero) {
              const objects = {
                name: a.title,
                Val: a.data[i + 1].sum
              };
              wrapArr.push(objects);
            }
          }
        });
        i++;
      }

      let indx = 0;
      wrapArr.forEach((v, index) => {
        indx++;
        tooltipThisYearSlice.push(v);
        if (indx === graph.data[ind].rowsAsList.length) {
          tooltipThisYear.push(tooltipThisYearSlice);
          indx = 0;
          tooltipThisYearSlice = [];
        }
      });
    }

    let tooltipThisPrevSlice = [];
    if (graph.data[ind].rowsAsList.length) {
      const wrapArr1 = [];

      let i1 = 0;
      while (i1 < graph.data[ind].rowsAsList[0].data.length - 1) {
        graph.data[ind + 1].rowsAsList.forEach((a) => {
          const objects = {
            name: a.title,
            Val: a.smallData[i1 + 1].sum
          };
          wrapArr1.push(objects);
        });
        i1++;
      }
      let indx1 = 0;
      wrapArr1.forEach((v, index) => {
        indx1++;
        tooltipThisPrevSlice.push(v);
        if (indx1 === graph.data[ind].rowsAsList.length) {
          tooltipPrevYear.push(tooltipThisPrevSlice);
          indx1 = 0;
          tooltipThisPrevSlice = [];
        }
      });
    }

    let chart;
    if (this.valueRadioPrev === 'yes') {
      chart = [
        {
          cursor: 'pointer',
          name: graph.data[ind].title,
          lineWidth: 2,
          color: '#0f3860',
          states: {
            hover: {
              lineWidth: 2,
              color: '#0f3860'
            }
          },
          marker: {
            symbol: 'circle'
          },
          data: sumThisYear
        },
        {
          cursor: 'pointer',
          name: graph.data[ind + 1].title + ' אשתקד',
          lineWidth: 2,
          color: '#6eb1ff',
          states: {
            hover: {
              lineWidth: 2,
              color: '#6eb1ff'
            }
          },
          marker: {
            symbol: 'circle'
          },
          data: sumPrevYear
        }
      ];
    } else {
      chart = [
        {
          cursor: 'pointer',
          name: graph.data[ind].title,
          lineWidth: 2,
          color: '#0f3860',
          states: {
            hover: {
              lineWidth: 2,
              color: '#0f3860'
            }
          },
          marker: {
            symbol: 'circle'
          },
          data: sumThisYear
        }
      ];
    }

    this.chartData = {
      maxY: null,
      lineProfitAndLoss: true,
      dataLabelsEnabled: true,
      gridLineWidth: 1,
      markerEnabled: true,
      crosshair: false,
      xAxiscategories: month,
      tooltipsArr: [tooltipThisYear, tooltipPrevYear],
      series: chart
    };
  }

  parseIntNum(num: string): number {
    return parseInt(num, 10);
  }

  setIndexRowCollapse(opened, idx): void {
    if (opened) {
      this.indexOpenedRows.push(idx);
    } else {
      const getIdx = this.indexOpenedRows.findIndex((element) => {
        return element === idx;
      });
      if (getIdx > -1) {
        this.indexOpenedRows.splice(getIdx, 1);
      }
    }
  }

  collapseOpen(open: boolean): void {
    this.collapseOpenVal = open;
    this.customAlert = false;

    this.trialBalance.forEach((parent, idx, arr) => {
      arr[idx].opened = open;

      if (!open) {
        arr[idx].tableShow = true;
        arr[idx].level_1.level_2.forEach((a) => {
          a.opened = true;
        });
      }
    });
  }

  showAccountsDeleted() {}

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.destroy();
  }

  filtersAll() {
    this.trialBalance = JSON.parse(JSON.stringify(this.trialBalanceArr));
    this.trialBalance = this.filterArr(this.trialBalance, this.queryString);
    this.loader = false;
  }

  filterArr(input, term) {
    if (!input || !term) {
      return input;
    }
    const filteredArr = [];
    input.forEach((v) => {
      const filtered = [];
      v.level_1.level_2.forEach((v1) => {
        if (
          v1.name.toString().indexOf(term) > -1 ||
          (v1.number !== undefined &&
            v1.number.toString().indexOf(term) > -1) ||
          (v1.sum !== undefined && v1.sum.toString().indexOf(term) > -1) ||
          (v1.percentage !== undefined &&
            v1.percentage.toString().indexOf(term) > -1) ||
          (v1.target_supp_desc !== undefined &&
            v1.target_supp_desc.toString().indexOf(term) > -1) ||
          (v1.alert !== undefined && v1.alert.toString().indexOf(term) > -1) ||
          (v1.current_balance !== undefined &&
            v1.current_balance.toString().indexOf(term) > -1)
        ) {
          v1.opened = true;
          filtered.push(v1);
        }
      });
      if (filtered.length > 0) {
        v.tableShow = true;
        v.opened = true;
        v.level_1.level_2 = filtered;
        filteredArr.push(v);
      }
    });
    return filteredArr;
  }

  openRowsButtonAlerts() {
    this.customAlert = !this.customAlert;
    if (this.customAlert === true) {
      this.trialBalance.forEach((v) => {
        let rowShow = false;
        v.tableShow = v.level_1.alert_ind;
        v.level_1.level_2.forEach((a) => {
          if (a.alert_text) {
            rowShow = true;
            a.opened = true;
          } else {
            a.opened = false;
          }
        });
        v.opened = rowShow;
      });
    } else {
      this.trialBalance.forEach((v) => {
        v.opened = false;
        v.tableShow = true;
        v.level_1.level_2.forEach((a) => {
          a.opened = true;
        });
      });
    }
  }

  supplierUpdateType(v) {
    if (!v.targetEdit) {
      this.sharedService
        .supplierUpdateType({
          companyCustomerId: v.id,
          companyId:
            this.userService.appData.userData.companySelect.example &&
            !this.userService.appData.userData.companySelect
              .METZALEM_deskTrialExpired
              ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
              : this.userService.appData.userData.companySelect.companyId,
          userTargetSupplierTypeId:
            v.selectItems.target_supplier_type_id.toString()
        })
        .subscribe(
          (response:any) => {
            this.trialBalance.forEach((v) => {
              v.level_1.level_2.forEach((a) => {
                if (v.id === a.id) {
                  a.target_supp_desc = a.selectItems.description;
                }
              });
            });
          },
          (err: HttpErrorResponse) => {}
        );
    }
  }

  onCloseDD() {}

  exportTransactions(resultFileType: string): void {
    // debugger;
    this.reportService
      .getReport(
        'PROFIT_LOSS',
        this.reportParamsFromCurrentView(resultFileType),
        resultFileType,
        this.reportService.prepareFilename(...this.getFilename())
      )
      .pipe(take(1))
      .subscribe(() => {});
  }

  private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
    // debugger;
    return {
      additionalProperties: {
        reportDays: this.childDates.asText(),
        totalLoss: this.revahHefsed.summary.sum,
        cyclePercentage:
          this.revahHefsed &&
          this.revahHefsed.data &&
          this.revahHefsed.data.length > 2 &&
          this.revahHefsed.data[this.revahHefsed.data.length - 2].data &&
          this.revahHefsed.data[this.revahHefsed.data.length - 2].data.length &&
          this.revahHefsed.data[this.revahHefsed.data.length - 2].data[0]
            .hacnasotCurrPrcVal !== null
            ? this.revahHefsed.data[this.revahHefsed.data.length - 2].data[0]
                .hacnasotCurrPrcVal
            : null,
        lastCycleDiff:
          this.revahHefsed &&
          this.revahHefsed.data &&
          this.revahHefsed.data.length > 2 &&
          this.revahHefsed.data[this.revahHefsed.data.length - 2].data &&
          this.revahHefsed.data[this.revahHefsed.data.length - 2].data.length &&
          this.revahHefsed.data[this.revahHefsed.data.length - 2].data[0]
            .hacnasotCurrPrcVal !== null &&
          this.revahHefsed.data[this.revahHefsed.data.length - 1].smallData &&
          this.revahHefsed.data[this.revahHefsed.data.length - 1].smallData
            .length &&
          this.revahHefsed.data[this.revahHefsed.data.length - 1].smallData[0]
            .hacnasotCurrPrcVal !== null
            ? this.revahHefsed.data[this.revahHefsed.data.length - 2].data[0]
                .hacnasotCurrPrcVal -
              this.revahHefsed.data[this.revahHefsed.data.length - 1]
                .smallData[0].hacnasotCurrPrcVal
            : null,
        lastCycleLoss: this.revahHefsed.summary.prevNum,
        includeLastYearPercent: this.radioGroupChangePre === 'radio2',
        onlyPercentage: this.radioGroupChangePre === 'radio3',
        compareLastYear: this.valueRadioPrev === 'yes'
      },
      data: {
        report: this.revahHefsed
      }
    };
  }

  private getFilename() {
    return [
      this.translate.instant('menu.customers.accountancy.profitAndLoss'),
      this.childDates.asText(),
      this.userService.appData.userData.companySelect.example &&
      !this.userService.appData.userData.companySelect.METZALEM_deskTrialExpired
        ? 'חברה לדוגמא'
        : this.userService.appData.userData.companySelect.companyName
    ];
  }

  sendTransactions(mailAddress: string): void {
    const request = this.reportParamsFromCurrentView();
    Object.assign(request.additionalProperties, {
      mailTo: mailAddress,
      screenName: this.getFilename().join(' ')
    });
    this.reportService
      .emailReport('PROFIT_LOSS', request)
      .pipe(take(1))
      .subscribe((rslt) => {
        this.reportMailSubmitterToggle = false;
      });
  }
}
