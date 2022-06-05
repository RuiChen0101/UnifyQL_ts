import EUnifyQLOperation from "../unify-ql-element/EUnifyQLOperation"

export default interface IExecutionPlan {
    operation: EUnifyQLOperation;
    query: string;
    with: string[];
    link: string[];
    where: string;
    orderBy?: string[];
    limit?: number[];
    dependency: { [key: string]: IExecutionPlan };
}