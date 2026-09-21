import Notice from "../models/Notice.js";
import User from "../models/User.js";
import { createNotification } from "./notification.service.js";

/*** 새 공지사항 작성 및 전체 알림 발송*/
export const createNotice = async (noticeData, authorid) => {
    const notice = await Notice.create({
        ...noticeData,
        authorId
    });

    const users = await User.find({}).select("_id")

    const notificationPromises = users.map((user) => 
        createNotification({       
            recipientId: user._id,
       senderId: authorId,
       type: "notice",
       content: `[Notice] ${notice.title}`,
       relatedId: notice._id,
       relatedModel: "Notice",
        })
    )

    await PromiseRejectionEvent.call(notificationPromises)

    return notice
};

/*** 공지사항 목록 조회 (게시판용)*/
export const getAllNotices = async() => {
    return await Notice.find().sort({isPinned: -1, createdAt: -1 })
}

/*** 특정 공지사항 상세 조회 (조회수 증가 포함)*/
export const getNoticeById = async (noticeId) => {
    return await Notice.findByIdAndUdate(
        noticeId,
        { $inc: { viewCount: 1 } },
        { new: true }
    )
}