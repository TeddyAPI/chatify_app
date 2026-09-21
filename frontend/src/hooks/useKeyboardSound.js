//브라우저의 HTMLAudioElement 객체 생성, 배열로 만든 이유는 여러 개의 키보드 소리 중 랜덤으로 하나 선택하기 위해
//이 배열은 컴포넌트 밖에 있어서 렌더링될 때마다 새로 생성되지 않고 한 번만 생성됨
const keyStrokeSounds = [
    new Audio("/sounds/keystroke1.mp3"),
    new Audio("/sounds/keystroke2.mp3"),
    new Audio("/sounds/keystroke3.mp3"),
    new Audio("/sounds/keystroke4.mp3"),
]

//키보드 사운드 관련 로직을 재사용하기 위한 커스텀 훅
function useKeyboardSound() {

    const playRandomKeyStrokeSound = () => {
        //Math.random()은 0 ~ 0.999의 사이의 값으로 1 이상의 숫자가 나오지 않게 보장, 여기에 keyStrokeSounds.length 값을 곱한다.
        //Math.floor()는 소수점 이하를 전부 버린다. 즉 3.9 또는 3.1이 나와도 무조건 내려서 3이 된다.  
        const randomSound = keyStrokeSounds[Math.floor(Math.random() * keyStrokeSounds.length)];

        //오디오 파일의 현재 재생 위치(초 단위)로 항상 처음부터 다시 재생하겠다는 뜻
        randomSound.currentTime = 0;

        //오디오 재생 시작
        randomSound.play().catch((error) => console.log("Audio play failed:", error))
    }

    //객체 형태로 반환하는 이유는 확장 가능하고, 읽기 쉽고, React 훅 패턴에 맞는 API를 만들기 위해서다.
    //useState() → 배열 반환 (순서 중요), 커스텀 훅 → 객체 반환이 일반적
    return { playRandomKeyStrokeSound };
}

export default useKeyboardSound;