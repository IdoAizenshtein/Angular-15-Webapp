import { UserService } from '@app/core/user.service';
import { AccountSelectComponent } from '@app/shared/component/account-select/account-select.component';

export class CreditCardSelectionSummary {
  count = 0;
  availableCredit: number | null;
  cycleDay: number | null;
  currency: string | null;
  creditCardTypeId: number | null;

  selectedAccounts: any[] = [];
  selectedCards: any[] = [];

  creditLimitAlmostReachedFor: any[] = [];
  creditCardsOutdated: any[] = [];
  allCreditCardsOutdatedBecauseNotFound: boolean;

  private readonly CURRENCIES_ORDER = ['ILS', 'USD', 'EUR'];
  private _sumForSelectedPeriod: { [cur: string]: number } | null;
  get sumForSelectedPeriod(): { [cur: string]: number } {
    return this._sumForSelectedPeriod;
  }

  set sumForSelectedPeriod(val: { [cur: string]: number } | null) {
    this._sumForSelectedPeriod = val;
    if (val === null) {
      this.sumForSelectedPeriodArr = null;
    } else {
      this.sumForSelectedPeriodArr = Object.entries(val);
      this.sumForSelectedPeriodArr.sort((a, b) => {
        const aIdx = this.CURRENCIES_ORDER.indexOf(a[0]),
          bIdx = this.CURRENCIES_ORDER.indexOf(b[0]);
        if (aIdx < 0 && aIdx < 0 === bIdx < 0) {
          return 0;
        } else if (aIdx < 0) {
          return 1;
        } else if (bIdx < 0) {
          return -1;
        } else {
          return aIdx - bIdx;
        }
      });
    }
  }

  sumForSelectedPeriodArr: [string, number][];

  constructor(public userService: UserService) {}

  reset() {
    this.availableCredit =
      this.sumForSelectedPeriod =
      this.cycleDay =
      this.currency =
      this.creditCardTypeId =
        null;
    this.count = 0;

    this.selectedAccounts =
      this.userService.appData.userData.creditCards.filter(
        (ccAcc) =>
          ccAcc.check === true || ccAcc.children.some((cc) => cc.check === true)
      );

    this.selectedCards = this.selectedAccounts.reduce((acmltr, ccAcc) => {
      return acmltr.concat(ccAcc.children.filter((cc) => cc.check === true));
    }, []);
    this.count = this.selectedCards.length;

    this.creditLimitAlmostReachedFor = this.selectedCards.filter((cc) => {
      return (
        cc.availableCredit !== null &&
        cc.creditLimit &&
        cc.availableCredit / cc.creditLimit < 0.3
      );
    });

    this.creditCardsOutdated = this.selectedCards.filter(
      (cc) => !cc.balanceIsUpToDate
    );
    // debugger;
    this.allCreditCardsOutdatedBecauseNotFound = this.creditCardsOutdated.every(
      (cc) => cc.alertStatus === 'Not found in bank website'
    );

    if (this.selectedAccounts.length > 0) {
      this.currency = AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY;
      // if (this.selectedAccounts.every((acc, idx, arr) => acc.currency === arr[0].currency)) {
      //     this.currency = this.selectedAccounts[0].currency;
      // }
    }

    if (this.selectedCards.length > 0) {
      if (this.selectedCards.every((cc) => cc.availableCredit !== null)) {
        this.availableCredit = this.selectedCards.reduce((acmltr, cc) => {
          acmltr += +cc.availableCredit;
          return acmltr;
        }, 0);
      }

      if (this.selectedCards.length === 1) {
        this.cycleDay = this.selectedCards[0].cycleDay;
        this.creditCardTypeId = this.selectedCards[0].creditCardTypeId;
      }
    }
  }
}
