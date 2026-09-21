import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";

const ChatsList = () => {
  //getMyChatPartners()는 로그인된 유저와 채팅을 한 유저 정보(여기서는 채팅을 나눈 상대) 반환하는 함수
  //chats은 위의 함수가 반환한 유저 정보가 대입된 state
  //setSelectedUser()는 DOM에섯 선택된 유저를 state 값으로 전달
  const {getMyChatPartners, chats, isUsersLoading, setSelectedUser} = useChatStore();
  
  //소켓 통신에 참여한 유저 정보
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  if (isUsersLoading) return <UsersLoadingSkeleton />
  if (chats.length === 0) return <NoChatsFound />

  return (
    <>
      {chats.map((chat) => (
        <div 
          key={chat._id} 
          className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(chat)}  
        >
          <div className="flex items-center gap-3">
            <div className={`avatar ${onlineUsers.includes(chat._id) ? "online" : "offline"}`}>
              <div className="size-12 roudned-full">
                <img src={chat.profilePic || "/avatar.png"}  alt={chat.fullName} />
              </div>
            </div>
            <h4 className="text-slate-200 font-medium truncate">{chat.fullName}</h4>
          </div>

        </div>
      ))}
    </>
  )
}

export default ChatsList;