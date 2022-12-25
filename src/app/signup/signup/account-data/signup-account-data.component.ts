import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import {tap} from 'rxjs/operators';
import {ActivatedRoute, Router} from '@angular/router';
import {SignupComponent} from '@app/signup/signup/signup.component';
import {
    BankCredentialsComponent
} from '@app/shared/component/foreign-credentials/bank-credentials/bank-credentials.component';
import {TokenService} from '@app/core/token.service';
import {BankForeignCredentialsService} from '@app/shared/component/foreign-credentials/foreign-credentials.service';
import {SignupService} from '@app/signup/signup.service';
import {AnalyticsService} from '@app/core/analytics.service';

@Component({
    templateUrl: './signup-account-data.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SignupAccountDataComponent {
    @ViewChild(BankCredentialsComponent)
    bankCredentialsComp: BankCredentialsComponent;

    readonly account: any;
    banksCredentialSettings: any[] = null;

    constructor(
        private tokenService: TokenService,
        private bankForeignCreds: BankForeignCredentialsService,
        private route: ActivatedRoute,
        private router: Router,
        public parent: SignupComponent,
        private signupService: SignupService,
        private analyticsService: AnalyticsService
    ) {
        this.account = parent.createForm(2);
        this.bankForeignCreds.banksSettingsAtSignup().subscribe((rslt) => {
            this.banksCredentialSettings = rslt;
        });
    }


    onSubmit() {
        const bankCredsResult = this.bankCredentialsComp.getResults();
        if (bankCredsResult === null) {
            this.analyticsService.notifyOnSignupSuccess();
            this.parent.reloadSelf();
            return;
        }

        this.parent.formInProgress$.next(true);

        const createOrUpdateTokenObs = !this.parent.tokenId
            ? this.tokenService.tokenCreate(
                Object.assign(
                    {
                        companyId: this.parent.createdCompanyId
                    },
                    bankCredsResult
                )
            )
            : this.tokenService.tokenUpdate(
                Object.assign(
                    {
                        companyId: this.parent.createdCompanyId,
                        tokenId: this.parent.tokenId
                    },
                    bankCredsResult
                )
            );

        createOrUpdateTokenObs
            .pipe(tap(() => this.parent.formInProgress$.next(false)))
            .subscribe(
                {
                    next: (resp) => {
                        this.parent.tokenId = this.parent.tokenId || resp.body || null;
                        if (this.parent.tokenId) {
                            this.parent.startTokenStatusPolling();
                        }
                        this.signupService.lastFinishedStepIdx = this.parent.currentStepIdx;
                        this.router.navigate(['../token-track'], {
                            relativeTo: this.route,
                            queryParamsHandling: 'preserve'
                        });
                    },
                    error: (error) => {
                        console.error(
                            'Default company fetch for created user failed.',
                            error
                        );
                        this.parent.tokenId = null;
                    }
                }
            );
    }
}
