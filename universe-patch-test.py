"""Verify apply-v6.py: current Universe is a no-op; legacy mismatches do not write."""
from pathlib import Path
import hashlib
import runpy
import shutil
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
SCRIPT = ROOT / "apply-v6.py"
definition = runpy.run_path(str(SCRIPT))
def digest(directory, filenames):
    return {name: hashlib.sha256((directory / name).read_bytes()).hexdigest() for name in filenames}
def run(directory):
    return subprocess.run([sys.executable, str(SCRIPT)], cwd=directory, text=True, capture_output=True)

with tempfile.TemporaryDirectory() as folder:
    work = Path(folder)
    names = ["index.html", "universe.css", "sw.js"]
    for name in names:
        shutil.copy2(ROOT / name, work / name)
    before = digest(work, names)
    result = run(work)
    assert result.returncode == 0, result.stderr
    assert digest(work, names) == before, "Current Universe must not be overwritten"
    assert not (work / "CHANGELOG.md").exists(), "No-op must not replace the changelog"
    (work / "universe.css").write_text("", encoding="utf-8")
    incomplete = digest(work, names)
    result = run(work)
    assert result.returncode != 0, "An incomplete Universe integration must be rejected"
    assert digest(work, names) == incomplete, "Rejected patch must not write"

legacy_index = "\n".join(old for old, _, count in definition["INDEX"] for _ in range(count))
legacy_sw = definition["SW"][0][0]
with tempfile.TemporaryDirectory() as folder:
    work = Path(folder)
    (work / "index.html").write_text(legacy_index, encoding="utf-8")
    (work / "sw.js").write_text(legacy_sw, encoding="utf-8")
    result = run(work)
    assert result.returncode == 0, result.stderr
    patched = (work / "index.html").read_text(encoding="utf-8")
    assert "Nur exakte Treffer" in patched and "Dark Mode" in patched
    assert (work / "CHANGELOG.md").exists()
    (work / "index.html").write_text(legacy_index, encoding="utf-8")
    (work / "sw.js").write_text("unknown-cache", encoding="utf-8")
    before = digest(work, ["index.html", "sw.js", "CHANGELOG.md"])
    result = run(work)
    assert result.returncode != 0
    assert digest(work, ["index.html", "sw.js", "CHANGELOG.md"]) == before, "Bad cache anchor must not partially write"

print("Patch compatibility: Universe no-op, incomplete integration rejection, legacy upgrade and no partial writes passed")
