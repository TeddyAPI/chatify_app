import Cache from "../models/Cache.js";

export const findOne = async (cacheKey) => {
    return await Cache.findOne({ key: cacheKey });
};

export const deleteCacheByPattern = async (pattern) => {
    return await Cache.deleteMany({ key: { $regex: pattern } });
};

//{ upsert: true}는 없으면 새로 생성
export const findOneAndUpdate = async (filter, update, options = { upsert: true, new: true }) => {
return await Cache.findOneAndUpdate(filter, update, options);
};