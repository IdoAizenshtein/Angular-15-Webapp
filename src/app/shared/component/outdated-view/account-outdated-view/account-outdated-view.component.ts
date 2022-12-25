import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-account-outdated-view',
    templateUrl: './account-outdated-view.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class AccountOutdatedViewComponent {
    @Input() account: {
        companyId: string;
        token: string;
        balanceLastUpdatedDate: number;
        alertStatus: string;
    };

    constructor(public translate: TranslateService) {
    }
}
