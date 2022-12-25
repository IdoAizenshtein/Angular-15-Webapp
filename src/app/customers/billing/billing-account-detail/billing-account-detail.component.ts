import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { BehaviorSubject, EMPTY, Observable, Subscription, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  switchMap,
  take,
  tap,
  withLatestFrom
} from 'rxjs/operators';
import {
  BillingAccount,
  BillingAccountsListComponent
} from '../billing-accounts-list/billing-accounts-list.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ValidatorsFactory } from '@app/shared/component/foreign-credentials/validators';
import { BrowserService } from '@app/shared/services/browser.service';
import { PRE_HANDLED_ACCOUNT_ID } from '../customers-billing.component';
import { Dropdown } from 'primeng/dropdown';
import { UserService } from '@app/core/user.service';

@Component({
  templateUrl: './billing-account-detail.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class BillingAccountDetailComponent implements OnInit, OnDestroy {
  private billingAccount: BillingAccount;
  billingAccountDetails$: Observable<BillingAccountDetails>;
  billingAccountPayments$: Observable<Array<BillingPayment>>;
  readonly cancelServicePopUp: { visible: boolean } = { visible: false };
  readonly detailsForm: any;

  preHandledAccountId = PRE_HANDLED_ACCOUNT_ID;

  loadingDetails$: BehaviorSubject<boolean> = new BehaviorSubject(
    false
  );
  private formUpdateSub: Subscription;

  toggledPayment: BillingPayment;
  reportMailSubmitterToggle = false;

  public valuesEndBiziboxService: EndBiziboxService = {
    reason: null,
    text: ''
  };

  public reasonList: any = [
    { label: '', value: null },
    { label: 'מחיר', value: 'מחיר' },
    { label: 'שירות', value: 'שירות' },
    { label: 'המוצר אינו עונה על צרכיי', value: 'המוצר אינו עונה על צרכיי' },
    { label: 'אחר', value: 'אחר' }
  ];

  constructor(
    public sharedService: SharedService,
    private route: ActivatedRoute,
    private router: Router,
    public userService: UserService,
    private parent: BillingAccountsListComponent
  ) {
    this.detailsForm = new FormGroup({
      billingAccountCompanyName: new FormControl('', [Validators.required]),
      billingAccountHp: new FormControl('', [
        Validators.required,
        // Validators.minLength(9),
        Validators.maxLength(9),
        Validators.pattern('\\d+'),
        ValidatorsFactory.idValidatorIL
      ]),
      billingAccountCity: new FormControl(''),
      billingAccountAddress: new FormControl(''),
      billingAccountName: new FormControl(''),
      billingAccountEmail: new FormControl('', [
        Validators.required,
        Validators.email
      ]),
      billingAccountPhone: new FormControl('', [
        Validators.minLength(10),
        Validators.maxLength(11),
        ValidatorsFactory.cellNumberValidatorIL
      ]),
      leloMaam: new FormControl(false)
    });
  }

  ngOnInit() {
    this.billingAccountDetails$ = this.route.paramMap.pipe(
      tap(() => this.loadingDetails$.next(true)),
      withLatestFrom(this.parent.billingAccounts$),
      switchMap(([params, billingAccounts]) => {
        const selectedId = params.get('billingAccountId');
        if (selectedId === PRE_HANDLED_ACCOUNT_ID) {
          this.detailsForm.get('leloMaam').enable({
            emitEvent: false
          });
        } else {
          this.detailsForm.get('leloMaam').disable({
            emitEvent: false
          });
        }

        this.billingAccount = billingAccounts.find(
          (ba) => ba.billingAccountId === selectedId
        );

        this.userService.appData.userData.billingLite = false;
        if (
          this.userService.appData.userData.companies &&
          this.userService.appData.userData.companies.length &&
          this.billingAccount
        ) {
          const companiesLite =
            this.userService.appData.userData.companies.filter(
              (c) => c.biziboxType === 'regular'
            );
          if (companiesLite.length) {
            const idAllCompanies = this.billingAccount.companies.map(
              (id) => id.companyId
            );
            this.userService.appData.userData.billingLite =
              idAllCompanies.every(
                (id) =>
                  companiesLite.filter((ids) => ids.companyId === id).length
              );
          }
        }

        if (!this.billingAccount) {
          return EMPTY;
        }

        return this.sharedService.getBillingAccountsDetails({
          billingAccountId: this.billingAccount.billingAccountId,
          companyIds: this.billingAccount.companies.map(
            (comp) => comp.companyId
          )
        });
      }),
      catchError(() => of(null)),
      map((resp:any) => (resp && !resp.error ? resp.body : null)),
      tap((result) => {
        if (result) {
          this.sharedService.cities$.pipe(take(1)).subscribe((cities) => {
            // debugger;
            const formDataToSet = Object.assign(
              {
                billingAccountCity: result.billingAccountCityId
                  ? cities.find(
                      (cty) => cty.cityId === result.billingAccountCityId
                    )
                  : ''
              },
              result
            );
            this.detailsForm.reset(formDataToSet, {
              emitEvent: false
            });
            this.loadingDetails$.next(false);
          });
        } else {
          this.detailsForm.reset(
            {},
            {
              emitEvent: false
            }
          );
          this.loadingDetails$.next(false);
        }
      }),
      shareReplay(1)
    );

    this.billingAccountPayments$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const selectedId = params.get('billingAccountId');
        if (selectedId === 'add') {
          return EMPTY;
        }

        return this.sharedService.getBillingPaymentsHistory(selectedId);
      }),
      catchError(() => of(null)),
      map((resp:any) => (resp && !resp.error ? resp.body : [])),
      shareReplay(1)
    );

    this.formUpdateSub = this.detailsForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        withLatestFrom(this.loadingDetails$),
        filter(([val, isLoading]) => {
          return !isLoading;
          // && this.billingAccount && this.billingAccount.billingAccountId !== PRE_HANDLED_ACCOUNT_ID;
        }),
        switchMap(([val]) => this.fireFormSubmit())
      )
      .subscribe((rslt) => console.log('rslt ====> %o', rslt));
  }

  ngOnDestroy(): void {
    if (this.formUpdateSub) {
      this.formUpdateSub.unsubscribe();
    }
  }

  detailsFormSubmit(cardcomUpdateForce = false) {
    // const cardcomWindow = this.createPopupCenter('Cardcom tab', 1000, 600);
    this.fireFormSubmit(cardcomUpdateForce)
      .pipe(map((rslt) => (rslt && !rslt.error ? rslt.body : null)))
      .subscribe((rslt) => {
        console.log('rslt ====> %o', rslt);

        if (typeof rslt === 'string' && rslt.startsWith('http')) {
          window.open(rslt, '_self');
          // cardcomWindow.location.href = rslt;
          // } else {
          //     cardcomWindow.close();
        }
      });
  }

  private fireFormSubmit(cardcomUpdateForce = false): Observable<any> {
    // debugger;
    if (this.detailsForm.invalid) {
      BrowserService.flattenControls(this.detailsForm).forEach((ac) =>
        ac.markAsDirty()
      );
      return EMPTY;
    }

    const updated = Object.assign(
      {
        billingAccountId: this.billingAccount.billingAccountId
      },
      this.detailsForm.value,
      {
        billingAccountCityId: this.detailsForm.value.billingAccountCity
          ? this.detailsForm.value.billingAccountCity.cityId
          : null
      }
    );
    delete updated.billingAccountCity;

    let updateObs;
    if (cardcomUpdateForce) {
      // if (cardcomUpdateForce || PRE_HANDLED_ACCOUNT_ID === this.billingAccount.billingAccountId) {
      updateObs = this.sharedService.getCardcomClient(updated);
    } else {
      updateObs = this.sharedService.updateBillingAccount(updated);
    }
    return updateObs;
  }

  // private createPopupCenter(title, w, h): Window {
  //     // Fixes dual-screen position                         Most browsers      Firefox
  //     const dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : window.screenX;
  //     const dualScreenTop = window.screenTop !== undefined ? window.screenTop : window.screenY;
  //
  //     const width = window.innerWidth ? window.innerWidth
  //         : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
  //     const height = window.innerHeight ? window.innerHeight
  //         : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;
  //
  //     const systemZoom = width / window.screen.availWidth;
  //     const left = (width - w) / 2 / systemZoom + dualScreenLeft;
  //     const top = (height - h) / 2 / systemZoom + dualScreenTop;
  //     const newWindow = window.open('about:blank',
  //         title,
  //         'scrollbars=yes, width=' + w / systemZoom + ', height=' + h / systemZoom + ', top=' + top + ', left=' + left);
  //
  //     // Puts focus on the newWindow
  //     if (window.focus) {
  //         newWindow.focus();
  //     }
  //
  //     return newWindow;
  // }

  downloadInvoice(billingAccountPayment: BillingPayment) {
    if (!billingAccountPayment) {
      return;
    }

    // continue from here when backend get ready
    this.sharedService
      .downloadBillingInvoice({
        invoiceNumber: billingAccountPayment.invoiceNumber,
        invoiceresponseInvoicetype:
          billingAccountPayment.invoiceresponseInvoicetype
      })
      .subscribe(() => {});
  }

  sendInvoice($event: string) {
    if (!this.toggledPayment || !$event) {
      return;
    }

    // continue from here when backend get ready
    this.sharedService
      .sendBillingInvoice({
        emailAddress: $event,
        invoiceNumber: this.toggledPayment.invoiceNumber,
        invoiceresponseInvoicetype:
          this.toggledPayment.invoiceresponseInvoicetype
      })
      .subscribe(() => {
        this.reportMailSubmitterToggle = false;
      });
  }

  hideDDForcibly(cityDD: Dropdown) {
    setTimeout(() => {
      cityDD.hide();
    }, 300);
  }

  cancelServiceShow(): void {
    this.valuesEndBiziboxService.reason = null;
    this.valuesEndBiziboxService.text = '';
    this.cancelServicePopUp.visible = true;
  }

  onCancelServicePopUpHide(): void {
    this.cancelServicePopUp.visible = false;
  }

  endBiziboxService(): void {
    this.sharedService
      .endBiziboxService({
        companyIds: this.billingAccount.companies.map((comp) => comp.companyId),
        reason: this.valuesEndBiziboxService.reason
          ? this.valuesEndBiziboxService.reason
          : '',
        text: this.valuesEndBiziboxService.text
      })
      .subscribe(() => {
        this.valuesEndBiziboxService.reason = null;
        this.valuesEndBiziboxService.text = '';
        this.cancelServicePopUp.visible = false;
      });
  }
}

export class BillingAccountDetails {
  accountant: boolean;
  billingAccountAddress: string;
  billingAccountCity: string;
  billingAccountCompanyName: string;
  billingAccountEmail: string;
  billingAccountHp: number;
  billingAccountId: string;
  billingAccountName: string;
  billingAccountPhone: string;
  extspCardnumber5: number;
  extspMutag24: string;
  leloMaam: boolean;
  nextPaymentDate: number;
  nextPaymentTotal: number;
  paymentTypeId: string;
  cardvaliditymonth: number;
  cardvalidityyear: number;
  operationresponse: number;
}

export class BillingPayment {
  billingPaymentId: string;
  extspCardnumber5: number;
  extspMutag24: string;
  invoiceNumber: number;
  invoiceresponseInvoicetype: string;
  paymentDate: number;
  paymentTypeId: number;
  status: number;
  sumtobill: number;
}

interface EndBiziboxService {
  reason: any;
  text: string;
}
