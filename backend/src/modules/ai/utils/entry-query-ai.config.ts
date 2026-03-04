export const ENTRY_QUERY_MODEL = "gemini-2.5-flash-lite";
export const ENTRY_QUERY_MAX_OUTPUT_TOKENS = 800;
export const ENTRY_QUERY_DAILY_LIMIT_FEATURE = "ai_query_entries_daily";

export const getEntryQueryChatOptions = () => ({
	model: ENTRY_QUERY_MODEL,
	maxOutputTokens: ENTRY_QUERY_MAX_OUTPUT_TOKENS,
});
