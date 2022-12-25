import {
    ChangeDetectorRef,
    Directive,
    ElementRef,
    EmbeddedViewRef,
    Input,
    NgZone,
    OnChanges,
    OnDestroy,
    OnInit,
    Renderer2,
    TemplateRef,
    ViewContainerRef
} from '@angular/core';

const dde: any = document.documentElement,
    matchingFunction = dde.matches
        ? 'matches'
        : dde.matchesSelector
            ? 'matchesSelector'
            : dde.webkitMatches
                ? 'webkitMatches'
                : dde.msMatches
                    ? 'msMatches'
                    : dde.msMatchesSelector
                        ? 'msMatchesSelector'
                        : dde.mozMatches
                            ? 'mozMatches'
                            : dde.mozMatchesSelector
                                ? 'mozMatchesSelector'
                                : null;

function closestElement(el: Node, selector: string): HTMLElement {
    while (
        el !== document.documentElement &&
        el != null &&
        !el[matchingFunction](selector)
        ) {
        el = el.parentNode;
    }

    if (el && el[matchingFunction](selector)) {
        return <HTMLElement>el;
    } else {
        return null;
    }
}

function getWindowScroll() {
    if ('pageYOffset' in window) {
        return {
            scrollTop: scrollY,
            scrollLeft: scrollX
        };
    } else {
        let sx, sy;
        const d = document,
            r = d.documentElement,
            b = d.body;
        sx = r.scrollLeft || b.scrollLeft || 0;
        sy = r.scrollTop || b.scrollTop || 0;
        return {
            scrollTop: sy,
            scrollLeft: sx
        };
    }
}

function getClientSize(element: Node | Window, sizeProp: string): number {
    if (element === window) {
        return sizeProp === 'clientWidth' ? window.innerWidth : window.innerHeight;
    } else {
        return element[sizeProp];
    }
}

function getScrollPos(element: Node | Window, scrollProp: string): number {
    return element === window
        ? getWindowScroll()[scrollProp]
        : element[scrollProp];
}

function getScrollOffset(
    vsElement: HTMLElement,
    scrollElement: HTMLElement | Window,
    isHorizontal
): number {
    const vsPos =
        vsElement.getBoundingClientRect()[isHorizontal ? 'left' : 'top'];
    const scrollPos =
        scrollElement === window
            ? 0
            : (<HTMLElement>scrollElement).getBoundingClientRect()[
                isHorizontal ? 'left' : 'top'
                ];
    const correction =
        vsPos -
        scrollPos +
        (scrollElement === window ? getWindowScroll() : scrollElement)[
            isHorizontal ? 'scrollLeft' : 'scrollTop'
            ];

    return correction;
}

function nextElementSibling(el) {
    if (el.nextElementSibling) {
        return el.nextElementSibling;
    }

    do {
        el = el.nextSibling;
    } while (el && el.nodeType !== 1);

    return el;
}

@Directive({
    selector: '[appVsFor]'
})
export class VsForDirective implements OnInit, OnChanges, OnDestroy {
    @Input()
    set appVsFor(value: any[]) {
        this._originalCollection = value || [];
        if (this.scrollParent) {
            this.refresh();
        } else {
            this.postDigest(this.refresh.bind(this));
        }
    }

    get originalCollection() {
        return this._originalCollection;
    }

    @Input() appVsForSize: any;
    @Input() appVsForOffsetAfter: number = 0;
    @Input() appVsForOffsetBefore: number = 0;
    @Input() appVsForExcess: number = 2;
    @Input() appVsForTagName: string = 'div';
    @Input() appVsForScrollParent: string;
    @Input() appVsForHorizontal: boolean = false;
    @Input() appVsForAutoresize: boolean = true;

    _originalCollection = [];
    _slicedCollection = [];
    originalLength: number;
    before: HTMLElement;
    after: HTMLElement;
    view: EmbeddedViewRef<any>;
    parent: HTMLElement;
    __autoSize: boolean;
    __options: any;
    scrollParent: HTMLElement;
    clientSize: string;
    offsetSize: string;
    scrollPos: string;
    totalSize: number;
    sizesCumulative: number[];
    sizes: number[];
    elementSize: number;
    startIndex: number;
    endIndex: number;
    _prevStartIndex: number;
    _prevEndIndex: number;
    _minStartIndex: number;
    _maxEndIndex: number;
    onWindowResize: any;
    onZone: any;

    set slicedCollection(value: any[]) {
        this._slicedCollection = value;
        this.view.context.vsCollection = this._slicedCollection;
    }

    get slicedCollection() {
        return this._slicedCollection;
    }

    constructor(
        private _element: ElementRef,
        private _viewContainer: ViewContainerRef,
        private _templateRef: TemplateRef<any>,
        private _renderer: Renderer2,
        private _ngZone: NgZone,
        private _changeDetectorRef: ChangeDetectorRef
    ) {
        let _prevClientSize;
        const reinitOnClientHeightChange = () => {
            if (!this.scrollParent) {
                return;
            }

            const ch = getClientSize(this.scrollParent, this.clientSize);
            if (ch !== _prevClientSize) {
                _prevClientSize = ch;
                this._ngZone.run(() => {
                    this.refresh();
                });
            } else {
                _prevClientSize = ch;
            }
        };

        this.onZone = this._ngZone.onStable.subscribe(reinitOnClientHeightChange);
    }

    ngOnChanges() {
        if (this.scrollParent) {
            this.refresh();
        } else {
            this.postDigest(this.refresh.bind(this));
        }
    }

    postDigest(fn) {
        const subscription: any = this._ngZone.onStable.subscribe(() => {
            fn();
            subscription.unsubscribe();
        });
    }

    initPlaceholders() {
        this.before = document.createElement(this.appVsForTagName);
        this.before.className = 'appVsFor-before';
        this.after = document.createElement(this.appVsForTagName);
        this.after.className = 'appVsFor-after';
        this.parent.insertBefore(this.before, this.parent.childNodes[0]);
        this.parent.appendChild(this.after);

        if (this.appVsForHorizontal) {
            this.before.style.height = '100%';
            this.after.style.height = '100%';
        } else {
            this.before.style.width = '100%';
            this.after.style.width = '100%';
        }
    }

    ngOnInit() {
        console.log(this.appVsForSize, this.appVsForOffsetBefore, this.appVsForOffsetAfter, this.appVsForExcess, this.appVsForScrollParent, this.appVsForAutoresize, this.appVsForTagName, this.appVsForHorizontal);
        this.view = this._viewContainer.createEmbeddedView(this._templateRef);
        this.parent = nextElementSibling(this._element.nativeElement);

        this.initPlaceholders();
        this.appVsForHorizontal = false;
        this.__autoSize = true;
        this.__options = {};
        this.clientSize = this.appVsForHorizontal ? 'clientWidth' : 'clientHeight';
        this.offsetSize = this.appVsForHorizontal ? 'offsetWidth' : 'offsetHeight';
        this.scrollPos = this.appVsForHorizontal ? 'scrollLeft' : 'scrollTop';

        if (this.appVsForScrollParent) {
            this.scrollParent = closestElement(this.parent, this.appVsForScrollParent);
        } else {
            this.scrollParent = this.parent;
        }

        this.elementSize = getClientSize(this.scrollParent, this.clientSize) || 50;

        this.totalSize = 0;

        if (typeof this.appVsForSize !== 'undefined') {
            this.sizesCumulative = [];
        }

        this.startIndex = 0;
        this.endIndex = 0;

        this.scrollParent.addEventListener('scroll', () => {
            this.updateInnerCollection();
        });

        this.onWindowResize = () => {
            if (this.appVsForAutoresize) {
                this.__autoSize = true;
                this._ngZone.run(() => {
                    this.setAutoSize();
                });
            } else {
                this._ngZone.run(() => {
                    this.updateInnerCollection();
                });
            }
        };

        window.addEventListener('resize', this.onWindowResize);
    }

    ngOnDestroy() {
        if (this.onWindowResize) {
            window.removeEventListener('resize', this.onWindowResize);
        }

        if (this.onZone) {
            this.onZone.next();
            this.onZone.complete();
            // this.onZone.unsubscribe();
        }
    }

    refresh() {
        if (!this.originalCollection || this.originalCollection.length < 1) {
            this.slicedCollection = [];
            this.originalLength = 0;
            this.updateTotalSize(0);
            this.sizesCumulative = [0];
        } else {
            this.originalLength = this.originalCollection.length;
            if (typeof this.appVsForSize !== 'undefined') {
                this.sizes = this.originalCollection.map((item, index) => {
                    if (typeof this.appVsForSize === 'function') {
                        return this.appVsForSize(item, index);
                    } else {
                        return +this.appVsForSize; // number or string
                    }
                });
                let sum = 0;
                this.sizesCumulative = this.sizes.map((size) => {
                    const res = sum;
                    sum += size;
                    return res;
                });
                this.sizesCumulative.push(sum);
            } else {
                this.__autoSize = true;
                this.postDigest(this.setAutoSize.bind(this));
            }
        }

        this.reinitialize();
    }

    updateTotalSize(size: number) {
        this.totalSize = this.appVsForOffsetBefore + size + this.appVsForOffsetAfter;
    }

    reinitialize() {
        this._prevStartIndex = void 0;
        this._prevEndIndex = void 0;
        this._minStartIndex = this.originalLength;
        this._maxEndIndex = 0;

        this.updateTotalSize(
            typeof this.appVsForSize !== 'undefined'
                ? this.sizesCumulative[this.originalLength]
                : this.elementSize * this.originalLength
        );
        this.updateInnerCollection();
    }

    setAutoSize() {
        if (typeof this.appVsForSize !== 'undefined') {
            this._ngZone.run(() => {
                this.refresh();
            });
        } else if (this.__autoSize) {
            let gotSomething = false;
            console.log(this.parent)
            if (this.parent && (this.parent.offsetHeight || this.parent.offsetWidth)) {
                // element is visible
                const child = this.parent.children[1];

                if (child[this.offsetSize]) {
                    gotSomething = true;
                    this.elementSize = child[this.offsetSize];
                }
            }

            if (gotSomething) {
                this.__autoSize = false;
                this._ngZone.run(() => {
                    this.reinitialize();
                });
            }
        }
    }

    updateInnerCollection() {
        const $scrollPosition = getScrollPos(this.scrollParent, this.scrollPos);
        const $clientSize = getClientSize(this.scrollParent, this.clientSize);

        const scrollOffset =
            this.parent === this.scrollParent
                ? 0
                : getScrollOffset(this.parent, this.scrollParent, this.appVsForHorizontal);

        let __startIndex = this.startIndex;
        let __endIndex = this.endIndex;

        if (typeof this.appVsForSize !== 'undefined') {
            __startIndex = 0;
            while (
                this.sizesCumulative[__startIndex] <
                $scrollPosition - this.appVsForOffsetBefore - scrollOffset
                ) {
                __startIndex++;
            }
            if (__startIndex > 0) {
                __startIndex--;
            }

            __startIndex = Math.max(Math.floor(__startIndex - this.appVsForExcess / 2), 0);

            __endIndex = __startIndex;
            while (
                this.sizesCumulative[__endIndex] <
                $scrollPosition - this.appVsForOffsetBefore - scrollOffset + $clientSize
                ) {
                __endIndex++;
            }

            __endIndex = Math.min(
                Math.ceil(__endIndex + this.appVsForExcess / 2),
                this.originalLength
            );
        } else {
            __startIndex = Math.max(
                Math.floor(
                    ($scrollPosition - this.appVsForOffsetBefore - scrollOffset) /
                    this.elementSize
                ) -
                this.appVsForExcess / 2,
                0
            );

            __endIndex = Math.min(
                __startIndex +
                Math.ceil($clientSize / this.elementSize) +
                this.appVsForExcess,
                this.originalLength
            );
        }

        this._minStartIndex = Math.min(__startIndex, this._minStartIndex);
        this._maxEndIndex = Math.max(__endIndex, this._maxEndIndex);

        this.startIndex = this.__options.latch ? this._minStartIndex : __startIndex;
        this.endIndex = this.__options.latch ? this._maxEndIndex : __endIndex;

        let digestRequired = false;
        if (this._prevStartIndex == null) {
            digestRequired = true;
        } else if (this._prevEndIndex == null) {
            digestRequired = true;
        }

        if (!digestRequired) {
            if (this.__options.hunked) {
                if (
                    Math.abs(this.startIndex - this._prevStartIndex) >=
                    this.appVsForExcess / 2 ||
                    (this.startIndex === 0 && this._prevStartIndex !== 0)
                ) {
                    digestRequired = true;
                } else if (
                    Math.abs(this.endIndex - this._prevEndIndex) >= this.appVsForExcess / 2 ||
                    (this.endIndex === this.originalLength &&
                        this._prevEndIndex !== this.originalLength)
                ) {
                    digestRequired = true;
                }
            } else {
                digestRequired =
                    this.startIndex !== this._prevStartIndex ||
                    this.endIndex !== this._prevEndIndex;
            }
        }

        if (digestRequired) {
            this.slicedCollection = this.originalCollection.slice(
                this.startIndex,
                this.endIndex
            );
            this.view.context.vsStartIndex = this.startIndex;
            this._prevStartIndex = this.startIndex;
            this._prevEndIndex = this.endIndex;

            const o1 = this._getOffset(0);
            const o2 = this._getOffset(this.slicedCollection.length);
            const total = this.totalSize;
            const layoutProp = this.appVsForHorizontal ? 'width' : 'height';

            this.before.style[layoutProp] = o1 + 'px';
            this.after.style[layoutProp] = total - o2 + 'px';
            this._changeDetectorRef.markForCheck();
        }

        return digestRequired;
    }

    _getOffset(index: number) {
        if (typeof this.appVsForSize !== 'undefined') {
            return (
                this.sizesCumulative[index + this.startIndex] + this.appVsForOffsetBefore
            );
        }

        return (index + this.startIndex) * this.elementSize + this.appVsForOffsetBefore;
    }
}
