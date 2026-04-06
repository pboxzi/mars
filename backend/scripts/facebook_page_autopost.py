import argparse
import json
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests


DEFAULT_GRAPH_VERSION = os.environ.get("META_GRAPH_VERSION", "v23.0").strip() or "v23.0"
DEFAULT_CONTENT_FILE = Path(__file__).resolve().parents[2] / "automation" / "facebook-posts.json"


@dataclass
class FacebookPost:
    message: str
    link: str = ""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Publish a rotating Facebook Page post using the Meta Graph API."
    )
    parser.add_argument("--page-id", default=os.environ.get("META_PAGE_ID", "").strip())
    parser.add_argument(
        "--page-access-token",
        default=os.environ.get("META_PAGE_ACCESS_TOKEN", "").strip(),
    )
    parser.add_argument("--site-url", default=os.environ.get("SITE_URL", "").strip())
    parser.add_argument("--message", default="")
    parser.add_argument("--link", default="")
    parser.add_argument("--content-file", default=str(DEFAULT_CONTENT_FILE))
    parser.add_argument(
        "--selection-strategy",
        choices=["day", "index"],
        default="day",
        help="Choose posts by UTC day rotation or an explicit index.",
    )
    parser.add_argument(
        "--index",
        type=int,
        default=None,
        help="Zero-based post index to publish when using --selection-strategy index.",
    )
    parser.add_argument("--graph-version", default=DEFAULT_GRAPH_VERSION)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def normalize_site_url(value: str) -> str:
    return value.strip().rstrip("/")


def render_template(value: str, *, site_url: str) -> str:
    now = datetime.now(timezone.utc)
    context = {
        "site_url": normalize_site_url(site_url),
        "tour_url": f"{normalize_site_url(site_url)}/tour" if site_url else "",
        "today": now.strftime("%B %d, %Y"),
        "weekday": now.strftime("%A"),
    }
    return value.format(**context).strip()


def load_posts(content_file: str, *, site_url: str) -> list[FacebookPost]:
    path = Path(content_file)
    if not path.exists():
        raise FileNotFoundError(f"Content file not found: {path}")

    raw = json.loads(path.read_text(encoding="utf-8"))
    entries: list[dict[str, Any]]
    if isinstance(raw, list):
        entries = raw
    else:
        entries = raw.get("posts", [])

    posts: list[FacebookPost] = []
    for entry in entries:
        if not isinstance(entry, dict):
            continue

        message = render_template(str(entry.get("message", "")), site_url=site_url)
        link = render_template(str(entry.get("link", "")), site_url=site_url)
        if message:
            posts.append(FacebookPost(message=message, link=link))

    if not posts:
        raise ValueError(f"No valid posts found in {path}")

    return posts


def choose_post(posts: list[FacebookPost], *, strategy: str, index: int | None) -> FacebookPost:
    if strategy == "index":
        if index is None:
            raise ValueError("--index is required when --selection-strategy index is used")
        if index < 0 or index >= len(posts):
            raise IndexError(f"--index must be between 0 and {len(posts) - 1}")
        return posts[index]

    rotation_index = datetime.now(timezone.utc).toordinal() % len(posts)
    return posts[rotation_index]


def build_post(args: argparse.Namespace) -> FacebookPost:
    site_url = normalize_site_url(args.site_url)
    if args.message:
        return FacebookPost(
            message=render_template(args.message, site_url=site_url),
            link=render_template(args.link, site_url=site_url),
        )

    posts = load_posts(args.content_file, site_url=site_url)
    return choose_post(posts, strategy=args.selection_strategy, index=args.index)


def publish_post(
    *,
    graph_version: str,
    page_id: str,
    page_access_token: str,
    post: FacebookPost,
) -> dict[str, Any]:
    if not page_id:
        raise ValueError("META_PAGE_ID is required")
    if not page_access_token:
        raise ValueError("META_PAGE_ACCESS_TOKEN is required")

    endpoint = f"https://graph.facebook.com/{graph_version}/{page_id}/feed"
    payload = {
        "message": post.message,
        "access_token": page_access_token,
    }
    if post.link:
        payload["link"] = post.link

    response = requests.post(endpoint, data=payload, timeout=30)
    response.raise_for_status()
    return response.json()


def main() -> int:
    args = parse_args()
    try:
        post = build_post(args)
    except Exception as exc:
        print(f"[facebook-autopost] Failed to build post: {exc}", file=sys.stderr)
        return 1

    preview = {
        "message": post.message,
        "link": post.link,
        "graph_version": args.graph_version,
        "page_id": args.page_id,
        "dry_run": args.dry_run,
    }

    if args.dry_run:
        print(json.dumps(preview, indent=2))
        return 0

    try:
        result = publish_post(
            graph_version=args.graph_version,
            page_id=args.page_id,
            page_access_token=args.page_access_token,
            post=post,
        )
    except requests.HTTPError as exc:
        body = exc.response.text if exc.response is not None else str(exc)
        print(f"[facebook-autopost] Meta API error: {body}", file=sys.stderr)
        return 1
    except Exception as exc:
        print(f"[facebook-autopost] Failed to publish: {exc}", file=sys.stderr)
        return 1

    print(json.dumps({"preview": preview, "result": result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
