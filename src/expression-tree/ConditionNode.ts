import ExpressionTreeBuildException from "../exception/ExpressionTreeBuildException";
import ExpressionTreeBuilder from "./ExpressionTreeBuilder";
import IExpressionTreeNode from "./ExpressionTreeNode";

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
        const regex: RegExp = /[\(]?\s*([\d\w]*)\.([\d\w]*)\s*([\&\|\+\-\*\/])?\s*([\"\d\w]*)?\s*[\)]?\s*(=|!=|<|<=|>|>=|LIKE|NOT IN|IN|IS NULL|IS NOT NULL)\s*([^\s]+)*|/g;
        const capturedGroups: RegExpExecArray | null = regex.exec(this.conditionStr);
        if (capturedGroups === null) throw new ExpressionTreeBuildException('Condition info format mismatch');
        this.table = capturedGroups[1];
        this.field = capturedGroups[2];
        this.modifier = capturedGroups[3] as (ModifierOp | undefined);
        this.modifyValue = capturedGroups[4];
        this.conditionOp = capturedGroups[5] as ConditionOp;
        this.conditionValue = capturedGroups[6];
    }

    public static isValidCondition(str: string): boolean {
        const regex: RegExp = /[\(]?\s*([\d\w]*)\.([\d\w]*)\s*([\&\|\+\-\*\/])?\s*([\"\d\w]*)?\s*[\)]?\s*(=|!=|<|<=|>|>=|LIKE|NOT IN|IN)\s*([^\s]+)|[\(]?\s*([\d\w]*)\.([\d\w]*)\s*([\&\|\+\-\*\/])?\s*([\"\d\w]*)?\s*[\)]?\s*(IS NULL|IS NOT NULL)/g;
        return regex.test(str);
    }
}

export default ConditionNode;