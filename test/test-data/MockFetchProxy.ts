class FakeResult {
    public status: number;
    public ok: boolean;
    private resBody: string;
    constructor(resCode: number, resBody: string) {
        this.resBody = resBody;
        this.status = resCode;
        this.ok = resCode >= 200 && resCode < 300;
    }

    async json(): Promise<any> {
        return JSON.parse(this.resBody);
    }

    async text(): Promise<any> {
        return this.resBody;
    }
}

class Request {
    public readonly reqUrl: string;
    public readonly reqOption: any;
    public readonly timeout?: number
    constructor(reqUrl: string, reqOption: any, timeout: number) {
        this.reqUrl = reqUrl;
        this.reqOption = reqOption;
        this.timeout = timeout;
    }
}

let fakeResult: FakeResult[] = [];

export var requests: Request[] = [];

export function setJsonResult(resCode: number, resBody: {}) {
    fakeResult.push(new FakeResult(resCode, JSON.stringify(resBody)));
}

export function setTextResult(resCode: number, resBody: string) {
    fakeResult.push(new FakeResult(resCode, resBody));
}

export function clearResult() {
    fakeResult = [];
    requests = [];
}

class MockFetchProxy {
    async fetch(url: string, option: any, timeout: number = 5000): Promise<any> {
        requests.push(new Request(url, option, timeout));
        return fakeResult.shift();
    }
}

export default MockFetchProxy;