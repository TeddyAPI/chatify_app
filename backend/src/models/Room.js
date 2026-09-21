import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({

  //DM의 경우는 상대방 이름을 roomName으로 설정하기 때문에 group에만 roomName 사용
  roomName: {
    type: String,
    trim: true
  },

  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },


//dm용 room 검색, 참여자 2명의 이름으로 검색하면 2명이 참가한 group room이 검색될 수 있음 
// [userId1, userId2].sort().join("_") 규칙 사용, userId1_userId2
  dmKey: {
    type: String,
    unique: true,
    sparse: true
  },

  // Room 생성자
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  //마지막 메세지를 저장해서 마지막 메세지를 표시하기 위한 쿼리를 예방
  //메세지가 업데이트 될때마다 Room.updateOne() 실행
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },

  //어떤 activity가 발생했을때 lastActivityAt을 변경할 것인가?
  // 메시지 생성 → 변경
  //활동이 일어난 room을 UI 상단에 표시하기 위한 용도
  //메세지가 업데이트 될때마다 Room.updateOne()실행
  lastActivityAt: {
    type: Date,
    default: Date.now,
    index: true // 최신 활동이 있는 룸부터 정렬
  },

  // group 룸 삭제시 archived로 변경(soft delete)
  // DM은 archived하지 않음
  status: {
    type: String,
    enum: ['active', 'archived'],
    default: 'active'
  },

  //삭제 즉 archived된 날짜 변경
  archivedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });


const Room = mongoose.model('Room', roomSchema);

export default Room;


//**Room model */
// Room
// │
// ├── roomName
// ├── type
// │     ├── direct
// │     └── group
// │
// ├── dmKey
// │
// ├── createdBy
// │
// ├── lastMessage
// ├── lastActivityAt
// │
// ├── status
// │     ├── active
// │     └── archived
// │
// ├── archivedAt
// │
// └── timestamps
//       ├── createdAt
//       └── updatedAt