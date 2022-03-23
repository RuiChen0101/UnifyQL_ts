import IUnifyQLConverter from "./IUnifyQLConverter";
import extractQLElement from "../unify-ql-element/ExtractUnifyQlElement";

class UnifyQLtoSQLConverter implements IUnifyQLConverter {
    public convert(unifyQl: string): string {
        const element = extractQLElement(unifyQl);
        const result: string[] = [];
        const targetTable: string = element.queryTarget.split('.')[0];
        element.with.push(targetTable);
        if (element.queryTarget.includes('.')) {
            const targetField: string = element.queryTarget.split('.')[1];
            result.push(`SELECT ${element.queryTarget} ${targetField}`);
        } else {
            result.push(`SELECT ${targetTable}.*`);
        }
        result.push(`FROM ${element.with.join(',')}`);
        if (element.link.length !== 0) {
            result.push(`WHERE ${element.link.join(' AND ')}`);
        }
        if (element.where !== '') {
            if (element.link.length !== 0) {
                result.push('AND');
            } else {
                result.push('WHERE');
            }
            result.push(element.where);
        }
        if (element.orderBy !== undefined && element.orderBy.length !== 0) {
            result.push(`ORDER BY ${element.orderBy.join(',')}`);
        }
        if (element.limit !== undefined && element.limit.length !== 0) {
            result.push(`LIMIT ${element.limit[0]}, ${element.limit[1]}`);
        }
        return result.join(' ');
    }
}

export default UnifyQLtoSQLConverter;