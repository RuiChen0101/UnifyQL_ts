import IUnifyQLElement from "./IUnifyQLElement";
import EUnifyQLOperation from "./EUnifyQLOperation";
import BadFormatException from "../exception/BadFormatException";

export default function extractQLElement(queryStr: string): IUnifyQLElement {
    const result: IUnifyQLElement = {
        operation: EUnifyQLOperation.Query,
        queryTarget: '',
        with: [],
        link: [],
        where: ''
    }

    const operationRegex: RegExp = /(QUERY|SUM|COUNT)\s*([^\s]+)\s*(.*)/gm;
    const capturedGroups: RegExpExecArray | null = operationRegex.exec(queryStr);
    if (capturedGroups === null) throw new BadFormatException('Invalid format');

    switch (capturedGroups[1]) {
        case 'QUERY':
            result.operation = EUnifyQLOperation.Query;
            break;
        case 'SUM':
            result.operation = EUnifyQLOperation.Sum;
            break;
        case 'COUNT':
            result.operation = EUnifyQLOperation.Count;
            break;
    }
    const splitQueryTarget = capturedGroups[2].split('.');
    result.queryTarget = splitQueryTarget[0];
    result.queryField = splitQueryTarget[1];

    const splitRegex: RegExp = /\s*(WITH|LINK|WHERE|ORDER BY|LIMIT)\s*/gm;
    const splitQueryStr: string[] = capturedGroups[3].split(splitRegex).filter(e => e !== '');
    for (let i = 0; i < splitQueryStr.length; i += 2) {
        const keyword = splitQueryStr[i];
        const value = splitQueryStr[i + 1];
        switch (keyword) {
            case 'WITH':
                result.with = value.split(/\s*,\s*/);
                break;
            case 'LINK':
                result.link = value.split(/\s*,\s*/);
                break;
            case 'WHERE':
                result.where = value;
                break;
            case 'ORDER BY':
                result.orderBy = value.split(/\s*,\s*/);
                break;
            case 'LIMIT':
                result.limit = value.split(/\s*,\s*/).map(e => parseInt(e));
                break;
        }
    }

    return result;
}