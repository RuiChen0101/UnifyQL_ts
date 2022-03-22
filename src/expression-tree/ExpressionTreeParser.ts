import ExpressionTreeBuilder from "./ExpressionTreeBuilder";
import IExpressionTreeNode from "./ExpressionTreeNode";
import OutputTargetNode from "./OutputTargetNode";

class ExpressionTreeParser {

    public parse(query: string, whereStr: string, orderBy?: string[], limit?: number[]): IExpressionTreeNode {
        const regex: RegExp = /\s*(AND|OR|\(|\))\s*/gm;
        const tokens: string[] = whereStr.split(regex);
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        for (const token of tokens) {
            switch (token) {
                case 'OR':
                    builder.buildOr();
                    break;
                case 'AND':
                    builder.buildAnd();
                    break;
                case '(':
                    builder.startBuildParentheses();
                    break;
                case ')':
                    builder.endBuildParentheses();
                    break;
                case '':
                    break;
                default:
                    builder.buildCondition(token);
                    break;
            }
        }
        const outputNode = new OutputTargetNode(query, orderBy, limit);
        outputNode.setLeftNode(builder.getResult());
        return outputNode;
    }
}

export default ExpressionTreeParser;