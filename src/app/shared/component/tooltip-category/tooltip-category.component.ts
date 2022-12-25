import {
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {BrowserService} from '@app/shared/services/browser.service';
import {slideInOut} from '../../animations/slideInOut';
import {Observable} from 'rxjs';
import {FormControl} from '@angular/forms';

@Component({
    selector: 'app-tooltip-category',
    templateUrl: './tooltip-category.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class TooltipCategoryComponent {
    public showPanelDD = false;

    @Input() title: string;
    @Input() type: string;

    @Input() set translateEnum(val: string | Observable<any>) {
        if (!val) {
            this.translate$ = null;
        } else if (val instanceof Observable) {
            this.translate$ = val;
        } else {
            this.translate$ = this.translate.get(val);
        }
    }

    @Input() isNewLine: boolean = false;
    @Input() ddIcon: boolean = false;
    @Input() isSorted: boolean = true;

    public dataContent: { id: any; val: string; checked: boolean }[];

    translate$: Observable<any>;

    @Input() set data(data: { id: any; val: string; checked: boolean }[]) {
        this.dataContent = data;
        if (Array.isArray(this.dataContent) && this.dataContent.length > 1) {
            if (this.translate$) {
                this.translate$.subscribe((rslt) => {
                    this.dataContent.forEach(
                        (item) => ((<any>item).valTranslated = rslt[item.val])
                    );

                    if (this.isSorted) {
                        this.dataContent.sort((a, b) => {
                            if ((a.id === 'all') !== (b.id === 'all')) {
                                return a.id === 'all' ? -1 : 1;
                            } else if (a.id === 'all') {
                                return 0;
                            } else {
                                const lblA = rslt[a.val],
                                    lblB = rslt[b.val];
                                return lblA || lblB
                                    ? !lblA
                                        ? 1
                                        : !lblB
                                            ? -1
                                            : lblA.localeCompare(lblB)
                                    : 0;
                            }
                        });
                    }
                });
            } else if (this.translateEnum) {
                this.dataContent.forEach(
                    (item) =>
                        ((<any>item).valTranslated = this.translate.instant(
                            this.translateEnum + '.' + item.val
                        ))
                );
                if (this.isSorted) {
                    this.dataContent.sort((a, b) => {
                        if ((a.id === 'all') !== (b.id === 'all')) {
                            return a.id === 'all' ? -1 : 1;
                        } else if (a.id === 'all') {
                            return 0;
                        } else {
                            const lblA = this.translate.instant(
                                    this.translateEnum + '.' + a.val
                                ),
                                lblB = this.translate.instant(this.translateEnum + '.' + b.val);

                            return lblA || lblB
                                ? !lblA
                                    ? 1
                                    : !lblB
                                        ? -1
                                        : lblA.localeCompare(lblB)
                                : 0;
                        }
                    });
                }
            } else {
                if (this.isSorted) {
                    this.dataContent.sort((a, b) => {
                        if (
                            (a.id === 'all' || a.id === 'n/a' || a.id === 'null') !==
                            (b.id === 'all' || b.id === 'n/a' || b.id === 'null')
                        ) {
                            return a.id === 'all' || a.id === 'n/a' || a.id === 'null'
                                ? -1
                                : 1;
                        } else if (a.id === 'all' || a.id === 'n/a' || a.id === 'null') {
                            return 0;
                        } else {
                            const lblA = a.val,
                                lblB = b.val;
                            return lblA || lblB
                                ? !lblA
                                    ? 1
                                    : !lblB
                                        ? -1
                                        : lblA.localeCompare(lblB)
                                : 0;
                        }
                    });
                }
            }
        }
    }

    // tslint:disable-next-line:no-output-on-prefix
    @Output() changed = new EventEmitter<any>();
    // tslint:disable-next-line:no-output-on-prefix
    @Output() clickOpen = new EventEmitter<any>();

    @ViewChild('trigger', {read: ElementRef}) trigger: ElementRef<HTMLElement>;

    @ViewChild('tt', {read: ElementRef})
    set tt(val: ElementRef<HTMLElement>) {
        if (val) {
            requestAnimationFrame(() => {
                if (val && this.trigger) {
                    const elToPos = val.nativeElement,
                        elRelativeTo = this.trigger.nativeElement;
                    elToPos.style.left =
                        elRelativeTo.offsetLeft +
                        Math.trunc(
                            (elRelativeTo.offsetWidth - val.nativeElement.offsetWidth) / 2
                        ) +
                        'px';
                }
            });
        }
    }

    @Input() filter = false;
    itemsFilter: FormControl = new FormControl();
    readonly searchableList = ['val', 'valTranslated'];

    @Input() selectionMode: 'single' | 'multi' = 'multi';
    selectedSingle: { id: any; val: string };

    constructor(
        public translate: TranslateService,
        public userService: UserService,
        public browserService: BrowserService,
        private _element: ElementRef
    ) {
    }

    @HostListener('document:click', ['$event'])
    private onClickOutside($event: any) {
        // console.log('%o', $event);
        const elementRefInPath = BrowserService.pathFrom($event).find(
            (node) => node === this._element.nativeElement
        );
        if (!elementRefInPath) {
            if (this.showPanelDD) {
                this.showPanelDD = false;
            }
        }
    }

    changeSelected(item?: any) {
        console.log(
            'changeSelected(%o) -> %o',
            item,
            item ? item.checked : undefined
        );

        if (this.selectionMode === 'single') {
            if (this.selectedSingle !== item) {
                const dontEmitChange =
                    !!this.selectedSingle && !!item && item.id === this.selectedSingle.id;
                this.selectedSingle = item;
                if (!dontEmitChange) {
                    this.changed.emit({
                        checked: this.selectedSingle ? [this.selectedSingle] : [],
                        type: this.type
                    });
                }
            }
            return;
        }
        const allChecked = this.dataContent.filter(it => it.id !== 'all').every(it => it.checked);
        console.log('allChecked---', allChecked)
        const filterMap: any[] = this.dataContent
            .filter((items) => {
                if (item) {
                    if (item.id === 'all') {
                        if (item.checked) {
                            items.checked = true;
                        } else {
                            items.checked = false;
                        }
                    } else {
                        if (!item.checked) {
                            if (items.id === 'all') {
                                items.checked = false;
                            }
                        } else {
                            if (items.id === 'all' && allChecked) {
                                items.checked = true;
                            }
                        }
                    }
                }
                return items.checked;
            })
            .map((val) => val.id);


        let checked = [];
        if (filterMap.length && filterMap[0] === 'all') {
            checked = null;
        } else if (filterMap.length && filterMap[0] !== 'all') {
            checked = filterMap;
        }
        this.changed.emit({checked: checked, type: this.type});
    }

    containsUncheckedOptions(): boolean {
        if (!this.dataContent || !this.dataContent.length) {
            return false;
        }

        if (this.selectionMode === 'single') {
            return !!this.selectedSingle;
        }

        if (this.dataContent[0].id === 'all') {
            return (
                !this.dataContent[0].checked &&
                this.dataContent.slice(1).some((item) => item.checked === false)
            );
        }
        return this.dataContent.some((item) => item.checked === false);
    }

    togglePanel() {
        if (
            !this.showPanelDD &&
            (!Array.isArray(this.dataContent) || !this.dataContent.length)
        ) {
            return;
        }
        this.showPanelDD = !this.showPanelDD;
        this.clickOpen.emit(this.showPanelDD);

        if (!this.showPanelDD && this.filter && !!this.itemsFilter.value) {
            this.itemsFilter.setValue('');
        }
    }
}
