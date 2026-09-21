import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
    allContacts: [],
    chats: [],
    messages: [],
    activeTab: "chats",
    selectedUser: null,
    isUsersLoading: false,
    isMessagesLoading: false,
    //localStorage에서 사운드 설정을 읽어 초기값 결정, 사운드 on/off 설정을 전역 상태로 관리
    //JSON.parse(...)는 "true" → true로 변환
    isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

    //현재 상태를 반전시켜 localStorage에 저장하고 store에 해당 상태를 업데이트한다.
    //localStorage에 저장되어 새로고침시에도 값이 유지된다.
    toggleSound: () => {
        localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
        set({ isSoundEnabled: !get().isSoundEnabled })
    },

    //activeTab을 "chats"에서 tab이 가지는 값으로 바꾸는 함수
    setActiveTab: (tab) => set({ activeTab:tab }),
    
    //특정 유저를 선택시 해당 함수가 실행되어 선택된 유저 정보를 selectedUser에 상태값을 주입하는 함수, 
    setSelectedUser: (selectedUser) => set({ selectedUser }),

    //현재 로그인된 유저를 제외한 유저 정보를 allContacts에 저장
    getAllContacts: async () => {
        set({ isUsersLoading: true })
        try {
            //1.현재 로그인된 유저를 제외한 유저 정보를 객체 형태로 반환
            const res = await axiosInstance.get("/messages/contacts");

            //2. 얻은 유저 정보를 스토어 내부의 allContacts에 저장
            set({ allContacts: res.data })
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false})
        }
    },

    //자신과 채팅을 주고 받은 유저의 정보를 반환 받는다.
    getMyChatPartners: async () => {
        set({ isUsersLoading: true })
        try {
            //1.자신과 채팅을 주고 받은 유저의 정보를 반환
            const res = await axiosInstance.get("/messages/chats");

            //2. 얻은 유저 정보를 스토어 내부의 chats에 저장
            set({ chats: res.data })
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isUsersLoading: false})
        }
    },

    //특정 ID 유저와 나눈 메세지를 반환한다.
    getMessagesByUserId: async (userId) => {
        set({ isMessagesLoading: true })
        try {
            //1. 특정 ID 유저와 나눈 메세지를 반환
            const res = await axiosInstance.get(`/messages/${userId}`);

            //2. 얻은 유저 정보를 스토어 내부의 messages에 저장
            set({ messages: res.data })
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            set({ isMessagesLoading: false})
        }
    },

    //**메세지를 선택된 유저에게 전달*/
    sendMessage: async (messageData) => {

        //선택된 유저정보와 선택될때 업데이트된 messages의 상태 값을 받아온다.
        const { selectedUser, messages } = get();

        //react 컴포넌트 밖이라 getState()를 사용해 한번만 스토어에서 로그인된 유저 정보인 authUser를 받아온다.
        const { authUser } = useAuthStore.getState();

        const tempId = `temp-${Date.now}`

        //서버 응답을 기다리지 않고 먼저 UI를 갱신하기 위해 메세지 생성하고 messages에 바로 업데이트한다.
        //사용자 입장에서는 메시지가 바로 보내진 것처럼 보임
        const optimisticMessage = {
            _id: tempId,
            senderId: authUser._id,
            receiverId: selectedUser._id,
            text: messageData.text,
            image: messageData.image,
            createdAt: new Date().toISOString(),
            isOptimistic: true,
        };
        set({ messages: [...messages, optimisticMessage]})

        //실제 백엔드로 메세지 전달 
        try {
            //1.메세지를 받을 유저 id와 메세지를 전달 
            const res = await axiosInstance.get(`/messages/send/${selectedUser._id}`, messageData);
  
            //2. 백엔드 API는 io.to(`user:${receiverId}`).emit("newMessage", newMessage)를 호출해 메세지를 전달한다.
            //메세지 전달 후 전달된 메세지를 반환 받아 messages 배열에 추가
            //concat()을 원본인 messages는 그대로 두고 새로운 메세지를 추가해 새 배열을 반환, [...messages, ...res.data] 사용해도 됨
            //optimisticMessage와 _id만 다른 중복 메세지가 저장될 가능성이 있어 코드 변경
            set({
                messages: messages.map(msg =>
                    msg._id === tempId ? res.data : msg
                )
            });

        } catch (error) {
            //에러 발생시 처음 얻어온 messages를 다시 대입해 되돌린다.
            set({ messages: messages })
            toast.error(error.response?.data?.message || "Something went wrong");
        } 
    },

    //선택된 사용자와의 채팅 중에 실시간으로 새 메시지를 수신하고, 해당 메시지를 상태에 추가하며, 필요하면 알림음을 재생
    subscribeToMessages: () => {
        //현재 선택된 채팅 상대가 없으면 메시지를 받을 필요 없음 → 바로 종료
        const { selectedUser, isSoundEnabled } = get();
        if(!selectedUser) return;

        //소켓 통신에 연결된 socket 통신 객체
        const socket = useAuthStore.getState().socket

        //서버에서 "newMessage" 이벤트가 들어오면 콜백 실행
        socket.on("newMessage", (newMessage) => {
            //선택된 사용자로 부터 온 메세지인지 확인
            const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
            if (!isMessageSentFromSelectedUser) return;

            //현재 메시지 배열을 가져와서 새 메시지를 뒤에 붙인 새 배열로 업데이트
            const currentMessages = get().messages;
            set({ messages: [...currentMessages, newMessage] });

            if (isSoundEnabled) {
                const notificationSound = new Audio("/sounds/notifications.mp3")

                //재생 위치를 처음으로 초기화
                notificationSound.currentTime = 0;
                //.play() 실패 시 에러 로그 기록
                notificationSound.play().catch((e) => console.log("Audio play failed:", e))
            }
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        //"newMessage" 이벤트에 등록된 모든 리스너를 제거 이후 서버가 newMessage를 emit 해도 아무 반응 없음
        socket.off("newMessage");
    },

}));