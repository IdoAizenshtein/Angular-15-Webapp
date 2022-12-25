import {Component, forwardRef, OnInit, ViewEncapsulation} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {DomHandler} from 'primeng/dom';

import {Dropdown} from 'primeng/dropdown';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {ObjectUtils} from 'primeng/utils';

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
        '[class.p-inputwrapper-filled]': 'filled',
        '[class.p-inputwrapper-focus]': 'focused'
    },
    providers: [DomHandler, ObjectUtils, DROPDOWN_VALUE_ACCESSOR]
})
export class DropdownWrapComponent extends Dropdown implements OnInit {
    public autoWidth: any = false;
}
