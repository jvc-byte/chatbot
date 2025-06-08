export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export interface ChatMessage {
    message: string;
    conversation_id?: string;
}

export interface ChatResponse {
    response: string;
    conversation_id: string;
}
