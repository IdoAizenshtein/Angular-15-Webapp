import {FileStatus} from './file-status.model';

export class FileDetails {
    pages: Array<FilePage>;
    contentType: string;
    note: string;
    flag: boolean;
    status: FileStatus;
    fields: Array<FieldData>;
    parentExport: any;
    jobExecutionId: string;
    revaluationCurrCode: any;
    invoicePayment: any;
    splitPayment: any;
    report856: any;
    expenseAsmachtaType: any;
    incomeAsmachtaType: any;
    companyIdentificationId: any;
}

export class FieldData {
    fieldId: number;
    fieldPosition: Array<{ x: number; y: number }>;
    fieldPage: number;
    fileResultId: any;
    fieldValue: string | number | Date | boolean;
    fieldName: string;
    fileId: string;
    fieldSearchkey: string;
    locationNum: number | string;
    alertMessage: any;
}

export class FilePage {
    contentUrl: string;
    visionResultUrl: string;
    rotate: any;
    fileId: string;
}
