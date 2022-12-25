import {Component, ViewEncapsulation} from '@angular/core';

@Component({
    template: `
		<div
				style="text-align: center; font-size: 3em; padding-top: 3em; color: #022258; font-weight: 600;"
		>
			בקרוב
		</div>
    `,
    encapsulation: ViewEncapsulation.None
})
export class ComingSoonComponent {
    constructor() {
    }


}
