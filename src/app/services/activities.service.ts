import { httpResource } from "@angular/common/http";
import { Injectable } from "@angular/core";
import type { Activity } from "../types/activities.types";
import { apiUrl } from "../utils/httpUtils";

@Injectable({
	providedIn: "root",
})
export class ActivitiesService {
	public activities = httpResource<Activity[]>(() => apiUrl("activities"));
}
