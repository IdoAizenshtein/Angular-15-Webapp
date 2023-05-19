import {Component, OnDestroy, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Observable, of, Subscription} from 'rxjs';
import {catchError, filter, map} from 'rxjs/operators';
import {SharedService} from '@app/shared/services/shared.service'; //import {sharedService} from '@app/customers.service';
import {OverlayPanel} from 'primeng/overlaypanel';
import {PRE_HANDLED_ACCOUNT_ID} from '../customers-billing.component';
import {UserService} from '@app/core/user.service';
import {publishRef} from '@app/shared/functions/publishRef';

@Component({
    templateUrl: './billing-accounts-list.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class BillingAccountsListComponent implements OnDestroy {
    readonly billingAccounts$: Observable<BillingAccount[]>;
    private readonly childParamSubscription: Subscription;

    toggledCompaniesList: {
        companyId: string;
        companyName: string;
    }[];

    preHandledAccountId = PRE_HANDLED_ACCOUNT_ID;

    constructor(
        private sharedService: SharedService,
        private route: ActivatedRoute,
        public userService: UserService,
        private router: Router
    ) {
        this.billingAccounts$ = this.sharedService.getBillingAccounts().pipe(
            catchError(() => of([])),
            map((response: any) => {
                const result =
                    response && !response.error
                        ? (response.body as Array<BillingAccount>)
                        : [];
                // const resultStub = [
                //     {
                //         billingAccountId: 'dummy-bil-account-id-1',
                //         companies: [
                //             {
                //                 companyId: 'dummy-company-id-1.1',
                //                 companyName: 'dummy-company-1.1'
                //             },
                //             {
                //                 companyId: 'dummy-company-id-1.2',
                //                 companyName: 'dummy-company-1.2'
                //             }
                //         ],
                //         numberOfCompanies: 2,
                //         paymentName: 'כרטיס אשראי דמא 1'
                //     },
                //     {
                //         billingAccountId: 'dummy-bil-account-id-2',
                //         companies: [
                //             {
                //                 companyId: 'dummy-company-id-2.1',
                //                 companyName: 'dummy-company-2.1'
                //             }
                //         ],
                //         numberOfCompanies: 1,
                //         paymentName: 'כרטיס אשראי דמא 2'
                //     },
                //     {
                //         billingAccountId: 'dummy-bil-account-id-3',
                //         companies: [
                //             {
                //                 companyId: 'dummy-company-id-3.1',
                //                 companyName: 'dummy-company-3.1'
                //             },
                //             {
                //                 companyId: 'dummy-company-id-3.2',
                //                 companyName: 'dummy-company-3.2'
                //             },
                //             {
                //                 companyId: 'dummy-company-id-3.3',
                //                 companyName: 'dummy-company-3.3'
                //             }
                //         ],
                //         numberOfCompanies: 3,
                //         paymentName: 'כרטיס אשראי דמא 3'
                //     },
                //     {
                //         billingAccountId: 'dummy-bil-account-id-4',
                //         companies: [],
                //         numberOfCompanies: 0,
                //         paymentName: 'כרטיס אשראי דמא 4'
                //     }
                // ];
                return result; // [...result, ...resultStub];
            }),
            publishRef
        );

        this.childParamSubscription =
            this.billingAccounts$.pipe(
                filter((billAccounts) => billAccounts && billAccounts.length > 0),
                filter((event: any) => {
                    return !this.route.firstChild;
                })
            )
                .subscribe((billAccounts) => {
                    this.router.navigate([billAccounts[0].billingAccountId], {
                        relativeTo: this.route,
                        queryParamsHandling: 'preserve'
                    });
                    // this.router.navigate(
                    //     [
                    //         billAccounts && billAccounts.length
                    //             ? billAccounts[0].billingAccountId
                    //             :
                    //             'add'
                    //     ],
                    //     {
                    //         relativeTo: this.route,
                    //         queryParamsHandling: 'preserve'
                    //     }
                    // );
                });
    }


    ngOnDestroy(): void {
        this.childParamSubscription.unsubscribe();
    }

    toggleCompaniesListFrom(
        event,
        companies: {
            companyId: string;
            companyName: string;
        }[],
        op: OverlayPanel
    ) {
        this.toggledCompaniesList = companies.slice(1);
        op.toggle(event);
        event.stopPropagation();
    }
}

export class BillingAccount {
    billingAccountId: string;
    companies: {
        companyId: string;
        companyName: string;
    }[];
    numberOfCompanies: number;
    paymentTypeId: number;
    extspCardnumber5: string;
    extspMutag24: string;
}
