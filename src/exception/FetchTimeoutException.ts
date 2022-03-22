export default class FetchTimeoutException extends Error {
    constructor() {
        super('Fetch timeout');
    }
}