import {Paginator} from 'primeng/paginator';
import {Component, ViewEncapsulation} from '@angular/core';

@Component({
    selector: 'app-paginator',
    templateUrl: './paginator.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
    // ,
    // animations: [
    //   trigger('dialogState', [
    //     state('hidden', style({
    //       opacity: 0
    //     })),
    //     state('visible', style({
    //       opacity: 1
    //     })),
    //     transition('visible => hidden', animate('400ms ease-in')),
    //     transition('hidden => visible', animate('400ms ease-out'))
    //   ])
    // ]
})
export class PaginatorComponent extends Paginator {
}
