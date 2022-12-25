import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { UserService } from '@app/core/user.service';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import { Subscription } from 'rxjs';
import { filter, startWith } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { getCurrencySymbol } from '@angular/common';
import { ReloadServices } from '@app/shared/services/reload.services';

@Component({
  templateUrl: './customers-tazrim-bankmatch.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersTazrimBankmatchComponent
  extends ReloadServices
  implements OnInit, OnDestroy
{
  public subscription: Subscription;
  public componentRefChild: any;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private sharedService: SharedService,
    public userService: UserService,
    public override sharedComponent: SharedComponent
  ) {
    super(sharedComponent);

    // if (this.userService.appData.userData.accounts) {
    //     this.getBankMatchAccount();
    // } else {
    //     this.subscription = sharedComponent.getDataEvent.subscribe(() => this.getBankMatchAccount());
    // }
  }
  override reload() {
    console.log('reload child');
    this.ngOnInit();
  }
  ngOnInit(): void {
    this.subscription = this.sharedComponent.getDataEvent
      .pipe(
        startWith(true),
        filter(
          () =>
            this.userService.appData &&
            this.userService.appData.userData &&
            Array.isArray(this.userService.appData.userData.accounts)
        )
      )
      .subscribe(() => this.getBankMatchAccount(true));
  }

  getBankMatchAccount(dontReset?: boolean): void {
    if (!dontReset) {
      this.componentRefChild.resetVars();
    }
    const parameters: any = this.userService.appData.userData.accounts.map(
      (account) => {
        return {
          uuid: account.companyAccountId
        };
      }
    );

    this.sharedService
      .getBankMatchAccount(parameters)
      .subscribe((response: any) => {
        this.userService.appData.userData.bankMatchAccount = response
          ? response['body']
          : response;
        if (!this.userService.appData.userData.bankMatchAccount.length) {
          this.componentRefChild.resetVars();
          this.componentRefChild.loader = false;
          this.componentRefChild.loaderCash = false;
        }
        this.userService.appData.userData.bankMatchAccount.sort((a, b) => {
          a.active = false;
          b.active = false;
          const trnsAccA = this.userService.appData.userData.accounts.find(
            (acc:any) => acc.companyAccountId === a.companyAccountId
          );
          const trnsAccB = this.userService.appData.userData.accounts.find(
            (acc:any) => acc.companyAccountId === b.companyAccountId
          );
          a.currency =
            trnsAccA && trnsAccA.currency !== 'ILS'
              ? getCurrencySymbol(trnsAccA.currency, 'narrow')
              : '';
          a.bankIconSrc = trnsAccA
            ? '/assets/images/bank' + trnsAccA.bankId + '.png'
            : null;
          b.currency =
            trnsAccB && trnsAccB.currency !== 'ILS'
              ? getCurrencySymbol(trnsAccB.currency, 'narrow')
              : '';
          b.bankIconSrc = trnsAccB
            ? '/assets/images/bank' + trnsAccB.bankId + '.png'
            : null;
          if (
            Boolean(trnsAccA.primaryAccount) ===
            Boolean(trnsAccB.primaryAccount)
          ) {
            return a.dateCreated - b.dateCreated;
          }
          if (Boolean(trnsAccA.primaryAccount) && !trnsAccB.primaryAccount) {
            return -1;
          }
          return 1;
        });
        try {
          let bankMatchAccountNavigateTo;
          if (
            this.userService.appData.userData.bankMatchAccountIdNavigateTo &&
            (bankMatchAccountNavigateTo =
              this.userService.appData.userData.bankMatchAccount.find(
                (acc:any) =>
                  acc.companyAccountId ===
                  this.userService.appData.userData.bankMatchAccountIdNavigateTo
              ))
          ) {
            this.setBankAcc(bankMatchAccountNavigateTo);
          } else {
            let idx = 0;
            if (this.router.url.includes('casflow')) {
              idx =
                this.userService.appData.userData.bankMatchAccount.findIndex(
                  (acc:any) => acc.countNigrarot !== 0
                );
            } else if (
              this.userService.appData.userData.accountSelect &&
              this.userService.appData.userData.accountSelect.length === 1
            ) {
              idx = Math.max(
                this.userService.appData.userData.bankMatchAccount.findIndex(
                  (acc:any) =>
                    acc.companyAccountId ===
                    this.userService.appData.userData.accountSelect[0]
                      .companyAccountId
                ),
                0
              );
            }
            this.setBankAcc(
              this.userService.appData.userData.bankMatchAccount[idx]
            );
          }
        } finally {
          this.userService.appData.userData.bankMatchAccountIdNavigateTo = null;
        }
      });
  }

  setBankAcc(acc: any): boolean {
    if (acc !== this.userService.appData.userData.bankMatchAccountAcc) {
      this.userService.appData.userData.bankMatchAccountAcc = acc;
      this.componentRefChild.startChild();
      return true;
    }
    return false;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.userService.appData && this.userService.appData.userData) {
      if (this.userService.appData.userData.bankMatchAccountAcc) {
        this.userService.appData.userData.bankMatchAccountIdNavigateTo =
          this.userService.appData.userData.bankMatchAccountAcc.companyAccountId;
        delete this.userService.appData.userData.bankMatchAccountAcc;
      }

      if ('bankMatchAccount' in this.userService.appData.userData) {
        delete this.userService.appData.userData.bankMatchAccount;
      }
    }
    this.destroy();
  }

  onActivate(componentRef: any) {
    this.componentRefChild = componentRef;
    if (
      this.userService.appData.userData.bankMatchAccount &&
      this.userService.appData.userData.bankMatchAccountAcc
    ) {
      let accWithNig;
      let childStarted;
      if (
        this.router.url.includes('casflow') &&
        this.userService.appData.userData.bankMatchAccountAcc.countNigrarot ===
          0 &&
        (accWithNig = this.userService.appData.userData.bankMatchAccount.find(
          (acc:any) => acc.countNigrarot !== 0
        ))
      ) {
        childStarted = this.setBankAcc(accWithNig);
      } else {
        // this.componentRefChild.startChild();
        childStarted = this.setBankAcc(
          this.userService.appData.userData.bankMatchAccountAcc
        );
      }

      if (!childStarted) {
        this.componentRefChild.startChild();
      }
    }
  }
}
