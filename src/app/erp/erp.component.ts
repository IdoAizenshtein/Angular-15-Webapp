import {AfterViewInit, Component, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {Location} from '@angular/common';
import {ActivatedRoute, Router, UrlSegment, UrlSegmentGroup, UrlTree} from '@angular/router';
import {StorageService} from '@app/shared/services/storage.service';

@Component({
    templateUrl: './erp.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ErpComponent implements AfterViewInit {
    // tslint:disable-next-line:member-ordering
    constructor(
        public userService: UserService,
        // private sharedService: SharedService,
        public location: Location,
        public router: Router,
        public storageService: StorageService,
        public route: ActivatedRoute
    ) {
        if (
            this.userService.appData &&
            this.userService.appData.isAdmin &&
            !this.userService.appData.token
        ) {
            this.userService.appData.token =
                this.storageService.localStorageGetterItem('token');
        }
        const url = this.location.path();
        const mainPath = this.getPathOfMainState(url);
        if (mainPath === 'api-account-management') {
            const queryParams: string = this.route.snapshot.queryParams['station_id'];
            const station_id =
                this.storageService.localStorageGetterItem('station_id');
            if (queryParams) {
                this.userService.appData.station_id = queryParams;
                this.storageService.localStorageSetter('station_id', queryParams);
            } else if (station_id) {
                this.userService.appData.station_id = station_id;
            }


            // http://localhost:4200/api-account-management?station_id=CA75CF8D-7CA3-762D-E053-0B6519AC6F88&companyHp=209409952&custId=27002
            // http://localhost:4200/api-account-management?station_id=CA75CF8D-7CA3-762D-E053-0B6519AC6F88&companyHp=209409952&custId=2312
            if (this.route.snapshot.queryParams['companyName']) {
                this.storageService.sessionStorageSetter(
                    'station_companyName',
                    this.route.snapshot.queryParams['companyName']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_companyName');
                }
            }
            if (this.route.snapshot.queryParams['companyHp']) {
                this.storageService.sessionStorageSetter(
                    'station_companyHp',
                    this.route.snapshot.queryParams['companyHp']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_companyHp');
                }
            }
            if (this.route.snapshot.queryParams['custId']) {
                this.storageService.sessionStorageSetter(
                    'station_custId',
                    this.route.snapshot.queryParams['custId']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_custId');
                }
            }
            if (this.route.snapshot.queryParams['total']) {
                this.storageService.sessionStorageSetter(
                    'station_total',
                    this.route.snapshot.queryParams['total']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_total');
                }
            }
            if (this.route.snapshot.queryParams['balance']) {
                this.storageService.sessionStorageSetter(
                    'station_balance',
                    this.route.snapshot.queryParams['balance']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_balance');
                }
            }
            if (this.route.snapshot.queryParams['dateValue']) {
                this.storageService.sessionStorageSetter(
                    'station_dateValue',
                    this.route.snapshot.queryParams['dateValue']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_dateValue');
                }
            }
            if (this.route.snapshot.queryParams['dateFrom']) {
                this.storageService.sessionStorageSetter(
                    'station_dateFrom',
                    this.route.snapshot.queryParams['dateFrom']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_dateFrom');
                }
            }
            if (this.route.snapshot.queryParams['dateTill']) {
                this.storageService.sessionStorageSetter(
                    'station_dateTill',
                    this.route.snapshot.queryParams['dateTill']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_dateTill');
                }
            }
            if (this.route.snapshot.queryParams['bookKeepingId']) {
                this.storageService.localStorageSetter(
                    'station_bookKeepingId',
                    this.route.snapshot.queryParams['bookKeepingId']
                );
            } else {
                if (queryParams) {
                    this.storageService.localStorageRemoveItem('station_bookKeepingId');
                }
            }
            if (this.route.snapshot.queryParams['description']) {
                this.storageService.sessionStorageSetter(
                    'station_description',
                    this.route.snapshot.queryParams['description']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_description');
                }
            }
            if (this.route.snapshot.queryParams['asmachta']) {
                this.storageService.sessionStorageSetter(
                    'station_asmachta',
                    this.route.snapshot.queryParams['asmachta']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_asmachta');
                }
            }
            if (this.route.snapshot.queryParams['dbName']) {
                this.storageService.sessionStorageSetter(
                    'station_dbName',
                    this.route.snapshot.queryParams['dbName']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_dbName');
                }
            }
            if (this.route.snapshot.queryParams['hashCompanyId']) {
                this.storageService.sessionStorageSetter(
                    'station_hashCompanyId',
                    this.route.snapshot.queryParams['hashCompanyId']
                );
            } else {
                if (queryParams) {
                    this.storageService.sessionStorageRemoveItem('station_hashCompanyId');
                }
            }
            if (url !== '/api-account-management/accountManagement') {
                this.storageService.sessionStorageSetter('station_url', url);
            }

            const params = {
                isUrlWithoutParams: url === '/api-account-management/accountManagement',
                station_id: this.storageService.localStorageGetterItem('station_id')
                    ? this.storageService.localStorageGetterItem('station_id')
                    : null,
                companyName: this.storageService.sessionStorageGetterItem(
                    'station_companyName'
                )
                    ? this.storageService.sessionStorageGetterItem('station_companyName')
                    : null,
                companyHp: this.storageService.sessionStorageGetterItem(
                    'station_companyHp'
                )
                    ? this.storageService.sessionStorageGetterItem('station_companyHp')
                    : null,
                custId: this.storageService.sessionStorageGetterItem('station_custId')
                    ? this.storageService.sessionStorageGetterItem('station_custId')
                    : null,
                total: this.storageService.sessionStorageGetterItem('station_total')
                    ? this.storageService.sessionStorageGetterItem('station_total')
                    : null,
                balance: this.storageService.sessionStorageGetterItem('station_balance')
                    ? this.storageService.sessionStorageGetterItem('station_balance')
                    : null,
                dateValue: this.storageService.sessionStorageGetterItem(
                    'station_dateValue'
                )
                    ? this.storageService.sessionStorageGetterItem('station_dateValue')
                    : null,
                dateFrom: this.storageService.sessionStorageGetterItem(
                    'station_dateFrom'
                )
                    ? this.storageService.sessionStorageGetterItem('station_dateFrom')
                    : null,
                dateTill: this.storageService.sessionStorageGetterItem(
                    'station_dateTill'
                )
                    ? this.storageService.sessionStorageGetterItem('station_dateTill')
                    : null,
                bookKeepingId: this.storageService.localStorageGetterItem(
                    'station_bookKeepingId'
                )
                    ? this.storageService.localStorageGetterItem('station_bookKeepingId')
                    : 'db8a6e85-c7a1-4618-8cb9-401dfdbb4f33',
                description: this.storageService.sessionStorageGetterItem(
                    'station_description'
                )
                    ? this.storageService.sessionStorageGetterItem('station_description')
                    : null,
                asmachta: this.storageService.sessionStorageGetterItem(
                    'station_asmachta'
                )
                    ? this.storageService.sessionStorageGetterItem('station_asmachta')
                    : null,
                dbName: this.storageService.sessionStorageGetterItem('station_dbName')
                    ? this.storageService.sessionStorageGetterItem('station_dbName')
                    : null,
                hashCompanyId: this.storageService.sessionStorageGetterItem(
                    'station_hashCompanyId'
                )
                    ? this.storageService.sessionStorageGetterItem(
                        'station_hashCompanyId'
                    )
                    : null,
                url: this.storageService.sessionStorageGetterItem('station_url')
                    ? this.storageService.sessionStorageGetterItem('station_url')
                    : null
            };
            this.userService.appData.station_params = params;
            if (url.includes('help-center')) {
                this.router.navigate(['/api-account-management/help-center'], {
                    queryParamsHandling: '',
                    relativeTo: this.route
                });
            } else {
                this.router.navigate(['/api-account-management/accountManagement'], {
                    queryParamsHandling: '',
                    relativeTo: this.route
                });
            }
        } else if (mainPath === 'removeFromList') {
            const queryParams: string = this.route.snapshot.queryParams['mail'];
            if (queryParams) {
                // this.router.navigate(['/removeFromList'], {queryParamsHandling: '', relativeTo: this.route});
            }
        }
    }

    getPathOfMainState(url: string): string {
        const tree: UrlTree = this.router.parseUrl(url);
        const g: UrlSegmentGroup = tree.root.children['primary'];
        const s: UrlSegment[] = g.segments;
        return s[0].path;
    }


    ngAfterViewInit(): void {
        console.log('ngAfterViewInit');
    }


}
