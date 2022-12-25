import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-solek-outdated-view',
    templateUrl: './solek-outdated-view.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SolekOutdatedViewComponent {
    @Input() solek: {
        companyAccountId: string;
        token: string;
        ballanceLastUpdatedDate: number;
        alertStatus: string;
    };

    constructor(public translate: TranslateService) {
    }
}
