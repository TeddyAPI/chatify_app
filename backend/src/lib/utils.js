import jwt from "jsonwebtoken"
import {ENV} from "./env.js"

export const generateToken = (userId, res) => {
    const {JWT_SECRET} = ENV;

    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not configured")
    }

    //JWT를 생성하는 함수
    const token = jwt.sign({ userId}, JWT_SECRET, {
        expiresIn: "7d",
    });

    //res.cookie에 token을 쿠키로 저장한다.
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000, //7일 후 만료됨
        httpOnly: true, // prevent XSS attacks: cross-site scripting,쿠키가 JavaScript에서 접근 불가하도록 설정
        sameSite: "strict", // CSRF attacks,쿠키가 같은 사이트에서만 전송됨
        secure: ENV.NODE_ENV === "development" ? false : true, //쿠키를 HTTPS에서만 전송하도록 설정, 개발환경에서는 http도 허용
    })

    return token
}
