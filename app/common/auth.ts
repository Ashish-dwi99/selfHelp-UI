"use client";

import useSWR from "swr";

export interface UserProfile {
	email: string;
	username: string;
	photo: string;
	is_active: boolean;
	has_documents: boolean;
	detail: string;
	khoj_version: string;
}

const fetcher = (url: string) =>
	window
		.fetch(url)
		.then((res) => res.json())
		.catch((err) => console.warn(err));

export function useAuthenticatedData() {
	const { data, error, isLoading } = useSWR<UserProfile>("/api/v1/user", fetcher, {
		revalidateOnFocus: false,
	});

	if (data?.detail === "Forbidden") {
		return { data: null, error: "Forbidden", isLoading: false };
	}

	return { data, error, isLoading };
}

export interface ModelOptions {
	id: number;
	name: string;
	tier: string;
	description: string;
	strengths: string;
}
export interface SyncedContent {
	computer: boolean;
	github: boolean;
	notion: boolean;
}

export enum SubscriptionStates {
	EXPIRED = "expired",
	TRIAL = "trial",
	SUBSCRIBED = "subscribed",
	UNSUBSCRIBED = "unsubscribed",
	INVALID = "invalid",
}

export interface UserConfig {
	// user info
	username: string;
	user_photo: string | null;
	is_active: boolean;
	given_name: string;
	phone_number: string;
	is_phone_number_verified: boolean;
	// user content settings
	enabled_content_source: SyncedContent;
	has_documents: boolean;
	notion_token: string | null;
	// user model settings
	search_model_options: ModelOptions[];
	selected_search_model_config: number;
	chat_model_options: ModelOptions[];
	selected_chat_model_config: number;
	paint_model_options: ModelOptions[];
	selected_paint_model_config: number;
	voice_model_options: ModelOptions[];
	selected_voice_model_config: number;
	// user billing info
	subscription_state: SubscriptionStates;
	subscription_renewal_date: string | undefined;
	subscription_enabled_trial_at: string | undefined;
	// server settings
	khoj_cloud_subscription_url: string | undefined;
	billing_enabled: boolean;
	is_eleven_labs_enabled: boolean;
	is_twilio_enabled: boolean;
	khoj_version: string;
	anonymous_mode: boolean;
	notion_oauth_url: string;
	detail: string;
	length_of_free_trial: number;
}

const DUMMY_USER_CONFIG: UserConfig = {
	username: "vivek.kumar@314ecorp.com",
	user_photo:
		"https://lh3.googleusercontent.com/a/ACg8ocKaKCfqOMkyTs6PwsU3W9wwlU3eCqE3ggXeDCW2tUYhHXb3Gg=s96-c",
	is_active: false,
	given_name: "Vivek",
	phone_number: "",
	is_phone_number_verified: false,
	enabled_content_source: {
		computer: false,
		github: false,
		notion: false,
	},
	has_documents: false,
	notion_token: "",
	chat_model_options: [
		{
			name: "o3-mini",
			id: 16,
			strengths: "Math, science, general reasoning.",
			description:
				"The most advanced reasoning model coming out of OpenAI. Thinks longer before it responds, leading to slower, but more accurate, responses.",
			tier: "standard",
		},
		{
			name: "claude-3-7-sonnet@20250219",
			id: 10,
			strengths: "Best in class for writing, research and coding",
			description:
				"The most capable model by Anthropic. Great for coding, writing and research. Vision enabled.",
			tier: "standard",
		},
		{
			name: "gpt-4o-2024-11-20",
			id: 7,
			strengths: "Fast, direct, correct answers. Follows instructions effectively.",
			description: "A fast, broadly intelligent model in the GPT suite at OpenAI.",
			tier: "standard",
		},
		{
			name: "grok-3-mini",
			id: 33,
			strengths: "Fast reasoning model",
			description: "Fast, reasoning grok 3 series model by Twitter. Released April 2025.",
			tier: "free",
		},
		{
			name: "Qwen/QwQ-32B",
			id: 22,
			strengths: "Math, coding.",
			description:
				"Fully open source, research model developed by the Qwen Team in Alibaba, focused on advancing AI reasoning capabilities. Has some tendency for looping thoughts and language mixing.",
			tier: "free",
		},
		{
			name: "claude-3-5-haiku-latest",
			id: 19,
			strengths: "Fast. Good at narrow, specific tasks.",
			description:
				"The leanest model coming out of the Claude family of models at Anthropic.",
			tier: "free",
		},
		{
			name: "Meta-Llama-3-1-405B-Instruct-rdz",
			id: 17,
			strengths: "General purpose, harmless outputs.",
			description:
				"An open source model coming from the Llama team at Meta. Their team's most capable model.",
			tier: "standard",
		},
		{
			name: "gemini-1.5-flash-002",
			id: 15,
			strengths:
				"Fast answers. Largest context window. A great, practical all-rounder model.",
			description:
				"A super fast, efficient and smart model from the Gemini 2.0 series by Google. Released February 2025. Vision Enabled.",
			tier: "free",
		},
		{
			name: "gemini-2.5-flash-preview-04-17",
			id: 27,
			strengths: "Fast Reasoning",
			description: "Latest small, thinking model by Gemini. Released mid April 2025.",
			tier: "free",
		},
		{
			name: "gemini-2.0-flash",
			id: 24,
			strengths:
				"Fast answers. Largest context window. A great, practical all-rounder model.",
			description:
				"A fast and smart model from the Gemini 2.0 series by Google. Released February 2025. Vision Enabled.",
			tier: "free",
		},
		{
			name: "Qwen/Qwen2.5-72B-Instruct",
			id: 21,
			strengths: "Math",
			description:
				"Fully open source, instruction-following model developed by the Qwen Team in Alibaba.",
			tier: "free",
		},
		{
			name: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
			id: 20,
			strengths: "Safe, harmless outputs. Friendly tone.",
			description: "Open source model developed by Meta's Llama team.",
			tier: "free",
		},
		{
			name: "deepseek-reasoner",
			id: 23,
			strengths: "Math, science, and high-level reasoning tasks.",
			description: "The best open-weights, reasoning model. Developed by Deepseek.",
			tier: "standard",
		},
		{
			name: "gemini-2.5-pro-preview-03-25",
			id: 26,
			strengths: "A reasoning model. Excellent at coding. Has a personality.",
			description: "Google's first Gemini 2.5 series model. Released on March 25th 2025.",
			tier: "standard",
		},
		{
			name: "gpt-4o-mini",
			id: 12,
			strengths: "Speed. General purpose.",
			description:
				"A fast and capable model coming out of the GPT family at OpenAI. Vision enabled.",
			tier: "free",
		},
		{
			name: "claude-3-5-sonnet-latest",
			id: 25,
			strengths: "Great for creative writing, research and coding",
			description:
				"The previous most capable model by Anthropic. Great for coding, writing and research. Vision enabled.",
			tier: "standard",
		},
		{
			name: "gpt-4.1-2025-04-14",
			id: 28,
			strengths: "Good all-rounder, non-reasoning model",
			description: "Flagship OpenAI model in the GPT 4.1 series. Released mid April 2025",
			tier: "standard",
		},
		{
			name: "gpt-4.1-mini-2025-04-14",
			id: 30,
			strengths: "Balance of speed and performance",
			description:
				"Mid tier non-reasoning model in the OpenAI GPT 4.1 series. Released mid April 2025",
			tier: "free",
		},
		{
			name: "gpt-4.1-nano-2025-04-14",
			id: 31,
			strengths: "Fastest model in the GPT 4.1 series.",
			description: "Smallest model in the OpenAI GPT 4.1 series. Released mid April 2025.",
			tier: "free",
		},
		{
			name: "o4-mini-2025-04-16",
			id: 29,
			strengths: "Fast reasoner. Good vision.",
			description: "Fast, reasoning model by OpenAI. Released mid April 2025.",
			tier: "standard",
		},
		{
			name: "grok-3",
			id: 32,
			strengths: "Good all-rounder model",
			description:
				"Flagship grok 3 series model by Twitter. Released April 2025. Non-reasoning.",
			tier: "standard",
		},
	],
	selected_chat_model_config: 24,
	paint_model_options: [
		{
			name: "imagen-3.0-generate-002",
			id: 1,
			tier: "free",
		},
		{
			name: "black-forest-labs/flux-dev",
			id: 6,
			tier: "free",
		},
		{
			name: "black-forest-labs/flux-1.1-pro",
			id: 4,
			tier: "standard",
		},
		{
			name: "sd3-large",
			id: 2,
			tier: "standard",
		},
		{
			name: "recraft-ai/recraft-v3",
			id: 5,
			tier: "standard",
		},
		{
			name: "dall-e-3",
			id: 3,
			tier: "standard",
		},
	],
	selected_paint_model_config: 1,
	voice_model_options: [
		{
			name: "Female",
			id: "OYTbf65OHHFELVut7v2H",
			tier: "free",
		},
		{
			name: "Male",
			id: "RPEIZnKMqlQiZyZd1Dae",
			tier: "free",
		},
	],
	selected_voice_model_config: "RPEIZnKMqlQiZyZd1Dae",
	subscription_state: "expired",
	subscription_renewal_date: null,
	subscription_enabled_trial_at: null,
	khoj_cloud_subscription_url: "https://buy.stripe.com/28ocQb7kb4iD0cEdQQ",
	billing_enabled: true,
	is_eleven_labs_enabled: true,
	is_twilio_enabled: true,
	khoj_version: "1.41.0",
	anonymous_mode: false,
	notion_oauth_url:
		"https://api.notion.com/v1/oauth/authorize?client_id=ca8bebee-d2be-4a44-bd36-b0907c0ab2d3&redirect_uri=https://app.khoj.dev/api/notion/auth/callback&response_type=code&state=51c37726-8d0c-4c5f-a6b5-c79b7a55775d",
	length_of_free_trial: 7,
};
export function useUserConfig(detailed: boolean = false) {
	const url = `/api/settings?detailed=${detailed}`;
	const { data, error, isLoading } = useSWR<UserConfig>(url, fetcher, {
		revalidateOnFocus: false,
	});

	return { data: DUMMY_USER_CONFIG, error: null, isLoading: false };
	// if (error || !data || data?.detail === "Forbidden") {
	// 	return { data: null, error, isLoading };
	// }

	// return { data, error, isLoading };
}

export function useChatModelOptions() {
	const { data, error, isLoading } = useSWR<ModelOptions[]>(`/api/model/chat/options`, fetcher, {
		revalidateOnFocus: false,
	});

	return { models: data, error, isLoading };
}

export function isUserSubscribed(userConfig: UserConfig | null): boolean {
	return (
		(userConfig?.subscription_state &&
			[
				SubscriptionStates.SUBSCRIBED.valueOf(),
				SubscriptionStates.TRIAL.valueOf(),
				SubscriptionStates.UNSUBSCRIBED.valueOf(),
			].includes(userConfig.subscription_state)) ||
		false
	);
}
