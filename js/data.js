"use strict";
// ===== 게임 데이터 (장소·주민·친구 강아지·퀘스트·상점·보물) =====

const PLACES={
  town:{name:'우리 마을',lv:1,x:84,y:118,desc:'집과 이웃들이 있는 마을'},
  park:{name:'호수 공원',theme:'park',lv:1,x:204,y:78,desc:'오리와 분수대가 있는 공원'},
  market:{name:'골목길',theme:'street',lv:1,x:196,y:158,desc:'비둘기가 많은 동네 골목'},
  mountain:{name:'뒷산 숲길',theme:'mountain',lv:2,x:336,y:58,desc:'버섯과 그루터기가 많은 숲'},
  river:{name:'강변 산책길',theme:'river',lv:3,x:346,y:146,desc:'반짝이는 강과 갈대밭'}
};
const PLACE_ORDER=['town','park','market','mountain','river'];

// 사람 외형: style long/short/bun/pony/cap/kid
const GIRL={skin:'#f8dcc2',hair:'#1c1820',hairL:'#4a4250',style:'long',glasses:'#141014',top:'#c9b6e4',topD:'#b29fd0',bottom:'#3e4a6b',skirt:true,sock:'#ffffff',shoe:'#7a4a2a',collar:'#ffffff'};
const NPCS={
  grandma:{name:'복순 할머니',home:'grandma',P:{skin:'#f3d2b4',hair:'#d8d4cc',hairL:'#f0eee8',style:'bun',top:'#b07aa1',topD:'#94628a',bottom:'#6a5a7a',skirt:true,glasses:'#8a6a4a'},
    idle:['담이는 볼 때마다 크는구나.','할머니 젊었을 땐 진돗개를 키웠단다.','산책 다녀오면 물 꼭 챙겨 주렴.']},
  baker:{name:'제빵사 민수',home:'bakery',P:{skin:'#f1c9a0',hair:'#5a3a2a',style:'cap',hat:'#ffffff',top:'#ffffff',topD:'#e8e8e8',apron:'#e8b26a',bottom:'#5b5a7a'},
    idle:['오늘 크루아상이 아주 잘 구워졌어!','강아지는 빵 먹으면 안 돼~ 담이 미안!','아침 빵 냄새 좋지?']},
  florist:{name:'꽃집 하린',home:'florist',P:{skin:'#f8dcc2',hair:'#d9773a',hairL:'#f0a060',style:'short',top:'#9cc3a6',topD:'#86ad90',apron:'#efe2c8',bottom:'#6b5a4a',skirt:true},
    idle:['담이 털 색이랑 어울리는 꽃이 있어요!','들꽃은 산책길에 제일 예쁘게 펴요.','꽃집 앞에서 담이가 자꾸 킁킁해요.']},
  shop:{name:'펫샵 지호',home:'petshop',P:{skin:'#f1c9a0',hair:'#2b2b33',style:'short',top:'#5aa9e6',topD:'#4a92cc',apron:'#f7d64a',bottom:'#3b3b4a'},shop:true,
    idle:['어서 오세요, 멍멍 펫샵입니다!','새로 들어온 리본 보셨어요?']},
  kid:{name:'도윤',home:'kid',P:{skin:'#f8dcc2',hair:'#3b2a20',style:'kid',top:'#ef6f7c',topD:'#d85a68',bottom:'#4f7ab8',kid:true},
    idle:['나도 강아지 키우고 싶다~','담이야 하이파이브!','엄마가 강아지는 크면 키우재.']},
  coach:{name:'코치 은비',home:'coach',P:{skin:'#efc49a',hair:'#5a3a2a',style:'pony',top:'#7cc36a',topD:'#68ad58',bottom:'#3b3b4a'},
    idle:['훈련은 짧게, 칭찬은 크게!','실패해도 괜찮아요. 담이는 매일 늘고 있어요.','축제 장기자랑, 기대돼요!']},
  mayor:{name:'이장님',home:'mayor',P:{skin:'#efc49a',hair:'#9a9a9a',hairL:'#c8c8c8',style:'short',top:'#8a6a4a',topD:'#74583c',bottom:'#4a4a4a',glasses:'#333333'},
    idle:['마을 강아지 축제 준비로 바쁘구먼.','담이도 축제에 나오는 거지?','허허, 오늘 날씨 좋구먼.']}
};
// 친구 강아지 (산책하다 만나는 이웃 강아지)
const WALKERS=[
  {id:'kong',dog:'콩이',breed:'포메라니안',owner:'지수',P:{hair:'#7a4a2a',style:'long',top:'#f7d64a',topD:'#e0c040',bottom:'#3e4a6b',skirt:true},D:{C:'#f2a65a',D:'#d8843a',L:'#ffd6a0',OL:'#6b3a1a',EAR:'#d8843a',ear:'point',curly:false}},
  {id:'som',dog:'솜이',breed:'비숑',owner:'영철 할아버지',P:{hair:'#cfcfcf',style:'short',top:'#6a8fbf',topD:'#5a7aa8',bottom:'#4a4a4a',glasses:'#555'},D:{C:'#ffffff',D:'#e6e6ee',L:'#ffffff',OL:'#7a7a88',EAR:'#ececf2',ear:'flop',curly:true}},
  {id:'dan',dog:'단풍',breed:'시바견',owner:'준호',P:{hair:'#2b2b2b',style:'short',top:'#e07a5f',topD:'#c86a50',bottom:'#3b3b4a'},D:{C:'#e0954a',D:'#c27a35',L:'#fff2dc',OL:'#5a3418',EAR:'#c27a35',ear:'point',mask:true}},
  {id:'choco',dog:'초코',breed:'토이푸들',owner:'서연',P:{hair:'#5a3a2a',style:'pony',top:'#f2b8c6',topD:'#dca0b0',bottom:'#6b5a8a',skirt:true},D:{C:'#8a5a3a',D:'#6e4428',L:'#b08060',OL:'#3a2214',EAR:'#6e4428',ear:'flop',curly:true}},
  {id:'sik',dog:'식빵',breed:'웰시코기',owner:'민아',P:{hair:'#c08040',style:'bun',top:'#7cc3c0',topD:'#68aca9',bottom:'#4a4a5a'},D:{C:'#e8a050',D:'#c98538',L:'#fff6e8',OL:'#5a3418',EAR:'#c98538',ear:'point',short:true,mask:true}},
  {id:'bori',dog:'보리',breed:'말티즈',owner:'수아',P:{hair:'#3a2a2a',style:'long',top:'#ffffff',topD:'#e6e6e6',bottom:'#c84a5a',skirt:true},D:{C:'#fbfbf7',D:'#e8e8e2',L:'#ffffff',OL:'#7a7a80',EAR:'#f0f0ea',ear:'flop',curly:false}}
];
// 담이: 아기 말티푸 (크림 곱슬털)
const DAMI_P={s:1,C:'#f9edda',D:'#ecd4ae',L:'#fffbf2',OL:'#7a5c44',EAR:'#e8c99c',ear:'flop',curly:true,vest:true,V:'#ffffff',VS:'#dbe2ee',H:'#ee8f3a',K:'#1e1512',blush:'#f6b0bc'};
const BIGDOGS=[{C:'#e2b06a',D:'#c99350',L:'#f3d9a8',OL:'#6b4a2a',EAR:'#c99350',ear:'flop',band:'#5aa9e6'},{C:'#3d3836',D:'#2a2624',L:'#615a56',OL:'#121012',EAR:'#2a2624',ear:'flop',band:'#ef6f7c'},{C:'#f4f2ec',D:'#dcd8cc',L:'#ffffff',OL:'#6b6458',EAR:'#dcd8cc',ear:'point',band:'#7cc36a'}];

// 재주
const TRICKS={sit:{name:'앉아',lv:1,pose:'sit'},paw:{name:'손',lv:2,pose:'paw'},down:{name:'엎드려',lv:3,pose:'lie'},bang:{name:'빵야!',lv:4,pose:'roll'}};
// 꾸미기
const ACCS={ribbon:{name:'빨간 리본',price:40},flower:{name:'꽃핀',price:45},bandana:{name:'하늘 반다나',price:55},hat:{name:'밀짚모자',price:70},star:{name:'별 머리핀',price:90,lv:3}};
// 상점
const SHOP=[
  {id:'kibble',name:'사료 5번분',price:20,desc:'담이 밥그릇에 채워 줘요'},
  {id:'treat',name:'간식 5개',price:15,desc:'재주 성공률이 잠깐 올라가요'},
  ...Object.entries(ACCS).map(([id,a])=>({id,name:a.name,price:a.price,acc:true,lv:a.lv||1,desc:'담이 꾸미기 (옷장에서 착용)'}))
];
// 담이가 땅 파서 찾는 보물 (수집)
const TREASURES={
  coin:{name:'옛날 동전',coin:15},marble:{name:'반짝 구슬'},key:{name:'낡은 열쇠'},bone:{name:'공룡뼈 장난감'},
  shell:{name:'예쁜 조개'},acorn:{name:'도토리 왕관'},star:{name:'별모양 돌'},ball:{name:'잃어버린 테니스공'}
};
const DIG_TABLE={park:['coin','marble','ball','coin'],market:['coin','key','marble','coin'],mountain:['acorn','bone','star','coin'],river:['shell','star','marble','coin'],town:['coin','ball']};

// 레벨 (산책 레벨: 장소 해금 / 우정 레벨: 재주 해금)
const XP_NEED=lv=>40+lv*30;
const AFF_NEED=lv=>20+lv*15;
const FESTIVAL_DAY=10;

// 퀘스트 템플릿
const QDEF=[
  {giver:'grandma',type:'find',reward:40,xp:25,mk(){const it=pick(['꽃무늬 손수건','돋보기 안경','털실 뭉치']);const pl=pick(placesOpen(['park','market','mountain','river']));
    return{item:it,place:pl,title:`${it} 찾기`,ask:[`아이고, 어제 ${PLACES[pl].name}에서 ${it}을(를) 잃어버렸단다.`,'담이 코라면 금방 찾을 것 같은데… 부탁해도 될까?'],thanks:['어머나, 정말 찾아왔구나! 담이 코가 최고야.','고마워서 그래, 이거 받아 가렴.']};}},
  {giver:'baker',type:'deliver',reward:35,xp:20,mk(){const pl=pick(placesOpen(['park','market','mountain','river']));const to=pick(['산책하는 미나 씨','등산객 할아버지','벤치의 태오 씨']);
    return{item:'빵 바구니',to,place:pl,title:`${PLACES[pl].name}에 빵 배달`,ask:[`${PLACES[pl].name}에 있는 ${to}께 빵 바구니 좀 전해 줄래?`,'담이가 냄새 맡고 먹으면 안 된다~ 하하!'],thanks:['배달 고마워! 손님이 아주 좋아했대.','담이 간식도 두 개 넣었어!'],bonusTreat:2};}},
  {giver:'florist',type:'collect',reward:30,xp:20,mk(){const pl=pick(placesOpen(['park','mountain','river']));const it={park:'민들레',mountain:'들꽃',river:'갈대꽃'}[pl];
    return{item:it,n:3,place:pl,title:`${it} 3송이 모으기`,ask:[`${PLACES[pl].name}에 ${it}이(가) 한창이래요.`,'꽃다발에 쓰고 싶은데 3송이만 모아다 줄래요?'],thanks:['와, 너무 예쁘다! 고마워요.','담이한테 어울릴 꽃핀도 같이 줄게요!'],acc:'flower'};}},
  {giver:'kid',type:'play',reward:25,xp:20,mk(){return{n:2,place:null,title:'친구 강아지랑 2번 놀기',ask:['담이도 친구가 많으면 좋겠다!','산책하다 만나는 강아지들이랑 2번 놀아 줘!'],thanks:['우와, 담이 친구 부자다!','내 용돈 코인 줄게!']};}},
  {giver:'coach',type:'trick',reward:30,xp:25,mk(){const ok=Object.keys(TRICKS).filter(k=>TRICKS[k].lv<=affLv());const tr=pick(ok);
    return{trick:tr,place:'town',title:`'${TRICKS[tr].name}' 보여주기`,ask:[`담이가 '${TRICKS[tr].name}' 하는 걸 보고 싶어요!`,'제 앞에서 담이에게 다가가 [행동]을 누르고 명령해 보세요. 실패해도 연습이에요!'],thanks:['잘했어요! 축제 장기자랑 기대할게요.','훈련 수당이에요~']};}},
  {giver:'mayor',type:'photo',reward:35,xp:25,mk(){const pl=pick(placesOpen(['park','mountain','river','market']));
    return{place:pl,title:`${PLACES[pl].name} 사진 찍기`,ask:[`축제 포스터에 ${PLACES[pl].name} 사진을 넣고 싶은데…`,'산책 코스 끝 전망 좋은 곳에서 담이랑 사진 한 장 부탁하네!'],thanks:['허허, 담이가 모델이구먼! 사진 잘 나왔네.','수고비라네.']};}}
];
function placesOpen(list){const o=list.filter(p=>PLACES[p].lv<=walkLv());return o.length?o:['park'];}
