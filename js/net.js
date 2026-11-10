"use strict";
// ===== 멀티플레이 연결 자리 (아직 꺼져 있음) =====
// 나중에 2인 플레이를 붙일 때 쓰는 자리다. 지금은 아무것도 보내지 않는다.
//
// 계획 (GitHub Pages + Supabase):
//  1) 게임 파일은 GitHub Pages에 그대로 올린다 (정적 파일이라 빌드 필요 없음).
//  2) Supabase 프로젝트를 만들고, 공개용 anon 키와 URL만 아래 NET_CONFIG에 넣는다.
//     (서비스 키·비밀번호는 절대 여기에 넣지 않는다. anon 키는 공개돼도 되는 키이며, 테이블 보호는 RLS 정책으로 한다.)
//  3) 실시간 위치·말풍선 공유 = Supabase Realtime 채널(broadcast/presence)
//     - 방 이름: 'dami-room-<초대코드>'
//     - 보내는 것: {id, area, x, y, dir, damiX, damiY, pose, eq} 초당 6~10번
//  4) 저장 = Supabase 테이블 'saves'(user_id, data jsonb). SV 객체를 그대로 저장/불러오기.
//  5) 함께 하는 것(예정): 같은 마을에서 만나기, 서로의 강아지와 놀기(친구 도감 공유), 같이 퀘스트 하기.
const NET_CONFIG={enabled:false,supabaseUrl:'',anonKey:''};
const NET={
  peers:{},                       // 다른 플레이어 상태 (그리기용)
  connect(room){if(!NET_CONFIG.enabled)return false;/* TODO: supabase-js 로드 후 채널 구독 */return false;},
  sendState(){if(!NET_CONFIG.enabled||!G)return;/* TODO: broadcast {area,x,y,...} */},
  saveCloud(){if(!NET_CONFIG.enabled)return;/* TODO: upsert saves */}
};
