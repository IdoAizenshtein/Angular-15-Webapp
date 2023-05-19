import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    forwardRef,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    TemplateRef,
    ViewEncapsulation
} from '@angular/core';
import {animate, AnimationEvent, state, style, transition, trigger} from '@angular/animations';
import {Dropdown} from 'primeng/dropdown';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {FilterService, PrimeNGConfig, SelectItem} from 'primeng/api';
import {DomHandler} from 'primeng/dom';
import {ObjectUtils} from 'primeng/utils';
import {Subscription} from 'rxjs';

@Component({
    selector: 'p-dropdownItem',
    template: `
        <li
                (click)="onOptionClick($event)"
                role="option"
                pRipple
                [attr.aria-label]="label"
                [attr.aria-selected]="selected"
                [ngStyle]="{ height: itemSize + 'px' }"
                [id]="selected ? 'p-highlighted-option' : ''"
                [ngClass]="{ 'p-dropdown-item': true, 'p-highlight': selected, 'p-disabled': disabled }"
        >
            <span *ngIf="!template">{{ label ?? 'empty' }}</span>
            <ng-container *ngTemplateOutlet="template; context: { $implicit: option }"></ng-container>
        </li>
    `,
    host: {
        class: 'p-element'
    }
})
export class DropdownItem {
    @Input() option: SelectItem;

    @Input() selected: boolean;
    _label: string;

    @Input() label: string;

    @Input() disabled: boolean;

    @Input() visible: boolean;

    @Input() itemSize: number;

    @Input() template: TemplateRef<any>;

    @Output() onClick: EventEmitter<any> = new EventEmitter();

    onOptionClick(event: Event) {
        this.onClick.emit({
            originalEvent: event,
            option: this.option
        });
    }
}


export const DROPDOWN_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DropdownWrapComponent),
    multi: true
};

@Component({
    selector: 'app-dropdown-wrap',
    templateUrl: './dropdown-wrap.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [
        trigger('panelState', [
            state(
                'hidden',
                style({
                    opacity: 0
                })
            ),
            state(
                'visible',
                style({
                    opacity: 1
                })
            ),
            transition('visible => hidden', animate('400ms ease-in')),
            transition('hidden => visible', animate('400ms ease-out'))
        ])
    ],
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: {
        class: 'p-element p-inputwrapper',
        '[class.p-inputwrapper-filled]': 'filled',
        '[class.p-inputwrapper-focus]': 'focused || overlayVisible'
    },
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [DomHandler, ObjectUtils, DROPDOWN_VALUE_ACCESSOR]
})
export class DropdownWrapComponent extends Dropdown implements OnInit, OnDestroy {

    @Input() isVirtual: boolean = false;
    @Input() highlight: any = false;

    @Input() addCardManually: any = false;
    @Output() addCardManuallyFunc = new EventEmitter<any>();


    scrollSubscription = Subscription.EMPTY;
    virtualScrollSaved: any = null;
    scrollHeightAuto: any;
    addManually: boolean = false;

    constructor(public override el: ElementRef, public override renderer: Renderer2, public override cd: ChangeDetectorRef, public override zone: NgZone, public override filterService: FilterService, public override config: PrimeNGConfig) {
        super(el, renderer, cd, zone, filterService, config);
    }

    override ngOnInit() {
        this.scrollHeightAuto = Number(this.scrollHeight.replace('px', ''));
        super.ngOnInit();
    }

    @Input()
    override get options(): any[] {
        return this._options;
    }

    override set options(val: any[]) {
        if (val && val.length) {
            for (const item of val) {
                item['randomUUID'] = crypto['randomUUID']();
            }
        }
        this._options = val;
        this.optionsToDisplay = this._options;
        this.updateSelectedOption(this.value);

        this.selectedOption = this.findOption(this.value, this.optionsToDisplay);
        if (!this.selectedOption && ObjectUtils.isNotEmpty(this.value) && !this.editable) {
            this.value = null;
            this.onModelChange(this.value);
        }

        this.optionsChanged = true;

        if (this._filterValue && this._filterValue.length) {
            this.activateFilter();
        }
    }

    trackById(idx: number, item: any) {
        return item.randomUUID ? item.randomUUID : idx;
    }

    onScroll(scrollbarRef: any, virtualScroll?: any) {
        if (virtualScroll) {
            this.virtualScrollSaved = virtualScroll;
        } else {
            this.virtualScrollSaved = null;
        }
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
        this.scrollSubscription = scrollbarRef.scrolled.subscribe(e => {
            this.onScrollCubes();
        });
    }

    onScrollCubes(i?: number): void {

    }

    override onFilterInputChange(event): void {
        let inputValue = event.target.value;
        if (inputValue) {
            inputValue = inputValue.toString().trimStart();
        }
        if (inputValue && inputValue.length) {
            this._filterValue = inputValue;
            this.activateFilter();
        } else {
            this._filterValue = null;
            this.optionsToDisplay = this.options;
        }

        if (this.virtualScroll) {
            this.virtualScrollSaved.scrollTo({top: 0});
        }
        if (this.addCardManually && inputValue && inputValue.length && this.optionsToDisplay.length && this.optionsToDisplay.every(it => it.custId !== (inputValue))) {
            this.addManually = true;
        } else {
            this.addManually = false;
        }

        this.optionsChanged = true;
        this.onFilter.emit({originalEvent: event, filter: this._filterValue});
    }

    override onOverlayAnimationStart(event: AnimationEvent) {
        if (event.toState === 'visible') {
            this.itemsWrapper = DomHandler.findSingle(this.overlayViewChild.overlayViewChild.nativeElement, this.virtualScroll ? '.p-dropdown-items-wrapper' : '.p-dropdown-items-wrapper');
            // this.virtualScroll && this.scroller.setContentEl(this.itemsViewChild.nativeElement);

            if (this.options && this.options.length) {
                if (this.virtualScroll) {
                    const selectedIndex = this.selectedOption ? this.findOptionIndex(this.getOptionValue(this.selectedOption), this.optionsToDisplay) : -1;
                    if (selectedIndex !== -1) {
                        this.virtualScrollSaved.scrollToIndex(selectedIndex);
                    }
                } else {
                    let selectedListItem = DomHandler.findSingle(this.itemsWrapper, '.p-dropdown-item.p-highlight');

                    if (selectedListItem) {
                        selectedListItem.scrollIntoView({block: 'nearest', inline: 'center'});
                    }
                }
            }

            if (this.filterViewChild && this.filterViewChild.nativeElement) {
                this.preventModelTouched = true;

                if (this.autofocusFilter) {
                    this.filterViewChild.nativeElement.focus();
                }
            }

            this.onShow.emit(event);
        }
        if (event.toState === 'void') {
            this.itemsWrapper = null;
            this.onModelTouched();
            this.onHide.emit(event);
        }
    }

    ngOnDestroy() {
        if (this.scrollSubscription) {
            this.scrollSubscription.unsubscribe();
        }
    }
}
