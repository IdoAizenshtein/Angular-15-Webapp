import {SharedComponent} from '@app/shared/component/shared.component';
import {Subscription} from 'rxjs';

export class ReloadServices {
    public subscriptionReload: Subscription;

    constructor(public sharedComponent: SharedComponent) {
        if (this.subscriptionReload) {
            this.subscriptionReload.unsubscribe();
        }
        this.subscriptionReload = this.sharedComponent.reloadEvent.subscribe(() => {
            this.reload();
        });
    }

    reload() {
        console.log('reload parent');
    }

    destroy() {
        if (this.subscriptionReload) {
            this.subscriptionReload.unsubscribe();
        }
    }
}
