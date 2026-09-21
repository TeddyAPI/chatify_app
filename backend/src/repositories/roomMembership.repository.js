import RoomMembership from "../models/RoomMembership.js"; 

export const createDirectRoomMemberships = async ({
    roomId,
    userId,
    participantId,
    session
}) => {
    const now = new Date();

    return RoomMembership.insertMany(
        [
            {
                roomId,
                userId: userId,
                role: "member",
                status: "accepted",
                joinedAt: now
            },
            {
                roomId,
                userId: participantId,
                role: "member",
                status: "accepted",
                joinedAt: now
            }
        ],
        {
            session
        }
    );
};

//GR을 생성할때 방장의 멤버쉽 생성
export const createCreatorMembership = async ({
    roomId,
    createdBy,
    session
}) => {

    const now = new Date();

    return RoomMembership.create(
        {
            roomId,
            createdBy,
            role: "admin",
            status: "accepted",
            invitedBy: null,
            joinedAt: now,
            leftAt: null,
            lastVisitedAt: now
        },
        { session }
    );
};

export const createPendingMemberships = async ({
    roomId,
    createdBy,
    session
}) => {

    const now = new Date();

    return RoomMembership.create(
        {
            roomId,
            createdBy,
            role: "admin",
            status: "accepted",
            invitedBy: null,
            joinedAt: now,
            leftAt: null,
            lastVisitedAt: now
        },
        { session }
    );
};

export const findByRoomId = async ({
    roomId
}) => {

    return await RoomMembership.findById(roomId);

};