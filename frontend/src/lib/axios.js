import axios from "axios";

//HTTP 요청 라이브러리 Axios 인스턴스 생성
//fetch 보다 인터셉터 사용 가능, 자동 JSON 변환, 에러 처리 편함
export const axiosInstance = axios.create({
    //배포 환경에서는 backend와 frontend가 같은 환경 api 요청시 같은 주소에 "/api" 만 붙인다.
    baseURL: import.meta.env.MODE === "development" ? "http://localhost:3000/api" : "/api",

    //쿠키를 포함해서 요청(JWT를 HttpOnly 쿠키로 저장한 경우,로그인 상태 유지,CORS 환경에서 필수)
    withCredentials: true,
});