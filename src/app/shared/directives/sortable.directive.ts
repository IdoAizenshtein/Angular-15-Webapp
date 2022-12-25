import {
    Directive,
    ElementRef,
    EventEmitter,
    NgZone,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges
} from '@angular/core';
import {UserService} from '@app/core/user.service';

declare var $: any;

export type ContainerType = 'body' | 'parent';

@Directive({
    selector: '[appSortable]'
})
export class SortableDirective implements OnInit, OnDestroy, OnChanges {
    private readonly changes: MutationObserver;

    constructor(
        private el: ElementRef,
        public userService: UserService,
        private zone: NgZone
    ) {
    }

    private _window = typeof window === 'object' && window ? window : null;
    public win: any = this._window;
    @Output() refreshBack: EventEmitter<any> = new EventEmitter();

    ngOnInit() {
        (<any>$(this.el.nativeElement)).sortable({
            containment: 'parent',
            scroll: true,
            opacity: 0.5,
            items: '> li.photoDrag',
            stop: (event, ui) => {
                const toArray = (<any>$(this.el.nativeElement)).sortable('toArray');
                this.refreshBack.emit(toArray);
            }
        });
        (<any>$(this.el.nativeElement)).disableSelection();
    }

    ngOnDestroy(): void {
        //(<any>$(this.el.nativeElement)).scrollbar('destroy');
        this.changes.disconnect();
    }

    ngOnChanges(changes: SimpleChanges): void {
        console.log('')
        // if (changes.scrollHeight && +changes.scrollHeight.currentValue > 0) {
        //     this.getScrollSize(changes.scrollHeight.currentValue);
        // }
    }
}
