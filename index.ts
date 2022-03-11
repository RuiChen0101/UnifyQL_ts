import 'dotenv/config';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';

const app: Express = express();

app.use(cors({ origin: true }));

console.log(process.env.SERVICE_USER_URL);

app.get('/health', (request: Request, response: Response) => {
    response.send('hello world');
});

app.post('/query', (request: Request, response: Response) => {
    response.send('hello world');
});

app.listen(9990, () => {
    console.log('server is running on http://localhost:9990')
});