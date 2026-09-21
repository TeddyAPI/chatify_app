export const createMany = async ({
    roomId,
    targetUserIds,
    actorId,
    action,
    session
}) => {

    const histories = targetUserIds.map(userId => ({
        roomId,
        userId,
        actorId,
        action
    }));

    await roomMembershipHistoryRepository.insertMany({
        histories,
        session
    });
};