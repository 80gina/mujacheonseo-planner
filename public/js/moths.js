/* =========================================================
   moths.js — 밤의 숲, 나방 50종
   자료: 「크리스탈과 함께」 (blog.naver.com/lovessym) 현장 기록
        2026년 8월 24일 ~ 9월 2일 게시분 50편

   숲해설에서 나방은 늘 뒤로 밀립니다. 낮에 안 보이고,
   이름이 어렵고, 나비보다 덜 예뻐 보인다는 이유입니다.
   그런데 나방은 애벌레 시절에 정해진 나무만 먹습니다.
   그래서 「이 나무에 어떤 나방이 오는가」를 물으면
   나무 이야기와 벌레 이야기가 한 줄로 이어집니다.
   이 자료를 기주식물로 묶어 둔 이유입니다.

   필드
     n     국명            s     학명
     au    명명자·연도     fam   과
     sub   아과            alt   이전 국명(국명 이명)
     host  기주식물        rec   필자의 관찰 기록
     read  해설 지점       flag  아직 확정되지 않은 것
   ========================================================= */

const MOTHS = [
  /* ---------- 태극나방과 · 노랑수염나방아과 ---------- */
  { n: "흰점노랑잎수염나방", s: "Stenbergmania albomaculalis", au: "Bremer, 1864",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "앞점노랑짤름나방", host: "",
    rec: "2026.06.07. 전남 강진. 야간 등화",
    read: "이름이 통째로 바뀐 종입니다. 앞점 → 흰점, 짤름 → 잎수염. 도감을 찾을 때 옛 이름으로는 나오지 않습니다. 생물 이름은 고정된 것이 아니라는 것을 보여 주기 좋습니다." },
  { n: "얼룩수염나방", s: "Lophomilia polybapta", au: "Butler, 1879",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "얼룩짤름나방", hf: ["참나무과"], host: "참나무과",
    rec: "6월에 집중적으로 보임. 여러 장소에서 확인",
    read: "위협을 느끼면 앞가슴등판 털을 세우고 배 끝을 들어 올립니다. 건드리지 말고 가만히 보기만 해도 방어 자세를 볼 수 있습니다." },
  { n: "고개무늬수염나방", s: "Hypena stygiana", au: "Butler, 1878",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", host: "",
    rec: "자료에는 5~8월. 그러나 필자는 모두 4월에 관찰",
    read: "책과 현장이 어긋난 자리입니다. 4월에 성충이 보인다면 어른벌레로 겨울을 났다는 뜻입니다. 도감이 늘 맞는 것은 아니라는 것을 이 한 줄이 말해 줍니다.",
    flag: "월동 여부는 필자의 추정입니다" },
  { n: "별보라수염나방", s: "Hypena nigrobasalis", au: "Herz, 1905",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", host: "",
    rec: "외횡선 바깥 무늬가 닳아 거의 보이지 않는 개체",
    read: "활무늬수염나방과 아주 비슷해 외횡선이 굽은 정도로 겨우 가릅니다. 유사종 Hypena perspicua가 2025년에 처음 기록되었습니다." },
  { n: "국명없음", s: "Hypena mandarina", au: "Leech, 1900",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", host: "",
    rec: "경남 함양. 오래전 사진",
    read: "우리말 이름이 아직 없습니다. 2025년에 국내 기록으로 실렸지만 국명은 제시되지 않았습니다. 이름 없는 생물이 지금도 있다는 것을 보여 주는 자리입니다.",
    flag: "국명 없음 — 학명으로만 부릅니다" },
  { n: "활무늬수염나방", s: "Hypena bicoloralis", au: "Graeser, 1889",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", host: "",
    rec: "",
    read: "앞날개 외횡선이 활처럼 휘어 이름이 붙었습니다. 이름의 근거를 날개에서 직접 찾아보게 하기 좋은 종입니다." },
  { n: "각시뒷노랑수염나방", s: "Hypena claripennis", au: "Butler, 1878",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", hf: ["쐐기풀과"], host: "쐐기풀과",
    rec: "애벌레도 성충도 노란빛",
    read: "이름의 「각시」는 곱다는 뜻입니다. 우리 이름에는 이렇게 사람을 빗댄 말이 자주 들어갑니다.",
    flag: "일본 유충 도감의 대만수염나방 사진과 비슷해, 그동안의 동정에 재확인이 필요합니다" },
  { n: "대만수염나방", s: "Hypena trigonalis", au: "Guenée, 1854",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", hf: ["쐐기풀과"], host: "쐐기풀과",
    rec: "",
    read: "뒷노랑수염나방과 닮았으나 내횡선이 뒷가장자리에 닿지 않습니다. 아랫입술수염이 유난히 깁니다." },
  { n: "뒷노랑수염나방", s: "Hypena amica", au: "Butler, 1878",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", hf: ["쐐기풀과"], host: "쐐기풀과 (좀깨잎나무 · 모시풀류)",
    rec: "좀깨잎나무, 모시풀류에서 비교적 흔함",
    read: "접었을 때는 그냥 갈색인데 앞날개를 들면 뒷날개가 노랗습니다. 접었을 때와 폈을 때가 다른 종처럼 보이는 나방 — 왜 숨기는 색을 따로 가지고 있을까가 좋은 물음입니다." },
  { n: "가운데흰수염나방", s: "Harita belinda", au: "Butler, 1879",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "", host: "",
    rec: "자료에는 9~10월. 4월과 9월 모두 관찰",
    read: "가운데 횡선 바깥이 흰 띠로 보이면 암컷, 없으면 수컷이라 합니다. 이름은 암컷을 기준으로 붙은 셈입니다. 이름이 한쪽 성만 가리키는 경우입니다." },
  { n: "붉은띠수염나방", s: "Gonepatica opalina", au: "Butler, 1879",
    fam: "태극나방과", sub: "노랑수염나방아과", alt: "붉은띠짤름나방", hf: ["참나무과"], host: "참나무과",
    rec: "아랫입술수염이 다른 종보다 매우 김",
    read: "짤름나방으로 불리다 수염나방으로 돌아왔습니다. 분류 체계가 정리되면서 이름이 제자리를 찾은 경우입니다." },

  /* ---------- 태극나방과 · 짤름나방아과 ---------- */
  { n: "세줄끝무늬짤름나방", s: "Pangrapta trilineata", au: "Leech, 1900",
    fam: "태극나방과", sub: "짤름나방아과", alt: "", host: "",
    rec: "2026.06.23. 전남 구례. 야간 등화",
    read: "늘 날개를 펼친 자세로 앉습니다. 나방이 앉는 자세는 종마다 정해져 있어, 자세만으로도 무리를 가늠할 수 있습니다." },
  { n: "산그물무늬짤름나방", s: "Pangrapta perturbans", au: "Walker, 1858",
    fam: "태극나방과", sub: "짤름나방아과", alt: "", hf: ["물푸레나무과"], host: "물푸레나무과 (쥐똥나무)",
    rec: "2024.05. 낮에 관찰",
    read: "쥐똥나무는 도시 울타리로 흔히 심습니다. 이 나방이 동네에서 보이는 이유가 거기 있습니다. 심은 나무가 벌레를 부른다는 것을 보여 주는 예입니다." },
  { n: "수풀알락짤름나방", s: "Pangrapta griseola", au: "Staudinger, 1892",
    fam: "태극나방과", sub: "짤름나방아과", alt: "", host: "",
    rec: "2023.08.12. 경북 울진. 야간 등화",
    read: "소나무가 많아 별 것 없겠다 싶었던 자리에서 나온 종입니다. 기대하지 않은 곳에서 새것이 나온다는 기록입니다." },
  { n: "흰줄짤름나방", s: "Pangrapta flavomacula", au: "Staudinger, 1888",
    fam: "태극나방과", sub: "짤름나방아과", alt: "", host: "",
    rec: "2014.06.23. 세종. 주로 낮에 보이는 종",
    read: "나방은 다 밤에 난다는 말은 틀렸습니다. 낮에 활동하는 나방이 적지 않습니다." },
  { n: "떠들썩짤름나방", s: "Pangrapta disruptalis", au: "Walker, 1866",
    fam: "태극나방과", sub: "짤름나방아과", alt: "", host: "",
    rec: "2026.06.08. 경남 고성. 야간 등화",
    read: "이 생김새가 짤름나방의 본래 모습입니다. 무리 전체를 대표하는 얼굴을 하나 익혀 두면 나머지가 쉬워집니다." },
  { n: "은무늬짤름나방", s: "Pangrapta costinotata", au: "Butler, 1881",
    fam: "태극나방과", sub: "짤름나방아과", alt: "", hf: ["장미과"], host: "장미과 (벚나무)",
    rec: "2024.06.11. 제주. 야간 등화",
    read: "필자가 기주를 확인하려고 생성형 AI 네 가지에 같은 것을 물었더니 답이 갈렸습니다. 세 곳은 장미과, 한 곳은 다래나무과. 같은 회사의 무료판과 유료판도 서로 달랐습니다. AI에게 사실을 물을 때 무엇이 위험한지 그대로 보여 주는 기록입니다.",
    flag: "기주 자료가 갈립니다. 일본 자료 기준 장미과" },

  /* ---------- 태극나방과 · 잎짤름나방아과 ---------- */
  { n: "세줄짤름나방", s: "Colobochyla salicalis", au: "Denis and Schiffermüller, 1775",
    fam: "태극나방과", sub: "잎짤름나방아과", alt: "", hf: ["버드나무과"], host: "버드나무과",
    rec: "2026.04. 야간 등화",
    read: "종소명 salicalis는 버드나무속 Salix에서 왔습니다. 학명에 기주가 그대로 들어 있는 경우입니다." },
  { n: "성복물결꼬마짤름나방", s: "Mataeomera esbiahni", au: "Sohn and Ronkay, 2001",
    fam: "태극나방과", sub: "잎짤름나방아과", alt: "성복물결꼬마밤나방", host: "",
    rec: "2023.08. 도감에 없어 오래 묵혀 둔 종",
    read: "도감에서 못 찾아 접어 두었다가, 다른 관찰자의 사진을 보고 이름을 찾은 종입니다. 이름을 찾는 일이 혼자 하는 일이 아니라는 기록입니다." },

  /* ---------- 태극나방과 · 대나무짤름나방아과 ---------- */
  { n: "점노랑짤름나방", s: "Rivula sericealis", au: "Scopoli, 1763",
    fam: "태극나방과", sub: "대나무짤름나방아과", alt: "", hf: ["벼과"], host: "벼과 · 대나무류",
    rec: "2024.09.09. 제주. 야간 등화",
    read: "보통은 황백색 바탕에 검은 점 두 개만 보입니다. 갓 나온 개체라야 횡선 무늬까지 보입니다. 같은 종도 나온 지 얼마나 됐느냐에 따라 달라 보입니다." },
  { n: "두점짤름나방", s: "Rivula inconspicua", au: "Butler, 1881",
    fam: "태극나방과", sub: "대나무짤름나방아과", alt: "", hf: ["벼과"], host: "벼과 (주름조개풀)",
    rec: "2026.04. 야간 등화",
    read: "주름조개풀은 숲길 가장자리에 흔한 풀입니다. 발밑의 풀 한 포기가 어떤 나방을 먹여 살리는지 보여 줄 수 있습니다." },

  /* ---------- 혹나방과 · 푸른나방아과 ---------- */
  { n: "나무껍질나방", s: "Blenina senex", au: "Butler, 1878",
    fam: "혹나방과", sub: "푸른나방아과", alt: "나무껍질밤나방", hf: ["감나무과", "소태나무과", "장미과"], host: "감나무과 · 가죽나무류 · 벚나무류",
    rec: "2008.09. 수피에 붙어 있던 개체",
    read: "어른벌레로 겨울을 나느라 나무껍질에 붙습니다. 그래서 껍질을 닮았습니다. 위장은 예쁘려고가 아니라 살아남으려고 생긴 것입니다. 찾기 활동에 가장 좋은 종입니다." },
  { n: "애기푸른나방", s: "Macrochthonia fervens", au: "Butler, 1881",
    fam: "혹나방과", sub: "푸른나방아과", alt: "애기밤나방", hf: ["느릅나무과"], host: "느릅나무과",
    rec: "2025.09.23. 경기 성남. 야간 등화",
    read: "사진 한 장뿐인 종입니다. 느티나무와 팽나무가 모두 느릅나무과이니, 마을 정자나무 아래에서 찾아볼 만합니다." },
  { n: "검은띠애나방", s: "Gelastocera exusta", au: "Butler, 1877",
    fam: "혹나방과", sub: "푸른나방아과", alt: "검은띠애기밤나방", hf: ["참나무과"], host: "참나무과",
    rec: "2023.09. 같은 날 같은 자리에서 무늬가 다른 개체들",
    read: "어른벌레로는 황색띠애나방과 가릴 수 없어 생식기를 봐야 한다고 합니다. 그런데 애벌레는 다릅니다. 이 종은 참나무과만, 황색띠는 여러 과를 먹습니다. 어른보다 애벌레가 정직한 경우입니다.",
    flag: "성충 상태로는 황색띠애나방과 구별이 어렵습니다" },
  { n: "붉은가꼬마푸른나방", s: "Earias pudicana", au: "Staudinger, 1887",
    fam: "혹나방과", sub: "푸른나방아과", alt: "붉은가밤나방", hf: ["버드나무과"], host: "버드나무과",
    rec: "습지 조사에서 자주 관찰",
    read: "앞날개 가운데 붉은 점이 뚜렷한 개체도, 흐린 개체도, 아예 없는 개체도 있습니다. 같은 종 안의 차이를 보여 주기 좋습니다. 버드나무가 있는 물가에서 찾으세요." },
  { n: "분홍꼬마푸른나방", s: "Earias roseifera", au: "Butler, 1881",
    fam: "혹나방과", sub: "푸른나방아과", alt: "분홍무늬푸른밤나방", host: "",
    rec: "잎 위로 잘 올라오지 않아 사진이 모두 천 배경",
    read: "노란 바탕에 붉은 무늬가 연지 곤지 같습니다. 색만으로도 아이들이 좋아합니다.",
    flag: "큰분홍푸른나방과 구별이 어렵습니다" },
  { n: "목화꼬마푸른나방", s: "Earias cupreoviridis", au: "Walker, 1862",
    fam: "혹나방과", sub: "푸른나방아과", alt: "목화밤나방", hf: ["아욱과", "운향과"], host: "아욱과 (무궁화) · 황벽나무",
    rec: "2024.09. 제주. 야간 등화",
    read: "이름에 목화가 들어가지만 국내 기록에는 무궁화와 황벽나무가 올라 있습니다. 목화도 무궁화도 아욱과라 이어지는데, 황벽나무는 운향과여서 어긋납니다. 이름과 실제가 어긋나는 자리를 보여 줍니다." },
  { n: "붉은무늬갈색애나방", s: "Siglophora sanguinolenta", au: "Moore, 1888",
    fam: "혹나방과", sub: "푸른나방아과", alt: "붉은무늬갈색밤나방", host: "",
    rec: "2007년부터 촬영. 다갈색애나방은 아직 만나지 못함",
    read: "한 번 보면 잊히지 않는 생김새인데 이름은 잘 외워지지 않습니다. 이름 외우기보다 생김새를 기억하게 하는 편이 낫다는 예입니다." },
  { n: "긴날개푸른나방", s: "Kerala decipiens", au: "Butler, 1878",
    fam: "혹나방과", sub: "푸른나방아과", alt: "긴날개밤나방", host: "",
    rec: "2020.07.18. 경북 봉화. 야간 등화",
    read: "재주나방 같기도, 뾰족날개나방 같기도 해서 도감을 몇 바퀴 돌게 만드는 종입니다. 분류가 생김새대로 되어 있지 않다는 것을 보여 줍니다." },
  { n: "쌍줄푸른나방", s: "Pseudoips prasinanus", au: "Linnaeus, 1758",
    fam: "혹나방과", sub: "푸른나방아과", alt: "쌍줄푸른밤나방", hf: ["참나무과"], host: "참나무과",
    rec: "봄형 수컷. 비 오는 날 멀리서 한 장",
    read: "린네가 1758년에 이름 붙인 종입니다. 학명 뒤 연도를 읽으면 그 종이 언제부터 사람에게 알려졌는지가 나옵니다." },
  { n: "큰쌍줄푸른나방", s: "Pseudoips sylpha", au: "Butler, 1879",
    fam: "혹나방과", sub: "푸른나방아과", alt: "큰쌍줄푸른밤나방", hf: ["참나무과"], host: "참나무과",
    rec: "봄형 수컷은 적갈색 바탕에 녹색",
    read: "한 종 안에 봄형과 여름형이 있고 그 안에서 암수가 또 다릅니다. 나방 이름 붙이기가 왜 어려운지 한 종으로 설명할 수 있습니다.",
    flag: "쌍줄푸른나방과 구별이 쉽지 않습니다" },
  { n: "푸른나방", s: "Clethrophora distincta", au: "Leech, 1889",
    fam: "혹나방과", sub: "푸른나방아과", alt: "푸른밤나방", hf: ["참나무과"], host: "참나무과 (종가시나무)",
    rec: "2018.06. 완도. 여러 해 모두 완도에서만 관찰",
    read: "기주가 종가시나무여서 가시나무가 자라는 남쪽에서만 보입니다. 벌레가 어디 사는지는 나무가 어디 사는지가 정합니다." },
  { n: "그물애나방", s: "Sinna extrema", au: "Walker, 1854",
    fam: "혹나방과", sub: "푸른나방아과", alt: "그물밤나방", hf: ["가래나무과"], host: "가래나무과 (굴피나무 · 가래나무 · 호두나무)",
    rec: "2026.04. 잎 뒷면. 낮에도 밤에도 관찰. 떼로 붙기도 함",
    read: "잎 뒷면에 붙어 쉽니다. 잎을 뒤집어 보는 활동에 딱 맞습니다. 다만 잎을 따지 말고 손끝으로 젖혀서만 보게 하세요." },
  { n: "앞노랑모나방", s: "Iragaodes nobilis", au: "Staüdinger, 1887",
    fam: "혹나방과", sub: "푸른나방아과", alt: "앞노랑모밤나방", host: "",
    rec: "무늬가 흐린 개체가 많음",
    read: "이름의 「앞」은 날개를 폈을 때의 앞쪽, 곧 전연을 말합니다. 접은 상태로만 보면 이름이 이해되지 않습니다." },

  /* ---------- 혹나방과 · 혹나방아과 ---------- */
  { n: "흰껍질혹나방", s: "Nolathripa lactaria", au: "Graeser, 1892",
    fam: "혹나방과", sub: "혹나방아과", alt: "흰껍질밤나방", host: "",
    rec: "2022.08.09. 경남 창원. 야간 등화",
    read: "위에서 보면 머리가 보이지 않습니다. 뒤집어 보면 검은 점이 눈, 앞가슴등판의 돌기가 코처럼 보여 동물 얼굴이 됩니다. 아이들이 무엇으로 보이는지 말하게 하기 좋습니다." },
  { n: "흰혹나방", s: "Nola taeniata", au: "Snellen, 1875",
    fam: "혹나방과", sub: "혹나방아과", alt: "", host: "다양",
    rec: "작지만 낮에도 보임",
    read: "날개 가운데 띠무늬가 눈에 띄지만 닳아 흐려진 개체가 많습니다. 작고 흔한 것을 그냥 지나치지 않게 하는 연습에 좋습니다." },
  { n: "둥근어깨무늬혹나방", s: "Nola galliphaga", au: "Cha et al., 2022",
    fam: "혹나방과", sub: "혹나방아과", alt: "", hf: ["조록나무과"], host: "진딧물 충영 (일본 기록 · 조록나무)",
    rec: "2026.08. 야간 등화",
    read: "잎이 아니라 진딧물이 만든 혹을 먹는다는 기록이 있습니다. 나방 애벌레가 다 잎만 먹는 것은 아닙니다. 2022년에 신종으로 발표되면서, 그전에 다른 학명으로 불리던 것이 오동정이었음이 밝혀졌습니다.",
    flag: "과거 Nola innocua로 기록된 것은 오동정" },
  { n: "어깨무늬혹나방", s: "Nola costimacula", au: "Staudinger, 1887",
    fam: "혹나방과", sub: "혹나방아과", alt: "꼬마혹나방", host: "",
    rec: "필자의 폴더에도 꼬마혹나방으로 들어 있던 종",
    read: "따로 부르던 두 이름이 같은 종으로 밝혀졌습니다(2022년). 이름이 둘이던 것이 하나가 되는 일도 있습니다.",
    flag: "쌍검은혹나방과도 매우 비슷합니다" },
  { n: "신선혹나방", s: "Meganola strigulosa", au: "Staudinger, 1887",
    fam: "혹나방과", sub: "혹나방아과", alt: "", host: "",
    rec: "2026.06.08. 경남 고성. 야간 등화",
    read: "무엇이 신선을 닮아 이 이름이 붙었는지 알려진 바가 없습니다. 이름의 유래를 아무도 모르는 경우도 있습니다." },
  { n: "쌍줄혹나방", s: "Meganola fumosa", au: "Butler, 1878",
    fam: "혹나방과", sub: "혹나방아과", alt: "", host: "",
    rec: "조사 목록 작성용으로 찍어 둔 사진이 많음",
    read: "무늬 변이가 커서 같은 종인지 한참을 봐야 합니다.",
    flag: "개체 변이가 커 동정이 어렵습니다" },
  { n: "큰쌍줄혹나방", s: "Meganola protogigas", au: "Inoue, 1970",
    fam: "혹나방과", sub: "혹나방아과", alt: "", host: "",
    rec: "2026.06.08. 경남 고성. 야간 등화",
    read: "참고 자료가 적어 필자도 확신하지 못한 채 이름을 붙인 종입니다. 모르는 것을 모른다고 적어 두는 것이 기록입니다.",
    flag: "동정 미확정 — 자료 부족" },
  { n: "맵시혹나방", s: "Manoba major", au: "Hampson, 1891",
    fam: "혹나방과", sub: "혹나방아과", alt: "", hf: ["부처꽃과"], host: "부처꽃과 (배롱나무)",
    rec: "2023.08. 전남 영암. 2022년 전남 신안 배롱나무 가로수 피해 보고",
    read: "가로수로 심은 배롱나무에서 피해가 보고된 종입니다. 한 종류 나무를 줄지어 심으면 그 나무를 먹는 벌레가 늘어납니다. 가로수를 보며 이야기하기 좋습니다." },
  { n: "사과혹나방", s: "Evonima mandschuriana", au: "Oberthür, 1880",
    fam: "혹나방과", sub: "혹나방아과", alt: "", hf: ["장미과", "참나무과"], host: "장미과 · 참나무과",
    rec: "2026.06. 야간 등화",
    read: "이름에 사과가 들어가 과수 해충으로 알려졌지만 참나무과도 먹습니다. 사람에게 손해를 끼치는 쪽만 이름에 남는 경우입니다." },

  /* ---------- 혹나방과 · 가중나무껍질나방아과 · 그 밖 ---------- */
  { n: "남방껍질나방", s: "Gadirtha impingens", au: "Walker, 1857",
    fam: "혹나방과", sub: "가중나무껍질나방아과", alt: "남방껍질밤나방", hf: ["대극과"], host: "대극과 (사람주나무)",
    rec: "2021.09. 야간 등화",
    read: "독나방 같기도, 재주나방 같기도, 뾰족날개나방 같기도 합니다. 생김새로 무리를 짐작하는 일이 늘 통하지는 않습니다." },
  { n: "은무늬모진애나방", s: "Gabala argentata", au: "Butler, 1878",
    fam: "혹나방과", sub: "푸른나방아과", alt: "은무늬모진애기밤나방", hf: ["옻나무과"], host: "옻나무과 (붉나무)",
    rec: "2012.05.17. 경남 창원. 주남저수지 조사",
    read: "애벌레가 붉나무 잎을 먹습니다. 붉나무는 가을 단풍이 붉어 눈에 잘 띄니, 나무를 먼저 찾고 벌레를 나중에 찾는 순서로 진행할 수 있습니다." },

  /* ---------- 혹나방과 · 남방껍질나방아과 ---------- */
  { n: "흰무늬껍질나방", s: "Negritothripa hampsoni", au: "Wileman, 1911",
    fam: "혹나방과", sub: "남방껍질나방아과", alt: "흰무늬껍질밤나방", hf: ["참나무과"], host: "참나무과",
    rec: "2020.07. 야간 등화",
    read: "애벌레는 참나무 잎을 먹지만 나무껍질 조각을 붙여 몸을 가린다고 합니다. 이름의 「껍질」은 먹이가 아니라 그 습성에서 왔습니다. 가슴 무늬가 동물 얼굴처럼 보입니다." },

  /* ---------- 재주나방과 ---------- */
  { n: "큰은무늬재주나방", s: "Spatalia plusiotis", au: "Oberthür, 1880",
    fam: "재주나방과", sub: "애기재주나방아과", alt: "", host: "",
    rec: "2023.06.10. 전북 남원. 야간 등화",
    read: "은색 무늬가 멀리서도 눈에 띕니다. 비슷한 무늬를 가진 재주나방이 셋 있습니다 — 은무늬 · 큰은무늬 · 세은무늬." },
  { n: "줄재주나방", s: "Epodonta lineata", au: "Oberthür, 1880",
    fam: "재주나방과", sub: "기린재주나방아과", alt: "", host: "",
    rec: "2024.09.08. 제주. 야간 등화",
    read: "날개에 줄이 여럿 그어져 있어 이름과 생김새가 그대로 맞아떨어집니다. 이름의 근거를 바로 확인할 수 있는 종입니다." },
  { n: "옹이재주나방", s: "Peridea aliena", au: "Staüdinger, 1892",
    fam: "재주나방과", sub: "재주나방아과", alt: "", host: "",
    rec: "2026.05.28. 강원 양구. 야간 등화",
    read: "앞날개 앞쪽 무늬가 나무의 옹이를 닮아 이름이 붙었습니다. 멀리서 봐야 그렇게 보입니다 — 가까이서만 보면 이름이 이해되지 않는 종입니다." },
  { n: "큰나무결재주나방", s: "Cerura menciana", au: "Moore, 1887",
    fam: "재주나방과", sub: "나무결재주나방아과", alt: "", hf: ["버드나무과"], host: "버드나무과",
    rec: "2026.06.23. 전남 구례. 야간 등화",
    read: "날개의 구불구불한 무늬가 나뭇결 같습니다. 더듬이가 크고 아름다워 수컷의 더듬이를 보여 주기 좋습니다. 나무결재주나방과는 앞날개 앞쪽 둥근 무늬로 가릅니다." }
];

/* 자료 출처 — 화면과 AI 프롬프트 양쪽에 밝힙니다 */
const MOTH_SOURCE = {
  blog: "크리스탈과 함께 (blog.naver.com/lovessym)",
  note: "종명 · 학명 · 분류 · 기주식물 · 관찰 날짜와 장소는 필자의 현장 기록을 그대로 옮겼습니다. " +
        "해설 지점은 이 앱에서 수업용으로 새로 쓴 것입니다.",
  span: "2026년 8월 24일 ~ 9월 2일 게시분 50편 (블로그 전체가 아닌 최근 글)"
};

/* 야간 등화 — 필자가 쓰는 조사 방법을 수업 형태로 옮긴 것입니다.
   불빛으로 나방을 불러 모으는 일은 준비물보다 지킬 것이 먼저입니다. */
const MOTH_NIGHT = {
  title: "야간 등화 — 불빛으로 부르는 숲",
  sub: "흰 천과 등 하나면 됩니다. 다만 지킬 것을 먼저 정하고 시작하세요.",
  need: ["흰 천 (1.5m 이상) 과 줄", "백색 LED 또는 자외선 등", "보조 배터리", "손전등 (붉은 셀로판을 씌우면 눈이 덜 부십니다)", "도감 또는 사진 찍을 기기", "긴팔 · 긴바지 · 모기 기피제"],
  steps: [
    ["18:30", "자리 잡기", "숲 가장자리, 바람이 덜 타는 곳. 민가와 도로에서 떨어질수록 좋습니다. 천을 나무 사이에 팽팽하게 매답니다."],
    ["19:30", "불 켜기", "해가 완전히 진 뒤에 켭니다. 켜자마자 오지 않습니다. 20~30분은 기다려야 합니다. 이 시간에 낮과 밤의 소리가 어떻게 바뀌는지 들어 보게 하세요."],
    ["20:00", "첫 손님", "작은 것부터 옵니다. 큰 나방은 대개 늦게 옵니다. 처음 온 것을 아이가 직접 세게 하면 끝까지 집중합니다."],
    ["20:30", "이름 붙이기 전에", "이름을 먼저 알려 주지 마세요. 무엇을 닮았는지 먼저 말하게 합니다. 「나무껍질 같다」가 나오면 그때 나무껍질나방을 꺼냅니다."],
    ["21:00", "기주 잇기", "천에 온 나방 중 기주를 아는 것을 골라, 그 나무가 이 숲에 있는지 함께 찾습니다. 벌레가 여기 있는 이유를 나무가 설명해 줍니다."],
    ["21:30", "끄기", "불을 끄고 5분간 어둠에 눈을 맡깁니다. 그다음 별을 봅니다. 불을 켠 시간보다 끄는 순간이 오래 남습니다."]
  ],
  rules: [
    "만지지 않습니다. 날개 비늘가루가 손에 묻으면 그 나방은 잘 날지 못합니다.",
    "채집하지 않습니다. 사진으로 충분합니다.",
    "밤새 켜 두지 않습니다. 불빛은 나방을 원래 가야 할 곳에서 붙잡아 둡니다. 두 시간 안에 끕니다.",
    "국립공원·보호구역에서는 사전 허가가 필요합니다. 반드시 확인하고 진행하세요.",
    "천 아래로 떨어진 개체를 밟지 않도록 발밑을 살핍니다.",
    "돌아갈 때 천·줄·쓰레기를 남기지 않습니다."
  ],
  ask: [
    "나방은 왜 불빛으로 올까? — 달빛을 기준으로 방향을 잡던 습성 때문이라는 설명이 널리 쓰입니다. 다만 완전히 밝혀진 것은 아닙니다.",
    "여기 온 나방들은 낮에 어디 있었을까?",
    "이 중에 이 숲에서 태어난 것은 몇이나 될까?",
    "우리가 불을 켜지 않았다면 오늘 밤 이 자리는 어땠을까?"
  ]
};

/* 기주식물 → 나방 색인. 「이 나무에 어떤 나방이 오는가」 */
function mothsByHost() {
  const map = {};
  MOTHS.forEach(function (m) {
    (m.hf || []).forEach(function (f) {
      (map[f] = map[f] || []).push(m);
    });
  });
  return map;
}

/* 과(科) 이름만으로는 다른 자료와 이어지지 않습니다.
   노거수·학명 40선·100차시는 종 이름으로 적혀 있기 때문입니다.
   그래서 과마다 우리 숲에서 만나는 대표 이름을 적어 두고 그것으로 잇습니다. */
const HOST_PLANTS = {
  "참나무과":     ["참나무", "상수리", "굴참", "신갈", "떡갈", "갈참", "졸참", "가시나무", "밤나무"],
  "버드나무과":   ["버드나무", "왕버들", "수양버들", "사시나무", "은사시", "포플러"],
  "장미과":       ["벚나무", "왕벚", "팥배나무", "산사나무", "마가목", "매실", "아그배", "사과나무"],
  "느릅나무과":   ["느릅나무", "느티나무", "팽나무", "푸조나무"],
  "물푸레나무과": ["물푸레", "쥐똥나무", "이팝나무", "개나리", "수수꽃다리", "미선나무"],
  "가래나무과":   ["가래나무", "굴피나무", "호두나무"],
  "감나무과":     ["감나무", "고욤나무"],
  "소태나무과":   ["소태나무", "가죽나무"],
  "아욱과":       ["무궁화", "목화", "피나무"],
  "운향과":       ["황벽나무", "산초", "초피", "탱자"],
  "부처꽃과":     ["배롱나무", "부처꽃"],
  "대극과":       ["사람주나무", "예덕나무"],
  "옻나무과":     ["붉나무", "옻나무", "개옻나무"],
  "조록나무과":   ["조록나무", "풍년화"],
  "쐐기풀과":     ["좀깨잎나무", "모시풀", "쐐기풀"],
  "벼과":         ["대나무", "조릿대", "억새", "주름조개풀", "벼"]
};

function mothHostLinks(family) {
  const out = { trees: [], names: [], lessons: [], plants: HOST_PLANTS[family] || [] };
  const keys = out.plants;
  if (!keys.length) return out;
  const hit = function () {
    const hay = Array.prototype.slice.call(arguments).join(" ");
    return keys.some(function (k) { return hay.indexOf(k) >= 0; });
  };
  try {
    if (typeof TREES !== "undefined") {
      out.trees = TREES.filter(function (t) { return hit(t.name, t.species); })
                       .slice(0, 4).map(function (t) { return t.name; });
    }
    if (typeof NAMES !== "undefined") {
      out.names = NAMES.filter(function (x) { return hit(x.n); })
                       .slice(0, 4).map(function (x) { return x.n; });
    }
    if (typeof LESSONS !== "undefined" && LESSONS) {
      out.lessons = LESSONS.filter(function (l) { return hit(l.name); })
                           .slice(0, 3).map(function (l) { return l.no + "차시 " + l.name; });
    }
  } catch (e) {}
  return out;
}

/* ---------- 화면 ---------- */
let mothHost = "전체";   // 기주식물 갈래
let mothOpen = "";       // 펼친 종

function mEsc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function mothHostList() {
  const map = mothsByHost();
  return Object.keys(map).sort(function (a, b) {
    return map[b].length - map[a].length || a.localeCompare(b, "ko");
  });
}

function filteredMoths() {
  if (mothHost === "전체") return MOTHS;
  if (mothHost === "기록 없음") return MOTHS.filter(function (m) { return !m.hf; });
  return MOTHS.filter(function (m) { return (m.hf || []).indexOf(mothHost) >= 0; });
}

function mothCardHTML(m) {
  const open = mothOpen === m.n;
  const link = open && m.hf ? mothHostLinks(m.hf[0]) : null;
  const linkRow = function (label, arr) {
    return arr && arr.length
      ? '<p class="module-meta"><b>' + label + '</b> · ' + arr.map(mEsc).join(", ") + '</p>' : "";
  };
  return '<div class="card moth' + (open ? " is-open" : "") + '">' +
    '<span class="module-tag">' + mEsc(m.sub) + '</span>' +
    (m.hf ? '<span class="here here-seen">' + mEsc(m.hf.join(" · ")) + '</span>'
          : '<span class="here here-rare">기주 기록 없음</span>') +
    '<h3>' + mEsc(m.n) + '</h3>' +
    '<p class="module-meta"><i>' + mEsc(m.s) + '</i> <span class="small">' + mEsc(m.au) + '</span></p>' +
    '<p class="small">' + mEsc(m.fam) + ' · ' + mEsc(m.sub) +
      (m.alt ? ' · 이전 이름 ' + mEsc(m.alt) : '') + '</p>' +
    (m.read ? '<p class="quote" style="margin:.6rem 0">' + mEsc(m.read) + '</p>' : '') +

    (open ? (
      (m.host ? '<h4>기주식물</h4><p>' + mEsc(m.host) + '</p>' : '') +
      (m.rec ? '<h4>관찰 기록</h4><p>' + mEsc(m.rec) + '</p>' : '') +
      (m.flag ? '<p class="caution-box">✎ ' + mEsc(m.flag) + '</p>' : '') +
      (link && link.plants.length
        ? '<h4>이 숲에서 찾을 나무</h4>' +
          '<p>' + link.plants.map(mEsc).join(", ") + '</p>' +
          linkRow("노거수", link.trees) + linkRow("학명 40선", link.names) +
          linkRow("100차시", link.lessons)
        : '') +
      '<div class="btn-row">' +
        '<button class="btn btn-sm btn-primary" type="button" data-mplan="' + mEsc(m.n) + '">이 나방으로 수업 설계</button>' +
        (typeof pickBtn === "function" ? pickBtn("moths", m.n) : "") +
        '<button class="btn btn-sm" type="button" data-mclose="1">접기</button>' +
      '</div>'
    ) : '<div class="btn-row">' +
        '<button class="btn btn-sm" type="button" data-mopen="' + mEsc(m.n) + '">펼쳐 보기</button>' +
        (typeof pickBtn === "function" ? pickBtn("moths", m.n) : "") +
      '</div>') +
    '</div>';
}

function nightHTML() {
  const N = MOTH_NIGHT;
  return '<div class="panel night"><h3>' + mEsc(N.title) + '</h3>' +
    '<p class="page-sub">' + mEsc(N.sub) + '</p>' +
    '<h4>준비물</h4><p>' + N.need.map(mEsc).join(" · ") + '</p>' +
    '<h4>진행</h4><div class="booklist">' +
    N.steps.map(function (s) {
      return '<div class="book"><b>' + mEsc(s[0]) + ' · ' + mEsc(s[1]) + '</b><p>' + mEsc(s[2]) + '</p></div>';
    }).join("") + '</div>' +
    '<h4>반드시 지킬 것</h4><ul class="rules">' +
    N.rules.map(function (r) { return '<li>' + mEsc(r) + '</li>'; }).join("") + '</ul>' +
    '<h4>던질 물음</h4><div class="booklist">' +
    N.ask.map(function (q) { return '<div class="book"><p>' + mEsc(q) + '</p></div>'; }).join("") + '</div>' +
    '<div class="btn-row">' +
      '<button class="btn btn-primary btn-sm" type="button" data-mnight="1">야간 등화 수업으로 설계</button>' +
      (typeof pickBtn === "function" ? pickBtn("moths", "야간 등화") : "") +
    '</div></div>';
}

function mothsHTML() {
  const hosts = mothHostList();
  const list = filteredMoths();
  const map = mothsByHost();
  return '<p class="hint">애벌레는 정해진 나무만 먹습니다. 그래서 <b>나방을 알면 그 숲에 어떤 나무가 있는지</b> 알 수 있고, ' +
    '거꾸로 <b>나무를 알면 어떤 나방이 올지</b> 짐작할 수 있습니다. 기주식물로 묶어 둔 이유입니다.<br>' +
    '자료 · ' + mEsc(MOTH_SOURCE.blog) + ' — ' + mEsc(MOTH_SOURCE.span) + '. ' + mEsc(MOTH_SOURCE.note) + '</p>' +

    nightHTML() +

    '<h2 class="section-title">기주식물로 찾기</h2>' +
    '<div class="filters" id="mothHosts"><span class="filter-label">기주</span>' +
    ['전체'].concat(hosts).concat(['기록 없음']).map(function (h) {
      const n = h === "전체" ? MOTHS.length
              : h === "기록 없음" ? MOTHS.filter(function (m) { return !m.hf; }).length
              : (map[h] || []).length;
      return '<button class="pill' + (h === mothHost ? " is-active" : "") +
        '" type="button" data-mhost="' + mEsc(h) + '">' + mEsc(h) +
        ' <span class="count-badge">' + n + '</span></button>';
    }).join("") + '</div>' +

    '<p class="small">' + list.length + '종' +
      (mothHost !== "전체" ? ' · ' + mEsc(mothHost) + '를 먹는 나방' : '') + '</p>' +

    (list.length
      ? '<div class="grid grid-2">' + list.map(mothCardHTML).join("") + '</div>'
      : "<p class='empty-note'>해당 기주의 나방이 없습니다.</p>");
}

function renderMoths() {
  const box = document.getElementById("corpusBody");
  if (!box || corpusTab !== "moths") return;
  const cnt = document.getElementById("corpusCount");
  if (cnt) {
    const n = filteredMoths().length;
    cnt.textContent = (n === MOTHS.length) ? n + "종" : MOTHS.length + "종 중 " + n + "종";
  }
  box.innerHTML = mothsHTML();
}

/* 아카이브 화면의 클릭을 나눠 받습니다 */
function handleMothClick(e) {
  if (corpusTab !== "moths") return false;
  const h = e.target.closest("[data-mhost]");
  if (h) { mothHost = h.getAttribute("data-mhost"); mothOpen = ""; renderMoths(); return true; }
  const o = e.target.closest("[data-mopen]");
  if (o) { mothOpen = o.getAttribute("data-mopen"); renderMoths(); return true; }
  if (e.target.closest("[data-mclose]")) { mothOpen = ""; renderMoths(); return true; }
  const p = e.target.closest("[data-mplan]");
  if (p) { useMoth(p.getAttribute("data-mplan")); return true; }
  if (e.target.closest("[data-mnight]")) { useMothNight(); return true; }
  return false;
}

/* 나방 한 종 → 수업 설계 폼 */
function useMoth(name) {
  const m = MOTHS.filter(function (x) { return x.n === name; })[0];
  if (!m) return;
  const title = document.getElementById("f-title");
  const topic = document.getElementById("f-topic");
  const note  = document.getElementById("f-note");
  if (title && !title.value) title.value = m.n + "이(가) 사는 나무";
  if (topic && !topic.value) topic.value = m.n;
  if (note) {
    note.value = (note.value ? note.value + "\n" : "") +
      "나방: " + m.n + " (" + m.s + ", " + m.au + ") / " + m.fam + " " + m.sub +
      (m.alt ? " / 이전 이름 " + m.alt : "") +
      (m.host ? " / 기주식물 " + m.host : " / 기주 기록 없음") +
      (m.rec ? " / 관찰 " + m.rec : "") +
      (m.read ? " / 해설 지점: " + m.read : "") +
      (m.flag ? " / 반드시 함께 말할 것: " + m.flag : "");
  }
  navigate("design");
  if (typeof toast === "function") toast("「" + m.n + "」을(를) 수업 설계에 담았습니다");
}

/* 야간 등화 → 수업 설계 폼 */
function useMothNight() {
  const N = MOTH_NIGHT;
  const title = document.getElementById("f-title");
  const note  = document.getElementById("f-note");
  const place = document.getElementById("f-place");
  if (title && !title.value) title.value = N.title;
  if (place && !place.value) place.value = "숲 가장자리, 바람이 덜 타는 곳 (야간)";
  if (note) {
    note.value = (note.value ? note.value + "\n" : "") +
      "야간 등화 프로그램으로 설계해 주세요. / 준비물: " + N.need.join(", ") +
      " / 진행: " + N.steps.map(function (s) { return s[0] + " " + s[1]; }).join(" → ") +
      " / 반드시 지킬 것: " + N.rules.join(" ") +
      " / 던질 물음: " + N.ask[0];
  }
  navigate("design");
  if (typeof toast === "function") toast("야간 등화를 수업 설계에 담았습니다");
}

/* AI 프롬프트용 요약 */
function mothBrief() {
  const map = mothsByHost();
  return Object.keys(map).map(function (f) {
    return f + ": " + map[f].map(function (m) { return m.n; }).join(", ");
  });
}
