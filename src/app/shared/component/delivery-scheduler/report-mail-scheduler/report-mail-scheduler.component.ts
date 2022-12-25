import {Component, EventEmitter, Input, Output, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {UserService} from "@app/core/user.service";

@Component({
    selector: 'app-report-mail-scheduler',
    templateUrl: './report-mail-scheduler.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class ReportMailSchedulerComponent {
    private _visible = false;
    @Input()
    get visible() {
        return this._visible;
    }

    set visible(val: boolean) {
        this._visible = val;
        this.visibleChange.next(this._visible);
        if (!this._visible) {
            this.processing = false;
            this.form.reset();
        }
    }

    @Output() visibleChange = new EventEmitter<boolean>();

    @Output() recipientApproved = new EventEmitter<string>();

    processing = false;
    readonly form: any;

    constructor( public userService: UserService) {
        this.form = new FormGroup({
            sendReportTo: new FormControl('', [Validators.required, Validators.email])
        });
    }

    approveMailAddress() {
        this.recipientApproved.next(this.form.get('sendReportTo').value);
        this.processing = true;
    }
}
