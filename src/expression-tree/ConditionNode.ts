import IExpressionTreeNode from "./ExpressionTreeNode";
import BadFormatException from "../exception/BadFormatException";

type ModifierOp = '&' | '|' | '+' | '-' | '*' | '/';
type ConditionOp = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'LIKE' | 'IS NULL' | 'IS NOT NULL' | 'IN';

class ConditionNode extends IExpressionTreeNode {
    public readonly conditionStr: string;
    public readonly table: string;

    constructor(conditionStr: string) {
        super();
        this.conditionStr = conditionStr;
        const regex: RegExp = /[\(]?\s*(\w*)\.(\w*)\s*([\&\|\+\-\*\/])?\s*([^)]*)?\s*[\)]?\s*(=|!=|<|<=|>|>=|LIKE|NOT IN|IN|IS NULL|IS NOT NULL)\s*(.*)/g;
        const capturedGroups: RegExpExecArray | null = regex.exec(this.conditionStr);
        if (capturedGroups === null) throw new BadFormatException('Invalid format');
        this.table = capturedGroups[1];
        if (!ConditionNode.isValidValue(capturedGroups[5] as ConditionOp, capturedGroups[6]))
            throw new BadFormatException('Invalid format');
    }

    public static isValidValue(op: string, value?: string): boolean {
        if (/=|!=|<|<=|>|>=|LIKE/.test(op)) {
            return value !== null && /^\d+$|^"[^"]+"$/.test(value!);
        } else if (/IS NULL|IS NOT NULL/.test(op)) {
            return value === null || value === '';
        } else if (/IN|NOT IN/.test(op)) {
            return value !== null && /^\(([^\(\),]+,)*([^\(\),]+)\)$/.test(value!);
        }
        return false;
    }
}

export default ConditionNode;