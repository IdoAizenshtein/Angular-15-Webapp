import {Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {TokenService, TokenStatus, TokenStatusResponse, TokenType} from '@app/core/token.service';
import {DialogState} from '../token-update-dialog/token-update-dialog.component';
import {FormGroup} from '@angular/forms';

@Component({
    selector: 'app-token-status-view',
    templateUrl: './token-status-view.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class TokenStatusViewComponent implements OnChanges {
    @Input() status: TokenStatusResponse;
    @Input() companyId: string;
    @Input() pollAfterUpdate = true;
    @Input() is_station: any = false;
    @Input() hideUpdate: any = false;
    @Input() showModalStatus = false;
    @Input() accFromBank: any = [];
    public hideUpdateDataLinks: boolean = false;

    @Input()
    set hideUpdateDataLink(tokenGroup: any) {
        if (tokenGroup && tokenGroup.length) {
            this.hideUpdateDataLinks = tokenGroup.some(
                (itemChild) =>
                    itemChild.token === '88e6c85e-b914-4928-8436-47e86dddd3a4' ||
                    itemChild.token === '88e6c85e-b914-4928-8436-47e86dddd3a5'
            );
        }
    }

    updatePromptData: {
        token: string;
        status: string;
        bankId: string;
        websiteTargetTypeId: string;
        accountNickname: string;
        companyId: string;
        setDefAcc?: any;
    } = null;
    updatePromptVisible = false;

    // updateOtpVisible = false;

    public TokenStatus = TokenStatus;

    targetType: TokenType = null;
    targetTypeDesc: string = null;

    readonly addTokenPrompt: { visible: boolean; form: any } = {
        visible: false,
        form: new FormGroup({})
    };
    @Output() creationSuccess = new EventEmitter<string>();

    readonly hashOtpUpdatePrompt: { visible: boolean } = {
        visible: false
    };

    constructor(public tokenService: TokenService) {
    }


    ngOnChanges(changes: SimpleChanges): void {
        if (changes['status'] && changes['status'].currentValue) {
            this.targetType = this.tokenService.tokenTypeByTargetId(
                changes['status'].currentValue.websiteTargetTypeId
            );
            switch (this.targetType) {
                case TokenType.ACCOUNT: {
                    this.targetTypeDesc = 'banks';
                    break;
                }
                case TokenType.CREDITCARD: {
                    this.targetTypeDesc = 'cards';
                    break;
                }
                case TokenType.SLIKA: {
                    this.targetTypeDesc = 'clearingAgencies';
                    break;
                }
                default: {
                    this.targetTypeDesc = null;
                    break;
                }
            }

            if (this.showModalStatus) {
                this.onUpdatePasswordClick();
            }
        }
    }

    onUpdatePasswordClick() {
        this.resetUpdatePromptData();
        this.updatePromptVisible = true;
    }

    onUpdateCredentialsClick() {
        this.resetUpdatePromptData();
        this.updatePromptVisible = true;
    }

    // onUpdateOTPClick() {
    //     this.updatePromptVisible = false;
    //     this.updateOtpVisible = true;
    // }

    private resetUpdatePromptData() {
        if (this.status == null) {
            this.updatePromptData = null;
            return;
        }

        this.updatePromptData = {
            token: this.status.token,
            status: this.status.tokenStatus,
            bankId: String(this.status.websiteTargetTypeId),
            websiteTargetTypeId: String(this.status.websiteTargetTypeId),
            accountNickname: this.status.tokenNickname,
            companyId: this.companyId,
            setDefAcc: this.status.setDefAcc
        };
    }

    onUpdateDialogVisibilityChange(state: DialogState) {
        if (state === DialogState.UPDATE_SUCCEEDED) {
            this.status.tokenStatus = TokenStatus[TokenStatus.InProgress];
        }
    }

    hasStationSpecialTokenStatus() {
        return ['NOT_UP_TO_DATE', 'WRONG_OTP_CODE', 'TECHNICALPROBLEM'].includes(
            this.status.tokenStatus
        );
    }

    hasStationSpecialTokenStatusPoalim() {
        return (
            [
                'NOT_UP_TO_DATE',
                'WRONG_OTP_CODE',
                'TECHNICALPROBLEM',
                'UP_TO_DATE'
            ].includes(this.status.tokenStatus) && this.status.poalimBeasakim
        );
    }

    onHashOtpUpdateClick() {
        this.hashOtpUpdatePrompt.visible = true;
    }

    onHashOtpDialogVisibilityChange(tokenLastPollResult: TokenStatusResponse) {
        if (!!tokenLastPollResult && !!tokenLastPollResult.tokenStatus) {
            this.status.tokenStatus = tokenLastPollResult.tokenStatus;
        }
    }
}
