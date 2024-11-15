import { ProductDTO } from "./product-dto";

export interface Order {
    customerName: string|undefined;
    email: string|undefined;
    products: ProductDTO[];
    total: number|undefined;
    orderCode: string|undefined;
    timestamp: string|undefined;
}

