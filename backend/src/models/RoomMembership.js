import mongoose from "mongoose";

const roomMembershipSchema = new mongoose.Schema(
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

    role: {
        type: String,
        enum: ["admin", "member"],
        default: "member"
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "rejected", "left"],
        default: "pending"
    },

    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    joinedAt: {
        type: Date,
        default: null
    },

    leftAt: {
        type: Date,
        default: null
    },

    lastVisitedAt: {
        type: Date,
        default: null
    }
},
{
    timestamps: true
}

);

roomMembershipSchema.index({ roomId: 1, status: 1 });
roomMembershipSchema.index({ userId: 1, status: 1 });

roomMembershipSchema.index(
{ roomId: 1, userId: 1 },
{ unique: true }
);

const RoomMembership = mongoose.model(
"RoomMembership",
roomMembershipSchema
);

export default RoomMembership;
