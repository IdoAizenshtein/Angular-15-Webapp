import {Component, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {CustomPreset, NDaysFromNow, NMonthsFromNow, NthMonthFromNow, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-checks-dates',
    templateUrl: './date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class ChecksDateRangeSelectorComponent
    extends DateRangeSelectorBaseComponent {
    private _minDate: Date;

    get minSelectable(): Date | null {
        // if (!this.userService.appData.userData
        //         || !Array.isArray(this.userService.appData.userData.accountSelect)
        //         || !this.userService.appData.userData.accountSelect.length) {
        //     return null;
        // }
        if (!this._minDate) {
            const numDt = this.userService.minOldestTransDateInSelectedAccounts();
            this._minDate = numDt !== null ? new Date(numDt) : null;
        }
        return this._minDate;
    }

    private _maxDate: Date;

    get maxSelectable(): Date | null {
        if (!this._maxDate) {
            const nowPlus3Years = new Date();
            nowPlus3Years.setFullYear(nowPlus3Years.getFullYear() + 3);
            this._maxDate = nowPlus3Years;
        }
        return this._maxDate;
    }

    constructor(
        public override route: ActivatedRoute,
        public override translate: TranslateService,
        protected override storageService: StorageService,
        public userService: UserService
    ) {
        super(
            [
                new CustomPreset('checksOutstanding'),
                new NMonthsFromNow(-0.5),
                new NthMonthFromNow(-1),
                new NDaysFromNow(-60)
            ],
            route,
            storageService,
            userService,
            translate
        );

        const mmntNow = this.userService.appData.moment();
        const mmntPlusMonth = this.userService.appData.moment().add(1, 'months');
        this.customMonthsPreset.from = new RangePoint(
            0,
            mmntNow.month(),
            mmntNow.year()
        );
        this.customMonthsPreset.till = new RangePoint(
            0,
            mmntPlusMonth.month(),
            mmntPlusMonth.year()
        );

        const mmntPlus30d = this.userService.appData.moment().add(30, 'days');
        this.customDatesPreset.from = new RangePoint(
            mmntNow.date(),
            mmntNow.month(),
            mmntNow.year()
        );
        this.customDatesPreset.till = new RangePoint(
            mmntPlus30d.date(),
            mmntPlus30d.month(),
            mmntPlus30d.year()
        );
    }

    override togglePanel() {
        if (!this.showPanelDD) {
            this._minDate = null;
        }
        super.togglePanel();
    }


}
