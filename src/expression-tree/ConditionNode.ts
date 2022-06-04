import IExpressionTreeNode from "./ExpressionTreeNode";
import BadFormatException from "../exception/BadFormatException";

type ModifierOp = '&' | '|' | '+' | '-' | '*' | '/';
type ConditionOp = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'LIKE' | 'IS NULL' | 'IS NOT NULL' | 'IN';

class ConditionNode extends IExpressionTreeNode {
    public readonly conditionStr: string;
    public readonly table: string;
    public readonly field: string;
    public readonly modifier?: ModifierOp;
    public readonly modifyValue?: string;
    public readonly conditionOp: ConditionOp;
    public readonly conditionValue?: string;

    constructor(conditionStr: string) {
        super();
        this.conditionStr = conditionStr;
        const regex: RegExp = /[\(]?\s*(\w*)\.(\w*)\s*([\&\|\+\-\*\/])?\s*([^)]*)?\s*[\)]?\s*(=|!=|<|<=|>|>=|LIKE|NOT IN|IN|IS NULL|IS NOT NULL)\s*(.*)/g;
        const capturedGroups: RegExpExecArray | null = regex.exec(this.conditionStr);
        if (capturedGroups === null) throw new BadFormatException('Invalid format');
        this.table = capturedGroups[1];
        this.field = capturedGroups[2];
        this.modifier = capturedGroups[3] as (ModifierOp | undefined);
        this.modifyValue = capturedGroups[4];
        this.conditionOp = capturedGroups[5] as ConditionOp;
        this.conditionValue = capturedGroups[6];
        if (!ConditionNode.isValidValue(this.conditionOp, this.conditionValue))
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

    public static isValidCondition(str: string): boolean {
        try {
            new ConditionNode(str);
            return true;
        } catch (e) {
            return false;
        }
    }
}

export default ConditionNode;