"use strict";
// ===== 게임 데이터 (구역·주민·친구 강아지·대사·이벤트·퀘스트·상점·보물) =====

// ---------- 세계 지도: 3×3 구역 (가운데 = 우리 마을). 길 끝으로 걸어가면 옆 구역으로 넘어간다 ----------
const PLACES={
  meadow:{name:'꽃밭 언덕',theme:'meadow',lv:2,gx:0,gy:0,land:'windmill',desc:'바람개비와 들꽃이 가득한 언덕'},
  mountain:{name:'뒷산 숲길',theme:'mountain',lv:2,gx:1,gy:0,land:'pavilion',desc:'버섯과 그루터기가 많은 숲'},
  summit:{name:'산 정상 전망대',theme:'summit',lv:4,gx:2,gy:0,land:'pavilion',desc:'마을이 내려다보이는 바위산'},
  beach:{name:'바닷가 산책로',theme:'beach',lv:3,gx:0,gy:1,land:'umbrella',desc:'파도 소리와 조개가 있는 모래사장'},
  town:{name:'우리 마을',gx:1,gy:1,lv:1,desc:'집과 이웃들이 있는 마을'},
  park:{name:'호수 공원',theme:'park',lv:1,gx:2,gy:1,land:'fountain',desc:'오리와 분수대가 있는 공원'},
  camp:{name:'숲속 캠핑장',theme:'camp',lv:4,gx:0,gy:2,land:'campfire',desc:'텐트와 모닥불이 있는 숲속 공터'},
  market:{name:'골목 시장',theme:'street',lv:1,gx:1,gy:2,land:'slide',desc:'비둘기가 많은 동네 골목'},
  river:{name:'강변 산책길',theme:'river',lv:3,gx:2,gy:2,land:'bench',desc:'반짝이는 강과 갈대밭'}
};
const ZGRID={};for(const [k,z] of Object.entries(PLACES))ZGRID[z.gx+','+z.gy]=k;
const DIRS={N:[0,-1],S:[0,1],E:[1,0],W:[-1,0]},OPP={N:'S',S:'N',E:'W',W:'E'};
const zoneAt=(id,dir)=>{const z=PLACES[id],d=DIRS[dir];return ZGRID[(z.gx+d[0])+','+(z.gy+d[1])]||null;};
const OUTER=Object.keys(PLACES).filter(k=>k!=='town');
THEMES.meadow={path:{type:'dirt',b:'#d6b27a',m:'#c09a64',l:'#e6c896',e:'#9a7448'},obj:[['tree',.02],['bush',.03],['flowerbed',.03]],tall:.6,sniff:['flowers','flowers','stump'],birds:true};
THEMES.summit={path:{type:'dirt',b:'#bfa07a',m:'#a88a66',l:'#d2b892',e:'#7a6448'},obj:[['pine',.07],['rock',.1],['fern',.02]],tall:.2,sniff:['stump','flowers','rock']};
THEMES.beach={path:{type:'stone',b:'#c9a476',m:'#a8825a',l:'#dcbc8e',e:'#7a5a3a'},obj:[['umbrella',.012],['rock',.02],['reed',.01]],tall:.04,sniff:['flowers','rock','umbrella'],seaLeft:true,sand:true,birds:true};
THEMES.camp={path:{type:'dirt',b:'#c49a63',m:'#ae854f',l:'#d8b27c',e:'#8f6b3d'},obj:[['pine',.07],['tree',.04],['tent',.012],['stump',.03],['mushroom',.02]],tall:.45,sniff:['stump','mushroom','tent']};
const SAND_SEA={grass:['#e6d3a2','#eedcae','#f4e6c0'],blade:'#d2bc84',bladeL:'#fff2cc',tree:{OL:'#23462a',d:'#3d7f3f',m:'#529b48',l:'#74b95a'},fall:null};

// ---------- 사람 ----------
const GIRL={skin:'#f8dcc2',hair:'#1c1820',hairL:'#4a4250',style:'long',glasses:'#141014',top:'#c9b6e4',topD:'#b29fd0',bottom:'#3e4a6b',skirt:true,sock:'#ffffff',shoe:'#7a4a2a',collar:'#ffffff'};
const NPCS={
  grandma:{name:'복순 할머니',home:'grandma',P:{skin:'#f3d2b4',hair:'#d8d4cc',hairL:'#f0eee8',style:'bun',top:'#b07aa1',topD:'#94628a',bottom:'#6a5a7a',skirt:true,glasses:'#8a6a4a'},
    idle:['담이는 볼 때마다 크는구나.','할머니 젊었을 땐 진돗개를 키웠단다. 이름이 백구였지.','산책 다녀오면 물 꼭 챙겨 주렴.','요즘 무릎이 쑤셔서 산책을 못 가. 담이가 대신 걸어 다오~','손주가 사진을 보냈는데, 강아지 옷 입은 게 그렇게 귀엽더구나.','고양이 나비가 담이를 무서워하는 것 같지 않니? 호호.']},
  baker:{name:'제빵사 민수',home:'bakery',P:{skin:'#f1c9a0',hair:'#5a3a2a',style:'cap',hat:'#ffffff',top:'#ffffff',topD:'#e8e8e8',apron:'#e8b26a',bottom:'#5b5a7a'},
    idle:['오늘 크루아상이 아주 잘 구워졌어!','강아지는 빵 먹으면 안 돼~ 담이 미안!','새벽 4시에 일어나서 반죽했어. 하암…','강아지용 쌀 쿠키를 개발 중이야. 담이가 첫 시식자 어때?','빵 냄새 맡고 담이 코가 실룩실룩하네, 하하.','비 오는 날엔 소금빵이 제일 잘 팔려.']},
  florist:{name:'꽃집 하린',home:'florist',P:{skin:'#f8dcc2',hair:'#d9773a',hairL:'#f0a060',style:'short',top:'#9cc3a6',topD:'#86ad90',apron:'#efe2c8',bottom:'#6b5a4a',skirt:true},
    idle:['담이 털 색이랑 어울리는 꽃이 있어요! 연노랑 프리지아!','들꽃은 산책길에 제일 예쁘게 펴요.','꽃집 앞에서 담이가 자꾸 킁킁해요. 꽃 좋아하나 봐요.','꽃밭 언덕에 바람개비 보셨어요? 거기 노을이 진짜 예뻐요.','튤립은 강아지한테 안 좋아요. 담이 조심!','오늘 들어온 수국 색이 너무 고와요.']},
  shop:{name:'펫샵 지호',home:'petshop',P:{skin:'#f1c9a0',hair:'#2b2b33',style:'short',top:'#5aa9e6',topD:'#4a92cc',apron:'#f7d64a',bottom:'#3b3b4a'},shop:true,
    idle:['어서 오세요, 멍멍 펫샵입니다!','새로 들어온 리본 보셨어요?','원반 하나 장만하세요! 공원에서 원반 놀이 하면 담이 엄청 좋아해요.','말티푸는 털 엉킴 조심! 샤워 후엔 꼭 말려 주세요.']},
  kid:{name:'도윤',home:'kid',P:{skin:'#f8dcc2',hair:'#3b2a20',style:'kid',top:'#ef6f7c',topD:'#d85a68',bottom:'#4f7ab8',kid:true},
    idle:['나도 강아지 키우고 싶다~','담이야 하이파이브!','엄마가 강아지는 크면 키우재. 나 이제 8살인데!','바닷가에서 조개 주웠어! 보여 줄까? …아 집에 두고 왔다.','담이 빵야! 하는 거 또 보고 싶어!','오늘 학교에서 강아지 그림 그렸어. 담이 그렸다!']},
  coach:{name:'코치 은비',home:'coach',P:{skin:'#efc49a',hair:'#5a3a2a',style:'pony',top:'#7cc36a',topD:'#68ad58',bottom:'#3b3b4a'},
    idle:['훈련은 짧게, 칭찬은 크게!','실패해도 괜찮아요. 담이는 매일 늘고 있어요.','축제 장기자랑, 기대돼요!','간식 먹은 직후가 훈련 효과가 제일 좋아요.','어질리티 코스 해 볼래요? 담이 은근 날쌔던데요!']},
  vet:{name:'수의사 서연',home:'vet',P:{skin:'#f8dcc2',hair:'#2b2230',hairL:'#4a4050',style:'pony',top:'#ffffff',topD:'#e4e8ec',apron:'#8fd0c4',bottom:'#4a5a6a',glasses:'#555'},
    idle:['콩닥 동물병원이에요. 담이 오늘 컨디션 좋아 보이네요!','산책길에 떨어진 음식은 강아지 배탈의 원인 1위예요.','말티푸는 눈물 자국 관리도 해 주세요~','예방접종 수첩 잘 챙기고 계시죠?','담이 발바닥 젤리 말랑말랑하네요. 건강해요!']},
  mayor:{name:'이장님',home:'mayor',P:{skin:'#efc49a',hair:'#9a9a9a',hairL:'#c8c8c8',style:'short',top:'#8a6a4a',topD:'#74583c',bottom:'#4a4a4a',glasses:'#333333'},
    idle:['마을 강아지 축제 준비로 바쁘구먼.','담이도 축제에 나오는 거지?','허허, 오늘 날씨 좋구먼.','산 정상 전망대에서 보면 우리 마을이 손바닥만 해.','캠핑장 모닥불 앞에서 고구마 구워 먹던 시절이 그립구먼.']}
};

// ---------- 친구 강아지 (성격·대사가 다 다름) ----------
const WALKERS=[
  {id:'kong',dog:'콩이',breed:'포메라니안',owner:'지수',P:{hair:'#7a4a2a',style:'long',top:'#f7d64a',topD:'#e0c040',bottom:'#3e4a6b',skirt:true},D:{C:'#f2a65a',D:'#d8843a',L:'#ffd6a0',OL:'#6b3a1a',EAR:'#d8843a',ear:'point',curly:false},
    first:['어머, 말티푸다! 너무 귀여워요~ 저는 지수, 얘는 포메 콩이예요.'],
    again:['담이다! 콩이가 멀리서부터 꼬리 흔들었어요.','또 만났네요~ 오늘 담이 리본 예쁘다!','콩이야, 담이 언니 왔다!'],
    chat:['콩이는 사진 찍을 때만 얌전해요. 진짜로요.','포메는 털갈이 시즌이 무서워요… 옷이 다 털이에요.','콩이가 요즘 바닷가 모래 파는 데 재미 들렸어요.','어제 콩이가 제 양말을 숨겼어요. 아직 못 찾았어요.'],
    hint:'콩이가 저기 나무 밑에서 한참 킁킁하던데요? 뭐가 묻혀 있나 봐요!'},
  {id:'som',dog:'솜이',breed:'비숑',owner:'영철 할아버지',P:{hair:'#cfcfcf',style:'short',top:'#6a8fbf',topD:'#5a7aa8',bottom:'#4a4a4a',glasses:'#555'},D:{C:'#ffffff',D:'#e6e6ee',L:'#ffffff',OL:'#7a7a88',EAR:'#ececf2',ear:'flop',curly:true},
    first:['허허, 어린 친구구먼. 나는 영철이고 이 녀석은 솜이라네.'],
    again:['오, 담이 왔구나. 솜이가 좋아하겠어.','오늘도 부지런하구먼. 젊을 때 많이 걸어 둬.','솜이야, 담이한테 인사해야지.'],
    chat:['솜이는 열 살이야. 걸음은 느려도 산책은 하루도 안 빠지지.','비숑은 미용이 반이야. 허허, 솜사탕 같지?','우리 솜이는 비 오는 날엔 현관에서 버텨. 고집이 아주 대단해.','강변 갈대밭에서 노을 보면 시간 가는 줄 몰라.'],
    hint:'저쪽 길가에서 솜이가 앞발로 땅을 긁더구먼. 뭔가 있을 게야.'},
  {id:'dan',dog:'단풍',breed:'시바견',owner:'준호',P:{hair:'#2b2b2b',style:'short',top:'#e07a5f',topD:'#c86a50',bottom:'#3b3b4a'},D:{C:'#e0954a',D:'#c27a35',L:'#fff2dc',OL:'#5a3418',EAR:'#c27a35',ear:'point',mask:true},
    first:['안녕하세요. 준호예요. 얘는 시바 단풍이… 낯을 좀 가려요.'],
    again:['아, 담이. 단풍이가 웬일로 먼저 다가가네요.','오늘은 단풍이 기분 좋은 날이에요. 드문 날이죠.','안녕하세요! 담이 많이 컸네요.'],
    chat:['시바는 싫으면 비명을 질러요. 목욕할 때 동네가 다 알아요.','단풍이는 산 정상 가는 길을 제일 좋아해요.','어제 단풍이가 산책 거부해서 30분 동안 서 있었어요…','단풍이는 간식 줄 때만 앉아를 해요. 철저해요.'],
    hint:'단풍이가 아까 저쪽에서 안 오려고 버텼어요. 냄새나는 게 묻혀 있나 봐요.'},
  {id:'choco',dog:'초코',breed:'토이푸들',owner:'서연',P:{hair:'#5a3a2a',style:'pony',top:'#f2b8c6',topD:'#dca0b0',bottom:'#6b5a8a',skirt:true},D:{C:'#8a5a3a',D:'#6e4428',L:'#b08060',OL:'#3a2214',EAR:'#6e4428',ear:'flop',curly:true},
    first:['꺄 너무 귀여워요! 저는 서연이고, 얘는 토이푸들 초코예요!'],
    again:['담이야~! 초코가 담이 좋아해서 매일 이 길로 와요.','어? 담이 오늘 기분 좋아 보인다!','초코야 봐 봐, 담이 왔어!'],
    chat:['초코는 재주가 열 개예요. 다 간식 덕분이죠, 헤헤.','푸들은 털이 안 빠져서 좋은데 미용비가… 하하.','초코가 캠핑 갔다가 모닥불 앞에서 졸았어요. 너무 귀여웠어요.','초코는 공보다 원반을 더 좋아해요!'],
    hint:'저기 수풀 쪽에서 초코가 한참 냄새 맡았어요. 보물 있을지도?'},
  {id:'sik',dog:'식빵',breed:'웰시코기',owner:'민아',P:{hair:'#c08040',style:'bun',top:'#7cc3c0',topD:'#68aca9',bottom:'#4a4a5a'},D:{C:'#e8a050',D:'#c98538',L:'#fff6e8',OL:'#5a3418',EAR:'#c98538',ear:'point',short:true,mask:true},
    first:['안녕하세요! 민아예요. 얘는 식빵이! 엉덩이 보세요, 식빵 같죠?'],
    again:['식빵아, 담이야! …벌써 엉덩이 흔드는 중이에요.','오 담이! 오늘 산책 코스 어디로 가요?','반가워요~ 식빵이가 담이 냄새 맡고 끌고 왔어요.'],
    chat:['코기는 다리가 짧아서 계단 앞에서 고민을 해요. 진지하게요.','식빵이는 바닷가에서 파도 쫓는 게 취미예요.','식빵이가 밥 먹고 바로 뛰어서 배가 빵빵해요.','코기 털은… 1년 내내 빠져요. 저는 이제 포기했어요.'],
    hint:'식빵이가 저쪽에서 땅 파다가 혼났어요. 근데 진짜 뭐가 있는 것 같았어요!'},
  {id:'bori',dog:'보리',breed:'말티즈',owner:'수아',P:{hair:'#3a2a2a',style:'long',top:'#ffffff',topD:'#e6e6e6',bottom:'#c84a5a',skirt:true},D:{C:'#fbfbf7',D:'#e8e8e2',L:'#ffffff',OL:'#7a7a80',EAR:'#f0f0ea',ear:'flop',curly:false},
    first:['안녕하세요~ 저는 수아, 말티즈 보리예요. 담이랑 사촌 같네요!'],
    again:['담이랑 보리랑 나란히 있으니 눈사람 두 개 같아요.','오늘도 만났네요! 보리가 담이 기다렸어요.','담이 털 보송보송하다~ 샤워했구나!'],
    chat:['보리는 산책 나오면 꼭 꽃 냄새부터 맡아요.','말티즈는 눈물 자국 관리가 제일 힘들어요.','보리는 꽃밭 언덕 바람개비를 보면 짖어요. 무서운가 봐요.','보리가 요즘 빵야! 를 배우는 중이에요. 아직 그냥 누워요.'],
    hint:'보리가 아까 저기 꽃 옆에서 땅을 콕콕 팠어요.'}
];
// 상황별 공통 대사 (날씨·시간)
const SITU={rain:['비 오는데 담이도 나왔네요! 발 젖겠다~','비 냄새 좋죠? 강아지들은 비 오는 날 냄새를 더 잘 맡는대요.'],
  evening:['벌써 해가 지네요. 오늘도 수고했어요~','노을 보면서 걷는 게 제일 좋아요.'],morning:['좋은 아침이에요! 아침 산책 상쾌하죠?','일찍 나왔네요! 부지런한 담이~']};
// 만났을 때 고를 수 있는 일
const MEET_ACTS=[{id:'play',label:'같이 놀자!'},{id:'treat',label:'간식 나눠 먹기'},{id:'trick',label:'재주 자랑하기'},{id:'photo',label:'같이 사진 찍기'},{id:'chat',label:'이야기 나누기'}];

// ---------- 담이 ----------
const DAMI_P={s:1,C:'#f9edda',D:'#ecd4ae',L:'#fffbf2',OL:'#7a5c44',EAR:'#e8c99c',ear:'flop',curly:true,vest:true,V:'#ffffff',VS:'#dbe2ee',H:'#ee8f3a',K:'#1e1512',blush:'#f6b0bc'};
const BIGDOGS=[{C:'#e2b06a',D:'#c99350',L:'#f3d9a8',OL:'#6b4a2a',EAR:'#c99350',ear:'flop',band:'#5aa9e6'},{C:'#3d3836',D:'#2a2624',L:'#615a56',OL:'#121012',EAR:'#2a2624',ear:'flop',band:'#ef6f7c'},{C:'#f4f2ec',D:'#dcd8cc',L:'#ffffff',OL:'#6b6458',EAR:'#dcd8cc',ear:'point',band:'#7cc36a'}];
const TRICKS={sit:{name:'앉아',lv:1,pose:'sit'},paw:{name:'손',lv:2,pose:'paw'},down:{name:'엎드려',lv:3,pose:'lie'},bang:{name:'빵야!',lv:4,pose:'roll'}};
const ACCS={ribbon:{name:'빨간 리본',price:40},flower:{name:'꽃핀',price:45},bandana:{name:'하늘 반다나',price:55},hat:{name:'밀짚모자',price:70},star:{name:'별 머리핀',price:90,lv:3},
  crown:{name:'생일 왕관',price:0,special:true},shades:{name:'선글라스',price:80,rare:true},scarf:{name:'체크 목도리',price:75,rare:true}};
const SHOP=[
  {id:'kibble',name:'사료 5번분',price:20,desc:'담이 밥그릇에 채워 줘요'},
  {id:'treat',name:'간식 5개',price:15,desc:'재주 성공률이 잠깐 올라가요'},
  {id:'frisbee',name:'원반',price:40,once:true,desc:'산책길에서 담이 메뉴 → 원반 놀이 (미니게임)'},
  ...Object.entries(ACCS).filter(([,a])=>!a.special&&!a.rare).map(([id,a])=>({id,name:a.name,price:a.price,acc:true,lv:a.lv||1,desc:'담이 꾸미기 (옷장에서 착용)'}))
];
const RARE_SHOP=[{id:'shades',name:'선글라스',price:80,acc:true,desc:'떠돌이 상인의 귀한 물건'},{id:'scarf',name:'체크 목도리',price:75,acc:true,desc:'떠돌이 상인의 귀한 물건'},{id:'treat',name:'간식 5개 (반값)',price:8,desc:'오늘만 반값!'}];
const TREASURES={
  coin:{name:'옛날 동전',coin:15},marble:{name:'반짝 구슬'},key:{name:'낡은 열쇠'},bone:{name:'공룡뼈 장난감'},
  shell:{name:'예쁜 조개'},acorn:{name:'도토리 왕관'},star:{name:'별모양 돌'},ball:{name:'잃어버린 테니스공'},
  glass:{name:'바다 유리'},pinecone:{name:'황금 솔방울'},feather:{name:'파랑새 깃털'},harmonica:{name:'작은 하모니카'}
};
const DIG_TABLE={park:['coin','marble','ball','coin'],market:['coin','key','marble','coin'],mountain:['acorn','bone','star','coin'],river:['shell','star','marble','coin'],
  meadow:['feather','marble','coin'],summit:['star','key','feather'],beach:['shell','glass','glass','coin'],camp:['pinecone','harmonica','acorn'],town:['coin','ball']};

// ---------- 성장 ----------
const XP_NEED=lv=>40+lv*30;
const AFF_NEED=lv=>20+lv*15;
const FESTIVAL_DAY=10;

// ---------- 날짜별 이벤트 (아침에 마을 소식으로 알려 줌) ----------
const EVENTS={
  sale:{title:'펫샵 할인 데이',desc:'멍멍 펫샵 모든 물건 30% 할인!'},
  rain:{title:'보슬비 오는 날',desc:'하루 종일 보슬비. 담이가 빨리 꼬질꼬질해져요. 샤워 꼭!'},
  bday:{title:'도윤이 생일',desc:'도윤이에게 간식 선물을 주면 생일 파티에 초대받아요.'},
  frisbee:{title:'호수 공원 원반 대회',desc:'호수 공원 분수대 앞 진행자에게 말을 걸어 참가! 30점 넘으면 상품!'},
  flea:{title:'골목 시장 벼룩시장',desc:'골목 시장에 떠돌이 상인이 왔어요. 귀한 꾸미기 아이템!'},
  kitten:{title:'아기 고양이 나비 실종',desc:'복순 할머니네 고양이 나비가 없어졌어요. 담이 코로 찾아 주세요!'},
  festival:{title:'마을 강아지 축제',desc:'오늘 밤 장기자랑! 자기 전에 결과가 나와요.'}
};
function eventsForDay(d){
  const fixed={2:['sale'],3:['rain'],4:['bday'],6:['frisbee'],7:['flea'],8:['rain'],9:['kitten'],10:['festival']};
  if(fixed[d])return fixed[d].slice();
  if(d<=10)return [];
  const ev=[];if(rnd()<.25)ev.push('rain');const k=d%7;if(k===2)ev.push('sale');if(k===5)ev.push('flea');if(k===3)ev.push('frisbee');if(k===6&&rnd()<.5)ev.push('kitten');return ev;}

// ---------- 퀘스트 ----------
const QDEF=[
  {giver:'grandma',type:'find',reward:40,xp:25,mk(){const it=pick(['꽃무늬 손수건','돋보기 안경','털실 뭉치','은 브로치']);const pl=pick(placesOpen(OUTER));
    return{item:it,place:pl,title:`${it} 찾기`,ask:[`아이고, 어제 ${PLACES[pl].name}에서 ${it}을(를) 잃어버렸단다.`,'담이 코라면 금방 찾을 것 같은데… 부탁해도 될까?'],thanks:['어머나, 정말 찾아왔구나! 담이 코가 최고야.','고마워서 그래, 이거 받아 가렴.']};}},
  {giver:'baker',type:'deliver',reward:35,xp:20,mk(){const pl=pick(placesOpen(OUTER));const to=pick(['산책하는 미나 씨','등산객 할아버지','벤치의 태오 씨','캠핑 온 하늘 씨']);
    return{item:'빵 바구니',to,place:pl,title:`${PLACES[pl].name}에 빵 배달`,ask:[`${PLACES[pl].name}에 있는 ${to}께 빵 바구니 좀 전해 줄래?`,'담이가 냄새 맡고 먹으면 안 된다~ 하하!'],thanks:['배달 고마워! 손님이 아주 좋아했대.','담이 간식도 두 개 넣었어!'],bonusTreat:2};}},
  {giver:'florist',type:'collect',reward:30,xp:20,mk(){const pl=pick(placesOpen(['park','meadow','mountain','river','beach','camp']));const it={park:'민들레',meadow:'들꽃',mountain:'산딸기',river:'갈대꽃',beach:'예쁜 조개',camp:'솔방울'}[pl];
    return{item:it,n:3,place:pl,title:`${it} 3개 모으기`,ask:[`${PLACES[pl].name}에 ${it}이(가) 한창이래요.`,'꽃다발 장식에 쓰고 싶은데 3개만 모아다 줄래요?'],thanks:['와, 너무 예쁘다! 고마워요.','담이한테 어울릴 꽃핀도 같이 줄게요!'],acc:'flower'};}},
  {giver:'kid',type:'play',reward:25,xp:20,mk(){return{n:2,place:null,title:'친구 강아지랑 2번 어울리기',ask:['담이도 친구가 많으면 좋겠다!','산책하다 만나는 강아지들이랑 2번 어울려 줘! (놀기·간식·사진 뭐든!)'],thanks:['우와, 담이 친구 부자다!','내 용돈 뼈다귀 줄게!']};}},
  {giver:'coach',type:'trick',reward:30,xp:25,mk(){const ok=Object.keys(TRICKS).filter(k=>TRICKS[k].lv<=affLv());const tr=pick(ok);
    return{trick:tr,place:'town',title:`'${TRICKS[tr].name}' 보여주기`,ask:[`담이가 '${TRICKS[tr].name}' 하는 걸 보고 싶어요!`,'제 앞에서 담이에게 다가가 [행동]을 누르고 명령해 보세요. 실패해도 연습이에요!'],thanks:['잘했어요! 축제 장기자랑 기대할게요.','훈련 수당이에요~']};}},
  {giver:'mayor',type:'photo',reward:35,xp:25,mk(){const pl=pick(placesOpen(['park','summit','river','beach','meadow','mountain','camp']));
    return{place:pl,title:`${PLACES[pl].name} 사진 찍기`,ask:[`축제 포스터에 ${PLACES[pl].name} 사진을 넣고 싶은데…`,'그 구역 한가운데 명소 앞에서 담이랑 사진 한 장 부탁하네!'],thanks:['허허, 담이가 모델이구먼! 사진 잘 나왔네.','수고비라네.']};}}
];
function placesOpen(list){const o=list.filter(p=>PLACES[p].lv<=walkLv());return o.length?o:['park'];}
