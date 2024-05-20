import axios, { AxiosResponse } from "axios";

class PythonAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async test(): Promise<unknown> {
    const endpoint = "/test";
    try {
      const response: AxiosResponse = await axios.get(this.baseUrl + endpoint);
      console.log("Test endpoint response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error calling test endpoint:", error);
    }
  }

  async segment(text: string): Promise<unknown> {
    const endpoint = "/segment";
    try {
      const response: AxiosResponse = await axios.post(
        this.baseUrl + endpoint,
        { text }
      );
      console.log("Segment endpoint response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error calling segment endpoint:", error);
    }
  }
}

export default new PythonAPIClient(process.env.PYTHON_API_HOST || "");
