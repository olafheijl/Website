"""Build a static demo from public/, without shipping backend or development files."""

import argparse
from pathlib import Path
import shutil


def main():
    parser = argparse.ArgumentParser(description="Maak de GitHub Pages-demo.")
    parser.add_argument("--output", default="_site", help="Nieuwe uitvoermap (standaard: _site)")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    output = Path(args.output).resolve()
    # copytree refuses existing output rather than deleting user files.
    shutil.copytree(root / "public", output)
    page = output / "pages" / "multiplayer.html"
    html = page.read_text(encoding="utf-8")
    html = html.replace("<head>", '<head>\n    <meta name="static-demo" content="true" />', 1)
    page.write_text(html, encoding="utf-8")
    (output / ".nojekyll").touch()
    print(f"Statische demo gemaakt in {output}")


if __name__ == "__main__":
    main()
