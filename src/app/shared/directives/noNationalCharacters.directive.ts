import {Directive, ElementRef, HostListener} from '@angular/core';

@Directive({
    selector: '[appNoNationalCharacters]'
})
export class NoNationalCharactersDirective {
    private regex: RegExp = new RegExp(/[\u0590-\u05FF]+/g);
    private specialKeys: Array<string> = [
        'Backspace',
        'Tab',
        'End',
        'Home',
        'ArrowLeft',
        'Left',
        'ArrowRight',
        'Right',
        'Delete',
        'Enter'
    ];

    constructor(private el: ElementRef) {
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        // Allow Backspace, tab, end, and home keys
        if (
            this.specialKeys.indexOf(event.key) !== -1 ||
            ((event.ctrlKey || event.metaKey) && event.code === 'KeyC') || // 'CTRL + C (copy to clipboard)'
            ((event.ctrlKey || event.metaKey) && event.code === 'KeyV') // 'CTRL + V (paste from clipboard)'
        ) {
            return;
        }

        const current: string = this.el.nativeElement.value;
        const next: string = current.concat(event.key);
        if (next && !this.isValidValue(String(next))) {
            event.preventDefault();
        }
    }

    @HostListener('paste', ['$event'])
    onPaste(e: any) {
        const clipboardData = e.clipboardData || (window as any).clipboardData;
        const pastedData = clipboardData.getData('text');
        if (!this.isValidValue(String(pastedData))) {
            e.preventDefault();
            // } else {
            //     console.log('Pasting: ', pastedData);
        }
    }

    private isValidValue(val: string): boolean {
        return !val || val.match(this.regex) === null;
    }
}
