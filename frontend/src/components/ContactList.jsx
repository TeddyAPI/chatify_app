import React from 'react'
import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

const ContactList = () => {
    //getAllContacts() 로그인된 유저를 제외한 모든 유저 정보를 반환하는 함수
    //allContacts은 위 함수가 반환한 값을 저장하는 state
    const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore()

    const { onlineUsers } = useAuthStore();

    useEffect(() => {
        getAllContacts();
    }, [getAllContacts])

    if (isUsersLoading) return <UsersLoadingSkeleton />

    return (
        <>
            {allContacts.map((contact) => (
                <div
                    key={contact._id} 
                    className="bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
                    onClick={() => setSelectedUser(contact)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`avatar ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
                            <div className="size-12 roudned-full">
                                <img src={contact.profilePic || "/avatar.png"} />
                            </div>
                        </div>
                        <h4 className="text-slate-200 font-medium">{contact.fullName}</h4>
                    </div>
                </div>

            ))}
        </>
    )
}

export default ContactList;