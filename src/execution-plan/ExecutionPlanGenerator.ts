import injector from '../utility/Injector';
import IExecutionPlan from './IExecutionPlan';
import IdGenerator from '../utility/IdGenerator';
import ServiceLookup from '../lookup/ServiceLookup';
import RelationNode from '../expression-tree/RelationNode';
import ConditionNode from '../expression-tree/ConditionNode';
import BinaryOperatorNode from '../expression-tree/BinaryOperatorNode';
import IExpressionTreeNode from '../expression-tree/ExpressionTreeNode';
import ExecutionPlanGeneratorException from '../exception/ExecutionPlanGeneratorException';

interface InternalExecutionPlan {
    select: string,
    from: Set<string>,
    link: Set<string>,
    where: string,
    dependency: { [key: string]: IExecutionPlan }
}

class ExecutionPlanGenerator {
    private _expressionTree: IExpressionTreeNode;
    private _executionPlan?: InternalExecutionPlan;

    constructor(expressionTree: IExpressionTreeNode) {
        this._expressionTree = expressionTree;
    }

    public generate(): string {
        if (this._expressionTree instanceof BinaryOperatorNode) {
            return this.buildBinaryOperator();
        } else if (this._expressionTree instanceof ConditionNode) {
            return this.buildCondition();
        } else if (this._expressionTree instanceof RelationNode) {
            return this.buildRelation();
        } else {
            throw new ExecutionPlanGeneratorException('Invalid expression tree');
        }
    }

    public getExecutionPlan(): IExecutionPlan | undefined {
        if (this._executionPlan === undefined) return undefined;
        return {
            select: this._executionPlan.select,
            from: Array.from(this._executionPlan.from),
            link: Array.from(this._executionPlan.link),
            where: this._executionPlan.where,
            dependency: this._executionPlan.dependency
        }
    }

    private buildBinaryOperator(): string {
        const rootNode: BinaryOperatorNode = this._expressionTree as BinaryOperatorNode;
        if (rootNode.leftNode === undefined || rootNode.rightNode === undefined) {
            throw new ExecutionPlanGeneratorException('Invalid expression tree');
        }

        const leftGenerator = new ExecutionPlanGenerator(rootNode.leftNode);
        leftGenerator.generate();
        const leftExecutionPlan = leftGenerator.getExecutionPlan()!;

        const rightGenerator = new ExecutionPlanGenerator(rootNode.rightNode);
        rightGenerator.generate();
        const rightExecutionPlan = rightGenerator.getExecutionPlan()!;

        this._executionPlan = {
            select: rootNode.outputTarget!,
            from: new Set<string>([...leftExecutionPlan.from, ...rightExecutionPlan.from]),
            link: new Set<string>([...leftExecutionPlan.link, ...rightExecutionPlan.link]),
            where: `(${leftExecutionPlan.where} ${rootNode.opType} ${rightExecutionPlan.where})`,
            dependency: { ...leftExecutionPlan.dependency, ...rightExecutionPlan.dependency }
        }

        return rootNode.outputTarget!;
    }

    private buildCondition(): string {
        const rootNode: ConditionNode = this._expressionTree as ConditionNode;
        this._executionPlan = {
            select: rootNode.table,
            from: new Set<string>([rootNode.table]),
            link: new Set<string>([]),
            where: rootNode.conditionStr,
            dependency: {}
        };
        return rootNode.table;
    }

    private buildRelation(): string {
        const rootNode: RelationNode = this._expressionTree as RelationNode;
        const generator = new ExecutionPlanGenerator(rootNode.leftNode!);
        const resultTable = generator.generate();
        const childExecutionPlan = generator.getExecutionPlan()!;
        if (injector.get<ServiceLookup>('ServiceLookup').isAllFromSameService([resultTable, rootNode.toTable])) {
            this._executionPlan = {
                select: rootNode.toTable,
                from: new Set<string>([...childExecutionPlan.from, rootNode.toTable]),
                link: new Set<string>([...childExecutionPlan.link, `${rootNode.fromTable}.${rootNode.fromField}=${rootNode.toTable}.${rootNode.toField}`]),
                where: childExecutionPlan.where,
                dependency: childExecutionPlan.dependency
            };
        } else {
            childExecutionPlan.select = `${rootNode.fromTable}.${rootNode.fromField}`;
            const dependencyId = injector.get<IdGenerator>('IdGenerator').nano8();
            this._executionPlan = {
                select: rootNode.toTable,
                from: new Set<string>([rootNode.toTable]),
                link: new Set<string>([]),
                where: `${rootNode.toTable}.${rootNode.toField} IN {${dependencyId}}`,
                dependency: {}
            };
            this._executionPlan.dependency[dependencyId] = childExecutionPlan
        }
        return rootNode.toTable;
    }
}

export default ExecutionPlanGenerator;