import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
    selector: '[appCtrlKey]'
})
export class CtrlKeyDirective {
    constructor(private el: ElementRef) {
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        console.log('event.ctrlKey', event.ctrlKey);
        console.log('event.metaKey', event.metaKey);
        // console.log('event.keyCode', event.keyCode);

        if (event.ctrlKey || event.metaKey) {
            // 'CTRL'
            // console.log('1111')
            return;
        }
    }
}
