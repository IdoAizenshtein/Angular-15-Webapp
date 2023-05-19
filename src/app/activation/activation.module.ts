import {NgModule} from '@angular/core';
import {SharedModule} from '@app/shared/shared.module';

import {ActivationRoutingModule} from './activation-routing.module';
import {ActivationComponent} from './activation.component';
import {BrowserService} from '@app/shared/services/browser.service';
import {ActivationService} from './activation.service';
import {ActivationWoutSignupComponent} from './activation-wout-signup.component';
import {AgreementPageComponent} from './agreement-page.component';
import {AccountantAgreementPageComponent} from '@app/activation/accountant-agreement-page.component';

@NgModule({
    imports: [SharedModule, ActivationRoutingModule],
    declarations: [
        ActivationComponent,
        ActivationWoutSignupComponent,
        AgreementPageComponent,
        AccountantAgreementPageComponent
    ],
    providers: [BrowserService, ActivationService]
})
export class ActivationModule {
}
