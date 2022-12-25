import {Component, Input, ViewEncapsulation} from '@angular/core';

@Component({
    selector: 'app-folded-corner',
    template: `
		<div
				style="position: absolute; width: 1em; height: 1em;"
				[ngStyle]="{
        top: top + 'px',
        right: right + 'px',
        'font-size': fontSize,
        filter:
          'drop-shadow(-.20em .1em .25em rgba(0, 0, 0, ' + shadowOpacity + '))'
      }"
		>
			<div
					class="my-element-to-clip"
					style="height: 100%; clip-path: url(#myCurve); background: #fff;"
			></div>
			<svg width="0" height="0">
				<defs>
					<clipPath id="myCurve" clipPathUnits="objectBoundingBox">
						<path
								d="M .1 0
                                Q .50 .045, .5 .5
                                Q .95 .5, 1 .9
                                V 1 0"
						/>
					</clipPath>
				</defs>
			</svg>
		</div>
    `,
    // styles: [],
    encapsulation: ViewEncapsulation.None
})
export class FoldedCornerComponent {
    @Input() top = 0;
    @Input() right = 0;
    @Input() fontSize = '60px';
    @Input() shadowOpacity: any = 0.35;

    constructor() {
    }


}
