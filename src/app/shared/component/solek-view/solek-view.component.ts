import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-solek-view',
    template: `
    <div
      class="solek-info"
      *ngIf="solekNumber; else unknown"
      pTooltip="{{ showTooltip ? solekName : null }}"
    >
      <img
        style="height: auto; width: auto; position: relative;" fill [ngSrc]="'/assets/images/solek' + solekNumber + '.png'"
        alt="{{ solekNumber }}"
      />
      <span class="text-ellipsis" *ngIf="showName">{{ solekName }}</span>
    </div>
    <ng-template #unknown>&nbsp;</ng-template>
  `,
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SolekViewComponent {
    @Input() showName = false;
    @Input() showTooltip = false;

    public solekName: string;

    private _solekNumber: string;
    get solekNumber(): string {
        return this._solekNumber;
    }

    @Input()
    set solekNumber(solekNumber: string) {
        this._solekNumber = solekNumber;
        this.solekName = this._solekNumber
            ? this.translate.translations[this.translate.currentLang]
                .clearingAgencies[solekNumber]
            : '';
    }

    constructor(public translate: TranslateService) {
    }
}
