import mongoose from "mongoose";

const roomMembershipHistorySchema = new mongoose.Schema(
{
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    action: {
        type: String,
        enum: [
            "invited",
            "join_requested",
            "invitation_accepted",
            "invitation_rejected",
            "join_request_approved",
            "join_request_rejected",
            "left",
            "removed"
        ],
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
},
{
    timestamps: false
}

);

roomMembershipHistorySchema.index({
roomId: 1,
userId: 1,
createdAt: -1
});

roomMembershipHistorySchema.index({
roomId: 1,
createdAt: -1
});

roomMembershipHistorySchema.index({
userId: 1,
createdAt: -1
});

const RoomMembershipHistory = mongoose.model(
"RoomMembershipHistory",
roomMembershipHistorySchema
);

export default RoomMembershipHistory;
