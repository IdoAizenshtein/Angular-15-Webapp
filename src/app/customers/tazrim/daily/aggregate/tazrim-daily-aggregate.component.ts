import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../customers.component';
import { SortPipe } from '@app/shared/pipes/sort.pipe';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '../../../customers.service';
import { UserService } from '@app/core/user.service';
import { FilterPipe } from '@app/shared/pipes/filter.pipe';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { getDaysBetweenDates } from '@app/shared/functions/getDaysBetweenDates';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  take
} from 'rxjs/operators';

import { StorageService } from '@app/shared/services/storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AccountSelectComponent } from '@app/shared/component/account-select/account-select.component';
import { Dropdown } from 'primeng/dropdown/dropdown';
import { Subscription } from 'rxjs';
import { OverlayPanel } from 'primeng/overlaypanel';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { BrowserService } from '@app/shared/services/browser.service';
import { ReportService } from '@app/core/report.service';
import { SumPipe } from '@app/shared/pipes/sum.pipe';
import { CashflowDateRangeSelectorComponent } from '@app/shared/component/date-range-selectors/cashflow-date-range-selector.component';
import { CurrencySymbolPipe } from '@app/shared/pipes/currencySymbol.pipe';
import { CustomPreset } from '@app/shared/component/date-range-selectors/presets';
import { TransTypesService } from '@app/core/transTypes.service';
import { ReloadServices } from '@app/shared/services/reload.services';

declare var $: any;

@Component({
  templateUrl: './tazrim-daily-aggregate.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class TazrimDailyAggregateComponent
  extends ReloadServices
  implements OnInit, AfterViewInit, OnDestroy
{
  public filterTypesVal: any = null;
  public accountBalance: number;
  public creditLimit: number;
  public selectedValue: any;
  public selectedValuePayment: any;
  public langCalendar: any;
  public companyTransTypes: any[] = [];
  public disabledAfterCreate: boolean = false;

  public readonly today: Date;
  public readonly calendarMax: Date;
  public form: any;

  get creditLimitAbs(): number {
    return Math.abs(this.creditLimit);
  }

  public balanceUse: number;
  public subscription: Subscription;
  public dataTableInside: any[] = [];
  public dataTable: any[] = [];
  public dataTableAll: any[] = [];
  public queryString = '';
  public entryLimit = 10;
  @Input() counter: any = 10;
  public filterInput = new FormControl();

  // // @ViewChild(AccountDatesComponent) childDates: AccountDatesComponent;
  // @ViewChild(TazrimDatesComponent) childDates: TazrimDatesComponent;
  @ViewChild(CashflowDateRangeSelectorComponent)
  childDates: CashflowDateRangeSelectorComponent;

  public transTypeName: any[];
  public sortPipeDir: any = null;
  public loader = false;
  public sortableIdGr: any[];
  private scrollEventHandleHelper: { lastHandleY: number; ticking: boolean } = {
    lastHandleY: 0,
    ticking: false
  };
  public typePayments: any[];
  @ViewChild('scrollContainerInside') scrollContainerInside: ElementRef;
  public scrollContainerInsideHasScroll = false;
  public nav = {
    prev: false,
    next: false
  };
  @ViewChild('accountHandles', { read: ElementRef })
  accountHandlesRef: ElementRef;
  @ViewChild('aggregate', { read: ElementRef }) accountsListRef: ElementRef;
  @ViewChildren('accountHandlesMain', { read: ElementRef })
  accountHandlesMainRef: QueryList<ElementRef>;

  @ViewChild('checkNumberGuideOvP', { read: OverlayPanel })
  checkNumberGuideOvP: OverlayPanel;
  readonly checkNumberGuides: { stopIt: boolean };
  @ViewChildren('totalFields', { read: ElementRef })
  paymentCreateTotalsRef: QueryList<ElementRef>;

  reportMailSubmitterToggle = false;

  constructor(
    public translate: TranslateService,
    public override sharedComponent: SharedComponent,
    public userService: UserService,
    private sharedService: SharedService,
    private filterPipe: FilterPipe,
    private sortPipe: SortPipe,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    public fb: FormBuilder,
    public browserDetect: BrowserService,
    public snackBar: MatSnackBar,
    private reportService: ReportService,
    private sumPipe: SumPipe,
    private currencySymbol: CurrencySymbolPipe,
    private transTypesService: TransTypesService
  ) {
    super(sharedComponent);

    this.today = this.userService.appData.moment().toDate();
    this.calendarMax = this.userService.appData
      .moment()
      .add(5, 'years')
      .toDate();

    this.typePayments = ['Checks', 'BankTransfer', 'Other'].map((val) => {
      return {
        label: this.translate.instant('paymentTypes.' + val),
        value: val
      };
    });
    // this.typePayments = [
    //     {label: this.translate.translations[this.translate.currentLang].ddPays.check, value: 'check'},
    //     {label: this.translate.translations[this.translate.currentLang].ddPays.transfer, value: 'wire'},
    //     {label: this.translate.translations[this.translate.currentLang].ddPays.other, value: 'other_payment'}
    // ];

    this.subscription =
      this.transTypesService.selectedCompanyTransTypes.subscribe(
        (rslt) => (this.companyTransTypes = rslt)
      );

    this.checkNumberGuides = {
      stopIt:
        this.storageService.localStorageGetterItem(
          'checkNumberGuides.display'
        ) === 'false'
    };
  }

  get yearRange(): string {
    return `${this.today.getFullYear()}:${this.calendarMax.getFullYear()}`;
  }
  sendEvent(isOpened: any) {
    if (isOpened && this.childDates) {
      this.childDates.selectedRange
          .pipe(take(1))
          .subscribe((paramDate) => {
            this.sharedComponent.mixPanelEvent('days drop', {
              value: paramDate.fromDate + '-' + paramDate.toDate
            });
          });
    }
  }
  changeAcc(event): void {
    this.loader = true;
    console.log(this.userService.appData.userData.accountSelect);
    // if (this.userService.appData.userData.accountSelect.filter((account) => {
    //   return account.currency !== 'ILS';
    // }).length) {
    //   this.sharedComponent.mixPanelEvent('accounts drop');
    // }

    const accountSelectExchange = this.userService.appData.userData.accountSelect.filter((account) => {
      return account.currency !== 'ILS';
    })
    this.sharedComponent.mixPanelEvent('accounts drop', {
      accounts:(this.userService.appData.userData.accountSelect.length === accountSelectExchange.length) ? 'כל החשבונות מט"ח' :
          (((this.userService.appData.userData.accounts.length-accountSelectExchange.length) === this.userService.appData.userData.accountSelect.length)? 'כל החשבונות' :
              (
                  this.userService.appData.userData.accountSelect.map(
                      (account) => {
                        return account.companyAccountId;
                      }
                  )
              ))
    });
    [this.accountBalance, this.creditLimit, this.balanceUse] =
      this.userService.appData.userData.accountSelect.reduce(
        function (a, b) {
          return [
            a[0] + +b.accountBalance,
            a[1] + +b.creditLimit,
            a[2] + +b.balanceUse
          ];
        },
        [0, 0, 0]
      );
    if (this.childDates) {
      this.childDates.selectedRange
          .pipe(take(1))
          .subscribe(() =>
              this.filterDates(this.childDates.recalculateSelectedRangeIfNecessary())
          );
    }

    // this.childDates.filter('DaysTazrim');
    // this.filterDates(this.childDates.selectedPeriod);
  }

  getInfoAcc(id: string, param: string, applyAbsForCreditLimit = true): any {
    if (id !== null && param !== undefined) {
      const result = this.userService.appData.userData.accounts.find(
        (account) => {
          return account.companyAccountId === id;
        }
      )[param];

      return param === 'creditLimit' && applyAbsForCreditLimit
        ? Math.abs(result)
        : result;
    } else {
      return '';
    }
  }

  isForexAccount(id: string): boolean {
    return (
      this.getInfoAcc(id, 'currency') !==
      AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
    );
  }

  compareDatesInline(dateToCompare): boolean {
    return (
      new Date().toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) ===
      new Date(dateToCompare).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    );
  }

  filterDates(paramDate: any): void {
    const selectedAccountIds =
      this.userService.appData.userData.accountSelect.map((account) => {
        return account.companyAccountId;
      });
    if (!selectedAccountIds.length) {
      this.loader = false;
      this.dataTableAll = [];
    } else {
      this.loader = true;
      const parameters: any = {
        companyAccountIds: selectedAccountIds,
        companyId: this.userService.appData.userData.companySelect.companyId,
        dateFrom: paramDate.fromDate,
        dateTill: paramDate.toDate,
        expence: -1
      };
      this.sharedService.aggregateCashFlow(parameters).subscribe(
        (response:any) => {
          const dataTableAll = response ? response['body'] : response;
          const accounts = dataTableAll.filter((account) => {
            return account.accountUuid !== null;
          });
          const allAcc =
            accounts.length === 1
              ? []
              : dataTableAll.filter((account) => {
                  return account.accountUuid === null;
                });
          accounts.sort((a, b) => {
            return (
              this.userService.appData.userData.accountSelect.findIndex(
                (acc:any) => acc.companyAccountId === a.accountUuid
              ) -
              this.userService.appData.userData.accountSelect.findIndex(
                (acc:any) => acc.companyAccountId === b.accountUuid
              )
            );
          });

          const outdatedSelectedAccountsMap: { [k: string]: number } =
            this.userService.appData.userData.accountSelect
              .filter((acc:any) => !acc.isUpToDate)
              .reduce((acmltr, outdatedAcc) => {
                acmltr[outdatedAcc.companyAccountId] =
                  outdatedAcc.balanceLastUpdatedDate;
                return acmltr;
              }, Object.create(null));

          accounts
            .filter((acc:any) => outdatedSelectedAccountsMap[acc.accountUuid])
            .forEach((acc:any) => {
              acc.accountTransactions
                .filter(
                  (trns) =>
                    trns.transDate >
                    outdatedSelectedAccountsMap[acc.accountUuid]
                )
                .forEach((trns) => (trns.itra = trns.totalCredit = null));
              // .forEach(trns => [trns.zhut, trns.hova, trns.itra, trns.totalCredit] = [null, null, null, null]);
            });

          accounts.forEach((accId) => {
            accId.balanceUse =
              this.getInfoAcc(accId.accountUuid, 'balanceUse') < 0;
            accId.isUpToDate = this.getInfoAcc(accId.accountUuid, 'isUpToDate');
          });

          const sortableIdGr =
            this.storageService.sessionStorageGetterItem('sortableIdGr');
          if (sortableIdGr !== null && sortableIdGr !== 'null') {
            this.sortableIdGr = JSON.parse(sortableIdGr);
            accounts.sort((a, b) => {
              const storedIndexOfA = this.sortableIdGr.indexOf(a.accountUuid);
              const storedIndexOfB = this.sortableIdGr.indexOf(b.accountUuid);

              // console.log('storedIndexOfA: %o, storedIndexOfB: %o', storedIndexOfA, storedIndexOfB);
              if (storedIndexOfA === storedIndexOfB) {
                return (
                  this.userService.appData.userData.accountSelect.findIndex(
                    (acc:any) => acc.companyAccountId === a.accountUuid
                  ) -
                  this.userService.appData.userData.accountSelect.findIndex(
                    (acc:any) => acc.companyAccountId === b.accountUuid
                  )
                );
              }
              if (storedIndexOfA === -1 || storedIndexOfB === -1) {
                return storedIndexOfA === -1 ? 1 : -1;
              }

              return storedIndexOfA - storedIndexOfB;
            });
          }
          this.sortableIdGr = accounts.map((acc:any) => acc.accountUuid);
          this.storageService.sessionStorageSetter(
            'sortableIdGr',
            JSON.stringify(this.sortableIdGr)
          );

          this.dataTableAll = allAcc.concat(accounts);
          const showNigrarotRow = this.dataTableAll.some(
            (acc:any) => acc.hovaNigrarot !== null || acc.zhutNigrarot !== null
          );
          if (showNigrarotRow) {
            const momentLastUpdatedDay = showNigrarotRow
              ? this.userService.appData
                  .moment(
                    this.userService.appData.userData.accountSelect[0]
                      .balanceLastUpdatedDate
                  )
                  .startOf('day')
              : null;
            let nigRowIndex;
            this.dataTableAll.some((acc:any) => {
              if (acc.accountTransactions) {
                nigRowIndex = acc.accountTransactions.findIndex((transRow) => {
                  return this.userService.appData
                    .moment(transRow.transDate)
                    .isSameOrAfter(momentLastUpdatedDay);
                });
                return true;
              }
              return false;
            });

            if (nigRowIndex >= 0) {
              this.dataTableAll.forEach((acc, index) => {
                // debugger;
                if (acc.accountTransactions) {
                  acc.accountTransactions[nigRowIndex].hova =
                    +acc.accountTransactions[nigRowIndex].hova -
                    +acc.hovaNigrarot;
                  acc.accountTransactions[nigRowIndex].zhut =
                    +acc.accountTransactions[nigRowIndex].zhut -
                    +acc.zhutNigrarot;

                  acc.accountTransactions.unshift({
                    hova: acc.hovaNigrarot,
                    itra: null,
                    totalCredit: null,
                    transDate:
                      this.dataTableAll[index].accountTransactions[nigRowIndex]
                        .transDate, // null,
                    zhut: acc.zhutNigrarot,
                    showAsNigrarotToday: true
                  });
                }
              });
            }
          }

          let idxOld;
          (<any>$('#sortable'))
            .sortable({
              items: 'li:not(.p-disabled)',
              handle: '.topTitles',
              // containment: 'parent',
              axis: 'x',
              // scroll: false,
              tolerance: 'pointer',
              scrollSensitivity: 100,
              scrollSpeed: 100,
              activate: (e, ui) => {
                ui.sender.scrollTop(0);
              },
              start: (e, ui) => {
                idxOld = ui.item.index();
              },
              update: (event, ui) => {
                console.log('old: ' + (idxOld - 1));
                console.log('update: ' + (ui.item.index() - 1));
                this.sortableIdGr = this.arrayMove(
                  this.sortableIdGr,
                  idxOld - 1,
                  ui.item.index() - 1
                );
                console.log(this.sortableIdGr);
                this.storageService.sessionStorageSetter(
                  'sortableIdGr',
                  JSON.stringify(this.sortableIdGr)
                );
                idxOld = undefined;
                this.scrollEventHandleHelper.ticking = false;
                setTimeout(() => {
                  this.checkNavScroll();
                }, 600);
              }
            })
            .disableSelection();
          this.listScrollVertically();
          setTimeout(() => {
            this.checkNavScroll();
          }, 600);
          this.loader = false;
        },
        (err: HttpErrorResponse) => {
          if (err.error) {
            console.log('An error occurred:', err.error.message);
          } else {
            console.log(
              `Backend returned code ${err.status}, body was: ${err.error}`
            );
          }
        }
      );
    }
  }

  arrayMove(arr: any[], old_index: number, new_index: number): any[] {
    while (old_index < 0) {
      old_index += arr.length;
    }
    while (new_index < 0) {
      new_index += arr.length;
    }
    if (new_index >= arr.length) {
      let k = new_index - arr.length + 1;
      while (k--) {
        arr.push(undefined);
      }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr;
  }

  goToFinancialManagementBankAccountDetailsComponent(filtersParams: any) {
    this.sharedComponent.mixPanelEvent('all transes');

    this.storageService.sessionStorageSetter(
      'daily/*-filterAcc',
      filtersParams[0] === null
        ? JSON.stringify(
            this.userService.appData.userData.accountSelect.map(
              (id) => id.companyAccountId
            )
          )
        : JSON.stringify([filtersParams[0]])
    );
    this.storageService.sessionStorageSetter(
      'details-filterTypesVal',
      filtersParams[1]
    );
    let date = filtersParams[2];
    if (date === null) {
      this.userService.appData.userData.nigreret = true;
      date = new Date();
    } else {
      this.userService.appData.userData.nigreret = false;
      date = new Date(filtersParams[2]);
    }

    // this.storageService.sessionStorageSetter('daily/details-filterDates',
    //     JSON.stringify(CustomPreset.createDatesPreset(date))
    // );
    this.storageService.sessionStorageSetter(
      'daily/*-filterDates',
      JSON.stringify(CustomPreset.createDatesPreset(date))
    );
    // this.storageService.sessionStorageSetter(TazrimDatesComponent.storageKey(this.route, 'details'), JSON.stringify({
    //     selectedValue: '2',
    //     dates: {
    //         calendarFrom: date,
    //         calendarUntil: date
    //     }
    // }));
    this.router.navigate(['../details'], {
      queryParamsHandling: 'preserve',
      relativeTo: this.route
    });
  }

  getBankTransPerDay(
    companyAccountIds: string[],
    hova: boolean,
    transDate: string
  ): any {
    // console.log('getBankTransPerDay for: %o, %o ', transDate, hova);
    this.dataTableInside = [];
    if (companyAccountIds && companyAccountIds.length > 0) {
      const parameters: any = {
        companyAccountIds: companyAccountIds,
        companyId: this.userService.appData.userData.companySelect.companyId,
        dateFrom: transDate === null ? new Date().getTime() : transDate,
        dateTill: transDate === null ? new Date().getTime() : transDate,
        expence: hova ? 1 : 0,
        nigreret: transDate === null
      };
      this.sharedService.transPerDayCashFlow(parameters).subscribe(
        (response:any) => {
          this.dataTableInside = response ? response['body'] : response;
          this.dataTableInside.forEach(
            (data) => (data.total = Math.abs(data.total))
          );
        },
        (err: HttpErrorResponse) => {
          if (err.error) {
            console.log('An error occurred:', err.error.message);
          } else {
            console.log(
              `Backend returned code ${err.status}, body was: ${err.error}`
            );
          }
        }
      );
    }
  }

  nextScroll(elem: any) {
    const visibleIndices = this.findVisibleAccountIndices();
    let scrollToIndex = visibleIndices[visibleIndices.length - 1].tabindex;
    if (visibleIndices[visibleIndices.length - 1].fullyVisible) {
      scrollToIndex += 1;
    }
    console.log(
      'nextScroll: visibleIndices -> %o will scroll to: %o',
      visibleIndices,
      scrollToIndex
    );
    this.scrollIntoViewAccountAt(scrollToIndex);
    // this.scrollTo(elem, -1040, 200);
  }

  prevScroll(elem: any) {
    const visibleIndices = this.findVisibleAccountIndices();
    let scrollToIndex = visibleIndices[0].tabindex;
    if (
      visibleIndices[0].fullyVisible ||
      this.browserDetect.browserDetect.browser === 'Chrome' ||
      this.browserDetect.browserDetect.browser === 'Mozilla' ||
      this.browserDetect.browserDetect.browser === 'Edge'
    ) {
      scrollToIndex -= 1;
    }

    console.log(
      'nextScroll: visibleIndices -> %o will scroll to: %o',
      visibleIndices,
      scrollToIndex
    );
    this.scrollIntoViewAccountAt(scrollToIndex, 'start');
    // this.scrollTo(elem, 1040, 200);
  }

  // scrollTo(elem: any, xScroll: number, scrollDuration: any): void {
  //   const scrollStep: any = (xScroll / (scrollDuration / 15));
  //   const fullStep: any = elem.scrollLeft - ((xScroll < 0) ? Math.abs(xScroll) : -xScroll);
  //   const scrollInterval = setInterval(() => {
  //     if ((scrollStep > 0 && ((elem.scrollWidth - elem.offsetWidth) === elem.scrollLeft)) || scrollStep < 0 && elem.scrollLeft === 0) {
  //       clearInterval(scrollInterval);
  //     } else if ((scrollStep < 0 && elem.scrollLeft > fullStep) || (scrollStep > 0 && elem.scrollLeft < fullStep)) {
  //       elem.scrollBy(scrollStep, 0);
  //     } else {
  //       clearInterval(scrollInterval);
  //     }
  //   }, 15);
  // }

  checkNavScroll() {
    const elem = this.accountsListRef.nativeElement;
    const browser = this.browserDetect.browserDetect.browser;
    this.nav.prev = false;
    this.nav.next = false;

    if (elem.scrollWidth <= elem.clientWidth) {
      console.log('Not have scroll');
      this.nav.prev = false;
      this.nav.next = false;
    } else {
      this.nav.prev = true;
      this.nav.next = true;
      if (
        (browser === 'Edge' || browser === 'Chrome') &&
        elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth + 15
      ) {
        console.log('Edge Left');
        this.nav.prev = true;
        this.nav.next = false;
      }

      if (elem.scrollWidth - Math.abs(elem.scrollLeft) === elem.clientWidth) {
        if (browser === 'Mozilla') {
          console.log('Edge Left');
          this.nav.prev = true;
          this.nav.next = false;
        }
      }

      if (elem.scrollWidth + Math.abs(elem.scrollLeft) === elem.clientWidth) {
        if (browser === 'Firefox') {
          console.log('Edge Left');
          this.nav.prev = true;
          this.nav.next = false;
        }
      }

      if (Math.abs(elem.scrollLeft) === 0) {
        if (browser === 'Mozilla' || browser === 'Edge') {
          console.log('Edge Right');
          this.nav.prev = false;
          this.nav.next = true;
        }
        if (browser === 'Chrome') {
          console.log('Edge Left');
          this.nav.prev = false;
          this.nav.next = true;
        }
        if (browser === 'Firefox') {
          console.log('Edge Right');
          this.nav.prev = false;
          this.nav.next = true;
        }
      }
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit')
    this.childDates.selectedRange
        .pipe(
            filter(
                () =>
                    Array.isArray(this.userService.appData.userData.accountSelect) &&
                    this.userService.appData.userData.accountSelect.length
            )
        )
        .subscribe(() =>
            this.filterDates(this.childDates.recalculateSelectedRangeIfNecessary())
        );
    // this.storageService.sessionStorageSetter('bankAccount-defaultViewName', 'aggregate');
    // this.defaultsResolver.setDisplayModeTo(this.route.snapshot.url[0].toString());
  }

  public daysFromTodayHumanized(date: number | Date): string {
    const days = getDaysBetweenDates(
      date instanceof Date ? date : new Date(date),
      new Date()
    );
    return days === 1
      ? this.translate.translations[this.translate.currentLang].sumsTitles
          .yesterday
      : this.translate.translations[this.translate.currentLang].sumsTitles
          .before +
          ' ' +
          days +
          ' ' +
          this.translate.translations[this.translate.currentLang].sumsTitles
            .days;
  }

  public stepAccount(dir: number, evnt: any): void {
    this.scrollIntoViewAccountAt(+evnt.target.getAttribute('tabindex') + dir);
  }

  private scrollIntoViewAccountAt(idx: number, inline = 'end'): void {
    if (idx < 0 || idx >= this.accountHandlesMainRef.length) {
      return;
    }
    // const accountHandlesArr = this.accountHandlesMainRef.toArray();
    // if (idx < 0) {
    //   idx = accountHandlesArr.length - 1;
    // } else if (idx === accountHandlesArr.length) {
    //   idx = 0;
    // }

    const evntAccHandle = this.accountHandlesMainRef.find(
      (accH) => +accH.nativeElement.getAttribute('tabindex') === idx
    );

    if (evntAccHandle) {
      console.log('scrolling to %o', idx);
      requestAnimationFrame(() => {
        evntAccHandle.nativeElement.focus({ preventScroll: true });
        evntAccHandle.nativeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: inline
        });
        setTimeout(() => {
          this.checkNavScroll();
        }, 600);
      });
    }
  }

  private findVisibleAccountIndices(): any[] {
    const indices = this.accountHandlesMainRef
      .filter((accH) => {
        if (!accH.nativeElement.offsetParent) {
          return false;
        }
        const viewportWidth = accH.nativeElement.offsetParent.scrollWidth;
        const accRect = accH.nativeElement.getBoundingClientRect();
        console.log(
          '%o -> %o, viewportWidth: %o',
          +accH.nativeElement.getAttribute('tabindex'),
          accRect,
          viewportWidth
        );
        return (
          (accRect.left >= 0 && accRect.left < viewportWidth) ||
          (accRect.right > 0 && accRect.right <= viewportWidth) ||
          (accRect.left < 0 && accRect.right > viewportWidth)
        );
      })
      .map((accH) => {
        const viewportWidth = accH.nativeElement.offsetParent.scrollWidth;
        const accRect = accH.nativeElement.getBoundingClientRect();

        return {
          tabindex: +accH.nativeElement.getAttribute('tabindex'),
          fullyVisible: accRect.left >= 0 && accRect.right <= viewportWidth
        };
      });

    indices.sort((a, b) => a.tabindex - b.tabindex);
    return indices;
  }

  // sortedIndexOf(accItem: any): number {
  //   if (!accItem.accountUuid) {
  //     return 0;
  //   }
  //
  //   return this.sortableIdGr.indexOf(accItem.accountUuid) + 1;
  // }

  toAbsolute(val: number) {
    return Math.abs(val);
  }

  tooltipToggleFor(acc: any, transDay: any, hova: boolean, $event: any): void {
    // debugger;
    // console.log('tooltipToggleFor -> %o, %o, %o, %o', acc, transDay, hova, $event);
    if (hova) {
      acc.opened1 = $event;
    } else {
      acc.opened2 = $event;
    }

    if ($event) {
      if (acc.accountUuid === null) {
        this.getBankTransPerDay(
          this.userService.appData.userData.accountSelect.map(
            (id) => id.companyAccountId
          ),
          hova,
          transDay.showAsNigrarotToday ? null : transDay.transDate
        );
      } else {
        this.getBankTransPerDay(
          [acc.accountUuid],
          hova,
          transDay.showAsNigrarotToday ? null : transDay.transDate
        );
      }
    }
  }

  listScrollVertically($event?: any) {
    if ($event) {
      if (
        this.scrollEventHandleHelper.lastHandleY === $event.srcElement.scrollTop
      ) {
        return;
      }
      this.scrollEventHandleHelper.lastHandleY = $event.srcElement.scrollTop;
      this.runScroll();
    } else {
      setTimeout(() => {
        this.runScroll();
      }, 100);
    }
  }

  runScroll(): void {
    if (!this.scrollEventHandleHelper.ticking) {
      // const allTransLists = this.accountHandlesRef.map(ref => ref.nativeElement.children[0]);
      // console.log('transactionsScrolled -> %o at %o', $event.srcElement.scrollTop,
      //   allTransLists);
      const allTransLists =
        this.accountHandlesRef.nativeElement.querySelectorAll(
          '.account-header'
        );

      requestAnimationFrame(() => {
        // allTransLists.forEach(lst => lst.style.visibility = 'hidden');
        // requestAnimationFrame(() => {
        allTransLists.forEach(
          (lst) =>
            (lst.style.top = this.scrollEventHandleHelper.lastHandleY + 'px')
        );
        // allTransLists.forEach(lst => lst.style.visibility = 'visible');
        this.scrollEventHandleHelper.ticking = false;
        // });
      });

      this.scrollEventHandleHelper.ticking = true;
    }
  }
  override reload() {
    console.log('reload child');
    this.changeAcc(null);
  }
  ngOnInit(): void {

    this.route.data.subscribe((data: any) => {
      console.log('resolved data ===> %o, aRoute: %o', data, this.route);
      this.entryLimit =
        data.userDefaults && data.userDefaults.numberOfRowsPerTable
          ? +data.userDefaults.numberOfRowsPerTable
          : 50;
    });
    if (this.translate.currentLang !== 'ENG') {
      this.langCalendar =
        this.translate.translations[this.translate.currentLang].langCalendar;
    }
  }

  clearFilter(dropdown: Dropdown) {
    dropdown.resetFilter();
  }

  addPayments(transferFocus?: boolean) {
    let dateNext: any = '';
    if (this.arr.value[this.arr.value.length - 1].dueDate !== '') {
      const dateLast = new Date(
        this.arr.value[this.arr.value.length - 1].dueDate
      );
      if (
        dateLast.getDate() ===
        new Date(dateLast.getFullYear(), dateLast.getMonth() + 1, 0).getDate()
      ) {
        dateNext = this.userService.appData
          .moment(dateLast)
          .add(1, 'months')
          .endOf('month')
          .toDate();
      } else {
        dateNext = this.userService.appData
          .moment(dateLast)
          .add(1, 'months')
          .toDate();
      }
    }
    let asmachta: any = '';
    if (
      this.selectedValuePayment === 'Checks' &&
      this.arr.value[this.arr.value.length - 1].asmachta !== ''
    ) {
      asmachta = Number(this.arr.value[this.arr.value.length - 1].asmachta) + 1;
    }
    let paymentDesc: any = '';
    if (this.arr.value[this.arr.value.length - 1].paymentDesc !== '') {
      paymentDesc = this.arr.value[this.arr.value.length - 1].paymentDesc;
    }
    let transTypeId: any = this.companyTransTypes.filter(
      (id) => id.transTypeId === 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d'
    );
    if (this.arr.value[this.arr.value.length - 1].transTypeId !== '') {
      transTypeId = this.arr.value[this.arr.value.length - 1].transTypeId;
    }
    const obj = {
      dueDate: dateNext,
      asmachta: asmachta,
      transTypeId: transTypeId,
      total: this.arr.value[this.arr.value.length - 1].total,
      paymentDesc: paymentDesc
    };
    this.arr.push(this.fb.group(obj));
    this.validateScrollPresenceInside();

    if (transferFocus === true) {
      setTimeout(() => {
        this.paymentCreateTotalsRef.last.nativeElement.focus();
      });
    }

    requestAnimationFrame(() => {
      this.paymentCreateTotalsRef.last.nativeElement.scrollIntoView();
    });
  }

  removeItem(index: number) {
    this.arr.removeAt(index);
    this.arr.updateValueAndValidity();
    this.validateScrollPresenceInside();
  }

  paymentCreateWs(typeToClose: boolean): void {
    this.disabledAfterCreate = true;

    if (!this.userService.appData.popUpShow.data.valid) {
      BrowserService.flattenControls(
        this.userService.appData.popUpShow.data
      ).forEach((ac) => ac.markAsDirty());
      this.disabledAfterCreate = false;
      return;
    }

    const parameters: any = {
      companyAccountId: this.selectedValue.companyAccountId,
      companyId: this.userService.appData.userData.companySelect.companyId,
      receiptTypeId: this.userService.appData.popUpShow.type,
      sourceProgramId: null,
      targetType: this.selectedValuePayment, // .toUpperCase(),
      deleteOldExcel: false,
      biziboxMutavId: this.userService.appData.popUpShow.data.get('ddMutav')
        .value
        ? this.userService.appData.popUpShow.data.get('ddMutav').value
            .biziboxMutavId
        : null,
      transes: this.arr.value.map((item) => {
        return {
          asmachta: item.asmachta,
          dueDate: item.dueDate.toISOString(),
          paymentDesc: item.paymentDesc,
          total: item.total,
          transTypeId: item.transTypeId ? item.transTypeId.transTypeId : ''
        };
      })
    };

    const transLocateDataIfSuccess = {
      companyAccountId: this.selectedValue.companyAccountId,
      date: new Date(
        Math.min(...this.arr.value.map((item) => item.dueDate.getTime()))
      )
    };

    this.sharedService.paymentCreate(parameters).subscribe(
      (response:any) => {
        this.disabledAfterCreate = false;
        const type = this.userService.appData.popUpShow.type;
        this.userService.appData.popUpShow = false;
        if (!typeToClose) {
          this.paymentCreate(type);
        }

        // this.filterDates(this.childDates.selectedPeriod);
        this.childDates.selectedRange
          .pipe(take(1))
          .subscribe(() =>
            this.filterDates(
              this.childDates.recalculateSelectedRangeIfNecessary()
            )
          );

        if (typeToClose) {
          this.togglePaymentCreateSuccessSnack(
            Object.assign(transLocateDataIfSuccess, {
              transId: response.body as string
            })
          );
        }
      },
      (err: HttpErrorResponse) => {
        this.disabledAfterCreate = false;
        if (err.error) {
          console.log('An error occurred:', err.error.message);
        } else {
          console.log(
            `Backend returned code ${err.status}, body was: ${err.error}`
          );
        }
      }
    );
  }

  private validateScrollPresenceInside(): void {
    setTimeout(() => {
      const scrollContainerHasScrollNow =
        this.scrollContainerInside !== null &&
        this.scrollContainerInside.nativeElement.scrollHeight >
          this.scrollContainerInside.nativeElement.clientHeight;
      if (this.scrollContainerInsideHasScroll !== scrollContainerHasScrollNow) {
        // console.log('validateScrollPresence: scrollContainerHasScroll > %o', scrollContainerHasScrollNow);
        this.scrollContainerInsideHasScroll = scrollContainerHasScrollNow;
      }
    });
  }

  rebuildForm() {
    this.userService.appData.popUpShow.data.reset({
      name: 'formGr'
    });
  }

  get arr(): FormArray {
    return this.userService.appData.popUpShow.data.get('arr') as FormArray;
  }

  paymentCreate(type: number) {
    if (this.userService.appData.userData.accountSelect.length === 1) {
      this.selectedValue = this.userService.appData.userData.accountSelect[0];
    } else {
      this.selectedValue = null;
    }
    this.selectedValuePayment = null;
    const defCategory = this.companyTransTypes.filter(
      (id) => id.transTypeId === 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d'
    );
    const obj = {
      dueDate: '',
      asmachta: '',
      transTypeId: defCategory,
      total: '',
      paymentDesc: ''
    };
    this.userService.appData.popUpShow = {
      type: type,
      styleClass: 'payment-create',
      header: true,
      body: true,
      footer: true,
      height: 540,
      width: 800,
      data: this.fb.group({
        name: 'formGr',
        arr: this.fb.array([this.fb.group(obj)]),
        ddAccountSelect: '',
        ddTypePayments: '',
        ddMutav: ''
      })
    };

    this.userService.appData.popUpShow.data
      .get('ddMutav')
      .valueChanges.pipe(filter((val) => !!val))
      .subscribe((val) => {
        this.userService.appData.popUpShow.data
          .get('arr')
          .controls.forEach((fc) => {
            fc.patchValue({
              paymentDesc: [
                'העברה ',
                this.userService.appData.popUpShow.type === 44 ? 'ל-' : 'מ-',
                val.accountMutavName
              ].join(''),
              transTypeId: this.companyTransTypes.find(
                (ctt) => ctt.transTypeId === val.transTypeId
              )
            });
          });
        this.arr.value.forEach((item, idx) => {
          this.searchAsmachta(item.asmachta, idx);
        });
      });

    this.userService.appData.popUpShow.data
      .get('ddAccountSelect')
      .valueChanges.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.arr.value.forEach((item, idx) => {
          this.searchAsmachta(item.asmachta, idx);
        });
      });
  }

  showMatch(accountUuid): boolean {
    if (
      this.userService &&
      this.userService.appData &&
      this.userService.appData.userData &&
      this.userService.appData.userData.accountSelect &&
      this.userService.appData.userData.accountSelect.length
    ) {
      return (
        this.userService.appData
          .moment()
          .diff(
            this.userService.appData.moment(
              this.getInfoAcc(accountUuid, 'balanceLastUpdatedDate')
            ),
            'days',
            true
          ) < 7
      );

      // const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 7);
      // today.setHours(0, 0, 0, 0);
      // if (this.getInfoAcc(accountUuid, 'balanceLastUpdatedDate') >= today.getTime()) {
      //     return true;
      // }
    }
    return false;
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.destroy();
  }

  searchAsmachta(val: any, index?: number) {
    const lastRow =
      this.userService.appData.popUpShow.data.value.arr[
        index !== undefined
          ? index
          : this.userService.appData.popUpShow.data.value.arr.length - 1
      ];
    const indexs =
      index !== undefined
        ? index
        : this.userService.appData.popUpShow.data.value.arr.length - 1;
    if (
      this.selectedValue !== null &&
      ((val && val.length) ||
        (this.userService.appData.popUpShow.data.get('ddMutav').value &&
          this.userService.appData.popUpShow.data.get('ddMutav').value !== '' &&
          this.userService.appData.popUpShow.data.get('ddMutav').value
            .biziboxMutavId) ||
        (Number(lastRow.total) !== 0 && lastRow.dueDate)) &&
      this.userService.appData.popUpShow.data.get('ddAccountSelect').value &&
      this.userService.appData.popUpShow.data.get('ddTypePayments').value ===
        'Checks'
    ) {
      const parameters: any = {
        companyAccountId:
          this.userService.appData.popUpShow.data.get('ddAccountSelect').value
            .companyAccountId,
        chequeNo: val && val.toString().length >= 4 ? Number(val) : null,
        companyId: this.userService.appData.userData.companySelect.companyId,
        total: lastRow.total ? Number(lastRow.total) : null,
        biziboxMutavId:
          this.userService.appData.popUpShow.data.get('ddMutav').value &&
          this.userService.appData.popUpShow.data.get('ddMutav').value !== '' &&
          this.userService.appData.popUpShow.data.get('ddMutav').value
            .biziboxMutavId
            ? this.userService.appData.popUpShow.data.get('ddMutav').value
                .biziboxMutavId
            : null,
        accountMutavName:
          this.userService.appData.popUpShow.data.get('ddMutav').value &&
          this.userService.appData.popUpShow.data.get('ddMutav').value !== '' &&
          this.userService.appData.popUpShow.data.get('ddMutav').value
            .accountMutavName
            ? this.userService.appData.popUpShow.data.get('ddMutav').value
                .accountMutavName
            : null,
        expense: this.userService.appData.popUpShow.type === 44,
        dueDate: lastRow.dueDate ? lastRow.dueDate.toISOString() : null
      };
      this.sharedService.existingCheck(parameters).subscribe(
        (response:any) => {
          const isCheckExist = response ? response['body'] : response;
          if (isCheckExist && isCheckExist.length) {
            this.arr.value[indexs].isCheckExist = isCheckExist[0];
            // this.arr.value.forEach((item, idx) => {
            //     if (item.asmachta === val) {
            //         this.arr.value[idx].isCheckExist = isCheckExist[0];
            //     }
            // });
          } else {
            this.arr.value[indexs].isCheckExist = undefined;
          }
        },
        (err: HttpErrorResponse) => {
          if (err.error) {
            console.log('An error occurred:', err.error.message);
          } else {
            console.log(
              `Backend returned code ${err.status}, body was: ${err.error}`
            );
          }
        }
      );
    }
  }

  onCheckNumberGuideHide(): void {
    if (this.checkNumberGuides.stopIt) {
      this.storageService.localStorageSetter(
        'checkNumberGuides.display',
        'false'
      );
    }
  }

  togglePaymentCreateSuccessSnack(transactionLocateData: {
    companyAccountId: string;
    date: Date;
    transId: string;
  }): void {
    // const snackRef: MatSnackBarRef<PaymentCreateSuccessComponent> = this.snackBar.openFromComponent(PaymentCreateSuccessComponent,
    //     {
    //         panelClass: 'snack-success',
    //         duration: 3000,
    //         verticalPosition: 'top',
    //         data: {
    //             onPaymentNavigationSelected: (function () {
    //                 snackRef.dismiss();
    //
    //                 this.storageService.sessionStorageSetter('details-filterAcc',
    //                     JSON.stringify([transactionLocateData.companyAccountId]));
    //                 this.storageService.sessionStorageSetter(TazrimDatesComponent.storageKey(this.route, 'details'),
    //                     JSON.stringify({
    //                         selectedValue: '2',
    //                         dates: {
    //                             calendarFrom: transactionLocateData.date,
    //                             calendarUntil: new Date(transactionLocateData.date.getFullYear(),
    //                                 transactionLocateData.date.getMonth() + 1, transactionLocateData.date.getDate())
    //                         }
    //                     }));
    //                 this.userService.appData.userData.transactionLocateId = transactionLocateData.transId;
    //                 this.router.navigate(['../details'], {queryParamsHandling: 'preserve', relativeTo: this.route});
    //
    //             }).bind(this)
    //         }
    //     });
    const _this = this;
    this.sharedComponent.topNotificationArea.toastTransactionCreationSuccess({
      duration: 3,
      onPaymentNavigationSelected: function () {
        // snackRef.dismiss();
        _this.storageService.sessionStorageSetter(
          'daily/*-filterAcc',
          JSON.stringify([transactionLocateData.companyAccountId])
        );
        _this.storageService.sessionStorageSetter(
          CashflowDateRangeSelectorComponent.storageKey(_this.route, 'details'),
          JSON.stringify(
            CustomPreset.createDatesPreset(
              transactionLocateData.date,
              transactionLocateData.date
            )
          )
          // JSON.stringify({
          //     selectedValue: '2',
          //     dates: {
          //         calendarFrom: transactionLocateData.date,
          //         calendarUntil: new Date(transactionLocateData.date.getFullYear(),
          //             transactionLocateData.date.getMonth() + 1, transactionLocateData.date.getDate())
          //     }
          // })
        );
        _this.userService.appData.userData.transactionLocateId =
          transactionLocateData.transId;
        _this.router.navigate(['../details'], {
          queryParamsHandling: 'preserve',
          relativeTo: _this.route
        });
      }.bind(this)
    });
  }

  navigateToMovementMatchingAt(accountId: string) {
    // this.router.navigate(['/cfl/cash-flow/bankmatch/bank'], {
    //     queryParamsHandling: 'preserve'
    // }).then((rslt) => {
    this.userService.appData.userData.bankMatchAccountIdNavigateTo = accountId;
    this.router.navigate(['../../bankmatch/bank'], {
      relativeTo: this.route,
      queryParamsHandling: 'preserve'
    });
  }

  // tableWrapScroll(event: any) {
  //     const scrollTop = event.target.scrollTop;
  //     this.accountHandlesRef.nativeElement.querySelectorAll('.tableWrapScroll').forEach((lst, ind) => {
  //         if (lst.scrollTop !== scrollTop) {
  //             lst.scrollTop = scrollTop;
  //         }
  //     });
  // }

  private reportParamsFromCurrentView(reportType: string = 'EXCEL'): any {
    const dataTableWithoutSummary = this.dataTableAll.filter(
      (acc:any) => acc.accountUuid
    );
    const dataTableForReport =
      dataTableWithoutSummary.length === 1
        ? dataTableWithoutSummary
        : this.dataTableAll;

    const accountData = dataTableForReport.map((acc:any) => {
      // debugger;
      if (!acc.accountUuid) {
        const accFirstSelected =
          this.userService.appData.userData.accountSelect[0];
        return {
          accountUuid: null,
          itra: accFirstSelected.isUpToDate
            ? this.sumPipe
                .transform(this.accountBalance, true)
                .replace(/[^\d-]/g, '')
            : null,
          creditLimit: this.sumPipe
            .transform(this.creditLimitAbs, true)
            .replace(/[^\d-]/g, ''),
          usedBalance: this.sumPipe
            .transform(this.balanceUse, true)
            .replace(/[^\d-]/g, ''),
          hovaNigrarot: this.sumPipe
            .transform(acc.hovaNigrarot, true)
            .replace(/[^\d-]/g, ''),
          zhutNigrarot: this.sumPipe
            .transform(acc.zhutNigrarot, true)
            .replace(/[^\d-]/g, '')
        };
      }
      const accSlctd = this.userService.appData.userData.accountSelect.find(
        (accS) => accS.companyAccountId === acc.accountUuid
      );
      const accountMessage = (
        $(
          '#item_' + acc.accountUuid + ' .topTitles > div:nth-child(2)'
        )[0] as HTMLElement
      ).innerText;
      return {
        accountUuid: acc.accountUuid,
        itra: acc.isUpToDate
          ? this.sumPipe
              .transform(accSlctd.accountBalance, true)
              .replace(/[^\d-]/g, '')
          : null,
        creditLimit: this.sumPipe
          .transform(Math.abs(accSlctd.creditLimit), true)
          .replace(/[^\d-]/g, ''),
        usedBalance: this.sumPipe
          .transform(accSlctd.balanceUse, true)
          .replace(/[^\d-]/g, ''),
        message: accountMessage.includes('לא צפויה') ? null : accountMessage
        // this.reportService.buildTazrimMessageFrom([accSlctd])
      };
    });

    return {
      additionalProperties: {
        reportDays: this.childDates.asText(),
        accountData: accountData,
        currency: this.currencySymbol.transform(
          this.userService.appData.userData.accountSelect[0].currency
        )
      },
      data: {
        report: dataTableForReport
      }
    };
  }

  exportTransactions(resultFileType: string): void {
    this.reportService
      .getReport(
        'TAZRIM_AGGREGATED',
        this.reportParamsFromCurrentView(),
        resultFileType,
        this.reportService.prepareFilename(...this.getFilename())
      )
      .pipe(take(1))
      .subscribe((rslt) => {});
  }

  private getFilename() {
    return [
      this.translate.instant('menu.customers.tazrim.daily'),
      'תצוגה מרוכזת',
      this.childDates.asText(),
      this.userService.appData.userData.companySelect.companyName
    ];
  }

  sendTransactions(mailAddress: string): void {
    const request = this.reportParamsFromCurrentView();
    Object.assign(request.additionalProperties, {
      mailTo: mailAddress,
      screenName: this.getFilename().join(' ')
    });
    this.reportService
      .emailReport('TAZRIM_AGGREGATED', request)
      .pipe(take(1))
      .subscribe((rslt) => {
        this.reportMailSubmitterToggle = false;
      });
  }

  printTransactions(): void {
    this.reportService
      .printReport(
        'TAZRIM_AGGREGATED',
        this.reportParamsFromCurrentView(),
        'PDF',
        this.getFilename().join(' ')
      )
      .pipe(take(1))
      .subscribe((rslt) => {});
  }
}
