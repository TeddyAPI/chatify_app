import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
    {
        title: { 
            type: String, 
            required: true, 
            trim: true 
        },

        content: { 
            type: String, 
            required: true 
        },

        authorId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: "User", 
            required: true 
        },

        category: { 
            type: String, 
            enum: ["general", "announcement", "update"], 
            default: "general" 
        },
    
        // 특정 조직이나 팀 대상일 경우를 위해 (필요 없으면 제거 가능)
        // targetOrganizationId: { 
        //     type: mongoose.Schema.Types.ObjectId, 
        //     ref: "Organization" 
        // },
        
        isPinned: { 
            type: Boolean, 
            default: false 
       }, // 상단 고정

        viewCount: { 
            type: Number, 
            default: 0 
        } // 조회수
    },
    
    { timestamps: true }
   );
  
const Notice = mongoose.model("Notice", noticeSchema);

export default Notice;