import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    OnInit,
    Output,
    Renderer2,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {SortTextPipe} from '../../../pipes/sortText.pipe';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {OverlayPanel} from 'primeng/overlaypanel';
import {RestCommonService} from '@app/shared/services/restCommon.service';
import {Beneficiary, BeneficiaryService} from '@app/core/beneficiary.service';
import {take} from 'rxjs/operators';
import {Subject} from 'rxjs';
import {StorageService} from '@app/shared/services/storage.service';
import {FilterService, PrimeNGConfig} from 'primeng/api';

@Component({
    selector: 'app-beneficiary-select',
    providers: [
        SortTextPipe
    ],
    templateUrl: './beneficiary-select.component.html',
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
export class BeneficiarySelectComponent
    implements OnInit, OnDestroy, AfterViewInit {
    private readonly destroyed$ = new Subject<void>();
    public autoWidth: any = false;
    public filterVal: any = null;
    @Input() placeholder: any;
    @Output() changed = new EventEmitter<any>();
    @Output() cancelChanges = new EventEmitter<any>();
    @Input() autoDisplayFirst: any = false;
    filter: any = true;
    @Input() showAuto: any = false;
    @Input() ngModelVal: any = null;
    @Input() style: any = '';
    @Input() disabled: any = false;
    @Input() inputId: any;
    public categories: any[];
    public _categoriesSaved: any[];
    @ViewChild('ddCategories') ddRef: any;


    readonly beneficiaryCreateOrEditPrompt: {
        visible: boolean;
        create: () => void;
        edit: (item: any) => void;
        apply: () => void;
    };

    @ViewChild('createBeneficiaryInline') createBeneficiaryInlineRef:
        | ElementRef<HTMLElement>
        | undefined;

    @Input() createWith:
        | {
        companyAccountId: string;
        paymentDesc: string;
    }
        | undefined;

    @Input() showGuide = true;
    @Input() showBtnAddBeneficiary = true;
    public loaderData: boolean = true;

    @ViewChild('beneficiarySelectionGuideOvP', {read: OverlayPanel})
    beneficiarySelectionGuideOvP: OverlayPanel;
    readonly beneficiarySelectionGuide: { stopIt: boolean };

    createWithExtended: any
    dataDone: any = false;

    private _exclusions: Array<Beneficiary | string> = [];
    @Input() set exclusions(val: Array<Beneficiary | string>) {
        this._exclusions = val || [];
        this.beneficiaryIdsToExclude = this._exclusions.map((item) =>
            typeof item === 'string' ? item : item.biziboxMutavId
        );
    }

    get exclusions(): Array<Beneficiary | string> {
        return this._exclusions;
    }

    beneficiaryIdsToExclude: Array<string> = [];

    private observer: IntersectionObserver | undefined;
    @Output() creationSuccess = new EventEmitter<{
        accountMutavId: string;
        biziboxMutavId: string;
    }>();

    constructor(
        public el: ElementRef,
        public renderer: Renderer2,
        public cd: ChangeDetectorRef,
        public filterService: FilterService,
        public zone: NgZone,
        private restCommonService: RestCommonService,
        private beneficiaryService: BeneficiaryService,
        public config: PrimeNGConfig,
        private storageService: StorageService
    ) {
        this.loaderData = true;
        this.beneficiaryCreateOrEditPrompt = {
            visible: false,
            create: () => {
                this.createWithExtended = <any>Object.assign(
                    {
                        accountMutavName:
                            this.filterVal
                                ? this.filterVal
                                : ''
                    },
                    this.createWith || {}
                );
                this.beneficiaryCreateOrEditPrompt.visible = true;
            },
            edit: (item) => {
                this.createWithExtended = <any>(
                    Object.assign(item, this.createWith || {})
                );
                this.beneficiaryCreateOrEditPrompt.visible = true;
            },
            apply: () => {
                this.beneficiaryCreateOrEditPrompt.visible = false;
            }
        };
        this.beneficiarySelectionGuide = {
            stopIt:
                this.storageService.localStorageGetterItem(
                    'beneficiarySelectionGuide.display'
                ) === 'false'
        };
    }

    filterFunc(event: any, ddCategories: any) {
        this.filterVal = event.filter;
        // console.log(ddCategories.optionsToDisplay, event.filter, this._categoriesSaved)
        // if (event.filter) {
        //     const categoriesSaved = JSON.parse(JSON.stringify(this._categoriesSaved));
        //     const categoriesFiltered = categoriesSaved.filter(it => it.label.includes(this.filterVal));
        //     this.categories = categoriesFiltered;
        //     ddCategories.options = this.categories;
        //     ddCategories.optionsToDisplay = this.categories;
        // } else {
        //     this.categories = JSON.parse(JSON.stringify(this._categoriesSaved));
        //     ddCategories.resetFilter();
        //     ddCategories.options = this.categories;
        //     ddCategories.optionsToDisplay = this.categories;
        // }
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();

        if (
            this.beneficiarySelectionGuideOvP &&
            this.beneficiarySelectionGuideOvP.overlayVisible
        ) {
            this.beneficiarySelectionGuideOvP.hide();
        }
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    show() {
        if (!this.dataDone) {
            // this.loadOptions();
        }
    }

    loadOptions(idToSelect?: string) {
        this.categories = [{
            label: '',
            value: ''
        }, {
            label: '',
            value: ''
        }, {
            label: '',
            value: ''
        }, {
            label: '',
            value: ''
        }, {
            label: '',
            value: ''
        }, {
            label: '',
            value: ''
        }, {
            label: '',
            value: ''
        }];
        this.loaderData = true;
        this.beneficiaryService.selectedCompanyBeneficiaries
            .pipe(take(1))
            .subscribe((response: any) => {
                this._categoriesSaved = response
                    // .filter(bnfcry => {
                    //     if (!Array.isArray(this.exclusions) || !this.exclusions.length) {
                    //         return true;
                    //     }
                    //     return (this.value && this.value.biziboxMutavId === bnfcry.biziboxMutavId)
                    //         || (!!idToSelect && bnfcry.biziboxMutavId === idToSelect)
                    //         || !this.exclusions.some(excl => {
                    //             return bnfcry.biziboxMutavId === ((typeof excl === 'string') ? excl : excl.biziboxMutavId);
                    //         });
                    // })
                    .map((bnfcry) => {
                        return {
                            label: bnfcry.accountMutavName,
                            value: bnfcry
                        };
                    }).filter(option => (this.ngModelVal && this.ngModelVal.biziboxMutavId === option.value.biziboxMutavId) || !this.beneficiaryIdsToExclude.includes(option.value.biziboxMutavId));

                this.categories = JSON.parse(JSON.stringify(this._categoriesSaved));
                let itemToSelect = null;
                if (idToSelect) {
                    itemToSelect = this._categoriesSaved.find(
                        (bnfcry) => bnfcry.value.biziboxMutavId === idToSelect
                    );
                } else if (this.ngModelVal) {
                    const idToFind =
                        typeof this.ngModelVal === 'string'
                            ? this.ngModelVal
                            : this.ngModelVal.biziboxMutavId;
                    itemToSelect = this._categoriesSaved.find(
                        (bnfcry) => bnfcry.value.biziboxMutavId === idToFind
                    );
                }

                if (itemToSelect) {
                    this.ngModelVal = itemToSelect.value;
                }
                // if (!!this.value !== !!idToSelect || (this.value && this.value.biziboxMutavId !== idToSelect)) {
                //     super.selectItem(null, !!idToSelect
                //         ? this.options.find(bnfcry => bnfcry.value.biziboxMutavId === idToSelect)
                //         : null);
                // }
                this.loaderData = false;
                this.dataDone = true;
            });
    }

    beneficiaryCreateThenSelect(value: string, $event: MouseEvent) {
        this.beneficiaryCreateOrEditPrompt.create();
        $event.stopPropagation();
    }

    ngAfterViewInit(): void {
        this.loadOptions();
        if (!this.beneficiarySelectionGuide.stopIt) {
            this.observer = new IntersectionObserver(
                (entries: any[]) => {
                    if (
                        entries &&
                        entries.length &&
                        entries[entries.length - 1].isIntersecting &&
                        !this.beneficiarySelectionGuide.stopIt &&
                        this.showGuide &&
                        !this.disabled
                    ) {
                        requestAnimationFrame(() =>
                        setTimeout(()=>{
                            this.beneficiarySelectionGuideOvP.show(
                                new Event('custom'),
                                this.el.nativeElement
                            )
                        },100)
                        );
                    } else if (
                        this.beneficiarySelectionGuideOvP &&
                        this.beneficiarySelectionGuideOvP.overlayVisible
                    ) {
                        this.beneficiarySelectionGuideOvP.hide();
                    }
                },
                {threshold: 1}
            );
            this.observer.observe(this.el.nativeElement);
        }
        if (this.showAuto) {
            this.ddRef.show();
        }
    }


    onCreationSuccess($event: {
        accountMutavId: string;
        biziboxMutavId: string;
    }) {
        this.loadOptions($event.biziboxMutavId);
        this.creationSuccess.next($event);
    }

    onBeneficiarySelectionGuideHide(): void {
        if (this.beneficiarySelectionGuide.stopIt) {
            this.storageService.localStorageSetter(
                'beneficiarySelectionGuide.display',
                'false'
            );
        }
    }

    edit(option: any, $event: MouseEvent) {
        console.log('edit called ==> %o', option);
        this.beneficiaryCreateOrEditPrompt.edit(option.value);
        $event.stopPropagation();
    }

}
