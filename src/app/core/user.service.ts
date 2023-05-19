import {Injectable, OnDestroy, Optional} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {ReCaptchaV3Service} from 'ng-recaptcha';

export class UserServiceConfig {
    public appData: object = {};
}

@Injectable()
export class UserService implements OnDestroy {
    public appData: any = {
        'overlay': [],
        'dir': 'rtl',
        'showModalVar': true,
        'hideModalVar': false,
        'hideCompanyName': false,
        'reloadMessagesEvent': new Subject<any>()
    };
    public showModalVar: boolean = true;
    public hideModalVar: boolean = false;
    private singleExecutionSubscription: Subscription;

    visibleChange(event: any) {
        if (event === false) {
            this.showModalVar = false;
            setTimeout(() => {
                this.showModalVar = true;
            }, 3500);
        }
    }


    public reqDataEvent: Subject<any> = new Subject<any>();
    public reloadEvent: Subject<any> = new Subject<any>();

    constructor(@Optional() config: UserServiceConfig, private recaptchaV3Service: ReCaptchaV3Service) {
        if (config) {
            this.appData = config.appData;
        }
    }

    public executeAction(action: string): Promise<any> {
        if (this.singleExecutionSubscription) {
            this.singleExecutionSubscription.unsubscribe();
        }
        return new Promise((resolve, reject) => {
            this.singleExecutionSubscription = this.recaptchaV3Service.execute(action.replace(/-/g, '_'))
                .subscribe({
                        next: (token) => {
                            resolve(token);
                        },
                        error: (err) => {
                            resolve(null);
                        }
                    }
                );
        });
    }

    public minOldestTransDateInSelectedAccounts(): number | null {
        if (
            !this.appData ||
            !this.appData.userData ||
            !this.appData.userData.accountSelect ||
            !this.appData.userData.accountSelect.length
        ) {
            return null;
        }
        return this.appData.userData.accountSelect.reduce((accmltr, acc) => {
            return Number.isFinite(acc.oldestTransDate) &&
            (accmltr === null || acc.oldestTransDate < accmltr)
                ? acc.oldestTransDate
                : accmltr;
        }, null);
    }

    public minStartWorkDateInSelectedAccounts(byChecked?: any): number | null {
        const checkedIds = this.appData.userData.accountSelect.filter((acc) => acc.checked);
        if (
            !this.appData ||
            !this.appData.userData ||
            !this.appData.userData.accountSelect ||
            !this.appData.userData.accountSelect.length
        ) {
            return null;
        }
        if (byChecked && !checkedIds.length) {
            return null;
        }
        return (byChecked ? checkedIds : this.appData.userData.accountSelect).reduce((accmltr, acc) => {
            return Number.isFinite(acc.startWorkDate) &&
            (accmltr === null || acc.startWorkDate < accmltr)
                ? acc.startWorkDate
                : accmltr;
        }, null);
    }

    public minBalanceLastUpdateDateInSelectedAccounts(): number | null {
        if (
            !this.appData ||
            !this.appData.userData ||
            !this.appData.userData.accountSelect ||
            !this.appData.userData.accountSelect.length
        ) {
            return null;
        }

        return Math.min(
            ...this.appData.userData.accountSelect.map(
                (acc: any) => acc.balanceLastUpdatedDate
            )
        );
    }

    public minOldestTransDateInSelectedCreditCards(): number | null {
        return this.selectedCreditCards().reduce((accmltr, cc) => {
            return Number.isFinite(cc.oldestCycleDate) &&
            (accmltr === null || cc.oldestCycleDate < accmltr)
                ? cc.oldestCycleDate
                : accmltr;
        }, null);
    }

    public minStartWorkDateInSelectedCreditCards(cards:any): number | null {
        return cards.reduce((accmltr, cc) => {
            return Number.isFinite(cc.startWorkDate) &&
            (accmltr === null || cc.startWorkDate < accmltr)
                ? cc.startWorkDate
                : accmltr;
        }, null);
    }

    public selectedCreditCards(): any[] {
        if (
            !this.appData &&
            !this.appData.userData &&
            !this.appData.userData.creditCards &&
            !this.appData.userData.creditCards.length
        ) {
            return [];
        }

        const result = [];
        this.appData.userData.creditCards.map((ccAcc) => {
            const selectedInAcc = ccAcc.check
                ? ccAcc.children
                : ccAcc.children.filter((cc) => cc.check === true);
            if (selectedInAcc.length) {
                result.push(...selectedInAcc);
            }
        });
        return result;
    }

    public selectedCreditCardsCount(): number {
        return this.selectedCreditCards().length;
    }

    public selectedSolkim(): any[] {
        if (
            !this.appData ||
            !this.appData.userData ||
            !this.appData.userData.slika ||
            !this.appData.userData.slika.length
        ) {
            return [];
        }

        const result = [];
        this.appData.userData.slika.map((slkAcc) => {
            const selectedInAcc = slkAcc.check
                ? slkAcc.children
                : slkAcc.children.filter((slk) => slk.check === true);
            if (selectedInAcc.length) {
                result.push(...selectedInAcc);
            }
        });

        return result;
    }

    public minOldestTransDateInSelectedSolkim() {
        return this.selectedSolkim().reduce((accmltr, cc) => {
            return Number.isFinite(cc.oldestCycleDate) &&
            (accmltr === null || cc.oldestCycleDate < accmltr)
                ? cc.oldestCycleDate
                : accmltr;
        }, null);

        // return Math.min(...this.selectedSolkim().map(slk => slk.oldestCycleDate));
    }

    public reqDataEventSend() {
        if (this.appData || this.appData.userData) {
            this.reqDataEvent.next(this.appData.numOfXHR);
        }
    }

    ngOnDestroy() {
        if (this.reqDataEvent) {
            this.reqDataEvent.next(true);
            this.reqDataEvent.unsubscribe();
        }
        if (this.reloadEvent) {
            this.reloadEvent.next(true);
            this.reloadEvent.unsubscribe();
        }
        if (this.singleExecutionSubscription) {
            this.singleExecutionSubscription.unsubscribe();
        }
    }

    rebuildSelectedCompanyCreditCards(cardsData: Array<any>): void {
        if (
            !Array.isArray(this.appData.userData.accounts) ||
            !Array.isArray(cardsData)
        ) {
            this.appData.userData.creditCards = null;
            return;
        }
        if (!this.appData.userData.accounts.length || !cardsData.length) {
            this.appData.userData.creditCards = [];
            return;
        }

        const updatedIfLaterThanI = this.appData.moment().startOf('day');
        // const updatedIfLaterThanI = new Date();
        // // updatedIfLaterThanI.setDate(updatedIfLaterThanI.getDate() - 1);
        // updatedIfLaterThanI.setHours(0, 0, 0, 0);
        const accountsSorted = []
            .concat(this.appData.userData.accounts)
            .sort((a, b) => {
                if (Boolean(a.primaryAccount) === Boolean(b.primaryAccount)) {
                    return a.dateCreated - b.dateCreated;
                }
                if (Boolean(a.primaryAccount) && !b.primaryAccount) {
                    return -1;
                }
                return 1;
            });
        this.appData.userData.creditCards = accountsSorted
            .map((acc: any) => {
                if (acc.currency) {
                    const sign = this.appData.userData.currencyList.find(
                        (curr) => curr.code === acc.currency
                    );
                    if (sign) {
                        acc.sign = sign.sign;
                        acc.currencyId = sign.id;
                    } else {
                        acc.sign = '';
                        acc.currencyId = 99;
                    }
                } else {
                    acc.sign = 'ש"ח';
                    acc.currencyId = 1;
                }

                const matchCards = cardsData.filter((card) => {
                    if (card.companyAccountId === acc.companyAccountId) {
                        // card.check = true;
                        if (card.currencyId) {
                            const sign = this.appData.userData.currencyList.find(
                                (curr) => curr.id === card.currencyId
                            );
                            if (sign) {
                                card.sign = sign.sign;
                                card.currencyString = sign ? sign.sign : null;
                                card.currency = sign.code;
                            } else {
                                card.sign = '';
                                card.currencyString = null;
                                card.currency = card.currencyId;
                            }
                        } else {
                            card.sign = 'ש"ח';
                            card.currency = 'ILS';
                        }
                        // a.currency =
                        //     trnsAccA && trnsAccA.currency !== 'ILS'
                        //         ? getCurrencySymbol(trnsAccA.currency, 'narrow')
                        //         : '';
                        // const lastUpdateAt = card.balanceLastUpdatedDate ? new Date(card.balanceLastUpdatedDate) : null;
                        card.balanceOutdatedDays =
                            card.balanceLastUpdatedDate &&
                            updatedIfLaterThanI.isBefore(card.balanceLastUpdatedDate)
                                ? updatedIfLaterThanI.diff(card.balanceLastUpdatedDate, 'days')
                                : null;
                        card.balanceIsUpToDate =
                            card.balanceOutdatedDays != null && card.balanceOutdatedDays <= 0;

                        return card;
                    }
                });
                if (matchCards.length) {
                    // console.log(matchCards)
                    matchCards.sort((a, b) => a.dateCreated - b.dateCreated);
                    return Object.assign(
                        {
                            children: matchCards // ,
                            // check: true
                        },
                        acc
                    );
                }
                return null;
            })
            .filter((accWithCards) => !!accWithCards);
    }
}
