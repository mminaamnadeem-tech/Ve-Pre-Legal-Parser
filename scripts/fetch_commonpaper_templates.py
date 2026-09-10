"""Download Common Paper legal markdown templates into templates/."""

from __future__ import annotations

import json
import re
import urllib.error
import urllib.request
from pathlib import Path

ORG = "CommonPaper"
HEADERS = {"User-Agent": "Pre-Legal-Parser/1.0"}
ROOT = Path(__file__).resolve().parent.parent
TEMPLATES_DIR = ROOT / "templates"
CATALOG_PATH = ROOT / "catalog.json"

# Repos that are not legal agreement template sources.
SKIP_REPOS = {
    "docs",
    "iso_country_codes",
    "sablon",
    "claude-skill",
    "story-prompt",
    "indefinite_article",
}


def api_get(url: str) -> object:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download_text(url: str) -> str:
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8")


def list_repos() -> list[str]:
    repos = api_get(f"https://api.github.com/orgs/{ORG}/repos?per_page=100")
    return [repo["name"] for repo in repos]


def list_repo_tree(repo: str) -> list[dict]:
    for branch in ("main", "master"):
        try:
            tree = api_get(
                f"https://api.github.com/repos/{ORG}/{repo}/git/trees/{branch}?recursive=1"
            )
            return tree.get("tree", [])
        except urllib.error.HTTPError:
            continue
    return []


def is_template_markdown(path: str) -> bool:
    if not path.lower().endswith(".md"):
        return False
    name = Path(path).name.lower()
    if name == "readme.md":
        return False
    return True


def extract_title(content: str, fallback: str) -> str:
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("# "):
            return line[2:].strip()
    return fallback


def strip_markup(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\*\*", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_description(content: str) -> str:
    lines = content.splitlines()
    body: list[str] = []
    past_title = False
    for line in lines:
        stripped = line.strip()
        if not past_title:
            if stripped.startswith("# "):
                past_title = True
            continue
        if stripped.startswith("#"):
            break
        if stripped:
            body.append(strip_markup(stripped))
    return " ".join(body)[:500] if body else ""


def safe_filename(repo: str, path: str) -> str:
    base = Path(path).name
    if base.lower() == f"{repo.lower()}.md" or base.lower().startswith(repo.lower()):
        return base
    return f"{repo}-{base}"


def main() -> None:
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    catalog: list[dict] = []

    for repo in sorted(list_repos()):
        if repo in SKIP_REPOS:
            continue

        readme_desc = ""
        try:
            readme = download_text(
                f"https://raw.githubusercontent.com/{ORG}/{repo}/main/README.md"
            )
            readme_desc = extract_description(readme)
        except urllib.error.HTTPError:
            try:
                readme = download_text(
                    f"https://raw.githubusercontent.com/{ORG}/{repo}/master/README.md"
                )
                readme_desc = extract_description(readme)
            except urllib.error.HTTPError:
                pass

        for item in list_repo_tree(repo):
            path = item.get("path", "")
            if item.get("type") != "blob" or not is_template_markdown(path):
                continue

            filename = safe_filename(repo, path)
            dest = TEMPLATES_DIR / filename
            branch = "main"
            raw_url = f"https://raw.githubusercontent.com/{ORG}/{repo}/{branch}/{path}"
            try:
                content = download_text(raw_url)
            except urllib.error.HTTPError:
                branch = "master"
                raw_url = f"https://raw.githubusercontent.com/{ORG}/{repo}/{branch}/{path}"
                content = download_text(raw_url)

            dest.write_text(content, encoding="utf-8")

            fallback_name = re.sub(r"[-_]", " ", Path(filename).stem).title()
            title = extract_title(content, fallback_name)
            description = extract_description(content) or readme_desc or f"Common Paper {repo} template."

            catalog.append(
                {
                    "name": title,
                    "description": description,
                    "filename": filename,
                }
            )
            print(f"Saved {filename} from {ORG}/{repo}/{path}")

    catalog.sort(key=lambda item: item["name"].lower())
    CATALOG_PATH.write_text(json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nWrote {len(catalog)} templates to {TEMPLATES_DIR}")
    print(f"Catalog written to {CATALOG_PATH}")


if __name__ == "__main__":
    main()
