export default class UnsupportedOperationException extends Error {
    public readonly message: string;

    constructor(message: string = 'unsupported operation') {
        super(message);
        this.message = message;
    }
}