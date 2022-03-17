import ExpressionTreeBuilder from "./ExpressionTreeBuilder";
import IExpressionTreeNode from "./ExpressionTreeNode";

class ExpressionTreeParser {

    public parse(whereStr: string): IExpressionTreeNode {
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
        return builder.getResult();
    }
}

export default ExpressionTreeParser;