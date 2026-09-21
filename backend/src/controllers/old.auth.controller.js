import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import bcrypt from "bcryptjs";
import { ENV } from "../lib/env.js";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password} = req.body;

    try {
        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // /^ 문자열의 처음부터 검사 시작.
        // []는 문자의 집합으로 []안에서 ^는 이후 나오는 문자가 아닌것 즉 공백(\s)과 @가 아닌 문자들 1개 이상,
        // \.은 도트를 특수문자로 인식하지 않도록 \로 이스케이프
        // $/ 문자열의 끝까지 검사해야함
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        // {email}은 {email:email}과 동일, 몽구스에서는 객체 형태로 전달해야 해당 data를 email에서 검색
        const user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "Email already exists" });

        //비밀번호 해시에 추가되는 무작위 문자열인 salt 생성
        const salt = await bcrypt.genSalt(10);

        //salt를 사용해 비밀번호를 해시 처리
        const hashedPassword = await bcrypt.hash(password, salt);

        //User 인스턴스 생성, DB에 바로 저장되지는 않고 메모리 객체에 저장
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
        });

        if (newUser) {
            //입력된 유저 정보와 해쉬된 암호를 포함한 newUser를 DB에 저장
            const savedUser = await newUser.save();

            //DB에 저장한 유저 정보를 이용해  token 발행 후 res.cookie에 정보를 저장
            generateToken(savedUser._id, res)
            
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });

            try {
                //웰컴 메일을 보내기위해 emailHandlers에게 필요한 정보를 전달한다.
                //CLIENT_URL은 메일 템플릿에 app에 접속할 수 있는 링크를 표시하는 용도
                await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL)
            } catch (error) {
                console.error("Failed to send welcome email:", error)
            }
        } else {
            res.status(400).json({ message: "Invalid user data" })
        }
    } catch (error) {
        console.log("Error in signup controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log(email, password)
    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        //이미 존재하는 유저인지 확인하기 위해 해당 email을 db에서 검색해본다.
        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({ message: "Invalid credentials" });

        //유저가 입력한 password와 DB에 저장된 password를 비교 일치하면 통과
        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        //email과 password 검증 후 토큰 발행
        generateToken(user._id, res)

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic, 
         });

    } catch (error) {
        console.error("Error in login controller:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const logout = (_, res) => {
    //토콘의 maxAge를 0으로 변경하여 logout 실행
    res.cookie("jwt","", { maxAge: 0 })
    res.status(200).json({ message: "Logged out successfully" })
};

export const updateProfile = async(req, res) => {
    try {
        const { profilePic }= req.body
        if (!profilePic) return res.status(400).json({ message: "Profile pic is required" });

        //user._id인 이유는 user가 미들웨어에서 검증 후 db에서 얻은 검증된 유저 정보를 req.user에 대입하기 때문이다.
        const userId = req.user._id

        //cloudinary에 이미지 업데이트 후 url을 반환 받는다.
        const uploadResponse =  await cloudinary.uploader(profilePic)

        // 해당 유저에 이미지 url을 업데이트한다.
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
        { profilePic: uploadResponse.secure_url },
        { new: ture} //업데이트 후의 최신 document를 반환
        );

        res.status(200).json(updatedUser)

    } catch (error) {
        console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
    }
}