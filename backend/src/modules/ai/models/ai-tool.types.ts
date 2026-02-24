import type { FunctionDeclaration } from "@google/genai";

export type AiToolDefinition<TToolName extends string = string> = Omit<
	FunctionDeclaration,
	"name" | "description" | "parameters"
> & {
	name: TToolName;
	description: string;
	parameters: Record<string, unknown>;
};
