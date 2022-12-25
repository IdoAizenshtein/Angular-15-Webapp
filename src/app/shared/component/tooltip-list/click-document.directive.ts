import {Directive, ElementRef, EventEmitter, HostListener, Output} from '@angular/core';
import {BrowserService} from '@app/shared/services/browser.service';

@Directive({
    selector: '[appClickDocument]'
})
export class ClickDocumentDirective {
    constructor(private el: ElementRef) {
    }

    private isInside = false;
    @Output() closed = new EventEmitter<any>();

    @HostListener('click', ['$event.target']) onclick(data: any) {
        this.isInside = true;
    }

    @HostListener('document:click', ['$event'])
    onClickOutside(event: any) {
        const elementRefInPath = BrowserService.pathFrom(event).includes(
            this.el.nativeElement.parentNode
        );
        if (!elementRefInPath && !this.isInside) {
            this.closed.emit(true);
        }
        this.isInside = false;
    }
}
