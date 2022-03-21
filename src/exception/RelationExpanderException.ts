export default class RelationExpanderException extends Error {
    public readonly message: string;

    constructor(message: string) {
        super(message);
        this.message = message;
    }
}