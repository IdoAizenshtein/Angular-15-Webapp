import {Component, Input, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {NDaysFromNow, NFromStartWorkDate, NMonthsFromNow, NthMonthFromNow, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-account-dates',
    templateUrl: './date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class AccountsDateRangeSelectorComponent
    extends DateRangeSelectorBaseComponent {
    private _minDate: Date;
    @Input() byChecked: any = false;

    @Input()
    set isAccSelected(isAccSelected: any) {
        if (isAccSelected) {
            this.disabledDD = false;
            const numDt = this.userService.minStartWorkDateInSelectedAccounts(this.byChecked);
            const minDate = numDt !== null ? new Date(numDt) : null;
            if (this.presets[0].name === 'all') {
                this.presets[0] = new NFromStartWorkDate(minDate);
            } else {
                this.presets.unshift(new NFromStartWorkDate(minDate));
            }
            this.customMonthsPreset.from = new RangePoint(
                0, // this.presets[0].from.day,
                this.presets[0].from.month,
                this.presets[0].from.year
            );
            this.customMonthsPreset.till = new RangePoint(
                0, // this.presets[0].till.day,
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
            const numDt = this.byChecked ? this.userService.minStartWorkDateInSelectedAccounts(true) : this.userService.minOldestTransDateInSelectedAccounts();
            this._minDate = numDt !== null ? new Date(numDt) : null;
            console.log('-------minSelectable-------: ', this._minDate);
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
                new NDaysFromNow(-30),
                new NDaysFromNow(-60),
                new NMonthsFromNow(-0.5),
                new NthMonthFromNow(-1)
            ],
            route,
            storageService,
            userService,
            translate
        );

        this.customMonthsPreset.from = new RangePoint(
            0, // this.presets[0].from.day,
            this.presets[0].from.month,
            this.presets[0].from.year
        );
        this.customMonthsPreset.till = new RangePoint(
            0, // this.presets[0].till.day,
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


}
