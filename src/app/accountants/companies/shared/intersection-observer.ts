import {Observable} from 'rxjs/internal/Observable';

const hasSupport = 'IntersectionObserver' in window;

export function inView(
    element: Element,
    options: IntersectionObserverInit = {
        root: null,
        threshold: 0.5
    }
) {
    return new Observable((subscriber) => {
        if (!hasSupport) {
            subscriber.next(true);
            subscriber.complete();
        }

        const observer = new IntersectionObserver(([entry]) => {
            subscriber.next(entry.isIntersecting);
        }, options);

        observer.observe(element);

        return () => observer.disconnect();
    });
}
