export class AccountsByCurrencyGroup {
    maxMultiSelectionCount = 0;
    accounts: any[] = [];
    selectedIndices: number[] = [];
    containsPrimaryAccount = false;

    // static isToday(dt: number): boolean {
    //   return Number.isInteger(dt)
    //     && new Date(dt).toLocaleDateString() === new Date().toLocaleDateString();
    // }

    constructor(accounts: any[]) {
        this.accounts = accounts;
        this.containsPrimaryAccount = this.accounts.some(
            (acc:any) => acc.primaryAccount
        );

        this.accounts.forEach((acc, index) => {
            if (acc.isUpToDate) {
                this.maxMultiSelectionCount += 1;
            }
            if (acc.checked) {
                this.selectAt(index);
            }
        });
    }

    add(account: any): void {
        this.accounts.push(account);
    }

    get currency(): any {
        return this.accounts.length > 0 ? this.accounts[0].currency : null;
    }

    // get symbol(): any {
    //   return this.accounts.length > 0 // && this.currency !== AccountSelectComponent.DEFAULT_PRIMARY_CURRENCY
    //     ? getCurrencySymbol([this.currency][0], 'narrow') : null;
    // }

    get selectable(): boolean {
        return (
            this.accounts.length > 0 &&
            this.maxMultiSelectionCount > 0 &&
            (this.selectedIndices.length === 0 || this.hasSelectedUpToDateOnly)
        );
    }

    get select(): boolean {
        return (
            this.selectedIndices.length > 0 &&
            this.selectedIndices.length === this.maxMultiSelectionCount
        );
    }

    set select(val: boolean) {
        // console.log('group.select -> %o', val);

        this.clearSelection();

        if (val) {
            for (let idx = 0; idx < this.accounts.length; idx++) {
                if (!this.accounts[idx].checked && this.accounts[idx].isUpToDate) {
                    this.selectAt(idx);
                    // console.log('group.selectAt -> %o', idx);
                }
            }
        }
    }

    get selectedCount(): number {
        return this.selectedIndices.length;
    }

    get selected(): any[] {
        return this.selectedIndices.map((selidx) => this.accounts[selidx]);
    }

    get hasSelectedUpToDateOnly(): boolean {
        return (
            this.selectedIndices.length > 0 &&
            this.selectedIndices.every(
                (selectedAccIndex) => this.accounts[selectedAccIndex].isUpToDate
            )
        );
    }

    maySelectAt(index: number): boolean {
        return (
            index < this.accounts.length &&
            (this.selectedIndices.length === 0 ||
                (!this.selectedIndices.includes(index) &&
                    this.accounts[index].isUpToDate &&
                    this.hasSelectedUpToDateOnly))
        );
    }

    selectAt(index: number): boolean {
        // console.log('selectAt -> %o', index);
        const result = this.maySelectAt(index);
        if (result) {
            // console.log('selection added for %o', this.accounts[index]);
            this.selectedIndices.push(index);
            this.accounts[index].checked = true;
        }
        return result;
    }

    deselectAt(index: number): boolean {
        // console.log('deselectAt -> %o', index);
        const foundAt = this.selectedIndices.indexOf(index);
        if (foundAt >= 0) {
            // console.log('selection removed for %o', this.accounts[index]);
            this.selectedIndices.splice(foundAt, 1);
            this.accounts[index].checked = false;
            return true;
        }
        return false;
    }

    // selectedAt(index: number): boolean {
    //   return this.selectedIndices.includes(index);
    // }

    clearSelection(): boolean {
        if (!this.selectedIndices.length) {
            return false;
        }

        this.selectedIndices.forEach((selInd) => {
            this.accounts[selInd].checked = false;
        });
        this.selectedIndices.length = 0;

        return true;
    }
}

export class AccountsByCurrencyGroupPlainSelection extends AccountsByCurrencyGroup {
    constructor(accounts: any[]) {
        super(accounts);

        this.maxMultiSelectionCount = accounts.length;
    }

    override maySelectAt(index: any): any {
        return (
            index < this.accounts.length &&
            (this.selectedIndices.length === 0 ||
                !this.selectedIndices.includes(index))
        );
    }

    override get selectable(): boolean {
        return this.accounts.length > 0 && this.maxMultiSelectionCount > 0;
    }

    override get select(): boolean {
        return (
            this.selectedIndices.length > 0 &&
            this.selectedIndices.length === this.maxMultiSelectionCount
        );
    }

    override set select(val: boolean) {
        // console.log('group.select -> %o', val);
        this.clearSelection();

        if (val) {
            for (let idx = 0; idx < this.accounts.length; idx++) {
                if (!this.accounts[idx].checked) {
                    this.selectAt(idx);
                    // console.log('group.selectAt -> %o', idx);
                }
            }
        }
    }
}
