import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // API methods
  get<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, options) as Observable<T>;
  }

  post<T>(endpoint: string, data: any, options?: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, data, options) as Observable<T>;
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  patch<T>(endpoint: string, data: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, data);
  }

  delete<T>(endpoint: string, options?: any): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, options) as Observable<T>;
  }
}


