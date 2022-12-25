import {Component, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {ClrAgencyFuture, NMonthsFromNow, NthMonthFromNow, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-clragencies-dates',
    templateUrl: './date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class ClearingAgenciesDateRangeSelectorComponent
    extends DateRangeSelectorBaseComponent {
    private _minDate: Date;

    get minSelectable(): Date | null {
        if (!this._minDate) {
            // debugger;
            const numDt = this.userService.minOldestTransDateInSelectedSolkim();
            this._minDate =
                numDt !== null
                    ? new Date(numDt)
                    : this.userService.appData.moment().subtract(6, 'months').toDate();
            // : null;
        }
        return this._minDate;
    }

    private _maxDate: Date;

    get maxSelectable(): Date | null {
        if (!this._maxDate) {
            const dt = new Date();
            dt.setMonth(dt.getMonth() + 2);
            this._maxDate = dt;
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
                new ClrAgencyFuture(),
                new NthMonthFromNow(0, 'clrAgencyCurrentMonth'), // new ClrAgencyClosestFuture(),
                new NthMonthFromNow(-1), // new ClrAgencyClosestPast(),
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
