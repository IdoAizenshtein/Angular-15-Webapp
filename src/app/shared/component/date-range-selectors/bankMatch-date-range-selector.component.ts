import {Component, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {DateRangeSelectorBaseComponent} from './date-range-selector-base.component';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {NDaysFromNow, NMonthsFromNow, NthMonthFromNow, NthWeekFromNow, NWeeksFromNow, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';

@Component({
    selector: 'app-bankmatch-dates',
    templateUrl: './date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class BankMatchDateRangeSelectorComponent
    extends DateRangeSelectorBaseComponent {
    private _minDate: Date;

    get minSelectable(): Date | null {
        if (!this._minDate) {
            // debugger;
            let companyAcc;
            const numDt =
                this.userService.appData.userData.bankMatchAccountAcc &&
                this.userService.appData.userData.accounts &&
                (companyAcc = this.userService.appData.userData.accounts.find(
                    (acc:any) =>
                        acc.companyAccountId ===
                        this.userService.appData.userData.bankMatchAccountAcc
                            .companyAccountId
                )) &&
                Number.isFinite(companyAcc.oldestTransDate)
                    ? companyAcc.oldestTransDate
                    : null;
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
                new NWeeksFromNow(0),
                new NthWeekFromNow(-1),
                new NMonthsFromNow(-0.5),
                new NthMonthFromNow(-1)
            ],
            route,
            storageService,
            userService,
            translate
        );

        const tmpPreset = new NDaysFromNow(-30);
        const nowDt = new Date(
            tmpPreset.till.year,
            tmpPreset.till.month,
            tmpPreset.till.day
        );
        nowDt.setMonth(nowDt.getMonth() - 1);

        this.customMonthsPreset.from = new RangePoint(
            0, // this.presets[0].from.day,
            nowDt.getMonth(),
            nowDt.getFullYear()
        );
        this.customMonthsPreset.till = new RangePoint(
            0, // this.presets[0].till.day,
            tmpPreset.till.month,
            tmpPreset.till.year
        );

        this.customDatesPreset.from = new RangePoint(
            tmpPreset.from.day,
            tmpPreset.from.month,
            tmpPreset.from.year
        );
        this.customDatesPreset.till = new RangePoint(
            tmpPreset.till.day,
            tmpPreset.till.month,
            tmpPreset.till.year
        );
    }

    override togglePanel() {
        if (!this.showPanelDD) {
            this._minDate = null;
        }
        super.togglePanel();
    }


}
