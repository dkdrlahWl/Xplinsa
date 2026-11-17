#!/bin/bash
# XP 캠프 서버 설치/업데이트 (Ubuntu). 사용: curl -fsSL https://raw.githubusercontent.com/dkdrlahWl/Xplinsa/main/setup.sh | sudo bash
set -e
export DEBIAN_FRONTEND=noninteractive
if ! command -v node >/dev/null || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt 18 ]; then
  apt-get update -y && apt-get install -y nodejs git
fi
command -v git >/dev/null || apt-get install -y git
if [ -d /opt/xplinsa/.git ]; then
  git -C /opt/xplinsa fetch --depth 1 origin main && git -C /opt/xplinsa reset --hard origin/main
else
  git clone --depth 1 https://github.com/dkdrlahWl/Xplinsa.git /opt/xplinsa
fi
cat > /etc/systemd/system/xplinsa.service <<'S'
[Unit]
Description=XP Camp game server
After=network.target
[Service]
WorkingDirectory=/opt/xplinsa
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=80
[Install]
WantedBy=multi-user.target
S
# 자동 업데이트: 1분마다 GitHub main 확인, 바뀌었으면 받아서 재시작
cat > /opt/xplinsa-update.sh <<'U'
#!/bin/bash
cd /opt/xplinsa || exit 0
git fetch -q --depth 1 origin main || exit 0
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  git reset -q --hard origin/main && systemctl restart xplinsa
fi
U
chmod +x /opt/xplinsa-update.sh
echo '* * * * * root /opt/xplinsa-update.sh >/dev/null 2>&1' > /etc/cron.d/xplinsa-update
chmod 644 /etc/cron.d/xplinsa-update
systemctl daemon-reload
systemctl enable xplinsa >/dev/null 2>&1
systemctl restart xplinsa
sleep 1
systemctl is-active xplinsa && echo "완료! 주소: http://$(curl -s ifconfig.me 2>/dev/null || hostname -I | cut -d' ' -f1)"
