import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {slideInOut} from '../../animations/slideInOut';
import {getCurrencySymbol} from '@angular/common';

@Component({
    selector: 'app-tooltip-editor',
    templateUrl: './tooltip-editor.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class TooltipEditorComponent {
    public tooltipShown = false;

    currency: string;
    valType = 'text';

    value: string | number;

    @Input()
    set type(val: string) {
        if (getCurrencySymbol(val, 'narrow')) {
            this.currency = val;
            this.valType = 'number';
        }
    }

    @Output() clickOpen = new EventEmitter<boolean>();
    @Output() editCommit = new EventEmitter<string | number>();
    @Output() editCancel = new EventEmitter<boolean>();

    @ViewChild('editor', {read: ElementRef}) editorRef: ElementRef;

    constructor(
        public translate: TranslateService,
        public userService: UserService,
        public browserService: BrowserService,
        private _element: ElementRef
    ) {
    }

    @HostListener('document:click', ['$event'])
    private onClickOutside($event: any) {
        // console.log('%o', $event);
        const elementRefInPath = BrowserService.pathFrom($event).find(
            (node) => node === this._element.nativeElement
        );
        if (
            this.tooltipShown &&
            !BrowserService.pathFrom($event).find(
                (node) => node === this._element.nativeElement
            )
        ) {
            if (this.value) {
                this.commitEdit();
            } else {
                this.cancelEdit();
            }
        }
    }

    toggleTooltip(): void {
        this.tooltipShown = !this.tooltipShown;
        this.clickOpen.emit(this.tooltipShown);

        if (this.tooltipShown) {
            setTimeout(() => {
                this.editorRef.nativeElement.focus();
            });
        }
    }

    commitEdit() {
        this.editCommit.emit(this.value);
        this.value = null;

        if (this.tooltipShown) {
            this.toggleTooltip();
        }
    }

    cancelEdit() {
        this.editCancel.emit(true);
        this.value = null;

        if (this.tooltipShown) {
            this.toggleTooltip();
        }
    }
}
