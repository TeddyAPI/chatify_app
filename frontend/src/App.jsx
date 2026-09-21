import React from 'react'
import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import PageLoader from "./components/PageLoader";

import { Toaster } from "react-hot-toast"

const App = () => {
  const {checkAuth, isCheckingAuth, authUser} = useAuthStore();

  //새로고침이되면 store가 초기화되면서 authUser === null이 되면서 frontend에서는 logout으로 인식
  //하지만 브라우저의 token은 살아 있어 서버는 로그인된 사용자로 인식하는 상황이 발행하영 이를 방지하기 위해 사용
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <PageLoader />
  return (
    <div className='min-h-screen bg-slate-900 relative flex items-center justify-center p-4 overflow-hidden'>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute bottom-0 -right-4 size-96 bg-cyan-500 opacity-20 blur-[100px]" />

      <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/login"} />} />
      </Routes>

     <Toaster />
    </div>
  )
}

export default App;