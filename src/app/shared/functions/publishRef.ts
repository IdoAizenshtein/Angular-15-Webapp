import {Observable, ReplaySubject, share} from 'rxjs';

// Replacement of publishReplay(1) + refCount()
export function publishRef<T>(source$: Observable<T>) {
    const replaySubject = new ReplaySubject<T>(1);
    return source$.pipe(
        share({
            connector: () => replaySubject,
            resetOnError: false,
            resetOnComplete: false,
            resetOnRefCountZero: true
        })
    );
}
