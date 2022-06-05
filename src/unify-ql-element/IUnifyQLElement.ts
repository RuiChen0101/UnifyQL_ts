import EUnifyQLOperation from "./EUnifyQLOperation";

export default interface IUnifyQLElement {
    operation: EUnifyQLOperation;
    queryTarget: string;
    queryField?: string;
    with: string[];
    link: string[];
    where: string;
    orderBy?: string[];
    limit?: number[];
}