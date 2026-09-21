import React from 'react'
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, MailIcon, LoaderIcon, LockIcon } from "lucide-react";
import { Link } from "react-router";

const LoginPage = () => {

  //유저가 입력한 form data 저장하는 state
  const [formData, setFormData] = useState({ email: "", password: ""});
  
  // "/auth/login"로 로그인 요청 후 로그인 유저 정보를 store에 저장하는 함수와 함수 실행 상태 관리 state
  const { login, isLoggingIn } = useAuthStore();

  // form으로 입력받은 data를 login()에 대입하여 실행하는 함수
  const handleSubmit = (e) => {
    e.preventDefault()
    login(formData)
  }
  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900">
      <div className="relative w-full max-w-6xl md:h-[800px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row">
            {/* FORM CLOUMN - LEFT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30">
              <div className="w-full max-w-md">
                {/* HEADING TEXT */} 
                <div className="text-center mb-8">
                  <MessageCircleIcon className='w-12 h-12 mx-auto text-slate-400 mb-4'/>
                  <h2 className="text-2xl font-bold text-slate-200 mb-2">Welcom Back</h2>
                  <p className="text-slate-400">Login to access to your account</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* EMAIL INPUT */}
                  <div>
                    <label className="auth-input-albel">Email</label>
                    <div className="relative">
                      <MailIcon className='auth-input-icon' />
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input"
                        placeholder='johndoe@gmail.com' 
                      />
                    </div>
                  </div>

                  {/* PASSWORD INPUT */}
                  <div>
                    <label className="auth-input-albel">Password</label>
                    <div className="relative">
                      <LockIcon className='auth-input-icon' />
                      <input 
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input"
                        placeholder='Enter your password' 
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button className="auth-btn" type="submit" disabled={isLoggingIn} >
                    {isLoggingIn ? (
                      <LoaderIcon className='w-full h-5 animate-spin text-center' />
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to= "/signup" className='auth-link'>
                    Don't have an account? Sign Up
                  </Link>
                </div>
              </div>
            </div>

            {/* FORM ILLUSTRATION - RIGHT SIDE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
              <div>
                <img 
                  src="/login.png" 
                  alt="People using mobile devices" 
                  className="w-full h-auto object-contain" 
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-medium text-cyan-400">Content anytime, anywhere</h3>
                <div className="mt-4 flex justify-center gap-4">
                  <span className="auth-badge">Free</span>
                  <span className="auth-badge">Easy Setup</span>
                  <span className="auth-badge">Private</span>
                </div>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  )
}

export default LoginPage;