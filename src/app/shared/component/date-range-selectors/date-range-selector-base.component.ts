import {CustomPreset, Preset, RangePoint} from './presets';
import {ActivatedRoute, UrlSegment} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';
import {Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {fromEvent, ReplaySubject} from 'rxjs';
import {RangeSelectionType} from '../range-calendar/range-calendar.component';
import {UserService} from '@app/core/user.service';
import {take, takeUntil} from 'rxjs/operators';
import {Subject} from 'rxjs/internal/Subject';
import {TranslateService} from '@ngx-translate/core';

@Directive()
export class DateRangeSelectorBaseComponent implements OnInit, OnDestroy {
    RangeSelectionType = RangeSelectionType;
    readonly storageKey: string;

    private _selectedPreset: Preset;
    get selectedPreset() {
        return this._selectedPreset;
    }

    set selectedPreset(val: Preset) {
        if (
            this._selectedPreset !== val ||
            val === this.customMonthsPreset ||
            val === this.customDatesPreset
        ) {
            this._selectedPreset = val;

            this.selectedRange.next(
                this._selectedPreset
                    ? this._selectedPreset.selectedPeriod(this.us)
                    : null
            );
            this.storageService.sessionStorageSetter(
                this.storageKey,
                JSON.stringify(this._selectedPreset)
            );
        }
    }

    readonly selectedRange: ReplaySubject<{
        fromDate: Date | null;
        toDate: Date | null;
    }> = new ReplaySubject(1);

    showPanelDD = false;
    disabledDD:boolean = false;

    customMonthsPreset: CustomPreset;
    customDatesPreset: CustomPreset;
    selectedInDDPreset: Preset;

    @ViewChild('selector', {read: ElementRef}) selectorRef: ElementRef;
    @Output() sendEvent: EventEmitter<any> = new EventEmitter();

    pristine = true;
    private readonly destroyed$ = new Subject<void>();

    static storageKey(route: ActivatedRoute, replaceLastWith?: string): string {
        const pathToRoot = route.pathFromRoot
            .filter((actRoute) => actRoute.snapshot.url.length)
            .reduce((path, actRoute) => path.concat(actRoute.snapshot.url), [])
            .map((urlseg: UrlSegment) => urlseg.path);

        if (replaceLastWith) {
            pathToRoot.splice(-1, 1, replaceLastWith);
        }

        if (
            ['in-checks', 'out-checks'].includes(pathToRoot[pathToRoot.length - 1])
        ) {
            pathToRoot[pathToRoot.length - 1] = '*-checks';
        } else if (
            pathToRoot.length > 3 &&
            pathToRoot[pathToRoot.length - 3] === 'financialManagement'
        ) {
            // && (pathToRoot[pathToRoot.length - 2] === 'bankAccount' || pathToRoot[pathToRoot.length - 2] === 'creditsCard')) {
            pathToRoot[pathToRoot.length - 1] = '*';
        } else if (
            pathToRoot.length > 3 &&
            pathToRoot[pathToRoot.length - 3] === 'cash-flow' &&
            pathToRoot[pathToRoot.length - 2] === 'daily'
        ) {
            pathToRoot[pathToRoot.length - 1] = '*';
        }

        console.log('---------', pathToRoot.slice(-2).join('/') + '-filterDates');
        return pathToRoot.slice(-2).join('/') + '-filterDates';
    }

    constructor(
        public readonly presets: Preset[],
        public route: ActivatedRoute,
        protected storageService: StorageService,
        protected us: UserService,
        protected translate: TranslateService
    ) {
        this.storageKey = DateRangeSelectorBaseComponent.storageKey(this.route);

        if (this.storageKey.includes('bankAndCredit-filterDates')) {
            const bankAndCreditScreenTab =
                this.storageService.sessionStorageGetterItem('bankAndCreditScreenTab');
            if (bankAndCreditScreenTab) {
                this.storageKey += '-' + bankAndCreditScreenTab;
            }
        }

        this.customMonthsPreset = new CustomPreset('customMonths');
        this.customDatesPreset = new CustomPreset('customDates');
    }

    ngOnInit(setDef?:boolean): void {
        const storedVal = this.readFromStorage();
        let storedPresetDetected: Preset;
        if (
            !setDef &&
            storedVal &&
            storedVal.name &&
            (storedPresetDetected = [
                ...this.presets,
                this.customMonthsPreset,
                this.customDatesPreset
            ].find((prst) => prst && prst.name === storedVal.name))
        ) {
            if (
                storedPresetDetected === this.customDatesPreset ||
                storedPresetDetected === this.customMonthsPreset
            ) {
                storedPresetDetected.from = new RangePoint(
                    storedPresetDetected === this.customDatesPreset
                        ? storedVal.from.day
                        : 0,
                    storedVal.from.month,
                    storedVal.from.year
                );
                storedPresetDetected.till = new RangePoint(
                    storedPresetDetected === this.customDatesPreset
                        ? storedVal.till.day
                        : 0,
                    storedVal.till.month,
                    storedVal.till.year
                );
            }
            this.selectedPreset = storedPresetDetected;
            this.pristine = false;
        } else {
            this.selectedPreset =
                this.presets.find((prst) => prst.default) || this.presets[0];
            this.pristine = false;

            if(this.selectorRef){
                fromEvent(this.selectorRef.nativeElement, 'click')
                    .pipe(take(1), takeUntil(this.destroyed$))
                    .subscribe(() => (this.pristine = false));
            }
        }
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    private readFromStorage(): Preset | null {
        try {
            return <Preset>(
                JSON.parse(
                    this.storageService.sessionStorageGetterItem(this.storageKey)
                )
            );
        } catch (e) {
            console.error(
                'Failed to read/convert value for %o from session storage:',
                this.storageKey,
                e
            );
        }
        return null;
    }

    togglePanel() {
        if (!this.showPanelDD) {
            this.selectedInDDPreset = this.selectedPreset;
        }

        this.showPanelDD = !this.showPanelDD;
    }

    public asText(): string {
        if (this._selectedPreset) {
            try {
                if (this._selectedPreset.name.includes('custom')) {
                    if (this._selectedPreset === this.customMonthsPreset) {
                        const monthNamesShort = this.translate.instant(
                            'langCalendar.monthNamesShort'
                        ) as string[];
                        return [
                            monthNamesShort[this._selectedPreset.from.month],
                            String(this._selectedPreset.from.year),
                            ' - ',
                            monthNamesShort[this._selectedPreset.till.month],
                            String(this._selectedPreset.till.year)
                        ].join('');
                    } else {
                        return [
                            this.us.appData
                                .moment(this._selectedPreset.from.toDate())
                                .format('DD/MM/YY'),
                            ' - ',
                            this.us.appData
                                .moment(this._selectedPreset.till.toDate())
                                .format('DD/MM/YY')
                        ].join('');
                    }
                } else {
                    return this._selectedPreset.useRawName
                        ? this._selectedPreset.name
                        : this.translate.instant(
                            'dateRangePresets.' + this._selectedPreset.name
                        );
                }
            } catch (e) {
                return '';
            }
        }
        return '';
    }

    public selectPresetWith(name: string) {
        const presetFound = this.presets.find((prst) => prst && prst.name === name);
        if (presetFound) {
            this.selectedPreset = presetFound;
        }
    }
}
