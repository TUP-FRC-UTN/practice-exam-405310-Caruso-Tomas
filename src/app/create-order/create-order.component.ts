import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormArray, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Iproduct } from '../iproduct';
import { ExamServiceService } from '../exam-service.service';
import { Observable } from 'rxjs/internal/Observable';
import { map, of, Subscription, switchMap } from 'rxjs';
import { Order } from '../order';
import { PruebaDirective } from '../prueba.directive';
@Component({
  selector: 'app-create-order',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,PruebaDirective],
  templateUrl: './create-order.component.html',
  styleUrl: './create-order.component.css'
})
export class CreateOrderComponent {
  getProducts$ = new Observable<Iproduct[]>();
  getProductsSub = new Subscription();
  productsFromAPI: Iproduct[] = [];
  orderForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(3)]),
    email: new FormControl('', [Validators.required, Validators.email]),
    products: new FormArray([], [Validators.required, 
      this.atLeastOneProduct(),this.max10Products()]), //falta nonduplicated
  });
  constructor(private service: ExamServiceService) {
    
  }
  
  get products() {
    return this.orderForm?.get('products') as FormArray;
  }


  ngOnInit() {
    this.getProducts$ = this.service.getProducts();
    this.getProductsSub= this.getProducts$.subscribe(products => {
      console.log(products);
      this.productsFromAPI = products;
    });
    this.orderForm.get('email')?.setAsyncValidators(this.emailOrderLimitValidator());
    
  }

  changeEmail() {
    this.orderForm.get('email')?.valueChanges.subscribe(value => {
      this.orderForm.get('email')?.updateValueAndValidity();
    });
  }

  addProduct() {
    let formGroup= new FormGroup({
      productId: new FormControl(''),
      quantity: new FormControl('', [Validators.required, Validators.min(1)]),
      price: new FormControl(''),
      stock: new FormControl('')
    })
    this.products.push(formGroup);
    this.products.updateValueAndValidity();
  }

  calculateTotal():number {
    let total = 0;
    let products = this.products;
    for (let i = 0; i < products.length; i++) {
      const formGroup = products.at(i) as FormGroup;
      total += formGroup.get('price')?.value * formGroup.get('quantity')?.value;
    }
    if(total>1000){
      const desc=total*0.1;
      total-=desc;
    }
    return total;
  }

  generateOrderCode():string {
    const client= this.orderForm.get('name')?.value?.slice(0,1).toUpperCase();
    const email = this.orderForm.get('email')?.value;
    const emailOrder= email?.slice(email.length-4,email.length).toUpperCase();
    const timestamp= new Date().getTime();
    return `${client}${emailOrder}${timestamp}`;
  }

  onSubmit() {
    console.log(this.orderForm.value);
    const order:Order = {
      customerName: this.orderForm.get('name')?.value ?? '',
      email: this.orderForm.get('email')?.value?? '',
      products: this.orderForm.get('products')?.value?? [],
      total: this.calculateTotal(),
      orderCode: this.generateOrderCode(),
      timestamp: new Date().toISOString()
    }
    this.service.postOrder(order).subscribe(response => {
      console.log(response);
    }
    );
  }

  changeProduct(index:number, event: Event) {
    let id = (event.target as HTMLSelectElement).value;
    let formGroup= this.products.at(index) as FormGroup;
    formGroup.get('productId')?.setValue(id);
    let product = this.productsFromAPI.find(product => product.id == id);
    console.log(product);
    if (!product) {
      console.log('Product not found');
      return;
    }
    this.applyQuantityValidators(product.stock,formGroup);
    this.setProductValues(product,formGroup);
  }

  emailOrderLimitValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const email = control.value;
      return this.service.getOrdersByEmail(email).pipe(
        switchMap((orders) => {
          console.log(orders);
          const hoy = new Date();
          let ordersToday = orders.filter((order: Order) => {
            const fechaTimestamp = new Date(order.timestamp ?? '');
            const diferenciaMilisegundos = Math.abs(hoy.getTime() - fechaTimestamp.getTime());
            const diferenciaDias = diferenciaMilisegundos / (1000 * 60 * 60 * 24);
            return diferenciaDias <= 1;
          });
          return of(ordersToday.length >= 3 ? { emailOrderLimit: true } : null);
        })
      );
    };
  }

  setProductValues(product: Iproduct,control : AbstractControl) {
    let formGroup= control as FormGroup;
    formGroup.get('price')?.setValue(product.price);
    formGroup.get('stock')?.setValue(product.stock);
  }

  applyQuantityValidators(stock: number,control: AbstractControl) {
    let formGroup= control as FormGroup;
    formGroup.get('quantity')?.setValidators([Validators.required, Validators.min(1),
      this.lessThanStock(stock)]);
  }

  removeProduct(index: number) {
    this.products.removeAt(index);
  }

  lessThanStock(stock: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const quantity = control.value;
      return quantity > stock ? { lessThanStock: true } : null;
    };
  }

  atLeastOneProduct(): ValidatorFn {
    return(control: AbstractControl): ValidationErrors | null  => {
      const products = control as FormArray;
      return products?.length > 0 ? null : { atLeastOneProduct: true };
    };
  }

  max10Products(): ValidatorFn {
    return(control: AbstractControl): ValidationErrors | null  => {
      const products = this.products;
      let quantity=0;
      for(let i=0; i<products?.length;i++){
        quantity+=products.at(i).get('quantity')?.value;
      }
      return quantity > 10 ? { max10Products: true } : null;
    };
  }

  ///////////////////////////
  nonDuplicated(): ValidatorFn {
    return(control: AbstractControl): ValidationErrors | null  => {
      let products = control as FormArray;
      let selectedIds= products.controls.map(control=>control.get('productId')?.value);
      const hasDuplicates = selectedIds.some((id, index) => selectedIds.indexOf(id) !== index);
      return hasDuplicates ? { nonDuplicated: true } : null;
    };
  }
  ////////////////////////////
  ngOnDestroy() {
    console.log('destroyed');
    this.getProductsSub.unsubscribe();
  }
  
}
