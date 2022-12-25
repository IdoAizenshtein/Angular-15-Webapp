import {Injectable} from '@angular/core';
import {PreloadingStrategy, Route} from '@angular/router';
import {Observable, of} from 'rxjs';

@Injectable()
export class NetworkAwarePreloadingStrategyService implements PreloadingStrategy {
    public preloadedModules: string[] = [];

    preload(route: Route, load: () => Observable<any>): Observable<any> {
        const connection = navigator['connection'];
        // console.log('connection: ', connection)
        if (connection.saveData) {
            return of(null);
        }
        const speed = connection.effectiveType;
        const slowConnections = ['slow-2g', '2g'];
        // console.log('speed: ', speed)
        if (slowConnections.includes(speed)) {
            return of(null);
        }
        // if (route.data && route.data['preload']) {
        //     this.preloadedModules.push(route.path);
        //     // console.log('Preloaded: ' + route.path);
        //     return load();
        // } else {
        //     return of(null);
        // }
        this.preloadedModules.push(route.path);
        // console.log('Preloaded: ' + route.path);
        return load();
    }
}
