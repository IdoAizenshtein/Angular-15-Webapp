import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {UserService} from '../../../core/user.service';
import {TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {FormControl} from '@angular/forms';
import {debounceTime, distinctUntilChanged, filter} from 'rxjs/operators';
import {AccountDatesComponent} from '@app/shared/component/account-dates/account-dates.component';
import {slideInOut} from '@app/shared/animations/slideInOut';
import {ReloadServices} from '@app/shared/services/reload.services';

@Component({
  templateUrl: './customers-accountancy-book-keeping-analyze.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  animations: [slideInOut]
})
export class CustomersAccountancyBookKeepingAnalyzeComponent
  extends ReloadServices
  implements OnInit, OnDestroy {
  public subscription: Subscription;
  public targetTab: any = '1011';
  public showPanelDD = false;
  public trialBalanceArr: any;
  public trialBalance: any;
  public loader: boolean = false;
  public indexOpenedRows: any[] = [];
  public collapseOpenVal = false;
  public showValues = false;
  public customAlert: boolean = false;
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
  public valueRadioPrev: string = 'yes';
  public radioGroupChangePre: string = 'radio1';
  public stockEnterance: number;
  public stockExit: number;
  public stockEnterancePrev: number;
  public stockExitPrev: number;
  public revahHefsed: any;
  public revahHefsedArr: any;
  public selectRevah: any = [];
  public selectRevahSet: any;
  public chartData: any;
  public transCodes = '';
  public sortCodes = '';
  public analysis: any = [];
  public listAnalisis;
  public selectCodeSort: any = [];
  public selectName: any = 'כל קודי המיון';
  public selectCodeSortId;
  public selectTrans;
  public dataSelectTrans;
  public selectTransId;
  public analysisDates: boolean = false;
  public loadGraphThis: boolean = false;

  public dataGraph = [];
  public dateX = [];
  public points = [];
  public points1 = [];
  public sumThis = 0;
  public sumPrev = 0;
  public precentThisYears = 0;
  public precentPrevYear = 0;
  public precentTotal: any = '-';
  public precentTotalClass = '';
  public chartDataGr: boolean = false;
  public sumPrecent;

  constructor(
    public translate: TranslateService,
    public override sharedComponent: SharedComponent,
    public userService: UserService,
    private sharedService: SharedService
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
    this.loader = true;
    this.loadData();
  }

  ngOnInit(): void {
    this.loader = true;
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
    this.loader = true;
    if (
      !this.userService.appData.userData.companySelect.privs.includes(
        'ANHALATHESHBONOT'
      )
    ) {
      this.userService.appData.userData.companySelect.example = true;
    }

    this.childDates.filter('bookKeepingAnalyze');
    this.filterDates(this.childDates.selectedPeriod);
  }

  filterDates(paramDate: any): void {
    this.loader = true;
    this.parameters.dateFrom = this.userService.appData
      .moment(paramDate.fromDate)
      .startOf('month')
      .valueOf();
    this.parameters.dateTill = this.userService.appData
      .moment(paramDate.toDate)
      .endOf('month')
      .valueOf();
    this.graphBookKeeping();
  }

  loadPageAnalisis(targetTab: string, loadOnlyGraph?: any) {
    this.targetTab = targetTab;
    this.graphBookKeeping(loadOnlyGraph);
  }

  nameTabs(num) {
    const nums = num.toString();
    switch (nums) {
      case '1000':
        return 'הכנסות';
      case '1022':
        return 'עלות המכירות';
      case 'golmi':
        return 'רווח גולמי';
      case '1011':
        return 'הוצאות הנהלה וכלליות';
      case '1033':
        return 'הוצאות מימון';
      case 'naki':
        return 'רווח נקי';
      default:
        return '';
    }
  }

  graphBookKeeping(loadOnlyGraph?: any) {
    this.loader = true;
    if (!loadOnlyGraph) {
      this.selectName = 'כל קודי המיון';
    }
    let ws;
    if (this.targetTab === 'golmi') {
      ws = this.sharedService.grossProfitBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.parameters.dateFrom,
        dateTill: this.parameters.dateTill,
        targetType: this.targetTab
      });
    } else if (this.targetTab === 'naki') {
      ws = this.sharedService.netProfitBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.parameters.dateFrom,
        dateTill: this.parameters.dateTill,
        targetType: this.targetTab
      });
    } else {
      ws = this.sharedService.graphBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.parameters.dateFrom,
        dateTill: this.parameters.dateTill,
        sortCodeId: this.sortCodes || null,
        targetType: this.targetTab,
        transTypeCatId: this.transCodes || null
      });
    }
    ws.subscribe(
      (response: any) => {
        this.analysis = [response ? response['body'] : response];
        this.importGraph();
        if (loadOnlyGraph) {
          this.graphBookKeepingPrev();
        } else {
          this.getAnalisisList();
        }
      },
      (err: HttpErrorResponse) => {
      }
    );
  }

  graphBookKeepingPrev() {
    // const dateFromPrev = new Date(this.parameters.dateFrom);
    // const dateTillPrev = new Date(this.parameters.dateTill);

    let ws;
    if (this.targetTab === 'golmi') {
      ws = this.sharedService.grossProfitBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.userService.appData
          .moment(this.parameters.dateFrom)
          .subtract(1, 'years')
          .valueOf(),
        // new Date(dateFromPrev.getFullYear() - 1, dateFromPrev.getMonth(), dateFromPrev.getDate()).toISOString(),
        dateTill: this.userService.appData
          .moment(this.parameters.dateTill)
          .subtract(1, 'years')
          .valueOf(),
        // new Date(dateTillPrev.getFullYear() - 1, dateTillPrev.getMonth(), dateTillPrev.getDate()).toISOString(),
        targetType: this.targetTab
      });
    } else if (this.targetTab === 'naki') {
      ws = this.sharedService.netProfitBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.userService.appData
          .moment(this.parameters.dateFrom)
          .subtract(1, 'years')
          .valueOf(),
        // new Date(dateFromPrev.getFullYear() - 1, dateFromPrev.getMonth(), dateFromPrev.getDate()).toISOString(),
        dateTill: this.userService.appData
          .moment(this.parameters.dateTill)
          .subtract(1, 'years')
          .valueOf(),
        // new Date(dateTillPrev.getFullYear() - 1, dateTillPrev.getMonth(), dateTillPrev.getDate()).toISOString(),
        targetType: this.targetTab
      });
    } else {
      ws = this.sharedService.graphBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.userService.appData
          .moment(this.parameters.dateFrom)
          .subtract(1, 'years')
          .valueOf(),
        // new Date(dateFromPrev.getFullYear() - 1, dateFromPrev.getMonth(), dateFromPrev.getDate()).toISOString(),
        dateTill: this.userService.appData
          .moment(this.parameters.dateTill)
          .subtract(1, 'years')
          .valueOf(),
        // new Date(dateTillPrev.getFullYear() - 1, dateTillPrev.getMonth(), dateTillPrev.getDate()).toISOString(),
        sortCodeId: this.sortCodes || null,
        targetType: this.targetTab,
        transTypeCatId: this.transCodes || null
      });
    }
    ws.subscribe(
      (response: any) => {
        this.loader = false;
        this.analysis.push(response ? response['body'] : response);
        this.importGraph();
      },
      (err: HttpErrorResponse) => {
      }
    );
  }

  getAnalisisList() {
    if (['naki', 'golmi'].includes(this.targetTab)) {
      this.graphBookKeepingPrev();
      return;
    }
    // const dateFromPrev = new Date(this.parameters.dateFrom);
    // const dateTillPrev = new Date(this.parameters.dateTill);

    this.sharedService
      .aggregateBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.parameters.dateFrom,
        dateTill: this.parameters.dateTill,
        prevFrom: this.userService.appData
          .moment(this.parameters.dateFrom)
          .subtract(1, 'years')
          .valueOf(),
        //  new Date(dateFromPrev.getFullYear() - 1, dateFromPrev.getMonth(), dateFromPrev.getDate()).toISOString(),
        prevTill: this.userService.appData
          .moment(this.parameters.dateTill)
          .subtract(1, 'years')
          .valueOf(),
        // new Date(dateTillPrev.getFullYear() - 1, dateTillPrev.getMonth(), dateTillPrev.getDate()).toISOString(),
        targetTab: [this.targetTab]
      })
      .subscribe(
        (response: any) => {
          this.graphBookKeepingPrev();
          this.listAnalisis = response ? response['body'] : response;
          this.listAnalisis.forEach((v, index) => {
            v.rowshow = false;
          });
          if (this.listAnalisis.length > 1) {
            this.selectCodeSort = [
              {
                name: 'כל קודי המיון',
                id: 'null',
                idx: 'all'
              }
            ];
            this.listAnalisis.forEach((v, index) => {
              const optionCode = {
                name: v.level_1.number + ' - ' + v.level_1.name,
                id: v.level_1.id,
                idx: index
              };
              this.selectCodeSort.push(optionCode);
            });
          } else {
            this.selectCodeSort = [];
            if (this.listAnalisis.length === 1) {
              this.listAnalisis.forEach((v, index) => {
                let optionCode;
                if (v.level_1.name) {
                  optionCode = {
                    name: v.level_1.number + ' - ' + v.level_1.name,
                    id: v.level_1.id,
                    idx: index
                  };
                } else {
                  optionCode = {
                    name: this.nameTabs(this.targetTab),
                    id: v.level_1.id,
                    idx: index
                  };
                  this.selectName = this.nameTabs(this.targetTab);
                }
                this.selectCodeSort.push(optionCode);
              });
            }
          }

          if (!this.analysisDates) {
            this.selectCodeSortId = this.selectCodeSort[0];
            this.selectedInitTrans();
          } else {
            if (this.sortCodes !== '') {
              let indx = '';
              let indSelect = 0;
              if (this.selectCodeSort.length > 1) {
                indSelect = 1;
              }
              this.selectCodeSort.forEach((v) => {
                if (v.id === this.sortCodes) {
                  indx = v.idx + indSelect;
                }
              });
              this.selectCodeSortId = this.selectCodeSort[indx];
              this.selectedInitTrans();
            } else {
              if (this.listAnalisis.length !== 1 && this.transCodes !== '') {
                let dataLevel1 = '';
                let dataLevel2 = '';
                let ind = '';
                let ind2 = '';
                this.listAnalisis.forEach((v, index) => {
                  dataLevel1 = v.level_1.id;
                  ind = index + 1;

                  v.level_1.level_2.forEach((a: any) => {
                    if (a.id === this.transCodes) {
                      dataLevel2 = dataLevel1;
                      ind2 = ind;
                      return;
                    }
                  });
                });
                this.selectCodeSortId = this.selectCodeSort[ind2];
                this.selectedInitTrans(dataLevel2);
              } else {
                if (this.transCodes !== '') {
                  let ind = '';
                  const indexTrans = this.listAnalisis[0].level_1.level_2.findIndex((v) => v.id === this.transCodes);
                  if (indexTrans !== undefined && indexTrans !== -1) {
                    ind = indexTrans + 1;
                  }
                  this.selectCodeSortId = this.selectCodeSort[0];
                  this.selectedInitTrans(this.listAnalisis[0].level_1.id);
                } else {
                  this.selectCodeSortId = this.selectCodeSort[0];
                  this.selectedInitTrans();
                }
              }
            }
            setTimeout(() => {
              this.loadGraphThis = true;
            }, 100);
          }
        },
        (err: HttpErrorResponse) => {
        }
      );
  }

  getDayMonthGraph(dates) {
    if (dates === 'שם חברה' || dates === 'סה״כ') {
      return dates;
    }
    let x;
    const date = dates.toString().substr(4, 2);
    switch (date) {
      case '01':
        x = "ינו'";
        break;
      case '02':
        x = "פבר'";
        break;
      case '03':
        x = 'מרץ';
        break;
      case '04':
        x = "אפר'";
        break;
      case '05':
        x = 'מאי';
        break;
      case '06':
        x = "יונ'";
        break;
      case '07':
        x = "יול'";
        break;
      case '08':
        x = "אוג'";
        break;
      case '09':
        x = 'ספט׳';
        break;
      case '10':
        x = "אוק'";
        break;
      case '11':
        x = "נוב'";
        break;
      case '12':
        x = "דצמ'";
        break;
    }

    return x + ' ' + dates.toString().substr(0, 4);
  }

  importGraph() {
    this.dataGraph = [];
    this.dateX = [];
    this.points = [];
    this.points1 = [];
    this.sumThis = 0;
    this.sumPrev = 0;
    this.precentThisYears = 0;
    this.precentPrevYear = 0;
    let precentThisYears = 0;
    let precentPrevYear = 0;
    const tooltipThisYear = [],
      tooltipPrevYear = [];
    let chart = [];
    if (
      this.analysis[0].line_graph.length > 0 ||
      this.analysis[1].line_graph.length > 0
    ) {
      this.chartDataGr = true;
      if (this.analysis[0].line_graph.length > 0) {
        this.dateX = this.analysis[0].line_graph.map(
          (dates) =>
            `<strong>${
              this.translate.translations[this.translate.currentLang].months[
              this.parseIntNum(dates.date_month.toString().substring(4, 6)) -
              1
                ]
            }</strong> ${dates.date_month.toString().substring(0, 4)}`
        );

        this.analysis[0].line_graph.forEach((v) => {
          const tooltips = [];
          if (v.tooltip.length !== 0) {
            v.tooltip.forEach((a, ind) => {
              const tool_content = {
                name: a.name,
                Val: a.total
              };
              tooltips.push(tool_content);
            });
            precentThisYears += v.tooltip[0].total;
          }
          tooltipThisYear.push(tooltips);
          this.sumThis += Number(v.sum);
        });
        chart.push({
          cursor: 'pointer',
          name: this.analysis[0].year,
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
          data: this.analysis[0].line_graph.map((b) => Number(b.sum))
        });

        if (this.sumThis !== 0 && precentThisYears !== 0) {
          const precentYears = (this.sumThis / precentThisYears) * 100;
          this.precentThisYears = Math.round(precentYears);
        }
      }
      if (this.analysis[1] && this.analysis[1].line_graph.length > 0) {
        this.analysis[1].line_graph.forEach((v) => {
          const tooltips = [];
          if (v.tooltip.length !== 0) {
            v.tooltip.forEach((a) => {
              const tool_content = {
                name: a.name,
                Val: a.total
              };
              tooltips.push(tool_content);
            });
            precentPrevYear += v.tooltip[0].total;
          }
          tooltipPrevYear.push(tooltips);
          this.sumPrev += Number(v.sum);
        });
        chart.push({
          cursor: 'pointer',
          name: this.analysis[1].year,
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
          data: this.analysis[1].line_graph.map((b) => Number(b.sum))
        });
        if (this.sumPrev !== 0 && precentPrevYear !== 0) {
          const precentPrevYears = (this.sumPrev / precentPrevYear) * 100;
          this.precentPrevYear = Math.round(precentPrevYears);
        }
      } else {
        const name = this.userService.appData
          .moment(this.parameters.dateFrom)
          .subtract(1, 'years')
          .get('year');
        // new Date(new Date(this.parameters.dateFrom).getFullYear() - 1, new Date(this.parameters.dateFrom).getMonth(), new Date(this.parameters.dateFrom).getDate()).getFullYear();
        chart.push({
          cursor: 'pointer',
          name: name,
          lineWidth: 2,
          color: '#b4b4b4',
          states: {
            hover: {
              lineWidth: 2,
              color: '#b4b4b4'
            }
          },
          marker: {
            symbol: 'circle'
          },
          data: []
        });
      }

      this.chartData = {
        maxY: null,
        lineProfitAndLoss: true,
        dataLabelsEnabled: true,
        gridLineWidth: 1,
        markerEnabled: true,
        crosshair: false,
        xAxiscategories: this.dateX,
        tooltipsArr: [tooltipThisYear, tooltipPrevYear],
        series: chart
      };

      this.percentPrevThis(this.sumThis, this.sumPrev);
    }
    if (
      this.analysis[0].line_graph.length === 0 &&
      this.analysis[1] &&
      this.analysis[1].line_graph.length === 0
    ) {
      this.sumThis = 0;
      this.sumPrev = 0;
      this.precentTotal = 0;
      this.chartDataGr = false;
    }

    this.loader = false;
  }

  percentPrevThis(year, prev) {
    if (prev === 0) {
      this.precentTotal = '-';
      this.precentTotalClass = 'black_num';
    } else {
      this.sumPrecent = year / prev;
      if (
        this.targetTab === '1000' ||
        this.targetTab === 'golmi' ||
        this.targetTab === 'naki'
      ) {
        if (prev < 0 && year > 0) {
          if (this.sumPrecent > 1) {
            this.sumPrecent = (this.sumPrecent - 1) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'green_num';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'green_num';
            }
          } else if (this.sumPrecent === 1) {
            this.precentTotal = '0%';
            this.precentTotalClass = 'green_num';
          } else if (this.sumPrecent < 1) {
            this.sumPrecent = (1 - this.sumPrecent) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'green_num';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'green_num';
            }
          }
        } else if (prev > 0 && year < 0) {
          if (this.sumPrecent > 1) {
            this.sumPrecent = (this.sumPrecent - 1) * 100;

            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'red_num';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'red_num';
            }
          } else if (this.sumPrecent === 1) {
            this.precentTotal = '0%';
            this.precentTotalClass = 'red_num';
          } else if (this.sumPrecent < 1) {
            this.sumPrecent = (1 - this.sumPrecent) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'red_num';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'red_num';
            }
          }
        } else {
          if (this.sumPrecent > 1) {
            this.sumPrecent = (this.sumPrecent - 1) * 100;

            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'green_num';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'green_num';
            }
          } else if (this.sumPrecent === 1) {
            this.sumPrecent = 0;
            this.precentTotal = '0%';
            this.precentTotalClass = 'black_num';
          } else if (this.sumPrecent < 1) {
            this.sumPrecent = (1 - this.sumPrecent) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'green_num';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'red_num';
            }
          }
        }
      } else {
        if (prev < 0 && year > 0) {
          if (this.sumPrecent > 1) {
            this.sumPrecent = (this.sumPrecent - 1) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'red_num_up';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'red_num_up';
            }
          } else if (this.sumPrecent === 1) {
            this.precentTotal = '0%';
            this.precentTotalClass = 'red_num_up';
          } else if (this.sumPrecent < 1) {
            this.sumPrecent = (1 - this.sumPrecent) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'red_num_up';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'red_num_up';
            }
          }
        } else if (prev > 0 && year < 0) {
          if (this.sumPrecent > 1) {
            this.sumPrecent = (this.sumPrecent - 1) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'green_num_down';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'green_num_down';
            }
          } else if (this.sumPrecent === 1) {
            this.precentTotal = '0%';
            this.precentTotalClass = 'green_num_down';
          } else if (this.sumPrecent < 1) {
            this.sumPrecent = (1 - this.sumPrecent) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'green_num_down';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'green_num_down';
            }
          }
        } else {
          if (this.sumPrecent > 1) {
            this.sumPrecent = (this.sumPrecent - 1) * 100;

            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'red_num_up';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'red_num_up';
            }
          } else if (this.sumPrecent === 1) {
            this.precentTotal = '0%';
            this.precentTotalClass = 'black_num';
          } else if (this.sumPrecent < 1) {
            this.sumPrecent = (1 - this.sumPrecent) * 100;
            if (this.sumPrecent > 1000) {
              this.precentTotal = 'מעל 1000%';
              this.precentTotalClass = 'red_num_up';
            } else if (this.sumPrecent === Infinity) {
              this.precentTotal = '-';
              this.precentTotalClass = 'black_num';
            } else {
              this.precentTotal =
                Math.round(this.sumPrecent)
                  .toString()
                  .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + '%';
              this.precentTotalClass = 'green_num_down';
            }
          }
        }
      }
    }
  }

  selectedInitTrans(data?: any) {
    this.selectTrans = [
      {
        name: 'כל הכרטיסים',
        id: 'null',
        idx: 'all'
      }
    ];
    if (data && data !== 'null') {
      this.dataSelectTrans = data;
      let index2 = '';
      this.listAnalisis.forEach((v) => {
        if (v.level_1.id === this.dataSelectTrans) {
          v.level_1.level_2.forEach((a, index) => {
            const option = {
              name: a.number + ' - ' + a.name,
              id: a.id,
              idx: index
            };
            this.selectTrans.push(option);
          });
        }
      });

      if (!this.analysisDates) {
        this.selectTransId = this.selectTrans[0];
      } else {
        this.selectTransId = this.selectTrans[index2];
        this.selectTransChange(this.selectTransId);
      }
    }
    if (!data || data === 'null') {
      if (this.listAnalisis.length > 0) {
        var indSel = 0;
        this.listAnalisis[0].level_1.level_2.forEach((a, index) => {
          const option = {
            name: a.number + ' - ' + a.name,
            id: a.id,
            idx: index
          };
          this.selectTrans.push(option);
          if (a.id === this.transCodes) {
            indSel = index + 1;
          }
        });
        if (this.listAnalisis.length > 1) {
          this.selectTransId = this.selectTrans[0];
        } else {
          this.selectTransId = this.selectTrans[indSel];
        }

        if (this.analysisDates) {
          if (this.transCodes !== '') {
            this.selectTransChange(this.selectTransId);
          } else {
            this.selectCodeSortChange(this.selectCodeSortId);
          }
        }
      }
    }
  }

  openRowThree(id) {
    this.sharedService
      .detailsBookKeeping({
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.parameters.dateFrom,
        dateTill: this.parameters.dateTill,
        transTypeCatId: id
      })
      .subscribe(
        (response: any) => {
          this.listAnalisis.forEach((v) => {
            v.level_1.level_2.forEach((a) => {
              if (a.id === id) {
                a.level_3 = response ? response['body'] : response;
              }
            });
          });
        },
        (err: HttpErrorResponse) => {
        }
      );
  }

  selectTransChange(data) {
    this.selectName = data.name;
    this.sortCodes = '';
    if (data.id === 'null') {
      this.transCodes = '';
    } else {
      this.transCodes = data.id;
      this.openRowThree(data.id);
    }
    if (!this.analysisDates) {
      this.loadPageAnalisis(this.targetTab, true);
    }
    setTimeout(() => {
      const idx = this.selectCodeSortId.idx;
      this.listAnalisis.forEach((v, index) => {
        if (this.sortCodes !== 'null') {
          if (idx === index) {
            v.rowshow = true;
          } else {
            v.rowshow = false;
          }
        } else {
          v.rowshow = false;
        }

        v.level_1.level_2.forEach((a) => {
          if (this.transCodes !== 'null') {
            if (a.id === this.transCodes) {
              a.rowshow = true;
            } else {
              a.rowshow = false;
            }
          } else {
            a.rowshow = false;
          }
        });
      });
    }, 500);

    this.analysisDates = false;
  }

  selectCodeSortChange(data) {
    this.selectName = data.name;
    if (!this.analysisDates) {
      this.selectedInitTrans(data.id);
    }
    this.transCodes = '';
    if (data.id === 'null') {
      this.sortCodes = '';
    } else {
      this.sortCodes = data.id;
    }
    if (!this.analysisDates) {
      this.loadPageAnalisis(this.targetTab, true);
    }

    this.listAnalisis.forEach((v) => {
      if (this.sortCodes !== 'null') {
        if (v.level_1.id === this.sortCodes) {
          v.rowshow = true;
        } else {
          v.rowshow = false;
        }
      }
      v.level_1.level_2.forEach((a) => {
        a.rowshow = false;
      });
    });
    this.analysisDates = false;
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
          v.rowsAsList.forEach((c, ind) => {
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
    const month = graph.dates.map(
      (dates) =>
        `<strong>${
          this.translate.translations[this.translate.currentLang].months[
          this.parseIntNum(dates.toString().substring(4, 6)) - 1
            ]
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

  showAccountsDeleted() {
  }

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
          (response: any) => {
            this.trialBalance.forEach((v) => {
              v.level_1.level_2.forEach((a) => {
                if (v.id === a.id) {
                  a.target_supp_desc = a.selectItems.description;
                }
              });
            });
          },
          (err: HttpErrorResponse) => {
          }
        );
    }
  }

  onCloseDD() {
  }
}
