#!/usr/bin/env python3
"""Create grey-cloud DNS for hooks.usil.app and a WAF skip for Moyasar paths.

Bot Fight Mode cannot be skipped with a WAF rule. Moyasar's servers hit
https://usil.app/api/payments/webhook and get cf-mitigated: challenge.
A DNS-only (proxied=false) hostname goes straight to origin/Caddy.

Usage (on a machine that has the token):
  CLOUDFLARE_API_TOKEN=... python3 scripts/connect-cloudflare.py
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

ZONE_NAME = os.environ.get("CLOUDFLARE_ZONE_NAME", "usil.app")
HOOKS_HOST = os.environ.get("MOYASAR_HOOKS_HOST", "hooks.usil.app")
ORIGIN_IP = os.environ.get("ORIGIN_IP", "8.213.85.166")
API = "https://api.cloudflare.com/client/v4"


def die(message: str, code: int = 1) -> None:
    print(message, file=sys.stderr)
    raise SystemExit(code)


def token() -> str:
    value = (os.environ.get("CLOUDFLARE_API_TOKEN") or os.environ.get("CF_API_TOKEN") or "").strip()
    if not value:
        die(
            "لا يوجد CLOUDFLARE_API_TOKEN.\n"
            "من لوحة Cloudflare: My Profile → API Tokens → Create Token\n"
            "صلاحيات: Zone.DNS Edit  (+ اختياري Zone.WAF Edit)\n"
            "Zone resources: Include → usil.app\n"
            "أو أضف يدوياً سجل A: hooks → "
            + ORIGIN_IP
            + " مع Proxy status = DNS only (رمادي)."
        )
    return value


def cf(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    url = API + path
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token()}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            payload = json.loads(res.read().decode("utf-8") or "{}")
            return res.status, payload
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"success": False, "errors": [{"message": raw[:400]}]}
        return err.code, payload


def cf_ok(method: str, path: str, body: dict | None = None) -> dict:
    status, payload = cf(method, path, body)
    if status >= 400 or not payload.get("success", status < 400):
        errors = payload.get("errors") or [{"message": f"HTTP {status}"}]
        die(f"Cloudflare HTTP {status}: {errors[0].get('message', errors[0])}")
    return payload


def zone_id() -> str:
    explicit = (os.environ.get("CLOUDFLARE_ZONE_ID") or "").strip()
    if explicit:
        return explicit
    payload = cf_ok("GET", "/zones?" + urllib.parse.urlencode({"name": ZONE_NAME}))
    rows = payload.get("result") or []
    if not rows:
        die(f"ما لقيت زون {ZONE_NAME} بهذا التوكن.")
    return str(rows[0]["id"])


def ensure_grey_dns(zid: str) -> str:
    name = HOOKS_HOST
    payload = cf_ok("GET", f"/zones/{zid}/dns_records?" + urllib.parse.urlencode({"name": name, "type": "A"}))
    rows = payload.get("result") or []
    body = {
        "type": "A",
        "name": name,
        "content": ORIGIN_IP,
        "proxied": False,
        "ttl": 60,
        "comment": "Moyasar webhooks — DNS only so Bot Fight Mode cannot challenge",
    }
    if not rows:
        created = cf_ok("POST", f"/zones/{zid}/dns_records", body)
        record_id = created["result"]["id"]
        print(f"أُنشئ سجل A {name} → {ORIGIN_IP} (DNS only).")
        return str(record_id)

    rec = rows[0]
    record_id = str(rec["id"])
    needs = rec.get("content") != ORIGIN_IP or rec.get("proxied") is True
    if needs:
        cf_ok("PATCH", f"/zones/{zid}/dns_records/{record_id}", body)
        print(f"حُدّث سجل A {name} → {ORIGIN_IP} (DNS only، كان proxied={rec.get('proxied')}).")
    else:
        print(f"سجل A {name} موجود مسبقاً: {ORIGIN_IP} DNS only.")
    return record_id


def ensure_waf_skip(zid: str) -> None:
    """Skip Super Bot Fight / BIC / managed rules on webhook paths.

    Does not disable Bot Fight Mode on Free. Grey-cloud DNS is the real bypass.
    """
    expression = (
        '(http.request.uri.path eq "/api/payments/webhook") or '
        '(http.request.uri.path eq "/api/payments/moyasar/callback")'
    )
    description = "Usil Moyasar webhooks skip"
    status, entry = cf("GET", f"/zones/{zid}/rulesets/phases/http_request_firewall_custom/entrypoint")
    rules = (entry.get("result") or {}).get("rules") or []
    if status >= 400 and status != 404:
        errors = entry.get("errors") or [{"message": f"HTTP {status}"}]
        print(f"تخطيت قاعدة WAF: {errors[0].get('message', errors[0])}")
        return
    if any(description in str(rule.get("description") or "") for rule in rules):
        print("قاعدة WAF لتخطي ويبهوك ميسر موجودة.")
        return

    body = {
        "description": description,
        "expression": expression,
        "action": "skip",
        "enabled": True,
        "action_parameters": {
            "phases": [
                "http_ratelimit",
                "http_request_firewall_managed",
                "http_request_sbfm",
            ],
            "products": ["bic", "hot", "securityLevel", "uaBlock", "waf", "zoneLockdown"],
        },
    }
    status, created = cf(
        "POST",
        f"/zones/{zid}/rulesets/phases/http_request_firewall_custom/entrypoint/rules",
        body,
    )
    if status >= 400:
        errors = created.get("errors") or [{"message": f"HTTP {status}"}]
        print(f"ما قدرت أضيف قاعدة WAF (اختياري، Bot Fight ما ينتخطى بها): {errors[0].get('message', errors[0])}")
        return
    print("أُضيفت قاعدة WAF: تخطي التحدي على مسارات دفع ميسر.")


def main() -> None:
    zid = zone_id()
    print(f"Zone {ZONE_NAME} = {zid}")
    ensure_grey_dns(zid)
    ensure_waf_skip(zid)
    print(f"ويبهوك ميسر: https://{HOOKS_HOST}/api/payments/webhook")
    print("بعد انتشار DNS: تأكد أن السحابة رمادية (DNS only) وليست برتقالية.")


if __name__ == "__main__":
    main()
