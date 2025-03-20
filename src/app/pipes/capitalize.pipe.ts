import { Pipe, PipeTransform } from '@angular/core';
import { capitalize } from '../utils/stringUtils';

@Pipe({
  name: 'capitalize'
})
export class CapitalizePipe implements PipeTransform {
  transform(value: string | null | undefined): unknown {
    return value && capitalize(value);
  }
}
