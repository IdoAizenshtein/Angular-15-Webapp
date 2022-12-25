import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA} from '@angular/material/legacy-snack-bar';

@Component({
    templateUrl: './new-docs-available-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class NewDocsAvailablePromptComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA)
        public data: {
            text: string;
            onRefreshSelected(): void;
        }
    ) {
    }
}
