import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {slideInOut} from '../../animations/slideInOut';
import {ActivatedRoute} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {CustomPreset, Preset, RangePoint} from './presets';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '../../../core/user.service';
import {RangeSelectionType} from '../range-calendar/range-calendar.component';

@Component({
    selector: 'app-archives-dates-filter',
    templateUrl: './archives-date-range-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class ArchivesDateRangeSelectorComponent {
    showPanelDD = false;
    RangeSelectionType = RangeSelectionType;
    @Output() selectedRange: EventEmitter<any> = new EventEmitter();
    private _minDate: Date;
    private _selectedPreset: Preset;
    get selectedPreset() {
        return this._selectedPreset;
    }

    set selectedPreset(val: Preset) {
        if (this._selectedPreset !== val || val === this.customDatesPreset) {
            this._selectedPreset = val;
            // console.log('selectedPreset---', val);
            this.selectedRange.emit(
                this._selectedPreset
                    ? this._selectedPreset.selectedPeriod(this.userService)
                    : null
            );
        }
    }

    set selectedPresetFromArchiveSearch(val: Preset) {
        this._selectedPreset = val;
    }

    get minSelectable(): Date | null {
        if (!this._minDate) {
            this._minDate = this.userService.appData
                .moment()
                .subtract(3, 'years')
                .toDate();
        }
        return this._minDate;
    }

    @Input() title: string;

    private _maxDate: Date;

    get maxSelectable(): Date | null {
        if (!this._maxDate) {
            this._maxDate = this.userService.appData
                .moment()
                .add(3, 'years')
                .toDate();
        }
        return this._maxDate;
    }

    customDatesPreset: CustomPreset;

    constructor(
        public route: ActivatedRoute,
        public translate: TranslateService,
        protected storageService: StorageService,
        public userService: UserService
    ) {
        this.customDatesPreset = new CustomPreset('customDates');
        const mmntNow = this.userService.appData.moment();
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
        console.log('constructor customDatesPreset---', this.customDatesPreset);
    }

    setDates(): void {
        this.selectedPreset = this.customDatesPreset;
    }

    togglePanel() {
        if (!this.showPanelDD) {
            this._minDate = null;
        }
        this.showPanelDD = !this.showPanelDD;
    }


}
