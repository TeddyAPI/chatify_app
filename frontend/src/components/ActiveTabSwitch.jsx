import React from 'react'
import { useChatStore } from "../store/useChatStore";

const ActiveTabSwitch = () => {
    //acitveTab상태값과 상태값을 주입하는 setActiveTab함수를 가져온다.
    const { activeTab, setActiveTab } = useChatStore();

    return (
        <div className="tabs tabs-boxed bg-transparent p-2 m-2">
            <button
                onClick={() => setActiveTab("chats")}
                className={`tab ${
                    activeTab === "chats" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
                }`}
            >
                Chats
            </button>

            <button
                onClick={() => setActiveTab("contacts")}
                className={`tab ${
                    activeTab === "contacts" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
                }`}
            >
                Contacts
            </button>
        </div>
    )
}

export default ActiveTabSwitch;