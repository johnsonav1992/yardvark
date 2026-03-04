import type { FunctionDeclaration, Part } from "@google/genai";
import type { AiToolDefinition } from "../models/ai-tool.types";

export type GeminiFunctionCallPart = Part &
	Required<Pick<Part, "functionCall">>;

export const buildFunctionDeclarations = (
	tools: AiToolDefinition[],
): FunctionDeclaration[] =>
	tools.map((tool) => ({
		name: tool.name,
		description: tool.description,
		parameters: tool.parameters,
	}));

export const getFunctionCallParts = (
	parts: Part[] | undefined,
): GeminiFunctionCallPart[] =>
	(parts ?? []).filter(
		(part): part is GeminiFunctionCallPart => part.functionCall != null,
	);

export const getToolErrorMessage = (
	error: unknown,
	fallbackMessage = "Tool execution failed",
): string => (error instanceof Error ? error.message : fallbackMessage);

const createToolResponsePart = (
	name: string,
	toolCallId: string | undefined,
	response: Record<string, unknown>,
): Part => ({
	functionResponse: {
		id: toolCallId,
		name,
		response,
	},
});

const createMissingToolNamePart = (toolCallId: string | undefined): Part =>
	createToolResponsePart("unknown_tool", toolCallId, {
		error: {
			message: "Tool call missing function name",
		},
	});

const createToolOutputPart = (
	name: string,
	toolCallId: string | undefined,
	output: unknown,
): Part =>
	createToolResponsePart(name, toolCallId, {
		output,
	});

const createToolErrorPart = (
	name: string,
	toolCallId: string | undefined,
	message: string,
): Part =>
	createToolResponsePart(name, toolCallId, {
		error: {
			message,
		},
	});

export const executeToolCallsToResponseParts = async (
	functionCallParts: GeminiFunctionCallPart[],
	toolExecutor: (
		name: string,
		args: Record<string, unknown>,
	) => Promise<unknown>,
	onBeforeToolExecution?: (toolName: string) => void | Promise<void>,
): Promise<Part[]> => {
	const functionResponseParts: Part[] = [];

	for (const part of functionCallParts) {
		const toolCallId = part.functionCall.id;
		const name = part.functionCall.name;
		const args = (part.functionCall.args as Record<string, unknown>) ?? {};
		const statusToolName = name ?? "unknown_tool";

		await onBeforeToolExecution?.(statusToolName);

		if (!name) {
			functionResponseParts.push(createMissingToolNamePart(toolCallId));
			continue;
		}

		try {
			const result = await toolExecutor(name, args);
			functionResponseParts.push(
				createToolOutputPart(name, toolCallId, result),
			);
		} catch (error) {
			functionResponseParts.push(
				createToolErrorPart(
					name,
					toolCallId,
					getToolErrorMessage(error, "Tool execution failed"),
				),
			);
		}
	}

	return functionResponseParts;
};
