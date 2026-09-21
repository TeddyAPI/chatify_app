import mongoose from "mongoose";

const messageSchema = new mongoose.Schema (
    {
        // 발신자 (시스템 메시지일 경우 null 허용)
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // 방 ID (단체방 또는 1:1 방의 고유 ID)
        roomId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Room',
            required: true // 어떤 방에 속한 메시지인지는 반드시 필요
        },

        // 메시지 내용
        text: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: null
        },

        // 이미지 URL (이미지 타입일 경우 사용)
        attachments: [{
            type: {
                type: String,
                enum: ["image", "file", "video", "audio"],
                required: true
            },
            url: {
                type: String,
                required: true
            },
            name: String,
            size: Number,
            mimeType: String
        }],
        
        // 수정 여부
        editedAt: {
          type: Date,
          default: null
        },

        // Soft Delete
        deletedAt: {
          type: Date,
          default: null
        },

        deletedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null
        }
    },
    { timestamps: true }
);

// 인덱스 추가 (조회 성능 최적화)
messageSchema.index({ roomId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
