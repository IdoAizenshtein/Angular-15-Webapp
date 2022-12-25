import {Component, Input, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation} from '@angular/core';
import {CcardEditorComponent} from './ccard-editor/ccard-editor.component';
import {CyclicEditorComponent} from './cyclic-editor/cyclic-editor.component';
import {DirectdEditorComponent} from './directd-editor/directd-editor.component';
import {LoanEditorComponent} from './loan-editor/loan-editor.component';
import {SlikaEditorComponent} from './slika-editor/slika-editor.component';
import {EditingType} from './enums';
import {BankChequeEditorComponent} from './bank-cheque-editor/bank-cheque-editor.component';
import {ERPChequeEditorComponent} from './erp-cheque-editor/erp-cheque-editor.component';
import {OtherEditorComponent} from './wire-cheque-other-editor/wire-cheque-other-editor.component';
import {CashEditorComponent} from './cash-editor/cash-editor.component';
import {toFixedFloat2NoMath} from '../../functions/addCommaToNumbers';
import {UserService} from '@app/core/user.service';

export {EditingType};

@Component({
    selector: 'app-fixed-movement-settings',
    templateUrl: './movement-editor.component.html',
    encapsulation: ViewEncapsulation.None,
    preserveWhitespaces: false
})
export class MovementEditorComponent implements OnChanges {
    EditingType = EditingType;

    @Input() form: any;
    @Input() companyTransTypes: any[];
    @Input() companyId: string;
    @Input() mode: EditingType | null = EditingType.Series;
    @Input() allowMultimode: boolean | null = false;
    @Input() setDateFromMessage: boolean = false;
    @Input() dontAllowAddition: any = false;
    @Input() show_applyCategorySelectionToPastCntrl: any = false;

    @ViewChild(CcardEditorComponent) cardEditor: CcardEditorComponent;
    @ViewChild(CyclicEditorComponent) cyclicEditor: CyclicEditorComponent;
    @ViewChild(DirectdEditorComponent) directDEditor: DirectdEditorComponent;
    @ViewChild(LoanEditorComponent) loanEditor: LoanEditorComponent;
    @ViewChild(SlikaEditorComponent) slikaEditor: SlikaEditorComponent;
    @ViewChild(CashEditorComponent) cashEditor: CashEditorComponent;
    @ViewChild(BankChequeEditorComponent)
    bankChequeEditor: BankChequeEditorComponent;
    @ViewChild(ERPChequeEditorComponent)
    erpChequeEditor: ERPChequeEditorComponent;
    @ViewChild(OtherEditorComponent) otherEditor: OtherEditorComponent;

    @Input() source: any;
    @Input() seriesSource: any;

    get actualSource(): any {
        if (
            this.seriesSource &&
            this.allowMultimode &&
            EditingType.Series === this.mode
        ) {
            return this.seriesSource;
        }

        return this.source;
    }

    get result(): any {
        const editResult = this.editResult();

        if ('asmachta' in editResult && editResult.asmachta === '') {
            editResult.asmachta = null;
        }

        return editResult !== null
            ? Object.assign(
                this.actualSource
                    ? JSON.parse(JSON.stringify(this.actualSource))
                    : {},
                editResult
            )
            : // ? Object.assign(this.actualSource, editResult)
            editResult;
    }

    constructor(public userService: UserService) {
    }

    private editResult(): any {
        switch (this.source.targetType) {
            case 'CYCLIC_TRANS':
                return this.cyclicEditor.result;
            case 'CCARD_TAZRIM':
                return this.cardEditor.result;
            case 'DIRECTD':
                return this.directDEditor.result;
            case 'LOAN_TAZRIM':
                return this.loanEditor.result;
            case 'SOLEK_TAZRIM':
                return this.slikaEditor.result;
            case 'CASH':
                return this.cashEditor.result;
            case 'BANK_CHEQUE':
                return this.bankChequeEditor.result;
            case 'ERP_CHEQUE':
                return this.erpChequeEditor.result;
            case 'WIRE_TRANSFER':
            case 'CHEQUE':
            case 'OTHER':
                return this.otherEditor.result;
            default:
                return null;
        }
    }

    reset() {
        this.form.reset();
        // if (this.form.contains('transName')) {
        //     this.form.get('transName').reset();
        // }
        // if (this.form.contains('total')) {
        //     this.form.get('total').reset();
        // }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['source'] && changes['source'].currentValue) {
            this.setupSource(changes['source'].currentValue);
        }

        if (changes['seriesSource'] && changes['seriesSource'].currentValue) {
            this.setupSource(changes['seriesSource'].currentValue);
        }
    }

    private setupSource(src: any): void {
        if ('transDate' in src) {
            src.transDate =
                src.transDate instanceof Date
                    ? src.transDate
                    : src.transDate > 0
                        ? this.userService.appData.moment(+src.transDate).toDate()
                        : null;
        }
        if ('expirationDate' in src) {
            src.expirationDate =
                src.expirationDate instanceof Date
                    ? src.expirationDate
                    : src.expirationDate > 0
                        ? this.userService.appData.moment(+src.expirationDate).toDate()
                        : null;
        }

        if (
            'transTypeId' in src &&
            this.companyTransTypes &&
            !this.companyTransTypes.find((cc) => cc.transTypeId === src.transTypeId)
        ) {
            src.transTypeId = 'f8dd5d61-fb5d-44ba-b7e6-65f25e7b2c6d';
        }

        if ('total' in src) {
            src.total = src.total !== null ? toFixedFloat2NoMath(src.total) : null;
        }
    }
}
