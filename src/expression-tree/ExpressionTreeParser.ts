import ExpressionTreeBuilder from "./ExpressionTreeBuilder";
import IExpressionTreeNode from "./ExpressionTreeNode";

class ExpressionTreeParser {

    public parser(whereStr: string): IExpressionTreeNode {
        // const regex: RegExp = /\s*(AND|OR|\(|\))\s*/gm;
        // const tokens: string[] = whereStr.split(regex);
        const builder: ExpressionTreeBuilder = new ExpressionTreeBuilder();
        // const nodeStack: IExpressionTreeNode[] = [];
        // let expressionTree: IExpressionTreeNode | undefined = undefined;
        // for (const token of tokens) {
        //     switch (token) {
        //         case 'OR':

        //         case 'AND':
        //         case '(':
        //         case ')':
        //         default:
        //             if (expressionTree === undefined) {
        //                 expressionTree = new 
        //             }
        //     }
        // }
        return builder.getResult();
    }
}

export default ExpressionTreeParser;