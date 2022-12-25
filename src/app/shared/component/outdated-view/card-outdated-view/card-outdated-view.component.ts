import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-card-outdated-view',
    templateUrl: './card-outdated-view.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CardOutdatedViewComponent {
    @Input() card: {
        companyAccountId: string;
        token: string;
        balanceLastUpdatedDate: number;
        alertStatus: string;
    };

    constructor(public translate: TranslateService) {
    }
}
