interface IRequestResponse {
    data: any[],
    status: number;
}


interface IRequestManager {
    request(url: string, uqlPayload: string): Promise<IRequestResponse>;
}

export { IRequestResponse };
export default IRequestManager;