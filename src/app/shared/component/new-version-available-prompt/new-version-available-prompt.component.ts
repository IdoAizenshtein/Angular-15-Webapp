import {Component, Inject, ViewEncapsulation} from '@angular/core';
import {MAT_LEGACY_SNACK_BAR_DATA as MAT_SNACK_BAR_DATA} from '@angular/material/legacy-snack-bar';

@Component({
    templateUrl: './new-version-available-prompt.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class NewVersionAvailablePromptComponent {
    constructor(
        @Inject(MAT_SNACK_BAR_DATA)
        public data: {
            onRefreshSelected(): void;
        }
    ) {
    }
}
