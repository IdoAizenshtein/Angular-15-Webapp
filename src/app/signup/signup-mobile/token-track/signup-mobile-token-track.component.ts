import {
  Component,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { BankCredentialsComponent } from '@app/shared/component/foreign-credentials/bank-credentials/bank-credentials.component';
import { SignupMobileComponent } from '../signup-mobile.component';
import { AnalyticsService } from '@app/core/analytics.service';

@Component({
  templateUrl: './signup-mobile-token-track.component.html',
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false
})
export class SignupMobileTokenTrackComponent  {
  @ViewChild(BankCredentialsComponent)
  bankCredentialsComp: BankCredentialsComponent;

  readonly tokenTrack: any;

  constructor(
    public parent: SignupMobileComponent,
    private analyticsService: AnalyticsService
  ) {
    this.tokenTrack = parent.createForm(3);
  }





  onSubmit(isFAILURE) {
    this.analyticsService.notifyOnSignupSuccess(
      this.parent.account.get('bank').value.value
    );
    if (!isFAILURE) {
      this.parent.navigateToApplication('end');
    } else {
      this.parent.onSkipToDemoCompanyMove();
    }
  }
}
