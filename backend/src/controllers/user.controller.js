import { generateToken } from "../lib/utils.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import * as userService from "../services/user.service.js";


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

        //서비스 호출
        const savedUser = await userService.signup({fullName, email, password})

        if (savedUser) {

            //DB에 저장한 유저 정보를 이용해  token 발행 후 res.cookie에 정보를 저장
            generateToken(savedUser._id, res)
            
            res.status(201).json({
                _id: savedUser._id,
                fullName: savedUser.fullName,
                email: savedUser.email,
                profilePic: savedUser.profilePic,
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
        console.log("Error in signup controller:", error.message);
        const statusCode = error.message === "Email already exists" ? 400 : 500;
        res.status(statusCode).json({ message: error.message || "Internal server error" });
    };
}

export const login = async (req, res) => {
    const { email, password } = req.body;


    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }
    try {
        
        const user = await userService.login({email, password})
       
        //email과 password 검증 후 토큰 발행
        generateToken(user._id, res)

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic, 
         });

    } catch (error) {
        console.error("Error in login controller:", error.message);

        const statusCode = error.message === "Invalid credentials" ? 400 : 500;
        res.status(statusCode).json({ 
            message: error.message || "Internal server error" 
        });
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

        const updatedUser = await userService.updateProfile({userId, profilePic})

        res.status(200).json(updatedUser)

    } catch (error) {
        console.log("Error in update profile:", error);
        if (error.message === "User not found") {
            return res.status(404).json({ message: error.message })
        }
        res.status(500).json({ message: "Internal server error" });
    }
}