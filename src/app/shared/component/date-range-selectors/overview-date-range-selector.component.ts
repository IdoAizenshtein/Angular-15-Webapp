import {Component, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {NthMonthFromNow, NthYearFromNow, OverviewLatest, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-overview-dates',
    templateUrl: './date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class OverviewDateRangeSelectorComponent
    extends DateRangeSelectorBaseComponent {
    private _minDate: Date;

    get minSelectable(): Date | null {
        if (!this._minDate) {
            const numDt = this.userService.minOldestTransDateInSelectedAccounts();
            this._minDate = numDt !== null ? new Date(numDt) : null;
        }
        return this._minDate;
    }

    private _maxDate: Date;

    get maxSelectable(): Date | null {
        if (!this._maxDate) {
            this._maxDate = new Date();
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
                new OverviewLatest(),
                new NthMonthFromNow(-1),
                new NthYearFromNow(-1),
                new NthYearFromNow(-2)
            ],
            route,
            storageService,
            userService,
            translate
        );

        this.customMonthsPreset.from = new RangePoint(
            this.presets[0].from.day,
            this.presets[0].from.month,
            this.presets[0].from.year
        );
        this.customMonthsPreset.till = new RangePoint(
            this.presets[0].till.day,
            this.presets[0].till.month,
            this.presets[0].till.year
        );

        this.customDatesPreset = null;
    }

    override togglePanel() {
        if (!this.showPanelDD) {
            this._minDate = null;
        }
        super.togglePanel();
    }


}
