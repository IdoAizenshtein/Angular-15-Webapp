import {concatMap, map, takeWhile} from 'rxjs/operators';
import {of} from 'rxjs/internal/observable/of';

export const takeWhileInclusive = (predicate) => (source) =>
    source.pipe(
        concatMap((value, i) =>
            predicate(value, i) ? of({value}) : of({value}, {kill: true})
        ),
        takeWhile(({kill}) => !kill),
        map(({value}) => value)
    );
