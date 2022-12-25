import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {combineLatest, Observable, Subject, zip} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, shareReplay, startWith, switchMap} from 'rxjs/operators';
import {SharedService} from '@app/shared/services/shared.service';
import {FormControl, Validators} from '@angular/forms';
import {HttpErrorResponse} from '@angular/common/http';
import {slideInOut} from '@app/shared/animations/slideInOut';
import {publishRef} from '@app/shared/functions/publishRef';
import {UserService} from "@app/core/user.service";

@Component({
    selector: 'app-folders-selector',
    templateUrl: './folders-selector.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: [slideInOut]
})
export class FoldersSelectorComponent implements OnInit, OnDestroy {
    public showPanelDD = false;
    foldersFitlered$: Observable<Array<any>>;
    public createFolderModal: {
        visible: boolean;
        progress: boolean;
        folderName: FormControl;
        approve: () => void;
        show(): void;
    };
    readonly query: FormControl;
    @ViewChild('selector', {read: ElementRef}) selectorRef: ElementRef;
    @Input() isDD: boolean = false;
    @Input() disabled: boolean = false;
    @Input() selectedCompanyId: string;
    @Output() selectedFolderChange = new EventEmitter<any>();
    private folders$: Observable<Array<any>>;
    private createFolder$: Observable<any>;
    private readonly forceReload$ = new Subject<void>();

    constructor(private sharedService: SharedService,    public userService: UserService) {
        this.createFolderModal = null;
        this.query = new FormControl('');

        this.createFolderModal = {
            visible: false,
            progress: false,
            folderName: new FormControl('', {
                validators: [Validators.required]
            }),
            show(): void {
                this.folderName.reset('');
                this.visible = true;
            },
            approve: () => {
                this.createFolderModal.progress = true;
                this.createFolderModal.visible = false;
                this.sharedService
                    .createFolder({
                        companyId: this.selectedCompanyId,
                        folderName: this.createFolderModal.folderName.value
                    })
                    .subscribe(
                        (response: any) => {
                            this.forceReload$.next();
                            this.createFolderModal.progress = false;
                        },
                        (err: HttpErrorResponse) => {
                            if (err.error) {
                                console.log('An error occurred:', err.error.message);
                            } else {
                                console.log(
                                    `Backend returned code ${err.status}, body was: ${err.error}`
                                );
                            }
                        }
                    );
            }
        };
    }

    private _selectedFolder: any;

    get selectedFolder(): any {
        return this._selectedFolder;
    }

    set selectedFolder(val: any) {
        if (this._selectedFolder !== val) {
            this.selectedFolderChange.next(val);
        }
        this._selectedFolder = val;
        if (this.isDD) {
            this.discardChanges();
        }
    }

    ngOnDestroy(): void {
        this.forceReload$.complete();
    }

    ngOnInit() {
        this.folders$ = this.forceReload$.pipe(
            startWith(null),
            switchMap(() =>
                this.sharedService.getFolders({
                    uuid: this.selectedCompanyId
                })
            ),
            map((response: any) =>
                response && Array.isArray(response.body)
                    ? response.body.filter((it) => it.show)
                    : response
            ),
            shareReplay(1)
        );
        this.foldersFitlered$ = combineLatest(
        [
            this.folders$,
            this.query.valueChanges.pipe(
                debounceTime(400),
                distinctUntilChanged(),
                startWith(this.query.value),
                map((val) =>
                    !val
                        ? val
                        : new RegExp(val.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'gi')
                )
            )
        ]
        ).pipe(
            map(([folders, query]) => {
                if (!(query instanceof RegExp)) {
                    return folders;
                }
                return folders.filter((company) => query.test(company.folderName));
            }),
            publishRef
        );
    }

    togglePanel(): void {
        if (!this.showPanelDD) {
            this.showPanelDD = true;
        } else {
            this.discardChanges();
        }
    }

    discardChanges(): void {
        if (
            (this.createFolderModal && this.createFolderModal.visible) ||
            this.createFolderModal.progress
        ) {
            return;
        }
        this.showPanelDD = false;
    }

    trackFolder(idx: number, item: any) {
        return (item ? item.folderId : null) || idx;
    }

    createFolder(): void {
        this.createFolderModal.show();
    }
}
