export interface CloudResponse {
  result: string;
  data?: any;
  message?: string;
  pdfurl?: string;
}

export interface SaveData {
  appname: string;
  filename: string;
  content: string;
}

export class CloudService {
  private baseUrl = 'http://aspiringapps.com/api';

  constructor() {
  }

  async createPDF(content: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/htmltopdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content })
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Create PDF error:', error);
      throw error;
    }
  }

  async saveToServer(data: SaveData): Promise<CloudResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data })
      });

      return await response.json();
    } catch (error) {
      console.error('Save to server error:', error);
      return { result: 'error', message: 'Save failed' };
    }
  }

  async listFiles(appname: string): Promise<CloudResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/list?appname=${appname}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return await response.json();
    } catch (error) {
      console.error('List files error:', error);
      return { result: 'error', message: 'List files failed' };
    }
  }

  async deleteFile(filename: string, appname: string): Promise<CloudResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/delete?appname=${appname}&filename=${filename}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Delete file error:', error);
      return { result: 'error', message: 'Delete failed' };
    }
  }

  async restorePurchases(appname: string, key: string): Promise<CloudResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/purchases?appname=${appname}&key=${key}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Restore purchases error:', error);
      return { result: 'error', message: 'Restore failed' };
    }
  }
}
