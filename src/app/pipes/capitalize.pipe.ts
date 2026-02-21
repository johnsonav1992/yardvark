import { Pipe, PipeTransform } from "@angular/core";
import { capitalize } from "../utils/stringUtils";

/**
 * A pipe that capitalizes a string.
 *
 * @example
 * {{ 'hello world' | capitalize }} // Outputs: 'Hello world'
 *
 * @implements {PipeTransform}
 */
@Pipe({
	name: "capitalize",
})
export class CapitalizePipe implements PipeTransform {
	transform(value: string | null | undefined): unknown {
		return value && capitalize(value);
	}
}
