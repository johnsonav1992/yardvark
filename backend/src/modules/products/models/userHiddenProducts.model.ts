import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Product } from "./products.model";

@Entity("user_hidden_products")
export class UserHiddenProduct {
	@PrimaryColumn()
	public userId!: string;

	@PrimaryColumn()
	public productId!: number;

	@ManyToOne(() => Product, { onDelete: "CASCADE" })
	@JoinColumn({ name: "product_id" })
	public product!: Product;
}
