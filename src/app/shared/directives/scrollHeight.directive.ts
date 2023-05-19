// import {Directive, ElementRef, HostListener, Input, NgZone, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
// import {UserService} from '@app/core/user.service';
//
// declare var $: any;
//
// export type ContainerType = 'body' | 'parent';
//
// @Directive({
//     selector: '[appScrollHeight]'
// })
// export class ScrollHeightDirective implements OnInit, OnDestroy, OnChanges {
//     @Input('appScrollHeight') scrollHeight: string | number;
//     @Input('appWithoutScroll') withoutScroll: boolean = true;
//     @Input('appScrollByChildrenContent') byChildrenContent: boolean = false;
//
//     private offsetHeightContent: number = 0;
//
//     private readonly changes: MutationObserver;
//
//     @Input('appendTo') appendTo: ContainerType = 'body';
//
//     constructor(private el: ElementRef, public userService: UserService, private zone: NgZone) {
//         this.changes = new MutationObserver((mutations: MutationRecord[]) => {
//                 // console.log('%o', mutations);
//                 if (mutations.length) {
//                     this.zone.run(() => this.getScrollSize(this.scrollHeight));
//                     // this.getScrollSize(this.scrollHeight);
//                 }
//                 // mutations.forEach((mutation: MutationRecord) => {
//                 //     console.log('%o', mutation.target);
//                 //     this.locateRelatively(mutation.target as HTMLElement);
//                 // });
//             }
//         );
//
//     }
//
//     private _window = typeof window === 'object' && window ? window : null;
//     public win: any = this._window;
//
//     private _$scrollbar;
//
//     ngOnInit() {
//         this.getScrollSize(this.scrollHeight);
//         this.changes.observe(document.getElementById('header') as HTMLElement, {
//             attributes: true,
//             // childList: true,
//             // characterData: true,
//             attributeFilter: ['style']
//         });
//         this.changes.observe(document.getElementById('side-nav') as HTMLElement, {
//             attributes: true,
//             childList: true,
//             // characterData: true,
//             attributeFilter: ['style']
//         });
//         if (this.byChildrenContent) {
//             this.changes.observe(this.el.nativeElement as HTMLElement, {
//                 attributes: true,
//                 childList: true,
//                 // characterData: true,
//                 attributeFilter: ['style']
//             });
//         }
//     }
//
//     ngOnDestroy(): void {
//         // debugger;
//         (<any>$(this.el.nativeElement)).scrollbar('destroy');
//         this.changes.disconnect();
//     }
//
//     @HostListener('window:resize', ['$event'])
//     sizeChange(event) {
//         this.getScrollSize(this.scrollHeight);
//     }
//
//     private getScrollSize(size: any = 75): void {
//         if (this.byChildrenContent && this.el.nativeElement && this.el.nativeElement.children) {
//             this.offsetHeightContent = Array.from(this.el.nativeElement.children).reduce((total, item, currentIndex) => {
//                 return total + item['offsetHeight'];
//             }, 0);
//         }
//         if (this.appendTo === 'parent') {
//             this.setScrollSize(size);
//         } else {
//
//             const divideNum = Number((window.devicePixelRatio / (window.screen.availWidth / document.documentElement.clientWidth)).toFixed(0));
//             const perInnerHeight = ((window.innerHeight / 100) * (100 - ((((window.devicePixelRatio * 100) / divideNum) - 100))));
//             const innerHeightOfReg = window.innerHeight + (window.innerHeight - perInnerHeight);
//             // console.log('window.innerHeight', window.innerHeight);
//             // console.log('full  100% .innerHeight', innerHeightOfReg);
//             // console.log('innerHeightOfReg-size-1', innerHeightOfReg - size - 1);
//             this.setScrollSize(innerHeightOfReg - size - 1);
//
//
//             // if (((window.innerWidth / window.outerWidth) !== 1)) {
//             //     let divideNum = 1;
//             //     if(
//             //         (((window.innerWidth / window.outerWidth) === 1) && window.devicePixelRatio === 2)
//             //         ||
//             //         navigator.userAgent.includes('Macintosh')
//             //     ){
//             //         divideNum = 2;
//             //     }
//             //     const perInnerHeight = ((window.innerHeight / 100) * (100 - ((((window.devicePixelRatio * 100) / divideNum) - 100))));
//             //     const innerHeightOfReg = window.innerHeight + (window.innerHeight - perInnerHeight);
//             //     // console.log('window.innerHeight', window.innerHeight);
//             //     // console.log('full  100% .innerHeight', innerHeightOfReg);
//             //
//             //
//             //     console.log('innerHeightOfReg-size-1', innerHeightOfReg - size - 1);
//             //     this.setScrollSize(innerHeightOfReg - size - 1);
//             // } else {
//             //     this.setScrollSize(
//             //         (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight)
//             //         - size
//             //         // + ((this.userService.appData && this.userService.appData.inFullScreenMode) ? 75 : 0)
//             //         - 1);
//             // }
//         }
//     }
//
//     private setScrollSize(size: string | number): void {
//         const height: any = size;
//         console.log('-----height: ', height);
//         if (this.byChildrenContent && this.offsetHeightContent !== 0 && (height >= this.offsetHeightContent)) {
//             let offsetHeightContent = this.offsetHeightContent;
//             // console.log('offsetHeightContent: ', offsetHeightContent);
//             // if ((window.innerWidth / window.outerWidth) !== 1) {
//             //     offsetHeightContent = offsetHeightContent + (offsetHeightContent * ((window.innerHeight / window.outerHeight) * 2));
//             //     console.log('offsetHeightContent not 100%: ', offsetHeightContent);
//             // }
//             this.el.nativeElement.style.height = offsetHeightContent + 'px';
//             if (this.withoutScroll) {
//                 this.el.nativeElement.style.overflowY = ('WebkitAppearance' in document.documentElement.style) ? 'overlay' : 'auto';
//             }
//             if (this.el.nativeElement.className.includes('scrollbar-dynamic')) {
//                 if (!this._$scrollbar) {
//                     this._$scrollbar = (<any>$(this.el.nativeElement)).scrollbar({
//                         isRtl: this.userService.appData.dir === 'rtl'
//                     });
//
//                 }
//                 this.el.nativeElement.parentElement.style.maxHeight = (offsetHeightContent) + 'px';
//                 this.el.nativeElement.parentElement.style.height = this.el.nativeElement.parentElement.style.maxHeight;
//             }
//         } else {
//             let heightSize = height;
//             // console.log('heightSize: ', heightSize);
//             // if ((window.innerWidth / window.outerWidth) !== 1) {
//             //     // heightSize = heightSize + ((heightSize - 2) * ((window.innerHeight / window.outerHeight) * 2));
//             //     // console.log('heightSize not 100%: ', heightSize);
//             //
//             //     const test = heightSize + (heightSize * (window.innerWidth / window.outerWidth));
//             //     console.log('test not 100%: ', test);
//             // }
//             this.el.nativeElement.style.height = heightSize + 'px';
//             if (this.withoutScroll) {
//                 this.el.nativeElement.style.overflowY = ('WebkitAppearance' in document.documentElement.style) ? 'overlay' : 'auto';
//             }
//             if (this.el.nativeElement.className.includes('scrollbar-dynamic')) {
//                 if (!this._$scrollbar) {
//                     this._$scrollbar = (<any>$(this.el.nativeElement)).scrollbar({
//                         isRtl: this.userService.appData.dir === 'rtl'
//                     });
//
//                 }
//
//                 this.el.nativeElement.parentElement.style.maxHeight = (heightSize - 2) + 'px';
//                 this.el.nativeElement.parentElement.style.height = this.el.nativeElement.parentElement.style.maxHeight;
//             }
//         }
//
//
//     }
//
//     ngOnChanges(changes: SimpleChanges): void {
//         if (changes.scrollHeight && +changes.scrollHeight.currentValue > 0) {
//             // console.log('ngOnChanges:  ', changes.scrollHeight.currentValue)
//             this.getScrollSize(changes.scrollHeight.currentValue);
//         }
//     }
// }
import {
    Directive,
    ElementRef,
    HostListener,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    OnInit,
    SimpleChanges
} from '@angular/core';
import {UserService} from '@app/core/user.service';

declare var $: any;

export type ContainerType = 'body' | 'parent';

@Directive({
    selector: '[appScrollHeight]'
})
export class ScrollHeightDirective implements OnInit, OnDestroy, OnChanges {
    @Input() appScrollHeight: string | number;
    @Input() appWithoutScroll: boolean = true;
    @Input() appScrollByChildrenContent: boolean = false;

    private offsetHeightContent: any = 0;

    private readonly changes: MutationObserver;

    @Input() appendTo: ContainerType = 'body';

    constructor(
        public el: ElementRef,
        public userService: UserService,
        private zone: NgZone
    ) {
        this.changes = new MutationObserver((mutations: MutationRecord[]) => {
            // console.log('%o', mutations);
            if (mutations.length) {
                this.zone.run(() => this.getScrollSize(this.appScrollHeight));
                // this.getScrollSize(this.appScrollHeight);
            }
            // mutations.forEach((mutation: MutationRecord) => {
            //     console.log('%o', mutation.target);
            //     this.locateRelatively(mutation.target as HTMLElement);
            // });
        });
    }

    private _window = typeof window === 'object' && window ? window : null;
    public win: any = this._window;

    private _$scrollbar;

    ngOnInit() {
        this.getScrollSize(this.appScrollHeight);
        if (document.getElementById('header')) {
            this.changes.observe(document.getElementById('header') as HTMLElement, {
                attributes: true,
                // childList: true,
                // characterData: true,
                attributeFilter: ['style']
            });
        }
        if (document.getElementById('side-nav')) {
            this.changes.observe(document.getElementById('side-nav') as HTMLElement, {
                attributes: true,
                childList: true,
                // characterData: true,
                attributeFilter: ['style']
            });
        }
        if (this.appScrollByChildrenContent) {
            this.changes.observe(this.el.nativeElement as HTMLElement, {
                attributes: true,
                childList: true,
                // characterData: true,
                attributeFilter: ['style']
            });
        }
    }

    ngOnDestroy(): void {
        // debugger;
        (<any>$(this.el.nativeElement)).scrollbar('destroy');
        this.changes.disconnect();
    }

    @HostListener('window:resize', ['$event'])
    sizeChange(event) {
        this.getScrollSize(this.appScrollHeight);
    }

    private getScrollSize(size: any = 75): void {
        if (
            this.appScrollByChildrenContent &&
            this.el.nativeElement &&
            this.el.nativeElement.children
        ) {
            this.offsetHeightContent = Array.from(
                this.el.nativeElement.children
            ).reduce((total, item, currentIndex) => {
                return total + item['offsetHeight'];
            }, 0);
        }
        if (this.appendTo === 'parent') {
            this.setScrollSize(size);
        } else {
            this.setScrollSize(typeof size === 'string' ? size
                :
                (window.innerHeight ||
                    document.documentElement.clientHeight ||
                    document.body.clientHeight) -
                size -
                // + ((this.userService.appData && this.userService.appData.inFullScreenMode) ? 75 : 0)
                1
            );
        }
    }

    private setScrollSize(size: string | number): void {
        const height: any = size;
        // console.log(this.offsetHeightContent, height, this.appScrollByChildrenContent)
        if (
            this.appScrollByChildrenContent &&
            this.offsetHeightContent !== 0 &&
            height >= this.offsetHeightContent
        ) {
            this.el.nativeElement.style.height = this.offsetHeightContent + 'px';
            if (this.appWithoutScroll) {
                this.el.nativeElement.style.overflowY =
                    'WebkitAppearance' in document.documentElement.style
                        ? 'overlay'
                        : 'auto';
            }
            if (this.el.nativeElement.className.includes('scrollbar-dynamic')) {
                if (!this._$scrollbar) {
                    this._$scrollbar = (<any>$(this.el.nativeElement)).scrollbar({
                        isRtl: this.userService.appData.dir === 'rtl'
                    });
                }
                this.el.nativeElement.parentElement.style.maxHeight =
                    this.offsetHeightContent + 'px';
                this.el.nativeElement.parentElement.style.height =
                    this.el.nativeElement.parentElement.style.maxHeight;
            }
        } else {
            this.el.nativeElement.style.height = height + 'px';
            if (this.appWithoutScroll) {
                this.el.nativeElement.style.overflowY =
                    'WebkitAppearance' in document.documentElement.style
                        ? 'overlay'
                        : 'auto';
            }
            if (this.el.nativeElement.className.includes('scrollbar-dynamic')) {
                if (!this._$scrollbar) {
                    this._$scrollbar = (<any>$(this.el.nativeElement)).scrollbar({
                        isRtl: this.userService.appData.dir === 'rtl'
                    });
                }
                this.el.nativeElement.style.maxHeight = height - 2 + 'px';
                this.el.nativeElement.parentElement.style.maxHeight = height - 2 + 'px';
                this.el.nativeElement.parentElement.style.height =
                    this.el.nativeElement.parentElement.style.maxHeight;
            }
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['appScrollHeight'] && +changes['appScrollHeight'].currentValue > 0) {
            this.getScrollSize(changes['appScrollHeight'].currentValue);
        }
    }
}
