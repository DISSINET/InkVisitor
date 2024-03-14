import fetch from 'node-fetch';

class PythonAPIClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async test(): Promise<void> {
        const endpoint = '/test';
        try {
            const response = await fetch(this.baseUrl + endpoint);
            if (!response.ok) {
                throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Test endpoint response:', data);
        } catch (error) {
            console.error('Error calling test endpoint:', error);
        }
    }
}
