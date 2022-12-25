import {Component, ViewEncapsulation} from '@angular/core';
import {ActivatedRoute, Router, UrlSegment, UrlSegmentGroup, UrlTree} from '@angular/router';
import {FormBuilder} from '@angular/forms';
import {MatLegacySnackBar as MatSnackBar} from '@angular/material/legacy-snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {HttpErrorResponse} from '@angular/common/http';
import {Location} from '@angular/common';
import {ErpService} from '../erp.service';

@Component({
    templateUrl: './remove-from-list.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class RemoveFromListComponent {
    alertText: string = 'הבקשה בעיבוד...';

    constructor(
        public translate: TranslateService,
        public location: Location,
        public router: Router,
        private erpService: ErpService,
        private _fb: FormBuilder,
        public snackBar: MatSnackBar,
        private route: ActivatedRoute
    ) {
        const queryParams: string = this.route.snapshot.queryParams['mail'];
        if (queryParams) {
            this.router.navigate(['.'], {relativeTo: this.route, queryParams: {}});
            this.erpService
                .dailyMailActivated({
                    mail: queryParams,
                    dailyMail: 0
                })
                .subscribe(
                    {
                        next: (response: any) => {
                            this.alertText = 'המייל הוסר בהצלחה!';
                            setTimeout(() => {
                                this.goToSystem();
                            }, 3000);
                        },
                        error: (err: HttpErrorResponse) => {
                            this.alertText = 'שגיאה, המייל לא הוסר!';
                        }
                    }
                );
        }
    }

    getPathOfMainState(url: string): string {
        const tree: UrlTree = this.router.parseUrl(url);
        const g: UrlSegmentGroup = tree.root.children['primary'];
        const s: UrlSegment[] = g.segments;
        return s[0].path;
    }


    goToSystem() {
        this.router.navigate(['../'], {
            relativeTo: this.route,
            queryParamsHandling: ''
        });
    }
}
