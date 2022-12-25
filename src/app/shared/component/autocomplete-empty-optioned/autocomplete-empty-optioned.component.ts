import {
    AfterContentInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef,
    forwardRef,
    IterableDiffers,
    Renderer2,
    TemplateRef,
    ViewEncapsulation
} from '@angular/core';
import {animate, style, transition, trigger} from '@angular/animations';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {AutoComplete} from 'primeng/autocomplete';
import {ObjectUtils} from 'primeng/utils';
import {OverlayService, PrimeNGConfig} from 'primeng/api';

export const AUTOCOMPLETE_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AutocompleteEmptyOptionedComponent),
    multi: true
};

@Component({
    selector: 'app-autocomplete-empty-optioned',
    templateUrl: './autocomplete-empty-optioned.component.html',
    encapsulation: ViewEncapsulation.None,
    providers: [AUTOCOMPLETE_VALUE_ACCESSOR],
    preserveWhitespaces: false,
    animations: [
        trigger('overlayAnimation', [
            transition(':enter', [
                style({opacity: 0, transform: 'scaleY(0.8)'}),
                animate('{{showTransitionParams}}')
            ]),
            transition(':leave', [
                animate('{{hideTransitionParams}}', style({opacity: 0}))
            ])
        ])
    ],
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: {
        '[class.p-inputwrapper-filled]': 'filled',
        '[class.p-inputwrapper-focus]': '(focus && !disabled) || overlayVisible'
    },
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AutocompleteEmptyOptionedComponent
    extends AutoComplete
    implements AfterContentInit {
    noItemTemplate: TemplateRef<any>;
    public loader = false;
    override overlayVisible: boolean = false;

    constructor(
        public objectUtils: ObjectUtils,
        el: ElementRef,
        renderer: Renderer2,
        cd: ChangeDetectorRef,
        differs: IterableDiffers,
        config: PrimeNGConfig,
        overlayService: OverlayService
    ) {
        super(el, renderer, cd, differs, config, overlayService);
    }

    trackByIndex(index: number, val: any): any {
        return '_' + index;
    }

    override ngAfterContentInit() {
        console.log('ngAfterContentInit');
        this.templates.forEach((item) => {
            switch (item.getType()) {
                case 'item':
                    this.itemTemplate = item.template;
                    break;

                case 'selectedItem':
                    this.selectedItemTemplate = item.template;
                    break;

                case 'empty':
                    this.emptyTemplate = item.template;
                    break;

                default:
                    this.itemTemplate = item.template;
                    break;
            }
        });
    }
}
