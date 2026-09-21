import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useRoomStore = create((set, get) => ({
    rooms: [],            // 참여 중인 모든 방 목록
    currentRoom: null,     // 현재 보고 있는 방
    isCreatingRoom: false,
    isInviting: false,
    
    // 방 생성
    createRoom: async (data) => {
        set({ isCreatingRoom: true })
        try {
            const res = await axiosInstance.post("/room/create", data)
            set((state) => ({ rooms: [...state.rooms, res.data]}))
            toast.success("Room created successfully!")
            return res.data;
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create room")
        } finally {
            set({ isCreatingRoom: false})
        }
    },

    // 유저 초대
    inviteUsers: async (roomId, targetUserIds) => {
        set({ inIviting: true })
        try {
            const res = await axiosInstance.post(`/rooms/${roomId}/invite`,{targetUserIds })
            toast.success(res.data.message)
        } catch (error) {
            toast.error(error.response?.data?.message || "Invitation failed")
        } finally {
            set({ isInviting: false })
        }
    },

    // 초대 수락
    acceptInvitation: async (roomId) => {
        try {
            const res = await axiosInstance.post(`/rooms/${roomId}/accept`)
            set({ currentRoom: res.data })
            toast.success("Joined the room!")
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to accept invitation")
        }
    },

    // 방 탈퇴
    leaveRoom: async (roomId) => {
        try {
            const res = await axiosInstance.delete(`/rooms/${roomId}/leave`);
            set((state) => ({
                rooms: state.rooms.filter((r) => r._id !== roomId),
                currentRoom: state.currentRoom?._id === roomId ? null : state.currentRoom
            }));
            toast.success(res.data.message || "Left the room");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to leave room");
        }
    },

    // 방 삭제 (방장 전용)
    deleteRoom: async (roomId) => {
        try {
            const res = await axiosInstance.delete(`/rooms/${roomId}`);
            set((state) => ({
                //rooms 배열에서 삭제된 roomId를 제거
                rooms: state.rooms.filter((r) => r._id !== roomId),
                currentRoom: state.currentRoom?._id === roomId ? null : state.currentRoom
            }));
            toast.success(res.data.message || "Room deleted successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete room");
        }
    },

    // 실시간 소켓 리스너 등록
    subscribeToRoomEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return

        //누군가 방에 들어왔을 때
        socket.on("user_joined", (data) => {
            toast(`${data.userId} joined the room`)
        })

        // 누군가 방에서 나갔을 때
        socket.on("user_left", (data) => {
            toast(data.message)
        })

        // 방장이 방을 삭제했을 때
        socket.on("room_deleted", (data) => {
            toast.error(data.message);
            set({ currentRoom: null});
            // 방 목록에서도 제거
            set((state) => ({
                rooms: state.rooms.filter((r) => r._id !== data.roomId)
            }));
        });
    },

    unsubscribeFromRoomEvents: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return
        socket.off("user_joined");
        socket.off("user_left");
        socket.off("room_deleted");
    },
    

}));