import {Directive, ElementRef, NgZone, OnDestroy, OnInit, Optional, Renderer2} from '@angular/core';
import {Tooltip} from 'primeng/tooltip';

@Directive({
    // tslint:disable-next-line:directive-selector
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: '[pTooltip].text-ellipsis,input[type=text][pTooltip]'
})
export class TooitipIfEllipsisDirective implements OnInit, OnDestroy {
    // private readonly changes: MutationObserver;
    // private readonly observer: IntersectionObserver;
    private unlisteners: Function[] | null;

    private readonly handleMouseenter = (): void => {
        this.zone.runGuarded(() => {
            this.evaluate();
        });
        // tslint:disable-next-line:semicolon
    };

    ngOnInit(): void {
        if (this.pTooltipDirective) {
            // this.changes.observe(this.el.nativeElement, {
            //     attributes: true,
            //     childList: true,
            //     characterData: true
            // });

            // this.observer.observe(this.el.nativeElement);

            this.pTooltipDirective.disabled = true;

            this.zone.runOutsideAngular(() => {
                this.unlisteners = [
                    this.renderer.listen(
                        this.el.nativeElement,
                        'mouseenter',
                        this.handleMouseenter
                    )
                ];
            });
        }
    }

    ngOnDestroy(): void {
        // this.changes.disconnect();
        // this.observer.disconnect();

        if (this.unlisteners) {
            for (const unlistener of this.unlisteners) {
                unlistener();
            }
        }
    }

    constructor(
        public el: ElementRef,
        private renderer: Renderer2,
        private zone: NgZone,
        @Optional() private pTooltipDirective: Tooltip
    ) {
        // this.changes = new MutationObserver((mutations: MutationRecord[]) => {
        //         this.evaluate();
        //     }
        // );
        // this.observer = new IntersectionObserver((entries: any[]) => {
        //     if (entries && entries.length && entries[entries.length - 1].isIntersecting) {
        //         this.evaluate();
        //     }
        // }, {threshold: 1});
    }

    private evaluate() {
        const hostEl = this.el.nativeElement as HTMLElement;

        const ellipsisNeeded = hostEl.offsetWidth < hostEl.scrollWidth;
        this.pTooltipDirective.disabled = !ellipsisNeeded;
    }
}
