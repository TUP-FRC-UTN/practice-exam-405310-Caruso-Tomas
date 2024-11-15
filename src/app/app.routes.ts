import { Routes } from '@angular/router';
import { CreateOrderComponent } from './create-order/create-order.component';
import { OrderListComponent } from './order-list/order-list.component';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'create-order',
        pathMatch: 'full',
    },
    {
        path: 'create-order',
        component: CreateOrderComponent
    },
    {
        path: 'orders',
        component: OrderListComponent
    }
    
];
