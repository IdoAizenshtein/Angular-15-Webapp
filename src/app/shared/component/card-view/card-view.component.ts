import {Component, Input, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

@Component({
    selector: 'app-card-view',
    template: `
    <div
      class="card-info"
      *ngIf="cardNumber; else unknown"
      pTooltip="{{ showTooltip ? cardName : null }}"
    >
      <img
        style="height: auto; width: auto; position: relative;max-width: 48px" fill [ngSrc]="'/assets/images/card' + cardNumber + '.png'"
        alt="{{ cardNumber }}"
      />
      <span class="text-ellipsis" *ngIf="showName">{{ cardName }}</span>
    </div>
    <ng-template #unknown>&nbsp;</ng-template>
  `,
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class CardViewComponent {
    @Input() showName = false;
    @Input() showTooltip = false;

    public cardName: string;

    private _cardNumber: string;
    get cardNumber(): string {
        return this._cardNumber;
    }

    @Input()
    set cardNumber(cardNumber: string) {
        this._cardNumber = cardNumber;
        this.cardName = this._cardNumber
            ? this.translate.translations[this.translate.currentLang].creditCards[
                cardNumber
                ]
            : '';
    }

    constructor(public translate: TranslateService) {
    }
}
