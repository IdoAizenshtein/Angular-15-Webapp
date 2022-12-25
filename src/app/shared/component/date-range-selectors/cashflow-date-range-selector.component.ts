import {Component, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {NDaysFromNow, NMonthsFromNow, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-cashflow-dates',
    templateUrl: './date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class CashflowDateRangeSelectorComponent
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
                new NDaysFromNow(30),
                new NDaysFromNow(60),
                new NMonthsFromNow(0.5, 'tillCurrentMonthEnd'),
                new NMonthsFromNow(1.5, 'tillNextMonthEnd')
            ],
            route,
            storageService,
            userService,
            translate
        );

        this.customMonthsPreset.from = new RangePoint(
            0,
            this.presets[0].from.month,
            this.presets[0].from.year
        );
        this.customMonthsPreset.till = new RangePoint(
            0,
            this.presets[0].till.month,
            this.presets[0].till.year
        );

        this.customDatesPreset.from = new RangePoint(
            this.presets[0].from.day,
            this.presets[0].from.month,
            this.presets[0].from.year
        );
        this.customDatesPreset.till = new RangePoint(
            this.presets[0].till.day,
            this.presets[0].till.month,
            this.presets[0].till.year
        );
    }

    override togglePanel() {
        if (!this.showPanelDD) {
            this._minDate = null;
        }
        super.togglePanel();
    }


    recalculateSelectedRangeIfNecessary(): {
        fromDate: Date | null;
        toDate: Date | null;
    } {
        if (
            !(this.selectedPreset instanceof NDaysFromNow) ||
            !Array.isArray(this.userService.appData.userData.accountSelect) ||
            !this.userService.appData.userData.accountSelect.length
        ) {
            return this.selectedPreset.selectedPeriod(this.userService);
        }

        const daysPreset = this.selectedPreset as NDaysFromNow;
        const mDate1 = this.userService.appData.moment(
            Math.max(
                ...this.userService.appData.userData.accountSelect.map(
                    (account) => account.balanceLastUpdatedDate
                )
            )
        );
        const mDate2 = this.userService.appData
            .moment(mDate1)
            .add(daysPreset.daysDelta, 'days');
        return mDate1.isSameOrBefore(mDate2)
            ? {
                fromDate: mDate1.startOf('day').toDate(),
                toDate: mDate2.endOf('day').toDate()
            }
            : {
                fromDate: mDate2.startOf('day').toDate(),
                toDate: mDate1.endOf('day').toDate()
            };
    }

    apply(date: Date, tillSameDateAsFrom?: boolean) {
        const from = this.userService.appData.moment(date);
        const till = !tillSameDateAsFrom
            ? this.userService.appData.moment(from).add(1, 'months')
            : from;
        [
            this.customDatesPreset.from.year,
            this.customDatesPreset.from.month,
            this.customDatesPreset.from.day
        ] = from.toArray();
        [
            this.customDatesPreset.till.year,
            this.customDatesPreset.till.month,
            this.customDatesPreset.till.day
        ] = till.toArray();

        if (this.selectedPreset !== this.customDatesPreset) {
            this.selectedPreset = this.customDatesPreset;
        }
    }
}
