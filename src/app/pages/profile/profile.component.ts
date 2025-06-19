import {
	Component,
	computed,
	inject,
	linkedSignal,
	signal,
	WritableSignal
} from '@angular/core';
import { PageContainerComponent } from '../../components/layout/page-container/page-container.component';
import { getUserInitials, injectUserData } from '../../utils/authUtils';
import { AvatarModule } from 'primeng/avatar';
import { AvatarDesignTokens } from '@primeng/themes/types/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '@auth0/auth0-angular';
import { YVUser } from '../../types/user.types';
import { apiUrl, putReq } from '../../utils/httpUtils';
import { injectErrorToast } from '../../utils/toastUtils';
import { switchMap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MessageModule } from 'primeng/message';
import { TooltipModule } from 'primeng/tooltip';

@Component({
	selector: 'profile',
	imports: [
		PageContainerComponent,
		AvatarModule,
		InputTextModule,
		ButtonModule,
		FormsModule,
		MessageModule,
		TooltipModule
	],
	templateUrl: './profile.component.html',
	styleUrl: './profile.component.scss'
})
export class ProfileComponent {
	private throwErrorToast = injectErrorToast();
	private auth = inject(AuthService);

	public user = injectUserData();
	public userInitials = computed(() => getUserInitials(this.user() as YVUser));
	public isGoogleUser = computed(() =>
		this.user()?.sub?.includes('google-oauth2')
	);

	public isEditingField = signal<'name' | 'email' | null>(null);

	public name = linkedSignal(() => this.user()?.name);
	public email = linkedSignal(() => this.user()?.email);

	public fieldNamesMap: Record<
		keyof User,
		WritableSignal<unknown | undefined>
	> = {
		name: this.name,
		email: this.email
	};

	public updateField(fieldName: keyof User, oldFieldValue: unknown): void {
		const userData: Partial<User> = {
			[fieldName]: this.fieldNamesMap[fieldName]()
		};

		const updatedField = this.fieldNamesMap[fieldName];

		putReq<Partial<User>>(apiUrl('users'), userData)
			.pipe(
				switchMap((userRes) => {
					updatedField.set(userRes[fieldName]);

					return this.refreshUser();
				}),
				finalize(() => {
					this.isEditingField.set(null);
				})
			)
			.subscribe({
				error: () => {
					this.throwErrorToast('There was an error updating your profile');
					updatedField.set(oldFieldValue);
				}
			});
	}

	private refreshUser() {
		return this.auth.getAccessTokenSilently({ cacheMode: 'off' });
	}

	public avatarDt: AvatarDesignTokens = {
		root: {
			fontSize: '5rem',
			background: '{primary.400}',
			width: '150px',
			height: '150px'
		}
	};
}
