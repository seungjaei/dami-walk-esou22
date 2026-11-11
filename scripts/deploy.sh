#!/bin/bash
# ===== 담이 산책 일기 올리기 (접속한 사람에게 '업데이트 중' 알리고 배포) =====
# 순서
#  ① 지금 사이트 위에 '업데이트 중' 신호(update-status.txt=updating)만 먼저 배포
#     → 접속한 사람은 하던 행동이 끝나면 저장되고 「업데이트 중입니다」 화면이 뜬다
#  ② 내 컴퓨터의 새 커밋들 + 'ok' 신호를 배포
#     → 새 버전이 뜨면 접속한 사람 화면이 자동으로 첫 화면으로 다시 열린다
# 사용: bash scripts/deploy.sh   (커밋이 다 된 상태에서, main 브랜치에서)
set -euo pipefail
cd "$(dirname "$0")/.."

[ "$(git rev-parse --abbrev-ref HEAD)" = "main" ] || { echo "main 브랜치에서 실행해 주세요"; exit 1; }
[ -z "$(git status --porcelain -- . ':!update-status.txt')" ] || { echo "커밋 안 된 변경이 있어요. 먼저 커밋해 주세요"; exit 1; }

wait_pages() { # $1 = 배포할 커밋
  local sha="$1" id=""
  for i in $(seq 1 30); do
    id=$(gh run list --workflow pages.yml --limit 5 --json databaseId,headSha -q ".[] | select(.headSha==\"$sha\") | .databaseId" | head -1)
    [ -n "$id" ] && break; sleep 4
  done
  [ -n "$id" ] || { echo "배포 작업을 못 찾았어요"; exit 1; }
  gh run watch "$id" --exit-status >/dev/null && echo "  배포 완료 ($id)"
}

git fetch -q origin main
BASE=$(git rev-parse origin/main)

echo "① '업데이트 중' 신호 배포"
TMPIDX="$(git rev-parse --git-dir)/deploy-index"
rm -f "$TMPIDX"
GIT_INDEX_FILE="$TMPIDX" git read-tree "$BASE"
BLOB=$(printf 'updating\n' | git hash-object -w --stdin)
GIT_INDEX_FILE="$TMPIDX" git update-index --add --cacheinfo 100644,"$BLOB",update-status.txt
TREE=$(GIT_INDEX_FILE="$TMPIDX" git write-tree)
rm -f "$TMPIDX"
SIG=$(git commit-tree "$TREE" -p "$BASE" -m "점검 시작: 접속자에게 업데이트 중 알림")
git push -q origin "$SIG":refs/heads/main
wait_pages "$SIG"
echo "  접속한 사람들이 하던 일을 마치도록 30초 기다려요"; sleep 30

echo "② 새 버전 배포"
git rebase -q -X theirs "$SIG"   # 신호 파일이 겹치면 내 쪽(ok)으로
printf 'ok\n' > update-status.txt
git add update-status.txt
git diff --cached --quiet || git commit -q -m "점검 끝: 새 버전 배포"
git push -q origin main
wait_pages "$(git rev-parse HEAD)"
echo "완료! 접속한 사람 화면은 곧 첫 화면으로 다시 열려요."
