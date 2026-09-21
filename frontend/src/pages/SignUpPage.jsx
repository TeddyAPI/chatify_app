import React from 'react'
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { MessageCircleIcon, LockIcon, MailIcon, UserIcon, LoaderIcon } from "lucide-react";
import { Link } from "react-router";

const SignUpPage = () => {
   //유저가 입력한 form data 저장하는 state
  const [formData, setFormData] = useState({ fullName: "", email: "", password: ""})

  // "/auth/signup"로 signup 요청 후 리턴 받은 로그인 유저 정보를 store에 저장하는 함수 와 함수 실행 상태 관리 state
  const {signup, isSigningUp} = useAuthStore();

  //// form으로 입력받은 data를 signup()에 대입하여 실행하는 함수
  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData)
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

                   {/* Full Name INPUT*/}
                  <div>
                    <label className="auth-input-albel">Full Name</label>
                    <div className="relative">
                      <UserIcon className='auth-input-icon' />
                      <input 
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="input"
                        placeholder='John doe' 
                      />
                    </div>
                  </div>

                  {/* Email INPUT */}
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
                  <button className="auth-btn" type="submit" disabled={isSigningUp} >
                    {isSigningUp ? (
                      <LoaderIcon className='w-full h-5 animate-spin text-center' />
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to= "/login" className='auth-link'>
                    Already have an account? Login
                  </Link>
                </div>
              </div>
            </div>

            {/* FORM ILLUSTRATION - RIGHT SIDE */}
            <div className="hidden md:w-1/2 md:flex items-center justify-center p-6 bg-gradient-to-bl from-slate-800/20 to-transparent">
              <div>
                <img 
                  src="/signup.png" 
                  alt="People using mobile devices" 
                  className="w-full h-auto object-contain" 
                />
              </div>
              <div className="mt-6 text-center">
                <h3 className="text-xl font-medium text-cyan-400">Start Your Journey Today</h3>

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

export default SignUpPage;