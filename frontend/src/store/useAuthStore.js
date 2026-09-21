import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:3000" : "/";

export const useAuthStore = create((set, get) => ({

    //초기값
    authUser: null,
    isCheckingAuth: true,
    isSigningUp: false,
    isLoadingIn: false,
    socket: null,
    onlineUsers: [],

    checkAuth: async () => {

        set({ isCheckingAuth: true });

        try {
            //1.현재 로그인 상태인지 확인 요청
            const res = await axiosInstance.get("/auth/check");

            //2. 로그인 유저 정보를 스토어 내부의 authUser에 대입
            set({ authUser: res.data })

            //3. 스토어 내부의 connectScoket()을 실행해 소켓 통신 연결
            get().connectSocket();
        } catch (error) {
            console.log("Error in authCheck:", error);
            set({ authUser: null });
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    signup: async (data) => {

        set({ isSigningUp: true })

        try {
            //1.signup을 위해 data를 api에 전달 후 signup된 유저 정보를 리턴 받는다.
            const res = await axiosInstance.post("/auth/signup", data);

            //2.signup된 유저 정보를 authUser 상태값으로 대입
            set({ authUser: res.data })

            toast.success("Account created successfully!");

            //3. 스토어 내부의 connectScoket()을 실행해 소켓 통신 연결
            get().connectSocket();
        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {

        set({ isLoggingIn: true })

        try {
            //1.login 위해 data를 api에 전달 후 login된 유저 정보를 리턴 받는다.
            const res = await axiosInstance.post("/auth/login", data);

            //2.login된 유저 정보를 authUser 상태값으로 대입
            set({ authUser: res.data })

            toast.success("Account created successfully!");

            //3. 스토어 내부의 connectScoket()을 실행해 소켓 통신 연결
            get().connectSocket();

        } catch (error) {
            toast.error(error.response.data.message)
        } finally {
            set({ isLoggingIn: false });
        }
    },

    logout: async () => {
        try {
            //1.logout을 api 요청
            await axiosInstance.post("/auth/logout");

            //2.logout 되었기 때문에 authUser 상태값을 null 대체
            set({ authUser: null })

            toast.success("Logged out successfully");

            //3. 소켓 통신도 종료하기위해 disconnectScoket()을 실행
            get().disconnectSocket();
            
        } catch (error) {
            toast.error("Error logging out");
            console.log("Logout error:", error);
        }
    },

    updateProfile: async (data) => {
        try {
            //1.프로파일을 업데이트하기 위해 data를 api에 전달 후 업데이트된 유저 정보를 리턴 받는다.
            const res = await axiosInstance.get("/auth/update-profile", data);

            //2.업데이트된 유저 정보를 authUser 상태값으로 대입
            set({ authUser: res.data })

            toast.success("Profile updated successfully");

        } catch (error) {
            console.log("Error in update profile:", error);
            toast.error(error.response.data.message);
        }
    },

    
    connectSocket: () => {
        //connectSocket() 함수를 실행하기전에 로그인을 통해 authUser에는 로그인된 유저정보가 들어 있다.
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return

        //io 객체가 JWT가 들어 있는 쿠키를 같이 전송
        const socket = io(BASE_URL, {
            withCredentials: true, 
        });

        //소켓 통신 연결 요청을 하면 백엔드에서는 socket.handshake.headers.cookie에서 JWT 추출 후 검증한다.
        socket.connect()

        set({ socket });

        //"getOnlineUsers" 이벤트를 서버로 부터 수신
        socket.on("getOnlineUsers", (userIds) => {
            set({ onlineUsers: userIds})
        })
    },

    disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
    },
}))