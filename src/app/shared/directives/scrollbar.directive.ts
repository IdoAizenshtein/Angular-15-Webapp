import {Directive, ElementRef, HostListener, Input, OnInit} from '@angular/core';
import {UserService} from '@app/core/user.service';

declare var $: any;

@Directive({
    selector: '[appScrollbar]'
})
export class ScrollbarDirective implements OnInit {
    constructor(private el: ElementRef, public userService: UserService) {
    }

    private _window = typeof window === 'object' && window ? window : null;
    public win: any = this._window;

    @Input() appScrollbar: any = false;

    ngOnInit() {
        this.setScroll();
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(event) {
        this.setScroll();
    }

    private setScroll(): void {
        const clientHeight = Number.isInteger(this.appScrollbar) ? this.appScrollbar : this.el.nativeElement.parentElement.offsetHeight - 2;
        (<any>$(this.el.nativeElement)).scrollbar(
            this.appScrollbar
                ? {
                    isRtl: this.userService.appData.dir === 'rtl',
                    onScroll: (y, x) => {
                        const rowVisible: number = Math.round(y.scroll / 36);
                        const type = (<any>$(this.el.nativeElement))
                            .find('li')
                            .eq(rowVisible)
                            .attr('data-type');
                        if (type) {
                            (<any>$(this.el.nativeElement.parentElement))
                                .prev()
                                .show()
                                .children('div')
                                .text(type);
                        }
                    }
                }
                : {
                    isRtl: this.userService.appData.dir === 'rtl'
                }
        );
        this.el.nativeElement.parentElement.style.maxHeight = clientHeight + 'px';
        this.el.nativeElement.parentElement.style.height =
            this.el.nativeElement.parentElement.style.maxHeight;
    }
}
