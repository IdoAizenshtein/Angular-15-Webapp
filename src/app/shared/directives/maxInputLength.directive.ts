import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
    selector: '[appMaxInputLength]'
})
export class MaxInputLengthDirective {
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

    @Input() appMaxInputLength: number;

    private el: HTMLInputElement;

    constructor(private elementRef: ElementRef) {
        this.el = this.elementRef.nativeElement;
    }

    @HostListener('keydown', ['$event'])
    onKeyDown(event: KeyboardEvent) {
        if (!this.appMaxInputLength) {
            return;
        }

        // Allow Backspace, tab, end, and home keys
        if (
            this.specialKeys.indexOf(event.key) !== -1 ||
            ((event.ctrlKey || event.metaKey) && event.code === 'KeyC') || // 'CTRL + C (copy to clipboard)'
            ((event.ctrlKey || event.metaKey) && event.code === 'KeyV') // 'CTRL + V (paste from clipboard)'
        ) {
            return;
        }

        if (
            this.el.readOnly ||
            this.el.disabled ||
            this.el.value.length >= this.appMaxInputLength
        ) {
            event.preventDefault();
        }
    }

    // @HostListener('copy', ['$event'])
    // onCopy(e: ClipboardEvent) {
    //     console.log('Copying: ', e);
    // }

    @HostListener('paste', ['$event'])
    onPaste(e: any) {
        if (!this.appMaxInputLength) {
            return;
        }

        if (!this.el.readOnly && !this.el.disabled) {
            const clipboardData = e.clipboardData || (window as any).clipboardData;
            const pastedData = clipboardData.getData('text');

            const maxLengthToInsert = Math.max(
                this.appMaxInputLength - this.el.value.length,
                0
            );
            if (maxLengthToInsert > 0) {
                this.el.value =
                    this.el.value.slice(0, this.el.selectionStart) +
                    pastedData.slice(0, maxLengthToInsert) +
                    this.el.value.slice(this.el.selectionEnd);
            }

            e.preventDefault();
            e.stopPropagation();
        }
    }
}
