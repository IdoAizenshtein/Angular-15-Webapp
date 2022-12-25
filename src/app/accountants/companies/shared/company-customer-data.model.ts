import {SelectItem} from 'primeng/api';

export class CompanyCustomerDetails {
    custDataExpense: Array<CompanyCustomerDataModel>;
    custDataIncome: Array<CompanyCustomerDataModel>;
    indexDataExpense: Array<CompanyCustomerDataModel>;
    indexDataIncome: Array<CompanyCustomerDataModel>;
    esderMaam: 'MONTH' | 'TWO_MONTH' | 'NONE';
    vatReportOptions?: Array<SelectItem>;
    custData13: any;
    custData14: any;
}

export class CompanyCustomerDataModel {
    id: any;
    custId: string;
    lName: string;
    hp: any;
}
