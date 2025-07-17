import { Preferences } from '@capacitor/preferences';

export interface AuthResponse {
  result: string;
  user?: any;
  message?: string;
}

export interface UserData {
  email: string;
  password: string;
  appname: string;
}

export class AuthService {
  private baseUrl = 'http://aspiringapps.com/api';

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const userData: UserData = {
        email: email.toLowerCase(),
        password: password,
        appname: 'GovtInvoiceNew'
      };

      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: userData })
      });

      const result = await response.json();
      
      if (result.result === 'ok' && result.user) {
        await this.setToken(result.user);
      }
      
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return { result: 'error', message: 'Login failed' };
    }
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    try {
      const userData: UserData = {
        email: email.toLowerCase(),
        password: password,
        appname: 'GovtInvoiceNew'
      };

      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: userData })
      });

      const result = await response.json();
      
      if (result.result === 'ok' && result.user) {
        await this.setToken(result.user);
      }
      
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return { result: 'error', message: 'Registration failed' };
    }
  }

  async logout(): Promise<boolean> {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      await this.removeToken();
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  async getToken(): Promise<string | null> {
    try {
      const result = await Preferences.get({ key: 'authToken' });
      return result.value;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      await Preferences.set({ key: 'authToken', value: token });
    } catch (error) {
      console.error('Set token error:', error);
    }
  }

  async removeToken(): Promise<void> {
    try {
      await Preferences.remove({ key: 'authToken' });
    } catch (error) {
      console.error('Remove token error:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }
}
