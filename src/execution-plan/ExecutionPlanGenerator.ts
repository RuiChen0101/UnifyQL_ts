import injector from '../utility/Injector';
import IExecutionPlan from './IExecutionPlan';
import IdGenerator from '../utility/IdGenerator';
import ServiceLookup from '../lookup/ServiceLookup';
import RelationNode from '../expression-tree/RelationNode';
import ConditionNode from '../expression-tree/ConditionNode';
import OutputTargetNode from '../expression-tree/OutputTargetNode';
import BinaryOperatorNode from '../expression-tree/BinaryOperatorNode';
import IExpressionTreeNode from '../expression-tree/ExpressionTreeNode';
import ExecutionPlanGeneratorException from '../exception/ExecutionPlanGeneratorException';

interface InternalExecutionPlan {
    query: string,
    with: Set<string>,
    link: Set<string>,
    where: string,
    orderBy?: string[],
    limit?: number[],
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
        } else if (this._expressionTree instanceof OutputTargetNode) {
            return this.buildOutputTargetNode();
        } else {
            throw new ExecutionPlanGeneratorException('Invalid expression tree');
        }
    }

    public getExecutionPlan(): IExecutionPlan | undefined {
        if (this._executionPlan === undefined) return undefined;
        return {
            query: this._executionPlan.query,
            with: Array.from(this._executionPlan.with),
            link: Array.from(this._executionPlan.link),
            where: this._executionPlan.where,
            orderBy: this._executionPlan.orderBy,
            limit: this._executionPlan.limit,
            dependency: this._executionPlan.dependency
        }
    }

    private buildOutputTargetNode(): string {
        const rootNode: OutputTargetNode = this._expressionTree as OutputTargetNode;
        if (rootNode.leftNode === undefined) {
            this._executionPlan = {
                query: rootNode.outputTarget,
                with: new Set<string>([]),
                link: new Set<string>([]),
                where: "",
                orderBy: rootNode.orderBy,
                limit: rootNode.limit,
                dependency: {}
            }

            return rootNode.outputTarget;
        }

        const Generator = new ExecutionPlanGenerator(rootNode.leftNode!);
        Generator.generate();
        const executionPlan = Generator.getExecutionPlan()!;

        this._executionPlan = {
            query: rootNode.outputTarget,
            with: new Set<string>(executionPlan.with),
            link: new Set<string>(executionPlan.link),
            where: executionPlan.where,
            orderBy: rootNode.orderBy,
            limit: rootNode.limit,
            dependency: executionPlan.dependency
        }

        return rootNode.outputTarget.split('.')[0];
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
            query: rootNode.outputTarget!,
            with: new Set<string>([...leftExecutionPlan.with, ...rightExecutionPlan.with]),
            link: new Set<string>([...leftExecutionPlan.link, ...rightExecutionPlan.link]),
            where: `(${leftExecutionPlan.where} ${rootNode.opType} ${rightExecutionPlan.where})`,
            dependency: { ...leftExecutionPlan.dependency, ...rightExecutionPlan.dependency }
        }

        return rootNode.outputTarget!;
    }

    private buildCondition(): string {
        const rootNode: ConditionNode = this._expressionTree as ConditionNode;
        this._executionPlan = {
            query: rootNode.table,
            with: new Set<string>([]),
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
                query: rootNode.toTable,
                with: new Set<string>([...childExecutionPlan.with, childExecutionPlan.query]),
                link: new Set<string>([...childExecutionPlan.link, `${rootNode.fromTable}.${rootNode.fromField}=${rootNode.toTable}.${rootNode.toField}`]),
                where: childExecutionPlan.where,
                dependency: childExecutionPlan.dependency
            };
        } else {
            childExecutionPlan.query = `${rootNode.fromTable}.${rootNode.fromField}`;
            const dependencyId = injector.get<IdGenerator>('IdGenerator').nano8();
            this._executionPlan = {
                query: rootNode.toTable,
                with: new Set<string>([]),
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