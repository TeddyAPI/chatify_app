import React from 'react'
import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";

const MessageInput = () => {
    //키보드 이벤트 발생시 램덤으로 소리 선택해 재생하는 함수
    const { playRandomKeyStrokeSound } = useKeyboardSound();

    //DOM에서 input으로 입력된 값을 state 값을 가져오기 위한 함수
    const [text, setText] = useState("");


    const [imagePreview, setImagePreview] = useState(null)

    //이미지 파일 입력을 위한 함수
    const fileInputRef = useRef(null);

    //sendMessage()는 API로 메세지를 전송하고 전송된 메세지를 message 배열에 업데이트한다.
    //isSoundEnabled의 상태값은 toggleSound()를 실행하여 localStorage에 저장된 상태값을 가져와 사운드 재생 여부를 결정한다.
    const { sendMessage, isSoundEnabled } = useChatStore();


    //메시지 전송 함수
    const handleSendMessage = (e) => {
        e.preventDefault();
        if(!text.trim() && !imagePreview) return;
        //메시지 전송시 키보드 사운드 재생
        if(isSoundEnabled) playRandomKeyStrokeSound();

        //메세지 전송 함수 
        sendMessage({
            text: text.trim(), //메시지의 앞뒤 공백 제거
            image: imagePreview,
        });
        //메세지 전송 후 입력창 이미지 미리보기 초기화
        setText("");
        setImagePreview(null)
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImageChange = (e) => {
        //사용자가 선택한 첫 번째 파일 가져오기
        const file = e.target.files[0];
        if (!file) return;

        //이미지 파일인지 검증
        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file")
            return
        }

        //이미지 사이즈 제한
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        
        if (file.size > MAX_SIZE) {
            toast.error("Image must be under 5MB");
            e.target.value = "";
            return;
        }

        //파일리더 객체 생성
        const reader = new FileReader();

        //FileReader는 이벤트 기반 비동기 API,파일을 읽는 데 시간이 걸림 그래서 “다 읽었을 때 실행할 함수”를 먼저 등록해둠
        //파일을 읽어 온다. 읽어 온 후 Base64 데이터 URL을 imagePreview에 저장
        reader.onloadend = () => setImagePreview(reader.result)

        //이미지를 Base64 문자열로 변환, <img src={imagePreview} />로 바로 미리보기 가능
        reader.readAsDataURL(file)
    };

    //선택한 이미지 제거
    const removeImage = () => {
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };


  return (
    <div className="p-4 border-t border-slate-700/50">
        {imagePreview && (
            <div className="max-w-3xl mx-auto mb-3 flex items-center">
                <div className="relative">
                    <img 
                        src={imagePreview} 
                        alt="Preivew" 
                        className="w-20 h-20 object-cover rounded-lg border border-slate-700" 
                    />
                    <button
                        onClick={removeImage} 
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center
                            text-slate-200 hover:bg-slate-700"
                        type="button"
                    >
                        <XIcon className='w-4 h-4' />

                    </button>
                </div>
            </div>
        )}

        <form 
            onSubmit={handleSendMessage} 
            className="max-w-3xl mx-auto flex space-x-4"
        >
            <input 
                type="text"
                vlaue={text}
                onChange={(e) => {
                    setText(e.target.value)
                    isSoundEnabled && playRandomKeyStrokeSound();
                }}
                className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-4"
                placeholder='Tyep your message...' 
            />

            <input 
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
            />


            <button
               type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg px-4 
                    transition-colors ${imagePreview ? "text-cyan-500" : ""
                    }`}
            >
                <ImageIcon className='w-5 h-5' />
            </button>

            <button 
                type="submit"
                disabled={!text.trim() && !imagePreview}
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg 
                    px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all 
                    disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <SendIcon className='w-5 h-5' />
            </button>
        </form>
    </div>
  )
}

export default MessageInput