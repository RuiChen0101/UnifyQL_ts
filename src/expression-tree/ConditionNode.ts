import ExpressionTreeBuildException from "../exception/ExpressionTreeBuildException";
import ExpressionTreeBuilder from "./ExpressionTreeBuilder";
import IExpressionTreeNode from "./ExpressionTreeNode";

type ModifierOp = '&' | '|' | '+' | '-' | '*' | '/';
type ConditionOp = '=' | '!=' | '<' | '<=' | '>' | '>=' | 'IS NULL' | 'IS NOT NULL' | 'IN';

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
        const rx: RegExp = /[\(]?\s*([\d\w]*)\.([\d\w]*)\s*([\&\|\+\-\*\/])?\s*([\"\d\w]*)?\s*[\)]?\s*(=|!=|<|<=|>|>=|IS NULL|IS NOT NULL|IN)\s*(.*)?/g;
        const capturedGroups: RegExpExecArray | null = rx.exec(this.conditionStr);
        if (capturedGroups === null) throw new ExpressionTreeBuildException('Condition info format mismatch');
        this.table = capturedGroups[1];
        this.field = capturedGroups[2];
        this.modifier = capturedGroups[3] as (ModifierOp | undefined);
        this.modifyValue = capturedGroups[4];
        this.conditionOp = capturedGroups[5] as ConditionOp;
        this.conditionValue = capturedGroups[6];
    }
}

export default ConditionNode;