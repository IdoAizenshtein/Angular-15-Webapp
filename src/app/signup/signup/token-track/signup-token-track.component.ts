import {Component, ViewChild, ViewEncapsulation} from '@angular/core';
import {SignupComponent} from '@app/signup/signup/signup.component';
import {
    BankCredentialsComponent
} from '@app/shared/component/foreign-credentials/bank-credentials/bank-credentials.component';
import {AnalyticsService} from '@app/core/analytics.service';

@Component({
    templateUrl: './signup-token-track.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SignupTokenTrackComponent {
    @ViewChild(BankCredentialsComponent) bankCredentialsComp: BankCredentialsComponent;

    readonly tokenTrack: any;

    constructor(
        public parent: SignupComponent,
        private analyticsService: AnalyticsService
    ) {
        this.tokenTrack = parent.createForm(3);
    }


    onSubmit(isFAILURE:any) {
        this.analyticsService.notifyOnSignupSuccess(
            this.parent.account.get('bank').value.value
        );
        if (!isFAILURE) {
            this.parent.reloadSelf();
        } else {
            this.parent.onSkipToDemoCompanyMove();
        }
    }
}
