import * as noticeService from "../services/notice.service.js";

export const createNotice = async (req, res) => {
    try {
        const { title, content, category, isPinned } = req.body;
        const authorId = req.user._id;

        const notice = await noticeService.createNotice(
            { title, content, category, isPinned },
            authorId
        );

        res.status(201).json(notice);
    } catch (error) {
        console.error("Error in createNotice controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getNotices = async(req, res) => {
    try {
        const notices = await noticeService.getAllNotices();
        res.status(200).json(notices) 

    } catch (error) {
        console.error("Error in getNotices controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;
        const notice = await noticeService.getNoticeById(id);

        if (!notice) {
          return res.status(404).json({ message: "Notice not found" });
        } 
        res.status(200).json(notice);
    } catch (error) {
        console.error("Error in getNoticeById controller:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};