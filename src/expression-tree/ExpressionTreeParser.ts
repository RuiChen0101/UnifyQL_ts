import IUnifyQLElement from "../unify-ql-element/IUnifyQLElement";
import ExpressionTreeBuilder from "./ExpressionTreeBuilder";
import IExpressionTreeNode from "./ExpressionTreeNode";
import OutputTargetNode from "./OutputTargetNode";

class ExpressionTreeParser {

    public parse(element: IUnifyQLElement): IExpressionTreeNode {
        const outputNode = new OutputTargetNode(element.operation, element.queryTarget, element.queryField, element.orderBy, element.limit);
        if (element.where === '') {
            return outputNode;
        }
        const regex: RegExp = /\s*(AND|OR|\(|\))\s*/gm;
        const tokens: string[] = element.where.split(regex);
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
        outputNode.setLeftNode(builder.getResult());
        return outputNode;
    }
}

export default ExpressionTreeParser;