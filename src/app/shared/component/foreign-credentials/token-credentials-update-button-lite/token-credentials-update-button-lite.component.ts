import {
    Component,
    ElementRef,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    Renderer2,
    SimpleChanges,
    ViewEncapsulation
} from '@angular/core';
import {UserService} from '@app/core/user.service';
import {compareDates} from '../../../functions/compareDates';
import {getDaysBetweenDates} from '../../../functions/getDaysBetweenDates';

@Component({
    selector: 'app-token-credentials-update-button-lite',
    templateUrl: './token-credentials-update-button-lite.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false,
    styles: [
        'app-token-credentials-update-button-lite { background: #feecec !important } app-token-credentials-update-button-lite.valid { background: rgb(242, 245, 246) !important }'
    ]
})
export class TokenCredentialsUpdateButtonLiteComponent
    implements OnInit, OnChanges {
    @Input() accounts: Array<any> = [];
    public accountSelectOneNotUpdate: boolean | number = false;
    public accountSelectOneHariga: boolean = false;
    public accountSelectOneFromMultipleHariga: any = false;
    public accountSelectMultipleHariga: any = false;
    @Output() changeAcc: EventEmitter<void> = new EventEmitter();

    constructor(
        public userService: UserService,
        private renderer: Renderer2,
        private el: ElementRef
    ) {
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.accountSelectOneNotUpdate = false;
        this.accountSelectOneHariga = false;
        this.accountSelectOneFromMultipleHariga = false;
        this.accountSelectMultipleHariga = false;

        if (this.accounts.length === 1) {
            if (
                !compareDates(
                    new Date(),
                    new Date(this.accounts[0].balanceLastUpdatedDate)
                )
            ) {
                this.accountSelectOneNotUpdate = getDaysBetweenDates(
                    new Date(this.accounts[0].balanceLastUpdatedDate),
                    new Date()
                );
            }
            if (
                !this.accountSelectOneNotUpdate &&
                this.accounts[0].accountBalance < this.accounts[0].creditLimit
            ) {
                this.accountSelectOneHariga = true;
            }
        } else {
            const accHariga = this.accounts.filter(
                (acc:any) => acc.accountBalance < acc.creditLimit
            );
            if (accHariga.length === 1) {
                this.accountSelectOneFromMultipleHariga = accHariga[0];
            } else if (accHariga.length > 1) {
                this.accountSelectMultipleHariga = accHariga;
            }
        }

        if (
            this.accountSelectOneNotUpdate === false &&
            this.accountSelectOneHariga === false &&
            this.accountSelectOneFromMultipleHariga === false &&
            this.accountSelectMultipleHariga === false
        ) {
            this.renderer.addClass(this.el.nativeElement, 'valid');
        } else {
            this.renderer.removeClass(this.el.nativeElement, 'valid');
        }
    }

    ngOnInit() {
        this.accountSelectOneNotUpdate = false;
        this.accountSelectOneHariga = false;
        this.accountSelectOneFromMultipleHariga = false;
        this.accountSelectMultipleHariga = false;

        if (this.accounts.length === 1) {
            if (
                !compareDates(
                    new Date(),
                    new Date(this.accounts[0].balanceLastUpdatedDate)
                )
            ) {
                this.accountSelectOneNotUpdate = getDaysBetweenDates(
                    new Date(this.accounts[0].balanceLastUpdatedDate),
                    new Date()
                );
            }
            if (
                !this.accountSelectOneNotUpdate &&
                this.accounts[0].accountBalance < this.accounts[0].creditLimit
            ) {
                this.accountSelectOneHariga = true;
            }
        } else {
            const accHariga = this.accounts.filter(
                (acc:any) => acc.accountBalance < acc.creditLimit
            );
            if (accHariga.length === 1) {
                this.accountSelectOneFromMultipleHariga = accHariga[0];
            } else if (accHariga.length > 1) {
                this.accountSelectMultipleHariga = accHariga;
            }
        }

        if (
            this.accountSelectOneNotUpdate === false &&
            this.accountSelectOneHariga === false &&
            this.accountSelectOneFromMultipleHariga === false &&
            this.accountSelectMultipleHariga === false
        ) {
            this.renderer.addClass(this.el.nativeElement, 'valid');
        } else {
            this.renderer.removeClass(this.el.nativeElement, 'valid');
        }
    }

    selectAccountInDeviation(account: any): void {
        this.changeAcc.emit(account);
    }
}
