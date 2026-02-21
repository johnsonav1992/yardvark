import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "./products.model";

@Entity("user_hidden_products")
export class UserHiddenProduct {
	@PrimaryColumn()
	userId: string;

	@PrimaryColumn()
	productId: number;

	@ManyToOne(() => Product, { onDelete: "CASCADE" })
	@JoinColumn({ name: "product_id" })
	product: Product;
}
