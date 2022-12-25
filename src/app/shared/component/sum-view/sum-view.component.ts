import {Component, Input, OnChanges, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {formatAsSumNoMath} from '../../functions/addCommaToNumbers';

@Component({
    selector: 'app-sum-view',
    template: `
		<ng-container *ngIf="highlight; else usual">
			<ng-container *ngIf="highlightFormatted; else splittedHighlight">
        <span [innerHTML]="highlightFormatted[0] | highlight: highlightFormatted[1]"
        ></span>
			</ng-container>
			<ng-template #splittedHighlight>
				<span [innerHTML]="sumBase | highlight: highlight"></span>
				<span
						class="sum-fraction"
						*ngIf="sumFraction && showDecimal"
						[innerHTML]="'.' + sumFraction | highlight: highlight"
				></span>
			</ng-template>
		</ng-container>
		<ng-template #usual>
      <span>{{ sumBase }}</span
      ><span class="sum-fraction" *ngIf="sumFraction && showDecimal">.{{ sumFraction }}</span>
		</ng-template>
    `,
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class SumViewComponent implements OnChanges {
    public sumBase: string;
    public sumFraction: string;
    highlightFormatted: string[] | null;

    @Input() highlight: string;
    @Input() isABS: boolean = false;
    @Input() showDecimal: boolean = true;

    @Input()
    set sum(sum: number) {
        [this.sumBase, this.sumFraction] = Number.isFinite(+sum)
            ? this.isABS
                ? formatAsSumNoMath(Math.abs(sum)).split('.')
                : formatAsSumNoMath(sum).split('.') // addCommaToNumbers(sum).split('.')
            : [undefined, undefined];
    }

    rebuildHighlightFormatted(): string[] | null {
        if (!this.highlight || !Number.isFinite(+this.highlight)) {
            return null;
        }

        if (this.showDecimal) {
            const valAsText = this.sumBase + '.' + this.sumFraction;

            if (valAsText.includes(this.highlight)) {
                return [valAsText, this.highlight];
            }

            const formatted = formatAsSumNoMath(this.highlight);
            if (valAsText.includes(formatted)) {
                return [valAsText, formatted];
            }

            const valAsPlainText = valAsText.replace(/,/g, '');
            if (valAsPlainText.includes(this.highlight)) {
                return [valAsPlainText, this.highlight];
            }
        } else {
            const valAsText = this.sumBase;

            if (valAsText.includes(this.highlight)) {
                return [valAsText, this.highlight];
            }

            const formatted = formatAsSumNoMath(this.highlight);
            if (valAsText.includes(formatted)) {
                return [valAsText, formatted];
            }

            const valAsPlainText = valAsText.replace(/,/g, '');
            if (valAsPlainText.includes(this.highlight)) {
                return [valAsPlainText, this.highlight];
            }
        }


        return null;
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.highlightFormatted = this.rebuildHighlightFormatted();
    }
}
