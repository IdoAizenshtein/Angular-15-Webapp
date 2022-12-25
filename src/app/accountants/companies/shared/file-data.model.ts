import {FileStatus} from './file-status.model';

export class FileData {
    fileId: string;
    invoiceDate: number;
    name: string;
    documentNum: string;
    documentType: string;
    totalIncludeMaam: number;
    flag: boolean;
    fileStatus: FileStatus;
    note: string;
    noDataAvailable: boolean;
    dateCreated: number;
    originalFileName: string;
}
