import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Iproduct } from './iproduct';
import { HttpClient } from '@angular/common/http';
@Injectable({
  providedIn: 'root'
})
export class ExamServiceService {

  constructor(private http: HttpClient) { }



  getProducts(): Observable<Iproduct[]> {
    const response=this.http.get<Iproduct[]>('http://localhost:3000/products').pipe(
      map(products => {
        return products.map(product => {
          return {
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock
          };
        });
      })
    );
    return response;
  }

  getOrdersByEmail(email: string): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/orders?email=${email}`);
  }


  postOrder(order: any): Observable<any> {
    return this.http.post<any>('http://localhost:3000/orders', order);
  }
}
