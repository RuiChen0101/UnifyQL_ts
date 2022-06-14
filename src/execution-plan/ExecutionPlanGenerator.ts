import injector from '../utility/Injector';
import IExecutionPlan from './IExecutionPlan';
import IdGenerator from '../utility/IdGenerator';
import ServiceLookup from '../lookup/ServiceLookup';
import RelationNode from '../expression-tree/RelationNode';
import ConditionNode from '../expression-tree/ConditionNode';
import OutputTargetNode from '../expression-tree/OutputTargetNode';
import EUnifyQLOperation from '../unify-ql-element/EUnifyQLOperation';
import BinaryOperatorNode from '../expression-tree/BinaryOperatorNode';
import IExpressionTreeNode from '../expression-tree/ExpressionTreeNode';
import ExecutionPlanGeneratorException from '../exception/ExecutionPlanGeneratorException';

class ExecutionPlanGenerator {
    private _serviceLookup: ServiceLookup;
    private _expressionTree: IExpressionTreeNode;
    private _executionPlan?: IExecutionPlan;

    constructor(expressionTree: IExpressionTreeNode, serviceLookup: ServiceLookup) {
        this._expressionTree = expressionTree;
        this._serviceLookup = serviceLookup;
    }

    public generate(): void {
        if (this._expressionTree instanceof BinaryOperatorNode) {
            this.buildBinaryOperator();
        } else if (this._expressionTree instanceof ConditionNode) {
            this.buildCondition();
        } else if (this._expressionTree instanceof RelationNode) {
            this.buildRelation();
        } else if (this._expressionTree instanceof OutputTargetNode) {
            this.buildOutputTargetNode();
        } else {
            throw new ExecutionPlanGeneratorException('Invalid expression tree');
        }
    }

    public getExecutionPlan(): IExecutionPlan | undefined {
        if (this._executionPlan === undefined) return undefined;
        return {
            operation: this._executionPlan.operation,
            query: this._executionPlan.query,
            with: [...new Set(this._executionPlan.with)],
            link: [...new Set(this._executionPlan.link)],
            where: this._executionPlan.where,
            orderBy: this._executionPlan.orderBy,
            limit: this._executionPlan.limit,
            dependency: this._executionPlan.dependency
        }
    }

    private buildOutputTargetNode(): void {
        const rootNode: OutputTargetNode = this._expressionTree as OutputTargetNode;
        const query = rootNode.queryField === undefined ? rootNode.outputTarget : `${rootNode.outputTarget}.${rootNode.queryField}`;
        if (rootNode.leftNode === undefined) {
            this._executionPlan = {
                operation: rootNode.operation,
                query: query,
                with: [],
                link: [],
                where: "",
                orderBy: rootNode.orderBy,
                limit: rootNode.limit,
                dependency: {}
            }
            return
        }

        const Generator = new ExecutionPlanGenerator(rootNode.leftNode!, this._serviceLookup);
        Generator.generate();
        const executionPlan = Generator.getExecutionPlan()!;

        this._executionPlan = {
            operation: rootNode.operation,
            query: query,
            with: executionPlan.with,
            link: executionPlan.link,
            where: executionPlan.where,
            orderBy: rootNode.orderBy,
            limit: rootNode.limit,
            dependency: executionPlan.dependency
        }

    }

    private buildBinaryOperator(): void {
        const rootNode: BinaryOperatorNode = this._expressionTree as BinaryOperatorNode;
        if (rootNode.leftNode === undefined || rootNode.rightNode === undefined) {
            throw new ExecutionPlanGeneratorException('Invalid expression tree');
        }

        const leftGenerator = new ExecutionPlanGenerator(rootNode.leftNode, this._serviceLookup);
        leftGenerator.generate();
        const leftExecutionPlan = leftGenerator.getExecutionPlan()!;

        const rightGenerator = new ExecutionPlanGenerator(rootNode.rightNode, this._serviceLookup);
        rightGenerator.generate();
        const rightExecutionPlan = rightGenerator.getExecutionPlan()!;

        this._executionPlan = {
            operation: EUnifyQLOperation.Query,
            query: rootNode.outputTarget!,
            with: [...leftExecutionPlan.with, ...rightExecutionPlan.with],
            link: [...leftExecutionPlan.link, ...rightExecutionPlan.link],
            where: `(${leftExecutionPlan.where} ${rootNode.opType} ${rightExecutionPlan.where})`,
            dependency: { ...leftExecutionPlan.dependency, ...rightExecutionPlan.dependency }
        }

    }

    private buildCondition(): void {
        const rootNode: ConditionNode = this._expressionTree as ConditionNode;
        this._executionPlan = {
            operation: EUnifyQLOperation.Query,
            query: rootNode.table,
            with: [],
            link: [],
            where: rootNode.conditionStr,
            dependency: {}
        };
    }

    private buildRelation(): void {
        const rootNode: RelationNode = this._expressionTree as RelationNode;
        const generator = new ExecutionPlanGenerator(rootNode.leftNode!, this._serviceLookup);
        generator.generate();
        const childExecutionPlan = generator.getExecutionPlan()!;
        if (this._serviceLookup.isAllFromSameService([childExecutionPlan.query, rootNode.toTable])) {
            this._executionPlan = {
                operation: EUnifyQLOperation.Query,
                query: rootNode.toTable,
                with: [...childExecutionPlan.with, childExecutionPlan.query],
                link: [...childExecutionPlan.link, `${rootNode.fromTable}.${rootNode.fromField}=${rootNode.toTable}.${rootNode.toField}`],
                where: childExecutionPlan.where,
                dependency: childExecutionPlan.dependency
            };
        } else {
            childExecutionPlan.query = `${rootNode.fromTable}.${rootNode.fromField}`;
            const dependencyId = injector.get<IdGenerator>('IdGenerator').nano8();
            this._executionPlan = {
                operation: EUnifyQLOperation.Query,
                query: rootNode.toTable,
                with: [],
                link: [],
                where: `${rootNode.toTable}.${rootNode.toField} IN {${dependencyId}}`,
                dependency: {}
            };
            this._executionPlan.dependency[dependencyId] = childExecutionPlan
        }
    }
}

export default ExecutionPlanGenerator;