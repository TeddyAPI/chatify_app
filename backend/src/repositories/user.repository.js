import User from "../models/User.js";


export const findByEmail = async (email) => {
    return await User.findOne({ email });
};

export const create = async (userData) => {
    return await User.create(userData);
};

export const findByIdAndUpdate = async (userId, update, options = { new: true }) => {
    return await User.findByIdAndUpdate(userId, update, options).select("-password");
};

export const findOtherUsers = async (excludeUserId) => {
    return await User.find({ _id: { $ne: excludeUserId } }).select("-password");
};

export const save = async (userInstance) => {
    return await userInstance.save();
};

export const findByIds = async (ids) => {
    return await User.find({ _id: { $in: ids } }).select("-password");
};

export const exists = async (userId) => {
    return await User.exists({ _id: userId });
};