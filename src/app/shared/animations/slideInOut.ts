import {animate, state, style, transition, trigger} from '@angular/animations';

export const slideInOut = trigger('slideInOutDD', [
    state(
        '*',
        style({
            transform: 'translateX(0)',
            opacity: 1
        })
    ),
    transition(':enter', [
        style({transform: 'translateY(-5%)'}),
        animate(
            '150ms ease-in',
            style({transform: 'translateY(0%)', opacity: '1'})
        )
    ]),
    transition(':leave', [
        animate(
            '150ms ease-in',
            style({transform: 'translateY(-5%)', height: '0px', opacity: '0'})
        )
    ])
]);

export const slideInUp = trigger('slideInUpDD', [
    state(
        '*',
        style({
            transform: 'translateX(0)',
            opacity: 1
        })
    ),
    transition(':enter', [
        style({transform: 'translateY(-5%)'}),
        animate(
            '150ms ease-in',
            style({transform: 'translateY(0%)', opacity: '1'})
        )
    ]),
    transition(':leave', [
        animate(
            '150ms ease-in',
            style({transform: 'translateY(5%)', height: '0px', opacity: '0'})
        )
    ])
]);
