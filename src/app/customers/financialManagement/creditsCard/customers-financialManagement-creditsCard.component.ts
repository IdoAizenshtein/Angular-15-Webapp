import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { UserService } from '@app/core/user.service';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import { Subject, Subscription, of } from 'rxjs';
import { map, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  templateUrl: './customers-financialManagement-creditsCard.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersFinancialManagementCreditsCardComponent
  implements OnInit, OnDestroy
{
  public getDataCardsEvent: Subject<any> = new Subject<any>();
  public subscription: Subscription;
  public loader: boolean = true;

  constructor(
    public translate: TranslateService,
    public sharedComponent: SharedComponent,
    public userService: UserService,
    private sharedService: SharedService
  ) {
    // if (this.userService.appData.userData.accounts) {
    //     this.getCreditCardDetails();
    // } else {
    //     this.subscription = sharedComponent.getDataEvent.subscribe((value) => {
    //         this.getCreditCardDetails();
    //     });
    // }
  }

  setBase() {
    this.loader = true;
    this.userService.appData.userData.creditCards = null;
  }

  ngOnInit(): void {
    this.subscription = this.sharedComponent.getDataEvent
      .pipe(
        startWith(true),
        tap(() => this.setBase()),
        map(() => this.userService.appData.userData.accounts),
        switchMap((val) => {
          if (Array.isArray(val)) {
            return this.sharedService.getCreditCardDetails(
              val.map((id) => {
                return { uuid: id.companyAccountId };
              })
            );
          }
          return of(null);
        }),
        map((response:any) => (response && !response.error ? response.body : null)),
        tap((response:any) =>
          this.userService.rebuildSelectedCompanyCreditCards(response)
        )
      )
      .subscribe(() => {
        this.loader = false;
        this.getDataCardsEvent.next(true);
      });
  }

  // getCreditCardDetails(): void {
  //     this.sharedService.getCreditCardDetails(this.userService.appData.userData.accounts.map((id) => {
  //             return {'uuid': id.companyAccountId};
  //         })
  //     ).subscribe(
  //         response => {
  //             const data = (response) ? response['body'] : response;
  //
  //             const updatedIfLaterThanI = new Date();
  //             // updatedIfLaterThanI.setDate(updatedIfLaterThanI.getDate() - 1);
  //             updatedIfLaterThanI.setHours(0, 0, 0, 0);
  //             const accountsSorted = [].concat(this.userService.appData.userData.accounts).sort((a, b) => {
  //                 if (Boolean(a.primaryAccount) === Boolean(b.primaryAccount)) {
  //                     return a.dateCreated - b.dateCreated;
  //                 }
  //                 if (Boolean(a.primaryAccount) && !Boolean(b.primaryAccount)) {
  //                     return -1;
  //                 }
  //                 return 1;
  //             });
  //
  //             this.userService.appData.userData.creditCards = [];
  //             accountsSorted.forEach((acc:any) => {
  //                 const matchCards = data.filter((card) => {
  //                     if (card.companyAccountId === acc.companyAccountId) {
  //                         // card.check = true;
  //                         card.currency = acc.currency;
  //                         const lastUpdateAt = card.balanceLastUpdatedDate ? new Date(card.balanceLastUpdatedDate) : null;
  //                         card.balanceOutdatedDays = lastUpdateAt != null
  //                             ? getDaysBetweenDates(lastUpdateAt, updatedIfLaterThanI)
  //                             : null;
  //                         card.balanceIsUpToDate = card.balanceOutdatedDays != null && card.balanceOutdatedDays <= 0;
  //
  //                         return card;
  //                     }
  //                 });
  //                 if (matchCards.length) {
  //                     matchCards.sort((a, b) => a.dateCreated - b.dateCreated);
  //                     this.userService.appData.userData.creditCards.push(Object.assign({
  //                         children: matchCards// ,
  //                         // check: true
  //                     }, acc));
  //                 }
  //             });
  //             this.getDataCardsEvent.next(true);
  //         }, (err: HttpErrorResponse) => {
  //             if (err.error instanceof Error) {
  //                 console.log('An error occurred:', err.error.message);
  //             } else {
  //                 console.log(`Backend returned code ${err.status}, body was: ${err.error}`);
  //             }
  //         }
  //     );
  // }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.getDataCardsEvent) {
      this.getDataCardsEvent.next(true);
      this.getDataCardsEvent.unsubscribe();
    }

    if (
      this.userService.appData.userData &&
      this.userService.appData.userData.creditCards
    ) {
      this.userService.appData.userData.creditCards = null;
    }
  }
}
