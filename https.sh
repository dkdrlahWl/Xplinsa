#!/bin/bash
# 링구 HERO https 켜기 (Caddy 자동 인증서)
# 사용: curl -fsSL https://raw.githubusercontent.com/dkdrlahWl/Xplinsa/main/https.sh | sudo bash -s 내이름.duckdns.org
set -e
DOMAIN="$1"
if [ -z "$DOMAIN" ]; then echo "usage: ... | sudo bash -s NAME.duckdns.org"; exit 1; fi
export DEBIAN_FRONTEND=noninteractive
IP=$(curl -4 -s ifconfig.me 2>/dev/null || hostname -I | cut -d' ' -f1)
DNS=$(getent ahostsv4 "$DOMAIN" | awk '{print $1}' | head -1)
if [ "$DNS" != "$IP" ]; then echo "STOP: $DOMAIN -> '$DNS' but server IP is $IP. Set IPv4 in DuckDNS, wait 1-2 min, retry."; exit 1; fi

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
  echo "DONE! https://$DOMAIN/game.html"
else
  echo "Certificate pending or port 443 closed. Wait 1 min and open https://$DOMAIN/game.html"
fi
