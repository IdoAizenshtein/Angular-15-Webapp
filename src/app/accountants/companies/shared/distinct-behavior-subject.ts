import {BehaviorSubject} from 'rxjs';

export class DistinctBehaviorSubject<T> extends BehaviorSubject<T> {
    override next(value: T): void {
        if (value !== this.value) {
            super.next(value);
        }
    }
}
