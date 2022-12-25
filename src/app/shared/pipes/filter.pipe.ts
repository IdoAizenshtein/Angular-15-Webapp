import {Pipe, PipeTransform} from '@angular/core';
import {formatAsSumNoMath} from '../functions/addCommaToNumbers';

@Pipe({
    name: 'filterPipe',
    pure: true
})
export class FilterPipe implements PipeTransform {
    transform(
        items: any,
        input: any,
        searchableList: any,
        isArray?: string,
        compare?: boolean,
        parentName?: string
    ): any {
        if (!items || !input) {
            return items;
        }
        if (searchableList) {
            if (typeof input === 'object') {
                if (isArray !== undefined && isArray !== '') {
                    const arrAll = [];
                    items.forEach((obj) => {
                        const arrInside = obj[isArray].filter(function (el: any) {
                            let isTrue = false;
                            for (const k in searchableList) {
                                if (searchableList.hasOwnProperty(k)) {
                                    for (let idx = 0; idx < input.length; idx++) {
                                        if (compare === undefined) {
                                            if (
                                                el[searchableList[k]] !== undefined &&
                                                el[searchableList[k]] !== null &&
                                                el[searchableList[k]]
                                                    .toString()
                                                    .toLowerCase()
                                                    .includes(input[idx].toString().toLowerCase())
                                            ) {
                                                isTrue = true;
                                            }
                                        } else {
                                            if (
                                                el[searchableList[k]] !== undefined &&
                                                el[searchableList[k]] !== null
                                            ) {
                                                if (input === 'true' && el[searchableList[k]] < 0) {
                                                    isTrue = true;
                                                } else if (
                                                    input === 'false' &&
                                                    el[searchableList[k]] >= 0
                                                ) {
                                                    isTrue = true;
                                                }
                                            }
                                        }
                                    }
                                    if (isTrue) {
                                        return el;
                                    }
                                }
                            }
                        });
                        if (arrInside.length) {
                            obj[isArray] = arrInside;
                            arrAll.push(obj);
                        }
                    });
                    return arrAll;
                } else {
                    return items.filter(function (el: any) {
                        let isTrue = false;
                        for (const k in searchableList) {
                            if (searchableList.hasOwnProperty(k)) {
                                for (let idx = 0; idx < input.length; idx++) {
                                    if (compare === undefined) {
                                        if (
                                            el[searchableList[k]] !== undefined &&
                                            el[searchableList[k]] !== null &&
                                            el[searchableList[k]]
                                                .toString()
                                                .toLowerCase()
                                                .includes(input[idx].toString().toLowerCase())
                                        ) {
                                            isTrue = true;
                                        }
                                    } else {
                                        if (
                                            el[searchableList[k]] !== undefined &&
                                            el[searchableList[k]] !== null
                                        ) {
                                            if (input === 'true' && el[searchableList[k]] < 0) {
                                                isTrue = true;
                                            } else if (
                                                input === 'false' &&
                                                el[searchableList[k]] >= 0
                                            ) {
                                                isTrue = true;
                                            }
                                        }
                                    }
                                }
                                if (isTrue) {
                                    return el;
                                }
                            }
                        }
                    });
                }
            } else {
                if (isArray !== undefined && isArray !== '') {
                    const arrAll = [];
                    items.forEach((obj) => {
                        const arrInside = obj[isArray].filter(function (el: any) {
                            let isTrue = false;
                            for (const k in searchableList) {
                                if (searchableList.hasOwnProperty(k)) {
                                    if (compare === undefined) {
                                        if (
                                            el[searchableList[k]] !== undefined &&
                                            el[searchableList[k]] !== null &&
                                            el[searchableList[k]]
                                                .toString()
                                                .toLowerCase()
                                                .includes(input.toString().toLowerCase())
                                        ) {
                                            isTrue = true;
                                        }
                                    } else {
                                        if (
                                            el[searchableList[k]] !== undefined &&
                                            el[searchableList[k]] !== null
                                        ) {
                                            if (input === 'true' && el[searchableList[k]] < 0) {
                                                isTrue = true;
                                            } else if (
                                                input === 'false' &&
                                                el[searchableList[k]] >= 0
                                            ) {
                                                isTrue = true;
                                            }
                                        }
                                    }
                                    if (isTrue) {
                                        return el;
                                    }
                                }
                            }
                        });
                        if (arrInside.length) {
                            obj[isArray] = arrInside;
                            arrAll.push(obj);
                        }
                    });
                    return arrAll;
                } else {
                    return items.filter(function (el: any) {
                        let isTrue = false;
                        for (const k in searchableList) {
                            if (searchableList.hasOwnProperty(k)) {
                                if (compare === undefined) {
                                    if (parentName) {
                                        if (el[parentName]) {
                                            if (
                                                el[parentName][searchableList[k]] !== undefined &&
                                                el[parentName][searchableList[k]] !== null
                                            ) {
                                                // && el[searchableList[k]].toString().toLowerCase().includes(input.toString().toLowerCase())) {
                                                isTrue =
                                                    (typeof el[parentName][searchableList[k]] ===
                                                        'number' &&
                                                        formatAsSumNoMath(
                                                            el[parentName][searchableList[k]]
                                                        ).includes(input.toString().toLowerCase())) ||
                                                    el[parentName][searchableList[k]]
                                                        .toString()
                                                        .toLowerCase()
                                                        .includes(input.toString().toLowerCase());
                                                // isTrue = true;
                                            }
                                        }
                                    } else {
                                        if (
                                            el[searchableList[k]] !== undefined &&
                                            el[searchableList[k]] !== null
                                        ) {
                                            // && el[searchableList[k]].toString().toLowerCase().includes(input.toString().toLowerCase())) {
                                            isTrue =
                                                (typeof el[searchableList[k]] === 'number' &&
                                                    formatAsSumNoMath(el[searchableList[k]]).includes(
                                                        input.toString().toLowerCase()
                                                    )) ||
                                                el[searchableList[k]]
                                                    .toString()
                                                    .toLowerCase()
                                                    .includes(input.toString().toLowerCase());
                                            // isTrue = true;
                                        }
                                    }
                                } else {
                                    if (parentName) {
                                        if (el[parentName]) {
                                            if (
                                                el[parentName][searchableList[k]] !== undefined &&
                                                el[parentName][searchableList[k]] !== null
                                            ) {
                                                if (input === 'true' && el[searchableList[k]] < 0) {
                                                    isTrue = true;
                                                } else if (
                                                    input === 'false' &&
                                                    el[parentName][searchableList[k]] >= 0
                                                ) {
                                                    isTrue = true;
                                                }
                                            }
                                        }
                                    } else {
                                        if (
                                            el[searchableList[k]] !== undefined &&
                                            el[searchableList[k]] !== null
                                        ) {
                                            if (input === 'true' && el[searchableList[k]] < 0) {
                                                isTrue = true;
                                            } else if (
                                                input === 'false' &&
                                                el[searchableList[k]] >= 0
                                            ) {
                                                isTrue = true;
                                            }
                                        }
                                    }
                                }
                                if (isTrue) {
                                    return el;
                                }
                            }
                        }
                    });
                }
            }
        } else {
            return items.filter(
                (item) => item.toLowerCase().indexOf(input.toLowerCase()) !== -1
            );
        }
    }
}

@Pipe({
    name: 'filterPipeBiggerSmaller',
    pure: true
})
export class FilterPipeBiggerSmaller implements PipeTransform {
    transform(
        items: any,
        input: any,
        searchableList: any,
        val?: string,
        bigger?: boolean
    ): any {
        if (!items || !input) {
            return items;
        }
        return items.filter(function (el: any) {
            for (const k in searchableList) {
                if (searchableList.hasOwnProperty(k)) {
                    for (let idx = 0; idx < input.length; idx++) {
                        if (
                            el[searchableList[k]] !== undefined &&
                            el[searchableList[k]] !== null
                        ) {
                            if (el[searchableList[k]] === input[0]) {
                                if (bigger) {
                                    if (el[val] >= new Date().getTime()) {
                                        return el;
                                    }
                                } else {
                                    if (el[val] < new Date().getTime()) {
                                        return el;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
    }
}
