import {
    AfterContentChecked,
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    Output,
    QueryList,
    Renderer2,
    ViewChild,
    ViewChildren,
    ViewEncapsulation
} from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {FilterPipe} from '../../pipes/filter.pipe';
import {SortTextPipe} from '../../pipes/sortText.pipe';
import {Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {BrowserService} from '@app/shared/services/browser.service';
import {TransTypesService} from '@app/core/transTypes.service';
import {SharedService} from '@app/shared/services/shared.service';
import {UserService} from '@app/core/user.service';
import {FilterService, PrimeNGConfig} from 'primeng/api';

@Component({
    selector: 'app-category-select',
    providers: [SortTextPipe],
    templateUrl: './category-select.html',
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
    ]
})
export class CategorySelectComponent implements AfterViewInit, OnDestroy, AfterContentChecked {
    public display = false;
    public autoWidth: any = false;
    public dlgSelectedOption: any = null;
    public dlgMouseOverOption: any = null;
    public dlgEditingOption: any = null;
    public newTransTypeName = new FormControl('', [
        Validators.required,
        Validators.pattern(new RegExp(/\S+/)),
        this.transTypeNameNoDuplicatesValidator.bind(this)
    ]);
    public editTransTypeName = new FormControl('', [
        Validators.required,
        Validators.pattern(new RegExp(/\S+/)),
        this.transTypeNameNoDuplicatesValidator.bind(this)
    ]);
    @Input() originItem: any;
    @Input() disabled: any = false;
    @Input() eventItem: any;
    @Input() companyId: string;
    @Input() labelText: any;
    public filterVal: any = null;
    @Input() placeholder: any;
    @Output() changed = new EventEmitter<any>();
    @Output() cancelChanges = new EventEmitter<any>();
    @Output() focused = new EventEmitter<any>();
    @Input() autoDisplayFirst: any;
    @Input() filter: any;
    @Input() showAuto: any = false;
    @Input() ngModelVal: any = null;
    @Input() style: any;
    @Input() filterBy: any = 'transTypeName';
    @Input() inputId: any;
    private _categories: any[];
    public _categoriesSaved: any[];
    public categoriesView: any[];
    @Input() categoriesAll: any[];
    @Input() categoriesAllForNotAllowToPress: any[];
    public isExistCategory: boolean = false;
    private readonly searchableList: string[] = ['transTypeName'];
    private readonly destroyed$ = new Subject<void>();

    @ViewChild('categoryInputRef') set descInputRef(categoryInputRef: ElementRef) {
        // console.log('setter => descInput: %o,  this.inEditMode: %o', descInput, this.inEditMode);
        if (categoryInputRef) {
            setTimeout(() => {
                categoryInputRef.nativeElement.select();
            });
            // this.bankAccountDetailsTable = $('#bankAccountDetailsTable');
            //     // this.renderer.selectRootElement('#bankAccountDetailsTable').nativeElement;
            // console.log('bankAccountDetailsTable: %o', this.bankAccountDetailsTable);
        }
    }

    @ViewChildren('categoryItems', {read: ElementRef})
    categoryItemsRef: QueryList<ElementRef>;

    @ViewChild('filter') filterRef: ElementRef<HTMLElement>;
    @ViewChild('ddCategories') ddRef: any;

    @Input()
    set categories(vals: any[]) {
        // this._categories = vals;
        // this.options = vals;
        // this.updateView();
        this._categories = Array.isArray(vals)
            ? vals.filter((transtType) => transtType.shonaScreen && !transtType.hide)
            : [];
        // this.options = this._categories;
        this.updateView();
    }

    get categories() {
        return this._categories;
    }

    readonly closeIfScrolledOutside = function (this: any, event) {
        if (!this.overlayVisible) {
            return;
        }
        // console.log('scroll ----> ');
        const pth = BrowserService.pathFrom(event);
        const elementRefInPath =
            pth.includes((this.el.nativeElement as HTMLElement).firstElementChild) ||
            pth.includes(this.itemsWrapperViewChild.nativeElement);
        // debugger;
        if (!elementRefInPath) {
            this.hide();
        }
    }.bind(this);

    @ViewChild('createCategoryInline')
    createCategoryInlineRef: ElementRef<HTMLElement>;

    @Input() showMoreOption = true;
    optionLabel: any;
    dataKey: any;

    constructor(
        public el: ElementRef,
        public renderer: Renderer2,
        public cd: ChangeDetectorRef,
        public filterService: FilterService,
        public zone: NgZone,
        public config: PrimeNGConfig,
        private transTypesService: TransTypesService,
        private filterPipe: FilterPipe,
        public sharedService: SharedService,
        public userService: UserService,
        private sortTextPipe: SortTextPipe
    ) {
        if (!this.filterBy) {
            this.filterBy = 'transTypeName';
        }
        this.optionLabel = 'transTypeName';
        this.dataKey = 'transTypeId';
        this.newTransTypeName.valueChanges
            .pipe(debounceTime(300), takeUntil(this.destroyed$))
            .subscribe((term) => this.updateView());
    }


    private updateView(): void {
        this.categoriesView = this.sortTextPipe.transform(
            this.filterPipe.transform(
                [].concat(this._categories.filter(it => !it.title)),
                this.newTransTypeName && this.newTransTypeName.value
                    ? this.newTransTypeName.value.trim()
                    : '',
                this.searchableList
            ),
            this.searchableList[0]
        );

        this.categoriesView = this.sortTextPipe.transform(
            this.categoriesView,
            'isHistory'
        );
    }

    ngAfterContentChecked() {
        // console.log('')
        this.cd.detectChanges();
    }

    showMore(): void {
        this.resetCategories();
        // console.log('%o', this.el.nativeElement);
        this.display = true;
    }

    update(event): void {
        // console.log('this.selectedOption = %o', this.selectedOption);
        this.display = false;
        this.changed.emit({
            originalEvent: event,
            value: this.dlgSelectedOption
        });
        // console.log('this.selectedOption = %o', this.selectedOption);
    }

    transTypeNameNoDuplicatesValidator(control) {
        if (!this.categories || !control.value) {
            return null;
        }

        const truncatedVal = control.value.replace(/\s\s+/g, ' ').trim();

        // console.log('val "%s", truncated "%s"', control.value, truncatedVal);

        const existingCat = this.categories.find(
            (cat) => cat.transTypeName === truncatedVal
        );
        return existingCat
            ? {
                transTypeNameDuplicate: {
                    transTypeId: existingCat.transTypeId
                }
            }
            : null;
    }

    categoryIdTrack(idx: number, item: any): string {
        return item.transTypeId;
    }

    editStart(option: any): void {
        this.dlgEditingOption = option;
    }

    editCancel(): void {
        this.dlgEditingOption = null;
    }

    editCommit(): void {
        if (this.dlgEditingOption.transTypeName !== this.editTransTypeName.value) {
            const oldValue = Object.assign({}, this.dlgEditingOption);
            const optionCapture = this.dlgEditingOption;
            this.dlgEditingOption.transTypeName = this.editTransTypeName.value
                .replace(/\s\s+/g, ' ')
                .trim();
            this.transTypesService.transTypeUpdate(this.dlgEditingOption).subscribe(
                {
                    next: (rslt) => {
                        console.log('Updated of %o succeeded, %o', optionCapture, rslt);
                        // this.transTypesService.transTypeChangeEvent.next({
                        //     type: 'update',
                        //     value: optionCapture
                        // });
                    },
                    error: (error) => {
                        console.error('Updated of %o failed, %o', optionCapture, error);
                        Object.assign(optionCapture, oldValue);
                        this.updateView();
                    }
                }
            );

            this.updateView();
        }
        this.dlgEditingOption = null;
    }

    filterFunc(event: any, ddCategories: any) {
        this.filterVal = event.filter;
        if (this.categoriesAllForNotAllowToPress) {
            const truncatedVal = this.filterVal.replace(/\s\s+/g, ' ').trim();
            const existingCat = this.categoriesAllForNotAllowToPress.find(
                (cat) => cat.transTypeName === truncatedVal
            );
            this.isExistCategory = !!existingCat;
        }
        // console.log(ddCategories.optionsToDisplay, event.filter, this._categoriesSaved)
        if (event.filter) {
            const categoriesSaved = JSON.parse(JSON.stringify(this._categoriesSaved));
            const categoriesFiltered = categoriesSaved.filter(it => it.transTypeName.includes(this.filterVal));
            const transTypeRegular = categoriesFiltered.filter((it) => !it.isHistory);
            const transTypeHistory = categoriesFiltered.filter((it) => it.isHistory && !it.title);
            if (transTypeHistory.length) {
                transTypeHistory.forEach(v => {
                    v.isLastHistory = false;
                });
                transTypeHistory[transTypeHistory.length - 1].isLastHistory = true;
                transTypeHistory.unshift({
                    isHistory: true,
                    title: true,
                    disabled: true,
                    transTypeName: event.filter,
                    transTypeId: '',
                    shonaScreen: true
                });
                transTypeRegular.unshift(...transTypeHistory);
            }
            // this.categories = transTypeRegular;
            // ddCategories.options = this.categories;
            ddCategories.optionsToDisplay = transTypeRegular;
        } else {
            // this.categories = JSON.parse(JSON.stringify(this._categoriesSaved));
            ddCategories.resetFilter();
            // ddCategories.options = this.categories;
            ddCategories.optionsToDisplay = JSON.parse(JSON.stringify(this._categoriesSaved));
        }
    }

    resetCategories() {
        this.categories = JSON.parse(JSON.stringify(this._categoriesSaved));
    }

    categoryDelete(option: any): void {
        const currIndex = this.categories.indexOf(option);
        if (currIndex >= 0) {
            this.categories.splice(currIndex, 1);
            this.dlgSelectedOption = null;
            this.transTypesService.transTypeDelete(option).subscribe(
                {
                    next: (rslt) => {
                        if (!rslt.error) {
                            console.log('Delete of %o succeeded, %o', option, rslt);
                            if (this.dlgSelectedOption === null) {
                                this.dlgSelectedOption = this.categories
                                    ? this.categories.find(
                                        (tt) =>
                                            tt.transTypeId === 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d'
                                    )
                                    : null;
                                this.updateView();
                                this.scrollActiveIntoViewInList();
                            }

                            // this.transTypesService.transTypeChangeEvent.next({
                            //     type: 'delete',
                            //     value: option
                            // });
                        } else {
                            console.log('Delete of %o failed, %o', option, rslt.error);
                            this.categories.splice(currIndex, 0, option);
                            this.dlgSelectedOption = option;
                            this.updateView();
                            this.newTransTypeName.updateValueAndValidity();
                        }
                    },
                    error: (error) => {
                        console.log('Delete of %o failed, %o', option, error);
                        this.categories.splice(currIndex, 0, option);
                        this.updateView();
                        this.newTransTypeName.updateValueAndValidity();
                    }
                }
            );

            this.updateView();
            this.newTransTypeName.updateValueAndValidity();
        }
    }

    categoryCreate(label: any): void {
        const category = {
            transTypeId: null,
            transTypeName: label.replace(/\s\s+/g, ' ').trim(),
            companyId: this.companyId
        };
        this.transTypesService.transTypeCreate(category)
            .subscribe(
                {
                    next: (rslt) => {
                        category.transTypeId = rslt.body;
                        this.dlgSelectedOption = category;
                        console.log('Creation of %o succeeded, %o', category, rslt);
                        this.categories.push(category);
                        this.newTransTypeName.reset();
                        this.updateView();

                        // this.transTypesService.transTypeChangeEvent.next({
                        //     type: 'create',
                        //     value: category
                        // });

                        this.scrollActiveIntoViewInList();
                    },
                    error: (error) => {
                        console.error('Creation of %o failed, %o', category, error);
                    }
                }
            );
    }

    categoryCreateThenSelect(label: any, evt: Event, ddCategories: any): void {
        // debugger;
        const category = {
            transTypeId: null,
            transTypeName: label.replace(/\s\s+/g, ' ').trim(),
            companyId: this.companyId
        };
        this.transTypesService.transTypeCreate(category).subscribe(
            {
                next: (rslt) => {
                    category.transTypeId = rslt.body;
                    console.log('Creation of %o succeeded, %o', category, rslt);
                    this.categories.push(category);
                    this.ngModelVal = category;
                    ddCategories.resetFilter();
                    // ddCategories.options = this.categories;
                    ddCategories.optionsToDisplay = this.categories;
                    this.changed.emit({
                        originalEvent: new Event('custom'),
                        value: category
                    });
                    this.hide();
                },
                error: (error) => {
                    console.error('Creation of %o failed, %o', category, error);
                }
            }
        );
    }


    private scrollActiveIntoViewInList(): void {
        setTimeout(() => {
            // console.log('this.categoryItemsRef =====> %o', this.categoryItemsRef);
            const activeElRef = this.categoryItemsRef.find((el) => {
                return el.nativeElement.classList.contains('active');
            });
            // console.log('activeElRef ==> %o', activeElRef);
            if (activeElRef) {
                activeElRef.nativeElement.scrollIntoView();
            }
        });
    }

    ngAfterViewInit(): void {
        this.filter = true;
        this.filterBy = 'transTypeName';
        if (this.showAuto) {
            this.ddRef.show();
        }
        // document.addEventListener('scroll', this.closeIfScrolledOutside, true);
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
        // document.removeEventListener('scroll', this.closeIfScrolledOutside, true);
    }

    show(): void {
        this.categories = this.categories.filter((it) => !it.isHistory);
        this._categoriesSaved = JSON.parse(JSON.stringify(this.categories));
        this.sharedService
            .transTypeHistory({
                uuid: this.userService.appData.userData.companySelect.companyId
            })
            .subscribe((response: any) => {
                const transTypeHistory = response ? response['body'] : response;
                // companyId: "00000000-0000-0000-0000-000000000000"
                // createDefaultSupplier: false
                // iconType: "Insurance"
                // shonaScreen: true
                // transTypeId: "8a588d2a-c88d-465c-a2a0-97ae9a38d888"
                // transTypeModifiedDate: 1647855248000
                // transTypeName: "ביטוחים"
                this.categories = this.categories.filter((it) => !it.isHistory);
                if (transTypeHistory.length) {
                    transTypeHistory.forEach((item, idx) => {
                        item.isHistory = true;
                    });
                    transTypeHistory[transTypeHistory.length - 1].isLastHistory = true;
                    transTypeHistory.unshift({
                        isHistory: true,
                        title: true,
                        disabled: true,
                        transTypeName: '',
                        transTypeId: '',
                        shonaScreen: true
                    });
                    this.categories.unshift(...transTypeHistory);
                }
                this._categoriesSaved = JSON.parse(JSON.stringify(this.categories));
                this.updateView();
            });

        document.addEventListener('scroll', this.closeIfScrolledOutside, true);

        requestAnimationFrame(() => {
            if (this.filter) {
                this.isExistCategory = false;
            }
        });
    }

    hide(): void {
        document.removeEventListener('scroll', this.closeIfScrolledOutside, true);
    }
}
