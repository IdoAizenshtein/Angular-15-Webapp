import {
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { UserService } from '@app/core/user.service';
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
import { ReportService } from '@app/core/report.service';
import { ReloadServices } from '@app/shared/services/reload.services';

@Component({
  templateUrl: './customers-accountancy-trial-balance.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersAccountancyTrialBalanceComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  public subscription: Subscription;
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

    this.childDates.filter('trialBalance');
    this.filterDates(this.childDates.selectedPeriod);
  }

  filterDates(paramDate: any): void {
    this.loader = true;
    this.parameters.dateFrom = paramDate.fromDate;
    this.parameters.dateTill = paramDate.toDate;
    this.getMaazan();
  }

  getMaazan() {
    this.loader = true;
    this.sharedService
      .getMaazan({
        branchId: '5ef0adab-56b8-4772-a96f-bb87b55d559b',
        companyId:
          this.userService.appData.userData.companySelect.example &&
          !this.userService.appData.userData.companySelect
            .METZALEM_deskTrialExpired
            ? '856f4212-3f5f-4cfc-b2fb-b283a1da2f7c'
            : this.userService.appData.userData.companySelect.companyId,
        dateFrom: this.parameters.dateFrom,
        dateTill: this.parameters.dateTill,
        ptixa: true
      })
      .subscribe(
        (response:any) => {
          this.trialBalanceArr = response ? response['body'] : response;
          this.trialBalanceArr.forEach((v) => {
            v.tableShow = true;
            v.opened = false;
            v.level_1.level_2.forEach((v1) => {
              v1.selectItems =
                this.cartis_code_getlist.find(
                  (cartCode) => cartCode.description === v1.target_supp_desc
                ) || this.cartis_code_getlist[0];
              v1.opened = true;
            });
          });
          this.filtersAll();
        },
        (err: HttpErrorResponse) => {}
      );
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
            this.trialBalance.forEach((v1) => {
              v1.level_1.level_2.forEach((a) => {
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

  private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
    const additionalProperties = {
      currency: '₪'
    };
    // const additionalProperties: any = reportType === 'EXCEL'
    //     ? {
    //         accountBalance: this.accountBalance,
    //         usedBalance: this.balanceUse,
    //         reportDays: this.childDates.asText(),
    //         creditLimit: this.creditLimitAbs,
    //         currency: this.currencySymbolPipe.transform(this.userService.appData.userData.accountSelect[0].currency),
    //         message: this.reportService.buildMessageFrom(this.userService.appData.userData.accountSelect)
    //     }
    //     : {
    //         accountBalance: this.sumPipe.transform(this.accountBalance, true),
    //         usedBalance: this.sumPipe.transform(this.balanceUse, true),
    //         reportDays: this.childDates.asText(),
    //         creditLimit: this.sumPipe.transform(this.creditLimitAbs, true),
    //         currency: this.currencySymbolPipe.transform(this.userService.appData.userData.accountSelect[0].currency),
    //         message: this.reportService.buildMessageFrom(this.userService.appData.userData.accountSelect)
    //     };

    const pageData = JSON.parse(JSON.stringify(this.trialBalance));
    pageData.forEach((node) => {
      delete node.opened;
      delete node.tableShow;
    });

    return {
      additionalProperties: additionalProperties,
      data: {
        report: pageData
        // report: [].concat(this.dataTable.filter(trnsRow => !(trnsRow.rowSum)))
        //     .concat(this.tablePristine ? this.dataTableToday.filter(trnsRow => !(trnsRow.rowSum)) : [])
        //     .map(row => {
        //         const clone = JSON.parse(JSON.stringify(row));
        //         ['account', '_appearsInBankTooltip', 'bankIconSrc', 'selectedTransType', 'transDateHumanizedStr']
        //             .forEach(pn => delete clone[pn]);
        //
        //         return clone;
        //     })
      }
    };
  }

  exportTransactions(resultFileType: string): void {
    this.reportService
      .getReport(
        'MAAZAN_BOHAN',
        this.reportParamsFromCurrentView(resultFileType),
        resultFileType,
        this.reportService.prepareFilename(...this.getFilename())
      )
      .pipe(take(1))
      .subscribe((rslt) => {});
  }

  private getFilename() {
    return [
      this.translate.instant('menu.customers.accountancy.trialBalance'),
      this.childDates.asText(),
      this.userService.appData.userData.companySelect.companyName
    ];
  }
}
