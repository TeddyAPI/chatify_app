import mongoose from "mongoose";

const cacheSchema = new mongoose.Schema(
    {
        key: { 
            type: String, 
            required: true, 
            unique: true 
        }, // 'contacts_123' 같은 식별자

        value: {
            type: Object, 
            required: true 
        },            // 쿼리 결과 오브젝트 전체
  
        expiresAt: { 
            type: Date, 
            required: true 
        }           // 언제 삭제될지 (TTL)
});

// 데이터가 만료되면 자동으로 삭제되도록 인덱스 설정 (MongoDB의 강력한 기능)
// expiresAt이라는 필드를 기준으로 오름차순(1) 인덱스를 생성
// expireAfterSeconds: 0는 data가 삭제되는 시간을 수동으로 설정한다는 의미
cacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Cache = mongoose.model("Cache", cacheSchema);

export default Cache;