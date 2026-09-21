import mongoose from "mongoose"

//mongoose.Schema는 class이기때문에 함수와 다르게 인스턴스 생성시 new를 생성
const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },

        fullName: {
            type: String,
            required: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        
        profilePic: {
            type: String,
            default: "",
        },

        // 직급: 가입 시 필수가 아니며 나중에 편집 가능
        position: {
            type: String,
            default: "", // 기본값을 빈 문자열로 두어 'null' 방지
            trim: true,
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            index: true,
        },

        branchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Branch",
            index: true,
        },

        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            index: true,
        },

        role: {
            type: String,
            enum: ["admin", "member", "guest"],
            default: "member",
        },

        // 유저 상태 관리
        status: {
            type: String,
            enum: ["Active", "Resigned", "Suspended"],
            default: "Active",
            index: true
        },

    },

    { timestamps: true }
);

// 조회 성능 최적화를 위한 복합 인덱스 추가
// 1. 특정 조직의 활성 상태 유저들을 빠르게 찾기 위함
userSchema.index({ organizationId: 1, status: 1 });

// 2. 이메일과 상태를 함께 체크하는 로그인 로직 최적화
userSchema.index({ email: 1, status: 1 });

// 3. 지점별/팀별 유저 목록 조회 최적화
userSchema.index({ branchId: 1, status: 1 });
userSchema.index({ teamId: 1, status: 1 });

const User = mongoose.model("User", userSchema);

export default User;