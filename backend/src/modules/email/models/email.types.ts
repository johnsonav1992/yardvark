export interface FeedbackRequest {
	name: string;
	email: string;
	message: string;
	feedbackType: "general" | "bug" | "enhancement";
}
