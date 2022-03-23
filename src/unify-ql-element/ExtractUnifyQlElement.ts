import IQLElement from "./IUnifyQLElement";

export default function extractQLElement(queryStr: string): IQLElement {
    const result: IQLElement = {
        queryTarget: '',
        with: [],
        link: [],
        where: ''
    }

    const regex: RegExp = /\s*(QUERY|WITH|LINK|WHERE|ORDER BY|LIMIT)\s*/gm;
    const splitQueryStr: string[] = queryStr.split(regex).filter(e => e !== '');
    for (let i = 0; i < splitQueryStr.length; i += 2) {
        const keyword = splitQueryStr[i];
        const value = splitQueryStr[i + 1];
        switch (keyword) {
            case 'QUERY':
                result.queryTarget = value;
                break;
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