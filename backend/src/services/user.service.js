import * as userRepository from "../repositories/user.repository.js";
import * as cacheRepository from "../repositories/cache.repository.js"; // 추가
import * as bcrypt from 'bcryptjs';
import cloudinary from "../lib/cloudinary.js";

export const signup = async ({ fullName, email, password }) => {
    //1.중복 확인
    const existingUser = await userRepository.findByEmail({ email });
    if (existingUser) throw new Error("Email already exists");

    //2.비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //3.유저 저장
    const newUser = userRepository.create({
        fullName,
        email,
        password: hashedPassword,
    })

    //4. 캐쉬 무효화
    //로그인 유저마다 all_contacts_id 형태의 캐쉬가 생성되기 때문에 새로운 유저가 생성되는 모든 로그인 유저의 캐쉬 무효화
    //정규식을 사용해 all_contacts이 들어간 캐쉬는 모두 삭제
    await cacheRepository.deleteCacheByPattern(/^all_contacts/);

    return newUser;

}

export const login = async ({ email, password}) => {
    //이미 존재하는 유저인지 확인하기 위해 해당 email을 db에서 검색해본다.
    const user = await userRepository.findByEmail({ email });
    if (!user) throw new Error("Invalid credentials");

    //패스워드 비교
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) throw new Error("Invalid credentials");
    
    return user;
}

export const updateProfile = async({ userId, profilePic}) => {
    //1. cloudinary로 업로드
    const uploadResponse = await cloudinary.uploader.upload(profilePic)

    //2.DB 업데이트
    const updatedUser =  await userRepository.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url},
    )

    //3.캐쉬 무효화
    // $regex는 데이터가 많을 경우 매우 느려짐 그 경우 특정 키만 정확히 타겟팅 필요
    await cacheRepository.deleteCaches({
        $or: [
            // { key: `all_contacts_${userId}` }, //내 연락처 캐시
            // { key: `chat_partners${userId}` }, // 내 파트너 캐시
            { key: { $regex: /^all_contacts_/ } }, //간단하게 전체 목록 초기화
            { key: { $regex: /^chat_partners_/ } }, //혹인 전체 파트너 목록 초기화
        ]
    });

    return updatedUser;
}


// import User from "../models/User.js";
// import Cache from "../models/Cache.js";
// import bcrypt from "bcryptjs";
// import cloudinary from "../lib/cloudinary.js";

// export const signup = async ({ fullName, email, password }) => {
//     //1.중복 확인
//     const existingUser = await User.findOne({ email });
//     if (existingUser) throw new Error("Email already exists");

//     //2.비밀번호 해싱
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     //3.유저 저장
//     const newUser = new User({
//         fullName,
//         email,
//         password: hashedPassword,
//     })

//     const savedUser = await newUser.save();

//     //4. 캐쉬 무효화
//     //로그인 유저마다 all_contacts_id 형태의 캐쉬가 생성되어 모든 로그인 유저의 캐쉬 무효화
//     //정규식을 사용해 all_contacts이 들어간 캐쉬는 모두 삭제
//     await Cache.deleteMany({ key: { $regex: /^all_contacts/} });

//     return savedUser;

// }

// export const login = async ({ email, password}) => {
//     //이미 존재하는 유저인지 확인하기 위해 해당 email을 db에서 검색해본다.
//     const user = await User.findOne({email});
//     console.log(user)
//     if (!user) throw new Error("Invalid credentials");

//     //패스워드 비교
//     const isPasswordCorrect = await bcrypt.compare(password, user.password);
//     console.log("isPasswordCorrect",isPasswordCorrect)
//     if (!isPasswordCorrect) throw new Error("Invalid credentials");
    
//     return user;
// }

// export const updateProfile = async({ userId, profilePic}) => {
//     //1. cloudinary로 업로드
//     const uploadResponse = await cloudinary.uploader.upload(profilePic)

//     //2.DB 업데이트
//     const updatedUser =  await User.findByIdAndUpdate(
//         userId,
//         { profilePic: uploadResponse.secure_url},
//         { new: true}
//     ).select("-password");

//     //3.캐쉬 무효화
//     // $regex는 데이터가 많을 경우 매우 느려짐 그 경우 특정 키만 정확히 타겟팅 필요
//     await Cache.deleteMany({
//         $or: [
//             // { key: `all_contacts_${userId}` }, //내 연락처 캐시
//             // { key: `chat_partners${userId}` }, // 내 파트너 캐시
//             { key: { $regex: /^all_contacts_/ } }, //간단하게 전체 목록 초기화
//             { key: { $regex: /^chat_partners_/ } }, //혹인 전체 파트너 목록 초기화
//         ]
//     });

//     return updatedUser;
// }
