import Room from "../models/Room.js"; 

// -----------------------------------------------------------------------------
// Create Direct Room
// -----------------------------------------------------------------------------

/*
* DM Room 생성 방식
*
* 1. findOne() → create()
* * 있으면 기존 Room 조회
* * 없으면 새로운 Room 생성
* * 코드가 직관적이지만, 동시에 요청이 들어오면
* * 중복 생성 Race Condition이 발생할 수 있음
* 
* 2. findOneAndUpdate() + upsert: true
* * 있으면 기존 Room 반환
* * 없으면 새로운 Room 생성
* * 기존 Room을 업데이트하려는 목적이 아님
* * "Get or Create"를 원자적으로 처리하기 위해 사용
* * unique index와 함께 사용하면 동시 요청에 더 안전함
*
* 3. create()
* * 항상 새로운 Room을 생성
* * 기존 Room 존재 여부를 확인하지 않음
* * 따라서 DM의 "Get or Create" 용도로는 부적합
*
* 현재 DM에서는 같은 두 사용자 사이에 하나의 Room만 존재해야 하므로
* dmKey에 unique index를 설정하고,
* findOneAndUpdate() + upsert: true 방식을 사용한다.
  */


export const createDirectRoom = async({
    dmKey,
    userId,
    session
}) => {
    
    //DB에 존재여부 검증 후 create 쿼리 보다 DB 요청 횟수가 적고 동시요청에서 안전
    //원자적인 "조회 또는 생성"(get existing OR create new)

    const room = await Room.findOneAndUpdate(
        //조건에 맞는 문서 검색
        { 
            dmKey, 
            type: "direct"
        },

        //기존 문서가 존재하면 $setOnInsert이하 실행안함
        //upsert: true에 의해 새 문서만 INSERT 
        {
            $setOnInsert: {
                dmKey,
                type: "direct",
                roomName: "Direct Message",
                createdBy: userId,
            }
        },
        
        {
            // A,B 동시 요청으로 인해 동일한 룸이 2개 생기는 문제 해결을 위해 upsert 방식 사용
            // 찾는 문서가 있으면 → update, 찾는 문서가 없으면 → insert
            //update 계열 쿼리에서만 사용
            upsert: true, 

            // 업데이트 후의 문서 반환
            new: true,

            // Schema validation 실행
            runValidators: true,
            session
        }
    )

    return room
};

// -----------------------------------------------------------------------------
// Create Group Room
// -----------------------------------------------------------------------------
export const createGroupRoom = async ({
    roomName,
    createdBy, 
    session
}) => {

    //3개의 값외에는 정의하지 않으면 null이나 default 값이 저장됨
    const room = await Room.create(
        {
            roomName,
            type: "group",
            createdBy
        },
        { session }
    );

    return room;
};


export const findById = async (roomId) => {
    return await Room.findById(roomId);
};




export const updateGroupRoom = async (roomId, update) => {
    return await Room.findByIdAndUpdate(
        roomId,
        update,
        {
            new: true, //업데이트가 완료된 후의 문서를 반환
            runValidators: true
        }
    )
};


export const acceptInvitation = (roomId, userId) => {
    return Room.findOneAndUpdate(
        {
            _id: roomId,
            participants: {
                // 한 유저가 이 두 조건을 동시에 만족해야 함
                $elemMatch: {
                    userId: userId,
                    status: "pending" 
                }
            }
        },
        {
            $set: {
                "participants.$.status": "accepted", //$는 위에서 찾은 데이터의 index
                "participants.$.joinedAt": new Date()
            }
        },
        { new: true }
    );
};


export const joinRoom = async (roomId, userId) => {
    return await Room.findOneAndUpdate(
        {
            _id: roomId,
            // ⭐ 중요: 참여자 명단(participants)에 이 userId가 없는(Not Equal) 방만 찾음!
            "participants.userId": { $ne: userId }
        },
        {
            $push: {
                participants: {
                    userId: userId,
                    status: "accepted", // 오픈방이므로 바로 가입 완료
                    joinedAt: new Date()
                }
            }
        },
        { 
            new: true // 가입 후 업데이트된 방 정보를 반환
        }
    );
};

// 방을 진짜 지우는 게 아니라 status만 'deleted'로 업데이트 (소프트 딜리트)
export const softDeleteRoom = async (roomId) => {
    return await Room.findByIdAndUpdate(
        roomId,
        { $set: { status: "deleted" } },
        { new: true }
    );
};