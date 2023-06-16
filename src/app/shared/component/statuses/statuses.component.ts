import {AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewEncapsulation} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {UserService} from '@app/core/user.service';
import {slideInOut} from '../../animations/slideInOut';
import {StorageService} from '@app/shared/services/storage.service';
import {ActivatedRoute, Router} from '@angular/router';
import {BrowserService} from '@app/shared/services/browser.service';

@Component({
    selector: 'app-statuses',
    templateUrl: './statuses.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    animations: [slideInOut]
})
export class StatusesComponent implements AfterViewInit {
    public showPanelDD = false;
    public parentNode: ElementRef;

    public statuses = {
        name: 'כל התנועות',
        checked: false,
        children: [
            {
                name: 'תנועות לקליטה',
                checked: true,
                value: '111',
                children: [
                    {
                        name: 'כרטיס אוכלס אוטומטית',
                        value: 'RECHECK',
                        checked: true
                    },
                    {
                        name: 'כרטיס אוכלס ידנית',
                        value: 'DONE',
                        checked: true
                    },
                    {
                        name: 'ממתין לאכלוס כרטיס',
                        value: 'EMPTY',
                        checked: true
                    },
                ]
            },
            {
                name: 'תנועות שנקלטו',
                checked: false,
                value: '222',
                children: [
                    {
                        name: 'נקלט במנה קבועה',
                        value: 'PERMANENT_COMMAND',
                        checked: false
                    },
                    {
                        name: 'נקלט במנה זמנית',
                        value: 'TEMP_COMMAND',
                        checked: false
                    }
                ]
            },
            {
                name: 'תנועות לא לקליטה',
                checked: false,
                value: '333',
                children: [
                    {
                        name: 'לא לטיפול לפי הגדרה מנתוני חברה',
                        value: 'COMPANY_IGNORE',
                        checked: false
                    },
                    {
                        name: 'לא לטיפול על ידי המשתמש',
                        value: 'CUSTOMER_IGNORE',
                        checked: false
                    },
                    {
                        name: 'לא לטיפול מהתאמה בביזיבוקס',
                        value: 'BIZIBOX_MATCH_IGNORE',
                        checked: false
                    },
                    {
                        name: 'לא לטיפול מהתאמה בחשבשבת',
                        value: 'HASH_MATCH_IGNORE',
                        checked: false
                    },
                    {
                        name: 'תנועה לא נמצאה בחשבשבת',
                        value: 'NOT_HASH_BANK_MATCHED',
                        checked: false
                    }
                ]
            },
        ]
    };
    public statusArr: any = [];
    public statusArrCopy: any = [];
    public redPointFilter: boolean = false;
    @Input() unFocus: boolean;
    @Input() disabled: boolean;
    @Output() changedTrigger = new EventEmitter<any>();
    storageKey: string;
    @Input() type: string;


    constructor(
        public translate: TranslateService,
        public userService: UserService,
        private _element: ElementRef,
        public router: Router,
        private storageService: StorageService,
        private route: ActivatedRoute
    ) {

    }

    @HostListener('document:click', ['$event'])
    onClickOutside($event: any) {
        // console.log('%o, -- %o', $event, this.parentNode);
        const elementRefInPath = BrowserService.pathFrom($event).find(
            (node) => node === this._element.nativeElement
        );
        if (!elementRefInPath) {
            if (this.showPanelDD) {
                this.showPanelDD = false;
            }
        }
    }

    ngAfterViewInit(): void {
        this.parentNode = this._element.nativeElement;
        this.storageKey = 'storageKey_statuses_' + this.type;
        if(this.type === 'credit' && !this.statuses.children[2].children.some(it=> it.value === 'FUTURE_PAYMENTS_IGNORE')){
            this.statuses.children[2].children.push({
                name: 'לא לטיפול מעסקת תשלומים',
                value: 'FUTURE_PAYMENTS_IGNORE',
                checked: false
            })
        }
        const storageKey_statuses = this.storageService.sessionStorageGetterItem(this.storageKey);
        if (storageKey_statuses) {
            this.statuses = JSON.parse(storageKey_statuses);
        }
        this.checkedAll(true);
    }

    changeAll(checked) {
        this.statuses.children.forEach(base => {
            base.checked = checked;
            base.children.forEach(it => {
                it.checked = checked;
            });
        });
        this.checkedAll();
    }

    changeAllChild(children, checked) {
        children.forEach(it => {
            it.checked = checked;
        });
        this.checkedAll();
    }

    checkedAll(firstLoad?: boolean): void {
        this.statuses.children.forEach(base => {
            base.checked = base.children.every(it => it.checked);
        });
        this.statuses.checked = this.statuses.children.every(it => it.checked);
        this.statusArr = [];
        this.statuses.children.forEach(base => {
            base.children.forEach(it => {
                if (it.checked) {
                    this.statusArr.push(it.value);
                }
            });
        });
        this.storeSelection();
        this.statusArrCopy = JSON.parse(JSON.stringify(this.statusArr));
        if ((this.type === 'bank' && this.statusArr.length === 10) || (this.type === 'credit' && this.statusArr.length === 11)) {
            this.redPointFilter = false;
            this.statusArr = null;
        } else {
/*
            if (!this.statusArr.length) {
                this.statusArr = null;
            }
*/
            this.redPointFilter = true;
        }
        if (!firstLoad) {
            this.changedTrigger.emit(this.statusArr);
        }
    }

    private storeSelection(): void {
        this.storageService.sessionStorageSetter(
            this.storageKey,
            JSON.stringify(
                this.statuses
            )
        );
    }
}
