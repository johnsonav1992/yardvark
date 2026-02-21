import { Injectable } from "@angular/core";
import { httpResource } from "@angular/common/http";
import { apiUrl } from "../utils/httpUtils";
import { Activity } from "../types/activities.types";

@Injectable({
	providedIn: "root",
})
export class ActivitiesService {
	public activities = httpResource<Activity[]>(() => apiUrl("activities"));
}
