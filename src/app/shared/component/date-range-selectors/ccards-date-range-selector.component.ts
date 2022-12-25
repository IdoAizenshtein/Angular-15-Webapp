import {Component, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {CCardClosestFuture, CCardClosestPast, CCardFuture, NMonthsFromNow, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-ccard-dates',
    templateUrl: './date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class CcardsDateRangeSelectorComponent
    extends DateRangeSelectorBaseComponent {
    private _minDate: Date;

    get minSelectable(): Date | null {
        // if (!this.userService.appData.userData
        //         || !Array.isArray(this.userService.appData.userData.accountSelect)
        //         || !this.userService.appData.userData.accountSelect.length) {
        //     return null;
        // }
        if (!this._minDate) {
            const numDt = this.userService.minOldestTransDateInSelectedCreditCards();
            this._minDate = numDt !== null ? new Date(numDt) : null;
        }
        return this._minDate;
    }

    private _maxDate: Date;

    get maxSelectable(): Date | null {
        if (!this._maxDate) {
            // const dt = new Date();
            // dt.setMonth(dt.getMonth() + 2);
            // this._maxDate = dt;
            this._maxDate = this.userService.appData
                .moment()
                .add(3, 'years')
                .toDate();
        }
        return this._maxDate;
    }

    get selectedFilterType():
        | 'currentDebit'
        | 'lastDebit'
        | 'futureDebit'
        | null {
        if (this.selectedPreset instanceof CCardFuture) {
            return 'futureDebit';
        }
        if (this.selectedPreset instanceof CCardClosestFuture) {
            return 'currentDebit';
        }
        if (this.selectedPreset instanceof CCardClosestPast) {
            return 'lastDebit';
        }
        return null;
    }

    constructor(
        public override route: ActivatedRoute,
        public override translate: TranslateService,
        protected override storageService: StorageService,
        public userService: UserService
    ) {
        super(
            [
                new CCardFuture(),
                new CCardClosestFuture(),
                new CCardClosestPast(),
                new NMonthsFromNow(-3)
            ],
            route,
            storageService,
            userService,
            translate
        );

        this.presets[this.presets.length - 1].default =
            this.storageKey.includes('/graph-');

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
