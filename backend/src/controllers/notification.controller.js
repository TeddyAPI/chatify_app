import * as notificationService from "../services/notification.service.js";

//*** 로그인된 유저의 notifications을 반환 */
export const getNotificationService = async (req, res) => {
    try {
        const userId = req.user._id
        const notifications = await notificationService.getUserNotifications(userId)
        res.status(200).json(notifications)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
};

//*** 개별 알림 읽음 처리 */
export const markAsRead = async (req,res) => {
    try {
        const { id } = req.params;
        const updated = await notificationService.markAsRead(id);
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

 //***개별 알림 삭제 */ 
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id

        const deleted = await notificationService.deleteNotification(notificationId, userId)

        if(!deleted) {
            return res.status(404).json({ message: "Notification not found or unauthorized."})
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

 //***모든 알림 삭제 */ 
export const deleteAllNotification = async (req, res) => {
    try {
        const userId = req.user._id

        const deleted = await notificationService.deleteAllNotification(userId)

        if(!deleted) {
            return res.status(404).json({ message: "All notifications cleared."})
        }
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}