import {
	Body,
	Controller,
	Post,
	Put,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { imageFileValidator } from "src/utils/fileUtils";
import { User as AuthUser } from "../../../decorators/user.decorator";
import { LogHelpers } from "../../../logger/logger.helpers";
import { BusinessContextKeys } from "../../../logger/logger-keys.constants";
import { resultOrThrow } from "../../../utils/resultOrThrow";
import type { User } from "../Models/user.model";
import type { UsersService } from "../services/users.service";

const MAX_PROFILE_PICTURE_SIZE = 5 * 1024 * 1024;

@Controller("users")
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Put()
	public async updateUser(
		@AuthUser("userId") userId: string,
		@Body() data: Partial<User>,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"update_user",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return resultOrThrow(await this.usersService.updateUser(userId, data));
	}

	@Post("profile-picture")
	@UseInterceptors(FileInterceptor("file"))
	public async uploadProfilePicture(
		@UploadedFile(imageFileValidator(MAX_PROFILE_PICTURE_SIZE))
		file: Express.Multer.File,
		@AuthUser("userId") userId: string,
	) {
		LogHelpers.addBusinessContext(
			BusinessContextKeys.controllerOperation,
			"upload_profile_picture",
		);
		LogHelpers.addBusinessContext(BusinessContextKeys.userId, userId);

		return resultOrThrow(
			await this.usersService.updateProfilePicture(userId, file),
		);
	}
}
