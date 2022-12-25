export class HierarchyNode {
    category: string;
    fields: Array<OcrField>;
    collapsed?: boolean;
    hide: boolean;
}

export class OcrField {
    fieldValue: any;
    fieldId: number;
    name: string;
    required: boolean;
    description: string;
    logicType: string;
    orderNo: number;
    valueType: 'STRING' | 'DATE' | 'NUMBER';
    hide: boolean;
    fileFldInfo: any;
    indBlockAprrove: boolean;
}
