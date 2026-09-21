import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js"; // 인증 미들웨어 경로 확인
import { 
    createRoom, 
    inviteUsersToRoom, 
    acceptInvitation, 
    joinRoom, 
    leaveRoom, 
    deleteRoom,
    getUserRooms,
    getDiscoverableRooms
} from "../controllers/room.controller.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";


const router = express.Router();

// 모든 방 관련 경로는 로그인이 필요함
router.use(arcjetProtection, protectRoute);


// --- 생성 및 상태 변경 (POST) ---

// 1. 방 생성 *
router.post("/create", createRoom);

// 2. 유저 초대 (방 ID를 파라미터로 받음)
router.post("/:roomId/invite", inviteUsersToRoom);

// 3. 초대 수락
router.post("/:roomId/accept", acceptInvitation);

// 4. 방 입장 (직접 참여 등)
router.post("/:roomId/join", joinRoom);


// --- 삭제 및 탈퇴 (DELETE) ---

// 5. 방 탈퇴
router.delete("/:roomId/leave", leaveRoom);

// 6. 방 삭제 (방장 전용)
router.delete("/:roomId", deleteRoom);


// --- 조회 관련 (GET) ---

// 7. 내가 속한 방 목록 조회 (사이드바/채팅 목록용) *
router.get("/my-rooms", getUserRooms) 

// 8. 참여하지 않은 새로운 방 탐색 (오픈 채팅 탐색용)
router.get("/discover", getDiscoverableRooms)

export default router;