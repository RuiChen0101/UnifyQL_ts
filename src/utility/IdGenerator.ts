import { customAlphabet } from 'nanoid';

class IdGenerator {
    public nano8(): string {
        const nano8 = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 8)
        return nano8();
    }
}

export default IdGenerator;