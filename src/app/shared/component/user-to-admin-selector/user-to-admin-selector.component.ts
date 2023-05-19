import {Component, Input, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {AdminService} from '@app/admin/admin.service';
import {StorageService} from '@app/shared/services/storage.service';
import {FormControl, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {PaginatorComponent} from '../paginator/paginator.component';
import {Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, filter, takeUntil, tap} from 'rxjs/operators';

@Component({
    selector: 'app-user-to-admin-selector',
    templateUrl: './user-to-admin-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class UserToAdminSelectorComponent implements OnInit, OnDestroy {
    @Input()
    usersList: Observable<any[]>;

    form: any;

    currentPage = 0;
    entryLimit = 50;
    @ViewChild(PaginatorComponent) paginator: PaginatorComponent;

    searchableList = ['userName', 'companyHp', 'companyName'];
    searchTypesDD = [
        {value: 'companyHp', label: 'ח.פ חברה'},
        {value: 'userName', label: 'שם משתמש'},
        {value: 'officeName', label: 'שם משרד'},
        {value: 'subscriptionNumber', label: 'מספר תחנה'}
    ];

    private readonly destroyed$ = new Subject<void>();

    ngOnDestroy(): void {
        this.destroyed$.next();
        this.destroyed$.complete();
    }

    constructor(
        public userService: UserService,
        private storageService: StorageService,
        public adminService: AdminService
    ) {
    }

    // noinspection JSMethodCanBeStatic
    private searchQueryValidatorsForType(
        type: 'userName' | 'companyHp' | 'companyName' | 'officeName'
    ): ValidatorFn[] {
        return [
            Validators.required,
            ...(type === 'companyHp'
                ? [
                    Validators.minLength(8),
                    Validators.maxLength(9),
                    Validators.pattern('[0-9]+')
                ]
                : [Validators.minLength(2)])
        ];
    }

    ngOnInit(): void {
        try {
            this.userService.appData.userOnBehalf = JSON.parse(
                this.storageService.localStorageGetterItem('userOnBehalf')
            );
        } catch (e) {
        }
        try {
            if (this.userService.appData.userData.biziboxRole === 'MANAGER') {
                this.searchTypesDD.unshift({value: 'companyName', label: 'שם חברה'});
            }
        }catch (e){

        }

        const typeToSelect =
            this.adminService.usersToAdminCriteria.type ||
            this.searchTypesDD[0].value;
        this.form = new FormGroup({
            value: new FormControl(
                this.adminService.usersToAdminCriteria.value,
                this.searchQueryValidatorsForType(<any>typeToSelect)
            ),
            user: new FormControl(
                this.userService.appData.userOnBehalf
                    ? [
                        this.userService.appData.userOnBehalf.id,
                        this.userService.appData.userOnBehalf.companyToSelect,
                        this.userService.appData.userOnBehalf.name
                    ].join('|')
                    : '',
                Validators.required
            ),
            type: new FormControl(typeToSelect)
        });

        // this.form.get('value').valueChanges
        //     .subscribe(() => this.paginator.changePage(0));
        const formValueChange$ = this.form.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged((val1, val2) => {
                return (
                    (val1 === null) === (val2 === null) &&
                    ['value', 'type']
                        .filter((k) => val2.hasOwnProperty(k))
                        .every((k) => (!val1[k] && !val2[k]) || val1[k] === val2[k])
                );
            }),
            tap(() => {
                if (this.paginator) {
                    this.paginator.changePage(0);
                }
            }),
            takeUntil(this.destroyed$)
        );
        formValueChange$
            .pipe(
                debounceTime(100),
                filter(() => this.form.get('value').valid),
                // switchMap(value => {
                //     debugger
                //     this.adminService.usersToAdminCriteria = value;
                //     return this.adminService.usersToAdmin;
                // })
                takeUntil(this.destroyed$)
            )
            .subscribe((value) => {
                this.adminService.usersToAdminCriteria = {
                    value: value.value,
                    type: value.type
                };
            });
        this.form
            .get('type')
            .valueChanges.pipe(takeUntil(this.destroyed$))
            .subscribe((newType) => {
                this.form
                    .get('value')
                    .setValidators(this.searchQueryValidatorsForType(<any>newType));
                this.form.get('value').updateValueAndValidity();
                if (this.form.get('value').invalid) {
                    this.form.get('value').reset();
                }
            });
    }

    recordTrack(idx, rec) {
        return rec.userId + rec.companyHp;
    }

    paginate(event) {
        this.currentPage = event.page;
        // console.log('paginate ===> %o', event);
        //
        // if (this.entryLimit !== +event.rows) {
        //     this.entryLimit = +event.rows;
        //     // this.storageService.sessionStorageSetter('bankAccount-details-rowsPerPage', event.rows);
        //     this.defaultsResolver.setNumberOfRowsAt(this.entryLimit);
        // }
        //
        // if (this.currentPage !== +event.page) {
        //     this.scrollContainer.nativeElement.scrollTop = 0;
        //     this.currentPage = event.page;
        //     // this.hideAdditional();
        // }
    }
}
