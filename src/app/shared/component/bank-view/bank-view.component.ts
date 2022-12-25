import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-bank-view',
    template: `
    <div
      class="bank-info"
      *ngIf="bankNumber; else unknown"
      pTooltip="{{ showTooltip ? bankName : null }}"
    >
      <img style="height: auto; width: auto; position: relative;" fill [ngSrc]="bankNumber | toIconSrc: 'bank'" alt="{{ bankNumber }}" />
      <span class="text-ellipsis" *ngIf="showName">{{ bankName }}</span>
    </div>
    <ng-template #unknown>&nbsp;</ng-template>
  `,
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class BankViewComponent {
    @Input() showName = false;
    @Input() showTooltip = false;

    public bankName: string;

    private _bankNumber: string;
    get bankNumber(): string {
        return this._bankNumber;
    }

    @Input()
    set bankNumber(bankNumber: string) {
        this._bankNumber = bankNumber;
        this.bankName = this._bankNumber
            ? this.translate.translations[this.translate.currentLang].banks[
                bankNumber
                ]
            : '';
    }

    constructor(public translate: TranslateService) {
    }
}
