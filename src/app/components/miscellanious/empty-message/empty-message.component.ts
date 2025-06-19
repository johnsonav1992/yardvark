import { Component, input } from '@angular/core';

@Component({
	selector: 'empty-message',
	imports: [],
	templateUrl: './empty-message.component.html',
	styleUrl: './empty-message.component.scss'
})
export class EmptyMessageComponent {
	public message = input.required<string>();

	public icon = input<string>();
	public iconSize = input<number | string>();
	public messageFontSize = input<number | string>();
}
