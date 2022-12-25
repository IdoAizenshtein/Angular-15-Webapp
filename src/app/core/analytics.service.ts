import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Injectable()
export class AnalyticsService {
    readonly gtmUserId = 'GTM-5RBQ7QX'; // 'GTM-T572P7R';

    constructor(private translate: TranslateService) {
        (<any>window).dataLayer = (<any>window).dataLayer || [];
    }

    notifyOnSignupSuccess(tokenBankId?: number) {
        (<any>window).dataLayer.push(
            Object.assign(
                {
                    event: 'Full Signup – Success',
                    UserID: this.gtmUserId
                },
                tokenBankId > 0
                    ? {
                        'Bank Name': this.translate.instant('banks.' + tokenBankId),
                        'Bank Details': 'True'
                    }
                    : {
                        'Bank Name': 'NONE',
                        'Bank Details': 'False'
                    }
            )
        );
    }
}
