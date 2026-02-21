import { Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { getReq } from "../utils/httpUtils";

export interface GitHubRelease {
	tag_name: string;
	name: string;
	body: string;
	published_at: string;
	html_url: string;
}

@Injectable({
	providedIn: "root",
})
export class ChangelogService {
	private readonly GITHUB_API_URL =
		"https://api.github.com/repos/johnsonav1992/yardvark/releases/latest";

	getLatestChangelog(): Observable<string | null> {
		return getReq<GitHubRelease>(this.GITHUB_API_URL).pipe(
			map((release) => this.extractReleaseNotes(release.body)),
			catchError((error) => {
				console.error("Failed to fetch changelog:", error);
				return [null];
			}),
		);
	}

	private extractReleaseNotes(releaseBody: string): string {
		const lines = releaseBody.split("\n");
		const startIndex = lines.findIndex((line) =>
			line.toLowerCase().includes("this release includes"),
		);

		if (startIndex === -1) return "Various improvements and bug fixes.";

		const relevantLines: string[] = [];
		let inBulletList = false;

		for (let i = startIndex + 1; i < lines.length; i++) {
			const line = lines[i].trim();

			if (line.startsWith("-")) {
				relevantLines.push(line);
				inBulletList = true;
			} else if (line.startsWith("*")) {
				relevantLines.push(line.replace("*", "-"));
				inBulletList = true;
			} else if (line === "" && inBulletList) {
				break;
			} else if (line.startsWith("#") || line.startsWith("**")) {
				break;
			}
		}

		return relevantLines.join("\n");
	}

	formatChangelogToHtml(changelog: string): string {
		return changelog
			.split("\n")
			.filter((line) => line.trim())
			.map((line) => {
				const content = line.replace(/^-\s*/, "").trim();
				return `<li>${content}</li>`;
			})
			.join("");
	}
}
