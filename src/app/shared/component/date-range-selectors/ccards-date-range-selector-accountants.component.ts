import {Component, Input, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {NFromStartWorkDate, NMonthsFromNow, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-ccard-dates-accountants',
    templateUrl: './date-range-selector-accountants.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class CcardsDateRangeSelectorAccountantsComponent
    extends DateRangeSelectorBaseComponent {
    private _minDate: Date;

    @Input() cardsSelected:any = [];
    @Input()
    set isCardsSelected(isCardsSelected: any) {
        if (isCardsSelected) {
            this.disabledDD = false;
            const numDt = this.userService.minStartWorkDateInSelectedCreditCards(this.cardsSelected);
            const minDate = numDt !== null ? new Date(numDt) : null;
            if (this.presets[0].name === 'all') {
                this.presets[0] = new NFromStartWorkDate(minDate);
            } else {
                this.presets.unshift(new NFromStartWorkDate(minDate));
            }
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
            super.ngOnInit(true);
        } else {
            this.disabledDD = true;
        }
    }

    get minSelectable(): Date | null {
        // if (!this.userService.appData.userData
        //         || !Array.isArray(this.userService.appData.userData.accountSelect)
        //         || !this.userService.appData.userData.accountSelect.length) {
        //     return null;
        // }
        if (!this._minDate) {
            const numDt = this.userService.minStartWorkDateInSelectedCreditCards(this.cardsSelected);
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

    constructor(
        public override route: ActivatedRoute,
        public override translate: TranslateService,
        protected override storageService: StorageService,
        public userService: UserService
    ) {
        super(
            [new NMonthsFromNow(-3), new NMonthsFromNow(-6), new NMonthsFromNow(-2)],
            route,
            storageService,
            userService,
            translate
        );

        // this.presets[0].default = this.storageKey.includes('/bankAndCredit-');

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
