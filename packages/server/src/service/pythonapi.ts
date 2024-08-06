import axios, { AxiosResponse } from 'axios';

class PythonAPIClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    async test(): Promise<unknown> {
        const endpoint = '/test';
        try {
            const response: AxiosResponse = await axios.get(this.baseUrl + endpoint);
            console.log('Test endpoint response:', response.data);
            return response.data
        } catch (error) {
            console.error('Error calling test endpoint:', error);
        }
    }
}

export default new PythonAPIClient(process.env.PYTHON_API_HOST || "")
