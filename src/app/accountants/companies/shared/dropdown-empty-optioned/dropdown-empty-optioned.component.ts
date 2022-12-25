import {
    AfterContentInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    forwardRef,
    Input,
    NgZone,
    OnInit,
    Output,
    Renderer2,
    TemplateRef,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {Dropdown} from 'primeng/dropdown';
import {FilterService, PrimeNGConfig} from 'primeng/api';

export const DROPDOWN_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DropdownEmptyOptionedComponent),
    multi: true
};

@Component({
    selector: 'app-dropdown-empty-optioned',
    templateUrl: './dropdown-empty-optioned.component.html',
    encapsulation: ViewEncapsulation.None,
    providers: [DROPDOWN_VALUE_ACCESSOR],
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
    ]
})
export class DropdownEmptyOptionedComponent
    extends Dropdown
    implements AfterContentInit, OnInit {
    noItemTemplate: TemplateRef<any>;
    titleTemplate: TemplateRef<any>;
    topContentTemplate: TemplateRef<any>;
    bottomContentTemplate: TemplateRef<any>;
    public autoWidth: any = false;

    @Input() isVirtual: boolean = false;
    @Input() isTransTypeCode: boolean = false;
    @Input() isAllTheOptions: boolean = false;
    @Input() hideTemplateOpt: boolean = false;
    @Input() isDDCards: boolean = false;

    public ddOthers: any = false;

    public currentPage: number = 0;
    public entryLimit: number = 100;
    public loader = false;
    @ViewChild('scrollContainer') scrollContainer: ElementRef;
    @Output() refresh = new EventEmitter<any>();
    @Output() hideOutput = new EventEmitter<any>();
    @Output() opened = new EventEmitter<any>();

    constructor(
        public override el: ElementRef,
        public override renderer: Renderer2,
        public override cd: ChangeDetectorRef,
        public override filterService: FilterService,
        public override zone: NgZone,
        public override config: PrimeNGConfig
    ) {
        super(el, renderer, cd, zone, filterService, config);
    }

    get isExistLengOfHistory() {
        const isExistLeng =
            (!this.filter &&
                this.options &&
                this.options.some((it) => it.value.isHistory)) ||
            (this.filter &&
                this.optionsToDisplay &&
                this.optionsToDisplay.some((it) => it.value.isHistory));
        return isExistLeng;
    }

    isShowAddItemTemp() {
        if (!this.isDDCards) {
            return false;
        } else {
            const filter =
                this.filterValue !== null && this.filterValue !== undefined;
            if (filter && this.optionsToDisplay && this.optionsToDisplay.length) {
                const isExistEqual = this.optionsToDisplay.find(
                    (it) => it.value && it.value.custId === this.filterValue
                );
                if (isExistEqual) {
                    return false;
                } else {
                    return true;
                }
            }
            if (filter && this.optionsToDisplay && !this.optionsToDisplay.length) {
                return true;
            }
            if (
                (filter && !this.optionsToDisplay) ||
                (this.optionsToDisplay && !this.optionsToDisplay.length)
            ) {
                return true;
            }
            return false;
        }
    }

    onScroll(event: any): void {
        if (event.target.scrollTop === 0 && this.currentPage !== 0) {
            console.log('scrollOnTheTop');
            // this.loader = true;
            // this.scrollContainer.nativeElement.scrollTop = 0;
            this.currentPage--;
            console.log('this.currentPage', this.currentPage);
            // setTimeout(() => {
            //     this.loader = false;
            // }, 200);
        }

        if (
            event.target.scrollTop + event.target.clientHeight >=
            event.target.scrollHeight - 1
        ) {
            console.log('scrollOnTheBottom');
            if (
                this.options &&
                this.options.length > this.entryLimit &&
                this.options.length / ((this.currentPage + 1) * this.entryLimit) >= 0
            ) {
                // this.loader = true;
                // this.scrollContainer.nativeElement.scrollTop = 0;
                this.currentPage++;
                console.log('this.currentPage', this.currentPage);
                this.entryLimit += 100;
                // setTimeout(() => {
                //     this.loader = false;
                // }, 200);
            }
        }
    }

    putStyle() {
        console.log('putStyle');
        // this.currentPage = 0;
        // this.entryLimit = 100;
        setTimeout(() => {
            // this.scrollContainer.nativeElement.scrollTop = 0;
            const containerRect = this.containerViewChild.nativeElement.getBoundingClientRect();
            const panelRect = this.panel.getBoundingClientRect();
            const fixedPanelLeft = containerRect.right - panelRect.width;
            if (fixedPanelLeft >= 0) {
                this.panel.style.left = containerRect.right - panelRect.width + 'px';
            }
            if (this.panel.offsetTop < 0) {
                this.panel.style.marginTop = '2px';
                this.panel.style.borderTopLeftRadius =
                    this.panel.style.borderTopRightRadius = '3px';
            }
        }, 50);
    }

    hideTemplate(curr: any, value: any) {
        if (this.isTransTypeCode) {
            if (curr.label === 'ללא' && value.transTypeName === null) {
                return true;
            }
        } else {
            if (curr.label === '' && value === null) {
                return true;
            }
        }

        return false;
    }

    isFirstHistory(idx: number, selectedOption: any): boolean {
        let indexFirst;
        if (this.optionsToDisplay) {
            indexFirst = this.optionsToDisplay.findIndex(
                (it) =>
                    it.value.isHistory &&
                    (!selectedOption ||
                        (selectedOption && !selectedOption.transTypeCode) ||
                        (selectedOption &&
                            selectedOption.transTypeCode &&
                            it.value.transTypeCode !== selectedOption.transTypeCode))
            );
        }
        return indexFirst === idx;
    }

    override search() {
        this.currentPage = 0;
        this.entryLimit = 100;
    }

    trackByIndex(index: number, val: any): any {
        return '_' + index;
    }

    override show(): any {
        this.currentPage = 0;
        this.entryLimit = 100;
        this.opened.emit(true);
        console.log('onShow');
        super.show();

        setTimeout(() => {
            this.scrollContainer.nativeElement.scrollTop = 0;
            const containerRect = this.containerViewChild.nativeElement.getBoundingClientRect();
            const panelRect = this.panel.getBoundingClientRect();
            const fixedPanelLeft = containerRect.right - panelRect.width;
            if (fixedPanelLeft >= 0) {
                this.panel.style.left = containerRect.right - panelRect.width + 'px';
            }
            if (this.panel.offsetTop < 0) {
                this.panel.style.marginTop = '2px';
                this.panel.style.borderTopLeftRadius =
                    this.panel.style.borderTopRightRadius = '3px';
            }
        }, 10);
    }

    // show() {
    //     this.currentPage = 0;
    //     this.entryLimit = 100;
    //     console.log('show');
    //     super.show();
    // }

    // alignPanel() {
    //     // console.log('alignPanel')
    //     // if(this.isAllTheOptions){
    //     //     return
    //     // }
    //     super.alignPanel();
    //     this.currentPage = 0;
    //     this.entryLimit = 100;
    //     this.scrollContainer.nativeElement.scrollTop = 0;
    //     const containerRect = this.container.getBoundingClientRect();
    //     const panelRect = this.panel.getBoundingClientRect();
    //     const fixedPanelLeft = containerRect.right - panelRect.width;
    //     if (fixedPanelLeft >= 0) {
    //         this.panel.style.left = (containerRect.right - panelRect.width) + 'px';
    //     }
    //     if (this.panel.offsetTop < 0) {
    //         this.panel.style.marginTop = '2px';
    //         this.panel.style.borderTopLeftRadius = this.panel.style.borderTopRightRadius = '3px';
    //     }
    //     // this.refresh.emit(true);
    // }

    override hide(): void {
        console.log('hide');
        this.hideOutput.emit(true);
        super.hide();
    }

    override ngAfterContentInit() {
        console.log('ngAfterContentInit');

        // super.ngAfterContentInit();
        // this.noItemTemplate = this.templates.find(item => item.getType() === 'noItem');
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'item':
                    this.itemTemplate = item.template;
                    break;

                case 'selectedItem':
                    this.selectedItemTemplate = item.template;
                    break;

                case 'group':
                    this.groupTemplate = item.template;
                    break;

                case 'title':
                    this.titleTemplate = item.template;
                    break;
                case 'topContent':
                    this.topContentTemplate = item.template;
                    break;
                case 'bottomContent':
                    this.bottomContentTemplate = item.template;
                    break;
                case 'noItem':
                    this.noItemTemplate = item.template;
                    break;

                default:
                    this.itemTemplate = item.template;
                    break;
            }
        });
    }
}
