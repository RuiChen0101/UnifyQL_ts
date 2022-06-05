import IExpressionTreeNode from "./ExpressionTreeNode";

import EUnifyQLOperation from "../unify-ql-element/EUnifyQLOperation";

class OutputTargetNode extends IExpressionTreeNode {
    public readonly operation: EUnifyQLOperation;
    public readonly outputTarget: string;
    public readonly queryField?: string;
    public readonly orderBy?: string[];
    public readonly limit?: number[];

    constructor(operation: EUnifyQLOperation, outputTarget: string, queryField?: string, orderBy?: string[], limit?: number[]) {
        super();
        this.operation = operation;
        this.queryField = queryField;
        this.outputTarget = outputTarget;
        this.orderBy = orderBy;
        this.limit = limit;
    }

    public setLeftNode(node?: IExpressionTreeNode): void {
        this._leftNode = node;
    }
}

export default OutputTargetNode;