import {Observable} from 'rxjs';
import {SafeHtml} from '@angular/platform-browser';

export class PostponedAction {
    action: Observable<any>;
    message: SafeHtml;
    fired?: boolean;
}

export class PostponedMultiAction<T> extends PostponedAction {
    items: Array<T>;
}
