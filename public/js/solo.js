/* =========================================================
   solo.js — 「혼자 듣는 숲수업」
   해설가가 없어도 앱이 대신 안내하는 자율 코스입니다.
   대상(초등·청소년·성인·가족)을 고르면 문장의 결이 바뀌고,
   정거장마다 [찾기 → 해 보기 → 들어보기 → 물음 → 답]으로 진행합니다.
   음성 안내는 voice.js 의 Voice 를 그대로 씁니다.
   ========================================================= */

const AUDIENCES = [
  { id: "kid",   name: "초등 저학년", note: "한 문장을 짧게. 손으로 만지고 세는 미션 위주.", stopMin: 5 },
  { id: "kid2",  name: "초등 고학년", note: "왜 그런지 까닭을 묻습니다. 비교하는 미션.",     stopMin: 6 },
  { id: "teen",  name: "청소년",     name2: "중·고", note: "용어를 그대로 쓰고 근거를 따집니다.", stopMin: 7 },
  { id: "adult", name: "성인",       note: "개념어를 쓰고 성찰 시간을 길게 둡니다.",        stopMin: 8 },
  { id: "family",name: "가족",       note: "어른과 아이가 함께 하는 역할 나누기.",          stopMin: 6 }
];

/* 정거장: find(찾기) / do(해 보기) / talk(들어보기) / ask(물음) / answer(답) */
const SOLO_COURSES = [
  {
    id: "habit", title: "나무는 어떻게 버티는가", sub: "습성 읽기",
    place: "동네 공원, 아파트 단지, 학교 운동장 가장자리 — 어디든 됩니다",
    min: 40, best: "사계절 언제나",
    stops: [
      { find: "잎이 달린 나무와 잎이 없는(또는 늘 푸른) 나무를 한 그루씩",
        do: "두 나무 사이에 서서 위를 올려다보고, 하늘이 더 많이 보이는 쪽으로 한 걸음 옮겨 보세요.",
        talk: "겨울에도 잎을 붙들고 있는 나무를 상록성, 잎을 떨구는 나무를 낙엽성이라고 합니다. 버티는 쪽과 비우는 쪽. 둘 다 살아남는 방법입니다. 소나무는 잎이 가늘어 물이 덜 빠져나가고, 은행나무는 아예 잎을 버려서 겨울을 납니다.",
        ask: "잎을 버리는 것이 손해일까요?",
        answer: "손해가 아닙니다. 잎은 물을 내보내는 구멍이기도 합니다. 겨울에는 땅이 얼어 물을 못 빨아들이니, 잎을 달고 있으면 오히려 말라 죽습니다. 버리는 것이 아끼는 방법입니다." },
      { find: "그늘 안쪽에서 자라는 작은 나무",
        do: "그늘 속 어린 나무의 잎과, 볕이 잘 드는 곳 나무의 잎을 나란히 놓고 크기를 견주어 보세요.",
        talk: "그늘을 견디는 나무를 음수, 볕을 좋아하는 나무를 양수라고 부릅니다. 음수는 어두운 곳에서 잎을 넓게 펴서 적은 빛을 최대한 받습니다. 서두르지 않고 위가 열릴 때를 기다립니다.",
        ask: "그늘 속 나무의 잎이 더 넓었나요, 좁았나요?",
        answer: "대체로 넓고 얇습니다. 빛이 적으니 받는 면적을 늘린 것입니다. 볕이 센 자리의 잎은 오히려 작고 두꺼워집니다. 마르지 않으려는 것입니다." },
      { find: "밑동이 잘렸거나 가지가 부러진 자리",
        do: "잘린 자리 둘레를 손가락으로 훑어 보세요. 새순이나 혹처럼 부푼 부분이 만져지는지.",
        talk: "줄기가 잘려도 밑동에서 새순을 밀어 올리는 힘을 맹아력이라고 합니다. 참나무류가 특히 셉니다. 잘린 것이 끝이 아니라는 것을, 나무는 몸으로 보여 줍니다.",
        ask: "나무는 왜 상처를 아예 없애지 못할까요?",
        answer: "나무는 상처를 고치는 게 아니라 가둡니다. 그 자리를 새 조직으로 감싸 덮을 뿐, 안쪽의 손상은 평생 남습니다. 그래서 아문 자리가 혹처럼 부풀어 오릅니다." },
      { find: "무엇인가를 타고 올라간 덩굴",
        do: "덩굴이 감고 도는 방향(시계 방향인지 반대인지)을 눈으로 따라가 보세요.",
        talk: "스스로 서지 못하고 남의 몸을 빌려 위로 가는 것을 덩굴성이라고 합니다. 칡과 다래가 그렇습니다. 기둥을 만드는 데 쓸 힘을 아껴 빨리 올라갑니다. 얌체 같지만 아주 효율적인 계산입니다.",
        ask: "덩굴에게 기둥이 없는 것은 약점일까요?",
        answer: "약점이자 전략입니다. 기둥을 만들지 않아 빨리 자랄 수 있지만, 기댈 것이 없으면 서지 못합니다. 무엇을 포기하고 무엇을 얻을지 고른 것입니다." },
      { find: "길가에 서서 매연을 그대로 맞는 가로수",
        do: "잎을 한 장 살펴보세요. 먼지가 앉았는지, 잎 표면이 반들거리는지.",
        talk: "도시의 공해를 견디는 힘을 내공해성이라고 합니다. 은행나무와 양버즘나무가 대표적입니다. 바닷가에서 소금기를 견디는 힘은 내염성이라 하고, 팽나무와 후박나무가 그렇습니다. 견딤에도 종류가 있습니다.",
        ask: "오늘 만난 나무 중 내 삶의 태도와 가장 닮은 습성은 무엇이었나요?",
        answer: "정답은 없습니다. 다만 하나를 고르고, 왜 그것을 골랐는지 한 문장으로 적어 보세요. 그 문장이 오늘의 수확입니다." }
    ]
  },
  {
    id: "body", title: "껍질과 나이테를 읽는 법", sub: "형태와 생존 과학",
    place: "나무가 굵은 곳 — 오래된 공원, 학교, 사찰 입구",
    min: 40, best: "사계절 언제나",
    stops: [
      { find: "잘린 그루터기 또는 톱질 자국이 있는 나무",
        do: "나이테를 세어 보세요. 다 세지 못해도 좋습니다. 넓은 테와 좁은 테를 찾아보는 것이 목적입니다.",
        talk: "나이테는 봄여름에 빨리 자란 부분과 가을겨울에 더디 자란 부분이 만나 생깁니다. 넓은 해는 물과 볕이 넉넉했던 해, 좁은 해는 힘들었던 해입니다. 나무는 자기 일기를 몸에 적습니다.",
        ask: "나이테가 한쪽으로 치우쳐 있다면 왜일까요?",
        answer: "기울어진 자리에서 자랐기 때문입니다. 쓰러지지 않으려고 한쪽에 목재를 더 붙입니다. 나이테의 치우침은 그 나무가 어느 방향으로 힘을 받았는지를 알려 줍니다." },
      { find: "껍질이 거친 나무와 매끈한 나무",
        do: "두 나무의 껍질을 손바닥으로 각각 만져 보세요. 눈을 감고 만지면 더 잘 느껴집니다.",
        talk: "껍질은 갑옷입니다. 물을 지키고 벌레와 불을 막습니다. 소나무의 두꺼운 껍질은 산불에서 속을 지키고, 배롱나무의 매끈한 껍질은 벌레가 붙기 어렵게 만듭니다. 거칠고 매끈한 것에는 다 이유가 있습니다.",
        ask: "껍질에 난 작은 점이나 줄이 보이나요?",
        answer: "피목이라고 하는 숨구멍입니다. 나무도 껍질로 숨을 쉽니다. 벚나무 껍질의 가로줄이 대표적입니다." },
      { find: "잎 한 장 (떨어진 것으로 충분합니다)",
        do: "잎을 햇빛에 비춰 잎맥을 보세요. 굵은 줄에서 가는 줄이 갈라지는 순서를 눈으로 따라가 보세요.",
        talk: "잎맥은 물길이자 뼈대입니다. 굵은 데서 가늘게 갈라지는 구조는 다리와 건물에도 쓰입니다. 적은 재료로 넓은 면을 버티는 방법이기 때문입니다. 잎 한 장이 공학 교과서입니다.",
        ask: "잎맥이 나란한 잎과 그물처럼 얽힌 잎, 둘 다 찾을 수 있나요?",
        answer: "나란한 것은 대개 외떡잎식물(벼, 대나무, 붓꽃), 그물 모양은 쌍떡잎식물(참나무, 단풍)입니다. 잎맥만 봐도 큰 가문이 갈립니다." },
      { find: "가장 크고 오래돼 보이는 나무",
        do: "나무에서 열 걸음 물러나 전체 모양(수관)을 봅니다. 우산인지, 부채인지, 촛불인지.",
        talk: "수관의 모양은 빛과 바람이 함께 만든 것입니다. 빛을 고루 받으면 둥글게, 한쪽에서만 받으면 기울어집니다. 바람이 센 곳은 낮고 넓게 퍼집니다. 모양은 성격이 아니라 이력입니다.",
        ask: "이 나무는 어느 쪽에서 빛을, 어느 쪽에서 바람을 받았을까요?",
        answer: "가지가 길고 무성한 쪽이 빛을 받은 쪽, 짧고 뒤로 물러난 쪽이 바람을 맞은 쪽일 가능성이 큽니다. 나무의 모양을 읽으면 그 자리의 날씨를 읽는 셈입니다." }
    ]
  },
  {
    id: "name", title: "이름에 담긴 뜻", sub: "학명으로 읽는 생태",
    place: "이름표(수목 명찰)가 붙은 곳 — 수목원, 식물원, 잘 관리된 공원",
    min: 50, best: "사계절 언제나",
    stops: [
      { find: "학명이 적힌 나무 이름표 아무거나",
        do: "이름표의 두 번째 단어(종소명)를 소리 내어 읽어 보세요.",
        talk: "학명은 두 단어입니다. 앞은 가문(속명), 뒤는 그 나무만의 특징(종소명)입니다. koreana는 한국의, japonica는 일본의, sinensis는 중국의라는 뜻입니다. 이름 안에 그 나무가 처음 기록된 자리가 들어 있습니다.",
        ask: "여기서 koreana나 koraiensis가 붙은 나무를 찾을 수 있나요?",
        answer: "구상나무 Abies koreana, 잣나무 Pinus koraiensis가 대표적입니다. 이름에 나라가 들어간 나무는 그 나라가 지킬 책임을 함께 진 나무이기도 합니다." },
      { find: "단풍나무 — 잎이 손바닥처럼 갈라진 나무를 찾으세요",
        do: "잎을 한 장 따서 손바닥 위에 올려 보세요.",
        talk: "단풍나무의 학명은 Acer palmatum입니다. palmatum은 손바닥 모양이라는 뜻입니다. 이름을 지은 사람도 똑같이 손바닥 위에 잎을 올려 봤을 겁니다. 학명은 어려운 말이 아니라, 처음 본 사람이 남긴 관찰 기록입니다.",
        ask: "손가락은 몇 개로 갈라졌나요?",
        answer: "종류에 따라 다섯에서 아홉 갈래입니다. 갈래 수는 종을 가르는 단서가 됩니다." },
      { find: "은행나무 — 부채꼴 잎이 달린 나무를 찾으세요",
        do: "잎 가운데가 갈라졌는지 보세요. 짧은 가지에 잎이 뭉쳐 난 자리도 찾아보세요.",
        talk: "은행나무는 Ginkgo biloba입니다. biloba는 두 갈래라는 뜻으로, 잎 가운데가 갈라진 모습입니다. 그런데 속명 Ginkgo는 사실 오기입니다. 은행을 뜻하는 긴쿄를 잘못 옮겨 적은 것이 그대로 굳었습니다. 잘못 쓴 글자가 300년째 세계 공용어로 쓰이고 있습니다.",
        ask: "잎이 뭉쳐서 나는 짧은 가지가 보이나요?",
        answer: "단지라고 합니다. 은행나무는 길게 뻗는 가지와 잎만 뭉쳐 내는 짧은 가지를 나누어 씁니다. 오래된 나무에서는 줄기에 젖꼭지 모양의 뿌리(유주)가 늘어지기도 합니다." },
      { find: "아까시나무 (흔히 아카시아라 부르는 나무)",
        do: "잎이 여러 장 나란히 붙어 있는 모양과, 가지의 가시를 확인하세요. 가시는 만지지 말고 눈으로만.",
        talk: "학명은 Robinia pseudoacacia, 가짜 아카시아라는 뜻입니다. 진짜 아카시아는 열대의 다른 나무입니다. 이 나무는 태어날 때부터 오해를 안고 들어왔습니다. 표준 이름도 아카시아가 아니라 아까시나무입니다.",
        ask: "이름을 잘못 부르면 무엇이 달라질까요?",
        answer: "부르는 사람에게는 별일 아니지만, 기록에는 큰일입니다. 다른 나무를 같은 이름으로 부르면 연구도 보호도 어긋납니다. 학명이 필요한 이유가 여기 있습니다." },
      { find: "잎갈나무 또는 낙엽송이라 적힌 침엽수 (없으면 건너뛰세요)",
        do: "바늘잎인데 가을에 잎을 떨구는지 확인해 보세요. 겨울이라면 앙상한 침엽수를 찾으면 됩니다.",
        talk: "일본잎갈나무 Larix kaempferi는 바늘잎을 가졌지만 가을에 잎을 다 떨굽니다. 침엽수는 늘 푸르다는 공식이 여기서 깨집니다. 자연에는 예외가 규칙만큼 많습니다.",
        ask: "규칙과 예외 중 어느 쪽이 더 많은 것을 알려 줄까요?",
        answer: "예외입니다. 규칙은 대개를 설명하지만, 예외는 규칙이 어디서 왜 만들어졌는지를 알려 줍니다." }
    ]
  },
  {
    id: "hwadu", title: "숲에서 나에게 묻기", sub: "화두 한 줄",
    place: "사람이 적은 숲길, 산책로 — 30분 이상 조용히 걸을 수 있는 곳",
    min: 60, best: "이른 아침이나 해질 무렵",
    stops: [
      { find: "숲길이 두 갈래로 나뉘는 자리",
        do: "두 길을 번갈아 바라보다가, 이유를 대지 말고 한쪽을 고르세요.",
        talk: "만법귀일 일귀하처. 수천 갈래 가지와 잎이 결국 한 뿌리로 돌아갑니다. 그 하나는 어디로 돌아가는가. 오늘 이 물음을 주머니에 넣고 걸어 보세요. 답을 찾으려 애쓰지 말고, 물음이 몸에 배게 두면 됩니다.",
        ask: "왜 그쪽 길을 골랐나요?",
        answer: "이유가 떠오르지 않아도 괜찮습니다. 이유 없이 고른 것도 고른 것입니다. 매일의 선택 대부분이 그렇습니다." },
      { find: "쓰러져 썩고 있는 나무",
        do: "가까이 앉아 냄새를 맡아 보세요. 이끼나 버섯, 벌레가 있는지 봅니다. 손으로 파헤치지는 마세요.",
        talk: "죽은 나무 한 그루가 수백 생명의 집이 됩니다. 숲에서 죽음은 끝이 아니라 자리를 내주는 일입니다. 제행무상. 머무는 것은 없고, 그래서 다음이 옵니다.",
        ask: "이 나무는 지금 죽은 것인가요, 다른 것으로 살고 있는 것인가요?",
        answer: "숲의 셈법으로는 둘 다 맞습니다. 개체로는 끝났고, 물질과 관계로는 이어집니다. 무엇을 하나의 생명으로 볼 것인지가 답을 바꿉니다." },
      { find: "가지 사이로 하늘이 보이는 자리",
        do: "고개를 들고 서른을 셀 동안 하늘만 보세요. 사진은 찍지 마세요.",
        talk: "유무상생. 가지가 빽빽하기만 하면 빛이 들지 않습니다. 비어 있기 때문에 통합니다. 없음이 있음을 살립니다. 지금 보이는 저 빈 자리가 이 숲을 살립니다.",
        ask: "내 하루에서 비워 두어야 할 자리는 어디일까요?",
        answer: "이 물음에는 남이 줄 답이 없습니다. 다만 하나만 떠올려 오늘 안에 실제로 비워 보세요. 생각만으로는 비워지지 않습니다." },
      { find: "가장 크고 오래된 나무",
        do: "두 팔을 벌려 안아 보세요. 팔이 닿지 않으면 손바닥만 대고 서른을 세세요.",
        talk: "천지동근. 이 나무의 뿌리가 닿은 흙과 내가 밟고 선 흙이 같습니다. 나무가 내쉰 숨을 내가 마시고, 내가 내쉰 숨을 나무가 씁니다. 비유가 아니라 사실입니다.",
        ask: "이 나무는 나보다 몇 배를 살았을까요?",
        answer: "굵기로는 정확히 알 수 없지만, 아마 여러 배일 겁니다. 그 시간 동안 이 자리에서 한 번도 도망가지 않았다는 사실이 더 중요합니다." },
      { find: "숲을 빠져나가는 마지막 지점",
        do: "돌아서서 지나온 길을 한 번 보고, 손에 든 것을 잠시 내려놓으세요.",
        talk: "방하착. 내려놓으라는 말입니다. 오늘 숲에서 얻은 것도 짐이 될 수 있습니다. 다 가져가려 하지 말고, 한 가지만 골라 가세요.",
        ask: "오늘 무엇을 하나만 가져가시겠습니까?",
        answer: "고른 것을 한 문장으로 적으세요. 적지 않으면 사흘 안에 사라집니다." }
    ]
  },
  {
    id: "myth", title: "신화가 남긴 이름", sub: "그리스 신화와 학명",
    place: "이름표가 붙은 수목원·식물원이 가장 좋고, 봄가을 공원에서도 됩니다",
    min: 50, best: "봄(4~5월)과 초여름 — 붓꽃과 바람꽃이 필 때",
    stops: [
      { find: "붓꽃 — 보라색 꽃잎이 세 장은 아래로 처지고 세 장은 위로 선 꽃",
        do: "꽃잎이 몇 장인지, 위로 선 것과 아래로 처진 것이 각각 몇 장인지 세어 보세요.",
        talk: "붓꽃의 속명은 Iris입니다. 무지개의 여신 이리스에서 왔습니다. 이리스는 헤라의 전령으로 하늘과 땅을 잇는 무지개를 타고 다녔습니다. 붓꽃 종류마다 꽃 색이 다양해서 이 이름이 붙었습니다. 그런데 우리 이름은 붓꽃입니다. 피기 전 봉오리가 먹을 머금은 붓끝을 닮았기 때문입니다. 같은 꽃을 보고 서양은 무지개를 떠올렸고 우리는 붓을 떠올렸습니다.",
        ask: "여러분 눈에는 무엇으로 보이나요?",
        answer: "정답은 없습니다. 다만 이름은 그것을 처음 본 사람이 무엇을 떠올렸는지를 기록한 것입니다. 이름이 다르다는 건 본 것이 달랐다는 뜻입니다." },
      { find: "이른 봄이라면 노란 복수초, 아니라면 바람꽃 종류",
        do: "복수초를 찾았다면 꽃 가까이 손등을 대 보세요. 주변보다 따뜻한지.",
        talk: "복수초의 속명은 Adonis입니다. 아프로디테가 사랑한 아도니스가 죽고 그 피에서 붉은 꽃이 피었다는 이야기에서 왔습니다. 그런데 우리 복수초는 노랗습니다. 붉은 꽃은 유럽의 다른 종입니다. 대신 우리 복수초에는 더 놀라운 재주가 있습니다. 스스로 열을 내서 언 땅과 눈을 녹이고 올라옵니다. 꽃 안의 온도가 바깥보다 몇 도 높습니다.",
        ask: "남의 이야기와 우리 것이 안 맞을 때는 어떻게 해야 할까요?",
        answer: "억지로 맞추지 말고 갈라 말하면 됩니다. 저쪽은 붉은 피, 이쪽은 눈을 녹이는 열. 둘 다 이야기가 됩니다. 무리하게 붙이면 둘 다 잃습니다." },
      { find: "라일락 또는 수수꽃다리 — 향이 진한 연보라 꽃나무",
        do: "떨어진 가지가 있으면 잘린 단면을 보세요. 가운데가 비어 있는지.",
        talk: "속명은 Syringa입니다. 그리스어 시링크스에서 왔는데, 관 또는 피리라는 뜻입니다. 줄기 속이 비어서 옛사람들이 잘라 피리를 만들었기 때문입니다. 님프 시링크스가 판에게 쫓기다 갈대가 되었고, 판이 그 갈대를 잘라 만든 피리를 시링크스라고 부릅니다. 도망친 님프의 이름이 악기가 되고, 악기의 이름이 다시 나무가 되었습니다.",
        ask: "이름은 어떤 길을 따라 옮겨 다닐까요?",
        answer: "사람 이름이 물건 이름이 되고, 물건 이름이 다시 생물의 이름이 됩니다. 학명을 파고들면 그 옮겨 다닌 길이 보입니다." },
      { find: "서향 또는 백서향, 없으면 팥꽃나무 (남부·제주에서 잘 보입니다)",
        do: "꽃이 피어 있다면 눈을 감고 향을 맡아 보세요. 천 리를 간다고 해서 천리향이라 부릅니다.",
        talk: "이 나무의 속명은 Daphne입니다. 아폴론에게 쫓기던 님프 다프네가 나무가 되었고, 아폴론은 그 잎으로 관을 엮었습니다. 월계관입니다. 그런데 다프네가 변한 나무는 월계수이지 이 나무가 아닙니다. 린네가 잎이 월계수를 닮은 이 상록 관목에 그 이름을 붙이면서 이름이 옮겨 갔습니다. 신화의 나무와 학명의 나무가 다릅니다.",
        ask: "이름이 잘못 붙었는데 왜 고치지 않을까요?",
        answer: "이미 수많은 논문과 기록이 그 이름으로 쓰였기 때문입니다. 고치면 과거의 기록을 다 잃습니다. 학명은 정확해서가 아니라 흔들리지 않아서 쓸모가 있습니다." },
      { find: "참나무와 피나무가 가까이 선 자리 (신갈·굴참·상수리 아무 참나무나)",
        do: "두 나무 사이에 서서 잎을 각각 한 장씩 주워 나란히 놓아 보세요.",
        talk: "신들이 나그네 차림으로 마을을 돌았으나 아무도 문을 열지 않았습니다. 가난한 노부부 필레몬과 바우키스만 맞아들여 있는 것을 다 내주었습니다. 소원을 묻자 두 사람은 같은 날 함께 죽게 해 달라고 했습니다. 늙어 죽을 때가 되자 필레몬은 참나무가 되고 바우키스는 피나무가 되어 나란히 섰습니다. 다만 참나무 Quercus와 피나무 Tilia라는 학명은 라틴어의 평범한 나무 이름일 뿐, 이 이야기에서 온 것이 아닙니다.",
        ask: "이야기와 이름은 반드시 이어져야 할까요?",
        answer: "이어지지 않아도 됩니다. 이 숲에 참나무와 피나무가 나란히 서 있다는 사실만으로 이야기는 여기서 다시 시작됩니다. 이야기는 이름이 아니라 자리에 붙습니다." },
      { find: "계곡이나 물가 — 여름이라면 귀를 기울여 보세요",
        do: "삼십 초 동안 눈을 감고 소리만 듣습니다. 새소리가 들리면 어느 쪽인지 손으로 가리켜 보세요.",
        talk: "여름 숲의 계곡에 호반새가 옵니다. 속명이 Halcyon입니다. 남편을 잃고 바다에 몸을 던진 알키오네를 신들이 물총새로 바꾸었고, 그녀가 알을 품는 동안 바다를 잔잔하게 해 주었다고 합니다. 영어에서 halcyon days는 그 고요한 며칠을 가리키는 말이 되었습니다. 지금 이 숲의 고요도 누군가 알을 품고 있어서인지 모릅니다.",
        ask: "오늘 들은 소리 중 이름을 아는 것은 몇 가지였나요?",
        answer: "적어도 괜찮습니다. 이름을 모르고 들은 소리도 들은 것입니다. 다음에 올 때 하나만 더 알아 오면 됩니다." }
    ]
  },
  {
    id: "season", title: "계절을 기록하는 사람", sub: "시민과학 · 식물계절관측",
    place: "집이나 학교에서 걸어갈 수 있는 나무 한 그루 — 같은 나무를 계속 봅니다",
    min: 30, best: "3월부터 11월까지, 일주일에 한 번",
    stops: [
      { find: "앞으로 계속 관찰할 나무 한 그루",
        do: "그 나무를 정하고, 위치를 사진으로 남기세요. 다음에 헤맬 수 있습니다.",
        talk: "식물계절관측은 같은 나무를 오래 지켜보며 언제 싹이 트고 꽃이 피고 잎이 지는지 기록하는 일입니다. 국립수목원이 시민과 함께 하는 연구이고, 매년 2월에 참가자를 모집해 3월부터 11월까지 활동합니다. 관측 종에는 매실나무, 산수유, 왕벚나무, 생강나무, 개나리, 수수꽃다리, 팥배나무, 아까시나무, 찔레나무 등이 있습니다.",
        ask: "왜 하필 같은 나무를 계속 봐야 할까요?",
        answer: "나무마다 자리와 조건이 달라서입니다. 같은 나무를 여러 해 보면 나무의 차이가 아니라 해의 차이가 드러납니다. 그것이 기후 변화의 기록이 됩니다." },
      { find: "정한 나무의 전체 모습",
        do: "나무 전체가 다 들어오도록 한 장 찍으세요. 매번 같은 자리에서 찍는 것이 중요합니다.",
        talk: "관측에서 반드시 찍는 것은 전경과 잎, 두 가지입니다. 전경은 전체 수형이 잘 나오도록, 잎은 잎이 없으면 잎 없는 가지나 겨울눈을 찍습니다. 꽃과 열매는 있을 때만 가까이서 찍습니다.",
        ask: "매번 같은 자리에서 찍어야 하는 이유는?",
        answer: "각도가 바뀌면 변화를 비교할 수 없기 때문입니다. 발밑에 표시를 하거나, 옆 건물 모서리를 기준으로 삼으면 좋습니다." },
      { find: "가지 끝의 눈(겨울눈) 또는 새로 난 잎",
        do: "손가락 한 마디와 견주어 크기를 재고, 날짜와 함께 적으세요.",
        talk: "국립수목원 관측에 따르면 왕벚나무의 개화가 해마다 조금씩 빨라지고 있습니다. 하루 이틀의 차이는 한 사람 눈에는 안 보이지만, 여러 사람이 여러 해 기록하면 선이 그려집니다. 한 사람의 관찰은 점이고, 여럿의 관찰은 선입니다.",
        ask: "내 기록이 연구에 쓰이려면 무엇이 가장 중요할까요?",
        answer: "정확함보다 꾸준함입니다. 한 번의 완벽한 기록보다, 조금 어설퍼도 매주 이어지는 기록이 훨씬 쓸모 있습니다." },
      { find: "오늘 나무의 상태",
        do: "겨울눈 / 잎 나옴 / 꽃 핌 / 열매 / 단풍 / 잎 짐 중 지금 어디인지 하나 고르세요.",
        talk: "이렇게 고른 단계와 사진을 knpn.kr 에 올리면 실제 연구 자료가 됩니다. 관측 시기는 3월부터 11월까지이고, 봄에는 꽃, 가을에는 단풍을 함께 보는 행사도 있습니다.",
        ask: "다음에는 언제 다시 오시겠습니까?",
        answer: "날짜를 지금 정하고 알림을 맞춰 두세요. 정하지 않으면 다음은 오지 않습니다." }
    ]
  }
];

/* ---------- 안전 카드 (현장에서 바로 펼치는 용도) ---------- */
const SAFETY = {
  note: "아래는 응급처치 교육 자료의 수치를 그대로 옮긴 것입니다. 실제 상황에서는 119의 전화 안내를 함께 따르세요. 응급의료에 관한 법률 제5조의2에 따라, 선의로 한 응급처치는 민형사 책임이 면제됩니다.",
  cpr: {
    steps: [
      ["1. 의식 확인", "양쪽 어깨를 두드리며 크게 부릅니다. 흔들지 마세요. 영아는 발바닥을 두드립니다."],
      ["2. 119 · 심장충격기", "특정한 사람을 지목해 부탁합니다. \"파란 옷 입으신 분, 119에 신고해 주세요. 그리고 심장충격기를 가져와 주세요.\""],
      ["3. 호흡 확인", "가슴과 배를 눈으로 약 10초 봅니다. 숨이 없거나 이상하면 바로 압박."],
      ["4. 가슴 압박", "성인 약 5cm, 소아 4~5cm, 영아 4cm. 분당 100~120회. 누른 만큼 올라오게."],
      ["5. 인공호흡", "머리를 뒤로 젖히고 턱을 들어 올린 뒤, 코를 막고 1초씩 2회. 압박 30 : 호흡 2로 반복."]
    ],
    age: [
      ["영아(~만 1세)", "두 엄지손가락", "젖꼭지 사이 정중앙 바로 아래", "4cm"],
      ["소아(만 1~8세)", "손꿈치 1~2개", "가슴뼈 아래 1/2 지점", "4~5cm"],
      ["성인(만 8세~)", "손꿈치 2개", "가슴뼈 아래 1/2 지점", "약 5cm"]
    ],
    golden: "0~4분 손상 적음 · 4~6분 손상 높음 · 6~10분 손상 심각 · 10분 이상 뇌사"
  },
  aed: [
    ["전원 켜기", "전원을 누르고 음성 안내를 따릅니다."],
    ["패드 부착", "오른쪽 쇄골 아래와 왼쪽 옆구리. 성인과 소아 모두 같은 자리입니다."],
    ["리듬 분석", "환자에게서 손을 뗍니다. 아무도 닿지 않게 합니다."],
    ["전기 충격", "역시 손을 떼고, 깜빡이는 버튼을 누릅니다."],
    ["즉시 압박", "충격 후 곧바로 가슴 압박. 2분 주기로 반복하며 119가 올 때까지."]
  ],
  cases: [
    ["기도 막힘 (성인·소아)", "기침을 못 하고 목을 감싸 쥐면 완전 막힘입니다. 날개뼈 사이를 손꿈치로 강하게 5회 두드리고, 복부 밀어내기 5회. 반복. 의식이 없어지면 119 신고 후 심폐소생술."],
    ["기도 막힘 (영아)", "머리를 가슴보다 낮게 하고 날개뼈 사이를 5회 두드린 뒤 가슴 밀어내기. 반복."],
    ["삠 · 타박 · 골절", "RICE — 쉬게 하고(Rest), 얼음찜질(Ice), 압박(Compression), 심장보다 높게(Elevation). 부러진 뼈는 맞추지 말고 그대로 고정합니다. 부목은 관절 위아래를 넘겨서, 모르겠으면 길게."],
    ["상처", "씻고(수돗물 또는 멸균생리식염수) · 바르고(소독약) · 붙입니다(거즈, 밴드)."],
    ["화상", "옷은 잘라내고 찬물에 15분 이상 식힌 뒤 멸균 거즈로 덮습니다. 물집을 터뜨리지 말고, 얼음을 직접 대지 말고, 소주나 기름을 붓지 마세요. 2도 이상은 병원으로."],
    ["벌 쏘임 등 과민 반응(아나필락시스)", "평평한 곳에 눕히고 의식과 호흡을 확인합니다. 119에 연락하고, 에피네프린이 있으면 주사한 뒤 시각을 적습니다. 다리를 올려 두고 신속히 이송합니다."],
    ["경련", "주변의 위험한 물건을 치우고 옷을 느슨하게 풉니다. 고개를 옆으로 돌리거나 옆으로 눕히고 119에 신고합니다. 입에 무엇을 넣지 마세요."],
    ["척추 손상 의심", "움직이지 못하게 고정하고 안심시킨 뒤 119에 신고합니다."],
    ["뇌졸중 의심 (FAST)", "얼굴 한쪽이 처지고(Face), 한쪽 팔이 떨어지고(Arm), 말이 어눌하면(Speech), 곧바로 119(Time)."]
  ],
  /* 숲 현장에서 실제로 자주 생기는 것들.
     응급처치 교안에는 없어 비워 두었던 자리를, 수업 자료 검증 과정에서 확인한 내용으로 채웠습니다.
     처치가 아니라 '무엇을 하지 말아야 하는가'에 초점을 둡니다. */
  field: [
    ["먹으면 안 되는 것", "야생 버섯은 채취도 식용도 금지입니다. 눈으로만 봅니다. 복수초는 전초에 강심배당체가 있어 이른 봄 어린 순을 나물로 오인한 중독 사고가 실제로 있습니다. 수선화·상사화의 구근은 리코린 독성이 있고 양파로 오인하기 쉽습니다. 크로커스 구근도 유독하며, 가을에 피는 콜키쿰과 혼동하면 위험합니다."],
    ["만지면 안 되는 것", "히아신스 구근은 옥살산칼슘 결정이 있어 장갑이 필요합니다. 붓꽃 뿌리줄기는 즙이 피부를 자극합니다. 사철나무의 붉은 씨앗은 예뻐서 아이가 입에 넣기 쉽습니다. 갈대 잎은 가장자리가 규산질이라 손이 잘 베입니다."],
    ["법으로 보호받는 생물", "구렁이·삵·물장군은 멸종위기 II급, 반달가슴곰은 I급입니다. 잡거나 만지면 처벌 대상입니다. 발견하면 사진만 찍고 그 자리를 떠납니다."],
    ["감염 위험", "관박쥐는 광견병 등 인수공통감염병을 옮길 수 있어 살아 있든 죽어 있든 맨손으로 만지지 않습니다. 고라니·노루의 사체와 배설물은 진드기 매개 감염병(SFTS) 위험이 있습니다. 참게와 가재는 폐흡충의 중간숙주라 날로 먹거나 구워 먹지 않고, 만진 뒤 반드시 손을 씻습니다."],
    ["쏘임·물림", "벌에 쏘이면 아나필락시스 위험이 있습니다. 알레르기 병력이 있는 참가자를 미리 파악하고, 향수와 밝은 꽃무늬 옷을 피하며, 벌집에 다가가지 않습니다. 물자라는 주둥이로 찌르면 상당히 아프니 맨손으로 잡지 않습니다. 무당거미·호랑거미는 위험한 독은 없으나 물릴 수 있고, 거미줄이 얼굴 높이에 걸리므로 인솔자가 앞서 확인합니다."],
    ["출발 전 확인", "가는 곳과 돌아올 시각을 누군가에게 알립니다. 참가자의 알레르기와 지병을 미리 묻습니다. 물과 휴대전화 배터리를 확인합니다. 숲에서는 신호가 약할 수 있으니 가장 가까운 119 접근로를 미리 봐 둡니다."]
  ]
};

/* =========================================================
   진행 로직
   ========================================================= */
const SOLO_KEY = "mujacheonseo.solo.v1";
let soloAudience = "adult";
let soloCourse = null;   // 현재 코스
let soloIndex = 0;       // 현재 정거장
let soloRevealed = false;

function sEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function soloState() {
  try { return JSON.parse(localStorage.getItem(SOLO_KEY) || "{}"); }
  catch (e) { return {}; }
}
function soloSave() {
  try {
    localStorage.setItem(SOLO_KEY, JSON.stringify({
      audience: soloAudience,
      course: soloCourse ? soloCourse.id : null,
      index: soloIndex
    }));
  } catch (e) { /* 저장이 막혀 있어도 진행은 됩니다 */ }
}

function audienceObj() {
  return AUDIENCES.filter(function (a) { return a.id === soloAudience; })[0] || AUDIENCES[3];
}

/* 대상에 맞춰 문장을 다듬습니다.
   초등에게는 개념어 뒤에 쉬운 말을 덧붙이고, 문장을 잘라 짧게 읽어 줍니다. */
const EASY = [
  ["상록성", "상록성(겨울에도 잎이 푸른 것)"],
  ["낙엽성", "낙엽성(가을에 잎을 떨구는 것)"],
  ["맹아력", "맹아력(잘려도 새싹을 내는 힘)"],
  ["내공해성", "내공해성(매연을 잘 견디는 것)"],
  ["내염성", "내염성(바닷바람의 소금기를 견디는 것)"],
  ["덩굴성", "덩굴성(다른 것을 타고 오르는 것)"],
  ["피목", "피목(껍질의 숨구멍)"],
  ["수관", "수관(나무 전체의 모양)"],
  ["종소명", "종소명(학명의 뒷단어)"],
  ["속명", "속명(학명의 앞단어)"]
];

function forAudience(text) {
  let t = text;
  if (soloAudience === "kid" || soloAudience === "kid2") {
    EASY.forEach(function (p) {
      if (t.indexOf(p[1]) < 0) t = t.split(p[0]).join(p[1]);
    });
  }
  if (soloAudience === "kid") {
    // 저학년에게는 앞의 세 문장까지만 읽어 줍니다.
    const parts = t.split(/(?<=\.)\s+/);
    if (parts.length > 3) t = parts.slice(0, 3).join(" ");
  }
  return t;
}

/* ---------- 화면 ---------- */
function renderSoloHome() {
  const box = document.getElementById("soloBody");
  if (!box) return;
  const a = audienceObj();
  box.innerHTML =
    '<div class="panel"><h3>누가 듣나요?</h3>' +
    '<div class="filters" id="soloAudience">' +
    AUDIENCES.map(function (x) {
      return '<button class="pill' + (x.id === soloAudience ? " is-active" : "") +
        '" type="button" data-aud="' + x.id + '">' + sEsc(x.name) + '</button>';
    }).join("") + '</div>' +
    '<p class="small">' + sEsc(a.note) + ' 정거장 하나에 약 ' + a.stopMin + '분을 잡습니다.</p></div>' +
    '<h2 class="section-title">코스 고르기</h2>' +
    '<div class="grid grid-2">' + SOLO_COURSES.map(function (c) {
      const st = soloState();
      const done = (st.course === c.id && st.index) ? st.index : 0;
      return '<div class="card"><span class="module-tag">' + sEsc(c.sub) + '</span>' +
        '<h3>' + sEsc(c.title) + '</h3>' +
        '<p class="module-meta"><b>어디서</b> · ' + sEsc(c.place) + '</p>' +
        '<p class="module-meta"><b>언제</b> · ' + sEsc(c.best) + '</p>' +
        '<p class="module-meta"><b>정거장</b> · ' + c.stops.length + '곳 · 약 ' +
        (c.stops.length * a.stopMin) + '분</p>' +
        (done ? '<p class="small">이어서 하기: ' + (done + 1) + '번째 정거장</p>' : '') +
        '<button class="btn btn-primary btn-sm" type="button" data-solo="' + c.id + '">' +
        (done ? '이어서 시작' : '시작하기') + '</button></div>';
    }).join("") + '</div>' +
    '<div class="panel" style="margin-top:1rem"><h3>혼자 나설 때 지킬 것</h3>' +
    '<ul><li>가는 곳과 돌아올 시각을 누군가에게 알리고 나섭니다.</li>' +
    '<li>모르는 열매와 버섯은 먹지 않습니다. 만진 손으로 눈과 입을 만지지 않습니다.</li>' +
    '<li>살아 있는 가지를 꺾지 않습니다. 떨어진 것으로 관찰합니다.</li>' +
    '<li>휴대전화 배터리와 물을 확인합니다. 숲에서는 신호가 약할 수 있습니다.</li>' +
    '<li>아래 「안전」 버튼을 눌러 응급처치 카드를 미리 한 번 펴 보세요.</li></ul>' +
    '<button class="btn btn-sm" type="button" id="btnSafety">🚑 안전 카드 펴기</button></div>';
}

function renderSoloStop() {
  const box = document.getElementById("soloBody");
  const c = soloCourse;
  if (!box || !c) return;
  const s = c.stops[soloIndex];
  const a = audienceObj();
  box.innerHTML =
    '<div class="panel">' +
    '<p class="small">' + sEsc(c.title) + ' · ' + sEsc(a.name) + '</p>' +
    '<div class="loadbar"><div class="loadbar-fill" style="width:' +
      Math.round(((soloIndex + 1) / c.stops.length) * 100) + '%;animation:none"></div></div>' +
    '<h3>정거장 ' + (soloIndex + 1) + ' / ' + c.stops.length + '</h3>' +

    '<h4>① 찾아보세요</h4><p>' + sEsc(s.find) + '</p>' +
    '<h4>② 해 보세요</h4><p>' + sEsc(s.do) + '</p>' +
    '<h4>③ 들어보세요</h4><p class="quote">' + sEsc(forAudience(s.talk)) + '</p>' +
    '<div class="btn-row">' +
      '<button class="btn btn-primary btn-sm" type="button" id="soloSpeak">🔊 읽어주기</button>' +
      '<button class="btn btn-sm" type="button" id="soloStop">■ 멈춤</button>' +
    '</div>' +

    '<h4>④ 물음</h4><p class="quote">“' + sEsc(s.ask) + '”</p>' +
    (soloRevealed
      ? '<div class="alert" style="border-color:var(--line)"><b>같이 생각해 보기</b><p>' + sEsc(s.answer) + '</p></div>'
      : '<button class="btn btn-sm" type="button" id="soloReveal">답 보기 — 먼저 스스로 답해 보세요</button>') +

    '<div class="btn-row" style="margin-top:1rem">' +
      '<button class="btn btn-sm" type="button" id="soloPrev"' + (soloIndex === 0 ? " disabled" : "") + '>← 이전</button>' +
      (soloIndex < c.stops.length - 1
        ? '<button class="btn btn-primary btn-sm" type="button" id="soloNext">다음 정거장 →</button>'
        : '<button class="btn btn-primary btn-sm" type="button" id="soloDone">수업 마치기</button>') +
      '<button class="btn btn-sm" type="button" id="soloExit">코스 목록</button>' +
    '</div></div>';
}

function renderSoloDone() {
  const box = document.getElementById("soloBody");
  const c = soloCourse;
  box.innerHTML =
    '<div class="panel"><h3>「' + sEsc(c.title) + '」을(를) 마쳤습니다</h3>' +
    '<p>오늘 걸으며 만난 것 중 하나만 골라 한 문장으로 적어 보세요. 적지 않으면 사흘 안에 사라집니다.</p>' +
    '<textarea id="soloMemo" rows="3" placeholder="예) 잎을 버리는 것이 아끼는 방법이라는 말이 남았다"></textarea>' +
    '<div class="btn-row" style="margin-top:.8rem">' +
    '<button class="btn btn-primary btn-sm" type="button" id="soloSaveMemo">기록 저장</button>' +
    '<button class="btn btn-sm" type="button" id="soloExit">다른 코스 보기</button>' +
    '<button class="btn btn-sm" type="button" data-nav="archive">📓 나의 기록 보기</button></div>' +
    '<p class="small" style="margin-top:.8rem">해설을 직접 하실 분이라면, 이 코스를 뼈대로 삼아 ' +
    '「수업 설계」에서 대상과 시간에 맞는 계획서를 만들 수 있습니다.</p>' +
    '<button class="btn btn-sm" type="button" data-solo-plan="' + c.id + '">이 코스로 수업계획서 만들기</button></div>';
}

function safetyHTML() {
  return '<div class="panel"><h3>🚑 안전 카드</h3><p class="small">' + sEsc(SAFETY.note) + '</p>' +
    '<h4>심폐소생술</h4><div class="booklist">' +
    SAFETY.cpr.steps.map(function (x) {
      return '<div class="book"><b>' + sEsc(x[0]) + '</b><p>' + sEsc(x[1]) + '</p></div>';
    }).join("") + '</div>' +
    '<div class="table-wrap"><table><thead><tr><th>대상</th><th>손</th><th>위치</th><th>깊이</th></tr></thead><tbody>' +
    SAFETY.cpr.age.map(function (r) {
      return '<tr><td>' + r.map(sEsc).join("</td><td>") + '</td></tr>';
    }).join("") + '</tbody></table></div>' +
    '<p class="caution-box">골든타임 · ' + sEsc(SAFETY.cpr.golden) + '</p>' +
    '<h4>자동심장충격기(AED)</h4><div class="booklist">' +
    SAFETY.aed.map(function (x) {
      return '<div class="book"><b>' + sEsc(x[0]) + '</b><p>' + sEsc(x[1]) + '</p></div>';
    }).join("") + '</div>' +
    '<h4>야외에서 생기는 상황</h4><div class="booklist">' +
    SAFETY.cases.map(function (x) {
      return '<div class="book"><b>' + sEsc(x[0]) + '</b><p>' + sEsc(x[1]) + '</p></div>';
    }).join("") + '</div>' +
    '<h4>숲에서 자주 생기는 것 — 다치기 전에 막는 쪽</h4>' +
    '<p class="small">처치보다 앞서는 것은 무엇을 하지 않는가입니다. ' +
    '특히 아이들과 함께라면 출발 전에 소리 내어 읽어 주세요.</p>' +
    '<div class="booklist">' +
    SAFETY.field.map(function (x) {
      return '<div class="book"><b>' + sEsc(x[0]) + '</b><p>' + sEsc(x[1]) + '</p></div>';
    }).join("") + '</div>' +
    '<button class="btn btn-sm" type="button" id="soloExit">돌아가기</button></div>';
}

/* ---------- 동작 ---------- */
function soloSpeakStop() {
  const s = soloCourse.stops[soloIndex];
  const text = "찾아보세요. " + s.find + " 해 보세요. " + s.do + " " + forAudience(s.talk) +
               " 물음. " + s.ask;
  if (typeof Voice !== "undefined" && Voice.speak) Voice.speak(text);
}

function initSolo() {
  const box = document.getElementById("soloBody");
  if (!box) return;

  const st = soloState();
  if (st.audience) soloAudience = st.audience;

  box.addEventListener("click", function (e) {
    const aud = e.target.closest("[data-aud]");
    if (aud) { soloAudience = aud.getAttribute("data-aud"); soloSave(); renderSoloHome(); return; }

    const start = e.target.closest("[data-solo]");
    if (start) {
      const id = start.getAttribute("data-solo");
      soloCourse = SOLO_COURSES.filter(function (c) { return c.id === id; })[0];
      const saved = soloState();
      soloIndex = (saved.course === id && saved.index) ? saved.index : 0;
      soloRevealed = false;
      soloSave(); renderSoloStop();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const plan = e.target.closest("[data-solo-plan]");
    if (plan) { soloToPlanner(plan.getAttribute("data-solo-plan")); return; }

    const id = e.target.id;
    if (id === "soloSpeak") { soloSpeakStop(); return; }
    if (id === "soloStop") { if (typeof Voice !== "undefined" && Voice.stop) Voice.stop(); return; }
    if (id === "soloReveal") { soloRevealed = true; renderSoloStop(); return; }
    if (id === "soloNext") {
      if (typeof Voice !== "undefined" && Voice.stop) Voice.stop();
      soloIndex++; soloRevealed = false; soloSave(); renderSoloStop();
      window.scrollTo({ top: 0, behavior: "smooth" }); return;
    }
    if (id === "soloPrev") {
      if (typeof Voice !== "undefined" && Voice.stop) Voice.stop();
      soloIndex--; soloRevealed = false; soloSave(); renderSoloStop();
      window.scrollTo({ top: 0, behavior: "smooth" }); return;
    }
    if (id === "soloDone") {
      if (typeof Voice !== "undefined" && Voice.stop) Voice.stop();
      renderSoloDone(); return;
    }
    if (id === "soloExit") {
      if (typeof Voice !== "undefined" && Voice.stop) Voice.stop();
      soloCourse = null; renderSoloHome(); return;
    }
    if (id === "btnSafety") { box.innerHTML = safetyHTML(); return; }
    if (id === "soloSaveMemo") {
      const memo = document.getElementById("soloMemo").value.trim();
      if (!memo) { if (typeof toast === "function") toast("한 줄만 적어 주세요"); return; }
      if (Store.addMemo(soloCourse.title, memo)) {
        if (typeof refreshMemos === "function") refreshMemos();
        document.getElementById("soloMemo").value = "";
        if (typeof toast === "function") toast("기록했습니다. 보관함 → 나의 기록에서 다시 볼 수 있습니다");
      }
      return;
    }
  });

  renderSoloHome();
}

/* 자율 코스를 해설가용 수업계획서 뼈대로 넘깁니다 */
function soloToPlanner(id) {
  const c = SOLO_COURSES.filter(function (x) { return x.id === id; })[0];
  if (!c) return;
  const a = audienceObj();
  const title = document.getElementById("f-title");
  const note = document.getElementById("f-note");
  const place = document.getElementById("f-place");
  if (title && !title.value) title.value = c.title;
  if (place && !place.value) place.value = c.place;
  if (note) {
    note.value = (note.value ? note.value + "\n" : "") +
      "자율 코스 「" + c.title + "」(" + c.sub + ") 기반 / 대상: " + a.name +
      " / 정거장: " + c.stops.map(function (s, i) { return (i + 1) + ") " + s.find; }).join(", ");
  }
  navigate("design");
  if (typeof toast === "function") toast("자율 코스를 수업 설계에 담았습니다");
}
