import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";

const ChatContainer = () => {
    //getMessagesByUserId()는 전달된 id로 주고 받은 메세지를 messages 배열에 값으로 대입
    //subscribeToMessages()은 socket.on("newMessage")를 실행해 메세지를 받을 수 있는 상태로 진입 후 받은 메세지를 messages 베열에 저장
    //unsubscribeFromMessages()은 socket.off("newMessage")를 실행해 더이상 메세지를 받지 않는 상태로 전환(구독취소)
    const {
        selectedUser,
        getMessagesByUserId,
        messages,
        isMessagesLoading,
        subscribeToMessages,
        unsubscribeFromMessages,
    } = useChatStore();

    const { authUser } = useAuthStore();

    const messageEndRef = useRef(null);

    useEffect(() => {
        //선택된 유저가 주고 받은 메세지를 messages 배열에 대입
        getMessagesByUserId(selectedUser._id)

        //메세지를 받을 수 있는 상태로 전환
        subscribeToMessages();

        //클린업 컴포넌트가 언마운트 될때 socket.on 상태에서 socket.off 상태로 전환
        return () => unsubscribeFromMessages()
    }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages])

    useEffect(() => {
        //실제 DOM요소로 채팅리스트 맨끝 위치
        if (messageEndRef.current) {
            //이 요소가 화면에 보이도록 스크롤, 스크롤시 부드럽게 이동
            messageEndRef.current.scrollIntoView({ behavior: "smooth"})
        }
    }, [messages])

    return (
        <>
            <ChatHeader />
            <div className="flex-1 px-6 overflow-y-auto py-8">
                {messages.length > 0 && !isMessagesLoading ? (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {messages.map((msg) => (
                            <div 
                                key={msg._id} 
                                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"}`}
                            >
                                <div className={`chat-bubble relative ${
                                    msg.senderId === authUser._id
                                    ? "bg-cyan-600 text-white"
                                    : "bg-slate-800 text-slate-200"
                                }`}
                                >
                                    {msg.image && (
                                        <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                                    )}

                                    {msg.text && <p className="mt-2">{msg.text}</p>}
                                    <p className="text-xs mt-1 opacity-75 flex items-center gap-1">
                                        {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                    ))}
                    <div ref={messageEndRef} />
                    </div>
                ) : isMessagesLoading ? (
                    <MessagesLoadingSkeleton />
                ) : (
                    <NoChatHistoryPlaceholder name={selectedUser.fullName} />
                )}
            </div>

            <MessageInput />
        </>
    );
}

export default ChatContainer;