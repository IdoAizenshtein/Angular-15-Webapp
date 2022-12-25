import {
    ChangeDetectorRef,
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    forwardRef,
    NgZone,
    OnInit,
    Renderer2,
    ViewEncapsulation
} from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {Calendar} from 'primeng/calendar';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {UserService} from '@app/core/user.service';
import {OverlayService, PrimeNGConfig} from 'primeng/api';

export const CALENDAR_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CalendarWrapComponent),
    multi: true
};

@Component({
    selector: 'app-calendar-wrap',
    templateUrl: './calendar-wrap.component.html',
    preserveWhitespaces: false,
    animations: [
        trigger('overlayAnimation', [
            state(
                'visibleTouchUI',
                style({
                    transform: 'translate(-50%,-50%)',
                    opacity: 1
                })
            ),
            transition('void => visible', [style({ opacity: 0, transform: 'scaleY(0.8)' }), animate('{{showTransitionParams}}', style({ opacity: 1, transform: '*' }))]),
            transition('visible => void', [animate('{{hideTransitionParams}}', style({ opacity: 0 }))]),
            transition('void => visibleTouchUI', [style({ opacity: 0, transform: 'translate3d(-50%, -40%, 0) scale(0.9)' }), animate('{{showTransitionParams}}')]),
            transition('visibleTouchUI => void', [
                animate(
                    '{{hideTransitionParams}}',
                    style({
                        opacity: 0,
                        transform: 'translate3d(-50%, -40%, 0) scale(0.9)'
                    })
                )
            ])
        ])
    ],
    host: {
        class: 'p-element p-inputwrapper',
        '[class.p-inputwrapper-filled]': 'filled',
        '[class.p-inputwrapper-focus]': 'focus',
        '[class.p-calendar-clearable]': 'showClear && !disabled'
    },
    providers: [CALENDAR_VALUE_ACCESSOR],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class CalendarWrapComponent extends Calendar implements OnInit {
    mayGoNextMonth: boolean | undefined;
    mayGoPrevMonth: boolean | undefined;

    constructor(
        el: ElementRef,
        renderer: Renderer2,
        cd: ChangeDetectorRef,
        zone: NgZone,
        config: PrimeNGConfig,
        overlayService: OverlayService,
        public userService: UserService
    ) {
        super(el, renderer, cd, zone, config, overlayService);
    }

    override ngOnInit(): void {
        super.ngOnInit();
    }
    clientHeightChild(elem:any){
        return elem.children && elem.children.length ? elem.children[0].clientHeight : 345;
    }
    override createMonths(month: number, year: number): void {
        super.createMonths(month, year);

        this.mayGoPrevMonth =
            !year || !this.minDate
                ? true
                : this.userService.appData
                    .moment([year, month, 1])
                    .subtract(1, 'month')
                    .isSameOrAfter(
                        this.userService.appData.moment(this.minDate),
                        'month'
                    );
        this.mayGoNextMonth =
            !year || !this.maxDate
                ? true
                : this.userService.appData
                    .moment([year, month, 1])
                    .add(1, 'month')
                    .isSameOrBefore(
                        this.userService.appData.moment(this.maxDate),
                        'month'
                    );
    }
}
