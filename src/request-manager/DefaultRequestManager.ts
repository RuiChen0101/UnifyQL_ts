import * as http from 'http';
import * as https from 'https';
import { AbortController } from 'abort-controller';
import fetch, { Response } from 'node-fetch';

const httpAgent = new http.Agent({
    keepAlive: true
});
const httpsAgent = new https.Agent({
    keepAlive: true
});

import IRequestManager, { IRequestResponse } from './IRequestManager';

class DefaultRequestManager implements IRequestManager {
    public async request(url: string, uqlPayload: string): Promise<IRequestResponse> {
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => {
            controller.abort();
        }, 5000);
        try {
            const res: Response = await fetch(url, {
                method: 'post',
                body: uqlPayload,
                signal: controller.signal,
                agent: function (_parsedURL: any) {
                    if (_parsedURL.protocol === 'http:') {
                        return httpAgent;
                    } else {
                        return httpsAgent;
                    }
                }
            });
            if (!res.ok) {
                const body = await res.clone().text();
                console.error(`POST ${url} ${res.status}`, { req: uqlPayload, res: body });
                return {
                    data: [],
                    status: res.status,
                }
            }
            return {
                data: await res.json() as any[],
                status: 200
            };
        } catch (err: any) {
            console.error(`POST ${url} TIMEOUT`, { req: uqlPayload });
            throw new Error('Fetch timeout');
        } finally {
            clearTimeout(timeoutTimer);
        }
    }
}

export default DefaultRequestManager;