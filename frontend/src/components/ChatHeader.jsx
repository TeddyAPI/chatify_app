import React from 'react'
import { XIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

const ChatHeader = () => {
    
    const {selectedUser, setSelectedUser} = useChatStore()

    //소켓 통신에 참여한 유저의 id를 가진 배열을 반환
    const { onlineUsers } = useAuthStore()

    //온라인된 유저들 중에 선택된 유저 id가 있는지 확인
    const isOnline = onlineUsers.includes(selectedUser._id)

    useEffect(() => {
        const handleEscKey = (event) => {
            if (event.key === "Escape") setSelectedUser(null)
        };

        //브라우저 창(window) 전체에서 키보드 입력을 감지하는 이벤트 리스너
        //keydown 👉 키를 누름, handleEscKey:이벤트가 발생했을 때 실행될 함수
        //esc키로 모달을 닫을때 사용
        window.addEventListener("keydown", handleEscKey)

        //메모리 누수 방지를 위해 등록된 이벤트 제거
        return () => window.removeEventListener("keydonw", handleEscKey)
    }, [setSelectedUser]);


  return (
    <div 
        className="flex justify-between items-center bg-slate-800/50 border-b border-slate-700/50 max-h-[84px] px-6 flex-1"
    >
        <div className="flex items-center space-x-3">
            <div className={`avatar ${isOnline ? "online" : "offline"}`}>
                <div className="w-12 rounded-full">
                    <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
                </div>
            </div>
            <div>
                <h3 className="text-slate-200 font-medium">{selectedUser.fullName}</h3>
                <p className="text-slate-400 text-sm">{isOnline ? "Online" : "Offline"}</p>
            </div>
        </div>
        <button onClick={() => setSelectedUser(null)}>
            <XIcon className='w-5 h-5 text-slate-400 hover:text-slate-300 transition-colors cursor-pointer'/>
        </button>
    </div>
  )
}

export default ChatHeader;