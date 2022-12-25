import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import { UserService } from '@app/core/user.service';
import { SharedComponent } from '@app/shared/component/shared.component'; //import {sharedComponent} from '@app/customers.component';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { getDaysBetweenDates } from '@app/shared/functions/getDaysBetweenDates';
import { startWith } from 'rxjs/operators';

@Component({
  templateUrl: './customers-financialManagement-slika.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class CustomersFinancialManagementSlikaComponent
  implements OnInit, OnDestroy
{
  public getDataSolekEvent: Subject<any> = new Subject<any>();
  public subscription: Subscription;

  constructor(
    public translate: TranslateService,
    public sharedComponent: SharedComponent,
    public userService: UserService,
    private sharedService: SharedService
  ) {}

  ngOnInit(): void {
    this.subscription = this.sharedComponent.getDataEvent
      .pipe(startWith(true))
      .subscribe(() => {
        this.getSlikaCfl();
      });
  }

  getSlikaCfl(): void {
    this.userService.appData.userData.slika = null;
    if (
      this.userService.appData &&
      this.userService.appData.userData &&
      Array.isArray(this.userService.appData.userData.accounts)
    ) {
      this.sharedService
        .getSlikaCfl(
          this.userService.appData.userData.accounts.map((id) => {
            return { uuid: id.companyAccountId };
          })
        )
        .subscribe(
          (response:any) => {
            const data = response ? response['body'] : response;

            this.userService.appData.userData.slikaSums = {
              futureBallance: data.futureBallance,
              futureCharges: data.futureCharges,
              futureCredits: data.futureCredits
            };

            this.userService.appData.userData.slika = [];

            if (Array.isArray(data.solekDetails)) {
              const updatedIfLaterThanI = new Date();
              // updatedIfLaterThanI.setDate(updatedIfLaterThanI.getDate() - 1);
              updatedIfLaterThanI.setHours(0, 0, 0, 0);
              const accountsSorted = []
                .concat(this.userService.appData.userData.accounts)
                .sort((a, b) => {
                  if (Boolean(a.primaryAccount) === Boolean(b.primaryAccount)) {
                    return a.dateCreated - b.dateCreated;
                  }
                  if (Boolean(a.primaryAccount) && !b.primaryAccount) {
                    return -1;
                  }
                  return 1;
                });
              accountsSorted.forEach((acc:any) => {
                const matchSolek = data.solekDetails.filter((slika) => {
                  if (slika.companyAccountId === acc.companyAccountId) {
                    // slika.check = true;
                    slika.currency = acc.currency;
                    const lastUpdateAt = slika.ballanceLastUpdatedDate
                      ? new Date(slika.ballanceLastUpdatedDate)
                      : null;
                    slika.balanceOutdatedDays =
                      lastUpdateAt != null
                        ? getDaysBetweenDates(lastUpdateAt, updatedIfLaterThanI)
                        : null;
                    slika.balanceIsUpToDate =
                      slika.balanceOutdatedDays != null &&
                      slika.balanceOutdatedDays <= 0;

                    return slika;
                  }
                });
                if (matchSolek.length) {
                  this.userService.appData.userData.slika.push(
                    Object.assign(
                      {
                        children: matchSolek // ,
                        // check: true
                      },
                      acc
                    )
                  );
                }
              });
            }
            this.getDataSolekEvent.next(true);
          },
          (err: HttpErrorResponse) => {
            if (err.error instanceof Error) {
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

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    if (this.getDataSolekEvent) {
      this.getDataSolekEvent.unsubscribe();
    }

    if (
      this.userService.appData &&
      this.userService.appData.userData &&
      this.userService.appData.userData.slika
    ) {
      this.userService.appData.userData.slika = null;
    }
  }
}
