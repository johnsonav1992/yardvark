import {
	Component,
	computed,
	inject,
	linkedSignal,
	signal,
	WritableSignal,
} from "@angular/core";
import { PageContainerComponent } from "../../components/layout/page-container/page-container.component";
import { getUserInitials, injectUserData } from "../../utils/authUtils";
import { AvatarModule } from "primeng/avatar";
import { AvatarDesignTokens } from "@primeuix/themes/types/avatar";
import { InputTextModule } from "primeng/inputtext";
import { ButtonModule } from "primeng/button";
import { FormsModule } from "@angular/forms";
import { AuthService, User } from "@auth0/auth0-angular";
import { YVUser } from "../../types/user.types";
import { apiUrl, putReq } from "../../utils/httpUtils";
import { injectErrorToast, injectSuccessToast } from "../../utils/toastUtils";
import { switchMap } from "rxjs";
import { finalize } from "rxjs/operators";
import { MessageModule } from "primeng/message";
import { TooltipModule } from "primeng/tooltip";
import { DialogService } from "primeng/dynamicdialog";
import { ProfilePictureDialogComponent } from "../../components/profile/profile-picture-dialog/profile-picture-dialog.component";
import { GlobalUiService } from "../../services/global-ui.service";

@Component({
	selector: "profile",
	imports: [
		PageContainerComponent,
		AvatarModule,
		InputTextModule,
		ButtonModule,
		FormsModule,
		MessageModule,
		TooltipModule,
	],
	providers: [DialogService],
	templateUrl: "./profile.component.html",
	styleUrl: "./profile.component.scss",
})
export class ProfileComponent {
	private throwErrorToast = injectErrorToast();
	private throwSuccessToast = injectSuccessToast();
	private auth = inject(AuthService);
	private dialogService = inject(DialogService);
	private globalUiService = inject(GlobalUiService);

	public user = injectUserData();
	public userInitials = computed(() => getUserInitials(this.user() as YVUser));
	public isGoogleUser = computed(() =>
		this.user()?.sub?.includes("google-oauth2"),
	);

	public isEditingField = signal<"name" | "email" | null>(null);

	public name = linkedSignal(() => this.user()?.name);
	public email = linkedSignal(() => this.user()?.email);

	public fieldNamesMap: Record<
		keyof User,
		WritableSignal<unknown | undefined>
	> = {
		name: this.name,
		email: this.email,
	};

	public updateField(fieldName: keyof User, oldFieldValue: unknown): void {
		const userData: Partial<User> = {
			[fieldName]: this.fieldNamesMap[fieldName](),
		};

		const updatedField = this.fieldNamesMap[fieldName];

		putReq<Partial<User>>(apiUrl("users"), userData)
			.pipe(
				switchMap((userRes) => {
					updatedField.set(userRes[fieldName]);

					return this.refreshUser();
				}),
				finalize(() => {
					this.isEditingField.set(null);
				}),
			)
			.subscribe({
				error: () => {
					this.throwErrorToast("There was an error updating your profile");
					updatedField.set(oldFieldValue);
				},
			});
	}

	private refreshUser() {
		return this.auth.getAccessTokenSilently({ cacheMode: "off" });
	}

	public openProfilePictureDialog(): void {
		if (this.isGoogleUser()) return;

		const isMobile = this.globalUiService.isMobile();

		const dialogRef = this.dialogService.open(ProfilePictureDialogComponent, {
			header: "Update Profile Picture",
			modal: true,
			focusOnShow: false,
			width: isMobile ? "95%" : "450px",
			height: "auto",
		});

		dialogRef?.onClose.subscribe((newPictureUrl: string | null) => {
			if (newPictureUrl) {
				this.refreshUser().subscribe();
				this.throwSuccessToast("Profile picture updated successfully!");
			}
		});
	}

	public avatarDt: AvatarDesignTokens = {
		root: {
			fontSize: "5rem",
			background: "{primary.400}",
			width: "150px",
			height: "150px",
		},
	};
}
