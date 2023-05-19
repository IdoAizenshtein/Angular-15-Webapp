import {

  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  QueryList,
  Renderer2,
  ViewChild,
  ViewChildren,
  ViewEncapsulation
} from '@angular/core';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../../customers.component';
import { SortPipe } from '@app/shared/pipes/sort.pipe';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '../../../../customers.service';
import { UserService } from '@app/core/user.service';
import { FilterPipe } from '@app/shared/pipes/filter.pipe';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';

import { StorageService } from '@app/shared/services/storage.service';
import { ActivatedRoute, Router } from '@angular/router';
// import {UserDefaultsResolver} from '../../../user-defaults-resolver.service';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  tap
} from 'rxjs/operators';
import { DatePipe, WeekDay } from '@angular/common';
import { TodayRelativeHumanizePipe } from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {
  closestFutureDateNoWeekends,
  getDaysBetweenDates
} from '@app/shared/functions/getDaysBetweenDates';
import { compareDates } from '@app/shared/functions/compareDates';
import {
  Observable,
  Subject,
  Subscription,
  zip,
  of, combineLatest
} from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { BrowserService } from '@app/shared/services/browser.service';
import {
  EditingType,
  MovementEditorComponent
} from '@app/shared/component/movement-editor/movement-editor.component';
import { IsPeriodicTypePipe } from '@app/shared/pipes/isPeriodicTargetType.pipe';
import { TransTypesService } from '@app/core/transTypes.service';
import { ReloadServices } from '@app/shared/services/reload.services';
import {getPageHeight} from "@app/shared/functions/getPageHeight";

declare var $: any;

@Component({
  templateUrl: './tazrim-bankmatch-casflow.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  providers: [IsPeriodicTypePipe]
})
export class TazrimBankmatchCasflowComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  public filterInput = new FormControl();
  public queryString = '';
  public banktransForMatchAll: any;
  public banktransForMatch: any = [];
  public cashflowMatchAll: any;
  public cashflowMatch: any;
  public banktransForMatchReco: any = [];
  public paymentTypesArr: any[];
  private paymentTypesMap: { [key: string]: any };
  public cashPaymentTypesArr: any[];
  private cashPaymentTypesMap: { [key: string]: any };
  public typePaymentsDD: any[] = [];
  public loader = false;
  public loaderCash = false;
  public searchInDates = false;
  public searchableList = [
    'targetOriginalTotal',
    'transDateHumanizedStr',
    'targetName',
    'paymentDescTranslate'
  ];
  public filterPaymentTypesCategory: any = null;
  public cashFilterPaymentTypesCategory: any = null;
  public searchableListTypes = ['paymentDesc'];
  public sortPipeDir: any = null;
  public sortPipeDirCash: any = null;
  public sortPipeDirDate: any = null;
  public sortPipeDirCashDate: any = null;
  private readonly dtPipe: DatePipe;
  public hasRowOfDeleted = false;
  public showToastBeforeSend = false;
  public accountSelectOneNotUpdate: any = false;
  public popUpDeleteMatch: any = false;
  public cancelMatch: any = false;
  public checkAllRows: any = false;
  public checkAllRowsDisabled: any = false;
  public hasRowOfChecked: any = false;
  public showAdditionalItem: any;
  printWorker: boolean = false;
  private transactionAdditionalDetailId$ = new Subject<any>();
  transactionAdditionalDetails$: Observable<any>;
  transactionAdditionalDetailsSum: number;
  private lastAddionalsLoaded: any[];
  additionalCheckSelected: any = null;
  additionalBodyHasScroll = false;
  private showAdditionalTarget: any;
  @ViewChildren('checksChain', { read: ElementRef })
  checksChainItemsRef: QueryList<ElementRef>;
  @ViewChild('additionalsContainer', { read: ElementRef })
  additionalsContainer: ElementRef;
  @ViewChild('additionalBodyContainer') additionalBodyContainer: ElementRef;
  public currentTab = 1;
  private typePay: any[];
  private typeExpece: any[];
  @ViewChild('navBanks') navBanks: ElementRef;
  public daysToDelete:any = 3;
  public matchList: any;
  public tooltipElem: any = null;

  private transTypesSub: Subscription;
  companyTransTypes: any[] = [];
  public nav = {
    prev: false,
    next: false
  };
  createFromRecommendationData: {
    visible: boolean;
    title: string;
    form: any;
    loading: boolean | null;
    source: any | null;
  };
  @ViewChild('createFromRecommendationEditor')
  createFromRecommendationEditor: MovementEditorComponent;

  public deleteConfirmationPrompt: {
    visible: boolean;
    item: any;
    type: string | null;
    title: string;
    transName: string;
    options:
      | {
          label: string;
          value: number;
        }[]
      | null;
    optionSelected: number | null;
    processing: boolean;
    onApprove: () => void;
  };

  private readonly editorMultimodeForbiddenTypes = [
    'WIRE_TRANSFER',
    'CHEQUE',
    'OTHER',
    'BANK_CHEQUE',
    'ERP_CHEQUE'
  ];
  editMovementData: {
    visible: boolean;
    title: string;
    form: any;
    loading: boolean | null;
    source: any | null;
    origin: any | null;
    seriesSource: any | null;
  };
  @ViewChild('editMovementEditor') editMovementEditor: MovementEditorComponent;

  postponePrompt: {
    visible: boolean;
    processing: boolean | null;
    minDate: Date;
    selectedDate: Date | null;
    source: any | null;
    onApprove: () => void;
    onDateShortcutClick: (shotcutName: string) => void;
  } = {
    visible: false,
    processing: null,
    minDate: new Date(),
    selectedDate: null,
    source: null,
    onApprove: null,
    onDateShortcutClick: (shotcutName) => {
      const now = new Date();
      switch (shotcutName) {
        case 'nextWeek':
          this.postponePrompt.selectedDate = new Date(
            new Date().setDate(now.getDate() + 7)
          );
          break;
        case 'inTwoWeeks':
          this.postponePrompt.selectedDate = new Date(
            new Date().setDate(now.getDate() + 14)
          );
          break;
        case 'nextMonth':
          this.postponePrompt.selectedDate = new Date(
            new Date().setMonth(now.getMonth() + 1)
          );
          break;
      }

      if (this.postponePrompt.selectedDate) {
        this.postponePrompt.onApprove();
      }
    }
  };

  scrollRobot: any;

  readonly systemAutoMatchTypes = [
    'SOLEK_TAZRIM',
    'CCARD_TAZRIM',
    'LOAN_TAZRIM'
  ];
  readonly systemAutoMatchTooltip = [
    `תנועה זו תותאם באופן אוטומטי על ידי`,
    `<img fill ngSrc="/assets/images/logo2.png" style="height: 15px; width: auto;  position: relative;">`,
    `כאשר תופיע בחשבון בנק`
  ].join(' ');

  constructor(
    public translate: TranslateService,
    public override sharedComponent: SharedComponent,
    public userService: UserService,
    private sharedService: SharedService,
    private filterPipe: FilterPipe,
    private sortPipe: SortPipe,
    private dtHumanizePipe: TodayRelativeHumanizePipe,
    private renderer: Renderer2,
    private _element: ElementRef,
    public browserDetect: BrowserService,
    private storageService: StorageService,
    private router: Router,
    private route: ActivatedRoute,
    // private defaultsResolver: UserDefaultsResolver,
    public fb: FormBuilder,
    private isPeriodicType: IsPeriodicTypePipe,
    private transTypesService: TransTypesService
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
        this.filtersAllCash();
      });

    const paymentTypes =
      this.translate.translations[this.translate.currentLang].paymentTypes;
    if (paymentTypes) {
      for (const o in paymentTypes) {
        if (paymentTypes.hasOwnProperty(o)) {
          this.typePaymentsDD.push({ label: paymentTypes[o], value: o });
        }
      }
    }

    this.dtPipe = new DatePipe('en-IL');

    this.transTypesSub =
      this.transTypesService.selectedCompanyTransTypes.subscribe(
        (rslt) => (this.companyTransTypes = rslt)
      );
  }

  @HostListener('document:click', ['$event'])
  onClickOutside($event: any) {
    const elementRefInPath = BrowserService.pathFrom($event).find(
      (node) =>
        node &&
        node.className &&
        (node.className.includes('tooltipElem') ||
          node.className.includes('fas fa-ellipsis-v'))
    );
    if (!elementRefInPath && this.tooltipElem !== null) {
      this.tooltipElem = null;
    }
  }



  override reload() {
    console.log('reload child');
    this.ngOnInit();
  }

  ngOnInit(): void {
    this.transactionAdditionalDetails$ =
      this.transactionAdditionalDetailId$.pipe(
        distinctUntilChanged((a, b) => {
          if ('linkId' in a && 'linkId' in b) {
            return a.linkId === b.linkId;
          }
          if ('pictureLink' in a && 'pictureLink' in b) {
            return a.pictureLink === b.pictureLink;
          }
          return false;
        }),
        switchMap((item) => {
          if ('linkId' in item) {
            return this.sharedService.getPerutBankdetail(item);
          } else if ('pictureLink' in item) {
            return this.sharedService.getCheckDetail(item);
          }
        }),
        map((rslt) => rslt['body']),
        tap((adtnlsArr) => {
          this.lastAddionalsLoaded = adtnlsArr;
          let containerWidth = 660;
          let hasChecksChain = false;
          if (!adtnlsArr || adtnlsArr.length === 0) {
            this.transactionAdditionalDetailsSum = 0;
          } else {
            this.transactionAdditionalDetailsSum = adtnlsArr[0].hasOwnProperty(
              'transfertotal'
            )
              ? adtnlsArr.reduceRight(
                  (acc, item) => acc + item.transfertotal,
                  0
                )
              : adtnlsArr.reduceRight((acc, item) => acc + item.chequeTotal, 0);

            hasChecksChain =
              adtnlsArr[0].hasOwnProperty('chequeTotal') &&
              adtnlsArr.length > 1;
            this.additionalCheckSelected = hasChecksChain ? adtnlsArr[0] : null;
            containerWidth = hasChecksChain ? 1000 : 660;
          }

          this.renderer.setStyle(
            this.additionalsContainer.nativeElement,
            'width',
            containerWidth + 'px'
          );

          if (
            hasChecksChain &&
            this.checksChainItemsRef &&
            this.checksChainItemsRef.length > 0
          ) {
            this.checksChainItemsRef.first.nativeElement.focus();
          }

          this.rolloutAdditionalsPopup();
        })
      );
  }

  replace() {
    this.router.navigate(
      [
        !this.userService.appData.userData.accountant
          ? '/cfl/cash-flow/bankmatch/bank'
          : '/accountants/companies/cash-flow/bankmatch/bank'
      ],
      {
        queryParamsHandling: 'preserve',
        relativeTo: this.route
      }
    );
  }

  openPopEdit(): void {
    this.userService.appData.popUpShow = {
      styleClass: 'bankMatchRestartPop',
      height: 220,
      width: 350,
      header: true,
      body: true,
      footer: true,
      daysToDelete: this.daysToDelete
    };
  }

  bankMatchRestart() {
    if (this.userService.appData.popUpShow.daysToDelete !== '') {
      const parameters = {
        companyAccountId:
          this.userService.appData.userData.bankMatchAccountAcc
            .companyAccountId,
        restartDaysLeft: Number(this.userService.appData.popUpShow.daysToDelete)
      };
      this.sharedService
        .bankMatchRestart(parameters)
        .subscribe((response: any) => {
          this.userService.appData.popUpShow = false;
          this.daysToDelete = 3;
          this.startChild();
        });
    }
  }

  nextScroll(elem: any, reschedule?: boolean) {
    // this.scrollTo(elem, -100, 100);
    const navData = this.navigationData(elem);
    this.scrollListToIndex(elem, navData.nextIndex, {
      inline:
        document.defaultView.getComputedStyle(elem as HTMLElement).direction ===
        'rtl'
          ? 'start'
          : 'end',
      block: 'center',
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.checkNavScroll();
    }, 600);

    // debugger;
    if (navData.nextIndex === (elem as HTMLElement).children.length - 1) {
      this.scrollRobotStop();
    } else if (reschedule === true) {
      this.scrollRobotStop();
      this.scrollRobot = setInterval(() => {
        this.nextScroll(elem);
      }, 800);
    }
  }

  prevScroll(elem: any, reschedule?: boolean) {
    // this.scrollTo(elem, 100, 100);
    const navData = this.navigationData(elem);
    this.scrollListToIndex(elem, navData.prevIndex, {
      inline:
        document.defaultView.getComputedStyle(elem as HTMLElement).direction ===
        'rtl'
          ? 'end'
          : 'start',
      block: 'center',
      behavior: 'smooth'
    });

    setTimeout(() => {
      this.checkNavScroll();
    }, 600);

    if (navData.prevIndex === 0) {
      this.scrollRobotStop();
    } else if (reschedule === true) {
      this.scrollRobotStop();
      this.scrollRobot = setInterval(() => {
        this.prevScroll(elem);
      }, 800);
    }
  }
  scrollSubscription = Subscription.EMPTY;

  onScroll(scrollbarRef: any) {
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    this.scrollSubscription = scrollbarRef.scrolled.subscribe(() => {
      this.tooltipElem = null;
    });
  }

  getPageHeightFunc(value: any) {
    return getPageHeight(value)
  }
  checkNavScroll() {
    const elem = this.navBanks.nativeElement;
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
        if (browser === 'Chrome') {
          console.log('Edge Right');
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

  scrollRobotStop(evt?: Event) {
    // if (evt) {
    //     console.log('%o ---- stopping robot ------------', (evt.target as HTMLElement).id);
    // }
    if (this.scrollRobot) {
      clearInterval(this.scrollRobot);
      this.scrollRobot = null;
    }
  }

  // scrollTo(elem: any, xScroll: number, scrollDuration: any): void {
  //     const scrollStep: any = (xScroll / (scrollDuration / 15));
  //     const fullStep: any = elem.scrollLeft - ((xScroll < 0) ? Math.abs(xScroll) : -xScroll);
  //     const scrollInterval = setInterval(() => {
  //         if ((scrollStep > 0 && ((elem.scrollWidth - elem.offsetWidth) === elem.scrollLeft))
  //                 || scrollStep < 0 && elem.scrollLeft === 0) {
  //             clearInterval(scrollInterval);
  //         } else if ((scrollStep < 0 && elem.scrollLeft > fullStep) || (scrollStep > 0 && elem.scrollLeft < fullStep)) {
  //             elem.scrollBy(scrollStep, 0);
  //         } else {
  //             clearInterval(scrollInterval);
  //         }
  //     }, 15);
  // }

  setBankAcc(acc: any): void {
    this.userService.appData.userData.bankMatchAccountAcc = acc;
    setTimeout(() => {
      this.checkNavScroll();
    }, 600);
    this.startChild();
  }

  ngOnDestroy() {
    if (this.transTypesSub) {
      this.transTypesSub.unsubscribe();
    }
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    this.destroy();
  }

  resetVars(): void {
    setTimeout(() => {
      this.checkNavScroll();
    }, 600);
    this.loader = true;
    this.loaderCash = true;
    this.cancelMatch = false;
    this.currentTab = 1;
    this.queryString = '';
    this.accountSelectOneNotUpdate = false;
    this.banktransForMatchAll = null;
    this.cashflowMatchAll = null;
    this.hasRowOfDeleted = false;
    this.accountSelectOneNotUpdate = false;
    this.popUpDeleteMatch = false;
    this.cancelMatch = false;
    this.checkAllRows = false;
    this.hasRowOfChecked = false;

    this.filterPaymentTypesCategory = null;
    this.cashFilterPaymentTypesCategory = null;
  }

  startChild(): void {
    // debugger;
    this.resetVars();
    const trnsAcc = this.userService.appData.userData.accounts.find(
      (acc:any) =>
        acc.companyAccountId ===
        this.userService.appData.userData.bankMatchAccountAcc.companyAccountId
    );
    if (!compareDates(new Date(), new Date(trnsAcc.balanceLastUpdatedDate))) {
      this.accountSelectOneNotUpdate = getDaysBetweenDates(
        new Date(trnsAcc.balanceLastUpdatedDate),
        new Date()
      );
    }
    const parameters: any = {
      uuid: this.userService.appData.userData.bankMatchAccountAcc
        .companyAccountId
    };
    combineLatest(
    [
      this.sharedService.banktransForMatch(parameters),
      this.sharedService.cashflowMatch(parameters)
    ]
    ).subscribe(
      (response:any) => {
        this.loader = false;
        this.loaderCash = false;
        this.banktransForMatchAll = response[0]
          ? response[0]['body']
          : response[0];
        this.banktransForMatchAll = this.banktransForMatchAll.map((trns) =>
          this.setupItemView(trns)
        );
        this.cashflowMatchAll = response[1] ? response[1]['body'] : response[1];
        this.cashflowMatchAll = this.cashflowMatchAll.map((trns) =>
          this.setupItemCashView(trns)
        );
        this.filtersAll(false);
        this.filtersAllCash(false);
      }
    );

    this.scrollSelectedAccountIntoView();
  }

  filtersAll(priority?: any): void {
    this.banktransForMatch = [].concat(
      this.banktransForMatchReco.length && this.currentTab === 0
        ? this.banktransForMatchReco
        : this.banktransForMatchAll
    );
    if (!priority) {
      this.rebuildPaymentTypesMap(
        this.filterPipe.transform(
          this.banktransForMatch,
          this.filterPaymentTypesCategory,
          this.searchableListTypes
        )
      );
    }
    this.banktransForMatch = this.filterPipe.transform(
      this.banktransForMatch,
      this.filterPaymentTypesCategory,
      this.searchableListTypes
    );
    if (priority !== false) {
      if (priority === 2) {
        this.banktransForMatch = this.sortPipe.transform(
          this.banktransForMatch,
          'total',
          this.sortPipeDir
        );
      }
      if (priority === 1) {
        this.banktransForMatch = this.sortPipe.transform(
          this.banktransForMatch,
          'transDateTime',
          this.sortPipeDirDate
        );
      }
    }
    this.loader = false;
  }

  filtersAllCash(priority?: any): void {
    this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
      this.queryString
    );
    let cashflowMatchTmp = [].concat(this.cashflowMatchAll);
    cashflowMatchTmp = this.filterPipe.transform(
      cashflowMatchTmp,
      this.queryString,
      this.searchInDates
        ? [...this.searchableList, 'transDateStr']
        : this.searchableList
    );
    if (priority === false) {
      this.rebuildCashPaymentTypesMap(
        this.filterPipe.transform(
          cashflowMatchTmp,
          this.cashFilterPaymentTypesCategory,
          this.searchableListTypes
        )
      );
    }
    cashflowMatchTmp = this.filterPipe.transform(
      cashflowMatchTmp,
      this.cashFilterPaymentTypesCategory,
      this.searchableListTypes
    );
    if (priority !== false) {
      if (priority === 2) {
        cashflowMatchTmp = this.sortPipe.transform(
          cashflowMatchTmp,
          'targetOriginalTotal',
          this.sortPipeDirCash
        );
      }
      if (priority === 1) {
        cashflowMatchTmp = this.sortPipe.transform(
          cashflowMatchTmp,
          'targetOriginalDateTime',
          this.sortPipeDirCashDate
        );
      }
    }

    // this.calcRowGroup();
    const nigreret = cashflowMatchTmp.filter((rows) => rows.hovAvar === true);
    const future = cashflowMatchTmp.filter((rows) => rows.hovAvar === false);
    this.cashflowMatch = {
      nigreret: {
        parent: {
          opened: this.cashflowMatch
            ? this.cashflowMatch.nigreret.parent.opened
            : true
        },
        children: nigreret
      },
      future: {
        parent: {
          opened: this.cashflowMatch
            ? this.cashflowMatch.future.parent.opened
            : false
        },
        children: future
      }
    };

    this.loaderCash = false;
  }

  checkReco() {
    if (this.banktransForMatchReco.length) {
      this.currentTab = 0;
      this.filtersAll();
    }
  }

  trackById(index: number, row: any): string {
    return row.bankTransId;
  }

  sortPipeFilter(type: number): void {
    if (type === 2) {
      if (this.sortPipeDir && this.sortPipeDir === 'smaller') {
        this.sortPipeDir = 'bigger';
      } else {
        this.sortPipeDir = 'smaller';
      }
    }
    if (type === 1) {
      if (this.sortPipeDirDate && this.sortPipeDirDate === 'smaller') {
        this.sortPipeDirDate = 'bigger';
      } else {
        this.sortPipeDirDate = 'smaller';
      }
    }
    this.filtersAll(type);
  }

  sortPipeFilterCash(type: number): void {
    if (type === 2) {
      if (this.sortPipeDirCash && this.sortPipeDirCash === 'smaller') {
        this.sortPipeDirCash = 'bigger';
      } else {
        this.sortPipeDirCash = 'smaller';
      }
    }
    if (type === 1) {
      if (this.sortPipeDirCashDate && this.sortPipeDirCashDate === 'smaller') {
        this.sortPipeDirCashDate = 'bigger';
      } else {
        this.sortPipeDirCashDate = 'smaller';
      }
    }

    this.filtersAllCash(type);
  }

  private rebuildPaymentTypesMap(withOtherFiltersApplied: any[]): void {
    this.paymentTypesMap = withOtherFiltersApplied.reduce(
      (acmltr, dtRow) => {
        if (dtRow.paymentDesc && !acmltr[dtRow.paymentDesc]) {
          acmltr[dtRow.paymentDesc] = {
            val: dtRow.paymentDesc,
            id: dtRow.paymentDesc,
            checked:
              !Array.isArray(this.filterPaymentTypesCategory) ||
              this.filterPaymentTypesCategory.includes(dtRow.paymentDesc)
          };

          if (acmltr['all'].checked && !acmltr[dtRow.paymentDesc].checked) {
            acmltr['all'].checked = false;
          }
        }
        return acmltr;
      },
      {
        all: {
          val: this.translate.translations[this.translate.currentLang].filters
            .all,
          id: 'all',
          checked: true
        }
      }
    );
    this.paymentTypesArr = Object.values(this.paymentTypesMap);
  }

  private rebuildCashPaymentTypesMap(withOtherFiltersApplied: any[]): void {
    this.cashPaymentTypesMap = withOtherFiltersApplied.reduce(
      (acmltr, dtRow) => {
        if (dtRow.paymentDesc && !acmltr[dtRow.paymentDesc]) {
          acmltr[dtRow.paymentDesc] = {
            val: dtRow.paymentDesc,
            id: dtRow.paymentDesc,
            checked:
              !Array.isArray(this.cashFilterPaymentTypesCategory) ||
              this.cashFilterPaymentTypesCategory.includes(dtRow.paymentDesc)
          };

          if (acmltr['all'].checked && !acmltr[dtRow.paymentDesc].checked) {
            acmltr['all'].checked = false;
          }
        }
        return acmltr;
      },
      {
        all: {
          val: this.translate.translations[this.translate.currentLang].filters
            .all,
          id: 'all',
          checked: true
        }
      }
    );
    this.cashPaymentTypesArr = Object.values(this.cashPaymentTypesMap);
  }

  filterCategory(type: any) {
    this.filterPaymentTypesCategory = type.checked;
    this.filtersAll(true);
  }

  filterCashCategory(type: any) {
    this.cashFilterPaymentTypesCategory = type.checked;
    this.filtersAllCash(true);
  }

  private setupItemView(trns: any): void {
    // console.log('trns -> %o', trns);

    const trnsAcc = this.userService.appData.userData.accounts.find(
      (acc:any) => acc.companyAccountId === trns.companyAccountId
    );

    return Object.assign(trns, {
      account: trnsAcc,
      transDateFull: new Date(trns.transDate),
      transDateTime: new Date(trns.transDate).getTime(),
      paymentDescTranslate:
        this.translate.translations[this.translate.currentLang].paymentTypes[
          trns['paymentDesc']
        ],
      transDateHumanizedStr: this.dtHumanizePipe.transform(
        trns.transDate,
        'dd/MM/yy'
      ),
      transDateStr: this.dtPipe.transform(trns.transDate, 'dd/MM/yy')
    });
  }

  moveToNextAcc(): void {
    const idxActive =
      this.userService.appData.userData.bankMatchAccount.findIndex(
        (acc:any) =>
          acc.companyAccountId ===
          this.userService.appData.userData.bankMatchAccountAcc.companyAccountId
      );
    this.userService.appData.userData.bankMatchAccountAcc =
      this.userService.appData.userData.bankMatchAccount[idxActive + 1];
    this.startChild();
  }

  bankMatchDelete() {
    const parameters: any = {
      bankTransIds: this.popUpDeleteMatch.isItemDirect
        ? [this.popUpDeleteMatch.isItemDirect.bankTransId]
        : this.banktransForMatch
            .filter((row) => row.deleteRow)
            .map((id) => id.bankTransId),
      companyAccountId:
        this.userService.appData.userData.bankMatchAccountAcc.companyAccountId
    };
    this.sharedService
      .bankMatchDelete(parameters)
      .subscribe((response: any) => {
        this.popUpDeleteMatch = false;
        this.hasRowOfDeleted = false;
        this.startChild();
      });
  }

  openPopBankMatchDelete(item?: any) {
    this.popUpDeleteMatch = {
      styleClass: 'bankMatchRestartPop',
      height: 220,
      width: 350,
      isItemDirect: item,
      lenOfChecked: this.banktransForMatch.filter((row) => row.deleteRow).length
    };
    if (
      this.popUpDeleteMatch.lenOfChecked === 1 ||
      this.popUpDeleteMatch.isItemDirect
    ) {
      this.popUpDeleteMatch.desc = item
        ? item.transDescAzonly
        : this.banktransForMatch.filter((row) => row.deleteRow)[0]
            .transDescAzonly;
    }
  }

  private locateRelatively(el: any, target: any) {
    const adcW = parseInt(el.style.width, 10);
    const adcH = parseInt(el.style.height, 10);

    let adcX =
      target.offsetLeft -
      target.scrollLeft +
      target.clientLeft +
      target.offsetWidth / 2 -
      adcW / 2;
    if (adcX + adcW > target.offsetParent.clientWidth - 10) {
      adcX -= adcX + adcW - (target.offsetParent.clientWidth - 10);
    }
    el.style.left = adcX + 'px';
    el.children[0].style.left =
      target.offsetLeft - adcX - el.children[0].offsetWidth + 'px';
    let adcY = target.offsetTop + target.offsetHeight;
    if (
      adcY - adcH > 0 &&
      adcY +
        adcH -
        (target.offsetParent.scrollTop + target.offsetParent.clientHeight) >
        target.offsetParent.scrollTop - (adcY - adcH)
    ) {
      adcY = target.offsetTop - adcH - 4;
      el.classList.remove('arrow-up');
      el.classList.add('arrow-down');
      // el.children[0].style.top = adcH - 1.9 + 'px';
    } else {
      adcY += 4;
      el.classList.remove('arrow-down');
      el.classList.add('arrow-up');
      // el.children[0].style.top = el.children[0].offsetHeight * -1 + .9 + 'px';
    }

    // console.log(`offsetTop: %o, scrollTop: %o, clientTop: %o => y: %o, rect: %o, rect-parent: %o`,
    //   target.offsetTop, target.scrollTop, target.clientTop,
    //   target.offsetTop - target.scrollTop + target.clientTop,
    //   target.getBoundingClientRect(), target.offsetParent.getBoundingClientRect());

    // console.log(`x,y,w,h: %o,%o,%o,%o, offsetTop: %o, offsetLeft: %o,
    //         offsetParent.offsetHeight: %o, offsetParent.scrollTop: %o, offsetParent.scrollHeight: %o, clientBorderRect: %o,
    //         parent.clientBorderRect: %o`,
    //   adcX,
    //   adcY,
    //   adcW,
    //   adcH,
    //   target.offsetTop,
    //   target.offsetLeft,
    //   target.offsetParent.offsetHeight,
    //   target.offsetParent.scrollTop,
    //   target.offsetParent.scrollHeight,
    //   target.getBoundingClientRect(),
    //   target.offsetParent.getBoundingClientRect());

    // el.style.top = adcY + 'px';
  }

  showAdditionalAt(trns: any, target: HTMLElement): void {
    // console.log('onRowShowAdditional: %o, target: %o', $event, $event.target);
    // this.showAdditionalItem = $event.item;
    this.showAdditionalItem = trns;
    this.showAdditionalTarget = target;
    this.additionalCheckSelected = null;

    if (trns.linkId) {
      const req = Object.assign(Object.create(null), {
        linkId: trns.linkId,
        companyAccountId: trns.companyAccountId
      });
      this.transactionAdditionalDetailId$.next(req);
    } else if (trns.pictureLink) {
      const req = Object.assign(Object.create(null), {
        pictureLink: trns.pictureLink,
        companyAccountId: trns.companyAccountId,
        folderName:
          trns.account.bankId +
          '' +
          trns.account.bankSnifId +
          '' +
          trns.account.bankAccountId
      });
      this.transactionAdditionalDetailId$.next(req);
    }

    this.rolloutAdditionalsPopup();
  }

  private rolloutAdditionalsPopup(): void {
    setTimeout(() => {
      console.log('rolling out.... %o', this.additionalsContainer);
      this.additionalsContainer.nativeElement.focus({ preventScroll: true });
      this.additionalsContainer.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 0);
  }

  checkImageSourceFrom(checkAdditional: any): string {
    if (checkAdditional.image) {
      return 'data:image/jpg;base64,' + checkAdditional.image;
    }
    if (checkAdditional.chequeBankNumber) {
      return `/assets/images/bank${checkAdditional.chequeBankNumber}.png`;
    }
    return '';
  }

  hideAdditional(): void {
    this.showAdditionalItem = null;
    this.additionalCheckSelected = null;
  }

  stepAdditionalCheckRow(dir: number, additionalDetails: any[]): boolean {
    console.log(
      'stepAdditionalCheckRow ==> dir: %o, additionalDetails: %o',
      dir,
      additionalDetails
    );
    if (this.additionalCheckSelected) {
      let indexToSelect =
        additionalDetails.indexOf(this.additionalCheckSelected) + dir;
      if (indexToSelect === additionalDetails.length) {
        indexToSelect = 0;
      } else if (indexToSelect < 0) {
        indexToSelect = additionalDetails.length - 1;
      }
      this.additionalCheckSelected = additionalDetails[indexToSelect];
      const slctdNative = this.checksChainItemsRef.find(
        (item, idx) => idx === indexToSelect
      ).nativeElement;
      slctdNative.focus({ preventScroll: true });
      slctdNative.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'center'
      });
      return false;
    }
    return true;
  }

  checkAllRowsFunc() {
    if (this.cancelMatch) {
      this.cancelMatch = false;
    }
    this.cashflowMatchAll.forEach((item) => {
      item.checkRow = this.checkAllRows;
    });
    this.hasRowOfChecked = this.cashflowMatchAll.some((item) => item.checkRow);

    if (this.banktransForMatchReco.length && this.currentTab === 0) {
      this.hasRowOfDeleted = this.banktransForMatchReco.some(
        (item) => item.deleteRow
      );
    } else {
      this.hasRowOfDeleted = this.banktransForMatchAll.some(
        (item) => item.deleteRow
      );
    }
    this.calcRowChecked();
  }

  checkDeleted(itemRow: any) {
    if (this.cancelMatch) {
      this.cancelMatch = false;
    }
    this.hasRowOfChecked = this.cashflowMatchAll.some((item) => item.checkRow);
    if (this.banktransForMatchReco.length && this.currentTab === 0) {
      this.banktransForMatchReco.forEach((item) => {
        if (item.bankTransId === itemRow.bankTransId) {
          item.deleteRow = itemRow.deleteRow;
        }
      });
      this.hasRowOfDeleted = this.banktransForMatchReco.some(
        (item) => item.deleteRow
      );
    } else {
      this.banktransForMatchAll.forEach((item) => {
        if (item.bankTransId === itemRow.bankTransId) {
          item.deleteRow = itemRow.deleteRow;
        }
      });
      this.hasRowOfDeleted = this.banktransForMatchAll.some(
        (item) => item.deleteRow
      );
    }
    this.calcRowChecked();
  }

  checkChecked(itemRow: any) {
    if (this.cancelMatch) {
      this.cancelMatch = false;
    }
    this.cashflowMatchAll.forEach((item) => {
      if (item.targetId === itemRow.targetId) {
        item.checkRow = itemRow.checkRow;
      }
    });
    this.hasRowOfChecked = this.cashflowMatchAll.some((item) => item.checkRow);
    if (this.hasRowOfChecked) {
      const objectTypePay = {};
      const objectTypeExpece = {};
      this.cashflowMatchAll
        .filter((item) => item.checkRow)
        .forEach((thisItem) => {
          objectTypePay[thisItem.paymentDesc] = thisItem.paymentDesc;
          objectTypeExpece[thisItem.expence] = thisItem.expence;
        });
      this.typePay = Object.values(objectTypePay);
      this.typeExpece = Object.values(objectTypeExpece);
      this.banktransForMatchReco = []
        .concat(this.banktransForMatchAll)
        .filter((item) => {
          return (
            this.typePay.some((row) => row === item.paymentDesc) &&
            this.typeExpece.some((row) => row === item.hova)
          );
        });
      if (this.banktransForMatchReco.length) {
        this.currentTab = 0;
      } else {
        this.currentTab = 1;
      }
    } else {
      this.banktransForMatchReco = [];
      this.currentTab = 1;
    }
    if (this.banktransForMatchReco.length && this.currentTab === 0) {
      this.hasRowOfDeleted = this.banktransForMatchReco.some(
        (item) => item.deleteRow
      );
    } else {
      this.hasRowOfDeleted = this.banktransForMatchAll.some(
        (item) => item.deleteRow
      );
    }
    this.calcRowChecked();
  }

  private setupItemCashView(trns: any): void {
    // console.log('trns -> %o', trns);

    return Object.assign(trns, {
      transDateFull: new Date(trns.targetOriginalDate),
      targetOriginalDateTime: new Date(trns.targetOriginalDate).getTime(),
      paymentDescTranslate:
        this.translate.translations[this.translate.currentLang].paymentTypes[
          trns['paymentDesc']
        ],
      transDateHumanizedStr: this.dtHumanizePipe.transform(
        trns.targetOriginalDate,
        'dd/MM/yy'
      ),
      transDateStr: this.dtPipe.transform(trns.targetOriginalDate, 'dd/MM/yy')
    });
  }

  // private calcRowGroup(): void {
  //     const nigreret = this.cashflowMatch.filter((rows) => rows.hovAvar === true);
  //     const future = this.cashflowMatch.filter((rows) => rows.hovAvar === false);
  //     this.cashflowMatch = {
  //         nigreret: {
  //             parent: {
  //                 opened: this.cashflowMatch && this.cashflowMatch.nigreret ? this.cashflowMatch.nigreret.opened : true
  //             },
  //             children: nigreret
  //         },
  //         future: {
  //             parent: {
  //                 opened: this.cashflowMatch && this.cashflowMatch.future ? this.cashflowMatch.future.opened : false
  //             },
  //             children: future
  //         },
  //     };
  // }

  private calcRowChecked(): void {
    let banktransForMatchLength;
    if (this.banktransForMatchReco.length && this.currentTab === 0) {
      banktransForMatchLength = this.banktransForMatchReco.filter((rows) => {
        rows.checkDisabled = false;
        return rows.deleteRow === true;
      });
    } else {
      banktransForMatchLength = this.banktransForMatchAll.filter((rows) => {
        rows.checkDisabled = false;
        return rows.deleteRow === true;
      });
    }

    const cashflowMatchLength = this.cashflowMatchAll.filter((rows) => {
      rows.checkDisabled = false;
      return rows.checkRow === true;
    });

    this.checkAllRowsDisabled = false;
    if (banktransForMatchLength.length > 1) {
      this.checkAllRowsDisabled = true;
    }
    if (
      banktransForMatchLength.length > 1 &&
      cashflowMatchLength.length === 1
    ) {
      this.cashflowMatchAll.forEach((rows, idx) => {
        if (!rows.checkRow) {
          this.cashflowMatchAll[idx].checkDisabled = true;
        }
      });
    }
    if (
      cashflowMatchLength.length > 1 &&
      banktransForMatchLength.length === 1
    ) {
      if (this.banktransForMatchReco.length && this.currentTab === 0) {
        this.banktransForMatchReco.forEach((rows, idx) => {
          if (!rows.deleteRow) {
            this.banktransForMatchReco[idx].checkDisabled = true;
          }
        });
      } else {
        this.banktransForMatchAll.forEach((rows, idx) => {
          if (!rows.deleteRow) {
            this.banktransForMatchAll[idx].checkDisabled = true;
          }
        });
      }
    }

    if (
      cashflowMatchLength.length === 1 &&
      banktransForMatchLength.length === 1
    ) {
      this.matchList = {
        array: [
          {
            targetOriginalTotal: cashflowMatchLength[0].targetOriginalTotal,
            targetOriginalDate: cashflowMatchLength[0].targetOriginalDate,
            bankTransId: banktransForMatchLength[0].bankTransId,
            dateFrom: cashflowMatchLength[0].dateFrom,
            dateTill: cashflowMatchLength[0].dateTill,
            note: cashflowMatchLength[0].note,
            searchkeyId: banktransForMatchLength[0].searchkeyId
              ? banktransForMatchLength[0].searchkeyId
              : null,
            hovAvar: cashflowMatchLength[0].hovAvar,
            targetId: cashflowMatchLength[0].targetId,
            targetName: cashflowMatchLength[0].targetName,
            targetPaymentTypeId: cashflowMatchLength[0].targetPaymentTypeId,
            targetTypeId: cashflowMatchLength[0].targetTypeId,
            transId: cashflowMatchLength[0].transId,
            // 'note': cashflowMatchLength[0].note,
            transTypeId: cashflowMatchLength[0].transTypeId
          }
        ],
        companyId: this.userService.appData.userData.companySelect.companyId
      };
    } else if (
      cashflowMatchLength.length > 1 &&
      banktransForMatchLength.length === 1
    ) {
      this.matchList = {
        array: cashflowMatchLength.map((rows) => {
          return {
            targetOriginalTotal: rows.targetOriginalTotal,
            targetOriginalDate: rows.targetOriginalDate,
            bankTransId: banktransForMatchLength[0].bankTransId,
            searchkeyId: banktransForMatchLength[0].searchkeyId
              ? banktransForMatchLength[0].searchkeyId
              : null,
            dateFrom: rows.dateFrom,
            dateTill: rows.dateTill,
            note: rows.note,
            hovAvar: rows.hovAvar,
            targetId: rows.targetId,
            targetName: rows.targetName,
            targetPaymentTypeId: rows.targetPaymentTypeId,
            targetTypeId: rows.targetTypeId,
            transId: rows.transId,
            //    'note': rows.note,
            transTypeId: rows.transTypeId
          };
        }),
        companyId: this.userService.appData.userData.companySelect.companyId
      };
    } else if (
      cashflowMatchLength.length === 1 &&
      banktransForMatchLength.length > 1
    ) {
      this.matchList = {
        array: banktransForMatchLength.map((rows) => {
          return {
            targetOriginalTotal: cashflowMatchLength[0].targetOriginalTotal,
            targetOriginalDate: cashflowMatchLength[0].targetOriginalDate,
            bankTransId: rows.bankTransId,
            searchkeyId: rows.searchkeyId ? rows.searchkeyId : null,
            dateFrom: cashflowMatchLength[0].dateFrom,
            dateTill: cashflowMatchLength[0].dateTill,
            note: cashflowMatchLength[0].note,
            hovAvar: cashflowMatchLength[0].hovAvar,
            targetId: cashflowMatchLength[0].targetId,
            targetName: cashflowMatchLength[0].targetName,
            targetPaymentTypeId: cashflowMatchLength[0].targetPaymentTypeId,
            targetTypeId: cashflowMatchLength[0].targetTypeId,
            transId: cashflowMatchLength[0].transId,
            //                        'note': cashflowMatchLength[0].note,
            transTypeId: cashflowMatchLength[0].transTypeId
          };
        }),
        companyId: this.userService.appData.userData.companySelect.companyId
      };
    } else {
      this.matchList = undefined;
    }

    // if (this.matchList) {
    //     this.matchList.selectedCount = cashflowMatchLength.length + banktransForMatchLength.length;
    //
    //     this.matchList.selectedTransTypeIds = [...cashflowMatchLength, ...banktransForMatchLength]
    //         .reduce((acmltr, tr) => {
    //             if (tr.transTypeId && tr.transTypeId !== 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d') {
    //                 acmltr.add(tr.transTypeId);
    //             }
    //             return acmltr;
    //         }, new Set());
    //
    //     const setOfCashflowMatchMarked = [...cashflowMatchLength]
    //         .reduce((acmltr, tr) => {
    //             return [tr.biziboxMutavId, ...(!!tr.mutavArray ? tr.mutavArray.map(mt => mt.biziboxMutavId) : [])]
    //                 .filter(mtvId => !!mtvId)
    //                 .reduce((acmltr0, mtvId) => acmltr0.add(mtvId), acmltr);
    //         }, new Set());
    //     const setOfBanktransForMatchMarked = [...banktransForMatchLength]
    //         .reduce((acmltr, tr) => {
    //             return [tr.biziboxMutavId, ...(!!tr.mutavArray ? tr.mutavArray.map(mt => mt.biziboxMutavId) : [])]
    //                 .filter(mtvId => !!mtvId)
    //                 .reduce((acmltr0, mtvId) => acmltr0.add(mtvId), acmltr);
    //         }, new Set());
    //     if (setOfCashflowMatchMarked.size && setOfBanktransForMatchMarked.size) {
    // this.matchList.selectedUniqueBeneficiaryKeys =
    //     new Set(Array.from(setOfCashflowMatchMarked).concat(Array.from(setOfBanktransForMatchMarked)));
    //     } else {
    //         this.matchList.selectedUniqueBeneficiaryKeys = new Set([]);
    //     }
    // }

    this.filtersAll();
  }

  bankMatch(): void {
    this.cancelMatch = true;
    this.showToastBeforeSend = true;
    setTimeout(() => {
      if (this.showToastBeforeSend) {
        this.sharedService
          .bankMatch(this.matchList)
          .subscribe((response: any) => {
            this.matchList = undefined;
            this.showToastBeforeSend = false;
            this.startChild();
          });
      }
    }, 2000);
  }

  openTooltip(event: any, height: number, item: string, itemFull?: any): any {
    if (this.tooltipElem && this.tooltipElem.transId === item) {
      this.tooltipElem = null;
      return;
    }
    let y = event.y - 60;
    let arrow = 'up';
    if (height === 82) {
      if (window.screen.height - event.screenY < 220) {
        y = event.y - 170;
        arrow = 'bottom';
      }
    } else {
      if (window.screen.height - event.screenY < 390) {
        y = event.y - 330;
        arrow = 'bottom';
      }
    }
    this.tooltipElem = {
      x: event.x - 30,
      y: y,
      height: height,
      arrow: arrow,
      transId: item,
      hidePostponeAction: itemFull
        ? this.systemAutoMatchTypes.includes(itemFull.targetTypeName)
        : false
    };

    this.createFromRecommendationDataSetup(height === 82 ? itemFull : null);
    this.editMovementDataSetup(height === 235 ? itemFull : null);
    this.deleteOperationDataSetup(height === 235 ? itemFull : null);
    this.postponeMovementDataSetup(height === 235 ? itemFull : null);
  }

  private createFromRecommendationDataSetup(item: any): void {
    console.log('createFromRecommendationDataSetup called for %o', item);

    if (item === null) {
      this.createFromRecommendationData = null;
      return;
    }

    const mvmntType = this.translate.instant(
      'actions.' + (item.hova ? 'addFixedExpense' : 'addFixedIncome')
    );
    this.createFromRecommendationData = {
      title: this.translate.instant('formFixedMovement.createTitle', {
        movementType: mvmntType
      }),
      source: {
        autoUpdateTypeName: 'AVG_3_MONTHS',
        companyAccountId:
          item.companyAccountId ||
          this.userService.appData.userData.bankMatchAccountAcc
            .companyAccountId,
        expence: item.hova,
        expirationDate: null,
        paymentDesc: 'BankTransfer',
        targetType: item.targetTypeName || 'CYCLIC_TRANS',
        total: item.total || item.targetOriginalTotal,
        transDate: item.transDate,
        transFrequencyName: 'MONTH',
        transId: item.bankTransId,
        hamlazaLoMutavId: item.hamlazaLoMutavId,
        transName: item.targetName || item.transDescAzonly,
        transTypeId: item.transTypeId // ,
        // updatedBy: string
      },
      form: new FormGroup({}),
      visible: false,
      loading: false
    };
  }

  onSubmitCreateFromRecommendation(): void {
    if (!this.createFromRecommendationData.form.valid) {
      BrowserService.flattenControls(
        this.createFromRecommendationData.form
      ).forEach((ac) => ac.markAsDirty());
      return;
    }

    // debugger;
    const dataToSubmit = Object.assign(
      // this.createMovementData.source,
      this.createFromRecommendationEditor.result,
      {
        bankTransIds: [this.createFromRecommendationData.source.transId],
        expence: this.createFromRecommendationData.source.expence,
        hamlazaLoMutavId:
          this.createFromRecommendationData.source.hamlazaLoMutavId
      }
    );

    this.createFromRecommendationData.loading = true;
    if (dataToSubmit.transFrequencyName === 'WEEK' && dataToSubmit.transDate) {
      try {
        dataToSubmit.transDate = new Date(dataToSubmit.transDate);
      } catch (e) {}
      dataToSubmit['frequencyDay'] = (
        WeekDay[dataToSubmit.transDate.getDay()] as string
      ).toUpperCase();
    }
    this.sharedService.recommendationApprove(dataToSubmit).subscribe((rslt) => {
      console.log('submit finished! got %o', rslt);
      this.createFromRecommendationData.loading = false;
      if (!rslt.error) {
        this.createFromRecommendationData.visible = false;
        this.createFromRecommendationEditor.reset();
        this.startChild();
      }
    });
    // console.log('submit called! got %o', dataToSubmit);
  }

  deleteOperationDataSetup(item: any): void {
    console.log('delete prompt called for %o', item);

    if (item === null) {
      this.deleteConfirmationPrompt = null;
      return;
    }

    const itemType =
      ([
        'CHEQUE',
        'WIRE_TRANSFER',
        'OTHER',
        'BANK_CHEQUE',
        'ERP_CHEQUE'
      ].includes(item.targetTypeName)
        ? 'EXPECTED'
        : false) ||
      ([
        'SOLEK_TAZRIM',
        'CCARD_TAZRIM',
        'LOAN_TAZRIM',
        'CYCLIC_TRANS',
        'DIRECTD'
      ].includes(item.targetTypeName)
        ? 'FIXED'
        : null);

    const options = this.translate.instant(
      `actions.deleteMovement.body.${itemType}.options`
    );

    this.deleteConfirmationPrompt = {
      visible: false,
      item: item,
      transName: item.targetName,
      type: itemType,
      title: this.translate.instant('actions.deleteMovement.titlePtrn', {
        itemType: this.translate.instant(
          `actions.deleteMovement.body.${itemType}.title`
        )
      }),
      options: Array.isArray(options)
        ? options.map((opt, idx) => {
            return {
              label: opt,
              value: idx
            };
          })
        : null,
      optionSelected: 0,
      processing: false,
      onApprove: () => {
        this.deleteConfirmationPrompt.processing = true;
        this.sharedService
          .deleteOperation({
            params: {
              companyAccountId:
                item.companyAccountId ||
                this.userService.appData.userData.bankMatchAccountAcc
                  .companyAccountId,
              transId:
                this.deleteConfirmationPrompt.optionSelected === 0
                  ? item.targetId
                  : item.transId,
              dateFrom: item.dateFrom
            },
            editType:
              this.deleteConfirmationPrompt.optionSelected === 1
                ? EditingType.Series
                : EditingType.Single,
            operationType: item.targetTypeName
          })
          .subscribe(
            () => {
              if (
                this.deleteConfirmationPrompt &&
                this.deleteConfirmationPrompt.item === item
              ) {
                this.deleteConfirmationPrompt = null;
              }
              // const indexRow = this.dataTableAll['cashFlowDetails']
              //      .findIndex((element) => element.transId === item.transId);
              // this.dataTableAll['cashFlowDetails'].splice(indexRow, 1);
              // this.filtersAll();
              this.startChild();
            },
            (err: HttpErrorResponse) => {
              if (
                this.deleteConfirmationPrompt &&
                this.deleteConfirmationPrompt.item === item
              ) {
                this.deleteConfirmationPrompt.processing = false;
              }
              if (err.error) {
                console.log('An error occurred: %o', err.error.message);
              } else {
                console.log(
                  `Backend returned code ${err.status}, body was: ${err.error}`
                );
              }
            }
          );
      }
    };
  }

  private editMovementDataSetup(item: any): void {
    console.log('editMovementDataSetup called for %o', item);

    if (item === null) {
      this.editMovementData = null;
      return;
    }

    // const mvmntType = this.translate.instant('actions.'
    //     + (item.hova ? 'addFixedExpense' : 'addFixedIncome'));
    this.editMovementData = {
      // title: this.translate.instant('formFixedMovement.createTitle', {
      //     movementType: mvmntType
      // }),
      title: this.translate.instant('formFixedMovement.editTitle', {
        movementType: this.isPeriodicType.transform(item.targetTypeName)
          ? item.expence === true
            ? this.translate.instant('actions.addFixedExpense')
            : this.translate.instant('actions.addFixedIncome')
          : item.expence === true
          ? this.translate.instant('titles.expectedExpense')
          : this.translate.instant('titles.expectedIncome')
      }),
      origin: item,
      source: {
        autoUpdateTypeName: 'AVG_3_MONTHS',
        companyAccountId:
          item.companyAccountId ||
          this.userService.appData.userData.bankMatchAccountAcc
            .companyAccountId,
        companyId: this.userService.appData.userData.companySelect.companyId,
        expence: item.expence,
        expirationDate: null,
        paymentDesc: item.paymentDesc || 'BankTransfer',
        targetType: item.targetTypeName,
        total: item.total || item.targetOriginalTotal,
        transDate: item.transDate || item.targetOriginalDate,
        transFrequencyName: 'MONTH',
        transId: item.transId,
        transName: item.targetName || item.transDescAzonly,
        transTypeId: item.transTypeId,
        asmachta: item.targetAsmachta
        // updatedBy: string
      },
      form: new FormGroup({}),
      visible: false,
      loading: false,
      seriesSource: null
    };
  }

  editMovementShow() {
    if (this.editMovementData.source) {
      this.editMovementEditor.allowMultimode =
        !this.editorMultimodeForbiddenTypes.includes(
          this.editMovementData.source.targetType
        );
      this.editMovementEditor.mode = this.editMovementEditor.allowMultimode
        ? EditingType.Single
        : EditingType.Series;

      if (
        this.isPeriodicType.transform(this.editMovementData.source.targetType)
      ) {
        this.editMovementData.loading = true;
        // if (['SOLEK_TAZRIM', 'CCARD_TAZRIM', 'LOAN_TAZRIM', 'CYCLIC_TRANS'].includes(this.editMovementData.source.targetType)) {
        combineLatest(
            [
              this.sharedService.getCyclicTransactionSingle({
                companyId:
                this.userService.appData.userData.companySelect.companyId,
                companyAccountId:
                    this.editMovementData.origin.companyAccountId ||
                    this.userService.appData.userData.bankMatchAccountAcc
                        .companyAccountId,
                transId: this.editMovementData.origin.targetId,
                targetType: this.editMovementData.origin.targetTypeName
              }),
              this.editMovementData.source.targetType === 'CYCLIC_TRANS' &&
              this.editMovementData.origin.unionId &&
              !Array.isArray(this.editMovementData.source.mutavArray)
                  ? this.sharedService.getUnionBankdetail({
                    companyId:
                    this.userService.appData.userData.companySelect.companyId,
                    dateFrom:
                        this.editMovementData.origin.kvuaDateFrom ||
                        this.editMovementData.source.transDate,
                    transId:
                        this.editMovementData.source.transId ||
                        this.editMovementData.origin.targetId
                  })
                  : of(null)
            ]



        ).subscribe(([rslt, unionDataRslt]:any) => {
          this.editMovementData.loading = false;
          if (
            !rslt.error &&
            rslt.body &&
            Array.isArray(rslt.body.transes) &&
            rslt.body.transes.length > 0
          ) {
            this.editMovementData.seriesSource = rslt.body.transes[0];
          }
          if (
            unionDataRslt &&
            !unionDataRslt.error &&
            Array.isArray(unionDataRslt.body)
          ) {
            this.editMovementData.source = Object.assign(
              JSON.parse(JSON.stringify(this.editMovementData.source)),
              {
                mutavArray: unionDataRslt.body
              }
            );
          }
        });
      }
    }

    this.editMovementData.visible = true;
  }

  onSubmitEditMovement(): void {
    if (!this.editMovementData.form.valid) {
      BrowserService.flattenControls(this.editMovementData.form).forEach((ac) =>
        ac.markAsDirty()
      );
      return;
    }

    const dataToSubmit = this.editMovementEditor.result; // Object.assign(this.editMovementData.source, this.editMovementEditor.result);

    this.editMovementData.loading = true;
    let updateObs;
    if (
      this.editMovementEditor.mode === EditingType.Single ||
      !this.editMovementEditor.allowMultimode
    ) {

      updateObs = this.sharedService.updateSingleTransactionFromBankMatch(
        this.editMovementData.source.targetType,
        this.prepareSingleForSending(dataToSubmit, this.editMovementData.origin)
      );
    } else {
      updateObs = this.sharedService.updateCyclicTransaction(
        this.editMovementEditor.mode,
        this.editMovementData.source.targetType,
        dataToSubmit
      );
    }

    updateObs.subscribe((rslt) => {
      console.log('submit finished! got %o', rslt);
      this.editMovementData.loading = false;
      if (!rslt.error) {
        this.startChild();
        this.editMovementData.visible = false;
        this.editMovementEditor.reset();
      }
    });
  }

  private postponeMovementDataSetup(item: any) {
    if (item === null) {
      this.postponePrompt.source = null;
      this.postponePrompt.selectedDate = null;
    } else {
      this.postponePrompt.source = item;
      this.postponePrompt.selectedDate = closestFutureDateNoWeekends(
        Math.max(
          new Date().getTime(),
          item.targetOriginalDate || 0,
          item.transDate || 0
        )
      );
      this.postponePrompt.onApprove = () => {
        const dataToSubmit = JSON.parse(
          JSON.stringify(this.postponePrompt.source)
        );
        dataToSubmit.targetOriginalDate = this.postponePrompt.selectedDate;
        // new Date(Date.UTC(
        //     this.postponePrompt.selectedDate.getFullYear(),
        //     this.postponePrompt.selectedDate.getMonth(),
        //     this.postponePrompt.selectedDate.getDate(),
        //     0, 0, 0, 0));
        if (!('companyAccountId' in dataToSubmit)) {
          dataToSubmit.companyAccountId =
            this.userService.appData.userData.bankMatchAccountAcc.companyAccountId;
        }
        if (
          'targetOriginalTotal' in dataToSubmit &&
          dataToSubmit.targetOriginalTotal !== null
        ) {
          dataToSubmit.targetOriginalTotal = Math.abs(
            dataToSubmit.targetOriginalTotal
          );
        }

        // debugger;
        const targetType =
          this.postponePrompt.source.targetTypeName ||
          this.postponePrompt.source.targetType;

        this.postponePrompt.processing = true;

        this.sharedService
          .updateSingleTransactionFromBankMatch(targetType, dataToSubmit)
          .subscribe((rslt) => {
            console.log('submit finished! got %o', rslt);
            this.postponePrompt.processing = false;
            if (!rslt.error) {
              this.startChild();
              this.postponePrompt.visible = false;
            }
          });
        // this.sharedService.updateCyclicTransaction(EditingType.Single,
        //     targetType,
        //     dataToSubmit)
        //     .subscribe((rslt) => {
        //         console.log('submit finished! got %o', rslt);
        //         this.postponePrompt.processing = false;
        //         if (!rslt.error) {
        //             this.startChild();
        //             this.postponePrompt.visible = false;
        //         }
        //     });
      };
    }

    this.postponePrompt.visible = false;
    this.postponePrompt.processing = false;
  }

  private navigationData(list: HTMLElement): {
    prevIndex: number;
    nextIndex: number;
  } {
    const parentRect: ClientRect = list.getBoundingClientRect();
    const childrenRects: ClientRect[] = Array.from(list.children).map((li) =>
      li.getBoundingClientRect()
    );

    // console.log('parent -> %o, children -> %o', parentRect, childrenRects);

    const fullyVisible = childrenRects
      .filter((chr) => {
        // debugger;
        return (
          (parentRect.left <= chr.left ||
            Math.abs(parentRect.left - chr.left) <= 1) &&
          chr.left < parentRect.right &&
          parentRect.left < chr.right &&
          (chr.right <= parentRect.right ||
            Math.abs(parentRect.right - chr.right) <= 1) &&
          chr.top >= parentRect.top &&
          chr.bottom <= parentRect.bottom
        );
      })
      .map((chr) => childrenRects.indexOf(chr));
    // console.log('fullyVisible -> %o', fullyVisible);

    const result = {
      prevIndex: fullyVisible[0] > 0 ? fullyVisible[0] - 1 : 0,
      nextIndex:
        fullyVisible[fullyVisible.length - 1] < childrenRects.length - 1
          ? fullyVisible[fullyVisible.length - 1] + 1
          : childrenRects.length - 1
    };

    if (result.prevIndex > 0) {
      while (
        childrenRects[result.prevIndex].width === 0 &&
        result.prevIndex >= 0
      ) {
        --result.prevIndex;
      }
    }

    if (result.nextIndex < childrenRects.length) {
      while (
        childrenRects[result.nextIndex].width === 0 &&
        result.nextIndex <= childrenRects.length
      ) {
        ++result.nextIndex;
      }
    }

    return result;
  }

  scrollSelectedAccountIntoView() {
    if (this.navBanks) {
      const idxToScrollTo = this.userService.appData.userData
        .bankMatchAccountAcc
        ? this.userService.appData.userData.bankMatchAccount.indexOf(
            this.userService.appData.userData.bankMatchAccountAcc
          )
        : -1;
      // console.log('idxToScrollTo = %o', idxToScrollTo);
      if (
        !this.navBanks.nativeElement ||
        !(this.navBanks.nativeElement as HTMLElement).children.length
      ) {
        setTimeout(() => {
          this.scrollListToIndex(
            this.navBanks.nativeElement as HTMLElement,
            idxToScrollTo
          );
        }, 300);
      } else {
        this.scrollListToIndex(
          this.navBanks.nativeElement as HTMLElement,
          idxToScrollTo
        );
      }
    }
  }

  private scrollListToIndex(
    list: HTMLElement,
    idx: number,
    opts?: ScrollIntoViewOptions
  ) {
    if (list && idx >= 0 && idx < list.children.length) {
      console.log('scrolling to %o with %o', idx, opts);
      // requestAnimationFrame(() => {
      list.children[idx].scrollIntoView(
        opts || {
          behavior: 'smooth'
        }
      );
      // });
    }
  }

  onMultiPostponeClick(): void {
    this.postponePrompt.visible = false;
    this.postponePrompt.processing = false;

    const checkedItems = [
      ...this.cashflowMatch.nigreret.children.filter(
        (item) => item.checkRow === true
      ),
      ...this.cashflowMatch.future.children.filter(
        (item) => item.checkRow === true
      )
    ];
    this.postponePrompt.selectedDate = closestFutureDateNoWeekends(
      Math.max(
        new Date().getTime(),
        ...checkedItems.map((item) => item.targetOriginalDate || item.transDate)
      )
    );

    this.postponePrompt.onApprove = () => {
      this.postponePrompt.processing = true;
      combineLatest(
        checkedItems.map((item) => {
          const dataToSubmit = JSON.parse(JSON.stringify(item));
          dataToSubmit.targetOriginalDate = this.postponePrompt.selectedDate;
          if (!('companyAccountId' in dataToSubmit)) {
            dataToSubmit.companyAccountId =
                this.userService.appData.userData.bankMatchAccountAcc.companyAccountId;
          }
          if (!('companyId' in dataToSubmit)) {
            dataToSubmit.companyId =
                this.userService.appData.userData.companySelect.companyId;
          }
          if (
              'targetOriginalTotal' in dataToSubmit &&
              dataToSubmit.targetOriginalTotal !== null
          ) {
            dataToSubmit.targetOriginalTotal = Math.abs(
                dataToSubmit.targetOriginalTotal
            );
          }

          const targetType = item.targetTypeName || item.targetType;
          return this.sharedService.updateSingleTransactionFromBankMatch(
              targetType,
              dataToSubmit
          );
          // return this.sharedService.updateCyclicTransaction(EditingType.Single,
          //     targetType,
          //     dataToSubmit);
        })


      )
        .pipe(
          map((results: any[]) => {
            const succeeded: any[] = [],
              failed: any[] = [];
            results.forEach((rslt, idx) => {
              if (rslt.error) {
                failed.push({
                  item: checkedItems[idx],
                  result: rslt.error
                });
              } else {
                succeeded.push({
                  item: checkedItems[idx],
                  result: rslt.body
                });
              }
            });

            return [succeeded, failed];
          })
        )
        .subscribe(([succeeded, failed]: any) => {
          this.postponePrompt.processing = false;

          if (!failed.length) {
            this.postponePrompt.visible = false;
            this.startChild();
          }
          console.log('multi-postpone finished: %o, %o', succeeded, failed);
        });
    };

    this.postponePrompt.visible = true;
  }

  onMultiDeleteClick(): void {
    const checkedItems = [
      ...this.cashflowMatch.nigreret.children.filter(
        (item) => item.checkRow === true
      ),
      ...this.cashflowMatch.future.children.filter(
        (item) => item.checkRow === true
      )
    ];
    combineLatest(
          checkedItems.map((item) => {
            const targetType = item.targetTypeName || item.targetType;

            return this.sharedService.deleteOperation({
              params: {
                companyAccountId:
                    item.companyAccountId ||
                    this.userService.appData.userData.bankMatchAccountAcc
                        .companyAccountId,
                transId: item.targetId,
                dateFrom: item.dateFrom
              },
              editType: EditingType.Single,
              operationType: targetType
            });
          })


    )
      .pipe(
        map((results: any[]) => {
          const succeeded: any[] = [],
            failed: any[] = [];
          results.forEach((rslt, idx) => {
            if (rslt.error) {
              failed.push({
                item: checkedItems[idx],
                result: rslt.error
              });
            } else {
              succeeded.push({
                item: checkedItems[idx],
                result: rslt.body
              });
            }
          });

          return [succeeded, failed];
        })
      )
      .subscribe(([succeeded, failed]: any) => {
        if (!failed.length) {
          this.startChild();
        }
        console.log('multi-delete finished: %o, %o', succeeded, failed);
      });
  }

  private prepareSingleForSending(
    editResult: {
      autoUpdateTypeName: string;
      companyAccountId: string;
      companyId: string;
      expence: boolean;
      expirationDate: Date | null;
      paymentDesc: string;
      targetType: string;
      total: number;
      transDate: Date | null;
      transFrequencyName: string;
      transId: string;
      transName: string;
      transTypeId: string;
      asmachta: number;
    },
    source: any
  ): any {
    const srcClone = JSON.parse(JSON.stringify(source));
    srcClone.targetOriginalDate = editResult.transDate;
    srcClone.targetOriginalTotal = editResult.total;
    srcClone.targetAsmachta = editResult.asmachta;
    srcClone.targetTypeName = editResult.targetType;
    srcClone.targetName = editResult.transName;
    srcClone.transTypeId = editResult.transTypeId;
    srcClone.companyAccountId = editResult.companyAccountId;
    srcClone.paymentDesc = editResult.paymentDesc;

    return srcClone;
  }
}
