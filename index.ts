import cors from 'cors';
import express, { Express, Request, Response } from 'express';

const app: Express = express();

app.use(cors({ origin: true }));

app.get('/health', (request: Request, response: Response) => {
    response.send('hello world');
});

app.post('/query', (request: Request, response: Response) => {
    response.send('hello world');
});

app.listen(5000, () => {
    console.log(`server is running on http://localhost:5000`)
});