import {Directive, ElementRef, HostListener, Input} from '@angular/core';

@Directive({
    selector: '[appNumbersOnly]'
})
export class NumbersOnlyDirective {
    // private regex: RegExp = new RegExp(/^-?\d+(\.\d+)?$/);
    // private specialKeys: Array<string> = [
    //     'Backspace',
    //     'Tab',
    //     'End',
    //     'Home',
    //     'ArrowLeft',
    //     'Left',
    //     'ArrowRight',
    //     'Right',
    //     'Delete',
    //     'Enter'
    // ];
    // private regexPositive: RegExp = new RegExp(/^\d+(\.\d+)?$/);
    // private regexPositiveInt: RegExp = new RegExp(/^[0-9]+$/g);
    // private regexPhoneNo: RegExp = new RegExp(/^[0-9\-]+$/g);
    // private numWithTwoDec: RegExp = new RegExp(/^-?[0-9]+(\.([0-9]{1,2})?)?$/g);
    // private regexAlpha: RegExp = new RegExp(
    //     '^[a-zA-Z\u0590-\u05FF\u200f\u200e ]+$'
    // );



    private regex: RegExp = new RegExp(/^-?[0-9]+(\.[0-9]*){0,1}$/g);
    private specialKeys: Array<string> = ['Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'Left', 'ArrowRight', 'Right', 'Delete', 'Enter'];
    private regexPositive: RegExp = new RegExp(/^[0-9]+(\.[0-9]*){0,1}$/g);
    private regexPositiveInt: RegExp = new RegExp(/^[0-9]+$/g);
    private regexPhoneNo: RegExp = new RegExp(/^[0-9\-]+$/g);
    private numWithTwoDec: RegExp = new RegExp(/^-?[0-9]+(\.([0-9]{1,2})?)?$/g);
    private regexAlpha: RegExp = new RegExp('^[a-zA-Z\u0590-\u05FF\u200f\u200e ]+$');

    @Input() appNumbersOnly:
        any
        | 'positive'
        | 'positiveInt'
        | 'regexPositiveInt'
        | 'phoneNo'
        | 'percentNum'
        | 'numWithTwoDec'
        | 'positiveWithoutFirstZero'
        | 'alpha';

    constructor(private el: ElementRef) {
    }

    private modifiedValue(input: string): string {
        const currVal = this.el.nativeElement.value;
        if (this.el.nativeElement instanceof HTMLInputElement) {
            const selectionStart = (this.el.nativeElement as HTMLInputElement)
                .selectionStart;
            const selectionEnd = (this.el.nativeElement as HTMLInputElement)
                .selectionEnd;
            return (
                currVal.substring(0, selectionStart) + input + currVal.substring(selectionEnd)
            );
        }
        return currVal + input;
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

        // const current: string = this.el.nativeElement.value;
        const next: string = this.modifiedValue(event.key);
        if (
            (next && !this.isValidValue(next)) ||
            (this.appNumbersOnly === 'positiveWithoutFirstZero' && next.toString() === '0')
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
        const clipboardData = e.clipboardData || (window as any).clipboardData;
        const pastedData = clipboardData.getData('text');
        if (!this.isValidValue(this.modifiedValue(String(pastedData)))) {
            e.preventDefault();
            // } else {
            //     console.log('Pasting: ', pastedData);
        }
    }

    private isValidValue(val: string): boolean {
        if (!val) {
            return true;
        }
        switch (this.appNumbersOnly) {
            case 'positive':
                return val.match(this.regexPositive) !== null;
            case 'positiveWithoutFirstZero':
                return val.match(this.regexPositive) !== null;
            case 'positiveInt':
                return val.match(this.regexPositiveInt) !== null;
            case 'phoneNo':
                return val.match(this.regexPhoneNo) !== null;
            case 'percentNum':
                return val.match(this.regexPositiveInt) !== null && Number(val) <= 100;
            case 'numWithTwoDec':
                return val === '-' || val.match(this.numWithTwoDec) !== null;
            case 'alpha':
                return this.regexAlpha.test(val);
            default:
                return val.match(this.regex) !== null;
        }
    }
}
