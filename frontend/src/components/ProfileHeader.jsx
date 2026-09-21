import React from 'react'
import { useState, useRef } from "react";
import { LogOutIcon, VolumeOffIcon, Volume2Icon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

//사운드 재생을 위한 객체 생성
const mouseClickSound = new Audio("/sounds/mouuse-click.mp3");

const ProfileHeader = () => {
    const { logout, authUser, updateProfile } = useAuthStore();
    console.log("authUser:", authUser)

    const { isSoundEnabled, toggleSound } = useChatStore()

    const [ selectedImg, setSelectedImg ] = useState(null);

    const fileInputRef = useRef(null);

    //<input type="file" onChange={handleImageUpload} />에서 호출
    //이미지 파일을 선택하면 → Base64로 변환 → 미리보기로 저장 → 서버(또는 상태)로 업로드
    const handleImageUpload = (e) => {
        //파일이 여러 개일 수 있지만 첫 번째만 사용
        const file = e.target.files[0];
        if (!file) return

        //파일을 읽어서 문자열/바이너리로 변환할 때 사용하는 브라우저 내장 API
        const reader = new FileReader();

        //이미지 파일 → Base64 문자열로 변환
        //왜 Base64? <img src="...">에 바로 넣을 수 있음, 서버 전송이 간편함 (JSON 가능)
        reader.readAsDataURL(file);

        reader.onloadend = async () => {
            //reader.result에 변환된 Base64 문자열이 들어 있음
            const base64Image = reader.result;
            //selectedImg의 state 값을로 업데이트
            setSelectedImg(base64Image);

            //"/auth/update-profile"로 이미지 파일을 전달하여 유저 정보를 업데이트한다.
            await updateProfile({ profilePic: base64Image })
        }
    };
    

  return (
    <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                {/* AVATAR */}
                <div className="avatar online">
                    <button 
                        className='size-14 rounded-full overflow-hidden relative group'
                        onClick={() => fileInputRef.current.click()}    
                    >
                        <img 
                            src={selectedImg || authUser.profilePic ||"/avatar.png"} 
                            alt="User image" 
                            className="size-full object-cover" 
                        />
                        <div className="absolute inset-0 bg-black/50 opcacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-white test-xs">Change</span>
                        </div>
                    </button>

                    <input 
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden" 
                    />
                </div>

                {/* USERNAME & ONLINE TEXT */}
                <div>
                    <h3 className="text-slate-200 font-medium text-base max-w-[180px] truncate">
                        {authUser.fullName}
                    </h3>
                    <p className="text-slate-400 text-xs">Online</p>
                </div>
            </div>
            {/* BUTTONS */}
            <div className="flex gap-4 items-center">
                {/* LOGOUT BTN */}
                <button 
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    onClick={logout}
                >
                    <LogOutIcon className='size-5' />
                </button>

                {/* SOUND TOGGLE BTN */}
                <button 
                    className="text-slate-400 hover:text-slate-200 transition-colors"
                    onClick={() => {
                        mouseClickSound.currentTime = 0; //오디오를 항상 처음부터 재생,빠르게 연속 클릭해도 소리가 끊기지 않게 함
                        mouseClickSound.play().catch((error) => console.log("Audio play failed:", error)) //클릭 소리를 재생, 에러 발생시 에러 처리
                        //새로고침·재접속·브라우저 재시작 후에도 “사운드 ON/OFF 설정을 유지하기 위해 isSoundEnabled 불린 상태값을 localstorage에 저장, 
                        //버튼 클릭시 마다 값을 반전시켜 저장
                        toggleSound() 
                    }}
                >
                    {isSoundEnabled ? (
                        <Volume2Icon className='size-5' /> 
                    ) : (<VolumeOffIcon className='size-5' />
 
                    )}

                </button>
            </div>
        </div>
    </div>
  )
}

export default ProfileHeader;