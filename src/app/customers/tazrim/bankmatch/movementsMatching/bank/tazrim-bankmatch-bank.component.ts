import {

  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {SharedComponent} from '@app/shared/component/shared.component'; //import {sharedComponent} from '../../../../customers.component';
import {SortPipe} from '@app/shared/pipes/sort.pipe';
import {TranslateService} from '@ngx-translate/core';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '../../../../customers.service';
import {UserService} from '@app/core/user.service';
import {FilterPipe} from '@app/shared/pipes/filter.pipe';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
// import {UserDefaultsResolver} from '../../../user-defaults-resolver.service';
import {DatePipe, WeekDay} from '@angular/common';
import {TodayRelativeHumanizePipe} from '@app/shared/pipes/todayRelativeHumanize.pipe';
import {
  closestFutureDateNoWeekends,
  getDaysBetweenDates
} from '@app/shared/functions/getDaysBetweenDates';
import {compareDates} from '@app/shared/functions/compareDates';
import {Subject, zip, of, Subscription, combineLatest} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMapTo,
  takeUntil,
  tap
} from 'rxjs/operators';
import {HttpErrorResponse} from '@angular/common/http';
import {BrowserService} from '@app/shared/services/browser.service';
import {
  EditingType,
  MovementEditorComponent
} from '@app/shared/component/movement-editor/movement-editor.component';
import {IsPeriodicTypePipe} from '@app/shared/pipes/isPeriodicTargetType.pipe';
import {TransTypesService} from '@app/core/transTypes.service';
import {ReloadServices} from '@app/shared/services/reload.services';
import {getPageHeight} from "@app/shared/functions/getPageHeight";

declare var $: any;

@Component({
  templateUrl: './tazrim-bankmatch-bank.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  providers: [IsPeriodicTypePipe]
})
export class TazrimBankmatchBankComponent
  extends ReloadServices
  implements OnInit, OnDestroy {
  public filterInput = new FormControl();
  // public queryString = '';
  public banktransForMatchAll: any;
  public banktransForMatch: any = [];
  public cashflowMatchAll: any;
  public cashflowMatch: any;
  public cashflowMatchReco: any = [];
  public paymentTypesArr: any[];
  private paymentTypesMap: { [key: string]: any };
  public cashPaymentTypesArr: any[];
  private cashPaymentTypesMap: { [key: string]: any };
  public typePaymentsDD: any[] = [];
  public loader = false;
  public loaderCash = false;
  public searchInDates = false;
  public searchableList = [
    'total',
    'transDescAzonly',
    'paymentDescTranslate',
    'asmachta',
    'targetAsmachta',
    'mutavNames'
  ];
  public filterPaymentTypesCategory: any = null;
  public cashFilterPaymentTypesCategory: any = null;
  public searchableListTypes = ['paymentDesc'];
  public sortPipeDir: any = null;
  public sortPipeDirCash: any = null;
  public sortPipeDirDate: any = null;
  public sortPipeDirCashDate: any = null;
  private readonly dtPipe: DatePipe;
  public hasRowOfDeleted: { size: number; sum: number } | boolean = false;
  public showToastBeforeSend = false;
  public accountSelectOneNotUpdate: any = false;
  // public nigreretOpened = true;
  public popUpDeleteMatch: any = false;
  public cancelMatch: any = false;
  public checkAllRows: any = false;
  public checkAllRowsDisabled: any = false;
  public hasRowOfChecked: any = false;
  public currentTab = 1;
  // private typePay: any[];
  // private typeExpece: any[];
  @ViewChild('navBanks') navBanks: ElementRef;
  public daysToDelete: string | number = 3;
  public matchList: any;
  public tooltipElem: any = null;
  public nav = {
    prev: false,
    next: false
  };
  // private transTypesSub: Subscription;
  companyTransTypes: any[] = [];
  public cashflowMatchPopup: any = false;
  public scrollContainerInsideHasScroll = false;
  @ViewChild('scrollContainerInside') scrollContainerInside: ElementRef;
  createFromRecommendationData: {
    visible: boolean;
    title: string;
    form: any;
    loading: boolean | null;
    source: any | null;
    original?: any;
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
  public showModalAutoMatch: any = false;

  public modalAutoMatch: any = false;
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

  readonly nonePostponableTypes = [
    'SOLEK_TAZRIM',
    'CCARD_TAZRIM',
    'LOAN_TAZRIM'
  ];
  // readonly systemAutoMatchTypes = ['SOLEK_TAZRIM', 'CCARD_TAZRIM', 'LOAN_TAZRIM'];
  readonly systemAutoMatchTooltip = [
    `תנועה זו תותאם באופן אוטומטי על ידי`,
    `<img fill ngSrc="/assets/images/logo2.png" style="height: 15px; width: auto; position: relative;">`,
    `כאשר תופיע בחשבון בנק`
  ].join(' ');

  filterInputUnadjusted = new FormControl();
  private readonly searchableListUnadjusted = [
    'targetOriginalTotal',
    'targetName',
    'paymentDescTranslate',
    'targetAsmachta',
    'mutavNames'
  ];

  viewportDim: { w: number; h: number };
  recommendationCriteria: { paymentTypes: string[]; hova: boolean[] };

  private readonly destroyed$ = new Subject<void>();

  public readonly beneficiaryFilter: {
    bank: {
      filter: FormControl;
      options: Array<{ val: string; id: string; checked: boolean }>;
    };
    cashflow: {
      filter: FormControl;
      options: Array<{ val: string; id: string; checked: boolean }>;
    };
  };

  constructor(
    public translate: TranslateService,
    public override sharedComponent: SharedComponent,
    public userService: UserService,
    public sharedService: SharedService,
    private filterPipe: FilterPipe,
    private sortPipe: SortPipe,
    private dtHumanizePipe: TodayRelativeHumanizePipe,
    private renderer: Renderer2,
    private _element: ElementRef,
    public browserDetect: BrowserService,
    private storageService: StorageService,
    public router: Router,
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
        distinctUntilChanged(),
        takeUntil(this.destroyed$)
      )
      .subscribe((term) => {
        // this.queryString = term;
        this.filtersAll();
      });
    this.filterInputUnadjusted.valueChanges
      .pipe(
        debounceTime(300),
        filter((term) => !term || term.length === 0 || term.length >= 2),
        distinctUntilChanged(),
        takeUntil(this.destroyed$)
      )
      .subscribe((term) => {
        this.filtersAllCash();
      });

    const paymentTypes =
      this.translate.translations[this.translate.currentLang].paymentTypes;
    if (paymentTypes) {
      for (const o in paymentTypes) {
        if (paymentTypes.hasOwnProperty(o)) {
          this.typePaymentsDD.push({label: paymentTypes[o], value: o});
        }
      }
    }

    this.dtPipe = new DatePipe('en-IL');

    this.transTypesService.selectedCompanyTransTypes
      .pipe(takeUntil(this.destroyed$))
      .subscribe((rslt) => (this.companyTransTypes = rslt));

    this.viewportDim = {w: window.innerWidth, h: window.innerHeight};

    this.beneficiaryFilter = {
      bank: {
        filter: new FormControl(),
        options: []
      },
      cashflow: {
        filter: new FormControl(),
        options: []
      }
    };
  }

  @HostListener('document:click', ['$event'])
  onClickOutside($event: any) {
    // console.log('%o', $event);
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

  @HostListener('window:resize', ['$event'])
  onResize(event?) {
    this.viewportDim = {w: window.innerWidth, h: window.innerHeight};
  }


  ngOnInit(): void {
    console.log('ngOnInit');
  }

  override reload() {
    console.log('reload child');
    this.ngOnInit();
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
  replace() {
    this.router.navigate(
      [
        !this.userService.appData.userData.accountant
          ? '/cfl/cash-flow/bankmatch/casflow'
          : '/accountants/companies/cash-flow/bankmatch/casflow'
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

  bankMatchRestart($event) {
    if (this.userService.appData.popUpShow.daysToDelete !== '') {
      const parameters = {
        companyAccountId:
        this.userService.appData.userData.bankMatchAccountAcc
          .companyAccountId,
        restartDaysLeft: Number(this.userService.appData.popUpShow.daysToDelete)
      };
      // this.sharedService.bankMatchRestart(parameters).subscribe((response: any) => {
      //     this.userService.appData.popUpShow = false;
      //     this.daysToDelete = 3;
      //     this.startChild();
      // });
      this.sharedService
        .bankMatchRestart(parameters)
        .pipe(
          switchMapTo(
            this.sharedService.getBankMatchAccount({
              uuid: this.userService.appData.userData.bankMatchAccountAcc
                .companyAccountId
            })
          )
        )
        .subscribe((response: any) => {
          if (
            !response.error &&
            Array.isArray(response.body) &&
            response.body.length
          ) {
            this.userService.appData.userData.bankMatchAccountAcc.countNigrarot =
              response.body[0].countNigrarot;
          }
          this.userService.appData.popUpShow = false;
          this.daysToDelete = 3;
          this.startChild();
        });
    }
    $event.preventDefault();
    $event.stopPropagation();
  }

  nextScroll(elem: any, reschedule?: boolean) {
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

  scrollRobotStop(evt?: Event) {
    // if (evt) {
    //     console.log('%o ---- stopping robot ------------', (evt.target as HTMLElement).id);
    // }
    if (this.scrollRobot) {
      clearInterval(this.scrollRobot);
      this.scrollRobot = null;
    }
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

  // scrollTo(elem: any, xScroll: number, scrollDuration: any): void {
  //     // debugger;
  //     const scrollStep: any = (xScroll / (scrollDuration / 15));
  //     const fullStep: any = elem.scrollLeft - ((xScroll < 0) ? Math.abs(xScroll) : -xScroll);
  //     const scrollInterval = setInterval(() => {
  //         if ((scrollStep > 0 && ((elem.scrollWidth - elem.offsetWidth) === elem.scrollLeft))
  //             || scrollStep < 0 && elem.scrollLeft === 0) {
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
    // if (this.transTypesSub) {
    //     this.transTypesSub.unsubscribe();
    // }
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
    this.destroyed$.next();
    this.destroyed$.complete();
    this.destroy();
  }

  resetVars(): void {
    if (!this.userService.appData.userData.bankMatchAccountAcc) {
      this.rebuildBeneficiaryFilterOptions('bank', null);
      this.rebuildBeneficiaryFilterOptions('cashflow', null);
      return;
    }
    setTimeout(() => {
      this.checkNavScroll();
    }, 600);
    this.loader = true;
    this.loaderCash = true;
    this.cancelMatch = false;
    this.currentTab = 1;

    // this.queryString = '';
    this.filterInput.setValue('', {
      emitEvent: false,
      emitModelToViewChange: true,
      emitViewToModelChange: false
    });
    this.filterInputUnadjusted.setValue('', {
      emitEvent: false,
      emitModelToViewChange: true,
      emitViewToModelChange: false
    });
    this.cashflowMatch = undefined;
    this.banktransForMatch = [];
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
         this.sharedService.cashflowMatch(parameters),
         this.sharedService.paymentTypesTranslate$
       ]

    )
      .pipe(takeUntil(this.destroyed$))
      .subscribe(
        (response: any) => {
          this.loader = false;
          this.loaderCash = false;
          this.banktransForMatchAll = response[0]
            ? response[0]['body']
            : response[0];
          this.banktransForMatchAll = this.banktransForMatchAll.map((trns) =>
            this.setupItemView(trns, response[2])
          );
          this.rebuildBeneficiaryFilterOptions(
            'bank',
            this.banktransForMatchAll
          );

          this.cashflowMatchAll = response[1]
            ? response[1]['body']
            : response[1];
          this.cashflowMatchAll = this.cashflowMatchAll.map((trns) =>
            this.setupItemCashView(trns, response[2])
          );
          this.rebuildBeneficiaryFilterOptions(
            'cashflow',
            this.cashflowMatchAll
          );

          this.filtersAll(false);
          this.filtersAllCash(false);
        }
      );

    this.scrollSelectedAccountIntoView();
  }

  filtersAll(priority?: any): void {
    this.searchInDates = /^\d{2}\/\d{2}$|^\d{2}\/\d{2}\/\d{2}$/g.test(
      this.filterInput.value
    );
    if (this.filterInput.value) {
      this.banktransForMatch = this.filterPipe.transform(
        [].concat(this.banktransForMatchAll),
        this.filterInput.value,
        this.searchInDates
          ? [...this.searchableList, 'transDateStr']
          : this.searchableList
      );
    } else {
      this.banktransForMatch = [].concat(this.banktransForMatchAll);
    }

    if (priority !== 'paymentTypes') {
      this.rebuildPaymentTypesMap(
        this.filterPipe.transform(
          this.withBeneficiaryFilterApplied('bank', this.banktransForMatch),
          this.filterPaymentTypesCategory,
          this.searchableListTypes
        )
      );
    }
    if (priority !== 'biziboxMutavId') {
      this.rebuildBeneficiaryFilterOptions(
        'bank',
        this.filterPipe.transform(
          this.banktransForMatch,
          this.filterPaymentTypesCategory,
          this.searchableListTypes
        )
      );
    }
    // if (!priority) {
    //     this.rebuildPaymentTypesMap(this.filterPipe.transform(this.banktransForMatch,
    //         this.filterPaymentTypesCategory, this.searchableListTypes));
    // }

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

    this.banktransForMatch = this.withBeneficiaryFilterApplied(
      'bank',
      this.banktransForMatch
    );

    this.hasRowOfDeleted = this.banktransForMatch
      .filter((item) => item.deleteRow)
      .reduce((acmltr, item) => {
        if (acmltr === null) {
          acmltr = {
            size: 0,
            sum: 0
          };
        }
        acmltr.size++;
        acmltr.sum += +item.total;

        return acmltr;
      }, null);

    this.loader = false;
  }

  filtersAllCash(priority?: any): void {
    // let cashflowMatchTmp = [].concat((this.cashflowMatchReco.length && this.currentTab === 0)
    //     ? this.cashflowMatchReco : this.cashflowMatchAll);
    // debugger;
    let cashflowMatchTmp;
    if (this.cashflowMatchReco.length && this.currentTab === 0) {
      cashflowMatchTmp = this.cashflowMatchReco;
      // } else if (this.currentTab === 1 && this.recommendationCriteria && this.recommendationCriteria.hova.length === 1) {
      //     cashflowMatchTmp = this.cashflowMatchAll.filter((item) => {
      //         return item.isMatchable
      //             && this.recommendationCriteria.hova.includes(item.expence);
      //     });
    } else {
      cashflowMatchTmp = this.cashflowMatchAll;
    }

    // debugger;
    if (this.filterInputUnadjusted.value) {
      cashflowMatchTmp = this.filterPipe.transform(
        [].concat(cashflowMatchTmp),
        this.filterInputUnadjusted.value,
        this.searchableListUnadjusted
      );
    }

    if (priority !== 'paymentTypes') {
      this.rebuildCashPaymentTypesMap(
        this.filterPipe.transform(
          this.withBeneficiaryFilterApplied('cashflow', cashflowMatchTmp),
          this.cashFilterPaymentTypesCategory,
          this.searchableListTypes
        )
      );
    }
    if (priority !== 'biziboxMutavId') {
      this.rebuildBeneficiaryFilterOptions(
        'cashflow',
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

    cashflowMatchTmp = this.withBeneficiaryFilterApplied(
      'cashflow',
      cashflowMatchTmp
    );

    // this.calcRowGroup();
    const partialMatch = cashflowMatchTmp.filter(
      (rows) => rows.partialMatch === true
    );
    const nigreret = cashflowMatchTmp.filter(
      (rows) => !rows.partialMatch && rows.hovAvar === true
    );
    const future = cashflowMatchTmp.filter(
      (rows) => !rows.partialMatch && rows.hovAvar === false
    );

    this.cashflowMatch = {
      partialMatch: {
        parent: {
          opened:
            this.cashflowMatch && this.cashflowMatch.partialMatch
              ? this.cashflowMatch.partialMatch.parent.opened
              : true
        },
        children: partialMatch
      },
      nigreret: {
        parent: {
          opened:
            this.cashflowMatch && this.cashflowMatch.nigreret
              ? this.cashflowMatch.nigreret.parent.opened
              : true
        },
        children: nigreret
      },
      future: {
        parent: {
          opened:
            this.cashflowMatch && this.cashflowMatch.future
              ? this.cashflowMatch.future.parent.opened
              : true
        },
        children: future
      }
    };

    this.hasRowOfChecked = this.cashflowMatchAll // [...nigreret, ...future]
      .filter((item) => item.checkRow)
      .reduce((acmltr, item) => {
        if (acmltr === null) {
          acmltr = {
            size: 0,
            sum: 0
          };
        }
        acmltr.size++;
        acmltr.sum += +item.targetOriginalTotal;

        return acmltr;
      }, null);

    this.loaderCash = false;
  }

  checkReco() {
    if (this.currentTab !== 0 && this.cashflowMatchReco.length) {
      // if (this.cashflowMatchReco.length) {
      this.currentTab = 0;
      this.filtersAllCash();
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
    this.filtersAll('paymentTypes');
  }

  filterCashCategory(type: any) {
    this.cashFilterPaymentTypesCategory = type.checked;
    this.filtersAllCash('paymentTypes');
  }

  private setupItemView(
    trns: any,
    paymentTypesTranslate: { [k: string]: string }
  ): void {
    // console.log('trns -> %o', trns);

    const trnsAcc = this.userService.appData.userData.accounts.find(
      (acc:any) => acc.companyAccountId === trns.companyAccountId
    );

    return Object.assign(trns, {
      account: trnsAcc,
      transDateFull: new Date(trns.transDate),
      transDateTime: new Date(trns.transDate).getTime(),
      paymentDescTranslate: paymentTypesTranslate[trns['paymentDesc']],
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

  checkAllRowsFunc() {
    if (this.cancelMatch) {
      this.cancelMatch = false;
    }
    if (this.cashflowMatchReco.length && this.currentTab === 0) {
      this.cashflowMatchReco
        .filter((item) => item.isMatchable)
        .forEach((item) => {
          item.checkRow = this.checkAllRows;
        });
      // this.hasRowOfChecked = this.cashflowMatchReco.some((item) => item.checkRow);
    } else {
      this.cashflowMatchAll
        .filter((item) => item.isMatchable)
        .forEach((item) => {
          item.checkRow = this.checkAllRows;
        });
      // this.hasRowOfChecked = this.cashflowMatchAll.some((item) => item.checkRow);
    }
    this.calcRowChecked();
  }

  checkDeleted() {
    if (this.cancelMatch) {
      this.cancelMatch = false;
    }
    // debugger;
    this.hasRowOfDeleted = this.banktransForMatch.some(
      (item) => item.deleteRow
    );
    if (this.hasRowOfDeleted) {
      // && !this.hasRowOfChecked) {
      this.recommendationCriteria = this.banktransForMatch
        .filter((item) => item.deleteRow)
        .reduce(
          (criteria, item) => {
            if (!criteria.paymentTypes.includes(item.paymentDesc)) {
              criteria.paymentTypes.push(item.paymentDesc);
            }
            if (!criteria.hova.includes(item.hova)) {
              criteria.hova.push(item.hova);
            }

            return criteria;
          },
          {
            paymentTypes: [],
            hova: []
          }
        );

      this.cashflowMatchReco = this.cashflowMatchAll.filter((item) => {
        return (
          item.isMatchable &&
          (!this.recommendationCriteria.paymentTypes.length ||
            this.recommendationCriteria.paymentTypes.includes(
              item.paymentDesc
            )) &&
          (!this.recommendationCriteria.hova.length ||
            this.recommendationCriteria.hova.includes(item.expence))
        );
      });

      // if (this.cashflowMatchReco.length) {
      //     this.currentTab = 0;
      // } else {
      //     this.currentTab = 1;
      // }
    } else {
      this.cashflowMatchReco = [];
      // this.currentTab = 1;
      this.recommendationCriteria = null;
    }

    if (this.cashflowMatchReco.length === 0 && this.currentTab === 0) {
      this.currentTab = 1;
    }

    this.calcRowChecked();
    this.filtersAll();
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
      // this.hasRowOfChecked = this.cashflowMatchReco.some((item) => item.checkRow);
    } else {
      this.cashflowMatchAll.forEach((item) => {
        if (item.targetId === itemRow.targetId) {
          item.checkRow = itemRow.checkRow;
        }
      });
      // this.hasRowOfChecked = this.cashflowMatchAll.some((item) => item.checkRow);
    }
    this.calcRowChecked();
  }

  private setupItemCashView(
    trns: any,
    paymentTypesTranslate: { [k: string]: string }
  ): void {
    // console.log('trns -> %o', trns);

    return Object.assign(trns, {
      transDateFull: new Date(trns.targetOriginalDate),
      targetOriginalDateTime: new Date(trns.targetOriginalDate).getTime(),
      paymentDescTranslate: paymentTypesTranslate[trns['paymentDesc']],
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
  //                 opened: this.cashflowMatch && this.cashflowMatch.nigreret ? this.cashflowMatch.nigreret.parent.opened : true
  //             },
  //             children: nigreret
  //         },
  //         future: {
  //             parent: {
  //                 opened:  this.cashflowMatch && this.cashflowMatch.future ? this.cashflowMatch.future.parent.opened : true
  //             },
  //             children: future
  //         },
  //     };
  // }

  // private calcRowChecked(): void {
  //     const banktransForMatchLength = this.banktransForMatch.filter((rows) => {
  //         rows.checkDisabled = false;
  //         return (rows.deleteRow === true);
  //     });
  //
  //     let cashflowMatchLength;
  //     if (this.cashflowMatchReco.length && this.currentTab === 0) {
  //         cashflowMatchLength = this.cashflowMatchReco.filter((rows) => {
  //             rows.checkDisabled = false;
  //             return (rows.checkRow === true);
  //         });
  //     } else {
  //         cashflowMatchLength = this.cashflowMatchAll.filter((rows) => {
  //             rows.checkDisabled = false;
  //             return (rows.checkRow === true);
  //         });
  //     }
  //     this.checkAllRowsDisabled = false;
  //     if (banktransForMatchLength.length > 1) {
  //         this.checkAllRowsDisabled = true;
  //     }
  //
  //     if (banktransForMatchLength.length > 1 && cashflowMatchLength.length === 1) {
  //         if ((this.cashflowMatchReco.length && this.currentTab === 0)) {
  //             this.cashflowMatchReco.forEach((rows, idx) => {
  //                 if (!rows.checkRow) {
  //                     this.cashflowMatchReco[idx].checkDisabled = true;
  //                 }
  //             });
  //         } else {
  //             this.cashflowMatchAll.forEach((rows, idx) => {
  //                 if (!rows.checkRow) {
  //                     this.cashflowMatchAll[idx].checkDisabled = true;
  //                 }
  //             });
  //         }
  //     }
  //
  //     if (cashflowMatchLength.length > 1 && banktransForMatchLength.length === 1) {
  //         this.banktransForMatch.forEach((rows, idx) => {
  //             if (!rows.deleteRow) {
  //                 this.banktransForMatch[idx].checkDisabled = true;
  //             }
  //         });
  //     }
  //
  //     if (cashflowMatchLength.length === 1 && banktransForMatchLength.length === 1) {
  //         this.matchList = {
  //             'array': [{
  //                 'bankTransId': banktransForMatchLength[0].bankTransId,
  //                 'dateFrom': cashflowMatchLength[0].dateFrom,
  //                 'dateTill': cashflowMatchLength[0].dateTill,
  //                 'hovAvar': cashflowMatchLength[0].hovAvar,
  //                 'targetId': cashflowMatchLength[0].targetId,
  //                 'targetName': cashflowMatchLength[0].targetName,
  //                 'targetPaymentTypeId': 99,
  //                 'targetTypeId': cashflowMatchLength[0].targetTypeId,
  //                 'transId': cashflowMatchLength[0].transId,
  //                 'transTypeId': cashflowMatchLength[0].transTypeId,
  //             }],
  //             'companyId': this.userService.appData.userData.companySelect.companyId
  //         };
  //     } else if (cashflowMatchLength.length > 1 && banktransForMatchLength.length === 1) {
  //         this.matchList = {
  //             'array': cashflowMatchLength.map((rows) => {
  //                 return {
  //                     'bankTransId': banktransForMatchLength[0].bankTransId,
  //                     'dateFrom': rows.dateFrom,
  //                     'dateTill': rows.dateTill,
  //                     'hovAvar': rows.hovAvar,
  //                     'targetId': rows.targetId,
  //                     'targetName': rows.targetName,
  //                     'targetPaymentTypeId': 99,
  //                     'targetTypeId': rows.targetTypeId,
  //                     'transId': rows.transId,
  //                     'transTypeId': rows.transTypeId,
  //                 };
  //             }),
  //             'companyId': this.userService.appData.userData.companySelect.companyId
  //         };
  //     } else if (cashflowMatchLength.length === 1 && banktransForMatchLength.length > 1) {
  //         this.matchList = {
  //             'array': banktransForMatchLength.map((rows) => {
  //                 return {
  //                     'bankTransId': rows.bankTransId,
  //                     'dateFrom': cashflowMatchLength[0].dateFrom,
  //                     'dateTill': cashflowMatchLength[0].dateTill,
  //                     'hovAvar': cashflowMatchLength[0].hovAvar,
  //                     'targetId': cashflowMatchLength[0].targetId,
  //                     'targetName': cashflowMatchLength[0].targetName,
  //                     'targetPaymentTypeId': 99,
  //                     'targetTypeId': cashflowMatchLength[0].targetTypeId,
  //                     'transId': cashflowMatchLength[0].transId,
  //                     'transTypeId': cashflowMatchLength[0].transTypeId,
  //                 };
  //             }),
  //             'companyId': this.userService.appData.userData.companySelect.companyId
  //         };
  //     } else {
  //         this.matchList = undefined;
  //     }
  //
  //     if (this.matchList) {
  //         this.matchList.selectedCount = cashflowMatchLength.length + banktransForMatchLength.length;
  //     }
  //
  //     this.filtersAllCash();
  // }
  private calcRowChecked(): void {
    this.modalAutoMatch = false;
    const banktransForMatchMarked = this.banktransForMatch.filter(
      (row) => row.deleteRow === true
    );
    const cashflowMatchMarked = this.cashflowMatchAll.filter(
      (row) => row.checkRow === true
    );

    this.checkAllRowsDisabled = banktransForMatchMarked.length > 1;
    // debugger;
    if (
      banktransForMatchMarked.length > 1 &&
      cashflowMatchMarked.length === 1
    ) {
      this.cashflowMatchAll
        .filter((item) => !item.checkRow)
        .forEach((item) => (item.checkDisabled = true));
    } else if (
      cashflowMatchMarked.length > 1 &&
      banktransForMatchMarked.length === 1
    ) {
      this.banktransForMatch
        .filter((item) => !item.deleteRow)
        .forEach((item) => (item.checkDisabled = true));
    } else {
      this.cashflowMatchAll
        .filter((item) => !item.checkRow)
        .forEach((item) => (item.checkDisabled = false));
      this.banktransForMatch
        .filter((item) => !item.deleteRow)
        .forEach((item) => (item.checkDisabled = false));
    }
    // if (banktransForMatch.length > 1 && cashflowMatch.length === 1) {
    //     if ((this.cashflowMatchReco.length && this.currentTab === 0)) {
    //         this.cashflowMatchReco.forEach((rows, idx) => {
    //             if (!rows.checkRow) {
    //                 this.cashflowMatchReco[idx].checkDisabled = true;
    //             }
    //         });
    //     } else {
    //         this.cashflowMatchAll.forEach((rows, idx) => {
    //             if (!rows.checkRow) {
    //                 this.cashflowMatchAll[idx].checkDisabled = true;
    //             }
    //         });
    //     }
    // }
    //
    // if (cashflowMatch.length > 1 && banktransForMatch.length === 1) {
    //     this.banktransForMatch.forEach((rows, idx) => {
    //         if (!rows.deleteRow) {
    //             this.banktransForMatch[idx].checkDisabled = true;
    //         }
    //     });
    // }

    if (
      cashflowMatchMarked.length === 1 &&
      banktransForMatchMarked.length === 1
      /*&& cashflowMatchMarked[0].expence === banktransForMatchMarked[0].hova*/
    ) {
      this.matchList = {
        array: [
          {
            targetOriginalTotal: cashflowMatchMarked[0].targetOriginalTotal,
            targetOriginalDate: cashflowMatchMarked[0].targetOriginalDate,
            bankTransId: banktransForMatchMarked[0].bankTransId,
            dateFrom: cashflowMatchMarked[0].dateFrom,
            dateTill: cashflowMatchMarked[0].dateTill,
            hovAvar: cashflowMatchMarked[0].hovAvar,
            note: cashflowMatchMarked[0].note,
            targetId: cashflowMatchMarked[0].targetId,
            targetName: cashflowMatchMarked[0].targetName,
            targetPaymentTypeId: cashflowMatchMarked[0].targetPaymentTypeId,
            targetTypeId: cashflowMatchMarked[0].targetTypeId,
            transId: cashflowMatchMarked[0].transId,
            transTypeId: cashflowMatchMarked[0].transTypeId,
            // 'note': cashflowMatchMarked[0].note,
            searchkeyId: banktransForMatchMarked[0].searchkeyId
              ? banktransForMatchMarked[0].searchkeyId
              : null,
            source: banktransForMatchMarked[0].source
          }
        ],
        companyId: this.userService.appData.userData.companySelect.companyId
      };
      if (
        cashflowMatchMarked[0].showPopup === true &&
        banktransForMatchMarked[0].showPopup === true
      ) {
        this.modalAutoMatch = {
          transDescAzonly: banktransForMatchMarked[0].transDescAzonly,
          targetName: cashflowMatchMarked[0].targetName
        };
        this.matchList.array[0].searchkeyUpdate = false;
      }
    } else if (
      cashflowMatchMarked.length > 1 &&
      banktransForMatchMarked.length === 1
    ) {
      this.matchList = {
        array: cashflowMatchMarked.map((rows) => {
          return {
            targetOriginalTotal: rows.targetOriginalTotal,
            targetOriginalDate: rows.targetOriginalDate,
            bankTransId: banktransForMatchMarked[0].bankTransId,
            dateFrom: rows.dateFrom,
            note: rows.note,
            dateTill: rows.dateTill,
            hovAvar: rows.hovAvar,
            targetId: rows.targetId,
            targetName: rows.targetName,
            targetPaymentTypeId: rows.targetPaymentTypeId,
            targetTypeId: rows.targetTypeId,
            transId: rows.transId,
            transTypeId: rows.transTypeId,
            // 'note': rows.note,
            searchkeyId: banktransForMatchMarked[0].searchkeyId
              ? banktransForMatchMarked[0].searchkeyId
              : null,
            source: banktransForMatchMarked[0].source
          };
        }),
        companyId: this.userService.appData.userData.companySelect.companyId
      };
    } else if (
      cashflowMatchMarked.length === 1 &&
      banktransForMatchMarked.length > 1
    ) {
      this.matchList = {
        array: banktransForMatchMarked.map((rows) => {
          return {
            targetOriginalTotal: cashflowMatchMarked[0].targetOriginalTotal,
            targetOriginalDate: cashflowMatchMarked[0].targetOriginalDate,
            bankTransId: rows.bankTransId,
            dateFrom: cashflowMatchMarked[0].dateFrom,
            dateTill: cashflowMatchMarked[0].dateTill,
            note: cashflowMatchMarked[0].note,
            hovAvar: cashflowMatchMarked[0].hovAvar,
            targetId: cashflowMatchMarked[0].targetId,
            targetName: cashflowMatchMarked[0].targetName,
            targetPaymentTypeId: cashflowMatchMarked[0].targetPaymentTypeId,
            targetTypeId: cashflowMatchMarked[0].targetTypeId,
            transId: cashflowMatchMarked[0].transId,
            transTypeId: cashflowMatchMarked[0].transTypeId,
            searchkeyId: rows.searchkeyId ? rows.searchkeyId : null,
            //                        'note': cashflowMatchMarked[0].note,
            source: rows.source
          };
        }),
        companyId: this.userService.appData.userData.companySelect.companyId
      };
    } else {
      this.matchList = undefined;
    }

    if (this.matchList) {
      this.matchList.selectedCount =
        cashflowMatchMarked.length + banktransForMatchMarked.length;
      this.matchList.selectedTransTypeIds = [
        ...cashflowMatchMarked,
        ...banktransForMatchMarked
      ].reduce((acmltr, tr) => {
        if (
          tr.transTypeId &&
          tr.transTypeId !== 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d'
        ) {
          acmltr.add(tr.transTypeId);
        }
        return acmltr;
      }, new Set());
      const setOfCashflowMatchMarked = [...cashflowMatchMarked].reduce(
        (acmltr, tr) => {
          return [
            tr.biziboxMutavId,
            ...(tr.mutavArray
              ? tr.mutavArray.map((mt) => mt.biziboxMutavId)
              : [])
          ]
            .filter((mtvId) => !!mtvId)
            .reduce((acmltr0, mtvId) => acmltr0.add(mtvId), acmltr);
        },
        new Set()
      );
      const setOfBanktransForMatchMarked = [...banktransForMatchMarked].reduce(
        (acmltr, tr) => {
          return [
            tr.biziboxMutavId,
            ...(tr.mutavArray
              ? tr.mutavArray.map((mt) => mt.biziboxMutavId)
              : [])
          ]
            .filter((mtvId) => !!mtvId)
            .reduce((acmltr0, mtvId) => acmltr0.add(mtvId), acmltr);
        },
        new Set()
      );
      if (setOfCashflowMatchMarked.size && setOfBanktransForMatchMarked.size) {
        this.matchList.selectedUniqueBeneficiaryKeys = new Set(
          Array.from(setOfCashflowMatchMarked).concat(
            Array.from(setOfBanktransForMatchMarked)
          )
        );
      } else {
        this.matchList.selectedUniqueBeneficiaryKeys = new Set([]);
      }
    }

    this.filtersAllCash();
  }

  private validateScrollPresenceInside(): void {
    setTimeout(() => {
      const scrollContainerHasScrollNow =
        this.scrollContainerInside !== null &&
        this.scrollContainerInside.nativeElement.scrollHeight >
        this.scrollContainerInside.nativeElement.clientHeight;
      if (this.scrollContainerInsideHasScroll !== scrollContainerHasScrollNow) {
        this.scrollContainerInsideHasScroll = scrollContainerHasScrollNow;
      }
    });
  }

  public calcSumTotals(): void {
    this.cashflowMatchPopup.sumTotals = this.arr.value.reduce(
      (total, item) =>
        total +
        (item.userMatchTotal !== undefined
          ? Number(item.userMatchTotal)
          : Number(item.targetOriginalTotal)),
      0
    );
  }

  get arr(): FormArray {
    return this.cashflowMatchPopup.table.get('arr') as FormArray;
  }

  bankMatch(): void {
    this.cancelMatch = true;
    const banktransForMatchMarked = this.banktransForMatch.filter(
      (row) => row.deleteRow === true
    );
    if (
      this.matchList.array.length === 1 ||
      banktransForMatchMarked.length > 1
    ) {
      if (this.modalAutoMatch) {
        this.showModalAutoMatch = true;
      } else {
        this.showToastBeforeSendRun();
      }
    } else {
      const periodicTypes: any = [
        'CYCLIC_TRANS',
        'SOLEK_TAZRIM',
        'CCARD_TAZRIM',
        'LOAN_TAZRIM',
        'DIRECTD',
        'CASH'
      ];
      this.cashflowMatchPopup = {
        banktransRow: banktransForMatchMarked[0],
        table: this.fb.group({
          name: 'formGr',
          arr: this.fb.array(
            this.matchList.array.map((it) => {
              const rowCash = this.cashflowMatchAll.find(
                (item) => item.transId === it.transId
              );
              it.isPeriodicType = periodicTypes.includes(
                rowCash.targetTypeName
              );
              it.paymentDescTranslate = rowCash.paymentDescTranslate;
              it.userMatchTotal = new FormControl(
                {
                  value: rowCash.targetOriginalTotal,
                  disabled: ![
                    'CYCLIC_TRANS',
                    'WIRE_TRANSFER',
                    'OTHER',
                    'CHEQUE'
                  ].includes(rowCash.targetTypeName)
                },
                [
                  Validators.minLength(1),
                  Validators.pattern(/^-?[0-9]+(\.[0-9]*){0,1}$/)
                ]
              );
              return this.fb.group(it);
            })
          )
        })
      };
      this.validateScrollPresenceInside();
      this.calcSumTotals();
    }
  }

  showToastBeforeSendRun(): void {
    this.showModalAutoMatch = false;
    this.showToastBeforeSend = true;
    setTimeout(() => {
      if (this.showToastBeforeSend) {
        const biziboxMutavIdToApply =
          this.matchList.selectedUniqueBeneficiaryKeys &&
          this.matchList.selectedUniqueBeneficiaryKeys.size === 1
            ? this.matchList.selectedUniqueBeneficiaryKeys.values().next().value
            : null;
        this.matchList.array.forEach(
          (mtch) => (mtch.biziboxMutavId = biziboxMutavIdToApply)
        );
        this.sharedService
          .bankMatch({
            array: this.matchList.array,
            companyId: this.matchList.companyId
          })
          .pipe(
            tap(() => {
              this.sharedService
                .getBankMatchAccount({
                  uuid: this.userService.appData.userData.bankMatchAccountAcc
                    .companyAccountId
                })
                .subscribe((response: any) => {
                  if (
                    !response.error &&
                    Array.isArray(response.body) &&
                    response.body.length
                  ) {
                    this.userService.appData.userData.bankMatchAccountAcc.countNigrarot =
                      response.body[0].countNigrarot;
                  }
                });
            })
          )
          .subscribe((response: any) => {
            this.matchList = undefined;
            this.showToastBeforeSend = false;
            this.startChild();
          });
      }
    }, 2000);
  }

  bankMatchSubmit(): void {
    if (!this.cashflowMatchPopup.table.valid) {
      BrowserService.flattenControls(this.cashflowMatchPopup.table).forEach(
        (ac) => ac.markAsDirty()
      );
      return;
    }
    const cashData = JSON.parse(JSON.stringify(this.arr.value));
    cashData.forEach((it) => {
      delete it.isPeriodicType;
      delete it.paymentDescTranslate;
      it.searchkeyId = this.cashflowMatchPopup.banktransRow.searchkeyId
        ? this.cashflowMatchPopup.banktransRow.searchkeyId
        : null;
      it.userMatchTotal =
        Number(it.userMatchTotal) === it.targetOriginalTotal
          ? it.targetOriginalTotal
          : Number(it.userMatchTotal);
    });
    this.cashflowMatchPopup = false;
    this.showToastBeforeSend = true;
    setTimeout(() => {
      if (this.showToastBeforeSend) {
        const biziboxMutavIdToApply =
          this.matchList.selectedUniqueBeneficiaryKeys &&
          this.matchList.selectedUniqueBeneficiaryKeys.size === 1
            ? this.matchList.selectedUniqueBeneficiaryKeys.values().next().value
            : null;
        cashData.forEach(
          (mtch) => (mtch.biziboxMutavId = biziboxMutavIdToApply)
        );
        this.sharedService
          .bankMatch({
            array: cashData,
            companyId: this.matchList.companyId
          })
          .pipe(
            tap(() => {
              this.sharedService
                .getBankMatchAccount({
                  uuid: this.userService.appData.userData.bankMatchAccountAcc
                    .companyAccountId
                })
                .subscribe((response: any) => {
                  if (
                    !response.error &&
                    Array.isArray(response.body) &&
                    response.body.length
                  ) {
                    this.userService.appData.userData.bankMatchAccountAcc.countNigrarot =
                      response.body[0].countNigrarot;
                  }
                });
            })
          )
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

    const eventTargetRect = event.currentTarget.getBoundingClientRect();
    // debugger;
    let y =
      eventTargetRect.bottom -
      60 -
      document.getElementById('header').getBoundingClientRect().top;
    let arrow = 'up';
    if (window.screen.height - event.screenY < height + 60) {
      y -= height + 44; // 16px is arrow height
      arrow = 'bottom';
    }

    this.tooltipElem = {
      x: eventTargetRect.left + eventTargetRect.width / 2 - 30,
      y: y,
      height: height,
      arrow: arrow,
      transId: item,
      hidePostponeAction: itemFull
        ? !itemFull.isMatchable
        : // ? !itemFull.hovAvar || this.nonePostponableTypes.includes(itemFull.targetTypeName)
          // // ? !itemFull.isMatchable || !itemFull.hovAvar // this.systemAutoMatchTypes.includes(itemFull.targetTypeName)
        false,
      itemFull: itemFull
    };
    if (
      height === 235 &&
      this.tooltipElem.hidePostponeAction &&
      arrow === 'bottom'
    ) {
      this.tooltipElem.y += 72;
    }

    this.createFromRecommendationDataSetup(height !== 235 ? itemFull : null);
    this.editMovementDataSetup(height === 235 ? itemFull : null);
    // this.deleteOperationDataSetup(height === 235 ? itemFull : null);
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
        paymentDesc: item.paymentDesc,
        // paymentDesc: ['Checks', 'BankTransfer', 'Other'].includes(item.paymentDesc)
        //     ? item.paymentDesc : 'BankTransfer',
        // // paymentDesc: 'BankTransfer',
        targetType: item.targetTypeName || 'CYCLIC_TRANS',
        total: item.total || item.targetOriginalTotal,
        transDate: item.transDate,
        transFrequencyName: 'MONTH',
        transId: item.bankTransId,
        transName: item.targetName || item.transDescAzonly,
        transTypeId: item.transTypeId,
        biziboxMutavId: item.biziboxMutavId,
        fromRecommendation: true,
        hamlazaLoMutavId: item.hamlazaLoMutavId,
        mutavArray: item.mutavArray
        // updatedBy: string
      },
      form: new FormGroup({}),
      visible: false,
      loading: false,
      original: item
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
        hamlazaLoMutavId:
        this.createFromRecommendationData.source.hamlazaLoMutavId,
        bankTransIds: [this.createFromRecommendationData.source.transId],
        expence: this.createFromRecommendationData.source.expence,
        biziboxMutavId: this.createFromRecommendationData.source.biziboxMutavId,
        source: this.createFromRecommendationData.original
          ? this.createFromRecommendationData.original.source
          : null
      }
    );

    this.createFromRecommendationData.loading = true;
    if (dataToSubmit.transFrequencyName === 'WEEK' && dataToSubmit.transDate) {
      if (dataToSubmit.transDate) {
        try {
          dataToSubmit.transDate = new Date(dataToSubmit.transDate);
        } catch (e) {
        }
      }
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
        'DIRECTD',
        'CASH'
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
        const transId =
          item.targetTypeName === 'CYCLIC_TRANS' && item.kvuotUnionId
            ? item.kvuotUnionId
            : this.deleteConfirmationPrompt.optionSelected === 0
              ? item.targetId
              : item.transId;
        this.sharedService
          .deleteOperation({
            params: {
              companyAccountId:
                item.companyAccountId ||
                this.userService.appData.userData.bankMatchAccountAcc
                  .companyAccountId,
              transId: transId,
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
        asmachta: item.targetAsmachta,
        biziboxMutavId: item.biziboxMutavId
        // updatedBy: string
      },
      form: new FormGroup({}),
      visible: false,
      loading: false,
      seriesSource: null
    };
  }

  editMovementShow() {
    // debugger;
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
        // if (['SOLEK_TAZRIM', 'CCARD_TAZRIM', 'LOAN_TAZRIM', 'CYCLIC_TRANS'].includes(this.editMovementData.source.targetType)) {
        this.editMovementData.loading = true;
        combineLatest(
            [
              this.sharedService.getCyclicTransactionSingle({
                companyId:
                this.userService.appData.userData.companySelect.companyId,
                companyAccountId:
                    this.editMovementData.origin.companyAccountId ||
                    this.userService.appData.userData.bankMatchAccountAcc
                        .companyAccountId,
                transId:
                    this.editMovementData.origin.kvuotUnionId ||
                    this.editMovementData.origin.targetId,
                // || this.editMovementData.origin.transId,
                targetType: this.editMovementData.origin.targetTypeName
              }),
              this.editMovementData.source.targetType === 'CYCLIC_TRANS' &&
              (this.editMovementData.origin.unionId ||
                  this.editMovementData.origin.kvuotUnionId) &&
              !Array.isArray(this.editMovementData.source.mutavArray)
                  ? this.sharedService.getUnionBankdetail({
                    companyId:
                    this.userService.appData.userData.companySelect.companyId,
                    dateFrom:
                        this.editMovementData.origin.dateFrom ||
                        this.editMovementData.source.transDate,
                    transId:
                        this.editMovementData.origin.kvuotUnionId ||
                        this.editMovementData.origin.targetId
                  })
                  : of(null)
            ]



        ).subscribe((resSub: any) => {
          const [rslt, unionDataRslt] = resSub;
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
              {},
              this.editMovementData.source,
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
      if (
        Array.isArray(dataToSubmit.mutavArray) &&
        dataToSubmit.mutavArray.length > 0 &&
        dataToSubmit.mutavArray[0].isDeleted === true &&
        !this.editMovementData.origin.kvuotUnionId &&
        this.editMovementData.origin.targetId
      ) {
        dataToSubmit.mutavArray[0].transTazrimMapId =
          this.editMovementData.origin.targetId;
      }

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
          item.targetOriginalDate || item.transDate || 0
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
    // console.log('scrollListToIndex => %o, list has %o',
    //     idx, list.children.length);
    if (list && idx >= 0 && idx < list.children.length) {
      // console.log('scrolling to %o with %o', idx, opts);
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
      ...this.cashflowMatch.partialMatch.children.filter(
        (item) => item.checkRow === true
      ),
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
     [
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

         // debugger;
         const targetType = item.targetTypeName || item.targetType;
         return this.sharedService.updateSingleTransactionFromBankMatch(
             targetType,
             dataToSubmit
         );
         // return this.sharedService.updateCyclicTransaction(EditingType.Single,
         //     targetType,
         //     dataToSubmit);
       })

     ]

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
      ...this.cashflowMatch.partialMatch.children.filter(
        (item) => item.checkRow === true
      ),
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
            const transId =
                targetType === 'CYCLIC_TRANS' && item.kvuotUnionId
                    ? item.kvuotUnionId
                    : item.targetId;
            return this.sharedService.deleteOperation({
              params: {
                companyAccountId:
                    item.companyAccountId ||
                    this.userService.appData.userData.bankMatchAccountAcc
                        .companyAccountId,
                transId: transId,
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
      mutavArray: Array<any>;
      biziboxMutavId: string;
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
    srcClone.mutavArray = editResult.mutavArray;
    srcClone.biziboxMutavId = editResult.biziboxMutavId;

    return srcClone;
  }

  rolloutDeleteOperationConfirmPrompt(item?: any): void {
    console.log('delete prompt called for %o', item);
    if (item) {
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
          'DIRECTD',
          'CASH'
        ].includes(item.targetTypeName)
          ? 'FIXED'
          : null);

      const options = this.translate.instant(
        `actions.deleteMovement.body.${itemType}.options`
      );

      this.deleteConfirmationPrompt = {
        visible: true,
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
          const transId =
            item.targetTypeName === 'CYCLIC_TRANS' && item.kvuotUnionId
              ? item.kvuotUnionId
              : this.deleteConfirmationPrompt.optionSelected === 0
                ? item.targetId
                : item.transId;
          this.sharedService
            .deleteOperation({
              params: {
                companyAccountId:
                  item.companyAccountId ||
                  this.userService.appData.userData.bankMatchAccountAcc
                    .companyAccountId,
                transId: transId,
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
    } else {
      const checkedItems = [
        ...this.cashflowMatch.partialMatch.children.filter(
          (itm) => itm.checkRow === true
        ),
        ...this.cashflowMatch.nigreret.children.filter(
          (itm) => itm.checkRow === true
        ),
        ...this.cashflowMatch.future.children.filter(
          (itm) => itm.checkRow === true
        )
      ];
      if (checkedItems.length === 0) {
        this.deleteConfirmationPrompt = null;
        return;
      } else if (checkedItems.length === 1) {
        this.rolloutDeleteOperationConfirmPrompt(checkedItems[0]);
        return;
      }

      this.deleteConfirmationPrompt = {
        visible: true,
        item: checkedItems,
        transName: null,
        type: 'multi',
        title: this.translate.instant('actions.deleteMovement.titleMulti'),
        options: null,
        optionSelected: null,
        processing: false,
        onApprove: () => {
          this.deleteConfirmationPrompt.processing = true;
          combineLatest(
                checkedItems.map((itm) => {
                  const targetType = itm.targetTypeName || itm.targetType;
                  const transId =
                      targetType === 'CYCLIC_TRANS' && itm.kvuotUnionId
                          ? itm.item.kvuotUnionId
                          : itm.targetId;
                  return this.sharedService.deleteOperation({
                    params: {
                      companyAccountId:
                          itm.companyAccountId ||
                          this.userService.appData.userData.bankMatchAccountAcc
                              .companyAccountId,
                      transId: transId,
                      dateFrom: itm.dateFrom
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
              }),
              tap({
                complete: () =>
                  (this.deleteConfirmationPrompt.processing = false)
              })
            )
            .subscribe(([succeeded, failed]: any) => {
              if (!failed.length) {
                this.deleteConfirmationPrompt = null;
                this.startChild();
              }
              console.log('multi-delete finished: %o, %o', succeeded, failed);
            });
        }
      };
    }
  }

  private rebuildBeneficiaryFilterOptions(
    type: 'bank' | 'cashflow' = 'bank',
    withOtherFiltersApplied: any[]
  ): void {
    if (
      !Array.isArray(withOtherFiltersApplied) ||
      !withOtherFiltersApplied.length
    ) {
      this.beneficiaryFilter[type].options = [];
      this.beneficiaryFilter[type].filter.setValue(null);
      return;
    }

    const availableOptions = Array.from(
      withOtherFiltersApplied.reduce((acmltr, trns) => {
        return Array.isArray(trns.mutavNames) && trns.mutavNames.length
          ? trns.mutavNames.reduce((acmltr0, mn) => acmltr0.add(mn), acmltr)
          : acmltr;
      }, new Set())
    ).map((beneficiaryName: any) => {
      return {
        val: beneficiaryName,
        id: beneficiaryName,
        checked:
          !Array.isArray(this.beneficiaryFilter[type].filter.value) ||
          this.beneficiaryFilter[type].filter.value.includes(beneficiaryName)
      };
    });
    // const availableOptions = Array.from(withOtherFiltersApplied.reduce((acmltr, trns) => {
    //         return trns.beneficiary ? acmltr.add(trns.beneficiary) : acmltr;
    //     }, new Set())
    // ).map((beneficiary: any) => {
    //     return {
    //         val: beneficiary.accountMutavName,
    //         id: beneficiary.biziboxMutavId,
    //         checked: !Array.isArray(this.beneficiaryFilter.value)
    //             || this.beneficiaryFilter.value.includes(beneficiary.biziboxMutavId)
    //     };
    // });

    // if (!availableOptions.length) {
    //     this.beneficiaryFilterOptions = [];
    //     this.beneficiaryFilter.setValue(null);
    //     return;
    // }
    if (
      withOtherFiltersApplied.some(
        (trns) => !Array.isArray(trns.mutavNames) || !trns.mutavNames.length
      )
    ) {
      availableOptions.push({
        val: 'ללא מוטב',
        id: 'n/a',
        checked:
          !Array.isArray(this.beneficiaryFilter[type].filter.value) ||
          this.beneficiaryFilter[type].filter.value.includes('n/a')
      });
    }

    if (Array.isArray(this.beneficiaryFilter[type].filter.value)) {
      const valueStillAvailable = this.beneficiaryFilter[
        type
        ].filter.value.filter((fval) =>
        availableOptions.some((opt) => opt.id === fval)
      );
      if (
        valueStillAvailable.length !==
        this.beneficiaryFilter[type].filter.value.length
      ) {
        this.beneficiaryFilter[type].filter.setValue(
          valueStillAvailable.length === 0 ? null : valueStillAvailable
        );
      }
    }

    this.beneficiaryFilter[type].options = [
      {
        val: this.translate.instant('filters.all'),
        id: 'all',
        checked: availableOptions.every((opt) => !!opt.checked)
      },
      ...availableOptions
    ];
    // console.log('this.beneficiaryFilterOptions => %o', this.beneficiaryFilterOptions);
  }

  filterBeneficiaries(type: 'bank' | 'cashflow' = 'bank', val: any) {
    this.beneficiaryFilter[type].filter.setValue(val.checked);
    if (type === 'cashflow') {
      this.filtersAllCash('biziboxMutavId');
    } else {
      this.filtersAll('biziboxMutavId');
    }
  }

  private withBeneficiaryFilterApplied(
    type: 'bank' | 'cashflow' = 'bank',
    withOtherFiltersApplied: any[]
  ): any[] {
    if (
      !Array.isArray(this.beneficiaryFilter[type].filter.value) ||
      !Array.isArray(withOtherFiltersApplied) ||
      !withOtherFiltersApplied.length
    ) {
      return withOtherFiltersApplied;
    }

    if (this.beneficiaryFilter[type].filter.value.includes('n/a')) {
      const nonEmptyFilterVals = this.beneficiaryFilter[
        type
        ].filter.value.filter((v) => v !== 'n/a');
      return withOtherFiltersApplied.filter(
        (item) =>
          !Array.isArray(item.mutavNames) ||
          !item.mutavNames.length ||
          (nonEmptyFilterVals.length &&
            Array.isArray(item.mutavNames) &&
            item.mutavNames.length > 0 &&
            nonEmptyFilterVals.some((bnfName) =>
              item.mutavNames.includes(bnfName)
            ))
      );
    }
    return this.filterPipe.transform(
      withOtherFiltersApplied,
      this.beneficiaryFilter[type].filter.value,
      ['mutavNames']
    );
  }
}
