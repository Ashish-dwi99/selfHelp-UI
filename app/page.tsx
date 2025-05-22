"use client";
import "./globals.css";
import styles from "./page.module.css";
import "katex/dist/katex.min.css";

import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { ArrowsVertical } from "@phosphor-icons/react";

import { Card, CardTitle } from "@/components/ui/card";
import {
    StepOneSuggestionCard,
    StepOneSuggestionRevertCard,
    StepTwoSuggestionCard,
} from "@/app/components/suggestions/suggestionCard";
import Loading from "@/app/components/loading/loading";
import {
    AttachedFileText,
    ChatInputArea,
    ChatInputFocus,
    ChatOptions,
} from "@/app/components/chatInputArea/chatInputArea";
import {
    StepOneSuggestion,
    stepOneSuggestions,
    StepTwoSuggestion,
    getStepTwoSuggestions,
} from "@/app/components/suggestions/suggestionsData";
// import LoginPrompt from "@/app/components/loginPrompt/loginPrompt";

import {
    isUserSubscribed,
    useAuthenticatedData,
    UserConfig,
    useUserConfig,
} from "@/app/common/auth";
import { convertColorToBorderClass } from "@/app/common/colorUtils";
import { getIconFromIconName } from "@/app/common/iconUtils";
import { AgentData } from "@/app/components/agentCard/agentCard";
import { createNewConversation } from "./common/chatFunctions";
import { useDebounce, useIsMobileWidth } from "./common/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AgentCard } from "@/app/components/agentCard/agentCard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LoginPopup from "./components/loginPrompt/loginPopup";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./components/appSidebar/appSidebar";
import { Separator } from "@/components/ui/separator";
import { KhojLogoType } from "./components/logo/khojLogo";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) =>
    fetch(url)
        .then((res) => res.json())
        .catch((err) => console.warn(err));

interface ChatBodyDataProps {
    chatOptionsData: ChatOptions | null;
    onConversationIdChange?: (conversationId: string) => void;
    setUploadedFiles: (files: AttachedFileText[]) => void;
    isMobileWidth?: boolean;
    isLoggedIn: boolean;
    userConfig: UserConfig | null;
    isLoadingUserConfig: boolean;
}

function AgentCards({
    agents,
    agentIcons,
    selectedAgent,
    isPopoverOpen,
    debouncedHoveredAgent,
    setHoveredAgent,
    setIsPopoverOpen,
    setSelectedAgent,
    chatInputRef,
    openAgentEditCard,
    userConfig,
    isMobileWidth,
}: {
    agents: AgentData[];
    agentIcons: JSX.Element[];
    selectedAgent: string | null;
    isPopoverOpen: boolean;
    debouncedHoveredAgent: string | null;
    setHoveredAgent: (agent: string | null) => void;
    setIsPopoverOpen: (open: boolean) => void;
    setSelectedAgent: (agent: string | null) => void;
    chatInputRef: React.RefObject<HTMLTextAreaElement>;
    openAgentEditCard: (slug: string) => void;
    userConfig: UserConfig | null;
    isMobileWidth?: boolean;
}) {
    return (
        <ScrollArea className="w-full max-w-[600px] mx-auto">
            <div className="flex pb-2 gap-2 items-center justify-center">
                {agents.map((agent, index) => (
                    <Popover
                        key={`${index}-${agent.slug}`}
                        open={isPopoverOpen && debouncedHoveredAgent === agent.slug}
                        onOpenChange={(open) => {
                            if (!open) {
                                setHoveredAgent(null);
                                setIsPopoverOpen(false);
                            }
                        }}
                    >
                        <PopoverTrigger asChild>
                            <Card
                                className={`${
                                    selectedAgent === agent.slug
                                        ? convertColorToBorderClass(agent.color)
                                        : "border-stone-100 dark:border-neutral-700 text-muted-foreground"
                                }
                            hover:cursor-pointer rounded-lg px-2 py-2`}
                                onDoubleClick={() => openAgentEditCard(agent.slug)}
                                onClick={() => {
                                    setSelectedAgent(agent.slug);
                                    chatInputRef.current?.focus();
                                    setHoveredAgent(null);
                                    setIsPopoverOpen(false);
                                }}
                                onMouseEnter={() => setHoveredAgent(agent.slug)}
                                onMouseLeave={() => {
                                    setHoveredAgent(null);
                                    setIsPopoverOpen(false);
                                }}
                            >
                                <CardTitle className="text-center text-md font-medium flex justify-center items-center whitespace-nowrap">
                                    {agentIcons[index]} {agent.name}
                                </CardTitle>
                            </Card>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-80 p-0 border-none bg-transparent shadow-none"
                            onMouseLeave={() => {
                                setHoveredAgent(null);
                                setIsPopoverOpen(false);
                            }}
                        >
                            <AgentCard
                                data={agent}
                                userProfile={null}
                                isMobileWidth={isMobileWidth || false}
                                showChatButton={false}
                                editCard={false}
                                filesOptions={[]}
                                selectedChatModelOption=""
                                agentSlug=""
                                isSubscribed={isUserSubscribed(userConfig)}
                                setAgentChangeTriggered={() => {}}
                                modelOptions={[]}
                                inputToolOptions={{}}
                                outputModeOptions={{}}
                            />
                        </PopoverContent>
                    </Popover>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
    );
}

function ChatBodyData(props: ChatBodyDataProps) {
    const [message, setMessage] = useState("");
    const [images, setImages] = useState<string[]>([]);
    const [processingMessage, setProcessingMessage] = useState(false);
    const [greeting, setGreeting] = useState("");

    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const searchParams = useSearchParams();
    const queryParam = searchParams.get("q");

    // Default to teacher agent
    const [selectedAgent, setSelectedAgent] = useState<string>("teacher");
    const agents = props.chatOptionsData?.agents || [];

    useEffect(() => {
        // Find the teacher agent in the available agents
        const teacherAgent = agents.find(agent => agent.slug === "teacher");
        if (teacherAgent) {
            setSelectedAgent(teacherAgent.slug);
        } else if (agents.length > 0) {
            // Fallback to first agent if teacher not found
            setSelectedAgent(agents[0].slug);
        }
    }, [props.chatOptionsData]);

    useEffect(() => {
        if (queryParam) {
            setMessage(decodeURIComponent(queryParam));
        }
    }, [queryParam]);

    const onConversationIdChange = props.onConversationIdChange;

    useEffect(() => {
        if (props.isLoadingUserConfig) return;

        // Get today's day
        const today = new Date();
        const day = today.getDay();
        const timeOfDay =
            today.getHours() >= 17 || today.getHours() < 4
                ? "evening"
                : today.getHours() >= 12
                  ? "afternoon"
                  : "morning";
        const nameSuffix = props.userConfig?.given_name ? `, ${props.userConfig?.given_name}` : "";
        const greetings = [
            `What would you like to get done${nameSuffix}?`,
            `Hey${nameSuffix}! How can I help?`,
            `Good ${timeOfDay}${nameSuffix}! What's on your mind?`,
            `Ready to breeze through ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]}?`,
            `Let's navigate your ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]} workload`,
        ];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        setGreeting(greeting);
    }, [props.isLoadingUserConfig, props.userConfig]);


    useEffect(() => {
        const processMessage = async () => {
            if (message && !processingMessage) {
                setProcessingMessage(true);
                try {
                    const newConversationId = await createNewConversation(selectedAgent || "khoj");
                    onConversationIdChange?.(newConversationId);
                    localStorage.setItem("message", message);
                    if (images.length > 0) {
                        localStorage.setItem("images", JSON.stringify(images));
                    }

                    window.location.href = `/chat?conversationId=${newConversationId}`;
                } catch (error) {
                    console.error("Error creating new conversation:", error);
                    setProcessingMessage(false);
                }
                setMessage("");
                setImages([]);
            }
        };
        processMessage();
        if (message || images.length > 0) {
            setProcessingMessage(true);
        }
    }, [message, processingMessage, onConversationIdChange]);

    return (
        <div className={`${styles.homeGreetings} w-full md:w-auto`}>
            <div className={`w-full text-center justify-end content-end`}>
                <div className="items-center">
                    <h1 className="text-2xl md:text-3xl text-center w-fit pb-6 pt-4 px-4 mx-auto">
                        {greeting}
                    </h1>
                </div>
            </div>
            <div
                className={`mx-auto ${props.isMobileWidth ? "w-full" : "w-full max-w-screen-md min-w-screen-md"}`}
            >
                {!props.isMobileWidth && (
                    <div
                        className={`w-full ${styles.inputBox} shadow-lg bg-background align-middle items-center justify-center px-3 py-1 dark:bg-neutral-700 border-stone-100 dark:border-none dark:shadow-none rounded-2xl`}
                    >
                        <ChatInputArea
                            isLoggedIn={props.isLoggedIn}
                            sendMessage={(message) => setMessage(message)}
                            sendImage={(image) => setImages((prevImages) => [...prevImages, image])}
                            sendDisabled={processingMessage}
                            chatOptionsData={props.chatOptionsData}
                            conversationId={null}
                            isMobileWidth={props.isMobileWidth}
                            setUploadedFiles={props.setUploadedFiles}
                            agentColor={agents.find((agent) => agent.slug === selectedAgent)?.color}
                            ref={chatInputRef}
                            setTriggeredAbort={() => {}}
                        />
                    </div>
                )}
            </div>
            {props.isMobileWidth && (
                <div
                    className={`${styles.inputBox} align-middle items-center justify-center pb-3 mx-1 mb-2 border-none`}
                >
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Button className="w-full m-2 p-0" variant="outline">
                                {selectedAgent ? (
                                    getIconFromIconName(
                                        agents.find((agent) => agent.slug === selectedAgent)
                                            ?.icon ?? "Lightbulb",
                                        agents.find((agent) => agent.slug === selectedAgent)
                                            ?.color ?? "orange",
                                    )
                                ) : (
                                    <ArrowsVertical className="h-5 w-5" />
                                )}
                                {selectedAgent
                                    ? `${agents?.find((agent) => agent.slug === selectedAgent)?.name ?? "Khoj"}`
                                    : "Select Agent"}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="overflow-y-scroll max-h-96">
                            {agentIcons.length > 0 ? (
                                agentIcons.map((icon, index) => (
                                    <DropdownMenuItem
                                        key={`${index}-${agents[index].slug}`}
                                        onClick={() => {
                                            setSelectedAgent(agents[index].slug);
                                            chatInputRef.current?.focus();
                                        }}
                                    >
                                        {icon} {agents[index].name}
                                    </DropdownMenuItem>
                                ))
                            ) : (
                                <DropdownMenuItem
                                    key="0-khoj"
                                    onClick={() => {
                                        setSelectedAgent("khoj");
                                        chatInputRef.current?.focus();
                                    }}
                                >
                                    {getIconFromIconName("Lightbulb", "orange")} Khoj
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div
                        className={`${styles.inputBox} pt-4 shadow-[0_-20px_25px_-5px_rgba(0,0,0,0.1)] dark:bg-neutral-700 bg-background rounded-2xl mb-2 border-none`}
                    >
                        <ChatInputArea
                            isLoggedIn={props.isLoggedIn}
                            sendMessage={(message) => setMessage(message)}
                            sendImage={(image) => setImages((prevImages) => [...prevImages, image])}
                            sendDisabled={processingMessage}
                            chatOptionsData={props.chatOptionsData}
                            conversationId={null}
                            isMobileWidth={props.isMobileWidth}
                            setUploadedFiles={props.setUploadedFiles}
                            agentColor={agents.find((agent) => agent.slug === selectedAgent)?.color}
                            ref={chatInputRef}
                            setTriggeredAbort={() => {}}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Home() {
    const [chatOptionsData, setChatOptionsData] = useState<ChatOptions | null>(null);
    const [isLoading, setLoading] = useState(false);
    const [conversationId, setConversationID] = useState<string | null>(null);
    const [uploadedFiles, setUploadedFiles] = useState<AttachedFileText[] | null>(null);
    const isMobileWidth = useIsMobileWidth();

    // const { data: initialUserConfig, isLoading: isLoadingUserConfig } = useUserConfig(true);
    const [userConfig, setUserConfig] = useState<UserConfig | null>(null);

    const {
        data: authenticatedData,
        error: authenticationError,
        isLoading: authenticationLoading,
    } = useAuthenticatedData();

    const handleConversationIdChange = (newConversationId: string) => {
        setConversationID(newConversationId);
    };

    // useEffect(() => {
    //     setUserConfig(initialUserConfig);
    // }, [initialUserConfig]);

    useEffect(() => {
        if (uploadedFiles) {
            localStorage.setItem("uploadedFiles", JSON.stringify(uploadedFiles));
        }
    }, [uploadedFiles]);

    useEffect(() => {
        fetch("/api/chat/options")
            .then((response) => response.json())
            .then((data: ChatOptions) => {
                setLoading(false);
                if (data) {
                    setChatOptionsData(data);
                }
            })
            .catch((err) => {
                console.error(err);
                return;
            });
    }, []);

    // if (isLoading) {
    //     return <Loading />;
    // }

    return (
        <SidebarProvider>
            <AppSidebar conversationId={conversationId} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    {isMobileWidth ? (
                        <a className="p-0 no-underline" href="/">
                            <KhojLogoType className="h-auto w-16" />
                        </a>
                    ) : (
                        <h2 className="text-lg">Ask Anything</h2>
                    )}
                </header>
                <div className={`${styles.main} ${styles.chatLayout}`}>
                    <title>Quantal AI</title>
                    <div className={`${styles.chatBox}`}>
                        <div className={`${styles.chatBoxBody}`}>
                            {!authenticationLoading && (
                                <ChatBodyData
                                    isLoggedIn={authenticatedData ? true : false}
                                    chatOptionsData={chatOptionsData}
                                    setUploadedFiles={setUploadedFiles}
                                    isMobileWidth={isMobileWidth}
                                    onConversationIdChange={handleConversationIdChange}
                                    userConfig={userConfig}
                                    isLoadingUserConfig={false}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
