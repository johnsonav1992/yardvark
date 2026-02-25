export const ENTRY_QUERY_MODEL = "gemini-2.5-flash-lite";
export const ENTRY_QUERY_MAX_OUTPUT_TOKENS = 800;

export const getEntryQueryChatOptions = () => ({
	model: ENTRY_QUERY_MODEL,
	maxOutputTokens: ENTRY_QUERY_MAX_OUTPUT_TOKENS,
});
