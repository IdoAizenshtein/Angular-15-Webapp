import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChange,
    SimpleChanges
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {slideInOut} from '../../animations/slideInOut';

@Component({
    selector: 'app-tooltip-list',
    templateUrl: './tooltip-list.html',
    preserveWhitespaces: false,
    animations: [slideInOut],
    styles: [
        '.hoverSum:hover { text-decoration: underline;  } .tooltip{direction: rtl;}'
    ]
})
export class TooltipListComponent
    implements AfterViewInit, OnChanges {
    public showPanelDD = false;
    @Input() title: any;
    @Input() type: string;
    public dataContent: any[];
    @Input() data: any;
    public parentNode: ElementRef;
    @Output() changed = new EventEmitter<any>();
    @Output() clickOpen = new EventEmitter<any>();

    @Input() stickTooltipToTop = false;
    private scrollParent: HTMLElement;
    private readonly tooltipMaxHeight = 270;

    static getScrollParent(node: any): any {
        const isElement = node instanceof HTMLElement;
        const overflowY = isElement && window.getComputedStyle(node).overflowY;
        const isScrollable = overflowY !== 'visible' && overflowY !== 'hidden';

        if (!node) {
            return null;
        } else if (isScrollable && node.scrollHeight >= node.clientHeight) {
            return node;
        }

        return (
            TooltipListComponent.getScrollParent(node.parentNode) || document.body
        );
    }

    constructor(
        public translate: TranslateService,
        public userService: UserService,
        public browserService: BrowserService,
        private _element: ElementRef
    ) {
    }

    ngOnChanges(changes: SimpleChanges) {
        const data: SimpleChange = changes['data'];
        if (
            data.previousValue !== undefined &&
            data.previousValue !== data.currentValue
        ) {
            this.dataContent = data.currentValue;
        }
    }

    closeDoc(): void {
        if (this.showPanelDD) {
            this.showPanelDD = false;
            this.data = [];
            this.dataContent = [];
            this.clickOpen.emit(false);
        }
    }

    ngAfterViewInit(): void {
        this.scrollParent = TooltipListComponent.getScrollParent(
            this._element.nativeElement
        ) as HTMLElement;
    }


    toggleTooltip(): void {
        if (!this.showPanelDD) {
            this.locateTooltip();
        }
        this.showPanelDD = !this.showPanelDD;
        this.clickOpen.emit(this.showPanelDD);
    }

    private locateTooltip(): void {
        const parentRect = this.scrollParent.getBoundingClientRect();
        const hostRect = (
            this._element.nativeElement as HTMLElement
        ).getBoundingClientRect();
        const viewportBottom = parentRect.bottom;
        const bottomIfDown = hostRect.bottom + this.tooltipMaxHeight;
        const topIfUp = hostRect.top - this.tooltipMaxHeight;

        // console.log('scrollTop ==> %o, hostRect = %o',
        //     scrollParent.scrollTop,
        //     hostRect);
        this.stickTooltipToTop =
            bottomIfDown > viewportBottom &&
            (topIfUp > parentRect.top ||
                this.scrollParent.scrollTop > this.tooltipMaxHeight);
        console.log(
            'stickTooltipToTop ==> %o, vp = [%o, %o], wanted = [%o, %o]',
            this.stickTooltipToTop,
            parentRect.top,
            viewportBottom,
            topIfUp,
            bottomIfDown
        );
    }
}
