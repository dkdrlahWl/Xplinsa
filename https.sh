#!/bin/bash
# 링구 HERO https 켜기 (Caddy 자동 인증서)
# 사용: curl -fsSL https://raw.githubusercontent.com/dkdrlahWl/Xplinsa/main/https.sh | sudo bash -s 내이름.duckdns.org
set -e
DOMAIN="$1"
if [ -z "$DOMAIN" ]; then echo "도메인을 넣어줘: ... | sudo bash -s linggu.duckdns.org"; exit 1; fi
export DEBIAN_FRONTEND=noninteractive
IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | cut -d' ' -f1)
DNS=$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)
if [ "$DNS" != "$IP" ]; then echo "주의: $DOMAIN 이 지금 '$DNS'(으)로 연결돼 있어. 서버 IP는 $IP 야. DuckDNS에서 IP 확인하고 1~2분 뒤 다시 해줘."; exit 1; fi

# 1) 게임 서버를 3000번 포트로 옮김 (setup.sh 다시 돌려도 유지되도록 drop-in 사용)
mkdir -p /etc/systemd/system/xplinsa.service.d
printf '[Service]\nEnvironment=PORT=3000\n' > /etc/systemd/system/xplinsa.service.d/port.conf
systemctl daemon-reload
systemctl restart xplinsa

# 2) Caddy 설치
if ! command -v caddy >/dev/null; then
  apt-get update -y && apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update -y && apt-get install -y caddy
fi

# 3) 설정: 도메인은 https, 예전 IP 주소(http)도 계속 접속 가능
cat > /etc/caddy/Caddyfile <<C
$DOMAIN {
	reverse_proxy localhost:3000
}
http://$IP {
	reverse_proxy localhost:3000
}
C
systemctl enable caddy >/dev/null 2>&1
systemctl restart caddy
sleep 4
if curl -fsS -o /dev/null "https://$DOMAIN/game.html"; then
  echo "완료! https://$DOMAIN/game.html"
else
  echo "인증서 받는 중이거나 443 포트가 막혀 있어. Lightsail 콘솔 > 네트워킹 > 방화벽에 HTTPS(443) 추가했는지 확인하고 1분 뒤 주소 열어봐: https://$DOMAIN/game.html"
fi
