import IUnifyQLConverter from "./IUnifyQLConverter";
import BadFormatException from "../exception/BadFormatException";
import EUnifyQLOperation from "../unify-ql-element/EUnifyQLOperation";
import extractQLElement from "../unify-ql-element/ExtractUnifyQlElement";

class UnifyQLtoSQLConverter implements IUnifyQLConverter {
    public convert(unifyQl: string): string {
        const element = extractQLElement(unifyQl);
        const result: string[] = [];
        element.with.push(element.queryTarget);
        switch (element.operation) {
            case EUnifyQLOperation.Query:
                if (element.queryField !== undefined) {
                    result.push(`SELECT ${element.queryTarget}.${element.queryField} ${element.queryField}`);
                } else {
                    result.push(`SELECT ${element.queryTarget}.*`);
                }
                break;
            case EUnifyQLOperation.Count:
                result.push(`SELECT count(${element.queryTarget}.*) count`);
                break;
            case EUnifyQLOperation.Sum:
                if (element.queryField === undefined) {
                    throw new BadFormatException('Invalid format');
                }
                result.push(`SELECT sum(${element.queryTarget}.${element.queryField}) sum`);
                break;
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