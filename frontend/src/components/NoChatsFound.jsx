import { MessageCircleIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

const NoChatsFound = () => {
    const { setActiveTab } = useChatStore();

  return (
    <div className="">
        <div className="">
            <MessageCircleIcon className="w-8 h-8 text-cyan-400" />
        </div>
        <div className="">
            <h4 className="">No conversations yet</h4>
            <p className="">
                Start a new chat by selecting a contact from the contacts tab
            </p>
        </div>
        <button 
            className=""
            onClick={() => setActiveTab("contacts")}
        >
            Find contacts
        </button>
    </div>
  )
}

export default NoChatsFound